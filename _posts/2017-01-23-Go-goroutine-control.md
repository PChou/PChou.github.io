---
layout: postlayout
title: Go编程技巧--Goroutine的优雅控制
categories: [Go]
tags: [Go]
---

`Goroutine`是Go语言最重要的机制，`Goroutine`将复杂的需要异步的IO调用抽象成同步调用，符合人类正常的顺序思维，极大的简化了IO编程的难度。如同线程一样，对`Goroutine`既要掌握基本的用法，更要很好的控制`Goroutine`的退出机制。本文介绍一种`Goroutine`的退出思路。

通常`Goroutine`会因为两种情况阻塞：

1. IO操作，比如对`Socket`的`Read`。
2. `channel`操作。对一个chan的读写都有可能阻塞`Goroutine`。

对于情况1，只需要关闭对应的描述符，阻塞的`Goroutine`自然会被唤醒。

重点讨论情况2。并发编程，`Goroutine`提供一种`channel`机制，`channel`类似管道，写入者向里面写入数据，读取者从中读取数据。如果`channel`里面没有数据，读取者将阻塞，直到有数据；如果`channel`里面数据满了，写入者将因为无法继续写入数据而阻塞。

如果在整个应用程序的生命周期里，writer和reader都表现为一个`Goroutine`，始终都在工作，那么如何在应用程序结束前，通知它们终止呢？在Go中，并不推荐像abort线程那样，强行的终止`Goroutine`。因此，抽象的说，必然需要保留一个入口，能够跟writer或reader通信，以告知它们终止。

我们先看reader。我们首先可以想到，利用`close`函数关闭正在读取的`channel`，从而可以唤醒reader，并退出。但是考虑到`close`并不能很好的处理writer（因为writer试图写入一个已经close的channel，将引发异常）。因此，我们需要设计一个额外的只读`channel`用于通知：

```
type routineSignal struct {
	done <-chan struct{}
}
```

`routineSignal`的实例，应当通过外部生成并传递给reader，例如：

```
func (r *reader)init(s *routineSignal) {
	r.signal = s
}
```


在reader的循环中，就可以这么写：

```
func (r *reader)loop() {
	for {
		select {
		case <-r.signal.done:
			return
		case <-r.queue:
			....
		}
	}
}
```

当需要终止`Goroutine`的时候只需要关闭这个额外的`channel`：

```
close(signal.done)
```

看起来很完备了，这可以处理大部分的情况了。这样做有个弊端，尽管，我们可以期望`close`唤醒`Goroutine`进而退出，但是并不能知道`Goroutine`什么时候完成退出，因为`Goroutine`可能在退出前还有一些善后工作，这个时候我们需要`sync.WaitGroup`。改造一下`routineSignal`：

```
type routineSignal struct {
	done chan struct{}
	wg   sync.WaitGroup
}
```

增加一个sync.WaitGroup的实例，在`Goroutine`开始工作时，对wg加1，在`Goroutine`退出前，对wg减1：

```
func (r *reader)loop() {
	r.signal.wg.Add(1)
	defer r.signal.wg.Done()
	for {
		select {
		case <-r.signal.done:
			return
		case <-r.queue:
			....
		}
	}
}
```

外部，只需要等待`WaitGroup`返回即可：

```
close(signal.done)
signal.wg.Wait()
```

只要`Wait()`返回就能断定`Goroutine`结束了。

推导一下，不难发现，对于writer也可以采用这种方法。于是，总结一下，我们创建了一个叫`routineSignal`的结构，结构里面包含一个`chan`用来通知`Goroutine`结束，包含一个`WaitGroup`用于`Goroutine`通知外部完成善后。这样，通过这个结构的实例优雅的终止`Goroutine`，而且还可以确保`Goroutine`终止成功。

