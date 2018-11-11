/**
 * Created by a_wav on 2017/1/4.
 */

var lg, dr;

if(Function.prototype.bind){
    lg = console.log.bind(console);
}else if(typeof console.log == "object"){
    lg = console.log;
}else{
    lg = function () {
        var arr = Array.prototype.slice.apply(arguments);
        return console.log.apply(console,arr);
    };
}

if(Function.prototype.bind){
    dr = console.dir.bind(console);
}else{
    dr = function () {
        var arr = [].slice.apply(arguments);
        return console.dir.apply(console,arr);
    };
}

var $  = function (selector) {
    return document.querySelector(selector);
};

var line = function () {
    lg("-------------------------");
};

var line2 = function () {
    lg("=========================");
};

var delay = function (fn,delay) {
    setTimeout(fn,delay || 3000);
};

var delay2 = function (fn,delay,cb) {
    setTimeout(function () {
        fn(cb);
    },delay || 3000);
};

if(document.addEventListener){
    document.addEventListener('DOMContentLoaded',function () {
        lg('DOMContentLoaded!');
    },false);
}else{
    // IE678 不支持 DOMContentLoaded事件
    // readystatechange第四次事件 在load事件之前立即触发
    document.attachEvent('onreadystatechange',function () {
        if(document.readyState == "complete"){
            lg('readystatechange!');
        }
    });
}

window.onload = function () {
    lg('load!');
};