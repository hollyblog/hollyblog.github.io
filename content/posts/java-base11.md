---
title: "Java 高级主题"
date: 2021-01-10T21:22:05+08:00
draft: false
description: "Java 高级主题：多线程编程、Lambda表达式、网络编程、日志和调试、单元测试、设计模式、Java8新特性、Java17新特性、Java21新特性。"
tags: ["Java", "Java高级主题"]
categories: ["Java"]
---
Java 高级主题：多线程编程、Lambda表达式、网络编程、日志和调试、单元测试、设计模式、Java8新特性、Java17新特性、Java21新特性。

## 多线程编程
### 线程创建方式
- 继承Thread类，任务与线程耦合度高
- 实现Runnable接口，任务与线程解耦，支持多个线程执行同一任务。
- 实现Callable接口，支持返回值，可以抛出异常，配合Future使用，适合需要结果的任务。
- 使用线程池
> - Future接口：表示异步计算的结果，提供了检查计算是否完成、等待计算完成并获取结果的方法。
> - FutureTask类：实现了Future接口，用于执行Callable任务，支持取消任务、查询任务是否完成、获取任务执行结果等操作。
> - CompletableFuture类：提供了异步编程的能力，支持组合多个异步任务，处理任务完成后的回调，以及异常处理，支持链式调用、组合操作、异常处理等功能，提供了丰富的异步编程api。

### 同步机制
在多线程环境下，同步机制是确保数据一致性和避免竞态条件的关键。
| 同步机制 | 特点 | 适用场景 | 性能影响|
| -------- | ---- | -------- | ------- |
| 锁 | 简单易用，适用于简单场景 | 对共享资源进行互斥访问 | 高 |
| synchronized关键字 | 内置锁，可重入，自动加锁和解锁，适用于简单场景 | 简单的同步需求 | 中等 |
| volatile关键字 | 确保变量的可见性，禁止指令重排序 | 简单状态标记，对共享变量的简单读写操作 | 低 |
| ReentrantLock类 | 显式锁，功能丰富，可重入锁，支持公平锁和非公平锁，适用于复杂场景 | 对共享资源进行互斥访问，需要更高级的同步控制，复杂的锁控制 | 中等 |
| ReadWriteLock接口 | 读写分离锁，允许多个线程同时读取共享资源，但是只允许一个线程写入共享资源 | 读多写少场景，对共享资源进行读写操作，读操作可以并发执行，写操作互斥执行 | 低（读操作） |
| Atomic类 | 提供原子操作，避免竞态条件，无锁 | 简单的原子更新，对共享变量的简单读写操作，需要原子性操作 | 很低 |
| 信号量 | 控制同时访问资源的线程数量 | 对共享资源进行限流 | 中 |
| 条件变量 | 线程等待某个条件满足后再继续执行 | 线程之间协调工作 | 低 |
### 线程池详解
线程池是一种管理和复用线程的机制，它可以避免线程创建和销毁的开销，提高系统的性能和响应速度。
线程池的主要组成部分包括：
- 线程池管理器：负责创建、销毁线程池，以及管理线程池中的线程。
- 工作线程：线程池中的线程，用于执行任务。
- 任务队列：用于存储待执行的任务，当工作队列为空时，工作线程会等待新任务的到达。
- 任务接口：定义了任务的执行方法，所有任务都必须实现这个接口。
- 线程工厂：用于创建新的线程，线程池可以使用不同的线程工厂来创建线程，例如使用默认线程工厂或自定义线程工厂。
- 拒绝策略：当任务队列已满且无法接受新任务时，线程池会调用拒绝策略来处理这个问题，例如抛出异常、拒绝新任务或调用其他策略。

核心参数
- 核心线程数（corePoolSize）：线程池中的最小线程数量，即使这些线程是空闲的，也会保留在线程池中的线程数量。
- 最大线程数（maximumPoolSize）：线程池中的最大线程数量，当任务队列已满且无法接受新任务时，线程池会创建新的线程，直到线程数量达到最大线程数。
- 线程keepAliveTime（线程保持活动时间）：当线程池中的线程数量大于核心线程数时，多余的线程会在保持活动时间内等待新任务的到达。如果超过了保持活动时间，多余的线程会被销毁。
- 任务队列（workQueue）：用于存储待执行的任务，当工作队列为空时，工作线程会等待新任务的到达。
- 线程工厂（threadFactory）：用于创建新的线程，线程池可以使用不同的线程工厂来创建线程，例如使用默认线程工厂或自定义线程工厂。
- 拒绝策略（rejectedExecutionHandler）：当任务队列已满且无法接受新任务时，线程池会调用拒绝策略来处理这个问题，例如抛出异常、拒绝新任务或调用其他策略。

线程池的工作原理如下：
1. 当任务到达时，线程池管理器会判断线程池是否已满。
2. 如果线程池未满，线程池管理器会创建一个新的工作线程来执行任务。
3. 如果线程池已满，任务会被加入任务队列中等待执行。
4. 当工作队列为空时，工作线程会等待新任务的到达。
5. 当工作线程空闲时，会从任务队列中取出任务来执行。
6. 如果线程池中的线程数量超过了核心线程数，多余的线程会在保持活动时间内等待新任务的到达。如果超过了保持活动时间，多余的线程会被销毁。
7. 当线程池中的线程数量等于核心线程数时，新任务会被加入任务队列中等待执行。
8. 如果任务队列已满，线程池会调用拒绝策略来处理这个问题。
> 线程池的状态：线程池有以下几种状态：运行状态、关闭状态、终止状态、等待状态。
```java
public enum ThreadPoolState {
    RUNNING, // 运行状态
    SHUTDOWN, // 关闭状态
    TERMINATED, // 终止状态
    WAITING, // 等待状态
    BLOCKED // 阻塞状态
}
//ThreadPoolExecutor类
public class ThreadPoolExecutor extends AbstractExecutorService {
    // 核心线程数
    private final int corePoolSize;
    // 最大线程数
    private final int maximumPoolSize;
    // 线程保持活动时间
    private final long keepAliveTime;
    // 任务队列
    private final BlockingQueue<Runnable> workQueue;
    // 线程工厂
    private final ThreadFactory threadFactory;
    // 拒绝策略
    private final RejectedExecutionHandler rejectedExecutionHandler;
}
//创建自定义线程池
// 自定义线程池
ThreadPoolExecutor threadPoolExecutor = new ThreadPoolExecutor(
        corePoolSize, // 核心线程数
        maximumPoolSize, // 最大线程数
        keepAliveTime, // 线程保持活动时间
        TimeUnit.SECONDS, // 时间单位
        workQueue, // 任务队列
        threadFactory, // 线程工厂
        rejectedExecutionHandler // 拒绝策略
);
// 提交任务
threadPoolExecutor.submit(() -> {
    // 任务逻辑
    System.out.println("任务逻辑");
});
// 关闭线程池
threadPoolExecutor.shutdown();
```
### 性能问题
- 线程数量过多导致上下文切换开销
- 锁竞争激烈影响并发性能
- 内存可见性问题导致的性能损失
- 不合理的任务分配策略
- 资源泄漏和死锁问题
### 优化策略
- 合理设置线程数：cpu密集型任务使用cpu核心数，io密集型可以适当增加线程数
- 减少锁竞争：使用读写锁、分段锁等技术
- 选择合适的数据结构：使用ConcurrentHashMap等并发容器；
- 避免伪共享：合理设计数据结构布局
- 监控和调优：使用jvm工具监控线程状态。



## Lambda表达式
Lambda表达式是Java8引入的一种函数式编程的语法，用于简化匿名内部类的使用。它允许我们将行为作为参数传递，从而实现更灵活的编程。

Lambda表达式的基本语法如下：
```java
(parameters) -> expression
```
或者
```java
(parameters) -> { statements; }
// 示例：使用Lambda表达式实现Runnable接口
Runnable runnable = () -> System.out.println("Lambda表达式实现Runnable接口");
// 示例：使用Lambda表达式实现Comparator接口
Comparator<Integer> comparator = (a, b) -> a.compareTo(b);
```
其中，parameters是参数列表，expression是一个表达式，statements是一个语句块。Lambda表达式可以用于函数式接口的实现，例如Runnable、Callable、Comparator等。

替代匿名内部类
```java
//传统匿名内部类
Runnable oldWay = new Runnable() {
    @Override
    public void run() {
        System.out.println("传统匿名内部类实现Runnable接口");
    }
};
// 使用Lambda表达式实现Runnable接口
Runnable newWay = () -> System.out.println("Lambda表达式实现Runnable接口");
```
Lambda表达式的优势在于代码更加简洁，同时也提高了代码的可读性和维护性。

函数式接口是指只包含一个抽象方法的接口，例如Runnable、Callable、Comparator等。Lambda表达式可以直接实现函数式接口，而不需要显式地定义一个匿名内部类。

示例：使用Lambda表达式实现Comparator接口
```java
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}
// 示例：使用Lambda表达式实现Calculator接口
Calculator add = (a, b) -> a + b;
Calculator subtract = (a, b) -> a - b;
int result1 = add.calculate(5, 3); // 8
int result2 = subtract.calculate(5, 3); // 2
```

### 常用函数式接口
| 接口名称 | 方法签名 | 用途 | 示例 |
| -------- | -------- | -------- | -------- |
| Runnable | void run() | 表示一个无参数、无返回值的操作 | () -> System.out.println("Lambda表达式实现Runnable接口") |
| Callable | V call() throws Exception | 表示一个有参数、有返回值的操作 | (a, b) -> a + b |
| Comparator | int compare(T o1, T o2) | 表示一个用于比较两个对象的函数 | (a, b) -> a.compareTo(b) |
| Predicate | boolean test(T t) | 表示一个用于测试一个对象是否满足某种条件的函数 | (a) -> a > 0 |
| Function | R apply(T t) | 表示一个用于将一个对象转换为另一个对象的函数 | (a) -> a.toString() |
| Supplier | T get() | 表示一个用于提供一个对象的函数 | () -> new Random().nextInt() |
| Consumer | void accept(T t) | 表示一个用于消费一个对象的函数 | (a) -> System.out.println(a) |
| UnaryOperator | T apply(T t) | 表示一个用于对一个对象进行操作并返回相同类型对象的函数 | (a) -> a * 2 |
| BinaryOperator | T apply(T t1, T t2) | 表示一个用于对两个对象进行操作并返回相同类型对象的函数 | (a, b) -> a + b |

### 方法引用
方法引用是Java8引入的一种新的语法，用于简化Lambda表达式的使用。它允许我们直接引用一个已存在的方法，而不需要显式地定义一个Lambda表达式。

方法引用的基本语法如下：
```java
ClassName::methodName
```
或者
```java
object::methodName
```
其中，ClassName是类名，object是一个对象实例，methodName是方法名。

示例：使用方法引用实现Comparator接口
```java
// 示例：使用方法引用实现Comparator接口
Comparator<Integer> comparator = Integer::compareTo;
```
方法引用的优势在于代码更加简洁，同时也提高了代码的可读性和维护性。
```java
//方法引用示例
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
//Lambda表达式示例
names.forEach(name -> System.out.println(name));
//方法引用示例
names.forEach(System.out::println);
//静态方法引用
List<Integer> numbers = Arrays.asList("1", "2", "3", "4", "5")
    .stream()
    .map(Integer::parseInt)//定价于s -> Integer.parseInt(s)
    .collect(Collectors.toList());
//构造器引用
Supplier<List<String>> listSupplier = ArrayList::new;
List<String> newList = listSupplier.get();
```
### Stream API应用
Stream API是Java8引入的一种新的函数式编程的API，用于对集合进行操作。它允许我们以一种声明式的方式来处理集合数据，而不需要显式地编写循环和条件语句。
```java
// 示例：使用Stream API对集合进行操作
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
int sum = numbers.stream()
    .filter(n -> n % 2 == 0) // 过滤出偶数
    .mapToInt(Integer::intValue) // 将整数转换为int类型
    .sum(); // 对偶数进行求和
System.out.println(sum); // 6
// 示例：使用Stream API对集合进行操作
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
names.stream()
    .filter(name -> name.startsWith("A")) // 过滤出以"A"开头的姓名
    .forEach(System.out::println); // 打印符合条件的姓名
//分组统计
// 示例：使用Stream API对集合进行分组统计
Map<Boolean, List<Integer>> evenOddMap = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0)); // 按偶数和奇数分组
System.out.println(evenOddMap); // {false=[1, 3, 5], true=[2, 4]}
```

## 网络编程
网络编程是指编写能够在网络上进行数据通信的数据。网络编程的核心是Socket(套接字)，它是网络通信的端点。

- Socket基本概念：网络通信的基础，包含ip地址和端口号，支持tcp和udp协议，提供双向数据传输。
- 客户端/服务器模型：服务器被动等待连接，客户端主动发起连接，支持多客户端连接，可以双向通信。

### TCP Socket编程
TCP（传输控制协议） Socket编程是指使用TCP协议进行网络通信的编程。TCP协议是一种可靠的、面向连接的协议，它确保数据在传输过程中不会丢失或损坏。
- TCP Socket编程流程：服务器创建Socket对象，绑定端口号，监听连接请求；客户端创建Socket对象，连接服务器；双方通过输入输出流进行数据通信；通信结束后关闭Socket连接。

示例：使用TCP Socket编程实现简单的客户端/服务器通信   
```java
// 服务器端代码
ServerSocket serverSocket = new ServerSocket(8888);
Socket socket = serverSocket.accept();
InputStream inputStream = socket.getInputStream();
OutputStream outputStream = socket.getOutputStream();
// 客户端代码
Socket socket = new Socket("localhost", 8888);
InputStream inputStream = socket.getInputStream();
OutputStream outputStream = socket.getOutputStream();
```
### UDP Socket编程
UDP（用户数据报协议） Socket编程是指使用UDP协议进行网络通信的编程。UDP协议是一种不可靠的、无连接的协议，它不确保数据在传输过程中不会丢失或损坏。
- UDP Socket编程流程：服务器创建DatagramSocket对象，绑定端口号；客户端创建DatagramSocket对象；双方通过DatagramPacket对象进行数据通信；通信结束后关闭DatagramSocket连接。
示例：使用UDP Socket编程实现简单的客户端/服务器通信
```java
// 服务器端代码
DatagramSocket serverSocket = new DatagramSocket(8888);
byte[] buffer = new byte[1024];
DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
serverSocket.receive(packet);
String message = new String(packet.getData(), 0, packet.getLength());
System.out.println("服务器端收到消息：" + message);
// 客户端代码
DatagramSocket clientSocket = new DatagramSocket();
byte[] buffer = "Hello, Server!".getBytes();
DatagramPacket packet = new DatagramPacket(buffer, buffer.length, InetAddress.getByName("localhost"), 8888);
clientSocket.send(packet);
```
### TCP和UDP对比
- TCP协议：可靠、面向连接、确保数据传输不丢失或损坏。保证数据顺序，头部开销20字节，适用于文件传输、网页浏览、邮件。
- UDP协议：不可靠、无连接、不确保数据传输不丢失或损坏。不保证数据顺序，头部开销8字节，适用于实时通信、视频会议、在线游戏等场景。

### 高级网络编程技术
使用线程池创建多线程服务器
```java
// 服务器端代码
public class ThreadPoolServer{
    private static final int THREAD_POOL_SIZE = 10;
    private static final int PORT = 8888;
    public static void main(String[] args){
        // 创建线程池
        ExecutorService executorService = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        try{
            ServerSocket serverSocket = new ServerSocket(PORT);
            while(true){
                Socket socket = serverSocket.accept();
                // 每个客户端连接都创建一个新线程处理，将客户端处理任务提交给线程池
                executorService.submit(new ClientTask(socket));
            }
        }catch(IOException e){
            e.printStackTrace();
        }finally{
            // 关闭线程池
            executorService.shutdown();
        }
    }
}
class ClientTask implements Runnable{
    private  Socket clientSocket;
    public ClientTask(Socket socket){
        this.clientSocket = socket;
    }
    @Override
    public void run(){
        try(InputStream inputStream = socket.getInputStream();
            OutputStream outputStream = socket.getOutputStream()){
            // 处理客户端请求
        }catch(IOException e){
            e.printStackTrace();
        }
    }
}
```
### 练习建议
- 结合tcp socket和多线程技术，实现一个简单的聊天室应用，支持多用户同时在线聊天。
- 结合udp socket技术，实现一个简单的文件传输应用，支持客户端上传文件到服务器。
- 使用NIO(非阻塞IO)技术，可以进一步提高网络应用的性能和并发处理能力。


## 日志和调试
- 日志框架：如log4j、slf4j、logback等，用于记录应用程序运行时的日志信息，帮助开发人员定位和解决问题。
- 调试工具：如Eclipse、IntelliJ IDEA等，提供断点调试、变量查看、线程分析等功能，帮助开发人员快速定位和修复问题。
  
### java.util.logging(JUL)
- jdk内置，无需额外依赖
- 配置简单，适合小型项目
- 性能较好，资源占用少
- 支持多种日志级别 ：如SEVERE、WARNING、INFO、CONFIG、FINE、FINER、FINEST等，开发人员可以根据需要选择不同的日志级别记录日志信息。
```java
Logger logger = Logger.getLogger(MyClass.class.getName());
logger.warning("这是一条WARNING日志");
logger.info("这是一条INFO日志");
```


### Log4j2
- 功能强大，配置灵活，支持多种日志输出目标（如控制台、文件、数据库等）
- 性能优秀，能够处理大规模日志记录场景
- 提供丰富的日志过滤和格式化功能，开发人员可以根据需要自定义日志输出格式
- 支持日志滚动和归档，避免日志文件过大导致性能问题
- 支持异步日志记录，提高应用程序性能
- 提供插件机制，开发人员可以根据需要扩展Log4j2的功能
- 配置简单，开发人员可以通过XML或JSON配置文件进行配置
- 支持日志上下文传递，开发人员可以在日志中添加自定义的上下文信息，方便问题定位和分析
```java
// 引入Log4j2依赖
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.14.1</version>
</dependency>
// 配置Log4j2
<configuration>
    <appenders>
        <console name="console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </console>
    </appenders>
    <loggers>
        <root level="info">
            <appender-ref ref="console"/>
        </root>
    </loggers>
</configuration>
// 在代码中使用Log4j2
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
public class MyClass{
    private static final Logger logger = LogManager.getLogger(MyClass.class);
    public void doSomething(){
        logger.info("这是一条INFO日志");
    }
}
```

### SLF4J + Logback
- 功能强大，配置灵活，支持多种日志输出目标（如控制台、文件、数据库等）
- 性能优秀，能够处理大规模日志记录场景
- 提供丰富的日志过滤和格式化功能，开发人员可以根据需要自定义日志输出格式
- 支持日志滚动和归档，避免日志文件过大导致性能问题
- 支持异步日志记录，提高应用程序性能
- 提供插件机制，开发人员可以根据需要扩展Logback的功能
- 配置简单，开发人员可以通过XML或Groovy配置文件进行配置，与springboot完美集成，社区活跃。
- 支持日志上下文传递，开发人员可以在日志中添加自定义的上下文信息，方便问题定位和分析
```java
// 引入SLF4J和Logback依赖
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.32</version>
</dependency>
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.2.6</version>
</dependency>
// 配置Logback
<configuration>
    <appenders>
        <console name="console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </console>
    </appenders>
    <loggers>
        <root level="info">
            <appender-ref ref="console"/>
        </root>
    </loggers>
</configuration>
// 在代码中使用SLF4J + Logback
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class MyClass{
    private static final Logger logger = LoggerFactory.getLogger(MyClass.class);
    public void doSomething(){
        logger.info("这是一条INFO日志");
    }
}
```
### 日志级别和配置
| 级别 | 说明 | 使用场景 | 示例 |
| --- | --- | --- | --- |
|TRACE| 跟踪信息，用于记录应用程序的详细运行信息 | 应用程序需要记录详细运行信息时(诊断问题时的详细跟踪) | logger.trace("这是一条TRACE日志"); |
| DEBUG | 调试信息，用于记录应用程序的调试信息 | 应用程序需要记录调试信息时（开发和测试阶段） | logger.debug("这是一条DEBUG日志"); |
| INFO | 一般信息，用于记录应用程序运行时的重要事件 | 应用程序正常运行时记录关键事件 | logger.info("这是一条INFO日志"); |
| WARNING | 警告信息，可能会影响应用程序正常运行 | 应用程序遇到非严重问题 | logger.warning("这是一条WARNING日志"); |
| ERROR | 错误信息，影响应用程序正常运行 | 应用程序遇到无法处理的异常情况 | logger.error("这是一条ERROR日志"); |
| FATAL | 致命错误，影响应用程序正常运行 | 应用程序遇到无法处理的异常情况 | logger.fatal("这是一条FATAL日志"); |
### 调试技巧
- 断点调试：在关键位置设置断点，逐步执行代码
- 条件断点：在断点上设置条件，只有满足条件时才会触发断点，方便定位问题
- 日志调试：在代码中添加日志语句，记录变量值、方法调用等信息，帮助定位问题
- 监视表达式：在调试过程中，监视表达式可以实时显示变量的值，帮助开发人员定位问题
- 调用栈分析：在调试过程中，调用栈分析可以帮助开发人员定位问题所在的方法调用链，方便问题定位和解决。
- 异常断点：在调试过程中，设置异常断点可以在应用程序抛出异常时自动触发断点，方便定位问题。
- 远程调试：在应用程序运行在远程服务器上时，开发人员可以使用远程调试功能连接到服务器进行调试，方便问题定位和解决。
### 日志框架选择
- Log4j2：功能强大，配置灵活，支持多种日志输出目标（如控制台、文件、数据库等），性能优秀，能够处理大规模日志记录场景。
- SLF4J + Logback：功能强大，配置灵活，支持多种日志输出目标（如控制台、文件、数据库等），性能优秀，能够处理大规模日志记录场景。
- 其他日志框架：如Log4j、Logback等，也提供了丰富的功能和配置选项，开发人员可以根据需要选择合适的日志框架。
### 实践指南
```java
//使用参数化日志，避免字符串拼接
// 错误示例
logger.info("用户" + userId + "登录失败");
// 正确示例
logger.info("用户{}登录失败", userId);

//记录异常的完整信息
// 错误示例
logger.error("发生异常", e);
// 正确示例
logger.error("处理请求失败：{}", e.getMessage(), e);

//使用合适的日志级别
logger.debug("计算结果：{}", result);
logger.warn("用户{}未授权", username);
```
- 使用异步日志减少对主线程的影响
- 设置合理的日志级别，避免不必要的日志输出
- 使用参数化日志，避免字符串拼接的性能开销
- 定期清理和归档日志文件
- 在生产环境中关闭DEBUG级别日志
- 生产环境推荐info级别的日志
- java中常用的日志门面是slf4j。
### 日志输出目标
- 控制台：将日志输出到命令行窗口，方便开发人员查看和调试。ConsoleAppender
- 文件：将日志输出到文件中，方便长期存储和分析。FileAppender
- 数据库：将日志输出到数据库中，方便集中管理和查询。DatabaseAppender
- 远程服务器：将日志输出到远程服务器上，方便分布式系统的日志管理。SocketAppender
- 日志分析工具：将日志输出到日志分析工具中，如ELK Stack、Graylog等，方便日志的可视化分析和监控。


## 单元测试
Junit 5 是java生态系统中最流行的单元测试框架，提高了丰富的注解、断言方法和扩展机制。由三个子项目组成：
- Junit Platform：提供了测试运行器、测试引擎和测试发现机制，用于执行和发现测试用例。
- Junit Jupiter：提供了JUnit 5的新特性，如参数化测试、重复测试、条件测试等。
- Junit Vintage：提供了对JUnit 3和JUnit 4的支持，使旧版的测试用例可以在JUnit 5中运行。
  
### 测试注解
| 注解 | 说明 | 使用场景 | 示例 |
| --- | --- | --- | --- |
| @Test | 用于标识测试方法 | 测试用例的入口点 | @Test void testMethod() { ... } |
| @BeforeEach | 在每个测试方法执行前运行 | 初始化测试环境 | @BeforeEach void setUp() { ... } |
| @AfterEach | 在每个测试方法执行后运行 | 清理测试环境 | @AfterEach void tearDown() { ... } |
| @BeforeAll | 在所有测试方法执行前运行 | 初始化共享资源，类级别初始化 | @BeforeAll void setUpAll() { ... } |
| @AfterAll | 在所有测试方法执行后运行 | 清理共享资源，类级别清理 | @AfterAll void tearDownAll() { ... } |
| @DisplayName | 为测试方法添加自定义名称 | 方便阅读和理解测试用例 | @DisplayName("测试方法1") void testMethod1() { ... } |
| @Disabled | 禁用测试方法 | 临时禁用测试用例 | @Disabled("暂不执行") void testMethod() { ... } |
| @Timeout | 设置测试方法的超时时间 | 防止测试用例运行时间过长 | @Timeout(5) void testMethod() { ... } |
| @Tag | 为测试方法添加标签 | 方便根据标签进行筛选和执行 | @Tag("fast") void testMethod() { ... } |
| @ParameterizedTest | 用于参数化测试 | 测试方法需要不同参数组合的场景 | @ParameterizedTest @ValueSource(ints = {1, 2, 3}) void testMethod(int value) { ... } |
| @RepeatedTest | 重复执行测试方法 | 测试方法需要重复执行的场景 | @RepeatedTest(3) void testMethod() { ... } |

### 断言方法 & 参数化测试
- assertEquals：验证两个值是否相等
- assertNotEquals：验证两个值是否不相等
- assertTrue：验证条件是否为真
- assertFalse：验证条件是否为假
- assertThrows：验证是否抛出了指定类型的异常
- assertAll：组合多个断言，确保所有断言都通过
- assertNull：验证对象是否为null
- assertNotNull：验证对象是否不为null
- assertSame：验证两个对象引用是否指向同一个对象
- assertNotSame：验证两个对象引用是否不指向同一个对象
- assertArrayEquals：验证两个数组是否相等

- @ValueSource：为参数化测试提供值来源，如int、long、double、String等
- @EnumSource：为参数化测试提供枚举值来源
- @CsvSource：为参数化测试提供CSV格式的参数来源
- @MethodSource：为参数化测试提供方法引用的参数来源
```java
// 测试方法示例
/**
 * 被测试的类
 * 计算器类-测试方法示例
 * 提供加法、减法、乘法和除法等操作
 */
public class Calculator{
    /**
     * 加法运算
     */
    public int add(int a, int b) {
        return a + b;
    }
    /**
     * 减法运算
     */
    public int subtract(int a, int b) {
        return a - b;
    }
    /**
     * 乘法运算
     */
    public int multiply(int a, int b) {
        return a * b;
    }
    /**
     * 除法运算
     */
    public int divide(int a, int b) {
        return a / b;
    }
}
/**
 * 测试类-计算器类
 * 测试加法、减法、乘法和除法等操作
class CalculatorTest{
    private Calculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
        System.out.println("每个测试方法初始化");
    }
    @BeforeAll
    static void setUpClass(){
        System.out.println("类级别初始化");
    }
    @Test
    @DisplayName("测试加法")
    void testAdd() {
        int result = calculator.add(2, 3);
        assertEquals(5, result);
    }
    @Test
    @DisplayName("测试减法")
    void testSubtract() {
        assertEquals(2, calculator.subtract(5, 3));
        assertNotEquals(3, calculator.subtract(5, 3));
        // 测试减法的边界情况
        assertEquals(-2, calculator.subtract(3, 5));
    }
    @Test
    @DisplayName("测试乘法")
    void testMultiply() {
        assertEquals(12, calculator.multiply(4, 3));
    }
    @Test
    @DisplayName("测试除法")
    void testDivide() {
        assertEquals(2, calculator.divide(6, 3));
        assertNotEquals(3, calculator.divide(6, 3));
        // 测试除法的边界情况
        assertEquals(-2, calculator.divide(3, -6));
    }
    @Test
    @DisplayName("测试除零异常")
    void testDivideByZero() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> calculator.divide(6, 0));
        assertEquals("除数不能为零", exception.getMessage());
    }
    @Test
    @DisplayName("参数化测试加法")
    @CsvSource({
        "1, 2, 3",
        "4, 5, 9",
        "7, 8, 15"
    })
    void testAddParameterized(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }
    @RepeatedTest(3)
    @DisplayName("重复测试加法")
    void testAddRepeated() {
        int result = calculator.add(2, 3);
        assertEquals(5, result);
    }
    @Test
    @Timeout(1)
    @DisplayName("测试超时")
    void testTimeout() {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    @Nested
    @DisplayName("嵌套测试-减法")
    class SubtractTest{
        @Test
        @DisplayName("组合断言测试")
        void testSubtract() {
            assertAll(
                () -> assertEquals(2, calculator.subtract(5, 3)),
                () -> assertNotEquals(3, calculator.subtract(5, 3)),
                () -> assertEquals(-2, calculator.subtract(3, 5))
            );
        }
    }
}
```



### 测试实践
- 测试方法命名清晰描述性
- 遵循AAA(Arrange-Act-Assert)模式
- 测试边界条件和异常情况
- 使用@DisplayName为测试方法添加自定义名称
- 每个测试只验证一个功能点
- 每个测试方法独立运行，不依赖其他测试方法
- 测试方法应该是幂等的，即多次执行结果相同
- 测试方法应该是快速的，避免耗时的操作
- 测试方法应该是可重复执行的，避免依赖外部环境
- 测试方法应该是可维护的，避免重复代码
- 测试方法应该是可扩展的，方便添加新的测试用例

### 常用测试类型
> - 基本功能测试：验证方法等基本功能是否正确
> - 边界值测试：测试输入参数等边界情况
> - 异常测试：验证异常情况等处理是否正确
> - 参数化测试：使用多组数据验证同一功能
> - 性能测试：验证方法等执行时间是否符合要求
- 单元测试
- 集成测试
- 端到端测试
- 性能测试
- 负载测试
- 压力测试
- 安全测试
- 兼容性测试
- 回归测试
### 测试覆盖率目标
- 代码覆盖率应该达到80%以上
- 重点关注核心业务逻辑的测试覆盖
- 确保所有公共方法都有对应的测试
- 异常分支和边界条件也要有相应的测试
- 使用JaCOCO等工具监控测试覆盖率
> - 语句覆盖率：测试是否执行了所有的语句
> - 分支覆盖率：测试是否执行了所有的分支
> - 路径覆盖率：测试是否执行了所有的可能路径
> - 函数覆盖率：测试是否执行了所有的函数
> - 类覆盖率：测试是否执行了所有的类



## 设计模式
设计模式是在软件设计中常见问题的典型解决方案。是解决特定问题的通用概念。

优势
- 提高代码质量和可维护性
- 促进代码重用和组件化设计
- 增强系统的可扩展性和灵活性
- 提供解决常见设计问题的通用解决方案
- 提供共同的设计语言，便于团队沟通
  
### 设计模式分类
- 创建型模式：处理对象创建机制，试图根据实际情况使用合适的方式创建对象。
  - 工厂模式：定义一个创建对象的接口，让子类决定实例化哪个类。
  - 单例模式：确保一个类只有一个实例，并提供一个全局访问点。
  - 原型模式：通过复制现有对象来创建新对象，而不是通过实例化类。
  - 建造者模式：将复杂对象的创建过程分解为多个简单步骤，每个步骤都有一个具体的类负责实现。
  - 抽象工厂模式：提供一个接口，用于创建相关或依赖对象的家族，而无需指定具体类。
- 结构型模式：处理对象和类的组合，通过继承和组合来组成更大的结构。
  - 适配器模式：将一个类的接口转换为客户端期望的另一个接口，使不兼容的类能够合作无间。
  - 装饰器模式：动态地给一个对象添加一些额外的职责，而不改变其结构。
  - 外观模式：提供一个统一的接口，隐藏系统的复杂性，使客户端能够更简单地使用系统。
  - 代理模式：为其他对象提供一个代理，以控制对这个对象的访问。
  - 组合模式：将对象组合成树形结构，以表示“部分-整体”的层次结构。组合模式使得用户对单个对象和组合对象的使用具有一致性。
- 行为型模式：处理对象之间的通信和职责分配，关注对象如何交互和协作，处理算法和对象间的责任分配。
  - 观察者模式：定义对象之间的一对多依赖关系，当一个对象的状态发生改变时，所有依赖它的对象都会得到通知并自动更新。
  - 策略模式：定义了算法族，分别封装起来，让它们之间可以互相替换，此模式让算法的变化独立于使用算法的客户。
  - 命令模式：将一个请求封装为一个对象，从而使你可以用不同的请求对客户进行参数化。
  - 模板方法模式：定义一个操作中的算法的骨架，而将一些步骤延迟到子类中。模板方法使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。
  - 状态模式：允许对象在内部状态改变时改变其行为，对象看起来好像修改了其类。
### 单例模式（Singleton Pattern）
- 定义：确保一个类只有一个实例，并提供一个全局访问点。
- 优势：
  - 控制实例数量，避免资源浪费
  - 提供全局访问点，方便在不同模块之间共享数据
- 实现方式：
  - 饿汉式：在类加载时就创建实例，线程安全但可能导致资源浪费
  - 懒汉式：在第一次使用时才创建实例，线程不安全但延迟加载
  - 双重检查锁（Double-Checked Locking）：在懒汉式的基础上添加同步锁，确保线程安全
  - 静态内部类：利用类加载机制实现延迟加载，线程安全
- 应用场景：
  - 数据库连接池
  - 配置文件读取
  - 日志记录器
  - 线程池
  - 缓存
```java
// 饿汉式：在类加载时就创建实例，线程安全但可能导致资源浪费
public class Singleton {
    //在类加载时就创建实例
    private static final Singleton instance = new Singleton();
    // 私有构造方法，防止外部实例化
    private Singleton() {
    }
    // 提供全局访问点，返回唯一实例
    public static Singleton getInstance() {
        return instance;
    }
}
// 懒汉式：在第一次使用时才创建实例，使用synchronized线程安全但延迟加载
public class Singleton {
    // 延迟加载，在第一次使用时才创建实例（静态实例变量）
    private static Singleton instance;
    // 私有构造方法，防止外部实例化
    private Singleton() {
    }
    // 提供全局访问点，返回唯一实例（线程安全）
    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
// 双重检查锁（Double-Checked Locking）：在懒汉式的基础上添加同步锁，确保线程安全
public class Singleton {
    // 延迟加载，在第一次使用时才创建实例（静态实例变量）
    //使用volatile确保多线程环境下的可见性
    private static volatile Singleton instance;
    // 私有构造方法，防止外部实例化
    private Singleton() {
    }
    // 提供全局访问点，返回唯一实例（线程安全）
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }

```
### 工厂模式
- 定义：定义一个创建对象的接口，但让子类决定实例化哪个类。工厂方法使一个类的实例化延迟到其子类。
- 优势：
  - 封装了对象的创建过程，客户端无需知道具体的创建细节
  - 符合开闭原则，新增产品时无需修改已有代码
- 实现方式：
  - 简单工厂模式：将对象的创建集中在一个工厂类中，根据不同的参数返回不同的产品实例
  - 工厂方法模式：定义一个创建对象的接口，让子类决定实例化哪个类。工厂方法使一个类的实例化延迟到其子类。
  - 抽象工厂模式：提供一个接口，用于创建相关或依赖对象的家族，而无需指定具体类。
- 应用场景：
  - 数据库连接池
  - 配置文件读取
  - 日志记录器
  - 线程池
  - 缓存
```java
// 简单工厂模式：将对象的创建集中在一个工厂类中，根据不同的参数返回不同的产品实例
public interface Shape{
    //绘制形状
    void draw();
}
public class Circle implements Shape{
    @Override
    public void draw() {
        System.out.println("绘制一个圆形");
    }
}
public class ShapeFactory{
    //根据参数返回不同的产品实例
    public Shape createShape(String shapeType){
        if(shapeType == null || shapeType.isEmpty()){
            return null;
        }
        if(shapeType.equals("circle")){
            return new Circle();
        }
        return null;
    }
}
```
### 观察者模式
- 定义：定义对象之间的一对多依赖关系，让多个观察者对象同时监听某一个主题对象，使得每当一个对象改变状态，则所有依赖于它的观察者对象都会得到通知并被自动更新。
- 优势：
  - 实现了对象之间的松耦合，提高了系统的灵活性和可维护性
  - 符合开闭原则，新增观察者或主题时无需修改已有代码
- 实现方式：
  - 主题（Subject）：维护一个观察者列表，提供添加、删除和通知观察者的方法
  - 观察者（Observer）：定义一个更新接口，用于接收主题的通知
- 应用场景：
  - 事件处理系统
  - 消息队列
  - 发布-订阅系统
```java
// 观察者模式：定义对象之间的一对多依赖关系，使得每当一个对象改变状态，则所有依赖于它的对象都会得到通知并被自动更新。
// 观察者接口
public interface Observer{
    //更新方法，当主题状态改变时调用
    void update(String news);
}
//被观察者接口（主题接口）
public interface Subject{
    //添加观察者
    void addObserver(Observer observer);
    //删除观察者
    void removeObserver(Observer observer);
    //通知所有观察者
    void notifyObservers(String news);
}
// 具体观察者：实现了观察者接口，用于接收主题的通知（新闻机构--具体被观察者）
public class NewsAgency implements Subject{
    private List observers = new ArrayList<>();
    private String latestNews;
    @Override
    public void addObserver(Observer observer) {
        observers.add(observer);
        System.out.println("新闻机构添加了一个观察者：" + observer);
    }
    @Override
    public void removeObserver(Observer observer) {
        observers.remove(observer);
        System.out.println("新闻机构删除了一个观察者：" + observer);
    }
    @Override
    public void notifyObservers(String news) {
        System.out.println("新闻机构通知所有观察者" + news);
        for(Observer observer : observers){
            observer.update(news);
        }
    }
    //发布新闻
    public void publishNews(String news){
        this.latestNews = news;
        notifyObservers(news);
    }
}
```
### 策略模式
- 定义：定义一系列算法，将每个算法都封装起来，并使他们可以相互替换，且算法的变化不会影响到使用算法的客户。
- 优势：
  - 封装了算法的实现细节，符合开闭原则
  - 可以在运行时动态切换算法
- 实现方式：
  - 定义一个策略接口，包含算法的公共方法
  - 实现不同的策略类，分别封装不同的算法
  - 在上下文类中维护一个策略对象的引用，根据需要切换不同的策略
- 应用场景：
  - 排序算法
  - 支付方式
  - 压缩算法
  
```java
//支付策略接口
public interface PaymentStrategy{
    //执行支付
    void pay(double amount);
}
//信用卡支付策略
public class CreditCardPayment implements PaymentStrategy{
    private String cardNumber;
    private String cardHolder;
    public CreditCardPayment(String cardNumber, String cardHolder) {
        this.cardNumber = cardNumber;
        this.cardHolder = cardHolder;
    }
    @Override
    public void pay(double amount) {
        System.out.println("使用信用卡" + cardNumber + "支付" + amount);
    }

}
//支付上下文
public class PaymentContext {
    private PaymentStrategy paymentStrategy;
    //设置支付策略
    public void setPaymentStrategy(PaymentStrategy paymentStrategy){
        this.paymentStrategy = paymentStrategy;
    }
    //执行支付
    public void pay(double amount){
        if(paymentStrategy == null){
            throw new IllegalArgumentException("支付策略不能为空");
        }
        paymentStrategy.pay(amount);
    }
}
```
### 最佳实践
- 不要过度设计，只有在真正需要时才使用设计模式
- 理解问题本质，先理解要解决的问题，再选择合适的设计模式
- 保持简单：优先选择简单的解决方案
- 考虑维护性
- 团队共识（要考虑团队成员的理解能力和技术水平😭）



## Java8新特性
Java8是java发展史上的一个重要里程碑，引入了许多革命性的新特性，最重要的是引入了Lambda表达式、Stream API、Optional类、接口默认方法、模块系统等等。
### Lambda表达式
简化匿名函数的编写，使得代码更加简洁和可读，支持函数式编程风格，减少样板代码，编译器可以更好的优化。
```java
//传统匿名内部类方式
Comparator<String> comparator = new Comparator<String>() {
    @Override
    public int compare(String o1, String o2) {
        return o1.compareTo(o2);
    }
}
//Lambda表达式方式
Comparator<String> comparator = (o1, o2) -> o1.compareTo(o2);
//方法引用方式
Comparator<String> comparator = String::compareTo;
//单参数lambda表达式
List<String> name = Arrays.asList("a", "b", "c");
name.forEach(name -> System.out.println(name));
name.forEach(System.out::println);
```

### Stream API
Stream API 是 Java 8 引入的一个用于处理集合数据的 API，它提供了一系列的流操作（过滤、映射、归约），使得对集合数据的处理更加方便和简洁。Stream 不是数据结构，而是数据源的视图，支持函数式编程风格的操作。
- 流操作：流操作是指对流进行的一系列操作，例如过滤、映射、排序、聚合等。
- 流管道：流管道是指将多个流操作连接起来形成一个管道，每个操作都在管道中进行处理。
- 并行流：并行流是指利用多核处理器的并行能力，将流操作分布在多个线程中并行处理，提高处理效率。
```java
//流操作
List<String> words = Arrays.asList("hello", "world", "java");
List<String> result = words.stream()
    .filter(word -> word.length() > 5)//过滤长度大于5的单词
    .map(String::toUpperCase)///将单词转换为大写
    .sorted()//对单词进行排序
    .collect(Collectors.toList());//将结果收集到一个列表中
System.out.println(result);
//数值计算
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
int sum = numbers.stream()
    .filter(n -> n % 2 == 0)//筛选偶数
    .mapToInt(Integer::intValue)//将整数转换为int类型
    .sum();//对整数进行求和
System.out.println(sum);
//分组操作
Map<Integer, List<String>> groupedWords = words.stream()
    .collect(Collectors.groupingBy(String::length));//根据单词长度分组
System.out.println(groupedWords);
```
- Stream只能使用一次，使用后就会关闭
- 中间操作是有惰性的，只有遇到终端操作才会执行
- 并行流虽然强大，但不是总是更快，需要根据具体情况选择
- 避免在Stream中修改外部变量，保持函数式编程的纯净性。

### 方法引用
方法引用是 Lambda 表达式的一种简化形式，它可以直接引用已有的方法，而不需要编写 Lambda 表达式。
```java
//传统Lambda表达式方式
List<String> name = Arrays.asList("a", "b", "c");
name.forEach(name -> System.out.println(name));
//方法引用方式
name.forEach(System.out::println);
```

### Optional类
Optional类是一个用于处理空指针异常的类，它可以避免空指针异常的发生。
- 空值处理：Optional类可以包装一个可能为空的值，避免直接使用空值导致的空指针异常。
- 方法链调用：Optional类提供了一系列的方法，例如map、filter、orElse等，使得对可选值的处理更加方便和简洁。

```java
Optional<> optional1 = Optional.of("hello world");
Optional<> optional2 = Optional.ofNullable(null);
Optional<> optional3 = Optional.empty();

//检查值是否存在
if (optional1.isPresent()) {
    System.out.println("值存在:" + optional1.get());
}
optional1.ifPresent(value -> System.out.println("值存在:" + value));

//提供默认值
String result1 = optional2.orElse("默认值");
String result2 = optional3.orElseGet(() -> "默认值");

//链式操作
Optional<String> result = Optional.of("java programming")
.filter(word -> word.length() > 5)//过滤长度大于5的单词
.map(String::toUpperCase);//将单词转换为大写
.map(s -> "Language:" + s);
result.ifPresent(System.out::println);

//实际应用场景
public Optional<User> findUserById(String id){
    //模拟数据库查询
    User user = database.findById(id);
    return Optional.ofNullable(user);
}
//安全的链式调用
String email = findUserById("123")
    .map(User::getEmail)
    .filter(email -> email.contains("@"))
    .orElse("未找到有效邮箱");
```
### 函数式接口
函数式接口是指只包含一个抽象方法的接口，它可以被Lambda表达式引用。
- 定义：函数式接口是指只包含一个抽象方法的接口，它可以被Lambda表达式引用。
- 优势：函数式接口可以使代码更加简洁和可读，支持函数式编程风格，减少样板代码。
- 应用场景：函数式接口可以用于任何需要传递行为的场景，例如事件处理、回调函数等。

#### Predicate<T>
Predicate<T> 是一个函数式接口，用于对输入的对象进行判断，返回一个 boolean 值。它通常用于过滤集合中的元素。
```java
Predicate<> isEmpty = String::isEmpty;
//传统方式
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> evenNumbers = new ArrayList<>();
for (Integer number : numbers) {
    if (number % 2 == 0) {
        evenNumbers.add(number);
    }
}
//使用Predicate<T>
List<Integer> evenNumbers = numbers.stream()
    .filter(n -> n % 2 == 0)//筛选偶数
    .collect(Collectors.toList());//将结果收集到一个列表中
```
#### Function<T, R>
Function<T, R> 是一个函数式接口，用于对输入的对象进行转换，返回一个新的对象。它通常用于映射集合中的元素。
```java
Function<String, Integer> toLength = String::length;
//传统方式
List<String> words = Arrays.asList("hello", "world", "java");
List<Integer> lengths = new ArrayList<>();
for (String word : words) {
    lengths.add(word.length());
}
//使用Function<T, R>
List<Integer> lengths = words.stream()
    .map(String::length)//将单词映射为其长度
    .collect(Collectors.toList());//将结果收集到一个列表中
```
#### Consumer<T>
Consumer<T> 是一个函数式接口，用于对输入的对象进行消费操作，没有返回值。它通常用于对集合中的元素进行操作，例如打印、修改等。
```java
Consumer<String> print = System.out::println;
//传统方式
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
for (Integer number : numbers) {
    System.out.println(number);
}
//使用Consumer<T>
numbers.forEach(print);
```
#### Supplier<T>
Supplier<T> 是一个函数式接口，用于提供一个新的对象实例。它通常用于延迟初始化或创建新对象。
```java
Supplier<> random = Math::random;
//传统方式
double randomNumber = Math.random();
//使用Supplier<T>
double randomNumber = random.get();
```
### 新日期时间API
新的日期时间API提供了更好的日期和时间处理，包括LocalDate、LocalTime、LocalDateTime、Instant、Duration、Period等。
- LocalDate、LocalTime、LocalDateTime：用于处理日期和时间，提供了丰富的方法进行操作。
- Instant：用于表示时间戳，提供了与日期时间的转换方法。
- Duration：用于表示时间间隔，提供了对时间的加减操作。
- Period：用于表示日期间隔，提供了对日期的加减操作。
```java
LocalDate date = LocalDate.now();
LocalTime time = LocalTime.now();
LocalDateTime dateTime = LocalDateTime.now();
Instant instant = Instant.now();
Duration duration = Duration.ofHours(1);
Period period = Period.ofDays(1);
```
### 注意事项
- 优先使用方法引用：当Lambda表达式只是调用一个方法时，优先使用方法引用，使代码更加简洁和易读。
- 合理使用stream API：使用stream API可以提高代码的效率和可读性，避免了手动编写foreach循环。
- 避免副作用：在Stream中避免修改外部状态
- 谨慎使用并行流：并行流不总是更快，需要根据数据量和操作复杂度选择
- 在可能返回null的方法中使用Optional类来处理空指针异常。

## Java17新特性
java17是继java11之后的第二个长期支持（lts）版本，于2021年9月21日发布。
1.  记录类（Records）：简洁的不可变数据载体，自动生成构造器和访问器，内置equals、hashCode、toString方法，减少样板代码。
2.  密封类：限制类的继承层次结构，提供更好的api设计控制，增强模式匹配支持，编译时类型安全保证。
3.  模式匹配：instanceof的模式匹配，switch表达式增强，减少类型转换代码，提高代码可读性。
4.  文本块：多行字符串字面量，保持原始格式，减少转义字符，提高代码可读性。
### 密封类
密封类是java17引入的一个新特性，用于限制类的继承层次结构。它可以用于限制哪些类可以继承自某个类，从而提高代码的安全性和可维护性。
- 类型安全：编译明确只有指定的类可以继承
- 模式匹配：instanceof的模式匹配，switch表达式增强，减少类型转换代码，提高代码可读性。
- api设计：更好地控制类的继承层次
- 文档化：明确报答设计意图。
```java
sealed class Shape permits Circle, Rectangle {
    abstract double area();
}
final class Circle extends Shape {
    @Override
    double area() {
        return Math.PI * radius * radius;
    }
}
final class Rectangle extends Shape {
    @Override
    double area() {
        return length * width;
    }
}
```
### 记录类
记录类是java14引入并在java17中稳定的特性，用于创建不可变数据载体。自动生成构造器、访问器方法以及equals、hashCode、toString方法，减少样板代码。
```java
public record Person(String name, int age,String email){
    //紧凑构造器，用于验证和规范化
    public Person{
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(email, "email must not be null");
        if(age < 0 || age > 120){
            throw new IllegalArgumentException("age must be between 0 and 120");
        }
        if(!email.contains("@")){
            throw new IllegalArgumentException("email must contain @");
        }
    }
    //自定义方法
    public boolean isAdult(){
        return age >= 18;
    }
    public String getDisplayName(){
        return isAdult() ? name + "成年": name + "未成年";
    }
    //静态工厂方法
    public static Person create(String name, int age, String email){
        return new Person(name, age, email);
    }
}
//嵌套记录类
record Address(String street, String city, String state, String zipCode){
    public String getFullAddress(){
        return street + ", " + city + ", " + state + " " + zipCode;
    }
}
//使用
class RecordDemo {
    public static void main(String[] args) {
        Person person = Person.create("张三", 18, "zhangsan@gmail.com");
        System.out.println(person.name);
        System.out.println(person.age);
        System.out.println(person.email);
        System.out.println(person.getDisplayName());
        System.out.println(person.isAdult());
        Address address = Address.create("123 Main St", "Anytown", "CA", "12345");
        System.out.println(address.getFullAddress());
    }
}
```
### 模式匹配
模式匹配主要体现在instanceof操作符和switch表达式中。
- instanceof：用于判断对象是否属于某个类，或者实现某个接口。
- switch：用于匹配多个条件，并执行对应的代码块。
```java
public class PatternMatchingDemo {
    public static void processObject(Object obj){
        if(obj instanceof Person person){
            System.out.println("处理Person对象：" + person);
        } else if(obj instanceof Address address){
            System.out.println("处理Address对象：" + address);
        } else if(obj instanceof String str){
            System.out.println("处理字符串对象：" + str);
        }else if(obj instanceof Number number){
            System.out.println("处理数字对象：" + number);
        }else {
            System.out.println("未知对象类型");
        }
    }
}
//switch表达式
public class SwitchDemo {
    public static void processObject(Object obj){
        switch(obj){
            case null -> System.out.println("处理null对象");
            case Integer i -> System.out.println("处理整数对象：" + i);
            case Person person -> System.out.println("处理Person对象：" + person);
            case Address address -> System.out.println("处理Address对象：" + address);
            case String str -> System.out.println("处理字符串对象：" + str);
            case Number number -> System.out.println("处理数字对象：" + number);
            default -> System.out.println("未知对象类型");
        }
    }
}
```
### 文本块
文本块是java15引入的一个新特性，用于表示多行字符串字面量。它可以保持原始格式，减少转义字符，提高代码可读性。三个双引号"""包裹的字符串就是一个文本块。减少转义字符，降低维护成本，支持字符串格式化与插值，特别适合html\json\sql等多行文本。
```java
String json = """
{
    "name": "张三",
    "age": 18,
    "email": "zhangsan@gmail.com"
}
""";
System.out.println(json);
```
### 最佳实践
- 密封类：用于限制继承层次，特别适合状态机和数据模式；
- 记录类：优先用于不可变数据传输对象（DTO），减少样板代码；
- 模式匹配：在instanceof和switch表达式中使用，提高代码可读性和可维护性；
- 文本块：用于表示多行字符串字面量，减少转义字符，提高代码可读性；
- 性能考虑：新特性在提高开发效率的同时保持良好性能。
## Java21新特性
java8 2014年3月（lts）--lambda表达式、stream api、方法引用
java11 2018年9月 （lts）---http client、局部变量类型推断、字符串增强
java17 2021年9月（lts）---密封类、模式匹配、文本块、记录类
java21是oracle在2023年9月发布的长期支持（lts）新版本---虚拟线程、模式匹配增强、字符串模版、序列化集合

### 虚拟线程
轻量级线程，可以创建数百万个，简化并发编程模型，提高应用程序吞吐量，减少内存占用。由jvm管理而不是操作系统。

虚拟线程和平台线程
| 特性 | 平台线程 | 虚拟线程 |
| --- | --- | --- |
| 创建 | 需要调用Thread.ofPlatform().newThread() | 无需调用任何方法 |
| 运行 | 需要调用start()方法启动 | 无需调用任何方法 |
| 销毁 | 需要调用join()方法等待线程结束 | 无需调用任何方法 |
| 创建成本 | 高 | 低 |
| 最大数量| 数千个 | 数百万个 |
|调度方式 | 操作系统调度 | 虚拟CPU调度 即jvm调度|
| 阻塞行为 | 阻塞os线程 | 不阻塞载体线程 |
| 适用场景 | cpu密集型任务 | io密集型任务 |
```java
public class VirtualThreadExample { 
    public static void main(String[] arg)throws Exception{
        basicVirtualThread();
        virtualThreadExecutor();
    }
    private static void basicVirtualThread()throws InterruptedException{
        Thread vt = Thread.ofVirtual()
        .name("basic-vt")
        .start(() -> {
            System.out.println("I am a virtual thread");
            try{
                Thread.sleep(1000);
            }catch(InterruptedException e){
                e.printStackTrace();
            }
            System.out.println("Virtual thread completed");
        });
        vt.join();
    }
    private static void virtualThreadExecutor()throws Exceptio{
        try(var executor = Executors.newVirtualThreadPerTaskExecutor()){
            List<> futures = new ArrayList<>();
            for(int i = 0; i < 10; i++){
                futures.add(executor.submit(() -> {
                    System.out.println("I am a virtual thread");
                    try{
                        Thread.sleep(1000);
                    }catch(InterruptedException e){
                        e.printStackTrace();
                    }
                    System.out.println("Virtual thread completed");
                }));
            }
            for(var future : futures){
                future.get();
            }
        }
     }
}
```
- 避免在虚拟线程中使用synchronized关键字，推荐使用reentrantlock等可重入锁。
- 不要池化虚拟线程，它们的创建成本极低
- 虚拟线程适合io密集型任务，不适合cpu密集型任务
- 某些阻塞操作可能会固定pin虚拟线程到载体线程。
### 模式匹配增强
使得switch表达式更加强大灵活。
```java
private static void basicPatternMatching(){
    Object[] testBojects = {"123", 123, new Person("张三", 18), new Address("中国", "北京"), new StringBuilder("hello")};
    for(Object obj : testBojects){
        String result = switch(obj){
            case null -> "null对象";
            case Integer i -> "整数对象：" + i;
            case Person person -> "Person对象：" + person;
            case Address address -> "Address对象：" + address;
            case String str -> "字符串对象：" + str;
            case Number number -> "数字对象：" + number;
            default -> "未知对象类型";
        };
    }
}
```
不学啦（不适应）
### 字符串模版
字符串模版是预览特性，需要在编译时添加--enable-preview选项开启。在生产环境中使用前要慎重。

```java
String name = "张三";
int age = 18;
String address = "中国北京";
String feature = "Java21新特性";
String message = STR."\{name}是\{age}岁，来自\{address}，并使用了\{feature}";
System.out.println(message);
```
不学啦（不适应）

### 序列化集合
java21引入了序列化集合接口，为有序集合提供了统一的api，包括首尾元素的操作方法。
```java
List list = new ArrayList<>();
list.addFirst("first");
list.addLast("last");
list.add(1,"中间")；
System.out.println(list.getFirst());
System.out.println(list.getLast());
System.out.println(list.reversed());
System.out.println(list.removeFirst());
System.out.println(list.removeLast());
```
提升了开发效率，但是学习成本更高了。

主要性能改进
- 内存管理优化：改进的垃圾收集器性能；更好的内存分配策略；减少内存碎片；优化的对象布局；
- 启动时间优化：更快的类加载；改进的jit编译；优化的启动序列；减少冷启动时间；
- 运行时优化：更好的分支预测；优化的循环展开；改进的内联策略；更高效的异常处理。
- 安全性增强：更强的加密算法支持；改进的安全管理器；更好的证书验证；增强的随机数生成。
- 改进的switch表达式；改进的Math类方法；改进的StringBuilder和StringBuffer