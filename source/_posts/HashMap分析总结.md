---
title: HashMap分析总结
date: 2020-07-28 15:43:04
tags: 
- HashMap
- Hashtable
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

相比JDK1.8，JDK1.7少了判断是否为红黑树的流程，put方法执行流程如下

<p><img src="/assets/blogImg/HashMap分析总结_08.png" width="600"></p>

①.判断键值对数组table是否为空数组，如果是则执行inflateTable进行初始；

②.判断key是否为null，如果是则执行putForNullKey把key==null的键值对放入table[0]这个位置，转向⑤；

③.根据键值key计算hash值得到插入的数组索引i，如果table[i]==null，转向⑤；如果table[i]!=null，转向④；

④.遍历链表，如果存在key相同的元素则直接覆盖，否则转向⑤；

⑤.添加键值对前先判读size是否超过最大容量threshold，如果超过则进行扩容，然后插入键值对，插入成功；

**需要注意的是插入的键值对都是插入到链表的头部**

### 2.5.扩容过程分析

#### JDK1.7及之前的版本

**扩容后键值对链表的顺序都倒过来了**

当键值对的数量size >= 阈值threshold，且数组索引对应位置已经被占用，将触发扩容逻辑

```java
void addEntry(int hash, K key, V value, int bucketIndex) {
    //当键值对的数量size >= 阈值threshold，且数组索引对应位置已经被占用
    if ((size >= threshold) && (null != table[bucketIndex])) {
        resize(2 * table.length);
        hash = (null != key) ? hash(key) : 0;
        bucketIndex = indexFor(hash, table.length);
    }

    createEntry(hash, key, value, bucketIndex);
}

void resize(int newCapacity) {
    Entry[] oldTable = table;
    int oldCapacity = oldTable.length;
    if (oldCapacity == MAXIMUM_CAPACITY) {
        threshold = Integer.MAX_VALUE;
        return;
    }

    Entry[] newTable = new Entry[newCapacity];
    transfer(newTable, initHashSeedAsNeeded(newCapacity));
    table = newTable;
    threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1);
}

void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
    for (Entry<K,V> e : table) {
        while(null != e) {
            Entry<K,V> next = e.next;
            if (rehash) {
                e.hash = null == e.key ? 0 : hash(e.key);
            }
            int i = indexFor(e.hash, newCapacity);
            e.next = newTable[i];
            newTable[i] = e;
            e = next;
        }
    }
}
```

举个例子方便理解

假设我们的hash算法就是简单的用key mod 一下数组的长度。其中的哈希桶数组table的size=4， key = 3，7，11，15。put顺序依次为 3、7、11，15。在mod 4以后都冲突在table[3]这里了。当要插入key=15时触发了扩容条件，接下来的4个步骤是哈希桶数组 resize成8，然后所有的Node重新rehash的过程。

<p><img src="/assets/blogImg/HashMap分析总结_06.png" width="800"></p>

#### JDK1.8及之后的版本

**扩容后不会倒置链表键值对的顺序**

当键值对数量size > 阈值threshold，将触发扩容逻辑

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    ...
    //省略上面的逻辑
    //当键值对数量size > 阈值threshold
    if (++size > threshold)
        resize();
    afterNodeInsertion(evict);
    return null;
}

final Node<K,V>[] resize() {
    ...
    //省略上面的逻辑
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {//
                oldTab[j] = null;
                if (e.next == null)//没有后续键值对的直接移动
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)//如果是TreeNode表示这是一棵红黑树
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else {//移动整个链表
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        //hash值小于容量的，&运算之后都会等于0
                        //例如，key=3（二进制0011），oldCap=4（二进制1000），0011&1000=0000
                        //hash值大于容量的，&运算之后都不会等于0
                        //例如，key=5（二进制1001），oldCap=4（二进制1000），1001&1000=1000
                        //loHead用来指向&运算结果不为零的键值对链表
                        //hiHead用来指向&运算结果为零的键值对链表
                        if ((e.hash & oldCap) == 0) {
                            //指针loHead指向链表头节点，指针loTail指向链表尾节点
                            if (loTail == null)
                                loHead = e;
                            else
                                loTail.next = e;
                            loTail = e;
                        }
                        else {//&运算之后不等于0
                            //指针hiHead指向链表头节点，指针hiTail指向链表尾节点
                            if (hiTail == null)
                                hiHead = e;
                            else
                                hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
					//经过rehash之后，原本一条链表，有可能分裂为两条链表
                    //newTab[j]指向&运算结果为零的链表
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    //newTab[j]指向&运算结果不为零的链表
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

JDK1.8对扩容过程的rehash进行了优化。由于容量size是2的倍数，而且每次扩容都是把旧数组的容量扩大一倍oldCap*2，扩容时rehash算法是 **键值对的哈希值hash 和 旧数组的容量oldCap进行&运算**，所以运算结果要么是零，要么非零。

比较抽象，举个例子比较好理解，假设旧数组容量oldCap=4，键值对key的哈希值hash=3，5如下图

<p><img src="/assets/blogImg/HashMap分析总结_07.png" width="400"></p>

根据运算结果再将原来的链表分为两个新链表，newTab[j]指向运算结果为零的链表，newTab[j+oldCap]指向运算结果非零的链表，如下图

<p><img src="/assets/blogImg/HashMap分析总结_09.png" width="400"></p>

### 2.6.多线程情况下HashMap为什么容易出现死循环

在多线程使用场景中，应该尽量避免使用线程不安全的HashMap，而使用线程安全的ConcurrentHashMap。下面举例子说明在多线程场景中使用HashMap可能造成死循环。

#### JDK1.7

假设我们的hash算法就是简单的用key mod 一下数组的长度。其中的哈希桶数组table的size=4， key = 1，7，15，23。put顺序依次为 7，15，23，1。在mod 4以后都冲突在table[3]这里了。当要插入key=1时触发了扩容条件。

我们在线程一设置断点，如下所示

```java
void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
    for (Entry<K,V> e : table) {
        while(null != e) {
            Entry<K,V> next = e.next;//<--此处设置断点
            if (rehash) {
                e.hash = null == e.key ? 0 : hash(e.key);
            }
            int i = indexFor(e.hash, newCapacity);
            e.next = newTable[i];
            newTable[i] = e;
            e = next;
        }
    }
}
```

让线程二完成rehash的过程，可以得到下图的状态。**需要注意线程一的局部变量指针e指向了key=7和局部变量指针next指向了key=15**

<p><img src="/assets/blogImg/HashMap分析总结_10.png" width="400"></p>

执行完线程二的rehash过程之后，接着执行线程一

```java
e.next = newTable[i];//原来的newTable[7]=null，e指向key=7，执行这步使key=7的next指向了null
newTable[i] = e;//使newTable[7]指向了key=7
e = next;//使e指向了key=15
```

<p><img src="/assets/blogImg/HashMap分析总结_11.png" width="400"></p>

线程一继续执行

```java
next = e.next;//使next指向了key=7
e.next = newTable[i];//原来的newTable[7]指向了key=7，e指向key=15，执行这步使key=15的next指向key=7
newTable[i] = e;//使newTable[7]指向了key=15
e = next;//使e指向了key=7
```

<p><img src="/assets/blogImg/HashMap分析总结_12.png" width="400"></p>

线程一继续执行

```java
next = e.next;//使next指向了null
e.next = newTable[i];//原来的newTable[7]指向了key=15，e指向key=7，执行这步使key=7指向key=15
newTable[i] = e;//使newTable[7]指向了key=7
e = next;//使e指向了null
//由于e=null所以没有下一轮循环
```

<p><img src="/assets/blogImg/HashMap分析总结_13.png" width="400"></p>

此时出现了一个环形链表，如果我们执行HashMap的get(31)，程序就会死循环。

### 2.7.HashMap的容量为什么一定是2的n次方

在HashMap中，哈希桶数组table的长度length大小必须为2的n次方，这是一种非常规的设计，常规的设计是把桶的大小设计为素数（也叫质数）。相对来说素数导致冲突的概率要小于合数（除了2以外的所有偶数都是合数）。HashMap采用这种非常规设计，主要基于两个原因：

1）取模算法，(n - 1) & hash直接&运算就可以算出键值对的哈希桶位置，比起%取模运算效率要高；

2）JDK1.8扩容时rehash算法，不太好描述清楚，直接看扩容过程分析JDK1.8部分的介绍。

### 2.8.HashMap和Hashtable的区别

1）HashMap线程不安全（多线程场景容易出现死循环），Hashtable通过synchronized实现了线程安全；

2）HashMap的key，value可以为null，Hashtable的key，value不可以为null；

3）HashMap默认初始容量为16，且容量一定是2的整数次幂，且每次扩容都是容量 * 2；Hashtable默认容量为11，且每次扩容都是容量 * 2 + 1；

4）继承的父类不同；

5）Hashtable继承自Dictionary类，而HashMap继承自AbstractMap类。但二者都实现了Map接口；

6）HashMap把Hashtable的contains方法去掉了，改成containsValue和containsKey，因为contains方法容易让人引起误解；Hashtable则保留了contains，containsValue和containsKey三个方法，其中contains和containsValue功能相同；

7）Hashtable、HashMap都使用了 Iterator。而由于历史原因，Hashtable还使用了Enumeration的方式 ；

8）哈希值的使用不同，HashTable直接使用对象的hashCode。而HashMap重新计算hash值。

Collections.synchronizedMap

## 3.引用

https://tech.meituan.com/2016/06/24/java-hashmap.html

https://blog.csdn.net/xuefeng0707/article/details/40797085

https://coolshell.cn/articles/9606.html

https://www.cnblogs.com/williamjie/p/9099141.html