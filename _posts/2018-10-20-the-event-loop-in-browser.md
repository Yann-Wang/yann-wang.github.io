---
layout: post
title: 浏览器中的Event Loop
date: 2018-10-20
tags: [event loop, w3c, ecmascript, v8]
---

因为网络上关于Event Loop的文章很多，所以先说下这篇文章的卖点：
1. 根据whatwg标准进行讲解
2. 引述ecmascript规范
3. 包括了JSConf.Asia 2018 和 JSConf.EU 2018 中的内容
4. 较多的demo用于验证

<!-- more -->

首先说下whatwg vs w3c，为什么优先选用whatwg？
1. whatwg更新更及时
2. [w3c的一些内容经常参考whatwg](https://stackoverflow.com/questions/6825713/html5-w3c-vs-whatwg-which-gives-the-most-authoritative-spec)

下面，我们开始~

#### 

<div class="references">References</div>

[event loop spec in whatwg](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)

[event loop spec in w3c](https://www.w3.org/TR/2011/WD-html5-20110525/webappapis.html#event-loops)

