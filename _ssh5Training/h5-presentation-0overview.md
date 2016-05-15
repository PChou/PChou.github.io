---
title: Html5入门教程系列(1)--总览
categories: [web]
tags: [html5]
---

说起`html5`，可能是近1-2年最火的技术词汇之一了，由于市场需求爆增，人才也趋之若鹜。目前，有很大一部分人的口头禅是`H5`，这里我要吐槽一下，如果你并不了解`html5`，而是从别人口中听到`H5`，那么请注意，`H5`这个词现在已经不等于`html5`了！究其原因，应该是随着微信生态圈的发展，一部分人将`使用css3构建的适应手机分辨率显示的网页`简称为`H5`。严格来说`H5`只是`html5`的一部分，如果你只是想知道如何制作所谓的`H5`，那么本系列可能并不能帮到你很多，你可以去学习专门的`css3`的教程。这个系列是笔者曾经在某公司(500强外企金融类)所做的培训内容，培训总共5天。主要围绕`html5`,`css3`,`javascript`进行，适用于web前端工程师的入门。回想起来，由于当时英语水平不足以及临时抱佛脚，压力是非常大，不过这种经历可能这辈子也不会再有了吧。本着总结和分享的精神，这里我把培训的内容整理成博文，方便大家入门。如有不妥之处望指正。

![](http://pchou.qiniudn.com/2015-05-04-02.jpg)

## Outline

首先，我先罗列出教程各部分的大致安排，我会按照这个顺序逐步展开：

1. javascript介绍
2. css介绍
3. jquery
4. XMLHttpRequest
5. javascript面向对象
6. html语义化
7. 表单控件
8. websockets
9. canvas和svg
10. 地理信息接口
11. 新的拖拽api
12. 多媒体
13. 存储api
14. 离线应用

html5是一种以前其他技术的演进和增强，所以单独介绍html5的新特性可能对于入门来说并不合适，所谓饭还是要一口口吃，这些内容可能不全部是html5的内容范畴，但却是前端入门必需的，比如`javascript介绍`。而有些内容在html5之前就有了，但是在html5标准下被增强了，比如`XMLHttpRequest`。


## 历史

html5其实早就开始起草，经过多年的努力，终于在2014年10月28日，第一个HTML5标准宣布发布。大家可以从[w3c的官方文档](https://www.w3.org/TR/html5/)中看到这个时间。当年这个事件，还是相当令人兴奋的。这意味着，浏览器的兼容乱象终于得以规范和实质性改变。事实上，在html5第一版标准颁布到今天，前端工程师的日子一天比一天好过了。ie8逐渐被企业抛弃，普通用户逐渐接受新的浏览器，移动互联网逐渐取代PC互联网，html5标准的流行比想象中的还要快一些，当然这不纯粹是技术因素。

![](http://pchou.qiniudn.com/2016-05-04-01.jpg)


## HTML5包含什么

先来看看html5标准相对于以前的技术究竟有哪些变化：

- 语义化标签：增加了诸多的标签，让开发者更容易表达html的语义。比如`<section>` `<aside>` `<header>`等；引入的一些新的表单控件，这些控件具有更为精准的UI呈现。
- 互联增强：引入`WebSockets`，使得网页也具有了与服务器进行双工通信的能力
- 离线能力：支持一些简单的客户端存储和数据库，实现客户端存储，以前通常用cookie；离线应用功能可以使得应用可以离线运行
- 多媒体呈现：音视频呈现能力增强，引入`<audio>` `<video>`，可以嵌入字幕
- 图形图像：Canvas绘图、WebGL的3D渲染支持、SVG
- 性能提升：XMLHttpRequest的增强，Web异步任务能力，历史接口(History API)，拖拽的原生支持
- 设备访问：访问相机、地理位置、设备角度等
- 样式增强：CSS表达能力的增强，这一点应该是用的最多的

## 浏览器支持

关于新标准的支持，可以使用[http://caniuse.com/](http://caniuse.com/)来查看，比如对于File API的支持情况如下(截图是2015年时候的，现在可能支持的更好了)：

![](http://pchou.qiniudn.com/2015-05-04-03.jpg)

对于过度时期，在兼容性方面可以考虑的两个库[Modernizr](http://modernizr.com/)，[html5shiv](https://github.com/aFarkas/html5shiv)。

在开发方面，推荐使用chrome浏览器作为调试工具，编辑器可采用`sublime`或者`vim`。

## 参考资源

[http://caniuse.com/](http://caniuse.com/)

[http://html5test.com/]()

[https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)

[http://www.w3.org/](http://www.w3.org/)




