---
title: http详解
date: 2020-08-15 02:38:58
tags: 
- http
- https
categories: 网络相关
---

## http

### http报文

用于http协议交互的信息被称为**http报文**。客户端的http报文叫做**请求报文**，服务器的http报文叫做**响应报文**。http报文本身是由**多行数据**构成的**字符串文本**。

请求报文结构，如下图所示

<p><img src="/assets/blogImg/http详解_01.png" width="500"></p>

响应报文结构，如下图所示

<p><img src="/assets/blogImg/http详解_02.png" width="500"></p>

### http状态码

**状态码**的职责是当客户端向服务器发送请求时，描述返回的请求结果。借助状态码，用户可以知道服务器端是否正常处理了请求，还是出现了错误。

状态码可以分为5类，如下表

|      | 类别                             | 原因短语                   | 说明                                                         |
| ---- | -------------------------------- | -------------------------- | ------------------------------------------------------------ |
| 1XX  | Informational（信息性状态码）    | 接收的请求正在处理         | 这类响应是临时响应，只包含状态行和某些可选的响应头信息，并以空行结束 |
| 2XX  | Success（成功状态码）            | 请求正常处理完毕           | 表明请求被正常处理了                                         |
| 3XX  | Redirection（重定向状态码）      | 需要进行附加操作以完成请求 | 这类状态码代表需要客户端采取进一步的操作才能完成请求。通常，这些状态码用来重定向，后续的请求地址（重定向目标）在本次响应的Location域中指明 |
| 4XX  | Client Error（客户端错误状态）   | 服务器无法处理请求         | 表明客户端是发生错误的原因所在                               |
| 5XX  | Server Error（服务器错误状态码） | 服务器处理请求出错         | 表明服务器本身发生错误                                       |

### http缺点

1）通信使用明文（不加密），内容有可能会被**窃听**；

2）不验证通信方的身份，因此有可能遭遇**伪装**；

3）无法证明报文的完整性，所以有可能已遭**篡改**。

### https



## URI和URL

URI（Uniform Resource Identifier）统一资源标识符，是一个紧凑的字符串用来标识抽象或物理资源。

URL（Uniform Resource Locator）统一资源定位符，是URI的子集，除了确定一个资源，还提供一种定位该资源的访问机制。

下面就来看看例子吧，这些例子都是摘自权威的RFC：

- `ftp://ftp.is.co.za/rfc/rfc1808.txt` (also a URL because of the protocol)
- `http://www.ietf.org/rfc/rfc2396.txt` (also a URL because of the protocol)
- `ldap://[2001:db8::7]/c=GB?objectClass?one` (also a URL because of the protocol)
- `mailto:John.Doe@example.com` (also a URL because of the protocol)
- `news:comp.infosystems.www.servers.unix` (also a URL because of the protocol)
- `tel:+1-816-555-1212`
- `telnet://192.0.2.16:80/` (also a URL because of the protocol)
- `urn:oasis:names:specification:docbook:dtd:xml:4.1.2`

这些全都是URI, 其中有些URI同时也是URL。哪些? 就是那些提供了访问机制的。

参考：https://www.cnblogs.com/hust-ghtao/p/4724885.html

## 引用

https://blog.csdn.net/hj7jay/article/details/80221060

https://zhuanlan.zhihu.com/p/27395037