---
layout: postlayout
title: 使用cgroups控制进程cpu配额
categories: [Linux]
tags: [Linux]
---

`Linux`下的`cgroups`，全称叫`Control Groups`，最初由Google工程师提出并实现，linux从2.6开始将这个特性纳入内核。cgroups主要对进程按组(`Group`)进行资源配额的控制，包括CPU、内存、IO等，相比古老的`ulimit`，cgroups更为平滑和易用，成为容器技术（比如`docker`）的基础。

# cgroups的形态

![cgroups.png](http://upload-images.jianshu.io/upload_images/42733-472f7f46bb010319.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- `hierarchy`：cgroups从用户态看，提供了一种叫`cgroup`类型的`文件系统(Filesystem)`，这是一种虚拟的文件系统，并不真正保存文件，类似`/proc`。通过对这个文件系统的操作（读，写，创建子目录），告诉内核，你希望内核如何控制进程对资源的使用。文件系统本身是层级的，所以构成了`hierarchy`。
- `task`：进程(`process`)在cgroups中称为task，`taskid`就是`pid`。
- `subsystem`：cgroups支持的所有可配置的资源称为subsystem。例如`cpu`是一种subsystem，`memory`也是一种subsystem。linux内核在演进过程中subsystem是不断增加的。
- `libcgroup`：一个开源软件，提供了一组支持cgroups的应用程序和库，方便用户配置和使用cgroups。目前许多发行版都附带这个软件。

事实上，使用cgroups是非常简单的，几行shell命令就可以。下面以CPU子系统为例，来尝试控制一个进程的CPU利用率。

# 挂载cgroup文件系统

首先挂载cgroup文件系统：

```bash
# mkdir -p /cgroup/mave
# mount -t cgroup -o cpu mave /cgroup/mave
# cat /proc/mounts
...
mave /cgroup/mave cgroup rw,relatime,cpu 0 0
```

上面的命令挂载了一个`cpu`子系统，目录为`/cgroup/mave`，名字叫`mave`。cpu子系统用于控制进程的cpu总体占用率，是最常用的子系统。内核会根据配额的设置在调度进程上做出相应的调整。

观察`/cgroup/mave`目录：

```bash
# ls  /cgroup/mave
cgroup.event_control
cpu.cfs_period_us
cpu.rt_period_us
cpu.shares
notify_on_release
cgroup.procs
cpu.cfs_quota_us
cpu.rt_runtime_us
cpu.stat
release_agent
tasks
```

这些文件是自动创建出来的，且都跟cpu这个子系统有关。不同的子系统会创建出不同的文件。我们重点关注：

- cpu.cfs_period_us
- cpu.cfs_quota_us
- tasks

## tasks

这个文件里面可以写入一个或多个`taskid`(pid)，`/cgroup/mave`这个组中的配额设置将影响这些task。

## cpu.cfs_period_us

```bash
# cat /cgroup/mave/cpu.cfs_period_us
100000
```
表示将cpu时间片分成`100000`份。


## cpu.cfs_quota_us

```bash
# cat /cgroup/mave/cpu.cfs_period_us
200000
```
表示当前这个组中的task(`/cgroup/mave/tasks`中的`taskid`)将分配多少比例的cpu时间片。由于是双核cpu，这里就表示最多可以用到`200%`的CPU。

# 创建一个控制组

尽管根目录(`/cgroup/mave`)也可以设置配额，但是习惯上，我们在这个目录下创建一个目录，作为一个`控制组`，这个控制组可以单独设置配额，而不影响其他`控制组`：

```bash
# mkdir /cgroup/mave/steam
# ls  /cgroup/mave/steam
cgroup.event_control
cpu.cfs_period_us
cpu.rt_period_us
cpu.shares
notify_on_release
cgroup.procs
cpu.cfs_quota_us
cpu.rt_runtime_us
cpu.stat
tasks
```

可以看到，创建的`steam`目录下也会自动创建出一堆cpu子系统相关的文件，几乎和根目录(`/cgroup/mave`)完全一样。现在我们再来理解一下什么是`hierarchy`：

![hierarchy.png](http://upload-images.jianshu.io/upload_images/42733-af5293cac9352c43.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

`hierarchy`就是一个带有继承关系的目录层次，每一层形成一个`控制组`，单独控制其中的task。

> 一个文件系统可以同时挂载多种子系统

# 手动设置配额

采集器进程在不受限制的情况下全速采集，CPU占用率达到`50%`：

![eoic1.png](http://upload-images.jianshu.io/upload_images/42733-d23e49b13c998be8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

将5000写入`cpu.cfs_quota_us`，表示希望CPU占用率控制在(5000/100000=5%)以内：

```bash
# echo 5000 > /cgroup/mave/steam/cpu.cfs_quota_us
```
然后将进程号`30126`写入`tasks`：

```bash
# echo 30126 >> /cgroup/mave/steam/tasks
```
观察cpu占用率，瞬间降到`4%`。

![eoic2.png](http://upload-images.jianshu.io/upload_images/42733-a7db9ce0101ea642.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 自动设置

可以看到，使用cgroups十分简单，效果很好。然而，进程id并不是每次都保持不变。我们需要一些自动化的机制。上文提到过[libcgroup](https://github.com/matsumotory/libcgroup)，这个库提供了挂载、配置和运行的程序和库。

# 附：cgroups中的子系统

- blkio 设置限制每个块设备的输入输出控制。例如:磁盘，光盘以及usb等等。
- cpu 使用调度程序为cgroup任务提供cpu的访问。
- cpuacct 产生cgroup任务的cpu资源报告。
- cpuset 如果是多核心的cpu，这个子系统会为cgroup任务分配单独的cpu和内存。
- devices 允许或拒绝cgroup任务对设备的访问。
- freezer 暂停和恢复cgroup任务。
- memory 设置每个cgroup的内存限制以及产生内存资源报告。
- net_cls 标记每个网络包以供cgroup方便使用。
- ns 名称空间子系统。
- perf_event 增加了对每group的监测跟踪的能力，即可以监测属于某个特定的group的所有线程以及运行在特定CPU上的线程，此功能对于监测整个group非常有用。