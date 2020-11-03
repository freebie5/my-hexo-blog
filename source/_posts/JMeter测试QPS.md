---
title: JMeter测试QPS
date: 2020-11-02 23:46:13
tags: 
- QPS
- TPS
- JMeter
categories: JMeter相关
---

## 几个概念

| 名称     | 解释                                                         |
| -------- | ------------------------------------------------------------ |
| QPS      | Queries Per Second，是每秒查询率 ,是**一台服务器**每秒能够相应的查询次数，是对一个特定的查询服务器**在规定时间内**所处理流量多少的衡量标准, 即每秒的响应请求数，也即是最大吞吐能力 |
| TPS      | Transactions Per Second，也就是事务数/秒。一个事务是指一个客户机向服务器发送请求然后服务器做出反应的过程。客户机在发送请求时开始计时，收到服务器响应后结束计时，以此来计算使用的时间和完成的事务个数 |
| 并发数   | 指系统同时能处理的请求数量，同样反应了系统的负载能力。这个数值可以分析机器1s内的访问日志数量来得到 |
| 吞吐量   | 吞吐量是指系统在单位时间内处理请求的数量，TPS、QPS都是吞吐量的常用量化指标 |
| PV       | Page View，页面访问量，即页面浏览量或点击量，用户每次刷新即被计算一次。可以统计服务一天的访问日志得到 |
| UV       | Unique Visitor，独立访客，统计1天内访问某站点的用户数。可以统计服务一天的访问日志并根据用户的唯一标识去重得到。响应时间（RT）：响应时间是指系统对请求作出响应的时间，一般取平均响应时间。可以通过Nginx、Apache之类的Web Server得到 |
| 响应时间 | 指系统对请求作出响应的时间，一般取平均响应时间。可以通过Nginx、Apache之类的Web Server得到 |
| DAU      | Daily Active User，日活跃用户数量。常用于反映网站、互联网应用或网络游戏的运营情况。DAU通常统计一日（统计日）之内，登录或使用了某个产品的用户数（去除重复登录的用户），与UV概念相似 |
| MAU      | Month Active User，月活跃用户数量，指网站、app等去重后的月活跃用户数量 |

### 关系

**QPS(TPS) = 并发数 / 平均响应时间**

一个系统吞吐量通常由QPS(TPS)，并发数两个因素决定，每套系统这个两个值都有一个相对极限值，在应用场景访问压力下，只要某一项达到系统最高值，系统吞吐量就上不去了，如果压力继续增大，系统的吞吐量反而会下降，原因是系统超负荷工作，上下文切换，内存等等其他消耗导致系统性能下降。

## 测试环境搭建

搭建一个测试接口，接口的主要功能是去MySQL数据库根据主键id查询一条数据，并以JSON格式返回

首先，使用下面的建表语句，建立一个测试表

```mysql
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` char(1) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `birthday` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `create_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modify_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2000002 DEFAULT CHARSET=utf8;
```

然后，去github下载我写好的这个测试项目：https://github.com/freebie5/jmeterdemo.git

然后，使用**JmeterdemoApplicationTests#batchInsert**这个测试方法生成200w的测试数据

最后，测试接口地址为：http://localhost:8888/demo/user/getUserById

入参内容类型是：Content-Type:application/json

入参是：{"id":16312}

## JMeter使用

官网下载：https://jmeter.apache.org/download_jmeter.cgi

Windows环境下载zip包，下载完成解压，进入bin目录双击jmeter.bat打开jmeter

### 第一步，添加线程组

<p><img src="/assets/blogImg/JMeter测试QPS_01.png" width="800"></p>

Thread Group（线程组），主要包含以下3个参数：

**1）线程数：Number of Threads（users），虚拟用户数**
 1个虚拟用户占用1个进程or线程，需要多少个虚拟用户就设置对应数量的线程数。

**2）准备时长：Ramp-Up Period(in seconds)，表示设置的虚拟用户数全部启动所需的时间**
 如：线程数=20个，准备时长=10s ==> 20/10=2 (个/s)，即每秒启动2个线程

**3）循环次数：Loop Count，每个线程发送请求的次数**
 如：线程数=20个，循环次数=5次 ==> 总请求数目=20×5=100 (个)
 PS：若勾选"Infinite"，则线程会一直发送请求，直至选择停止运行脚本

### 第二步，添加Http请求

<p><img src="/assets/blogImg/JMeter测试QPS_02.png" width="800"></p>

<p><img src="/assets/blogImg/JMeter测试QPS_03.png" width="800"></p>

<p><img src="/assets/blogImg/JMeter测试QPS_04.png" width="800"></p>

配置参数说明

Protocol：协议。默认为http协议

Server Name or IP：服务器名称/IP。表示HTTP请求发送的目标服务器名称/IP地址

Port Number：端口号。目标服务器的端口号，http请求默认端口为80，https请求默认端口为443

Method：请求方法。发送HTTP请求的方法，如：GET、POST、PUT、OPTION、TRACE、DELETE

Path：路径。目标URL路径（不包括服务器地址和端口），如http//127.0.0.18001/dvwa/的Protocol为http，Server Name为127.0.0.1，端口8001，Path为/dvwa/

Content encoding：内容的编码方式，默认值为ISO8859

Client implementation：客户端实现：HttpClient4、Java

### 第三步，添加监听器

JMeter使用**监听器**收集**取样器**记录的数据，并以可视化方式呈现。
如：聚合报告(Aggregate Report)，可更为直观查看测试结果

<p><img src="/assets/blogImg/JMeter测试QPS_05.png" width="800"></p>

<p><img src="/assets/blogImg/JMeter测试QPS_06.png" width="800"></p>

### 第四步，添加Htpp请求头

由于我的接口入参内容类型是json，所以需要添加一个Http请求头

<p><img src="/assets/blogImg/JMeter测试QPS_07.png" width="800"></p>

<p><img src="/assets/blogImg/JMeter测试QPS_08.png" width="800"></p>

### 第五步，运行脚本

ctrl + r

### 第六步，分析聚合报告

| 列明            | 描述                                                         |
| --------------- | ------------------------------------------------------------ |
| Label           | Jmeter中元件的Name属性值                                     |
| Samples         | 本次测试一共发出的请求数(如：模拟10个用户，每个用户循环6次，则总请求数=10×6=60) |
| Average         | 平均响应时间(ms)。默认情况是每个Request的平均响应时间；<br/>若使用Transaction Controller，则表示每个Transaction显示的平均响应时间 |
| Median          | 响应时间的中位数。表示50%用户的响应时间                      |
| 90%Line         | 90%用户的响应时间（ms）                                      |
| Min             | 最小响应时间（ms）                                           |
| Max             | 最大响应时间（ms）                                           |
| Error%          | 出现错误的请求数占比[(错误请求数/请求总数)×100%]             |
| Throughput      | 吞吐量。默认表示每秒完成的请求数(Request per second)；若使用Transaction Controller，则表示每秒处理的事务数(Transaction per second) |
| Received KB/sec | 每秒从服务端接收到的数据量                                   |
| Sent KB/sec     | 每秒向服务端发送的数据量                                     |



## 引用

JMeter使用教程

https://www.jianshu.com/p/b22c57ceb52b

QPS，TPS，并发数，吞吐量

https://zhuanlan.zhihu.com/p/111914041

