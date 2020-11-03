---
title: CentOS7安装MySQL
date: 2020-10-26 23:19:07
tags: 
- 安装
- MySQL
categories: Linux相关
---

## 下载

官网：https://downloads.mysql.com/archives/community/

## 安装

### 解压，重命名，并移动

```shell
tar -zxf mysql-5.7.28-linux-glibc2.12-x86_64.tar.gz
mv mysql-5.7.28-linux-glibc2.12-x86_64 mysql
mv mysql /usr/local/
```

### 新建data目录，添加用户组与用户，修改目录权限

```shell
cd /usr/local/mysql
mkdir data
groupadd mysql
//-r 建立系统帐号
//-g<群组> 指定用户所属的群组
useradd -r -g mysql mysql

chown -R mysql:mysql /usr/local/mysql
```

### 安装

```shell
./bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql/ --datadir=/usr/local/mysql/data/
```

成功的话，显示如下内容：

```shell
2020-10-29T14:37:35.493881Z 0 [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
2020-10-29T14:37:35.618572Z 0 [Warning] InnoDB: New log files created, LSN=45790
2020-10-29T14:37:35.642787Z 0 [Warning] InnoDB: Creating foreign key constraint system tables.
2020-10-29T14:37:35.697617Z 0 [Warning] No existing UUID has been found, so we assume that this is the first time that this server has been started. Generating a new UUID: 4946138d-19f4-11eb-b954-000c2984a8f1.
2020-10-29T14:37:35.698411Z 0 [Warning] Gtid table is not ready to be used. Table 'mysql.gtid_executed' cannot be opened.
2020-10-29T14:37:36.151055Z 0 [Warning] CA certificate ca.pem is self signed.
2020-10-29T14:37:36.220758Z 1 [Note] A temporary password is generated for root@localhost: rS+Yd))GM4wP
```

注意最后一行：**A temporary password is generated for root@localhost: rS+Yd))GM4wP**

由此可知root用户的初始化密码为：rS+Yd))GM4wP

### 修改my.cnf文件

安装完后，会在/etc文件夹下生成my.cnf文件，需要修改几个配置项：datadir，socket，log-error，pid-file

```shell
vi /etc/my.cnf
```

原文件内容

```shell
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
# Disabling symbolic-links is recommended to prevent assorted security risks
symbolic-links=0
# Settings user and group are ignored when systemd is used.
# If you need to run mysqld under a different user or group,
# customize your systemd unit file for mariadb according to the
# instructions in http://fedoraproject.org/wiki/Systemd

[mysqld_safe]
log-error=/var/log/mariadb/mariadb.log
pid-file=/var/run/mariadb/mariadb.pid

#
# include all files from the config directory
#
!includedir /etc/my.cnf.d
```

修改后

```shell
[mysqld]
datadir=/usr/local/mysql/data
socket=/tmp/mysql.sock
port=3306
# Disabling symbolic-links is recommended to prevent assorted security risks
symbolic-links=0
# Settings user and group are ignored when systemd is used.
# If you need to run mysqld under a different user or group,
# customize your systemd unit file for mariadb according to the
# instructions in http://fedoraproject.org/wiki/Systemd

[mysqld_safe]
log-error=/usr/local/mysql/log/mariadb/mariadb.log
pid-file=/usr/local/mysql/run/mysql.pid
user=mysql
#
# include all files from the config directory
#
!includedir /etc/my.cnf.d
```

创建/usr/local/mysql/log/mariadb/mariadb.log文件

```shell
mkdir log
cd log
mkdir mariadb
cd mariadb
touch mariadb.log
```

### 拷贝启动脚本

```shell
cp /usr/local/mysql/support-files/mysql.server /etc/init.d/mysqld
```

### 启动mysql服务

```shell
service mysqld start
```

查看是否有mysqld进程

```shell
ps -ef | grep mysql
```

### 配置环境变量，编辑/etc/profile，方便在任何地方用mysql命令

```shell
vi /etc/profile
```

添加如下内容：

```shell
#mysql
export MYSQL_HOME=/usr/local/mysql
export PATH=$PATH:$MYSQL_HOME/bin
```

刷新

```shell
source /etc/profile
```

### 登录mysql，修改密码

```shell
mysql -uroot -p
alter user 'root'@'localhost' identified by '123456';
flush privileges;
```

### 若是想让其他机器访问，需要配置远程访问

记得打开端口3306

```shell
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;
```

### 几个常用命令

```shell
service mysqld start 　　　 #启动
service mysqld stop        #关闭 　　　
service mysqld restart　　  #重启 　　　
service mysqld status 　　  #查看运行状态 
```

## 配置开机启动

```shell
systemctl enable mysqld
systemctl start mysqld
```

## 主从配置

### master的配置

创建一个数据库testreplica和一个数据表test01用于主从复制

创建一个用户给**从库**用来同步数据

```mysql
GRANT REPLICATION SLAVE,FILE ON *.* TO 'mstest'@'%' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
select user,host from mysql.user;
```

修改my.cnf配置文件

```shell
server-id=1
binlog-do-db=testreplica
#这个是需要同步的数据库 ，master是一个数据库，自行先创建
```

检查主库状态

```mysql
show variables like 'log-bin%';
show master status;
```

<p><img src="/assets/blogImg/CentOS7安装MySQL_01.png" width="800"></p>

可以看到log_bin=ON，即配置成功

### slave的配置

开启主从复制前需要拷贝主库的数据库和数据表到从库

修改my.cnf配置文件

```shell
server-id=2
replicate-do-db=testreplica
#replicate-do-db：要同步的mstest数据库,要同步多个数据库，就多加几个replicate-db-db=数据库名
```

配置主从关系

```mysql
change master to master_host='192.168.1.191', master_user='mstest', master_password='123456',master_log_file='mysql-bin.000001', master_log_pos=154;

start slave;
```

检查从库状态

```mysql
show slave status;
```

如果Slave_IO_Running和Slave_SQL_Running都是Yes，则配置成功了。如果其中一个为No，则查看Last_Error的具体失败原因

<p><img src="/assets/blogImg/CentOS7安装MySQL_02.png" width="2000"></p>

### 错误解决

在搭建Mysql主从复制时候，在执行完相关操作以后，通过命令查看是否主从复制成功的时候

show slave status;

在“Slave_SQL_Running_State”中出现了“Fatal error: The slave I/O thread stopsbecause master and slave have equal MySQL server UUIDs; these UUIDs must bedifferent for replication to work.”这个错误。
当时以为是主节点服务器的UUID和从节点服务器网卡的UUID重复了，经过查看，发现他们并没有重复，然后重启服务器以后发现仍然没有成功。有点摸不着头脑。
通过上网搜索。发现原来是Mysql的一个配置文件auto.cnf里面记录了mysql服务器的uuid。

server_uuid:服务器身份ID。在第一次启动Mysql时，会自动生成一个server_uuid并写入到数据目录下auto.cnf文件里。

原来是这个uuid和主服务器的uuid重复了。（我是虚拟机环境,为了方便,先装好一台,并且装好MySQL，然后通过colone的方式复制出另外一台），然后经过修改auto.cnf文件中的server-uuid，重启mysql服务器，再查看mysql从节点的状态，恢复正常。

## 引用



https://www.cnblogs.com/qixing/p/12271499.html

错误解决

https://www.cnblogs.com/chinesern/p/7698424.html