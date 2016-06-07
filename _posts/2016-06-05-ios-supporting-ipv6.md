---
layout: postlayout
title: IOS支持IPv6 DNS64/NAT64网络
categories: [IOS]
tags: [ios,network]
---

从2016年6月1日起，iOS应用必须支持IPv6，否则审核将被拒。详见[Supporting IPv6 DNS64/NAT64 Networks](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW1)。本文是翻译稿。从本文中可以学到有关IPv6过度时期的网络架构和具体IOS应用如何兼容的知识。

随着IPv4地址池即将耗尽，企业和移动通信供应商在逐步部署`IPv6 DNS64/NAT64`网络。`IPv6 DNS64/NAT64`是一个仅有IPv6的网络，且能通过转换继续支持IPv4。根据你app的性质，这样的转化会有不同的影响：

- 如果你是编写客户端应用，并且使用高层次的网络API，如`NSURLSession`和CFNetwork框架，使用域名连接。那么你无需更改你的应用，即可工作在IPv6地址下。如果你不是采用域名连接，你可能需要看[Avoid Resolving DNS Names Before Connecting to a Host](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/CommonPitfalls/CommonPitfalls.html#//apple_ref/doc/uid/TP40010220-CH4-SW20)。关于CFNetwork，参见`CFNetwork Framework Reference`。
- 如果你是编写服务器程序，或者是底层网络应用，你需要确保你的socket代码能同时在IPv4和IPv6地址下工作。参见[RFC4038: Application Aspects of IPv6 Transition.
](https://tools.ietf.org/html/rfc4038)。

## 什么推动了IPv6

主要的网络供应商，包括美国的蜂窝移动网络供应商，在积极地推进和部署IPv6。这是由多方面因素造成的。

> World IPv6 Launch是个追踪全球范围内部署活动的组织。访问[World IPv6 Launch website.
](http://www.worldipv6launch.org/measurements/)可以看到近期的进程。

### IPv4地址逐渐耗尽

近几年，众所周知，IPv4地址最终将耗尽，无类域间路由(Classless Inter-Domain Routing)和网络地址转换(NAT)等技术延缓了这势在必行的趋势。然而，2011年1月31日，最上层的IPv4分配机构Internet Assigned Numbers Authority(IANA)宣布地址用尽。American Registry for Internet Numbers (ARIN)预计在2015年夏季用完IPv4地址。从[这里](https://www.arin.net/resources/request/ipv4_countdown.html)查看倒计时。

### IPv6比IPv4高效

除了能解决IPv4耗尽的问题，IPv6比IPv4更加高效，比如：

- 无需网络地址转换(NAT)
- 使用简介的头部信息可以加快在网络中的路由
- 避免网络数据包碎片
- 相邻地址解析时避免使用广播(Avoids broadcasting for neighbor address resolution
)

### 4G开发

第四代移动通信技术(4G)仅基于包交换，由于IPv4地址的限制，为了保证4G开发的扩展性，需要IPv6的支持

### 多媒体服务兼容性

IP Multimedia Core Network Subsystem (IMS) 允许一些服务通过IP传输，例如多媒体SMS消息和VoLTE。 有些服务提供商使用IMS时仅支持IPv6。

### 成本

业界在向IPv6迁移的过程中，需要继续支持古老的IPv4网络，这使运营商产生了额外的操作和维护成本。


## DNS64/NAT64转换流程

为了缓解IPv4地址的耗尽，许多IPv4网络采用NAT技术。尽管这种方案临时奏效，但是实践证明耗资巨大并且不够可靠。如今，随着越来越多的设备使用IPv6，运营商必须同时支持IPv4和IPv6，这种努力却是花费巨大的。

图 10-1 蜂窝移动网络分别提供IPv4和IPv6链接

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/ipv4Andipv6Network_2x.png)

理想情况下，运营商希望丢掉对IPv4的支持。然而，这么做会导致客户端无法访问基于IPv4的服务器，而IPv4的服务器依然是网络的重要组成部分。为了解决这个问题，大多数的网络供应商实现了一个叫DNS64/NAT64的转换流程。这是个纯IPv6网络，并通过转换也可继续访问IPv4的内容。

图 10-2 蜂窝移动网络用DNS64和NAT64来部署一个IPv6网络

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/ipv4Andipv6NetworkWithDNS64NAT64_2x.png)

在这个流程中，如果客户端向DNS64服务器发起一个DNS查询，当DNS找到一个基于IPv6的地址后，立刻返回客户端。如果无法找到对应的IPv6地址，DNS64服务器将请求IPv4地址，然后DNS64服务器将IPv4作为前缀合成一个IPv6地址，并且将其返回给客户端。这样，客户端将总是获得一个IPv6目标地址，见图10-3。

图 10-3 DNS64 IPv4到IPv6转换过程

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/NAT64-DNS64-ResolutionOfIPv4_2x.png)

当客户端向服务端发送请求时，目标地址为合成后的IPv6地址会自动由NAT64网关路由过去。对于请求，网关作的是IPv6到IPv4的转换。同样的，对于服务器响应，网关作的是IPv4到IPv6的转换。见图10-4

图 10-4 DNS64/NAT64转化方案的流程

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/NAT64-DNS64-Workflow_2x.png)


## IPv6和App Store的要求

对IPv6 DNS64/NAT64网络的兼容性，将是App Store的提交时的必须条件，所以兼容对于app来说是相当重要的。好消息是，大多数app已经是IPv6兼容的了。对于这些app，进行定期的回归测试依旧是必要的。对于那些IPv6不兼容的应用在面对DNS64/NAT64网路时可能遇到麻烦。幸运的是，解决问题通常很简单，下面章节会讨论这个问题。

## 常见的阻碍IPv6支持的行为

有几个导致应用无法支持IPv6的场景。本节描述如何解决这些问题。

- 嵌入IP地址的协议。许多通信协议，像`SIP`,`FTP`,`WebSockets`,`P2PP`，都可能在协议的报文中包含了IP地址。例如，`FTP`参数命令`DATA` `PORT` `PASSIVE`的交换信息中包含了IP地址。类似的，IP地址值可能出现在`SIP`的头部，像`To` `FROM` `Contact` `Record-Route`以及`Via`。参见[Use High-Level Networking Frameworks](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW13)和[Don’t Use IP Address Literals](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW23)
- 配置文件中使用IP地址。参见[Don’t Use IP Address Literals](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW23)
- 网络状态监测。许多app试图主动的监测网络连接和wifi连接，却将IP地址作为参数而调用网络可达性相关的API。参见[Connect Without Preflight](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW25)
- 使用底层网络接口。一些app直接使用`socket`和其他的低层次网络API，比如`gethostbyname` `gethostbyname2`和`inet_aton`。这些API很容易因为错误使用而仅支持IPv4。比如，域名解析时使用`AF_INET`地址簇，而不是`AF_UNSPEC`地址簇。参见[Use High-Level Networking Frameworks](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW13)
- 使用了小的地址簇存储容器。一些app和网络库，使用了例如`unit32`,`in_addr`,`sockaddr_in`这种32位或更小的容器来存储地址。参见[Use Appropriately Sized Storage Containers](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW26)

## 确保IPv6 DNS64/NAT64兼容性

附上下面的指导来确保IPv6 DNS64/NAT64的兼容性。

### 使用高层次的网络框架

app请求网络时，可以构建在高层次的网络框架上，也可以使用底层的`POSIX`兼容的`socket`接口。在多数情况下，相比底层接口，高层次的接口效率高一些，兼容性好，容易使用，不容易掉入通常的编程错误陷阱中。

图 10-5 网络框架和API层次

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/NetworkingFrameworksAndAPIs_2x.png)

- `WebKit`。此框架提供一系列的类用来在窗口上显示web内容，而且实现了浏览器特性，诸如：链接、前进后退管理、最近访问历史。WebKit将加载网页的流程简化了，包括异步地从HTTP服务器上请求网页内容，这些服务器响应的数据包可能一点点送达，也可能以随机的顺序到达，甚至可能由于网络错误收不全。详见[WebKit Framework Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/WebKit/ObjC_classic/index.html#//apple_ref/doc/uid/TP30000745)
- `Cocoa URL loading system`。这个系统用于简单地通过网络发送和接收数据，却不需要提供显示的IP地址。数据的发送和接收使用这几个类中的一个：`NSURLSession` `NSURLRequest` `NSURLConnection`，这些类使用`NSURL`对象。`NSURL`对象允许你操作URL。创建一个`NSURL`对象时使用`initWithString:`方法，并传入一个指定的URL。调用`NSURL`类的`checkResourceIsReachableAndReturnError:`方法检测目标主机的可达性。详见[URL Session Programming Guide](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/URLLoadingSystem/URLLoadingSystem.html#//apple_ref/doc/uid/10000165i)
- `CFNetwork`。这个核心服务框架提供了一个抽象网络协议的库。这个库提供了大量易用的网络操作，比如BSD socket，DNS解析，处理HTTP/HTTPS。调动`CFHostCreateWithName`方法，避免显示的使用IP地址来标识主机。调用`CFStreamCreatePairWithSocketToCFHost`与主机建立TCP链接。详见[CFNetwork Programming Guide](https://developer.apple.com/library/mac/documentation/Networking/Conceptual/CFNetwork/Introduction/Introduction.html#//apple_ref/doc/uid/TP30001132)中的[CFNetwork Concepts](https://developer.apple.com/library/mac/documentation/Networking/Conceptual/CFNetwork/Concepts/Concepts.html#//apple_ref/doc/uid/TP30001132-CH4)

如果你需要使用低层次的socket接口，参看如下指导:[RFC4038: Application Aspects of IPv6 Transition](https://tools.ietf.org/html/rfc4038)

> [Getting Started with Networking, Internet, and Web](https://developer.apple.com/library/mac/referencelibrary/GettingStarted/GS_NetworkingInternetWeb/_index.html#//apple_ref/doc/uid/TP40008807)和[Networking Overview](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/index.html)提供详细的网络框架API的说明

### 不要使用IP地址

在许多API中请确保不再使用点分十进制表示的IPv4地址，例如`getaddrinfo`或`SCNetworkReachabilityCreateWithName`。取而代之，应该使用高层次网络框架和地址无关的API，例如在使用`getaddrinfo`和`getnameinfo`时，传入主机名或域名。详见：getaddrinfo(3) Mac OS X Developer Tools Manual Page 和 getnameinfo(3) Mac OS X Developer Tools Manual Page。

> 从IOS9何OSX10.11开始，`NSURLSession`和`CFNetwork`会在本地自动将IPv4的地址合成IPv6地址，便于与DNS64/NAT64通信。不过，你依旧不该使用IP地址串。

### 连接时无需网络预检

检测网络可达性的API(参见[SCNetworkReachability Reference](https://developer.apple.com/library/mac/documentation/SystemConfiguration/Reference/SCNetworkReachabilityRef/index.html#//apple_ref/doc/uid/TP40007260))用来在遇到连接异常时进行诊断。许多app错误的使用了API，它们往往通过调用[SCNetworkReachabilityCreateWithAddress](https://developer.apple.com/library/mac/documentation/SystemConfiguration/Reference/SCNetworkReachabilityRef/index.html#//apple_ref/c/func/SCNetworkReachabilityCreateWithAddress)方法，并将IPv4地址`0.0.0.0`作为参数传入，来不断检查网络连接，实际表示是否至少可达一个路由(which indicates that there is a router on the network)。然而，即使有这样的路由也不保证互联网的连接存在。总之，避免进行网络可达性的检测。只需要直接进行连接，并且优雅的处理失败的情况。如果你确实需要检测网络可用性，需避免使用[SCNetworkReachabilityCreateWithAddress](https://developer.apple.com/library/mac/documentation/SystemConfiguration/Reference/SCNetworkReachabilityRef/index.html#//apple_ref/c/func/SCNetworkReachabilityCreateWithAddress)，而是调用[SCNetworkReachabilityCreateWithName](https://developer.apple.com/library/mac/documentation/SystemConfiguration/Reference/SCNetworkReachabilityRef/index.html#//apple_ref/c/func/SCNetworkReachabilityCreateWithName)，并传入主机名。

有些app还在调用[SCNetworkReachabilityCreateWithAddress](https://developer.apple.com/library/mac/documentation/SystemConfiguration/Reference/SCNetworkReachabilityRef/index.html#//apple_ref/c/func/SCNetworkReachabilityCreateWithAddress)的时候传入IPv4地址`169.254.0.0`(一个自动分配的本地IP)，试图检测Wi-Fi连接。若要检测Wi-Fi或蜂窝移动网络连接，参见网络可达标识`kSCNetworkReachabilityFlagsIsWWAN`。

### 使用合适的Storage Container大小

使用Storage Container结构，如`sockaddr_storage`，用以有足够的空间存放IPv6地址。

### 检查代码不兼容IPv6 DNS64/NAT64的代码

查找并删除IPv4相关的API，如：

- inet_addr()
- inet_aton()
- inet_lnaof()
- inet_makeaddr()
- inet_netof()
- inet_network()
- inet_ntoa()
- inet_ntoa_r()
- bindresvport()
- getipv4sourcefilter()
- setipv4sourcefitler()

如果你处理的IPv4的类型，去报同时处理对应的IPv6类型

IPv4 		|		IPv6
------------|-------------
AF_INET		|		AF_INET6
PF_INET		|		PF_INET6
struct in_addr |	struct in_addr6
struct sockaddr_in |	struct sockaddr_in6
kDNSServiceProtocol_IPv4 | kDNSServiceProtocol_IPv6



### 使用系统API合成IPv6地址

如果你的app需要连接到仅支持IPv4的服务器，且不使用DNS域名解析，请使用`getaddrinfo`处理IPv4地址串(译注：getaddrinfo可通过传入一个IPv4或IPv6地址，得到一个sockaddr结构链表)。如果当前的网络接口不支持IPv4，仅支持IPv6,NAT64和DNS64，这样做可以得到一个合成的IPv6地址。

代码10-1展示了如何用`getaddrinfo`处理IPv4地址串。假设你内存中有一个4个字节的IPv4地址串(如{192,0,2,1})，这个示例代码将之转化为字符串("192.0.2.1")，使用`getaddrinfo`合成一个IPv6地址结构(struct `sockaddr_in6`包含IPv6地址串为"64:ff9b::192.0.2.1"),然后尝试连接到这个IPv6地址。


代码 10-1 使用`getaddrinfo`处理IPv4地址串

{% highlight c %}

#include <sys/socket.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <err.h>
 
uint8_t ipv4[4] = {192, 0, 2, 1};
struct addrinfo hints, *res, *res0;
int error, s;
const char *cause = NULL;

char ipv4_str_buf[INET_ADDRSTRLEN] = { 0 };
const char *ipv4_str = inet_ntop(AF_INET, &ipv4, ipv4_str_buf, sizeof(ipv4_str_buf));

memset(&hints, 0, sizeof(hints));
hints.ai_family = PF_UNSPEC;
hints.ai_socktype = SOCK_STREAM;
hints.ai_flags = AI_DEFAULT;
error = getaddrinfo(ipv4_str, "http", &hints, &res0);
if (error) {
    errx(1, "%s", gai_strerror(error));
    /*NOTREACHED*/
}
s = -1;
for (res = res0; res; res = res->ai_next) {
    s = socket(res->ai_family, res->ai_socktype,
               res->ai_protocol);
    if (s < 0) {
        cause = "socket";
        continue;
    }

    if (connect(s, res->ai_addr, res->ai_addrlen) < 0) {
        cause = "connect";
        close(s);
        s = -1;
        continue;
    }

    break;  /* okay we got one */
}
if (s < 0) {
    err(1, "%s", cause);
    /*NOTREACHED*/
}
freeaddrinfo(res0);

{% endhighlight %}

> 从IOS9.2和OSX10.11.2开始合成IPv6地址的功能才被加入到`getaddrinfo`。不过，这么用不会对旧的系统产生兼容性问题。参见getaddrinfo(3) Mac OS X Developer Tools Manual Page.


### 测试IPv6 DNS64/NAT64兼容性

大多数蜂窝移动供应商已经开始部署IPv6 DNS64/NAT64网络，测试这种网络最简单的的方法是用Mac建立一个本地的IPv6 DNS64/NAT64网络。你可以将其他设备链接到这个网络来测试。见图10-6

> 提示：IPv6 DNS64/NAT64网络仅在OSX 10.11及更高版本上可以设置。除此之外，基于Mac来建立的IPv6 DNS64/NAT64网络仅与支持[RFC6106: IPv6 Router Advertisement Options for DNS Configuration](https://tools.ietf.org/html/rfc6106)的客户端设备兼容。如果你的设备不是iOS或OSX设备，请确保它支持RFC。还需注意的是：不同于运营商提供的DNS64/NAT64网络，基于Mac系统的IPv6 DNS64/NAT64总是返回合成后的IPv6地址。因此，它不能用于访问你本地网络以外的纯IPv6网络。


图 10-6 本地的基于Mac的 IPv6 DNS64/NAT64 网络

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/local_ipv6_dns64_nat64_network_2x.png)

使用你的Mac建立本地的IPv6 Wi-Fi网络

1. 确保你的Mac连接到互联网，`但不是通过Wi-Fi`
2. 启动`System Preferences`
3. 按住`Option`键(标准键盘是Alt键)点击`Sharing`，不要放开Option键。


图 10-7 打开Sharing preferences

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_2x.png)


4. 在共享列表中选择`Internet Sharing`

图 10-8 配置Internet Sharing

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_2x.png)


5. 放开`Option`键
6. 勾选`Create NAT64 Network`复选框

图 10-9 启用一个本地IPv6 NAT64网络

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_ipv6_2x.png)

7. 选择你用于互联连接的网络接口，例如蓝牙局域网(译者注：通常这里mac用以太网连接互联网，很少有用蓝牙的)

图 10-10 选择共享的网络接口

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_connection_2x.png)

8. 选择Wi-Fi复选框

图 10-11 通过Wi-Fi开启共享

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_ports_2x.png)


9. 点击`Wi-Fi Options`，配置你网络的网络名和安全选项

图 10-12 设置Wi-Fi网络选项

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_wi-fioptions_button_2x.png)


10. 勾选`Internet Sharing`复选框启动你的本地网络

图 10-14 启动网络共享

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_sharingenabled_2x.png)


11. 当弹出确认是否开启共享时，点击`Start`

图 10-15 开启网络共享

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/systempreferences_sharing_internetsharing_enabledconfirmation.png)

一旦共享启动后，你应该可以看到一个绿色的状态指示灯和一段话说明共享已开启。在Wi-Fi菜单中，你同样将看到一个小的向上的箭头，表示网络共享已经开启。现在你拥有了一个IPv6 NAT64的网络，其他设备可以连接这个网络来测试app。

图 10-16 网络共享开启图标

![](https://developer.apple.com/library/mac/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/art/internet_sharing_wi-fi_menu_2x.png)

> 提示：为了确保测试时严格使用本地的IPv6网络，请确认测试设备没有其他的网络接口正在使用。例如，如果你在测试iOS设备，确保蜂窝移动网络服务是禁用的，这样才能确保通过Wi-Fi连接。















