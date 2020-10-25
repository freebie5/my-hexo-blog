---
title: CentOS7安装Redis
date: 2020-10-24 17:41:00
tags: 
- redis
- 安装
categories: 软件安装教程
---

## 下载

Redis官网下载地址：https://redis.io/download

## 安装

```shell
tar -xzvf redis-5.0.7.tar.gz
cd /usr/redis/redis-5.0.7
yum install gcc
make MALLOC=libc
cd src
make install PREFIX=/usr/local/redis
cp redis.conf /usr/local/redis/bin/
```

## 修改配置文件

```shell
vi /usr/local/redis/bin/redis.conf
1.注释bind 127.0.0.1
# bind 127.0.0.1
2.修改内容，no修改为yes
daemonize yes
3.设置访问密码
requirepass 123456
```

## 启动

```shell
cd /usr/local/redis/bin
./redis-server
```

## 设置开机启动

新建开机启动脚本

```shell
vi /etc/systemd/system/redis.service
```

内容如下，其中，ExecStart要设置成自己的路径

```shell
[Unit]
Description=redis-server
After=network.target
[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /usr/local/redis/bin/redis.conf
PrivateTmp=true
[Install]
WantedBy=multi-user.target
```

设置开机启动

```shell
systemctl daemon-reload
systemctl start redis.service
systemctl enable redis.service
```

验证是否设置成功，出现下面的内容，证明设置成功

```shell
[root@localhost ~]# ps -ef|grep redis
root      14467      1  0 16:34 ?        00:00:05 ./redis-server *:6379
root      19357  11723  0 17:37 pts/2    00:00:00 grep --color=auto redis
```

## 配置主从复制

准备三台Redis服务器（记得打开防火墙端口号）

| 主机名  | ip            | 端口 |
| ------- | ------------- | ---- |
| Redis01 | 192.168.1.181 | 6379 |
| Redis02 | 192.168.1.182 | 6379 |
| Redis03 | 192.168.1.183 | 6379 |

各个Redis服务修改配置文件

```shell
以Redis01作为主服务器，Redis02和Redis03作为从服务器
vi /usr/local/redis/bin/redis.conf
修改内容如下：
1.注释bind 127.0.0.1
# bind 127.0.0.1
2.开启daemonize
daemonize yes
3.设置访问密码
requirepass 123456
4.Redis02和Redis03需要设置replicaof（redis5.0之后的版本使用replicaof，之前的版本使用slaveof）
replicaof 192.168.1.181 6379
5.Redis02和Redis03需要设置masterauth
masterauth 123456
```

重启各个redis服务

```shell
systemctl stop redis.service
systemctl start redis.service
```

测试，在Redis01缓存一个数据，在Redis02和Redis03验证是否异步拷贝过去了

```shell
cd /usr/local/redis/bin
./redis-cli
auth 123456
set test 111
```

## 配置哨兵（Sentinel）

使用上面配置主从复制的3台Redis服务器作为Sentinel的服务器

| 主机名  | ip            | 端口  |
| ------- | ------------- | ----- |
| Redis01 | 192.168.1.181 | 26379 |
| Redis02 | 192.168.1.182 | 26379 |
| Redis03 | 192.168.1.183 | 26379 |

修改sentinel.conf配置文件，三个配置文件保持一致

```shell
cd /usr/local/redis/bin
vi sentinel.conf
修改内容如下：
port 26379
daemonize yes
logfile "mySentinel.log"
dir "./"
sentinel monitor mymaster 192.168.1.81 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 18000
sentinel auth-pass mymaster 123456
```

启动sentinel服务

```shell
./redis-sentinel sentinel.conf
```

测试，查看sentinel信息

```shell
./redis-cli -p 26379
info sentinel
```

## 配置集群（Cluster）

配置６个节点：３个主节点和３个从节点

| 主机名       | ip            | 端口                        |
| ------------ | ------------- | --------------------------- |
| Redis01      | 192.168.1.181 | 6379，16379（集群总线端口） |
| Redis02      | 192.168.1.182 | 6379，6380，16379           |
| Redis03      | 192.168.1.183 | 6379，16379（集群总线端口） |
| Redis01_back | 192.168.1.181 | 6380，16379（集群总线端口） |
| Redis02_back | 192.168.1.182 | 6380，16379（集群总线端口） |
| Redis03_back | 192.168.1.183 | 6380，16379（集群总线端口） |

新建集群配置文件

```shell
cd /usr/local/redis/bin
mkdir cluster.conf

//主节点最小配置如下
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
protected-mode no

//从节点最小配置如下
port 6380
cluster-enabled yes
cluster-config-file nodesBack.conf
cluster-node-timeout 5000
appendonly yes
```

启动cluster服务

```shell
//启动主节点
nohup ./redis-server cluster.conf &
//启动从节点
nohup ./redis-server clusterBack.conf &
```

创建集群

```shell
./redis-cli --cluster create 192.168.1.181:6379 192.168.1.181:6380 192.168.1.182:6379 192.168.1.182:6380 192.168.1.183:6379 192.168.1.183:6380 --cluster-replicas 1
```

输入上面的命令，回显如下：

```shell
>>> Performing hash slots allocation on 6 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
Adding replica 192.168.1.182:6380 to 192.168.1.181:6379
Adding replica 192.168.1.183:6380 to 192.168.1.182:6379
Adding replica 192.168.1.181:6380 to 192.168.1.183:6379
M: f6d6a4db42958dfc11e27b3eacf6d7879971af53 192.168.1.181:6379
   slots:[0-5460] (5461 slots) master
S: a0830e7ab2252612582c893da52382b47a4c5c31 192.168.1.181:6380
   replicates 945f589d9c574e219859225c955e18767bf2915d
M: eb2cc39e7a4901c97543033425b89d1b0ecab9b0 192.168.1.182:6379
   slots:[5461-10922] (5462 slots) master
S: d4f04c9115ffbe34425c6b1e989fbcf8d6bbb3ce 192.168.1.182:6380
   replicates f6d6a4db42958dfc11e27b3eacf6d7879971af53
M: 945f589d9c574e219859225c955e18767bf2915d 192.168.1.183:6379
   slots:[10923-16383] (5461 slots) master
S: 09e9f47ff805f664a56bf9f095d7d9f0bd3e4166 192.168.1.183:6380
   replicates eb2cc39e7a4901c97543033425b89d1b0ecab9b0
Can I set the above configuration? (type 'yes' to accept):
```

如果觉得没有问题，输入：yes，回显如下：

```shell
>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster
Waiting for the cluster to join
.....
>>> Performing Cluster Check (using node 192.168.1.181:6379)
M: f6d6a4db42958dfc11e27b3eacf6d7879971af53 192.168.1.181:6379
   slots:[0-5460] (5461 slots) master
S: a0830e7ab2252612582c893da52382b47a4c5c31 192.168.1.181:6380
   slots: (0 slots) slave
   replicates 945f589d9c574e219859225c955e18767bf2915d
M: 945f589d9c574e219859225c955e18767bf2915d 192.168.1.183:6379
   slots:[10923-16383] (5461 slots) master
   1 additional replica(s)
M: eb2cc39e7a4901c97543033425b89d1b0ecab9b0 192.168.1.182:6379
   slots:[5461-10922] (5462 slots) master
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```

## 引用

安装

https://www.cnblogs.com/zuidongfeng/p/8032505.html

https://www.cnblogs.com/heqiuyong/p/10463334.html

https://blog.csdn.net/weixin_39040527/article/details/106671028

主从复制

https://blog.csdn.net/u014691098/article/details/82391608

哨兵

https://www.cnblogs.com/guolianyu/p/10249687.html

集群

https://www.redis.com.cn/topics/cluster-tutorial/