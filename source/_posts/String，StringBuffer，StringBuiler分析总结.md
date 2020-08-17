---
title: String，StringBuffer，StringBuiler分析总结
date: 2020-08-10 23:52:13
tags: 
- String
- StringBuilder
- StringBuffer
categories: Java基础
---

## 1.源码分析

### String

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_01.png" width="400"></p>

```java
public final class String implements java.io.Serializable, Comparable<String>, CharSequence {

    private final char value[];
    
    //省略其他
    
}
```

1）String类被**final关键字**修饰，所以String类不可以被继承；

2）String类底层通过**实例成员变量vaule[]数组**保存数据，value[]数组被final关键字修饰，所以value[]数组的引用不能被修改；

### StringBuffer

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_02.png" width="400"></p>

```java
public final class StringBuffer extends AbstractStringBuilder implements java.io.Serializable, CharSequence {
    
    //省略
    
}
```

1）StringBuffer类被final关键字修饰，所以StringBuffer类不可以被继承；

2）StringBuffer类继承AbstractStringBuilder；

3）StringBuffer类的大部分方法被**synchronized关键字**修饰，所以StringBuffer类是线程安全；

### StringBuilder

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_03.png" width="400"></p>

```java
public final class StringBuilder extends AbstractStringBuilder implements java.io.Serializable, CharSequence {

    //省略
    
}
```

1）StringBuilder类被final关键字修饰，所以StringBuilder类不可以被继承；

2）StringBuilder类继承AbstractStringBuilder；

3）StringBuilder类的大部分方法**没有**被**synchronized关键字**修饰，所以StringBuilder类不是线程安全；

### AbstractStringBuilder

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_04.png" width="400"></p>

```java
abstract class AbstractStringBuilder implements Appendable, CharSequence {
    
    char[] value;
    
    //省略其他
    
}
```

1）AbstractStringBuilder类是一个抽象类；

2）AbstractStringBuilder类通过一个**实例成员变量value[]数组**保存数据，和String类不同，value[]数组没有被final关键字修饰，所以value[]数组的引用可以被修改；

## 2.性能测试

```java
public class Test {

    private static final Integer time = 100000;

    public static void main(String[] args) {
        testString();
        testStringBuffer();
        testStringBuilder();
    }

    public static void testString() {
        String str = "";
        long start = System.currentTimeMillis();
        for (int i = 0;i < time; i++) {
            str += "a";
        }
        long end = System.currentTimeMillis();
        System.out.println("string:"+(end - start));
    }

    public static void testStringBuffer() {
        StringBuffer stringBuffer = new StringBuffer();
        long start = System.currentTimeMillis();
        for (int i = 0;i < time; i++) {
            stringBuffer.append("a");
        }
        long end = System.currentTimeMillis();
        System.out.println("stringBuffer:"+(end - start));
    }

    public static void testStringBuilder() {
        StringBuilder stringBuilder = new StringBuilder();
        long start = System.currentTimeMillis();
        for (int i = 0;i < time; i++) {
            stringBuilder.append("a");
        }
        long end = System.currentTimeMillis();
        System.out.println("stringBuilder:"+(end - start));
    }
}

//运行结果
//string:6533
//stringBuffer:5
//stringBuilder:4
```

1.String 适用于字符串拼接较少、字符串变化较小的场合。

2.StringBuffer 适用于字符串连接操作比较频繁，且要求线程安全（多线程环境下操作）。

3.StringBuiler 适用于字符串连接操作比较频繁，且是单线程的情况。

## 3.常见面试题

1）下面这段代码的输出结果是什么？

```java
public class Test {
    public static void main(String[] args) {
        String a = "hello2";
        String b = "hello" + 2;
        System.out.println(a==b);//true
    }
}
```

输出结果为：true。原因很简单，"hello"+2在编译期间就已经被优化成"hello2"，因此在运行期间，变量a和变量b指向的是同一个对象。

2）下面这段代码的输出结果是什么？

```java
public class Test {
    public static void main(String[] args) {
        String a = "hello2";
        String b = "hello";
        String c = b + 2;
        System.out.println(a==c);
    }
}
```

输出结果为:false。由于有符号引用的存在，所以 String c = b + 2;不会在编译期间被优化，不会把b+2当做字面常量来处理的，因此这种方式生成的对象事实上是保存在堆上的。因此a和c指向的并不是同一个对象。

3）下面这段代码的输出结果是什么？

```java
public class Test {
    public static void main(String[] args) {
        String a = "hello2";
        final String b = "hello";
        String c = b + 2;
        System.out.println((a == c));
    }
}
```

输出结果为：true。对于被final修饰的变量，会在class文件常量池中保存一个副本，也就是说不会通过连接而进行访问，对final变量的访问在编译期间都会直接被替代为真实的值。那么String c = b + 2;在编译期间就会被优化成：String c = "hello" + 2。

4）下面这段代码的输出结果是什么？

```java
public class Test {
    public static void main(String[] args) {
        String a = "hello2";
        final String b = getHello();
        String c = b + 2;
        System.out.println((a == c));
    }
    public static String getHello() {
        return "hello";
    }
}
```

输出结果为false。这里面虽然将b用final修饰了，但是由于其赋值是通过方法调用返回的，那么它的值只能在运行期间确定，因此a和c指向的不是同一个对象。

5）下面这段代码的输出结果是什么？

```java
public class Test {
    public static void main(String[] args) {
        String a = "hello";
        String b =  new String("hello");
        String c =  new String("hello");
        String d = b.intern();

        System.out.println(a==b);
        System.out.println(b==c);
        System.out.println(b==d);
        System.out.println(a==d);
    }
}
```

输出结果为（JDK版本 JDK6)：false，false，false，true。这里面涉及到的是String.intern方法的使用。在String类中，intern方法是一个本地方法，在JDK1.6及之前的版本中，intern方法会在运行时常量池中查找是否存在内容相同的字符串，如果存在则返回指向该字符串的引用，如果不存在，则会将该字符串入池，并返回一个指向该字符串的引用。因此，a和d指向的是同一个对象。

6）String str = new String("abc")创建了多少个对象？

这个问题在很多书籍上都有说到比如《Java程序员面试宝典》，包括很多国内大公司笔试面试题都会遇到，大部分网上流传的以及一些面试书籍上都说是2个对象，这种说法是片面的。

如果有不懂得地方可以参考这篇帖子：http://rednaxelafx.iteye.com/blog/774673/

首先必须弄清楚创建对象的含义，创建是什么时候创建的？这段代码在运行期间会创建2个对象么？毫无疑问不可能，用javap -c反编译即可得到JVM执行的字节码内容：

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_05.png" width="600"></p>

很显然，new只调用了一次，也就是说只创建了一个对象。

而这道题目让人混淆的地方就是这里，这段代码在运行期间确实只创建了一个对象，即在堆上创建了"abc"对象。而为什么大家都在说是2个对象呢，这里面要澄清一个概念 该段代码执行过程和类的加载过程是有区别的。在类加载的过程中，确实在运行时常量池中创建了一个"abc"对象，而在代码执行过程中确实只创建了一个String对象。

因此，这个问题如果换成 String str = new String("abc")涉及到几个String对象？合理的解释是2个。

个人觉得在面试的时候如果遇到这个问题，可以向面试官询问清楚”是这段代码执行过程中创建了多少个对象还是涉及到多少个对象“再根据具体的来进行回答。

7）下面这段代码1）和2）的区别是什么？

```java
public class Main {
    public static void main(String[] args) {
        String str1 = "I";
        //str1 += "love"+"java";        1)
        str1 = str1+"love"+"java";      //2)
         
    }
}
```

1）的效率比2）的效率要高，1）中的"love"+"java"在编译期间会被优化成"lovejava"，而2）中的不会被优化。下面是两种方式的字节码：

1）的字节码：

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_06.png" width="600"></p>

2）的字节码：

<p><img src="/assets/blogImg/String，StringBuffer，StringBuiler分析总结_07.png" width="600"></p>

可以看出，在1）中只进行了一次append操作，而在2）中进行了两次append操作。

## 4.引用

https://www.cnblogs.com/dolphin0520/p/3778589.html