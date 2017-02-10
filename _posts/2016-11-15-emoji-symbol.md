---
layout: post
title: emoji符号的编码
date: 2016-11-15 
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

#### XML和Unicode
>XML及其子集XHTML采用UTF-8作为标准字集，理论上我们可以在各种支持XML标准的浏览器上显示
任何地区文字的网页，只要电脑本身安装有合适的字体即可。
可以利用&#nnn;的格式显示特定的字符。nnn代表该字符的十进制Unicode代码。
如果采用十六进制代码，在编码之前加上x字符即可。但部分旧版本的浏览器可能无法识别十六进制代码。
由于Unicode版本发展原因，很多浏览器只能显示UCS-2完整字符集，也即现在使用的Unicode版本中的一个小子集。

#### XML与HTML字符实体引用
>在SGML、 HTML与XML文档，如果某些Unicode字符在文档的当前编码方式(如ISO-8859-1)
中不能直接表示，那么可以通过字符值引用或者字符实体引用两种转义序列来表示这些不能直接编码的字符。
下文列出在HTML与XML文档中有效的字符实体引用。

XML规范定义了5个"预定义实体"来表示特殊字符.

|引用格式  |   字符 |  Unicode编码 |
|:-------:|:-----:|:-----------:|
| &amp;quot;  |  "    | U+0022 (34) |
| &amp;amp;   |  &    | U+0026 (38) |
| &amp;apos;  |  '    | U+0027 (39) |
| &amp;lt;    |  <    | U+003C (60) |
| &amp;gt;    |  >    | U+003E (62) |
{: .table}

##### HTML中的字符实体引用
HTML 4 DTD定义了252个命名实体。HTML 4规范要求使用标准DTD，并且不允许用户定义其它的命名实体.

#### 字符值引用
>字符值引用 (numeric character reference, NCR)是在标记语言SGML以及派生的
如HTML与XML中常见的一种转义序列结构，用来表示Unicode的通用字符集 (UCS)中的单个字符. 
NCR可以表示在一个特定文档中不能直接编码的字符，而该标记语言阅读器软件把每个NCR当作一个字符来处理。

>例如，在ISO/IEC 8859-1编码的网页文件中使用了俄文字母或者希腊字母。
由于该编码不支持这些字母，就需要用NCR来表示。网页浏览器可以正确地把这些NCR绘制为相应的
西里尔字母或希腊字母。

在SGML, HTML, XML中, 下述是希腊字母Sigma的有效的字符值引用:

| 标记语言中的字符值引用|   进位制 |   Unicode字符 |
|:-------:|:---------:|:-----------:|
| &amp;#931;  |  十进制    | U+03A3 |
| &amp;#0931; |  十进制    | U+03A3 |
| &amp;#x3A3; |  十六进制  | U+03A3 |
| &amp;#x03A3;|  十六进制  | U+03A3 |
| &amp;#x3a3; |  十六进制  | U+03A3 |
{: .table}

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
<li><span>Apple:    </span> <img alt="face with tears of joy" src="http://okup5z621.bkt.clouddn.com/face_tears_apple.png"></li>
<li><span>Google:   </span> <img alt="face with tears of joy" src="http://okup5z621.bkt.clouddn.com/face_tears_google.png"></li>
<li><span>Facebook: </span> <img alt="face with tears of joy" src="http://okup5z621.bkt.clouddn.com/face_tears_fb.png"></li>
<li><span>Microsoft:</span> <img alt="face with tears of joy" src="http://okup5z621.bkt.clouddn.com/face_tears_ms.png"></li>
</ul>

其他公司的实现可以参见[这里](http://emojipedia.org/face-with-tears-of-joy/)

#### emoji符号集合
- [可以到这里查找自己需要的emoji表情符号](http://www.megaemoji.com/cn/emoji/)
- [还有这里](http://www.megaemoji.com/)

#### node模块： 将emoji符号编码转换为对应的图片
- [emoji](https://www.npmjs.com/package/emoji)

<div class="references">references</div>

[wikipedia](https://en.wikipedia.org/wiki/Emoji)

[Unicode](https://en.wikipedia.org/wiki/Unicode)

[List of XML and HTML character entity references](https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references)
 
[numeric character reference, NCR](https://en.wikipedia.org/wiki/Numeric_character_reference) 
 
[常用HTML转义字符](http://zqdevres.qiniucdn.com/data/20120726145112/index.html) 