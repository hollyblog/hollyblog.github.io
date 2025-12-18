---
title: "并发编程-高级应用"
date: 2021-01-22T16:40:00+08:00
draft: false
description: "并发编程高级应用：并发编程模式、并发性能调优、并发编程陷阱、并发编程实战。"
tags: ["JUC", "并发编程", "高级应用"]
categories: ["JUC"]
---
并发编程高级应用：并发编程模式、并发性能调优、并发编程陷阱、并发编程实战。
## 并发编程模式
### 单例模式的线程安全
线程不安全的懒汉式
```java
public class Singleton {
    private static Singleton instance;
    private Singleton(){}
    public static Singleton getInstance(){
        if(instance == null){
            instance = new Singleton();
        }
        return instance;
    }
}
线程安全的懒汉式
```java
public class Singleton {
    private static Singleton instance;
    private Singleton(){}
    //使用synchronized关键字确保线程安全
    //性能较差，每次调用都需要同步
    public static synchronized Singleton getInstance(){
        if(instance == null){
            instance = new Singleton();
        }
        return instance;
    }
}
```
双重检查锁定
```java
public class Singleton {
    //volatile关键字确保instance变量的可见性和禁止指令重排序
    private volatile static Singleton instance;
    private Singleton(){}
    public static Singleton getInstance(){
        //第一次检查，避免不必要的同步
        if(instance == null){
            synchronized (Singleton.class){
                //第二次检查，确保只创建一个线程，线程安全
                if(instance == null){
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```
俄汉式单例（单例在类加载时就创建实例，天然线程安全，但可能造成资源浪费）
```java
public class Singleton {
    //类加载时就创建实例，天然线程安全
    private static final Singleton instance = new Singleton();
    private Singleton(){}
    public static Singleton getInstance(){
        return instance;
    }
}
```
静态内部类单例（利用类加载机制保证线程安全，同时实现懒加载）
```java
public class Singleton {
    private Singleton(){}
    //静态内部类，只有在调用getInstance()方法时才会加载
    private static class SingletonHolder{
        private static final Singleton instance = new Singleton();
    }
    
    public static Singleton getInstance(){
        return SingletonHolder.instance;
    }
}
```
枚举单例（是线程安全的，能防止反射和序列化攻击）
```java
public enum Singleton {
    //枚举实例，天然线程安全
    INSTANCE;
    public void doSomething(){
        System.out.println("do something");
    }
}
//使用枚举单例
Singleton.INSTANCE.doSomething();
```
### 不可变模式
不可变对象是指一旦创建，其状态就不能被修改的对象。不可变对象的主要优势是线程安全，因为它们不依赖于外部状态的改变。
```java
public final class ImmutableClass {
    private final int value;
    //构造方法只能初始化一次，后续不能修改
    public ImmutableClass(int value){
        this.value = value;
    }
    //只能通过方法获取值，不能直接访问属性
    public int getValue(){
        return value;
    }
}
```
- 状态不可变：对象创建后状态不能改变
- 所有字段都是final的，不能被修改
- 没有setter方法，不能通过外部修改状态
- 类是final的：防止子类破坏不变形
- 使用Builder模式创建不可变对象

### 线程特有的存储模式
是指通过为每个线程提供独立的存储空间来避免共享状态，ThreadLocal是这种模式的典型实现。

- 内存泄漏：使用完毕后要调用remove方法，释放线程本地存储的资源
- 线程池环境：线程复用可能导致数据污染
- 父子线程：普通ThreadLocal不会传递给子线程
- 性能考虑：过多的ThreadLocal变量会影响性能，因为每个ThreadLocal变量都占用一定的内存空间

### Master-Worker模式
Master-Worker模式是一种并行计算模式，Master用于将一个大任务分解为多个小任务，每个小任务由一个Worker线程处理，Master最后将所有Worker线程的结果合并起来。

```java
public class MasterWorker {
    //Master线程负责分解任务并分配给Worker线程
    private final Thread masterThread;
    //Worker线程负责处理任务
    private final List<Thread> workerThreads = new ArrayList<>();
    //任务队列，用于存储待处理的任务
    private final BlockingQueue<Task> taskQueue = new LinkedBlockingQueue<>();
    //结果队列，用于存储Worker线程处理的结果
    private final BlockingQueue<TaskResult> resultQueue = new LinkedBlockingQueue<>();
    //构造方法，初始化Master线程和Worker线程
    public MasterWorker(int workerCount){
        masterThread = new Thread(this::masterRun);
        for(int i = 0; i < workerCount; i++){
            workerThreads.add(new Thread(this::workerRun));
        }
    }
    //启动Master线程和Worker线程
    public void start(){
        masterThread.start();
```
### Actor模式
Actor模式是一种并发计算模型，其中每个计算实体（Actor）都是一个独立的线程（独立的计算单元），它们之间通过消息传递进行通信，避免了共享状态的并发问题。每个Actor都有一个状态和一组行为，当收到消息时，Actor会根据其当前状态和收到的消息执行相应的行为。
- 消息传递：    
  - Actor之间通过消息传递进行通信，消息是异步的，发送方不需要等待接收方处理完成即可继续发送下一条消息。
  - 每个Actor都有一个消息队列，用于存储待处理的消息，确保消息的有序处理。
- 状态封装：
  - Actor的状态是私有的，只能通过消息传递来修改，避免了直接访问状态的并发问题。
- 并发处理：
  - Actor模型天然支持并发处理，每个Actor都是一个独立的线程，它们可以并行处理消息，避免了共享状态的并发问题。
### 模式对比和选择
- 单例模式
  - 全局唯一实例；节省内存，全局访问；可能成为性能瓶颈。
- 不可变模式
  - 值对象，配置信息；天然线程安全；创建对象开销。
- 线程特有的存储模式（ThreadLocal）：
  - 线程上下文，工具类；避免同步开销；内存泄漏风险。
- Master-Worker模式：
  - 大任务分解；充分利用多核；任务分解复杂度。
- Actor模式：
  - 高并发系统；无共享状态；消息传递开销。
  
1. 性能要求高：优先考虑不变性模式和ThreadLocal模式
2. 任务可分解： 考虑Master-Worker模式提高并行度
3. 状态管理复杂： 考虑Actor模式避免共享状态并发问题
4. 全局共享： 考虑单例模式，全局访问，节省内存
5. 组合使用：根据具体场景，组合使用以上模式，扬长避短，提高系统性能。




## 并发性能调优
### 性能测试工具
- JMH（Java Microbenchmark Harness）：Java微基准测试框架，用于测试Java代码的性能，能避免jvm优化带来的策略误差，提高准确的性能数据。
- JProfiler：商业Java性能分析工具，用于分析Java应用程序的性能问题，提供详细的性能数据和分析报告。提供cpu分析、内存分析、线程分析等功能，界面友好，功能强大。
- VisualVM：免费的Java性能分析可视化工具，集成在jdk中，支持cpu、内存分析、线程监控、MBean管理等。用于监控Java应用程序的性能和内存泄漏。
- Java Flight Recorder（JFR）：Java Flight Recorder是Java虚拟机（JVM）的一个功能，用于记录和分析应用程序的运行时行为。它可以记录应用程序的线程活动、内存分配、垃圾回收、类加载等事件，提供详细的性能数据和分析报告。
- Arthas：阿里巴巴开源的Java诊断工具，用于分析Java应用程序的运行时行为，提供线程 dump、类加载信息、方法调用栈等功能。

### JVM并发参数调优
垃圾收集器参数
- -XX:+UseParallelGC：并行垃圾收集器，适用于多核服务器，吞吐量优先。
- -XX:+UseParallelOldGC：并行年老代垃圾收集器，适用于多核服务器，吞吐量优先。
- -XX:+UseG1GC：G1垃圾收集器，适用于大堆内存和低延迟要求服务器，低停顿时间优先。
- -XX:MaxGCPauseMillis=200：设置gc最大暂停时间目标。最大垃圾收集暂停时间，单位毫秒，默认值200毫秒。
- -XX:GCTimeRatio：垃圾收集时间占总时间的比例，默认值99，即垃圾收集时间占总时间的1%。
- -XX:G1HeapRegionSize=16m：设置G1垃圾收集器的堆区域大小，默认值16MB。
- -XX:+UseStringDeduplication：开启字符串去重，适用于有大量重复字符串的场景，减少内存占用。

线程相关参数
- -Xss1m:线程栈大小设置
- -XX:+UseBiasedLocking: 开启偏向锁，默认开启，减少锁竞争时的同步开销。
- -XX:BiasedLockingStartupDelay=0: 偏向锁启动延迟，默认值4秒，设置为0表示立即开启偏向锁。
- -XX:+UseSpinning: 开启自旋锁，默认开启，在锁竞争不激烈时，减少线程阻塞的开销。
- -XX:PreBlockSpin=10: 自旋锁预阻塞次数，默认值10次，设置为0表示不预阻塞。
- -XX:+UseTLAB: 开启线程本地分配缓存（Thread Local Allocation Buffer），默认开启，每个线程有自己的缓存，减少了内存分配的开销。
- -XX:TLABSize=1m: 线程本地分配缓存大小，默认值128KB。

并发标记参数
- -XX:ConcGCThreads=4: 并发垃圾收集线程数
- -XX:ParallelGCThreads=4: 并行垃圾收集线程数
- -XX:+UseConcMarkSweepGC: 开启CMS垃圾收集器，默认关闭。
- -XX:CMSParallelRemarkEnabled: 开启CMS并行标记，默认关闭。

### 锁竞争分析
主要分析锁使用情况、竞争程度、持有时间。
锁监控工具
```java
//生成线程转储
jstack <pid> > thread_dump.txt

//查找锁竞争信息
grep -A 10 -B 5 "waiting for monitor entry" thread_dump.txt
grep -A 10 -B 5 "waiting on condition" thread_dump.txt 
```
锁优化策略
- 减少锁粒度：将大锁拆分成多个小锁，减少锁竞争的范围和时间
- 减少锁持有时间：优化临界区代码，尽快释放锁资源
- 锁分离：读写分离，使用ReadWriteLock等专用锁。

### 无锁编程技巧
- 无锁数据结构：使用原子类、CAS操作等无锁数据结构，避免锁竞争和阻塞。
- 无锁算法：使用无锁算法实现并发数据结构，如无锁队列、无锁栈等。
- 无锁线程池：使用无锁线程池实现并发任务执行，避免线程创建和销毁的开销。
> cas操作包含三个参数：内存位置（v）、预期原值（a）和新值（b）。当且仅当v的值与a相等时，才会将v的值设置为b。

### cpu缓存优化
cpu缓存的使用效率直接影响并发程序的性能。缓存行、伪共享等概念，并采用相应的优化技术，能显著提高程序性能。
- 缓存行对齐：将数据结构对齐到缓存行边界，避免缓存行失效和伪共享问题。
- 缓存预取：利用cpu缓存预取机制，提前加载数据到缓存，减少访问主内存的次数。
- 缓存局部性：优化数据访问模式，提高缓存命中率，减少缓存缺失次数。

> 伪共享危害：当多个线程修改同一缓存行中的不同变量时，会导致缓存行在cpu核心间频繁传输，严重影响性能。

```java
//存在伪共享问题的代码
public class FalseSharingExample{
    private volatile long value1;
    private volatile long value2;
    private volatile long value3;
    //多个线程同时修改这些变量会导致伪共享
}
```
内存布局优化
- 数据局部性：将相关数据放在一起，提高缓存命中率。
- 缓存行对齐：确保关键数据结构按缓存行边界对齐
- 避免伪共享：使用填充或@Contended注解，在缓存行边界添加填充字节，避免多个变量共享同一个缓存行。

### 练习
- jmh性能测试：使用jmh对不同并发集合进行性能基准测试，比较ConcurrentHashMap、Collections.synchronizedMap和HashTable的性能差异。
- 锁竞争分析：创建一个高并发场景，使用JProfiler或者VisualVM等工具分析锁竞争情况，定位性能问题。
- 无锁队列实现：实现一个无锁的环形缓冲区，并与基于锁的实现进行性能对比。
- 伪共享优化：创建一个存在伪共享问题的程序，然后使用缓存行填充技术解决问题，测量性能改进效果。
## 并发编程陷阱
### 竞态条件识别
竞态条件是并发编程中最常见的问题之一。当多个线程同时访问共享资源，且至少有一个线程在修改该资源时，就可能发生竞态条件。

竞态条件可能导致数据不一致、程序崩溃、安全漏洞，是并发编程中必须关注的问题。
- 数据竞争：多个线程同时读写同一内存位置，没有适当的同步机制保护。
- 检查后执行：在检查条件和执行操作之间，存在时间差，导致其他线程修改了条件，导致错误的执行结果。
- 复合操作：多个原子操作组合成的非原子复合操作可能被其他线程中断。

解决方案：
- 使用sunchronized：同步方法或同步块
- 使用原子类：AtomicInteger、AtomicLong等原子类，提供了线程安全的操作方法。
- 使用Lock: 显式锁机制，如ReentrantLock、ReadWriteLock等，提供了更灵活的锁控制和死锁避免机制。
- 使用volatile：对于简单的标识位。

### 死锁预防和检测
死锁是指两个或多个线程在执行过程中，由于竞争资源而互相等待，导致无法继续执行的情况。

死锁必要条件
- 互斥条件：资源不能被多个线程同时使用
- 持有并等待：线程持有资源的同时等待其他资源
- 不可剥夺：资源不能被强制从线程中剥夺
- 循环等待：存在线程资源的循环等待链。


死锁通常发生在以下场景：
- 多个线程同时请求多个资源，而每个线程都在等待其他线程释放资源。
- 资源分配策略不当，导致循环等待。

死锁预防和检测是并发编程中必须考虑的问题。
- 死锁预防：通过合理的资源分配策略，避免循环等待。
- 死锁检测：使用工具或算法检测系统是否存在死锁情况。

解决方案：
- 避免嵌套锁：避免在一个锁的临界区内请求其他锁，避免死锁循环。
- 按顺序申请锁：所有线程按照相同的顺序申请锁，避免循环等待。
- 超时机制：设置锁申请超时时间，超过时间未获得锁，释放已占有的锁。
- 死锁检测工具：使用jstack等工具检测死锁情况，及时发现并解决问题。
- 银行家算法：在分配资源前检查是否会死锁。
### 活锁和饥饿问题
活锁是指多个线程在执行过程中，由于不断地改变状态而无法继续执行，看起来像是在活动地运行，而不是等待资源。简单说：线程没有被阻塞，但由于某些条件没有满足，导致线程持续重试而无法继续执行。

饥饿是指一个线程因为其他线程优先级高而无法获得执行机会，导致线程永远无法执行。比如优先级倒置（高优先级线程被低优先级线程阻塞）、资源竞争激烈（某些线程总是抢不到资源）、调度不公平（线程调度器分配时间不均匀）。

解决方案：
- 公平锁：使用公平锁（如ReentrantLock），确保线程按照请求顺序获得锁，避免饥饿问题。
- 优先级管理：合理设置线程优先级，避免高优先级线程被低优先级线程饿死。
- 资源池：使用连接池等技术避免资源竞争
- 超时机制：设置获取资源的超时时间。

### 伪共享问题
伪共享是指多个线程修改同一缓存行中的不同变量时，会导致缓存行在cpu核心间频繁传输，严重影响性能。

解决方案：
- 识别热点数据：找出频繁修改的共享变量
- 缓存行对齐：将数据结构对齐到缓存行边界，避免缓存行失效和伪共享问题。
- 填充：在缓存行中添加填充字节，确保每个变量都在不同的缓存行中。
- @Contended注解：使用JDK8+提供的@Contended注解，在缓存行中添加填充字节，避免伪共享问题。
- 数据结构设计：合理设计数据结构避免伪共享。

### 调试并发程序
- 线程转储分析：使用jstack等工具分析线程转储，查看线程状态、锁信息、调用栈等。
- 死锁检测工具：使用jstack等工具检测死锁情况，及时发现并解决问题。
- 性能分析工具：使用VisualVM、JProfiler等工具分析程序性能，定位性能问题。
- JConsole：JDK提供的监控工具，可以检测死锁和线程状态。
- VisualVM：强大的性能分析工具，支持线程分析和内存分析可以查看线程状态、内存使用情况、GC信息等。
- ThreadSanitizer：检测数据竞争的工具，可以发现潜在的并发问题。

调试技巧
- 日志记录：记录线程id、时间戳和关键操作
- 断言检查：使用assert验证并发不变量
- 压力测试：增加线程数量和执行时间暴露问题
- 代码审查：重点检查共享变量的访问模式
- 单元测试：编写专门的并发测试用例。

## 并发编程实战
### 高并发秒杀系统
模拟电商秒杀场景，处理高并发请求，保证数据一致性和系统稳定性。
### 实时日志分析系统
实时处理和分析大量日志数据，提供高性能的数据处理能力。

### 分布式缓存系统
构建高性能的分布式缓存，支持LRU策略和过期机制。

### 高并发计数器实现

实现思路
- 原子操作：使用AtomicInteger和LongAdder实现无锁的原子计数操作。
- 分段计数：采用分段策略减少竞争，提高并发性能。
- 一致性保证：确保在高并发环境下计数的准确性和一致性。

```java
public class HighPerformanceCounter{
    private final LongAdder counter = new LongAdder();
    private final AtomicInteger atomicCounter = new AtomicInteger(0);

    //使用LongAdder实现高性能计数
    public void increment(){
        counter.increment();
    }
    public void add(long delta){
        counter.add(delta);
    }
    public long sum(){
        return counter.sum();
    }
    //原子操作版本
    public long incrementAndGet(){
        return atomicCounter.incrementAndGet();
    }
    //性能测试方法
    public static void performanceTest(){
        HighPerformanceCounter counter = new HighPerformanceCounter();
        int threadCount = 100;
        int iterations = 1000000;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);

        long startTime = System.currentTimeMillis();

        for(int i = 0;i<threadCount;i++){
            executor.submit(()->{
                try{
                    for(int j = 0;j<iterations;j++){
                        counter.increment();
                    }
                }finally{
                    latch.countDown();
                }
            });
        }
        try{
            latch.await();
            long endTime = System.currentTimeMillis();
            System.out.println("总计数:"+counter.sum());
            System.out.println("AtomicInteger 性能测试结果："+counter.incrementAndGet()+" 耗时："+(endTime-startTime)+"ms");
        }catch(InterruptedException e){
            Thread.currentThread().interrupt();
        }finally{
            executor.shutdown();
        }
    }
}
```
### 生产者消费者系统
支持多生产者多消费者模式，具备背压控制和监控功能。

系统架构
- 多生产者支持：支持多个生产者并发生产系统
- 多消费者支持：支持多个消费者并发消费系统
- 背压控制：当消费者处理速度跟不上生产者生产速度时，能够自动控制生产者生产速度，避免系统崩溃。（当队列满时自动进行流量控制）
- 监控功能：提供系统运行指标监控，如生产速度、消费速度、队列长度等。（实时监控生产和消费速率）
- 优雅关闭：支持系统多优雅停机。
```java
public class ProducerConsumerSystem{
    private final BlockingQueue queue;
    private final ExecutorService producerPool;
    private final ExecutorService consumerPool;
    private final AtomicLong producedCount = new AtomicLong(0);
    private final AtomicLong consumedCount = new AtomicLong(0);
    private volatile boolean running = true;

    public ProducerConsumerSystem(int queueCapacity, int producerThreads, int consumerThreads){
        this.queue = new ArrayBlockingQueue<>(queueCapacity);
        this.producerPool = Executors.newFixedThreadPool(producerThreads);
        this.consumerPool = Executors.newFixedThreadPool(consumerThreads);
    }
    //生产者接口
    public interface Producer{
        T produce() throws InterruptedException;
    }
    //消费者接口
    public interface Consumer{
        void consume(T item) throws InterruptedException;
    }
    //启动生产者
    public void startProducer(Producer producer){
        producerPool.submit(()->{
            while(running){
                try{
                    T item = producer.produce();
                    if(item != null){
                        queue.put(item);//阻塞式放入
                        producedCount.incrementAndGet();
                    }
                }catch(InterruptedException e){
                    Thread.currentThread().interrupt();
                    break;
                }catch(Exception e){
                    System.err.println("生产者异常:"+e.getMessage());
                }
            }
        });
    }
    //启动消费者
    public void startConsumer(Consumer consumer){
        consumerPool.submit(()->{
            while(running || !queue.isEmpty()){
                try{
                    T item = queue.poll(1,TimeUnit.SECONDS);//阻塞式取出
                    if(item != null){
                        consumer.consume(item);
                        consumedCount.incrementAndGet();
                    }
                }catch(InterruptedException e){
                    Thread.currentThread().interrupt();
                    break;
                }catch(Exception e){
                    System.err.println("消费者异常:"+e.getMessage());
                }
            }
        });
    }
    //获取统计信息
    public void printStats(){
        System.out.println("队列大小：" + queue.size());
        System.out.println("已生产：" + producedCount.get());
        System.out.println("已消费：" + consumedCount.get());
        //待处理
        System.out.println("待处理：" + (producedCount.get() - consumedCount.get()));
    }
    //优雅关闭
    public void shutdown(){
        running = false;
        producerPool.shutdown();
        consumerPool.shutdown();
        try{
            if(!producerPool.awaitTermination(5,TimeUnit.SECONDS)){
                producerPool.shutdownNow();
            }
            if(!consumerPool.awaitTermination(5,TimeUnit.SECONDS)){
                consumerPool.shutdownNow();
            }
        }catch(InterruptedException e){
            producerPool.shutdownNow();
            consumerPool.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
```
### 并发LRU缓存系统
实现一个线程安全的LRU缓存系统，支持并发读写操作，具备过期策略和内存管理功能。

核心特征
- 线程安全：使用读写锁保证并发安全，读操作不互斥。
- 过期策略：支持ttl过期和定期清理过期数据
- lru算法：基于双向链表和hashmap实现高效lru。
```java
public class ConcurrentLRUCache<K,V>{
    private final int capacity;
    private final long defaultTTL;
    private final ConcurrentHashMap<K,V> cache;
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    private CacheNode head;
    private CacheNode tail;

    private static class CacheNode{
        K key;
        V value;
        long expireTime;
        CacheNode prev;
        CacheNode next;
        CacheNode(K key, V value, long expireTime){
            this.key = key;
            this.value = value;
            this.expireTime = expireTime;
        }
    }
    public ConcurrentLRUCache(int capacity, long defaultTTL){
        this.capacity = capacity;
        this.defaultTTL = defaultTTL;
        this.cache = new ConcurrentHashMap<>();

        //初始化双向链表
        this.head = new CacheNode(null, null, 0);
        this.tail = new CacheNode(null, null, 0);
        head.next = tail;
        tail.prev = head;

        //启动清理线程
        startCleanupTask();
    }
    public V get(K key){
        CacheNode node = cache.get(key);
        if(node == null){
            return null;
        }
        //检查是否过期
        if(System.currentTimeMillis() > node.expireTime){
            removeNode(node);
            return null;
        }
        //移动到头部(最近使用)
        lock.writeLock().lock();
        try{
            moveToHead(node);
        }finally{
            lock.writeLock().unlock();
        }
        return node.value;
    }
    public void put(K key, V value){
        put(key, value, defaultTTL);
    }
    public void put(K key, V value, long ttl){
        long expireTime = System.currentTimeMillis() + ttl;
        CacheNode existingNode = cache.get(key);
        if(existingNode != null){
            //更现有节点（新值和过期时间）
            lock.writeLock().lock();
            try{
                existingNode.value = value;
                existingNode.expireTime = expireTime;
                moveToHead(existingNode);
            }finally{
                lock.writeLock().unlock();
            }
        }else{
            //创建新节点
            CacheNode newNode = new CacheNode(key, value, expireTime);
            cache.put(key, newNode);
            lock.writeLock().lock();
            try{
                if(cache.size() >= capacity){
                    //移除尾部节点（最少使用）
                    CacheNode lastNode = tail.prev;
                    removeNode(lastNode);
                    cache.remove(lastNode.key);
                }
                addToHead(newNode);
                cache.put(key, newNode);
            }finally{
                lock.writeLock().unlock();
            }
        }
    }
    public V remove(K key){
        CacheNode node = cache.remove(key);
        if(node == null){
            return null;
        }
        lock.writeLock().lock();
        try{
            removeNode(node);
        }finally{
            lock.writeLock().unlock();
        }
        return node.value;
    }
    private void moveToHead(CacheNode node){
        removeNode(node);
        addToHead(node);
    }
    private void addToHead(CacheNode node){
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }
    private void startCleanupTask(){
        ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
        cleanupExecutor.scheduleAtFixedRate(this::cleanupExpiredEntries, 60, 60, TimeUnit.SECONDS);
    }
    private void cleanupExpiredEntries(){
        long currentTime = System.currentTimeMillis();
        List expiredKeys = new ArrayList<>();
        //收集过期的key
        for(Map.Entry<K, CacheNode> entry : cache.entrySet()){
            if(currentTime > entry.getValue().expireTime){
                expiredKeys.add(entry.getKey());
            }
        }
        //移除过期节点
        for(K key : expiredKeys){
            remove(key);
        }
    }
    public int size(){
        return cache.size();
    }
    public void clear(){
        lock.writeLock().lock();
        try{
            cache.clear();
            head.next = tail;
            tail.prev = head;
        }finally{
            lock.writeLock().unlock();
        }
    }
}
```
### 限流器实现
实现多种限流算法，包括令牌桶、漏桶、滑动窗口，适用于不同的限流场景。

令牌桶：
令牌桶算法是一种常用的限流算法，它通过在固定时间间隔内向令牌桶中放入令牌，来控制请求的速率。当请求到达时，需要从令牌桶中获取令牌才能继续处理。如果令牌桶为空，则请求被拒绝。（简单说令牌桶以固定速率产生令牌，请求需要获取令牌才能通过，支持突发流量）
```java
public class TokenBucketRateLimiter{
    private final int capacity;//桶容量
    private final long refillRate;//令牌产生速率（每秒）
    private final AtomicLong tokens;//当前令牌数
    private final AtomicLong lastRefillTime;//上次令牌生产时间

    public TokenBucketRateLimiter(int capacity, long refillRate){
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = new AtomicLong(capacity);
        this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
    }
    public boolean tryAcquire(){
        return tryAcquire(1);
    }
    public boolean tryAcquire(int permits){
        refillTokens();

        long currentTokens = tokens.get();
        if(currentTokens < permits){
            return false;
        }else{
            if(tokens.compareAndSet(currentTokens, currentTokens - permits)){
                return true;
            }
            //cas失败，递归重试
            return tryAcquire(permits);
        }
    }
    private void refillTokens(){
        long now = System.currentTimeMillis();
        long lastRefill = lastRefillTime.get();

        if(now > lastRefill){
            long timePassed = now - lastRefill;
            long tokensToAdd = (timePassed * refillRate) / 1000;
            if(tokensToAdd > 0){
                long currentTokens = tokens.get();
                long newTokens = Math.min(capacity, currentTokens + tokensToAdd);
                
                if(tokens.compareAndSet(currentTokens, newTokens)){
                    lastRefillTime.set(now);
                }
            }
        }
    }
    public long getAvailableTokens(){
        refillTokens();
        return tokens.get();
    }
}
```
滑动窗口算法
```java
public class SlidingWindowRateLimiter{
    private final int windowSize;//窗口大小（秒）
    private final int maxRequests;//最大请求数
    private final CouncurrentLinkedQueue requestTimes;

    public SlidingWindowRateLimiter(int windowSize, int maxRequests){
        this.windowSize = windowSize;
        this.maxRequests = maxRequests;
        this.requestTimes = new ConcurrentLinkedQueue<>();
    }
    public boolean tryAcquire(){
        long now = System.currentTimeMillis();
        long windowStart = now - windowSize * 1000L;
        //移除过期请求
        while(!requestTimes.isEmpty() && requestTimes.peek() < windowStart){
            requestTimes.poll();
        }
        //检查是否超过限制
        if(requestTimes.size() < maxRequests){
            requestTimes.offer(now);
            return true;
        }
        return false;
    }
    public int getCurrentRequests(){
        long now = System.currentTimeMillis();
        long windowStart = now - windowSize * 1000L;
        //移除过期请求
        while(!requestTimes.isEmpty() && requestTimes.peek() < windowStart){
            requestTimes.poll();
        }
        return requestTimes.size();
    }
}
```
### 常见面试题
#### synchronized 与 ReentrantLock 的区别
- synchronized是Java关键字，ReentrantLock是Java类
- synchronized是自动释放锁，ReentrantLock需要手动释放锁
- synchronized是不可中断锁，ReentrantLock可以中断等待锁的线程
- synchronized是非公平锁，ReentrantLock可以是公平锁或非公平锁
- 性能上ReentrantLock在高并发场景下性能更好
#### ConcurrentHashMap原理
jdk8实现
- 使用cas+synchronized
- 数组+链表/红黑树
- 分段锁思想，锁粒度更细
- 扩容时支持并发扩容

#### ThreadLocal内存泄漏
- ThreadLocalMap的key是弱引用
- value是强引用，可能导致内存泄漏
- 线程池中线程复用加剧问题

解决：及时调用remove方法
#### aqs工作原理
- 状态管理（state字段）
- fifo等待队列
- 模版方法模式
- cas操作保证原子性

#### 回答要点
- 理论结合实践：不仅要说原理，还要举实际应用例子
- 对比分析：说明不同方案的优缺点和适用场景
- 性能考虑：讨论性能影响和优化方法
- 实际经验：分享项目中遇到的并发问题和解决方案
- 深入细节：准备深入的技术细节，展示扎实功底

### 性能测试与优化
- jmh：java微基准测试框架，精确测量代码性能
- jprofiler：java性能分析工具，分析cpu和内存使用
- visualvm：免费的性能监控工具
- arthas：阿里开源的java诊断工具
- 压测工具：jmeter、gatling等负载测试工具

优化策略
- 减少锁竞争：使用无锁算法、减小锁粒度、避免锁嵌套
- 内存优化：对象池化、减少gc压力、合理设置堆大小
- io优化：使用nio、异步io、连接池等技术。

