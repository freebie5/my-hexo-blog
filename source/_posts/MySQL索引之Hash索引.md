---
title: MySQL索引之Hash索引
date: 2020-07-21 00:18:03
tags: 
- MySQL
- 哈希索引
- 哈希表
categories: 数据库相关
---

## 1.哈希表

哈希表也叫散列表，利用哈希函数h，根据关键字K计算出哈希值，将关键字映射到哈希表T[0...m-1]的槽位上，如下图所示

<p><img src="/assets/blogImg/MySQL索引之Hash索引_01.png" width="500"></p>

哈希函数h有可能将两个不同的关键字映射到相同的位置，这叫做碰撞，在数据库中一般采用**链接法**来解决。在链接法中，将散列到同一槽位的元素放在一个链表中，如下图所示

<p><img src="/assets/blogImg/MySQL索引之Hash索引_02.png" width="500"></p>

## 2.MySQL哈希索引

MySQL采用除法散列函数，冲突机制采用链接法。

### Tips：

1.MySQL最常用存储引擎 InnoDB和MyISAM 都不支持Hash索引，它们默认的索引都是BTree索引。但是如果你在创建索引的时候定义其类型为 Hash，MySql 并不会报错，而且你通过 SHOW CREATE TABLE 查看该索引也是 Hash，只不过该索引实际上还是 B-Tree。

实验说明：

我们创建一个表test2

```mysql
CREATE TABLE `test2` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8
```

给test2添加一个Hash索引

```mysql
ALTER TABLE test2 ADD INDEX nor_name USING HASH (name);
```

然后查看建表语句

```mysql
show create table test2;
```

```mysql
CREATE TABLE `test2` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nor_name` (`name`) USING HASH
) ENGINE=MyISAM DEFAULT CHARSET=utf8
```

建表语句确实是HASH，但是事实上并不是

```mysql
SHOW INDEXES FROM test2;
```

<p><img src="/assets/blogImg/MySQL索引之Hash索引_03.png" width="1000"></p>

我们查看MySQL官网的存储引擎特性表可以看到InnoDB和MyISAM不支持Hash索引

<p><img src="/assets/blogImg/MySQL索引之Hash索引_04.png" width="700"></p>

虽然常见存储引擎并不支持 Hash 索引，但 InnoDB 有另一种实现方法：自适应哈希索引。InnoDB 存储引擎会监控对表上索引的查找，如果观察到建立哈希索引可以带来速度的提升，则建立哈希索引。

<p><img src="/assets/blogImg/MySQL索引之Hash索引_05.png" width="1000"></p>

## 3.哈希索引对比BTree索引

Hash索引结构的特殊性，其检索效率非常高，索引的检索可以一次定位，不像B-Tree索引需要从根节点到枝节点，最后才能访问到页节点这样多次的IO访问，所以Hash索引的查询效率要远高于B-Tree索引。

虽然Hash索引效率高，但是Hash索引本身由于其特殊性也带来了很多限制和弊端，主要有以下这些：

### 1.Hash索引仅仅能满足"=","IN"和"<=>"查询，不能使用范围查询。

哈希索引只支持等值比较查询，包括**＝、 IN 、<=>** (注意<>和＜＝＞是不同的操作）。 也不支持任何范围查询，例如WHERE price > 100。由于Hash索引比较的是进行Hash运算之后的Hash值，所以它只能用于等值的过滤，不能用于基于范围的过滤，**因为经过相应的Hash算法处理之后的Hash值的大小关系，并不能保证和Hash运算前完全一样。**

### 2.Hash索引无法被用来避免数据的排序操作
由于Hash索引中存放的是经过Hash计算之后的Hash值，**而且Hash值的大小关系并不一定和Hash运算前的键值完全一样**，所以数据库无法利用索引的数据来避免任何排序运算;

### 3.Hash索引不能利用部分索引键查询
对于组合索引，**Hash索引在计算Hash值的时候是组合索引键合并后再一起计算Hash值，而不是单独计算Hash值**，所以通过组合索引的前面一个或几个索引键进行查询的时候，Hash索引也无法被利用。

### 4.Hash索引在任何时候都不能避免表扫描
前面已经知道，**Hash索引是将索引键通过Hash运算之后，将 Hash运算结果的Hash值和所对应的行指针信息存放于一个Hash表中**，由于不同索引键存在相同Hash值，所以即使取满足某个Hash键值的数据的记录条数，也无法从Hash索引中直接完成查询，还是要通过访问表中的实际数据进行相应的比较，并得到相应的结果。

 ### 5.**Hash索引遇到大量Hash值相等的情况后性能并不一定就会比BTree索引高**
对于选择性比较低的索引键，如果创建Hash索引，那么将会存在大量记录指针信息存于同一个Hash值相关联。这样要定位某一条记录时就会非常麻烦，会浪费多次表数据的访问，而造成整体性能低下。

## 4.引用

https://www.cnblogs.com/igoodful/p/9361500.html

https://blog.csdn.net/hgguhff/article/details/84094166