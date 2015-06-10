---
layout: postlayout
title: Objective-c 内存管理的历史和参考资料
categories: [IOS]
tags: [objective-c,ios]
---

对于像我这样自学IOS开发的初学者，网上有很多资料，很多教程，但是过于多的资料也使初学者无法筛选合适自己的。并且Objective-c也经历了几个阶段的演变，初学者有时更加会觉得迷茫了。本文总结一下Objective-c在内存管理上的一些问题，整理一些合适的资料。

## 早期：引用计数的内存管理

Objective-c继承自C，拥有一套基于`对象引用计数`的内存管理体系。这跟C#或者Java的垃圾回收机制不同，倒是与C++后来的智能指针有些类似。这种`引用计数`的思想在很多地方也有应用，不过本质上说，仍然是需要程序员来手动管理计数的，只不过当计数值清零时，对象会被自动释放罢了。

类似的代码如下，请注意注释：

{% highlight objectivec %}
//申请内存，并调用初始化，返回指针
//alloc会使得对象的引用计数初始化为1
Engine *engine1 = [[Engine alloc] init]; 

//调用retain，等同于使引用计数+1
[engine1 retain];

//调用release，等同于使引用计数-1
//只有当引用计数为0时，对象才会释放
[engine1 release];

{% endhighlight %}

即程序员需要来回的使用`alloc`、`retain`、`release`控制对象的引用计数

## 属性与编译器约定

在遇到复杂面向对象编程的时候更为棘手，假设有一个类，其中包含有多个属性，这些属性都是指针类型，指向堆上的内存：

{% highlight objectivec %}
@interface Person
{
    NSString *Name;
    NSString *Address;
}
{% endhighlight %}

于是乎，当无论在什么时候，Person类的实例都将拥有对`Name`和`Address`两块内存的所有权。如果申请这两块内存的代码不是Person类自己的代码。那么Person需要使用`retain`增加引用计数，并在析构中负责`release`。那么很容易想到使用`set`和`get`这对方法，对类的字段进行封装，以Name为例：

{% highlight objectivec %}
-(void) setName:(NSString *)name{
    if(self.Name != name){
        [Name release];
        Name = [name retain];
    }
}

-(NSString *) getName {
    return Name;
}

-(void)dealloc{
    [self setName:nil];
    [super dealloc];
}
{% endhighlight %}


在上面的`set`和`get`方法中，封装了对内存的管理部分。为了简化这种需求，编译器直接通过编译支持这种写法，即我们可以通过下面的代码代替上面的`set`和`get`函数，编译器会自动按照上面的代码展开：

{% highlight objectivec %}
@interface Person
@property (retain) NSString* Name;
@end


@implementation Person
@synthesize Name;
@end
{% endhighlight %}

于是在使用属性的时候可以这么做：
{% highlight objectivec %}
Person *person = [[Person alloc] init];
person.Name = @"Jack";
{% endhighlight %}
实际上编译器对上述调用代码同样会展开成`setName`函数。这就是“点语法”，看起来是不是跟大部分的语言的属性访问有些接近了。

## 自动释放池

后来开始出现自动释放池(Auto release pool)，这个东西的出现简单的说是基于一种十分常见确很难处理的场景：`需要在一个方法内部申请内存，并将内存的地址返回给调用者，这个时候谁来释放这个内存？`如下面的代码：

{% highlight objectivec %}
-(ClassA *) Func1
{
    //内部申请空间，obj引用计数为1
    ClassA *obj = [[ClassA alloc] init];
    //返回这个申请的内存
    return obj;
    //谁来负责释放???
}
{% endhighlight %}

这个梗其实在任何非垃圾回收的语言中都存在，需要人为约定，要么创建者释放，要么调用者释放。试想，如果是创建者释放，那么创建者怎么知道调用者什么时候结束调用呢？如果是调用者释放，又会因为协同开发的原因，造成调用者忘记释放的情况。

OC发明了自动释放池的概念，上面的代码可以这样写：
{% highlight objectivec %}
-(ClassA *) Func1
{
    //内部申请空间，obj引用计数为1，使用autorelease延迟释放
    ClassA *obj = [[[ClassA alloc] init] autorelease];
    //返回这个申请的内存
    return obj;
}
{% endhighlight %}

使用`autorelease`方法，实际上的结果是本地变量obj的引用在自动释放池中保留一份，并在恰当的时候，释放掉。具体原理参加下面给出的资料链接。

事实上从程序结构上看，OC选择了谁申请谁释放的原则。至此，著名的黄金法则出现了，遵循黄金法则的代码不会出现内存泄露

> The basic rule to apple is everything that increases the reference counter with alloc,[mutable]copy[WithZone:] or retain is in charge of the corresponding [auto]release.
如果一个对象使用了alloc，[mutable] copy，retain，那么必须使用相应的release或autorelease

详细的早期内存管理的资料参考：

[iOS:内存管理（一）：OC中的内存管理](http://www.cnblogs.com/mybkn/articles/3123967.html)

[iOS:内存管理（二）：怎样在xcode里面使用Memory Leaks和Instruments教程](http://www.cnblogs.com/mybkn/articles/3123981.html)

[iOS:内存管理（三）：在Objective-c里面使用property教程](http://www.cnblogs.com/mybkn/articles/3124000.html)

[Objective-C的内存管理（一）黄金法则的理解](http://blog.csdn.net/lonelyroamer/article/details/7666851)

[ Objective-C的内存管理（二）autorelease的理解](http://blog.csdn.net/lonelyroamer/article/details/7673940)

上面是早期的内存管理原理的机制，个人觉得还是需要深刻理解的，虽然现在基本都不这么写了，下面会说到

## 目前：自动引用计数
自动引用计数(Auto reference counting)后来被引入，实际上是编译器功能的大幅增强。现在开发IOS，默认都是开启ARC功能的。并在在ARC下，甚至是不允许写`release`、`retain`、`autorelease`这样的方法的。如果初学者从网上的资料中学习了，上面早期的一些知识，需要注意，实际做的时候基本都是使用ARC的（不少较新的OC程序员甚至已经不会手动管理内存了）。个人实际操作下来，感觉使用ARC，基本跟写C#没有什么太大的差别。这真心是有赖于编译器的强大。

在ARC下，并没有少了引用计数这个环节，从ARC的字面来看，实际上是编译器帮程序员完成了对引用计数的增减。而且ARC也有相应的编码约定或规范，在学习之前，还是需要学习早期的内存管理体系的。

参考资料如下：

[转向ARC的说明——翻译Apple官方文档](http://blog.csdn.net/hherima/article/details/16356577)
[Objective-C Autorelease Pool 的实现原理](http://blog.leichunfeng.com/blog/2015/05/31/objective-c-autorelease-pool-implementation-principle/)

本文总结了关于Objective-c中的内存管理方面的基础内容，希望对初学者有个启发
