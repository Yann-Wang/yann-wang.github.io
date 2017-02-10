---
layout: post
title: 请求拦截及转发
date: 2016-10-20 20:40:55
tags: [intercept request, forward request]
---

今天聊下请求拦截及转发的位置

#### 浏览器端－－通过浏览器插件拦截
- 配置 switchySharp 
    - 情景模式： http代理服务器    127.0.0.1   端口3000
    - 配置切换规则
    - 将插件设置为自动切换模式
- 启动写有拦截及转发逻辑的代理服务器，绑定地址为127.0.0.1，端口为3000
- 关于代理服务器：可以自己写，也有一些开源产品（比如[anyproxy](http://anyproxy.io/cn/)）

<!-- more -->

#### 系统应用软件(比如fiddler)
- Fiddler是一个代理服务器，绑定地址为127.0.0.1，端口8888
- Fiddler启动时，会将默认浏览器的代理服务器设为127.0.0.1:8888
- Fiddler是用C#写出来的，它监听windows系统的80端口，拦截并转发到自己的代理服务器地址


#### 修改DNS解析规则(更改域名对应的ip地址)
- 方法一：修改系统本地hosts文件
- 方法二：修改本地局域网路由器的DNS解析规则

#### 服务端反向代理
- 服务端反向代理服务器将请求转发给内部的其他服务器，并将得到的响应返回给请求客户端
- 开源产品Nginx
- 也可以自己用node写个反向代理服务器，监听80端口

{% highlight javascript %}

var http_proxy = require('http-proxy');
var http       = require('http');

var proxy      = http_proxy.createProxyServer({});

proxy.on(function(err,req,res){
    res.writeHead(500,{
        'Content-Type':'text/plain'
    });
});

var server=http.createServer(function(req,res){
    var host= req.headers.host;
    console.log(host);
    switch(host){
        case 'www.wangyn.net':
            proxy.web(req,res,{target:'http://localhost:3000'});
            break;
        case 'shoutbox.wangyn.net':
            proxy.web(req, res, { target: 'http://localhost:8000' });
            break;
        default:
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Welcome to my server!');
    }
});
console.log("listening on port 80");
server.listen(80);


{% endhighlight %}



