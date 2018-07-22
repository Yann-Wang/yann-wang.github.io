---
layout: post
title: 'Node.js的异步IO和事件轮询原理'
date: 2016-12-10 
tags: [Event loop, Async IO, Node.js]
---

#### 什么是异步I/O？

>Input and output (I/O) operations on a computer can be extremely slow compared 
to the processing of data. Devices for communication between computers, such as 
modems and network cards, typically perform both input and output operations.

异步非阻塞：在遇到I/O操作时，只将I/O请求发给操作系统，然后继续执行下一条语句。
当操作系统完成I/O操作时，以事件的形式通知执行I/O操作的线程，线程会在特定的时候处理这个事件。

<!-- more -->

####  Node.js/Nginx的事件轮询原理是什么?

event loop主线程负责轮询事件队列，线程池中的线程负责执行其他异步I/O操作
（数据库、文件系统、网络等），当执行完时，更新事件队列中的数据，等待主线程轮询。

#### 轮询技术

当进行非阻塞I/O调用时，要读到完整的数据，应用程序需要进行多次轮询，才能确保读取数据完成，
以进行下一步的操作。轮询技术的缺点在于应用程序要主动调用，会造成占用较多CPU时间片，性能较为低下。
现存的轮询技术有以下这些： read、select、poll、epoll、pselect、kqueue。

read是性能最低的一种，它通过重复调用来检查I/O的状态来完成完整数据读取。

select是一种改进方案，通过对文件描述符上的事件状态来进行判断。

#### epoll

epoll是Linux内核为处理大批量文件描述符而作了改进的poll，
是Linux下多路复用IO接口select/poll的增强版本，它能显著提高程序在大量并发连接中只有少量活跃的
情况下的系统CPU利用率。

另一点原因就是获取事件的时候，它无须遍历整个被侦听的描述符集，
只要遍历那些被内核IO事件异步唤醒而加入Ready队列的描述符集合就行了。

epoll除了提供select/poll那种IO事件的水平触发（Level Triggered）外，
还提供了边缘触发（Edge Triggered），这就使得用户空间程序有可能缓存IO状态，
减少epoll_wait/epoll_pwait的调用，提高应用程序效率。

##### epoll相对于其他多路复用机制（select,poll）的优点：

epoll优点：

1. 支持一个进程打开大数目的socket描述符。
2. IO效率不随FD数目增加而线性下降，传统的select/poll每次调用都会线性扫描全部的集合，导致效率呈现线性下降。
3. 使用mmap加速内核与用户空间的消息传递。无论是select,poll还是epoll都需要内核把FD消息通知给用户空间，如何避免不必要的内存拷贝就很重要，在这点上，epoll是通过内核于用户空间mmap同一块内存实现的。

select和poll的缺点：

1. 每次调用时要重复地从用户态读入参数。
2. 每次调用时要重复地扫描文件描述符。
3. 每次在调用开始时，要把当前进程放入各个文件描述符的等待队列。 在调用结束后,又把进程从各个等待队列中删除。

#### libevent、libev、libuv

##### Libevent是一个事件通知库。 

> The libevent API provides a mechanism to execute a callback function when a specific
 event occurs on a file descriptor or after a timeout has been reached. Furthermore, 
 libevent also support callbacks due to signals or regular timeouts.

> Currently, libevent supports /dev/poll, kqueue(2), event ports, POSIX select(2),
 Windows select(), poll(2), and epoll(4). The internal event mechanism is completely
  independent of the exposed event API, and a simple update of libevent can provide
   new functionality without having to redesign the applications. As a result, 
   Libevent allows for portable application development and provides the most 
   scalable event notification mechanism available on an operating system. 
   Libevent can also be used for multi-threaded applications, either by isolating
    each event_base so that only a single thread accesses it, or by locked access
     to a single shared event_base. Libevent should compile on Linux, *BSD, Mac OS X,
      Solaris, Windows, and more.

> Libevent additionally provides a sophisticated framework for buffered network IO, 
with support for sockets, filters, rate-limiting, SSL, zero-copy file transmission, 
and IOCP. Libevent includes support for several useful protocols, including DNS, 
HTTP, and a minimal RPC framework.

Libevent特点：

1. 事件驱动（event-driven），高性能；
2. 轻量级，专注于网络，不如 ACE 那么臃肿庞大；
3. 源代码相当精炼、易读
4. 跨平台，支持 Windows、Linux、*BSD和 Mac Os；
5. 支持多种 I/O多路复用技术，epoll、poll、dev/poll、select 和kqueue 等；
6. 支持 I/O，定时器和信号等事件；
7. 注册事件优先级；

Libevent 已经被广泛的应用，作为底层的网络库；比如 memcached、 Vomi t、 Nylon、 Netchat等等。

##### libev

> A full-featured and high-performance (see benchmark) event loop that is loosely
 modelled after libevent, but without its limitations and bugs. 
 It is used in GNU Virtual Private Ethernet, rxvt-unicode, auditd, 
 the Deliantra MORPG Server and Client, and many other programs.

features

> Features include child/pid watchers, periodic timers based on wallclock (absolute) time (in addition to timers using relative timeouts), as well as epoll/kqueue/event ports/inotify/eventfd/signalfd support, fast timer management, time jump detection and correction, and ease-of-use.
  It can be used as a libevent replacement using its emulation API or directly embedded into your programs without the need for complex configuration support. A full-featured and well-documented perl interface is also available.
  
##### libuv的发展历史
 
> The node.js project began in 2009 as a JavaScript environment decoupled from
 the browser. Using Google’s V8 and Marc Lehmann’s libev, node.js combined a model 
 of I/O – evented – with a language that was well suited to the style of programming;
  due to the way it had been shaped by browsers. As node.js grew in popularity,
   it was important to make it work on Windows, but libev ran only on Unix. 
   The Windows equivalent of kernel event notification mechanisms like kqueue or 
   (e)poll is IOCP. libuv was an abstraction around libev or IOCP depending 
   on the platform, providing users an API based on libev.
   
在Node.js的0.9.0版本中， libev被从libuv中移除。

原因：

It only supports level-triggered I/O. On Linux, we want to use edge-triggered
 mode - it cuts down the number of syscalls by a substantial margin.

libev's inner loop does a lot of things we don't really need. 
Gutting the inner loop like we did in 649ad50 gave a 40% performance 
increase on some benchmarks.

##### 总结

总之， libevent这个事件轮询库是最先出现的; 然后libev库模仿了libevent库并对它进行了改进和完善; 
最后, libuv在类Unix系统上的事件轮询是使用libev来实现的， 这仅限于Node.js的早期版本； 从Node.js 
0.9.0版本开始， Node.js的libuv库移除了对libev的依赖， 因为libev库缺少libuv的需要的功能，并且部分
libev中的功能在libuv中是用不到的。


<div class="references">References</div>

[libevent](http://libevent.org/)  

[libev](http://software.schmorp.de/pkg/libev.html)

[libuv](http://docs.libuv.org/)

[An Introduction to libuv](https://nikhilm.github.io/uvbook/introduction.html)

