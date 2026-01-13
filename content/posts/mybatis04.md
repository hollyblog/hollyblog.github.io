---
title: "MyBatis-框架集成"
date: 2021-02-22T15:40:39+08:00
draft: false
description: "MyBatis-框架集成：Spring集成、SpringBoot集成、MyBatis-Plus、性能优化等。"
tags: ["MyBatis","数据库"]
categories: ["Framework"]
---

## Spring集成
### 1. Spring集成概述
#### 1.1 集成的优势
MyBatis与Spring集成带来以下优势

- 依赖注入：自动管理Mapper接口和服务层依赖
- 事务管理：声明式事务支持，简化事务处理
- 配置管理：统一的配置管理和环境切换
- 测试支持：完善的测试框架和模拟支持
- AOP支持：面向切面编程，增强功能
#### 1.2 集成方式
Spring与MyBatis有多种集成方式

- XML配置：传统的XML配置方式
- Java配置：基于@Configuration的配置
- 混合配置：XML和Java配置结合
- Spring Boot：自动配置和起步依赖
### 2. 依赖配置
#### 2.1 Maven依赖
```xml
<dependencies>
    <!-- Spring Core -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>5.3.21</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-jdbc</artifactId>
        <version>5.3.21</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-tx</artifactId>
        <version>5.3.21</version>
    </dependency>
    
    <!-- MyBatis -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.13</version>
    </dependency>
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis-spring</artifactId>
        <version>2.1.0</version>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid</artifactId>
        <version>1.2.18</version>
    </dependency>
</dependencies>
```
### 3. XML配置方式
#### 3.1 Spring配置文件
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:tx="http://www.springframework.org/schema/tx"
       xsi:schemaLocation="
           http://www.springframework.org/schema/beans
           http://www.springframework.org/schema/beans/spring-beans.xsd
           http://www.springframework.org/schema/context
           http://www.springframework.org/schema/context/spring-context.xsd
           http://www.springframework.org/schema/tx
           http://www.springframework.org/schema/tx/spring-tx.xsd">

    <!-- 启用注解扫描 -->
    <context:component-scan base-package="com.mybatis.spring"/>
    
    <!-- 加载属性文件 -->
    <context:property-placeholder location="classpath:db.properties"/>
    
    <!-- 配置数据源 -->
    <bean id="dataSource" class="com.alibaba.druid.pool.DruidDataSource">
        <property name="driverClassName" value="${jdbc.driver}"/>
        <property name="url" value="${jdbc.url}"/>
        <property name="username" value="${jdbc.username}"/>
        <property name="password" value="${jdbc.password}"/>
    </bean>
    
    <!-- 配置SqlSessionFactory -->
    <bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
        <property name="dataSource" ref="dataSource"/>
        <property name="configLocation" value="classpath:mybatis-config.xml"/>
        <property name="mapperLocations" value="classpath:mapper/*.xml"/>
    </bean>
    
    <!-- 配置Mapper扫描 -->
    <bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
        <property name="basePackage" value="com.mybatis.spring.mapper"/>
    </bean>
    
    <!-- 配置事务管理器 -->
    <bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource"/>
    </bean>
    
    <!-- 启用事务注解 -->
    <tx:annotation-driven transaction-manager="transactionManager"/>
    
</beans>
```
#### 3.2 MyBatis配置文件
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    
    <settings>
        <setting name="logImpl" value="LOG4J"/>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <setting name="cacheEnabled" value="true"/>
        <setting name="lazyLoadingEnabled" value="true"/>
        <setting name="aggressiveLazyLoading" value="false"/>
    </settings>
    
    <typeAliases>
        <package name="com.mybatis.spring.entity"/>
    </typeAliases>
    
</configuration>
```
### 4. Java配置方式
#### 4.1 配置类
```java
@Configuration
@PropertySource("classpath:db.properties")
@EnableTransactionManagement
public class DatabaseConfig {
    
    @Value("${jdbc.driver}")
    private String driverClassName;
    
    @Value("${jdbc.url}")
    private String url;
    
    @Value("${jdbc.username}")
    private String username;
    
    @Value("${jdbc.password}")
    private String password;
    
    /**
     * 配置数据源
     */
    @Bean
    public DataSource dataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName(driverClassName);
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        
        // 连接池配置
        dataSource.setInitialSize(5);
        dataSource.setMinIdle(5);
        dataSource.setMaxActive(20);
        dataSource.setMaxWait(60000);
        
        return dataSource;
    }
    
    /**
     * 配置SqlSessionFactory
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        
        // 设置MyBatis配置文件位置
        factoryBean.setConfigLocation(
            new PathMatchingResourcePatternResolver().getResource("classpath:mybatis-config.xml"));
        
        // 设置Mapper XML文件位置
        factoryBean.setMapperLocations(
            new PathMatchingResourcePatternResolver().getResources("classpath:mapper/*.xml"));
        
        return factoryBean.getObject();
    }
    
    /**
     * 配置Mapper扫描
     */
    @Bean
    public MapperScannerConfigurer mapperScannerConfigurer() {
        MapperScannerConfigurer configurer = new MapperScannerConfigurer();
        configurer.setBasePackage("com.mybatis.spring.mapper");
        return configurer;
    }
    
    /**
     * 配置事务管理器
     */
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```
### 5. 依赖注入
#### 5.1 Mapper接口注入
```java 
@Service
public class UserServiceImpl implements UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Override
    public Long createUser(User user) {
        userMapper.insertUser(user);
        return user.getId();
    }
    
    @Override
    public User getUserById(Long id) {
        return userMapper.selectUserById(id);
    }
    
    @Override
    public List<User> getAllUsers() {
        return userMapper.selectAllUsers();
    }
}
```
#### 5.2 服务层注入
```java
public class SpringIntegrationDemo {
    public static void main(String[] args) {
        // 加载Spring配置文件
        ApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");
        
        // 获取UserService Bean
        UserService userService = context.getBean(UserService.class);
        
        // 使用服务
        User user = new User("spring_user", "spring@example.com");
        Long userId = userService.createUser(user);
        System.out.println("创建用户成功，ID: " + userId);
    }
}
```
### 6. 事务管理
#### 6.1 声明式事务
```java
@Service
public class UserServiceImpl implements UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    /**
     * 带事务的创建用户方法
     */
    @Transactional(rollbackFor = Exception.class)
    public Long createUserWithTransaction(String username, String email, boolean shouldFail) throws Exception {
        User user = new User(username, email);
        userMapper.insertUser(user);
        
        if (shouldFail) {
            throw new Exception("模拟业务异常，触发事务回滚");
        }
        
        return user.getId();
    }
    
    /**
     * 批量操作事务
     */
    @Transactional
    public int batchCreateUsers() {
        List<User> users = new ArrayList<>();
        users.add(new User("batch_user1", "batch1@example.com"));
        users.add(new User("batch_user2", "batch2@example.com"));
        users.add(new User("batch_user3", "batch3@example.com"));
        
        return userMapper.batchInsertUsers(users);
    }
}
```
#### 6.2 事务传播行为

| 传播行为	| 说明
| ---------- | ----------
| REQUIRED	| 如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务
| REQUIRES_NEW	| 创建一个新的事务，如果当前存在事务，则把当前事务挂起
| SUPPORTS	| 如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务的方式继续运行
| NOT_SUPPORTED	| 以非事务方式运行，如果当前存在事务，则把当前事务挂起
| NEVER	| 以非事务方式运行，如果当前存在事务，则抛出异常
| MANDATORY	| 如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常
| NESTED	| 如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来运行
### 7. 连接池配置
#### 7.1 Druid连接池配置
```properties
# 数据库连接配置
jdbc.driver=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/mybatis_spring?useSSL=false&serverTimezone=UTC&characterEncoding=utf8
jdbc.username=root
jdbc.password=123456

# 连接池配置
jdbc.initialSize=5
jdbc.minIdle=5
jdbc.maxActive=20
jdbc.maxWait=60000
jdbc.timeBetweenEvictionRunsMillis=60000
jdbc.minEvictableIdleTimeMillis=300000
jdbc.validationQuery=SELECT 1 FROM DUAL
jdbc.testWhileIdle=true
jdbc.testOnBorrow=false
jdbc.testOnReturn=false
```
#### 7.2 连接池监控
```java
@Bean
public DataSource dataSource() {
    DruidDataSource dataSource = new DruidDataSource();
    
    // 基本配置
    dataSource.setDriverClassName(driverClassName);
    dataSource.setUrl(url);
    dataSource.setUsername(username);
    dataSource.setPassword(password);
    
    // 连接池配置
    dataSource.setInitialSize(5);
    dataSource.setMinIdle(5);
    dataSource.setMaxActive(20);
    dataSource.setMaxWait(60000);
    
    // 监控配置
    dataSource.setTimeBetweenEvictionRunsMillis(60000);
    dataSource.setMinEvictableIdleTimeMillis(300000);
    dataSource.setValidationQuery("SELECT 1 FROM DUAL");
    dataSource.setTestWhileIdle(true);
    dataSource.setTestOnBorrow(false);
    dataSource.setTestOnReturn(false);
    
    // 开启监控统计
    try {
        dataSource.setFilters("stat,wall");
    } catch (SQLException e) {
        e.printStackTrace();
    }
    
    return dataSource;
}
```
### 8. 测试支持
#### 8.1 Spring测试配置
```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:applicationContext.xml"})
@Transactional
public class SpringIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    public void testCreateAndQueryUser() {
        // 创建用户
        User user = new User("test_user", "test@example.com");
        Long userId = userService.createUser(user);
        System.out.println("创建用户ID: " + userId);
        
        // 查询用户
        User foundUser = userService.getUserById(userId);
        System.out.println("查询到的用户: " + foundUser);
        
        // 验证
        assert foundUser != null;
        assert "test_user".equals(foundUser.getUsername());
        assert "test@example.com".equals(foundUser.getEmail());
    }
    
    @Test
    public void testTransactionRollback() {
        try {
            userService.createUserWithTransaction("rollback_user", "rollback@example.com", true);
        } catch (Exception e) {
            System.out.println("事务回滚测试: " + e.getMessage());
        }
        
        // 验证用户没有被创建
        User user = userService.getUserByUsername("rollback_user");
        assert user == null;
        System.out.println("事务回滚验证成功");
    }
}
```
### 9. 性能优化
#### 9.1 连接池优化
- 合理设置连接池大小：根据并发量调整initialSize、minIdle、maxActive
- 连接验证：配置validationQuery和testWhileIdle
- 连接回收：设置合理的timeBetweenEvictionRunsMillis
- 监控统计：开启Druid监控，分析SQL性能
####  9.2 事务优化
- 事务范围：尽量缩小事务范围，避免长事务
- 只读事务：对于查询操作使用readOnly=true
- 传播行为：合理选择事务传播行为
- 异常处理：明确指定rollbackFor异常类型
### 10. 常见问题与解决方案
#### 10.1 Mapper注入失败
> 问题：@Autowired注入Mapper接口时报错
> 
> 解决：
> - 检查MapperScannerConfigurer的basePackage配置
> - 确保Mapper接口在正确的包路径下
> - 验证SqlSessionFactory配置是否正确
#### 10.2 事务不生效
> 问题：@Transactional注解不生效
> 
> 解决：
> - 确保启用了@EnableTransactionManagement或< tx:annotation-driven>
> - 检查方法是否为public
> - 避免在同一个类中调用@Transactional方法
> - 确保异常类型在rollbackFor范围内
#### 10.3 连接池配置问题
> 问题：数据库连接超时或连接泄漏
> 
> 解决：
> - 合理配置maxWait和连接池大小
> - 开启连接泄漏检测
> - 配置连接验证和回收机制
> - 监控连接池状态
### 11. 最佳实践
#### 11.1 配置管理
- 环境分离：使用Profile管理不同环境配置
- 外部化配置：将数据库连接等配置外部化存储（如.properties文件）
- 配置加密：对敏感信息进行加密处理
- 配置验证：启动时验证关键配置项
#### 11.2 代码组织
- 分层架构：明确Controller、Service、Mapper职责
- 接口设计：面向接口编程，便于测试和扩展
- 异常处理：统一异常处理机制
- 日志记录：合理配置日志级别和输出
### 12.  实践练习
练习任务
1. 配置MyBatis与Spring的XML集成
2. 实现用户管理的CRUD操作
3. 配置声明式事务管理
4. 编写单元测试验证功能
5. 配置Druid连接池监控
6. 实现Java配置方式的集成
7. 测试事务回滚机制
8. 优化连接池和事务配置
### 13.  运行示例程序
运行步骤
- 创建数据库：执行init.sql脚本
- 配置数据库：修改db.properties文件
- 编译项目：mvn clean compile
- 运行主程序：java SpringIntegrationDemo
- 运行测试：mvn test
- 查看监控：访问Druid监控页面

注意事项
- 确保MySQL服务已启动
- 检查数据库连接配置
- 注意Spring和MyBatis版本兼容性
- 观察事务和连接池的行为

## Spring Boot集成
### 1. Spring Boot集成概述
#### 1.1 集成优势
- 自动配置
Spring Boot提供MyBatis自动配置，减少手动配置工作

- 起步依赖
通过starter依赖快速集成MyBatis相关组件

- 外部化配置
使用application.yml统一管理配置信息

- 开箱即用
最小化配置即可快速启动应用

#### 1.2 核心特性
- 自动配置：自动配置SqlSessionFactory、DataSource等
- 起步依赖：mybatis-spring-boot-starter简化依赖管理
- 配置属性：通过application.yml配置MyBatis属性
- 监控管理：集成Actuator提供应用监控
### 2. Maven依赖配置
#### 2.1 核心依赖
```xml
<dependencies> 
<!-- Spring Boot Starter --> 
<dependency> 
<groupId>org.springframework.boot</groupId> 
<artifactId>spring-boot-starter-web</artifactId> 
</dependency> 
<!-- MyBatis Spring Boot Starter --> 
<dependency> 
<groupId>org.mybatis.spring.boot</groupId> 
<artifactId>mybatis-spring-boot-starter</artifactId> 
<version>2.3.1</version> 
</dependency> 
<!-- 数据库驱动 --> 
<dependency> 
<groupId>mysql</groupId> 
<artifactId>mysql-connector-java</artifactId> 
<scope>runtime</scope> 
</dependency> 
<!-- Druid连接池 --> 
<dependency> 
<groupId>com.alibaba</groupId> 
<artifactId>druid-spring-boot-starter</artifactId> 
<version>1.2.18</version> 
</dependency> </dependencies>
```
#### 2.2 可选依赖
```xml
<!-- 分页插件 --> 
<dependency> 
<groupId>com.github.pagehelper</groupId> 
<artifactId>pagehelper-spring-boot-starter</artifactId> 
<version>1.4.6</version> 
</dependency> 
<!-- 监控管理 --> 
<dependency> 
<groupId>org.springframework.boot</groupId> 
<artifactId>spring-boot-starter-actuator</artifactId> 
</dependency>
```
### 3. 应用配置
#### 3.1 启动类配置
```java
@SpringBootApplication 
@MapperScan("com.mybatis.springboot.mapper") 
@EnableTransactionManagement 
public class SpringBootMybatisApplication { 
    public static void main(String[] args) { 
        SpringApplication.run(SpringBootMybatisApplication.class, args); 
    } 
}
```
#### 3.2 application.yml配置
```yml
# 服务器配置 
server: 
    port: 8080 
    servlet: 
        context-path: /mybatis-demo 
# Spring配置 
spring: 
    # 数据源配置 
    datasource: 
        driver-class-name: com.mysql.cj.jdbc.Driver 
        url: jdbc:mysql://localhost:3306/mybatis_springboot 
        username: root 
        password: 123456 
        # Druid连接池配置 
        type: com.alibaba.druid.pool.DruidDataSource 
        druid: 
            initial-size: 5 
            min-idle: 5 
            max-active: 20 
            max-wait: 60000 
        # MyBatis配置 
        mybatis: 
        config-location: classpath:mybatis-config.xml 
        mapper-locations: classpath:mapper/*.xml 
        type-aliases-package: com.mybatis.springboot.entity 
        configuration: 
            map-underscore-to-camel-case: true 
            cache-enabled: true 
            lazy-loading-enabled: true
```
### 4. 注解开发
#### 4.1 Mapper接口
```java
@Mapper 
public interface UserMapper { 
    @Select("SELECT * FROM users WHERE id = #{id}") 
    User selectUserById(Long id); 
    @Insert("INSERT INTO users (username, email, age) VALUES (#{username}, #{email}, #{age})") 
    @Options(useGeneratedKeys = true, keyProperty = "id") 
    int insertUser(User user); 
    @Update("UPDATE users SET username = #{username}, email = #{email} WHERE id = #{id}") 
    int updateUser(User user); 
    @Delete("DELETE FROM users WHERE id = #{id}") 
    int deleteUser(Long id); 
    // 分页查询 
    @Select("SELECT * FROM users LIMIT #{offset}, #{limit}") 
    List<User> selectUsersByPage(@Param("offset") int offset, @Param("limit") int limit); 
}
```
#### 4.2 动态SQL注解
```java
@Select({ 
    "<script>", 
    "SELECT COUNT(*) FROM users", 
    "<where>", 
    "<if test='username != null and username != \"\"'>", "AND username LIKE CONCAT('%', #{username}, '%')", 
    "</if>", 
    "<if test='email != null and email != \"\"'>", "AND email LIKE CONCAT('%', #{email}, '%')", 
    "</if>", 
    "</where>", 
    "</script>" 
    }) 
    int countUsersByCondition(@Param("username") String username, @Param("email") String email);
```
### 5. 服务层开发
#### 5.1 服务接口
```java
public interface UserService { 
    Long createUser(User user); 
    User getUserById(Long id); 
    List<User> getAllUsers(); 
    void updateUser(User user); 
    void deleteUser(Long id); 
    List<User> getUsersByPage(int page, int size); 
    Long createUserWithTransaction(String username, String email, Integer age, boolean shouldFail) throws Exception; 
}
```
#### 5.2 服务实现
```java
@Service 
public class UserServiceImpl implements UserService { 
    @Autowired 
    private UserMapper userMapper; 
    @Override 
    public Long createUser(User user) { 
        userMapper.insertUser(user); 
        return user.getId(); 
    } 
    @Override 
    @Transactional(rollbackFor = Exception.class) 
    public Long createUserWithTransaction(String username, String email, Integer age, boolean shouldFail) throws Exception { 
        User user = new User(username, email, age); 
        userMapper.insertUser(user); 
        if (shouldFail) { 
            throw new Exception("模拟业务异常，触发事务回滚"); 
        } 
        return user.getId(); 
    } 
}
```
### 6. REST API开发
#### 6.1 控制器实现
```java
@RestController 
@RequestMapping("/api/users") 
public class UserController { 
    @Autowired 
    private UserService userService; 
    @PostMapping 
    public ResponseEntity<Long> createUser(@RequestBody User user) { 
        Long userId = userService.createUser(user); 
        return ResponseEntity.ok(userId); 
    } 
    @GetMapping("/{id}") 
    public ResponseEntity<User> getUserById(@PathVariable Long id) { 
        User user = userService.getUserById(id); 
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build(); 
    } 
    @GetMapping 
    public ResponseEntity<List<User>> getAllUsers() { 
        List<User> users = userService.getAllUsers(); 
        return ResponseEntity.ok(users); 
    } 
    @GetMapping("/page") 
    public ResponseEntity<List<User>> getUsersByPage( @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size) { 
        List<User> users = userService.getUsersByPage(page, size); 
        return ResponseEntity.ok(users); 
    } 
}
```
### 6.2 API接口列表
| HTTP方法 | URL路径 | 功能描述 | 请求参数 |
| -------- | -------- | -------- | -------- |
| POST	| /api/users	|创建用户	|User对象(JSON)
| GET	|/api/users/{id}	|根据ID获取用户	|id: 用户ID
| PUT	|/api/users/{id}	|更新用户	|id: 用户ID, User对象(JSON)
| DELETE	|/api/users/{id}	|删除用户	|id: 用户ID
| GET	|/api/users/page	|分页查询用户	|page: 页码, size: 页大小|
### 7. 事务管理
#### 7.1 声明式事务
```java
@Transactional(rollbackFor = Exception.class) 
public Long createUserWithTransaction(String username, String email, Integer age, boolean shouldFail) throws Exception { 
    User user = new User(username, email, age); 
    userMapper.insertUser(user); 
    if (shouldFail) { 
        throw new Exception("模拟业务异常，触发事务回滚"); 
    } 
    return user.getId(); 
}
```
#### 7.2 事务传播行为
- REQUIRED：默认传播行为，如果当前存在事务，则加入该事务
- REQUIRES_NEW：创建一个新的事务，如果当前存在事务，则把当前事务挂起
- SUPPORTS：如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务的方式继续运行
- NOT_SUPPORTED：以非事务方式运行，如果当前存在事务，则把当前事务挂起
### 8. 监控管理
#### 8.1 Druid监控
```yaml
spring:
  datasource:
    druid:
      # 监控配置 - WebStatFilter配置（用于采集web-jdbc关联监控的数据）
      web-stat-filter:
        enabled: true          # 开启WebStatFilter
        url-pattern: /*       # 拦截所有请求
        exclusions: "*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*"  # 排除不需要监控的资源
      # StatViewServlet配置（Druid监控页面的访问配置）
      stat-view-servlet:
        enabled: true         # 开启StatViewServlet
        url-pattern: /druid/* # 监控页面的访问路径
        reset-enable: false   # 禁用监控页面的重置功能
        login-username: admin # 监控页面登录用户名
        login-password: admin # 监控页面登录密码
```
#### 8.2 Spring Boot Actuator
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env
  endpoint:
    health:
      show-details: always
```
### 9. 测试开发
#### 9.1 单元测试
```java
@SpringBootTest 
@Transactional 
@Rollback 
class SpringBootMybatisApplicationTests { 
    @Autowired 
    private UserService userService; 
    @Test 
    void testCreateAndQueryUser() { 
        User user = new User(); 
        user.setUsername("test_user"); 
        user.setEmail("test@example.com"); 
        user.setAge(25); 
        Long userId = userService.createUser(user); 
        assertNotNull(userId); 
        User foundUser = userService.getUserById(userId); 
        assertNotNull(foundUser); 
        assertEquals("test_user", foundUser.getUsername()); 
    } 
}
```
#### 9.2 集成测试
```java
@Test
void testTransactionRollback() {
    try {
        // 调用带事务的用户创建方法（预期会抛出异常触发回滚）
        userService.createUserWithTransaction("rollback_user", "rollback@example.com", 25, true);
        // 如果没有抛出异常，测试失败
        fail("应该抛出异常");
    } catch (Exception e) {
        // 打印异常信息，确认事务回滚触发
        System.out.println("事务回滚测试: " + e.getMessage());
    }

    // 验证：事务回滚后，用户未被创建
    User user = userService.getUserByUsername("rollback_user");
    assertNull(user);
}
```
### 10. 性能优化
#### 10.1 连接池优化
连接池配置
- 合理设置初始连接数
- 合理配置最大连接数
- 合理设置连接超时时间
- 启用连接验证

监控指标
- 活跃连接数
- 连接池使用率
- SQL执行时间
- 慢查询统计
#### 10.2 缓存配置
```yaml
# MyBatis 核心配置
mybatis:
  configuration:
    # 开启MyBatis全局缓存（二级缓存）
    cache-enabled: true
    # 开启延迟加载（懒加载）
    lazy-loading-enabled: true
    # 关闭积极的懒加载（按需加载，仅调用属性时才加载关联对象）
    aggressive-lazy-loading: false
```
### 11. 最佳实践
#### 11.1 项目结构

- 分层架构：Controller → Service → Mapper → Entity
- 包命名：按功能模块组织包结构
- 配置管理：使用profile管理多环境配置
- 异常处理：统一异常处理和错误响应
#### 11.2 开发建议
代码规范
- 遵循RESTful API设计原则
- 使用合适的HTTP状态码
- 统一响应格式
- 添加适当的注释和文档

安全考虑
- 参数验证和SQL注入防护
- 敏感信息加密存储
- 接口权限控制
- 日志脱敏处理
### 12. 常见问题与解决方案
#### 12.1 配置问题
> 问题：Mapper接口无法注入
> 
> 解决：检查@MapperScan注解配置，确保包路径正确

> 问题：数据源配置失败
> 
> 解决：检查数据库连接信息，确保驱动类路径正确
#### 12.2 运行时问题
> 问题：事务不生效
> 
> 解决：确保@EnableTransactionManagement注解存在，方法为public

> 问题：SQL执行异常
> 
> 解决：开启SQL日志，检查生成的SQL语句是否正确          
### 13. 实践练习
练习任务
- 创建一个完整的用户管理REST API
- 实现用户的CRUD操作
- 添加分页查询功能    
- 实现条件查询和统计功能
- 添加事务管理和异常处理
- 配置Druid监控和Actuator端点
- 编写单元测试和集成测试
- 优化性能和添加缓存
### 14. 运行示例
运行步骤
- 创建数据库：CREATE DATABASE mybatis_springboot
- 执行初始化脚本：mysql -u root -p mybatis_springboot < init.sql
- 修改数据库连接配置：编辑application.yml
- 启动应用：mvn spring-boot:run
- 测试API：访问 http://localhost:8080/mybatis-demo/api/users
- 查看监控：访问 http://localhost:8080/mybatis-demo/druid/
- 运行测试：mvn test
> 提示：Spring Boot与MyBatis的集成大大简化了配置工作，通过自动配置和起步依赖，可以快速构建现代化的数据访问应用。重点掌握配置管理、注解开发、事务管理和REST API设计等核心技能。
### 本章小结
本章深入学习了Spring Boot与MyBatis的整合开发。通过Spring Boot的自动配置特性，可以快速搭建MyBatis项目，大大简化了配置工作。同时学习了多数据源配置、事务管理等高级特性。

## MyBatis Plus
### 1. MyBatis Plus概述
#### 1.1 什么是MyBatis Plus
MyBatis Plus（简称MP）是一个MyBatis的增强工具，在MyBatis的基础上只做增强不做改变，为简化开发、提高效率而生。

#### 1.2 核心特性
- 无侵入
只做增强不做改变，引入它不会对现有工程产生影响

- 损耗小
启动即会自动注入基本CRUD，性能基本无损耗

- 强大的CRUD操作
内置通用Mapper、通用Service，仅仅通过少量配置即可实现单表大部分CRUD操作

- 支持Lambda形式调用
通过Lambda表达式，方便的编写各类查询条件，无需再担心字段写错

- 支持主键自动生成
支持多达4种主键策略，可自由配置，完美解决主键问题

- 支持分页插件
基于MyBatis物理分页，开发者无需关心具体操作

### 2. 快速入门
#### 2.1 依赖配置
```xml
<!-- MyBatis-Plus 启动器（整合MyBatis+自动配置+常用功能） -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.3.1</version>
</dependency>
```
#### 2.2 配置数据源
```yaml
# application.yml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/mybatis_plus?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=GMT%2B8
    username: root
    password: 123456
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      table-prefix: mp_
```
#### 2.3 创建实体类
```java
@Data   
@TableName("mp_user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private Integer age;
    private String email;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```
#### 2.4 创建Mapper接口
```java
@Mapper 
public interface UserMapper extends BaseMapper<User> { 
    // 继承BaseMapper后，无需编写任何代码即可获得CRUD功能 
}
```
### 3. 基本CRUD操作
#### 3.1 插入操作
```java
// 插入一条记录 
User user = new User(); 
user.setName("张三"); 
user.setAge(25); 
user.setEmail("zhangsan@example.com"); 
int result = userMapper.insert(user); 
System.out.println("插入结果: " + result); 
System.out.println("主键ID: " + user.getId());
```
#### 3.2 删除操作
```java
// 根据ID删除 
int result = userMapper.deleteById(1L); 
// 根据条件删除 
Map<String, Object> map = new HashMap<>(); 
map.put("name", "张三"); 
map.put("age", 25); 
int result = userMapper.deleteByMap(map); 
// 批量删除 
List<Long> ids = Arrays.asList(1L, 2L, 3L); 
int result = userMapper.deleteBatchIds(ids); 
System.out.println("删除结果: " + result);
```
#### 3.3 更新操作
```java
// 根据ID更新 
User user = new User(); 
user.setId(1L); 
user.setName("李四"); 
user.setAge(26); 
int result = userMapper.updateById(user); 
System.out.println("更新结果: " + result);
```
#### 3.4 查询操作
```java
// 根据ID查询 
User user = userMapper.selectById(1L); 
// 查询所有 
List<User> users = userMapper.selectList(null); 
// 根据条件查询 
Map<String, Object> map = new HashMap<>(); 
map.put("name", "张三"); 
// 批量查询 
List<User> users = userMapper.selectBatchIds(ids); 
// 查询总数 
Integer count = userMapper.selectCount(null);
```
### 4. 条件构造器
#### 4.1 QueryWrapper
```java
// 构建用户查询条件
QueryWrapper<User> queryWrapper = new QueryWrapper<>();
queryWrapper
    .eq("name", "张三")                // 等于：name = '张三'
    .ne("age", 25)                    // 不等于：age != 25
    .gt("age", 18)                    // 大于：age > 18
    .ge("age", 18)                    // 大于等于：age >= 18
    .lt("age", 60)                    // 小于：age < 60
    .le("age", 60)                    // 小于等于：age <= 60
    .between("age", 18, 60)           // 区间：age BETWEEN 18 AND 60
    .notBetween("age", 18, 25)        // 不在区间：age NOT BETWEEN 18 AND 25
    .like("name", "张")               // 模糊查询（包含）：name LIKE '%张%'
    .notLike("name", "王")            // 模糊查询（不包含）：name NOT LIKE '%王%'
    .likeLeft("name", "三")           // 模糊查询（后缀匹配）：name LIKE '%三'
    .likeRight("name", "张")          // 模糊查询（前缀匹配）：name LIKE '张%'
    .isNull("email")                  // 为空：email IS NULL
    .isNotNull("email")               // 不为空：email IS NOT NULL
    .in("age", 18, 25, 30)            // 包含：age IN (18, 25, 30)
    .notIn("age", 40, 50)             // 不包含：age NOT IN (40, 50)
    .orderByAsc("age")                // 升序排序：ORDER BY age ASC
    .orderByDesc("create_time");      // 降序排序：ORDER BY create_time DESC

// 执行查询，获取符合条件的用户列表
List<User> users = userMapper.selectList(queryWrapper);
```
#### 4.2 LambdaQueryWrapper
```java
// LambdaQueryWrapper查询（类型安全，通过方法引用避免字段名硬编码错误）
LambdaQueryWrapper<User> lambdaQuery = new LambdaQueryWrapper<>();
lambdaQuery
    .eq(User::getName, "张三")          // 等于：name = '张三'（通过方法引用，字段名不会写错）
    .ge(User::getAge, 18)              // 大于等于：age >= 18
    .le(User::getAge, 60)              // 小于等于：age <= 60
    .isNotNull(User::getEmail)         // 不为空：email IS NOT NULL
    .orderByDesc(User::getCreateTime); // 降序排序：ORDER BY create_time DESC

// 执行Lambda条件查询，获取符合条件的用户列表
List<User> users = userMapper.selectList(lambdaQuery);
```
#### 4.3 UpdateWrapper
```java
// ==================== 方式1：普通UpdateWrapper（字符串字段名） ====================
// 构建更新条件与更新内容（字段名硬编码，存在拼写风险）
UpdateWrapper<User> updateWrapper = new UpdateWrapper<>();
updateWrapper
    .eq("name", "张三")                    // 更新条件：name = '张三'
    .set("age", 26)                       // 更新字段：age = 26
    .set("email", "zhangsan_new@example.com"); // 更新字段：email = 'zhangsan_new@example.com'

// 执行更新操作（第一个参数为null，表示仅用wrapper中的set更新字段）
int result1 = userMapper.update(null, updateWrapper);

// ==================== 方式2：LambdaUpdateWrapper（类型安全） ====================
// 构建Lambda更新条件与更新内容（方法引用，编译期检查字段名，无拼写风险）
LambdaUpdateWrapper<User> lambdaUpdate = new LambdaUpdateWrapper<>();
lambdaUpdate
    .eq(User::getName, "张三")             // 更新条件：name = '张三'（类型安全）
    .set(User::getAge, 26)                // 更新字段：age = 26（类型安全）
    .set(User::getEmail, "zhangsan_new@example.com"); // 更新字段：email = 'zhangsan_new@example.com'

// 执行Lambda更新操作
int result2 = userMapper.update(null, lambdaUpdate);
```
#### 4.4 复杂条件组合
```java
// ==================== 1. 复杂组合条件：(age > 18 AND age < 60) OR (name LIKE '%管理员%') ====================
QueryWrapper<User> queryWrapper = new QueryWrapper<>();
queryWrapper
    // 组合条件1：AND嵌套 - (age > 18 AND age < 60)
    .and(wrapper -> wrapper
        .gt("age", 18)        // age > 18
        .lt("age", 60)        // age < 60
    )
    // 组合条件2：OR嵌套 - (name LIKE '%管理员%')
    .or(wrapper -> wrapper
        .like("name", "管理员") // name LIKE '%管理员%'
    );

// ==================== 2. 嵌套查询：EXISTS子查询 ====================
// EXISTS子查询：判断当前用户id是否存在于orders表的user_id中
queryWrapper.exists("SELECT 1 FROM orders WHERE orders.user_id = mp_users.id");

// ==================== 3. 动态条件（根据参数是否非空拼接条件） ====================
// 模拟前端传入的动态查询参数（可能为null）
String name = "张三";
Integer minAge = 18;
Integer maxAge = 60;

// 动态条件：参数非空时才拼接对应查询条件（避免查询条件为null导致的SQL错误）
queryWrapper
    .eq(StringUtils.isNotBlank(name), "name", name)    // name非空时：name = '张三'
    .ge(minAge != null, "age", minAge)                // minAge非空时：age >= 18
    .le(maxAge != null, "age", maxAge);                // maxAge非空时：age <= 60
```
### 5. 分页插件
#### 5.1 配置分页插件
```java
@Configuration 
public class MybatisPlusConfig { 
    @Bean 
    public MybatisPlusInterceptor mybatisPlusInterceptor() { 
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor(); 
        // 添加分页插件 
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL)); 
        return interceptor; 
    } 
}

```
#### 5.2 分页查询
```java
// ==================== MyBatis-Plus 分页查询完整示例 ====================
// 1. 创建分页对象：指定查询第1页，每页显示10条记录
Page<User> page = new Page<>(1, 10);

// 2. 构造查询条件：筛选年龄≥18的用户，并按创建时间降序排列
QueryWrapper<User> queryWrapper = new QueryWrapper<>();
queryWrapper
    .ge("age", 18)                // 查询条件：age >= 18
    .orderByDesc("create_time");  // 排序规则：按create_time降序

// 3. 执行分页查询（核心：将分页对象和查询条件传入selectPage）
// 注意：执行后page对象与userPage对象是同一个（底层会复用page对象赋值）
Page<User> userPage = userMapper.selectPage(page, queryWrapper);

// 4. 获取并打印分页相关信息（分页核心数据）
System.out.println("当前页: " + userPage.getCurrent());       // 输出：1
System.out.println("每页大小: " + userPage.getSize());        // 输出：10
System.out.println("总记录数: " + userPage.getTotal());       // 输出：符合条件的总条数（如100）
System.out.println("总页数: " + userPage.getPages());         // 输出：总页数（如10）
System.out.println("是否有上一页: " + userPage.hasPrevious()); // 输出：false（第1页无上级）
System.out.println("是否有下一页: " + userPage.hasNext());     // 输出：true/false（根据总页数）
System.out.println("当前页数据: " + userPage.getRecords());   // 输出：当前页的User列表
```
#### 5.3 自定义分页查询
```java
// Mapper接口中定义 
@Select("SELECT * FROM mp_users WHERE age BETWEEN #{minAge} AND #{maxAge}") 
Page<User> selectUsersByAgeRange(
    Page<User> page, 
    @Param("minAge") Integer minAge, 
    @Param("maxAge") Integer maxAge); 
// 使用 
Page<User> page = new Page<>(1, 10); 
Page<User> result = userMapper.selectUsersByAgeRange(page, 18, 60);
```
### 6. 乐观锁
#### 6.1 配置乐观锁插件
```java
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus 核心配置类
 * 用于注册MyBatis-Plus的各类插件（如乐观锁、分页、防全表更新/删除等）
 */
@Configuration
public class MybatisPlusConfig {

    /**
     * 注册MyBatis-Plus插件拦截器
     * 核心作用：整合各类MyBatis-Plus插件，统一交给MyBatis执行
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        // 创建MyBatis-Plus插件拦截器核心对象
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        
        // 1. 添加乐观锁插件（用于解决并发更新的线程安全问题）
        // 注意：实体类中需给版本号字段添加@Version注解才会生效
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        
        // 扩展：如需添加分页插件，可在此处追加（示例）
        // interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        
        return interceptor;
    }
}
```
#### 6.2 实体类配置
```java
@Data 
public class User { 
    private Long id; 
    private String name; 
    private Integer age; 
    @Version 
    // 乐观锁版本号字段 
    private Integer version; 
}
```
#### 6.3 乐观锁使用
```java
// 查询用户（获取当前版本号）
User user = userMapper.selectById(1L);
System.out.println("原始版本号: " + user.getVersion());

// 修改用户信息
user.setAge(user.getAge() + 1);

// 更新用户（乐观锁自动检查版本号）
int result = userMapper.updateById(user);
if (result == 1) {
    System.out.println("更新成功，新版本号: " + user.getVersion());
} else {
    System.out.println("更新失败，可能存在并发冲突");
}
```
#### 6.4 并发冲突演示
```java
// 模拟并发更新场景（两个线程同时查询并更新同一个用户）
User user1 = userMapper.selectById(1L);
User user2 = userMapper.selectById(1L);

// 用户1先更新（version=1 → 更新后version=2）
user1.setAge(26);
int result1 = userMapper.updateById(user1); // 成功，返回1

// 用户2后更新（持有的version仍为1，乐观锁校验失败）
user2.setAge(27);
int result2 = userMapper.updateById(user2); // 失败，返回0

// 打印更新结果
System.out.println("用户1更新结果: " + result1); // 输出：1
System.out.println("用户2更新结果: " + result2); // 输出：0
```
### 7. 逻辑删除
#### 7.1 全局配置
```yaml
# MyBatis-Plus 全局配置
mybatis-plus:
  global-config:
    db-config:
      # 全局逻辑删除字段名（实体类中无需重复注解，统一用此字段）
      logic-delete-field: deleted
      # 逻辑已删除值（删除操作时，该字段会被设为1）
      logic-delete-value: 1
      # 逻辑未删除值（默认值，查询时自动过滤不等于0的数据）
      logic-not-delete-value: 0
```
#### 7.2 实体类配置
```java
@Data 
public class User { 
    private Long id; 
    private String name; 
    private Integer age; 
    @TableLogic 
    // 逻辑删除字段 private Integer deleted; 
}
```
#### 7.3 逻辑删除使用
```java
// 逻辑删除操作（底层执行UPDATE，将deleted字段置为1）
int result = userMapper.deleteById(1L);
// 实际执行SQL：UPDATE mp_users SET deleted=1 WHERE id=1 AND deleted=0

// 普通查询（自动过滤deleted=1的已删除数据）
List<User> users = userMapper.selectList(null);
// 实际执行SQL：SELECT * FROM mp_users WHERE deleted=0

// 自定义SQL查询（包含已删除数据，需手动编写SQL）
@Select("SELECT * FROM mp_users")
List<User> selectAllIncludeDeleted();
```
### 8. 自动填充
#### 8.1 实体类配置
```java
@Data 
public class User { 
    private Long id; 
    private String name; 
    private Integer age; 
    @TableField(value = "create_time", fill = FieldFill.INSERT) 
    private LocalDateTime createTime; 
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE) 
    private LocalDateTime updateTime; 
}
```
#### 8.2 配置填充处理器
```java
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        // 插入数据时自动填充创建时间、更新时间
        this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        // 更新数据时自动填充更新时间
        this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }
}
```
### 9. 服务层封装
#### 9.1 IService接口
```java
public interface UserService extends IService<User> { 
    // 继承IService后获得大量便捷方法 
    // 自定义业务方法 
    Page<User> getUsersByPage(int current, int size); 
    List<User> getUsersByAgeRange(Integer minAge, Integer maxAge); 
}
```
#### 9.2 ServiceImpl实现
```java
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public Page<User> getUsersByPage(int current, int size) {
        Page<User> page = new Page<>(current, size);
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByDesc("create_time");
        return this.page(page, queryWrapper);
    }

    @Override
    public List<User> getUsersByAgeRange(Integer minAge, Integer maxAge) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.between("age", minAge, maxAge);
        return this.list(queryWrapper);
    }
}
```
#### 9.3 IService常用方法
| 方法名	| 功能描述	| 示例
| -- | -- | -- |
|save(entity)	| 插入一条记录	| userService.save(user)
|saveBatch(entityList)	|批量插入	|userService.saveBatch(users)
|saveOrUpdate(entity)	|插入或更新	|userService.saveOrUpdate(user)
|removeById(id)	|根据ID删除	|userService.removeById(1L)
|removeBatchByIds(idList)	|批量删除	|userService.removeBatchByIds(ids)
|updateById(entity)	|根据ID更新	|userService.updateById(user)
|getById(id)	|根据ID查询	|userService.getById(1L)
|list()	|查询所有	|userService.list()
|page(page)	|分页查询	|userService.page(page)
|count()	|查询总数	|userService.count()
### 10. 代码生成器
#### 10.1 添加依赖
```xml
<!-- MyBatis-Plus 代码生成器 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-generator</artifactId>
    <version>3.5.3.1</version>
</dependency>

<!-- 代码生成器模板引擎 - Freemarker -->
<dependency>
    <groupId>org.freemarker</groupId>
    <artifactId>freemarker</artifactId>
</dependency>
```
#### 10.2 生成器配置
```java
public class CodeGenerator {

    public static void main(String[] args) {
        // 1. 数据源配置（数据库连接信息）
        DataSourceConfig dataSourceConfig = new DataSourceConfig.Builder(
                "jdbc:mysql://localhost:3306/mybatis_plus",
                "root",
                "123456"
        ).build();

        // 2. 全局配置（生成文件路径、作者等）
        GlobalConfig globalConfig = new GlobalConfig.Builder()
                .outputDir(System.getProperty("user.dir") + "/src/main/java")
                .author("MyBatis Plus")
                .enableSwagger()
                .build();

        // 3. 包配置（生成代码的包结构）
        PackageConfig packageConfig = new PackageConfig.Builder()
                .parent("com.mybatis.plus")
                .entity("entity")
                .mapper("mapper")
                .service("service")
                .serviceImpl("service.impl")
                .controller("controller")
                .build();

        // 4. 策略配置（表映射、实体/控制器规则等）
        StrategyConfig strategyConfig = new StrategyConfig.Builder()
                .addInclude("mp_users") // 指定要生成的表名
                .entityBuilder()
                .enableLombok()
                .enableTableFieldAnnotation()
                .logicDeleteColumnName("deleted")
                .versionColumnName("version")
                .addTableFills(new Column("create_time", FieldFill.INSERT))
                .addTableFills(new Column("update_time", FieldFill.INSERT_UPDATE))
                .controllerBuilder()
                .enableRestStyle()
                .build();

        // 5. 执行代码生成
        AutoGenerator generator = new AutoGenerator(dataSourceConfig);
        generator.global(globalConfig)
                .packageInfo(packageConfig)
                .strategy(strategyConfig)
                .execute();
    }
}
```
### 11. 性能优化
#### 11.1 SQL性能分析
```yaml
# 开启SQL日志
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```
#### 11.2 分页优化
合理使用索引
- 为常用查询字段添加索引
- 避免在索引字段上使用函数
- 合理设计复合索引

分页参数控制
- 限制每页最大记录数
- 避免查询过大的页码
- 使用游标分页处理大数据量
#### 11.3 批量操作优化
```java
// 批量插入优化 
@Transactional 
public boolean batchInsert(List<User> users) { 
    // 分批处理，避免一次性插入过多数据 
    int batchSize = 1000; 
    for (int i = 0; i < users.size(); i += batchSize) { 
        int end = Math.min(i + batchSize, users.size()); 
        // 分批处理，避免一次性插入过多数据 
        List<User> batch = users.subList(i, end); 
        userService.saveBatch(batch); 
    } 
    return true; 
}
```
### 12.  MyBatis vs MyBatis Plus对比
|功能	|MyBatis	|MyBatis Plus
| -- | -- | -- |
|基本CRUD	|需要手写SQL和Mapper方法	|继承BaseMapper即可获得
|条件查询	|需要手写动态SQL	|使用Wrapper构造器
|分页查询	|需要手动计算和编写	|内置分页插件
|乐观锁	|需要手动实现	|@Version注解自动处理
|逻辑删除	|需要手动实现	|@TableLogic注解自动处理
| 自动填充	|需要手动实现	|MetaObjectHandler自动处理
|代码生成	|需要第三方工具	|内置代码生成器
|学习成本	|较高	|较低
|开发效率	|一般	|很高
### 13.  最佳实践
#### 13.1 项目结构建议
- 实体类：使用@TableName、@TableId、@TableField等注解
- Mapper层：继承BaseMapper，添加自定义方法
- Service层：继承IService和ServiceImpl
- Controller层：使用RESTful风格API
#### 13.2 配置建议
- 全局配置
  - 统一主键策略
  - 配置逻辑删除
  - 设置表名前缀
  - 开启驼峰命名转换
- 性能配置
  - 合理配置分页插件
  - 启用乐观锁插件
  - 配置SQL性能分析
  - 设置合理的批量大小
#### 13.3 开发建议
- 优先使用Lambda表达式：避免字段名写错
- 合理使用条件构造器：避免复杂的动态SQL
- 注意并发控制：合理使用乐观锁
- 规范命名：实体类、表名、字段名保持一致
### 14.  常见问题与解决方案
#### 14.1 配置问题
> 问题：实体类与表名不匹配
> 
> 解决：使用@TableName注解指定表名，或配置全局表名前缀

> 问题：主键策略不生效
> 
> 解决：检查@TableId注解配置，确保数据库表主键设置正确
#### 14.2 查询问题
> 问题：分页查询总数不准确
> 
> 解决：检查是否有逻辑删除字段影响，确保分页插件配置正确

> 问题：乐观锁更新失败
> 
> 解决：检查版本号字段类型，确保实体类有@Version注解
### 15.  实践练习
练习任务
- 创建用户管理系统，使用MyBatis Plus实现CRUD操作
- 实现复杂条件查询（年龄范围、姓名模糊查询等）
- 添加分页查询功能
- 实现乐观锁并发控制
- 配置逻辑删除功能
- 使用代码生成器生成基础代码
### 16.  运行示例
示例功能
- ✅ 用户信息的增删改查操作
- ✅ 复杂条件查询演示
- ✅ 分页查询功能
- ✅ 乐观锁并发控制
- ✅ 逻辑删除演示
- ✅ 自动填充功能
- ✅ 批量操作优化

## 性能优化
### 1. 性能优化概述
#### 1.1 性能优化的重要性
MyBatis性能优化是提升应用程序响应速度和处理能力的关键环节，主要包括：

- 响应时间优化：减少SQL执行时间
- 吞吐量提升：增加并发处理能力
- 资源利用率：优化内存和CPU使用
- 用户体验：提升应用响应速度
#### 1.2 性能优化策略
性能优化金字塔
- 数据库层面：索引优化、SQL优化
- 框架层面：缓存机制、批量操作
- 应用层面：连接池配置、代码优化
- 系统层面：硬件配置、网络优化
### 2. SQL优化技巧
#### 2.1 索引优化
```sql
-- 单字段索引（提升单个字段查询效率）
CREATE INDEX idx_user_age ON users(age);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_user_status ON orders(user_id, status);
CREATE INDEX idx_order_create_time ON orders(create_time);

-- 复合索引（优化多字段联合查询场景）
CREATE INDEX idx_user_age_create_time ON users(age, create_time);
CREATE INDEX idx_order_status_create_time ON orders(status, create_time);
```
#### 2.2 查询优化
```sql
<!-- 优化前：全表扫描（SELECT * + 范围查询无索引优化） -->
<select id="getUsersByAgeRangeUnoptimized" resultType="User">
    SELECT * FROM users WHERE age >= #{minAge} AND age <= #{maxAge}
</select>

<!-- 优化后：使用BETWEEN+指定字段+索引+分页（避免全表扫描） -->
<select id="getUsersByAgeRange" resultType="User">
    SELECT id, username, email, age, create_time 
    FROM users 
    WHERE age BETWEEN #{minAge} AND #{maxAge} 
    ORDER BY create_time DESC 
    LIMIT #{limit}
</select>
```
#### 2.3 分页查询优化
```sql
<!-- 深分页优化 --> 
<select id="selectUsersByPageOptimized" resultMap="UserResultMap">
    SELECT u.id, u.username, u.email, u.age, u.create_time 
    FROM users u 
    WHERE u.id > #{lastId} 
    ORDER BY u.id 
    LIMIT #{pageSize}
</select>

<!-- 使用覆盖索引（避免回表查询） -->
<select id="selectUsersWithCoveringIndex" resultType="User">
    SELECT id, username, email 
    FROM users 
    WHERE age BETWEEN #{minAge} AND #{maxAge} 
    ORDER BY age, id 
    LIMIT #{offset}, #{limit}
</select>
```
### 3. 缓存机制优化
#### 3.1 一级缓存（SqlSession级别）
```java
// 一级缓存默认开启，仅在同一个SqlSession范围内生效
public void testFirstLevelCache() {
    SqlSession sqlSession = sqlSessionFactory.openSession();
    UserMapper mapper = sqlSession.getMapper(UserMapper.class);
    
    // 第一次查询：缓存未命中，从数据库获取数据
    User user1 = mapper.selectUserById(1L);
    
    // 第二次查询：缓存命中，直接从一级缓存获取（无需查库）
    User user2 = mapper.selectUserById(1L); // user1 == user2 结果为true
    
    sqlSession.close();
}
```
#### 3.2 二级缓存（Mapper级别）
```xml
<!-- 在Mapper XML中配置二级缓存 --> 
<cache eviction="LRU" flushInterval="60000" size="512" readOnly="true"/>

<!-- 查询语句使用缓存 --> 
<select id="selectUserById" resultType="User" useCache="true">
    SELECT * FROM users WHERE id = #{id}
</select>
```
#### 3.3 Spring Cache集成
```java
@Service
public class UserServiceImpl implements UserService {
    @Cacheable(value = "users", key = "#id")
    public User getUserById(Long id) {
        return userMapper.selectUserById(id);
    }

    @CacheEvict(value = "users", key = "#user.id")
    public void updateUser(User user) {
        userMapper.updateUser(user);
    }

    @CacheEvict(value = "users", allEntries = true)
    public void clearAllCache() {
        // 清空所有缓存
    }
}
```
### 4. 批量操作优化
#### 4.1 批量插入
```xml
<!-- 批量插入优化 --> 
<insert id="batchInsertUsers" parameterType="list">
    INSERT INTO users (username, email, age, create_time, update_time) VALUES 
    <foreach collection="users" item="user" separator=",">
        (#{user.username}, #{user.email}, #{user.age}, NOW(), NOW())
    </foreach>
</insert>
```
```java
// Java代码
@Transactional
public void batchInsertUsers(List<User> users) {
    int batchSize = 1000;
    for (int i = 0; i < users.size(); i += batchSize) {
        int end = Math.min(i + batchSize, users.size());
        List<User> batch = users.subList(i, end);
        userMapper.batchInsertUsers(batch);
    }
}
```
#### 4.2 批量更新
```xml
<!-- 批量更新优化 --> 
<update id="batchUpdateUsers" parameterType="list">
    <foreach collection="users" item="user" separator=";">
        UPDATE users SET username = #{user.username}, email = #{user.email}, age = #{user.age}, update_time = NOW() WHERE id = #{user.id}
    </foreach>
</update>
```
#### 4.3 性能对比
|操作方式	|1000条记录耗时	|性能提升	|适用场景
| --- | --- | --- | ---
|逐条插入	|2000ms	|基准	|少量数据
|批量插入	|200ms	|10倍	|大量数据
|批量+事务	|150ms	|13倍	|大量数据+一致性
### 5. 连接池优化
#### 5.1 Druid连接池配置
```yaml
spring:
  datasource:
    # 指定数据源类型为Druid
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      # 连接池基础配置
      initial-size: 10                # 初始连接数
      min-idle: 10                    # 最小空闲连接数
      max-active: 50                  # 最大活跃连接数
      max-wait: 60000                 # 获取连接等待超时时间（毫秒）
      
      # 连接池空闲连接检测配置
      time-between-eviction-runs-millis: 60000  # 检测空闲连接的间隔时间（毫秒）
      min-evictable-idle-time-millis: 300000    # 连接最小生存时间（毫秒）
      validation-query: SELECT 1                # 验证连接有效性的SQL
      test-while-idle: true                     # 空闲时检测连接有效性
      test-on-borrow: false                     # 获取连接时不检测（提升性能）
      test-on-return: false                     # 归还连接时不检测（提升性能）
      
      # 预处理语句缓存配置（提升SQL执行效率）
      pool-prepared-statements: true            # 开启PSCache
      max-pool-prepared-statement-per-connection-size: 20  # 每个连接的PSCache大小
```
#### 5.2 连接池监控
```yaml
# 启用Druid数据源监控功能（包含监控页面和Web请求统计）
spring:
  datasource:
    druid:
      # Druid监控页面配置（StatViewServlet）
      stat-view-servlet:
        enabled: true                      # 开启监控页面
        url-pattern: /druid/*              # 监控页面访问路径
        reset-enable: false                # 禁用监控页面的重置功能（安全）
        login-username: admin              # 监控页面登录用户名
        login-password: admin              # 监控页面登录密码
      
      # Web请求统计过滤器配置（WebStatFilter）
      web-stat-filter:
        enabled: true                      # 开启Web请求统计
        url-pattern: /*                    # 拦截所有请求
        # 排除不需要统计的资源（静态文件+监控页面自身）
        exclusions: "*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*"
```
### 6. 延迟加载优化
#### 6.1 关联查询优化
```xml
<!-- 延迟加载ResultMap：用户关联订单（按需加载订单数据） -->
<resultMap id="UserWithOrdersResultMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <result property="email" column="email"/>
    <!-- 关联订单集合，fetchType="lazy"开启延迟加载 -->
    <collection property="orders" 
                ofType="Order" 
                select="selectOrdersByUserId" 
                column="id" 
                fetchType="lazy"/>
</resultMap>

<!-- 查询用户（订单数据仅在使用时才会通过selectOrdersByUserId查询） -->
<select id="selectUsersWithOrders" resultMap="UserWithOrdersResultMap">
    SELECT id, username, email FROM users
</select>
```
#### 6.2 避免N+1查询问题
```xml
<!-- 使用LEFT JOIN关联查询，避免N+1查询问题（一次SQL获取用户+订单数据） -->
<select id="selectUsersWithOrdersOptimized" resultMap="UserOrderResultMap">
    SELECT 
        u.id as user_id,
        u.username,
        u.email,
        o.id as order_id,
        o.order_no,
        o.amount,
        o.status
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id IN
    <foreach collection="userIds" item="id" open="(" close=")" separator=",">
        #{id}
    </foreach>
</select>
```
### 7. MyBatis配置优化
#### 7.1 核心配置优化
```yaml
# mybatis配置优化
mybatis:
  configuration:
    # 开启缓存
    cache-enabled: true
    # 延迟加载
    lazy-loading-enabled: true
    aggressive-lazy-loading: false
    # 执行器类型
    default-executor-type: reuse
    # 语句超时时间
    default-statement-timeout: 25
    # 默认获取数量
    default-fetch-size: 100
    # 本地缓存范围
    local-cache-scope: session
    # 自动映射行为
    auto-mapping-behavior: partial
    # 自动映射结果集到Java对象（字段名与属性名一致）
    auto-mapping-unknown-column-behavior: ignore  
```      
#### 7.2 插件配置
```java
@Configuration
public class MyBatisConfig {
    // SQL性能分析插件
    @Bean
    public PerformanceInterceptor performanceInterceptor() {
        PerformanceInterceptor interceptor = new PerformanceInterceptor();
        interceptor.setMaxTime(1000); // 设置SQL最大执行时间
        interceptor.setFormat(true); // 格式化SQL
        return interceptor;
    }

    // 分页插件
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor interceptor = new PaginationInterceptor();
        interceptor.setCountSqlParser(new JsqlParserCountOptimize(true));
        return interceptor;
    }
}
```
### 8. 性能监控与分析
#### 8.1 SQL执行时间监控
```java
@Component
public class PerformanceTestService {
    public void performanceComparison() {
        // 查询性能测试
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < 100; i++) {
            userService.getUsersByAgeRange(20, 30);
        }
        long optimizedTime = System.currentTimeMillis() - startTime;
        System.out.println("优化查询100次耗时: " + optimizedTime + "ms");

        // 批量操作性能测试
        startTime = System.currentTimeMillis();
        performanceTestService.batchInsertBatch(users);
        long batchTime = System.currentTimeMillis() - startTime;
        System.out.println("批量插入耗时: " + batchTime + "ms");
    }
}
```
#### 8.2 性能指标监控

|监控指标	|正常范围	|优化建议|
| -- | -- | -- |
|SQL执行时间	| < 100ms	|优化SQL、添加索引|
|连接池使用率	| < 80%	|调整连接池大小|
|缓存命中率	| > 80%	|优化缓存策略|
|QPS	|根据业务	|水平扩展、读写分离|
### 9. 最佳实践
#### 9.1 开发建议
性能优化最佳实践
- 索引设计：为经常查询的字段创建合适的索引
- SQL优化：避免SELECT *，使用具体字段名
- 批量操作：大量数据操作时使用批量方法
- 缓存策略：合理使用一级和二级缓存
- 连接池配置：根据并发量调整连接池参数
- 分页优化：避免深分页，使用游标分页
- 延迟加载：合理配置关联查询的加载策略
- 监控告警：建立性能监控和告警机制
#### 9.2 性能调优流程
- 性能基准测试：建立性能基准线
- 瓶颈识别：使用工具识别性能瓶颈
- 优化实施：按优先级实施优化方案
- 效果验证：测试优化效果
- 持续监控：建立长期监控机制
### 10.  常见问题与解决方案
#### 10.1 性能问题诊断
|问题现象	|可能原因	|解决方案|
| -- | -- | -- |
|查询响应慢	|缺少索引、SQL不优化	|添加索引、优化SQL|
|内存占用高	|缓存配置不当	|调整缓存大小和策略|
|连接池耗尽	|连接泄露、配置不当	|检查连接关闭、调整配置|
|批量操作慢	|批次大小不当、无事务	|调整批次大小、使用事务|
#### 10.2 优化注意事项
注意事项
- 性能优化要基于实际测试数据，不要盲目优化
- 缓存使用要考虑数据一致性问题
- 批量操作要控制批次大小，避免内存溢出
- 索引不是越多越好，要考虑写入性能
- 连接池配置要根据实际并发量调整
### 11. 实践练习
练习任务
1. 配置Druid连接池并启用监控
2. 实现用户批量插入功能并测试性能
3. 配置MyBatis二级缓存
4. 优化用户查询SQL并添加索引
5. 实现延迟加载的用户订单关联查询
6. 编写性能测试代码对比优化效果
### 12. 运行示例
运行步骤
- 确保MySQL数据库已安装并运行
- 创建数据库：CREATE DATABASE mybatis_performance;
- 修改application.yml中的数据库连接信息
- 运行项目：mvn spring-boot:run
- 查看控制台输出的性能测试结果
- 访问Druid监控页面：http://localhost:8080/performance-demo/druid/
- 观察SQL执行情况和连接池状态

性能测试结果示例
```bash
=== MyBatis 性能优化演示 === 
1. 批量操作性能对比 
逐条插入1000条记录耗时: 2156ms 
批量插入1000条记录耗时: 234ms 
性能提升: 9.2倍 
2. 缓存机制演示 
首次查询耗时: 45ms 
二次查询耗时: 2ms 
缓存命中，性能提升: 22.5倍 
3. SQL优化演示 
优化后查询耗时: 12ms, 结果数量: 156 
未优化查询耗时: 89ms, 结果数量: 156 
SQL优化性能提升: 7.4倍
```
### 本章小结

- 性能优化策略：从数据库、框架、应用、系统四个层面进行优化
- SQL优化技巧：索引优化、查询优化、分页查询优化
- 缓存机制：一级缓存、二级缓存、Spring Cache集成
- 批量操作：批量插入、批量更新、性能对比分析
- 连接池优化：Druid配置、监控设置
- 延迟加载：关联查询优化、避免N+1问题
- 配置优化：MyBatis核心配置、插件配置
- 性能监控：监控指标、性能分析



