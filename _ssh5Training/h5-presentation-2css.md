---
title: Html5入门教程系列(3)--CSS第一部分
categories: [web]
tags: [html5]
---

说起`html5`，可能是近1-2年最火的技术词汇之一了，由于市场需求爆增，人才也趋之若鹜。在整个`html5`规范中，css3可谓是最为明显，也是用的最多的。本篇开始连续两篇介绍css技术。


## 历史

css经历了如下的变迁

![](http://pchou.qiniudn.com/h5-presentation-css-01.jpg)

然而，为什么没有提到`CSS3`，因为`CSS3`并不是指CSS的某个特定版本。怎么理解呢？我来解释一下CSS标准制定的过程。

首先，CSS特性被分成若干组，称为`module`，每个`module`有自己的独立的演进过程。演进的过程用`level`表示，不少`module`已经演进到`level3`了，所以我们习惯称为`CSS3`。在每个`level`上，都会经历4种表示成熟度的状态：

![](http://pchou.qiniudn.com/h5-presentation-css-02.jpg)

我们经常看见的`WD`、`CR`、`PR`、`REC`就是这四种状态的简写：

- `WD`：起草状态，表示该`module`包含的特性正在研究中，进入公测阶段，不保证将来不会变化
- `CR`：候选状态，表示通过公测，委员会认为基本稳定，开始征求改进意见
- `PR`：提交状态，表示已经提交委员会等待发布
- `REC`：发布状态，表示模块已经被推荐可广泛使用

我们来看一些例子，这个截图是从CSS工作组的[官方网站](https://www.w3.org/Style/CSS/)截取的：

![](http://pchou.qiniudn.com/h5-presentation-css-03.jpg)

从图中可以看到，例如`CSS Color Level 3`已经是`REC`状态，`CSS Backgrounds and Borders Level 3`才是`CR`状态，而我们在很多H5动画中广泛使用的动画竟然只是`WD`状态。这里的状态只是给大家一个参考，具体能不能用还要看实际场景和浏览器实现的情况。


## CSS基础部分

CSS的用处就是修饰html文档，使html看起来更美观。如果没有CSS的话，html基于从上到下（块元素），从左到右（内联元素）依次渲染标签。不同的浏览器对标签的渲染有所不同，体现在字体，边距这些基本样式上，是有差异的。所以为了能在不同的浏览器上获得相同的视觉体验，前端工程师往往需要对浏览器这种默认的行为利用CSS进行覆盖，我们称为`reset`。

在实际的开发过程中，html和css往往是相互配合的，不过应该尽量以html标签的语义为主，有些样式实在不方便表达的时候，可以通过添加无用的标签来辅助css工作。两者的权衡是一个前端开发人员的经验和个人习惯，没有统一的标准，但有一些可循的规律和最佳实践。随着经验的累积，会越来越轻松和顺手。所以css其实并不是有多难，而是需要长时间的积累的经验的功夫，就好比很多后端不是专业的css程序员，也能看懂css，但是实际自己写的时候却无从下手了。

作为入门教程，本系列只是从基础开始带领大家对css这门语言有个基本的认识。

### 基本语法：属性设定

css主要语法分两部分：`属性设定`和`元素选择`。现在看看属性设定。假设，我希望将一个`p`标签中的文字显示成红色（默认是黑色）

{% highlight html %}

<p style="color:red">Hello, Html5!</p>

{% endhighlight %}

效果如下：

<p style="color:red">Hello, Html5!</p>

我们使用`property:value`的形式来指定属性和值，这个例子中`color`属性将设置标签的前景色，而`red`属性是一个常量表示一个纯红色。将这样的属性设置填写在标签`p`的`style`属性上就可以发生作用。css规定了大量的属性，随着css标准的发展，属性还在不断的增长，在本教程中，我将罗列一下常见的属性，还有很多属性的用法需要大家在日后的工作中逐渐学习掌握。

一些较新的属性可能需要用特定浏览器前缀才能工作，比如：

{% highlight html %}

-moz-box-sizing
-webkit-box-sizing
-o-box-sizing
-ms-box-sizing

{% endhighlight %}

`moz`适用于firefox，`webkit`适用于chrome和safari，`o`适用于opera，`ms`适用于ie。上面的属性其实是表示同一个属性`box-sizing`，只是由于有些浏览器的较低版本可能无法直接理解`box-sizing`，而是需要使用特定的前缀。

在一个网站前端页面中，编写css的方式有3种：

- 1.内联样式：上面的例子就是一个内联的样式的例子，即把属性直接写在`style`中，这种写法的优先级最高
- 2.在html文档中嵌入样式：即写一个`style`标签，将样式统一写在其中

{% highlight html %}

<style type="text/css">
	p {
		color: red;
	}
</style>

{% endhighlight %}

- 3.编写一个独立的`.css`文件，将样式写在这个文件中，并在html的合适的位置引用这个外部文件（通常在head里面引用）。比如本博客的某样式引用：

{% highlight html %}
<link href="/assets/css/style.css?v=1.1" rel="stylesheet">
{% endhighlight %}


在遇到样式冲突的时候，一般而言1具有最高的优先级，而2和3的优先级取决于出现的位置，越晚出现的样式会覆盖掉先前出现的样式。关于优先级还有更精细的问题后面会提到。

### 基本语法：选择器

`属性设置`描述了对元素的外观设置，但是却无法表达目标元素到底是什么。css基本语法的另一个重要部分叫`元素选择`，也叫`选择器`。即一种指定html元素(或者叫标签)的语法。因此，完整的css语法应该是：

{% highlight css %}

selector {
	property: value;
}

{% endhighlight %}

有`selector`选择器和若干属性设置对组成。由于内联样式是直接写在某个元素上的所以无需选择器，这种语法只需写在嵌入型样式和独立的css文件中。接下来我们来详细了解一下选择器。

最常用的选择器是`id选择器`和`class选择器`，例如：

{% highlight html %}

<style type="text/css">

#main {
	width: 300px;
	height: 20px;
	margin: 20px auto;
	background-color: #0ff;
	border: 1px solid #ff0;
}

</style>

<div id="main"></div>

{% endhighlight %}

上面的css通过嵌入html的形式，指定了一个id为`main`的元素的样式，效果如下：

<style type="text/css">

#main {
	width: 300px;
	height: 20px;
	margin: 20px auto;
	background-color: #0ff;
	border: 1px solid #ff0;

}

</style>

<div id="main"></div>

此时，无论元素本身是什么元素（此例子为div），都会在渲染的时候应用指定的样式，只要元素具有`id="main"`这个属性就能应用样式设置，这种选择器称为`id选择器`。

跟`id选择器`类似的`class选择器`，有了id选择器的知识，不难理解class选择器，对上面的例子稍作改动，将`id`换成`class`：

{% highlight html %}

<style type="text/css">

.main {
	width: 300px;
	height: 20px;
	margin: 20px auto;
	background-color: #0ff;
	border: 1px solid #ff0;
}

</style>

<div class="main"></div>

{% endhighlight %}

效果如下：

<style type="text/css">

.main {
	width: 300px;
	height: 20px;
	margin: 20px auto;
	background-color: #0ff;
	border: 1px solid #ff0;

}

</style>

<div class="main"></div>

作为对比，我们可以发现id选择器使用`#`号，而class选择器使用`.`号，大家应该牢记这两个符号。

除了这两个，css的选择器种类还有很多，而且也在不断新增，我们再来看几个例子：

{% highlight html %}

<style type="text/css">

addr {
	display: block;
	width: 300px;
	height: 20px;
	line-height: 20px;
	margin: 20px auto;
	background-color: #000;
	color: #fff;
	text-align: center;
}

</style>

<addr>Hello html5!</addr>

{% endhighlight %}

没有`#`或者`.`开头称为`标签选择器`，是直接查找元素名的，元素名可以自定义，也可以使用html定义好的元素，效果如下：

<style type="text/css">

addr {
	display: block;
	width: 300px;
	height: 20px;
	line-height: 20px;
	margin: 20px auto;
	background-color: #000;
	color: #fff;
	text-align: center;
}

</style>

<addr>Hello html5!</addr>

不同的基础选择器语法可以组合：

{% highlight html %}

<style type="text/css">

div#author {
	display: block;
	width: 300px;
	height: 20px;
	line-height: 20px;
	margin: 20px auto;
	background-color: #000;
	color: #fff;
	text-align: center;
}

</style>

<div id="author">Hello html5!</div>
<div>Hello html5!</div>

{% endhighlight %}

在这个例子中，选择的是`id为author的div`，所以两个条件必须同时满足才能匹配上，效果如下：

<style type="text/css">

div#author {
	display: block;
	width: 300px;
	height: 20px;
	line-height: 20px;
	margin: 20px auto;
	background-color: #000;
	color: #fff;
	text-align: center;
}

</style>

<div id="author">Hello html5!</div>
<div>Hello html5!</div>

还有一种选择方式是基于目标之间的关系的，比如：

{% highlight html %}

<style type="text/css">

div#author div {
	display: block;
	width: 300px;
	height: 20px;
	line-height: 20px;
	margin: 20px auto;
	background-color: #000;
	color: #fff;
	text-align: center;
}

</style>

<div id="author">
	<div>div#author下的div </div>
</div>
<div>其他div</div>

{% endhighlight %}

这个例子中的`div#author div`是指`选择id为author这个div内部的div`，所以效果如下：

<style type="text/css">

div#author div {
	display: block;
	width: 300px;
	height: 20px;
	line-height: 20px;
	margin: 20px auto;
	background-color: #000;
	color: #fff;
	text-align: center;
}

</style>

<div id="author">
	<div>div#author下的div </div>
</div>
<div>其他div</div>

好了例子举到这里，接下来来看下一些常用的选择器汇总：

下面这些是基本选择器：

![](http://pchou.qiniudn.com/h5-presentation-css-04.jpg)

下面这些是属性选择器，即可以对选择的元素属性进行更复杂的定义：

![](http://pchou.qiniudn.com/h5-presentation-css-05.jpg)

下面这些称为伪类和伪元素：

![](http://pchou.qiniudn.com/h5-presentation-css-06.jpg)

伪类可能不太好理解，作为基础教程这里就不详细展开了，举一个使用`:first-child`的例子，也是比较常用的：

<style type="text/css">

ul#t5 {
	list-style: none;
}

ul#t5 li {
	border-top: 1px solid #aaa;
}

ul#t5 li:first-child {
	border-top: none;
}

</style>

<ul id="t5">
	<li>第一行顶部不希望有横线</li>
	<li>第二行顶部有横线</li>
	<li>第三行顶部有横线</li>
	<li>第四行顶部有横线</li>
</ul>

这里例子中，行与行之间有分割线，你可能想到对每一行的元素加一个`border-top`或者`border-bottom`，但是，如果用`border-top`，第一行的上方也会出现横线；`border-bottom`解决不了最后一行的问题，这是不希望看到的，所以上面的代码是这么写的：

{% highlight html %}

<style type="text/css">

ul#t5 {
	list-style: none;
}

ul#t5 li {
	border-top: 1px solid #aaa;
}

ul#t5 li:first-child {
	border-top: none;
}

</style>

<ul id="t5">
	<li>第一行顶部不希望有横线</li>
	<li>第二行顶部有横线</li>
	<li>第三行顶部有横线</li>
	<li>第四行顶部有横线</li>
</ul>

{% endhighlight %}

我们使用`li:first-child`来选择一个`li`，这个`li`是其父节点`ul`的`第一个孩子节点`，这里的重点是`li:first-child`选择的仍然是`li`，而不是`li的子节点`。有些新手在遇到这个问题的时候可能会写出下面的代码：

{% highlight css %}

ul:first-child {
	border-top: none;
}

{% endhighlight %}

这就是理解错了。

### 优先级

从css的书写方式和选择器设计来看，很难保证不会出现样式冲突的问题，那么久必须要规定一种优先级机制来保证行为的一致。在css中考察优先级有三个大的方面：

- 1) 如果属性设置有出现了`!important`，那么优先级最高，甚至高于内联写法。

{% highlight css %}

color: #999!important

{% endhighlight %}

- 2) 其次内联书写方式优先级比较高。
- 3) 使用选择器进行样式设定时，如果不同的选择器指向了相同的元素，并且属性属性设置有重复和冲突，那么`选择器越具体的优先级越高`。关注这一点下面会详细展开。
- 4) 如果上述判断都无法决断，那么出现顺序越晚的优先级越高，即后来的覆盖之前的。

根据3)来看，选择器有个所谓的具体不具体，拿生活中的例子来说，就好比：

- 去买点水果
- 去买点苹果
- 去买点红富士苹果
- 去买点5块钱以上的红富士苹果
- 去家乐福买点5块钱以上的红富士苹果

这几个指令，显然最后一个更详细，更具体。作为浏览器更重视最后一个。言归正传，选择器有很多种，还可以互相组合，为了能够无异议的表达具体与否，每种基础选择器都有相应的分值，组合的选择器就是把基础的选择器相加得到最后的分值。如下表：

![](http://pchou.qiniudn.com/h5-presentation-css-07.jpg)

- `标签选择器`和`伪元素选择器`，具有c级的1分，多个`标签选择器`组合就是对c值进行累加
- `class选择器` `属性选择器`和`伪类`，具有b级的1分，出现多个`class选择器`就是对b值进行累加
- `id选择器`，具有a级的1分，出现多个`id选择器`就是对a值进行累加

> 对于`:not()`伪类，括号内的选择器将正常计数，但是`:not()`本身不计数（本来应该b+1）

上述规则可参见[官方Calculating a selector's specificity](https://www.w3.org/TR/selectors/#specificity)

可以看到，从`具体`的角度而言，显然`id选择器`更具体，浏览器认为`id选择器`是很精确的，而`标签选择器`浏览器不认为是一种精确的选择。通过这样的计算方法，可以算出选择器的`具体值`，从而判断优先级，具体指越大，优先级越高。

不过这不代表我们在书写css的时候都要用`id选择器`来避免歧义和优先级判断。相反，前端工程师们，经常利用这一点，实现了很多css库，这些库往往都使用较为低优先级的策略，从而使得用户可以自行在需要的时候用高优先级的选择器进行覆盖。

### 继承性

继承相对比较好理解。如果父元素定义了`font(字体)`，那么子元素默认是会继承这个定义的，除非子元素自己重新定义一下`font`。比如：

{% highlight html %}

<style type="text/css">

.parent {
	font-size: 25px;
	text-align: center;
}

</style>

<div class="parent">
	我是父节点里面的文字
	<div class="child">我是子节点里面的文字</div>
</div>

{% endhighlight %}

<style type="text/css">

.parent-1 {
	font-size: 25px;
	text-align: center;
}

</style>

<div class="parent-1">
	我是父节点里面的文字
	<div class="child-1">我是子节点里面的文字</div>
</div>

可以看到子节点的文字也变大了，并且跟父节点的文字大小相同，因为子节点并没有指定字体大小，所以继承了最近的父节点的字体大小。如果此时设置子节点的字体大小，就可以覆盖掉父节点的字体大小：

{% highlight html %}

<style type="text/css">

.parent {
	font-size: 25px;
	text-align: center;
}

.child {
	font-size: 10px;
}

</style>

<div class="parent">
	我是父节点里面的文字
	<div class="child">我是子节点里面的文字</div>
</div>

{% endhighlight %}

<style type="text/css">

.parent-2 {
	font-size: 25px;
	text-align: center;
}

.child-2 {
	font-size: 10px;
}

</style>

<div class="parent-2">
	我是父节点里面的文字
	<div class="child-2">我是子节点里面的文字</div>
</div>


