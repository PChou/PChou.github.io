---
layout: postlayout
title: 系统性能指标的采集方法（Linux篇）
categories: [Linux]
tags: [Linux]
---


通过程序采集服务器的性能指标，并以此数据为基础构造监控系统，是运维的常见需求。本文阐述各种主要性能指标的具体采集方法和技术。

## CPU

CPU的采样指标分为总体指标和单核(core)指标，通过读取`/proc/stat`文件，可以得到总体数据和每个core的数据。

```
     user nice sys idle      wait irq soft_irq steal
cpu  263   0   800 2121043    184  71  25   0    0
cpu0 117   0   436 1060548    113  71  7    0    0
cpu1 146   0   364 1060494    71   0   17   0    0
...
```

这里每一列表示的是cpu在某一方面的时间片占用`ticks`，见上图。在具体计算使用率的时候，我们可以将前后两次采值相减，然后除以前后两次total ticks的差值，就可以计算出cpu在不同方面的使用率。

CPU还有一个指标较`loadavg`，可通过`/proc/loadavg`文件获得：

```
0.00 0.01 0.05 1/105 2126
```

这表示，CPU总体上在1分钟，5分钟，15分钟平均任务队列中的任务数量。在单核CPU的情况下，这个数字如果超过1，说明CPU有等待的任务，CPU资源不够。如果在多核的CPU下，需要将这些数字除以core的数量，再和1比较。

## 内存

内存的总体使用信息，可以通过`/proc/meminfo`获得：

```
MemTotal:        1922052 kB
MemFree:         1679456 kB
Buffers:           67560 kB
Cached:            61752 kB
```

linux中内存管理有些特殊性。当读写文件时，内核会使用一些内存，将文件缓存在这部分内存中，以便下次更快速的IO。而当系统内存不足时，内核会释放这部分内存。IO缓冲和其他缓冲共同构成了上面的`Buffers`和`Cached`。换句话说，我们在计算系统实际物理内存剩余量时，应当将`Buffers`和`Cached`加上。否则随着系统的运行，可用内存可能会始终很少，但这并不意味着系统内存不足。



## Swap

swap分区是一种特殊的分区，Unix系统用于在物理内存告急的时候，将内存数据换出(page out)，以腾出更多物理内存。系统支持1个或多个swap分区。通过`mkswap`可以将一个分区设置为swap分区。在`fstab`中，swap分区可以这么挂载：

```
/dev/mapper/VolGroup-lv_swap swap                    swap    defaults        0 0
```

一般来说，我们关心每个swap分区的使用率和总体swap的使用率（总体使用率其实是单个之和）。总体使用率可以通过如下方法获得：

```
cat /proc/meminfo | grep Swap
```

对于某个swap实例的使用率，通过`/proc/swaps`文件获得

有时，我们还需要知道总共有多少个page被换入和换出，这可以通过如下方式获得

```
cat /proc/vmstat | grep pswp
```


## 文件系统

运维一般比较关心文件系统的使用率。在linux下，有两种主要的方法来获取文件系统列表。一种是读取`/etc/mtab`，不过这个文件所展示的内容可能过多，通常我们可以过滤掉总大小为0的文件系统。另外，有些时候，可能出现重复的挂在条目，例如：

```
rootfs / rootfs rw 0 0
/dev/mapper/centos-root / ext4 rw,seclabel,relatime,data=ordered 0 0
```

上面两项都是指向`/`的挂载。而其实通过df出来的结果确只有`/dev/mapper/centos-root`。过滤的规则是，设备所在目录有`/`的优先。因此`/dev/mapper/centos-root`比`rootfs`具有更高的优先级。

另一种获取文件系统的方法是调用`setmntent(MOUNTED, "r")`，`getmntent_r`和`endmntent`函数。

获取到文件系统列表后，需要获取目录的使用率。可以直接`stat`这个目录，或者调用`statvfs`。

## 磁盘IO

磁盘IO统计一般通过`iostat`工具来观察。不过作为采集器而言，需要从几个文件系统中获取：

1. 对于内核`>2.6`，可以读取`/proc/diskstats`
2. 对于内核`>2.4`，可读取`/proc/partitions`

对于文件中的各个字段的含义，详见[I/O statistics fields](https://www.kernel.org/doc/Documentation/iostats.txt)。由于其中的数据时累加值，所以跟CPU一样，需要将连续的两次采样值，进行某些计算来得到相应的指标。这块的计算方法主要参考iostat的[源码](https://github.com/i4oolish/iostat/blob/master/iostat.c)，也可以参考[Linux内核源码详解——命令篇之iostat](http://www.cnblogs.com/york-hust/p/4846497.html)。这篇文章[iostat来对linux硬盘IO性能进行了解 ](http://www.php-oa.com/2009/02/03/iostat.html)对计算出来的各个指标进行的实际的解释。

每次IO，可能是读可能是写（每秒多少次IO`r/s` `w/s`）。IO请求会消耗时间，这个时间（总等待时间`await`）分为在队列中等待的时间，以及IO本身的时间消耗（服务时间`svctm`）。服务时间的长短取决于IO请求本身需要读取的数据的大小（每次IO的数据大小`avgrq-sz`）。如果当前IO无法立刻得到处理，那么就会排队（单位时间IO队列的平均长度`avgqu-sz`）。为了优化IO，驱动程序可能会将前后多次IO合并为一次进行，这样可以减少实际的IO次数，提升效率（每秒合并读写次数`rrqm/s` `wrqm/s`）。IO操作本身会占用CPU，IO操作占用CPU时间片的占比（IO繁忙`busy`），决定了IO是否繁忙。

## 网络流量

读取网口状态相对简单，只需要周期性的读取`/proc/net/dev`文件即可，其中包含每一个网卡的数据：

```
Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:     672       7    0    0    0     0          0         0      672       7    0    0    0     0       0          0
  eth0: 15025028  106459    0    0    0     0          0         0 67776375   80642    0    0    0     0       0          0
  eth1:       0       0    0    0    0     0          0         0        0       0    0    0    0     0       0          0
```

