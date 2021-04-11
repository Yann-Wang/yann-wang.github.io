---
layout: post
title: javascript object中的子类型
date: 2021-03-26
tags: [ecmascript, javascript object, subtype]
---

最近几年，从es2015到es2020<sup>[1]</sup>，ecmascript文档增加了很多内容，Javascript语言的数据类型也有了一些变化，比如原始数据类型中增加了```symbol```、```bigint```等类型，还有object中也增加了一些新的子类型；由于```object```的子类型较多，我们今天就来展开聊一聊。

<!-- more -->

目录

- [判断Javascript object子类型的方法](#判断javascript-object子类型的方法)
- [Object.prototype.toString实现原理](#objectprototypetostring实现原理)
- [Javascript object子类型分类](#javascript-object子类型分类)
  - [Global Object](#global-object)
  - [Fundamental Objects](#fundamental-objects)
  - [Numbers and Dates](#numbers-and-dates)
  - [Text Processing](#text-processing)
  - [Indexed Collections](#indexed-collections)
  - [Keyed Collections](#keyed-collections)
  - [Structured Data](#structured-data)
  - [Control Abstraction Objects](#control-abstraction-objects)
  - [Reflection](#reflection)


#### 判断Javascript object子类型的方法

首先说下判断object子类型的方式
```javascript
    Object.prototype.toString.call({}) // [object Object]
```

由于新标准引入了[Symbol.toStringTag]属性，所以部分对象子类型也部署了该属性<sup>[2]</sup>，所以部分对象子类型也可以通过该属性来读取子类型。
```javascript
    Math[Symbol.toStringTag] // Math
    Set.prototype[Symbol.toStringTag] // Set
```

#### Object.prototype.toString实现原理

![Object.prototype.toString](/assets/img/Object.prototype.toString.png "Object.prototype.toString")

根据上述标准描述，
1. 优先判断是否为```undefined```, ```null```
2. 如果上述不符合，依次判断是否为```Array```, ```Arguments```, ```Function```, ```Error```, ```Boolean```, ```Number```, ```String```, ```Date```, ```RegExp```
3. 如果上述不符合，给默认值```Object```
4. 最后，如果```[Symbol.toStringTag]```属性存在，则优先选择而```[Symbol.toStringTag]```属性值

#### Javascript object子类型分类

按照 ```Ecmascript2020``` 中的描述，Javascript object子类型被分为9个大类，分别为```Global Object```, ```Fundamental Objects```, ```Numbers and Dates```, ```Text Processing```, ```Indexed Collections```, ```Keyed Collections```, ```Structured Data```, ```Control Abstraction Objects```, ```Reflection```



##### Global Object
Global Object 在不同的宿主环境中子类型名称不同，比如在浏览器和Node.js中的子类型名称分别如下：
![Global Object](/assets/img/GlobalObject.png "GlobalObject")


##### Fundamental Objects
基本对象包括以下5种，其中```Boolean```, ```Symbol```为原始类型的包装对象：

![Fundamental Objects](/assets/img/FundamentalObjects.png "FundamentalObjects")

##### Numbers and Dates
数字和日期相关的子类型，其中```BigInt```为大整数的包装对象，大整数也是原始类型之一；```Math Object```包括了一些值属性和方法属性；

![Numbers and Dates](/assets/img/NumbersAndDates.png "NumbersAndDates")

##### Text Processing
文本方面有两种子类型，如下：
其中正则对象为文本处理相关的对象。

![Text Processing](/assets/img/TextProcessing.png "TextProcessing")

##### Indexed Collections
索引集合方面，有两种子类型，其中```TypedArray Objects```包括11种子类型，分别对应11种类型数组。

![Indexed Collections](/assets/img/IndexedCollections.png "IndexedCollections")


##### Keyed Collections
键集合方面，有四种子类型，其中WeakMap和WeakSet键名所指向的对象不计入垃圾回收机制。

![Keyed Collections](/assets/img/KeyedCollections.png "KeyedCollections")

##### Structured Data
结构化数据方面，包括5种子类型，大部分比较陌生;

```ArrayBuffer Objects```用来表示通用的、固定长度的原始二进制数据缓冲区；

```SharedArrayBuffer Objects```<sup>[3]</sup>来表示一个通用的，固定长度的原始二进制数据缓冲区，类似于 ArrayBuffer 对象，它们都可以用来在共享内存（shared memory）上创建视图。与 ArrayBuffer 不同的是，SharedArrayBuffer 不能被分离;

```DataView Objects```视图是一个可以从 二进制```ArrayBuffer Objects```中读写多种数值类型的底层接口，使用它时，不用考虑不同平台的```字节序```问题；

```Atomics Object```提供了一组静态方法对 ```SharedArrayBuffer Objects``` 和  ```ArrayBuffer Objects```进行原子操作；

![Structured Data](/assets/img/StructuredData.png "StructuredData")

##### Control Abstraction Objects
控制抽象对象，有7种，其中迭代器```Iteration```又包括6种子类型，要注意的是这6种子类型的类型标识有部分是相同的。

以下这7种子类型都是近些年新增的，需要重点关注下。

![Control Abstraction Objects](/assets/img/ControlAbstractionObjects.png "ControlAbstractionObjects")

##### Reflection
反射方面，有3种，由于```Proxy Objects```没有部署```Symbol.toStringTag```属性，所以其子类型名称为```[object Object]```；

```Module Namespace Objects```是存在于esmodule模块化规范中的，下图给出的demo是在Node.js环境的，其实也可以在浏览器环境，demo如下：

```html
<script type="module">
import * as m from './bar.js';

console.log('object subtype: ', Object.prototype.toString.call(m)) // [object Module]
</script>
```


```javascript
//bar.js
let a = 1;
let b = { num: 1 }
setTimeout(() => {
    a = 2;
    b = { num: 2 };
}, 200);

export {
    a,
    b,
};

```


![Reflection](/assets/img/Reflection.png "Reflection")







<div class="references">References</div>

[1] [Ecmascript 2020官方文档](https://262.ecma-international.org/11.0/)

[2] [从深入到通俗：Object.prototype.toString.call()](https://zhuanlan.zhihu.com/p/118793721)

[3] [SharedArrayBuffer Objects](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
