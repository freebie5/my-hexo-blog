---
title: '@Import注解的3种用法'
date: 2020-09-13 00:00:25
tags: 
- Spring
- 注解
- import
categories: Spring相关
---

@Import支持 三种方式
1）直接导入（4.2 版本之前只可以导入带有@Configuration的配置类，4.2版本之后可以导入普通类)
2）ImportSelector方式（SpringBoot自动配置用得最多的方式）
3）ImportBeanDefinitionRegistrar方式

## 直接导入

导入普通类

```java
public class TestA {
    public void hello() {
        System.out.println("TestA");
    }
}

@Configuration
@Import({TestA.class})
public class ImportConfig {
}
```

带有@Configuration的配置类

```java
@Configuration
public class TestB {
    public void hello() {
        System.out.println("TestB");
    }
}

@Configuration
@Import({TestB.class})
public class ImportConfig {
}
```

## ImportSelector方式

```java
public class TestC {
    public void hello() {
        System.out.println("TestC");
    }
}

public class MyImportSelector implements ImportSelector {
    @Override
    public String[] selectImports(AnnotationMetadata annotationMetadata) {
        return new String[]{"com.example.teststarterdemo.bean.TestC"};
    }
}

@Configuration
@Import({MyImportSelector.class})
public class ImportConfig {
}
```

## ImportBeanDefinitionRegistrar方式

```java
public class TestD {
    public void hello() {
        System.out.println("TestD");
    }
}

public class MyImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        RootBeanDefinition root = new RootBeanDefinition(TestD.class);
        registry.registerBeanDefinition("testD", root);
    }
}

@Configuration
@Import({MyImportBeanDefinitionRegistrar.class})
public class ImportConfig {
}
```

