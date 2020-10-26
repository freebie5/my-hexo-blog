---
title: sleep和wait的区别
date: 2020-10-26 22:24:45
tags: 
- sleep
- wait
- 线程
---

## 区别

##### 1、这两个方法来自不同的类分别是，sleep来自Thread类，和wait来自Object类。

sleep是Thread的静态类方法，谁调用的谁去睡觉，即使在a线程里调用了b的sleep方法，实际上还是a去睡觉，要让b线程睡觉要在b的代码中调用sleep。

##### 2.最主要是sleep方法没有释放锁，而wait方法释放了锁，使得其他线程可以使用同步控制块或者方法。

sleep不出让系统资源；wait是进入线程等待池等待，出让系统资源，其他线程可以占用CPU。一般wait不会加时间限制，因为如果wait线程的运行资源不够，再出来也没用，要等待其他线程调用notify/notifyAll唤醒等待池中的所有线程，才会进入就绪队列等待OS分配系统资源。sleep(milliseconds)可以用时间指定使它自动唤醒过来，如果时间不到只能调用interrupt()强行打断。

**Thread.Sleep(0)的作用是“触发操作系统立刻重新进行一次CPU竞争”。**

##### 3、使用范围：wait，notify和notifyAll只能在同步控制方法或者同步控制块里面使用，而sleep可以在任何地方使用

```java
synchronized(x) { 
	x.notify();
	//或者wait(); 
}

```

##### 4、sleep必须捕获异常，而wait，notify和notifyAll不需要捕获异常

## 总结

两者都可以暂停线程的执行。

Wait 通常被用于线程间交互/通信，sleep 通常被用于暂停执行。

sleep()方法导致了程序暂停执行指定的时间，让出cpu该其他线程，但是他的监控状态依然保持者，当指定的时间到了又会自动恢复运行状态。在调用sleep()方法的过程中，线程不会释放对象锁。

而当调用wait()方法的时候，线程会放弃对象锁，进入等待此对象的**等待锁定池**，只有针对此对象调用notify()方法后本线程才进入**对象锁定池**准备，获取对象锁进入运行状态。线程不会自动苏醒。

## 引用

https://www.jianshu.com/p/87a7f24c45d4