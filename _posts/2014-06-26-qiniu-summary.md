---
layout: postlayout
title: 使用七牛云存储的一些经验总结
description: 近段时间将使用七牛云存储来存放用户上传的数据，客户端通过七牛的js-sdk与七牛交互，服务端C#实现了七牛相关的接口。在这过程中多多少少遇到点问题，在这里总结一下
thumbimg: Open-Source-Software-.jpg
categories: [open-source]
tags: [dot NET,backbone,cloud]
---

## 599错误处理 ##

如果在与七牛的交互中出现http状态码为599的错误，一句话，不要犹豫，直接联系[七牛技术支持](http://support.qiniu.com/)。七牛的文档也在很多地方提到这个错误，都是指导大家去联系技术支持的。笔者是在分块上传后的`mkfile`调用时出现的，联系技术支持后，说是调整了一下，让我重试。后来就好了...


## 分块上传无法从回调中获得文件的原始名 ##

简单上传采用的是multipart/form-data方式上传，七牛服务端能够从请求中获得文件的原始名，并支持使用魔法变量`$(fname)`回调业务服务器。不过当使用分片上传的时候情况有所不同。分片上传需要在最后调用`mkfile`，来将分片拼接起来。但是，`mkfile`接口支持普通的请求，并没有附带文件名，所以七牛也就无法获得文件名，此时从`$(fname)`中是取不到文件名的。这个问题我也向七牛技术支持提交了问题，得到的结果是使用自定义变量`mkfile`支持将自定义变量放在url中，回调的时候自定义变量可以传递给业务服务器。



## 慎用图片预处理 ##

七牛云支持很多对文件的预处理，其中最常用的应该就是图片预处理了，可以对图片的大小做变换等。七牛推荐使用GET的方式直接指定图片处理结果的url，像这样：

    http://qiniuphotos.qiniudn.com/gogopher.jpg?imageView2/1/w/200/h/200


处理后的图片会自动缓存，用户不用关心，只要每次访问都用这个url就行了。然而，笔者在开始的时候，为了保持与其他文件形式统一的处理方法，对图片使用了预处理（因为视频什么的只能预处理），即在token中指定了预处理。此时问题出现了，从后台的日志看到，图片的预处理通知回调竟然比正常的上传成功回调还要快！这就导致预处理结果到来之前，我的业务服务器的数据库中还没有这个图片，无法保存预处理结果了。所以**推荐还是使用url直接处理，对图片要慎用预处理**



## 视频文件无法快进播放 ##

通常用户在观看视频的时候都会根据自己的喜好，快速将视频定位到指定的时间播放。实现这个功能，需要视频本身有关键帧信息、服务端需要支持关键帧播放请求，在[这篇文章](http://pchou.info/web/2014/03/16/nginx-config-tips.html)中有详细讨论。
但是笔者发现，在使用七牛云转化后的视频，这样做是无效的。于是咨询技术支持，得到的答案是：转化的文件是具有关键帧的，但七牛使用CDN加速，所以关键帧请求需要CDN的支持，如果想要用这个功能的话，需要单独联系销售或技术支持在CDN上配置，而且时间比较长。笔者联系了销售和技术支持，说是帮我配置，但到现在还没有搞定，因为最近这个也不是特别重要，所以也没有跟下去。


## Callback校验 ##

这是可选的一个步骤。由于七牛云会在上传完成之后回调业务服务器，所以理论上说业务服务器需要校验这个回调的合理性。原理在七牛的[文档](http://developer.qiniu.com/docs/v6/api/overview/up/response/callback.html)中有，需要用到`HMAC-SHA1`签名函数。但是七牛的sdk中没有提供直接的方式来做校验，在研读文档、多次失败和查看sdk源码后，笔者终于校验成功了。关键的分歧在于，文档中的这句话：

> 获取明文：data = Request.URL.Path +”\n” +Request.Body

这里的`Request.URL.Path`是否包含Querystring?答案是包含的!下面是笔者C#服务端的校验代码，使用的是ASP.NET Web Api：

{% highlight c# %}

byte[] key = System.Text.Encoding.UTF8.GetBytes(Qiniu.Conf.Config.SECRET_KEY);
using (HMACSHA1 hmac = new HMACSHA1(key))
{
    var t = filterContext.Request.Content.ReadAsStringAsync();
    t.Wait();
    string rawbody = t.Result;
    log.DebugFormat("request's rawbody : {0}", rawbody);
    string text = filterContext.Request.RequestUri.PathAndQuery + "\n" + rawbody;
    log.DebugFormat("PathAndQuery + \\n + rawbody : {0}", text);
    byte[] digest = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(text));
    string computed = Qiniu.Util.Base64URLSafe.Encode(digest);
    log.DebugFormat("Computed hash after base64 : {0}", computed);

    IEnumerable<string> auths;
    if (filterContext.Request.Headers.TryGetValues("Authorization", out auths) && auths.Count() == 1)
    {
        string auth = auths.First();
        log.DebugFormat("Authorization in header : {0}", auth);
        if (auth.StartsWith("QBox "))
        {
            var arr = auth.Substring(5).Split(':');
            if (arr.Length == 2)
            {
                if (arr[1] != computed)
                {
                    log.ErrorFormat("Authorization failed. Since auth from header {0} not equals computed {1}", arr[1], computed);
                }
                else
                {
                    log.Debug("Authorization success.");
                    //only pass can be return
                    return;
                }
            }
            else
            {
                log.Error("Callback Authorization's format is invalid, can not find two part after split by ':'.");
            }
        }
        else
        {
            log.Error("Callback Authorization's format is invalid, missing leading 'QBox '.");
        }
    }
    else
    {
        log.Error("The request from qiniu callback is missing 'Authorization'");
    }

    filterContext.Response = filterContext.Request.CreateResponse(System.Net.HttpStatusCode.Forbidden);

}

{% endhighlight %}

如下几个注意点：

- 明文应当是请求的path+querystring部分和rawbody
- 对于.NET而言，明文和key都需要用UTF-8编码变换成字节才能进行签名。而php中的hash_hmac函数完全不用这么复杂...
- 签名的结果再用base64的url安全的方式编码，再与请求的http头部的Authorization比较

建议官方在文档中加入一些相对底层一些的编程语言的实现，php太高端了...


## js-sdk实现略显粗糙 ##

在使用过程中，我发现[官方的js-sdk](https://github.com/qiniupd/qiniu-js-sdk/)有几个我觉得不好的地方：

**不能为每个文件获取UpToken**

试想，在文件上传过程中有获取UpToken是必须的，而且UpToken又需要包含预处理指令，不同的文件显然需要不同的UpToken，而在js-sdk的实现中，只在初始化这个上传组件对象的时候请求一次上传凭证，后面所有的上传都需要使用这个预先得到的UpToken：

{% highlight js %}

uploader.bind('Init', function(up, params) {
    getUpToken();
});

{% endhighlight %}

于是我修改了这部分，在`BeforeUpload`事件中请求UpToken。建议官方考虑更改这个地方


**只能实现分片上传，无法断点续传**

js-sdk的实现在分片上传的实现上，是很简单的，不仅没有使用分片，而是分块（一块4m，调用mkblk），而且没有实现持久化ctx，或者类似的回调或接口。4m分块这个问题还可以不追究，没有实现持久化ctx就说不过去了，不持久化怎么实现断点续传撒?!就算不实现，也应该给出回调的入口，让调用者来实现持久化，而我实在无法找到这个'空子'可钻，只能直接在源码上改动了。


**没有复用流行类库的东西**

这个其实算不上问题，因为作为一个不依赖jquery的sdk，当然不能使用jquery现成的东西，比如ajax。不依赖jquery就算了，依赖plupload是几个意思嘛，还依赖全局对象...于是最后，我干脆自己将sdk改成了Backbone的类，将不要的东西统统去掉，使用jquery和underscore简化代码了...