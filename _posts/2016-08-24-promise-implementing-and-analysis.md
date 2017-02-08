---
title: v8在解析promise源码时的执行环境变化过程
date: 2016-08-24 21:40:55
categories:
- technology
tags:
- promise
- execution environment
---


- 首先，先去[Promise官网](https://www.promisejs.org/implementing/)看implementing这篇文章．



- 下面是我对源码的一个解读

<!-- more -->

{% jsfiddle 01duqtsu js,html,result %}

- 在执行代码是为了避免使用Node中已经实现的Promise，所以将Promise改名为Promise2，　并且把测试环境设为了浏览器中．在上面的代码中，把Promise的实现部分放在了javascript文件中，并在html文件的head中引入； 对promise的使用放在了html文件的script标签中．

- 当javascript文件被载入浏览器时，　浏览器创建４个函数对象：Promise2, getThen, doResolve, Promise2.resolve（注意：函数体中的代码没有被解析）

- 从调用Promise2.resolve函数开始
    ![execution environment](http://okup5z621.bkt.clouddn.com/ExecutionEnvironment.png "execution environment") 
- Promise2.resolve("Success")返回　一个对象，包括done属性和then属性，这两个属性的属性值都是一个函数．
    ![execution environment 2](http://okup5z621.bkt.clouddn.com/ExecutionEnvironment2.png "execution environment 2") 

- Promise实现中包含了控制反转等面向对象的设计原则，函数参数的访问链是比较难分析的点．

- 以下要点会有助于理解：
    - 函数的访问链指向它被定义时所在的函数．
    - 函数声明被解析时，其函数体没有被解析更没有被执行．