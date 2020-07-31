---
title: WebService客户端的几种调用方式
date: 2020-07-19 21:31:08
tags: 
- 日常开发
- WebService
categories: 日常开发记录
---

## 1.需求场景

公司最近有个开发任务，需要对接第三方接口，涉及到WebService客户端调用方式，我简单描述一下需求：

1.对接第三方WebServcie服务接口

2.由于我们生产服务器有IP和端口限制，所以调用第三方接口都需要提前一周申请权限

## 2.功能细化

按照上面的需求，其实功能实现非常简单，我只需要用WebService客户端调用第三方提供的WebService服务端即可，但是事实上我在实际开发过程中却遇到了麻烦，找了大半天才发现问题所在

## 3.踩坑记录

由于平时接触WebService的接口比较少，对WebService不熟悉，这次开发我遇到一个坑，简单描述一下就是：第三方提供的wsdl的url端口号和wsdl文档内容里边wsdlsoap:address值定的url端口号不是同一个，上面提到我们生产服务器的IP和端口是需要提前申请开通（申请开通了9083端口），如果没有申请那么网络是不通的，这就导致了，我在生产服务器curl第三方的wsdl的url是可以获取到内容，但是我代码（动态xfire方式）访问第三的wsdl服务是网络超时。

```xml
//wsdl的url
http://www.freebie5:9083/freebie5/services/freebie5service

//wsdl的文档内容
<wsdl:definitions xmlns:soapenc12="http://www.w3.org/2003/05/soap-encoding"
                  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
                  xmlns:tns="http://webservice.freebie5.com"
                  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                  xmlns:soap11="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"
                  xmlns:wsdlsoap="http://schemas.xmlsoap.org/wsdl/soap/"
                  xmlns:soapenc11="http://schemas.xmlsoap.org/soap/encoding/"
                  targetNamespace="http://webservice.freebie5.com">
	
    //省略其他信息
    ...
	
    <wsdl:service name="freebie5service">
    	<wsdl:port name="freebie5serviceHttpPort" binding="tns:freebie5serviceHttpBinding">
        	<wsdlsoap:address location="http://www.freebie5:9080/freebie5/services/freebie5service"/>
        </wsdl:port>
    </wsdl:service>
</wsdl:definitions>
```

## 4.踩坑后的总结

这个坑解决方案有三种，但是当时由于对WebService不熟悉，第三种方法我当时没有想到

1.申请开通9080端口，但是需要1周时间

2.第三方修改wsdl文档，把wsdlsoap:address的端口号修改为9083

3.使用动态Axis方式调用

关于第三种方式我重点说一下

刚开始我是使用了动态Xfire的方式调用，由于动态Xfire需要解析wsdl文档获取接口入参和目标服务地址wsdlsoap:address，从而Xfire实际上请求的端口号是9080，所以我一直请求超时。

明白问题所在之后，我换了种调用方式，动态Axis方式，由于动态Axis方式需要指定入参名称，所以没有解析wsdl文档导致请求错误端口的问题，最终可以成功调用服务。

## 5.几种WebServie客户端调用方式

这几种方式都是动态调用的方式

项目git路径：https://github.com/freebie5/WebServiceDemo.git

#### 5.1.Axis动态调用

```java
package com.example.demo.util;

import org.apache.axis.client.Call;
import org.apache.axis.client.Service;
import org.apache.axis.encoding.XMLType;
import javax.xml.namespace.QName;
import javax.xml.rpc.ParameterMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AxisUtil {

    /**
     * 动态Axis方式
     * @param url
     * @param method
     * @param inputParams
     * @return
     * @throws Exception
     */
    public static Object getResult(String url, String method, String namespace,
                                         List<Map<String,Object>> inputParams) throws Exception {
        Service service = new Service();
        Call call = (Call) service.createCall();
        call.setTargetEndpointAddress(url);
        call.setOperationName(new QName(namespace, method));
        call.setUseSOAPAction(true);
        call.setSOAPActionURI(namespace+method);
        call.setTimeout(30*1000);
//        call.setReturnType(XMLType.XSD_STRING);
        List<Object> values = new ArrayList<>();
        if(inputParams!=null) {
            for(Map<String,Object> inputParam:inputParams) {
                String paramName = (String)inputParam.get("paramName");
                QName paramValueType = (QName)inputParam.get("paramValueType");
                call.addParameter(paramName, paramValueType, ParameterMode.IN);
                Object paramValue = inputParam.get("paramValue");
                values.add(paramValue);
            }
        }
        // 调用服务
        return call.invoke(values.toArray());
    }

}
```

依赖

```xml
<dependency>
    <groupId>axis</groupId>
    <artifactId>axis</artifactId>
    <version>1.4</version>
</dependency>
```

#### 5.2.Axis2动态调用

对于一些最新的WebService服务端，需要设置SOAPAction，但是Axis有个bug设置不了SOAPAction，会报以下错误，目前我还没有找到办法解决，所以，如果遇到一下错误，建议使用Axis2

```
org.apache.axis.AxisFault: 服务器无法处理请求。 ---> 未将对象引用设置到对象的实例。
	at org.apache.axis.message.SOAPFaultBuilder.createFault(SOAPFaultBuilder.java:222)
	at org.apache.axis.message.SOAPFaultBuilder.endElement(SOAPFaultBuilder.java:129)
	at org.apache.axis.encoding.DeserializationContext.endElement(DeserializationContext.java:1087)
	at com.sun.org.apache.xerces.internal.parsers.AbstractSAXParser.endElement(AbstractSAXParser.java:609)
	at com.sun.org.apache.xerces.internal.impl.XMLDocumentFragmentScannerImpl.scanEndElement(XMLDocumentFragmentScannerImpl.java:1782)
	at com.sun.org.apache.xerces.internal.impl.XMLDocumentFragmentScannerImpl$FragmentContentDriver.next(XMLDocumentFragmentScannerImpl.java:2973)
	at com.sun.org.apache.xerces.internal.impl.XMLDocumentScannerImpl.next(XMLDocumentScannerImpl.java:606)
	at com.sun.org.apache.xerces.internal.impl.XMLNSDocumentScannerImpl.next(XMLNSDocumentScannerImpl.java:117)
	at com.sun.org.apache.xerces.internal.impl.XMLDocumentFragmentScannerImpl.scanDocument(XMLDocumentFragmentScannerImpl.java:510)
	at com.sun.org.apache.xerces.internal.parsers.XML11Configuration.parse(XML11Configuration.java:848)
	at com.sun.org.apache.xerces.internal.parsers.XML11Configuration.parse(XML11Configuration.java:777)
	at com.sun.org.apache.xerces.internal.parsers.XMLParser.parse(XMLParser.java:141)
	at com.sun.org.apache.xerces.internal.parsers.AbstractSAXParser.parse(AbstractSAXParser.java:1213)
	at com.sun.org.apache.xerces.internal.jaxp.SAXParserImpl$JAXPSAXParser.parse(SAXParserImpl.java:649)
	at com.sun.org.apache.xerces.internal.jaxp.SAXParserImpl.parse(SAXParserImpl.java:333)
	at org.apache.axis.encoding.DeserializationContext.parse(DeserializationContext.java:227)
	at org.apache.axis.SOAPPart.getAsSOAPEnvelope(SOAPPart.java:696)
	at org.apache.axis.Message.getSOAPEnvelope(Message.java:435)
	at org.apache.axis.transport.http.HTTPSender.readFromSocket(HTTPSender.java:796)
	at org.apache.axis.transport.http.HTTPSender.invoke(HTTPSender.java:144)
	at org.apache.axis.strategies.InvocationStrategy.visit(InvocationStrategy.java:32)
	at org.apache.axis.SimpleChain.doVisiting(SimpleChain.java:118)
	at org.apache.axis.SimpleChain.invoke(SimpleChain.java:83)
	at org.apache.axis.client.AxisClient.invoke(AxisClient.java:165)
	at org.apache.axis.client.Call.invokeEngine(Call.java:2784)
	at org.apache.axis.client.Call.invoke(Call.java:2767)
	at org.apache.axis.client.Call.invoke(Call.java:2443)
	at org.apache.axis.client.Call.invoke(Call.java:2366)
	at org.apache.axis.client.Call.invoke(Call.java:1812)
	at com.example.demo.util.AxisUtil.getResult(AxisUtil.java:43)
	at com.example.demo.util.Main.getResultByAxis(Main.java:74)
	at com.example.demo.util.Main.main(Main.java:24)
```

```java
package com.example.demo.util;

import org.apache.axiom.om.OMAbstractFactory;
import org.apache.axiom.om.OMElement;
import org.apache.axiom.om.OMFactory;
import org.apache.axiom.om.OMNamespace;
import org.apache.axis2.addressing.EndpointReference;
import org.apache.axis2.client.Options;
import org.apache.axis2.client.ServiceClient;
import java.util.List;
import java.util.Map;

public class Axis2Util {

    public static String getResult(String url, String methodName, String namespaceStr,
                                   List<Map<String,Object>> inputParams) throws Exception {

        EndpointReference endpointReference = new EndpointReference(url);

        //创建一个OMFactory，命名空旧，方法，参数都由它创建
        OMFactory factory = OMAbstractFactory.getOMFactory();

        //创建命名空间，如果你的WebService指定了targetNamespace属性的话，就要用这个
        //对应于@WebService(targetNamespace = "http://WebXml.com.cn/")
        OMNamespace omNamespace = factory.createOMNamespace(namespaceStr, "xsd");

        //创建一个method对象，"qqCheckOnline"为方法名
        OMElement method = factory.createOMElement(methodName, omNamespace);
        for(int i=0;i<inputParams.size();i++) {
            String paramName = (String)inputParams.get(0).get("paramName");
            String paramValue = (String)inputParams.get(0).get("paramValue");
            //创建参数，对应于@WebParam(name = "qqCode")
            //由于@WebParam没有指定targetNamespace，所以下面创建name参数时，用了null，否则你得赋一个namespace给它
            OMElement nameElement = factory.createOMElement(paramName, omNamespace);
            nameElement.addChild(factory.createOMText(nameElement, paramValue));
            //将入参设置到method
            method.addChild(nameElement);
        }

        //设置配置参数
        Options options = new Options();
        //此处对应于@WebMethod(action = "http://WebXml.com.cn/qqCheckOnline")
        options.setAction(namespaceStr+methodName);
        options.setTo(endpointReference);

        //创建客户端，并调用
        ServiceClient client = new ServiceClient();
        client.setOptions(options);
        OMElement result = client.sendReceive(method);
        return result.toString();
    }

}
```

依赖

```xml
<dependency>
    <groupId>org.apache.axis2</groupId>
    <artifactId>axis2</artifactId>
    <version>1.7.9</version>
</dependency>
<dependency>
    <groupId>org.apache.axis2</groupId>
    <artifactId>axis2-kernel</artifactId>
    <version>1.7.9</version>
</dependency>
<dependency>
    <groupId>org.apache.axis2</groupId>
    <artifactId>axis2-transport-http</artifactId>
    <version>1.7.9</version>
</dependency>
<dependency>
    <groupId>org.apache.axis2</groupId>
    <artifactId>axis2-transport-local</artifactId>
    <version>1.7.9</version>
</dependency>
<dependency>
    <groupId>org.apache.axis2</groupId>
    <artifactId>axis2-adb</artifactId>
    <version>1.7.9</version>
</dependency>
```

#### 5.3.Xfire动态调用

```java
package com.example.demo.util;

import org.codehaus.xfire.client.Client;
import java.net.URL;
import java.util.List;

public class XfireUtil {

    /**
     * 动态Xfire方式
     * @param url
     * @param method
     * @param inputParams
     * @return
     * @throws Exception
     */
    public static Object getResult(String url,String method,
                                          List<Object> inputParams) throws Exception {
        Client client = null;
        try {
            client =  new Client(new URL(url));
            client.setTimeout(30*1000);
            Object[] resultArr = client.invoke(method, inputParams.toArray());
            return resultArr[0];
        } finally {
            if(client!=null) {
                client.close();
            }
        }
    }

}
```

依赖

```xml
<dependency>
    <groupId>org.codehaus.xfire</groupId>
    <artifactId>xfire-core</artifactId>
    <version>1.2.6</version>
</dependency>
<dependency>
    <groupId>org.codehaus.xfire</groupId>
    <artifactId>xfire-aegis</artifactId>
    <version>1.2.6</version>
</dependency>
```

#### 5.4.Cxf动态调用

```java
package com.example.demo.util;

import org.apache.cxf.endpoint.Client;
import org.apache.cxf.jaxws.endpoint.dynamic.JaxWsDynamicClientFactory;
import org.apache.cxf.transport.http.HTTPConduit;
import org.apache.cxf.transports.http.configuration.HTTPClientPolicy;
import javax.xml.namespace.QName;
import java.util.List;

public class CxfUtil {

    /**
     * 动态Cxf方式
     * @param url
     * @param nameSpace
     * @param method
     * @param inputParams
     * @return
     * @throws Exception
     */
    public static Object getResult(String url, String nameSpace, String method,
                                        List<Object> inputParams) throws Exception {
        JaxWsDynamicClientFactory dcf = JaxWsDynamicClientFactory.newInstance();
        Client client = dcf.createClient(url);
        // 设置超时单位为毫秒
        HTTPConduit conduit = (HTTPConduit)client.getConduit();
        HTTPClientPolicy policy = new HTTPClientPolicy();
        policy.setConnectionTimeout(30*1000);
        policy.setAllowChunking(false);
        policy.setReceiveTimeout(30*1000);
        conduit.setClient(policy);
        //
        QName name = new QName(nameSpace, method);
        Object[] object = client.invoke(name, inputParams.toArray());
        return object[0];
    }

}
```

依赖

如果使用cxf的依赖，则不可以使用xfire的依赖和axis的依赖，因为cxf的依赖和这两种方式的依赖冲突，切记！

```xml
<dependency>
    <groupId>org.apache.cxf</groupId>
    <artifactId>cxf-rt-frontend-jaxws</artifactId>
    <version>3.3.7</version>
</dependency>
<dependency>
    <groupId>org.apache.cxf</groupId>
    <artifactId>cxf-rt-transports-http</artifactId>
    <version>3.3.7</version>
</dependency>
<dependency>
    <groupId>org.apache.cxf</groupId>
    <artifactId>cxf-rt-transports-http-jetty</artifactId>
    <version>3.3.7</version>
    <scope>test</scope>
</dependency>
```

#### 5.5.HttpClient调用

```java
package com.example.demo.util;

import org.apache.http.HttpEntity;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class HttpClient4Util {

    public static Object getResult(String url, String method, String resultTag, String namespace,
                                                List<Map<String,Object>> inputParams) throws Exception {

        //拼接请求体
        StringBuilder requestContent = new StringBuilder();
        requestContent.append("<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:web=\""+namespace+"\">");
        requestContent.append("<soapenv:Header/>");
        requestContent.append("<soapenv:Body>");
        requestContent.append("<web:"+method+">");
        if(inputParams!=null) {
            for(int i=0;i<inputParams.size();i++) {
                String paramName = (String)inputParams.get(i).get("paramName");
                String paramValue = (String)inputParams.get(i).get("paramValue");
                requestContent.append("<web:"+paramName+">"+paramValue+"</web:"+paramName+">");
            }
        }
        requestContent.append("</web:"+method+">");
        requestContent.append("</soapenv:Body>");
        requestContent.append("</soapenv:Envelope>");
        //调用
        //创建请求
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(url);
        //设置超时
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(30*1000)// 设置连接主机服务超时时间
                .setConnectionRequestTimeout(30*1000)// 设置连接请求超时时间
                .setSocketTimeout(30*1000)// 设置读取数据连接超时时间
                .build();
        httpPost.setConfig(requestConfig);
        //设置请求头
        httpPost.addHeader("Content-Type", "text/xml;charset=UTF-8");
        //封装post请求参数
        httpPost.setEntity(new StringEntity(requestContent.toString(), "UTF-8"));
        CloseableHttpResponse httpResponse = null;
        String result = null;
        try {
            //httpClient对象执行post请求，并返回响应参数对象
            httpResponse = httpClient.execute(httpPost);
            // 从响应对象中获取响应内容
            HttpEntity entity = httpResponse.getEntity();
            result = EntityUtils.toString(entity);
        } catch (Exception e) {
//            logger.error(e.getMessage(), e);
        } finally {
            // 关闭资源
            if (null != httpResponse) {
                try {
                    httpResponse.close();
                } catch (IOException e) {
//                    logger.error(e.getMessage(), e);
                }
            }
            if (null != httpClient) {
                try {
                    httpClient.close();
                } catch (IOException e) {
//                    logger.error(e.getMessage(), e);
                }
            }
        }
        //获取结果
        Document doc = DocumentHelper.parseText(result);
        Element root = doc.getRootElement();
        return root.element("Body").element(method+"Response").element(resultTag);
    }

}
```

依赖

```xml
<dependency>
    <groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
    <version>4.5.12</version>
</dependency>
```

#### 5.6.测试

```java
package com.example.demo.util;

import org.apache.axis.encoding.XMLType;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    private static String METHOD = "getCountryCityByIp";

    private static String RESULT_TAG = "getCountryCityByIpResult";

    private static String NAME_SPACE = "http://WebXml.com.cn/";

    private static String WSDL = "http://www.webxml.com.cn/WebServices/IpAddressSearchWebService.asmx?wsdl";

    public static void main(String[] args) throws Exception {
        Main.getResultByHttpClient4();
        Main.getResultByCxf();
        Main.getResultByXfire();
        Main.getResultByAxis();
    }

    public static void getResultByHttpClient4() throws Exception {
        String url = WSDL.replace("?wsdl","");//不需要?wsdl后缀;
        String method = METHOD;
        String resultTag = RESULT_TAG;
        String namespace = NAME_SPACE;
        List<Map<String,Object>> inputParams = new ArrayList<>();
        //
        Map<String,Object> param0 = new HashMap<>();
        param0.put("paramName", "theIpAddress");
        param0.put("paramValue", "183.54.42.103");
        inputParams.add(param0);
        //
        Object result = HttpClient4Util.getResult(url, method, resultTag, namespace, inputParams);
        System.out.println(result);
    }

    public static void getResultByCxf() throws Exception {
        String url = WSDL;
        String nameSpace = NAME_SPACE;
        String method = METHOD;
        List<Object> inputParams = new ArrayList<>();
        inputParams.add("183.54.42.103");
        Object result = CxfUtil.getResult(url, nameSpace, method, inputParams);
        System.out.println(result);
    }

    public static void getResultByXfire() throws Exception {
        String url = WSDL;
        String method = METHOD;
        List<Object> inputParams = new ArrayList<>();
        inputParams.add("183.54.42.103");
        Object result = XfireUtil.getResult(url, method, inputParams);
        System.out.println(result);
    }

    public static void getResultByAxis() throws Exception {
        String url = WSDL.replace("?wsdl","");//不需要?wsdl后缀
        String method = METHOD;
        String namespace = NAME_SPACE;
        List<Map<String,Object>> inputParams = new ArrayList<>();
        //
        Map<String,Object> inputParam0 = new HashMap<>();
        inputParam0.put("paramName", "theIpAddress");
        inputParam0.put("paramValueType", XMLType.XSD_STRING);
        inputParam0.put("paramValue", "183.54.42.103");
        inputParams.add(inputParam0);
        //
        Object result = AxisUtil.getResult(url, method, namespace, inputParams);
        System.out.println(result);
    }
    
    public static void getResultByAxis2() {
        String url = WSDL.replace("?wsdl","");//不需要?wsdl后缀
        String method = METHOD;
        String namespace = NAME_SPACE;
        List<Map<String,Object>> inputParams = new ArrayList<>();
        //
        Map<String,Object> inputParam0 = new HashMap<>();
        inputParam0.put("paramName", "theIpAddress");
        inputParam0.put("paramValueType", XMLType.XSD_STRING);
        inputParam0.put("paramValue", "183.54.42.103");
        inputParams.add(inputParam0);
        String result = Axis2Util.getResult(url, method, namespace, inputParams);
        System.out.println(result);
    }

}
```

## 6.引用

https://www.iteye.com/blog/gavin-chen-336727

用于测试的在线wsdl：

https://www.cnblogs.com/yuxuan/archive/2010/10/27/1862669.html

http://www.webxml.com.cn/WebServices/IpAddressSearchWebService.asmx?wsdl