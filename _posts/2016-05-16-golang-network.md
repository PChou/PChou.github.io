---
layout: postlayout
title: Golang服务器的网络层实现
categories: [open-source]
tags: [Golang]
---

由于最近有接触到一些长连接的服务器实现，对网络模型有所学习。对基于C/C++的网络模型实现和基于GoLang的实现对比下来，发现Golang的网络模型编程难度大大降低，这得益于Golang的`goroutine`，可以在编程的时候肆无忌惮的创建并发"线程"，当服务器能为每一个客户端都开启若干"线程"的话，编程变的简单很多。

## 传统语言的网络层处理

服务需要同时服务N个客户端，所以传统的编程方式是采用IO复用，这样在一个线程中对N个套接字进行事件捕获，当读写事件产生后再真正`read()`或者`write()`，这样才能提高吞吐：

![](http://pchou.qiniudn.com/2016-05-16-golang-network-00.jpg)

上图中：

- 绿色线程为接受客户端TCP链接的线程，使用阻塞的调用`socket.accept()`，当有新的连接到来后，将`socket`对象`conn`加入IO复用队列。
- 紫色线程为IO复用的阻塞调用，通常采用`epoll`等系统调用实现IO复用。当IO复用队列中的任意`socket`有数据到来，或者写缓冲区空闲时可触发`epoll`调用的返回，否则阻塞`epoll`调用。数据的实际发送和接收都在紫色线程中完成。所以为了提高吞吐，对某个socket的`read`和`write`都应该使用非阻塞的模式，这样才能最大限度的提高系统吞吐。例如，假设正在对某个socket调用阻塞的`write`，当数据没有完全发送完成前，`write`将无法返回，从而阻止了整个`epoll`进入下一个循环，如果这个时候其他的`socket`有读就绪的话，将无法第一时间响应。所以非阻塞的读写将在某个fd读写较慢的时候，立刻返回，而不会一直等到读写结束。这样才能提高吞吐。然而，采用非阻读写将大大提高编程难度。
- 紫色线程负责将数据进行解码并放入队列中，等待工作线程处理；工作线程有数据要发送时，也将数据放入发送队列，并通过某种机制通知紫色线程对应的socket有数据要写，进而使得数据在紫色线程中写入socket。

这种模型的编程难度主要体现在：

1. 线程少（也不能太多），导致一个线程需要处理多个描述符，从而存在对描述符状态的维护问题。甚至，业务层面的会话等都需要小心维护
2. 非阻塞IO调用，使描述符的状态更为复杂
3. 队列的同步处理

不得不说，能用C或C++来写服务器的是真大神！

## Golang的goroutine

`Golang`是一门比较新的语言，正在快速的发展。`Golang`从语言层面支持一种叫`协程`的轻量级线程模型，称为`goroutine`。当我们创建协程时，实际并不会创建操作系统的线程，Golang会使用现有的线程来调度协程。也就是说，从程序员的角度，协程是并发执行的，好像线程一下，而从操作系统的角度来看，程序可能只有几个线程在运行。在同一个应用程序中，协程可以有成千上万个！所以可以有成千上万个并发任务，而这些任务的调度又十分轻量，比线程调度轻量的多的多。所以从程序员的角度，使用Golang就可以在一个应用程序中同时开启成千上万个并发任务。简直逆天！

在Golang中使用`go`关键字来开启一个`goroutine`：

{% highlight go %}

func main() {
	log.Println("Hello, world")

	netListen, err := net.Listen("tcp", "localhost:4000")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Fatal error: %s", err.Error())
		os.Exit(1)
	}

	defer netListen.Close()

	log.Println("Waiting for clients")

	for {
		conn, err := netListen.Accept()
		if err != nil {
			continue
		}

		log.Println(conn.RemoteAddr().String(), " tcp connect success")
		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	...
}

{% endhighlight %}

## Golang的channel

除了对并发的支持外，Golang中有一种叫`channel`的并发同步机制。`channel`类似队列，是`goroutine`安全的。所以结合`goroutine`和`channel`可以轻而易举的实现并发编程。

## Golang如何实现网络层

通过参考多个Golang的开源程序，笔者得出的结论是：肆无忌惮的用`goroutine`吧。于是一个Golang版的网络模型大致是这样的：

![](http://pchou.qiniudn.com/2016-05-16-golang-network-01.jpg)

上图是单个客户端连接的服务器模块结构，同样的一个颜色代表一个协程：

- 绿色`goroutine`依然是接受TCP链接
- 当完成握手`accept`返回`conn`对象后，使用一个单独的`goroutine`来`阻塞读`（紫色），使用一个单独的`goroutine`来`阻塞写`（红色）
- 读到的数据通过解码后放入`读channel`，并由蓝色的`goroutine`来处理
- 需要写数据时，蓝色的`goroutine`将数据写入`写channel`，从而触发红色的`goroutine`编码并写入conn

可以看到，针对一个客户端，服务端至少有3个`goroutine`在单独为这个客户端服务。如果从线程的角度来看，简直是浪费啊，然而这就是协程的好处。这个模型很容易理解，因为跟人们的正常思维方式是一致的。并且都是阻塞的调用，所以无需维护状态。

再来看看多个客户端的情况：

![](http://pchou.qiniudn.com/2016-05-16-golang-network-02.jpg)

在多个客户端之间，虽然用了相同的颜色表示`goroutine`，但实际上他们都是独立的`goroutine`，可以想象`goroutine`的数量将是惊人的。然而，根本不用担心！这样的应用程序可能真正的线程只有几个而已。