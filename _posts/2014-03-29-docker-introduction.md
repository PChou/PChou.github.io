---
layout: postlayout
title: Docker简介与入门
thumbimg: homepage-docker-logo.png
categories: [open-source]
tags: [docker,dockerfile]
---

## 缘起 ##
Docker是个新生的事物，概念类似虚拟化。网上关于Docker入门的东西已经很多了。不过本文探讨了Docker的特点、特性、原理，还介绍了具有中国特色的安装测试过程，另外还谈到了Docker的社区生态和Dockerfile，并使用Dockerfile构建一个nginx环境。在几个月前听说Docker，但是一直没有时间去研究，前一段时间趁着azure免费试用，赶紧实验一下，但是卡在了ubuntu基础镜像的下载上(由于国内网络的特殊原因)，所以也就搁浅了。在逛[Segmentfault](http://segmentfault.com/)的时候，看到上面有个[Docker子站问答](http://segmentfault.com/docker)，逛了逛果然有干货，于是重新试了一下，这里把经验和体会分享一下。

## Docker简介 ##
我觉得简单来说，[Docker](https://www.docker.io/)就是一个应用程序执行容器，类似虚拟机的概念。但是与虚拟化技术的不同点在于下面几点：

1. 虚拟化技术依赖物理CPU和内存，是硬件级别的；而docker构建在操作系统上，利用操作系统的containerization技术，所以docker甚至可以在虚拟机上运行。
2. 虚拟化系统一般都是指操作系统镜像，比较复杂，称为“系统”；而docker开源而且轻量，称为“容器”，单个容器适合部署少量应用，比如部署一个redis、一个memcached。
3. 传统的虚拟化技术使用快照来保存状态；而docker在保存状态上不仅更为轻便和低成本，而且引入了类似源代码管理机制，将容器的快照历史版本一一记录，切换成本很低。
4. 传统的虚拟化技术在构建系统的时候较为复杂，需要大量的人力；而docker可以通过Dockfile来构建整个容器，重启和构建速度很快。更重要的是Dockfile可以手动编写，这样应用程序开发人员可以通过发布Dockfile来指导系统环境和依赖，这样对于持续交付十分有利。
5. Dockerfile可以基于已经构建好的容器镜像，创建新容器。Dockerfile可以通过社区分享和下载，有利于该技术的推广。

Docker的主要特性如下（摘自[Docker：具备一致性的自动化软件部署](http://www.infoq.com/cn/news/2013/04/Docker))：

1. 文件系统隔离：每个进程容器运行在完全独立的根文件系统里。
2. 资源隔离：可以使用cgroup为每个进程容器分配不同的系统资源，例如CPU和内存。
3. 网络隔离：每个进程容器运行在自己的网络命名空间里，拥有自己的虚拟接口和IP地址。
4. 写时复制：采用写时复制方式创建根文件系统，这让部署变得极其快捷，并且节省内存和硬盘空间。
5. 日志记录：Docker将会收集和记录每个进程容器的标准流（stdout/stderr/stdin），用于实时检索或批量检索。
6. 变更管理：容器文件系统的变更可以提交到新的映像中，并可重复使用以创建更多的容器。无需使用模板或手动配置。
7. 交互式Shell：Docker可以分配一个虚拟终端并关联到任何容器的标准输入上，例如运行一个一次性交互shell。

目前Docker正处在开发阶段，官方不建议用于生产环境。**另外，Docker是基于Ubuntu开发的，所以官方推荐将其安装在Ubuntu的操作系统上，目前只能安装在linux系统上**。


## Docker的使用入门 ##
[Docker官方的安装指导](http://docs.docker.io/en/latest/installation/ubuntulinux/)挺详细的。但是由于国内的特殊情况，我这里基于这个安装指导，给出适用于国内开发者的入门过程。基于`Ubuntu Precise 12.04 (LTS) (64-bit)`，推荐这个版本，其他版本参考官方安装手册。

### Docker的安装 ###
首先，Docker官方声称最好是运行在Linux内核3.8以上，所以要先进行内核升级
	
{% highlight bash %}
# install the backported kernel
sudo apt-get update
sudo apt-get install linux-image-generic-lts-raring linux-headers-generic-lts-raring

# reboot
sudo reboot
{% endhighlight %}

添加Docker仓库的key：

{% highlight bash %}
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
{% endhighlight %}

添加镜像，这里直接用俄罗斯的[Yandex](http://yandex.ru/)

{% highlight bash %}
sudo sh -c "echo deb http://mirror.yandex.ru/mirrors/docker/ docker main > /etc/apt/sources.list.d/docker.list"
sudo apt-get update
{% endhighlight %}

安装Docker
{% highlight bash %}
sudo apt-get install lxc-docker
{% endhighlight %}

一般上面的步骤不会有任何问题。

### Docker镜像下载 ###
Docker运行至少需要一个ubuntu的基础镜像，这个镜像会在你初次尝试执行时自动下载，不过从国内直接用基本上就别想了，需要使用代理。这里用[Docker中文社区](http://www.dockboard.org/)提供的代理。[出处1](http://segmentfault.com/q/1010000000405777),[出处2](http://www.dockboard.org/docker-http-proxy-with-golang/)。

修改`/etc/default/docker`文件，取消注释`http_proxy`的部分：

{% highlight sh %}
# If you need Docker to use an HTTP proxy, it can also be specified here.
export http_proxy=http://192.241.209.203:8384/
{% endhighlight %}

经过笔者测试，上面这个代理也不是很稳定，可能用的人比较多吧。

可用的代理地址（持续关注中）

> http://192.241.209.203:8384  

然后，你就可以执行下面的命令，测试执行了，由于代理不是很稳定，可能需要多尝试几次(淡定)：

{% highlight bash %}
sudo docker run -i -t ubuntu /bin/bash
{% endhighlight %}

下面这个截图是我成功pull完成，并测试hello world成功(大概尝试了3-4次)：
![docker-introduction-1](http://pchou.qiniudn.com/docker-introduction-1.jpg)

## Docker的社区和生态 ##
### 仓库和镜像 ###
评估一项开源技术很大程度上需要关注它的社区和生态。Docker的生态是通过推送和拉取特定的“镜像(image)包”来展开的。你可以从[docker index](https://index.docker.io/)上搜索需要的镜像。也可以通过下面的命令搜索：

{% highlight bash %}
sudo docker search
{% endhighlight %}

镜像可以看作是包含有某些软件的容器系统，比如[ubuntu](https://index.docker.io/_/ubuntu/)就是一个官方的基础镜像，很多镜像都是基于这个镜像“衍生”，该镜像包含基本的ubuntu系统。再比如，[hipache](https://index.docker.io/_/hipache/)是一个官方的镜像容器，运行后可以支持http和websocket的代理服务，而这个镜像本身又基于[ubuntu](https://index.docker.io/_/ubuntu/)。

通过`pull`来拉取镜像，将镜像下载到本地，比如

{% highlight bash %}
sudo docker pull hipache
{% endhighlight %}

通过`images`查看现在有哪些镜像：

{% highlight bash %}
sudo docker images

REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
ubuntu              13.10               9f676bd305a4        6 weeks ago         178 MB
ubuntu              saucy               9f676bd305a4        6 weeks ago         178 MB
ubuntu              13.04               eb601b8965b8        6 weeks ago         166.5 MB
ubuntu              raring              eb601b8965b8        6 weeks ago         166.5 MB
ubuntu              12.10               5ac751e8d623        6 weeks ago         161 MB
ubuntu              quantal             5ac751e8d623        6 weeks ago         161 MB
ubuntu              10.04               9cc9ea5ea540        6 weeks ago         180.8 MB
ubuntu              lucid               9cc9ea5ea540        6 weeks ago         180.8 MB
ubuntu              12.04               9cd978db300e        6 weeks ago         204.4 MB
ubuntu              latest              9cd978db300e        6 weeks ago         204.4 MB
ubuntu              precise             9cd978db300e        6 weeks ago         204.4 MB
{% endhighlight %}

上面的都是镜像，都从属于ubuntu仓库（一般仓库名应该是`username/repository`格式，如果是直接以`repository`作为仓库名的，是指官方发布的仓库）。我们拉取ubuntu的时候，实际上是把仓库里的镜像都拉下来了。每个镜像都有一个唯一的`IMAGE ID`，和一个易于记忆的`TAG`，可以通过`IMAGE ID`的前几位或者`repository:TAG`来标识一个镜像。


### Dockerfile和通过Dockerfile来构建Nginx容器 ###
除了pull，镜像也可以通过"编译"得到，这里的"编译"是指一种构建行为，通过手动编写或者从github获取Dockerfile来构建一个镜像。可以把Dockerfile看成是一个脚本，这个脚本会在容器每次启动时执行。一般在Dockerfile里面需要编写基础软件的安装脚本和配置脚本。下面这个Dockerfile是个例子：

{% highlight bash %}
#
# Ubuntu Dockerfile
#
# https://github.com/dockerfile/ubuntu
#

# Pull base image.
FROM ubuntu:12.10

# Update OS.
RUN echo "deb http://archive.ubuntu.com/ubuntu quantal main universe multiverse" > /etc/apt/sources.list
RUN apt-get update
RUN apt-get upgrade -y

# Install basic packages.
RUN apt-get install -y software-properties-common
RUN apt-get install -y curl git htop unzip vim wget

# Add files.
ADD root/.bashrc /root/.bashrc
ADD root/.gitconfig /root/.gitconfig
ADD root/scripts /root/scripts

# Set working directory.
ENV HOME /root
WORKDIR /root
{% endhighlight %}

`FROM`指令表示这次构建需要基于ubuntu仓库的12.10这个TAG的镜像，如果本地不存在这个镜像的话，会自动下载镜像。镜像实际上就是编译好的结果。向上面这个Dockerfile，在原始ubuntu的基础上安装了很多常用的软件。

docker官方有[Dockerfile的教程](https://www.docker.io/learn/dockerfile/)

### 实践 ###
首先确保你已经完成上面的安装步骤，并拉取到基础镜像ubuntu:12.10。

现在我们用上面的Dockerfile来构建这个仓库(上面的Dockerfile实际上是[github dockerfile项目](http://dockerfile.github.io/)的基本仓库[dockerfile/ubuntu](http://dockerfile.github.io/#/ubuntu)，所下面的命令直接从github下载Dockerfile来构建)

{% highlight bash %}
sudo docker build -t="dockerfile/ubuntu" github.com/dockerfile/ubuntu
{% endhighlight %}

下面是最后构建成功时的输出：
	
	...
	Processing triggers for ureadahead ...
	 ---> 0a4392cf8e2d
	Step 6 : ADD root/.bashrc /root/.bashrc
	 ---> b0e86f348c09
	Step 7 : ADD root/.gitconfig /root/.gitconfig
	 ---> e2a9c001d457
	Step 8 : ADD root/scripts /root/scripts
	 ---> 678febabdbdc
	Step 9 : ENV HOME /root
	 ---> Running in c4afef311cf1
	 ---> eaa3ae3277a8
	Step 10 : WORKDIR /root
	 ---> Running in d50c273c75b8
	 ---> c9ecf5bc3227
	Successfully built c9ecf5bc3227
	Removing intermediate container 1a3d1f794c49
	Removing intermediate container 9f72df8abb63
	Removing intermediate container 5694d1e3e77e
	Removing intermediate container 6a184821f89c
	Removing intermediate container 8195bd05fc36
	Removing intermediate container d50c273c75b8
	Removing intermediate container 70de07353ecf
	Removing intermediate container 73e3f6204613
	Removing intermediate container 5dd948415981
	Removing intermediate container c4afef311cf1

此时会多出一个仓库：
	
	sudo docker images
	REPOSITORY          TAG                 IMAGE ID            CREATED              VIRTUAL SIZE
	dockerfile/ubuntu   latest              c9ecf5bc3227        About a minute ago   294.2 MB
	...

现在我们可以来构建[dockerfile/nginx](https://index.docker.io/u/dockerfile/nginx/)了(当然，从一开始你就可以直接`pull`这个镜像)

{% highlight bash %}
sudo docker build -t="dockerfile/nginx" github.com/dockerfile/nginx
{% endhighlight %}

完成后，会看到编译好的镜像：

	sudo docker images
	REPOSITORY          TAG                 IMAGE ID            CREATED              VIRTUAL SIZE
	dockerfile/nginx    latest              68508350c656        About a minute ago   308.3 MB
	dockerfile/ubuntu   latest              c9ecf5bc3227        16 minutes ago       294.2 MB
	...

现在是时候看到真正的效果了！用下面这个命令运行容器：

{% highlight bash %}	
sudo docker run -d -p 80:80 dockerfile/nginx
{% endhighlight %}

这个命令会以daemon的方式运行容器，通过下面命令查看正在运行的容器：

	sudo docker ps
	CONTAINER ID        IMAGE                     COMMAND             CREATED             STATUS              PORTS                NAMES
	98c474a7dd6a        dockerfile/nginx:latest   nginx               6 seconds ago       Up 6 seconds        0.0.0.0:80->80/tcp   trusting_hawking

访问你主机的80端口，可以看到nginx的欢迎页面了！这时，我们来看看本机的进程`sudo ps -ef`：

	root      1428   952  0 15:19 ?        00:00:00 nginx: master process nginx
	root      1429   417  0 15:19 ?        00:00:00 /sbin/udevd --daemon
	www-data  1441  1428  0 15:19 ?        00:00:00 nginx: worker process
	www-data  1442  1428  0 15:19 ?        00:00:00 nginx: worker process
	www-data  1443  1428  0 15:19 ?        00:00:00 nginx: worker process
	www-data  1444  1428  0 15:19 ?        00:00:00 nginx: worker process

似乎有些接近事物的本质了！nginx的进程实际上是在本机上的，这意味着，容器中程序的执行仍然是使用本机操作系统的，容器并不自己构建操作系统，而是以某种隔离的方式依赖本机操作系统工作。这就是Docker和虚拟机的本质区别。

你可以像下面这样，将本机的目录映射给这个"nginx容器"。`<sites-enabled-dir>`目录下应该有nginx的配置文件片段

{% highlight bash %}
docker run -d -p 80:80 -v <sites-enabled-dir>:/etc/nginx/sites-enabled -v <log-dir>:/var/log/nginx dockerfile/nginx
{% endhighlight %}

> PS：这步笔者没有成功，日志路径是可以map的，但是sites-enable-dir中的配置始终不行。继续诊断中。

### 镜像的共享与Dockfile的分发 ###
可以共享你的镜像和用来构建的Dockfile分享给社区：

- [Docker index](https://index.docker.io)是官方的镜像目录，可以从里面得到大量的预编译好的镜像
- [Dockerfile Project](http://dockerfile.github.io/)一个托管Dockerfile的仓库集合

## 原理 ##
总的来说Docker的核心技术如下：

 - 命名空间
 - AUFS(advanced multi layered unification filesystem)
 - cgroup

由于本人才疏学浅，下面给出一些参考资料，有兴趣的朋友可以扩展阅读一下，一定会对Docker有更深刻的认识的：

[PaaS under the hood, episode 1: kernel namespaces](http://blog.dotcloud.com/under-the-hood-linux-kernels-on-dotcloud-part)

[PaaS Under the Hood, Episode 2: cgroups](http://blog.dotcloud.com/kernel-secrets-from-the-paas-garage-part-24-c)

[PAAS Under the Hood, Episode 3: AUFS](http://blog.dotcloud.com/kernel-secrets-from-the-paas-garage-part-34-a)

[PaaS Under the Hood, Episode 4: GRSEC](http://blog.dotcloud.com/kernel-secrets-from-the-paas-garage-part-44-g)

[PaaS under the hood, episode 5: Distributed routing with Hipache](http://blog.dotcloud.com/under-the-hood-dotcloud-http-routing-layer)

[Under the Hood系列](http://blog.dotcloud.com/category/under-the-hood)

[LXC （Linux 虚拟环境）简单介绍](http://segmentfault.com/a/1190000000443812)

[docker原理简介](http://blog.blackwhite.tw/2013/12/docker.html)


## 参考资料 ##

[Docker官方](http://docker.io)

[Docker：具备一致性的自动化软件部署](http://www.infoq.com/cn/news/2013/04/Docker)

[Dockerfile的教程](https://www.docker.io/learn/dockerfile/)


一些Docker的社区资源：

[Segmentfault](http://segmentfault.com/)的[Docker子站问答](http://segmentfault.com/docker)

[Docker中文社区](http://www.dockboard.org/)

[Docker中文文档](http://www.widuu.com/docker/index.html)


