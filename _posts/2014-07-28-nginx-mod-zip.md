---
layout: postlayout
title: 利用Nginx第三方模块，实现附件打包下载
categories: [open-source]
tags: [nginx,web-server]
---

前一阵子被一个需求困扰：附件的打包下载，需要将一批逻辑上一起的文件，让用户通过一个下载按钮打包下载。首先想到的方案是服务端调用什么`zip`之类的类库，将文件打包好后返回客户端。但是这样做有一个很明显的问题：文件很多很大的情况下，打包可能会占用大量的内存和cpu，就算在磁盘上构建临时的打包文件，也会增加服务器的磁盘IO负担，而且这些临时的文件无故占用大量的磁盘空间，删除还是个问题。用户体验也是问题，因为必须打包完成后，才能开始返回，无法边打包边下载。本来都准备放弃了，不过发现百度网盘好像实现了这个功能，于是再次考虑如何实现。想到我们实际上使用了Nginx作为文件服务器，会不会有第三方模块能够支持这种功能呢？寻觅之后果然有结果，就是本文要探讨的[mod_zip](https://github.com/evanmiller/mod_zip)。

## mod_zip介绍 ##

`mod_zip`能够动态的构建zip包，这种动态体现在当Nginx作为***反向代理服务器***的时候，该模块能够根据上游服务器返回的文件列表来打包文件。`mod_zip`实际上是利用Nginx的`subrequest`功能，将`zip流`发送到客户端的，而且它实际上***只打包不压缩***，所以借助Nginx本身作为文件服务器的能力，该模块的内存占用十分少，对于上G的大文件也没有问题。zip文件本身是结构化的，可以自定义目录结构，所以对于`mod_zip`而言，要做的只是添加zip的头部尾部和zip内部的目录结构元数据而已，文件数据本身依靠Nginx自身的机制发送。

除此之外，还有如下两点：

- 由于使用`subrequest`机制，文件甚至可以不在Nginx的服务器本身，可以是上游服务器，甚至是互联网的远程服务器上
- 在添加crc校验后，`mod_zip`还能够支持HTTP的[Range](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.16)，支持断点续传

## 基本使用 ##

### 安装 ###

下载源码：

{% highlight bash %}
$ git clone https://github.com/evanmiller/mod_zip.git
{% endhighlight %}

重新编译Nginx，不要make install：

{% highlight bash %}
$ ./configure --add-module=/src/mod_zip
$ make
{% endhighlight %}

将生成的二进制文件覆盖现有的二进制文件。通常编译出来的二进制文件位于源码目录的`objs/nginx`。更多关于如何添加第三方模块看[如何安装nginx第三方模块](http://www.ttlsa.com/nginx/how-to-install-nginx-third-modules/)

### 使用方法 ###

该模块不需要在nginx.conf中配置任何东西，一切的行为取决于上游服务器的响应内容。`mod_zip`规定当响应头中包含`X-Archive-Files`的时候，将启用mod_zip的功能：

{% highlight nginx %}
X-Archive-Files: zip
{% endhighlight %}

同时，响应的body中需要包含一个欲打包的文件的列表，如：

{::nomarkdown}
<pre><code>
1034ab38 428    /foo.txt   My Document1.txt
83e8110b 100339 /bar.txt   My Other Document1.txt

</pre></code>
{:/}

每一行表示一个文件描述，行与行之间有一个换行符(最后也有个换行)。每行从左向右以空格分隔，依次是文件的crc-32校验，文件大小(Byte)，文件的uri，文件名。其中crc-32可以忽略，并用`-`代替，文件名可以包含目录，会体现在最后的压缩包中的目录结构中。

重点是文件的uri怎么理解。这里的`/foo.txt`和`/bar.txt`并非指向文件系统的路径，而是一个子请求的地址。比如上面的`/foo.txt`实际上会产生一个Nginx自身的请求：`http://host/foo.txt`，至于这个请求得到什么又要根据`nginx.conf`中的配置决定了。这样的设计十分灵活，例如下面的配置：

{% highlight nginx %}
location ~ "^/(?<srv>server[12])/(?<file>.*txt)" {
	proxy_pass http://$srv.domain.com/$file
}
{% endhighlight %}

于是，可以这样使用文件uri：

{::nomarkdown}
<pre><code>
1034ab38 428    /server1/foo.txt   My Document1.txt
83e8110b 100339 /server2/bar.txt   My Other Document1.txt

</pre></code>
{:/}

这样两个文件分别会向远程服务器请求文件：

{::nomarkdown}
<pre><code>
http://server1.domain.com/foo.txt
http://server2.domain.com/bar.txt
</pre></code>
{:/}


上游服务器可以通过在头部注入`Content-Disposition`来控制zip文件的输出文件名

{% highlight nginx %}
Content-Disposition: attachment; filename=foobar.zip
{% endhighlight %}


### 上游服务器示例 ###

下面是个测试用的上游服务器例子

{% highlight php %}
<?php

	header('X-Accel-Chareset: utf-8');
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename=test.zip');
	header('X-Archive-Files: zip');
	$crc32 = "-";
	printf("%s %d %s %s\n", $crc32, 66382593, '/video/raw/1dc3b670-f864-4050-9772-8ccff341d091.mp4', '1.mp4');
	printf("%s %d %s %s\n", $crc32, 26160723, '/video/raw/4d6bf6ba-5b8a-49be-bede-481fe49093dc.mp4', '2.mp4');
?>

{% endhighlight %}