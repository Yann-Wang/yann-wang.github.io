---
layout: post
title: 编译技术在前端中的应用--以Babel为例谈谈转译器的实现原理及应用
date: 2021-08-15
tags: [babel, compile, compilation, technique of compiling]
---

编译技术从使用场景来说，可以分为三类：转译器、解释器、编译器；而Babel则属于转译器这一类。

<!-- more -->

<p class="category">目录</p>

- [前端中的编译技术](#前端中的编译技术)
- [Babel实现原理](#babel实现原理)
  - [Babel转译器的三个阶段](#babel转译器的三个阶段)
  - [Babel中的Parser](#babel中的parser)
    - [追溯@babel/parser的早期版本](#追溯babelparser的早期版本)
    - [Babel中Parser的内部结构](#babel中parser的内部结构)
    - [词法分析](#词法分析)
      - [token分类](#token分类)
      - [token列表](#token列表)
      - [举例](#举例)
      - [提取token的实现逻辑](#提取token的实现逻辑)
    - [语法分析](#语法分析)
      - [语法分层结构](#语法分层结构)
      - [举例](#举例-1)
  - [Babel中的Transform](#babel中的transform)
    - [遍历AST](#遍历ast)
    - [visitor函数](#visitor函数)
    - [三条链](#三条链)
  - [Babel中的Generate](#babel中的generate)
- [Babel的应用](#babel的应用)
  - [自动生成API文档](#自动生成api文档)
  - [混淆 \&\& 压缩](#混淆--压缩)
  - [实现一个JS解释器](#实现一个js解释器)


### 前端中的编译技术

下面介绍了使用了编译技术的相关工具及其应用场景。

| 翻译器分类 | 定义                                                                                                            | 相关工具                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 转译器     | 转译器是一个程序，他将一种高级语言（源代码）转换成另一种高级语言。大多数情况下，将源代码一次性翻译完成。        | 比如babel(代码转化), tsc(代码转化), postcss(代码转化), teser(压缩), eslint(静态检查), stylelint(静态检查)                                                                                                                                                                                                                                                   |
| 解释器     | 解释器是一个程序，它将高级语言（源代码）转换成机器代码，然后立即运行/执行该代码。它一次只翻译源代码中的一部分。 | 比如[V8中的Ignition解释器](https://zhuanlan.zhihu.com/p/601871778#h_601871778_7)（解释执行字节码）、[JSCore中的LLInt解释器](https://webkit.org/blog/9329/a-new-bytecode-format-for-javascriptcore/)（解释执行字节码）、[hermes中的解释器](https://www.infoq.cn/article/8JEVNZvTrj_e1oJwo5vL?utm_source=related_read&utm_medium=article)（解释执行字节码）等 |
| 编译器     | 编译器是一个程序，它将高级语言（源代码）转换成机器代码 。大多数情况下，将源代码一次性翻译成机器代码。           | 比如[V8中的JIT编译器TurboFan](https://zhuanlan.zhihu.com/p/601871778#h_601871778_7)（编译字节码到机器码）、[JSCore中的JIT编译器(Baseline JIT, DFG JIT, FTL JIT)](https://juejin.cn/post/6890187786045882375)（编译字节码到机器码）                                                                                                                          |


>解释器和编译器都有自己擅长的场景，在JavaScript和Java这两种语言的虚拟机中，都同时用到了解释器和编译器（JIT）。

从上面可以看出，编译技术在前端领域确实使用广泛，而且每一个应用方向都很复杂。本文不会对前端领域的编译技术做大而全的介绍，仅以Babel为例谈谈转译器的实现原理及应用。

### Babel实现原理


#### Babel转译器的三个阶段

Babel转译器分为三个阶段：parse, transform, generate

![Babel three phase @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/babel-three-phase-min.jpg)

通过parser阶段，生成该语言的AST（抽象语法树）；然后通过transform阶段，转化为另一种语言/语法的AST；最后通过generate阶段，将上阶段得到的AST生成为对应语言/语法的源代码。


#### Babel中的Parser


##### 追溯@babel/parser的早期版本

由于当前版本的@babel/parser已经变得非常复杂，为了降低研究难度，我们找下其早期版本。

>Credits
Heavily based on acorn and acorn-jsx, thanks to the awesome work of @RReverser and @marijnh.

上⾯的引⾔来⾃@babel/parser官⽹，说明@babel/parser是基于acorn来做了扩展。

![Babel history @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/acorn-min.jpg)


acorn 0.2.0版本源代码：[这里](https://github.com/acornjs/acorn/blob/0.2.0/acorn.js)



##### Babel中Parser的内部结构

![Babel parser @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/babel-parser-min.jpeg)

Parser中主要分为词法分析和语法分析两部分，词法分析负责标记token，语法分析负责根据token列表生成有语义的语句。


##### 词法分析

###### token分类

![token types @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/token-types-min.jpg)

token主要分为6大类： 名字（包括变量名、关键词）， 操作符， 标点符号，数字（包括十进制和十六进制），字符串，正则。


###### token列表

下面是每一类token所包括的具体字符或标识规则。

![token list @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/token-list-min.jpg)



###### 举例

![show case @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/lexical-show-case-min.jpg)

上面是解析一行变量声明语句时，每个token对应的类型。


###### 提取token的实现逻辑

提取token的实现逻辑比较复杂，不同的token提取逻辑也不一样，下面仅介绍两个场景：


1. 判断当前字符是否是符合标识符起始字符的条件

```javascript
// Test whether a given character code starts an identifier. 2
var isIdentifierStart = exports.isIdentifierStart = function(code) {
    if (code < 65) return code === 36;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
};

```


2. 识别string类型

```javascript
function readString(quote) {
  tokPos++;
  var out = "";
  for (;;) {
    if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
    var ch = input.charCodeAt(tokPos);
    if (ch === quote) {
      ++tokPos;
      return finishToken(_string, out);
    }
    if (ch === 92) { // '\'
      ch = input.charCodeAt(++tokPos);
      var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
      if (octal) octal = octal[0];
      while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, octal.length - 1);
      if (octal === "0") octal = null;
      ++tokPos;
      if (octal) {
        if (strict) raise(tokPos - 2, "Octal literal in strict mode");
        out += String.fromCharCode(parseInt(octal, 8));
        tokPos += octal.length - 1;
      } else {
        switch (ch) {
        case 110: out += "\n"; break; // 'n' -> '\n'
        case 114: out += "\r"; break; // 'r' -> '\r'
        case 120: out += String.fromCharCode(readHexChar(2)); break; // 'x'
        case 117: out += String.fromCharCode(readHexChar(4)); break; // 'u'
        case 85: out += String.fromCharCode(readHexChar(8)); break; // 'U'
        case 116: out += "\t"; break; // 't' -> '\t'
        case 98: out += "\b"; break; // 'b' -> '\b'
        case 118: out += "\u000b"; break; // 'v' -> '\u000b'
        case 102: out += "\f"; break; // 'f' -> '\f'
        case 48: out += "\0"; break; // 0 -> '\0'
        case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
        case 10: // ' \n'
          if (options.locations) { tokLineStart = tokPos; ++tokCurLine; }
          break;
        default: out += String.fromCharCode(ch); break;
        }
      }
    } else {
      if (ch === 13 || ch === 10 || ch === 8232 || ch === 8329) raise(tokStart, "Unterminated string constant");
      out += String.fromCharCode(ch); // '\'
      ++tokPos;
    }
  }
}

```



##### 语法分析

###### 语法分层结构

![grammar structure @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/grammar-structure-min.jpg)

语法分为四个层级，由下到上，下面的语句构成上面的语句。

###### 举例

以下是```var a = 1+ 2*3;```这个语句的AST JSON数据结构

```json
{
  "type": "Program",
  "start": 0,
  "end": 15,
  "body": [
    {
      "type": "VariableDeclaration",
      "start": 0,
      "end": 15,
      "declarations": [
        {
          "type": "VariableDeclarator",
          "start": 4,
          "end": 14,
          "id": {
            "type": "Identifier",
            "start": 4,
            "end": 5,
            "name": "a"
          },
          "init": {
            "type": "BinaryExpression",
            "start": 8,
            "end": 14,
            "left": {
              "type": "Literal",
              "start": 8,
              "end": 9,
              "value": 1,
              "raw": "1"
            },
            "operator": "+",
            "right": {
              "type": "BinaryExpression",
              "start": 11,
              "end": 14,
              "left": {
                "type": "Literal",
                "start": 11,
                "end": 12,
                "value": 2,
                "raw": "2"
              },
              "operator": "*",
              "right": {
                "type": "Literal",
                "start": 13,
                "end": 14,
                "value": 3,
                "raw": "3"
              }
            }
          }
        }
      ],
      "kind": "var"
    }
  ],
  "sourceType": "module"
}


```



#### Babel中的Transform


##### 遍历AST

transform阶段有一个深度优先遍历AST节点的过程，具体逻辑如下。

[babel v5.0.0 /src/babel/traversal/index.js](https://github.com/babel/babel/blob/v5.0.0/src/babel/traversal/index.js)

##### visitor函数

深度遍历AST节点，不同的AST会调⽤不同的visitor函数来实现transform。

visitor函数的两个参数的数据结构如下：

![transform visitor](https://cdn.phoenician.cn/technique-of-compiling-in-babel/transform-visitor-min.jpg)



##### 三条链

![three chain @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/three-chain-min.jpg)

path 是记录AST遍历路径的一条链;
path.scope 是记录作用域的一条链；
path.scope.block 是记录形成作用域的节点的一条链

#### Babel中的Generate

generate 是把 AST 打印成字符串，是一个从根节点递归打印的过程，对不同的 AST 节点做不同的处理，在这个过程中把抽象语法树中省略掉的一些分隔符重新加回来。

比如 while 语句 WhileStatement 就是先打印 while，然后打印一个空格和 '('，然后打印 node.test 属性的节点，然后打印 ')'，之后打印 block 部分

```javascript
export function WhileStatement(node, print) {
  this.keyword("while");
  this.push("(");
  print(node.test);
  this.push(")");
  print.block(node.body);
}

```

详见 [babel v5.0.0 /src/babel/generation/generators/statements.js ](https://github.com/babel/babel/blob/v5.0.0/src/babel/generation/generators/statements.js)


### Babel的应用

#### 自动生成API文档

![generate api documdent @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/generate_api_document-min.jpg)

如图为根据api定义代码，自动生成api文档。

详细实现代码 [这里](https://github.com/QuarkGluonPlasma/babel-plugin-exercize/tree/master/exercize-auto-document)

#### 混淆 && 压缩

![mangle and compress @2x](https://cdn.phoenician.cn/technique-of-compiling-in-babel/compress-and-mangle-min.jpg)

- 压缩：替换变量名
- 混淆：改变代码结构：去掉未用到的num3声明语句，去掉num4变量


上图中左侧的源代码，在经过、混淆后，生成右侧代码。

详细实现代码 [这里](https://github.com/QuarkGluonPlasma/babel-plugin-exercize/tree/master/exercize-mangle-compress)


#### 实现一个JS解释器

- 举例: 实现一个可以解释执行下面JavaScript代码的解释器。

```javascript
const a = 1 + 2;
console.log(a);

```

大致实现逻辑：
1. 初始化一个作用域
2. 在作用域挂在全局变量console，并初始化console
3. 定义各AST节点的执行逻辑
4. 从入口Program节点开始，深度遍历执行各AST节点的逻辑

详细实现代码 [这里](https://github.com/QuarkGluonPlasma/babel-plugin-exercize/tree/master/exercize-js-interpreter)


<div class="references">References</div>

[1] [Why - 为什么说 JavaScript 更像一门编译型语言](https://zhuanlan.zhihu.com/p/601871778)

[2] [编译器 VS 解释器](https://www.eustb.com/post/2020/05/07/compiler-vs-interpreter/)

[3] [对比JIT和AOT，各自有什么优点与缺点?](https://www.zhihu.com/question/23874627)

[4] [浏览器是如何工作的：Chrome V8 让你更懂 JavaScript](https://ssshooter.com/2021-07-19-google-v8/)

[5] [深入理解JSCore](https://tech.meituan.com/2018/08/23/deep-understanding-of-jscore.html)

[6] [Hermes: An open source JavaScript engine optimized for mobile apps, starting with React Native](https://engineering.fb.com/2019/07/12/android/hermes/)

[7] [初识 JavaScriptCore JIT](https://juejin.cn/post/6890187786045882375)

[8] [Acorn: A tiny, fast JavaScript parser, written completely in JavaScript.](https://github.com/acornjs/acorn)

[9] [Babel 插件通关秘籍](https://juejin.cn/book/6946117847848321055)

[10] [the super tiny compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)

[11] [@babel/parser](https://babeljs.io/docs/en/babel-parser)

[12] [Let's build a browser engine!](https://limpet.net/mbrubeck/2014/08/08/toy-layout-engine-1.html)

[13] [抽象语法树在 JavaScript 中的应用](https://tech.meituan.com/2014/10/08/the-practice-of-abstract-syntax-trees-in-javascript.html)

[14] [ECMAScript](https://esprima.org/)

[15] [@lazer/JavaScript: A JavaScript lezer grammar](https://github.com/lezer-parser/javascript)
