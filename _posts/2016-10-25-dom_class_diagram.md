---
title: DOM类的UML类图
date: 2016-10-25 20:40:55
categories:
- technology
tags:
- dom
- UML
- class diagram

---

今天聊下客户端javascript中的dom对象的原型继承关系

- Object.prototype < EventTarget.prototype < Node.prototype < Element.prototype          < HTMLElement.prototype < HTMLAnchorElement.prototype
- Object.prototype < EventTarget.prototype < Node.prototype < Attr.prototype

<!-- more -->

- Object.prototype < EventTarget.prototype < Node.prototype < CharacterData.prototype    < Text.prototype
- Object.prototype < EventTarget.prototype < Node.prototype < CharacterData.prototype    < Comment.prototype
- Object.prototype < EventTarget.prototype < Node.prototype < Document.prototype         < HTMLDocument.prototype
- Object.prototype < EventTarget.prototype < Node.prototype < DocumentType.prototype
- Object.prototype < EventTarget.prototype < Node.prototype < DocumentFragment.prototype
- Object.prototype < NodeList.prototype
- Object.prototype < HTMLCollection.prototype


代码验证


![html dom class diagram](http://okup5z621.bkt.clouddn.com/html_dom_class_diagram.png "html dom class diagram")

1. EventTarget, Node, Element, HTMLElement, CharacterData, Document, HTMLDocument 都是抽象类
2. HTMLElement, CharacterData, Attr, Document, DocumentType, DocumentFragment 直接实现了Node类
3. Text, Comment 实现了CharacterData抽象类
4. HTMLElement实现了抽象类Element
5. HTMLStyleElement, HTMLLinkElement, HTMLScriptElement, HTMLImageElement, HTMLIframeElement, HTMLFormElement, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement 实现了抽象类HTMLElement


![css dom class diagram](http://okup5z621.bkt.clouddn.com/css_dom_class_diagram.png "css dom class diagram")

- 在CSS中，一个样式表可以包含多个样式规则，一个样式规则可以包含多个样式声明
- CSSStyleDeclaration是一个声明对象
- CSSRule是一个css规则对象
- CSSStyleSheet是一个样式表对象
- 一个css规则对象包含多个声明对象
- 一个样式表对象包含多个css规则对象
- document.styleSheets包含多个样式表
