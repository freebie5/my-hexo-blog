---
title: Redis哨兵底层原理
date: 2020-10-24 16:18:08
tags: 
- 哨兵
- redis
categories: 缓存相关
---

## 什么是哨兵（Sentinel）

Redis哨兵用于管理多个 Redis 服务器（instance）， 执行以下三个任务：

- **监控（Monitoring）**：Sentinel会不断地检查你的主服务器和从服务器是否运作正常。
- **提醒（Notification）**：当被监控的某个Redis服务器出现问题时，Sentinel可以通过 API 向管理员或者其他应用程序发送通知。
- **自动故障迁移（Automatic failover）**：当一个主服务器不能正常工作时，Sentinel会开始一次自动故障迁移操作， 它会将失效主服务器的其中一个从服务器升级为新的主服务器， 并让失效主服务器的其他从服务器改为复制新的主服务器；当客户端试图连接失效的主服务器时， 集群也会向客户端返回新主服务器的地址，使得集群可以使用新主服务器代替失效服务器。

Redis Sentinel是一个分布式系统， 你可以在一个架构中运行多个 Sentinel 进程（progress）， 这些进程使用流言协议（gossip protocols)来接收关于主服务器是否下线的信息， 并使用投票协议（agreement protocols）来决定是否执行自动故障迁移， 以及选择哪个从服务器作为新的主服务器。

## 几个需要注意的核心点

1. 哨兵集群至少要 3 个节点，来确保自己的健壮性。
2. redis主从 + sentinel的架构，是不会保证数据的零丢失的，它是为了保证redis集群的高可用。

## 为什么至少3个哨兵节点

<p><img src="/assets/blogImg/Redis哨兵的底层原理_01.png" width="400"></p>

如上图，如果master宕机，sentinel1和sentinel2只要有一个认为master宕机就会进行切换，同时sentinel1和sentinel2就会选出一个sentinel来进行故障转移，这个时候就需要用到majority，即大多数哨兵都是运行的，2个哨兵的majority是2（3个的majority=2，4个的majority=2，5个的majority=3），也就是说现在这两个哨兵节点都是正常运行的就可以进行故障转移。

但是，如果**master和sentinel1**运行的整个机器如果宕机了的话，那么哨兵就只有一个了，此时就无法来通过majority来进行故障转移了，所以，我们至少需要三台哨兵实例。

## 哨兵主备切换的数据丢失问题

### 1.主从异步复制导致的数据丢失

<p><img src="/assets/blogImg/Redis哨兵的底层原理_02.png" width="400"></p>

master 和slave 数据复制是异步的，这样就有可能会出现部分数据还没有复制到slave中，master就挂掉了，那么这部分的数据就会丢失了。

### 2.脑裂导致的数据丢失

<p><img src="/assets/blogImg/Redis哨兵的底层原理_03.png" width="400"></p>

脑裂其实就是网络分区导致的现象，比如，我们的master机器网络突然不正常了发生了网络分区，和其他的slave机器不能正常通信了，其实master并没有挂还活着好好的呢，但是哨兵可不是吃闲饭的啊，它会认为master挂掉了啊，那么问题来了，client可能还在继续写master的呀，还没来得及更新到新的master呢，那这部分数据就会丢失。

### 3.解决数据丢失问题的配置

在sentinel.conf文件添加如下两个配置项

```shell
min-slaves-to-write 1 # 要求至少一个slave
min-slaves-max-lag 10 # 数据复制和同步的延迟不能超过10s
```

一旦**所有**的slave节点，在数据复制和同步时**延迟**了超过10秒的话，那么master它就不会再接客户端的请求了，这样就会有效减少大量数据丢失的发生

## sdown和odown转换机制

sdown，即主观宕机，如果一个哨兵它自己觉得master宕机了，就是主观宕机。

odown，即客观宕机，如果quorum数量的哨兵都认为一个master宕机了，则为客观宕机。

哨兵在ping一个master的时候，如果超过了is-master-down-after-milliseconds指定的毫秒数之后，就是达到了sdown，就主观认为master宕机了。

quorum指定数量的哨兵认为master是sdown，那么就是odown了。

哨兵通过订阅master的_sentinel__:hello channel获知其他哨兵对于master的宕机判断。

## 哨兵集群如何实现自动发现

1. 通过redis的pub/sub系统实现的，每个哨兵都会往__sentinel__:hello这个channel里发送一个消息。
2. 其他哨兵可以消费到这个消息，且可以感知到其他哨兵的存在。
3. 每隔两秒钟，每个哨兵都会向自己监控的某个master+slaves对应的__sentinel__:hello channel里发送一个消息（包括自己的host、ip和runid还有对这个master的监控配置）。
4. 每个哨兵也会去监听自己监控的每个master+slaves对应的__sentinel__:hello channel，然后去感知到同样在监听这个master+slaves的其他哨兵的存在。
5. 每个哨兵还会跟其他哨兵交换对master的监控配置，互相进行监控配置的同步。

## slave到master选举算法

如果一个master被认为odown了，而且majority哨兵都允许了主备切换，那么某个哨兵就会执行**主备切换**操作，此时首先要选举一个slave来作为新的master，主要通过下面几个步骤：需要考虑slave的下面一些信息

- 跟master断开连接的时长
- slave优先级
- 复制offset
- run id

如果一个slave跟master断开连接已经超过了down-after-milliseconds的10倍，再加上加master宕机的时长，那么slave就被认为不适合选举为master。

```text
(down-after-milliseconds * 10) + milliseconds_since_master_is_in_SDOWN_state
```

接下来会对slave进行排序

1. 按照slave优先级进行排序，slave priority越低，优先级就越高。
2. 如果slave priority相同，那么看replica offset，哪个slave复制了越多的数据，offset越靠后，优先级就越高。
3. 如果上面两个条件都相同，那么选择一个run id比较小的那个slave

## quorum和majority 关系

每次一个哨兵要做主备切换的时候，首先需要quorum数量的哨兵认为odown，然后选举出一个哨兵来做切换，这个哨兵还得得到majority哨兵的授权，才能正式执行切换。

如果quorum < majority，比如5个哨兵，majority就是3，quorum设置为2，那么就3个哨兵授权就可以执行切换

如果quorum >= majority，那么必须quorum数量的哨兵都授权，比如5个哨兵，quorum是5，那么必须5个哨兵都同意授权，才能执行切换。