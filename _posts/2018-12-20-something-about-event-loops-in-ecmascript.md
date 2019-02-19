---
layout: post
title: Ecmascript中的与Event Loops相关的一些内容
date: 2018-12-20
tags: [ecmascript, event loops]
---

事情的起因是这样的，一直很好奇，async/await语句在runtime中是怎么执行的，于是便查阅了Ecmascript标准文档，下面我们由此展开。

<!-- more -->

#### async和await的执行过程

![AsyncFunctionStart](/assets/img/AsyncFunctionStart.png "AsyncFunctionStart")

如图，在[25.7.5.1 AsyncFunctionStart](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-async-functions-abstract-operations-async-function-start)中，```running execution context```被复制了一份命名为asyncContext（step1-2），并推入了```execution context stack```中(step4)，所以asyncContext为当前的执行环境，当asyncContext被执行时，首先计算```asyncFunctionBody```，然后asyncContext会被移除出执行环境栈，并把当前栈顶的执行环境作为```running execution context```(step3)，此时恢复被挂起的asyncContext，并将返回值赋值给result(step5)。

下面我们看下await的执行过程

![Await](/assets/img/Await.png "Await")

#### promise相关的调用链

如上图，在[6.2.3.1 Await](https://www.ecma-international.org/ecma-262/9.0/index.html#await)中，在step10中，会执行```PerformPromiseThen```方法，该方法的执行过程如下

![PerformPromiseThen](/assets/img/PerformPromiseThen.png "PerformPromiseThen")

由上图中的PerformPromiseThen依次找下去，得到了下面一张调用关系图

![promiseInternalPrinciple](/assets/img/PromiseInternalPrinciple.png "promiseInternalPrinciple")

其中，各个节点的原文地址如下：
[Promise constructor](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-promise-executor)
[PromiseResolveThenableJob](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-promiseresolvethenablejob)
[CreateResolvingFunction](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-createresolvingfunctions)
[Promise Resolve Functions](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-promise-resolve-functions)
[Promise Reject Functions](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-promise-reject-functions)
[FulfillPromise](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-fulfillpromise)
[RejectPromise](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-rejectpromise)
[TriggerPromiseReactions](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-triggerpromisereactions)
[PerformPromiseThen](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-performpromisethen)

在上图的最后一步，都会执行```EnqueueJob```方法，该方法对应的执行逻辑如下

#### EnqueueJob

![EnqueueJob](/assets/img/EnqueueJob.png "EnqueueJob")

如上图，在[8.4.1](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-enqueuejob)中，该方法会把对应的PromiseReactionJob或PromiseResolveThenableJob放入```Job Queue```中（step9）

#### Job Queue

说到```Job Queue``，标准中有如下描述：

![JobQueue](/assets/img/JobQueue.png "JobQueue")

![JobQueue2](/assets/img/JobQueue2.png "JobQueue2")

如上，在[8.4](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-jobs-and-job-queues)中，```Job```被定义为一个抽象操作，该操作用来初始化一个ECMAScript计算。

一个```Pending Job```是一个对将来要执行的Job的请求。

一个```Job Queue```是一个```PendingJob record```的先进先出队列。每个```Job Queue```都有一个名字和一个可用的```Job Queue```集合；并且被一种ECMAScript实现所定义。每个ECMAScript实现都至少有两种```Job Queues```，一种是```ScriptJobs```，另一种是```PromiseJobs```。

```ScriptJobs```用于校验和计算ECMAScript脚本和Module源文本。

```PromiseJobs```用于响应Promise语句。

关于```Job Queues```的执行时间，上面也有描述： 当没有正在运行的执行环境，并且执行环境栈为空时，ECMAScript实现移除```Job Queue```中的第一个```PendingJob```，以此创建一个执行环境，并开始执行相关联的Job抽象操作。

#### RunJobs

关于这些Job是怎么执行的，标准中有如下描述：

![RunJobs](/assets/img/RunJobs.png "RunJobs")
![Suspend](/assets/img/Suspend.png "Suspend")

如上，在[8.6](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-runjobs)和[24.4.1.9](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-suspend)中，描述了```ScriptJobs```的执行过程。

1. 首先执行宿主定义的区域初始化
2. 获取ECMAScript源文本，如果该源文本是一个```script```的源代码，则执行一个入队操作，将```ScriptEvaluationJob```推入```Job Queue```；如果该源文本是一个```module```的源代码，则将```TopLevelModuleEvaluationJob```推入```Job Queue```。
3. 重复：
    1. 挂起```running execution context```，并从执行环境栈移除他
    2. 断言：执行环境栈现在是空的
    3. 设置nextQueue为一个非空的```Job Queue```，其选择的方式由宿主实现来决定。如果所有的```Job Queue```都是空，则结果由宿主实现来决定。
    4. 设置nextPending为nextQueue前端的```PendingJob record```，并从nextQueue中移除```PendingJob record```。
    5-8. 初始化newContext
    9. 将newContext推入执行环境栈；newContext现在为```running execution context```。
    10. 使用nextPending来执行任何实现或宿主环境定义的job初始化。
    11. 设置result为nextPending.[[Job]]的执行结果。

在[24.4.1.9](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-suspend)中，描述了```Suspend```的执行过程。

Suspend(WL, W, timeout)
WL: a WaiterList
W: an agent signifier
timeout: 非负、非NaN数字

1. 断言：正在调用的agent在WL的临界区
2. 断言：W与AgentSignifier相等
3. W在WL的等待列表中
4. AgentCanSuspend()为true
5. 执行```LeaveCriticalSection(WL)```，并且挂起W，直到timeout毫秒为止；当一个通知在临界区退出后但挂起生效之前到达时，执行被合并的操作。W可以因为timeout到期被通知，或者因为被另一个agent调用NotifyWaiter显式通知，不会因为其他原因。
6. 执行EnterCriticalSection(WL)
7. 如果W被显式通知，返回true
8. 返回false。


#### Execution Contexts

一个```execution context```是一个标准设备，被ECMAScript实现用来记录运行时的代码执行。在任何一个时间点，每个agent有最多一个执行环境，即```running execution context```。

```execution context stack```被用于记录执行环境。```running execution context```总是这个栈的顶部元素。当控制从与当前执行环境相关联的可执行代码转移到与当前执行环境无关的可执行代码时，一个新的执行环境会被创建。

![ExecutionContexts](/assets/img/ExecutionContexts.png "ExecutionContexts")

如上图，在[8.3](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-execution-contexts)中，列出了所有执行环境的状态组件：
1. ```code evaluation state```:
2. ```Function```
3. ```Realm```
4. ```ScriptOrModule```

对于ECMAScript code的执行环境，还有额外的两个状态组件：
1. ```LexicalEnvironment```
2. ```VariableEnvironment```

对于Generator执行环境，还有额外的一个状态组件：
1. Generator


上面的状态对象中有提到Realm， 下面我们详细说下什么是Realm

#### Realm

在代码执行之前，所有的ECMAScript code必须关联一个realm。从概念上说，一个realm包括一个内置对象的集合，一个ECMAScript全局环境，被导入到全局环境的所有ECMAScript code，以及其它被关联的状态和资源。

一个realm在该标准中表示一个```Realm Record```，一个```Realm Record```有如下指定字段：
1. ```[[Intrinsics]]```： 一个内置对象的集合
2. ```[[GlobalObject]]```： 全局对象
3. ```[[GlobalEnv]]```： 全局环境
4. ```[[TemplateMap]]```： 模板对象
5. ```[[HostDefined]]```： 宿主环境保留的字段，需要关联```Realm Record```的其他信息。

