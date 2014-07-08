---
layout: postlayout
title: linux权限模型简介
description: 本文介绍linux的UGO权限模型
thumbimg: linuxslide.jpg
categories: [Linux]
tags: [Linux]
---

本文为原创，首发于我的cnblog[linux权限模型简介]((http://www.cnblogs.com/P_Chou/archive/2012/12/02/linux-perm-basic.html))

## linux的基础权限体系是基于UGO的 ##

- U:文件或文件夹的所属用户的权限
- G:文件或文件夹的所属组队权限
- O:其他用户对文件夹或文件的权限

## 权限包括 ##

- r:对文件和文件夹读权限，用数字表示是4（2^2）
- w:对文件和文件夹写权限，用数字表示是2（2^1）
- x:对文件的执行权限，和对文件的浏览权限，用数字表示是1（2^0）

一般用`ls -l`命令查看的权限可能如下：

{% highlight bash %}
-rwxrwxr--       root      root  ….
{% endhighlight %}

从左到右解释：

- `-`：文件类型，-表示文件，d表示文件夹
- `rwx`：即U类型的权限，表示文件的所属用户对文件具有 读 写 执行 权限，可以用7表示（4+2+1）
- `rwx`：即G类型的权限，表示文件的所属组对文件具有 读 写 执行 权限，可以用7表示（4+2+1）
- `r--`：即O类型的权限，其他用户对文件有读权限，可以用4表示（4）
- `root`：即文件的所属用户是root
- `root`：即文件的所属组是root组
 

## 命令 ##

- `chgrp`：修改文件或文件夹的所属组
- `chown`：修改文件或文件夹的所属用户
- `chmod`：修UGO权限。

例如：

{% highlight bash %}
chmod u+w # 表示为所属用户添加写权限
chmod g+w # 表示为所属组添加写权限
chmod o+x # 表示为其他用户添加执行权限
chmod 750 # 表示为所属用户添加读写执行（7），为所属用户添加读执行（5），其他用户没有任何权限（0）
{% endhighlight %}

## 扩展权限 ##

`suid`：只对文件有效，表示文件在执行的时候以文件的所属用户的权限执行，比如/usr/bin/passwd，在终端上文件会显示红色，并且U权限中的x会被替换成s。例如：

{% highlight bash %}
chmod u+s：# 将文件设置suid
{% endhighlight %}

`sgid`：通常对文件夹有效，表示在文件夹中建立文件或文件夹的时候继承该文件夹的组用户。G权限中的x会被替换成s

{% highlight bash %}
chmod g+s：# 将文件夹设置sgid
{% endhighlight %}

`sticky`：作用于文件夹，表示在该文件夹下的文件只能由文件的owner删除，其他人可以在文件夹下创建、浏览、但也只能删除自己为owner的文件。O权限中的x会被替换成t

{% highlight bash %}
chmod o+t：# 将文件夹设置sticky
{% endhighlight %}