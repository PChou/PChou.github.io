---
layout: postlayout
title: BMC Remedy 系统架构
description: 本文从BMC Remedy架构层面简单介绍了Remedy
thumbimg: BMCAtriumCMDB.png
categories: [BMC]
tags: [BMC, Remedy]
---

这个系列旨在总结BMC AR系统的相关概念和知识点。

## Remedy系统架构

Remedy系统架构如下图

![]({{ site.BASE_PATH }}/assets/img/2013-02-26-img0.png)

- 表现层：表现层是指用户能够直接接触到的层，包括浏览器、客户端、Remedy User、第三方API程序和解决方案等
- 业务流程层：这部分的主要组成部分包括，`Mid-tier`、`AR`系统服务和相关的服务
	- `Mid-tier`包含如下组件：
		- `Web Server`：处理基础web请求
		- `Oracle JSP engine`：处理jsp请求
		- `Oracle JSP servlets`：一些处理请求的servlets
		- `Java API`：mid-tier依靠java api与AR系统通信
		- `Configuration Tool`：Mid-tier的配置工具，最终的配置是存储在config.properties中的
	- AR Server包含如下组件：
		- API：一系列与AR通信和扩展AR的应用程序编程接口
		- 访问控制和数据验证：内建的权限访问控制和数据验证
		- 通知：推送注册的客户端通知
		- `Filter（API）`：可以理解为应用程序触发器，具有事务一致性，并且还提供扩展Filter的API
		- `Escalation`：可以理解为基于时间点和时间间隔的定时器
		- `AREA`：外部认证扩展
		- `Web Service`发布和调用：可以定义操作表单的web service以及在Filter中调用外部web service
- 数据存储层：标准关系型数据库
 

## 扩容性

在`Mid-tier`层，扩容性主要表现在下面几个方面

- 多线程的servlet能够支持并发用户
- 通用的web server扩展和负载均衡机制能够适用
- 服务端和客户端缓存

在`AR`层，扩容性主要表现在可以配置处理队列和多线程

队列是`RPC`调用请求存放的地方，线程从队列中获取请求并处理，每个队列负责不同的请求类型，并分配有一个PRC号。线程分为分派线程，工作线程，管理线程。分派线程用于分派PRC调用给不同的队列，工作线程用于从队列中取PRC调用并处理，管理线程用于监控和创建其他线程并保证其他线程在奔溃后重启。

![]({{ site.BASE_PATH }}/assets/img/2013-02-26-img1.png)

- `Admin Queue`（390600）：处理所有管理员的重构数据库结构的操作，比如开发过程中的操作。该队列只能有一个工作线程处理
- `Alert Queue`（390601）：负责将AR内部的通知请求发向注册为“被通知”的客户端
- `Full Text Indexing Queue`（390602）：负责处理AR内部的全文检索相关请求
- `Escalation Queue`（390603）：处理内部的升级请求，如果禁用了Escalation的话将不会创建该队列
- `Fast Queue`（390620）：该队列处理对数据库无阻塞的快速的请求。管理员权限的操作和ARExport, ARGetListEntry, ARGetListEntryWithFields,ARGetEntryStatistics的API调用不会使用这个队列
- `List Queue`（390635）：处理可能的长时间操作，比如下面的API调用：ARExport, ARGetListEntry, ARGetListEntryWithFields,ARGetEntryStatistics
- `Private Queue`（390621–390634, 390636–390669, 390680–390694）：管理员可以定义“专有队列”，主要用于处理审批引擎、插件或者是关键用户的操作，不希望被其他用户阻塞的操作等。“专有队列”不支持管理员权限的重构数据库的操作。

分派线程：每个分配了PRC号的远程调用先由分派线程处理，并放置到相应号的队列中。这也有些例外，比如对应的队列不存在时，会使用其他队列。


## portmapper服务

`portmapper`从PRC协议而来，是为了解决PRC调用前无法得知服务端端口的问题。portmapper相当于一个程序号\端口的字典，所有的RPC请求都需要指定程序号，而portmapper将返回对应程序号的开放的端口。其他的RPC服务提供程序可以在portmapper上注册，以获得portmapper带来的好处。在UNIX版本的AR中没有portmapper程序，因为所有的UNIX系统都将PRC作为基本的服务，在UNIX中portmapper应该使用的是保留的`111`端口。在windows从2008开始支持类似portmapper功能的服务，但其默认使用的端口是`135`，所以，AR在安装过程中，还是会安装一个特有的portmapper服务，并自动将AR的相关服务注册在这个portmapper上。

需要注意的是，portmapper实际上提供的是一个端口查询服务，客户端和AR的通信还是要通过AR本身的端口来完成的。当然AR也可以配置固定的端口号提供服务，并且配置不使用portmapper。在这种情况下，客户端必须指定服务端的端口。通过API：`ARSetServerPort`可以设置AR的TCP端口和PRC号，如果不设置将使用portmapper的111端口。ARTCPPORT环境变量也可以影响客户端TCP端口的选择。

在Remedy User中配置特定端口的链接

![]({{ site.BASE_PATH }}/assets/img/2013-02-26-img2.png)

在服务端配置相关端口、队列和线程的参数

![]({{ site.BASE_PATH }}/assets/img/2013-02-26-img3.png)