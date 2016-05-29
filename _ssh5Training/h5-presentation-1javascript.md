---
title: Html5入门教程系列(2)--javascript介绍
categories: [web]
tags: [html5]
---

说起`html5`，可能是近1-2年最火的技术词汇之一了，由于市场需求爆增，人才也趋之若鹜。javascript是前端编程中最为重要的技能之一，是学习前端编程必不可少的。本篇介绍`javascript`，重点从`javascript`与其他语言的不同点入手。


## 理解javascript

先说一句废话：`javascript`跟`java`没有半毛钱关系。javascript是`ECMAScript`的一种实现，而后者广泛应用于web客户端的编程，除了javascript以外，还有`ActionScript`也是`ECMAScript`的实现之一，而`ActionScript`应用于`flash`编程。javascript大致由三部分组成：`ECMAScript`、`DOM`、`BOM`

![](http://pchou.qiniudn.com/2016-05-06-01.jpg)

- DOM：即`文档对象模型(Document Object Model)`，该模型允许通过javascript动态修改html文档的结构和内容，其重要性甚至超过javascript语法本身，可以说如果没有DOM，javascript根本没有卵用。例如

{% highlight html %}

<div id="main"></div>

{% endhighlight %}

执行如下代码后

{% highlight javascript %}

var main = document.getELementById('main');
var p = document.createElement('p');
main.appendChild(p);

{% endhighlight %}

{% highlight html %}

<div id="main"><p></p></div>

{% endhighlight %}

- BOM：即`浏览器对象模型(Browser Object Model)`，该模型允许javascript有限的控制浏览器本身而不是html文档

{% highlight javascript %}

window.history
window.location
window.navigator.userAgent

{% endhighlight %}


## javascript的不同之处

### 弱类型

与C++、C#、java不同在于，javascript是弱类型的，一个变量可以赋予任何的类型

{% highlight javascript %}

var a = 1;
var a = 0.5;
var a = 'str';
var a = "str"; //双引号和单引号都可以表示字符串
var a = [1,2]; //数组
var a = function(){…} //函数类型

{% endhighlight %}

虽说是弱类型语言，但是类型是存在的，下面列举常见的javascript的内置类型

{% highlight javascript %}

typeof(1) //number 类型
typeof(NaN) //特殊的number 类型，表示非数字
typeof("123") //string 
typeof(true) //boolean 
typeof(window) //object 
typeof(document) //object 
typeof(null) //object 
typeof(eval) //function  eval是个函数
typeof(sss): //undefined 表示变量未定义，当使用一个未定义的变量，这个变量不是null也不是false更不是""(空字串)，而是一个特殊的叫undefined的表达
typeof(undefined) //undefined本身也是undefined

{% endhighlight %}


### object

object的使用十分简单，我们可以用json形式的字面代码来表达一个object：

{% highlight javascript %}

var global = { //Using json-like string to define an object
   config: {
       schema: 'http',
       port: '8080',
       host: 'example.com'
   },

   getUrl: function(){
      return this.config.schema + '://' + this.config.host + ':' + this.config.port;
   }
}

global.config.schema //'http'
global.config.getUrl() //http://example.com:8080

{% endhighlight %}

可以看到，一个对象可以包含任何层次的属性或子对象，甚至，可以包含函数。传统的静态类型语言，往往需要我们事先定义好类型(class)，然后通过实例化调用来生成对象。而javascript无需定义这种类型模板。javascript甚至没有`class`的概念。当然，关于这一点，有利也有弊：比如如果在javascript中希望反复的生成相同模板的对象，就显的不够优雅了，我们需要使用`原型链继承`来模拟`class`这个概念，后面会详细讲述原型链这个问题。

除了在定义对象的时候可以为所欲为外，我们可以为所欲为的对一个已经存在的对象添加属性、方法，还可以通过`for`循环来遍历对象的属性，比`C#`和`java`中反射之类的办法容易太多了。

{% highlight javascript %}

global.config.path 			//undefined

global.config.path = '/api/v1/lessons' 	//OK
global.config.path 			// '/api/v1/lessons'

global.config['path']		// '/api/v1/lessons'

for(var name in global.config){ //遍历对象的属性
    global.config[name]
}

{% endhighlight %}


### 函数

函数在javascript中最为常见，然而你可能不知道的是，一个函数实际也是一个对象（一个函数类型的对象实例）。函数的定义有很多种形式，这里我们也可以说实例化一个函数对象有很多种形式：

{% highlight javascript %}

//定义一个叫a的函数对象
var a = function(args){
   …
}

//定义一个叫a的函数对象，也可以这么简写
function a(args){
   …
}

//内部实际上是这么工作的，实例化一个Function类型的对象
var a = new Function(…)

//于是这里其实是实例化了一个匿名函数对象，并将该函数对象作为click方法的参数，调用a.click方法
a.click(function(){
	...
})

{% endhighlight %}


调用函数的时候，跟大多数语言类型，使用`()`，不过javascript也有自己的特殊方式，对于上述示例的`a`方法，有如下几种调用形式：

{% highlight javascript %}

a() //虽然没有传入参数，但是这样调用是可以的，在a内部args此时将是undefined
a('param') //在a内部args此时将是字符串param
a(1,'param') //即使参数超过"规定"，仍然可以工作，在a内部args此时将是number类型的1

//以下两种方式是javascript特有的函数调用，call和apply也是可以调用函数的，不同之处是可以控制函数内部的this指针
//这种形式在javascript的库中很常见，这里不做展开了
a.call(…)
a.apply(…)

{% endhighlight %}


### 逻辑运算和隐式转化

在javascript中，`null` `undefined` `0` `false` `""`在进行`if`测试时，将为假。其他情况都是真！

{% highlight javascript %}

var a = new Date();
if(a){ 
  //此时a应该能通过if测试
}


//var a = new Date();
if(!a){ 
	//由于没有定义a，所以a为undefined
	//而!a，就是真
}

var a = function(){}
if(a){ 
	//a是一个函数对象，所以为真
}


var a = -1
if(a){ 
   //a为真
}

var a = ''
if(a){ 
   //a是空字串，所以这里判为假
}

{% endhighlight %}

从上面的例子中可以看到，在逻辑真假判断上，javascript比静态语言松散很多，所以在实际的编程上也带来了很多方便之处，比如这段代码视图判断a是否是函数对象，如果是则调用a：

{% highlight javascript %}

var a = function(){}
if(a && typeof(a) == "function"){
   a();
}

{% endhighlight %}

甚至可以去掉`if`关键字写成如下形式：

{% highlight javascript %}

var a = function(){}
a && typeof(a) == "function" && a();

{% endhighlight %}

对于javascript，第二种写法显然更好，因为它节省了代码本身的长度，也就节省了下载javascript时候的时间。如果是用静态编程语言的话，恐怕就啰嗦很多了。如果你不以为然，那么看下面这个更常见的例子：


{% highlight javascript %}

var a = function(options){
    var _options = {};
    if(options) _options = options;
    //use _options
    …
}

{% endhighlight %}

上面的代码在函数中，为了保证options的正确使用（因为在调用a的时候甚至可以不传入任何参数），至少保证options是一个object。在很多javascript的库中这种代码很常见，通常都写成如下形式：

{% highlight javascript %}

var a = function(options){
    var _options = options || {};
    //use _options
    …
}

{% endhighlight %}

首先检测传入的options是否为真，如果是真，那么_options自然就赋值为options，`||`检测终止；如果options为假，那么继续检测`||`后面的`{}`，并将`{}`返回赋值给_options。这个技巧很常用，可以牢记。

关于判等，正如许多弱类型语言一样，javascript分为`==`和`===`：

{% highlight javascript %}

var a = 0;
var b = '0';
a == b //will be true
a === b //will be false

var a = undefined;
var b = null;
a == b //will be true
a === b //will be false
a != b //will be false
a !== b //will be true

{% endhighlight %}

### 数组

数组也是一种javascript类型，有如下操作方法：

{% highlight javascript %}

var a = [1,2,3];
var a = new Array(1,2,3);
a[0] = 1;
for(var i=0; i<a.length;i++)
{
    a[i]
}

a.forEach(function(item,index){
   console.log(item + ' is at index of ' + index);
})

{% endhighlight %}

值得一提的是，`a.forEach`是a对象的一个方法，然而我们在定义a对象的时候，并没有给a赋予`forEach`函数，这个函数是哪里来的呢？答案是：这个函数是`Array`类型的原型函数，会被`Array`类型的对象继承。关于原型和继承将在后面的内容中详细说明。作为javascript介绍章节，就此打住。

## 练习

最后，来完成一个小练习，javascript简易计算器：

![](http://pchou.qiniudn.com/2016-05-06-02.jpg)

你可以从[这里](https://github.com/PChou/h5_Traning/blob/master/javascript/calc.html)获得示例代码


