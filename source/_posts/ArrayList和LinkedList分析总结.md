---
title: ArrayList和LinkedList分析总结
date: 2020-08-18 21:30:54
tags: 
- ArrayList
- LinkedList
categories: Java集合相关
---

## 1.ArrayList

### 数据结构

<p><img src="/assets/blogImg/ArrayList和LinkedList分析总结_01.png" width="500"></p>

#### JDK1.6及之前版本

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{
    
    private transient Object[] elementData;
    
    private int size;
    
    public ArrayList(int initialCapacity) {
		super();
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal Capacity: "+ initialCapacity);
		this.elementData = new Object[initialCapacity];
    }

    public ArrayList() {
		this(10);
    }
    
    //省略其他
    
}
```

查看ArrayList的源码可以知道ArrayList类是通过elementData数组实现，如果不指定初始容量大小，默认数组大小是10。

#### JDK1.7及之后版本

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{

    private static final int DEFAULT_CAPACITY = 10;

    private static final Object[] EMPTY_ELEMENTDATA = {};

    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    transient Object[] elementData; // non-private to simplify nested class access

    private int size;

    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            throw new IllegalArgumentException("Illegal Capacity: "+ initialCapacity);
        }
    }

    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }
}
```

查看ArrayList的源码可以知道ArrayList类是通过elementData数组实现，如果不指定初始容量大小，默认是一个空数组。

### 新增元素到尾端

#### JDK1.6及之前版本

```java
public boolean add(E e) {
	ensureCapacity(size + 1);  // Increments modCount!!
	elementData[size++] = e;
	return true;
}
public void ensureCapacity(int minCapacity) {
	modCount++;
	int oldCapacity = elementData.length;
	if (minCapacity > oldCapacity) {
	    Object oldData[] = elementData;
	    int newCapacity = (oldCapacity * 3)/2 + 1;
    	if (newCapacity < minCapacity)
		    newCapacity = minCapacity;
            // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
	}
}
```

新增元素到末尾，分为2步：

1）通过ensureCapacity方法保证当前elementData数组的大小可以放下新元素，如果容量足够，则不需要扩容；否则，新建一个新数组，新数组大小为旧数组的1.5倍+1；

2）然后，拷贝旧数组的元素到新数组。

#### JDK1.7及之后版本

```java
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    elementData[size++] = e;
    return true;
}
private void ensureCapacityInternal(int minCapacity) {
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    ensureExplicitCapacity(minCapacity);
}
private void ensureExplicitCapacity(int minCapacity) {
    modCount++;
    // overflow-conscious code
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}
private void grow(int minCapacity) {
    // overflow-conscious code
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // minCapacity is usually close to size, so this is a win:
    elementData = Arrays.copyOf(elementData, newCapacity);
}
private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
    return (minCapacity > MAX_ARRAY_SIZE) ? Integer.MAX_VALUE : MAX_ARRAY_SIZE;
}
```

新增元素到末尾，分为2步：

1）通过ensureExplicitCapacity方法判断当前elementData数组的大小是否足够放下新元素，如果容量足够，则不需要扩容；否则，新建一个新的数组，新数组大小为旧数组的1.5倍；

2）然后，拷贝旧数组的元素到新数组。

### 新增元素到任意位置

#### JDK1.6及之前版本

```java
public void add(int index, E element) {
	if (index > size || index < 0)
	    throw new IndexOutOfBoundsException("Index: "+index+", Size: "+size);
	ensureCapacity(size+1);  // Increments modCount!!
	System.arraycopy(elementData, index, elementData, index + 1, size - index);
	elementData[index] = element;
	size++;
}
```

插入元素到任意位置，分为3步：

1）首先判断数组下标是否越界；

2）通过ensureCapacity方法判断是否需要扩容；

3）移动index及之后的元素，然后再插入新元素到index位置；

#### JDK1.7及之后版本

```java
public void add(int index, E element) {
    rangeCheckForAdd(index);

    ensureCapacityInternal(size + 1);  // Increments modCount!!
    System.arraycopy(elementData, index, elementData, index + 1,
                     size - index);
    elementData[index] = element;
    size++;
}
private void rangeCheckForAdd(int index) {
    if (index > size || index < 0)
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}
```

插入元素到任意位置，分为3步：

1）首先通过rangeCheckForAdd方法判断数组下标是否越界；

2）通过ensureCapacityInternal方法判断是否需要扩容；

3）移动index及之后的元素，然后再插入新元素到index位置；

## 2.LinkedList

### 数据结构

<p><img src="/assets/blogImg/ArrayList和LinkedList分析总结_02.png" width="500"></p>

#### JDK1.6及之前版本

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
    private transient Entry<E> header = new Entry<E>(null, null, null);
    
    private transient int size = 0;

    public LinkedList() {
        header.next = header.previous = header;
    }
    
    private static class Entry<E> {
        E element;
        Entry<E> next;
        Entry<E> previous;

        Entry(E element, Entry<E> next, Entry<E> previous) {
            this.element = element;
            this.next = next;
            this.previous = previous;
        }
    }
}
```

查看源码可以知道LinkedList是通过Entry链表实现的，而且是一个**双向链表**；在分析add方法时我们还可以发现这是一个**双向循环链表**；

#### JDK1.7及之后版本

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
    transient int size = 0;

    transient Node<E> first;

    transient Node<E> last;

    public LinkedList() {
    }
    
    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
}
```

查看源码可以知道LinkedList是通过Node链表实现的，而且是一个**双向链表**；

### 新增元素到尾端

#### JDK1.6及之前版本

```java
public boolean add(E e) {
	addBefore(e, header);
        return true;
}
private Entry<E> addBefore(E e, Entry<E> entry) {
	Entry<E> newEntry = new Entry<E>(e, entry, entry.previous);
	newEntry.previous.next = newEntry;
	newEntry.next.previous = newEntry;
	size++;
	modCount++;
	return newEntry;
}
```



#### JDK1.7及之后版本

```java
public boolean add(E e) {
    linkLast(e);
    return true;
}
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}
```



### 新增元素到任意位置

#### JDK1.6及之前版本

```java
public void add(int index, E element) {
    addBefore(element, (index==size ? header : entry(index)));
}
private Entry<E> addBefore(E e, Entry<E> entry) {
	Entry<E> newEntry = new Entry<E>(e, entry, entry.previous);
	newEntry.previous.next = newEntry;
	newEntry.next.previous = newEntry;
	size++;
	modCount++;
	return newEntry;
}
```

#### JDK1.7及之后版本

```java
public void add(int index, E element) {
    checkPositionIndex(index);

    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}
public void add(int index, E element) {
    checkPositionIndex(index);

    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}
void linkBefore(E e, Node<E> succ) {
    // assert succ != null;
    final Node<E> pred = succ.prev;
    final Node<E> newNode = new Node<>(pred, e, succ);
    succ.prev = newNode;
    if (pred == null)
        first = newNode;
    else
        pred.next = newNode;
    size++;
    modCount++;
}
```



## 3.ArrayList对比LinkedList

1）ArrayList通过数组实现，LinkedList通过双向链表实现；

2）ArrayList扩容是新建一个1.5倍的新数组，然后拷贝旧数组的元素到新数组；LinkedList是链表实现的，所以不存在扩容的说法；

3）ArrayList的查找性能好，因为是数组实现的；LinkedList插入或删除元素性能好，因为是链表实现的；

## 4.引用

https://www.cnblogs.com/sierrajuan/p/3639353.html

https://zhuanlan.zhihu.com/p/68478784