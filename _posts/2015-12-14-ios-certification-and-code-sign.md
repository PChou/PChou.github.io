---
layout: postlayout
title: 漫谈iOS程序的证书和签名机制
categories: [IOS]
tags: [ios]
---

接触iOS开发半年，曾经也被这个主题坑的摸不着头脑，也在淘宝上买过企业证书签名这些服务，有大神都做了一个全自动的发布打包（不过此大神现在不卖企业证书了），甚是羡慕和崇拜。于是，花了一点时间去研究了一下iOS这套证书和签名机制，并撰文分享给需要的朋友。由于本人才疏学浅，多有遗漏或错误之处，还请大神多多指教。

## 非对称加密和摘要

### 非对称加密的特性和用法

非对称加密算法可能是世界上最重要的算法，它是当今电子商务等领域的基石。简而言之，非对称加密就是指加密密钥和解密密钥是不同的，而且加密密钥和解密密钥是成对出现。非对称加密又叫公钥加密，也就是说成对的密钥，其中一个是对外公开的，所有人都可以获得，称为公钥，而与之相对应的称为私钥，只有这对密钥的生成者才能拥有。公私钥具有以下重要特性：

- 对于一个私钥，有且只有一个与之对应的公钥。生成者负责生成私钥和公钥，并保存私钥，公开公钥
- 公钥是公开的，但不可能通过公钥反推出私钥，或者说极难反推，只能穷举，所以只要密钥足够长度，要通过穷举而得到私钥，几乎是不可能的
- 通过私钥加密的密文只能通过公钥解密，公钥加密的密文只有通过私钥解密

由于上述特性，非对称加密具有以下的典型用法：

- 对信息保密，防止中间人攻击：将明文通过接收人的公钥加密，传输给接收人，因为只有接收人拥有对应的私钥，别人不可能拥有或者不可能通过公钥推算出私钥，所以传输过程中无法被中间人截获。只有拥有私钥的接收人才能阅读。此用法通常用于交换`对称密钥`。
- 身份验证和防止篡改：权限狗用自己的私钥加密一段授权明文，并将授权明文和加密后的密文，以及公钥一并发送出来，接收方只需要通过公钥将密文解密后与授权明文对比是否一致，就可以判断明文在中途是否被篡改过。此方法用于`数字签名`。

著名的`RSA`算法就是非对称加密算法，`RSA`以三个发明人的首字母命名。

非对称加密算法如此强大可靠，却有一个弊端，就是加解密比较耗时。因此，在实际使用中，往往与对称加密和摘要算法结合使用。对称加密很好理解，此处略过1w字。我们再来看一下摘要算法。

### 摘要算法

另一个神奇的算法就是摘要算法。摘要算法是指，可以将任意长度的文本，通过一个算法，得到一个固定长度的文本。这里文本不一定只是文本，可以是字节数据。所以摘要算法试图将世间万物，变成一个固定长度的东西。摘要算法具有以下重要特性：

- 只要源文本不同，计算得到的结果，必然不同
- 无法从结果反推出源（那是当然的，不然就能量不守恒了）

典型的摘要算法，比如大名鼎鼎的`MD5`和`SHA`。摘要算法主要用于比对信息源是否一致，因为只要源发生变化，得到的摘要必然不同；而且通常结果要比源短很多，所以称为“摘要”。

## 数字签名

理解了非对称加密和摘要算法，来看一下数字签名。实际上数字签名就是两者结合。假设，我们有一段授权文本，需要发布，为了防止中途篡改文本内容，保证文本的完整性，以及文本是由指定的权限狗发的。首先，先将文本内容通过摘要算法，得到摘要，再用权限狗的私钥对摘要进行加密得到密文，将源文本、密文、和私钥对应的公钥一并发布即可。那么如何验证呢？

验证方首先查看公钥是否是权限狗的，然后用公钥对密文进行解密得到摘要，将文本用同样的摘要算法得到摘要，两个摘要进行比对，如果相等那么一切正常。这个过程只要有一步出问题就视为无效。

![](http://pchou.qiniudn.com/数字签名.jpg)

数字签名可以快速验证文本的完整性和合法性，已广泛应用于各个领域。理解了数字签名以后，我们进一步来看什么是数字证书。

## 数字证书

### 现实生活的证书

证书顾名思义，就是权限机构的颁发的证明。比如英语6级证书，就是教育部门颁发给通过了6级考核的个人的证明，证明这个人的英语能力。我们来看一下这个证书的组成：

- 被证明人：老王
- 内容：通过了英语六级
- 盖章：教育部门的公章或钢印

于是老王就可以用这张证书找工作了，用人单位会通过查看证书的各项内容（尤其是公章），来验证证书的合法性和老王的能力。

在现实生活中，经常有假的6级证书，这些假证书最重要的就是有一个假公章。现实生活中使用法律法规来约束私刻假公章的行为，但是用人单位可能不能十分准确的判断公章是真是假。而这些问题在数字签名面前都可以用数学的方法严谨的解决。

### 数字证书：用数字签名实现的证书

实际上，数字证书就是通过数字签名实现的数字化的证书。在一般的证书组成部分中，还加入了其他的信息，比如证书有效期（好比驾驶证初次申领后6年有效），过了有效期，需要重新签发（驾驶证6年有效后需重新申领）。

跟现实生活中的签发机构一样，数字证书的签发机构也有若干，并有不同的用处。比如苹果公司就可以签发跟苹果公司有关的证书，而跟web访问有关的证书则是又几家公认的机构进行签发。这些签发机构称为`CA`（Certificate Authority）。

对于被签发人，通常都是企业或开发者。比如需要搭建基于SSL的网站，那么需要从几家国际公认的CA去申请证书；再比如需要开发iOS的应用程序，需要从苹果公司获得相关的证书。这些申请通常是企业或者开发者个人提交给CA的。当然申请所需要的材料、资质和费用都各不相同，是由这些CA制定的，比如苹果要求$99或者$299的费用。

之所以要申请证书，当然是为了被验证。英语6级证书的验证方一般是用人单位；web应用相关的SSL证书的验证方通常是浏览器；iOS各种证书的验证方是iOS设备。我们之所以必须从CA处申请证书，就是因为CA已经将整个验证过程规定好了。对于iOS，iOS系统已经将这个验证过程固化在系统中了，除非越狱，否则无法绕过。

### 证书的授权链

数字证书可能还包括证书链信息。举个例子：如果你要申请休假1周，需要你的上司审批，你的上司需要他的上司同意，最终需要大老板同意，那么这一层层的授权，形成了一个授权链，大老板是授权链的根(root)，中间这些环节分别是被更接近root的人授权的。

我们从苹果`MC`（Member Center）中获得的证书实际也是一个包含有证书链的证书，其中的根是苹果的CA。我们获得的证书实际上是在告诉iOS设备：`我们的证书是被苹果CA签过名的合法的证书`。而iOS设备在执行app前，首先要先验证CA的签名是否合法，然后再通过证书中我们的公钥验证程序是否的确是我们发布的，且中途没有对程序进行过篡改。

## iOS证书申请和签名打包流程图

在继续下去之前，先来看一张图。

![](http://pchou.qiniudn.com/iOS证书和校验.png)

这张图阐述了，开发iOS应用程序时，从申请证书，到打包的大致过程。接下来我将对图中的每一个环节进行分析。

## 证书申请

开发iOS程序，必然要进行的工作就是成为开发者，并申请相关的证书，否则你的程序只能在模拟器上运行，无法在真机上调试，更不要说上架了。那么在申请证书之前需要：

1. 支付$99或$299成为苹果开发者，并每年续费。这一步是苹果的强制规定，相当于霸王条款，没钱玩尼玛！大家都知道$99针对个人和小企业，$299针对大企业，这么分没错，不过你需要知道的是，两种金额的本质区别在于你可以获得的证书类型不同，$99当然比$299的少一些。
2. 安装苹果开发者根证书，此证书实际上是我们从苹果MC中申请的所有证书的“根证书”，安装这个证书意味着我们的开发工具对此CA的信任，从而可以用此CA签发的其他证书进行签名和打包。一般而言，如果安装了Xcode，那么这个证书是自动安装在Key Chain中了。证书如下图

![](http://pchou.qiniudn.com/AWDRCA.png)

然后，我们就开始按照很多图文并茂的教程开始申请证书，各种操作。这里由于是讲原理，不展开这部分。我们来看每一步到底意味着什么。

### 什么是CertificateSigningRequest.certSigningRequest

我们需要生成一个`CertificateSigningRequest.certSigningRequest`文件来提交到MC中，从而获取某种证书。那么这个文件到底是什么呢?从上面的流程图中大家可以看到，这个文件包含两部分内容[(Certificate signing request)](https://en.wikipedia.org/wiki/Certificate_signing_request)：

1. 申请者信息，此信息是用申请者的`私钥`加密的
2. 申请者公钥，此信息是申请者使用的`私钥`对应的公钥
3. 摘要算法和公钥加密算法

我们可以用openssl来解析文件中的内容一窥究竟：

{% highlight bash %}

    openssl asn1parse -i -in CertificateSigningRequest.certSigningRequest
  
        0:d=0  hl=4 l= 649 cons: SEQUENCE          
        4:d=1  hl=4 l= 369 cons:  SEQUENCE          
        8:d=2  hl=2 l=   1 prim:   INTEGER           :00
       11:d=2  hl=2 l=  68 cons:   SEQUENCE          
       13:d=3  hl=2 l=  36 cons:    SET               
       15:d=4  hl=2 l=  34 cons:     SEQUENCE          
       17:d=5  hl=2 l=   9 prim:      OBJECT            :emailAddress
       28:d=5  hl=2 l=  21 prim:      IA5STRING         :zhoupingtkbjb@163.com
       51:d=3  hl=2 l=  15 cons:    SET               
       53:d=4  hl=2 l=  13 cons:     SEQUENCE          
       55:d=5  hl=2 l=   3 prim:      OBJECT            :commonName
       60:d=5  hl=2 l=   6 prim:      UTF8STRING        :Parker
       68:d=3  hl=2 l=  11 cons:    SET               
       70:d=4  hl=2 l=   9 cons:     SEQUENCE          
       72:d=5  hl=2 l=   3 prim:      OBJECT            :countryName
       77:d=5  hl=2 l=   2 prim:      PRINTABLESTRING   :CN
       81:d=2  hl=4 l= 290 cons:   SEQUENCE          
       85:d=3  hl=2 l=  13 cons:    SEQUENCE          
       87:d=4  hl=2 l=   9 prim:     OBJECT            :rsaEncryption
       98:d=4  hl=2 l=   0 prim:     NULL              
      100:d=3  hl=4 l= 271 prim:    BIT STRING        
      375:d=2  hl=2 l=   0 cons:   cont [ 0 ]        
      377:d=1  hl=2 l=  13 cons:  SEQUENCE          
      379:d=2  hl=2 l=   9 prim:   OBJECT            :sha1WithRSAEncryption
      390:d=2  hl=2 l=   0 prim:   NULL              
      392:d=1  hl=4 l= 257 prim:  BIT STRING        

{% endhighlight %}

可以看到文件包含了我的信息，并标明使用了`sha1`摘要算法和`RSA`公钥加密算法。苹果的MC在拿到这个后，将这个信息记录下来，并签发出相关的证书。这里，苹果实际无需验证我的信息，因为如果我不交钱就没办法上传这个文件，也就得不到证书。

### 从MC中申请到的证书究竟是什么

苹果取出`CertificateSigningRequest.certSigningRequest`中的公钥，根本不管我的其他信息，然后将`我的MC账号信息`和我提交的公钥封装在证书中，并进行数字签名。以开发证书为例，我们用openssl来看一下证书的内容：

{% highlight bash %}

    openssl x509 -inform der -in ios_development.cer -noout -text

    Certificate:
        Data:
            Version: 3 (0x2)
            Serial Number:
                65:97:cd:73:6f:19:37:c2
            Signature Algorithm: sha256WithRSAEncryption
            Issuer: C=US, O=Apple Inc., OU=Apple Worldwide Developer Relations, CN=Apple Worldwide Developer Relations Certification Authority
            Validity
                Not Before: Jul 29 07:36:28 2015 GMT
                Not After : Jul 28 07:36:28 2016 GMT
            Subject: UID=8VPWB57FDW, CN=iPhone Developer: Liang Ding (2U967A2YJ6), OU=7XPNRZE9TC, O=Liang Ding, C=US
            Subject Public Key Info:
                Public Key Algorithm: rsaEncryption
                RSA Public Key: (2048 bit)
                    Modulus (2048 bit):
                        00:ab:43:a4:57:32:57:30:81:89:eb:b4:5c:b6:88:
                        7f:4f:59:3a:9e:f6:14:50:2c:5c:14:6d:01:58:bd:
                        d7:2b:a6:66:71:f7:d9:da:58:a2:e8:4c:d5:a9:87:
                        20:5b:b7:4c:58:29:3c:b3:48:de:7f:ad:3f:98:cc:
                        9d:b3:07:2f:93:4a:3a:e5:32:e2:fc:59:30:1e:ee:
                        65:11:c3:88:ea:7a:54:d8:60:56:d1:fa:69:06:40:
                        dd:72:1d:7f:d9:14:85:bf:7a:b0:a3:34:a0:ac:c1:
                        dc:a9:48:3c:9c:43:c8:e4:fd:02:eb:fe:d2:a7:ce:
                        2e:e4:9a:51:20:0b:5b:e5:5a:d4:04:9e:a4:52:8d:
                        c2:1e:1f:50:80:fb:ea:c1:e4:bb:b4:ec:35:fd:96:
                        6a:86:0a:62:fa:d2:5a:8b:34:1b:f2:c5:c8:c9:2c:
                        85:d1:4d:8c:cb:91:be:db:92:f0:88:37:7a:6d:8d:
                        ef:c6:e1:47:5c:e5:ca:e2:5a:47:14:5d:2f:5b:2e:
                        d4:df:61:d9:99:e2:3e:6b:24:b2:aa:36:b3:af:e6:
                        a8:a8:28:a7:8a:73:aa:68:a9:71:ac:81:a8:20:98:
                        bb:3e:76:e2:09:19:41:45:d7:9a:68:1b:7c:1d:f5:
                        b2:0b:36:ac:f0:4b:fc:0a:f1:3c:de:96:a0:10:14:
                        aa:79
                    Exponent: 65537 (0x10001)
            X509v3 extensions:
                Authority Information Access: 
                    OCSP - URI:http://ocsp.apple.com/ocsp03-wwdr01
    
                X509v3 Subject Key Identifier: 
                    C7:AB:35:54:A3:7B:96:2A:67:55:B8:2F:B6:82:4B:B8:F0:49:0F:EB
                X509v3 Basic Constraints: critical
                    CA:FALSE
                X509v3 Authority Key Identifier: 
                    keyid:88:27:17:09:A9:B6:18:60:8B:EC:EB:BA:F6:47:59:C5:52:54:A3:B7
    
                X509v3 Certificate Policies: 
                    Policy: 1.2.840.113635.100.5.1
                      User Notice:
                        Explicit Text: Reliance on this certificate by any party assumes acceptance of the then applicable standard terms and conditions of use, certificate policy and certification practice statements.
                      CPS: http://www.apple.com/certificateauthority/
    
                X509v3 Key Usage: critical
                    Digital Signature
                X509v3 Extended Key Usage: critical
                    Code Signing
                1.2.840.113635.100.6.1.2: critical
                    ..
        Signature Algorithm: sha256WithRSAEncryption
            80:99:47:27:ae:e5:1e:89:1e:c2:ec:52:d7:c8:8b:df:86:25:
            a9:cb:b2:f2:01:6c:5e:a0:55:6c:ad:1d:bd:3b:1c:ce:b4:53:
            4d:03:d0:98:f6:f7:0e:24:2b:c5:cb:5e:71:88:bd:53:46:a8:
            c7:e0:d9:f4:81:47:98:a5:91:5c:04:f6:df:b9:c2:06:64:a4:
            73:3d:0b:78:0d:8b:11:29:d3:3a:ea:88:b7:97:a9:2a:e0:74:
            a9:0b:1f:91:0f:47:78:be:90:46:21:10:16:a5:4b:0d:a6:33:
            7e:0c:18:95:ba:7c:8e:b5:ed:86:5f:73:1b:cb:9e:ae:c8:96:
            9d:4f:12:0a:9b:43:cc:58:ca:f3:d5:f0:6e:19:a6:e9:bf:9d:
            95:34:39:4d:86:34:46:7e:11:e7:7c:9f:7b:1d:b1:9c:7d:1b:
            39:85:5f:77:b0:89:d4:bb:55:c3:a9:24:af:54:a6:42:47:bf:
            7c:d3:b0:6f:af:6a:2e:c6:00:07:1c:de:6b:aa:5b:a6:23:2b:
            fb:cd:2b:eb:04:fb:19:3e:1d:9d:ca:ae:d4:20:f1:4d:63:10:
            44:80:d1:cf:fd:82:51:d2:cd:77:cb:46:1e:bd:63:df:4f:82:
            c7:5d:b3:61:45:03:6b:84:35:17:4b:c6:16:f0:47:1f:7b:26:
            62:e3:d1:1b

{% endhighlight %}

`Data`域即为证书的实际内容，与`Data`域平级的`Signature Algorithm`实际就是苹果的CA的公钥，而摘要的签名应该没有显示出来。Data域下一级的内容就是我的苹果账号信息，其中最为重要的是我的公钥，这个公钥与我本机的私钥是对应的。当我们双击安装完证书后，`KeyChain会自动将这对密钥关联起来`，所以在KeyChain中可以看到类似的效果：

![](http://img.objccn.io/issue-17/iphone-developer-keychain.png)

后续在程序上真机的过程中，会使用这个私钥，对代码进行签名，而公钥会附带在`mobileprovision`文件中，打包进app。

> 注意这里，公钥是附带在mobileprovision中的，并不是直接随代码打包的，所以，笔者认为，本质上在电脑上安装证书是没有实际用处的，因为mobileprovision是MC为我们生成的。之所以需要安装证书，是因为签名程序codesign或者Xcode，只能让我们选择“用哪个证书签名”，因为我们所选的证书还是会对应到私钥，真正用于签名的是私钥。mobileprovision和代码签名在后面详细说明。

所以，`就算你有证书，但是如果没有对应的私钥是没有用的`。那么有人要问了，既然私钥只有某台电脑生成的，那么团队开发怎么展开呢？

### 团队开发

于是，大家会去搜索“iOS证书共享”之类的关键字，给出的解决方案就是“私钥导出”。没错，既然问题的关键是私钥，我们共享私钥不就行了，将最初申请证书的机器的私钥导出成.p12文件，并让其他机器导入，同时其他机器也应该安装下载下来的证书。

当然还有一种方案，就是每台机器都各自去申请各自的证书。然而这样做可能到后面比较混乱。

由于iOS证书有多种类型，用于不同的用处，所以我们可能后续还会去MC上申请别的证书。所以强烈建议`CertificateSigningRequest.certSigningRequest`需要保留，因为如果再次生成`CertificateSigningRequest.certSigningRequest`文件，可能就是对应另一个私钥了！还需要在共享一次私钥，会比较麻烦。

### iOS证书类型

当我们在MC的申请证书界面点击新建证书时，需要选择一种证书。每种证书有不同的用处，就好比你要生孩子，那么得有准生证；你要驾驶机动车，需要驾驶证；你要出国，需要护照...那么在iOS开发中涉及的证书究竟有什么区别呢？本质上他们的区别只是用途，从证书结构上讲都是同一个，只要你不改变申请用的`CertificateSigningRequest.certSigningRequest`文件，这些证书中包含的公钥和对应的私钥都是同一个。接下来罗列几个常用的证书类型：

1. iOS App Development。开发、真机调试用
2. Apple Push Notification service SSL (Sandbox)。开发阶段使用苹果的推送服务
3. App Store and Ad Hoc。上架和AdHoc方式发布时用
4. Apple Push Notification service SSL (Production)。上架后使用苹果推送服务
5. In-House。企业版发布，需$299才能拥有，还需邓氏编码

其他不常用的就不列举了。关于`AdHoc`方式，在后面的`mobileprovision`中再说。

## iOS授权和描述文件

但是光有证书并不够解决苹果的“后顾之忧”，证书能够证明app的所属以及app的完整性，保证app本身是安全的。但是，却不能细化到app所使用的某些服务是被苹果认可的，比如APN推送服务。而且证书无法限制调试版的app的装机规模。于是，苹果想出了“花式作死”的`mobileprovision`。你可以使用如下命令查看一个`mobileprovision`：

    security cms -D -i embedded.mobileprovision

`mobileprovision`文件包含：

1. AppId。每个app必须在MC中创建一个对应的AppId。规则不累述了。
2. 使用哪些证书。上面说了，不同类型的证书就代表了不同的发布方式，还包括一些功能的能否使用（比如APN）
3. 功能授权列表
4. 可安装的设备列表。对于AdHoc方式发布的app或者真机调试时，会有一个列表，这个列表里面是iOS设备的UDID，每台iOS设备出厂的UDID都不同，所以可以用来标识设备。可通过iTunes连接设备，或者[http://fir.im/udid](http://fir.im/udid)这里获取
5. 苹果的签名！

注意`5`，`这里的签名是苹果签的`，跟我们的私钥没有关系。也就是说`mobileprovision`文件是苹果签名的，我们除了从MC中获取，别无他法。也不能再获取后随意篡改（比如添加别的设备）。因此上面的1-4就被苹果牢牢的控制在手里，所有的规则都必须由苹果来制定和约束。

### AdHoc发布和真机调试

AdHoc允许将测试版app发布给有限的设备安装，而无需通过appstore的审核。这里的关键是如何控制哪些设备可以装。答案就是`mobileprovision`文件，记得你在生成`mobileprovision`文件的时候需要选设备的UDID吧，所以这些设备需要事先添加到MC的`Devices`里面。对于开发时候的真机调试，原理差不多。都是通过`mobileprovision`的条目`4`来做到的。而苹果对于调试和测试用机的数量限制为100台！


## iOS代码签名

很多人研究到上面也就停止了，然而生命不息，作死不止。上面很多次提到代码签名，那么究竟代码是如何签名的。这对于可能需要做自动签名发布的企业或团队是必须了解的。另外，你可能还需要去阅读[iReSign](https://github.com/maciekish/iReSign)的源码。

### ipa的组成

iOS程序最终都会以.ipa文件导出，先来了解一下ipa文件的结构：

![](http://pchou.qiniudn.com/ipa组成.png)

事实上，ipa文件只是一个zip包，可以使用如下命令解压：

    /usr/bin/unzip -q xxx.ipa -d <destination>

解压后，得到上图的Payload目录，下面是个子目录，其中的内容如下：

1. 资源文件，例如图片、html、等等。
2. _CodeSignature/CodeResources。这是一个plist文件，可用文本查看，其中的内容就是是程序包中（不包括Frameworks）所有文件的签名。注意这里是`所有文件`。意味着你的程序一旦签名，就不能更改其中任何的东西，包括资源文件和可执行文件本身。iOS系统会检查这些签名。
3. 可执行文件。此文件跟资源文件一样需要签名。
4. 一个mobileprovision文件.打包的时候使用的，从MC上生成的。
5. Frameworks。程序引用的非系统自带的Frameworks，每个Frameworks其实就是一个app，其中的结构应该和app差不多，也包含签名信息CodeResources文件

### 相关的程序和命令

一般我们会用Xcode自带的archive功能来打包ipa和签名，实际上xcode只不过是调用了一些外部程序完成了工作，如果我们有朝一日需要自己实现自动化的签名流程，就需要了解究竟相关的程序和命令有哪些。

用下面命令，列出系统中可用于签名的有效证书：

    /usr/bin/security find-identity -v -p codesigning
    
    1) E056929276F94152F3FDF0EA84BD2B06396F2DDD "iPhone Developer: Liang Ding (2U967A2YJ6)"
    2) 7C608F653A989E95E1A4D303EC4E6625D95EEB42 "iPhone Distribution: Liang Ding (7XPNRZE9TC)"
      2 valid identities found
      
可以看到这个命令列出了一个字符串标示的证书名称，如：iPhone Developer: Liang Ding (2U967A2YJ6)。这个名称后面会用到的。

使用如下命令对xxx.app目录签名，codesign程序会自动将其中的文件都签名，（Frameworks不会自动签）：

    /user/bin/codesign -fs "iPhone Developer: Liang Ding (2U967A2YJ6)" --no-strict Payload/xxx.app

对于每个Framework，也需要使用这个命令签名，上面说了Framework的结构跟app其实差不多，所以签名命令类似。这个命令会自动找到证书相关的私钥。-f表示对于已经签名的app强制重签。

最后用下面命令校验签名是否合法：

    /usr/bin/codesign -v xxx.app

如果没有任何输出说明没有问题。

使用`zip`命令重新打包成ipa包

    /usr/bin/zip -qry destination source

### 对app重新签名的流程

如果要设计一个自动化的重签程序，大致需要这么个流程：

![](http://pchou.qiniudn.com/ipa签名流程.png)

1. 首先解压ipa
2. 如果mobileprovision需要替换，替换
3. 如果存在`Frameworks`子目录，则对.app文件夹下的所有Frameworks进行签名，在Frameworks文件夹下的`.dylib`或`.framework`
4. 对xxx.app签名
5. 重新打包

## iOS设备如何验证app是否合法

关键的几个点：

1. 解压ipa
2. 取出`embedded.mobileprovision`，通过签名校验是否被篡改过
 a. 其中有几个证书的公钥，其中开发证书和发布证书用于校验签名
 b. BundleId
 c. 授权列表
3. 校验所有文件的签名，包括Frameworks
4. 比对Info.plist里面的BundleId是否符合`embedded.mobileprovision`文件中的


## 总结

非对称密钥算法是基石，本文比较详细的阐述了非对称加密算法和摘要算法，并逐渐引出数字签名和数字证书。理解非对称密钥算法是关键。

苹果通过证书来授权开发者开发iOS应用，不同的证书具有不同的用处，建议申请时使用相同的请求文件（即保证私钥统一）。可以通过共享私钥的方式让团队使用相同的私钥和证书，已方便开发。为了保证app的安全性，app中所有的文件都会被签名，这样，签过名的app除非重新签名，否则无法改动其中的任何东西。

`mobileprovision`是一个配置文件，由苹果签名并发布给开发者。配置文件是一组信息的集合，这组信息决定了某一个应用是否能够在某一个特定的设备上运行。配置文件可以用于让应用在你的开发设备上可以被运行和调试，也可以用于内部测试 (ad-hoc) 或者企业级应用的发布。有了配置文件，苹果对开发者的约束就十分稳固了。

所以，证书（及其对应的私钥）和配置文件是签名和打包的两个必要文件。必须深刻理解，才能在日常的错误中找到解决办法。

更多内容可参考这几篇：

[Inside Code Signing](https://www.objc.io/issues/17-security/inside-code-signing/)

[代码签名探析](http://objccn.io/issue-17-2/)

[iOS Code Signing 学习笔记](http://www.cocoachina.com/ios/20141017/9949.html)