---
layout: postlayout
title: 一步步在GitHub上创建博客主页(3)
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page]
---

本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇介绍如何绑定域名。说实话，虽然明白什么是域名以及域名解析的原理，但是在实际的互联网环境中，域名的问题其实比理论上说的要复杂些。这里对一些概念稍作整理。

> 如果读者暂时并不想在Github-page上使用自定义域名，可以先跳过本篇

## 域名扫盲 ##

### A(Address)记录 ##

是用来指定主机名（或域名）对应的IP地址记录。用户可以将该域名下的网站服务器指向到自己的web server上。同时也可以设置您域名的二级域名。

### CNAME ###

也被称为规范名字。这种记录允许您将多个名字映射到同一台计算机。 通常用于同时提供WWW和MAIL服务的计算机。例如，有一一个A记录为`host.mydomain.com`。 它同时提供WWW和MAIL服务，为了便于用户访问服务。可以为该计算机设置两个别名（CNAME）：WWW和MAIL。 这两个别名的全称就是`www.mydomain.com`和`mail.mydomain.com`，将他们都指向`host.mydomain.com`：

	A

	host.mydomain.com -> IPAddress

	CNAME

	www.mydomain.com -> host.mydomain.com
	mail.mydomain.com -> host.mydomain.com

同样的方法可以用于当您拥有多个域名需要指向同一服务器IP，此时您就可以将一个域名做A记录指向服务器IP然后将其他的域名做别名到之前做A记录的域名上，那么当您的服务器IP地址变更时您就可以不必麻烦的一个一个域名更改指向了 只需要更改做A记录的那个域名其他做别名的那些域名的指向也将自动更改到新的IP地址上了。CNAME还广泛用于需要CDN加速的场景下，因为这个时候，域名到IP地址的映射是事先不知道的，需要根据访问者的地理位置来确定镜像服务器的IP地址。


### TTL ###

TTL值全称是“生存时间（Time To Live)”，简单的说它表示DNS记录在DNS服务器上缓存时间。要理解TTL值，请先看下面的一个例子：

假设，有这样一个域名`myhost.cnMonkey.com`（其实，这就是一条DNS记录，通常表示在abc.com域中有一台名为myhost的主机）对应IP地 址为1.1.1.1，它的TTL为10分钟。这个域名或称这条记录存储在一台名为`dns.cnMonkey.com`的DNS服务器上。
现在有一个用户键入一下地址（又称URL）：`http://myhost.cnMonkey.com` 这时会发生什么呢？
该 访问者指定的DNS服务器（或是他的ISP,互联网服务商, 动态分配给他的)8.8.8.8就会试图为他解释`myhost.cnMonkey.com`，当然8.8.8.8这台DNS服务器由于没有包含 myhost.cnMonkey.com这条信息，因此无法立即解析，但是通过全球DNS的递归查询后，最终定位到`dns.cnMonkey.com`这台DNS服务器， dns.cnMonkey.com这台DNS服务器将myhost.cnMonkey.com对应的IP地址1.1.1.1告诉8.8.8.8这台DNS服务器，然有再由 8.8.8.8告诉用户结果。8.8.8.8为了以后加快对myhost.cnMonkey.com这条记录的解析，就将刚才的1.1.1.1结果保留一段时间，这 就是`TTL`时间，在这段时间内如果用户又有对myhost.cnMonkey.com这条记录的解析请求，它就直接告诉用户1.1.1.1，当`TTL`到期则又会重复 上面的过程。

### 域名分级 ###

子域名是个相对的概念，是相对父域名来说的。域名有很多级，中间用点分开。例如中国国家顶级域名CN，所有以 CN 结尾的域名便都是它的子域。例如：www.zzy.cn 便是 zzy.cn 的子域，而 zzy.cn 是 cn 的子域。

“二级域名”：目前有很多用户认为“二级域名”是自己所注册域名的下一级域名，实际上这里所谓的“二级域名”并非真正的“二级”，而应该称为“次级”(相对次级)

例如您注册的域名是abc.cn来说：CN为顶级域，abc.cn为二级域，www.abc.cn、mail.abc.cn、help.zzy.cn为三级域。

还有一些特殊的二级域被用来作顶级域使用，例如：com.cn、net.cn、org.cn、gov.cn（包括地区域名bj.cn、fj.cn等）。那么此时用户所注册的就应该是三级域了，例如114.com.cn。（备注：www.gov.cn实际上是以gov.cn为后缀的www域名，就是说如果您在域名Whois信息查询中输入gov.cn是查询不到注册信息的因为gov.cn是作为顶级域来使用的域名后缀，真正开放注册的是www.gov.cn）。然而当前有很多用户还是习惯地将可以允许用户注册的域名称为顶级域名，而所注册域名的下一级域名称为“二级域名”，其实从严格意义上来讲这是不对的，所以我们前面会说“子域名”、“二级域名”是相对的概念，准确的应该称为“次级域名”。

### 域名购买 ###

众所周知，域名是要购买的，国内用域名访问主机大概是要备案的，有些麻烦。所以现在很多人从国外的域名注册商那儿买域名，比如goddady。如果是新手想在国外买域名的话，最好准备一张VISA信用卡，并用paypal来支付（可以省手续费）。goddady现在已经完美支持支付宝了。没什么在国外网站交易的经历，这里就不谈这些了，读者可以自己查。

 

## 绑定域名到GitHub-Page ##

> 在写这篇文章的时候github是按照下面的方式配置自定义域名的，但是github已经改进了自定义域名的玩法，详见[一步步在GitHub上创建博客主页-最新版]()。你可以参考这个链接：[Setting up a custom domain with Pages](https://help.github.com/articles/setting-up-a-custom-domain-with-pages)

其实十分简单，假设我们购买了域名`pchou.info`，想用`pchou.info`访问你的站点`http://username.github.com/projectname`。

在你的域名提供商那边，设置一条A记录：

	A

	pchou.info  204.232.175.78

注意：这个IP难保不会变，所以要及时关注上面这个链接中给出的IP，并及时更新A记录。下面这个截图是goddady上的A记录配置：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-03-img0.png)

然后在你的`gh-pages`分支的根目录中创建一个`CNAME`文件，其中只能有一行，就是`pchou.info`，用Git客户端上传更改，大约等十几分钟就能生效了。

可以先`ping`一下pchou.info，如果返回的IP地址更配置的A记录一样的话，说明域名已经注册好了，就等GitHub生效了。不过别急，你还需要把`_config.yml`中的`baseurl`设置如下

	baseurl : /

或者是

	baseurl :


这取决于你的模板如何引用`baseurl`，总之指向根目录就好了。

刚开始的时候我比较困惑的是，为什么A记录都指向的是同一个IP，GitHub是如何知道应该返回哪个用户的页面的。其实很简单，秘密就是上面提到的CNAME文件，GitHub应该会缓存所有gh-pages分支中的CNAME文件，用户对域名的请求被定向到GitHub住服务器的IP地址后，再根据用户请求的域名，判断对应哪个gh-pages，而且它会自动带上项目名，所以baseurl需要改为更目录。

相关文章

> [一步步在GitHub上创建博客主页(1)]({% post_url 2013-01-03-build-github-blog-page-01 %})
>
> [一步步在GitHub上创建博客主页(2)]({% post_url 2013-01-05-build-github-blog-page-02 %})
>
> 一步步在GitHub上创建博客主页(3)
>
> [一步步在GitHub上创建博客主页(4)]({% post_url 2013-01-05-build-github-blog-page-04 %})
>
> [一步步在GitHub上创建博客主页(5)]({% post_url 2013-01-07-build-github-blog-page-05 %})
> 
> [一步步在GitHub上创建博客主页(6)]({% post_url 2013-01-09-build-github-blog-page-06 %})
> 
> [一步步在GitHub上创建博客主页(7)]({% post_url 2013-01-20-build-github-blog-page-07 %})
> 
> [一步步在GitHub上创建博客主页-最新版]({% post_url 2014-07-04-build-github-blog-page-08 %})