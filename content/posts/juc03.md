---
title: "并发编程-线程管理"
date: 2021-01-20T14:40:00+08:00
draft: false
description: "并发编程线程管理：线程池、Executor工具类、Future和CompletableFuture、并发集合。"
tags: ["JUC", "并发编程", "线程管理"]
categories: ["JUC"]
---
并发编程线程管理：线程池、Executor工具类、Future和CompletableFuture、并发集合。
## 线程池
### 线程池原理
线程池是一种线程使用模式，它预先创建一定数量的线程，并将这些线程放入池中进行管理。当有任务需要执行时，从池中取出空闲线程来执行任务，任务完成后线程返回池中等待下一次使用。

> 为什么需要线程池：
> 线程池的创建和销毁开销较大，频繁创建销毁线程会消耗大量系统资源。线程池通过复用线程，避免了这种开销，同时提供了更好的线程管理和控制能力。因此，线程池创建后，一般需要一直运行，除非遇到异常。

线程池的工作原理：
1. 创建线程池：创建线程池需要指定核心线程数、最大线程数、线程空闲时间、任务队列大小、线程工厂、拒绝策略。
2. 提交任务：将任务提交给线程池执行。
3. 线程分配：线程池根据策略分配线程执行任务
4. 线程池运行（任务执行）：线程池开始运行，从任务队列中取出任务并执行。如果核心线程数未达到最大线程数，且任务队列未满，会创建新线程来执行任务。如果核心线程数已达最大线程数，且任务队列未满，会将任务放入任务队列等待执行。如果任务队列已满，会根据拒绝策略来处理任务。
5. 线程回收：线程执行完成后，会返回线程池进行回收，等待下次使用。
6. 池管理：根据负载情况调整线程数量。
### ThreadPoolExecutor详解
线程池的实现类为ThreadPoolExecutor，线程池的创建需要指定核心线程数、最大线程数、线程空闲时间、任务队列大小、线程工厂、拒绝策略。
```java
//核心参数
public ThreadPoolExecutor(int corePoolSize,//线程池核心线程数
                          int maximumPoolSize,//线程池最大线程数
                          long keepAliveTime,//空闲线程的存活时间
                          TimeUnit unit,//时间单位
                          BlockingQueue<Runnable> workQueue,//任务队列
                          ThreadFactory threadFactory,//线程工厂
                          RejectedExecutionHandler handler)//拒绝策略
```
工作流程
步骤1: 如果当前线程数 < corePoolSize，则创建新线程执行任务。
步骤2: 如果当前线程数 >= corePoolSize，则将任务放入workQueue。
步骤3:如果队列已满且当前线程数 < maximumPoolSize，则创建新线程执行任务。
步骤4：如果队列已满且当前线程数 >= maximumPoolSize，则执行拒绝策略。

### 核心参数配置
合理配置线程池参数是保证系统性能的关键。

- cpu密集型任务
  - corePoolSize = cpu核数 + 1;
  - maximumPoolSize = cpu核数 + 1;
  - 使用SynchronousQueue作为任务队列。(直接提交任务到工作线程，不保持它们在队列中)
- io密集型任务
  - corePoolSize = cpu核数 * 2;
  - maximumPoolSize = cpu核数 * 2;
  - 使用LinkedBlockingQueue作为任务队列。(存放任务的队列，任务队列的容量为Integer.MAX_VALUE，无界队列)
- cpu和io混合任务
  - 根据任务特性动态调整
  - 监控系统负载进行优化
  - 使用ArrayBlockingQueue作为任务队列。（存放任务的队列，任务队列的容量为100，有界队列）
### 拒绝策略
线程池的拒绝策略有四种：
- AbortPolicy：默认策略，抛出RejectedExecutionException异常。
- CallerRunsPolicy：调用者运行策略，如果当前线程没有可用的，则直接在调用者所在线程中运行被拒绝的任务，减缓新任务提交的速度。
- DiscardPolicy：丢弃策略，如果任务队列已满，则丢弃新任务，不抛出异常。
- DiscardOldestPolicy：丢弃最旧策略，如果任务队列已满，则丢弃队列中最旧的任务，尝试放入新任务。

自定义拒绝策略
```java
public class MyRejectedExecutionHandler implements RejectedExecutionHandler {
    @Override
    public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
        //自定义拒绝策略
        System.out.println("任务被拒绝：" + r.toString());
    }
}
```
### 线程池监控与优化
- 线程池数指标
  - 当前线程数: getPoolSize()
  - 活跃线程数：getActiveCount()
  - 最大线程数：getMaximumPoolSize()
- 线程池任务指标
  - 已完成任务数：getCompletedTaskCount()
  - 已提交任务数（总任务数）：getTaskCount()
  - 队列大小：getQueue().size()
- 性能指标：
  - 任务执行时间：
  - 任务等待时间
  - 线程利用率
> 调优建议
- 合理设置核心线程数：根据cpu核心数和任务类型确定
- 选择合适的队列：根据任务类型选择合适的队列和大小
- 设置合理的拒绝策略：根据任务类型选择合适的拒绝策略
- 定期监控和调整：根据监控数据动态调整参数
- 避免无界队列：防止内存溢出

## Executors工具类
Executors是java并发包中的一个工具类，提供了一系列静态工厂方法来创建不同类型的线程池。采用工厂方法模式，创建线程池：如newFixedThreadPool()、newCachedThreadPool()、newSingleThreadExecutor()等。
> 注意：Executors创建的线程池默认是无界队列，可能会导致内存溢出。在生产环境中建议使用ThreadPoolExecutor创建线程池，以获得更好的控制力。


工厂方法模式优势
- 简单易用：通过简单的工厂方法创建线程池，不需要手动创建线程池，避免了线程创建和销毁的开销。
- 最佳实践：内置了经过经验验证的线程池参数，可以满足大多数场景。
- 代码简化：使用工厂方法创建线程池，避免了手动配置线程池参数的复杂性。

但阿里巴巴java开发手册建议避免使用Executors创建线程池，而是使用ThreadPoolExecutor创建线程池。
- 资源控制：某些方法创建的线程池，如newCachedThreadPool()，最大线程数为Integer.MAX_VALUE，可能会创建大量线程，导致系统资源耗尽。导致oom。
- 参数透明：隐藏了重要的配置参数，不利于性能调优。
- 监控困难：缺少自定义的线程命名和监控机制
- 异常处理：默认的异常处理策略困难不符合业务需求。

### FixedThreadPool
FixedThreadPool创建的线程池，线程数固定，任务队列无界。

- 线程数固定：线程数固定;
- 任务队列无界：**无界队列，任务队列无界，可能会导致内存溢出**。
- 线程复用：线程会被重复使用，减少了线程创建和销毁的开销。

适用场景：
- CPU密集型任务：适合创建固定大小线程池，任务数少，且任务执行时间短。
- 负载可观测性：任务数量相对稳定的场景
- 资源控制：需要严格控制并发线程数量的场景
- 长期运行：适合长期运行的服务
> 任务队列无界，可能会导致内存溢出。
### CachedThreadPool
CachedThreadPool创建的线程池，可缓存，线程数量会根据需要动态调整，空闲线程会被缓存60s，超时会被回收。

- 弹性扩展：根据任务数量动态创建线程，理论上没有上限；
- 自动回收：空闲线程60s后会被回收，减少了线程数量。
- 快速响应：新任务能得到快速执行，适合突发性负载。

适用场景：
- IO密集型任务：大量io操作，线程经常阻塞。适合创建缓存线程池，任务数多，且任务执行时间长。
- 短期任务：适合执行短期任务，如HTTP请求、数据库查询等。
- 突发性负载：适合处理突发性负载，如秒杀、大促等。
- 快速响应：对响应时间要求较高的场景。

> 高并发场景下创建大量线程，可能会导致资源耗尽，从而导致oom。
### ScheduledThreadPool
ScheduledThreadPool创建的线程池，用于执行定时任务和周期性任务，支持延迟执行和固定频率执行。
```java
//创建定时任务线程池
ScheduledExecutorService scheduler  = Executors.newScheduledThreadPool(3);
//延迟执行任务 
scheduler.schedule(() -> {
    System.out.println("延迟3秒后执行任务");
}, 3, TimeUnit.SECONDS);
//固定频率执行任务
scheduler.scheduleAtFixedRate(() -> {
    System.out.println("每1秒执行任务");
}, 0, 1, TimeUnit.SECONDS);
//固定延时执行任务
scheduler.scheduleWithFixedDelay(() -> {
    System.out.println("上次任务完成后延迟2秒执行任务");
}, 0, 2, TimeUnit.SECONDS);
scheduler.shutdown();
```
### 自定义线程池
自定义线程池，需要使用ThreadPoolExecutor类，手动配置线程池参数。
```java
//自定义线程池
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    2, //核心线程数
    4, //最大线程数
    60, //线程空闲时间
    TimeUnit.SECONDS, //线程空闲时间单位
    new ArrayBlockingQueue<>(2), //任务队列
    new ThreadFactoryBuilder().setNameFormat("custom-thread-%d").build(), //线程工厂
    new CustomRejectedExecutionHandler() //拒绝策略
);
//自定义线程工厂

//自定义拒绝策略
```

## Future和CompletableFuture
Future和CompletableFuture是java并发包中提供的一种异步编程模型，用于处理异步任务。
### Future接口详解
Future接口是java并发编程中处理异步计算结果的核心接口。它代表一个异步计算的结果，提供了检查计算是否完成、等待计算完成和获取计算结果等方法。

主要方法
- get():阻塞等待任务完成并返回结果，如果任务执行异常则抛出ExecutionException。
- get(long timeout, TimeUnit unit):阻塞等待任务完成并返回结果，如果任务执行异常则抛出ExecutionException，如果超时则抛出TimeoutException。
- isDone():检查任务是否完成（无论是正常完成、异常结束还是被取消）。
- cancel(boolean mayInterruptIfRunning):取消任务。
  - mayInterruptIfRunning:如果为true，则尝试中断正在执行的任务线程；如果为false，则仅取消任务，不中断线程。
  
```java
import java.util.concurrent.*;
public class FutureDemo { 
    public static void main(String[] args) throws InterruptedException, ExecutionException, TimeoutException {
        //创建线程池
        ExecutorService executor = Executors.newFixedThreadPool(2);
        //提交任务
        Future<String> future = executor.submit(() -> {
            Thread.sleep(2000);
            return "异步任务执行完成";
        });
        //等待任务完成并获取结果
        System.out.println("等待任务完成...");
        //检查任务是否完成
        if(!future.isDone()){
            System.out.println("任务还在执行中");
        }
        //获取任务结果
        String result = future.get(3, TimeUnit.SECONDS);
        System.out.println("任务完成，结果为：" + result);
        //关闭线程池
        executor.shutdown();
    }
}
```
### FutureTask类
FutureTask类是Future接口的实现类，同时也实现了Runnable接口。可以包装Runnable和Callable任务，用于异步执行。

特点
- 双重身份：FutureTask可以作为Runnable提交给线程池执行，也可以作为Future获取任务结果。
- 状态管理：FutureTask内部维护了任务的状态，包括新建、运行、完成、取消等状态。
- 结果缓存：FutureTask在任务完成后，会缓存任务的执行结果。如果任务已经完成，再次调用get()方法会立即返回结果，而不会阻塞。
- 异常处理：FutureTask在任务执行过程中，会捕获异常并保存在FutureTask对象中。可以通过get()方法获取异常信息。

```java
import java.util.concurrent.*;
public class FutureTaskDemo {
    public static void main(String[] args) throws InterruptedException, ExecutionException { 
        //创建FutureTask
        FutureTask<Integer> futureTask = new FutureTask<>(() -> {
            System.out.println("开始执行任务...");
            Thread.sleep(2000);
            return 100;
        });
        //启动线程执行任务
        Thread thread = new Thread(futureTask);
        thread.start();
        //等待任务完成并获取结果
        System.out.println("主线程继续执行其他任务...");
        //获取计算结果
        Integer result = futureTask.get();
        System.out.println("任务完成，结果为：" + result);
    }
}
```

### CompletableFuture类
CompletableFuture类是java8中提供的一种用于处理异步任务的类，不仅实现了Future接口，还实现了一些额外的功能。如：链式调用、异常处理、组合任务等。

CompletableFuture类支持函数式编程风格，可以轻松构建复杂的异步处理流水线，避免了传统回调地狱的问题。

1. 创建CompletableFuture对象：CompletableFuture.supplyAsync()、CompletableFuture.runAsync()、CompletableFuture.completedFuture()
   - supplyAsync()：用于异步执行有返回值的任务，接受Supplier函数式接口，返回CompletableFuture对象。
   - runAsync()：用于异步执行无返回值的任务，接受Runnable函数式接口，返回CompletableFuture对象。
   - completedFuture()：用于创建已完成的CompletableFuture对象，直接返回指定结果。
```java
//创建有返回值的异步任务
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    try{
        Thread.sleep(2000);
    }catch (InterruptedException e){
        e.printStackTrace();
    }
    return "任务完成";
});
//创建无返回值的异步任务
CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
    System.out.println("开始执行异步任务...");
});
//创建已完成的CompletableFuture对象
CompletableFuture<String> future3 = CompletableFuture.completedFuture("已完成");

System.out.println(future1.get());
future2.get();//等待任务完成
System.out.println(future3.get());
```
### 链式调用和组合操作
CompletableFuture可以构建复杂的异步处理流水线，通过链式调用和组合操作，实现更复杂的异步处理逻辑。

常用链式方法：
- thenApply()：对结果进行转换，类似于Stream的map操作。
- thenAccept()：对结果进行消费但不返回新值，类似于Stream的forEach操作。
- thenCompose()：连接两个CompletableFuture对象，返回一个新的CompletableFuture对象，该对象在两个CompletableFuture对象都完成后才会执行，避免嵌套回调。
- thenCombine()：组合两个CompletableFuture对象，返回一个新的CompletableFuture对象，该对象在两个CompletableFuture对象都完成后才会执行，同时将两个结果合并。

```java
CompletableFuture<String> future = CompletableFuture
.supplyAsync(() -> "Hello")
.thenApply(s -> s + " World")
.thenApply(String::toUpperCase);
.thenCompose(s -> CompletableFuture.supplyAsync(() -> s + "!"));
System.out.println(future.get());//等待任务完成并获取结果HELLO WORLD!

//组合两个独立的Future对象
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");
CompletableFuture<String> combinedFuture = future1.thenCombine(future2, (s1, s2) -> s1 + " " + s2);
System.out.println(combinedFuture.get());//等待任务完成并获取结果Hello World
```
### 异常处理

CompletableFuture类提供完善的异常处理机制，可以优雅地处理异步操作中的异常情况。
- exceptionally()：当发生异常时提供默认值或者替代逻辑
- handle():同时处理正常结果和异常情况。
- whenComplete()：当任务完成时执行回调逻辑，无论成功与否。

```java
//使用exceptionally()处理异常
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() - >{
    if(Math.random() > 0.5){
        throw new RuntimeException("发生异常");
    }
    return "成功结果";
}).exceptionally(throwable -> {
    System.out.println("发生异常：" + throwable.getMessage());
    return "默认结果";
});
System.out.println(future1.get());
//使用handle()同时处理成功和异常
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() - >{
    throw new RuntimeException("发生异常");
}).handle((result, throwable) - >{
    if(throwable != null){
        return "处理异常：" + throwable.getMessage();
    }
    return "处理结果：" + result;
});
System.out.println(future2.get());
```
### 组合式异步编程
CompletableFuture提供了强大的组合功能，可以处理多个异步任务的协调和组合。
多任务组合方法
- allOf()：等待所有CompletableFuture完成，返回void类型的Future。
- anyOf()：等待任意一个CompletableFuture完成，返回第一个完成的CompletableFuture对象。

```java
//创建多个异步任务
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "任务1");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "任务2");
CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> "任务3");
//等待所有任务完成
CompletableFuture.allOf(future1, future2, future3).join();
System.out.println("所有任务完成");
//等待任意一个任务完成
CompletableFuture<String> completedFuture = CompletableFuture.anyOf(future1, future2, future3).join();
System.out.println("第一个完成的任务：" + completedFuture);
```
### 异步文件处理系统
```java
public class AsyncFileProcessor{
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public CompletableFuture<String> processFile(String fileNmae){
        return CompletableFuture
        .supplyAsync(() - > readFile(fileNmae), executor)
        .thenApply(this::validateContent)
        .thenApply(this::processContent)
        .thenCompose(this::saveToDatabase)
        .exceptionally(this::handleError);
    }
    public CompletableFuture<List<String>> processBatch(List<String> fileNames){
        List<CompletableFuture<String>> futures = fileNames.stream()
        .map(this::processFile)
        .collect(Collectors.toList());

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
        .thenApply(v - > futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList()));
    }
    private String readFile(String fileName){
        //读取文件内容的逻辑
        return "文件内容";
    }
    private String validateContent(String content){
        //验证文件内容的逻辑
        return content;
    }
    private String processContent(String content){
        //处理文件内容的逻辑
        return "处理后的内容";
    }
    private CompletableFuture<String> saveToDatabase(String processedContent){
        //将处理后的内容保存到数据库的逻辑
        return CompletableFuture.completedFuture("数据库保存成功");
    }
    private String handleError(Throwable throwable){
        //处理异常的逻辑
        System.out.println("发生异常：" + throwable.getMessage());
        return "处理异常";
    }
    public static void main(String[] args){
        AsyncFileProcessor processor = new AsyncFileProcessor();
        //处理单个文件
        CompletableFuture<String> future1 = processor.processFile("file1.txt");
        System.out.println(future1.get());
        //处理批量文件
        List<String> fileNames = Arrays.asList("file2.txt", "file3.txt");
        CompletableFuture<List<String>> future2 = processor.processBatch(fileNames);
        List<String> results = batchResult.get();
        results.forEach(System.out::println);
        processor.executor.shutdown();
    }
}
```
### 最佳实践
- 合理使用线程池：为CompletableFuture指定合适的线程池，避免使用默认的ForkJoinPool.
- 异常处理：始终为异步操作添加异常处理逻辑；
- 避免阻塞：尽量使用非阻塞的组合方法，避免在异步回调中调用get()；
- 资源管理：及时关闭自定义的线程池，避免资源泄漏
- 超时控制：为长时间运行的任务设置合理的超时时间。

- 内存泄漏：长时间运行的CompletableFuture可能导致内存泄漏
- 异常传播：未处理的异常会被包装在CompletionException中。
- 线程安全：CompletableFuture是线程安全的，可以在多个线程中并发使用，但是回调中的操作需要注意线程安全
- 性能考虑：过度使用异步可能导致上下文切换开销增大。


## 并发集合
### ConcurrentHashMap
它提供了线程安全的哈希表实现，相比于HashMap和Collections.synchronizedMap()，它在高并发场景下性能更好。

> 通过分段锁和cas操作实现高并发，在java8中进一步优化为node数组+链表/红黑树的结构。
- 分段锁：java7中使用segment数组，每个segment包含一个hashentry数组，只锁定操作的segment，提高并发度。
- cas操作：java8中大量使用cas操作替代锁，减少锁竞争，提高性能。
- 红黑树优化：当链表长度超过8时，会将链表转换为红黑树，提高查找效率。

### CopyOnWriteArrayList

它是一个线程安全的List实现，采用写时复制（Copy-On-Write）机制，在写入操作时会创建一个新的数组，避免了对原数组的修改，从而实现线程安全。适合读多写少的场景，如缓存、配置信息等。

工作原理

- 读操作：直接读取当前数组，无需加锁，性能极高；
- 写操作：复制整个数组，在新数组上进行修改，然后替换原数组。
- 一致性：保证读操作的一致性，但可能读到旧数据。
- 内存开销：写操作需要复制整个数组，内存开销较大。

### BlockingQueue
是一个支持阻塞操作的队列接口，当队列为空时获取操作会阻塞，直到队列有元素可用，当队列满时插入操作会阻塞。它是实现生产者消费者模式的理想选择。

主要方法
- add(e)：将元素插入队列尾部，如果队列已满则阻塞。
- offer(e)：将元素插入队列尾部，如果队列已满则返回false。
- put(e)：将元素插入队列尾部，如果队列已满则阻塞。
- remove()：移除并返回队列头部的元素，如果队列为空则阻塞。
- poll()：移除并返回队列头部的元素，如果队列为空则返回null。
- take()：移除并返回队列头部的元素，如果队列为空则阻塞。
- peek()：返回队列头部的元素，如果队列为空则返回null。

主要实现类
- ArrayBlockingQueue：基于数组实现的有界阻塞队列，按FIFO排序元素，支持公平和非公平。
- LinkedBlockingQueue：基于链表实现的有界阻塞队列，默认容量为Integer.MAX_VALUE。
- PriorityBlockingQueue：基于优先级堆实现的无界阻塞队列，按元素的自然顺序或自定义顺序排序。
- DelayQueue：基于优先级队列实现的延迟阻塞队列，元素只有在指定延迟时间后才可以被取出。
- SynchronousQueue：不存储元素的阻塞队列，每个插入操作必须等待另一个线程移除操作，反之亦然。
- LinkedTransferQueue：基于链表实现的无界阻塞队列，支持transfer方法，当队列不为空时，插入操作会直接将元素传递给消费者。
- LinkedBlockingDeque：基于链表实现的双端阻塞队列，支持在队列头和队列尾进行插入和移除操作。
### ConcurrentLinkedQueue
它是一个基于链表的无界非阻塞队列，使用cas操作实现线程安全，具有很高的并发性能。

> 使用无锁算法，避免了锁竞争，在高并发场景下性能优异，但不支持阻塞操作。

核心性能
- 无锁实现：使用cas操作保证线程安全
- 无界队列：理论上可以无限添加元素，但是实际内存占用会有限制。
- fifo顺序：先进先出的队列语义
- 弱一致性：迭代器具有弱一致性保证

### 性能对比
- 高并发读写：推荐ConcurrentHashMap(缓存、计数器、配置信息)
- 读多写少：推荐CopyOnWriteArrayList(监听器列表、配置信息)
- 生产者消费者模式：推荐ConcurrentLinkedQueue(任务队列、消息传递)
