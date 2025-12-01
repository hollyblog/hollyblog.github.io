---
title: "Java 高级特性"
date: 2021-01-09T22:19:05+08:00
draft: false
description: "Java 高级特性：内部类和嵌套类、枚举类型（enum）、递归、反射、注解（annotation）、泛型（generics）。"
tags: ["Java", "Java高级特性"]
categories: ["Java"]
---
Java 高级特性：内部类和嵌套类、枚举类型（enum）、递归、反射、注解（annotation）、泛型（generics）。

## 内部类和嵌套类
内部类是定义在另一个类内部的类。嵌套类是指在一个类的内部定义的类，可以分为静态嵌套类和非静态嵌套类（即内部类）。内部类可以访问外部类的成员变量和方法，而静态嵌套类则不能。
- 成员内部类：定义在外部类的非静态类，可以访问外部类的所有成员；持有外部类的引用；不能定义静态成员（除常量）。
- 静态嵌套类：使用static修饰的类；只能访问外部类的静态成员；不持有外部类的引用；可以定义静态成员；可以独立于外部类对象存在。不会阻止外部类被垃圾回收。
- 局部内部类：定义在方法或代码块中的类；作用域仅限于定义它的方法或代码块；可以访问方法的final或effectively final变量。
- 匿名内部类：没有名字的内部类；通常用于简化代码，尤其是在实现接口或继承类时。适合简单的一次性实现，广泛用于事件处理和回调。

成员内部类示例：
```java
class Outer {
    private int outerField = 10;
    class Inner {
        void display() {
            System.out.println("Outer field: " + outerField);
        }
    }
}
// 使用成员内部类
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner();
inner.display();
outer.createInner();
``` 
静态嵌套类示例：
```java
class Outer {
    static class StaticNested {
        void display() {
            System.out.println("Static nested class");
        }
    }
}
// 使用静态嵌套类
Outer.StaticNested nested = new Outer.StaticNested();
nested.display();
```
局部内部类示例：
```java
class Outer {
    void method() {
        class LocalInner {
            void display() {
                System.out.println("Local inner class");
            }
        }
        LocalInner localInner = new LocalInner();
        localInner.display();
    }
}
// 使用局部内部类
Outer outer = new Outer();
outer.method();
LocalInner localInner = outer.new LocalInner();
localInner.display();
```
> ⚠️局部内部类只能访问final或事实上的final局部变量。这是因为局部变量在方法结束后会被销毁，而内部类可能在方法结束后仍然存在，因此只能访问那些不会改变的变量。

匿名内部类示例：
```java
interface Greeting {
    void sayHello();
}
// 使用匿名内部类
Greeting greeting = new Greeting() {
    @Override
    public void sayHello() {
        System.out.println("Hello from anonymous class!");
    }
};
greeting.sayHello();
```
匿名类使用场景
- 事件处理：gui编程中的事件监听器
- 回调函数：异步操作的回调实现
- 函数式接口：简单的函数式接口实现（java8之前）
- 一次性实现：只使用一次的简单实现

内部类类型对比

| 内部类类型 | 访问外部类成员 | 定义静态成员 | 创建对象 |
| --- | --- | --- | --- |
| 成员内部类 | 可以访问外部类的实例成员、静态成员、持有外部类引用、使用访问修饰符 | 不能定义静态成员变量和方法，不可以独立创建对象，不可以访问局部变量 | 创建对象时需要外部类对象 |
| 静态嵌套类 | 只能访问外部类的静态成员变量和方法，可以独立创建对象，可以访问修饰符 | 可以定义静态成员变量和方法 | 创建对象时不需要外部类对象 |
| 局部内部类 | 可以访问外部类实例成员、静态成员、持有外部类引用、可以访问局部变量 | 不能定义静态成员变量和方法，不能独立创建对象、不能使用访问修饰符| 创建对象时需要外部类对象 |
| 匿名内部类 | 可以访问外部类中的所有成员变量和方法 | 不能定义静态成员变量和方法 | 创建对象时需要外部类对象 |
> 使用内部类建议：
> - 不需要访问外部类实例时使用静态嵌套类
> - 简单的接口实现使用匿名类
> - 紧密关联的辅助类使用成员内部类
> - 方法内的临时类使用局部内部类
> - 需要临时创建对象使用匿名类
> - 迭代器模式和建造者模式（静态嵌套类）。

> ⚠️性能和内存考虑
> - 内存泄漏：成员内部类持有外部类引用，可能导致外部类无法被垃圾回收；
> - 创建开销：静态嵌套类创建开销最小，匿名类可能较大。
> - 内存效率：静态嵌套类>局部内部类>成员内部类>匿名类
> - 访问效率：静态嵌套类>成员内部类>匿名类>局部内部类(直接访问比通过引用访问更高效)

## 枚举类型（enum）
枚举类型（enum）是一种特殊的类，是java5新特性，用于定义一组常量。枚举类型提供了一种更安全的方式来处理常量，并且可以提供一些额外的功能，如枚举类型的方法、构造函数、继承等。

优势：
- 类型安全：编译时检查，避免无效值；
- 可读性强：语义明确，代码更易理解；
- 功能丰富：可以添加属性、方法和构造函数；
- 内置方法：values()、valueOf()、ordinal()、name()、toString()。
- 单例保证：每个枚举常量都是单例。

> 枚举类型实现原理：枚举类型是一个类，继承了Enum类，枚举类型中的每个常量都是一个枚举对象，枚举对象在编译时会被替换为对应的常量值。

> 枚举内置方法
> - values()：返回枚举类型的所有常量，返回的是一个数组；
> - valueOf(String name)：返回指定名称的枚举常量，如果找不到则抛出异常；
> - ordinal()：返回枚举常量的索引，索引从0开始；
> - name()：返回枚举常量的名称；
> - toString()：返回枚举常量的字符串表示，默认返回名称。
> - equals()：比较两个枚举对象是否相等，相等则返回true；
> - hashCode()：返回枚举常量的哈希码值，默认返回名称的哈希码值；
> - compareTo()：比较两个枚举对象，返回值小于0表示当前对象小于参数对象，等于0表示当前对象等于参数对象，大于0表示当前对象大于参数对象。

> ⚠️注意事项
> - ordinal()方法返回的是声明顺序，不建议用于业务逻辑；
> -valueOf()方法区分大小写，传入错误名称会抛出异常；
> - 枚举实现了Comparable接口，默认情况下枚举对象会按照声明顺序进行排序，如果需要自定义排序规则，需要实现Comparable接口并重写compareTo()方法。
> - 枚举构造方法必须是private，可以省略private，这确保了枚举常量只能在枚举内部创建，维护了枚举的单例特性。
> - 枚举常量不能使用 > 和 < 直接比较，需要使用compareTo()方法进行比较。枚举支持 == 和equals()比较，并且实现了Comparable接口，因此可以进行排序。

策略模式（Strategy Pattern）是一种软件设计模式，它允许在运行时动态选择算法或者策略。策略模式将算法封装在独立的对象中，并使它们可以相互替换。
策略模式在java中的实现：
```java
public enum DiscountStrategy {
    NONE{
        public double apply(double price) {
            return price;
        }
    },
    REGULAR{
        public double apply(double price) {
            return price * 0.9;
        }
    },
    LONG_TERM{
        public double apply(double price) {
            return price * 0.85;
        }
    };
    public abstract double apply(double price);
}
```
策略模式使用场景：
- 使用枚举替代常量值
- 为枚举添加有意义的方法
- 使用枚举实现策略模式
- 合理使用构造方法

## 递归(Recursion)
递归是一种强大的编程技术，函数调用自身来解决更小规模的相同问题。
> ❗️递归的核心要素：
> - 基础情况：递归的终止条件，防止无限递归；
> - 递归情况：函数调用自身的情况；
> - 问题分解：将大问题分解为相同类型的小问题；
> - 结果合并：将子问题的结果合并得到最终答案。

递归优化技术：
- 记忆化：递归调用的结果保存起来，下次调用时直接返回结果，避免重复计算。
- 尾递归：递归调用必须位于函数的末尾，递归调用必须返回结果。
- 动态规划转换：将递归问题转换为动态规划问题。
- 迭代：递归调用改为迭代调用。
- 剪枝：递归调用时，根据当前状态判断是否需要继续递归调用。
- 贪心算法：递归调用时，根据当前状态选择最佳解。
- 回溯算法：递归调用时，根据当前状态选择所有可能的解，并返回最佳解。
- 递归树：递归调用时，将递归调用过程画成树形结构，方便理解。
- 递归树剪枝：递归调用时，根据递归树剪枝算法，剪枝掉不需要的递归调用。
- 递归树优化：递归调用时，根据递归树优化算法，优化递归调用。

## 反射(Reflection)
反射机制允许程序在运行期间获取任意一个类的内部信息，并能够操作任意一个对象的内部属性以及方法。这种动态获取信息以及动态调用对象方法的功能称为Java语言的反射机制。
>反射主要用途
> 1. 运行时类型检查（在运行时确定对象的类型，获取类的详细信息，包括类名、包名、父类、接口等）；
> 2. 动态对象创建（根据类名动态创建对象实例，支持不同参数等构造器调用）；
> 3. 动态方法调用（在运行期间调用对象的方法，包括私有方法，实现灵活的程序控制）；
> 4. 动态字段访问（在运行期间访问对象字段，包括私有字段，实现灵活的程序控制）。

> 反射核心类
> 1. Class：代表一个类，Class对象表示某个类或接口，Class对象是所有Class对象的基类。Class对象是反射的起点。
> 2. Field：代表类的成员变量，Field对象表示某个类的成员变量，Field对象是所有Field对象的基类。
> 3. Method：代表类的方法，Method对象表示某个类的方法，Method对象是所有Method对象的基类。
> 4. Constructor：代表类的构造器，Constructor对象表示某个类的构造器，Constructor对象是所有Constructor对象的基类。

### 获取Class对象
1. Class.forName("包名.类名")：动态加载类，适用于类名以字符串形式提供的情况。
2. 对象.getClass()：运行时获取，适用于已有对象实例的情况。
3. 类名.class：编译时就确定，效率最高，适用于已知具体类是情况。

### 字段反射操作
```java
Class clazz = FieldReflect.class;
//获取所有字段(包括继承的)
Field[] fields = clazz.getFields();
//获取当前类字段(不包括继承的)
Field[] fields = clazz.getDeclaredFields();
for (Field field : fields) {
    System.out.println(field.getName());
    System.out.println(field.getType());
}
//访问公共字段
Field field = clazz.getField("name");
//访问私有字段
Field field = clazz.getDeclaredField("age");
field.setAccessible(true);//设置可访问
field.set(field, "张三");
//访问静态字段
Field field = clazz.getDeclaredField("age");
```
### 方法反射操作
```java
//调用公共方法
Method method = clazz.getMethod("getName");
method.invoke(method);
//调用私有方法
Method method = clazz.getDeclaredMethod("getName");
method.setAccessible(true);
method.invoke(method);
//调用静态方法
Method method = clazz.getMethod("getName");
method.invoke(null);
//调用重载方法(带参数)
Method method = clazz.getMethod("getName", String.class);
method.invoke(method, "张三");
Method method = clazz.getMethod("getName", int.class);
method.invoke(method, 18);
```
### 构造器反射操作
```java
ConstructionReflection
//使用无参构造器
Constructor constructor = clazz.getConstructor();
Object obj = constructor.newInstance();
//使用单参构造器
Constructor constructor = clazz.getConstructor(String.class);
Object obj = constructor.newInstance("张三");
//使用多参构造器
Constructor constructor = clazz.getConstructor(String.class, int.class);
Object obj = constructor.newInstance("张三", 18);
//使用私有构造器
Constructor constructor = clazz.getDeclaredConstructor(String.class);
constructor.setAccessible(true);
Object obj = constructor.newInstance("张三");
System.out.println("私有构造器对象：" + ((ConstructionReflection)obj).getInfo());
```
反射最佳实践
1. 谨慎使用反射，优先考虑面向对象编程方式；
2. 反射操作要进行异常处理，捕获相关的反射异常；
3. 使用setAccessible(true)时要注意考虑安全性问题；
4. 反射操作性能较低，避免在性能敏感的代码中频繁使用反射；
5. 缓存反射获取的Class\Method\Field对象，避免每次获取对象;
6. 在框架中合理使用反射，提供灵活性和扩展性。
7. 反射操作无法在编译时进行类型检查，可能会导致运行时错误。

反射使用场景
1. 配置文件解析
2. 框架开发
3. 动态代理
4. 测试框架
5. 调试工具：ide调试器使用反射显示对象的内部状态和结构信息；
6. 插件系统：动态加载和执行插件代码，实现可扩展的应用架构。
7. 序列化：json和xml序列化库使用反射将对象转化为字符串格式。

反射的缺点
1. 反射性能问题：反射操作耗时，反射操作的效率比直接操作对象效率低。
2. 破坏封装性
3. 代码可读性差
4. 编译时无法进行类型检查。

## 注解（Annotation）
注解是java5引入的，注解是一种修饰符，注解可以修饰包、类、方法、属性、参数、局部变量，为代码添加元数据的方式。注解本身不会改变程序的执行逻辑，但可以被编译器、开发工具和运行时环境读取和处理。

> 注解的作用：
1. 编译时检查：如@Override检查方法重写是否正确；
2. 代码生成：如Lombok的@Getter\@Setter注解，自动生成getter和setter方法；
3. 运行时处理：如Spring的@Component、@Controller、@Service、@Repository注解，自动扫描并注册bean，进行依赖注入；
4. 文档生成：如@Deprecated注解，表示该方法或类已过时，不建议使用。
5. 配置管理：如Spring的@Value注解，用于注入配置文件参数。

> Java内置的注解：
1. @Override：表示该方法是一个重写方法，用于检查是否正确地重写父类方法；
2. @Deprecated：表示该方法或类已过时，不建议使用；
3. @SuppressWarnings：表示忽略编译警告，如使用过时方法或参数。
4. @FunctionalInterface：表示该接口是一个函数式接口，用于定义lambda表达式。
5. @SafeVarargs：表示该方法使用了可变参数，但该参数不会被修改，可以忽略编译警告。
6. @Test：表示该方法为测试方法，用于单元测试。

> 自定义注解
```java
//作者信息注解
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface AuthorInfo {
    String name() default "holly";
    String date() default "";
    String email() default "";
}
//版本信息注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface VersionInfo {
    String value() default "1.0.0";
    String description() default "";
}
```
> 元注解
1. @Documented：表示注解被javadoc工具所记录
2. @Retention：表示注解被保留的时间长短(运行时、编译时、类加载时---SOURCE\CLASS\RUNTIME)
3. @Target：表示注解所修饰的对象范围(类、方法、属性、构造器、参数、包、注解---TYPE\FIELD\METHOD)
4. @Inherited：表示注解被子类继承。

> 注解设计和使用原则
> 1. 注解本身没有逻辑，只是为程序员提供一种新的方法，来为程序进行注释。
> 2. 明确注解的目的和作用域
> 3. 提供合理的默认值
> 4. 使用有意义的名称
> 5. 添加完整的文档说明
> 6. 考虑性能影响（⚠️反射操作有一定的性能开销，在高频调用的场景中应该考虑缓存注解信息，避免重复的反射操作）

> 注解使用场景
> - 数据验证（使用注解标记字段验证规则，如：@NotBlank、@NotNull、@Min、@Max、@Email、@Pattern）
> - 依赖注入（使用注解标记字段，如：@Autowired、@Resource）
> - orm映射（使用注解标记字段，如：@Table、@Column、@Id、@GeneratedValue）
> - web开发（springmvc使用注解标记方法，如：@Controller、@RequestMapping、@RequestParam、@ResponseBody）
> - 序列化（jackson的@JsonProperty注解）
> - 测试（junit的@BeforeClass、@AfterClass、@Before、@After、@Test、@Ignore注解）

## 泛型（Generics）
泛型是java5引入的新特性，泛型使得类、接口和方法可以支持任意数据类型。它提供了编译时类型安全检测机制，允许程序员在编译时检测到非法的类型。泛型的本质是参数化类型，即所操作的数据类型被指定为一个参数。

> ❗️泛型主要优势：
- 类型安全：在编译时检查类型错误，避免允许时ClassCastException;
- 消除类型转换：避免显式类型转换，代码更简洁
- 代码复用：可以编写一次泛型代码，用于多种数据类型，避免重复编写相似的代码。
- 提高性能：避免装箱和拆箱操作，直接操作原始数据类型，提高性能。
- 更好的api设计：使用api更加清晰和易用。

> ? 泛型通配符

| 通配符类型  | 语法  | 说明  | 使用场景 |
| :----- | :--- | :--- | :--- |
| 上界通配符 | <? extends T> | 表示类型必须是T或T的子类| 读取T类型的数据(只能读取，不能写入)生产者 |
| 下界通配符 | <? super T> | 表示类型必须是T或T的父类 | 写入T类型的数据(只能写入，不能读取) 消费者|
| 无界通配符 | <?> | 表示类型可以是任意类型 | 不限制类型 |

> ⚠️PECS原则
> 1. 生产者使用上界通配符（<? extends T>）需要从集合（工厂）中读取数据（生产者）get
> 2. 消费者使用下界通配符（<? super T>）需要向集合中写入数据（消费者）add
> 3. 无界通配符（<?>）在不确定具体类型时使用。

> 类型擦除
> - 泛型类型在编译时会被擦除，替换为其边界类型（如果有）或Object类型。
> - 运行时无法获取泛型的具体类型信息
> - 不能创建泛型数组
> - 不能实例化类型参数
> - 不能使用基本类型作为类型参数
> - 不能在静态上下文中使用类型参数

### 什么时候使用泛型
当需要类型安全、避免类型转换、提高代码重用性时，特别是在集合、工具类和框架开发中；
### extends和super区别
extends用于读取（生产者）----子类或者相同类型，super用于写入（消费者）----父类或者相同类型。
### 为什么不能创建泛型数组
由于类型擦除，运行时无法确定数组的确切类型，可能导致类型安全问题，可以使用List代替数组，或者使用反射创建。
