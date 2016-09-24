---
layout: postlayout
title: 实践：GNU构建系统
categories: [Linux]
tags: [C]
---


在上一篇[概念：GNU构建系统和Autotool](http://www.pchou.info/linux/2016/09/16/gnu-build-system-1.html)，我对GNU构建系统从用户视角和开发者视角分别进行了阐述。本篇从我的实践总结的角度，并阐述如何从头开始规划一个基于GNU构建系统的项目。事实上，随着开发者对跨平台认知的深入和完善，才能逐渐掌握GNU构建。注意：本文的例子不依赖于任何IDE和编辑器。这样读者可以从根本上认识到每个文件的作用。


## 安装autotools

需要安装的工具包括autoconf、automake、libtool。

## 目录结构规划

首先，我们需要规划项目的目录结构。假设，我们的项目叫`gnu-build`。设想如下目录结构：


```
gnu-build
 |---build(用于编译)
 |---src
      |---common
           |---Makefile.am
           |---pool.c
           |---alloc.c
           |---list.c
           |...
      |---core
           |---Makefile.am
           |---main.c
           |...
      |---test
           |---Makefile.am
           |---test.c
           |...
      |---Makefile.am
 |---configure.ac
 |---Makefile.am
 |---.gitignore

```

从上面的目录结构可以看出：

1. 根目录有一个`configure.ac`，这是构建系统的核心文件之一，描述整个构建的依赖和输出，是`configure`脚本的原型。
2. 每个目录(包括根目录)都有一个`Makefile.am`，这些文件是生成`Makefile`的主要来源。使用Makefile.am的优点是可以结合`configure.ac`、比手动编写`Makefile`方便很多。
3. 在`src`目录下放置源代码，源代码被分成`common`、`core`、`test`。`common`用来实现一些可重用的代码，比如通用数据结构，内存管理，异常的封装；`core`用来放置直接编译成可执行程序的代码，比如main.c等；`test`用于编写单元测试程序。
4. `build`目录用于存放编译过程中的临时文件和编译得到了目标文件。一般我们总是`cd`在`build`目录中，并执行`../configure`来`configure`，并在build目录下make。这样的话，由`configure`产生的文件不会污染源码空间。我们需要做的只是在`.gitignore`中添加`build/`。

在使用autoreconf的过程中，还将在各个目录下生成其他的文件（尤其是根目录）。现在我们只需要创建上述必要文件。

> `configure.ac`可以通过在根目录下执行`autoscan`程序生成。如果你已经有一些代码了，使用autoscan生成configure.ac是个不错的开始。


## configure.ac的基本编写

### 通用宏

每个`configure.ac`都需要如下两行。分别说明需要的autoconf的最低版本，以及程序的包名、版本、bug反馈邮件地址。

```
AC_PREREQ(2.59)
AC_INIT([gnu-build], [1.0], [support@gnubuild.org])
```

`configure.ac`通篇几乎都是采用这种类似函数调用的语法编写，这些称为`宏`的语句，会被autoconf工具识别，并展开成相应的shell脚本，最终成为`configure`脚本。除此之外，也可以混合地直接编写shell脚本。autoconf预置了很多实用的宏，可以减少工作量，后面你将看到`宏`的价值。

> 可以直接编写shell脚本，但是推荐尽量使用宏。因为shell程序有很多种(sh,bash,ksh,csh...)，想要写出可移植的shell并不是件容易的事情。

接着，通常使用`AC_CONFIG_SRCDIR`来定位一个源代码文件，如此一来，autoconf程序会检查该文件是否存在，以确保autoconf的工作目录的正确性。这里，我们指向`src/core/main.c`。

```
AC_CONFIG_SRCDIR([src/core/main.c])
```

### 定义输出的宏

一般来说，都会编写一个`header`输出定义。这是我们用到的第一个输出指令。输出指令告诉`configure`，需要生成哪些文件。`AC_CONFIG_HEADERS`的含义是在指定的目录生成`.h`，一般叫做`config.h`，你也可以指定其他名字。

```
AC_CONFIG_HEADERS([src/common/config.h])
```

那么这个`config.h`究竟有什么用呢？回忆一下，`configure`程序的主要目的是检测目标平台的软硬件环境，从而在实际调用`make`命令编译程序前，对编译工作进行一个预先的配置，这里的配置落实到底，主要就是生成`Makefile`和`config.h`：

```
Makefile.am --> Makefile.in --> Makefile
                             |
                           configure*
                             |
                config.h.in --> config.h
```

那么我们的程序必需要通过某种方式，得知环境的不同，从而通过预编译做出响应。这里的响应主要分两块：

1. 对于源代码而言，通过`config.h`中的宏定义，来改变编译行为。
2. 对于Makefile.am而言，通过`configure.ac`导出的变量，来动态改变Makefile。

在后面的叙述中，可以通过代码体会这两点。所以这里，为了让我们的源码有能力根据环境来改变编译行为，生成config.h通常是必要的。


另一个输出宏是`AC_CONFIG_FILES`，针对这个例子，告诉autoconf，我们需要输出Makefile文件：

```
AC_CONFIG_FILES([Makefile
                 src/Makefile
                 src/core/Makefile
                 src/common/Makefile
                 src/test/Makefile
                 ])
AC_OUTPUT
```

注意到每个目录都需要由对应的Makefile文件，这是automake多目录组织Makefile的通用做法。后面会讲到如何编写各个目录下的`Makefile.am`。

`AC_CONFIG_FILES`一般跟`AC_OUTPUT`一起写在`configure.ac`的最后部分。

### automake声明

为了配合automake，需要用`AM_INIT_AUTOMAKE`初始化automake：

```
AM_INIT_AUTOMAKE([foreign])
```

这里`foreign`是个可选项，设置`foreign`跟调用`automake --foreign`是等价的，前一篇有讲到。

### libtool声明

配合使用libtool，需要加入`LT_INIT`，这样`autoreconf`会自动调用`libtoolize`

```
LT_INIT
```

### 编译器检查

configure可以帮助我们检查编译和安装过程中需要的系统工具是否存在。一般在进行其他检查前，先做此类检查。例如下面是一些常用的检查：

```
# 声明语言为C
AC_LANG(C)

# 检查cc
AC_PROG_CC

# 检查预编译器
AC_PROG_CXX

# 检查ranlib
AC_PROG_RANLIB

# 检查lex程序，gnu下通常叫flex
AC_PROG_LEX

# 检查yacc，gnu下通常叫bison
AC_PROG_YACC

# 检查sed
AC_PROG_SED

# 检查install程序
AC_PROG_INSTALL

# 检查ln -s
AC_PROG_LN_S
```

针对这个例子我们只需要检查`cc`，`cxx`就可以了。

## Makefile.am的基本编写

`Makefile.am`文件是一种更高层次的Makefile，抽象程度更高，比Makefile更容易编写，除了兼容Makefile语法外，通常只需包含一些变量定义即可。automake程序负责解析，并生成`Makefile.in`，而Makefile.in从表现上与Makefile已经十分接近，只差变量替换了。configure脚本执行后，Makefile.in将最终转变成Makefile。


### 子目录引用

在本例中每个目录下都有Makefile.am。根目录的Makefile.am生成的Makefile将是make程序的默认入口，但是根目录实际上并不包含任何需要构建的文件。对于需要引用子目录的Makefile来构建的时候，使用`SUBDIRS`罗列包含其他Makefile.am的子目录。因此，对于根目录的Makefile.am只需要写一行：

```
SUBDIRS = src
```

同理，src目录下的Makefile.am只需要

```
SUBDIRS = common src test
```

### 定义目标

对于包含有源代码文件的目录。首先，我们需要定义编译的目标，目标可能是库文件或可执行文件，目标又分为需要安装和不需要安装两种。例如对于common目录
下的源代码，我们希望生成一个不需要安装的库文件（使用libtool），因为这个库文件只在本项目内使用，那么`common/Makefile.am`应当这样写：

```
noinst_LTLIBRARIES = libcommon.la
libcommon_la_SOURCES = pool.c alloc.c list.c
```

定义了一个目标`libcommon.la`。由于使用libtool，所以库文件必须以`lib`开头，后缀为`.la`。

目标的基本格式为`where_PRIMARY = targets ...` `where`表示安装位置，可选择bin、lib、noinst、check(make check时构建)，还可以自定义。我们着重讨论前三种：

- `bin`：表示安装到bindir目录下，这种情况下会编译出动态库
- `lib`：表示安装到libdir目录下，这种情况下会编译出动态库
- `noinst`：表示不安装，这种情况下会编译出静态库，在其他目标引用该目标时将进行静态链接

`PRIMARY`可以是`PROGRAMS` `LIBRARIES` `LTLIBRARIES` `HEADERS` `SCRIPTS` `DATA`。着重讨论前三种：

- `PROGRAMS`：表示目标是可执行文件
- `LIBRARIES`：表示目标是库文件，通过后缀来区别静态库或动态库
- `LTLIBRARIES`：表示是libtool库文件，统一后缀为`.la`

与Makefile的思想一样，目标的生成需要定义来源，通常目标是有一些源程序文件得到的。Makefile.am中只需定义`xxx_SOURCES`，后面跟随构建xxx这个目标需要的源代码文件列表即可。注意到xxx是目标的名字，并且`.`字符需要使用`_`代替。

### 定义编译选项

`core`目录下需要生成可执行目标，但是在链接时，需要用到`libcommon.la`，此时`core/Makefile.am`可以写成

```
bin_PROGRAMS = gnu-build
GNU_BUILD_SOURCES = main.c
GNU_BUILD_LIBADD = $(top_builddir)/src/common/libcommon.la
```

这里多了一行`GNU_BUILD_LIBADD`，*target*_LIBADD的形式表示为target添加库文件的引用，这种引用是静态的还是动态的取决于引用的库文件是否支持动态库，如果支持动态库，libtool优先采用动态链接。而由于`libcommon.la`指定为`noinst`，所以不可能以动态链接的形式存在，这里必然是静态链接。

`$(top_builddir)`引用的是make发生时的工作目录，上文提到，我们将在build目录下进行构建，那么库文件会生成在build目录下，而不是源码根目录下，所以`$(top_builddir)`实际就是`gnu-build/build`目录，而这样可以很好的支持在另一个目录中编译程序。与之相对应的是`$(top_srcdir)`对应的是源码的根目录，即`gnu-build`目录。

还有多个可以配置用于改变编译和链接选项的配置项：

- xxx_LDADD：为链接器增加参数，一般用于第三方库的引用。比如`-L` `-l`
- xxx_LIBADD：声明库文件引用，一般对于本项目中的库文件引用采用这种形式。
- xxx_LDFLAG：链接器选项
- xxx_CFLAGS：c编译选项，如`-D` `-I`
- xxx_CPPFLAGS：预编译选项
- xxx_CXXFLAGS： c++编译选项

如果xxx是`AM`，则表示全局target都采用这个选项。

### 安装路径

刚刚提到的`bindir`和`libdir`是configure目录体系下的，类似的路径还有：

```
prefix				/usr/local
exec-prefix			{prefix}
bindir				{exec-prefix}/bin
libdir				{exec-prefix}/lib
includedir			{prefix}/include
datarootdir			{prefix}/share
datadir 			{datarootdir}
mandir				{datarootdir}/man
infodir				{datarootdir}/info
...
```

可以看到`prefix`在这里的地位是一个顶层的路径，其他的路径直接或间接与之有关。而prefix的默认值为`/usr/local`。所以可执行程序默认总是安装在`/usr/local/bin`。用户总是可以在调用`configure`脚本时通过`--prefix`指定prefix。更详细的路径列表可以通过`./configure --help`了解。


## 开始构建

填充一些源代码后，就可以使用autoreconf了，只需要在根目录下执行`autoreconf --install`即可。

```
[root@xxx gnu-build]# autoreconf --install
```

[前一篇](http://www.pchou.info/linux/2016/09/16/gnu-build-system-1.html)中，对autoreconf的整个过程和产生的文件做了详尽的分析和阐述，读者也应该十分清楚这里将得到若干`Makefile.in`和`common/config.h.in`文件。

如果这个过程顺利的话，就可以在build目录下构建了：

```
# cd build
# ../configure
# make
```

> 这里configure后，会在build目录下生成对应位置的Makefile和common/config.h文件，而不是生成在源码目录中从而污染源码

至此，你已经完成了一个项目的基本构建框架，后面的事情，就是逐步完善构建对环境的依赖。

## 在configure.ac中配置环境检查

`autoconf`为程序员提供的最为重要的功能就是提供了一种便捷、稳定、可移植的方式，让程序能在特定目标平台和目标环境上安全的编译运行程序。不过，`autoconf`只是提供了一些宏，用来简化环境检查。而究竟要检查些什么，如何合理的利用这些宏完成目的，依旧是需要大量的积累的。笔者在这里对一些常用的宏进行一些介绍。

### 可执行文件检查

有些第三方库在安装到系统后，会附带安装若干可执行程序，并可在环境变量的支持下直接运行。有时，我们通过检查此类可执行程序是否存在，来初步判断该第三方库是否已经安装在目标平台。其中一种常用的宏是`AC_CHECK_PROGS`

```
# 声明一个变量PERL，检查perl程序是否存在并可执行
# 如果不存在$PERL变量将是NOTFOUND，如果存在$PERL变量将是perl
AC_CHECK_PROGS([PERL], [perl], [NOTFOUND])

# 声明一个变量TAR，检查tar和gtar程序是否存在并可执行
# 如果不存在$TAR变量将是:，如果存在，第一个可用的程序名将赋值给$TAR
AC_CHECK_PROGS([TAR], [tar gtar], [:])
```

> GNU软件有一种利用pkg-config，来进行自描述的机制。即可以通过注册软件自身（通常提供库文件的软件），让pkg-config能够返回库文件的安装路径等信息，以便以一种统一的方式提供给调用程序。有些库软件附带有独立的config程序，比如`pcre-config`和`apr-1-config`。如果对这类库提供软件需要检查依赖和编译链接，通常可以通过`AC_CHECK_PROGS`来检查config程序，从而得到编译链接选项。


### 打印消息宏

打印消息可以作为调试手段，同时也可以在用户在configure过程中，给予提示信息。

```
# error将终止configure
AC_MSG_ERROR([zlib is required])

# warn不会终止configure
AC_MSG_WARN([zlib is not found, xxx will not be support.])
```

注意到`AC_MSG_ERROR`将中断configure的执行，一般用于必需的编译环境无法满足时。

### 库检查宏

检查某库是否存在是最重要的功能，因为我们程序往往需要这些库，甚至是库中的某个函数的支持才能正确的运行。

使用`AC_CHECK_LIB`检查库以及其中的函数是否存在，该宏的原型为：

```
AC_CHECK_LIB (library, function, [action-if-found],[action-if-not-found], [other-libraries])
```

- library：需要检查的库名，无需`lib`前缀，比如为了检查`libssl`是否存在，这里需要传入`ssl`
- function：这个库中的某个函数名
- action-if-found：如果找到执行某个动作，这个动作可以是另一个宏，可以是shell脚本。如果不指定这个参数，默认在`LIBS`环境变量中增加`-l`选项，从而将在链接过程中将这个库链接进来。比如`-lssl`。并且在config.h中定义一个宏`HAVE_LIBlibrary`，例如`HAVE_LIBSSL`。我们的代码可以根据这个宏得知当前编译环境是否提供`libssl`。
- action-if-not-found：如果找不到则执行某个动作


通过下面几个宏可以检查系统是否包含某些头文件，以及是否支持某些函数：

- `AC_CHECK_FUNCS`：检查是否支持某些函数。作为检查的副作用，在config.h中会定义一个宏`HAVE_funcs`（全大写）
- `AC_CHECK_HEADERS`：检查是否支持某些头文件。作为检查的副作用，在config.h中会定义一个宏`HAVE_header_H`（全大写）

来举个例子，大家知道`libiconv`是一个可以在不同字符集间进行转化的库，如果我们的程序希望能够在不同字符集间转化的字符串的话，可以使用该库。然而，在不同平台上，该库的移植方式有些区别。

gnu的标准c库(glibc)在很早的时候就把libiconv集成到了glibc中，因此在linux上可以无需额外的库支持即可使用`iconv`。然而，在非linux上，很可能需要额外的`libiconv`库。那么如果在非linux的平台上编写可移植的程序，可以参考如下的宏组合：

```
AC_CHECK_FUNCS(iconv_open, HAVE_ICONV=yes, [])
if test "x$HAVE_ICONV" = "xyes"; then
     AC_CHECK_HEADERS(langinfo.h, [], AC_MSG_WARN([langinfo.h not found]))
     AC_CHECK_FUNCS([nl_langinfo], [], [AC_MSG_WARN([nl_langinfo not found])])
else
    AC_CHECK_LIB([iconv], [libiconv_open], [HAVE_ICONV=yes], [AC_MSG_WARN([no iconv found, will not build xm_charconv])])
    if test "x$HAVE_ICONV" = "xyes"; then
        LIBICONV="-liconv"
        SAVED_LIBS=$LIBS
    	LIBS="$LIBS $LIBICONV"
    	AC_CHECK_HEADERS(langinfo.h, 
                     AC_CHECK_FUNCS([nl_langinfo], [], [AC_MSG_ERROR([nl_langinfo not found in your libiconv])]), 
                     AC_CHECK_FUNCS([locale_charset], [], [AC_MSG_ERROR([no langinfo.h nor locale_charset found in libiconv])]))
    	LIBS=$SAVED_LIBS
    fi
fi
```

在这个例子中，我们可以看到许多技巧。我们来逐一解读一下：

1. 首先通过`AC_CHECK_FUNCS`检查`iconv_open`函数，如果在Linux平台上，通常该函数可以在没有任何额外库的情况下提供，所以`HAVE_ICONV`这个临时变量将设置为`yes`。
2. 接着通过shell的`if`测试判断临时变量`HAVE_ICONV`是否为`yes`。
3. 如果已经检测到iconv，那么进一步检查`langinfo.h`头文件和`nl_langinfo`函数，无论是否能检查通过，由于使用了`AC_MSG_WARN`，所以configure并不会失败退出，最多只是提示用户警告。更重要的是，我们可以通过config.h中的宏，在代码中得知是否支持头文件和函数，从而调整编译分支。具体的在这个例子中这两个宏分别为`HAVE_LANGINFO_H`和`HAVE_NL_LANGINFO`。
4. 在非linux下可能需要额外的libiconv库，所以在`else`分支中，立刻采用`AC_CHECK_LIB`检测`iconv`库，以及其中的`libiconv_open`函数。同样的，如果存在，`HAVE_ICONV`这个临时变量将设置为`yes`。
5. 在接下来的if测试中，使用到了`$LIBS`变量，这是一个由编译器支持的变量，表示在链接阶段的额外库参数。当我们检测到libiconv后，就给这个变量临时地添加`-liconv`。这样接下来的`AC_CHECK_FUNCS`时，可以利用`$LIBS`在额外的库中查找函数。
6. 检查`langinfo.h`头文件，如果存在则再检查`nl_langinfo`函数；如果不存在，则检查`locale_charset`函数。从逻辑上看，要么`langinfo.h`和`nl_langinfo`同时存在，要么有`locale_charset`函数，否则就终止configure。
7. 最后重置`$LIBS`变量。

### 变量导出

configure脚本的检测结果应当有两个主要出口，一是config.h，它帮助我们在源码中创建编译分支；二是`Makefile.am`，我们可以在`Makefile.am`中基于这些导出的变量，改变构建方式。

有些宏可以自动帮我们导出到`config.h`，关于这一点上文已经有所阐述了。而希望导出到Makefile.am则需要我们自己手动调用相关宏。这里主要有两个宏：

- `AC_SUBST`：将一个临时变量，导出到Makefile.am。实际是在Makefile.in中声明一个变量，并且在生成Makefile时，由configure脚本对变量的值进行替换。
- `AM_CONDITIONAL`：由automake引入，可进行一个条件测试，从而决定是否导出变量。


例如，针对上面iconv的例子，我们有个临时变量`HAVE_ICONV`，如果iconv在当前平台可用，此时`HAVE_ICONV`将会是`yes`。所以可以使用`AM_CONDITIONAL`导出变量：

```
AM_CONDITIONAL([HAVE_ICONV], [test x$HAVE_ICONV != x])
```

或者无论如何都导出`HAVE_ICONV`

```
AC_SUBST(HAVE_ICONV)
```

在Makefile.am中，我们可以对变量进行引用，这样xm_charconv.la就将在HAVE_ICONV导出的情况下构建：

```
if HAVE_ICONV
  xm_charconv_LTLIBRARIES = xm_charconv.la
  ...
endif
```

### 提供额外用户参数支持

很多软件都支持用户在configure阶段，可通过`--with-xxx` `--enable-xxx`等命令行选项对软件进行模块配置或编译配置。以`--with-xxx`为例，我们需要`AC_ARG_WITH`宏：

```
AC_ARG_WITH(configfile,
  [  --with-configfile=FILE   default config file to use],
  [ ZZ_CONFIGFILE="$withval"],
  [ ZZ_CONFIGFILE="${sysconfdir}/zz.conf"]
  )

AC_SUBST(ZZ_CONFIGFILE)
```

`FILE`定义该参数的值应当是一个文件路径（`DIR`要求一个目录路径），该宏需要提供一个默认值，这个例子中是`${sysconfdir}/zz.conf`，`${sysconfdir}`引用了`${prefix}/etc`，而`$withval`从命令行中引用`--with-configfile`的值。

最后我们通过`AC_SUBST`导出一个临时变量。

上一节提到，导出的临时变量可以在Makefile.am中引用，所以我们可以在Makefile.am中通过`-D`传递给代码，从而在代码中通过宏来引用：

```
CFLAGS	+= -DCONFIGFILE=\"$(ZZ_CONFIGFILE)\" 
```

## 总结

本文以一个例子，一步步使用GNU构建系统来创建一个项目，并介绍了一些常用的检测宏。事实上，autotool还有很多宏，甚至可以自定义宏。能否合理利用autotool取决于程序员对可移植性这个问题的经验和理解。