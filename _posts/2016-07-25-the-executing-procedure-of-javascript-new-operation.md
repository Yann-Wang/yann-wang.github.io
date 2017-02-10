---
layout: post
title: JavaScript new 操作符的执行过程
date: 2016-07-25 10:39:06
tags: [new, operation, execution environment]
---

今天来聊下JavaScript new操作符的执行过程, 考虑到讨论的内容为基础内容, 还是经典书籍
和标准文档的描述更为严谨, 所以将红宝书和权威指南上的描述总结如下, 最后摘录了JavaScript标准文档
中对JavaScript new操作符的执行过程的描述。


#### 《JavaScript高级程序设计》中的描述

- 使用new 操作符调用构造函数，会进行以下步骤：
    1. 创建一个新函数对象；
    2. 调用构造函数产生的执行环境中的this指向这个新对象；  //该构造函数 不是 新对象 的方法
    3. 执行构造函数中的代码（为新函数对象添加属性）；
    4. 如果函数没有返回其它对象，那么返回这个新函数对象。
- 构造函数的prototype属性被用作新对象的原型
- 以上是一个原子操作过程。
<!-- more -->

#### 《JavaScript权威指南》中的描述

- 当计算一个对象创建表达式的值时， 和对象初始化表达式通过{}创建对象的做法一样，Javascript首先创建一个新的空对象， 然后， javascirpt通过传入指定的参数并将这个新对象当作this的值来调用一个指定的函数。这个函数可以使用this来初始化这个新创建对象的属性。
  
- 那些被当成构造函数的函数不会返回一个值， 并且这个新创建并被初始化后的对象就是整个对象创建表达式的值。如果一个构造函数确实返回了一个对象值， 那么这个对象就作为整个对象创建表达式的值，而新创建的对象就废弃了。

    {% highlight javascript %}    
    function dd(){ this.ss = 5; return {aa:6}; }
    var hh = new dd();
    
    hh.ss   // undefined
    hh.aa   // 6    
    {% endhighlight %}

    {% highlight javascript %}
    function dd2(){ this.ss2 = 4; }
    var hh2 = new dd2();
    
    hh2.ss2   // 4
    hh2.dd2   // undefined
    hh2       // dd2 {ss2: 4}
    hh2.toString()   // "[object Object]"
    hh2()     // Uncaught TypeError: hh2 is not a function(…)
    hh2.dd2()  // Uncaught TypeError: hh2.dd2 is not a function(…)
    {% endhighlight %}

#### ES5标准文档：对[调用构造函数](https://www.w3.org/html/ig/zh/wiki/ES5/functions#FunctionDeclaration)的描述

- 当以一个可能的空的参数列表调用函数对象 F 的 [[Construct]] 内部方法，采用以下步骤：
    1. 令 obj 为新创建的 ECMAScript 原生对象。
    2. 依照 8.12 设定 obj 的所有内部方法。
    3. 设定 obj 的 [[Class]] 内部属性为 "Object"。
    4. 设定 obj 的 [[Extensible]] 内部属性为 true。
    5. 令 proto 为以参数 "prototype" 调用 F 的 [[Get]] 内部属性的值。
    6. 如果 Type(proto) 是 Object，设定 obj 的 [[Prototype]] 内部属性为 proto。
    7. 如果 Type(proto) 不是 Object，设定 obj 的 [[Prototype]] 内部属性为 15.2.4 描述的标准内置的 Object 原型对象。
    8. 以 obj 为 this 值，调用 [[Construct]] 的参数列表为 args，调用 F 的 [[Call]] 内部属性，令 result 为调用结果。
    9. 如果 Type(result) 是 Object，则返回 result。
    10. 返回 obj。

