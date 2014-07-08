---
layout: postlayout
title: Backbone使用总结
description: 开始在项目中大规模使用backbone，一路磕磕碰碰，边做边学习边体会，有一些心得和体会，记录在本文中
thumbimg: JavaScript-logo.png
categories: [javascript]
tags: [javascript,backbone]
---


## 事件模型及其原理 ##

`Backbone.Events`就是事件实现的核心，它可以让对象拥有事件能力

{% highlight js %}
var Events = Backbone.Events = { .. }
{% endhighlight %}


对象通过`listenTo`侦听其他对象，通过`trigger`触发事件。可以脱离Backbone的MVC，在自定义的对象上使用事件

{% highlight js %}
var model = _.extend({},Backbone.Events);
var view = _.extend({},Backbone.Events);
view.listenTo(model,'custom_event',function(){ alert('catch the event') });
model.trigger('custom_event');
{% endhighlight %}

执行结果：

![](http://pchou.qiniudn.com/backbone-event-01.jpg)

Backbone的Model和View等核心类，都是继承自`Backbone.Events`的。例如Backbone.Model：

{% highlight js %}
var Events = Backbone.Events = { .. }

var Model = Backbone.Model = function(attributes, options) {
	...
	};

_.extend(Model.prototype, Events, { ... })
{% endhighlight %}

从原理上讲，事件是这么工作的：

被侦听的对象维护一个事件数组`_event`，其他对象在调用`listenTo`时，会将事件名与回调维护到队列中：

![](http://pchou.qiniudn.com/backbone-event-01.png)

一个事件名可以对应多个回调，对于被侦听者而言，只知道回调的存在，并不知道具体是哪个对象在侦听它。当被侦听者调用`trigger(name)`时，会遍历_event，选择同名的事件，并将其下面所有的回调都执行一遍。

需要额外注意的是，Backbone的`listenTo`实现，除了使被侦听者维护对侦听者的引用外，还使侦听者也维护了被侦听者。这是为了在恰当的时候，侦听者可以单方面中断侦听。因此，虽然是循环引用，但是使用Backbone的合适的方法可以很好的维护，不会有问题，在后面的内存泄露部分将看到。

另外，有时只希望事件在绑定后，当回调发生后，就接触绑定。这在一些对公共模块的引用时很有用。`listenToOnce`可以做到这一点

## 与服务器同步数据 ##

`backbone`默认实现了一套与RESTful风格的服务端同步模型的机制，这套机制不仅可以减轻开发人员的工作量，而且可以使模型变得更为健壮（在各种异常下仍能保持数据一致性）。不过，要真正发挥这个功效，一个与之匹配的服务端实现是很重要的。为了说明问题，假设服务端有如下REST风格的接口：

- GET `/resources` 获取资源列表
- POST `/resources` 创建一个资源，返回资源的全部或部分字段
- GET `/resources/{id}` 获取某个id的资源详情，返回资源的全部或部分字段
- DELETE `/resources/{id}` 删除某个资源
- PUT `/resources/{id}` 更新某个资源的`全部`字段，返回资源的全部或部分字段
- PATCH `/resources/{id}` 更新某个资源的`部分`字段，返回资源的全部或部分字段

`backbone`会使用到上面这些HTTP方法的地方主要有以下几个：

- `Model.save()` 逻辑上，根据当前这个model的是否具有`id`来判断应该使用POST还是PUT，如果model没有id，表示是新的模型，将使用`POST`，将模型的字段全部提交到`/resources`；如果model具有id，表示是已经存在的模型，将使用`PUT`，将模型的全部字段提交到`/resources/{id}`。当传入`options`包含`patch:true`的时候，save会产生`PATCH`。
- `Model.destroy()` 会产生`DELETE`，目标url为`/resources/{id}`，如果当前model不包含id时，不会与服务端同步，因为此时backbone认为model在服务端尚不存在，不需要删除
- `Model.fetch()` 会产生`GET`，目标url为`/resources/{id}`，并将获得的属性更新model。
- `Collection.fetch()` 会产生`GET`，目标url为`/resources`，并对返回的数组中的每个对象，自动实例化model
- `Collection.create()` 实际将调用`Model.save`

`options`参数存在于上面任何一个方法的参数列表中，通过`options`可以修改backbone和ajax请求的一些行为，可以使用的options包括：

- `wait`: 可以指定是否等待服务端的返回结果再更新model。默认情况下不等待
- `url`: 可以覆盖掉backbone默认使用的url格式
- `attrs`: 可以指定保存到服务端的字段有哪些，配合`options.patch`可以产生`PATCH`对模型进行部分更新
- `patch`: 指定使用部分更新的REST接口
- `data`: 会被直接传递给jquery的ajax中的data，能够覆盖backbone所有的对上传的数据控制的行为
- `其他`: options中的任何参数都将直接传递给jquery的ajax，作为其options

backbone通过Model的`urlRoot`属性或者是`Collection`的`url`属性得知具体的服务端接口地址，以便发起ajax。在Model的`url`默认实现中，Model除了会考察`urlRoot`，第二选择会是Model所在Collection的`url`，所有有时只需要在Collection里面书写`url`就可以了。

Backbone会根据与服务端要进行什么类型的操作，决定是否要添加`id`在`url`后面，以下代码是Model的默认`url`实现：

{% highlight js %}
url: function () {
    var base =
      _.result(this, 'urlRoot') ||
      _.result(this.collection, 'url') ||
      urlError();
    if (this.isNew()) return base;
    return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
}
{% endhighlight %}

其中的正则式`/([^\/])$/`是个很巧妙的处理，它解决了`url`最后是否包含`'/'`的不确定性。

> 这个正则匹配的是行末的非`/`字符，这样，像`/resources`这样的目标会匹配`s`，然后`replace`中使用分组编号`$1`捕获了`s`，将`s`替换为`s/`，这样就自动加上了缺失的`/`；而当`/resources/`这样目标却无法匹配到结果，也就不需要替换了。

## Model和Collection的关系 ##

在backbone中，即便一类的模型实例的确是在一个集合里面，也并没有强制要求使用集合类。但是使用集合有一些额外的好处，这些好处包括：

###url继承###

`Model`属于`Collection`后，可以继承Collection的`url`属性。上面一节已经提到了

###underscore集合能力###

`Collection`沿用了`underscore`90%的集合和数组操作，使得集合操作极其方便：

{% highlight js %}
// Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Backbone Collections is actually implemented
// right here:
var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
'lastIndexOf', 'isEmpty', 'chain', 'sample'];
{% endhighlight %}

Backbone巧妙的使用下面的代码将这些方法附加到`Collection`中：

{% highlight js %}
// Mix in each Underscore method as a proxy to `Collection#models`.
_.each(methods, function (method) {
	Collection.prototype[method] = function () {
		var args = slice.call(arguments); 	//将参数数组转化成真正的数组
		args.unshift(this.models);			//将Collection真正用来维护集合的数组，作为第一个个参数
		return _[method].apply(_, args);	//使用apply调用underscore的方法
	};
});
{% endhighlight %}


###自动侦听和转发集合中的Model事件###

集合能够自动侦听并转发集合中的元素的事件，还有一些事件集合会做相应的特殊处理，这些事件包括：

- `destroy` 侦听到元素的`destroy`事件后，会自动将元素从集合中移除，并引发`remove`事件
- `change:id` 侦听到元素的id属性被change后，自动更新内部对model的引用关系

###自动模型构造###

利用`Collection`的`fetch`，可以加载服务端数据集合，与此同时，可以自动创建相关的Model实例，并调用构造方法

###元素重复判断###

`Collection`会根据`Model`的`idAttribute`指定的唯一键，来判断元素是否重复，默认情况下唯一键是`id`，可以重写`idAttribute`来覆盖。当元素重复的时候，可以选择是丢弃重复元素，还是合并两种元素，默认是丢弃的

## 模型转化 ##

有时从REST接口得到的数据并不能完全满足界面的处理需求，可以通过`Model.parse`或者`Collection.parse`方法，在实例化Backbone对象前，对数据进行预处理。大体上，`Model.parse`用来对返回的单个对象进行属性的处理，而`Collection.parse`用来对返回的集合进行处理，通常是过滤掉不必要的数据。例如：

{% highlight js %}
//只挑选type=1的book
var Books = Backbone.Collection.extend({
	parse:function(models,options){
		return _.filter(models , function(model){
			return model.type == 1;
		})
	}
})


//为Book对象添加url属性，以便渲染
var Book = Backbone.Model.extend({
	parse: function(model,options){
		return _.extend(model,{ url : '/books/' + model.id });
	}
})
{% endhighlight %}

通过Collection的`fetch`，自动实例化的Model，其parse也会被调用。


## 模型的默认值 ##

Model可以通过设置`defaults`属性来设置默认值，这很有用。因为，无论是模型还是集合，fetch数据都是异步的，而往往视图的渲染确实很可能在数据到来前就进行了，如果没有默认值的话，一些使用了模板引擎的视图，在渲染的时候可能会出错。例如underscore自带的视图引擎，由于使用`with(){}`语法，会因为对象缺乏属性而报错。



## 视图的el ##

Backbone的视图对象十分简答，对于开发者而言，仅仅关心一个el属性即可。el属性可以通过五种途径给出，优先级从高到低：

1. 实例化View的时候，传递el
2. 在类中声明el
3. 实例化View的时候传入`tagName`
4. 在类中声明`tagName`
5. 以上都没有的情况下使用默认的`'div'`

究竟如何选择，取决于以下几点：

- 一般而言，如果模块是公用模块，在类中不提供el，而是让外部在实例化的时候传入，这样可以保持公共的View的独立性，不至于依赖已经存在的DOM元素
- `tagName`一般对于自成体系的View有用，比如table中的某行tr，ul中的某个li
- 有些DOM事件必须在html存在的情况下才能绑定成功，比如`blur`，对于这种View，只能选择已经存在的html

视图类还有几个属性可以导出，由外部初始化，它们是：

{% highlight js %}
// List of view options to be merged as properties.
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
{% endhighlight %}

## 内存泄漏 ##

事件机制可以很好的带来代码维护的便利，但是由于事件绑定会使对象之间的引用变得复杂和错乱，容易造成内存泄漏。下面的写法就会造成内存泄漏：

{% highlight js %}
var Task = Backbone.Model.extend({})

var TaskView = Backbone.View.extend({
	tagName: 'tr',
	template: _.template('<td><%= id %></td><td><%= summary %></td><td><%= description %></td>'),
	initialize: function(){
		this.listenTo(this.model,'change',this.render);
	},
	render: function(){
		this.$el.html( this.template( this.model.toJSON() ) );
		return this;
	}
})

var TaskCollection = Backbone.Collection.extend({
	url: 'http://api.test.clippererm.com/api/testtasks',
	model: Task,
	comparator: 'summary'
})

var TaskCollectionView = Backbone.View.extend({
	initialize: function(){
		this.listenTo(this.collection, 'add',this.addOne);
		this.listenTo(this.collection, 'reset',this.render);
	},
	addOne: function(task){
		var view = new TaskView({ model : task });
		this.$el.append(view.render().$el);
	},
	render: function(){
		var _this = this;

		//简单粗暴的将DOM清空
		//在sort事件触发的render调用时，之前实例化的TaskView对象会泄漏
		this.$el.empty();

		this.collection.each(function(model){
			_this.addOne(model);
		})

		return this;
	}

})
{% endhighlight %}

使用下面的测试代码，并结合Chrome的堆内存快照来证明：

{% highlight js %}
var tasks = null;
var tasklist = null;

$(function () {
	// body...
	$('#start').click(function(){
		tasks = new TaskCollection();
		tasklist = new TaskCollectionView({
			collection : tasks,
			el: '#tasklist'
		})

		tasklist.render();
		tasks.fetch();
	})

	$('#refresh').click(function(){
		tasks.fetch({ reset : true });
	})

	$('#sort').click(function(){
		//将侦听sort放在这里，避免第一次加载数据后的自动排序，触发的sort事件，以至于混淆
		tasklist.listenToOnce(tasks,'sort',tasklist.render);
		tasks.sort();
	})
})
{% endhighlight %}

点击开始，使用Chrome的'Profile'下的'Take Heap Snapshot'功能，查看当前堆内存情况，使用`child`类型过滤，可以看到Backbone对象实例一共有10个(1+1+4+4)：

![](http://pchou.qiniudn.com/2014-06-26-backbone-summary-00.JPG)

> 之所以用child过滤，因为我们的类继承自Backbone的类型，而继承使用了重写原型的方法，Backbone在继承时，使用的变量名为`child`，最后，`child`被返回出来了

点击排序后，再次抓取快照，可以看到实例个数变成了14个，这是因为，在`render`过程中，又创建了4个新的`TaskView`，而之前的4个`TaskView`并没有释放(之所以是4个是因为记录的条数是4)

![](http://pchou.qiniudn.com/2014-06-26-backbone-summary-01.JPG)

再次点击排序，再次抓取快照，实例数又增加了4个，变成了18个!

![](http://pchou.qiniudn.com/2014-06-26-backbone-summary-02.JPG)

那么，为什么每次排序后，之前的`TaskView`无法释放呢。因为TaskView的实例都会侦听model，导致model对新创建的TaskView的实例存在引用，所以旧的TaskView无法删除，又创建了新的，导致内存不断上涨。而且由于引用存在于`change`事件的回调队列里，model每次触发`change`都会通知旧的TaskView实例，导致执行很多无用的代码。那么如何改进呢？

修改TaskCollectionView：

{% highlight js %}
var TaskCollectionView = Backbone.View.extend({
	initialize: function(){
		this.listenTo(this.collection, 'add',this.addOne);
		this.listenTo(this.collection, 'reset',this.render);
		//初始化一个view数组以跟踪创建的view
		this.views =[]
	},
	addOne: function(task){
		var view = new TaskView({ model : task });
		this.$el.append(view.render().$el);
		//将新创建的view保存起来
		this.views.push(view);
	},
	render: function(){
		var _this = this;

		//遍历views数组，并对每个view调用Backbone的remove
		_.each(this.views,function(view){
			view.remove().off();
		})

		//清空views数组，此时旧的view就变成没有任何被引用的不可达对象了
		//垃圾回收器会回收它们
		this.views =[];
		this.$el.empty();

		this.collection.each(function(model){
			_this.addOne(model);
		})

		return this;
	}

})
{% endhighlight %}

Backbone的View有一个`remove`方法，这个方法除了删除View所关联的DOM对象，还会阻断事件侦听，它通过在listenTo方法时记录下来的那些被侦听对象(上文事件原理中提到)，来使这些被侦听的对象删除对自己的引用。在`remove`内部使用事件基类的`stopListening`完成这个动作。
上面的代码使用一个views数组来跟踪新创建的`TaskView`对象，并在render的时候，依次调用这些视图对象的`remove`，然后清空数组，这样这些`TaskView`对象就能得到释放。并且，除了调用`remove`，还调用了`off`，把视图对象可能的被外部的侦听也断开。