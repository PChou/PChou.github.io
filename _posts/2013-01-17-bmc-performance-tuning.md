---
layout: postlayout
title: 【译】BMC AR BSM 性能调优白皮书
description: 本文是BMC Remedy AR System Server 7.6 Performance Tuning for Business Service Management的翻译稿，并且进行了一定程度的精炼。
thumbimg: BMCAtriumCMDB.png
categories: [BMC]
tags: [Performance, BMC]
---

本文包含以下主题：

- 评估一个已配置好的BSM应用的性能
- 识别潜在的造成性能问题的瓶颈
- 收集诊断信息和数据，找到性能问题的根源


本文推荐的测试方法虽然是基于运行有众多BMC套件产品的AR系统，然而一些通用的方法仍然可以适用于其他产品。为了缩小范围，本文主要讨论Oracle、MS SQL Server和Tomcat servlet。

 

## AR系统架构 ##

AR系统采用多层架构。在后端，数据库用于存取数据，可支持5种类型的数据库：Oracle、SQL Server、DB2、Sybase和Informix。AR服务器维护一个持久化连接池，该连接池基于AR系统配置文件中的线程设置。

mid-tier，支撑web应用，使用远程调用（RPC）与AR服务器通行。可以通过选择性的配置PRC连接池来维护和调整资源配置和性能（默认情况下连接池是打开的，默认80个连接，可以配置）
 

## 性能考虑 ##

- 扩展数据库，保持数据库服务器端横向扩展性，比如Oracle的RAC
- 数据库性能在很大程度上依赖高速的I/O子系统，尽可能的配置最佳的I/O子系统
- AR服务器只缓存元数据，它十分依赖与数据库的快速、可高、低延时的连接。BMC推荐与数据库的连接要几乎无延时（1000Mbps），额外的转发、数据包过滤、防火墙都会对性能造成不良影响
- 在AR服务器层，可以使用Server Group实现横向扩展
- 在Mid-tier层，可以配置多个mid-tier指向同一个AR服务器，并在前端负载均衡设备的支持下，实现横向扩展
 

## 如何阐述问题 ##

- 吞吐量：访问频率，比如每小时创建的申请单和配置项
- 响应时间：从操作到操作完成所需的时间

宏观而言，“系统似乎变慢了”能够很快的表达。然而却不具有参考意义。注意记录以下数据：

- 客户端浏览器的配置信息，记录浏览器类型和版本
- 考虑客户端与服务端的网络延时，包括http-ping和tcp-ping延时
- 考虑到缓存的作用，首次访问往往比较慢，可以考察先后访问的不同时间间隔
 

## CPU ##

CPU的使用率和延时往往不是线性的，当CPU使用率不高时，随着CPU使用率的提升，延时可能不会有太明显的波动，基本呈线性；但当达到一定使用率时，响应时间会急剧提高。

CPU主要被系统中的3个部分瓜分：

- 用户时间。即应用程序使用CPU的时间，这段时间对应用程序而言是有效的
- 系统时间。操作系统内核的核心进程。如果系统时间高于5%，说明操作系统层面的资源可能存在问题、也可能有锁问题，典型的是内存管理问题。
- I/O等待时间。I/O系统调用等待返回，如果I/O太拖累CPU的话，系统响应时间将较差。在多层的架构中，数据库端往往会带来I/O问题
 

windows下跟踪CPU的工具有perfmon，linux和Unix下可以用sar。主要跟踪CPU的使用情况，特别是IO等待。


## 内存消耗 ##

跟踪内容消耗通常不是那么显而易见的，这主要是因为：

- 一些系统会将不使用的内存数据交换到交换空间或者其他系统资源中
- 不同的操作系统对内存的分配算法各异

了解应用程序在运行期间究竟使用了多少物理内存是很重要的。

现代操作系统都提供虚拟内存空间，这极大的扩大的系统的可用内存数量。因此，如果应用程序消耗了几乎所有的系统物理内存，那么新的内存分配，将导致其他应用程序未使用的内存数据被写入磁盘来腾出内存。这种行为称为“内存交换”。虽然这很有用，但这无疑会消耗CPU使用以及拖累响应时间。

评估内存使用的目标就是使得系统不需要使用“内存交换”，换言之，物理内存就足够系统和应用程序了。内存耗尽的症状首先会是CPU资源的满负荷使用。观察应用程序对内存的使用趋势也很重要，因为这往往意味着有内存泄漏，而且会导致内存交换失败。

考虑操作系统的版本是32位还是64位（参考：<http://support.microsoft.com/kb/291988>）

- 32位的windows操作系统，应用程序只能访问最大4G的虚拟内存，其中只有2G给应用程序使用，另外2G给操作系统内核使用。不过，你可以通过4GB tuning技术，使应用程序得以使用3GB内存，留给操作系统内核1G
- 64位的Windows操作系统上，对于32位的应用程序，你可以将IMAGE_FILE_LARGE_ADDRESS_AWARE参数设置为4G。另外，PAE技术可以使得32位的应用程序在64位的系统中，使用超过4G的物理内存。

对于Unix和Linux系统，根据发行版的不同，内存管理方法有所不同。请参考相关文档。

 

web应用程序调优要分两个层面：

- 调优web架构和配置。例如JVM参数，servlet engine线程配置，HTTP协议参数等这些不在web应用程序的可控范围内的调优。
- 调优mid-tier应用程序本身。


## Web基础配置调优 ##

下面的参数将有效的改善浏览器的响应时间：

### HTTP keep-alive ###

允许HTTP协议中的保持连接的数量，这将减少客户端与服务端建立TCP连接的次数。客户端将能够用现有的连接来进行HTTP通信。通常的web server在这个参数上需要考虑两个方面：

1. Keep-alive count：表示服务器能够保持连接的最大数量，对于Apache，默认100
2. Connection timeout：表示对于空闲的TCP连接，多长时间超时并关闭，对于Apache，默认20sec

这两个参数都会通过HTTP响应头返回浏览器，浏览器会进行合适的处理。默认的参数对于像mid-tier这样的应用并不适用，因为mid-tier应用是基于AJAX类型的应用，大量的AJAX请求却只包含少量的数据，如果反复的建立连接，可想而知。推荐设置如下

{% highlight xml %}

<Connector URIEncoding="UTF-8" acceptCount="100" 
connectionTimeout="90000"  
maxHttpHeaderSize="8192" maxKeepAliveRequests="-
1" maxThreads="500" port="80" 
protocol="HTTP/1.1" redirectPort="8443"/>

{% endhighlight %}

以上设置对性能提升的幅度取决于很多因素，其中一点就是网络延时，网络延时越大，这种设置的效果越好（大大减少TCP握手）。并且，对于HTTPS的站点此种提升可能更大（减少了SSL建立时期的密钥协商）。利用web代理调试技术可以观察设置是否生效，例如Fiddler。

 

### JVM settings

包括`JVM heap size`、`MaxPermSize`。这些值将影响垃圾回收的行为。不够优化的设置会导致以下问题：

- 垃圾回收更频繁，这样消耗更多的CPU
- 内存不能被完整的分配

以下是推荐配置：

![]({{ site.BASE_PATH }}/assets/img/bmc-performance-tuning-img0.png)

上图的配置仅仅考虑了你的Tomcat只运行midt-tier应用程序。如果还有其他应用共享一个Tomcat，你可能需要增加JVM堆的最大值和最小值

如果你有足够的内存空间，可以通过配置`<MT>/WEB-INF/classes/config.properties`中的`arsystem.ehcache.referenceMaxElementsInMemory`配置项。这些项目决定了mid-tier缓存AR系统的表单等以提高性能。每增加700M的内存，可以对该值增加1250。（For each additional 700 MB, you can increase the arsystem.ehcache.referenceMaxElementsInMemory by 1250 MB）其余类似该项目的配置表示对不同类型的对象缓存的权重，比如默认值下，缓存的active link数量最大可以是1250×4.904=6130个。

对于64的JVM参见：<http://www.oracle.com/technetwork/java/hotspotfaq-138619.html#64bit_performance>

BMC内部的性能压力测试表明，32位JVM的性能在CPU使用上优于64位JVM至少45％。如果你使用64位的JVM，考虑Oracle的建议，使用混合模式和并行垃圾回收。

- XX:+UseCompressedOops
- -XX:+UseParallelGC
 

### Web应用程序的宿主线程配置

考虑下面的参数，具体配置可以参考上文：

- maxThreads：Tomcat最大同时处理HTTP请求的数量
- acceptCount：如果Tomcat无法第一时间处理请求，请求将进入队列。这个参数表征请求队列的最大容量
 

## mid-tier调优

上面阐述了web服务器本身的性能调优。下面从三个方面考虑mid-tier的性能：

- 配置mid-tier使得当前请求所需要的资源已经在内存中了
- 配置mid-tier使得当前请求所需要的资源不在内存中时，可以快速的定位。内存是有限的不可能所有的东西都在内存中
- 配置mid-tier使得其能利用浏览器缓存，来缓存不经常更改的资源。

mid-tier的职责是将AR系统应用转化成web应用，本质上它会将AR系统的表单定义“编译”成HTML和JS。这与JSP编译过程类似。这个过程是CPU密集型过程。如果用户访问了没有预编译过的AR表单，这个预编译过程可能长达1分钟。

- `Enable Cache Persistence`：该选项将使得预编译的结果能够被序列化到磁盘，当web server重启时，能够从磁盘加载。建议在开发环境中勾选此项。
- `Preload`：当mid-tier启动时，会加载所有的activelink和menu，以及他们关联的所有表单。最终表单在被编译成HTML/JS的前提是有用户访问了某个视图，如果内存中已经有了表单定义，那么预编译的过程将比较快。
- `Prefetch`： MT dir/WEB-INF/classes/prefetchConfig.xml的配置文件指明了需要在启动时加载到内存的form，可作为preload的补集。
- `Statistics Service`：统计服务。简单的说，该服务会根据表单不同的访问频度，考虑是否将表单的HTML/JS缓存在内存中
可按照如下配置步骤来配置mid-tier：

1. 始终打开`Enable Cache Persistence`
2. 打开Preload
3. 当Preload动作完成后，关闭Preload

通过这样的配置步骤后，统计服务会加载相应的实际在使用的对象到内存。在preload执行完一次后，相关的对象会被序列化到磁盘。通过关闭Preload服务，可以给统计服务腾出更多的内存。

在`MT dir/WEB-INF/classes/config.properties`中如下配置会使得mid-tier“指导”浏览器缓存一些不经常改变的资源

`arsystem.formhtmljs_expiry_interval`

`arsystem.resource_expiry_interval`

这两个配置以秒为单位，影响浏览器对资源的缓存周期。另外，也建议客户端浏览器的缓存策略。在生产环境中可以配置1周。

此外，在生产环境中，Mid-tier的log也可以尽可能的关闭

 

## AR服务器调优

在考虑调优AR服务器的时候考虑如下两点：

- 这是个多线程应用
- 默认的线程数配置是最低的，这是为了能够适应最低的服务器配置

如果线程数的设置太低的话，AR系统不能充分使用CPU资源，在高负荷下会有潜在性能问题。太多的线程会导致额外的线程管理开销。建议线程数量3倍于CPU数量（Fast类型），5倍于CPU数量（List类型）。最大值和最小值设置成一致的。

![]({{ site.BASE_PATH }}/assets/img/bmc-performance-tuning-img1.png)

这里的建议只是个开始。由于硬件差异很大，比如CPU架构，CPU速度等。BMC推荐“因地制宜”。

下表是推荐的AR系统配置参数，这些参数都与性能有关，适用于7.5版本以上：

- Delay-Recahe-Time：最新的cache应用到所有线程的秒数。范围可以是0-3600秒。默认值为5秒，推荐300秒
- When Delay-Recache：指示AR Server何时检查定义文件对象是否需要从数据库更新。如果设置成0，所有API调用都会想数据库检查定义文件，增加了数据库的访问频度
- Max-Entries-Per-Query：一次查询最多的返回记录条数。用户可以通过设置自己的Preference设置该值。推荐设置2000
- Next-ID-Block-Size：指定分配的唯一ID的区间值，默认是10，推荐100。这个值太小的话会使得AR更加频繁的像数据库所要下一个ID的开始值，太大的话会导致ID池资源的浪费，并会更快的消耗殆尽。
- Server-Side-Table-Chunk-Size：在执行filter和filter guide期间，ARServer会分批的从数据库检索记录条目，并执行filter，直到所有的记录扫描完成。默认值也是推荐值是1000。设置成0的话，会使得AR服务无限制的查- 询记录。较大的值将会使得AR使用更多的内存，但访问数据库的次数减少。
- Allow-Unqual-Queries：是否允许无过滤条件的ARGetListEntry或ARGetListEntryWithFields API调用
- Cache-Mode：指定是否打开开发模式。在开发模式中，当表单和工作流的改变的时候，用户的操作可能被延迟。1表示开启，0表示关闭。在生产环境中推荐为0。
- Debug-mode：指定服务端日志模式。推荐在稳定的生产环境中指定为0（关闭所有日志）。
- Submitter-Mode：指定Submitter字段是否可以改变，以及是否必须有写license才能更改记录，可选值为1或2。1表示锁定模式，Submitter不能更改；2表示可变模式。默认是2。推荐为1，在锁定模式下，AR系统可以少做一些- 检查，提高效率。
- Minimum-API-Version：服务端支持的最低通信API版本。默认值为0（表示支持所有版本的API）。BMC建议设置你生产环境的一个版本值。总的来说，如果存在低版本的客户端，你不得不支持更多的API版本，另一方面，支持- 更多的API版本会导致过多的PRC参数转换，这将降低性能。
- Private-RPC-Socket(Fast:390620)
- Private-RPC-Socket(List:390635)：上面谈过了，此处略过
- CMDB-Cache-Refresh-Interval：CMDB调用AR系统更新缓存相关数据的间隔时间。默认为300sec，推荐600sec。
 

## 数据库调优

AR服务器与数据之间的通信频繁，需要足够的带宽。BMC推荐使用外部存储。

### Oracle调优

暂时跳过

### SQL Server调优

强制参数化。强制SQL Server参数化有利于复用SQL执行计划，减少SQL语句解析时间。类似Oracle的共享游游标。

{% highlight sql %}

Alter database ARSystem set PARAMETERIZATION FORCED
select name, is_parameterization_forced from sys.databases 
where name='ARSystem'

{% endhighlight %}

设置快照隔离。参考

<http://www.cnblogs.com/trisaeyes/archive/2006/12/30/607975.html>
<http://www.cnblogs.com/trisaeyes/archive/2006/12/30/607985.html>
<http://www.cnblogs.com/trisaeyes/archive/2006/12/30/607994.html>

{% highlight sql %}

ALTER DATABASE arsystem SET 
ALLOW_SNAPSHOT_ISOLATION ON 
ALTER DATABASE arsystem SET 
READ_COMMITTED_SNAPSHOT ON

select name, is_read_committed_snapshot_on 
from sys.databases  
where name='ARSystem'

{% endhighlight %}
 

## 总体系统调优

### 网络

- 在AR服务器和数据间使用1000Mbps网络链路，尽量减少网络延时
- 不要在AR服务器和数据库服务器间增加防火墙，这将对性能有不利影响
- 如果在AR服务器和Mid-tier服务器间有防火墙或负载均衡设备，配置为不要切断空闲链接。重建连接将消耗额外的时间
