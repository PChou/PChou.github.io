---
layout: postlayout
title: MAC下安装和配置memcache
categories: [open-source]
tags: [php,memcache,yii]
---

本文记录了在MAC的OSX下为php安装和配置`memcache`的方法

OSX一般自带apache和php，不需要安装

## 安装服务端

`memcache`是项目名，而在服务端的驻留进程叫`memcached`(linux的守护进程一般都是在后面加个`d`)。在OSX下使用`brew`可以快速安装`memcache`：

{% highlight bash %}

$ sudo brew install memcached

{% endhighlight%}

`memcache`的依赖：`openssl`和`libevent`会自动下载并安装。

安装完成后，使用如下命令启动：

{% highlight bash %}

$ sudo memcached -m 32 -p 11211 -d

{% endhighlight%}


## 安装php扩展

使用`php`操作`memcache`前，需要安装`php`的扩展，php的扩展有两个可以选择`memcache`和`memcached`，这里就安装比较经典的前者。从[这里](http://pecl.php.net/package/memcache)选择一个版本下载源码压缩包，解压，进入到源码目录后执行：

{% highlight bash %}

$ sudo phpize

{% endhighlight%}

`phpize`是帮助用来在已编译好的php外，编译php扩展用的脚本，用来生成`configure`、`make`等文件。有时执行这个命令会报错：

{% highlight bash %}

Cannot find autoconf. Please check your autoconf installation and the
$PHP_AUTOCONF environment variable. Then, rerun this script.

{% endhighlight%}

缺少依赖，那就安装咯，还是使用`brew`：

{% highlight bash %}

$ sudo brew install autoconf

{% endhighlight%}

`phpize`完成后，依次实行如下命令实现编译和安装：

{% highlight bash %}

$ sudo ./configure
$ sudo make
$ sudo make install

{% endhighlight%}

编译好的`memcache.so`一般被安装到如下目录：

{% highlight bash %}

Installing shared extensions: /usr/lib/php/extensions/no-debug-non-zts-xxxxxx/

{% endhighlight%}

这样就可以在`php.ini`中配置这个扩展了：

extension=/usr/lib/php/extensions/no-debug-non-zts-xxxxxx/memcache.so

打开`phpinfo()`页面，查看`memcache`是否已经加载成功：

![](http://pchou.qiniudn.com/osx-php-memcache-yii-00.jpg)


## 设置yii

这样其实已经可以在`php`中直接使用`memcache`了，这里就不累述了，如果在yii中使用，则需要添加一个组件：

{% highlight php %}

'components'=>array(

    'cache'=>array(
        'class'=>'CMemCache',
        'servers'=>array(
            array(
                'host'=>'127.0.0.1',
                'port'=>11211
            )
        ),
    ),
...

{% endhighlight%}

关于更多的yii配置请参阅其文档。最后，在yii中使用`memcache`：

{% highlight php %}

Yii::app()->cache->set('key1','value1');
Yii::app()->cache->get('key1');

{% endhighlight%}


参考资料：

[完善php环境：mac中配置memcache超详细攻略（区分memcache系统中的概念）](http://www.pizida.com/memcached-install.html)

[Linux下的Memcache安装](http://www.ccvita.com/257.html)

[为Mac OS X的PHP配置Memcache](http://www.linuxidc.com/Linux/2012-02/54016.htm)

[在yii中使用memcache](http://www.tuicool.com/articles/3UrAVb)
