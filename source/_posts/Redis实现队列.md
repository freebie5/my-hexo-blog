---
title: Redis实现异步消息队列
date: 2020-11-02 22:56:09
tags: 
- 异步消息队列
- redis
categories: 缓存相关
---

## 需求场景

如果对消息的**可靠性**要求不高，可以使用Redis实现一个**异步消息队列**。

## 实现方案

```redis
rpush async_queue apple banana pear
lpop async_queue
```

使用rpush在list的右边入队，使用lpop在list的左边出队。测试代码如下：

```java
public class RedisDemo {

    public static void main(String[] args) {
        String ip = "192.168.1.182";
        int port = 6379;
        Jedis jedis = new Jedis(ip, port);
        jedis.auth("123456");
        //异步消息队列
        String asyncQueueKey = "async_queue";
        //进队
        jedis.rpush(asyncQueueKey, "apple");
        jedis.rpush(asyncQueueKey, "banana");
        jedis.rpush(asyncQueueKey, "pear");
        //出队
        System.out.println(jedis.llen(asyncQueueKey));
        jedis.lpop(asyncQueueKey);
        System.out.println(jedis.llen(asyncQueueKey));
        jedis.lpop(asyncQueueKey);
        System.out.println(jedis.llen(asyncQueueKey));
        jedis.lpop(asyncQueueKey);
    }

}
```

## 队列空了怎么办

如果队列里边没有消息，消费者获取不到消息，客户端可以暂停1秒之后再次尝试获取消息，但是这样就会有1秒的消息延迟，为了降低延迟，可以使用**阻塞读**。

```redis
blpop async_queue
```

阻塞读在list没有数据时，会进入休眠，一旦数据来了，则立刻读取。测试代码如下：

```java
public class RedisDemo {

    public static void main(String[] args) {
        String ip = "192.168.1.182";
        int port = 6379;
        Jedis jedis = new Jedis(ip, port, 300);//Redis链接超时时间300秒
        jedis.auth("123456");
        //异步消息队列
        String asyncQueueKey = "async_queue";
        jedis.rpush(asyncQueueKey, "apple");
        System.out.println(jedis.llen(asyncQueueKey));
        jedis.blpop(asyncQueueKey,"100");
        System.out.println(jedis.llen(asyncQueueKey));
        jedis.blpop(asyncQueueKey, "100");
        System.out.println("end");
    }

}
```

## 空闲连接自动断开

调用了blpop之后线程会阻塞，Redis客户端的链接会闲置，闲置久了会断开链接，这个时候blpop会抛出异常，需要捕获。