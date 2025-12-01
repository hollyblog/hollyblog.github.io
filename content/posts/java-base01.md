---
title: "Java 入门基础"
date: 2021-01-08T15:20:00+08:00
draft: false
description: "Java 入门基础：Java 简介，JDK、JRE、JVM、Hello World 程序。"
tags: ["Java", "入门基础"]
categories: ["Java"]
---

Java 入门基础：Java 简介，JDK、JRE、JVM、Hello World 程序。

---
## 1. Java 简介
### 1.1 简述Java语言的主要特性
Java 是一种面向对象的编程语言，具有封装、多态、继承的基础特性，同时也具有以下主要特性：
- **平台独立性**：Java 程序编译后生成字节码，在任何安装了 Java 运行环境（JRE）的平台上都可以运行。
- **自动内存管理**：Java 虚拟机（JVM）负责管理内存，开发人员无需手动分配和释放内存。
- **异常处理**：Java 提供了强大的异常处理机制，使程序能够处理运行时错误。
- **多线程支持**：Java 支持多线程编程，允许程序并发执行多个任务。
- **丰富的类库**：Java 提供了丰富的类库，开发人员可以利用这些类库快速开发应用程序。
---
### 1.2 解释Java程序的编译和运行过程
Java 程序的编译和运行过程包括以下几个步骤：
1. **编写源代码**：使用文本编辑器或集成开发环境（IDE）编写 Java 源代码文件（.java 文件）。
2. **编译源代码**：使用 Java 编译器（javac）将源代码编译为字节码文件（.class 文件）。
3. **运行字节码**：使用 Java 虚拟机（JVM）运行编译后的字节码文件。
4. **加载类**：JVM 加载字节码文件，并在内存中创建类的实例。
5. **执行程序**：JVM 执行字节码指令，完成程序的运行。
6. **垃圾回收**：JVM 自动管理内存，回收不再使用的对象占用的内存空间。
7. **结束程序**：程序执行完毕后，JVM 结束程序的运行。
8. **输出结果**：程序的输出结果显示在控制台或指定的输出设备上。
---
一张图先印在脑子里
```
源码 Hello.java →【javac 编译】→ 字节码 Hello.class →【java 运行】→ 机器码（JIT 后）
```
三句话记住核心
1. **javac** 只做一件事：把 `.java` 人类源码翻译成 `.class` 字节码（中立、跨平台）。  
2. **java** 启动 JVM → 加载 `.class` → 字节码校验 → 解释执行 + 热点代码 JIT 成本地机器码。  
3. 不同操作系统装不同的 **JVM**，所以同一份 `.class` 文件能在 Windows/Mac/Linux 上跑，即“一次编译，到处运行”。

十行命令全程肉眼可见
```bash
# 1. 写源码
cat > Hello.java <<'EOF'
public class Hello {
    public static void main(String[] args) {
        System.out.println("compile once, run anywhere");
    }
}
EOF

# 2. 编译：源码→字节码
javac Hello.java      # 生成 Hello.class（二进制，可用 hexdump 看）

# 3. 运行：JVM 装载并执行
java Hello            # 注意后面不带 .class
```
输出：
```
compile once, run anywhere
```

细节放大镜（面试常问）
| 阶段 | 关键文件/组件 | 做了什么 |
|---|---|---|
| 编译期 | `javac` | 词法分析 → 语法树 → 语义分析 → 生成字节码指令 |
| 类装载 | `ClassLoader` | 加载 `.class` → 创建 Class 对象 → 方法区/元空间存类型信息 |
| 字节码校验 | `Bytecode Verifier` | 检查跳转到非法地址、操作数栈溢出等，防止恶意代码 |
| 执行引擎 | 解释器 + JIT (HotSpot C1/C2) | 先解释执行，热点代码（默认 1 万次调用）编译成本地机器码并缓存 |
| 垃圾回收 | GC 线程 | 回收堆上不再可达的对象，让程序员不用手动 free |

动手验证 JIT 的存在
```bash
java -XX:+PrintCompilation Hello
```
能看到类似：
```
    87    1       3       java.lang.String::hashCode (56 bytes)
```
即热点方法被即时编译成高效机器码。

常见误区提醒
- **误区 1**：Java 是“纯解释”执行。  
  → 错！热点代码会被 JIT 编译，速度与 C++ 接近。  
- **误区 2**：`javac` 把代码直接编译成机器码。  
  → 错！`javac` 只到字节码，机器码是 JVM 运行时按需生成的。  
- **误区 3**：运行时必须带着源码 `.java`。  
  → 错！只需要 `.class` 或打包后的 `.jar`。

一张命令速查表（保存备用）

| 任务 | 命令 |
|---|---|
| 编译单个文件 | `javac Hello.java` |
| 编译并指定输出目录 | `javac -d out Hello.java` |
| 运行类 | `java -cp out Hello` |
| 打包 | `jar cf hello.jar -C out .` |
| 运行 jar | `java -jar hello.jar` （需 jar 内指定 `Main-Class`） |
| 查看字节码 | `javap -c Hello` |
| 查看 JIT 编译 | `java -XX:+PrintCompilation Hello` |
---
### 1.3 比较 Java 与 C++ 的主要区别
| 特性 | Java | C++ |
|---|---|---|
| 内存管理 | 自动垃圾回收（JVM 管理内存） | 手动内存管理（需 malloc/free） |
| 平台依赖性 | 跨平台（一次编译，到处运行） | 平台相关（需针对不同平台编译） |
| 编译方式 | 编译成字节码，由 JVM 解释执行或 JIT 编译成本地机器码 | 编译成本地机器码 |
| 指针支持 | 不支持指针，使用引用 | 支持指针操作 |
| 多继承 | 不支持类的多继承，支持接口多继承 | 支持类的多继承 |
| 运行时性能 | 较高（JIT 优化） | 通常较高（直接机器码执行） |
| 标准库 | 丰富的标准类库 | 丰富的标准模板库（STL） |
| 异常处理 | 强制异常处理机制 | 可选异常处理机制 |
| 多线程支持 | 内置多线程支持 | 通过库支持多线程 |
| 编译器 | javac | g++, clang++ |
---


内存管理：有没有“垃圾回收”
| 维度 | Java | C++ |
|---|---|---|
| 谁来回收 | 自动 GC（Garbage Collector） | 程序员自己 `new`/`delete` 或智能指针 |
| 写代码感觉 | 只管 `new`，不管 `free` | 必须配对，否则内存泄漏/悬空指针 |
| 运行代价 | 停顿式 GC 带来微小延迟 | 无 GC 停顿，但可能野指针崩溃 |

一句话总结：  
Java 像“保洁阿姨每天帮你倒垃圾”；C++ 像“自己做饭自己洗碗，洗不干净就招蟑螂”。

面向对象模型：有没有“真正的类”
| 维度 | Java | C++ |
|---|---|---|
| 基本类型 | `int/boolean/char` 不是对象 | `int/bool/char` 就是普通内存值 |
| 多态机制 | 默认虚方法（virtual） | 需手动加 `virtual`，否则静态绑定 |
| 多重继承 | 类只能单继承，接口可多继承 | 类可多继承，带来菱形问题（需 virtual 基类） |
| 运行时类型 | 反射随时拿到 `Class<?>` | 只有虚表，RTTI 有限且需开启编译器选项 |

一句话总结：  
Java 把“面向对象”写进 DNA，连数组都是对象；C++ 既能面向对象也能面向过程，还能面向汇编。

跨平台方式：编译一次 vs 每个平台编一次
| 维度 | Java | C++ |
|---|---|---|
| 产出文件 | `.class` 字节码 | 机器码可执行文件/动态库 |
| 运行依赖 | 目标机器装对应 JVM | 目标机器无需额外运行时，但可能要装 VC++ redist |
| 性能 | 先解释后 JIT，峰值≈C++ 90% | 编译期极致优化，可内联汇编 |
| 移植成本 | 最低，同一份 jar 到处跑 | 需重新编译，宏/条件编译处理平台差异 |

一句话总结：  
Java 带着“翻译机（JVM）”出差；C++ 提前把当地话说好，换城市就重学方言。

2 个常考差异（面试加料）
   
指针 vs 引用  
   C++ 有指针运算、`int* p++` 可以直接窜内存；Java 只有“安全引用”，不能做任何地址运算，杜绝野指针。  

异常机制  
   Java 必检异常（checked exception）强迫方法签名声明；C++ 异常任意抛，不声明也能编译通过。

---
## 2. Java 开发环境
- JDK（Java Development Kit） 是 Java 开发的基础工具包，包含了编译、调试、运行等必要的工具。(包含javac、java、javadoc、jar、jdb、javap-反编译器显示class文件)
- JRE（Java Runtime Environment） 是 Java 运行时环境，包含了 JVM 和 Java 标准类库。
- JVM（Java Virtual Machine） 是 Java 虚拟机，负责执行 Java 字节码，实现跨平台运行。（字节码执行、内存管理、垃圾回收、安全管理、异常处理）
- IDEA（IntelliJ IDEA） 是 Java 开发的集成开发环境（IDE），提供了代码编辑、调试、构建等功能。
---
## 3. JVM内存结构
JVM 内存结构主要包括以下几个部分：
- 方法区（Method Area）：存储类信息、静态变量、常量池等。
- 堆内存（Heap）：存储对象实例和数组，是垃圾回收的主要区域。
- 栈内存（Stack）：存储方法调用、局部变量等。
- 本地方法栈（Native Method Stack）：存储本地方法调用。
- 程序计数器（Program Counter Register）：记录当前线程执行的字节码指令地址。
> 为什么需要jvm：实现跨平台运行、自动内存管理、提供安全沙箱、优化程序执行、统一的异常处理机制。
