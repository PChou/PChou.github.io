---
layout: postlayout
title: 程序员应该知道的PC CPU史
description: 本文介绍了PC界CPU的发展史，解释了x86、x64、IA-64、AMD64等概念
thumbimg: 1156cpu.jpg
categories: [Hardware]
tags: [Hardware, Compiler]
---

## 历史回顾 ##

1978年，`Intel`推出`8086`处理器，是最初的`x86`架构CPU，16位。

1985年，Intel推出`80386`处理器，是最早的32位模式的x86架构的CPU，称为`x86-32`或`IA-32`。由于数字不能成为商标，Intel给了这一系列CPU很多我们熟知的名字，比如奔腾等。AMD在这个时代的32位处理器也是基于x86架构的。

1990年代，Intel联合惠普开发64位元CPU，称为`IA-64`架构，这种架构与x86是完全不兼容的。但是似乎研发不是很成功。与此同时，2000年，AMD扩着的x86，使之支持64位元，可以称为`x86-64`或`AMD64`。由于AMD的64位处理器产品线首先进入市场，且微软也不愿意为Intel和AMD开发两套不同的64位操作系统，Intel也被迫采纳AMD64指令集且增加某些新的扩充到他们自己的产品，命名为`EM64T`架構（虽然他们不想承认这些指令集是来自它的主要对手），EM64T后来被Intel正式更名為Intel 64。

如今x86成为最成功和最广泛使用的CPU架构，这种架构可以同时工作在32位模式和64位模式下，也就是为什么我们的个人电脑又可以装32位的windows，也可以装64的windows。

32位的应用程序是可以在64位的windows下运行的，这种情况下，windows会将进程放在32位模式下运行。然而，同一个进程却不能即工作在64位下，又工作在32下。典型的问题就是有时需要将IIS从64模式切回32模式，以适应用win32方式编译的应用程序。（.NET通过`IL`和`JIT`，可以动态适应不同的平台）


## 与VC编译器的平台相关 ##

就上面的CPU历史看来，实际上现如今PC和服务器的主要CPU架构分为3种：

- `x86-32`：x86架构的32位元，对应`Win32`平台，也可以叫`IA-32`，`i386`等
- `x64`：基于x86架构的`AMD64`，由于Intel 64兼容AMD64，所以以AMD64作为平台，可以做到最大的兼容性
- `Itanium`：即`IA-64`，对应Intel的安腾系列处理器，很少用

参考资料

<http://zh.wikipedia.org/wiki/X86>
<http://zh.wikipedia.org/zh-cn/Itanium>
<http://mariusbancila.ro/blog/2010/10/05/defining-x64-target-platform-for-vc-projects/>
<http://blog.csdn.net/jpexe/article/details/8447696>