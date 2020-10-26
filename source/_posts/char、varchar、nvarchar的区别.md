---
title: char、varchar、nvarchar的区别
date: 2020-10-26 22:44:47
tags: 
- char
- varchar
- nvarchar
categories: 数据库相关
---

| String类型 | 长度 | 存取速度 | 存储                 | 空间利用率 | Unicode |
| ---------- | ---- | -------- | -------------------- | ---------- | ------- |
| char       | 定长 | 快       | 英：1字节；汉：2字节 | 低         | 非      |
| varchar    | 变长 | 慢       | 英：1字节；汉：2字节 | 高         | 非      |
| nchar      | 定长 | 快       | 英：2字节；汉：2字节 | 低         | 是      |
| nvarchar   | 变长 | 慢       | 英：2字节；汉：2字节 | 高         | 是      |

### 1.如果定义一个char(10)和一个varchar(10)，存进去的是csdn

char 的长度是不可变的，那么 char 所占的长度依然为10，除了字符 ‘csdn’ 外，后面跟六个空格；

varchar 的长度是可变的，那么 varchar 所占的长度为4。

### 2.有var前缀的，表示是实际存储空间是变长的，varchar，nvarchar

定长就是长度固定的，当输入的数据长度没有达到指定的长度时将自动以英文空格在其后面填充，使长度达到相应的长度；

变长字符数据则不会以空格填充，比较例外的是，text存储的也是可变长。

### 3.有n前缀表示 Unicode 字符，即所有字符都占两个字节，nchar，nvarchar

## 引用

https://blog.csdn.net/luckystar_99/article/details/79604251