
#### 开发指南

##### 画表格

参考 [github pages 官方的markdown语法教程](https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet#tables)

示例如下：

|引用格式  |   字符 |  Unicode编码 |
|:-------:|:-----:|:-----------:|
| &amp;quot;  |  "    | U+0022 (34) |
| &amp;amp;   |  &    | U+0026 (38) |
| &amp;apos;  |  '    | U+0027 (39) |
| &amp;lt;    |  <    | U+003C (60) |
| &amp;gt;    |  >    | U+003E (62) |
{: .table}


##### 插入图片

![data reset @2x](https://cdn.phoenician.cn/lynx_performance_summary/data_reset-min.jpeg)

1. [图片要压缩](https://compressjpeg.com/zh/) 最好控制在50kb以内，超过100kb的图片要尽量少，不建议图片超过300kb
2. [图片要上传CDN](https://portal.qiniu.com/kodo/bucket/resource-v2?bucketName=download)
3. 图片要增加二倍图标识 @2x


##### 插入列表

包括有序列表和无序列表

列表后要预留一个空行，否则会导致列表标题跟列表项内容连接到同一行。

##### 插入引用

>引用正文

在jekyll模板的基础上，自定义了引用的样式（参考飞书文档）


##### 插入参考

<div class="references">References</div>

[1] [Resource loading: onload and onerror](https://javascript.info/onload-onerror)

##### 插入文章预览截断标识

<!-- more -->

##### 插入目录

- 使用

  1. 增加目录标识（该标识可以支持目录展示在左侧（PC上打开时））

  ```html
      <p class="category">目录</p>
  ```

  2. 插入TOC：详情点击[这里](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-cn/toc)


- 目录自动生成原理：借助了VS Code插件： Markdown Preview Enhanced


