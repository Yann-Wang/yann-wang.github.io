---
title: v8在解析function声明和function调用时做了什么
date: 2016-08-03 23:59:40
categories:
- technology
tags:
- execution environment
- function declaration
- function call
- v8
---

- 本文来自w3c官方网站对　ES5标准文档[［可执行代码与执行环境］](https://www.w3.org/html/ig/zh/wiki/ES5/execution)　一文的部分引用

<!-- more -->

### v8解析［function调用］时做了什么

- 进入函数代码

    当控制流根据一个函数对象 F、调用者提供的 thisArg 以及调用者提供的 argumentList，进入函数代码的执行环境时，执行以下步骤：
  
    1. 如果函数代码是严格模式下的代码，设 this 绑定 为 thisArg。
    2. 否则如果 thisArg 是 null 或 undefined，则设 this 绑定 为全局对象。  
    3. 否则如果 Type(thisArg) 的结果不为 Object，则设 this 绑定 为 ToObject(thisArg)。  
    4. 否则设 this 绑定 为 thisArg。  
    5. 以 F 的 [[Scope]] 内部属性为参数调用 NewDeclarativeEnvironment(见下边)，并令 localEnv 为调用的结果。  
    6. 设 词法环境组件 为 localEnv。  
    7. 设 变量环境组件 为 localEnv。  
    8. 令 code 为 F 的 [[Code]] 内部属性的值。  
    9. 按 10.5 描述的方案，使用函数代码 code 和 argumentList 执行声明式绑定初始化化步骤。
    
- NewDeclarativeEnvironment(E)

    当调用 NewDeclarativeEnvironment 抽象运算时，需指定一个词法环境 E，其值可以为 null，此时按以下步骤进行：

    1. 令 env 为一个新建的词法环境。    
    2. 令 envRec 为一个新建的声明式环境数据，该环境数据不包含任何绑定。    
    3. 令 env 的环境数据为 envRec。    
    4. 令 env 的外部词法环境引用至 E。    
    5. 返回 env。

- 声明式绑定初始化

    每个执行环境都有一个关联的 变量环境组件。当在一个执行环境下评估一段 ECMA 脚本时，变量和函数定义会以绑定的形式添加到这个变量环境组件 的环境记录中。对于函数代码，参数也同样会以绑定的形式添加到这个 变量环境组件 的环境记录中。
    
    选择使用哪一个、哪一类型的环境记录来绑定定义，是由执行环境下执行的 ECMA 脚本的类型决定的，而其它部分的逻辑是相同的。当进入一个执行环境时，会按以下步骤在 变量环境组件 上创建绑定，其中使用到调用者提供的代码设为 code，如果执行的是函数代码，则设参数列表为 args：

    1. 令 env 为当前运行的执行环境的变量环境组件的环境记录项。    
    2. 如果 code 是 eval 代码，则令 configurableBindings 为 true，否则令 configurableBindings 为 false。    
    3. 如果代码是严格模式下的代码，则令 strict 为 true，否则令 strict 为 false。    
    4. 如果代码为函数代码，则：
    
        1. 令 func 为通过 [[Call]] 内部属性初始化 code 的执行的函数对象。令 names 为 func 的 [[FormalParameters]] 内部属性的值。    
        2. 令 argCount 为 args 中元素的数量。    
        3. 令 n 为数值 0。    
        4. 按列表顺序遍历 names，对于每一个字符串 argName：
    
            1. 令 n 的值为 n 当前值加 1。    
            2. 如果 n 大于 argCount，则令 v 为 undefined，否则令 v 为 args 中的第 n 个元素。    
            3. 以 argName 为参数，调用 env 的 HasBinding 具体方法，并令 argAlreadyDeclared 为调用的结果。    
            4. 如果 argAlreadyDeclared 的值为 false，以 argName 为参数调用 env 的 CreateMutableBinding 具体方法。    
            5. 以 argName、v 和 strict 为参数，调用 env 的 SetMutableBinding 具体方法。
    
    5. 按源码顺序遍历 code，对于每一个 FunctionDeclaration f：
    
        1. 令 fn 为 FunctionDeclaration f 中的 Identifier。    
        2. 按第 13 章中所述的步骤初始化 FunctionDeclaration f ，并令 fo 为初始化的结果。    
        3. 以 fn 为参数，调用 env 的 HasBinding 具体方法，并令 argAlreadyDeclared 为调用的结果。    
        4. 如果 argAlreadyDeclared 的值为 false，以 fn 和 configurableBindings 为参数调用 env 的 CreateMutableBinding 具体方法。    
        5. 否则如果 env 是全局环境的环境记录对象，则：
    
            1. 令 go 为全局对象。    
            2. 以 fn 为参数，调用 go 和 [[GetProperty]] 内部方法，并令 existingProp 为调用的结果。    
            3. 如果 existingProp.[[Configurable]] 的值为 true，则：    
                1. 以 fn、由 {[[Value]]: undefined, [[Writable]]: true, [[Enumerable]]: true, [[Configurable]]: configurableBindings } 组成的属性描述符和 true 为参数，调用 go 的 [[DefineOwnProperty]] 内部方法。
    
            4. 否则如果 IsAccessorDescriptor(existingProp) 的结果为真，或 existingProp 的特性中没有 {[[Writable]]: true, [[Enumerable]]: true}，则：    
                1. 抛出一个 TypeError 异常。
    
        6. 以 fn、fo 和 strict 为参数，调用 env 的 SetMutableBinding 具体方法。
    
    6. 以 "arguments" 为参数，调用 env 的 HasBinding 具体方法，并令 argumentsAlreadyDeclared 为调用的结果。    
    7. 如果 code 是函数代码，并且 argumentsAlreadyDeclared 为 false，则：    
        1. 以 fn、names、args、env 和 strict 为参数，调用 CreateArgumentsObject 抽象运算函数，并令 argsObj 为调用的结果。    
        2. 如果 strict 为 true，则：    
            1. 以字符串"arguments"为参数，调用 env 的 CreateImmutableBinding 具体方法。    
            2. 以字符串 "arguments" 和 argsObj 为参数，调用 env 的 InitializeImmutableBinding 具体函数。    
        3. 否则：    
            1. 以字符串 "arguments"为参数，调用 env 的 CreateMutableBinding 具体方法。    
            2. 以字符串"arguments"、argsObj 和 false 为参数，调用 env 的 SetMutableBinding 具体函数。    
    8. 按源码顺序遍历 code，对于每一个 VariableDeclaration 和 VariableDeclarationNoIn 表达式作为 d 执行：    
        1. 令 dn 为 d 中的标识符。    
        2. 以 dn 为参数，调用 env 的 HasBinding 具体方法，并令 varAlreadyDeclared 为调用的结果。    
        3. 如果 varAlreadyDeclared 为 false，则：    
            1. 以 dn 和 configurableBindings 为参数，调用 env 的 CreateMutableBinding 具体方法。    
            2. 以 dn、undefined 和 strict 为参数，调用 env 的 SetMutableBinding 具体方法。


### v8解析［function定义］时做了什么

#### 按源码顺序遍历 code，对于每一个 FunctionDeclaration f：
    
1. 令 fn 为 FunctionDeclaration f 中的 Identifier。        
2. 按第 13 章中所述的步骤初始化 FunctionDeclaration f ，并令 fo 为初始化的结果。
3. 以 fn 为参数，调用 env 的 HasBinding 具体方法，并令 argAlreadyDeclared 为调用的结果。
4. 如果 argAlreadyDeclared 的值为 false，以 fn 和 configurableBindings 为参数调用 env 的 CreateMutableBinding 具体方法。
5. 否则如果 env 是全局环境的环境记录对象，则：

    1. 令 go 为全局对象。
    2. 以 fn 为参数，调用 go 和 [[GetProperty]] 内部方法，并令 existingProp 为调用的结果。
    3. 如果 existingProp.[[Configurable]] 的值为 true，则：
        
        1. 以 fn、由 {[[Value]]: undefined, [[Writable]]: true, [[Enumerable]]: true, [[Configurable]]: configurableBindings } 组成的属性描述符和 true 为参数，调用 go 的 [[DefineOwnProperty]] 内部方法。

    4. 否则如果 IsAccessorDescriptor(existingProp) 的结果为真，或 existingProp 的特性中没有 {[[Writable]]: true, [[Enumerable]]: true}，则：

        1. 抛出一个 TypeError 异常。

6. 以 fn、fo 和 strict 为参数，调用 env 的 SetMutableBinding 具体方法。

#### 初始化 FunctionDeclaration f :
    
产生式 FunctionDeclaration : function Identifier ( FormalParameterListopt ) { FunctionBody } 依照定义绑定初始化 (10.5) 如下初始化：

1. 依照 13.2，指定 FormalParameterListopt 为参数列表，指定 FunctionBody 为 函数体，创建一个新函数对象(见 3>)，返回结果。运行中的执行环境的 VariableEnvironment 传递为 Scope。如果 FunctionDeclaration 包含在严格模式代码里或 FunctionBody 是严格模式代码，那么传递 true 为 Strict 标志。

产生式 FunctionExpression : function ( FormalParameterListopt ) { FunctionBody } 的解释执行如下：

2. 依照 13.2，指定 FormalParameterListopt 为参数列表，指定 FunctionBody 为 函数体，创建一个新函数对象，返回结果。运行中的执行环境的 LexicalEnvironment 传递为Scope。如果 FunctionExpression 包含在严格模式代码里或 FunctionBody 是严格模式代码，那么传递 true 为 Strict 标志。

产生式 FunctionExpression : function Identifier ( FormalParameterListopt ) { FunctionBody } 的解释执行如下：

1. 令 funcEnv 为以运行中执行环境的 LexicalEnvironment 为参数调用 NewDeclarativeEnvironment 的结果。    
2. 令 envRec 为 funcEnv 的环境记录项。    
3. 以 Identifier 的字符串值为参数调用 envRec 的具体方法 CreateImmutableBinding(N)。    
4. 令 closure 为依照 13.2，指定 FormalParameterListopt 为参数，指定 FunctionBody 为 函数体，创建一个新函数对象的结果。传递 funcEnv 为 Scope。如果FunctionExpression 包含在严格模式代码里或 FunctionBody 是严格模式代码，那么传递 true 为 Strict 标志。    
5. 以 Identifier 的字符串值和 closure 为参数调用 envRec 的具体方法 InitializeImmutableBinding(N,V)。    
6. 返回 closure。

注： 可以从 FunctionExpression 的 FunctionBody 里面引用 FunctionExpression 的 Identifier，以允许函数递归调用自身。然而不像FunctionDeclaration，FunctionExpression 的 Identifier 不能被范围封闭的 FunctionExpression 引用，也不会影响它。

#### 创建一个新函数对象:
    
指定 FormalParameterList 为可选的 参数列表，指定 FunctionBody 为 函数体，指定 Scope 为词法环境，Strict 为布尔标记，按照如下步骤构建函数对象：

1. 创建一个新的 ECMAScript 原生对象，令 F 为此对。
2. 依照 8.12 描述设定 F 的除 [[Get]] 以外的所有内部方法。
3. 设定 F 的 [[Class]] 内部属性为 "Function"。
4. 设定 F 的 [[Prototype]] 内部属性为 15.3.3.1 指定的标准内置 Function 对象的 prototype 属性。
5. 依照 15.3.5.4 描述，设定 F 的 [[Get]] 内部属性。
6. 依照 13.2.1 描述，设定 F 的 [[Call]] 内部属性。
7. 依照 13.2.2 描述，设定 F 的 [[Construct]] 内部属性。
8. 依照 15.3.5.3 描述，设定 F 的 [[HasInstance]] 内部属性。
9. 设定 F 的 [[Scope]] 内部属性为 Scope 的值。
10. 令 names 为一个列表容器，其中元素是以从左到右的文本顺序对应 FormalParameterList 的标识符的字符串。
11. 设定 F 的 [[FormalParameters]] 内部属性为 names。
12. 设定 F 的 [[Code]] 内部属性为 FunctionBody。
13. 设定 F 的 [[Extensible]] 内部属性为 true。
14. 令 len 为 FormalParameterList 指定的形式参数的个数。如果没有指定参数，则令 len 为 0。
15. 以参数 "length"、属性描述符 {[[Value]]: len, [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: false}、false 调用 F 的 [[DefineOwnProperty]] 内部方法。
16. 令 proto 为仿佛使用 new Object() 表达式创建新对象的结果，其中 Object 是标准内置构造器名。
17. 以参数 "constructor"、属性描述符 {[[Value]]: F, { [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: true}、false 调用 proto 的 [[DefineOwnProperty]] 内部方法。
18. 以参数 "prototype"、属性描述符 {[[Value]]: proto, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: false}、false 调用 F 的 [[DefineOwnProperty]] 内部方法。
19. 如果 Strict 是 true，则

    1. 令 thrower 为 [[ThrowTypeError]] 函数对象（13.2.3）。
    2. 以参数 "caller"、属性描述符 {[[Get]]: thrower, [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false}、false 调用 F 的 [[DefineOwnProperty]] 内部方法。
    3. 以参数 "arguments"、属性描述符 {[[Get]]: thrower, [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false}、false 调用 F 的 [[DefineOwnProperty]] 内部方法。

20. 返回 F。

注：每个函数都会自动创建一个 prototype 属性，以满足函数会被当作构造器的可能性。

#### [[Call]]

当用一个 this 值、一个参数列表调用函数对象 F 的 [[Call]] 内部方法，采用以下步骤：

1. 用 F 的 [[FormalParameters]] 内部属性值、参数列表 args、10.4.3 描述的 this 值来建立函数代码的一个新执行环境，令 funcCtx 为其结果。
2. 令 result 为 FunctionBody（也就是 F 的 [[Code]] 内部属性）解释执行的结果。如果 F 没有 [[Code]] 内部属性或其值是空的 FunctionBody，则 result 是 (normal,undefined, empty)。
3. 退出 funcCtx 运行环境，恢复到之前的执行运行环境。
4. 如果 result.type 是 throw 则抛出 result.value。
5. 如果 result.type 是 return 则返回 result.value。
6. 否则 result.type 必定是 normal。返回 undefined。

#### [[Construct]]

当以一个可能的空的参数列表调用函数对象 F 的 [[Construct]] 内部方法，采用以下步骤：

1. 令 obj 为新创建的 ECMAScript 原生对象。
2. 依照 8.12 设定 obj 的所有内部方法。
3. 设定 obj 的 [[Class]] 内部属性为 "Object"。
4. 设定 obj 的 [[Extensible]] 内部属性为 true。
5. 令 proto 为以参数 "prototype" 调用 F 的 [[Get]] 内部属性的值。
6. 如果 Type(proto) 是 Object，设定 obj 的 [[Prototype]] 内部属性为 proto。
7. 如果 Type(proto) 不是 Object，设定 obj 的 [[Prototype]] 内部属性为 15.2.4 描述的标准内置的 Object 原型对象。
8. 以 obj 为 this 值，调用 [[Construct]] 的参数列表为 args，调用 F 的 [[Call]] 内部属性，令 result 为调用结果。
9. 如果 Type(result) 是 Object，则返回 result。
10. 返回 obj。

#### [[ThrowTypeError]] 函数对象

[[ThrowTypeError]] 对象是个唯一的函数对象，如下只定义一次：

1. 创建一个新 ECMAScript 原生对象，令 F 为此对象。
2. 依照 8.12 设定 F 的所有内部属性。
3. 设定 F 的 [[Class]] 内部属性为 "Function"。
4. 设定 F 的 [[Prototype]] 内部属性为 15.3.3.1 指定的标准内置 Function 的原型对象。
5. 依照 13.2.1 描述设定 F 的 [[Call]] 内部属性。
6. 设定 F 的 [[Scope]] 内部属性为全局环境。
7. 设定 F 的 [[FormalParameters]] 内部属性为一个空列表。
8. 设定 F 的 [[Code]] 内部属性为一个 FunctionBody，它无条件抛出一个 TypeError 异常，不做其他事情。
9. 以参数 "length"、属性描述符 {[[Value]]: 0, [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: false}、false 调用 F 的 [[DefineOwnProperty]] 内部方法。
10. 设定 F 的 [[Extensible]] 内部属性为 false。
11. 令 [[ThrowTypeError]] 为 F。
