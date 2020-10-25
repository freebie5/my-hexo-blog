---
title: URI和URL的区别
date: 2020-08-30 00:22:05
tags: 
- URI
- URL
categories: 网络相关
---

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

## 引用

https://www.cnblogs.com/hust-ghtao/p/4724885.html