---
layout: postlayout
title: SQL删除重复数据的方法
categories: [open-source]
tags: [database]
---

本文以mysql为例，分享一个用一句SQL删除一张表里面重复数据的思路和方法。

首先我们假设一个场景，一张表里面逻辑上有重复数据的存在：


<table>
  <tbody>
    <tr style="background:#ccc;">
      <td>id</td>
      <td>key</td>
      <td>column1</td>
      <td>column2</td>
    </tr>
    <tr>
      <td>1</td>
      <td>key1</td>
      <td>v1</td>
      <td>v2</td>
    </tr>
    <tr>
      <td>2</td>
      <td>key2</td>
      <td>v1</td>
      <td>v2</td>
    </tr>
    <tr>
      <td>3</td>
      <td>key3</td>
      <td>v1</td>
      <td>v2</td>
    </tr>
    <tr style="background:#E797A6;">
      <td>4</td>
      <td>key1</td>
      <td>v1</td>
      <td>v2</td>
    </tr>
    <tr style="background:#E797A6;">
      <td>5</td>
      <td>key2</td>
      <td>v1</td>
      <td>v2</td>
    </tr>
    <tr>
      <td>6</td>
      <td>key4</td>
      <td>v1</td>
      <td>v2</td>
    </tr>
  </tbody>
</table>

上面的表假设`id`字段是自增的物理主键，而`key`是一个业务上的唯一键，决定了一条数据是否唯一。从上面的数据可以看到，`id`为4和5的两条记录是重复数据，我们需要通过sql删除它。

首先，我们知道通过`group by`和`having`查询可以得到有哪些重复的记录：

{% highlight sql %}

select key from table as a
group by a.key
having count(*) > 1

{% endhighlight %}

这样得到的记录是

key  |
key1 |
key2 |

但此时的问题是，我们需要删除重复的记录，而保留一条。这个结果对于应该删除哪些记录是无从可知的

那么不妨转换一下思路，能否把需要保留的记录先找到呢？我们先查出重复记录里面主键`id`值最小的

{% highlight sql %}

select min(id),key from table as a
group by a.key
having count(*) > 1

{% endhighlight %}

这样得到的记录是

id	| key  |
1	| key1 |
2	| key2 |

这是我们需要保留的，那么哪些是需要删除的呢？就是key与这两条相同的，但是id比他们大的记录。我们先查出来看看：

{% highlight sql %}

select * from table b, (
	select min(id),key from table
	group by key
	having count(*) > 1
) a
where b.key=a.key and b.id > a.id

{% endhighlight %}

结果如下：

id   | key    |   column1 | column2
4    | key1   |   v1   	  | v2
5    | key2   |   v1      | v2

通过子查询和`where`实现的关联查询。上面的`where`条件是重点，通过key关联到的记录，再根据id的大小进行筛选，巧妙的把重复的记录筛选了出来。最后，删除的语句就是把`select`换成`delete`即可。注意删除的时候`delete`后面跟的是别名：


{% highlight sql %}

delete b from table b, (
	select min(id),key from table
	group by key
	having count(*) > 1
) a
where b.key=a.key and b.id > a.id

{% endhighlight %}


