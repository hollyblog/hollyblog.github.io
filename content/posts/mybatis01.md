---
title: "MyBatis-基础入门"
date: 2021-02-21T19:29:39+08:00
draft: false
description: "MyBatis-基础入门：MyBatis简介、环境搭建、第一个MyBatis程序、核心配置文件。"
tags: ["MyBatis","数据库"]
categories: ["Framework"]
---

## MyBatis 框架介绍
### 什么是MyBatis？
MyBatis 是一款优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。MyBatis 免除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。MyBatis 可以通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。

### MyBatis 核心概念
- SqlSessionFactory：MyBatis的核心，用于创建SqlSession实例
- SqlSession：执行SQL命令，获取映射器和管理事务的主要接口
- Mapper：映射器接口，定义数据库操作方法
- Configuration：MyBatis的配置信息，包含所有配置项
- MappedStatement：映射的SQL语句，包含SQL和相关配置
### MyBatis 核心特性
- SQL与Java代码分离： 支持XML配置SQL语句，也支持注解方式配置，保持清晰的代码结构

- 动态SQL支持：提供if、choose、when、otherwise、foreach等标签，根据条件动态生成SQL

- 结果集映射：自动映射查询结果到Java对象，支持复杂的嵌套映射

- 缓存机制：提供一级缓存（SqlSession级别）和二级缓存（Mapper级别）

- 事务管理：支持本地事务和分布式事务，与Spring事务无缝集成

- 插件机制： 支持拦截器扩展功能，可以自定义插件开发

### 框架对比
| 特性 | MyBatis | Hibernate | JPA |
| --- | --- | --- | --- |
| 类型 | 半自动ORM | 全自动ORM | 标准接口 |
| SQL控制 | 完全控制 | HQL/Criteria | JPQL |
| 学习成本 | 中等 | 较高 | 中等 |
| 性能 | 高 | 中等 | 中等 |
| 灵活性 | 高 | 中等 | 中等 |
### 应用场景
- Web应用
  - 企业级Web应用
  - 移动端API服务
  - 微服务架构
  - 数据分析平台
- 复杂查询
  - 复杂报表查询
  - 多表关联查询
  - 数据统计分析
  - 性能敏感的查询
- 遗留系统
  - 遗留系统改造
  - 数据库迁移
  - 存储过程调用
  - 自定义SQL优化
### 基本配置示例
以下是MyBatis的核心配置文件示例：
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>
  <!-- 属性配置 -->
  <properties>
    <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
    <property name="url" value="jdbc:mysql://localhost:3306/mybatis_demo"/>
  </properties>
  
  <!-- 设置 -->
  <settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
    <setting name="cacheEnabled" value="true"/>
  </settings>
  
  <!-- 环境配置 -->
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
      </dataSource>
    </environment>
  </environments>
  
  <!-- 映射器 -->
  <mappers>
    <mapper resource="mappers/UserMapper.xml"/>
  </mappers>
</configuration>
```
### 本章小结
本章我们学习了MyBatis框架的基本概念和核心特性。MyBatis作为一个半自动的ORM框架，在保持SQL灵活性的同时，简化了JDBC的复杂操作。它特别适合需要精确控制SQL的场景，如复杂查询、性能优化等。

## MyBatis 环境搭建
### 环境要求概览
- Java 环境JDK 8+ 推荐使用 JDK 11 或 JDK 17

- 构建工具Maven 3.6+: 用于项目依赖管理

- 数据库MySQL 5.7+ 或其他关系型数据库

- 开发工具: IntelliJ IDEA 或 Eclipse、VS Code
### 环境搭建步骤
1. JDK 环境配置

首先需要安装并配置 Java 开发环境：

- 下载并安装 JDK 8 或更高版本
- 配置 JAVA_HOME 环境变量
- 将 JDK 的 bin 目录添加到 PATH
- 验证安装：java -version
```shell
# 验证 Java 安装 
$ java -version 
java version "11.0.12" 2021-07-20 LTS Java(TM) SE Runtime Environment 18.9 (build 11.0.12+8-LTS-237) Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.12+8-LTS-237, mixed mode)
```
2. Maven 环境配置

Maven 是 Java 项目的依赖管理和构建工具：

- 下载并安装 Maven 3.6 或更高版本
- 配置 MAVEN_HOME 环境变量
- 将 Maven 的 bin 目录添加到 PATH
- 验证安装：mvn -version
```shell
# 验证 Maven 安装 
$ mvn -version 
Apache Maven 3.8.4 (9b656c72d54e5bacbed989b64718c159fe39b537) Maven home: /usr/local/apache-maven-3.8.4 Java version: 11.0.12, vendor: Oracle Corporation
```
3. IDE 开发工具

选择合适的集成开发环境：

- **IntelliJ IDEA**（推荐）：功能强大，对 Java 支持最好
- **Eclipse**：免费开源，插件丰富
- **VS Code**：轻量级，适合简单项目
> 推荐使用 IntelliJ IDEA，它对 MyBatis 有很好的支持，包括 SQL 语法高亮、自动补全等功能。

4. 数据库环境准备

准备数据库环境用于 MyBatis 连接：

- 安装 MySQL 5.7 或更高版本
- 启动 MySQL 服务
- 创建测试数据库
- 配置数据库用户权限
```shell
# 创建测试数据库 
CREATE DATABASE mybatis_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
# 创建测试用户（可选） 
CREATE USER 'mybatis_user'@'localhost' IDENTIFIED BY 'password123'; 
GRANT ALL PRIVILEGES ON mybatis_demo.* TO 'mybatis_user'@'localhost'; 
FLUSH PRIVILEGES;
```
5. 创建 Maven 项目

使用 Maven 创建标准的 Java 项目结构：
```shell
# 使用 Maven 原型创建项目 
mvn archetype:generate -DgroupId=com.example.mybatis \ -DartifactId=mybatis-demo \ -DarchetypeArtifactId=maven-archetype-quickstart \ -DinteractiveMode=false
```
### 项目目录结构
标准的 MyBatis 项目应该具有以下目录结构：
```text
mybatis-demo/ 
├── pom.xml # Maven 配置文件 
├── src/ 
│ ├── main/ 
│ │ ├── java/ # Java 源代码 
│ │ │ └── com/example/ 
│ │ │ ├── entity/ # 实体类（POJO） 
│ │ │ ├── mapper/ # Mapper 接口 
│ │ │ ├── service/ # 业务逻辑层 
│ │ │ └── util/ # 工具类 
│ │ └── resources/ # 资源文件 
│ │ ├── mybatis-config.xml # MyBatis 主配置文件 
│ │ ├── mappers/ # SQL 映射文件 
│ │ ├── db.properties # 数据库配置 
│ │ └── log4j.properties # 日志配置 
│ └── test/ # 测试代码 
│ └── java/ 
└── target/ # 编译输出目录
```
### MyBatis 依赖配置
在 pom.xml 中添加 MyBatis 相关依赖：
```xml
<!-- MyBatis 依赖 -->
<dependencies> 
<!-- MyBatis 核心依赖 --> 
<dependency> 
<groupId>org.mybatis</groupId> <artifactId>mybatis</artifactId> <version>3.5.13</version> 
</dependency> 
<!-- MySQL 驱动 --> 
<dependency> 
<groupId>mysql</groupId> 
<artifactId>mysql-connector-java</artifactId> 
<version>8.0.33</version> 
</dependency> 
<!-- 日志依赖 --> 
<dependency> 
<groupId>log4j</groupId> <artifactId>log4j</artifactId> 
<version>1.2.17</version> 
</dependency> 
<!-- 测试依赖 --> 
<dependency> 
<groupId>junit</groupId> 
<artifactId>junit</artifactId> 
<version>4.13.2</version> 
<scope>test</scope> 
</dependency> 
</dependencies>
```
### 环境验证
完成环境搭建后，可以通过以下方式验证：

验证清单
- ✅ Java 版本检查：java -version
- ✅ Maven 版本检查：mvn -version
- ✅ 数据库连接测试
- ✅ IDE 项目导入成功
- ✅ Maven 依赖下载完成
- ✅ 项目编译无错误：mvn compile
### 常见问题解决
- 问题 1：Java 版本不兼容
  - 现象：编译时出现版本不兼容错误
  - 解决：确保 JDK 版本 ≥ 8，并在 pom.xml 中指定正确的编译版本
- 问题 2：Maven 依赖下载失败
  - 现象：依赖包无法下载或下载缓慢
  - 解决：配置国内 Maven 镜像源，如阿里云镜像
- 问题 3：数据库连接失败
  - 现象：无法连接到 MySQL 数据库
  - 解决：检查数据库服务状态、连接参数、用户权限
### 本章小结
本章我们学习了MyBatis开发环境的完整搭建过程，包括JDK和Maven的安装配置、IDE开发工具的选择、数据库环境的准备、Maven项目的创建和依赖配置、项目目录结构的规范以及环境验证和问题排查。掌握了这些基础环境配置后，我们就可以开始MyBatis的实际开发了。

## 第一个MyBatis程序
## MyBatis工作流程
在开始编写第一个MyBatis程序之前，我们需要了解MyBatis的基本工作流程：

- **步骤1：读取配置文件**
加载mybatis-config.xml主配置文件，获取数据源和映射器配置信息。
- **步骤2：创建SqlSessionFactory**     根据配置文件创建SqlSessionFactory，这是MyBatis的核心工厂类。
- **步骤3：获取SqlSession** 从SqlSessionFactory获取SqlSession，这是执行SQL的会话对象。
- **步骤4：执行SQL语句**
通过SqlSession执行映射文件中定义的SQL语句。
- **步骤5：处理结果**
获取并处理SQL执行结果。
- **步骤6：关闭SqlSession**
释放数据库连接资源。

### 项目结构
我们的第一个MyBatis程序将包含以下文件：
```text
chapter-03-first-program/ 
├── src/ 
│ ├── main/ 
│ │ ├── java/ 
│ │ │ └── com/example/mybatis/firstprogram/ 
│ │ │ └── FirstProgramDemo.java 
│ │ └── resources/ 
│ │ ├── mybatis-config.xml # MyBatis主配置文件 
│ │ ├── db.properties # 数据库配置 
│ │ ├── log4j.properties # 日志配置 
│ │ ├── init.sql # 数据库初始化脚本 
│ │ └── mappers/ 
│ │ └── UserMapper.xml # SQL映射文件 
│ └── test/ 
│ └── java/ 
│ └── com/example/mybatis/firstprogram/ 
│ └── FirstProgramTest.java 
├── pom.xml 
└── README.md
```
### 核心配置文件
1. MyBatis主配置文件 (mybatis-config.xml)

这是MyBatis的核心配置文件，包含数据源配置和映射器配置：
```xml
<?xml version="1.0" encoding="UTF-8" ?> 
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dtd/mybatis-3-config.dtd"> 
<configuration> 
<!-- 引入数据库配置文件 --> 
<properties resource="db.properties"/> 
<!-- 环境配置 --> 
<environments default="development"> 
<environment id="development"> 
<transactionManager type="JDBC"/> 
<dataSource type="POOLED"> 
<property name="driver" value="${db.driver}"/> 
<property name="url" value="${db.url}"/> 
<property name="username" value="${db.username}"/> 
<property name="password" value="${db.password}"/> 
</dataSource> 
</environment> 
</environments> 
<!-- 映射器配置 --> 
<mappers> 
<mapper resource="mappers/UserMapper.xml"/> 
</mappers> 
</configuration>
```
2. 数据库配置文件 (db.properties)

将数据库连接信息单独配置，便于管理：
```properties
db.driver=com.mysql.cj.jdbc.Driver
db.url=jdbc:mysql://localhost:3306/mybatis_demo?useSSL=false&serverTimezone=UTC
db.username=root
db.password=123456
```
3. SQL映射文件 (UserMapper.xml)

定义SQL语句和参数映射：
```xml
<?xml version="1.0" encoding="UTF-8" ?> 
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd"> 
<mapper namespace="com.example.mybatis.mapper.UserMapper"> 
<!-- 查询所有用户 --> 
<select id="selectAllUsers" resultType="map"> 
SELECT id, username, email, create_time, update_time FROM user ORDER BY id 
</select> 
<!-- 根据ID查询用户 --> 
<select id="selectUserById" parameterType="int" resultType="map"> 
SELECT id, username, email, create_time, update_time FROM user WHERE id = #{id} 
</select> 
</mapper>
```
### Java代码实现
主程序类 (FirstProgramDemo.java)

演示MyBatis的基本使用方法：
```java
public class FirstProgramDemo { 
  public static void main(String[] args) { 
    System.out.println("MyBatis 第一个程序演示");
    demonstrateMyBatisBasics(); 
  } 
  private static void demonstrateMyBatisBasics() { 
    SqlSession sqlSession = null; 
    try { 
      // 1. 读取配置文件 
      String resource = "mybatis-config.xml"; 
      InputStream inputStream = Resources.getResourceAsStream(resource); 
      // 2. 创建SqlSessionFactory 
      SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream); 
      // 3. 获取SqlSession 
      sqlSession = sqlSessionFactory.openSession(); 
      // 4. 执行SQL语句 
      List<Map<String, Object>> users = sqlSession.selectList( "com.example.mybatis.mapper.UserMapper.selectAllUsers"); 
      // 5. 处理结果 
      System.out.println("查询结果: " + users.size() + " 条记录"); 
      } catch (IOException e) { 
        System.out.println("配置文件读取失败: " + e.getMessage()); 
      } catch (Exception e) { 
        System.out.println("MyBatis操作异常: " + e.getMessage()); 
      } finally { 
        // 6. 关闭SqlSession 
        if (sqlSession != null) { 
          sqlSession.close(); 
        } 
      } 
    } 
  }
```
### 数据库准备
在运行程序之前，需要创建数据库和表：
```sql
-- 创建数据库 
CREATE DATABASE IF NOT EXISTS mybatis_demo CHARACTER SET utf8mb4; 
-- 使用数据库 
USE mybatis_demo; 
-- 创建用户表 
CREATE TABLE user ( 
  id INT PRIMARY KEY AUTO_INCREMENT, 
  username VARCHAR(50) NOT NULL, 
  email VARCHAR(100) NOT NULL, 
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP, 
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
); 
-- 插入测试数据 
INSERT INTO user (username, email) VALUES   
('张三', 'zhangsan@example.com'), 
('李四', 'lisi@example.com'), 
('王五', 'wangwu@example.com');
```
### 测试验证
编写单元测试验证程序功能：
```java
@Test 
public void testSelectAllUsers() { 
  try { 
    String resource = "mybatis-config.xml"; 
    InputStream inputStream = Resources.getResourceAsStream(resource); 
    SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream); 
    try (SqlSession sqlSession = sqlSessionFactory.openSession()) {   
      List<Map<String, Object>> users = sqlSession.selectList( "com.example.mybatis.mapper.UserMapper.selectAllUsers"); 
      assertNotNull(users); 
      System.out.println("测试通过，查询到 " + users.size() + " 条记录"); 
    } 
  } catch (Exception e) { 
    fail("测试失败: " + e.getMessage()); 
  } 
}
```
### 核心概念理解
> SqlSessionFactory
> - MyBatis的核心工厂类，用于创建SqlSession
> - 全局唯一，线程安全，通常设计为单例
> - 包含了数据源配置和映射器配置信息

> SqlSession
> - 数据库会话对象，用于执行SQL语句
> - 线程不安全，不能在多线程间共享
> - 使用完毕后必须关闭以释放资源

> Mapper映射器
> - 定义SQL语句和参数映射的XML文件
> - 通过namespace和id唯一标识每个SQL语句
> - 支持参数映射和结果映射

### 注意事项
> 资源管理
> - 始终确保SqlSession被正确关闭
> - 推荐使用try-with-resources语句自动管理资源
> - SqlSessionFactory通常设计为全局单例

> 线程安全
> - SqlSessionFactory是线程安全的
> - SqlSession不是线程安全的，不要在多线程间共享
> - 每个线程都应该有自己的SqlSession实例

### 运行程序
- 确保MySQL服务已启动
- 执行init.sql脚本创建数据库和表
- 修改db.properties中的数据库连接信息
- 运行FirstProgramDemo.main()方法
- 运行测试用例验证功能

### 学习收获
通过本章的学习，你应该掌握了：

- MyBatis的基本工作流程
- 主配置文件的编写方法
- SQL映射文件的创建
- SqlSessionFactory和SqlSession的使用
- 基本的查询操作
- 资源管理的重要性

### 本章小结
本章我们创建了第一个MyBatis程序，学习了配置文件的编写、映射文件的创建，以及通过SqlSession执行数据库操作。通过实际的增删改查操作，深入理解了MyBatis的工作原理和基本用法。

## 核心配置文件
### MyBatis 配置文件概述
MyBatis 的核心配置文件（通常命名为 mybatis-config.xml）是整个框架的控制中心，它定义了数据库连接、事务管理、映射器注册等关键信息。

配置文件的基本结构
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <properties/>           <!-- 属性配置 -->
  <settings/>             <!-- 全局设置 -->
  <typeAliases/>          <!-- 类型别名 -->
  <typeHandlers/>         <!-- 类型处理器 -->
  <objectFactory/>        <!-- 对象工厂 -->
  <plugins/>              <!-- 插件 -->
  <environments/>          <!-- 环境配置 -->
  <databaseIdProvider/>   <!-- 数据库厂商标识 -->
  <mappers/>              <!-- 映射器 -->
</configuration>
```
> ⚠️ 注意：配置元素的顺序必须严格按照上述顺序排列，否则会导致解析错误。

### 核心配置元素详解
1. properties（属性配置）

用于定义配置属性，可以在配置文件的其他地方引用这些属性。
```xml
<!-- 基本属性配置 -->
<properties>
  <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
  <property name="url" value="jdbc:mysql://localhost:3306/mybatis_demo"/>
</properties>

<!-- 引用外部属性文件 -->
<properties resource="db.properties">
  <property name="username" value="root"/>
  <property name="password" value="123456"/>
</properties>
```
2. settings（全局设置）

这是 MyBatis 中极为重要的调整设置，它们会改变 MyBatis 的运行时行为。

| 设置名 | 描述 | 有效值 | 默认值 |
| --- | --- | --- | --- |
| cacheEnabled | 全局性地开启或关闭所有映射器配置文件中已配置的任何缓存 | true \| false | true |
| lazyLoadingEnabled | 延迟加载的全局开关 | true \| false | false |
| mapUnderscoreToCamelCase | 是否开启驼峰命名自动映射 | true \| false | false |
| logImpl | 指定 MyBatis 所用日志的具体实现 | SLF4J | LOG4J | LOG4J2 | JDK_LOGGING | COMMONS_LOGGING | STDOUT_LOGGING | NO_LOGGING | 未设置 |
```xml
<settings>
  <setting name="cacheEnabled" value="true"/>
  <setting name="lazyLoadingEnabled" value="true"/>
  <setting name="mapUnderscoreToCamelCase" value="true"/>
  <setting name="logImpl" value="LOG4J"/>
  <setting name="defaultExecutorType" value="REUSE"/>
</settings>
```
3. typeAliases（类型别名）

类型别名可为 Java 类型设置一个缩写名字，降低冗余的全限定类名书写。
```xml
<typeAliases>
  <!-- 单个别名定义 -->
  <typeAlias alias="User" type="com.example.model.User"/>
  
  <!-- 包扫描方式 -->
  <package name="com.example.model"/>
</typeAliases>
```
4. environments（环境配置）

MyBatis 可以配置成适应多种环境，例如开发、测试和生产环境。
```xml
<environments default="development">
  <!-- 开发环境 -->
  <environment id="development">
    <transactionManager type="JDBC"/>
    <dataSource type="POOLED">
      <property name="driver" value="${driver}"/>
      <property name="url" value="${url}"/>
      <property name="username" value="${username}"/>
      <property name="password" value="${password}"/>
    </dataSource>
  </environment>
  
  <!-- 生产环境 -->
  <environment id="production">
    <transactionManager type="MANAGED"/>
    <dataSource type="JNDI">
      <property name="data_source" value="java:comp/env/jdbc/mybatis"/>
    </dataSource>
  </environment>
</environments>
```
5. mappers（映射器）

告诉 MyBatis 到哪里去找映射文件。
```xml
<mappers>
  <!-- 使用相对于类路径的资源引用 -->
  <mapper resource="com/example/mapper/UserMapper.xml"/>
  
  <!-- 使用完全限定资源定位符（URL） -->
  <mapper url="file:///var/mappers/UserMapper.xml"/>
  
  <!-- 使用映射器接口实现类的完全限定类名 -->
  <mapper class="com.example.mapper.UserMapper"/>
  
  <!-- 将包内的映射器接口实现全部注册为映射器 -->
  <package name="com.example.mapper"/>
</mappers>
```
### 配置示例
基本配置示例
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <properties resource="db.properties"/>
  
  <settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
    <setting name="logImpl" value="STDOUT_LOGGING"/>
  </settings>
  
  <typeAliases>
    <package name="com.example.model"/>
  </typeAliases>
  
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  
  <mappers>
    <package name="com.example.mapper"/>
  </mappers>
</configuration>
```
高级配置示例
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <properties resource="db.properties"/>
  
  <settings>
    <setting name="cacheEnabled" value="true"/>
    <setting name="lazyLoadingEnabled" value="true"/>
    <setting name="aggressiveLazyLoading" value="false"/>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
    <setting name="logImpl" value="LOG4J"/>
    <setting name="defaultExecutorType" value="REUSE"/>
    <setting name="defaultStatementTimeout" value="25"/>
  </settings>
  
  <typeAliases>
    <typeAlias alias="User" type="com.example.model.User"/>
    <typeAlias alias="Order" type="com.example.model.Order"/>
  </typeAliases>
  
  <plugins>
    <plugin interceptor="com.github.pagehelper.PageInterceptor">
      <property name="helperDialect" value="mysql"/>
      <property name="reasonable" value="true"/>
    </plugin>
  </plugins>
  
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
        <property name="poolMaximumActiveConnections" value="20"/>
        <property name="poolMaximumIdleConnections" value="5"/>
      </dataSource>
    </environment>
  </environments>
  
  <mappers>
    <package name="com.example.mapper"/>
  </mappers>
</configuration>
```
### 配置最佳实践
1. 属性外部化

将数据库连接信息等敏感配置放在外部属性文件中，便于不同环境的配置管理。

2. 合理使用缓存

根据业务需求合理配置一级缓存和二级缓存，提高查询性能。

3. 日志配置

在开发环境启用详细日志，生产环境使用适当的日志级别。

4. 连接池优化

根据应用负载合理配置数据库连接池参数。

### 常见问题与解决方案
1. 配置文件解析错误
> - 问题：配置元素顺序错误导致解析失败
> - 解决：严格按照 DTD 定义的顺序排列配置元素
2. 属性引用失败
> - 问题：${property} 无法正确解析
> - 解决：确保属性在 properties 元素中正确定义
3. 映射器注册失败
> - 问题：找不到映射器接口或 XML 文件
> - 解决：检查包路径和文件路径是否正确
### 实践练习

- 创建一个支持开发和生产两种环境的配置文件
- 配置数据库连接池参数
- 启用驼峰命名自动映射
- 配置日志输出
- 注册映射器
### 本章小结
本章我们深入学习了MyBatis核心配置文件的各个组成部分，包括properties属性配置、settings全局设置、typeAliases类型别名、environments环境配置和mappers映射器注册。掌握这些配置要素是使用MyBatis的基础，合理的配置能够显著提升应用的性能和可维护性。

