---
layout: postlayout
title: FastCGI+lighttpd开发之介绍和环境搭建
categories: [linux]
tags: [FastCGI,lighttpd]
---

由于需要做一些简单的基于FastCGI的Web开发，开始学习和调研，本篇介绍CGI和FastCGI的概念以及基于FastCGI官方的devkit，以及lighttpd搭建起简单的开发环境，以作备忘。

## 为啥要搞这个?

现在开发Web有N种选择，啥php，C#，java，ruby，nodejs...哪个都比开发FastCGI要简单和强大的多，为何还要跑到这么个底层来做Web服务呢？答案是嵌入式系统需求！我们知道嵌入式系统往往由于硬件的限制，为了节约处理器和内存，很多事情都需要省的点用。对于简单的Web服务，没有必要（或者不能）去使用高层次的编程框架，那么这个时候，就可以直接基于CGI那套协议来进行开发。通常在这个层次下，C语言是首选。

## FastCGI和CGI的概念

要搞清楚FastCGI，必须先搞清楚CGI

参考

[CGI与FastCGI](http://www.cnblogs.com/wanghetao/p/3934350.html)

[Nginx + CGI/FastCGI + C/Cpp](http://www.cnblogs.com/skynet/p/4173450.html)

[搞不清FastCgi与PHP-fpm之间是个什么样的关系](http://segmentfault.com/q/1010000000256516)

### CGI

CGI是一种协议，用于扩展Web服务器原本的能力。我们知道，Web服务器最早是用来提供静态文件访问的，想要实现动态内容提供是比较困难的。CGI因此而产生。这是一套协议，简单的说，就是Web服务器在必要的时候，为了处理Request，会调起一个进程（CGI程序），让这个进程来处理请求，并将这个进程返回的结果返回给客户端。然后进程结束，下次请求重复这个过程。这个过程中涉及到Web进程和CGI程序进程的输入和输出协议，这个机制和协议就叫CGI。那么具体的说，在CGI程序中，输入和输出是通过`stdin`,`stdout`,`stderr`来进行的，请求的参数等则是通过环境变量来传递的。所以CGI程序其实没有语言限制，只要能够读取环境变量，读写标准输入输出即可。下图以Apache和Python为例，说明CGI的工作方式

![](http://pchou.qiniudn.com/fcgi-dev-introduction-00.jpg)

Python的CGI扩展能够在Python解释器的帮助下，解释用户编写的Python脚本，从而输入输出，虽然这个模型相比上面阐述的基本模型要复杂一点，但是本质是相同的。

CGI的缺点很明显，每个请求都要启动进程来处理请求，进程启动的开销是没有必要的。


### FastCGI

为了解决CGI的缺点，诞生了FastCGI。既然CGI的缺点是进程的频繁启动和关闭，那么是否可以有一个专门管理CGI进程的程序，在没有Request请求的情况下，保持多个CGI进程的挂起状态，当有请求的时候，分配一个进程来处理，处理完成后挂起，就像是进程池一样。这个进程池的管理程序称为`FastCGI管理器`，从字面看，它可以提高CGI程序的效率。

不光是处理模型的优化，CGI程序只能在Web服务器本机执行，而基于FastCGI的管理下，CGI程序可以被部署在远程，通过TCP Socket或者Unix domain Socket来传输数据，这种模式可以理解为`FastCGI代理`。

`FastCGI管理器`有多种形式。例如：Apache和Lighttpd是通过模块的方式实现`FastCGI管理器`的，而Nginx则是通过`FastCGI代理`模式实现的（也就是说需要一个单独的`FastCGI管理器`进程，该进程通过侦听TCP Socket或者Unix domain Socket在Nginx和CGI程序之间起到桥梁作用）。

同样是Apache和Python为例，下图为FastCGI的启动和运行的模型

![](http://pchou.qiniudn.com/fcgi-dev-introduction-01.jpg)

Apache在调用用户脚本的时候，会依靠Apache内建的FastCGI模块来调度CGI进程，CGI进程也不会消亡，下次请求就不需要重新启动解析器了。而且CGI进程是通过Socket形式实现输入输出的，当然CGI程序在编写的时候，仍然是通过stdin,stdout,stderr来输入输出，只是最终可能是通过网络来实现的，这样做可以实现从CGI程序到FastCGI程序的平滑过渡。你会发现开发FastCGI程序跟开发CGI程序并没有多少区别。

关于Nginx的FastCGI代理模式，有必要多说几句。Nginx自身没有实现FastCGI管理器，但是Nginx可以支持FastCGI代理，我们来看看Nginx是如何配置php的就明白了：

{% highlight bash %}

location ~ \.php$ {
    root  html;
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    include        fastcgi_params;
}

{% endhighlight %}

可以看到，Nginx其实是把请求扔给`127.0.0.1:9000`，那么还需要一个程序来监听`127.0.0.1:9000`啊，对了！这个程序就是`php-fpm`，所以我们在用Nginx配置php的时候需要：

{% highlight bash %}

php-fpm start

{% endhighlight %}

`php-fpm`可以帮Nginx实现CGI进程管理器的功能。看起来好麻烦有没有，为什么Apache无需`php-fpm`，原因上面说了，Apache是通过模块实现的，无需单独启动`php-fpm`。


那么，如何开始开发一个FastCGI程序呢，我们需要FastCGI的开发套件，以及一个合适的Web服务器，这里FastCGI套件从[这里](http://www.fastcgi.com/drupal/node/5)下载，Web服务器，我们选择了lighttpd，因为既然要直接开发CGI程序，那么通常你会选择尽可能轻量的Web服务器。当然支持FastCGI的Web服务器很多，[这里](http://www.fastcgi.com/drupal/node/3)有列表。

## 准备lighttpd

[lighttpd](http://www.lighttpd.net/)的安装就不多说了，你可以选择编译安装或者源安装，我选择了编译安装，所以后续的启动啥的麻烦一点。

### lighttpd的启动和重启

如果是编译安装的，那么你需要将源码包`doc`里面的`config`文件夹复制到`/etc`下，并重命名为`lighttpd`，这里面是lighttpd的一系列启动配置，然后像下面这样启动：

{% highlight bash %}

/usr/local/sbin/lighttpd -f /etc/lighttpd/lighttpd.conf

{% endhighlight %}

如果你经常折腾Web服务器，这应该很好理解。当然你可以查看一下配置文件，了解个大概（尤其是日志文件的位置），由于配置文件有很多注释，分享一个命令，能去掉注释部分，只看重点：

{% highlight bash %}

sed -n '/^\s*[^#]/p' /etc/lighttpd/lighttpd.conf

{% endhighlight %}

重启的话，可以通过下面命令先杀掉相关的进程，然后再启动

{% highlight bash %}

killall lighttpd
/usr/local/sbin/lighttpd -f /etc/lighttpd/lighttpd.conf

{% endhighlight %}


### lighttpd配置fastcgi模块

这个相对简单，在`/etc/lighttpd/modules.conf`，将里面的fastcgi模块的引用反注释掉

{% highlight bash %}

include "conf.d/fastcgi.conf"

{% endhighlight %}

那么关于fastcgi的配置就顺理成章的在`conf.d/fastcgi.conf`中了，其中关键的一句是：

{% highlight bash %}

server.modules += ( "mod_fastcgi" )

{% endhighlight %}

底下有很多示例配置，尤其是对php的配置示例，尤其详细，然而我们是直接做CGI程序，可以参考这个配置

{% highlight bash %}

fastcgi.debug = 1
fastcgi.server = (
	".fcgi" => (
	 "local" => (
	  "socket" => socket_dir + "fcgitest-fcgi.socket",
	  "checklocal" => "disable",
	  "bin-path" => server_root + "/htdocs/cgi-bin/fh.fcgi",
	  "idle-timeout" => 10,
	  "min-procs" => 1,
	  "max-procs" => 1
	 )
	)
)

{% endhighlight %}

理解了FastCGI原理后，再来看这个其实很容易理解：

1. 对所有.fcgi后缀的处理
2. 通过`fcgitest-fcgi.socket`
3. 用`/htdocs/cgi-bin/fh.fcgi`程序来处理
4. 最多同时驻留1个CGI进程，最少1个（对于嵌入式系统，并不是要处理高并发，多个进程并没有意义）

我们可以通过浏览器访问http://localhost/cgi-bin/fh.fcgi，即可执行fh.fcgi程序（这里htdocs是配置的文档根目录）。

那么接下来的重点是开发`/htdocs/cgi-bin/fh.fcgi`程序。



## 开始开发FastCGI程序

### 开发套件的安装

下载好套件后，解压在fcgi-devel-kit目录

{% highlight bash %}

cd fcgi-devel-kit
./configure
make
cd libfcgi
make
make install

{% endhighlight %}

显然我们其实需要的是FastCGI的`include`和`lib`，上面的命令可以在`/usr/local/lib`下创建几个相关的库文件：

{% highlight bash %}

-rw-r--r--.  1 root root 204902 Nov 15 20:09 libfcgi.a
-rwxr-xr-x.  1 root root    704 Nov 15 20:09 libfcgi.la
lrwxrwxrwx.  1 root root     16 Nov 15 20:09 libfcgi.so -> libfcgi.so.0.0.0
lrwxrwxrwx.  1 root root     16 Nov 15 20:09 libfcgi.so.0 -> libfcgi.so.0.0.0
-rwxr-xr-x.  1 root root 145320 Nov 15 20:09 libfcgi.so.0.0.0

{% endhighlight %}

.a是静态库，.la是基于[libtool](http://www.ibm.com/developerworks/cn/aix/library/1007_wuxh_libtool/)的链接库。后面你可以选择使用.a来链接，也可以使用libtool工具，使用.la来构建。

完成套件的安装后，先创建一个项目文件，并将include和libtool工具拷贝进去（如果你不打算用libtool编译，可以不拷贝libtool）

{% highlight bash %}

mkdir -p ~/Projects/fh
cp -r ~/fcgi-devel-kit/include ~/Project/fh/fcgi_inc
cp ~/fcgi-devel-kit/libtool ~/Project/fh/libtool

{% endhighlight %}

创建一个main.c文件，并编辑如下：

{% highlight c %}

#include <fcgi_stdio.h>
#include <stdio.h>

int main(){
 int count = 0;
 while(FCGI_Accept() >= 0){
	printf("Content-type: text/html\r\n"
           "\r\n"
           "<title>FastCGI Hello! (C, fcgi_stdio library)</title>"
           "<h1>FastCGI Hello! (C, fcgi_stdio library)</h1>"
           "Request number %d running on host <i>%s</i>\n",
            ++count, getenv("SERVER_NAME"));
 }
}

{% endhighlight %}

上面的程序跟普通的CGI程序的关键区别在于`while(FCGI_Accept() >= 0)`，这个条件会在没有请求需要处理的时候阻塞，那么进程就会挂起，并在正常情况下不会退出。这样就实现了进程驻留的效果。


### 编译和链接

使用`libtool`进行编译和链接

{% highlight bash %}

./libtool --mode=compile gcc -I fcgi_inc -c main.c

rm -f .libs/main.lo
gcc -I fcgi_inc -c main.c  -fPIC -DPIC -o .libs/main.lo
gcc -I fcgi_inc -c main.c -o main.o >/dev/null 2>&1
mv -f .libs/main.lo main.lo

{% endhighlight %}

编译得到的是`main.lo`和`main.o`，前者用于继续用libtool链接FastCGI的lib，后者可用于普通的链接。

接着链接：

{% highlight bash %}

./libtool --mode=link gcc -o fh main.lo /usr/local/lib/libfcgi.la

gcc -o fh main.o  /usr/local/lib/libfcgi.so -lnsl  -Wl,--rpath -Wl,/usr/local/lib -Wl,--rpath -Wl,/usr/local/lib

{% endhighlight %}

得到的程序`fh`，是通过`main.o`和`/usr/local/lib/libfcgi.so`链接后生成的（动态链接），可以看到libtool实际上只是对gcc的一个包装而已。据说是为了方便解决依赖库，笔者折腾了好久才弄清楚。


最后，将`fh`复制到目标目录，并重命名。当然如果fh.fcgi进程已经由lighttpd启动，需要杀掉进程，再覆盖。

{% highlight bash %}

cp -f fh /srv/www/htdocs/cgi-bin/fh.fcgi

{% endhighlight %}

最后使用浏览器的访问效果：


![](http://pchou.qiniudn.com/fcgi-dev-introduction-02.png)

需要注意的是，访问的文件还是必须物理存在的（因为没有配置任何rewrite），比如这里访问的cgi-bin/fg.fcgi，实际上映射了/srv/www/htdocs/cgi-bin/fg.fcgi文件，然后再用fastcgi的方式来处理。否则只会返回404，笔者在这里卡了一下。

## 结语

花了一天时间，简单实验的FastCGI的开发，后续还需要使用IDE来开发，并实现交叉编译，后面再折腾了。


