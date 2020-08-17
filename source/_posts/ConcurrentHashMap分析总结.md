---
title: ConcurrentHashMap分析总结
date: 2020-08-02 21:55:14
tags: 
- 并发
- 集合
categories: 并发编程相关
---

ConcurrentHashMap从JDK1.5开始随java.util.concurrent包一起引入JDK中，主要为了解决HashMap线程不安全和Hashtable效率不高的问题。

## 1.底层存储结构

首先需要说明一点，ConcurrentHashMap的底层存储结构在JDK1.8及之后的版本做了优化，所以讨论底层存储结构的时候我会分开说明

### JDK1.7及之前的版本

JDK1.7及之前的版本ConcurrentHashMap的存储结构由Segment数组+HashEntry数组+链表组成。Segment继承ReentrantLock，当我们并发的put键值对时，键值对可能被分配到不同的Segment，不同的线程锁住不同Segment，实现了线程安全。如下图所示

<p><img src="/assets/blogImg/ConcurrentHashMap分析总结_01.png" width="300"></p>

一个黄色方块代表一个Segment，Segment是ConcurrentHashMap的一个静态内部类；一个蓝色方块代表一个HashEntry，HashEntry是ConcurrentHashMap的一个静态内部类。

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {

    //省略
    
    Segment(float lf, int threshold, HashEntry<K,V>[] tab) {
        this.loadFactor = lf;
        this.threshold = threshold;
        this.table = tab;
    }
    
    //省略

}
```

```java
static final class HashEntry<K,V> {
    final int hash;
    final K key;
    volatile V value;
    volatile HashEntry<K,V> next;

    HashEntry(int hash, K key, V value, HashEntry<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.value = value;
        this.next = next;
    }

    //省略
    
}
```

### JDK1.8及之后的版本

JDK1.8及之后的版本ConcurrentHashMap的存储结构由数组+链表+红黑树组成，加锁采用CAS和synchronized实现，如下图所示

<p><img src="/assets/blogImg/ConcurrentHashMap分析总结_02.png" width="300"></p>

一个蓝色方块代表一个Node，Node是ConcurrentHashMap的一个静态内部类；红黑方块代表一个TreeBin，TreeBin是ConcurrentHashMap的一个静态内部类，TreeBin封装了TreeNode，提供转换黑红树的一些条件和锁的控制。

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    volatile V val;
    volatile Node<K,V> next;

    Node(int hash, K key, V val, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.val = val;
        this.next = next;
    }

    //省略
}
```

```java
static final class TreeBin<K,V> extends Node<K,V> {
    TreeNode<K,V> root;
    volatile TreeNode<K,V> first;
    volatile Thread waiter;
    volatile int lockState;
    // values for lockState
    static final int WRITER = 1; // set while holding write lock
    static final int WAITER = 2; // set when waiting for write lock
    static final int READER = 4; // increment value for setting read lock

    //省略
}
static final class TreeNode<K,V> extends Node<K,V> {
    TreeNode<K,V> parent;  // red-black tree links
    TreeNode<K,V> left;
    TreeNode<K,V> right;
    TreeNode<K,V> prev;    // needed to unlink next upon deletion
    boolean red;

    TreeNode(int hash, K key, V val, Node<K,V> next,
             TreeNode<K,V> parent) {
        super(hash, key, val, next);
        this.parent = parent;
    }

    //省略
    
}
```

## 2.源码分析

### 2.1.初始化过程

#### JDK1.7

查看构造方法可以知道初始化过程分为两步：

1）首先根据concurrencyLevel计算出Segment数组的大小，并初始化；

2）然后根据initialCapacity和ssize计算出HashEntry数组的大小，并初始化。

```java
public ConcurrentHashMap(int initialCapacity,
                             float loadFactor, int concurrencyLevel) {
    if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();

    if (concurrencyLevel > MAX_SEGMENTS)
        concurrencyLevel = MAX_SEGMENTS;

    // Find power-of-two sizes best matching arguments
    int sshift = 0;
    int ssize = 1;
    while (ssize < concurrencyLevel) {
        ++sshift;
        ssize <<= 1;
    }
    segmentShift = 32 - sshift;
    segmentMask = ssize - 1;
    this.segments = Segment.newArray(ssize);

    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    int c = initialCapacity / ssize;
    if (c * ssize < initialCapacity)
        ++c;
    int cap = 1;
    while (cap < c)
        cap <<= 1;

    for (int i = 0; i < this.segments.length; ++i)
        this.segments[i] = new Segment<K,V>(cap, loadFactor);
}
```

#### JDK1.8

查看构造方法可以知道，通过入参initialCapacity，loadFactor，concurrencyLevel计算出sizeCtl。此时并没初始化数组，当第一次put操作的时候才会调用initTable方法进行初始化。

```java
public ConcurrentHashMap(int initialCapacity,
                             float loadFactor, int concurrencyLevel) {
    if (!(loadFactor > 0.0f) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
    if (initialCapacity < concurrencyLevel)   // Use at least as many bins
        initialCapacity = concurrencyLevel;   // as estimated threads
    long size = (long)(1.0 + (long)initialCapacity / loadFactor);
    int cap = (size >= (long)MAXIMUM_CAPACITY) ?
        MAXIMUM_CAPACITY : tableSizeFor((int)size);
    this.sizeCtl = cap;
}

private final Node<K,V>[] initTable() {
    Node<K,V>[] tab; int sc;
    while ((tab = table) == null || tab.length == 0) {
        if ((sc = sizeCtl) < 0)
            Thread.yield(); // lost initialization race; just spin
        else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
            try {
                if ((tab = table) == null || tab.length == 0) {
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                    @SuppressWarnings("unchecked")
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                    table = tab = nt;
                    sc = n - (n >>> 2);
                }
            } finally {
                sizeCtl = sc;
            }
            break;
        }
    }
    return tab;
}
```

### 2.2.如何定位key在数组中的索引位置

#### JDK1.7

定位key在数组中的位置分为三步步：

1）计算出key的hash值；

2）定位key在Segment数组的位置；

3）定位key在HashEntry数组的位置。

```java
public V put(K key, V value) {
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key.hashCode());
    return segmentFor(hash).put(key, hash, value, false);
}

//计算key的hash值
private static int hash(int h) {
    // Spread bits to regularize both segment and index locations,
    // using variant of single-word Wang/Jenkins hash.
    h += (h <<  15) ^ 0xffffcd7d;
    h ^= (h >>> 10);
    h += (h <<   3);
    h ^= (h >>>  6);
    h += (h <<   2) + (h << 14);
    return h ^ (h >>> 16);
}

//定位key在Segment数组的位置
final Segment<K,V> segmentFor(int hash) {
    return segments[(hash >>> segmentShift) & segmentMask];
}

//定位key在HashEntry数组的位置
//Segment类的put方法中计算逻辑如下
int index = hash & (tab.length - 1);
```

#### JDK1.8

定位过程分为两步：

1）首先通过spread方法计算出key的hash值；

2）然后hash和数组长度求余，定位key在数组的位置。

```java
//计算hash值
static final int spread(int h) {
    return (h ^ (h >>> 16)) & HASH_BITS;
}

//求余计算数组下标
(n - 1) & hash)
```

### 2.3.ConcurrentHashMap的put方法

#### JDK1.7

ConcurrentHashMap类的put方法的过程分为3步：

1）计算key的hash值；

2）通过segmentFor方法定位key在Segment数组的下标；

3）调用Segment类的put方法。

接下来执行Segment类的put方法，分为5步：

1）首先获取锁；

2）然后hash和HashEntry数组的长度进行求余运算，定位key在HashEntry数组的位置；

3）如果HashEntry数组该位置为null，则直接插入；

4）如果该位置有值，且key的hash值相等，则直接替换；

5）如果该位置有值，且key的hash值不相等，则遍历链表的下一个，如果遍历链表都没有相等的hash值，则直接插入到链表表尾；

```java
public V put(K key, V value) {
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key.hashCode());
    return segmentFor(hash).put(key, hash, value, false);
}

final Segment<K,V> segmentFor(int hash) {
    return segments[(hash >>> segmentShift) & segmentMask];
}

//Segment类的put方法
V put(K key, int hash, V value, boolean onlyIfAbsent) {
    lock();
    try {
        int c = count;
        if (c++ > threshold) // ensure capacity
            rehash();
        HashEntry<K,V>[] tab = table;
        int index = hash & (tab.length - 1);
        HashEntry<K,V> first = tab[index];
        HashEntry<K,V> e = first;
        while (e != null && (e.hash != hash || !key.equals(e.key)))
            e = e.next;

        V oldValue;
        if (e != null) {
            oldValue = e.value;
            if (!onlyIfAbsent)
                e.value = value;
        }
        else {
            oldValue = null;
            ++modCount;
            tab[index] = new HashEntry<K,V>(key, hash, first, value);
            count = c; // write-volatile
        }
        return oldValue;
    } finally {
        unlock();
    }
}
```

#### JDK1.8

//

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    else {
        Node<K,V> e; K k;
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;
        else if (p instanceof TreeNode)
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        else {
            for (int binCount = 0; ; ++binCount) {
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                        treeifyBin(tab, hash);
                    break;
                }
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                p = e;
            }
        }
        if (e != null) { // existing mapping for key
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            afterNodeAccess(e);
            return oldValue;
        }
    }
    ++modCount;
    if (++size > threshold)
        resize();
    afterNodeInsertion(evict);
    return null;
}
```

### 2.4.ConcurrentHashMap的size方法

#### JDK1.7

一开始并不直接锁定所有Segment计算size，而是不加锁的情况下直接计算两次size的大小，再对比两次size是否相等，如果相等返回size，如果不相等再尝试一次不加锁的情况下计算两次size的大小，如果还是不相等，再把所有Segment加锁，然后计算size。

```java
public int size() {
    final Segment<K,V>[] segments = this.segments;
    long sum = 0;
    long check = 0;
    int[] mc = new int[segments.length];
    // Try a few times to get accurate count. On failure due to
    // continuous async changes in table, resort to locking.
    for (int k = 0; k < RETRIES_BEFORE_LOCK; ++k) {
        check = 0;
        sum = 0;
        int mcsum = 0;
        for (int i = 0; i < segments.length; ++i) {
            sum += segments[i].count;
            mcsum += mc[i] = segments[i].modCount;
        }
        if (mcsum != 0) {
            for (int i = 0; i < segments.length; ++i) {
                check += segments[i].count;
                if (mc[i] != segments[i].modCount) {
                    check = -1; // force retry
                    break;
                }
            }
        }
        if (check == sum)
            break;
    }
    if (check != sum) { // Resort to locking all segments
        sum = 0;
        for (int i = 0; i < segments.length; ++i)
            segments[i].lock();
        for (int i = 0; i < segments.length; ++i)
            sum += segments[i].count;
        for (int i = 0; i < segments.length; ++i)
            segments[i].unlock();
    }
    if (sum > Integer.MAX_VALUE)
        return Integer.MAX_VALUE;
    else
        return (int)sum;
}
```

#### JDK1.8

首先在添加和删除元素时，会通过CAS操作更新ConcurrentHashMap的baseCount属性值来统计元素个数。但是CAS操作可能会失败，因此，ConcurrentHashMap又定义了一个CounterCell数组来记录CAS操作失败时的元素个数。因此，ConcurrentHashMap中元素的个数则通过如下计算方式获得：

元素总数 = baseCount + sum(CounterCell)

```java
public int size() {
    long n = sumCount();
    return ((n < 0L) ? 0 :
            (n > (long)Integer.MAX_VALUE) ? Integer.MAX_VALUE :
            (int)n);
}

final long sumCount() {
    CounterCell[] as = counterCells; CounterCell a;
    long sum = baseCount;
    if (as != null) {
        for (int i = 0; i < as.length; ++i) {
            if ((a = as[i]) != null)
                sum += a.value;
        }
    }
    return sum;
}
```

### 2.4.扩容过程分析

#### JDK1.7

#### JDK1.8

## 3.引用

https://blog.csdn.net/bill_xiang_/article/details/81122044

https://www.cnblogs.com/study-everyday/p/6430462.html

https://www.sohu.com/a/205451532_684445

https://blog.csdn.net/ZOKEKAI/article/details/90051567