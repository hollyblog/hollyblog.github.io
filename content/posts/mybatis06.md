---
title: "MyBatis-高级应用与实战"
date: 2021-02-24T15:40:39+08:00
draft: false
description: "MyBatis-高级应用与实战：SQL构建器、SpringBoot集成进阶、分页插件、SpringBoot扩展、性能优化进阶、测试与调试、最佳实践。"
tags: ["MyBatis","数据库"]
categories: ["Framework"]
---

## SQL构建器
### SQL构建器概述
MyBatis SQL构建器 是一个强大的工具，它允许开发者以编程方式构建SQL语句，而不是使用字符串拼接。这种方式提供了类型安全、代码复用和动态SQL生成的能力。

- 类型安全
编译时检查SQL语法，避免运行时错误，提供IDE智能提示支持。

- 动态生成
根据条件动态添加WHERE子句、JOIN操作和排序规则。

- 代码复用
SQL片段复用，通用查询模板，模块化SQL组件。

- 易维护
清晰的代码结构，易于调试和测试，版本控制友好。

### 技术栈
- MyBatis 3.5.13
- MySQL 8.0.33
- Java 17
- Maven
### 基础SQL构建
SQL构建器提供了流畅的API来构建各种类型的SQL语句

#### 查询SQL构建
```java
String selectSql = new SQL() 
  .SELECT("id, username, email, age") 
  .FROM("user") 
  .WHERE("id = #{id}") .toString();
```
```text
生成的SQL: 
SELECT id, username, email, age FROM user WHERE id = ?
```
#### 插入SQL构建
```java
String insertSql = new SQL() 
  .INSERT_INTO("user") 
  .VALUES("username", "#{username}") 
  .VALUES("email", "#{email}") 
  .VALUES("age", "#{age}") 
  .toString();
```
```text
生成的SQL: 
INSERT INTO user (username, email, age) VALUES (?, ?, ?)
```
### 动态SQL构建
SQL构建器的真正威力在于动态SQL的构建，可以根据运行时条件灵活生成SQL
```java
public String buildDynamicQuery(Map<String, Object> params) { 
  SQL sql = new SQL(); 
  sql.SELECT("*").FROM("user"); 
  if (params.get("username") != null) { 
    sql.WHERE("username LIKE CONCAT('%', #{username}, '%')"); 
  } 
  if (params.get("email") != null) { 
    sql.WHERE("email = #{email}"); 
  } 
  if (params.get("minAge") != null) { 
    sql.WHERE("age >= #{minAge}"); 
  } 
  sql.ORDER_BY("create_time DESC"); 
  return sql.toString(); 
}
```
```text
生成的SQL: 
SELECT * FROM user WHERE (username LIKE CONCAT('%', #{username}, '%') OR email = #{email}) AND age >= #{minAge} ORDER BY create_time DESC
```
### SQL提供者模式
通过@SelectProvider、@UpdateProvider等注解，可以将SQL构建逻辑与Mapper接口分离

#### Mapper接口定义
```java
@Mapper 
public interface UserMapper { 
  /**
   * 根据条件查询用户
   * @param params 查询参数
   * @return 用户列表
   */
  @SelectProvider(type = UserSqlProvider.class, method = "selectByCondition") List<User> selectByCondition(Map<String, Object> params); 
  /**
   * 根据条件更新用户
   * @param params 更新参数
   * @return 更新行数
   */
  @UpdateProvider(type = UserSqlProvider.class, method = "updateByCondition") int updateByCondition(Map<String, Object> params); 
}
```
#### SQL提供者类
```java
public class UserSqlProvider { 
  public String selectByCondition(Map<String, Object> params) { 
    SQL sql = new SQL(); 
    sql.SELECT("id", "username", "email", "age", "create_time") 
    .FROM("user"); 
    if (params.get("username") != null) { 
      sql.WHERE("username LIKE CONCAT('%', #{username}, '%')"); 
    } 
    if (params.get("email") != null) { 
      sql.WHERE("email = #{email}"); 
    } 
    if (params.get("minAge") != null) { 
      sql.WHERE("age >= #{minAge}"); 
    } 
    sql.ORDER_BY("create_time DESC"); 
    return sql.toString(); 
  } 
}
```
### 内联SQL构建器
对于简单的动态SQL，可以直接在Mapper接口中使用内联构建器
```java
/**
 * 动态构建用户查询SQL（使用MyBatis SQL工具类，避免拼接字符串）
 * @param username 用户名（模糊匹配，可为null）
 * @param minAge 最小年龄（范围匹配，可为null）
 * @return 动态生成的SQL语句
 */
static String buildInlineQuery(
        @Param("username") String username,
        @Param("minAge") Integer minAge) {
    
    return new org.apache.ibatis.jdbc.SQL() {
        {
            // 基础查询配置
            SELECT("*");
            FROM("user");
            
            // 动态条件：用户名模糊查询（非空时生效）
            if (username != null) {
                WHERE("username LIKE CONCAT('%', #{username}, '%')");
            }
            
            // 动态条件：最小年龄过滤（非空时生效）
            if (minAge != null) {
                WHERE("age >= #{minAge}");
            }
            
            // 排序规则
            ORDER_BY("create_time DESC");
        }
    }.toString();
}
```
### 高级特性
#### 复杂查询构建
```java
// 构建用户-帖子关联查询SQL（LEFT JOIN）
String joinSql = new SQL()
        .SELECT("u.id, u.username, u.email")  // 查询用户字段
        .SELECT("p.title, p.content")         // 查询帖子字段
        .FROM("user u")                       // 主表：用户表（别名u）
        .LEFT_OUTER_JOIN("post p ON u.id = p.user_id")  // 左关联帖子表（别名p）
        .WHERE("u.status = 'ACTIVE'")         // 过滤条件：仅活跃用户
        .ORDER_BY("u.create_time DESC")       // 排序规则：按用户创建时间降序
        .toString();
```
#### 批量操作
```java
/**
 * 构建用户表批量插入SQL（动态适配List长度）
 * @param users 待插入的用户列表
 * @return 批量插入SQL语句
 */
public String buildBatchInsert(@Param("users") List<User> users) {
    SQL sql = new SQL();
    
    // 基础插入配置：指定表名和字段列
    sql.INSERT_INTO("user")
       .INTO_COLUMNS("username", "email", "age");

    // 动态构建VALUES子句（适配列表中每个用户的参数）
    for (int i = 0; i < users.size(); i++) {
        sql.INTO_VALUES(
            "#{users[" + i + "].username}",
            "#{users[" + i + "].email}",
            "#{users[" + i + "].age}"
        );
    }

    return sql.toString();
}
```
#### 最佳实践
- 简单查询使用注解：对于简单的CRUD操作，直接使用@Select、@Insert等注解
- 复杂查询使用构建器：对于动态条件、复杂关联的查询使用SQL构建器
- 代码复用：将通用的SQL构建逻辑抽取为独立方法
- 类型安全：充分利用构建器的类型安全特性，避免字符串拼接
- 性能考虑：对于频繁调用的SQL，考虑缓存构建结果
- 测试覆盖：为SQL构建器编写充分的单元测试
### 实践练习
- 创建一个用户查询的SQL构建器，支持按用户名、邮箱、年龄范围进行动态查询
- 实现一个批量更新的SQL构建器，根据不同条件更新不同字段
- 构建一个复杂的统计查询，包含分组、聚合函数和HAVING子句
- 设计一个通用的分页查询构建器，支持动态排序和条件过滤
### 本章小结
本章学习了 MyBatis SQL构建器 的相关内容，包括：

- SQL构建器概述：了解了SQL构建器的核心概念和优势
- 基础SQL构建：掌握了基本的SELECT、INSERT、UPDATE、DELETE语句构建
- 动态SQL构建：学会了根据条件动态生成SQL语句
- SQL提供者模式：理解了如何将SQL构建逻辑与Mapper接口分离
- 内联SQL构建器：掌握了在Mapper接口中直接使用构建器的方法
- 高级特性：学习了复杂查询、批量操作等高级用法
- 最佳实践：了解了SQL构建器的最佳实践和注意事项

## Spring Boot集成进阶
### 技术栈
- Spring Boot 2.7.0
- MyBatis 3.5.13
- MyBatis Spring Boot Starter 2.3.1
- MySQL 8.0.33
- Java 17
- Maven
### Spring Boot集成概述
MyBatis Spring Boot集成进阶涵盖了在Spring Boot环境中使用MyBatis的高级配置和最佳实践。通过MyBatis Spring Boot Starter，我们可以享受自动配置的便利，同时掌握多数据源、事务管理等高级特性。

- 自动配置
零配置启动，自动装配SqlSessionFactory和数据源，开箱即用。

- 灵活配置
支持application.yml配置，可自定义MyBatis行为和数据源属性。

- 事务集成
与Spring事务管理无缝集成，支持声明式和编程式事务。

- 多数据源
支持多数据源配置，满足复杂业务场景的数据访问需求。

### 快速开始
通过MyBatis Spring Boot Starter，我们可以快速在Spring Boot项目中集成MyBatis。

#### Maven依赖配置
```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.3.1</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
```
#### 基础配置
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mybatis_demo
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.entity
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```
### 自动配置原理
MyBatis Spring Boot Starter通过自动配置机制，为我们提供了开箱即用的功能。

#### 主启动类配置
```java
@SpringBootApplication
@MapperScan("com.example.mapper")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
#### Mapper接口定义
```java
@Mapper
public interface UserMapper {
    
    @Select("SELECT * FROM user WHERE id = #{id}")
    User findById(@Param("id") Long id);
    
    @Insert("INSERT INTO user(username, email) VALUES(#{username}, #{email})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);
    
    @Update("UPDATE user SET username = #{username} WHERE id = #{id}")
    int update(User user);
    
    @Delete("DELETE FROM user WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}
```
### 多数据源配置
在复杂的企业应用中，经常需要配置多个数据源。Spring Boot提供了灵活的多数据源配置方案：

#### 多数据源配置
```yaml
# application.yml
spring:
  datasource:
    primary:
      url: jdbc:mysql://localhost:3306/primary_db
      username: root
      password: password
      driver-class-name: com.mysql.cj.jdbc.Driver
    secondary:
      url: jdbc:mysql://localhost:3306/secondary_db
      username: root
      password: password
      driver-class-name: com.mysql.cj.jdbc.Driver
```
#### 数据源配置类
```java
@Configuration
public class DataSourceConfig {
    
    @Primary
    @Bean("primaryDataSource")
    @ConfigurationProperties("spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean("secondaryDataSource")
    @ConfigurationProperties("spring.datasource.secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```
### 本章小结
本章深入学习了MyBatis与Spring Boot的集成进阶内容，包括

- Spring Boot自动配置原理和MyBatis Starter的使用
- 高级配置技巧，包括多数据源和事务管理
- Mapper接口的注解式开发和最佳实践
- 性能优化和常见问题的解决方案

## 分页插件
### 技术栈
- PageHelper 5.3.2
- MyBatis 3.5.13
- Spring Boot 2.7.14
- MySQL 8.0.33
### 什么是PageHelper？
PageHelper 是MyBatis的一个分页插件，支持任何复杂的单表、多表分页查询。它通过拦截器机制，在执行查询前自动添加分页SQL，无需修改原有的Mapper文件，使用简单方便。

### 核心特性
- 自动分页
自动识别分页查询，添加LIMIT语句

- 多数据库支持
支持MySQL、Oracle、PostgreSQL等多种数据库

- 零侵入
无需修改现有Mapper文件和SQL语句

- 灵活配置
支持多种配置方式和参数设置

### 依赖配置
```xml
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.4.6</version>
</dependency>
```
### 配置文件
```yaml
# application.yml
pagehelper:
  helper-dialect: mysql
  reasonable: true
  support-methods-arguments: true
  params: count=countSql
  page-size-zero: true
```
### 基本使用
```java
@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    public PageInfo<User> findUsers(int pageNum, int pageSize) {
        // 开启分页
        PageHelper.startPage(pageNum, pageSize);
        
        // 执行查询
        List<User> users = userMapper.selectAll();
        
        // 封装分页信息
        return new PageInfo<>(users);
    }
}
```
### 分页信息
```java
PageInfo<User> pageInfo = userService.findUsers(1, 10);

// 分页信息
int pageNum = pageInfo.getPageNum();        // 当前页
int pageSize = pageInfo.getPageSize();      // 页面大小
long total = pageInfo.getTotal();           // 总记录数
int pages = pageInfo.getPages();            // 总页数
List<User> list = pageInfo.getList();       // 结果集
boolean hasNextPage = pageInfo.isHasNextPage(); // 是否有下一页
```
### 本章小结
本章学习了PageHelper分页插件的使用方法。PageHelper提供了简单易用的分页功能，通过拦截器机制自动处理分页逻辑，大大简化了分页查询的实现。主要内容包括：

- PageHelper插件的安装和配置
- 基本分页查询的实现方法
- 分页信息的获取和处理
- 分页插件的高级特性和优化技巧

## 性能优化进阶
### 技术栈
- MyBatis 3.5.13
- Spring Boot 2.7.14
- MySQL 8.0.33
- HikariCP
- Redis 6.2
### 学习目标
- 性能瓶颈分析
理解MyBatis性能瓶颈和优化原理

- SQL优化技巧
掌握SQL语句优化和索引使用技巧

- 缓存与监控
学习缓存策略和性能监控方法

### 性能优化概述
性能优化 是MyBatis应用开发中的重要环节。通过合理的SQL设计、缓存策略、连接池配置等手段，可以显著提升应用的响应速度和并发处理能力。

### 优化策略
- SQL优化
优化查询语句，合理使用索引，避免全表扫描

- 缓存策略
合理配置一级缓存和二级缓存，减少数据库访问

- 连接池优化
配置合适的连接池参数，提高连接复用率

- 批量操作
使用批量插入、更新，减少网络开销

### SQL优化技巧
```sql
-- 避免SELECT *，只查询需要的字段
SELECT id, name, email FROM user WHERE stus = 1;

-- 使用索引字段进行查询
SELECT * FROM user WHERE id = #{id};

-- 避免在WHERE子句中使用函数
-- 错误示例
SELECT * FROM user WHERE YEAR(create_time) = 2023;
-- 正确示例
SELECT * FROM user WHERE create_time >= '2023-01-01' 
  AND create_time < '2024-01-01';
```
### 缓存配置优化
```sql
<!-- 二级缓存配置 -->
<cache 
  eviction="LRU"
  flushInterval="60000"
  size="512"
  readOnly="true"/>

<!-- 查询结果缓存 -->
<select id="selectUser" resultType="User" useCache="true">
  SELECT * FROM user WHERE id = #{id}
</select>
```
### 批量操作优化
```java
// 批量插入
@Mapper
public interface UserMapper {
    
    void batchInsert(@Param("users") List<User> users);
    
    void batchUpdate(@Param("users") List<User> users);
}

// Service层使用
@Service
public class UserService {
    
    @Transactional
    public void batchSaveUsers(List<User> users) {
        // 分批处理，避免内存溢出
        int batchSize = 1000;
        for (int i = 0; i < users.size(); i += batchSize) {
            int end = Math.min(i + batchSize, users.size());
            List<User> batch = users.subList(i, end);
            userMapper.batchInsert(batch);
        }
    }
}
```
### 连接池配置
```yaml
# HikariCP配置
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```
### 性能监控
监控要点

- SQL执行时间和频率
- 缓存命中率
- 连接池使用情况
- 内存使用和GC情况
### 本章小结
本章学习了MyBatis的性能优化进阶技巧。性能优化是一个系统工程，需要从SQL设计、缓存策略、连接池配置等多个方面综合考虑。主要内容包括：

- SQL语句优化和索引使用技巧
- 缓存机制的合理配置和使用
- 连接池参数的优化配置
- 批量操作和性能监控方法

## 测试与调试
### 技术栈
- Spring Boot
2.7.14
- MyBatis
3.5.13
- MySQL
8.0.33
- JUnit
5.8.2
- H2 Database
2.1.214
### 学习目标
- 掌握测试策略
理解MyBatis应用测试的重要性和测试策略

- 单元测试技能
掌握单元测试和集成测试的方法

- 测试数据库
学习测试数据库的配置和使用

- Mock测试
熟悉Mock测试和事务回滚

- 质量保证
掌握测试覆盖率和质量保证

### 测试策略概述
测试 是保证MyBatis应用质量的重要手段。通过合理的测试策略，包括单元测试、集成测试、性能测试等，可以确保代码的正确性、稳定性和可维护性。

### 测试类型
- 单元测试
测试单个Mapper方法的功能正确性

- 集成测试
测试MyBatis与数据库的集成功能

- 性能测试
测试SQL执行性能和并发处理能力

- Mock测试
使用Mock对象模拟数据库操作

### 测试依赖配置
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter-test</artifactId>
    <version>2.3.1</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```
### 测试配置
```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  h2:
    console:
      enabled: true
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql
      data-locations: classpath:data.sql
```
### 单元测试示例
```java
@MybatisTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserMapperTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserMapper userMapper;
    
    @Test
    @Transactional
    @Rollback
    void testSelectUser() {
        // 准备测试数据
        User user = new User();
        user.setName("Test User");
        user.setEmail("test@example.com");
        entityManager.persistAndFlush(user);
        
        // 执行测试
        User result = userMapper.selectById(user.getId());
        
        // 验证结果
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test User");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
    }
}
```
### 集成测试示例
```java
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class UserServiceIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    @Rollback
    void testCreateAndFindUser() {
        // 创建用户
        User user = new User();
        user.setName("Integration Test User");
        user.setEmail("integration@example.com");
        
        Long userId = userService.createUser(user);
        
        // 查询用户
        User foundUser = userService.findById(userId);
        
        // 验证结果
        assertThat(foundUser).isNotNull();
        assertThat(foundUser.getName()).isEqualTo("Integration Test User");
    }
}
```
### Mock测试示例
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserMapper userMapper;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void testFindUserById() {
        // 准备Mock数据
        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setName("Mock User");
        
        when(userMapper.selectById(1L)).thenReturn(mockUser);
        
        // 执行测试
        User result = userService.findById(1L);
        
        // 验证结果
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Mock User");
        verify(userMapper).selectById(1L);
    }
}
```
### 测试最佳实践
测试原则

- 测试应该快速、可重复、独立
- 使用内存数据库进行测试
- 每个测试方法只测试一个功能点
- 使用事务回滚保证测试数据隔离
- 编写有意义的断言和错误消息
### 本章小结
本章学习了MyBatis应用的测试方法，包括：

- 单元测试和集成测试的实现方法
- 测试数据库的配置和使用技巧
- Mock测试和事务回滚的应用
- 测试覆盖率和质量保证策略
- 测试最佳实践和开发规范
> 测试是保证代码质量的重要手段，应该贯穿整个开发生命周期。先测试再编写代码，测试结果再修改代码。

## 最佳实践
### 技术栈
- Spring Boot
v2.7.0

- MyBatis
v3.5.10

- MySQL
v8.0

- Maven
v3.8.6

- Druid
v1.2.11

### 学习目标
- 最佳实践掌握
学习MyBatis开发中的最佳实践和编码规范

- 反模式识别
了解常见的反模式和避免方法

- 项目结构设计
掌握合理的项目结构和代码组织方式

- 安全与性能
学习安全防护和性能优化技巧

### 最佳实践概述
在MyBatis开发过程中总结出的经验和技巧。遵循这些实践可以提高代码质量、开发效率和系统性能，同时降低维护成本和出错概率。

### 核心原则
- 简洁明了
保持代码简洁，逻辑清晰，易于理解和维护

- 性能优先
优化SQL查询，合理使用缓存，提升系统性能

- 安全可靠
防止SQL注入，保护敏感数据，确保系统安全

- 可维护性
良好的代码结构，完善的文档，便于团队协作

### 编码最佳实践
1. Mapper接口设计
```java
// ✅ 好的实践
@Mapper
public interface UserMapper {
    
    // 方法名清晰表达意图
    User selectByPrimaryKey(Long id);
    
    // 使用具体的参数类型
    List<User> selectByCondition(UserQuery query);
    
    // 批量操作使用List参数
    int batchInsert(@Param("users") List<User> users);
}
```
2. SQL语句编写
```xml
<!-- ✅ 好的实践 -->
<select id="selectUsers" resultType="User">
    SELECT 
        id,
        username,
        email,
        create_time
    FROM user 
    WHERE status = 1
    <if test="keyword != null and keyword != ''">
        AND (username LIKE CONCAT('%', #{keyword}, '%')
        OR email LIKE CONCAT('%', #{keyword}, '%'))
    </if>
    ORDER BY create_time DESC
    LIMIT #{offset}, #{limit}
</select>
```
### 常见反模式
1. 避免SELECT *
```sql
-- ❌ 不好的实践
SELECT * FROM user WHERE id = #{id};

-- ✅ 好的实践
SELECT id, username, email, status 
FROM user WHERE id = #{id};
```
2. 避免N+1查询问题
```xml
<!-- ❌ 会产生N+1查询 -->
<select id="selectUser" resultMap="userMap">
    SELECT * FROM user WHERE id = #{id}
</select>

<!-- ✅ 使用关联查询 -->
<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
    SELECT u.*, o.id as order_id, o.amount
    FROM user u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```
### 项目结构设计
```text
src/main/java/
├── com/example/
│   ├── config/          # 配置类
│   │   ├── MybatisConfig.java
│   │   └── DataSourceConfig.java
│   ├── entity/          # 实体类
│   │   ├── User.java
│   │   └── Order.java
│   ├── mapper/          # Mapper接口
│   │   ├── UserMapper.java
│   │   └── OrderMapper.java
│   ├── service/         # 业务逻辑
│   │   ├── UserService.java
│   │   └── OrderService.java
│   └── dto/             # 数据传输对象
│       ├── UserQuery.java
│       └── OrderQuery.java

src/main/resources/
├── mappers/             # Mapper XML文件
│   ├── UserMapper.xml
│   └── OrderMapper.xml
├── application.yml      # 配置文件
└── schema.sql          # 数据库脚本
```
### 安全防护
防止SQL注入
```xml
<!-- ✅ 使用参数绑定 -->
<select id="selectByName" resultType="User">
    SELECT * FROM user WHERE username = #{username}
</select>

<!-- ❌ 避免字符串拼接 -->
<select id="selectByName" resultType="User">
    SELECT * FROM user WHERE username = '${username}'
</select>
```
### 性能优化建议
- 索引优化：为常用查询字段创建合适的索引
- 分页查询：使用LIMIT进行分页，避免查询大量数据
- 缓存策略：合理使用一级缓存和二级缓存
- 批量操作：使用批量插入、更新减少数据库交互
- 连接池配置：合理配置连接池参数
### 开发工具推荐
- MyBatis Generator
自动生成Mapper接口和XML文件

- MyBatis Plus
增强MyBatis功能的开发框架

- PageHelper
简化分页查询的插件

- Druid
高性能的数据库连接池

### 本章小结
本章总结了MyBatis开发的最佳实践。这些实践是在实际项目中积累的宝贵经验，遵循这些原则可以帮助我们写出高质量、高性能、易维护的MyBatis应用。

