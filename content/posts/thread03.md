---
title: "线程池-线程池技术"
date: 2021-01-25T14:44:13+08:00
draft: false
description: "线程池技术：线程池基础、ThreadPoolExecutor详解、Executors框架、定时任务线程池。"
tags: ["线程池", "线程池技术"]
categories: [ThreadPool]
---
线程池技术：线程池基础、ThreadPoolExecutor详解、Executors框架、定时任务线程池。

## 线程池基础
### 线程池的概念
线程池是一种多线程处理形式，它预先创建若干个线程，这些线程在没有任务处理时处于等待状态，当有任务来临时就分配给其中的一个线程来处理，任务处理完成后线程并不会被销毁，而是继续等待下一个任务。

> 线程池的本质是对线程资源的复用和管理，通过预创建线程、任务队列和调度机制来提高系统性能和资源利用率。

为什么需要线程池
- 资源复用：线程池预先创建了多个线程，避免了频繁创建和销毁线程的开销，提高了系统的响应速度和资源利用率。
- 任务队列管理：线程池维护了一个任务队列，用于存储待处理的任务，避免了任务丢失和系统过载的风险。
- 响应速度：任务到达时可以立即执行，无需等待创建线程。
- 线程管理：线程池可以对线程进行统一管理，包括线程的创建、销毁、调度等，简化了线程的使用和维护。

### 线程池优势
性能优势
- 减少创建销毁开销：线程的创建和销毁需要系统调用，开销较大。
- 提高响应速度：任务到达时无需等待线程创建。
- 减少内存占用：控制线程数量，避免过多线程占用内存；
- 减少上下文切换：合理的线程数量减少cpu上下文切换。

管理优势
- 资源控制：限制并发线程数量，防止资源耗尽
- 任务调度：支持延迟执行、定时执行等调度策略
- 状态监控：提供线程池状态和任务执行情况等监控
- 异常处理：统一的异常处理机制
- 优雅关闭：支持优雅的关闭和资源清理。

### 线程池架构
#### 核心组件
- 工作线程：
  - 核心线程：始终保持活跃的线程
  - 非核心线程：根据需要创建的临时线程
  - 线程工厂：负责创建新线程
- 任务队列：
  - 阻塞队列：存储待执行的任务
  - 队列类型：有界队列、无界队列
  - 队列策略：fifo、lifo、优先级队列
- 拒绝策略：当任务队列已满时，拒绝策略决定如何处理新任务
  - AbortPolicy: 直接抛出RejectedExecutionException异常
  - CallerRunsPolicy：调用者执行
  - DiscardPolicy：直接丢弃任务
  - DiscardOldestPolicy：丢弃队列最旧的任务

#### 工作流程
```java
//ThreadPoolExecutor的核心参数
ThreadPoolExecutor executor = 
new ThreadPoolExecutor(
    corePoolSize, //核心线程数
    maximumPoolSize, //最大线程数
    keepAliveTime, //线程空闲时间
    TimeUnit.SECONDS, //时间单位
    workQueue, //任务队列
    threadFactory, //线程工厂
    handler //拒绝策略
)
```
线程池工作流程：
1. 任务提交到线程池
2. 如果核心线程数未满，创建新的核心线程执行任务
3. 如果核心线程数已满，将任务加入任务队列
4. 如果队列已满且未达到最大线程数，创建非核心线程执行任务
5. 如果达到最大线程数，执行拒绝策略。

### 线程池类型
- FixedThreadPool：创建固定数量的线程池，适用于任务数量已知。负载较重的服务器。
- CachedThreadPool：可缓存的线程池，线程数可以动态调整。适用于任务数量未知，且任务执行时间短的情况，负载较轻的服务器。
- SingleThreadExecutor：创建单个线程的线程池，适用于任务需要顺序执行的场景。

线程池对比
- cpu密集型任务：线程数 = cpu核数 + 1
- io密集型任务：线程数 = cpu核数 * 2
- 混合型任务：线程数 根据实际情况调优
- 建议：使用ThreadPoolExecutor，根据实际情况调整线程数和队列大小。

### 生命周期管理
线程池状态
- running：运行中，接受新任务并处理队列中的任务
- shutdown：不接受新任务，但会处理队列中的任务
- stop：不接受新任务，不处理队列中的任务，中断正在执行的任务。

注意⚠️
- 及时关闭：应用程序结束时必须关闭线程池
- 优雅关闭：优先使用shutdown方法，如果无法关闭，则使用shutdownNow方法
- 超时处理：设置合理的等待超时时间
- 异常处理：处理关闭过程中可能出现的异常。

## ThreadPoolExecutor详解
### ThreadPoolExecutor工作原理
ThreadPoolExecutor是java并发包中最核心的线程池实现类，它提供了完整的线程池功能，包括线程的创建、管理、任务调度和资源回收。

通过维护一个工作线程池和一个任务队列，实现了任务的异步执行和线程的复用，从而提高了系统的性能和资源利用。

#### 内部结构组成
- 工作线程池：用于执行任务的线程池，包含核心线程和非核心线程，维护一组工作线程，负责执行提交的任务。线程数量根据配置参数动态调整。
- 任务队列：用于存储待执行的任务，当所有核心线程都在忙碌时，新任务会被放入队列等待；当工作队列为空时，工作线程会从队列中获取任务。
- 线程工厂：创建新线程的工厂，默认使用Executors.defaultThreadFactory()，可以自定义线程的名称、优先级等属性。
- 拒绝策略：当任务队列已满时，拒绝策略决定如何处理新任务，默认使用AbortPolicy策略，直接抛出RejectedExecutionException异常。
#### 任务执行流程
1. 提交任务：用户调用submit()方法提交任务，任务会被添加到任务队列中。
2. 任务调度：工作线程从任务队列中获取任务，执行任务。
3. 线程复用：执行完成任务后，线程会被复用，继续执行下一个任务。
4. 线程管理：线程池根据配置参数动态调整线程数量，保持线程池的效率和性能。
5. 线程回收：空闲线程超过keepAliveTime时间，会被回收。
6. 关闭线程池：调用shutdown()方法关闭线程池，等待所有任务执行完成；调用shutdownNow()方法立即关闭线程池，中断正在执行的任务。
7. 线程异常处理：线程执行过程中可能产生异常，可以通过设置线程工厂或者拒绝策略来处理异常。
8. 线程资源回收：线程池关闭后，线程会被回收，释放资源。
9. 线程状态管理：线程池提供了线程的状态管理，可以查看线程池的当前状态，如线程数量、任务数量等。
10. 线程池监控：可以通过监控工具来监控线程池的运行状态，如线程数量、任务数量、队列长度等。
11. 线程池参数调整：根据实际情况调整线程池的参数，如核心线程数、最大线程数、队列大小等，以优化线程池的性能和资源利用。
12. 线程池参数校验：在创建线程池时，需要校验参数的合法性，避免参数错误导致线程池运行异常。

### 线程池核心参数详解
- corePoolSize：核心线程数，默认情况下，核心线程会一直存活，即使没有任务需要执行。
- maximumPoolSize：最大线程数，当核心线程数达到上限时，多余的任务会被放入队列，等待执行。
- keepAliveTime：线程空闲时间，当线程空闲时间达到keepAliveTime时，线程会自动终止。默认值为60秒。（只对超过corePoolSize的线程生效）
- unit ：TimeUnit，时间单位，默认值为秒。
- workQueue：任务队列，用于存储待执行的任务。默认使用LinkedBlockingQueue队列。（当使用无界队列时，maximumPoolSize参数会被忽略）
- threadFactory：线程工厂，用于创建新线程。默认使用Executors.defaultThreadFactory()。
- handler：拒绝策略，当任务队列已满时，拒绝策略决定如何处理新任务。默认使用AbortPolicy策略。

### 任务队列选择策略
1. ArrayBlockingQueue：有界阻塞队列，基于数组实现，容量固定，任务队列的大小受限于队列容量；支持公平和非公平访问；适用于资源有限的场景。
2. LinkedBlockingQueue：可选有界阻塞队列，基于链表实现，可以指定容量；默认容量为Integer.MAX_VALUE，适用于任务数量未知的场景。
3. SynchronousQueue：同步队列，不存储元素，直接传递；每个插入操作必须等待移除操作；适用于任务处理速度快的场景。
4. PriorityBlockingQueue：优先级阻塞队列，基于优先级堆实现，支持优先级排序，无界队列；元素必须实现Comparable接口；适用于需要根据优先级处理任务的场景。

- cpu密集型任务：使用SynchronousQueue或者小容量的ArrayBlockingQueue
- io密集型任务：使用LinkedBlockingQueue,容量根据内存情况设定
- 有优先级要求：使用PriorityBlockingQueue队列
- 资源受限环境：使用ArrayBlockingQueue队列，设置合适的队列容量，避免队列溢出，控制内存使用。

### 拒绝策略详解
当线程池无法处理新提交的任务时（线程池关闭或者达到最大容量时），就会触发拒绝策略。
1. AbortPolicy：直接抛出RejectedExecutionException异常，拒绝新任务。适用于关键任务，不允许任务丢失的场景。
2. CallerRunsPolicy：由提交任务的线程直接执行任务，而不是将任务放入队列。提供了简单的反馈机制，能过减缓新任务的提交速度。
3. DiscardPolicy：直接丢弃新任务，不做任何处理。适用于允许任务丢失的场景，如日志记录，统计分析等。
4. DiscardOldestPolicy：丢弃队列中最旧的任务，将新任务放入队列。适用于任务有时效期的场景。

### 自定义线程池最佳实践

ThreadPoolExecutor提供的监控和钩子方法：
- beforeExecute：在执行任务前调用，可用于记录日志、初始化任务等。
- afterExecute：在执行任务后调用，可用于记录日志、释放资源等。
- terminated：在线程池关闭后调用，可用于清理资源等。    

最佳实践
- 避免使用Executors创建线程池，应该手动创建ThreadPoolExecutor实例，以避免默认配置的问题。
- 根据任务类型选择合适的队列：根据任务的性质选择合适的任务队列，如cpu密集型任务使用SynchronousQueue，io密集型任务使用LinkedBlockingQueue等。
- 合理设置线程池参数：根据任务的性质和系统资源情况，合理设置线程池的参数，如核心线程数、最大线程数、队列容量等，避免资源浪费、线程池饱和或系统过载。
- 自定义线程工厂：根据需求自定义线程工厂，如设置线程名称（为线程池设置有意义的名称，便于问题排查）、优先级等。
- 自定义拒绝策略：根据需求自定义拒绝策略，如记录日志、报警通知等。
- 监控线程池状态：使用监控工具监控线程池的状态，如线程数量、任务数量、队列长度等，及时发现异常情况。
- 在应用关闭时正确关闭线程池。


## Executors框架
### Executors工具类概述
Executors是java并发包中的一个工具类，提供了创建各种类型线程池的便捷方法。它采用工厂模式，封装了ThreadPoolExecutor的复杂配置，让开发者能快速创建适合不同场景的线程池。

> 生产环境建议根据具体需求手动配置ThreadPoolExecutor，而不是使用Executors工具类。

主要功能
- 线程池创建：提供了创建不同类型线程池的方法，如newFixedThreadPool、newCachedThreadPool、newSingleThreadExecutor等。
- 调度服务：支持定期和周期性任务执行的调度线程池。
- 线程工厂：提供默认的线程工厂实现，支持自定义线程创建逻辑。

### 预定义线程池类型
Executors工具类提供了一些预定义的线程池，如newFixedThreadPool、newCachedThreadPool、newSingleThreadExecutor等。这些线程池适用于不同的场景，开发者可以根据具体需求选择合适的线程池。
- newFixedThreadPool：固定大小的线程池，线程数固定；使用LinkedBlockingQueue无界队列，理论上可以无限排队；适用于负载均匀，需要控制并发线程数的场景。但队列可能无限增长，导致内存溢出。
- newCachedThreadPool：缓存线程池，线程数根据任务量动态调整，空闲线程会被回收；使用SynchronousQueue同步队列，不存储任务；适用于大量短期异步任务的场景。线程数量可能无限增长，需要控制任务提交速度。
- newSingleThreadExecutor：单线程线程池，只有一个线程执行任务，任务按照提交顺序依次执行；适用于需要按顺序执行任务的场景。如果线程异常终止，会创建新线程继续执行。
- newScheduledThreadPool：定时任务线程池，支持定期和周期性任务执行；固定线程数（核心线程数固定，最大线程数无限）；使用DelayedWorkQueue延迟队列，适用于需要定时执行任务的场景。基于时间轮算法，支持高精度定时。


### Future和Callable
Future和Callable是java并发包中的两个接口，用于表示异步计算的结果。
- Future接口：表示异步计算的结果，提供了获取计算结果、取消任务、查询任务是否完成等方法。
  - get()：获取任务执行结果，阻塞直到任务完成。
  - get(long timeout, TimeUnit unit)：获取任务执行结果，阻塞直到任务完成或超时。
  - cancel(true):中断执行。
  - cancel(false)：不中断执行。
  - isCancelled()：判断任务是否被取消。
  - isDone()：判断任务是否完成。
```java
public class BatchTaskExample{
    public static void main(String[] args) throws Exception{
        ExecutorService executorService = Executors.newFixedThreadPool(5);
        //创建多个任务
        List<Future<String>> futures = Arrays.asList(
            () -> {Thread.sleep(1000); return "Task 1";},
            () -> {Thread.sleep(2000); return "Task 2";},
            () -> {Thread.sleep(3000); return "Task 3";}
        );
        //方式1:invokeAll等待所有任务完成
        List<Future<String>> futures = executorService.invokeAll(futures);
        for(Future<String> future : futures){
            System.out.println(future.get());
        }
        //方式2:invokeAny等待任意任务完成
        String result = executorService.invokeAny(futures);
        System.out.println("invokeAny result: " + result);
        executorService.shutdown();
    }
}
```
- Callable：表示一个可调用的任务，与Runnable类似，但可以返回结果，并且可以抛出异常。
```java
public static void main(String[] args) throws Exception{
        ExecutorService executor = Executors.newScheduledThreadPool(5);
        //创建Callable任务
        Callable task = () -> {
             Thread.sleep(2000);//模拟耗时操作
            return new Random().nextInt(100);
        };
        //提交任务并获取Future对象
        Future<Integer> future = executor.submit(task);
        //执行其他操作
        System.out.println("Other operations...");
        //等待任务完成并获取结果
        Integer result = future.get();
        System.out.println("Task result: " + result);

        executorService.shutdown();
    }
```
### CompletionService
CompletionService结合了Executor和BlockingQueue的功能，能够按照任务完成的顺序获取任务的结果。适用于处理批量异步任务。

实际应用场景
- 搜索聚合：从多个数据源搜索数据，按照返回速度展示结果，提升用户体验。
- 文件下载：并行下载多个文件，按完成顺序处理下载结果。
- 数据处理：批量处理数据，按处理完成顺序进行后续操作。

### ExecutorService最佳实践

- 资源管理
> ExecutorService必须正确关闭，否则可能会导致应用程序无法正常退出。
- 异常处理

性能优化建议
- 线程池大小
- 队列选择
  - ArrayBlockingQueue：有界数组队列（防止内存溢出），适用于固定线程数的场景。
  - LinkedBlockingQueue：可选有界链表队列，适用于线程数动态调整的场景，性能较好。
  - SynchronousQueue：同步队列，不存储任务，适用于直接将任务传递给线程的场景，缓存线程池。
  - PriorityBlockingQueue：优先队列，适用于需要按优先级执行任务的场景。
- 监控指标
  - 线程池大小
  - 活跃线程数
  - 队列长度
  - 任务完成数
  - 拒绝任务数

## 定时任务线程池
### ScheduledThreadPoolExecutor概述
ScheduledThreadPoolExecutor支持多线程执行定时任务，避免了Timer单线程的局限性，提供了更好的并发性能和异常处理能力。

主要优势
- 多线程支持：支持多个线程同时执行定时任务，避免任务阻塞影响其他任务执行。
- 异常隔离：单个任务的异常不会影响其他任务的执行，提供更好的稳定性。
- 精确调度：提供更精确的时间调度机制，支持多种调度策略。

创建ScheduledThreadPoolExecutor
```java
//直接创建
ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(5);
//通过Executors工厂方法创建
ScheduledThreadPoolExecutor executor = (ScheduledThreadPoolExecutor) Executors.newScheduledThreadPool(5);
//单线程定时任务执行器
ScheduledExecutorService singleScheduled = Executors.newSingleThreadScheduledExecutor();
```

### 定时任务类型
#### 延迟执行任务
schedule方法用于在指定延迟后执行一次任务。
```java
//延迟1秒执行任务
executor.schedule(task, 1, TimeUnit.SECONDS);
```
#### 固定频率执行
scheduleAtFixedRate方法用于按照固定频率执行任务，即每次任务执行完成后，等待指定时间后再次执行。（不管上次任务是否完成）如果任务执行时间超过了间隔时间，下次任务会立即执行。
```java
//初始延迟1秒，后续每2秒执行一次任务
executor.scheduleAtFixedRate(task, 1, 2, TimeUnit.SECONDS);
```
#### 固定延迟执行
scheduleWithFixedDelay方法用于按照固定延迟执行任务，即每次任务执行完成后，等待指定时间后再次执行。确保任务之间有固定的间隔时间。
```java
//初始延迟1秒，后续延迟2秒再执行下一次任务
executor.scheduleWithFixedDelay(task, 1, 2, TimeUnit.SECONDS);
```
### 调度机制
ScheduledThreadPoolExecutor的调度机制基于延迟队列（DelayedQueue）和线程池（ThreadPoolExecutor）的组合实现。内部使用DelayedQueue来存储待执行的任务，每个任务都有一个延迟时间。当任务的延迟时间到了，就会被线程池中的线程执行。通过ScheduledFutureTask来包装任务并计算执行时间。

#### 内部实现原理
- DelayQueue: 用于存储待执行的任务，根据执行时间进行排序，确保最早执行的任务再队列头部。
- ScheduledFutureTask: 用于包装原始任务，添加执行时间、周期等信息，实现Delayed接口支持延迟队列。
- 周期任务处理：周期性任务执行完成后会重新计算下次执行时间并重新加入队列。

#### 时间精度考虑
- ScheduledThreadPoolExecutor的时间精度依赖于系统时钟。
- 在高负载情况下，任务可能会有轻微的延迟
- 对于需要高精度定时的场景，需要考虑其他解决方案。

### 异常处理
定时任务中的异常处理非常重要，未捕获的异常会导致周期性任务停止执行。

### 实际应用场景
- 数据清理任务
- 监控检查任务
- 定期报告生成
### 最佳实践
线程池配置
- 核心线程数：根据定时任务的数量和执行频率合理设置
- 线程命名：使用有意义的线程名称便于问题排查
- 异常处理：确保所有任务都有适当的异常处理机制
- 资源清理：应用关闭时正确关闭线程池。

性能优化：
- 避免长时间运行的任务：将长任务拆解成多个短任务
- 合理设置执行频率：避免过于频繁的任务执行
- 监控任务执行：记录任务执行时间和成功率
- 使用合适的时间单位：选择合适的TimeUnit提高精度

注意事项
- 周期性任务中的未捕获异常会导致任务停止执行
- scheduleAtFixedRate可能导致任务堆积，需要监控任务执行时间
- 应用关闭时需要正确关闭线程池，避免资源泄漏
- 对于需要高精度定时的场景，考虑使用专门的定时框架。


