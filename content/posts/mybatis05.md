---
title: "MyBatis-分布式与微服务"
date: 2021-02-23T15:40:39+08:00
draft: false
description: "MyBatis-分布式与微服务：分布式应用、微服务架构、Mapper接口进阶、Spring集成进阶。"
tags: ["MyBatis","数据库"]
categories: ["Framework"]
---

## 分布式应用
### 学习目标
- 读写分离：掌握MyBatis读写分离的实现原理和配置方法
- 分库分表：学习使用ShardingSphere实现数据分片
- 分布式事务：了解分布式事务的处理方案和Seata集成
- 数据源管理：掌握多数据源的配置和动态切换
- 性能优化：学习分布式环境下的性能优化策略
### 1. 分布式应用概述
#### 1.1 分布式数据库架构
- 读写分离
将读操作和写操作分离到不同的数据库实例，提高系统并发能力和可用性。

- 分库分表
将数据分散到多个数据库和表中，解决单表数据量过大的问题。

- 分布式事务
保证跨多个数据源的事务一致性，确保数据的完整性。

- 负载均衡
在多个数据库实例之间分配负载，提高系统整体性能。

#### 1.2 技术选型对比

|技术方案	|适用场景	|优势	|劣势
| --- | --- | --- | --- |
|读写分离	|读多写少	|提高读性能，降低主库压力	|主从延迟，数据一致性
|分库分表	|海量数据	|突破单库限制，线性扩展	|跨片查询复杂，运维成本高
|分布式事务	|强一致性要求	|保证数据一致性	|性能开销大，复杂度高

### 2. 读写分离实现
#### 2.1 多数据源配置
```yaml
spring:
  datasource:
    # 主库数据源（写入操作）
    master:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/mybatis_master
      username: root
      password: 123456
      type: com.alibaba.druid.pool.DruidDataSource
    
    # 从库数据源（读取操作）
    slave:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3307/mybatis_slave
      username: root
      password: 123456
      type: com.alibaba.druid.pool.DruidDataSource

# MyBatis 基础配置
mybatis:
  mapper-locations: classpath:mapper/*.xml          # Mapper映射文件路径
  type-aliases-package: com.example.entity          # 实体类别名包（简化XML中类型引用）
  configuration:
    map-underscore-to-camel-case: true              # 开启下划线转驼峰命名
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 控制台打印SQL日志
```
#### 2.2 数据源配置类
```java
@Configuration
public class DataSourceConfig {
    @Bean("masterDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.master")
    public DataSource masterDataSource() {
        return DruidDataSourceBuilder.create().build();
    }

    @Bean("slaveDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    public DataSource slaveDataSource() {
        return DruidDataSourceBuilder.create().build();
    }

    @Bean("dynamicDataSource")
    @Primary
    public DataSource dynamicDataSource() {
        DynamicDataSource dynamicDataSource = new DynamicDataSource();
        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put(DataSourceType.MASTER, masterDataSource());
        dataSourceMap.put(DataSourceType.SLAVE, slaveDataSource());
        dynamicDataSource.setTargetDataSources(dataSourceMap);
        dynamicDataSource.setDefaultTargetDataSource(masterDataSource());
        return dynamicDataSource;
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dynamicDataSource());
        factoryBean.setMapperLocations(
                new PathMatchingResourcePatternResolver()
                        .getResources("classpath:mapper/*.xml"));
        return factoryBean.getObject();
    }
}
```
#### 2.3 动态数据源实现
```java
public class DynamicDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.getDataSourceType();
    }
}

public class DataSourceContextHolder {
    private static final ThreadLocal<DataSourceType> CONTEXT_HOLDER = new ThreadLocal<>();

    public static void setDataSourceType(DataSourceType dataSourceType) {
        CONTEXT_HOLDER.set(dataSourceType);
    }

    public static DataSourceType getDataSourceType() {
        return CONTEXT_HOLDER.get();
    }

    public static void clearDataSourceType() {
        CONTEXT_HOLDER.remove();
    }
}

public enum DataSourceType {
    MASTER, SLAVE
}
```
#### 2.4 AOP切面实现
```java
@Aspect
@Component
@Order(1)
public class DataSourceAspect {

    // 切入点：匹配标注了@DataSource注解的方法
    @Pointcut("@annotation(com.example.annotation.DataSource)")
    public void dataSourcePointCut() {}

    @Around("dataSourcePointCut()")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        
        // 优先使用注解指定的数据源
        DataSource dataSource = method.getAnnotation(DataSource.class);
        if (dataSource != null) {
            DataSourceContextHolder.setDataSourceType(dataSource.value());
        } else {
            // 无注解时，根据方法名自动切换主从库
            String methodName = method.getName();
            if (methodName.startsWith("get") || methodName.startsWith("select") 
                || methodName.startsWith("find") || methodName.startsWith("query")) {
                DataSourceContextHolder.setDataSourceType(DataSourceType.SLAVE); // 读操作走从库
            } else {
                DataSourceContextHolder.setDataSourceType(DataSourceType.MASTER); // 写操作走主库
            }
        }

        try {
            return point.proceed(); // 执行目标方法
        } finally {
            DataSourceContextHolder.clearDataSourceType(); // 清除数据源标识，避免污染
        }
    }
}
```
### 3. 分库分表实现
#### 3.1 ShardingSphere配置
```xml
<!-- ShardingSphere 分库分表核心依赖（Spring Boot Starter） -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
    <version>5.2.1</version>
</dependency>
```
#### 3.2 分片配置
```yaml
spring:
  shardingsphere:
    # 数据源配置（分库：ds0、ds1两个数据库）
    datasource:
      names: ds0,ds1  # 数据源名称列表
      # 数据源0配置
      ds0:
        type: com.alibaba.druid.pool.DruidDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/mybatis_shard_0
        username: root
        password: 123456
      # 数据源1配置
      ds1:
        type: com.alibaba.druid.pool.DruidDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/mybatis_shard_1
        username: root
        password: 123456
    
    # 分库分表规则配置
    rules:
      sharding:
        # 表分片规则
        tables:
          # 用户表分库分表规则
          dist_users:
            actual-data-nodes: ds$->{0..1}.dist_users_$->{0..1}  # 实际数据节点：ds0/ds1 + dist_users_0/dist_users_1
            # 数据库分片策略（按id取模）
            database-strategy:
              standard:
                sharding-column: id  # 分片键：用户id
                sharding-algorithm-name: user-database-inline
            # 表分片策略（按id取模）
            table-strategy:
              standard:
                sharding-column: id  # 分片键：用户id
                sharding-algorithm-name: user-table-inline
          
          # 订单表分库分表规则
          dist_orders:
            actual-data-nodes: ds$->{0..1}.dist_orders_$->{0..1}  # 实际数据节点：ds0/ds1 + dist_orders_0/dist_orders_1
            # 数据库分片策略（按user_id取模，与用户表同库）
            database-strategy:
              standard:
                sharding-column: user_id  # 分片键：用户id
                sharding-algorithm-name: order-database-inline
            # 表分片策略（按user_id取模）
            table-strategy:
              standard:
                sharding-column: user_id  # 分片键：用户id
                sharding-algorithm-name: order-table-inline
        
        # 分片算法配置（INLINE表达式）
        sharding-algorithms:
          # 用户库分片算法：id%2 → ds0/ds1
          user-database-inline:
            type: INLINE
            props:
              algorithm-expression: ds$->{id % 2}
          # 用户表分片算法：id%2 → dist_users_0/dist_users_1
          user-table-inline:
            type: INLINE
            props:
              algorithm-expression: dist_users_$->{id % 2}
          # 订单库分片算法：user_id%2 → ds0/ds1（与用户同库）
          order-database-inline:
            type: INLINE
            props:
              algorithm-expression: ds$->{user_id % 2}
          # 订单表分片算法：user_id%2 → dist_orders_0/dist_orders_1
          order-table-inline:
            type: INLINE
            props:
              algorithm-expression: dist_orders_$->{user_id % 2}
```
#### 3.3 分片策略
| 分片类型 | 分片键 | 分片算法 | 适用场景 |
| --- | --- | --- | --- |
| 水平分库 | 用户ID | 取模算法 | 用户数据分散 |
| 水平分表 | 用户ID | 取模算法 | 单表数据量控制 |
| 垂直分库 | 业务模块 | 业务分离 | 业务解耦 |
| 复合分片 | 多字段 | 复合算法 | 复杂业务场景 |
### 4. 分布式事务管理
#### 4.1 Seata集成
```xml
<!-- Seata 分布式事务核心依赖（Spring Boot Starter） -->
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-spring-boot-starter</artifactId>
    <version>1.4.2</version>
</dependency>
```
```java
@Service
public class DistributedTransactionService {
    @Autowired
    private UserService userService;
    @Autowired
    private OrderService orderService;

    @GlobalTransactional
    public void createUserAndOrder(String username, String email, Integer age, BigDecimal amount, boolean simulateError) {
        // 创建用户
        User user = new User(username, email, age);
        Long userId = userService.createUser(user);

        // 创建订单
        Order order = new Order();
        order.setUserId(userId);
        order.setOrderNo("ORDER_" + System.currentTimeMillis());
        order.setAmount(amount);
        order.setStatus("PENDING");
        orderService.createOrder(order);

        // 模拟异常
        if (simulateError) {
            throw new RuntimeException("模拟分布式事务异常");
        }
    }
}
```
#### 4.2 事务模式对比
| 事务模式 | 一致性 | 性能 | 适用场景 |
| --- | --- | --- | --- |
| AT模式 | 最终一致性 | 高 | 大部分业务场景 |
| TCC模式 | 强一致性 | 中 | 对一致性要求高 |
| SAGA模式 | 最终一致性 | 高 | 长事务场景 |
| XA模式 | 强一致性 | 低 | 传统分布式事务 |
### 5. 数据源注解使用
#### 5.1 注解定义
```java
@Target({ElementType.METHOD, ElementType.TYPE}) 
@Retention(RetentionPolicy.RUNTIME) 
@Documented 
public @interface DataSource { 
    DataSourceType value() default DataSourceType.MASTER; 
} 
public enum DataSourceType { 
    MASTER, SLAVE 
}
```
#### 5.2 使用示例
```java
@Service
public class UserService {
    @DataSource(DataSourceType.MASTER)
    public Long createUser(User user) {
        // 强制使用主库
        return userMapper.insertUser(user);
    }

    @DataSource(DataSourceType.SLAVE)
    public List<User> getAllUsers() {
        // 强制使用从库
        return userMapper.selectAllUsers();
    }

    // 自动判断（推荐）
    public User getUserById(Long id) {
        // 自动使用从库（方法名以get开头）
        return userMapper.selectUserById(id);
    }

    public void updateUser(User user) {
        // 自动使用主库（方法名以update开头）
        userMapper.updateUser(user);
    }
}
```
### 6. 性能优化策略
#### 6.1 连接池优化
```yaml
spring:
  datasource:
    # 主库数据源连接池配置（适配高频写操作）
    master:
      initial-size: 10        # 初始连接数
      min-idle: 10           # 最小空闲连接数
      max-active: 50          # 最大活跃连接数（写操作多，配置更高）
      max-wait: 60000         # 获取连接等待超时时间（毫秒）
    
    # 从库数据源连接池配置（适配高频读操作）
    slave:
      initial-size: 5         # 初始连接数
      min-idle: 5            # 最小空闲连接数
      max-active: 20         # 最大活跃连接数（读操作资源消耗低，配置适中）
      max-wait: 60000        # 获取连接等待超时时间（毫秒）
```
#### 6.2 分片优化
- 分片键选择：选择分布均匀的字段作为分片键
- 避免跨片查询：尽量在单个分片内完成查询
- 批量操作优化：按分片键分组进行批量操作
- 索引优化：在分片键上建立索引
#### 6.3 缓存策略
```java
@Service
public class UserService {
    @Cacheable(value = "users", key = "#id")
    @DataSource(DataSourceType.SLAVE)
    public User getUserById(Long id) {
        return userMapper.selectUserById(id);
    }
    @CacheEvict(value = "users", key = "#user.id")
    @DataSource(DataSourceType.MASTER)
    public void updateUser(User user) {
        userMapper.updateUser(user);
    }
}
```
### 7. 监控与运维
#### 7.1 数据源监控
- Druid监控：连接池状态、SQL执行统计
- 主从延迟监控：监控主从同步延迟
- 连接数监控：监控各数据源连接使用情况
- 慢SQL监控：识别和优化慢查询
#### 7.2 分片监控
- 分片路由追踪：监控SQL路由到的分片
- 跨片查询监控：识别跨片查询并优化
- 数据分布监控：监控各分片的数据分布
- 性能指标监控：各分片的性能指标
#### 7.3 事务监控
- 事务状态监控：监控分布式事务状态
- 事务链路追踪：追踪事务执行链路
- 回滚统计：统计事务回滚情况
- 性能分析：分析事务执行性能
### 8. 最佳实践
#### 8.1 读写分离最佳实践
- 主从延迟处理：重要查询使用主库，一般查询使用从库
- 故障转移：从库故障时自动切换到主库
- 负载均衡：多个从库之间进行负载均衡
- 监控告警：监控主从同步状态，及时告警
#### 8.2 分库分表最佳实践
- 分片键选择：选择分布均匀且查询频繁的字段
- 分片数量规划：根据数据增长预估合理的分片数量
- 避免跨片事务：尽量在业务层面避免跨片事务
- 数据迁移策略：制定分片扩容和数据迁移策略
#### 8.3 分布式事务最佳实践
- 减少使用：尽量通过业务设计避免分布式事务
- 选择合适模式：根据业务需求选择合适的事务模式
- 超时设置：设置合理的事务超时时间
- 补偿机制：设计完善的补偿和重试机制
### 9. 常见问题与解决方案
#### 9.1 主从延迟问题
> 问题：主从数据库之间存在同步延迟，可能导致读取到旧数据。
> 
> 解决方案：
> - 重要查询强制使用主库
> - 设置合理的延迟容忍度
> - 使用缓存减少对从库的依赖
> - 监控主从延迟，及时告警
#### 9.2 跨片查询性能问题
> 问题：跨分片查询需要在多个分片上执行，性能较差
> 
> 解决方案：
> - 优化业务逻辑，避免跨片查询
> - 使用冗余字段减少关联查询
> - 建立全局索引表
> - 使用搜索引擎处理复杂查询
#### 9.3 分布式事务性能问题
> 问题：分布式事务涉及多个数据源，性能开销较大。
> 
> 解决方案：
> - 尽量避免使用分布式事务
> - 选择性能较好的AT模式
> - 优化事务范围，减少锁定时间
> - 使用异步处理提高性能
### 10. 实践练习
练习任务
- 配置主从数据库，实现读写分离
- 使用ShardingSphere实现分库分表
- 集成Seata实现分布式事务
- 编写数据源切换的单元测试
- 监控分布式应用的性能指标
#### 10.1 环境准备
```yaml
# ====================== 1. 启动多个MySQL实例（主从） ======================
# 启动主库实例（映射3306端口）
docker run -d --name mysql-master -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0

# 启动从库实例（映射3307端口）
docker run -d --name mysql-slave -p 3307:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0

# ====================== 2. 配置MySQL主从复制 ======================
# ① 登录主库执行以下SQL（创建复制用户+授权）
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl123';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

# ② 登录从库执行以下SQL（配置主库信息+启动复制）
CHANGE MASTER TO 
  MASTER_HOST='主库IP',  # 替换为实际主库IP（如172.17.0.2）
  MASTER_USER='repl',
  MASTER_PASSWORD='repl123',
  MASTER_LOG_FILE='mysql-bin.000001',  # 需与主库show master status结果一致
  MASTER_LOG_POS=0;
START SLAVE;

# ====================== 3. 启动Seata Server ======================
# -p：端口  -h：绑定地址  -m：存储模式（file为本地文件）
sh seata-server.sh -p 8091 -h 127.0.0.1 -m file
```
#### 10.2 运行示例程序
```bash
# 1. 克隆项目 
git clone https://github.com/example/mybatis-distributed.git 
cd mybatis-distributed 
# 2. 修改配置文件 
vim src/main/resources/application.yml 
# 修改数据库连接信息 
# 3. 初始化数据库 
mysql -h localhost -P 3306 -u root -p < src/main/resources/init-master.sql 
mysql -h localhost -P 3307 -u root -p < src/main/resources/init-slave.sql 
# 4. 编译运行 
mvn clean compile mvn spring-boot:run 
# 5. 观察控制台输出 
# 查看读写分离、分库分表、分布式事务的执行日志
```
#### 10.3 测试结果示例
```text
=== MyBatis 分布式应用演示 ===

1. 读写分离演示
   写操作：创建用户 [MASTER]
   INSERT INTO users (username, email, age) VALUES (?, ?, ?)
   用户创建成功，ID: 1
   
   读操作：查询用户 [SLAVE]
   SELECT * FROM users WHERE id = ?
   查询到用户: test_user_1703123456789
   
   读操作：查询用户列表 [SLAVE]
   SELECT * FROM users
   用户总数: 1

2. 分库分表演示
   [SHARD ds1.dist_users_1]
   INSERT INTO dist_users_1 (username, email, age) VALUES (?, ?, ?)
   分片用户创建成功，ID: 1
   
   [SHARD ds1.dist_orders_1]
   INSERT INTO dist_orders_1 (user_id, order_no, amount, status) VALUES (?, ?, ?, ?)
   分片订单创建成功，ID: 1

3. 分布式事务演示
   执行分布式事务（成功场景）
   [SEATA] Global transaction [192.168.1.100:8091:123456789] begin
   [MASTER] INSERT INTO users (username, email, age) VALUES (?, ?, ?)
   [MASTER] INSERT INTO orders (user_id, order_no, amount, status) VALUES (?, ?, ?, ?)
   [SEATA] Global transaction [192.168.1.100:8091:123456789] commit
   分布式事务执行成功
   
   执行分布式事务（失败场景）
   [SEATA] Global transaction [192.168.1.100:8091:123456790] begin
   [SEATA] Global transaction [192.168.1.100:8091:123456790] rollback
   分布式事务回滚成功: 模拟分布式事务异常

4. 数据源切换演示
   使用主数据源查询 [MASTER]
   SELECT * FROM users
   主数据源用户数量: 10
   
   使用从数据源查询 [SLAVE]
   SELECT * FROM users
   从数据源用户数量: 10

5. 性能对比演示
   读分离100次查询耗时: 156ms
   分片批量插入50条记录耗时: 89ms
```
#### 注意事项
- 确保主从数据库配置正确，主从同步正常
- Seata Server需要正确配置和启动
- 分片数据库需要预先创建分片表
- 注意观察SQL执行的数据源路由情况
- 监控分布式事务的执行状态
### 本章小结
通过本章学习，掌握了MyBatis在分布式环境下的应用，包括读写分离的实现、分库分表的配置、分布式事务的管理等。这些技术是构建高可用、高性能分布式系统的重要基础。在实际项目中，需要根据具体的业务需求和技术架构选择合适的分布式方案。

## 微服务架构
### 微服务架构概述
微服务架构是一种将单一应用程序开发为一套小服务的方法，每个服务运行在自己的进程中，并使用轻量级机制（通常是HTTP资源API）进行通信。本章将深入探讨MyBatis在微服务架构中的应用。

### 学习目标
- 掌握MyBatis在微服务架构中的应用
- 学习服务发现与注册机制
- 理解分布式事务在微服务中的处理
- 掌握配置中心的使用
- 学习服务间通信与熔断机制
- 了解微服务监控与运维
### 微服务核心特性
#### 服务发现
自动发现和注册服务实例，支持动态扩缩容

- Nacos服务注册与发现
- 健康检查机制
- 负载均衡策略
- 服务元数据管理
#### 服务间通信
高效的服务间调用机制

- OpenFeign声明式调用
- HTTP客户端配置
- 请求响应拦截器
- 调用链路追踪
#### 熔断降级
保障系统稳定性的容错机制

- Hystrix熔断器
- 降级策略配置
- 超时控制
- 实时监控面板
#### 配置中心
集中化配置管理

- Nacos配置中心
- 动态配置刷新
- 环境隔离
- 配置版本管理
### 服务发现与注册
#### Nacos配置
```yaml
# application.yml
spring:
  application:
    name: user-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: dev
        group: DEFAULT_GROUP
        metadata:
          version: 1.0.0
          region: beijing
      config:
        server-addr: localhost:8848
        file-extension: yml
        namespace: dev
        group: DEFAULT_GROUP
        refresh-enabled: true
```
#### 服务注册示例
```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

@RestController
@RequestMapping("/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
    
    @PostMapping
    public ResponseEntity createUser(@RequestBody User user) {
        User savedUser = userService.createUser(user);
        return ResponseEntity.ok(savedUser);
    }
}
```
### 服务间通信
#### OpenFeign客户端
```java
@FeignClient(name = "order-service", fallback = OrderServiceFallback.class)
public interface OrderServiceClient {
    
    @GetMapping("/orders/user/{userId}")
    List getOrdersByUserId(@PathVariable("userId") Long userId);
    
    @PostMapping("/orders")
    Order createOrder(@RequestBody Order order);
    
    @GetMapping("/orders/{id}")
    Order getOrderById(@PathVariable("id") Long id);
}

@Component
public class OrderServiceFallback implements OrderServiceClient {
    
    @Override
    public List getOrdersByUserId(Long userId) {
        return Collections.emptyList();
    }
    
    @Override
    public Order createOrder(Order order) {
        throw new ServiceUnavailableException("订单服务暂时不可用");
    }
    
    @Override
    public Order getOrderById(Long id) {
        return null;
    }
}
```
#### Feign配置
```yaml
# application.yml
feign:
  hystrix:
    enabled: true
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 10000
        loggerLevel: basic
      order-service:
        connectTimeout: 3000
        readTimeout: 8000
        requestInterceptors:
          - com.example.interceptor.AuthInterceptor
```
### 分布式事务管理
#### Seata集成
```yaml
# Seata配置
seata:
  enabled: true
  application-id: user-service
  tx-service-group: my_tx_group
  service:
    vgroup-mapping:
      my_tx_group: default
    grouplist:
      default: localhost:8091
  config:
    type: nacos
    nacos:
      server-addr: localhost:8848
      namespace: seata
      group: SEATA_GROUP
  registry:
    type: nacos
    nacos:
      server-addr: localhost:8848
      namespace: seata
      group: SEATA_GROUP
```
#### 分布式事务示例
```java
@Service
public class DistributedTransactionService {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderServiceClient orderServiceClient;
    
    @Autowired
    private PaymentServiceClient paymentServiceClient;
    
    @GlobalTransactional(name = "create-user-order", rollbackFor = Exception.class)
    public void createUserAndOrder(String username, String email,Integer age, BigDecimal amount,boolean simulateError) {
        // 1. 创建用户
        User user = new User(username, email, age);
        Long userId = userService.createUser(user);
        
        // 2. 创建订单
        Order order = new Order();
        order.setUserId(userId);
        order.setOrderNo("ORDER_" + System.currentTimeMillis());
        order.setAmount(amount);
        order.setStatus("PENDING");
        
        Order savedOrder = orderServiceClient.createOrder(order);
        
        // 3. 创建支付记录
        Payment payment = new Payment();
        payment.setOrderId(savedOrder.getId());
        payment.setAmount(amount);
        payment.setStatus("PENDING");
        
        paymentServiceClient.createPayment(payment);
        
        // 模拟异常，测试事务回滚
        if (simulateError) {
            throw new RuntimeException("模拟业务异常，触发分布式事务回滚");
        }
    }
}
```
### 配置中心应用
#### 动态配置
```java
@Component
@RefreshScope
public class DynamicConfig {
    
    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;
    
    @Value("${app.cache.ttl:3600}")
    private int cacheTtl;
    
    @Value("${app.database.pool.max-size:20}")
    private int maxPoolSize;
    
    // getter methods...
}

@RestController
public class ConfigController {
    
    @Autowired
    private DynamicConfig dynamicConfig;
    
    @GetMapping("/config")
    public Map getConfig() {
        Map config = new HashMap<>();
        config.put("featureEnabled", dynamicConfig.isFeatureEnabled());
        config.put("cacheTtl", dynamicConfig.getCacheTtl());
        config.put("maxPoolSize", dynamicConfig.getMaxPoolSize());
        return config;
    }
}
```
#### 配置监听
```java
@Component
public class ConfigChangeListener {
    
    private static final Logger logger = LoggerFactory.getLogger(ConfigChangeListener.class);
    
    @NacosConfigListener(dataId = "user-service.yml", groupId = "DEFAULT_GROUP")
    public void onConfigChange(String newContent) {
        logger.info("配置发生变化: {}", newContent);
        // 处理配置变化逻辑
    }
    
    @EventListener
    public void handleRefreshEvent(RefreshEvent event) {
        logger.info("配置刷新事件: {}", event.getEventDesc());
        // 处理刷新事件
    }
}
```
### 熔断器机制
#### Hystrix配置
```yaml
# application.yml
hystrix:
  command:
    default:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 5000
      circuitBreaker:
        enabled: true
        requestVolumeThreshold: 20
        sleepWindowInMilliseconds: 5000
        errorThresholdPercentage: 50
      metrics:
        rollingStats:
          timeInMilliseconds: 10000
    OrderServiceClient#getOrdersByUserId(Long):
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 3000
```
#### 熔断器使用
```java
@Service
public class UserService {
    
    @Autowired
    private OrderServiceClient orderServiceClient;
    
    @HystrixCommand(
        fallbackMethod = "getUserWithOrdersFallback",
        commandProperties = {
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000"),
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "10")
        }
    )
    public UserWithOrders getUserWithOrders(Long userId) {
        User user = getUserById(userId);
        List orders = orderServiceClient.getOrdersByUserId(userId);
        
        UserWithOrders result = new UserWithOrders();
        result.setUser(user);
        result.setOrders(orders);
        return result;
    }
    
    public UserWithOrders getUserWithOrdersFallback(Long userId) {
        User user = getUserById(userId);
        UserWithOrders result = new UserWithOrders();
        result.setUser(user);
        result.setOrders(Collections.emptyList());
        return result;
    }
}
```
### 异步处理
#### 消息队列集成
```yaml
# RabbitMQ配置
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /
    listener:
      simple:
        acknowledge-mode: manual
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000
```
#### 异步消息处理
```java
@Component
public class UserEventPublisher {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void publishUserCreatedEvent(User user) {
        UserCreatedEvent event = new UserCreatedEvent();
        event.setUserId(user.getId());
        event.setUsername(user.getUsername());
        event.setEmail(user.getEmail());
        event.setTimestamp(LocalDateTime.now());
        
        rabbitTemplate.convertAndSend("user.exchange", "user.created", event);
    }
}

@RabbitListener(queues = "user.created.queue")
@Component
public class UserEventListener {
    
    @Autowired
    private NotificationService notificationService;
    
    @RabbitHandler
    public void handleUserCreatedEvent(
        UserCreatedEvent event, 
        Channel channel, 
        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            // 处理用户创建事件
            notificationService.sendWelcomeEmail(event.getEmail());
            
            // 手动确认消息
            channel.basicAck(deliveryTag, false);
        } catch (Exception e) {
            // 处理失败，拒绝消息
            channel.basicNack(deliveryTag, false, true);
        }
    }
}
```
### 监控与运维
#### 健康检查
```java
@Component
public class CustomHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public Health health() {
        try {
            // 检查数据库连接
            Connection connection = dataSource.getConnection();
            connection.close();
            
            return Health.up()
                    .withDetail("database", "Available")
                    .withDetail("timestamp", LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("database", "Unavailable")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```
#### Actuator配置
```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,hystrix.stream
  endpoint:
    health:
      show-details: always
    metrics:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true
```
### 最佳实践
#### 服务设计
- 单一职责原则
- 数据库独立
- 无状态设计
- API版本管理
#### 配置管理
- 环境隔离
- 敏感信息加密
- 配置版本控制
- 动态配置刷新
#### 容错设计
- 熔断器模式
- 重试机制
- 降级策略
- 超时控制
#### 监控运维
- 链路追踪
- 指标监控
- 日志聚合
- 告警机制
### 常见问题与解决方案
#### 服务调用超时
> 问题：服务间调用经常超时
> 
> 解决方案：
> - 调整Feign客户端超时配置
> - 优化数据库查询性能
> - 增加服务实例数量
> - 实施熔断降级策略
#### 分布式事务失败
> 问题：分布式事务回滚不完整
>
> 解决方案：
> - 检查Seata配置是否正确
> - 确保所有参与方都支持事务
> - 合理设置事务超时时间
> - 监控事务执行状态
#### 配置不生效
> 问题：Nacos配置修改后不生效
> 
> 解决方案：
> - 检查@RefreshScope注解
> - 确认配置文件格式正确
> - 验证命名空间和分组
> - 重启应用实例
### 实践练习
#### 运行示例程序
1. 环境准备
```yaml
# 启动Nacos
sh startup.sh -m standalone

# 启动Seata Server
sh seata-server.sh

# 启动RabbitMQ
rabbitmq-server
```
2. 编译运行
```bash
# 编译项目
mvn clean compile

# 运行用户服务
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 访问服务
curl http://localhost:8080/users/1
```
3. 测试功能
- 测试服务发现与注册
- 验证服务间调用
- 测试分布式事务
- 验证熔断降级
- 测试配置动态刷新
4. 预期结果
```text
=== MyBatis 微服务集成演示 ===

1. 服务发现演示
服务注册成功: user-service
发现服务实例: [192.168.1.100:8080]
负载均衡策略: RoundRobin

1. 服务间调用演示
调用订单服务成功: 获取到3个订单
调用支付服务成功: 支付状态已更新
Feign客户端响应时间: 150ms

2. 分布式事务演示
分布式事务执行成功
事务ID: 192.168.1.100:8091:2087229536
参与方: user-service, order-service, payment-service

3. 熔断器演示
正常调用成功率: 95%
熔断器状态: CLOSED
降级调用次数: 2

4. 配置中心演示
配置动态刷新成功
当前配置版本: v1.2.0
配置变更通知: 已接收

5. 异步处理演示
消息发送成功: user.created.event
消息消费成功: 欢迎邮件已发送
消息队列深度: 0
```

## Mapper接口进阶
### 本章概述
Mapper接口是MyBatis的核心特性之一，它通过动态代理机制为开发者提供了类型安全、简洁优雅的数据访问方式。本章将深入探讨Mapper接口的工作原理、使用方法和最佳实践。

- 类型安全
编译时检查，避免运行时错误

- 代码简洁
无需编写实现类，专注业务逻辑

- 动态代理
运行时生成实现，灵活高效

- 注解支持
支持注解和XML两种配置方式

### Mapper接口基础
#### 什么是Mapper接口
Mapper接口是MyBatis中定义数据库操作方法的Java接口，通过动态代理机制自动生成实现类。

- 定义数据库操作方法
- 无需编写实现类
- 支持注解和XML配置
- 提供类型安全保障
#### 动态代理原理
MyBatis使用JDK动态代理为Mapper接口生成代理对象，拦截方法调用并执行对应的SQL。

- MapperProxyFactory创建代理
- MapperProxy拦截方法调用
- MapperMethod执行SQL
- 结果自动映射返回
### 注解方式映射
#### 基本CRUD注解
```java
@Mapper
public interface UserMapper {
    
    // 查询操作
    @Select("SELECT * FROM user WHERE id = #{id}")
    User selectById(Long id);
    
    // 插入操作
    @Insert("INSERT INTO user(username, email, age) VALUES(#{username}, #{email}, #{age})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);
    
    // 更新操作
    @Update("UPDATE user SET username=#{username}, email=#{email}, age=#{age} WHERE id=#{id}")
    int update(User user);
    
    // 删除操作
    @Delete("DELETE FROM user WHERE id = #{id}")
    int deleteById(Long id);
}
```
#### 复杂结果映射
```java
@Results({
    @Result(property = "id", column = "user_id"),
    @Result(property = "username", column = "user_name"),
    @Result(property = "email", column = "user_email"),
    @Result(property = "age", column = "user_age")
})
@Select("SELECT user_id, user_name, user_email, user_age FROM user_info WHERE user_id = #{id}")
User selectFromUserInfo(Long id);
```
#### XML方式映射
Mapper XML配置
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mybatis.mapper.UserMapper">
    
    <!-- 结果映射 -->
    <resultMap id="userResultMap" type="com.example.mybatis.entity.User">
        <id property="id" column="id"/>
        <result property="username" column="username"/>
        <result property="email" column="email"/>
        <result property="age" column="age"/>
    </resultMap>
    
    <!-- 条件查询 -->
    <select id="selectByCondition" parameterType="map" resultMap="userResultMap">
        SELECT * FROM user
        <where>
            <if test="username != null and username != ''">
                AND username LIKE CONCAT('%', #{username}, '%')
            </if>
            <if test="minAge != null">
                AND age >= #{minAge}
            </if>
            <if test="maxAge != null">
                AND age <= #{maxAge}
            </if>
        </where>
        ORDER BY create_time DESC
    </select>
    
</mapper>
```
### 高级特性
#### 批量操作
```java
// 批量插入
@Insert("<script>" +
        "INSERT INTO user (username, email, age) VALUES " +
        "<foreach collection='users' item='user' separator=','>" +
        "(#{user.username}, #{user.email}, #{user.age})" +
        "</foreach>" +
        "</script>")
int batchInsert(@Param("users") List<User> users);

// 批量更新
@Update("<script>" +
        "<foreach collection='users' item='user' separator=';'>" +
        "UPDATE user SET username=#{user.username}, email=#{user.email} WHERE id=#{user.id}" +
        "</foreach>" +
        "</script>")
int batchUpdate(@Param("users") List<User> users);
```

#### 分页查询
```java
// 基本分页
@Select("SELECT * FROM user ORDER BY id LIMIT #{offset}, #{limit}")
List<User> selectByPage(@Param("offset") int offset, @Param("limit") int limit);

// 条件分页
@Select("<script>" +
        "SELECT * FROM user" +
        "<where>" +
        "<if test='username != null'>AND username LIKE CONCAT('%', #{username}, '%')</if>" +
        "<if test='minAge != null'>AND age >= #{minAge}</if>" +
        "</where>" +
        "ORDER BY id LIMIT #{offset}, #{limit}" +
        "</script>")
List<User> selectByConditionWithPage(
    @Param("username") String username,
    @Param("minAge") Integer minAge,
    @Param("offset") int offset,
    @Param("limit") int limit
);
```

#### 动态SQL
```java
动态SQL
// 动态查询条件
@Select("<script>" +
        "SELECT * FROM user" +
        "<where>" +
        "<if test='id != null'>AND id = #{id}</if>" +
        "<if test='username != null and username != \"\"'>" +
        "AND username LIKE CONCAT('%', #{username}, '%')" +
        "</if>" +
        "<if test='email != null and email != \"\"'>AND email = #{email}</if>" +
        "<if test='minAge != null'>AND age >= #{minAge}</if>" +
        "<if test='maxAge != null'>AND age <= #{maxAge}</if>" +
        "</where>" +
        "ORDER BY create_time DESC" +
        "</script>")
List<User> selectByDynamicCondition(Map<String, Object> params);
```
#### SQL构建器  
```java
// SQL提供者类
public class UserSqlProvider {
    
    public String selectByCondition(Map<String, Object> params) {
        SQL sql = new SQL();
        sql.SELECT("*").FROM("user");
        
        if (params.get("username") != null) {
            sql.WHERE("username LIKE CONCAT('%', #{username}, '%')");
        }
        if (params.get("minAge") != null) {
            sql.WHERE("age >= #{minAge}");
        }
        if (params.get("maxAge") != null) {
            sql.WHERE("age <= #{maxAge}");
        }
        
        sql.ORDER_BY("create_time DESC");
        return sql.toString();
    }
}

// 使用SQL提供者
@SelectProvider(type = UserSqlProvider.class, method = "selectByCondition")
List<User> selectByCondition(Map<String, Object> params);

```
### 最佳实践
接口设计
- 单一职责：每个Mapper接口只负责一个实体的数据操作
- 方法命名：使用清晰、一致的方法命名规范
- 参数设计：合理使用@Param注解，避免参数过多
- 返回类型：根据业务需求选择合适的返回类型
SQL优化
- 索引使用：确保查询条件字段有合适的索引
- 分页查询：大数据量时使用LIMIT进行分页
- 批量操作：使用批量插入/更新提高性能
- 避免N+1：合理使用关联查询避免N+1问题
安全考虑
- 参数校验：在Service层进行参数校验
- SQL注入：使用#{}参数绑定防止SQL注入
- 权限控制：在业务层实现数据权限控制
- 敏感数据：避免在日志中输出敏感信息
配置管理
- XML vs 注解：复杂SQL使用XML，简单SQL使用注解
- 命名空间：确保Mapper XML的namespace与接口全限定名一致
- 结果映射：复用ResultMap，避免重复定义
- 缓存配置：合理配置二级缓存提高性能
### 实践练习
- 练习1：基础Mapper接口

目标: 创建一个用户管理的Mapper接口，实现基本的CRUD操作。

- 使用注解方式定义基本的增删改查方法
- 实现根据用户名模糊查询
- 实现用户统计功能
- 添加适当的参数校验

验证：编写测试类验证所有方法的正确性。

- 练习2：复杂查询实现

目标：使用XML方式实现复杂的动态查询功能。

- 实现多条件动态查询
- 支持分页和排序
- 实现批量操作
- 使用ResultMap进行复杂结果映射

验证：测试各种查询条件组合的正确性。

- 练习3：性能优化

目标： 优化Mapper接口的性能，提高查询效率。

- 分析SQL执行计划
- 优化查询语句
- 合理使用缓存
- 实现批量处理

验证：对比优化前后的性能差异。

### 项目文件
```text
chapter-19-mapper-interface/ 
├── src/ 
│ ├── main/ 
│ │ ├── java/ 
│ │ │ └── com/ 
│ │ │ └── example/ 
│ │ │ └── mybatis/ 
│ │ │ ├── entity/ 
│ │ │ │ └── User.java 
│ │ │ ├── mapper/ 
│ │ │ │ ├── UserMapper.java 
│ │ │ │ └── UserSqlProvider.java 
│ │ │ └── Application.java 
│ │ └── resources/ 
│ │ ├── mapper/ 
│ │ │ └── UserMapper.xml 
│ │ └── application.yml 
│ └── test/ 
│ └── java/ 
│ └── com/ 
│ └── example/ 
│ └── mybatis/ 
│ └── mapper/ 
│ └── UserMapperTest.java 
├── pom.xml 
└── README.md
```

## Spring集成进阶
### Spring 集成概述
Spring 集成进阶 是在基础集成的基础上，深入学习 MyBatis 与 Spring 框架的高级特性，包括事务管理、数据源配置、AOP 集成等内容。

### 核心特性
- 事务管理: 深入理解 Spring 声明式事务管理，掌握事务传播行为和隔离级别

- 数据源配置: 学习多数据源配置、连接池优化和数据源切换策略

- AOP 集成: 利用 Spring AOP 实现日志记录、性能监控等横切关注点

- 缓存集成: 集成 Spring Cache 抽象，实现多级缓存和缓存策略

- 安全集成: 与 Spring Security 集成，实现数据访问权限控制

- 监控集成: 集成 Spring Actuator，实现应用健康检查和性能监控

### 事务管理配置
```java
// 事务配置类：配置事务管理器和事务模板
@Configuration
@EnableTransactionManagement
public class TransactionConfig {

    // 配置数据源事务管理器
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    // 配置事务模板（编程式事务使用）
    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        return new TransactionTemplate(transactionManager);
    }
}

// 用户服务类：声明式事务示例
@Service
@Transactional  // 类级别默认事务规则
public class UserService {

    @Autowired
    private UserMapper userMapper;

    // 写操作：REQUIRED传播行为（默认，有事务则加入，无则新建）
    @Transactional(propagation = Propagation.REQUIRED)
    public void createUser(User user) {
        userMapper.insert(user);
    }

    // 读操作：只读事务（优化数据库性能）
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }
}
```
### 多数据源配置
```java
@Configuration
public class DataSourceConfig {

    // 配置主数据源（@Primary指定默认数据源）
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    // 配置从/次数据源
    @Bean
    @ConfigurationProperties("spring.datasource.secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    // 配置主数据源对应的SqlSessionFactory（绑定primary目录下的Mapper）
    @Bean
    @Primary
    public SqlSessionFactory primarySqlSessionFactory(@Qualifier("primaryDataSource") DataSource dataSource) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource);
        // 指定主数据源的Mapper映射文件路径
        bean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:mapper/primary/*.xml"));
        return bean.getObject();
    }

    // 配置次数据源对应的SqlSessionFactory（绑定secondary目录下的Mapper）
    @Bean
    public SqlSessionFactory secondarySqlSessionFactory(@Qualifier("secondaryDataSource") DataSource dataSource) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource);
        // 指定次数据源的Mapper映射文件路径
        bean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:mapper/secondary/*.xml"));
        return bean.getObject();
    }
}
```
### AOP 集成示例
```java
@Aspect
@Component
public class DatabaseAuditAspect {

    // 日志记录器
    private static final Logger logger = LoggerFactory.getLogger(DatabaseAuditAspect.class);

    // 切入点：匹配所有标注了@Transactional注解的方法
    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object auditDatabaseOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        // 记录操作开始时间和方法名
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        
        logger.info("开始执行数据库操作: {}", methodName);

        try {
            // 执行目标方法
            Object result = joinPoint.proceed();
            
            // 记录操作完成耗时
            long endTime = System.currentTimeMillis();
            logger.info("数据库操作完成: {}, 耗时: {}ms", methodName, endTime - startTime);
            return result;
        } catch (Exception e) {
            // 记录操作失败信息
            logger.error("数据库操作失败: {}, 错误: {}", methodName, e.getMessage());
            throw e; // 抛出异常，不影响原有事务逻辑
        }
    }
}
```
### 缓存集成配置
```java
@Configuration
@EnableCaching
public class CacheConfig {

    // 配置缓存管理器（使用ConcurrentMapCacheManager，也可以选择其他缓存实现）
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(Arrays.asList("users", "orders", "products"));
        return cacheManager;
    }
}

// 用户服务类：缓存示例
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    // 缓存用户信息（key为用户ID）
    @Cacheable(value = "users", key = "#id")
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }

    // 更新用户信息后，清除缓存（key为用户ID）
    @CacheEvict(value = "users", key = "#user.id")
    public void updateUser(User user) {
        userMapper.updateById(user);
    }

    // 清除所有用户缓存
    @CacheEvict(value = "users", allEntries = true)
    public void clearAllUsers() {
        // 清除所有用户缓存
    }
```
### 安全集成
```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService();
    }
}

@Service
public class UserService {
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public User getUserById(Long userId) {
        return userMapper.selectById(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List getAllUsers() {
        return userMapper.selectAll();
    }
}
```
### 监控集成
```yaml
# Spring Boot Actuator 监控配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus  # 暴露的监控端点
  endpoint:
    health:
      show-details: always  # 健康检查显示详细信息
  metrics:
    export:
      prometheus:
        enabled: true  # 开启Prometheus指标导出
```
```java
// 自定义数据库健康检查指示器（接入Spring Boot Actuator）
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    @Override
    public Health health() {
        try (SqlSession session = sqlSessionFactory.openSession()) {
            // 执行简单SQL验证数据库连接可用性
            session.selectOne("SELECT 1");
            
            // 数据库可用时返回UP状态，附带详细信息
            return Health.up()
                    .withDetail("database", "Available")
                    .withDetail("connection", "Active")
                    .build();
        } catch (Exception e) {
            // 数据库不可用时返回DOWN状态，附带错误信息
            return Health.down()
                    .withDetail("database", "Unavailable")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```
### 最佳实践
- 事务边界设计：合理设计事务边界，避免长事务和事务嵌套问题
- 数据源管理：使用连接池，合理配置连接参数和超时时间
- 缓存策略：根据业务特点选择合适的缓存策略和过期时间
- 异常处理：统一异常处理机制，确保事务正确回滚
- 性能监控：建立完善的监控体系，及时发现性能问题
- 安全防护：实施数据访问权限控制和SQL注入防护
### 常见问题与解决方案
#### 事务不生效
- 检查 @Transactional 注解配置
- 确认方法是否为 public
- 避免同类内部方法调用
- 检查事务管理器配置
#### 缓存穿透
- 使用布隆过滤器
- 缓存空值
- 参数校验
- 限流保护
#### 连接池耗尽
- 合理配置连接池大小
- 设置连接超时时间
- 及时释放连接
- 监控连接使用情况
#### 性能问题
- SQL 优化
- 索引优化
- 分页查询
- 批量操作
### 实践练习
基础练习
- 配置声明式事务管理
- 实现多数据源切换
- 集成 Spring Cache
- 添加 AOP 日志记录

进阶练习
- 实现分布式事务
- 集成 Spring Security
- 添加性能监控
- 实现读写分离

高级练习
- 实现动态数据源
- 集成分布式缓存
- 实现数据库分片
- 添加链路追踪
### 本章小结
深入学习了 MyBatis 与 Spring 框架的高级集成特性，包括：

- 事务管理：掌握了 Spring 声明式事务管理的配置和使用
- 多数据源：学会了多数据源的配置和动态切换
- AOP 集成：了解了如何利用 AOP 实现横切关注点
- 缓存集成：掌握了 Spring Cache 的配置和使用策略
- 安全集成：学习了与 Spring Security 的集成方法
- 监控集成：了解了应用监控和健康检查的实现
- 最佳实践：掌握了企业级应用的最佳实践和常见问题



