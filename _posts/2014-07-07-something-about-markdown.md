---
layout: postlayout
title: Markdown的各种扩展
description: 刚开始接触markdown的时候，觉得好简单好方便，随着使用的深入，发现markdown好像在很多地方有很多不同的实现，语法特性各不相同，顿时陷入迷茫。
categories: [open-source]
tags: [markdown,github-page]
---

标准markdown的语法：<http://daringfireball.net/projects/markdown/syntax>

## PHP Markdown Extra ##

Markdown的php解析与实现，并且增加了许多有用的扩展。[PHP Markdown Extra](https://michelf.ca/projects/php-markdown/extra/)其中几个比较重要的改进有：

- 支持在html块元素中插入markdown语法
- 支持为一些元素添加id或class，比如为header添加id属性，用带锚点的链接导航。例如：

{% highlight html %}
[Link back to header 1](#header1)

Header 1            {#header1}
========

## Header 2 ##      {#header2}
{% endhighlight %}


支持元素包括`header`、`code block`、`link`、`image`

- 支持将代码块用\`或者~包起来，这样可以避免一些二义，还可以为代码块添加id或class

{% highlight html %}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~ {.html #example-1}
<p>paragraph <b>emphasis</b>
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{% endhighlight %}

- 支持手写的表格：

{% highlight html %}
| Function name | Description                    |
| ------------- | ------------------------------ |
| `help()`      | Display the help window.       |
| `destroy()`   | **Destroy your computer!**     |
{% endhighlight %}

- 支持`dl`和`dt`在markdown中的对应语法
- 支持脚注引用

{% highlight html %}
That's some text with a footnote.[^1]

[^1]: And that's the footnote.
{% endhighlight %}

- 支持专有名词`abbr`
- 避免下划线出现在单词中间，导致斜体输出


## Maruku ##

在"始作俑者PHP Markdown Extra"后，很多基于Ruby的Markdown解释器开始浮现。其中，[Maruku](https://github.com/bhollis/maruku)号称：

- 支持原生Markdown
- 支持所有PHP Markdown Extra的特性
- 支持新的元数据语法，实际上就是给元素添加属性的能力
- 支持[公式格式](https://github.com/bhollis/maruku/blob/master/docs/math.md)输出

Maruku的语法详见[这里](https://github.com/bhollis/maruku/blob/master/docs/markdown_syntax.md)

不过，该项目已经停止维护了。

## kramdown ##

同样是ruby开发的解释器，[kramdown](http://kramdown.gettalong.org/quickref.html)吸取了Maruku几乎所有的特点，功能更为强大。其中有特点的功能有：

1. 改进了一些二义语法
2. 引入EOB标记`^`作为块元素的分隔符
3. 手写table的语法更加强大一些，支持table中的header和footer
4. 同样支持ALD(Attribute List Definitions属性列表定义)
5. 还支持注释，以及在转化时配置一些转化选项 

[Github-Page推荐使用这个解释器](https://help.github.com/articles/migrating-your-pages-site-from-maruku)

## RDiscount ##

[RDiscount](http://dafoster.net/projects/rdiscount/)又是一个基于Ruby开发的解释器，不过它是基于[Discount](http://www.pell.portland.or.us/~orc/Code/discount/)的语法移植的，所以语法规则需要参考[Discount](http://www.pell.portland.or.us/~orc/Code/discount/#Language.extensions)。其语法支持几种上面没有提到过的特性：

- 文本居中，即输出`<center>`
- 图片大小定义`![dust mite](http://dust.mite =150x150)`
- 输出`alpha`列表：`<ol type='a'></ol>`

## Redcarpet ##

[Redcarpet](https://github.com/vmg/redcarpet)是一个转化库，可以在标准Markdown的基础上，配置一些额外的功能：

- 单词中间的`_`不处理
- 转化PHP-Markdown风格的手写表格
- 转化PHP-Markdown风格的带包含的代码块，也可禁用标准markdown的代码块语法
- 自动link生成
- 删除线支持：`~~good~~`
- 高亮标签`<mark></mark>`通过`==highlighted==`输出
- 引用标签`<q></q>`通过`"quote"`输出
- 转化PHP-Markdown风格脚注
- 一些二义性的约束支持

## Github支持 ##

Github Page对于上述的基于Ruby的markdown是支持的，从[这里](https://pages.github.com/versions/)可以看到。另外，Github对于Issue、comments等，还定义了GFM([GitHub Flavored Markdown](https://help.github.com/articles/github-flavored-markdown))，其中的语法一般基本来源于上面的提到的东西。除此之外，github还支持一些额外的特性：

- 支持把列表变成带勾选框的任务列表

{% highlight html %}
- [x] @mentions, #refs, [links](), **formatting**, and <del>tags</del> are supported 
- [x] list syntax is required (any unordered or ordered list supported) 
- [x] this is a complete item 
- [ ] this is an incomplete item
{% endhighlight %}


- 站内对分支、问题、用户等对象的直接引用
- [表情](http://www.emoji-cheat-sheet.com/)