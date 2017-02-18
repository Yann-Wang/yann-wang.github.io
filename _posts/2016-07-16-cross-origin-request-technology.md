---
layout: post
title: 跨域请求技术
date: 2016-07-16 
tags: [cross origin, CORS, imgPing, jsonp, Comet, Server-Sent Events, Web Socket]
---

更新： 使用form表单发送请求不存在跨域限制， 也就是说使用form表单可以跨域发送请求。
web安全中的CSRF攻击就是利用了这一点。
对form表单可以跨域发送请求的验证可以参考[这里](https://github.com/Yann-Wang/csrf-demo)。

本文来总结下常用的6种跨域请求技术：跨域资源共享CORS, 图像Ping, JSONP, Comet, 服务器发送事件, Web Socket 

1. 跨域资源共享CORS（Cross-Origin Resource Sharing）------ xhr  需要服务端返回带有  `Access-Control-Allow-Origin` 的响应头

2. 图像Ping------动态生成img标签
<!-- more -->
3. JSONP------动态生成script标签

4. Comet `['kɒmɪt]`------长链接   http 流

5. 服务器发送事件------EventSource 对象

6. Web Socket------WebSocket 对象


#### 前后端代码实现
- 请访问我的 [github](https://github.com/Yann-Wang/cross-origin-request-technology)