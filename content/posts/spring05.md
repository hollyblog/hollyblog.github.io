---
title: "SpringBoot-测试与监控管理"
date: 2021-02-19T19:29:39+08:00
draft: false
description: "SpringBoot-测试与监控管理：SpringBoot测试框架、SpringBoot Actuator。"
tags: ["SpringBoot","框架应用"]
categories: ["Framework"]
---

## SpringBoot 测试
### 核心概念
- Unit Test：单元测试
- Integration Test：集成测试
- Mock：模拟对象
- Stub：存根
- Test Slice：测试切片
- Test Context：测试上下文
### 测试依赖配置
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- 包含以下测试框架 -->
<!-- JUnit 5 - 测试框架 -->
<!-- Mockito - Mock框架 -->
<!-- AssertJ - 断言库 -->
<!-- Hamcrest - 匹配器 -->
<!-- Spring Test - Spring测试支持 -->
<!-- Spring Boot Test - SpringBoot测试支持 -->

<!-- 额外测试依赖 -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mysql</artifactId>
    <scope>test</scope>
</dependency>
```              
### 测试执行流程
```text
编写测试 → 配置环境 → 执行测试 → 验证结果 → 生成报告 → 持续集成
```
### 测试金字塔
测试策略分层
- 端到端测试 (E2E Tests) - 少量
- 集成测试 (Integration Tests) - 适量
- 单元测试 (Unit Tests) - 大量

### 单元测试示例
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("根据ID查找用户 - 成功")
    void findById_Success() {
        // Given
        Long userId = 1L;
        User mockUser = new User(userId, "张三", "zhangsan@example.com");
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        // When
        User result = userService.findById(userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(userId);
        assertThat(result.getName()).isEqualTo("张三");
        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("根据ID查找用户 - 用户不存在")
    void findById_UserNotFound() {
        // Given
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.findById(userId))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessage("用户不存在: " + userId);
    }

    @Test
    @DisplayName("创建用户 - 成功")
    void createUser_Success() {
        // Given
        CreateUserRequest request = new CreateUserRequest("李四", "lisi@example.com");
        User savedUser = new User(2L, "李四", "lisi@example.com");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // When
        User result = userService.createUser(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("李四");
        assertThat(result.getEmail()).isEqualTo("lisi@example.com");
    }
}
```               
### Web层测试
```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("获取用户信息 - 成功")
    void getUser_Success() throws Exception {
        // Given
        Long userId = 1L;
        User user = new User(userId, "张三", "zhangsan@example.com");
        when(userService.findById(userId)).thenReturn(user);

        // When & Then
        mockMvc.perform(get("/api/users/{id}", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(userId))
            .andExpect(jsonPath("$.name").value("张三"))
            .andExpect(jsonPath("$.email").value("zhangsan@example.com"));
    }

    @Test
    @DisplayName("创建用户 - 成功")
    void createUser_Success() throws Exception {
        // Given
        CreateUserRequest request = new CreateUserRequest("李四", "lisi@example.com");
        User createdUser = new User(2L, "李四", "lisi@example.com");
        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(createdUser);

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("李四"))
            .andExpect(jsonPath("$.email").value("lisi@example.com"));
    }
}
```               
### 数据层测试
```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("根据邮箱查找用户")
    void findByEmail_Success() {
        // Given
        User user = new User("张三", "zhangsan@example.com");
        entityManager.persistAndFlush(user);

        // When
        Optional<User> found = userRepository.findByEmail("zhangsan@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("张三");
    }

    @Test
    @DisplayName("根据名称查找用户列表")
    void findByNameContaining_Success() {
        // Given
        entityManager.persistAndFlush(new User("张三", "zhangsan@example.com"));
        entityManager.persistAndFlush(new User("张四", "zhangsi@example.com"));
        entityManager.persistAndFlush(new User("李五", "liwu@example.com"));

        // When
        List<User> users = userRepository.findByNameContaining("张");

        // Then
        assertThat(users).hasSize(2);
        assertThat(users).extracting(User::getName)
            .containsExactlyInAnyOrder("张三", "张四");
    }
}
```                
### 集成测试示例
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.properties")
class UserIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("用户完整流程测试")
    void userCompleteFlow() {
        // 1. 创建用户
        CreateUserRequest createRequest = new CreateUserRequest("张三", "zhangsan@example.com");
        
        ResponseEntity<User> createResponse = restTemplate.postForEntity(
            "/api/users", createRequest, User.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        User createdUser = createResponse.getBody();
        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getName()).isEqualTo("张三");

        // 2. 查询用户
        ResponseEntity<User> getResponse = restTemplate.getForEntity(
            "/api/users/" + createdUser.getId(), User.class);
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        User retrievedUser = getResponse.getBody();
        assertThat(retrievedUser).isNotNull();
        assertThat(retrievedUser.getId()).isEqualTo(createdUser.getId());

        // 3. 更新用户
        UpdateUserRequest updateRequest = new UpdateUserRequest("张三丰", "zhangsan@example.com");
        
        restTemplate.put("/api/users/" + createdUser.getId(), updateRequest);

        // 4. 验证更新
        ResponseEntity<User> updatedResponse = restTemplate.getForEntity(
            "/api/users/" + createdUser.getId(), User.class);
        
        User updatedUser = updatedResponse.getBody();
        assertThat(updatedUser.getName()).isEqualTo("张三丰");

        // 5. 删除用户
        restTemplate.delete("/api/users/" + createdUser.getId());

        // 6. 验证删除
        ResponseEntity<String> deletedResponse = restTemplate.getForEntity(
            "/api/users/" + createdUser.getId(), String.class);
        
        assertThat(deletedResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
```                
### 测试注解对比
- @SpringBootTest: 完整的Spring Boot应用上下文测试
- @WebMvcTest: Web层测试，只加载MVC相关组件
- @DataJpaTest: JPA数据层测试，使用内存数据库
- @JsonTest: JSON序列化和反序列化测试
- @TestConfiguration: 测试专用配置类
- @MockBean: Spring上下文中的Mock Bean

### 测试类型分类
- 单元测试 (Unit Tests)
- 集成测试 (Integration Tests)
- 端到端测试 (E2E Tests)
- 性能测试 (Performance Tests)
- 安全测试 (Security Tests)
### Testcontainers集成
```java
@SpringBootTest
@Testcontainers
class DatabaseIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("真实数据库环境测试")
    void testWithRealDatabase() {
        // Given
        User user = new User("张三", "zhangsan@example.com");
        
        // When
        User saved = userRepository.save(user);
        
        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(userRepository.findById(saved.getId())).isPresent();
    }
}
```                
### 测试覆盖率配置
```xml
<!-- Maven Surefire Plugin -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0-M7</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
            <include>**/*Tests.java</include>
        </includes>
    </configuration>
</plugin>

<!-- JaCoCo Coverage Plugin -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.8</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```               
### 测试框架对比
| 测试框架	| 优点	| 缺点	| 适用场景
| --- | --- | --- | --- |
| JUnit 5	| 功能强大，注解丰富	| 学习成本较高	| 单元测试
| Mockito	| Mock功能完善	| 过度使用影响测试质量	| 依赖隔离
| TestContainers	| 真实环境测试	| 启动速度较慢	| 集成测试
| WireMock	| HTTP服务模拟	| 配置复杂	| 外部服务测试
| Selenium	| 真实浏览器测试	| 维护成本高	| UI自动化测试
### 测试最佳实践
测试开发建议
1. 测试命名：使用描述性的测试方法名

2. AAA模式：Arrange-Act-Assert结构

3. 独立性：测试之间不应相互依赖

4. 快速反馈：单元测试应快速执行

5. 覆盖率：追求有意义的测试覆盖

6. 测试数据：使用测试专用数据

7. 持续集成：自动化测试执行

8. 测试维护：及时更新和重构测试

## SpringBoot 监控
### 核心概念
- Actuator：生产就绪功能监控
- Endpoints：监控和管理端点
- Health Indicators：健康状态指示器
- Metrics：应用性能指标
- Info：应用信息展示
- Custom Endpoints：自定义监控端点
### 依赖配置
```xml
<!-- Actuator核心依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Web支持 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- 安全支持 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Micrometer监控 -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```                    
### 监控架构流程
```text
应用启动 → Actuator初始化 → 端点注册 → 健康检查 → 指标收集 → 监控展示
```
#### 配置示例
```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,env,beans
      base-path: /actuator
  endpoint:
    health:
      show-details: always
      show-components: always
    info:
      enabled: true
    metrics:
      enabled: true
  health:
    defaults:
      enabled: true
    diskspace:
      enabled: true
    db:
      enabled: true
  info:
    env:
      enabled: true
    java:
      enabled: true
    os:
      enabled: true

# 应用信息
info:
  app:
    name: SpringBoot监控示例
    version: 1.0.0
    description: Actuator监控功能演示
  build:
    artifact: spring-boot-actuator-demo
    version: 1.0.0
```              
#### 监控仪表板
实时监控指标

- UP 应用状态
- 364MB 内存使用
- 55ms 响应时间
- 1349 请求总数

#### 健康检查配置
```java
@Component
public class CustomHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        // 检查业务逻辑
        boolean isHealthy = checkBusinessLogic();
        
        if (isHealthy) {
            return Health.up()
                .withDetail("database", "连接正常")
                .withDetail("cache", "缓存可用")
                .withDetail("external-service", "服务正常")
                .build();
        } else {
            return Health.down()
                .withDetail("error", "业务检查失败")
                .build();
        }
    }
    
    private boolean checkBusinessLogic() {
        // 实际的健康检查逻辑
        return true;
    }
}
```              
#### 自定义指标
```java
@RestController
public class MetricsController {
    
    private final MeterRegistry meterRegistry;
    private final Counter requestCounter;
    private final Timer requestTimer;
    
    public MetricsController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.requestCounter = Counter.builder("api.requests")
            .description("API请求计数")
            .register(meterRegistry);
        this.requestTimer = Timer.builder("api.response.time")
            .description("API响应时间")
            .register(meterRegistry);
    }
    
    @GetMapping("/api/data")
    public String getData() {
        return Timer.Sample.start(meterRegistry)
            .stop(requestTimer);
    }
}
```               
#### 监控端点
- GET /actuator/health
应用健康状态检查
- GET /actuator/info
应用基本信息
- GET /actuator/metrics
应用性能指标
- GET /actuator/env
环境变量信息
- GET /actuator/beans
Spring Bean信息
- GET /actuator/prometheus
Prometheus格式指标
#### 安全配置
```java
@Configuration
@EnableWebSecurity
public class ActuatorSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }
}
```
```yaml
# 配置用户
spring:
  security:
    user:
      name: admin
      password: admin123
      roles: ADMIN
```               
#### 自定义端点
```java
@Component
@Endpoint(id = "business")
public class BusinessEndpoint {
    
    @ReadOperation
    public Map<String, Object> business() {
        Map<String, Object> details = new HashMap<>();
        details.put("activeUsers", 1500);
        details.put("totalOrders", 25000);
        details.put("revenue", "¥1,250,000");
        details.put("systemLoad", "正常");
        return details;
    }
    
    @WriteOperation
    public void updateConfig(@Selector String key, String value) {
        // 更新配置逻辑
        System.out.println("更新配置: " + key + " = " + value);
    }
}
```               
#### 监控对比
| 监控类型 | 端点 | 用途 | 安全级别 |
| -------- | ---- | ---- | -------- |
|健康检查	|/actuator/health	|应用状态监控	|公开
|应用信息	|/actuator/info	|版本和构建信息	|公开
|性能指标	|/actuator/metrics	|JVM和应用指标	|受保护
|环境信息	|/actuator/env	|配置和环境变量	|受保护
|Bean信息	|/actuator/beans	|Spring容器Bean	|受保护
|日志配置	|/actuator/loggers	|动态调整日志级别	|受保护
### 最佳实践
监控配置建议
1. 端点安全：生产环境必须配置认证和授权

2. 选择性暴露：只暴露必要的监控端点

3. 健康检查：实现业务相关的健康检查逻辑

4. 自定义指标：收集业务关键指标

5. 监控集成：与Prometheus、Grafana等工具集成

6. 告警配置：设置关键指标的告警阈值