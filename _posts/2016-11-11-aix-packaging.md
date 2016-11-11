---
layout: postlayout
title: AIX程序打包
categories: [Linux]
tags: [aix]
---

为了让程序可以在aix上使用smitty安装，需要采用aix下专门的打包工具。

## 打包

首先需要安装打包工具`mkinstallp`。在AIX安装光盘中，安装`bos.adt.insttools`，安装过程中需要在放入光盘1，安装完成后，可以在`/usr/sbin/`下找到`mkinstallp`。

AIX中一个package包含有多个fileset，一个fileset包含有多个需要安装到目标系统中的目录和文件。fileset是最小安装单元，package也可以只有一个fileset。package使用smitty或者installp在目标主机上安装。

我们需要做的关键事情是编写一个template文件，用来描述package和fileset应当包含哪些目标文件、安装依赖、以及自定义脚本等。如果希望安装的文件或目录具有某种特定的所有者或权限，需要在打包的机器上保持相同的所有者和权限。试图通过script来修改文件的权限是无法成功的！不用担心目标机器没有相应的用户或组。你可以在script中创建这些用户和组，安装程序会比较好的处理。

下面是一个template的示例：

```
Package Name: eoic
Package VRMF: 1.1.0.0
Update: N
Fileset
    Fileset Name: eoic.rte
    Fileset VRMF: 1.1.0.0
    Fileset Description: eoic runtime and support files
    Bosboot required: N
    License agreement acceptance required: N
    Include license files in this package: N
    Requisites: *prereq bos.rte.libc 6.1.7.0;*prereq bos.rte.iconv 6.1.7.0;*prereq bos.perf.libperfstat 6.1.7.0;*prereq bos.rte.libpthreads 6.1.7.0
    USRFiles
        /usr/
        /usr/bin
        /usr/bin/eoic
        /etc
        /etc/eoic.master.conf
        /etc/eoic.conf
        /var
        /var/spool
        /var/spool/eoic
        /var/run
        /var/run/eoic
        /var/log
        /var/log/eoic
    EOUSRFiles
    USRLIBLPPFiles
        Post-installation Script: /tmp/eoic_inst/u_post_i.sh
        Unpost-installation Script: /tmp/eoic_inst/u_unpost_i.sh
    EOUSRLIBLPPFiles
    ROOT Part: N
EOFileset

```

这个template描述一个package，其中有一个Fileset，Fileset包含若干需要的目录和文件，安装程序的主要工作就是拷贝这些文件到目标机器，并保持相同的所属用户和权限位。另外，这个template还描述了安装所需要的依赖库。比如`*prereq bos.rte.libc 6.1.7.0`说明了需要目标主机拥有对应版本的c运行库。

值得注意的是，`Post-installation Script`和`Unpost-installation Script`是分别在安装和卸载过程中会执行的脚本。打包程序会将其打包在一起。

我们需要准备一个目录用于存放需要打包的文件和template：

```
mkdir -p ~/eoic/package
```

将需要打包和目录和文件，复制到package目录下，必需按照template中描述的目录来存放。例如`/etc/eoic.conf`需要复制在`~/eoic/package/etc/eoic.conf`。

如上所述，脚本文件`u_post_i.sh` `u_unpost_i.sh`用于指导安装程序在安装和卸载过程中需要执行的额外操作。在打包前，这两个文件需要存放在根目录下，而不是package目录下！这一点很重要，否则将会报找不到文件。例如对于`u_post_i.sh`需要将这个脚本放到跟template描述的相同的位置`/tmp/eoic_inst/u_post_i.sh`，而不是`~/eoic/package/tmp/eoic_inst/u_post_i.sh`。

最后我们可以把template（eoic.tmpl）文件放到package目录下，切换到package目录，并执行：

```
mkinstallp -T eoic.tmpl

Using eoic.tmpl as the template file.
eoic 1.1.0.0 I
processing eoic.rte
creating ./.info/liblpp.a
creating ./tmp/eoic.1.1.0.0.bff

```

`mkinstallp`命令会基于当前目录和`-T`参数指定的模板文件进行打包。最终的果实就是`./tmp/eoic.1.1.0.0.bff`。

> mkinstallp命令也可以通过交互式的方式进行。交互式的方式下来，也会生成模板文件。

## 安装和卸载

安装aix程序可以通过交互式的smitty进行，也可以通过installp命令。为了能反复测试方便。有必要了解一下使用installp安装的方式。进入到eoic.rte所在目录`tmp`


```
installp -acXd . eoic.rte
```

```
...
Finished processing all filesets.  (Total time:  1 secs).

+-----------------------------------------------------------------------------+
                                Summaries:
+-----------------------------------------------------------------------------+

Installation Summary
--------------------
Name                        Level           Part        Event       Result
-------------------------------------------------------------------------------
eoic.rte                    1.1.0.0         USR         APPLY       SUCCESS    
```

`acXd`分别表示`apply` `commit` `Expand filesystem if necessary` `directory`。 `directory`后面的`.`表示rte文件所在的目录。

使用如下命名查看一个已经安装好的软件：

```
lslpp -f eoic.rte
```

```
  Fileset               File
  ----------------------------------------------------------------------------
Path: /usr/lib/objrepos
  eoic.rte 1.1.0.0      /etc
                        /var/log/eoic
                        /usr/bin/eoic
                        /var/spool
                        /var/run/eoic
                        /var/spool/eoic
                        /etc/eoic.conf
                        /usr/bin
                        /var/run
                        /var/log
                        /var
                        /usr/
                        /etc/eoic.master.conf
```

使用如下命令卸载一个软件：

```
installp -u eoic.rte
```

## 总结

aix打包程序相对rpm要简单一些，不过也有些坑。资料很少，需要自己去调试。参考资料如下：


[README.MKINSTALLP](http://www-01.ibm.com/support/docview.wss?uid=isg1710readme961539891)

[Building AIX packages](https://www.djouxtech.net/posts/building-aix-packages/)

[AIX / installp introduction.](http://www.tablespace.net/papers/adminpkg/installp.html)