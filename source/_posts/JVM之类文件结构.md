---
title: JVM之类文件结构
date: 2020-08-17 21:14:04
tags: 
- JVM
- 类文件结构
categories: JVM相关
---

Class文件是一组以8位字节为基础的二进制流，各个数据项目严格按照顺序紧凑地排列在Class文件之中，中间没有添加任何分隔符。当遇到需要占用8位字节以上空间的数据项目时，则按照**高位在前（Big-Endian）**的方式分割成若干个8位字节进行存储。

Class文件格式只有2种数据类型：1）无符号数；2）表。

1）**无符号数**属于基本的数据类型，以u1，u2，u4，u8类分别代表1个字节，2个字节，4个字节，8个字节的无符号数。无符号数可以用来描述数字，索引引用，数量值，无符号数也可以按照UTF-8编码构成字符串值。

2）**表**是由多个无符号数或者其他表作为数据项构成的复合数据类型，所有表都习惯性地以**“_info”**结尾。

下图是Class文件格式

<p><img src="/assets/blogImg/JVM之类文件结构_01.png" width="400"></p>

### 魔数

Classs文件地头4个字节称为**魔数**，它都唯一作用是确定这个文件是否为一个能被虚拟机接受的Class文件。魔数的值为：0xCAFEBABE

### Class文件的版本

第5和第6个字节是**次版本号（Minor Version）**，第7和第8个字节是**主版本号（Major Version）**。

JDK的主版本号是从45开始的，例如，JDK1.1对应的值是45，JDK1.2对应的值是46，以此类推，JDK1.7对应的值是51。

### 常量池

紧接主版本号之后的是**常量池**，常量池是一个**表**数据类型，常量池中的**常量**的数量不固定，所以在常量池的入口放置一项u2类型的数据，代表**常量池容量计数值（constant_pool_count）**。这个容量计数是从1开始的，而不是从0。

例如下图所示，第9和第10个字节，值为0x0016，即十进制数22，代表常量池有21项常量，索引范围为1~21。

<p><img src="/assets/blogImg/JVM之类文件结构_02.png" width="600"></p>

粗略地划分，常量池中主要分2大类常量：1）字面量（Literal）；2）符号引用（Symbolic References）。

1）**字面量**比较接近于Java语言层面的**常量**概念，例如：文本字符串，声明为final的常量值；

2）**符号引用**则属于编译原理方面的概念，包含3类 ：

a）类和接口的全限定名；

b）字段的名称和描述符（描述符，例如：public，static，final）；

c）方法的名称和描述符（描述符，例如：public，static，final）；

仔细地划分，常量池中每一项常量都是一个**表**，截至JDK1.13，常量池总共有17种**表**，如下图所示：

<p>
<img src="/assets/blogImg/JVM之类文件结构_03.png" width="600" style="display: block;">
<img src="/assets/blogImg/JVM之类文件结构_04.png" width="600" style="display: block;">
<img src="/assets/blogImg/JVM之类文件结构_05.png" width="600" style="display: block;">
</p>

接下来举个例子来说明常量池怎么存储数据，如下图所示

<p><img src="/assets/blogImg/JVM之类文件结构_02.png" width="600"></p>

第11个字节的值为0x07，代表常量池第一项常量的类型标志，查表可知，这个常量类型是CONSTANT_Class_info，CONSTANT_Class_info类型常量的结构如下图所示

<p><img src="/assets/blogImg/JVM之类文件结构_06.png" width="600"></p>

由上图可以知道，第12和第13个字节的值为0x0002，也就是指向了常量池第二项常量。

第14个字节的值为0x01，代表常量池第二项常量的类型标志，查表可知，这个常量类型是CONSTANT_Utf8_info，CONSTANT_Utf8_info类型常量的结构如下图所示

<p><img src="/assets/blogImg/JVM之类文件结构_07.png" width="600"></p>

由上图可以知道，第15和第16个字节的值为0x001D，即十进制29，所以往后29个字节都是第二项常量的内容，翻译成ASCII码，值为：org/fenixsoft/clazz/TestClass。

剩下常量池常量以此类推。