---
title: MySQL之explain详解
date: 2020-08-13 22:52:35
tags: 
- explain
- 执行计划
- MySQL
categories: 数据库相关
---

## 1.什么是执行计划

执行计划，就是 SQL语句在数据库中实际执行的时候，一步步的分别都做了什么。

MySQL提供了explain命令来分析执行计划。explain命令模拟MySQL优化器是如何执行SQL查询语句的，从而知道MySQL是如何处理你的SQL语句的。explian命令可以用来分析你的查询语句或是表结构的性能瓶颈。

<p><img src="/assets/blogImg/MySQL之explain详解_00.png" width="800"></p>

## 2.explain命令的用法

语法：

explain + SQL语句

例如

```mysql
explain select * from user;
```

<p><img src="/assets/blogImg/MySQL之explain详解_01.png" width="600"></p>

下面对返回结果的各个字段进行详细介绍

### 2.1.id字段

id字段是一组数字，代表多个表之间的查询顺序，或者包含子句查询语句中的顺序，id 总共分为三种情况，依次详解

1）id 相同

执行顺序由上至下

<p><img src="/assets/blogImg/MySQL之explain详解_02.png" width="600"></p>

2）id 不同

如果是子查询，id 号会递增，id 值越大优先级越高，越先被执行

<p><img src="/assets/blogImg/MySQL之explain详解_03.png" width="600"></p>

3）id 相同和不同的情况同时存在

id如果相同，可以认为是一组，由上至下顺序执行；在所有组中，id之越大，优先级越高，越先执行

<p><img src="/assets/blogImg/MySQL之explain详解_04.png" width="600"></p>

### 2.2.select_type字段

表示查询中每个select子句的类型，包含以下6种值

1）simple；2）primary；3）subquery；4）derived；5）union；6）union result

#### simple

简单的 select 查询，查询中不包含**子查询**或者**union查询**

<p><img src="/assets/blogImg/MySQL之explain详解_05.png" width="600"></p>

#### primary

如果 SQL 语句中包含任何子查询，那么子查询的最外层会被标记为 primary

<p><img src="/assets/blogImg/MySQL之explain详解_06.png" width="600"></p>

#### subquery

在 select 或者 where 里包含了子查询，那么子查询就会被标记为 subquery

<p><img src="/assets/blogImg/MySQL之explain详解_07.png" width="600"></p>

#### derived

在from中包含的子查询，会被标记为**derived（衍生）**查询，会把查询结果放到一个临时表中

<p><img src="/assets/blogImg/MySQL之explain详解_08.png" width="600"></p>

#### union和union result

如果有两个 select 查询语句，他们之间用 union 连起来查询，那么第二个 select 会被标记为 union，union 的结果被标记为 union result。它的 id 是为 null 的

<p><img src="/assets/blogImg/MySQL之explain详解_09.png" width="600"></p>

### 2.3.table字段

表示这一行的数据是哪张表的数据

### 2.4.partitions字段

### 2.5.type字段

表示MySQL在表中找到所需行的方式，又称“访问类型”，有如下7种：

system > const > eq_ref > ref > range > index > all

从左到右，由好到坏，一般来说，好的SQL查询至少达到range级别，最好能达到ref。

#### system

表中只有一行记录，system 是 const 的特例，几乎不会出现这种情况，可以忽略不计

#### const

将主键索引或者唯一索引放到 where 条件中查询，MySQL 可以将查询条件转变成一个常量，只匹配一行数据，索引一次就找到数据了

<p><img src="/assets/blogImg/MySQL之explain详解_10.png" width="600"></p>

#### eq_ref

在多表查询中，如 T1 和 T2，T1 中的一行记录，在 T2 中也只能找到唯一的一行，说白了就是 T1 和 T2 关联查询的条件都是主键索引或者唯一索引，这样才能保证 T1 每一行记录只对应 T2 的一行记录

<p><img src="/assets/blogImg/MySQL之explain详解_11.png" width="600"></p>

#### ref

不是主键索引，也不是唯一索引，就是普通的索引，可能会返回多个符合条件的行

<p><img src="/assets/blogImg/MySQL之explain详解_12.png" width="600"></p>

#### range

体现在对某个索引进行区间范围检索，一般出现在 where 条件中的 between...and、<、>、in 等范围查找中

<p><img src="/assets/blogImg/MySQL之explain详解_13.png" width="600"></p>

#### index

将所有的索引树都遍历一遍，查找到符合条件的行。索引文件比数据文件还是要小很多，所以比不用索引全表扫描还是要快很多

#### all

没用到索引，单纯的将表数据全部都遍历一遍，查找到符合条件的数据

### 2.6.possible_keys字段

此次查询中涉及字段上若存在索引，则会被列出来，表示可能会用到的索引，但并不是实际上一定会用到的索引

### 2.7.key字段

此次查询中实际上用到的索引

### 2.8.key_len字段

表示索引中使用的字节数，通过该属性可以知道在查询中使用的索引长度，注意：这个长度是最大可能长度，并非实际使用长度，**在不损失精确性的情况下，长度越短查询效率越高**

### 2.9.ref字段

显示关联的字段。如果使用常数等值查询，则显示 const，如果是连接查询，则会显示关联的字段。

<p><img src="/assets/blogImg/MySQL之explain详解_14.png" width="900"></p>

1）tb_emp 表为非唯一性索引扫描，实际使用的索引列为 idx_name，由于 tb_emp.name='rose'为一个常量，所以 ref=const。

2）tb_dept 为唯一索引扫描，从 sql 语句可以看出，实际使用了 PRIMARY 主键索引，ref=db01.tb_emp.deptid 表示关联了 db01 数据库中 tb_emp 表的 deptid 字段。

### 2.10.rows字段

根据表信息统计以及索引的使用情况，大致估算说要找到所需记录需要读取的行数，**rows 越小越好**

### 2.11.filtered字段

### 2.12.Extra字段

不适合在其他列显示出来，但在优化时十分重要的信息

#### using fileSort（重点优化）

俗称 " 文件排序 " ，在数据量大的时候几乎是“九死一生”，在 order by 或者在 group by 排序的过程中，order by 的字段不是索引字段，或者 select 查询字段存在不是索引字段，或者 select 查询字段都是索引字段，但是 order by 字段和 select 索引字段的顺序不一致，都会导致 fileSort

<p><img src="/assets/blogImg/MySQL之explain详解_15.png" width="900"></p>

#### using temporary（重点优化）

使用了临时表保存中间结果，常见于 order by 和 group by 中

<p><img src="/assets/blogImg/MySQL之explain详解_16.png" width="600"></p>

#### using index（重点）

表示相应的 select 操作中使用了覆盖索引（Coveing Index）,避免访问了表的数据行，效率不错！如果同时出现 using where，表明索引被用来执行索引键值的查找；如果没有同时出现 using where，表面索引用来读取数据而非执行查找动作。

<p><img src="/assets/blogImg/MySQL之explain详解_17.png" width="600"></p>

#### using where

表明使用了 where 过滤

#### using join buffer

使用了连接缓存

#### impossible where

where 子句的值总是 false，不能用来获取任何元组

#### select tables optimized away

在没有GROUP BY子句的情况下，基于索引优化 MIN/MAX 操作或者对于MyISAM存储引擎优化 COUNT(*)操作，不必等到执行阶段再进行计算， 查询执行计划生成的阶段即完成优化。

#### distinct

优化 distinct，在找到第一匹配的元组后即停止找同样值的工作

## 3.引用

https://mp.weixin.qq.com/s/v1yEYo3E8AT0zB6nGqkYiA

https://www.cnblogs.com/ggjucheng/archive/2012/11/11/2765237.html

https://jingyan.baidu.com/article/f0e83a25fce06462e59101f3.html

https://blog.csdn.net/u013628152/article/details/82184809

https://www.cnblogs.com/clsn/p/8214048.html

