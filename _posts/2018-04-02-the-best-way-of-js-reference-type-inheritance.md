---
layout: post
title: 聊聊Javascript中引用类型继承的最佳实现方式
date: 2018-04-02 
tags: [javascript, 引用类型, 继承]
---

Javascript的继承有多种实现方式，大部分方式都有其致命的缺点，为了证明最佳实现方式的正确性，下面先分析下两种常见的继承方式的一些缺点，以此产生对比。

##### 原型链方式

在讲原型链的形成之前，首先要理清原型对象、实例和构造函数之间的关系：每个构造函数都有一个原型对象，每个原型对象都有一个指向构造函数的指针，每个实例都有一个指向原型对象的内部指针。

<!-- more -->

原型链的实现方式就是一个类型的原型对象是另一个类型的实例，如下图。

![prototype chain](http://okup5z621.bkt.clouddn.com/prototype-chain.jpeg)

该图来自《Javascript高级程序设计 第三版》

原型链方式的缺点：

 1. 包含引用类型值的原型属性会被所有实例共享，这样如果一个实例对引用类型内部的属性值有改动，那其他实例也会受影响。

 2. 在创建子类型的实例时，不能向父类型的构造函数传递参数。

##### 借用构造函数方式

简单来说就是在子类型的构造函数中调用父类型的构造函数。

这种继承方式的缺点：

 1. 子类型中的方法都是在构造函数中定义的，无法实现函数复用。
 
 2. 子类型实例无法调用父类型原型中的方法。

下面说一种最佳继承实现方式。

##### 寄生组合式继承

简单说，即通过借用构造函数的方式来继承属性，通过原型链的方式来继承方法。这样既解决了原型链方式引用类型属性值被实例共享的问题，也解决了借用构造函数方式子类型无法复用父类型方法的问题。

从开发者的角度考虑，需要开发者在创建类时遵守以下约定：使用构造函数模式创建类中的属性，并使用原型模式创建类中的方法。

代码示例如下：

```javascript
  function SuperType(name) {
      this.name = name;
      this.colors = ["red", "blue", "green"];
  }

  SuperType.prototype.sayName = function() {
      alert(this.name);
  };

  function SubType(name, age) {
      SuperType.call(this, name); // 通过借用构造函数的方式来继承属性

      this.age = age;
  }

  inheritPrototype(SubType, SuperType);

  SubType.prototype.sayAge = function() {
      alert(this.age);
  }
```

```javascript
  // 通过原型链的方式来继承方法

  function inheritPrototype(subType, superType) {
      var prototype = object(superType.prototype);
      prototype.constructor = subType;
      subType.prototype = prototype;
  }

  // ES5中的Object.create()方法 在 ES3中的实现方式
  function object(o) {
      function F(){}
      F.prototype = o;
      return new F();
  }
```

##### 使用extends关键词

下面看下ES6中extends关键词的实现方式，我们看下babel是如何编译extends关键词的。

es6代码如下：

```javascript
  class A {
    constructor() {
        this.aa = 6;
      }
    
      test() {
        console.log(5555);
      }
  }

  class B extends A {
    constructor() {
          super();
        this.bb = 7;
      }
    
      test2(){
        console.log(8888);
      }
  }

  const inst = new B();
  inst.test2();
```

编译后代码如下：

```javascript
  "use strict";
  // 将类中的方法挂在构造函数原型下面
  var _createClass = function() {
      function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
              var descriptor = props[i];
              descriptor.enumerable = descriptor.enumerable || false;
              descriptor.configurable = true;
              if ("value" in descriptor) descriptor.writable = true;
              Object.defineProperty(target, descriptor.key, descriptor);
          }
      }
      return function(Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
      };
  } ();

  // 如果子类的原型指向的构造函数无返回值，则返回this对象；否则，返回返回值
  function _possibleConstructorReturn(self, call) {
      if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return call && (typeof call === "object" || typeof call === "function") ? call: self;
  }

  // 继承方法
  function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);    }
      subClass.prototype = Object.create(superClass && superClass.prototype, {
          constructor: {
              value: subClass,
              enumerable: false,
              writable: true,
              configurable: true
          }
      });
      // 设置[[prototype]]属性值
      if (superClass)
          Object.setPrototypeOf ? 
            Object.setPrototypeOf(subClass, superClass)
            :
            subClass.__proto__ = superClass;
  }

  // 防止类被作为函数调用
  function _classCallCheck(instance, Constructor) {
      if (! (instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
      }
  }

  var A = function() {
      function A() {
          _classCallCheck(this, A);
          this.aa = 6;
      }

      // 第二个参数是类的方法信息组成的数组 
      _createClass(A, [{
          key: "test",
          value: function test() {
              console.log(5555);
          }
      }]);
      return A;
  } ();
  var B = function(_A) {
      _inherits(B, _A); // 通过原型链的方式，B继承A中的方法
      function B() {
          _classCallCheck(this, B);
          // 下面的_this获取到的对象包含A中定义的属性值
          var _this = _possibleConstructorReturn(this, (B.__proto__ || Object.getPrototypeOf(B)).call(this));
          _this.bb = 7;
          return _this;
      }

      // 第二个参数是类的方法信息组成的数组
      _createClass(B, [{
          key: "test2",
          value: function test2() {
              console.log(8888);
          }
      }]);
      return B;
  } (A);

  var inst = new B();
  inst.test2();
```

分析_inherits函数，其继承方式与寄生组合式继承中的inheritPrototype函数实现方式是一样的，并且其同样使用构造函数模式创建类中的属性，同样使用原型模式创建类中的方法，与寄生组合式继承的编码约定是一致的。所以，extends关键词在babel中编译时的实现方式就是用的寄生组合式继承。


<div class="references">参考</div>

- 《Javascript高级程序设计 第三版》

