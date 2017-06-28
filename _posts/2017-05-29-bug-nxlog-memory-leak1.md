---
layout: postlayout
title: 【bug报告】nxlog字符集转化导致内存泄漏
categories: [Linux]
tags: [Linux]
---

nxlog号称“日志收集神器”。nxlog 2.8社区版存在一个bug，此bug会导致明显的内存泄漏。

![nxlog](http://upload-images.jianshu.io/upload_images/42733-e66027232e2ea2f3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 重现方法

采用支持自动字符集转化的扩展，对日志数据进行转化时：

```xml
<Extension charconv>
    Module xm_charcov
    AutodetectCharsets gbk, utf-8, euc-jp, utf-16, utf-32, iso8859-2
</Extension>

<Input filein>
    Module  im_file
    File  "tmp/input"
    Exec  convert_fields("AUTO", "utf-8");
</Input>

...
```

nxlog对配置了`AUTO`源字符集的日志数据进行转化时，会按照顺序从`AutodetectCharsets`罗列的候选字符集从左到右依次尝试进行转化（采用`libiconv`），直到成功。

如果源文件的字符集无法匹配第一个`AutodetectCharsets`，那么将导致内存泄漏，使用`valgrind`测试得到下面输出：

![valgrind](http://upload-images.jianshu.io/upload_images/42733-09a66d82207f4b2f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

 可以看到，在这个测试下，泄漏的字节尽然高达`150M`，如果测试继续下去，可能更高。在压力测试下，泄漏的速度甚至高达`30M/s`。而泄漏的根源是`iconv_open`没有对应的`iconv_close`。

## 问题分析

通过源码分析，可以发现在`src/modules/extension/charconv/charconv.c`中`_nx_convert`负责`iconv_open`，并调用`iconv`，但是转化失败会导致抛出异常（`long jump`）。于是`iconv_close`将被跳过：


![_nx_convert](http://upload-images.jianshu.io/upload_images/42733-cb92eefb7f8bd8d9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


## 修复方法

修复这个问题有两个方面：

1. 尽量避免使用`AUTO`源，通过观察`AUTO`的逻辑，可以发现效率比较低下，最好能够提前知道源文件的字符编码。`夏洛克采集程序`将`Mozilla Firefox`浏览器中对文档字符集自动探测算法集成到了产品中，从而尽可能避免使用`AUTO`。
2. 在`_nx_convert`方法内部`catch`住异常，并在保证关闭后rethrow。由于C语言无法模拟`finally`，如果考虑到代码的优雅性，那么应避免在`iconv_close`之前`throw`异常。