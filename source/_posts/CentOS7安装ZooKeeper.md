---
title: CentOS7安装ZooKeeper
date: 2020-07-09 22:47:05
tags: 
  - ZooKeeper
  - 下载安装
  - 中间件
categories: 
  - ZooKeeper
---

## 下载ZooKeeper

ZooKeeper官网下载：http://zookeeper.apache.org/releases.html

## 安装ZooKeeper

安装前需要先安装JVM

```
tar -zvxf apache-zookeeper-3.5.7-bin.tar.gz
cd apache-zookeeper-3.5.7-bin
```

修改配置文件

```
cd config
cp zoo_sample.cfg zoo.cfg
vi zoo.cfg
```

修改如下内容：

```
dataDir=/opt/apache-zookeeper-3.5.7-bin/dataDir
dataLogDir=/opt/apache-zookeeper-3.5.7-bin/dataLogDir
```

## 启动ZooKeeper

```
bin/zkServer.sh start conf/zoo.cfg
bin/zkServer.sh status
```

## ZooKeeper客户端连接服务

```
bin/zkCli.sh
```

## 配置开机启动ZooKeeper

```
cd /etc/rc.d/init.d
vi zookeeper.sh
```

配置内容如下

```
#!/bin/bash
#chkconfig:2345 20 90
#description:zookeeper
source /etc/profile.d/java_env.sh
/opt/apache-zookeeper-3.5.7-bin/bin/zkServer.sh start /opt/apache-zookeeper-3.5.7-bin/conf/zoo.cfg
```

内容说明

```
#!/bin/bash 声明脚本类型
#chkconfig:2345 20 90 声明启动优先级
#description:zookeeper 脚本描述
```

## 多机多服务集群配置

准备三台ZooKeeper服务器（记得打开防火墙端口号）

| 主机名      | ip            | 端口           |
| ----------- | ------------- | -------------- |
| ZooKeeper01 | 192.168.1.151 | 2181 2888 3888 |
| ZooKeeper02 | 192.168.1.152 | 2181 2888 3888 |
| ZooKeeper03 | 192.168.1.153 | 2181 2888 3888 |

修改zoo.cfg配置文件

```
cd /opt/apache-zookeeper-3.5.7-bin
vi conf/zoo.cfg
```

添加如下内容：

```
server.1=192.168.1.151:2888:3888
server.2=192.168.1.152:2888:3888
server.3=192.168.1.153:2888:3888
```

创建myid文件

```
vi dataDir/myid
服务器192.168.1.141的myid文件写入1
服务器192.168.1.142的myid文件写入2
服务器192.168.1.143的myid文件写入3
```

重启各个ZooKeeper服务

```
bin/zkServer.sh stop
bin/zkServer.sh start
bin/zkServer.sh status
```

如果配置成功可以看到如下内容

```
192.168.1.153
ZooKeeper JMX enabled by default
Using config: /opt/apache-zookeeper-3.5.7-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost.
Mode: follower

192.168.1.152
ZooKeeper JMX enabled by default
Using config: /opt/apache-zookeeper-3.5.7-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost.
Mode: leader

192.168.1.151
ZooKeeper JMX enabled by default
Using config: /opt/apache-zookeeper-3.5.7-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost.
Mode: follower
```

使用zkCli.sh测试

```
bin/zkCli.sh -server 192.168.1.151:2181
```
