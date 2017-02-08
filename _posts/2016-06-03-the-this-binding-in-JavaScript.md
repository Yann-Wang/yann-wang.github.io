---
title: JavaScript中的this绑定
date: 2016-06-03 11:44:51
categories:
- technology
tags:
- this
- bind

---


### 默认绑定：
- non-strict mode ： this 指向全局对象；
- strict mode          :  this 绑定 undefined
  注：决定this绑定对象的并不是调用位置是否处于严格模式，而是函数体是否处于严格模式。

<!-- more -->

### 软绑定
- 给默认绑定指定一个全局对象和undefined以外的值，可以实现和硬绑定相同的效果，同时保留隐式绑定或者显式绑定修改this的能力。
- 对指定的函数进行封装，首先检查调用时的this，如果this绑定到全局对象或者undefined， 那就把指定的默认对象obj绑定到this， 否则不会修改this。

{% highlight javascript %}

if (!Function.prototype.softBind){
  Function.prototype.softBind = function(obj) {
       var fn = this;  // this指代的是调用softBind的那个函数对象，即foo
       //捕获所有curried参数
       var curried = [].slice.call(arguments, 1);
       var bound   = function() {
            return fn.apply(
                 (!this || this === (window || global)) ? obj : this,
                 curried.concat.apply(curried, arguments)
            );
       };
       bound.prototype = Object.create(fn.prototype);
       return bound;
  };
}   

function foo() {
     console.log("name: " + this.name);
}

var obj  = { name: "obj" },
    obj2 = { name: "boj2" },
    obj3 = { name: "obj3" };

var fooOBJ = foo.softBind(obj);
fooOBJ(); // name: obj   // 软绑定

obj2.foo = foo.softBind(obj);
obj2.foo(); // name: obj2     // 隐式绑定

fooOBJ.call(obj3); // name: obj3   // 显式绑定

setTimeout(obj2.foo, 10); // name: obj  // 软绑定  在浏览器中
//javascript函数参数只能按值传递， 传参赋值造成了间接引用， 从而造成了隐式丢失，所以只剩下了软绑定
//在nodejs中， 结果为：name: undefined    // 推理： 执行obj2.foo函数时，引用的变量obj 。。。。待续

{% endhighlight %}

### 隐式绑定
- 调用位置的上下文对象；
- 隐式丢失: 传入回调函数时会发生隐式赋值

### 显式绑定
- .call
- .apply
- .forEach  (not support es3)

    Array.forEach(f[, o])
    
　　     - 如果指定了第二个参数o， 则执行显式绑定（通过apply实现），函数f的this绑定到o；

- 硬绑定 （显式绑定的变种）：只能绑定一次，无法使用隐式绑定和显式绑定来修改this

    - .bind  (not support es3)
    
        foo.bind(obj) 会返回一个硬编码的新函数， 它会把参数obj设置为this绑定并调用原始函数foo
        
    - 手动硬绑定  会比bind函数的性能更好些
        
    {% highlight javascript %}
    var EventEmitter = require('events');
    var util = require('util');
    
    function MyThing() {
      EventEmitter.call(this);
    
      doFirstThing();
      setImmediate(emitThing1, this);
    }
    util.inherits(MyThing, EventEmitter);
    
    function emitThing1(self) {
      self.emit('thing1');
    }
    
    var mt = new MyThing();
    
    mt.on('thing1', function onThing1() {
      // Whoot!
    });
    {% endhighlight %}

### new绑定

1. 创建一个新对象；

2. 调用构造函数产生的执行环境中的this指向这个新对象；

3. 执行构造函数中的代码（为新对象添加属性）；

4. 如果函数没有返回其它对象，那么返回这个新对象。

### 更安全的this

{% highlight javascript %}
//空的非委托对象
var   ∅ = Object.create(null);
{% endhighlight %}

- 传给call, apply, bind

- Object.create(null) 和 {} 很像， 但是并不会创建Object.prototype这个委托， 所以它比{} “更空”。

### this间接引用

{% highlight javascript %}
function foo(){
     console.log(this.a);
}

var a = 2;
var o = { a: 3, foo: foo};
var p = { a: 4};

o.foo();  // 3

(o.foo)();  // 3

(p.foo = o.foo)();  //  2     //赋值表达式的值 就是右操作数的值

p.foo();   //  4
(p.foo)();   // 4

var bar = o.foo;
bar();   //  2
{% endhighlight %}

- 赋值表达式p.foo = o.foo的返回值是目标函数的引用，因此调用位置是foo()而不是p.foo()或者o.foo()。

### =>  箭头函数 this 绑定
- 继承外层作用域this 绑定
- this 绑定不可被修改




