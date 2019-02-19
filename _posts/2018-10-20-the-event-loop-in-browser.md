---
layout: post
title: 浏览器中的Event Loops
date: 2018-10-20
tags: [event loop, whatwg, w3c, ecmascript, v8]
---

因为网络上关于Event Loops的文章很多，所以先说下这篇文章的卖点：
1. 根据whatwg标准进行讲解
2. 引述ecmascript规范
3. 包括了JSConf.Asia 2018 和 JSConf.EU 2018 中的内容
4. 较多的demo用于验证

<!-- more -->


正式开始之前，先抛个🌰，大家可以体验下

下面是一段代码，可以想下日志的打印顺序

> 可直接看[这里](http://event-loop.phoenician.cn/include_all_situation.html)
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

答案见文末

如果对上面的日志打印顺序有一些疑问，那么可以带着这些疑问继续往下看

首先说下whatwg vs w3c，为什么优先选用whatwg？
1. whatwg更新更及时
2. w3c的一些内容经常参考whatwg

> The WHATWG was formed in response to the slow development of World Wide Web Consortium (W3C) Web standards and W3C's decision to abandon HTML in favor of XML-based technologies.

上面的这段引文，来自wikipedia，清楚地解释了whatwg的由来。

下面，我们开始~

#### whatwg中关于Event Loops的描述

##### 背景知识
浏览器中的Event Loops有两种，一种是browsing contexts（浏览上下文，下简称BC）中的，另一种是works中的。works中的event loop, 详见[这里](https://html.spec.whatwg.org/multipage/workers.html#worker-event-loop)

Event Loops 中有两种队列，task queue 和 microtask queue

那么哪些是task，哪些是microtask呢？

task包括：同步script，timer任务, UI交互任务，网络I/O（XHR），数据库I/O（indexedDB）
microtask包括： Promise, await, MutationObserver

下面我们先讲BC中的Event Loops。考虑到直接讲解标准中的Event Loops模型理解比较困难， 我们先采用简单的讲法。

##### Event Loops 简单模型
每一次事件轮询从开发者的角度看，主要有四个阶段：
1. 执行一个task
2. 执行microtask队列中所有的微任务
3. 更新渲染阶段（当有渲染机会时，会执行requestAnimationFrame callback）
4. 当满足条件时（任务队列为空&&微任务队列为空&&没有渲染机会），计算空余时间（可能会执行requestIdleCallback）

然后根据代码逻辑，思考js引擎中执行环境栈、任务队列、微任务队列三者的动态变化过程，然后基本就能得出代码的执行顺序了。(对于三者的动态变化过程不清楚的，可以看下[dynamic event loops](http://event-loop.phoenician.cn/dynamic_event_loops.html))


下面说下标准中的Event Loops的处理模型

##### 标准中的Event Loops的处理模型
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
11. 如果这是browsing context event loop，并且task队列为空，并且microtask队列为空，并且没有```rendering opportunity```，则对每个Document执行[start an idle period algorithm](https://w3c.github.io/requestidlecallback/#start-an-idle-period-algorithm)步骤，传递Window对象
12. 报告```updating the rendering```步骤的持续时间
13. 设置```event loop end```为当前时间

下面是步骤7, 10, 11, 12的具体执行过程：

###### 执行```a microtask checkpoint```步骤

背景： 有两种microtask：```solitary callback microtasks```(单独的回调函数微任务) 和 ```compound microtasks```（复合微任务）

当microtask都为```solitary callback microtasks```时，按下面步骤执行：

1. 设置```perform a microtask checkpoint```标志为true
2. 当Event Loops microtask queue不空时：
    1. 设置oldestMicrotask为microtask队列中的第一个任务
    2. 设置Event Loops的```currently running task```为oldestMicrotask
    3. 执行oldestMicrotask
    4. 设置Event Loops的```currently running task```为null
    5. 从microtask队列中移除oldestMicrotask
3. 对于每个```environment settings object```，通知那些```rejected promises```
4. 清理```Indexed Database transations```
5. 设置```perform a microtask checkpoint```标志为false

当microtask为```compound microtasks```时，浏览器需要执行```a compound microtask substack```，包括下面的步骤：

1. 设置parent为```currently running task```
2. 设置subtask为一个new task，这个microtask的```task source```为```microtask task source```
3. 设置Event Loops的```currently running task```为subtask
4. 运行subtask
5. 将Event Loops的```currently running task```设置回parent

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

###### ```rendering opportunities```
```Browsing context rendering opportunities```由以下几点决定：
1. 硬件限制，比如显示器刷新频率
2. 为了优化性能，浏览器的节流
3. 页面是否在背景中

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

上面就是WHATWG中的完整的Event Loopss模型了，用如此长的一段文字来描述一个复杂的算法模型，确实让人望而却步，下面我们根据一个个小问题来分别看下Event Loops模型中的各个要点。

#### 一些疑问点

##### timer任务是什么时候加入task queue的？

你可能会说就是其timeout已经到期时，不过关于这个疑问，标准有给出准确的解答， 见[timer initialization steps](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html)。

从代码的执行顺序看， step1 - step14是在主线程执行的，在step14中，timer返回handler，并开始并行执行，也就是说主线程继续执行，而step15 - step18在另一个线程并行执行。

step15-18内容如下:
15. 如果方法上下文是一个Window对象，在跟该方法上下文相关的Document被激活后，再等待timeout毫秒；如果方法上下文是一个WorkerGlobalScope对象，让worker等待timeout毫秒
16. 保持等待，直到该算法的所有调用都已经完成；这些调用有相同方法上下文、在该调用之前开始、并且其timeout等于或小于该调用。
17. 可选，等待一个用户代理定义的时间长度。
18. 将该task放入```task queue```

在step9-13中，有个```timer nesting level```（timer嵌套层级）的概念，timeout的值受到嵌套层级的影响
9. 如果当前运行的任务是被该算法创建的，设置nesting level 为该任务的timer nesting level。否则，设置nesting level为0。
10. 如果timeout小于0，设置timeout为0。
11. 如果nesting level 大于5并且timeout小于4， 设置timeout 为 4。
12. nesting level增加1。
13. 设置任务的timer nesting level为 nesting level。

##### 网络IO任务是什么时候加入队列的?

关于网络IO， 有两个api, XHR和fetch，接下来我们看下标准中是怎么定义的。

在[XMLHttpRequest Standard](https://xhr.spec.whatwg.org/)中，关于[send方法](https://xhr.spec.whatwg.org/#the-send()-method)的描述，在Step11.4中有做规定，对于```process request body```, ```process request end-of-body```, ```process response```等任务都放入```task queue```中执行。

还有一个task是并行执行的，描述如下：
1. 等待，直到请求的done标识被设置，或者
    1. 自这些子步骤启动以来，timeout属性值已经经过了若干毫秒
    2. 同时timeout属性值不是0
2. 如果done标识没有被设置，则设置timeout标识，并终止请求。

在[Fetch Standard](https://fetch.spec.whatwg.org/#main-fetch)中，fetch方法的执行步骤中有关于任务队列的逻辑， 见Step16-23:

16. 如果请求的当前URL的scheme是一个HTTP(S) scheme, 则
    1. 如果请求体已经准备好了，则入队一个```fetch-request-done```任务
    2. 否则，并行，等待请求体，然后入队一个```fetch-request-done```任务
17. 入队一个```fetch task```来处理 response
18. 等待内部响应体
19. 入队一个```fetch task```来处理```response end-of-body```
20. 等待内部响应的tailer（如果有的话），或者等待正在进行的fetch被终止
21. 如果正在进行的fetch被终止，则设置内部响应的tailer failed标识
22. 设置请求的done标识
23. 入队一个```fetch task```来处理```response done```


##### IndexedDB中的都有哪些操作是作为一个task执行的？

onupgradeneeded事件的回调函数是作为一个task执行的， 可见[Opening a database Step10.2](https://www.w3.org/TR/IndexedDB/#opening)

数据库读写操作（get, add, put, remove）和索引操作的回调函数也是作为一个task放入task queue执行的，具体的执行逻辑可见[Asynchronously executing a request](https://www.w3.org/TR/IndexedDB/#async-execute-request)，具体执行步骤如下：

1. 设置transaction为跟源相关联的事务赋值
2. 断言： transaction 为激活的
3. 如果请求没有被给， 设置request为一个新的跟source相关联的请求
4. 增加该request到事务的request list 的最后
5. 并行运行下面的步骤
    1. 等待，直到所有之前增加的请求的done标识都被设置
    2. 设置result为执行操作的结果
    3. 如果result是一个error, 则撤回所有的改变
    4. 入队一个task来运行下面的步骤：
        1. 设置该request的done标识
        2. 如果result是一个error，则：
            1. 设置请求的result为undefined
            2. 设置请求的error为result
            3. 触发一个error 事件
        3. 否则：
            1. 设置请求的result为result
            2. 设置请求的error为undefined
            3. 触发一个success事件
6. 返回该请求。

事务提交的操作（一个IndexedDB内部操作）中也有作为一个task执行的部分，见[Commiting a transaction](https://www.w3.org/TR/IndexedDB-2/#commit-transaction)，该task中包括了触发complete事件的逻辑。

中止事务的操作（一个IndexedDB内部操作）中也有作为一个task执行的部分，见[Aborting a transaction](https://www.w3.org/TR/IndexedDB-2/#abort-transaction)，该task中包括了触发abort事件的逻辑。

##### 为什么MutationObserver属于microtask ？标准模型中没有提到啊

首先说下，关于MutationObserver的Event Loopss标准描述没有在HTML Standard中，而是在[DOM Standard](https://dom.spec.whatwg.org/#mutation-observers)中，下面是标准内容

每个相关的同源```browsing contexts```单元有一个```mutation observer compound microtask```入队标识，该标识的初始值没有被设置。
每个相关的同源```browsing contexts```单元也有一个mutation observer list(0个或更多个MutationObserver对象)，该list初始值为空。

为了排队一个```mutation observer compound microtask```，运行下面的步骤：
1. 如果mutation observer compound microtask入队标识被设置了，返回
2. 设置mutation observer compound microtask入队标识
3. 入队一个compound microtask来通知mutation observers

执行```notify mutation observers```时， 运行下列步骤：
1. 取消mutation observer compound microtask入队标识
2. 设置notifyList为相关的同源browsing contexts单元mutation observer list的一个备份
3. 设置signalList为相关的同源browsing contexts单元signal slot list的一个备份
4. 清空相关的同源browsing contexts单元signal slot list
5. 对于nofityList中的每一个mutation observer，命名为mo，执行一个compound microtask subtask，具体步骤如下：
    1. 设置records为mo的record queue的一个备份
    2. 清空mo的record queue
    3. 对于node list中的每个node节点，移除该节点的registered observer list中所有的[transient registered observers](https://dom.spec.whatwg.org/#transient-registered-observer)
    4. 如果records不空，调用mo的callback。如果这个过程抛了异常，则报告这个异常。
6. 对于signalList中的每个slot，触发一个事件，命名为slotchange，设置事件的bubbles属性为true。


对于入队一个```mutation record```，可以参考[这里](https://dom.spec.whatwg.org/#queueing-a-mutation-record)

ok, 接下来看个demo，可看[MutationObserver_vs_timer](http://event-loop.phoenician.cn/MutationObserver_vs_timer.html)，打开控制台查看执行结果

上面的demo，就是一个MutationObserver microtask跟若干task的执行顺序的问题，需要注意的是script本身就是一个task

接下来，增加一些promise microtask，可查看[MutationObserver_vs_promise](http://event-loop.phoenician.cn/MutationObserver_vs_promise.html)

在此基础上，我们在MutationObserver callback中增加一些microtask和task，可查看[MutationObserver_microtask_substack](http://event-loop.phoenician.cn/MutationObserver_microtask_substack.html) 这就是所谓的复合微任务(compound microtask), 可在上面的```执行a microtask checkpoint步骤```查看

我们知道MutationObserver属于W3C DOM Level 4 Events， 但在之前还有一些事件属于W3C DOM Level 3 Events， 比如DOMNodeInserted事件，这些事件目前大部分浏览器仍然可用，但需要注意DOM3事件的callback执行顺序跟DOM4 callback的执行顺序是不一样的， DOM3事件callback是同步执行的（见demo [DOMNodeInserted](http://event-loop.phoenician.cn/DOMNodeInserted.html)）。

##### 真实click和模拟click的区别

先看一个demo, 可查看[mutation_events_vs_promise](http://event-loop.phoenician.cn/mutation_events_vs_promise.html)

由上面的测试可以看出，真实的click和模拟的click是不一样的。真实的click，其callback是作为一个task，在Event Loopss中执行的，结果符合预期。

而模拟的click方法和两个callback是同步执行的，在两个callback执行完之前，btn.click一直在调用栈中，所以在第一个callback执行完后，会继续执行第二个，因为task queue(同步脚本)还没清空， 此时是不会执行micro task queue的

##### promise 的 callback是何时加入microtask queue的？

先复习下基础，[timer_vs_promise](http://event-loop.phoenician.cn/timer_vs_promise.html)， [promise_wrap_promise](http://event-loop.phoenician.cn/promise_wrap_promise.html)

其中再次强调了同步脚本也是一个task，至于“microtask中创建的microtask会被在下一个task之前执行”这条结论，其实也是按照标准来的，可以参见👆```执行a microtask checkpoint步骤```这一步骤。

下面来解答上面的问题，[when_promise_callback_execute](http://event-loop.phoenician.cn/when_promise_callback_execute.html)

看这个demo就能得到👆问题的答案了， 没错，就是resolve方法被执行之后

##### rendering相关

先回顾一下上面的```更新渲染```阶段。

接下来还是先看一个🌰，[rendering](http://event-loop.phoenician.cn/rendering.html)。经过测试可以发现，上面的例子没有闪屏，因为在event loop到达rendering阶段之前，同步脚本已经执行完了。

另一个🌰，[async_task_is_before_rendering](http://event-loop.phoenician.cn/async_task_is_before_rendering.html)。由于对dom节点css属性的改变会同步执行，异步任务在rendering阶段之前已经执行完了，所以会发现点击button后红色方块没有出现闪屏，点击button2后红色方块只向右平滑移动了100px。

我们继续，先抛出个问题：

###### ```requestAnimationFrame callback``` 在每次Event Loop中都会被执行吗？

答案： absolute not.
我们从标准中的```更新渲染阶段```的描述中得到，只有在有```rendering opportunities```时，才会执行```requestAnimationFrame callback```。我们可以做个实验，下面这个demo, [rAF_in_rendering_stage](http://event-loop.phoenician.cn/rAF_in_rendering_stage.html)，多刷新页面几次会发现，每次的日志打印结果会不一样。```requestAnimationFrame callback```，有时会执行，有时不会。

###### ```requestAnimationFrame callback```执行时间有兼容性问题吗？

答案：目前（2018.11.03）是的。

按照标准的描述（见👆```更新渲染```部分），rAF callback是在渲染、布局、绘制之前执行的，chrome和firefox浏览器的实现都是符合标准的。盗了张图👇

![the position of rAF callback in event loop in chrome and firefox](/assets/img/rAF1.png "the position of rAF callback in event loop in chrome and firefox")


但是在Safari和Edge浏览器中，rAF callback的执行时间是在下一帧的开始(如下图)，这是不符合标准的。

![the position of rAF callback in event loop in safari and edge](/assets/img/rAF2.png "the position of rAF callback in event loop in safari and edge")

我们可以用这个demo去验证下，[rAF_compatibility](http://event-loop.phoenician.cn/rAF_compatibility.html)

在chrome和firefox中，刷新页面，不会出现红色方块闪屏效果，但是在safari和edge中会出现闪屏，这充分说明了上面的描述。

当然我们也期待safari和edge能够修复这个问题。

###### 在Event Loop中，更新渲染阶段之前的多个DOM事件会不会被合并？

答案： 不会。

可以用如下demo验证，[event_trigger_will_not_be_combined_before_rendering](http://event-loop.phoenician.cn/event_trigger_will_not_be_combined_before_rendering.html)

demo中， 对dom进行了10次修改，而MutationObserver callback也被执行了10次。


##### requestIdleCallback 的执行时间点在哪里？

首先说下兼容性：requestIdleCallback这个api只在chrome和firefox浏览器中支持，在safari和edge浏览器中不被支持。

由上面的Event Loops标准模型可知，requestIdleCallback的回调函数可能会在```start an idle period algorithm步骤```中被调用， ```start an idle period algorithm步骤```会在每次轮询的最后阶段被执行，并且有一个前提条件：task queue为空, microtask queue为空, 没有rendering opportunities。

所以idle period所在的位置，大概如下👇

![idle period](/assets/img/idle_period.png "idle period")

下面是一个demo，代码如下，

{% highlight javascript %}

    const span = +location.search.match(/^\?span=(\d+)/)[1] // alternative value: 20, 100, 1000
    setTimeout(() => {
        console.log('setTimeout callback')
    })

    Promise.resolve().then(() => {
        console.log('promise callback before rAF')
    })

    console.log('before trigger rAF')

    const rAF = window.requestAnimationFrame(() => {
        console.log('execute rAF')
    })

    const idle = window.requestIdleCallback(() => {
        console.log('execute requestIdleCallback')
    }, {timeout: 2000})

    const idle2 = window.requestIdleCallback(() => {
        console.log('execute requestIdleCallback 2')
    }, {timeout: 2000})

    Promise.resolve().then(() => {
        console.log('promise callback after MutationObserver')
    })

    setTimeout(() => {
        window.cancelAnimationFrame(rAF)
        console.log('calcel rAF')
    },span)
    setTimeout(() => {
        window.cancelIdleCallback(idle)
        window.cancelIdleCallback(idle2)
        console.log('calcel requestIdleCallback')
    }, 2000)

{% endhighlight %}

代码中变量span 分别取 0, 20, 200时，requestIdleCallback回调函数执行的时间点是不一样的，读者可以自行测试，

在线地址： [span = 0](http://event-loop.phoenician.cn/requestIdleCallback.html?span=0), [span = 20](http://event-loop.phoenician.cn/requestIdleCallback.html?span=20), [span = 200](http://event-loop.phoenician.cn/requestIdleCallback.html?span=200)

测试时建议使用chrome或firefox浏览器，并且建议采用隐身模式(停用所有插件)，以免影响测试结果。

下面给出我的测试结果：
![requestIdleCallback test result](/assets/img/requestIdleCallback_test_result.png "requestIdleCallback test result")

比较后发现span=0、span=20中的'cancel rAF'任务会比两个idle callback先执行；span=200中的'cancel rAF'任务会在两个idle callback后执行。

分析其原因可以发现，'setTimeout callback'和'cancel rAF'之间的时间间隔大小决定了两个idle callback是否执行。span=0、span=20时，时间间隔太小，两个idle callback无法执行；span=200时，时间间隔足够大，远远大于50ms，所以执行两个idle callback。

>ps: 关于'execute rAF'位置不固定的问题，可以不用关心，因为当浏览器没有```rendering opportunities```时，rAF就不会执行。

##### 为什么await是microtask ?

简单来讲，await的操作对象是一个promise，从ECMAScript规范中可以查到，await在执行一个promise时，会入队一个job进入PromiseJobs队列

如果想了解async/await在执行环境中的实际操作步骤，可以参考[下一篇文章](/2018-10-20-the-event-loop-in-browser)。

##### await和promise的先后顺序

执行上下文会有pending状态，await会让当前执行上下文进入pending状态

##### 浏览器中的Event Loops与Ecmascript中的job queue是如何集成在一起的？

待补充...


#### 文章开头demo的参考答案：

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

需要注意的是```execute rAF```的位置在Safari和Edge浏览器中可能会有不同，因为这两种浏览器把requestAnimationFrame callback的执行时间放在了下一帧的开始，这是不符合标准的。


<div class="references">References</div>

[1] [WHATWG, 'HTML Living Standard', 2018. [Online]. Available: https://html.spec.whatwg.org/multipage/webappapis.html#event-loops. [Accessed: 18- Dec- 2018]](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
[2] [W3C, 'HTML Standard', 2011. [Online]. Available: https://www.w3.org/TR/2011/WD-html5-20110525/webappapis.html#event-loops. [Accessed: 18- Dec- 2018]](https://www.w3.org/TR/2011/WD-html5-20110525/webappapis.html#event-loops)
[3] [WHATWG, 'DOM Living Standard', 2018. [Online]. Available: https://dom.spec.whatwg.org/#queue-a-mutation-observer-compound-microtask. [Accessed: 18- Dec- 2018]](https://dom.spec.whatwg.org/#queue-a-mutation-observer-compound-microtask)
[4] [Wikipedia contributors, 'WHATWG', 2018. [Online]. Available: https://en.wikipedia.org/wiki/WHATWG. [Accessed: 18- Dec- 2018]](https://en.wikipedia.org/wiki/WHATWG)
[5] [Maya Lekova, 'Faster async functions and promises', 2018. [Online]. Availabel: https://v8.dev/blog/fast-async. [Accessed: 18- Dec- 2018]](https://v8.dev/blog/fast-async)
[6] [Philip Roberts, 'What the heck is the event loop anyway? - JSConf.EU 2014', 2014. [Online]. Available: https://www.youtube.com/watch?v=8aGhZQkoFbQ. [Accessed: 18- Dec- 2018]](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
[7] [Jake Archibald, 'In The Loops - JSConf.Asia 2018', 2018. [Online]. Availabel: https://www.youtube.com/watch?v=cCOL7MC4Pl0. [Accessed: 18- Dec- 2018]](https://www.youtube.com/watch?v=cCOL7MC4Pl0)
[8] [Shelley Vohr, 'Asynchrony: Under the Hood - JSConf EU 2018', 2018, [Online]. Available: https://www.youtube.com/watch?v=SrNQS8J67zc. [Accessed: 18- Dec- 2018]](https://www.youtube.com/watch?v=SrNQS8J67zc)
[9] [MDN contributors, 'Using Web Workers', 2018. [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers. [Accessed: 18- Dec- 2018]](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
[10] [Matt Gaunt, 'service workers', 2018. [Online]. Available: https://developers.google.com/web/fundamentals/primers/service-workers/. [Accessed: 18- Dec- 2018]](https://developers.google.com/web/fundamentals/primers/service-workers/)
[11] [Paul Lewis, 'Using requestIdleCallback', 2015. [Online]. Available: https://developers.google.com/web/updates/2015/08/using-requestidlecallback. [Accessed: 18- Dec- 2018]](https://developers.google.com/web/updates/2015/08/using-requestidlecallback)
[12] [Alexander Farkas, 'requestIdleCallback', 2016. [Online]. Available: https://github.com/aFarkas/requestIdleCallback. [Accessed: 18- Dec- 2018]](https://github.com/aFarkas/requestIdleCallback)
[13] [Yang JingZhuo, '从event loop规范探究javaScript异步及浏览器更新渲染时机', 2017. [Online]. Available: https://github.com/aooy/blog/issues/5. [Accessed: 18- Dec- 2018]](https://github.com/aooy/blog/issues/5)
[14] [Jake Archibald, 'Tasks, microtasks, queues and schedules', 2015. [Online]. Available: https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/?utm_source=html5weekly. [Accessed: 08- Jan- 2019]](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/?utm_source=html5weekly)

