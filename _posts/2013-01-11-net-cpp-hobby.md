---
layout: postlayout
title: .NET程序员的C\C++情结(3)
thumbimg: 157222808237574677.jpg
categories: [C-Cpp]
tags: [CPP, dot NET]
---

虽然现在主要从事.NET平台的开发，但是一直以来对C\C++有着那份难以割舍的情结。本文会涉及到托管C++的一些随笔记录。当然，如果写纯.NET应用的话，C#无疑是最合适的语言的。但是托管C++在同时处理Native调用和托管调用上无疑是十分吸引人的，往往用来作为托管世界和Native世界的桥梁。当然。你可以说用.NET的“平台调用”特性同样能够胜任，萝卜青菜各有所爱吧。

 
## 托管C++基础语言特性 ##

在托管C++中需要像下面这样定义一个托管类型

{% highlight cpp %}
public ref class ARSession
{
public:
 property UInt32 FieldId;
}
{% endhighlight %}

默认情况下这样的类是默认实现`IDisposable`的，原因很简单，既然用到C++来封装托管类型，那么八成类型需要涉及到非托管对象，实现`IDisposable`减少了出错的可能。可以同时实现两种“析构函数”：

{% highlight cpp %}
!ARSession(void)
~ARSession(void)
{% endhighlight %}

前者是好比`Dispose()`，后者是C++原生的析构函数。

可以同时引用托管的命名空间和C++命名空间

{% highlight c# %}
using namespace System;
using namespace System::Collections::Generic;
using namespace std;
{% endhighlight %}

也可以向普通C++一样`#include`头文件，编译的过程可以理解成跟本地C++的编译过程一样，只是在编译的时候会有`/clr`开关，并至少引用相应的托管dll：`mscorlib.dll`

对于托管类型，在类型的标识右使用`^`标注，比如：

{% highlight c# %}
String^
array<String^>^
List<AREntry^>^
{% endhighlight %}

但注意，对于`Nullable`的值类型，使用

{% highlight c# %}
Nullable<UInt32>
{% endhighlight %}

而不是

{% highlight c# %}
Nullable<UInt32>^
{% endhighlight %}

前者在C#中会看到是`uint?`，而后者在C#中会看到是`ValueType`

托管C++支持类似C#中的`ref`

{% highlight c# %}
Int32% totalMatch
{% endhighlight %}

`out`的话需要加一个`Attribute`

{% highlight c# %}
using namespace System::Runtime::InteropServices;    
void foo([Out] Bar^% x);
{% endhighlight %}


在本地堆中申请内存是使用new关键字，而在托管堆中申请内存，使用`gcnew`关键字：

{% highlight c# %}
ARException^ exception = gcnew ARException();
{% endhighlight %}


## 托管C++的内存管理 ##

上面简单介绍的一些语言特性是我实际碰到的，可能不全。与语言特性相比，更为重要的是内存管理带来的复杂性。原生的C++只有一个由C运行库管理的“本地堆”，而C++/CLI允许同时操作本地堆和托管堆。众所周知，托管堆由CLR管理，在托管堆中的内存会随时被CLR回收和压缩，这意味着，如果使用C#的引用或者C++/CLI中的`Handle`（即由String^等“戴帽子的类型“声明的变量）来操作托管堆的内存，不会有任何问题，因为CLR会自动更改引用或Handle指向的地址。然而，如果在本地堆或者栈上的本地指针来指向托管堆上的内存的话，CLR不会对压缩内存带来的地址修改负任何责任。如果发生这种情况的话，再次使用该指针将导致内存违规。下面这张图可以解释这个现象（图片来源<http://www.codeproject.com/Articles/17817/C-CLI-in-Action-Using-interior-and-pinning-pointer>)：

![net-cpp-hobby-img0]({{ site.BASE_PATH }}/assets/img/net-cpp-hobby-img0.png)

在上图中，本地指针指向的地址本来是`Data`，但是当CLR的GC工作后，`Data`可能被压缩至托管堆的其他地方，而取而代之的是另外一块内存。很典型的情况就是，我们要在托管的`byte[]`和非托管的`usigned char*`对象之间传递内存，下面这段代码将`String`对象转化成以`UTF8`编码的字节数组：

{% highlight cpp %}
char* MarshalStringCopyToChar(String^ Source)
{
   if(String::IsNullOrEmpty(Source))
       return NULL;
   array<Byte>^ vText = System::Text::Encoding::UTF8->GetBytes(Source);
   pin_ptr<unsigned char> pText = &vText[0];
   char* Des = (char*)calloc(vText->Length+1,sizeof(char));
   memcpy(Des, pText, vText->Length);
   Des[vText->Length] = '\0';
   return Des;
}
{% endhighlight %}

上述代码实际上是将托管堆中的一部分内存数据copy到非托管堆，使其奏效的关键就是`pin_ptr<unsigned char>`这个指针了。

在托管C++中也可以使用如下方法代替上面的实现：

{% highlight cpp %}
std::string tmp = marshal_as<std::string>(Source);
{% endhighlight %}

但是，似乎在转换过程中是以ANSI编码来转换的，具体没有详细研究。不过`marshal_as`是可以扩展的，详见：<http://msdn.microsoft.com/zh-cn/library/bb384865.aspx>


## C++运行库的问题 ##

在开发过程中碰到一个很怪异的`_CrtIsValidHeapPointer`错误，关于这个问题，需要了解Microsoft C运行库以及其管理堆内存的一些原则：

首先，到目前为止，Microsoft C运行库实际上已经有很多版本了，在应用程序执行期间，很可能在内存中存在多个版本的C运行库，而且`每个C运行库版本维护自己的堆`，这样，如果在不同的运行库之间引用堆内存，那么在Debug模式下会有一个`CrtIsValidHeapPointer`宏来防止这个操作（Release模式没有验证过是不是就没有这个限制了）。那么典型的场景就是，当我们在引用某个第三方动态链接库时，如果这个第三方的动态链接库所引用的C运行库跟我们的主程序不一致，那么将会在内存中同时存在两个版本的运行库，所以，如果主程序申请的堆内存，由其他dll来释放，那么就会报错。所以，所谓的“谁申请谁释放”的原则在这里实际上也是适用的。上面这个错误就是在Debug模式下，帮助开发人员发现这种跨运行库的heap的指针引用的问题，尚不知道这种引用是否完全不合法，还是仅仅只有风险。

另外，如果以静态链接的方式链接到C运行库的话，即使是同一个版本的运行库，在内存中也存在两份copy，并有两块由不同运行库维护的堆内存。

从上述这点看来，如果要自己开发一个dll的话，记得要提供堆内存释放的函数，以避免出现不同运行库的冲突。

 

## C++模板 ##

老实说C++的模板真心比C#的泛型在语言层面要复杂的多，使用模板并不难，但是要自己设计模板类，就出问题了。这里简单总结一些模板的基础。

### 模板类的声明如下： ###

{% highlight cpp %}
template <typename T>
public class IntelligentARStructAR
{
private:
  T _Struct;
public:
  ~IntelligentARStructAR();
}
{% endhighlight %}

### 模板类的实现（定义）：###

{% highlight cpp %}
template<typename T> IntelligentARStructAR<T>::~IntelligentARStructAR(){…}
{% endhighlight %}

### 模板类的具化：###

编译器在编译过程中，需要等模板在源代码中使用的时候，才会生成一个对应的类型，这个过程叫模板类的具化。`编译器要生成一个模板的定义，必须同时能看到模板的声明、模板的定义以及模板的具化要素，如果编译器在编译阶段不能具化，那么只能寄希望于链接器。`

来看个典型的错误：

- template.h：里面有模板的声明
- template.cpp：include template.h，里面有模板的实现（定义）
- main.cpp：include template.h，里面有使用模板（即模板具化的要素）
编译器在编译template.cpp时，同时看到了模板声明和模板定义，但是因为没有模板的具化要素，编译器无法生成模板类型（因为，在没有要素的情况下，不可能知道T这个类型的结构大小，也就无法生成二进制代码）；在编译main.cpp，能够看到的是模板的声明和模板的具化要素，但没有模板的定义，于是无法编译通过。

这个典型的使用就是：C++编译器不能支持对模板的分离式编译的原因。

解决这个问题的方法有如下几种：

1. 在具化要素时，让编译器看到模板定义。典型的方式是将模板的声明和定义同时写在头文件中。
2. 用另外的编译单元中显示的具化。在另一个cpp文件中显示的使用模板，这样链接器能够在链接阶段找到模板类型。
3. export关键字。据说还没有编译器实现。