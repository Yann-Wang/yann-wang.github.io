---
layout: post
title: React 16.x中的Fiber Reconciler的一些基本概念
date: 2018-03-21 
tags: [fiber, architecture, reconciler, react, 16.x]
---

#### 什么是reconciler ?
> The algorithm React uses to diff one tree with another to determine which parts need to be changed.

####  fiber reconciler vs stack reconciler
- 区别：fiber reconciler是一个更优秀的协调器实现，用于react 16.x中，相对于react 15.x中的stack reconciler解决了一些痛点
- 相同点：在实现diff算法是基于的假设是一样的
  > Different component types are assumed to generate substantially different trees. React will not attempt to diff them, but rather replace the old tree completely.
  > Diffing of lists is performed using keys. Keys should be "stable, predictable, and unique."

<!-- more -->

#### fiber reconciler的特点
- fiber reconciler的最重要的特点是支持增量渲染：能够把渲染工作切分成块，分散在多个帧中进行
- 其它关键特点：当新更新到来时能够暂停、终止、重用渲染工作；能够给不同类型的更新指定优先级；新的并发基元

#### Reconciliation vs rendering
- reconciler负责计算virtual dom树的哪部分被改变了, rendering负责利用reconciler提供的信息更新对应的渲染目标
- 渲染对象不仅仅可以是dom, 也可以通过React Native渲染到原生的iOS和Android视图上（所以Virtual DOM这个说法是用词不当）
- 所以reconciliation 和 rendering 是两个独立的过程

#### 关于调度的两个概念
- scheduling ： 决定什么时候work应该被执行的过程
- work ： 任何要被执行的计算过程，通常是一个更新结果

#### stack reconciler的改进点
- 在UI方面，没必要每个更新都立即被应用，实际上这样做会导致掉帧并且降低用户体验
- 不同的类型的更新有不同的优先级--一个动画的更新需要比数据存储的更新更快地被完成
- 基于推送的方式需要app决定如何调度工作；基于拉取的方式允许React灵活地自己决定如何调度

#### fiber reconciler要达到的目标
- 暂停work并且可以稍后回来继续work
- 给不同类型的work指定优先级
- 重用之前已经完成的work
- 在work不被需要的时候终止work

#### fiber的数据结构
- fiber是一个Javascript Object，Object中包括组件信息，以及输入输出信息
- 一个fiber对应一个栈帧，但它也对应一个组件的实例

#### fiber数据结构中比较重要的字段
- type: 组件类型
- key: 唯一标识，在reconciliation过程中，用来决定fiber是否可以被重用
- child && sibling : 这两个字段指向其它fiber，描述fiber的递归树结构
  - child: 对应被组件render方法返回的值
  - sibling: 存在于render方法返回多个child的情况
- return: 程序处理完当前fiber后应该返回的fiber
-  pendingProps && memoizedProps
  - pendingProps: 在fiber开始执行时被设置
  - memoizedProps: 在fiber结束执行时被设置
  - 当即将到来的pendingProps等于memoizedProps属性，这标志着fiber之前的output可以被重用，防止不必要的work
- pendingWorkPriority: 一个数字，表明fiber对应的work的优先级,数字越大，表明优先级越低；scheduler根据优先级来选择下一个被执行的work单元
- alternate: 在任何时候，一个组件实例有最多两个fiber对应；当前的fiber 和 work-in-progress的fiber
  - 当前fiber的alternate是work-in-progress，work-in-progress的alternate是当前fiber
- output: 输出会最终被给到renderer来渲染，每个fiber都有输出，这些输出仅仅会在叶子节点被host component创建

源码路径 ./packages/react-reconciler/src/ReactFiber.js  (以下代码来自react 16.3.1版本)

```javascript
  function FiberNode(
    tag: TypeOfWork,
    pendingProps: mixed,
    key: null | string,
    mode: TypeOfMode,
  ) {
    // Instance
    this.tag = tag;
    this.key = key;
    this.type = null;
    this.stateNode = null;

    // Fiber
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;

    this.ref = null;

    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;

    this.mode = mode;

    // Effects
    this.effectTag = NoEffect;
    this.nextEffect = null;

    this.firstEffect = null;
    this.lastEffect = null;

    this.expirationTime = NoWork;

    this.alternate = null;

    if (__DEV__) {
      this._debugID = debugCounter++;
      this._debugSource = null;
      this._debugOwner = null;
      this._debugIsCurrentlyTiming = false;
      if (!hasBadMapPolyfill && typeof Object.preventExtensions === 'function') {
        Object.preventExtensions(this);
      }
    }
  }
```



<div class="references">References</div>

[react 16.3.1](https://github.com/facebook/react/releases/tag/v16.3.2)

[react-fiber-architecture](https://github.com/acdlite/react-fiber-architecture)

[React v16.0](https://reactjs.org/blog/2017/09/26/react-v16.0.html#new-core-architecture)
