---
layout: postlayout
title: 一步步在GitHub上创建博客主页(2)
description: 
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page, jekyll, liquid]
---

## 更多关于GitHub-Pages ##
本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇将带你快速搭建一个GitHub的项目主页，在开始之前你最好已经安装好了git客户端。上篇粗略介绍了GitHub和GitHub-Pages，我们知道它本意是为开源项目及其主页提供服务的，事实上，GitHub提供两种类型的主页

- 个人或组织主页
- 项目主页

对于普通的博主来说，用哪种并无所谓，本系列文章将采用项目主页，刚好我自己也有项目。更多关于主页类型，请参见：[User, Organization and Project Pages](https://help.github.com/articles/user-organization-and-project-pages)

另外，再次重申一下，`GitHub-Pages`仅仅为我们提供了静态页面的托管，不要说不能用`wordpress`，连基本的评论，访问统计都得自己想办法（幸好都有解决方案，后面会慢慢介绍）。


## 快速开始 ##

### 帐号注册 ###

在创建博客之前，当然必须有GitHub的帐号，该帐号将用来创建项目，默认的域名`username.github.com/projectName`中的`username`也要用到这个帐号。

> 注意：下面涉及到的一些命令凡是更用户名和项目名有关的一律会用这里的username和projectName代替，注意替换

访问：<http://www.github.com/>，注册你的username和邮箱，邮箱十分重要，GitHub上很多通知都是通过邮箱的。比如你的主页上传并构建成功会通过邮箱通知，更重要的是，如果构建失败的话也会在邮件中说明原因。


### 创建项目仓库 ###

在创建博客之前，还需要用已有的帐号创建一个项目，上面那个链接的projectName将是这里即将创建的项目名称。在Git中，项目被称为仓库(Repository)，仓库顾名思义，当然可以包含代码或者非代码。将来我们的网页或者模板实际上都是保存在这个仓库中的。

登录后，访问<https://github.com/new>，创建仓库如下图：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-02-img0.png)


创建了仓库后，我们就需要管理它，无论是管理本地仓库还是远程仓库都需要Git客户端。Git客户端实际上十分强大，它本身就可以offline的创建本地仓库，而本地仓库和远程仓库之间的同步也是通过Git客户端完成的。

这里省略了windows下安装和使用Git客户端的基本技巧，您应该已经掌握此技能了。虽然，您仍然可以按照本教程的指引完成一个简单的网站，但是后期的维护工作无论如何都不能少了这项技能。

下面的步骤假设您已经安装好了Git客户端，安装和使用技巧请参见：[Git学习资源]({% post_url 2013-01-03-git-resource %})

 
### 本地编辑及上传 ###

在磁盘上创建一个目录，该目录与上面的项目名同名，在该目录下启用Git Bash命令行，并输入如下命令

{% highlight bash %}
$git init
{% endhighlight %}

该命令实际上是在该目录下初始化一个本地的仓库，会在目录下新建一个`.git`的隐藏文件夹，可以看成是一个仓库数据库。

创建一个没有父节点的分支`gh-pages`，并自动切换到这个分支上：

{% highlight bash %}
$git checkout --orphan gh-pages
{% endhighlight %}

在Git中，`分支(branch)`的概念非常重要，Git之所以强大，很大程度上就是因为它强大的分支体系。这里的分支名字必须是`gh-pages`，因为github规定，在项目类型的仓库中，只有该分支中的页面，才会生成网页文件。


在该目录下手动创建如下文件和文件夹，最终形成这样的结构：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-02-img1.png)

- _includes：默认的在模板中可以引用的文件的位置，后面会提到
- _layouts：默认的公共页面的位置，后面会提到
- _posts：博客文章默认的存放位置
- .gitignore：git将忽略这个文件中列出的匹配的文件或文件夹，不将这些纳入源码管理
- _config.yml：关于jekyll模板引擎的配置文件
- index.html：默认的主页

在`_layouts`目录下创建一个`default.html`，在其中输入如下内容，特别注意：文件本身要以UTF-8 without BOM的格式保存，以防止各种编码问题，建议使用notepad++或sublime编辑


<pre>
<code>&#60;!DOCTYPE html>
	&#60;html>
	&#60;head>
	　&#60;meta http-equiv="content-type" content="text/html; charset=utf-8" />
	　&#60;title>一步步在GitHub上创建博客主页(2)&#60;/title>
	&#60;/head>
	&#60;body>
	　&#123;{content }}
	&#60;/body>
	&#60;/html></code>
</pre>

编辑index.html

{% highlight html %}
---
layout: default
title: test title
---
<p>Hello world!</p>
{% endhighlight %}

编辑_config.yml

{% highlight bash %}

encoding: utf-8

{% endhighlight %}

再次打开Git Bash，先后输入如下命令：

{% highlight bash %}
# 将当前的改动暂存在本地仓库
$ git add .
# 将暂存的改动提交到本地仓库，并写入本次提交的注释是”first post“
$ git commit -m "first post"
# 将远程仓库在本地添加一个引用：origin
$ git remote add origin https://github.com/username/projectName.git
# 向origin推送gh-pages分支，该命令将会将本地分支gh-pages推送到github的远程仓库，并在远程仓库创建一个同名的分支。该命令后会提示输入用户名和密码。
$ git push origin gh-pages
{% endhighlight %}

> 据网友反应，如果是初次安装git的话，在commit的时候会提示需要配置username和email，请读者注意根据提示配置一下，至于username和email可以随便填

现在，你可以泡杯咖啡，并等大约10分钟的时间，访问<http://username.github.com/projectName>就可以看到生成的博客了

另外上面提到的，无论生成失败还是成功，Github会向你的邮箱发送一封邮件说明，请注意查收。