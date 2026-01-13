---
title: "SpringBoot-核心概念与配置管理"
date: 2021-02-18T17:29:39+08:00
draft: false
description: "SpringBoot-核心概念与配置管理：SpringBoot注解、配置管理、日志管理、Starters。"
tags: ["SpringBoot","框架应用"]
categories: ["Framework"]
---

## SpringBoot 注解
### 注解分类概述
按功能分类
- 核心注解：
  - @SpringBootApplication: 组合了@Configuration、@EnableAutoConfiguration、@ComponentScan
  - @Configuration: 用于定义配置类，可替换xml配置文件
- Web注解： 
  - @Controller: 控制器，处理http请求
  - @RestController: 响应数据为json格式，相当于@Controller + @ResponseBody，用于构建restful api
  - @RequestMapping：请求映射，用于将http请求映射到控制器的处理方法
- 数据注解：
  - @Entity：实体类，用于映射数据库表
  - @Repository：数据访问类，用于操作数据库
  - @Transactional：事务注解，用于管理数据库事务
- 依赖注入：
  - @Autowired：依赖注入注解，用于自动注入对象
  - @Component：组件注解，用于定义bean
  - @Service：用于定义业务逻辑层bean
- 配置注解：
  - @Value：用于注入属性值，@Value("${name}")，从配置文件中注入属性值
  - @ConfigurationProperties：用于将配置文件中的属性值绑定到Java对象中。

### 核心启动注解
1. @SpringBootApplication：SpringBoot应用的主注解，组合了多个核心注解
```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
                    
等价于：@Configuration + @EnableAutoConfiguration + @ComponentScan

2. @Configuration:标识配置类，替代传统的XML配置文件
```java
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}
```
                    
3. @EnableAutoConfiguration:启用SpringBoot的自动配置机制
```java
@EnableAutoConfiguration
@ComponentScan
public class Application {
    // 自动配置数据源、JPA等
}
```
                   
4. @ComponentScan:指定组件扫描的包路径
```java                  
@ComponentScan(basePackages = {
    "com.example.controller",
    "com.example.service"
})
public class Application {
}
```                  
```java
// 完整的主启动类示例
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
            

### Web开发注解
1. @RestController:RESTful API控制器，自动将返回值序列化为JSON
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```
                    
2. @Controller:传统MVC控制器，通常返回视图名称
```java
@Controller
public class HomeController {
    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("message", "Hello");
        return "index"; // 返回视图名
    }
}
```                    
3. @RequestMapping:映射HTTP请求到处理方法
```java
@RequestMapping(
    value = "/users", 
    method = RequestMethod.GET,
    produces = "application/json"
)
public List<User> getUsers() {
    return userService.findAll();
}
```                
4. @GetMapping / @PostMapping:HTTP方法特定的映射注解
```java
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {}

@PostMapping("/users")
public User createUser(@RequestBody User user) {}

@PutMapping("/users/{id}")
public User updateUser(@PathVariable Long id, @RequestBody User user) {}

@DeleteMapping("/users/{id}")
public void deleteUser(@PathVariable Long id) {}
```
                    
5. @PathVariable:绑定URL路径中的变量
```java
@GetMapping("/users/{id}/orders/{orderId}")
public Order getUserOrder(
    @PathVariable Long id,
    @PathVariable Long orderId
) {
    return orderService.findByUserAndId(id, orderId);
}
```                   
6. @RequestParam: 绑定请求参数
```java
@GetMapping("/users")
public List<User> getUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(required = false) String name
) {
    return userService.findUsers(page, size, name);
}
```                  
7. @RequestBody: 绑定请求体中的JSON数据
```java
@PostMapping("/users")
public User createUser(@RequestBody User user) {
    return userService.save(user);
}

@PostMapping("/users/batch")
public List<User> createUsers(
    @RequestBody List<User> users
) {
    return userService.saveAll(users);
}
```                  
8. @ResponseBody: 将返回值直接写入HTTP响应体
```java
@Controller
public class ApiController {
    @GetMapping("/api/data")
    @ResponseBody
    public Map<String, Object> getData() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        return result;
    }
}
```                  
```java
// 完整的RESTful控制器示例
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<User> users = userService.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(users.getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        return user != null ? 
            ResponseEntity.ok(user) : 
            ResponseEntity.notFound().build();
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody @Valid User user) {
        User savedUser = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
        @PathVariable Long id, 
        @RequestBody @Valid User user
    ) {
        User updatedUser = userService.update(id, user);
        return ResponseEntity.ok(updatedUser);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```            

### 依赖注入注解
1. @Component:通用组件注解，标识Spring管理的Bean
```java
@Component
public class EmailService {
    public void sendEmail(String to, String subject) {
        // 发送邮件逻辑
    }
}
```                  
2. @Service:业务逻辑层组件，@Component的特化
```java
@Service
@Transactional
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    public User save(User user) {
        return userRepository.save(user);
    }
}
```                  
3. @Repository:数据访问层组件，提供异常转换
```java
@Repository
public class UserRepositoryImpl {
    @PersistenceContext
    private EntityManager entityManager;
    
    public List<User> findByCustomQuery() {
        return entityManager
            .createQuery("SELECT u FROM User u")
            .getResultList();
    }
}
```                  
4. @Autowired:自动装配依赖，可用于字段、方法、构造器
```java
@Service
public class OrderService {
    // 字段注入
    @Autowired
    private UserService userService;
    
    // 构造器注入（推荐）
    private final PaymentService paymentService;
    
    @Autowired
    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
    
    // 方法注入
    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }
}
```                  
5. @Qualifier:指定要注入的Bean名称
```java
@Service
public class NotificationService {
    @Autowired
    @Qualifier("emailNotifier")
    private Notifier emailNotifier;
    
    @Autowired
    @Qualifier("smsNotifier")
    private Notifier smsNotifier;
}
 ```                  
6. @Primary:标识主要的Bean，当有多个候选时优先选择
```java
@Component
@Primary
public class EmailNotifier implements Notifier {
    // 默认的通知实现
}

@Component
public class SmsNotifier implements Notifier {
    // 短信通知实现
}
```                   
> ⚠️ 依赖注入最佳实践
> - 优先使用构造器注入，避免字段注入
> - 使用@Qualifier解决多个Bean的歧义
> - 合理使用@Primary标识默认实现
> - 避免循环依赖

### 配置注解
1. @Value: 注入配置文件中的属性值
```java
@Component
public class AppConfig {
    @Value("${app.name}")
    private String appName;
    
    @Value("${server.port:8080}")
    private int serverPort;
    
    @Value("#{systemProperties['java.home']}")
    private String javaHome;
}
```                  
2. @ConfigurationProperties:批量绑定配置属性到Java对象
```java
@ConfigurationProperties(prefix = "app.database")
@Component
public class DatabaseConfig {
    private String url;
    private String username;
    private String password;
    private int maxConnections;
    
    // getter和setter方法
}
```                                  
3. @Profile:指定Bean在特定环境下才生效
```java
@Profile("development")
public class DevConfig {
    @Bean
    public DataSource dataSource() {
        return new H2DataSource();
    }
}

@Configuration
@Profile("production")
public class ProdConfig {
    @Bean
    public DataSource dataSource() {
        return new MySQLDataSource();
    }
}
 ```                  
4. @Conditional:条件化配置，满足条件时才创建Bean
```java
@Configuration
public class CacheConfig {
    @Bean
    @ConditionalOnProperty(
        name = "feature.cache.enabled", 
        havingValue = "true"
    )
    public CacheManager cacheManager() {
        return new RedisCacheManager();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public CacheManager defaultCacheManager() {
        return new SimpleCacheManager();
    }
}
```                   
> - 使用@ConditionalOnProperty判断配置属性
> - 使用@ConditionalOnMissingBean判断是否存在Bean
> - 可以自定义条件注解


``` java                
// 配置属性类示例
@ConfigurationProperties(prefix = "app")
@Component
@Validated
public class AppProperties {
    
    @NotBlank
    private String name;
    
    @Min(1)
    @Max(65535)
    private int port = 8080;
    
    private Database database = new Database();
    
    private List<String> allowedOrigins = new ArrayList<>();
    
    // getter和setter方法
    
    public static class Database {
        private String url;
        private String username;
        private String password;
        private int maxConnections = 10;
        
        // getter和setter方法
    }
}
```           
```yaml
# application.yml 配置示例
app:
  name: "My Spring Boot App"
  port: 8080
  database:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: 123456
    max-connections: 20
  allowed-origins:
    - http://localhost:3000
    - https://example.com
```           

### 数据访问注解
1. @Entity:JPA实体类注解
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String email;
}
 ```                  
2. @Transactional:声明式事务管理
```java
@Service
@Transactional
public class UserService {
    
    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id);
    }
    
    @Transactional(rollbackFor = Exception.class)
    public User save(User user) {
        return userRepository.save(user);
    }
}
 ```                  
3. @Query:自定义查询方法
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    User findByEmail(String email);
    
    @Query(value = "SELECT * FROM users WHERE age > :age", 
           nativeQuery = true)
    List<User> findUsersOlderThan(@Param("age") int age);
}
 ```                  
4. @Modifying:标识修改操作的查询方法
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :now WHERE u.id = :id")
    int updateLastLogin(@Param("id") Long id, @Param("now") LocalDateTime now);
    
    @Modifying
    @Query("DELETE FROM User u WHERE u.active = false")
    int deleteInactiveUsers();
}
```                    

### 验证注解
1. @Valid / @Validated: 启用Bean验证
```java
@PostMapping("/users")
public User createUser(@RequestBody @Valid User user) {
    return userService.save(user);
}

@Service
@Validated
public class UserService {
    public User save(@Valid User user) {
        return userRepository.save(user);
    }
}
```                   
2. 常用验证注解: Bean Validation标准注解
```java
@Entity
public class User {
    @NotNull(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度3-20字符")
    private String username;
    
    @Email(message = "邮箱格式不正确")
    @NotBlank(message = "邮箱不能为空")
    private String email;
    
    @Min(value = 18, message = "年龄不能小于18")
    @Max(value = 100, message = "年龄不能大于100")
    private Integer age;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
}
```                   
### 常见问题解决
- 问题1：@Autowired注入失败
  - 原因：Bean未被Spring管理或包扫描路径不正确
  - 解决：检查@Component注解和@ComponentScan配置

- 问题2：循环依赖
  - 原因：两个Bean相互依赖
  - 解决：使用@Lazy注解或重构代码结构

- 问题3：@Value注入null
  - 原因：配置文件中没有对应属性或格式错误
  - 解决：检查配置文件和属性名称

> 调试技巧
> - 使用@PostConstruct验证Bean初始化
> - 启用debug日志查看Bean创建过程
> - 使用ApplicationContext.getBean()手动获取Bean
> - 检查@Profile和@Conditional条件
### 最佳实践
注解使用原则
- 优先使用构造器注入
- 合理使用@Profile区分环境
- 使用@ConfigurationProperties替代多个@Value
- 在Service层使用@Transactional

性能优化建议
- 避免过度使用@Autowired
- 合理设置@Transactional的传播行为
- 使用@Lazy延迟加载非必需Bean
- 正确配置@ComponentScan范围
> 核心要点: SpringBoot注解是声明式编程的体现，理解每个注解的作用机制是掌握SpringBoot的关键

## SpringBoot 配置文件

### 配置文件概述
SpringBoot支持的配置格式
- application.properties：传统的键值对格式
- application.yml/yaml：YAML格式，层次化配置
- 环境变量：系统环境变量
- 命令行参数：启动时传入的参数
- 外部配置文件：jar包外的配置文件
> 配置文件位置: SpringBoot会按优先级顺序查找配置文件：classpath根目录、classpath:/config/、当前目录、当前目录/config/

### Properties 格式
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
logging.level.com.example=DEBUG 
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
```
优点
- 简单易懂
- IDE支持好
- 传统格式

缺点
- 冗余较多
- 层次不清晰
- 不支持复杂结构

### YAML 格式
```yaml
# 服务器配置 
server: 
    port: 8080 
    servlet: 
        context-path: /api 
# 数据库配置 
spring: 
    datasource: 
        url: jdbc:mysql://localhost:3306/demo 
        username: root 
        password: 123456 
        driver-class-name: com.mysql.cj.jdbc.Driver 
# JPA配置 
jpa: 
    hibernate: 
        ddl-auto: update 
    show-sql: true 
    properties: 
        hibernate: 
            format_sql: true 
# 日志配置 
logging: 
    level: 
        com.example: DEBUG 
    pattern: 
        console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```                   
优点：
- 层次清晰
- 简洁易读
- 支持复杂结构
缺点：
- 对缩进敏感
- 学习成本稍高
- 调试相对困难

### 多环境配置管理
SpringBoot支持通过Profile机制管理不同环境的配置，实现开发、测试、生产环境的配置分离

#### 开发环境 (dev)
用于本地开发调试
```yaml
# application-dev.yml 
server: 
    port: 8080 
    servlet: 
        context-path: /api 
spring: 
    datasource: 
        url: jdbc:h2:mem:devdb 
        username: sa 
        password: h2: console: enabled: true 
logging: 
    level: 
        root: DEBUG
```                   
#### 测试环境 (test)
用于集成测试
```yaml
# application-test.yml 
server: 
    port: 8081 
spring: 
    datasource: 
        url: jdbc:mysql://test-db:3306/testdb 
        username: test_user 
        password: test_pass 
    jpa: 
        hibernate: 
            ddl-auto: create-drop 
logging: 
    level: 
        root: INFO
```                   
#### 生产环境 (prod)
用于生产部署
```yaml
# application-prod.yml 
server: 
    port: 80 
spring: 
    datasource: 
        url: jdbc:mysql://prod-db:3306/proddb 
        username: ${DB_USERNAME} 
        password: ${DB_PASSWORD} 
    jpa: 
        hibernate: 
            ddl-auto: validate 
        show-sql: false 
logging: 
    level: 
        root: WARN
```                   
#### 主配置文件
指定激活的Profile
```yaml
# application.yml 
spring: 
    profiles: 
        active: dev # 默认激活开发环境 
# 通用配置 
app: 
    name: "My Spring Boot App" 
    version: "1.0.0"
```
> Profile激活方式
> - 配置文件：spring.profiles.active=prod
> - 环境变量：SPRING_PROFILES_ACTIVE=prod
> - IDE配置：在运行配置中设置Active profiles

### 常用配置属性详解
#### 服务器配置
```yaml
server: 
    port: 8080 # 端口号 
    servlet: 
        context-path: /api # 上下文路径 
    session: 
        timeout: 30m # 会话超时 
    compression: 
        enabled: true # 启用压缩 
        mime-types: text/html,text/css,application/json 
    ssl: 
        enabled: false # SSL配置
```
#### 数据源配置
```yaml
spring: 
    datasource: 
        url: jdbc:mysql://localhost:3306/demo 
        username: root 
        password: 123456 
        driver-class-name: com.mysql.cj.jdbc.Driver 
        hikari: # 连接池配置 
            maximum-pool-size: 20 
            minimum-idle: 5 
            connection-timeout: 30000 
            idle-timeout: 600000
```
#### JPA配置
```yaml
spring: 
    jpa: 
        hibernate: 
            ddl-auto: update # 数据库表更新策略 
        naming: 
            physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl 
            show-sql: true # 显示SQL 
            properties: 
                hibernate: format_sql: true # 格式化SQL 
                dialect: org.hibernate.dialect.MySQL8Dialect
```
#### 日志配置
```yaml
logging: 
    level: 
        root: INFO # 根日志级别 
        com.example: DEBUG # 包级别日志 
        org.springframework.web: DEBUG 
        org.hibernate.SQL: DEBUG 
    pattern: 
        console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n" 
        file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n" 
    file: 
        name: logs/application.log
```

### 外部化配置
配置优先级（从高到低）
- 命令行参数
- SPRING_APPLICATION_JSON中的属性
- ServletConfig初始化参数
- ServletContext初始化参数
- JNDI属性
- Java系统属性
- 操作系统环境变量
- jar包外的application-{profile}.properties
- jar包内的application-{profile}.properties
- jar包外的application.properties
- jar包内的application.properties
> 实用技巧:生产环境建议使用环境变量或外部配置文件，避免敏感信息打包到jar中

### 配置加密
敏感信息处理
- 使用环境变量存储密码
- 使用Spring Cloud Config加密
- 使用Jasypt加密配置
- 使用外部密钥管理系统

环境变量示例
```yaml
# 配置文件中使用环境变量 
spring: 
    datasource: 
    url: ${DATABASE_URL:jdbc:h2:mem:testdb} 
    username: ${DATABASE_USERNAME:sa} 
    password: ${DATABASE_PASSWORD:} 
    # 自定义配置 
    app: 
        jwt: 
            secret: ${JWT_SECRET:default-secret} 
            expiration: ${JWT_EXPIRATION:86400}
```
命令行启动示例
```bash
# 设置环境变量 
export DATABASE_URL=jdbc:mysql://prod-db:3306/proddb 
export DATABASE_USERNAME=prod_user 
export DATABASE_PASSWORD=secure_password 
# 启动应用 
java -jar app.jar --spring.profiles.active=prod
```
### 配置验证
使用@ConfigurationProperties验证
```java
@ConfigurationProperties(prefix = "app") 
@Component 
@Validated 
public class AppProperties { 
    @NotBlank(message = "应用名称不能为空") 
    private String name; 
    @Min(value = 1, message = "端口号必须大于0") 
    @Max(value = 65535, message = "端口号不能超过65535") 
    private int port = 8080; 
    @Valid 
    private Database database = new Database(); 
    public static class Database { 
        @NotBlank(message = "数据库URL不能为空") 
        private String url; 
        @NotBlank(message = "用户名不能为空") 
        private String username; 
        // getter和setter 
    } 
    // getter和setter 
}
```
> 注意事项
> - 启用配置验证需要添加spring-boot-starter-validation依赖
> - 验证失败会导致应用启动失败
> - 建议为所有配置属性添加默认值

### 最佳实践
配置管理建议
- 使用YAML格式提高可读性
- 合理使用Profile分离环境
- 敏感信息使用环境变量
- 为配置属性添加验证
- 使用@ConfigurationProperties替代@Value

性能优化
- 避免在配置中使用复杂表达式
- 合理设置连接池参数
- 启用适当的缓存配置
- 配置合理的超时时间
> 核心要点: 配置文件是SpringBoot应用的重要组成部分，合理的配置管理能够提高应用的可维护性和部署灵活性



## SpringBoot 日志
### SpringBoot日志架构
默认日志配置
- SLF4J：日志门面（Facade）
- Logback：默认日志实现
- Commons Logging：Spring框架使用
- JUL：Java原生日志

日志流程
```text
应用代码 → SLF4J API → 日志实现 → 输出目标
    ↓           ↓          ↓         ↓
  Logger    门面接口    Logback    控制台/文件
```             
> 为什么使用SLF4J？
>
> SLF4J提供了统一的日志接口，可以在运行时绑定不同的日志实现，提高了代码的可移植性。

### 日志级别详解
SpringBoot支持多种日志级别，从详细的调试信息到严重的错误信息

#### TRACE
最详细的日志信息，通常只在开发时使用
```java
logger.trace("进入方法: {}", methodName);
logger.trace("变量值: {}", variable);
```                  
使用场景：方法进入/退出、变量值跟踪

#### DEBUG
调试信息，用于开发和测试阶段
```java
logger.debug("处理用户请求: {}", userId);
logger.debug("SQL查询: {}", sql);
```                
使用场景：业务逻辑调试、SQL语句、算法步骤

#### INFO
一般信息，记录应用的正常运行状态
```java
logger.info("应用启动完成，端口: {}", port);
logger.info("用户登录成功: {}", username);
```                   
使用场景：应用启动、用户操作、重要业务事件

#### WARN
警告信息，表示潜在问题但不影响运行
```java
logger.warn("配置文件缺失，使用默认值");
logger.warn("API调用超时，重试中...");
```                  
使用场景：配置问题、性能警告、降级处理

#### ERROR
错误信息，表示严重问题需要关注
```java
logger.error("数据库连接失败", exception);
logger.error("支付处理异常: {}", orderId, ex);
```                    
使用场景：异常处理、系统错误、业务失败

### 基础日志配置
application.yml配置
```yaml
# 日志配置
logging:
  # 日志级别配置
  level:
    root: INFO                    # 根日志级别
    com.example: DEBUG            # 包级别
    org.springframework.web: DEBUG # Spring Web调试
    org.hibernate.SQL: DEBUG      # SQL语句
    org.hibernate.type: TRACE     # SQL参数
  
  # 输出格式
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
  
  # 文件配置
  file:
    name: logs/application.log      # 日志文件名
    max-size: 10MB                  # 单文件最大大小
    max-history: 30                # 保留天数
  
  # 控制台颜色输出
  pattern:
    console: "%clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} %clr([%thread]){magenta} %clr(%-5level){highlight} %clr(%logger{36}){cyan} - %msg%n"
```           
Java代码中使用
```java
// 使用SLF4J
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class UserController {
    
    private static final Logger logger = 
        LoggerFactory.getLogger(UserController.class);
    
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        logger.info("获取用户信息，ID: {}", id);
        
        try {
            User user = userService.findById(id);
            logger.debug("用户信息: {}", user);
            return user;
        } catch (Exception e) {
            logger.error("获取用户失败，ID: {}", id, e);
            throw e;
        }
    }
}
```           

### 高级日志配置
自定义Logback配置（logback-spring.xml）
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- 控制台输出 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 文件输出 -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/application.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 错误日志单独文件 -->
    <appender name="ERROR_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
        <file>logs/error.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/error.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 根日志配置 -->
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
        <appender-ref ref="ERROR_FILE"/>
    </root>
    
    <!-- 特定包的日志级别 -->
    <logger name="com.example" level="DEBUG"/>
    <logger name="org.springframework.web" level="DEBUG"/>
</configuration>
```          
> ⚠️ 配置文件优先级: logback-spring.xml > logback.xml > application.yml中的logging配置

### 日志框架对比
#### Logback
SpringBoot默认日志实现
- 性能优秀，内存占用低
- 配置灵活，支持XML和Groovy
- 自动重载配置文件
- 丰富的过滤器和输出器

优点
- SpringBoot默认
- 性能优秀
- 功能丰富
缺点
- 配置复杂
- 学习成本高
#### Log4j2
Apache的高性能日志框架
- 异步日志性能极佳
- 支持Lambda表达式
- 插件架构，扩展性强
- 支持多种配置格式

优点
- 性能最佳
- 功能强大
- 扩展性好
缺点
- 配置复杂
- 依赖较多
#### JUL
Java原生日志框架

- JDK内置，无需额外依赖
- 配置简单
- 轻量级
- 与Java平台集成好

优点
- 无额外依赖
- 简单易用
- 轻量级

缺点
- 功能有限
- 性能一般
#### Commons Logging
Apache的日志门面

- 日志门面，不是实现
- 自动发现日志实现
- Spring框架使用
- 简单的API

优点
- 自动适配
- Spring集成
- 简单易用
缺点
- 类加载问题
- 性能开销

### 生产环境最佳实践
性能优化
- 使用异步日志减少I/O阻塞
- 合理设置日志级别
- 避免在循环中打印大量日志
- 使用参数化日志避免字符串拼接

异步日志配置
```yml
# application.yml
logging:
  level:
    root: INFO
    com.example: DEBUG
```
logback-spring.xml中配置异步
```xml
<appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
    <discardingThreshold>0</discardingThreshold>
    <queueSize>1024</queueSize>
    <appender-ref ref="FILE"/>
</appender>
```                
日志安全
- 避免记录敏感信息（密码、身份证等）
- 对敏感数据进行脱敏处理
- 控制日志文件访问权限
- 定期清理过期日志

### 日志监控与分析
日志收集方案
- ELK Stack：Elasticsearch + Logstash + Kibana
- Fluentd：统一日志收集层
- Prometheus + Grafana：指标监控
- Zipkin/Jaeger：分布式链路追踪

结构化日志
```java
// 使用结构化日志
import net.logstash.logback.marker.Markers;

logger.info(Markers.append("userId", userId)
    .and(Markers.append("action", "login"))
    .and(Markers.append("ip", clientIp)),
    "用户登录成功");

// 输出JSON格式
{
  "timestamp": "2023-12-01T10:30:00.123Z",
  "level": "INFO",
  "message": "用户登录成功",
  "userId": "12345",
  "action": "login",
  "ip": "192.168.1.100"
}
 ```               
> 监控指标: 关注ERROR日志数量、响应时间、异常堆栈等关键指标，设置合理的告警阈值

### 常见问题解决
1. 日志不输出到文件
```yaml
# 检查文件路径权限
logging:
  file:
    name: ./logs/app.log  # 使用相对路径
    
# 或者指定绝对路径
logging:
  file:
    name: /var/log/myapp/app.log
```                
2. 日志级别不生效
```yaml
# 确保包名正确
logging:
  level:
    com.example.service: DEBUG  # 精确包名
    com.example: INFO           # 父包级别
```                
3. 日志文件过大
```yaml
# 配置日志轮转
logging:
  logback:
    rollingpolicy:
      max-file-size: 10MB
      max-history: 30
      total-size-cap: 1GB
```                

### 学习总结
#### 核心知识点
- SpringBoot默认使用SLF4J + Logback
- 日志级别：TRACE < DEBUG < INFO < WARN < ERROR
- 支持多环境配置和外部化配置
- 可以通过配置文件或代码自定义日志行为

#### 实践建议
- 开发环境使用DEBUG级别
- 生产环境使用INFO或WARN级别
- 重要业务操作记录INFO日志
- 异常情况记录ERROR日志

> 核心要点: 合理的日志配置是应用监控和问题排查的基础，要根据不同环境选择合适的日志级别和输出方式。

## SpringBoot Starters

### Starter核心概念
1. 什么是Starter
   - Starter是SpringBoot提供的一套依赖描述符，包含了特定功能所需的所有依赖。

2. 设计理念
   - 约定优于配置，开箱即用，零配置启动。

3. 组成部分
   - 依赖管理 + 自动配置 + 默认配置 = 完整的功能模块。

4. 命名规范
   - 官方：spring-boot-starter-*
   - 第三方：*-spring-boot-starter

### 常用官方Starters
- Web开发
  - spring-boot-starter-web
  - 包含Spring MVC、Tomcat、Jackson等Web开发必需组件
- 数据访问
  - spring-boot-starter-data-jpa
  - 包含Spring Data JPA、Hibernate、数据库连接池等
- 安全框架
  - spring-boot-starter-security
  - 包含Spring Security核心组件和Web安全配置
- 监控管理
  - spring-boot-starter-actuator
  - 提供应用监控、健康检查、指标收集等功能
- 测试支持
  - spring-boot-starter-test
  - 包含JUnit、Mockito、Spring Test等测试框架
- 缓存支持
  - spring-boot-starter-cache
  - 提供缓存抽象和多种缓存实现支持
- 邮件发送
  - spring-boot-starter-mail
  - 包含JavaMail API和Spring邮件发送支持
- AOP支持
  - spring-boot-starter-aop
  - 包含Spring AOP和AspectJ支持

### 自定义Starter开发步骤
#### 开发步骤
- 创建Maven项目
- 定义配置属性类
- 编写自动配置类
- 创建spring.factories文件
- 编写核心功能类
- 测试和发布
#### 关键注解
- @Configuration - 配置类
- @EnableConfigurationProperties - 启用配置
- @ConditionalOnClass - 条件装配
- @ConditionalOnProperty - 属性条件
- @Bean - Bean定义
- @ConfigurationProperties - 配置绑定

### Starter最佳实践
- 遵循命名规范 - 使用标准的命名约定
- 提供配置属性 - 允许用户自定义配置
- 条件装配 - 根据环境智能装配Bean
- 提供默认配置 - 开箱即用的默认设置
- 文档完善 - 提供详细的使用文档
- 版本兼容 - 保持向后兼容性

### 热门第三方Starters
1. MyBatis
   - mybatis-spring-boot-starter - MyBatis ORM框架集成

2. Redis
   - spring-boot-starter-data-redis - Redis缓存和数据存储

3. MongoDB
   - spring-boot-starter-data-mongodb - MongoDB文档数据库

4. Swagger
   - springfox-boot-starter - API文档生成工具

### Starter工作原理
1. 依赖引入
   - 通过Maven/Gradle引入Starter依赖。

2. 自动配置
   - SpringBoot扫描spring.factories文件，加载自动配置类。

3. 条件判断
   - 根据@Conditional注解判断是否满足装配条件。

4. Bean创建
   - 满足条件时自动创建和配置相关Bean。

### Starter相关常见面试题
#### 1.什么是SpringBoot Starter？有什么优势？
1️⃣底层原理（大白话）

1. Starter = **“官方打包好的套餐”**  
   它本身几乎不写代码，只在 POM 里把“**一组经过严格版本对齐的依赖**”聚合起来，并配合**自动配置类**，做到“**引一个 jar，就有一整套功能**”。

2. 命名约定  
   - `spring-boot-starter-*` —— 官方场景（web、data-jpa、security...）  
   - `*-spring-boot-starter` —— 第三方或公司自建场景（如 `my-log-spring-boot-starter`）。

3. 和自动配置的联动  
   拉进 starter → jar 到位 → 自动配置类上的 `@ConditionalOnClass` 条件成立 → 相关 Bean 被注册 → 开发者**只写业务代码**，其余全默认。

------------------------------------------------
2️⃣源码/命令示例（直接落地）

1. 不用 starter 的“原始”写法（部分）
```xml
<!-- 光一个 Web MVC 就要写 10 几条，版本自己对齐 -->
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
...
```

2. 用 starter 的“套餐”写法
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- 版本由 Boot 父 POM 统一，不写 -->
</dependency>
```
`mvn dependency:tree` 可见**一次拉进 20+ 无冲突 jar**，且 Tomcat、Jackson、Spring MVC 全部自动配置好。

3. 公司自定义 starter（30 分钟）
见前一条“自定义自动配置”回答，只需：
- 新建空壳模块 `my-log-spring-boot-starter` 聚合依赖  
- `my-log-spring-boot-autoconfigure` 写配置 & 业务 Bean  
- 发布到私有仓库，其他项目**一条 dependency 即可拥有统一日志切面功能**，零代码侵入。

------------------------------------------------
3️⃣Starter 的 4 大优势（面试秒答）

1. **一键引入，告别“拼积木”**  
2. **版本统一，零 jar 冲突**  
3. **约定优于配置，开箱即用**  
4. **企业级复用——自写 starter，技术沉淀不拷贝代码**

------------------------------------------------
4️⃣口诀（10 秒背会）

“**起步依赖是套餐，版本对齐不打架；**  
**自动配置跟着走，开箱即用笑哈哈！**”

#### 2.Starter的工作原理是什么？
1️⃣底层原理（大白话）

1. Starter 本身**几乎没代码**，只做两件事：  
   ① 在 `pom.xml` 里把“**一组官方测好、版本对齐**”的依赖用 `<dependency>` 聚合；  
   ② 在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 里列出自带的 **XxxAutoConfiguration** 全限定名。  

2. 启动时，Spring Boot 会：  
   - 扫描 **classpath 下所有 `*.imports`** → 拿到配置类列表；  
   - 通过 `@ConditionalOnXxx` 判断是否满足条件；  
   - 条件成立就执行里面的 `@Bean`，把所需组件一次性注册进容器。  

3. 结果：**引一个 starter → jar 到位 → 自动配置类生效 → Bean 准备好 → 直接写业务**。

------------------------------------------------
2️⃣源码级流程（给你翻源码）

1. 入口：`SpringApplication.run`
```java
SpringApplication.run(MyApp.class, args);
```

2. 加载自动配置名单  
   `AutoConfigurationImportSelector#getCandidateConfigurations` 里：
```java
List<String> configurations = SpringFactoriesLoader
        .loadFactoryNames(EnableAutoConfiguration.class, classLoader);
```
底层读取：
```
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
```
示例内容（官方 web starter 自带）：
```
org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration
org.springframework.boot.autoconfigure.http.HttpMessageConvertersAutoConfiguration
...
```

3. 条件过滤  
   每个配置类头顶各种 `@ConditionalOnClass`、`@ConditionalOnMissingBean`...  
   全部通过后，执行：
```java
@Bean
@ConditionalOnMissingBean
public TomcatServletWebServerFactory tomcatServletWebServerFactory() {
    return new TomcatServletWebServerFactory();
}
```
于是**内嵌 Tomcat**、**Spring MVC**、**Jackson** 等 Bean 被注册好。

------------------------------------------------
3️⃣动手验证（一行命令看流程）

启动时加：
```bash
java -jar app.jar -Ddebug
```
控制台会输出：
```
Positive matches:
-----------------
   ServletWebServerFactoryAutoConfiguration matched:
      - @ConditionalOnClass found Servlet class (OnClassCondition)
      - @ConditionalOnMissingBean (types: ServletWebServerFactory) found no beans (OnMissingBeanCondition)
```
→ 证明 starter 带来的自动配置类已生效。

------------------------------------------------
4️⃣口诀（10 秒背会）

“**Starter 只开菜单，imports 把单点；**  
**条件注解来守门，满足条件就注册；**  
**jar 到位事做完，零配即用真舒服！**”


#### 3.如何自定义一个Starter？
自定义 SpringBoot Starter 的“标准套路”官方叫 **“两模块 + 三文件”**——  
把“自动配置”与“依赖聚合”解耦，**30 分钟就能发布一个公司级 starter**。  
下面按 **2025 主流写法**（Spring Boot 3.2+）给你拆成 4 步，全部可拷贝运行。

---

1️⃣底层原理（先知道为什么）

1. Starter 本身**几乎没代码**，只做两件事：  
   ① 在 `pom` 里把一组**版本对齐**的依赖收拢；  
   ② 把自动配置类全限定名登记到  
   `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（**2025 新规则**，老 `spring.factories` 已废弃）[¹⁹^]。  

2. 启动时 SpringBoot 会批量加载该文件 → 条件注解判断 → 注册 Bean → 业务侧**零配置**即可注入使用。

---

2️⃣实战：30 分钟做一个“日志切面”Starter

1. 项目结构（官方标准两模块）
```
my-log-spring-boot-starter          ← 空壳，只聚合依赖
└─ pom.xml
my-log-spring-boot-autoconfigure    ← 核心实现
 ├─ src/main/java/com/demo/log
 │  ├─ MyLogAutoConfiguration.java
 │  ├─ MyLogProperties.java
 │  └─ MyLogAspect.java
 └─ src/main/resources/META-INF/spring
    └─ org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

2. 坐标与依赖（autoconfigure 模块）
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

3. 配置属性（类型安全 + 提示）
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
@AutoConfiguration          // ① Boot 3.x 推荐注解，替代 @Configuration
@EnableConfigurationProperties(MyLogProperties.class)
@ConditionalOnProperty(prefix = "my.log", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MyLogAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyLogAspect myLogAspect(MyLogProperties prop) {
        return new MyLogAspect(prop);
    }
}
```

5. 切面实现（简单打印耗时）
```java
@Aspect
@RequiredArgsConstructor
public class MyLogAspect {
    private final MyLogProperties prop;

    @Around("execution(* com.demo..*.*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return pjp.proceed();
        } finally {
            long cost = System.currentTimeMillis() - start;
            System.out.println(
                MessageFormatter.arrayFormat(prop.getFormat(), new Object[]{cost, pjp.getSignature()}).getMessage()
            );
        }
    }
}
```

6. 注册文件（**2025 新规则**）
`resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
```
com.demo.log.MyLogAutoConfiguration
```
> 老版本用 `spring.factories`，现在已废弃。

7. 空壳 Starter（仅聚合）
```xml
<!-- my-log-spring-boot-starter/pom.xml -->
<dependencies>
    <dependency>
        <groupId>com.demo</groupId>
        <artifactId>my-log-spring-boot-autoconfigure</artifactId>
        <version>${project.version}</version>
    </dependency>
</dependencies>
```

8. 打包 & 使用
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
application.yml 可零配置，也可随时改：
```yaml
my:
  log:
    enabled: true
    format: ">>> {} ms - {}"
```

---

3️⃣调试技巧

1. 启动加 `-Ddebug` 控制台会打印 **Positive/Negative matches**，一眼看出哪个条件挡了你 [¹⁵^]。  
2. 顺序问题用 `@AutoConfigureAfter(DataSourceAutoConfiguration.class)` 显式控制 [¹⁴^]。  
3. 可选依赖加 `<optional>true</optional>`，防止把下游 jar 爆染 [¹⁴^]。

---

4️⃣口诀（10 秒背会）

“**两模块拆清晰，imports 来报名；**  
**@AutoConfiguration 守门员，条件通过就注册；**  
**空壳 POM 聚合依赖，一行 starter 零配置！**”

照这个模板，你 30 分钟就能产出公司级 starter，还能在简历写“**深度掌握 SpringBoot 自动配置机制**”。


#### 4.@ConditionalOnClass注解的作用是什么？
   - 根据类是否存在来判断是否装配Bean。
@ConditionalOnClass 是 Spring Boot 提供的**条件注解**，用来判断** classpath 上是否存在指定类**：

- **存在** → 配置类（或 Bean）才生效  
- **不存在** → 整个配置类被跳过，不报异常，也不创建任何 Bean

底层实现：启动时通过类加载器尝试加载目标类，**加载成功即条件成立**。  
常用于自动配置里“**有某个库才给你配组件**”，例如：

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)   // 只有项目里有 DataSource 才继续
public class DataSourceAutoConfiguration {
    ...
}
```

**口诀**：  
“类在就生效，类无当透明；守门第一关，冲突全不见。”


#### 5.spring.factories文件的作用是什么？
   - 用于配置自动配置类，SpringBoot会扫描该文件加载自动配置。

spring.factories 是 Spring Boot **2.7 之前**的“老名单”文件，纯文本格式，放在

```
META-INF/spring.factories
```

**核心任务**：告诉 Spring Boot **启动时要加载哪些自动配置类 / 监听器 / 初始化器**。

典型内容（节选）：
```
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration,\
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration

# Application Listeners
org.springframework.boot.SpringApplicationRunListener=\
org.springframework.boot.context.event.EventPublishingRunListener
```

加载逻辑：
1. `SpringFactoriesLoader.loadFactoryNames(type, classLoader)` 会扫描所有 jar 包里的 spring.factories；
2. 把 value 按逗号切分 → 得到全限定名列表；
3. 反射实例化并注册到容器。

**现状**：
- **Spring Boot 2.7+ 官方已弃用** spring.factories，改用  
  `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`  
  每行一个类名，解析更快、支持排序；
- 仅当兼容老代码时才保留 spring.factories；**新写 starter 请用 imports 文件**。

口诀：  
“**老名单 spring.factories，启动扫描全加载；**  
**2.7 之后换 imports，单行单类更高效。**”

#### 6.官方Starter和第三方Starter的命名区别？
   - 官方Starter命名为spring-boot-starter-*，第三方Starter命名为*-spring-boot-starter。

官方 Starter 与第三方 Starter 的命名区别，Spring Boot 社区早已形成**固定公约**，最新资料（2025）依旧延续这一规则：

- **官方 Starter**：统一以  
  `spring-boot-starter-{功能名}`  
  为格式，例如  
  `spring-boot-starter-web`、`spring-boot-starter-data-redis`。

- **第三方 / 自定义 Starter**：必须“反着写”，以  
  `{产品名}-spring-boot-starter`  
  为格式，例如  
  `mybatis-spring-boot-starter`、`druid-spring-boot-starter`、`woniu-spring-boot-starter`。

这样设计的目的就是**一眼区分“亲生”与“外来”**，避免 artifactId 冲突，也方便 Maven 仓库检索。

口诀：  
“**官方前缀 spring-boot-starter-，第三方反写 -spring-boot-starter；**  
**守规矩不撞名，仓库搜索不迷路。**”

#### 7.如何排除某个Starter的自动配置？
   - 在application.properties或application.yml中添加spring.autoconfigure.exclude属性。

排除某个 Starter 的自动配置，**只改入口类一行代码**即可，Spring Boot 提供三种官方写法，按场景任选：

---

① 注解级排除（最常用）
在启动类或任何 `@Configuration` 类加：
```java
@SpringBootApplication(
    exclude = {DataSourceAutoConfiguration.class}   // 排除官方自动配置
)
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
```
多个用数组：
```java
exclude = {DataSourceAutoConfiguration.class, RedisAutoConfiguration.class}
```

---

② YAML / Properties 排除（不碰 Java 代码）
```yaml
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
      - org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```
适合运维脚本动态下发，**优先级高于注解**。

---

③ Spring Boot 3.x 新方式：imports 文件里关阀门（高级）
自建：
```
src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.exclude
```
每行写全限定名：
```
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```
**全局生效**，公司级基座常用。

---

验证
启动加 `-Ddebug`，控制台会打印：
```
Exclusions:
-----------
DataSourceAutoConfiguration
```
→ 证明已排除，相关 Bean 不再注册。

---

**口诀**：  
“**注解 exclude 最顺手，YAML 排除不动码；**  
**全局文件加名单，debug 一看就灵验。**”

#### 8.Starter和传统依赖管理的区别？
   - Starter是一种约定大于配置的方式，自动配置了相关Bean，而传统依赖管理需要手动配置。

1️⃣ 底层原理（大白话）

1. 传统依赖管理 = **“自己逛菜市场”**  
   你要什么就写 `<dependency>`，**groupId、artifactId、version 全自己挑**；jar 之间版本冲突、传递依赖冲突，全靠开发者手动排。

2. Starter 依赖管理 = **“官方配好的套餐”** + **“父母 POM 统一收银”**  
   - 只点一个菜名（`spring-boot-starter-web`），**Spring Boot 父 POM 已经锁定**该场景下所有 jar 的版本；  
   - 官方提前把**兼容组合**打成 `<dependencyManagement>`，**冲突概率≈0**；  
   - 还随菜附赠**自动配置类**，jar 到位 Bean 自动生成，**零 XML 零手写配置**。

------------------------------------------------
2️⃣对比清单（直接落地）

| 维度 | 传统依赖 | Starter |
|---|---|---|
| 版本声明 | 自己写 `<version>` | **父 POM 统管，不写** |
| 冲突排查 | 人工 `mvn dependency:tree` 调 | **官方提前对齐，几乎无冲突** |
| 功能集成 | 只拉 jar，**Bean 自己配** | **jar + 自动配置一步到位** |
| 配置量 | XML/JavaConfig 全手写 | **约定优于配置，只改差异** |
| 切换技术栈 | 改 N 个版本、排 N 次冲突 | **换 starter+exclude 即可** |

------------------------------------------------
3️⃣命令感受（同一功能）

传统：要写 10 几条，还要管版本
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
...
```

Starter：一行搞定
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

------------------------------------------------
4️⃣口诀（10 秒背会）

“**传统依赖像买菜，挑菜砍价自己抬；**  
**Starter 是点外卖，套餐版本父母带，**  
**jar 到 Bean 自动摆，省心省时真痛快！**”

> 面试准备建议: 重点掌握Starter的设计理念和工作原理、熟悉常用Starter的功能、了解自定义Starter的开发流程、理解自动配置的条件装配机制