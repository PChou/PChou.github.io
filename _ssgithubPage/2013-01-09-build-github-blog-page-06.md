---
layout: postlayout
title: 一步步在GitHub上创建博客主页(6)
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page, jekyll, SEO]
---

本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇介绍如何增加blog功能。这些功能包括

- 样式、分类、标签
- 增加评论功能
- 增加站内搜索
- 站点访问统计
- SEO

## 样式、分类、标签 ##

在前一篇中我们实际使用jekyll做了一个略微“复杂”的模板。并用它生成了站点。但是这样的blog显然太粗糙了，别说不能吸引别人了，自己都看不下去啊。作为自己的“门户”，当然要把美化工作放在第一位啦。

网站的美观十分重要，这当然要依靠CSS咯。因为完全基于静态页面，所以没有现成的动态模板可以使用，我们只能手写CSS了，这里不介绍CSS了，因为这是设计师的范畴了，屌丝程序员搞不来了。我的blog的样式是从网上找过来改的。

从功能的角度blog除了文章以外，对文章的分类、标签、归档都是主流的功能。

分类和标签功能是jekyll的`yaml-format`的内置功能，在每篇文章上方可以设置：这里需要注意的是如果多个分类或者tag的话，用逗号分隔，并且要紧跟一个空格。分类可以任意添加，Jekyll在解析网站的时候会统计所有的分类，并放到site.categories中；换句话说，不能脱离文章而设置分类。

{% highlight yaml %}
---
layout: default
title: Title
description: 这里的description是自定义属性。
categories: [web-build]
tags: [github-page, jekyll, liquid]
---
{% endhighlight %}

下面是本站罗列分类的代码，供大家参考

{% highlight html+erb %}
{% raw %}
<div class='category'>
	<ul>
		{% for cat in site.categories %}
			<li><a href="{{ site.BASE_PATH }}/category.html#{{ cat[0] }}">{{ cat[0] }}<span>{{ cat[1].size }}</span></a></li>
		{% endfor %}
	</ul>
</div>
{% endraw %}
{% endhighlight %}

注意到分类的url链接，这里用了`hash`来实现。Tag的处理方式类似，这里就省略了。

推荐大家下载jekyll原作者推荐的简单例子来学习：

{% highlight bash %}
$ git clone https://github.com/plusjade/jekyll-bootstrap.git
{% endhighlight %}

下载的目录里面是一个完整的网站，可以使用我们本地的jekyll serve启动。另外，作者的网站：<http://jekyllbootstrap.com/>

 > 你可以在[这里](jekyllthemes.org)找到很多基于jekyll的网站模板，是学习的好地方


## 评论功能 ##

静态的网站不可能自己存放评论，于是只能考虑外挂评论了，查了一下比较靠谱和广泛的就是`DISQUS`了;

点击![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-06-img0.png)，在下面的页面中填写相关的信息，注意先在右侧注册登录信息，然后再在左侧增加一个站点：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-06-img1.png)


填写完成后点击`Continue`，在接下来的页面中选择`Universal Code`，然后根据提示完成接下来的操作，后面的操作就十分简单了：主要就是把产生的脚本文件复制到你的站点页面中即可。

DISQUS还有一个Dashboard，可以用来管理评论，这里就不再详述了。最后的效果就是本blog文章下方的评论咯，还是挺好看的，如果您觉得文章对您有帮助也可以留下您的意见哦～呵呵

 

## 站内搜索 ##

blog当然不能缺少站内搜索功能。主流的站内搜索都是主流的搜索引擎提供的。作为一个google控，当然必须选择google啊。当然你必须拥有一个google帐号。

google的站内搜索叫：[custome search engine](http://www.google.com/cse)

创建一个自定义搜索与添加评论类似只要三步：

- 填写自定义搜索的名字、描述、语言、站点信息，这些信息中唯一需要注意的是站点信息，建议使用`mydomain.com`作为搜索范围，因为这样的话，会自动转化成`*.mydomain.com/*`，能包含全站的内容
- 选择样式和尝试搜索。尝试搜索有时不能成功，但是不要紧
- 将生成脚本写到网页中

这时，可能搜索功能仍然无法使用，尤其是你的网站没有什么名气，也没有什么外链。因为google的爬虫不可能很快的抓到你的网站。但这里有个技巧可以让你的网站立刻被google收录（姑且不论排名），那就是google的Webmaster Tools工具，该工具是免费的，而且还集成了站点流量统计功能，十分强大。

进入地址：<https://www.google.com/webmasters/tools/home>

点击![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-06-img5.png)


Webmaster Tools需要认证你的站点，它会自动检测你的域名提供商，并给出详细的步骤执导你如何配置。我的域名提供商是goddady，所以将看到如下提示：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-06-img2.png)


需要我在DNS记录中增加一条TXT记录，于是我照做了。设置完成之后基本上立刻就生效了，无需等待一天。

认证成功后，在面板中打开你的网站：

![]({{ site.BASE_PATH }}/assets/img/build-github-blog-page-06-img4.png)

打开`Optimization`->`Sitemaps`，点击`Add/TEST SITEMAP`，输入指向你的站点的sitemap地址，本博客的sitemap是：<http://pchou.info/sitemap.txt>

> `sitemap`是网站所有链接的集合，最简单的sitemap可以是一个文本文件，其中只存放你网站的所有可用资源的链接，这有利于搜索引擎收录你的网站内容。复杂的sitemap还可以利用sitemap的专用格式来标注资源的形式，更多关于sitemap可以参考：<http://www.sitemaps.org/>
\
完成站点认证和sitemap测试后，我们回到自定义搜索的页面，进入到`control panel`->`Indexing`，在其中使用sitemap来迫使google索引你的网站。这样，你的网站就算被google收录了。
 

## 站点统计 ##

这里介绍的站点统计是google的`analytics`，`analytics`的使用十分简单，又十分复杂。同样的原理，利用注入脚本来实现流量统计的外挂，统计功能十分强大，谁用谁知道。这里就不再唠叨了。不过由于GFW的原因，analytics的管理页面已经几乎无法访问了，只能翻墙才行。可以考虑用国内的其他产品替代。
