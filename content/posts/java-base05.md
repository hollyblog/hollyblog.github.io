---
title: "Java 面向对象基础"
date: 2021-01-09T21:18:05+08:00
draft: false
description: "Java 面向对象基础：类和对象、方法、构造函数、访问修饰符、this关键字、String字符串、package包。"
tags: ["Java", "面向对象基础"]
categories: ["Java"]
---
Java 面向对象基础: 类和对象、方法、构造函数、访问修饰符、this关键字、String字符串、package包。

## 类和对象
### 类的基本结构
属性（实例变量）、构造方法、实例方法、静态成员。
- 类是对象的模版，定义了对象的属性和行为；
- 对象是类的实例，通过new关键字创建；
- 构造方法用于初始化对象，可以重载；
- 实例变量属于对象，静态变量属于类；
- 封装通过私有属性和公共方法保护数据的安全；
- getter和setter方法提供受控的数据访问；
- 良好的类设计遵循单一职责原则；
- 合理使用访问修饰符控制成员的可见性。

## Java 方法
为什么需要方法？
- 代码复用：避免重复编写相同的代码；
- 模块化：将复杂问题分解为简单的子问题；
- 易于维护：修改功能时只需要修改对应的方法；
- 提高可读性：通过方法名清晰表达代码意图。
### 参数传递机制
- 传递基本数据类型时，方法接收的是实参值的副本，方法内对参数的修改不会影响原始变量的值；
- 传递引用数据类型时，方法接收的时对象引用的副本，通过这个引用可以修改对象的内容，但不能改变原始引用指向的对象。
## Java 方法重载
重载必须满足以下条件之一：
- 参数个数不同
- 参数类型不同
- 参数顺序不同
- 仅仅返回值类型不同不能构成方法重载；
  

## Java 构造函数
构造函数是一种特殊的方法，用于创建和初始化对象。它的名称与类名相同，没有返回值类型（包括void）。
- 构造函数在对象创建时自动调用；
- 可以重载多个构造函数，根据参数不同初始化对象；
- 如果没有定义构造函数，编译器会自动提供一个默认构造函数；
- 构造函数可以调用其他构造函数，使用this关键字实现。

### 构造函数链式调用
- 使用this()调用同类中的其他构造函数；
- 必须放在构造函数的第一行；
- 只能在构造函数中调用，不能在普通方法中调用。
- 参数匹配：调用时必须与构造函数的参数列表匹配，否则会编译错误。
- 避免循环调用：构造函数不能直接或间接地调用自身，否则会导致无限循环。
- 代码复用：通过构造函数链式调用，避免重复初始化代码。
### 构造函数参数验证
- 防止创建无效状态的对象
- 提供清晰的错误信息
- 遵循“快速失败”原则，在参数无效时立即抛出异常，而不是在后续代码中处理无效情况。
- 提高代码的健壮性
### Builder模式与构造函数
> 建造者模式---把复杂对象的创建过程拆解成“可选步骤”，每个步骤都返回当前对象的引用，最后调用build()方法创建对象。（最后一次性产出完整产品）
> 适用场景：适合复杂不可变的对象（线程安全）
> - 当一个对象有多个可选参数，而不是所有参数都是必填的时；
> - 当对象的创建过程比较复杂，包含多个步骤时；
> - 当需要创建不同配置的对象时，例如不同的用户角色、不同的产品类型等。

> 角色：
> - product类：要创建的复杂对象
> - builder类：包含创建product对象的方法和设置属性的方法(定义组装步骤的接口/静态内部类)
> - ConcreteBuilder：真正执行组装，保存中间状态
> - director类：负责调用builder的方法，按照一定的顺序组装对象。
  
- 适用于参数较多或可选参数的情况
- 提供了一种更灵活的初始化对象的方式
- 可以一步一步地设置对象的属性，而不是在构造函数中一次性设置所有属性
- 可以在构建过程中添加额外的逻辑，例如验证参数的有效性
- 可以隐藏对象的内部表示，只暴露必要的方法来设置属性
- 可以在构建完成后返回一个不可变的对象，确保对象的状态不会被修改
```java
public class User {
    private String name;
    private int age;

    private User(Builder builder) {
        this.name = builder.name;
        this.age = builder.age;
    }

    public static class Builder {
        private String name;
        private int age;

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setAge(int age) {
            this.age = age;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }
}
User user = new User.Builder()
        .setName("张三")
        .setAge(18)
        .build();
```
### 防御性复制
> 防御性复制是指在创建对象时，对传入的参数进行复制，而不是直接引用。适用场景：
> - 当对象的属性是可变的，而我们不希望外部代码直接修改对象的属性时。
> - 当对象的属性是不可变的，但是我们需要在对象外部修改属性时；
> - 当对象的属性是其他对象的引用，而我们不希望外部代码直接修改引用时。

宁可多new一次，也不把命运交到别人手里。
> 防御性复制的实现方式：
> - 深拷贝：创建一个新的对象，将原对象的所有属性值复制到新对象中。
> - 浅拷贝：创建一个新的对象，将原对象的引用复制到新对象中。
> 无论采用深拷贝还是浅拷贝，都需要注意循环引用的问题，避免无限循环。
## Java 访问修饰符
访问控制的重要性：
- 保护类的内部实现细节
- 提供清晰的公共接口
- 防止不当的外部访问
- 支持代码的模块化设计

Java 提供了四种访问修饰符，用于控制类、方法和属性的可见性：
- public：公共的，任何类都可以访问；
- protected：受保护的，同一个包中的类或者同包和不同包的子类可以访问；
- default（也称为包级可见性）：没有显式修饰符，同一个包中的类可以访问；
- private：私有的，只有同一个类中的方法可以访问。
> 推荐做法：
> - 最小权限原则：使用最严格的访问修饰符
> - 字段私有化：将字段设为private，通过getter/setter访问
> - 接口公开：公共方法提供清晰的接口
> - 工具方法：使用public static 修饰工具方法
> - 继承支持：使用protected支持子类扩展
> - 包内协作：使用默认访问权限进行包内协作

> ⚠️注意事项
> - 构造方法访访问权限：构造方法的访问权限决定了类的实例化方法
> - 静态成员访问：静态成员的访问权限影响类级别的访问
> - 内部类访问：内部类可以访问外部类的所有成员，包括private
> - 接口成员：接口中的方法默认是public，字段默认是public static final。

> ❗️设计建议（访问修饰符的选择影响代码的可维护性和扩展性）
> - api设计：公共api应该稳定，避免频繁修改public接口
> - 版本兼容：修改public成员可能破坏向后兼容性
> - 测试友好：考虑测试需求，适当提供包访问权限
> - 文档说明：为public成员提供详细的文档说明

## Java this关键字
> ❗️this关键字的核心作用
> - 对象引用：this代表当前正在执行方法的对象
> - 消除歧义：当成员变量和参数同名时，用this区分
> - 构造方法调用：使用this()调用同一个类的其他构造方法
> - 返回this实现方法的链式调用

> ⚠️注意事项
> - 静态上下文：静态方法和静态代码块中不能使用this
> - 构造方法调用：this()必须是构造方法的第一句
> - 循环调用：避免构造方法之间形成循环调用
> - 性能考虑：this引用本身没有性能开销
> - 代码风格：团队内保持一致的this使用风格

this关键字与其他概念super、static的区别

| 概念   | 作用           | 使用场景                   | 示例               |
|--------|----------------|----------------------------|--------------------|
| this   | 引用当前对象   | 访问当前对象的成员变量和方法 | this.name = name   |
| super  | 引用父类       | 继承关系中                 | super.method()     |
| static | 类级别的成员   | 不依赖对象实例             | static int count   |
## Java String字符串
核心特性
- 不可变性：string对象一旦创建，内部不可修改
- 字符串池：jvm维护一个字符串常量池来优化内存使用
- 线程安全：由于不可变性，string天然线程安全
- 丰富的api：提供大量字符串操作方法

字符串创建方法
```java
// 使用字面量创建
String str1 = "hello"; // 字符串常量池
String str2 = "hello";
System.out.println(str1 == str2);//true
//使用构造方法创建
String str3 = new String("Hello");
String str4 = new String("Hello");
//每次都创建新对象
System.out.println(str3 == str4);//false
System.out.println(str3.equals(str4));//true
//使用字符数组创建
char[] chars = {'H','e','l','l','o'};
String str5 = new String(chars);
System.out.println(str5);//Hello
```
常用方法
```java
String str = " Hello World ";
//长度
int length = str.length(); // 13
//判断是否为空
boolean isEmpty = str.isEmpty(); // false
boolean isBlank = str.isBlank(); // false
//安全判空方法
if(str != null && !str.isEmpty()){
    //处理字符串
}
//字符访问
char ch = str.charAt(0); // ' '
//查找
int index1 = str.indexOf("World"); // 7
int index2 = str.lastIndexOf("World"); // 7
//字符串比较
boolean equals = str.equals(" Hello World "); // true
boolean equalsIgnoreCase = str.equalsIgnoreCase(" hello world "); // true
int compare = str.compareTo(" Hello Java "); // >0
//包含判断
boolean contains = str.contains("World"); // true
boolean startsWith = str.startsWith(" Hello"); // true
boolean endsWith = str.endsWith("World "); // true
//子字符串
String sub = str.substring(1, 6); // "Hello"
//替换
String replaced = str.replace("World", "Java"); // " Hello Java "
String replacedAll = str.replaceAll(" ", "_"); // "_Hello_World_"
//转换大小写
String upper = str.toUpperCase(); // " HELLO WORLD "
String lower = str.toLowerCase(); // " hello world "
//首字母大写自定义方法
public static String capitalize(String input) {
    if (input == null || input.isEmpty()) {
        return input;
    }
    return input.substring(0, 1).toUpperCase() + input.substring(1).toLowerCase();
}
//去除空白
String trimmed = str.trim(); // "Hello World"
String stripped = str.strip(); // "Hello World"
//拆分
String[] parts = str.trim().split(" "); // ["Hello", "World"]
//连接
String joined = String.join("-", "Hello", "World"); // "Hello-World"
//使用StringBuilder进行字符串拼接
StringBuilder sb = new StringBuilder();
sb.append("Hello");
sb.append(" ");
sb.append("World");
String result = sb.toString(); // "Hello World"
```
### 字符串池
字符串池是jvm在堆内存中维护的一个特殊区域，用于存储字符串字面量，`String str = "hello"`，避免重复创建相同的字符串对象，从而节省内存。
```java
String str1 = "hello"; // 存储在字符串池中
String str2 = "hello"; // 复用字符串池中的对象
System.out.println(str1 == str2); // true
//new关键字创建的字符串不在字符串池中
String str3 = new String("hello");
System.out.println(str1 == str3); // false
//将new创建的字符串放入字符串池
String str4 = str3.intern();
System.out.println(str1 == str4); // true
```
线程安全：字符串对象是线程安全的，因为字符串对象是immutable的，字符串对象本身是线程安全的，字符串对象中的内容是线程不安全的。
### String vs StringBuilder vs StringBuffer
| 特性               | String                     | StringBuilder              | StringBuffer               |
|--------------------|----------------------------|----------------------------|----------------------------|
| 可变性             | 不可变                     | 可变                       | 可变                       |
| 线程安全           | 线程安全                   | 非线程安全                 | 线程安全
| 性能               | 拼接效率低                 | 拼接效率高                 | 拼接效率较高               |
| 使用场景           | 少量字符串操作(字符串不变)             | 大量字符串拼接（单线程频繁修改）             |多线程频繁修改
| 内存消耗           | 较高                       | 较低                       | 较低
| 方法               | 提供丰富的字符串操作方法   | 提供append、insert等方法     | 提供append、insert等方法     |

```java
// String 示例
String str = "Hello";
str += " World"; // 创建新对象，效率低
// StringBuilder 示例
StringBuilder sb = new StringBuilder("Hello");
sb.append(" World"); // 修改原对象，效率高
String result = sb.toString();
// StringBuffer 示例
StringBuffer sbuf = new StringBuffer("Hello");
sbuf.append(" World"); // 线程安全的修改
String result2 = sbuf.toString();
```
最佳实践
- 使用String处理少量字符串操作，避免频繁修改；
- 使用StringBuilder进行大量字符串拼接，提升性能；
- 使用StringBuffer在多线程环境下进行字符串修改，确保线程安全；
- 使用字面量创建字符串，优先使用“hello”，而不是new String("hello")，以利用字符串池优化内存。
- 使用equals()方法比较字符串内容，避免使用==比较引用地址。
- 频繁修改时使用StringBuilder或StringBuffer，避免创建大量临时对象。
- 及时进行空值检查，防止NullPointerException异常。
- 使用String.format()或MessageFormat进行复杂字符串**格式化**，提升代码可读性。
### 为什么 String 是不可变的？
- 安全性：不可变对象更容易保证数据的一致性和完整性，防止外部代码修改对象状态，防止字符串内容被意外修改。
- 线程安全：不可变对象天然线程安全，多个线程可以安全地访问同一个String对象而无需同步。
- 性能优化：不可变对象可以被缓存和共享，减少内存开销
- 字符串池优化：相同内容的字符串可以共享同一个对象
- 哈希码缓存：不可变对象的哈希码可以缓存，提高哈希表的性能。String的hashCode()方法只需要一次计算，会缓存计算结果，避免重复计算。
### 使用时候使用 StringBuilder 
- 需要频繁修改字符串内容
- 在循环中进行字符串拼接
- 构建大型字符串
- 单线程环境下的字符串操作
### String.intern() 方法的作用是什么
- 将字符串对象加入到字符串池中
- 如果池中已经存在相同内容的字符串，返回池中的引用
- 如果池中不存在，将当前字符串加入池并返回引用
- 优化内存使用，减少重复字符串对象，但要谨慎使用，避免内存泄漏

> ⚠️注意事项
> - 空值处理：始终检查字符串是否为null，避免NullPointerException异常。
> - 性能考虑：频繁修改字符串时，优先使用StringBuilder或StringBuffer，避免创建大量临时对象。
> - 内存使用：谨慎使用intern()方法，避免过度占用字符串池内存。
> - 字符编码：处理字符串时，注意字符编码问题，确保正确转换和存储。处理文件或网络数据时，注意字符编码问题。
> - 国际化支持：使用Unicode字符集，支持多语言字符串处理。
> - 正则表达式：使用split()和replaceAll()等方法时，注意正则表达式的语法和性能影响。
## Java package包
package 用于定义Java源文件的命名空间，防止命名冲突。
- 包声明：使用package关键字声明包名，包名由多个单词组成，单词之间用点隔开。
- 目录结构：包名对应文件系统中的目录结构，源文件存放在对应的目录下。    
- 域名反向形式命名
- 如果没有package语句，类属于默认包（default package）
- 访问修饰符：包级访问修饰符，默认是public

### 访问修饰符对比
修饰符 | 同一类 | 同一包 | 子类 | 不同包
-- | -- | -- | -- | --  
public | √ | √ | √ | √
protected | √ | √ | √ | ×
default | √ | √ | × | ×
private | √ | × | × | ×

