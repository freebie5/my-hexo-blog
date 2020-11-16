---
title: SQL优化
date: 2020-10-26 23:34:44
tags: 
- SQL优化
categories: 数据库相关
---

## SQL优化

*1）对查询进行优化，要尽量避免全表扫描，首先应考虑在 where 及 order by 涉及的列上建立索引

2）应尽量避免在 where 子句中对字段进行 null 值判断，否则将导致引擎放弃使用索引而进行全表扫描

```mysql
select name from user where name is null;
```

*3）应尽量避免在 where 子句中使用 != 或 <> 操作符，否则将引擎放弃使用索引而进行全表扫描

```mysql
select name from user where name = '尹堞';
select name from user where name != '尹堞';
```

*4）应尽量避免在 where 子句中使用 or 来连接条件，如果一个字段有索引，一个字段没有索引，将导致引擎放弃使用索引而进行全表扫描

```mysql
select name from user where name = '尹堞';
select name from user where name = '尹堞' or age=55;
```

可以改成如下这样，这样name的索引生效了，虽然age没有建立索引还是查询比较慢

```mysql
select name from user where name = '尹堞'
union all
select name from user where age=55;
```

5）in 和 not in 也要慎用，否则会导致全表扫描

```mysql
select age from user where age in(11,12,13);
```

对于连续的数值，能用 between 就不要用 in 了

```mysql
select age from user where age btween 11 and 13;
```

*6）下面的查询也将导致全表扫描

```mysql
select * from user where name like '%尹堞%';
```

若要使name的索引生效，可以使用索引覆盖（即指定查询的列name）

```mysql
select name from user where name like '%尹堞%';
```

*7）应尽量避免在where子句中对字段进行函数操作，这将导致引擎放弃使用索引而进行全表扫描

```mysql
select * from user where length(name) =6;
```

*8）不要在 where 子句中的“=”左边进行函数、算术运算或其他表达式运算，否则系统将可能无法正确使用索引

*9）在使用索引字段作为条件时，如果该索引是复合索引，那么必须使用到该索引中的第一个字段作为条件时才能保证系统使用该索引，否则该索引将不会被使用，并且应尽可能的让字段顺序与索引顺序相一致。

```mysql
//phone和age建立索引，phone为第一个列，age为第二列
select * from user where age=27;
select * from user where phone='15742910171' and age=27;
select * from user where phone='15742910171';
```

*10）Update 语句，如果只更改1、2个字段，不要Update全部字段，否则频繁调用会引起明显的性能消耗，同时带来大量日志

*11）对于多张大数据量（这里几百条就算大了）的表JOIN，要先分页再JOIN，否则逻辑读会很高，性能很差

12）select count(*) from table；这样不带任何条件的count会引起全表扫描，并且没有任何业务意义，是一定要杜绝的

*13）索引并不是越多越好，索引固然可以提高相应的 select 的效率，但同时也降低了 insert 及 update 的效率，因为 insert 或 update 时有可能会重建索引，所以怎样建索引需要慎重考虑，视具体情况而定。一个表的索引数最好不要超过6个，若太多则应考虑一些不常使用到的列上建的索引是否有必要

*14）尽量使用数字型字段，若只含数值信息的字段尽量不要设计为字符型，这会降低查询和连接的性能，并会增加存储开销。这是因为引擎在处理查询和连 接时会逐个比较字符串中每一个字符，而对于数字型而言只需要比较一次就够了

*15）尽可能的使用 varchar/nvarchar 代替 char/nchar ，因为首先变长字段存储空间小，可以节省存储空间，其次对于查询来说，在一个相对较小的字段内搜索效率显然要高些

*16）任何地方都不要使用 select * from t ，用具体的字段列表代替“*”，不要返回用不到的任何字段

*17）尽量避免大事务操作，提高系统并发能力

*18）尽量避免向客户端返回大数据量，若数据量过大，应该考虑相应需求是否合理

## 引用

https://www.cnblogs.com/yunfeifei/p/3850440.html

