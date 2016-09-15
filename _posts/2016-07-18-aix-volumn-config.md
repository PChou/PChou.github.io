---
layout: postlayout
title: AIX配置Volumn
categories: [Linux]
tags: [aix]
---


我们知道，现在操作系统都具有默认的卷管理系统来管理磁盘。详见[存储技术之卷管理和文件系统](http://www.pchou.info/ssstorageInDeep/2014-09-27-storage-vm-fs.html)。总体来说，从下向上分为物理磁盘(PV)、逻辑卷组(VG)、逻辑卷(LV)，用户可以直接`mount`的是逻辑卷。本文记录一些`AIX`下的卷管理和配置方法。

## AIX下的Volumn Manager

- 一个PV只能属于一个VG，无法将一个PV切分成多个PV，隶属于不同的VG；而一个VG却可以包含多个PV
- 一个VG可以被分出多个LV，LV在格式化后才可以被`mount`
- AIX的文件系统称为`jfs2`

架构类似这个图：

![](http://www.reader8.cn/uploadfile/jiaocheng/201401101/2917/2014012901170942771.png)

在AIX中，物理磁盘对应的文件为`/dev/hdiskN`，其中N从0开始，通过如下命令可以查看磁盘：

```
# lsdev -Cc disk
hdisk0 Available 09-08-00-4,0 Other SCSI Disk Drive

# lspv
hdisk0   00c88e8bb22265c4   rootvg  active   
```

可使用`cfgmgr`命令扫描新的硬件设备

## AIX下配置卷管理

1) 通过`mkvg`命令创建一个VG，并管理一个hdisk，由于一个PV只能属于一个VG，所以已经被划分到其他VG的hdisk无法再次分配。例如：

```
# mkvg -y myvg hdisk2
```

上面的命令创建了一个名叫`myvg`的VG，并将hdisk2全部划分用于`myvg`。此时你可以通过如下命令查看磁盘的使用情况：

```
# lspv hdisk2
PHYSICAL VOLUME:    hdisk2                   VOLUME GROUP:     myvg
PV IDENTIFIER:      00c88e8bb22265c4 VG IDENTIFIER     00cc83af00004c0000000155d675eded
PV STATE:           active                                     
STALE PARTITIONS:   0                        ALLOCATABLE:      yes
PP SIZE:            128 megabyte(s)          LOGICAL VOLUMES:  13
TOTAL PPs:          546 (69888 megabytes)    VG DESCRIPTORS:   2
FREE PPs:           23 (2944 megabytes)      HOT SPARE:        no
USED PPs:           523 (66944 megabytes)    MAX REQUEST:      256 kilobytes
FREE DISTRIBUTION:  00..00..00..00..23                         
USED DISTRIBUTION:  110..109..109..109..86                     
MIRROR POOL:        None                       
```
注意上面的输出中有个`PP`的概念，PP大小为128M，而整个磁盘总共多少个PP，以及已使用的PP都可以看到。

2) 现在，可以在`VG`的基础上创建`LV`。使用`mklv`命令即可，在创建时还需要指定文件系统类型。`jfs2log`和`jfs2`一个用于日志类型的文件系统，一个用于普通的文件系统。

```
# mklv -t jfs2log myvg 1
# mklv -t jfs2 -y mylv1 myvg 30G
```

如上，有两种指定`LV`大小的方法，一个是指定1个PP的大小，另一个是指定30G大小。

使用`lsvg`查看VG的分配情况，下面是该命令的输出样例：

```
# lsvg rootvg
VOLUME GROUP:       rootvg                   VG IDENTIFIER:  00cc83af00004c0000000155d675eded
VG STATE:           active                   PP SIZE:        128 megabyte(s)
VG PERMISSION:      read/write               TOTAL PPs:      546 (69888 megabytes)
MAX LVs:            256                      FREE PPs:       23 (2944 megabytes)
LVs:                13                       USED PPs:       523 (66944 megabytes)
OPEN LVs:           12                       QUORUM:         2 (Enabled)
TOTAL PVs:          1                        VG DESCRIPTORS: 2
STALE PVs:          0                        STALE PPs:      0
ACTIVE PVs:         1                        AUTO ON:        yes
MAX PPs per VG:     32512                                     
MAX PPs per PV:     1016                     MAX PVs:        32
LTG size (Dynamic): 256 kilobyte(s)          AUTO SYNC:      no
HOT SPARE:          no                       BB POLICY:      relocatable 
PV RESTRICTION:     none                     INFINITE RETRY: no

# lsvg -l rootvg
rootvg:
LV NAME             TYPE       LPs     PPs     PVs  LV STATE      MOUNT POINT
hd5                 boot       1       1       1    closed/syncd  N/A
hd6                 paging     4       4       1    open/syncd    N/A
hd8                 jfs2log    1       1       1    open/syncd    N/A
hd4                 jfs2       2       2       1    open/syncd    /
hd2                 jfs2       19      19      1    open/syncd    /usr
hd9var              jfs2       4       4       1    open/syncd    /var
hd3                 jfs2       1       1       1    open/syncd    /tmp
hd1                 jfs2       1       1       1    open/syncd    /home
hd10opt             jfs2       4       4       1    open/syncd    /opt
hd11admin           jfs2       1       1       1    open/syncd    /admin
fwdump              jfs2       3       3       1    open/syncd    /var/adm/ras/platform
livedump            jfs2       2       2       1    open/syncd    /var/adm/ras/livedump
hddata              jfs2       480     480     1    open/syncd    N/A

```

3) 格式化LV。格式化时需要指定一个日志设备，可以用刚刚创建的日志类型的LV对应的dev设置名，或者使用一个已经存在的日志设备。（已存在的日志设备可能需要是同一个VG的，这个没有验证过）

```
# mkfs -o log=/dev/loglv00 -V jfs2 /dev/mylv1
```

4) 最后，挂在LV：

```
# mount -o log=/dev/loglv00 /dev/mylv1 /myfs1
```

参考

[How to Add a Disk on AIX LVM](http://www.unixmantra.com/2013/04/how-to-add-disk-on-aix-lvm.html)