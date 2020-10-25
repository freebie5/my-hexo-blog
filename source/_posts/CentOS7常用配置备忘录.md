---
title: CentOS7常用配置备忘录
date: 2020-10-24 17:05:34
tags: 
- linux
- CentOS7
categories: Linux相关
---

## 常用配置

### 1.配置静态IP

#### 1.1.修改配置文件

修改如下内容：

bootproto=static

onboot=yes

在最后加上几行，IP地址、子网掩码、网关、dns服务器

```shell
vi /etc/sysconfig/network-scripts/ifcfg-ens33

内容如下
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=74f945f7-aed0-4dd8-94fa-e2949cbec0ca
DEVICE=ens33
ONBOOT=yes
IPADDR=192.168.1.183
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
ZONE=public
```

#### 1.2.重启网络

```shell
systemctl restart network
```

### 2.配置动态IP

#### 2.1.修改配置文件

修改如下两个配置：

bootproto=dhcp

onboot=yes

```shell
vi /etc/sysconfig/network-scripts/ifcfg-ens33

内容如下
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=dhcp
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=74f945f7-aed0-4dd8-94fa-e2949cbec0ca
DEVICE=ens33
ONBOOT=yes
```

#### 2.2.重启网络

```shell
systemctl restart network
```

### 3.配置防火墙端口

#### 3.1.查看已经开启的端口

```shell
firewall-cmd --list-port
```

#### 3.2.开启端口

```shell
firewall-cmd --permanent --add-port=6378/tcp
```

#### 3.3.关闭端口

```shell
firewall-cmd --permanent --remove-port=6378/tcp
```

#### 3.4.重启防火墙

```shell
systemctl restart firewalld
```
