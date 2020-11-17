---
title: MySQ中datetime和timestamp使用总结
date: 2020-11-16 11:32:35
tags: 
- MySQL
- datetime
- timestamp
categories: 数据库相关
---

## datetime和timestamp对比

### 相同点

两者都可用来表示YYYY-MM-DD HH:MM:SS[.fraction]类型的日期

### 不同点

1）两者的存储方式不一样

对于timestamp，它把客户端插入的时间从当前时区转化为UTC（世界标准时间）进行存储。查询时，将其又转化为客户端当前时区进行返回。

而对于datetime，不做任何改变，基本上是原样输入和输出。

2）两者所能存储的时间范围不一样

timestamp所能存储的时间范围为：'1970-01-01 00:00:01.000000' 到 '2038-01-19 03:14:07.999999'。

datetime所能存储的时间范围为：'1000-01-01 00:00:00.000000' 到 '9999-12-31 23:59:59.999999'。

## 自动初始化和更新（Automatic Initialization and Updating）

自动初始化指的是如果表字段（timestamp数据类型或datetime数据类型）没有显性赋值，则自动设置为当前系统时间。

```mysql
DEFAULT CURRENT_TIMESTAMP
```

自动更新指的是如果修改了表的其它字段，表的timestamp类型字段或datetime类型字段没有修改，则该字段的值将自动更新为当前系统时间。

```mysql
ON UPDATE CURRENT_TIMESTAMP
```

在使用Navicat工具创建表时，可以指定**默认值**和**根据当前时间戳更新**从而指定。

<p><img src="/assets/blogImg/MySQ中datetime和timestamp使用总结_01.png" width="800"></p>

使用下面的建表语句创建两个表进行测试

```mysql
-- 自动初始化和自动更新
CREATE TABLE `test_time1` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8

-- 没有自动初始化和自动更新
CREATE TABLE `test_time2` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `create_time` timestamp NULL DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

首先测试插入一行数据

```mysql
insert into test_time1(id, name)
value(1,'1');
insert into test_time2(id, name)
value(1,'1');
```

可以看到，表test_time1的create_time字段和update_time没有插入值，但是都有默认值；

表test_time2的create_time字段和update_time没有插入值，内容为null；

然后测试，修改

```mysql
update test_time1
set name='11'
where id=1;
update test_time2
set name='11'
where id=1;
```

可以看到，表test_time1的create_time字段和update_time被修改了；

表test_time2的create_time字段和update_time没有被修改；