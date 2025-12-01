---
title: "Java 异常处理"
date: 2021-01-09T22:20:05+08:00
draft: false
description: "Java 异常处理：异常基础、异常处理、throw和throws、自定义异常、try-with-resources。"
tags: ["Java", "Java异常处理"]
categories: ["Java"]
---
Java 异常处理：异常基础、异常处理、throw和throws、自定义异常、try-with-resources。
## 异常基础
异常是指在程序运行过程中发生的错误或异常情况，导致程序中断或异常终止。Java 异常处理机制提供了一种结构化的方式来处理异常，确保程序的正常运行和稳定性。

异常的作用
- 错误报告：提供详细的错误信息；
- 程序健壮性：防止程序因错误而崩溃；
- 错误恢复：允许程序从错误中恢复；
- 调试支持：提供堆栈跟踪信息。

### 异常分类
所有异常都继承自 `java.lang.Throwable` 类，分为两种类型：
- 检查异常（Checked Exception）：必须在方法签名中声明或捕获，否则编译错误。IOException、SQLException等。                       
- 运行时异常（Runtime Exception）：无需在方法签名中声明或捕获，运行时可能抛出。NullPointerException、ArrayIndexOutOfBoundsException等。
- 错误（Error）：表示严重的错误，通常由Java虚拟机（JVM）抛出，程序无法处理。StackOverflowError、OutOfMemoryError等。

> ⚠️性能考虑
> - 异常处理有开销：异常对象创建需要生成堆栈跟踪；
> - 不要用异常控制流程：异常应该用于异常情况
> - 避免频繁抛出异常：在循环中进行预检查。

### 什么时候应该捕获异常
能够合理地处理异常或者需要进行资源清理时。
### 检查异常和运行时异常的区别
检查异常必须在编译时处理，运行时异常可以选择处理。
### 是否应该捕获Error
不应该捕获Error，因为Error表示严重的错误，通常由JVM抛出，程序无法处理。
### 如何选择抛出异常还是返回错误码
- 抛出异常：当异常是可恢复的或需要进行错误处理时；
- 返回错误码：当异常是不可恢复的或不需要进行错误处理时。


## 异常处理
异常处理是java编程中的重要概念，它允许程序在运行时优雅地处理错误情况。java异常处理机制基于try-catch-finally语句块，用于捕获和处理异常。异常是指在程序运行过程中发生的错误或异常情况，导致程序中断或异常终止。java中的异常是一个对象，它封装了错误信息和发生错误时的程序状态。

### 异常处理流程
1. 程序执行到可能抛出异常的语句时，会检查是否有匹配的异常处理程序；
2. 如果有匹配的异常处理程序，会跳转到异常处理程序执行；
3. 如果没有匹配的异常处理程序，会向上层调用栈查找；
4. 如果最终没有合适的异常处理程序，程序会终止运行。

try-catch-finally基本语法
```java
try {
    // 可能抛出异常的代码
} catch (ExceptionType1 e1) {
    // 处理 ExceptionType1 异常的代码
} catch (ExceptionType2 e2) {
    // 处理 ExceptionType2 异常的代码
} finally {
    // 无论是否发生异常，都会执行的代码
}
```
### 异常处理执行顺序
1. 程序执行到try语句块中的代码；
2. 如果发生异常，会跳转到匹配的catch语句块执行；
3. 如果没有匹配的catch语句块，会向上层调用栈查找；
4. 如果最终没有合适的异常处理程序，程序会终止运行；
5. 无论是否发生异常，finally语句块中的代码都会执行。
6. 后续代码：继续执行try-catch-finally语句块后面的代码。
   
### 自定义异常
自定义异常是指根据程序的业务逻辑需求，创建自己的异常类。自定义异常可以提供更具体的错误信息和异常类型，方便程序开发者进行错误处理和调试。

自定义异常的步骤
1. 创建一个新的异常类，继承自 `Exception` 或 `RuntimeException`；
2. 添加构造方法，用于设置异常信息；
3. 可以添加其他自定义方法，用于获取异常信息或进行其他操作。
```java
//自定义检查异常
public class CustomCheckedException extends Exception {
    public CustomCheckedException(String message) {
        super(message);
    }
}
//自定义运行时异常
public class CustomRuntimeException extends RuntimeException {
    public CustomRuntimeException(String message) {
        super(message);
    }
}
//使用自定义异常
try {
    // 可能抛出自定义异常的代码
} catch (CustomCheckedException e) {
    // 处理自定义检查异常的代码
} catch (CustomRuntimeException e) {
    // 处理自定义运行时异常的代码
}
```
## throw 和 throws

throw的特点
1. throw用于在方法中手动抛出异常；
2. 可以抛出任何类型的异常，包括检查异常和运行时异常；
3. 抛出异常后，方法会立即停止执行，后续代码不会被执行；
4. 可以在catch语句块中抛出异常，将异常传递给上层调用栈处理。

throws的特点： 
1. throws用于在方法签名中声明可能抛出的异常；
2. 可以声明多个异常，用逗号分隔；
3. 调用该方法的代码必须处理声明的异常，或者继续声明抛出；
4. 运行时异常无需在方法签名中声明，但是检查异常必须声明。（编译器会检查异常是否被正确处理）

throw和throws的区别
| 特性  | throw  | throws |
| --- | --- | --- |
| 位置 | 方法体内部 | 方法签名 |
| 作用 | 手动抛出异常 | 声明可能抛出的异常 |
| 异常类型 | 可以抛出任何类型的异常 | 必须声明检查异常 |
| 异常处理 | 必须在调用方法的代码中处理异常 | 调用方法的代码可以选择处理或继续声明抛出 |
|数量| 可以抛出多个异常 | 只能声明一个异常 |
| 执行时机 | 运行时执行 | 编译时检查 |
| 后续代码 | 继续执行try-catch-finally语句块后面的代码(之后的代码不执行) | 后续代码依赖于异常是否被处理（正常执行） |

### 异常处理的最佳实践
1. 只捕获必要的异常：只捕获能够处理的异常，避免捕获所有异常；
2. 异常处理代码要简洁明了：异常处理代码应该只包含必要的逻辑，避免复杂的处理流程；
3. 避免在循环中抛出异常：在循环中抛出异常会导致性能问题，应该避免在循环中抛出异常；
4. 记录异常信息：在捕获异常时，应该记录异常信息，方便后续调试和分析。
5. 尽早处理异常：在可能发生异常的地方，尽早捕获并处理异常，避免异常传播到上层调用栈。
6. 尽早抛出异常，尽晚捕获异常。
7. 异常处理代码要与业务逻辑分离：异常处理代码应该与业务逻辑分离，避免将异常处理代码嵌入到业务逻辑中。

### 异常类型选择指南

- 检查异常（Checked Exception）：继承自 `Exception` 类的异常，必须在方法签名中声明，或者在方法体中使用 `try-catch` 语句捕获处理。**必须在方法签名中声明或捕获异常，如IOException、SQLException等。**
- 运行时异常（Runtime Exception）：继承自 `RuntimeException` 类的异常，无需在方法签名中声明，但是可以在方法体中使用 `try-catch` 语句捕获处理。**不强制要求声明或捕获，如NullPointerException、ArrayIndexOutOfBoundsException等。**
- 错误（Error）：继承自 `Error` 类的异常，通常表示严重的系统错误，不应该被捕获和处理。**不建议在业务逻辑中捕获或处理错误异常，如OutOfMemoryError、StackOverflowError等。**
- 对于可恢复的错误，使用异常检查机制，如IOException、SQLException等。
- 对于不可恢复的错误（编程错误、逻辑错误等），使用运行时异常，如NullPointerException、ArrayIndexOutOfBoundsException等。
- 自定义异常：根据业务逻辑需求，创建自定义异常类，继承自Exception或RuntimeException。
- 不要为简单的参数验证使用检查异常：检查异常用于处理可恢复的错误，而参数验证是一种简单的检查，不应该使用检查异常。
- 优先使用标准异常类型
- 必要时创建自定义异常类。
- throw后面跟异常对象（用于抛出异常），throws后面跟异常类型（用于声明异常）。
- 异常会沿着调用栈向上传播，直到被捕获或者达到程序顶层。
- 保证异常链完整，不要丢失原始异常信息。

## try-with-resource

try-with-resource是Java 7引入的一种异常处理机制，用于自动关闭实现了`AutoCloseable`接口的资源，如文件流、数据库连接等。它可以确保资源在使用完毕后被正确关闭，避免资源泄漏和内存泄漏问题。

在try-with-resource中声明的变量是隐式final的。

> 核心优势
> - 自动资源管理：无需手动调用close方法关闭资源，try-with-resource会自动关闭资源，确保资源在使用完毕后被正确关闭。
> - 异常处理安全：try-with-resource可以捕获并处理异常，确保资源在关闭时不会抛出异常。
> - 代码简洁：使用try-with-resource可以使代码更加简洁，避免了手动关闭资源的繁琐操作。
> - 资源关闭顺序：try-with-resource会按照声明的顺序关闭资源，确保资源的关闭顺序是正确的。
> - 异常链完整：try-with-resource会将原始异常信息传递给异常处理代码，确保异常链完整，方便调试和分析。
> - 避免资源泄漏：try-with-resource可以避免由于忘记关闭资源而导致的资源泄漏问题。

基本语法
```java
try(Resource r = new Resource()){
    // 使用资源
} catch (Exception e) {
    // 处理异常
}
//多个资源
try(Resource r1 = new Resource(); Resource r2 = new Resource()){
    // 使用资源
} catch (Exception e) {
    // 处理异常
}
```
### AutoCloseable接口
AutoCloseable接口是Java 7引入的一个函数式接口，用于表示实现了自动关闭资源的对象。它定义了一个close方法，用于关闭资源。
```java
public interface AutoCloseable {
    void close() throws Exception;
}
```
要在try-with-resource语句中使用的资源，必须实现AutoCloseable接口。
> ⚠️注意
> 实现AutoCloseable接口时，close方法应该是幂等的，即多次调用close方法应该与调用一次close方法的效果相同。

### 异常处理规则
- try-with-resource语句中可以包含多个资源，每个资源之间用分号分隔。
- 资源的关闭顺序与声明顺序相反，即最后声明的资源最先关闭。
- 资源的close方法会在try语句执行完毕后自动调用，无论是否发生异常。
- 如果try语句中发生异常，close方法会在异常处理代码执行完毕后调用。
- 如果close方法抛出异常，try-with-resource语句会将close方法抛出的异常添加到原始异常中，确保异常链完整。
- 可以在try-with-resource语句中使用多个catch子句，分别处理不同类型的异常。
- 抑制异常：close方法抛出的异常会被添加到主异常的抑制异常列表中。
- 异常传播：即使colse抛出异常，所有资源仍然会尝试关闭。
  
### try-catch-finally & try-with-resource区别
| 特性 | try-catch-finally | try-with-resource |
| --- | --- | --- |
| 资源关闭 | 手动调用close方法关闭资源 | 自动关闭资源 |
| 异常处理 | 手动处理异常 | 自动处理异常 |
| 代码简洁 | 繁琐 | 简洁 |
| 资源关闭顺序 | 手动指定 | 自动指定 |
| 异常链完整 | 不完整 | 完整 |
| 避免资源泄漏 | 可能 | 绝对 |
| 空指针检查 | 手动检查 | 自动检查，编译器保证 |
| 性能 | 无影响 | 无影响 |

### 可以在try-with-resource中使用null吗
不可以，如果资源初始化返回null，会在进入try块之前抛出NullPointerException异常。
### 资源关闭的顺序是什么？
资源的关闭顺序与声明顺序相反，即最后声明的资源最先关闭。
### 可以在try块外访问资源吗
不可以，在try-with-resource语句中声明的资源只能在try块中访问。
### close方法会被调用多次吗
不会，每个资源的close方法只会被调用一次，即使手动调用过close方法也不会再次调用。






