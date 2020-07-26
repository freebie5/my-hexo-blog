---
title: 基于http的长轮询简单实现
date: 2020-07-18 22:06:04
categories: 日常开发记录
tags: 
- 日常开发
- js
- java
---

## 1.需求场景

公司最近有个开发任务，需要对接第三方接口，涉及到长轮询的，我简单描述一下需求：

1.请求第三方的二维码凭证接口获取凭证qrCodeKey，用qrCodeKey作为参数生成链接，例如：

http://www.freebie5.com?qrCodeKey=123456

然后，把链接作为内容，生成二维码

2.用户手机扫描二维码访问链接，进行授权

3.如果用户授权，那么第三方会把该用户的授权信息推送给我的后台接口

4.如果后台接收到授权信息，那么前端页面立即跳转，实现授权登录

## 2.功能细化

按照上面的需求描述，我把功能细化为3个接口：

1.生成二维码的接口

2.提供给第三方调用的接收授权信息的接口

3.长轮询接口，当后台收到第三方推送的授权信息，前端页面马上就能跳转

下面我重点说明一下长轮询接口，其他两个接口我简单说明一下

### 2.1生成二维码接口

前端调用生成二维码接口，该接口就会生成一个业务流水号busNo作为入参调用第三方二维码凭证接口，获取二维码凭证qrCodeKey，用qrCodeKey作为参数生成链接，最后把链接作为二维码的内容，生成二维码，最后再把二维码的base64字符串和busNo返回给前端，前端直接展示二维码。同时记录一笔业务日志

### 2.2接收授权信息接口

第三方把授权信息json和busNo推送给我，我把busNo作为key，授权信息作为value，存储到redis缓存，同时记录一笔业务日志

### 2.3长轮询接口

前端页面调用长轮询接口，把busNo作为入参传给后台，后台以busNo作为key查询redis缓存，如果查询不到value，则暂停1秒后重试，如果超过15秒后还是没有value，则返回超时提示；如果查询到value，则直接返回授权信息

#### 2.3.1前端demo

```javascript
function longPolling() {
    let data = {
        busNo: "123456";//业务流水号
    };
    $.ajax({
        async: true,//异步
        headers: headers,//请求头
        url: url,//路径
        type: 'post',
        dataType: 'json',
        data: data,
        timeout: 30000,//超时时间设定30秒
        error: (Xhr, textStatus, thrownError) => {
            //失败，重试
            this.longPolling();//发生异常错误后再次发起请求
        },
        success: (response) => {
            if (//成功) {
                //跳转页面
            } else {
                //超时，重试
                this.longPolling();
            }
        }
    });
}
```

#### 2.3.2后台demo

```java
private static final int TIMEOUT = 15 * 1000;//15秒

public JSONObject getInfo(String busNo) throws InterruptedException {
    JSONObject result = new JSONObject();
    //授权信息
    JSONObject infoResult = null;
    long requestTime = System.currentTimeMillis();
    while ((System.currentTimeMillis() - requestTime) < TIMEOUT) {
        //查询redis缓存，获取授权信息
        infoResult = getInfoResultByRedis(busNo);
        if (infoResult!=null) {
            break;// 跳出循环，返回数据
        } else {
            Thread.sleep(1000);// 休眠1秒
        }
    }
    if (infoResult==null) {
        result.put("state", "0");
        result.put("msg", "超时");
        result.put("infoResult", new JSONObject());
    } else {
        result.put("state", "1");
        result.put("msg", "成功");
        result.put("infoResult", infoResult);
    }
    return result;
}
```

