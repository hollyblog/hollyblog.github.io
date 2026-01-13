---
title: "SpringBoot-数据库集成与容器管理"
date: 2021-02-19T17:29:39+08:00
draft: false
description: "SpringBoot-数据库集成与容器管理：数据库集成、IoC容器、应用打包、自动配置和内嵌Tomcat。"
tags: ["SpringBoot","框架应用"]
categories: ["Framework"]
---

## SpringBoot 数据库集成
### SpringBoot数据库支持
核心特性
- 自动配置：零配置启动
- 多数据源：支持多个数据库
- 连接池：HikariCP高性能连接池
- 事务管理：声明式事务支持

技术栈
```text
SpringBoot + Spring Data JPA + Hibernate + HikariCP
     ↓              ↓              ↓           ↓
   框架核心      数据访问层      ORM框架    连接池
```               
> 开箱即用: SpringBoot提供了数据库操作的完整解决方案，只需添加依赖即可使用

### 支持的数据库类型
SpringBoot支持多种关系型和非关系型数据库

#### MySQL
- 特点：开源、高性能、易用
- 适用场景：Web应用、中小型项目
- 驱动：mysql-connector-java
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```                   
#### PostgreSQL
- 特点：功能强大、标准兼容
- 适用场景：企业级应用、复杂查询
- 驱动：postgresql
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: postgres
    password: password
    driver-class-name: org.postgresql.Driver
```                    
#### H2 Database
- 特点：内存数据库、轻量级
- 适用场景：测试、原型开发
- 驱动：h2
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
```                   
#### MongoDB
- 特点：文档数据库、NoSQL
- 适用场景：大数据、灵活模式
- 驱动：spring-boot-starter-data-mongodb
```yaml
# application.yml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/mydb
```

### Spring Data JPA核心概念
- 实体映射: 使用注解将Java类映射到数据库表
- Repository接口: 提供CRUD操作的标准接口
- 查询方法: 通过方法名自动生成查询语句
- 事务管理: 声明式事务处理和回滚机制

### 实体类定义
#### 基础实体类
```java
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;
    
    @Column(name = "email", unique = true, nullable = false)
    private String email;
    
    @Column(name = "password", nullable = false)
    private String password;
    
    @Column(name = "age")
    private Integer age;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // 构造函数
    public User() {}
    
    public User(String username, String email, String password, Integer age) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.age = age;
    }
    
    // getter和setter方法
    // toString、equals、hashCode方法
}
```               
#### 关系映射示例：
```java
// 一对多关系：用户和订单
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();
    
    // getter和setter
}

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String orderNumber;
    private BigDecimal amount;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    // getter和setter
}
```               

### Repository接口
#### 基础Repository
```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 根据用户名查找
    Optional<User> findByUsername(String username);
    
    // 根据邮箱查找
    Optional<User> findByEmail(String email);
    
    // 根据年龄范围查找
    List<User> findByAgeBetween(int minAge, int maxAge);
    
    // 根据用户名模糊查询
    List<User> findByUsernameContaining(String keyword);
    
    // 根据创建时间排序
    List<User> findAllByOrderByCreatedAtDesc();
    
    // 分页查询
    Page<User> findByAgeGreaterThan(int age, Pageable pageable);
    
    // 统计查询
    long countByAgeGreaterThan(int age);
    
    // 存在性检查
    boolean existsByUsername(String username);
    
    // 删除操作
    void deleteByUsername(String username);
}
```                
Repository层次结构
- Repository：标记接口
- CrudRepository：基本CRUD操作
- PagingAndSortingRepository：分页和排序
- JpaRepository：JPA特定功能

### 自定义查询
#### @Query注解
```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // JPQL查询
    @Query("SELECT u FROM User u WHERE u.age > :age")
    List<User> findUsersOlderThan(@Param("age") int age);
    
    // 原生SQL查询
    @Query(value = "SELECT * FROM users WHERE email LIKE %:domain%", 
           nativeQuery = true)
    List<User> findByEmailDomain(@Param("domain") String domain);
    
    // 更新查询
    @Modifying
    @Query("UPDATE User u SET u.age = :age WHERE u.id = :id")
    int updateUserAge(@Param("id") Long id, @Param("age") int age);
    
    // 删除查询
    @Modifying
    @Query("DELETE FROM User u WHERE u.age < :age")
    int deleteUsersYoungerThan(@Param("age") int age);
    
    // 投影查询
    @Query("SELECT u.username, u.email FROM User u WHERE u.age > :age")
    List<UserProjection> findUserProjections(@Param("age") int age);
}

// 投影接口
public interface UserProjection {
    String getUsername();
    String getEmail();
}
```             
> 查询方法命名规则: Spring Data JPA支持通过方法名自动生成查询，如findBy、countBy、deleteBy等

### 事务管理
#### 声明式事务
```java
@Service
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    
    public UserService(UserRepository userRepository, 
                      OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }
    
    // 只读事务
    @Transactional(readOnly = true)
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }
    
    // 写事务
    @Transactional
    public User createUser(User user) {
        return userRepository.save(user);
    }
    
    // 复杂事务操作
    @Transactional(rollbackFor = Exception.class)
    public void createUserWithOrder(User user, Order order) {
        // 保存用户
        User savedUser = userRepository.save(user);
        
        // 设置订单关联
        order.setUser(savedUser);
        orderRepository.save(order);
        
        // 如果这里抛出异常，整个事务会回滚
        if (order.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("订单金额必须大于0");
        }
    }
    
    // 事务传播行为
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logUserAction(Long userId, String action) {
        // 这个方法会在新事务中执行
        // 即使外层事务回滚，这个操作也会提交
    }
}
```               
事务属性
- propagation：事务传播行为
- isolation：事务隔离级别
- timeout：事务超时时间
- readOnly：只读事务
- rollbackFor：回滚异常类型

### 数据库配置
#### 基础配置
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/springboot_demo
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    
    # HikariCP连接池配置
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      
  jpa:
    # Hibernate配置
    hibernate:
      ddl-auto: update  # create, create-drop, update, validate, none
    show-sql: true
    format-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
        
# 日志配置
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```                
#### 多数据源配置
```java
@Configuration
public class DatabaseConfig {
    
    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    @ConfigurationProperties("spring.datasource.secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Primary
    @Bean
    public LocalContainerEntityManagerFactoryBean primaryEntityManagerFactory(
        EntityManagerFactoryBuilder builder,
        @Qualifier("primaryDataSource") DataSource dataSource
    ) {
        return builder
            .dataSource(dataSource)
            .packages("com.example.primary.entity")
            .persistenceUnit("primary")
            .build();
    }
}
```               

### 性能优化
#### 查询优化
- 使用分页查询避免大量数据加载
- 合理使用懒加载和急加载
- 使用投影查询减少数据传输
- 添加适当的数据库索引

#### 批量操作
```java
@Service
public class UserBatchService {
    
    @Autowired
    private EntityManager entityManager;
    
    @Transactional
    public void batchInsertUsers(List<User> users) {
        int batchSize = 20;
        for (int i = 0; i < users.size(); i++) {
            entityManager.persist(users.get(i));
            if (i % batchSize == 0 && i > 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
    }
}
```                
> ⚠️ 性能注意事项: 避免N+1查询问题，合理使用@EntityGraph或JOIN FETCH

### 测试支持
#### Repository测试
```java
@DataJpaTest
class UserRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void testFindByUsername() {
        // 准备测试数据
        User user = new User("testuser", "test@example.com", "password", 25);
        entityManager.persistAndFlush(user);
        
        // 执行查询
        Optional<User> found = userRepository.findByUsername("testuser");
        
        // 验证结果
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }
    
    @Test
    void testFindByAgeBetween() {
        // 准备多个测试用户
        entityManager.persistAndFlush(new User("user1", "user1@example.com", "pass", 20));
        entityManager.persistAndFlush(new User("user2", "user2@example.com", "pass", 30));
        entityManager.persistAndFlush(new User("user3", "user3@example.com", "pass", 40));
        
        // 执行范围查询
        List<User> users = userRepository.findByAgeBetween(25, 35);
        
        // 验证结果
        assertThat(users).hasSize(1);
        assertThat(users.get(0).getUsername()).isEqualTo("user2");
    }
}
```                
> 测试最佳实践: 使用@DataJpaTest进行Repository层测试，它会自动配置内存数据库


## SpringBoot IoC容器与依赖注入
### 内容概览
- **IoC容器原理**: 控制反转的核心思想，Spring容器的工作机制

- **Bean生命周期**: 从创建到销毁的完整过程，生命周期回调方法
- **依赖注入方式**: 构造器注入、Setter注入、字段注入的对比
  - **构造器注入**: 通过构造函数参数进行依赖注入，确保依赖的不可变性
  - **Setter注入**: 通过setter方法进行依赖注入，提供灵活性
  - **字段注入**: 直接在字段上使用@Autowired注解，简洁但不够灵活
- **Bean作用域**: singleton、prototype等作用域管理

### 实战案例
#### 深入理解Spring容器管理
通过实际代码演示IoC容器的工作原理，包括Bean的创建、依赖注入、生命周期管理等核心概念。
```text                       
项目结构                       
src/main/java/com/example/ioc/
├── IocApplication.java          # 主启动类
├── config/
│   └── BeanConfig.java         # Bean配置类
├── service/
│   ├── UserService.java        # 用户服务接口
│   └── impl/
│       └── UserServiceImpl.java # 用户服务实现
├── repository/
│   ├── UserRepository.java     # 用户仓库接口
│   └── impl/
│       └── UserRepositoryImpl.java # 用户仓库实现
└── lifecycle/
    └── CustomBean.java         # 自定义Bean生命周期
```                    
### 重点知识
#### IoC容器原理
  - 控制反转的思想
  - ApplicationContext容器
  - BeanFactory接口
  - 容器启动过程

##### 控制反转（IoC）的思想
1. 一句话结论  
   自己 new 对象 → 容器 new 对象，**控制权从业务代码“反转”到框架**，从而解耦、易测试、易扩展。

2. 底层原理  
   - 通过**反射**创建实例；  
   - 通过**依赖注入DI**把依赖关系自动组装；  
   - 生命周期（初始化、销毁）由容器统一回调。

3. 源码对比（直接跑）
传统主动创建：
```java
UserService userService = new UserServiceImpl();   // 自己掌握控制权
```

IoC 反转：
```java
@Component
public class OrderService {
    @Autowired          // 控制权交给容器
    private UserService userService;
}
```

4. 口诀  
“**以前你 new，现在容器给；控制权一反转，耦合随风去。**”

--------------------------------
##### ApplicationContext 容器
1. 一句话结论  
   它是 Spring IoC 的**高级门面**，在基础 BeanFactory 之上追加**事件发布、国际化、注解扫描、AOP**等enterprise级功能。

2. 底层原理  
   - 接口层：继承 ListableBeanFactory、EnvironmentCapable、MessageSource...  
   - 实现层：ClassPathXmlApplicationContext、AnnotationConfigApplicationContext、SpringBoot 用的 SpringApplication...  
   - 启动时一次性**预实例化所有单例 Bean**（默认非懒加载），并提供统一生命周期管理。

3. 命令示例（SpringBoot 版）
```java
@SpringBootApplication
public class App {
    public static void main(String[] args) {
        ConfigurableApplicationContext ctx =
                SpringApplication.run(App.class, args); // 返回的就是 ApplicationContext
        UserService bean = ctx.getBean(UserService.class);
        System.out.println(bean);
    }
}
```
运行即得到完整的 AnnotationConfigApplicationContext 实例。

4. 口诀  
“**BeanFactory 是地基，ApplicationContext 是精装楼；功能全、事件溜，企业开发不用愁。**”

--------------------------------
##### BeanFactory 接口
1. 一句话结论  
   最**原始/最小**的 IoC 容器契约，只负责**Bean 定义注册、getBean、依赖注入、基础生命周期**，其他高级能力（事件、AOP）一律不管。

2. 核心方法（源码层）
```java
public interface BeanFactory {
    Object getBean(String name) throws BeansException;
    <T> T getBean(Class<T> requiredType) throws BeansException;
    boolean containsBean(String name);
    boolean isSingleton(String name);
    ... // 共 10 来个方法
}
```
常见实现：DefaultListableBeanFactory。

3. 代码体验（纯 BeanFactory，无注解无扫描）
```java
DefaultListableBeanFactory factory = new DefaultListableBeanFactory();
BeanDefinition bd = BeanDefinitionBuilder.genericBeanDefinition(UserService.class).getBeanDefinition();
factory.registerBeanDefinition("userService", bd);
UserService u = factory.getBean(UserService.class);
System.out.println(u);        // 成功拿到容器创建的 Bean
```
**零 XML、零注解**，最底层玩法，用来写框架或测试 Spring 自身。

4. 口诀  
“**BeanFactory 最小核，getBean 靠字符串；功能少却最干净，框架扩展靠它顶。**”

--------------------------------
##### 容器启动过程（AnnotationConfigApplicationContext 视角）
1. 一句话结论  
   **定位 → 加载 → 解析 → 注册 → 实例化 → 注入 → 初始化 → 就绪**，8 步流水线一次性完成。

2. 源码时间轴（可打断点跟）
① 新建容器
```java
new AnnotationConfigApplicationContext(AppConfig.class)
```
② **refresh()** 核心 12 大步（摘关键）
1. obtainFreshBeanFactory → 创建 DefaultListableBeanFactory  
2. loadBeanDefinitions → 解析 @Configuration, @ComponentScan, @Bean... 把 BeanDefinition 注册到 Map  
3. postProcessBeanFactory → 注册 BeanFactoryPostProcessor（含 ConfigurationClassPostProcessor）  
4. invokeBeanFactoryPostProcessors → 回调 @ConfigurationClass, @PropertySource, @ComponentScan 等  
5. registerBeanPostProcessors → 注册 @Autowired 所需 AutowiredAnnotationBeanPostProcessor  
6. finishBeanFactoryInitialization → **预实例化所有单例**  
   - createBeanInstance → 反射选构造器  
   - populateBean → 依赖注入（@Autowired / setter）  
   - aware 阶段 → BeanNameAware, BeanFactoryAware...  
   - BeanPostProcessor before-initialization → @PostConstruct  
   - invokeInit-method → InitializingBean.afterPropertiesSet()  
   - BeanPostProcessor after-initialization → AOP 代理在此完成  
7. finishRefresh → 发布 ContextRefreshedEvent，容器就绪

3. 命令验证
启动加 `-Ddebug` 或断点 `AbstractApplicationContext#refresh` 即可看到 12 大步完整日志。

4. 口诀  
“**定位加载注册先行，实例注入初始化成；refresh 十二步流水线，容器就绪业务赢。**”

--------------------------------
总结成一张图（脑中记忆）

```
控制反转：new 权交容器
    ↓
BeanFactory：最小契约，getBean 核心
    ↓
ApplicationContext：高级门面，事件、AOP、注解扫描
    ↓
refresh() 8-12 步：定位-加载-注册-实例-注入-初始化
```

背熟口诀，面试画图，一气呵成。

#### 依赖注入方式
  - 构造器注入（推荐）
  - Setter方法注入
  - 字段注入（不推荐）
  - 注入方式对比

一句话结论先给全：  
“**构造器强依赖不变更，Setter 可选可重，字段图快最难测；Spring 4.x 起官方推构造器，IDE 会警告字段注入。**”

下面按“原理 → 源码示例 → 口诀”拆给你，直接落地。

--------------------------------
##### 构造器注入（Constructor Injection）★官方推荐
1. 底层原理  
   - Bean 实例化时**唯一构造器**被反射调用，依赖一次性传完；  
   - 完成后对象即**完整不可变**，天然线程安全、易于单元测试（new 即可）；  
   - 与 `@RequiredArgsConstructor` / `@AllArgsConstructor` 配合，可**零注解**实现注入。

2. 源码（最简洁写法）
```java
@RestController
@RequiredArgsConstructor   // Lombok 生成构造器
public class OrderController {
    private final OrderService orderService;   // final 保证必填
    private final UserService userService;

    @GetMapping("/{id}")
    public Order get(@PathVariable Long id) {
        return orderService.find(id);
    }
}
```
Spring 3.x+ 会**自动识别唯一构造器**，无需 `@Autowired`。

1. 口诀  
“**构造器一次性，强依赖不变更；final 加 Lombok，测试 new 不求人。**”

--------------------------------
##### Setter 方法注入（Setter Injection）
1. 底层原理  
   - 先反射**无参构造**创建空对象，再反射调用 setter 把依赖灌入；  
   - 依赖**可选、可重新设置**（后期重配置场景）；  
   - 适合**可选依赖**或**循环依赖**（Spring 会兜底后处理）。

2. 源码
```java
@Service
public class UserService {
    private RoleService roleService;

    @Autowired                          // 可省，Spring 5+ 可自动识别
    public void setRoleService(RoleService roleService) {
        this.roleService = roleService;
    }
}
```

3. 口诀  
“**Setter 可选可重载，循环依赖它能抬；无参先 new 再灌入，后期重配不改牌。**”

--------------------------------
##### 字段注入（Field Injection）❌不推荐
1. 底层原理  
   - 反射**直接给私有字段赋值**，绕开构造/Setter；  
   - 代码最少，但**破坏封装**，无法做不可变约束；  
   - 单元测试必须**启动容器或用反射工具**，测试成本高；  
   - IDEA 2020+ 默认给出 **“Field injection is not recommended”** 警告。

2. 源码（反面教材）
```java
@Service
public class PayService {
    @Autowired
    private WalletService walletService;   // 私有字段直接灌
}
```

3. 口诀  
“**字段注入图省事，测试 Mock 难到死；封装破坏难不变，IDE 黄条天天见。**”

--------------------------------
四、注入方式对比一张表（面试秒答）

| 维度 | 构造器注入 | Setter 注入 | 字段注入 |
|---|---|---|---|
| 依赖是否可变 | 不可变（final） | 可重新 set | 可反射改 |
| 是否可选 | 必填 | 可选 | 可选 |
| 封装性 | 不破坏 | 不破坏 | 破坏 |
| 单元测试 | 最简单，直接 new | 一般 | 最麻烦，需反射或容器 |
| 循环依赖 | 只能 Spring 解决 | Spring 可后处理 | Spring 可后处理 |
| Spring 官方态度 | **推荐** | 可用 | **不推荐** |

--------------------------------
五、总结口诀（10 秒背会）

“**构造器强依赖不变，Setter 可选循环管；字段图快测试难，官方推荐构造板！**”

#### Bean生命周期
  - 实例化阶段
  - 属性填充阶段
  - 初始化阶段
  - 销毁阶段

--------------------------------
##### 实例化阶段（Instantiation）
1. 结论  
   容器通过**反射或 CGLIB 代理构造器**创建原始对象，此时**字段全部为默认值**，依赖也尚未注入。

2. 关键扩展点  
   - `BeanPostProcessor` 子接口 `InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation`  
   - 可提前返回一个代理对象，**短路 Spring 默认实例化**（AOP 基础）。

3. 源码速写
```java
// 默认实现
BeanUtils.instantiateClass(constructor, args);
```

1. 口诀  
“**先 new 再填值，字段全是零；提前代理能短路，AOP 在此生。**”

--------------------------------
##### 属性填充阶段（Population）
1. 结论  
   把**依赖 Bean、配置值、自动注入**全部塞进字段/Setter；**循环依赖**在此阶段由三级缓存解决。

2. 关键扩展点  
   - `InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation`  
   - `PropertyValues` 接口可**动态修改要注入的值**；  
   - `@Autowired`、`@Value`、`@Resource` 等**依赖注入**在此完成。

3. 源码速写
```java
populateBean(beanName, mbd, bw);   // AbstractAutowireCapableBeanFactory
```

4. 口诀  
“**依赖注入大杂烩，三级缓存救循环；后置处理能改值，动态属性任你编。**”

--------------------------------
##### 初始化阶段（Initialization）
1. 结论  
   在**依赖已注入完毕**的“完整对象”上，做**自定义开业仪式**：Aware 回调 → 初始化方法 → BeanPostProcessor 前后处理。

2. 执行链（顺序固定）

| 步骤 | 触发接口/注解 |
| :---- | :--- |
| ① Aware | `BeanNameAware`、`BeanFactoryAware`、`ApplicationContextAware`… |
| ② 初始化前 | `BeanPostProcessor.postProcessBeforeInitialization` |
| ③ 自定义初始化 | `@PostConstruct`、`InitializingBean.afterPropertiesSet()`、`<bean init-method>` |
| ④ 初始化后 | `BeanPostProcessor.postProcessAfterInitialization`（**AOP 代理在此完成**） |

3. 源码速写
```java
exposedObject = initializeBean(beanName, exposedObject, mbd);
```

4. 口诀  
“**Aware 先点名，前后处理夹中间；**  
**@PostConstruct 最先跑，代理外壳最后穿。**”

--------------------------------
##### 销毁阶段（Destruction）
1. 结论  
   当 `ApplicationContext#close()` / `registerShutdownHook()` 被调用时，Spring 会**优雅释放单例 Bean**。

2. 执行链

| 步骤 | 触发接口/注解 |
|---|---|
| ① 销毁前 | `DestructionAwareBeanPostProcessor.postProcessBeforeDestruction` |
| ② 自定义销毁 | `@PreDestroy`、`DisposableBean.destroy()`、`<bean destroy-method>` |
| ③ 销毁后 | `DestructionAwareBeanPostProcessor.postProcessAfterDestruction` |

3. 源码速写
```java
destroyBean(beanName, bean, mbd);
```

4. 口诀  
“**关闭容器先通知，@PreDestroy 最先行；**  
**销毁前后可拦截，资源释放要干净。**”

--------------------------------
全景图（脑内 10 秒回忆）

```
实例化 → 属性填充 → 初始化①②③④ → 就绪使用 → 关闭 → 销毁①②③
```

#### 作用域管理
  - singleton（单例）
  - prototype（原型）
  - request（请求）
  - session（会话）

--------------------------------
##### singleton（单例）—— **默认**
1. 结论  
   整个 IoC 容器里**只有一份实例**，线程共享，**Spring 负责创建、缓存、销毁**。

2. 原理  
   - 容器启动时**预实例化**所有单例 Bean，存入  
     `DefaultSingletonBeanRegistry#singletonObjects`（ConcurrentHashMap）。  
   - 后续 `getBean()` 直接拿缓存，**不再新建**。

3. 代码
```java
@Service        // 默认 singleton
public class UserService { }
```
或显式
```java
@Bean
@Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
public UserService userService() { return new UserService(); }
```

4. 口诀  
“**单例一份全家用，启动缓存到命终；线程共享要无态，并发安全自己控。**”

--------------------------------
##### prototype（原型）
1. 结论  
   每次 `getBean()` / 注入都**新建一个实例**，Spring **只创建不销毁**，GC 自行清理。

2. 原理  
   - 容器触发 `doGetBean` → 检测到 scope = prototype →  
     `createBean()` → 全新对象返回。  
   - **无缓存**，生命周期回调完即交给你。

3. 代码
```java
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
@Component
public class PrototypeBean { }
```
使用端：
```java
@Autowired
private ObjectProvider<PrototypeBean> provider;   // Spring 4.3+
public void demo() {
    PrototypeBean p1 = provider.getObject();      // 每次新对象
}
```

4. 口诀  
“**原型一次造一个，用完不管随 GC；创建开销要留意，有态资源适合它。**”

--------------------------------
##### request（请求）—— **Web 环境**
1. 结论  
   每个 HTTP 请求**独立实例**，线程安全，**请求结束即销毁**。

2. 原理  
   - 基于 `RequestScope` 实现，内部用  
     `ServletRequestAttributes#requestScopedBeans`（Map）缓存；  
   - DispatcherServlet 每进来一个请求 → 新建/缓存 → 请求完成 → 回调销毁。

3. 代码
```java
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class RequestBean { }
```
或 YAML
```yaml
spring:
  bean:
    request:
      proxy-target-class: true
```

4. 口诀  
“**一次请求一份娃，线程安全不用查；请求结束即销毁，内存干净无尾巴。**”

--------------------------------
##### session（会话）—— **Web 环境**
1. 结论  
   每个 HTTP Session **一份实例**，同一用户多次请求共享，**Session 失效时销毁**。

2. 原理  
   - 基于 `SessionScope`，数据放在  
     `ServletRequestAttributes#sessionScopedBeans`；  
   - 与 Servlet 生命周期同步，**分布式场景需配合 Session 复制/粘滞**。

3. 代码
```java
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class CartService { }
```
前端刷新多次，仍拿到同一对象；关闭浏览器 30 min 后 Session 过期 → 实例销毁。

4. 口诀  
“**会话一份跨请求，购物车用它顶；Session 失效跟着亡，分布式要额外扛。**”

--------------------------------
作用域对比速查（面试秒答）

| 作用域 | 实例数 | 生命周期 | 线程安全 | 典型场景 |
|---|---|---|---|---|
| singleton | 1 | 与容器同生共死 | 需自身保证 | 无态 Service、DAO |
| prototype | 每 getBean 新建 | 交 GC | 新实例天然安全 | 有态命令对象、价格计算 |
| request | 每 HTTP 请求 1 份 | 请求结束 | 安全 | 请求级缓存、表单 DTO |
| session | 每 Session 1 份 | Session 失效 | 安全 | 登录用户、购物车 |

--------------------------------
口诀（10 秒背会）

“**单例全局一份，原型每次新造；**  
**请求跟着线程走，会话用户同怀抱。**”





## SpringBoot 打包
### SpringBoot打包概述
打包的重要性
- 部署便利：一键部署到任何环境
- 依赖管理：包含所有必需依赖
- 环境一致：避免环境差异问题
- 运维友好：简化运维部署流程

SpringBoot打包优势
```text
传统应用部署：应用 + 应用服务器 + 配置
     ↓
SpringBoot部署：Fat JAR（应用 + 内嵌服务器 + 配置）
     ↓
一个文件搞定所有部署需求
```              
> 💡 核心理念: SpringBoot的"约定优于配置"理念在打包部署中体现得淋漓尽致

### 打包方式对比
SpringBoot支持多种打包方式，适应不同的部署场景

- Fat JAR 打包
  - 特点：包含所有依赖的可执行JAR
  - 适用场景：微服务、云原生应用
  - 启动方式：`java -jar app.jar`
```yaml
# Maven打包命令
mvn clean package

# 生成的文件
target/myapp-1.0.0.jar
```                    
- WAR 打包
  - 特点：传统Web应用打包格式
  - 适用场景：外部Tomcat部署
  - 部署方式：部署到应用服务器
```xml
# pom.xml配置
<packaging>war</packaging>

# 生成的文件
target/myapp-1.0.0.war
```              
- Docker 容器化
  - 特点：容器化部署，环境隔离
  - 适用场景：云原生、微服务架构
  - 部署方式：Docker容器运行
```yaml
# Dockerfile
FROM openjdk:11-jre-slim
COPY target/app.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```                   
- 原生镜像
  - 特点：编译为原生可执行文件
  - 适用场景：高性能、快速启动
  - 技术：GraalVM Native Image
```yaml
# 原生镜像构建
mvn -Pnative native:compile

# 生成原生可执行文件
target/myapp
```  

### Fat JAR 详解
#### Fat JAR 结构
```text
myapp-1.0.0.jar
├── BOOT-INF/
│   ├── classes/                    # 应用程序类
│   │   └── com/example/MyApp.class
│   ├── lib/                        # 依赖JAR包
│   │   ├── spring-boot-2.7.0.jar
│   │   ├── spring-core-5.3.21.jar
│   │   └── ...
│   └── classpath.idx               # 类路径索引
├── META-INF/
│   ├── MANIFEST.MF                 # 清单文件
│   └── maven/
└── org/
    └── springframework/
        └── boot/
            └── loader/             # SpringBoot加载器
                ├── JarLauncher.class
                └── ...
```               
#### Maven配置
```xml
<!-- pom.xml -->
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <mainClass>com.example.MyApplication</mainClass>
                <layout>JAR</layout>
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```                
#### 打包和运行命令
```shell
$ mvn clean package
[INFO] Building jar: target/myapp-1.0.0.jar

$ java -jar target/myapp-1.0.0.jar
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)

$ java -jar -Dspring.profiles.active=prod target/myapp-1.0.0.jar
# 指定环境启动
``` 

### WAR 包部署
#### 配置WAR打包
```xml
<!-- pom.xml -->
<packaging>war</packaging>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-tomcat</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```                
#### 启动类配置
```java
@SpringBootApplication
public class MyApplication extends SpringBootServletInitializer {
    
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
    
    @Override
    protected SpringApplicationBuilder configure(
        SpringApplicationBuilder application
    ) {
        return application.sources(MyApplication.class);
    }
}
```               
#### 部署到Tomcat
```shell
# 1. 打包WAR文件
$ mvn clean package

# 2. 复制到Tomcat webapps目录
$ cp target/myapp-1.0.0.war $TOMCAT_HOME/webapps/

# 3. 启动Tomcat
$ $TOMCAT_HOME/bin/startup.sh

# 4. 访问应用
$ curl http://localhost:8080/myapp-1.0.0/
```                
### Docker 容器化
#### 基础Dockerfile：
```dockerfile
# Dockerfile
FROM openjdk:11-jre-slim

# 设置工作目录
WORKDIR /app

# 复制JAR文件
COPY target/myapp-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```              
#### 多阶段构建
```dockerfile
# 多阶段Dockerfile
# 构建阶段
FROM maven:3.8.4-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 运行阶段
FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=builder /app/target/myapp-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```               
#### Docker命令
```shell
# 构建镜像
$ docker build -t myapp:1.0.0 .

# 运行容器
$ docker run -d -p 8080:8080 --name myapp myapp:1.0.0

# 查看日志
$ docker logs -f myapp

# 进入容器
$ docker exec -it myapp /bin/bash
```              
### 部署选项
- 独立部署
  - 直接在服务器上运行JAR文件
  - 适合小型应用和开发环境
- 容器部署
  - 使用Docker容器运行应用
  - 环境隔离，易于扩展
- 云平台部署
  - 部署到AWS、Azure、阿里云
  - 弹性伸缩，高可用性
- Kubernetes
  - 容器编排平台部署
  - 自动化运维，服务发现

### 高级打包配置
#### 自定义打包配置
```xml
<!-- Maven插件高级配置 -->
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <classifier>exec</classifier>
        <mainClass>com.example.MyApplication</mainClass>
        <layout>JAR</layout>
        <includes>
            <include>
                <groupId>com.example</groupId>
                <artifactId>my-library</artifactId>
            </include>
        </includes>
        <excludes>
            <exclude>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
            </exclude>
        </excludes>
    </configuration>
</plugin>
```                
#### 分层JAR
```xml
# 启用分层JAR
<configuration>
    <layers>
        <enabled>true</enabled>
    </layers>
</configuration>
```
```shell
# 查看层信息
java -Djarmode=layertools -jar myapp.jar list

# 提取层
java -Djarmode=layertools -jar myapp.jar extract
```               
#### 优化的Dockerfile（分层）
```dockerfile
FROM openjdk:11-jre-slim as builder
WORKDIR application
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} application.jar
RUN java -Djarmode=layertools -jar application.jar extract

FROM openjdk:11-jre-slim
WORKDIR application
COPY --from=builder application/dependencies/ ./
COPY --from=builder application/spring-boot-loader/ ./
COPY --from=builder application/snapshot-dependencies/ ./
COPY --from=builder application/application/ ./
ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]
```               

### 性能优化
#### JVM参数优化
```shell
# 内存优化
java -Xmx1g -Xms512m \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -jar myapp.jar

# 启动优化
java -XX:+TieredCompilation \
     -XX:TieredStopAtLevel=1 \
     -noverify \
     -jar myapp.jar

# 生产环境参数
java -server \
     -Xmx2g -Xms2g \
     -XX:+UseG1GC \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/logs/heapdump.hprof \
     -Dspring.profiles.active=prod \
     -jar myapp.jar
```               
#### 应用优化
- 移除不必要的依赖
- 使用Spring Boot的懒加载
- 优化自动配置
- 使用Profile分离配置
> ⚠️ 注意事项: 生产环境部署时要注意安全配置，如禁用开发工具、设置合适的日志级别等

### 原生镜像构建
#### GraalVM配置
```xml
<!-- pom.xml -->
<profiles>
    <profile>
        <id>native</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.graalvm.buildtools</groupId>
                    <artifactId>native-maven-plugin</artifactId>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```                
#### 构建原生镜像
```shell
# 安装GraalVM
$ sdk install java 22.3.r11-grl
$ sdk use java 22.3.r11-grl

# 安装native-image
$ gu install native-image

# 构建原生镜像
$ mvn -Pnative native:compile

# 运行原生可执行文件
$ ./target/myapp
```                
#### 原生镜像优势
- 极快的启动时间（毫秒级）
- 更低的内存占用
- 更小的镜像体积
- 无需JVM运行时

### 打包方式对比
#### 性能对比

打包方式    | 启动时间 | 内存占用 | 文件大小 | 部署复杂度
----------|---------|---------|---------|----------
Fat JAR   | 3-5秒   | 200MB   | 50MB    | 简单
WAR       | 5-10秒  | 300MB   | 45MB    | 中等
Docker    | 3-5秒   | 250MB   | 200MB   | 中等
Native    | 0.1秒   | 50MB    | 80MB    | 复杂
                
#### 选择建议
- Fat JAR：微服务、云原生应用首选
- WAR：传统企业环境，已有Tomcat
- Docker：容器化部署，DevOps环境
- Native：对启动时间要求极高的场景

> 最佳实践: 根据实际部署环境和性能要求选择合适的打包方式，Fat JAR是最通用的选择

## SpringBoot AutoConfig
### 自动配置核心概念
- @EnableAutoConfiguration - 启用自动配置
- @AutoConfiguration - 自动配置类
- @Conditional - 条件装配
- spring.factories - 配置文件
- @ConfigurationProperties - 属性绑定
- AutoConfigurationImportSelector - 导入选择器
### 自动配置依赖配置
```xml
<!-- pom.xml 自动配置依赖 -->
<dependencies>
    <!-- SpringBoot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    
    <!-- 自动配置处理器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-autoconfigure</artifactId>
    </dependency>
    
    <!-- 配置处理器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-configuration-processor</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- 条件注解支持 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-conditional</artifactId>
    </dependency>
</dependencies>
```
```yaml
# application.yml 自动配置相关配置
spring:
  # 应用基本信息
  application:
    name: autoconfig-demo
    
  # 自动配置调试
  main:
    # 显示自动配置报告
    show-banner: true
    # 允许Bean定义覆盖
    allow-bean-definition-overriding: true
    
# 自定义配置属性
custom:
  service:
    # 是否启用自定义服务
    enabled: true
    # 服务名称
    name: "Custom Service"
    # 超时时间
    timeout: 30000
    # 重试次数
    retry-count: 3
    # 配置列表
    endpoints:
      - name: "endpoint1"
        url: "http://localhost:8081"
      - name: "endpoint2"
        url: "http://localhost:8082"

# 日志配置
logging:
  level:
    # 显示自动配置日志
    org.springframework.boot.autoconfigure: DEBUG
    # 显示条件评估日志
    org.springframework.boot.autoconfigure.condition: TRACE
    cn.bugstack.springframework.boot.autoconfig: DEBUG
```           
### 自动配置流程
1. 启动扫描
@EnableAutoConfiguration触发自动配置扫描
2. 加载配置类
从spring.factories文件加载自动配置类
3. 条件评估
根据@Conditional注解评估是否满足条件
4. Bean注册
满足条件的配置类注册Bean到容器
5. 属性绑定
@ConfigurationProperties绑定配置属性
6. 完成装配
所有自动配置完成，应用启动

### 自动配置实现
```java
// CustomServiceProperties.java - 配置属性类
@ConfigurationProperties(prefix = "custom.service")
@Data
public class CustomServiceProperties {
    
    /**
     * 是否启用自定义服务
     */
    private boolean enabled = true;
    
    /**
     * 服务名称
     */
    private String name = "Default Service";
    
    /**
     * 超时时间（毫秒）
     */
    private long timeout = 30000;
    
    /**
     * 重试次数
     */
    private int retryCount = 3;
    
    /**
     * 端点配置列表
     */
    private List<Endpoint> endpoints = new ArrayList<>();
    
    @Data
    public static class Endpoint {
        private String name;
        private String url;
    }
}

// CustomService.java - 自定义服务
@Slf4j
public class CustomService {
    
    private final CustomServiceProperties properties;
    
    public CustomService(CustomServiceProperties properties) {
        this.properties = properties;
        log.info("CustomService initialized with name: {}", properties.getName());
    }
    
    /**
     * 执行服务调用
     */
    public String execute(String request) {
        log.info("Executing request: {} with timeout: {}ms", 
            request, properties.getTimeout());
        
        // 模拟服务调用
        try {
            Thread.sleep(100); // 模拟处理时间
            return "Response for: " + request;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Service execution interrupted", e);
        }
    }
    
    /**
     * 获取服务信息
     */
    public Map<String, Object> getServiceInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", properties.getName());
        info.put("timeout", properties.getTimeout());
        info.put("retryCount", properties.getRetryCount());
        info.put("endpointCount", properties.getEndpoints().size());
        return info;
    }
    
    /**
     * 健康检查
     */
    public boolean isHealthy() {
        // 实际应用中可以检查服务状态
        return properties.isEnabled();
    }
}

// CustomServiceAutoConfiguration.java - 自动配置类
@AutoConfiguration
@ConditionalOnClass(CustomService.class)
@ConditionalOnProperty(prefix = "custom.service", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(CustomServiceProperties.class)
@Slf4j
public class CustomServiceAutoConfiguration {
    
    /**
     * 自定义服务Bean
     */
    @Bean
    @ConditionalOnMissingBean
    public CustomService customService(CustomServiceProperties properties) {
        log.info("Auto-configuring CustomService with properties: {}", properties);
        return new CustomService(properties);
    }
    
    /**
     * 自定义服务管理器
     */
    @Bean
    @ConditionalOnBean(CustomService.class)
    @ConditionalOnProperty(prefix = "custom.service", name = "manager.enabled", havingValue = "true")
    public CustomServiceManager customServiceManager(CustomService customService) {
        log.info("Auto-configuring CustomServiceManager");
        return new CustomServiceManager(customService);
    }
    
    /**
     * 自定义健康检查指示器
     */
    @Bean
    @ConditionalOnClass(name = "org.springframework.boot.actuator.health.HealthIndicator")
    @ConditionalOnBean(CustomService.class)
    public CustomServiceHealthIndicator customServiceHealthIndicator(CustomService customService) {
        log.info("Auto-configuring CustomServiceHealthIndicator");
        return new CustomServiceHealthIndicator(customService);
    }
}

// CustomServiceManager.java - 服务管理器
@Component
@Slf4j
public class CustomServiceManager {
    
    private final CustomService customService;
    private final AtomicLong requestCount = new AtomicLong(0);
    private final AtomicLong successCount = new AtomicLong(0);
    private final AtomicLong errorCount = new AtomicLong(0);
    
    public CustomServiceManager(CustomService customService) {
        this.customService = customService;
    }
    
    /**
     * 执行带统计的服务调用
     */
    public String executeWithStats(String request) {
        requestCount.incrementAndGet();
        
        try {
            String result = customService.execute(request);
            successCount.incrementAndGet();
            return result;
        } catch (Exception e) {
            errorCount.incrementAndGet();
            log.error("Service execution failed for request: {}", request, e);
            throw e;
        }
    }
    
    /**
     * 获取统计信息
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("requestCount", requestCount.get());
        stats.put("successCount", successCount.get());
        stats.put("errorCount", errorCount.get());
        stats.put("successRate", calculateSuccessRate());
        return stats;
    }
    
    private double calculateSuccessRate() {
        long total = requestCount.get();
        if (total == 0) {
            return 0.0;
        }
        return (double) successCount.get() / total * 100;
    }
}

// CustomServiceHealthIndicator.java - 健康检查指示器
public class CustomServiceHealthIndicator implements HealthIndicator {
    
    private final CustomService customService;
    
    public CustomServiceHealthIndicator(CustomService customService) {
        this.customService = customService;
    }
    
    @Override
    public Health health() {
        try {
            if (customService.isHealthy()) {
                Map<String, Object> serviceInfo = customService.getServiceInfo();
                return Health.up()
                        .withDetails(serviceInfo)
                        .build();
            } else {
                return Health.down()
                        .withDetail("reason", "Service is disabled")
                        .build();
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```
### 自动配置架构图示
Starter启动器 → Condition条件评估 → Bean注册 → Property属性绑定

> 自动配置流程：Starter触发 → 条件评估 → Bean注册 → 属性绑定

> 每个环节都有相应的注解和机制支持

### 条件注解
- @ConditionalOnClass - 类存在时生效
- @ConditionalOnMissingClass - 类不存在时生效
- @ConditionalOnBean - Bean存在时生效
- @ConditionalOnMissingBean - Bean不存在时生效
- @ConditionalOnProperty - 属性匹配时生效
- @ConditionalOnResource - 资源存在时生效
### 配置文件
- spring.factories - 自动配置类声明
- spring-configuration-metadata.json - 配置元数据
- additional-spring-configuration-metadata.json - 额外元数据
- application.yml - 应用配置
- bootstrap.yml - 引导配置
- META-INF/spring.factories - 工厂配置

### 自定义Starter开发
#### 1. 创建spring.factories文件
```shell
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
cn.bugstack.springframework.boot.autoconfig.CustomServiceAutoConfiguration
```
#### 2. 创建配置元数据文件
```json
# META-INF/spring-configuration-metadata.json
{
  "groups": [
    {
      "name": "custom.service",
      "type": "cn.bugstack.springframework.boot.autoconfig.CustomServiceProperties",
      "sourceType": "cn.bugstack.springframework.boot.autoconfig.CustomServiceProperties"
    }
  ],
  "properties": [
    {
      "name": "custom.service.enabled",
      "type": "java.lang.Boolean",
      "description": "Whether to enable the custom service.",
      "defaultValue": true
    },
    {
      "name": "custom.service.name",
      "type": "java.lang.String",
      "description": "The name of the custom service.",
      "defaultValue": "Default Service"
    },
    {
      "name": "custom.service.timeout",
      "type": "java.lang.Long",
      "description": "The timeout for service calls in milliseconds.",
      "defaultValue": 30000
    },
    {
      "name": "custom.service.retry-count",
      "type": "java.lang.Integer",
      "description": "The number of retry attempts.",
      "defaultValue": 3
    }
  ]
}
```
#### 3. 创建自定义条件注解
```java
// 3. 创建自定义条件注解
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnCustomServiceCondition.class)
public @interface ConditionalOnCustomService {
    
    /**
     * 服务名称
     */
    String name() default "";
    
    /**
     * 是否必须启用
     */
    boolean enabled() default true;
}

// OnCustomServiceCondition.java - 自定义条件实现
public class OnCustomServiceCondition implements Condition {
    
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        Environment environment = context.getEnvironment();
        
        // 获取注解属性
        Map<String, Object> attributes = metadata.getAnnotationAttributes(
                ConditionalOnCustomService.class.getName());
        
        if (attributes == null) {
            return false;
        }
        
        String name = (String) attributes.get("name");
        boolean enabled = (Boolean) attributes.get("enabled");
        
        // 检查服务是否启用
        boolean serviceEnabled = environment.getProperty(
                "custom.service.enabled", Boolean.class, true);
        
        if (!serviceEnabled && enabled) {
            return false;
        }
        
        // 检查特定服务名称
        if (StringUtils.hasText(name)) {
            String serviceName = environment.getProperty("custom.service.name");
            return name.equals(serviceName);
        }
        
        return true;
    }
}
```
#### 4. 使用自定义条件
```java
@Configuration
@ConditionalOnCustomService(name = "special-service", enabled = true)
public class SpecialServiceConfiguration {
    
    @Bean
    public SpecialService specialService() {
        return new SpecialService();
    }
}
```
#### 5. 创建Starter模块的pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>cn.bugstack.springframework.boot</groupId>
    <artifactId>custom-service-spring-boot-starter</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>Custom Service Spring Boot Starter</name>
    <description>Spring Boot Starter for Custom Service</description>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```
#### 6. 使用自定义Starter
```xml
<!-- 在其他项目的pom.xml中引入 -->
<dependency>
    <groupId>cn.bugstack.springframework.boot</groupId>
    <artifactId>custom-service-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```
#### 7. 配置自定义服务
```yaml
# 在application.yml中配置
custom:
  service:
    enabled: true
    name: "My Custom Service"
    timeout: 5000
    retry-count: 5
```           

### 条件注解对比
| 条件注解	| 作用	| 使用场景	| 示例 |
| --- | --- | --- | --- |
| @ConditionalOnClass	| 类存在时生效	| 依赖特定类库	| @ConditionalOnClass(DataSource.class) |
| @ConditionalOnMissingClass	| 类不存在时生效	| 提供默认实现	| @ConditionalOnMissingClass("com.example.Service") |
| @ConditionalOnBean	| Bean存在时生效	| 依赖其他Bean	| @ConditionalOnBean(DataSource.class) |
| @ConditionalOnMissingBean	| Bean不存在时生效	| 提供默认Bean	| @ConditionalOnMissingBean(name = "dataSource") |
| @ConditionalOnProperty	| 属性匹配时生效	| 基于配置启用	| @ConditionalOnProperty("app.feature.enabled") |
| @ConditionalOnResource	| 资源存在时生效	| 依赖配置文件	| @ConditionalOnResource("classpath:config.xml") |

### 自动配置调试和排查
```java
// AutoConfigurationController.java - 自动配置调试控制器
@RestController
@RequestMapping("/autoconfig")
@Slf4j
public class AutoConfigurationController {
    
    @Autowired
    private ApplicationContext applicationContext;
    
    @Autowired
    private Environment environment;
    
    /**
     * 获取自动配置报告
     */
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getAutoConfigurationReport() {
        Map<String, Object> report = new HashMap<>();
        
        // 获取所有Bean名称
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        report.put("totalBeans", beanNames.length);
        report.put("beanNames", Arrays.asList(beanNames));
        
        // 获取自动配置相关的Bean
        List<String> autoConfigBeans = Arrays.stream(beanNames)
                .filter(name -> name.contains("AutoConfiguration"))
                .collect(Collectors.toList());
        report.put("autoConfigBeans", autoConfigBeans);
        
        return ResponseEntity.ok(report);
    }
    
    /**
     * 获取条件评估报告
     */
    @GetMapping("/conditions")
    public ResponseEntity<Map<String, Object>> getConditionEvaluationReport() {
        Map<String, Object> report = new HashMap<>();
        
        // 这里可以通过ConditionEvaluationReport获取详细信息
        // 实际实现需要访问SpringBoot内部API
        
        report.put("message", "Condition evaluation report");
        report.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(report);
    }
    
    /**
     * 获取配置属性
     */
    @GetMapping("/properties")
    public ResponseEntity<Map<String, Object>> getConfigurationProperties() {
        Map<String, Object> properties = new HashMap<>();
        
        // 获取自定义配置属性
        properties.put("custom.service.enabled", 
            environment.getProperty("custom.service.enabled"));
        properties.put("custom.service.name", 
            environment.getProperty("custom.service.name"));
        properties.put("custom.service.timeout", 
            environment.getProperty("custom.service.timeout"));
        
        // 获取所有以custom开头的属性
        Map<String, Object> customProperties = new HashMap<>();
        if (environment instanceof ConfigurableEnvironment) {
            ConfigurableEnvironment configurableEnv = (ConfigurableEnvironment) environment;
            for (PropertySource<?> propertySource : configurableEnv.getPropertySources()) {
                if (propertySource instanceof EnumerablePropertySource) {
                    EnumerablePropertySource<?> enumerablePropertySource = 
                            (EnumerablePropertySource<?>) propertySource;
                    for (String propertyName : enumerablePropertySource.getPropertyNames()) {
                        if (propertyName.startsWith("custom.")) {
                            customProperties.put(propertyName, 
                                environment.getProperty(propertyName));
                        }
                    }
                }
            }
        }
        properties.put("customProperties", customProperties);
        
        return ResponseEntity.ok(properties);
    }
    
    /**
     * 测试自定义服务
     */
    @GetMapping("/test-service")
    public ResponseEntity<Map<String, Object>> testCustomService() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 检查CustomService是否存在
            if (applicationContext.containsBean("customService")) {
                CustomService customService = applicationContext.getBean(CustomService.class);
                
                // 测试服务调用
                String response = customService.execute("test-request");
                Map<String, Object> serviceInfo = customService.getServiceInfo();
                
                result.put("serviceExists", true);
                result.put("response", response);
                result.put("serviceInfo", serviceInfo);
                result.put("healthy", customService.isHealthy());
            } else {
                result.put("serviceExists", false);
                result.put("message", "CustomService bean not found");
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
            log.error("Error testing custom service", e);
        }
        
        return ResponseEntity.ok(result);
    }
}
```
#### 启用自动配置调试
```yaml
# application.yml
debug: true
```
```shell
# 或者通过启动参数
# java -jar app.jar --debug
```
#### 查看自动配置报告的方法：
```shell
# 1. 启动时添加 --debug 参数
# 2. 查看控制台输出的CONDITIONS EVALUATION REPORT
# 3. 访问 /autoconfig/report 端点
# 4. 使用Spring Boot Actuator的 /actuator/conditions 端点
```
#### 常用调试命令
```shell
# 查看所有Bean
curl http://localhost:8080/autoconfig/report

# 查看配置属性
curl http://localhost:8080/autoconfig/properties

# 测试自定义服务
curl http://localhost:8080/autoconfig/test-service

# 查看条件评估（需要Actuator）
curl http://localhost:8080/actuator/conditions
```         
### 自动配置最佳实践

- 合理使用条件注解 - 确保自动配置在正确的条件下生效

- 提供配置属性 - 使用@ConfigurationProperties提供可配置选项

- 编写配置元数据 - 提供IDE智能提示和文档

- 测试自动配置 - 编写单元测试验证配置逻辑

- 文档和示例 - 提供清晰的使用文档和示例

### 自动配置开发检查清单

#### 1. 配置类设计
- [ ] 使用@AutoConfiguration注解
- [ ] 添加适当的条件注解
- [ ] 提供@ConfigurationProperties类
- [ ] 实现配置的默认值

#### 2. 条件设计
- [ ] @ConditionalOnClass检查必要的类
- [ ] @ConditionalOnMissingBean避免重复配置
- [ ] @ConditionalOnProperty提供开关控制
- [ ] 自定义条件注解（如需要）

#### 3. 配置文件
- [ ] 创建spring.factories文件
- [ ] 编写配置元数据JSON
- [ ] 提供默认配置示例
- [ ] 文档化所有配置选项

#### 4. 测试验证
- [ ] 单元测试自动配置逻辑
- [ ] 集成测试完整流程
- [ ] 测试不同条件下的行为
- [ ] 验证配置属性绑定

#### 5. 文档和发布
- [ ] 编写README文档
- [ ] 提供使用示例
- [ ] 版本兼容性说明
- [ ] 发布到Maven仓库
```shell
# 示例项目结构
custom-service-spring-boot-starter/
├── src/main/java/
│   └── cn/bugstack/springframework/boot/autoconfig/
│       ├── CustomService.java
│       ├── CustomServiceProperties.java
│       ├── CustomServiceAutoConfiguration.java
│       └── condition/
│           └── OnCustomServiceCondition.java
├── src/main/resources/
│   └── META-INF/
│       ├── spring.factories
│       └── spring-configuration-metadata.json
├── src/test/java/
│   └── cn/bugstack/springframework/boot/autoconfig/
│       └── CustomServiceAutoConfigurationTest.java
├── README.md
└── pom.xml
```

## SpringBoot Tomcat部署
### 部署方式
- JAR包部署 - 内嵌Tomcat，独立运行
- WAR包部署 - 外部Tomcat容器
- Docker部署 - 容器化部署
- 云平台部署 - 云服务器部署
- 集群部署 - 负载均衡部署
- 蓝绿部署 - 零停机部署
### JAR包部署配置
```xml
<!-- pom.xml JAR包配置 -->
<project>
    <groupId>cn.bugstack.springframework.boot</groupId>
    <artifactId>chapter-12-tomcat</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>
    
    <dependencies>
        <!-- SpringBoot Web启动器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- SpringBoot Actuator监控 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <!-- SpringBoot Maven插件 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <executable>true</executable>
                    <includeSystemScope>true</includeSystemScope>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```
```yaml
# application.yml JAR包配置
server:
  port: 8080
  servlet:
    context-path: /api
  tomcat:
    # 连接器配置
    max-connections: 8192
    accept-count: 100
    max-threads: 200
    min-spare-threads: 10
    # 连接超时
    connection-timeout: 20000
    # 压缩配置
    compression:
      enabled: true
      mime-types: text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json
      min-response-size: 1024
```
```shell
# 启动脚本 start.sh
#!/bin/bash
APP_NAME="chapter-12-tomcat"
JAR_NAME="$APP_NAME-1.0-SNAPSHOT.jar"
PID_FILE="$APP_NAME.pid"

# JVM参数配置
JVM_OPTS="-Xms512m -Xmx1024m"
JVM_OPTS="$JVM_OPTS -XX:+UseG1GC"
JVM_OPTS="$JVM_OPTS -XX:MaxGCPauseMillis=200"
JVM_OPTS="$JVM_OPTS -XX:+PrintGCDetails"
JVM_OPTS="$JVM_OPTS -Xloggc:gc.log"

# 启动应用
nohup java $JVM_OPTS -jar $JAR_NAME > app.log 2>&1 &
echo $! > $PID_FILE
echo "应用启动成功，PID: $(cat $PID_FILE)"
```           
#### 部署流程
1. 代码构建
使用Maven或Gradle构建JAR/WAR包
2. 环境准备
配置服务器环境，安装JDK和Tomcat
3. 应用部署
上传应用包，配置启动脚本
4. 服务启动
启动应用服务，验证运行状态
5. 监控验证
检查应用健康状态，配置监控告警

### WAR包部署配置
```xml
<!-- pom.xml WAR包配置 -->
<project>
    <packaging>war</packaging>
    
    <dependencies>
        <!-- SpringBoot Web启动器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- 排除内嵌Tomcat -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```
```java
// SpringBootServletInitializer.java
@SpringBootApplication
public class TomcatApplication extends SpringBootServletInitializer {
    
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(TomcatApplication.class);
    }
    
    public static void main(String[] args) {
        SpringApplication.run(TomcatApplication.class, args);
    }
}
```
```xml
<!-- Tomcat server.xml 配置 -->
<Server port="8005" shutdown="SHUTDOWN">
    <Service name="Catalina">
        <!-- HTTP连接器 -->
        <Connector port="8080" 
                   protocol="HTTP/1.1"
                   connectionTimeout="20000"
                   maxThreads="200"
                   minSpareThreads="10"
                   maxConnections="8192"
                   acceptCount="100"
                   compression="on"
                   compressionMinSize="1024"
                   compressableMimeType="text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json"
                   redirectPort="8443" />
        
        <!-- HTTPS连接器 -->
        <Connector port="8443" 
                   protocol="org.apache.coyote.http11.Http11NioProtocol"
                   maxThreads="150" 
                   SSLEnabled="true"
                   scheme="https" 
                   secure="true"
                   clientAuth="false" 
                   sslProtocol="TLS"
                   keystoreFile="conf/keystore.jks"
                   keystorePass="password" />
        
        <Engine name="Catalina" defaultHost="localhost">
            <Host name="localhost" 
                  appBase="webapps"
                  unpackWARs="true" 
                  autoDeploy="true">
                
                <!-- 应用上下文配置 -->
                <Context path="/api" 
                         docBase="chapter-12-tomcat.war"
                         reloadable="false">
                    <!-- 数据源配置 -->
                    <Resource name="jdbc/dataSource"
                              auth="Container"
                              type="javax.sql.DataSource"
                              maxTotal="20"
                              maxIdle="10"
                              maxWaitMillis="10000"
                              username="root"
                              password="password"
                              driverClassName="com.mysql.cj.jdbc.Driver"
                              url="jdbc:mysql://localhost:3306/springboot" />
                </Context>
            </Host>
        </Engine>
    </Service>
</Server>
```
```shell
# Tomcat启动脚本 catalina.sh
export JAVA_OPTS="-Xms1024m -Xmx2048m"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=200"
export JAVA_OPTS="$JAVA_OPTS -Dspring.profiles.active=prod"
export JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8"
export JAVA_OPTS="$JAVA_OPTS -Djava.security.egd=file:/dev/./urandom"
```          
#### Tomcat优化
- 连接器优化 - 线程池与连接数
- 内存优化 - JVM堆内存配置
- GC优化 - 垃圾回收器选择
- 压缩配置 - HTTP响应压缩
- 缓存策略 - 静态资源缓存
- 安全配置 - 安全头与过滤器
#### 监控运维
- 健康检查 - Actuator端点监控
- 性能监控 - JVM与应用指标
- 日志管理 - 日志收集与分析
- 告警配置 - 异常状态告警
- 备份策略 - 数据与配置备份
- 故障恢复 - 快速故障恢复
#### 性能优化配置
```yaml
# application-prod.yml 生产环境配置
server:
  tomcat:
    # 线程配置
    max-threads: 200
    min-spare-threads: 20
    max-connections: 8192
    accept-count: 100
    
    # 连接超时配置
    connection-timeout: 20000
    keep-alive-timeout: 60000
    max-keep-alive-requests: 100
    
    # 压缩配置
    compression:
      enabled: true
      mime-types: text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json,application/xml
      min-response-size: 1024
    
    # 访问日志配置
    accesslog:
      enabled: true
      directory: logs
      file-date-format: .yyyy-MM-dd
      pattern: '%t %a "%r" %s (%D ms)'
      
  # HTTP/2支持
  http2:
    enabled: true

# JVM优化参数
# -Xms2g -Xmx4g
# -XX:+UseG1GC
# -XX:MaxGCPauseMillis=200
# -XX:+UseStringDeduplication
# -XX:+PrintGCDetails
# -XX:+PrintGCTimeStamps
# -Xloggc:gc.log

# 连接池配置
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000

# 缓存配置
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=5m

# 监控配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```
```java
// TomcatCustomizer.java - Tomcat自定义配置
@Component
public class TomcatCustomizer implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {
    
    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        // 自定义连接器
        factory.addConnectorCustomizers(connector -> {
            Http11NioProtocol protocol = (Http11NioProtocol) connector.getProtocolHandler();
            
            // 设置最大线程数
            protocol.setMaxThreads(200);
            protocol.setMinSpareThreads(20);
            
            // 设置连接超时
            protocol.setConnectionTimeout(20000);
            protocol.setKeepAliveTimeout(60000);
            
            // 启用压缩
            protocol.setCompression("on");
            protocol.setCompressionMinSize(1024);
            
            // 设置最大连接数
            protocol.setMaxConnections(8192);
            protocol.setAcceptCount(100);
        });
        
        // 添加错误页面
        factory.addErrorPages(
            new ErrorPage(HttpStatus.NOT_FOUND, "/error/404"),
            new ErrorPage(HttpStatus.INTERNAL_SERVER_ERROR, "/error/500")
        );
        
        // 设置会话超时
        factory.addInitializers(servletContext -> {
            servletContext.getSessionCookieConfig().setMaxAge(30 * 60); // 30分钟
        });
    }
}

// PerformanceFilter.java - 性能监控过滤器
@Component
@Order(1)
public class PerformanceFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceFilter.class);
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        long startTime = System.currentTimeMillis();
        
        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            // 记录慢请求
            if (duration > 1000) {
                logger.warn("慢请求: {} {} 耗时: {}ms", 
                    httpRequest.getMethod(), 
                    httpRequest.getRequestURI(), 
                    duration);
            }
            
            // 记录性能指标
            Metrics.timer("http.request.duration", 
                "method", httpRequest.getMethod(),
                "uri", httpRequest.getRequestURI())
                .record(duration, TimeUnit.MILLISECONDS);
        }
    }
}
```          
### 部署方式对比
|部署方式	|优点	|缺点	|适用场景
| -- | -- | -- | --
|JAR包部署	|简单快速、内嵌容器、独立运行	|资源占用较高、升级需重启	|微服务、云原生应用
|WAR包部署	|资源共享、统一管理、热部署	|配置复杂、容器依赖	|传统企业应用
|Docker部署	|环境一致、易扩展、版本管理	|学习成本、资源开销	|容器化环境
|云平台部署	|弹性伸缩、高可用、托管服务	|成本较高、厂商绑定	|大规模应用
### 故障排查
#### 常见问题与解决方案
- 启动失败 - 检查端口占用、配置文件、依赖冲突

- 内存溢出 - 调整JVM参数、优化代码、增加内存

- 响应缓慢 - 分析线程池、数据库连接、网络延迟

- 连接超时 - 检查网络配置、防火墙、负载均衡

- 日志异常 - 查看错误日志、堆栈信息、系统资源


####  故障排查命令
```bash
# 1. 检查应用进程
ps aux | grep java

# 2. 检查端口占用
netstat -tlnp | grep 8080
lsof -i :8080

# 3. 查看JVM信息
jps -l
jinfo <pid>
jstat -gc <pid> 1s

# 4. 生成堆转储
jmap -dump:format=b,file=heapdump.hprof <pid>

# 5. 查看线程信息
jstack <pid>

# 6. 监控系统资源
top -p <pid>
iostat 1
free -h

# 7. 查看应用日志
tail -f application.log
grep ERROR application.log
grep -A 10 -B 10 "OutOfMemoryError" application.log

# 8. 网络诊断
ping <host>
telnet <host> <port>
curl -I http://localhost:8080/actuator/health
```
            
