---
title: HashMap分析总结
date: 2020-07-28 15:43:04
tags: 
- HashMap
- ConcurrentHashMap
- 并发
- 红黑树
categories: 并发编程相关
---

## 1.底层存储结构

首先需要说明一点，HashMap的底层存储结构在JDK1.8及之后的版本做了优化，所以讨论底层存储结构的时候我会分开说明

### JDK1.7及之前的版本

JDK1.7及之前的版本中，HashMap的存储结构是数组+链表的结构，每次put操作添加一对K-V的时候，把K的hashCode进行hash映射到数组上，如果发生了哈希碰撞，用链接法解决，如下图所示

<p><img src="/assets/blogImg/HashMap分析总结_01.png" width="300"></p>

一个蓝色方块代表一个Entry，Entry是HashMap定义的一个静态内部类

```java
static class Entry<K,V> implements Map.Entry<K,V> {
    final K key;
    V value;
    Entry<K,V> next;
    int hash;
    //省略成员方法和构造器
}
```

### JDK1.8及之后的版本

JDK1.8及之后的版本中，HashMap的存储结构做了优化，调整为数组+链表+红黑树的结构，和JDK1.7的不同点是当链表的长度大于等于TREEIFY_THRESHOLD（HashMap的一个静态成员变量，默认初始值为8）时，将链表转化为红黑树，如下图所示

<p><img src="/assets/blogImg/HashMap分析总结_02.png" width="350"></p>

一个方块代表一个Node，Node是HashMap定义的一个静态内部类。一个红/黑方块代表一个TreeNode，TreeNode是HashMap的一个静态内部类。

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;
    //省略成员方法和构造器
}
```

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent;  // red-black tree links
    TreeNode<K,V> left;
    TreeNode<K,V> right;
    TreeNode<K,V> prev;    // needed to unlink next upon deletion
    boolean red;
    //省略成员方法和构造器
}
```

## 2.源码分析

JDK为开发者提供了一个接口java.util.Map，此接口主要有四个常用的实现类，分别是HashMap、Hashtable、LinkedHashMap和TreeMap，类继承关系如下图所示

<p><img src="/assets/blogImg/HashMap分析总结_03.png" width="500"></p>

### 2.1.重要成员变量

```java
//默认加载因子
static final float DEFAULT_LOAD_FACTOR = 0.75f;

//默认初始化容量
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;//左带符号位移4位，即2的4次方，等于16

/**
 *实际存储的key-value键值对的个数
 */
transient int size;

/**
 *扩容阈值，当HashMap没有键值对时，大小为initialCapacity（默认值为DEFAULT_INITIAL_CAPACITY），
 *当第一次添加键值对时，大小为initialCapacity*loadFactor
 */
int threshold;

/**
 *加载因子存在的原因是因为减缓哈希冲突，如果初始桶为16，等到满16个元素才扩容，
 *某些桶里可能就有不止一个元素 了，所以加载因子默认为DEFAULT_LOAD_FACTOR
 */
final float loadFactor;

/**
 *用来记录HashMap内部结构发生变化的次数，主要用于迭代的快速失败（fail-fast）。强调一点，
 *内部结构发生变化指的是结构发生变化，例如put新键值对，但是某个key对应的value值被覆盖不属于结构变化
 */
transient int modCount;
```

### 2.2.构造方法

#### JDK1.7及之前的版本

```java
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
    	throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
    	initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
    	throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
    this.loadFactor = loadFactor;
    threshold = initialCapacity;
    init();//空方法，不过在其子类如LinkedHashMap中有对应实现
}

public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}

public HashMap() {
    this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR);
}

public HashMap(Map<? extends K, ? extends V> m) {
    this(Math.max((int) (m.size() / DEFAULT_LOAD_FACTOR) + 1, DEFAULT_INITIAL_CAPACITY), DEFAULT_LOAD_FACTOR);
    inflateTable(threshold);
    putAllForCreate(m);
}
```

#### JDK1.8及之后的版本

### 2.3.如何定位key在数组中的索引位置

#### JDK1.8及之后的版本

```java
//获取hash值的方法
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
//HashMap类的其他成员方法中多次用到这段代码，用于对hash()方法返回值进行取模，定位索引位置
//n数组的容量，2的倍数
tab[(n - 1) & hash]
```

定位key的数组索引位置主要分为三步：

1）获取key的hashCode

h = key.hashCode()

2）hashCode的高16和低16进行异或运算

hash = (h = key.hashCode()) ^ (h >>> 16)

3）取模定位索引位置

(n - 1) & hash

<p><img src="/assets/blogImg/HashMap分析总结_04.png" width="500"></p>

取模过程有一个关键点，那就是n的大小只可能是2的倍数，这就导致n的二进制只有一位是1。例如，16的二进制是1 0000，32的二进制是10 0000，所以n-1的二进制除了最高位是0，低位都是1，例如，15（16-1）的二级制是0 1111，31（32-1）的二级制是01 1111。

#### JDK1.7及之前的版本

```java
//获取hash值的方法
final int hash(Object k) {
    //哈希种子，一个随机值，用于尽量减少哈希碰撞
    int h = hashSeed;
    //如果是k是String类型且哈希种子不等于0，则调用sun.misc.Hashing.stringHash32返回hash值
    if (0 != h && k instanceof String) {
        return sun.misc.Hashing.stringHash32((String) k);
    }
    h ^= k.hashCode();
    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
//取模定位索引位置
//length数组的容量，2的倍数
static int indexFor(int h, int length) {
    return h & (length-1);
}
```

定位key的数组索引位置主要分为三步：

1）获取key的hashCode，并和哈希种子进行异或运算

h ^= k.hashCode()

2）对hashCode进行一系列的无符号右移和异或运算，确保hashCode的随机性

h ^= (h >>> 20) ^ (h >>> 12)
h ^ (h >>> 7) ^ (h >>> 4)

3）取模定位索引位置，取模过程参考JDK1.8的取模过程

h & (length-1)

### 2.4.HashMap的put方法

#### JDK1.8及之后的版本

put方法的执行流程如下

<p><img src="/assets/blogImg/HashMap分析总结_05.png" width="750"></p>

①.判断键值对数组table[i]是否为空或为null，如果是则执行resize()进行扩容；

②.根据键值key计算hash值得到插入的数组索引i，如果table[i]==null，直接新建节点添加，转向⑥，如果table[i]不为空，转向③；

③.判断table[i]的首个元素是否和key一样，如果相同直接覆盖value，否则转向④，这里的相同指的是hashCode以及equals；

④.判断table[i] 是否为treeNode，即table[i] 是否是红黑树，如果是红黑树，则直接在树中插入键值对，否则转向⑤；

⑤.遍历table[i]，判断链表长度是否大于8，大于8的话把链表转换为红黑树，在红黑树中执行插入操作，否则进行链表的插入操作；遍历过程中若发现key已经存在直接覆盖value即可；

⑥.插入成功后，判断实际存在的键值对数量size是否超过最大容量threshold，如果超过，进行扩容。

#### JDK1.7及之前的版本

put方法执行流程如下

①.判断键值对数组table是否为空数组，如果是则执行inflateTable进行初始；

②.判断key是否为null，如果是则执行putForNullKey把key==null的键值对放入table[0]这个位置，转向⑤；

③.根据键值key计算hash值得到插入的数组索引i，如果table[i]==null，转向⑤；如果table[i]!=null，转向④；

④.遍历链表，如果存在key相同的元素则直接覆盖，否则转向⑤；

⑤.添加键值对前先判读size是否超过最大容量threshold，如果超过则进行扩容，然后插入键值对，插入成功；

**需要注意的是插入的键值对都是插入到链表的头部**

### 2.5.扩容过程分析

### 2.6.多线程情况下为什么会出现死循环

### 2.7.HashMap的容量为什么一定是2的n次方

在HashMap中，哈希桶数组table的长度length大小必须为2的n次方，这是一种非常规的设计，常规的设计是把桶的大小设计为素数（也叫质数）。相对来说素数导致冲突的概率要小于合数（除了2以外的所有偶数都是合数）。HashMap采用这种非常规设计，主要是为了在取模和扩容时做优化，同时为了减少冲突，HashMap定位哈希桶索引位置时，也加入了高位参与运算的过程。

### 2.8.HashMap和HashTable的区别

Collections.synchronizedMap

## 3.引用

https://tech.meituan.com/2016/06/24/java-hashmap.html

https://blog.csdn.net/woshimaxiao1/article/details/83661464

