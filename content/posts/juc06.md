---
title: "Java并发编程模块深度解析"
date: 2021-12-02T00:23:32+08:00
draft: false
description: "Java并发编程模块深度解析：包括synchronized、volatile、AQS、线程池、锁优化、死锁、并发容器、JMM、原子类、CAS、ReentrantLock、ThreadLocal、线程间通信、并发容器、死锁、锁优化、JMM、原子类、CAS、ReentrantLock、ThreadLocal、线程间通信、并发容器、死锁、锁优化、JMM、原子类、CAS、Reentrant"
tags: ["多线程"]
categories: ["JUC"]
---

## 1. 模块总览
对于3年经验的开发者，**并发编程复习重点应聚焦于JMM内存模型、锁机制（synchronized/AQS）、线程池原理与调优，面试分值占比高达25-30%。**

## 2. 面试题清单（Top10高频真题）

| 排名 | 题目 | 高频出现公司 |
|------|------|-------------|
| 1 | synchronized底层原理（对象头、锁升级过程） | 阿里/字节/美团 |
| 2 | volatile关键字的作用与内存语义 | 字节/腾讯/美团 |
| 3 | AQS原理与CountDownLatch/CyclicBarrier/Semaphore应用 | 阿里/字节/京东 |
| 4 | ThreadLocal原理、内存泄漏问题与最佳实践 | 美团/腾讯/阿里 |
| 5 | 线程池核心参数、工作流程与拒绝策略 | 所有大厂必考 |
| 6 | CAS原理、ABA问题与Atomic原子类实现 | 字节/阿里/美团 |
| 7 | ReentrantLock与synchronized的区别与选择 | 阿里/腾讯/京东 |
| 8 | 线程间通信方式（wait/notify、Condition、阻塞队列） | 美团/字节 |
| 9 | 并发容器（ConcurrentHashMap、CopyOnWriteArrayList） | 所有大厂 |
| 10 | 死锁的产生条件、排查与避免方法 | 阿里/腾讯/美团 |

## 3. 逐题深度拆解

### **题目1：synchronized底层原理（对象头、锁升级过程）**

#### 原理
**对象内存布局与锁状态**：
![对象内存布局与锁状态](img/juc06-1.png)

**锁升级全过程（优化锁性能的关键路径）**：
![锁升级全过程](img/juc06-2.png)


**底层实现**：
```java
// 同步代码块编译后的字节码
public void method() {
    synchronized(this) {
        // ...
    }
}
// 编译后：
monitorenter  // 进入同步块
// ... 代码
monitorexit   // 退出同步块
```

#### 场景
**电商库存扣减场景**：
```java
public class InventoryService {
    private int stock = 100;
    
    public synchronized boolean deductStock() {
        if (stock > 0) {
            stock--;
            return true;
        }
        return false;
    }
}
// 分析：synchronized保证库存扣减的原子性，但高并发下性能差
// 优化方案：分段锁或CAS
```

#### 追问
**Q：偏向锁为什么被JDK 15默认禁用？**
- 在大量竞争场景下，偏向锁的撤销成本高
- 现代应用大多是线程池，线程复用率高，偏向锁收益低
- 禁用后直接使用轻量级锁，性能更稳定

**Q：synchronized锁的是对象还是代码？**
- 锁的是**对象**（对象头中的Mark Word）
- 类锁实际是锁Class对象（Class对象也是对象）
- 静态同步方法：锁当前类的Class对象
- 实例同步方法：锁当前实例对象（this）

#### 总结
synchronized通过对象头Mark Word实现锁状态记录，经历无锁→偏向锁→轻量级锁→重量级锁的升级过程以平衡性能与安全性。

---

### **题目2：volatile关键字的作用与内存语义**

#### 原理
**JMM内存模型与volatile的可见性保证**：
![JMM内存模型与volatile的可见性保证](img/juc06-3.png)


**volatile的内存屏障插入策略**：
```java
// 写操作：StoreStore屏障 + StoreLoad屏障
volatile boolean flag = true;
// 编译后相当于：
// StoreStore屏障
// 写入flag到主内存
// StoreLoad屏障

// 读操作：LoadLoad屏障 + LoadStore屏障  
if (flag) {
    // 编译后相当于：
    // LoadLoad屏障
    // 从主内存读取flag
    // LoadStore屏障
}
```

#### 场景
**双重检查锁定单例模式（DCL）**：
```java
public class Singleton {
    // 必须加volatile！禁止指令重排序
    private static volatile Singleton instance;
    
    public static Singleton getInstance() {
        if (instance == null) {                    // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null) {            // 第二次检查
                    instance = new Singleton();    // 可能出现问题的步骤
                    // 1. 分配内存空间
                    // 2. 初始化对象
                    // 3. 指向引用（可能被重排序为1-3-2）
                }
            }
        }
        return instance;
    }
}
// 没有volatile，其他线程可能拿到未初始化完成的对象
```

#### 追问
**Q：volatile能保证原子性吗？**
- 不能！volatile只保证可见性和有序性
- 经典反例：`volatile int count = 0; count++;` 仍然不是原子的
- `count++`实际上是`读-改-写`三个操作

**Q：volatile和synchronized的区别？**
| 维度 | volatile | synchronized |
|------|----------|--------------|
| 原子性 | 不保证 | 保证 |
| 可见性 | 保证 | 保证 |
| 有序性 | 保证 | 保证 |
| 阻塞性 | 不阻塞 | 阻塞 |
| 粒度 | 变量级别 | 代码块/方法级别 |

#### 总结
volatile通过内存屏障保证可见性和有序性，但不保证原子性，常用于状态标志位和DCL单例模式。

---

### **题目3：AQS原理与CountDownLatch/CyclicBarrier/Semaphore应用**

#### 原理
**AQS核心架构（同步器的基石）**：
![AQS核心架构](img/juc06-4.png)

**AQS的CLH队列工作流程**：
```java
// 获取锁的简化流程
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&          // 尝试获取
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))  // 加入队列
        selfInterrupt();
}

// 释放锁
public final boolean release(int arg) {
    if (tryRelease(arg)) {           // 尝试释放
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);      // 唤醒后继节点
        return true;
    }
    return false;
}
```

#### 场景
**CountDownLatch：主线程等待多个子线程完成**
```java
// 大数据处理：等待所有数据分片处理完成
CountDownLatch latch = new CountDownLatch(3);  // 3个子任务

for (int i = 0; i < 3; i++) {
    new Thread(() -> {
        try {
            // 处理数据分片
        } finally {
            latch.countDown();  // 完成一个
        }
    }).start();
}

latch.await();  // 主线程等待所有完成
System.out.println("所有数据分片处理完成");
```

**CyclicBarrier：线程间相互等待到达屏障点**
```java
// 多阶段计算：所有线程完成第一阶段才能开始第二阶段
CyclicBarrier barrier = new CyclicBarrier(3, 
    () -> System.out.println("所有线程到达屏障，开始下一阶段"));

for (int i = 0; i < 3; i++) {
    new Thread(() -> {
        // 第一阶段计算
        barrier.await();
        // 第二阶段计算（等所有线程完成第一阶段）
        barrier.await();
    }).start();
}
```

#### 追问
**Q：CountDownLatch和CyclicBarrier的区别？**
| 维度 | CountDownLatch | CyclicBarrier |
|------|---------------|---------------|
| 计数方式 | 减到0触发 | 加到指定值触发 |
| 重用性 | 一次性 | 可循环使用 |
| 参与者 | 主线程等待子线程 | 线程间互相等待 |
| 构造参数 | 计数初始值 | 参与线程数 + 可选Runnable |

**Q：Semaphore如何实现连接池？**
```java
// 数据库连接池简化实现
public class ConnectionPool {
    private final Semaphore semaphore;
    private final LinkedList<Connection> pool = new LinkedList<>();
    
    public ConnectionPool(int maxSize) {
        semaphore = new Semaphore(maxSize);
        // 初始化连接...
    }
    
    public Connection getConnection() throws InterruptedException {
        semaphore.acquire();  // 获取许可
        synchronized (pool) {
            return pool.removeFirst();
        }
    }
    
    public void releaseConnection(Connection conn) {
        synchronized (pool) {
            pool.addLast(conn);
        }
        semaphore.release();  // 释放许可
    }
}
```

#### 总结
AQS是JUC同步器的基石，通过state和CLH队列实现锁和同步器，CountDownLatch/CyclicBarrier/Semaphore都是其典型应用。

---

### **题目4：ThreadLocal原理、内存泄漏问题与最佳实践**

#### 原理
**ThreadLocal内存结构图**：
![ThreadLocal内存结构图](img/juc06-5.png)

**ThreadLocalMap的Hash冲突解决**：
- 开放地址法（线性探测）
- 初始容量16，扩容阈值2/3
- key是弱引用，value是强引用（内存泄漏根源）

#### 场景
**用户会话信息传递**：
```java
public class UserContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();
    
    public static void setUser(User user) {
        currentUser.set(user);
    }
    
    public static User getUser() {
        return currentUser.get();
    }
    
    // 必须清理！防止内存泄漏
    public static void clear() {
        currentUser.remove();
    }
}

// 在Filter/Interceptor中使用
public class AuthFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        try {
            User user = authenticate(req);
            UserContext.setUser(user);
            chain.doFilter(req, res);
        } finally {
            UserContext.clear();  // 必须清理！
        }
    }
}
```

#### 追问
**Q：为什么ThreadLocalMap的key使用弱引用？**
```java
// ThreadLocalMap.Entry定义
static class Entry extends WeakReference<ThreadLocal<?>> {
    Object value;  // 强引用！
    
    Entry(ThreadLocal<?> k, Object v) {
        super(k);  // key是弱引用
        value = v; // value是强引用
    }
}
```
- key弱引用：当ThreadLocal实例被GC回收时，key变为null
- 但value仍是强引用，不会被回收（内存泄漏！）
- 只有调用get()/set()/remove()时才会清理key为null的Entry

**Q：如何正确使用ThreadLocal？**
1. 声明为`static final`（避免重复创建）
2. 使用后必须调用`remove()`清理（尤其在线程池环境）
3. 考虑使用阿里开源的`TransmittableThreadLocal`支持线程池传递

#### 总结
ThreadLocal通过线程独享的ThreadLocalMap实现数据隔离，但必须及时remove()避免内存泄漏，尤其在线程池场景。

---

### **题目5：线程池核心参数、工作流程与拒绝策略**

#### 原理
**ThreadPoolExecutor七大核心参数**：
```java
public ThreadPoolExecutor(
    int corePoolSize,      // 核心线程数（常驻）
    int maximumPoolSize,   // 最大线程数
    long keepAliveTime,    // 空闲线程存活时间
    TimeUnit unit,         // 时间单位
    BlockingQueue<Runnable> workQueue,  // 工作队列
    ThreadFactory threadFactory,        // 线程工厂
    RejectedExecutionHandler handler    // 拒绝策略
)
```

**线程池工作流程图（理解核心）**：
![线程池工作流程图](img/juc06-6.png)

#### 场景
**订单处理系统线程池配置**：
```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5,      // corePoolSize: 日常订单量，5个线程足够
    20,     // maximumPoolSize: 大促时最大20线程
    60,     // keepAliveTime: 临时线程空闲60秒回收
    TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),  // 队列容量100，防瞬时峰值
    new NamedThreadFactory("Order-Process"),  // 自定义线程名
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略：调用者执行
);

// 监控关键指标
executor.getActiveCount();      // 活动线程数
executor.getQueue().size();     // 队列积压数
executor.getCompletedTaskCount(); // 已完成任务数
```

#### 追问
**Q：四种拒绝策略如何选择？**
1. **AbortPolicy（默认）**：抛RejectedExecutionException
   - 适用：关键业务，宁可失败也不能阻塞调用线程
2. **CallerRunsPolicy**：调用线程自己执行
   - 适用：允许降级，不希望丢失任务
3. **DiscardPolicy**：静默丢弃任务
   - 适用：可丢弃的监控/日志任务
4. **DiscardOldestPolicy**：丢弃队列最老任务，重试提交
   - 适用：允许丢弃旧任务，保存新任务

**Q：工作队列有哪些？如何选择？**
| 队列类型 | 特性 | 适用场景 |
|---------|------|----------|
| ArrayBlockingQueue | 有界，FIFO | 流量削峰，控制资源 |
| LinkedBlockingQueue | 可选有界，FIFO | 默认无界，注意OOM风险 |
| SynchronousQueue | 无缓冲，直接传递 | 高吞吐，线程数需足够 |
| PriorityBlockingQueue | 优先级排序 | 任务有优先级区分 |

#### 总结
线程池通过核心/最大线程数+工作队列+拒绝策略管理线程生命周期，合理配置是高性能并发系统的关键。

### **题目6：CAS原理、ABA问题与Atomic原子类实现**
#### 原理层：从CPU指令到Java实现的完整链条

##### 1. CAS的硬件原理与JVM实现

```java
// CAS（Compare-And-Swap）的硬件与软件栈
public class CASPrinciple {
    /*
    CPU层面：CAS是一条原子指令（x86的CMPXCHG）
    
    执行流程：
    1. 比较内存位置的值与期望值
    2. 如果匹配，将新值写入该内存位置
    3. 返回操作是否成功
    
    Java层面：通过Unsafe类提供CAS操作
    */
    
    // Unsafe类中的CAS方法（简化）
    public final class Unsafe {
        // 对象字段的CAS
        public final native boolean compareAndSwapObject(
            Object obj, long offset, Object expect, Object update);
        
        // 整型字段的CAS  
        public final native boolean compareAndSwapInt(
            Object obj, long offset, int expect, int update);
        
        // 长整型字段的CAS
        public final native boolean compareAndSwapLong(
            Object obj, long offset, long expect, long update);
    }
    
    // CAS操作的内存语义图
    public static void casMemoryDiagram() {
        /*
        初始状态：
        ┌─────────┬─────────┐
        │ 内存地址 │  值     │
        ├─────────┼─────────┤
        │ 0x1000  │   A     │
        └─────────┴─────────┘
        
        CAS操作：compareAndSwap(0x1000, A, B)
        
        步骤1：读取内存值（A）
        步骤2：比较期望值（A == A？true）
        步骤3：写入新值（B）
        
        结果状态：
        ┌─────────┬─────────┐
        │ 内存地址 │  值     │
        ├─────────┼─────────┤
        │ 0x1000  │   B     │
        └─────────┴─────────┘
        
        关键点：步骤1-3是原子操作，不会被线程切换打断
        */
    }
}
```

##### 2. Atomic原子类的实现原理

```java
// AtomicInteger源码解析（JDK 11简化版）
public class AtomicInteger extends Number implements java.io.Serializable {
    private static final long serialVersionUID = 6214790243416807050L;
    
    // Unsafe实例，用于执行CAS操作
    private static final Unsafe U = Unsafe.getUnsafe();
    
    // value字段的内存偏移量
    private static final long VALUE;
    
    static {
        try {
            // 获取value字段在AtomicInteger对象中的内存偏移
            VALUE = U.objectFieldOffset
                (AtomicInteger.class.getDeclaredField("value"));
        } catch (ReflectiveOperationException e) {
            throw new Error(e);
        }
    }
    
    // 实际存储值的volatile变量
    private volatile int value;
    
    // 构造方法
    public AtomicInteger(int initialValue) {
        value = initialValue;
    }
    
    // 核心方法：getAndIncrement() - 原子自增并返回旧值
    public final int getAndIncrement() {
        return U.getAndAddInt(this, VALUE, 1);
    }
    
    // Unsafe.getAndAddInt的实现原理
    public int getAndAddInt(Object obj, long offset, int delta) {
        int prev, next;
        do {
            prev = this.getIntVolatile(obj, offset); // 读取当前值
            next = prev + delta;                     // 计算新值
        } while (!this.compareAndSwapInt(obj, offset, prev, next)); // CAS循环
        return prev; // 返回旧值
    }
    
    // 乐观锁的典型模式：CAS循环（自旋锁）
    public final int incrementAndGet() {
        int prev, next;
        do {
            prev = get();          // 读取当前值
            next = prev + 1;       // 计算新值
        } while (!compareAndSet(prev, next)); // CAS直到成功
        return next; // 返回新值
    }
    
    // 标准的CAS方法
    public final boolean compareAndSet(int expect, int update) {
        return U.compareAndSwapInt(this, VALUE, expect, update);
    }
    
    // 其他重要方法
    public final int getAndUpdate(IntUnaryOperator updateFunction) {
        int prev, next;
        do {
            prev = get();
            next = updateFunction.applyAsInt(prev); // 应用函数
        } while (!compareAndSet(prev, next));
        return prev;
    }
}
```

##### 3. CAS操作的内存屏障与可见性

```
Java内存模型（JMM）与CAS：

volatile变量的写-读操作：
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  线程A       │      │  主内存     │      │  线程B       │
├─────────────┤      ├─────────────┤      ├─────────────┤
│ 写volatile   │───→│ 刷新到主内存│←───│ 读volatile   │
│  value=1     │      │  value=1    │      │  value=1    │
└─────────────┘      └─────────────┘      └─────────────┘
      ↓                     ↓                     ↓
  Store屏障          内存总线同步          Load屏障

CAS操作的内存语义：
1. 同时具有volatile读和volatile写的内存效果
2. CAS成功时：如同volatile写，会将线程本地内存刷新到主内存
3. CAS失败时：如同volatile读，会从主内存重新读取最新值

CPU缓存一致性协议（MESI）：
┌─────────┐    ┌─────────┐    ┌─────────┐
│ CPU1    │    │ 缓存    │    │ 内存    │
│ 缓存行   │    │ 一致性  │    │         │
│ (M状态)  │    │ 协议    │    │         │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     │ 写缓存行     │              │
     │─────────────▶│              │
     │              │ 无效化其他CPU│
     │              │ 的缓存行     │
     │              │─────────────▶│
     │              │              │
     │              │ 其他CPU读     │
     │              │ 需要重新从    │
     │              │ 内存加载      │
     │              │◀─────────────│
```

##### 4. ABA问题的产生原理

```java
// ABA问题演示
public class ABAProblemDemo {
    // 共享变量
    private static AtomicReference<String> atomicRef = 
        new AtomicReference<>("A");
    
    public static void main(String[] args) throws InterruptedException {
        // 线程1：尝试将A改为C，但会经历A→B→A的变化
        Thread thread1 = new Thread(() -> {
            System.out.println("线程1启动，期望值：A，新值：C");
            
            // 模拟处理耗时
            try {
                Thread.sleep(1000); // 让线程2先执行
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            
            // CAS操作：期望A，改为C
            boolean success = atomicRef.compareAndSet("A", "C");
            System.out.println("线程1 CAS结果：" + success + "，当前值：" + atomicRef.get());
        });
        
        // 线程2：先将A改为B，再改回A
        Thread thread2 = new Thread(() -> {
            // 第一次修改：A → B
            System.out.println("线程2：A → B，结果：" + 
                atomicRef.compareAndSet("A", "B"));
            System.out.println("当前值：" + atomicRef.get());
            
            // 第二次修改：B → A
            System.out.println("线程2：B → A，结果：" + 
                atomicRef.compareAndSet("B", "A"));
            System.out.println("当前值：" + atomicRef.get());
        });
        
        thread1.start();
        thread2.start();
        
        thread1.join();
        thread2.join();
        
        /*
        输出可能：
        线程1启动，期望值：A，新值：C
        线程2：A → B，结果：true
        当前值：B
        线程2：B → A，结果：true
        当前值：A
        线程1 CAS结果：true，当前值：C  ← 问题：虽然CAS成功了，但中间经历了变化！
        
        ABA问题：值从A变成B又变回A，但线程1的CAS仍然成功
        在某些场景下，这种中间变化可能是重要的
        */
    }
}
```

#### 场景层：业务中的CAS应用与ABA问题

##### 场景1：分布式ID生成器（CAS最佳实践）

```java
@Component
public class DistributedIdGenerator {
    // 使用AtomicLong实现线程安全的ID生成
    private final AtomicLong sequence = new AtomicLong(0);
    private final long workerId;
    private final long dataCenterId;
    private final long epoch = 1609459200000L; // 2021-01-01 00:00:00
    
    public DistributedIdGenerator(long workerId, long dataCenterId) {
        this.workerId = workerId & 0x1F; // 5位，最大31
        this.dataCenterId = dataCenterId & 0x1F; // 5位，最大31
    }
    
    /**
     * 生成雪花算法ID
     * 格式：0(1位) | 时间戳(41位) | 数据中心ID(5位) | 工作节点ID(5位) | 序列号(12位)
     */
    public long nextId() {
        long currentTime = System.currentTimeMillis();
        long timestamp = currentTime - epoch;
        
        // 处理时钟回拨
        if (timestamp < 0) {
            throw new RuntimeException("Clock moved backwards!");
        }
        
        // 如果同一毫秒内多次生成，递增序列号
        long lastTimestamp = 0L; // 实际需要持久化存储上次时间戳
        long seq;
        
        if (timestamp == lastTimestamp) {
            // 同一毫秒内，使用CAS递增序列号
            seq = sequence.incrementAndGet() & 0xFFF; // 12位，最大4095
            if (seq == 0) {
                // 序列号溢出，等待下一毫秒
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            // 新的一毫秒，重置序列号
            sequence.set(0);
            seq = 0;
        }
        
        // 组合ID
        return (timestamp << 22)
             | (dataCenterId << 17)
             | (workerId << 12)
             | seq;
    }
    
    // 等待下一毫秒
    private long tilNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis() - epoch;
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis() - epoch;
        }
        return timestamp;
    }
    
    // 批量获取ID（CAS优化版本）
    public List<Long> batchNextIds(int batchSize) {
        List<Long> ids = new ArrayList<>(batchSize);
        long currentTime = System.currentTimeMillis();
        long timestamp = currentTime - epoch;
        
        // 使用CAS一次性获取多个序列号
        long currentSeq;
        long nextSeq;
        do {
            currentSeq = sequence.get();
            nextSeq = currentSeq + batchSize;
            
            // 检查序列号是否溢出
            if ((nextSeq & 0xFFF) < batchSize) {
                // 溢出，等待下一毫秒
                timestamp = tilNextMillis(timestamp);
                sequence.set(0);
                currentSeq = 0;
                nextSeq = batchSize;
            }
        } while (!sequence.compareAndSet(currentSeq, nextSeq));
        
        // 生成批量的ID
        for (int i = 0; i < batchSize; i++) {
            long id = (timestamp << 22)
                    | (dataCenterId << 17)
                    | (workerId << 12)
                    | ((currentSeq + i) & 0xFFF);
            ids.add(id);
        }
        
        return ids;
    }
    
    // 测试：模拟高并发ID生成
    public static void main(String[] args) throws InterruptedException {
        DistributedIdGenerator generator = new DistributedIdGenerator(1, 1);
        
        int threadCount = 100;
        CountDownLatch latch = new CountDownLatch(threadCount);
        Set<Long> idSet = Collections.synchronizedSet(new HashSet<>());
        
        // 创建100个线程并发生成ID
        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    long id = generator.nextId();
                    idSet.add(id);
                }
                latch.countDown();
            }).start();
        }
        
        latch.await();
        System.out.println("生成ID总数：" + (threadCount * 1000));
        System.out.println("唯一ID数量：" + idSet.size()); // 应该等于总数
        System.out.println("重复ID数量：" + (threadCount * 1000 - idSet.size())); // 应该为0
    }
}
```

##### 场景2：无锁栈实现（解决ABA问题）

```java
// 使用AtomicStampedReference解决ABA问题的无锁栈
public class LockFreeStack<E> {
    // 使用AtomicStampedReference，额外维护版本戳
    private static class Node<E> {
        final E item;
        Node<E> next;
        
        Node(E item) {
            this.item = item;
        }
    }
    
    // 栈顶节点引用 + 版本戳
    private final AtomicStampedReference<Node<E>> top = 
        new AtomicStampedReference<>(null, 0);
    
    // 入栈
    public void push(E item) {
        Node<E> newHead = new Node<>(item);
        Node<E> oldHead;
        int oldStamp;
        
        do {
            oldHead = top.getReference();   // 获取当前栈顶
            oldStamp = top.getStamp();      // 获取当前版本
            newHead.next = oldHead;         // 新节点指向旧栈顶
        } while (!top.compareAndSet(oldHead, newHead, oldStamp, oldStamp + 1));
        // 如果栈顶没变，CAS成功并增加版本号
    }
    
    // 出栈
    public E pop() {
        Node<E> oldHead;
        Node<E> newHead;
        int oldStamp;
        int newStamp;
        
        do {
            oldHead = top.getReference();
            oldStamp = top.getStamp();
            
            if (oldHead == null) {
                return null; // 栈为空
            }
            
            newHead = oldHead.next;
            newStamp = oldStamp + 1; // 每次操作都递增版本号
        } while (!top.compareAndSet(oldHead, newHead, oldStamp, newStamp));
        
        return oldHead.item;
    }
    
    // 查看栈顶
    public E peek() {
        Node<E> node = top.getReference();
        return node != null ? node.item : null;
    }
    
    // 获取当前版本号（用于测试）
    public int getVersion() {
        return top.getStamp();
    }
    
    // 测试：演示ABA问题的解决
    public static void main(String[] args) throws InterruptedException {
        LockFreeStack<String> stack = new LockFreeStack<>();
        
        // 线程1：push A，然后pop A，再push B
        Thread thread1 = new Thread(() -> {
            stack.push("A");
            System.out.println("线程1 push A，版本：" + stack.getVersion());
            
            stack.pop();
            System.out.println("线程1 pop A，版本：" + stack.getVersion());
            
            stack.push("B");
            System.out.println("线程1 push B，版本：" + stack.getVersion());
        });
        
        // 线程2：尝试pop A（但实际栈顶已经变化）
        Thread thread2 = new Thread(() -> {
            try {
                Thread.sleep(50); // 确保线程1先执行
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            
            // 尝试pop，期望得到"A"但实际上栈已经变化
            String item = stack.pop();
            System.out.println("线程2 pop，得到：" + item + "，版本：" + stack.getVersion());
            
            // 由于版本号变化，线程2能感知到栈的变化
            // 不会出现ABA问题：误以为栈没变而执行错误操作
        });
        
        thread1.start();
        thread2.start();
        
        thread1.join();
        thread2.join();
        
        /*
        输出：
        线程1 push A，版本：1
        线程1 pop A，版本：2
        线程1 push B，版本：3
        线程2 pop，得到：B，版本：4
        
        关键：版本号从1→2→3→4，每次变化都能被检测到
        即使栈顶值从A变回空又变成B，版本号的变化让ABA问题被解决
        */
    }
}
```

##### 场景3：错误的CAS使用（反例）

```java
// ❌ 反例1：CAS中的竞态条件
public class CASRaceCondition {
    // 问题：check-then-act模式，不是原子的
    private AtomicInteger counter = new AtomicInteger(0);
    private AtomicBoolean initialized = new AtomicBoolean(false);
    
    public void wrongInit() {
        // 错误：检查-然后-设置，不是原子的
        if (!initialized.get()) {          // 步骤1：检查
            // 这里可能被其他线程打断
            counter.set(100);              // 步骤2：设置
            initialized.set(true);         // 步骤3：标记
        }
        
        // 正确：使用CAS原子操作
        if (initialized.compareAndSet(false, true)) {
            counter.set(100); // 只有第一个线程能执行这里
        }
    }
}

// ❌ 反例2：CAS自旋导致CPU空转
public class CASSpinProblem {
    private AtomicInteger lock = new AtomicInteger(0);
    
    public void wrongLock() {
        // 问题：高竞争下CAS会长时间自旋，浪费CPU
        while (!lock.compareAndSet(0, 1)) {
            // 空循环，CPU100%
        }
        
        try {
            // 临界区
        } finally {
            lock.set(0);
        }
        
        // 改进：增加退避策略
        int backoff = 1;
        while (!lock.compareAndSet(0, 1)) {
            // 指数退避
            try {
                Thread.sleep(backoff);
                backoff = Math.min(backoff * 2, 1000); // 最大1秒
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}

// ❌ 反例3：ABA问题导致的业务逻辑错误
public class ABAProblemInBusiness {
    // 账户余额管理系统
    static class Account {
        private AtomicInteger balance = new AtomicInteger(100);
        
        // 错误的转账实现：可能发生ABA问题
        public boolean transferWrong(int amount, Account target) {
            int current = balance.get();
            
            // 模拟复杂的业务逻辑处理
            try {
                Thread.sleep(100); // 模拟网络延迟
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            // 问题：这段时间内，balance可能经历了 100→50→100 的变化
            // 但下面的CAS仍然会成功
            return balance.compareAndSet(current, current - amount);
        }
        
        // 正确的转账实现：使用版本控制
        private AtomicStampedReference<Integer> stampedBalance = 
            new AtomicStampedReference<>(100, 0);
        
        public boolean transferCorrect(int amount, Account target) {
            int[] stampHolder = new int[1];
            int current;
            int newStamp;
            
            do {
                current = stampedBalance.get(stampHolder);
                int stamp = stampHolder[0];
                
                if (current < amount) {
                    return false; // 余额不足
                }
                
                newStamp = stamp + 1; // 每次操作递增版本
            } while (!stampedBalance.compareAndSet(
                current, current - amount, 
                stampHolder[0], newStamp));
            
            return true;
        }
    }
    
    public static void main(String[] args) throws InterruptedException {
        Account account = new Account();
        
        // 线程1：正常转账
        Thread t1 = new Thread(() -> {
            boolean success = account.transferWrong(50, null);
            System.out.println("线程1转账结果：" + success);
        });
        
        // 线程2：制造ABA场景
        Thread t2 = new Thread(() -> {
            // 先取款50
            // 再存款50（模拟退款或撤销）
            // 实际业务中，取款和存款可能是两个独立操作
        });
        
        t1.start();
        t2.start();
        
        t1.join();
        t2.join();
    }
}
```

#### 追问层：面试官的深度连环问

##### 追问1：CAS在JDK中有哪些具体应用？除了Atomic类还有哪里用到了？

**CAS在JDK中的广泛应用：**

```java
public class CASInJDK {
    /*
    1. java.util.concurrent.atomic包
       - AtomicInteger, AtomicLong, AtomicBoolean
       - AtomicReference, AtomicStampedReference
       - AtomicIntegerArray, AtomicLongArray
       - AtomicIntegerFieldUpdater, AtomicReferenceFieldUpdater
       - LongAdder, DoubleAdder（Java 8+，更高性能的累加器）
    
    2. java.util.concurrent包中的锁和同步器
       - AbstractQueuedSynchronizer（AQS）：所有Lock的基础
       - ReentrantLock, CountDownLatch, CyclicBarrier, Semaphore
       - ConcurrentHashMap（Java 8使用CAS代替分段锁）
       - CopyOnWriteArrayList（使用volatile + synchronized，但思想类似）
    
    3. 其他JDK组件
       - ForkJoinPool：工作窃取算法
       - CompletableFuture：异步任务编排
       - StringBuffer（某些方法使用synchronized，但思想相关）
    */
    
    // 示例1：AQS中的CAS应用（AbstractQueuedSynchronizer）
    public static class AQSCASExample {
        /*
        AQS的核心：state字段 + CLH队列
        
        state字段使用volatile + CAS实现：
        */
        public abstract class AbstractQueuedSynchronizer {
            // 同步状态
            private volatile int state;
            
            // 获取state的内存偏移
            private static final Unsafe unsafe = Unsafe.getUnsafe();
            private static final long stateOffset;
            
            static {
                try {
                    stateOffset = unsafe.objectFieldOffset
                        (AbstractQueuedSynchronizer.class.getDeclaredField("state"));
                } catch (Exception ex) { throw new Error(ex); }
            }
            
            // CAS修改state
            protected final boolean compareAndSetState(int expect, int update) {
                return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
            }
            
            // 其他方法如acquire、release都基于CAS
        }
    }
    
    // 示例2：ConcurrentHashMap中的CAS（Java 8）
    public static class ConcurrentHashMapCAS {
        /*
        Java 8 ConcurrentHashMap的变化：
        - 移除分段锁（Segment）
        - 使用Node数组 + synchronized + CAS
        - put操作使用CAS插入新节点
        */
        
        // 简化版的putVal方法逻辑
        public V put(K key, V value) {
            // 1. 计算hash
            int hash = spread(key.hashCode());
            
            // 2. 死循环，直到插入成功
            for (Node<K,V>[] tab = table;;) {
                Node<K,V> f; int n, i, fh;
                
                if (tab == null || (n = tab.length) == 0)
                    tab = initTable(); // 初始化表
                
                // 3. 计算桶索引，如果桶为空，使用CAS插入新节点
                else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                    // CAS操作：如果tab[i]为null，则创建新节点
                    if (casTabAt(tab, i, null, new Node<K,V>(hash, key, value)))
                        break; // 插入成功，退出循环
                }
                
                // 4. 如果桶不为空，使用synchronized锁住链表头
                else {
                    synchronized (f) {
                        // 处理链表或红黑树
                    }
                }
            }
            return null;
        }
        
        // CAS替换桶中的节点
        static final <K,V> boolean casTabAt(Node<K,V>[] tab, int i,
                                            Node<K,V> c, Node<K,V> v) {
            return U.compareAndSwapObject(tab, ((long)i << ASHIFT) + ABASE, c, v);
        }
    }
    
    // 示例3：LongAdder的高性能实现
    public static class LongAdderCAS {
        /*
        LongAdder vs AtomicLong：
        
        AtomicLong：所有线程竞争同一个volatile变量
          线程1    线程2    线程3
             ↓       ↓       ↓
          [AtomicLong.value] ← 竞争热点
        
        LongAdder：分散竞争，最后求和
          线程1 → Cell[0]
          线程2 → Cell[1] 
          线程3 → Cell[2]
               ↓   ↓   ↓
              sum = 求和所有Cell
        
        实现原理：使用Cell数组分散竞争
        */
        
        // Striped64（LongAdder的父类）的核心实现
        static final class Striped64 extends Number {
            // Cell数组，每个线程尽量访问不同的Cell
            transient volatile Cell[] cells;
            
            // 基础值，没有竞争时使用
            transient volatile long base;
            
            // CAS更新base
            final boolean casBase(long cmp, long val) {
                return U.compareAndSwapLong(this, BASE, cmp, val);
            }
            
            // Cell类：使用@Contended避免伪共享
            @jdk.internal.vm.annotation.Contended
            static final class Cell {
                volatile long value;
                Cell(long x) { value = x; }
                
                final boolean cas(long cmp, long val) {
                    return U.compareAndSwapLong(this, VALUE, cmp, val);
                }
            }
        }
    }
    
    // 示例4：ThreadLocalRandom中的CAS
    public static class ThreadLocalRandomCAS {
        /*
        ThreadLocalRandom：每个线程有自己的随机数种子
        避免AtomicLong的竞争
        
        关键：使用CAS更新公共的种子
        */
        
        // 下一个种子生成
        private static long nextSeed() {
            Thread t; long r; // 读取和写入threadLocalRandomSeed
            U.putLong(t = Thread.currentThread(), SEED,
                      r = U.getLong(t, SEED) + GAMMA);
            return r;
        }
        
        // 初始化种子
        static final void localInit() {
            int p = probeGenerator.addAndGet(PROBE_INCREMENT);
            int probe = (p == 0) ? 1 : p; // skip 0
            long seed = mix64(seeder.getAndAdd(SEEDER_INCREMENT));
            Thread t = Thread.currentThread();
            U.putLong(t, SEED, seed);
            U.putInt(t, PROBE, probe);
        }
    }
}
```

##### 追问2：CAS有什么性能问题？如何优化CAS的性能？

**CAS性能问题与优化策略：**

```java
public class CASPerformance {
    /*
    CAS的性能问题：
    1. 高竞争下的CPU空转（自旋锁问题）
    2. 伪共享（False Sharing）
    3. 内存屏障开销
    4. ABA问题的检测开销
    */
    
    // 问题1：高竞争下的CPU空转
    public static class HighContentionProblem {
        private AtomicInteger counter = new AtomicInteger(0);
        
        // 高并发下的性能问题
        public void increment() {
            // 100个线程同时自旋，CPU使用率100%
            while (true) {
                int current = counter.get();
                int next = current + 1;
                if (counter.compareAndSet(current, next)) {
                    break;
                }
            }
        }
        
        // 优化方案1：退避策略
        public void incrementWithBackoff() {
            int backoff = 1;
            while (true) {
                int current = counter.get();
                int next = current + 1;
                if (counter.compareAndSet(current, next)) {
                    break;
                }
                
                // 指数退避
                try {
                    Thread.sleep(backoff);
                    backoff = Math.min(backoff * 2, 100); // 最大100ms
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        // 优化方案2：使用LongAdder（分散竞争）
        public void incrementWithLongAdder() {
            // LongAdder内部使用Cell数组分散竞争
            LongAdder adder = new LongAdder();
            adder.increment(); // 性能远高于AtomicLong
        }
    }
    
    // 问题2：伪共享（False Sharing）
    public static class FalseSharingProblem {
        /*
        伪共享：不同CPU核心修改同一缓存行的不同变量
        导致缓存行无效，性能下降
        
        示例：
        CPU1修改x，CPU2修改y，但x和y在同一缓存行
        CPU1修改x → 缓存行标记为脏 → CPU2的缓存行失效
        CPU2需要重新从内存加载缓存行
        */
        
        // 未优化的版本：可能存在伪共享
        static class UnpaddedAtomicLong {
            private volatile long value;
            // 可能与其他变量在同一个缓存行
        }
        
        // 优化的版本：填充缓存行
        @jdk.internal.vm.annotation.Contended  // JDK 8+的注解
        static class PaddedAtomicLong {
            private volatile long value;
            // 使用填充使每个实例独占缓存行
            private long p1, p2, p3, p4, p5, p6, p7; // 填充
            
            // 或者手动计算填充
            // 典型缓存行大小：64字节
            // long(8字节) + 对象头(12字节) + 填充(44字节) = 64字节
        }
        
        // LongAdder.Cell使用@Contended避免伪共享
        @jdk.internal.vm.annotation.Contended
        static final class Cell {
            volatile long value;
            Cell(long x) { value = x; }
            // 自动填充，避免与其他Cell伪共享
        }
    }
    
    // 问题3：内存屏障开销
    public static class MemoryBarrierCost {
        /*
        CAS操作包含完整的内存屏障：
        - LoadLoad屏障
        - LoadStore屏障  
        - StoreStore屏障
        - StoreLoad屏障（最昂贵）
        
        优化：减少不必要的内存屏障
        */
        
        // JDK中的优化：使用lazySet
        public void lazySetExample() {
            AtomicInteger atomic = new AtomicInteger(0);
            
            // set()：包含完整的StoreStore + StoreLoad屏障
            atomic.set(10); // 保证对其他线程立即可见
            
            // lazySet()：只包含StoreStore屏障，不保证立即可见
            atomic.lazySet(20); // 性能更好，但可见性保证较弱
            
            /*
            适用场景：
            - 单生产者-多消费者队列
            - 统计计数（最终一致性即可）
            - 清理资源（不需要立即可见）
            */
        }
    }
    
    // 问题4：ABA检测开销
    public static class ABADetectionCost {
        /*
        AtomicStampedReference vs AtomicReference：
        - AtomicStampedReference需要维护版本戳
        - 每次CAS都需要比较值和版本
        - 内存占用更大（对象引用 + int版本）
        */
        
        // 优化：只在必要时使用版本戳
        public void optimizeABAHandling() {
            // 场景1：只需要检测值变化
            AtomicReference<String> ref = new AtomicReference<>();
            // 开销小，但可能ABA问题
            
            // 场景2：需要完全避免ABA
            AtomicStampedReference<String> stampedRef = 
                new AtomicStampedReference<>(null, 0);
            // 开销大，但安全性高
            
            // 场景3：使用其他机制避免ABA
            // 比如使用唯一的ID，而不是重复利用的对象
        }
    }
    
    // 综合优化：根据场景选择合适的原子类
    public static class ChooseRightAtomic {
        /*
        选择指南：
        
        场景                     | 推荐                    | 理由
        ------------------------|------------------------|-----------------
        简单计数器，低竞争         | AtomicInteger/Long     | 实现简单
        高并发计数器              | LongAdder              | 分散竞争，性能高
        需要避免ABA问题           | AtomicStampedReference | 版本控制
        对象引用更新              | AtomicReference        | 引用更新
        数组元素原子更新          | AtomicIntegerArray     | 数组支持
        字段原子更新（反射）       | AtomicIntegerFieldUpdater | 已有对象字段更新
        统计求和，读多写少        | LongAccumulator        | 自定义累加函数
        
        性能排序（从高到低）：
        LongAdder → AtomicInteger（低竞争）→ AtomicStampedReference
        */
        
        // 性能基准测试
        public static void benchmark() {
            int threadCount = 100;
            int iterations = 1000000;
            
            // 测试AtomicLong
            AtomicLong atomicLong = new AtomicLong();
            testAtomic(atomicLong, threadCount, iterations, "AtomicLong");
            
            // 测试LongAdder
            LongAdder longAdder = new LongAdder();
            testAdder(longAdder, threadCount, iterations, "LongAdder");
            
            /*
            预期结果（高并发下）：
            AtomicLong: 5000ms
            LongAdder: 1000ms（快5倍）
            */
        }
        
        private static void testAtomic(AtomicLong atomic, int threads, 
                                       int iterations, String name) {
            // 测试代码...
        }
        
        private static void testAdder(LongAdder adder, int threads,
                                      int iterations, String name) {
            // 测试代码...
        }
    }
}
```

##### 追问3：AtomicStampedReference如何解决ABA问题？底层怎么实现的？

**AtomicStampedReference深度解析：**

```java
public class AtomicStampedReferenceDetail {
    // AtomicStampedReference源码解析（JDK 11简化版）
    public static class AtomicStampedReference<V> {
        
        // 内部Pair类，将引用和戳记打包在一起
        private static class Pair<T> {
            final T reference;
            final int stamp;
            
            private Pair(T reference, int stamp) {
                this.reference = reference;
                this.stamp = stamp;
            }
            
            static <T> Pair<T> of(T reference, int stamp) {
                return new Pair<>(reference, stamp);
            }
        }
        
        // volatile保证可见性
        private volatile Pair<V> pair;
        
        // 构造方法
        public AtomicStampedReference(V initialRef, int initialStamp) {
            pair = Pair.of(initialRef, initialStamp);
        }
        
        // 获取当前引用和戳记
        public V getReference() {
            return pair.reference;
        }
        
        public int getStamp() {
            return pair.stamp;
        }
        
        public V get(int[] stampHolder) {
            Pair<V> pair = this.pair;
            stampHolder[0] = pair.stamp;
            return pair.reference;
        }
        
        // 核心CAS方法：同时比较引用和戳记
        public boolean compareAndSet(V expectedReference, V newReference,
                                     int expectedStamp, int newStamp) {
            Pair<V> current = pair;
            
            return
                // 比较引用是否相等（使用==，不是equals！）
                expectedReference == current.reference &&
                // 比较戳记是否相等
                expectedStamp == current.stamp &&
                // 如果引用和戳记都没变，检查新值是否真的需要更新
                ((newReference == current.reference && 
                  newStamp == current.stamp) ||
                 // 执行CAS更新
                 casPair(current, Pair.of(newReference, newStamp)));
        }
        
        // 无条件设置新值
        public void set(V newReference, int newStamp) {
            Pair<V> current = pair;
            if (newReference != current.reference || newStamp != current.stamp) {
                pair = Pair.of(newReference, newStamp);
            }
        }
        
        // 尝试原子地设置戳记（引用不变）
        public boolean attemptStamp(V expectedReference, int newStamp) {
            Pair<V> current = pair;
            return expectedReference == current.reference &&
                (newStamp == current.stamp ||
                 casPair(current, Pair.of(expectedReference, newStamp)));
        }
        
        // 底层CAS操作
        private boolean casPair(Pair<V> expect, Pair<V> update) {
            return U.compareAndSwapObject(this, PAIR, expect, update);
        }
        
        // Unsafe相关
        private static final sun.misc.Unsafe U = sun.misc.Unsafe.getUnsafe();
        private static final long PAIR;
        
        static {
            try {
                PAIR = U.objectFieldOffset
                    (AtomicStampedReference.class.getDeclaredField("pair"));
            } catch (ReflectiveOperationException e) {
                throw new Error(e);
            }
        }
    }
    
    // AtomicStampedReference vs AtomicMarkableReference
    public static class StampVsMark {
        /*
        AtomicStampedReference：使用int戳记（版本号）
          优点：可以记录修改次数，检测更精确
          缺点：内存开销稍大（int + 引用）
          
        AtomicMarkableReference：使用boolean标记
          优点：内存开销小
          缺点：只能表示两种状态（标记/未标记）
          
        选择：
        - 需要完整版本历史 → AtomicStampedReference
        - 只需要二元状态（如"已处理/未处理"） → AtomicMarkableReference
        */
        
        public void compare() {
            // 场景：实现一个简单的锁
            AtomicStampedReference<Thread> ownerStamp = 
                new AtomicStampedReference<>(null, 0);
            
            AtomicMarkableReference<Thread> ownerMark = 
                new AtomicMarkableReference<>(null, false);
            
            // 获取锁（使用戳记）
            public boolean tryLockWithStamp() {
                Thread current = Thread.currentThread();
                int[] stampHolder = new int[1];
                Thread owner = ownerStamp.get(stampHolder);
                
                if (owner == null) {
                    return ownerStamp.compareAndSet(null, current, 
                                                    stampHolder[0], stampHolder[0] + 1);
                } else if (owner == current) {
                    // 重入锁：增加戳记
                    ownerStamp.set(current, stampHolder[0] + 1);
                    return true;
                }
                return false;
            }
            
            // 获取锁（使用标记）
            public boolean tryLockWithMark() {
                Thread current = Thread.currentThread();
                boolean[] markHolder = new boolean[1];
                Thread owner = ownerMark.get(markHolder);
                
                if (owner == null) {
                    return ownerMark.compareAndSet(null, current, false, true);
                }
                return false; // 不支持重入！
            }
        }
    }
    
    // 实际应用：无锁队列实现
    public static class LockFreeQueue<E> {
        private static class Node<E> {
            final E item;
            final AtomicStampedReference<Node<E>> next;
            
            Node(E item, Node<E> next) {
                this.item = item;
                this.next = new AtomicStampedReference<>(next, 0);
            }
        }
        
        private final AtomicStampedReference<Node<E>> head;
        private final AtomicStampedReference<Node<E>> tail;
        
        public LockFreeQueue() {
            Node<E> dummy = new Node<>(null, null);
            head = new AtomicStampedReference<>(dummy, 0);
            tail = new AtomicStampedReference<>(dummy, 0);
        }
        
        public void enqueue(E item) {
            Node<E> newNode = new Node<>(item, null);
            int[] tailStamp = new int[1];
            
            while (true) {
                Node<E> curTail = tail.get(tailStamp);
                Node<E> tailNext = curTail.next.getReference();
                
                if (curTail == tail.getReference()) {
                    if (tailNext == null) {
                        // 尝试链接新节点
                        if (curTail.next.compareAndSet(null, newNode, 
                                                      tailStamp[0], tailStamp[0] + 1)) {
                            // 成功，尝试移动tail指针
                            tail.compareAndSet(curTail, newNode, 
                                              tailStamp[0], tailStamp[0] + 1);
                            break;
                        }
                    } else {
                        // 帮助其他线程完成操作
                        tail.compareAndSet(curTail, tailNext, 
                                          tailStamp[0], tailStamp[0] + 1);
                    }
                }
            }
        }
        
        public E dequeue() {
            int[] headStamp = new int[1];
            
            while (true) {
                Node<E> curHead = head.get(headStamp);
                Node<E> curTail = tail.getReference();
                Node<E> headNext = curHead.next.getReference();
                
                if (curHead == head.getReference()) {
                    if (curHead == curTail) {
                        if (headNext == null) {
                            return null; // 队列为空
                        }
                        // 帮助移动tail
                        tail.compareAndSet(curTail, headNext, 
                                          headStamp[0], headStamp[0] + 1);
                    } else {
                        E item = headNext.item;
                        if (head.compareAndSet(curHead, headNext, 
                                              headStamp[0], headStamp[0] + 1)) {
                            return item;
                        }
                    }
                }
            }
        }
    }
}
```

##### 追问4：CAS在分布式系统和数据库中有类似实现吗？

**CAS的分布式扩展：**

```java
public class DistributedCAS {
    /*
    单机CAS vs 分布式CAS：
    
    单机CAS：依赖CPU的原子指令，保证单机内存的原子性
    分布式CAS：需要分布式协议，保证多节点的一致性
    
    分布式CAS的实现方案：
    1. 分布式锁（Redis/ZooKeeper）
    2. 乐观锁（数据库版本号）
    3. 分布式事务（2PC/3PC）
    4. 共识算法（Paxos/Raft）
    */
    
    // 方案1：基于Redis的分布式CAS
    public static class RedisDistributedCAS {
        /*
        Redis支持原子操作：WATCH/MULTI/EXEC
        类似乐观锁的实现
        */
        
        public boolean compareAndSet(String key, String expect, String update) {
            Jedis jedis = jedisPool.getResource();
            try {
                // 1. 监视key
                jedis.watch(key);
                
                // 2. 获取当前值
                String current = jedis.get(key);
                
                // 3. 比较值
                if (!expect.equals(current)) {
                    jedis.unwatch();
                    return false;
                }
                
                // 4. 开启事务
                Transaction tx = jedis.multi();
                tx.set(key, update);
                
                // 5. 执行事务（如果key被修改，事务会失败）
                List<Object> results = tx.exec();
                
                return results != null && !results.isEmpty();
            } finally {
                jedis.close();
            }
        }
        
        // Redis 6.2+ 支持CAS命令（CAS扩展）
        public boolean compareAndSetV6(String key, String expect, String update) {
            // Redis 6.2新增：CAS命令
            // SET key value [CAS expect] [GET]
            // 但需要Redis模块支持
            return false;
        }
    }
    
    // 方案2：基于数据库乐观锁的分布式CAS
    public static class DatabaseOptimisticLock {
        /*
        使用版本号实现乐观锁
        类似AtomicStampedReference的思想
        */
        
        @Table(name = "account")
        static class Account {
            @Id
            private Long id;
            private BigDecimal balance;
            @Version  // JPA乐观锁注解
            private Integer version; // 版本号
            
            // 基于版本的CAS更新
            public boolean transferCAS(BigDecimal amount) {
                // SQL: UPDATE account SET balance = ?, version = version + 1 
                //      WHERE id = ? AND version = ?
                // 返回值：影响的行数
                // 如果为0，说明版本不匹配（CAS失败）
                return executeUpdate() > 0;
            }
        }
        
        // 业务层实现
        @Service
        @Transactional
        public class AccountService {
            public boolean transfer(Long fromId, Long toId, BigDecimal amount) {
                // 重试机制
                int retries = 3;
                while (retries-- > 0) {
                    Account from = accountRepository.findById(fromId).orElse(null);
                    Account to = accountRepository.findById(toId).orElse(null);
                    
                    if (from == null || to == null || from.getBalance().compareTo(amount) < 0) {
                        return false;
                    }
                    
                    // 扣款
                    from.setBalance(from.getBalance().subtract(amount));
                    // 使用版本号CAS
                    if (accountRepository.updateWithVersion(from) > 0) {
                        // 存款（同样需要CAS）
                        to.setBalance(to.getBalance().add(amount));
                        if (accountRepository.updateWithVersion(to) > 0) {
                            return true;
                        }
                    }
                    
                    // CAS失败，重试
                }
                return false;
            }
        }
    }
    
    // 方案3：基于ZooKeeper的分布式CAS
    public static class ZooKeeperDistributedCAS {
        /*
        ZooKeeper的CAS特性：
        1. 每个znode有版本号（类似AtomicStampedReference）
        2. setData操作可以指定版本
        3. 如果版本不匹配，操作失败
        */
        
        public boolean compareAndSet(String path, byte[] expect, byte[] update) 
                throws KeeperException, InterruptedException {
            ZooKeeper zk = zkClient.get();
            Stat stat = new Stat();
            
            try {
                // 获取当前数据和版本
                byte[] current = zk.getData(path, false, stat);
                
                // 比较数据
                if (!Arrays.equals(expect, current)) {
                    return false;
                }
                
                // CAS更新（指定版本）
                zk.setData(path, update, stat.getVersion());
                return true;
            } catch (KeeperException.BadVersionException e) {
                // 版本不匹配，CAS失败
                return false;
            }
        }
    }
    
    // 方案4：ETCD的分布式事务（类似CAS）
    public static class EtcdDistributedCAS {
        /*
        ETCD的CAS操作：
        支持条件更新：if value == "foo" then set value = "bar"
        使用gRPC API实现
        */
        
        public boolean compareAndSwap(String key, String expect, String update) {
            // ETCD v3 API
            // 使用事务（Transaction）
            // 比较key的当前值，如果匹配则更新
            return false;
        }
    }
    
    // 方案5：自定义分布式CAS协议
    public static class CustomDistributedCAS {
        /*
        基于Paxos/Raft实现分布式CAS
        
        基本思想：
        1. 客户端发送CAS请求到多数节点
        2. 每个节点验证本地值
        3. 多数节点同意则提交
        4. 所有节点应用更新
        */
        
        static class DistributedValue {
            String value;
            long version; // 逻辑时钟
            long timestamp; // 物理时间
        }
        
        // 两阶段提交实现分布式CAS
        public boolean twoPhaseCAS(DistributedValue expect, DistributedValue update) {
            // 阶段1：准备阶段
            boolean prepared = preparePhase(expect, update);
            if (!prepared) {
                return false;
            }
            
            // 阶段2：提交阶段
            return commitPhase(update);
        }
        
        private boolean preparePhase(DistributedValue expect, DistributedValue update) {
            // 向所有节点发送准备请求
            // 每个节点检查本地值是否匹配expect
            // 如果多数节点同意，进入下一阶段
            return true;
        }
        
        private boolean commitPhase(DistributedValue update) {
            // 向所有节点发送提交请求
            // 应用update到本地
            return true;
        }
    }
}
```

##### 追问5：Java中除了Unsafe，还有其他方式实现CAS吗？

**Java中CAS的替代方案：**

```java
public class CASAlternatives {
    /*
    Java中实现原子操作的其他方式：
    1. synchronized关键字（悲观锁）
    2. Lock接口（ReentrantLock等）
    3. VarHandle（Java 9+）
    4. 字段更新器（Atomic*FieldUpdater）
    5. 并发集合（ConcurrentHashMap等）
    6. 累加器（LongAdder等）
    */
    
    // 方案1：synchronized（悲观锁）
    public static class SynchronizedCounter {
        private int count = 0;
        
        // synchronized保证原子性
        public synchronized void increment() {
            count++; // 原子操作
        }
        
        public synchronized int get() {
            return count;
        }
        
        /*
        优点：
        - 简单易用
        - 保证原子性和可见性
        - 支持重入
        
        缺点：
        - 性能开销（上下文切换）
        - 可能死锁
        - 不灵活（锁粒度大）
        */
    }
    
    // 方案2：ReentrantLock（显式锁）
    public static class LockCounter {
        private int count = 0;
        private final ReentrantLock lock = new ReentrantLock();
        
        public void increment() {
            lock.lock();
            try {
                count++;
            } finally {
                lock.unlock();
            }
        }
        
        /*
        优点：
        - 更灵活（可尝试获取锁、可中断、可超时）
        - 可公平/非公平
        - 支持多个条件变量
        
        缺点：
        - 需要手动释放锁
        - 代码更复杂
        */
    }
    
    // 方案3：VarHandle（Java 9+，官方推荐替代Unsafe）
    public static class VarHandleCounter {
        private static int count = 0;
        private static final VarHandle COUNT_HANDLE;
        
        static {
            try {
                COUNT_HANDLE = MethodHandles
                    .lookup()
                    .findVarHandle(VarHandleCounter.class, "count", int.class);
            } catch (Exception e) {
                throw new Error(e);
            }
        }
        
        // 使用VarHandle实现CAS
        public boolean incrementCAS() {
            int current;
            do {
                current = (int) COUNT_HANDLE.getVolatile(this);
            } while (!COUNT_HANDLE.compareAndSet(this, current, current + 1));
            return true;
        }
        
        /*
        VarHandle vs Unsafe：
        
        优点：
        - 类型安全（编译时检查）
        - 访问控制（遵循Java访问规则）
        - 官方支持，API稳定
        - 内存排序语义更清晰
        
        功能：
        - get/set（普通/volatile）
        - compareAndSet（CAS）
        - getAndAdd（原子增减）
        - getAndBitwiseOr/And/Xor（位操作）
        */
    }
    
    // 方案4：字段更新器（Atomic*FieldUpdater）
    public static class FieldUpdaterCounter {
        private volatile int count = 0;
        
        // 创建字段更新器
        private static final AtomicIntegerFieldUpdater<FieldUpdaterCounter> UPDATER =
            AtomicIntegerFieldUpdater.newUpdater(FieldUpdaterCounter.class, "count");
        
        public void increment() {
            UPDATER.incrementAndGet(this);
        }
        
        /*
        适用场景：
        - 已有的类需要原子操作，但不能修改为AtomicInteger
        - 需要节省内存（比AtomicInteger对象开销小）
        - 大量实例需要原子字段
        
        限制：
        - 字段必须是volatile
        - 不能是private（除非在同一个类中）
        - 只能用于实例字段
        */
    }
    
    // 方案5：并发集合的内部机制
    public static class ConcurrentCollectionCAS {
        /*
        ConcurrentHashMap的替代方案：
        
        1. 使用ConcurrentHashMap的compute方法
        2. 内部使用CAS+synchronized
        */
        
        public void updateWithConcurrentMap() {
            ConcurrentHashMap<String, AtomicInteger> map = new ConcurrentHashMap<>();
            
            // 原子更新
            map.compute("key", (k, v) -> {
                if (v == null) {
                    return new AtomicInteger(1);
                } else {
                    v.incrementAndGet();
                    return v;
                }
            });
            
            // 或者使用merge（更简洁）
            map.merge("key", new AtomicInteger(1), (oldVal, newVal) -> {
                oldVal.incrementAndGet();
                return oldVal;
            });
        }
    }
    
    // 方案6：LongAdder（高并发计数器）
    public static class LongAdderAlternative {
        /*
        LongAdder的核心思想：分散竞争
        
        适用场景：高并发统计，读少写多
        不适用：需要精确实时读取的场景
        */
        
        public void benchmarkCounters() {
            int threadCount = 100;
            int iterations = 1000000;
            
            // AtomicLong在高并发下的性能问题
            AtomicLong atomicLong = new AtomicLong();
            long start = System.currentTimeMillis();
            parallelIncrement(atomicLong::incrementAndGet, threadCount, iterations);
            long atomicTime = System.currentTimeMillis() - start;
            
            // LongAdder的性能优势
            LongAdder longAdder = new LongAdder();
            start = System.currentTimeMillis();
            parallelIncrement(longAdder::increment, threadCount, iterations);
            long adderTime = System.currentTimeMillis() - start;
            
            System.out.println("AtomicLong: " + atomicTime + "ms");
            System.out.println("LongAdder: " + adderTime + "ms");
        }
        
        private void parallelIncrement(Runnable increment, int threads, int iterations) {
            // 并发测试代码
        }
    }
    
    // 选择指南
    public static class SelectionGuide {
        /*
        如何选择原子操作方案：
        
        场景                          | 推荐方案               | 理由
        ------------------------------|------------------------|------------------------
        简单的计数器，低竞争           | AtomicInteger         | 简单直接
        高并发计数器                  | LongAdder             | 性能最优
        已有类的volatile字段          | Atomic*FieldUpdater   | 无需修改类结构
        Java 9+，需要类型安全         | VarHandle             | 安全，未来趋势
        需要复杂同步逻辑              | synchronized/Lock     | 功能强大
        分布式环境                    | 分布式锁/数据库乐观锁   | 跨JVM
        集合元素的原子更新            | 并发集合的原子方法      | 集成度高
        
        性能排序（从高到低）：
        1. LongAdder（高并发写）
        2. VarHandle（Java 9+）
        3. AtomicInteger（低竞争）
        4. 字段更新器
        5. synchronized（优化后）
        6. Lock
        */
    }
}
```

#### 总结层：一句话核心记忆

**对于3年经验后端工程师**：记住CAS是 **"比较并交换"** 的原子操作，通过 **CPU指令保证原子性**，Java中通过 **Unsafe类** 提供支持，**Atomic类基于CAS实现无锁并发**，但要注意 **ABA问题**（通过版本戳解决），在高竞争场景下 **LongAdder性能更好**，现代Java推荐使用 **VarHandle替代Unsafe**。



### **题目7：ReentrantLock与synchronized的区别与选择**
#### 原理层：从字节码到操作系统调度的完整链条

##### 1. synchronized的JVM实现原理

```java
// synchronized的三种使用方式
public class SynchronizedExample {
    // 1. 实例方法同步：锁是当前实例对象
    public synchronized void instanceMethod() {
        // 临界区
    }
    
    // 2. 静态方法同步：锁是当前类的Class对象
    public static synchronized void staticMethod() {
        // 临界区
    }
    
    // 3. 同步代码块：锁是括号里的对象
    public void blockMethod() {
        synchronized (this) {  // 锁对象可以是任意Object
            // 临界区
        }
    }
}
```

**synchronized的字节码实现：**

```java
// synchronized代码块的字节码分析
public void syncMethod();
  Code:
     0: aload_0               // 加载this到操作数栈
     1: dup                   // 复制栈顶值（this）
     2: astore_1              // 存储到局部变量表slot 1（用作锁对象）
     3: monitorenter          // 进入监视器（获取锁）
     4: getstatic     #2      // 获取静态字段
     7: iconst_1
     8: invokevirtual #3      // 调用方法
    11: aload_1               // 加载锁对象
    12: monitorexit           // 退出监视器（释放锁）
    13: goto          21
    16: astore_2              // 异常处理开始
    17: aload_1               // 加载锁对象
    18: monitorexit           // 确保异常时释放锁
    19: aload_2
    20: athrow
    21: return               // 正常返回
    
// monitorenter/monitorexit指令：
// 1. monitorenter：尝试获取对象的监视器锁
// 2. monitorexit：释放对象的监视器锁
// 3. 每个对象都有个monitor（监视器）关联
```

**synchronized锁的升级过程（JDK 6+优化）：**

```
synchronized锁状态变迁（偏向锁→轻量级锁→重量级锁）：

初始状态：无锁
   ↓ (第一个线程访问)
偏向锁（Biased Locking）：线程ID记录在对象头
   ↓ (第二个线程竞争)
轻量级锁（Lightweight Locking）：自旋CAS竞争
   ↓ (自旋超过阈值或竞争激烈)
重量级锁（Heavyweight Locking）：操作系统mutex，线程进入阻塞队列

对象头（Mark Word）布局：
┌─────────────────────────────────────────────────────────┐
│                      32/64位 Mark Word                  │
├─────────┬─────────┬─────────┬─────────┬─────────────────┤
│ 锁状态  │  25位   │   4位   │   1位   │      2位        │
│         │         │         │biased   │    lock         │
├─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ 无锁    │unused   | 对象分代│   0     │      01         │
│ 偏向锁  │线程ID   | Epoch   │   1     │      01         │
│ 轻量级锁│指向栈中锁记录的指针            │      00         │
│ 重量级锁│指向互斥量（monitor）的指针      │      10         │
│ GC标记  │空       │         │         │      11         │
└─────────┴─────────┴─────────┴─────────┴─────────────────┘
```

##### 2. ReentrantLock的AQS实现原理

```java
// ReentrantLock的核心：基于AQS（AbstractQueuedSynchronizer）
public class ReentrantLock implements Lock, java.io.Serializable {
    
    private final Sync sync;  // 继承自AQS的同步器
    
    // 内部同步器实现
    abstract static class Sync extends AbstractQueuedSynchronizer {
        // 尝试获取非公平锁
        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();  // AQS的state字段，0表示未锁定
            
            if (c == 0) {
                // CAS尝试获取锁
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);  // 设置独占线程
                    return true;
                }
            }
            // 重入：如果当前线程已经持有锁
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;  // 增加重入次数
                setState(nextc);  // 更新状态
                return true;
            }
            return false;
        }
        
        // 释放锁
        protected final boolean tryRelease(int releases) {
            int c = getState() - releases;
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            
            boolean free = false;
            if (c == 0) {
                free = true;
                setExclusiveOwnerThread(null);
            }
            setState(c);
            return free;
        }
    }
    
    // 非公平锁实现
    static final class NonfairSync extends Sync {
        protected final boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }
    
    // 公平锁实现
    static final class FairSync extends Sync {
        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            
            if (c == 0) {
                // 公平锁：先检查队列中是否有等待线程
                if (!hasQueuedPredecessors() && 
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            // 重入逻辑与非公平锁相同
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                setState(nextc);
                return true;
            }
            return false;
        }
    }
}
```

**AQS队列结构：**

```
ReentrantLock的AQS队列（CLH变体）：
┌─────────────────────────────────────────────────────┐
│                AbstractQueuedSynchronizer            │
├─────────────────────────────────────────────────────┤
│  volatile int state;     // 同步状态                │
│  Node head;              // 队列头（虚拟节点）       │
│  Node tail;              // 队列尾                  │
└─────────────────────────────────────────────────────┘
                            ↓
            ┌─────────────────────────────┐
            │           Node              │
            ├─────────────────────────────┤
            │  Thread thread;             │
            │  Node prev;                 │
            │  Node next;                 │
            │  int waitStatus;            │
            │     CANCELLED = 1;          │
            │     SIGNAL    = -1;         │
            │     CONDITION = -2;         │
            │     PROPAGATE = -3;         │
            └─────────────────────────────┘

线程获取锁失败时的入队流程：
1. 创建Node节点，封装当前线程
2. 将节点CAS添加到队列尾部
3. 自旋检查前驱节点是否为头节点
4. 如果是头节点，尝试获取锁
5. 如果不是，根据waitStatus决定是否阻塞（LockSupport.park()）
```

##### 3. 两种锁的性能对比演化

```java
// 性能对比的历史演进
public class LockPerformanceEvolution {
    /*
    JDK 1.5之前：synchronized性能较差
       原因：直接使用操作系统mutex，用户态-内核态切换开销大
        
    JDK 1.5：ReentrantLock性能优势明显
       原因：AQS实现，大部分时间在用户态自旋
        
    JDK 1.6+：synchronized大幅优化
       引入：偏向锁、轻量级锁、适应性自旋、锁消除、锁粗化
        
    当前（JDK 11+）性能对比：
       低竞争场景：synchronized稍好（JVM优化）
       高竞争场景：ReentrantLock更灵活可控
    */
    
    // 性能基准测试
    public static void benchmark() throws InterruptedException {
        int threadCount = 100;
        int iterations = 1000000;
        
        // 测试synchronized
        long syncTime = testSynchronized(threadCount, iterations);
        
        // 测试ReentrantLock
        long lockTime = testReentrantLock(threadCount, iterations);
        
        System.out.printf("synchronized: %d ms%n", syncTime);
        System.out.printf("ReentrantLock: %d ms%n", lockTime);
        System.out.printf("性能差异: %.2f%%%n", 
            (double)(syncTime - lockTime) / syncTime * 100);
    }
    
    /*
    测试结果（典型）：
    低竞争（线程数≤CPU核心数）：
        synchronized: 1200ms
        ReentrantLock: 1100ms （synchronized略慢，但差距<10%）
        
    高竞争（线程数>>CPU核心数）：
        synchronized: 4500ms
        ReentrantLock: 2500ms （ReentrantLock优势明显）
    */
}
```

#### 场景层：业务中的正确选择

##### 场景1：高并发订单处理系统（ReentrantLock最佳实践）

```java
@Service
@Slf4j
public class OrderProcessingService {
    // 使用ReentrantLock的场景：需要细粒度控制、超时、公平性等高级特性
    
    // 订单处理锁：非公平锁（默认），提高吞吐量
    private final ReentrantLock orderLock = new ReentrantLock();
    
    // 订单队列锁：公平锁，保证FIFO顺序
    private final ReentrantLock queueLock = new ReentrantLock(true);
    
    // 订单处理条件：用于线程间协调
    private final Condition orderProcessed = orderLock.newCondition();
    private final Condition inventoryReady = orderLock.newCondition();
    
    /**
     * 处理订单 - 使用tryLock避免死锁
     */
    public boolean processOrderWithTimeout(Order order, long timeout, TimeUnit unit) {
        boolean locked = false;
        try {
            // 尝试获取锁，最多等待指定时间
            locked = orderLock.tryLock(timeout, unit);
            if (!locked) {
                log.warn("获取订单锁超时，订单ID：{}", order.getId());
                return false;
            }
            
            // 检查库存
            if (!checkInventory(order)) {
                log.info("库存不足，等待补货，订单ID：{}", order.getId());
                // 等待库存就绪（最多10秒）
                inventoryReady.await(10, TimeUnit.SECONDS);
                
                // 再次检查
                if (!checkInventory(order)) {
                    return false;
                }
            }
            
            // 扣减库存
            reduceInventory(order);
            
            // 创建订单
            createOrderRecord(order);
            
            // 通知其他线程订单已处理
            orderProcessed.signalAll();
            
            return true;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("订单处理被中断，订单ID：{}", order.getId(), e);
            return false;
        } finally {
            if (locked) {
                orderLock.unlock();
            }
        }
    }
    
    /**
     * 批量处理订单 - 使用lockInterruptibly支持中断
     */
    public void batchProcessOrders(List<Order> orders) throws InterruptedException {
        queueLock.lockInterruptibly();  // 可中断的获取锁
        try {
            for (Order order : orders) {
                processOrder(order);
                
                // 检查是否被中断
                if (Thread.currentThread().isInterrupted()) {
                    log.info("批量处理被中断，已处理{}个订单", orders.indexOf(order) + 1);
                    throw new InterruptedException();
                }
            }
        } finally {
            queueLock.unlock();
        }
    }
    
    /**
     * 获取锁状态监控信息
     */
    public LockMetrics getLockMetrics() {
        return new LockMetrics(
            orderLock.getQueueLength(),      // 等待队列长度
            orderLock.getHoldCount(),        // 当前线程重入次数
            orderLock.isLocked(),            // 是否被锁定
            orderLock.isFair(),              // 是否公平锁
            orderLock.hasQueuedThreads()     // 是否有等待线程
        );
    }
    
    /**
     * 死锁检测与恢复
     */
    public boolean detectAndRecoverDeadlock() {
        // 尝试获取锁，设置超时
        try {
            if (orderLock.tryLock(5, TimeUnit.SECONDS)) {
                try {
                    // 执行一些恢复操作
                    return recoverFromDeadlock();
                } finally {
                    orderLock.unlock();
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // 获取锁超时，可能发生死锁
        log.error("检测到可能的死锁，触发恢复机制");
        forceReleaseLocks();
        return false;
    }
    
    // 监控锁的使用情况
    @Scheduled(fixedRate = 60000)
    public void monitorLockContention() {
        if (orderLock.getQueueLength() > 10) {
            log.warn("订单锁竞争激烈，等待线程数：{}", orderLock.getQueueLength());
            // 可以触发动态扩容或限流
        }
    }
}
```

##### 场景2：配置信息缓存（synchronized最佳实践）

```java
@Component
@Slf4j
public class ConfigCacheService {
    // 使用synchronized的场景：简单的线程安全控制，代码简洁
    
    private volatile Map<String, Config> configCache;
    private volatile long lastUpdateTime;
    private final long refreshInterval = 300000; // 5分钟
    
    /**
     * 获取配置 - 使用double-checked locking模式
     */
    public Config getConfig(String key) {
        // 第一次检查（无锁，性能最好）
        Map<String, Config> cache = configCache;
        if (cache != null && cache.containsKey(key)) {
            return cache.get(key);
        }
        
        // 同步刷新缓存
        return refreshAndGetConfig(key);
    }
    
    /**
     * 刷新并获取配置 - synchronized保证原子性
     */
    private synchronized Config refreshAndGetConfig(String key) {
        // 第二次检查（持有锁）
        if (configCache != null && configCache.containsKey(key)) {
            return configCache.get(key);
        }
        
        // 检查是否需要刷新
        long currentTime = System.currentTimeMillis();
        if (configCache == null || currentTime - lastUpdateTime > refreshInterval) {
            refreshCache();
        }
        
        return configCache != null ? configCache.get(key) : null;
    }
    
    /**
     * 刷新缓存 - synchronized方法
     */
    private synchronized void refreshCache() {
        log.info("开始刷新配置缓存");
        try {
            // 模拟从数据库加载配置
            Map<String, Config> newCache = loadConfigsFromDB();
            
            // volatile写，保证可见性
            configCache = newCache;
            lastUpdateTime = System.currentTimeMillis();
            
            log.info("配置缓存刷新完成，共{}条配置", newCache.size());
        } catch (Exception e) {
            log.error("刷新配置缓存失败", e);
        }
    }
    
    /**
     * 批量更新配置 - synchronized代码块
     */
    public void updateConfigs(List<Config> configs) {
        // 使用更细粒度的锁对象
        Object lock = new Object();
        
        synchronized (lock) {
            // 先更新数据库
            updateConfigsInDB(configs);
            
            // 再更新缓存
            Map<String, Config> newCache = new HashMap<>(configCache);
            for (Config config : configs) {
                newCache.put(config.getKey(), config);
            }
            configCache = newCache;
        }
    }
    
    /**
     * 统计信息 - 不需要同步的读操作
     */
    public CacheStats getCacheStats() {
        // 只读操作，不需要加锁
        Map<String, Config> cache = configCache; // volatile读
        if (cache == null) {
            return new CacheStats(0, 0);
        }
        
        return new CacheStats(
            cache.size(),
            System.currentTimeMillis() - lastUpdateTime
        );
    }
    
    /**
     * 使用synchronized的wait/notify实现简单的生产者-消费者
     */
    public class ConfigUpdateNotifier {
        private boolean updated = false;
        
        public synchronized void waitForUpdate() throws InterruptedException {
            while (!updated) {
                wait(); // 释放锁并等待
            }
            updated = false;
        }
        
        public synchronized void notifyUpdate() {
            updated = true;
            notifyAll(); // 唤醒所有等待线程
        }
    }
    
    // 辅助方法
    private Map<String, Config> loadConfigsFromDB() {
        // 模拟数据库查询
        return new HashMap<>();
    }
    
    private void updateConfigsInDB(List<Config> configs) {
        // 模拟数据库更新
    }
}
```

##### 场景3：错误的锁选择（反例）

```java
// ❌ 反例1：在简单场景过度使用ReentrantLock
public class OverEngineeringExample {
    // 问题：简单的计数器场景，使用ReentrantLock过度复杂
    private final ReentrantLock counterLock = new ReentrantLock();
    private int count = 0;
    
    public void increment() {
        counterLock.lock();  // 不必要的复杂性
        try {
            count++;
        } finally {
            counterLock.unlock();
        }
        
        // ✅ 正确：使用synchronized或AtomicInteger
        // private final AtomicInteger count = new AtomicInteger(0);
        // public void increment() { count.incrementAndGet(); }
    }
}

// ❌ 反例2：synchronized误用导致死锁
public class DeadlockExample {
    private final Object lockA = new Object();
    private final Object lockB = new Object();
    
    public void method1() {
        synchronized (lockA) {      // 获取lockA
            // 一些操作...
            synchronized (lockB) {  // 尝试获取lockB
                // 危险：可能发生死锁
            }
        }
    }
    
    public void method2() {
        synchronized (lockB) {      // 获取lockB（不同顺序！）
            // 一些操作...
            synchronized (lockA) {  // 尝试获取lockA
                // 死锁！
            }
        }
    }
    
    // ✅ 正确：使用ReentrantLock的tryLock避免死锁
    public void safeMethod1() {
        if (lockA.tryLock()) {
            try {
                if (lockB.tryLock()) {
                    try {
                        // 临界区
                    } finally {
                        lockB.unlock();
                    }
                }
            } finally {
                lockA.unlock();
            }
        }
    }
}

// ❌ 反例3：忘记释放ReentrantLock
public class LockLeakExample {
    private final ReentrantLock lock = new ReentrantLock();
    
    public void process() {
        lock.lock();
        // 如果这里抛出异常，锁永远不会释放！
        doSomethingThatMightThrowException();
        lock.unlock();  // 可能永远不会执行
    }
    
    // ✅ 正确：使用try-finally确保释放
    public void safeProcess() {
        lock.lock();
        try {
            doSomethingThatMightThrowException();
        } finally {
            lock.unlock();  // 确保释放
        }
    }
    
    // ❌ 反例4：错误使用synchronized锁对象
    public class WrongLockObject {
        private Integer lock = 0;  // Integer对象可能被缓存/重用！
        
        public void wrongMethod() {
            synchronized (lock) {  // 危险：锁对象可能不是唯一的
                // ...
            }
        }
        
        // ✅ 正确：使用专门的锁对象
        private final Object lockObj = new Object();
        
        public void correctMethod() {
            synchronized (lockObj) {
                // ...
            }
        }
    }
    
    // ❌ 反例5：在频繁读、少量写的场景使用排他锁
    public class WrongReadWriteLock {
        private final ReentrantLock lock = new ReentrantLock();
        private Map<String, String> cache = new HashMap<>();
        
        // 读操作也加排他锁，性能差
        public String get(String key) {
            lock.lock();  // 读操作不应该阻塞其他读操作！
            try {
                return cache.get(key);
            } finally {
                lock.unlock();
            }
        }
        
        // ✅ 正确：使用ReadWriteLock
        public class CorrectReadWriteLock {
            private final ReentrantReadWriteLock rwLock = 
                new ReentrantReadWriteLock();
            private final Map<String, String> cache = new HashMap<>();
            
            public String get(String key) {
                rwLock.readLock().lock();  // 允许多个读线程同时访问
                try {
                    return cache.get(key);
                } finally {
                    rwLock.readLock().unlock();
                }
            }
            
            public void put(String key, String value) {
                rwLock.writeLock().lock();  // 写操作排他
                try {
                    cache.put(key, value);
                } finally {
                    rwLock.writeLock().unlock();
                }
            }
        }
    }
}
```

#### 追问层：面试官的深度连环问

##### 追问1：synchronized的锁优化具体是如何实现的？

**JDK 6+的锁优化技术详解：**

```java
public class SynchronizedOptimizations {
    /*
    JDK 6+对synchronized的优化（锁膨胀过程）：
    1. 偏向锁（Biased Locking）
    2. 轻量级锁（Lightweight Locking）
    3. 自旋锁（Spin Locking）
    4. 适应性自旋（Adaptive Spinning）
    5. 锁消除（Lock Elimination）
    6. 锁粗化（Lock Coarsening）
    */
    
    // 1. 偏向锁：适用于只有一个线程访问的场景
    public static class BiasedLockingExample {
        private static final Object lock = new Object();
        
        public void biasedLockDemo() {
            // 第一次执行时，JVM会启用偏向锁
            synchronized (lock) {
                // 对象头Mark Word记录线程ID
                // 以后该线程再进入时，只需检查线程ID是否匹配
                // 匹配则直接进入，不需要CAS操作
            }
        }
        
        /*
        偏向锁的撤销：
        当第二个线程尝试获取锁时，偏向锁升级为轻量级锁
        JVM需要暂停持有偏向锁的线程（安全点）
        检查线程状态，如果已退出同步块，则直接获取锁
        如果还在执行，则升级为轻量级锁
        */
    }
    
    // 2. 轻量级锁：适用于低竞争场景
    public static class LightweightLocking {
        /*
        轻量级锁原理：
        1. 在栈帧中创建锁记录（Lock Record）
        2. 将对象头Mark Word复制到锁记录（Displaced Mark Word）
        3. 使用CAS将对象头指向锁记录
        4. 如果成功，获取轻量级锁
        5. 如果失败，说明有竞争，升级为重量级锁
        
        轻量级锁解锁：
        1. 使用CAS将Displaced Mark Word替换回对象头
        2. 如果成功，解锁完成
        3. 如果失败，说明已升级为重量级锁，进入重量级锁解锁流程
        */
        
        // JVM参数控制
        public void jvmFlags() {
            /*
            -XX:+UseBiasedLocking          启用偏向锁（JDK 15后默认禁用）
            -XX:BiasedLockingStartupDelay=0 偏向锁启动延迟（默认4000ms）
            -XX:+UseSpinning               启用自旋锁（JDK 6后默认启用）
            -XX:PreBlockSpin=10            自旋次数默认值
            */
        }
    }
    
    // 3. 适应性自旋：JVM根据历史性能动态调整
    public static class AdaptiveSpinning {
        /*
        适应性自旋原理：
        1. 监控同一个锁的自旋等待成功率
        2. 如果成功率很高，增加自旋次数
        3. 如果成功率很低，减少自旋次数甚至不自旋
        4. 避免盲目自旋浪费CPU
        
        优点：
        - 高竞争时减少自旋，避免CPU浪费
        - 低竞争时适当自旋，避免线程切换开销
        */
    }
    
    // 4. 锁消除：JIT编译器的优化
    public static class LockElimination {
        // 示例：锁消除的场景
        public String concatString(String s1, String s2, String s3) {
            // StringBuffer是线程安全的，但这里不存在线程竞争
            StringBuffer sb = new StringBuffer();
            sb.append(s1);  // append方法有synchronized
            sb.append(s2);
            sb.append(s3);
            return sb.toString();
            
            /*
            JIT编译器分析：
            1. sb是局部变量，不会逃逸出方法
            2. 不可能被其他线程访问
            3. 因此锁是多余的，可以消除
            
            优化后等价于：
            StringBuilder sb = new StringBuilder();
            sb.append(s1);
            sb.append(s2);
            sb.append(s3);
            return sb.toString();
            */
        }
        
        // 需要开启逃逸分析
        public void escapeAnalysis() {
            /*
            -XX:+DoEscapeAnalysis    启用逃逸分析（默认开启）
            -XX:+EliminateLocks      启用锁消除（默认开启）
            */
        }
    }
    
    // 5. 锁粗化：将连续的锁操作合并
    public static class LockCoarsening {
        public void fineGrainedLocking() {
            // 细粒度锁：每次append都加锁解锁
            Object lock = new Object();
            for (int i = 0; i < 100; i++) {
                synchronized (lock) {
                    // 循环内的小操作
                    doSomething();
                }
            }
            
            /*
            JIT编译器优化（锁粗化）：
            将循环内的锁操作合并为一次
            
            优化后等价于：
            synchronized (lock) {
                for (int i = 0; i < 100; i++) {
                    doSomething();
                }
            }
            
            优点：减少锁获取/释放的开销
            缺点：锁持有时间变长，可能影响并发度
            */
        }
    }
    
    // 6. 锁升级的完整流程
    public static class LockUpgradePath {
        /*
        完整锁升级路径：
        
        开始 → 无锁状态
           ↓ (第一个线程访问)
        偏向锁（记录线程ID）
           ↓ (第二个线程竞争，但未同时)
        撤销偏向，升级为轻量级锁（CAS竞争）
           ↓ (自旋超过阈值或第三个线程竞争)
        升级为重量级锁（操作系统mutex）
           ↓ (所有线程释放锁)
        重置为无锁状态
        
        锁降级：
        重量级锁不能降级为轻量级锁
        偏向锁可以被撤销
        */
        
        // 查看对象头信息（需要依赖JOL库）
        public void inspectObjectHeader() {
            /*
            使用JOL（Java Object Layout）工具：
            
            // 添加依赖
            // implementation 'org.openjdk.jol:jol-core:0.16'
            
            import org.openjdk.jol.info.ClassLayout;
            
            Object obj = new Object();
            System.out.println(ClassLayout.parseInstance(obj).toPrintable());
            
            输出示例：
            java.lang.Object object internals:
            OFFSET  SIZE   TYPE DESCRIPTION        VALUE
                  0     4        (object header)   01 00 00 00 (00000001 ...)
                  4     4        (object header)   00 00 00 00 (00000000 ...)
                  8     4        (object header)   e5 01 00 f8 (11100101 ...)
             */
        }
    }
}
```

##### 追问2：ReentrantLock的公平锁和非公平锁有什么区别？如何选择？

**公平锁 vs 非公平锁深度分析：**

```java
public class FairVsNonfairLock {
    /*
    公平锁（Fair Lock）：按照线程请求锁的顺序分配锁
       先到先得，保证不会出现线程饥饿
        
    非公平锁（Nonfair Lock）：允许插队
       新请求的线程可能立即获得锁，即使有等待线程
       吞吐量更高，但可能造成线程饥饿
    */
    
    // 公平锁的实现原理
    public static class FairLockMechanism {
        // ReentrantLock的公平锁实现
        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            
            if (c == 0) {
                // 关键区别：检查是否有等待时间更长的线程
                if (!hasQueuedPredecessors() && 
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            // 重入逻辑相同...
            return false;
        }
        
        // hasQueuedPredecessors() 检查队列
        public final boolean hasQueuedPredecessors() {
            Node t = tail;
            Node h = head;
            Node s;
            return h != t &&
                ((s = h.next) == null || s.thread != Thread.currentThread());
        }
    }
    
    // 性能对比测试
    public static void performanceComparison() {
        /*
        测试场景：100个线程，每个线程获取释放锁10000次
        
        结果：
        公平锁：
          优点：线程平等，不会饥饿
          缺点：吞吐量低（需要维护队列，上下文切换多）
          耗时：约 2500ms
        
        非公平锁：
          优点：吞吐量高（减少上下文切换）
          缺点：可能线程饥饿
          耗时：约 1500ms （快40%）
        */
        
        // 公平锁测试
        ReentrantLock fairLock = new ReentrantLock(true);
        long fairTime = testLock(fairLock, 100, 10000);
        
        // 非公平锁测试
        ReentrantLock nonfairLock = new ReentrantLock(false);
        long nonfairTime = testLock(nonfairLock, 100, 10000);
        
        System.out.printf("公平锁: %d ms%n", fairTime);
        System.out.printf("非公平锁: %d ms%n", nonfairTime);
        System.out.printf("非公平锁快 %.1f%%%n", 
            (double)(fairTime - nonfairTime) / fairTime * 100);
    }
    
    // 选择指南
    public static class SelectionGuide {
        /*
        选择公平锁的场景：
        1. 需要保证线程不会饥饿
        2. 锁持有时间较长
        3. 请求频率较低
        4. 需要严格的FIFO顺序
        
        示例：
        - 数据库连接池分配
        - 任务调度系统
        - 打印队列
        
        选择非公平锁的场景：
        1. 追求高吞吐量
        2. 锁持有时间很短
        3. 请求频率很高
        4. 能容忍一定概率的线程饥饿
        
        示例：
        - 高并发计数器
        - 内存缓存
        - 大多数业务场景（默认选择）
        
        默认选择：非公平锁（ReentrantLock默认）
        原因：大多数情况下性能更好
        */
        
        // 实际业务示例
        public class TaskScheduler {
            // 任务调度需要公平性：先提交的任务先执行
            private final ReentrantLock fairLock = new ReentrantLock(true);
            private final Queue<Task> taskQueue = new LinkedList<>();
            
            public void submitTask(Task task) {
                fairLock.lock();
                try {
                    taskQueue.offer(task);
                } finally {
                    fairLock.unlock();
                }
            }
            
            public Task getNextTask() {
                fairLock.lock();
                try {
                    return taskQueue.poll(); // FIFO顺序保证
                } finally {
                    fairLock.unlock();
                }
            }
        }
        
        public class ConcurrentCounter {
            // 计数器追求高吞吐，不需要公平性
            private final ReentrantLock nonfairLock = new ReentrantLock();
            private int count = 0;
            
            public void increment() {
                nonfairLock.lock();
                try {
                    count++;
                } finally {
                    nonfairLock.unlock();
                }
            }
            
            // 更好的选择：使用LongAdder
            // private final LongAdder count = new LongAdder();
        }
    }
    
    // 饥饿问题演示
    public static void demonstrateStarvation() throws InterruptedException {
        ReentrantLock nonfairLock = new ReentrantLock(false);
        
        // 线程1：频繁获取释放锁
        Thread greedyThread = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                nonfairLock.lock();
                try {
                    // 持有锁很短时间
                    Thread.sleep(1);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    nonfairLock.unlock();
                }
            }
        });
        
        // 线程2：偶尔获取锁
        Thread starvedThread = new Thread(() -> {
            int successCount = 0;
            for (int i = 0; i < 100; i++) {
                if (nonfairLock.tryLock()) {
                    try {
                        successCount++;
                    } finally {
                        nonfairLock.unlock();
                    }
                }
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            System.out.println("饥饿线程成功次数: " + successCount);
        });
        
        greedyThread.start();
        starvedThread.start();
        
        greedyThread.join();
        starvedThread.join();
        
        /*
        可能输出：
        饥饿线程成功次数: 20（远低于期望）
        
        说明：非公平锁下，频繁请求的线程可能"霸占"锁
        导致其他线程饥饿
        */
    }
    
    // 混合策略：tryLock+公平性
    public static class HybridStrategy {
        private final ReentrantLock lock = new ReentrantLock(true);
        
        public boolean tryDoSomething(long timeout, TimeUnit unit) 
                throws InterruptedException {
            // 先尝试非公平获取（不排队）
            if (lock.tryLock()) {
                try {
                    return doSomething();
                } finally {
                    lock.unlock();
                }
            }
            
            // 失败后，公平地等待
            if (lock.tryLock(timeout, unit)) {
                try {
                    return doSomething();
                } finally {
                    lock.unlock();
                }
            }
            
            return false;
        }
        
        private boolean doSomething() {
            // 业务逻辑
            return true;
        }
    }
}
```

##### 追问3：Condition和Object的wait/notify有什么区别？

**Condition vs wait/notify深度对比：**

```java
public class ConditionVsWaitNotify {
    /*
    Condition接口 vs Object的wait/notify：
    
    相同点：都用于线程间协调，让线程等待某个条件满足
    
    不同点：
    1. 灵活性：一个Lock可以有多个Condition，Object只有一个等待队列
    2. 功能：Condition提供更丰富的等待方法（超时、可中断）
    3. 公平性：Condition支持公平或非公平
    4. 唤醒：Condition可以精确唤醒指定条件的线程
    */
    
    // 示例1：使用Object的wait/notify实现生产者-消费者
    public static class WaitNotifyBuffer {
        private final Queue<Integer> queue = new LinkedList<>();
        private final int capacity = 10;
        private final Object lock = new Object();
        
        public void produce(int item) throws InterruptedException {
            synchronized (lock) {
                // 使用while防止虚假唤醒
                while (queue.size() == capacity) {
                    lock.wait();  // 释放锁，进入等待队列
                }
                queue.offer(item);
                lock.notifyAll();  // 唤醒所有等待线程
            }
        }
        
        public Integer consume() throws InterruptedException {
            synchronized (lock) {
                while (queue.isEmpty()) {
                    lock.wait();
                }
                Integer item = queue.poll();
                lock.notifyAll();
                return item;
            }
        }
        
        /*
        问题：
        1. 所有线程都在同一个等待队列
        2. notifyAll()唤醒所有线程，可能唤醒错误类型的线程
        3. 只能有一个条件谓词（queue.size() == capacity 或 queue.isEmpty()）
        */
    }
    
    // 示例2：使用Condition实现生产者-消费者
    public static class ConditionBuffer {
        private final ReentrantLock lock = new ReentrantLock();
        private final Condition notFull = lock.newCondition();   // 队列未满条件
        private final Condition notEmpty = lock.newCondition();  // 队列非空条件
        private final Queue<Integer> queue = new LinkedList<>();
        private final int capacity = 10;
        
        public void produce(int item) throws InterruptedException {
            lock.lock();
            try {
                // 等待队列未满
                while (queue.size() == capacity) {
                    notFull.await();  // 释放锁，进入notFull条件队列
                }
                queue.offer(item);
                notEmpty.signal();  // 只唤醒一个消费者线程
            } finally {
                lock.unlock();
            }
        }
        
        public Integer consume() throws InterruptedException {
            lock.lock();
            try {
                // 等待队列非空
                while (queue.isEmpty()) {
                    notEmpty.await();  // 进入notEmpty条件队列
                }
                Integer item = queue.poll();
                notFull.signal();  // 只唤醒一个生产者线程
                return item;
            } finally {
                lock.unlock();
            }
        }
        
        /*
        优点：
        1. 两个条件队列：notFull和notEmpty
        2. signal()只唤醒对应条件的线程，更高效
        3. 支持超时和中断的await方法
        */
    }
    
    // Condition的高级功能
    public static class AdvancedCondition {
        private final ReentrantLock lock = new ReentrantLock(true); // 公平锁
        private final Condition condition = lock.newCondition();
        private boolean flag = false;
        
        // 1. 可中断的等待
        public void awaitInterruptibly() throws InterruptedException {
            lock.lock();
            try {
                while (!flag) {
                    condition.await();  // 可响应中断
                }
            } finally {
                lock.unlock();
            }
        }
        
        // 2. 超时等待
        public boolean awaitWithTimeout(long time, TimeUnit unit) 
                throws InterruptedException {
            lock.lock();
            try {
                return condition.await(time, unit);  // 返回是否超时
            } finally {
                lock.unlock();
            }
        }
        
        // 3. 不可中断的等待（不推荐）
        public void awaitUninterruptibly() {
            lock.lock();
            try {
                while (!flag) {
                    condition.awaitUninterruptibly();  // 不响应中断
                }
            } finally {
                lock.unlock();
            }
        }
        
        // 4. 精确唤醒
        public void signalSpecific() {
            lock.lock();
            try {
                flag = true;
                condition.signal();    // 只唤醒一个线程
                // condition.signalAll();  // 唤醒所有线程
            } finally {
                lock.unlock();
            }
        }
    }
    
    // 实际应用：线程池的任务队列
    public static class ThreadPoolTaskQueue {
        private final ReentrantLock lock = new ReentrantLock();
        private final Condition notEmpty = lock.newCondition();
        private final Condition notFull = lock.newCondition();
        private final BlockingQueue<Runnable> queue;
        
        public ThreadPoolTaskQueue(int capacity) {
            queue = new LinkedBlockingQueue<>(capacity);
        }
        
        public Runnable take() throws InterruptedException {
            lock.lock();
            try {
                while (queue.isEmpty()) {
                    notEmpty.await();
                }
                Runnable task = queue.poll();
                notFull.signal();
                return task;
            } finally {
                lock.unlock();
            }
        }
        
        public boolean offer(Runnable task, long timeout, TimeUnit unit) 
                throws InterruptedException {
            lock.lock();
            try {
                long nanos = unit.toNanos(timeout);
                while (queue.remainingCapacity() == 0) {
                    if (nanos <= 0) {
                        return false;  // 超时返回false
                    }
                    nanos = notFull.awaitNanos(nanos);  // 返回剩余时间
                }
                queue.offer(task);
                notEmpty.signal();
                return true;
            } finally {
                lock.unlock();
            }
        }
    }
    
    // 对比总结表
    public static class ComparisonTable {
        /*
        特性                | Object wait/notify       | Condition
        -------------------|--------------------------|------------------------
        等待队列数量        | 1个                      | 多个（每个Condition一个）
        精确唤醒            | 不支持（notifyAll）       | 支持（signal特定Condition）
        超时等待            | 不支持                    | 支持
        可中断等待          | 支持                      | 支持
        公平性              | 不支持                    | 支持（取决于Lock）
        虚假唤醒防护        | 需要while循环            | 需要while循环
        使用复杂度          | 简单                      | 复杂
        适用场景            | 简单同步                  | 复杂同步（如线程池）
        */
    }
}
```

##### 追问4：ReentrantLock如何实现可重入？与synchronized的重入有什么不同？

**可重入机制深度分析：**

```java
public class ReentrantMechanism {
    /*
    可重入锁（Reentrant Lock）：同一线程可以多次获取同一把锁
    
    ReentrantLock和synchronized都支持可重入，但实现方式不同
    */
    
    // synchronized的可重入实现（JVM级别）
    public static class SynchronizedReentrant {
        public synchronized void method1() {
            System.out.println("method1, 锁计数: " + getLockCount(this));
            method2();  // 重入：同一线程可以再次获取同一把锁
        }
        
        public synchronized void method2() {
            System.out.println("method2, 锁计数: " + getLockCount(this));
        }
        
        // JVM内部维护锁计数
        private native int getLockCount(Object obj);
        
        /*
        synchronized重入原理：
        1. 每个对象关联一个monitor（监视器）
        2. monitor维护锁计数（entry count）和持有线程
        3. 同一线程每次进入，计数+1
        4. 退出时计数-1，计数为0时释放锁
        
        对象头Mark Word中的重入信息：
        轻量级锁：通过栈帧中的Lock Record链记录重入次数
        重量级锁：monitor对象中的_count字段记录重入次数
        */
    }
    
    // ReentrantLock的可重入实现（AQS级别）
    public static class ReentrantLockReentrant {
        // AQS的state字段用于记录重入次数
        abstract static class Sync extends AbstractQueuedSynchronizer {
            // 非公平锁获取
            final boolean nonfairTryAcquire(int acquires) {
                final Thread current = Thread.currentThread();
                int c = getState();  // state=0：未锁定；state>0：重入次数
                
                if (c == 0) {
                    // 首次获取锁
                    if (compareAndSetState(0, acquires)) {
                        setExclusiveOwnerThread(current);
                        return true;
                    }
                }
                // 重入：检查当前线程是否已持有锁
                else if (current == getExclusiveOwnerThread()) {
                    int nextc = c + acquires;  // 增加重入次数
                    if (nextc < 0) // overflow
                        throw new Error("Maximum lock count exceeded");
                    setState(nextc);  // 不需要CAS，因为当前线程持有锁
                    return true;
                }
                return false;
            }
            
            // 释放锁
            protected final boolean tryRelease(int releases) {
                int c = getState() - releases;
                if (Thread.currentThread() != getExclusiveOwnerThread())
                    throw new IllegalMonitorStateException();
                
                boolean free = false;
                if (c == 0) {
                    free = true;
                    setExclusiveOwnerThread(null);  // 清除持有线程
                }
                setState(c);  // 更新重入次数
                return free;
            }
        }
        
        // 使用示例
        public void demonstrate() {
            ReentrantLock lock = new ReentrantLock();
            
            lock.lock();      // 第一次获取，state=1
            try {
                System.out.println("第一次获取锁");
                
                lock.lock();  // 第二次获取（重入），state=2
                try {
                    System.out.println("第二次获取锁（重入）");
                } finally {
                    lock.unlock();  // state=1
                }
            } finally {
                lock.unlock();  // state=0，释放锁
            }
        }
    }
    
    // 重入次数的限制
    public static class ReentrantLimit {
        /*
        ReentrantLock的最大重入次数：Integer.MAX_VALUE (2147483647)
        但实际上受限于栈深度，不可能达到
        
        synchronized理论上也没有硬性限制
        但两者都受栈深度限制（递归调用深度）
        */
        
        public void testReentrantLimit() {
            ReentrantLock lock = new ReentrantLock();
            int maxDepth = 0;
            
            try {
                // 尝试递归获取锁
                recursiveLock(lock, 0);
            } catch (Error e) {
                System.out.println("达到最大递归深度: " + maxDepth);
                // StackOverflowError先于锁计数溢出
            }
        }
        
        private void recursiveLock(ReentrantLock lock, int depth) {
            lock.lock();
            try {
                if (depth % 1000 == 0) {
                    System.out.println("深度: " + depth + ", state: " + 
                        getLockState(lock));
                }
                recursiveLock(lock, depth + 1);  // 递归调用
            } finally {
                lock.unlock();
            }
        }
        
        // 通过反射获取AQS的state字段
        private int getLockState(ReentrantLock lock) {
            try {
                Field syncField = ReentrantLock.class.getDeclaredField("sync");
                syncField.setAccessible(true);
                Object sync = syncField.get(lock);
                
                Field stateField = sync.getClass().getSuperclass()
                    .getDeclaredField("state");
                stateField.setAccessible(true);
                return stateField.getInt(sync);
            } catch (Exception e) {
                return -1;
            }
        }
    }
    
    // 重入锁的死锁问题
    public static class ReentrantDeadlock {
        // 可重入锁可以避免同一线程内的死锁
        public void avoidIntraThreadDeadlock() {
            Object lock = new Object();
            
            // 同一线程，不会死锁
            synchronized (lock) {
                synchronized (lock) {  // 重入，不会阻塞
                    System.out.println("同一线程重入，不会死锁");
                }
            }
            
            // 不同线程，会死锁
            new Thread(() -> {
                synchronized (lock) {
                    // 持有lock，等待lock（实际上不会等待）
                }
            }).start();
        }
        
        // 但可重入锁不能避免不同锁之间的死锁
        public void interLockDeadlock() {
            ReentrantLock lockA = new ReentrantLock();
            ReentrantLock lockB = new ReentrantLock();
            
            Thread t1 = new Thread(() -> {
                lockA.lock();
                try {
                    Thread.sleep(100);
                    lockB.lock();  // 等待t2释放lockB
                    try {
                        System.out.println("t1获取两把锁");
                    } finally {
                        lockB.unlock();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    lockA.unlock();
                }
            });
            
            Thread t2 = new Thread(() -> {
                lockB.lock();
                try {
                    Thread.sleep(100);
                    lockA.lock();  // 等待t1释放lockA
                    try {
                        System.out.println("t2获取两把锁");
                    } finally {
                        lockA.unlock();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    lockB.unlock();
                }
            });
            
            t1.start();
            t2.start();
            // 死锁！
        }
    }
    
    // 可重入性的重要性
    public static class ReentrantImportance {
        /*
        为什么需要可重入锁？
        
        场景1：递归调用
        public synchronized void recursiveMethod(int n) {
            if (n > 0) {
                recursiveMethod(n - 1);  // 需要重入
            }
        }
        
        场景2：回调
        public synchronized void methodA() {
            methodB();  // methodB也是synchronized，需要重入
        }
        
        场景3：继承
        class Parent {
            public synchronized void parentMethod() { ... }
        }
        
        class Child extends Parent {
            @Override
            public synchronized void parentMethod() {
                super.parentMethod();  // 需要重入父类的锁
                // 其他操作
            }
        }
        
        不可重入锁的问题：同一线程会自己阻塞自己
        */
        
        // 模拟不可重入锁（会死锁）
        public static class NonReentrantLock {
            private boolean isLocked = false;
            private Thread lockedBy = null;
            
            public synchronized void lock() throws InterruptedException {
                while (isLocked && Thread.currentThread() != lockedBy) {
                    wait();
                }
                isLocked = true;
                lockedBy = Thread.currentThread();
            }
            
            public synchronized void unlock() {
                if (Thread.currentThread() == lockedBy) {
                    isLocked = false;
                    lockedBy = null;
                    notify();
                }
            }
            
            // 使用这个锁会死锁
            public void problematicMethod() throws InterruptedException {
                lock();
                try {
                    lock();  // 第二次获取，会阻塞！
                } finally {
                    unlock();
                }
            }
        }
    }
}
```

##### 追问5：如何诊断和解决死锁问题？两种锁在这方面有什么不同？

**死锁诊断与解决方案：**

```java
public class DeadlockDiagnosis {
    /*
    死锁产生的四个必要条件（Coffman条件）：
    1. 互斥：资源不能被共享
    2. 持有并等待：线程持有资源并等待其他资源
    3. 不可剥夺：资源不能被强制剥夺
    4. 循环等待：线程之间形成环形等待链
    
    诊断工具：
    1. jstack（Java Stack Trace）
    2. JConsole/VisualVM
    3. ThreadMXBean（编程式检测）
    */
    
    // 使用ThreadMXBean检测死锁
    public static class ProgrammaticDeadlockDetection {
        public void detectDeadlock() {
            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            
            // 定期检查死锁
            ScheduledExecutorService scheduler = 
                Executors.newScheduledThreadPool(1);
            
            scheduler.scheduleAtFixedRate(() -> {
                long[] deadlockedThreads = threadMXBean.findDeadlockedThreads();
                if (deadlockedThreads != null && deadlockedThreads.length > 0) {
                    System.err.println("检测到死锁！");
                    
                    // 获取死锁线程信息
                    ThreadInfo[] threadInfos = threadMXBean
                        .getThreadInfo(deadlockedThreads, true, true);
                    
                    for (ThreadInfo threadInfo : threadInfos) {
                        System.err.println("死锁线程: " + threadInfo.getThreadName());
                        System.err.println("阻塞对象: " + threadInfo.getLockName());
                        System.err.println("阻塞线程: " + threadInfo.getLockOwnerName());
                        System.err.println("堆栈追踪:");
                        for (StackTraceElement element : threadInfo.getStackTrace()) {
                            System.err.println("\t" + element);
                        }
                    }
                    
                    // 触发恢复机制
                    recoverFromDeadlock(deadlockedThreads);
                }
            }, 0, 10, TimeUnit.SECONDS);
        }
        
        private void recoverFromDeadlock(long[] deadlockedThreads) {
            // 恢复策略1：中断一个线程（破坏循环等待）
            Thread thread = findThreadById(deadlockedThreads[0]);
            if (thread != null) {
                System.err.println("中断线程以解除死锁: " + thread.getName());
                thread.interrupt();
            }
            
            // 恢复策略2：强制释放锁（危险！）
            // 这需要深入JVM内部，通常不推荐
        }
        
        private Thread findThreadById(long threadId) {
            // 遍历所有线程查找
            Set<Thread> threadSet = Thread.getAllStackTraces().keySet();
            for (Thread thread : threadSet) {
                if (thread.getId() == threadId) {
                    return thread;
                }
            }
            return null;
        }
    }
    
    // synchronized死锁示例与诊断
    public static class SynchronizedDeadlock {
        private final Object lockA = new Object();
        private final Object lockB = new Object();
        
        public void method1() {
            synchronized (lockA) {
                System.out.println(Thread.currentThread().getName() + " 持有lockA");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                
                synchronized (lockB) {
                    System.out.println(Thread.currentThread().getName() + " 持有lockB");
                }
            }
        }
        
        public void method2() {
            synchronized (lockB) {
                System.out.println(Thread.currentThread().getName() + " 持有lockB");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                
                synchronized (lockA) {
                    System.out.println(Thread.currentThread().getName() + " 持有lockA");
                }
            }
        }
        
        /*
        jstack输出示例：
        
        Found one Java-level deadlock:
        =============================
        "Thread-1":
          waiting to lock monitor 0x00007f8b1c009c00 (object 0x000000076adab1d0, a java.lang.Object),
          which is held by "Thread-0"
        "Thread-0":
          waiting to lock monitor 0x00007f8b1c00af00 (object 0x000000076adab1e0, a java.lang.Object),
          which is held by "Thread-1"
        
        Java stack information for the threads listed above:
        Thread-1:
            at DeadlockExample.method2(DeadlockExample.java:30)
        Thread-0:
            at DeadlockExample.method1(DeadlockExample.java:18)
        */
    }
    
    // ReentrantLock死锁预防方案
    public static class ReentrantLockDeadlockPrevention {
        /*
        ReentrantLock提供的死锁预防机制：
        1. tryLock()：尝试获取锁，失败不阻塞
        2. tryLock(timeout)：超时获取
        3. lockInterruptibly()：可中断获取
        */
        
        private final ReentrantLock lockA = new ReentrantLock();
        private final ReentrantLock lockB = new ReentrantLock();
        
        // 方案1：使用tryLock避免死锁
        public void safeMethod1() {
            while (true) {
                if (lockA.tryLock()) {
                    try {
                        System.out.println("获取lockA");
                        
                        if (lockB.tryLock()) {
                            try {
                                System.out.println("获取lockB，执行操作");
                                return; // 成功获取两把锁
                            } finally {
                                lockB.unlock();
                            }
                        }
                    } finally {
                        lockA.unlock();
                    }
                }
                
                // 获取失败，随机退避避免活锁
                try {
                    Thread.sleep((long) (Math.random() * 100));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        // 方案2：使用超时tryLock
        public void safeMethod2() throws InterruptedException {
            if (lockA.tryLock(1, TimeUnit.SECONDS)) {
                try {
                    if (lockB.tryLock(1, TimeUnit.SECONDS)) {
                        try {
                            System.out.println("成功获取两把锁");
                        } finally {
                            lockB.unlock();
                        }
                    } else {
                        System.out.println("获取lockB超时");
                    }
                } finally {
                    lockA.unlock();
                }
            } else {
                System.out.println("获取lockA超时");
            }
        }
        
        // 方案3：固定顺序获取锁（破坏循环等待）
        public void safeMethod3() {
            // 总是先获取id小的锁
            ReentrantLock firstLock = (System.identityHashCode(lockA) < 
                                      System.identityHashCode(lockB)) ? lockA : lockB;
            ReentrantLock secondLock = (firstLock == lockA) ? lockB : lockA;
            
            firstLock.lock();
            try {
                secondLock.lock();
                try {
                    System.out.println("按固定顺序获取锁");
                } finally {
                    secondLock.unlock();
                }
            } finally {
                firstLock.unlock();
            }
        }
        
        // 方案4：使用锁的层级（Lock Hierarchy）
        public static class LockHierarchy {
            private static final Object[] LOCKS = new Object[10];
            static {
                for (int i = 0; i < LOCKS.length; i++) {
                    LOCKS[i] = new Object();
                }
            }
            
            public void process(int id1, int id2) {
                // 确保总是先获取序号小的锁
                int first = Math.min(id1, id2);
                int second = Math.max(id1, id2);
                
                synchronized (LOCKS[first]) {
                    synchronized (LOCKS[second]) {
                        // 临界区
                    }
                }
            }
        }
    }
    
    // 对比：synchronized vs ReentrantLock的死锁处理
    public static class DeadlockHandlingComparison {
        /*
        特性                | synchronized              | ReentrantLock
        -------------------|---------------------------|----------------------
        死锁检测            | 支持（jstack）            | 支持（jstack + 编程检测）
        死锁预防            | 有限（只能通过设计避免）    | 强（tryLock、超时、中断）
        死锁恢复            | 困难（需要外部干预）        | 相对容易（可中断、可超时）
        自动释放            | 自动（异常时JVM保证）      | 手动（必须finally中释放）
        调试支持            | 一般                      | 更好（可获取锁信息）
        */
        
        // synchronized的死锁恢复（困难）
        public void recoverSynchronizedDeadlock() {
            /*
            对于synchronized死锁，恢复选项有限：
            1. 重启JVM（最后手段）
            2. 使用JMX强制中断线程（危险）
            3. 设计时避免死锁
            
            无法像ReentrantLock那样优雅恢复
            */
        }
        
        // ReentrantLock的死锁恢复（相对容易）
        public void recoverReentrantLockDeadlock() {
            // 使用守护线程监控并恢复
            Thread watchdog = new Thread(() -> {
                while (true) {
                    if (detectDeadlock()) {
                        // 中断一个持有锁的线程
                        interruptLockHolder();
                    }
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        break;
                    }
                }
            });
            watchdog.setDaemon(true);
            watchdog.start();
        }
    }
    
    // 最佳实践：结合两种锁的优势
    public static class HybridApproach {
        /*
        实际项目中的建议：
        
        1. 简单同步场景 → synchronized
           - 方法级同步
           - 简单的代码块保护
           - 锁竞争不激烈
        
        2. 复杂同步场景 → ReentrantLock
           - 需要可中断、超时
           - 需要公平性
           - 需要多个条件队列
           - 需要尝试获取锁（tryLock）
        
        3. 高并发场景 → 考虑其他方案
           - 无锁数据结构（Atomic类）
           - 读写锁（ReadWriteLock）
           - 并发集合（ConcurrentHashMap）
        */
        
        // 示例：根据配置选择锁类型
        public class ConfigurableLock {
            private final boolean useReentrantLock;
            private final Object syncLock = new Object();
            private final ReentrantLock reentrantLock = new ReentrantLock();
            
            public ConfigurableLock(boolean useReentrantLock) {
                this.useReentrantLock = useReentrantLock;
            }
            
            public void execute(Runnable task) throws InterruptedException {
                if (useReentrantLock) {
                    // 使用ReentrantLock（带超时）
                    if (reentrantLock.tryLock(1, TimeUnit.SECONDS)) {
                        try {
                            task.run();
                        } finally {
                            reentrantLock.unlock();
                        }
                    } else {
                        throw new TimeoutException("获取锁超时");
                    }
                } else {
                    // 使用synchronized
                    synchronized (syncLock) {
                        task.run();
                    }
                }
            }
        }
    }
}
```

#### 总结层：一句话核心记忆

**对于3年经验后端工程师**：记住 **"synchronized是自动挡，简单安全但功能有限；ReentrantLock是手动挡，灵活强大但需小心驾驶"**。选择依据：**简单场景用synchronized（偏向锁优化后性能不差），复杂需求用ReentrantLock（可中断、超时、公平性、多条件），高并发考虑无锁或并发集合**，核心是理解业务场景的并发需求。



### **题目8：线程间通信方式（wait/notify、Condition、阻塞队列）**
#### 原理层：从JVM到AQS的通信机制

##### 1. wait/notify的JVM实现原理

```java
// wait/notify的底层机制
public class WaitNotifyMechanism {
    /*
    JVM层面的实现：
    1. 每个Java对象都有一个Monitor（监视器）
    2. Monitor包含：_owner（持有线程），_EntryList（同步队列），_WaitSet（等待队列）
    3. wait()：线程进入_WaitSet，释放锁
    4. notify()：从_WaitSet移动一个线程到_EntryList
    5. notifyAll()：移动所有_WaitSet线程到_EntryList
    */
    
    // JVM中的Monitor结构（C++伪代码）
    class ObjectMonitor {
        void* _owner;           // 持有锁的线程
        ObjectWaiter* _EntryList; // 竞争锁的线程队列
        ObjectWaiter* _WaitSet;   // 调用wait()的线程队列
        int _recursions;        // 重入次数
        int _count;             // 锁计数器
    }
    
    // wait()的JVM实现步骤
    public static void waitProcess() {
        /*
        步骤1：检查当前线程是否持有锁
        步骤2：保存线程状态，将当前线程加入_WaitSet
        步骤3：释放锁（monitorexit）
        步骤4：线程进入WAITING状态，等待被唤醒
        步骤5：被唤醒后，重新竞争锁（monitorenter）
        步骤6：从wait()返回，继续执行
        */
    }
    
    // notify()的JVM实现步骤
    public static void notifyProcess() {
        /*
        步骤1：从_WaitSet中取出一个线程
        步骤2：将该线程移动到_EntryList
        步骤3：被移动的线程状态变为BLOCKED
        步骤4：notify()返回，不释放锁
        */
    }
}
```

**wait/notify的线程状态流转图：**

```
线程状态流转：
┌─────────────┐     获取锁       ┌─────────────┐
│   RUNNABLE  │ ──────────────> │ 进入同步块   │
└─────────────┘                 └──────┬──────┘
        ↑                              │ 调用wait()
        │                              ↓
        │                        ┌─────────────┐
        │                        │   WAITING   │ ← 释放锁，进入_WaitSet
        │                        └──────┬──────┘
        │                              │ 被notify()
        │                              ↓
        │                        ┌─────────────┐
        │                        │  BLOCKED    │ ← 进入_EntryList，等待锁
        │                        └──────┬──────┘
        │                              │ 获取锁
        │  从wait()返回                 ↓
        └────────────────────────┌─────────────┐
                                 │   RUNNABLE  │
                                 └─────────────┘
```

##### 2. Condition的AQS实现原理

```java
// Condition的AQS实现
public class ConditionMechanism {
    /*
    Condition基于AQS（AbstractQueuedSynchronizer）实现：
    1. 每个Condition对象都有一个条件队列
    2. await()：释放锁，线程进入条件队列
    3. signal()：将条件队列的头节点移到同步队列
    */
    
    // AQS中的条件队列节点
    static class ConditionNode {
        Thread thread;           // 等待线程
        ConditionNode nextWaiter; // 条件队列的下一个节点
        int waitStatus;          // 等待状态
        Node predecessor;        // 前驱节点（用于条件队列转移）
    }
    
    // ConditionObject源码（简化）
    public class ConditionObject implements Condition {
        // 条件队列的头尾指针
        private transient Node firstWaiter;
        private transient Node lastWaiter;
        
        // await()方法实现
        public final void await() throws InterruptedException {
            if (Thread.interrupted())
                throw new InterruptedException();
            
            // 1. 创建新节点加入条件队列
            Node node = addConditionWaiter();
            
            // 2. 完全释放锁（考虑重入）
            int savedState = fullyRelease(node);
            
            // 3. 阻塞直到被signal()或中断
            while (!isOnSyncQueue(node)) {
                LockSupport.park(this);
                if (Thread.interrupted())
                    interruptAfterWait(node);
            }
            
            // 4. 重新获取锁
            acquireQueued(node, savedState);
        }
        
        // signal()方法实现
        public final void signal() {
            if (!isHeldExclusively())
                throw new IllegalMonitorStateException();
            
            Node first = firstWaiter;
            if (first != null)
                doSignal(first); // 转移第一个等待节点
        }
        
        private void doSignal(Node first) {
            do {
                // 从条件队列移除第一个节点
                if ((firstWaiter = first.nextWaiter) == null)
                    lastWaiter = null;
                first.nextWaiter = null;
                
                // 尝试将该节点转移到同步队列
                if (!transferForSignal(first) && firstWaiter != null)
                    first = firstWaiter; // 如果失败，尝试下一个
            } while (first != null);
        }
        
        // 将节点从条件队列移到同步队列
        final boolean transferForSignal(Node node) {
            // CAS修改节点状态
            if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
                return false;
            
            // 将节点加入同步队列尾部
            Node p = enq(node);
            int ws = p.waitStatus;
            
            // 唤醒线程
            if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
                LockSupport.unpark(node.thread);
            
            return true;
        }
    }
}
```

##### 3. 阻塞队列的实现原理

```java
// ArrayBlockingQueue的实现原理
public class BlockingQueueMechanism {
    /*
    阻塞队列的核心：生产者-消费者模型 + 条件等待
    使用ReentrantLock + Condition实现阻塞
    */
    
    // ArrayBlockingQueue源码（简化）
    public class ArrayBlockingQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
        
        // 存储元素的数组
        final Object[] items;
        
        // 锁和条件
        final ReentrantLock lock;
        private final Condition notEmpty; // 非空条件
        private final Condition notFull;  // 非满条件
        
        // 构造方法
        public ArrayBlockingQueue(int capacity, boolean fair) {
            this.items = new Object[capacity];
            this.lock = new ReentrantLock(fair);
            this.notEmpty = lock.newCondition();
            this.notFull = lock.newCondition();
        }
        
        // put方法：队列满时阻塞
        public void put(E e) throws InterruptedException {
            checkNotNull(e);
            final ReentrantLock lock = this.lock;
            lock.lockInterruptibly(); // 可中断获取锁
            try {
                while (count == items.length)
                    notFull.await(); // 等待队列不满
                enqueue(e); // 入队
            } finally {
                lock.unlock();
            }
        }
        
        // take方法：队列空时阻塞
        public E take() throws InterruptedException {
            final ReentrantLock lock = this.lock;
            lock.lockInterruptibly();
            try {
                while (count == 0)
                    notEmpty.await(); // 等待队列不空
                return dequeue(); // 出队
            } finally {
                lock.unlock();
            }
        }
        
        // 入队操作，唤醒消费者
        private void enqueue(E x) {
            final Object[] items = this.items;
            items[putIndex] = x;
            if (++putIndex == items.length)
                putIndex = 0;
            count++;
            notEmpty.signal(); // 唤醒等待的消费者
        }
        
        // 出队操作，唤醒生产者
        private E dequeue() {
            final Object[] items = this.items;
            @SuppressWarnings("unchecked")
            E x = (E) items[takeIndex];
            items[takeIndex] = null;
            if (++takeIndex == items.length)
                takeIndex = 0;
            count--;
            notFull.signal(); // 唤醒等待的生产者
            return x;
        }
    }
}
```

#### 场景层：业务中的实际应用

##### 场景1：任务调度系统（wait/notify最佳实践）

```java
@Component
@Slf4j
public class TaskScheduler {
    // 使用wait/notify实现简单的任务调度器
    
    private final List<Task> taskQueue = new ArrayList<>();
    private final Object lock = new Object();
    private volatile boolean shutdown = false;
    
    /**
     * 提交任务到队列
     */
    public void submitTask(Task task) {
        synchronized (lock) {
            taskQueue.add(task);
            lock.notifyAll(); // 通知等待的worker线程
            log.debug("提交任务: {}, 当前队列大小: {}", task.getId(), taskQueue.size());
        }
    }
    
    /**
     * 启动worker线程处理任务
     */
    public void startWorkers(int workerCount) {
        for (int i = 0; i < workerCount; i++) {
            Thread worker = new Thread(new Worker(i), "TaskWorker-" + i);
            worker.setDaemon(true);
            worker.start();
        }
    }
    
    /**
     * Worker线程：处理任务
     */
    private class Worker implements Runnable {
        private final int workerId;
        
        public Worker(int workerId) {
            this.workerId = workerId;
        }
        
        @Override
        public void run() {
            log.info("Worker-{} 启动", workerId);
            
            while (!shutdown) {
                Task task = null;
                
                synchronized (lock) {
                    // 等待任务到来
                    while (taskQueue.isEmpty() && !shutdown) {
                        try {
                            log.debug("Worker-{} 等待任务", workerId);
                            lock.wait(); // 释放锁，进入等待
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }
                    
                    if (shutdown && taskQueue.isEmpty()) {
                        return; // 关闭且队列为空，退出
                    }
                    
                    // 获取任务
                    task = taskQueue.remove(0);
                    log.debug("Worker-{} 获取任务: {}", workerId, task.getId());
                }
                
                // 执行任务（不在同步块内，避免阻塞其他worker）
                if (task != null) {
                    try {
                        processTask(task);
                    } catch (Exception e) {
                        log.error("Worker-{} 处理任务失败: {}", workerId, task.getId(), e);
                    }
                }
            }
        }
        
        private void processTask(Task task) {
            log.info("Worker-{} 开始处理任务: {}", workerId, task.getId());
            task.execute();
            log.info("Worker-{} 完成处理任务: {}", workerId, task.getId());
        }
    }
    
    /**
     * 获取任务队列状态（不阻塞的方法）
     */
    public TaskQueueStats getQueueStats() {
        synchronized (lock) {
            return new TaskQueueStats(
                taskQueue.size(),
                Thread.getAllStackTraces().keySet().stream()
                    .filter(t -> t.getName().startsWith("TaskWorker-"))
                    .count()
            );
        }
    }
    
    /**
     * 优雅关闭：等待所有任务完成
     */
    public void gracefulShutdown() throws InterruptedException {
        log.info("开始优雅关闭...");
        shutdown = true;
        
        synchronized (lock) {
            lock.notifyAll(); // 唤醒所有等待的worker
        }
        
        // 等待worker线程结束
        Set<Thread> workers = Thread.getAllStackTraces().keySet().stream()
            .filter(t -> t.getName().startsWith("TaskWorker-"))
            .collect(Collectors.toSet());
        
        for (Thread worker : workers) {
            worker.join(5000); // 等待5秒
            if (worker.isAlive()) {
                log.warn("Worker {} 未在5秒内结束，尝试中断", worker.getName());
                worker.interrupt();
            }
        }
        
        log.info("优雅关闭完成");
    }
    
    /**
     * 紧急关闭：丢弃所有未处理任务
     */
    public void emergencyShutdown() {
        log.warn("紧急关闭，丢弃 {} 个未处理任务", taskQueue.size());
        shutdown = true;
        
        synchronized (lock) {
            taskQueue.clear();
            lock.notifyAll(); // 唤醒所有worker，让它们退出
        }
    }
}
```

##### 场景2：连接池管理（Condition最佳实践）

```java
@Component
@Slf4j
public class DatabaseConnectionPool {
    // 使用Condition实现连接池，支持超时等待和公平性
    
    private final LinkedList<Connection> pool = new LinkedList<>();
    private final ReentrantLock lock = new ReentrantLock(true); // 公平锁
    private final Condition notEmpty = lock.newCondition();    // 连接可用条件
    private final Condition notFull = lock.newCondition();     // 池未满条件
    
    private final int maxSize;
    private final int timeoutSeconds;
    private int activeConnections = 0;
    
    public DatabaseConnectionPool(int maxSize, int timeoutSeconds) {
        this.maxSize = maxSize;
        this.timeoutSeconds = timeoutSeconds;
        
        // 初始化连接池
        for (int i = 0; i < Math.min(10, maxSize); i++) {
            pool.add(createConnection());
            activeConnections++;
        }
    }
    
    /**
     * 获取连接（支持超时）
     */
    public Connection getConnection() throws InterruptedException, TimeoutException {
        lock.lock();
        try {
            long nanos = TimeUnit.SECONDS.toNanos(timeoutSeconds);
            
            // 等待连接可用
            while (pool.isEmpty()) {
                if (nanos <= 0) {
                    throw new TimeoutException("获取连接超时");
                }
                nanos = notEmpty.awaitNanos(nanos); // 等待并返回剩余时间
            }
            
            // 从池中取出连接
            Connection conn = pool.removeFirst();
            log.debug("获取连接，剩余连接数: {}", pool.size());
            
            // 如果池中连接较少，且未达到上限，创建新连接
            if (pool.size() < maxSize / 4 && activeConnections < maxSize) {
                CompletableFuture.runAsync(this::addConnectionAsync);
            }
            
            return conn;
        } finally {
            lock.unlock();
        }
    }
    
    /**
     * 异步添加新连接（不阻塞调用者）
     */
    private void addConnectionAsync() {
        lock.lock();
        try {
            if (activeConnections < maxSize) {
                Connection conn = createConnection();
                pool.addLast(conn);
                activeConnections++;
                notEmpty.signal(); // 通知等待的线程
                log.debug("异步添加连接，当前连接数: {}/{}", activeConnections, maxSize);
            }
        } catch (Exception e) {
            log.error("创建连接失败", e);
        } finally {
            lock.unlock();
        }
    }
    
    /**
     * 归还连接
     */
    public void returnConnection(Connection conn) {
        if (conn == null) return;
        
        lock.lock();
        try {
            // 检查连接是否有效
            if (!conn.isValid()) {
                log.warn("连接无效，关闭并创建新连接");
                closeConnection(conn);
                addConnectionAsync();
                return;
            }
            
            // 归还到连接池
            pool.addLast(conn);
            notEmpty.signal(); // 唤醒等待获取连接的线程
            
            // 如果连接过多，关闭一些
            if (pool.size() > maxSize * 0.8) {
                cleanupExcessConnections();
            }
            
            log.debug("归还连接，当前连接数: {}/{}", pool.size(), maxSize);
        } finally {
            lock.unlock();
        }
    }
    
    /**
     * 清理过多的连接
     */
    private void cleanupExcessConnections() {
        int targetSize = maxSize / 2;
        while (pool.size() > targetSize) {
            Connection conn = pool.removeLast();
            closeConnection(conn);
            activeConnections--;
            notFull.signal(); // 通知可能等待的连接创建者
        }
        log.info("清理连接，从 {} 减少到 {}", pool.size() + targetSize, targetSize);
    }
    
    /**
     * 关闭连接池
     */
    public void shutdown() {
        lock.lock();
        try {
            log.info("关闭连接池，共 {} 个连接", pool.size());
            
            for (Connection conn : pool) {
                closeConnection(conn);
            }
            pool.clear();
            
            // 唤醒所有等待的线程
            notEmpty.signalAll();
            notFull.signalAll();
            
            log.info("连接池已关闭");
        } finally {
            lock.unlock();
        }
    }
    
    /**
     * 获取连接池统计信息
     */
    public PoolStats getStats() {
        lock.lock();
        try {
            return new PoolStats(
                pool.size(),
                activeConnections,
                maxSize,
                lock.getQueueLength(), // 等待获取连接的线程数
                lock.getHoldCount()    // 当前线程重入次数
            );
        } finally {
            lock.unlock();
        }
    }
    
    // 辅助方法
    private Connection createConnection() {
        // 模拟创建数据库连接
        return new MockConnection();
    }
    
    private void closeConnection(Connection conn) {
        try {
            conn.close();
        } catch (Exception e) {
            log.error("关闭连接失败", e);
        }
    }
}
```

##### 场景3：消息中间件消费者（阻塞队列最佳实践）

```java
@Component
@Slf4j
public class MessageConsumerService {
    // 使用阻塞队列实现高并发消息处理
    
    // 消息队列：支持优先级
    private final PriorityBlockingQueue<Message> messageQueue = 
        new PriorityBlockingQueue<>(1000, Comparator.comparingInt(Message::getPriority).reversed());
    
    // 处理线程池
    private final ExecutorService processorPool = 
        Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
    
    // 控制开关
    private volatile boolean running = true;
    private final CountDownLatch shutdownLatch = new CountDownLatch(1);
    
    /**
     * 启动消息消费者
     */
    @PostConstruct
    public void start() {
        log.info("启动消息消费者服务");
        
        // 启动多个消费者线程
        int consumerCount = 4;
        for (int i = 0; i < consumerCount; i++) {
            processorPool.execute(this::consumeMessages);
        }
        
        // 启动监控线程
        new Thread(this::monitorQueue, "Queue-Monitor").start();
    }
    
    /**
     * 消费消息的主循环
     */
    private void consumeMessages() {
        while (running || !messageQueue.isEmpty()) {
            try {
                // take()会阻塞直到有消息
                Message message = messageQueue.take();
                processMessage(message);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.info("消费者线程被中断");
                break;
            } catch (Exception e) {
                log.error("处理消息异常", e);
            }
        }
        log.info("消费者线程退出");
    }
    
    /**
     * 提交消息到队列（生产者）
     */
    public boolean submitMessage(Message message) {
        if (!running) {
            log.warn("服务已关闭，拒绝消息: {}", message.getId());
            return false;
        }
        
        try {
            // 使用offer而不是put，避免阻塞
            boolean success = messageQueue.offer(message, 100, TimeUnit.MILLISECONDS);
            
            if (!success) {
                log.warn("消息队列已满，丢弃消息: {}", message.getId());
                // 可以在这里实现降级策略，如写入磁盘或拒绝服务
            }
            
            return success;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
    
    /**
     * 批量提交消息
     */
    public int submitMessages(List<Message> messages) {
        if (!running) return 0;
        
        int successCount = 0;
        for (Message message : messages) {
            if (submitMessage(message)) {
                successCount++;
            } else {
                // 单个失败可以记录日志或采取其他措施
                log.debug("消息提交失败: {}", message.getId());
            }
        }
        return successCount;
    }
    
    /**
     * 处理单个消息（异步提交到线程池）
     */
    private void processMessage(Message message) {
        processorPool.submit(() -> {
            try {
                long startTime = System.currentTimeMillis();
                message.process();
                long cost = System.currentTimeMillis() - startTime;
                
                log.debug("处理消息完成: {}, 耗时: {}ms", message.getId(), cost);
                
                // 处理成功，可以发送ACK等
                sendAck(message);
                
            } catch (Exception e) {
                log.error("处理消息失败: {}", message.getId(), e);
                handleFailure(message, e);
            }
        });
    }
    
    /**
     * 监控队列状态
     */
    private void monitorQueue() {
        while (running) {
            try {
                Thread.sleep(5000); // 每5秒检查一次
                
                int queueSize = messageQueue.size();
                int remainingCapacity = messageQueue.remainingCapacity();
                double usageRate = (double) queueSize / (queueSize + remainingCapacity);
                
                log.info("队列状态 - 大小: {}, 剩余容量: {}, 使用率: {:.2%}",
                    queueSize, remainingCapacity, usageRate);
                
                // 根据使用率动态调整
                if (usageRate > 0.8) {
                    log.warn("队列使用率过高，考虑增加消费者或限流");
                }
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
    
    /**
     * 优雅关闭
     */
    @PreDestroy
    public void shutdown() throws InterruptedException {
        log.info("开始关闭消息消费者服务");
        running = false;
        
        // 停止接收新消息
        log.info("停止接收新消息");
        
        // 等待队列中的消息处理完成
        while (!messageQueue.isEmpty()) {
            log.info("等待处理剩余 {} 条消息", messageQueue.size());
            Thread.sleep(1000);
        }
        
        // 关闭线程池
        processorPool.shutdown();
        if (!processorPool.awaitTermination(30, TimeUnit.SECONDS)) {
            log.warn("线程池未在30秒内关闭，强制关闭");
            processorPool.shutdownNow();
        }
        
        log.info("消息消费者服务已关闭");
    }
    
    /**
     * 紧急关闭（丢弃所有未处理消息）
     */
    public void forceShutdown() {
        log.warn("强制关闭消息消费者服务");
        running = false;
        
        // 清空队列
        messageQueue.clear();
        
        // 立即关闭线程池
        processorPool.shutdownNow();
        
        log.info("强制关闭完成");
    }
    
    // 辅助方法
    private void sendAck(Message message) {
        // 发送确认
    }
    
    private void handleFailure(Message message, Exception e) {
        // 处理失败，可以重试或记录到死信队列
    }
}
```

#### 追问层：面试官的深度连环问

##### 追问1：为什么wait()必须在synchronized同步块中调用？

**深度原理分析：**

```java
public class WhyWaitInSynchronized {
    /*
    三个核心原因：
    1. 竞态条件避免
    2. 原子性保证
    3. 锁的状态一致性
    */
    
    // 原因1：避免竞态条件（Race Condition）
    public static class RaceConditionExample {
        private boolean condition = false;
        
        // ❌ 错误示例：不在同步块中检查条件
        public void wrongWait() throws InterruptedException {
            if (!condition) {  // 检查条件时没有锁保护
                // 在这里可能被其他线程修改condition
                synchronized (this) {
                    wait();  // 进入等待，但可能已经错过了notify
                }
            }
        }
        
        public void wrongNotify() {
            condition = true;
            synchronized (this) {
                notify();  // 可能唤醒时，线程还没有进入wait
            }
        }
        
        // ✅ 正确示例：在同步块中检查条件和等待
        public void correctWait() throws InterruptedException {
            synchronized (this) {
                while (!condition) {  // 检查条件时有锁保护
                    wait();  // 原子操作：释放锁 + 进入等待
                }
                // 条件满足后的处理
            }
        }
    }
    
    // 原因2：保证原子性（Atomicity）
    public static class AtomicityExplanation {
        /*
        wait()需要完成两个原子操作：
        1. 释放锁（让其他线程可以进入同步块）
        2. 将线程放入等待队列
        
        如果在非同步块中调用wait()，这两个操作无法原子完成：
        
        错误时序：
        Thread1: 检查条件 -> 不满足
        Thread2: 修改条件 -> 调用notify() (此时Thread1还没wait)
        Thread1: 调用wait() -> 永远等待（错过了notify）
        */
        
        // JVM中wait()的伪代码实现
        void waitMethod() {
            // 1. 检查当前线程是否持有锁（快速失败）
            if (!currentThread.holdsLock(this)) {
                throw new IllegalMonitorStateException();
            }
            
            // 2. 将线程加入等待队列（需要锁保护）
            addToWaitSet(currentThread);
            
            // 3. 释放锁（需要原子操作）
            releaseLock(this);
            
            // 4. 挂起线程
            parkThread();
            
            // 5. 被唤醒后，重新获取锁
            acquireLock(this);
            
            // 6. 从等待队列移除
            removeFromWaitSet(currentThread);
        }
    }
    
    // 原因3：锁的状态一致性
    public static class LockConsistency {
        /*
        锁的状态包括：
        1. 持有锁的线程
        2. 锁计数器（重入次数）
        3. 等待队列
        
        wait()需要修改这些状态，必须在锁的保护下：
        1. 减少锁计数器（考虑重入）
        2. 将线程从所有者改为等待者
        3. 更新等待队列
        */
        
        // 模拟锁状态的修改
        class MonitorState {
            Thread owner;
            int count;           // 重入次数
            List<Thread> waitSet;
            
            void waitOperation() {
                if (owner != Thread.currentThread()) {
                    throw new IllegalMonitorStateException();
                }
                
                // 保存重入次数
                int savedCount = count;
                
                // 清空所有者
                owner = null;
                count = 0;
                
                // 加入等待队列
                waitSet.add(Thread.currentThread());
                
                // 唤醒后需要恢复重入次数
                // ...
            }
        }
    }
    
    // 实际面试回答要点
    public static class InterviewAnswer {
        /*
        面试时可以这样回答：
        
        "wait()必须在synchronized中调用，主要原因有三点：
        
        第一，避免竞态条件。wait()的典型用法是检查某个条件是否满足，
        如果不满足则等待。这个'检查条件-进入等待'的操作必须是原子的，
        否则可能在检查条件后、调用wait()前，其他线程修改了条件并调用了notify()，
        导致wait()永远等不到通知。
        
        第二，保证操作的原子性。wait()需要完成'释放锁'和'进入等待队列'
        两个操作，这两个操作必须原子完成，否则会导致状态不一致。
        
        第三，维护锁的状态一致性。wait()会修改锁的持有者、重入次数、
        等待队列等状态，这些修改必须在锁的保护下进行。
        
        所以Java强制要求wait()必须在synchronized中调用，
        并且在调用前会检查当前线程是否持有锁，如果没有则抛出
        IllegalMonitorStateException。"
        */
    }
}
```

##### 追问2：Condition和wait/notify的性能对比如何？

**性能深度对比分析：**

```java
public class PerformanceComparison {
    
    // 性能测试：生产-消费者场景
    public static void benchmark() throws InterruptedException {
        int iterations = 1000000;
        int producerCount = 5;
        int consumerCount = 5;
        
        System.out.println("性能测试：生产-消费 " + iterations + " 条消息");
        System.out.println("生产者：" + producerCount + "，消费者：" + consumerCount);
        System.out.println("=".repeat(50));
        
        // 测试1：synchronized + wait/notify
        testSynchronizedQueue(iterations, producerCount, consumerCount);
        
        // 测试2：ReentrantLock + Condition
        testConditionQueue(iterations, producerCount, consumerCount);
        
        // 测试3：BlockingQueue（ArrayBlockingQueue）
        testBlockingQueue(iterations, producerCount, consumerCount);
        
        /*
        预期结果（典型）：
        synchronized + wait/notify:   4500ms
        ReentrantLock + Condition:    3800ms
        BlockingQueue:                3500ms
        
        分析：
        1. synchronized在低竞争时性能好（偏向锁优化）
        2. Condition在高竞争时性能好（精确唤醒）
        3. BlockingQueue性能最好（高度优化，直接使用）
        */
    }
    
    // synchronized实现的生产-消费者队列
    static class SynchronizedQueue<T> {
        private final Queue<T> queue = new LinkedList<>();
        private final int capacity;
        
        public SynchronizedQueue(int capacity) {
            this.capacity = capacity;
        }
        
        public void put(T item) throws InterruptedException {
            synchronized (queue) {
                while (queue.size() == capacity) {
                    queue.wait();
                }
                queue.add(item);
                queue.notifyAll(); // 唤醒所有等待者
            }
        }
        
        public T take() throws InterruptedException {
            synchronized (queue) {
                while (queue.isEmpty()) {
                    queue.wait();
                }
                T item = queue.poll();
                queue.notifyAll();
                return item;
            }
        }
    }
    
    // Condition实现的生产-消费者队列
    static class ConditionQueue<T> {
        private final Queue<T> queue = new LinkedList<>();
        private final int capacity;
        private final ReentrantLock lock = new ReentrantLock();
        private final Condition notFull = lock.newCondition();
        private final Condition notEmpty = lock.newCondition();
        
        public ConditionQueue(int capacity) {
            this.capacity = capacity;
        }
        
        public void put(T item) throws InterruptedException {
            lock.lock();
            try {
                while (queue.size() == capacity) {
                    notFull.await();
                }
                queue.add(item);
                notEmpty.signal(); // 只唤醒一个消费者
            } finally {
                lock.unlock();
            }
        }
        
        public T take() throws InterruptedException {
            lock.lock();
            try {
                while (queue.isEmpty()) {
                    notEmpty.await();
                }
                T item = queue.poll();
                notFull.signal(); // 只唤醒一个生产者
                return item;
            } finally {
                lock.unlock();
            }
        }
    }
    
    // 性能差异分析
    public static class PerformanceAnalysis {
        /*
        性能差异的来源：
        
        1. 锁的获取方式：
           synchronized：JVM内置锁，有偏向锁、轻量级锁优化
           ReentrantLock：基于AQS的CAS操作
        
        2. 等待/唤醒机制：
           wait/notify：基于ObjectMonitor，notifyAll()唤醒所有线程
           Condition：基于AQS条件队列，signal()精确唤醒
        
        3. 内存屏障：
           synchronized：完全内存屏障（heavy barrier）
           ReentrantLock：更灵活的内存屏障控制
        
        4. 竞争处理：
           synchronized：竞争激烈时膨胀为重量级锁
           ReentrantLock：自旋+CAS，可配置公平性
        */
        
        // 不同场景下的选择建议
        public static class SelectionGuide {
            /*
            选择 wait/notify 的场景：
            - 简单同步需求
            - 锁竞争不激烈
            - 不需要超时、公平性等高级特性
            - 代码简洁性更重要
            
            选择 Condition 的场景：
            - 需要多个等待条件（如：队列满、队列空）
            - 需要公平性保证
            - 需要超时等待
            - 高并发场景
            
            选择 BlockingQueue 的场景：
            - 标准的生产者-消费者模式
            - 需要现成的、经过优化的实现
            - 不想重复造轮子
            */
        }
        
        // 性能优化技巧
        public static class OptimizationTips {
            // 1. 减少锁竞争
            class LowContentionDesign {
                // 使用多个队列分散竞争
                private final List<BlockingQueue<Object>> queues;
                
                // 根据线程ID选择队列
                private BlockingQueue<Object> getQueue() {
                    int idx = Thread.currentThread().hashCode() % queues.size();
                    return queues.get(idx);
                }
            }
            
            // 2. 避免不必要的唤醒
            class PreciseNotification {
                // 使用Condition的signal()而不是signalAll()
                // 或者使用notify()而不是notifyAll()
                
                // 特殊情况：多个条件谓词共享同一个锁时
                // 可能需要使用notifyAll()或signalAll()
            }
            
            // 3. 减少锁持有时间
            class MinimizeLockTime {
                public void process(Object item) {
                    // 只在必要时持有锁
                    synchronized (lock) {
                        // 只执行必须同步的操作
                        addToQueue(item);
                    }
                    
                    // 其他处理在锁外进行
                    doHeavyProcessing(item);
                }
            }
        }
    }
}
```

##### 追问3：阻塞队列在JDK中有哪些实现？各自适用什么场景？

**JDK阻塞队列全家桶深度解析：**

```java
public class BlockingQueueImplementations {
    
    // 阻塞队列的类继承体系
    public static void showHierarchy() {
        /*
        BlockingQueue (接口)
        ├── ArrayBlockingQueue      // 数组实现，有界
        ├── LinkedBlockingQueue     // 链表实现，可选有界
        ├── PriorityBlockingQueue   // 优先级队列，无界
        ├── DelayQueue              // 延迟队列，无界
        ├── SynchronousQueue        // 同步队列，容量0
        └── TransferQueue (接口)     // 扩展接口
            └── LinkedTransferQueue // 链表传输队列
        */
    }
    
    // 1. ArrayBlockingQueue - 数组实现的有界队列
    public static class ArrayBlockingQueueAnalysis {
        /*
        特点：
        - 基于数组的FIFO队列
        - 创建时必须指定容量
        - 可选公平锁（默认非公平）
        - 性能较好（数组访问快）
        
        适用场景：
        - 固定大小的资源池（如连接池）
        - 需要控制内存使用的场景
        - 生产者和消费者速度匹配的场景
        
        源码要点：
        - 使用ReentrantLock + 两个Condition
        - 环形数组实现
        - 支持公平/非公平锁
        */
        
        public void usageExample() {
            // 创建公平队列（防止线程饥饿）
            BlockingQueue<String> queue = new ArrayBlockingQueue<>(100, true);
            
            // 或非公平队列（默认，吞吐量高）
            BlockingQueue<String> queue2 = new ArrayBlockingQueue<>(100);
        }
    }
    
    // 2. LinkedBlockingQueue - 链表实现的可选有界队列
    public static class LinkedBlockingQueueAnalysis {
        /*
        特点：
        - 基于链表的FIFO队列
        - 可选容量（默认Integer.MAX_VALUE，接近无界）
        - 两把锁（takeLock和putLock），吞吐量高
        - 节点动态创建，内存使用灵活
        
        适用场景：
        - 需要高吞吐量的场景
        - 队列大小不确定的场景
        - 生产和消费速度不匹配的场景
        
        源码要点：
        - 使用两个ReentrantLock（putLock和takeLock）
        - 分别维护notFull和notEmpty条件
        - 使用AtomicInteger记录count
        */
        
        public void usageExample() {
            // 有界队列
            BlockingQueue<String> bounded = new LinkedBlockingQueue<>(1000);
            
            // 无界队列（默认）
            BlockingQueue<String> unbounded = new LinkedBlockingQueue<>();
        }
    }
    
    // 3. PriorityBlockingQueue - 优先级队列
    public static class PriorityBlockingQueueAnalysis {
        /*
        特点：
        - 基于堆的无界优先级队列
        - 元素必须实现Comparable或提供Comparator
        - 自动扩容
        - 使用ReentrantLock + Condition
        
        适用场景：
        - 任务调度（优先级高的先执行）
        - 实时系统
        - 需要按优先级处理的场景
        
        注意：
        - 迭代不保证顺序
        - take()时如果多个元素优先级相同，不保证顺序
        */
        
        public void usageExample() {
            // 使用自然顺序
            BlockingQueue<Integer> queue = new PriorityBlockingQueue<>();
            
            // 使用自定义比较器
            BlockingQueue<Task> taskQueue = new PriorityBlockingQueue<>(
                11, // 初始容量
                Comparator.comparing(Task::getPriority).reversed()
                    .thenComparing(Task::getCreateTime)
            );
        }
    }
    
    // 4. DelayQueue - 延迟队列
    public static class DelayQueueAnalysis {
        /*
        特点：
        - 无界队列
        - 元素必须实现Delayed接口
        - 只有在延迟期满时才能取出
        - 基于PriorityQueue实现
        
        适用场景：
        - 定时任务调度
        - 缓存过期
        - 会话超时
        
        源码要点：
        - 使用ReentrantLock + Condition
        - 基于PriorityQueue排序
        - 延迟未到时，线程在Condition上等待
        */
        
        static class DelayedTask implements Delayed {
            private final String name;
            private final long executeTime;
            
            public DelayedTask(String name, long delayMs) {
                this.name = name;
                this.executeTime = System.currentTimeMillis() + delayMs;
            }
            
            @Override
            public long getDelay(TimeUnit unit) {
                long diff = executeTime - System.currentTimeMillis();
                return unit.convert(diff, TimeUnit.MILLISECONDS);
            }
            
            @Override
            public int compareTo(Delayed other) {
                return Long.compare(this.executeTime, 
                    ((DelayedTask) other).executeTime);
            }
        }
        
        public void usageExample() throws InterruptedException {
            DelayQueue<DelayedTask> queue = new DelayQueue<>();
            
            // 添加延迟任务
            queue.put(new DelayedTask("task1", 5000)); // 5秒后执行
            queue.put(new DelayedTask("task2", 1000)); // 1秒后执行
            
            // take()会阻塞直到有任务到期
            DelayedTask task = queue.take();
            System.out.println("执行任务: " + task.name);
        }
    }
    
    // 5. SynchronousQueue - 同步队列
    public static class SynchronousQueueAnalysis {
        /*
        特点：
        - 容量为0，不存储元素
        - 每个put必须等待一个take，反之亦然
        - 可选公平模式（默认非公平）
        - 吞吐量非常高
        
        适用场景：
        - 直接传递任务的线程池（Executors.newCachedThreadPool）
        - 生产者和消费者需要紧密同步的场景
        
        源码要点：
        - 支持公平和非公平模式
        - 公平模式使用队列，非公平模式使用栈
        - 使用CAS操作，无锁设计
        */
        
        public void usageExample() throws InterruptedException {
            SynchronousQueue<String> queue = new SynchronousQueue<>();
            
            // 生产者线程
            new Thread(() -> {
                try {
                    System.out.println("生产者准备put");
                    queue.put("item");
                    System.out.println("生产者put完成");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            Thread.sleep(1000);
            
            // 消费者线程
            new Thread(() -> {
                try {
                    System.out.println("消费者准备take");
                    String item = queue.take();
                    System.out.println("消费者take到: " + item);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
        }
    }
    
    // 6. LinkedTransferQueue - 传输队列
    public static class LinkedTransferQueueAnalysis {
        /*
        特点：
        - 结合了SynchronousQueue和LinkedBlockingQueue的特性
        - 无界队列
        - 支持"传输"模式：生产者可以等待消费者接收
        - 性能优于SynchronousQueue和LinkedBlockingQueue
        
        适用场景：
        - 高并发消息传递
        - 需要更高性能的生产者-消费者模式
        
        特殊方法：
        - transfer(E e)：阻塞直到元素被消费
        - tryTransfer(E e)：尝试立即传输
        - tryTransfer(E e, long timeout, TimeUnit unit)：带超时传输
        */
        
        public void usageExample() throws InterruptedException {
            LinkedTransferQueue<String> queue = new LinkedTransferQueue<>();
            
            // 消费者先启动，等待接收
            new Thread(() -> {
                try {
                    System.out.println("消费者等待接收");
                    String item = queue.take();
                    System.out.println("消费者收到: " + item);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            Thread.sleep(1000);
            
            // 生产者传输元素，会等待消费者接收
            System.out.println("生产者开始传输");
            queue.transfer("item");
            System.out.println("生产者传输完成");
        }
    }
    
    // 选择指南
    public static class SelectionGuide {
        /*
        场景                     | 推荐队列                    | 理由
        ------------------------|---------------------------|-----------------------------
        固定大小的线程池任务队列    | ArrayBlockingQueue        | 有界，防止内存溢出
        高吞吐量的消息队列         | LinkedBlockingQueue       | 两把锁，吞吐量高
        需要按优先级处理任务       | PriorityBlockingQueue     | 自动按优先级排序
        定时任务调度             | DelayQueue                | 延迟执行
        直接传递任务（CachedThreadPool）| SynchronousQueue      | 容量0，直接传递
        需要等待消费者接收         | LinkedTransferQueue       | 支持传输模式
        不确定大小，但需要控制内存  | LinkedBlockingQueue(capacity) | 可选有界
        
        性能对比（吞吐量从高到低）：
        1. LinkedTransferQueue
        2. SynchronousQueue
        3. LinkedBlockingQueue
        4. ArrayBlockingQueue
        5. PriorityBlockingQueue
        6. DelayQueue
        */
    }
}
```

##### 追问4：如何实现一个支持超时和优先级的自定义阻塞队列？

**自定义阻塞队列实现：**

```java
public class CustomBlockingQueue {
    
    // 支持超时和优先级的自定义阻塞队列
    public static class TimeoutPriorityBlockingQueue<E> {
        private final PriorityQueue<PriorityNode<E>> queue;
        private final int capacity;
        private final ReentrantLock lock;
        private final Condition notEmpty;
        private final Condition notFull;
        
        // 优先级节点
        private static class PriorityNode<E> implements Comparable<PriorityNode<E>> {
            final E item;
            final int priority;      // 优先级，值越小优先级越高
            final long enqueueTime;  // 入队时间
            final long timeout;      // 超时时间（毫秒）
            
            PriorityNode(E item, int priority, long timeout) {
                this.item = item;
                this.priority = priority;
                this.enqueueTime = System.currentTimeMillis();
                this.timeout = timeout;
            }
            
            // 检查是否超时
            boolean isExpired() {
                return timeout > 0 && 
                    (System.currentTimeMillis() - enqueueTime) > timeout;
            }
            
            // 比较：先按优先级，再按入队时间（FIFO）
            @Override
            public int compareTo(PriorityNode<E> other) {
                if (this.priority != other.priority) {
                    return Integer.compare(this.priority, other.priority);
                }
                return Long.compare(this.enqueueTime, other.enqueueTime);
            }
        }
        
        public TimeoutPriorityBlockingQueue(int capacity) {
            this.capacity = capacity;
            this.queue = new PriorityQueue<>();
            this.lock = new ReentrantLock(true); // 公平锁
            this.notEmpty = lock.newCondition();
            this.notFull = lock.newCondition();
        }
        
        /**
         * 插入元素，支持优先级和超时
         * @param item 元素
         * @param priority 优先级（0最高）
         * @param timeoutMs 超时时间（毫秒），0表示不超时
         * @param offerTimeoutMs 插入操作的超时时间
         * @return 是否插入成功
         */
        public boolean offer(E item, int priority, long timeoutMs, 
                            long offerTimeoutMs) throws InterruptedException {
            checkNotNull(item);
            
            final ReentrantLock lock = this.lock;
            lock.lockInterruptibly();
            
            try {
                long nanos = TimeUnit.MILLISECONDS.toNanos(offerTimeoutMs);
                
                // 等待队列不满
                while (queue.size() == capacity) {
                    if (nanos <= 0) {
                        return false; // 插入超时
                    }
                    nanos = notFull.awaitNanos(nanos);
                }
                
                // 创建节点并入队
                PriorityNode<E> node = new PriorityNode<>(item, priority, timeoutMs);
                queue.offer(node);
                notEmpty.signal(); // 唤醒消费者
                return true;
                
            } finally {
                lock.unlock();
            }
        }
        
        /**
         * 获取元素，自动清理超时元素
         * @param pollTimeoutMs 获取操作的超时时间
         * @return 元素，可能为null（超时）
         */
        public E poll(long pollTimeoutMs) throws InterruptedException {
            final ReentrantLock lock = this.lock;
            lock.lockInterruptibly();
            
            try {
                long nanos = TimeUnit.MILLISECONDS.toNanos(pollTimeoutMs);
                
                while (true) {
                    // 清理已超时的元素
                    cleanupExpired();
                    
                    // 如果队列不空，返回队首元素
                    if (!queue.isEmpty()) {
                        PriorityNode<E> node = queue.poll();
                        notFull.signal(); // 唤醒生产者
                        return node.item;
                    }
                    
                    // 队列为空，等待
                    if (nanos <= 0) {
                        return null; // 获取超时
                    }
                    nanos = notEmpty.awaitNanos(nanos);
                }
            } finally {
                lock.unlock();
            }
        }
        
        /**
         * 清理已超时的元素
         */
        private void cleanupExpired() {
            long now = System.currentTimeMillis();
            Iterator<PriorityNode<E>> it = queue.iterator();
            
            while (it.hasNext()) {
                PriorityNode<E> node = it.next();
                if (node.isExpired()) {
                    it.remove();
                    notFull.signal(); // 元素超时被移除，唤醒生产者
                    
                    // 可以在这里添加超时处理回调
                    onElementExpired(node.item);
                } else {
                    // 队列是按优先级排序的，如果当前元素未超时，后面的也不会超时
                    //（因为超时时间与入队时间相关，但优先级排序可能打乱时间顺序）
                    // 所以不能直接break，需要继续检查
                }
            }
        }
        
        /**
         * 元素超时的回调方法（可被子类重写）
         */
        protected void onElementExpired(E item) {
            // 默认什么也不做，子类可以记录日志或执行其他操作
        }
        
        /**
         * 获取队列大小（包含已超时但未清理的元素）
         */
        public int size() {
            final ReentrantLock lock = this.lock;
            lock.lock();
            try {
                return queue.size();
            } finally {
                lock.unlock();
            }
        }
        
        /**
         * 获取有效元素数量（已清理超时元素）
         */
        public int validSize() {
            final ReentrantLock lock = this.lock;
            lock.lock();
            try {
                cleanupExpired();
                return queue.size();
            } finally {
                lock.unlock();
            }
        }
        
        /**
         * 清空队列
         */
        public void clear() {
            final ReentrantLock lock = this.lock;
            lock.lock();
            try {
                queue.clear();
                notFull.signalAll(); // 清空后唤醒所有等待的生产者
            } finally {
                lock.unlock();
            }
        }
        
        private void checkNotNull(Object obj) {
            if (obj == null) {
                throw new NullPointerException();
            }
        }
    }
    
    // 使用示例：任务调度系统
    public static class TaskSchedulerExample {
        static class Task {
            final String id;
            final Runnable job;
            
            Task(String id, Runnable job) {
                this.id = id;
                this.job = job;
            }
            
            void execute() {
                System.out.println("执行任务: " + id);
                job.run();
            }
        }
        
        public static void main(String[] args) throws InterruptedException {
            TimeoutPriorityBlockingQueue<Task> queue = 
                new TimeoutPriorityBlockingQueue<>(100);
            
            // 启动消费者线程
            Thread consumer = new Thread(() -> {
                while (true) {
                    try {
                        Task task = queue.poll(5000); // 5秒超时
                        if (task != null) {
                            task.execute();
                        } else {
                            System.out.println("获取任务超时，继续等待...");
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            });
            consumer.start();
            
            // 生产任务
            for (int i = 0; i < 10; i++) {
                int priority = i % 3; // 优先级 0,1,2
                long timeout = (i % 2 == 0) ? 2000 : 0; // 部分任务2秒超时
                
                boolean success = queue.offer(
                    new Task("task-" + i, () -> {
                        try {
                            Thread.sleep(500); // 模拟任务执行
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }),
                    priority,
                    timeout, // 任务超时时间
                    1000    // 插入操作超时1秒
                );
                
                if (success) {
                    System.out.println("插入任务成功: task-" + i + ", 优先级: " + priority);
                } else {
                    System.out.println("插入任务失败: task-" + i);
                }
            }
            
            // 等待所有任务处理完成
            Thread.sleep(10000);
            consumer.interrupt();
            consumer.join();
        }
    }
}
```

#### 总结层：一句话核心记忆

**对于3年经验后端工程师**：记住线程间通信的三种方式是 **"wait/notify基础但受限，Condition灵活而强大，阻塞队列封装完善即用"**。选择时 **"简单同步用wait/notify，复杂条件用Condition，生产消费直接用BlockingQueue"**，理解底层原理才能正确应对高并发场景。


### **题目9：并发容器（ConcurrentHashMap、CopyOnWriteArrayList）**
#### 原理层：并发容器的底层实现机制

##### 1. ConcurrentHashMap（JDK 8+）原理详解

```java
// ConcurrentHashMap的核心数据结构（JDK 8+）
public class ConcurrentHashMap<K,V> extends AbstractMap<K,V>
    implements ConcurrentMap<K,V>, Serializable {
    
    // 核心：Node数组，volatile保证可见性
    transient volatile Node<K,V>[] table;
    
    // 扩容时的nextTable
    private transient volatile Node<K,V>[] nextTable;
    
    // 控制标识，高16位：扩容阈值，低16位：并发扩容线程数
    private transient volatile int sizeCtl;
    
    // Node节点：链表节点
    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        volatile V val;
        volatile Node<K,V> next;  // 链表或红黑树
        
        Node(int hash, K key, V val, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.val = val;
            this.next = next;
        }
    }
    
    // TreeNode：红黑树节点
    static final class TreeNode<K,V> extends Node<K,V> {
        TreeNode<K,V> parent;
        TreeNode<K,V> left;
        TreeNode<K,V> right;
        TreeNode<K,V> prev;    // 删除时需要取消链接
        boolean red;
    }
    
    // TreeBin：红黑树的包装，放在桶的首位
    static final class TreeBin<K,V> extends Node<K,V> {
        TreeNode<K,V> root;
        volatile TreeNode<K,V> first;
        volatile Thread waiter;
        volatile int lockState;
        static final int WRITER = 1;  // 写锁
        static final int WAITER = 2;  // 等待写锁
        static final int READER = 4;  // 读锁
    }
}
```

**ConcurrentHashMap并发控制机制：**

```
JDK 8 ConcurrentHashMap 并发控制：
┌─────────────────────────────────────────────────────────┐
│                     put操作流程                          │
├─────────────────────────────────────────────────────────┤
│ 步骤1：计算key的hash值                                   │
│ 步骤2：如果table为null，初始化table（CAS控制）          │
│ 步骤3：计算桶索引 i = (n - 1) & hash                    │
│ 步骤4：根据桶的状态执行不同操作：                        │
│   ├─ 情况A：桶为空 (tab[i] == null)                     │
│   │     使用CAS插入新Node（无锁操作）                   │
│   │     CAS成功→插入完成，失败→重试                     │
│   ├─ 情况B：桶正在迁移 (tab[i] == MOVED)                │
│   │     当前线程帮助扩容，然后重试                      │
│   ├─ 情况C：桶不为空 (tab[i] != null)                   │
│   │      synchronized锁住桶的第一个节点                │
│   │      - 如果是链表：遍历插入/更新                    │
│   │      - 如果是树：调用树的方法                       │
│   │      判断是否需要树化(链表长度≥8)                   │
│   │      判断是否需要扩容(元素数≥阈值)                  │
│   └─ 步骤5：增加计数（使用CounterCell分散竞争）         │
└─────────────────────────────────────────────────────────┘

红黑树转换条件：
链表长度 ≥ 8 且 数组长度 ≥ 64 → 转换为红黑树
红黑树节点数 ≤ 6 → 转换回链表

扩容机制（多线程协同）：
1. 单个线程触发扩容，创建nextTable（原数组2倍）
2. 将原table的每个桶标记为MOVED（ForwardingNode）
3. 其他线程put时发现MOVED，帮助迁移数据
4. 迁移完成：table = nextTable
```

##### 2. CopyOnWriteArrayList原理详解

```java
// CopyOnWriteArrayList的写时复制机制
public class CopyOnWriteArrayList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    
    // 关键：volatile数组，保证可见性
    private transient volatile Object[] array;
    
    // 获取当前数组
    final Object[] getArray() {
        return array;
    }
    
    // 设置新数组
    final void setArray(Object[] a) {
        array = a;
    }
    
    // 添加元素：写时复制的核心
    public boolean add(E e) {
        synchronized (lock) {  // 可重入锁
            Object[] elements = getArray();
            int len = elements.length;
            
            // 1. 复制新数组（长度+1）
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            
            // 2. 在新数组上修改
            newElements[len] = e;
            
            // 3. 原子替换引用
            setArray(newElements);
            return true;
        }
    }
    
    // 获取元素：无锁，直接读取
    public E get(int index) {
        return (E) getArray()[index];
    }
    
    // 迭代器：创建时获取快照
    public Iterator<E> iterator() {
        return new COWIterator<E>(getArray(), 0);
    }
    
    // COWIterator：基于快照的迭代器
    static final class COWIterator<E> implements ListIterator<E> {
        private final Object[] snapshot;  // 创建时的数组快照
        private int cursor;
        
        COWIterator(Object[] elements, int initialCursor) {
            snapshot = elements;
            cursor = initialCursor;
        }
        
        public boolean hasNext() {
            return cursor < snapshot.length;
        }
        
        public E next() {
            if (!hasNext()) throw new NoSuchElementException();
            return (E) snapshot[cursor++];
        }
        
        // 不支持修改操作
        public void remove() {
            throw new UnsupportedOperationException();
        }
    }
}
```

**CopyOnWriteArrayList内存模型：**

```
写时复制内存变化：
初始状态：
array → Object[3] {A, B, C}

线程1执行 add("D")：
1. 获取锁
2. 复制数组：newArray = Object[4] {A, B, C, null}
3. 设置新元素：newArray[3] = "D"
4. volatile写：array = newArray
5. 释放锁

最终状态：
array → Object[4] {A, B, C, D}
旧数组 Object[3] {A, B, C} 等待GC

关键特性：
1. 读操作：完全无锁，直接读取volatile数组
2. 写操作：加锁，复制整个数组
3. 迭代器：基于创建时的快照，弱一致性
4. 内存开销：每次写操作都复制整个数组
```

#### 场景层：业务中的实际应用

##### 场景1：高并发缓存系统（ConcurrentHashMap最佳实践）

```java
@Component
@Slf4j
public class LocalCacheService {
    // 使用ConcurrentHashMap实现本地缓存
    
    // 缓存项：包含值和过期时间
    private static class CacheItem {
        private final Object value;
        private final long expireTime;
        
        CacheItem(Object value, long ttl) {
            this.value = value;
            this.expireTime = System.currentTimeMillis() + ttl;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }
    
    // 缓存主结构：ConcurrentHashMap
    private final ConcurrentHashMap<String, CacheItem> cache = new ConcurrentHashMap<>(1024);
    
    // 清理过期缓存的线程池
    private final ScheduledExecutorService cleaner = Executors.newScheduledThreadPool(1);
    
    @PostConstruct
    public void init() {
        // 每30秒清理一次过期缓存
        cleaner.scheduleAtFixedRate(this::cleanExpired, 30, 30, TimeUnit.SECONDS);
    }
    
    /**
     * 获取缓存：如果不存在或已过期，则加载
     * 使用computeIfAbsent保证原子性
     */
    public <T> T get(String key, Supplier<T> loader, long ttlMillis) {
        CacheItem item = cache.get(key);
        
        // 检查是否有效
        if (item == null || item.isExpired()) {
            return (T) cache.compute(key, (k, oldItem) -> {
                // 双重检查：在计算函数内再次检查
                if (oldItem != null && !oldItem.isExpired()) {
                    return oldItem;
                }
                
                // 加载数据
                T value = loader.get();
                return new CacheItem(value, System.currentTimeMillis() + ttlMillis);
            }).value;
        }
        
        return (T) item.value;
    }
    
    /**
     * 批量获取缓存
     */
    public Map<String, Object> batchGet(Set<String> keys) {
        Map<String, Object> result = new HashMap<>();
        
        // 遍历（线程安全）
        cache.forEach((key, item) -> {
            if (keys.contains(key) && !item.isExpired()) {
                result.put(key, item.value);
            }
        });
        
        return result;
    }
    
    /**
     * 原子更新：比较并设置
     */
    public boolean compareAndSet(String key, Object expected, Object newValue, long ttl) {
        return cache.compute(key, (k, oldItem) -> {
            if (oldItem == null) {
                return expected == null ? 
                    new CacheItem(newValue, System.currentTimeMillis() + ttl) : null;
            }
            
            if (oldItem.value.equals(expected) && !oldItem.isExpired()) {
                return new CacheItem(newValue, System.currentTimeMillis() + ttl);
            }
            
            return oldItem; // 不更新
        }) != null;
    }
    
    /**
     * 清理过期缓存
     */
    private void cleanExpired() {
        int cleaned = 0;
        Iterator<Map.Entry<String, CacheItem>> it = cache.entrySet().iterator();
        
        while (it.hasNext()) {
            Map.Entry<String, CacheItem> entry = it.next();
            if (entry.getValue().isExpired()) {
                it.remove();
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            log.info("清理过期缓存 {} 个", cleaned);
        }
    }
    
    /**
     * 获取缓存统计信息
     */
    public CacheStats getStats() {
        long total = cache.mappingCount(); // 使用mappingCount()避免溢出
        long expired = cache.values().stream()
            .filter(CacheItem::isExpired)
            .count();
        
        return new CacheStats(total, expired, cache.size());
    }
    
    /**
     * 热点key监控
     */
    public Map<String, Long> getHotKeys(int topN) {
        // 可以结合其他机制（如计数器）实现热点key监控
        // ConcurrentHashMap本身不提供访问频率统计
        return Collections.emptyMap();
    }
    
    @PreDestroy
    public void destroy() {
        cleaner.shutdown();
        cache.clear();
        log.info("缓存服务已关闭");
    }
}
```

##### 场景2：事件监听器管理（CopyOnWriteArrayList最佳实践）

```java
@Component
@Slf4j
public class EventPublisher {
    // 使用CopyOnWriteArrayList管理事件监听器
    
    // 监听器列表：读多写少，适合CopyOnWriteArrayList
    private final CopyOnWriteArrayList<EventListener> listeners = 
        new CopyOnWriteArrayList<>();
    
    // 事件类型到监听器的映射
    private final Map<String, CopyOnWriteArrayList<EventListener>> typedListeners = 
        new ConcurrentHashMap<>();
    
    /**
     * 注册全局监听器
     */
    public void addListener(EventListener listener) {
        listeners.add(listener);
        log.debug("注册全局监听器: {}", listener.getClass().getSimpleName());
    }
    
    /**
     * 注册特定类型事件的监听器
     */
    public void addListener(String eventType, EventListener listener) {
        typedListeners.computeIfAbsent(eventType, 
            k -> new CopyOnWriteArrayList<>()).add(listener);
        log.debug("注册事件[{}]监听器: {}", eventType, listener.getClass().getSimpleName());
    }
    
    /**
     * 发布事件到所有监听器
     */
    public void publish(Event event) {
        // 发布到全局监听器
        for (EventListener listener : listeners) {
            safeInvoke(listener, event);
        }
        
        // 发布到特定类型监听器
        CopyOnWriteArrayList<EventListener> typeListeners = 
            typedListeners.get(event.getType());
        if (typeListeners != null) {
            for (EventListener listener : typeListeners) {
                safeInvoke(listener, event);
            }
        }
        
        // 异步事件处理
        if (event.isAsync()) {
            CompletableFuture.runAsync(() -> {
                publishAsync(event);
            });
        }
    }
    
    /**
     * 安全调用监听器，防止一个监听器异常影响其他
     */
    private void safeInvoke(EventListener listener, Event event) {
        try {
            long start = System.nanoTime();
            listener.onEvent(event);
            long cost = (System.nanoTime() - start) / 1000; // 微秒
            
            if (cost > 1000) { // 超过1毫秒
                log.warn("监听器 {} 处理事件耗时较长: {}μs", 
                    listener.getClass().getSimpleName(), cost);
            }
        } catch (Exception e) {
            log.error("监听器处理事件异常: {}", listener.getClass().getSimpleName(), e);
            // 可以添加异常处理逻辑，如移除异常的监听器
        }
    }
    
    /**
     * 异步事件发布
     */
    private void publishAsync(Event event) {
        // 使用快照迭代器，避免迭代过程中修改的影响
        List<EventListener> snapshot = new ArrayList<>(listeners);
        
        for (EventListener listener : snapshot) {
            if (listener.supportsAsync()) {
                safeInvoke(listener, event);
            }
        }
    }
    
    /**
     * 移除监听器
     */
    public boolean removeListener(EventListener listener) {
        boolean removed = listeners.remove(listener);
        
        // 同时从类型监听器中移除
        typedListeners.values().forEach(list -> list.remove(listener));
        
        return removed;
    }
    
    /**
     * 批量添加监听器（优化性能）
     */
    public void addAllListeners(Collection<EventListener> newListeners) {
        // 一次性添加，减少复制次数
        listeners.addAllAbsent(newListeners);
    }
    
    /**
     * 获取当前监听器快照（用于调试）
     */
    public List<EventListener> getListenersSnapshot() {
        return new ArrayList<>(listeners); // 已经是快照，再包装一层
    }
    
    /**
     * 清空所有监听器
     */
    public void clear() {
        listeners.clear();
        typedListeners.clear();
        log.info("清空所有事件监听器");
    }
}

// 事件监听器接口
interface EventListener {
    void onEvent(Event event);
    default boolean supportsAsync() { return false; }
}
```

##### 场景3：错误的并发容器使用（反例）

```java
// ❌ 反例1：在频繁写入的场景使用CopyOnWriteArrayList
public class WrongCOWUsage {
    private CopyOnWriteArrayList<BigObject> dataList = new CopyOnWriteArrayList<>();
    
    public void highFrequencyWrite() {
        // 问题：每秒写入1000次，每次都会复制整个数组
        for (int i = 0; i < 1000; i++) {
            dataList.add(new BigObject()); // 每次add都复制数组！
        }
        
        // ✅ 正确：对于频繁写入，使用ConcurrentLinkedQueue或其他
        // private ConcurrentLinkedQueue<BigObject> queue = new ConcurrentLinkedQueue<>();
    }
}

// ❌ 反例2：误用ConcurrentHashMap的size()
public class WrongSizeUsage {
    private ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
    
    public void problematicSizeCheck() {
        // 问题：size()返回的只是近似值，不适合精确控制
        if (map.size() > 1000) {
            map.clear(); // size()可能已经被其他线程修改
        }
        
        // ✅ 正确：使用mappingCount()或设计其他机制
        // 或者使用 AtomicInteger 单独计数
    }
    
    public void wrongIteration() {
        // 问题：迭代过程中修改可能导致不一致
        for (String key : map.keySet()) {
            if (someCondition(key)) {
                map.remove(key); // 可能抛出ConcurrentModificationException
            }
        }
        
        // ✅ 正确：使用迭代器的remove方法或使用keySet().removeIf()
        map.keySet().removeIf(key -> someCondition(key));
    }
}

// ❌ 反例3：在ConcurrentHashMap中存储大对象
public class MemoryIssue {
    static class LargeObject {
        byte[] data = new byte[1024 * 1024]; // 1MB
    }
    
    private ConcurrentHashMap<String, LargeObject> cache = new ConcurrentHashMap<>();
    
    public void memoryLeak() {
        // 持续添加大对象
        for (int i = 0; i < 10000; i++) {
            cache.put("key" + i, new LargeObject()); // 10GB内存！
        }
        
        // 即使remove，如果还有引用，GC可能无法回收
        // ✅ 正确：使用WeakReference或设置合理的过期策略
    }
}

// ❌ 反例4：滥用ConcurrentHashMap的compute方法
public class ComputeAbuse {
    private ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();
    
    public void overUseCompute() {
        // 问题：compute方法可能被频繁调用，竞争激烈
        counters.compute("key", (k, v) -> {
            if (v == null) return new AtomicInteger(1);
            v.incrementAndGet();
            return v;
        });
        
        // ✅ 正确：对于简单的计数器，使用LongAdder
        // private ConcurrentHashMap<String, LongAdder> betterCounters = ...
    }
}
```

#### 追问层：面试官的深度连环问

##### 追问1：ConcurrentHashMap在JDK 7和JDK 8中的实现有什么区别？

**详细对比分析：**

```java
public class ConcurrentHashMapEvolution {
    /*
    JDK 7 vs JDK 8 ConcurrentHashMap 对比：
    
    1. 数据结构：
       JDK 7：Segment数组 + HashEntry数组 + 链表
       JDK 8：Node数组 + 链表/红黑树
    
    2. 并发控制：
       JDK 7：分段锁（Segment继承ReentrantLock），锁粒度是Segment
       JDK 8：synchronized + CAS，锁粒度是桶的第一个节点
    
    3. 哈希冲突：
       JDK 7：只有链表
       JDK 8：链表长度≥8且数组长度≥64时转为红黑树
    
    4. 扩容：
       JDK 7：每个Segment独立扩容
       JDK 8：多线程协同扩容
    
    5. size()方法：
       JDK 7：尝试无锁统计，失败则加锁
       JDK 8：基于baseCount和CounterCell数组统计
    */
    
    // JDK 7实现（简化）
    public static class JDK7ConcurrentHashMap {
        /*
        // 分段锁
        final Segment<K,V>[] segments;
        
        static final class Segment<K,V> extends ReentrantLock {
            // 每个Segment是一个小的HashMap
            transient volatile HashEntry<K,V>[] table;
        }
        
        static final class HashEntry<K,V> {
            final int hash;
            final K key;
            volatile V value;
            volatile HashEntry<K,V> next;
        }
        
        // put操作：定位Segment，锁住该Segment
        public V put(K key, V value) {
            Segment<K,V> segment = segmentFor(hash);
            segment.lock();  // 锁住整个Segment
            try {
                // 在Segment内操作
            } finally {
                segment.unlock();
            }
        }
        */
    }
    
    // JDK 8性能提升原因分析
    public static class JDK8Improvements {
        /*
        性能提升的四大原因：
        
        1. 锁粒度更细：
           JDK 7：锁住整个Segment（包含多个桶）
           JDK 8：只锁住单个桶的第一个节点
        
        2. 红黑树优化：
           链表过长时转为红黑树，查找从O(n)优化为O(log n)
        
        3. CAS无锁化：
           空桶插入使用CAS，避免加锁
        
        4. 扩容优化：
           多线程协同扩容，提高扩容效率
        */
        
        // 性能基准测试
        public static void benchmark() {
            /*
            测试场景：100个线程并发put 100万次
            
            JDK 7 ConcurrentHashMap: 4500ms
            JDK 8 ConcurrentHashMap: 1800ms (提升2.5倍)
            
            测试场景：链表长度平均20，100个线程并发get
            
            JDK 7: 2200ms
            JDK 8（红黑树）: 800ms (提升2.75倍)
            */
        }
    }
    
    // 升级注意事项
    public static class MigrationConsiderations {
        /*
        从JDK 7升级到JDK 8的注意事项：
        
        1. 序列化兼容性：
           JDK 7和JDK 8的序列化格式不兼容
           不能直接将JDK 7序列化的ConcurrentHashMap在JDK 8中反序列化
        
        2. 迭代器行为：
           JDK 7：弱一致性迭代器
           JDK 8：弱一致性迭代器，但实现不同
        
        3. null值处理：
           两者都不允许null键和null值
        
        4. 并发级别参数：
           JDK 7的concurrencyLevel参数在JDK 8中已忽略
           但为了兼容性仍然保留
        
        5. size()精度：
           JDK 7的size()可能不精确
           JDK 8的size()更精确，推荐使用mappingCount()
        */
    }
}
```

##### 追问2：CopyOnWriteArrayList的迭代器为什么不会抛出ConcurrentModificationException？

**深度原理分析：**

```java
public class COWIteratorSafety {
    /*
    原因：CopyOnWriteArrayList的迭代器基于快照
    
    关键点：
    1. 迭代器创建时获取数组快照：snapshot = getArray()
    2. 迭代过程中始终使用这个快照
    3. 写操作修改的是新数组，不影响快照
    */
    
    // 源码分析
    public static class COWIteratorAnalysis {
        // 迭代器构造方法
        COWIterator(Object[] elements, int initialCursor) {
            snapshot = elements;  // 保存快照引用
            cursor = initialCursor;
        }
        
        // next()方法：从快照读取
        public E next() {
            if (!hasNext())
                throw new NoSuchElementException();
            return (E) snapshot[cursor++];  // 读取快照
        }
        
        // 为什么没有ConcurrentModificationException？
        // 因为迭代器不检查modCount（修改计数）
        // ArrayList的迭代器会检查expectedModCount != modCount
        // CopyOnWriteArrayList没有这个检查
    }
    
    // 对比ArrayList的fail-fast迭代器
    public static class ArrayListIterator {
        /*
        ArrayList.Itr的实现：
        
        int expectedModCount = modCount;  // 保存期望的修改计数
        
        final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }
        
        每次迭代操作都调用checkForComodification()
        
        CopyOnWriteArrayList没有modCount机制
        所以不会抛出ConcurrentModificationException
        */
    }
    
    // 弱一致性演示
    public static void demonstrateWeakConsistency() throws InterruptedException {
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
        list.add("A");
        list.add("B");
        list.add("C");
        
        // 创建迭代器（快照：["A","B","C"]）
        Iterator<String> it = list.iterator();
        
        // 修改列表
        list.add("D");  // 创建新数组["A","B","C","D"]
        
        // 迭代器仍然遍历旧快照
        System.out.println("迭代器输出：");
        while (it.hasNext()) {
            System.out.println(it.next());  // 输出A,B,C（没有D）
        }
        
        System.out.println("实际列表：");
        for (String s : list) {
            System.out.println(s);  // 输出A,B,C,D
        }
    }
    
    // 使用场景建议
    public static class UsageRecommendations {
        /*
        适合使用CopyOnWriteArrayList迭代器的场景：
        
        1. 事件监听器列表
           - 注册/注销监听器不频繁
           - 事件触发时遍历监听器
        
        2. 配置信息快照
           - 配置偶尔更新
           - 需要获取某个时刻的配置快照
        
        3. 只读视图
           - 需要提供数据的不可变视图
        
        不适合的场景：
        1. 需要实时看到最新修改
        2. 频繁修改的列表
        3. 需要精确一致性的场景
        */
    }
}
```

##### 追问3：ConcurrentHashMap的size()和mappingCount()有什么区别？

**size() vs mappingCount()深度解析：**

```java
public class SizeVsMappingCount {
    
    // ConcurrentHashMap中的计数实现
    public static class CounterImplementation {
        /*
        计数机制：分散计数（避免竞争）
        
        基础计数：baseCount（volatile long）
        分散计数：CounterCell[]（当竞争激烈时使用）
        */
        
        private transient volatile long baseCount;
        private transient volatile CounterCell[] counterCells;
        
        // size()方法实现
        public int size() {
            long n = sumCount();  // 计算总和
            return ((n < 0L) ? 0 :
                    (n > (long)Integer.MAX_VALUE) ? Integer.MAX_VALUE :
                    (int)n);
        }
        
        // mappingCount()方法实现
        public long mappingCount() {
            long n = sumCount();
            return (n < 0L) ? 0L : n; // 直接返回long
        }
        
        // 计算总数
        final long sumCount() {
            CounterCell[] as = counterCells;
            long sum = baseCount;
            if (as != null) {
                for (CounterCell a : as) {
                    if (a != null)
                        sum += a.value;
                }
            }
            return sum;
        }
        
        // CounterCell：用于分散计数
        @sun.misc.Contended  // 避免伪共享
        static final class CounterCell {
            volatile long value;
            CounterCell(long x) { value = x; }
        }
    }
    
    // 为什么需要分散计数？
    public static class WhyScatteredCounting {
        /*
        问题：高并发下，所有线程竞争同一个计数器（baseCount）
        解决方案：使用CounterCell数组分散竞争
        
        流程：
        1. 尝试CAS更新baseCount
        2. 如果失败，线程分配到某个CounterCell
        3. 更新对应的CounterCell
        4. 求和时累加所有CounterCell
        
        类似于LongAdder的实现
        */
        
        // addCount方法的核心逻辑（简化）
        private final void addCount(long x, int check) {
            CounterCell[] as; long b, s;
            
            // 尝试CAS更新baseCount
            if ((as = counterCells) != null ||
                !U.compareAndSwapLong(this, BASECOUNT, b = baseCount, s = b + x)) {
                // CAS失败，使用CounterCell
                CounterCell a; long v; int m;
                boolean uncontended = true;
                
                if (as == null || (m = as.length - 1) < 0 ||
                    (a = as[ThreadLocalRandom.getProbe() & m]) == null ||
                    !(uncontended = 
                      U.compareAndSwapLong(a, CELLVALUE, v = a.value, v + x))) {
                    // 创建或扩容CounterCell数组
                    fullAddCount(x, uncontended);
                    return;
                }
                if (check <= 1)
                    return;
                s = sumCount();
            }
        }
    }
    
    // 选择建议
    public static class SelectionGuide {
        /*
        什么时候用size()？什么时候用mappingCount()？
        
        使用size()的场景：
        - 确定元素数量不会超过Integer.MAX_VALUE
        - 需要int返回值（兼容旧代码）
        - 简单的大小检查
        
        使用mappingCount()的场景：
        - 大数据量（可能超过21亿）
        - 精确计数需求
        - 新代码（推荐）
        
        注意：两者都是近似实时值
        因为并发环境下，计数在不停变化
        */
        
        // 实际使用示例
        public void exampleUsage() {
            ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
            
            // 监控场景：使用mappingCount()更准确
            long count = map.mappingCount();
            if (count > 1000000L) {
                System.out.println("Map大小超过100万: " + count);
            }
            
            // 兼容性场景：使用size()
            int size = map.size();
            if (size > 1000) {
                System.out.println("Map大小超过1000: " + size);
            }
        }
    }
    
    // 性能考虑
    public static class PerformanceConsideration {
        /*
        size()和mappingCount()的性能对比：
        
        1. 计算开销相同：都调用sumCount()
        2. 返回类型不同：
           size()：需要int类型转换和边界检查
           mappingCount()：直接返回long
        
        3. 建议：优先使用mappingCount()
           - 更准确（long类型）
           - 没有额外的转换开销
           - 语义更清晰
        */
    }
}
```

##### 追问4：如何选择ConcurrentHashMap和Collections.synchronizedMap？

**对比分析与选择指南：**

```java
public class ConcurrentHashMapVsSynchronizedMap {
    
    // 性能对比测试
    public static void performanceBenchmark() throws InterruptedException {
        int threadCount = 100;
        int operations = 100000;
        
        // 测试ConcurrentHashMap
        Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();
        long concurrentTime = testMap(concurrentMap, threadCount, operations);
        
        // 测试synchronizedMap
        Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());
        long syncTime = testMap(syncMap, threadCount, operations);
        
        System.out.printf("ConcurrentHashMap: %d ms%n", concurrentTime);
        System.out.printf("SynchronizedMap: %d ms%n", syncTime);
        System.out.printf("性能提升: %.2f%%%n", 
            (double)(syncTime - concurrentTime) / syncTime * 100);
        
        /*
        典型结果：
        低竞争（线程数≤CPU核心数）：
          ConcurrentHashMap: 1200ms
          SynchronizedMap: 1800ms（慢50%）
        
        高竞争（线程数>>CPU核心数）：
          ConcurrentHashMap: 3500ms  
          SynchronizedMap: 8500ms（慢143%）
        */
    }
    
    // 功能特性对比
    public static class FeatureComparison {
        /*
        特性对比表：
        
        特性                | ConcurrentHashMap       | SynchronizedMap
        -------------------|-------------------------|------------------
        并发控制            | 分段锁/CAS+synchronized | 全表锁
        性能                | 高并发下性能好          | 高并发下性能差
        空值                | 不允许null键值          | 允许null键值
        迭代器              | 弱一致性，线程安全       | 快速失败，需外部同步
        原子操作            | 支持(compute等)         | 不支持
        扩容                | 多线程协同扩容          | 单线程扩容
        内存占用            | 较高（额外数据结构）     | 较低
        */
    }
    
    // 选择指南
    public static class SelectionGuide {
        /*
        选择ConcurrentHashMap的场景：
        
        1. 高并发读写
           - 多线程频繁读写
           - 需要高吞吐量
        
        2. 需要原子操作
           - computeIfAbsent/computeIfPresent
           - merge/replace等
        
        3. 大容量Map
           - 元素数量多
           - 需要高效扩容
        
        4. 不需要null值
           - 业务逻辑不允许null
        
        选择Collections.synchronizedMap的场景：
        
        1. 低并发场景
           - 线程竞争不激烈
        
        2. 需要null值
           - 业务需要null键或null值
        
        3. 简单的线程安全包装
           - 已有HashMap需要线程安全
           - 代码简单
        
        4. 精确的迭代一致性
           - 需要迭代时看到最新修改（配合外部同步）
        */
        
        // 实际代码示例
        public class CacheExample {
            // 场景：高并发缓存 → ConcurrentHashMap
            private final ConcurrentHashMap<String, Object> cache = 
                new ConcurrentHashMap<>();
            
            public Object get(String key) {
                return cache.get(key);
            }
            
            public void put(String key, Object value) {
                cache.put(key, value);
            }
            
            public Object computeIfAbsent(String key, Function<String, Object> mappingFunction) {
                return cache.computeIfAbsent(key, mappingFunction);
            }
        }
        
        public class ConfigurationExample {
            // 场景：配置信息（允许null值） → SynchronizedMap
            private final Map<String, String> config = 
                Collections.synchronizedMap(new HashMap<>());
            
            public String getConfig(String key) {
                return config.get(key);  // 可能返回null
            }
            
            public void setConfig(String key, String value) {
                config.put(key, value);  // value可以是null
            }
            
            // 迭代时需要外部同步
            public Map<String, String> getAllConfigs() {
                synchronized (config) {
                    return new HashMap<>(config);
                }
            }
        }
    }
    
    // 混合使用策略
    public static class HybridStrategy {
        /*
        根据场景混合使用：
        
        1. 读多写少：CopyOnWriteMap（自定义）
        2. 写多读少：ConcurrentHashMap
        3. 需要null值：Collections.synchronizedMap
        4. 需要精确控制：手动同步
        
        示例：两级缓存
        */
        
        public class TwoLevelCache {
            // 一级缓存：ConcurrentHashMap（高频访问）
            private final ConcurrentHashMap<String, Object> l1Cache = 
                new ConcurrentHashMap<>();
            
            // 二级缓存：SynchronizedMap（低频访问，允许null）
            private final Map<String, Object> l2Cache = 
                Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
                    @Override
                    protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
                        return size() > 1000;
                    }
                });
            
            public Object get(String key) {
                // 先查L1
                Object value = l1Cache.get(key);
                if (value != null) {
                    return value;
                }
                
                // L1未命中，查L2
                synchronized (l2Cache) {
                    value = l2Cache.get(key);
                }
                
                // 如果L2命中，回填L1
                if (value != null) {
                    l1Cache.put(key, value);
                }
                
                return value;
            }
        }
    }
}
```

#### 总结层：一句话核心记忆

**对于3年经验后端工程师**：记住 **"ConcurrentHashMap是并发Map的首选，JDK 8+采用synchronized+CAS+红黑树实现高并发；CopyOnWriteArrayList适合读多写少的List场景，通过写时复制保证线程安全但内存开销大"**。选择时 **"高并发读写用ConcurrentHashMap，监听器配置等读多写少用CopyOnWriteArrayList，需要null值或简单同步用Collections.synchronized包装"**，理解底层实现才能在并发编程中游刃有余。



### **题目10：死锁的产生条件、排查与避免方法**
#### 原理层：JVM与OS层面发生了什么

##### 1.1 死锁的四个必要条件（必须同时满足）
1. **互斥访问**：资源同一时间只能被一个线程占有
2. **持有并等待**：线程持有资源的同时请求新资源
3. **不可剥夺**：资源只能由持有线程主动释放
4. **循环等待**：多个线程形成环形等待链

##### 1.2 JVM内存模型中的死锁表现
```java
// 运行时内存状态示意图（两个线程、两个锁）
Thread-A栈帧:                  Thread-B栈帧:
┌─────────────────┐          ┌─────────────────┐
│ 持有锁: Object1 │          │ 持有锁: Object2 │
│ 等待锁: Object2 │          │ 等待锁: Object1 │
└─────────────────┘          └─────────────────┘
        ↓                           ↓
    对象监视器                   对象监视器
    ┌───────┐                   ┌───────┐
    │Object1│                   │Object2│
    └───────┘                   └───────┘
        ↑                           ↑
    等待获取 <─────循环等待─────> 等待获取
```

##### 1.3 操作系统层面的线程状态
```
操作系统线程状态:
Thread-A: BLOCKED (等待Object2的Monitor)
Thread-B: BLOCKED (等待Object1的Monitor)

JVM内部:
- 每个对象都有Monitor（监视器锁）
- 线程通过enter_monitor尝试获取锁
- 获取失败则进入等待队列，不会主动释放已持有的锁
```

#### 场景层：业务代码中的死锁案例

##### 2.1 反例：典型的转账死锁（踩坑）
```java
// ❌ 错误示范：账户转账，锁顺序不一致导致死锁
class BankAccount {
    private final String id;
    private int balance;
    
    public BankAccount(String id, int balance) {
        this.id = id;
        this.balance = balance;
    }
    
    public void transfer(BankAccount target, int amount) {
        // 先锁住自己，再锁对方（问题：两个线程可能以相反顺序加锁）
        synchronized (this) {
            System.out.println(Thread.currentThread().getName() + 
                " 锁定 " + this.id);
            
            // 模拟业务操作耗时，增加死锁概率
            try { Thread.sleep(100); } catch (InterruptedException e) {}
            
            synchronized (target) {
                System.out.println(Thread.currentThread().getName() + 
                    " 锁定 " + target.id);
                this.balance -= amount;
                target.balance += amount;
            }
        }
    }
}

// 使用场景：两个账户互相转账
public static void main(String[] args) {
    BankAccount accountA = new BankAccount("A", 1000);
    BankAccount accountB = new BankAccount("B", 1000);
    
    // 线程1：A→B转账100
    new Thread(() -> accountA.transfer(accountB, 100)).start();
    
    // 线程2：B→A转账100（与线程1形成循环等待）
    new Thread(() -> accountB.transfer(accountA, 100)).start();
}
```

##### 2.2 正例1：固定锁顺序解决死锁（最佳实践）
```java
// ✅ 正确示范：通过统一加锁顺序避免死锁
class SafeBankAccount {
    private final String id;
    private static final Object globalOrderLock = new Object();
    private int balance;
    
    public void safeTransfer(SafeBankAccount target, int amount) {
        // 确定固定的锁获取顺序
        SafeBankAccount first = this;
        SafeBankAccount second = target;
        
        // 通过ID比较确定顺序（保证全局一致）
        if (this.id.compareTo(target.id) > 0) {
            first = target;
            second = this;
        }
        
        synchronized (first) {
            synchronized (second) {
                // 或者使用全局顺序锁
                // synchronized (globalOrderLock) {
                //     synchronized (this) {
                //         synchronized (target) {
                this.balance -= amount;
                target.balance += amount;
            }
        }
    }
}
```

##### 2.3 正例2：使用tryLock避免死锁（超时机制）
```java
// ✅ 正确示范：使用ReentrantLock的tryLock打破"持有并等待"
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

class TryLockAccount {
    private final Lock lock = new ReentrantLock();
    private int balance;
    
    public boolean tryTransfer(TryLockAccount target, int amount, 
                              long timeout, TimeUnit unit) throws InterruptedException {
        long startTime = System.nanoTime();
        long timeoutNanos = unit.toNanos(timeout);
        
        while (true) {
            // 尝试获取自己的锁
            if (this.lock.tryLock()) {
                try {
                    // 尝试获取对方的锁（带超时）
                    long remaining = timeoutNanos - (System.nanoTime() - startTime);
                    if (target.lock.tryLock(remaining, TimeUnit.NANOSECONDS)) {
                        try {
                            if (this.balance >= amount) {
                                this.balance -= amount;
                                target.balance += amount;
                                return true;
                            }
                            return false; // 余额不足
                        } finally {
                            target.lock.unlock();
                        }
                    }
                } finally {
                    this.lock.unlock();
                }
            }
            
            // 检查是否超时
            if (System.nanoTime() - startTime >= timeoutNanos) {
                return false; // 超时未获取到锁
            }
            
            // 随机休眠，避免活锁
            Thread.sleep((long)(Math.random() * 10));
        }
    }
}
```

#### 追问层：面试官连环炮问题

##### 3.1 如何快速定位生产环境的死锁？
```bash
# 1. 使用jstack获取线程转储
jstack <pid> > thread_dump.txt

# 2. 在输出中搜索"deadlock"，jstack会自动检测并报告
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f8b5c0068b8 (object 0x000000076ab45c20, a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f8b5c007bc8 (object 0x000000076ab45c30, a java.lang.Object),
  which is held by "Thread-1"

# 3. 使用JConsole或VisualVM图形化工具
# 4. 线上监控：在日志中打印线程状态，使用APM工具监控
```

##### 3.2 除了synchronized，数据库事务中如何避免死锁？
```sql
-- 1. 统一SQL执行顺序（先更新表A，再更新表B）
-- 2. 使用事务超时
SET LOCK_TIMEOUT 3000; -- SQL Server
-- 或
SET innodb_lock_wait_timeout = 3; -- MySQL InnoDB

-- 3. 降低隔离级别（如从RR降到RC）
-- 4. 使用乐观锁（版本号）代替悲观锁
```

##### 3.3 读写锁（ReentrantReadWriteLock）会产生死锁吗？
```java
// 会！特别是锁降级不当的情况下
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// 错误：读锁升级写锁（不支持，会死锁）
rwLock.readLock().lock();
try {
    // 这里尝试获取写锁会永远等待
    rwLock.writeLock().lock(); // ❌ 死锁！
} finally {
    rwLock.readLock().unlock();
}

// 正确：写锁降级读锁（允许）
rwLock.writeLock().lock();
try {
    // 写操作...
    rwLock.readLock().lock(); // ✅ 锁降级
} finally {
    rwLock.writeLock().unlock(); // 释放写锁，保持读锁
}
```

##### 3.4 分布式锁会出现死锁吗？如何解决？
```java
// 分布式锁同样会有死锁，更复杂
// 解决方案：
// 1. 设置合理的锁超时时间（Redis: SET key value EX 30 NX）
// 2. 使用Redlock算法（Redis分布式锁算法）
// 3. 使用ZooKeeper的临时有序节点
// 4. 业务层添加唯一事务ID，实现全局锁顺序

// 示例：Redis锁带超时
String result = jedis.set(lockKey, requestId, "NX", "EX", 30);
if ("OK".equals(result)) {
    try {
        // 业务操作
    } finally {
        // Lua脚本保证原子性释放
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                       "return redis.call('del', KEYS[1]) else return 0 end";
        jedis.eval(script, 1, lockKey, requestId);
    }
}
```

##### 3.5 如何设计系统从根本上减少死锁概率？
```java
// 架构层面：
// 1. 无锁编程：使用ThreadLocal、CAS操作
// 2. 不可变对象：避免共享可变状态
// 3. 消息队列：将同步调用改为异步消息
// 4. 协程/纤程：避免线程阻塞

// 示例：使用Disruptor无锁队列
public class DisruptorExample {
    public static void main(String[] args) {
        Disruptor<Event> disruptor = new Disruptor<>(
            Event::new, 1024, DaemonThreadFactory.INSTANCE);
        
        disruptor.handleEventsWith((event, sequence, endOfBatch) -> {
            // 无锁处理事件
            process(event);
        });
        
        disruptor.start();
    }
}
```

#### 总结层：一句话记住核心

**死锁是四个必要条件同时满足的结果，预防死锁的核心就是打破其中任意一个条件，最实用的是通过固定锁顺序打破"循环等待"或使用tryLock打破"持有并等待"。**


## 4. 踩坑雷达

### **案例1：线程池配置不当导致OOM**
**故障现象**：某订单系统在双11大促期间发生OOM，监控显示堆内存持续增长直至崩溃。

**根本原因**：
```java
// 错误配置：使用无界队列
ExecutorService executor = Executors.newFixedThreadPool(200);
// 实际上：new ThreadPoolExecutor(nThreads, nThreads, 0L, TimeUnit.MILLISECONDS, 
//                               new LinkedBlockingQueue<Runnable>()); // 无界队列！

// 当任务提交速度 > 处理速度时，队列无限增长，最终OOM
```

**如何避免**：
```java
// 正确姿势：使用有界队列 + 合理拒绝策略
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    100, 200, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(1000),  // 有界队列
    new ThreadPoolExecutor.CallerRunsPolicy()  // 降级策略
);

// 添加监控告警
if (executor.getQueue().size() > 800) {
    alert("线程池队列积压严重！");
}
```

### **案例2：虚拟线程中的ThreadLocal泄漏**
**故障现象**：JDK 21虚拟线程（Virtual Threads）项目中，ThreadLocal未清理导致内存持续增长。

**根本原因**：
```java
// 虚拟线程廉价，可能创建数百万个
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> {
            ThreadLocal<byte[]> local = new ThreadLocal<>();
            local.set(new byte[1024 * 1024]);  // 每个线程1MB
            // 忘记local.remove()！虚拟线程结束后，ThreadLocalMap仍被引用
            // 因为虚拟线程的载体线程被池化复用
        });
    }
}
// 百万虚拟线程 = 1TB潜在内存占用！
```

**如何避免**：
```java
// 方案1：使用try-with-resources确保清理
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> {
        try {
            ThreadLocal<byte[]> local = new ThreadLocal<>();
            local.set(new byte[1024 * 1024]);
            // 业务逻辑
        } finally {
            // 必须清理！
            ThreadLocalHolder.clearAll();  // 自定义清理工具
        }
    });
}

// 方案2：使用Scoped Values（JDK 21预览特性）
ScopedValue.runWhere(USER_CONTEXT, user, () -> {
    // 自动清理，无需手动remove
});
```

## 5. 速记卡片

| 类别 | 概念/参数 | 默认值/关键点 | 记忆口诀 | 注意事项 |
|------|----------|---------------|----------|----------|
| **synchronized** | 锁升级路径 | 无锁→偏向→轻量→重量 | "一偏二轻三重量" | 偏向锁JDK15默认禁用 |
| **volatile** | 内存屏障 | 写：StoreStore+StoreLoad<br>读：LoadLoad+LoadStore | "写前写后，读前读后" | 不保证原子性 |
| **AQS** | state含义 | 0=无锁，>0=有锁/资源数 | "state是灵魂" | 需实现tryAcquire |
| **ThreadPool** | 核心参数 | 核、最、活、队、厂、拒 | "核最活，队厂拒" | 队列用有界的 |
| **拒绝策略** | 四种策略 | 抛异、调执、丢弃、弃老 | "抛调丢弃" | CallerRuns最安全 |
| **ThreadLocal** | 内存泄漏 | key弱引用，value强引用 | "弱key强value" | 必须remove() |
| **锁等待** | 死锁条件 | 互斥、占有等待、不可剥夺、循环等待 | "互占不循" | 破坏任一即可 |
| **CAS** | ABA问题 | 版本号AtomicStampedReference | "加戳防ABA" | 基础类型无需担心 |
| **线程状态** | 6种状态 | NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED | "新可就，阻塞等时终" | RUNNABLE含运行/就绪 |
| **并发容器** | 选型指南 | ConcurrentHashMap（并发Map）<br>CopyOnWriteArrayList（读多写少List）<br>ConcurrentLinkedQueue（高并发Queue） | "Map用CHM，读多用COW" | 根据场景选择 |

---

**考前最后提醒**：
1. **锁升级流程**必须能画图说明，特别是Mark Word变化
2. **线程池工作流程**是100%会问的，七步流程背熟
3. **ThreadLocal内存泄漏**要能画引用关系图
4. **AQS**至少要能说出state和CLH队列的作用
5. 准备一个**线上实际遇到的并发问题**案例（按STAR法则：情境-任务-行动-结果）

**虚拟线程（Loom项目）是未来趋势**，虽然当前面试问的不多，但提前了解能体现技术前瞻性：
- 虚拟线程是用户态线程，由JVM调度
- 创建成本极低（约2KB），可创建数百万个
- 兼容现有Thread API，但ThreadLocal需要小心使用
- I/O密集型应用收益最大，CPU密集型无提升
