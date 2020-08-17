---
title: final关键字的作用
date: 2020-08-15 23:02:10
tags: 
- final
categories: Java基础
---

## 1.final关键字的作用

final关键字可以用来修饰**引用**，**方法**，**类**。

### 引用

1）如果引用为基本数据类型，则该引用为常量，该值无法修改；

2） 如果引用为引用数据类型，比如对象、数组，则该对象、数组本身可以修改，但指向该对象或数组的地址的引用不能修改；

3） 如果引用为**类的成员变量**，则必须当场赋值，否则编译会报错。**实例的成员变量**可以不用当场赋值，但一定要在某个位置赋值。

```java
//如果引用为基本数据类型，则该引用为常量，该值无法修改
public class TestFinal {
    public static void main(String[] args) {
        final int count = 1;
        count = 2;//编译报错
    }
}
//如果引用为引用数据类型，比如对象、数组，则该对象、数组本身可以修改，但指向该对象或数组的地址的引用不能修改
public class TestFinal {
    static class Person {
        public String name;
        public Person() {}
        public Person(String name) {
            this.name = name;
        }
    }
    public static void main(String[] args) {
        final Person person = new Person("john");
        person = new Person("tom");//编译报错
        person.name = "jack";
    }
}
//如果引用为 类的成员变量，则必须当场赋值，否则编译会报错。实例的成员变量 可以不用当场赋值，但一定要在某个位置赋值。
public class TestFinal {
    public static final int TEST_CLASS;//编译报错
    private final int TEST_OBJECT;
    public TestFinal() {
        TEST_OBJECT = 1;//一定要在某个位置给实例成员变量赋值
    }
}
```

### 方法

当使用final修饰方法时，这个方法将成为最终方法，无法被子类重写。但是，该方法仍然可以被继承。

```java
public class TestFinal {
    static class Person {
        public String name;
        public final void eat() {
            System.out.println("eat");
        }
    }
    static class Teacher extends Person {
        public void eat() {//编译报错
            System.out.println("eat");
        }
    }
}
```

### 类

当用final修改类时，该类成为最终类，无法被继承。简称为“断子绝孙类”。

```java
public class TestFinal {
    static final class Person {
    }
    static class Teacher extends Person {//编译报错
    }
}
```

参考：https://www.cnblogs.com/chhyan-dream/p/10685878.html

## 2.常量值和常量

常量值：

1）整型常量值：例如，54，100L

2）实型常量值：例如，5.4，5.66F

3）布尔型常量值：true和false

4）字符型常量值：例如，'a'

5）字符串型常量值：例如，"b"

常量：

常量不同于常量值，它可以在程序中用符号来代替常量值使用，因此在使用前必须先定义。Java 语言使用**final**关键字来定义一个常量。

细分为：

静态常量，成员常量，局部常量

```java
public class HelloWorld {
    // 静态常量
    public static final double PI = 3.14;
    // 成员常量
    final int y = 10;
    public static void main(String[] args) {
        // 局部常量
        final double x = 3.3;
    }
}
```

参考：http://c.biancheng.net/view/763.html

## 3.字符串常量的编译和加载机制

以**字面量（例如，String str="hello"）**的形式创建String变量时，需要经过以下步骤：

1）JVM会在编译期间就把字面量（"hello"）放到class文件的**常量池**中；

2）JVM类加载子系统加载class文件的时候从class文件**常量池**中加载字面量（"hello"），把字面量（"hello"）存放到**方法区**的**运行时常量池**的**运行时字符串常量池**中。

这个**运行时字符串常量池**的特点就是有且只有一份相同的字面量，如果有其它相同的字面量，JVM则返回这个字面量的引用，如果没有相同的字面量，则在**运行时字符串常量池**创建这个字面量并返回它的引用。

参考：https://www.cnblogs.com/tongkey/p/8587060.html