---
layout: postlayout
title: Backbone精髓，观察者模式和事件
thumbimg: JavaScript-logo.png
categories: [javascript]
tags: [javascript,backbone]
---

## 前言 ##
Backbone作为众多MVC框架之一，特点是小巧轻量。笔者认为，在MVC的背后，100多行的核心事件机制代码起到了至关重要的作用，也是用户理解并应用Backbone的关键。本人并非专业的前端，只是由于需要被迫转做一段时间的前端，一段时间以来开始探索javascript上的MVC模式，最终打算从[Backbone](http://backbonejs.org)下手。在实战了一段时间以后，对Backbone有了一些个人的理解，记录在这里。不过，MVC是讲烂掉的话题了，本文并不讨论。



## UI交互逻辑更需要设计模式 ##

设计模式将人们在以往的开发过程中的经验加以总结，以指导后人。然而，本人从事web后端开发的几年间，所使用到的设计模式其实很单一，无非就是工厂模式、单例模式、依赖反转。而更多的模式已经被开发框架所实现，程序员要做到仅仅是写几个`if-else`和`for`以实现业务逻辑。那么真正需要设计模式的地方在哪里呢?**翻遍设计模式的书，可发现其中的例子基本上是用户界面实现、编译器实现，很多高深的模式都在这些应用中得以体现。**

注意到现在web应用越来越多，而传统的客户端应用越来越少(除app之外)，而人们对web程序的用户体验要求也是越来越高，传统的表单提交、页面刷新、重定向等用户交互方式越来越不被用户买账。因此，javascript的历史地位空前的高，并且，围绕javascript，产生了大量的库和框架方便基于浏览器开发用户交互，甚至提出了javascript MVC思想，诸多的框架在javascript层面上实现了MVC模式。


## 观察者模式 ##
其实，个人认为UI交互逻辑最需要的是MV模式，即模型和视图的关联，至于控制器，可有可无。**而M和V之间的实现关联的重要设计模式之一就是`观察者模式`**，即由于视图呈现的复杂和多样化，为了便于扩展，需要视图有一种随模型数据的变化而“自行变化”的能力，而实现方式就是，视图通过侦听模型对象的变化而渲染自己，不需要外力来渲染，外力只需要改变唯一的标准--模型对象就可以了。

![](http://pchou.qiniudn.com/backbone-event-observation.png)


## Backbone的事件 ##
根据上面讨论，要实现观察者模式，`事件`是非常重要的机制。在浏览器和javascript中，**原生的事件是浏览器实现的基于DOM的事件体系。然而，这在我们需要的M和V的观察者模式中是不够的。幸好，Backbone实现了这样的机制。**有了它，能够让任何javascript对象拥有“事件能力”，来看看是如何做到的：

你可能没有注意过`Backbone.Events`就是事件实现的核心，它可以让对象拥有**事件能力**

{% highlight js %}
var Events = Backbone.Events = { .. }
{% endhighlight %}

那么具体的看，事件能力究竟包含哪些能力呢？我们简单的来看一下：

### listenTo: function(obj, name, callback) ###
使当前对象侦听`obj`对象的一个叫`name`的事件，当事件被触发后，回调`callback`

### listenToOnce: function(obj, name, callback) ###
使当前对象侦听`obj`对象的一个叫`name`的事件，当事件被触发后，回调`callback`一次（以后不会再回调）

### trigger: function(name) ###
当前对象触发`name`事件

看下面的实验下面的代码：

{% highlight js %}
var model = _.extend({},Backbone.Events);
var view = _.extend({},Backbone.Events);
view.listenTo(model,'custom_event',function(){ alert('catch the event') });
model.trigger('custom_event');
{% endhighlight %}

可以在[jsfiddle](http://jsfiddle.net/)上实验这个代码，结果如下：

![](http://pchou.qiniudn.com/backbone-event-01.jpg)

可以看到，依靠`Backbone.Events`是可以实现观察者模式的。因为对于上面代码的`model`对象而言，它并不知道`view`对象在侦听它，甚至可以有更多的其他对象去侦听这个model。这样的话，如果model发生了某种改变就可以通过事件来发出通知。

但是，大量的将`Backbone.Events`扩展到实际的对象上，显然是一种内存浪费，那么何不将它扩展到原型`prototype`上呢?于是就有了Backbone的Model和View等核心类。例如`Backbone.Model`：

{% highlight js %}
var Events = Backbone.Events = { .. }

var Model = Backbone.Model = function(attributes, options) {
	...
	};

_.extend(Model.prototype, Events, { ... })
{% endhighlight %}

从上面的代码可以看出，Backbone核心的类只不过是将`Backbone.Events`扩展到自身的`prototype`上罢了，这样所有基于Backbone核心类创建出来的对象就有了事件能力。

下面是一个体现观察者模式的经典例子：

{% highlight js %}
var Todo = Backbone.Model.extend({
	model.trigger('destroy');
});

var TodoView = Backbone.View.extend({

    events: {
      "click a.destroy" : "clear",
    },

    initialize: function() {
      this.listenTo(this.model, 'destroy', this.remove);
    },

    clear: function() {
      this.model.destroy();
    },

	remove: function() {
      this.$el.remove();
    }

});
{% endhighlight %}


上面的例子忽略了很多细枝末节，只是想说明一个界面元素的删除动作，首先是删除模型，模型随后触发删除事件，由于这个删除事件，界面元素才被删除


## 探究Backbone事件的实现原理 ##
被侦听的对象维护一个事件数组`_event`，其他对象在调用`listenTo`时，会将事件名与回调维护到队列中：

![](http://pchou.qiniudn.com/backbone-event-01.png)

一个事件名可以对应多个回调，对于被侦听者而言，只知道回调的存在，并不知道具体是哪个对象在侦听它。

当被侦听者调用`trigger(name)`时，会遍历`_event`，选择同名的事件，并将其下面所有的回调都执行一遍。


## 总结 ##
Backbone虽然是MVC模式的框架，但是其核心却是UI界面的观察者模式和事件机制。有了事件，并灵活运用观察者模式，才能实现复杂界面的复杂逻辑。本文对此进行了阐述，如有不妥之处，请指正。