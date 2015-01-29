---
layout: postlayout
title: 使用SAE和Gitcafe开发网站应用
categories: [web]
tags: [Web,sae,Git]
---

在PaaS领域目前看来新浪云走的比较早，也比较成熟。相比IaaS，PaaS更能为企业或个人带来成本上的节约。本文以php为例，记录了如何在新浪云上注册创建自己的web项目，如何在本地构建模拟环境，并使用Gitcafe的自动部署功能，使得只需要进行一次`git push`即可将代码发布到新浪云上。不了解的朋友可以参考。

## 创建应用

先是各种注册。新浪云需要使用新浪微博的帐号才能登录和使用。

由于新浪云属于PaaS(即提供软件运行环境，而不是虚拟主机或者空间)，收费模式是根据访问量，按量收费的，所以我们无需关注服务器的任何指标，我们要做的只是创建一个应用。目前，新浪云需要进行实名认证才能创建2个以上的应用，所以推荐进行实名认证。

创建应用的界面如下：

![](http://pchou.qiniudn.com/sae-gitcafe-01.png)

可以看到，我们的应用将被host在`sinaapp.com`这个域名下，我们能够设置的子域名(App name)显然是全局唯一的，先到先得。除了应用的基本信息外，还需要选择应用使用的编程语言、框架、模板等。PHP语言的框架和模板十分丰富，而Python和Java则没有什么可用的框架或者模板。我们这里使用PHP空应用，创建的的应用名假设为`testapp`，下面会用到。

创建好应用之后，需要配置应用所使用的各种软件或平台服务，几个比较基本的配置如下：

- 在`应用管理`-`代码管理`中，创建一个版本，这个版本号建议填`1`
- 在`服务管理`-`MySQL`中，开启MySQL的功能。除非你的应用不需要数据库支持，一般MySQL是肯定要开的。管理MySQL使用的是phpmyadmin。

默认情况下，在代码管理中，可以将代码打包上传到应用，或者使用SVN提交，关于SVN参见代码管理中的说明。我们的重点是使用Git进行提交。


## Gitcafe上创建代码仓库

### 注册

为了使用Git提交代码，我们注册使用[Gitcafe](http://gitcafe.com/)。因为Gitcafe可以设置自动将代码推送到新浪云上。

> GitCafe是一个跟Github十分相似的代码托管平台，本人体验下来感觉还可以，除了界面绿的我扎眼外...

注册好之后，为了方便进行git提交可以配置一下公钥。找到你个人电脑如下路径的文件：

{% highlight bash %}
cd ~/.ssh/id_rsa.pub
{% endhighlight %}

将其中的内容复制粘贴到Gitcafe网站的SSH公钥管理处，这样以后在提交代码的时候就不需要输入用户名和密码了。

### 创建仓库

我们需要创建一个仓库，这更github没有什么区别，唯一的重点在于设置自动部署到SAE

![](http://pchou.qiniudn.com/sae-gitcafe-02.jpg)

第一次使用这个功能可能需要你OAuth验证一下，这很简单。然后Gitcafe就可以fetch到你在新浪上的创建的应用和相应的版本了。选好保存即可。

> 目前Gitcafe对新浪的授权没有做自动刷新，这也许是新浪的Policy，这样会导致几天以后，这个授权会过期，届时可能需要重新绑定一下。希望Gitcafe能够改善一下。

创建好应用后，可以根据提示在本地初始化应用并提交初始化到Gitcafe。不过这里，为了给后面本地模拟SAE环境埋下伏笔，我对命令稍作改变：

首先在你本地合适的地方创建一个文件夹专门用来存放SAE的应用代码，比如`sae`：

{% highlight bash %}

mkdir sae

{% endhighlight %}

然后使用如下命令：

{% highlight bash %}

cd sae
mkdir testapp
cd testapp
mkdir 1
cd 1
git init
touch README.md
git add README.md
git commit -m 'first commit'
git remote add origin ...
git push -u origin master

{% endhighlight %}

上面的命令在远程仓库地址的地方留了`...`，你需要自己填写，这取决于你的远程仓库地址。另外值得注意的是，需要创建一个以app名命名的文件夹，而且这个文件夹下需要有一个`1`的文件夹，这里的`1`代表app的版本号，代码部分是放在`1`这个文件夹下的。

如果上面的步骤没有问题的话，此时由于我们创建了`README.md`，所以这个文件会被自动同步到新浪云上。


## 配置本地环境

接下来我们需要配置一个本地执行环境，以模拟SAE的运行环境，从而调试代码。从[这里](http://sae.sina.com.cn/doc/download.html#php-download)下载最新的模拟环境，这里以PHP环境为例

下载解压后，可以发现，模拟环境自带apache、php、redis等软件，我们需要配置`sae.conf`文件，下面是这个文件重要配置项的说明：

- `DocumentRoot` sae应用的根路径，相当于我们上面创建的`sae`文件夹，模拟环境每次都是从这个文件夹下的文件夹来判断有哪些应用
- `http_port` 模拟环境启动后`apache`所使用的http端口
- `mysql_*` 模拟环境并没有自带mysql，需要使用你本地或者远程的mysql，所以需要在这里配置这些参数

配置好这些后，用管理员身份启动`init.cmd`

![](http://pchou.qiniudn.com/sae-gitcafe-03.jpg)

如果需要修改php的配置的话，可能需要修改`php.sae`这个文件。这个文件实际上就是一个php的配置文件，模拟器每次启动的时候，都会把`php.sae`的内容复制到`php.ini`中。不过这里可能有一个bug，对于`php.sae`中的配置项`disable_functions`不能正确的复制到`php.ini`中，导致无法正常使用模拟环境，不知道目前修复了没有。我的解决办法是在`php.sae`中把`disable_functions`的值留空。

模拟环境启动后，可以在本地通过`http://应用名.sinaapp.com:端口`的形式来访问应用，比如：`http://testapp.sinaapp.com:8081`

模拟环境会在代码目录下创建`config.yaml`或者`.appconfig`，这两个文件是不能通过代码包的方式上传到SAE的，否则会出错。所以，我们需要在`.gitignore`中忽略这两个文件，让它们不被提交到Gitcafe，于是就不会被传到SAE。


如果将来有第二个应用的话，只需要在`sae`目录下创建相应的app名字命名的文件夹和版本文件夹即可，模拟器会自动识别它们。当然你也可以使用模拟器的相关命令完整对应用的管理操作。详情请参考[相关工具 - SAE文档中心](http://sae.sina.com.cn/doc/php/tools.html)

## 使用mysql

为了在模拟环境中使用mysql，除了上面提到的基本配置外，还有两点需要注意：

1. mysql数据库名需要是`app_`+应用名的形式，比如应用名为`testapp`，那么对应的mysql数据库名必须是`app_testapp`
2. 在php中访问数据库需要使用SAE定义好的常量，在实际的环境中也是这样的。

下面是一个使用`pdo`连接数据库的代码：

{% highlight php5 %}

$dbh = 'mysql:host=' . SAE_MYSQL_HOST_M . ';port=' . SAE_MYSQL_PORT . ';dbname=' . SAE_MYSQL_DB;
$ops = array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8");
$ops = array();
return new PDO($dbh, SAE_MYSQL_USER, SAE_MYSQL_PASS, $ops);

{% endhighlight %}