---
title: "同步机制"
date: 2021-01-24T13:44:13+08:00
draft: false
description: "同步机制：线程安全问题、同步机制详解、高级锁机制、线程间通信。"
tags: ["线程池", "同步机制"]
categories: [ThreadPool]
---
同步机制：线程安全问题、同步机制详解、高级锁机制、线程间通信。

## 线程安全问题
### 什么是线程安全问题
线程安全问题是指在多线程环境下，多个线程同时访问共享资源时，可能导致数据不一致或程序崩溃的问题。
> 多个线程对共享数据的并发访问缺乏适当的同步机制，导致数据竞争和不一致状态。

- 不确定性：相同的代码在不同的执行环境下可能产生不同的结果，难以预测和重现。
- 时序依赖：程序的正确性依赖于线程的执行时序，时序的微小变化可能导致错误。
- 隐蔽性：问题可能在生产环境中偶发出现，在测试环境中难以发现和调试。

### 竞条条件
是指程序的正确性依赖于多个程序的相对执行时序。当多个线程同时访问和修改共享数据时，最终结果取决于线程调度的时序，这种不确定性就是竞态条件。

如不安全的计数器count++问题、银行转帐的竞态条件。

### 原子性问题
原子性问题是指一个操作在执行过程中不被中断，要么全部执行成功，要么全部执行失败。

如银行转帐问题，从一个账户转出金额后，要么成功，要么失败，不能出现部分转出的情况。

非原子性操作
- 复合操作：i++ 和 ++i；i += 5；复合赋值操作。
- 检查后执行：if（condition）{action()；}；懒加载模式；单例模式的双重检查。
- 64位数据操作：long类型的读写、double类型的读写、在32位jvm上可能不是原子操作。

### 可见性问题
可见性问题是指当一个线程修改了共享数据，其他线程能够立即看到这个修改。这是由于现代计算机的内存模型和cpu缓存机制导致的。

如一个线程修改了共享变量flag，其他线程能够立即看到这个修改，而不是从缓存中读取旧值。

可见性问题的原因：
- cpu缓存：每个cpu核心都有自己的缓存，变量的修改可能只存在于某个cpu的缓存中，没有同步到主内存。
- 编译器优化：编译器可能会对代码进行优化，将变量缓存到寄存器中，导致其他线程看不到最新值。
- 内存模型：java内存模型允许线程在本地内存中缓存共享变量的副本，导致可见性问题。

#### volatile关键字
> volatile关键字可以解决可见性问题：
> - 确保变量的可见性：当一个线程修改了volatile变量，其他线程能够立即看到这个修改。**volatile确保变量的读写操作直接在主内存中进行，确保了可见性。**
> - 禁止指令重排序优化：volatile变量的读写操作不会被重排序，确保了可见性。**volatile确保了变量的读写操作按照程序的顺序执行，避免了指令重排序导致的可见性问题。**

### 有序性问题
有序性问题是指程序的执行顺序与代码的顺序不一致。这是由于编译器和cpu的优化机制导致的。

指令重排序的类型
- 编译器重排序：编译器在不改变单线程程序语义的前提下，重新安排语句的执行顺序。
- 指令级重排序：cpu在执行指令时，为了提高效率，可能会改变指令的执行顺序。
- 内存系统重排序：由于处理器使用缓存和读写缓冲区，加载和存储操作可能在不同的顺序执行。
#### happens-before规则
happens-before关系是指在java内存模型中，一个操作happens-before另一个操作，这意味着第一个操作的结果对第二个操作可见。

如线程A写入volatile变量x，线程B读取volatile变量x，线程A的写入happens-before线程B的读取，确保了可见性。

- 程序顺序规则：单线程内，代码的执行顺序与程序的顺序一致。
- 监视器锁规则：unlock操作happens-before后续的lock操作，确保了可见性。
- volatile变量规则：对volatile变量的写入happens-before后续对该变量的读取，确保了可见性。
- 传递性规则：如果A happens-before B，且B happens-before C，那么A happens-before C。

### 线程安全的设计原则
- 不可变对象：创建不可变的对象，一旦创建就不能修改其状态。
- 线程封闭：将数据封闭在单个线程中，避免共享。
- 同步机制：使用适当的同步机制保护共享数据。

> - 最小化共享：尽量减少线程间的数据共享
> - 使用并发工具类：优先使用java.util.concurrent包中的工具
> - 避免过度同步：同步的粒度要适当，避免性能问题。
> - 文档化线程安全性：明确标注类的线程安全级别。
> - 测试并发代码：使用压力测试和并发测试工具。

## 同步机制详解
### synchronized原理
synchronized是java中最基本的同步机制，它基于对象监视器实现。每个java对象都有一个内置的监视器锁，当线程进去synchronized代码块或方法时，会自动获取这个锁。

> synchronized的实现基于jvm的monitorenter和monitorexit指令，以及对象头中的Mark Word来存储锁信息。

监视器锁机制
- 对象头：每个java对象的对象头都包含Mark Word，用于存储锁信息。
  - 锁状态：Mark Word中包含锁状态位，用于表示对象是否被锁定。
  - 哈希码：Mark Word中还包含对象的哈希码，用于快速计算哈希值。
  - gc分代年龄：Mark Word中还包含gc分代年龄，用于记录对象的分代年龄。
  - 锁计数器：Mark Word中还包含锁计数器，用于记录获取锁的线程数量。
- 监视器：每个对象都关联一个监视器，包含Owner、EntryList、WaitSet等组件。
  - Owner：指向获取到锁的线程。
  - EntryList：包含所有等待获取锁的线程。
  - WaitSet：包含所有调用wait()方法的线程。
- 锁升级：从偏向锁到轻量级锁再到重量级锁到升级过程，优化性能。

锁状态转换：
- 无锁状态：对象创建时的初始状态，Mark Word存储哈希码；
- 偏向锁：当只有一个线程访问时，偏向该线程，减少同步开销
- 轻量级锁：多个线程竞争锁时，使用cas操作自旋等待，减少线程切换开销。
- 重量级锁：当自旋等待超过一定次数时，升级为重量级锁，阻塞线程。（即竞争激烈时，使用操作系统的互斥量实现）

### synchronized使用方式
用于修饰方法和代码块，根据不同的使用方式，锁定的对象也不同。（实例锁、对象锁、类锁）

- 修饰实例同步方法：锁定当前对象（实例锁）
- 修饰静态同步方法：锁定类对象（类锁）
- 修饰代码块时，可以指定锁定的对象，如synchronized(this)或synchronized(MyClass.class)。
### 死锁问题
死锁是指两个或多个线程互相等待对方释放锁，导致所有线程都无法继续执行的情况。

死锁的四个必要条件：
- 互斥条件：线程对共享资源的访问是互斥的，一次只能有一个线程访问。
- 请求和保持条件：线程在请求资源的同时保持已获取的资源。
- 不剥夺条件：线程已获取的资源在未使用完之前不能被其他线程剥夺。
- 循环等待条件：存在一个线程循环等待链，每个线程都在等待下一个线程释放锁。

死锁预防策略
- 锁排序：对所有锁进行排序，线程在获取锁时，按照排序顺序获取，避免循环等待。
- 超时机制：在获取锁时设置超时时间，超过时间未获取到锁，线程可以放弃等待。
- 避免嵌套锁：尽量避免在一个同步方法中调用另一个同步方法，避免死锁。
- 死锁检测：定期检测系统中的死锁并采取恢复措施。

### wait/notify机制
wait/notify机制是java中用于线程间通信的机制，它基于对象的监视器锁实现。

- wait()：使当前线程进入等待状态，释放锁，直到其他线程调用notify()或notifyAll()方法唤醒它。
- notify()：唤醒等待在该对象监视器锁上的一个线程。
- notifyAll()：唤醒等待在该对象监视器锁上的所有线程。

> 注意：wait()、notify()、notifyAll()方法必须在synchronized代码块或方法中调用，且必须是锁对象的方法，否则会抛出IllegalMonitorStateException异常。

- 总是在while循环中使用wait()方法，而不是if语句。
- 优先使用notifyAll()方法，而不是notify()方法，避免信号丢失。
- wait方法会抛出InterruptedException异常，需要在catch块中处理。
- 确保wait和notify操作的是同一个对象。

## 高级锁机制
### ReentrantLock详解
ReentrantLock是java并发包中提供的可重入锁，它提供了比synchronized更灵活的锁机制。与synchronized相比，ReentrantLock提供了更多的功能，如超时等待、可中断等待、公平锁等。

> ReentrantLock支持重入锁，同一个线程可以多次获取同一把锁，每次获取锁时计数器都加1，释放锁时计数器减1，当计数器为0时锁才被真正释放。

与synchronized区别
- ReentrantLock是api层面的锁，手动获取和释放锁，可中断锁，支持公平锁和非公平锁，支持超时机制tryLock()。
- synchronized是jvm内置的关键字层面的锁，自动获取和释放锁，不可中断锁，非公平锁，无设置超时时间。

### 公平锁和非公平锁
- 公平锁：按照线程请求锁的顺序来分配锁，先请求的线程先获得锁，避免了线程饥饿问题，性能相对较低，适合对公平性要求较高的场景，如银行排队取款。
- 非公平锁：不按照线程请求锁的顺序来分配锁，可能会导致某些线程一直等待锁，允许插队获取锁，性能相对较高，适合对性能要求较高的场景。

### ReadWriteLock读写锁
ReadWriteLock是java并发包中提供的读写锁，它提供了比synchronized更灵活的锁机制。与synchronized相比，ReadWriteLock提供了更多的功能，如读写分离、读读共享等。它允许多个线程同时读取共享资源，但只允许一个线程写入。

- 读写锁：读写锁分为读锁和写锁，多个线程可以同时获取读锁，但是只能有一个线程获取写锁。
- 读读共享：多个线程可以同时获取读锁，因为读操作不会修改数据，所以多个线程可以同时读取数据。
- 写写互斥和读写互斥：当一个线程获取写锁时，其他线程无论是获取读锁还是写锁，都必须等待。

锁降级示例
```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
public class ReadWriteLockExample {
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    private volatile boolean dataReady = false;
    private String data;

    public String getData(){
        lock.readLock().lock();
        try{
            if(!dataReady){
                //释放读锁，获取写锁
                lock.readLock().unlock();
                lock.writeLock().lock();
                try{
                    //双重检查
                    if(!dataReady){
                        //模拟耗时操作
                        Thread.sleep(1000);
                        data = "new data";
                        dataReady = true;
                    }
                    //锁降级，写锁降级为读锁
                    lock.readLock().lock();
                }finally{
                    //获取写锁后，需要重新获取读锁，才能继续读取数据
                    lock.writeLock().unlock();
                }
            }
            return data;
        }finally{
            lock.readLock().unlock();
        }
    }
```
### Condition接口

Condition接口提供了类似Object.wait()和Object.notify()的功能，用于线程间通信。它可以与ReentrantLock或ReentrantReadWriteLock一起使用，实现线程的等待和唤醒。一个Lock对象可以创建多个Condition对象，每个Condition对象对应一个等待队列，实现更精确的线程通信。

- await()：使当前线程进入等待状态，释放锁，直到其他线程调用signal()或signalAll()方法唤醒它。
- signal()：唤醒等待在该Condition上的一个线程。
- signalAll()：唤醒等待在该Condition上的所有线程。

生产者消费者模式
```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;
import java.util.LinkedList;
import java.util.Queue;

public class BlockingQueue{
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity;

    public BlockingQueue(int capacity){
        this.capacity = capacity;
    }

    public void put(T item) throws InterruptedException{
        lock.lock();
        try{
            while(queue.size() == capacity){
                //队列已满，生产者线程等待
                notFull.await();
            }
            queue.offer(item);
            //生产一个元素，唤醒等待在notEmpty条件上的消费者线程
            notEmpty.signal();
        }finally{
            lock.unlock();
        }
    }

    public T take() throws InterruptedException{
        lock.lock();
        try{
            while(queue.isEmpty()){
                //队列为空，消费者线程等待
                notEmpty.await();
            }
            T item = queue.poll();
            //消费一个元素，唤醒等待在notFull条件上的生产者线程
            notFull.signal();
            return item;
        }finally{
            lock.unlock();
        }
    }
    public int size(){
        lock.lock();
        try{
            return queue.size();
        }finally{
            lock.unlock();
        }
    }
}
```
### StampedLock高级特性
StampedLock是java8引入的新锁机制，它提供了乐观读锁机制。在读多写少场景下性能更优。StampedLock不支持重入和Condition。

> 乐观读锁不会阻塞写操作，读取时先获取一个stamp，读取完成后验证stamp是否有效。如果stamp无效，说明有其他线程修改了数据，需要重新读取，并升级为悲观读锁。

优势：
- StampedLock乐观读不阻塞写操作，读多写少的场景性能优异，支持锁升级和降级，内存占用更小。
- 但是不支持重入、不支持Condition、使用复杂度较高，适合特定场景使用。

### 练习
- 使用ReentrantLock实现银行转帐功能，避免死锁。
  - 全局顺序（hashCode定序）
    - 按账户顺序（按账户号定序）
    - 
    ```java
    Account first = this.id < target.id ? this : target;
    Account second = this.id < target.id ? target : this;
    first.lock.lock();
    second.lock.lock();
    try{
        //转账操作
    }finally{
        second.lock.unlock();
        first.lock.unlock();
    }
    //使用ReentrantLock代替synchronized，可以手动控制加锁顺序，从而破坏死锁四个必要条件中的“循环等待”。
    ```
  - 尝试锁（tryLock+回退）：希望“不阻塞，失败就重试”。
- 使用ReadWriteLock实现一个高性能的线程安全缓存系统。
  - 读完全并发，写独占，支持过期策略（惰性过期删除）、容量淘汰（lru）、缓存穿透保护（computeIfAbsent:先乐观读、没命中，加写锁再查一次（双重检查），再读一次，加载）。
- 使用Condition接口实现一个支持多生产者多消费者的阻塞队列。
  - 使用ReentrantLock和Condition，支持公平和非公平锁。
  - 支持多生产者多消费者模式，每个生产者对应一个等待队列，每个消费者对应一个等待队列。使用ReentrantLock创建两个Condition对象（notFull和notEmpty），分别对应生产和消费操作。await()之前一定while判断条件，防止虚假唤醒。公平锁参数可以控制线程先后顺序，代价是少量吞吐量下降。
  - 与LinkedBlockingQueue对比，支持多生产者多消费者模式，性能持平，但是可以随意定制公平策略、测速和监控。
- 对于synchronized、ReentrantLock、ReadWriteLock、StampedLock在不同场景下的性能表现。
  - synchronized简单够用
  - ReentrantLock功能最全，性能一般，支持公平锁和非公平锁，支持超时，支持重入。
  - ReadWriteLock读多写少，性能好，读完全并发，写独占。
  - StampedLock读极致，写牺牲。乐观读不阻塞写操作，读多写少的场景性能优异，支持锁升级和降级，内存占用更小。但是不支持重入、不支持Condition、使用复杂度较高，适合特定场景使用。

| 维度 | synchronized | ReentrantLock(非公平) | ReentrantReadWriteLock | StampedLock(乐观读) |
| --- | --- | --- | --- | --- |
| jvm内置 | 是 | 否 | 否 | 否 |
| 可中断/超时/公平| 否 | 是，可配置公平非公平 | 是 | 是 |
| 读写分离 | 否 | 否 | 是 | 是 |
| 乐观读| 否 | 否 | 否 | 是 |
| 重入 | 是 | 是 | 是 | 否 |
| 条件变量 | 否 | 是 | 否 | 否 |
| 锁升级 | 否 | 否 | 否 | 是 |
| 锁降级 | 否 | 否 | 是 | 是 |
| 内存占用 | 低 | 高 | 高 | 低 |
| 性能 | 一般 | 一般 | 好 | 好 |

## 线程间通信
### 共享变量通信
共享变量是线程间通信最基本的方式。多个线程通过访问同一个变量来实现数据交换和状态同步。为了保证线程安全，需要使用适当的同步机制。

> 共享变量通信的关键在于保证原子性和可见性，避免数据竞争和不一致状态。

#### volatile变量
volatile变量是一种特殊类型的变量，它可以被多个线程同时访问，但每次访问时，都会从主内存中读取变量的值，而不是从缓存中读取。volatile变量会禁止线程的指令重排序，保证变量的读取和写入操作是原始的顺序执行。能保证变量的可见性和有序性，适用于简单的状态标志和单一变量的读写操作。

#### 原子变量
java.util.concurrent.atomic包提供了原子变量类，如AtomicInteger、AtomicLong、AtomicBoolean、AtomicReference等，这些类都提供了原子操作，如getAndSet、incrementAndGet、compareAndSet等。原子变量能保证变量的读取和写入操作都是无锁原子的，能保证变量的修改是线程安全的。


### 管道通信
管道通信是一种线程间通信方式，一个生产者线程和一个消费者线程通过管道进行数据交换，提供了一种简单的流式数据传递机制。管道通信的关键在于创建管道，并使用管道的输入输出流进行数据交换。通过PipeInputStream和PipeOutputStream实现线程间的数据交换，适用于生产者消费者模式。

- 字节流管道：PipedInputStream和PipedOutputStream
- 字符流管道：PipedReader和PipedWriter

### 信号量Semaphore
信号量Semaphore是一种用于控制多个线程访问共享资源的工具，它可以限制访问共享资源的线程数量。多个线程可以同时请求信号量，但最多只能有一个线程获得信号量。信号量的作用是保证共享资源被多个线程并发访问时，能按照指定的规则进行访问控制。它维护了一组许可证，线程在访问资源前必须获得许可证。

应用场景
- 连接池管理：限制同时使用的数据库连接数
- 限流控制：控制请求并发的数量
- 资源池：管理有限的共享资源。

- semaphore.acquire()：获取一个许可证，如果当前没有可用的许可证，则阻塞当前线程。
- semaphore.release()：释放一个许可证，如果当前没有许可证，则抛出异常。

### 同步辅助类
同步辅助类提供了一些用于实现线程间同步的工具类，如CountDownLatch、CyclicBarrier、Semaphore、Exchanger、FutureTask等。这些类提供了一些常用的同步机制，如等待所有线程完成、等待指定数量的线程完成、等待所有线程完成并返回结果、等待指定数量的线程完成并交换数据、等待所有线程完成并返回结果等。

#### CountDownLatch
允许一个或多个线程等待其他线程完成操作，它维护一个计数器，当计数器减到0时，等待的线程被唤醒。


CountDownLatch类提供了两个方法：
- countDown()：递减计数器，当计数器减到0时，等待的线程被唤醒。
- await()：等待所有线程完成。如果当前线程在计数器减到0之前被中断，则抛出InterruptedException异常。

```java
CountDownLatch latch = new CountDownLatch(3);
latch.await();
latch.countDown();
```

#### CyclicBarrier
允许一组线程互相等待，直到所有线程都到达某个公共屏障点，然后一起继续执行。与CountDownLatch不同，CyclicBarrier可以重复使用。

该类提供了两个方法：
- await()：等待所有线程到达屏障点。
- reset()：重置屏障，允许再次使用。
```java
//创建屏障，3个线程都到达执行屏障动作
CyclicBarrier barrier = new CyclicBarrier(3);
//等待其他线程到达屏障点
barrier.await();
```
### 数据交换Exchanger
Exchanger类提供了一个同步点，允许两个线程之间进行数据交换。当一个线程调用exchange()方法时，会等待另一个线程调用exchange()方法，然后两个线程交换数据。用于两个线程间需要定期交换数据的场景，如生产者和消费者模式中的缓冲区交换。

该类提供了两个方法：
- exchange(V v)：等待另一个线程调用exchange()方法，然后交换数据。
- exchange(V v, long timeout, TimeUnit unit)：等待另一个线程调用exchange()方法，然后交换数据。如果在指定时间内没有其他线程调用exchange()方法，则抛出TimeoutException异常。
```java
Exchanger<String> exchanger = new Exchanger<>();
//线程1
String data1 = "Thread 1 data";
String exchangedData1 = exchanger.exchange(data1);
//线程2
String data2 = "Thread 2 data";
String exchangedData2 = exchanger.exchange(data2);
```
### 实践建议
- 选择合适的通信方式：避免过度设计，优先使用高级的同步工具：CountDownLatch、CyclicBarrier等。
- 避免死锁：合理设计锁的获取顺序，使用超时机制避免无限等待
- 避免忙等待：使用阻塞操作而不是轮询。
- 异常处理：正确处理InterruptedException
- 资源清理：确保finally块中释放资源。
- 性能考虑：评估不同通信方式的性能开销，选择最优方案。

