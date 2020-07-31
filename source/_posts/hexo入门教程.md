---
title: hexo入门教程
date: 2017-07-18 21:33:21
categories: hexo
tags: 
- 入门教程
- hexo
---

## 环境准备

hexo官网配置教程：https://hexo.io/zh-cn/docs/configuration

安装Git

安装Node.js

## 安装hexo

```
cnpm install -g hexo-cli
```

在指定目录初始化hexo

```
hexo init D:\IdeaProjects\hexo-blog
cd hexo-blog
cnpm install
```

## 启动hexo

```
hexo s
```

## 更换hexo主题

克隆yilia主题到theme/yilia目录

```
git clone https://github.com/litten/hexo-theme-yilia.git themes/yilia
```

修改_config.yml文件，修改为yilia
<p><img src="/assets/blogImg/hexo入门教程_01.png" width="500"></p> 
清除缓存，编译

```
hexo clean
hexo g
```

## 新建文章

新建的文章默认保存到source/_posts路径下

可以使用Notepads编辑markdown文件

```
hexo n “什么是微服务架构”
```

## 部署到github

登录github，新建仓库freebie5.github.io（仓库名称必须是：昵称.githut.io）

```
cnpm install --save hexo-deployer-git
```

配置_config.yml
<p><img src="/assets/blogImg/hexo入门教程_02.png" width="500"></p> 
```
hexo d
```

访问https://freebie5.github.io/

## yilia作者的hexo主页

http://litten.me/photos/

https://github.com/litten/BlogBackup