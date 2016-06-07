---
title: Html5入门教程系列(4)--CSS第二部分
categories: [web]
tags: [html5]
---

说起`html5`，可能是近1-2年最火的技术词汇之一了，由于市场需求爆增，人才也趋之若鹜。上一篇CSS第一部分，介绍了CSS的基本书写方法、基本语法、选择器、优先级、继承性等主要特性。本篇以几个常见的css属性为例，介绍具体的css属性及其含义。

## 色彩

在css中色彩用于指定元素前景颜色、元素背景颜色等，色彩的表示方法主要有四种：

1. 字面值。如`color:black`表示将前景色设置为黑色。字面值使用常用的英文单词，这种表示方法能表示的颜色有限，很少用
2. RGB三色组合。如`color:rgb(255,0,0)`表示将前景色设置为红色。关于RGB是什么这里就不多说了。RGB还有一种变种`RGBA`即增加一个`alpha`值(0~1)，表示透明度，如`background-color:rgb(255,0,0,0.5)`表示背景色红色，但有50%的透明度。
3. HSL组合。HSL即色相、饱和度、亮度（Hue, Saturation, Lightness），色彩的总量跟RGB是一致的。具体参考[HSL和HSV色彩空间](https://zh.wikipedia.org/wiki/HSL%E5%92%8CHSV%E8%89%B2%E5%BD%A9%E7%A9%BA%E9%97%B4)。与RGB一样，HSL也有HSLA版本。
4. 16进制RGB。如`color:#ff0000`与`color:rgb(255,0,0)`是等价的。其实就是分别加`R``G``B`上的十进制数字转成16进制，并连起来写，用前导`#`开头。这种表示方法用途比价广泛，主要是因为很多绘图软件都会提供颜色的16进制表示法，比较容易复制。另外，16进制的文本次长度比10进制表示法更短一些。当RGB三个值相同时，我们还可以对16进制表示法进一步简写。如：`color:#f00`跟`color:#ff0000`是等价的。

下表给出一些对比示例，大家可以参考：

![](http://pchou.qiniudn.com/h5-presentation-3css-00.jpg)

带`alpha`透明度和不带透明度的对比（下图的背景是白色，所以透明后显得偏粉）：

![](http://pchou.qiniudn.com/h5-presentation-3css-01.jpg)


## 字体

字体千千万万，在Web标准中，字体分为5类，见下表：

![](http://pchou.qiniudn.com/h5-presentation-3css-02.jpg)

- monospace: 一种等宽字体，如`Courier New`
- serif: 有衬线字体，意思是在字的笔画开始、结束的地方有额外的装饰。如`Times New Roman`
- sans serif: 没有衬线的字体。如`Arial`
- cursive: 手写体
- fantasy: 艺术体

![](http://pchou.qiniudn.com/h5-presentation-3css-03.jpg)

在css中指定字体可以使用上述5类的类名，也可以指定具体的字体。例如：

{% highlight css %}

p.font-1:first-child {
  font-family: "Courier New",monospace;
}

{% endhighlight %}

在上面的代码中，指定了字体为`Courier New`和`monospace`，那么浏览器会优先选择`Courier New`，如果用户客户端刚好没有这个字体，那么选择一个系统中存在的`monospace`字体，比如windows下可能是`Consolas`。

由于字体是否可用，取决于用户浏览器是否支持，所以一般而言，在设置字体的时候需要设置一串字体，从左到右，优先级逐渐降低，浏览器会尽可能的选择优先级更高的字体。而出于保险起见，5类类名字体通常垫底起到保底的作用。比如下面是某网站的全局字体设置

{%  highlight css %}

body {
	font-family: Helvetica Neue,Helvetica,Arial,PingFang SC,Hiragino Sans GB,WenQuanYi Micro Hei,Microsoft Yahei,sans-serif;
}

{% endhighlight %}

除了依赖浏览器支持的字体外，在CSS3中，可以通过引用外部字体文件，使浏览器下载特定的字体文件从而支持特殊字体。可以在css中使用`@font-face`来声明一个外部字体：

{% highlight css%}

@font-face {
  font-family: 'FontAwesome';
  src: url('../fonts/fontawesome-webfont.eot?v=3.2.1');
  src: url('../fonts/fontawesome-webfont.eot?#iefix&v=3.2.1') format('embedded-opentype'),  
         url('../fonts/fontawesome-webfont.woff?v=3.2.1') format('woff'),
         url('../fonts/fontawesome-webfont.ttf?v=3.2.1') format('truetype'),
         url('../fonts/fontawesome-webfont.svg#fontawesomeregular?v=3.2.1') format('svg');
}

.icon {
   font-family: FontAwesome;
}

{% endhighlight %}

可以看到，一个字体可以由多种不同的文件来提供，为了最大限度做到浏览器兼容，一般按照上面的字体声明方式提供多种选择，这样浏览器可以根据自身的支持情况选择使用哪种类型的文件。上面的代码声明了一个叫`FontAwesome`的字体，一旦声明，可以像使用普通字体一样使用`font-family`设置。

以前我们在web中使用小图标的时候，通常通过引入`img`来做。这种方式有个缺点是，图片本身不是矢量的，随着放大和缩小，会有锯齿或模糊。如今，流行的做法是采用字体文件来描述图标，这样的图标相对体积更小，而且基于矢量描述，可随意放大缩小。比较常用的图标字体库有：[fontawesome](http://fontawesome.io/)、[阿里妈妈图标定制](http://iconfont.cn/)等。

## 字号

在web中表示字号最常用的方式是`px`单位，这与很多图形或字处理软件的概念类似，不过，在现代web开发中，你需要了解其他的单位：

![](http://pchou.qiniudn.com/h5-presentation-3css-04.jpg)

- in: 是指英尺，1英尺=2.54cm
- px: 像素单位，96像素=1英尺
- em: 一个相对像素单位，用来表示当前元素和它的父元素的字体大小的倍数关系，如果父元素是`10px`，那么`1.5em`相当于`10x1.5=15px`大小
- rem: 一个相对像素单位，与`em`不同之处在于`rem`总是相对根元素进行计算的
- pt: 表示一个点的计量单位，72点=1英尺
- cm: 厘米

这里重点讲一下`em`和`rem`，默认情况下，浏览器会已`16px`作为默认的字体大小，于是`1em`和`1rem`默认都是16px大小。`em`和`rem`都是倍数值。在Web页面初期制作中，我们都是使用`px`来设置我们的文本，因为他比较稳定和精确。但是这种方法存在一个问题，当用户在浏览器中浏览我们制作的Web页面时，他改变了浏览器的字体大小，这时会使用我们的Web页面布局被打破。这样对于那些关心自己网站可用性的用户来说，就是一个大问题了。因此，这时就提出了使用`em`来定义Web页面的字体。

{% highlight css %}

body {
	font-size:10px;
}

p {
	font-size:1.4em;
}

{% endhighlight %}

上面的代码，假设`p`是`body`的直接子节点，那么p的大小将计算为`1.4x10px=14px`。`em`是根据父元素进行倍数计算的。而`rem`也是倍数计算，但是不同点在于参考的是`root`元素，在html中root元素就是`<html>`。`rem`作为`em`的补充，其实更好用，因为，我们往往无法确定`父元素`到底是多大，因为父元素本身可能也是计算出来的。如果能以一个确切的一致的标准来计算可能更为精确，所以`rem`作为`px`和`em`的中间
解决方案，有时更好用一些。

## 行元素和块元素

Html元素有很多，但是都可以归为两类:`行元素`和`块元素`。html文档是个类`xml`的文档，元素在被渲染时，根据xml的前后关系，包含该关系等，按照从上到下，从左到右的顺序的。`块元素`大部分情况下总是占据一整行，而`行元素`总是在一行中从左到右渲染，超出一行后通常会换行。常见的块元素如`p` `div`等，常见的行元素如`span` `strong`等，例如：

{% highlight html %}

<style type="text/css">
    p{ background:red;}
    div{background:yellow;}
    span{ background:blue;color:white;}
    strong{background:green;color:white;}
</style>
<p>块级元素 p </p><div>块级元素 div </div><span>行内元素 span </span><strong>行内元素 strong </strong>

{% endhighlight %}

![](http://pchou.qiniudn.com/h5-presentation-3css-05.jpg)

`行元素`和`块元素`除了在渲染规则上有差别外，还有别的区别，比如`块元素`可以设置宽高，具有盒子模型（下面会提到盒子模型），而行元素不具备。然而，元素到底是`行元素`，还是`块元素`，并不绝对，我们可以通过css改变默认的行为：


{% highlight css %}

display: block; //元素被强制设置为块元素
display: inline; //元素被强制设置为行元素
display: inline-block; //元素按照行元素渲染，但是仍然具有块元素的的盒子模型
display: table-cell; //偶尔会用到的，元素会变成类似table中td的行为
display: none; //不显示元素，而且元素不会占据任何空间。区别于visibility:hidden

{% endhighlight %}

## 盒子模型

理解`行元素`和`块元素`，其实是为了盒子模型打基础的。讨论盒子模型只针对`块元素`:

![](http://pchou.qiniudn.com/h5-presentation-3css-06.jpg)

上图描述的块元素的一些要素，称为盒子模型。我们详细来看一看：

- 矩形：一个块元素可以看成一个矩形
- 边框(border)：深色的是矩形的边框，边框默认是0宽度的，所以默认看不到边框，我们可以通过设置border的一系列属性来改变边框的外观和宽度，甚至是圆角
- 内边距(padding)： 从边框到内容中的留白部分称为内边距，通过设置padding，可以使内容不至于过于贴近边框
- 外边距(margin)：从边框向外遇到另一个块元素或者视图边界之间的留白称外边距，通过设置margin，可以使不同块元素之间留有一定的空间，不至于过于紧凑。
- 宽度和高度(width、height)：默认情况下，块元素的宽度和高度计算的时候，只计算内容的宽度和高度（不包含内边距、边框的宽度和外边距）。这一点读者要注意，因为如果我们在进行一些布局的时候，宽高计算需要比较精确的话，即使块元素的边框只有1px的宽度，也是会影响你的预想的。

通常，我们习惯改变默认的宽高的计算模型，通过设置`box-sizing`

- `box-sizing:content-box`: 默认行为，只计算内容
- `box-sizing:border-box`: 同时计算内容、内边距、边框的和
- `box-sizing:padding-box`: 同时计算内容、内边距的和

我们常用的是上述的第二种，并且总在最开始进行全局设置：

{% highlight css %}

html {
  box-sizing:border-box;
  margin:0;
  padding:0;  
}

{% endhighlight %}


上述代码还同时设置了`margin`和`padding`为`0`是因为，不同的浏览器对块元素都有一个默认的边距设定了，为了使得我们的布局在不同的浏览器中具有相同的表现，会进行这种`reset`。

## 浮动

接着讨论块元素（因为块元素最常用，并且布局大多靠块元素）。上面提到了块元素的渲染特点是必然占据整行的，这将导致我们只能从上到下的进行布局，左右结构布局困难：

![](http://pchou.qiniudn.com/h5-presentation-3css-07.jpg)

从上图可以看到，即使我们设置了div的宽度，块元素总是默认从上到下占据一整行的渲染，即使右侧有空白也不会尝试填充。

好在有浮动(float)机制，使得我们可以让块元素呈现出左右的形态。

基于上面这张图，添加代码:

{% highlight css %}

#div2 {
  float:left;
}

{% endhighlight %}

![](http://pchou.qiniudn.com/h5-presentation-3css-08.jpg)

我们让绿色的div2向左浮动，仔细观察结果，是不是觉得div2好像`被浮起来了`，而且由于浮起来了，div2原来占据的行空间被黄色的div3占据了!因此，看上去div3被div2遮住了上半部分。后面的div4仍然贴住div3，所以也一起移上去了点。

如果设置向右浮动：

{% highlight css %}

#div2 {
  float:right;
}

{% endhighlight %}

![](http://pchou.qiniudn.com/h5-presentation-3css-09.jpg)

我们让绿色的div2向右浮动，这个时候，div2跑到了屏幕右边直到遇到浏览器的视图右边界，而div3和div4的行为跟前一个例子一样，仍然占据了div2原先的行空间。

我们可以得出一个浅显的认知，浮动就是将某个元素浮起来，放到另一个层里面，并且向左或向右移动，直到遇到某种边界。在Html中有一个标准文档流，即正常的块元素从上到下的渲染空间。还有一个用于浮动元素渲染的浮动文档流，浮动元素总是被浮起来，放到这个浮动流中，并可以向左向右直到遇到某种阻力，上面的例子阻力就是div2的容器的边界。我们再来看：

{% highlight css %}

#div2 {
  float:left;
}

#div3 {
  float:left;
}

{% endhighlight %}

![](http://pchou.qiniudn.com/h5-presentation-3css-10.jpg)

同时设置了绿色的div2和黄色的div3为浮动，按照上面的理论，div2被拉入浮动流，并向左直到碰到边界。这个浮动流的上边界是div2
原先的上边界，因为是由于div2的浮动所产生的浮动层；div3也被拉入到div2创造出来的浮动流，于是div3的上边界跟div2一致，并且开始向左浮动，但是由于div3跟div2在同一个层中，div3先碰到了div2，使得无法继续向左，遇到了阻力，所以，div3紧跟在了div2右边。而div4能，好似发现他两个大哥突然消失了一样，向上顶替了老二的位置。于是部分被div2遮住了。

可以看到利用浮动就可以让`块元素`产生左右布局的效果。然而别忘了，上面这个例子中的div4被无情的遮盖住了，所以这可以说是浮动造成的副作用，不过好在解决办法是使用清除浮动：

{% highlight css %}

#div2 {
  float:left;
}

#div3 {
  float:left;
}

#div4 {
  clear:both;
}

{% endhighlight %}

![](http://pchou.qiniudn.com/h5-presentation-3css-11.jpg)

设置div4的`clear:both;`，发现div4不在被覆盖，而是出现在下方，从div3的下边缘的地方开始的位置，这就是`清除浮动`，清除浮动不太好理解。可以认为是`清除浮动的元素周围不能有浮动元素`。如果div4没有清除浮动，那么它将直接跟在div1的下面，从而跟div2这个浮动元素有接触，当设置为清除浮动后，div4不得不跟整个由div2和div3构成的浮动层保持距离，于是就出现在了上图的位置。

在继续下去之前，我们来看一个示例。下面是一个典型三栏网站框架布局：

![](http://pchou.qiniudn.com/h5-presentation-3css-12.jpg)

大体上会采用如下的布局结构：

![](http://pchou.qiniudn.com/h5-presentation-3css-13.jpg)

中间的蓝色div作为容器，包含三个红色的浮动div：

{% highlight html %}

<div class="header">
</div>
<div class="center">
  <div class="left"></div>
  <div class="main"></div>
  <div class="right"></div>
</div>
<div class="footer">
</div>

{% endhighlight %}

忽略关于宽度和高度的样式，重点看一下浮动的样式：

{% highlight css %}

.left {
  float:left;
}

.main {
  float:left;
}

.right {
  float:left;
}

.footer {
  clear:both;
}

{% endhighlight %}

注意`.footer`，必须是清除浮动的，否则footer将被中间的浮动元素层覆盖掉。这么做有个弊端，就是由于某些元素的浮动，而影响到原先并不需要考虑浮动的元素必须增加多余的`清除浮动`，在复杂布局中这将导致混乱。好在有个很巧妙的方法：

{% highlight css %}

.left {
  float:left;
}

.main {
  float:left;
}

.right {
  float:left;
}

.center:after {
    content: " ";
    display:block;
    clear: both;
    visibility: hidden;
    height: 0px;
}

{% endhighlight %}

注意，我们去掉了`.footer`的清除浮动属性，而去设置了`.center`的伪类`:after`，并给这个after清除浮动和一系列的隐藏属性。这个技巧十分常用，即给浮动行的容器设置类似的属性，可以有效的避免浮动层影响接下来的块元素。

再次强调，本例的代码并没有加入宽高的设置，我建议你亲自尝试补充完整，并尝试为`left` `main` `right`添加边框，你可能会遇到意想不到的状况。记得上面说过的`box-sizing`也许会给你点提示。


## 定位

上面介绍了html的流式布局原理，块元素和行元素的区别，也介绍了浮动流可以使块元素得以左右布局。然而，在css中还有一种定位方式十分常见，使用`position属性定位`。`position`可以设置成`fixed` `relative`和`absolute`。










