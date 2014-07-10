---
layout: postlayout
title: How to build C++/CLI target to .net 2.0 without vs2008
categories: [C-Cpp]
thumbimg: 157222808237574677.jpg
tags: [CPP, dot NET, Compiler]
---

自从vs2010开始，vs调整了对C++编译的策略，使用MSBuild模式，该模式对于将早期的vs2008开发的项目迁移至vs2010是有利的，但是如果用户没有vs2008，但有vs2010，却不能将C++/CLI项目编译成.net 2.0，只能是4.0。查遍网上的解决方案，几乎一致的方案是安装vs2008（3G+）。本文针对这个问题，给出一个不安装vs2008的绿色环保方案（大约200多M）。拯救我们的硬盘空间吧！


## 缘起 ##

项目基于`C++/CLI`封装了BMC Remedy C API，最初我的开发环境是`VS2010`和`VS2012`（自从用了VS2012后，我发现其对C++的支持可谓空前的优秀），编译的托管dll是基于.net 4.0的，本来以为只要不用2.0以上的特性，可以轻松的将目标平台降到2.0，但是当我将Project文件中的targetframework设置为2.0后，本以为“巧妙的”解决了问题了。但是当编译基于2.0的C#项目时（该项目引用了这个C++/CLI项目），报错为“2.0项目不能引用高版本的4.0”。不是明明设置成2.0了吗？后来用ILSpy查看，的确编译出来的C++/CLI的dll是基于4.0的。怎么回事呢？经过反复的查询，必须安装vs2008才能编译出.net 2.0的C++/CLI程序集。我的天哪，要知道我已经安装有vs2010和vs2012了，硬盘实在不能承受啊，无奈之下只能先在其他机器上安装`vs2008`了。当然问题最后的确是解决了，但是作为一个正儿八经的项目不能这么就结束了，于是便有了本文的探讨。

 

## 各取所需 ##

对于仅仅需要编译C++而安装vs2008实在是不划算。仔细想来，vs2008是个集成开发环境，编译普通的C++程序大约只需要C++编译和链接器、动态和静态链接库、导入库即可，而对于MFC、ATL等也只是在这个基础上增加了更多的库而已。对于C++/CLI程序的编译大约增加了.net framework。还记得每个版本的visual studio都提供一个命令行工具吗？该工具会帮我们设置各种环境变量，在这个命令行中可以手动执行各种编译动作。想到这里，是否能够将vs2008中的C++编译所需要的工具和库文件从vs2008中提取出来，再加上一个命令行工具，就可以在没有vs2008的情况下编译我们的dll了，这样一个绿色的编译环境会完成了啊～相信最终的大小会小很多啊。

找到vs2008的VC目录，大致如下：

![]({{ site.BASE_PATH }}/assets/img/2013-01-13-cppcli-target-net2-without-vs2008-img0.png)

主要的目录如上图：

- `atlmfc`：开发基于`alt`、`mfc`等所需要的头文件和导入库，可以不要
- `bin`：vc的工具集，其中包含编译器、链接器、nmake等，当然要拉
- `crt`：大概是vc运行时的源代码，可以不要
- `include`：vc的头文件，当然要拉
- `lib`：vc导入库，当然要拉
- `redist`：crt运行时的动态连接库，建议带上，因为部署的时候需要

将上述需要的内容copy出来留用。另外，既然是windows编程，当然需要windows的导入库和头文件，来到Microsoft SDKs目录，找到6.0版本的SDK，其中的include和lib目录就是所需要的，偷出来吧！

 

## 继续瘦身 ##

是不是发现怎么没有想象的那么小啊～。别急我们继续来瘦身，发现不管是vc的导入库还是windows的导入库都很大，其实原因就是每个导入库都对应不同的CPU架构有多个版本，并且除了x86之外，其余的导入库都单独放在独立的文件夹中，根据你的需要去掉其中不要的就好了。现在是不是大大缩小了。

别急，还有空间，看看bin下面，其中也有非`x86`的工具集，如果你在x86下工作，大可删掉其中其他平台的文件夹

还有还有，`redist`文件夹下面也包含有多个平台的动态连接库，取你所需即可，另外可以删掉`mfc`和`atl`的动态连接库。

 

## 制作命令行工具 ##

上一步得到的200M左右的“编译环境”，可以发在U盘里面随身携带。不过如何使用呢？我们需要一个命令行工具，这个工具在启动时，会将我们这个编译环境相关的路径设置上，这样可以不与已经安装的高版本的vs产生冲突。

首先看下我的编译环境的目录结构

![]({{ site.BASE_PATH }}/assets/img/2013-01-13-cppcli-target-net2-without-vs2008-img1.png)

其中WinSDK6下分别是windows的`include`和`lib`，其他都是从上面的步骤中copy过来的，现在我们在制作`vsvars32.bat`:

{% highlight bat %}

@SET VCINSTALLDIR=J:\vs2008vcbuild
@SET FrameworkDir=C:\Windows\Microsoft.NET\Framework
@SET FrameworkVersion=v2.0.50727
@SET Framework35Version=v3.5
@if "%VCINSTALLDIR%"=="" goto error_no_VCINSTALLDIR

@echo Setting environment for using Microsoft Visual Studio 2008 x86 tools.


@rem
@rem Root of Visual Studio IDE installed files.
@rem

@set PATH=%VCINSTALLDIR%\bin;C:\Windows\Microsoft.NET\Framework\v3.5;C:\Windows\Microsoft.NET\Framework\v2.0.50727;%PATH%
@set INCLUDE=%VCINSTALLDIR%\include;%VCINSTALLDIR%\WinSDK6\Include;%INCLUDE%
@set LIB=%VCINSTALLDIR%\lib;%VCINSTALLDIR%\WinSDK6\Lib;%LIB%
@set LIBPATH=C:\Windows\Microsoft.NET\Framework\v3.5;C:\Windows\Microsoft.NET\Framework\v2.0.50727;%VCINSTALLDIR%\lib;%VCINSTALLDIR%\WinSDK6\Lib;%LIBPATH%

@goto end

:error_no_VCINSTALLDIR
@echo ERROR: VCINSTALLDIR variable is not set. 
@goto end

:end

{% endhighlight %}

这是适用于`x86`目标平台的 编译环境，如果要编译其他平台，可以类推。

脚本的第一行指向的是你的编译环境的路径，如果你像我一样放在U盘中，并且目录名叫`vs2008vcbuild`，那么你可以不用改

 

## 开始编译 ##

启动cmd，执行`vsvars32.bat`，这样你的环境变量都设置好拉，然后cd到你source的目录下，执行相应的命令，为避免有不熟悉命令行模式的朋友，大概普及一下vc的编译器和链接器：

- `cl`：vc的编译器工具，将每个cpp文件，编译生成对应的obj文件
- `link`：vc的链接器工具，将obj文件和lib文件链接成可执行文件
- `nmake`：vc的make工具，能够根据`nmake`格式的配置文件自动编译和链接，类似于`GNU`的`make`

这些工具都在bin目录下能够找到，使用并不是很难，可以参考相关的文档学习使用，关于c++的编译原理可以参考我的文章：<http://pchou.info/C-Cpp/2013/01/12/net-cpp-hobby-02.html>

偷懒的话，可以从vs2008里面把编译和链接的命令行参数copy出来哦～