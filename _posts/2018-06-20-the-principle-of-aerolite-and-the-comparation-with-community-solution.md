---
layout: post
title: aerolite 实现原理及社区解决方案对比分析
date: 2018-06-20
tags: [aerolite, file, download, file-download, callback, cors]
---

先甩两个地址：

[```https://www.npmjs.com/package/aerolite```](https://www.npmjs.com/package/aerolite)

[```https://github.com/Yann-Wang/aerolite```](https://github.com/Yann-Wang/aerolite)

心急的老哥可能已经跳过去看了，没错， aerolite 是一款二进制文件下载器，它的特点是支持回调函数（在文件下载成功或失败时，调用对应的回调函数），并且解决了跨域情况下丢失文件名的问题；最后，它非常轻量，无任何依赖。

接下来按照下面的顺序展开讲:

1. 初衷
2. why下载二进制文件并且支持回调函数是一个问题？
3. 社区解决方案
4. aerolite源码

<!-- more -->

#### 初衷

业务需求中一些文件下载场景，需要根据文件下载的成功和失败状态有不同的交互逻辑

![file download dialog](http://okup5z621.bkt.clouddn.com/file-download-dialog-demo.jpeg)

比如上面的场景，如果要求在点击确认导出后开始下载文件，并且在文件下载成功后关闭Dialog，在文件下载失败后弹出一个Toast错误提示， 那么就需要文件下载器支持回调函数了。

#### why下载二进制文件并且支持回调函数是一个问题？

浏览器的GET(iframe、a)和POST(form)请求具有如下特点:

1. response会交由浏览器处理
2. response内容可以为二进制文件、字符串等

Ajax请求具有如下特点:

1. response会交由Javascript处理
2. response内容可以为二进制文件、字符串等
3. Ajax本身无法触发浏览器的下载功能

#### 社区解决方案

接下来从以下三种情况来展开

1. 不支持回调函数的解决方案
2. 支持回调函数的解决方案
3. 支持回调函数并支持跨域的解决方案

##### 不支持回调函数的解决方案

大概有以下四种：

- a / location.href
- a.download
- iframe
- window.open

###### a / location.href

```<a href=“path/to/file”>download file</a>```

后端以stream的形式返回二进制文件并且需要配Content-Disposition头，即可与前端a配合完成下载

如果后端没有配Content-Disposition头，则浏览器会跳转到a/location.href的指定路径， 去加载该文件内容（以pdf文件为例进行了测试）

虽然后端配了Content-Disposition头，可以完成下载，但在控制台network中该请求会保持pending状态（有如下提示）

![pending reminder](http://okup5z621.bkt.clouddn.com/a-and-stream-demo.jpeg)

###### a.download

```<a href=“path/to/file” download=“filename”>download file</a>```

后端以stream的形式返回二进制文件即可与前端a.download配合完成下载

如果后端没有配Content-Disposition头，则文件名以a.download属性指定的文件名为准

如果后端配了Content-Disposition头，则以该http头中的filename字段指定的为准

###### iframe

```<iframe style=“display:none” src=“path/to/file”></iframe>```

后端以stream的形式返回二进制文件即可与前端iframe配合完成下载

如果后端配了Content-Disposition头，则以该http头中的filename字段指定的为准

###### window.open

```window.open(‘path/to/file’)```

后端以stream的形式返回二进制文件并配了Content-Disposition头即可完成下载

如果后端没有配Content-Disposition头，则浏览器会跳转到openurl的指定路径， 去加载该文件内容（以pdf文件为例进行了测试）


##### 支持回调函数的解决方案

大概有以下两种：

1. XMLHttpRequest.responseType=“blob” + a.download
2. iframe + cookie

###### XMLHttpRequest.responseType=“blob” + a.download

下面顺带介绍下XMLHttpRequest的responseType都有哪些值

[responseType](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType): text, arraybuffer, blob, json, document …

下面是responseType: blob的兼容性

![responseType:blob compatibility](http://okup5z621.bkt.clouddn.com/xhr-responseType-blob-compatibility.jpeg)

还好嘛~

###### iframe + cookie

通过在cookie中添加一个唯一性字段标识文件下载是否成功

社区开源库:

[jquery.fileDownload.js](https://github.com/johnculviner/jquery.fileDownload/blob/master/src/Scripts/jquery.fileDownload.js)

[download-client-listener](https://www.ctolib.com/download-client-listener.html)


说下iframe + cookie这种方案的弊端

- 架构角度
  - 使用cookie存储业务信息会污染全局cookie
  - 一般真实的项目，cookie <—> session 只用于保存登录态（cookie中记录sessionId），不会在cookie中放一些业务信息，避免污染全局cookie

- 技术角度
  - 单个接口中传递的cookie, 无法通过document.cookie读取


##### 支持回调函数&&跨域的解决方案

- XMLHttpRequest.responseType=“blob” + a.download + Access-Control-Expose-Headers

为什么加这个头Access-Control-Expose-Headers ？

因为跨域情况下无法读取后端传递的文件名，加上这个头后，js可以从Content-Disposition头的filename字段中提取出文件名（如下图）

![access-control-expose-headers.jpeg](http://okup5z621.bkt.clouddn.com/access-control-expose-headers.jpeg)


ps: 补充点背景知识

> ```Access-Control-Expose-Headers```
> 译者注：在跨域访问时，XMLHttpRequest对象的getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。

> Access-Control-Expose-Headers 头让服务器把允许浏览器访问的头放入白名单，例如：
> ```Access-Control-Expose-Headers: X-My-Custom-Header, X-Another-Custom-Header```
  这样浏览器就能够通过getResponseHeader访问X-My-Custom-Header和 X-Another-Custom-Header 响应头了。

跨域后端配置

for all methods:
```access-control-allow-credentials```
```access-control-allow-origin```
```access-control-expose-headers```

For OPTIONS:
```access-control-allow-methods```
```access-control-allow-headers```


#### aerolite 源码

ajax请求二进制文件的逻辑

{% highlight javascript %}
  function aerolite(url) {
    var r = new XMLHttpRequest()
    r.open('GET', url)
    r.responseType = 'blob'
    r.withCredentials = true
    r.onreadystatechange = function() {
      var attachmentFilename = r.getResponseHeader('Content-Disposition')
      attachmentFilename = getFileName(attachmentFilename)
      if (r.readyState === 4) {
        if (r.status === 200) {
          createAndDownloadFile(attachmentFilename || fileName, r.response)
          successCallback()
        } else {
          failCallback()
        }
      }
    }
    r.send(null)
  }
{% endhighlight %}

触发浏览器下载的逻辑

{% highlight javascript %}
  function createAndDownloadFile(fileName, content) {
    var aTag = document.createElement('a')
    var blob = new Blob([content])
    aTag.download = fileName
    aTag.href = URL.createObjectURL(blob)
    aTag.target = '_self' // required in FF
    document.body.appendChild(aTag) // required in FF
    aTag.click()
    URL.revokeObjectURL(blob)
    aTag.parentNode.removeChild(aTag)
  }
{% endhighlight %}

从Content-Disposition头提取文件名的逻辑

{% highlight javascript %}
  function getFileName(name) {
    if (name) {
      var target = name.split(';').filter(function(item) {
        return item.indexOf('filename=') > -1
      })
      if (target && target[0]) {
        return target[0].split('filename=')[1].replace(/(^['"])|(['"]$)/g, '')
      }
    }
    return ''
  }
{% endhighlight %}


<div class="references">references</div>

- [Access-Control-Expose-Headers](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS#Access-Control-Expose-Headers)
- [XMLHttpRequest.responseType compatibility](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType)
