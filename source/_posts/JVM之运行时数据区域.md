---
title: JVM之运行时数据区域
date: 2020-08-02 23:17:57
tags: 
- 虚拟机
- 运行时数据区域
- JVM
categories: JVM相关
---

JVM的组成结构，如下图所示

<p><img src="/assets/blogImg/JVM之运行时数据区域_01.png" width="800"></p>

类加载子系统：负责从文件系统或是网络中加载class信息，加载的信息存放在**方法区**；

执行引擎：JVM非常核心的组件，它负责执行JVM的字节码，一般先会编译成机器码后执行;

运行时数据区域包括几个部分，下面详细介绍

## 1.运行时数据区域（Runtime Data Area）

Java虚拟机所管理的内存包括以下几个运行时数据区域（Runtime Data Area）：

1）程序技术器（Program Counter Register）

2）Java虚拟机栈（Java Virtual Machine Stack）

3）本地方法栈（Native Method Stack）

4）Java堆（Java Heap）

5）方法区（Method Area）

6）运行时常量池（Runtime Constant Pool）

7）直接内存（Direct Memory）

其中，**运行时常量池**是**方法区**的一部分；**直接内存**严格来讲不算**运行时数据区**。

下面，我们分别介绍各个运行时数据区

### 1.1.程序计数器寄存器（Program Counter Register）

1）线程私有；

2）程序计数器寄存器，可以看作是**当前线程**所执行的字节码的行号指示器；

3）如果线程正在执行的是一个Java方法，这个计数器记录的是正在执行的虚拟机字节码指令的地址；如果正在执行的是Native方法，这个计数器值则为空（undefined）；

4）唯一一个在Java虚拟机规范中没有规定任何OutOfMemoryError情况的区域。

### 1.2.Java虚拟机栈（Java Virtual Machine Stack）

1）线程私有；

2）Java虚拟机栈，描述的是Java方法执行的内存模型，每个Java方法在执行的同时都会创建一个**栈帧（Stack Frame）**，用于存放局部变量表，操作数栈，动态链接，方法出口，等信息；

3）我们常说的Java堆栈，其中，栈指的是Java虚拟机栈的局部变量表部分；

4）如果线程请求的栈深度大于虚拟机所允许的深度，将抛出StackOverflowError异常；如果虚拟机栈可以动态扩展，如果扩展时无法申请足够的内存，就会抛出OutOfMemoryError异常。

### 1.3.本地方法栈（Native Method Stack）

1）线程私有；

2）本地方法栈，描述的是Native方法的内存模型，每个Native方法在执行的同时都会创建一个**栈帧（Stack Frame）**，用于存放局部变量表，操作数栈，动态链接，方法出口，等信息；

3）如果线程请求的栈深度大于允许的深度，将抛出StackOverflowError异常；如果本地方法栈容量扩展时无法申请足够的内存，就会抛出OutOfMemoryError异常。

### 1.4.Java堆（Java Heap）

1）线程共享；

2）在虚拟机启动时创建，用于存放对象实例，几乎所有的对象实例都在Java堆分配内存；

3）**垃圾收集器（Garbage Collection，GC）**管理的主要区域，所以Java堆还可以细分为：新生代和老年代；

4）如果Java堆中没有足够的内存完成实例分配，并且堆无法再扩展，将抛出OutOfMemoryError异常。

### 1.5.方法区（Method Area）

1）线程共享；

2）用于存放被虚拟机加载的**类信息**，**常量**，**静态变量**，**即时编译器编译后的代码**，等数据；

3）如果方法区没有足够的内存完成分配，将抛出OutOfMemoryError异常。

### 1.6.运行时常量池（Runtime Constant Pool）

1）线程共享；

2）方法区的一部分；

3）Class文件中的**常量池（Constant Pool Table）**信息，存放在**运行时常量池**这里；

4）运行期间也能将常量放入池中，例如：String类的intern()方法；

5）当常量池无法再申请到内存时会抛出OutOfMemoryError异常。

### 1.7.直接内存（Direct Memory）

1）**直接内存**并不是虚拟机运行时数据区的一部分；

2）Java的NIO中的allocateDirect方法直接使用**直接内存**；

3）直接内存不受Java堆大小的限制，但是受到本机总内存大小和处理器寻址空间的限制；

4）动态扩展时如果超过内存限制，将抛出OutOfMemoryError异常。

## 2.拓展

### 2.1.内存泄漏 和 内存溢出

内存泄漏（Memory Leak）：内存申请后，用完没有释放，造成可用内存越来越少。

内存溢出（Memory Overflow）：程序在申请内存时，没有足够的内存空间供其使用。

## 3.引用

《深入理解Java虚拟机》 周志明

https://mp.weixin.qq.com/s/fYgoJrPOToilPvuubyvQtA



