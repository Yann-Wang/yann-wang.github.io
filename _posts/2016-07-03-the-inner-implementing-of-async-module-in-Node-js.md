---
title: Node.js中的async模块的内部实现
date: 2016-07-03 11:44:51
categories:
- technology
tags:
- async
- inner implementing
- source code
---

### Async.js中的.each和.eachSeries
- .each 并不是真正的并行，而是.each中的函数有异步回调，.each不能保证每次调用异步回调都是按先后顺序调用的。也就是说，并行的是回调函数（此处的并行，并不是系统层面的并行）。
- .each实现思路：顺序遍历执行数组中的函数，声明一个变量count=0，在每个callback函数中 将count++，然后判断count 是否与数组.length相等，如果等，就调用最后的callback。

<!-- more -->

- .eachSeries实现思路：在前一个的callback函数中调用后一个函数。
- async.series也是根据.eachSeries来实现的。

- [Async.js v1.5.2版本](https://github.com/caolan/async/blob/v1.5.2/lib/async.js)

### async.each 和 async.eachSeries 的实现

{% highlight javascript %}
function each(arr, iterator, callback) {
    callback = callback || function () {};
    if (!arr.length) {
        return callback();
    }
    var completed = 0;
    arr.forEach(function (x) {
        iterator(x, function (err) {
            if (err) {
                callback(err);
                callback = function () {};
            }
            else {
                completed += 1;
                if (completed >= arr.length) {
                    callback(null);
                }
            }
        });
    });
};

function eachSeries(arr, iterator, callback) {
    callback = callback || function () {};
    if (!arr.length) {
        return callback();
    }
    var completed = 0;
    var iterate = function () {
        iterator(arr[completed], function (err) {
            if (err) {
                callback(err);
                callback = function () {};
            }
            else {
                completed += 1;
                if (completed >= arr.length) {
                    callback(null);
                }
                else {
                    iterate();
                }
            }
        });
    };
    iterate();

};
{% endhighlight %}