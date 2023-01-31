---
layout: post
title: Lynx性能优化总结
date: 2022-11-01
tags: [user experience, performance, optimize, lynx]
---

>Lynx是字节自研的高性能跨端框架，特点是兼顾Native的高性能和Web的跨平台和开发高效，在字节系核心业务（抖音、头条）中广泛使用。目前还未开源，跟社区中Taro, ReactNative, Weex等有一定的相似性。

本文主要总结下自己在做Lynx页面性能优化中的一些经验。
<!-- more -->

目录

- [背景](#背景)
- [优化概览](#优化概览)
- [Lynx页面生命周期](#lynx页面生命周期)
- [数据采集](#数据采集)
  - [指标](#指标)
  - [埋点SDK](#埋点sdk)
  - [性能看板](#性能看板)
  - [数据推送](#数据推送)
- [性能问题分析工具](#性能问题分析工具)
  - [trace分析](#trace分析)
- [优化方案](#优化方案)
  - [首屏优化](#首屏优化)
    - [离线化](#离线化)
    - [缓存渲染](#缓存渲染)
      - [首屏直出](#首屏直出)
      - [缓存直出](#缓存直出)
    - [首屏非必要组件延后创建](#首屏非必要组件延后创建)
    - [数据预取](#数据预取)
    - [包体积优化](#包体积优化)
      - [第三方依赖](#第三方依赖)
      - [包体优化](#包体优化)
  - [体验优化](#体验优化)
    - [FPS（滑动帧率）优化](#fps滑动帧率优化)
    - [数据管理方案（redux）](#数据管理方案redux)
    - [计算结果缓存](#计算结果缓存)
    - [JSB传输耗时优化](#jsb传输耗时优化)
    - [减少diff](#减少diff)
    - [减少re-render](#减少re-render)
      - [合并更新](#合并更新)
    - [减少数据回设](#减少数据回设)
    - [长列表数据预加载](#长列表数据预加载)
    - [Lynx提供的最佳实践](#lynx提供的最佳实践)
  - [内存优化](#内存优化)
- [防劣化](#防劣化)
  - [数据监控](#数据监控)
  - [自动化性能测试](#自动化性能测试)


### 背景
抖音电商商城业务是抖音App内最大的一块面向C端用户的电商业务，其内部有多个细分子业务方向，虽然使用的都是Lynx技术栈，但在Lynx页面性能优化方面仍然存在性能指标不对齐、采集方式不一致、指标看板不可复用、优化方式不统一、性能监控不到位等问题。所以需要输出一套统一的性能优化技术体系来解决以上问题。


### 优化概览
![Performance Summary](/assets/img/performance_summary.jpg "PerformanceSummary")


### Lynx页面生命周期
![Performance Summary](/assets/img/lynx_page_lifecycle.jpg "LynxPageLifecycle")

### 数据采集


#### 指标
>1. T开头的为前端埋点
>2. update_timings.__lynx_timing_actual_fmp开头的为lynx内部埋点
>3. 其他为直播容器埋点
>4. TEA为字节内部的数据行为分析系统，TEA虚拟属性由几个真实属性计算而来

![Data Collect Index](/assets/img/data_collect_index.jpg "DataCollectIndex")

#### 埋点SDK
>技术方案设计：待补
>使用文档： 待补

#### 性能看板
常用的看板可按如下分类。
![Data Board](/assets/img/data_board.jpg "DataBoard")
#### 数据推送
这里主要使用TEA平台数据看板上的订阅能力，在订阅能力中录入飞书群id，然后在指定飞书群增加“数据平台推送服务”机器人；这样即可实现每天指定时间给指定飞书群推送指定看板的数据报表。

### 性能问题分析工具
字节内部有多个性能分析工具
1. LynxPerf App ：可以录制iOS和Android双端的Lynx页面火焰图，生成trace文件，然后通过[trace读取工具](https://ui.perfetto.dev/)来分析trace文件。
2. Diggo App: 支持FPS分析，内存分析，卡顿分析，trace分析等，功能比较全面。

#### trace分析
通过trace分析，得到页面首屏各阶段的执行逻辑以及时间消耗，检查有无以下问题：
1. 首屏各阶段有无多余执行逻辑
2. 首屏各阶段时间消耗是否过长

### 优化方案

#### 首屏优化

##### 离线化
![Offline Resource @2x](/assets/img/offline_resource.jpeg "OfflineResource")

优化资源加载时间： 让产物以离线包的方式加载 （字节内部的Lynx页面资源基本都是使用Gecko离线化能力）。
>Gecko是字节内部的资源分发平台，支持以离线和在线的方式通过CDN向双端App分发资源产物。
##### 缓存渲染
优化用户体感上的等待时长

![Cache Output](/assets/img/cache_output.jpg "CacheOutput")


###### 首屏直出
基于Lynx的首屏直出能力，在页面创建时直接渲染缓存数据。

![FirstScreen Output](/assets/img/first_screen_output.jpg "FirstScreenOutput")

上图是首屏直出逻辑流程图，在页面打开是，会同时执行三个逻辑：
1. 读取缓存配置文件并根据配置文件将本地缓存数据（storage_data）注入lynx.globalProps中
2. 执行数据预取(prefetch_data)
3. 初始化容器，加载页面资源

当执行首屏渲染逻辑时，如果仅获取到了storage_data，则优先进行缓存数据渲染。
###### 缓存直出

在没有首屏直出的条件下，在接口数据返回之前，通过JS读取本地缓存数据，直接创建页面。


##### 首屏非必要组件延后创建
![Not needed component in first screen](/assets/img/not_needed_component_in_first_screen.jpg "NotNeededInFirstScreen")

- Case 1
比如弹窗可能要等到接口返回或用户行为之后才会展示，这种组件就可以延后创建
如何衡量收益：可通过trace分析来看该组件创建的耗时。

- Case 2
商城1.0版本中，首屏接口返回后，会创建20+个<x-tab-bar-item />组件，通过trace分析发现，耗时500ms，但除了首屏用到的5个tab，其他tab都是不可见的；所以在数据返回后，先创建5个tab，在页面ready之后再创建后面的15个tab，这样首屏tab渲染耗时下降到100ms。
##### 数据预取
![data prefetch](/assets/img/data_prefetch.jpg "DataPrefetch")

提前接口请求的时间点到路由跳转甚至更早，直播容器提供的Latch方案可以实现。


##### 包体积优化
![package size optimizing](/assets/img/package_size_optimizing.jpg "packageSizeOptimizing")

减少loadjs耗时，优化js线程准备时间。


###### 第三方依赖
>并非每个第三方依赖都是项目的“灵魂伴侣”。

Lynx项目的每个依赖都需要精打细算，引入第三方库要有性能底线：
1. 实现合理
2. 无附加依赖，比如引入A就必须引入B，这就不合理。

- Case 1
![qs reference](/assets/img/qs_reference.jpg "QsReference")

如qs某版本依赖了side-channel库，side-channel又依赖了其他库，导致loadjs阶段耗时很大。


###### 包体优化
>包体积优化主要优化loadjs耗时，对安卓中、低端有奇效。

1. 第三方依赖优化： [分析工具](https://juejin.cn/post/6844904056985485320#heading-7)
2. 源码优化：
   1. 功能重复实现
   2. 历史遗留问题，如实验、活动已结束，但代码未移除

- Case
![package size optimizing data](/assets/img/package_size_optimizing_data.jpeg "packageSizeOptimizingData")

商城1.0版本对包体积优化后，安卓中、低端机loadjs耗时减少300ms。


#### 体验优化

##### FPS（滑动帧率）优化
在滑动的过程中，如果后台有执行其他滑动无关的逻辑，可能会导致FPS下降。FPS下降比较严重时，就会出现卡顿。

- Case
超市1.0版本中，存在FPS均值较低的问题，大概40fps，通过trace分析发现，在页面滑动的过程中， 视口之外的banner仍然在自动轮播，这消耗了额外的计算资源，间接降低了页面FPS；
之后修改了banner轮播逻辑，banner离开视口后，停止自动轮播；然后FPS均值提升到了55fps。

##### 数据管理方案（redux）
业务通常会使用一些数据管理方案，比如redux，为了模块高内聚，通常会拆分reducer，随着业务的迭代会有越来越多的reducer和订阅函数，此时会面临两个问题：
1. 一次数据变更，引发其他模块重复订阅；
2. 接口数据返回时，会有多个dispatch触发各个模块重复更新；

解决方案：
1. 批量dispatch : 主接口返回后，合并多次dispatch
2. 精准订阅： 只订阅依赖模块的数据更新

- Case
![redux optimizing](/assets/img/redux_optimizing.jpg "ReduxOptimizing")

抖音超市项目进行redux优化后，渲染耗时降低70%

##### 计算结果缓存
每个项目都存在大量无副作用的纯函数，比如
getQuery: 获取url参数
getFontStyle: 获取字体大小
getABTest: 获取实验结果

这些函数调用高频，有一定的计算量，但一次会话期间基本无变更，可考虑缓存计算结果。

- Case
![cache calc result](/assets/img/cache_calc_result.jpg "CacheCalcResult")

上图为Trace中 同一函数100+次调用。

##### JSB传输耗时优化

JSB调用时存在时间消耗：
1. JSB异步方案： 需要端上支持通过参数控制JSB在非主线程异步执行
2. 耗时且不重要的JSB稍延后些执行，比如缓存数据


- Case
商城首页执行JSB统计， sendLogV3 36次，setStorage 3次，getStorage 28次。


##### 减少diff
Lynx的State变更后的diff逻辑和React不同，Lynx的状态更新diff逻辑如下：
1. 从state变更的组件开始，整个树从下做diff
2. 遇到自定义Component后，判断自定义Component的props有无变化，如果props没变化，停止diff

![dom diff @2x](/assets/img/dom_diff.jpeg "DomDiff")

root.state.a变更后，整个树会做diff，但是如果这个状态只是D组件使用的话，其实其他组件完全没必要做diff的，所以可以将D依赖的props从外部root更改为D内部自己维护（比如在D内部用redux监听相关的数据变更，然后更新自己的state）。

##### 减少re-render
###### 合并更新
开启```enableReactbatchedUpdated```使iOS上多次state更新可以合并为一次（现有的业务谨慎开启）
```javascript
pageConfig: {
    enableReactbatchedUpdated: true
}
```
在iOS上默认未开启该设备，这会带来两个问题：
1. 在一次事件循环中不会合并更新，原因如下：
   1. setState更新实现逻辑：
   ![setState function](/assets/img/setState_function.jpg)
   2. nextTick实现逻辑
   ![nextTick function](/assets/img/nextTick_function.jpeg)
2. 导致componentDidUpdate多次执行

##### 减少数据回设
数据回设可能会造成页面滑动交互的过程中出现卡顿、掉帧等问题，注意可能会造成数据回设的写法：
1. 依赖的外部变量、函数的文件命名不是lepus.j(t)s结尾的，实际上走了js线程的，在render中使用的
2. 依赖的组件内部变量、函数不是以lepus开头的，在render中使用的

可以通过trace分析找到 UpdateComponentData 中的 __tempX的变更，这种命名的变量都是会引发数据回设的，如：
![data reset](/assets/img/data_reset.jpeg)


##### 长列表数据预加载
针对list长列表无限滚动加载的场景，在用户滑动到中间为止就提前触发下一屏的接口请求，更新长列表数据，让用户在滑动期间感知不到加载卡顿的过程：
```javascript
<list
    lower-threshold-item-count={n} // n由业务自定义
    bindscrolltolower={this.loadmore}
></list>
```
注意： 预加载要明确是否对上下游产生影响
- Case
商城场景的推荐依赖消重逻辑，原有的消重是服务端将当前一刷的猜你喜欢的数据在请求的时候直接上报给推荐，推荐和服务端消重保证后续不会出现重复的内容；
在提前请求服务端接口之后，会带来的问题是：提前加载的数据可以并未曝光，但是已经被推荐认为是曝光过的，会影响推荐模型的精准度；
解决方案：商城前端和服务端针对消重策略，单独提供了消重接口，由前端通过接口将曝光的卡片数据主动上报给推荐消重数据，避免了影响推荐模型。


##### Lynx提供的最佳实践
Lynx官方提供的一些最佳实践。


#### 内存优化
针对多Tab的复杂页面，在首屏渲染时，可以只渲染当前选中的Tab，等用户触发Tab切换时，再渲染其他Tab，这样可以降低页面首屏的内存消耗。

- Case
超市1.0版本中，在用性能分析工具Diggo做测试时发现，页面内存占用过高，通过跟Lynx团队同学协作，发现页面内存大概200Mb，其中图片加载占用的内存较高；分析后发现，是因为首屏逻辑同时渲染了次日达和小时达两个Tab导致的，由于页面首屏展示的是次日达Tab，可以先不渲染小时达Tab的数据，修改之后页面内存占用下降到了80Mb，效果十分明显。


### 防劣化

#### 数据监控
数据埋点新增SCM或者Gecko版本上报，看板对比版本之间的差异。


#### 自动化性能测试
测试团队同学使用test page系统，针对指定页面录入若干测试用例，然后每次上线前自动执行测试用例，自动生成对比之前版本的性能测试报告。


