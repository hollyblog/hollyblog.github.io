---
title: "SpringBoot-企业级应用特性"
date: 2021-02-20T19:29:39+08:00
draft: false
description: "SpringBoot-企业级应用特性：SpringBoot安全、事务管理、异步处理和数据验证。"
tags: ["SpringBoot","框架应用"]
categories: ["Framework"]
---

## SpringBoot安全
### 核心概念
- Authentication：身份认证
- Authorization：权限授权
- Principal：用户主体
- Authorities：用户权限
- SecurityContext：安全上下文
- Filter Chain：安全过滤器链
### 依赖配置
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Web支持 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- JWT支持 -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>

<!-- 数据库支持 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```               
### 安全架构流程
```text
请求到达 → 安全过滤器 → 身份认证 → 权限检查 → 访问控制 → 业务处理
```
### 安全层次架构
多层安全防护体系
- 🔐 认证层 - Authentication Layer
- 🔑 授权层 - Authorization Layer
- 🔒 加密层 - Encryption Layer
- ✅ 验证层 - Validation Layer

#### 基础安全配置
```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions().deny());

        return http.build();
    }
}
```                
#### 用户认证服务
```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) 
            throws UsernameNotFoundException {
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(
                "用户不存在: " + username));

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getUsername())
            .password(user.getPassword())
            .authorities(getAuthorities(user.getRoles()))
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(false)
            .build();
    }

    private Collection<? extends GrantedAuthority> getAuthorities(Set<Role> roles) {
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .collect(Collectors.toList());
    }
}
```                
#### JWT Token配置
```java
@Component
public class JwtTokenProvider {

    private String jwtSecret = "mySecretKey";
    private int jwtExpirationInMs = 604800000; // 7天

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```               
### 认证方式对比
- Session-Cookie 认证
- JWT Token 认证
- OAuth2 第三方认证
- Basic 基础认证
- Digest 摘要认证
### 安全功能特性
- CSRF 防护
跨站请求伪造攻击防护
- XSS 防护
跨站脚本攻击防护
- SQL 注入防护
数据库注入攻击防护
- 会话管理
用户会话安全管理
- 密码加密
用户密码安全存储
- 权限控制
细粒度访问控制
### 方法级安全
```java
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @PreAuthorize("hasRole('ADMIN') and #id == authentication.principal.id")
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
    }

    @PostAuthorize("returnObject.username == authentication.name")
    @GetMapping("/profile")
    public User getProfile() {
        return userService.getCurrentUser();
    }

    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    @GetMapping("/reports")
    public List<Report> getReports() {
        return reportService.findAll();
    }
}
```               
### OAuth2 集成
```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: your-google-client-id
            client-secret: your-google-client-secret
            scope: profile, email
          github:
            client-id: your-github-client-id
            client-secret: your-github-client-secret
            scope: user:email
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v2/userinfo
            user-name-attribute: email
```
```java
@Configuration
public class OAuth2Config {
    
    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        return new CustomOAuth2UserService();
    }
}
```               
### 安全配置对比
| 认证方式 | 优点 | 缺点 | 适用场景 |
| -------- | ---- | ---- | -------- |
Session-Cookie | 简单易用，服务端控制 | 不适合分布式 | 传统Web应用 |
JWT Token | 无状态，跨域支持 | Token泄露风险 | 微服务架构 |
OAuth2 | 第三方授权，安全 | 配置复杂 | 开放平台 |
Basic Auth | 简单直接 | 安全性较低 | 内部API |
API Key | 轻量级 | 功能有限 | 公开API
### 安全最佳实践
安全开发建议
1. 密码策略：强制复杂密码，定期更换

2. 输入验证：严格验证所有用户输入

3. 权限最小化：遵循最小权限原则

4. 安全传输：使用HTTPS加密传输

5. 日志审计：记录安全相关操作

6. 定期更新：及时更新安全补丁

7. 安全测试：定期进行安全测试

8. 错误处理：避免泄露敏感信息

## SpringBoot 事务管理

### 内容概览

“**ACID 地基建库中，Spring 代理当遥控器；**  
**REQUIRED 最常用，REQUIRES_NEW 自立门户；**  
**只读优化不强制，异常回滚要抛送；**  
**同类自调用最坑人，拆出服务保事务。**”

#### 事务原理-ACID特性和事务管理机制

事务原理 & ACID 特性（地基）

1. 一句话结论  
   Spring 事务只是**对数据库事务的包装和增强**，ACID 仍由底层（InnoDB、PostgreSQL...）实现，Spring 负责**开启-提交-回滚**的统一模板。

2. ACID 回顾
 
| 特性 | 解释 | 日常例子 |
|---|---|---|
| A 原子性 | all or nothing | 转账：扣钱+加钱必须一起成功 |
| C 一致性 | 数据满足业务规则 | 账户余额不能 < 0 |
| I 隔离性 | 并发互相不干扰 | 同时取现 100，余额只减一次 |
| D 持久性 | 提交后掉电也不丢 | 提交成功，硬盘刷盘 |

3. 口诀  
“**ACID 地基建库中，Spring 只做遥控器；开启提交回滚好，异常统一能回退。**”

--------------------------------
事务管理机制（Spring 核心）

1. 一句话结论  
   Spring 通过**动态代理**在业务方法前后织入**事务切面**（TransactionInterceptor），形成一个“事务模板”——开启、提交、回滚、异常转换全自动。

2. 关键角色
- `PlatformTransactionManager`（接口）—— 真正干活的“事务驱动器”  
- `DataSourceTransactionManager`（JDBC/MyBatis）、`JpaTransactionManager`、`HibernateTransactionManager`  
- `@EnableTransactionManagement` —— 开启代理  
- `@Transactional` —— 切面切点

3. 源码级流程（可打断点）
```java
TransactionInterceptor#invoke()
  ↓
createTransactionIfNecessary()   // 开启
  ↓
调用业务方法
  ↓
commitTransactionAfterReturning() // 提交
  ↓
completeTransactionAfterThrowing() // 异常→回滚
```

4. 配置示例（SpringBoot 零 XML）
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost/test
    username: root
    password: root
  # Boot 默认已自动配置 DataSourceTransactionManager
```
启动类：
```java
@SpringBootApplication   // 内部 @EnableTransactionManagement
public class App { }
```
使用：
```java
@Service
public class OrderService {
    @Transactional(rollbackFor = Exception.class)
    public void createOrder(Order o) {
        orderMapper.insert(o);
        inventoryMapper.decrease(o.getSkuId(), o.getQty());
    }
}
```
默认只回滚 **RuntimeException**，**强制回滚 checked 异常**需 `rollbackFor = Exception.class`。

--------------------------------

#### 声明式事务-@Transactional注解的使用和配置

最常用 3 种贴法（直接跑）

| 粒度 | 示例 | 场景 |
|---|---|---|
| **类** | `@Transactional(rollbackFor = Exception.class) public class OrderService { }` | 全类公用规则，省事 |
| **方法** | 只在 `createOrder` 贴，查询方法不贴 | 细粒度，最灵活 |
| **接口** | 写在 `public interface OrderApi { @Transactional ... }` | 多实现类统一事务契约（Spring 5 仍支持） |

**SpringBoot 启动类已自带 `@EnableTransactionManagement`，无需再写。**

---
核心属性速查表
| 属性 | 默认值 | 常用取值 | 一句话说明 |
|---|---|---|---|
| **propagation** | REQUIRED | REQUIRES_NEW / NESTED | 当前无事务就新建，有就加入 |
| **isolation** | DEFAULT | READ_COMMITTED / REPEATABLE_READ | 用数据库默认隔离级 |
| **timeout** | -1 | 5 / 10（秒） | 整体事务超时就回滚 |
| **readOnly** | false | true | 只读优化，ORM 会跳过脏检查 |
| **rollbackFor** | {} | Exception.class | **强制回滚检查型异常** |
| **noRollbackFor** | {} | DataIntegrityViolationException.class | 指定**不回滚**的异常 |

**代码示例：**
```java
@Transactional(
    propagation = Propagation.REQUIRES_NEW,
    isolation = Isolation.READ_COMMITTED,
    timeout = 10,
    readOnly = false,
    rollbackFor = Exception.class
)
public void createOrder(Order o) { ... }
```

---

高频踩坑 & 现场排查口诀

1. **同类自调用 → 事务失效**  
   ```java
   @Service
   public class OrderService {
       public void outer() { inner(); }          // 事务不起作用
       @Transactional public void inner() { }
   }
   ```
   **原因**：绕过了 Spring 代理。  
   **解决**：拆到另一个 Service，或注入自己：
   ```java
   @Service
   public class OrderService {
       @Resource private OrderService self;     // 注入代理
       public void outer() { self.inner(); }
       @Transactional public void inner() { }
   }
   ```

2. **吞异常不回滚**  
   ```java
   @Transactional
   public void save() {
       try { mapper.insert(); }
       catch (Exception e) { log.error(e); }   // 异常被吃
   }
   ```
   **解决**：catch 后手动设置回滚：
   ```java
   TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
   ```

3. **大事务锁表**  
   把“查询 + 远程调用 + 批插”全放在一个 `@Transactional` → 行锁时间超长。  
   **解决**：**查询提前、远程调用拆异步、只把写操作包小事务**。

口诀：  
“**同类自调用最坑人，拆出服务保事务；吞异常记得手动滚，大事务切块锁少疼。**”

---

零注解全局配置（application.yml 一把梭）

不想在每个类写参数？统一默认：
```yaml
spring:
  transaction:
    default-timeout: 10s          # 全局超时
    rollback-on-commit-failure: true
# 对 DataSourceTransactionManager 额外属性
logging:
  level:
    org.springframework.transaction: DEBUG   # 看事务开启/提交/回滚日志
```

> 注意：`rollbackFor` 这类“异常类型”只能代码里配，YAML 无对应项。

---

一张图（脑内 10 秒）

```
业务方法 → 代理 → @Transactional(传播,隔离,只读,超时,rollbackFor) → TxManager → 数据库
```

---
终极口诀

“**类方法都能贴，属性timeout别省略；**  
**REQUIRED最常用，REQUIRES_NEW独立行；**  
**rollbackFor强制回滚，同类自调要拆清；**  
**全局YAML可默认，异常类型代码定。**”
#### 事务传播-7种传播行为和4种隔离级别的应用场景

7 种传播行为（Propagation）

| 传播行为 | 通俗解释 | 典型场景 | 踩坑提示 |
|---|---|---|---|
| **REQUIRED**（默认） | 有事务就加入，没有就新建 | 90% 业务直接用 | 无 |
| **SUPPORTS** | 有事务就加入，没有就裸奔 | 纯查询、日志归档 | 可能被调进非事务上下文，数据不一致 |
| **MANDATORY** | 必须已有事务，否则抛异常 | 强制约束“只能被事务方法调” | 单独调用会抛 `IllegalTransactionStateException` |
| **REQUIRES_NEW** | 总是新建事务，老事务挂起 | 发送 MQ/写日志，**主事务成败不影响它** | 外层回滚，它仍提交；**内抛异常，外层可选捕获** |
| **NOT_SUPPORTED** | 强制非事务运行，挂起当前事务 | 批量查询、调用本地纯 SQL 接口 | 挂起动作耗性能 |
| **NEVER** | 必须无事务，否则抛异常 | 调旧原生 JDBC 方法，怕连接被 Spring 包裹 | 几乎用不到 |
| **NESTED** | 在当前事务里开启**savepoint**嵌套事务 | 父事务回滚到保存点，子事务可单独回滚 | 仅 **DataSourceTransactionManager** 支持，JPA/Hibernate 不支持 |

故事记忆：  
“REQUIRED 抱团，REQUIRES_NEW 自立门户，NESTED 留后手，其余都是边角料。”

------------------------------------------------
4 种隔离级别（Isolation）

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 场景举例 |
|---|---|---|---|---|
| **DEFAULT** | —— | —— | —— | **用数据库默认**（MySQL 可重复读，Oracle 读已提交） |
| **READ_UNCOMMITTED** | ✔ | ✔ | ✔ | 报表拉数，**允许脏读**，并发最高，数据近似即可 |
| **READ_COMMITTED** | ✘ | ✔ | ✔ | 大多数 OLTP 系统（Oracle/SQL Server 默认），**Spring 业务常用** |
| **REPEATABLE_READ** | ✘ | ✘ | ✔ | 银行扣款、库存扣减，**同一事务多次读取必须一致** |
| **SERIALIZABLE** | ✘ | ✘ | ✘ | 财务月结、库存盘点，**并发最低，数据绝对正确** |

故事记忆：  
“**并发高→READ_COMMITTED，强一致→REPEATABLE_READ，绝对正确→SERIALIZABLE，报表近似→READ_UNCOMMITTED。**”

------------------------------------------------
组合示例

1. 订单主流程（高并发）
```java
@Transactional(propagation = REQUIRED, isolation = READ_COMMITTED)
public void createOrder() { ... }
```

2. 写日志不能影响主事务
```java
@Transactional(propagation = REQUIRES_NEW, isolation = READ_COMMITTED)
public void insertLog() { ... }
```

3. 库存扣减防重复读
```java
@Transactional(propagation = REQUIRED, isolation = REPEATABLE_READ)
public boolean decreaseStock() { ... }
```

------------------------------------------------
终极口诀

“**REQUIRED 抱团最常用，REQUIRES_NEW 独立不背锅；**  
**NESTED 留 savepoint，MANDATORY 强制事务壳；**  
**并发高 READ_COMMITTED，强一致 REPEATABLE_READ，**  
**绝对正确 SERIALIZABLE，报表近似 READ_UNCOMMITTED。**”

-----
事务传播行为（7 种“套娃”规则）

1. 一句话结论  
   当**事务方法 A** 调用**事务方法 B** 时，Spring 用“传播行为”决定 B 是**加入、挂起、新建、异常**。

2. 常用 3 种速记
| 传播 | 含义 | 口诀 |
|---|---|---|
| REQUIRED（默认） | 有就加入，无就新建 | **最常用** |
| REQUIRES_NEW | 总是新建，老事务挂起 | **独立提交** |
| NESTED | 嵌套事务，回滚点 savepoint | **部分回滚** |

3. 代码感受
```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void insertLog() { ... }  // 日志无论主业务成败都要落库
```

4. 口诀  
“**REQUIRED 是抱团，REQUIRES_NEW 自立门户，NESTED 留后手。**”

--------------------------------
事务隔离级别 & 只读 & 超时

1. 隔离级别（直接映射数据库）
```java
@Transactional(isolation = Isolation.READ_COMMITTED)
```
与 JDBC 常量一一对应：  
DEFAULT（用数据库默认） → READ_UNCOMMITTED → READ_COMMITTED → REPEATABLE_READ → SERIALIZABLE

1. 只读优化
```java
@Transactional(readOnly = true)
```
Spring 对 Hibernate/JPA 会**跳过脏检查**、MyBatis 可**走从库**，提高性能；但**不会强制数据库加锁**。

2. 超时
```java
@Transactional(timeout = 5)   // 秒
```
合并到 `setQueryTimeout`，**整体事务**超过 5 s 自动回滚。

--------------------------------
五、常见坑 & 排查口诀

| 坑 | 原因 | 解决 |
|---|---|---|
| 加入事务不生效 | 方法**同类内部自调用** → 绕代理 | 拆到另一个 Service，或注入自己 |
| 异常不回滚 | 吞掉 try-catch 没 throw | catch 后 **TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()** |
| 大事务锁表 | 业务+SQL 全在一个事务 | **小事务+异步/批量** 拆分 |


#### 分布式事务：微服务环境下的事务处理
一、为什么“本地事务”不够用了？  
单体时代：所有表在一个库，Spring 的 `@Transactional` 依靠数据库的 ACID 即可。  
微服务时代：一个业务要调**订单/库存/支付**三个服务、三个数据库 → 出现“跨库 + 跨服务”调用；网络抖动、节点宕机都可能让**部分成功、部分失败** → 数据不一致。这就是分布式事务要解决的**核心痛点** 。

---

二、CAP 视角下的“取舍”  
分布式系统必须满足**分区容错性 (P)**，所以只能在**一致性 (C)** 与**可用性 (A)** 之间权衡：  
- **强一致性**（两阶段提交 2PC）：牺牲可用性，换来数据时刻一致；  
- **最终一致性**（BASE、Saga、可靠消息）：先返回成功，再异步对账，保证“稍后一致”，系统保持高可用 。

---

三、主流方案对比（2025 年企业落地最多）

| 方案 | 一致性 | 侵入性 | 性能 | 典型框架 / 场景 | 一句话口诀 |
|---|---|---|---|---|---|
| **2PC/XA** | 强 | 低 | 低 | Seata-XA、Atomikos | “最老牌，阻塞慢，资金核账用” |
| **TCC** | 强→最终 | 高 | 中 | Seata-TCC、Hmily | “先 Try 再 Confirm，Cancel 补偿要幂等” |
| **Saga** | 最终 | 中 | 高 | Seata-Saga、Axon | “步骤链+反向操作，长事务首选” |
| **可靠消息** | 最终 | 低 | 最高 | RocketMQ、Kafka、本地消息表 | “本地表+消息，吞吐量无敌” |

> 互联网高并发场景**70% 以上采用“可靠消息”或“Saga”** ；金融核心短时强一致仍用 **2PC/XA**。

---

四、可靠消息（本地消息表）落地流程（图+代码）

1. 时序图  
```
订单服务                      消息服务                      库存服务
   │                              │                              │
1.开启本地事务                    │                              │
2.写订单表                       │                              │
3.写“消息表”(NEW)                │                              │
4.提交事务 ----------------------►│                              │
   │                              │                              │
5.定时任务扫描 NEW 记录            │                              │
6.发送消息 → RocketMQ             │                              │
7.收到 ACK 更新消息表为 DONE       │                              │
   │                              │                              │
   │                              ├─► 8.消费消息                 │
   │                              │   9.本地事务扣减库存         │
   │                              │  10.提交事务                 │
   │                              ◄─ 11.返回 ACK                │
```
2. 关键代码片段  
订单服务（生产者）
```java
@Transactional
public void createOrder(Order o) {
    orderMapper.insert(o);                 // 1.业务
    messageMapper.insert(buildMsg(o));     // 2.消息（同一事务）
}
// 定时扫描 NEW 消息并发送
@Scheduled(fixedDelay = 5000)
public void sendLoop() {
    List<Message> list = messageMapper.lockNew();
    list.forEach(m -> {
        rocketMQTemplate.send("stock-topic", m);
        messageMapper.updateDone(m.getId());
    });
}
```
库存服务（消费者）
```java
@RocketMQMessageListener(topic = "stock-topic", consumerGroup = "stock-group")
public class StockListener {
    @Override
    @Transactional
    public void onMessage(MessageExt msg) {
        // 幂等判重 & 扣库存
        if (stockService.alreadyConsumed(msg.getKeys())) return;
        stockService.decrease(msg.getBody());
    }
}
```
3. 要点  
- 消息表与业务表**同库同事务**，保证“写订单≡写消息”原子；  
- 消费端**幂等表**或 **version 字段**防重复；  
- 失败重试靠 MQ 自身，**人工兜底**用补偿线程 。

---

五、Saga 模式（事件编排）一句话记忆  
把长事务拆成 N 个本地事务，**每步发布事件**；任意步失败，按相反顺序执行已定义好的**补偿服务**。  
适合**流程长、服务多、容忍最终一致**的订单、物流、审批流 。

---

六、方案选型决策树（来自腾讯云 2025 实战）

```
if (服务B必须成功 && 可设计补偿) {
    Choose 可靠消息 / Saga
} else if (强一致 && 短链路) {
    Choose Seata-XA 或 TCC
} else {
    Choose 最终一致性（消息/Saga）
}
```
> “**能最终一致就最终一致**，不能补偿才上强一致”——阿里/腾讯内部共识 。

---

七、终极口诀（30 秒版本）

“**强一致 2PC 短链路，高并发消息最无敌；**  
**TCC 三阶段自己做，Saga 长流逆向补；**  
**能补偿就别阻塞，BASE 理论放第一！**”


### 实战案例
复杂业务场景事务处理
> 通过银行转账、订单处理等业务场景，演示事务管理的各种应用，包括事务传播、回滚机制、异常处理等。
```text
项目结构
src/main/java/com/example/transaction/
├── TransactionApplication.java     # 主启动类
├── config/
│   └── TransactionConfig.java     # 事务配置类
├── service/
│   ├── AccountService.java        # 账户服务
│   ├── OrderService.java          # 订单服务
│   └── PaymentService.java        # 支付服务
├── entity/
│   ├── Account.java               # 账户实体
│   └── Order.java                 # 订单实体
└── repository/
    ├── AccountRepository.java     # 账户仓库
    └── OrderRepository.java       # 订单仓库
```
### 重点知识
#### 事务原理
##### ACID特性详解

ACID 是**数据库事务**的四个核心特性，确保事务执行的可靠性和一致性，是关系型数据库事务管理的基础准则。

1. **Atomicity（原子性）**
- **核心定义**：事务是一个**不可分割的最小操作单元**，事务中的所有操作要么全部执行成功，要么全部执行失败并回滚到事务执行前的状态，不存在部分执行的情况。
- **通俗理解**：事务就像“原子”一样，不可拆分。比如银行转账：A账户扣钱、B账户加钱，这两个操作必须同时成功或同时失败。如果A扣钱后系统崩溃，B没加钱，事务会回滚，A的钱会恢复。
- **实现机制**：依赖数据库的**事务日志**（Undo Log），当事务执行失败时，通过日志撤销已执行的操作。

2. **Consistency（一致性）**
- **核心定义**：事务执行前后，数据库的**完整性约束**（如主键唯一、外键关联、字段校验规则等）保持不变，数据库从一个合法状态转换到另一个合法状态。
- **通俗理解**：事务不能破坏数据库的规则。比如转账时，A和B的总金额在事务前后必须相等；再比如库存扣减不能出现负数。
- **注意点**：一致性是事务的**最终目标**，原子性、隔离性、持久性都是为了保障一致性而存在的。

3. **Isolation（隔离性）**
- **核心定义**：多个并发执行的事务之间相互隔离，每个事务感觉不到其他事务的存在，不会互相干扰。
- **问题背景**：如果没有隔离性，并发事务会引发**脏读、不可重复读、幻读**等问题。
- **数据库隔离级别**（从低到高）：
  - **读未提交（Read Uncommitted）**：一个事务可以读取另一个事务未提交的数据，会导致脏读。
  - **读已提交（Read Committed）**：一个事务只能读取另一个事务已提交的数据，解决脏读，但存在不可重复读。
  - **可重复读（Repeatable Read）**：MySQL 默认隔离级别，事务执行期间多次读取同一数据的结果一致，解决不可重复读，但存在幻读。
  - **串行化（Serializable）**：最高隔离级别，事务串行执行，完全避免并发问题，但性能最低。
- **实现机制**：依赖**锁机制**（行锁、表锁）和**多版本并发控制（MVCC）**。

4. **Durability（持久性）**
- **核心定义**：一个事务一旦提交成功，其对数据库的修改就是**永久性**的，接下来的系统故障、重启等都不会导致修改丢失。
- **通俗理解**：事务提交后，数据就“落地”了，不会因为意外情况消失。比如你在电商下单付款后，即使服务器宕机，订单记录也不会丢失。
- **实现机制**：依赖数据库的**重做日志（Redo Log）**，事务提交时，修改会先写入 Redo Log，再异步刷写到磁盘数据文件；即使宕机，重启后也能通过 Redo Log 恢复已提交的修改。

ACID 特性之间的关系
1. **原子性**保障事务“要么全做，要么全不做”，是一致性的前提。
2. **隔离性**保障并发事务之间互不干扰，避免并发问题破坏一致性。
3. **持久性**保障事务提交后的修改不丢失，是最终一致性的保障。
4. **一致性**是核心目标，其他三个特性都是为了实现一致性而设计的约束。

ACID 的适用场景

ACID 主要适用于**关系型数据库**（如 MySQL、Oracle、PostgreSQL），适合对数据一致性要求高的场景，例如：
- 金融交易（银行转账、支付结算）
- 电商订单（下单、库存扣减、支付）
- 财务系统（记账、对账）

与之相对的是 **BASE 理论**（基本可用、软状态、最终一致性），适用于分布式系统和 NoSQL 数据库，牺牲强一致性换取高可用性。

---
 
##### 事务管理器

事务管理器的工作原理

核心是它通过**生命周期管控、底层日志支撑、并发隔离控制、代理/协调机制**，最终保障事务的ACID特性，不同场景（本地事务/分布式事务）的事务管理器工作流程略有差异，但核心逻辑一致。

核心工作前提：依赖两大日志（本地事务管理器）

事务管理器的提交、回滚功能，完全依赖数据库的**Undo Log（回滚日志）**和**Redo Log（重做日志）**，这是它实现原子性、持久性的基础：
1.  **Undo Log**：事务执行时，事务管理器会先记录数据的原始状态到Undo Log（相当于“备份快照”），当事务需要回滚时，通过Undo Log撤销已执行的修改，恢复数据到事务执行前的状态（保障原子性）。
2.  **Redo Log**：事务执行时，修改先写入内存缓冲区，同时事务管理器会将修改的“逻辑操作”记录到Redo Log；事务提交时，事务管理器先将Redo Log刷入磁盘（“预写日志”WAL机制），再异步刷新内存数据到磁盘数据文件，即使宕机，重启后可通过Redo Log恢复已提交的修改（保障持久性）。

本地事务管理器（如DataSourceTransactionManager、MySQL事务管理器）工作流程

本地事务管理器针对单一数据源，工作流程是**创建-执行-提交/回滚-释放资源**的闭环，步骤如下：

1.  事务初始化：创建事务并标记状态
- 应用程序发起事务开启请求（如`@Transactional`注解触发、`BEGIN`语句），事务管理器接收请求后，为该事务分配唯一标识（TxID，事务ID）。
- 事务管理器初始化事务上下文，将事务状态标记为**活跃（Active）**，同时绑定当前线程（确保同一线程内的所有数据库操作都归属该事务，如Spring中通过`ThreadLocal`存储事务上下文）。
- 事务管理器根据配置的隔离级别（如可重复读），初始化对应的隔离控制策略（如准备锁机制、MVCC快照）。

2.  事务执行：拦截操作并记录日志
- 应用程序执行增删改查操作时，事务管理器会拦截这些数据库请求，将其绑定到当前事务（通过TxID关联）。
- 对于写操作（增/删/改）：事务管理器先触发底层存储引擎记录Undo Log（原始数据）和Redo Log（修改逻辑），再执行内存数据修改（不立即刷盘，提升性能）。
- 对于读操作：事务管理器根据隔离级别，通过**锁机制**（行锁/表锁）或**MVCC（多版本并发控制）**，获取合法的数据版本（避免脏读、不可重复读等问题，保障隔离性）。
- 此阶段事务管理器持续维护事务状态，若操作无异常，保持活跃状态；若出现异常，标记为“待回滚”状态。

3.  事务收尾：提交（Commit）或回滚（Rollback）
这是事务管理器的核心决策阶段，二选一执行，最终保障数据一致性：
    - 事务提交（正常执行完毕）
      - 步骤1：事务管理器先将Redo Log从内存缓冲区**强制刷入磁盘**（WAL机制核心，确保修改不丢失），这是提交的核心关键步骤。
      - 步骤2：Redo Log刷盘成功后，事务管理器标记事务状态为**已提交（Committed）**。
      - 步骤3：异步将内存中的数据修改刷新到磁盘数据文件（无需等待，不影响提交效率）。
      - 步骤4：释放事务执行过程中持有的所有锁资源（如行锁、表锁），清理事务上下文（解绑线程）。

    - 事务回滚（执行异常/手动触发）
      - 步骤1：事务管理器接收到回滚请求（如异常抛出、`ROLLBACK`语句），标记事务状态为**回滚中（Rolling Back）**。
      - 步骤2：通过Undo Log反向撤销已执行的所有写操作，将数据恢复到事务开启前的原始状态（保障原子性，无部分修改残留）。
      - 步骤3：撤销完成后，标记事务状态为**已回滚（Rolled Back）**。
      - 步骤4：释放所有锁资源，清理事务上下文，解绑线程。

4.  异常兜底：保障数据一致性
若在提交/回滚过程中出现系统宕机，重启后事务管理器会通过日志进行恢复：
    - 若宕机时Redo Log已刷盘（事务已提交）：事务管理器通过Redo Log恢复数据修改，确保持久性。
    - 若宕机时Redo Log未刷盘（事务未提交）：事务管理器忽略该事务的内存修改，或通过Undo Log回滚已执行的操作，确保数据无脏修改。

分布式事务管理器（如Seata、TCC框架）工作原理

分布式事务管理器针对多数据源/多服务场景，核心是**协调者-参与者模式**，在本地事务基础上增加了跨节点协调能力，核心流程以主流的2PC（两阶段提交）为例：
1.  **准备阶段（Prepare）**：分布式事务管理器（协调者）向所有参与者（各节点本地事务管理器）发送准备请求，参与者执行本地事务操作（不提交），记录日志并返回“可提交”或“不可提交”状态。
2.  **提交阶段（Commit）**：若所有参与者都返回“可提交”，协调者发送全局提交指令，各参与者执行本地事务提交；若任一参与者返回“不可提交”，协调者发送全局回滚指令，各参与者执行本地事务回滚，最终确保“要么全部提交，要么全部回滚”。
3.  补充：TCC、SAGA模式的分布式事务管理器，本质是通过“预留资源-确认执行-补偿回滚”（TCC）或“正向操作-反向补偿”（SAGA），替代2PC的强一致性，换取更高的可用性。

Spring DataSourceTransactionManager 特殊工作原理（基于AOP）

Spring中的事务管理器是基于**动态代理（AOP）**实现的，这是它的特殊之处，也是注解生效的核心：
1.  当容器扫描到`@Transactional`注解时，会为目标类创建动态代理对象。
2.  调用被`@Transactional`标记的方法时，先执行代理逻辑：由事务管理器开启事务，再调用目标方法。
3.  目标方法执行成功：代理逻辑触发事务管理器提交事务；目标方法抛出异常：代理逻辑触发事务管理器回滚事务。
4.  若出现“同类内部调用”“非public方法”，动态代理无法生效，事务管理器无法拦截操作，导致事务失效（这也是之前注意事项的底层原因）。


事务管理器的工作原理可提炼为3个核心：
1.  **底层支撑**：依赖Undo Log（回滚）和Redo Log（持久化），保障原子性和持久性。
2.  **核心流程**：本地事务是“创建-执行-提交/回滚-释放”闭环；分布式事务是“协调者-参与者”的多阶段协调。
3.  **隔离保障**：通过锁机制+MVCC，根据隔离级别控制并发事务，避免数据干扰。
4.  **Spring特殊**：基于AOP动态代理实现注解式事务管理，通过ThreadLocal绑定事务上下文。

-------
**事务管理器**是数据库或分布式系统中负责**事务的生命周期管理**的核心组件，其核心职责是保障事务的 **ACID 特性**，协调事务的执行、提交、回滚以及并发事务的隔离控制。

它广泛存在于关系型数据库（如 MySQL、Oracle）、中间件（如 Spring TransactionManager）和分布式系统（如 Seata、TCC 框架）中。

事务管理器的核心功能

1.  **事务的创建与状态管理**
    - 接收客户端的事务开启请求，为事务分配唯一标识（`Transaction ID`）。
    - 维护事务的状态：**活跃（Active）**、**提交中（Committing）**、**回滚中（Rolling Back）**、**已提交（Committed）**、**已回滚（Rolled Back）**。
    - 示例：在 MySQL 中执行 `BEGIN` 或 `START TRANSACTION` 时，事务管理器会创建新事务，并标记为活跃状态。

2.  **事务的提交与回滚控制**
    - **提交（Commit）**：事务执行成功后，事务管理器协调底层存储引擎，将事务的修改持久化到磁盘，并释放事务持有的锁资源，最终将事务状态置为已提交。
      - 实现依赖：数据库的 **Redo Log**（重做日志），确保提交后的修改不会因宕机丢失。
    - **回滚（Rollback）**：事务执行失败（如出现异常、手动执行 `ROLLBACK`）时，事务管理器通过 **Undo Log**（回滚日志）撤销已执行的操作，恢复数据到事务执行前的状态，同时释放锁资源。

3.  **并发事务的隔离控制**
    - 事务管理器根据数据库配置的**隔离级别**（读未提交、读已提交、可重复读、串行化），通过 **锁机制** 和 **多版本并发控制（MVCC）** 来隔离并发事务，避免脏读、不可重复读、幻读等问题。
    - 示例：
      - 当隔离级别为 **串行化** 时，事务管理器会对操作的数据加表锁，强制事务串行执行；
      - 当隔离级别为 **可重复读** 时，MySQL 事务管理器会结合行锁和 MVCC，保证同一事务内多次读取数据的一致性。

4.  **分布式事务的协调（分布式事务管理器特有）**
    在分布式系统中（如微服务架构），一个业务操作可能涉及多个数据库或服务，此时需要**分布式事务管理器**来协调跨节点的事务，核心协议包括：
    - **2PC（两阶段提交）**：分为准备阶段（Prepare）和提交阶段（Commit），协调者（事务管理器）确保所有参与者要么都提交，要么都回滚。
    - **TCC（补偿事务）**：分为 Try（资源检查与预留）、Confirm（确认操作）、Cancel（补偿回滚）三个阶段。
    - **SAGA 模式**：将分布式事务拆分为多个本地事务，通过正向操作和反向补偿操作保证最终一致性。


常见的事务管理器实例
| **应用场景** | **事务管理器** | **核心特点** |
|--------------|----------------|--------------|
| 关系型数据库 | MySQL InnoDB 事务管理器 | 内置在存储引擎中，支持行锁、MVCC，默认隔离级别为可重复读 |
| Java 应用开发 | Spring TransactionManager | 抽象事务管理接口，实现包括 `DataSourceTransactionManager`（本地事务）、`JtaTransactionManager`（分布式事务） |
| 分布式微服务 | Seata | 开源分布式事务框架，支持 AT、TCC、SAGA、XA 四种模式 |
| 大型企业级系统 | Oracle Tuxedo | 支持分布式事务的中间件，基于 XA 协议 |

事务管理器的工作流程（本地事务示例）
1.  应用程序调用 `BEGIN` 开启事务，事务管理器创建事务并分配 `TxID`。
2.  应用程序执行增删改查操作，事务管理器记录操作到 Undo Log/Redo Log，并根据隔离级别加锁。
3.  应用程序调用 `COMMIT`：
    - 事务管理器将 Redo Log 刷入磁盘，确保修改持久化；
    - 释放所有锁资源；
    - 标记事务为已提交。
4.  若执行过程中出现异常，调用 `ROLLBACK`：
    - 事务管理器通过 Undo Log 撤销已执行的修改；
    - 释放锁资源；
    - 标记事务为已回滚。

---
Spring DataSourceTransactionManager 实战配置步骤

`DataSourceTransactionManager` 是 Spring 框架中**本地事务**的核心实现（对应单一数据源场景），用于管理基于 JDBC 数据源的事务，自动协调事务的提交、回滚，无需手动编写 `BEGIN`/`COMMIT`/`ROLLBACK` 语句，极大简化了事务开发。

以下是完整的实战配置步骤，涵盖「XML 配置」和「注解驱动配置」（主流推荐注解方式），适配 Spring Boot 及传统 Spring 项目。

前置准备：引入核心依赖

首先需要引入 Spring 事务相关依赖和数据源依赖，以 Maven 为例（Spring Boot 项目可简化依赖）：

1. Spring Boot 项目（推荐，自动配置简化）
```xml
<!-- Spring Boot 核心依赖（已包含事务相关组件） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- Spring Boot JDBC 依赖（整合数据源和事务管理器） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
<!-- 数据库驱动（以 MySQL 为例） -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.30</version>
    <scope>runtime</scope>
</dependency>
<!-- 连接池（Spring Boot 默认使用 HikariCP，无需额外引入） -->
```


核心配置：DataSourceTransactionManager

方式 1：注解驱动配置（Spring Boot/纯注解，主流推荐）

配置数据源（application.yml / 配置类）

（1）Spring Boot 项目：application.yml 配置数据源

直接在配置文件中配置数据源信息，Spring Boot 会自动创建 `DataSource` 实例：
```yaml
spring:
  # 数据源配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    # 连接池配置（HikariCP）
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
  # 事务相关配置（可选，默认即可）
  transaction:
    # 事务超时时间，单位秒
    timeout: 30
    # 是否开启事务日志
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```
（2）手动配置数据源 + 事务管理器（@Configuration 注解类）

若需要自定义数据源（如 Druid），或手动控制事务管理器，创建配置类：
```java
import com.alibaba.druid.pool.DruidDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

/**
 * 事务管理器配置类
 * @EnableTransactionManagement：开启注解驱动的事务管理（核心注解）
 *  - Spring Boot 项目中，若引入 spring-boot-starter-jdbc/MyBatis，会自动开启，可省略该注解
 */
@Configuration
@EnableTransactionManagement
public class TransactionConfig {

    // 1. 配置数据源（Druid 示例）
    @Bean
    public DataSource druidDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        // 连接池参数配置
        dataSource.setMaxActive(10);
        dataSource.setMinIdle(2);
        return dataSource;
    }

    // 2. 配置 DataSourceTransactionManager（核心 Bean）
    // PlatformTransactionManager 是 Spring 事务管理器的顶级接口，DataSourceTransactionManager 是其本地事务实现
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        // 传入数据源，事务管理器通过数据源协调 JDBC 事务
        return new DataSourceTransactionManager(dataSource);
    }
}
```

2. 开启事务：@Transactional 注解（业务层使用）
在需要事务管理的**业务方法**或**类**上添加 `@Transactional` 注解，Spring 会自动通过 `DataSourceTransactionManager` 管理事务：
```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    // 注入 DAO 层
    private final UserMapper userMapper;

    // 构造器注入
    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * @Transactional：标记该方法需要事务管理
     *  - 默认：运行时异常（RuntimeException）触发回滚，检查型异常不触发回滚
     *  - 可通过 rollbackFor = Exception.class 指定所有异常都回滚
     */
    @Transactional(rollbackFor = Exception.class)
    public void transferMoney(String fromUserId, String toUserId, Double amount) {
        // 1. 转出账户扣钱
        userMapper.deductMoney(fromUserId, amount);
        
        // 模拟异常（测试事务回滚）
        // int i = 1 / 0;
        
        // 2. 转入账户加钱
        userMapper.addMoney(toUserId, amount);
        
        // 若无异常，事务自动提交；若有异常，事务自动回滚
    }
}
```

方式 2：XML 配置（传统 Spring 项目）

若项目使用 XML 配置方式，步骤如下：
1.  **配置数据源**
2.  **配置 DataSourceTransactionManager**
3.  **开启事务注解驱动**
4.  **业务层使用 @Transactional**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:tx="http://www.springframework.org/schema/tx"
       xsi:schemaLocation="
        http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/tx
        http://www.springframework.org/schema/tx/spring-tx.xsd">

    <!-- 1. 配置 Druid 数据源 -->
    <bean id="druidDataSource" class="com.alibaba.druid.pool.DruidDataSource">
        <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"/>
        <property name="username" value="root"/>
        <property name="password" value="123456"/>
        <property name="maxActive" value="10"/>
        <property name="minIdle" value="2"/>
    </bean>

    <!-- 2. 配置 DataSourceTransactionManager（核心 Bean） -->
    <bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <!-- 注入数据源，必须指定 -->
        <property name="dataSource" ref="druidDataSource"/>
    </bean>

    <!-- 3. 开启注解驱动的事务管理，绑定事务管理器 -->
    <tx:annotation-driven transaction-manager="transactionManager"/>

</beans>
```

关键注意事项
1.  **注解生效条件**
    - `@Transactional` 注解只能作用在 **public 方法**上（Spring AOP 底层限制，非 public 方法无法被代理，注解失效）。
    - 事务方法不能被**同类内部调用**（如 `methodA()` 调用同类 `@Transactional` 的 `methodB()`，代理失效，事务不生效）。
2.  **回滚规则配置**
    - 默认：仅对 `RuntimeException`（运行时异常）和 `Error` 触发回滚，对 `Exception`（检查型异常，如 `IOException`）不回滚。
    - 自定义回滚：`@Transactional(rollbackFor = Exception.class)`（所有异常回滚），`@Transactional(noRollbackFor = NullPointerException.class)`（指定异常不回滚）。
3.  **隔离级别与传播行为**
    - 可通过 `@Transactional` 注解配置事务隔离级别（对应数据库隔离级别）：
      ```java
      // 配置隔离级别为可重复读，超时时间 10 秒
      @Transactional(isolation = Isolation.REPEATABLE_READ, timeout = 10)
      ```
    - 传播行为（多事务方法嵌套时的行为，如 `REQUIRED`（默认）、`SUPPORTS` 等）：
      ```java
      // 若当前存在事务，则加入该事务；若不存在，则创建新事务（默认值）
      @Transactional(propagation = Propagation.REQUIRED)
      ```
4.  **单一数据源限制**
    - `DataSourceTransactionManager` 仅支持 **单一数据源**的本地事务，若涉及多数据源/分布式事务，需使用 `JtaTransactionManager` 或 Seata 等分布式事务框架。

验证事务是否生效
1.  在业务方法中手动添加异常（如 `int i = 1 / 0;`）。
2.  执行方法后，查看数据库数据：若转出和转入操作都未生效（数据回滚），说明事务配置成功；若只有转出生效、转入未生效，说明事务未生效。


##### 数据源配置

Spring Boot 数据源配置，涵盖**默认自动配置**（快速上手）和**自定义配置**（灵活扩展，如 Druid 连接池），同时支持配置文件（YAML/Properties）和 Java 配置类两种方式，适配主流业务场景。

前置准备：引入核心依赖

Spring Boot 对数据源提供自动配置支持，核心依赖为 `spring-boot-starter-jdbc`（默认整合 HikariCP 连接池），结合数据库驱动即可快速启用。

1.  默认 HikariCP 连接池（Spring Boot 推荐，无需额外引入）
```xml
<!-- Spring Boot JDBC 核心依赖（内置 HikariCP 连接池） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
<!-- MySQL 数据库驱动（根据数据库类型替换，如 Oracle、PostgreSQL） -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.30</version>
    <scope>runtime</scope>
</dependency>
```

2.  自定义连接池（以 Druid 为例，主流生产环境选择）
若需使用 Druid 连接池（提供监控、防SQL注入等额外功能），引入 Druid Spring Boot  Starter：
```xml
<!-- Druid Spring Boot 自动配置依赖 -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.16</version>
</dependency>
<!-- MySQL 驱动（同上） -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.30</version>
    <scope>runtime</scope>
</dependency>
```

方式 1：配置文件配置（主流推荐，简洁高效）

Spring Boot 支持 `application.yml`（推荐）和 `application.properties` 两种配置文件，核心是通过 `spring.datasource` 前缀配置数据源信息。

1.  默认 HikariCP 连接池配置（application.yml）
```yaml
spring:
  # 数据源核心配置
  datasource:
    # 数据库驱动类（MySQL 8.x 为 com.mysql.cj.jdbc.Driver，5.x 为 com.mysql.jdbc.Driver）
    driver-class-name: com.mysql.cj.jdbc.Driver
    # 数据库连接URL（test_db 为数据库名，需提前创建；serverTimezone=Asia/Shanghai 解决时区问题）
    url: jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowMultiQueries=true
    # 数据库用户名
    username: root
    # 数据库密码
    password: 123456
    # HikariCP 连接池专属配置（可选，默认值可满足基础需求，生产环境建议自定义）
    hikari:
      maximum-pool-size: 20        # 连接池最大连接数
      minimum-idle: 5              # 最小空闲连接数
      idle-timeout: 300000         # 空闲连接超时时间（毫秒，默认600000）
      connection-timeout: 30000    # 连接获取超时时间（毫秒，默认30000）
      max-lifetime: 1800000        # 连接最大存活时间（毫秒，默认1800000）
      pool-name: HikariTestPool    # 连接池名称
```

2.  Druid 连接池配置（application.yml）

Druid 可直接复用 `spring.datasource` 前缀，同时通过 `spring.datasource.druid` 配置专属属性：
```yaml
spring:
  datasource:
    # 核心配置（与 HikariCP 一致）
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    # Druid 专属配置（必配，开启 Druid 特性）
    druid:
      # 连接池基础配置
      initial-size: 5              # 初始化连接数
      min-idle: 5                  # 最小空闲连接数
      max-active: 20               # 最大活跃连接数
      max-wait: 60000              # 获取连接时的最大等待时间（毫秒）
      time-between-eviction-runs-millis: 60000  # 两次空闲连接检测的时间间隔（毫秒）
      min-evictable-idle-time-millis: 300000    # 连接最小空闲时间（毫秒）
      # 连接有效性检测
      validation-query: SELECT 1 FROM DUAL      # 检测连接是否有效的SQL
      test-while-idle: true                     # 空闲时检测连接有效性
      test-on-borrow: false                     # 获取连接时不检测（提升性能）
      test-on-return: false                     # 归还连接时不检测（提升性能）
      # 开启PSCache（预编译语句缓存）
      pool-prepared-statements: true
      max-pool-prepared-statement-per-connection-size: 20
      # 配置监控统计拦截的filters（stat：监控统计，wall：防SQL注入，log4j2：日志）
      filters: stat,wall,log4j2
      # 监控页面配置（访问 http://localhost:8080/druid 即可进入监控页面）
      stat-view-servlet:
        enabled: true
        url-pattern: /druid/*
        login-username: admin       # 监控页面登录用户名
        login-password: 123456      # 监控页面登录密码
        reset-enable: false         # 禁止重置监控数据
```

3.  application.properties 格式（兼容老项目）
以上 YAML 配置可转换为 Properties 格式，示例（HikariCP）：
```properties
# 核心数据源配置
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=123456

# HikariCP 连接池配置
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.connection-timeout=30000
```

方式 2：Java 配置类配置（自定义灵活，适配复杂场景）

当配置文件无法满足需求（如动态数据源、多数据源）时，可通过 `@Configuration` 注解类手动配置数据源，Spring Boot 会优先加载自定义配置。

1.  自定义 HikariCP 数据源配置
```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;

/**
 * 手动配置 HikariCP 数据源
 */
@Configuration
public class HikariDataSourceConfig {

    // 配置 HikariCP 数据源 Bean
    @Bean
    public DataSource hikariDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        // 核心配置
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        // 连接池配置
        dataSource.setMaximumPoolSize(20);
        dataSource.setMinimumIdle(5);
        dataSource.setIdleTimeout(300000);
        dataSource.setConnectionTimeout(30000);
        dataSource.setPoolName("HikariCustomPool");
        return dataSource;
    }

    // 配置事务管理器（可选，Spring Boot 会自动配置，手动配置可自定义）
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

2.  自定义 Druid 数据源配置
```java
import com.alibaba.druid.pool.DruidDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.sql.SQLException;

/**
 * 手动配置 Druid 数据源
 */
@Configuration
public class DruidDataSourceConfig {

    @Bean
    public DataSource druidDataSource() throws SQLException {
        DruidDataSource dataSource = new DruidDataSource();
        // 核心配置
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        // 连接池配置
        dataSource.setInitialSize(5);
        dataSource.setMinIdle(5);
        dataSource.setMaxActive(20);
        dataSource.setMaxWait(60000);
        dataSource.setTimeBetweenEvictionRunsMillis(60000);
        dataSource.setMinEvictableIdleTimeMillis(300000);
        // 连接有效性检测
        dataSource.setValidationQuery("SELECT 1 FROM DUAL");
        dataSource.setTestWhileIdle(true);
        dataSource.setTestOnBorrow(false);
        dataSource.setTestOnReturn(false);
        // 开启 PSCache 和配置过滤器
        dataSource.setPoolPreparedStatements(true);
        dataSource.setMaxPoolPreparedStatementPerConnectionSize(20);
        dataSource.setFilters("stat,wall,log4j2");
        return dataSource;
    }

    // 事务管理器配置
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```
关键注意事项
1.  **驱动类版本兼容**
    - MySQL 8.x 驱动类：`com.mysql.cj.jdbc.Driver`（必须指定时区 `serverTimezone=Asia/Shanghai`）。
    - MySQL 5.x 驱动类：`com.mysql.jdbc.Driver`（无需指定时区，可省略该参数）。
2.  **连接池默认规则**
    - Spring Boot 2.x 及以上版本，**默认连接池为 HikariCP**（性能最优，无需额外配置）。
    - 若项目中引入 Druid 依赖，Spring Boot 会自动识别并优先使用 Druid 连接池（Druid Starter 自动配置）。
3.  **数据源生效验证**
    可通过注入 `DataSource` 查看实例类型，验证配置是否生效：
    ```java
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.boot.CommandLineRunner;
    import org.springframework.boot.SpringApplication;
    import org.springframework.boot.autoconfigure.SpringBootApplication;
    import org.springframework.j【dbc.datasource.DataSource;

    @SpringBootApplication
    public class DataSourceDemoApplication implements CommandLineRunner {

        @Autowired
        private DataSource dataSource;

        public static void main(String[] args) {
            SpringApplication.run(DataSourceDemoApplication.class, args);
        }

        @Override
        public void run(String... args) throws Exception {
            // 打印数据源类型，验证是否为 HikariCP 或 Druid
            System.out.println("当前数据源类型：" + dataSource.getClass().getName());
        }
    }
    ```
4.  **多数据源配置**
    若需配置多数据源（如主从库、多业务库），可通过手动创建多个 `DataSource` Bean，并指定 `@Primary` 标记默认数据源，配合 `@Qualifier` 注入指定数据源（后续可单独展开）。

常见问题排查
1.  **连接超时**：检查 `url` 中的主机地址、端口是否正确，数据库服务是否启动，防火墙是否开放对应端口。
2.  **用户名/密码错误**：验证 `username` 和 `password` 是否与数据库配置一致。
3.  **驱动类找不到**：检查依赖是否引入，驱动版本与数据库版本是否兼容。
4.  **Druid 监控页面无法访问**：确保 `stat-view-servlet.enabled=true`，且项目端口未被占用，访问路径为 `http://IP:端口/druid`。 

---------
除了配置文件（`application.yml`/`application.properties`），Spring Boot 中还支持多种灵活的数据源配置方式，适配不同场景（如动态配置、多数据源、复杂定制等），核心方式如下：

核心方式：Java 配置类手动配置（最常用）

这是替代配置文件的主流方式，通过 `@Configuration` 注解类手动创建 `DataSource` Bean，完全掌控数据源的配置细节，支持所有连接池（HikariCP、Druid、C3P0 等）。

1.  基础手动配置（单一数据源）

适用于需要自定义数据源参数、连接池类型的场景，Spring Boot 会优先加载该自定义 Bean，忽略配置文件中的默认数据源配置。

示例 1：自定义 HikariCP 数据源
```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Java 配置类手动配置数据源（替代配置文件）
 */
@Configuration
public class DataSourceManualConfig {

    // 手动创建 DataSource Bean，无需配置文件指定 spring.datasource
    @Bean
    public DataSource dataSource() {
        HikariDataSource hikariDataSource = new HikariDataSource();
        // 核心数据库配置（硬编码，可后续结合外部配置优化）
        hikariDataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        hikariDataSource.setJdbcUrl("jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai");
        hikariDataSource.setUsername("root");
        hikariDataSource.setPassword("123456");
        // 连接池自定义配置
        hikariDataSource.setMaximumPoolSize(20);
        hikariDataSource.setMinimumIdle(5);
        hikariDataSource.setConnectionTimeout(30000);
        hikariDataSource.setPoolName("CustomHikariPool");
        return hikariDataSource;
    }
}
```

示例 2：自定义 Druid 数据源
```java
import com.alibaba.druid.pool.DruidDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.SQLException;

@Configuration
public class DruidDataSourceManualConfig {

    @Bean
    public DataSource druidDataSource() throws SQLException {
        DruidDataSource druidDataSource = new DruidDataSource();
        // 核心配置
        druidDataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        druidDataSource.setUrl("jdbc:mysql://localhost:3306/test_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai");
        druidDataSource.setUsername("root");
        druidDataSource.setPassword("123456");
        // 连接池专属配置
        druidDataSource.setInitialSize(5);
        druidDataSource.setMaxActive(20);
        druidDataSource.setMinIdle(5);
        druidDataSource.setMaxWait(60000);
        // 开启监控和防SQL注入
        druidDataSource.setFilters("stat,wall");
        return druidDataSource;
    }
}
```

2.  多数据源配置（Java 配置类专属优势）
当业务需要连接多个数据库（如主从库、多业务库）时，只能通过 Java 配置类实现，通过 `@Primary` 标记默认数据源，`@Qualifier` 指定注入数据源。

```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class MultiDataSourceConfig {

    // 主数据源：标记 @Primary，作为默认数据源
    @Primary
    @Bean("masterDataSource")
    public DataSource masterDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/master_db?serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        dataSource.setMaximumPoolSize(15);
        return dataSource;
    }

    // 从数据源：自定义 Bean 名称
    @Bean("slaveDataSource")
    public DataSource slaveDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/slave_db?serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        dataSource.setMaximumPoolSize(10);
        return dataSource;
    }
}
```

使用时通过 `@Qualifier` 指定数据源：
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MultiDbService {

    // 注入主数据源对应的 JdbcTemplate
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 注入从数据源对应的 JdbcTemplate
    @Autowired
    @Qualifier("slaveDataSource")
    private JdbcTemplate slaveJdbcTemplate;
}
```

优化方式：Java 配置类 + 外部配置源（避免硬编码）

上述 Java 配置类存在硬编码问题（数据库地址、密码写死在代码中），可结合 **外部配置源** 优化，既保留手动配置的灵活性，又实现配置解耦。

1.  结合 `@Value` 注解（读取配置文件/环境变量）
通过 `@Value` 读取 `application.yml`/`application.properties` 中的配置，或系统环境变量、命令行参数，避免硬编码。

```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceValueConfig {

    // 从配置文件读取参数（也可读取环境变量：@Value("${MYSQL_URL}")）
    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")
    private int maxPoolSize;

    @Bean
    public DataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName(driverClassName);
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setMaximumPoolSize(maxPoolSize);
        return dataSource;
    }
}
```
2.  结合 `@ConfigurationProperties` 注解（批量绑定配置）

当配置参数较多时，`@Value` 注解过于繁琐，可通过 `@ConfigurationProperties` 批量绑定配置前缀对应的参数，自动注入到实体类中。

```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourcePropertiesConfig {

    // 批量绑定 spring.datasource.hikari 前缀的配置
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.hikari")
    public HikariDataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        // 核心配置（spring.datasource 前缀）可手动绑定或自动绑定
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        return dataSource;
    }
}
```

对应的 `application.yml` 配置：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test_db?serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      pool-name: PropertiesHikariPool
```

高级方式：动态数据源配置（运行时切换/加载）

适用于需要在运行时动态修改数据源、切换数据库（如多租户系统、动态数据源路由）的场景，需自定义 `AbstractRoutingDataSource` 实现类。

核心步骤：
1.  自定义动态数据源，继承 `AbstractRoutingDataSource`，重写 `determineCurrentLookupKey` 方法（指定当前数据源标识）；
2.  通过 Java 配置类初始化多个目标数据源，注入到动态数据源中；
3.  通过 ThreadLocal 存储当前数据源标识，实现运行时切换。

示例：自定义动态数据源
```java
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

/**
 * 动态数据源：根据 ThreadLocal 中的标识切换数据源
 */
public class DynamicDataSource extends AbstractRoutingDataSource {

    // 存储当前线程对应的数据源标识
    private static final ThreadLocal<String> DATA_SOURCE_KEY = new ThreadLocal<>();

    // 设置当前数据源标识
    public static void setDataSourceKey(String dataSourceKey) {
        DATA_SOURCE_KEY.set(dataSourceKey);
    }

    // 清除当前数据源标识
    public static void clearDataSourceKey() {
        DATA_SOURCE_KEY.remove();
    }

    // 核心方法：返回当前要使用的数据源标识
    @Override
    protected Object determineCurrentLookupKey() {
        return DATA_SOURCE_KEY.get();
    }
}
```

配置动态数据源
```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DynamicDataSourceConfig {

    // 主数据源
    @Bean("masterDataSource")
    public DataSource masterDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/master_db?serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        return dataSource;
    }

    // 从数据源
    @Bean("slaveDataSource")
    public DataSource slaveDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/slave_db?serverTimezone=Asia/Shanghai");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        return dataSource;
    }

    // 动态数据源（作为默认数据源）
    @Primary
    @Bean("dynamicDataSource")
    public DataSource dynamicDataSource() {
        DynamicDataSource dynamicDataSource = new DynamicDataSource();
        // 配置默认数据源
        dynamicDataSource.setDefaultTargetDataSource(masterDataSource());
        // 配置所有目标数据源（key 为数据源标识，与 ThreadLocal 中的值对应）
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("master", masterDataSource());
        targetDataSources.put("slave", slaveDataSource());
        dynamicDataSource.setTargetDataSources(targetDataSources);
        return dynamicDataSource;
    }
}
```

运行时切换数据源
```java
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.annotation.Resource;

@Service
public class DynamicDbService {

    @Resource
    private JdbcTemplate jdbcTemplate;

    public void queryData() {
        // 1. 使用从数据源查询
        DynamicDataSource.setDataSourceKey("slave");
        jdbcTemplate.queryForList("SELECT * FROM user");

        // 2. 切换到主数据源操作
        DynamicDataSource.setDataSourceKey("master");
        jdbcTemplate.update("INSERT INTO user (name) VALUES (?)", "test");

        // 3. 清除数据源标识
        DynamicDataSource.clearDataSourceKey();
    }
}
```

特殊方式：读取外部配置源（非应用配置文件）

除了应用内置的 `application.yml`，还可以读取外部配置文件或远程配置中心的配置，再通过 Java 配置类加载为数据源。

1.  读取外部本地配置文件（如 `config/datasource.properties`）
```java
import com.alibaba.druid.pool.DruidDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;

import javax.annotation.Resource;
import javax.sql.DataSource;
import java.sql.SQLException;

// 加载外部配置文件
@Configuration
@PropertySource(value = "file:config/datasource.properties", encoding = "UTF-8")
public class ExternalFileDataSourceConfig {

    @Resource
    private Environment environment;

    @Bean
    public DataSource dataSource() throws SQLException {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName(environment.getProperty("datasource.driver-class-name"));
        dataSource.setUrl(environment.getProperty("datasource.url"));
        dataSource.setUsername(environment.getProperty("datasource.username"));
        dataSource.setPassword(environment.getProperty("datasource.password"));
        return dataSource;
    }
}
```

2.  读取远程配置中心（Nacos/Apollo）

在分布式系统中，可将数据源配置存储在 Nacos、Apollo 等配置中心，Spring Boot 通过对应客户端依赖读取配置，再结合 Java 配置类或 `@ConfigurationProperties` 绑定为数据源（无需本地配置文件）。

示例（Nacos 配置中心）
1.  引入 Nacos 依赖：
```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```
2.  配置 Nacos 地址（`bootstrap.yml`）：
```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        data-id: datasource-config.yaml
        group: DEFAULT_GROUP
        file-extension: yaml
```
3.  Nacos 上配置 `datasource-config.yaml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test_db?serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    hikari:
      maximum-pool-size: 20
```
4.  直接通过 Java 配置类或自动配置加载数据源即可。


除了内置配置文件，Spring Boot 数据源配置的核心方式可归纳为：
1.  **Java 配置类手动配置**：最常用，支持单一/多数据源，完全自定义；
2.  **Java 配置 + 外部配置源**（`@Value`/`@ConfigurationProperties`）：避免硬编码，解耦配置与代码；
3.  **动态数据源配置**（继承 `AbstractRoutingDataSource`）：运行时切换数据源，适配多租户、主从等场景；
4.  **读取外部配置源**：外部本地文件、Nacos/Apollo 远程配置中心，适配分布式/配置统一管理场景。

##### 事务同步机制
Spring 事务同步机制（Transaction Synchronization）

核心是 **Spring 提供的一种扩展机制**，允许开发者在事务的关键生命周期节点（如提交前、提交后、回滚后等）插入自定义逻辑，且这些逻辑能与事务状态保持一致，最终保障业务操作与事务的原子性（要么一起成功，要么一起回滚）。

这种机制广泛应用于需要“事务联动”的场景（如事务提交后发送消息、记录日志、清理缓存，事务回滚时撤销缓存更新等），底层依托 `TransactionSynchronization` 接口和 `TransactionSynchronizationManager` 管理器实现。

一、 核心组件
1.  核心接口：`TransactionSynchronization`

这是事务同步的核心接口，定义了事务生命周期各节点的回调方法，开发者通过实现该接口，自定义需要联动的业务逻辑。核心回调方法（按执行顺序排序）：
| 回调方法                | 触发时机                                  | 核心用途                                  |
|-------------------------|-------------------------------------------|-------------------------------------------|
| `suspend()`             | 事务被挂起时（如嵌套事务切换时）          | 暂停当前同步逻辑，释放相关资源            |
| `resume()`              | 事务被恢复时（挂起的事务重新激活时）      | 恢复之前暂停的同步逻辑，重新绑定资源      |
| `beforeCommit(boolean readOnly)` | 事务**提交前**（此时事务仍可回滚，仅在提交流程中触发） | 执行需要在提交前完成的核心校验/预处理（如数据一致性检查） |
| `beforeCompletion()`    | 事务完成前（提交/回滚前都会触发，最终执行） | 执行通用的清理操作（无论事务成功或失败，都会执行） |
| `afterCommit()`         | 事务**提交成功后**（仅事务正常提交时触发） | 执行事务成功后的联动操作（如发送MQ消息、更新缓存、记录业务日志） |
| `afterCompletion(int status)` | 事务**最终完成后**（提交成功/回滚失败后都会触发） | 执行最终的资源清理操作（如释放数据库连接、删除临时文件），可通过 `status` 判断事务状态 |
| `flush()`               | 事务刷新时（如调用 `TransactionStatus.flush()`） | 刷新缓存或待执行的操作队列                |

关键说明：
- `afterCommit()` 仅在事务**成功提交**后执行，若事务回滚，该方法不会触发；
- `afterCompletion()` 是**最终回调**（必执行），通过 `status` 参数可区分事务状态：`STATUS_COMMITTED`（提交成功）、`STATUS_ROLLED_BACK`（回滚失败）、`STATUS_UNKNOWN`（状态未知）；
- `beforeCommit()` 传入 `readOnly` 参数，可判断当前事务是否为只读事务，避免在只读事务中执行写操作。

2.  管理器：`TransactionSynchronizationManager`

这是事务同步的核心管理类，负责维护当前线程的事务同步上下文，核心功能包括：
1.  **绑定事务与线程**：通过 `ThreadLocal` 存储当前线程的事务信息（事务标识、同步器列表、数据源等），确保同一线程内的事务与同步逻辑一一对应；
2.  **管理同步器列表**：维护一个 `List<TransactionSynchronization>`，用于存储当前事务对应的所有同步器实例；
3.  **提供核心操作方法**：
    - `registerSynchronization(TransactionSynchronization sync)`：注册自定义同步器到当前事务；
    - `isSynchronizationActive()`：判断当前线程是否存在活跃的事务同步（即是否处于事务中）；
    - `getResource(Object key)`/`bindResource(Object key, Object value)`：绑定/获取当前事务的关联资源（如数据源、连接）。

二、 核心工作原理

事务同步机制是**依托事务生命周期的回调触发机制**，与事务管理器紧密协作，核心流程如下：
1.  **初始化阶段**：当事务通过 `@Transactional` 或编程式事务开启后，`TransactionSynchronizationManager` 会初始化当前线程的事务上下文，标记同步功能为“活跃状态”；
2.  **注册同步器**：开发者通过 `TransactionSynchronizationManager.registerSynchronization(...)` 方法，将自定义 `TransactionSynchronization` 实现类注册到当前事务的同步器列表中；
3.  **事务生命周期回调**：事务管理器在执行事务提交/回滚流程时，会按固定顺序触发同步器列表中所有实例的对应回调方法：
    -  **事务提交流程**：开启事务 → 执行业务逻辑 → 注册同步器 → `beforeCommit(...)` → `beforeCompletion(...)` → 执行事务提交（持久化数据） → `afterCommit(...)` → `afterCompletion(STATUS_COMMITTED)` → 事务结束；
    -  **事务回滚流程**：开启事务 → 执行业务逻辑 → 注册同步器 → （触发异常） → `beforeCompletion(...)` → 执行事务回滚（恢复数据） → `afterCompletion(STATUS_ROLLED_BACK)` → 事务结束；
4.  **清理阶段**：事务结束后，`TransactionSynchronizationManager` 会清理当前线程的事务上下文（解绑 `ThreadLocal` 资源），释放同步器列表。

关键特性：**同步逻辑与事务原子性一致**
- 若同步器的 `beforeCommit()` 中抛出异常，会触发事务回滚，确保预处理逻辑失败时，事务不会提交；
- `afterCommit()` 仅在事务提交成功后执行，避免“事务回滚，但联动操作已执行”的不一致问题（如避免“订单回滚，但支付消息已发送”）；
- `afterCompletion()` 必执行，确保无论事务成败，都能清理资源，避免内存泄漏。

三、 两种使用方式
1.  编程式使用（灵活可控，推荐复杂场景）

直接通过 `TransactionSynchronizationManager` 注册自定义同步器，步骤清晰，适配需要动态控制同步逻辑的场景。

示例：事务提交后发送MQ消息，回滚时不发送
```java
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.annotation.Resource;

@Service
public class OrderService {

    @Resource
    private JdbcTemplate jdbcTemplate;
    // 模拟MQ发送客户端
    @Resource
    private MqClient mqClient;

    /**
     * 编程式事务 + 事务同步：创建订单后发送MQ消息
     */
    public void createOrder(String orderNo, Double amount) {
        // 1. 开启编程式事务（若使用@Transactional注解，可省略手动开启，直接注册同步器）
        // 此处省略事务开启代码（可通过 PlatformTransactionManager 手动开启）
        try {
            // 2. 执行业务逻辑（插入订单）
            jdbcTemplate.update("INSERT INTO t_order (order_no, amount) VALUES (?, ?)", orderNo, amount);

            // 3. 注册事务同步器（判断当前是否存在活跃事务）
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    // 事务提交成功后，发送MQ消息
                    @Override
                    public void afterCommit() {
                        mqClient.send("order_topic", "订单创建成功：" + orderNo);
                        System.out.println("事务提交成功，已发送MQ消息");
                    }

                    // 事务完成后（无论成败），清理资源
                    @Override
                    public void afterCompletion(int status) {
                        if (status == STATUS_ROLLED_BACK) {
                            System.out.println("事务回滚，未发送MQ消息，清理临时资源");
                        }
                    }

                    // 事务提交前，做数据校验
                    @Override
                    public void beforeCommit(boolean readOnly) {
                        // 校验订单金额是否合法
                        if (amount <= 0) {
                            throw new RuntimeException("订单金额非法，触发事务回滚");
                        }
                    }
                });
            }
        } catch (Exception e) {
            // 触发事务回滚
            throw new RuntimeException("创建订单失败，事务回滚", e);
        }
    }
}
```

2.  注解式简化使用（基于 `@Transactional`，适配简单场景）

若使用 `@Transactional` 注解开启声明式事务，可直接在业务方法内注册同步器，无需手动管理事务生命周期，简化开发。

示例：注解式事务 + 同步器
```java
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.annotation.Resource;

@Service
public class UserService {

    @Resource
    private JdbcTemplate jdbcTemplate;

    /**
     * 声明式事务 + 事务同步：更新用户信息后清理缓存
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(Long userId, String userName) {
        // 1. 执行业务逻辑（更新用户名称）
        jdbcTemplate.update("UPDATE t_user SET user_name = ? WHERE user_id = ?", userName, userId);

        // 2. 注册事务同步器，事务提交后清理缓存
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // 清理用户缓存（仅事务提交成功后执行）
                CacheManager.del("user:" + userId);
                System.out.println("用户信息更新成功，已清理缓存");
            }

            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    System.out.println("用户信息更新失败，事务回滚，缓存未清理");
                }
            }
        });

        // 模拟异常（测试回滚）
        // int i = 1 / 0;
    }
}
```
四、 典型应用场景
1.  **事务提交后发送消息**：订单创建、支付成功后发送MQ消息（避免事务回滚但消息已发送的不一致问题）；
2.  **事务提交后清理/更新缓存**：用户信息、商品库存更新后，清理Redis缓存（确保缓存与数据库数据一致性）；
3.  **事务提交后记录业务日志**：操作审计日志、系统运行日志（仅记录事务成功的操作，避免无效日志）；
4.  **事务回滚时撤销操作**：缓存已临时更新，事务回滚后撤销缓存更新；临时文件已创建，事务回滚后删除临时文件；
5.  **提交前数据校验**：在 `beforeCommit()` 中执行最终的数据一致性校验，校验失败则抛出异常，触发事务回滚。

五、 关键注意事项
1.  **仅对活跃事务生效**：同步器必须在**事务内部**注册（即 `TransactionSynchronizationManager.isSynchronizationActive()` 返回 `true` 时），否则注册无效，回调方法不会触发；
2.  **避免在 `afterCommit()` 中执行核心业务**：`afterCommit()` 执行时事务已提交，若该方法抛出异常，无法回滚事务，仅能捕获异常做补偿处理；
3.  **`beforeCompletion()` 与 `afterCompletion()` 的区别**：
    - `beforeCompletion()` 在事务提交/回滚**前**执行，此时数据尚未持久化/恢复，仍可通过异常触发回滚；
    - `afterCompletion()` 在事务提交/回滚**后**执行，数据已最终确定，仅用于资源清理；
4.  **与事务传播行为兼容**：同步器会跟随事务的传播行为（如 `PROPAGATION_REQUIRED` 时，同步器注册到当前事务；`PROPAGATION_REQUIRES_NEW` 时，同步器注册到新事务）。

总结

事务同步机制的核心要点可归纳为：
1.  **核心定位**：Spring 事务的扩展机制，实现业务逻辑与事务生命周期的联动；
2.  **核心组件**：`TransactionSynchronization`（回调接口） + `TransactionSynchronizationManager`（上下文管理）；
3.  **核心流程**：注册同步器 → 事务生命周期触发对应回调 → 执行自定义逻辑；
4.  **核心价值**：保障联动操作与事务的原子性，避免数据不一致；
5.  **典型场景**：提交后发消息、清理缓存，回滚后撤销操作，提交前做校验。

#### 声明式事务
##### @Transactional注解
@Transactional 注解（Spring 声明式事务）详解

`@Transactional` 是 Spring 提供的**声明式事务核心注解**，它通过 AOP（动态代理）机制实现事务管理，无需手动编写 `BEGIN`/`COMMIT`/`ROLLBACK` 代码，仅通过注解标记即可将普通方法纳入事务管控，极大简化了事务开发，是 Spring 项目中本地事务的首选使用方式。

一、 核心特性
1.  **声明式编程**：无需侵入业务逻辑，仅通过注解声明事务规则，业务代码与事务管理解耦；
2.  **AOP 底层支撑**：Spring 会为标注 `@Transactional` 的类/方法创建动态代理对象，事务的开启、提交、回滚均由代理逻辑自动完成；
3.  **默认适配本地事务**：与 `DataSourceTransactionManager` 无缝集成，支持单一数据源的 ACID 特性保障；
4.  **灵活配置**：可通过注解属性自定义事务隔离级别、传播行为、回滚规则等。

二、 基本使用
1.  注解标注位置
- **业务层方法（推荐）**：通常标注在 Service 层的业务方法上，精准管控单个业务逻辑的事务；
- **业务层类**：标注在 Service 类上时，该类中所有 public 方法都会被纳入事务管控；
- **注意**：仅对 `public` 方法生效（Spring AOP 底层限制，非 public 方法无法被代理拦截，注解失效）。

2.  基础示例（声明式事务最小配置）
```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    // 注入 DAO 层/持久层组件
    private final OrderMapper orderMapper;
    private final StockMapper stockMapper;

    // 构造器注入（Spring 推荐方式）
    public OrderService(OrderMapper orderMapper, StockMapper stockMapper) {
        this.orderMapper = orderMapper;
        this.stockMapper = stockMapper;
    }

    /**
     * 核心业务：创建订单 + 扣减库存
     * @Transactional：标记该方法需要事务管理，默认配置即可满足基础需求
     * rollbackFor = Exception.class：指定所有异常都触发回滚（默认仅运行时异常触发）
     */
    @Transactional(rollbackFor = Exception.class)
    public void createOrder(String orderNo, Long goodsId, Integer num) throws Exception {
        // 1. 扣减商品库存
        stockMapper.deductStock(goodsId, num);
        
        // 2. 创建订单
        orderMapper.insertOrder(orderNo, goodsId, num);
        
        // 若出现异常（如库存不足、数据库异常），事务自动回滚，两步操作均失效
        // 若无异常，事务自动提交，两步操作均持久化
    }
}
```

3.  开启事务注解驱动（可选）
- Spring Boot 项目：引入 `spring-boot-starter-jdbc`/`spring-boot-starter-data-jpa` 后，会**自动开启**注解驱动，无需额外配置；
- 传统 Spring 项目：需手动在配置类/XML 中开启：
  ```java
  // 配置类方式
  @Configuration
  @EnableTransactionManagement // 开启注解式事务驱动
  public class TransactionConfig {
      // 配置 DataSourceTransactionManager Bean（略）
  }
  ```
  ```xml
  <!-- XML 配置方式 -->
  <tx:annotation-driven transaction-manager="transactionManager"/>
  ```

三、 核心配置属性

`@Transactional` 提供了丰富的属性，用于自定义事务规则，常用核心属性如下：

| 属性名          | 类型                | 核心作用                                                                 | 可选值/默认值                                                                 |
|-----------------|---------------------|--------------------------------------------------------------------------|------------------------------------------------------------------------------|
| `rollbackFor`   | Class<? extends Throwable>[] | 指定触发事务回滚的异常类型（可指定多个）                                 | 任意异常类（如 `Exception.class`）；默认：`RuntimeException`、`Error`         |
| `noRollbackFor` | Class<? extends Throwable>[] | 指定不触发事务回滚的异常类型（可指定多个）                               | 任意异常类（如 `NullPointerException.class`）；默认：无                      |
| `isolation`     | Isolation           | 指定事务隔离级别（对应数据库隔离级别）                                   | 1. `DEFAULT`（默认）：继承数据库默认隔离级别（MySQL 为可重复读）<br>2. `READ_UNCOMMITTED`（读未提交）<br>3. `READ_COMMITTED`（读已提交）<br>4. `REPEATABLE_READ`（可重复读）<br>5. `SERIALIZABLE`（串行化） |
| `propagation`   | Propagation         | 指定事务传播行为（多事务方法嵌套时的事务归属规则）                       | 1. `REQUIRED`（默认）：存在事务则加入，不存在则创建新事务<br>2. `SUPPORTS`：存在事务则加入，不存在则以非事务方式执行<br>3. `REQUIRES_NEW`：无论是否存在事务，都创建新事务（原事务挂起）<br>4. `NOT_SUPPORTED`：以非事务方式执行，存在事务则挂起<br>5. `MANDATORY`：必须在事务中执行，否则抛出异常<br>6. `NEVER`：必须在非事务中执行，否则抛出异常<br>7. `NESTED`：嵌套事务（依赖数据库保存点） |
| `timeout`       | int                 | 指定事务超时时间（单位：秒），超时后事务自动回滚                         | 正整数；默认：-1（不超时，依赖数据库超时配置）                              |
| `readOnly`      | boolean             | 指定事务是否为只读事务（优化数据库性能，只读事务不允许执行写操作）       | `true`（只读）/`false`（默认，可读写）                                       |

属性使用示例
```java
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    // 自定义事务规则：可重复读隔离级别 + REQUIRED 传播行为 + 10秒超时 + 所有异常回滚
    @Transactional(
            rollbackFor = Exception.class,
            isolation = Isolation.REPEATABLE_READ,
            propagation = Propagation.REQUIRED,
            timeout = 10,
            readOnly = false
    )
    public void updateUserInfo(Long userId, String userName) {
        // 业务逻辑（略）
    }

    // 只读事务：仅查询数据，优化性能
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        // 仅执行查询操作，不执行增删改
        return userMapper.selectById(userId);
    }
}
```

四、 关键注意事项（避坑指南）
1.  **注解失效场景（核心避坑）**
    - 场景1：标注在 **非 public 方法**上（如 private/protected/default）：Spring AOP 仅拦截 public 方法，注解不生效；
    - 场景2：**同类内部方法调用**（如 `methodA()` 调用同类中 `@Transactional` 的 `methodB()`）：跳过代理对象，事务逻辑无法执行；
      ```java
      // 错误示例：同类内部调用，事务失效
      @Service
      public class TestService {
          public void methodA() {
              methodB(); // 直接调用同类方法，无代理拦截
          }

          @Transactional(rollbackFor = Exception.class)
          public void methodB() {
              // 业务操作（略）
          }
      }
      ```
    - 场景3：异常被 **手动捕获并吞掉**（未抛出异常）：Spring 无法感知异常，不会触发回滚；
      ```java
      // 错误示例：异常被捕获，事务不回滚
      @Transactional(rollbackFor = Exception.class)
      public void createOrder() {
          try {
              stockMapper.deductStock();
              orderMapper.insertOrder();
          } catch (Exception e) {
              // 仅打印异常，未抛出，事务会提交（导致数据不一致）
              System.out.println("异常信息：" + e.getMessage());
          }
      }
      ```
    - 场景4：配置了错误的 **回滚规则**（如默认规则下抛出检查型异常）：事务不回滚；
    - 场景5：数据源未配置 **事务管理器**：Spring 无法管理事务，注解失效。

2.  **回滚规则细节**
    - 默认仅对 `RuntimeException`（运行时异常，如 `NullPointerException`）和 `Error` 触发回滚；
    - 对 `Exception`（检查型异常，如 `IOException`、`SQLException`）默认不回滚，需通过 `rollbackFor = Exception.class` 显式指定；
    - `noRollbackFor` 优先级高于 `rollbackFor`，若异常同时匹配两者，以 `noRollbackFor` 为准（不回滚）。

3.  **只读事务注意**
    - `readOnly = true` 仅对可读写事务生效，用于提示数据库优化查询（如不开启写锁）；
    - 只读事务中若执行增删改操作，会抛出异常（部分数据库/持久层框架支持该校验）。

4.  **事务传播行为使用场景**
    - `REQUIRED`：最常用，适用于绝大多数业务场景（如订单创建+库存扣减）；
    - `REQUIRES_NEW`：适用于“嵌套事务独立提交/回滚”场景（如主业务失败，日志记录仍需提交）；
    - `SUPPORTS`：适用于“可选事务”场景（如查询方法，有事务则加入，无则非事务执行）；
    - `NESTED`：适用于“嵌套事务，子事务回滚不影响主事务”场景（依赖数据库保存点，仅部分数据库支持）。

五、 与编程式事务的区别
| 特性                | 声明式事务（@Transactional） | 编程式事务（PlatformTransactionManager） |
|---------------------|------------------------------|------------------------------------------|
| 开发效率            | 高（注解声明，无需手动编码）  | 低（手动编写事务开启/提交/回滚逻辑）      |
| 侵入性              | 低（业务代码与事务解耦）      | 高（事务逻辑侵入业务代码）                |
| 灵活性              | 低（配置化，动态调整有限）    | 高（可动态控制事务生命周期，支持复杂逻辑）|
| 适用场景            | 绝大多数普通业务场景（单一数据源、简单事务规则） | 复杂业务场景（动态事务、多数据源联动、自定义事务逻辑） |

总结
1.  `@Transactional` 是 Spring 声明式事务的核心，通过 AOP 实现无侵入式事务管理，优先在 Service 层 public 方法上使用；
2.  核心配置属性：`rollbackFor`（指定回滚异常）、`propagation`（传播行为）、`isolation`（隔离级别）是日常开发的重点；
3.  需规避“非 public 方法”“同类内部调用”“异常吞掉”等注解失效场景；
4.  适用于绝大多数普通业务场景，复杂场景可结合编程式事务使用。
##### 事务属性配置
Spring @Transactional 事务属性配置详解

这些属性是自定义事务规则的核心，能够精准控制事务的行为（如回滚规则、隔离级别、传播方式等），适配不同业务场景的需求。下面将逐一拆解核心属性，包含配置用途、可选值及实战示例。

核心事务属性一览

`@Transactional` 的属性分为**常用核心属性**和**小众扩展属性**，其中常用属性覆盖 90% 以上的业务场景，先通过表格快速梳理：

| 属性名          | 类型                          | 核心用途                                                                 | 默认值                                  | 优先级/备注                              |
|-----------------|-------------------------------|--------------------------------------------------------------------------|-----------------------------------------|-----------------------------------------|
| `rollbackFor`   | Class<? extends Throwable>[]  | 指定**触发事务回滚**的异常类型（可多个）                                 | 空数组（默认仅回滚 `RuntimeException`/`Error`） | 显式配置优先级高于默认规则              |
| `noRollbackFor` | Class<? extends Throwable>[]  | 指定**不触发事务回滚**的异常类型（可多个）                               | 空数组（无默认排除异常）                | 优先级高于 `rollbackFor`（两者冲突时以此为准） |
| `propagation`   | Propagation（枚举）           | 多事务方法嵌套时，指定事务的**传播行为**（归属规则）                     | `Propagation.REQUIRED`                  | 核心属性，决定事务边界                  |
| `isolation`     | Isolation（枚举）             | 指定事务的**隔离级别**（解决并发事务数据一致性问题）                     | `Isolation.DEFAULT`                     | 继承数据库默认隔离级别（MySQL 为可重复读） |
| `timeout`       | int                           | 事务**超时时间**（单位：秒），超时后自动回滚                             | -1（不超时，依赖数据库配置）            | 仅对本地事务生效，分布式事务需单独配置  |
| `readOnly`      | boolean                       | 标记事务为**只读事务**（优化数据库性能，禁止写操作）                     | `false`（可读写事务）                   | 只读事务中执行增删改会抛出异常（部分框架支持） |
| `value`/`transactionManager` | String | 指定事务管理器 Bean 名称（多事务管理器场景使用） | 空字符串（使用默认事务管理器） | 多数据源/分布式事务场景必备              |

其他常用属性配置

（1）`timeout`：事务超时时间
- 配置用途：指定事务的最大执行时间，若超过该时间事务仍未完成，Spring 会自动触发回滚，避免长事务占用数据库资源。
- 注意：单位是**秒**，默认值 -1 表示不设置超时（依赖数据库的事务超时配置，如 MySQL 默认事务超时由 `innodb_lock_wait_timeout` 控制，默认50秒）。
- 示例：`@Transactional(rollbackFor = Exception.class, timeout = 5)` // 事务5秒超时


（2）`readOnly`：只读事务
- 配置用途：标记事务为只读，数据库会对只读事务进行优化（如不开启写锁、跳过事务日志写入等），提升查询性能；同时，多数持久层框架（如 MyBatis、JPA）会禁止在只读事务中执行增删改操作，抛出异常。
- 适用场景：仅执行查询操作的方法（如列表查询、详情查询）。
- 示例：`@Transactional(readOnly = true)` // 只读事务

（3）`transactionManager`：指定事务管理器
- 配置用途：在多事务管理器场景（如多数据源、本地事务+分布式事务共存），指定当前事务使用的事务管理器 Bean 名称。
- 示例：
  ```java
  // 多数据源场景：指定主数据源的事务管理器
  @Transactional(
          rollbackFor = Exception.class,
          transactionManager = "masterTransactionManager"
  )
  public void updateMasterDbData() {
      // 操作主数据源数据
  }
  ```
  （注：`masterTransactionManager` 是自定义的 `DataSourceTransactionManager` Bean 名称）

事务属性组合配置最佳实践

日常开发中，很少单独使用某个属性，通常是组合配置，以下是两种典型场景的最佳实践：

1.  核心业务（如订单、支付）组合配置
```java
@Transactional(
        rollbackFor = Exception.class, // 所有异常回滚，保障数据一致性
        propagation = Propagation.REQUIRED, // 默认传播行为，加入/创建事务
        isolation = Isolation.REPEATABLE_READ, // 高一致性，解决脏读、不可重复读
        timeout = 10 // 10秒超时，避免长事务
)
public void coreBusiness() {
    // 核心业务逻辑
}
```

2.  只读查询业务组合配置
```java
@Transactional(
        readOnly = true, // 只读优化，禁止写操作
        isolation = Isolation.READ_COMMITTED, // 适中的隔离级别，兼顾性能和一致性
        propagation = Propagation.SUPPORTS // 可选事务，有事务则加入，无则非事务执行
)
public Object queryBusiness() {
    // 仅查询逻辑
    return null;
}
```
关键注意事项
1.  **属性生效范围**：所有事务属性仅对 `@Transactional` 标注的 `public` 方法生效，非 public 方法（private/protected/default）上的配置无效。
2.  **异常传播要求**：`rollbackFor` 指定的异常必须被**抛出**（不能被 try-catch 吞掉），否则 Spring 无法感知异常，事务不会回滚。
3.  **隔离级别依赖数据库**：`isolation` 属性的效果依赖数据库支持，如 MySQL 支持所有隔离级别，SQLite 仅支持 `SERIALIZABLE` 和 `READ_UNCOMMITTED`。
4.  **传播行为嵌套注意**：`REQUIRES_NEW` 和 `NESTED` 都支持独立回滚，但 `REQUIRES_NEW` 是两个独立事务，`NESTED` 是一个事务内的保存点，需根据业务场景选择。

总结
1.  `@Transactional` 的事务属性是控制事务行为的核心，核心属性为 `rollbackFor`（回滚规则）、`propagation`（传播行为）、`isolation`（隔离级别）；
2.  回滚规则配置优先使用 `rollbackFor = Exception.class`，避免检查型异常导致的事务不回滚问题；
3.  传播行为中，`REQUIRED` 适用于绝大多数场景，`REQUIRES_NEW` 适用于独立事务场景，`SUPPORTS` 适用于查询场景；
4.  只读事务（`readOnly = true`）和超时配置（`timeout`）是性能优化的关键，应在对应场景中合理使用；
5.  多事务管理器场景需通过 `transactionManager` 指定具体的事务管理器 Bean。

##### 回滚规则设置
1.  回滚规则配置：`rollbackFor` & `noRollbackFor`

这两个属性用于精准控制“哪些异常触发回滚，哪些异常不触发回滚”，解决默认回滚规则的局限性。

（1）`rollbackFor`：指定回滚异常

- 问题背景：Spring 默认仅对 `RuntimeException`（运行时异常，如 `NullPointerException`）和 `Error` 触发回滚，对 `Exception` 及其子类（检查型异常，如 `IOException`、`SQLException`）不回滚，导致数据不一致。
- 配置用途：显式指定任意异常类型，只要方法抛出该异常（或其子类），事务立即回滚。
- 实战示例：
  ```java
  import org.springframework.transaction.annotation.Transactional;
  import org.springframework.stereotype.Service;

  @Service
  public class OrderService {

      // 配置：所有 Exception 及其子类都触发事务回滚（覆盖默认规则）
      @Transactional(rollbackFor = Exception.class)
      public void createOrder(String orderNo, Double amount) throws Exception {
          // 业务操作：扣减库存 + 创建订单
          if (amount <= 0) {
              // 抛出检查型异常（默认不回滚，配置 rollbackFor 后强制回滚）
              throw new Exception("订单金额非法");
          }
          // 其他业务逻辑...
      }

      // 配置：指定多个异常类型都触发回滚
      @Transactional(rollbackFor = {IOException.class, SQLException.class, RuntimeException.class})
      public void batchUpdateOrder() throws IOException, SQLException {
          // 业务逻辑...
      }
  }
  ```

（2）`noRollbackFor`：指定不回滚异常

- 配置用途：即使异常符合 `rollbackFor` 或默认回滚规则，只要匹配该属性指定的异常，事务**不回滚**，继续提交。
- 优先级：高于 `rollbackFor`，若一个异常同时匹配两个属性，以 `noRollbackFor` 为准（不回滚）。
- 实战示例：
  ```java
  @Service
  public class UserService {

      // 配置：所有 Exception 都回滚，但 NullPointerException 不回滚
      @Transactional(
              rollbackFor = Exception.class,
              noRollbackFor = NullPointerException.class
      )
      public void updateUser(Long userId, String userName) {
          try {
              // 业务操作：更新用户信息
              if (userId == 1L) {
                  // 抛出空指针异常，事务不回滚（匹配 noRollbackFor）
                  throw new NullPointerException("用户名不能为空");
              }
              if (userId == 2L) {
                  // 抛出 IO 异常，事务回滚（匹配 rollbackFor，不匹配 noRollbackFor）
                  throw new IOException("文件读取失败");
              }
          } catch (Exception e) {
              throw new RuntimeException(e);
          }
      }
  }
  ```
##### 只读事务优化
Spring 只读事务（`readOnly = true`）优化详解

是 Spring 事务管理中针对**查询场景**的重要性能优化手段，通过 `@Transactional(readOnly = true)` 配置，从应用层到数据库层实现多层优化，同时规避无效写操作，兼顾性能与数据一致性。

一、 只读事务的核心优化价值
只读事务的核心作用并非“禁止写操作”（本质是优化提示），而是通过明确声明“当前事务仅执行查询操作，无增删改行为”，让 Spring 框架、持久层框架、数据库三者协同进行针对性优化，最终提升查询效率、降低资源占用。

二、 多层优化细节（从应用到数据库）
1.  Spring 框架层优化
Spring 感知到 `readOnly = true` 后，会对事务上下文进行优化：
- 跳过事务提交阶段的“重做日志（Redo Log）”刷盘准备：只读事务无数据修改，无需写入 Redo Log 保障持久性，Spring 会省略相关逻辑，减少不必要的资源开销；
- 简化事务生命周期管理：无需维护事务的“提交状态”，事务结束后仅需释放资源（如数据库连接），无需执行数据持久化相关操作；
- 配合事务传播行为（如 `SUPPORTS`）时，进一步优化：若当前无外层事务，直接以非事务方式执行，避免事务创建的开销。

2.  持久层框架层优化（MyBatis/Hibernate/JPA）
主流持久层框架会识别只读事务标识，进行针对性限制与优化：
- **禁止写操作**：在只读事务中执行 `insert`/`update`/`delete` 操作时，框架会直接抛出异常（如 Hibernate 抛出 `IllegalStateException`，MyBatis 配合 Spring 也会拦截无效写操作），从应用层规避“只读事务内修改数据”的无效操作，减少对数据库的无效请求；
- **查询优化**：
  - MyBatis：会跳过一级缓存的“写失效”判断，提升一级缓存的查询效率；
  - Hibernate/JPA：会关闭脏数据检测（Dirty Checking），无需对比实体对象的前后状态差异，减少内存计算开销，同时优先使用二级缓存提升查询性能。

3.  数据库层优化（核心优化环节）
数据库接收到只读事务的连接请求后，会进行关键性能优化，这是只读事务优化的核心价值所在：
- **锁机制优化**：不获取数据的写锁（排他锁），仅获取读锁（共享锁），减少锁竞争冲突。例如：
  - MySQL InnoDB 引擎：只读事务查询数据时，不会给数据行/表加排他锁，多个只读事务可同时读取同一数据，提升并发查询能力；若为可读写事务，即使仅执行查询，也可能因隔离级别（如可重复读）持有锁资源，导致并发性能下降；
- **事务日志优化**：跳过事务日志（Redo Log/Undo Log）的写入操作（部分数据库支持，如 MySQL、Oracle）。只读事务无数据修改，无需记录回滚日志（Undo Log）和重做日志（Redo Log），减少磁盘 I/O 开销，这是提升查询性能的关键；
- **查询执行计划优化**：数据库优化器会针对只读事务调整执行计划，优先选择高效的查询路径（如优先使用索引、跳过写相关的执行步骤），提升查询响应速度。

三、 只读事务配置实战
1.  基础配置（单一查询方法）
```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;

@Service
public class UserQueryService {

    // 基础只读事务配置：仅查询，开启多层优化
    @Transactional(readOnly = true)
    public User getUserDetail(Long userId) {
        // 仅执行查询操作：SELECT * FROM t_user WHERE user_id = ?
        return userMapper.selectById(userId);
    }
}
```

2.  最佳实践配置（兼顾性能与兼容性）
结合隔离级别和传播行为，实现最优查询效果：
```java
@Service
public class OrderQueryService {

    // 只读事务最佳配置：查询场景优先使用
    @Transactional(
            readOnly = true, // 开启只读优化
            isolation = Isolation.READ_COMMITTED, // 兼顾性能与一致性，避免不必要的锁开销
            propagation = Propagation.SUPPORTS // 有事务则加入，无事务则非事务执行，进一步降低开销
    )
    public List<OrderVO> getOrderList(Long userId, Integer pageNum, Integer pageSize) {
        // 分页查询订单：仅执行 SELECT 操作
        return orderMapper.selectOrderListByUserId(userId, (pageNum - 1) * pageSize, pageSize);
    }
}
```

3.  批量查询场景配置
```java
@Service
public class FinanceQueryService {

    // 批量只读查询：优化大量数据查询的性能
    @Transactional(readOnly = true, timeout = 30) // 批量查询可适当延长超时时间
    public List<FinanceRecord> batchQueryFinanceRecord(Long userId, LocalDateTime startTime, LocalDateTime endTime) {
        // 批量查询资金流水：无增删改操作
        return financeMapper.selectByUserIdAndTimeRange(userId, startTime, endTime);
    }
}
```

四、 关键注意事项（避坑指南）
1.  **仅对查询方法使用**：只读事务仅适用于**无任何增删改操作**的方法，若方法内包含 `insert`/`update`/`delete` 操作，会被框架/数据库拦截并抛出异常，或导致优化失效。
2.  **仅对 public 方法生效**：与 `@Transactional` 其他属性一致，`readOnly = true` 仅对 `public` 方法生效，非 public 方法（private/protected/default）的配置无效，无法触发优化。
3.  **不影响事务隔离性**：只读事务仅优化“写相关”的资源开销，不会改变事务的隔离级别。例如：配置 `isolation = Isolation.REPEATABLE_READ` + `readOnly = true`，仍能保证同一事务内多次查询结果一致。
4.  **与数据库的兼容性**：
    - 支持的数据库：MySQL（InnoDB）、Oracle、PostgreSQL 等主流关系型数据库均支持只读事务优化；
    - 不支持的数据库：部分轻量级数据库（如 SQLite）对只读事务的优化有限，仅能实现应用层/框架层的优化，无法实现数据库层的日志与锁优化。
5.  **不可替代缓存**：只读事务是对数据库查询的优化，无法替代 Redis 等缓存中间件。对于高频查询场景，应优先使用缓存，再配合只读事务优化数据库查询性能。

五、 只读事务 vs 非事务查询
| 特性                | 只读事务（`readOnly = true`） | 非事务查询（无 `@Transactional`） |
|---------------------|------------------------------|----------------------------------|
| 锁机制              | 仅获取共享锁，无锁竞争       | 随数据库隔离级别而定，可能持有锁 |
| 事务日志            | 跳过 Redo/Undo Log 写入，I/O 开销低 | 无事务日志开销（非事务模式）     |
| 框架优化            | 关闭脏检测、禁止写操作，性能更优 | 无框架层面的查询优化             |
| 数据一致性          | 遵循事务隔离级别，一致性更高 | 无事务保障，可能出现脏读等问题   |
| 适用场景            | 对一致性有要求的查询（如订单详情、资金流水） | 无一致性要求的简单查询（如公共数据查询） |

总结
1.  只读事务（`readOnly = true`）的核心价值是**多层协同优化**（Spring 框架 + 持久层 + 数据库），降低查询操作的资源开销，提升并发查询性能；
2.  核心优化点：数据库层（锁机制 + 事务日志）> 框架层（禁止写操作 + 关闭脏检测）> Spring 框架层（简化事务生命周期）；
3.  最佳实践：查询方法配置 `@Transactional(readOnly = true, isolation = READ_COMMITTED, propagation = SUPPORTS)`；
4.  避坑关键：仅对 public 只读查询方法使用，不与增删改操作混用，关注数据库兼容性。

#### 事务传播行为
1. REQUIRED（默认）
2. REQUIRES_NEW
3. NESTED
4. SUPPORTS等

事务传播行为：`propagation`

这是最核心的属性之一，用于解决**多事务方法嵌套调用**时的事务归属问题（即：新方法是否加入当前事务、是否创建新事务、是否不使用事务等）。

常用传播行为（7种枚举值，重点掌握前4种）
| 传播行为值          | 核心含义                                                                 | 适用场景                                  |
|---------------------|--------------------------------------------------------------------------|-------------------------------------------|
| `REQUIRED`（默认）  | 若当前存在事务，则加入该事务；若当前无事务，则创建新事务。               | 绝大多数业务场景（如订单+库存、支付+记账） |
| `REQUIRES_NEW`      | 无论当前是否存在事务，都创建**新事务**，原事务（若有）挂起，新事务独立提交/回滚。 | 主业务失败，附属业务仍需提交（如主业务回滚，日志记录仍需保存） |
| `SUPPORTS`          | 若当前存在事务，则加入；若当前无事务，则以**非事务方式**执行。           | 可选事务的查询方法（有事务则统一管控，无则提升性能） |
| `NOT_SUPPORTED`     | 以**非事务方式**执行，若当前存在事务，则将原事务挂起。                   | 无需事务的耗时操作（如导出报表、发送非关键消息） |
| `MANDATORY`         | 必须在一个已存在的事务中执行，否则抛出 `IllegalTransactionStateException` 异常。 | 必须依赖外层事务的核心业务（如资金扣减，必须在外层事务中执行） |
| `NEVER`             | 必须在**非事务环境**中执行，若当前存在事务，则抛出异常。                 | 明确不允许事务管控的方法（如纯查询统计） |
| `NESTED`            | 嵌套事务：若当前存在事务，则在当前事务中创建保存点，子事务回滚仅回滚到保存点（不影响主事务）；若当前无事务，则创建新事务。 | 子事务回滚不影响主事务的场景（依赖数据库保存点，仅 MySQL/PostgreSQL 支持） |

传播行为实战示例
```java
@Service
public class BusinessService {

    @Resource
    private LogService logService;

    // 主业务：REQUIRED 传播行为（默认）
    @Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRED)
    public void mainBusiness() {
        try {
            // 主业务逻辑：创建订单
            System.out.println("执行主业务：创建订单");
            // 调用附属业务：记录日志（REQUIRES_NEW 传播行为，独立事务）
            logService.recordLog("订单创建请求");
            // 模拟主业务异常，触发回滚
            int i = 1 / 0;
        } catch (Exception e) {
            throw new RuntimeException("主业务执行失败", e);
        }
    }
}

@Service
public class LogService {

    // 附属业务：REQUIRES_NEW 传播行为，独立事务
    @Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRES_NEW)
    public void recordLog(String content) {
        // 日志记录逻辑
        System.out.println("执行附属业务：记录日志 - " + content);
        // 即使主业务回滚，该方法的事务已独立提交，日志不会丢失
    }
}
```
上述示例中：主业务异常回滚，但日志记录因使用 `REQUIRES_NEW`，创建了独立事务，会正常提交，日志不会丢失。

#### 隔离级别
1. READ_UNCOMMITTED
2. READ_COMMITTED
3. REPEATABLE_READ
4. SERIALIZABLE

事务隔离级别：`isolation`
用于解决**并发事务带来的脏读、不可重复读、幻读**问题，对应数据库的四种隔离级别，Spring 通过该属性指定，最终由数据库底层实现。

隔离级别枚举值
| 隔离级别值          | 核心含义                                                                 | 解决的问题                | 性能 | 适用场景                  |
|---------------------|--------------------------------------------------------------------------|---------------------------|------|---------------------------|
| `DEFAULT`（默认）   | 继承数据库的默认隔离级别（MySQL 为 `REPEATABLE_READ`，Oracle 为 `READ_COMMITTED`） | 随数据库默认配置          | 中等 | 绝大多数业务场景          |
| `READ_UNCOMMITTED`  | 最低隔离级别，允许读取未提交的事务数据                                   | 无（会出现脏读、不可重复读、幻读） | 最高 | 无实际业务场景，仅测试使用 |
| `READ_COMMITTED`    | 仅允许读取已提交的事务数据，禁止读取未提交数据                           | 脏读                      | 较高 | 对一致性要求一般的场景（如普通查询） |
| `REPEATABLE_READ`   | 同一事务内多次读取同一数据，结果一致（禁止脏读、不可重复读）             | 脏读、不可重复读          | 中等 | MySQL 默认，绝大多数核心业务（如订单、支付） |
| `SERIALIZABLE`      | 最高隔离级别，事务串行执行，禁止所有并发问题                             | 脏读、不可重复读、幻读    | 最低 | 对一致性要求极高的场景（如金融核心记账） |

隔离级别配置示例
```java
@Service
public class FinanceService {

    // 配置：可重复读隔离级别 + 所有异常回滚 + 10秒超时
    @Transactional(
            rollbackFor = Exception.class,
            isolation = Isolation.REPEATABLE_READ,
            timeout = 10
    )
    public void transferMoney(String fromUserId, String toUserId, Double amount) {
        // 资金转账逻辑（核心金融业务，需要高一致性）
        // 1. 扣减转出方金额
        // 2. 增加转入方金额
    }

    // 配置：只读事务 + 读已提交隔离级别（查询优化）
    @Transactional(
            readOnly = true,
            isolation = Isolation.READ_COMMITTED
    )
    public List<FinanceRecord> queryFinanceRecord(Long userId) {
        // 仅查询资金流水，不执行写操作
        return null;
    }
}
```

### 分布式事务

分布式事务详解

是相对于本地事务（单一数据源）而言的**跨多数据源/多服务的事务管理方案**，核心目标依然是保障事务的原子性（要么所有节点操作全部成功，要么全部回滚），但因涉及多节点网络通信、数据一致性协调，实现复杂度远高于本地事务。

一、 分布式事务的核心问题
分布式事务的产生源于**分布式系统的特性**，核心痛点是解决“跨节点操作的数据一致性”问题，具体表现为：
1.  **网络不可靠**：多服务/多数据源之间通过网络通信，可能出现网络超时、断连等问题，导致部分节点操作成功、部分节点操作失败；
2.  **节点独立性**：每个数据源/服务都有独立的事务管理能力，无法像本地事务那样通过单一事务管理器管控；
3.  **数据一致性冲突**：无统一协调机制时，易出现“部分节点提交、部分节点回滚”的脏数据，破坏业务一致性（如订单创建成功，但库存扣减失败）。

二、 分布式事务的核心理论
1.  CAP 定理
分布式系统中，一致性（Consistency）、可用性（Availability）、分区容错性（Partition tolerance）三者不可兼得，分布式事务方案本质是在三者间做权衡：
- 优先强一致性：牺牲部分可用性（如 2PC 方案）；
- 优先高可用性：牺牲强一致性，采用最终一致性（如 TCC、SAGA 方案）。
2.  BASE 理论
BASE 是分布式事务的理论基础，是对 CAP 定理的补充，核心是**牺牲强一致性，换取高可用性**：
- 基本可用（Basically Available）：分布式系统出现故障时，仍能提供核心功能服务（如部分节点故障，不影响整体查询功能）；
- 软状态（Soft State）：允许系统存在中间状态，该状态无需实时同步（如缓存数据未及时更新）；
- 最终一致性（Eventual Consistency）：无需实时保证数据一致性，在一定时间窗口内，所有节点数据最终会达到一致状态。

三、 主流分布式事务方案（按一致性从强到弱排序）
1.  2PC（两阶段提交，Two-Phase Commit）

核心特性
-  **强一致性**：是分布式事务中一致性最强的方案，实现了“要么全部提交，要么全部回滚”；
-  **中心化协调**：引入「协调者（Coordinator）」（如分布式事务管理器）和「参与者（Participant）」（如各数据源/服务），分两个阶段完成事务协调。

执行流程
1.  **准备阶段（Prepare）**：
    - 协调者向所有参与者发送“事务准备请求”，携带全局事务ID；
    - 参与者执行本地事务操作（增删改），但**不提交事务**，仅记录 Redo Log/Undo Log；
    - 参与者向协调者返回“可提交”（操作成功）或“不可提交”（操作失败）状态。
2.  **提交阶段（Commit）**：
    - 情况1：所有参与者均返回“可提交”→ 协调者发送“全局提交”指令；各参与者执行本地事务提交，释放资源，向协调者返回“提交成功”；协调者完成全局事务提交。
    - 情况2：任一参与者返回“不可提交”→ 协调者发送“全局回滚”指令；各参与者执行本地事务回滚，恢复数据，释放资源，向协调者返回“回滚成功”；协调者完成全局事务回滚。

优缺点 & 适用场景
-  优点：实现简单，强一致性保障；
-  缺点：同步阻塞（参与者在准备阶段会持有锁资源，直到全局指令下达）、单点故障（协调者宕机会导致参与者一直阻塞）、数据不一致（提交阶段网络异常，部分参与者未收到提交指令）；
-  适用场景：对一致性要求极高、节点数量少、允许低可用性的场景（如金融核心记账、资金转账）；
-  典型实现：Oracle XA、Java JTA、Seata XA 模式。

2.  TCC（补偿事务，Try-Confirm-Cancel）

核心特性
-  **最终一致性**：基于“业务补偿”实现，无需数据库底层支持，完全自定义业务逻辑；
-  **无锁同步**：全程无阻塞，性能优于 2PC；
-  **侵入性强**：需要将每个业务操作拆分为三个独立方法，对业务代码侵入较大。

执行流程
1.  **Try 阶段**：资源检查与预留（核心是“预留”，确保后续 Confirm 阶段能执行成功）；
    - 示例：转账场景中，Try 阶段检查转出/转入账户是否合法，预留转出金额（冻结该部分金额，不可用于其他操作）。
2.  **Confirm 阶段**：确认执行业务操作（仅在所有参与者 Try 阶段成功后执行）；
    - 示例：扣除转出账户的预留金额，增加转入账户金额，释放预留资源。
3.  **Cancel 阶段**：补偿回滚操作（任一参与者 Try 阶段失败，执行 Cancel 阶段，撤销 Try 阶段的预留操作）；
    - 示例：解冻转出账户的预留金额，恢复资源状态。

优缺点 & 适用场景
-  优点：无阻塞、高性能、灵活性高（可自定义补偿逻辑）；
-  缺点：开发成本高（需拆分三个方法）、需处理补偿逻辑的幂等性（避免重复执行 Confirm/Cancel）；
-  适用场景：高并发、对性能要求高、一致性要求为最终一致的场景（如电商订单、支付结算）；
-  典型实现：Seata TCC 模式、自研补偿框架。

3.  SAGA 模式

核心特性
-  **最终一致性**：将分布式事务拆分为多个**本地事务**（正向操作），每个本地事务对应一个反向**补偿操作**，通过正向执行与反向补偿实现最终一致；
-  **低侵入性（相对 TCC）**：无需拆分 Try/Confirm/Cancel，仅需编写补偿逻辑；
-  **支持长事务**：适合执行时间较长的分布式事务。

执行流程
1.  **正向执行**：按顺序依次执行所有本地事务（T1→T2→T3→...→Tn）；
2.  **补偿回滚**：若某个本地事务 Tk 执行失败，按**反向顺序**执行对应补偿操作（Ck→Ck-1→...→C2→C1），撤销已执行的本地事务；
    - 示例：订单创建分布式事务（订单创建→库存扣减→支付扣钱）：
      - 正向执行：创建订单（T1）→ 扣减库存（T2）→ 扣减支付金额（T3）；
      - 若 T3 失败：执行补偿操作 → 恢复库存（C2）→ 取消订单（C1）。

优缺点 & 适用场景
-  优点：开发成本低于 TCC、支持长事务、无阻塞；
-  缺点：一致性保障较弱（补偿操作可能失败，需重试机制）、需处理幂等性与乱序问题；
-  适用场景：长事务、低一致性要求、业务流程固定的场景（如电商履约、物流配送、用户注册）；
-  典型实现：Seata SAGA 模式、Apache Camel SAGA。

4.  本地消息表 + MQ（可靠消息最终一致性）

核心特性
-  **最终一致性**：基于“本地事务 + 消息队列”实现，通过消息异步通知实现跨节点数据同步；
-  **低耦合**：各服务通过 MQ 通信，无直接依赖，耦合度极低；
-  **实现简单**：无需引入复杂分布式事务框架，适合中小项目快速落地。

执行流程
1.  **步骤1**：在业务库中创建「本地消息表」（与业务表在同一数据源），用于存储待发送的消息；
2.  **步骤2**：执行本地事务（如创建订单），同时将消息插入本地消息表（两者在同一个本地事务中，确保要么都成功，要么都回滚）；
3.  **步骤3**：启动定时任务，扫描本地消息表中“未发送”的消息，发送到 MQ 队列；
4.  **步骤4**：消费端监听 MQ 消息，执行对应业务操作（如扣减库存）；若消费成功，向 MQ 确认消费；若消费失败，MQ 重新投递（或定时重试）；
5.  **步骤5**：消费端确认消费后，通知生产端更新本地消息表状态为“已发送/已消费”；生产端定时清理已完成的消息。

优缺点 & 适用场景
-  优点：实现简单、低耦合、高可用、无阻塞；
-  缺点：一致性保障较弱（MQ 消息丢失、消费失败可能导致数据不一致）、需维护本地消息表、处理消息幂等性；
-  适用场景：中小项目、一致性要求不高、异步通信的场景（如订单创建后发送通知、商品上架后同步缓存）；
-  典型实现：自研基于 RocketMQ/Kafka 的可靠消息方案。

四、 主流分布式事务框架：Seata

Seata（Simple Extensible Autonomous Transaction Architecture）是阿里开源的分布式事务框架，支持四种分布式事务模式，适配绝大多数场景：
1.  **XA 模式**：基于 2PC 实现，强一致性，低性能，适配对一致性要求极高的场景；
2.  **AT 模式**：Seata 默认模式，基于“自动补偿”实现，无侵入性，最终一致性，性能优于 XA；
3.  **TCC 模式**：手动实现 Try/Confirm/Cancel，高性能，高灵活性，适配高并发场景；
4.  **SAGA 模式**：基于正向操作与反向补偿，支持长事务，适配业务流程固定的场景。

五、 分布式事务方案选型指南
| 对比维度         | 2PC                | TCC                | SAGA               | 本地消息表 + MQ    |
|------------------|--------------------|--------------------|--------------------|--------------------|
| 一致性等级       | 强一致性           | 最终一致性         | 最终一致性         | 最终一致性         |
| 性能             | 低（同步阻塞）     | 高（无锁异步）     | 中高（无阻塞）     | 高（异步解耦）     |
| 开发成本         | 低（无侵入）       | 高（强侵入）       | 中（低侵入）       | 低（简单易实现）   |
| 适用节点数       | 少（≤5个）         | 中（≤10个）        | 多（无明确限制）   | 多（无明确限制）   |
| 典型场景         | 金融核心记账       | 电商高并发订单     | 物流履约/长事务    | 中小项目异步通知   |

总结
1.  分布式事务的核心目标是**跨节点数据一致性**，方案选型本质是“一致性”与“可用性/性能”的权衡；
2.  强一致性优先选 **2PC（XA）**，高并发高性能优先选 **TCC**，长事务优先选 **SAGA**，中小项目快速落地优先选 **本地消息表 + MQ**；
3.  实际开发中，优先使用成熟框架（如 Seata），避免自研分布式事务带来的稳定性风险；
4.  并非所有跨节点操作都需要分布式事务：可通过“业务设计”规避（如最终一致性场景，用本地事务 + 异步补偿替代分布式事务）。
5.  

## SpringBoot 异步处理
### 异步方法
#### @Async注解使用
Spring Boot @Async 注解（异步方法）使用详解

`@Async` 是 Spring Boot 提供的**异步方法核心注解**，用于将同步方法转为异步执行——调用该方法时，Spring 会将方法逻辑提交到线程池异步执行，调用方无需等待方法执行完成即可继续执行后续代码，有效提升系统并发能力和响应速度。

一、 核心前置条件（注解生效必备）

`@Async` 注解并非直接使用即可生效，必须先开启 Spring 的异步处理功能，核心配置如下：

1.  开启异步注解驱动

在 Spring Boot 主启动类或任意 `@Configuration` 配置类上添加 `@EnableAsync` 注解，开启异步处理支持：
```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// 开启异步注解驱动，使 @Async 生效
@EnableAsync
@SpringBootApplication
public class AsyncDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncDemoApplication.class, args);
    }
}
```

2.  可选：自定义异步线程池（推荐）

Spring 提供默认线程池，但默认配置（核心线程数、最大线程数等）难以满足业务需求，推荐自定义线程池优化异步执行效果：
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class AsyncThreadPoolConfig {

    // 自定义异步线程池，Bean 名称可指定（如 "asyncTaskExecutor"）
    @Bean("asyncTaskExecutor")
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 核心线程数（默认CPU核心数）
        executor.setCorePoolSize(8);
        // 最大线程数
        executor.setMaxPoolSize(16);
        // 队列容量（核心线程满后，任务存入队列）
        executor.setQueueCapacity(100);
        // 线程空闲时间（超过该时间，非核心线程销毁）
        executor.setKeepAliveSeconds(60);
        // 线程名称前缀（便于日志排查）
        executor.setThreadNamePrefix("Async-Thread-");
        // 拒绝策略（队列满+最大线程数满时，如何处理任务）
        // ThreadPoolExecutor.CallerRunsPolicy：由调用方线程执行（避免任务丢失）
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // 初始化线程池
        executor.initialize();
        return executor;
    }
}
```

二、 基本使用方式

1.  标注异步方法

将 `@Async` 注解标注在 **public 方法**上（非 public 方法不生效），可直接使用默认线程池，或指定自定义线程池（通过 `value`/`executor` 属性指定线程池 Bean 名称）。

示例1：使用默认线程池
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncDefaultService {

    // 异步方法：使用 Spring 默认线程池
    @Async
    public void doDefaultAsyncTask(String taskName) {
        // 模拟耗时操作（如文件上传、远程调用、数据统计）
        try {
            Thread.sleep(2000);
            System.out.println("默认线程池 - 任务【" + taskName + "】执行完成，线程名称：" + Thread.currentThread().getName());
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

示例2：使用自定义线程池（推荐）

```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncCustomService {

    // 异步方法：指定自定义线程池（Bean 名称与配置类中一致）
    @Async("asyncTaskExecutor")
    public void doCustomAsyncTask(String taskName) {
        try {
            Thread.sleep(2000);
            System.out.println("自定义线程池 - 任务【" + taskName + "】执行完成，线程名称：" + Thread.currentThread().getName());
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    // 异步方法：带返回值（返回 Future 类型，用于获取异步执行结果）
    @Async("asyncTaskExecutor")
    public String doAsyncTaskWithResult(String taskName) {
        try {
            Thread.sleep(2000);
            String result = "自定义线程池 - 任务【" + taskName + "】执行成功，线程名称：" + Thread.currentThread().getName();
            return result;
        } catch (InterruptedException e) {
            throw new RuntimeException("任务【" + taskName + "】执行失败", e);
        }
    }
}
```

2.  调用异步方法

在 Controller 或其他业务类中调用异步方法，调用方无需等待异步方法执行完成：
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/async")
public class AsyncController {

    @Autowired
    private AsyncDefaultService asyncDefaultService;

    @Autowired
    private AsyncCustomService asyncCustomService;

    @GetMapping("/default")
    public String testDefaultAsync() {
        // 调用异步方法：调用方立即返回，无需等待 2 秒
        System.out.println("开始调用默认线程池异步方法，当前线程：" + Thread.currentThread().getName());
        asyncDefaultService.doDefaultAsyncTask("测试默认异步任务");
        System.out.println("默认线程池异步方法调用完成，当前线程：" + Thread.currentThread().getName());
        return "默认异步任务已提交！";
    }

    @GetMapping("/custom")
    public String testCustomAsync() {
        System.out.println("开始调用自定义线程池异步方法，当前线程：" + Thread.currentThread().getName());
        asyncCustomService.doCustomAsyncTask("测试自定义异步任务");
        // 调用带返回值的异步方法
        String asyncResult = asyncCustomService.doAsyncTaskWithResult("测试带返回值异步任务");
        System.out.println("异步方法返回结果：" + asyncResult);
        System.out.println("自定义线程池异步方法调用完成，当前线程：" + Thread.currentThread().getName());
        return "自定义异步任务已提交！";
    }
}
```

3.  带返回值的异步方法（`Future` 及其子类）

若需要获取异步方法的执行结果，异步方法需返回 `Future` 或其子类（如 `CompletableFuture`），调用方可通过 `get()` 方法阻塞获取结果（或非阻塞监听结果）。

示例：返回 `CompletableFuture`（推荐，支持链式编程）
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class AsyncFutureService {

    @Async("asyncTaskExecutor")
    public CompletableFuture<String> doAsyncTaskWithCompletableFuture(String taskName) {
        try {
            Thread.sleep(2000);
            String result = "任务【" + taskName + "】执行成功";
            // 返回 CompletableFuture 结果
            return CompletableFuture.completedFuture(result);
        } catch (InterruptedException e) {
            return CompletableFuture.failedFuture(new RuntimeException("任务【" + taskName + "】执行失败", e));
        }
    }
}
```

调用带返回值的异步方法
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/async/future")
public class AsyncFutureController {

    @Autowired
    private AsyncFutureService asyncFutureService;

    @GetMapping
    public String testAsyncFuture() throws ExecutionException, InterruptedException {
        System.out.println("开始调用带返回值的异步方法，当前线程：" + Thread.currentThread().getName());

        // 提交异步任务
        CompletableFuture<String> future1 = asyncFutureService.doAsyncTaskWithCompletableFuture("任务1");
        CompletableFuture<String> future2 = asyncFutureService.doAsyncTaskWithCompletableFuture("任务2");

        // 方式1：阻塞获取结果（get() 方法会等待异步任务完成）
        String result1 = future1.get();
        String result2 = future2.get();
        System.out.println("任务1结果：" + result1);
        System.out.println("任务2结果：" + result2);

        // 方式2：非阻塞获取结果（whenComplete 回调）
        future1.whenComplete((result, throwable) -> {
            if (throwable != null) {
                System.err.println("任务1执行失败：" + throwable.getMessage());
            } else {
                System.out.println("非阻塞获取任务1结果：" + result);
            }
        });

        System.out.println("带返回值的异步方法调用完成，当前线程：" + Thread.currentThread().getName());
        return "任务1结果：" + result1 + "，任务2结果：" + result2;
    }
}
```

三、 关键注意事项（避坑指南）
1.  **注解生效范围限制**
    - 仅对 **public 方法**生效：Spring 异步处理基于 AOP 动态代理，仅能拦截 public 方法，private/protected/default 方法标注 `@Async` 无效；
    - 避免 **同类内部调用**：若在同一个类中，普通方法调用同类的 `@Async` 方法，会跳过动态代理，异步失效（原因：AOP 仅拦截外部对代理对象的调用，内部调用不经过代理）。
      ```java
      // 错误示例：同类内部调用，@Async 失效
      @Service
      public class AsyncErrorService {
          public void methodA() {
              // 内部调用，无代理拦截，异步失效
              methodB();
          }

          @Async("asyncTaskExecutor")
          public void methodB() {
              // 耗时操作...
          }
      }
      ```
    - 解决方案：将异步方法抽取到独立的 Service 类中，通过依赖注入调用。

2.  **异常处理**
    - 无返回值异步方法：异常会被 Spring 线程池捕获并打印（默认无全局处理），需自定义异常处理器；
    - 带返回值异步方法（`Future`/`CompletableFuture`）：异常会封装在 `Future` 中，调用 `get()` 方法时会抛出异常，可通过 `exceptionally()` 或 `whenComplete()` 处理。

3.  **线程池配置优化**
    - 避免使用默认线程池：Spring 默认线程池 `SimpleAsyncTaskExecutor` 无线程复用（每次创建新线程），高并发场景会导致线程数暴增，推荐自定义 `ThreadPoolTaskExecutor`；
    - 合理配置线程池参数：根据业务场景调整核心线程数、最大线程数、队列容量（核心线程数一般设为 CPU 核心数 * 2 + 1，I/O 密集型任务可适当增大）；
    - 配置合理的拒绝策略：优先使用 `CallerRunsPolicy`（调用方执行任务），避免任务丢失，其次可选择 `AbortPolicy`（抛出异常）、`DiscardPolicy`（丢弃任务）等。

4.  **异步方法的返回值限制**
    - 无返回值：方法返回 `void`；
    - 有返回值：必须返回 `Future` 或其子类（如 `CompletableFuture`、`ListenableFuture`），返回普通类型（String/Integer 等）会导致异步失效，且无法获取结果。

四、 全局异常处理（可选）

对于无返回值的异步方法，可通过实现 `AsyncUncaughtExceptionHandler` 接口，自定义全局异步异常处理器：
```java
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;

// 实现 AsyncConfigurer 接口，自定义异步配置（线程池 + 异常处理器）
@Configuration
public class AsyncGlobalConfig implements AsyncConfigurer {

    // 自定义线程池（与之前的配置一致）
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("Global-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    // 自定义全局异步异常处理器
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            // 打印异常日志
            System.err.println("异步方法执行异常，方法名称：" + method.getName());
            System.err.println("异常信息：" + ex.getMessage());
            System.err.println("异常堆栈：");
            ex.printStackTrace();
            // 后续可添加告警、日志持久化等逻辑
        };
    }
}
```

总结
1.  `@Async` 核心作用：将同步方法转为异步执行，提升系统并发能力，调用方无需阻塞等待；
2.  生效必备：`@EnableAsync` 开启异步驱动 + 异步方法为 public + 避免同类内部调用；
3.  最佳实践：自定义 `ThreadPoolTaskExecutor` 线程池 + 带返回值使用 `CompletableFuture` + 全局异常处理；
4.  避坑关键：杜绝同类内部调用、不使用默认线程池、合理处理异步异常。
----------
@Async 注解核心原理详解

`@Async` 注解是 Spring 实现异步方法执行的核心注解，其底层完全依托 **Spring AOP（动态代理）** 机制和 **线程池** 实现，通过“方法拦截-任务提交-异步执行”的流程，实现调用方与执行方的解耦，让方法脱离主线程异步运行。

一、 前置基础：注解生效的前提

`@Async` 并非直接生效，必须通过 `@EnableAsync` 注解开启 Spring 异步驱动功能，这是原理落地的前提：
- `@EnableAsync` 注解会向 Spring 容器中注册 `AsyncAnnotationBeanPostProcessor` 后置处理器；
- 该后置处理器的核心作用是 **扫描容器中所有标注了 `@Async` 的 Bean 和方法**，为其创建动态代理对象，后续对异步方法的调用都会经过代理对象拦截。

二、 核心原理：三大核心组件 + 执行流程

1.  三大核心组件

`@Async` 的异步能力由三个核心组件协同支撑，缺一不可：

| 核心组件                | 作用说明                                                                 |
|-------------------------|--------------------------------------------------------------------------|
| `@EnableAsync`          | 开启异步注解驱动，注册 `AsyncAnnotationBeanPostProcessor` 后置处理器     |
| `AsyncAnnotationBeanPostProcessor` | Spring 后置处理器，扫描 `@Async` 注解，为目标 Bean 创建动态代理 |
| `TaskExecutor`（线程池） | 异步任务的执行载体，Spring 会将异步方法的逻辑封装为 `Task` 提交到线程池，由线程池中的线程执行（而非主线程） |
| （补充）`AsyncAnnotationAdvisor` | 切面增强器，包含异步方法的切入点（`@Async` 标注的方法）和通知逻辑（异步执行逻辑） |

2.  完整执行流程（分 5 步）

步骤 1：扫描识别异步方法

`AsyncAnnotationBeanPostProcessor` 后置处理器在 Spring 容器初始化 Bean 时，会遍历所有 Bean 的方法，通过反射检测方法上是否标注了 `@Async` 注解（包括类上标注 `@Async`，则类中所有 public 方法均为异步方法），识别出需要异步执行的目标方法。

步骤 2：创建动态代理对象

对于包含异步方法的 Bean，Spring 不会直接返回原始 Bean 实例，而是通过 **动态代理** 为其创建代理对象（代理方式与 Spring AOP 一致）：
- 若目标 Bean 实现了接口：默认使用 **JDK 动态代理**（基于接口生成代理类）；
- 若目标 Bean 未实现接口：使用 **CGLIB 动态代理**（基于子类生成代理类）；
- 代理对象会完全包装原始 Bean，所有对原始 Bean 方法的调用，都会先经过代理对象。

步骤 3：拦截异步方法调用

当外部调用方调用标注了 `@Async` 的方法时，调用请求会先被代理对象拦截（这是 AOP 的核心特性），代理对象会判断当前方法是否为异步方法，若为异步方法，则不会直接调用原始 Bean 的方法逻辑。

步骤 4：封装任务并提交到线程池

代理对象拦截方法后，会执行核心异步逻辑：
1.  将原始方法的逻辑、方法参数、执行上下文等封装为一个 **异步任务（`Runnable`/`Callable` 实例）**；
2.  获取线程池（`TaskExecutor`）：
    -  若 `@Async` 注解指定了线程池 Bean 名称（如 `@Async("asyncTaskExecutor")`），则获取对应的自定义线程池；
    -  若未指定，则使用 Spring 默认线程池（默认是 `SimpleAsyncTaskExecutor`，无线程复用，推荐自定义 `ThreadPoolTaskExecutor`）；
3.  将封装好的异步任务提交到获取到的线程池中，提交完成后，代理对象会立即向调用方返回（无需等待任务执行完成）。

步骤 5：线程池异步执行任务

线程池中的空闲线程会获取提交的异步任务，独立于调用方主线程执行任务逻辑：
-  任务执行过程中，调用方主线程已继续执行后续代码，实现“异步非阻塞”效果；
-  若异步方法有返回值（`Future`/`CompletableFuture` 类型），线程池执行完成后，会将结果封装到 `Future` 对象中，供调用方后续通过 `get()` 方法获取；
-  若异步方法无返回值（`void` 类型），任务执行完成后直接释放线程资源，线程回到线程池等待下一个任务。

三、 关键特性与原理延伸

1.  为什么 `@Async` 仅对 public 方法生效？
-  核心原因：Spring 动态代理的拦截机制仅对 **public 方法**有效；
-  底层逻辑：JDK 动态代理基于接口实现，仅能拦截接口中声明的 public 方法；CGLIB 动态代理虽然可以拦截非 public 方法，但 Spring 框架为了遵循 Java 方法访问权限的设计原则，同时保证代理逻辑的一致性，刻意限制了仅对 public 方法进行异步拦截，非 public 方法（private/protected/default）标注 `@Async` 会失效。

2.  为什么同类内部调用 `@Async` 方法会失效？
-  核心原因：同类内部调用时，方法调用不会经过代理对象，而是直接调用原始 Bean 的方法，导致异步拦截逻辑无法触发；
-  底层逻辑：外部调用时，调用的是代理对象，因此会被拦截；而同类内部方法间的调用，是原始 Bean 内部的方法引用调用，跳过了代理对象，Spring 无法感知该次方法调用，自然无法执行异步逻辑。
-  示例（失效场景）：
  ```java
  @Service
  public class AsyncInnerCallService {
      public void methodA() {
          // 同类内部调用，直接调用原始方法，不经过代理，异步失效
          methodB(); 
      }

      @Async
      public void methodB() {
          // 耗时操作...
      }
  }
  ```

3.  默认线程池 vs 自定义线程池的原理差异
-  **默认线程池（`SimpleAsyncTaskExecutor`）**：
  底层无线程复用机制，每次提交异步任务时，都会创建一个新的线程来执行任务，任务执行完成后线程直接销毁。高并发场景下会导致线程数暴增，引发系统资源耗尽问题。
-  **自定义线程池（`ThreadPoolTaskExecutor`）**：
  基于 JUC 的 `ThreadPoolExecutor` 实现，维护了核心线程池、任务队列和最大线程池，支持线程复用和任务排队。提交任务时，优先使用核心线程执行，核心线程满则存入队列，队列满则创建非核心线程，最大线程数满则执行拒绝策略，性能更优，是生产环境的首选。

4.  带返回值异步方法的原理
-  异步方法返回值必须是 `Future` 或其子类（`CompletableFuture`/`ListenableFuture`），这是因为：
  1.  代理对象提交任务到线程池后，无法立即获取任务执行结果，需要通过 `Future` 对象封装“未来的执行结果”；
  2.  `Future` 提供了 `get()` 方法（阻塞获取结果）、`isDone()` 方法（判断任务是否完成）等，供调用方后续获取异步执行结果；
  3.  `CompletableFuture` 进一步支持链式编程和非阻塞回调（如 `whenComplete()`/`exceptionally()`），底层仍是通过线程池执行任务，只是对结果的封装和处理更灵活。

四、 原理总结

`@Async` 注解的核心原理可归纳为 3 句话：
1.  核心基础：**`@EnableAsync` 开启异步驱动，`AsyncAnnotationBeanPostProcessor` 扫描并创建动态代理**；
2.  执行核心：**代理对象拦截方法调用，将任务封装后提交到 `TaskExecutor` 线程池**，实现异步执行；
3.  关键特性：依赖 Spring AOP 动态代理，仅对 public 方法有效，同类内部调用失效，线程池是异步执行的载体。

本质上，`@Async` 是 Spring 对“动态代理 + 线程池”的封装，简化了异步编程的复杂度，让开发者无需手动创建线程和管理任务提交，仅通过注解即可实现异步方法。

#### @EnableAsync配置
@EnableAsync 注解配置详解

`@EnableAsync` 是 Spring Boot 中开启异步方法（`@Async`）支持的**核心开关注解**，通过它可以激活 Spring 的异步处理机制，配合自定义配置还能优化异步执行的线程池、异常处理等能力。下面从基础配置到高级定制，全面讲解其使用方式。

一、 基础配置：开启异步功能（必备）

1.  注解标注位置

`@EnableAsync` 可标注在两个核心位置，效果一致，优先推荐标注在主启动类上，便于统一管理：
- **Spring Boot 主启动类**（推荐）：
```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// 标注在主启动类，全局开启异步功能
@EnableAsync
@SpringBootApplication
public class AsyncDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncDemoApplication.class, args);
    }
}
```
- **自定义 `@Configuration` 配置类**：
```java
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// 标注在配置类，开启异步功能
@EnableAsync
@Configuration
public class AsyncBasicConfig {
}
```

2.  基础生效说明

标注 `@EnableAsync` 后，Spring 会自动完成以下操作，为 `@Async` 注解铺路：
1.  向 Spring 容器注册 `AsyncAnnotationBeanPostProcessor` 后置处理器；
2.  该后置处理器会扫描容器中所有标注 `@Async` 的 Bean 和方法，为其创建动态代理对象；
3.  后续调用 `@Async` 方法时，会通过代理对象实现异步拦截与任务提交。

二、 核心配置：自定义异步线程池（推荐）

`@EnableAsync` 仅开启功能时，会使用 Spring 默认线程池（`SimpleAsyncTaskExecutor`，无线程复用，性能较差）。实际开发中，需配合自定义 `ThreadPoolTaskExecutor` 线程池，优化异步执行效果。

1.  纯配置类自定义线程池

无需实现额外接口，直接在配置类中声明线程池 Bean 即可，`@Async` 可通过 `value` 属性指定该线程池。
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync // 开启异步功能
@Configuration
public class AsyncThreadPoolConfig {

    /**
     * 自定义异步线程池
     * Bean 名称：asyncTaskExecutor（供 @Async("asyncTaskExecutor") 指定使用）
     */
    @Bean("asyncTaskExecutor")
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 核心线程数：默认CPU核心数，I/O密集型可适当增大（如 CPU核心数*2+1）
        executor.setCorePoolSize(Runtime.getRuntime().availableProcessors() * 2 + 1);
        // 最大线程数：核心线程满+队列满后，可创建的最大线程数
        executor.setMaxPoolSize(20);
        // 任务队列容量：核心线程满后，任务存入该队列等待执行
        executor.setQueueCapacity(100);
        // 线程空闲时间：非核心线程空闲超过该时间（秒）会被销毁
        executor.setKeepAliveSeconds(60);
        // 线程名称前缀：便于日志排查异步线程
        executor.setThreadNamePrefix("Custom-Async-Thread-");
        // 拒绝策略：队列满+最大线程数满时的处理方式
        // CallerRunsPolicy：由调用方主线程执行，避免任务丢失（推荐）
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // 等待所有任务执行完成后再关闭线程池（应用关闭时）
        executor.setWaitForTasksToCompleteOnShutdown(true);
        // 等待任务执行的超时时间（秒）
        executor.setAwaitTerminationSeconds(30);
        // 初始化线程池
        executor.initialize();
        return executor;
    }
}
```

2.  使用自定义线程池

在 `@Async` 注解中通过 `value` 或 `executor` 属性指定线程池 Bean 名称即可：
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncBusinessService {

    // 指定使用自定义线程池（Bean名称与配置类一致）
    @Async("asyncTaskExecutor")
    public void doCustomAsyncTask(String taskName) {
        // 异步业务逻辑
        System.out.println("线程池：" + Thread.currentThread().getName() + "，执行任务：" + taskName);
    }
}
```

三、 高级配置：实现 `AsyncConfigurer` 接口（统一定制）

通过实现 `AsyncConfigurer` 接口，可**统一定制异步线程池和全局异步异常处理器**，替代分散的配置，更便于管理。该接口提供两个核心方法供实现：
1.  `getAsyncExecutor()`：返回自定义线程池（作为默认异步线程池，`@Async` 未指定线程池时使用）；
2.  `getAsyncUncaughtExceptionHandler()`：返回全局异步异常处理器（处理无返回值 `@Async` 方法的异常）。

1.  完整高级配置示例
```java
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync // 开启异步功能
@Configuration
public class AsyncAdvancedConfig implements AsyncConfigurer {

    /**
     * 自定义默认异步线程池（@Async 未指定线程池时，默认使用该线程池）
     */
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("Default-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * 自定义全局异步异常处理器（仅处理无返回值 @Async 方法的异常）
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        // 匿名内部类实现异常处理逻辑
        return new AsyncUncaughtExceptionHandler() {
            @Override
            public void handleUncaughtException(Throwable ex, Method method, Object... params) {
                // 1. 打印异常日志
                System.err.println("===== 全局异步方法异常捕获 =====");
                System.err.println("异常方法名称：" + method.getName());
                System.err.println("异常方法参数：" + java.util.Arrays.toString(params));
                System.err.println("异常信息：" + ex.getMessage());
                System.err.println("异常堆栈：");
                ex.printStackTrace();
                // 2. 可选：添加告警通知（如钉钉、邮件）、异常持久化等逻辑
            }
        };
    }
}
```

2.  高级配置使用说明

-  默认线程池：`@Async` 未指定线程池时，自动使用 `getAsyncExecutor()` 返回的线程池；
  ```java
  // 未指定线程池，使用 AsyncConfigurer 定义的默认线程池
  @Async
  public void doDefaultAsyncTask(String taskName) {
      // 业务逻辑
  }
  ```
-  全局异常处理：无返回值的 `@Async` 方法抛出异常时，会被 `getAsyncUncaughtExceptionHandler()` 捕获处理，避免异常被静默丢弃；
-  优先级：`@Async` 显式指定的线程池 > `AsyncConfigurer` 定义的默认线程池 > Spring 默认线程池。

四、 可选配置：`@EnableAsync` 注解属性

`@EnableAsync` 自身提供少量属性，用于精细化控制异步功能的开启范围：
| 属性名          | 类型      | 核心作用                                                                 | 默认值 |
|-----------------|-----------|--------------------------------------------------------------------------|--------|
| `proxyTargetClass` | boolean  | 指定动态代理方式：<br>true - 强制使用 CGLIB 代理（无论是否实现接口）<br>false - 默认代理方式（实现接口用 JDK 代理，否则用 CGLIB） | false  |
| `mode`          | AdviceMode | 指定异步增强的实现方式：<br>AdviceMode.PROXY - 基于动态代理（默认，仅拦截外部调用）<br>AdviceMode.ASPECTJ - 基于 ASPECTJ 静态织入（可拦截内部调用，需引入 ASPECTJ 依赖） | AdviceMode.PROXY |
| `order`         | int       | 指定异步切面的执行顺序，数值越小，执行优先级越高                           | Ordered.LOWEST_PRECEDENCE（最低优先级） |

3.  属性使用示例
```java
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AdviceMode;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.core.Ordered;

@EnableAsync(
        proxyTargetClass = true, // 强制使用 CGLIB 代理
        mode = AdviceMode.PROXY, // 基于动态代理实现
        order = Ordered.HIGHEST_PRECEDENCE // 最高执行优先级
)
@Configuration
public class AsyncOptionalConfig {
}
```

五、 关键注意事项
1.  **配置生效前提**：`@EnableAsync` 必须与 `@Configuration` 或 `@SpringBootApplication` 配合使用（后者默认包含 `@Configuration`），否则无法注册相关后置处理器；
2.  **线程池初始化**：`ThreadPoolTaskExecutor` 必须调用 `initialize()` 方法初始化（手动声明 Bean 时需显式调用，Spring 自动注入时会自动初始化）；
3.  **异常处理范围**：`AsyncConfigurer` 定义的异常处理器仅处理 **无返回值** 的 `@Async` 方法，带返回值（`Future`/`CompletableFuture`）的异步方法，异常需通过 `get()` 或 `whenComplete()` 手动捕获；
4.  **ASPECTJ 模式说明**：若使用 `mode = AdviceMode.ASPECTJ`，需额外引入 ASPECTJ 依赖，且编译时进行静态织入，可解决同类内部调用 `@Async` 失效的问题，但配置复杂度较高。

总结
1.  `@EnableAsync` 是开启 `@Async` 异步功能的必备注解，优先标注在主启动类或自定义配置类上；
2.  核心最佳实践：`@EnableAsync` + 自定义 `ThreadPoolTaskExecutor` 线程池（避免使用默认线程池）；
3.  高级用法：实现 `AsyncConfigurer` 接口，统一配置默认线程池和全局异步异常处理器；
4.  精细化控制：通过 `proxyTargetClass`、`mode` 等属性调整代理方式和切面优先级，适配特殊业务场景。


#### 异步方法返回值
Spring Boot @Async 异步方法返回值详解

`@Async` 异步方法的返回值有严格限制，并非所有类型都支持，核心分为**无返回值**和**有返回值**两类，其中有返回值必须基于 `Future` 及其子类实现，目的是为了适配异步执行的“结果延迟获取”特性。

一、 两类核心返回值类型
1.  无返回值：`void` 类型

这是最简单的异步方法返回类型，适用于无需获取方法执行结果、仅需异步执行任务的场景（如日志记录、消息发送、文件备份等）。

特点
-  调用方调用后立即返回，无需等待任务执行完成；
-  无法获取异步任务的执行结果和执行状态（成功/失败）；
-  异常需通过**全局异步异常处理器**（`AsyncUncaughtExceptionHandler`）捕获，否则会被静默丢弃（Spring 线程池默认打印异常日志，但无业务感知）。

示例
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncVoidService {

    // 无返回值异步方法：返回 void 类型
    @Async("asyncTaskExecutor")
    public void doAsyncVoidTask(String taskName) {
        try {
            // 模拟耗时任务
            Thread.sleep(2000);
            System.out.println("异步任务【" + taskName + "】执行完成，线程：" + Thread.currentThread().getName());
        } catch (InterruptedException e) {
            throw new RuntimeException("异步任务【" + taskName + "】执行失败", e);
        }
    }
}
```

2.  有返回值：`Future` 及其子类

若需要获取异步方法的执行结果或执行状态，异步方法必须返回 `java.util.concurrent.Future` 或其子类，这是 Spring 异步机制规定的（返回普通类型会导致异步失效，且无法获取延迟结果）。

核心子类（推荐使用）
| 返回值类型          | 特点                                                                 | 适用场景                     |
|---------------------|----------------------------------------------------------------------|------------------------------|
| `Future<T>`         | 基础返回类型，提供 `get()`（阻塞获取结果）、`isDone()`（判断任务完成）等方法 | 简单需要获取结果的场景       |
| `CompletableFuture<T>` | 扩展 `Future`，支持链式编程、非阻塞回调、多任务组合等高级功能         | 复杂异步场景（优先推荐）     |
| `ListenableFuture<T>` | Spring 扩展 `Future`，支持异步回调通知                               | Spring 生态下的异步场景      |

核心特性
-  异步任务执行结果会被封装到 `Future` 对象中，调用方可通过该对象后续获取结果；
-  `get()` 方法为**阻塞方法**，会等待异步任务执行完成后返回结果；
-  支持非阻塞获取结果（如 `CompletableFuture.whenComplete()`），避免调用方线程阻塞；
-  异常会封装在 `Future` 对象中，调用 `get()` 时会抛出异常，便于手动捕获处理。

二、 有返回值异步方法实战
1.  基础 `Future<T>` 类型

异步方法定义
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@Service
public class AsyncFutureService {

    // 基础 Future 类型返回值
    @Async("asyncTaskExecutor")
    public Future<String> doAsyncFutureTask(String taskName) {
        try {
            // 模拟耗时任务
            TimeUnit.SECONDS.sleep(2);
            String result = "任务【" + taskName + "】执行成功，线程：" + Thread.currentThread().getName();
            // 返回 Future 实现类 AsyncResult（Spring 提供的默认实现）
            return new org.springframework.scheduling.annotation.AsyncResult<>(result);
        } catch (InterruptedException e) {
            throw new RuntimeException("任务【" + taskName + "】执行失败", e);
        }
    }
}
```

调用方使用
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

@RestController
@RequestMapping("/async/future")
public class AsyncFutureController {

    @Autowired
    private AsyncFutureService asyncFutureService;

    @GetMapping
    public String testAsyncFuture() throws ExecutionException, InterruptedException {
        System.out.println("开始提交异步任务，当前线程：" + Thread.currentThread().getName());

        // 提交异步任务，立即返回 Future 对象（任务尚未执行完成）
        Future<String> future = asyncFutureService.doAsyncFutureTask("基础Future任务");

        // 可选：判断任务是否完成（非阻塞）
        System.out.println("任务是否执行完成：" + future.isDone());

        // 阻塞获取任务结果（会等待任务执行完成，此处等待约2秒）
        String result = future.get();
        System.out.println("异步任务结果：" + result);

        System.out.println("异步任务调用流程结束，当前线程：" + Thread.currentThread().getName());
        return result;
    }
}
```

2.  推荐：`CompletableFuture<T>` 类型

`CompletableFuture` 是 JDK 8 新增的 `Future` 扩展，功能更强大，支持非阻塞回调、多任务串联/并行等，是 Spring 异步方法有返回值场景的首选。

异步方法定义
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class AsyncCompletableFutureService {

    // CompletableFuture 类型返回值（推荐）
    @Async("asyncTaskExecutor")
    public CompletableFuture<String> doAsyncCompletableFutureTask(String taskName) {
        try {
            // 模拟耗时任务
            TimeUnit.SECONDS.sleep(2);
            String result = "任务【" + taskName + "】执行成功，线程：" + Thread.currentThread().getName();
            // 返回已完成的 CompletableFuture
            return CompletableFuture.completedFuture(result);
        } catch (InterruptedException e) {
            // 返回执行失败的 CompletableFuture
            return CompletableFuture.failedFuture(new RuntimeException("任务【" + taskName + "】执行失败", e));
        }
    }

    // 多异步任务组合示例
    @Async("asyncTaskExecutor")
    public CompletableFuture<Integer> doAsyncCalcTask(int num) {
        TimeUnit.SECONDS.sleep(1);
        return CompletableFuture.completedFuture(num * 2);
    }
}
```

调用方使用（非阻塞 + 多任务组合）
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/async/completable")
public class AsyncCompletableFutureController {

    @Autowired
    private AsyncCompletableFutureService asyncCompletableFutureService;

    @GetMapping
    public String testAsyncCompletableFuture() throws ExecutionException, InterruptedException {
        System.out.println("开始提交 CompletableFuture 异步任务，当前线程：" + Thread.currentThread().getName());

        // 1. 单任务非阻塞获取结果
        CompletableFuture<String> future1 = asyncCompletableFutureService.doAsyncCompletableFutureTask("CompletableFuture单任务");
        // 非阻塞回调：任务完成后自动执行，不阻塞调用方线程
        future1.whenComplete((result, throwable) -> {
            if (throwable != null) {
                System.err.println("单任务执行失败：" + throwable.getMessage());
            } else {
                System.out.println("非阻塞获取单任务结果：" + result);
            }
        });

        // 2. 多任务并行执行 + 结果汇总
        CompletableFuture<Integer> future2 = asyncCompletableFutureService.doAsyncCalcTask(10);
        CompletableFuture<Integer> future3 = asyncCompletableFutureService.doAsyncCalcTask(20);
        CompletableFuture<Integer> future4 = asyncCompletableFutureService.doAsyncCalcTask(30);

        // 等待所有任务完成（非阻塞，可通过 join() 阻塞获取所有结果）
        CompletableFuture<Void> allFuture = CompletableFuture.allOf(future2, future3, future4);
        allFuture.join(); // 阻塞等待所有任务完成

        // 获取多任务结果
        int result2 = future2.get();
        int result3 = future3.get();
        int result4 = future4.get();
        int total = result2 + result3 + result4;
        System.out.println("多任务结果汇总：" + result2 + " + " + result3 + " + " + result4 + " = " + total);

        System.out.println("CompletableFuture 异步任务调用流程结束，当前线程：" + Thread.currentThread().getName());
        return "单任务结果：" + future1.get() + "，多任务汇总结果：" + total;
    }
}
```

三、 关键注意事项（避坑指南）
1.  **禁止返回普通类型**
    异步方法不能返回 `String`、`Integer`、自定义 POJO 等普通类型，否则会导致：
    -  `@Async` 注解失效，方法变为同步执行；
    -  无法获取异步执行结果，返回值为 `null` 或默认值。
    ```java
    // 错误示例：返回普通类型，异步失效
    @Async("asyncTaskExecutor")
    public String doInvalidAsyncTask() {
        // 该方法会同步执行，且返回值无法正确传递
        return "无效异步任务";
    }
    ```

2.  **`Future.get()` 方法的阻塞特性**
    -  `get()` 方法会阻塞调用方线程，直到异步任务执行完成；
    -  可使用 `get(long timeout, TimeUnit unit)` 设置超时时间，避免调用方无限阻塞；
    ```java
    // 带超时时间的 get() 方法
    try {
        // 最多等待3秒，超时抛出 TimeoutException
        String result = future.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        System.err.println("异步任务执行超时");
        future.cancel(true); // 取消任务执行
    }
    ```

3.  **异常处理差异**
    -  `void` 类型异步方法：异常需通过 `AsyncConfigurer` 配置全局异常处理器捕获；
    -  `Future` 子类类型异步方法：异常封装在 `Future` 对象中，需通过 `get()` 方法抛出或 `whenComplete()` 回调捕获，全局异常处理器不生效。

4.  **`CompletableFuture` 优势**
    相比基础 `Future`，`CompletableFuture` 无需手动封装 `AsyncResult`，支持非阻塞回调、多任务组合（`allOf`/`anyOf`）、链式编程（`thenApply`/`thenAccept`）等，性能更优、灵活性更强，优先在生产环境中使用。

5.  **异步方法的访问权限**
    无论哪种返回值类型，异步方法必须是 `public` 修饰（`private`/`protected`/`default` 会导致 AOP 代理失效，异步功能不生效）。

四、 返回值选型指南
| 场景需求                  | 推荐返回值类型          | 理由                                                                 |
|---------------------------|-------------------------|----------------------------------------------------------------------|
| 无需获取结果，仅异步执行  | `void`                  | 实现简单，无额外开销                                                 |
| 简单获取单个任务结果      | `Future<T>`             | 满足基础需求，使用便捷                                               |
| 非阻塞获取结果、多任务组合 | `CompletableFuture<T>`  | 功能强大，支持链式编程和异步回调，性能更优（生产环境首选）           |
| Spring 生态深度集成       | `ListenableFuture<T>`   | 与 Spring 其他组件（如 `RestTemplate`）无缝集成，支持异步通知       |

总结
1.  `@Async` 异步方法返回值分为两类：`void`（无返回值）和 `Future` 及其子类（有返回值）；
2.  有返回值场景禁止使用普通类型，`CompletableFuture<T>` 是首选，支持非阻塞回调和多任务组合；
3.  `Future.get()` 是阻塞方法，可设置超时时间避免无限阻塞；
4.  异常处理分场景：`void` 类型用全局处理器，`Future` 子类类型手动捕获异常；
5.  异步方法必须为 `public` 修饰，否则异步功能失效。

#### 异常处理机制

Spring Boot @Async 异步方法异常处理机制详解

`@Async` 异步方法的异常处理因**返回值类型不同**而存在明显差异，核心分为「无返回值（void 类型）」和「有返回值（Future/CompletableFuture 子类）」两种场景，每种场景对应不同的处理方案，下面逐一拆解完整机制和实战用法。

一、 场景1：无返回值异步方法（void 类型）
1.  默认异常处理行为

无返回值的异步方法抛出异常时，异常会被 Spring 异步线程池捕获，默认仅在控制台打印异常堆栈日志（无业务层面的感知和处理），且异常不会向上传播到调用方线程，调用方无法通过 `try-catch` 直接捕获该异常，容易导致异常被静默忽略。

示例：默认异常行为（无法通过 try-catch 捕获）
```java
// 异步方法（void 类型）
@Service
public class AsyncVoidExceptionService {
    @Async("asyncTaskExecutor")
    public void doVoidAsyncTask(String taskName) {
        // 模拟异常抛出
        if (taskName.contains("error")) {
            throw new RuntimeException("异步任务【" + taskName + "】执行失败：触发模拟异常");
        }
        System.out.println("异步任务【" + taskName + "】执行成功");
    }
}

// 调用方（try-catch 无法捕获异常）
@RestController
@RequestMapping("/async/void")
public class AsyncVoidExceptionController {
    @Autowired
    private AsyncVoidExceptionService asyncService;

    @GetMapping
    public String testVoidAsync() {
        System.out.println("开始调用 void 类型异步方法");
        try {
            // 调用异步方法，异常不会被当前线程的 try-catch 捕获
            asyncService.doVoidAsyncTask("test-error-task");
        } catch (Exception e) {
            // 此处不会执行，异常已被异步线程池捕获
            System.err.println("调用方捕获到异常：" + e.getMessage());
        }
        System.out.println("void 类型异步方法调用完成，主线程继续执行");
        return "void 类型异步任务已提交";
    }
}
```

2.  解决方案：全局异步异常处理器

针对 `void` 类型异步方法，需通过实现 `AsyncUncaughtExceptionHandler` 接口自定义全局异常处理器，统一捕获和处理异常。通常结合 `AsyncConfigurer` 接口实现，与默认线程池配置整合。

步骤1：实现全局异常处理器（统一定制）
```java
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class AsyncGlobalExceptionConfig implements AsyncConfigurer {

    // 自定义默认异步线程池
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("Async-Exception-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    // 自定义全局异步异常处理器（仅处理 void 类型异步方法异常）
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new CustomAsyncUncaughtExceptionHandler();
    }

    // 自定义异常处理逻辑
    static class CustomAsyncUncaughtExceptionHandler implements AsyncUncaughtExceptionHandler {
        @Override
        public void handleUncaughtException(Throwable ex, Method method, Object... params) {
            // 1. 打印详细异常日志
            System.err.println("===== 全局异步异常捕获 =====");
            System.err.println("异常方法名称：" + method.getName());
            System.err.println("异常方法参数：" + java.util.Arrays.toString(params));
            System.err.println("异常类型：" + ex.getClass().getSimpleName());
            System.err.println("异常信息：" + ex.getMessage());
            System.err.println("异常堆栈：");
            ex.printStackTrace();

            // 2. 扩展业务逻辑（可选）
            // 如：钉钉告警、邮件通知、异常信息持久化到数据库等
            // sendDingDingAlert("异步方法执行异常：" + ex.getMessage());
        }
    }
}
```

3.  补充：单独注册全局异常处理器

若无需自定义默认线程池，仅需注册全局异常处理器，可直接将 `AsyncUncaughtExceptionHandler` 作为 Bean 注入容器：
```java
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.lang.reflect.Method;

@EnableAsync
@Configuration
public class AsyncSimpleExceptionConfig {

    // 单独注册全局异步异常处理器
    @Bean
    public AsyncUncaughtExceptionHandler asyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            System.err.println("简单全局异常处理器 - 方法：" + method.getName() + "，异常：" + ex.getMessage());
            ex.printStackTrace();
        };
    }
}
```

二、 场景2：有返回值异步方法（Future/CompletableFuture 子类）

1.  异常封装特性

有返回值的异步方法（返回 `Future<T>`/`CompletableFuture<T>` 等）抛出异常时，异常不会被全局异步异常处理器捕获，而是**自动封装在 `Future` 对象中**，直到调用方通过 `get()` 方法（或相关回调方法）获取结果时，才会将异常抛出。

2.  解决方案1：阻塞捕获（`get()` 方法 + try-catch）

通过 `Future.get()`（或带超时的 `get(long timeout, TimeUnit unit)`）方法获取结果时，用 `try-catch` 捕获异常，这是最基础的处理方式。

示例：Future<T> 异常捕获
```java
// 异步方法（返回 Future<T>）
@Service
public class AsyncFutureExceptionService {
    @Async("asyncTaskExecutor")
    public Future<String> doFutureAsyncTask(String taskName) {
        if (taskName.contains("error")) {
            throw new RuntimeException("Future 异步任务【" + taskName + "】执行失败");
        }
        return new org.springframework.scheduling.annotation.AsyncResult<>("Future 异步任务【" + taskName + "】执行成功");
    }
}

// 调用方（阻塞捕获异常）
@RestController
@RequestMapping("/async/future")
public class AsyncFutureExceptionController {
    @Autowired
    private AsyncFutureExceptionService futureService;

    @GetMapping
    public String testFutureAsync() {
        System.out.println("开始调用 Future 类型异步方法");
        Future<String> future = futureService.doFutureAsyncTask("test-error-future-task");

        try {
            // 获取结果时，异常会被抛出
            String result = future.get(3, java.util.concurrent.TimeUnit.SECONDS);
            System.out.println("Future 异步任务结果：" + result);
        } catch (Exception e) {
            // 捕获所有异常（ExecutionException 封装异步方法异常，TimeoutException 超时异常等）
            System.err.println("调用方捕获 Future 异步任务异常：" + e.getMessage());
            System.err.println("原始异常：" + e.getCause().getMessage());
            // 可选：取消异步任务
            future.cancel(true);
        }

        System.out.println("Future 类型异步方法调用流程结束");
        return "Future 类型异步任务处理完成";
    }
}
```

3.  解决方案2：非阻塞捕获
（CompletableFuture 回调方法）

`CompletableFuture<T>` 支持非阻塞回调处理异常，无需阻塞调用方线程，推荐在生产环境中使用，核心回调方法有 `whenComplete()`、`exceptionally()`。

示例：CompletableFuture<T> 非阻塞异常处理
```java
// 异步方法（返回 CompletableFuture<T>）
@Service
public class AsyncCompletableFutureExceptionService {
    @Async("asyncTaskExecutor")
    public CompletableFuture<String> doCompletableFutureAsyncTask(String taskName) {
        if (taskName.contains("error")) {
            // 直接返回失败的 CompletableFuture
            return CompletableFuture.failedFuture(new RuntimeException("CompletableFuture 异步任务【" + taskName + "】执行失败"));
        }
        // 返回成功的 CompletableFuture
        return CompletableFuture.completedFuture("CompletableFuture 异步任务【" + taskName + "】执行成功");
    }
}

// 调用方（非阻塞捕获异常）
@RestController
@RequestMapping("/async/completable")
public class AsyncCompletableFutureExceptionController {
    @Autowired
    private AsyncCompletableFutureExceptionService completableService;

    @GetMapping
    public String testCompletableFutureAsync() {
        System.out.println("开始调用 CompletableFuture 类型异步方法");

        // 1. whenComplete()：处理成功/失败结果（非阻塞）
        CompletableFuture<String> future1 = completableService.doCompletableFutureAsyncTask("test-error-completable-task");
        future1.whenComplete((result, throwable) -> {
            if (throwable != null) {
                // 异常处理逻辑
                System.err.println("非阻塞捕获异常（whenComplete）：" + throwable.getMessage());
            } else {
                // 成功处理逻辑
                System.out.println("非阻塞获取结果（whenComplete）：" + result);
            }
        });

        // 2. exceptionally()：仅处理异常，返回默认值（链式编程）
        CompletableFuture<String> future2 = completableService.doCompletableFutureAsyncTask("test-error-completable-task2")
                .exceptionally(ex -> {
                    System.err.println("非阻塞捕获异常（exceptionally）：" + ex.getMessage());
                    // 返回默认值，不中断链式调用
                    return "异步任务执行失败，返回默认值";
                })
                .thenApply(result -> {
                    System.out.println("链式处理结果：" + result);
                    return "最终结果：" + result;
                });

        // 可选：阻塞等待所有任务完成（按需使用）
        CompletableFuture.allOf(future1, future2).join();

        System.out.println("CompletableFuture 类型异步方法调用流程结束");
        return "CompletableFuture 类型异步任务处理完成";
    }
}
```

三、 关键注意事项（避坑指南）
1.  **异常处理器作用范围区分**
    -  全局异步异常处理器（`AsyncUncaughtExceptionHandler`）：仅对 `void` 类型异步方法生效，对 `Future` 子类类型异步方法无效；
    -  `try-catch`/回调方法：仅对 `Future` 子类类型异步方法生效，无法捕获 `void` 类型异步方法的异常。

2.  **避免异常静默丢失**
    -  `void` 类型异步方法：必须配置全局异常处理器，否则异常仅打印日志，无业务感知，容易遗漏问题；
    -  `Future` 子类类型异步方法：必须通过 `get()` 或回调方法处理异常，否则异常会被封装在 `Future` 中，永远不会被触发，导致问题隐藏。

3.  **带超时的异常处理**
    -  使用 `Future.get(long timeout, TimeUnit unit)` 时，需额外捕获 `TimeoutException`（超时异常），避免调用方线程无限阻塞；
    -  超时后可通过 `future.cancel(true)` 取消异步任务，释放线程资源。

4.  **CompletableFuture 异常传递**
    -  `CompletableFuture` 的链式编程中，若某一步抛出异常，后续步骤会直接触发异常处理逻辑（`whenComplete`/`exceptionally`），无需手动传递；
    -  `failedFuture()` 可直接返回失败的 `CompletableFuture`，比手动抛出异常更优雅。

5.  **异步方法访问权限影响**
    -  无论哪种返回值类型，异步方法必须是 `public` 修饰，否则 AOP 代理失效，异步功能不生效，异常处理机制也会同步失效。

四、 异常处理选型指南
| 异步方法返回值类型 | 推荐异常处理方案                | 适用场景                          | 优点                                  |
|--------------------|---------------------------------|-----------------------------------|---------------------------------------|
| `void`             | 全局异步异常处理器（`AsyncUncaughtExceptionHandler`） | 无需获取结果的异步任务（日志、消息发送） | 统一管理、无侵入、无需手动处理        |
| `Future<T>`        | `get()` 方法 + try-catch        | 简单需要获取结果的异步任务        | 实现便捷、兼容性好                    |
| `CompletableFuture<T>` | `whenComplete()`/`exceptionally()` | 复杂异步场景（多任务组合、非阻塞） | 非阻塞、支持链式编程、灵活性强（首选） |

总结
1.  `@Async` 异步方法异常处理分两大场景，核心差异在于返回值类型，需针对性选择处理方案；
2.  `void` 类型：依赖**全局异步异常处理器**统一捕获，避免异常静默丢失；
3.  `Future` 子类类型：异常封装在对象中，需通过 `get()`（阻塞）或 `CompletableFuture` 回调（非阻塞）处理，全局处理器不生效；
4.  生产环境首选：`CompletableFuture<T>` + `whenComplete()`/`exceptionally()`（非阻塞、功能强大），`void` 类型必须配置全局异常处理器。


### 线程池配置
#### 自定义线程池和任务调度

Spring Boot @Async 自定义线程池与任务调度详解

在 Spring Boot 异步处理中，**自定义线程池**是优化异步任务执行的核心（避免默认线程池的性能问题），而**任务调度**可配合线程池实现定时异步任务执行。下面从自定义线程池的核心配置、多种实现方式，到任务调度的整合使用，全面讲解实战方案。

一、 自定义线程池核心（为什么需要自定义？）

Spring 默认异步线程池是 `SimpleAsyncTaskExecutor`，其核心问题是**无线程复用**（每次提交任务都会创建新线程，任务完成后线程销毁），高并发场景下会导致线程数暴增、系统资源耗尽（CPU 上下文切换频繁、内存溢出等）。

自定义线程池基于 `ThreadPoolTaskExecutor`（封装 JUC 的 `ThreadPoolExecutor`），支持线程复用、任务排队、拒绝策略等核心特性，可根据业务场景精细化配置参数，是生产环境的必选方案。

二、 自定义线程池的三种实现方式

方式1：基础配置（独立 Bean 声明，推荐简单场景）

直接在 `@Configuration` 类中声明 `ThreadPoolTaskExecutor` 类型 Bean，无需实现额外接口，配置简洁，通过 `@Async("beanName")` 指定使用。

1.  线程池配置类
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

// 开启异步功能，使 @Async 生效
@EnableAsync
@Configuration
public class BasicAsyncThreadPoolConfig {

    /**
     * 自定义异步线程池
     * Bean 名称：businessAsyncExecutor（供 @Async 注解指定使用）
     */
    @Bean("businessAsyncExecutor")
    public Executor businessAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 1. 核心线程数：核心线程一直存活（即使空闲），除非设置 allowCoreThreadTimeOut=true
        // 配置建议：CPU 密集型任务（如计算）设为 CPU 核心数 ±1；I/O 密集型任务（如远程调用、文件操作）设为 CPU 核心数 * 2 + 1
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
        executor.setCorePoolSize(corePoolSize);

        // 2. 最大线程数：核心线程满 + 任务队列满后，可创建的最大线程数（不能小于核心线程数）
        executor.setMaxPoolSize(20);

        // 3. 任务队列容量：核心线程满后，任务存入该队列等待执行（基于阻塞队列实现）
        executor.setQueueCapacity(100);

        // 4. 线程空闲时间：非核心线程空闲超过该时间（秒）会被销毁，释放资源
        executor.setKeepAliveSeconds(60);

        // 5. 线程名称前缀：便于日志排查异步线程归属（推荐配置）
        executor.setThreadNamePrefix("Business-Async-Thread-");

        // 6. 拒绝策略：当 核心线程满 + 任务队列满 + 最大线程数满 时，处理新任务的策略
        // 可选策略：
        // - ThreadPoolExecutor.CallerRunsPolicy：由调用方主线程执行（推荐，避免任务丢失）
        // - ThreadPoolExecutor.AbortPolicy：抛出 RejectedExecutionException 异常（默认）
        // - ThreadPoolExecutor.DiscardPolicy：直接丢弃任务，无任何提示
        // - ThreadPoolExecutor.DiscardOldestPolicy：丢弃任务队列中最老的任务，再尝试提交当前任务
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 7. 可选配置：应用关闭时，等待所有任务执行完成后再关闭线程池
        executor.setWaitForTasksToCompleteOnShutdown(true);
        // 8. 可选配置：任务等待执行的超时时间（秒），超过该时间强制关闭
        executor.setAwaitTerminationSeconds(30);

        // 初始化线程池（必须调用，否则线程池不生效）
        executor.initialize();
        return executor;
    }

    // 可声明多个自定义线程池，适配不同业务场景（如日志专用、报表专用）
    @Bean("logAsyncExecutor")
    public Executor logAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("Log-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
```

2.  使用自定义线程池

在 `@Async` 注解中通过 `value` 属性指定线程池 Bean 名称即可：
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class BusinessAsyncService {

    // 使用业务专用线程池
    @Async("businessAsyncExecutor")
    public void doBusinessTask(String taskName) {
        System.out.println("业务线程池 - 任务【" + taskName + "】，线程名称：" + Thread.currentThread().getName());
        // 模拟耗时业务操作
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    // 使用日志专用线程池
    @Async("logAsyncExecutor")
    public void doLogTask(String logContent) {
        System.out.println("日志线程池 - 日志【" + logContent + "】，线程名称：" + Thread.currentThread().getName());
        // 模拟日志写入操作
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

方式2：高级配置（实现 AsyncConfigurer，默认线程池 + 全局异常处理）

通过实现 `AsyncConfigurer` 接口，可**统一定义默认异步线程池**（`@Async` 未指定线程池时自动使用），同时整合全局异步异常处理器，适合复杂场景的统一配置。

1.  高级线程池配置类
```java
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class AdvancedAsyncThreadPoolConfig implements AsyncConfigurer {

    /**
     * 默认异步线程池：@Async 未指定线程池时，自动使用该线程池
     */
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("Default-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * 全局异步异常处理器：仅处理 void 类型异步方法的异常
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            System.err.println("默认线程池 - 异步方法异常：" + method.getName() + "，异常信息：" + ex.getMessage());
            ex.printStackTrace();
        };
    }

    // 额外声明自定义线程池（按需扩展，支持多线程池共存）
    @Bean("reportAsyncExecutor")
    public Executor reportAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(150);
        executor.setThreadNamePrefix("Report-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

2.  使用说明
```java
@Service
public class AdvancedAsyncService {

    // 未指定线程池：使用 AsyncConfigurer 定义的默认线程池
    @Async
    public void doDefaultTask(String taskName) {
        System.out.println("默认线程池 - 任务【" + taskName + "】，线程名称：" + Thread.currentThread().getName());
    }

    // 指定线程池：使用报表专用线程池（优先级高于默认线程池）
    @Async("reportAsyncExecutor")
    public void doReportTask(String taskName) {
        System.out.println("报表线程池 - 任务【" + taskName + "】，线程名称：" + Thread.currentThread().getName());
    }
}
```

方式3：外部配置文件加载（动态配置，推荐生产环境）

将线程池参数（核心线程数、最大线程数等）配置在 `application.yml`/`application.properties` 中，通过 `@Value` 注解加载，实现参数动态调整（无需修改代码，重启应用即可生效）。

1.  application.yml 配置线程池参数
```yaml
# 自定义异步线程池参数
async:
  thread:
    pool:
      # 业务线程池
      business:
        core-pool-size: 8
        max-pool-size: 20
        queue-capacity: 100
        keep-alive-seconds: 60
        thread-name-prefix: Business-Async-Thread-
      # 定时任务线程池
      schedule:
        core-pool-size: 5
        max-pool-size: 10
        queue-capacity: 50
        keep-alive-seconds: 60
        thread-name-prefix: Schedule-Async-Thread-
```

2.  加载配置的线程池类
```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class ConfigFileAsyncThreadPoolConfig {

    // 加载业务线程池参数
    @Value("${async.thread.pool.business.core-pool-size}")
    private int businessCorePoolSize;
    @Value("${async.thread.pool.business.max-pool-size}")
    private int businessMaxPoolSize;
    @Value("${async.thread.pool.business.queue-capacity}")
    private int businessQueueCapacity;
    @Value("${async.thread.pool.business.keep-alive-seconds}")
    private int businessKeepAliveSeconds;
    @Value("${async.thread.pool.business.thread-name-prefix}")
    private String businessThreadNamePrefix;

    // 加载定时任务线程池参数
    @Value("${async.thread.pool.schedule.core-pool-size}")
    private int scheduleCorePoolSize;
    @Value("${async.thread.pool.schedule.max-pool-size}")
    private int scheduleMaxPoolSize;
    @Value("${async.thread.pool.schedule.queue-capacity}")
    private int scheduleQueueCapacity;
    @Value("${async.thread.pool.schedule.keep-alive-seconds}")
    private int scheduleKeepAliveSeconds;
    @Value("${async.thread.pool.schedule.thread-name-prefix}")
    private String scheduleThreadNamePrefix;

    // 业务异步线程池
    @Bean("businessAsyncExecutor")
    public Executor businessAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(businessCorePoolSize);
        executor.setMaxPoolSize(businessMaxPoolSize);
        executor.setQueueCapacity(businessQueueCapacity);
        executor.setKeepAliveSeconds(businessKeepAliveSeconds);
        executor.setThreadNamePrefix(businessThreadNamePrefix);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    // 定时任务异步线程池
    @Bean("scheduleAsyncExecutor")
    public Executor scheduleAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(scheduleCorePoolSize);
        executor.setMaxPoolSize(scheduleMaxPoolSize);
        executor.setQueueCapacity(scheduleQueueCapacity);
        executor.setKeepAliveSeconds(scheduleKeepAliveSeconds);
        executor.setThreadNamePrefix(scheduleThreadNamePrefix);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

三、 任务调度（定时异步任务）

Spring Boot 提供 `@Scheduled` 注解实现任务调度（定时执行），可配合自定义线程池实现**定时异步任务**（避免默认调度线程池的性能瓶颈）。

1.  前置配置：开启调度功能

在主启动类或配置类上添加 `@EnableScheduling` 注解，开启定时任务支持：
```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

// 开启异步 + 开启任务调度
@EnableAsync
@EnableScheduling
@SpringBootApplication
public class AsyncScheduleDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncScheduleDemoApplication.class, args);
    }
}
```

2.  核心：为调度任务指定自定义线程池

默认调度任务使用单线程池（`ScheduledExecutorService`），多个定时任务会串行执行（一个任务阻塞会导致其他任务延迟）。通过 `TaskScheduler` 配置自定义调度线程池，实现定时任务并行执行。

配置调度线程池
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.ScheduledExecutorService;

@EnableScheduling
@Configuration
public class ScheduledThreadPoolConfig {

    /**
     * 自定义调度线程池（替代默认单线程池）
     */
    @Bean
    public ThreadPoolTaskScheduler threadPoolTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10); // 调度线程池大小
        scheduler.setThreadNamePrefix("Custom-Schedule-Thread-"); // 线程名称前缀
        scheduler.setAwaitTerminationSeconds(30); // 关闭时等待任务执行时间
        scheduler.setWaitForTasksToCompleteOnShutdown(true); // 关闭时等待所有任务完成
        return scheduler;
    }
}
```

3.  定时异步任务实战

方式1：@Scheduled 直接使用调度线程池
```java
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTask {

    /**
     * 定时任务：每5秒执行一次
     * cron 表达式：秒 分 时 日 月 周 年（年可选）
     */
    @Scheduled(cron = "0/5 * * * * ?")
    public void doCronTask() {
        System.out.println("调度线程池 - 定时任务（每5秒），线程名称：" + Thread.currentThread().getName());
        // 模拟耗时调度操作
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 定时任务：固定延迟执行（上一个任务执行完成后，延迟1秒执行下一个）
     */
    @Scheduled(fixedDelay = 1000)
    public void doFixedDelayTask() {
        System.out.println("调度线程池 - 固定延迟任务，线程名称：" + Thread.currentThread().getName());
    }

    /**
     * 定时任务：固定速率执行（上一个任务开始后，间隔2秒执行下一个，无视任务执行时间）
     */
    @Scheduled(fixedRate = 2000)
    public void doFixedRateTask() {
        System.out.println("调度线程池 - 固定速率任务，线程名称：" + Thread.currentThread().getName());
    }
}
```

方式2：@Scheduled + @Async 实现异步调度（推荐）

将定时任务标记为 `@Async`，指定自定义异步线程池，实现“定时触发 + 异步执行”，进一步提升并发能力（调度线程仅负责触发任务，业务逻辑由异步线程池并行执行）。
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AsyncScheduledTask {

    /**
     * 异步定时任务：每3秒触发一次，由 scheduleAsyncExecutor 线程池执行
     */
    @Async("scheduleAsyncExecutor")
    @Scheduled(cron = "0/3 * * * * ?")
    public void doAsyncScheduledTask() {
        System.out.println("异步调度任务 - 每3秒，线程名称：" + Thread.currentThread().getName());
        // 模拟耗时业务操作（不会阻塞调度线程）
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

四、 关键注意事项（避坑指南）
1.  **线程池参数配置建议**
    -  核心线程数：CPU 密集型（计算任务）→ `CPU核心数 ±1`；I/O 密集型（远程调用、文件操作）→ `CPU核心数 * 2 + 1`；
    -  最大线程数：不宜过大（建议 10-50），过大易导致 CPU 上下文切换频繁，性能下降；
    -  队列容量：根据任务并发量配置（建议 50-200），过小易触发拒绝策略，过大易导致内存占用过高；
    -  拒绝策略：优先使用 `CallerRunsPolicy`，避免任务丢失，便于问题排查。

2.  **线程池初始化**
    -  `ThreadPoolTaskExecutor` 必须调用 `initialize()` 方法初始化（手动声明 Bean 时需显式调用，Spring 自动注入时会自动初始化），否则线程池不生效。

3.  **多线程池共存**
    -  可根据业务场景声明多个自定义线程池（如业务专用、日志专用、报表专用），通过 `@Async("beanName")` 精准指定，实现任务隔离，避免相互影响。

4.  **定时任务 cron 表达式**
    -  避免使用 `0 0 0 * * ?`（午夜执行）等高峰时段，可适当偏移（如 `0 0 1 * * ?`，凌晨1点），减少系统压力；
    -  特殊字符含义：`*`（所有值）、`?`（不指定值，用于日/周）、`/`（步长）、`-`（范围）、`,`（枚举值）。

5.  **异步调度任务的优势**
    -  `@Scheduled` 单独使用时，任务串行执行（默认单线程）；配合 `@Async` 后，任务并行执行，且耗时操作不会阻塞调度线程，避免定时任务延迟。

五、 总结
1.  自定义线程池优先使用 `ThreadPoolTaskExecutor`，替代默认 `SimpleAsyncTaskExecutor`，核心解决线程复用和资源管控问题；
2.  自定义线程池三种实现：基础 Bean 声明（简单场景）、实现 `AsyncConfigurer`（默认线程池 + 全局异常）、配置文件加载（动态参数，生产首选）；
3.  任务调度需开启 `@EnableScheduling`，通过 `ThreadPoolTaskScheduler` 配置自定义调度线程池，避免串行阻塞；
4.  最佳实践：`@Async("自定义线程池") + @Scheduled` 实现异步定时任务，兼顾定时触发和并行执行能力，适配高并发场景。


#### ThreadPoolTaskExecutor
ThreadPoolTaskExecutor 详解（Spring 异步线程池核心实现）

`ThreadPoolTaskExecutor` 是 Spring 框架对 JDK 原生 `ThreadPoolExecutor` 的**封装与增强**，是 Spring Boot 异步处理（`@Async`）和任务调度的首选线程池实现，相比原生线程池更易集成 Spring 生态，配置更简洁，还提供了额外的实用特性。

一、 核心定位与优势
1.  核心定位

`ThreadPoolTaskExecutor` 位于 `org.springframework.scheduling.concurrent` 包下，是 Spring 异步任务执行的核心载体，专门用于处理 `@Async` 标注的异步方法任务，也可配合 `@Scheduled` 实现定时异步任务。

2.  相比原生 `ThreadPoolExecutor` 的优势

    1.  **Spring 生态无缝集成**：可通过 `@Bean` 直接注入 Spring 容器，与 `@Async`、`@EnableAsync` 注解一键联动，无需手动管理线程池生命周期；
    2.  **配置简化**：提供直观的 setter 方法配置线程池参数（如核心线程数、最大线程数等），无需手动构建 `BlockingQueue` 等组件；
    3.  **额外生命周期特性**：支持“应用关闭时等待任务执行完成”“任务超时关闭”等实用功能，避免应用退出时任务丢失；
    4.  **线程名称可配置**：支持设置线程名称前缀，便于日志排查线程归属，提升问题定位效率；
    5.  **兼容性更强**：适配 Spring 的 `TaskExecutor` 接口，可灵活替换其他线程池实现，降低耦合。

二、 核心参数配置（必配/选配）

`ThreadPoolTaskExecutor` 的参数直接对应原生 `ThreadPoolExecutor` 的核心参数，同时扩展了部分实用配置，按优先级分为必配参数和选配参数：

1.  必配参数（核心功能，生产环境必须配置）

| 参数方法                | 对应原生 `ThreadPoolExecutor` 特性 | 作用说明                                                                 | 配置建议                                                                 |
|-------------------------|------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|
| `setCorePoolSize(int)`   | 核心线程数                         | 核心线程会**一直存活**（即使空闲），除非设置 `allowCoreThreadTimeOut=true` | CPU 密集型任务（计算类）：`Runtime.getRuntime().availableProcessors() ±1`；<br>I/O 密集型任务（远程调用、文件操作）：`Runtime.getRuntime().availableProcessors() * 2 + 1` |
| `setMaxPoolSize(int)`    | 最大线程数                         | 核心线程满 + 任务队列满后，可创建的最大线程数（不能小于核心线程数）       | 不宜过大（建议 10-50），过大易导致 CPU 上下文切换频繁，性能下降           |
| `setQueueCapacity(int)`  | 任务阻塞队列                       | 核心线程满后，任务存入该队列等待执行（默认 `LinkedBlockingQueue`）       | 根据任务并发量配置（建议 50-200），过小易触发拒绝策略，过大易占用过多内存 |
| `setRejectedExecutionHandler(RejectedExecutionHandler)` | 拒绝策略 | 当 核心线程满 + 任务队列满 + 最大线程数满 时，处理新任务的策略 | 优先使用 `ThreadPoolExecutor.CallerRunsPolicy`（调用方执行，避免任务丢失）；<br>其次 `AbortPolicy`（抛出异常，默认）；<br>不推荐 `DiscardPolicy`/`DiscardOldestPolicy`（静默丢弃任务） |
| `setThreadNamePrefix(String)` | 线程名称前缀 | 为线程池创建的线程设置名称前缀，便于日志排查 | 按业务命名（如 `Business-Async-`、`Log-Async-`），提升可维护性           |

2.  选配参数（优化功能，按需配置）

| 参数方法                          | 作用说明                                                                 | 默认值 |
|-----------------------------------|--------------------------------------------------------------------------|--------|
| `setKeepAliveSeconds(int)`        | 非核心线程空闲超时时间，超过该时间（秒）非核心线程会被销毁               | 60     |
| `setAllowCoreThreadTimeOut(boolean)` | 是否允许核心线程空闲超时销毁（开启后，核心线程也会按 `keepAliveSeconds` 销毁） | false  |
| `setWaitForTasksToCompleteOnShutdown(boolean)` | 应用关闭时，是否等待线程池中所有任务执行完成后再关闭线程池 | false  |
| `setAwaitTerminationSeconds(int)` | 应用关闭时，等待任务执行的超时时间（秒），超过该时间强制关闭线程池       | 0（不等待） |

3.  关键初始化方法

`ThreadPoolTaskExecutor` 必须调用 `initialize()` 方法完成初始化，否则线程池无法生效：
-  手动声明 Bean 时，需**显式调用**该方法（如配置类中）；
-  若通过 Spring 自动注入（如 `@Autowired`），Spring 会自动完成初始化，无需手动调用。

三、 三种常用配置方式（实战落地）

方式1：基础配置（独立 Bean 声明，简单场景首选）
直接在 `@Configuration` 类中声明 `ThreadPoolTaskExecutor` Bean，配置简洁，适用于单一业务场景或简单项目。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync // 开启异步功能，配合 @Async 使用
@Configuration
public class BasicThreadPoolConfig {

    /**
     * 基础自定义 ThreadPoolTaskExecutor
     * Bean 名称：basicAsyncExecutor（供 @Async("basicAsyncExecutor") 指定使用）
     */
    @Bean("basicAsyncExecutor")
    public Executor basicAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 必配参数
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
        executor.setCorePoolSize(corePoolSize); // 核心线程数
        executor.setMaxPoolSize(20); // 最大线程数
        executor.setQueueCapacity(100); // 任务队列容量
        executor.setThreadNamePrefix("Basic-Async-Thread-"); // 线程名称前缀
        // 拒绝策略：调用方主线程执行
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 选配参数
        executor.setKeepAliveSeconds(60); // 非核心线程空闲超时时间
        executor.setWaitForTasksToCompleteOnShutdown(true); // 应用关闭时等待任务完成
        executor.setAwaitTerminationSeconds(30); // 任务等待超时时间

        // 初始化线程池（必须调用，否则不生效）
        executor.initialize();
        return executor;
    }
}
```

方式2：高级配置（实现 AsyncConfigurer，默认线程池 + 全局异常）

通过实现 `AsyncConfigurer` 接口，将 `ThreadPoolTaskExecutor` 作为 Spring 异步默认线程池（`@Async` 未指定线程池时自动使用），同时整合全局异步异常处理器，适用于复杂项目的统一配置。

```java
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class AdvancedThreadPoolConfig implements AsyncConfigurer {

    /**
     * 默认异步线程池：@Async 未指定线程池时，自动使用该线程池
     */
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 核心参数配置
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("Default-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 优化参数配置
        executor.setKeepAliveSeconds(60);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.initialize();
        return executor;
    }

    /**
     * 全局异步异常处理器：仅处理 void 类型 @Async 方法的异常
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            System.err.println("默认线程池异常：方法[" + method.getName() + "]，异常信息：" + ex.getMessage());
            ex.printStackTrace();
        };
    }

    // 额外声明业务专用线程池（多线程池共存）
    @Bean("businessAsyncExecutor")
    public Executor businessAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(25);
        executor.setQueueCapacity(150);
        executor.setThreadNamePrefix("Business-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

方式3：动态配置（加载配置文件参数，生产环境首选）

将线程池参数配置在 `application.yml`/`application.properties` 中，通过 `@Value` 注解加载，实现参数动态调整（无需修改代码，重启应用即可生效），适用于生产环境的灵活配置。

步骤1：application.yml 配置参数
```yaml
# ThreadPoolTaskExecutor 配置
async:
  thread:
    pool:
      business:
        core-pool-size: 8
        max-pool-size: 20
        queue-capacity: 100
        keep-alive-seconds: 60
        thread-name-prefix: Business-Async-Thread-
      log:
        core-pool-size: 5
        max-pool-size: 10
        queue-capacity: 50
        thread-name-prefix: Log-Async-Thread-
```

步骤2：加载配置的线程池类
```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class DynamicThreadPoolConfig {

    // 加载业务线程池参数
    @Value("${async.thread.pool.business.core-pool-size}")
    private int businessCorePoolSize;
    @Value("${async.thread.pool.business.max-pool-size}")
    private int businessMaxPoolSize;
    @Value("${async.thread.pool.business.queue-capacity}")
    private int businessQueueCapacity;
    @Value("${async.thread.pool.business.keep-alive-seconds}")
    private int businessKeepAliveSeconds;
    @Value("${async.thread.pool.business.thread-name-prefix}")
    private String businessThreadNamePrefix;

    // 加载日志线程池参数
    @Value("${async.thread.pool.log.core-pool-size}")
    private int logCorePoolSize;
    @Value("${async.thread.pool.log.max-pool-size}")
    private int logMaxPoolSize;
    @Value("${async.thread.pool.log.queue-capacity}")
    private int logQueueCapacity;
    @Value("${async.thread.pool.log.thread-name-prefix}")
    private String logThreadNamePrefix;

    // 业务专用 ThreadPoolTaskExecutor
    @Bean("businessAsyncExecutor")
    public Executor businessAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(businessCorePoolSize);
        executor.setMaxPoolSize(businessMaxPoolSize);
        executor.setQueueCapacity(businessQueueCapacity);
        executor.setKeepAliveSeconds(businessKeepAliveSeconds);
        executor.setThreadNamePrefix(businessThreadNamePrefix);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    // 日志专用 ThreadPoolTaskExecutor
    @Bean("logAsyncExecutor")
    public Executor logAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(logCorePoolSize);
        executor.setMaxPoolSize(logMaxPoolSize);
        executor.setQueueCapacity(logQueueCapacity);
        executor.setThreadNamePrefix(logThreadNamePrefix);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

四、 核心使用方式（配合 @Async）
1.  指定线程池使用

在 `@Async` 注解中通过 `value` 属性指定 `ThreadPoolTaskExecutor` 的 Bean 名称，精准使用目标线程池：
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class BusinessService {

    // 使用业务专用线程池
    @Async("businessAsyncExecutor")
    public void doBusinessTask(String taskName) {
        System.out.println("业务线程池 - 任务[" + taskName + "]，线程名称：" + Thread.currentThread().getName());
        // 模拟耗时业务操作
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    // 使用日志专用线程池
    @Async("logAsyncExecutor")
    public void doLogTask(String logContent) {
        System.out.println("日志线程池 - 日志[" + logContent + "]，线程名称：" + Thread.currentThread().getName());
    }
}
```
2.  使用默认线程池

若 `@Async` 未指定线程池名称，会自动使用 `AsyncConfigurer` 接口配置的默认 `ThreadPoolTaskExecutor`：
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class DefaultService {

    // 未指定线程池，使用默认 ThreadPoolTaskExecutor
    @Async
    public void doDefaultTask(String taskName) {
        System.out.println("默认线程池 - 任务[" + taskName + "]，线程名称：" + Thread.currentThread().getName());
    }
}
```

五、 关键注意事项（避坑指南）
1.  **必须调用 `initialize()` 方法**
    手动声明 `ThreadPoolTaskExecutor` Bean 时，若未调用 `initialize()` 方法，线程池不会初始化，异步任务无法执行，且无明显异常（易踩坑）；Spring 自动注入时会自动调用该方法，无需手动处理。

2.  **参数配置合理性**
    -  最大线程数必须 **大于等于** 核心线程数，否则会抛出配置异常；
    -  队列容量不宜过大（如超过 1000），否则会导致内存占用过高，引发 OOM；
    -  拒绝策略优先选择 `CallerRunsPolicy`，避免高并发场景下任务静默丢失。

3.  **多线程池共存隔离**
    可根据业务场景声明多个 `ThreadPoolTaskExecutor`（如业务、日志、报表专用），通过 `@Async` 指定使用，实现任务隔离，避免某类任务阻塞影响其他业务。

4.  **与 `ThreadPoolTaskScheduler` 区分**
    -  `ThreadPoolTaskExecutor`：用于异步任务执行（`@Async`）；
    -  `ThreadPoolTaskScheduler`：用于定时任务调度（`@Scheduled`）；
    -  两者可配合使用（`@Async + @Scheduled`），实现定时异步任务。

5.  **避免使用默认构造的线程池**
    若直接 `new ThreadPoolTaskExecutor()` 而不配置核心参数，会使用默认值（核心线程数 1，最大线程数 `Integer.MAX_VALUE`），高并发下会创建大量线程，导致系统资源耗尽。

六、 总结
1.  `ThreadPoolTaskExecutor` 是 Spring 对 `ThreadPoolExecutor` 的封装增强，是 Spring 异步处理的首选线程池，适配 `@Async` 注解无缝使用；
2.  核心配置分为必配参数（核心线程数、最大线程数、队列容量、拒绝策略、线程名称前缀）和选配参数（空闲超时、关闭等待等），需根据业务场景合理配置；
3.  三种实用配置方式：基础 Bean 声明（简单场景）、实现 `AsyncConfigurer`（默认线程池 + 全局异常）、配置文件加载（动态参数，生产首选）；
4.  关键避坑点：必须调用 `initialize()` 初始化、合理配置参数、多线程池隔离、区分 `ThreadPoolTaskScheduler`。

#### 核心线程数设置
ThreadPoolTaskExecutor 核心线程数（corePoolSize）设置详解

核心线程数（`corePoolSize`）是 `ThreadPoolTaskExecutor` 的核心配置参数，决定了线程池中长期存活的最小线程数量（默认情况下核心线程不会因空闲而销毁），其设置是否合理直接影响系统并发性能和资源利用率，需根据任务类型精准配置。

一、 核心线程数的核心特性
1.  **存活特性**：默认情况下（`allowCoreThreadTimeOut = false`），核心线程会一直存活在线程池中，即使处于空闲状态也不会被销毁，避免了频繁创建/销毁线程的性能开销；若开启 `allowCoreThreadTimeOut = true`，核心线程会在空闲超过 `keepAliveSeconds` 后被销毁，适用于资源紧张的场景。
2.  **任务优先处理**：当有新任务提交时，线程池会优先使用核心线程执行任务，只有核心线程全部处于忙碌状态时，才会将任务存入任务队列。
3.  **配置基准**：核心线程数是线程池配置的基础，最大线程数（`maxPoolSize`）必须大于等于核心线程数，否则会抛出配置异常。

二、 核心配置原则：按任务类型划分

核心线程数的设置没有固定值，核心原则是 **根据任务的 CPU 密集型/IO 密集型属性，结合服务器 CPU 核心数进行计算**，这是最科学的配置依据。

1.  先获取服务器 CPU 核心数
Java 中可通过 `Runtime.getRuntime().availableProcessors()` 获取当前服务器的 CPU 核心数（逻辑核心数），这是配置核心线程数的基准值，代码示例：
```java
// 获取 CPU 逻辑核心数
int cpuCoreNum = Runtime.getRuntime().availableProcessors();
System.out.println("服务器 CPU 逻辑核心数：" + cpuCoreNum);
```

2.  场景1：CPU 密集型任务
（1） 任务特征
CPU 密集型任务（计算型任务）的核心是大量消耗 CPU 资源进行运算，几乎没有 IO 等待时间（如数据排序、加密解密、数学计算、大数据统计等），此时 CPU 上下文切换是性能瓶颈。

（2） 配置公式
核心线程数 = `CPU 核心数 ± 1`（推荐：`CPU 核心数 + 1`）
-  示例：服务器 CPU 核心数为 8，则核心线程数配置为 8 或 9。

（3） 配置原因
CPU 密集型任务中，线程数过多会导致 CPU 上下文切换频繁（线程切换需要保存/恢复线程状态，消耗 CPU 资源），反而降低整体性能；`CPU 核心数 ± 1` 的配置可让 CPU 资源得到最大化利用，同时避免单个线程异常导致的资源闲置。

（4） 代码配置示例
```java
@Bean("cpuIntensiveExecutor")
public Executor cpuIntensiveExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    // CPU 密集型任务：核心线程数 = CPU 核心数 + 1
    int corePoolSize = Runtime.getRuntime().availableProcessors() + 1;
    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(corePoolSize + 2); // 最大线程数略高于核心线程数
    executor.setQueueCapacity(50);
    executor.setThreadNamePrefix("CPU-Intensive-Thread-");
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();
    return executor;
}
```

3.  场景2：IO 密集型任务
（1） 任务特征

IO 密集型任务的核心是大量的 IO 等待时间，CPU 利用率较低（如数据库操作、远程接口调用、文件读写、消息发送、网络请求等），此时线程等待（IO 阻塞）是性能瓶颈。

（2） 配置公式

公式1（基础版）：核心线程数 = `CPU 核心数 * 2 + 1`
公式2（进阶版，更精准）：核心线程数 = `CPU 核心数 * (1 + 平均 IO 等待时间 / 平均 CPU 执行时间)`
-  示例1：服务器 CPU 核心数为 8，基础版配置为 `8 * 2 + 1 = 17`；
-  示例2：若平均 IO 等待时间为 10ms，平均 CPU 执行时间为 1ms，则进阶版配置为 `8 * (1 + 10/1) = 88`。

（3） 配置原因

IO 密集型任务中，线程大部分时间处于 IO 等待状态，CPU 处于空闲状态；适当增加核心线程数，可以让 CPU 同时处理更多的任务，提高 CPU 利用率和系统并发能力。`CPU 核心数 * 2 + 1` 是业界公认的基础最优配置，进阶版公式可根据实际业务的 IO/CPU 耗时比进一步优化。

（4） 代码配置示例
```java
@Bean("ioIntensiveExecutor")
public Executor ioIntensiveExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    // IO 密集型任务：核心线程数 = CPU 核心数 * 2 + 1
    int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(corePoolSize * 2); // 最大线程数为核心线程数的2倍
    executor.setQueueCapacity(200);
    executor.setThreadNamePrefix("IO-Intensive-Thread-");
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.setKeepAliveSeconds(60);
    executor.initialize();
    return executor;
}
```

三、 额外调整因素（生产环境适配）

除了核心的任务类型和 CPU 核心数，生产环境中还需结合以下因素微调核心线程数：
1.  **任务并发量**：若业务高峰期任务并发量较大，可在基础公式上适当增加核心线程数（如增加 20%-50%），避免任务大量堆积在队列中；
2.  **服务器资源限制**：若服务器内存较小（如 4G/8G），不宜配置过多核心线程数（每个线程默认栈大小为 1M），避免内存溢出；
3.  **任务优先级**：若该线程池处理核心业务任务（如订单支付、资金转账），可适当增加核心线程数，确保任务快速执行；若处理非核心任务（如日志记录、数据备份），可适当减少核心线程数，节省资源；
4.  **多线程池共存**：若应用中声明了多个 `ThreadPoolTaskExecutor`（如业务专用、日志专用、报表专用），需整体平衡各线程池的核心线程数，避免总线程数过多导致系统资源耗尽。

四、 避坑指南

1.  **避免固定值硬编码**：不推荐直接写死核心线程数（如 `executor.setCorePoolSize(10)`），应通过 `Runtime.getRuntime().availableProcessors()` 动态获取 CPU 核心数，适配不同服务器环境；
2.  **避免配置过大**：核心线程数并非越大越好，过多的线程会导致 CPU 上下文切换频繁、内存占用过高，反而降低系统性能；
3.  **避免配置过小**：核心线程数过小会导致大量任务堆积在任务队列中，任务执行延迟增加，无法充分利用系统资源；
4.  **配合最大线程数使用**：核心线程数配置后，需合理设置最大线程数（一般为核心线程数的 1-2 倍），避免核心线程和队列满后，无法创建额外线程处理任务。

五、 总结
1.  核心线程数（`corePoolSize`）是 `ThreadPoolTaskExecutor` 的核心配置，决定了线程池的基础并发能力，默认情况下核心线程长期存活；
2.  核心配置原则：按任务类型划分，结合 CPU 核心数计算，CPU 密集型（`CPU 核心数 ±1`），IO 密集型（基础版 `CPU 核心数*2+1`，进阶版按 IO/CPU 耗时比计算）；
3.  生产环境需结合任务并发量、服务器资源、任务优先级等因素微调配置，避免硬编码固定值；
4.  合理配置核心线程数的目标：最大化利用 CPU 和内存资源，同时避免线程过多导致的性能瓶颈。



#### 最大线程数配置
ThreadPoolTaskExecutor 最大线程数（maxPoolSize）配置详解

最大线程数（`maxPoolSize`）是 `ThreadPoolTaskExecutor` 的关键配置参数，决定了线程池能创建的**最大线程总量**，其配置合理性直接影响任务处理能力和系统资源稳定性，需基于核心线程数、任务类型和队列特性综合设定。

一、 最大线程数的核心特性
1.  **触发条件**：最大线程数并非初始化时就创建，而是当「核心线程全部忙碌」**且**「任务队列已满」时，线程池才会创建非核心线程，直到线程总数达到 `maxPoolSize`；若任务队列未填满，即使核心线程忙碌，也不会创建非核心线程。
2.  **生命周期特性**：非核心线程（超出 `corePoolSize` 的线程）会在空闲超过 `keepAliveSeconds` 后被销毁，而核心线程默认长期存活，因此线程池的实际线程数通常在 `corePoolSize` 到 `maxPoolSize` 之间波动。
3.  **配置约束**：`maxPoolSize` 必须 **大于等于核心线程数（`corePoolSize`）**，否则会抛出配置异常，无法初始化线程池。
4.  **与拒绝策略的关联**：当线程总数达到 `maxPoolSize`、核心线程忙碌、任务队列已满时，新提交的任务会触发拒绝策略，因此 `maxPoolSize` 配置不足易导致任务被拒绝或丢弃。

二、 核心配置原则：基于核心线程数 + 任务类型

最大线程数的配置以「核心线程数」为基础，结合任务的 CPU 密集型/IO 密集型属性调整，同时需兼顾任务队列的缓冲作用，核心公式和场景配置如下：

1.  先明确前置依赖

配置最大线程数前，需先确定两个关键值：
-  核心线程数（`corePoolSize`）：已按任务类型完成最优配置（CPU 密集型 `CPU核心数±1`，IO 密集型 `CPU核心数*2+1`）；
-  CPU 核心数：通过 `Runtime.getRuntime().availableProcessors()` 动态获取，避免硬编码适配不同服务器。

2.  场景1：CPU 密集型任务
（1） 任务特征

CPU 密集型任务（数据计算、排序、加密等）几乎无 IO 等待，CPU 利用率接近 100%，线程上下文切换是主要性能瓶颈，过多线程会导致性能下降。

（2） 配置公式

最大线程数 = `核心线程数（corePoolSize） + 1 ~ 2`（推荐：`corePoolSize + 1`）
-  简化公式：`CPU 核心数 + 2`（基于核心线程数 `CPU核心数+1` 推导）
-  示例：服务器 CPU 核心数为 8，核心线程数配置 9，则最大线程数配置 10~11 即可。

（3） 配置原因

CPU 密集型任务中，核心线程数已能最大化利用 CPU 资源，额外配置 1~2 个最大线程数，仅用于应对突发的少量任务峰值，避免因核心线程短暂阻塞导致任务堆积，同时不会因线程过多引发上下文切换性能损耗。

（4） 代码配置示例
```java
@Bean("cpuIntensiveMaxExecutor")
public Executor cpuIntensiveMaxExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    int cpuCoreNum = Runtime.getRuntime().availableProcessors();
    // CPU 密集型：核心线程数 = CPU核心数 + 1
    int corePoolSize = cpuCoreNum + 1;
    // 最大线程数 = 核心线程数 + 1
    int maxPoolSize = corePoolSize + 1;
    
    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(maxPoolSize);
    executor.setQueueCapacity(50); // CPU密集型任务队列容量不宜过大
    executor.setThreadNamePrefix("CPU-Intensive-Max-");
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();
    return executor;
}
```

3.  场景2：IO 密集型任务

（1） 任务特征

IO 密集型任务（数据库操作、远程调用、文件读写等）大部分时间处于 IO 等待状态，CPU 利用率较低，适当增加最大线程数可提高 CPU 利用率和任务并发处理能力。

（2） 配置公式

公式1（基础版，推荐）：最大线程数 = `核心线程数（corePoolSize） * 1 ~ 2`
公式2（进阶版，精准适配）：最大线程数 = `核心线程数（corePoolSize） + （任务峰值量 - 队列容量） / 单个线程处理速率`
-  简化公式：`(CPU 核心数 * 2 + 1) * 2`（基于核心线程数基础版推导）
-  示例1：CPU 核心数 8，核心线程数 17（8*2+1），则最大线程数配置 17~34；
-  示例2：任务峰值量 500，队列容量 200，单个线程每秒处理 10 个任务，则最大线程数 = 17 + (500-200)/10 = 47。

（3） 配置原因

IO 密集型任务中，线程大量时间处于空闲等待（IO 阻塞），核心线程数无法应对高并发任务峰值，将最大线程数设为核心线程数的 1~2 倍，可在队列满后快速创建非核心线程处理任务，同时避免线程数过多导致的资源耗尽；进阶版公式可根据实际业务的任务峰值和处理速率进一步优化。

（4） 代码配置示例
```java
@Bean("ioIntensiveMaxExecutor")
public Executor ioIntensiveMaxExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    int cpuCoreNum = Runtime.getRuntime().availableProcessors();
    // IO 密集型：核心线程数 = CPU核心数 * 2 + 1
    int corePoolSize = cpuCoreNum * 2 + 1;
    // 最大线程数 = 核心线程数 * 2（基础版最优配置）
    int maxPoolSize = corePoolSize * 2;
    
    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(maxPoolSize);
    executor.setQueueCapacity(200); // IO密集型任务队列可适当增大
    executor.setThreadNamePrefix("IO-Intensive-Max-");
    executor.setKeepAliveSeconds(60); // 非核心线程空闲超时时间
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();
    return executor;
}
```

三、 关键影响因素（生产环境微调）
1.  **任务队列容量（queueCapacity）**
    -  队列容量越小：任务越容易填满队列，进而触发最大线程数的创建，此时可适当降低最大线程数，避免线程暴增；
    -  队列容量越大：任务堆积在队列中的概率越高，触发最大线程数的场景越少，此时可适当提高最大线程数，应对突发的队列满负荷场景。
2.  **任务并发峰值**
    -  业务高峰期任务并发量较大（如电商秒杀、促销活动）：可在基础公式上增加 20%~50% 的最大线程数，避免任务触发拒绝策略；
    -  业务并发量稳定（如常规后台管理系统）：按基础公式配置即可，无需额外扩容。
3.  **服务器资源限制**
    -  内存大小：每个 Java 线程默认栈大小为 1M，最大线程数过多会导致内存占用过高（如 100 个线程占用约 100M 栈内存），若服务器内存较小（4G/8G），需适当降低最大线程数；
    -  CPU 负载：服务器同时运行其他核心服务（如中间件、数据库）时，需预留 CPU 资源，避免最大线程数过高导致 CPU 负载 100%。
4.  **多线程池共存**
    -  应用中若有多个 `ThreadPoolTaskExecutor`（业务、日志、报表等），需整体平衡所有线程池的最大线程数总和，避免总线程数超过服务器承载能力（推荐总线程数不超过 `CPU核心数*10`）。
5.  **任务执行耗时**
    -  任务执行耗时越长：线程释放越慢，此时需适当降低最大线程数，避免线程堆积；
    -  任务执行耗时越短：线程释放越快，可适当提高最大线程数，提升并发处理能力。

四、 避坑指南
1.  **禁止配置过小**
    最大线程数若小于核心线程数，会抛出配置异常；若仅略大于核心线程数（如 CPU 密集型配置核心 9、最大 10，IO 密集型配置核心 17、最大 18），在任务峰值时无法创建足够的非核心线程，导致任务大量触发拒绝策略。
2.  **禁止配置过大（无限扩容）**
    不推荐将最大线程数配置为 `Integer.MAX_VALUE` 或过大值（如 1000），这会导致高并发时线程数暴增，引发 CPU 上下文切换频繁、内存溢出（OOM）等严重问题，生产环境中最大线程数建议不超过 100（特殊高并发场景除外）。
3.  **禁止硬编码固定值**
    避免直接写死最大线程数（如 `executor.setMaxPoolSize(20)`），应基于 CPU 核心数和核心线程数动态计算，适配不同服务器环境（如测试环境 4 核 CPU、生产环境 16 核 CPU）。
4.  **避免忽略非核心线程超时时间**
    配置最大线程数后，需合理设置 `keepAliveSeconds`（非核心线程空闲超时时间），默认 60 秒即可，若未设置，非核心线程不会自动销毁，长期空闲会占用系统资源。
5.  **避免与队列容量不匹配**
    若队列容量配置过大（如 1000），而最大线程数配置较小（如 20），会导致任务大量堆积在队列中，任务执行延迟严重，最大线程数无法发挥作用；反之，队列容量过小、最大线程数过大，会导致非核心线程频繁创建和销毁，增加性能开销。

五、 总结
1.  最大线程数（`maxPoolSize`）是线程池的最大承载能力，仅在「核心线程满 + 任务队列满」时触发创建非核心线程，非核心线程支持空闲销毁；
2.  核心配置原则：以核心线程数为基础，CPU 密集型配置 `corePoolSize + 1~2`，IO 密集型配置 `corePoolSize * 1~2`，进阶版可按任务峰值和处理速率调整；
3.  生产环境需结合队列容量、任务并发峰值、服务器资源、多线程池共存等因素微调，避免配置过小或过大；
4.  关键目标：在充分利用系统资源处理任务的同时，避免线程过多导致的 CPU 上下文切换和内存溢出问题，兼顾任务处理能力和系统稳定性。

#### 队列容量管理
ThreadPoolTaskExecutor 队列容量（queueCapacity）全面管理指南

队列容量（`queueCapacity`）是 `ThreadPoolTaskExecutor` 的核心缓冲配置，对应底层阻塞队列（默认 `LinkedBlockingQueue`）的容量上限，用于临时存储「核心线程全部忙碌时」提交的异步任务。它的配置直接决定了任务执行延迟、线程池吞吐量和系统内存稳定性，需与核心线程数、最大线程数深度联动，结合任务特性精细化管控。

一、 队列容量的核心特性
1.  **任务缓冲优先级**：当新任务提交时，线程池会遵循「核心线程 → 任务队列 → 非核心线程 → 拒绝策略」的优先级，队列是核心线程后的第二道“缓冲防线”，能有效削峰填谷，避免非核心线程频繁创建与销毁。
2.  **最大线程数触发前提**：队列必须先被填满，线程池才会创建非核心线程（直到达到 `maxPoolSize`）。若队列容量过大，任务会持续堆积在队列中，最大线程数几乎无法生效；若队列容量过小，任务会快速触发非核心线程创建。
3.  **默认风险特性**：`ThreadPoolTaskExecutor` 若不主动配置 `queueCapacity`，默认使用无界队列（容量 `Integer.MAX_VALUE`），会导致任务无限堆积，最终引发内存溢出（OOM），生产环境必须配置有界队列。
4.  **内存关联特性**：队列中的每个任务都会占用一定内存（存储任务引用或任务本身数据），队列容量越大，任务堆积时的内存占用越高，需结合服务器内存资源合理配置。
5.  **与拒绝策略的联动**：只有当「核心线程满 + 队列满 + 最大线程数满」时，新任务才会触发拒绝策略。队列容量过小易导致任务被快速拒绝，队列容量过大易导致任务延迟堆积。

二、 核心配置原则：按任务类型精准设定

队列容量的配置不能孤立进行，需以「核心线程数（`corePoolSize`）」为基础，结合任务的 CPU 密集型/IO 密集型属性差异化配置，核心公式和实战示例如下：

1.  前置准备（配置前必明确）

-  先获取服务器 CPU 逻辑核心数：`Runtime.getRuntime().availableProcessors()`（动态适配不同服务器，避免硬编码）；
-  先完成核心线程数、最大线程数配置：队列容量是这两个参数的补充，需基于它们调整。

2.  场景1：CPU 密集型任务（计算类）

（1） 任务特征

无明显 IO 等待时间，CPU 利用率接近 100%，任务执行速度快、周转效率高（如数据排序、加密解密、数学运算等）。

（2） 配置公式

队列容量 = `核心线程数 * 5 ~ 10`（推荐最优值：`corePoolSize * 5`）
-  简化推导：CPU 密集型核心线程数为 `CPU核心数 ± 1`，因此队列容量可简化为 `(CPU核心数 + 1) * 5`；
-  示例：CPU 核心数 8，核心线程数 9，队列容量配置 45（9*5），区间范围 45~90。

（3） 配置原因

CPU 密集型任务执行耗时短，核心线程能快速释放并处理队列中的任务，无需过大的队列：
-  过小队列（< 核心线程数*5）：任务快速填满队列，触发非核心线程创建，导致 CPU 上下文切换频繁，降低性能；
-  过大队列（> 核心线程数*10）：任务冗余堆积，增加内存占用，同时让最大线程数失去用武之地，无性能收益。

（4） 代码配置示例
```java
@Bean("cpuIntensiveQueueExecutor")
public Executor cpuIntensiveQueueExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    int cpuCoreNum = Runtime.getRuntime().availableProcessors();
    // CPU 密集型参数配置
    int corePoolSize = cpuCoreNum + 1;
    int maxPoolSize = corePoolSize + 1;
    int queueCapacity = corePoolSize * 5; // 队列容量核心配置

    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(maxPoolSize);
    executor.setQueueCapacity(queueCapacity);
    executor.setThreadNamePrefix("CPU-Queue-Thread-");
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize(); // 必须初始化
    return executor;
}
```

3.  场景2：IO 密集型任务（读写类）
（1） 任务特征

大部分时间处于 IO 阻塞状态（数据库操作、远程接口调用、文件读写、消息发送等），CPU 利用率低，任务执行速度慢、周转效率低。

（2） 配置公式

-  基础版（推荐，通用场景）：队列容量 = `核心线程数 * 10 ~ 20`（最优值：`corePoolSize * 15`）；
-  进阶版（精准适配业务峰值）：队列容量 = `任务峰值量 - 核心线程数 - 非核心线程数`（非核心线程数 = `maxPoolSize - corePoolSize`）；
-  简化推导：IO 密集型核心线程数为 `CPU核心数 * 2 + 1`，队列容量可简化为 `(CPU核心数 * 2 + 1) * 15`；
-  示例1：CPU 核心数 8，核心线程数 17，队列容量配置 255（17*15），区间范围 170~340；
-  示例2：任务峰值 500，核心线程数 17，非核心线程数 17，队列容量 = 500-17-17=466。

（3） 配置原因

IO 密集型任务执行耗时长，核心线程易长期忙碌，需要更大的队列缓冲任务峰值：
-  配置 `corePoolSize * 10 ~ 20`：既能容纳突发任务，避免频繁创建非核心线程；
-  进阶版公式：基于业务实际峰值计算，可精准平衡“缓冲能力”和“执行效率”，避免任务延迟或被拒绝。

（4） 代码配置示例
```java
@Bean("ioIntensiveQueueExecutor")
public Executor ioIntensiveQueueExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    int cpuCoreNum = Runtime.getRuntime().availableProcessors();
    // IO 密集型参数配置
    int corePoolSize = cpuCoreNum * 2 + 1;
    int maxPoolSize = corePoolSize * 2;
    int queueCapacity = corePoolSize * 15; // 队列容量核心配置

    executor.setCorePoolSize(corePoolSize);
    executor.setMaxPoolSize(maxPoolSize);
    executor.setQueueCapacity(queueCapacity);
    executor.setThreadNamePrefix("IO-Queue-Thread-");
    executor.setKeepAliveSeconds(60);
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize(); // 必须初始化
    return executor;
}
```

三、 队列容量与线程池参数的联动关系

队列容量并非独立配置，需与 `corePoolSize`、`maxPoolSize` 形成协同，三者的匹配度直接决定线程池的工作效率：
1.  任务提交执行优先级（核心规则）
    1.  优先使用**空闲核心线程**执行任务；
    2.  核心线程全部忙碌 → 任务存入**队列**（直到队列填满）；
    3.  队列填满 → 创建**非核心线程**执行任务（直到线程总数达到 `maxPoolSize`）；
    4.  线程总数达到 `maxPoolSize` → 新任务触发**拒绝策略**。

2.  三者匹配对照表

| 队列容量配置       | 核心线程数 | 最大线程数       | 适用场景                          | 潜在问题                          |
|--------------------|------------|------------------|-----------------------------------|-----------------------------------|
| 小队列（< core*5） | 适中       | 略大于核心线程数 | CPU 密集型、任务执行快            | 易触发非核心线程创建，增加上下文切换开销 |
| 中等队列（core*5~20） | 适中     | 核心线程数1~2倍  | 通用场景、IO 密集型（推荐）       | 兼顾缓冲能力和线程利用率，最优匹配 |
| 大队列（> core*20） | 适中       | 较小             | 任务允许延迟、并发峰值稳定        | 任务大量堆积，执行延迟严重，最大线程数失效 |
| 无界队列（Integer.MAX_VALUE） | 任意 | 任意 | 无推荐场景（禁止生产使用） | 任务无限堆积，引发 OOM，系统崩溃 |

四、 生产环境微调因素
1.  **任务延迟容忍度**
    -  允许延迟（日志记录、数据备份）：适当增大队列容量（如 core*20），减少非核心线程创建；
    -  不允许延迟（订单支付、实时查询）：适当减小队列容量（如 core*10），快速触发最大线程数，提升执行速度。

2.  **服务器内存限制**
    -  小内存（4G/8G）：队列容量不宜过大（建议 < 500），避免任务堆积时内存溢出；
    -  大内存（16G/32G）：可根据任务峰值适当增大（建议 < 1000），提升缓冲能力。

3.  **任务大小与执行耗时**
    -  任务体积小、耗时短（简单数据校验）：减小队列容量，提高任务周转效率；
    -  任务体积大、耗时长（大文件解析、复杂报表）：增大队列容量，避免频繁触发拒绝策略。

4.  **多线程池共存**
    -  应用中有多个 `ThreadPoolTaskExecutor` 时，需平衡所有队列总容量，避免任务总堆积量过大；
    -  推荐所有线程池队列总容量不超过 `CPU核心数*100`。

5.  **业务高峰期特性**
    -  高峰期短（电商秒杀 10 分钟）：增大队列容量，缓冲突发峰值；
    -  高峰期长（电商大促 24 小时）：增大最大线程数，适当减小队列容量，避免任务长期堆积。

五、 避坑指南（核心禁忌）
1.  **严禁使用无界队列**
    切勿不配置 `queueCapacity` 或配置为 `Integer.MAX_VALUE`，这是生产环境 OOM 的常见诱因，必须配置有界队列。

2.  **严禁队列与任务特性不匹配**
    -  CPU 密集型配大队列：任务冗余堆积，执行延迟，最大线程数失效；
    -  IO 密集型配小队列：任务快速触发拒绝策略，或非核心线程频繁创建/销毁，增加性能开销。

3.  **严禁忽略与最大线程数的联动**
    队列容量过大（如 1000）+ 最大线程数过小（如 20），会导致任务大量堆积在队列中，最大线程数无法发挥作用，任务延迟严重。

4.  **严禁硬编码固定值**
    避免直接写死 `executor.setQueueCapacity(100)`，应基于 CPU 核心数动态计算，适配测试环境（4 核）、生产环境（16 核）等不同部署环境。

5.  **严禁忽视任务堆积监控**
    需监控队列实时任务数（`getQueue().size()`）、剩余容量（`getQueue().remainingCapacity()`），若出现持续堆积，需及时调整队列容量或最大线程数。

六、 监控与动态调整

1.  核心监控指标
-  队列当前任务数：反映任务堆积情况，持续高位说明队列容量不足或线程数不够；
-  队列剩余容量：反映队列缓冲余量，持续为 0 说明队列已满，需扩容；
-  任务拒绝数：反映队列容量是否过小，拒绝数激增需增大队列容量或最大线程数；
-  任务执行延迟：反映队列容量是否过大，延迟过高需减小队列容量，快速触发非核心线程。

2.  动态调整方案
-  基础方案：将队列容量配置在 `application.yml` 中，通过 `@Value` 加载，重启应用即可生效；
  ```yaml
  async:
    thread:
      pool:
        queue-capacity: 255
  ```
-  进阶方案：使用 Nacos/Spring Cloud Config 配置中心，结合 `@RefreshScope` 实现队列容量动态刷新，无需重启应用，适配业务峰值变化。

七、 总结
1.  队列容量是 `ThreadPoolTaskExecutor` 的核心缓冲配置，遵循「核心线程 > 队列 > 非核心线程 > 拒绝策略」的任务执行优先级；
2.  核心配置原则：CPU 密集型配 `corePoolSize*5~10`，IO 密集型配 `corePoolSize*10~20`，进阶版按任务峰值精准计算；
3.  关键联动：队列容量需与 `corePoolSize`、`maxPoolSize` 匹配，避免配置过大或过小；
4.  生产核心要求：必须使用有界队列、避免硬编码、做好监控与动态调整，兼顾任务缓冲能力和执行效率；
5.  管理目标：在不引发内存溢出的前提下，最小化任务执行延迟，最大化线程池资源利用率。


### 任务调度
#### @Scheduled注解
Spring Boot @Scheduled 注解（任务调度核心）详解

`@Scheduled` 是 Spring 框架提供的任务调度核心注解，用于实现**定时自动执行**的任务（如定时统计数据、定时备份、定时推送消息等），无需手动触发，可灵活配置执行时机，配合 Spring Boot 实现快速集成。

一、 前置条件：开启调度功能

使用 `@Scheduled` 注解前，必须在主启动类或 `@Configuration` 配置类上添加 `@EnableScheduling` 注解，开启 Spring 的任务调度功能，否则 `@Scheduled` 注解不生效。

代码示例（主启动类）
```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// 开启任务调度功能
@EnableScheduling
@SpringBootApplication
public class ScheduledDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScheduledDemoApplication.class, args);
    }
}
```

二、 @Scheduled 核心配置方式

`@Scheduled` 支持多种配置方式，用于指定任务的执行时机，核心分为 **cron 表达式**、**固定延迟**、**固定速率** 三种，可根据业务场景灵活选择。


4.  补充：初始延迟（initialDelay）
`initialDelay` 可配合 `fixedDelay` 或 `fixedRate` 使用，表示**应用启动后，延迟指定毫秒数才开始执行第一个任务**，避免应用启动初期（资源未加载完成）就执行定时任务。

代码示例
```java
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InitialDelayScheduledTask {

    /**
     * 初始延迟5秒，之后固定延迟1秒执行任务
     */
    @Scheduled(initialDelay = 5000, fixedDelay = 1000)
    public void doTaskWithInitialDelay() {
        System.out.println("带初始延迟的任务：执行中，当前时间：" + System.currentTimeMillis());
    }
}
```

三、 关键特性与进阶配置
1.  默认执行机制：单线程串行执行

Spring 调度任务的默认线程池是**单线程池**（`ScheduledExecutorService`），所有 `@Scheduled` 注解的任务都会在这一个线程中串行执行：
-  若某个任务执行耗时过长（如阻塞），会导致后续所有定时任务延迟执行；
-  不存在任务并行执行的情况，避免线程安全问题，但并发性能较低。

2.  进阶：配置自定义调度线程池（并行执行）

为了解决默认单线程的性能瓶颈，可配置 `ThreadPoolTaskScheduler` 自定义调度线程池，实现多个定时任务并行执行。

（1） 配置自定义调度线程池
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@EnableScheduling
@Configuration
public class ScheduledThreadPoolConfig {

    /**
     * 自定义调度线程池，替代默认单线程池
     */
    @Bean
    public ThreadPoolTaskScheduler threadPoolTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10); // 线程池大小，根据任务数量配置
        scheduler.setThreadNamePrefix("Custom-Scheduled-Thread-"); // 线程名称前缀，便于日志排查
        scheduler.setAwaitTerminationSeconds(30); // 应用关闭时，等待任务执行完成的超时时间
        scheduler.setWaitForTasksToCompleteOnShutdown(true); // 应用关闭时，是否等待所有任务执行完成
        return scheduler;
    }
}
```

（2） 并行执行效果

配置自定义线程池后，不同的 `@Scheduled` 任务会在不同的线程中并行执行，某个任务阻塞不会影响其他任务的执行时机。

3.  终极优化：@Scheduled + @Async（定时异步任务）

将 `@Scheduled` 与 `@Async` 注解结合使用，实现「定时触发任务 + 异步执行任务」的分离：
-  调度线程池仅负责**触发任务**（轻量操作，不会阻塞）；
-  业务逻辑由 `@Async` 指定的异步线程池**并行执行**（提升并发性能）；
-  彻底解决任务执行耗时过长导致的调度延迟问题。

（1） 代码示例
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AsyncScheduledTask {

    /**
     * 定时触发（每3秒）+ 异步执行（由自定义异步线程池执行）
     */
    @Async("businessAsyncExecutor") // 指定自定义异步线程池
    @Scheduled(cron = "0/3 * * * * ?")
    public void doAsyncScheduledTask() {
        System.out.println("定时异步任务：执行中，线程名称：" + Thread.currentThread().getName());
        // 模拟耗时业务逻辑（不会阻塞调度线程）
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

四、 避坑指南（核心禁忌）
1.  **忘记添加 @EnableScheduling**
    这是最常见的错误，若未开启调度功能，`@Scheduled` 注解完全不生效，任务不会被定时触发，需确保主启动类或配置类上添加该注解。

2.  **任务类未注入 Spring 容器**
    `@Scheduled` 注解只能作用于 Spring 容器管理的 Bean 上（如标注 `@Component`/`@Service`/`@Controller` 的类），若类未被 Spring 扫描并注入，注解不生效。

3.  **任务方法带有参数**
    `@Scheduled` 注解标注的方法必须是 **无参方法**，若带有参数（如 `public void doTask(String param)`），会抛出异常，导致任务无法执行。

4.  **默认单线程的性能陷阱**
    若依赖默认单线程池，当多个任务存在时，某个任务阻塞（如数据库查询超时）会导致所有后续任务延迟，生产环境务必配置自定义调度线程池或使用 `@Async` 异步执行。

5.  **cron 表达式配置错误**
    -  「日」和「周」不能同时指定具体值，需用 `?` 忽略其中一个（如 `0 0 8 1 * ?` 正确，`0 0 8 1 * 1` 错误，会引发冲突）；
    -  注意周的配置差异（部分环境 `0` 代表周日，部分环境 `1` 代表周日，需测试验证）；
    -  避免配置 `0 0 0 * * ?`（午夜执行）等系统高峰时段，可适当偏移（如 `0 0 1 * * ?`）。

6.  **任务执行耗时超过调度间隔（fixedRate）**
    若 `fixedRate` 配置的间隔小于任务执行耗时，在默认单线程下，下一个任务会等待当前任务完成后立即执行，导致任务堆积，需合理评估任务耗时或使用 `fixedDelay`。

五、 总结
1.  `@Scheduled` 是 Spring 定时任务的核心注解，使用前必须通过 `@EnableScheduling` 开启调度功能，且任务类需注入 Spring 容器；
2.  核心配置方式有3种：cron 表达式（灵活适配复杂场景）、fixedDelay（串行执行，依赖上一个任务结束）、fixedRate（并行执行，依赖上一个任务开始）；
3.  初始延迟 `initialDelay` 可避免应用启动初期执行任务，提升系统稳定性；
4.  默认单线程存在性能瓶颈，生产环境推荐两种优化方案：配置 `ThreadPoolTaskScheduler` 自定义调度线程池、`@Scheduled + @Async` 实现定时异步任务；
5.  避坑关键：避免方法带参、正确配置 cron 表达式、规避默认单线程阻塞、合理评估任务耗时。

#### Cron表达式
方式1：cron 表达式（最灵活，推荐复杂场景）
`cron` 表达式是最强大的配置方式，支持精准配置任务执行的「秒、分、时、日、月、周、年」（年可选），适用于复杂的定时场景（如每天凌晨1点执行、每周日晚8点执行等）。

（1） cron 表达式格式
```
秒   分   时   日   月   周   年（可选，省略时默认每年）
0    0    1    *    *    ?    *   （含义：每天凌晨1点执行）
```

（2） 核心特殊字符含义

| 特殊字符 | 含义说明 | 示例 |
|----------|----------|------|
| `*`      | 匹配所有值（表示每一个单位都执行） | 秒位配置 `*` → 每秒执行一次 |
| `?`      | 不指定值（仅用于「日」和「周」，避免冲突） | 日位配置 `?` → 不限制具体日期 |
| `/`      | 步长（表示每隔多少个单位执行） | 秒位配置 `0/5` → 每5秒执行一次 |
| `-`      | 范围（表示在某个区间内执行） | 分位配置 `10-15` → 第10到15分钟每分钟执行 |
| `,`      | 枚举（表示指定多个离散值执行） | 周位配置 `1,3,5` → 周一、周三、周五执行 |

（3） 常用 cron 表达式示例

| 业务需求 | cron 表达式 | 说明 |
|----------|-------------|------|
| 每5秒执行 | `0/5 * * * * ?` | 从0秒开始，每隔5秒执行一次 |
| 每分钟第30秒执行 | `30 * * * * ?` | 每分钟的第30秒执行一次 |
| 每天凌晨1点执行 | `0 0 1 * * ?` | 秒0、分0、时1，每日执行 |
| 每天上午8点30分执行 | `0 30 8 * * ?` | 秒0、分30、时8，每日执行 |
| 每周日晚20点执行 | `0 0 20 ? * 1` | 周1代表周日（部分环境用0代表周日，需注意适配） |
| 每月1号凌晨0点执行 | `0 0 0 1 * ?` | 日位配置1，每月1号执行 |

（4） 代码示例
```java
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 必须将类注入Spring容器（@Component/@Service等），否则@Scheduled不生效
@Component
public class CronScheduledTask {

    /**
     * 每5秒执行一次定时任务
     */
    @Scheduled(cron = "0/5 * * * * ?")
    public void doCronTask() {
        System.out.println("cron表达式任务：每5秒执行，当前时间：" + System.currentTimeMillis());
        // 业务逻辑：如定时查询数据、推送消息等
    }

    /**
     * 每天凌晨1点执行定时任务
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void doDailyTask() {
        System.out.println("cron表达式任务：每天凌晨1点执行，当前时间：" + System.currentTimeMillis());
        // 业务逻辑：如定时备份数据库、统计昨日数据等
    }
}
```


#### 固定延迟执行
方式2：固定延迟（fixedDelay）

`fixedDelay` 表示**上一个任务执行完成后，延迟指定毫秒数再执行下一个任务**，适用于需要保证任务执行顺序（串行执行）、且任务执行耗时不稳定的场景。

核心特性

-  任务执行依赖上一个任务的结束时间，不存在任务重叠执行的情况；
-  配置值为 `long` 类型，单位是 **毫秒**（如 `fixedDelay = 1000` 表示延迟1秒）。

代码示例
```java
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FixedDelayScheduledTask {

    /**
     * 固定延迟任务：上一个任务执行完成后，延迟1秒执行下一个任务
     */
    @Scheduled(fixedDelay = 1000)
    public void doFixedDelayTask() {
        System.out.println("固定延迟任务：执行中，当前时间：" + System.currentTimeMillis());
        // 模拟任务执行耗时（随机耗时，体现fixedDelay的特性）
        try {
            Thread.sleep((long) (Math.random() * 2000));
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

#### 固定频率执行
方式3：固定速率（fixedRate）

`fixedRate` 表示**上一个任务开始执行后，间隔指定毫秒数就执行下一个任务**，不依赖上一个任务是否执行完成，适用于任务执行耗时稳定、允许并行执行的场景。

核心特性
-  任务执行不依赖上一个任务的结束时间，仅依赖开始时间，可能存在任务重叠执行的情况（默认单线程调度下不会重叠，多线程调度下可能重叠）；
-  配置值为 `long` 类型，单位是 **毫秒**（如 `fixedRate = 2000` 表示每隔2秒执行一次）。

代码示例
```java
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FixedRateScheduledTask {

    /**
     * 固定速率任务：上一个任务开始后，每隔2秒执行下一个任务
     */
    @Scheduled(fixedRate = 2000)
    public void doFixedRateTask() {
        System.out.println("固定速率任务：执行中，当前时间：" + System.currentTimeMillis());
        // 模拟任务执行耗时（若耗时超过2秒，下一个任务会等待当前任务完成后立即执行）
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

### 异步回调
#### CompletableFuture
CompletableFuture 异步回调详解（Spring Boot 异步编程进阶）

`CompletableFuture` 是 Java 8 引入的异步编程核心类，基于 `Future` 接口做了大幅增强，原生支持**异步回调**、链式编程、多任务组合等能力，完美解决了传统 `Future` 获取结果阻塞、无法链式处理的痛点，是 Spring Boot 异步编程（配合 `@Async`）的最优实践之一。

一、 CompletableFuture 核心优势

相比传统 `Future` 和 Spring 异步 `@Async` 基础用法，`CompletableFuture` 的核心优势体现在：
1.  **非阻塞异步回调**：无需通过 `get()` 方法阻塞等待结果，可通过回调方法（如 `whenComplete`、`thenApply` 等）在任务完成后自动触发后续处理；
2.  **链式编程支持**：多个异步任务可形成链式依赖，上一个任务的结果直接作为下一个任务的入参，代码简洁优雅；
3.  **多任务组合能力**：支持 `allOf`（所有任务完成）、`anyOf`（任一任务完成）等组合操作，轻松处理多异步任务协同场景；
4.  **异常统一处理**：提供 `exceptionally` 等方法，可优雅捕获异步任务执行过程中的异常，避免异常静默丢失；
5.  **灵活的线程池指定**：可自定义线程池（如 `ThreadPoolTaskExecutor`），避免使用默认公共线程池（`ForkJoinPool.commonPool()`）导致的资源竞争。

二、 核心异步回调方法（实战分类）

`CompletableFuture` 提供了丰富的回调方法，按功能可分为「结果消费」「结果转换」「异常处理」三大类，以下是常用核心方法的实战示例。

前置准备：自定义异步线程池

推荐使用 `ThreadPoolTaskExecutor` 作为 `CompletableFuture` 的执行线程池，避免使用默认线程池：
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class CompletableFutureThreadPoolConfig {

    @Bean("completableFutureExecutor")
    public Executor completableFutureExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(corePoolSize * 2);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("CompletableFuture-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
```

1.  结果消费型：仅消费结果，不返回新值

这类方法只对异步任务的结果进行消费处理，无返回值，核心方法为 `whenComplete`（处理成功+异常）、`thenAccept`（仅处理成功）。

（1） `whenComplete`：处理成功结果 + 异常

最常用的回调方法，任务执行完成后（无论成功还是失败）都会触发，可同时处理成功结果和异常信息，非阻塞。
-  第一个参数：成功时的任务结果；
-  第二个参数：异常信息（任务成功时为 `null`，失败时为具体异常）。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureConsumeService {

    @Autowired
    @Qualifier("completableFutureExecutor")
    private Executor customExecutor;

    /**
     * 异步任务 + whenComplete 回调（消费结果+处理异常）
     */
    public void doTaskWithWhenComplete() {
        // 1. 提交异步任务
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务执行中，线程名称：" + Thread.currentThread().getName());
            // 模拟业务逻辑：返回字符串结果（可模拟异常，注释下面一行，打开异常行测试）
            return "异步任务执行成功";
            // 模拟异常场景
            // int i = 1 / 0;
            // return "异步任务执行成功";
        }, customExecutor); // 指定自定义线程池

        // 2. 异步回调：whenComplete（非阻塞）
        asyncTask.whenComplete((result, ex) -> {
            if (ex == null) {
                // 任务成功：消费结果
                System.out.println("whenComplete 回调：任务成功，结果为：" + result);
                // 后续业务处理：如日志记录、消息推送等
            } else {
                // 任务失败：处理异常
                System.err.println("whenComplete 回调：任务失败，异常信息：" + ex.getMessage());
                ex.printStackTrace();
            }
        });

        // 主线程不阻塞，可继续执行其他逻辑
        System.out.println("主线程继续执行，无需等待异步任务完成");
    }

    /**
     * 异步任务 + thenAccept 回调（仅消费成功结果）
     */
    public void doTaskWithThenAccept() {
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务执行中，线程名称：" + Thread.currentThread().getName());
            return "异步任务执行成功";
        }, customExecutor);

        // thenAccept：仅在任务成功时触发，消费结果，无返回值
        asyncTask.thenAccept(result -> {
            System.out.println("thenAccept 回调：任务成功，结果为：" + result);
        });

        System.out.println("主线程继续执行");
    }
}
```

2.  结果转换型：消费结果，返回新值

这类方法在消费异步任务结果的同时，会转换结果并返回一个新的 `CompletableFuture`，支持链式编程，核心方法为 `thenApply`。

（1） `thenApply`：结果转换 + 链式编程

任务成功执行后触发，接收上一个任务的结果，返回一个新的结果，形成链式依赖，非阻塞。
-  入参：上一个任务的成功结果；
-  返回值：新的结果，封装在新的 `CompletableFuture` 中。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureTransformService {

    @Autowired
    @Qualifier("completableFutureExecutor")
    private Executor customExecutor;

    /**
     * 异步任务 + thenApply 链式转换
     * 场景：任务1返回用户ID → 任务2根据用户ID查询用户信息 → 任务3格式化用户信息
     */
    public void doTaskWithThenApply() {
        // 任务1：生成用户ID
        CompletableFuture<Long> userIdTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务1执行：生成用户ID，线程：" + Thread.currentThread().getName());
            return 1001L; // 模拟用户ID
        }, customExecutor);

        // 任务2：thenApply 转换，根据用户ID查询用户信息（依赖任务1结果）
        CompletableFuture<String> userInfoTask = userIdTask.thenApply(userId -> {
            System.out.println("任务2执行：根据ID " + userId + " 查询用户信息，线程：" + Thread.currentThread().getName());
            return "用户ID：" + userId + "，用户名：张三，年龄：25"; // 模拟用户信息
        });

        // 任务3：thenApply 链式转换，格式化用户信息（依赖任务2结果）
        CompletableFuture<String> formatUserTask = userInfoTask.thenApply(userInfo -> {
            System.out.println("任务3执行：格式化用户信息，线程：" + Thread.currentThread().getName());
            return "【格式化用户信息】：" + userInfo;
        });

        // 回调消费最终结果
        formatUserTask.whenComplete((finalResult, ex) -> {
            if (ex == null) {
                System.out.println("最终结果：" + finalResult);
            } else {
                System.err.println("任务失败：" + ex.getMessage());
            }
        });

        System.out.println("主线程无需等待，直接执行后续逻辑");
    }
}
```

3.  异常处理型：优雅捕获异步任务异常

核心方法为 `exceptionally`（异常补偿，返回默认值）、`handle`（成功+异常处理，支持返回默认值），避免异常静默丢失。

（1） `exceptionally`：异常补偿，返回默认值

任务执行失败时触发，可返回一个默认值，作为任务的最终结果，不中断链式编程。
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureExceptionService {

    @Autowired
    @Qualifier("completableFutureExecutor")
    private Executor customExecutor;

    /**
     * 异步任务 + exceptionally 异常补偿
     */
    public void doTaskWithExceptionally() {
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务执行中，线程：" + Thread.currentThread().getName());
            // 模拟任务异常
            int i = 1 / 0;
            return "异步任务执行成功";
        }, customExecutor);

        // exceptionally：任务失败时触发，返回默认值
        CompletableFuture<String> resultTask = asyncTask.exceptionally(ex -> {
            System.err.println("exceptionally 回调：任务异常，信息：" + ex.getMessage());
            return "任务执行失败，返回默认值"; // 异常补偿，返回默认结果
        });

        // 消费最终结果（成功结果或异常默认值）
        resultTask.thenAccept(finalResult -> {
            System.out.println("最终结果：" + finalResult);
        });
    }

    /**
     * handle：同时处理成功结果和异常，支持返回默认值
     * 类似 whenComplete + exceptionally 的组合，区别：handle 有返回值，whenComplete 无返回值
     */
    public void doTaskWithHandle() {
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务执行中，线程：" + Thread.currentThread().getName());
            // 模拟异常（注释此行测试成功场景）
            int i = 1 / 0;
            return "异步任务执行成功";
        }, customExecutor);

        // handle：无论成功失败都触发，有返回值
        CompletableFuture<String> resultTask = asyncTask.handle((result, ex) -> {
            if (ex == null) {
                return "handle 处理成功：" + result;
            } else {
                System.err.println("handle 处理异常：" + ex.getMessage());
                return "handle 异常补偿：返回默认值";
            }
        });

        resultTask.thenAccept(finalResult -> {
            System.out.println("最终结果：" + finalResult);
        });
    }
}
```

三、 多任务组合回调（实战常用场景）

`CompletableFuture` 支持多异步任务的组合处理，核心为 `allOf`（所有任务完成后回调）和 `anyOf`（任一任务完成后回调），解决多任务协同问题。

1.  `allOf`：所有任务完成后统一回调

适用于需要等待多个异步任务全部完成后，再进行统一处理的场景（如批量查询、多服务接口聚合）。
-  特点：等待所有任务完成（无论成功还是失败），无返回值，需手动获取每个任务的结果；
-  可配合 `join()` 方法（非阻塞，区别于 `get()` 的阻塞）获取任务结果。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureCombineService {

    @Autowired
    @Qualifier("completableFutureExecutor")
    private Executor customExecutor;

    /**
     * allOf：所有任务完成后统一回调
     * 场景：批量查询3个用户的信息，全部查询完成后进行聚合处理
     */
    public void doTaskWithAllOf() {
        // 1. 提交多个异步任务
        CompletableFuture<String> user1Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询用户1信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户1：张三";
        }, customExecutor);

        CompletableFuture<String> user2Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询用户2信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户2：李四";
        }, customExecutor);

        CompletableFuture<String> user3Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询用户3信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(800);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户3：王五";
        }, customExecutor);

        // 2. 组合所有任务：allOf
        CompletableFuture<Void> allTask = CompletableFuture.allOf(user1Task, user2Task, user3Task);

        // 3. 所有任务完成后回调
        allTask.whenComplete((voidResult, ex) -> {
            if (ex == null) {
                System.out.println("所有任务执行完成，开始聚合结果");
                // 获取每个任务的结果（join() 非阻塞，不会抛出检查性异常）
                String user1 = user1Task.join();
                String user2 = user2Task.join();
                String user3 = user3Task.join();

                // 聚合结果
                List<String> userList = new ArrayList<>();
                userList.add(user1);
                userList.add(user2);
                userList.add(user3);
                System.out.println("聚合后的用户列表：" + userList);
            } else {
                System.err.println("存在任务执行失败，异常信息：" + ex.getMessage());
            }
        });

        System.out.println("主线程无需等待所有任务完成，直接执行");
    }

    /**
     * anyOf：任一任务完成后立即回调
     * 场景：多服务查询同一数据，取最快返回的结果（如多数据源备份查询）
     */
    public void doTaskWithAnyOf() {
        // 1. 提交多个异步任务
        CompletableFuture<String> dataSource1Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("从数据源1查询数据，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(2000); // 模拟耗时2秒
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "数据源1：用户数据";
        }, customExecutor);

        CompletableFuture<String> dataSource2Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("从数据源2查询数据，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000); // 模拟耗时1秒（最快完成）
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "数据源2：用户数据";
        }, customExecutor);

        CompletableFuture<String> dataSource3Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("从数据源3查询数据，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1500); // 模拟耗时1.5秒
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "数据源3：用户数据";
        }, customExecutor);

        // 2. 组合任务：anyOf（任一任务完成即触发）
        CompletableFuture<Object> anyTask = CompletableFuture.anyOf(dataSource1Task, dataSource2Task, dataSource3Task);

        // 3. 任一任务完成后回调
        anyTask.whenComplete((result, ex) -> {
            if (ex == null) {
                System.out.println("最快完成的任务结果：" + result);
                // 直接使用最快返回的结果，无需等待其他任务
            } else {
                System.err.println("所有任务均执行失败，异常信息：" + ex.getMessage());
            }
        });

        System.out.println("主线程无需等待，直接执行");
    }
}
```

四、 与 Spring @Async 结合使用

`CompletableFuture` 可与 Spring `@Async` 注解无缝结合，既享受 `@Async` 的便捷性，又拥有 `CompletableFuture` 的异步回调能力。

实战示例
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureWithAsyncService {

    @Autowired
    @Qualifier("completableFutureExecutor")
    private Executor customExecutor;

    /**
     * @Async 注解返回 CompletableFuture
     */
    @Async("completableFutureExecutor")
    public CompletableFuture<String> asyncTaskWithCompletableFuture(Long userId) {
        System.out.println("@Async 异步任务执行中，用户ID：" + userId + "，线程：" + Thread.currentThread().getName());
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        // 返回 CompletableFuture 结果
        return CompletableFuture.completedFuture("用户ID：" + userId + "，查询成功");
    }

    /**
     * 调用 @Async 方法，使用 CompletableFuture 回调
     */
    public void invokeAsyncTask() {
        CompletableFuture<String> asyncResult = asyncTaskWithCompletableFuture(1001L);

        // 异步回调处理
        asyncResult.whenComplete((result, ex) -> {
            if (ex == null) {
                System.out.println("回调结果：" + result);
            } else {
                System.err.println("任务失败：" + ex.getMessage());
            }
        });

        System.out.println("主线程继续执行");
    }
}
```

五、 避坑指南
1.  **避免使用默认线程池**
    切勿直接使用 `CompletableFuture.supplyAsync(Runnable)`（无线程池参数），默认使用 `ForkJoinPool.commonPool()`，该线程池为公共线程池，易与其他任务产生资源竞争，生产环境务必指定自定义线程池。

2.  **区分 `join()` 与 `get()`**
    -  `join()`：非阻塞方法，不会抛出检查性异常（无需 `try-catch`），推荐在回调中获取任务结果；
    -  `get()`：阻塞方法，会抛出 `InterruptedException` 和 `ExecutionException` 检查性异常，尽量避免使用（除非确需阻塞等待）。

3.  **异常不丢失的关键**
    异步任务的异常不会自动抛出，必须通过 `whenComplete`、`exceptionally`、`handle` 等方法处理，否则异常会静默丢失，难以排查。

4.  **链式编程的线程模型**
    默认情况下，链式任务（`thenApply` 等）会在当前任务的线程中执行，若需指定线程池，可使用带线程池参数的重载方法（如 `thenApplyAsync(result -> {}, customExecutor)`）。

5.  **`allOf` 不返回聚合结果**
    `CompletableFuture.allOf()` 的返回值是 `CompletableFuture<Void>`，无业务结果，需手动通过 `join()` 逐个获取单个任务的结果进行聚合。

六、 总结
1.  `CompletableFuture` 是 Java 异步编程的核心类，核心优势是非阻塞异步回调、链式编程、多任务组合，解决了传统 `Future` 的痛点；
2.  核心回调方法分为三类：结果消费（`whenComplete`、`thenAccept`）、结果转换（`thenApply`）、异常处理（`exceptionally`、`handle`）；
3.  多任务组合常用 `allOf`（所有任务完成）和 `anyOf`（任一任务完成），适配批量处理、多源查询等场景；
4.  生产环境务必指定自定义 `ThreadPoolTaskExecutor`，避免使用默认公共线程池，同时配合异常处理方法防止异常丢失；
5.  可与 Spring `@Async` 无缝结合，兼顾便捷性和高性能，是 Spring Boot 异步编程的最优实践。

#### 异步链式调用
CompletableFuture 异步链式调用详解（实战进阶）

异步链式调用是 `CompletableFuture` 的核心特性之一，它允许将多个异步任务按依赖关系串联起来，上一个任务的结果自动作为下一个任务的入参，实现**非阻塞、无耦合、优雅的异步流程编排**，彻底解决了传统异步编程中回调嵌套（回调地狱）的问题。

一、 异步链式调用核心优势
1.  **无回调地狱**：替代传统嵌套回调，代码按业务流程线性编排，可读性和可维护性大幅提升；
2.  **非阻塞执行**：整个链式流程无需阻塞等待中间结果，每个任务完成后自动触发下一个任务，充分利用系统资源；
3.  **灵活线程控制**：支持指定单个任务的执行线程池，可根据任务特性（CPU/IO 密集型）灵活分配资源；
4.  **统一异常处理**：链式流程中任意任务抛出异常，可通过统一的异常处理方法捕获，避免异常静默丢失；
5.  **结果自动传递**：上一个任务的返回结果自动传递给下一个任务，无需手动获取和传递，简化代码开发。

二、 核心链式调用方法（分类实战）

`CompletableFuture` 提供了丰富的链式调用方法，按功能可分为「结果转换」「结果消费」「任务编排」三大类，其中带 `Async` 后缀的方法支持指定自定义线程池，适配高并发场景。

前置准备：自定义线程池（生产环境必备）
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class ChainThreadPoolConfig {

    // 核心业务线程池
    @Bean("businessExecutor")
    public Executor businessExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(corePoolSize * 2);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("Business-Chain-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    // 格式化/辅助任务线程池
    @Bean("formatExecutor")
    public Executor formatExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int corePoolSize = Runtime.getRuntime().availableProcessors() + 1;
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(corePoolSize * 2);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("Format-Chain-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

1.  结果转换型：`thenApply` / `thenApplyAsync`（有返回值，核心）

这类方法是最常用的链式调用方法，用于**将上一个任务的结果转换为新的结果**，并返回一个新的 `CompletableFuture`，支持链式串联多个转换任务。
-  `thenApply`：默认在**上一个任务的线程**中执行当前任务（非异步新线程）；
-  `thenApplyAsync`：在**指定线程池（或默认线程池）**中异步执行当前任务，推荐生产环境使用，避免线程阻塞。

实战场景：用户信息查询 → 格式化 → 权限校验（链式转换）
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class ChainTransformService {

    @Autowired
    @Qualifier("businessExecutor")
    private Executor businessExecutor;

    @Autowired
    @Qualifier("formatExecutor")
    private Executor formatExecutor;

    /**
     * 异步链式调用：thenApplyAsync（结果转换，指定线程池）
     * 流程：生成用户ID → 查询用户基础信息 → 格式化用户信息 → 校验用户权限
     */
    public void userInfoChainTask() {
        // 步骤1：生成用户ID（异步任务，指定业务线程池）
        CompletableFuture<Long> userIdTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1：生成用户ID，线程：" + Thread.currentThread().getName());
            return 1001L; // 模拟用户ID
        }, businessExecutor);

        // 步骤2：根据用户ID查询用户基础信息（链式转换，指定业务线程池）
        CompletableFuture<String> userBaseInfoTask = userIdTask.thenApplyAsync(userId -> {
            System.out.println("步骤2：查询用户ID=" + userId + "的基础信息，线程：" + Thread.currentThread().getName());
            // 模拟数据库查询耗时
            try {
                Thread.sleep(800);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户ID：" + userId + "，姓名：张三，年龄：25"; // 模拟用户基础信息
        }, businessExecutor);

        // 步骤3：格式化用户基础信息（链式转换，指定格式化线程池）
        CompletableFuture<String> formatUserInfoTask = userBaseInfoTask.thenApplyAsync(userBaseInfo -> {
            System.out.println("步骤3：格式化用户信息，线程：" + Thread.currentThread().getName());
            // 模拟格式化耗时
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "【用户信息】：" + userBaseInfo + "，创建时间：2026-01-03";
        }, formatExecutor);

        // 步骤4：校验用户权限（链式转换，指定业务线程池）
        CompletableFuture<String> userAuthTask = formatUserInfoTask.thenApplyAsync(formatUserInfo -> {
            System.out.println("步骤4：校验用户权限，线程：" + Thread.currentThread().getName());
            // 模拟权限校验耗时
            try {
                Thread.sleep(600);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return formatUserInfo + "，权限：管理员";
        }, businessExecutor);

        // 最终回调：消费链式流程的最终结果
        userAuthTask.whenComplete((finalResult, ex) -> {
            if (ex == null) {
                System.out.println("链式调用执行成功，最终结果：" + finalResult);
            } else {
                System.err.println("链式调用执行失败，异常信息：" + ex.getMessage());
                ex.printStackTrace();
            }
        });

        // 主线程非阻塞，继续执行其他逻辑
        System.out.println("主线程无需等待链式任务完成，直接执行后续操作");
    }
}
```

2.  结果消费型：`thenAccept` / `thenAcceptAsync`（无返回值）

这类方法仅**消费上一个任务的结果，不返回新的结果**（返回 `CompletableFuture<Void>`），适用于链式流程的最后一步（仅处理结果，无后续转换）。
-  `thenAccept`：在当前任务线程执行消费逻辑；
-  `thenAcceptAsync`：在指定线程池异步执行消费逻辑。

实战场景：链式转换后消费最终结果
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class ChainConsumeService {

    @Autowired
    @Qualifier("businessExecutor")
    private Executor businessExecutor;

    /**
     * 链式调用：thenApplyAsync（转换） + thenAcceptAsync（消费）
     * 流程：商品ID → 查询商品信息 → 计算商品价格 → 消费最终价格信息
     */
    public void productPriceChainTask() {
        // 步骤1：获取商品ID
        CompletableFuture<Long> productIdTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1：获取商品ID，线程：" + Thread.currentThread().getName());
            return 2001L;
        }, businessExecutor);

        // 步骤2：查询商品基础信息
        CompletableFuture<String> productInfoTask = productIdTask.thenApplyAsync(productId -> {
            System.out.println("步骤2：查询商品ID=" + productId + "的信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(700);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "商品ID：" + productId + "，名称：笔记本电脑，原价：5999元";
        }, businessExecutor);

        // 步骤3：计算商品最终价格（优惠后）
        CompletableFuture<Double> productPriceTask = productInfoTask.thenApplyAsync(productInfo -> {
            System.out.println("步骤3：计算商品最终价格，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(400);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            double originalPrice = 5999.0;
            double discount = 0.8; // 8折优惠
            return originalPrice * discount;
        }, businessExecutor);

        // 步骤4：消费最终价格（无返回值，链式流程结束）
        CompletableFuture<Void> consumeTask = productPriceTask.thenAcceptAsync(finalPrice -> {
            System.out.println("步骤4：消费商品价格结果，线程：" + Thread.currentThread().getName());
            System.out.println("商品最终优惠价格：" + finalPrice + "元");
            // 后续业务：如日志记录、消息推送等（仅消费，无返回）
        }, businessExecutor);

        // 异常处理
        consumeTask.exceptionally(ex -> {
            System.err.println("商品价格链式任务执行失败：" + ex.getMessage());
            return null;
        });

        System.out.println("主线程继续执行，不阻塞");
    }
}
```

3.  任务编排型：`thenCompose` / `thenComposeAsync`（嵌套任务扁平化）

当**一个异步任务的执行依赖另一个异步任务的结果，且内部返回 `CompletableFuture`**时，使用 `thenCompose` 可将嵌套的 `CompletableFuture` 扁平化（避免 `CompletableFuture<CompletableFuture<T>>` 嵌套结构），比 `thenApply` 更优雅。
-  `thenCompose`：同步执行嵌套任务；
-  `thenComposeAsync`：异步执行嵌套任务。

实战场景：用户ID → 查询用户订单（异步任务） → 查询订单详情（异步任务）
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class ChainComposeService {

    @Autowired
    @Qualifier("businessExecutor")
    private Executor businessExecutor;

    /**
     * 异步查询用户订单（返回 CompletableFuture）
     */
    private CompletableFuture<String> queryUserOrder(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务：查询用户ID=" + userId + "的订单，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户ID：" + userId + "，订单号：ORDER_20260103_001";
        }, businessExecutor);
    }

    /**
     * 异步查询订单详情（返回 CompletableFuture）
     */
    private CompletableFuture<String> queryOrderDetail(String orderNo) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务：查询订单号=" + orderNo + "的详情，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(800);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return orderNo + "，商品：笔记本电脑，金额：5999元，状态：已支付";
        }, businessExecutor);
    }

    /**
     * 链式调用：thenComposeAsync（扁平化嵌套异步任务）
     * 流程：用户ID → 查询用户订单（异步） → 查询订单详情（异步） → 消费结果
     */
    public void userOrderChainTask() {
        // 步骤1：生成用户ID
        CompletableFuture<Long> userIdTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1：生成用户ID，线程：" + Thread.currentThread().getName());
            return 1001L;
        }, businessExecutor);

        // 步骤2：查询用户订单（嵌套异步任务，使用 thenComposeAsync 扁平化）
        CompletableFuture<String> orderTask = userIdTask.thenComposeAsync(userId -> {
            // queryUserOrder 返回 CompletableFuture<String>，thenCompose 自动扁平化
            return queryUserOrder(userId);
        }, businessExecutor);

        // 步骤3：查询订单详情（继续扁平化嵌套异步任务）
        CompletableFuture<String> orderDetailTask = orderTask.thenComposeAsync(orderNo -> {
            // 提取订单号（简化处理，实际可解析字符串）
            String realOrderNo = orderNo.split("，")[1].split("：")[1];
            return queryOrderDetail(realOrderNo);
        }, businessExecutor);

        // 步骤4：消费订单详情
        orderDetailTask.whenComplete((orderDetail, ex) -> {
            if (ex == null) {
                System.out.println("订单详情链式查询成功，结果：" + orderDetail);
            } else {
                System.err.println("订单详情链式查询失败：" + ex.getMessage());
            }
        });

        System.out.println("主线程非阻塞执行");
    }
}
```

4.  双任务组合型：`thenCombine` / `thenCombineAsync`（两个任务结果合并）

当需要**等待两个独立的异步任务完成后，合并它们的结果并进行处理**时，使用 `thenCombine`，适用于无依赖关系的双任务组合场景。

实战场景：查询用户信息 + 查询商品信息 → 合并生成订单信息
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class ChainCombineService {

    @Autowired
    @Qualifier("businessExecutor")
    private Executor businessExecutor;

    /**
     * 异步查询用户信息
     */
    private CompletableFuture<String> queryUserInfo(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("查询用户信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户ID：" + userId + "，姓名：张三";
        }, businessExecutor);
    }

    /**
     * 异步查询商品信息
     */
    private CompletableFuture<String> queryProductInfo(Long productId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("查询商品信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(800);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "商品ID：" + productId + "，名称：笔记本电脑，价格：5999元";
        }, businessExecutor);
    }

    /**
     * 链式调用：thenCombineAsync（合并两个独立任务结果）
     */
    public void orderCombineChainTask() {
        // 任务1：查询用户信息（独立任务，无依赖）
        CompletableFuture<String> userInfoTask = queryUserInfo(1001L);

        // 任务2：查询商品信息（独立任务，无依赖）
        CompletableFuture<String> productInfoTask = queryProductInfo(2001L);

        // 合并两个任务结果：thenCombineAsync
        CompletableFuture<String> orderTask = userInfoTask.thenCombineAsync(productInfoTask,
                (userInfo, productInfo) -> {
                    System.out.println("合并用户信息和商品信息，线程：" + Thread.currentThread().getName());
                    // 合并结果生成订单信息
                    return "【订单信息】\n" + userInfo + "\n" + productInfo + "\n订单状态：待支付";
                }, businessExecutor);

        // 消费合并后的结果
        orderTask.whenComplete((orderInfo, ex) -> {
            if (ex == null) {
                System.out.println("订单信息生成成功：\n" + orderInfo);
            } else {
                System.err.println("订单信息生成失败：" + ex.getMessage());
            }
        });

        System.out.println("主线程非阻塞执行");
    }
}
```

三、 链式调用的异常处理（全局统一捕获）

链式流程中任意一个任务抛出异常，会终止后续任务执行，可通过 `exceptionally` 或 `handle` 方法实现**全局异常捕获**，保证流程健壮性。

1.  `exceptionally`：异常补偿（返回默认值）
```java
public void chainExceptionallyTask() {
    CompletableFuture<Long> userIdTask = CompletableFuture.supplyAsync(() -> {
        System.out.println("生成用户ID");
        return 1001L;
    }, businessExecutor);

    CompletableFuture<String> userInfoTask = userIdTask.thenApplyAsync(userId -> {
        System.out.println("查询用户信息，ID=" + userId);
        // 模拟异常
        int i = 1 / 0;
        return "用户ID：" + userId + "，姓名：张三";
    }, businessExecutor);

    // 异常补偿：链式流程中任意任务异常，均会触发此处
    CompletableFuture<String> resultTask = userInfoTask.exceptionally(ex -> {
        System.err.println("链式任务异常：" + ex.getMessage());
        return "默认用户信息（异常补偿）";
    });

    // 消费结果（正常结果或异常默认值）
    resultTask.thenAccept(result -> {
        System.out.println("最终结果：" + result);
    });
}
```

2.  `handle`：成功/异常统一处理（有返回值）
```java
public void chainHandleTask() {
    CompletableFuture<Long> userIdTask = CompletableFuture.supplyAsync(() -> {
        System.out.println("生成用户ID");
        return 1001L;
    }, businessExecutor);

    CompletableFuture<String> userInfoTask = userIdTask.thenApplyAsync(userId -> {
        System.out.println("查询用户信息，ID=" + userId);
        // 模拟异常
        int i = 1 / 0;
        return "用户ID：" + userId + "，姓名：张三";
    }, businessExecutor);

    // 统一处理成功/异常结果
    CompletableFuture<String> resultTask = userInfoTask.handle((result, ex) -> {
        if (ex == null) {
            return "处理成功：" + result;
        } else {
            System.err.println("链式任务异常：" + ex.getMessage());
            return "处理失败：返回默认值";
        }
    });

    resultTask.thenAccept(System.out::println);
}
```

四、 链式调用避坑指南
1.  **优先使用 `*Async` 后缀方法**
    非 `Async` 后缀的方法（如 `thenApply`）会在当前任务线程执行，可能导致线程阻塞；`*Async` 后缀方法（如 `thenApplyAsync`）可指定自定义线程池，实现真正的异步并行执行，推荐生产环境使用。

2.  **避免嵌套 `CompletableFuture`（使用 `thenCompose` 扁平化）**
    若使用 `thenApply` 处理返回 `CompletableFuture` 的任务，会得到 `CompletableFuture<CompletableFuture<T>>` 嵌套结构，难以处理；应使用 `thenCompose` 实现扁平化，简化代码。

3.  **不要忽略异常处理**
    链式流程中的异常不会自动抛出，若未通过 `exceptionally`/`handle`/`whenComplete` 处理，会导致异常静默丢失，难以排查问题。

4.  **区分 `thenCombine` 与 `allOf`**
    -  `thenCombine`：仅合并**两个**任务的结果，有返回值，支持结果转换；
    -  `allOf`：合并**多个**任务的结果，无返回值（`CompletableFuture<Void>`），需手动获取单个任务结果。

5.  **避免滥用默认线程池**
    链式调用中若不指定自定义线程池，会使用 `ForkJoinPool.commonPool()` 公共线程池，易与其他任务产生资源竞争，导致性能瓶颈。

五、 总结
1.  异步链式调用是 `CompletableFuture` 的核心能力，可实现线性、非阻塞的异步流程编排，解决回调地狱问题；
2.  核心链式方法按功能分类：结果转换（`thenApply/thenApplyAsync`，有返回值）、结果消费（`thenAccept/thenAcceptAsync`，无返回值）、任务扁平化（`thenCompose/thenComposeAsync`）、双任务合并（`thenCombine/thenCombineAsync`）；
3.  生产环境务必使用 `*Async` 后缀方法并指定自定义线程池，避免线程阻塞和资源竞争；
4.  异常处理是链式调用的关键，可通过 `exceptionally`（异常补偿）或 `handle`（统一处理）实现全局异常捕获，保证流程健壮性；
5.  不同业务场景需选择合适的链式方法：单任务依赖用 `thenApply`/`thenCompose`，双独立任务合并用 `thenCombine`，多任务合并用 `allOf`。

#### 异常处理
CompletableFuture 异步编程异常处理详解（实战全覆盖）

`CompletableFuture` 作为异步编程核心类，其异常具有**静默丢失**的特性（异步任务异常不会主动抛出到主线程），若未进行针对性处理，会导致问题难以排查。本文将全面讲解 `CompletableFuture` 异步任务（含链式调用）的核心异常处理方案，覆盖单个任务、链式流程、多任务组合等所有场景。

一、 异常核心特性：静默丢失与传播规则
1.  异常静默丢失

异步任务执行过程中抛出的异常，不会像同步代码那样直接抛出到调用线程，若未通过 `CompletableFuture` 提供的异常处理方法捕获，异常会被静默丢弃，仅在线程池日志中可能留下痕迹（视线程池配置而定），难以定位问题。

2.  链式调用异常传播

在异步链式调用中，**任意一个任务抛出异常，会立即终止后续所有链式任务的执行**，异常会沿着链式流程向上传播，最终可通过末端的异常处理方法统一捕获。

3.  多任务组合异常规则

-  `allOf`：只要有一个任务抛出异常，`allOf` 对应的 `CompletableFuture` 会立即标记为异常状态，后续任务仍会继续执行（但结果无意义）；
-  `anyOf`：若最先完成的任务抛出异常，`anyOf` 会立即返回该异常；若其他任务先正常完成，则忽略后续异常。

二、 核心异常处理方法（分类实战）

`CompletableFuture` 提供了 4 个核心异常处理方法，按功能可分为「异常补偿」「成功/异常统一处理」「结果消费时处理」三类，以下是详细实战示例。

前置准备：自定义线程池（生产环境必备）
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class CompletableFutureExceptionConfig {

    @Bean("exceptionExecutor")
    public Executor exceptionExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(corePoolSize * 2);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("Exception-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
```

1.  异常补偿型：`exceptionally`（核心）

`exceptionally` 是最常用的异常处理方法，用于**任务执行失败时进行异常补偿，返回一个默认值**，作为任务的最终结果，且不会中断链式编程（若在链式流程中使用）。

核心特性
-  仅在任务**执行失败**时触发（任务成功时不执行）；
-  入参：异常对象 `Throwable`，可获取异常信息；
-  返回值：默认结果（类型与任务成功结果一致），封装在新的 `CompletableFuture` 中；
-  适用场景：需要为异常任务提供默认值，保证后续流程（或消费逻辑）能正常执行。

实战示例（单个任务 + 链式任务）
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureExceptionallyService {

    @Autowired
    @Qualifier("exceptionExecutor")
    private Executor customExecutor;

    /**
     * 单个任务：exceptionally 异常补偿
     */
    public void singleTaskWithExceptionally() {
        // 提交异步任务（模拟异常）
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("单个异步任务执行中，线程：" + Thread.currentThread().getName());
            // 模拟业务异常
            int i = 1 / 0;
            return "任务执行成功";
        }, customExecutor);

        // 异常补偿：任务失败时返回默认值
        CompletableFuture<String> resultTask = asyncTask.exceptionally(ex -> {
            // 打印异常信息（便于排查）
            System.err.println("exceptionally 捕获异常：" + ex.getMessage());
            ex.printStackTrace();
            // 返回默认值（异常补偿）
            return "任务执行失败，返回默认结果";
        });

        // 消费最终结果（成功结果 或 异常默认值）
        resultTask.thenAccept(finalResult -> {
            System.out.println("最终结果：" + finalResult);
        });

        System.out.println("主线程非阻塞执行");
    }

    /**
     * 链式任务：exceptionally 全局异常补偿（捕获链式流程中任意任务的异常）
     */
    public void chainTaskWithExceptionally() {
        // 步骤1：生成用户ID
        CompletableFuture<Long> userIdTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1：生成用户ID，线程：" + Thread.currentThread().getName());
            return 1001L;
        }, customExecutor);

        // 步骤2：查询用户信息（模拟异常）
        CompletableFuture<String> userInfoTask = userIdTask.thenApplyAsync(userId -> {
            System.out.println("步骤2：查询用户ID=" + userId + "的信息，线程：" + Thread.currentThread().getName());
            // 模拟异常：中断链式流程
            int i = 1 / 0;
            return "用户ID：" + userId + "，姓名：张三，年龄：25";
        }, customExecutor);

        // 步骤3：格式化用户信息（因步骤2异常，此任务不会执行）
        CompletableFuture<String> formatTask = userInfoTask.thenApplyAsync(userInfo -> {
            System.out.println("步骤3：格式化用户信息，线程：" + Thread.currentThread().getName());
            return "【用户信息】：" + userInfo;
        }, customExecutor);

        // 全局异常补偿：捕获链式流程中任意步骤的异常
        CompletableFuture<String> resultTask = formatTask.exceptionally(ex -> {
            System.err.println("链式任务异常：" + ex.getMessage());
            return "【默认用户信息】：用户ID：1001，姓名：未知（查询失败）";
        });

        // 消费最终结果
        resultTask.thenAccept(finalResult -> {
            System.out.println("链式任务最终结果：" + finalResult);
        });
    }
}
```

2.  统一处理型：`handle`（成功+异常全覆盖）

`handle` 方法支持**无论任务成功还是失败，都会触发处理逻辑**，相当于 `whenComplete`（结果消费） + `exceptionally`（异常补偿）的组合，核心区别是 `handle` 有返回值，可对结果（或异常）进行转换处理。

核心特性
-  任务成功/失败均会触发，无遗漏；
-  入参1：任务成功结果（失败时为 `null`）；
-  入参2：异常对象（成功时为 `null`）；
-  返回值：处理后的结果（类型可自定义），封装在新的 `CompletableFuture` 中；
-  适用场景：需要统一处理成功结果和异常情况，且需要转换结果的场景。

实战示例
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureHandleService {

    @Autowired
    @Qualifier("exceptionExecutor")
    private Executor customExecutor;

    /**
     * 单个任务：handle 统一处理成功与异常
     */
    public void singleTaskWithHandle() {
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("单个异步任务执行中，线程：" + Thread.currentThread().getName());
            // 可注释此行测试成功场景
            int i = 1 / 0;
            return "任务执行成功";
        }, customExecutor);

        // 统一处理成功与异常
        CompletableFuture<String> resultTask = asyncTask.handle((successResult, ex) -> {
            if (ex == null) {
                // 任务成功：处理并转换结果
                System.out.println("任务执行成功，原始结果：" + successResult);
                return "handle 处理成功：" + successResult;
            } else {
                // 任务失败：处理异常并返回默认值
                System.err.println("handle 捕获异常：" + ex.getMessage());
                return "handle 处理异常：返回默认结果";
            }
        });

        // 消费最终结果
        resultTask.thenAccept(finalResult -> {
            System.out.println("handle 最终处理结果：" + finalResult);
        });
    }

    /**
     * 链式任务：handle 统一处理整个流程的成功与异常
     */
    public void chainTaskWithHandle() {
        // 链式流程：用户ID → 查询用户信息 → 格式化信息
        CompletableFuture<String> finalTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1：生成用户ID，线程：" + Thread.currentThread().getName());
            return 1001L;
        }, customExecutor)
                .thenApplyAsync(userId -> {
                    System.out.println("步骤2：查询用户信息，线程：" + Thread.currentThread().getName());
                    // 模拟异常（可注释测试成功场景）
                    int i = 1 / 0;
                    return "用户ID：" + userId + "，姓名：张三";
                }, customExecutor)
                .thenApplyAsync(userInfo -> {
                    System.out.println("步骤3：格式化用户信息，线程：" + Thread.currentThread().getName());
                    return "【用户信息】：" + userInfo;
                }, customExecutor)
                // 统一处理整个链式流程的成功与异常
                .handle((successResult, ex) -> {
                    if (ex == null) {
                        return "链式流程执行成功，最终结果：" + successResult;
                    } else {
                        System.err.println("链式流程执行失败，异常信息：" + ex.getMessage());
                        return "链式流程执行失败，默认结果：用户信息查询异常";
                    }
                });

        // 消费结果
        finalTask.thenAccept(System.out::println);
    }
}
```

3.  结果消费型：`whenComplete`（仅消费，无返回值）

`whenComplete` 是**消费任务结果时的异常处理方法**，仅负责消费成功结果和异常信息，无返回值，不会改变任务的原始结果（或异常状态）。

核心特性
-  任务成功/失败均会触发，用于日志记录、监控告警等消费场景；
-  入参1：任务成功结果（失败时为 `null`）；
-  入参2：异常对象（成功时为 `null`）；
-  返回值：`CompletableFuture<Void>`，无业务结果，仅标记任务是否处理完成；
-  适用场景：无需转换结果，仅需记录任务执行状态（成功日志/异常告警）的场景。

实战示例
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureWhenCompleteService {

    @Autowired
    @Qualifier("exceptionExecutor")
    private Executor customExecutor;

    /**
     * 单个任务：whenComplete 消费结果并处理异常（无返回值）
     */
    public void singleTaskWithWhenComplete() {
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("单个异步任务执行中，线程：" + Thread.currentThread().getName());
            // 模拟异常（可注释测试成功场景）
            int i = 1 / 0;
            return "任务执行成功";
        }, customExecutor);

        // 消费结果 + 处理异常（无返回值）
        CompletableFuture<Void> consumeTask = asyncTask.whenComplete((successResult, ex) -> {
            if (ex == null) {
                // 任务成功：记录日志
                System.out.println("任务执行成功，结果：" + successResult);
            } else {
                // 任务失败：记录异常日志 + 告警（如短信/邮件）
                System.err.println("任务执行失败，异常信息：" + ex.getMessage());
                ex.printStackTrace();
                // 模拟异常告警
                // alarmService.sendAlarm("异步任务执行失败：" + ex.getMessage());
            }
        });

        // 异常兜底（若 whenComplete 未处理，可在此处补充）
        consumeTask.exceptionally(ex -> {
            System.err.println("consumeTask 异常兜底：" + ex.getMessage());
            return null;
        });
    }

    /**
     * 链式任务：whenComplete 末端消费结果与异常
     */
    public void chainTaskWithWhenComplete() {
        // 链式流程
        CompletableFuture<String> chainTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1：生成商品ID，线程：" + Thread.currentThread().getName());
            return 2001L;
        }, customExecutor)
                .thenApplyAsync(productId -> {
                    System.out.println("步骤2：查询商品信息，线程：" + Thread.currentThread().getName());
                    return "商品ID：" + productId + "，名称：笔记本电脑，价格：5999元";
                }, customExecutor)
                .thenApplyAsync(productInfo -> {
                    System.out.println("步骤3：计算优惠价格，线程：" + Thread.currentThread().getName());
                    return productInfo + "，优惠后价格：4799元";
                }, customExecutor);

        // 末端消费 + 异常处理
        chainTask.whenComplete((successResult, ex) -> {
            if (ex == null) {
                System.out.println("链式任务执行成功，最终结果：" + successResult);
            } else {
                System.err.println("链式任务执行失败，异常信息：" + ex.getMessage());
            }
        });
    }
}
```

4.  阻塞获取型：`get()` 异常捕获（不推荐，仅特殊场景使用）

`get()` 是 `Future` 接口的阻塞方法，用于**阻塞等待任务结果**，会抛出 `InterruptedException`（线程中断异常）和 `ExecutionException`（任务执行异常）两个检查性异常，需手动通过 `try-catch` 捕获。

核心特性
-  阻塞主线程，直到任务完成（成功/失败）；
-  必须手动捕获检查性异常，代码冗余；
-  破坏异步非阻塞特性，仅适用于必须等待任务结果的特殊场景；
-  替代方案：`join()` 方法（非检查性异常，无需手动 `try-catch`，但仍阻塞）。

实战示例
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureGetService {

    @Autowired
    @Qualifier("exceptionExecutor")
    private Executor customExecutor;

    /**
     * 阻塞获取结果：get() 手动捕获异常（不推荐）
     */
    public void singleTaskWithGet() {
        CompletableFuture<String> asyncTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("单个异步任务执行中，线程：" + Thread.currentThread().getName());
            // 模拟异常
            int i = 1 / 0;
            return "任务执行成功";
        }, customExecutor);

        // 阻塞等待结果，并捕获异常
        try {
            String result = asyncTask.get();
            System.out.println("任务执行成功，结果：" + result);
        } catch (InterruptedException e) {
            System.err.println("线程被中断：" + e.getMessage());
            Thread.currentThread().interrupt(); // 恢复中断状态
        } catch (ExecutionException e) {
            System.err.println("任务执行失败：" + e.getCause().getMessage()); // 获取真实异常
        }

        System.out.println("主线程阻塞后继续执行");
    }
}
```

三、 多任务组合场景异常处理

针对 `allOf`（所有任务完成）和 `anyOf`（任一任务完成）的多任务组合场景，异常处理需结合组合特性进行针对性配置。

1.  `allOf` 多任务异常处理

`allOf` 本身返回 `CompletableFuture<Void>`，无业务结果，需通过 `whenComplete` 或 `exceptionally` 捕获异常，再逐个获取单个任务的结果（异常任务需单独处理）。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureAllOfExceptionService {

    @Autowired
    @Qualifier("exceptionExecutor")
    private Executor customExecutor;

    /**
     * allOf 多任务：异常处理
     */
    public void allOfTaskWithException() {
        // 任务1：查询用户信息（正常执行）
        CompletableFuture<String> userTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务1：查询用户信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(800);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户ID：1001，姓名：张三";
        }, customExecutor);

        // 任务2：查询商品信息（模拟异常）
        CompletableFuture<String> productTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务2：查询商品信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            // 模拟异常
            int i = 1 / 0;
            return "商品ID：2001，名称：笔记本电脑";
        }, customExecutor);

        // 任务3：查询订单信息（正常执行）
        CompletableFuture<String> orderTask = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务3：查询订单信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(600);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "订单ID：3001，状态：待支付";
        }, customExecutor);

        // 组合所有任务
        CompletableFuture<Void> allTask = CompletableFuture.allOf(userTask, productTask, orderTask);

        // 异常处理 + 结果聚合
        allTask.whenComplete((voidResult, ex) -> {
            if (ex == null) {
                System.out.println("所有任务执行成功，开始聚合结果");
                // 获取单个任务结果
                String userResult = userTask.join();
                String orderResult = orderTask.join();
                // 处理异常任务（productTask 会抛出异常，需捕获）
                String productResult;
                try {
                    productResult = productTask.join();
                } catch (Exception e) {
                    System.err.println("任务2执行失败，使用默认值：" + e.getMessage());
                    productResult = "商品ID：2001，名称：未知（查询失败）";
                }
                // 聚合结果
                System.out.println("聚合结果：\n" + userResult + "\n" + productResult + "\n" + orderResult);
            } else {
                System.err.println("存在任务执行失败，异常信息：" + ex.getMessage());
                // 逐个获取任务结果，处理正常任务和异常任务
                String userResult = userTask.join();
                String orderResult = orderTask.join();
                System.out.println("正常任务结果：\n" + userResult + "\n" + orderResult);
            }
        });
    }
}
```

2.  `anyOf` 多任务异常处理

`anyOf` 会返回最先完成的任务结果（或异常），直接通过 `whenComplete` 或 `exceptionally` 捕获即可，无需逐个处理任务。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureAnyOfExceptionService {

    @Autowired
    @Qualifier("exceptionExecutor")
    private Executor customExecutor;

    /**
     * anyOf 多任务：异常处理
     */
    public void anyOfTaskWithException() {
        // 任务1：数据源1查询（耗时2秒，模拟异常）
        CompletableFuture<String> ds1Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务1：数据源1查询，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            int i = 1 / 0;
            return "数据源1：用户信息";
        }, customExecutor);

        // 任务2：数据源2查询（耗时1秒，正常执行）
        CompletableFuture<String> ds2Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务2：数据源2查询，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "数据源2：用户信息";
        }, customExecutor);

        // 任务3：数据源3查询（耗时1.5秒，正常执行）
        CompletableFuture<String> ds3Task = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务3：数据源3查询，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "数据源3：用户信息";
        }, customExecutor);

        // 组合任务：任一任务完成
        CompletableFuture<Object> anyTask = CompletableFuture.anyOf(ds1Task, ds2Task, ds3Task);

        // 异常处理 + 结果消费
        anyTask.whenComplete((result, ex) -> {
            if (ex == null) {
                System.out.println("最快完成的任务结果：" + result);
            } else {
                System.err.println("最先完成的任务执行失败，异常信息：" + ex.getMessage());
                // 可选择等待其他任务完成，获取备用结果
                System.out.println("等待备用数据源结果...");
                CompletableFuture<Object> backupTask = CompletableFuture.anyOf(ds2Task, ds3Task);
                backupTask.whenComplete((backupResult, backupEx) -> {
                    if (backupEx == null) {
                        System.out.println("备用数据源结果：" + backupResult);
                    } else {
                        System.err.println("所有数据源查询失败");
                    }
                });
            }
        });
    }
}
```

四、 异常处理避坑指南
1.  **切勿忽略异常处理**
    异步任务的异常不会自动抛出，若未使用 `exceptionally`/`handle`/`whenComplete` 处理，会导致异常静默丢失，难以排查问题，生产环境必须为每个 `CompletableFuture` 配置异常处理。

2.  **优先使用 `*Async` 后缀方法**
    非 `Async` 后缀的异常处理方法（如 `whenComplete`）会在任务线程执行，若处理逻辑耗时较长，会阻塞任务线程；推荐使用 `whenCompleteAsync`/`handleAsync`，指定自定义线程池执行异常处理逻辑。

3.  **区分 `handle` 与 `whenComplete`**
    -  需转换结果/提供默认值：使用 `handle`；
    -  仅记录日志/告警，无需改变结果：使用 `whenComplete`；
    -  避免用 `whenComplete` 尝试转换结果（无返回值，无效）。

4.  **避免滥用 `get()` 方法**
    `get()` 会阻塞主线程，破坏异步非阻塞特性，仅在必须等待任务结果的特殊场景使用；优先使用 `join()`（非检查性异常）替代 `get()`，简化代码。

5.  **链式任务异常需末端统一处理**
    链式任务中，无需为每个任务单独配置异常处理，只需在链式流程末端配置 `exceptionally`/`handle`，即可捕获所有前置任务的异常，简化代码。

6.  **多任务组合需处理单个任务异常**
    `allOf` 仅捕获全局异常，单个任务的异常需通过 `try-catch`（配合 `join()`）单独处理，避免因单个任务异常导致整个聚合流程失败。

五、 总结
1.  `CompletableFuture` 异常具有静默丢失特性，链式任务中异常会终止后续流程并向上传播，多任务组合需遵循对应异常规则；
2.  核心异常处理方法分为四类：`exceptionally`（异常补偿，返回默认值）、`handle`（成功/异常统一处理，有返回值）、`whenComplete`（仅消费，无返回值）、`get()`（阻塞获取，手动捕获，不推荐）；
3.  单个任务优先使用 `exceptionally`（异常补偿）或 `whenComplete`（日志记录），链式任务优先在末端使用 `handle`/`exceptionally` 全局处理，多任务组合需结合 `allOf`/`anyOf` 特性针对性处理；
4.  生产环境务必使用自定义线程池，优先选择 `*Async` 后缀的异常处理方法，避免阻塞和资源竞争，同时切勿忽略异常处理，防止问题静默丢失。

#### 结果合并
CompletableFuture 结果合并详解（实战全覆盖）

`CompletableFuture` 的结果合并是异步编程中的高频场景，用于将多个独立或依赖的异步任务结果聚合为一个最终结果，核心分为「双任务合并」和「多任务合并」两大类，对应不同的API和业务场景，本文将全面讲解各类结果合并的实战用法。

一、 核心结果合并分类与适用场景

| 合并类型 | 核心API | 适用场景 | 核心特性 |
|----------|---------|----------|----------|
| 双任务合并 | `thenCombine` / `thenCombineAsync` | 两个独立异步任务，需合并结果后继续处理 | 有返回值，支持结果转换，直接合并两个任务结果 |
| 多任务合并 | `allOf` | 三个及以上独立异步任务，需等待所有任务完成后聚合结果 | 无返回值（`CompletableFuture<Void>`），需手动获取单个任务结果 |
| 多任务快速合并 | `anyOf` | 三个及以上独立异步任务，只需获取最先完成的任务结果 | 返回最先完成的任务结果（`Object`类型），无需等待所有任务 |
| 嵌套任务结果合并 | `thenCompose` / `thenComposeAsync` | 两个依赖异步任务（后一个任务依赖前一个任务结果），扁平化嵌套结构 | 避免 `CompletableFuture<CompletableFuture<T>>` 嵌套，优雅合并依赖任务结果 |

二、 前置准备：自定义线程池（生产环境必备）
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@EnableAsync
@Configuration
public class CompletableFutureMergeConfig {

    @Bean("mergeExecutor")
    public Executor mergeExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(corePoolSize * 2);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("Merge-Async-Thread-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
```

三、 双任务合并：`thenCombine` / `thenCombineAsync`

核心特性
1.  针对**两个独立无依赖**的异步任务，等待两者均完成后合并结果；
2.  有返回值，可直接对两个任务结果进行转换和聚合；
3.  `thenCombine`：在当前任务线程执行合并逻辑；
4.  `thenCombineAsync`：在指定自定义线程池执行合并逻辑，推荐生产环境使用。

实战场景：查询用户信息 + 查询商品信息 → 合并生成订单信息
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureThenCombineService {

    @Autowired
    @Qualifier("mergeExecutor")
    private Executor customExecutor;

    /**
     * 异步查询用户信息
     */
    private CompletableFuture<String> queryUserInfo(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("查询用户信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000); // 模拟耗时
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户ID：" + userId + "，姓名：张三，手机号：13800138000";
        }, customExecutor);
    }

    /**
     * 异步查询商品信息
     */
    private CompletableFuture<String> queryProductInfo(Long productId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("查询商品信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(800); // 模拟耗时
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "商品ID：" + productId + "，名称：笔记本电脑，价格：5999.00元";
        }, customExecutor);
    }

    /**
     * 双任务结果合并：thenCombineAsync
     */
    public void mergeTwoTaskWithThenCombine() {
        // 两个独立异步任务
        CompletableFuture<String> userTask = queryUserInfo(1001L);
        CompletableFuture<String> productTask = queryProductInfo(2001L);

        // 合并两个任务结果：thenCombineAsync
        CompletableFuture<String> orderTask = userTask.thenCombineAsync(
                productTask, // 第二个待合并的异步任务
                (userResult, productResult) -> { // 合并逻辑：接收两个任务的结果，返回聚合结果
                    System.out.println("合并用户信息与商品信息，线程：" + Thread.currentThread().getName());
                    // 聚合结果生成订单信息
                    return "【订单信息】\n"
                            + userResult + "\n"
                            + productResult + "\n"
                            + "订单状态：待支付，创建时间：2026-01-03";
                },
                customExecutor // 指定自定义线程池
        );

        // 消费合并后的最终结果
        orderTask.whenComplete((finalOrder, ex) -> {
            if (ex == null) {
                System.out.println("订单信息生成成功：\n" + finalOrder);
            } else {
                System.err.println("订单信息生成失败，异常：" + ex.getMessage());
            }
        });

        System.out.println("主线程非阻塞执行，无需等待合并完成");
    }
}
```

四、 多任务合并：`allOf`

核心特性
1.  针对**三个及以上独立无依赖**的异步任务，等待所有任务均完成后进行结果聚合；
2.  返回 `CompletableFuture<Void>`，无直接业务结果，需手动通过 `join()`（非阻塞，推荐）或 `get()`（阻塞，不推荐）获取单个任务结果；
3.  任意一个任务抛出异常，`allOf` 会立即标记为异常状态，但其他任务仍会继续执行；
4.  适用于批量查询、多服务接口聚合等需要完整结果的场景。

实战场景：批量查询3个用户信息 → 聚合所有用户数据
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureAllOfService {

    @Autowired
    @Qualifier("mergeExecutor")
    private Executor customExecutor;

    /**
     * 异步查询单个用户信息
     */
    private CompletableFuture<String> querySingleUserInfo(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("查询用户ID=" + userId + "的信息，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(800); // 模拟耗时
            } catch (InterruptedException e) {
                throw new RuntimeException("查询用户ID=" + userId + "失败：" + e.getMessage());
            }
            return "用户ID：" + userId + "，姓名：用户" + userId + "，年龄：" + (20 + userId % 10);
        }, customExecutor);
    }

    /**
     * 多任务结果合并：allOf
     */
    public void mergeMultiTaskWithAllOf() {
        // 1. 提交多个独立异步任务
        CompletableFuture<String> user1Task = querySingleUserInfo(1001L);
        CompletableFuture<String> user2Task = querySingleUserInfo(1002L);
        CompletableFuture<String> user3Task = querySingleUserInfo(1003L);
        // 可扩展更多任务...

        // 2. 组合所有任务：allOf（等待所有任务完成）
        CompletableFuture<Void> allTask = CompletableFuture.allOf(user1Task, user2Task, user3Task);

        // 3. 所有任务完成后，聚合结果并处理异常
        allTask.whenComplete((voidResult, ex) -> {
            List<String> userList = new ArrayList<>();
            if (ex == null) {
                System.out.println("所有用户查询任务完成，开始聚合结果");
                // 手动获取每个任务的结果（join() 非阻塞，无需try-catch）
                userList.add(user1Task.join());
                userList.add(user2Task.join());
                userList.add(user3Task.join());
            } else {
                System.err.println("部分用户查询失败，异常信息：" + ex.getMessage());
                // 逐个获取任务结果，处理正常任务，捕获异常任务
                try {
                    userList.add(user1Task.join());
                } catch (Exception e) {
                    System.err.println("用户1001查询失败：" + e.getMessage());
                    userList.add("用户ID：1001，姓名：未知（查询失败）");
                }
                try {
                    userList.add(user2Task.join());
                } catch (Exception e) {
                    System.err.println("用户1002查询失败：" + e.getMessage());
                    userList.add("用户ID：1002，姓名：未知（查询失败）");
                }
                try {
                    userList.add(user3Task.join());
                } catch (Exception e) {
                    System.err.println("用户1003查询失败：" + e.getMessage());
                    userList.add("用户ID：1003，姓名：未知（查询失败）");
                }
            }

            // 4. 消费聚合后的结果
            System.out.println("聚合后的用户列表：");
            for (String userInfo : userList) {
                System.out.println(userInfo);
            }
        });

        System.out.println("主线程非阻塞执行，无需等待所有任务完成");
    }
}
```

五、 多任务快速合并：`anyOf`

核心特性
1.  针对**三个及以上独立无依赖**的异步任务，只需获取「最先完成」的任务结果，无需等待所有任务；
2.  返回 `CompletableFuture<Object>`，结果类型为 `Object`，需按需强制类型转换；
3.  最先完成的任务若抛出异常，`anyOf` 会立即返回该异常；若最先完成的任务正常，忽略后续任务的异常；
4.  适用于多源备份查询（如多数据源查询同一数据，取最快返回结果）、超时兜底等场景。

实战场景：多数据源查询用户信息 → 取最快返回的结果
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureAnyOfService {

    @Autowired
    @Qualifier("mergeExecutor")
    private Executor customExecutor;

    /**
     * 从指定数据源查询用户信息
     */
    private CompletableFuture<String> queryUserFromDataSource(Long userId, String dataSourceName, long delay) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("从" + dataSourceName + "查询用户ID=" + userId + "，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(delay); // 模拟不同数据源的查询耗时
            } catch (InterruptedException e) {
                throw new RuntimeException(dataSourceName + "查询中断：" + e.getMessage());
            }
            return dataSourceName + "查询结果：用户ID=" + userId + "，姓名：张三，状态：正常";
        }, customExecutor);
    }

    /**
     * 多任务快速合并：anyOf（取最先完成的结果）
     */
    public void mergeMultiTaskWithAnyOf() {
        // 1. 提交多个独立异步任务（不同数据源，不同耗时）
        CompletableFuture<String> ds1Task = queryUserFromDataSource(1001L, "数据源1（主库）", 2000); // 耗时2秒
        CompletableFuture<String> ds2Task = queryUserFromDataSource(1001L, "数据源2（备库1）", 1000); // 耗时1秒（最快）
        CompletableFuture<String> ds3Task = queryUserFromDataSource(1001L, "数据源3（备库2）", 1500); // 耗时1.5秒

        // 2. 组合任务：anyOf（任一任务完成即返回）
        CompletableFuture<Object> anyTask = CompletableFuture.anyOf(ds1Task, ds2Task, ds3Task);

        // 3. 消费最先完成的结果并处理异常
        anyTask.whenComplete((fastResult, ex) -> {
            if (ex == null) {
                // 强制类型转换为任务结果类型
                String userInfo = (String) fastResult;
                System.out.println("最快获取的用户信息：" + userInfo);
            } else {
                System.err.println("最先完成的数据源查询失败，异常：" + ex.getMessage());
                // 可选：等待备用数据源结果
                System.out.println("尝试获取备用数据源结果...");
                CompletableFuture<Object> backupTask = CompletableFuture.anyOf(ds1Task, ds3Task);
                backupTask.whenComplete((backupResult, backupEx) -> {
                    if (backupEx == null) {
                        System.out.println("备用数据源查询结果：" + (String) backupResult);
                    } else {
                        System.err.println("所有数据源查询失败");
                    }
                });
            }
        });

        System.out.println("主线程非阻塞执行，无需等待所有任务完成");
    }
}
```

六、 嵌套任务结果合并：`thenCompose` / `thenComposeAsync`

核心特性
1.  针对**两个依赖异步任务**（后一个任务的执行依赖前一个任务的结果，且后一个任务返回 `CompletableFuture`）；
2.  扁平化嵌套结构：避免使用 `thenApply` 导致的 `CompletableFuture<CompletableFuture<T>>` 嵌套问题，直接返回 `CompletableFuture<T>`；
3.  `thenCompose`：在当前任务线程执行后续任务；
4.  `thenComposeAsync`：在指定自定义线程池执行后续任务，推荐生产环境使用。

实战场景：用户ID查询 → 依赖用户ID查询订单 → 合并用户与订单结果
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
public class CompletableFutureThenComposeService {

    @Autowired
    @Qualifier("mergeExecutor")
    private Executor customExecutor;

    /**
     * 异步查询用户ID（模拟获取用户标识）
     */
    private CompletableFuture<Long> getUserId() {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("获取用户ID，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return 1001L;
        }, customExecutor);
    }

    /**
     * 异步查询用户订单（依赖用户ID，返回CompletableFuture）
     */
    private CompletableFuture<String> queryUserOrder(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("根据用户ID=" + userId + "查询订单，线程：" + Thread.currentThread().getName());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "用户ID=" + userId + "，订单号：ORDER_20260103_1001，金额：5999元，状态：已支付";
        }, customExecutor);
    }

    /**
     * 嵌套任务结果合并：thenComposeAsync（扁平化嵌套结构）
     */
    public void mergeDependentTaskWithThenCompose() {
        // 1. 先获取用户ID，再依赖用户ID查询订单（扁平化嵌套）
        CompletableFuture<String> userOrderTask = getUserId()
                .thenComposeAsync(userId -> {
                    // 后一个任务依赖前一个任务的结果，返回CompletableFuture
                    return queryUserOrder(userId);
                }, customExecutor);

        // 2. 消费合并后的结果（用户订单信息）
        userOrderTask.whenComplete((orderInfo, ex) -> {
            if (ex == null) {
                System.out.println("用户订单查询成功：" + orderInfo);
            } else {
                System.err.println("用户订单查询失败，异常：" + ex.getMessage());
            }
        });

        // 对比：使用thenApply会产生嵌套结构（不推荐）
        CompletableFuture<CompletableFuture<String>> nestedTask = getUserId()
                .thenApplyAsync(userId -> queryUserOrder(userId), customExecutor);
        // 需两次join()获取结果，繁琐且易出错
        nestedTask.whenComplete((nestedResult, ex) -> {
            if (ex == null) {
                String orderInfo = nestedResult.join();
                System.out.println("嵌套结构获取订单信息：" + orderInfo);
            }
        });

        System.out.println("主线程非阻塞执行");
    }
}
```

七、 结果合并避坑指南
1.  **区分 `thenCombine` 与 `thenCompose`**
    -  无依赖双任务合并：使用 `thenCombine`（两个任务独立，同时执行）；
    -  有依赖嵌套任务合并：使用 `thenCompose`（后一个任务依赖前一个结果，串行执行）；
    -  避免用 `thenApply` 处理嵌套异步任务，防止出现 `CompletableFuture<CompletableFuture<T>>` 嵌套结构。

2.  **`allOf` 无返回值，需手动聚合结果**
    `CompletableFuture.allOf()` 返回 `CompletableFuture<Void>`，切勿直接尝试获取业务结果，需通过 `join()` 逐个获取单个任务结果进行聚合。

3.  **`anyOf` 结果需强制类型转换**
    `anyOf` 返回 `CompletableFuture<Object>`，需根据实际任务结果类型进行强制类型转换，转换前可通过 `instanceof` 判断类型，避免类型转换异常。

4.  **优先使用 `*Async` 后缀方法**
    非 `Async` 后缀的合并方法（`thenCombine`/`thenCompose`）会在任务线程执行合并逻辑，若合并逻辑耗时较长，会阻塞任务线程；推荐使用 `thenCombineAsync`/`thenComposeAsync`，指定自定义线程池。

5.  **多任务合并需处理单个任务异常**
    `allOf` 仅捕获全局异常，单个任务的异常需通过 `try-catch` 配合 `join()` 单独处理，避免因单个任务异常导致整个聚合流程失败；`anyOf` 需处理最先完成任务的异常，可按需获取备用任务结果。

6.  **避免滥用 `get()` 方法**
    获取单个任务结果时，优先使用 `join()`（非检查性异常，无需 `try-catch`，非阻塞），避免使用 `get()`（阻塞主线程，需捕获检查性异常）。

八、 总结
1.  `CompletableFuture` 结果合并分为四大类：双任务无依赖合并（`thenCombine`）、多任务无依赖全量合并（`allOf`）、多任务无依赖快速合并（`anyOf`）、双任务有依赖嵌套合并（`thenCompose`）；
2.  双任务合并优先用 `thenCombine`，多任务全量聚合优先用 `allOf`，多任务快速取值优先用 `anyOf`，依赖任务扁平化优先用 `thenCompose`；
3.  生产环境务必使用自定义线程池，优先选择 `*Async` 后缀的合并方法，避免线程阻塞和资源竞争；
4.  结果合并时需注意异常处理：`allOf` 需逐个处理单个任务异常，`anyOf` 需处理最先完成任务的异常，嵌套任务可通过末端统一异常处理捕获异常；
5.  避免嵌套结构和滥用 `get()` 方法，确保代码优雅、高效、健壮。

### 消息队列
#### RabbitMQ

消息队列（RabbitMQ/Kafka）是分布式系统中实现异步通信、削峰填谷、系统解耦的核心组件。本文将详细讲解 Spring Boot 如何快速集成 RabbitMQ 和 Kafka，包括核心配置、生产端/消费端实现、关键特性实战及避坑指南。

一、 前置准备
1.  **环境要求**
    - JDK 8+、Spring Boot 2.3.x+（兼容性最优）
    - RabbitMQ 3.8.x+（需开启管理界面，默认端口5672，管理端口15672）
    - Kafka 2.8.x+（默认端口9092，需启动ZooKeeper或KRaft模式）
2.  **核心依赖**
    Spring Boot 提供了 starter 依赖，简化集成配置，无需手动引入大量依赖。

二、 Spring Boot 集成 RabbitMQ
RabbitMQ 基于 AMQP 协议，主打**可靠消息投递、灵活的消息路由（交换机+队列）、死信机制**，适用于对消息可靠性要求高的场景（如订单支付、消息通知、数据同步）。

1.  引入核心依赖

在 `pom.xml` 中添加 RabbitMQ starter 依赖：
```xml
<!-- Spring Boot 集成 RabbitMQ -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

2.  核心配置（application.yml）
```yaml
spring:
  # RabbitMQ 配置
  rabbitmq:
    host: 127.0.0.1 # RabbitMQ 服务地址（本地/服务器IP）
    port: 5672 # 默认端口
    username: guest # 默认用户名（本地环境）
    password: guest # 默认密码（本地环境）
    virtual-host: / # 虚拟主机（默认/，可自定义）
    # 连接池配置（生产环境必备）
    connection-timeout: 30000 # 连接超时时间
    cache:
      channel:
        size: 50 # 通道缓存大小
      connection:
        size: 10 # 连接池大小
    # 消费者配置
    listener:
      simple:
        concurrency: 5 # 最小并发消费者数
        max-concurrency: 10 # 最大并发消费者数
        prefetch: 1 # 每次从队列获取的消息数（公平分发）
        acknowledge-mode: manual # 手动确认消息（推荐，确保消息不丢失）
        retry:
          enabled: true # 开启消费者重试
          max-attempts: 3 # 最大重试次数
          initial-interval: 1000 # 初始重试间隔（毫秒）
```

3.  核心组件定义（交换机+队列+绑定）

RabbitMQ 中消息需通过「交换机 → 绑定 → 队列」才能被消费，需先定义这些核心组件（使用 `@Configuration` 配置）。
```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 核心组件配置（交换机、队列、绑定）
 */
@Configuration
public class RabbitMQConfig {

    // 1. 定义队列（订单消息队列）
    public static final String ORDER_QUEUE_NAME = "order_queue";
    // 2. 定义交换机（直连交换机，最常用）
    public static final String ORDER_EXCHANGE_NAME = "order_exchange";
    // 3. 定义路由键
    public static final String ORDER_ROUTING_KEY = "order_routing_key";

    /**
     * 声明队列
     * durable: true → 队列持久化（重启RabbitMQ后队列不丢失）
     */
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(ORDER_QUEUE_NAME)
                .withArgument("x-dead-letter-exchange", "order_dlq_exchange") // 死信交换机
                .withArgument("x-dead-letter-routing-key", "order_dlq_routing_key") // 死信路由键
                .build();
    }

    /**
     * 声明直连交换机
     * durable: true → 交换机持久化
     */
    @Bean
    public DirectExchange orderExchange() {
        return ExchangeBuilder.directExchange(ORDER_EXCHANGE_NAME)
                .durable(true)
                .build();
    }

    /**
     * 绑定队列与交换机（指定路由键）
     */
    @Bean
    public Binding orderBinding(Queue orderQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderQueue)
                .to(orderExchange)
                .with(ORDER_ROUTING_KEY);
    }

    // 可选：声明死信队列（处理消费失败的消息）
    @Bean
    public Queue orderDlqQueue() {
        return QueueBuilder.durable("order_dlq_queue").build();
    }

    // 可选：声明死信交换机
    @Bean
    public DirectExchange orderDlqExchange() {
        return ExchangeBuilder.directExchange("order_dlq_exchange").durable(true).build();
    }

    // 可选：绑定死信队列与死信交换机
    @Bean
    public Binding orderDlqBinding(Queue orderDlqQueue, DirectExchange orderDlqExchange) {
        return BindingBuilder.bind(orderDlqQueue).to(orderDlqExchange).with("order_dlq_routing_key");
    }
}
```

4.  生产端（消息发送）

使用 `RabbitTemplate` 发送消息，支持普通消息、对象消息（自动序列化/反序列化），推荐使用 JSON 序列化。
```java
import com.alibaba.fastjson.JSON;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * RabbitMQ 生产端（消息发送服务）
 */
@Service
public class RabbitMQProducerService {

    @Autowired
    private RabbitTemplate rabbitTemplate; // Spring 提供的 RabbitMQ 操作模板

    /**
     * 发送订单消息（普通Map消息）
     */
    public void sendOrderMessage(Long orderId, String userName, Double amount) {
        try {
            // 1. 构建消息内容
            Map<String, Object> orderMessage = new HashMap<>();
            orderMessage.put("orderId", orderId);
            orderMessage.put("userName", userName);
            orderMessage.put("amount", amount);
            orderMessage.put("messageId", UUID.randomUUID().toString());
            orderMessage.put("sendTime", System.currentTimeMillis());

            // 2. 发送消息（交换机、路由键、消息内容）
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ORDER_EXCHANGE_NAME,
                    RabbitMQConfig.ORDER_ROUTING_KEY,
                    orderMessage,
                    message -> {
                        // 设置消息持久化（确保消息落地磁盘，不丢失）
                        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        return message;
                    }
            );

            System.out.println("订单消息发送成功：" + JSON.toJSONString(orderMessage));
        } catch (Exception e) {
            System.err.println("订单消息发送失败：" + e.getMessage());
            // 生产环境：可记录异常日志 + 消息重试 + 存入本地消息表做兜底
            e.printStackTrace();
        }
    }

    /**
     * 发送对象消息（推荐，更优雅）
     */
    public void sendOrderObjectMessage(OrderDTO orderDTO) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ORDER_EXCHANGE_NAME,
                    RabbitMQConfig.ORDER_ROUTING_KEY,
                    orderDTO,
                    message -> {
                        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        // 设置消息过期时间（可选）
                        message.getMessageProperties().setExpiration("30000"); // 30秒过期
                        return message;
                    }
            );
            System.out.println("订单对象消息发送成功：" + JSON.toJSONString(orderDTO));
        } catch (Exception e) {
            System.err.println("订单对象消息发送失败：" + e.getMessage());
            e.printStackTrace();
        }
    }

    // 订单DTO（数据传输对象）
    public static class OrderDTO {
        private Long orderId;
        private String userName;
        private Double amount;
        private String orderStatus;
        // 省略 getter/setter/构造方法
    }
}
```

5.  消费端（消息接收）

使用 `@RabbitListener` 注解监听队列，支持手动确认消息（确保消费成功后再确认，避免消息丢失）。
```java
import com.alibaba.fastjson.JSON;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * RabbitMQ 消费端（消息接收组件）
 */
@Component
public class RabbitMQConsumerService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 监听订单队列（手动确认消息）
     * queues：指定监听的队列名称
     */
    @RabbitListener(queues = RabbitMQConfig.ORDER_QUEUE_NAME)
    public void consumeOrderMessage(Map<String, Object> orderMessage, Message message, com.rabbitmq.client.Channel channel) throws Exception {
        // 消息投递标签（用于手动确认）
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            // 1. 打印消息内容
            System.out.println("接收到订单消息：" + JSON.toJSONString(orderMessage));

            // 2. 业务逻辑处理（如订单状态更新、短信通知等）
            Long orderId = (Long) orderMessage.get("orderId");
            String userName = (String) orderMessage.get("userName");
            System.out.println("处理订单：orderId=" + orderId + "，userName=" + userName);

            // 3. 手动确认消息（单条确认，推荐）
            channel.basicAck(deliveryTag, false);
            System.out.println("订单消息消费成功，已确认：deliveryTag=" + deliveryTag);
        } catch (Exception e) {
            System.err.println("订单消息消费失败：" + e.getMessage());
            // 处理异常：根据业务场景选择拒绝策略
            if (e instanceof RuntimeException) {
                // 情况1：重新入队（适用于临时异常，如网络抖动）
                // channel.basicNack(deliveryTag, false, true);
                // 情况2：拒绝并丢弃（适用于不可恢复异常，如参数错误）
                channel.basicNack(deliveryTag, false, false);
                // 情况3：拒绝并转发到死信队列（推荐，统一归档失败消息）
                // channel.basicReject(deliveryTag, false);
            }
            e.printStackTrace();
        }
    }

    /**
     * 监听死信队列（处理消费失败的订单消息）
     */
    @RabbitListener(queues = "order_dlq_queue")
    public void consumeOrderDlqMessage(Map<String, Object> orderMessage, Message message, com.rabbitmq.client.Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            System.out.println("接收到死信订单消息：" + JSON.toJSONString(orderMessage));
            // 死信消息处理逻辑（如人工排查、自动补偿等）
            channel.basicAck(deliveryTag, false);
            System.out.println("死信订单消息消费成功，已确认");
        } catch (Exception e) {
            System.err.println("死信订单消息消费失败：" + e.getMessage());
            channel.basicNack(deliveryTag, false, false);
            e.printStackTrace();
        }
    }
}
```

#### Kafka集成
Spring Boot 集成 Kafka

Kafka 基于发布-订阅模式，主打**高吞吐量、高可用性、海量消息存储**，适用于大数据场景、日志收集、流式计算、高频消息传输（如用户行为追踪、系统日志同步）。

1.  引入核心依赖

在 `pom.xml` 中添加 Kafka starter 依赖：
```xml
<!-- Spring Boot 集成 Kafka -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-kafka</artifactId>
</dependency>
```

2.  核心配置（application.yml）
```yaml
spring:
  # Kafka 配置
  kafka:
    bootstrap-servers: 127.0.0.1:9092 # Kafka 服务地址（多个地址用逗号分隔，如 192.168.1.100:9092,192.168.1.101:9092）
    # 生产者配置
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer # key 序列化方式
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer # value JSON 序列化
      acks: 1 # 消息确认级别（0=不确认，1=leader确认，all=所有副本确认）
      retries: 3 # 生产端重试次数
      batch-size: 16384 # 批量发送大小（字节）
      linger-ms: 1 # 批量发送延迟（毫秒）
      buffer-memory: 33554432 # 发送缓冲区大小
    # 消费者配置
    consumer:
      group-id: order-consumer-group # 消费者组ID（同一组内消费者负载均衡，不同组独立消费）
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer # key 反序列化
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer # value JSON 反序列化
      auto-offset-reset: earliest # 偏移量重置策略（earliest=从头开始，latest=从最新开始）
      enable-auto-commit: false # 关闭自动提交偏移量（推荐手动提交）
      max-poll-records: 10 # 每次拉取的消息数
    # 消费者监听配置
    listener:
      concurrency: 5 # 并发消费者数
      ack-mode: manual_immediate # 手动立即提交偏移量
      missing-topics-fatal: false # 忽略不存在的主题（启动时不报错）
    # JSON 反序列化配置（指定可反序列化的类）
    properties:
      spring:
        json:
          trusted:
            packages: com.example.demo.dto # 信任的DTO包路径
```

3.  生产端（消息发送）

使用 `KafkaTemplate` 发送消息，支持普通消息、对象消息，支持指定主题、分区、消息键。
```java
import com.alibaba.fastjson.JSON;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;

import java.util.UUID;

/**
 * Kafka 生产端（消息发送服务）
 */
@Service
public class KafkaProducerService {

    // 定义Kafka主题
    public static final String ORDER_TOPIC_NAME = "order_topic";

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate; // Kafka 操作模板

    /**
     * 发送订单消息（同步发送，适用于需要立即获取发送结果的场景）
     */
    public void sendOrderMessageSync(OrderDTO orderDTO) {
        try {
            // 构建消息键（可选，用于分区路由，相同key的消息发送到同一分区）
            String messageKey = "order_" + orderDTO.getOrderId();
            // 同步发送消息
            SendResult<String, Object> result = kafkaTemplate.send(
                    ORDER_TOPIC_NAME,
                    messageKey,
                    orderDTO
            ).get(); // 同步阻塞获取结果

            // 打印发送结果
            System.out.println("Kafka 订单消息同步发送成功：" + JSON.toJSONString(orderDTO));
            System.out.println("主题：" + result.getRecordMetadata().topic());
            System.out.println("分区：" + result.getRecordMetadata().partition());
            System.out.println("偏移量：" + result.getRecordMetadata().offset());
        } catch (Exception e) {
            System.err.println("Kafka 订单消息同步发送失败：" + e.getMessage());
            // 生产环境：异常处理（日志记录 + 重试 + 本地兜底）
            e.printStackTrace();
        }
    }

    /**
     * 发送订单消息（异步发送，推荐，非阻塞）
     */
    public void sendOrderMessageAsync(OrderDTO orderDTO) {
        try {
            String messageKey = "order_" + orderDTO.getOrderId();
            // 异步发送消息
            ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send(
                    ORDER_TOPIC_NAME,
                    messageKey,
                    orderDTO
            );

            // 异步回调处理发送结果
            future.addCallback(new ListenableFutureCallback<SendResult<String, Object>>() {
                @Override
                public void onSuccess(SendResult<String, Object> result) {
                    System.out.println("Kafka 订单消息异步发送成功：" + JSON.toJSONString(orderDTO));
                    System.out.println("分区：" + result.getRecordMetadata().partition() + "，偏移量：" + result.getRecordMetadata().offset());
                }

                @Override
                public void onFailure(Throwable ex) {
                    System.err.println("Kafka 订单消息异步发送失败：" + ex.getMessage());
                    ex.printStackTrace();
                }
            });
        } catch (Exception e) {
            System.err.println("Kafka 订单消息异步发送异常：" + e.getMessage());
            e.printStackTrace();
        }
    }

    // 订单DTO
    public static class OrderDTO {
        private Long orderId;
        private String userName;
        private Double amount;
        private String orderStatus;
        private String messageId = UUID.randomUUID().toString();
        // 省略 getter/setter/构造方法
    }
}
```

4.  消费端（消息接收）

使用 `@KafkaListener` 注解监听主题，支持手动提交偏移量（确保消息消费成功后再提交，避免重复消费）。
```java
import com.alibaba.fastjson.JSON;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka 消费端（消息接收组件）
 */
@Component
public class KafkaConsumerService {

    /**
     * 监听订单主题（手动提交偏移量）
     * topics：指定监听的主题名称
     * groupId：消费者组ID（可覆盖配置文件中的默认值）
     */
    @KafkaListener(topics = KafkaProducerService.ORDER_TOPIC_NAME, groupId = "order-consumer-group")
    public void consumeOrderMessage(KafkaProducerService.OrderDTO orderDTO, Acknowledgment acknowledgment) {
        try {
            // 1. 打印消息内容
            System.out.println("Kafka 接收到订单消息：" + JSON.toJSONString(orderDTO));

            // 2. 业务逻辑处理（如订单入库、状态更新等）
            Long orderId = orderDTO.getOrderId();
            String userName = orderDTO.getUserName();
            System.out.println("Kafka 处理订单：orderId=" + orderId + "，userName=" + userName);

            // 3. 手动提交偏移量（推荐，确保消息消费成功后提交）
            acknowledgment.acknowledge();
            System.out.println("Kafka 订单消息消费成功，已提交偏移量");
        } catch (Exception e) {
            System.err.println("Kafka 订单消息消费失败：" + e.getMessage());
            // 生产环境：异常处理（日志记录 + 重试 + 死信主题归档）
            // 若消费失败，不提交偏移量，Kafka 会在下次重新推送该消息
            e.printStackTrace();
        }
    }

    /**
     * 监听订单主题（批量消费，提升高吞吐量场景性能）
     * batchListener = true：开启批量消费
     */
    @KafkaListener(topics = KafkaProducerService.ORDER_TOPIC_NAME, groupId = "order-batch-consumer-group", batchListener = true)
    public void consumeOrderMessageBatch(java.util.List<KafkaProducerService.OrderDTO> orderList, Acknowledgment acknowledgment) {
        try {
            System.out.println("Kafka 批量接收到订单消息，数量：" + orderList.size());
            // 批量处理业务逻辑
            for (KafkaProducerService.OrderDTO orderDTO : orderList) {
                System.out.println("批量处理订单：" + JSON.toJSONString(orderDTO));
            }
            // 批量提交偏移量
            acknowledgment.acknowledge();
            System.out.println("Kafka 批量订单消息消费成功，已提交偏移量");
        } catch (Exception e) {
            System.err.println("Kafka 批量订单消息消费失败：" + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

四、 RabbitMQ vs Kafka 核心区别与选型建议
| 特性                | RabbitMQ                          | Kafka                              |
|---------------------|-----------------------------------|-----------------------------------|
| 核心协议            | AMQP（高级消息队列协议）          | 自定义TCP协议（基于发布-订阅）    |
| 吞吐量              | 中等（万级/秒）                   | 极高（十万级/秒，支持批量传输）   |
| 消息可靠性          | 强（支持持久化、手动确认、死信）  | 较强（支持持久化、副本机制，需手动提交偏移量） |
| 消息路由            | 灵活（交换机+路由键，支持直连/扇出/主题/头部） | 简单（按主题+分区路由，基于key哈希） |
| 存储机制            | 内存+磁盘（小消息优先，队列模式） | 磁盘顺序写入（海量消息存储，日志模式） |
| 适用场景            | 订单支付、消息通知、数据同步、低延迟小消息 | 日志收集、用户行为追踪、流式计算、高吞吐海量消息 |
| 扩展能力            | 中等（集群模式较复杂）            | 极强（分布式架构，横向扩展简单）  |

选型建议
1.  若**对消息可靠性要求极高、需要灵活路由、消息量中等**（如金融交易、订单系统、消息通知），优先选择 RabbitMQ；
2.  若**需要高吞吐量、海量消息存储、流式处理**（如日志收集、大数据分析、用户行为追踪），优先选择 Kafka；
3.  若系统是微服务架构，需要解耦多个服务，且消息量不大，RabbitMQ 更易上手和维护；
4.  若系统是大数据平台，需要处理TB级别的消息数据，Kafka 是最优选择。

五、 避坑指南

RabbitMQ 避坑点
1.  **务必开启消息持久化**：队列、交换机、消息均需设置持久化（`durable=true` + `DeliveryMode.PERSISTENT`），避免 RabbitMQ 重启后消息丢失；
2.  **推荐手动确认消息**：关闭自动确认（`acknowledge-mode: manual`），消费成功后再手动 `basicAck`，避免消费失败导致消息丢失；
3.  **合理使用死信队列**：不要直接丢弃消费失败的消息，通过死信队列归档，便于后续排查和补偿；
4.  **避免队列堆积**：监控队列长度，若出现堆积，及时扩容消费者或优化消费逻辑。

Kafka 避坑点
1.  **关闭自动提交偏移量**：设置 `enable-auto-commit: false`，手动通过 `Acknowledgment` 提交，避免消费失败导致消息重复消费；
2.  **合理设置消费者组**：同一主题的不同消费者组独立消费，同一消费者组内消费者负载均衡（消费者数不超过分区数）；
3.  **指定 JSON 序列化信任包**：配置 `spring.json.trusted.packages`，避免 JSON 反序列化时出现安全异常；
4.  **批量消费提升性能**：高吞吐量场景下，开启 `batchListener = true`，批量拉取和处理消息，减少网络开销。

六、 总结
1.  Spring Boot 集成 RabbitMQ/Kafka 均通过 starter 依赖快速实现，核心分别使用 `RabbitTemplate`/`KafkaTemplate` 发送消息，`@RabbitListener`/`@KafkaListener` 监听消息；
2.  RabbitMQ 主打可靠性和灵活路由，适用于业务系统的消息通信；Kafka 主打高吞吐量和海量存储，适用于大数据和日志场景；
3.  生产环境中，两者均需开启持久化、手动确认/提交，合理配置连接池和并发数，避免消息丢失或堆积；
4.  选型时需根据业务场景的**消息量、可靠性要求、路由复杂度**综合判断，切勿盲目追求高吞吐量而忽略维护成本。


### 实战案例
高并发异步处理系统

构建一个完整的异步处理系统，包括邮件发送、文件处理、数据同步等异步任务，演示不同场景下的异步处理方案。
```text
项目结构
src/main/java/com/example/async/
├── AsyncApplication.java          # 主启动类
├── config/
│   ├── AsyncConfig.java          # 异步配置类
│   └── ThreadPoolConfig.java     # 线程池配置
├── service/
│   ├── EmailService.java         # 邮件服务
│   ├── FileService.java          # 文件处理服务
│   └── DataSyncService.java      # 数据同步服务
├── task/
│   └── ScheduledTasks.java       # 定时任务
└── controller/
    └── AsyncController.java      # 异步接口
```


## SpringBoot 数据验证
### 内容概览
- 验证注解：常用验证注解的使用方法

- 分组验证：不同场景下的验证规则

- 自定义验证： 创建自定义验证器

- 异常处理： 验证异常的统一处理

### 实战案例
用户管理系统数据验证

构建一个完整的用户管理系统，包括用户注册、信息更新、密码修改等功能的数据验证，演示各种验证场景和自定义验证规则。
```text
项目结构
src/main/java/com/example/validation/
├── ValidationApplication.java     # 主启动类
├── model/
│   ├── User.java                 # 用户实体
│   ├── UserRegistration.java     # 用户注册DTO
│   └── UserUpdate.java           # 用户更新DTO
├── validator/
│   ├── PhoneValidator.java       # 手机号验证器
│   ├── PasswordValidator.java    # 密码验证器
│   └── UniqueEmailValidator.java # 邮箱唯一性验证器
├── annotation/
│   ├── Phone.java               # 手机号验证注解
│   ├── Password.java            # 密码验证注解
│   └── UniqueEmail.java         # 邮箱唯一性注解
├── controller/
│   └── UserController.java      # 用户控制器
└── exception/
    └── ValidationExceptionHandler.java # 验证异常处理器
```
### 重点知识
#### 基础验证注解
- @NotNull: 验证非空
- @NotEmpty: 验证非空字符串
- @NotBlank: 验证非空字符串（去空格后判断）
- @Size: 验证字符串长度 范围
- @Min: 最小值  
- @Max: 最大值
- @Pattern: 验证正则
- @Email: 验证邮箱格式
- @Valid: 验证对象
- @Validated: 验证对象（支持分组）
#### 分组验证
- 验证组接口定义
- @Validated注解使用
- 组合验证规则
- 继承验证组
#### 自定义验证器
- ConstraintValidator接口
- 自定义验证注解
- 验证器实现类
- 复杂业务验证
#### 异常处理
- MethodArgumentNotValidException
- ConstraintViolationException
- @ExceptionHandler
- 错误信息国际化