---
layout: postlayout
title: Nginx源码：利用C语言tricky构建函数链
categories: [c-cpp]
tags: [nginx,web-server,compiler,CPP]
---

最近开始使用Nginx的第三方扩展解决实际的问题，对Nginx的扩展开发产生了一些兴趣，在阅读第三方代码时产生了一些心得和体会。本文详细分析了进行Nginx过滤器开发的时候，Nginx提供的注册过滤器的精妙机制。参考[Nginx开发从入门到精通-过滤模块](http://tengine.taobao.org/book/chapter_04.html)


## 过滤模块简介 ##

Nginx本身就是模块化的设计，在处理HTTP请求的过程中，就是由各种不同的模块在不同的时机参与处理请求和回发响应。模块就像流水线上的工人一样，在特定的位置做特定的事情，如果想要对请求做新的处理，只需要添加新的工人。工人处理完自己的工作后，就交给下一个工人处理，直到全部处理完。过滤模块是一类模块，它们即可以处理请求头部，也可以处理请求体。

Nginx的另一个特点是，所有的模块都是通过编译，直接生成在Nginx的可执行文件中的，并不是动态加载的，这也是Nginx维持高性能的原因之一。


## 开发一个过滤模块 ##

注册一个过滤模块时，通常都需要执行类似下面的初始化代码：

{% highlight c %}

static ngx_int_t ngx_http_zip_header_filter(ngx_http_request_t *r);
static ngx_int_t ngx_http_zip_body_filter(ngx_http_request_t *r, ngx_chain_t *in);

static ngx_http_output_header_filter_pt  ngx_http_next_header_filter;
static ngx_http_output_body_filter_pt    ngx_http_next_body_filter;

static ngx_int_t ngx_http_zip_init(ngx_conf_t *cf)
{
	ngx_http_next_header_filter = ngx_http_top_header_filter;
    ngx_http_top_header_filter = ngx_http_zip_header_filter;

    ngx_http_next_body_filter = ngx_http_top_body_filter;
    ngx_http_top_body_filter = ngx_http_zip_body_filter;

    return NGX_OK;
}
{% endhighlight %}

任何过滤模块的初始化代码都会被Nginx在初始化时调用。请注意：这里的`ngx_http_top_header_filter`和`ngx_http_top_body_filter`是全局变量，而`ngx_http_next_header_filter`和`ngx_http_next_body_filter`是模块的静态变量（是模块级的全局变量），这一点很重要，后面会详细分析。

通过如下调用，将请求交由下一个过滤模块处理：

{% highlight c %}
return ngx_http_next_body_filter(r, in);
{% endhighlight %}

表面上看这里的`ngx_http_next_body_filter`似乎就是本模块的`ngx_http_zip_body_filter`啊，怎么是调用其他模块的处理函数呢？

> `ngx_http_top_header_filter`是一个全局变量。当编译进一个filter模块的时候，就被赋值为当前filter模块的处理函数。而`ngx_http_next_header_filter`是一个局部全局变量，它保存了编译前上一个filter模块的处理函数。所以整体看来，就像用全局变量组成的一条单向链表。

![](http://tengine.taobao.org/book/_images/chapter-4-1.png)

上面对这个`单向链表`的解释有些笼统，对于我这种业余选手，理解起来有些困难。下面从C编译器的工作原理角度详细分析一下

## 详细分析模块的编译 ##

为了简化描述，我们只考虑header过滤器，而且用`top`表示`ngx_http_top_header_filter`，用`next`表示`ngx_http_next_header_filter`。

假设我们有3个模块`a.c`,`b.c`,`c.c`，大致都是按照上面初始化代码编写的，比如`a.c`模块伪代码如下（忽略各种函数传参）：

{% highlight c %}

static function a();

static function next();

static ngx_int_t init()
{
	next = top;
    top = a;

    return NGX_OK;
}
{% endhighlight %}

`b.c`和`c.c`的代码也是如此，只是将`a`函数分别变成`b`和`c`。

### 编译 ###

由于`top`是nginx定义的全局函数指针变量，属于unsolved symbol，`next`是静态变量，只在c语言模块中有效，所以c编译器在完成模块编译后，生成的`a.o`大致是这样的：

![](http://pchou.qiniudn.com/nginx-c-trick-function-chain-a-o.png)

如上图：`top`在未解决符号表，等待链接器处理，`next`在模块变量部分，`next`静态变量在编译时默认值为0，假设`a`函数在`a.o`模块中的地址(偏移量)是`0xaaa`；`init`函数中，将`top`所在的内存中的值赋值给`next`的值简化为`next.value=top.value`，将`a`函数赋值给`top`，等同于将`a`函数在编译时的地址值`0xaaa`写入`top`所在的内存。

相应的`b.o`和`c.o`大致是这样的：

![](http://pchou.qiniudn.com/nginx-c-trick-function-chain-b-o-c-o.png)

### 链接 ###

链接就是把`.o`文件拼接在一起，在拼接过程中需要做两件重要的事情：一个是地址偏移重定向，这个过程可以确定全局变量在代码段中的位置。二是将各个模块中所有的未解决符号引用改成实际的地址。在这个例子中`top`作为全局变量，在链接的时候`ngx_xxx.o`被链接进来，并确定了其在最后可执行文件中的位置，我们假设是`0x111`，然后各个模块对top的引用都将修改成这个地址，最后在可执行文件中是这样的（忽略地址偏移重定向）：

![](http://pchou.qiniudn.com/nginx-c-trick-function-chain-final-exe.png)

### 初始化 ###

上面说过Nginx会在初始化的时候，执行各个模块的`init`，假设这里依次执行`a.init`、`b.init`、`c.init`，内存如下：

![](http://pchou.qiniudn.com/nginx-c-trick-function-chain-init-invoke.png)

注意图中红色的变量的变化。最后，top这个函数指针指向了`c`模块的`c`函数(`c`函数的偏移地址为`0xccc`)，而`c`模块的`next`这个函数指针指向了`b`模块的`b`函数(`b`函数的偏移地址为`0xbbb`)，而`b`模块的`next`这个函数指针指向了`a`模块的`a`函数(`a`函数的偏移地址为`0xaaa`)，`a`模块的`next`指针为0。这样在`b`函数中调用本模块`b`的`next`，却执行了`a`模块的`a`函数，而这里的`a`,`b`,`c`函数都是过滤器的实际处理函数，因此，过滤器处理函数如同一条链一样通过各自模块的`next`彼此相连。Nginx只需要调用`top`，就可以按照`c()->b()—>a()`将所有的处理函数都执行一遍(当然前提是处理函数都会调用`next`)

不得不承认此种方法的精妙。

问：32位的内存表示不应该是`0xaaaaaaaa`，怎么只有`0xaaa`??

答：好吧，css看多了。

![](http://pchou.qiniudn.com/20130305200802_vNkuY.thumb.700_0%5B1%5D.jpg)

