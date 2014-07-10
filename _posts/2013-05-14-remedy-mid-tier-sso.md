---
layout: postlayout
title: Remedy Mid-tier SSO
description: 需要在Mid-tier环境和非Mid-tier环境之间进行SSO的话，可以参考本文给出的方案。与此同时，本文也针对SSO现在常用的方案进行了一些简单的整理。
thumbimg: BMCAtriumCMDB.png
categories: [BMC, Web]
tags: [BMC, Mid-Tier, Remedy, SSO]
---

`SSO`（Single-Sign-On）单点登录，是指在一个网站中登录后能够无登录的以相同的身份访问另一个站点的资源。在之前的项目中遇到了如何在有Mid-tier的系统中实现SSO，这主要分为两种情况：

- 在非Mid-tier站点中登录后，无登录进入Mid-tier站点
- 在Mid-tier站点登录后，无登录进入非Mid-tier站点

由于Mid-tier几乎是个黑盒的产品，所以要实现SSO需要一些技巧，当然，本文提到方法只是可选的方案，仅供参考，安全方面的问题也不是本文讨论的重点。

 

## 单点登录的基础问题（纯理论，可跳过）

登录本质上是服务器端保持用户会话的行为，不同的web框架有不同的实现方式，但session这个概念似乎被广为接受，是一个专用名词了。session本质上需要跟cookie一起使用，才能在服务器端标识用户。

我们自底向上考虑这个问题，如果我们的多个站点能够共享session的话那么单点登录就十分容易了，典型的方式是将session保存在共享缓存（memcache）或者数据库中，具体的细节笔者没有实现过，所以不多提了。

其次，标准的SSO方案应该是包含一个第三方认证服务器的，这个服务器负责实现验证和鉴权，其他服务器都从这个服务器上获取用户登录信息，这个方式有些像上面这种共享session的方式，但是显然这种方式灵活度更大，但是成本也比较高，是一种标准的SSO方案：图片来源（<http://www.cnblogs.com/yupeng/archive/2012/05/24/2517317.html>）



上面两种方法看起来十分出色，但是实际上难以实现，因为SSO往往是一个系统集成的问题，系统在规划阶段不太可能考虑这样的需求，如果改造系统的话成本比较高。在现实的情况下，单点登录的问题可以认为就是跨域问题：

虽然cookie不能跨域（浏览器限制），但是如果两个站点在同一个父域内的话，利用cookie可以在父域中共享的特点可以实现SSO。cookie有一个Domain属性，很多web框架默认是写入当前域的，我们可以自己重载，写入父域。比如：A.company.com和站点B.company.com，用户登录A.company.com的时候将其登录信息写入cookie，并将Domain设置为*.company.com，这样B.company.com站点就可以看到这个cookie了。

如果不在同一个父域怎么解决呢？

流行的做法是利用iframe的src或者是`<script>`的src属性，现在流行的`JSONP`就是利用`script`的`src`可以“跨域”的特性，实现的ajax跨域。在实现单点登录的时候，也可以利用这一点。关于JSONP可以查看这里：[【原创】说说JSON和JSONP，也许你会豁然开朗，含jQuery用例](http://www.cnblogs.com/dowinning/archive/2012/04/19/json-jsonp-jquery.html)。

另外，P3P在这里也扮演重要的角色。简单的说，假设你是从A.company.com访问B.company.com，也就是说Header的Referer不是当前域话，B.company.com无法在第一时间写入利用`Set Cookie`写入cookie，浏览器会认为这是不安全和不可靠的。但是利用P3P协议有时可以实现，但在浏览器兼容方面需要考虑很多。参考[PHP - 利用P3P实现跨域](http://sjolzy.cn/PHP-Using-P3P-to-achieve-cross-domain.html)

最近比较流行的`OAuth`也可以用来解决单点登录问题。

由于本文的重点不在这里，出于完整性的考虑补充到此。好，接下来进入正题。

 

## 在非Mid-tier站点中登录后，无登录进入Mid-tier站点

BMC有一份关于`Mid-tier SSO`的文档`Integrating BMC Remedy Action Request System with Single Sign-On (SSO) `。要实现这一点就需要利用Mid-tier的这个特性。由于Mid-tier是`java`开发的，所以下面的代码跟java有关。

在Mid-tier的实现中有一个接口`com.remedy.arsys.session.Authenticator`

该接口有如下方法：

{% highlight java %}

void init(Map cfg)
UserCredentials getAuthenticatedCredentials(HttpServletRequest request, HttpServletResponse response)
void destroy()

{% endhighlight %}

Mid-tier会在恰当的时候调用该接口的实现，以获取用户的登录信息`UserCredentials`，`UserCredentials`是一个保存有UserName、Password、AuthString的结构。然后，Mid-tier会将用这个把这个结构抛给AR认证，AR如何认证跟Mid-tier就没关系了。默认情况下，Mid-tier有一个`DefaultAuthenticator`的实现，这个实现就是从`HttpServletRequest`中获取特定键值对应的用户名和密码以及AuthString，然后构造`UserCredentials`并返回。这个键值可以是Form中的，也可以是QueryString中的，这也就是为什么通过在url上添加`username=&pwd=`也可以登录的原因。如果在处理中出错或者无法获得合法的`UserCredentials`，会重定向到`login`页面。

既然核心的接口暴露出来了，那么假如我们重写这个实现，就可以避免使用键值的方式来获取登录信息，比如可以从cookie、Header中获取。也就是说，如果A.company.com的cookie可以被B.company.com（Mide-tier）获取，那么通过重写这个`Authenticator`就可以获取cookie中的用户信息，从而“欺骗”Mid-tier用户已经登录了。

但是接下来的问题是，由于`UserCredentials`会被传到AR端进行身份验证，所以需要保证“伪造”的这个UserCredentials能够通过AR验证。而在AR端，进行身份验证有多种方式，比如`LDAP`集成验证，或者AR的Form验证。而cookie一般不适合保存密码，所以构造的这个UserCredentials的时候也不能获得用户的密码，一般情况下可以设置一个所有用户都能通过验证的密码，简称“默认密码”。

因此，当AR是以Form验证方式设置的时候，这种方案就不可取了。但是仍然可以通过重写AR端的AREA认证模块来实现，但是在Mid-tier端的原理是一样的。下图归纳了上述过程，并给出了一种实现：

![]({{ site.BASE_PATH }}/assets/img/2013-05-14-img2.png)

上图为我们描述了下面的场景

1. 浏览器访问Mid-tier前，设置HTTP basic Authentication，于是在访问Mid-tier时有`Authorization`头
2. Mid-tier初步处理请求
3. Mid-tier根据`config.properties`的配置加载`Authenticator`的一个自定义实现`SSOAuthenticator`
4. `SSOAuthenticator`根据`Authorization`头和`sso.properties`的配置信息，构造`UserCredentials`传给`AR`，这个`UserCredentials`用了一个固定的密码
5. 由于AR在`arconfig`中配置了用`AREA`认证，而且启用了`ARhub`模式，所以优先用一个自定义的`AREA SSO Plugin`
6. 这个`AREA SSO Plugin`根据`areasso.cfg`中的配置验证Mid-tier的IP是否是白名单，并验证密码`是否是固定密码`
7. 如果SSO认证失败，则由于hub的作用，继续通过`AREA LDAP Plugin`认证
8. AR验证这个用户是否系统用户还是访客

接下来根据上述实现给出核心代码，主要是Mid-tier端`SSOAuthenticator`的代码

{% highlight java %}

package com.remedy.arsys.sso;

import com.remedy.arsys.session.Authenticator;
import com.remedy.arsys.session.UserCredentials;
import java.io.*;
import javax.servlet.http.*;
import java.util.*;
//import java.net.*;
import com.remedy.arsys.log.Log;



public class SSOAuthenticator implements Authenticator
{

    public void init(Map cfg)
    {
    …
    }

    public void destroy()
    {
    }


    public UserCredentials getAuthenticatedCredentials(HttpServletRequest request, HttpServletResponse response) throws IOException
    {
        String username;
        // Use getRemoteuser call to get username
        if (usermethod != null && usermethod.equalsIgnoreCase("remoteuser"))
        {
            String remoteUser = request.getRemoteUser();
            if(remoteUser != null && !remoteUser.equals(""))
            {
                if(debug){
                    mtLog.fine("SSO: Remote User Name (including domain): "+ remoteUser);
                }
                // Use removedomain to parse domain name from getRemoteUser call
                if(removedomain != null && removedomain.equalsIgnoreCase("T"))
                {
                    int startpoint = remoteUser.indexOf("\\") + 1;
                    int endpoint = remoteUser.length();
                    String rUserNoDomain = remoteUser.substring(startpoint, endpoint);
                    //remoteUser = remoteUser.substring(startpoint, endpoint);
                    if(debug){
                        mtLog.fine("SSO: Remote User Name (no domain): "+ rUserNoDomain);
                    }
                    username = rUserNoDomain;
                    return new UserCredentials(getUserName(username), PASS_STRING, getAuthString(remoteUser));
                }
                else
                {
                    username = remoteUser;
                    return new UserCredentials(getUserName(username), PASS_STRING, getAuthString(remoteUser));
                }
            }
            else
            {
                mtLog.fine("SSO ERROR: RemoteUser name is null or empty. Using default login page");
                return new UserCredentials(null, null, null);
            }
        }

        else
        {
            // No setting (in sso.properties) was provided to get the username
            mtLog.fine("SSO ERROR: No valid method defined in sso.properties to get username. Using default login page");
            return new UserCredentials(null, null, null);
        }
    }
}

{% endhighlight %}

在部署的时候，将代码编译打包成jar，复制到Mid-tier的`WEB-INF\lib`目录下，修改Mid-tier的`config.properties`配置文件，将

`arsystem.authenticator=com.remedy.arsys.session.DefaultAuthenticator`改为`arsystem.authenticator=com.remedy.arsys.sso.SSOAuthenticator`，这样Mid-tier在实例化接口时能用自定义的实现

另外，Init方法传入的Map对象，是Mid-tier为这个接口实现预留的配置文件入口，可以通过配置`config.propertie`s的`arsystem.authenticator.config.file=XXX.properties`中来指定，而配置文件需要复制到`WEB-INF\classes`目录下。

上述实现在AR端也需要一个自定义的AREA Plug-in，代码可以在最后的下载链接中下载。不过需要说明的是笔者并没有仔细对这个AREA Plug-in进行测试，而且这种方案较为复杂，慎用。简单起见还是用cookie和配置所有用户为同一个form密码来做比较保险。


## 在Mid-tier站点登录后，无登录进入非Mid-tier站点

这种情况相对来说处理简单些，因为非Mid-tier站点一般是自定义开发的，所以有比较大的灵活度。我所采用的方法是这样的：

![]({{ site.BASE_PATH }}/assets/img/2013-05-14-img1.png)

- 在Mid-tier端放置一个`jsp`文件，首先通过链接引导用户访问这个jsp，这个文件通过`UserCredentials`对象获取当前登录人的`User`
{% highlight jsp %}

<%@ page import="com.remedy.arsys.session.*" %>
<%
String user = "";
Object obj = session.getAttribute("usercredentials");
if (obj == null) {
        response.sendRedirect("login.jsp"); 
}else{
        UserCredentials usercredentials = (UserCredentials)obj;
        user = usercredentials.getUser();
}
%> 

{% endhighlight %}
- 返回一段带有脚本的页面，该脚本将自动向非Mid-tier站点post数据，并能够带上UserName
- 用户获取到这个页面后，浏览器自动post非Mid-tier站点
- 非Mid-tier站点在post的数据域中检测到登录用户名，将之存在session中，表示登录
- 处理程序返回页面，此时，用户已在非Mid-tier中登录，以后的访问都将是登录后的访问

为了安全起见，可以对这个机制稍作强化：在2步中可以将用户名加密返回，加密机制可以适当的强化；在第4步中，可以重复验证一下，用户是否是合法用户。

[代码下载]({{ site.BASE_PATH }}/assets/download/sso.zip)