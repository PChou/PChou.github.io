---
layout: postlayout
title: MAC下安装和配置yii测试框架
categories: [open-source]
tags: [php,yii,phpunit]
---

YII集成了单元测试和功能测试，借助`phpunit`和`selenium`实现。笔者在配置过程中遇到了不少麻烦，纪录在此。

## 必要概念

### selenium

[selenium](http://www.seleniumhq.org/)是个著名的自动化测试工具，可以调起本地的浏览器来完成测试，所以可以用来自动化测试web项目。`selenium`分为服务端和客户端，服务端使用java开发，所以需要一个`jdk`，服务端在启动时，会启动一个http服务，客户端通过与服务端进行http通信，向服务端发起测试请求，服务端会自动调起浏览器完成测试。测试人员负责编写客户端脚本，支持大部分主流的编程语言，当然实际上这是由于开源社区强大的威力，为不同的语言开发了针对`selenium`的接口程序而已，服务端和客户端之间的协议笔者并没有研究，因为这并不重要。

### phpunit

[phpunit](https://phpunit.de/)是`php`语言的测试框架和工具，在进行单元测试的时候是使用它的框架，在进行功能测试的时候是使用它的工具。基于这个测试框架，有人在此基础上做了`selenium`的php接口程序，作为`phpunit`的扩展存在。

### YII框架如何集成

Yii在`phpunit`的基础上，为测试做了一些简单的封装。因此，使用Yii来进行测试的时候，需要依赖上述两者。


## 环境安装

### Firefox

`selenium-server`能够识别的浏览器并不多，似乎是IE和Firefox，所以在OSX上先安装好Firefox浏览器。安装浏览器跟一般的软件安装没有大的区别，这里不累述了。

### JDK

由于`selenium-server`是使用java开发的，我们需要先安装好`JDK`，百度搜索`JDK`下载安装即可。不再累述。

### selenium-server

首先来安装selenium的server版本。在osx下，可以使用`brew`来安装，比较方便:


{% highlight bash %}

$ brew install selenium-server-standalone

{% endhighlight%}

由于selenium-server的源在googleapis上，所以需要翻墙才能进行操作，事实上，如果不翻墙，其他步骤也比较困难。

安装完成后的提示：

{% highlight bash %}

To have launchd start selenium-server-standalone at login:
    ln -sfv /usr/local/opt/selenium-server-standalone/*.plist ~/Library/LaunchAgents
Then to load selenium-server-standalone now:
    launchctl load ~/Library/LaunchAgents/homebrew.mxcl.selenium-server-standalone.plist
Or, if you don't want/need launchctl, you can just run:
    selenium-server -p 4444

{% endhighlight%}

这里明确告诉我们通过如下命令来启动服务端

{% highlight bash %}

$ selenium-server -p 4444

{% endhighlight%}

正如所见，通常`selenium-server`侦听4444端口，如果希望修改端口，那么相应的Yii处需要修改一下配置。


## phpunit

### 弯路

个人理解，`phpunit`是一个工具和框架的集合，工具归工具，框架归框架。从官网的文档看，`phpunit`的工具部分，是以`phar`包的形式发布的，而框架部分是通过`pear`管理的。那么先来记录一下这两个概念。没有兴趣的可以跳过这节。

`phar`是一种php打包方案。也就是可以把一个`php`程序或者`php`网站打包在一起分发，甚至被作为一个功能模块调用。至于什么场合适合，以及基本的用法请看`joyqi`大神的这篇[使用phar上线你的代码包](http://segmentfault.com/a/1190000002166235)。因此，`phpunit`完全可以将工具程序打包成`phar`，执行`phar`的时候，通常需要使用php命令。

{% highlight bash %}

$ wget https://phar.phpunit.de/phpunit.phar
$ chmod +x phpunit.phar
$ sudo mv phpunit.phar /usr/local/bin/phpunit
$ phpunit --version
PHPUnit x.y.z by Sebastian Bergmann and contributors.

{% endhighlight%}

用上面的命令可以下载`phpunit`的可执行文件，可以看到这是个`phar`包

`pear`是php扩展库的体系，因为早期`php`复用比较困难。编译型语言由于语法比较紧凑和严谨，比较容易复用。而`php`由于灵活多变，复用起来学习成本比较高，于是`pear`就提出了一个编程规范和分发体系来实现`php`的功能复用，现在似乎`pear`已经被`composer`替代了(下面会说)。不过古老的东西既然已经走过弯路了不妨记下来。

在mac下可以这么安装`pear`：

{% highlight bash %}

$ wget http://pear.php.net/go-pear.phar
$ sudo php -d detect_unicode=0 go-pear.phar

{% endhighlight %}

可以看到，`go-pear`也是个phar，只不过它是一个安装`pear`的php脚本，使用php命令可以执行。安装过程中会提示是否要修改php.ini文件：

{% highlight bash %}

WARNING!  The include_path defined in the currently used php.ini does not
contain the PEAR PHP directory you just specified:
</usr/share/pear>
If the specified directory is also not in the include_path used by
your scripts, you will have problems getting any PEAR packages working.


Would you like to alter php.ini </etc/php.ini>? [Y/n] : Y

php.ini </etc/php.ini> include_path updated.

Current include path           : .:
Configured directory           : /usr/share/pear
Currently used php.ini (guess) : /etc/php.ini
Press Enter to continue: 

The 'pear' command is now at your service at /usr/bin/pear

** The 'pear' command is not currently in your PATH, so you need to
** use '/usr/bin/pear' until you have added
** '/usr/bin' to your PATH environment variable.


{% endhighlight %}

从这段提示我们可以得知：

1. pear的可执行程序安装在/usr/bin/pear
2. pear有个工作目录是/usr/share/pear，这个工作目录需要添加到php.ini中，如果让安装程序自动添加的话，将是这样的：

{% highlight bash %}

;***** Added by go-pear
include_path=".:/usr/share/pear"
;*****

{% endhighlight %}


当我们在`php`使用`require`等包含其他文件的函数时，`php`其实除了搜索当前目录，还会搜索`include_path`。这样配置就表明，通过`pear`安装的程序代码将存放在工作目录，而且php能够找到，默认在工作目录下会有一个`System.php`，所以以下代码是可以工作的：

{% highlight php %}

<?php 
	require 'System.php';
?>

{% endhighlight %}

更多关于pear的安装参见[官网](http://pear.php.net/)



### 使用composer安装

本来，phpunit可以通过pear来安装的，然而，时过境迁，在composer大行其道的时代，phpunit也[宣布全面支持composer，并且放弃pear](https://github.com/sebastianbergmann/phpunit/issues/1229#issuecomment-40899737)，原本通过pear的安装方式果然都不行了。最后逼不得已，只能上composer(话说包管理工具真是多的十个手指不够用了，将来有机会来个横向比较)。

首先安装`composer`，在翻墙状态下：

{% highlight bash %}

$ brew update
$ brew tap josegonzalez/homebrew-php
$ brew tap homebrew/versions
$ brew install php55-intl
$ brew install josegonzalez/php/composer

{% endhighlight %}

这样`composer`就装好了。

在项目的根目录下，创建一个composer.json，写入：

{% highlight bash %}

{
    "require-dev": {
        "phpunit/phpunit": "4.7.*",
        "phpunit/php-invoker": "*",
        "phpunit/dbunit": ">=1.2",
        "phpunit/phpunit-selenium": ">=1.2",
        "phpunit/phpunit-story": "*"
    }
}

{% endhighlight %}

上面的`phpunit-selenium`就是基于phpunit写的selenium客户端库，详见文后的参考资料。

然后在项目根目录下，执行

{% highlight bash %}

$ sudo composer install

{% endhighlight %}

`composer`会根据这个composer.json文件在根目录创建一个`vendor`目录，并将依赖的东西全部下载到这个目录中，其中`vendor/bin`下面有`phpunit`的可执行文件。

由于是Yii的项目，所以cd到/protected/tests目录下，执行如下命令即可启动默认的`SiteTest.php`里面的测试方法：
(注意在执行前，保持selenium-server开启状态)


{% highlight bash %}

$ ../../vendor/bin/phpunit functional/SiteTest.php 

{% endhighlight %}

会看到firefox会在执行过程中自动启动，并由如下日志输出：

{% highlight bash %}

PHPUnit 4.7.7 by Sebastian Bergmann and contributors.
Warning:	Deprecated configuration setting "selenium" used

.

Time: 11.52 seconds, Memory: 6.50Mb

OK (1 test, 1 assertion)

{% endhighlight %}

`phpunit`工具程序会自动找到`tests/phpunit.xml`这个配置文件并根据此来进行某些配置，而Yii会利用`phpunit`和`phpunit-selenium`的框架来与`selenium-server`端通信，`server`端会启动浏览器，并将日志和结果等返回给客户端。整个过程大致就是这样的。


## Yii的配置

既然我们使用Yii来开发和测试，那么就来看下Yii如何配置测试。有关测试的绝大部分代码应该按照约定放在`protected/tests目录下`。在这个目录下有一个`bootstrap.php`文件，其中包含如下代码：

{% highlight php %}

<?php

// change the following paths if necessary
$yiit=dirname(__FILE__).'/../../../yiiv1/framework/yiit.php';
$config=dirname(__FILE__).'/../config/test.php';

require_once($yiit);
require_once(dirname(__FILE__).'/WebTestCase.php');

Yii::createWebApplication($config);


{% endhighlight %}

这个代码跟主网站的入口文件`index.php`几乎完全一样，只是这里引用了`config/test.php`，查看`test.php`其实可以发现，它就是一个config文件，不同的是你可以覆盖诸如数据库连接信息这样的配置项。那么这里就暗示我们实际上需要重新建立一个新的数据库来为测试服务。

配置好数据库和数据库连接后，应该编写测试用例，在`functional`或`unit`文件夹中分别创建文件来编写测试功能测试和单元测试。那这里编写测试的时候只要测试类继承自`WebTestCase`，剩下的就是跟`phpunit`一样的写法了。上面已经提到，运行测试如下面的命令：

{% highlight bash %}

$ ../../vendor/bin/phpunit functional/SiteTest.php 

{% endhighlight %}

## 参考资料


- [phpunit官网](https://phpunit.de/index.html)
- [phpunit手册中文](https://phpunit.de/manual/current/zh_cn/phpunit-book.html#installation.optional-packages)
- [composer官网](http://www.phpcomposer.com/)
- [github:phpunit](https://github.com/sebastianbergmann/phpunit)
- [github:phpunit-selenium](https://github.com/giorgiosironi/phpunit-selenium)
- [Yii 1.1测试教程](http://www.yiichina.com/doc/guide/1.1/test.overview)

