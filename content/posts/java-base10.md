---
title: "Java 输入输出"
date: 2021-01-09T22:22:05+08:00
draft: false
description: "Java 输入输出：IO流概述、字节流、字符流、文件操作、序列化。"
tags: ["Java", "Java输入输出"]
categories: ["Java"]
---
Java 输入输出：IO流概述、字节流、字符流、文件操作、序列化。


## IO流概述
Java IO流概述：IO流是Java中用于处理输入输出操作的机制。它将外部设备（如文件、网络）与Java程序连接起来，实现数据的读取和写入。流是一种抽象概念。它提供了一种统一的方式来处理不同类型的数据源和目标，如文件、内存、网络等。通过流的方式进行输入输出，数据被当作无结构的字节序列或字符序列。通过流的方式，我们可以以一致的方法读取和写入数据。

IO流特点：
1. 流是一种有序的字节序列。
2. 流可以是输入流（读取数据）或输出流（写入数据）。
3. 流可以是字节流（处理二进制数据）或字符流（处理文本数据）。
4. 流可以是节点流（直接操作数据源或目标）或处理流（在节点流基础上进行封装，提供额外的功能）。
5. 流的操作是顺序的，一次只能处理一个字节或字符。
6. 流的操作可以是阻塞的，即等待数据准备就绪或空间可用。
7. 流的操作可以抛出IOException异常，需要进行异常处理。
8. 流的操作完成后，需要关闭流以释放系统资源。
9. 统一性：所有IO操作都通过流的方式进行
10. 抽象性：提供了统一的接口，屏蔽了底层实现细节
11. 可扩展性：通过装饰器模式可以灵活组合功能
12. 高效性：提供了缓冲机制提高IO性能。

### IO流分类
1. 按照数据单位分类
   - 字节流：以字节（8位）为单位进行读写操作，适用于处理二进制数据。
   - 字符流：以字符（16位）为单位进行读写操作，适用于处理文本数据。
2. 按照流的方向分类
   - 输入流：从外部设备读取数据到Java程序。InputStream\Reader
   - 输出流：从Java程序写入数据到外部设备。OutputStream\Writer
3. 按照流的功能（角色）分类
   - 节点流：直接操作数据源或目标，如文件流、数组流等。FileInputStream\FileReader\FileOutputStream\FileWriter
   - 处理流：在节点流基础上进行封装，提供额外的功能，如缓冲流、转换流等。BufferedInputStream\BufferedOutputStream\BufferedReader\BufferedWriter
4. 按照流的使用场景分类
   - 字节流：适用于处理二进制数据，如图片、视频、音频等。
   - 字符流：适用于处理文本数据，如普通文本文件、配置文件等。
### 流的继承体系
| 基类 | 类型 | 常用实现类 | 主要用途 |
| --- | --- | --- | --- |
| InputStream | 字节输入流 | FileInputStream、BufferedInputStream | 从文件或其他数据源读取字节数据 |
| OutputStream | 字节输出流 | FileOutputStream、BufferedOutputStream | 将字节数据写入文件或其他目标 |
| Reader | 字符输入流 | FileReader、BufferedReader | 从文件或其他数据源读取字符数据 |
| Writer | 字符输出流 | FileWriter、BufferedWriter | 将字符数据写入文件或其他目标 |

### 装饰器模式在IO流中的应用
装饰器模式是一种结构型设计模式，它允许在不改变原有对象结构的情况下，动态地给对象添加新的功能。在IO流中，装饰器模式被广泛应用于添加额外的功能，如缓冲、转换、加密等。通过装饰器模式，我们可以在不修改原有流的情况下，灵活地组合不同的功能。
```java
//基础流（节点流）
FileInputStream fileStream = new FileInputStream("file.txt");
// (第一层装饰）添加缓冲功能
BufferedInputStream bufferedStream = new BufferedInputStream(fileStream);
//（第二层装饰）添加数据类型读取功能
DataInputStream dataStream = new DataInputStream(bufferedStream);
//现在可以高效地读取各种数据类型
int number = dataStream.readInt();
double doubleValue = dataStream.readDouble();
String text = dataStream.readUTF();

```
装饰器模式的优势
- 可以动态地给对象添加功能
- 通过组合而非继承实现功能扩展
- 符合开闭原则，易于扩展
- 避免了类爆炸问题

### 选择合适的流类型
- 处理文本数据选择字符流
- 处理二进制数据选择字节流
- 频繁读写使用缓冲流
- 需要类型转换使用数据流

## 字节流
字节流特点
- 处理二进制数据：适合处理图片、音频、视频等二进制文件
- 以字节为单位：每次读写一个或多个字节
- 通用性强：可以处理任何类型的文件
- 效率较高：直接操作字节，没有编码转换开销

### 字节流的主要实现类
- FileInputStream：从文件读取字节（针对java程序是输入流）
- FileOutputStream：向文件写入字节（针对java程序是输出流）
- BufferedInputStream：添加缓冲功能，提高读取效率
- BufferedOutputStream：添加缓冲功能，提高写入效率
- DataInputStream：添加数据类型读取功能
- DataOutputStream：添加数据类型写入功能
- ByteArrayInputStream:字节数组输入流，从字节数组读取数据（不涉及到磁盘io文件操作，在内存中操作，适合临时数据处理和数据转换）
- ByteArrayOutputStream:字节数组输出流，向字节数组写入数据（不涉及到磁盘io文件操作，在内存中操作，适合临时数据处理和数据转换）

### 字节流类型比较
| 流类型 | 适用场景 | 性能特点 | 使用建议 |
| --- | --- | --- | --- |
| FileInputStream | 从文件读取字节 | 效率高，直接操作字节 | 适用于处理二进制文件(小文件512字节--4kb) |
| FileOutputStream | 向文件写入字节 | 效率高，直接操作字节 | 适用于处理二进制文件 |
| BufferedInputStream | 添加缓冲功能，提高读取效率 | 效率高，减少磁盘io次数 | 适用于频繁读取操作（大文件8kb-64kb） |
| BufferedOutputStream | 添加缓冲功能，提高写入效率 | 效率高，减少磁盘io次数 | 适用于频繁写入操作 |
| DataInputStream | 添加数据类型读取功能 | 方便读取各种数据类型 | 适用于需要读取不同数据类型的场景 |
| DataOutputStream | 添加数据类型写入功能 | 方便写入各种数据类型 | 适用于需要写入不同数据类型的场景 |
| ByteArrayInputStream | 从字节数组读取数据 | 效率高，在内存中操作 | 适用于临时数据处理和数据转换 |
| ByteArrayOutputStream | 向字节数组写入数据 | 效率高，在内存中操作 | 适用于临时数据处理和数据转换 |


## 字符流
字符流特点
- 处理文本数据：适合处理普通文本文件、配置文件等
- 以字符为单位：每次读写一个或多个字符
- 编码转换：自动处理字符编码转换，无需手动处理
- 效率较低：相对于字节流，每次读写操作需要进行编码转换

### 字符流的主要实现类
- FileReader：从文件读取字符（针对java程序是输入流）
- FileWriter：向文件写入字符（针对java程序是输出流）
- BufferedReader：添加缓冲功能，提高读取效率
- BufferedWriter：添加缓冲功能，提高写入效率
- InputStreamReader：将字节流转换为字符流（针对java程序是输入流）
- OutputStreamWriter：将字符流转换为字节流（针对java程序是输出流）
- PrintWriter：方便打印输出，自动处理换行符,自动刷新功能。

### 字符流最佳实践
- 选择合适的字符编码：根据实际情况选择合适的字符编码，避免编码转换问题。
- 处理异常：在字符流操作中，需要注意处理异常，如文件不存在、编码转换错误等。
- 关闭流：在使用完字符流后，需要及时关闭流，释放资源。
- 缓冲区大小：根据实际情况调整缓冲区大小，平衡读写效率和内存占用。
- 考虑使用try-with-resources语句自动关闭流，避免资源泄漏。
- 重要数据及时刷新缓冲区

### 什么时候使用字符流，什么时候使用字节流
- 处理文本数据选择字符流（字符流能自动处理字符编码，更适合文本操作）
- 处理二进制数据选择字节流（字节流直接操作字节，没有编码转换开销，更适合处理二进制文件，图片、视频、音频等）
### 如何处理中文乱码问题
使用InputStreamReader和OutputStreamWriter处理中文乱码问题
- 读取文件时，使用InputStreamReader指定字符编码，如new InputStreamReader(fileStream, "UTF-8")
- 写入文件时，使用OutputStreamWriter指定字符编码，如new OutputStreamWriter(fileStream, "UTF-8")
### BufferReader的缓冲区大小是多少
默认缓冲区大小是8192字节（8kb），合理的缓冲区大小能显著提高io性能。


## File文件操作
### 创建file文件
file对象可以表示文件或目录，创建file对象并不会在文件系统中创建实际的文件或目录。
需要通过file对象的方法来创建实际的文件或目录，如createNewFile()、mkdir()、mkdirs()等。
```java
// 创建文件对象
File file = new File("test.txt");
try {
    file.createNewFile();
} catch (IOException e) {
    e.printStackTrace();
}
//使用路径创建
// 使用路径创建文件对象
File file2 = new File("testDir/test.txt");
try {
    file2.createNewFile();
} catch (IOException e) {
    e.printStackTrace();
}
```
```java
//创建目录
File dir = new File("testDir");
dir.mkdir();
```
```java
//创建多级目录
File dirs = new File("testDir1/testDir2");
dirs.mkdirs();
```
### 文件基本操作
```java
File file = new File("test.txt");
//创建一个新的空文件
file.createNewFile();
//判断文件是否存在
boolean exists = file.exists();
//判断是否是文件
boolean isFile = file.isFile();
//判断是否是目录
boolean isDir = file.isDirectory();
//判断是否可读
boolean isReadable = file.canRead();
//判断是否可写
boolean isWritable = file.canWrite();
//遍历目录中的所有文件
File[] files = dir.listFiles();
//遍历目录中的所有文件和子目录
for (File f : files) {
    if (f.isFile()) {
        System.out.println("文件：" + f.getName());
    } else if (f.isDirectory()) {
        System.out.println("目录：" + f.getName());
    }
}
//获取文件名称
String name = file.getName();
//获取文件路径
String path = file.getPath();
//获取文件绝对路径
String absPath = file.getAbsolutePath();
//获取文件父目录
File parentDir = file.getParentFile();
//文件大小
long size = file.length();
//文件最后修改时间
long lastModified = file.lastModified();
//删除文件
boolean deleted = file.delete();
```
> File.separator
> - 文件分隔符
> - 在不同操作系统中，文件路径的分隔符是不同的，如Windows使用反斜杠\，而Unix/Linux使用正斜杠/。
> - 为了跨平台兼容性，建议使用File.separator来表示文件路径分隔符。
> ```java
> //例如：
> String filePath = "testDir" + File.separator + "test.txt";
> //在Windows中，filePath为"testDir\test.txt"
> //在Unix/Linux中，filePath为"testDir/test.txt"
> ```

> Paths.get()
> - 用于创建Path对象，Path对象表示文件路径。
> - 可以接受多个字符串参数，每个参数表示路径的一部分，用File.separator分隔。
> - 可以跨平台兼容，自动处理不同操作系统的文件路径分隔符。
> ```java
> //例如：
> Path path = Paths.get("testDir", "test.txt");
> //在Windows中，path为"testDir\test.txt"
> //在Unix/Linux中，path为"testDir/test.txt"
> ```

> ⚠️注意
> - 对于大量文件操作，建议使用NIO.2(java.nio.file包)，它提供了更好的性能和更丰富的功能。对于简单的文件操作，传统的file类也提供了丰富的方法。
> - 文件操作涉及到系统资源，务必注意异常处理和资源释放。在多线程环境下进行文件操作时，要考虑线程安全问题。删除文件或目录前，确保没有其他程序正在使用。
### File类 vs NIO
|特性 | File类 | NIO.2（java.nio.file包） |
|--|--|--|
|性能 | 一般 | 较高 |
|功能 | 基本 | 丰富 |
|跨平台 | 是 | 是 |
|线程安全 | 否 | 是 |
|异常处理 | 简单返回boolean | 复杂抛出异常 |
|资源释放 | 手动 | 自动 |
| 符号链接支持 |不支持|支持|
|文件属性|基本|详细|

### 符号链接
符号链接（Symbolic Link）是一种特殊的文件，它指向另一个文件或目录。符号链接可以跨文件系统，而硬链接只能在同一文件系统中。
NIO.2提供了对符号链接的支持，可以使用Files.createSymbolicLink()方法创建符号链接。
```java
//创建符号链接
Path link = Files.createSymbolicLink(Paths.get("link.txt"), Paths.get("target.txt"));
```
### 文件属性
NIO.2提供了丰富的文件属性操作方法，如获取文件大小、最后修改时间、权限等。可以使用Files.readAttributes()方法读取文件属性。
```java
//读取文件属性
BasicFileAttributes attrs = Files.readAttributes(Paths.get("test.txt"), BasicFileAttributes.class);
//获取文件大小
long size = attrs.size();
//获取最后修改时间
Instant lastModified = attrs.lastModifiedTime();
//获取权限
PosixFilePermissions permissions = Files.getPosixFilePermissions(Paths.get("test.txt"));
```

### File.delete()返回false怎么办
- 检查文件是否存在
- 检查文件是否被其他程序占用
- 检查文件是否为只读
- 检查文件是否为系统文件
- 检查文件是否为隐藏文件
- 检查文件是否为目录，确保目录为空
- 检查文件是否为符号链接
- 检查文件是否为挂载点
- 检查文件是否为设备文件
- 检查文件是否为管道文件
- 检查文件是否为套接字文件
- 检查文件是否为字符设备文件
- 检查文件是否为块设备文件
- 检查文件是否为目录符号链接
- 检查文件是否为文件符号链接
- 检查文件是否为挂载点符号链接
- 检查文件是否为设备符号链接
- 检查文件是否为管道符号链接
- 检查文件是否为套接字符号链接
- 检查文件是否为字符设备符号链接
- 检查文件是否为块设备符号链接
### 如何处理文件编码问题
使用InputStreamReader和OutputStreamWriter处理文件编码问题。或者使用NIO的Charset类处理编码问题。
### 大文件操作如何优化
使用缓冲流、NIO的通道（Channel）和缓冲区（Buffer）进行大文件操作，或者分块处理大文件。
### 如何安全删除目录
先递归删除目录中的所有文件和子目录，最后删除目录本身。
### 练习建议
- 文件搜索工具：实现一个文件搜索工具，支持按照名称、大小、修改时间搜索
- 文件备份工具：实现一个文件备份工具，支持增量备份和全量备份。
- 文件管理器：实现一个简单的文件管理器，支持文件的复制、移动、删除、重命名等操作。
- 日志分析工具：实现一个简单的日志分析工具，支持按照时间、级别、内容搜索日志，统计日志文件的各种信息。


## 序列化
Java序列化是将对象的状态转换为字节流的过程，以便可以将对象保存到文件、数据库或通过网络传输。反序列化是相反的过程，将字节流转换回对象，恢复其状态。用于分布式系统、缓存和持久化存储等场景。

- 持久化存储：将对象转换为字节流，保存到文件或数据库中，以便后续恢复对象状态。
- 缓存机制：将对象转换为字节流，存储在缓存中，以提高访问速度。
- 网络传输：将对象转换为字节流，通过网络传输到远程节点，实现分布式系统中的通信。
- 深度复制：创建对象的完整副本，包括所有嵌套对象。

### Serializable 接口
Serializable 接口是Java中用于序列化的标记接口。实现了Serializable接口的类可以被序列化，即转换为字节流进行存储或传输。反序列化时，字节流会被转换回对象。

```java
import java.io.Serializable;
public class MyClass implements Serializable {
    private static final long serialVersionUID = 1L;
    //类的成员变量
    private int id;
    private String name;
    //构造方法
    public MyClass(int id, String name) {
        this.id = id;
        this.name = name;
    }
    //其他方法
    //...
}
```
> 注意：serialVersionUID 是用于序列化和反序列化的版本控制机制。如果类的 serialVersionUID 与序列化时的 serialVersionUID 不匹配，会抛出 InvalidClassException 异常。

### transient 关键字
transient 关键字用于标记类的成员变量，在序列化时会被忽略。这在某些场景下非常有用，例如密码、敏感信息等。
```java
import java.io.Serializable;
public class MyClass implements Serializable {
    private static final long serialVersionUID = 1L;
    //类的成员变量
    private int id;
    private transient String password;
    //构造方法
    public MyClass(int id, String password) {
        this.id = id;
        this.password = password;
    }
    //其他方法
    //...
}
```
> 注意：transient 关键字标记的成员变量在反序列化时会被初始化为默认值，例如 int 类型为 0，引用类型为 null。

### 常见问题
1. 忘记实现 Serializable 接口：如果类没有实现 Serializable 接口，尝试序列化时会抛出 NotSerializableException 异常。
2. 忘记添加 serialVersionUID：如果类没有添加 serialVersionUID 字段，尝试序列化时会抛出 InvalidClassException 异常。
3. 忘记处理 IOException：在序列化和反序列化过程中，可能会抛出 IOException 异常，需要进行适当的处理。
4. 忘记处理 ClassNotFoundException：在反序列化过程中，可能会抛出 ClassNotFoundException 异常，需要进行适当的处理。
5. 序列化大对象或者频繁序列化操作：使用BufferedStream,避免序列化不必要的字段。
6. 安全问题：反序列化不可信数据可能导致安全漏洞，例如反序列化攻击（如利用序列化的对象执行恶意代码），使用白名单机制。
7. 当父类没有实现 Serializable 接口时，子类可以实现 Serializable 接口吗？
> 可以。子类可以实现 Serializable 接口，在序列化时，父类的状态也会被序列化。但是父类必须有一个无参的构造器，在反序列化时，父类的无参构造器会被调用来初始化父类部分，如果父类没有无参构造器，会在反序列化时抛出 InvalidClassException 异常。
> 要自定义序列化过程，可以在类中实现 writeObject 和 readObject 方法。这两个方法分别在序列化和反序列化时被调用，用于自定义序列化和反序列化过程。
> 

### 序列化代替方案
- java原生的序列化机制
- JSON：将对象转换为 JSON 字符串，进行存储或传输。反序列化时，将 JSON 字符串转换回对象。**web api**
- XML：将对象转换为 XML 字符串，进行存储或传输。反序列化时，将 XML 字符串转换回对象。
- 协议缓冲区（Protocol Buffers）：Google 开发的一种二进制序列化格式，效率高，支持跨平台。
- Apache Avro : 是一种基于二进制的序列化格式，由 Apache 软件基金会开发。它支持动态类型，提供高效的序列化和反序列化操作。适合大数据场景。




