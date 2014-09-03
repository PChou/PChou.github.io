---
layout: postlayout
title: 存储技术之RAID
categories: [hardware]
tags: [Hardware,storage,raid]
---

存储技术如今已经越来越重要，而且在云计算时代，涌现出了很多专注于云存储的厂商。存储技术本身也十分复杂，从硬件到协议到软件到接口几乎覆盖计算机科学的方方面面。笔者借助《大话存储II》这本书，开始了这块知识空白的补充。本文的图片均来源于网络。


一块磁盘的容量有限，速度有限，如果需要更大的存储空间，更快的速度怎么办呢？而且如果数据可靠性要求很高，如果一块磁盘坏了，是否有办法保持数据不丢失呢？`RAID`(Redundant Array of Independent Disks)因此而生。无论是哪种RAID，其基本思想不外乎如下几种：

- 如果一块硬盘不够用，那么多加几块
- 如果一块硬盘不够快，那么让多块硬盘同时参与IO
- 如果要考虑硬盘损坏，那么让数据多存几份，或者利用某种校验算法，保证数据能够恢复


## RAID 0

`RAID 0`将两块/多块硬盘合并成一块逻辑磁盘。比如两块500GB的硬盘组建RAID 0，那么在系统中我们可以看到有一块1TB的逻辑磁盘，而并不能看到是两块物理硬盘。RAID 0将数据的读写同时分摊到多块磁盘上，也就是说，数据会被控制器分割后写入多块盘，读取时也会同时调动多块盘一起读，最后由控制器组合后返回上层操作系统。

![](http://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/RAID_0.svg/130px-RAID_0.svg.png)

可以看出RAID 0在读写效率上要比单盘要高，因为有很大概率调动多块磁盘同时操作。对于上层操作系统而言，并不感知。操作系统只是觉得可用的扇区变多了，而且对于数据被“分割”和“合并”这样的事情也一无所知。

- 优点：速度快、效率高、容量提升
- 缺点：无备份，容易丢失数据


## RAID 1

为了解决磁盘损坏导致所有数据丢失，`RAID 1`将数据原样复制了一份到另一个磁盘，这样能够在一块盘损坏的情况下，保留数据。而且读数据的时候可以同时在两块盘上读，速度提升了，因为它们的数据是完全一样的。

![](http://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/RAID_1.svg/130px-RAID_1.svg.png)

- 优点：读速度快，有备份
- 缺点：容量无提升，写效率低

## RAID 2

`RAID 2`最初是希望在RAID 0中加入RAID 1的可靠性。原理是将数据打散成bit，平均存到不同的磁盘上，并利用[Hanmming Code](http://zh.wikipedia.org/zh-cn/%E6%B1%89%E6%98%8E%E7%A0%81)算法将校验位写入到校验盘，在读取数据时反过来校验数据。如果某块磁盘损坏，可以通过校验得知，并通过计算得到原本坏盘上的数据。汉明码需要比较多的校验盘，如果数据盘有4块，校验盘需要3块； 如果数据盘有7块，校验盘需要4块。RAID 2最少需要3块硬盘才能组建。

![](http://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/RAID2_arch.svg/300px-RAID2_arch.svg.png)

- 优点：在RAID 0的基础上加入校验功能
- 缺点：校验盘太多

## RAID 3

针对RAID 2校验盘太多的情况，利用更为简单的异或运算，创建了RAID 3。RAID 3的思想也是将数据打散存在不同的数据盘上，并将校验位单独存放在校验盘，但是无论数据盘有多少，RAID 3的校验盘只需要一块，因为RAID 3是将数据位进行异或运算得到的校验位。不过这样做只能容许一块数据盘的损坏，在得知那块盘损坏的情况下，可以根据校验盘和其他的数据盘计算出损坏的盘上的数据。

![](http://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/RAID_3.svg/220px-RAID_3.svg.png)

- 优点：在RAID 2的基础上，减少了校验盘的数量，并行度也有所提高
- 缺点：无法并发IO，因为每次IO都需要牵动所有的磁盘，当然RAID 2也有此缺点

## RAID 4

RAID 2和RAID 3虽然改进了读写效率，但是每次IO都要牵动所有的数据盘和校验盘，而每块磁盘同一时刻只能进行一次IO是真理，所以RAID 2 和RAID 3无法实现并行IO。要实现并行IO，就必须有空闲的磁盘不被IO占用，以便其他的IO使用空闲的磁盘。基于这一点，RAID 4在RAID 3的基础上，索性将数据量小的IO，全部写入一个磁盘，而不是分散在所有数据盘。这样，在读取数据的时候就有可能不牵动所有的数据盘，而空出其他的数据盘处理其他的IO。

![](http://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/RAID_4.svg/220px-RAID_4.svg.png)

- 缺点：实际上这个想法忽略了一个很重要的问题，就是无论数据盘如何规划，任何一个IO都要动用校验盘，所以校验盘成了热点。相比RAID 3，RAID 4没有提升多少读写性能。

## RAID 5

RAID 4几乎没有价值，但是在RAID 4的思想基础上，针对校验盘是热点盘的问题，人们又发明了RAID 5。RAID 5并没有固定的校验盘，而是将校验数据打散存放到数据盘中。这样，随着数据盘的增多，校验数据将越来越散，并发IO的几率也就越来越高。可以说，RAID 5在性能和可靠性之间找到了极佳的平衡。

![](http://upload.wikimedia.org/wikipedia/commons/thumb/6/64/RAID_5.svg/220px-RAID_5.svg.png)

- 优点：无论是空间效率还是时间效率都达到了极佳
- 缺点：只能允许一块磁盘损坏


## 组合RAID

再发展下去，RAID的思想已经没有本质的改变了，只是优化RAID 5的思想，在可靠性和性能中间取舍。

而且，还可以灵活使用上述的几种RAID进行组合，比如下图的`RAID 1+0`和`RAID 0+1`:

![](http://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/RAID_10.svg/220px-RAID_10.svg.png)

![](http://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/RAID_01.svg/220px-RAID_01.svg.png)

在`RAID 1+0`中，IO首先到达RAID 0控制器，然后被RAID 0控制器分发给下面的两个RAID 1控制器，RAID 1控制器将IO同时写入下面的两个磁盘。可以看到这种模式中，如果有一个磁盘损坏了，`其他的盘都能工作`，不会影响。而4块磁盘实际上只能提供两块磁盘的容量。

在`RAID 0+1`中，IO首先到达RAID 1控制器，这个IO会同时分发给下面的两个RAID 0控制器，而每个RAID 0控制器再写入各自应该的磁盘上。可以看到这种模式中，如果有一个磁盘损坏了，`同一个RAID 0组的磁盘都不能工作了`，不过整体还是不受影响的。而4块磁盘实际上只能提供两块磁盘的容量。

再来看看`RAID 50`，同其他的RAID组合思想一样，RAID 50是如下架构：

![](http://upload.wikimedia.org/wikipedia/commons/9/9d/RAID_50.png)





