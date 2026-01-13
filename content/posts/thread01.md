---
title: "线程池-多线程基础"
date: 2021-01-23T12:44:13+08:00
draft: false
description: "多线程基础：多线程编程概述、线程基础操作、线程生命周期。"
tags: ["线程池", "多线程基础"]
categories: [ThreadPool]
---
多线程基础：多线程编程概述、线程基础操作、线程生命周期。

## 多线程编程概述
### 什么是多线程
多线程是指在**一个程序中同时执行多个线程**，每个线程都有自己的执行路径和状态。线程是程序执行的最小单位，是进程中的一个执行路径。与进程相比，线程更轻量级，创建和切换开销更小。多线程编程可以提高程序的并发性和响应性，特别适用于需要同时处理多个任务的场景。
> - 进程：操作系统分配资源的基本单位，拥有独立的内存空间，进程间通信需要特殊机制。
> - 线程：程序执行的最小单位，同一进程内的线程共享内存空间，通信更便捷。

> - 并发（Concurrent）：多个线程在同一时间点上执行，看起来是同时进行的。
> - 并行（Parallel）：多个线程在同一时间点上真正同时执行，需要多个处理器核心。

### 多线程的优势
- 提高程序响应性：通过将耗时操作放在后台线程执行，主线程可以继续响应用户操作，避免界面卡顿。
- 充分利用cpu资源：在多核处理器上，多线程可以真正并行执行，充分利用硬件资源，提高程序运行效率。
- 改善用户体验：异步处理用户请求，避免长时间等待，提高更流畅的用户体验。
- 提高吞吐量：通过并发处理多个任务，可以显著提高系统的整体吞吐量，处理更多的请求。

实际应用场景：
- web服务器：同时处理多个客户端请求
- gui应用：保持界面响应的同时执行后台任务
- 数据处理：并行处理大量数据，提高处理速度
- 游戏开发：同时处理游戏逻辑、渲染、音效
- 文件下载：多线程下载提高下载速度

### 多线程挑战
- 线程安全问题：数据竞争、共享资源的并发访问、原子性操作的保证
- 死锁问题：多个线程相互等待资源、循环依赖导致程序停滞，资源分配策略的重要性
- 内存一致性：缓存一致性问题、指令重排序的影响、可见性问题
- 调试困难：并发bug难以重现、时序相关问题、复杂的执行路径

### java多线程模型
java提高了丰富的多线程支持，从java语言层面到虚拟机层面都有相应的机制来支持多线程编程。

jvm线程模型
- 线程映射：java线程通常映射到操作系统的原生线程，由操作系统负责调度
- 线程调度：jvm使用抢占式调度，线程执行顺序由操作系统决定。
- 内存模型：java内存模型定义了线程间如何通过内存进行交互。

线程创建方式：
- 继承Thread类：重写run方法
- 实现Runnable接口
- 实现Callable接口（有返回值）
- 使用线程池（Executor框架）

### 应用场景分析
- web服务器：每个http请求由独立线程处理，提高并发处理能力。
  - tomcat的线程池模型
  - servlet的并发处理
  - 异步处理请求
- gui应用：分离ui线程和业务逻辑线程，保持界面响应。
  - swing的事件分发线程
  - 后台任务处理
  - 进度条更新
- 数据处理：并行处理大量数据，提高处理效率
  - 批量数据导入
  - 并行计算
  - MapReduce计算模式
- 游戏开发：分离游戏逻辑、渲染、音效处理。
  - 游戏逻辑线程
  - 渲染线程
  - 音效线程
  - 游戏主循环
  - 物理引擎计算
  - 网络通信



## 线程基础操作
### 继承Thread类
- run()方法：定义线程要执行的任务，线程的主体，线程执行到此方法结束，线程结束。（不会创建新线程，在当前线程中执行run方法，可以多次调用，同步执行）
- start()方法：启动线程。（创建新线程，在新线程中执行run方法，只能调用一次，异步执行）
### 实现Runnable接口
```java
public class MyRunnable implements Runnable {
  private String taskName;
  public MyRunnable(String taskName) {
    this.taskName = taskName;
  }
  @Override
  public void run() {
    System.out.println("线程" + taskName + "开始执行");
    // 线程要执行的任务
    System.out.println("线程" + taskName + "执行完毕");
  }
  public static void main(String[] args) {
    //创建Runnable对象
    MyRunnable task1 = new MyRunnable("Task");
    MyRunnable task2 = new MyRunnable("Task2");
    //创建Thread对象，将Runnable对象作为参数传递
    Thread thread1 = new Thread(task1);
    Thread thread2 = new Thread(task2);
    //启动线程
    thread1.start();
    thread2.start();
    System.out.println("主线程结束");
  }
}
```
使用lambda表达式创建线程
```java
public class LambdaThreadExample{
  public static void main(String[] args) {
    //创建线程，使用lambda表达式定义线程要执行的任务
    Thread thread1 = new Thread(() -> {
      System.out.println("线程开始执行");
      // 线程要执行的任务
      System.out.println("线程执行完毕");
      return;
    });
    //使用方法引用创建线程
    Thread thread2 = new Thread(LambdaThreadExample::doSomething);
    //启动线程
    thread1.start();
    thread2.start();
  }
  public static void doSomething() {
    System.out.println("doSomething方法开始执行");
    // 线程要执行的任务
    System.out.println("doSomething方法执行完毕");
  }
}
```
优势：
- 避免单继承限制：类可以继承其他类的同时实现Runnable；
- 代码复用：同一个Runnable对象可以被多个线程使用。
- 职责分离：任务逻辑与线程管理分离。
- 更好的设计：符合面向对象设计原则

## 实现Callable接口
Callable接口与Runnable接口类似，但Callable接口有返回值并可以抛出异常。通常与Future接口一起使用，用于获取线程执行结果。
```java
public class CallableExample { 
  public static void main(String[] args) {
    //创建线程池
    ExecutorService executor = Executors.newFixedThreadPool(2);
    //创建Callable任务
    Callable task1 = () -> {
      int sum = 0;
      for(int i = 1; i <= 100; i++){
        sum += i;
        Thread.sleep(10);
      }
      return sum;
    };
    Callable task2 = () -> {
      Thread.sleep(1000);
      return "任务执行完毕";
    };
    try{
      //提交任务并获取Future对象
      Future future1 = executor.submit(task1);
      Future future2 = executor.submit(task2);
      //获取结果（会阻塞直到任务完成）
      System.out.println("计算结果：" + future1.get())；
      System.out.println("任务2结果：" + future2.get());
    }catch(InterruptedException | ExecutionException e){
      e.printStackTrace();
    }finally{
      executor.shutdown();
    }
  }
}
```
Future接口的方法：
- get():获取任务执行结果，会阻塞直到任务完成，可以设置超时时间。
- cancel():取消任务执行，返回是否成功取消。如果任务已经开始执行，可以选择是否中断。
- isDone():判断任务是否完成（正常完成、异常或取消）。
### 线程属性设置
```java
//设置线程名称
thread1.setName("Thread-1");
//设置线程优先级（1-10，默认5）
thread1.setPriority(Thread.NORM_PRIORITY);
//设置为守护线程（可选）
thread1.setDaemon(true);
//启动线程
thread1.start();
//主线程信息
System.out.println("主线程名称：" + Thread.currentThread().getName());
System.out.println("主线程优先级：" + Thread.currentThread().getPriority());
```
守护线程
- 后台服务：为其他线程提供服务的线程
- 自动结束：当所有非守护线程结束时，守护线程自动结束
- jvm退出：jvm不会等待守护线程执行完成
- 典型应用：垃圾回收器、定时器等
### 线程异常处理

线程中的异常不能被主线程捕获，需要使用特殊的异常处理机制。java提供了UncaughtExceptionHandler接口来处理线程中的未捕获异常。


```java
//设置全局异常处理器
Thread.setUncaughtExceptionHandler((thread,exception) - > {
  System.out.println("线程" + thread.getName() + "发生异常：" + exception.getMessage());
  exception.printStackTrace();
});
```
异常处理最佳实践：
- 预防异常：在线程代码中使用try-catch块来处理异常，避免程序崩溃；验证输入参数；可能处理的空指针
- 异常记录：使用日志框架记录异常；包含线程名称和时间戳；记录异常堆栈信息。
- 异常恢复：实现重试机制；优雅降级处理；通知监控系统。

## 线程生命周期
### 线程状态详解
线程状态：
- NEW（新建）：线程刚创建，未调用start()方法，此时线程还没有开始执行。
- RUNNABLE（可运行）：线程正在java虚拟机中执行，但可能正在等待操作系统的其他资源，如cpu时间片。
- BLOCKED（阻塞）：线程等待获取锁或等待I/O操作完成。（线程被阻塞等待监视器锁，通常发生在synchronized代码块或方法中）
- WAITING（等待）：线程无限期等待另一个线程执行特定操作，通常发生在调用Object.wait()或者Thread.join()方法时。
- TIMED_WAITING（定时等待）：线程等待一定的时间后继续执行，通常发生在调用Thread.sleep()或者Object.wait(long)方法时。
- TERMINATED（终止）：线程执行完毕，已经结束生命周期。run()方法执行完毕，线程进入TERMINATED状态。

> Runnable状态在java中包含了操作系统层面的ready和running两种状态，ready状态是线程进入就绪状态，running状态是线程进入运行状态。因为java无法精确区分线程是等待cpu时间还是正在执行。

### 线程状态转换
- new -> runnable：调用start()方法启动线程，线程进入可运行状态。
- runnable -> blocked：线程等待获取锁（syunchronized）或等待I/O操作完成，进入阻塞状态。
- blocked -> runnable：锁被释放，成功获取synchronized锁，线程进入可运行状态。
- runnable -> waiting：线程调用Object.wait()或Thread.join()方法，进入等待状态。
- waiting -> runnable：线程被其他线程调用notify()或notifyAll()方法，或者join的线程执行完毕，线程进入可运行状态。
- runnable -> timed_waiting：线程调用Thread.sleep()或Object.wait(long)方法，进入定时等待状态。
- timed_waiting -> runnable：线程等待时间结束，自动进入可运行状态或者其他线程唤醒，线程进入可运行状态。
- runnable -> terminated：run方法执行完毕或抛出未捕获异常，线程执行完毕，进入终止状态。
> join()方法作用：将调用join的线程优先执行，当前正在执行的线程阻塞，知道调用join方法的线程执行完毕或者被打断，主要用于线程之间的交互。

### 线程调度机制
java虚拟机采用抢占式调度模型，线程的执行顺序由操作系统的线程调度器决定。

调度策略
- 抢占式调度：线程执行时间片到期，被操作系统调度，可能被其他线程抢占。（高优先级线程可以抢占低优先级线程的cpu时间，但优先级只是调度的参考，不保证执行顺序）
- 时间片轮转：同优先级线程采用时间片轮转调度，每个线程获取相等的cpu时间片。
- 公平调度：现代jvm尽量保证线程调度的公平性，避免线程饥饿现象。

> 不能依赖线程的优先级来控制程序逻辑，因为不同的操作系统的调度策略不同。应该使用同步机制来确保程序的正确性。


### 线程监控工具
- jstack：命令行工具，用于生成线程堆栈快照，分析线程状态和死锁问题。` jstack -l <pid>`
- jconsole：图形界面的监控工具，用于实时查看JVM运行时信息，如线程信息、内存信息、垃圾回收信息等。
- VisualVM: 功能强大的可视化工具，提供线程分析、性能分析等功能。

### 优雅停止线程
java提供了interrupt机制来实现线程的优雅停止。

- interrupt机制：通过调用interrupt()方法设置中断标志，线程检查标志后自行停止。
- 标识位控制：使用volatile布尔变量作为停止标志，线程定期检查标志状态
- 资源清理：在线程停止前确保释放所有资源，如关闭文件、网络连接。
- 检查线程的中断状态的方法：Thread.interrupted()--清除中断标志、Thread.currentThread().isInterrupted()、Thread.isInterrupted()--不清除中断标志

```java
//使用interrupt机制优雅停止线程
public class GracefulShutdownDemo{
  private static class InterruptiableTask implements Runnable{
    @Override
    public void run() {
      try{
        while(!Thread.currentThread().isInterrupted()){
          //线程执行逻辑
          System.out.println("线程执行逻辑");
          Thread.sleep(1000);
        }
      }catch(InterruptedException e){
        //恢复中断状态
        Thread.currentThread().interrupt();
        System.out.println("线程被中断");
      }finally{
        //清理资源
        cleanup();
      }
    }
    private void cleanup(){
      System.out.println("清理资源");
    }
  }
  public static void main(String[] args) throws InterruptedException {
    Thread worker = new Thread(new InterruptiableTask());
    worker.start();
    //模拟主线程执行其他任务
    Thread.sleep(3000);
    //请求线程中断
    worker.interrupt();
    //等待线程停止
    worker.join();
    System.out.println("线程已停止");
  }
}
```
- 永远不要使用Thread.stop()方法来停止线程，因为它会强制终止线程，可能导致资源泄漏和不一致的状态。
- 在可能阻塞的操作前检查中断状态
- 捕获InterruptedException后要恢复中断状态
- 使用finally块确保资源得到正确清理
- 为长时间运行的任务提供取消机制。



