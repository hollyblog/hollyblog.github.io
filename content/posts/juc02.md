---
title: "并发编程-锁机制"
date: 2021-01-19T13:40:00+08:00
draft: false
description: "并发编程锁机制：Lock接口、读写锁、Condition条件变量、原子类。"
tags: ["JUC", "并发编程", "锁机制"]
categories: ["JUC"]
---
并发编程锁机制：Lock接口、读写锁、Condition条件变量、原子类。
## Lock 接口
### Lock 接口详解
Lock接口是java并发包（java.util.concurrent.locks）中的核心接口，提供了比synchronized更灵活更强大的锁机制。Lock接口设计目标是提供更细粒度的锁控制，支持可中断的锁获取、超时锁获取以及非阻塞的锁获取。定义了获取锁、释放锁、尝试获取锁、定时获取锁等操作。
#### Lock 接口方法
```java
public interface Lock {
    // 获取锁
    void lock();

    // 可中断地获取锁
    void lockInterruptibly() throws InterruptedException;

    // 尝试获取锁，立即返回结果
    boolean tryLock();

    // 定时获取锁
    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;

    // 释放锁
    void unlock();

    // 创建一个新的Condition对象
    Condition newCondition();
}
```
#### lock vs synchronized
| 特性 | synchronized | Lock接口 |
| --- | --- | --- |
| 锁机制 | 基于JVM | 基于AQS |
|使用方式| 关键字，自动获取或释放 | 接口，手动获取或释放 |
| 锁类型 | 可重入锁 | 可重入锁 |
| 锁获取 | 阻塞式获取 | 阻塞式和非阻塞式（可中断） |
| 锁释放 | 自动释放 | 手动释放 |
| 超时获取锁 | 不支持 | 支持 |
| 条件变量 | 不支持 | 支持 |
| 公平性 | 非公平 | 可配置(公平/非公平) |
| 性能 | jvm优化，轻量级场景更好 | 高竞争场景性能较好 |


### ReentrantLock 可重入锁
ReentrantLock是Lock接口的一个实现类，提供了可重入锁的功能。可重入锁指的是同一个线程可以多次获取同一个锁，而不会导致死锁。ReentrantLock提供了公平锁和非公平锁两种模式，默认是非公平锁。

#### ReentrantLock 构造方法
```java
public ReentrantLock() {
    sync = new NonfairSync();
}

public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
```
#### 基本方法使用
```java
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final ReentrantLock lock = new ReentrantLock();

    public void method1() {
        lock.lock();
        try {
            // 临界区代码
        } finally {
            lock.unlock();// 一定要在finally块中确保锁一定会被释放，避免死锁
        }
    }

    public void method2() {
        lock.lock();
        try {
            // 临界区代码
            method1(); // 可重入调用
        } finally {
            lock.unlock();
        }
    }
}
```
### 公平锁和非公平锁
- 公平锁：按照线程请求锁的顺序进行分配，先到先得。
- 非公平锁：不按照线程请求锁的顺序进行分配，可能会导致某些线程一直获取不到锁。（性能更好，但可能会导致线程饥饿问题）
```java
//java 代码示例
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final ReentrantLock fairLock = new ReentrantLock(true); // 公平锁
    private final ReentrantLock nonFairLock = new ReentrantLock(); // 非公平锁（默认）

    public void method1() {
        fairLock.lock();
        try {
            // 临界区代码
        } finally {
            fairLock.unlock();
        }
    }

    public void method2() {
        nonFairLock.lock();
        try {
            // 临界区代码
        } finally {
            nonFairLock.unlock();
        }
    }
}
```
### 可中断锁
Lock接口中提供了可中断的锁获取方法lockInterruptibly()，这允许等待锁的线程响应中断信号。当一个线程调用该方法获取锁时，如果其他线程中断了该线程，那么该线程会抛出InterruptedException异常，从而可以及时响应中断请求。这在需要取消长时间等待的场景中特别有效。

```java

//java 代码示例
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final ReentrantLock lock = new ReentrantLock();

    public void interruptibleMethod() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            // 临界区代码
        } finally {
            lock.unlock();
        }
    }
    public static void main(String[] args) throws InterruptedException{
        InterruptibleLockExample example = new InterruptibleLockExample();
        //启动第一个线程，获取锁并长时间持有
        Thread thread1 = new Thread(example::interruptibleMethod,"Thread-1");
        thread1.start();
        // 主线程等待一段时间后中断线程1
        Thread.sleep(100);
        thread1.interrupt();
        // 等待线程1响应中断
        thread1.join();
        System.out.println("Thread-1 是否中断：" + thread1.isInterrupted());
    }
```
### 锁超时机制
tryLock()方法提供了非阻塞和超时的获取锁方式，可以有效避免死锁。可以尝试获取锁，如果在指定的时间内无法获取到锁，那么会返回false。这在需要在一定时间内获取锁的场景中非常有用。
```java
//非阻塞锁和超时锁获取
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final ReentrantLock lock = new ReentrantLock();

    public void timedLockMethod() throws InterruptedException {
        if (lock.tryLock(1, TimeUnit.SECONDS)) {
            try {
                // 临界区代码
            } finally {
                lock.unlock();
            }
        } else {
            // 超时处理逻辑
        }
    }
}
//死锁预防
public class DeadlockPreventionExample {
    private final ReentrantLock lock1 = new ReentrantLock();
    private final ReentrantLock lock2 = new ReentrantLock();

    public void method1() throws InterruptedException {
        lock1.tryLock(1, TimeUnit.SECONDS);
        try {
            lock2.tryLock(1, TimeUnit.SECONDS);
            try {
                // 临界区代码
            } finally {
                lock2.unlock();
            }
        } finally {
            lock1.unlock();
        }
    }
    public void method2() throws InterruptedException {
        lock2.tryLock(1, TimeUnit.SECONDS);
        try {
            lock1.tryLock(1, TimeUnit.SECONDS);
            try {
                // 临界区代码
            } finally {
                lock1.unlock();
            }
        } finally {
            lock2.unlock();
        }
    }
}
```
### 最佳实践
- 总是在finally块中释放锁；
- 确保每一个lock()都有对应的unlock()方法调用，避免死锁。  
- 避免在获取锁之前就进入try块；
- 使用tryLock()设置超时时间；
- 按固定顺序获取多个锁；
- 尽量减少锁的持有时间；
- 根据场景选择公平锁和非公平锁；
- 考虑使用读写锁分离读写操作；
- 在低竞争场景优先使用synchronized

> - 锁泄漏：在异常情况下没有正确释放锁
> - 锁顺序不一致：多个锁的获取顺序不固定导致死锁
> - 重复释放锁：在finally块中重复调用unlock()方法，可能会导致IllegalMonitorStateException异常。
> - 忘记释放锁：在finally块中忘记调用unlock()方法，可能会导致锁一直被持有，其他线程无法获取到锁。
## 读写锁
读写锁是一种特殊的锁机制，允许多个线程同时获取读锁，但只允许一个线程获取写锁。这使得读写锁在读写操作频繁的场景下具有较高的并发性。

读写锁通过读写分离的策略，在保证数据一致性的前提下，显著提高了并发读取的性能。

- 共享读锁：多个线程可以同时获取读锁，而不会阻塞其他线程，实现并发读取，提高系统吞吐量。
- 排他写锁：写锁是排他的，独占的，即一次只能有一个线程获取写锁，其他线程无论是获取读锁还是写锁都必须等待。
- 互斥性：读锁和写锁是互斥的，写锁和写锁之间也是互斥的。

适用场景
- 读写操作频繁的场景：当一个资源同时被多个线程读取和写入时，读写锁可以显著提高并发性能。
- 读多写少的场景：当一个资源被多个线程读取，但写入操作较少时，读写锁可以允许多个线程并发读取，而只允许一个线程写入，从而提高系统吞吐量。
- 缓存系统：频繁的读取操作，偶尔的更新操作；
- 配置管理：配置信息读取频繁，修改较少；
- 统计数据：数据查询较多，数据更新较少；
- 资源池：资源获取频繁，资源管理操作较少。

### ReentrantReadWriteLock详解
ReentrantReadWriteLock是Java中ReadWriteLock接口的一个实现类，提供的一个读写锁实现，它支持可重入性，即同一个线程可以多次获取同一个锁。该类维护了两个锁：一个读锁和一个写锁，它们共享同一个同步状态。

ReentrantReadWriteLock的主要方法包括：
- readLock()：获取读锁；
- writeLock()：获取写锁；
- tryReadLock()：尝试获取读锁，如果锁不可用，则返回false；
- tryWriteLock()：尝试获取写锁，如果锁不可用，则返回false；
- unlock()：释放锁；
- isReadLocked()：判断是否有线程获取了读锁；
- isWriteLocked()：判断是否有线程获取了写锁；
- getReadLockCount()：获取当前获取读锁的线程数量；
- getWriteHoldCount()：获取当前获取写锁的线程数量。

```java
public class ReentrantReadWriteLockExample {
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Lock readLock = lock.readLock();
    private final Lock writeLock = lock.writeLock();

    public void readMethod() {
        readLock.lock();
        try {
            // 临界区代码
        } finally {
            readLock.unlock();
        }
    }

    public void writeMethod() {
        writeLock.lock();
        try {
            // 临界区代码
        } finally {
            writeLock.unlock();
        }
    }
}
```
锁的特性
- 可重入性：同一个线程可以多次获取同一个锁，而不会阻塞。
- 公平性：锁的获取是公平的或者是非公平的，可以在构造时指定。
- 超时获取：支持tryLock()方法设置超时时间，避免线程永久阻塞。
### 锁的升级和降级
- 升级：从读锁升级为写锁，需要当前线程持有读锁，且没有其他线程持有读锁或写锁。
- 降级：从写锁降级为读锁，当前线程必须持有写锁，且没有其他线程持有写锁。

ReentrantReadWriteLock支持锁的降级（从写锁降级为读锁），但不支持锁的升级（从读锁升级为写锁）。这是因为锁的降级可能会导致数据不一致的问题和死锁问题。
```java
//锁降级示例
public class LockDowngradeExample {
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Lock readLock = lock.readLock();
    private final Lock writeLock = lock.writeLock();
    private String data = "Hello, World!";

    public void downgradeLock() {
        readLock.lock();
        try{
            if(!dataChanged){
                //需要更新数据，先释放读锁
                readLock.unlock();
                //获取写锁
                writeLock.lock();
                try{
                    //双重检查
                    if(!dataChanged){
                        //更新数据
                        data = "New Data";
                        dataChanged = true;
                    }
                    //锁降级：在释放写锁之前获取读锁
                    readLock.lock();
                }finally{
                    //释放写锁
                    writeLock.unlock();
                }
            }
            //使用数据（持有读锁）
            System.out.println(data);
        } finally {
            //释放读锁
            readLock.unlock();
        }
    }
}
```
锁降级的优势
- 数据一致性：确保在数据更新后立即读取到最新数据
- 性能优化：避免释放写锁后其他线程修改数据
- 原子操作：保证更新和读取操作的原子性
### StampedLock 高级特性
StampedLock是java8 引入的新锁机制，它提供三种锁模式：写锁、悲观读锁和乐观锁。相比ReentrantReadWriteLock，StampedLock在性能上有显著优势，尤其是在读多写少的场景下。

- 写锁：独占锁，与reentrantreadwritelock的写锁功能相同，但不可重入，用于保护写操作。
- 悲观读锁：共享锁，与reentrantreadwritelock的读锁功能相同，但不可重入，用于保护读操作。
- 乐观锁：无锁状态，用于读操作，通过版本号来判断数据是否被修改。
```java
import java.util.concurrent.locks.StampedLock;
public class StampedLockExample {
    private final StampedLock lock = new StampedLock();
    private double x, y;

    //写操作
    public void write(double newX, double newY) {
        long stamp = lock.writeLock();
        try {
            x = newX;
            y = newY;
        } finally {
            lock.unlockWrite(stamp);
        }
    }
    //乐观读
    public double distanceFromOrigin(){
        long stamp = lock.tryOptimisticRead();
        double currentX = x, currentY = y;
        if(!lock.validate(stamp)){
            //数据被修改，重新获取悲观读锁
            stamp = lock.readLock();
            try{
                currentX = x;
                currentY = y;
            }finally{
                lock.unlockRead(stamp);
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }
    //悲观读
    public double[] getCurrentPoint(){
        long stamp = lock.readLock();
        try{
            return new double[]{x, y};
        }finally{
            lock.unlockRead(stamp);
        }
    }
    //读锁升级为写锁
    public void moveIfAtOrigin(double newX, double newY){
        long stamp = lock.readLock();
        try{
            if(x == 0 && y == 0){
                //升级将读锁升级为写锁
                long writeStamp = lock.tryConvertToWriteLock(stamp);
                if(writeStamp != 0L){
                    stamp = writeStamp;
                    x = newX;
                    y = newY;
                }else{
                    //升级失败，释放读锁，获取写锁
                    lock.unlockRead(stamp);
                    stamp = lock.writeLock();
                }         
            }
        }finally{
            lock.unlockRead(stamp);
        }
    }  
}
```
StampedLock的优势
- 性能优化：乐观读模式避免了锁竞争，提高并发性能；在读多写少场景下，StampedLock的性能要优于ReentrantReadWriteLock。
- 锁转换：支持锁模式之间的转换，提高更大的灵活性；
- 无饥饿：写锁不会被读锁无限阻塞，确保写操作的公平性。
- 内存效率：相比ReentrantReadWriteLock，StampedLock在内存占用上更高效，因为它只使用一个锁状态位来表示三种锁模式。
- 简单易用：StampedLock提供了简洁的API，易于使用和理解。
- 功能丰富：StampedLock支持乐观锁、悲观读锁和写锁，满足不同场景的需求。
### 性能对比
读多写少：StampedLock > ReentrantReadWriteLock > synchronized
读写均衡：ReentrantReadWriteLock ~ StampedLock > synchronized
写多读少：synchronized ～ ReentrantReadWriteLock ～ StampedLock
- 可重入需求：ReentrantReadWriteLock
- 公平性要求：ReentrantReadWriteLock
- 简单场景：synchronized
- 读多写少：StampedLock
### 注意事项
- 避免锁升级：ReentrantReadWriteLock不支持从读锁升级到写锁，因为升级会导致死锁。
- 正确释放锁：使用try-finally确保锁在任何情况下都能被释放，避免死锁。
- 避免长时间持锁：减少锁的持有时间，提高并发性
- 合理使用乐观锁：在StampedLock中合理使用乐观锁读模式
- 监控锁竞争：定期监控锁的竞争情况，及时优化。
- 乐观读的正确使用方式是：先调用tryOptimisticRead()获取stamp，读取数据，然后使用validate()方法检查stamp是否有效，如果无效则需要降级为悲观读。（如果返回的戳记有效，则直接使用；如果返回的戳记无效，则说明数据被修改，需要重新获取悲观读锁。）


## Condition条件变量
### Condition接口概述
Condition接口是Java并发包中提供的条件变量实现，它必须与Lock配合使用，提供了比Object.wait()和Object.notify()更强大和灵活的线程间通信机制。Condition允许线程在特定条件下等待，并在条件满足时唤醒。

Condition提供了一种让线程等待特定条件成立的机制，相比Object.wait()和Object.notify()，它支持多个等待队列，提供更精确的线程控制。Condition提供了更丰富的功能，如等待超时、多个等待队列等。

主要方法
- await()：使当前线程等待，直到被signal唤醒或interrupt中断。类似Object.wait()。
- signal()：唤醒一个等待在该条件上的线程。
- signalAll()：唤醒所有等待在该条件上的线程。
- awaitUninterruptibly()：与await()相同，但不响应中断。
- awaitNanos(long nanosTimeout)：使当前线程等待，直到被唤醒、中断或超时。
- awaitMillis(long millisTimeout)：与awaitNanos()相同，但超时单位为毫秒。
- awaitUninterruptiblyNanos(long nanosTimeout)：与awaitNanos()相同，但不响应中断。
- awaitUninterruptiblyMillis(long millisTimeout)：与awaitMillis()相同，但不响应中断。
### await和signal机制
await和signal是Condition的核心机制，它们提供了线程间的协调通信能力。
- await()：使当前线程等待，无限等待，直到被signal唤醒或interrupt中断。
- await(long time, TimeUnit unit)：等待指定时间。
- awaitNanos(long nanosTimeout)：等待指定的纳秒数。
- awaitUntil(Date deadline)：等待直到指定的时间点。
- awaitUninterruptibly()：与await()相同，但不响应中断。

- signal()：唤醒一个等待在该条件上的线程，被唤醒的线程需要重新获取锁；适用于只需要唤醒一个线程的场景。
- signalAll()：唤醒所有等待在该条件上的线程，所有线程竞争获取锁；适用于条件变化影响多个线程的场景。

> 使用await时必须while循环中检查条件，因为可能发生虚假唤醒（spurious wakeup）。这是一种防御性编程的最佳实践。
### 生产者-消费者模式实现
```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class BoundedBuffer{
    private final Object[] buffer;
    private int putIndex = 0;
    private int takeIndex = 0;
    private int count = 0;

    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedBuffer(int capacity){
        buffer = new Object[capacity];
    }

    public void put(T item)throws InterruptedException{
        lock.lock();
        try{
            //等待缓冲区不满
            while(count == buffer.length){
                notFull.await();
            }
            //将元素放入缓冲区
            buffer[putIndex] = item;
            putIndex = (putIndex + 1) % buffer.length;
            count++;
            //通知消费者有元素可用
            notEmpty.signal();
        }
        finally{
            lock.unlock();
        }
    }
    @SuppressWarnings("unchecked")
    public T take()throws InterruptedException{
        lock.lock();
        try{
            //等待缓冲区不空
            while(count == 0){
                notEmpty.await();
            }
            //从缓冲区取出元素
            T item = (T)buffer[takeIndex];
            takeIndex = (takeIndex + 1) % buffer.length;
            count--;
            //通知生产者缓冲区有空间可用
            notFull.signal();
            return item;
        }
        finally{
            lock.unlock();
        }
    }
    public static void main(String[] args){
        BoundedBuffer<Integer> buffer = new BoundedBuffer<>(10);
        //生产者线程
        Thread producer1 = new Thread(() -> {
            try{
                for(int i = 1;i <= 5;i++){
                    buffer.put("Item-p1-" + i);
                    System.out.println("生产者生产：" + i);
                }
            }
            catch(InterruptedException e){
                e.printStackTrace();
            }
        });
        Thread producer2 = new Thread(() -> {
            try{
                for(int i = 1;i <= 5;i++){
                    buffer.put("Item-p2-" + i);
                    System.out.println("生产者生产：" + i);
                }
            }
            catch(InterruptedException e){
                e.printStackTrace();
            }
        });
        //消费者线程
        Thread consumer1 = new Thread(() -> {
            try{
                for(int i = 1;i <= 5;i++){
                    String item = buffer.take();
                    System.out.println("消费者消费：" + item);
                }
            }
            catch(InterruptedException e){
                e.printStackTrace();
            }
        });
        Thread consumer2 = new Thread(() -> {
            try{
                for(int i = 1;i <= 5;i++){
                    String item = buffer.take();
                    System.out.println("消费者消费：" + item);
                }
            }
            catch(InterruptedException e){
                e.printStackTrace();
            }
        });
        //启动线程
        producer1.start();
        producer2.start();
        consumer1.start();
        consumer2.start();
    }
}
```
### 多条件变量的使用
```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class MultiConditionExample{
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition readCondition = lock.newCondition();
    private final Condition writeCondition = lock.newCondition();

    private int readers = 0;
    private boolean writing = false;

    public void readLock() throws InterruptedException{
        lock.lock();
        try{
            //等待没有写操作
            while(writing){
                readCondition.await();
            }
            readers++;
        }
        finally{
            lock.unlock();
        }
    }
    public void readUnlock() throws InterruptedException{
        lock.lock();
        try{
            readers--;
            if(readers == 0){
                //没有读者了，唤醒等待的写者
                writeCondition.signal();
            }
        }
        finally{
            lock.unlock();
        }
    }
    public void writeLock() throws InterruptedException{
        lock.lock();
        try{
            //等待没有读者和写者
            while(writing || readers > 0){
                writeCondition.await();
            }
            writing = true;
        }
        finally{
            lock.unlock();
        }
    }
    public void writeUnlock() throws InterruptedException{
        lock.lock();
        try{
            writing = false;
            //唤醒等待的读者和写者
            writeCondition.signal();
            readCondition.signalAll();           
        }
        finally{
            lock.unlock();
        }
    }
    public static void main(String[] args){
        MultiConditionExample rwLock = new MultiConditionExample();
        //读者线程
        for(int i = 0;i < 5;i++){
            final int readerId = i;
            new Thread(() -> {
                try{
                    rwLock.readLock();
                    System.out.println("读者" + readerId + "读取");
                    rwLock.readUnlock();
                }
                catch(InterruptedException e){
                    e.printStackTrace();
                }
            });
            reader.start();
        }
        //写者线程
        for(int i = 0;i < 2;i++){
            final int writerId = i;
            new Thread(() -> {
                try{
                    rwLock.writeLock();
                    System.out.println("写者" + writerId + "写入");
                    rwLock.writeUnlock();
                }
                catch(InterruptedException e){
                    e.printStackTrace();
                }
            });
            writer.start();
        }
    }
}
```
### Condition vs Object.wait/notify
- Condition 是 ReentrantLock 的一部分，而 wait/notify 是 Object 的方法。
- Condition 可以有多个等待队列，而 wait/notify 只有一个。
- Condition 提供了更丰富的等（超时、不可中断）/通知机制，如 await、signal、signalAll 等。而 wait/notify 只能等待无限时间，且不可中断，且notify只能随机唤醒一个线程。
- Condition 与Lock配合使用，支持公平锁，而 wait/notify 必须在synchronized块中使用。
### 最佳实践
- 总是在while循环中检查条件之后，使用await：防止虚假唤醒
- 正确的锁管理：确保在finally块中释放锁；避免锁泄漏，避免死锁
- 选择合适的signal方法：signal()还是signalAll()：根据业务逻辑，选择是否唤醒所有等待线程。
- 避免死锁：注意锁的顺序
- 处理中断：正确处理InterruptedException，避免线程被中断后继续执行。
- 在线程开始等待之前就发送了信号，导致线程永久等待---信号丢失。
- 合理设计等待条件，避免不必要的唤醒
- 考虑使用公平锁，在某些场景下可以提高性能
- 避免在持有锁的情况下执行耗时操作，因为这会阻塞其他线程的执行。



## 原子类
### Atomic包概述
java的java.util.concurrent.atomic包提供了一组原子类，用于在多线程环境下进行原子操作，无需使用synchronized关键字或其他锁机制。原子类基于CAS（Compare-And-Swap）操作，通过硬件级别的原子指令来实现线程安全，是一种无锁的并发编程技术。

> 核心优势在于：提供了无锁的线程安全操作，避免了传统锁机制可能带来的性能开销和死锁风险。

#### 原子类的分类
- 基本类型原子类：AtomicInteger、AtomicLong、AtomicBoolean
- 数组类型原子类：AtomicIntegerArray、AtomicLongArray、AtomicBooleanArray
- 引用类型原子类：AtomicReference、AtomicReferenceArray
- 字段更新器原子类：AtomicIntegerFieldUpdater、AtomicLongFieldUpdater、AtomicReferenceFieldUpdater
### AtomicInteger详解
AtomicInteger是最常用的原子类之一，提供了对int类型变量的原子操作。它是一个内部使用volatile关键字保证可见性、使用CAS算法保证原子性的原子整数类，用于在多线程环境下进行原子操作。它提供了一系列的方法，用于对整数进行原子操作，如增加、减少、比较并交换等。

常用方法
- get()：获取当前值
- set(int newValue)：设置为新值
- getAndSet(int newValue)：原子地将当前值设置为newValue，并返回旧值
- compareAndSet(int expect, int update)：如果当前值等于expect，则将其设置为update
- incrementAndGet()：原子地将当前值加1
- addAndGet(int delta)：原子地将delta添加到当前值
- getAndAdd(int delta)：原子地将delta添加到当前值，并返回旧值
- getAndIncrement()：原子地将当前值加1，并返回旧值
- decrementAndGet()：原子地将当前值减1
- getAndDecrement()：原子地将当前值减1，并返回旧值

### AtomicReference详解
AtomicReference是一个通用的原子引用类，用于在多线程环境下进行原子操作。它是一个内部使用volatile关键字保证可见性、使用CAS算法保证原子性的原子引用类，用于在多线程环境下进行原子操作。它提供了一系列的方法，用于对引用进行原子操作，如比较并交换等。可以原子地更新对象引用，实现无锁数据结构。

```java
import java.util.concurrent.atomic.AtomicReference;

class User{
    private String name;
    private int age;
    public User(String name,int age){
        this.name = name;
        this.age = age;
    }
    @Override
    public String toString() {
        return "User{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
}
public class AtomicReferenceDemo {
    private static AtomicReference<User> userRef = new AtomicReference<>(new User("张三", 20));
    public static void main(String[] args) {
        User oldUser = userRef.get();
        User newUser = new User("李四", 21);
        boolean success = userRef.compareAndSet(oldUser, newUser);
        if(success){
            System.out.println("更新成功");
        }else{
            System.out.println("更新失败");
        }
    }
}
```
### CAS算法
CAS（Compare-And-Swap）算法是一种无锁的并发编程技术，用于在多线程环境下进行原子操作。它基于硬件级别的原子指令，通过比较当前值与预期值是否相等，来判断是否可以进行原子操作。如果相等，则将当前值更新为新值；如果不相等，则说明有其他线程对当前值进行了修改，当前线程需要重新尝试。   

包含三个操作数：内存位置（V）、预期值（A）和新值（B）。当且仅当V值等于A时，CAS才会将V值更新为B,否则不进行任何操作。

> CAS操作流程：
> 1. 从内存中读取当前值V
> 2. 比较V与预期值A是否相等
> 3. 如果相等，则将V更新为新值B
> 4. 如果不相等，则说明有其他线程对当前值进行了修改，当前线程需要重新尝试

优点
- 无锁操作，避免线程阻塞
- 性能高，减少上下文切换
- 避免死锁问题

缺点：
- ABA问题
- 循环时间长开销大
- 只能保证一个共享变量的原子操作

### ABA问题以及解决方案
如果一个值原来是A，变成了B，又变回了A，那么使用cas进行检查时会发现它的值没有发生变化，但是实际上变化了。
```java
//模拟aba问题
import java.util.concurrent.atomic.AtomicReference;

public class ABADemo{
    //private static AtomicReference atomicRef = new AtomicRefence<>(100);
    private static AtomicStampedReference stampedRef = new AtomicStampedRefence<>(100, 1);
    public static void main(String[] args) throws InterruptedException{

        //线程1:模拟aba操作
        Thread t1 = new Thread(() - >{
            //int value = atomicRef.get();
            int[] stamp = new int[1];
            int value = stampedRef.get(stamp);
            int currentStamp = stamp[0];

            System.out.println("线程1读取值：" + value);
            //模拟一些处理时间
            try{
                Thread.sleep(1000);
            }catch(InterruptedException e){
                e.printStackTrace();
            }
            //尝试cas操作
            //boolean success = atomicRef.compareAndSet(value, value + 1);
            boolean success = stampedRef.compareAndSet(value, value + 1,currentStamp, currentStamp + 1);
            System.out.println("线程1 cas操作：" + success);
        });
        //线程2:制造aba场景
        Thread t2 = new Thread(() - > {
            try{
                Thread.sleep(500);
            }catch(InterruptedException e){
                e.printStackTrace();
            }
            int[] stamp = new int[1];
            int value = stampedRef.get(stamp);
            //a - > b
            //atomicRef.compareAndSet(100, 200);
            stampedRef.compareAndSet(value, 200, stamp[0], stamp[0] + 1);
            System.out.println("线程2将值改为200，版本号：" + (stamp[0] + 1));
            // b - > a
            //atomicRef.compareAndSet(200, 100);
            stampedRef.compareAndSet(value, 100, stamp[0], stamp[0] + 1);
            System.out.println("线程2将值改回100，版本号：" + (stamp[0] + 1));
        });
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        int[] finalStamp = new int[1];
        int finalValue = stampedRef.get(finalStamp);
        //System.out.println("最终值：" + atomicRef.get());
        System.out.println("最终值：" + finalValue + "版本号：" + finalStamp[0]);
    }
}
```
使用AtomicStampedReference解决aba问题。引入了版本号（时间戳），每次更新不仅比较值，还比较版本号。

> 在高并发场景下，原子类通常比synchronized具有更好的性能，特别是在竞争激烈的场景下，原子类避免了线程阻塞和上下文切换的开销。


