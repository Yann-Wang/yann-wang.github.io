---
layout: post
title: emoji符号的编码
date: 2016-12-01 
tags: [emoji, symbol]
---

>绘文字（日语：絵文字／えもじ emoji）是使用在网页和聊天中的形意符号，
最初是日本在无线通信中所使用的视觉情感符号（图画文字），绘意指图形，
文字则是图形的隐喻，可用来代表多种表情，如笑脸表示笑、蛋糕表示食物等。

>2010年10月发布的Unicode 6.0版首次收录绘文字编码，其中582个绘文字符号，
66个已在其他位置编码，保留作兼容用途的绘文字符号。
在Unicode 9.0 用22区块中共计1,126个字符表示绘文字，其中1,085个是独立绘文字字符，
26个是用来显示旗帜的区域指示符号（英语：Regional Indicator Symbol）
以及 12 个(#, * and 0-9)键帽符号。

<!-- more -->


#### emoji目前的支持程度
目前，一些Windows Phone手机和iPhone设备都已经内置了emoji表情图释，emoji图释
也开始现身在电子邮件服务比如Gmail（通过Google实验室），
苹果Mac OS X 操作系统也支持输入Emoji字符。
安卓设备对于emoji的支持取决于不同的操作系统版本。
Google从Android4.4版本开始原生支持键盘输入emoji图释，
Emoji在Google Hangouts应用中也可以使用（独立于键盘）。

#### emoji的html编码格式
现在看一下年度最火的emoji符号： face with tears of joy(喜极而泣)

&#x1F602;

对应的html编码为 &amp;#x1F602;

所以emoji符号的html编码格式为： &#x + 十六进制 + ;

对应的unicode编码为 U+1f602

对应的uft8编码为 \xF0\x9F\x98\x82   

由上一篇文章可知，基本多文种平面字符占用2字节的编码空间，辅助平面字符占用4字节编码空。
而emoji字符既有基本多文种平面字符，也有辅助平面字符, 上例中的字符属于辅助平面字符，所以它占4字节编码空间。


其它emoji符号的unicode编码和utf8编码可以查询[这里](http://apps.timwhitlock.info/emoji/tables/unicode#block-2-dingbats)

代码验证

在浏览器中：
{% highlight html %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width,initial-scale=1.0, maximum-scale=1.0,user-scalable=no">
    <title>Title</title>
</head>
<body>
    <p class="p1">😂</p>
    <p class="p2">&#x1F602;</p>
    <p class="p3"></p>
    <p class="p4"></p>
    <script>
        let $ = function (selector) {
            return document.querySelector(selector);
        };
        let lg = console.log.bind(console);

        $('.p3').textContent = '\xF0\x9F\x98\x82';
        $('.p4').textContent = '&#x1F602;';
        
        lg($('.p1').textContent);        

    </script>
</body>
</html>
{% endhighlight %}

在Node.js中：
{% highlight javascript %}
'use strict';
let fs = require('fs-extra');

const buf = Buffer.from('😂'); // default :uft8
let strhex = buf.toString('hex');

console.log(strhex); // 'f09f9882'


const buf2 = Buffer.from([0xf0,0x9f,0x98,0x82]);
let str2 = buf2.toString();

fs.outputFile("./build/file.js", str2, function (err) {
    console.log("output to file.js successfully.");
    // execute callback
});

{% endhighlight %}

你可能会意识到，好像跟你之前见到的不一样。 恩， 是不一样，但上面的样子才是其编码的最原始的样子。
你通常所看到的样子都是各个公司重新实现的该编码所对应的图片，如下面所示：

<style>
.emoji li{
    overflow:hidden;
}

.emoji span{
    display:inline-block;
    float:left;
    height:36px;
    width: 80px;
    line-height:36px;
    margin-right:30px;
}
.emoji img{
    float:left;
    width:36px;
    height:36px;
}
</style>
<ul class="emoji">
<li><span>Apple:    </span> <img alt="face with tears of joy" src="/assets/img/face_tears_apple.png"></li>
<li><span>Google:   </span> <img alt="face with tears of joy" src="/assets/img/face_tears_google.png"></li>
<li><span>Facebook: </span> <img alt="face with tears of joy" src="/assets/img/face_tears_fb.png"></li>
<li><span>Microsoft:</span> <img alt="face with tears of joy" src="/assets/img/face_tears_ms.png"></li>
</ul>

其他公司的实现可以参见[这里](http://emojipedia.org/face-with-tears-of-joy/)

#### emoji符号集合
- [可以到这里查找自己需要的emoji表情符号](http://www.megaemoji.com/cn/emoji/)
- [还有这里](http://www.megaemoji.com/)

#### node模块： 将emoji符号编码转换为对应的图片
- [emoji](https://www.npmjs.com/package/emoji)

<div class="references">References</div>

[wikipedia](https://en.wikipedia.org/wiki/Emoji)
 
[Emoji Unicode Tables](http://apps.timwhitlock.info/emoji/tables/unicode#block-2-dingbats) 