---
title: Html5入门教程系列(5)--WebSocket
categories: [web]
tags: [html5]
---

WebSocket允许浏览器和服务器进行双向通信，这在过去是比较难实现的。像聊天、游戏、股票这类实时性较高的应用，特别需要这种技术。从此web实时应用可以摆脱`long-polling`和`插件`了。

## 概述

WebSocket允许浏览器和服务器进行双向通信，这在过去是比较难实现的。在WebSocket出来以前，只能通过一种称为`long-polling`的技术模拟。`webqq`和`微信web版`目前仍然使用这种`long-polling`的方式。这种古老的方式当然不是个好的方案，但是在那个年代只能如此处理。

> `long-polling`要求浏览器利用ajax发起请求，但是服务器并不立刻返回结果，而是等到特定的事件触发后才返回。接着，浏览器继续发起请求，并持续等待。

WebSocket的出现，使得浏览器和服务器得以在TCP之上构建双工通信机制，特别是聊天、游戏、股票这类实时性较高的应用，特别需要这种技术。

WebSocket已经正式标准化为[rfc6455](https://tools.ietf.org/html/rfc6455)。意味着，在较新的浏览器上，可以使用WebSocket。本文就来详细解释一下WebSocket及其原理。

## 什么是全双工

在通信领域全双工是指，在任意时刻，通信双方可以发送数据给另一方。但这在传统的`HTTP`协议中是做不到的。因为HTTP是一种请求响应模型，服务端每次只能响应客户端的一次请求，当服务端完成数据发送后，理论上本次通信结束，TCP链接应当断开。尽管，`Keep-Alive`允许客户端通知服务端保持TCP链接，然而多数场景下，服务端并不会真正保持TCP链接，即使服务端保持跟客户端的TCP链接，只是为了减少每次通信过程的TCP握手时间，通信模式没有本质变化（即服务端无法主动发送数据）。这种模式限制了基于web的实时应用，从而诞生了`ajax long polling`解决方案：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-00.jpg)

`long polling`模式已经在上文和上图中描述过了。尽管是一种解决方案，但是仍然有一些弊端。比如：因为客户端必须先发送请求，服务端才可以发送消息，必然导致实时性不高。另外，数据的交互仍然基于HTTP，所以HTTP头成为了额外的开销，是完全不必要的。

WebSocket协议使全双工通信成为可能，这是由于WebSocket要求通信双方保持TCP长连接，从而，服务端可以在任意时间向客户端发送消息，而不需要客户端先发送请求：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-01.jpg)

## javascript客户端

Html5新增了WebSocket相关的javascript api，这样，我们可以通过javascript使浏览器与支持WebSocket的服务器进行基于WebSocket的通信。作为初学，我们可以先把注意力放在客户端，服务端可以使用公共的[Echo Test服务](http://www.websocket.org/echo.html)。javascript代码如下：

{% highlight html %}

  <!DOCTYPE html>
  <meta charset="utf-8" />
  <title>WebSocket Test</title>
  <script language="javascript" type="text/javascript">

  var wsUri = "ws://echo.websocket.org/";
  var output;

  function init()
  {
    output = document.getElementById("output");
    testWebSocket();
  }

  function testWebSocket()
  {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
  }

  function onOpen(evt)
  {
    writeToScreen("CONNECTED");
    doSend("WebSocket rocks");
  }

  function onClose(evt)
  {
    writeToScreen("DISCONNECTED");
  }

  function onMessage(evt)
  {
    writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data+'</span>');
    websocket.close();
  }

  function onError(evt)
  {
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
  }

  function doSend(message)
  {
    writeToScreen("SENT: " + message);
    websocket.send(message);
  }

  function writeToScreen(message)
  {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    output.appendChild(pre);
  }

  window.addEventListener("load", init, false);

  </script>

  <h2>WebSocket Test</h2>

  <div id="output"></div>

{% endhighlight %}

Echo Test的效果如下：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-08.jpg)

可以看到关键在于使用`websocket = new WebSocket(wsUri);`来初始化一个WebSocket对象，该对象负责完成所有的通信。开发者无需关心具体的协议细节。

下面这个例子，可以实现一个简单web聊天室，服务端采用`python`实现，`python`的服务端实现包含了`WebSocket`的协议细节。可以从[这里](https://github.com/PChou/h5_Traning/tree/master/WebSocket)获取上面这个例子的代码

![](http://pchou.qiniudn.com/h5-presentation-4websocket-02.jpg)

## 协议细节

### 协议层次

WebSocket的协议层次跟HTTP相同，都是基于TCP的，只是WebSocket在握手阶段需要HTTP协助

![](http://pchou.qiniudn.com/h5-presentation-4websocket-03.jpg)

### 地址

与HTTP类似，WebSocket定义了`ws`或者`wss`作为协议，其他部分跟`HTTP`完全相同，例如：

```
ws://echo.websocket.org/
```

### 握手

WebSocket的握手阶段是比较关键的部分，握手过程存在一个从一个协议转化为另一个协议的问题（从http转化为WebSocket）。下图展示了这个握手的过程：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-04.jpg)

1. 客户端首先发送一个HTTP请求，请求头部中
	
	a) `必须`包含`Upgrade: websocket`和`Connection: Upgrade`，这是告诉服务器客户端希望进行协议升级。

	b) 同时客户端随机生成一个16字节的随机值，并用base64编码后保存为Header：`Sec-Websocket-Key: <16-byte nonce, base64 encoded>`

	c) `Sec-Websocket-Version: 13`表明WebSocket的协议版本为13，这是固定值，无需改动。（图中的写法是错误的）

	d) 其他头部为可选

2. 服务端收到这个请求后，返回状态码`101`
	
	a) `必须`包含`Upgrade: websocket`和`Connection: Upgrade`

	b) `Sec-Websocket-Accept`的值是将客户端发来的`Sec-Websocket-Key`进行hash后的结果，具体算法如下。有意思的是`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`这个GUID是固定的

{% highlight javascript %}

base64encode(sha1(Sec-Websocket-Key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11'))

{% endhighlight %}

### 数据帧

为了实现高效的数据通信，WebSocket在具体进行数据收发的时候，采用类似TCP封包的模式，将数据使用简单的头部定义封装后直接发送，免去了HTTP协议中灵活而复杂的HTTP Header，这样在通信过程中实际的数据发送量大大减少，提高了传输的效率，节省了带宽。我们来具体看看封包的方式：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-05.jpg)

这里稍作解释：

1. 首先数据帧分为文本类型和二进制数据类型，这是通过`opcode`来规定的。文本类型为`0x01`，二进制类型为`0x02`。
2. 需要将`Payload(实际的数据)`的长度在开始的若干的字节中表示出来，这样如果数据长度比较大，TCP层分包以后，WebSocket层的实现得以根据长度来组包。
3. 使用MASK标记位说明数据实体是否需要进行掩码处理
4. `Payload`部分如果需要掩码处理，则通过Masking-key（32位）来计算

### 掩码

MASK(掩码)实际上是一种安全措施，Websocket规定，`客户端发送的所有数据帧都需要将数据进行掩码处理`，而服务端发送的数据是不一定要经过掩码处理的。

掩码处理就是使用Masking-key（32位），对Payload数据进行一个异或(XOR)计算。经过计算后Payload的长度不会发生变化。解码端，可以通过同样的异或运算，反推出原始的Payload：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-06.jpg)

由于Masking-key是32位的随机值，所以在进行掩码计算时，是每次将Payload的4个字节拿出来，跟Masking-key进行按位异或运算，得到掩码后的结果，然后取出接下来的4个字节，做同样的处理。上图对这个过程进行了描述，不过上图是按字节来异或的，实际是一样的。类似的代码如下：

{% highlight c %}

for (size_t i = 0; i < payloadLength; i++) {
    frame_buffer[frame_buffer_size] = unmasked_payload[i] ^ mask_key[i % sizeof(uint32_t)];
    frame_buffer_size += 1;
}

{% endhighlight %}

### 其他协议细节

在协议方面还有其他的细节，比如ping包等，可通过[rfc6455](https://tools.ietf.org/html/rfc6455)了解详细。

## 兼容

目前浏览器对WebSocket的支持已经相当可观了：

![](http://pchou.qiniudn.com/h5-presentation-4websocket-07.jpg)

然而，虽然我们在讨论浏览器对Websocket的支持情况，不过不要忘了，作为一个协议而言，客户端并不局限于浏览器，我们完全可以使用其他语言在其他平台上实现基于Websocket的通信。比如，如果一个游戏服务端接口即希望支持移动设备，还希望支持网页游戏，那么采用Websocket作为通信协议是一个可以考虑的选项。


