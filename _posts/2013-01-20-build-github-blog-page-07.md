---
layout: postlayout
title: 一步步在GitHub上创建博客主页(7)--兼容Windows Writer的服务提供器
description: 本系列文章将一步步教你如何在GitHub上创建自己的博客或主页，事实上相关的文章网上有很多，这里只是把自己的经验分享给新手，方便他们逐步开始GitHub之旅。本篇将介绍如何使GitHub博客如何兼容Windows Writer。
thumbimg: 1346208288725.jpg
categories: [web-build]
tags: [github-page]
---

## 缘起

什么？GitHub主页能支持Windows Writer？开玩笑吧！你一定会这么问我。好吧，我的确是标题党了，但是本篇要介绍的不是让GitHub主页兼容我们的Windows Writer，而是自己实现一个的兼容Windows Writer的服务提供器。你可以通过编程让这个提供器支持你想要的功能，以方便我们在本机构建jekyll模板和博客结构。

我喜欢使用Windows Writer写文章，主要是因为它能够兼容很多博客系统，我可以将截图复制在Writer里面，还可以使用代码插件，当我发布博客的时候这一切都工作单非常好，图片会上传到我的博客托管网站上，并自动建立应有的图片链接。这使我节省了很多时间。然而，最近开始在Github上开自己的[博客](http://http//pchou.info)。并使用git管理静态的文件。我在本系列前面的文章中对此有很详细的描述。但是，由于Github实际上仅仅支持的是静态html，我必须在本地用windows writer完成我的文章编辑，然后将writer生成的html源代码贴到我预先准备好的_posts路径下的文件中。如果文章没有图片那还比较简单，但是如果有图片就非常麻烦了，每张图片都必须想办法从writer中复制并手动在img文件夹中创建好，这还不是最糟糕的，我还必须将source中的img标签的src手动一个个改成应该的链接。重复上面的步骤让我十分不爽。之前想过是不是通过做一个writer的插件来让这个过程更方便些，但是无果。今天偶然想到，能不能像博客园那样自己在本地实现一个writer的provider，这样writer一定会将图片和文章“上传”到我的本地web应用程序，我只要在web应用程序中把上面这些繁琐的工作自动实现就行了。

 

## XML-RPC和IMetaWeblog

在网上搜索到相关的实现方法：[给自己的Blog程序添加对Windows Live Writer的支持](http://www.cnblogs.com/Dah/archive/2007/04/02/697312.html)

writer与支持writer的提供程序之间有很多接口方式，其中一种简单的实现方式就是`XML-RPC`和`MetaWeblog`。

> 什么是[XML-RPC](http://xml-rpc.net/faq/xmlrpcnetfaq-2-5-0.html#1.1)：顾名思义吧，就是基于XML的远程调用，类似SOAP。XML-RPC的唯一优势就是”as simple as possible”。
> 什么是MetaWeblog：是一种博客系统的接口标准，容易实现。


## XML-RPC.NET

这是一个实现了XML-RPC的一个类库，并在源码中结合实现，附带了IMetaWeblog等接口的定义。[这里](http://xml-rpc.net/download.html)下载。


## 开始

交代完基本概念后，我们开始动手做起来。首先按照上面的链接下载XML-RPC.NET。我喜欢使用源代码构建应用程序，所以解压后找到源代码中的src目录，其中是一个.net 2.0的项目xmlrpc，包含了完整的源代码。构建一个solution，并添加这个项目，以及新建一个ASP.NET web应用程序，并引用项目中的xmlrpc

![]({{ site.BASE_PATH }}/assets/img/2013-01-20-build-github-blog-page-07-img0.jpeg)

不出意外，现在可以直接编译通过。找到解压包中的`interfaces`文件夹中的`MetaWeblogAPI.cs`，该文件中有`IMetaWeblog`的所有接口定义，将它添加到web应用程序中。为了能够与writer兼容，需要添加一个接口和一个结构：

{% highlight c# %}

public struct UserBlog
{
   public string url;
   public string blogid;
   public string blogName;
}
[XmlRpcMethod("blogger.getUsersBlogs")]
UserBlog[] getUsersBlogs(string appKey, string username, string password);

{% endhighlight %}

XML-RPC.NET的`XmlRpcService`类实现了`IHttpHandler`，并提供所有XML-RPC的所有底层细节的实现。所以接下来只要用一个`ashx`实现`IMetaWeblog`就可以了：

Rpc.ashx

{% highlight c# %}
[XmlRpcService(Description = "MetaWeblog XML-RPC Service")]
public class Rpc : XmlRpcService, IMetaWeblog
{
}

{% endhighlight %}

然后debug起来之后，能够看到一个方法说明列表。

再来看看接口中各个方法的定义：

- `getUsersBlogs`：在writer中设置博客的时候会被调用，必须实现，随便返回个就行。
- `editPost`：用于writer编辑已经在服务器端的文章，可选实现
- `getCategories`：获取所有的分类，在writer“设置类别”功能刷新的时候会被调用；初始化一个blog配置的时候也可能被调用，可选实现
- `getPost`：writer试图同步远程文章，以实现同步，可选实现
- `getRecentPosts`：获取最近文章，可选实现
- `newPost`：新文章创建，必须实现
- `newMediaObject`：图片通过此方法上传，最好实现，不然就没有做的意义了
接下来，我说说我的需求吧。我需要在writer中点击“发布”时，图片能够自动存到我指定的路径，文章也能自动创建在我指定的路径，文章中的图片链接能够正确的指向。

## 配置writer

![]({{ site.BASE_PATH }}/assets/img/2013-01-20-build-github-blog-page-07-img1.png)

选择其他服务

![]({{ site.BASE_PATH }}/assets/img/2013-01-20-build-github-blog-page-07-img2.png)

网址输入我们的ashx地址。用户名和密码随便啦，因为我们自己实现的，不care。`先不要点记住密码`

![]({{ site.BASE_PATH }}/assets/img/2013-01-20-build-github-blog-page-07-img3.png)

writer不能识别API类型，手动选择一下，并且再次输入地址。

这样就配置好了一个新的blog提供器，你可以自己定义一个名字。重启writer后就能在列表中看到这个提供器了。


接下来所有的细节就是实现这些接口，不难。这里我不再详细讲述。不过需要注意一个图片的问题：

writer处理图片都时候，默认会产生一个`a`和一个`img`，在上传至服务端的时候会同时上传两张图片一张用于a的链接，一张用于img，两张图片有大小的区别。如果都上传无疑是空间的浪费。所以在编辑文档的时候要注意去掉图片的默认链接，这样上传至服务端的图片就会只有一张：

![]({{ site.BASE_PATH }}/assets/img/2013-01-20-build-github-blog-page-07-img4.png)

选中图片，设置为”无连接“

如果有人需要源码，可联系我或留言。

相关文章

> [一步步在GitHub上创建博客主页(1)]({% post_url 2013-01-03-build-github-blog-page-01 %})
>
> [一步步在GitHub上创建博客主页(2)]({% post_url 2013-01-05-build-github-blog-page-02 %})
>
> [一步步在GitHub上创建博客主页(3)]({% post_url 2013-01-05-build-github-blog-page-03 %})
>
> [一步步在GitHub上创建博客主页(4)]({% post_url 2013-01-05-build-github-blog-page-04 %})
>
> [一步步在GitHub上创建博客主页(5)]({% post_url 2013-01-07-build-github-blog-page-05 %})
> 
> [一步步在GitHub上创建博客主页(6)]({% post_url 2013-01-09-build-github-blog-page-06 %})
>
> 一步步在GitHub上创建博客主页(7)
> 
> [一步步在GitHub上创建博客主页-最新版]({% post_url 2014-07-04-build-github-blog-page-08 %})