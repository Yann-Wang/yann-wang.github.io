---
layout: post
title: 浏览器中的Event Loop
date: 2018-10-20
tags: [event loop, whatwg, w3c, ecmascript, v8]
---

因为网络上关于Event Loop的文章很多，所以先说下这篇文章的卖点：
1. 根据whatwg标准进行讲解
2. 引述ecmascript规范
3. 包括了JSConf.Asia 2018 和 JSConf.EU 2018 中的内容
4. 较多的demo用于验证

<!-- more -->

遍阅网络上的文章，觉得[从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5)这篇文章写得还是相对比较全面的（虽然说仍然有一些点没有讲，比如await和requestIdleCallback）

轻喷下蚂蚁的这篇[Event Loop的规范和实现](https://juejin.im/post/5a6155126fb9a01cb64edb45)，竟然有这么多赞(总感觉不够深入和全面...)

首先说下whatwg vs w3c，为什么优先选用whatwg？
1. whatwg更新更及时
2. w3c的一些内容经常参考whatwg

> The WHATWG was formed in response to the slow development of World Wide Web Consortium (W3C) Web standards and W3C's decision to abandon HTML in favor of XML-based technologies.

上面的这段引文，来自wikipedia，清楚地解释了whatwg的由来。

下面，我们开始~

#### whatwg中关于Event Loop的描述

##### 背景知识
浏览器中的Event Loop有两种，一种是browsing contexts（浏览上下文，下简称BC）中的，另一种是works中的。works中的event loop, 详见[这里](https://html.spec.whatwg.org/multipage/workers.html#worker-event-loop)

Event Loop 中有两种队列，task queue 和 microtask queue

那么哪些是task，哪些是microtask呢？

task包括：同步script，timer的回调函数, UI交互事件的回调函数，I/O操作的回调函数（比如XHR）
microtask包括： Promise, await, MutationObserver

下面我们先讲BC中的Event Loop。考虑到直接讲解标准中的Event Loop模型理解比较困难， 我们先采用简单的讲法。

##### Event Loop 简单模型
每一次事件轮询从开发者的角度看，主要有四个阶段：
1. 执行一个task
2. 执行microtask队列中所有的微任务
3. 更新渲染阶段（可能会执行requestAnimationFrame callback）
4. 当满足条件时（任务队列为空&&微任务队列为空&&没有渲染机会），计算空余时间（可能会执行requestIdleCallback）

然后根据代码逻辑，思考js引擎中执行环境栈、任务队列、微任务队列三者的动态变化过程，然后基本就能得出代码的执行顺序了。

下面是一段代码，大家可以想下日志的打印顺序

> 可直接看[这里](http://event-loop.phoenician.cn/MutationObserver_microtask_substack.html)
> 推荐在chrome和firefox浏览器中执行，requestIdleCallback这个api目前（2018.10.20）在Edge, IE, Safari浏览器中不支持

{% highlight javascript %}

    const dom = document.getElementById('container')

    var config = { attributes: true, childList: true, subtree: true };

    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
            if (mutation.type == 'childList') {
                console.log('MutationObserver event callback')
                setTimeout(() => {
                    console.log('setTimeout callback in MutationObserver')
                })
                Promise.resolve().then(() => {
                    console.log('promise callback in MutationObserver')
                })
            }
        }
    };

    var observer = new MutationObserver(callback);

    observer.observe(dom, config);

    setTimeout(() => {
        console.log('setTimeout callback')
    })

    Promise.resolve().then(() => {
        console.log('promise callback before MutationObserver')
    })

    console.log('before trigger MutationObserver')
    const span = document.createElement('span')
    span.textContent = 'hello'
    dom.appendChild(span)

    const rAF = window.requestAnimationFrame(() => {
        console.log('execute rAF')
    })

    const idle = window.requestIdleCallback(() => {
        console.log('execute requestIdleCallback')
    }, {timeout: 2000})

    Promise.resolve(555).then(() => {
        console.log('promise callback after MutationObserver')
    });

    const dd = async () => {
        console.log('before: await');
        const q = Promise.resolve(55).then(() => {
        console.log('then q')
        });
        await q;
        console.log('after:await q');
        q.then(() => {
        console.log('after:await q then')
        })
    }
    dd();

    setTimeout(() => {
        console.log('disconnect')
        observer.disconnect();
    })
    setTimeout(() => {
        window.cancelAnimationFrame(rAF)
        console.log('calcel rAF')
    })
    setTimeout(() => {
        window.cancelIdleCallback(idle)
        console.log('calcel requestIdleCallback')
    }, 2000)

{% endhighlight %}

参考答案：

```
  before trigger MutationObserver
  before: await
  promise callback before MutationObserver
  MutationObserver event callback
  promise callback after MutationObserver
  then q
  promise callback in MutationObserver
  after:await q
  after:await q then
  execute rAF
  setTimeout callback
  disconnect
  calcel rAF
  setTimeout callback in MutationObserver
  execute requestIdleCallback
  calcel requestIdleCallback
```

需要注意的是```execute rAF```的位置在Safari和Opera浏览器中可能会有不同，因为这两种浏览器把requestAnimationFrame callback的执行时间放在了下一帧的开始，这是不符合标准的。

如果对上面的日志打印顺序有一些疑问，那么可以带着这些疑问继续往下看


下面说下标准中的Event Loop的处理模型

##### 标准中的Event Loop的处理模型
1. 首先将task队列中的第一个任务赋值给oldestTask，如果没有，跳到步骤7
2. 给event loop begin赋值为当前时间；如果event loop end 有值，则 [Report long task](https://w3c.github.io/longtasks/#report-long-tasks)
3. 设置currently running task为oldestTask
4. 执行oldestTask
5. 设置currently running task为null
6. 从task队列中移除oldestTask
7. 执行```a microtask checkpoint```步骤
8. 设置now为当前时间
9. 报告任务的持续时间
10. 更新渲染
11. 如果这是browsing context event loop，并且task队列为空，并且microtask队列为空，并且没有```rendering opportunity```，则对每个Document执行```start an idle period algorithm```步骤，传递Window对象
12. 报告```updating the rendering```步骤的持续时间
13. 设置```event loop end```为当前时间

下面是步骤7, 10, 11, 12的具体执行过程：

###### 执行```a microtask checkpoint```步骤
1. 设置```perform a microtask checkpoint```标志为true
2. 当Event Loop microtask queue不空时：
    1. 设置oldestMicrotask为microtask队列中的第一个任务
    2. 设置Event Loop的```currently running task```为oldestMicrotask
    3. 执行oldestMicrotask
    4. 设置Event Loop的```currently running task```为null
    5. 从microtask队列中移除oldestMicrotask
3. 对于每个```environment settings object```，通知那些```rejected promises```
4. 清理```Indexed Database transations```
5. 设置```perform a microtask checkpoint```标志为false

###### 更新渲染
1. 设置docs为document objects list
2. 如果没有```rendering opportunities```, 则清空docs中的document objects list
3. 如果此次渲染被认为是```Unnecessary rendering```， 则清空docs
4. 如果有其他原因导致浏览器认为可以跳过此次渲染，则清空docs
5. 对于docs中激活的Document， 执行```resize```步骤，将now作为时间戳
6. 对于docs中激活的Document， 执行```scroll```步骤，将now作为时间戳
7. 对于docs中激活的Document， 执行```evaluate media query and report changes```步骤，将now作为时间戳
8. 对于docs中激活的Document， 执行```update animations and send events```步骤，将now作为时间戳
9. 对于docs中激活的Document， 执行```fullscreen```步骤，将now作为时间戳
10. 对于docs中激活的Document， 执行```animation frame callback```步骤，将now作为时间戳
11. 对于docs中激活的Document， 执行```update intersection observations```步骤，将now作为时间戳
12. 对docs中的每个Document，调用```mark paint timing```算法
13. 对于docs中激活的Document, 更新渲染或用户界面

###### ```start an idle period algorithm```步骤
1. 设置last_deadline为上一次空闲时间的截止时间
2. 如果last_deadline大于当前时间，则返回
3. 可选地，如果浏览器决定空闲时间段应该被推迟，则返回
4. 设置now为当前时间
5. 设置deadline为一个将来的时间点，从现在到那个时间点，浏览器期望保持空闲。在浏览器选择deadline时，需要保证即便一个回调函数占用了从now到deadline的全部时间，仍然没有临界的任务被推迟。

    deadline应该被设置为下面几种值中的最小值：
        1. 所有激活的计时器中最近的一个到期时间
        2. 计划中的requestAnimationFrame callback的运行时间
        3. 挂起的内部到期时间，比如下一帧的渲染时间、处理音频或者其他浏览器认为重要的内部任务的到期时间
6. 如果 ```deadline - now``` 大于50ms，那么设置deadline为```now+50ms```
7. 设置pending_list为window的idle request callbacks list
8. 设置run_list为window的runnable idle callbacks list
9. 将pending_list中的所有实体按顺序追加到run_list中
10. 清空pending_list
11. 入队一个任务，该任务的具体步骤在```invoke idle callbacks algorithm```中
12. 将window中的```last idle period deadline```设置为deadline。

###### ```invoke idle callbacks algorithm```步骤
1. 如果浏览器认为应该提前结束这个空闲时间段，由于有了更高优先级的工作，跳到第4步
2. 设置now为当前时间
3. 如果now小于deadline:
    1. 从window的runnable idle callbacks list中退出头部的callback
    2. 设置deadlineArg为IdleDeadline。设置time为deadline，设置timeout为false
    3. 带参数deadlineArg调用callback。如果有未捕获的运行时脚本错误发生，```report the error```。
    4. 如果```runnable idle callbacks list```不空，入队一个任务用来执行```invoke idle callbacks algorithm```步骤
4. 否则，如果```list of idle request callbacks```或者```list of runnable idle callbacks```不空，入队一个任务用以执行```start an idle period algorithm```步骤


###### 报告```updating the rendering```步骤的持续时间
1. 设置```rendering end time```为当前时间
2. 设置```top-level browsing contexts```为docs中所有激活document的top-level browsing contexts集合
3. 执行```Report long tasks```，传递参数```now```，```rendering end time```，```top-level browsing contexts```





<div class="references">References</div>

[1] [event loop spec in whatwg](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
[2] [event loop spec in w3c](https://www.w3.org/TR/2011/WD-html5-20110525/webappapis.html#event-loops)
[3] [Using requestIdleCallback](https://developers.google.com/web/updates/2015/08/using-requestidlecallback)
[4] [Start an idle period algorithm](https://w3c.github.io/requestidlecallback/#start-an-idle-period-algorithm)
[5] [worker event loop](https://html.spec.whatwg.org/multipage/workers.html#worker-event-loop)
[6] [WHATWG](https://en.wikipedia.org/wiki/WHATWG)
[7] [Faster async functions and promises](https://v8.dev/blog/fast-async)
[8] [Philip Roberts: What the heck is the event loop anyway? - JSConf.EU 2014](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
[9] [Jake Archibald: In The Loop - JSConf.Asia 2018](https://www.youtube.com/watch?v=cCOL7MC4Pl0)
[10] [Asynchrony: Under the Hood - Shelley Vohr - JSConf EU 2018](https://www.youtube.com/watch?v=SrNQS8J67zc)
[11] [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
[12] [service workers](https://developers.google.com/web/fundamentals/primers/service-workers/)
[13] [queue a mutation observer compound microtask - Mutation observers in whatwg](https://dom.spec.whatwg.org/#queue-a-mutation-observer-compound-microtask)
[14] [requestIdleCallback](https://github.com/aFarkas/requestIdleCallback)
[15] [从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5)
