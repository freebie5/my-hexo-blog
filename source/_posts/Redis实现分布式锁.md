---
title: Redis实现分布式锁
date: 2020-11-07 21:24:48
tags: 
- redis
- 分布式锁
categories: 缓存相关
---

##  为什么需要分布式锁

**分布式应用**经常会遇到如下**并发问题**

假设有两个Redis客户端：A和B，它们同时查询到一个key=10到各自的内存中。A执行key=key+10，B执行key=key+20，然后A先把key=20存回Redis服务端，之后B把key=30存回Redis服务端。这就发生数据覆盖的问题了。

## 解决方案

```redis
set dis_lock true ex 5 nx
```

使用上面的命令来实现基于Redis的分布式锁。简单解释一下命令的意思：设置一个key=dis_lock，value=true的值到Redis服务端，ex 5表示缓存过期时间为5秒，nx表示只有key=dis_lock的缓存不存在时才成功。实例代码如下：

```java
public class RedisDemo {
    public static void main(String[] args) {
        String ip = "192.168.1.182";
        int port = 6379;
        Jedis jedis = new Jedis(ip, port);
        jedis.auth("123456");
        //分布式锁
        String disLockKey = "dis_lock";
        String disLockVal = "true";
        SetParams setParams = new SetParams();
        setParams.ex(50);
        setParams.nx();
        //一开始不存在key，获取锁成功，返回OK
        String flag1 = jedis.set(disLockKey, disLockVal, setParams);
        System.out.println(flag1);
        //已经存在key，获取锁失败，返回null
        String flag2 = jedis.set(disLockKey, disLockVal, setParams);
        System.out.println(flag2);
        //先删除锁，获取锁成功，返回OK
        jedis.del(disLockKey);
        String flag3 = jedis.set(disLockKey, disLockVal, setParams);
        System.out.println(flag3);
    }
}
```



## 超时问题

上面的解决方案，为了解决死锁问题，设置缓存过期时间，这就带来一个问题。如果客户端获取锁之后在过期时间到了之后还未执行完毕，那么就会有问题。

为了避免这个问题，Redis分布式锁不要用于较长时间的任务。

## 可重入性

类似于Java的ReentranLock，基于Redis的分布式锁也可以实现可重入。

```java
public class RedisWithReentrantLock {

    private ThreadLocal<Map<String,Integer>> locks = new ThreadLocal<>();

    private Jedis jedis;

    public RedisWithReentrantLock(Jedis jedis) {
        this.jedis = jedis;
    }

    private boolean _lock(String key) {
        SetParams setParams = new SetParams();
        setParams.nx();
        setParams.ex(5000);
        return jedis.set(key, "", setParams)!=null;
    }

    private void _unlock(String key) {
        jedis.del(key);
    }

    private Map<String,Integer> currentLocks() {
        Map<String,Integer> refs = locks.get();
        if(refs!=null) {
            return refs;
        }
        locks.set(new HashMap<String,Integer>());
        return locks.get();
    }

    public boolean lock(String key) {
        Map<String, Integer> refs = currentLocks();
        Integer lockCount = refs.get(key);
        //已经持有锁，则锁次数加一
        if(lockCount!=null) {
            refs.put(key, lockCount+1);
            return true;
        }
        //第一次获取锁
        boolean ok = this._lock(key);
        if(!ok) {
            return false;
        } else {
            refs.put(key,1);
            return true;
        }
    }

    public boolean unlock(String key) {
        Map<String, Integer> refs = currentLocks();
        Integer lockCount = refs.get(key);
        //没有锁
        if(lockCount==null) {
            return false;
        }
        //有锁，则锁次数减一
        lockCount--;
        if(lockCount>0) {
            refs.put(key, lockCount);
        } else {
            refs.remove(key);
            this._unlock(key);
        }
        return true;
    }

    public static void main(String[] args) {
        String ip = "192.168.1.182";
        int port = 6379;
        Jedis jedis = new Jedis(ip, port);
        jedis.auth("123456");
        String key = "myLock";
        RedisWithReentrantLock lock = new RedisWithReentrantLock(jedis);
        System.out.println(lock.lock(key));
        System.out.println(lock.lock(key));
        System.out.println(lock.unlock(key));
        System.out.println(lock.unlock(key));
    }

}
```

