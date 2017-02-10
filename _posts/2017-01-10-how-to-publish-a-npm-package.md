---
layout: post
title: 如何发布一个npm包
date: 2017-01-10 
tags: [npm package]
---

今天来聊下npm包的发布流程, 主要包括切换npm源、登录npm、发布、修改等四个步骤

#### 将npm切换为默认源

{% highlight shell %}
npm config ls # 查看源
# 如果当前设置的源不是npm官方的默认源，则修改为默认源
npm config set registry https://registry.npmjs.org/
# 或者使用yarn
yarn config set registry https://registry.npmjs.org/
{% endhighlight %}

<!-- more -->

#### 登录npm

{% highlight shell %}
npm login
# input username
# input password
{% endhighlight %}

#### 发布

{% highlight shell %}
cd packagePath
npm publish
{% endhighlight %}

#### 修改

{% highlight shell %}
# 修改包
# 将package.json中的version字段的修正版本号+1
npm publish
{% endhighlight %}


下面是自己写的两个npm包:

[Seqlist](https://www.npmjs.com/package/seqlist) 这个包封装了数组的一些常用算法, 
如洗牌算法、topk算法、抽奖算法、二分查找算法, 并详注了每个算法实现的时间复杂度和空间复杂度

[ascii-text-generator](https://www.npmjs.com/package/ascii-text-generator) 
这个包把26个字母和10个数字字符转换为一个放大版的字符, 用于生成ascii logo  