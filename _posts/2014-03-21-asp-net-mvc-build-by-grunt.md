---
layout: postlayout
title: grunt和使用grunt发布ASP.NET MVC项目
thumbimg: Open-Source-Software-.jpg
categories: [javascript]
tags: [grunt,node.js,asp.net mvc]
---

## Grunt 简介 ##
[Grunt](http://gruntjs.com/)是一款基于js和node.js的构建工具，由于这段时间node.js越来越火爆，grunt拥有丰富的开源社区支持，产生了很多[插件](http://gruntjs.com/plugins)。还有一些插件散落在[node社区](https://www.npmjs.org/)。**构建**是一个和宽泛的表述，传统理解就是编译、打包、复制，而今，随着技术越来越丰富，构建还包括对前端组件的预处理，比如sass、less预处理成css，css和js的压缩和合并。grunt的插件可以很好的支持这些新的构建概念，而且更为适合用开源技术堆砌的项目。
虽然Grunt更多的用于程序构建，但是本质上Grunt是一个用来解决重复劳动的任务运行工具。

## Grunt入门 ##

### 安装 ###

下载安装Node.js。[下载地址](http://nodejs.org)

检查安装和查看版本：`node -v`
	
	v0.10.25

安装grunt命令行工具`grunt-cli`，使用-g全局安装，这样可以在任何一个目录里使用了。下面这条命令会把 grunt 加入你的系统搜索路径中，所以在任何目录下都可以使用此命令。

{% highlight powershell %}
npm install -g grunt-cli
{% endhighlight %}

需要注意的是在linux或mac下有时会报没有权限的错误，这时须在前面加一个sudo

{% highlight bash %}
sudo npm install grunt-cli -g
{% endhighlight %}

查看版本：`grunt –version`

{% highlight powershell %}
grunt-cli v0.1.13
{% endhighlight %}
 
卸载。如果你在之前安装过全局的 Grunt，那么先删除它。

{% highlight powershell %}
npm uninstall -g grunt  
{% endhighlight %}

grunt-cli只是一个grunt的命令行界面，需要使用grunt及其插件，必须在项目的路径(通常是项目根目录下)下安装grunt模块本身即需要插件模块。每当`grunt`命令被执行时，它会通过nodejs的`require`命令在本地寻找已经安装的`grunt`。正因为如此，你可以在任何子目录下运行`grunt`命令。
如果`cli`找到了一个本地安装的grunt，它会加载这个 grunt 库，然后应用你在 GruntFile 中写好的配置， 然后执行相应的任务。

### 配置文件 ###

#### package.json ####
`package.json`用来保存当前目录下所安装和需要的node模块有哪些，例如：

{% highlight json %}
{
	"name": "my-project-name",
	"version": "0.1.0",
	"author": "Your Name",

	"devDependencies": {
		"grunt": "~0.4.1"
	}
}
{% endhighlight %}


可以手动创建这个文件，或者通过`npm init`命令，并按照提示完成`package.json`文件的创建。如果手动创建了`package.json`，只需通过`npm install`来下载和安装所需的模块。模块安装时，会保存在`node_modules`目录中。

如果想要在之后添加所需模块，使用下面这个命令，可以使得`package.json`文件得到同步更新

{% highlight powershell %}
npm install <module> --save-dev
{% endhighlight %}

#### Gruntfile.js ####

这个文件的地位就像`Makefile`一样，是一个指导grunt进行任务的文件，其中需要配置各个插件模块所需的参数，以及加载插件，并定义任务。更多关于Gruntfile可以参考[这里](http://javascript.ruanyifeng.com/tool/grunt.html#toc1)。建议读者对Gruntfile有个整体的理解再继续。

## 使用Grunt构建ASP.NET MVC ##

### MSbuild ###

在使用grunt来构建.NET项目之前，必须先了解`MSbuild`。MSBuild是微软的用来构建程序的工具，目前VisualStudio已经全面使用MSbuild编译项目了。MSbuild由一个msbuild工具、一组编译或构建器程序和xml文件组成。实际上VisualStudio中的`.sln`和`.csproj`等项目文件就是一个msbuild能够认识的xml（下面称为msbuild配置文件）,VisualStudio通过调用msbuild，由msbuild识别其中的参数和构建行为标识来完成构建工作。我们也可以自己通过命令行自己来调用msbuild。

在msbuild中有两个关键的概念：Task和Property。Task是msbuild能够直接作为目标来执行的入口，在执行msbuild的时候要么指向默认的Task，否则必须指定目标Task是什么。Property就是变量，就像程序中的变量可以影响程序执行一样，Property可以影响构建的行为。

VisualStudio产生msbuild配置文件其实非常复杂，表面上看只有没有多上行，但是它通过`import`，将一些预定义的配置文件导入到当前文件，使得无法全面的查看完整的配置文件，以至于无法找到关键的`Task`项。好在有一个[工具](http://www.msbuildexplorer.com/)可以用来帮助分析msbuild配置文件的结构。

另外，在调用msbuild的时候，可以通过命令行参数来覆盖默认的属性和任务，比如下面的调用表示，以"Rebuild"这个Task作为目标，并将Configuration属性设置为Debug：

{% highlight powershell %}
msbuild ConsoleApplication1.csproj /target:Rebuild /property:Configuration=Debug
{% endhighlight %}

更多关于msbuild，请参考[微软的文档](http://msdn.microsoft.com/zh-cn/library/0k6kkbsd.aspx)

### 手动使用msbuild代替VisualStudio ###

以发布到本机为例，经过笔者在VS2012下的环境中测试，使用VS在调用msbuild时使用了如下关键的参数覆盖：

1. `Configuration`：Debug或者Release，相信使用VS的同学对此不会陌生
2. `VisualStudioVersion`：VS在安装的时候会将一些公用的，VisualStudio相关的，msbuild配置文件预先存在某个版本相关的地方，在VisualStudio生成项目文件时，会包含一个`$VisualStudioVersion`变量，这个变量会与路径结合指向这些预先准备好的配置文件。在2012下，需要将这个值设置为`11.0`
3. `WarningLevel`：编译时的告警级别
4. `DeleteExistingFiles`：发布功能使用到的是否删除已存在文件的选项
5. `WebPublishMethod`：发布方式，笔者常用的是`FileSystem`，即发布到本机或远程共享的某个目录
6. `publishUrl`：如果`WebPublishMethod`是`FileSystem`，这个值表示发布的磁盘路径

关键的任务：

1. Build：即VS中针对某个项目的`编译`功能
2. Rebuild：即VS中针对某个项目的`重新编译`功能
3. WebPublish：即VS针对某个项目的`发布`功能

至此，我们已经可以使用msbuild命令行来代替VS的一些构建动作了。由于本篇的重点是grunt，读者可以参见微软的说明，自己试验一下：

> PS: MSbuild通常位于类似这样的目录下：C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe


### 使用grunt-msbuild调用msbuild ###

终于到了介绍本文的主角了：[grunt-msbuild](https://www.npmjs.org/package/grunt-msbuild)。这是一个个人开发的msbuild调用中间件。作为grunt的插件，经过笔者亲测，完全可以使用。结合其他的grunt插件，简化了笔者发布项目的过程。

你可以像下面这样将这个插件添加进项目的Gruntfile，实现自动发布：

{% highlight js %}
msbuild: {
    fontend: {			    
        src: ['Web.FontEnd/Web.FontEnd.csproj'],
        options: {
            projectConfiguration: 'Release',
            targets: ['WebPublish'],
            stdout: true,
            maxCpuCount: 4,
            buildParameters: {
                WarningLevel: 2,
				VisualStudioVersion: "11.0",
				DeleteExistingFiles: 'True',
				WebPublishMethod: 'FileSystem',
				publishUrl: [font_pwd]
            },
            verbosity: 'quiet'
        }
    }
}
{% endhighlight %}

上面的代码实现了，将`Web.FontEnd.csproj`项目在`Release`模式下通过`FileSystem`发布方式发布到`font_pwd`变量指代的目录下。
这里需要注意的是，可能需要根据自己的VS版本修改VisualStudioVersion参数，可以通过查看类似如下目录：C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v11.0来检查。`font_pwd`是一个js变量，根据需要进行调整。

Grunt的完整配置就不给出了，主要是要知道这几个关键的参数设置。

在实际使用过程中`DeleteExistingFiles`这个参数似乎不起作用，所以可能需要另外再包含清空目标文件夹的任务。下面是实际任务运行时的部分截图：

![grunt-msbuild](http://pchou.qiniudn.com/grunt-msbuild.jpg)

