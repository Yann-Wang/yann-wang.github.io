---
title: 为什么加入overflow:hidden即可清除浮动呢？
date: 2016-10-10 20:40:55
tags:
- CSS
- BFC
- overflow:hidden
- clear float

---

#### 概念

##### Box: CSS布局的基本单位
- 　Box 是 CSS 布局的对象和基本单位， 直观点来说，就是一个页面是由很多个 Box 组成的。元素的类型和 display 属性，决定了这个 Box 的类型。 不同类型的 Box， 会参与不同的 Formatting Context（一个决定如何渲染文档的容器），因此Box内的元素会以不同的方式渲染。让我们看看有哪些盒子：
    - block-level box:display 属性为 block, list-item, table 的元素，会生成 block-level box。并且参与 block fomatting context；
    - inline-level box:display 属性为 inline, inline-block, inline-table 的元素，会生成 inline-level box。并且参与 inline formatting context；
    - run-in box: css3 中才有， 这儿先不讲了。
<!-- more -->
##### Formatting context
- Formatting context 是 W3C CSS2.1 规范中的一个概念。它是页面中的一块渲染区域，并且有一套渲染规则，它决定了其子元素将如何定位，以及和其他元素的关系和相互作用。最常见的 Formatting context 有 Block fomatting context (简称BFC)和 Inline formatting context (简称IFC)。
- CSS2.1 中只有 BFC 和 IFC, CSS3 中还增加了 GFC 和 FFC。

##### BFC 定义
- BFC(Block formatting context)直译为"块级格式化上下文"。它是一个独立的渲染区域，只有Block-level box参与， 它规定了内部的Block-level Box如何布局，并且与这个区域外部毫不相干。

#### BFC定义了如下布局规则：
1. 内部的块元素会在垂直方向，一个接一个地放置。  
2. 块元素垂直方向的距离由margin决定。两个相邻块元素的垂直方向的margin会发生重叠。  
3. 每个元素的左外边距，与包含块的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
4. BFC的区域不会与float元素的区域重叠。
5. BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。  
6. 计算BFC的高度时，浮动元素也参与计算


#### 那么，在什么情况下，元素的BFC才能生效呢？
- 根据CSS规范，当给元素添加下列Style属性时，元素成为一个BFC元素。
    - float为 left|right
    - overflow为 hidden|auto|scroll
    - display为 table-cell|table-caption|inline-block|flex|inline-flex
    - position为 absolute|fixed

#### 为什么加入overflow:hidden即可清除浮动呢？
> overflow: hidden;在布局时有神奇的治理布局塌方的功效。

- 其实，这是CSS2.1中定义的一个叫BFC(Block formatting context)的概念在起作用。所谓BFC，可直译为“块格式化上下文”，BFC定义了一块独立的渲染区域，规定了其内部块级元素的渲染规则，其渲染效果不受外界环境的干扰。
- 使用overflow:hidden清除浮动就分别用到了规则的6和4。

#### citation
- BFC [神奇背后的原理](http://www.cnblogs.com/lhb25/p/inside-block-formatting-ontext.html)

