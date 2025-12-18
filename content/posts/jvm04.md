---
title: "JVM GC调优"
date: 2021-02-02T16:45:13+08:00
draft: false
description: "JVM GC调优：深入学习jvm垃圾回收机制，掌握垃圾回收算法、参数调优和监控工具，提升应用性能和稳定性。"
tags: ["JVM", "GC调优"]
categories: [JVM]
---
JVM GC调优：深入学习jvm垃圾回收机制，掌握垃圾回收算法、参数调优和监控工具，提升应用性能和稳定性。
## 垃圾收集器概述
垃圾收集器（Garbage Collector）是jvm内存管理的核心组件，负责自动回收不再使用的对象所占用的内存空间。
### 垃圾收集器分类
- 按代际分类
  - 新生代垃圾收集器：Serial\Parallel\ParNew\Scavenge
  - 老年代垃圾收集器：Serial Old\Parallel Old\CMS
  - 整堆收集器：G1\ZGC\Shenandoah
- 按线程数分类
  - 串行收集器：单线程执行、适合小型应用
  - 并行收集器：多线程执行，适合吞吐量优先场景
  - 并发收集器：与应用线程并发执行，适合低延迟场景
- 按停顿时间分类
  - stop-the-world：需要暂停所有应用线程
  - 并发收集：大部分时间与应用线程并发执行
  - 增量收集：将收集工作分解为多个小步骤

## Serial收集器
是最基本、历史最悠久的垃圾收集器。是一个单线程收集器，在进行垃圾收集时必须暂停所有工作线程，直到收集结束。

工作原理
- 单线程执行：只使用一个线程进行垃圾回收
- stop-the-world：收集期间暂停所有应用线程
- 复制算法：新生代使用复制算法
- 标记-整理算法：老年代使用标记-整理算法

适用场景
- 客户端应用：桌面应用程序、小型工具等对停顿时间不敏感的应用。
- 小内存环境：堆内存较小（几十mb到一两百mb）的应用环境
- 单核处理器：在单核处理器环境下，serial收集器没有线程交互开销。

配置参数
```java
// 使用serial收集器（新生代）
-XX:+UseSerialGC
//设置新生代大小
-Xmn128m
//设置eden与survivor比例
-XX:SurvivorRatio=8
//设置对象进入老年代的年龄阈值
-XX:MaxTenuringThreshold=15
```
## Parallel收集器
Parallel收集器是jdk1.4.2引入的多线程垃圾收集器，也被称为吞吐量优先的收集器。它是Server模式下的默认收集器。

主要特点
- 多线程并行：使用多个线程并行进行垃圾收集
- 吞吐量优先：关注整体的吞吐量而非单次停顿时间
- 自适应调节：可以自动调节堆大小、停顿时间等参数
- 适合批处理：特别适合后台运算而不需要太多交互等任务。

收集器组合
- Parallel Scavenge:新生代收集器，使用复制算法，多线程并行收集。
- Parallel Old: 老年代收集器，使用标记-整理算法，多线程并行收集。

配置参数
```java
// 使用Parallel收集器（新生代+老年代）
-XX:+UseParallelGC
-XX:+UseParallelOldGC
//设置并行收集器线程数
-XX:ParallelGCThreads=4
//设置最大停顿时间目标（毫秒）
-XX:MaxGCPauseMillis=200
//设置吞吐量目标（垃圾收集时间占总时间的比例）
-XX:GCTimeRatio=19
//启用自适应大小策略
-XX:+UseAdaptiveSizePolicy
```
## CMS收集器
CMS收集器（Concurrent Mark Sweep）是一种以获取最短停顿时间为目标的并发收集器，特别适用于对响应时间敏感的应用。

工作流程
- 初始标记：标记gc roots能直接关联到的对象，需要stop-the-world，但时间很短。
- 并发标记：从gc roots开始遍历整个对象图，与应用线程并发执行，时间较长
- 重新标记：修正并发标记期间因用户程序运行而导致标记变动的对象，需要stop-the-world。
- 并发清除：清除标记为垃圾的对象，停顿时间较短，与应用线程并发执行。

优点
- 低延迟：并发收集，停顿时间短
- 响应性好：适合对响应时间敏感的应用
- 并发执行：大部分收集工作与应用线程并发。

缺点
- cpu敏感：并发阶段会占用大量cpu资源
- 浮动垃圾：并发清除阶段产生的垃圾无法处理
- 内存碎片：使用标记-清除算法，会产生内存碎片。
- Concurrent Mode Failure:可能导致full gc

配置参数
```java
//使用cms收集器
-XX:+UseConcMarkSweepGC
-XX:+UseParNewGC
//设置cms触发阈值
-XX:CMSInitiatingOccupancyFraction=75
-XX:+UseCMSInitiatingOccupancyOnly
//启动类卸载
-XX:+CMSClassUnloadingEnabled
//设置cms并发线程数
-XX:ConcGCThreads=2
//启用增量模式（已废弃）
-XX:+CMSIncrementalMode
```
## G1收集器
G1收集器（Garbage First）是jdk1.7引入的低延迟垃圾收集器，也是jdk1.9默认的垃圾收集器。它将堆内存划分为多个大小相等的region，能实现可预测的停顿时间。

核心特征
- region划分：将堆划分为多个大小相等的region，每个region可以是eden、survivor、old区域。
- 可预测停顿：可以设置期望的停顿时间目标，g1会尽力在该时间内完成收集。
- 优先级收集：优先收集垃圾最多的region，获得最大的收集效率。

收集模式
- young gc：收集所有年轻代region
- mixed gc：收集所有region（包括年轻代和老年代）
- full gc：收集整个堆（应该避免）

配置参数
```java
//使用g1收集器
-XX:+UseG1GC
//设置期望的停顿时间（毫秒）
-XX:MaxGCPauseMillis=200
//设置region大小（1mb-32mb，必须是2的幂数）
-XX:G1HeapRegionSize=32m
//设置新生代占堆的最小比例
-XX:G1NewSizePercent=30
//设置新生代占堆的最大比例
-XX:G1MaxNewSizePercent=60
//设置触发mixed gc的老年代占用阈值
-XX:G1MixedGCLiveThresholdPercent=85
```
## 新一代收集器
如ZGC\Shenandoah等，它们能在大堆内存下实现极低的停顿时间。
### ZGC收集器
- 超低延迟：停顿时间不超过10ms，与堆大小无关。
- 大堆支持：支持8mb到16tb的堆大小
- 彩色指针：使用彩色指针技术实现并发收集。
### Shenandoah收集器
- 低延迟：停顿时间堆大小无关，通常在10ms以下。
- 并发移动：支持并发的对象移动和压缩。
- 内存效率：相比ZGC有更好的内存利用率。

### 配置示例
```java
// zgc配置
-XX:+UseZGC
-XX:+UnlockExperimentalVMOptions
// shenandoah配置
-XX:+UseShenandoahGC
-XX:+UnlockExperimentalVMOptions
//通用配置
-Xmx8g
-XX:+UseTransparentHugePages
```
## 垃圾收集器选择
- 客户端应用
  - 堆内存 < 100mb: 使用serial收集器
  - 单核cpu：使用serial收集器
  - 对停顿时间不敏感：使用serial收集器
- 服务端应用：
  - 吞吐量优先：使用Parallel收集器
  - 对停顿时间延迟敏感：使用g1收集器
  - 大堆内存（>6gb）：使用g1 收集器
  - 极低延迟要求：使用ZGC或Shenandoah收集器
- 特殊场景
  - 实时系统：zgc或shenandoah
  - 大数据处理：parallel收集器
  - web应用：g1收集器
  - 微服务：g1收集器


### 性能对比
吞吐量：parallel > g1 >cms > zgc/shenandoah > serial
延迟：parallel > cms > g1 > zgc/shenandoah > serial
内存占用：zgc/shenandoah > g1 > cms > parallel > serial
cpu占用：zgc/shenandoah > cms > g1 > parallel > serial


## 调优最佳实践
### 调优步骤
- 性能分析：分析应用的内存使用模式、对象生命周期、gc频率等
- 参数调整：根据分析结果调整堆大小、收集器参数等。
- 效果验证：通过压力测试验证调优效果，监控关键性能指标
- 持续优化：根据生产环境反馈持续调整和优化

### 监控工具
```java
//启用gc日志
+XX:+PrintGC
+XX:+PrintGCDetails
+XX:+PrintGCTimeStamps
+XX:+PrintGCApplicationStoppedTime
+Xloggc:gc.log
//jdk9+ 的日志配置
+Xlog:gc*:gc.log:time,tag
//常用的监控工具
//1. jstat -jvm统计信息
jstat -gc 1s
//2. GCViewer-gc日志分析
//3. GCPlot.com- 在线gc日志分析
//4.VisualVM- 可视化监控工具
```

## 实战案例
- 基准测试：建立性能基准，记录调优前的关键指标
- 逐步调整：一次只调整一个参数，观察效果
- 压力测试：在接近生产环境的负载下进行测试
- 长期监控：关注长期运行的稳定性和性能表现

