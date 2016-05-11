---
layout: postlayout
title: 一步步在GitHub上创建博客主页-最新版
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page, jekyll]
---

记得在2013年初，刚刚接触到github-page，当时关于如何搭建github博客的文章还很少，而且整个过程对于新手来讲还是比较复杂的，所以笔者写了一整个系列来记录如何搭建github博客。在一年多的时间里，笔者的系列文章也被不少的网友转载，从ga的统计看，来到这个博客的网友大多都是来看这个系列文章的，也有不少的网友通过其他的方式联系到我，一起探讨构建博客的问题。一年多的时间里，笔者的主要精力是写好博客的文章，并没有花时间研究github在个人主页上面进行了何种改进，仍然沿用以前的那套方式和方法。不过在跟网友的沟通中也隐隐感觉到github已经有了很大的改进，但是苦于没有很多的精力来研究。前一段时间，github的一封邮件触发了我重新学习和改进，以及这篇文章，原文如下：

> The page build completed successfully, but returned the following warning:
> 
> GitHub Pages recently underwent some improvements ([https://github.com/blog/1715-faster-more-awesome-github-pages](https://github.com/blog/1715-faster-more-awesome-github-pages)) to make your site faster and more awesome, but we've noticed that pchou.info isn't properly configured to take advantage of these new features. While your site will continue to work just fine, updating your domain's configuration offers some additional speed and performance benefits. Instructions on updating your site's IP address can be found at [https://help.github.com/articles/setting-up-a-custom-domain-with-github-pages#step-2-configure-dns-records](https://help.github.com/articles/setting-up-a-custom-domain-with-github-pages#step-2-configure-dns-records), and of course, you can always get in touch with a human at support@github.com. For the more technical minded folks who want to skip the help docs: your site's DNS records are pointed to a deprecated IP address. 
> 
> For information on troubleshooting Jekyll see:
> 
>   [https://help.github.com/articles/using-jekyll-with-pages#troubleshooting](https://help.github.com/articles/using-jekyll-with-pages#troubleshooting)
> 
> If you have any questions please contact us at [https://github.com/contact](https://help.github.com/articles/using-jekyll-with-pages#troubleshooting).

大致的意思是说我的博客设置过时了，无法享受到新功能。通过阅读链接，发现新的功能是通过CDN加速访问！这个功能可以说是很多博主梦寐以求的，因为在国内访问github一直是很慢的。于是，决定开始改进。在改进的过程中，笔者发现github个人主页的做法有很大的变化，很多东西都变得简单。需要重新的梳理一下，于是便有了本文。


## 再谈github-page ##

### github page ###

[github-page](https://pages.github.com/)是一个免费的静态网站托管平台，由github提供，它具有以下特点：

1. 免空间费，免流量费
2. 具有项目主页和个人主页两种选择
3. 支持页面生成，可以使用jekyll来布局页面，使用`markdown`来书写正文
4. 可以自定义域名


### 项目主页 ###

项目主页的目的是为项目提供一个展示功能的网站，方便项目推广。但是也可以用来做个人博客。对于博客来说，博客的整个网站目录需要是项目仓库的`gh-pages`分支，而且`gh-pages`是个没有父分支的分支。通过[https://pages.github.com/](https://pages.github.com/)上的向导，在你的项目仓库中创建这样的分支，并且github还提供了多种模板供你选择：

![](https://pages.github.com/images/choose-layout@2x.png)

通过向导自动创建的项目类似这样[http://pchou.github.io/pagetest/](http://pchou.github.io/pagetest/)，在使用自定义域名前，你需要通过这样的链接访问项目主页。它是一个纯粹为项目推广准备的，因此并没有博客的结构，但是自定义模板的功能确实很不错。

手动创建分支的方法，也很简单，可以参考[Creating Project Pages manually](https://help.github.com/articles/creating-project-pages-manually)

### 个人主页 ###

每个帐号只能有一个仓库来存放个人主页，而且仓库的名字必须是`username/username.github.io`，这是特殊的命名约定。你可以通过`http://username.github.io`来访问你的个人主页。

通过向导很容易创建一个仓库，并测试成功。不过，同样的，没有博客的结构。需要注意的个人主页的网站内容是在`master`分支下的。


## 本地环境搭建 ##

这一步不是必须的，但是强烈建议完成。因为在博客发布之前，通常都是需要在本地先检验一下的。笔者曾经在`一步步在GitHub上创建博客主页(4)`中详细描述了如何构建一个本地环境。不过现在情况变的更简单了，github有一个对应的gem，可以"一键"配置环境，具体可以参考[Using Jekyll with Pages](https://help.github.com/articles/using-jekyll-with-pages)。这里稍微提一下：

### Ruby安装 ###

参考`一步步在GitHub上创建博客主页(4)`

### 安装Bundle

直接使用下面命令即可：

{% highlight bash %}
$ gem install bundle
{% endhighlight %}

### Gemfile和Bundle安装

在更目录下创建一个叫`Gemfile`的文件，注意没有后缀，输入

{% highlight bash %}
source 'https://ruby.taobao.org/'
gem 'github-pages'
{% endhighlight %}

保存后，在命令行中执行

{% highlight bash %}
$ bundle install
{% endhighlight %}

命令会根据当前目录下的`Gemfile`，安装所需要的所有软件。这一步所安装的东西，可以说跟`github`本身的环境是完全一致的，所以可以确保本地如果没有错误，上传后也不会有错误。而且可以在将来使用下面命令，随时更新环境，十分方便

{% highlight bash %}
$ bundle update
{% endhighlight %}

使用下面命令，启动转化和本地服务：

{% highlight bash %}
$ bundle exec jekyll serve
{% endhighlight %}



## 使用现成的模板 ##

博客基于`jekyll`，而新手往往摸不着头脑，幸好有一些[现成的模板](http://jekyllthemes.org)可以直接使用：

![](http://pchou.qiniudn.com/2014-07-04-build-github-blog-page-08-img-00.jpg)

以[White Paper](http://jekyllthemes.org/themes/white-paper/)这个模板为例，可以直接下载压缩包，也可以使用如下命令clone到本地：

{% highlight bash %}
$ git clone https://github.com/vinitkumar/white-paper.git
{% endhighlight %}

把克隆下来的文件拷贝到你自己的目录就行了，这样你就有一个现成的网站结构了：

![](http://pchou.qiniudn.com/2014-07-04-build-github-blog-page-08-img-01.jpg)


## 自定义域名的新玩法 ##

以前，通过在域名提供商那边，将你的域名指向`204.232.175.78`，再在分支里面新建一个`CNAME`文件，里面写上你的域名就可以实现自定义域名了。如今github有了新的玩法：

1. A记录：域名直接映射IP，但是这个IP换成了`192.30.252.153`或`192.30.252.154`。
2. 如果域名提供商支持`ALIAS`或`ANAME`，将域名指向`username.github.io`，这样可以在域名解析的时候得到一个动态的IP，这个IP是一台离你最近的镜像主机
3. CNMAE：如果你希望使用二级域名访问，将一个二级域名配置成CNAME，指向`username.github.io`，这样可以在域名解析的时候得到一个动态的IP，这个IP是一台离你最近的镜像主机

其中2、3两种方式能够享受CDN加速，因为域名不是直接与IP地址映射的，github就有机会帮用户选择最近的镜像主机提供服务。但是笔者先前是直接将在A记录里面将主域`pchou.info`和`www.pchou.info`指向了`204.232.175.78`。这也是为什么github会给我警告的原因。但是改进有些令人发愁，因为希望保留别人对我的外链啊，那么如何改进呢？

首先删除`www.pchou.info`的A记录，添加CNAME记录

> www.pchou.info -> pchou.github.io

使用dig查看域名解析情况

	www.pchou.info.         1799    IN      CNAME   pchou.github.io.
	pchou.github.io.        3600    IN      CNAME   github.map.fastly.net.
	github.map.fastly.net.  280     IN      A       103.245.222.133

可以看到，CDN最终为我选择了IP地址为`103.245.222.133`的镜像主机

修改或添加项目中的CNAME文件，变成如下：

	www.pchou.info

等待十几分钟即可。

当访问`pchou.info`的时候会自动重定向到`www.pchou.info`，于是访问一台IP为`103.245.222.133`的镜像主机
当访问`www.pchou.info`会访问一台IP为`103.245.222.133`的镜像主机

github在这里自动将`www`的子域与主域关联了起来，并有如下行为：

> 如果仓库的CNAME文件包含`example.com`，那么访问`www.example.com`会重定向到`example.com`
> 如果仓库的CNAME文件包含`www.example.com`，那么访问`example.com`会重定向到`www.example.com`


经过测试，使用CDN后，速度可以提高一倍：

ping最早的IP

	PING 204.232.175.78 (204.232.175.78) 56(84) bytes of data.
	64 bytes from 204.232.175.78: icmp_seq=1 ttl=48 time=280 ms
	64 bytes from 204.232.175.78: icmp_seq=3 ttl=46 time=243 ms
	64 bytes from 204.232.175.78: icmp_seq=4 ttl=48 time=273 ms
	64 bytes from 204.232.175.78: icmp_seq=5 ttl=46 time=239 ms
	64 bytes from 204.232.175.78: icmp_seq=6 ttl=46 time=239 ms
	64 bytes from 204.232.175.78: icmp_seq=7 ttl=46 time=236 ms
	64 bytes from 204.232.175.78: icmp_seq=8 ttl=46 time=238 ms

ping后来的IP

	PING 192.30.252.153 (192.30.252.153) 56(84) bytes of data.
	64 bytes from 192.30.252.153: icmp_seq=1 ttl=47 time=358 ms
	64 bytes from 192.30.252.153: icmp_seq=2 ttl=47 time=345 ms
	64 bytes from 192.30.252.153: icmp_seq=5 ttl=47 time=359 ms
	64 bytes from 192.30.252.153: icmp_seq=6 ttl=47 time=351 ms
	64 bytes from 192.30.252.153: icmp_seq=7 ttl=47 time=370 ms

ping动态的IP

	PING 103.245.222.133 (103.245.222.133) 56(84) bytes of data.
	64 bytes from 103.245.222.133: icmp_seq=1 ttl=53 time=84.5 ms
	64 bytes from 103.245.222.133: icmp_seq=2 ttl=54 time=118 ms
	64 bytes from 103.245.222.133: icmp_seq=3 ttl=53 time=104 ms
	64 bytes from 103.245.222.133: icmp_seq=4 ttl=54 time=118 ms
	64 bytes from 103.245.222.133: icmp_seq=5 ttl=53 time=104 ms
	64 bytes from 103.245.222.133: icmp_seq=6 ttl=53 time=82.5 ms


## jekyll的一些新玩法

### 首页分页列表分页

分页只可用在html页面中，不能用在markdown

只需在`_config.yml`中配置如下两个参数即可

{% highlight yaml %}
paginate: 5 # 指定每页多少条
paginate_path: "page:num" # 指定每页的url
{% endhighlight %}

在目录页面通过`paginator`对象访问分页的一些参数。详见[Pagination](http://jekyllrb.com/docs/pagination/)


### 语法高亮

以往使用一些语法高亮的js解决方案，如今jekyll可以和[pygments](http://pygments.org/languages)，结合在生成html的时候就对代码块进行分析。只需在文章中使用如下语法即可：

	{% raw %}
	{% highlight bash %}
	$ gem install bundler
	{% endhighlight %}
	{% endraw %}


### 多种Markdown解释器的选择

[Markdown解释器很多]({% post_url 2014-07-07-something-about-markdown %})，各自有各自的扩展和特点，你可以自由选择了，只需要在`_config.yml`中指定就行了：

{% highlight yaml %}
markdown:      kramdown #默认使用kramdown
{% endhighlight %}
