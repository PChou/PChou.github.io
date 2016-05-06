---
layout: postlayout
title: 一步步在GitHub上创建博客主页(5)

thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page, jekyll, liquid]
---



本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇介绍如何利用jekyll构建博客。在前几篇中，多多少少对jekyll有所涉及，在这篇中将带读者进一步了解jekyll以及模板引擎liquid。

更新

> jekyll最新的动态和文档现在可以在[jekyllrb](http://jekyllrb.com/)上找到
> jekyll还能支持`markdown`语法，可以有选择性的配置markdown解释器

## jekyll介绍 ##

`jekyll`是一个基于ruby开发的，专用于构建静态网站的程序。它能够将一些动态的组件：模板、`liquid`代码等构建成静态的页面集合，Github-Page全面引入jekyll作为其构建引擎，这也是学习jekyll的主要动力。同时，除了jekyll引擎本身，它还提供一整套功能，比如web server。我们用jekyll --server启动本地调试就是此项功能。读者可能已经发现，在启动server后，之前我们的项目目录下会多出一个`_site`目录。jekyll默认将转化的静态页面保存在`_site`目录下，并以某种方式组织。使用jekyll构建博客是十分适合的，因为其内建的对象就是专门为blog而生的，在后面的逐步介绍中读者会体会到这一点。但是需要强调的是，jekyll并不是博客软件，跟`workpress`之类的完全两码事，它仅仅是个一次性的模板解析引擎，它不能像动态服务端脚本那样处理请求。

更多关于jekyll请看[这里](http://jekyllbootstrap.com/lessons/jekyll-introduction.html)


## jekyll是如何工作的 ##

在jekyll解析你的网站结构前，需要确保网站目录像下面那样：

{::nomarkdown}
<pre><code>
|—— _config.yml
|—— _includes
|—— _layouts
|   |—— default.html
|   |—— post.html
|—— _posts
|   |—— 20011-10-25-open-source-is-good.html
|   |—— 20011-04-26-hello-world.html
|—— _site
|—— index.html
|—— assets
   |—— css
       |—— style.css
   |—— javascripts
 </code></pre>
{:/}


- _config.yml：保存配置，该配置将影响jekyll构造网站的各种行为。关于配置的详细文档在这里
- _includes：该目录下的文件可以用来作为公共的内容被其他文章引用，就跟C语言include头文件的机制完全一样，jekyll在解析时会对{% raw %}`{% include %}`{% endraw %}标记扩展成对应的在`_includes`文件夹中的文件
- _layouts：该目录下的文件作为主要的模板文件
- _posts：文章或网页应当放在这个目录中，但需要注意的是，文章的文件名必须是`YYYY-MM-DD-title`
- _site：上面提到过，这是jekyll默认的转化结果存放的目录
- assets：这个目录没有强制的要求，主要目的是存放你的资源文件，图片、样式表、脚本等。

## 一个例子 ##

完成一个例子总是最快的入门方式。

对于基于静态页面的网站，你显然不希望每篇文章都要写html、head等与文章本身无关的重复的东西，那么容易想到的是将这些东西作为模板提取出来，以便复用，_layouts文件夹中的文件可以作为这样的模板。现在我们在_layouts文件夹中创建一个模板文件，default.html：

<pre>
<code>&#60;html>
   &#60;head>
       &#60;meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
       &#60;title>My blog&#60;/title>
   &#60;/head>
   &#60;body>
   &#123;{content }}
   &#60;/body>
&#60;html></code>
</pre>

default.html包含了每个html都需要的一些标记，以及一个个`liquid`标记。{% raw %}`{{ … }}`{% endraw %}是liquid中用来表示“内容”的标记，其中的对象在解析时会被替换成文件到页面中

content：表示在这里的地方用子页面的内容替换。

现在我们来实现一个主页，在根目录下，创建一个index.html

{% highlight html %}
---
layout: default
---
<h1>Hello jekyll</h1>
<p>This is the index page</p>
{% endhighlight %}

除了普通的html标记外，开头这一段称为[YAML格式](https://github.com/mojombo/jekyll/wiki/YAML-Front-Matter)，以一行`---`开头，一行`---`结尾，在虚线的中间以`key`-`value`的形式对一些全局变量进行赋值。

layout变量表示该文章应当使用`_layouts/default`这个文件作为父模板，并将index.html中的内容替换父模板中的{% raw %}`{{content }}`{% endraw %}标记。

在根目录中启动`jekyll serve`，并访问<http://localhost:4000/index.html>，你将得到下面页面：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-05-img0.png)

该页面的Html源码如下，可以看到，`index.html`中的内容替换了default.html中的{% raw %}`{{content }}`{% endraw %}

{% highlight html %}
<html>
  <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>My blog</title>
  </head>
  <body>
  <h1>Hello jekyll</h1>
<p>This is the index page</p>
  </body>
<html>
{% endhighlight %}


现在请观察一下`_site`中的`index.html`，就是上面的Html代码！OK，现在你明白jekyll的工作方式了吧，它仅仅一次性的完成静态页面的转化，其余的事情全都交给普通的web server了！

需要注意的是，如果你失败了，请确保你的文件都是UTF-8 without BOM的格式。

> 在windows中，为了甄别UTF-8编码格式的文本文件，默认会在文件头插入三个字节的标识，被称为BOM。事实证明这是个“歪门邪道”，jekyll不识别这种特殊的标记，所以可以使用Notepad++或其他的工具将UTF-8编码文件开头的BOM去掉。

## 第一篇文章 ##

现在我们来创建一篇博客文章，并在index.html页面添加文章的链接。

在 `_posts`目录下创建`2012-01-07-first-post.html`

{% highlight html+erb %}
{% raw %}
---
layout: default
title: my first post
---
<h1>{{ page.title }}</h1>
<p>This is my first post.Click the link below to go back to index:</p>
<a href="{{ site.baseurl }}/index.html">Go back</a>
{% endraw %}
{% endhighlight %}

修改index.html

{% highlight html+erb %}
{% raw %}
---
layout: default
---
<h1>Hello jekyll</h1>
<p>This is the index page</p>
<p>My post list:</p>
<ul>
   {% for post in site.posts %}
       <li><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></li>
   {% endfor %}
</ul>
{% endraw %}
{% endhighlight %}

最终效果如下：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-05-img1.png)

这个是略微复杂的例子，这里涉及到两个主要的对象

- `site`：全局站点对象。比如`site.posts`返回当前站点所有在`_post`目录下的文章，上面的例子结合`for`循环来罗列所有的文章
- `page`：文章对象。比如`page.url`将返回page对象的url，上面的例子用该对象和属性返回了文章的链接

另外要补充的是`site.baseurl`，该值就是我们在`_config.yml`中配置的`baseurl`啦！

这些对象被称为“模板数据API”，更多API文档请参见[这里](http://jekyllbootstrap.com/api/template-data-api.html)



## liquid ##

`liquid`是`jekyll`底层用于解析的引擎，我们用到的{% raw %}`{{.. }}`{% endraw %}亦或是{% raw %}`{% … %}`{% endraw %}标记其实是靠liquid去解析的。本节将详细介绍liquid的使用。

liquid包含两种标记，理解他们的机理是十分重要的：

- {% raw %}`{{.. }}`{% endraw %}：输入标记，其中的内容将被文本输出
- {% raw %}`{% … %}`{% endraw %}：操作标记，通常包含控制流代码

例如：

{% highlight js %}
{% raw %}
{% if user.age > 18 %}
  Login here
{% else %}
  Sorry, you are too young
{% endif %}

{% for item in array %}
  {{item }}
{% endfor %}
{% endraw %}
{% endhighlight %}

另外liquid还包含一种叫`filter`的机制。这是种对输出标记的扩展，通过它可以对输出标记中的内容进行更细致的处理，例如：

{% highlight js %}
{% raw %}
Hello {{'tobi' | upcase }}
Hello tobi has {{'tobi' | size }} letters!
Hello {{'now' | date: "%Y %h" }}
{% endraw %}
{% endhighlight %}

- 返回字符串大写的结果：TOBI
- 返回字符串的长度：4
- 将当前时间格式化输出

liquid内置了一些filter，并且该机制可以被扩展，jekyll便扩展了liquid的filter。

更多关于liquid的使用方法，请参见[这里](https://github.com/Shopify/liquid/wiki/Liquid-for-Designers)

更多关于jekyll对liquid的扩展，请参见[这里](https://github.com/mojombo/jekyll/wiki/Liquid-Extensions)
