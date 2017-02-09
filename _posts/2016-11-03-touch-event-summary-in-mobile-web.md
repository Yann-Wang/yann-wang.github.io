---
layout: post
title: 移动web中的触摸事件
date: 2016-11-03 20:40:55
tags:
- touch event
- mobile web

---

### touch event
- 触摸事件：touchstart, touchmove, touchend, touchcancel
- 兼容性：iOS版Safari, Android版WebKit, OS6+的BlackBerry WebKit, Opera Mobile 10.1+。 桌面版Firefox 6+和Chrome也支持触摸事件。

<!-- more -->

- 除了常见的DOM属性外，触摸事件还包含下列三个用于跟踪触摸的属性。
    - touches：表示当前跟踪的触摸操作的Touch对象的数组。
    - targetTouches：特定于事件目标的Touch对象的数组。
    - changeTouches：
        - 对于 touchstart 事件, 这个 TouchList 对象列出在此次事件中新增加的触点。
        - 对于 touchmove 事件，列出和上一次事件相比较，发生了变化的触点。
        - 对于 touchend ，列出离开触摸平面的触点（这些触点对应已经不接触触摸平面的手指）。
    - 每个Touch对象包含下列属性：clientX, clientY, identifier, pageX, pageY, screenX, screenY, target

### multi touch event
- Android2.3及以下版本的系统在浏览器里不支持多点触控。
- 如果你的布局复杂，或者需要固定定位，用原生的双指缩放来放大将会打破你的布局，直到使用者重新载入。
- 唯一的办法就是重新自行实现双指缩放手势。


### gesture event
- gesture事件: gesturestart, gestureend, gesturechange 
- 只有iOS支持
- 经过实测：Android不支持上述gesture事件


### custom gesture event demo 
- [see code](https://github.com/Yann-Wang/DOM_Event/tree/master/TouchEvent/touch-event)
- scroll text
- swipe button/slides
- tap button


### gesture library
- hammer
    - basic gesture: swipe, pan, tap, press, rotate, pinch
- zepto
    - tap, singleTap, longTap, swipe, swipeLeft, swipeRight, swipeUp, swipeDown


### orientation event
- 在window对象上有orientationchange,resize事件
- css中可通过@media screen and (orientation: landscape)实现横向媒体查询
