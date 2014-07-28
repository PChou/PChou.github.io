---
layout: postlayout
title: nginx配置技巧汇总
thumbimg: Open-Source-Software-.jpg
categories: [web]
tags: [web-server,nginx]
---

本文记录了一些nginx作为反向代理和文件服务器的配置技巧和解决方案，持续更新

## Nginx作为文件服务 ##

### 避免浏览器自动播放文件 ###

有时对于图片、视频，浏览器会视能力，自动为用户显示或播放。这主要是由于Web服务器在返回文件本身数据的同时，返回了一些特殊的MIME类型，比如：`image/jpeg`（JPEG图像）,`application/pdf`（PDF文档）,`video/mpeg`（MPEG动画）。这些MIMIE类型实际上是告诉浏览器，文件数据到底是什么，这样浏览器就能更好的为用户展示数据。现在像图片、pdf、甚至是视频基本都是可以直接在浏览器中展示和播放的。但是有时，我们需要浏览器为用户下载文件而不是直接播放，而Nginx在默认配置下，会根据文件的后缀来匹配相应的MIME类型，并写入Response header，导致浏览器播放文件而不是下载，这时需要通过配置让Nginx返回的MIME类型为下面这个类型：

{% highlight nginx %}
application/octet-stream
{% endhighlight %}

这个类型会让浏览器认为响应是普通的文件流，并提示用户下载文件。可以通过在Nginx的配置文件中做如下配置达到这样的目的：

{% highlight nginx %}
location /download/ {
    types        { }
    default_type application/octet-stream;
}
{% endhighlight %}


这样当Url路径中包含`/download/`时，MIME类型会被重置为`application/octet-stream`。另外，nginx自带的MIME类型映射表保存在`conf/mime.types`中。

### 文件上传大小限制放开 ###

有的时候后端的Web-Server提供文件上传的服务，但是如果前端使用Nginx做反向代理时，会出现文件无法上传的问题，这可能是由于Ngxin默认对客户端请求的body的限制。因为，默认情况下Nginx对客户端请求的大小限制是1m，而上传的文件往往超过1m。可以通过修改如下配置项，来放宽这个限制：

{% highlight nginx %}
client_max_body_size 10m;
{% endhighlight %}

将这个值设置为0，可以取消这个限制。这个配置项可以用在`http`, `server`, `location`配置节中。详见[client_max_body_size](http://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size)

### 下载文件重命名 ###

通常情况下，为了保证用户上传的文件在服务器的文件系统中不至于重名，一般会将文件名修改成guid后保存，并在数据库中保持guid与文件名的映射。此时，如果使用Nginx来提供对这些用户文件的下载功能的话，文件下载到用户浏览器，会以文件的guid名作为文件名，这显然是用户不想看到的。可以考虑用这个方案。
假设我们有一个文件的原始文件名为`test.txt`，对应的guid文件名是`21EC2020-3AEA-1069-A2DD-08002B30309D.txt`，文件的虚拟路径是`/download/`

使用服务器端编程语言，在输出的html中使用如下链接提供文件的下载：

{% highlight html %}
<a href="/download/21EC2020-3AEA-1069-A2DD-08002B30309D.txt?n=test.txt" target='_blank'>下载test.txt</a>
{% endhighlight %}

可以看到，将原始文件名以QueryString的方式带在请求中，这样可以在Nginx端，利用`$arg_name`变量来取到这个QueryString的值，从而重写response header：

{% highlight nginx %}
add_header Content-Disposition "attachment; filename=$arg_n";
{% endhighlight %}

这会在response header中加入如下键值：

{% highlight nginx %}
Content-Disposition: "attachment; filename=test.txt";
{% endhighlight %}

经测试，无论是IE还是Chrome都可以支持这个header。

> 关于Content-Disposition，详见[这里](http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1)
> 
> 关于Nginx的标准http模块的嵌入变量，详见[这里](http://nginx.org/en/docs/http/ngx_http_core_module.html#variables)


### 提供flv视频播放 ###

使用`jwplayer`+`Nginx`能够实现视频在线播放，视频格式为flv。Nginx有一个flv模块[ngx_http_flv_module](http://nginx.org/en/docs/http/ngx_http_flv_module.html)，能够支持flv视频的快进播放。在安装Nginx的时候可能需要手动添加`--with-http_flv_module`，不过笔者使用的yum安装，自动带上了这个模块。

其实从这个模块的文档中可以看到，它只是能够处理`start`的带参数http请求，需要像下面这样配置：

{% highlight nginx %}
location ~ \.flv {
	root /var/video;
	flv;
}
{% endhighlight %}

从客户端播放器的角度看，还需要配置播放器的一些参数，以jwplayer为例：

{% highlight js %}
jwplayer("flashContent").setup({
	flashplayer: "/jwplayer/player.swf",
	height: 270,
	width: 480,
	file: "${file_url}.flv", //flv文件路径
	image:"${file_url}.jpg", //缩略图
	streamer:"start",
	provider: "http", //有时可能是type:"http"
});
{% endhighlight %}

这里的关键参数是`provider`，用来告诉jwplayer使用http方式请求视频(还有其他协议，比如[RTSP](http://en.wikipedia.org/wiki/Real_Time_Streaming_Protocol))，`streamer`参数是配合Nginx支持的`start`参数来设置的。

如果想要实现快进播放的话，还有一个关键点，就是视频需要包含有**关键帧信息**。关键帧信息其实就是一系列`时间点`+`byte位`。可以用[yamdi](http://yamdi.sourceforge.net/)为flv注入关键帧:
	
{% highlight powershell %}
yamdi -i a_without_meta.flv -o b_with_meta.flv
{% endhighlight %}

这样jwplayer能够根据快进的时间从关键帧信息中找到最近的关键帧的起始二进制点，并将这个byte作为start参数回传给Nginx。如果关键帧信息越密集的话，越占空间，但是快进也能够越精确：

{% highlight js %}
//刚开始播放的时候，产生的http：
.../b_with_meta.flv?start=0
//用户快进后，产生的http：
.../b_with_meta.flv?start=37682252
{% endhighlight %}

### 附件批量打包下载 ###

利用第三方模块[mod_zip](https://github.com/evanmiller/mod_zip)。详见[利用Nginx第三方模块，实现附件打包下载]({% post_url 2014-07-28-nginx-mod-zip %})


## Nginx作为反向代理 ##

### 一个IP多个域名 ###

如果只有一个公网IP，但是网站功能需要划分为多个不同的子网站或者子域名，可以用Nginx来搭建反向代理来“复用”IP资源。假设有如下几个域名都是abc.com这个主域的：

{% highlight html %}
www.abc.com
image.abc.com
video.abc.com
{% endhighlight %}


1.	首先在DNS出注册这3个域名同时指向同一个IP，Nginx作为前端的web服务器，让所有访问这个IP地址80端口的请求全部指向Nginx
2.	然后，配置Nginx，根据域名将请求转发转发给内网的上游服务器，例如下面的配置：

{% highlight nginx %}
server {
    listen 80;
    server_name www.abc.com;
    location / {
            proxy_pass http://192.168.1.100;
    }
 }

server {
    listen 80;
    server_name image.abc.com;
    location / {
            alias /var/www/image;
    }
 }

server {
    listen 80;
    server_name video.abc.com;
    location / {
            proxy_pass http://192.168.1.100:8081/video;
    }
 }
{% endhighlight %}

在上述配置中，将三个域名分发给了不同的模块处理：

1. `www.abc.com` 分发给上游的http://192.168.1.100服务器处理
2. `image.abc.com` 则直接映射到了Nginx本机的一个目录
3. `video.abc.com` 分发给上游的http://192.168.1.100:8081/video服务器处理（video是上游web-server的某虚拟目录)

### 上游服务器超时 ###
Nginx作为反向代理的时候，如果上游服务器处理时间过长的话，有时会返回504网关超时，从nginx的错误日志看出如果是upstream timed out，就表示是上游服务器处理时间过长，Nginx认为服务超时。Nginx在请求上游服务器时默认的超时时间为1分钟，可以通过调整`proxy_read_timeout`属性增加这个超时时间

{% highlight nginx %}
proxy_read_timeout	180s;
{% endhighlight %}


### 默认的header过滤 ###
Nginx默认对客户端的http请求进行很多验证，其中容易忽视的是header的验证，默认由下面两个配置节控制：

{% highlight nginx %}
underscores_in_headers on|off;
ignore_invalid_headers on|off;
{% endhighlight %}

`underscores_in_headers off`表示对包含有下划线(_)的header认为是**不合法的**，而`ignore_invalid_headers on`则表示对于**不合法的header都过滤掉（无视掉）**。如果在客户端自定义header的话，要注意尽量不要包含下划线，否则会碰到被Nginx过滤掉的问题。如果不可避免的要使用下划线的话，就考虑配置成这样的组合：

{% highlight nginx %}
underscores_in_headers on;
ignore_invalid_headers off;
{% endhighlight %}

可以把上面的配置节设置在`http`或者`server`段中。

对于排查这个问题，可以通过将错误日志的告警级别调整到debug，并查看error日志，一般错误日志里面会包含有类似这样的信息

> ...client sent invalid header line:...