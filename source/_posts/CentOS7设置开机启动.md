---
title: CentOS7设置开机启动
date: 2018-02-25 15:22:19
tags: 
- Linux
- CentOS 7
- Shell
categories: Linux相关
---

以Kafka服务开机启动为示例

## 方法一

### 1.在/etc/rc.d/init.d目录下新建开机启动脚本kafka.sh

```
cd /etc/rc.d/init.d
vi kafka.sh
```

脚本内容如下：

```
#!/bin/sh
#chkconfig:2345 80 90
#decription:kafkaAll
source /etc/profile.d/java_env.sh
ti1=`date +%s`
ti2=`date +%s`
i=$(($ti2 - $ti1 ))

while [[ "$i" -ne "10" ]]
do
        ti2=`date +%s`
        i=$(($ti2 - $ti1 ))
done
nohup /opt/kafka_2.13-2.5.0/bin/kafka-server-start.sh config/server.properties &
```

脚本规范说明：

```
#!/bin/sh
#chkconfig:2345 90 10
#decription:kafkaAll
source /etc/profile.d/java_env.sh
```

#!/bin/sh脚本运行必要说明

chkonfig后面是启动级别和优先级

description后面是服务描述

source /etc/profile.d/java_env.sh引入环境变量

CentOS 7下使用chkconfig添加的服务无法使用/etc/profile里面的环境变量

如上面脚本意思是，服务必须在运行级2，3，4，5下被启动或关闭，启动的优先级是90，停止的优先级是10。**优先级范围是0－100，数字越大，优先级越低。**

### 2.赋予执行权限

```
chmod 777 kafka.sh
```

### 3.添加脚本到开机自动启动项目中

```
chkconfig --add kafka.sh
chkconfig kafkaAll.sh on
```

### 4.查看自启动项目列表

```
chkconfig --list
```

### 5.移除自启动项目

```
chkconfig --del kafka.sh
```

## 其他

### Linux启动优先级

运行级别就是操作系统当前正在运行的功能级别。这个级别从0到6 ，具有不同的功能。这些级别在/etc/inittab文件里指定。这个文件是init程序寻找的主要文件，最先运行的服务是那些放在/etc/rc.d 目录下的文件。
不同的运行级定义如下：(可以参考Linux里面的/etc/inittab)

```
# 缺省的运行级，RHS用到的级别如下：
0 关机
1 单用户模式
2 无网络支持的多用户模式
3 有网络支持的多用户模式
4 保留，未使用
5 有网络支持有X-Window支持的多用户模式
6 重新引导系统，即重启

# 对各个运行级的详细解释：
0 为停机，机器关闭。
1 为单用户模式，就像Win9x下的安全模式类似。
2 为多用户模式，但是没有NFS支持。 
3 为完整的多用户模式，是标准的运行级。
4 一般不用，在一些特殊情况下可以用它来做一些事情。例如在笔记本 电脑的电池用尽时，可以切换到这个模式来做一些设置。
5 就是X11，进到X Window系统了。
6 为重启，运行init 6机器就会重启。
```

### CentOS 7下使用chkconfig添加服务无法使用/etc/profile里面的环境变量

/etc/profile为入口的，基本是登录后执行的变量，而使用chkconfig添加的服务多以守护经常运行，没有登录。

CentOS 7下使用chkconfig添加的服务无法使用/etc/profile里面的环境变量，所以要想在chkconfig添加的服务里使用环境变量，只有在服务的脚本中引入变量文件，比如:source /etc/profile，但不建议引入这个文件，直接想要哪个变量引入这里面的个别脚本：/etc/profile.d/xxx.sh