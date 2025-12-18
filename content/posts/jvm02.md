---
title: "JVM 监控工具"
date: 2021-01-29T16:45:13+08:00
draft: false
description: "JVM 监控工具：深入学习jvm监控工具的使用，包括jdk自带工具、可视化工具和第三方工具，建立完整的jvm监控体系。"
tags: ["JVM", "监控工具"]
categories: [JVM]
---
JVM 监控工具：深入学习jvm监控工具的使用，包括jdk自带工具、可视化工具和第三方工具，建立完整的jvm监控体系。
## JDK自带监控工具
jdk提供了一系列强大的命令行工具。
### 核心工具概览
- jps（java进程状态）：显示系统中所有java进程的pid和主类名，是其他工具的基础。
- jstat（jvm统计信息）：实时监控jvm的运行状态，包括gc、内存和类加载等信息。
- jmap（内存映像工具）：生成堆转储快照，分析内存使用情况和内存泄漏问题。
- jstack（线程堆栈跟踪）：生成线程快照，分析线程状态和死锁问题。
```bash
# 显示所有java进程
jps
# 显示进程id和主类全名
jps -l
# 显示传递给main方法的参数
jps -m
# 显示jvm参数
jps -v
# 组合使用
jps -lvm
```
```bash
#监控垃圾回收情况
jstat -gc [pid] [interval] [count]
#监控垃圾回收统计
jstat -gcutil [pid] [interval] [count]
# 监控新生代gc情况
jstat -gcnew [pid] [interval] [count]
#监控老年代gc情况
jstat -gcold [pid] [interval] [count]
#监控类加载情况
jstat -class [pid] [interval] [count]
#每秒监控一次gc情况，共监控10次
jstat -gc 12345 1s 10
```
```bash
#生成堆转储文件
jmap -dump:format=b,file=heapdump.hprof [pid]
#生成存活对象的堆转储
jmap -dump:live,format=b,file=heapdump.hprof [pid]
#显示堆内存使用情况
jmap -heap [pid]
#显示堆中对象统计信息
jmap -histo [pid]
#显示存活对象统计信息
jmap -histo:live [pid]
```
```bash
#生成线程快照
jstack [pid]
#强制生成线程快照（当进程无响应时
jstack -F [pid]
#生成线程快照并输出到文件
jstack [pid] > thread_dump.txt
#检测死锁
jstack -l [pid]
```
## 可视化监控工具
### 工具对比
- jconsole：jdk自带，免费简单易用，基础监控
  - 实时监控内存使用情况
  - 监控线程状态和数量
  - 查看类加载情况
  - 监控MBean信息
```bash
#直接启动jconsole
jconsole hostname:port
```
- visualvm：开源，功能丰富，插件支持，开发测试环境
  - 性能分析：cpu和内存性能分析
  - 堆转储分析：内存泄漏检测
  - 线程分析：线程状态监控
  - 插件支持：丰富的插件生态
- jprofiler：商业，专业强大，界面友好，生产环境和深度分析
- mat：开源，内存分析专业，内存泄漏分析
### 第三方监控工具
- arthas（阿里巴巴开源诊断工具）
  - 无需重启应用
  - 实时查看和修改
  - 强大的命令行界面
  - 支持web控制台
```bash
#查看jvm信息
dashboard
#监控方法调用
watch com.example.Service method
#查看线程信息
thread
#查看堆内存
heapdump
```
- MAT-内存分析工具
elipse memory analyzer tool（mat），适合分析大型堆转储文件
    - 内存泄漏检测：自动识别可能的内存泄漏
    - 对象引用分析：查看对象的引用关系
    - 支配树分析：找出占用内存最多的对象
    - oql查询：使用类sql语法查询对象

- jprofiler商业性能分析工具
    - cpu分析：方法调用树、热点方法识别、调用图分析
    - 内存分析：堆遍历、内存泄漏检测、对象分配跟踪
    - 线程分析：线程状态监控、死锁检测和同步分析
## 监控指标体系
cpu、内存、gc和线程多个维度
### 关键性指标
- cpu指标
  - cpu使用率
  - gc占用cpu时间
  - 应用线程cpu时间
  - 系统负载
- 内存指标
  - 堆内存使用率
  - 非堆内存使用率
  - 各代内存使用情况
  - 直接内存使用量
- gc指标
  - gc频率和耗时
  - 各代gc次数
  - gc吞吐量
  - gc暂停时间
- 线程指标
  - 线程总数
  - 活跃线程数
  - 阻塞线程数
  - 死锁检测

告警阈值建议
- 堆内存使用率：超过80%需要关注
- gc频率：full gc频率过高需要优化
- gc耗时：单次gc超过100ms需要关注
- 线程数：持续增长需要检查
## 实战
### 内存泄漏检测
- 使用jstat监控发现老年代内存持续增长
- 生成堆转储文件
- 使用mat分析堆转储文件
- 查看内存泄漏报告
- 分析支配树找出大对象
- 查看对象引用关系
- 使用jstack分析线程状态
### 高cpu使用率分析
- 找出cpu使用率最高的java进程 `top -p 'jps -q'`
- 找出该进程中cpu使用率最高的线程 `top -H -p [pid]`
- 将线程id转换为16进制 `printf "%x\n" [thread_id]`
- 在线程快照中查找对应线程 `jstack [pid] | grep [hex_thread_id] -A 20`




