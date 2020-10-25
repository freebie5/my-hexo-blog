---
title: http详解
date: 2020-08-15 02:38:58
tags: 
- http
- https
categories: 网络相关
---

## http报文

用于http协议交互的信息被称为**http报文**。客户端的http报文叫做**请求报文**，服务器的http报文叫做**响应报文**。http报文本身是由**多行数据**构成的**字符串文本**。

请求报文结构，如下图所示

<p><img src="/assets/blogImg/http详解_01.png" width="400"></p>

响应报文结构，如下图所示

<p><img src="/assets/blogImg/http详解_02.png" width="400"></p>

## http状态码

**状态码**的职责是当客户端向服务器发送请求时，描述返回的请求结果。借助状态码，用户可以知道服务器端是否正常处理了请求，还是出现了错误。

状态码可以分为5类，如下表

|      | 类别                             | 原因短语                   | 说明                                                         |
| ---- | -------------------------------- | -------------------------- | ------------------------------------------------------------ |
| 1XX  | Informational（信息性状态码）    | 接收的请求正在处理         | 这类响应是临时响应，只包含状态行和某些可选的响应头信息，并以空行结束 |
| 2XX  | Success（成功状态码）            | 请求正常处理完毕           | 表明请求被正常处理了                                         |
| 3XX  | Redirection（重定向状态码）      | 需要进行附加操作以完成请求 | 这类状态码代表需要客户端采取进一步的操作才能完成请求。通常，这些状态码用来重定向，后续的请求地址（重定向目标）在本次响应的Location域中指明 |
| 4XX  | Client Error（客户端错误状态）   | 服务器无法处理请求         | 表明客户端是发生错误的原因所在                               |
| 5XX  | Server Error（服务器错误状态码） | 服务器处理请求出错         | 表明服务器本身发生错误                                       |

## http首部

在客户端和服务器之间的http协议进行通信的过程中，无论是请求还是响应都会使用首部字段，它能起到传递**额外重要信息**的作用。

http首部由多个**首部字段**组成，首部字段由**字段名**和**字段值**构成，中间用冒号分隔。例如：

Content-Type:text/html

字段值可以有多个，例如：

Keep-Alive:timeout=15,max=100

## http缺点

1）通信使用明文（不加密），内容有可能会被**窃听**；

2）不验证通信方的身份，因此有可能遭遇**伪装**；

3）无法证明报文的完整性，所以有可能已遭**篡改**。

## 什么是https

简单讲，http + 加密 + 认证 + 完整性保护 = https。其中，加密为了解决窃听问题，认证为了解决伪装问题，完整性保护为了解决篡改问题。

https不是应用层的一种新协议。http**通信接口**使用**SSL（Secure Socket Layer）协议**或**TLS（Transport Layer Security）协议**代替。通常，http直接和TCP通信，当使用https时，则先和SSL通信，再由SSL和TCP通信。

<p><img src="/assets/blogImg/http详解_03.png" width="400"></p>

SSL最初由网景通信公司率先倡导，开发过SSL3.0之前的版本。目前主导权已经移交到IETF，IETF以SSL3.0为基准，指定了TLS1.0，TLS1.1和TLS1.2。由于TLS是以SSL为原型开发的协议，所以统一称为SSL。

## https工作流程

<p><img src="/assets/blogImg/http详解_04.png" width="1000"></p>

1.Client发起一个HTTPS（比如，https://juejin.im/user/5a9a9cdcf265da238b7d771c ）的请求，根据RFC2818的规定，Client知道需要连接Server的443（默认）端口。

2.Server把事先配置好的公钥证书（public key certificate）返回给客户端。

3.Client验证公钥证书：比如是否在有效期内，证书的用途是不是匹配Client请求的站点，是不是在CRL吊销列表里面，它的上一级证书是否有效，这是一个递归的过程，直到验证到根证书（操作系统内置的Root证书或者Client内置的Root证书）。如果验证通过则继续，不通过则显示警告信息。

4.Client使用伪随机数生成器生成加密所使用的对称密钥，然后用证书的公钥加密这个对称密钥，发给Server。

5.Server使用自己的私钥（private key）解密这个消息，得到对称密钥。至此，Client和Server双方都持有了相同的对称密钥。

6.Server使用对称密钥加密“明文内容A”，发送给Client。

7.Client使用对称密钥解密响应的密文，得到“明文内容A”。

8.Client再次发起HTTPS的请求，使用对称密钥加密请求的“明文内容B”，然后Server使用对称密钥解密密文，得到“明文内容B”。

## 引用

https://blog.csdn.net/hj7jay/article/details/80221060

https://zhuanlan.zhihu.com/p/27395037

《图解HTTP》 上野 宣