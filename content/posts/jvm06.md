---
title: "JVM 线程模型"
date: 2021-02-04T16:55:13+08:00
draft: false
description: "JVM 线程模型：深入学习jvm线程机制，掌握线程创建、调度、同步和通信等知识，提升应用并发性能和稳定性。"
tags: ["JVM", "线程模型"]
categories: [JVM]
---
JVM 线程模型：深入学习jvm线程机制，掌握线程创建、调度、同步和通信等知识，提升应用并发性能和稳定性。
## 线程与并发调优
### jvm线程模型
#### 线程实现方式
现在jvm主要采用1:1线程模型，每个java线程映射到一个os线程。
- 直接映射：java线程直接映射到os线程，线程创建、销毁、切换都由os负责。
- 线程池：jvm内部维护一个线程池，线程复用，避免频繁创建销毁线程。
- 真正并行：可以充分利用多核cpu的并行处理能力
- 资源开销：每个线程都有独立的栈空间、寄存器等资源，占用一定的内存和cpu资源。
- 上下文切换：线程切换涉及到内核态到用户态到转换，切换开销较大。

#### 线程栈结构
线程栈是java线程执行时的内存区域，每个线程有独立的栈空间。栈空间用于存储方法调用、局部变量、方法参数、返回地址、操作数栈等信息。
- java虚拟机栈：存储局部变量表、操作数栈、动态链接和方法出口等信息，每个方法调用对应一个栈帧。
- 本地方法栈：为native方法服务，存储本地方法的局部变量和调用信息。
- 程序计数器：记录当前线程执行的字节码指令地址，线程私有且不会发生内存溢出。

#### 线程状态转换
线程状态转换图
```java
public enum State{
    NEW,//新建
    RUNNABLE,//可运行状态，线程正在执行或等待执行
    BLOCKED,//阻塞（等待监视器锁）
    WAITING,//等待状态（无限期等待）
    TIMED_WAITING,//超时等待
    TERMINATED;//终止
}
```
### 线程栈调优
#### 栈大小设置
通过-Xss参数可以设置每个线程的栈大小。

```java
//设置栈大小为1mb（默认值因平台而异）
-Xss1m
//设置栈大小为512kb（适合大量线程的场景）
-Xss512k
//设置栈大小为2mb（适合深度递归的场景）
-Xss2m
```
栈大小选择原则
- 默认值参考：linux x64平台默认1mb，windows默认320kb-1mb
- 线程数量：线程数量越多，栈应该越小以节省空间
- 调用深度：递归调用深度越深，栈空间需求越大。
- 局部变量：每个方法调用都有自己的栈帧，栈帧中包含局部变量表。局部变量表的大小直接影响栈帧的大小。大量局部变量的方法需要更多栈空间。
- 操作数栈：每个方法调用都有自己的操作数栈，操作数栈的大小也会影响栈帧的大小。
#### 栈溢出处理
栈溢出（StackOverflowError）是常见的线程相关问题。
- 递归调用过深：优化递归算法，使用迭代替代或增加栈大小
- 方法调用链过长：重构代码，减少方法调用层次
- 局部变量过多：减少大对象的局部变量，使用对象池
- 栈大小不足：适当增加-Xss参数值
> 栈大小设置需要平衡内存使用和功能需求。过小可能导致栈溢出，过大会浪费内存并限制线程数量。总内存 = 堆内存+非堆内存+（线程数*栈大小）

### 线程状态分析
通过分析线程dump可以发现死锁、线程泄漏、性能瓶颈等。
#### 线程dump获取
```java
//获取线程dump
jstack > threaddump.txt
//使用jcmd命令获取线程dump
jcmd Thread.print > threaddump.txt
//使用kill命令（linux/unix）
kill -3
//程序内获取
ThreadMXBean threadMX = ManagementFactory.getThreadMXBean();
ThreadInfo[] threadInfos = threadMX.dumpAllThreads(true, true);
```
#### 线程dump分析
- 线程状态：runnable、blocked、waiting等状态分布，识别异常状态的线程。
- 锁信息：持有锁和等待锁的情况，识别锁竞争和死锁问题
- 调用链：方法调用链，定位问题代码位置和执行路径。

#### 死锁检测
```java
ThreadMXBean threadMX = ManagementFactory.getThreadMXBean();
long[] deadlockedThreads = threadMX.findDeadlockedThreads();
if(deadlockedThreads != null){
    ThreadInfo[] threadInfos = threadMX.getThreadInfo(deadlockedThreads);
    for(ThreadInfo threadInfo : threadInfos){
        System.out.println(threadInfo);
    }
}
```
### 并发性能优化
#### 锁优化策略
1. 偏向锁：针对一个线程访问的同步块优化
2. 轻量级锁：使用cas操作避免重量级锁的开销
3. 重量级锁：传统的互斥锁，涉及操作系统调用
4. 锁消除：编译器优化，消除不必要的同步
5. 锁粗化：将多个连续的锁操作合并为一个

策略
- 减小锁粒度：将锁的范围缩小到最小必要范围，减少锁冲突。
- 锁粗化：将多个连续的锁操作合并为一个锁操作，减少锁申请和释放次数。
- 使用读写锁：在读多写少的场景下，使用读写锁可以提高并发性能。
- 避免锁升级：锁升级是指从偏向锁升级到轻量级锁，再升级到重量级锁。避免锁升级可以减少上下文切换和等待时间。
- 锁优化工具：使用jconsole、jvisualvm等工具分析锁竞争和死锁问题，优化锁策略。
```java
//启用偏向锁（jdk8默认开启，jdk15以后默认关闭）
-XX:+UseBiasedLocking
//偏向锁延迟启动时间（毫秒）
-XX:BiasedLockingStartupDelay=1000
//禁用偏向锁
-XX:-UseBiasedLocking
//启用锁消除优化
-XX:+EliminateLocks
//启用锁粗化优化
-XX:+EliminateNestedLocks
```
#### 无锁编程
无锁编程是指在不使用锁的情况下实现并发操作，通过原子操作、CAS操作等实现线程安全。
- 原子操作：java.util.concurrent.atomic包提供了一系列原子操作类，如AtomicInteger、AtomicLong等。
- CAS操作：compare and swap操作，通过比较当前值和预期值是否相等来判断是否需要更新。
- 无锁数据结构（并发集合）：如ConcurrentHashMap、ConcurrentLinkedQueue等，通过CAS操作实现线程安全。
#### 线程池调优
```java
//cpu密集型任务：线程数 = cpu核心数+1
int cpuCoreNum = Runtime.getRuntime().availableProcessors();
int threadNum = cpuCoreNum + 1;
//io密集型任务：线程数 = cpu核心数*2
int threadNum = cpuCoreNum * 2;
//自定义线程池
//自定义线程池参数
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize, //核心线程数
    maximumPoolSize, //最大线程数
    keepAliveTime, //线程空闲时间
    TimeUnit.SECONDS, //时间单位
    new LinkedBlockingQueue<>(queueCapacity), //工作队列
    new ThreadFactoryBuilder()
        .setNameFormat("custom-thread-%d")
        .build(),
    new ThreadPoolExecutor.CallerRunsPolicy() //拒绝策略
);
```
#### 并发无锁数据结构
如ConcurrentHashMap、ConcurrentLinkedQueue等，通过CAS操作实现线程安全。
### 线程问题诊断
#### cpu使用率飚高
通常是某些线程在执行cpu密集型任务，导致其他线程等待。
```java
//找到占用cpu高的进程
top -p
//找到占用cpu高的线程
top -H -p
//将线程id转换为16进制
printf "%x\n" <thread_id>
//获取线程dump
jstack | grep -A 20
//分析线程调用栈，定位问题代码
```
#### 死锁问题
陷入永久阻塞状态
- 互斥条件：资源只能被一个线程占用，其他线程必须等待。
-  hold and wait条件：线程持有资源的同时，等待其他资源。
-  不可剥夺条件：资源不能被其他线程强制抢占。
-  循环等待条件：线程之间形成循环等待，每个线程都在等待其他线程释放资源。
#### 线程泄漏
线程泄漏是指线程在执行完成后，没有被正确释放，导致线程池中的线程数量不断增加，最终耗尽线程池资源。
- 控制线程数量：定期检查活跃线程数量变化
- 检查线程池配置：确保线程池正确关闭
- 分析线程dump：查看异常状态的线程
- 代码审查：检查线程创建和销毁的代码，确保及时释放线程资源。
```java
//监控线程数量
ThreadMXBean threadMX = ManagementFactory.getThreadMXBean();
int activeThreadCount = threadMX.getThreadCount();
int peakThreadCount = threadMX.getPeakThreadCount();
long totalStartedThreadCount = threadMX.getTotalStartedThreadCount();
```
### 实战案例
#### 高并发场景优化
- web服务器线程池配置优化
- 数据库连接池鱼线程池的配置优化
- 缓存并发访问优化
- 消息队列消费者线程调优
#### 问题排查实战
- 死锁检查：模拟死锁场景，使用工具检测和分析死锁，提供解决方案
- 性能瓶颈：识别并发性能瓶颈，通过调优参数和优化代码提升性能。
- 内存泄漏：诊断线程相关的内存泄漏问题，包括线程泄漏和ThreadLocal内存泄漏。

### 最佳实践
核心建议
- 合理设置线程数：根据任务类型（cpu密集型、io密集型）和系统资源（cpu核心数、内存大小），合理设置线程池大小。、
- 避免过度同步：减少锁的粒度和持有时间，优先使用并发集合。
- 监控线程池状态：使用工具监控线程池状态，如jconsole、jvisualvm等，及时发现线程池问题。
- 分析线程dump：当线程池问题出现时，分析线程dump，定位问题代码。
- 优雅关闭：确保线程池和线程能够正确关闭，避免资源泄漏。
- 代码审查：检查线程创建和销毁的代码，确保及时释放线程资源。
#### 参数配置建议
```java
//线程相关
-Xss1m //线程栈大小
-XX:+UseThreadPriorities //启用线程优先级
-XX:+UseThreadLocking //启用偏向锁

//监控相关参数
-XX:+PrintGCDetails //打印gc详细信息
-XX:+PrintGCTimeStamps //打印gc时间戳
-XX:+HeapDumpOnOutOfMemoryError //发生oom时 dump heap
```
#### 代码层面优化
- 使用线程池：避免手动创建线程，使用线程池管理线程，提高线程利用率和性能。
- 选择合适的并发集合：根据场景选择合适的并发集合，如ConcurrentHashMap、ConcurrentLinkedQueue等，避免使用同步集合。
- 避免共享可变状态：确保线程之间不共享可变状态，避免竞态条件和数据不一致问题。
- 使用ThreadLocal：避免在多线程场景下使用共享的可变状态，使用ThreadLocal存储线程本地变量，避免线程安全问题。
- 异步编程：使用CompletableFuture等异步编程模型，避免阻塞线程。
- 避免长事务：将长事务拆分成多个短事务，减少锁持有时间，提高并发性能。
- 合理设置线程栈大小：根据任务类型和系统资源，合理设置线程栈大小，避免栈溢出。