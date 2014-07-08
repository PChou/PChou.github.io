---
layout: postlayout
title: .NET程序员的C\C++情结(1)
description: 这个系列是本人在工作或工作之余开发和学习C\C++的一些笔记。本文涉及原生windows窗口编程以及一些C++技巧
thumbimg: 157222808237574677.jpg
categories: [C-Cpp]
tags: [CPP]
---

本文为原创，首发于我的cnblog：[.NET程序员的C情结](http://www.cnblogs.com/P_Chou/archive/2012/05/24/2517255.html)
即将两年的.NET经验，一年的BMC经验，作为一个电子专业的人来说，心中仍然保留着对C和C++的情结。

最近项目空闲之余在看Windows Programming和Windows via C/C++，并且用C++为我们开发的类库制作安装程序，虽然只是简单的Windows C程序，但是那份成就感油然而生。本文记录开发这个小程序过程中的心得：

## 基于对话框的windows程序 ##

虽然说标准的Windows程序总是由用户注册的窗口类开始的，并且程序员需要自己用while来接收应用程序消息队列里的消息，并处理。但是如果想要快速开发小程序的话，可以像下面这样基于对话框的来开始程序。对话框自动建立消息循环，接收消息，我们要做的只是定义一个对话框处理函数。

{% highlight c %}

int WINAPI _tWinMain(
    HINSTANCE hInstance,
    HINSTANCE,
    PTSTR szCmdLine,
    int iCmdShow)
{
    DialogBox(hInstance...,DlgProc);
    return 0;
}
 
{% endhighlight %}

## 检查内存泄漏 ##

虽说是个小程序，但是在最后执行的时候，程序返回后，windows弹出应用程序出现错误。我猜想是内存泄漏了。实在惭愧，这么一个小程序都能搞出内存泄漏。后来在网上查到一个检查内存泄漏的方法：<http://www.cppblog.com/Lyt/archive/2009/03/22/77517.html>

{% highlight c %}

#define _CRTDBG_MAP_ALLOC
 
#include <Windows.h>
#include <tchar.h>
#include <stdio.h>
#include <stdlib.h>
#include <crtdbg.h>
 
 
int WINAPI _tWinMain(
    HINSTANCE hInstance,
    HINSTANCE,
    PTSTR szCmdLine,
    int iCmdShow)
{
    hInstance = hInstance;
    ...
    _CrtDumpMemoryLeaks();
    return 0;
}

{% endhighlight %}

这里的`_CrtDumpMemoryLeaks()`会在vs的Output窗口中给出内存泄漏的报告。

 

## 根据对话框句柄无法获取对话框的资源ID ##

虽说`GetWindowLong (hwndChild, GWL_ID)`是通过句柄得到窗口资源ID，但是当句柄是对话框句柄是是无效的。另外相关函数如下：

{% highlight c %}
id = GetDlgCtrlID (hwndChild);
 hwndChild = GetDlgItem(hwndParent, id);

{% endhighlight %}
 

## GetWindowRect(hDlg,&rect); ##

返回窗口的大小，返回的rect中的right和bottom竟然是窗口的width和height，真不知道为什么取名字要那么歧义。。`GetSystemMetrics(SM_CXFULLSCREEN)`和`GetSystemMetrics(SM_CYFULLSCREEN)`获得显示屏的像素信息。`MoveWindow(hDlg,inewLeft,inewTop,width,height,FALSE);`可以设置窗口的位置。

 

## 设置checkbox ##

{% highlight c %}
SendMessage(hwnd, BM_SETCHECK, BST_CHECKED, 0);
SendMessage(hwnd, BM_SETCHECK, BST_UNCHECKED, 0);
SendMessage(hwnd, BM_GETCHECK, 0, 0));

{% endhighlight %}


## FindFirstFile ##

FindFirstFile的目标文件可以有通配符，但是必须是全路径。还可用来判断路径是否存在（FILE_ATTRIBUTE_DIRECTORY）

{% highlight c %}
WIN32_FIND_DATA FindFileData;
HANDLE hFind = FindFirstFile(tmp,&FindFileData);
if(INVALID_HANDLE_VALUE == hFind){
 
}
else{
    FindClose(hFind);
}

{% endhighlight %}
 

## 字符串处理 ##

字符串处理函数`_tcscpy`、`_tcscat`、`_tcslen`、`_tcscmp`、`_tcsstr`
 

## 注册表操作设置环境变量 ##

如果要设置环境变量，必须直接在注册表中设置 
{% highlight c %}

RegOpenKeyEx(HKEY_LOCAL_MACHINE
                ,TEXT("SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment\\")
                ,0
                ,KEY_ALL_ACCESS
                ,&hEnvKEY)
 
 
//读取键值的时候可以先读一次，获取需要的缓冲区长度和数据类型
RegQueryValueEx(hEnvKEY,TEXT("Path"),NULL,&dwType,NULL,&cbData)
RegQueryValueEx(hEnvKEY,TEXT("Path"),NULL,&dwType,lpbOrignalEnvPath,&cbData);
 
//返回的LPBYTE其实已经是字符数组了，直接强转就可以了
TCHAR* szOrignalEnvPath = (TCHAR*)lpbOrignalEnvPath;
 
#ifdef _UNICODE,UNICODE
                LSTATUS status = RegSetValueEx(hEnvKEY,TEXT("Path"),NULL,dwType,(LPBYTE)szTargetEnvPath,_tcslen(szTargetEnvPath)*2+2);
#else
                LSTATUS status = RegSetValueEx(hEnvKEY,TEXT("Path"),NULL,dwType,(LPBYTE)szTargetEnvPath,_tcslen(szTargetEnvPath)+1);
 
//设置完后可以通过下面方法，通知系统进程，环境变量变化了。这也提示我们在编写应用程序的时候有时需要处理WM_SETTINGCHANGE的意义
SendMessage(HWND_BROADCAST, WM_SETTINGCHANGE, 0, (LPARAM)TEXT("Environment"));
{% endhighlight %}

## 获取系统变量和环境变量 ##

{% highlight c %}
//同样可以通过调用两次来获取缓冲区长度
dwSize = GetEnvironmentVariable(TEXT("HOMEDRIVE"),NULL,0);
szHomeDrive = new TCHAR[dwSize+1];
GetEnvironmentVariable(TEXT("HOMEDRIVE"),szHomeDrive,dwSize+1);
{% endhighlight %}