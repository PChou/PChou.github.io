---
layout: postlayout
title: 概念：GNU构建系统和Autotool
categories: [Linux]
tags: [C]
---

经常使用Linux的开发人员或者运维人员，可能对`configure->make->make install`相当熟悉。事实上，这叫`GNU构建系统`，利用脚本和`make`程序在特定平台上构建软件。这种方式成为一种习惯，被广泛使用。本文从用户视角和开发者视角详细说明，这种构建方式的细节，以及开发者如何利用`autoconf`和`automake`等工具(autotools)创建兼容GNU构建系统的项目。

为了简化可移植构建的难度，在早期有一套`autotools`工具帮助程序员构建软件。我们熟知的`configure->make->make install`三部曲，大多都是基于`autotools`来构建的。autotools是GNU程序的标准构建系统，所以其实我们经常在使用三部曲。有些程序虽然也是这三部曲，但却不是用`autotools`实现的，比如`nginx`的源码就是作者自己编写的构建程序。

## 用户视角

用户通过`configure->make->make install`基于源码安装软件。然而大部分用户可能并不知道这个过程究竟做了些什么。

`configure`脚本是由软件开发者维护并发布给用户使用的shell脚本。这个脚本的作用是检测系统环境，最终目的是生成`Makefile`和`config.h`。

`make`通过读取`Makefile`文件，开始构建软件。而`make install`可以将软件安装到需要安装的位置。

![](http://pchou.qiniudn.com/2016-09-16-gnu-build-system-00.png)

如上图，开发者在分发源码包时，除了源代码(.c .h...)，还有许多用以支撑软件构建的文件和工具，其中最重要的文件就是`Makefile.in`和`config.h.in`。`configure`脚本执行成功后，将为每一个`*.in`文件处理成对应的非`*.in`文件。

> 大部分情况只生成Makefile和config.h，因为Makefile用于make程序识别并构建软件，而config.h中定义的宏，有助于软件通过预编译来改变自身的代码，以适应目标平台某些特殊性。有些软件在configure阶段，还可以生成其他文件，这完全取决于如软件本身。

### configure

当运行`configure`时，将看到类似如下的系统检查，这些检查的多少取决于软件本身的需要，也就是由软件开发者来定义和编写的。

```
checking for a BSD-compatible install... /usr/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking for gcc... gcc
checking for C compiler default output file name... a.out
...
```

一般来说，`configure`主要检查当前目标平台的程序、库、头文件、函数等的兼容性。这些检查结果将作用于`config.h`和`Makefile`文件的生成。从而影响最终的编译。

用户也可以通过给configure配置参数来定制软件需要包含或不需要包含的组件、安装路径等行为。这些参数分为5组，可以通过执行`./configure --help`来查看，软件提供哪些配置参数：

- `*`安装路径相关配置。最常见的是`--prefix`。
- `*`程序名配置。例如`--program-suffix`可用于为生成的程序添加后缀。
- `*`跨平台编译。不太常用。
- `*`动态库静态库选项。用于控制是否生成某种类型的库文件。
- 程序组件选项。用于配置程序是否将某种功能编译到程序中，一般形如`--with-xxx`。这可能是最常用的配置，而且由软件开发者来定义。

（`*`表示这是几乎所有软件都支持的配置，因为这些配置是autotool生成的configure脚本默认支持的。）

configure在执行过程中，除了生成Makefile外，还会生成的文件包括但不限于：

- `config.log` 日志文件
- `config.cache` 缓存，以提高下一次configure的速度，需通过`-C`来指定才会生成
- `config.status` 实际调用编译工具构建软件的shell脚本

![](http://pchou.qiniudn.com/2016-09-16-gnu-build-system-01.png)

如果软件通过libtool构建，还会生成`libtool`脚本。关于libtool脚本如何生成，请看`开发者视角`。

`configure`经常会中途出错，这一般是由于当前平台不具有构建该软件所必需的依赖（库、函数、头文件、程序...)。此时，不要慌张，仔细查看输出，解决这些依赖。


## 开发者视角

开发者除了编写软件本身的代码外，还需要负责生成构建软件所需要文件和工具。当我接触到`autotools`后，我发现，虽然有工具的帮助，但这件事情依旧十分复杂。

对于C或C++程序员，在早期，构建跨平台的应用程序是相当繁琐的一件事情，而且对于经验不足的程序员而言，甚至难度巨大。因为构建可移植的程序的必要前提是对各个平台足够了解，这往往要花上相当长的时间去积累。

> Unix系统的分支复杂度很高，不同的商用版或开源版或多或少都有差异。这些差异主要体现在：系统组件、系统调用。我们主要将Unix分为如下几个大类：`IBM-AIX` `HP-UX` `Apple-DARWIN` `Solaris` `Linux` `FreeBSD`。[Unix分支大全](http://img1.51cto.com/attachment/201102/092356384.gif)

因此，对于开发者而言，要么自己编写构建用的脚本，这往往需要极其扎实的shell能力和平台熟悉度。另一个选择就是部分依赖工具。`autoconf`和`automake`就是这样的工具。

### autoreconf

为了生成`configure`脚本和`Makefile.in`等文件，开发者需要创建并维护一个`configure.ac`文件（在早期，通常叫`configure.in`文件，虽然没有区别，但强烈建议使用`.ac`，因为`.in`文件往往意味着被configure脚本识别为模板文件并生成直接参与最终构建的文件，`configure.in`在命名上有歧义）,以及一系列的`Makefile.am`。`autoreconf`程序能够自动按照合理的顺序调用`autoconf` `automake` `aclocal`等程序。

![](http://pchou.qiniudn.com/2016-09-16-gnu-build-system-02.png)


### configure.ac

`configure.ac`用于生成`configure`脚本。`autoconf`工具用来完成这一步。下面是一个`configure.ac`的例子：

```
AC_PREREQ([2.63])
AC_INIT([st], [1.0], [zhoupingtkbjb@163.com])
AC_CONFIG_SRCDIR([src/main.c])
AC_CONFIG_HEADERS([src/config.h])

AM_INIT_AUTOMAKE([foreign])


# Checks for programs.
AC_PROG_CC
AC_PROG_LIBTOOL

# Checks for libraries.

# Checks for header files.

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.

AC_CONFIG_FILES([Makefile
                 src/Makefile
                 src/a/Makefile
                 src/b/Makefile])
AC_OUTPUT

```

其中以`AC_`开头的类似函数调用一样的代码，实际是一些被称为`“宏”`的调用。这里的宏与C中的宏概念类似，会被替换展开。`m4`是一个经典的宏工具，`autoconf`正是构建在`m4`之上，可以理解为`autoconf`预先实现了大量的，用于检测系统可移植性的宏，这些宏在展开后就是大量的shell脚本。所以编写`configure.ac`需要对这些宏熟练掌握，并且合理调用。有时，甚至可以自己实现自己的宏。

### autoscan和configure.scan

可以通过调用`autoscan`命令得到一个初始化的`configure.scan`文件，然后重命名为`configure.ac`后，在此基础上编辑`configure.ac`。`autoscan`会扫描源码，并生成一些通用的宏调用、输入的声明以及输出的声明。尽管`autoscan`十分方便，但是没人能够在构建之前，就把代码完全写好，因此`autoscan`通常用于初始化`configure.ac`。

### autoheader和config.h

`autoheader`命令扫描`configure.ac`中的内容，并确定需要如何生成`config.h.in`。每当`configure.ac`有所变化，都可以通过再次执行`autoheader`更新`config.h.in`。在`configure.ac`通过`AC_CONFIG_HEADERS([config.h])`告诉`autoheader`应当生成`config.h.in`的路径。在实际的编译阶段，生成的编译命令会加上`-DHAVE_CONFIG_H`定义宏，于是在代码中，我们可以通过下面代码安全的引用`config.h`。

```
/bin/sh ../../libtool --tag=CC   --mode=compile gcc -DHAVE_CONFIG_H ...
```

```
#ifdef HAVE_CONFIG_H
#include <config.h>
#endif
```

`config.h`包含了大量的宏定义，其中包括软件包的名字等信息，程序可以直接使用这些宏；更重要的是，程序可以根据其中的对目标平台的可移植性相关的宏，通过条件编译，动态的调整编译行为。

### automake和Makfile.am

手工编写Makefile是一件相当烦琐的事情，而且，如果项目复杂的话，编写难度将越来越大。因而，`automake`工具应运而生。我们可以编写像下面这样的`Makefile.am`文件，并依靠automake来生成`Makefile.in`：

```
SUBDIRS = a b
bin_PROGRAMS	= st
st_SOURCES		= main.c
st_LDADD		= $(top_builddir)/src/a/liba.la $(top_builddir)/src/b/libb.la 
```

这里通过`SUBDIRS`声明了两个子目录，子目录的中的构建需要靠`a/Makefile.am`和`b/Makefile.am`来进行，这样多目录组织起来就方便多了。

`bin_PROGRAMS`声明一个可执行文件目标，`st_SOURCES`指定这个目标所依赖的源代码文件。另外，`st_LDADD`声明了可执行文件在连接时，需要依赖的Libtool库文件。

通过这个Makefile.am文件生成的Makefile.in文件相当大，不便贴出，但是可以想象，Makefile.in要比我们手工编写的Makefile文件复杂的多。

`automake`的出现晚于`autoconf`，所以`automake`是作为`autoconf`的扩展来实现的。通过在`configure.ac`中声明`AM_INIT_AUTOMAKE`告诉`autoconf`需要配置和调用`automake`。

### aclocal

上面提到，`configure.ac`实际是依靠宏展开来得到`configure`的。因此，能否成功生成取决于，宏定义能否找到。`autoconf`会从自身安装路径下来寻找事先定义好了宏。然而对于像`automake`、`libtool`和`gettext`等第三方扩展宏，甚至是开发者自行编写的宏就一无所知了。于是，存在这个工具`aclocal`，将在`configure.ac`同一目录下生成`aclocal.m4`，在扫描`configure.ac`的过程中，将第三方扩展和开发者自己编写的宏定义复制进去。这样，`autoconf`在遇到不认识的宏时，就会从`aclocal.m4`中查找。


下面这张图更为详细的展现了整个工具链是如何互相配合的。

![](http://pchou.qiniudn.com/2016-09-16-gnu-build-system-03.png)

### libtool

`libtool`试图解决不同平台下，库文件的差异。libtool实际是一个shell脚本，实际工作过程中，调用了目标平台的`cc`编译器和链接器，以及给予合适的命令行参数。libtool可以单独使用，这里只介绍与autotools集成使用相关的内容。

automake支持libtool构建声明。在Makefile.am中，普通的库文件目标写作`xxx_LIBRARIES`：

```
noinst_LIBRARIES = liba.a
liba_SOURCES = ao1.c ao2.c ao3.c
```

而对于一个libtool目标，写作`xxx_LTLIBRARIES`，并以`.la`作为后缀声明库文件。

```
noinst_LTLIBRARIES = liba.la
liba_la_SOURCES = ao1.c ao2.c ao3.c
```

在configure.ac中需要声明`LT_INIT`：

```
...
AM_INIT_AUTOMAKE([foreign])
LT_INIT
...
```

有时，如果需要用到libtool中的某些宏，则推荐将这些宏copy到项目中。首先，通过`AC_CONFIG_MACRO_DIR([m4])`指定使用`m4`目录存放第三方宏；然后在最外层的`Makefile.am`中加入`ACLOCAL_AMFLAGS = -I m4`。

### all-in-one

上面讨论了很多关于`autoreconf`的细节。实际上，如今我们可以直接调用`autoreconf --install`来自动调用上面提到的所有子命令。这里`--install`参数试图将辅助的脚本和宏copy到当前项目目录中，下面是执行时的输出：

```
autoreconf: Entering directory `.'
autoreconf: configure.ac: not using Gettext
autoreconf: running: aclocal 
autoreconf: configure.ac: tracing
autoreconf: running: libtoolize --copy
libtoolize: putting auxiliary files in `.'.
libtoolize: copying file `./ltmain.sh'
libtoolize: Consider adding `AC_CONFIG_MACRO_DIR([m4])' to configure.ac and
libtoolize: rerunning libtoolize, to keep the correct libtool macros in-tree.
libtoolize: Consider adding `-I m4' to ACLOCAL_AMFLAGS in Makefile.am.
autoreconf: running: /usr/bin/autoconf
autoreconf: running: /usr/bin/autoheader
autoreconf: running: automake --add-missing --copy --no-force
configure.ac:10: installing `./config.guess'
configure.ac:10: installing `./config.sub'
configure.ac:9: installing `./install-sh'
configure.ac:9: installing `./missing'
src/Makefile.am: installing `./depcomp'
autoreconf: Leaving directory `.'

```

当我们以`--install`参数运行时，`libtoolize --copy`被调用，这将使得`ltmain.sh`被copy进来；接下来分别执行`autoconf`和`autoheader`；`automake`的参数为`--add-missing --copy --no-force`，这将使得几个辅助脚本和文件被安装到目录下。

这些辅助文件默认安装在`configure.ac`同一个目录下，如果你希望用另一个目录来存放他们，可以配置`AC_CONFIG_AUX_DIR`，例如`AC_CONFIG_AUX_DIR([build-aux])`将使用`build-aux`目录来存放辅助文件。

如果不使用`--install`参数，辅助文件要么不copy，要么以软链的形式创建。推荐使用`--install`，因为这样，其他软件维护可以避免由于构建工具版本不一致造成问题。

### 辅助文件

一个依靠GNU构建系统开发的软件除了源码之外，还有很多辅助的文件，有些是脚本，有些是文本文件。下面将逐一解释这些文件：

- `aclocal.m4`：上面提到了，这个宏定义文件里面包含了第三方的宏定义，用于autoconf展开configure.ac
- `NEWS` `README` `AUTHORS` `ChangeLog`：这些文件是GNU软件的标配，不过在项目中不一定需要加入。如果项目中没有这些文件，每次`autoreconf`会提示缺少文件，不过这并不影响。如果不想看到这些错误提示，可以用`AM_INIT_AUTOMAKE([foreign])`来配置`automake`。`foreign`参数就是告诉`automake`不要这么较真:)
- `config.guess` `config.sub：`由`automake`产生，两个用于目标平台检测的脚本
- `depcomp` `install-sh`：由`automake`产生，用于完成编译和安装的脚本
- `missing`：由`automake`产生
- `ltmain.sh`：有`libtoolize`产生，该脚本用于在`configure`阶段配置生成可运行于目标平台的`libtool`脚本
- `ylwrap`：由`automake`产生，如果检测构建需要使用lex和yacc，那么会产生这个包装脚本
- `autogen.sh`：在早期，`autoreconf`并不存在，软件开发者往往需要自己编写脚本，按照顺序调用`autoconf` `autoheader` `automake`等工具程序。这个文件就是这样的脚本。起这么个名字可能是习惯性的

## 总结

本文总概念上阐述了autotool系列工具是如何工作的。相比如今现成的IDE，GNU构建系统其实是非常难用的，学习成本比较高。笔者认为最为效率的途径是学习开源的程序，从中慢慢体会，慢慢吸收。另外，推荐几个资料：

- 《GNU Autoconf Automake and Libtool》
- [Autotools Tutorial](https://www.lrde.epita.fr/~adl/autotools.html)
- GNU网站上关于autoconf automake 和 libtool的手册

笔者还有一些相关的笔记，后面再另外写一篇文章总结一下。