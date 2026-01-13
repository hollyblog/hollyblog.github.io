---
title: "设计模式与软件工程"
date: 2021-12-07T13:18:17+08:00
draft: false
description: "设计模式与软件工程是计算机基础中的重要内容，主要分享对设计模式的基本原理和功能，以及软件工程的工作原理和实现。"
tags: ["计算机基础", "设计模式", "软件工程"]
categories: ["Computer"]
---

## 1. 模块总览
对于3年经验的开发者，**设计模式与软件工程复习重点应聚焦于SOLID原则、创建型模式（工厂、单例）、结构型模式（装饰器、代理）、行为型模式（观察者、策略）以及软件设计原则，面试分值占比15-20%，是评估代码架构能力和工程素养的关键。**

## 2. 面试题清单（Top10高频真题）

| 排名 | 题目 | 高频出现公司 |
|------|------|-------------|
| 1 | 单例模式的实现方式、双重检查锁定、枚举单例 | 所有大厂 |
| 2 | 工厂模式与抽象工厂模式的区别与应用场景 | 阿里/字节/美团 |
| 3 | 装饰器模式与代理模式的区别与实现 | 腾讯/阿里/字节 |
| 4 | 观察者模式在事件驱动系统中的应用 | 美团/京东/阿里 |
| 5 | 策略模式与模板方法模式的对比 | 字节/腾讯 |
| 6 | 设计原则（SOLID、DRY、KISS、YAGNI） | 所有大厂 |
| 7 | MVC、MVP、MVVM架构模式的区别 | 阿里/腾讯/美团 |
| 8 | 设计模式在框架中的应用（Spring中的设计模式） | 阿里/京东 |
| 9 | 重构的常用手法与时机选择 | 美团/字节 |
| 10 | 软件设计中的开闭原则与里氏替换原则 | 腾讯/阿里 |

## 3. 逐题深度拆解

### **题目1：单例模式的实现方式、双重检查锁定、枚举单例**

#### 原理
**单例模式演化图**：

![单例模式演化图](img/computer03-1.png)

**关键实现代码对比**：
```java
// 1. 饿汉式（线程安全）
public class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {}
    public static Singleton getInstance() {
        return INSTANCE;
    }
}

// 2. 懒汉式（线程不安全）
public class Singleton {
    private static Singleton instance;
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {  // 线程不安全点
            instance = new Singleton();
        }
        return instance;
    }
}

// 3. 双重检查锁定（DCL）
public class Singleton {
    private static volatile Singleton instance;  // volatile必须
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {  // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null) {  // 第二次检查
                    instance = new Singleton();
                    // 1. 分配内存 2. 初始化对象 3. 指向引用
                    // volatile防止指令重排序，保证写操作对后续读可见
                }
            }
        }
        return instance;
    }
}

// 4. 静态内部类（推荐）
public class Singleton {
    private Singleton() {}
    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() {
        return Holder.INSTANCE;  // 类加载时初始化，线程安全
    }
}

// 5. 枚举单例（最佳实践）
public enum Singleton {
    INSTANCE;
    public void doSomething() {
        // 业务方法
    }
}
```

#### 场景
**Spring框架中的单例应用**：
```java
// Spring默认使用单例作用域，但不是传统单例模式
@Component
public class UserService {
    // Spring容器管理的单例
}

// 实际Spring使用三级缓存解决循环依赖的单例初始化问题
// 一级缓存：singletonObjects 存放完全初始化好的单例
// 二级缓存：earlySingletonObjects 存放早期对象（未完成属性注入）
// 三级缓存：singletonFactories 存放对象工厂
```

#### 追问
**Q：为什么枚举单例是最佳实践？**
1. **防止反射攻击**：枚举类的构造方法在反射时会被检查，阻止通过反射创建实例
2. **防止序列化破坏**：枚举的序列化机制保证反序列化时返回同一个实例
3. **线程安全**：枚举实例的创建由JVM保证线程安全
4. **代码简洁**：无需自己实现双重检查等机制

**Q：双重检查锁定中volatile的作用？**
```java
// 没有volatile时可能出现的问题
instance = new Singleton();
// 实际执行分为三步：
// 1. 分配内存空间
// 2. 初始化对象（调用构造方法）
// 3. 将instance指向内存空间（此时instance != null）

// 可能发生指令重排序：1->3->2
// 线程A执行到3时，instance不为null但对象未初始化
// 线程B判断instance != null，直接返回未初始化的对象

// volatile的作用：
// 1. 禁止指令重排序（内存屏障）
// 2. 保证可见性（写操作立即刷新到主内存）
```

#### 总结
单例模式确保一个类只有一个实例，推荐使用枚举或静态内部类实现，注意线程安全和防止反射/序列化破坏。

---

### **题目2：工厂模式与抽象工厂模式的区别与应用场景**

#### 原理
**工厂模式家族关系图**：
![工厂模式家族关系图](img/computer03-2.png)

**代码实现对比**：
```java
// 1. 简单工厂模式（静态工厂）
public class SimpleFactory {
    public static Product createProduct(String type) {
        if ("A".equals(type)) {
            return new ProductA();
        } else if ("B".equals(type)) {
            return new ProductB();
        }
        throw new IllegalArgumentException("Unknown product type");
    }
}
// 问题：增加新产品需要修改工厂类，违反开闭原则

// 2. 工厂方法模式
public interface Factory {
    Product createProduct();
}
public class FactoryA implements Factory {
    public Product createProduct() {
        return new ProductA();
    }
}
// 每个产品对应一个工厂，符合开闭原则

// 3. 抽象工厂模式
public interface AbstractFactory {
    Phone createPhone();
    Laptop createLaptop();
}
public class AppleFactory implements AbstractFactory {
    public Phone createPhone() { return new iPhone(); }
    public Laptop createLaptop() { return new MacBook(); }
}
public class HuaweiFactory implements AbstractFactory {
    public Phone createPhone() { return new MatePhone(); }
    public Laptop createLaptop() { return new MateBook(); }
}
// 生产产品族，适合系列产品
```

#### 场景
**电商系统中的支付工厂**：
```java
// 支付方式抽象
public interface Payment {
    void pay(BigDecimal amount);
}
public class Alipay implements Payment { /* ... */ }
public class WechatPay implements Payment { /* ... */ }
public class UnionPay implements Payment { /* ... */ }

// 工厂方法模式实现
public interface PaymentFactory {
    Payment createPayment();
}
public class AlipayFactory implements PaymentFactory {
    public Payment createPayment() {
        return new Alipay();
    }
}

// 使用时根据配置选择工厂
public class PaymentService {
    private PaymentFactory factory;
    
    public PaymentService(PaymentFactory factory) {
        this.factory = factory;  // 依赖注入
    }
    
    public void processOrder(Order order) {
        Payment payment = factory.createPayment();
        payment.pay(order.getAmount());
    }
}
```

#### 追问
**Q：工厂方法模式 vs 抽象工厂模式？**
| 维度 | 工厂方法模式 | 抽象工厂模式 |
|------|-------------|-------------|
| **产品维度** | 单一产品 | 产品族（多个相关产品） |
| **扩展性** | 容易扩展新产品 | 容易扩展产品族，难扩展新产品种类 |
| **抽象级别** | 类级别 | 系统级别 |
| **使用场景** | 创建单一产品对象 | 创建一系列相关或依赖的对象 |

**Q：Spring框架中的工厂模式应用？**
```java
// 1. BeanFactory：工厂方法模式的典型应用
BeanFactory factory = new ClassPathXmlApplicationContext("beans.xml");
Object bean = factory.getBean("userService");

// 2. FactoryBean：特殊工厂，用于创建复杂对象
@Component
public class MyFactoryBean implements FactoryBean<User> {
    public User getObject() {
        // 复杂的创建逻辑
        return new User();
    }
    public Class<?> getObjectType() {
        return User.class;
    }
}

// 3. @Bean注解：配置类中的工厂方法
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        // 创建并配置DataSource
        return new HikariDataSource();
    }
}
```

#### 总结
简单工厂违反开闭原则，工厂方法针对单一产品，抽象工厂针对产品族；Spring大量使用工厂模式管理Bean生命周期。

---

### **题目3：装饰器模式与代理模式的区别与实现**

#### 原理
**装饰器与代理对比图**：
![装饰器与代理对比图](img/computer03-3.png)

**核心区别**：
| 维度 | 装饰器模式 | 代理模式 |
|------|-----------|----------|
| **目的** | 增强功能（运行时动态添加） | 控制访问（权限控制、延迟加载等） |
| **关系** | 装饰者和被装饰者实现同一接口 | 代理和真实对象实现同一接口 |
| **关注点** | 功能增强 | 访问控制 |
| **创建时机** | 运行时动态组合 | 编译时或运行时确定 |

#### 场景
**Java I/O中的装饰器模式**：
```java
// Java I/O是装饰器模式的经典应用
InputStream input = new FileInputStream("data.txt");
input = new BufferedInputStream(input);  // 添加缓冲功能
input = new DataInputStream(input);      // 添加读取基本类型功能

// 每个装饰器都扩展了InputStream的功能
// 可以灵活组合各种功能

// 实际代码结构：
// InputStream (抽象组件)
// FileInputStream (具体组件)
// FilterInputStream (装饰器基类)
// BufferedInputStream, DataInputStream (具体装饰器)
```

**Spring AOP中的代理模式**：
```java
// Spring AOP使用动态代理实现
public interface UserService {
    void saveUser(User user);
}

// 目标类
@Service
public class UserServiceImpl implements UserService {
    public void saveUser(User user) {
        // 业务逻辑
    }
}

// 切面（增强逻辑）
@Aspect
@Component
public class LogAspect {
    @Before("execution(* com.example.UserService.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        // 记录日志
    }
}

// Spring创建代理对象
// JDK动态代理（基于接口）或CGLIB代理（基于类）
// 代理对象在方法调用前后执行切面逻辑
```

#### 追问
**Q：静态代理 vs 动态代理？**
```java
// 1. 静态代理（手动编写代理类）
public class UserServiceProxy implements UserService {
    private UserService target;
    
    public UserServiceProxy(UserService target) {
        this.target = target;
    }
    
    public void saveUser(User user) {
        // 前置增强
        System.out.println("开始保存用户...");
        // 调用目标方法
        target.saveUser(user);
        // 后置增强
        System.out.println("用户保存完成");
    }
}

// 2. JDK动态代理（基于接口）
public class DynamicProxy {
    public static Object createProxy(Object target) {
        return Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new InvocationHandler() {
                public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                    // 前置增强
                    System.out.println("调用方法: " + method.getName());
                    // 调用目标方法
                    Object result = method.invoke(target, args);
                    // 后置增强
                    return result;
                }
            }
        );
    }
}

// 3. CGLIB动态代理（基于类，不需要接口）
// Spring AOP默认使用CGLIB
```

**Q：装饰器模式与继承的区别？**
- **继承**：编译时确定，静态增强，类爆炸问题（每个组合都需要一个子类）
- **装饰器**：运行时动态组合，更灵活，避免类爆炸
- **原则**：优先使用组合（装饰器）而非继承

#### 总结
装饰器模式动态增强功能，代理模式控制对象访问；Java I/O用装饰器，Spring AOP用代理；动态代理比静态代理更灵活。

---

### **题目4：观察者模式在事件驱动系统中的应用**

#### 原理
**观察者模式架构**：
![观察者模式架构](img/computer03-4.png)

**Java内置观察者支持**：
```java
// Java自带观察者模式（已过时，但原理相同）
import java.util.Observable;
import java.util.Observer;

// 被观察者（主题）
class WeatherData extends Observable {
    private float temperature;
    
    public void setMeasurements(float temperature) {
        this.temperature = temperature;
        setChanged();  // 标记状态已改变
        notifyObservers(temperature);  // 通知观察者
    }
}

// 观察者
class Display implements Observer {
    public void update(Observable o, Object arg) {
        if (o instanceof WeatherData) {
            System.out.println("温度更新: " + arg);
        }
    }
}
```

#### 场景
**Spring事件驱动机制**：
```java
// 1. 定义事件
public class OrderCreatedEvent extends ApplicationEvent {
    private Order order;
    public OrderCreatedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }
    public Order getOrder() { return order; }
}

// 2. 发布事件
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void createOrder(Order order) {
        // 创建订单
        orderRepository.save(order);
        
        // 发布事件
        eventPublisher.publishEvent(new OrderCreatedEvent(this, order));
    }
}

// 3. 监听事件（同步）
@Component
public class EmailService {
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 发送邮件通知
        sendEmail(event.getOrder().getUserEmail(), "订单创建成功");
    }
}

// 4. 监听事件（异步）
@Component
public class InventoryService {
    @Async  // 异步执行
    @EventListener
    public void handleOrderCreatedAsync(OrderCreatedEvent event) {
        // 更新库存，耗时操作
        updateInventory(event.getOrder());
    }
}

// 5. 事务事件监听
@Component
public class AuditService {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderCreatedAfterCommit(OrderCreatedEvent event) {
        // 事务提交后才执行
        logAudit(event.getOrder());
    }
}
```

#### 追问
**Q：观察者模式 vs 发布订阅模式？**
| 维度 | 观察者模式 | 发布订阅模式 |
|------|-----------|-------------|
| **耦合度** | 观察者和被观察者直接耦合 | 通过消息队列解耦 |
| **通信方式** | 直接调用观察者方法 | 通过中间件传递消息 |
| **时机** | 状态改变时立即通知 | 生产者发布，消费者订阅 |
| **典型实现** | Java Observable/Observer | RabbitMQ、Kafka |

**Q：Spring事件机制的优势？**
1. **松耦合**：业务逻辑与事件处理分离
2. **异步处理**：@Async注解支持异步事件处理
3. **事务支持**：@TransactionalEventListener支持事务边界
4. **顺序控制**：@Order注解控制监听器执行顺序
5. **条件过滤**：@EventListener(condition = "...")条件执行

#### 总结
观察者模式实现对象间一对多依赖，状态变化时自动通知；Spring事件机制基于观察者模式，支持同步/异步和事务边界。

---

### **题目5：设计原则（SOLID、DRY、KISS、YAGNI）**

#### 原理
**SOLID原则详解**：
![SOLID原则](img/computer03-5.png)

**代码示例**：
```java
// 1. 单一职责原则（SRP）
// 违反：User类既负责用户信息又负责数据库操作
class User {
    private String name;
    private String email;
    
    public void saveToDatabase() {  // 违反SRP
        // 数据库操作
    }
}

// 符合：拆分职责
class User {
    private String name;
    private String email;
    // 只包含用户数据
}

class UserRepository {
    public void save(User user) {
        // 数据库操作
    }
}

// 2. 开闭原则（OCP）
// 违反：每次增加新类型都要修改代码
class ShapeDrawer {
    public void draw(String type) {
        if ("circle".equals(type)) {
            drawCircle();
        } else if ("rectangle".equals(type)) {
            drawRectangle();
        }
        // 增加新类型需要修改此方法
    }
}

// 符合：对扩展开放，对修改关闭
interface Shape {
    void draw();
}
class Circle implements Shape { public void draw() { /* ... */ } }
class Rectangle implements Shape { public void draw() { /* ... */ } }
class ShapeDrawer {
    public void draw(Shape shape) {
        shape.draw();  // 增加新类型无需修改此方法
    }
}
```

#### 场景
**电商订单系统设计原则应用**：
```java
// 1. 单一职责：拆分订单处理为多个类
class OrderValidator {  // 只负责验证
    public boolean validate(Order order) { /* ... */ }
}
class OrderCalculator {  // 只负责计算
    public BigDecimal calculateTotal(Order order) { /* ... */ }
}
class OrderPersister {  // 只负责持久化
    public void save(Order order) { /* ... */ }
}

// 2. 开闭原则：支付方式扩展
interface PaymentProcessor {
    void processPayment(Order order);
}
class AlipayProcessor implements PaymentProcessor { /* ... */ }
class WechatPayProcessor implements PaymentProcessor { /* ... */ }
// 新增支付方式：实现接口即可，无需修改现有代码

// 3. 里氏替换：折扣计算
abstract class Discount {
    abstract BigDecimal apply(Order order);
}
class PercentageDiscount extends Discount {
    public BigDecimal apply(Order order) {
        return order.getAmount().multiply(new BigDecimal("0.9"));
    }
}
class FixedDiscount extends Discount {
    public BigDecimal apply(Order order) {
        return order.getAmount().subtract(new BigDecimal("10"));
    }
}
// 任意Discount子类都可以替换父类使用

// 4. 接口隔离：拆分庞大接口
// 违反：一个接口包含太多方法
interface OrderOperations {
    void createOrder();
    void cancelOrder();
    void refundOrder();
    void generateInvoice();
    void sendNotification();
}

// 符合：按职责拆分接口
interface OrderCRUD {
    void createOrder();
    void cancelOrder();
}
interface PaymentOperations {
    void refundOrder();
}
interface DocumentOperations {
    void generateInvoice();
}
interface NotificationOperations {
    void sendNotification();
}

// 5. 依赖倒置：高层模块不依赖低层模块
// 违反：高层直接依赖具体实现
class OrderService {
    private MySQLOrderRepository repository;  // 直接依赖具体实现
    
    public OrderService() {
        this.repository = new MySQLOrderRepository();
    }
}

// 符合：依赖抽象接口
class OrderService {
    private OrderRepository repository;  // 依赖抽象
    
    public OrderService(OrderRepository repository) {  // 依赖注入
        this.repository = repository;
    }
}
interface OrderRepository {
    void save(Order order);
}
class MySQLOrderRepository implements OrderRepository { /* ... */ }
class MongoDBOrderRepository implements OrderRepository { /* ... */ }
```

#### 追问
**Q：DRY、KISS、YAGNI原则如何平衡？**
- **DRY（Don't Repeat Yourself）**：消除重复代码，但不要过度抽象
- **KISS（Keep It Simple, Stupid）**：保持简单，避免过度设计
- **YAGNI（You Ain't Gonna Need It）**：不要添加当前不需要的功能
- **平衡策略**：先满足KISS和YAGNI，当重复出现时应用DRY

**Q：如何在实际开发中应用SOLID原则？**
1. **代码审查时检查**：是否一个类做太多事情？是否容易扩展？
2. **重构时应用**：识别违反原则的代码，逐步重构
3. **设计时考虑**：从接口设计开始，遵循依赖倒置
4. **团队共识**：统一代码规范，培训团队成员

#### 总结
SOLID是面向对象设计的核心原则，DRY/KISS/YAGNI是实践指导；良好设计需要在可读性、可维护性和灵活性间平衡。

## 4. 踩坑雷达

### **案例1：过度设计导致的系统复杂化**
**故障现象**：某电商系统初期过度使用设计模式，创建了大量抽象层和接口，导致代码难以理解和维护，新功能开发效率低下。

**错误实现**：
```java
// 过度设计：为每个简单操作都创建接口和实现
public interface IUserService {
    IUserDTO createUser(IUserDTO user);
    IUserDTO updateUser(IUserDTO user);
    IUserDTO getUserById(Long id);
    // ... 20多个方法
}

public interface IUserDTO {
    // DTO接口，增加了不必要的复杂度
}

public class UserServiceImpl implements IUserService {
    private IUserRepository userRepository;
    private IUserMapper userMapper;
    private IUserValidator userValidator;
    // 依赖多个接口，每个都很简单
    
    public IUserDTO createUser(IUserDTO userDto) {
        // 验证、转换、保存... 简单逻辑被拆到多个类
        userValidator.validate(userDto);
        User user = userMapper.toEntity(userDto);
        user = userRepository.save(user);
        return userMapper.toDto(user);
    }
}
// 问题：简单CRUD被过度抽象，类爆炸，阅读代码需要跳转多个文件
```

**如何避免**：
```java
// 适度设计：简单场景保持简单
@Service
public class UserService {
    private UserRepository userRepository;
    
    public User createUser(CreateUserRequest request) {
        // 参数验证（使用注解验证）
        validateRequest(request);
        
        // 业务逻辑（保持内聚）
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        
        // 保存
        return userRepository.save(user);
    }
    
    private void validateRequest(CreateUserRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("姓名不能为空");
        }
        // 简单的验证逻辑直接写在方法内
    }
}

// 指导原则：
// 1. 项目初期遵循YAGNI，不要为未来可能的需求设计
// 2. 当重复代码出现3次以上，才考虑抽象
// 3. 保持类和方法的小而专，但避免过度拆分
// 4. 定期重构，而不是一开始就设计完美架构
```

### **案例2：单例模式滥用导致测试困难**
**故障现象**：某支付系统中大量使用单例模式，导致单元测试无法隔离依赖，测试相互影响，测试覆盖率低。

**错误实现**：
```java
// 全局配置管理器（滥用单例）
public class ConfigManager {
    private static final ConfigManager INSTANCE = new ConfigManager();
    private Properties config;
    
    private ConfigManager() {
        loadConfig();  // 加载配置文件
    }
    
    public static ConfigManager getInstance() {
        return INSTANCE;
    }
    
    public String getProperty(String key) {
        return config.getProperty(key);
    }
}

// 支付服务依赖全局单例
public class PaymentService {
    public void processPayment() {
        String apiKey = ConfigManager.getInstance().getProperty("api.key");
        // 使用apiKey调用支付接口
    }
}

// 测试问题：
// 1. 无法模拟ConfigManager
// 2. 测试相互影响（修改配置影响其他测试）
// 3. 无法并行执行测试
```

**如何避免**：
```java
// 方案1：使用依赖注入代替单例
@Component
public class ConfigManager {
    private Properties config;
    
    @PostConstruct
    public void init() {
        loadConfig();
    }
    
    public String getProperty(String key) {
        return config.getProperty(key);
    }
}

@Service
public class PaymentService {
    private final ConfigManager configManager;
    
    @Autowired
    public PaymentService(ConfigManager configManager) {  // 依赖注入
        this.configManager = configManager;
    }
    
    public void processPayment() {
        String apiKey = configManager.getProperty("api.key");
        // 使用apiKey
    }
}

// 测试时可以注入mock对象
@SpringBootTest
class PaymentServiceTest {
    @MockBean
    private ConfigManager configManager;
    
    @Autowired
    private PaymentService paymentService;
    
    @Test
    void testProcessPayment() {
        // 配置mock行为
        when(configManager.getProperty("api.key")).thenReturn("test-key");
        
        // 执行测试
        paymentService.processPayment();
        
        // 验证
        verify(configManager).getProperty("api.key");
    }
}

// 方案2：对于真正的全局配置，使用可重置的单例
public class ConfigManager {
    private static ConfigManager instance;
    private Properties config;
    
    private ConfigManager() {}
    
    public static synchronized ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager();
            instance.loadConfig();
        }
        return instance;
    }
    
    // 测试专用：重置单例
    public static synchronized void resetForTesting() {
        instance = null;
    }
}

// 测试中每个测试方法前后重置
@BeforeEach
void setUp() {
    ConfigManager.resetForTesting();
}
```

## 5. 速记卡片

| 类别 | 模式/原则 | 核心思想 | 记忆口诀 | 应用场景 |
|------|----------|----------|----------|----------|
| **创建型** | 单例模式 | 一个类只有一个实例 | "独一无二" | 配置管理、线程池 |
|  | 工厂方法 | 子类决定创建对象 | "子类决定" | 对象创建复杂、需要扩展 |
|  | 抽象工厂 | 创建产品族 | "一族产品" | 跨平台UI、数据库访问 |
|  | 建造者 | 分步骤构建复杂对象 | "分步构建" | 复杂对象创建 |
|  | 原型 | 克隆已有对象 | "克隆复制" | 创建成本高的对象 |
| **结构型** | 适配器 | 转换接口 | "转换接口" | 兼容旧系统 |
|  | 装饰器 | 动态添加功能 | "动态增强" | Java I/O流 |
|  | 代理 | 控制对象访问 | "控制访问" | AOP、远程代理 |
|  | 外观 | 简化子系统接口 | "简化接口" | 复杂系统封装 |
|  | 组合 | 部分-整体层次结构 | "树形结构" | 文件系统、UI组件 |
| **行为型** | 观察者 | 一对多依赖通知 | "发布订阅" | 事件驱动系统 |
|  | 策略 | 算法族封装互换 | "算法互换" | 支付方式、排序算法 |
|  | 模板方法 | 定义算法骨架 | "算法骨架" | 框架设计 |
|  | 责任链 | 请求传递链 | "传递处理" | 过滤器链、审批流程 |
|  | 状态 | 对象状态改变行为 | "状态驱动" | 订单状态机 |
| **原则** | SRP | 单一职责 | "一事一责" | 类设计 |
|  | OCP | 开闭原则 | "开扩展闭修改" | 系统扩展 |
|  | LSP | 里氏替换 | "子可替父" | 继承设计 |
|  | ISP | 接口隔离 | "专接口" | 接口设计 |
|  | DIP | 依赖倒置 | "依赖抽象" | 模块解耦 |
| **架构** | MVC | 模型-视图-控制器 | "分离关注点" | Web应用 |
|  | MVP | 模型-视图-展示器 | "视图被动" | Android应用 |
|  | MVVM | 模型-视图-视图模型 | "双向绑定" | 现代前端 |

---

**考前最后提醒**：
1. **设计模式不是银弹**：不要为了用模式而用模式，优先保持简单
2. **理解原理而非死记**：掌握每个模式的意图和适用场景
3. **结合实际框架**：理解Spring、MyBatis等框架中的设计模式应用
4. **重视设计原则**：SOLID原则比具体模式更重要
5. **准备设计案例**：准备一个你如何应用设计模式解决实际问题的案例

**学习路径建议**：
1. **第一阶段**：理解SOLID原则和23种设计模式的基本概念
2. **第二阶段**：阅读《Head First设计模式》《设计模式：可复用面向对象软件的基础》
3. **第三阶段**：分析开源框架源码中的设计模式应用
4. **第四阶段**：在实际项目中应用和重构，积累经验

**面试答题框架**：
1. **识别问题**：分析题目中的设计痛点
2. **选择模式**：解释为什么选择某种模式
3. **设计实现**：给出UML类图或代码结构
4. **评估权衡**：讨论方案的优缺点和替代方案

掌握设计模式与软件工程知识，不仅能写出更好的代码，更能提升系统设计能力，为成长为架构师奠定基础。

