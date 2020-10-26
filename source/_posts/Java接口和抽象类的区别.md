---
title: Java接口和抽象类的区别
date: 2020-10-26 21:29:20
tags: 
- Java
- 接口
- 抽象类
categories: Java基础
---

## 接口

1）成员变量默认被修饰为：public static final；

2）方法访问级别只可以被default修饰，方法可以被static修饰。抽象方法默认会被abstract修饰；

3）不能定义构造方法；

4）不能定义初始化块和静态初始化块；

## 抽象类

1）成员变量访问级别可以被public，private修饰，可以被static修饰；

2）方法访问级别可以被public，default，private修饰，可以被static修饰。抽象方法必须被abstract修饰；

3）可以定义构造方法；

4）可以定义初始化块和静态初始化块；

## 引用

https://blog.csdn.net/zhangquan2015/article/details/82808399

https://blog.csdn.net/hanxiaoyong_/article/details/104146564