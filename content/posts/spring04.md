---
title: "SpringBoot-高级特性与性能优化"
date: 2021-02-19T18:29:39+08:00
draft: false
description: "SpringBoot-高级特性与性能优化：SpringBoot AOP、SpringBoot缓存管理、SpringBoot运行时特性。"
tags: ["SpringBoot","框架应用"]
categories: ["Framework"]
---

## SpringBoot AOP
### AOP核心概念
- 切面(Aspect) - 横切关注点的模块化
- 连接点(JoinPoint) - 程序执行的特定点
- 切点(Pointcut) - 连接点的集合
- 通知(Advice) - 切面在特定连接点执行的动作
- 目标对象(Target) - 被通知的对象
- 代理(Proxy) - AOP框架创建的对象
### AOP依赖配置
```xml
<!-- pom.xml AOP依赖配置 -->
<dependencies>
    <!-- SpringBoot AOP启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-aop</artifactId>
    </dependency>
    
    <!-- SpringBoot Web启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- SpringBoot 测试启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
```yaml
# application.yml AOP配置
spring:
  aop:
    # 启用AOP自动配置
    auto: true
    # 使用CGLIB代理
    proxy-target-class: true
    
# 日志配置
logging:
  level:
    cn.bugstack.springframework.boot.aop: DEBUG
    org.springframework.aop: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
``` 
### AOP执行流程
1. 目标方法调用
客户端调用目标对象的方法
2. 代理拦截
AOP代理拦截方法调用
3. 前置通知
执行@Before通知方法
4. 目标方法执行
调用实际的目标方法
5. 后置通知
执行@After、@AfterReturning等通知

### 切面实现示例
```java
// LoggingAspect.java - 日志切面
@Aspect
@Component
@Slf4j
public class LoggingAspect {
    
    /**
     * 定义切点：拦截service包下所有类的所有方法
     */
    @Pointcut("execution(* cn.bugstack.springframework.boot.aop.service.*.*(..))")
    public void servicePointcut() {}
    
    /**
     * 前置通知：方法执行前记录日志
     */
    @Before("servicePointcut()")
    public void beforeAdvice(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        Object[] args = joinPoint.getArgs();
        
        log.info("=== 方法执行前 ===");
        log.info("类名: {}", className);
        log.info("方法名: {}", methodName);
        log.info("参数: {}", Arrays.toString(args));
        log.info("执行时间: {}", LocalDateTime.now());
    }
    
    /**
     * 后置通知：方法执行后记录日志
     */
    @AfterReturning(pointcut = "servicePointcut()", returning = "result")
    public void afterReturningAdvice(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        
        log.info("=== 方法执行后 ===");
        log.info("方法名: {}", methodName);
        log.info("返回值: {}", result);
        log.info("执行完成时间: {}", LocalDateTime.now());
    }
    
    /**
     * 异常通知：方法抛出异常时记录日志
     */
    @AfterThrowing(pointcut = "servicePointcut()", throwing = "exception")
    public void afterThrowingAdvice(JoinPoint joinPoint, Exception exception) {
        String methodName = joinPoint.getSignature().getName();
        
        log.error("=== 方法执行异常 ===");
        log.error("方法名: {}", methodName);
        log.error("异常信息: {}", exception.getMessage());
        log.error("异常类型: {}", exception.getClass().getSimpleName());
    }
    
    /**
     * 环绕通知：完全控制方法执行
     */
    @Around("servicePointcut()")
    public Object aroundAdvice(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        String methodName = proceedingJoinPoint.getSignature().getName();
        long startTime = System.currentTimeMillis();
        
        log.info("=== 环绕通知开始 ===");
        log.info("方法名: {}", methodName);
        
        try {
            // 执行目标方法
            Object result = proceedingJoinPoint.proceed();
            
            long endTime = System.currentTimeMillis();
            log.info("=== 环绕通知结束 ===");
            log.info("方法名: {}", methodName);
            log.info("执行耗时: {}ms", endTime - startTime);
            
            return result;
        } catch (Exception e) {
            log.error("环绕通知捕获异常: {}", e.getMessage());
            throw e;
        }
    }
}

// UserService.java - 目标服务类
@Service
@Slf4j
public class UserService {
    
    public User getUserById(Long id) {
        log.info("查询用户信息，ID: {}", id);
        
        // 模拟数据库查询
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("用户ID不能为空或小于等于0");
        }
        
        User user = new User();
        user.setId(id);
        user.setUsername("user" + id);
        user.setEmail("user" + id + "@example.com");
        user.setCreateTime(LocalDateTime.now());
        
        return user;
    }
    
    public List<User> getAllUsers() {
        log.info("查询所有用户信息");
        
        List<User> users = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            User user = new User();
            user.setId((long) i);
            user.setUsername("user" + i);
            user.setEmail("user" + i + "@example.com");
            user.setCreateTime(LocalDateTime.now());
            users.add(user);
        }
        
        return users;
    }
    
    public User saveUser(User user) {
        log.info("保存用户信息: {}", user);
        
        if (user == null) {
            throw new IllegalArgumentException("用户信息不能为空");
        }
        
        // 模拟保存操作
        user.setId(System.currentTimeMillis());
        user.setCreateTime(LocalDateTime.now());
        
        return user;
    }
}

// User.java - 用户实体类
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    private String email;
    private LocalDateTime createTime;
}
```           
### AOP切面图示
@Before 前置通知 → Target Method 目标方法 → @After后置通知
- @Around 环绕通知可以完全控制整个执行流程

- @AfterThrowing 异常通知在方法抛出异常时执行

- @AfterReturning 返回通知在方法正常返回时执行

### 切点表达式
- execution - 匹配方法执行
- within - 匹配类型内的方法
- this - 匹配代理对象类型
- target - 匹配目标对象类型
- args - 匹配方法参数
- @annotation - 匹配注解
### 通知类型
- @Before - 前置通知，方法执行前
- @After - 后置通知，方法执行后
- @AfterReturning - 返回通知，正常返回后
- @AfterThrowing - 异常通知，抛出异常后
- @Around - 环绕通知，完全控制执行
- @Pointcut - 切点定义，可重用

### 性能监控切面
```java
// PerformanceAspect.java - 性能监控切面
@Aspect
@Component
@Slf4j
public class PerformanceAspect {
    
    /**
     * 自定义注解切点
     */
    @Pointcut("@annotation(cn.bugstack.springframework.boot.aop.annotation.PerformanceMonitor)")
    public void performancePointcut() {}
    
    /**
     * 环绕通知：监控方法执行性能
     */
    @Around("performancePointcut()")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        // 记录开始时间
        long startTime = System.currentTimeMillis();
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        log.info("🚀 开始执行方法: {}.{}", className, methodName);
        
        try {
            // 执行目标方法
            Object result = joinPoint.proceed();
            
            // 记录结束时间
            stopWatch.stop();
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;
            
            // 性能分析
            if (executionTime > 1000) {
                log.warn("⚠️ 慢方法警告: {}.{} 执行耗时: {}ms", className, methodName, executionTime);
            } else if (executionTime > 500) {
                log.info("⏰ 方法执行: {}.{} 执行耗时: {}ms", className, methodName, executionTime);
            } else {
                log.debug("✅ 方法执行: {}.{} 执行耗时: {}ms", className, methodName, executionTime);
            }
            
            // 记录到监控系统（可集成Micrometer）
            recordMetrics(className, methodName, executionTime);
            
            return result;
            
        } catch (Exception e) {
            stopWatch.stop();
            long executionTime = System.currentTimeMillis() - startTime;
            
            log.error("❌ 方法执行异常: {}.{} 执行耗时: {}ms 异常: {}", 
                className, methodName, executionTime, e.getMessage());
            
            // 记录异常指标
            recordErrorMetrics(className, methodName, e);
            
            throw e;
        }
    }
    
    /**
     * 记录性能指标
     */
    private void recordMetrics(String className, String methodName, long executionTime) {
        // 可以集成Micrometer、Prometheus等监控系统
        Timer.Sample sample = Timer.start();
        sample.stop(Timer.builder("method.execution.time")
            .tag("class", className)
            .tag("method", methodName)
            .register(Metrics.globalRegistry));
    }
    
    /**
     * 记录异常指标
     */
    private void recordErrorMetrics(String className, String methodName, Exception e) {
        Counter.builder("method.execution.error")
            .tag("class", className)
            .tag("method", methodName)
            .tag("exception", e.getClass().getSimpleName())
            .register(Metrics.globalRegistry)
            .increment();
    }
}

// PerformanceMonitor.java - 性能监控注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PerformanceMonitor {
    
    /**
     * 监控描述
     */
    String value() default "";
    
    /**
     * 慢方法阈值（毫秒）
     */
    long threshold() default 1000;
}

// 使用示例
@Service
public class OrderService {
    
    @PerformanceMonitor("查询订单信息")
    public Order getOrderById(Long orderId) {
        // 模拟数据库查询
        try {
            Thread.sleep(800); // 模拟耗时操作
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        return new Order(orderId, "ORDER-" + orderId, new BigDecimal("99.99"));
    }
    
    @PerformanceMonitor(value = "创建订单", threshold = 2000)
    public Order createOrder(Order order) {
        // 模拟复杂业务逻辑
        try {
            Thread.sleep(1500); // 模拟耗时操作
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        order.setId(System.currentTimeMillis());
        return order;
    }
}
```           
### 权限控制切面
```java
// SecurityAspect.java - 权限控制切面
@Aspect
@Component
@Slf4j
public class SecurityAspect {
    
    @Autowired
    private UserContext userContext;
    
    /**
     * 权限检查切点
     */
    @Pointcut("@annotation(cn.bugstack.springframework.boot.aop.annotation.RequirePermission)")
    public void securityPointcut() {}
    
    /**
     * 前置通知：权限检查
     */
    @Before("securityPointcut() && @annotation(requirePermission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission requirePermission) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String[] permissions = requirePermission.value();
        
        log.info("🔒 权限检查: {}.{} 需要权限: {}", className, methodName, Arrays.toString(permissions));
        
        // 获取当前用户
        User currentUser = userContext.getCurrentUser();
        if (currentUser == null) {
            log.warn("❌ 权限检查失败: 用户未登录");
            throw new SecurityException("用户未登录，请先登录");
        }
        
        // 检查用户权限
        Set<String> userPermissions = getUserPermissions(currentUser);
        boolean hasPermission = Arrays.stream(permissions)
            .anyMatch(userPermissions::contains);
        
        if (!hasPermission) {
            log.warn("❌ 权限检查失败: 用户 {} 缺少权限 {}", 
                currentUser.getUsername(), Arrays.toString(permissions));
            throw new SecurityException("权限不足，无法访问该资源");
        }
        
        log.info("✅ 权限检查通过: 用户 {} 访问 {}.{}", 
            currentUser.getUsername(), className, methodName);
    }
    
    /**
     * 获取用户权限
     */
    private Set<String> getUserPermissions(User user) {
        // 模拟从数据库或缓存中获取用户权限
        Set<String> permissions = new HashSet<>();
        
        if ("admin".equals(user.getUsername())) {
            permissions.add("user:read");
            permissions.add("user:write");
            permissions.add("user:delete");
            permissions.add("order:read");
            permissions.add("order:write");
        } else if ("manager".equals(user.getUsername())) {
            permissions.add("user:read");
            permissions.add("order:read");
            permissions.add("order:write");
        } else {
            permissions.add("user:read");
            permissions.add("order:read");
        }
        
        return permissions;
    }
}

// RequirePermission.java - 权限注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequirePermission {
    
    /**
     * 需要的权限列表
     */
    String[] value();
    
    /**
     * 权限检查模式：ALL-需要所有权限，ANY-需要任一权限
     */
    PermissionMode mode() default PermissionMode.ANY;
}

// PermissionMode.java - 权限模式枚举
public enum PermissionMode {
    ALL,  // 需要所有权限
    ANY   // 需要任一权限
}

// 使用示例
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping("/{id}")
    @RequirePermission("user:read")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @PostMapping
    @RequirePermission("user:write")
    public User createUser(@RequestBody User user) {
        return userService.saveUser(user);
    }
    
    @DeleteMapping("/{id}")
    @RequirePermission(value = {"user:delete", "admin"}, mode = PermissionMode.ANY)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
```            
### AOP注解对比
|注解类型	|执行时机	|参数	|使用场景
| -- | -- | -- | --
|@Before	|方法执行前	|JoinPoint	|参数校验、权限检查
|@After	|方法执行后（无论成功失败）	|JoinPoint	|资源清理、日志记录
|@AfterReturning	|方法正常返回后	|JoinPoint, 返回值	|结果处理、缓存更新
|@AfterThrowing	|方法抛出异常后	|JoinPoint, 异常对象	|异常处理、错误日志
|@Around	|完全控制方法执行	|ProceedingJoinPoint	|性能监控、事务管理
### AOP最佳实践
#### 设计原则
- 单一职责 - 每个切面只处理一种横切关注点

- 最小侵入 - 尽量减少对业务代码的影响

- 性能考虑 - 避免在高频方法上使用复杂切面

- 异常处理 - 切面中的异常要妥善处理

- 测试友好 - 确保切面逻辑可以被单独测试

#### 示例代码
```java
// AOP配置类
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig {
    
    /**
     * 配置切面执行顺序
     */
    @Bean
    @Order(1)
    public SecurityAspect securityAspect() {
        return new SecurityAspect();
    }
    
    @Bean
    @Order(2)
    public LoggingAspect loggingAspect() {
        return new LoggingAspect();
    }
    
    @Bean
    @Order(3)
    public PerformanceAspect performanceAspect() {
        return new PerformanceAspect();
    }
}

// 切面测试
@SpringBootTest
class AopTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    void testAopLogging() {
        // 测试AOP日志功能
        User user = userService.getUserById(1L);
        assertNotNull(user);
        assertEquals("user1", user.getUsername());
    }
    
    @Test
    void testAopException() {
        // 测试AOP异常处理
        assertThrows(IllegalArgumentException.class, () -> {
            userService.getUserById(-1L);
        });
    }
}
```            

## SpringBoot缓存管理
### 缓存核心概念
- 缓存命中 - 数据在缓存中找到
- 缓存穿透 - 查询不存在的数据
- 缓存雪崩 - 大量缓存同时失效
- 缓存击穿 - 热点数据缓存失效
- 缓存预热 - 提前加载热点数据
- 缓存更新 - 数据一致性保证

### 缓存依赖配置
```xml
<!-- pom.xml 缓存依赖配置 -->
<dependencies>
    <!-- SpringBoot Cache启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>
    
    <!-- SpringBoot Redis启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <!-- SpringBoot Web启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- JSON处理 -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```
```yaml
# application.yml 缓存配置
spring:
  # Redis配置
  redis:
    host: localhost
    port: 6379
    password: 
    database: 0
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
        max-wait: -1ms
  
  # 缓存配置
  cache:
    type: redis
    redis:
      time-to-live: 600000  # 10分钟
      cache-null-values: true
      use-key-prefix: true
      key-prefix: "cache:"

# 日志配置
logging:
  level:
    cn.bugstack.springframework.boot.cache: DEBUG
    org.springframework.cache: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```           
### 缓存执行流程
1. 请求到达:客户端发起数据查询请求
2. 缓存查找:检查缓存中是否存在数据
3. 缓存命中:如果命中，直接返回缓存数据
4. 缓存未命中:查询数据库获取数据
5. 更新缓存:将查询结果存入缓存
### Spring Cache注解使用
```java
// CacheConfig.java - 缓存配置类
@Configuration
@EnableCaching
@Slf4j
public class CacheConfig {
    
    /**
     * 配置Redis缓存管理器
     */
    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                // 设置缓存过期时间为10分钟
                .entryTtl(Duration.ofMinutes(10))
                // 设置key序列化方式
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                // 设置value序列化方式
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                // 不缓存null值
                .disableCachingNullValues();
        
        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(config)
                .build();
    }
    
    /**
     * 配置本地缓存管理器（Caffeine）
     */
    @Bean("caffeineCacheManager")
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                // 设置最大缓存数量
                .maximumSize(1000)
                // 设置写入后过期时间
                .expireAfterWrite(Duration.ofMinutes(5))
                // 设置缓存移除监听器
                .removalListener((key, value, cause) -> 
                    log.info("缓存移除 - key: {}, value: {}, cause: {}", key, value, cause))
        );
        return cacheManager;
    }
}

// UserService.java - 用户服务类
@Service
@Slf4j
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * @Cacheable - 缓存查询结果
     * value: 缓存名称
     * key: 缓存key，支持SpEL表达式
     * condition: 缓存条件
     * unless: 排除条件
     */
    @Cacheable(value = "users", key = "#id", condition = "#id > 0")
    public User getUserById(Long id) {
        log.info("从数据库查询用户信息，ID: {}", id);
        
        // 模拟数据库查询耗时
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            log.warn("用户不存在，ID: {}", id);
        }
        return user;
    }
    
    /**
     * @CachePut - 更新缓存
     * 无论缓存是否存在，都会执行方法并更新缓存
     */
    @CachePut(value = "users", key = "#user.id")
    public User saveUser(User user) {
        log.info("保存用户信息: {}", user);
        
        if (user.getId() == null) {
            user.setId(System.currentTimeMillis());
        }
        user.setUpdateTime(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        log.info("用户保存成功，更新缓存: {}", savedUser);
        return savedUser;
    }
    
    /**
     * @CacheEvict - 清除缓存
     * allEntries: 是否清除所有缓存条目
     * beforeInvocation: 是否在方法执行前清除缓存
     */
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        log.info("删除用户，ID: {}", id);
        userRepository.deleteById(id);
        log.info("用户删除成功，清除缓存: {}", id);
    }
    
    /**
     * @CacheEvict - 清除所有用户缓存
     */
    @CacheEvict(value = "users", allEntries = true)
    public void clearAllUserCache() {
        log.info("清除所有用户缓存");
    }
    
    /**
     * @Caching - 组合多个缓存操作
     */
    @Caching(
        cacheable = @Cacheable(value = "userStats", key = "#userId"),
        put = @CachePut(value = "userLastAccess", key = "#userId")
    )
    public UserStats getUserStats(Long userId) {
        log.info("获取用户统计信息，ID: {}", userId);
        
        // 模拟复杂统计计算
        UserStats stats = new UserStats();
        stats.setUserId(userId);
        stats.setLoginCount(100);
        stats.setLastLoginTime(LocalDateTime.now());
        stats.setTotalPoints(1500);
        
        return stats;
    }
}

// User.java - 用户实体类
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements Serializable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    private String nickname;
    
    @Column(name = "create_time")
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}

// UserStats.java - 用户统计实体
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStats implements Serializable {
    private Long userId;
    private Integer loginCount;
    private LocalDateTime lastLoginTime;
    private Integer totalPoints;
}
```           
### 缓存架构图示
```text
L1 Cache 本地缓存 → L2 Cache Redis缓存 → Database 数据库
```
多级缓存架构：本地缓存 → Redis缓存 → 数据库

提供更好的性能和可用性保障

### 缓存注解
- @Cacheable - 缓存查询结果
- @CachePut - 更新缓存数据
- @CacheEvict - 清除缓存数据
- @Caching - 组合多个缓存操作
- @CacheConfig - 类级别缓存配置
- @EnableCaching - 启用缓存功能
### 缓存策略
- Cache-Aside - 旁路缓存模式
- Read-Through - 读穿透模式
- Write-Through - 写穿透模式
- Write-Behind - 写回模式
- Refresh-Ahead - 预刷新模式
- TTL策略 - 时间过期策略
### 自定义缓存管理
```java
// CustomCacheManager.java - 自定义缓存管理器
@Component
@Slf4j
public class CustomCacheManager {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    /**
     * 设置缓存
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
            log.debug("设置缓存成功 - key: {}, timeout: {}{}", key, timeout, unit);
        } catch (Exception e) {
            log.error("设置缓存失败 - key: {}", key, e);
        }
    }
    
    /**
     * 获取缓存
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                log.debug("缓存未命中 - key: {}", key);
                return null;
            }
            
            log.debug("缓存命中 - key: {}", key);
            return clazz.isInstance(value) ? (T) value : null;
        } catch (Exception e) {
            log.error("获取缓存失败 - key: {}", key, e);
            return null;
        }
    }
    
    /**
     * 删除缓存
     */
    public boolean delete(String key) {
        try {
            Boolean result = redisTemplate.delete(key);
            log.debug("删除缓存 - key: {}, result: {}", key, result);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("删除缓存失败 - key: {}", key, e);
            return false;
        }
    }
    
    /**
     * 批量删除缓存
     */
    public long deletePattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                Long result = redisTemplate.delete(keys);
                log.debug("批量删除缓存 - pattern: {}, count: {}", pattern, result);
                return result != null ? result : 0;
            }
            return 0;
        } catch (Exception e) {
            log.error("批量删除缓存失败 - pattern: {}", pattern, e);
            return 0;
        }
    }
    
    /**
     * 检查缓存是否存在
     */
    public boolean exists(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("检查缓存存在性失败 - key: {}", key, e);
            return false;
        }
    }
    
    /**
     * 设置缓存过期时间
     */
    public boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            Boolean result = redisTemplate.expire(key, timeout, unit);
            log.debug("设置缓存过期时间 - key: {}, timeout: {}{}", key, timeout, unit);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("设置缓存过期时间失败 - key: {}", key, e);
            return false;
        }
    }
    
    /**
     * 获取缓存剩余过期时间
     */
    public long getExpire(String key, TimeUnit unit) {
        try {
            Long expire = redisTemplate.getExpire(key, unit);
            return expire != null ? expire : -1;
        } catch (Exception e) {
            log.error("获取缓存过期时间失败 - key: {}", key, e);
            return -1;
        }
    }
}

// CacheService.java - 缓存服务类
@Service
@Slf4j
public class CacheService {
    
    @Autowired
    private CustomCacheManager cacheManager;
    
    private static final String USER_CACHE_PREFIX = "user:";
    private static final String PRODUCT_CACHE_PREFIX = "product:";
    
    /**
     * 缓存用户信息
     */
    public void cacheUser(User user) {
        String key = USER_CACHE_PREFIX + user.getId();
        cacheManager.set(key, user, 30, TimeUnit.MINUTES);
    }
    
    /**
     * 获取缓存的用户信息
     */
    public User getCachedUser(Long userId) {
        String key = USER_CACHE_PREFIX + userId;
        return cacheManager.get(key, User.class);
    }
    
    /**
     * 清除用户缓存
     */
    public void evictUser(Long userId) {
        String key = USER_CACHE_PREFIX + userId;
        cacheManager.delete(key);
    }
    
    /**
     * 清除所有用户缓存
     */
    public void evictAllUsers() {
        String pattern = USER_CACHE_PREFIX + "*";
        long count = cacheManager.deletePattern(pattern);
        log.info("清除所有用户缓存，数量: {}", count);
    }
    
    /**
     * 缓存预热 - 预加载热点数据
     */
    @PostConstruct
    public void warmUpCache() {
        log.info("开始缓存预热...");
        
        // 预加载热点用户数据
        List<Long> hotUserIds = Arrays.asList(1L, 2L, 3L, 4L, 5L);
        for (Long userId : hotUserIds) {
            try {
                // 这里应该从数据库加载用户数据
                User user = loadUserFromDatabase(userId);
                if (user != null) {
                    cacheUser(user);
                    log.debug("预热用户缓存: {}", userId);
                }
            } catch (Exception e) {
                log.error("预热用户缓存失败: {}", userId, e);
            }
        }
        
        log.info("缓存预热完成");
    }
    
    /**
     * 从数据库加载用户数据（模拟）
     */
    private User loadUserFromDatabase(Long userId) {
        // 模拟数据库查询
        User user = new User();
        user.setId(userId);
        user.setUsername("user" + userId);
        user.setEmail("user" + userId + "@example.com");
        user.setCreateTime(LocalDateTime.now());
        return user;
    }
}
```           
### 缓存问题解决方案
```java
// CacheProblemSolver.java - 缓存问题解决方案
@Service
@Slf4j
public class CacheProblemSolver {
    
    @Autowired
    private CustomCacheManager cacheManager;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 解决缓存穿透问题
     * 使用布隆过滤器或缓存空值
     */
    public User getUserWithBloomFilter(Long userId) {
        String key = "user:" + userId;
        
        // 1. 先检查缓存
        User cachedUser = cacheManager.get(key, User.class);
        if (cachedUser != null) {
            return cachedUser;
        }
        
        // 2. 检查布隆过滤器（这里简化为ID范围检查）
        if (userId <= 0 || userId > 1000000) {
            log.warn("用户ID超出范围，可能是恶意请求: {}", userId);
            // 缓存空值，防止重复查询
            cacheManager.set(key, new User(), 5, TimeUnit.MINUTES);
            return null;
        }
        
        // 3. 查询数据库
        User user = userRepository.findById(userId).orElse(null);
        
        // 4. 缓存结果（包括空值）
        if (user != null) {
            cacheManager.set(key, user, 30, TimeUnit.MINUTES);
        } else {
            // 缓存空值，设置较短过期时间
            cacheManager.set(key, new User(), 5, TimeUnit.MINUTES);
        }
        
        return user;
    }
    
    /**
     * 解决缓存雪崩问题
     * 使用随机过期时间
     */
    public User getUserWithRandomExpire(Long userId) {
        String key = "user:" + userId;
        
        User cachedUser = cacheManager.get(key, User.class);
        if (cachedUser != null) {
            return cachedUser;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            // 设置随机过期时间，避免同时失效
            int randomMinutes = 30 + new Random().nextInt(30); // 30-60分钟
            cacheManager.set(key, user, randomMinutes, TimeUnit.MINUTES);
        }
        
        return user;
    }
    
    /**
     * 解决缓存击穿问题
     * 使用分布式锁
     */
    public User getUserWithDistributedLock(Long userId) {
        String key = "user:" + userId;
        String lockKey = "lock:user:" + userId;
        
        // 1. 先检查缓存
        User cachedUser = cacheManager.get(key, User.class);
        if (cachedUser != null) {
            return cachedUser;
        }
        
        // 2. 尝试获取分布式锁
        boolean lockAcquired = acquireDistributedLock(lockKey, 10, TimeUnit.SECONDS);
        if (!lockAcquired) {
            // 获取锁失败，等待一段时间后重试
            try {
                Thread.sleep(100);
                return cacheManager.get(key, User.class);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            }
        }
        
        try {
            // 3. 双重检查缓存
            cachedUser = cacheManager.get(key, User.class);
            if (cachedUser != null) {
                return cachedUser;
            }
            
            // 4. 查询数据库
            User user = userRepository.findById(userId).orElse(null);
            
            // 5. 更新缓存
            if (user != null) {
                cacheManager.set(key, user, 30, TimeUnit.MINUTES);
            }
            
            return user;
        } finally {
            // 6. 释放分布式锁
            releaseDistributedLock(lockKey);
        }
    }
    
    /**
     * 获取分布式锁（简化实现）
     */
    private boolean acquireDistributedLock(String lockKey, long timeout, TimeUnit unit) {
        try {
            String lockValue = UUID.randomUUID().toString();
            Boolean result = cacheManager.redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, lockValue, timeout, unit);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("获取分布式锁失败: {}", lockKey, e);
            return false;
        }
    }
    
    /**
     * 释放分布式锁
     */
    private void releaseDistributedLock(String lockKey) {
        try {
            cacheManager.delete(lockKey);
        } catch (Exception e) {
            log.error("释放分布式锁失败: {}", lockKey, e);
        }
    }
    
    /**
     * 缓存更新策略 - 延时双删
     */
    @Transactional
    public User updateUserWithDelayedDoubleDelete(User user) {
        String key = "user:" + user.getId();
        
        // 1. 删除缓存
        cacheManager.delete(key);
        
        // 2. 更新数据库
        User updatedUser = userRepository.save(user);
        
        // 3. 延时删除缓存（异步执行）
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(1000); // 延时1秒
                cacheManager.delete(key);
                log.debug("延时双删完成: {}", key);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("延时双删被中断: {}", key);
            }
        });
        
        return updatedUser;
    }
}
```           
### 缓存方案对比
| 缓存类型	| 适用场景	| 优点	| 缺点
| -- | -- | -- | --
| 本地缓存	| 单机应用、读多写少	| 速度快、无网络开销	| 不支持分布式、内存限制
| Redis缓存	| 分布式应用、高并发	| 支持分布式、功能丰富	| 网络开销、单点故障
| 多级缓存	| 高性能要求、大规模应用	| 性能最优、可用性高	| 复杂度高、一致性难保证
| CDN缓存	| 静态资源、全球分发	| 就近访问、减轻服务器压力	| 只适用静态内容
### 缓存最佳实践
#### 设计原则
- 合理设置过期时间 - 根据数据特性设置TTL

- 避免缓存穿透 - 使用布隆过滤器或缓存空值

- 防止缓存雪崩 - 设置随机过期时间

- 解决缓存击穿 - 使用分布式锁或互斥锁

- 保证数据一致性 - 选择合适的缓存更新策略
#### 缓存监控
```java
// CacheMonitor.java - 缓存监控
@Component
@Slf4j
public class CacheMonitor {
    
    @Autowired
    private CacheManager cacheManager;
    
    /**
     * 缓存统计信息
     */
    @Scheduled(fixedRate = 60000) // 每分钟执行一次
    public void logCacheStats() {
        if (cacheManager instanceof RedisCacheManager) {
            Collection<String> cacheNames = cacheManager.getCacheNames();
            
            for (String cacheName : cacheNames) {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache instanceof RedisCache) {
                    log.info("缓存统计 - 缓存名: {}", cacheName);
                    // 这里可以添加更详细的统计信息
                }
            }
        }
    }
    
    /**
     * 缓存健康检查
     */
    @EventListener
    public void handleCacheEvent(CacheEvent event) {
        log.debug("缓存事件: {}", event);
    }
}

// 缓存配置建议
@Configuration
public class CacheOptimizationConfig {
    
    /**
     * 配置缓存键生成器
     */
    @Bean
    public KeyGenerator customKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName()).append(".");
            sb.append(method.getName()).append("(");
            for (Object param : params) {
                sb.append(param.toString()).append(",");
            }
            if (params.length > 0) {
                sb.setLength(sb.length() - 1);
            }
            sb.append(")");
            return sb.toString();
        };
    }
    
    /**
     * 配置缓存错误处理器
     */
    @Bean
    public CacheErrorHandler cacheErrorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, 
                                          Cache cache, Object key) {
                log.error("缓存获取错误 - cache: {}, key: {}", 
                    cache.getName(), key, exception);
            }
            
            @Override
            public void handleCachePutError(RuntimeException exception, 
                                          Cache cache, Object key, Object value) {
                log.error("缓存存储错误 - cache: {}, key: {}", 
                    cache.getName(), key, exception);
            }
            
            @Override
            public void handleCacheEvictError(RuntimeException exception, 
                                            Cache cache, Object key) {
                log.error("缓存清除错误 - cache: {}, key: {}", 
                    cache.getName(), key, exception);
            }
            
            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.error("缓存清空错误 - cache: {}", cache.getName(), exception);
            }
        };
    }
}
```            

## SpringBoot运行时特性Runtime
### 运行时核心概念
- 应用上下文 - ApplicationContext管理
- Bean生命周期 - 创建、初始化、销毁
- 事件机制 - 应用事件发布订阅
- 健康检查 - 应用健康状态
- 优雅关闭 - 资源清理机制
- 热部署 - 开发时自动重启
### 应用启动配置
```yaml
# application.yml 运行时配置
spring:
  # 应用基本信息
  application:
    name: springboot-runtime-demo
    
  # 主配置
  main:
    # 允许Bean定义覆盖
    allow-bean-definition-overriding: true
    # 允许循环引用
    allow-circular-references: false
    # Web应用类型
    web-application-type: servlet
    # 延迟初始化
    lazy-initialization: false
    
  # 生命周期配置
  lifecycle:
    # 优雅关闭超时时间
    timeout-per-shutdown-phase: 30s
    
  # 任务执行配置
  task:
    execution:
      pool:
        core-size: 8
        max-size: 16
        queue-capacity: 100
        keep-alive: 60s
      thread-name-prefix: "async-task-"
      shutdown:
        await-termination: true
        await-termination-period: 60s
        
  # 任务调度配置
  task:
    scheduling:
      pool:
        size: 4
      thread-name-prefix: "scheduled-task-"
      shutdown:
        await-termination: true
        await-termination-period: 60s

# 服务器配置
server:
  port: 8080
  # 优雅关闭
  shutdown: graceful
  # Tomcat配置
  tomcat:
    # 连接超时
    connection-timeout: 20000ms
    # 最大连接数
    max-connections: 8192
    # 线程配置
    threads:
      max: 200
      min-spare: 10
    # 接受队列大小
    accept-count: 100

# 管理端点配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env,beans,configprops
  endpoint:
    health:
      show-details: always
    shutdown:
      enabled: true
  health:
    defaults:
      enabled: true

# 日志配置
logging:
  level:
    cn.bugstack.springframework.boot.runtime: DEBUG
    org.springframework.boot: INFO
    org.springframework.context: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/runtime-demo.log
    max-size: 10MB
    max-history: 30
```           
### SpringBoot启动流程
1. 创建SpringApplication: 初始化SpringApplication实例，设置主配置类
2. 准备Environment: 加载配置文件，设置环境变量和系统属性
3. 创建ApplicationContext: 根据应用类型创建相应的上下文
4. 加载Bean定义: 扫描并注册所有Bean定义到容器
5. 刷新上下文: 实例化Bean，处理依赖注入
6. 启动完成: 发布ApplicationReadyEvent事件
### 应用生命周期管理
```java
// RuntimeApplication.java - 主启动类
@SpringBootApplication
@EnableScheduling
@EnableAsync
@Slf4j
public class RuntimeApplication {
    
    public static void main(String[] args) {
        // 创建SpringApplication
        SpringApplication app = new SpringApplication(RuntimeApplication.class);
        
        // 设置启动参数
        app.setDefaultProperties(getDefaultProperties());
        
        // 添加启动监听器
        app.addListeners(new ApplicationStartupListener());
        
        // 设置Banner模式
        app.setBannerMode(Banner.Mode.CONSOLE);
        
        // 启动应用
        ConfigurableApplicationContext context = app.run(args);
        
        // 注册关闭钩子
        context.registerShutdownHook();
        
        log.info("应用启动完成，端口: {}", 
            context.getEnvironment().getProperty("server.port"));
    }
    
    /**
     * 设置默认属性
     */
    private static Properties getDefaultProperties() {
        Properties properties = new Properties();
        properties.setProperty("spring.application.name", "runtime-demo");
        properties.setProperty("server.port", "8080");
        return properties;
    }
}

// ApplicationStartupListener.java - 启动监听器
@Component
@Slf4j
public class ApplicationStartupListener implements ApplicationListener {
    
    @Override
    public void onApplicationEvent(ApplicationEvent event) {
        if (event instanceof ApplicationStartingEvent) {
            log.info("应用开始启动...");
        } else if (event instanceof ApplicationEnvironmentPreparedEvent) {
            log.info("环境准备完成");
        } else if (event instanceof ApplicationContextInitializedEvent) {
            log.info("应用上下文初始化完成");
        } else if (event instanceof ApplicationPreparedEvent) {
            log.info("应用准备完成");
        } else if (event instanceof ApplicationStartedEvent) {
            log.info("应用启动完成");
        } else if (event instanceof ApplicationReadyEvent) {
            log.info("应用就绪，可以接收请求");
        } else if (event instanceof ApplicationFailedEvent) {
            log.error("应用启动失败");
        }
    }
}

// LifecycleBean.java - 生命周期Bean
@Component
@Slf4j
public class LifecycleBean implements InitializingBean, DisposableBean, 
        ApplicationContextAware, BeanNameAware {
    
    private ApplicationContext applicationContext;
    private String beanName;
    
    /**
     * 构造函数
     */
    public LifecycleBean() {
        log.info("LifecycleBean 构造函数执行");
    }
    
    /**
     * 设置Bean名称
     */
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        log.info("setBeanName: {}", name);
    }
    
    /**
     * 设置应用上下文
     */
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) 
            throws BeansException {
        this.applicationContext = applicationContext;
        log.info("setApplicationContext 执行");
    }
    
    /**
     * 属性设置后执行
     */
    @PostConstruct
    public void postConstruct() {
        log.info("@PostConstruct 执行");
    }
    
    /**
     * InitializingBean接口方法
     */
    @Override
    public void afterPropertiesSet() throws Exception {
        log.info("afterPropertiesSet 执行");
    }
    
    /**
     * 自定义初始化方法
     */
    @Bean(initMethod = "customInit")
    public void customInit() {
        log.info("customInit 执行");
    }
    
    /**
     * 销毁前执行
     */
    @PreDestroy
    public void preDestroy() {
        log.info("@PreDestroy 执行");
    }
    
    /**
     * DisposableBean接口方法
     */
    @Override
    public void destroy() throws Exception {
        log.info("destroy 执行");
    }
    
    /**
     * 自定义销毁方法
     */
    public void customDestroy() {
        log.info("customDestroy 执行");
    }
}

// RuntimeService.java - 运行时服务
@Service
@Slf4j
public class RuntimeService {
    
    @Autowired
    private ApplicationContext applicationContext;
    
    /**
     * 获取应用信息
     */
    public Map getApplicationInfo() {
        Map info = new HashMap<>();
        
        // 应用名称
        info.put("applicationName", 
            applicationContext.getEnvironment().getProperty("spring.application.name"));
        
        // 启动时间
        info.put("startTime", 
            applicationContext.getStartupDate());
        
        // Bean数量
        info.put("beanCount", 
            applicationContext.getBeanDefinitionCount());
        
        // 活跃配置
        info.put("activeProfiles", 
            applicationContext.getEnvironment().getActiveProfiles());
        
        // JVM信息
        Runtime runtime = Runtime.getRuntime();
        Map jvmInfo = new HashMap<>();
        jvmInfo.put("totalMemory", runtime.totalMemory());
        jvmInfo.put("freeMemory", runtime.freeMemory());
        jvmInfo.put("maxMemory", runtime.maxMemory());
        jvmInfo.put("availableProcessors", runtime.availableProcessors());
        info.put("jvm", jvmInfo);
        
        return info;
    }
    
    /**
     * 获取Bean信息
     */
    public List getBeanNames() {
        return Arrays.asList(applicationContext.getBeanDefinitionNames());
    }
    
    /**
     * 检查Bean是否存在
     */
    public boolean containsBean(String beanName) {
        return applicationContext.containsBean(beanName);
    }
    
    /**
     * 获取Bean类型
     */
    public Class getBeanType(String beanName) {
        return applicationContext.getType(beanName);
    }
}
```           
### 运行时架构图示
```text 
Application 应用层 ➡️ SpringBoot 框架层 ➡️ JVM 虚拟机层 ➡️ OS 操作系统
```
分层架构：应用层 → SpringBoot框架 → JVM → 操作系统

每层都有相应的监控和管理机制

### 生命周期阶段
- Starting - 应用开始启动
- Environment Prepared - 环境准备完成
- Context Initialized - 上下文初始化
- Prepared - 应用准备完成
- Started - 应用启动完成
- Ready - 应用就绪状态
### 监控指标
- 内存使用 - 堆内存、非堆内存
- 线程状态 - 活跃线程、阻塞线程
- GC信息 - 垃圾回收统计
- 类加载 - 已加载类数量
- CPU使用率 - 处理器使用情况
- 网络连接 - 连接数、请求数
### 运行时监控
```java
// RuntimeMonitor.java - 运行时监控
@Component
@Slf4j
public class RuntimeMonitor {
    
    private final MeterRegistry meterRegistry;
    private final MemoryMXBean memoryMXBean;
    private final ThreadMXBean threadMXBean;
    private final GarbageCollectorMXBean[] gcMXBeans;
    
    public RuntimeMonitor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.memoryMXBean = ManagementFactory.getMemoryMXBean();
        this.threadMXBean = ManagementFactory.getThreadMXBean();
        this.gcMXBeans = ManagementFactory.getGarbageCollectorMXBeans()
                .toArray(new GarbageCollectorMXBean[0]);
        
        // 注册自定义指标
        registerCustomMetrics();
    }
    
    /**
     * 注册自定义指标
     */
    private void registerCustomMetrics() {
        // 内存使用指标
        Gauge.builder("jvm.memory.heap.used")
                .description("Used heap memory")
                .register(meterRegistry, this, 
                    monitor -> monitor.memoryMXBean.getHeapMemoryUsage().getUsed());
        
        Gauge.builder("jvm.memory.heap.max")
                .description("Max heap memory")
                .register(meterRegistry, this,
                    monitor -> monitor.memoryMXBean.getHeapMemoryUsage().getMax());
        
        // 线程数指标
        Gauge.builder("jvm.threads.live")
                .description("Live threads")
                .register(meterRegistry, this,
                    monitor -> monitor.threadMXBean.getThreadCount());
        
        Gauge.builder("jvm.threads.daemon")
                .description("Daemon threads")
                .register(meterRegistry, this,
                    monitor -> monitor.threadMXBean.getDaemonThreadCount());
    }
    
    /**
     * 获取内存信息
     */
    public Map getMemoryInfo() {
        Map memoryInfo = new HashMap<>();
        
        MemoryUsage heapUsage = memoryMXBean.getHeapMemoryUsage();
        MemoryUsage nonHeapUsage = memoryMXBean.getNonHeapMemoryUsage();
        
        // 堆内存信息
        Map heap = new HashMap<>();
        heap.put("init", heapUsage.getInit());
        heap.put("used", heapUsage.getUsed());
        heap.put("committed", heapUsage.getCommitted());
        heap.put("max", heapUsage.getMax());
        memoryInfo.put("heap", heap);
        
        // 非堆内存信息
        Map nonHeap = new HashMap<>();
        nonHeap.put("init", nonHeapUsage.getInit());
        nonHeap.put("used", nonHeapUsage.getUsed());
        nonHeap.put("committed", nonHeapUsage.getCommitted());
        nonHeap.put("max", nonHeapUsage.getMax());
        memoryInfo.put("nonHeap", nonHeap);
        
        return memoryInfo;
    }
    
    /**
     * 获取线程信息
     */
    public Map getThreadInfo() {
        Map threadInfo = new HashMap<>();
        
        threadInfo.put("totalStarted", threadMXBean.getTotalStartedThreadCount());
        threadInfo.put("live", threadMXBean.getThreadCount());
        threadInfo.put("peak", threadMXBean.getPeakThreadCount());
        threadInfo.put("daemon", threadMXBean.getDaemonThreadCount());
        
        // 线程状态统计
        ThreadInfo[] threadInfos = threadMXBean.getThreadInfo(
                threadMXBean.getAllThreadIds());
        Map stateCount = new HashMap<>();
        
        for (ThreadInfo info : threadInfos) {
            if (info != null) {
                Thread.State state = info.getThreadState();
                stateCount.merge(state, 1, Integer::sum);
            }
        }
        threadInfo.put("states", stateCount);
        
        return threadInfo;
    }
    
    /**
     * 获取GC信息
     */
    public List> getGcInfo() {
        List> gcInfo = new ArrayList<>();
        
        for (GarbageCollectorMXBean gcBean : gcMXBeans) {
            Map gc = new HashMap<>();
            gc.put("name", gcBean.getName());
            gc.put("collectionCount", gcBean.getCollectionCount());
            gc.put("collectionTime", gcBean.getCollectionTime());
            gc.put("memoryPoolNames", Arrays.asList(gcBean.getMemoryPoolNames()));
            gcInfo.add(gc);
        }
        
        return gcInfo;
    }
    
    /**
     * 获取系统信息
     */
    public Map getSystemInfo() {
        Map systemInfo = new HashMap<>();
        
        Runtime runtime = Runtime.getRuntime();
        systemInfo.put("availableProcessors", runtime.availableProcessors());
        systemInfo.put("totalMemory", runtime.totalMemory());
        systemInfo.put("freeMemory", runtime.freeMemory());
        systemInfo.put("maxMemory", runtime.maxMemory());
        
        // 操作系统信息
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        systemInfo.put("osName", osBean.getName());
        systemInfo.put("osVersion", osBean.getVersion());
        systemInfo.put("osArch", osBean.getArch());
        
        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOsBean = 
                    (com.sun.management.OperatingSystemMXBean) osBean;
            systemInfo.put("processCpuLoad", sunOsBean.getProcessCpuLoad());
            systemInfo.put("systemCpuLoad", sunOsBean.getSystemCpuLoad());
            systemInfo.put("totalPhysicalMemory", sunOsBean.getTotalPhysicalMemorySize());
            systemInfo.put("freePhysicalMemory", sunOsBean.getFreePhysicalMemorySize());
        }
        
        return systemInfo;
    }
    
    /**
     * 定时监控任务
     */
    @Scheduled(fixedRate = 60000) // 每分钟执行一次
    public void monitorRuntime() {
        Map memoryInfo = getMemoryInfo();
        Map threadInfo = getThreadInfo();
        
        log.info("运行时监控 - 堆内存使用: {}MB/{MB, 线程数: {}", 
            ((Map) memoryInfo.get("heap")).get("used") / 1024 / 1024,
            ((Map) memoryInfo.get("heap")).get("max") / 1024 / 1024,
            threadInfo.get("live"));
    }
}

// HealthIndicator.java - 自定义健康检查
@Component
public class CustomHealthIndicator implements HealthIndicator {
    
    @Autowired
    private RuntimeMonitor runtimeMonitor;
    
    @Override
    public Health health() {
        try {
            Map memoryInfo = runtimeMonitor.getMemoryInfo();
            Map heap = (Map) memoryInfo.get("heap");
            
            // 检查内存使用率
            double memoryUsage = (double) heap.get("used") / heap.get("max");
            
            if (memoryUsage > 0.9) {
                return Health.down()
                        .withDetail("memory", "Memory usage too high: " + 
                            String.format("%.2f%%", memoryUsage * 100))
                        .build();
            } else if (memoryUsage > 0.8) {
                return Health.up()
                        .withDetail("memory", "Memory usage warning: " + 
                            String.format("%.2f%%", memoryUsage * 100))
                        .build();
            } else {
                return Health.up()
                        .withDetail("memory", "Memory usage normal: " + 
                            String.format("%.2f%%", memoryUsage * 100))
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
### 优雅关闭机制
```java
// GracefulShutdownConfig.java - 优雅关闭配置
@Configuration
@Slf4j
public class GracefulShutdownConfig {
    
    /**
     * 配置优雅关闭
     */
    @Bean
    public GracefulShutdown gracefulShutdown() {
        return new GracefulShutdown();
    }
    
    /**
     * 自定义Tomcat连接器
     */
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();
        tomcat.addConnectorCustomizers(gracefulShutdown());
        return tomcat;
    }
    
    /**
     * 优雅关闭实现
     */
    private static class GracefulShutdown implements TomcatConnectorCustomizer, 
            ApplicationListener {
        
        private volatile Connector connector;
        private final int waitTime = 30;
        
        @Override
        public void customize(Connector connector) {
            this.connector = connector;
        }
        
        @Override
        public void onApplicationEvent(ContextClosedEvent event) {
            if (connector == null) {
                return;
            }
            
            log.info("开始优雅关闭，等待{}秒...", waitTime);
            
            // 停止接收新请求
            connector.pause();
            
            Executor executor = connector.getProtocolHandler().getExecutor();
            if (executor instanceof ThreadPoolExecutor) {
                ThreadPoolExecutor threadPoolExecutor = (ThreadPoolExecutor) executor;
                threadPoolExecutor.shutdown();
                
                try {
                    if (!threadPoolExecutor.awaitTermination(waitTime, TimeUnit.SECONDS)) {
                        log.warn("线程池未能在{}秒内正常关闭，强制关闭", waitTime);
                        threadPoolExecutor.shutdownNow();
                    } else {
                        log.info("线程池已优雅关闭");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    threadPoolExecutor.shutdownNow();
                }
            }
        }
    }
}

// ShutdownHook.java - 关闭钩子
@Component
@Slf4j
public class ShutdownHook {
    
    @Autowired
    private RuntimeService runtimeService;
    
    @EventListener
    public void handleContextClosedEvent(ContextClosedEvent event) {
        log.info("应用开始关闭...");
        
        // 清理资源
        cleanupResources();
        
        // 保存状态
        saveApplicationState();
        
        log.info("应用关闭完成");
    }
    
    /**
     * 清理资源
     */
    private void cleanupResources() {
        try {
            // 关闭数据库连接池
            // 清理缓存
            // 关闭消息队列连接
            // 等等...
            
            log.info("资源清理完成");
        } catch (Exception e) {
            log.error("资源清理失败", e);
        }
    }
    
    /**
     * 保存应用状态
     */
    private void saveApplicationState() {
        try {
            Map appInfo = runtimeService.getApplicationInfo();
            // 保存应用状态到文件或数据库
            log.info("应用状态保存完成");
        } catch (Exception e) {
            log.error("应用状态保存失败", e);
        }
    }
}

// RuntimeController.java - 运行时控制器
@RestController
@RequestMapping("/runtime")
@Slf4j
public class RuntimeController {
    
    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private RuntimeMonitor runtimeMonitor;
    
    @Autowired
    private ApplicationContext applicationContext;
    
    /**
     * 获取应用信息
     */
    @GetMapping("/info")
    public ResponseEntity> getApplicationInfo() {
        Map info = runtimeService.getApplicationInfo();
        return ResponseEntity.ok(info);
    }
    
    /**
     * 获取内存信息
     */
    @GetMapping("/memory")
    public ResponseEntity> getMemoryInfo() {
        Map memoryInfo = runtimeMonitor.getMemoryInfo();
        return ResponseEntity.ok(memoryInfo);
    }
    
    /**
     * 获取线程信息
     */
    @GetMapping("/threads")
    public ResponseEntity> getThreadInfo() {
        Map threadInfo = runtimeMonitor.getThreadInfo();
        return ResponseEntity.ok(threadInfo);
    }
    
    /**
     * 获取GC信息
     */
    @GetMapping("/gc")
    public ResponseEntity>> getGcInfo() {
        List> gcInfo = runtimeMonitor.getGcInfo();
        return ResponseEntity.ok(gcInfo);
    }
    
    /**
     * 获取系统信息
     */
    @GetMapping("/system")
    public ResponseEntity> getSystemInfo() {
        Map systemInfo = runtimeMonitor.getSystemInfo();
        return ResponseEntity.ok(systemInfo);
    }
    
    /**
     * 触发GC
     */
    @PostMapping("/gc")
    public ResponseEntity triggerGc() {
        System.gc();
        log.info("手动触发GC");
        return ResponseEntity.ok("GC triggered");
    }
    
    /**
     * 获取Bean列表
     */
    @GetMapping("/beans")
    public ResponseEntity> getBeans() {
        List beanNames = runtimeService.getBeanNames();
        return ResponseEntity.ok(beanNames);
    }
    
    /**
     * 优雅关闭应用
     */
    @PostMapping("/shutdown")
    public ResponseEntity shutdown() {
        log.info("收到关闭请求，开始优雅关闭...");
        
        // 异步执行关闭操作
        new Thread(() -> {
            try {
                Thread.sleep(1000); // 给响应时间
                ((ConfigurableApplicationContext) applicationContext).close();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
        
        return ResponseEntity.ok("Application shutdown initiated");
    }
}
```           
### JVM参数调优对比
| 参数类型	| 参数	| 说明	| 推荐值
| -- | -- | -- | --
| 内存设置	| -Xms / -Xmx	| 初始堆大小 / 最大堆大小	| -Xms2g -Xmx2g
| 新生代	| -Xmn	| 新生代大小	| -Xmn512m
| 垃圾回收	| -XX:+UseG1GC	| 使用G1垃圾回收器	| 推荐大内存应用
| GC日志	| -XX:+PrintGCDetails	| 打印GC详细信息	| 生产环境建议开启
| OOM处理	| -XX:+HeapDumpOnOutOfMemoryError	| OOM时生成堆转储	| 必须开启
| 远程调试	| -agentlib:jdwp	| 开启远程调试	| 开发环境使用
### 运行时最佳实践
#### 性能优化
- 合理设置JVM参数 - 根据应用特点调整内存和GC

- 监控关键指标 - 内存、线程、GC、CPU使用率

- 优雅关闭机制 - 确保资源正确释放

- 健康检查 - 实时监控应用健康状态

- 故障恢复 - 自动重启和故障转移机制

```shell
# JVM启动参数示例
java -server \
  -Xms2g -Xmx2g \
  -Xmn512m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+PrintGCDetails \
  -XX:+PrintGCTimeStamps \
  -XX:+PrintGCApplicationStoppedTime \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/logs/heapdump.hprof \
  -Djava.awt.headless=true \
  -Dfile.encoding=UTF-8 \
  -Duser.timezone=Asia/Shanghai \
  -jar springboot-runtime-demo.jar

# Docker运行示例
docker run -d \
  --name runtime-demo \
  --memory=4g \
  --cpus=2 \
  -p 8080:8080 \
  -v /logs:/app/logs \
  -e JAVA_OPTS="-Xms2g -Xmx2g -XX:+UseG1GC" \
  springboot-runtime-demo:latest

# Kubernetes部署示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: runtime-demo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: runtime-demo
  template:
    metadata:
      labels:
        app: runtime-demo
    spec:
      containers:
      - name: runtime-demo
        image: springboot-runtime-demo:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        env:
        - name: JAVA_OPTS
          value: "-Xms2g -Xmx2g -XX:+UseG1GC"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```           
