---
title: "Java 流程控制"
date: 2021-01-09T20:18:05+08:00
draft: false
description: "Java 流程控制：if-else、switch、循环（for、while、do-while）、跳转语句（break、continue、return）。"
tags: ["Java", "流程控制"]
categories: ["Java"]
---

Java 流程控制：if-else、switch、循环（for、while、do-while）、跳转语句（break、continue、return）。
## if-else 语句
典型应用：根据不同的条件执行不同的代码块。
- 用户输入验证：检查用户输入的数据是否符合条件；
- 权限检查：根据用户的角色或权限执行不同的操作；
- 游戏逻辑：根据游戏状态执行不同的游戏逻辑；
- 路由选择：根据不同的条件选择不同的路径执行；
- 状态机：根据不同的状态执行不同的操作；
- 数据范围验证：确保数值在有效范围内；
- 状态判断：根据对象或系统的状态执行不同的逻辑；
- 错误处理：根据不同的错误类型执行不同的错误处理逻辑，检测错误条件并采取相应的措施，如打印错误信息、记录日志、回滚操作等。
- 业务逻辑分支：根据业务需求，将复杂的业务逻辑拆分成多个分支，每个分支对应不同的处理逻辑。
  
性能优化建议
- 将最可能为true的条件放在前面（短路求值性能更好）；
- 避免在条件表达式中进行复杂计算，如调用方法、进行复杂的数学运算等，将其提取到循环外部；
- 使用局部变量存储重复计算的结果；
- 考虑使用switch语句替代多个if-else语句，当有多个条件需要判断时，switch语句的性能通常更好；
- 合理使用逻辑运算符的短路特性；
- 考虑使用并行处理或多线程来提高循环的执行效率。


## switch 语句

- switch支持的类型：byte、short、int、char、枚举类型、从Java 5支持的包装类、从Java 7开始支持的字符串类型。
- break 语句：用于跳出 switch 语句，终止执行后续的 case 分支,如果省略break，程序会执行下一个case，这种现象称为“fall-through”。为了避免“fall-through”现象，每个 case 分支结束时都应该添加 break 语句。有时可以巧用fall-through来实现多个 case 分支共享相同的代码逻辑。
- default 语句：用于处理没有匹配的 case 分支的情况。default 语句可以放在 switch 语句的任意位置，通常放在最后面。

swtich表达式（java14开始支持）
```java
String dayType = switch(dayOfWeek) {
  case MONDAY, FRIDAY, SUNDAY -> "Weekend";
  case TUESDAY, WEDNESDAY, THURSDAY -> "Weekday";
  default -> "Invalid day";
};
```
switch 表达式的优势：
- 更简洁的语法：switch 表达式使用箭头运算符（->）来定义每个 case 分支的代码块，而不需要使用大括号 {}，避免fall-through；
- 更强大的功能：switch 表达式可以返回一个值，而不仅仅是执行代码块；
- 更安全的类型检查：switch 表达式会在编译时检查 case 分支的类型是否与 switch 表达式的类型兼容，避免了运行时的类型转换错误；
- 更灵活的分支逻辑：switch 表达式可以使用多个 case 分支共享相同的代码逻辑，而不需要重复编写相同的代码；
- 使用yield关键字返回复杂表达式的值。

switch 使用建议
- 总是使用break：除非故意使用fall-through来实现多个 case 分支共享相同的代码逻辑。
- 包含default分支：处理未预期的值；
- 保持case简洁：复杂逻辑提取到方法中；
- 使用常量：避免魔法数字（直接在代码中使用具体的数值，而不是定义一个常量来表示）；
- 考虑使用枚举类型：当有多个固定值需要判断时，使用枚举类型可以提高代码的可读性和维护性。
- 优先使用switch表达式：当需要根据不同的值执行不同的代码逻辑时，优先使用switch表达式，而不是if-else语句。

switch常见错误
- 忘记添加break语句：导致“fall-through”现象，执行多个 case 分支的代码；
- 忘记添加default分支：处理未预期的值，导致程序运行错误；
- 使用错误的类型：比如float、double。switch 表达式的类型必须与 case 分支的类型兼容，否则会编译错误；
- 忘记使用yield关键字返回值：在 switch 表达式中，每个 case 分支都必须使用 yield 关键字返回一个值，否则会编译错误。
- null值处理：switch 表达式不支持 null 值，因此在使用 switch 表达式时，应该避免将 null 值作为 case 分支的参数。如果需要处理 null 值，应该使用 if-else 语句或 Optional 类来处理。（使用switch之前进行null检查，避免NullPointerException）
- 在case中声明变量：在 switch 表达式中，每个 case 分支都可以声明变量，但是这些变量只能在该分支中使用，不能在其他分支中使用。

## for 语句
使用建议
- 使用有意义的循环变量名；
- 避免在循环体内修改循环变量；
- 合理使用break和continue语句：在循环中，使用break语句可以提前结束循环，而使用continue语句可以跳过当前迭代，继续下一次迭代。
- 优先使用for-each循环：当不需要访问循环索引时，优先使用for-each循环，而不是传统的for循环。
- 避免不必要的嵌套循环：嵌套循环会增加代码的复杂性和运行时间，因此应该尽量避免使用嵌套循环。如果需要嵌套循环，应该考虑是否可以将其转换为单循环来实现相同的功能。
- 在循环外声明不变的变量：如果在循环中不需要修改的变量，应该在循环外部声明，而不是在循环内部声明。这样可以提高代码的可读性和维护性，避免在循环内部修改变量时引入错误。
```java
//不推荐使用
for (int i = 0; i < array.length; i++) {
  //处理array[i]
}
//推荐：提前计算length
int length = array.length;
for (int i = 0; i < length; i++) {
  //处理array[i]
}
//更推荐：使用for-each循环
for (int num : array) {
  //处理num
}   
```
## for-each 语句

for-each循环和传统for循环的区别

| 特性               | 传统for循环                      | for-each循环                     |
| ------------------ | -------------------------------- | -------------------------------- |
| 语法               | for (初始化; 循环条件; 迭代操作) | for (元素类型 元素变量 : 数组或集合) |
| 访问元素           | 使用索引访问数组元素             | 直接访问元素，无需索引           |
| 循环变量作用域     | 循环体内部                      | 循环体内部                      |
| 循环索引           | 可以在循环体内使用              | 不能在循环体内使用              |
| 遍历数组或集合     | 可以遍历数组或集合的所有元素     | 只能遍历数组或集合的所有元素     |
| 遍历范围           | 可以指定遍历范围（如部分元素）   | 只能遍历整个数组或集合           |
| 代码简洁性         | 代码相对较长                     | 代码相对较短                     |
| 适用场景           | 需要访问数组索引或进行复杂操作时 | 只需要遍历数组或集合元素时       |

> for-each循环可以遍历所有实现了Iterable接口的类，包括数组、集合等。(List、Set、Queue等集合类，但是不能直接遍历Map，需要通过Map的视图方法keySet()、entrySet()、values()等获取键值对视图，然后遍历视图元素)

```java
Map<String, List<String>> store = new HashMap<>();
store.put("水果", Arrays.asList("苹果", "香蕉", "橙子"));
store.put("蔬菜", Arrays.asList("胡萝卜", "西红柿", "茄子"));

for (Map.Entry<String, List<String>> category : store.entrySet()) {
    System.out.println(category.getKey() + "包含");
    for (String item : category.getValue()){
        System.out.println(" - " + item);
    }
}
```
> 注意：for-each循环不能在循环体内修改集合元素，因为它直接访问元素，而不是通过索引访问。如果需要在循环体内修改集合元素，应该使用Iterator来遍历集合，然后使用Iterator的方法来修改元素。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
Iterator<Integer> iterator = numbers.iterator();
while (iterator.hasNext()) {
    Integer number = iterator.next();
    if (number % 2 == 0) {
        iterator.remove(); // 使用Iterator的remove方法删除偶数
    }
}
System.out.println(numbers); // 输出: [1, 3, 5]
```
> for-each循环可以遍历数组或集合的所有元素，但是不能在循环体内修改集合元素。
```java
int[] numbers = {1, 2, 3, 4, 5};
for (int num : numbers) {
    num = num * 2; // 这不会修改原数组中的元素
}
System.out.println(Arrays.toString(numbers)); // 输出: [1, 2, 3, 4, 5]
//正确做法是使用传统for循环修改数组
for (int i = 0; i < numbers.length; i++) {
    numbers[i] = numbers[i] * 2; // 修改原数组中的元素
}
System.out.println(Arrays.toString(numbers)); // 输出: [2, 4, 6, 8, 10] 
```
> 对null集合使用for-each循环时，会抛出NullPointerException异常。
```java
List<String> list = null;
try {
    for (String item : list) {
        System.out.println(item);
    }
} catch (NullPointerException e) {
    System.out.println("集合为空");
}
//正确做法是先进行null检查
if (list != null) {
    for (String item : list) {
        System.out.println(item);
    }
} else {
    System.out.println("集合为空");
}
```
最佳实践
- 优先使用for-each循环（对于只读遍历）；
- 使用有意义的变量名；
- 处理null值；
- 避免复杂计算或耗时操作在循环体内；
- 合理选择循环类型：根据具体场景选择传统for循环或for-each循环。如果需要访问数组索引或进行复杂操作，使用传统for循环；如果只需要遍历数组或集合元素，使用for-each循环；
- 注意性能影响。

性能建议
- 对于数组，两种循环类型的性能差异通常很小，因为数组的访问是基于索引的，而for-each循环在内部也使用了索引访问，选择for-each可读性更好一些；
- 对于ArrayList等随机访问集合，for循环效率高于for-each循环（性能相当），因为直接通过索引访问数组元素，无额外开销。
- 对于LinkedList等顺序访问集合，for-each循环通常比传统for循环快，因为for-each循环在内部使用了迭代器来遍历元素，避免内存跳跃，而传统for循环在每次迭代时都需要调用next()方法来获取下一个元素。
- 对于Set和其他集合，必须使用for-each循环遍历元素时，因为集合的遍历是基于迭代器的，没有索引。
- 避免在循环体内进行复杂的计算和对象创建。

## while 语句
while循环和do-while循环的区别

| 特性               | while循环                      | do-while循环                     |
| ------------------ | -------------------------------- | -------------------------------- |
| 语法               | while (循环条件) { 循环体 }     | do { 循环体 } while (循环条件); |
| 循环条件判断位置   | 先判断循环条件，再执行循环体    | 先执行循环体，再判断循环条件    |
| 循环体执行次数     | 可能一次都不执行（如果循环条件初始为false） | 至少执行一次（无论循环条件是否为true） |
| 适用场景           | 当循环次数未知，仅根据循环条件判断是否继续时 | 当需要确保循环体至少执行一次，无论循环条件是否为true时 |

> while循环和do-while循环都可以用于实现循环，选择使用哪种循环取决于具体场景。如果循环次数未知，或者仅根据循环条件判断是否继续，应该使用while循环。如果需要确保循环体至少执行一次，无论循环条件是否为true，应该使用do-while循环。菜单系统和用户交互通常使用do-while循环，数据处理和文件读取通常使用while循环。

循环控制和跳转语句
- break语句：用于立即退出当前循环（for、while、do-while）或switch语句。
- continue语句：用于跳过当前循环迭代，继续执行下一次迭代（for、while、do-while）。
- return语句：用于从方法中立即返回，结束方法的执行。

## break & continue 循环控制语句
break语句用于立即退出当前循环（for、while、do-while）或switch语句。跳转到循环后的第一条语句；只影响最内层循环（除非使用标签）
```java
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // 当i等于5时，跳出循环
    }
    System.out.println(i);
}
```
continue语句用于跳过当前循环迭代，继续执行下一次迭代（for、while、do-while）。只影响最内层循环（除非使用标签），不能用于switch语句。
```java
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        continue; // 当i等于5时，跳过当前迭代，继续下一次迭代
    }
    System.out.println(i);
}
```

break和continue对比

| 特性               | break语句                      | continue语句                     |
| ------------------ | -------------------------------- | -------------------------------- |
| 作用               | 立即退出当前循环或switch语句    | 跳过当前迭代，继续下一次迭代    |
| 影响范围           | 只影响最内层循环（除非使用标签） | 只影响最内层循环（除非使用标签） |
| 适用场景           | 用于提前结束循环或switch语句    | 用于跳过当前迭代，继续下一次迭代 |
| 注意事项           | 不能用于switch语句              | 不能用于switch语句              |
| 性能影响           | 可以提前结束，节省时间响                      | 跳过不必要的处理 |

性能优化技巧
- 早期退出：在大数据集中搜索时，使用break可以显著提高性能；
- 跳过处理：使用continue跳过不需要的复杂计算；
- 条件优化：将最可能满足的条件放在前面；
- 循环设计：合理设计循环结构，减少不必要的迭代。

