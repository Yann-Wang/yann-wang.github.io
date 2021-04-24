---
layout: post
title: 部分机型偶现白屏问题复盘报告
date: 2021-04-22
tags: [white screen, failure]
---

最近在复盘，回顾了下发生在2020年下半年的一次线上问题--部分机型偶现白屏问题。作为移动端C端业务一线的业务开发，平时应对的线上问题不胜枚举，之所以要复盘这个线上问题，除了因为该问题解决过程的非常曲折，还因为该问题所反映出的问题值得思考。

<!-- more -->

目录

- [背景](#背景)
- [问题描述](#问题描述)
- [环境 && 技术栈描述](#环境--技术栈描述)
  - [h5系统技术架构](#h5系统技术架构)
  - [h5系统的部署架构](#h5系统的部署架构)
  - [vue-cli-service打包后的index.html文件](#vue-cli-service打包后的indexhtml文件)
  - [打包前的代码结构](#打包前的代码结构)
- [解决过程时间轴](#解决过程时间轴)
- [关键问题解决方案](#关键问题解决方案)
  - [Script error问题](#script-error问题)
  - [收集error事件的报错信息](#收集error事件的报错信息)
  - [vue框架的报错冒泡机制 && sentry sdk如何收集vue报错](#vue框架的报错冒泡机制--sentry-sdk如何收集vue报错)
  - [```ERR_CONTENT_LENGTH_MISMATCH```问题分析](#err_content_length_mismatch问题分析)
- [总结](#总结)


#### 背景

所负责的系统是一个C端电商交易系统，包括多端，今天聊的这个线上问题发生在h5端。h5端由于是最早期开发出来的一个端，目前承接的流量达到了日均亿级PV。主要使用场景是在微信环境，也可以在非微信环境的其他渠道访问。


#### 问题描述
偶现部分安卓机型访问h5系统出现页面白屏。

#### 环境 && 技术栈描述
该h5系统的使用场景主要是微信环境，可以理解为挂在微信公众号下面的一个h5应用，但同时也支持多个其他非微信渠道的访问，比如外部浏览器，微博，以及其他第三方App。

##### h5系统技术架构
基于vue框架的spa应用，两层路由，第一层路由挂载一些全局组件（比如导航浮窗、底部导航栏），第二层路由对应各页面路由；顶通部分内容放在路由之外。

##### h5系统的部署架构
- 通过阿里云SLB做流量分发，接口请求流量不经过前端应用，直接分发到后端网关服务，网关再分发到后端各服务；
- 前端流量，index.html请求直接分发到前端应用，js/css/image/font等静态资源流量走cdn域名，优先被阿里云CDN承接，同时配置了cdn回源地址，指向前端应用的对应机器。

##### vue-cli-service打包后的index.html文件

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no">
	<title>xxxx</title>
	<link href=https://cc.aaa.com/css/xxxx.css rel=prefetch>
    <link href=https://cc.aaa.com/js/kkkkkk.ttttt.js rel=prefetch>
    <link href=https://cc.aaa.com/css/chunk-vendors.sssss.css rel=preload as=style>
    <link href=https://cc.aaa.com/js/chunk-vendors.mmmm.js rel=preload as=script>
</head>
<body>
	<div id=app></div>
    <script src=wechat-jssdk.js></script> <!-- 微信sdk脚本 -->
    <script src=risk-management-sdk.js></script> <!-- 风控脚本 -->
    <script src=track-sdk.js></script> <!-- 埋点脚本 -->
    <script src=https://cc.aaa.com/js/chunk-vendors.xxx.js></script> <!-- 打包后的chunk-vendors js文件 -->
    <script src=https://cc.aaa.com/js/app.yyyy.js></script> <!-- 打包后的js入口文件 -->
</body>
</html>
```

##### 打包前的代码结构
- 先说html文件，跟打包后的对比，打包前的html文件 没有本系统的js/css文件的引入，body标签内只有一个```<div id=app></div>```以及引入的第三方js sdk，此时html文件被当做一个模板（如下）；本系统的js、css文件引用，在打包时会动态打入html文件，即上面看到的打包后index.html的样子。

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no">
	<title>xxxx</title>
</head>
<body>
	<div id=app></div>
    <script src=wechat-jssdk.js></script> <!-- 微信sdk脚本 -->
    <script src=risk-management-sdk.js></script> <!-- 风控脚本 -->
    <script src=track-sdk.js></script> <!-- 埋点脚本 -->
</body>
</html>
```

- 再说js入口文件main.js
该文件在打包后即对应 打包后html文件中的app.yyyy.js

```javascript
// 引入vue package
// 引入vue组件库
// 引入 sentry sdk

// 挂载vue组件库
// 初始化埋点sdk
// 挂载vue实例到#app dom节点 //  此处挂载App.vue文件
// 初始化风控sdk
// 初始化前端监控 sentry sdk
```

- App.vue文件

```vue
<template>
    <!-- 顶通部分 -->
    <router-view /> <!-- 一级路由入口 对应Layout.vue -->
</template>
<script>
// watch $route中 执行了checkVersion方法
// 该方法对应的逻辑：用户在使用过程中，前端应用发布了新版本，通过页面维度的实时检测，发现有新版本后，自动重刷页面的技术方案
<script>
```


#### 解决过程时间轴
1. 最早5.10收到白屏问题反馈，但由于反馈用户非常少，所以客服团队和技术支持团队的同学没有向技术团队反馈。
2. 7.6 打日志： 分析Vue框架挂载后 走到了哪一步 App.vue，Layout.vue（对应一级路由组件，包含导航浮窗和底部导航栏）， 发现白屏用户已经加载了App.vue和Layout.vue （打日志是因为要验证一个猜测，白屏可能是业务逻辑报错导致的， 因为部分用户反馈页面中的顶通部分加载出来了）
3. 7.9 以为是偶现问题，做了兜底重刷，即发现白屏后重新刷新页面；如何识别白屏？ 白屏用户的hash路由都丢失了，只剩下了根路径（方案无效）
4. 7.9-7.15 h5系统全量接入前端监控
5. 7.15 为了进一步验证业务逻辑报错的猜测，分层收集了很多异常日志，上报到sentry （没有收集到业务报错）（后来仔细研究了vue框架的报错冒泡原理和sentry sdk收集vue框架报错的原理，发现不需要使用vue组件的errorCaptured和errorHandler方法，sentry sdk会自动接收以上两个方法接收到的报错）
6. 7.27 发现在安卓微信浏览器中 打开x5内核后台， 清理cookie和文件缓存，可以解决白屏问题；初步判断可能跟文件缓存有关
7. 8月份忙大促项目，被迫中断
8. 9.15  去掉 shopId丢失时的重刷 ， 去掉checkVersion重刷（因为在分布式部署场景，多机器逐渐发布时，会导致新老版本频繁切换，导致用户不可用） （尝试  无效果）
9. 9.17 重新梳理页面加载过程，发现一个监控盲区，从拉取到html文件开始，到sentry sdk初始化这一段过程，无法收集到报错，所以在html文件增加error事件监听逻辑
10. 9.19 暂存捕获的error事件报错，等vconsole加载完成后，再打印该报错， 收集到报错 Script error.
11. 9.23 配置script ```crossorigin=anonymous```允许跨域，联系运维配置cdn跨域头```Access-Control-Allow-Origin```，可以在vconsole看到我们自己js的详细错误
12. 9.24 收集到用户反馈的报错：h5系统静态资源报错 ```ERR_CONTENT_LENGTH_MISMATCH```，分析该报错，联系运维，经过多次沟通，以及查找技术方案，判定可能是cdn回源服务没有开启Gzip，于是让运维开启了Gzip，
13. 9.25 为风控脚本和埋点脚本也配置跨域头
14. 9.26 等了两天，没有收到新增白屏用户的反馈，于是判定问题解决，并移除了风控和埋点脚本的crossorigin


#### 关键问题解决方案

html文件增加监听error事件

```html
<script>
    window.addEventListener('error', function(e) {
        console.error(e);
        console.error('Erro type: ', e.type);
        console.error('Error message: ', e.message);
        console.error('Error filename: ', e.filename);
        console.error('Error lineno: ', e.lineno);
        console.error('Error colno: ', e.colno);
    }, false);
</script>
```

##### Script error问题
跨域script报错后，监听error事件拿到的信息会被拦截，打印出来的内容会变成```Script error.```，解决方案为：
1. 在script tag中增加```crossorigin=anonymous```
2. 给script服务(```cc.aaa.com```)配置跨域头```Access-Control-Allow-Origin: https://current-site.com```

具体可参考[1]

关于script脚本跨域请求：Error事件读取报错信息，以及script脚本跨域预加载：Error事件读取报错信息，具体可以见demo [6]

##### 收集error事件的报错信息
1. 方案一： 可通过动态加载vconsole展示error信息

```html
<script>
var url = window.location.href;
if (url && url.match(/[?&]debug=true/)) {
  var s = document.createElement('script');
  s.onload = function () {
    var vConsole = new VConsole();
  };
  s.onerror = function() {};
  s.src = './vconsole.min.js';
  s.async = false;
  document.getElementsByTagName("head")[0].appendChild(s);
}
</script>
```

可以增加一个开关，比如url中带有debug=true时才加载

此外，还有一点需要注意，受网络环境影响，js文件加载的先后顺序是不确定的；

如果报错发生在vconsole挂载成功之前，则```console.error```打印出的信息不能展示在vconsole中；可以加个兜底方案，增加vconsole加载状态，如果报错发生时还没有成功加载vconsole，则先存储在内存中，待vconsole加载成功后再从内存中一次性取出

```html
<script>
    window.errorList = [];
    window.vconsoleLoaded = false;
    window.addEventListener('error', function(e) {
        if (window.vconsoleLoaded) {
        console.error(e);
        console.error('Erro type: ', e.type);
        console.error('Error message: ', e.message);
        console.error('Error filename: ', e.filename);
        console.error('Error lineno: ', e.lineno);
        console.error('Error colno: ', e.colno);
        } else {
        window.errorList.push(e, e.type, e.message, e.filename, e.lineno, e.colno);
        }
    }, false);

    var s = document.createElement('script');
    s.onload = function () {
    var vConsole = new VConsole();
    console.log('cxssdfs')
    window.vconsoleLoaded = true;
    if (window.errorList.length) {
        window.errorList.forEach(it => {
        console.error(it);
        })
    }
    };
    s.onerror = function() {};
    s.src = './js/vconsole.min.js';
    s.async = false;
    document.getElementsByTagName("head")[0].appendChild(s);
</script>
```

方案一的缺点：需要联系用户，手动开启开关，并需要用户配合，收集vconsole中的信息；定位分析问题效率较低

2. 方案二： error事件收集的信息直接上报前端日志系统
前端日志系统这个概念还比较新，很多公司还没有前端日志系统，可以了解下美团的Logan[5]，当然自建肯定是最灵活的，但是有较高人力成本。

##### vue框架的报错冒泡机制 && sentry sdk如何收集vue报错
1. vue组件中的errorCaptured方法可以捕获组件内的报错，根据返回值来决定是否拦截该报错的冒泡
2. vue.config.errorHandler方法是vue框架的外层报错捕获方法，由内层冒泡出来的报错也可以在该方法中收到
3. sentry sdk 通过劫持vue.config.errorHandler方法来收集vue组件的报错。

如下为sentry sdk官方文档描述[7]
> Additionally, the SDK will capture the name and props state of the active component where the error was thrown. This is reported via Vue’s config.errorHandler hook.

4. sentry sdk 初始化

```javascript
import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

Sentry.init({
    dsn: 'xxx',
    integrations: [
      new Integrations.Vue({
        Vue,
        attachProps: true,
        logErrors: true
      }),
      new Sentry.Integrations.Breadcrumbs({ console: false })
    ],
    environment: process.env.VUE_APP_ENV,
    ignoreErrors: [],
    beforeBreadcrumb(breadcrumb) {
      //
    },
    beforeSend(event, hint) {
      //
    }
  });
```

##### ```ERR_CONTENT_LENGTH_MISMATCH```问题分析

根据[2]和[3]分析， 源站如果使用chunked分块传输，则需要配合开启Gzip。

可能是静态资源回源时报错，联系了运维查看了回源服务的日志，确实有相关报错，尝试让运维给回源服务开启了Gzip， 经过了两天的等待，确认问题已解决。


#### 总结

1. 前期监控系统不完善 && 监控范围不完整，通过猜的方式浪费了太多的时间
2. 首屏过程，在监控脚本加载之前的报错信息对于解决首屏报错非常有帮助，但非常容易被遗漏






<div class="references">References</div>

[1] [Resource loading: onload and onerror](https://javascript.info/onload-onerror)

[2] [资源添加CDN后访问文件大小为“0”](https://help.aliyun.com/knowledge_detail/93472.html?spm=5176.22414175.sslink.66.16981a40eocEa4)

[3] [OSS Content-legnth 异常](https://developer.aliyun.com/article/670675)

[4] [No way to tell when Sentry.init() is complete](https://github.com/getsentry/sentry-javascript/issues/1612)

[5] [美团开源 Logan Web：前端日志在 Web 端的实现](https://tech.meituan.com/2020/01/09/meituan-logan.html)

[6] [script脚本跨域请求------Error事件读取报错信息 && script脚本跨域预加载------Error事件读取报错信息](https://github.com/Yann-Wang/cross-origin-request-technology)

[7] [sentry sdk init in vue](https://docs.sentry.io/platforms/javascript/guides/vue/)
