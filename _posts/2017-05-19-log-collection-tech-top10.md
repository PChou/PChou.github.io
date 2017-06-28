---
layout: postlayout
title: 日志收集十大技术细节
categories: [Linux]
tags: [Linux]
---


![](http://upload-images.jianshu.io/upload_images/42733-9a6a5ecb3df62130.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

本文探讨在大规模日志数据收集过程中，针对日志文件的处理需要注意的技术细节。

### 1. 通配符和目录递归搜索

大多数场景下，日志往往被分散在不同的目录中，比如以日期为名的目录。因此，工具必需支持对目录的递归搜索和某种模式匹配。

`POSIX`标准定义了一组用于通配的特殊符号([Pattern Matching Notation](http://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html#tag_18_13_01))：

- *：匹配一个或多个字符
- ?：匹配一个字符
- []：匹配一个在范围内的字符
- [!]：匹配一个不在范围内的字符

在`shell`中很多常见命令都可以应用这种模式匹配规则，比如：

```
find / -name "*.so"
```

作为日志收集工具，也需要能够做到这种匹配，从而对日志进行初步筛选。在Unix系统中，可以使用[fnmatch](http://www.man7.org/linux/man-pages/man3/fnmatch.3.html)函数实现。

### 2. 热日志分析

日志的其中一个特点是：往往同时只有少数的日志文件正在写入，大部分日志文件都不是正在写入状态。那么在收集日志的时候，为了降低资源的消耗，需要有一种机制来判断哪些是`“热更新”`的日志，只对热更新日志进行读取。我们采用的方式是，如果在若干次采样周期内，发现读取文件都是`EOF`，那么认为这个文件属于冷日志，并将其剔除出热日志队列，并加入一个新的日志文件作为热日志文件，循环往复。这样，大多数情况下，即保证了实时性，又降低了资源的无效损耗。

### 3. 新文件检测

对于`采集一个目录下的文件`这种需求，必需要考虑到新文件增加的情况。通常设置一个间隔时间（比如`2s`），对目录进行一个遍历，然后对比当前已经被纳管的文件，看是不是新文件。如果是新文件，应立刻加入到`热文件队列`，因为新的文件往往会立刻被写入数据。这里采用`hashmap`能提高对比性能。

### 4. 采集点保存

程序总会因为某种原因退出，但是采集任务往往并没有结束，这个时候，程序就需要有能力记录下一些信息，以便下一次继续从结束的点开始工作，以防止重复采集。针对每个文件，记录当前读取到的`offset`，并在程序退出时，及时刷写进磁盘。

### 5. log rotate的探测

`log rotate`是常用的一种日志策略。当达到`rotate`的条件时，当前正在写入的文件会重命名，并且不再写入数据；然后创建一个新的文件来继续写入。当文件数量超过一定量时，将最早产生的文件删除，这样能防止日志无限制暴涨造成文件系统空间浪费。

基于`log rotate`的特点（会产生重命名文件的情况），日志工具可以通过记录并对比`inode`来判断文件是否是重命名的。

![log rotate](http://upload-images.jianshu.io/upload_images/42733-85002c6d2d4d810e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### 6. 归档模式采集

遍历和`watch`一个拥有百万级文件个数的目录，是件十分浪费资源的事情。因为，实际情况下，这种目录的数据都是历史数据，而且不会发生变化。因此，日志工具应当能够支持我们称为`归档模式`的工作模式，这种模式下，遍历和`watch`目录将采用极低的频次，这样不会浪费资源。

### 7. 文件状态异常

文件状态异常是指下列可能的情况：

- 读取文件的权限发生变化
- 读取文件时发生某种错误

程序应避免对这种文件`“一刀切”`，因为可能过一段时间文件又变成正常状态了。所以，应当定期把有问题的文件再尝试读取，这样不会遗漏。

### 8. 字符集的探测和转化

在一些老的系统中，日志的编码格式依旧会采用本地编码。典型的是`GBK`编码的日志。在日志上报的过程中，应采用统一的编码格式。几乎所有的系统都支持`libiconv`库，这是一个可进行编码转化的常用库。

### 9. 多行合并

日志数据由应用程序生成，许多应用程序在写入日志的时候，一条逻辑日志包含多行。比如下面的`java`异常日志，打印出了堆栈的信息：

```
11 五月 2016 11:35:52,602 ERROR java.lang.IllegalArgumentException: No bean specified
	at org.apache.commons.beanutils.PropertyUtilsBean.getNestedProperty(PropertyUtilsBean.java:632)
	at org.apache.commons.beanutils.PropertyUtilsBean.getProperty(PropertyUtilsBean.java:715)
	at org.apache.commons.beanutils.PropertyUtils.getProperty(PropertyUtils.java:290)
	at lib.util.BeanUtil.getBeanProperty(BeanUtil.java:184)
	at lib.comm.services.CommWebService.getResponse(CommWebService.java:173)
	at lib.comm.services.CommWebService.SendSimplePack(CommWebService.java:307)
	at lib.comm.services.CommWebService.exchange(CommWebService.java:40)
	at lib.comm.CommunicationUtil.exchange(CommunicationUtil.java:46)
	at lib.comm.CommunicationUtil.exchangeFull(CommunicationUtil.java:105)
	at lib.helper.TradeHelper.tellerBasicInfoQuery(TradeHelper.java:1520)
```

从日志收集程序的角度，这里有很多行，但是，此时如果按行来分割是完全不行的。因此，应当提供一种可以合并多行日志为一行日志的能力。注意到这个日志以一个时间为开始（通常都是这样），那么我们就可以设置一个正则匹配规则，匹配到就认为是一个逻辑日志行的开始：

```
/\d{2} \S+ \d{4} \d{2}:\d{2}:\d{2},\d{3}/
```

这样收集上来的日志才便于处理和分析。通过灵活的设置正则，极大的降低了后端处理日志的难度。

### 10. Follow Symbolic Link

采集器能够支持一个开关，用于设置是否对链接进行跟踪，即读取链接实际指向的文件或目录。


其实，此外还有很多亮点功能值得探讨，比如：

- 对历史的归档日志(tar包)，直接读取归档压缩文件，从而避免先解压再读取的麻烦。
- 在通配模式下，排除(exclude)或包含(include)某些特殊日志