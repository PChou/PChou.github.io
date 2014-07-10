---
layout: postlayout
title: BMC AR license那些事儿
description: BMC AR相关产品是按照license进行收费的，license的配置直接关系到花多少钱的问题。BMC AR从7.1.00开始对license系统进行过调整，本文主要讨论新的license机制。
thumbimg: BMCAtriumCMDB.png
categories: [BMC]
tags: [Remedy]
---

## license类型

`AR Server license`：AR系统平台必须的license，不管是否安装其他应用程序，该license需要事先与BMC签订购买合同，并获得一个ID。通过ID从BMC的官方网站上获取Key。据说一个ID可以最多获取50个Key（没考证过）。`而Key是跟AR Server的MAC地址绑定的`，所以一个ID可以给最多50台Server安装AR系统。具体操作不在本文讨论范围内，可以参考BMC的相关文档。另外，作为BMC的合作伙伴，有权利获得AR的评估版license（临时license，适用时间3个月）。在Server Group环境中，必须也仅需为每台Server配置与之MAC地址匹配的Key。

`应用程序license`：一些基于AR系统的应用（比如ITSM），需要额外的应用程序license。不过此license在技术上没有限制，仅仅是基于合同的。也就是说只要有了合法的AR Server的license，应用license可以直接添加，不需要Key（这是新版本的改动）。顺便说一句，如果想要开发基于AR的应用，并且想通过应用的license卖的话，需要经过BMC认证，成为integration system vendors (ISVs) 。

`用户license`：除了上述一次性的license外，基于用户数的license是主要的卖点，不同的企业不同的用户数量，就需要购买不同的数量的license。然而，这种license也是技术上没有限制的，用户可以随意增加数量，仅仅通过合同进行限制。用户license还分为如下两种：

- `User Fixed`：当用户被配置为Fixed的license时，该license为该用户独享，其他用户不能获取。具有Fixed的license的用户在增删改查各个方面都没有限制。
- `User Floating`：当用户被配置为Floating的license时，用户将从Floating的license池中尝试获取，如果池中的license不够的话，用户只能获得Read权限。具有Floating的license的用户在增删改查各个方面都没有限制。
- `Read`：所有用户都默认可以获得的license类型，没有数量限制，也不需要配置数量。但权限有限。
- `Restricted Read`：没有数量限制，也不需要配置数量。但权限比Read还小。
 

## license数量

- 每个Server中的AR Server license只需要一个
- 应用程序license只需要一个
- 用户license的数量可根据实际的需求调整

下图是添加和管理license的界面：

![]({{ site.BASE_PATH }}/assets/img/2013-03-02-img0.jpeg)


## 用户license权限

上文提到过的用户license类型，接下来详细讨论不同类型的license的权限范围：

- `Read`：具有Read license的用户可以读数据（当然要在特定的应用程序权限范围内），可以创建记录。对于是否有权限修改记录分两种情况：当记录是本人提交的（即Submitter字段是当前用户时）、并且Submitter Mode是Locked的时候，可以修改该记录；当记录不是本人提交时，不能修改记录。用户登录系统后，在没有任何操作时，默认获得此权限的license。在Server infomation 中的Submitter Mode配置：

![]({{ site.BASE_PATH }}/assets/img/2013-03-02-img1.jpeg)

Locked模式的作用如上面提到的，但有一个限制，就是Submitter字段一旦在创建时指定就不能更改了；Changable要求无论是否提交人是当前登录人，都必须具有写访问权限（Floating或Fixed license）才能修改，Submitter字段也不会锁定。

- `Restricted Read`：与Read类型类似，但是用户不能修改任何记录，即使记录是本人提交的。不过，具有该权限的用户可以同时在多个IP上登录。
- `Fixed`：具有该license权限的用户可以进行任何操作（当然需要在特定应用程序权限范围内），管理员必须具有Fixed的license
- `Floating`：具有该license权限的用户可以进行任何操作（当然需要在特定应用程序权限范围内）。Floating的license会被所有配置为Floating license的用户共享，因此具有下面规则：
	- 用户第一次登陆系统，没有进行任何操作的前，将获得Read权限的license
	- 当用户进行操作后，将可能进行尝试获取Floating的license，如果不能获取的话，将提示用户许可不够，并保留Read许可，直到有可用的Floating license。获取Floating license的用户将在特定情况下释放Floating license。

![]({{ site.BASE_PATH }}/assets/img/2013-03-02-img2.png)

浮动许可不足时，弹出类似提示

![]({{ site.BASE_PATH }}/assets/img/2013-03-02-img3.png)

有用户释放许可后，可以自动重新获得许可


## 浮动许可的释放

管理员可以手动强制释放某个用户占用的浮动许可:

![]({{ site.BASE_PATH }}/assets/img/2013-03-02-img4.jpeg)

正常情况下license释放满足如下规则：

- 用户从Remedy User或Mid-tier中登出
- 如果用户没有在Mid-tier中正确登出，将在30-300秒之间释放
- Mid-tier中用户Session超时
- 用户在AR系统中有一段时间没有进行操作，将自动释放，该值可以在AR中配置最小1，最大99小时（已考证）image
 

## 保留的license Pool

如果有一些特定的人员需要比较稳定的写权限的话，除了可以为他们配置固定许可外，还可以将Floating license进一步划分出一个或多个“池”，每个池以`用户组`为单位。属于用户组的用户都从这个池中获取Floating license，不属于用户组的用户将从池外获取Floating license，这样可以在一定程度上保证这部分用户对Floating license的获取。

 

## 应用程序用户license

最后一个主题是关于应用程序用户license的。BMC自家的ITSM应用中的事件、问题、变更、配置管理这几个Application都是需要应用程序license的。关于应用程序license的问题请参见上文。

除此之外，这些应用同时还需要特定的用户固定、用户浮动license：

![]({{ site.BASE_PATH }}/assets/img/2013-03-02-img6.png)

如上图，这些应用都必须至少有一个用户浮动license才能正确安装。然而，数量又如何界定呢？据笔者实验下来，这些用户的license数量实际上在系统中是不做强制限制的，完全依赖AR本身的用户浮动license，配多配少都没有影响，也就是说可以都只配置1个！可能仅仅是合同约束的。