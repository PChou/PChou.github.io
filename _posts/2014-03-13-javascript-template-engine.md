---
layout: postlayout
title: javascript模板引擎和实现原理
thumbimg: JavaScript-logo.png
categories: [javascript]
tags: [javascript,template,Function]
---

模板分离了数据与展现，使得展现的逻辑和效果更易维护。利用javascript的Function对象，一步步构建一个极其简单的模板转化引擎

## 模板简介 ##

模板通常是指嵌入了某种动态编程语言代码的文本，数据和模板通过某种形式的结合，可以变化出不同的结果。模板通常用来定义显示的形式，能够使得数据展现更为丰富，而且容易维护。例如，下面是一个模板的例子：

{% highlight js+erb %}
<ul>
	<% for(var i in items){ %>
		<li class='<%= items[i].status %>'><%= items[i].text %></li>
		<% } %>
</ul>
{% endhighlight %}

如果有如下`items`数据：

{% highlight js %}
items:[
	{ text: 'text1' ,status:'done' },
	{ text: 'text2' ,status:'pending' },
	{ text: 'text3' ,status:'pending' },
	{ text: 'text4' ,status:'processing' }
]
{% endhighlight %}

通过某种方式的结合，可以产生下面的Html代码：

{% highlight html %}
<ul>
	<li class='done'>text1<li>
	<li class='pending'>text2<li>
	<li class='pending'>text3<li>
	<li class='processing'>text4<li>
</ul>
{% endhighlight %}


如果不使用模板，想要达到同样的效果，即将上面的数据展现成结果的样子，需要像下面这样做：

{% highlight js %}
var temp = '<ul>';
for(var i in items){
	temp += "<li class='" + items[i].status + "'>" + items[i].text + "</li>";
}
temp += '</ul>';
{% endhighlight %}

可以看出使用模板有如下好处：

- 简化了html的书写
- 通过编程元素（比如循环和条件分支），对数据的展现更具有控制的能力
- 分离了数据与展现，使得展现的逻辑和效果更易维护

## 模板引擎 ##
通过分析模板，将数据和模板结合在一起输出最后的结果的程序称为模板引擎，模板有很多种，相对应的模板引擎也有很多种。一种比较古老的模板称为`ERB`，在很多的web框架中被采用，比如：`ASP.NET` 、 `Rails` ... 上面的例子就是ERB的例子。在ERB中两个核心的概念：`evaluate`和`interpolate`。表面上`evaluate`是指包含在`<% %>`中的部分，`interpolate`是指包含在`<%= %>`中的部分。从模板引擎的角度，`evaluate`中的部分不会直接输出到结果中，一般用于过程控制；而`interpolate`中的部分将直接输出到结果中。

从模板引擎的实现上看，需要依赖编程语言的动态编译或者动态解释的特性，以简化实现和提高性能。例如：`ASP.NET`利用.NET的动态编译，将模板编译成动态的类，并利用反射动态执行类中的代码。这种实现实际上是比较复杂的，因为C#是一门静态的编程语言，但是使用javascript可以利用Function，以极少的代码实现一个简易的模板引擎。本文就来实现一个简易的ERB模板引擎，以展现javascript的强大之处。


## 模板文本转化 ##
针对上面的例子，回顾一下使用模板和不使用模板的差别：

模板写法：

{% highlight js+erb %}

<ul>
	<% for(var i in items){ %>
		<li class='<%= items[i].status %>'><%= items[i].text %></li>
	<% } %>
</ul>

{% endhighlight %}

非模板写法：

{% highlight js %}

var temp = '<ul>';
for(var i in items){
	temp += "<li class='" + items[i].status + "'>" + items[i].text + "</li>";
}
temp += '</ul>';

{% endhighlight %}

仔细观察，实际上这两种方法十分“相似”，能够找到某种意义上的一一对应。如果能够将模板的文本变成代码执行，那么就能实现模板转化。在转化过程中有两个原则：

1.	遇到普通的文本直接当成字符串拼接
2.	遇到`interpolate`(即`<%= %>`)，将其中的内容当成变量拼接在字符串中
3.	遇到`evaluate`(即`<% %>`)，直接当成代码

将上面的例子按照上述原则进行变换，再添加一个总的函数：

{% highlight js %}
var template = function(items){
	var temp = '';
	//开始变换
	temp += '<ul>';
	for(var i in items){
		temp += "<li class='" + items[i].status + "'>" + items[i].text + "</li>";
	}
	temp += '</ul>';
}
{% endhighlight %}

最后执行这个函数，传入数据参数即可：

{% highlight js %}
var result = template(items);
{% endhighlight %}

## javascript动态函数 ##

可见上面的转化逻辑其实十分简单，但是关键的问题是，模板是变化的，这意味着生成的程序代码也必须是在运行时生成并执行的。好在javascript有许多动态特性，其中一个强大的特性就是[Function](http://www.w3school.com.cn/js/pro_js_functions_function_object.asp)。
我们通常使用`function`关键字在js中声明函数，很少用`Function`。在js中`function`是字面语法，js的运行时会将字面的`function`转化成`Function`对象，所以实际上`Function`提供了更为底层和灵活的机制。

用 Function 类直接创建函数的语法如下：

{% highlight js %}
var function_name = new Function(arg1, arg2, ..., argN, function_body)
{% endhighlight %}

例如：

{% highlight js %}
//创建动态函数	
var sayHi = new Function("sName", "sMessage", "alert(\"Hello \" + sName + sMessage);");
//执行	
sayHi('Hello','World');
{% endhighlight %}

函数体和参数都能够通过字符串来创建！So cool！有了这个特性，可以将模板文本转化成函数体的字符串，这样就可以创建动态的函数来动态的调用了。

## 实现思路 ##

首先利用正则式来描述`interpolate`和`evaluate`，括号用来分组捕获：

{% highlight js %}
var interpolate_reg = /<%=([\s\S]+?)%>/g;
var evaluate_reg = /<%([\s\S]+?)%>/g;
{% endhighlight %}

为了对整个模板进行连续的匹配将这两个正则式合并在一起，但是注意，所有能够匹配interpolate的字符串都能匹配evaluate，所以interpolate需要有较高的优先级：

{% highlight js %}
var matcher = /<%=([\s\S]+?)%>|<%([\s\S]+?)%>/g
{% endhighlight %}

设计一个函数用于转化模板，输入参数为模板文本字串和数据对象

{% highlight js %}
var matcher = /<%=([\s\S]+?)%>|<%([\s\S]+?)%>/g
//text: 传入的模板文本字串
//data: 数据对象
var template = function(text,data){ ... }
{% endhighlight %}


使用[replace](http://www.w3school.com.cn/jsref/jsref_replace.asp)方法，进行正则的匹配和“替换”，实际上我们的目的不是要替换`interpolate`或`evaluate`，而是在匹配的过程中构建出“方法体"：

{% highlight js %}
var matcher = /<%=([\s\S]+?)%>|<%([\s\S]+?)%>/g
//text: 传入的模板文本字串
//data: 数据对象
var template = function(text,data){
	var index = 0;//记录当前扫描到哪里了
	var function_body = "var temp = '';";
	function_body += "temp += '";
	text.replace(matcher,function(match,interpolate,evaluate,offset){
		//找到第一个匹配后，将前面部分作为普通字符串拼接的表达式
		function_body += text.slice(index,offset);
		
		//如果是<% ... %>直接作为代码片段，evaluate就是捕获的分组
		if(evaluate){
			function_body += "';" + evaluate + "temp += '";
		}
		//如果是<%= ... %>拼接字符串，interpolate就是捕获的分组
		if(interpolate){
			function_body += "' + " + interpolate + " + '";
		}
		//递增index，跳过evaluate或者interpolate
		index = offset + match.length;
		//这里的return没有什么意义，因为关键不是替换text，而是构建function_body
		return match;
	});
		//最后的代码应该是返回temp
	function_body += "';return temp;";
}
{% endhighlight %}

至此，`function_body`虽然是个字符串，但里面的内容实际上是一段函数代码，可以用这个变量来动态创建一个函数对象，并通过data参数调用：

{% highlight js %}
var render = new Function('obj', function_body);
return render(data);
{% endhighlight %}

这样`render`就是一个方法，可以调用，方法内部的代码由模板的内容构造，但是大致的框架应该是这样的：

{% highlight js %}
function render(obj){
	var temp = '';
	temp += ...
	...
	return temp;
}
{% endhighlight %}

注意到，方法的形参是`obj`，所以模板内部引用的变量应该是`obj`：

{% highlight js+erb %}
<script id='template' type='javascript/template'>
	<ul>
		<% for(var i in obj){ %>
			<li class="<%= obj[i].status %>"><%= obj[i].text %></li>
		<% } %>
	</ul>
</script>
{% endhighlight %}

看似到这里就OK了，但是有个必须解决的问题。模板文本中可能包含`\r` `\n` `\u2028` `\u2029`等字符，这些字符如果出现在代码中，会出错，比如下面的代码是错误的：

{% highlight js %}
temp += '
		<ul>
	' + ... ;
{% endhighlight %}


我们希望看到的应该是这样的代码：

{% highlight js %}
temp += '\n \t\t<ul>\n' + ...;
{% endhighlight %}


这样需要把`\n`前面的`\`转义成`\\`即可，最终变成字面的`\\n`。

另外，还有一个问题是，上面的代码无法将最后一个`evaluate`或者`interpolate`后面的部分拼接进来，解决这个问题的办法也很简单，只需要在正则式中添加一个行尾的匹配即可：

{% highlight js %}
var matcher = /<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g;
{% endhighlight %}

## 相对完整的代码 ##

{% highlight js %}
var matcher = /<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g

//模板文本中的特殊字符转义处理
var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

//text: 传入的模板文本字串
//data: 数据对象
var template = function(text,data){
	var index = 0;//记录当前扫描到哪里了
	var function_body = "var temp = '';";
	function_body += "temp += '";
	text.replace(matcher,function(match,interpolate,evaluate,offset){
		//找到第一个匹配后，将前面部分作为普通字符串拼接的表达式
		//添加了处理转义字符
		function_body += text.slice(index,offset)
			.replace(escaper, function(match) { return '\\' + escapes[match]; });

		//如果是<% ... %>直接作为代码片段，evaluate就是捕获的分组
		if(evaluate){
			function_body += "';" + evaluate + "temp += '";
		}
		//如果是<%= ... %>拼接字符串，interpolate就是捕获的分组
		if(interpolate){
			function_body += "' + " + interpolate + " + '";
		}
		//递增index，跳过evaluate或者interpolate
		index = offset + match.length;
		//这里的return没有什么意义，因为关键不是替换text，而是构建function_body
		return match;
	});
		//最后的代码应该是返回temp
	function_body += "';return temp;";
	var render = new Function('obj', function_body);
	return render(data);
}
{% endhighlight %}

调用代码可以是这样：

{% highlight js+erb %}
<script id='template' type='javascript/template'>
	<ul>
		<% for(var i in obj){ %>
			<li class="<%= obj[i].status %>"><%= obj[i].text %></li>
		<% } %>
	</ul>
</script>

...

var text = document.getElementById('template').innerHTML;
var items = [
	{ text: 'text1' ,status:'done' },
	{ text: 'text2' ,status:'pending' },
	{ text: 'text3' ,status:'pending' },
	{ text: 'text4' ,status:'processing' }
];
console.log(template(text,items));

{% endhighlight %}

可见，我们只用了很少的代码就实现了一个简易的模板。

## 遗留的问题 ##
还有几个细节的问题需要注意：

1. 因为`<%`或者`%>`都是模板的边界字符，如果模板需要输出`<%`或者`%>`，那么需要设计转义的办法
2. 如果数据对象中包含有`null`，显然不希望最后输出`'null'`,所以需要在`function_body`的代码中考虑`null`的情况
3. 在模板中每次使用`obj`的形参引用数据，可能不太方便，可以在`function_body`添加`with(obj||{}){...}`，这样模板中可以直接使用`obj`的属性
4. 可以设计将`render`返回出去，而不是返回转化的结果，这样外部可以缓存生成的函数，以提高性能