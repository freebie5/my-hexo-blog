---
title: Java异常体系
date: 2020-11-16 17:09:49
tags: 
- 异常
categories: Java基础
---

<p><img src="/assets/blogImg/Java异常体系_01.png" width="500"></p>

## Throwable 类

1）**Throwable 类**是 Java 语言中所有错误或异常的超类。

2）只有当对象是此类（或其子类之一）的实例时，才能通过 Java 虚拟机或者 Java throw 语句抛出。类似地，只有此类或其子类之一才可以是 catch 子句中的参数类型。

3）Throwable 包含了其线程创建时线程执行堆栈的快照。它还包含了给出有关错误更多信息的消息字符串。

4）最后，它还可以包含 cause（原因）：另一个导致此 throwable 抛出的 throwable。此 cause 设施在 1.4 版本中首次出现。它也称为异常链 设施，因为 cause 自身也会有 cause，依此类推，就形成了异常链，每个异常都是由另一个异常引起的。

## Error类

Error 是 Throwable 的子类，用于指示合理的应用程序**不应该试图捕获的严重问题**。

大多数这样的错误都是异常条件。虽然 ThreadDeath 错误是一个“正规”的条件，但它也是 Error 的子类，因此大多数应用程序都不应该试图捕获它。

在执行方法期间，无需在其 throws 子句中声明可能抛出但是未能捕获的 Error 的任何子类，因为这些错误可能是再也不会发生的异常条件。

Java 程序通常不捕获错误。错误一般发生在严重故障时，它们在Java程序处理的范畴之外。

## Exception类

Exception 异常主要分为两类：

1）IOException（I/O 输入输出异常），其中 IOException 及其子类异常被称作**受查异常**；

2）RuntimeException（运行时异常），RuntimeException 及其子类被称作**非受查异常**。

受查异常就是指，编译器在编译期间要求必须得到处理的那些异常，你必须在编译期处理了。

### 常见的受查异常

<p><img src="/assets/blogImg/Java异常体系_02.png" width="500"></p>

### 常见的非受查异常

<p><img src="/assets/blogImg/Java异常体系_03.png" width="500"></p>

## 自定义异常

Java 的异常机制中所定义的所有异常不可能预见所有可能出现的错误，某些特定的情境下，则需要我们自定义异常类型来向上报告某些错误信息。

在 Java 中你可以自定义异常。编写自己的异常类时需要记住下面的几点：

1）所有异常都必须是 Throwable 的子类；

2）如果希望写一个检查性异常类，则需要继承 Exception 类；

3）如果你想写一个运行时异常类，那么需要继承 RuntimeException 类。

## 异常处理方式

### try/catch关键字

使用 try 和 catch 关键字可以捕获异常。

try/catch 代码块放在异常可能发生的地方。

try/catch代码块中的代码称为**保护代码**，使用 try/catch 的语法如下：

```java
try {
   // 程序代码
} catch(ExceptionName e1) {
   //catch块
}
```

catch 语句包含要捕获异常类型的声明。当保护代码块中发生一个异常时，try 后面的 catch 块就会被检查。如果发生的异常包含在 catch 块中，异常会被传递到该 catch 块，这和传递一个参数到方法是一样。

一个 try 代码块后面跟随多个 catch 代码块的情况就叫**多重捕获**。

多重捕获块的语法如下所示：

```java
try{
   // 程序代码
}catch(异常类型1 异常的变量名1){
  // 程序代码
}catch(异常类型2 异常的变量名2){
  // 程序代码
}catch(异常类型2 异常的变量名2){
  // 程序代码
}
```

### throws/throw关键字

如果一个方法**没有捕获一个检查性异常**，那么该方法**必须使用 throws 关键字来声明**。throws 关键字放在方法签名的尾部。**也可以使用 throw 关键字抛出一个异常**，无论它是新实例化的还是刚捕获到的。

下面方法的声明抛出一个 RemoteException 异常：

```java
public class className {
  public void deposit(double amount) throws RemoteException {
    // Method implementation
    throw new RemoteException();
  }
  //Remainder of class definition
}
```

一个方法可以声明抛出多个异常，多个异常之间用逗号隔开。

### finally关键字

finally 关键字用来创建在 try 代码块后面执行的代码块。

**无论是否发生异常，finally 代码块中的代码总会被执行**。在 finally 代码块中，可以运行清理类型等收尾善后性质的语句。

finally 代码块出现在 catch 代码块最后，语法如下：

```java
try{
  // 程序代码
}catch(异常类型1 异常的变量名1){
  // 程序代码
}catch(异常类型2 异常的变量名2){
  // 程序代码
}finally{
  // 程序代码
}
```

## try/catch/finally 的执行顺序

执行顺序的相关问题可以说是各种面试中的「常客」了，尤其是 finally 块中带有 return 语句的情况。我们直接看几道面试题：

### 题型一

```java
public class Main {
    public static void main(String[] args){
        int result = test1();
        System.out.println(result);
    }
    public static int test1(){
        int i = 1;
        try{
            i++;
            System.out.println("try block, i = "+i);
        }catch(Exception e){
            i--;
            System.out.println("catch block i = "+i);
        }finally{
            i = 10;
            System.out.println("finally block i = "+i);
        }
        return i;
    }
}
```

输出结果如下：

```txt
try block, i = 2
finally block i = 10
10
```

这算一个相当简单的问题了，没有坑，下面我们稍微改动一下：

```java
public static int test2(){
    int i = 1;
    try{
        i++;
        throw new Exception();
    }catch(Exception e){
        i--;
        System.out.println("catch block i = "+i);
    }finally{
        i = 10;
        System.out.println("finally block i = "+i);
    }
    return i;
}
```

输出结果如下：

```txt
catch block i = 1
finally block i = 10
10
```

### 题型二

```java
public static int test3(){
    //try 语句块中有 return 语句时的整体执行顺序
    int i = 1;
    try{
        i++;
        System.out.println("try block, i = "+i);
        return i;
    }catch(Exception e){
        i ++;
        System.out.println("catch block i = "+i);
        return i;
    }finally{
        i = 10;
        System.out.println("finally block i = "+i);
    }
}
```

输出结果如下：

```txt
try block, i = 2
finally block i = 10
2
```

####  疑惑一：是不是有点疑惑？明明我 try 语句块中有 return 语句，可为什么最终还是执行了 finally 块中的代码？

我们反编译这个类，看看这个 test3 方法编译后的字节码的实现：

```java
0: iconst_1         //将 1 加载进操作数栈
1: istore_0         //将操作数栈 0 位置的元素存进局部变量表
2: iinc          0, 1   //将局部变量表 0 位置的元素直接加一（i=2）
5: getstatic     #3     // 5-27 行执行的 println 方法                
8: new           #5                  
11: dup
12: invokespecial #6                                                     
15: ldc           #7 
17: invokevirtual #8                                                     
20: iload_0         
21: invokevirtual #9                                                     24: invokevirtual #10                
27: invokevirtual #11                 
30: iload_0         //将局部变量表 0 位置的元素加载进操作栈（2）
31: istore_1        //把操作栈顶的元素存入局部变量表位置 1 处
32: bipush        10 //加载一个常量到操作栈（10）
34: istore_0        //将 10 存入局部变量表 0 处
35: getstatic     #3  //35-57 行执行 finally中的println方法             
38: new           #5                  
41: dup
42: invokespecial #6                  
45: ldc           #12                 
47: invokevirtual #8                  
50: iload_0
51: invokevirtual #9                
54: invokevirtual #10                 
57: invokevirtual #11                 
60: iload_1         //将局部变量表 1 位置的元素加载进操作栈（2）
61: ireturn         //将操作栈顶元素返回（2）
-------------------try + finally 结束 ------------
------------------下面是 catch + finally，类似的 ------------
62: astore_1
63: iinc          0, 1
.......
.......
```

从我们的分析中可以看出来，finally 代码块中的内容始终会被执行，无论程序是否出现异常的原因就是，**编译器会将 finally 块中的代码复制两份并分别添加在 try 和 catch 的后面**。

#### 疑惑二：原本我们的 i 就被存储在局部变量表 0 位置，而最后 finally 中的代码也的确将 slot 0 位置填充了数值 10，可为什么最后程序依然返回的数值 2 呢？

仔细看字节码，你会发现在 return 语句返回之前，**虚拟机会将待返回的值压入操作数栈**，等待返回，即使 finally 语句块对 i 进行了修改，但是待返回的值已经确实的存在于操作数栈中了，所以不会影响程序返回结果。

### 题型三

```java
public static int test4(){
    //finally 语句块中有 return 语句
    int i = 1;
    try{
        i++;
        System.out.println("try block, i = "+i);
        return i;
    }catch(Exception e){
        i++;
        System.out.println("catch block i = "+i);
        return i;
    }finally{
        i++;
        System.out.println("finally block i = "+i);
        return i;
    }
}
```

输出结果如下：

```txt
try block, i = 2
finally block i = 3
3
```

程序最终会采用 finally 代码块中的 return 语句进行返回，而直接忽略 try 语句块中的 return 指令。

## 引用

https://www.jianshu.com/p/49d2c3975c56