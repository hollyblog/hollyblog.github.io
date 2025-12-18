---
title: "JVM 版本实战"
date: 2021-02-05T17:00:13+08:00
draft: false
description: "JVM 版本实战：深入学习jvm不同版本的特性和差异，掌握版本选择和升级策略，提升应用性能和稳定性。"
tags: ["JVM", "版本实战"]
categories: [JVM]
---
JVM 版本实战：深入学习jvm不同版本（jdk1.8、jdk17、jdk21等）的特性和差异，掌握版本选择和升级策略，提升应用性能和稳定性。

## jdk1.8调优实战
### jdk1.8新特性对性能的影响
- lambda表达式：通过invokedynamic指令实现，相比匿名内部类有更好的性能表现，但需要注意闭包变量的内存占用。
- stream api：stream提供了函数式编程能力，但过度使用可能导致性能下降，需要在可读性和性能之间找到平衡。
- 元空间：替代永久代，使用本地内存存储类元数据，解决了永久代oom的问题，但需要重新调整内存配置策略。

### 永久代到元空间的迁移
永久代问题
- 固定大小限制，容易出现outofmemoryerror：permgen space
- 垃圾回收效率低，full gc时才会清理永久代
- 类元数据和堆内存竞争有限的内存空间
- 动态类加载场景下容易内存溢出

元空间优势
- 使用本地内存，理论上只受系统内存限制
- 自动扩展，减少oom风险
- 更好的垃圾回收机制
- 支持类的动态卸载。

> 迁移到jdk1.8时，需要移除-XX:PermSize和-XX:MaxPermSize参数，替换为-XX:MetaspaceSize和-XX:MaxMetaspaceSize参数。同时要监控本地内存使用情况，避免元空间无限制增长。

### g1垃圾回收器调优实战
g1垃圾回收器在jdk1.8时默认开启，无需额外配置。
是大内存应用的首选垃圾回收器。g1通过划分堆内存为多个region，实现低延迟的垃圾回收。

#### 核心参数配置
```java
//启用g1
-XX:+UseG1GC
//设置最大gc停顿时间目标
-XX:MaxGCPauseMillis=200
//设置region大小
//设置region大小为128mb
-XX:G1HeapRegionSize=128m
//设置新生代最小比例
//设置新生代最小比例为10%
-XX:G1NewSizePercent=10
//设置新生代最大比例为40%
-XX:G1MaxNewSizePercent=40
//设置混合gc的目标次数
//设置混合gc的目标次数为2
-XX:G1MixedGCCountTarget=2
```
#### g1调优策略
- 停顿时间调优：通过调整-XX:MaxGCPauseMillis参数，目标是在不超过设定值的情况下，实现低延迟的垃圾回收，但不要设置过小，可能会导致吞吐量下降。
- 新生代比例调优：通过调整-XX:G1NewSizePercent和-XX:G1MaxNewSizePercent参数，根据应用的对象分配模式调整新生代比例，平衡Minor GC频率和停顿时间。目标是平衡新生代和老年代的内存占用。
- region大小优化：region大小应该是2的整数次幂，一般建议为1mb-32mb。通常设置为堆大小的1/2000到1/2048之间。

### lambda和stream api的性能优化
lambda表达式性能特点
- 通过invokedynamic指令实现，首次调用有额外开销。
- 相比匿名内部类，减少了类文件生成。
- 闭包变量会影响内存使用
- 方法引用比lambda表达式性能更好。

stream api性能优化建议
- 避免在小数据集上使用stream api，直接循环可能更快。
- 合理使用并行stream，注意线程开销
- 避免过度中间操作：中间操作（如map、filter、sorted等）会增加额外的开销，应尽量避免在stream管道中使用。
- 合理使用并行流：在数据量较大、计算密集型任务时，考虑使用并行流，但要注意控制并行度，避免线程创建和销毁的开销。
- 使用原始类型stream，避免自动装箱拆箱操作。
- 及时终止操作：避免无限制的stream操作，及时使用limit、findfirst等终止操作。
- 并行流：在多核cpu上，使用并行流可以充分利用多核性能，但需要注意线程安全问题。

## jdk17调优实战
- 性能提升：相比jdk11，整体性能提升8-15%，启动时间减少，内存占用优化。
- 垃圾收集器改进：zgc和shenandoah gc正式可用，g1gc性能进一步优化。
- 安全性增强：强化的安全机制，更好的密码学支持，提升应用安全性。

### 新的垃圾收集器
#### ZGC(Z Garbage Collector)
- 超低延迟：gc暂停时间始终小于10ms；与堆大小无关的暂停时间；支持8mb到16tb的堆大小
- 技术特点
  - 并行收集：利用多核并行处理，减少gc暂停时间。
  - 基于region的内存管理
  - 彩色指针技术
  - 负载屏障机制
  
参数配置
```java
//启用zgc
-XX:+UseZGC
//设置最大堆大小
-Xmx8g
//启用zgc堆分代收集（jdk17+）
-XX:+UseZG
-XX:+UnlockExperimentalVMOptions
//zgc调优参数
-XX:SoftMaxHeapSize=7g
-XX:ZCollectionInterval=5
-XX:ZUncommitDelay=300
```
#### Shenandoah GC
- 平衡性能
  - 低延迟与高吞吐量的平衡
  - 暂停时间通常小于10ms
  - 适合中等规模应用。
- 实现机制
  - 并发标记和并发回收
  - Brooks指针技术
  - 连接矩阵优化
 
参数配置
```java
//启用shenandoah gc
-XX:+UseShenandoahGC
//设置最大堆大小
-Xmx4g -Xms4g
//shenandoah gc调优参数
-XX:ShenandoahGCHeuristics=adaptive
-XX:ShenandoahGuaranteedGCInterval=30000
-XX:ShenandoahUncommitDelay=5000
```
### 内存管理优化
- 智能分配
  - 改进的TLAB(线程本地分配缓冲)
  - 更精确的对象年龄预测
  - 优化的大对象处理
- 压缩优化
  - 改进的压缩普通对象指针（CompressedOops）
  - 更高效的字符串压缩
  - 优化的数组布局
- 逃逸分析
  - 更精确的逃逸检查
  - 标量替换优化
  - 栈上分配改进

内存优化参数配置
```java
// 启用压缩指针
-XX:+UseCompressedOops
-XX:+UseCompressedClassPointers
//优化tlab
-XX:TLABSize=1m
-XX:ResizeTLAB=true
//启用逃逸分析
-XX:+DoEscapeAnalysis
-XX:+EliminateAllocations
-XX:+EliminateLocks
//字符串优化
-XX:+UseStringDeduplication
```
### jdk17调优实战
高并发web应用调优-需要优化响应时间和吞吐量
```java
//jdk1.8传统配置
-Xmx4g -Xms4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m

//JDK17优化配置
-Xmx4g -Xms4g
-XX:+UseZGC
-XX:SoftMaxHeapSize=3.5g
//启用新特性
-XX:+UseStringDeduplication
-XX:+UseCompressedOops
-XX:+DoEscapeAnalysis
//监控和诊断
-XX:+FlightRecorder
-XX:StartFlightRecording=duration=60s,filename=app-profile.jfr
```
性能对比
- 响应时间
  - 平均响应时间：从120ms-85ms
  - p99响应时间：从800ms-300ms
  - gc暂停时间：从50ms-5ms
- 吞吐量
  - qps提升：从8000-12000
  - cpu利用率：从85%-70%
  - 内存利用率：提升15%

### 监控与诊断工具
jfr（java flight recorder）增强
- 新增事件
  - ZGC和Shenandoah GC事件
  - 更详细的内存分配事件
  - 线程本地分配缓冲事件
  
- 性能分析
  - 更精确的CPU采样
  - 内存泄漏检测改进
  - 锁竞争分析增强

jfr使用示例
```bash
# 启动时开启JFR
-XX:+FlightRecorder
-XX:StartFlightRecording=duration=300s,filename=myapp.jfr,settings=profile

# 运行时开启JFR
jcmd <pid> JFR.start duration=60s filename=runtime.jfr

# 分析JFR文件
jfr print --events CPULoad,GCHeapSummary myapp.jfr
jfr summary myapp.jfr
```
新的诊断命令
```bash
# 查看ZGC状态
jcmd <pid> GC.run_finalization
jcmd <pid> VM.info

# 内存分析
jcmd <pid> GC.heap_info
jcmd <pid> VM.memory

# 线程分析
jcmd <pid> Thread.print
jcmd <pid> VM.thread_dump
```
### jdk17调优最佳实践
垃圾收集器选择指南
- 大内存应用
  - 堆大小 > 8gb:推荐zgc
  - 对延迟敏感：zgc或者shenandoah
  - 需要预测性能：zgc

- 中等规模应用
  - 堆大小2-8gb：g1gc或者shenandoah
  - 平均吞吐量和延迟：g1gc
  - 简单配置：g1gc
- 小型应用
  - 堆大小 < 2gb：parallel gc
  - 批处理应用：parallel gc
  - 启动时间敏感：serial gc

调优检查清单
- 基准测试：建立性能基线，记录关键指标
- 选择gc：根据应用特征选择合适的垃圾收集器
- 内存配置：合理设置堆大小和内存参数
- 监控分析：使用jfr等工具持续监控
- 迭代优化：基于监控数据逐步调优
- 压力测试：验证调优效果和稳定性
## jdk21调优实战
### JDK 21新特性概览
- 虚拟线程：project loom等核心特性，提供轻量级线程实现，大幅提升并发性能和资源利用率。
- pattern matching：增强的模式匹配功能，提供更简洁的代码和更好的性能优化机会。
- string templates：新的字符串模版功能，提供更安全和高效的字符串处理方式。
- gc改进：ZGC和G1GC的进一步优化，提供更低的延迟和更好的吞吐量。

### 虚拟线程性能优化
虚拟线程是JDK 21最重要的特性之一，它彻底改变了Java的并发编程模型。理解虚拟线程的工作原理和性能特点对于JVM调优至关重要。
#### 虚拟线程原理
虚拟线程是由JVM管理的轻量级线程，它们被映射到少量的操作系统线程（载体线程）上。这种设计允许创建数百万个虚拟线程而不会耗尽系统资源。
- 内存占用极低：每个虚拟线程只需要几KB内存
- 创建成本低：创建虚拟线程比平台线程快100倍以上
- 上下文切换开销小：虚拟线程切换在用户空间完成
- 阻塞不占用载体线程：I/O阻塞时自动释放载体线程
#### 虚拟线程调优参数
```bash
# 设置载体线程池大小 
-Djdk.virtualThreadScheduler.parallelism=8 
# 设置载体线程最大数量 
-Djdk.virtualThreadScheduler.maxPoolSize=256 
# 启用虚拟线程调试 
-Djdk.tracePinnedThreads=full 
# 监控虚拟线程性能 
-XX:+UnlockExperimentalVMOptions 
-XX:+UseTransparentHugePages
```
### Pattern Matching优化
JDK 21中的Pattern Matching功能得到了显著增强，不仅提供了更简洁的语法，还带来了编译器优化机会。

#### Switch表达式优化
新的switch表达式支持模式匹配，编译器可以进行更好的优化，包括分支预测和代码内联。
```java
// 传统方式 
if (obj instanceof String s) { 
  return s.length(); 
} else if (obj instanceof Integer i){       
  return i; 
} else { 
  return 0; 
} 
// Pattern Matching优化 
return switch (obj) { 
  case String s -> s.length(); 
  case Integer i -> i; 
  case null, 
  default -> 0; 
};
```
- 减少类型检查开销：编译器优化类型判断
- 提高分支预测准确性：更好的代码布局
- 支持编译时优化：死代码消除和常量折叠
- 减少对象创建：避免不必要的装箱操作

### GC最新改进
JDK 21在垃圾回收方面也有重要改进，特别是ZGC和G1GC的性能优化。
#### ZGC改进
ZGC在JDK 21中得到了显著改进，支持分代收集，大幅提升了性能和内存利用率。
```bash
# 启用分代ZGC 
-XX:+UseZGC 
-XX:+UnlockExperimentalVMOptions 
-XX:+UseZGenerationalGC 
# ZGC调优参数 
-XX:ZCollectionInterval=5
-XX:ZUncommitDelay=300 
-XX:ZPath=/tmp/zgc
```
#### G1GC优化
G1GC在JDK 21中也有重要改进，包括更好的并发标记和更智能的区域选择算法。
```bash
# G1GC优化配置 
-XX:+UseG1GC 
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m
-XX:G1NewSizePercent=20
-XX:G1MaxNewSizePercent=40 
-XX:+G1UseAdaptiveIHOP
```
### 性能监控增强
#### JFR增强
Java Flight Recorder在JDK 21中增加了对虚拟线程的支持，提供更详细的性能数据。
```bash
# 启用JFR记录虚拟线程 
-XX:+FlightRecorder 
-XX:StartFlightRecording=duration=60s,filename=app.jfr 
-XX:FlightRecorderOptions=settings=profile 
# 虚拟线程特定事件 
-XX:+UnlockExperimentalVMOptions 
-XX:+EnableVirtualThreadEvents
```
#### 新的诊断工具
- 虚拟线程监控:新的MBean和API用于监控虚拟线程的创建、销毁和性能指标。
- Pinning检测:自动检测虚拟线程固定问题，帮助识别性能瓶颈。

### 前沿技术预览
#### Project Panama
Project Panama旨在改进Java与本地代码的互操作性，提供更高效的FFI（Foreign Function Interface）。

- 减少JNI调用开销：直接内存访问
- 提高本地库集成性能：零拷贝数据传输
- 支持向量化操作：SIMD指令优化

#### Structured Concurrency
结构化并发提供了更好的并发编程模型，特别适合与虚拟线程结合使用。
```java
// 结构化并发示例 
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) { 
  Future user = scope.fork(() -> findUser()); 
  Future order = scope.fork(() -> findOrder()); 
  scope.join();
  // 等待所有任务完成 
  scope.throwIfFailed(); 
  // 传播异常 
  return new Response(user.resultNow(), order.resultNow()); 
}
```
### 迁移策略和最佳实践

- 评估现有代码兼容性
- 识别可以使用虚拟线程的场景
- 制定性能基准测试计划
- 准备监控和诊断工具
- 培训团队新特性使用
#### 性能调优建议
- 虚拟线程优化:逐步替换线程池，避免固定操作，优化I/O密集型任务。
- 内存管理:调整堆大小，优化GC参数，监控内存使用模式变化。
- 性能监控:使用新的监控工具，建立性能基线，持续优化调整。