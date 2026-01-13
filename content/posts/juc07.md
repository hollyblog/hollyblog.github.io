---
title: "Java异步编程模块深度解析"
date: 2022-01-01T00:23:32+08:00
draft: false
description: "Java异步编程模块深度解析：包括CompletableFuture、异步回调、异步流、异步异常处理、异步性能优化等。"
tags: ["多线程", "异步编程"]
categories: ["JUC"]
---


### **题目1: CompletableFuture与异步编程的最佳实践**
#### 原理层：CompletableFuture的设计哲学与实现机制
异步编程模型的核心是异步任务编排，CompletableFuture提供了丰富的异步操作方法和组合能力。

在深入CompletableFuture之前，先了解异步编程的两种主要模型：

- 回调（Callback）：异步方法调用时传入一个回调函数，当异步任务完成时调用该回调函数。缺点：多层回调导致回调地狱（Callback Hell）。

- Future：Java 5引入Future接口，代表一个异步计算的结果。但Future获取结果时会阻塞，且没有提供非阻塞的完成通知机制。

CompletableFuture实现了Future和CompletionStage接口，提供了丰富的异步操作方法和组合能力。
##### 1.1 CompletableFuture的核心架构

```java
public class CompletableFuture<T> 
    implements Future<T>, CompletionStage<T> {
    
    // ================ 核心状态变量 ================
    volatile Object result;       // 计算结果或AltResult（包含异常）
    volatile Completion stack;    // 依赖栈头节点
    
    // ================ 内部节点类型 ================
    abstract static class Completion extends ForkJoinTask<Void> 
        implements Runnable, AsynchronousCompletionTag {
        volatile Completion next;  // 链式依赖
        
        abstract void run();
        abstract boolean isLive();
    }
    
    // ================ 状态编码 ================
    static final class AltResult {
        final Throwable ex;  // 异常结果
        AltResult(Throwable x) { this.ex = x; }
    }
}
```

##### 1.2 依赖链与回调机制

![依赖链执行流程](img/juc07-1.png)

CompletableFuture的异步执行依赖于线程池（默认是ForkJoinPool.commonPool()，但可以指定自定义线程池）。

![依赖链与回调机制](img/juc07-2.png)


**依赖链的执行流程**
```java
public class CompletionChainExecution {
    
    // 当一个阶段完成时触发依赖的后续阶段
    final void postComplete() {
        CompletableFuture<?> f = this;
        Completion h;
        
        // 循环处理依赖栈中的所有Completion
        while ((h = f.stack) != null ||
               (f != this && (h = (f = this).stack) != null)) {
            CompletableFuture<?> d; Completion t;
            
            // CAS弹出栈顶节点
            if (f.casStack(h, t = h.next)) {
                if (t != null) {
                    // 如果栈中还有节点，尝试推进
                    if (f != this) {
                        pushStack(h);
                        continue;
                    }
                    h.next = null;  // 断开链接
                }
                f = (d = h.tryFire(NESTED)) == null ? this : d;
            }
        }
    }
    
    // 回调执行的两种模式
    void executionModes() {
        /*
        1. 同步执行（非Async后缀）：
           - 由前一个阶段的线程执行
           - 减少线程切换开销
           - 适合计算密集型小任务
        
        2. 异步执行（Async后缀）：
           - 提交到线程池执行
           - 可能发生线程切换
           - 适合IO密集型或耗时任务
        */
    }
}
```
##### 1.3 完成与触发机制

当一个CompletableFuture完成（正常完成或异常完成）时，会触发依赖此结果的所有后续动作。这些后续动作被封装成Completion对象，并以栈的形式存储（Treiber栈）。

##### 1.4 线程池与任务调度

```java
public class ThreadPoolIntegration {
    
    // 默认线程池：ForkJoinPool.commonPool()
    private static final Executor asyncPool = useCommonPool ?
        ForkJoinPool.commonPool() : new ThreadPerTaskExecutor();
    
    // 自定义线程池的最佳实践
    void customThreadPoolBestPractices() {
        /*
        1. CPU密集型任务：
           - 线程数 = CPU核心数 + 1
           - 使用有界队列
           
        2. IO密集型任务：
           - 线程数 = CPU核心数 * 2
           - 考虑使用缓存线程池
           
        3. 混合型任务：
           - 使用两个线程池分离处理
           - CPU密集型：固定大小线程池
           - IO密集型：可缓存线程池
        */
    }
    
    // 线程池配置示例
    ExecutorService createOptimizedThreadPool() {
        int coreCount = Runtime.getRuntime().availableProcessors();
        
        return new ThreadPoolExecutor(
            coreCount,                     // 核心线程数
            coreCount * 2,                 // 最大线程数
            60L, TimeUnit.SECONDS,         // 空闲线程存活时间
            new LinkedBlockingQueue<>(1000), // 有界队列
            new NamedThreadFactory("async-pool"), // 命名线程工厂
            new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
        );
    }
}
```

#### 场景层：CompletableFuture的最佳实践

##### 2.1 正例1：异步任务编排与组合

```java
public class AsyncTaskOrchestration {
    
    private final ExecutorService ioExecutor = Executors.newFixedThreadPool(10);
    private final ExecutorService cpuExecutor = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors()
    );
    
    // 场景1：并行调用多个服务并合并结果
    public CompletableFuture<UserProfile> getUserProfile(String userId) {
        // 并行执行三个异步任务
        CompletableFuture<UserInfo> userInfoFuture = 
            getUserInfoAsync(userId);
        
        CompletableFuture<List<Order>> ordersFuture = 
            getOrdersAsync(userId);
        
        CompletableFuture<CreditScore> creditFuture = 
            getCreditScoreAsync(userId);
        
        // 使用thenCombine组合两个结果
        CompletableFuture<UserData> userDataFuture = 
            userInfoFuture.thenCombine(ordersFuture, 
                (info, orders) -> new UserData(info, orders));
        
        // 使用thenCombine组合第三个结果
        return userDataFuture.thenCombine(creditFuture,
            (userData, credit) -> new UserProfile(userData, credit));
    }
    
    // 场景2：流水线处理
    public CompletableFuture<ProcessedResult> pipelineProcessing(String input) {
        return CompletableFuture.supplyAsync(() -> fetchData(input), ioExecutor)
            .thenApplyAsync(data -> validate(data), cpuExecutor)      // 切换线程池
            .thenApplyAsync(validated -> transform(validated), cpuExecutor)
            .thenApplyAsync(transformed -> enrich(transformed), ioExecutor)
            .exceptionally(ex -> {  // 统一异常处理
                log.error("Pipeline failed", ex);
                return ProcessedResult.error(ex);
            });
    }
    
    // 场景3：超时控制与快速失败
    public CompletableFuture<ApiResponse> callWithTimeout(String url) {
        CompletableFuture<ApiResponse> mainTask = 
            CompletableFuture.supplyAsync(() -> callApi(url), ioExecutor);
        
        CompletableFuture<ApiResponse> timeoutTask = 
            CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                throw new TimeoutException("API call timeout");
            }, ioExecutor);
        
        // 谁先完成就用谁的结果（超时则抛出TimeoutException）
        return mainTask.applyToEither(timeoutTask, Function.identity())
            .exceptionally(ex -> ApiResponse.timeout());
    }
    
    // 场景4：批量异步处理
    public CompletableFuture<List<User>> batchProcessUsers(List<String> userIds) {
        // 为每个用户创建异步任务
        List<CompletableFuture<User>> futures = userIds.stream()
            .map(userId -> getUserAsync(userId)
                .exceptionally(ex -> User.error(userId, ex)))  // 单个任务异常处理
            .collect(Collectors.toList());
        
        // 等待所有任务完成（部分失败不影响整体）
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)  // 此时所有future都已完成
                .collect(Collectors.toList()));
    }
    
    // 辅助方法
    private CompletableFuture<UserInfo> getUserInfoAsync(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            // 模拟IO操作
            return userService.getInfo(userId);
        }, ioExecutor);
    }
    
    private CompletableFuture<List<Order>> getOrdersAsync(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            return orderService.getOrders(userId);
        }, ioExecutor);
    }
    
    private CompletableFuture<CreditScore> getCreditScoreAsync(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            return creditService.getScore(userId);
        }, ioExecutor);
    }
}
```

##### 2.2 正例2：异常处理与恢复策略

```java
public class ExceptionHandlingStrategies {
    
    private final RetryTemplate retryTemplate = new RetryTemplate();
    
    // 策略1：优雅降级（提供默认值）
    public CompletableFuture<String> getDataWithFallback(String key) {
        return CompletableFuture.supplyAsync(() -> fetchFromPrimary(key))
            .exceptionally(ex -> {
                log.warn("Primary source failed, trying fallback", ex);
                return fetchFromFallback(key);
            })
            .exceptionally(ex -> {
                log.error("All sources failed, using default", ex);
                return "default-value";
            });
    }
    
    // 策略2：重试机制
    public CompletableFuture<Result> getWithRetry(String param) {
        return CompletableFuture.supplyAsync(() -> retryTemplate.execute(
            context -> {
                if (context.getRetryCount() > 0) {
                    log.info("Retry attempt {}", context.getRetryCount());
                }
                return unstableOperation(param);
            }
        ));
    }
    
    // 策略3：多个备用源
    public CompletableFuture<Data> getFromMultipleSources(String id) {
        CompletableFuture<Data> primary = getFromPrimary(id);
        CompletableFuture<Data> secondary = getFromSecondary(id);
        CompletableFuture<Data> cache = getFromCache(id);
        
        // 按优先级选择：缓存 -> 主源 -> 备源
        return cache
            .exceptionally(ex -> primary.join())  // 缓存失败用主源
            .exceptionally(ex -> secondary.join()) // 主源失败用备源
            .exceptionally(ex -> Data.empty());    // 全部失败返回空
    }
    
    // 策略4：详细异常信息收集
    public CompletableFuture<ProcessResult> processWithDetailedError(String input) {
        return CompletableFuture.supplyAsync(() -> stage1(input))
            .thenApplyAsync(result -> stage2(result))
            .thenApplyAsync(result -> stage3(result))
            .handle((result, ex) -> {
                if (ex != null) {
                    // 记录完整调用链信息
                    ErrorInfo errorInfo = new ErrorInfo(
                        "Process failed",
                        ex,
                        Map.of("input", input, "timestamp", Instant.now())
                    );
                    errorCollector.collect(errorInfo);
                    
                    // 根据异常类型决定恢复策略
                    if (ex instanceof TimeoutException) {
                        return ProcessResult.timeout();
                    } else if (ex instanceof BusinessException) {
                        return ProcessResult.businessError((BusinessException) ex);
                    } else {
                        return ProcessResult.systemError();
                    }
                }
                return ProcessResult.success(result);
            });
    }
    
    // 策略5：组合操作中的异常传播控制
    public CompletableFuture<CombinedResult> combineWithErrorHandling(
            CompletableFuture<DataA> futureA, 
            CompletableFuture<DataB> futureB) {
        
        // 使用handle分别处理每个future的异常
        CompletableFuture<ResultA> safeA = futureA.handle((data, ex) -> {
            if (ex != null) {
                log.error("Future A failed", ex);
                return ResultA.error(ex);
            }
            return ResultA.success(data);
        });
        
        CompletableFuture<ResultB> safeB = futureB.handle((data, ex) -> {
            if (ex != null) {
                log.error("Future B failed", ex);
                return ResultB.error(ex);
            }
            return ResultB.success(data);
        });
        
        // 即使一个失败，另一个的结果也能使用
        return safeA.thenCombine(safeB, CombinedResult::new);
    }
}
```

##### 2.3 反例：CompletableFuture的常见陷阱

```java
public class CompletableFutureAntiPatterns {
    
    // 反例1：阻塞等待破坏异步性
    public String blockingAsyncCall() {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            // 异步操作
            return fetchData();
        });
        
        // 错误：立即阻塞等待，失去异步优势
        try {
            return future.get();  // 阻塞当前线程！
        } catch (Exception e) {
            return "error";
        }
        
        // 正确：返回future，让调用者决定如何等待
    }
    
    // 反例2：在异步任务中执行阻塞操作
    public void blockingInAsyncTask() {
        CompletableFuture.runAsync(() -> {
            // 错误：在异步任务中执行同步阻塞IO
            DatabaseResult result = jdbcTemplate.queryForObject(
                "SELECT * FROM large_table", ... // 可能阻塞很久
            );
            process(result);
        });
        
        // 正确：使用异步数据库驱动或分页查询
    }
    
    // 反例3：忘记处理异常
    public CompletableFuture<Void> missingExceptionHandling() {
        return CompletableFuture.runAsync(() -> {
            throw new RuntimeException("Boom!");  // 异常被吞没！
        });
        // 正确：添加exceptionally或handle
    }
    
    // 反例4：回调地狱（Callback Hell）
    public void callbackHell() {
        getUserAsync("user1")
            .thenAccept(user -> {
                getOrdersAsync(user.getId())
                    .thenAccept(orders -> {
                        getPaymentAsync(orders.get(0).getId())
                            .thenAccept(payment -> {
                                // 嵌套越来越深...
                                updateStatusAsync(payment.getId())
                                    .thenRun(() -> System.out.println("Done"));
                            });
                    });
            });
        
        // 正确：使用thenCompose扁平化
        getUserAsync("user1")
            .thenCompose(user -> getOrdersAsync(user.getId()))
            .thenCompose(orders -> getPaymentAsync(orders.get(0).getId()))
            .thenCompose(payment -> updateStatusAsync(payment.getId()))
            .thenRun(() -> System.out.println("Done"));
    }
    
    // 反例5：线程池使用不当
    public void wrongThreadPoolUsage() {
        // 错误：CPU密集型任务使用IO线程池
        CompletableFuture.supplyAsync(() -> {
            return heavyComputation();  // CPU密集型
        }, ioExecutor);  // ioExecutor用于IO操作
        
        // 错误：IO密集型任务使用CPU线程池
        CompletableFuture.supplyAsync(() -> {
            return callExternalApi();  // IO密集型，可能阻塞
        }, cpuExecutor);  // 占用CPU线程
        
        // 正确：根据任务类型选择线程池
    }
    
    // 反例6：内存泄漏（未完成的Future）
    public void memoryLeak() {
        List<CompletableFuture<?>> futures = new ArrayList<>();
        for (int i = 0; i < 1_000_000; i++) {
            // 创建大量future，有些可能永远不会完成
            CompletableFuture<?> future = CompletableFuture.supplyAsync(() -> {
                if (Math.random() < 0.5) {
                    throw new RuntimeException("随机失败");
                }
                return slowOperation();
            });
            futures.add(future);
        }
        // 如果有些future因为异常没有设置结果，会一直留在内存中
        
        // 正确：设置超时，确保所有future都能完成
        CompletableFuture<?> safeFuture = CompletableFuture.supplyAsync(() -> slowOperation())
            .orTimeout(10, TimeUnit.SECONDS)  // JDK 9+
            .exceptionally(ex -> null);
    }
    
    // 反例7：共享可变状态
    public void sharedMutableState() {
        List<String> results = Collections.synchronizedList(new ArrayList<>());
        
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            futures.add(CompletableFuture.runAsync(() -> {
                // 多线程修改共享集合
                results.add(Thread.currentThread().getName());
            }));
        }
        
        // 虽然Collections.synchronizedList是线程安全的，
        // 但多个add操作之间没有原子性保证
        
        // 正确：每个future返回自己的结果，最后合并
        List<CompletableFuture<String>> futureList = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            futureList.add(CompletableFuture.supplyAsync(() -> 
                Thread.currentThread().getName()));
        }
        
        CompletableFuture.allOf(futureList.toArray(new CompletableFuture[0]))
            .thenApply(v -> futureList.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList()));
    }
}
```

#### 追问层：面试连环炮

##### Q1：CompletableFuture和传统Future有什么区别？相比RxJava有什么优势？

**答案要点**：
```java
public class CompletableFutureVsOthers {
    
    // CompletableFuture vs Future
    void vsTraditionalFuture() {
        /*
        传统Future的局限性：
        1. 只能阻塞获取结果（get()方法）
        2. 无法手动完成
        3. 不能链式组合多个Future
        4. 异常处理困难
        
        CompletableFuture的优势：
        1. 非阻塞回调（thenAccept、thenApply等）
        2. 手动完成控制（complete、completeExceptionally）
        3. 强大的组合能力（thenCompose、thenCombine等）
        4. 灵活的异常处理（exceptionally、handle）
        5. 超时控制（orTimeout、completeOnTimeout）
        6. 多Future组合（allOf、anyOf）
        */
    }
    
    // CompletableFuture vs RxJava
    void vsRxJava() {
        /*
        RxJava的优势：
        1. 更丰富的操作符（300+个操作符）
        2. 背压支持（Backpressure）
        3. 热观察者/冷观察者
        4. 线程调度更灵活（Schedulers）
        5. 错误传播机制更完善
        
        CompletableFuture的优势：
        1. JDK内置，无需额外依赖
        2. 学习曲线更低
        3. 与现有Java代码集成更自然
        4. 性能开销更小
        5. 与Stream API配合更好
        
        选择建议：
        - 简单异步任务 → CompletableFuture
        - 复杂数据流处理 → RxJava/Reactor
        - 需要背压控制 → RxJava/Reactor
        - Spring WebFlux项目 → Reactor
        */
    }
    
    // CompletableFuture vs 回调
    void vsCallbacks() {
        /*
        回调地狱（Callback Hell）问题：
        asyncFunction1(param, result1 -> {
            asyncFunction2(result1, result2 -> {
                asyncFunction3(result2, result3 -> {
                    // 嵌套越来越深
                });
            });
        });
        
        CompletableFuture解决方案：
        CompletableFuture.supplyAsync(() -> function1(param))
            .thenApply(result1 -> function2(result1))
            .thenApply(result2 -> function3(result2))
            .thenAccept(result3 -> process(result3));
        */
    }
}
```

##### Q2：thenApply、thenCompose、thenCombine有什么区别？各自适用什么场景？

**答案要点**：
```java
public class ThenApplyVsThenComposeVsThenCombine {
    
    // 功能对比
    void functionalComparison() {
        /*
        thenApply:      Function<T, U>    同步转换
        thenCompose:    Function<T, CompletionStage<U>>  异步转换（展平）
        thenCombine:    BiFunction<T, U, V>  组合两个独立的Future
        
        记忆口诀：
        - apply：同步转换（A -> B）
        - compose：异步转换（A -> Future<B>）
        - combine：组合两个（A + B -> C）
        */
    }
    
    // 代码示例
    void codeExamples() {
        // thenApply：同步转换
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello")
            .thenApply(s -> s + " World");  // 同步操作
        
        // thenCompose：异步转换（展平嵌套的Future）
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "Hello")
            .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + " World"));
        
        // thenCombine：组合两个独立的Future
        CompletableFuture<String> futureA = CompletableFuture.supplyAsync(() -> "Hello");
        CompletableFuture<String> futureB = CompletableFuture.supplyAsync(() -> "World");
        CompletableFuture<String> future3 = futureA.thenCombine(futureB, (a, b) -> a + " " + b);
    }
    
    // 适用场景
    void useCaseScenarios() {
        /*
        thenApply适用场景：
        - 简单的数据转换
        - 计算密集型小任务
        - 不需要额外IO操作
        
        thenCompose适用场景：
        - 链式异步调用（一个异步操作依赖前一个的结果）
        - 避免回调嵌套
        - 需要扁平化Future<Future<T>>为Future<T>
        
        thenCombine适用场景：
        - 并行执行多个独立任务，然后合并结果
        - Map-Reduce模式
        - 需要同时等待多个Future完成
        */
    }
    
    // 实际应用示例
    void practicalExamples() {
        // 场景：用户信息查询（需要多个步骤）
        CompletableFuture<User> userFuture = getUserAsync("123");
        
        // 错误：嵌套回调
        userFuture.thenAccept(user -> {
            getOrdersAsync(user.getId()).thenAccept(orders -> {
                getAddressAsync(user.getId()).thenAccept(address -> {
                    // 处理orders和address
                });
            });
        });
        
        // 正确：使用thenCompose和thenCombine
        CompletableFuture<Order> orderFuture = userFuture
            .thenCompose(user -> getOrdersAsync(user.getId()));
        
        CompletableFuture<Address> addressFuture = userFuture
            .thenCompose(user -> getAddressAsync(user.getId()));
        
        orderFuture.thenCombine(addressFuture, (orders, address) -> {
            return new UserProfile(orders, address);
        });
    }
}
```

##### Q3：CompletableFuture的异常是如何传播的？handle和exceptionally有什么区别？

**答案要点**：
```java
public class ExceptionPropagationAndHandling {
    
    // 异常传播机制
    void exceptionPropagation() {
        /*
        CompletableFuture异常传播规则：
        1. 如果某个阶段抛出异常，后续阶段会被跳过
        2. 异常会一直传播，直到遇到异常处理方法
        3. 异常处理方法可以恢复流程，返回正常值
        4. 如果没有异常处理，调用get()/join()时会抛出异常
        
        示例：
        CompletableFuture.supplyAsync(() -> { throw new RuntimeException(); })
            .thenApply(x -> x * 2)        // 跳过
            .thenAccept(x -> print(x))    // 跳过
            .exceptionally(ex -> null)    // 处理异常，返回null
            .thenRun(() -> print("Done")) // 继续执行
        */
    }
    
    // handle vs exceptionally
    void handleVsExceptionally() {
        /*
        handle: BiFunction<T, Throwable, U>
        - 同时处理正常结果和异常
        - 必须返回一个新值
        - 无论是否异常都会调用
        
        exceptionally: Function<Throwable, T>
        - 只处理异常情况
        - 正常情况不调用
        - 必须返回一个同类型的值
        
        代码对比：
        */
        
        // handle示例
        CompletableFuture<Integer> future1 = CompletableFuture.supplyAsync(() -> 10)
            .handle((result, ex) -> {
                if (ex != null) {
                    return 0;  // 异常时返回默认值
                }
                return result * 2;  // 正常时转换
            });
        
        // exceptionally示例
        CompletableFuture<Integer> future2 = CompletableFuture.supplyAsync(() -> 10)
            .thenApply(n -> n / 0)  // 抛出异常
            .exceptionally(ex -> {
                System.out.println("Exception: " + ex.getMessage());
                return 0;  // 返回默认值
            });
    }
    
    // 最佳实践：多级异常处理
    void multiLevelExceptionHandling() {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            // 第一级：业务操作，可能抛出业务异常
            return fetchData();
        })
        .exceptionally(ex -> {
            // 第二级：业务异常恢复
            if (ex instanceof BusinessException) {
                return "business-default";
            }
            throw new RuntimeException(ex);  // 重新抛出非业务异常
        })
        .handle((result, ex) -> {
            // 第三级：全局异常处理
            if (ex != null) {
                log.error("Global error", ex);
                return "global-default";
            }
            return result;
        });
    }
    
    // 异常传播的特殊情况
    void specialCases() {
        /*
        特殊情况处理：
        
        1. allOf中的异常：
           - 某个future失败不影响其他future
           - allOf返回的future会正常完成
           - 需要单独检查每个future的异常
        
        2. anyOf中的异常：
           - 第一个完成的结果（可能是异常）
           - 需要检查结果是否为异常
        
        3. 多个异常处理器的顺序：
           - 按添加顺序执行
           - 第一个成功处理异常的处理器会中断传播
        */
        
        // allOf异常处理示例
        CompletableFuture<Void> all = CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> { throw new RuntimeException("A"); }),
            CompletableFuture.runAsync(() -> { throw new RuntimeException("B"); })
        );
        
        // all会正常完成，但join()不会抛出异常
        all.join();  // 正常完成
        
        // 需要单独处理每个future
        all.thenRun(() -> {
            // 检查每个future是否有异常
        });
    }
}
```

##### Q4：如何正确取消CompletableFuture？cancel和completeExceptionally有什么区别？

**答案要点**：
```java
public class CancellationMechanisms {
    
    // cancel vs completeExceptionally
    void cancelVsCompleteExceptionally() {
        /*
        cancel(boolean mayInterrupt):
        1. 将状态标记为CANCELLED
        2. 如果任务正在运行，mayInterrupt决定是否中断线程
        3. 后续调用get()会抛出CancellationException
        4. 依赖此future的其他阶段也会被取消
        
        completeExceptionally(Throwable ex):
        1. 手动将future标记为异常完成
        2. 设置具体的异常原因
        3. 不会中断正在运行的任务（如果已经启动）
        4. 依赖此future的其他阶段会收到这个异常
        
        关键区别：
        - cancel是标准取消机制，completeExceptionally是手动完成机制
        - cancel只能抛出CancellationException，completeExceptionally可以指定任意异常
        - cancel可能中断线程，completeExceptionally不会
        */
    }
    
    // 取消的最佳实践
    void cancellationBestPractices() {
        // 方案1：带超时的取消
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(10000);  // 长时间运行
                return "result";
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted", e);
            }
        });
        
        // 设置超时（JDK 9+）
        future.orTimeout(1, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex instanceof TimeoutException) {
                    future.cancel(true);  // 超时后取消
                    return "timeout";
                }
                return "error";
            });
        
        // 方案2：响应中断的取消
        CompletableFuture<String> interruptibleFuture = CompletableFuture.supplyAsync(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    // 定期检查中断状态
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            return "cancelled";
        });
        
        // 外部控制取消
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.schedule(() -> {
            interruptibleFuture.cancel(true);  // 中断线程
        }, 1, TimeUnit.SECONDS);
    }
    
    // 取消传播问题
    void cancellationPropagation() {
        /*
        取消传播的特点：
        1. 源future被取消 → 依赖它的所有future也被取消
        2. 取消是单向传播的
        3. 已经完成或正在执行的阶段不受影响
        
        示例：
        CompletableFuture<String> source = new CompletableFuture<>();
        CompletableFuture<String> dependent = source.thenApply(s -> s + " processed");
        
        source.cancel(true);  // 取消source
        
        // dependent也会被取消
        try {
            dependent.get();
        } catch (CancellationException e) {
            System.out.println("Dependent也被取消了");
        }
        */
    }
    
    // 不可取消的任务处理
    void handlingUncancellableTasks() {
        /*
        对于不可取消的任务（如外部API调用）：
        1. 使用超时机制
        2. 记录任务状态，忽略后续结果
        3. 使用专门的线程池隔离
        
        示例：忽略已完成的任务结果
        */
        AtomicBoolean cancelled = new AtomicBoolean(false);
        
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            String result = callExternalApi();  // 不可取消的调用
            if (cancelled.get()) {
                // 虽然任务完成了，但已被取消，忽略结果
                return null;
            }
            return result;
        });
        
        // 取消标记，但不中断线程
        future.exceptionally(ex -> {
            if (ex instanceof CancellationException) {
                cancelled.set(true);
            }
            return null;
        });
    }
}
```

##### Q5：CompletableFuture在性能优化方面有哪些技巧？

**答案要点**：
```java
public class PerformanceOptimizationTips {
    
    // 性能优化技巧
    void optimizationTechniques() {
        /*
        1. 线程池调优：
           - 根据任务类型选择线程池
           - 避免线程池过大或过小
           - 使用有界队列防止OOM
        
        2. 减少线程切换：
           - 非计算密集型任务使用thenApply（同步执行）
           - 批量处理任务，减少任务数量
        
        3. 避免阻塞：
           - 不要在异步任务中执行阻塞操作
           - 使用异步IO库
        
        4. 内存优化：
           - 及时取消不需要的future
           - 设置合理的超时时间
           - 避免创建大量未完成的future
        
        5. 监控与调优：
           - 监控线程池状态
           - 使用JMH进行基准测试
           - 分析异步调用链
        */
    }
    
    // 具体优化示例
    void concreteOptimizations() {
        // 1. 批量处理优化
        void batchProcessing() {
            // 错误：逐个处理
            List<CompletableFuture<String>> futures = new ArrayList<>();
            for (String item : items) {
                futures.add(processItemAsync(item));  // 创建大量小任务
            }
            
            // 正确：批量处理
            int batchSize = 100;
            List<List<String>> batches = partition(items, batchSize);
            List<CompletableFuture<List<String>>> batchFutures = batches.stream()
                .map(batch -> processBatchAsync(batch))  // 减少任务数量
                .collect(Collectors.toList());
        }
        
        // 2. 避免不必要的异步
        void avoidUnnecessaryAsync() {
            // 错误：每个步骤都异步
            CompletableFuture.supplyAsync(() -> fetchData())
                .thenApplyAsync(data -> transform(data))   // 不必要的线程切换
                .thenApplyAsync(result -> format(result))  // 不必要的线程切换
                .thenAcceptAsync(this::save);              // 不必要的线程切换
            
            // 正确：只有IO操作异步，计算操作同步
            CompletableFuture.supplyAsync(() -> fetchData())   // IO操作，异步
                .thenApply(data -> transform(data))            // 计算操作，同步
                .thenApply(result -> format(result))           // 计算操作，同步
                .thenAcceptAsync(this::save);                  // IO操作，异步
        }
        
        // 3. 连接池复用
        void connectionPoolReuse() {
            // 为每个任务创建新的连接池
            CompletableFuture<String> future1 = CompletableFuture.supplyAsync(
                () -> callWithNewHttpClient(), httpClientPool);
            
            // 复用连接池
            private final HttpClient sharedClient = HttpClient.newBuilder().build();
            CompletableFuture<String> future2 = CompletableFuture.supplyAsync(
                () -> callWithSharedClient(sharedClient), httpClientPool);
        }
    }
    
    // 监控与诊断
    void monitoringAndDiagnosis() {
        /*
        监控指标：
        1. 线程池状态：
           - 活跃线程数
           - 队列大小
           - 拒绝任务数
        
        2. Future状态：
           - 完成时间
           - 异常比例
           - 超时比例
        
        3. 系统资源：
           - CPU使用率
           - 内存使用情况
           - GC情况
        
        诊断工具：
        1. JFR（Java Flight Recorder）
        2. JMX监控
        3. 自定义监控指标（Micrometer）
        
        示例：监控Future完成时间
        */
        <T> CompletableFuture<T> monitoredSupplyAsync(Supplier<T> supplier) {
            long startTime = System.nanoTime();
            
            return CompletableFuture.supplyAsync(() -> {
                try {
                    return supplier.get();
                } finally {
                    long duration = System.nanoTime() - startTime;
                    metrics.recordAsyncDuration(duration);
                }
            });
        }
    }
    
    // 并发控制
    void concurrencyControl() {
        /*
        限制并发度：
        1. Semaphore控制并发数
        2. 有界队列限制待处理任务
        3. 背压机制（生产者-消费者协调）
        
        示例：使用Semaphore控制并发
        */
        class RateLimitedExecutor {
            private final Semaphore semaphore;
            private final ExecutorService executor;
            
            public CompletableFuture<String> executeAsync(Supplier<String> task) {
                return CompletableFuture.supplyAsync(() -> {
                    try {
                        semaphore.acquire();  // 控制并发数
                        try {
                            return task.get();
                        } finally {
                            semaphore.release();
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    }
                }, executor);
            }
        }
    }
}
```

#### 总结层：一句话记住核心

**对于3年经验的后端工程师**：

> CompletableFuture是Java异步编程的核心工具，通过链式调用和非阻塞回调实现复杂的异步编排，但要注意异常处理、线程池选择和避免阻塞操作，合理使用thenApply、thenCompose、thenCombine等操作符构建高效可靠的异步流程。

**最佳实践口诀**：
```
异步编程要记牢，CompletableFuture是法宝。
创建任务用supply/run，指定线程池性能高。
链式调用要合理，apply/compose/combine分清。
异常处理不可少，exceptionally/handle兜底牢。
超时控制很重要，orTimeout防止无限等。
资源释放要及时，cancel/complete管理好。
监控调优不可缺，性能瓶颈早发现。
```

**异步编程检查清单**：
1. ✅ 根据任务类型选择合适的线程池
2. ✅ 始终处理异常（至少在最外层）
3. ✅ 避免在异步任务中执行阻塞操作
4. ✅ 合理使用同步/异步操作符（是否加Async后缀）
5. ✅ 设置合理的超时时间
6. ✅ 及时取消不需要的Future
7. ✅ 监控线程池状态和任务执行情况
8. ✅ 批量处理任务，减少线程切换
9. ✅ 复用资源（连接池、线程池等）
10. ✅ 编写单元测试验证异步逻辑

---

**扩展学习建议**：
- 深入源码：研究CompletableFuture的Treiber栈和依赖链实现
- 框架集成：学习Spring的@Async和WebFlux的异步编程模型
- 响应式编程：了解Project Reactor和RxJava的响应式编程思想
- 性能测试：使用JMH对异步代码进行基准测试
- 监控体系：集成Micrometer、Prometheus、Grafana监控异步系统
- 设计模式：学习异步编程中的常用设计模式（如Promise、Callback）

**实战项目建议**：
1. 实现一个基于CompletableFuture的异步HTTP客户端
2. 构建一个支持异步编排的微服务网关
3. 开发一个异步批处理数据导入系统
4. 实现带背压控制的异步消息处理器

通过理论学习和实践结合，才能真正掌握异步编程的精髓，构建高性能、高可用的现代Java应用。
