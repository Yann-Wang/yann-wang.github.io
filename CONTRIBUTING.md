
目录

- [开发指南](#开发指南)
  - [插入目录](#插入目录)
  - [插入标题](#插入标题)
  - [插入文章预览截断标识](#插入文章预览截断标识)
  - [插入表格](#插入表格)
  - [插入图片](#插入图片)
  - [插入列表](#插入列表)
  - [插入引用](#插入引用)
  - [插入参考](#插入参考)
  - [其他功能](#其他功能)
- [待解决问题](#待解决问题)
  - [博客首屏较慢](#博客首屏较慢)
- [Jekyll介绍](#jekyll介绍)
  - [关于GitHub页面和Jekyll](#关于github页面和jekyll)
  - [为什么不使用Hexo](#为什么不使用hexo)


#### 开发指南

##### 插入目录

- 使用

  1. 增加目录标识（该标识可以支持目录展示在左侧（PC上打开时））

  ```html
      <p class="category">目录</p>
  ```

  2. 插入目录： 快捷键cmd+shift+p，选择```Create Table of Contents```命令，插入目录


- 目录自动生成原理：借助了VS Code插件： [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one#github-flavored-markdown)




##### 插入标题

目前的标题自定义样式，支持了h3-h6


##### 插入文章预览截断标识

<!-- more -->

##### 插入表格

参考 [github pages 官方的markdown语法教程](https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet#tables)

格式化快捷键： alt+shift+f

示例如下：

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
{: .table}

>{: .table} 必须要有，否则页面中无法展示条线

markdown table 生成工具： [Tables Generator](https://www.tablesgenerator.com/markdown_tables)

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



##### 其他功能

- [VSCode 原生支持的Markdown能力](https://code.visualstudio.com/docs/languages/markdown)
- [Markdown All in One插件支持的Markdown能力](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
- [GitHub Pages支持的Markdown能力](https://github.github.com/gfm/)


#### 待解决问题

##### 博客首屏较慢

是首屏拉取html文件较慢，主要原因是github服务器在国外，可以考虑在国内部署，参考[这篇文章](https://www.10101.io/2018/09/18/Blog_3)


#### Jekyll介绍
Jekyll 是一个静态站点生成器。

[Jekyll官网](https://jekyllrb.com/)
[Jekyll官网 中文](https://jekyllcn.com/)

##### 关于GitHub页面和Jekyll


1. [GitHub Pages 和 Jekyll](https://docs.github.com/zh/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll)
2. 使用 Jekyll 创建站点
3. [使用 Jekyll 本地测试站点](https://docs.github.com/zh/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll)
4. 将内容添加到 Pages 站点
5. 设置 Markdown 处理器
6. 将主题添加到 Pages 站点
7. Pages 的 Jekyll 构建错误
8. 排查 Jekyll 错误


以上内容，详见[这里](https://docs.github.com/zh/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll)。

##### 为什么不使用Hexo

因为GitHub Pages 不支持Hexo，但支持Jekyll。
