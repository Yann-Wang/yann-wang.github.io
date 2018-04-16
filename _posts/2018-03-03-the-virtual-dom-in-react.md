---
layout: post
title: React中的Virtual DOM
date: 2018-03-03 
tags: [virtual dom, react]
---

这篇文章主要讲下React中virtual dom的一些基本知识。

#### 什么是Virtual DOM ?
- 虚拟dom树，react的Virtural DOM模型，负责虚拟节点及其属性的构建、更新、删除等工作；

#### virtual dom 的数据结构
- 每个虚拟节点需要的基本信息包括：标签名、节点属性（包括样式、属性、事件、子节点）、标识ID(key)、引用值、当前节点所属节点
- 为了从源码得到验证，我们看下源码中定义DOM节点的逻辑，下面的代码是从当前最新的react-16.3.1中拿过来的

<!-- more -->

- 源码路径packages/react/src/ReactElement.js

```javascript
  const ReactElement = function(type, key, ref, self, source, owner, props) {
    const element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      // Built-in properties that belong on the element
      type: type,
      key: key,
      ref: ref,
      props: props,

      // Record the component responsible for creating this element.
      _owner: owner,
    };

    // 删除了部分__DEV__逻辑

    return element;
  };

  export function createElement(type, config, children) {
    let propName;

    // Reserved names are extracted
    const props = {};

    let key = null;
    let ref = null;
    let self = null;
    let source = null;

    if (config != null) {
      if (hasValidRef(config)) {
        ref = config.ref;
      }
      if (hasValidKey(config)) {
        key = '' + config.key;
      }

      self = config.__self === undefined ? null : config.__self;
      source = config.__source === undefined ? null : config.__source;
      // Remaining properties are added to a new props object
      for (propName in config) {
        if (
          hasOwnProperty.call(config, propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)
        ) {
          props[propName] = config[propName];
        }
      }
    }

    // Children can be more than one argument, and those are transferred onto
    // the newly allocated props object.
    const childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      const childArray = Array(childrenLength);
      for (let i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
      }
      // 删除了部分__DEV__逻辑
      props.children = childArray;
    }

    // Resolve default props
    if (type && type.defaultProps) {
      const defaultProps = type.defaultProps;
      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }
    // 删除了部分__DEV__逻辑
    return ReactElement(
      type,
      key,
      ref,
      self,
      source,
      ReactCurrentOwner.current,
      props,
    );
  }
```


#### virtual dom的类型
- 虚拟节点分为3种类型：ReactElement, ReactFragment, ReactText
- 元素节点会产生两种类型的组件： DOM标签组件和自定义组件；


#### 元素节点的创建和更新
-  元素节点的创建，其源码已在上面列出；
- 元素节点的更新， 包括属性的更新和子节点的更新
    - 属性的更新： 包括更新样式、属性，处理事件等（先删除不需要的旧属性，再更新新属性；）
    - 子节点的更新： 包括更新内容、更新子节点、此部分涉及diff算法；（先删除不需要的子节点和内容，再更新子节点和内容）
- 注： 卸载组件时，会卸载子节点、清除事件监听、清空标识

- 对于自定义组件，ReactCompositeComponent实现了一套React生命周期和setState机制

- 由于元素节点的更新涉及到diff算法，而diff算法在15.x和16.x中是不一样的，所以咱不展示相关源码，这个之后在单独的文章中再讲。

#### 文本节点的创建
- 文本节点，本不算virtual dom元素，但为了保持渲染的一致性，将其封装为文本组件；如果该文本是通过createElement方法创建的节点，则为该节点创建相应的标签和标识domID（方便diff）；如果不是，将直接返回文本内容。

```javascript
  let setTextContent = function(node: Element, text: string): void {
    if (text) {
      let firstChild = node.firstChild;

      if (
        firstChild &&
        firstChild === node.lastChild &&
        firstChild.nodeType === TEXT_NODE
      ) {
        firstChild.nodeValue = text;
        return;
      }
    }
    node.textContent = text;
  };

  export default setTextContent;
```

