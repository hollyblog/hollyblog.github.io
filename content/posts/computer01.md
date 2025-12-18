---
title: "计算机基础：操作系统与计算机网络"
date: 2021-12-05T13:18:17+08:00
draft: false
description: "操作系统与计算机网络是计算机基础中的重要内容，主要分享对操作系统的基本原理和功能，以及计算机网络的工作原理和协议学习的内容。"
tags: ["计算机基础", "操作系统", "计算机网络"]
categories: ["Computer"]
---

## 1. 模块总览
对于3年经验的开发者，**计算机基础复习应聚焦于操作系统进程/内存管理、网络TCP/IP协议栈、计算机组成原理的缓存一致性，面试分值占比25-30%，是评估计算机科班功底和系统思维能力的核心模块。**

## 2. 面试题清单（Top10高频真题）

| 排名 | 题目 | 所属领域 | 高频出现公司 |
|------|------|----------|-------------|
| 1 | 进程与线程的区别、进程间通信方式 | 操作系统 | 所有大厂 |
| 2 | TCP三次握手与四次挥手、TIME_WAIT状态 | 计算机网络 | 阿里/字节/腾讯 |
| 3 | 虚拟内存、页面置换算法、缺页中断 | 操作系统 | 字节/阿里/美团 |
| 4 | HTTP/HTTPS区别、SSL/TLS握手过程 | 计算机网络 | 所有大厂 |
| 5 | CPU缓存一致性协议（MESI）、内存屏障 | 计算机组成原理 | 阿里/字节/华为 |
| 6 | 死锁产生条件与解决方法、银行家算法 | 操作系统 | 腾讯/美团/京东 |
| 7 | DNS解析过程、CDN工作原理 | 计算机网络 | 字节/阿里/腾讯 |
| 8 | 指令流水线、超标量、乱序执行 | 计算机体系结构 | 华为/阿里/字节 |
| 9 | 编译过程（词法分析、语法分析、中间代码） | 编译原理 | 字节/腾讯 |
| 10 | 中断与异常、系统调用过程 | 操作系统 | 华为/阿里 |

## 3. 逐题深度拆解

### **题目1：进程与线程的区别、进程间通信方式**

#### 原理
**进程与线程核心对比**：
![进程与线程的核心对比](img/computer01-1.png)


**进程间通信（IPC）方式对比**：
| 通信方式 | 原理 | 特点 | 适用场景 |
|---------|------|------|----------|
| **管道（Pipe）** | 半双工，内核缓冲区 | 单向，父子进程间 | 命令行管道：`ls | grep` |
| **命名管道（FIFO）** | 文件系统中有名管道 | 双向，无亲缘关系进程 | 持久化进程通信 |
| **消息队列** | 内核维护的消息链表 | 异步，有类型区分 | 解耦生产消费 |
| **共享内存** | 映射同一物理内存区域 | 最快，需同步机制 | 高性能数据共享 |
| **信号量** | 计数器，控制资源访问 | 同步原语，不传输数据 | 进程同步互斥 |
| **信号（Signal）** | 软件中断，异步通知 | 简单，不可靠 | 进程控制 |
| **Socket** | 网络/域套接字 | 跨网络，通用 | 分布式系统 |

#### 场景
**微服务架构中的进程模型**：
```bash
# Docker容器：每个容器是一个进程（或进程组）
docker run -d --name service1 myapp:1.0
# 容器内可能有多个线程（如Java应用）
# 微服务间通过HTTP(Socket)通信
# 容器内进程可通过共享内存通信

# Kubernetes Pod：共享网络和存储的容器组
# 同一个Pod中的容器可通过localhost通信
# 可通过共享卷(Volume)共享文件
```

#### 追问
**Q：协程与线程的区别？为什么Go语言使用协程？**
- **线程**：内核调度，上下文切换代价高（需切换页表、寄存器等），创建数有限（约千级）
- **协程**：用户态调度，切换代价极低（仅保存寄存器），可创建百万级
- **Go的优势**：Goroutine轻量，M:N调度模型，适合高并发I/O密集型应用

**Q：Linux中如何查看进程和线程？**
```bash
# 查看进程树
pstree -p
# 查看进程详细信息
ps -ef | grep java
ps aux --sort=-%mem | head -10  # 按内存排序

# 查看线程
top -H -p <pid>  # 查看指定进程的线程
ps -T -p <pid>   # 查看进程的线程列表

# 查看进程打开的文件
lsof -p <pid>
```

#### 总结
进程是资源分配的最小单位，线程是CPU调度的最小单位；进程间通信有管道、消息队列、共享内存等方式，选择取决于性能与复杂度需求。

#### 

---

### **题目2：TCP三次握手与四次挥手、TIME_WAIT状态**

#### 原理
**TCP连接建立与终止状态机**：
![TCP连接状态机](img/computer01-2.png)

**为什么是三次握手？**
1. 第一次：客户端→服务端，证明客户端发送能力正常
2. 第二次：服务端→客户端，证明服务端接收和发送能力正常
3. 第三次：客户端→服务端，证明客户端接收能力正常
**防止失效的连接请求到达服务器导致错误建立连接**

#### 场景
**高并发服务器TIME_WAIT优化**：
```bash
# 查看TIME_WAIT连接
netstat -ant | grep TIME_WAIT | wc -l

# 服务器优化参数（Linux内核）
# 1. 启用TIME_WAIT重用（需双方都开启时间戳）
echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse

# 2. 启用TIME_WAIT快速回收（有NAT环境风险）
echo 1 > /proc/sys/net/ipv4/tcp_tw_recycle  # Linux 4.12已移除

# 3. 调整端口范围，增加可用端口数
echo "1024 65000" > /proc/sys/net/ipv4/ip_local_port_range

# 4. 调整FIN_WAIT2超时时间
echo 30 > /proc/sys/net/ipv4/tcp_fin_timeout
```

#### 追问
**Q：为什么TIME_WAIT需要等待2MSL（Maximum Segment Lifetime）？**
1. **可靠关闭**：确保最后一个ACK能被对方收到（对方超时重传FIN）
2. **清理旧连接**：确保本次连接的所有报文都从网络中消失，避免被新连接误收
3. MSL通常为30秒或2分钟，2MSL=60秒或4分钟

**Q：TCP粘包/拆包问题如何解决？**
- **原因**：TCP是字节流协议，无消息边界
- **解决方案**：
  1. 固定长度：每个消息固定长度，不足补零
  2. 分隔符：如`\n`、`\r\n`等
  3. 长度前缀：先发送消息长度，再发送消息内容（如HTTP Content-Length）
  4. 协议设计：如Protobuf、Thrift等自带长度信息

#### 总结
TCP通过三次握手建立可靠连接，四次挥手优雅关闭；TIME_WAIT状态等待2MSL确保连接彻底关闭，避免新旧连接数据混淆。

---

### **题目3：虚拟内存、页面置换算法、缺页中断**

#### 原理
**虚拟内存与物理内存映射关系**：
![虚拟内存与物理内存映射关系](img/computer01-3.png)

**页面置换算法对比**：
| 算法 | 思想 | 优缺点 | 实现复杂度 |
|------|------|--------|-----------|
| **OPT** | 淘汰未来最长时间不使用 | 理论最优，无法实现 | 高（需预知未来） |
| **FIFO** | 先进先出 | 简单，可能淘汰常用页（Belady异常） | 低 |
| **LRU** | 最近最少使用 | 效果好，实现较复杂 | 中 |
| **Clock** | 近似LRU，使用访问位 | 平衡性能与实现 | 中 |
| **LFU** | 最不经常使用 | 适合特定场景，对突发访问不友好 | 高 |

#### 场景
**数据库缓冲池管理**：
```sql
-- InnoDB缓冲池类似操作系统页缓存
-- 参数配置
[mysqld]
innodb_buffer_pool_size = 16G  # 类似物理内存
innodb_buffer_pool_instances = 8  # 类似多级缓存

-- 页面淘汰：类似LRU，但有改进
-- 分为young区（热数据）和old区（新数据）
-- 新页面先进入old区，经过一定访问后才进入young区
-- 避免全表扫描污染缓冲池
```

#### 追问
**Q：什么是缺页中断？处理流程是什么？**
```c
// 缺页中断处理伪代码
void handle_page_fault(virtual_address va) {
    // 1. 检查地址合法性（是否在进程地址空间内）
    if (!is_valid_address(va)) {
        send_sigsegv();  // 段错误
        return;
    }
    
    // 2. 查找空闲物理页框
    page_frame = find_free_frame();
    if (!page_frame) {
        // 3. 无空闲页框，触发页面置换
        victim_page = select_victim_by_algorithm();
        if (victim_page.is_dirty) {
            write_to_disk(victim_page);  // 写回磁盘
        }
        page_frame = victim_page.frame;
    }
    
    // 4. 从磁盘加载页面内容
    read_from_disk(page_frame, va);
    
    // 5. 更新页表
    update_page_table(va, page_frame);
    
    // 6. 重新执行引发缺页的指令
    restart_instruction();
}
```

**Q：TLB是什么？为什么需要它？**
- **TLB（Translation Lookaside Buffer）**：页表缓存，存储最近使用的虚拟页到物理页的映射
- **作用**：加速地址转换，避免每次访问内存都要查页表（内存访问本身需要查页表，形成死循环）
- **工作流程**：虚拟地址→查TLB→命中则直接得到物理地址；未命中则查页表→更新TLB

#### 总结
虚拟内存通过页表映射提供大于物理内存的地址空间，缺页中断实现按需加载，页面置换算法在内存不足时淘汰页面，TLB加速地址转换。

---

### **题目4：HTTP/HTTPS区别、SSL/TLS握手过程**

#### 原理
**HTTP与HTTPS协议栈对比**：
![HTTP与HTTPS协议栈对比](img/computer01-4.png)


**TLS 1.2完整握手过程**：
![TLS 1.2完整握手过程](img/computer01-5.png)

#### 场景
**微服务间HTTPS通信配置**：
```yaml
# Spring Cloud Gateway HTTPS配置
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: changeit
    key-store-type: PKCS12
    key-alias: myserver

# 服务间调用使用HTTPS
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
        loggerLevel: basic
  httpclient:
    enabled: true
    disableSslValidation: false  # 生产环境应为false，使用正式证书
```

#### 追问
**Q：HTTPS如何防止中间人攻击？**
1. **证书验证**：客户端验证服务器证书的合法性（颁发机构、有效期、域名匹配等）
2. **公钥加密**：预主密钥用服务器公钥加密，只有拥有私钥的服务器能解密
3. **数字签名**：证书由CA私钥签名，防止篡改
4. **密钥协商**：使用Diffie-Hellman等密钥交换算法，即使私钥泄露，过去的通信也不会被解密（前向保密）

**Q：TLS 1.3相比1.2有哪些改进？**
1. **握手更快**：1-RTT（首次）或0-RTT（重连），减少往返次数
2. **更安全**：移除不安全的加密算法（如RC4、SHA-1、CBC模式等）
3. **简化流程**：合并多个消息，减少握手步骤
4. **密钥分离**：不同用途使用不同密钥，提高安全性

#### 总结
HTTPS=HTTP+SSL/TLS，通过证书验证身份，非对称加密协商密钥，对称加密传输数据，TLS 1.3进一步优化了安全性和性能。

---

### **题目5：CPU缓存一致性协议（MESI）、内存屏障**

#### 原理
**MESI协议状态转换**：
![MESI协议状态转换](img/computer01-6.png)

**缓存行与伪共享**：
```java
// 伪共享（False Sharing）示例
public class FalseSharingExample {
    // 两个变量可能在同一个缓存行（通常64字节）
    volatile long variableA;
    volatile long variableB;  // 可能与variableA在同一缓存行
    
    // 优化：使用填充避免伪共享
    volatile long variableA;
    long p1, p2, p3, p4, p5, p6, p7; // 56字节填充
    volatile long variableB;  // 现在在不同缓存行
}
```

#### 场景
**Java并发编程中的内存屏障**：
```java
// Java内存模型与内存屏障
public class MemoryBarrierExample {
    private int x = 0;
    private volatile boolean flag = false;
    
    public void writer() {
        x = 42;                 // 普通写
        flag = true;            // volatile写，插入StoreStore屏障
        // StoreStore屏障确保x=42对其他线程可见
    }
    
    public void reader() {
        if (flag) {             // volatile读，插入LoadLoad屏障
            // LoadLoad屏障确保读取x时能看到writer()的所有写
            System.out.println(x);  // 保证看到42
        }
    }
}
```

#### 追问
**Q：什么是内存屏障？有哪几种类型？**
1. **LoadLoad屏障**：确保屏障前的读操作先于屏障后的读操作完成
2. **StoreStore屏障**：确保屏障前的写操作先于屏障后的写操作完成，并对其他处理器可见
3. **LoadStore屏障**：确保屏障前的读操作先于屏障后的写操作完成
4. **StoreLoad屏障**：确保屏障前的写操作对其他处理器可见后，才执行屏障后的读操作（全能屏障，开销最大）

**Q：MESI协议如何保证缓存一致性？**
1. **监听总线**：每个CPU监听其他CPU的读写操作
2. **状态转换**：根据监听到的操作更新自己的缓存行状态
3. **写传播**：修改缓存行时，通过总线通知其他CPU置为无效
4. **写串行化**：同一时刻只能有一个CPU修改缓存行

#### 总结
MESI协议通过Modified/Exclusive/Shared/Invalid四种状态维护多核CPU缓存一致性；内存屏障确保指令执行顺序和内存可见性，避免重排序问题。

## 4. 踩坑雷达

### **案例1：TCP连接数耗尽导致服务不可用**
**故障现象**：某电商系统大促期间，网关服务器出现大量`Cannot assign requested address`错误，新用户无法访问。

**根本原因**：
```bash
# 查看连接状态
netstat -ant | awk '{print $6}' | sort | uniq -c
# 输出：
#   5000 ESTABLISHED
#   30000 TIME_WAIT  # 大量TIME_WAIT连接！

# 分析：
# 1. 服务器作为客户端调用下游服务，使用短连接
# 2. 每次调用后立即关闭，产生大量TIME_WAIT
# 3. Linux默认本地端口范围：32768-61000，约28000个
# 4. TIME_WAIT占用端口，导致新连接无可用端口
```

**如何避免**：
```bash
# 解决方案1：使用连接池，复用TCP连接
# HTTP客户端配置连接池
httpclient:
  max-total: 200      # 最大连接数
  default-max-per-route: 50  # 每个路由最大连接数
  validate-after-inactivity: 5000  # 空闲连接验证间隔

# 解决方案2：调整内核参数
# 扩大本地端口范围
echo "1024 65535" > /proc/sys/net/ipv4/ip_local_port_range

# 启用TIME_WAIT重用（需确保没有NAT问题）
echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse

# 解决方案3：调整TCP参数，减少TIME_WAIT时间
# 修改FIN超时时间（默认60秒）
echo 30 > /proc/sys/net/ipv4/tcp_fin_timeout

# 解决方案4：服务端使用长连接
# Nginx配置
upstream backend {
    server 10.0.0.1:8080;
    keepalive 100;  # 保持长连接
}
```

### **案例2：伪共享导致多线程性能下降**
**故障现象**：某高频交易系统，使用多线程统计各交易对的成交量，线程数增加时性能不升反降。

**根本原因**：
```java
// 原始代码：伪共享问题
public class TradeStats {
    // 多个计数器在同一个缓存行
    private volatile long countA;  // 交易对A的成交量
    private volatile long countB;  // 交易对B的成交量
    private volatile long countC;  // 交易对C的成交量
    
    // 线程1更新countA，线程2更新countB
    // 由于在同一缓存行，每次更新都会使其他CPU的缓存行失效
    // 导致缓存行在CPU间来回传递，性能严重下降
}

// 性能测试结果：
// 1线程：QPS 100万
// 2线程：QPS 60万（不升反降！）
// 4线程：QPS 30万
```

**如何避免**：
```java
// 解决方案1：使用填充（JDK8之前）
public class PaddedTradeStats {
    private volatile long countA;
    private long p1, p2, p3, p4, p5, p6, p7; // 56字节填充
    
    private volatile long countB;
    private long p8, p9, p10, p11, p12, p13, p14;
    
    private volatile long countC;
    // 每个变量独占一个缓存行（64字节）
}

// 解决方案2：使用JDK8的@Contended注解（需开启JVM参数）
import sun.misc.Contended;

public class ContendedTradeStats {
    @Contended
    private volatile long countA;
    
    @Contended
    private volatile long countB;
    
    @Contended
    private volatile long countC;
    // JVM自动填充，确保不在同一缓存行
}

// JVM参数：-XX:-RestrictContended  // 允许用户类使用@Contended

// 解决方案3：使用数组+线程局部索引
public class ArrayTradeStats {
    private final long[] counts;
    private final int[] threadIndices;  // 每个线程使用不同数组位置
    
    // 每个线程更新自己的数组位置
    // 最后再汇总，避免并发更新同一缓存行
}
```

## 5. 速记卡片

| 类别 | 概念/命令 | 关键点 | 记忆口诀 | 应用场景 |
|------|----------|--------|----------|----------|
| **操作系统** | 进程状态 | 创建、就绪、运行、阻塞、终止 | "创就运阻终" | 进程调度 |
|  | 页面置换算法 | OPT/FIFO/LRU/Clock | "最佳先进最近时钟" | 虚拟内存管理 |
|  | 死锁条件 | 互斥、占有等待、不可剥夺、循环等待 | "互占不循" | 死锁避免 |
| **网络协议** | TCP状态 | LISTEN/SYN_SENT/ESTABLISHED等11种 | "三次握手四次挥手" | 连接管理 |
|  | HTTP状态码 | 1xx信息 2xx成功 3xx重定向 4xx客户端错 5xx服务器错 | "1信2成3重4客5服" | API设计 |
|  | DNS记录类型 | A/AAAA/CNAME/MX/NS/TXT | "地址别名邮件域名文本" | 域名解析 |
| **计算机组成** | MESI状态 | Modified/Exclusive/Shared/Invalid | "修改独占共享无效" | 缓存一致性 |
|  | 内存屏障 | LoadLoad/StoreStore/LoadStore/StoreLoad | "读读写写读写写读" | 并发编程 |
|  | 流水线阶段 | 取指IF/译码ID/执行EX/访存MEM/写回WB | "取译执访写" | CPU设计 |
| **编译原理** | 编译阶段 | 词法分析→语法分析→语义分析→中间代码→优化→目标代码 | "词法语法语义中间优化目标" | 编译器 |
|  | 文法类型 | 0型无限制 1型上下文有关 2型上下文无关 3型正则 | "无上上下正" | 语言设计 |
| **Linux命令** | 进程查看 | ps/top/htop | "进程三剑客" | 系统监控 |
|  | 网络诊断 | netstat/ss/ping/traceroute/tcpdump | "网络五工具" | 网络排查 |
|  | 性能分析 | perf/vmstat/iostat/sar | "性能四法宝" | 性能调优 |
| **JVM相关** | 内存参数 | -Xms/-Xmx/-Xmn/-XX:MetaspaceSize | "启大新元" | JVM调优 |
|  | GC收集器 | Serial/Parallel/CMS/G1/ZGC | "串并CMS G1 Z" | GC选择 |
| **数据库** | 隔离级别 | 读未提交/读已提交/可重复读/串行化 | "未提交读读串行" | 事务设计 |
|  | 索引类型 | B-Tree/Hash/R-Tree/Full-text | "B哈希R全文" | 查询优化 |

---

**考前最后提醒**：
1. **进程线程区别**要能画图说明资源分配与调度的不同
2. **TCP状态机**必须能画出三次握手和四次挥手全过程
3. **虚拟内存映射**要理解页表、TLB、缺页中断的完整流程
4. **缓存一致性**要掌握MESI状态转换和内存屏障作用
5. 准备一个**线上系统性能问题排查案例**，体现从现象到根因的分析过程

**新兴技术趋势**：
1. **eBPF**：Linux内核的观测与跟踪技术，无需修改内核
2. **QUIC**：基于UDP的下一代传输协议，解决TCP队头阻塞
3. **DPU**：数据处理器，专用硬件加速网络、存储、安全
4. **RISC-V**：开源指令集架构，打破x86/ARM垄断

**学习资源推荐**：
1. **书籍**：《深入理解计算机系统》《现代操作系统》《计算机网络：自顶向下方法》
2. **课程**：CMU 15-213 CSAPP、Stanford CS144计算机网络
3. **实践**：Linux内核源码阅读、Wireshark抓包分析、QEMU模拟器实验

