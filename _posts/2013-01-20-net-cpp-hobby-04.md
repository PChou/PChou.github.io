---
layout: postlayout
title: .NET程序员的C\C++情结(4)
description: 这个系列是本人在工作或工作之余开发和学习C\C++的一些笔记。本文涉及到C\C++预编译指令#pragma，以及内存对齐相关的知识
thumbimg: 157222808237574677.jpg
categories: [C-Cpp]
tags: [CPP]
---

以下内容大部分来自于网络转载，参考来源：

<http://www.52rd.com/blog/Detail_RD.Blog_sunhuibo_5025.html>
<http://baike.baidu.com/view/3487831.htm>
<http://www.ibm.com/developerworks/library/pa-dalign/>
<http://www.cnblogs.com/kevinLee-xjtu/archive/2011/12/12/2299090.html>
<http://blog.csdn.net/lgouc/article/details/8235616>

## 预处理指令#pragma

在所有的预处理指令中，`#pragma`指令可能是最复杂的了，它的作用是设定编译器的状态或者是指示编译器完成一些特定的动作。#pragma指令对每个编译器给出了一个方法,在保持与C和C++语言完全兼容的情况下,给出主机或操作系统专有的特征。
依据定义,编译指示是机器或操作系统专有的,且对于每个编译器都是不同的。其格式一般为: `#pragma  para`。其中`para`为参数，下面来看一些常用的参数。 

### message 参数

`message`参数能够在编译信息输出窗口中输出相应的信息，这对于源代码信息的控制是非常重要的。其使用方法为：

{% highlight c %}
#pragma message("消息文本")
{% endhighlight %}

当编译器遇到这条指令时就在编译输出窗口中将消息文本打印出来。当我们在程序中定义了许多宏来控制源代码版本的时候，我们自己有可能都会忘记有没有正确的设置这些宏，此时我们可以用这条指令在编译的时候就进行检查。假设我们希望判断自己有没有在源代码的什么地方定义了_X86这个宏，可以用下面的方法:

{% highlight c %}
#ifdef _X86
#pragma message("_X86  macro  activated!")
#endif
{% endhighlight %}

我们定义了_X86这个宏以后，应用程序在编译时就会在编译输出窗口里显示"_86  macro  activated!"。我们就不会因为不记得自己定义的一些特定的宏而抓耳挠腮了。

### code_seg参数

格式如：

{% highlight c %}
#pragma  code_seg( ["section-name" [, "section-class"] ] )
{% endhighlight %}

它能够设置程序中函数代码存放的代码段，当我们开发驱动程序的时候就会使用到它。 

### #pragma once  (比较常用) 

只要在头文件的最开始加入这条指令就能够保证头文件被编译一次，这条指令实际上在VC6中就已经有了，但是考虑到兼容性并没有太多的使用它。 

### #pragma  hdrstop

表示预编译头文件到此为止，后面的头文件不进行预编译。BCB可以预编译头文件以加快链接的速度，但如果所有头文件都进行预编译又可能占太多磁盘空间，所以使用这个选项排除一些头文件。有时单元之间有依赖关系，比如单元A依赖单元B，所以单元B要先于单元A编译。你可以用#pragma  startup指定编译优先级，如果使用了`#pragma  package(smart_init)`，BCB就会根据优先级的大小先后编译。


### #pragma  resource  "*.dfm"

表示把*.dfm文件中的资源加入工程。*.dfm中包括窗体外观的定义。   

### #pragma  warning

{% highlight c %}
#pragma  warning( disable: 4507 34; once: 4385; error: 164 )
{% endhighlight %}

等价于：

{% highlight c %}
#pragma  warning( disable: 4507 34 )    //  不显示4507和34号警告信息
#pragma  warning( once: 4385 )          //  4385号警告信息仅报告一次 
#pragma  warning( error: 164 )          //  把164号警告信息作为一个错误。
{% endhighlight %}

同时这个pragma  warning  也支持如下格式：

{% highlight c %}
#pragma  warning( push [, n ] ) //这里n代表一个警告等级(1---4)。 
#pragma  warning( pop ) //#pragma  warning( push )保存所有警告信息的现有的警告状态。 
#pragma  warning( push, n ) //保存所有警告信息的现有的警告状态，并且把全局警告等级设定为n。   
#pragma  warning( pop ) //向栈中弹出最后一个警告信息，在入栈和出栈之间所作的一切改动取消。
{% endhighlight %}


例如：

{% highlight c %}
#pragma  warning( push )
#pragma  warning( disable: 4705 )
#pragma  warning( disable: 4706 )
#pragma  warning( disable: 4707 )
#pragma  warning(  pop  )
{% endhighlight %}


在这段代码的最后，重新保存所有的警告信息(包括4705，4706和4707)。 

### #pragma  comment

该指令将一个注释记录放入一个对象文件或可执行文件中。 应该是`compiler`，`lib`，`linker`之一。

- compiler：放置编译器的版本或者名字到一个对象文件，该选项是被linker忽略的。
- lib：放置一个库搜索记录到对象文件中，这个类型应该是和commentstring（指定你要Linker搜索的lib的名称和路径）
- linker：指定一个连接选项，这样就不用在命令行输入或者在开发环境中设置了。只有下面的linker选项能被传给Linker ：/DEFAULTLIB ,/EXPORT,/INCLUDE,/MANIFESTDEPENDENCY, /MERGE,/SECTION

常用的lib关键字，可以帮我们连入一个库文件。如：

{% highlight c %}
#pragma  comment(lib, "comctl32.lib")
#pragma  comment(lib, "vfw32.lib")
#pragma  comment(lib, "wsock32.lib")
{% endhighlight %}

Windows在一个Win32程序的地址空间周围筑了一道墙。通常，一个程序的地址空间中的数据是私有的，对别的程序而言是不可见的。进程间通信有很多办法，与#pragma相关的我们要谈到共享内存。下面的写法在一个dll程序的.c文件开头处，将两个变量储存在共享的一个特殊内存区段中：

{% highlight c %}
#pragma data_seg ("shared")
   int iTotal = 0;
   WCHAR szStrings [MAX_STRINGS][MAX_LENGTH + 1] = {'\0'};
#pragma data_seg ()
{% endhighlight %}
     
#pragma comment(linker,"/SECTION:shared,RWS") //字母RWS表示段具有读、写和共享属性。
第一个#pragma叙述建立数据段，这里命名为`shared`。您可以将这段命名为任何一个您喜欢的名字。在这里的#pragma叙述之后的所有初始化了的变量都放在`shared`数据段中。第二个#pragma叙述标示段的结束。对变量进行专门的初始化是很重要的，否则编译器将把它们放在普通的未初始化数据段(BBS)中而不是放在shared中。然后，连结器必须知道有一个名叫`shared`的共享数据段。可以直接用`#pragma comment`指定`linker`选项。


### 编译器特殊功能开关

每个编译程序可以用#pragma指令激活或终止该编译程序支持的一些编译功能。例如，对循环优化功能：

{% highlight c %}
#pragma  loop_opt(on)     //  激活
#pragma  loop_opt(off)    //  终止
{% endhighlight %}

`每个编译器对#pragma的实现不同，在一个编译器中有效在别的编译器中几乎无效。可从编译器的文档中查看。`

 

### #pragma pack(n)内存对齐问题

内存对齐是个比较深奥的问题，先看一些引子

- 因为处理器读写数据，并不是以字节为单位，而是以块(2,4,8,16字节)为单位进行的。如果不进行对齐，那么本来只需要一次进行的访问，可能需要好几次才能完成，并且还要进行额外的merger或者数据分离。导致效率低下。更严重地，会因为cpu不允许访问unaligned address，就会报错，或者打开调试器或者dump core，比如sun sparc solaris绝对不会容忍你访问unaligned address，都会以一个core结束你的程序的执行。所以一般编译器都会在编译时做相应的优化以保证程序运行时所有数据都是存储在'aligned address'上的，这就是内存对齐的由来。在'Data alignment: Straighten up and fly right'这篇文章中作者还得出一个结论那就是："如果访问的地址是unaligned的，那么采用大粒度访问内存有可能比小粒度访问内存还要慢"。
- ANSI C保证结构体中各字段在内存中出现的位置是随它们的声明顺序依次递增的，并且第一个字段的首地址等于整个结构体实例的首地址。这时，有朋友可能会问:"标准是否规定相邻字段在内存中也相邻?"。唔，对不起，ANSI C没有做出保证，你的程序在任何时候都不应该依赖这个假设。那这是否意味着我们永远无法勾勒出一幅更清晰更精确的结构体内存布局图？哦，当然不是。不过先让我们从这个问题中暂时抽身，关注一下另一个重要问题————内存对齐。
- 许多实际的计算机系统对基本类型数据在内存中存放的位置有限制，它们会要求这些数据的首地址的值是某个数k(通常它为4或8)的倍数，这就是所谓的内存对齐，而这个k则被称为该数据类型的对齐模数(alignment modulus)。当一种类型S的对齐模数与另一种类型T的对齐模数的比值是大于1的整数，我们就称类型S的对齐要求比T强(严格)，而称T比S弱(宽松)。这种强制的要求一来简化了处理器与内存之间传输系统的设计，二来可以提升读取数据的速度。比如这么一种处理器，它每次读写内存的时候都从某个8倍数的地址开始，一次读出或写入8个字节的数据，假如软件能保证double类型的数据都从8倍数地址开始，那么读或写一个double类型数据就只需要一次内存操作。否则，我们就可能需要两次内存操作才能完成这个动作，因为数据或许恰好横跨在两个符合对齐要求的8字节内存块上。某些处理器在数据不满足对齐要求的情况下可能会出错，但是Intel的IA32架构的处理器则不管数据是否对齐都能正确工作。不过Intel奉劝大家，如果想提升性能，那么所有的程序数据都应该尽可能地对齐。Win32平台下的微软C编译器(cl.exe for 80x86)在默认情况下采用如下的对齐规则: 任何基本数据类型T的对齐模数就是T的大小，即sizeof(T)。比如对于double类型8字节)，就要求该类型数据的地址总是8的倍数，而char类型数据(1字节)则可以从任何一个地址开始。
- Linux下的GCC奉行的是另外一套规则(在资料中查得，并未验证，如错误请指正):任何2字节大小(包括单字节吗?)的数据类型(比如short)的对齐模数是2，而其它所有超过2字节的数据类型(比如long,double)都以4为对齐模数。
事实上，如果对于初学者，或者是对程序执行原理了解甚少的人来说，理解内存对齐是比较困难的。就上上面所说的，编译器会为我们做一些优化，但是有些时候，我们可能需要自己针对目标平台做一些优化，就需要懂得内存对齐了。可以参考这篇翻译稿：<http://blog.csdn.net/lgouc/article/details/8235471>

一句话就是，内存的数据需要被CPU读入寄存器，才能进行运算。而CPU读取数据时是一块块读的，不是一个个字节读的。如果你的某个结构体成员恰好被这种快分割开来了，那么CPU必须进行第二次读入，并进行合并和数据分离等额外操作。内存对齐的目的就是，减少CPU这种二次读数据的行为，即使以增加结构体占用空间为代价（使用padding填充）。另一方面，内存也未必是一定会增加结构体占用空间，有趣的是有时略微调整成员顺序就能有不同的效果。

来看几个例子：

{% highlight c %}
struct MyStruct
{
char dda;//偏移量为0，满足对齐方式，dda占用1个字节；
double dda1;//下一个可用的地址的偏移量为1，不是sizeof(double)=8
            //的倍数，需要补足7个字节才能使偏移量变为8（满足对齐
            //方式），因此VC自动填充7个字节，dda1存放在偏移量为8
            //的地址上，它占用8个字节。
int type;//下一个可用的地址的偏移量为16，是sizeof(int)=4的倍
          //数，满足int的对齐方式，所以不需要VC自动填充，type存
          //放在偏移量为16的地址上，它占用4个字节。
};//所有成员变量都分配了空间，空间总的大小为1+7+8+4=20，不是结构
  //的节边界数（即结构中占用最大空间的类型所占用的字节数sizeof
  //(double)=8）的倍数，所以需要填充4个字节，以满足结构的大小为
  //sizeof(double)=8的倍数。
{% endhighlight %}


所以该结构总的大小为：`sizeof(MyStruc)`为1+7+8+4+4=24。其中总的有7+4=11个字节是VC自动填充的，没有放任何有意义的东西。

编译器处理结构体内存分布是依据如下规则：

- 数据成员对齐规则：结构(struct)(或联合(union))的数据成员，第一个数据成员放在offset为0的地方，以后每个数据成员的对齐按照#pragma pack指定的数值和这个数据成员自身长度中，比较小的那个进行。
- 结构(或联合)的整体对齐规则：在数据成员完成各自对齐之后，结构(或联合)本身也要进行对齐，对齐将按照#pragma pack指定的数值和结构(或联合)最大数据成员长度中，比较小的那个进行。
- 结合1、2推断：当#pragma pack的n值等于或超过所有数据成员长度的时候，这个n值的大小将不产生任何效果。

总结一下，编译器处理的结构体时，必须要知道每个成员的偏移量，这是由该成员本身的占用长度和设置的#pragma pack中的值决定的；还必须要决定结构体本身占用的空间，这是由结构内最大的成员长度和#pragma pack中的值决定的。

再看一个例子：

{::nomarkdown}
{% highlight c %}
#pragma pack(8)
struct s1
{
   short a;  //本身2个字节，偏移从0开始，占用[0][1]
   long b;   //本身4个字节，小于pack(8)，以4字节对齐
               //由于a只占用的2个字节，起始偏移2不是4的倍数，所以需先padding[2][3]，b实际占用[4][5][6][7]
}; //s1结构占用8个字节，其中最长的成员b占用4个字节，小于pack(8)
 //因此，结构的总长度需要是4的倍数，这里刚好是8
 //所以s1占用8个字节
struct s2  
{
   char c;  //本身1个字节，偏移从0开始，占用[0]
   s1 d;     //本身对齐方式以s1的b作为基准（4个字节），小于pack(8），以4字节对齐
              //由于c只占用了1个字节，起始偏移1不是4的倍数，所以需要先3个字节，d实际占用[4]...[11]
   long long e;  //本身8个字节，与pack(8)一样，所以以8字节对齐，
                   //起始偏移为12，不是8的倍数，需padding4个字节，e实际占用[16]...[23]
};//s2现在占用24个字节，其中最长成员e占用8个字节，与pack(8)一样
 //因此，结构的总长度需要是8的倍数，这里的24刚好满足
 //所以s2占用24个字节
#pragma pack()
{% endhighlight %}
{:/}

扩展阅读，[C#中的#pragma指令](http://msdn.microsoft.com/zh-cn/library/vstudio/x74w198a.aspx)

C#支持两种编译指令：

- \#pragma warning：编译警告开关
- \#pragma checksum：计算文件的校验和，以帮助调试器判断源文件是否跟pdb一致。好像没什么用。

例如：

{% highlight c# %}
// pragma_warning.cs
using System;

#pragma warning disable 414, 3021
[CLSCompliant(false)]
public class C
{
   int i = 1;
   static void Main()
   {
   }
}
#pragma warning restore 3021
[CLSCompliant(false)]  // CS3021
public class D
{
   int i = 1;
   public static void F()
   {
   }
}

{% endhighlight %}