---
title: CentOS7安装Kafka和KafkaManager
date: 2020-10-25 03:12:19
tags: 
- Kafka
- 安装
categories: 软件安装教程
---

## 资源

Kafka官网：http://kafka.apache.org/downloads
Kafka Manager下载路径：https://github.com/yahoo/CMAK/releases

## Kafka安装流程

### 解压文件

```
tar -zxvf kafka_2.13-2.5.0.tgz
cd kafka_2.13-2.5.0
```

### 启动内置Zookeeper服务

使用安装包中的脚本启动单节点Zookeeper 实例

```
nohup bin/zookeeper-server-start.sh -daemon config/zookeeper.properties &
```

### 配置Kafka

```
vi config/server.properties
```

修改listeners

```
listeners=PLAINTEXT://192.168.1.141:9092
```

### 启动Kafka服务

```
nohup bin/kafka-server-start.sh config/server.properties &
```

### 使用Kafka

#### 创建Topic

```
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test
```

#### 查看Topic

```
bin/kafka-topics.sh --list --zookeeper localhost:2181
```

#### 产生消息

```
bin/kafka-console-producer.sh --broker-list 192.168.1.141:9092 --topic test
```

#### 消费消息

```
bin/kafka-console-consumer.sh --topic test --from-beginning --bootstrap-server 192.168.1.141:9092
```

## Kafka Manager安装流程

### 解压文件

```
unzip CMAK-3.0.0.4.zip
cd CMAK-3.0.0.4
```

### sbt安装

```
curl https://bintray.com/sbt/rpm/rpm > bintray-sbt-rpm.repo
mv bintray-sbt-rpm.repo /etc/yum.repos.d/
yum install sbt
```

由于网络原因，需要配置阿里云maven仓库

```
touch ~/.sbt/repositories
vi ~/.sbt/repositories
```

写入如下内容：

```
[repositories] 
local
aliyun: http://maven.aliyun.com/nexus/content/groups/public/
typesafe: http://repo.typesafe.com/typesafe/ivy-releases/, [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext], bootOnly 
sonatype-oss-releases
maven-central
sonatype-oss-snapshots
```

检查sbt是否安装成功，查看命令输出，发现已经成功可以从`maven.aliyun.com/nexus`下载到依赖即表示成功

```
sbt -version
```

### 编译Kafka Manager

```
./sbt clean dist
```

看到打印这个消息 Getting org.scala-sbt sbt 0.13.9 (this may take some time)... 就慢慢等吧，可以到~/.sbt/boot/update.log 查看sbt更新日志。sbt更新好，就开始下载各种jar包，最后看到：Your package is ready in /opt/module/kafka-manager-1.3.3.18/target/universal/kafka-manager-1.3.3.18.zip 证明编译好了。

### 安装Kafka Manager

把编译完的cmak-3.0.0.4.zip移动到安装路径，并解压，进入cmak-3.0.0.4

```
cd target/universal
mv cmak-3.0.0.4.zip /opt
unzip cmak-3.0.0.4.zip
cd cmak-3.0.0.4
```

修改配置文件application.conf

```
vi config/application.conf
```

修改kafka-manager.zkhosts列表为自己的zk节点

```
kafka-manager.zkhosts="127.0.0.1:2181"
```

### 启动服务

```
nohup bin/cmak -Dconfig.file=conf/application.conf -Dhttp.port=9080 &
```



## Kafka集群配置

### 单机多broker集群配置

利用单节点部署多个broker。 不同的broker 设置不同的 id，监听端口及日志目录。 例如：

```
cp config/server.properties config/server-1.properties 
```

编辑配置：

```
config/server-1.properties:
broker.id=1
port=9093
log.dir=/tmp/kafka-logs-1
```

启动Kafka服务：

```
nohup bin/kafka-server-start.sh config/server-1.properties &
```

启动多个服务，按上文类似方式产生和消费消息。

### 多机多broker集群配置

准备三台虚拟机（记得先打开防火墙端口）

| 主机名  | ip            | 端口                                |
| ------- | ------------- | ----------------------------------- |
| Kafka01 | 192.168.1.141 | 2888 3888 9092 9080（KafkaManager） |
| Kafka02 | 192.168.1.142 | 2888 3888 9092                      |
| Kafka03 | 192.168.1.143 | 2888 3888 9092                      |

#### 配置ZooKeeper

修改ZooKeeper配置文件

```
cd /opt/kafka_2.13-2.5.0/config
vi zookeeper.properties
```

修改如下内容

```
dataDir=/opt/kafka_2.13-2.5.0/zookeeperData
dataLogDir=/opt/kafka_2.13-2.5.0/zookeeperDataLog
maxClientCnxns=100
tickTime=2000
initLimit=10
syncLimit=5
```

文件最后添加如下内容

```
#2888:zookeeper集群之间通讯所用的端口号
#3888:zookeeper集群的选举leader端口号
server.1=192.168.1.42:2888:3888
server.2=192.168.1.41:2888:3888
server.3=192.168.1.47:2888:3888
```

创建myid文件

```
cd /opt/kafka_2.13-2.5.0/zookeeperData
vi myid
服务器192.168.1.141的myid文件写入1
服务器192.168.1.142的myid文件写入2
服务器192.168.1.143的myid文件写入3
```

启动ZooKeeper

```
nohup bin/zookeeper-server-start.sh -daemon config/zookeeper.properties &
```

#### 配置Kafka

修改Kafka配置文件

```
cd /opt/kafka_2.13-2.5.0/config
vi server.properties
```

修改如下内容

```
broker.id的值三个节点要配置不同的值，分别配置为0，1，2
log.dirs必须保证目录存在，不会根据配置文件自动生成
host.name的值是本机ip
zookeeper.connect=192.168.1.141:2181,192.168.1.142:2181,192.168.1.143:2181
```

启动Kafka

```
nohup bin/kafka-server-start.sh config/server.properties &
```

