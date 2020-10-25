---
title: hs_err_pid日志分析
date: 2020-08-30 00:40:33
tags: 
- JVM
categories: 日常开发记录
---

## 1.场景

最近公司另一个项目组的同事离职，领导安排我接手同事的项目。项目在生产环境有2个服务，通过nginx进行负载均衡，在一次部署项目修改配置文件的时候，实施组的老同事手抖把其中一个服务的配置文件覆盖了另外一个服务的配置文件，结果悲剧就发生了。。。

配置文件被覆盖后，我只能无奈手动修改其中一个服务的配置文件，把配置文件尽量还原，但是还是遗漏一处配置没有还原到，结果导致了生产环境2个服务每天下午4点10分的时候就会相继崩溃。问题相当严重。。。

## 2.问题排查

JVM崩溃之后会在项目根目录下生成一个hs_err_pidXXX.log文件。打开文件，分析JVM崩溃原因。

### 崩溃事件简要分析

```log
#
# There is insufficient memory for the Java Runtime Environment to continue.
# Native memory allocation (mmap) failed to map 12288 bytes for committing reserved memory.
# Possible reasons:
#   The system is out of physical RAM or swap space
#   In 32 bit mode, the process size limit was hit
# Possible solutions:
#   Reduce memory load on the system
#   Increase physical memory or swap space
#   Check if swap backing store is full
#   Use 64 bit Java on a 64 bit OS
#   Decrease Java heap size (-Xmx/-Xms)
#   Decrease number of Java threads
#   Decrease Java thread stack sizes (-Xss)
#   Set larger code cache with -XX:ReservedCodeCacheSize=
# This output file may be truncated or incomplete.
#
#  Out of Memory Error (os_linux.cpp:2743), pid=57833, tid=0x00007f476f3fb700
#
# JRE version: Java(TM) SE Runtime Environment (8.0_191-b12) (build 1.8.0_191-b12)
# Java VM: Java HotSpot(TM) 64-Bit Server VM (25.191-b12 mixed mode linux-amd64 compressed oops)
# Failed to write core dump. Core dumps have been disabled. To enable core dumping, try "ulimit -c unlimited" before starting Java again
#
```

```log
Native memory allocation (mmap) failed to map 12288 bytes for committing reserved memory.
```

从上面这句提示语我们知道JVM申请内存的时候失败了，可能的原因有：

```log
The system is out of physical RAM or swap space（服务器的物理内存或交换空间不够了）
In 32 bit mode, the process size limit was hit（32位操作系统的内存寻址空间越界了）
```

看到这里的时候我用**free -h**命令查看了一下系统剩余内存和剩余交换空间，发现剩余内存还有60%作用，交换空间没有被使用。所以，我排除由于物理内存不够导致的JVM崩溃。

### 崩溃时刻正在运行的线程

```log
---------------  T H R E A D  ---------------

Current thread (0x00007f4866883800):  JavaThread "pool-8105-thread-4" [_thread_new, id=52261, stack(0x00007f476f2fb000,0x00007f476f3fc000)]

Stack: [0x00007f476f2fb000,0x00007f476f3fc000],  sp=0x00007f476f3faa70,  free space=1022k
Native frames: (J=compiled Java code, j=interpreted, Vv=VM code, C=native code)
V  [libjvm.so+0xace425]  VMError::report_and_die()+0x2c5
V  [libjvm.so+0x4deb77]  report_vm_out_of_memory(char const*, int, unsigned long, VMErrorType, char const*)+0x67
V  [libjvm.so+0x90c166]  os::pd_commit_memory(char*, unsigned long, bool)+0xf6
V  [libjvm.so+0x903d3f]  os::commit_memory(char*, unsigned long, bool)+0x1f
V  [libjvm.so+0x90d6a8]  os::pd_create_stack_guard_pages(char*, unsigned long)+0x48
V  [libjvm.so+0xa772cc]  JavaThread::run()+0x2fc
V  [libjvm.so+0x909c92]  java_start(Thread*)+0x102
C  [libpthread.so.0+0x7aa1]
```

```log
Stack: [0x00007f476f2fb000,0x00007f476f3fc000],  sp=0x00007f476f3faa70,  free space=1022k
```

从上面这句可以知道JVM虚拟机栈剩余大小为1022k。由此，我猜想虚拟机崩溃有可能是虚拟机**栈溢出**，要证明是栈溢出，首先要确认虚拟机栈大小是多少。确认虚拟机栈大小需要确认2点：

1）是否设置了虚拟机栈大小**Xss**；2）虚拟机版本。

#### 1）是否设置了虚拟机栈大小Xss

```java
VM Arguments:
jvm_args: -Xms2048m -Xmx6000m -XX:PermSize=125m -XX:MaxPermSize=256m 
java_command: test-1.0-SNAPSHOT.jar --spring.profiles.active=test
java_class_path (initial): test-1.0-SNAPSHOT.jar
Launcher Type: SUN_STANDARD
```

上面这段也是hs_err_pidXXX.log日志的内容，上面这段记录启动JVM的启动参数，明显我没有配置JVM虚拟机栈的大小Xss，所以Xss大小是默认值，而Xss默认值大小根据JVM版本和服务器操作系统版本来确定。

#### 2）虚拟机版本

```log
---------------  S Y S T E M  ---------------

OS:Red Hat Enterprise Linux Server release 6.7 (Santiago)

uname:Linux 2.6.32-573.el6.x86_64 #1 SMP Wed Feb 24 13:34:24 CST 2016 x86_64
libc:glibc 2.12 NPTL 2.12 
rlimit: STACK 10240k, CORE 0k, NPROC 64106, NOFILE 65536, AS infinity
load average:0.03 0.08 0.04
```

```log
vm_info: Java HotSpot(TM) 64-Bit Server VM (25.191-b12) for linux-amd64 JRE (1.8.0_191-b12), built on Oct  6 2018 05:43:09 by "java_re" with gcc 7.3.0
```

上面这段也是hs_err_pidXXX.log日志的内容，可以清楚的知道，JVM版本是**linux-amd64 JRE (1.8.0_191-b12)**，服务器操作系统版本是**Red Hat Enterprise Linux Server release 6.7 (Santiago)**。

#### 3）结论

通过上面两步可以确认虚拟机栈大小Xss使用了默认值，而且JVM版本是64位的JDK1.8。通过Java的官网我查找到该版本的默认Xss值为1024k。从而确认线程**栈溢出**。

### JVM里面的所有线程

```log
---------------  P R O C E S S  ---------------

Java Threads: ( => current thread )
=>0x00007f4866883800 JavaThread "pool-8105-thread-4" [_thread_new, id=52261, stack(0x00007f476f2fb000,0x00007f476f3fc000)]
  0x00007f4866881800 JavaThread "MQTT Snd: client_test_010" [_thread_blocked, id=52260, stack(0x00007f476f3fc000,0x00007f476f4fd000)]
  0x00007f486687f800 JavaThread "MQTT Rec: client_test_010" [_thread_blocked, id=52259, stack(0x00007f476f4fd000,0x00007f476f5fe000)]
  0x00007f486687d000 JavaThread "MQTT Call: client_test_010" [_thread_blocked, id=52258, stack(0x00007f476f5fe000,0x00007f476f6ff000)]
...
省略了中间的信息
...
  0x00007f4fc0002000 JavaThread "MQTT Call: client_test_010" [_thread_blocked, id=58101, stack(0x00007f5098730000,0x00007f5098831000)]
  0x00007f4fc0003800 JavaThread "MQTT Snd: client_test_010" [_thread_blocked, id=58100, stack(0x00007f509862f000,0x00007f5098730000)]
  0x00007f4fc0005000 JavaThread "MQTT Rec: client_test_010" [_thread_blocked, id=58099, stack(0x00007f5098a33000,0x00007f5098b34000)]
  0x00007f4ffc082000 JavaThread "MQTT Con: client_test_010" [_thread_blocked, id=58098, stack(0x00007f50936f9000,0x00007f50937fa000)]
  0x00007f4f9801a800 JavaThread "DubboResponseTimeoutScanTimer" daemon [_thread_blocked, id=57998, stack(0x00007f50924af000,0x00007f50925b0000)]
  0x00007f4f8805e000 JavaThread "commons-pool-EvictionTimer" daemon [_thread_blocked, id=57953, stack(0x00007f509842d000,0x00007f509852e000)]
  0x00007f50b8009000 JavaThread "DestroyJavaVM" [_thread_blocked, id=57834, stack(0x00007f50bde6e000,0x00007f50bdf6f000)]
  0x00007f50b9f7b000 JavaThread "http-nio-9130-AsyncTimeout" daemon [_thread_blocked, id=57940, stack(0x00007f5090f44000,0x00007f5091045000)]
  0x00007f50b9f79000 JavaThread "http-nio-9130-Acceptor-0" daemon [_thread_in_native, id=57939, stack(0x00007f5091045000,0x00007f5091146000)]
  0x00007f50b9f77000 JavaThread "http-nio-9130-ClientPoller-1" daemon [_thread_in_native, id=57938, stack(0x00007f5091146000,0x00007f5091247000)]
  0x00007f50ba0af000 JavaThread "http-nio-9130-ClientPoller-0" daemon [_thread_in_native, id=57937, stack(0x00007f5091247000,0x00007f5091348000)]
  0x00007f50ba0ad000 JavaThread "http-nio-9130-exec-10" daemon [_thread_blocked, id=57936, stack(0x00007f5091348000,0x00007f5091449000)]
  0x00007f50ba0ab000 JavaThread "http-nio-9130-exec-9" daemon [_thread_blocked, id=57935, stack(0x00007f5091449000,0x00007f509154a000)]
  0x00007f50ba0a9000 JavaThread "http-nio-9130-exec-8" daemon [_thread_blocked, id=57934, stack(0x00007f509154a000,0x00007f509164b000)]
  0x00007f50b9d35000 JavaThread "http-nio-9130-exec-7" daemon [_thread_blocked, id=57933, stack(0x00007f509164b000,0x00007f509174c000)]
  0x00007f50b9d33000 JavaThread "http-nio-9130-exec-6" daemon [_thread_blocked, id=57932, stack(0x00007f509174c000,0x00007f509184d000)]
  0x00007f50b9d31000 JavaThread "http-nio-9130-exec-5" daemon [_thread_blocked, id=57931, stack(0x00007f509184d000,0x00007f509194e000)]
  0x00007f50b9d2f000 JavaThread "http-nio-9130-exec-4" daemon [_thread_blocked, id=57930, stack(0x00007f509194e000,0x00007f5091a4f000)]
  0x00007f50b9e7a000 JavaThread "http-nio-9130-exec-3" daemon [_thread_blocked, id=57929, stack(0x00007f5091cad000,0x00007f5091dae000)]
  0x00007f50b9e79000 JavaThread "http-nio-9130-exec-2" daemon [_thread_in_native, id=57928, stack(0x00007f5098831000,0x00007f5098932000)]
  0x00007f50b9e78000 JavaThread "http-nio-9130-exec-1" daemon [_thread_blocked, id=57927, stack(0x00007f509afd5000,0x00007f509b0d6000)]
  0x00007f50b9a5b800 JavaThread "NioBlockingSelector.BlockPoller-1" daemon [_thread_in_native, id=57926, stack(0x00007f50a008e000,0x00007f50a018f000)]
  0x00007f50b97a2800 JavaThread "IdleConnectionMonitorThread" daemon [_thread_blocked, id=57915, stack(0x00007f5091fae000,0x00007f50920af000)]
  0x00007f4fc801c800 JavaThread "New I/O client worker #1-3" daemon [_thread_in_native, id=57913, stack(0x00007f50925b0000,0x00007f50926b1000)]
  0x00007f50b9c44000 JavaThread "dubbo-remoting-client-heartbeat-thread-2" daemon [_thread_blocked, id=57912, stack(0x00007f50926b1000,0x00007f50927b2000)]
  0x00007f4fc8036800 JavaThread "New I/O client worker #1-2" daemon [_thread_in_native, id=57910, stack(0x00007f50928b3000,0x00007f50929b4000)]
  0x00007f4fd4001000 JavaThread "DubboClientReconnectTimer-thread-2" daemon [_thread_blocked, id=57909, stack(0x00007f509852e000,0x00007f509862f000)]
  0x00007f50b9ab5800 JavaThread "schedulerFactoryBean_QuartzSchedulerThread" [_thread_blocked, id=57908, stack(0x00007f5092bb4000,0x00007f5092cb5000)]
  0x00007f50b9ab3800 JavaThread "schedulerFactoryBean_Worker-5" [_thread_blocked, id=57907, stack(0x00007f5092cb5000,0x00007f5092db6000)]
  0x00007f50b9ab1800 JavaThread "schedulerFactoryBean_Worker-4" [_thread_blocked, id=57906, stack(0x00007f5092db6000,0x00007f5092eb7000)]
  0x00007f50b9aaf800 JavaThread "schedulerFactoryBean_Worker-3" [_thread_blocked, id=57905, stack(0x00007f5092eb7000,0x00007f5092fb8000)]
  0x00007f50b9aae000 JavaThread "schedulerFactoryBean_Worker-2" [_thread_blocked, id=57904, stack(0x00007f5092fb8000,0x00007f50930b9000)]
  0x00007f50b9aad000 JavaThread "schedulerFactoryBean_Worker-1" [_thread_blocked, id=57903, stack(0x00007f50930b9000,0x00007f50931ba000)]
  0x00007f50b9a96000 JavaThread "dubbo-remoting-client-heartbeat-thread-1" daemon [_thread_blocked, id=57902, stack(0x00007f50935f8000,0x00007f50936f9000)]
  0x00007f4fc801b000 JavaThread "New I/O client worker #1-1" daemon [_thread_in_native, id=57900, stack(0x00007f50937fa000,0x00007f50938fb000)]
  0x00007f50b984c000 JavaThread "DubboClientReconnectTimer-thread-1" daemon [_thread_blocked, id=57898, stack(0x00007f50939fc000,0x00007f5093afd000)]
  0x00007f50b9705000 JavaThread "DubboSaveRegistryCache-thread-1" daemon [_thread_blocked, id=57892, stack(0x00007f5093cfd000,0x00007f5093dfe000)]
  0x00007f50b96ec800 JavaThread "main-EventThread" daemon [_thread_blocked, id=57891, stack(0x00007f5093dfe000,0x00007f5093eff000)]
  0x00007f50b96eb800 JavaThread "main-SendThread(172.28.130.14:2181)" daemon [_thread_in_native, id=57890, stack(0x00007f5093eff000,0x00007f5094000000)]
  0x00007f50b96b6000 JavaThread "ZkClient-EventThread-35-172.28.130.14:2181" daemon [_thread_blocked, id=57889, stack(0x00007f509802b000,0x00007f509812c000)]
  0x00007f50b96ca000 JavaThread "DubboRegistryFailedRetryTimer-thread-1" daemon [_thread_blocked, id=57888, stack(0x00007f509812c000,0x00007f509822d000)]
  0x00007f50b93ee800 JavaThread "Druid-ConnectionPool-Destroy-1169324755" daemon [_thread_blocked, id=57880, stack(0x00007f5098d34000,0x00007f5098e35000)]
  0x00007f50b93c5000 JavaThread "Druid-ConnectionPool-Create-1169324755" daemon [_thread_blocked, id=57879, stack(0x00007f5098e35000,0x00007f5098f36000)]
  0x00007f50b93c8800 JavaThread "OracleTimeoutPollingThread" daemon [_thread_blocked, id=57878, stack(0x00007f5098f36000,0x00007f5099037000)]
  0x00007f50b8b9d000 JavaThread "container-0" [_thread_blocked, id=57875, stack(0x00007f5099637000,0x00007f5099738000)]
  0x00007f50b8b9c000 JavaThread "ContainerBackgroundProcessor[StandardEngine[Tomcat]]" daemon [_thread_blocked, id=57874, stack(0x00007f5099738000,0x00007f5099839000)]
  0x00007f503414c800 JavaThread "Scheduler_QuartzSchedulerThread" [_thread_blocked, id=57873, stack(0x00007f5099839000,0x00007f509993a000)]
  0x00007f503412e800 JavaThread "Scheduler_Worker-5" [_thread_blocked, id=57872, stack(0x00007f509993a000,0x00007f5099a3b000)]
  0x00007f503412c800 JavaThread "Scheduler_Worker-4" [_thread_blocked, id=57871, stack(0x00007f5099a3b000,0x00007f5099b3c000)]
  0x00007f503412a800 JavaThread "Scheduler_Worker-3" [_thread_blocked, id=57870, stack(0x00007f5099b3c000,0x00007f5099c3d000)]
  0x00007f5034129000 JavaThread "Scheduler_Worker-2" [_thread_blocked, id=57869, stack(0x00007f5099c3d000,0x00007f5099d3e000)]
  0x00007f5034125000 JavaThread "Scheduler_Worker-1" [_thread_blocked, id=57868, stack(0x00007f509a95c000,0x00007f509aa5d000)]
  0x00007f50b8234000 JavaThread "Service Thread" daemon [_thread_blocked, id=57851, stack(0x00007f50a0a56000,0x00007f50a0b57000)]
  0x00007f50b820f000 JavaThread "C1 CompilerThread3" daemon [_thread_blocked, id=57850, stack(0x00007f50a0b57000,0x00007f50a0c58000)]
  0x00007f50b820c800 JavaThread "C2 CompilerThread2" daemon [_thread_blocked, id=57849, stack(0x00007f50a0c58000,0x00007f50a0d59000)]
  0x00007f50b820a800 JavaThread "C2 CompilerThread1" daemon [_thread_blocked, id=57848, stack(0x00007f50a0d59000,0x00007f50a0e5a000)]
  0x00007f50b8207800 JavaThread "C2 CompilerThread0" daemon [_thread_blocked, id=57847, stack(0x00007f50a0e5a000,0x00007f50a0f5b000)]
  0x00007f50b8206000 JavaThread "Signal Dispatcher" daemon [_thread_blocked, id=57846, stack(0x00007f50a0f5b000,0x00007f50a105c000)]
  0x00007f50b81d3000 JavaThread "Finalizer" daemon [_thread_blocked, id=57845, stack(0x00007f50a105c000,0x00007f50a115d000)]
  0x00007f50b81d0800 JavaThread "Reference Handler" daemon [_thread_blocked, id=57844, stack(0x00007f50a115d000,0x00007f50a125e000)]
```

所有的线程信息太多了，所以我省略了中间部分，通过分析，我发现关于MQTT的线程有很多都是**阻塞blocked**的，从而我可以进一步推断，引起JVM栈溢出的原因是服务一直在创建MQTT线程，而创建的MQTT线程一直阻塞不释放JVM虚拟机栈内存，最终导致了JVM栈溢出。

## 3.恍然大悟

为什么MQTT一直在创建线程，而且线程一直阻塞？想了好久之后才惊觉，最近有一台服务的配置文件被覆盖过，而配置文件里边刚好配置了MQTT客户端id，MQTT通过这个配置唯一标识一个客户端链接，因为配置文件被覆盖，导致两个服务的MQTT客户端id一模一样，最终导致相互争抢客户端id创建了很多MQTT线程，而且阻塞不释放资源。

