---
layout: post
title: 源码解读React 15.x 中的reconciler实现 && diff算法原理解析
date: 2018-03-10 
tags: [diff, algorithm, react, 15.x]
---

#### 什么是reconciler ？
- 一个协调器，涉及到组件的挂载、卸载、更新等相关过程
- 而diff算法就用在组件更新的过程中

<!-- more -->
下面来看下react 15.6.2中reconciler的具体实现逻辑（15.6.2是15.x中的最后一个版本，下文中的所有代码也都展示该版本的代码）

源码路径 ./src/renderers/shared/stack/reconciler/ReactReconciler.js

```javascript
  var ReactReconciler = {
    // 初始化组件，渲染标签，注册事件监听器
    mountComponent: function(
      internalInstance,
      transaction,
      hostParent,
      hostContainerInfo,
      context,
      parentDebugID, // 0 in production and for roots
    ) {
      // __DEV__逻辑
      var markup = internalInstance.mountComponent(
        transaction,
        hostParent,
        hostContainerInfo,
        context,
        parentDebugID,
      );
      if (
        internalInstance._currentElement &&
        internalInstance._currentElement.ref != null
      ) {
        transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
      }
      // __DEV__逻辑
      return markup;
    },

    /**
    * Returns a value that can be passed to
    * ReactComponentEnvironment.replaceNodeWithMarkup.
    */
    getHostNode: function(internalInstance) {
      return internalInstance.getHostNode();
    },

    // 释放被mountComponent分配的资源
    unmountComponent: function(internalInstance, safely) {
      // __DEV__逻辑
      ReactRef.detachRefs(internalInstance, internalInstance._currentElement);
      internalInstance.unmountComponent(safely);
      // __DEV__逻辑
    },

    // 用新元素更新一个组件
    receiveComponent: function(
      internalInstance,
      nextElement,
      transaction,
      context,
    ) {
      var prevElement = internalInstance._currentElement;

      if (nextElement === prevElement && context === internalInstance._context) {
        // 因为在owner被渲染之后，元素是不可变的，我们可以做一个简单的身份比较来决定是否这是一个多余的协调过程。
        // It's possible for state to be mutable but such
        // change should trigger an update of the owner which would recreate
        // the element. We explicitly check for the existence of an owner since
        // it's possible for an element created outside a composite to be
        // deeply mutated and reused.

        return;
      }

      // __DEV__逻辑

      var refsChanged = ReactRef.shouldUpdateRefs(prevElement, nextElement);

      if (refsChanged) {
        ReactRef.detachRefs(internalInstance, prevElement);
      }

      internalInstance.receiveComponent(nextElement, transaction, context);

      if (
        refsChanged &&
        internalInstance._currentElement &&
        internalInstance._currentElement.ref != null
      ) {
        transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
      }

      // __DEV__逻辑
    },

    // 执行组件中的更新
    performUpdateIfNecessary: function(
      internalInstance,
      transaction,
      updateBatchNumber,
    ) {
      if (internalInstance._updateBatchNumber !== updateBatchNumber) {
        // The component's enqueued batch number should always be the current
        // batch or the following one.
        warning(......);
        return;
      }
      // __DEV__逻辑
      internalInstance.performUpdateIfNecessary(transaction);
      // __DEV__逻辑
    },
  };

```
#### 标题为什么要强调是15.x版本 ？
- 15.x中的reconciler实现是基于stack的，而16.x中的reconciler则是使用的fiber架构，在实现上与15.x有些不同
- 虽说15.x和16.x中reconciler的实现方式有所不同，但是diff算法的实现所基于的假设是一致的

#### 什么是diff算法 ？
- 用来比较两个dom树以决定哪些部分需要被改变

#### diff算法用在哪里?
- diff算法用在reconciler的实现逻辑中

#### 时间复杂度为O(n)的diff算法所基于的三个假设
- DOM节点中跨层级的移动操作特别少，可以忽略不计
- 不同类型的两个元素，会产生不同的dom树
- 对于同一层级的一组子节点，它们可以通过唯一key进行区分

基于以上假设，React分别对tree diff, component diff和element diff进行了算法优化。

#### tree diff
- 基于假设一，React通过updateDepth对virtual dom树进行层级控制，只会对相同层级的dom节点进行比较。如果发现tree的根节点已经不一致时，则该节点包括其所有子节点都会被删掉。

#### component diff
- 如果是同一类型的组件，按照原策略继续比较该组件中的各级子节点
- 如果不是，则判断为dirty component ， 将替换整个组件下的所有节点
- 对于同一类型的组件，有可能virtual dom没有任何变化，如果能确定这点，就可以节省大量的diff运算时间。因此，React允许用户通过shouldComponentUpdate()来判断该组件是否需要进行diff算法分析。

源码路径 ./src/renderers/shared/stack/reconciler/ReactCompositeComponent.js

```javascript
var ReactCompositeComponent = {
  // ...
  receiveComponent: function(nextElement, transaction, nextContext) {
    var prevElement = this._currentElement;
    var prevContext = this._context;

    this._pendingElement = null;

    this.updateComponent(
      transaction,
      prevElement,
      nextElement,
      prevContext,
      nextContext,
    );
  },
  updateComponent: function(
    transaction,
    prevParentElement,
    nextParentElement,
    prevUnmaskedContext,
    nextUnmaskedContext,
  ) {
    var inst = this._instance;
    // invariant(......);

    var willReceive = false;
    var nextContext;

    // Determine if the context has changed or not
    if (this._context === nextUnmaskedContext) {
      nextContext = inst.context;
    } else {
      nextContext = this._processContext(nextUnmaskedContext);
      willReceive = true;
    }

    var prevProps = prevParentElement.props;
    var nextProps = nextParentElement.props;

    // Not a simple state update but a props update
    if (prevParentElement !== nextParentElement) {
      willReceive = true;
    }

    // An update here will schedule an update but immediately set
    // _pendingStateQueue which will ensure that any state updates gets
    // immediately reconciled instead of waiting for the next batch.
    if (willReceive && inst.componentWillReceiveProps) {
      if (__DEV__) {
        // __DEV__逻辑
      } else {
        inst.componentWillReceiveProps(nextProps, nextContext);
      }
    }

    var nextState = this._processPendingState(nextProps, nextContext);
    var shouldUpdate = true;

    if (!this._pendingForceUpdate) {
      if (inst.shouldComponentUpdate) {
        if (__DEV__) {
          // __DEV__逻辑
        } else {
          shouldUpdate = inst.shouldComponentUpdate(
            nextProps,
            nextState,
            nextContext,
          );
        }
      } else {
        if (this._compositeType === CompositeTypes.PureClass) {
          shouldUpdate =
            !shallowEqual(prevProps, nextProps) ||
            !shallowEqual(inst.state, nextState);
        }
      }
    }

    // __DEV__逻辑

    this._updateBatchNumber = null;
    if (shouldUpdate) {
      this._pendingForceUpdate = false;
      // Will set `this.props`, `this.state` and `this.context`.
      this._performComponentUpdate(
        nextParentElement,
        nextProps,
        nextState,
        nextContext,
        transaction,
        nextUnmaskedContext,
      );
    } else {
      // If it's determined that a component should not update, we still want
      // to set props and state but we shortcut the rest of the update.
      this._currentElement = nextParentElement;
      this._context = nextUnmaskedContext;
      inst.props = nextProps;
      inst.state = nextState;
      inst.context = nextContext;
    }
  },
  // ...
}
```

执行上面的代码是建立在组件是同一类型组件的基础上的，上面的主要逻辑是：先执行生命周期钩子函数componentWillReceiveProps和shouldComponentUpdate，通过后才执行_performComponentUpdate方法（update具体逻辑）,该方法执行部分声明周期钩子函数后再执行_updateRenderedComponent方法，最后，该方法会调用ReactReconciler.receiveComponent方法, 在做DOMComponent子节点的更新时，会调用ReactDOMComponent。receiveComponent方法。

源码路径 ./src/renderers/dom/shared/ReactDOMComponent.js

```javascript
ReactDOMComponent.Mixin = {
  // ...
  receiveComponent: function(nextElement, transaction, context) {
    var prevElement = this._currentElement;
    this._currentElement = nextElement;
    this.updateComponent(transaction, prevElement, nextElement, context);
  },

  // Updates a DOM component after it has already been allocated and
  // attached to the DOM. Reconciles the root DOM node, then recurses.
  updateComponent: function(transaction, prevElement, nextElement, context) {
    var lastProps = prevElement.props;
    var nextProps = this._currentElement.props;

    switch (this._tag) {
      case 'input':
        lastProps = ReactDOMInput.getHostProps(this, lastProps);
        nextProps = ReactDOMInput.getHostProps(this, nextProps);
        break;
      case 'option':
        lastProps = ReactDOMOption.getHostProps(this, lastProps);
        nextProps = ReactDOMOption.getHostProps(this, nextProps);
        break;
      case 'select':
        lastProps = ReactDOMSelect.getHostProps(this, lastProps);
        nextProps = ReactDOMSelect.getHostProps(this, nextProps);
        break;
      case 'textarea':
        lastProps = ReactDOMTextarea.getHostProps(this, lastProps);
        nextProps = ReactDOMTextarea.getHostProps(this, nextProps);
        break;
    }

    assertValidProps(this, nextProps);
    this._updateDOMProperties(lastProps, nextProps, transaction);
    this._updateDOMChildren(lastProps, nextProps, transaction, context);

    switch (this._tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `_updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        ReactDOMInput.updateWrapper(this);

        // We also check that we haven't missed a value update, such as a
        // Radio group shifting the checked value to another named radio input.
        inputValueTracking.updateValueIfChanged(this);
        break;
      case 'textarea':
        ReactDOMTextarea.updateWrapper(this);
        break;
      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        transaction.getReactMountReady().enqueue(postUpdateSelectWrapper, this);
        break;
    }
  },
}
```

```javascript
  _updateDOMChildren: function(lastProps, nextProps, transaction, context) {
    var lastContent = CONTENT_TYPES[typeof lastProps.children]
      ? lastProps.children
      : null;
    var nextContent = CONTENT_TYPES[typeof nextProps.children]
      ? nextProps.children
      : null;

    var lastHtml =
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html;
    var nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html;

    // Note the use of `!=` which checks for null or undefined.
    var lastChildren = lastContent != null ? null : lastProps.children;
    var nextChildren = nextContent != null ? null : nextProps.children;

    // If we're switching from children to content/html or vice versa, remove
    // the old content
    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction, context);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
      if (__DEV__) {
        ReactInstrumentation.debugTool.onSetChildren(this._debugID, []);
      }
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent);
        if (__DEV__) {
          setAndValidateContentChildDev.call(this, nextContent);
        }
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        this.updateMarkup('' + nextHtml);
      }
      if (__DEV__) {
        ReactInstrumentation.debugTool.onSetChildren(this._debugID, []);
      }
    } else if (nextChildren != null) {
      if (__DEV__) {
        setAndValidateContentChildDev.call(this, null);
      }

      this.updateChildren(nextChildren, transaction, context);
    }
  },
```
上面的内容介绍的是ReactDOMComponent中对host component更新的具体逻辑，主要包括两部分：
- 属性的更新： 包括更新样式、更新属性、处理事件
- 子节点的更新：更新内容、更新子节点（此处涉及diff算法）

#### element diff
- 当节点处于同一层级时，diff提供了3种节点操作
    - INSERT_MARKUP: 新的组件类型不在旧的集合里，插入新节点
    - MOVE_EXISTING：旧集合中有新组件类型，且该类型是可更新的类型，需要做移动操作，复用旧集合中的该节点。
    - REMOVE_NODE:  旧组件类型，在新集合中也有，但对应的element不同则不能直接复用和更新，需要执行删除操作，或者旧组件不在新集合里的，也需要执行删除操作。

- 针对同层级节点移动的优化： 对同一层级的同组子节点添加唯一性key。

源码路径 ./src/renderers/shared/stack/reconciler/ReactChildReconciler.js

```javascript
var ReactChildReconciler = {
  // ...

  // 更新被渲染的子节点
  updateChildren: function(
    prevChildren,
    nextChildren,
    mountImages,
    removedNodes,
    transaction,
    hostParent,
    hostContainerInfo,
    context,
    selfDebugID, // 0 in production and for roots
  ) {
    
    if (!nextChildren && !prevChildren) {
      return;
    }
    var name;
    var prevChild;
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue;
      }
      prevChild = prevChildren && prevChildren[name];
      var prevElement = prevChild && prevChild._currentElement;
      var nextElement = nextChildren[name];
      if (
        prevChild != null &&
        shouldUpdateReactComponent(prevElement, nextElement)
      ) {
        // 更新子节点
        ReactReconciler.receiveComponent(
          prevChild,
          nextElement,
          transaction,
          context,
        );
        nextChildren[name] = prevChild;
      } else {
        if (prevChild) {
          removedNodes[name] = ReactReconciler.getHostNode(prevChild);
          ReactReconciler.unmountComponent(prevChild, false);
        }
        // The child must be instantiated before it's mounted.
        var nextChildInstance = instantiateReactComponent(nextElement, true);
        nextChildren[name] = nextChildInstance;
        // Creating mount image now ensures refs are resolved in right order
        // (see https://github.com/facebook/react/pull/7101 for explanation).
        var nextChildMountImage = ReactReconciler.mountComponent(
          nextChildInstance,
          transaction,
          hostParent,
          hostContainerInfo,
          context,
          selfDebugID,
        );
        mountImages.push(nextChildMountImage);
      }
    }
    // 卸载不存在的子节点
    for (name in prevChildren) {
      if (
        prevChildren.hasOwnProperty(name) &&
        !(nextChildren && nextChildren.hasOwnProperty(name))
      ) {
        prevChild = prevChildren[name];
        removedNodes[name] = ReactReconciler.getHostNode(prevChild);
        ReactReconciler.unmountComponent(prevChild, false);
      }
    }
  },

  // 卸载子节点
  unmountChildren: function(renderedChildren, safely) {
    for (var name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name)) {
        var renderedChild = renderedChildren[name];
        ReactReconciler.unmountComponent(renderedChild, safely);
      }
    }
  },
};
```

- 同层级的同组子节点的移动的diff算法：
  - 如果新集合中当前访问的节点比lastIndex大，说明当前访问节点在旧集合中就比上一个节点位置靠后，则该节点不会影响其他节点的位置，因此不用添加到差异队列中，即不执行移动操作。
  - 当完成新结合中所有节点的差异化对比后，还需要对旧集合进行循环遍历，判断是否存在新集合中没有但旧集合中仍然存在的节点，如果存在，则删除。

源码路径 ./src/renderers/shared/stack/reconciler/ReactMultiChild.js

```javascript
  _updateChildren: function(
      nextNestedChildrenElements,
      transaction,
      context,
    ) {
      var prevChildren = this._renderedChildren;
      var removedNodes = {};
      var mountImages = [];
      var nextChildren = this._reconcilerUpdateChildren(
        prevChildren,
        nextNestedChildrenElements,
        mountImages,
        removedNodes,
        transaction,
        context,
      );
      if (!nextChildren && !prevChildren) {
        return;
      }
      var updates = null;
      var name;
      // `nextIndex` will increment for each child in `nextChildren`, but
      // `lastIndex` will be the last index visited in `prevChildren`.
      var nextIndex = 0;
      var lastIndex = 0;
      // `nextMountIndex` will increment for each newly mounted child.
      var nextMountIndex = 0;
      var lastPlacedNode = null;
      for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
          continue;
        }
        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];
        if (prevChild === nextChild) {
          updates = enqueue(
            updates,
            this.moveChild(prevChild, lastPlacedNode, nextIndex, lastIndex),
          );
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            // The `removedNodes` loop below will actually remove the child.
          }
          // The child must be instantiated before it's mounted.
          updates = enqueue(
            updates,
            this._mountChildAtIndex(
              nextChild,
              mountImages[nextMountIndex],
              lastPlacedNode,
              nextIndex,
              transaction,
              context,
            ),
          );
          nextMountIndex++;
        }
        nextIndex++;
        lastPlacedNode = ReactReconciler.getHostNode(nextChild);
      }
      // 移除不存在的子节点
      for (name in removedNodes) {
        if (removedNodes.hasOwnProperty(name)) {
          updates = enqueue(
            updates,
            this._unmountChild(prevChildren[name], removedNodes[name]),
          );
        }
      }
      if (updates) {
        processQueue(this, updates);
      }
      this._renderedChildren = nextChildren;

      if (__DEV__) {
        setChildrenForInstrumentation.call(this, nextChildren);
      }
    },
```


<div class="references">references</div>

[reconciliation](https://reactjs.org/docs/reconciliation.html)
[Implementation Notes](https://reactjs.org/docs/implementation-notes.html)
[深入React技术栈](https://book.douban.com/subject/26918038/) 
