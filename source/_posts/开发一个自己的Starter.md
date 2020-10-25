---
title: 开发一个自己的Starter
date: 2020-09-12 22:58:09
tags: 
- SpringBoot
- Starter
- Spring
categories: Spring相关
---

## 概览

源码：https://github.com/freebie5/spring-boot-demo/tree/master/spring-boot-starter

一个最简单的SpringBoot Starter的目录结构如下所示

<p><img src="/assets/blogImg/开发一个自己的Starter_01.png" width="400"></p>

## 创建一个maven工程

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>spring-boot-demo</artifactId>
        <groupId>org.sy</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>spring-boot-starter</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>2.3.3.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

</project>
```

## 创建业务代码

因为事demo代码，这里的业务逻辑我尽量简单，实际的业务逻辑会比较复杂

```java
package org.sy.springbootstarter.moudle;

public interface HelloService {
    public String sayHello();
}
```

```java
package org.sy.springbootstarter.moudle;

import org.springframework.stereotype.Component;

@Component
public class HelloServiceImpl implements HelloService {
    public String sayHello() {
        return "hello";
    }
}
```

## 创建自动配置项

要让上面的业务代码生效，在Spring中可以通过配置xml文件

```xml
<context:component-scan base-package="com.sy.starterdemo.moudle"></context:component-scan>
```

在SpringBoot中可以通过**自动配置项**。HelloServiceAutoConfiguration类没有逻辑实现，@ComponentScan中加入这个模块的容器扫描路径

```java
package org.sy.springbootstarter;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan({"org.sy.springbootstarter.moudle"})
public class HelloServiceAutoConfiguration {
}
```

在项目的**根路径**下建立**META-INF/spring.factories**

```properties
# auto configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=org.sy.springbootstarter.HelloServiceAutoConfiguration
```

## 引用

《Spring源码深度解析》（第2版） 郝佳