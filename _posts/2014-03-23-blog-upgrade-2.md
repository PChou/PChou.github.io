---
layout: postlayout
title: 博客再次更新
description: 
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page,web-build]
---

## 折腾 ##
为了让博客看起来更为简约和扁平，同时因为学了点css，总有点想得瑟的冲动，又开始了新一轮的改版和升级，前前后后折腾了两个版本，最终形成了现在这个样子。
其实此次更新酝酿了很久了，前前后后返工了多次，最初是想让博客看起来更扁平，更简约。在折腾的过程过还弄出过一个带timeline的版本，但是后来还是改成了现在这个样子：

1. 重写了整个站点的结构和样式，使用sass构建css
2. 全部使用自己写的css，去掉了对bootstrap的依赖，保留响应式的设计风格
3. 由于历史的原因，有些文章的排版和布局结构很有问题，对所有的文章的排版进行了调整
4. 开始使用Markdown。之前是使用Windows Writer，看中的是使用Windows Writer可以比较方便的"所见即所得"，而且图片的处理更为方便。一段时间以后，发现，"所见即所得"不是很完美，而且，相比代码高亮，图片显得不是很重要
5. 为了提高网站的访问速度，使用七牛云存储来存图片，目前七牛云有10G/Month的免费流量，对我来说是够了，超出部分也只有￥0.5/G
6. js库使用bootstrap开放的前端库CDN服务，[OpenCDN](http://open.bootcss.com/)
7. 社会化分享使用[JiaThis](http://www.jiathis.com/)
8. 原先的系列文章，在文章页也安排了相关文章的链接，方便阅读


整个过程的收获：

1. sass入门。在接触sass之前学过less，由于听说bootstrap转向sass，跟风了。感觉的话，如果是构建想bootstrap这样的库，sass可能更好一些，一般的网站UI设计，用哪个都行。、
2. css本身其实不是很复杂，但是如何合理的布局和设计是需要经验支撑的，多写写总是有收获的
3. Markdown写文章确实更为舒服一些，虽然图片是个问题，不过用云存储解决了

最后是blog的首页的截图样子，留作纪念：

![blog-upgrade-2](http://pchou.qiniudn.com/blog-upgrade-2.jpg)


![2014-03-23%2014.42.26](http://pchou.qiniudn.com/2014-03-23%2014.42.26.jpg)