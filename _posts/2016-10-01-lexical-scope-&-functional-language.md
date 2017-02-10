---
layout: post
title: 词法作用域与函数式语言
date: 2016-10-01 20:40:55
tags: [functional language, lexical scope, dynamic scope]
---

#### 作用域(Scope)
> From wikipedia: In computer programming, the scope of a name binding – an association of a name to an entity, such as a variable – is the part of a computer program where the binding is valid: where the name can be used to refer to the entity. In other parts of the program the name may refer to a different entity (it may have a different binding), or to nothing at all (it may be unbound).

- 在程序的某个节点上的作用域指的是，该代码节点能够阅读到的所有实体(entity)，也被称为上下文或者执行环境。（注：entity简单来讲就是由标识符代表的代码和变量）

<!-- more -->

#### 作用域的表现形式
- 以上我们提到作用域的讨论依赖具体的程序节点，这个程序节点可以细分为如下两块。
    - 源代码的文本片段(area of text)
    - 源代码的节点运行时(runtime)
- 如果是第一种情况，我们就称它为lexical scope(词法作用域)
- 如果是第二种情况，就称它为dynamic scope(动态作用域)
  
#### 词法作用域和动态作用域的执行方式
- 对于词法作用域而言，程序在某个节点上运行的时候。变量查找先从该节点所属的函数(或代码块)开始，如果找不到，则往上面一级的函数(或者代码块)开始查找，直到根作用域。
- 对于动态作用域而言，由于作用域依赖于runtime，程序在某个节点上运行的时候。变量查找按照执行栈(call stack)进行查找，变量先在执行函数里面查找，如果找不到则往调用该执行函数的栈里面查找。
- 使用词法作用域的语言： JavaScript, C,C++,Java,Go,Python,R
- 使用动态作用域的语言：　Bash

#### 闭包在语言中的实现方式
- 要实现闭包，在数据结构选型方面，肯定不是线性stack，因为闭包在执行时，仍应该保持绑定上下文的不变，而不是去阅读对应的执行环境。而线性(stack)显然无法满足要求
- 实际上对于大部分拥有闭包的语言，程序语言采用的是堆(heap)的形式存储上下文non-local变量。 也正因为如此，这些语言基本自带GC(垃圾回收)。

#### 闭包在github上也有很多的C语言实现
- 根据function或者block的词法作用域嵌套关系，在单向链表中存储函数执行的作用域调用栈context>context>context。
- 每次新形成一个作用域context的时候，则复制链表之前的数据作为当前函数执行的闭包环境。
- 在函数执行时对相关变量进行引用的时候，则沿着当前的上下文单向链表不断向上寻找即可。



###### citation
- [词法作用域与函数式编程语言](https://zhuanlan.zhihu.com/p/23661004)
- [Scope (computer science)](https://en.wikipedia.org/wiki/Scope_(computer_science))