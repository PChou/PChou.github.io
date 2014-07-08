---
layout: postlayout
title: Gitolite实现hook，Jekyll自动构建发布
thumbimg: 28091602_aRPU.png
categories: [open-source]
tags: [Git,Gitolite,Hook,jekyll]
---

## git的hook功能 ##
Git系统支持服务端hook和客户端hook，使用hook可以实现一些git相关的自动化任务，比如类似Github的博客系统。本文基于Gitolite构建的git服务端，实现服务端hook，并利用jekyll自动构建静态页面。所谓git的hook，实际上就是在git的提交和推送过程中，进行的一些自动化行为注入。比如可以在用户commit的时候对commit的message进行一些改动，再提交；或者在服务器端当仓库push的时候，发送邮件给相关的人，提醒有人push了代码等。

git的这种注入分为服务端hook和客户端hook。网上关于git注入的文章不是很多，而且大多是国外的文章，讲得有些复杂，笔者研究了整整半天，最后用很简单的方式实现了功能。

本文重点实现的是服务端hook，利用gitolite搭建的git服务端，实现了push到服务端后自动使用Jekyll构建网站静态页面，并发布。

## 环境 ##
首先假设你已经正确的完成`gitolite`的安装和配置(安装参考[Gitolite 构建 Git 服务器](http://www.ossxp.com/doc/git/gitolite.html))，拥有若干的仓库。在服务端`gitolite`是由一个非root帐号安装的，一般是`git`这个账户，所以先看下仓库在服务端是如何存放的：

	$ ls -l /home/git/repositories/

	drwx------. 7 git git 4096 Mar 24 20:03 doconline.git
	drwxrwxrwx. 8 git git 4096 Mar 25 17:09 gitolite-admin.git
	drwx------. 7 git git 4096 Sep  6  2013 testing.git
	drwx------. 7 git git 4096 Nov 18 20:25 wonderful.git

看到，除了`gitolite-admin.git`是管理`gitolite`本身的仓库，其他都是自己创建的仓库，其中我们要用的是`doconline.git`这个仓库，进一步查看这个仓库下的内容：

	$ ls -l /home/git/repositories/doconline.git/
	
	drwx------.   2 git git 4096 Mar 24 20:03 branches
	-rw-------.   1 git git   66 Mar 24 20:03 config
	-rw-------.   1 git git  125 Mar 25 17:09 gl-conf
	-rw-------.   1 git git   23 Mar 24 20:03 HEAD
	drwx------.   2 git git 4096 Mar 29 00:29 hooks
	drwx------.   2 git git 4096 Mar 24 20:03 info
	drwx------. 103 git git 4096 Mar 29 00:30 objects
	drwx------.   4 git git 4096 Mar 24 20:03 refs

其中hooks目录存放了很多脚本，这些脚本就是hook脚本，可以修改它们，但是必须去掉`.sample`的后缀，脚本才能生效。换句话说，只要是这个目录下的脚本名与git的触发事件名一样的脚本都会执行。这就是hook的基本原理。也可以使用link，就像`update`那个脚本那样：

	-rwx------. 1 git git  452 Mar 24 20:03 applypatch-msg.sample
	-rwx------. 1 git git  896 Mar 24 20:03 commit-msg.sample
	-rwx------. 1 git git  160 Mar 24 20:03 post-commit.sample
	-rwx------. 1 git git  933 Mar 29 00:29 post-receive
	-rwx------. 1 git git  548 Mar 24 20:03 post-receive.sample
	-rwx------. 1 git git  189 Mar 24 20:03 post-update.sample
	-rwx------. 1 git git  398 Mar 24 20:03 pre-applypatch.sample
	-rwx------. 1 git git 1578 Mar 24 20:03 pre-commit.sample
	-rwx------. 1 git git 1239 Mar 24 20:03 prepare-commit-msg.sample
	-rwx------. 1 git git 4951 Mar 24 20:03 pre-rebase.sample
	lrwxrwxrwx. 1 git git   39 Mar 24 20:03 update -> /home/git/.gitolite/hooks/common/update
	-rwx------. 1 git git 3611 Mar 24 20:03 update.sample

注意到其中的`post-receive`就是我所编写的注入脚本：

{% highlight sh %}
#!/bin/sh
GIT_REPO=$HOME/repositories/doconline.git
TMP_GIT_CLONE=$HOME/tmp/doconline
PUBLIC_WWW=/var/www/html/doconline

mkdir -p $TMP_GIT_CLONE
git clone $GIT_REPO $TMP_GIT_CLONE
cd $TMP_GIT_CLONE && jekyll build $TMP_GIT_CLONE -d $PUBLIC_WWW
cd ~ && rm -rf $TMP_GIT_CLONE

find $PUBLIC_WWW -type f -print0 | xargs -0 chmod 666
find $PUBLIC_WWW -type d -print0 | xargs -0 chmod 777

exit
{% endhighlight %}

这段脚本是shell脚本，理论上可以使用任何脚本语言例如`Perl`、`Python`、`Ruby`等，不过执行这个脚本的用户将是`git`，要注意`git`用户对系统的操作权限。还要注意`post-receive`这个脚本需要能够有执行权限。

脚本首先建立目录，使用`git`程序克隆最新的仓库代码，然后调用`jekyll`转化，输出目标路径是网站的路径，然后删除克隆下来的代码，以便下次克隆。最后设置网站目录的权限。

由此可见，服务器上必须安装有`git`(这是必然安装的，因为安装和配置`gitolite`的时候需要)，然后就是安装jekyll，比较推荐的顺序是先安装Ruby1.9.3以上版本，然后用gem安装jekyll

## jekyll的安装 ##
jekyll在linux上的安装颇为坎坷，这出乎我的意料之外。

首先，安装libyaml：

{% highlight bash %}
$ wget http://pyyaml.org/download/libyaml/yaml-0.1.4.tar.gz
$ tar xzvf yaml-0.1.4.tar.gz
$ cd yaml-0.1.4
$ ./configure --prefix=/usr/local
$ make
$ make install
{% endhighlight %}

然后，安装一些基础包，用于编译Ruby：

{% highlight bash %}
$ yum install openssl-devel zlib-devel gcc gcc-c++ make autoconf readline-devel curl-devel expat-devel gettext-devel
{% endhighlight %}

如果需要移除Ruby，使用这个命令
	
{% highlight bash %}
$ yum erase ruby ruby-libs ruby-mode ruby-rdoc ruby-irb ruby-ri ruby-docs
{% endhighlight %}

然后，从[这里](http://ruby.taobao.org/mirrors/ruby/)下载ruby的源码，版本一定要大于1.9.3，笔者下载的版本：

{% highlight bash %}
$ wget http://ruby.taobao.org/mirrors/ruby/ruby-1.9.3-p545.tar.gz
{% endhighlight %}

解压并编译安装：

{% highlight bash %}
$ tar zxvf ruby-1.9.3-p545.tar.gz
$ cd ruby-1.9.3-p545
$ ./configure
$ make && make install
{% endhighlight %}

检验安装：

{% highlight bash %}
$ ruby -v
$ gem --version
{% endhighlight %}

最后用gem安装jekyll：

{% highlight bash %}
$ gem install jekyll -v 1.4.2
{% endhighlight %}

测试jekyll安装：
	
{% highlight bash %}
$ jekyll --version
{% endhighlight %}

万事俱备，你可以接下来使用试验`git push`，如果一切正常的话，服务端的信息会回显到git客户端上：

	$ git push
	Counting objects: 7, done.
	Delta compression using up to 4 threads.
	Compressing objects: 100% (4/4), done.
	Writing objects: 100% (4/4), 384 bytes, done.
	Total 4 (delta 3), reused 0 (delta 0)
	remote: Initialized empty Git repository in /home/git/tmp/doconline/.git/
	remote: Configuration file: /home/git/tmp/doconline/_config.yml
	remote:             Source: /home/git/tmp/doconline
	remote:        Destination: /var/www/html/doconline
	remote:       Generating... done.
	To git@192.168.3.158:doconline.git
	   dd83699..3215080  master -> master


中间多出来的就是Jekyll在build的时候的标准输出。如果你使用的jekyll版本与我不一致的话jekyll的命令行参数写法或者输出可能都不太一样，需要注意。

## 后记 ##
网上有些资料对hook讲的特别复杂，经过我的理解，总结出这么个快速实现的方法。还有一些“高级的”(看不明白)hook技巧存在。读者可以自行研究

## 其他参考资料 ##

[hook可用事件集合](http://gitbook.liuhui998.com/5_8.html)

[A Pure Git Deploy Workflow (with Jekyll and Gitolite)](http://blog.zerosum.org/2010/11/01/pure-git-deploy-workflow.html)

[关于gitolite其他的hook技巧](http://demonastery.org/tag/gitolite.html)

[Adding Custom Hooks to Gitolite](http://therub.org/2012/05/24/adding-custom-hooks-to-gitolite-v3/)

[gitolite官方关于hook](http://gitolite.com/gitolite/cust.html#hooks)
