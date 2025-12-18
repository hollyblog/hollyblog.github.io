---
title: "并发编程-基础理论"
date: 2021-01-18T13:26:00+08:00
draft: false
description: "并发编程基础理论：并发编程基础、线程基础、synchronized关键字、volatile关键字。"
tags: ["JUC", "并发编程", "基础理论"]
categories: ["JUC"]
---
并发编程基础理论：并发编程基础、线程基础、synchronized关键字、volatile关键字。

## 并发编程基础
### 什么是并发编程
并发编程是指在一个程序中同时执行多个任务的能力。它可以提高程序的效率和响应能力，特别适用于需要处理大量并发请求的场景。不仅仅是技术层面的多线程，更是一种解决复杂问题的思维方式，它能够充分利用现代多核处理器的计算能力。
### 应用场景
- web服务器：同时处理多个用户请求，提高服务器的吞吐量和响应速度。
- 桌面应用：ui线程与后台任务分离，保证用户界面的流畅性。
- 数据处理：并行处理大量数据，提高数据分析和计算的效率。

### 并发编程优势
- 提高性能：充分利用多核cpu的计算能力
- 改善响应性：避免程序因长时间操作而卡顿
- 增强吞吐量：同时处理更多的任务和请求
- 资源利用率：更好地利用系统资源

### 并发 vs 并行
- 并发：多个任务在同一时间间隔内执行，但不一定同时执行，可能重叠。通过时间片轮转等方式在单核cpu上实现。
  - 逻辑上的同时进行
  - 可以在单核cpu上实现
  - 关注任务的组合和调度
- 并行：同一时刻真正同时执行多个任务，每个任务都有自己的线程，需要多核cpu或者多台机器的支持。
  - 物理上的同时进行多个任务
  - 需要多核cpu或者多台机器的支持
  - 关注任务的同时执行
> 并发是关于处理多个任务的能力，而并行是关于同时执行多个任务的能力。并发可以在单核上实现，但并行必须要有多核支持。
### Java内存模型（JMM）
Java内存模型（JMM）是Java并发编程的基础，它定义了线程之间如何交互和内存如何被访问。JMM确保了在多线程环境下，线程对共享变量的操作是可见的和有序的。

#### 内存模型结构
- 主内存（Main Memory）：所有线程共享的内存区域，存储着所有变量的主副本，即程序的变量和对象。
  - 存储实例字段、静态字段
  - 每个变量都有一个唯一主副本
  - 所有线程都可以访问主内存中的变量
- 工作内存（Working Memory）：每个线程都有自己的工作内存，用于存储线程私有的变量和对象。
  - 存储线程私有的变量副本
  - 每个线程都有自己的工作内存，互不干扰
  - 线程对变量的操作必须在工作内存中进行，不能直接访问主内存
#### 内存交互操作
JMM定义类8种内存交互操作，用于控制主内存与工作内存之间的数据传输
- lock（锁定）：将主内存中的变量锁定，防止其他线程访问。
- unlock（解锁）：释放对主内存中变量的锁定。
- read（读取）：将主内存中的变量值读取到工作内存中。
- load（加载）：将read的值加载到工作内存中的变量副本。
- use（使用）：将工作内存中的变量值用于计算。
- assign（赋值）：将执行引擎的值赋给工作内存变量。
- store（存储）：将工作内存变量值传送到主内存中。
- write（写入）：将store到值写入到主内存变量中。

### 并发编程的挑战
当多个线程同时访问共享变资源时，如果没有适当的同步机制，就可能出现线程安全问题。这些问题的根源在于并发访问共享数据时的竞态条件。并发编程面临着许多挑战，包括竞态条件、死锁、活锁等。这些问题可能导致程序的行为不可预测，甚至崩溃。因此，开发人员需要仔细设计和实现并发程序，以确保其正确性和性能。

> count++ 操作实际上包含三个步骤：读取count值、将值加1、写回count值。在多线程环境下，这三个步骤可能被其他线程打断，导致数据不一致。
- 竞态条件（Race Condition）：多个线程同时访问共享资源，且至少有一个线程对资源进行写操作，导致最终结果依赖于线程执行的顺序。
- 死锁（Deadlock）：多个线程互相等待对方释放资源，导致所有线程都无法继续执行。
- 活锁（Livelock）：多个线程在不断地改变状态，导致没有线程能够继续执行。
- 数据竞争：多个线程同时访问同一内存位置，且至少有一个是写操作。

### 可见性、原子性、有序性
并发编程的三大特性是理解线程安全问题的关键，java内存模型正是围绕这三个特性来设计的。
- 可见性（Visibility）：当一个线程修改了共享变量的值，其他线程能够立即看到这个修改。(**是由于每个线程都有自己的工作内存导致的**)
- 原子性（Atomicity）：一个操作是不可中断的，要么全部执行成功，要么全部执行失败。
- 有序性（Ordering）：程序执行的顺序按照代码的顺序执行，但是编译器和处理器可能会进行指令重排序优化。
> java提高了多种机制来保证这三个特性：
> - 可见性：通过volatile关键字、synchronized关键字、Lock接口等机制来确保可见性。
> - 原子性：通过synchronized关键字、Lock接口、Atomic类等机制来确保原子性。
> - 有序性：通过volatile关键字、synchronized关键字、Lock接口等机制来确保有序性。

## 线程基础
### Thread类
Thread类是java.lang包中的一个类，它代表了一个线程。每个线程都是一个独立的执行路径，能够并发地执行程序的不同部分。Thread类提供了许多方法来控制线程的行为，例如启动线程、暂停线程、终止线程等。
#### Thread类的构造方法
- Thread()：创建一个新的线程对象，使用默认的线程名称。
- Thread(String name)：创建一个新的线程对象，并指定线程的名称。
- Thread(Runnable target)：创建一个新的线程对象，并指定线程要执行的任务。
- Thread(Runnable target, String name)：创建一个新的线程对象，并指定线程要执行的任务和线程的名称。
#### 创建线程的方式
- 继承Thread类：创建一个新的线程类，继承Thread类，并重写run方法。
- 实现Runnable接口：创建一个新的类，实现Runnable接口，并重写run方法。
- 使用Callable和Future：创建一个新的类，实现Callable接口，并重写call方法。
- 使用线程池：使用Executor框架中的线程池来管理线程。

> 继承Thread类的方式
> - 定义一个新的类，继承Thread类。
> - 重写Thread类的run方法，在run方法中定义线程要执行的任务。
> - 创建线程对象，调用start方法启动线程。
```java
public class MyThread extends Thread {
    @Override
    public void run() {
        // 线程要执行的任务
    }
    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.setName("MyThread");
        thread.start();
    }
}
```
> 实现Runnable接口的方式
> - 定义一个新的类，实现Runnable接口。
> - 实现Runnable接口的run方法，在run方法中定义线程要执行的任务。
> - 创建线程对象，调用start方法启动线程。
```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        // 线程要执行的任务
    }
    public static void main(String[] args) {
        MyRunnable task = new MyRunnable();
        Thread thread = new Thread(task, "MyRunnable");
        thread.start();
    }
}

//lambda表达式创建线程
public class LambdaThread {
    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            // 线程要执行的任务
        });
        thread.setName("LambdaThread");
        thread.start();
    }
}
```
### Runnable 和 Callable 接口
- Runnable 接口：表示一个没有返回值的任务，只能通过调用start方法来启动线程。
- Callable 接口：表示一个有返回值的任务，只能通过调用submit方法来启动线程。

> - thread:java单继承限制、任务与线程耦合、代码复用性差、不利于线程池管理。
> - callable：避免单继承限制、任务与线程分离、代码复用性高、支持返回值、更灵活的线程池使用。


### 线程生命周期
- new（新建）：线程对象被创建，但还没有调用start方法。
- runnable（可运行）：线程对象调用start方法后，正在jvm中执行，可能正在运行或者等待CPU调度执行。
- blocked（阻塞）：线程被阻塞，等待获取监视器锁。
- waiting（等待）：线程进入等待状态，等待其他线程执行特定操作（无限等待）。
- timed_waiting（超时等待）：线程进入超时等待状态，等待其他线程执行特定操作，或者在指定时间后自动唤醒。
- terminated（终止）：线程执行完毕，或者因为异常而终止。
```java
public class ThreadStateExample{
    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        thread.setName("ThreadStateExample");
        System.out.println("创建后：" + thread.getState());
        thread.start();
        System.out.println("启动后：" + thread.getState());

        Thread.sleep(2000);
        System.out.println("睡眠中" + thread.getState());
        
        thread.join();
        
        System.out.println("结束后：" + thread.getState());
    }
}
```
### 线程优先级和守护线程
线程优先级用于指示线程调度器应该优先执行哪些线程，而守护线程是在后台提供服务的线程。
> - MIN_PRIORITY（1）：最低优先级，线程调度器会尽量晚地执行这些线程。
> - NORM_PRIORITY（5）：默认优先级，线程调度器会根据线程的优先级来执行这些线程。
> - MAX_PRIORITY（10）：最高优先级，线程调度器会尽快地执行这些线程。
```java
thread.setPriority(Thread.MAX_PRIORITY);
thread.start();
```
> 守护线程特点
> - 为其他线程提供服务，而不是执行具体的任务。
> - 守护线程会在所有非守护线程执行完毕后自动终止，jvm会退出，不会等待守护线程执行完毕。
> - 垃圾回收器就是典型的守护线程。
> - 必须在start方法调用之前设置守护线程，否则会抛出IllegalThreadStateException异常。
```java
//设置为守护线程
thread.setDaemon(true);
thread.start();
//主线程睡眠3秒后结束
Thread.sleep(3000);
System.out.println("主线程结束");
//jvm会自动退出，守护线程也会结束
```
### 线程中断机制
线程中断是java提供的一种协作式的线程取消机制。它不会强制终止线程，而是给线程发送一个中断信号，由线程自己决定如何响应。
> 中断方法
> - interrupt()：设置线程的中断状态为true。
> - isInterrupted()：检查线程的中断状态，不清除中断状态。
> - interrupted()：检查线程的中断状态，并清除中断状态。
## synchronized关键字
### synchronized原理
synchronized是java提供的最基础的同步机制，它是基于监视器锁来实现的。每个java对象都有一个内置的监视器锁，当线程进入到synchronized代码块或方法时，会自动获取这个锁。

synchronized关键字保证了同一时刻只有一个线程可以执行被同步的代码，从而确保线程安全。
#### 监视器锁机制
- 获取锁：线程进入synchronized代码块时，尝试获取锁对象的监视器锁。如果锁可用，则获取锁并继续执行。
- 等待锁：如果锁被其他线程占有，当前线程会被阻塞，进入等待状态，直到锁被释放。
- 释放锁：线程执行完synchronized代码块后，会自动释放锁，唤醒等待的线程。

#### 字节码分析
```java
//java代码
public void synchronizedMethod() {
    synchronized (this) {
        // 同步代码块
    }
}
//对应字节码
monitorenter//获取锁
monitorexit//释放锁或者异常情况下释放锁
```
### 对象锁和类锁
synchronized可用修饰实例方法、静态方法、代码块，根据修饰的不同目标，获取的锁也不同。
- 对象锁（实例锁）：synchronized修饰实例方法或代码块时，获取的是当前实例对象的监视器锁。`synchronized(this)`
- 类锁（静态锁）：synchronized修饰静态方法或代码块时，获取的是当前类的Class对象的监视器锁。`synchronized(ClassName.class)`
> 对象锁和类锁是完全独立的，一个线程获取了对象锁，不会阻止其他线程获取类锁。
### 锁升级机制
为了提高性能，jvm对synchronized进行了优化，引入了锁升级机制。锁会根据竞争情况从偏向锁升级到轻量级锁，再升级到重量级锁。（单向升级，不可降级）
- 偏向锁：适用于一个线程的访问；几乎没有性能开销；在对象头中记录线程id；当有其他线程竞争时升级。
- 轻量级锁：适用于多个线程交替访问；通过CAS操作来尝试获取锁，避免阻塞；在栈帧中创建锁记录；如果竞争激烈，升级为重量级锁。
- 重量级锁：适用于多个线程同时访问；通过操作系统的互斥量来实现；线程会被阻塞和唤醒；性能开销较大；在对象头中记录锁状态。
### 死锁问题
- 死锁定义：多个线程同时等待对方释放锁，导致所有线程都无法继续执行。
- 死锁条件：
  - 互斥条件：一个资源每次只能被一个线程使用。
  - 请求与保持条件：一个线程因请求资源而阻塞时，对已获得的资源保持不放。
  - 不剥夺条件：线程已获得的资源，在未使用完之前，不能强行剥夺。
  - 循环等待条件：若干线程之间形成一种头尾相接的循环等待资源关系。
- 死锁解决方法：
  - 破坏请求与保持条件：一次性申请所有资源，避免循环等待。
  - 破坏不剥夺条件：当线程需要的资源不能被满足时，必须释放已获得的资源。
  - 破坏循环等待条件：按序申请资源，避免循环等待。
- 死锁预防策略
  - 锁排序：所有线程按相同顺序获取锁
  - 锁超时：使用tryLock()设置获取锁的超时时间
  - 死锁检测：定期检测死锁并采取恢复措施
  - 避免嵌套锁：避免在一个同步方法中调用另一个同步方法，因为这会导致死锁。
### 性能优化
虽然synchronized使用简单，但是在高并发场景下可能成为性能瓶颈，因为它是一种重量级锁，会导致线程阻塞和上下文切换。
为了提高性能，我们可以采用以下策略：
- 减小锁粒度：只对必要的代码块进行同步，避免对整个方法进行同步。（只对共享资源进行同步，**减小锁粒度：将大锁拆分成小锁，减少锁竞争**）
- 锁分离：读写分离，使用ReadWriteLock来实现读写锁分离，提高并发性能。
```java
ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
Lock readLock = readWriteLock.readLock();
Lock writeLock = readWriteLock.writeLock();
```
- 锁消除：jvm在编译时会对一些场景进行优化，如循环中使用的临时变量，会被jvm自动消除锁。
- 使用无锁数据结构：如ConcurrentHashMap、ConcurrentLinkedQueue等，它们是线程安全的，不需要加锁。
- 避免死锁：遵循死锁预防策略，如按序申请锁、设置锁超时等。
- 考虑使用其他同步机制：如ReentrantLock、Semaphore等，它们提供了更多的灵活性和性能优化选项。
> - 尽量缩短同步代码块的执行时间
> - 避免在循环中使用synchronized
> - 考虑使用并发集合类替代同步集合
> - 在高并发场景下考虑使用Lock接口

- 同步集合：通过全局锁（如synchronized）确保线程安全的集合，如Vector、Hashtable、Collections.synchronizedXXX等。简单易用，但性能较低，高并发下易阻塞。
- 并发集合：如ConcurrentHashMap、ConcurrentLinkedQueue等，它们是线程安全的，不需要加锁。性能较高，高并发下性能更好。使用细粒度锁（如分段锁、cas操作）或无锁算法，提升并发性能。

## volatile关键字
volatile是java提供的轻量级同步机制，它保证了变量的可见性和禁止指令重排序，但不保证原子性。
### volatile原理
> volatile关键字提供了比synchronized更轻量级的同步机制，主要解决变量在多线程环境下的可见性问题。

volatile三大特性
- 可见性保证：当一个线程修改了volatile变量的值，其他线程能够立即看到最新的值，确保变量在多线程间可见性。
- 禁止指令重排序：编译器和处理器不会对volatile变量的读写操作进行重排序，确保了操作的有序性。
- 不保证原子性：volatile变量的读写操作不是原子的，不能用于实现原子操作，如i++符合操作仍然需要额外的同步措施。

底层实现机制

> volatile的实现依赖于内存屏障和缓存一致性协议。当声明一个变量为volatile时，jvm会在适当的位置插入内存屏障指令。
- 写操作：立即刷新到主内存中，并使得其他cpu缓存失效
- 读操作：直接从主内存中读取最新值，不使用缓存
- 指令排序：防止编译器和cpu对相关指令进行重排序。

### 内存屏障
内存屏障是一种cpu指令，用于控制特定条件下的内存操作顺序和可见性。volatile语义正是通过在适当位置插入内存屏障来实现的。

四种内存屏障类型
- LoadLoad屏障：确保load操作之前的所有load操作都完成。确保屏障前的读操作完成后，才能执行屏障后的读操作，防止读操作重排序。
- LoadStore屏障：确保load操作之前的所有store操作都完成。确保屏障前的读操作完成后，才能执行屏障后的写操作。
- StoreStore屏障：确保store操作之前的所有store操作都完成。确保屏障前的写操作完成后，才能执行屏障后的写操作，防止写操作重排序。
- StoreLoad屏障：确保store操作之前的所有load操作都完成。确保屏障前的写操作完成后，才能执行屏障后的读操作，防止读操作重排序。开销最大的屏障。

volatile的内存屏障插入策略
- 在每个volatile写操作之前插入StoreStore屏障
- 在每个volatile写操作之后插入StoreLoad屏障
- 在每个volatile读操作之前插入LoadLoad屏障和LoadStore屏障
```java
//写操作的内存屏障
StoreStore屏障
volatile变量的写操作
StoreLoad屏障

//读操作的内存屏障
volatile读操作
LoadLoad屏障
LoadStore屏障
```
### happens-before规则
happens-before是jmm（java内存模型）中一个重要的概念，用于描述两个操作之间的内存可见性关系。如果操作a happends-before 操作b，那么a的执行结果对b可见。

主要对happens-before规则
- 程序顺序规则：在一个线程中，按照代码的顺序执行，前一个操作happends-before后一个操作。
- volatile规则：对volatile变量的写操作happends-before后续对该变量的读操作。
- 传递性规则：如果操作a happends-before操作b，操作b happends-before操作c，那么操作a happends-before操作c。

> happens-before关系不等同于时间上的先后关系，它主要描述的是内存可见性的保证。
### 双重检查锁定
双重检查锁定（Double-Checked Locking）是一种常用的优化技术，用于在多线程环境下延迟初始化一个对象。是一种常用的单例模式实现方式，但在没有volatile的情况下，由于指令重排序的存在，可能导致其他线程获得一个未完全初始化的对象实例，存在严重的并发问题。

有问题的dcl实现
```java
public class UnsafeSingleton{
    private static UnsafeSingleton instance;
    public static UnsafeSingleton getInstance(){
        if(instance == null){
            synchronized(UnsafeSingleton.class){
                if(instance == null){
                    //问题所在
                    instance = new UnsafeSingleton();
                }
            }
        }
        return instance;
    }
}
```
问题在于new UnsafeSingleton()不是一个原子操作，它可以分解为以下几个步骤：
1. 分配内存空间
2. 调用构造函数初始化对象
3. 将instance指向分配的内存
   
由于指令重排序，2和3可能被交换，导致instance指向一个未被初始化的对象。

解决方法：在instance声明时添加volatile关键字，确保写操作happends-before读操作，防止指令重排序，确保对象安全初始化后才会被赋值给instance变量。

### volatile vs synchronized
volatile和synchronized都是用于实现线程同步的机制，但它们有不同的应用场景和性能特点。
- volatile：适用于变量的读操作和写操作都在单线程环境下执行，或者变量的读操作和写操作都在多线程环境下执行，但对变量的读写操作是互斥的；轻量级同步机制；保证可见性和顺序性；无阻塞特性；性能开销小。（状态标志、单例模式的dcl、读多写少场景、发布-订阅模式中的状态变量）不能忽视volatile的内存屏障开销。
- synchronized：适用于需要对临界区代码进行同步的场景，确保在任意时刻只有一个线程能够执行临界区代码；重量级同步机制；保证可见性、有序性、原子性；有阻塞特性；性能开销大。（复合操作、临界区保护、需要原子性的场景）
> 在性能方面，volatile通常比synchronized有更好的表现，特别是在读操作频繁的场景下，因为volatile只保证可见性和顺序性，而synchronized还保证了原子性。但volatile不能替代synchronized的所有功能。





