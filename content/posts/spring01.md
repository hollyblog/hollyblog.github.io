---
title: "SpringBoot-环境搭建与项目初始化"
date: 2021-02-17T16:29:39+08:00
draft: false
description: "SpringBoot-环境搭建与项目初始化。"
tags: ["SpringBoot","框架应用"]
categories: ["Framework"]
---

## SpringBoot 介绍
### SpringBoot 核心特性
1. 自动配置 (Auto Configuration)
SpringBoot能够根据类路径中的依赖自动配置应用程序，大大减少了手动配置的工作量。

2. 起步依赖 (Starter Dependencies)
提供了一系列预配置的依赖包，简化了依赖管理和版本控制。

3. 内嵌服务器 (Embedded Server)
内置Tomcat、Jetty等服务器，无需外部部署，直接运行jar包即可。

4. 生产就绪特性
提供监控、健康检查、指标收集等生产环境必需的功能。

### SpringBoot vs Spring Framework
✅ SpringBoot 优势
- 零配置启动 - 约定优于配置
- 内嵌Web服务器 - 无需外部部署
- 自动依赖管理 - 版本兼容性保证
- 生产监控功能 - 开箱即用
- 快速开发 - 专注业务逻辑

❌ 传统Spring 痛点
- 大量XML配置文件
- 需要外部服务器部署
- 手动管理依赖版本冲突
- 需要额外配置监控组件
- 开发效率相对较低

### SpringBoot 应用场景
- Web应用开发 - 快速构建企业级Web应用
- 微服务架构 - 构建分布式微服务系统
- RESTful API - 开发高性能API服务
- 企业级应用 - 大型企业系统开发
- 云原生应用 - 容器化部署和云平台集成

### SpringBoot 常见面试题
高频面试题
#### 1.什么是SpringBoot？它解决了什么问题？
一、底层原理（大白话）
1. Spring 本身是个“全功能”容器：配置繁重、依赖复杂、启动慢。  
2. Spring Boot 在 Spring 之上包了一层“自动装配 + 起步依赖 + 内嵌服务器”三板斧，让你 **只写业务代码，不写或只写极少配置**。  
3. 核心机制  
   - 起步依赖（starter）→ 把常用 jar 按“场景”打成一组，一次性引入，版本冲突 Spring Boot 帮你统一。  
   - 自动配置（@EnableAutoConfiguration）→ 在启动时扫描 classpath，发现某类就在背后帮你把 Bean 注册好（DataSource、DispatcherServlet、Tomcat…）。  
   - 内嵌 Web 容器（Tomcat/Jetty/Undertow）→ 不再需要外部安装 Tomcat，直接 `java -jar` 跑。  
4. 结果：从“写一堆 XML/JavaConfig” 变成“只写 @RestController” 就能发 HTTP 接口；启动时间从几十秒压到几秒；部署从“打 war→丢容器” 变成“打可执行 jar→一行命令”。

二、源码/命令示例（直接落地）
1. 创建项目（30 秒）
```bash
# 官方脚手架，连 IDE 都不用开
curl https://start.spring.io/starter.zip \
  -d dependencies=web \
  -d javaVersion=17 \
  -d packageName=com.demo \
  -o demo.zip && unzip demo.zip && cd demo
```
2. 只写 1 个接口
```java
package com.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication   // ← 自动装配开关
@RestController
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello Spring Boot!";
    }
}
```
3. 打包 & 运行
```bash
./mvnw package -DskipTests
java -jar target/demo-0.0.1-SNAPSHOT.jar   # 默认端口 8080
curl http://localhost:8080/hello
→ Hello Spring Boot!
```
全程 **0 行 XML，0 行配置**，就把 Web 容器、Spring MVC、Jackson JSON 自动装好并跑起来。

三、口诀（10 秒背会）
“起步依赖一键拉，自动配置偷偷搭；内嵌容器随 jar 发，Spring Boot 省到家。”

#### 2.SpringBoot的自动配置原理是什么？
一、底层原理（大白话）

1. 自动配置 = **“按需给 Bean”**  
   Spring Boot 启动时，会扫一遍 classpath 和已声明的配置，**发现你缺什么就偷偷帮你注册什么**；如果检测到你自己已经配了，它就**自动退让**，绝不冲突。

2. 三大件协同  
   ① `@SpringBootApplication` 里暗含 `@EnableAutoConfiguration`  
   ② `@EnableAutoConfiguration` 通过 `spring-boot-autoconfigure` 模块里的 **META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports** 文件，一次性把 140+ 个 `*AutoConfiguration` 类装进容器。  
   ③ 每个 `*AutoConfiguration` 类再用 **@ConditionalOnXxx** 做“守门员”：  
      - `@ConditionalOnClass` —— classpath 里有指定类才生效  
      - `@ConditionalOnMissingBean` —— 容器里没你自己定义的 Bean 才生效  
      - `@ConditionalOnProperty` —— 配置项开关  
   条件全部通过 → 执行 `@Bean` 方法，把需要的组件（DataSource、DispatcherServlet、Tomcat…）注册进来。

3. 顺序总结  
   启动 → 加载所有 `*AutoConfiguration` → 按条件过滤 → 剩余类执行 `@Bean` → 完成“零配置”。

------------------------------------------------
二、源码/命令示例（直接落地）

1. 看自动配置清单（一行命令）
```bash
java -Ddebug -jar myapp.jar   # 启动日志里会打印 Positive matches / Negative matches
```
控制台出现：
```
   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass found HikariDataSource (OnClassCondition)
      - @ConditionalOnMissingBean (types: javax.sql.DataSource) found no beans (OnMissingBeanCondition)
```
说明：检测到 HikariCP 在 classpath，且你自己没定义 DataSource → 自动帮你配。

2. 自己写一个“自动配置”感受原理  
目录结构：
```
src
└─ main
   ├─ java
   │  └─ com.demo.auto
   │     ├─ HelloAutoConfiguration.java
   │     └─ HelloService.java
   └─ resources
      └─ META-INF
         └─ spring
            └─ org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

HelloService.java
```java
public class HelloService {
    private String name;
    public HelloService(String name) { this.name = name; }
    public String say() { return "Hello " + name; }
}
```

HelloAutoConfiguration.java
```java
package com.demo.auto;

import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.context.annotation.*;

@Configuration
@ConditionalOnClass(HelloService.class)          // 1. 类存在才生效
@ConditionalOnMissingBean(HelloService.class)    // 2. 用户没配才生效
public class HelloAutoConfiguration {

    @Bean
    @ConditionalOnProperty(name = "hello.name")  // 3. 配置项存在
    public HelloService helloService(HelloProperties prop) {
        return new HelloService(prop.getName());
    }
}
```

HelloProperties.java
```java
@ConfigurationProperties("hello")
public class HelloProperties {
    private String name = "SpringBoot";
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
```
com.demo.auto.HelloAutoConfiguration
```

使用端（零 Java 配置）：
```yaml
hello:
  name: Kimi
```
启动即得：
```java
@Autowired
HelloService svc;
System.out.println(svc.say());   // → Hello Kimi
```
把 `hello.name` 注释掉或自己写一个 `HelloService` Bean，自动配置立即退让。

------------------------------------------------
三、口诀（10 秒背会）

“**@Enable 拉清单，Conditional 把门关；类在缺 Bean 才补全，自动配置就这招。**”

#### 3.什么是起步依赖？有什么优势？
一、底层原理（大白话）

1. 起步依赖（Starter）= **“打包好的套餐”**  
   它本身**几乎不写代码**，只在 `pom.xml` 里把**一组经过官方测试、版本对齐**的 jar 用 `<dependency>` 收拢在一起，并配上**约定的默认配置**。

2. 命名约定  
   `spring-boot-starter-*` —— 官方场景  
   `*-spring-boot-starter` —— 第三方场景  
   例：`spring-boot-starter-web` 一次性拉进  
   - Spring MVC  
   - Jackson JSON  
   - Tomcat 内嵌容器  
   - 统一日志、校验、Web 通用依赖  
   版本号全部由 `spring-boot-dependencies` 父 POM 统管，**你不用再写 `<version>`**。

3. 与自动配置联动  
   拉进 starter → jar 到位 → 自动配置类上的 `@ConditionalOnClass` 条件成立 → 相关 Bean 被注册 → 直接写业务即可。

------------------------------------------------
二、源码/命令示例（直接落地）

1. 不用 starter 的“原始”写法（Maven 依赖片段）
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>6.0.9</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.0</version>
</dependency>
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-core</artifactId>
    <version>10.1.8</version>
</dependency>
...（再写 10 个）
```

2. 用 starter 的“套餐”写法
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- 版本号由 Spring Boot 父 POM 统一管理，不写 -->
</dependency>
```
`mvn dependency:tree` 可见一次性拉进 20+ 协调好版本的 jar，**零冲突**。

3. 自己造一个起步依赖（公司内共享）
目录结构：
```
my-log-spring-boot-starter
├─ pom.xml
└─ src
   └─ main
      ├─ java
      │  └─ com.demo.auto
      │     ├─ MyLogAutoConfiguration.java
      │     └─ MyLogProperties.java
      └─ resources
         └─ META-INF
            └─ spring.factories  （或 AutoConfiguration.imports）
```

pom.xml（只聚合依赖，不写业务）
```xml
<project ...>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.demo</groupId>
    <artifactId>my-log-spring-boot-starter</artifactId>
    <version>1.0.0</version>

    <dependencies>
        <!-- 自动配置核心 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
        <!-- 让配置提示生效 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
        </dependency>
        <!-- 依赖 logback 增强包 -->
        <dependency>
            <groupId>net.logstash.logback</groupId>
            <artifactId>logstash-logback-encoder</artifactId>
        </dependency>
    </dependencies>
</project>
```

其他工程直接引用：
```xml
<dependency>
    <groupId>com.demo</groupId>
    <artifactId>my-log-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```
即可获得统一日志格式，**零额外配置**。

------------------------------------------------
三、起步依赖的 4 大优势（面试秒答）

1. **一键引入，拒绝“拼积木”**  
2. **版本统一管理，杜绝 jar 冲突**  
3. **与自动配置联动，开箱即用**  
4. **公司级定制=自己写 starter，技术复用不拷贝代码**

------------------------------------------------
四、口诀（10 秒背会）

“**起步依赖是套餐，版本对齐不打架；自动配置跟着走，开箱即用笑哈哈。**”

#### 4.SpringBoot与Spring Framework的区别？
一、底层原理（大白话）

1. 关系先厘清  
   Spring Framework ≈ **“地基”** —— 提供 IoC、AOP、事务、MVC 等核心能力，但**不管搭房子**（配置、部署、依赖管理）。  
   Spring Boot ≈ **“精装修拎包入住套餐”** —— 在地基上盖了一层“自动装配 + 起步依赖 + 内嵌服务器”，让你**只写业务，不写或写极少配置**。

2. 配置方式  
   - Spring：XML 或 JavaConfig，**手动声明每一颗 Bean**；项目越大，配置类越长。  
   - Boot：约定 > 配置，**自动配置类根据 classpath 和配置项自动注册 Bean**；你只在 `application.yml` 里改“差异值”。

3. 依赖管理  
   - Spring：自己挑 jar、自己写 `<version>`，**冲突自己排**。  
   - Boot：父 POM 统一仲裁，**起步依赖一键拉套餐**，版本冲突概率≈0。

4. 部署方式  
   - Spring：打 war → 丢外置 Tomcat / Jetty。  
   - Boot：内嵌容器，**打可执行 jar → `java -jar`**，Docker 化一句命令。

5. 启动入口  
   - Spring：web.xml 或 `AbstractAnnotationConfigDispatcherServletInitializer`。  
   - Boot：一个 `main` 方法贴 `@SpringBootApplication` 即可。

------------------------------------------------
二、源码/命令对比（直接落地）

1. 同样暴露一个 `/hello` 接口

Spring Framework（最小可运行片段，仍省略 xml 头）
```xml
<!-- web.xml -->
<listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>
<servlet>
    <servlet-name>dispatcher</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <load-on-startup>1</load-on-startup>
</servlet>
<servlet-mapping>
    <servlet-name>dispatcher</servlet-name>
    <url-pattern>/</url-pattern>
</servlet-mapping>
```
```java
@Configuration
@EnableWebMvc
@ComponentScan("com.demo")
public class AppConfig {
    // 手动配视图解析器、静态资源...略
}

@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() { return "Hello Spring"; }
}
```
打包：打 war → 放 Tomcat webapps → 启动 bin/startup.sh

Spring Boot（同一功能）
```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

@RestController
class HelloController {
    @GetMapping("/hello")
    public String hello() { return "Hello Boot"; }
}
```
打包 & 运行：
```bash
mvn package
java -jar target/demo.jar
```
**零 XML，零外部容器**。

------------------------------------------------
三、一句话区别（面试秒答）

“**Spring 是内核，Boot 是外壳；内核管功能，外壳管省心。**”

------------------------------------------------
四、口诀（10 秒背会）

“**Spring 搭地基，配置累死你；Boot 精装修，jar 跑到底！**”

#### 5.SpringBoot的核心注解有哪些？
一、底层原理（大白话）

1. SpringBoot 靠“三大元注解”+“一堆条件注解”撑全场：  
   ① **入口** —— `@SpringBootApplication`（组合体）  
   ② **自动装配** —— `@EnableAutoConfiguration`  
   ③ **配置属性** —— `@ConfigurationProperties`  
   ④ **条件判断** —— `@ConditionalOnXxx` 系列，决定“给不给 Bean”。

2. 它们的分工  
   - `@SpringBootApplication` 贴在 main 类上 → 一次性开启“组件扫描 + 自动配置 + 配置类”三大开关。  
   - `@EnableAutoConfiguration` 把 140+ 自动配置类读进来；内部靠 `@ConditionalOnXxx` 过滤。  
   - `@ConfigurationProperties` 把 `application.yml` 的键值射进 JavaBean，实现“类型安全”的配置。  
   - `@ConditionalOnXxx` 是“守门员”， classpath、Bean 缺失、配置项、Profile 等条件不满足，配置类直接跳过。

------------------------------------------------
二、源码/命令示例（直接落地）

1. 入口三合一（自己拆给你看）
```java
@SpringBootApplication      // 等价于下面三个
public class DemoApp {
    public static void main(String[] args) {
        SpringApplication.run(DemoApp.class, args);
    }
}
```
源码层：
```java
@SpringBootConfiguration   // 其实就是 @Configuration
@EnableAutoConfiguration   // 开启自动配置
@ComponentScan             // 组件扫描
public @interface SpringBootApplication { }
```

2. 自动配置类示例（官方片段）
```java
@Configuration
@ConditionalOnClass(DataSource.class)           // 1. 类路径有 DataSource 才生效
@ConditionalOnMissingBean(DataSource.class)     // 2. 用户没定义才生效
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }
}
```
条件全部通过 → 自动给你配好连接池。

3. 自定义配置属性（类型安全）
```java
@Component
@ConfigurationProperties("hello")   // 前缀 hello
@Data
public class HelloProperties {
    private String title = "SpringBoot";
    private int timeout = 3;
}
```
application.yml
```yaml
hello:
  title: Kimi
  timeout: 5
```
使用端：
```java
@RestController
@RequiredArgsConstructor
public class HelloController {
    private final HelloProperties props;

    @GetMapping("/")
    public String index() {
        return props.getTitle() + " , timeout=" + props.getTimeout();
    }
}
```

4. 常用条件注解速查表
| 注解 | 含义 |
|---|---|
| `@ConditionalOnClass` | 类路径存在指定类 |
| `@ConditionalOnMissingClass` | 类路径不存在 |
| `@ConditionalOnBean` | 容器里已存在某 Bean |
| `@ConditionalOnMissingBean` | 容器里不存在 |
| `@ConditionalOnProperty` | 配置项满足值 |
| `@ConditionalOnResource` | 资源文件存在 |
| `@Profile` | 指定环境激活 |

------------------------------------------------
三、口诀（10 秒背会）

“**`@SpringBootApplication` 一口三合一，**  
**`@EnableAutoConfiguration` 拉清单，**  
**`@ConfigurationProperties` 射配置，**  
**`@ConditionalOnXxx` 把门关。**”

#### 6.如何自定义SpringBoot的自动配置？
自定义 SpringBoot 自动配置 = **“写配置类 + 加条件守门 + 注册名单”** 三步走。  
下面按“原理 → 实战 → 口诀”拆给你，全部基于 **Spring Boot 2.7+ 官方推荐做法**（2025 年主流）。

------------------------------------------------
一、底层原理（大白话）

1. 自动配置类就是普通 `@Configuration`，但必须用 **@AutoConfiguration**（2.7 新注解）替代 `@Configuration`，性能更好、支持排序。  
2. 用 **@ConditionalOnXxx** 做“守门员”：条件通过才生效，实现“默认配置可覆盖”。  
3. 把类名登记到 **META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports**（2.7+ 新机制），启动时 SpringBoot 会批量加载，不再用老旧的 spring.factories 。  
4. 属性绑定用 **@ConfigurationProperties + @EnableConfigurationProperties** 提供代码提示与默认值 。

------------------------------------------------
二、实战：30 分钟写个“日志切面”starter（能直接拷贝跑）

1. 项目结构（两模块，官方标准）
```
my-log-spring-boot-starter          ← 空壳，只聚合依赖
└─ pom.xml
my-log-spring-boot-autoconfigure    ← 核心实现
├─ src/main/java
│  ├─ MyLogAutoConfiguration.java
│  ├─ MyLogProperties.java
│  └─ MyLogAspect.java
└─ src/main/resources/META-INF/spring
   └─ org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

2. 坐标与父依赖（autoconfigure 模块 pom 片段）
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>

<dependencies>
    <!-- 必备 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-aop</artifactId>
    </dependency>
    <!-- 生成配置提示 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-configuration-processor</artifactId>
    </dependency>
</dependencies>
```

3. 配置属性类（类型安全 + 默认值）
```java
@ConfigurationProperties(prefix = "my.log")
@Data
public class MyLogProperties {
    private boolean enabled = true;
    private String format = "[{}] {}";
}
```

4. 自动配置类（核心）
```java
@AutoConfiguration
@EnableConfigurationProperties(MyLogProperties.class)
@ConditionalOnProperty(prefix = "my.log", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MyLogAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean   // 用户没定义才替TA建
    public MyLogAspect myLogAspect(MyLogProperties prop) {
        return new MyLogAspect(prop);
    }
}
```

5. 切面实现（简单打印方法耗时）
```java
@Aspect
@RequiredArgsConstructor
public class MyLogAspect {
    private final MyLogProperties prop;

    @Around("execution(* com.demo..*.*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long s = System.currentTimeMillis();
        try {
            return pjp.proceed();
        } finally {
            long cost = System.currentTimeMillis() - s;
            System.out.println(
                MessageFormatter.arrayFormat(prop.getFormat(), new Object[]{cost, pjp.getSignature()}).getMessage()
            );
        }
    }
}
```

6. 注册文件（关键一行）
`resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
```
com.demo.mylog.MyLogAutoConfiguration
```
**老式 spring.factories 也能用，但 2.7+ 推荐 imports 文件，加载更快、支持排序** 。

7. 打包 & 使用
```bash
mvn install
```
业务工程直接拉：
```xml
<dependency>
    <groupId>com.demo</groupId>
    <artifactId>my-log-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```
application.yml 可零配置，也能随时改：
```yaml
my.log:
  enabled: true
  format: ">>> {} ms - {}"
```

------------------------------------------------
三、常见坑 & 调试技巧

1. 条件不生效？  
   启动加 `-Ddebug` 控制台会打印 **Positive/Negative matches**，一眼看出哪个条件把你挡了 。

2. 顺序问题？  
   用 `@AutoConfigureAfter(DataSourceAutoConfiguration.class)` 或 `.before()` 显式控制 。

3. 版本兼容？  
   可选依赖加 `<optional>true</optional>`，防止把下游 jar 爆染 。

------------------------------------------------
四、口诀（10 秒背会）

“**@AutoConfiguration 替 @Configuration，**  
**imports 文件来报名，**  
**条件注解守大门，**  
**属性类给提示音。**”


#### 7.SpringBoot支持哪些内嵌服务器？
Spring Boot 目前（2025 年官方稳定版）**内置支持 4 款内嵌服务器**，可一键切换，无需外部安装：

1. **Tomcat**  
   默认自带，引 `spring-boot-starter-web` 即可用，传统阻塞 I/O，生态最成熟。

2. **Jetty**  
   排除 Tomcat 后引 `spring-boot-starter-jetty`，轻量级，对 WebSocket、嵌入式 JDBC 更友好。

3. **Undertow**  
   引 `spring-boot-starter-undertow`，基于非阻塞 I/O，同并发下 QPS 更高、内存占用更低，适合高并发微服务。

4. **Netty**  
   不是 Servlet 容器，专供 **WebFlux 响应式栈**（`spring-boot-starter-webflux`），事件驱动模型，极致吞吐量。

------------------------------------------------
一句话总结  
“**Tomcat 默认，Jetty 轻量，Undertow 高并发，Netty 搞响应；排除谁就加谁，一行依赖切容器。**”

#### 8.如何在SpringBoot中配置多环境？
一、底层原理（大白话）

1. Spring Boot 用 **Profile** 概念区分环境：  
   `application-{profile}.yml`（或 `.properties`）即对应一个环境，**主文件只放公共配置**。

2. 启动时通过 **spring.profiles.active** 告诉容器“我现在是谁”：  
   - 可写配置、可传参、可加 Maven 打包参数，**三选一即可**。

3. 配置优先级（越后越赢）：  
   `application-default` < `application-{active}` < **命令行参数** < **环境变量**。

------------------------------------------------
二、实战：3 分钟配出 dev / test / prod

1. 文件结构
```
src/main/resources
├─ application.yml          # 公共配置
├─ application-dev.yml      # 开发
├─ application-test.yml     # 测试
└─ application-prod.yml     # 生产
```

2. 公共配置（application.yml）
```yaml
spring:
  profiles:
    active: dev          # 默认 fallback，防止忘写
my:
  log:
    format: "[{}] {}"
```

3. 各环境差异
application-dev.yml
```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/dev
    username: root
    password: root
```

application-prod.yml
```yaml
server:
  port: 80
spring:
  datasource:
    url: jdbc:mysql://10.0.0.5:3306/prod
    username: prod_user
    password: ${DB_PWD}   # 生产密码不进仓库，用环境变量
```

4. 激活方式（任选其一）

① 最常用：命令行一键切换
```bash
java -jar app.jar --spring.profiles.active=prod
```

② IDEA 开发
`Run/Debug Configurations → VM options`
```
-Dspring.profiles.active=test
```

③ Maven 打包即指定
```bash
mvn package -Dspring.profiles.active=prod
```

④ 配置中心（Nacos / K8s ConfigMap）  
只改 `spring.profiles.active=prod` 一条值，其余配置放远端。

------------------------------------------------
三、高级技巧

1. 多 Profile 同时开  
```bash
--spring.profiles.active=prod,metric
```
同时加载 `application-prod.yml` + `application-metric.yml`，适合做“环境+功能”组合。

2. Bean 级环境差异  
```java
@Configuration
@Profile("dev")          // 只在 dev 生效
public class DevConfig {
    @Bean
    public DataSource h2Console() { ... }
}
```

3. 启动验证  
加 `-Ddebug` 可在控制台看到 **The following profiles are active: prod**，确认生效。

------------------------------------------------
四、口诀（10 秒背会）

“**公共放主文件，差异拆 profile；**  
**active 一指定，命令参数最上层；**  
**Profile 注解打在类，环境隔离到 Bean。**”

## SpringBoot Initializr
### 什么是SpringBoot Initializr
SpringBoot Initializr是Spring官方提供的项目初始化工具，它能够帮助开发者快速生成SpringBoot项目的基础结构。

核心优势：
- 快速生成项目骨架
- 自动配置依赖管理
- 支持多种构建工具
- 提供丰富的起步依赖
- 确保版本兼容性

### SpringBoot Initializr 使用方式
1. 在线网站创建
访问 start.spring.io 官方网站，通过Web界面创建项目

2. IDE集成创建
在IntelliJ IDEA、Eclipse等IDE中直接创建SpringBoot项目

3. 命令行工具
使用SpringBoot CLI命令行工具快速创建项目

4. API调用
通过REST API直接调用Initializr服务创建项目

### 常用Starter依赖
- Spring Web
Web应用开发必备
- Spring Data JPA
数据库操作

- Spring Security
安全认证

- Spring Boot Actuator
监控管理

- Spring Boot Test
测试支持

- Thymeleaf
模板引擎

### 生成项目结构解析
```bash
my-spring-boot-app/
├── src/
│ ├── main/
│ │ ├── java/
│ │ │ └── com/example/demo/
│ │ │ └── DemoApplication.java
│ │ └── resources/
│ │ ├── application.properties
│ │ ├── static/
│ │ └── templates/
│ └── test/
│ └── java/
│ └── com/example/demo/
│ └── DemoApplicationTests.java
├── target/
├── pom.xml
└── README.md
```
关键文件说明
- DemoApplication.java：应用启动类
- application.properties：配置文件
- pom.xml：Maven依赖管理
- static/：静态资源目录
- templates/：模板文件目录
  
### 使用最佳实践

项目命名规范
- Group ID：com.company.project
- Artifact ID：project-name
- Package Name：com.company.project

依赖选择建议
- 只选择当前需要的依赖
- 避免添加过多不必要的依赖
- 优先选择官方Starter
- 注意版本兼容性

注意事项
- 选择合适的SpringBoot版本（推荐LTS版本）
- Java版本要与SpringBoot版本兼容
- 项目名称避免使用特殊字符
- 依赖冲突时优先使用SpringBoot推荐版本

## SpringBoot 下载安装
### 开发环境要求
|组件	|推荐版本	|最低要求
|:---:|:---:|:---:|
|JDK	|JDK 11 / JDK 17	|JDK 8+
|Maven	|3.8.6+	|3.6.0+
|Gradle	|7.5+	|6.8+
|IDE	|IntelliJ IDEA 2022+	|任意支持Java的IDE
|SpringBoot	|2.7.x	|2.7.0+


### JDK 安装配置
1. 下载JDK
访问Oracle官网或OpenJDK官网下载对应版本的JDK
- Oracle JDK
官方版本，商业支持
- OpenJDK
开源版本，免费使用

2. 安装JDK
运行下载的安装程序，按照向导完成安装

- Windows：运行.exe文件
- macOS：运行.dmg文件
- Linux：解压tar.gz文件

3. 配置环境变量
设置JAVA_HOME和PATH环境变量
Windows:
```bash
JAVA_HOME=C:\Program Files\Java\jdk-11.0.16
```
```bash
PATH=%JAVA_HOME%\bin;%PATH%
```
macOS/Linux:
```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
```
```bash
export PATH=$JAVA_HOME/bin:$PATH
```
4. 验证安装
打开命令行验证JDK安装是否成功
```bash
java -version
```
```bash
javac -version
```
> 注意事项
确保java和javac命令都能正常执行，且版本信息一致

### Maven 安装配置
1. 下载Maven
访问Maven官网下载最新版本
```bash
https://maven.apache.org/download.cgi
```
2. 解压安装
```bash
tar -xzf apache-maven-3.8.6-bin.tar.gz
```
3. 配置环境变量
```bash
export MAVEN_HOME=/opt/apache-maven-3.8.6
```
```bash
export PATH=$MAVEN_HOME/bin:$PATH
```
4. 验证安装
```bash
mvn -version
```

> Maven配置优化
> - 配置国内镜像源（阿里云）
> - 设置本地仓库路径
> - 配置JDK版本
### IDE 安装配置

- IntelliJ IDEA：功能强大，SpringBoot支持优秀
- Eclipse (STS)：免费开源，Spring官方支持
- Visual Studio Code：轻量级，插件丰富

IntelliJ IDEA 配置
- 安装Spring Boot插件
- 配置JDK和Maven
- 设置代码格式化规则
- 配置Git版本控制
> IDE推荐配置:建议使用IntelliJ IDEA Ultimate版本，提供最完整的SpringBoot开发支持

### SpringBoot CLI 安装
SpringBoot CLI是一个命令行工具，可以快速创建和运行SpringBoot应用。

方式1：手动安装
```bash
wget https://repo.spring.io/release/org/springframework/boot/spring-boot-cli/2.7.5/spring-boot-cli-2.7.5-bin.tar.gz
```
```bash
tar -xzf spring-boot-cli-2.7.5-bin.tar.gz
```
```bash
export PATH=$PWD/spring-2.7.5/bin:$PATH
```
方式2：包管理器安装

macOS (Homebrew)
```bash
brew tap spring-io/tap
```
```bash
brew install spring-boot
```
验证CLI安装：
```bash
spring --version
```
CLI基本使用：
```bash
spring init --dependencies=web my-project
```
```bash
cd my-project
```
```bash
spring run *.java
``` 

### 环境验证清单
验证命令
```bash
java -version - 检查JDK版本
javac -version - 检查编译器
mvn -version - 检查Maven
spring --version - 检查SpringBoot CLI
```
创建测试项目
```bash
spring init --dependencies=web test-project
cd test-project
mvn spring-boot:run
```
验证成功标志
- 所有命令都能正常执行
- 测试项目能够成功启动
- 访问 http://localhost:8080 有响应
- IDE能够正常导入SpringBoot项目

### 常见问题解决
- 问题1：JAVA_HOME未设置
解决：正确设置JAVA_HOME环境变量

- 问题2：Maven下载慢
解决：配置阿里云镜像源

- 问题3：端口被占用
解决：修改application.properties中的端口配置

- 问题4：IDE无法识别项目
解决：确保导入为Maven/Gradle项目

> 故障排除建议
遇到问题时，首先检查环境变量配置，然后验证各组件版本兼容性。

## SpringBoot 项目创建
### 创建方式对比
|方式	|难度	|推荐度
|:---|:---|:---|
|Spring Initializr	|⭐	|⭐⭐⭐⭐⭐
|IDE创建	|⭐⭐	|⭐⭐⭐⭐
|SpringBoot CLI	|⭐⭐⭐	|⭐⭐⭐
|手动创建	|⭐⭐⭐⭐	|⭐⭐

### Spring Initializr
官方在线项目生成器，最简单快捷的方式

优点
- 界面友好，操作简单
- 依赖选择丰富
- 生成标准项目结构
- 支持多种构建工具

缺点
- 需要网络连接
- 定制化程度有限

#### Spring Initializr 详细步骤
1. 访问官网
打开浏览器访问：https://start.spring.io

2. 配置项目基本信息
- Project: Maven Project / Gradle Project
- Language: Java / Kotlin / Groovy
- Spring Boot: 2.7.x (选择稳定版本)
- Group: com.example
- Artifact: demo
- Name: demo
- Package name: com.example.demo
- Packaging: Jar / War
- Java: 8 / 11 / 17
3. 选择依赖
常用的Starter依赖：

- Spring Web: 构建Web应用
- Spring Data JPA: 数据持久化
- MySQL Driver: MySQL数据库驱动
- Spring Security: 安全框架
- Spring Boot DevTools: 开发工具
4. 生成并下载项目
点击"GENERATE"按钮，下载生成的项目压缩包

5. 导入IDE
解压项目文件，使用IDE导入Maven/Gradle项目

### IDE创建
使用IntelliJ IDEA等IDE内置的SpringBoot项目模板

优点
- 集成开发环境
- 即创建即开发
- 项目配置自动化
- 支持版本管理

缺点
- 依赖特定IDE
- 功能受IDE限制

#### IntelliJ IDEA 创建步骤
1. 新建项目
File → New → Project

2. 选择Spring Initializr
左侧选择"Spring Initializr"

3. 配置项目信息
Server URL: https://start.spring.io
填写项目基本信息
4. 选择依赖
根据需要选择相应的Starter

5. 完成创建
IDE自动下载依赖并配置项目

> IDEA小技巧
可以在创建项目时直接配置Git仓库，方便版本管理
### SpringBoot CLI
命令行工具，适合快速原型开发

优点
- 命令行操作
- 快速创建
- 支持Groovy脚本
- 轻量级开发

缺点
- 学习成本较高
- 功能相对简单

#### SpringBoot CLI 创建步骤
基本语法
```bash
spring init [options] [location]
```
常用参数
- -d, --dependencies: 指定依赖
- -g, --groupId: 指定groupId
- -a, --artifactId: 指定artifactId
- -v, --version: 指定版本
- -p, --packaging: 指定打包方式
- -j, --java-version: 指定Java版本
- -b, --build: 指定构建工具，默认是gradle

创建示例
```bash
spring init --dependencies=web,data-jpa,mysql --groupId=com.example --artifactId=demo my-project
```
查看可用依赖
```bash
spring init --list
```
### 手动创建
从零开始手动配置Maven/Gradle项目
优点
- 完全可控
- 深度理解项目结构
- 自定义程度最高
- 学习价值大

缺点
- 配置复杂
- 容易出错
- 耗时较长




### 项目结构解析
```java
// Maven项目标准结构
my-spring-boot-project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/demo/
│   │   │       ├── DemoApplication.java      // 主启动类
│   │   │       ├── controller/             // 控制器层
│   │   │       ├── service/                // 服务层
│   │   │       ├── repository/             // 数据访问层
│   │   │       └── entity/                 // 实体类
│   │   └── resources/
│   │       ├── application.properties        // 配置文件
│   │       ├── static/                     // 静态资源
│   │       └── templates/                  // 模板文件
│   └── test/
│       └── java/
│           └── com/example/demo/
│               └── DemoApplicationTests.java  // 测试类
├── pom.xml                                    // Maven配置文件
├── mvnw                                       // Maven Wrapper脚本
├── mvnw.cmd                                   // Windows Maven Wrapper
└── README.md                                  // 项目说明
```             
核心文件说明
- DemoApplication.java
SpringBoot应用的主启动类，包含main方法和@SpringBootApplication注解

- application.properties
应用配置文件，用于配置数据库连接、端口号等信息

- pom.xml
Maven项目配置文件，定义项目依赖、插件和构建配置

- static/
存放静态资源文件，如CSS、JavaScript、图片等

### 主启动类详解
```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```
                
@SpringBootApplication注解作用:启用自动配置：SpringBoot会根据当前环境自动配置项目，比如自动配置数据库连接池、数据源、事务管理器、缓存、消息队列、邮件发送等等。
- @Configuration: 标识配置类
- @EnableAutoConfiguration: 启用自动配置
- @ComponentScan: 组件扫描

#### 配置文件示例
application.properties:
```properties
# 服务器配置
server.port=8080
server.servlet.context-path=/api

# 数据库配置
spring.datasource.url=jdbc:mysql://localhost:3306/demo
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA配置
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# 日志配置
logging.level.com.example.demo=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
```      
application.yml (YAML格式):
```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    com.example.demo: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```           
### 常见问题解决
- 问题1：项目无法启动
  - 原因：端口被占用或配置错误
  - 解决：检查端口配置，修改application.properties

- 问题2：依赖下载失败
  - 原因：网络问题或Maven配置问题
  - 解决：配置Maven镜像源，检查网络连接

- 问题3：IDE无法识别项目
  - 原因：项目导入方式错误
  - 解决：使用"Import Project"导入Maven项目

> 调试技巧
> - 查看控制台日志信息
> - 检查Maven依赖是否正确下载
> - 确认Java版本兼容性
> - 验证SpringBoot版本与依赖版本匹配

### 最佳实践
项目命名规范
- 使用小写字母和连字符
- 避免使用特殊字符
- 名称要有意义和描述性

依赖选择建议
- 只添加必要的依赖
- 选择稳定版本
- 注意依赖之间的兼容性

项目结构建议
- 遵循Maven标准目录结构
- 按功能模块组织代码
- 保持包结构清晰

> 推荐配置:初学者建议使用Spring Initializr + IntelliJ IDEA的组合，简单高效




