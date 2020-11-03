---
title: JVM内存溢出定位
date: 2020-10-26 23:28:02
tags: 
- 线上排查
- JVM
categories: JVM相关
---

## 准备测试环境

测试代码如下

```java
public class Test {

    static class Item {
        private byte[] memory = new byte[1*1024*1024];
    }

    public static void main(String[] args) throws InterruptedException {
        List<Item> list = new ArrayList<>();
        while(true) {
            list.add(new Item());
            Thread.sleep(1000);
        }
    }

}
```

配置JVM参数

```shell
-Dfile.encoding=UTF-8 -Xmx180M -Xms180M -Xmn60M -XX:SurvivorRatio=8 -XX:+HeapDumpOnOutOfMemoryError
```

运行结果如下

```shell
java.lang.OutOfMemoryError: Java heap space
Dumping heap to java_pid1052.hprof ...
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
	at com.example.mysqldemo.Test$Item.<init>(Test.java:9)
	at com.example.mysqldemo.Test.main(Test.java:15)
Heap dump file created [175960409 bytes in 0.120 secs]
```

## 使用工具进行排查

### 使用eclipse的MAT

打开内存溢出时JVM生成的hprof文件

<p><img src="/assets/blogImg/JVM内存溢出定位_01.png" width="800"></p>

点击Dominator Tree按钮

<p><img src="/assets/blogImg/JVM内存溢出定位_02.png" width="800"></p>

按照heap使用百分比，从大到小排列，可以知道是main线程死循环一直创建**Test$Item**类添加到**ArrayList**中导致内存溢出

<p><img src="/assets/blogImg/JVM内存溢出定位_03.png" width="800"></p>

### 使用JProfiler

打开内存溢出时JVM生成的hprof文件

<p><img src="/assets/blogImg/JVM内存溢出定位_04.png" width="800"></p>

点击Biggest Objects，选择占用最多堆内存的对象，右击选择Use Selected Objects，选择Incoming referrences

<p><img src="/assets/blogImg/JVM内存溢出定位_05.png" width="800"></p>

点击Show In Graph，可以清楚的看到ArrayList被调用的过程

<p><img src="/assets/blogImg/JVM内存溢出定位_06.png" width="800"></p>

<p><img src="/assets/blogImg/JVM内存溢出定位_07.png" width="800"></p>

### 使用jvisualvm

打开内存溢出时JVM生成的hprof文件

<p><img src="/assets/blogImg/JVM内存溢出定位_08.png" width="800"></p>

点击类，按照所有类实例占堆内存大小，从大到小排序

<p><img src="/assets/blogImg/JVM内存溢出定位_09.png" width="800"></p>

选中占用最多的**byte[]**，右击选择“在实例视图中显示”

<p><img src="/assets/blogImg/JVM内存溢出定位_10.png" width="800"></p>

选择其中一个实例，可以看到引用关系

<p><img src="/assets/blogImg/JVM内存溢出定位_11.png" width="800"></p>

右击ArrayList的引用，选中“在线程中引用”，可以查看调用栈

<p><img src="/assets/blogImg/JVM内存溢出定位_12.png" width="800"></p>

<p><img src="/assets/blogImg/JVM内存溢出定位_13.png" width="800"></p>

## 常用JVM配置参数

```shell
//设置JVM最大可用内存为180M
-Xmx180M
//设置JVM初始内存为180M。此值可以设置与-Xmx相同，以避免每次垃圾回收完成后JVM重新分配内存
-Xms180M
//设置年轻代大小为2G
-Xmn2G
//设置每个线程的栈大小。JDK5.0以后每个线程堆栈大小为1M，以前每个线程堆栈大小为256K
-Xss128K
//内存溢出是生成hprof文件
-XX:+HeapDumpOnOutOfMemoryError
```

## 引用

JVM参数

https://www.cnblogs.com/likehua/p/3369823.html

JVM内存溢出定位

https://www.cnblogs.com/godoforange/p/11544004.html

http://itindex.net/detail/46879-java-%E5%86%85%E5%AD%98-%E6%BA%A2%E5%87%BA

https://www.cnblogs.com/firstdream/p/7810094.html