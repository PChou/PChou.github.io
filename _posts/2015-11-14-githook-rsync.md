---
layout: postlayout
title: githook+rsync简单实现web部署
categories: [open-source]
tags: [Git,Gitolite,Hook,rsync]
---

最近想实现利用githook发布php程序，本来对githook已经是有所了解了，在hook里面用scp实现复制，但是发现每次发布耗时太长，于是考虑用rsync来同步代码，因为rsync是基于增量同步的，应该能极大缩减发布时间。当然现在有不少现成的持续集成系统，之所以不选择这些集成方案，一来是规模小，并没有达到那个必要性，二来也是进一步锻炼对linux的理解。

## Git Hook

之前使用Git hook实现过jekyll的转化和发布，在[Gitolite实现hook，Jekyll自动构建发布]({% post_url 2014-04-03-git-gitolite-hook %})里面有记录，这里就不多谈了。

总之，使用git的服务端hook技巧可以实现一些简单的push触发自定义动作的功能。


## Web服务的发布思路

web服务器A，源码(git)服务器B，从B将最新push的代码复制到web服务器A，使用rsync复制，由于在copy过程中，从dev代码到生产的代码其中必然有一些微小的变化，比如数据库配置等信息是不需要变更的，文件的所属和权限有变化。基于这个需求，设计由开发人员提交一个shell脚本，git服务器在hook里面调用这个脚本`deploy.sh`。当然git服务器的原始hook脚本，在调用`deploy.sh`前后需要进行一些基本的现场搭建和清理工作。另外web服务器A和git服务器B都需要安装rsync，A上的rsync以服务端模式工作，配置开机自启动，文件推送时需要认证。

## rsync安装

我们需要安装`rsync3.1.0`以上版本，以支持推送端设置目的端的用户所属功能：

> Rsync version 3.1.0 has been released. This is a feature release that improves performance, provides several new options, and fixes a few bugs along the way.

这里的`several new options`包含我需要的新功能

>  - Added the --usermap/--groupmap/--chown options for manipulating file
      ownership during the copy.

在`rsync官网`的下载列表里提供了3.1.1版本的源码包，我们就下载这个源码包来安装，如果系统中已经存在旧版的rsync，可以尝试删除，不过不删除也没关系，似乎rsync在安装时会只保留一个。

{% highlight bash %}

wget https://download.samba.org/pub/rsync/src/rsync-3.1.1.tar.gz
tar -zxvf rsync-3.1.1.tar.gz
cd rsync-3.1.1.tar.gz
./configure
make
make install

{% endhighlight %}

上述的下载，解压，配置，编译，安装就不多说了，都很常规的。测试一下rsync是否安装好，一般安装到`/usr/local/bin/rsync`

{% highlight bash %}

which rsync
/usr/local/bin/rsync

{% endhighlight %}

## rsync服务端配置

在两台服务器上安装好rsync后，需要开始配置，先来配置服务端，即web服务器A，以下操作以root权限进行

编辑`/etc/rsyncd.conf`文件，如果不存在这个文件则创建，该文件的权限最好设置为600：

{% highlight bash %}

# 基本配置，注意uid和gid需要是root，否则无法指定目标文件的所属用户和所属组
secrets file = /etc/rsyncd.secrets
read only = no
write only = no
list= yes
uid = root
gid = root
max connections = 5
hosts allow = *
hosts deny = *
use chroot = no
log file = /var/log/rsyncd.log
pid file = /var/run/rsyncd.pid

# 配置一个模块，一个模块就是一个可以进行同步的目录，可以配置多个模块意味着接受多个目录的同步请求，模块名www是随意起的，客户端在发起同步时需指定模块名
[www]
path = /alidata/www/default/api-test
# 设置访问的用户必须为rsync，这个用户是虚拟的，不需要在系统中创建这个用户。客户端进行推送的时候指定即可
auth users = rsync
# 设置密码文件位置，这里保存了rsync用户的密码
secrets file = /etc/rsyncd.secrets

{% endhighlight %}

配置文件的说明在注释里面说了，不再累述。

编辑`/etc/rsyncd.secrets`密码文件，必须为600权限，这个文件在上面的配置文件中指定使用的。这个文件的格式为`username:password`：

{% highlight bash %}
rsync:123456
{% endhighlight %}

测试启动rsync

{% highlight bash %}
rsync --daemon --config=/etc/rsyncd.conf
{% endhighlight %}

如果需要随机启动，可以使用`xinetd`来做，rsync安装时，默认会创建`/etc/xinetd.d/rsync`配置文件，打开这个文件

{% highlight bash %}

service rsync
{
    disable = no
    flags           = IPv6
    socket_type     = stream
    wait            = no
    user            = root
    server          = /usr/local/bin/rsync
    server_args     = --daemon
    log_on_failure  += USERID
}

{% endhighlight %}

注意把`disable`和`server`配置正确了。

`xinetd`是个服务管理器，他会负责管理一些轻量级的，非独立的服务。负责启动，端口映射，调度这些服务。上面的配置文件是针对`xinetd`寄宿`rsync`所配置的。如果系统中没有安装`xinetd`则可以使用yum来安装

{% highlight bash %}
yum -y install xinetd
{% endhighlight %}

安装完成后，可以使用`chkconfig`来配置自启动，由于`xinetd`自启动，而它又负责管理`rsync`服务，这样就可以简单的实现`rsync`随机启动。


## rsync客户端安装

在git源码服务器B上，同样安装rsync 3.1.0以上版本，rsync实际上既可以工作在服务端模式，也可以工作在客户端模式。

由于服务端设置了认证才能推送，所以客户端需要编写密码文件，并提前放在一个地方，方便rsync命令调用，假设这里放在`/home/git/rsync.passwd`，必须为600权限，其中的内容为：

{% highlight bash %}
123456
{% endhighlight %}

注意这里只填密码

## githook脚本

在基于gitolite的仓库中找到web项目，并编译`post-update`脚本

{% highlight bash %}
GIT_REPO=$HOME/repositories/yyk-php.git
TMP_GIT_CLONE=$HOME/tmp/api-test

mkdir -p $TMP_GIT_CLONE
#从本机clone仓库到临时目录
git clone $GIT_REPO $TMP_GIT_CLONE
#进入到临时目录，并执行其中的deploy.sh
cd $TMP_GIT_CLONE && chmod +x deploy.sh && ./deploy.sh
echo 'deploying complete.'
#删除临时目录
rm -rf $TMP_GIT_CLONE

{% endhighlight %}

脚本很简单，就是clone到临时目录，并执行其中的deploy.sh，那么我们rsync命令应该写在deploy.sh中，并随源码提交。需要注意的是，执行脚本的用户为git服务器上的git用户，权限相对不大。


## 发布脚本

在网站代码的根目录创建一个deploy.sh文件，其中编写同步代码和其他相关代码，下面是例子：

{% highlight bash %}

#!/bin/bash

# current dir is the same as this script
# current user is git
# make sure /home/git/rsync.passwd is exist and has 600 permission ( for the rsync password )
# need rsync 3.10+ support also server should be 3.10+ 

echo 'Hello world!'
rm -rf .git
rm -r .gitignore
rm -rf protected/config
rm -f index-test.php
mkdir -p protected/runtime
rsync -av ./ rsync@192.168.1.102::www --chown=www:www --password-file=/home/git/rsync.passwd --exclude=deploy.sh

{% endhighlight %}

注意脚本中的rsync调用：

- -av表示归档模式和显示过程，可递归同步
- ./ 本地的目录，将当前目录的所有文件作为源，如果不加最后的斜杠，会在目标目录创建一个目录
- rsync@192.168.1.102::www 表示以rsync用户，上传到服务器的www模块，www模块事先在服务端中配置好了
- --chown=www:www 这就是rsync3.1.0版本以上才有的新功能，可以指定目标文件以username:group的所属组存在。这里取决于web服务器的web服务是以什么用户启动的
- --password-file 指定密码文件，提前在git服务器上放置好
- --exclude 排除某些文件不同步

## 结语

这样，就利用了git和hook功能和rsync的同步功能实现简单的自动发布功能。

[rsync官网](https://rsync.samba.org/)

[Rsync安全配置](http://drops.wooyun.org/papers/161)

[Gitolite实现hook，Jekyll自动构建发布]({% post_url 2014-04-03-git-gitolite-hook %})






