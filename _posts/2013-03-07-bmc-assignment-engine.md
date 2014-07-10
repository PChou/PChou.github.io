---
layout: postlayout
title: BMC AR 指派引擎
description: Assignment Engine指派引擎是AR的一个组件，可以有选择性的安装。指派引擎可以用来代替工作流实现自动指派功能，这种自动指派可以实现所谓了“负载均衡”，即将工单按照一定的策略自动分派给同一组的受派人，以满足一定意义上的平均分派。
thumbimg: BMCAtriumCMDB.png
categories: [BMC]
tags: [BMC, Remedy]
---

## 什么是指派引擎

假如有这样的需求：有一个业务组，组内有若干员工，他们需要在某个流程中处理一类工单，当工单数量达到一定数量，处理人员不够时，负责指派工单的人犯难了，组内的每个人都能完成这类工单，但是如何指派工单以使得大家的工作是相对比较平均的呢？因为分派员无法得知每个处理人员的工作量。在这种情况下，指派引擎就可以充当这个处理人了。

Assignment Engine指派引擎是AR的一个组件，可以有选择性的安装。指派引擎可以用来代替工作流实现自动指派功能，这种自动指派可以实现所谓了“负载均衡”，即将工单按照一定的策略自动分派给同一组的受派人，以满足一定意义上的平均分派。

在AR中，指派引擎是以进程的形式存在的（在windows下是`apsvcae.exe`）。在AR的Filter中需要Run Process来启动一个指派：

{% highlight powershell %}
Application-Command AE-ASSIGN DoAssign -t "processName" -e "RequestID"
{% endhighlight %}

在这个调用中，需要两个参数：

- `processName`：指定某个流程名，流程需要预先在配套的管理界面中添加和配置，下文会提到
- `RequestID`：工单的`RequestID`

事实上，指派引擎可以看作是AR的一个外挂程序，所以也就可以作为`Server Group`的一个可分离组件，可以被分离到其他AR的集群服务器上运行。armonitor在启动过程中会自动创建`apsvcae`的子进程。如果想要停止指派引擎，可以直接终止`apsvcae.exe`这个进程。


## 配置指派引擎

指派引擎在AR中，将添加少数几个表单，包括管理控制台、流程、规则等。这里不罗列表单细节，可以查看相关文档。`Assignment Engine Administration`是配置控制台，这里不打算详细介绍配置的细节，只从大方向上给予总结。

在指派引擎中有下面几个概念：

- `Processes`流程：每一个流程能够包含一个工单和指派表单以及几种规则。在某种意义上说，流程就等同于工单表单，可以认为流程是工单的抽象表现形式，流程就是把工单和多种规则捆绑在一起。
- `Request Forms`工单表单：工单表单可以属于一个或多个流程，指派引擎以工单为单位，为工单设置指派。
- `Assignee Forms`指派表单：即人员表单，指派引擎会从这个表单中按照规则选取人员作为指派对象。
- `Rules`规则：即指派引擎在设置指派的时候需要遵循的规则，规则主要包括“指派算法”和“匹配规则”。指派算法在下文会提到，匹配规则实际上就是一个条件表达式，该条件用来在指派表单中选定一个人员范围，然后在这个人员范围内，根据算法选取指派对象。

任何表单都可以成为工单表单和指派表单，只要在这些表单中添加一些特殊的字段，并配置到流程中即可工作。

`在指派表单中需要包含如下意义的字段`：

- `Assignee Unique ID`：即人员的唯一标识，可以是GUID或者RequestID
- `Number Assigned`：记录被指派次数的整形字段，用于实现指派算法
- `Capacity Rating`：人员可以同时处理工单的容量，比如设置10，表示某人员可以同时处理10个工单
- `Last Assigned Time`：最后被指派的时间

`在工单表单中需要包含如下意义的字段`：

- Assignee Unique ID：即人员的唯一标识，指派引擎会将指派结果写入该字段

除此之外还有还有一些可选字段可以出现在两种表单中，详见相关文档。下面给出一些配置界面的截图：

![]({{ site.BASE_PATH }}/assets/img/2013-03-07-img0.png)

配置Request Form

![]({{ site.BASE_PATH }}/assets/img/2013-03-07-img1.png)

配置Assignee Form

![]({{ site.BASE_PATH }}/assets/img/2013-03-07-img2.png)

配置Rule

![]({{ site.BASE_PATH }}/assets/img/2013-03-07-img3.png)

配置Process

 

## 指派引擎是如何工作的

首先，`Application-Command AE-ASSIGN DoAssign`在ARServer进程中执行，`arserver`通知`apsvcae`进程。注意此时apsvcae进程可以在另外的AR集群（Server Group）服务器上

![]({{ site.BASE_PATH }}/assets/img/2013-03-07-img4.png)

然后，`apsvcae`进程将执行如下一系列动作：

1. 根据ProcessName查询相关的Request Form和Assignee Form，以及对应的Rules
2. 根据Request Form的RequestId，查询该工单记录，并根据Rules中定义的匹配规则，从Assignee Form中过滤合适的人选
3. 如果人选不止一个人，那么查询所有候选人的Number Assigned、Capacity Rating、Last Assigned Time
4. 根据上述值和指定的指派算法，选择第一个符合条件的人，将其写入Request Form这条记录的Assignee Unique ID，并相应更新此人的Number Assigned、Last Assigned Time
 

## 指派算法

有三种内置的指派算法，可以在Rules中选择：

1. Round Robin：即最后一次被指派的时间越早的人员将被优先考虑，依赖Last Assigned Time字段
2. Load Balance by Number：根据当前被指派数，平均分配，依赖Number Assigned字段
3.Load Balance by Capacity：根据人员的处理能力来分配，依赖Number Assigned和Capacity Rating字段。比如A员工设置Capacity Rating为10，当前Number Assigned为5，B员工设置Capacity Rating为20，当前Number Assigned为8，因为8/20<5/10，所以会选择指派给B
