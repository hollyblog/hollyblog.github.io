---
title: "并发编程-并发工具"
date: 2021-01-21T15:40:00+08:00
draft: false
description: "并发编程并发工具：同步工具类、Fork/Join框架、ThreadLocal、AQS抽象队列同步器。"
tags: ["JUC", "并发编程", "并发工具"]
categories: ["JUC"]
---
并发编程并发工具：同步工具类、Fork/Join框架、ThreadLocal、AQS抽象队列同步器。

## 同步工具类
### CountDownLatch - 倒计时门闩
它是一个同步工具类，它允许一个或多个线程等待其他线程完成操作。它通过一个计数器来实现，计数器的初始值为线程的数量，每个线程完成操作后，计数器减一。当计数器减为0时，表示所有的线程都已经完成了任务，然后在闭锁上等待的线程就可以恢复执行任务。所有等待的线程被唤醒。
> CountDownLatch是一次性的，计数器的值只能在构造方法中初始化一次，之后没有任何机制再对其设置值，当CountDownLatch使用完毕后，它不能再次被使用。

主要方法
- countDown()：递减锁存器的技术，计数器减一，如果技术到达零，则释放所有等待的线程。
- await()：调用await()方法的线程会被阻塞，直到计数器的值为0。（使当前线程在锁存器倒计数至0之前都一直等待，除非线程被中断）。
- await(long timeout, TimeUnit unit):使当前线程在锁存器倒计数至0之前一直等待，除非线程被中断或者超出了指定的等待时间。

```java
public static void main(String[] args){
    private static final int THREAD_COUNT = 5;
    CountDownLatch startSignal = new CountDownLatch(1);
    CountDownLatch doneSignal = new CountDownLatch(THREAD_COUNT);
    ExecutorService executor = Executors.newFixedThreadPool(THREAD_COUNT);
    //创建线程
    for(int i=0;i<THREAD_COUNT;i++){
        final int taskId = i;
        executor.submit(() - > {
            try{
                //等待开始信号
                startSignal.await();
                //执行任务
                System.out.println("Thread "+taskId+" is running");
                //模拟任务执行时间
                Thread.sleep(1000);
                //任务完成，计数器减一
                doneSignal.countDown();
            }catch(InterruptedException e){
                Thread.currentThread().interrupt();
            }
        });
    }
    System.out.println("主线程准备启动所有任务");
    Thread.sleep(1000);
    //发出开始信号
    startSignal.countDown();
    System.out.println("所有任务已启动");
    try{
        //等待所有任务完成
        doneSignal.await();
    }catch(InterruptedException e){
        Thread.currentThread().interrupt();
    }
    System.out.println("所有任务已完成");
    executor.shutdown();
}
```
### CyclicBarrier - 循环屏障
是一个同步辅助类，允许一组线程互相等待，直到到达某个公共屏障点。在涉及一组固定大小的线程的程序中，这些线程必须不时地相互等待，此时CyclicBarrier就非常有用。因为该barrier在释放等待线程后可以重用，所以称它为循环的barrier。

> 与CountDownLatch的区别，是CyclicBarrier的计数器可以重置，当所有线程都到达屏障点后，屏障会自动重置，可以进行下一轮的同步。而CountDownLatch的计数器只能减一，不能重置。

使用场景
- 多阶段任务：需要分阶段执行的并行计算任务
- 数据处理：多线程处理数据，需要在每个阶段同步
- 游戏开发：多玩家游戏中的回合制同步
- 测试场景：并发测试中的线程同步点

### Semaphore - 信号量
它是一个计数信号量，从概念上讲，信号量维护了一个许可集。如有必要，在许可可用前会阻塞每一个acquire()，然后在获取该许可后继续执行。每个release()添加一个许可，从而可能释放一个正在阻塞的获取者。但是，不使用实际的许可对象，Semaphore只是对给定数量的许可进行计数，并采取相应的行动。
> Semaphore通常用于限制可以访问某些资源的线程数目。例如，数据库连接池、线程池场景等。

主要方法
- acquire()：从此信号量获取一个许可，如果没有可用的许可，那么线程会阻塞，除非线程被中断，直到有可用的许可。
- release()：释放一个许可，将其返回给信号量。
- availablePermits()：返回此信号量中当前可用的许可数。

使用场景
- 限流：控制同时访问某个资源的线程数量，防止资源耗尽
- 并发控制：在某些场景下，需要限制同时访问某个资源的线程数量，例如数据库连接池
- 任务分发：将任务分发到多个线程进行并行处理

### Exchanger - 数据交换器
Exchanger是一个用于线程间数据交换的工具类，它允许两个线程在某个点上交换数据。每个线程在调用exchange()方法时，会阻塞等待另一个线程也调用exchange()方法，然后交换数据。简单说：一个线程在完成一定的事务之后想与另一个线程交换数据，则第一个先拿出数据的线程会一直等待第二个线程，直到第二个线程拿着数据到来时才能彼此交换对应数据。

使用场景 
- 数据校验：两个线程同时处理同一批数据，交换结果进行校验
- 生产者消费者：一个线程生产数据，另一个线程消费数据，通过交换器实现数据的传递。
- 数据传递：多个线程之间需要传递数据，每个线程处理完一部分数据后，将结果传递给下一个线程继续处理。

### Phaser - 多阶段同步器
Phaser是java7中新增的一个同步辅助类，可以实现CyclicBarrier和CountDownLatchl类似的功能，但是更加灵活。它支持对任务的动态调整，并支持分层结构来达到更高的吞吐量，它可以在运行时动态注册和注销线程，支持分阶段执行。

主要方法
- register()：注册一个新的线程到Phaser中（即注册一个新的参与者）。
- arriveAndAwaitAdvance()：表示当前线程到达当前阶段并等待所有线程到达当前阶段，当所有线程都到达当前阶段时，会自动进入下一个阶段。
- arriveAndDeregister()：表示当前线程到达当前阶段并注销，当所有线程都到达当前阶段时，会自动进入下一个阶段。
- unregister()：注销一个线程从Phaser中。
- awaitAdvance(int phase)：等待所有线程到达指定的阶段，然后返回下一个阶段的索引。
- arrive()：表示当前线程到达当前阶段，当所有线程都到达当前阶段时，会自动进入下一个阶段。
### 同步类工具对比

- CountDownLatch:
  - 一次性使用
  - 等待多个任务完成
  - 适用于启动信号和完成信号
  - 不支持动态注册和注销线程
- CyclicBarrier:
  - 循环使用
  - 等待多个线程到达屏障点（多个线程相互等待）
  - 适用于分阶段任务
  - 支持动态注册和注销线程
- Semaphore:
  - 控制并发线程数量（控制资源访问数量）控制同时访问某个资源的线程数量
  - 支持公平和非公平模式
  - 适用于资源池管理
- Exchanger:
  - 线程间数据交换
  - 适用于数据校验场景
  - 同步点数据传递
- Phaser:
  - 多阶段同步器
  - 动态参与者管理
  - 支持分层结构
## Fork/Join 框架
### 框架概述
Fork/Join 框架是 Java 7 中引入的一个并行计算框架，Fork将一个大任务分解为多个小任务并行执行，最后Join将小任务的结果合并起来。它基于分治策略，将任务递归地分解为子任务，直到任务足够小可以直接执行。用于解决计算密集型任务。

框架特点
- 分治算法
- 工作窃取：空闲线程可以从其他线程的任务队列中窃取任务，提高cpu利用率
- 高性能：充分利用多核cpu，适合计算密集型任务的并行处理。

使用场景
- 递归算法：如归并排序、快速排序
- 数学计算：矩阵运算、数值积分
- 数据处理：大数据的并行处理
- 图像处理：图像滤波、变换。

### ForkJoinPool
ForkJoinPool是一个用于执行Fork/Join任务的线程池，专门用于执行ForkJoinTask。实现类工作窃取算法。它实现了ExecutorService接口。它内部维护了一个工作线程池，每个线程都有一个任务队列，用于存储待执行的任务。当一个线程执行完一个任务后，它可以从其他线程的任务队列中窃取任务来执行，从而实现工作窃取机制。

```java
//使用默认并行度（cpu核心数）
ForkJoinPool forkJoinPool = new ForkJoinPool();
//使用自定义并行度
ForkJoinPool forkJoinPool = new ForkJoinPool(4);
//使用公共池（推荐）
ForkJoinPool forkJoinPool = ForkJoinPool.commonPool();
//获取并行度
int parallelism = forkJoinPool.getParallelism();
```
工作窃取算法
- 双端队列：每个工作线程都有自己的双端队列，新任务从队列头部添加，线程从头部取出任务执行。
- 任务窃取：当线程的队列为空时，它会随机选择其他线程的队列，从尾部窃取任务执行。
- 负载均衡：通过工作窃取机制，自动实现负载均衡，避免某些线程空闲而其他线程过载。

### RecursiveTask和RecursiveAction
Fork/Join框架提供了两个抽象类来定义任务：
- RecursiveTask：表示有返回值的任务，它的compute()方法返回一个结果。
- RecursiveAction：表示没有返回值的任务，它的compute()方法没有返回值。
```java
public class SumTask extends RecursiveTask<Long>{
    private static final int THRESHOLD = 1000;//阈值
    private int[] array;
    private int start;
    private int end;
    public SumTask(int[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end = end;
    }
    @Override
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            // 任务足够小，直接计算
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            return sum;
        } else {
            // 任务过大，分解为两个子任务
            int mid = (start + end) / 2;
            SumTask leftTask = new SumTask(array, start, mid);
            SumTask rightTask = new SumTask(array, mid, end);
            //Fork:异步执行左任务
            leftTask.fork();
            // 执行右任务（当前线程
            Long rightResult = rightTask.compute();
            //Join:等待左任务完成并获取结果
            Long leftResult = leftTask.join();
            // 合并子任务结果
            return leftResult + rightResult;
        }
    }
}
public class ForkJoinExample{
    public static void main(String[] args) {
        int[] array = new int[10000000];
        for(int i = 0; i < array.length; i++){
            array[i] = i + 1;
        }
        //使用fork/join计算
        ForkJoinPool pool = ForkJoinPool.commonPool();
        SumTask sumTask = new SumTask(array, 0, array.length);
        long startTime = System.currentTimeMillis();
        Long result = pool.invoke(sumTask);
        long endTime = System.currentTimeMillis();
        System.out.println("Sum: " + result);
        System.out.println("Time: " + (endTime - startTime) + "ms");

        //串行计算
        long serialStartTime = System.currentTimeMillis();
        long serialSum = 0;
        for(int i = 0; i < array.length; i++){
            serialSum += array[i];
        }
        long serialEndTime = System.currentTimeMillis();
        System.out.println("Serial Sum: " + serialSum);
        System.out.println("Serial Time: " + (serialEndTime - serialStartTime) + "ms");
    }
}
```
> - 合理设置阈值，避免任务分解得过细或过粗，导致性能问题。
> - 优先使用ForkJoinPool.commonPool()，避免创建多个线程池，导致资源浪费。
> - 确保任务是cpu计算密集型，io密集型任务不适合使用fork/join框架。

### 性能优化
- 合理设置阈值：根据任务的计算量和cpu核心数，合理设置阈值，避免任务分解得过细或过粗。阈值太小会导致任务分解过细，增加任务切换的开销；阈值太大会导致任务分解过粗，无法充分利用多核cpu的并行计算能力。
- 减少内存分配：尽量重用对象，避免在compute()方法中频繁创建新对象。
- 避免创建多个线程池：优先使用ForkJoinPool.commonPool()，避免创建多个线程池，导致资源浪费。
- 确保任务是cpu计算密集型：io密集型任务不适合使用fork/join框架，因为fork/join框架的优势在于并行计算，而io密集型任务的并行计算效率较低。
- 避免深度递归：控制递归深度，防止栈溢出，可以考虑混合使用递归和迭代。
- 避免阻塞：在compute()方法中避免阻塞操作，如io操作，因为这会阻塞线程，影响并行计算的效率。
- 异常处理：正确处理子任务中的异常，避免影响整个计算。

```java
//串行计算
//并行流运算
//fork/join计算
```

## ThreadLocal 
ThreadLocal是java中提供的线程本地存储机制，它为每一个线程提供独立的变量副本，使得每个线程都可以独立地改变自己的副本，而不会影响其他线程所对应的副本。

> ThreadLocal 并不是一个线程，而是线程的一个本地化对象。当使用ThreadLocal维护变量时，ThreadLocal为每个使用该变量的线程提供独立的变量副本。

特点
- 线程隔离：每个线程都有自己的变量副本，线程之间互不干扰，保证了线程安全。
- 内存独立：变量存储在各自线程的内存空间中，避免了同步开销。
- 生命周期：变量的生命周期和线程同步，线程结束时变量自动回收。

### ThreadLocal工作原理
ThreadLocal维护了一个ThreadLocalMap对象，以ThreadLocal对象作为key，实际存储的值作为value。
ThreadLocalMap对象存储了每个线程的变量副本。ThreadLocalMap对象是ThreadLocal类的一个静态内部类，该类继承了WeakHashMap，WeakHashMap的键是ThreadLocal对象，值是变量副本。

核心组件
- ThreadLocal：提供线程本地变量的访问接口。
- ThreadLocalMap：实际存储数据的map。ThreadLocalMap对象存储了每个线程的变量副本。ThreadLocalMap对象是ThreadLocal类的一个静态内部类，该类继承了WeakHashMap，WeakHashMap的键是ThreadLocal对象，值是变量副本。
- Entry: ThreadLocalMap中的键值对，key是ThreadLocal的弱引用。
- Thread.threadLocals:每个线程持有的ThreadLocalMap实例。

> 当调用ThreadLocal的set()方法时，会将当前线程作为key，变量副本作为value，存储到ThreadLocalMap中。
> 当调用ThreadLocal的get()方法时，会将当前线程作为key，从ThreadLocalMap中获取对应的变量副本。

```java
//源码
public void set(T value) {
    //获取当前线程
    Thread t = Thread.currentThread();
    //获取当前线程的ThreadLocalMap
    ThreadLocalMap map = getMap(t);
    if(map != null){
        //如果map不为空，直接设置值
        map.set(this, value);
    }else{
        //如果map为空，创建一个新的ThreadLocalMap
        createMap(t, value);
    }
}
public T get() {
    //获取当前线程
    Thread t = Thread.currentThread();
    //获取当前线程的ThreadLocalMap
    ThreadLocalMap map = getMap(t);
    if(map != null){
        //如果map不为空，从map中获取值
        ThreadLocalMap.Entry e = map.getEntry(this);
        if(e != null){
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    //如果map为空，返回默认值
    return setInitialValue();
}
```
### ThreadLocalMap实现机制
ThreadLocalMap是ThreadLocal的内部类，它使用开放地址法解决哈希冲突，并使用弱引用来避免内存泄漏。

数据结构特点
- 使用开放地址法解决哈希冲突：当哈希冲突发生时，开放地址法会从当前位置开始，依次查找下一个可用的位置，直到找到一个空闲位置。
- 使用弱引用：ThreadLocalMap.Entry的键是ThreadLocal的弱引用，当ThreadLocal对象没有其他强引用时，会被垃圾回收器回收。
- 动态扩容：当负载因子超过阈值时，会进行扩容和重新哈希。
```java
//ThreadLocalMap.Entry结构
static class Entry extends WeakReference<ThreadLocal<?>>{ 
    Object value;
    Entry(ThreadLocal<?> k, Object v) {
        super(k);//key是弱引用
        value = v;//value是强引用
    }
}
//ThreadLocalMap的核心数据结构
private Entry[] table;
private int size = 0;
private int threshold;//扩容阈值
```
### 内存泄漏问题和解决方案

ThreadLocal可能导致内存泄漏的主要原因是ThreadLocalMap中的Entry对象的key持有ThreadLocal对象的弱引用，但value使用强引用，当ThreadLocal对象没有其他强引用时，会被垃圾回收器回收。但是，由于ThreadLocalMap中的Entry对象的value是强引用，当ThreadLocal对象没有其他强引用时，value也不会被回收，从而导致内存泄漏。
> 线程池环境中，线程不会销毁，如果不手动清理ThreadLocal,会导致value一直被引用而无法回收。

原因：
- 弱引用key：ThreadLocal对象可能被gc回收，导致entry的key为null。
- 强引用value：ThreadLocalMap中的value是强引用，当ThreadLocal对象没有其他强引用时，value也不会被回收。
- 线程复用：在线程池中，线程不会销毁，ThreadLocalMap持续存在
- 清理不及时：虽然有自动清理机制，但可能不够及时。

解决方案：
- 手动清理：使用完ThreadLocal对象后，手动调用ThreadLocal对象的remove()方法，将ThreadLocalMap中的entry从table中移除。
- try-finally：在使用完ThreadLocal对象后，使用try-finally块确保及时清理，避免内存泄漏。
- 静态变量：将ThreadLocal对象定义为static final，这样ThreadLocal对象不会被gc回收，也不会导致内存泄漏。

### InheritableThreadLocal
InheritableThreadLocal是ThreadLocal的子类，它允许子线程继承父线程的ThreadLocal值，实现了线程间的值传递。

InheritableThreadLocal的实现原理：
当创建新线程时，如果父线程有InheritableThreadLocal值，子线程会复制父线程的inheritableThreadLocals到自己的inheritableThreadLocals属性中。
```java
public class InheritableThreadLocalEaxample { 
    private static final InheritableThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();
    public static void main(String[] args) { 
        //设置父线程的inheritableThreadLocal值
        inheritableThreadLocal.set("parent value");
        System.out.println("Parent thread: " + inheritableThreadLocal.get());
        //创建子线程
        Thread childThread = new Thread(() -> {
            System.out.println("Child thread: " + inheritableThreadLocal.get());
            //子线程修改值
            inheritableThreadLocal.set("child value");
            System.out.println("Child thread after set: " + inheritableThreadLocal.get());
        });
        childThread.start();
        try { 
            childThread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //父线程的值不会改变
        System.out.println("Parent thread after child thread: " + inheritableThreadLocal.get());
    }
}
```
### 实际应用场景
- 用户上下文：在web应用中存储当前用户信息，避免在方法间传递用户参数。
- 数据库连接：为每个线程维护独立的数据库连接，避免连接冲突。
- 事务管理：在事务处理中保存事务状态，确保事务的一致性。

### 性能考虑和最佳实践
- 内存开销：每个线程都维护自己的ThreadLocalMap，增加内存使用
- gc压力：大量ThreadLocal对象可能增加垃圾回收压力
- 哈希冲突：ThreadLocalMap的线性探测可能导致性能下降
- 初始化开销：首次访问时需要创建ThreadLocalMap，可能会增加性能开销
- 避免创建过多的ThreadLocal对象：ThreadLocal对象过多可能会导致内存泄漏和性能问题
- 及时清理不再使用的ThreadLocal对象：ThreadLocal对象可能被gc回收，但value可能不会被gc回收，导致内存泄漏。
- 考虑使用对象池来减少对象创建
- 在高并发场景喜爱监控内存使用情况

> - 安全使用：声明为static final、及时调用remove()方法，避免内存泄漏、使用try-y-finally块，避免内存泄漏。
> - 性能优化：避免存储大对象、控制ThreadLocal数量、监控内存使用。
> - 代码规范：提供统一的工具类；明确生命周期管理；添加适当的文档说明。

```java
//ThreadLocal工具类模板
public class ThreadLocalUtils { 
    /**
     * 创建ThreadLocal对象实例的工厂方法
     * @param <T> ThreadLocal值的类型
     * @param initialValue ThreadLocal值的初始值提供者
     * @return 新创建的ThreadLocal对象实例
     */
    public static <T> ThreadLocal<T> withInitial(Supplier<T> initialValue) { 
        return ThreadLocal.withInitial(initialValue);
    }
    /**
     * 安全设置ThreadLocal值
     * @param threadLocal ThreadLocal对象实例
     * @param value 要设置的值
     * @param <T> ThreadLocal值的类型
     */
    public static <T> void safeSet(ThreadLocal<T> threadLocal, T value) { 
        if (threadLocal != null) { 
            threadLocal.set(value);
        }
    }
    /**
     * 安全获取ThreadLocal值
     * @param threadLocal ThreadLocal对象实例
     * @param <T> ThreadLocal值的类型
     * @return ThreadLocal值，或null如果ThreadLocal对象为null
     */
    public static <T> T safeGet(ThreadLocal<T> threadLocal) { 
        return threadLocal != null ? threadLocal.get() : null;
    }
    /**
     * 安全移除ThreadLocal值
     * @param threadLocal ThreadLocal对象实例
     */
    public static void safeRemove(ThreadLocal<?> threadLocal) { 
        if (threadLocal != null) { 
            threadLocal.remove();
        }
    }
    /**
     * 批量清理多个ThreadLocal对象
     * @param threadLocals 要清理的ThreadLocal对象实例数组
     */
    public static void removeAll(ThreadLocal<?>... threadLocals) { 
        if (threadLocals != null) { 
            for (ThreadLocal<?> threadLocal : threadLocals) { 
                safeRemove(threadLocal);
            }
        }
    }
}
```
## AQS抽象队列同步器

AQS抽象队列同步器（AbstractQueuedSynchronizer）是Java并发包中的一个抽象类，用于实现线程同步机制。它为实现依赖于先进先出等待队列的阻塞锁和相关同步器提供了一个框架。AQS是ReentrantLock\CountDownLatch\Semaphore等同步工具等基础。它提供了一种基于队列的锁机制，允许多个线程同时访问共享资源，但当某个线程访问共享资源时，其他线程只能等待，直到该线程释放锁。AQS的核心思想是将线程的等待和唤醒操作封装在队列中，通过对队列的操作来实现线程的同步。
> AQS使用模版方法模式，定义了同步器等基本框架，子类只需要实现特定的方法来定义同步状态的获取和释放逻辑。

核心组件：
- 同步状态：使用volatile修饰的int变量state，表示同步状态，通过cas操作保证原子性修改。
- 等待队列：基于clh队列的变种，管理等待获取同步状态的线程。每个节点都包含一个线程引用，以及一个next指针，用于形成等待队列。
- 模版方法：定义了获取和释放同步状态的标准流程，子类实现具体逻辑。

### AQS设计思想
AQS的设计基于模板方法模式，它定义了同步器的骨架，而具体的同步语义由子类来实现。这种设计使得不同类型的同步器可以复用AQS的基础设施。

```java
//aqs提供的模版方法
public final void acquire(int arg){
    if(!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE),arg)){
        selfInterrupt()
    } 
}
//需要子类实现的方法
protected boolean tryAcquire(int arg){

}
//共享模板的获取
public final void acquireShared(int arg){
    if(tryAcquireShared(arg) < 0){
        doAcquireShared(arg);
    }
}
//子类需要实现的共享获取方法
protected int tryAcquireShared(int arg){
    throw new UnsupportedOperationException();
}
```
设计原则
- 状态管理：使用单一的state变量表示同步状态
- 队列管理：维护一个fifo的等待队列
- 公平性：支持公平和非公平两种模式
- 可扩展性：通过模板方法模式支持不同的同步语义
- 高性能：使用cas操作避免锁竞争

### 同步状态管理
AQS使用volatile修饰的int变量state，表示同步状态，保证可见性，通过cas操作保证原子性修改。同步状态的获取和释放逻辑由子类实现，子类需要实现tryAcquire和tryRelease方法。这个状态的定义也完全由子类定义，如ReentrantLock的state变量表示锁的重入次数（锁的拥有者线程ID），CountDownLatch的state变量表示计数器的值。

```java
//获取当前同步状态
protected final int getState(){
    return state;
}
//设置当前同步状态
protected final void setState(int newState){

}
//CAS设置当前同步状态(保证可见性)
protected final boolean compareAndSetState(int expect, int update){
    return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
//示例：ReentrantLock的state变量表示锁的重入次数，tryAcquire方法尝试将state从0设置为1，成功则表示获取到锁，失败则表示锁已被其他线程占用。
protected final boolean tryAcquire(int arg){
    final Thread current = Thread.currentThread();
    int c = getState();
    if(c == 0){
        if(! hasQueuedPredecessors() && compareAndSetState(0, arg)){
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if(current == getExclusiveOwnerThread()){
        int nextc = c + arg;
        if(nextc < 0){
            throw new Error("Maximum lock count exceeded");
        }
        setState(nextc);
        return true;
    }
    return false;
}
```
### 等待队列机制

AQS维护了一个FIFO的双向链表作为等待队列，当线程获取同步状态失败时，会被包装成Node节点加入到队列尾部，并阻塞等待。

```java
//Node节点结构
static final class Node{
    //共享模式标记
    static final Node SHARED = new Node();
    //独占模式标记
    static final Node EXCLUSIVE = null;
    //节点状态常量
    static final int CANCELLED =  1;//节点已取消
    static final int SIGNAL    = -1;//后继节点需要唤醒
    static final int CONDITION = -2;//节点在条件队列中
    static final int PROPAGATE = -3;//共享模式下需要传播
    volatile int waitStatus;//节点状态
    volatile Node prev;//前一个节点
    volatile Node next;//后一个节点
    volatile Thread thread;//节点对应的线程
    Node nextWaiter;//条件队列中的下一个节点
}
```
队列操作
- 入队操作：线程同步状态失败时，会被包装为Node节点，通过cas操作加入到队列尾部，并阻塞等待。
- 唤醒机制：当同步状态被释放时，会唤醒队列中的头节点，头节点获取成功后会唤醒后继节点。
- 取消机制：支持中断和超时，被取消的节点会被从队列中移除。

### 独占锁和共享锁
- 独占锁：一次只能有一个线程获取锁（即获取同步状态），其他线程必须等待。（如ReentrantLock，同一时刻只有一个线程能获取锁。具有排他性）
- 共享锁：多个线程可以同时获取锁（即获取同步状态），适用于读操作。（如Semaphore\CountDownLatch，多个线程可以同时获取同步状态）

### 自定义同步器
- 状态定义：明确state变量的含义，0表示未锁定，1表示锁定
- 原子操作：使用compareAndSetState确保状态修改的原子性
- 线程记录：记录当前持有锁的线程，支持重入检查
- 异常处理：在不合法的状态下抛出合适的异常
- 条件支持：可选择性地支持条件变量

### 优化建议
- 减少竞争：合理设计锁的粒度，避免不必要的锁竞争，考虑使用读写锁分离读写操作
- 公平性权衡：根据应用场景选择公平锁或者非公平锁，公平锁会按照线程入队顺序来获取锁，非公平锁则可能会跳过队列中的其他线程直接获取锁，非公平锁在高并发场景下性能更好。
- 超时机制：合理使用带超时的获取方法，避免线程无限期等待。
- 优先使用juc包提供的同步器，而不是自己实现
- 理解不同同步器的适用场景和性能特点
- 在自定义同步器时，仔细考虑状态的定义和转换
- 充分测试并发场景下的正确性和性能。





