---
layout: post
title: node参数校验类params-verifier的设计与使用
date: 2018-02-03 
tags: [params, validation, params-verifier, node]
---

今天来聊下我在实际业务场景中抽出的一个node包--params-verifier，用于后端controller层的参数校验。

先来上个文档： http://npm.qima-inc.com/package/params-verifier

Github repo: https://github.com/Yann-Wang/params-verifier

接下来从四个方面来介绍下这个包：背景、使用、设计思路、完善方向。

<!-- more -->

#### 背景

所负责的一个node项目，后端代码已达到7万行，业务已越来越复杂，与此同时，产生了一个现象：service层的业务逻辑中掺杂了很多参数校验的代码（由于历史原因，controller层没有做好充分的参数校验）。

这导致了下面的结果：

 1. 业务代码不能专注于业务逻辑

 2. 经常出现因为参数错误而导致的业务逻辑错误，并且不能直观定位

 3. 对于经常出现的动辄二三十个字段的表单提交接口，手写参数校验逻辑不仅麻烦而且写的不够严谨

这种情况困扰了我很久，于是，我开始寻找有没有合适的轮子帮我解决这个问题，然后发现了下面两个node包：

 - validator : 这个包集成了很多常用的校验方法，但很多方法不一定会在参数校验场景中用得到，而且对于复合数据类型(Object)的内部字段校验也不支持，在写大表单的参数校验逻辑时，完全没有美感；
 - node-validator : 这个包对 moment 有依赖，moment本身很重，导致这个包也会很重，而且它提供的使用方式我觉得看起来没有美感，尤其是针对Object中的字段的校验，这个在controller层的参数校验中很常用。

于是，我决定自己造个轮子，提供一个有预置校验器，并且可以自定义校验器的参数校验类。

#### 使用

为了下面聊设计时不至于对这个包没有概念，我们先简单过下该包的使用姿势。

先丢一段校验object中字段的代码：

  ```javascript
    try {
        const validator = new Validator(query, 'object', { stringNotEmpty: true });
        validator
            .field('page', 'number', { required: true })
            .field('employment_type', 'number', {
                type: 'enum',
                range: [0, 4]
            })
            .field('show_confirm_entry', 'boolean')
            .field('realname', 'string', {
                validator: value => /^[\u4E00-\u9FA5]*$/.test(value),
                validatorErrMsg: '姓名必须为中文'
            })
            .field('mobile', 'string', {
                type: 'mobile',
                typeErrMsg: '手机号格式错误'
            })
            .field('join_date_end', 'string', {
                type: 'date',
                typeErrMsg: '不是有效的时间字符串'
            })
            .field('join_date', 'date')
            .field('join_date_start', 'date');

        const filteredFields = validator.filter();
        console.log(filteredFields);
    } catch (e) {
        console.log('error: ', e);
    }
  ```

##### 从使用者的角度看轮子的功能点

1. 有一些确定的业务逻辑校验规则，可以通过指定规则名称来直接使用

2. 支持自定义校验逻辑

3. 支持字段非必填，可以同时支持表单字段校验（所有字段必填）和搜索条件字段校验（所有字段非必填）这两种业务场景。

#### 设计思路

##### 数据类型
- 首先，有个约定，只支持校验四种基础数据类型(string, number, boolean, date)和一种复合数据类型（object）。

- 说到这儿， 那顺便说下为啥只支持这四种基本数据类型呢，其实主要是从mysql中支持的数据类型方面来考虑的，mysql中支持的数据类型主要包括以下四种：
 1. 整数类型
 2. 浮点数类型， 定点数类型
 3. 日期和时间类型
 4. 字符串类型

1, 2 --> number, boolean

3 --> date

4 --> string

至于复合数据类型为什么只保留了object一种，是因为在koa中，对象类型最常用，而且参数一般是包裹在一个对象中传给后端的，而array不是太常用，所以暂不支持。

由此可见，params-verifier跟koa, mysql更配哦~~

##### UML类图

甩张UML类图，其实就是五种数据类型的子类对基类的继承。

![params-verifier UML](http://okup5z621.bkt.clouddn.com/params-verifier-uml.jpeg)

##### 参数在类方法中的流动顺序

![params-verifier flow](http://okup5z621.bkt.clouddn.com/params-verifier-flow.jpeg)

- 主要包括两大块：

 1. 第一部分是校验参数校验方法的入参格式是否正确（checkOptionsParamsSupport）；
 2. 第二部分是根据五步校验规则按顺序进行校验(startValidateProcedure)；

- 每种数据类型只进行指定的部分校验步骤，如下：

  ![validation rule](http://okup5z621.bkt.clouddn.com/validation-rule.jpeg)

校验顺序由上到下执行。

#### 完善方向
1. 增加更多的常用的业务校验逻辑，方便通过名称去配置校验规则

2. 优化代码设计，打包方式，降低npm包的大小

3. 支持前端引入

4. 支持引入自定义的预置校验逻辑，并可以覆盖原有重名预置逻辑，方便通过指定预置逻辑名称来使用该逻辑进行校验

#### params-verifier特点
1. 无依赖
2. 体积小（核心代码，编译前600行， 编译后1000行）
