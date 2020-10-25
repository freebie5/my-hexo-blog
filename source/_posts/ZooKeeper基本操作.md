---
title: ZooKeeper基本操作
date: 2020-10-25 03:04:35
tags: 
- ZooKeeper
categories: 分布式相关
---

## ZooKeeper客户端连接服务

```
bin/zkCli.sh
```

## ZooKeeper命令行操作

### 基本命令

```
查看子节点
[zk: localhost:2181(CONNECTED) 11] ls /
[sy, zookeeper]


查看子节点和该节点详细信息（弃用，不建议使用）
[zk: localhost:2181(CONNECTED) 0] ls2 /
'ls2' has been deprecated. Please use 'ls [-s] path' instead.
[zookeeper, sy]
cZxid = 0x0
ctime = Wed Dec 31 19:00:00 EST 1969
mZxid = 0x0
mtime = Wed Dec 31 19:00:00 EST 1969
pZxid = 0x2
cversion = 0
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 0
numChildren = 2


查看该节点详细信息
[zk: localhost:2181(CONNECTED) 1] stat /
cZxid = 0x0
ctime = Wed Dec 31 19:00:00 EST 1969
mZxid = 0x0
mtime = Wed Dec 31 19:00:00 EST 1969
pZxid = 0x2
cversion = 0
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 0
numChildren = 2


获取该节点数据
[zk: localhost:2181(CONNECTED) 3] get /sy
hellosy


默认创建节点（默认创建持久节点）
[zk: localhost:2181(CONNECTED) 4] create /sy/123 123
Created /sy/123


创建一个临时节点
[zk: localhost:2181(CONNECTED) 6] create -e /sy/temp tempDir
Created /sy/temp


创建一个顺序节点
[zk: localhost:2181(CONNECTED) 8] create -s /sy/shunxun
Created /sy/shunxun0000000006


设置节点数据（利用节点 dataVersion数据版本号 可以实现乐观锁），1即为数据版本号
[zk: localhost:2181(CONNECTED) 11] set /sy/123 123 1


删除节点
[zk: localhost:2181(CONNECTED) 0] delete /sy/987
非空节点不能删除
[zk: localhost:2181(CONNECTED) 26] delete /sy/987/654
Node not empty: /sy/987
```

### watch相关命令

```
设置节点watch
[zk: localhost:2181(CONNECTED) 3] get -w /sy/123
123
[zk: localhost:2181(CONNECTED) 6] ls -w /sy/123
[456]
```

### ACL相关命令

```
获取节点ACL信息
[zk: localhost:2181(CONNECTED) 21] getAcl /sy/123
'world,'anyone
: cdrwa


设置节点ACL信息，如下例子，赋予节点/sy/123任何人创建子节点，读取节点/子节点，设置节点数据，设置权限
[zk: localhost:2181(CONNECTED) 22] setAcl /sy/123 world:anyone:crwa
由于节点/sy/123没有 删除子节点 的权限，所以执行delete命令无效
[zk: localhost:2181(CONNECTED) 25] delete /sy/123/456
Authentication is not valid : /sy/123/456


如果未登录，设置不了auth
[zk: localhost:2181(CONNECTED) 38] setAcl /qx/123 auth:sy:sy:cdwra
Acl is not valid : /qx/123
注册用户
addauth digest sy:sy
再次设置auth，成功
[zk: localhost:2181(CONNECTED) 40] setAcl /qx/123 auth:sy:sy:cdwra
[zk: localhost:2181(CONNECTED) 43] getAcl /qx/123
'digest,'sy:7DGazlly+WadTwvRTwi7gDi2ko0=
: cdrwa


使用sy用户设置digest
[zk: localhost:2181(CONNECTED) 5] setAcl /qx/abc digest:sy:7DGazlly+WadTwvRTwi7gDi2ko0=:cwra
如果未登录，查看不了acl
[zk: localhost:2181(CONNECTED) 6] getAcl /qx/abc
Authentication is not valid : /qx/abc
登录后可以查看acl
[zk: localhost:2181(CONNECTED) 7] addauth digest sy:sy
[zk: localhost:2181(CONNECTED) 8] getAcl /qx/abc
'digest,'sy:7DGazlly+WadTwvRTwi7gDi2ko0=
: crwa


设置ip方式的acl
[zk: localhost:2181(CONNECTED) 14] setAcl /qx/ip ip:192.168.1.103:cdwra
[zk: localhost:2181(CONNECTED) 15] get /qx/ip
org.apache.zookeeper.KeeperException$NoAuthException: KeeperErrorCode = NoAuth for /qx/ip


设置super方式的acl
修改zkServer.sh增加管理员
vi bin/zkServer.sh
修改内容如下：
nohup "$JAVA" $ZOO_DATADIR_AUTOCREATE "-Dzookeeper.log.dir=${ZOO_LOG_DIR}" \
    "-Dzookeeper.DigestAuthenticationProvider.superDigest=sy:7DGazlly+WadTwvRTwi7gDi2ko0=" \
    "-Dzookeeper.log.file=${ZOO_LOG_FILE}" "-Dzookeeper.root.logger=${ZOO_LOG4J_PROP}" \
    -XX:+HeapDumpOnOutOfMemoryError -XX:OnOutOfMemoryError='kill -9 %p' \
    -cp "$CLASSPATH" $JVMFLAGS $ZOOMAIN "$ZOOCFG" > "$_ZOO_DAEMON_OUT" 2>&1 < /dev/null &
重启zkServer.sh

如果你未登录，又忘记账号和密码
[zk: localhost:2181(CONNECTED) 0] get /qx/abc
org.apache.zookeeper.KeeperException$NoAuthException: KeeperErrorCode = NoAuth for /qx/abc
那么可以使用super账户进行登录
[zk: localhost:2181(CONNECTED) 4] addauth digest sy:sy
[zk: localhost:2181(CONNECTED) 8] get /qx/abc
kkkk
```

### 四字命令

如果没有nc命令，需要首先安装

```
yum install nc
```

执行四字命令

```
[root@localhost apache-zookeeper-3.5.7-bin]# echo stat | nc localhost 2181
stat is not executed because it is not in the whitelist.
```

如果提示没有在白名单里边，则修改zoo.cfg配置文件，添加以下内容：

```
4lw.commands.whitelist=*
```

添加完成之后需要重启

```
[root@localhost apache-zookeeper-3.5.7-bin]# bin/zkServer.sh restart
ZooKeeper JMX enabled by default
Using config: /opt/apache-zookeeper-3.5.7-bin/bin/../conf/zoo.cfg
ZooKeeper JMX enabled by default
Using config: /opt/apache-zookeeper-3.5.7-bin/bin/../conf/zoo.cfg
Stopping zookeeper ... STOPPED
ZooKeeper JMX enabled by default
Using config: /opt/apache-zookeeper-3.5.7-bin/bin/../conf/zoo.cfg
Starting zookeeper ... STARTED
```

常用四字命令

```
stat查看ZooKeeper状态信息，是否mode
[root@localhost apache-zookeeper-3.5.7-bin]# echo stat | nc 192.168.1.151 2181
Zookeeper version: 3.5.7-f0fdd52973d373ffd9c86b81d99842dc2c7f660e, built on 02/10/2020 11:30 GMT
Clients:
 /0:0:0:0:0:0:0:1:48914[1](queued=0,recved=3,sent=3)
 /192.168.1.151:53400[0](queued=0,recved=1,sent=0)

Latency min/avg/max: 0/1/2
Received: 4
Sent: 3
Connections: 2
Outstanding: 0
Zxid: 0x31
Mode: standalone
Node count: 16


ruok查看当前ZooKeeper是否启动，返回imok
[root@localhost apache-zookeeper-3.5.7-bin]# echo ruok | nc 192.168.1.151 2181
imok


dump列出未经处理的会话和临时节点
[root@localhost apache-zookeeper-3.5.7-bin]# echo dump | nc 192.168.1.151 2181
SessionTracker dump:
Session Sets (7)/(2):
0 expire at Fri May 01 08:11:58 EDT 2020:
0 expire at Fri May 01 08:12:00 EDT 2020:
0 expire at Fri May 01 08:12:08 EDT 2020:
0 expire at Fri May 01 08:12:10 EDT 2020:
0 expire at Fri May 01 08:12:16 EDT 2020:
1 expire at Fri May 01 08:12:18 EDT 2020:
	0x100013d30cd0000
1 expire at Fri May 01 08:12:20 EDT 2020:
	0x100000036070004
ephemeral nodes dump:
Sessions with Ephemerals (1):
0x100013d30cd0000:
	/temp
Connections dump:
Connections Sets (3)/(3):
0 expire at Fri May 01 08:12:00 EDT 2020:
1 expire at Fri May 01 08:12:10 EDT 2020:
	ip: /192.168.1.151:53408 sessionId: 0x0
2 expire at Fri May 01 08:12:20 EDT 2020:
	ip: /127.0.0.1:55996 sessionId: 0x100013d30cd0000
	ip: /0:0:0:0:0:0:0:1:48914 sessionId: 0x100000036070004


conf查看服务器配置
[root@localhost apache-zookeeper-3.5.7-bin]# echo conf | nc 192.168.1.151 2181
clientPort=2181
secureClientPort=-1
dataDir=/opt/apache-zookeeper-3.5.7-bin/dataDir/version-2
dataDirSize=268435520
dataLogDir=/opt/apache-zookeeper-3.5.7-bin/dataLogDir/version-2
dataLogSize=4368
tickTime=2000
maxClientCnxns=60
minSessionTimeout=4000
maxSessionTimeout=40000
serverId=0


cons展示连接到服务器的客户端信息
[root@localhost apache-zookeeper-3.5.7-bin]# echo cons | nc 192.168.1.151 2181
 /127.0.0.1:55996[1](queued=0,recved=26,sent=26,sid=0x100013d30cd0000,lop=PING,est=1588335083634,to=30000,lcxid=0x3,lzxid=0x33,lresp=21286878,llat=0,minlat=0,avglat=1,maxlat=7)
 /0:0:0:0:0:0:0:1:48914[1](queued=0,recved=51,sent=51,sid=0x100000036070004,lop=PING,est=1588334818891,to=30000,lcxid=0x0,lzxid=0x33,lresp=21288503,llat=0,minlat=0,avglat=0,maxlat=2)
 /192.168.1.151:53412[0](queued=0,recved=1,sent=0)


envi环境变量
[root@localhost apache-zookeeper-3.5.7-bin]# echo envi | nc 192.168.1.151 2181
Environment:
zookeeper.version=3.5.7-f0fdd52973d373ffd9c86b81d99842dc2c7f660e, built on 02/10/2020 11:30 GMT
host.name=localhost
java.version=13.0.1
java.vendor=Oracle Corporation
java.home=/usr/java/jdk-13.0.1
java.class.path=/opt/apache-zookeeper-3.5.7-bin/bin/../zookeeper-server/target/classes:/opt/apache-zookeeper-3.5.7-bin/bin/../build/classes:/opt/apache-zookeeper-3.5.7-bin/bin/../zookeeper-server/target/lib/*.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../build/lib/*.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/zookeeper-jute-3.5.7.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/zookeeper-3.5.7.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/slf4j-log4j12-1.7.25.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/slf4j-api-1.7.25.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-transport-native-unix-common-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-transport-native-epoll-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-transport-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-resolver-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-handler-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-common-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-codec-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/netty-buffer-4.1.45.Final.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/log4j-1.2.17.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/json-simple-1.1.1.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jline-2.11.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jetty-util-9.4.24.v20191120.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jetty-servlet-9.4.24.v20191120.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jetty-server-9.4.24.v20191120.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jetty-security-9.4.24.v20191120.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jetty-io-9.4.24.v20191120.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jetty-http-9.4.24.v20191120.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/javax.servlet-api-3.1.0.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jackson-databind-2.9.10.2.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jackson-core-2.9.10.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/jackson-annotations-2.9.10.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/commons-cli-1.2.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../lib/audience-annotations-0.5.0.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../zookeeper-*.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../zookeeper-server/src/main/resources/lib/*.jar:/opt/apache-zookeeper-3.5.7-bin/bin/../conf:
java.library.path=/usr/java/packages/lib:/usr/lib64:/lib64:/lib:/usr/lib
java.io.tmpdir=/tmp
java.compiler=<NA>
os.name=Linux
os.arch=amd64
os.version=3.10.0-957.el7.x86_64
user.name=root
user.home=/root
user.dir=/opt/apache-zookeeper-3.5.7-bin
os.memory.free=19MB
os.memory.max=966MB
os.memory.total=29MB


mntr监控ZooKeeper健康信息
[root@localhost apache-zookeeper-3.5.7-bin]# echo mntr | nc 192.168.1.151 2181
zk_version	3.5.7-f0fdd52973d373ffd9c86b81d99842dc2c7f660e, built on 02/10/2020 11:30 GMT
zk_avg_latency	0
zk_max_latency	7
zk_min_latency	0
zk_packets_received	113
zk_packets_sent	112
zk_num_alive_connections	3
zk_outstanding_requests	0
zk_server_state	standalone
zk_znode_count	17
zk_watch_count	0
zk_ephemerals_count	1
zk_approximate_data_size	172
zk_open_file_descriptor_count	50
zk_max_file_descriptor_count	4096


wchs展示watch信息
[root@localhost apache-zookeeper-3.5.7-bin]# echo wchs | nc 192.168.1.151 2181
0 connections watching 0 paths
Total watches:0
```

