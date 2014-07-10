---
layout: postlayout
title: 从BMC AR Portmapper展开说去
description: 本文分析了在与AR进行通信链接的最初阶段，PRC和Portmapper是如何工作的，如果由于防火墙规则而无法访问AR的话，可以在文中找到原理，并排查解决。
thumbimg: BMCAtriumCMDB.png
categories: [BMC, network]
tags: [BMC, Remedy]
---

## 理论基础

`PRC`：`Remote Procedure Call`（[RFC 1831](http://tools.ietf.org/html/rfc1831)），是一种远程调用协议，通常基于`TCP/IP`、`UDP/IP`，服务端负责提供服务，客户端调用，在调用过程中遵循的某种协议。BMC的AR服务整个都是基于RPC而来的，所有的调用都是通过该协议进行的。

调用和提供PRC服务的基本要素如下:

在网络层和传输层

- IP Address
- Transport layer Port（UDP/TCP Port）

在应用层，唯一标识一个远程过程需要如下三个要素，这三个要素都要求用4个字节的`unsigned int`表示

- `PRC Program number`：远程程序号，这个号是统一发放的
- `version number`：程序版本号，保证程序能够在同一个程序号上更新版本
- `Procedure Number`：过程号，由特定程序号的程序定义

在客户端调用时，只要指定上述3个参数（当然还包括IP和端口）就可以找到一个远程过程，并进行调用，调用是传入相应的调用参数即可。

客户端除了需要知道服务端的这些信息之外，还需要知道每个远程过程需要传入调用参数，这些可以通过（`XDR`: External Data Representation Standard [RFC 1014](http://tools.ietf.org/html/rfc1014)）描述，就好比，`WSDL`是`SOAP`的定义描述语言一样。

在众多的PRC程序中，有一类特殊的RPC程序用于实现`RPC绑定` [RFC 1833](http://tools.ietf.org/html/rfc1833)，其中一种就称为`Port Mapper`。这些用于实现PRC绑定的程序，主要用于在客户端和真正的PRC程序之间建立一个纽带和桥梁，比如本文要谈到的端口映射。关于`Portmapper`服务的作用可以参见BMC Remedy 系统架构。接下来，我们通过抓包来分析windows平台下，客户端是如何通过BMC的portmapper服务与AR建立通信的。

 
## 分析

当客户端向BMC AR服务发起连接的时候，下面是第一个数据包，方向是client –> Server：

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img0.png)

这个包是基于`UDP`的，目标端口是`111`，并且这个调用是一次RPC调用，程序号为`100000`，版本`2`，方法号是`3`，参数有`Program号`，`版本`，`协议`，`端口`。通过查阅[RFC 1833](http://tools.ietf.org/html/rfc1833)可以知道，这次调用是向目标主机的`100000`程序号（版本2）发起的`PMAPPROC_GETPORT`过程，含义是需要查询程序号为`390620`，版本为`18`，使用协议为TCP协议的RPC程序所使用的端口！

portmapper定义的所有的过程号如下：

{% highlight c %}

Port mapper procedures:
   program PMAP_PROG {
      version PMAP_VERS {
         void
         PMAPPROC_NULL(void)         = 0;//无作用

         bool
         PMAPPROC_SET(mapping)       = 1;//用于服务端PRC程序向portmapper注册端口

         bool
         PMAPPROC_UNSET(mapping)     = 2;//用于服务端PRC程序向portmapper反注册端口

         unsigned int
         PMAPPROC_GETPORT(mapping)   = 3;//用于客户端查询端口

         pmaplist
         PMAPPROC_DUMP(void)         = 4;//用于查询所有已注册的程序号和端口，pmaplist是mapping的链表结构

         call_result
         PMAPPROC_CALLIT(call_args)  = 5;//用于代理调用
      } = 2;
   } = 100000;
 
{% endhighlight %}

下面是第二个数据包，方向是Server –> client：

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img1.png)

这个包同样是基于UDP，是服务端向客户端返回刚才调用的结果，结果为`1093`。说明程序号为`390620`，版本为`18`，使用协议为TCP协议的RPC程序所使用的端口为`1093`，这个RPC程序就是AR服务！

客户端得知AR服务所使用的端口1093后，立刻与之建立TCP连接，以下是三次握手：

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img2.png)


![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img3.png)


![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img4.png)


建立好TCP连接后，接下来客户端开始在AR服务上进行RPC调用，先是过程号为97

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img5.png)

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img6.png)

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img7.png)

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img8.png)

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img9.png)

![]({{ site.BASE_PATH }}/assets/img/2013-05-05-img10.png)


## 结论

从本文的分析中，可以得出如下结论：

- 如果AR启用portmapper服务，那么portmapper的第一次请求将是基于UDP的
- 客户端与AR服务直接的RPC通信是基于TCP的，会先建立TCP链接

以上两点，对于一些需要防火墙策略的客户端或者服务端来说十分重要