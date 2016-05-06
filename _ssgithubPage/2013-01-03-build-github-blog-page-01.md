---
layout: postlayout
title: 一步步在GitHub上创建博客主页(1)
description: 本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇介绍GitHub提供的个人博客及其关键技术，以便读者决策。
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page, jekyll, liquid]
---

更新

> github已经有了很大的改进，这个系列是在13年初写的，东西有些老了，建议读者可以同时参看`一步步在GitHub上创建博客主页-最新版`

本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇介绍GitHub提供的个人博客及其关键技术，以便读者决策。GitHub十分“给力”，不仅为程序员提供了免费源代码托管空间，还为程序员提供了一个社交平台，允许大家在GitHub上创建自己的博客网站或主页（[github pages](http://pages.github.com/)），而且免费，不限流量，还可以绑定自己的域名。不过遗憾的是，GitHub提供的主页实际上是基于GitHub的源代码实现的，所以只支持上传静态的网页，不能在上面创建真正的博客系统。不过，不幸中的万幸是，GitHub支持一种叫jekyll的静态页面转换引擎，也就是说只要上传符合jekyll规范的文件，GitHub会用这种模板引擎为你转化静态页面和网站。

## 关于jekyll ##

在开始之前，有必要详细总结一下这个jekyll是什么。上面提到了它实际上是一个模板转化引擎。它同时也是GitHub上的一个开源项目：[Jekyll](https://github.com/mojombo/jekyll)

jekyll本身基于`Ruby`，它实际上也可以看成是一种模板引擎liquid的扩展。jekyll对[liquid](https://github.com/Shopify/liquid/wiki/Liquid-for-Designers)的主要扩展在于两点：

- 内建专用于博客网站的对象，可以在模板中引用这些对象：page、site等
- 对liquid进行了扩展，方便构建博客网站

类似其他的模板引擎一样，标记是模板引擎解析的关键，liquid设计了如下两种标记：

{% raw %}
- `{{ }}`：此标记表征的是将其中的变量转化成文本
- `{% %}`：此标记用于包含控制流关键字，比如：`{% if %}`、`{% for x in xx %}`
{% endraw %}



显而易见的是，有了这种标记的支持，再加上jekyll内建的对象，构建网站就方便不少了。

可能有朋友会更其他的服务器端脚本语言比较，比如`asp`、`razor`、`jsp`、`velocity`…，但是一定要记得的是，jekyll对模板的解析仅仅只有一次，它的目标就是将模板一次性的转化成静态网站，而不是上述的动态网站脚本语言。


## 维护流程 ##

因此，对GitHub网站的维护工作，大致可以用下面的图表示：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-01-img0.png)

1. 利用本地编辑器编写博客后维护网站其他页面
2. 使用`Jekyll-Bootstrap`在本地测试网站功能
3. 使用`Git`客户端工具上传模板和页面文件
4. Git Server会用jekyll转化你的模板，并生成静态页面

## 所需技能 ##

由此可见，你至少需要具备下面技能：

- 对`Git`源代码管理原理的认识，可以参考这里：[Git学习资源]({% post_url 2013-01-03-git-resource %})
- 逐步掌握jekyll
- 基本的HTML、CSS、JS技术能力

在后续的文章中，我将从0开始一步步解释如何申请GitHub空间以及如何搭建本地预览环境。