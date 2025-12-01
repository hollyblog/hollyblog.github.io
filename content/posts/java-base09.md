---
title: "Java 集合框架"
date: 2021-01-09T22:21:05+08:00
draft: false
description: "Java 集合框架：集合框架概述、List、ArrayList、LinkedList、Vector&Stack、Set、Map、Queue、Iterator迭代器。"
tags: ["Java", "Java集合框架"]
categories: ["Java"]
---

Java 集合框架：集合框架概述、List、ArrayList、LinkedList、Vector&Stack、Set、Map、Queue、Iterator迭代器。
## 集合框架概述
集合框架（Java Collections Framework）JCF是java平台用于存储和操作对象集合的统一架构。

优势
- 统一的架构：提供了一致的api来操作不同类型的集合
- 高性能：针对不同场景优化的数据结构实现
- 互操作性：不同集合类型之间可以互相转换
- 可扩展性：可以轻松创建自定义集合实现

### Java 集合框架继承体系图
```
Iterable
├── Collection
│   ├── List
│   │   ├── ArrayList
│   │   ├── LinkedList
│   │   └── Vector & Stack
│   ├── Set
│   │   ├── HashSet
│   │   ├── LinkedHashSet
│   │   └── TreeSet
│   └── Queue
│       ├── ArrayDeque
│       ├── LinkedList
│       └── PriorityQueue

Map
  ├── HashMap
  ├── LinkedHashMap
  ├── TreeMap
  └── HashTable

```
> ⚠️ Map接口并不继承Collection接口，而是独立存在，表示键值对的映射关系，而Collection接口表示单个对象的集合。

- List接口：有序集合，允许重复元素，保持插入顺序，提供基于索引的访问和操作方法，提供迭代器遍历元素。
- Set接口：无序集合，不允许重复元素，不保持插入顺序，最多包含一个null元素，基于equals()方法判断重复，支持集合运算，无索引访问，提供基于元素内容的访问和操作方法，提供迭代器遍历元素。
- Queue接口：有序集合，允许重复元素，保持插入顺序，提供基于索引的访问和操作方法，提供迭代器遍历元素。
- Map接口：键值对映射集合，键不能重复，值可以重复，支持null键和值，不继承Collection接口，独立存在，提供基于键的访问和操作方法，提供迭代器遍历键值对，提供三种视图：键视图、值视图、键值对视图。
- SortedSet接口：有序集合，不允许重复元素，不保持插入顺序，最多包含一个null元素，基于compareTo()方法判断重复，支持集合运算，无索引访问，提供基于元素内容的访问和操作方法，提供迭代器遍历元素，支持范围查询，提供首尾元素访问，子集视图，Compatator支持。
### 主要实现类比较
List实现类比较
| 实现类 | 底层结构 | 访问性能 | 插入/删除性能 | 线程安全 | 适用场景 |
| ------ | -------- | -------- | ------------- | -------- | -------- |
| ArrayList | 动态数组 | 快o(1) | 慢o(n) | 否 | 随机访问频繁，插入删除操作少 |
| LinkedList | 双向链表 | 慢o(n) | 快o(1) | 否 | 频繁插入删除操作，不随机访问 |
| Vector & Stack | 动态数组 | 快o(1) | 慢o(n) | 是 | 线程安全，随机访问频繁，插入删除操作少 |

Set实现类比较
| 实现类 | 底层结构 | 访问性能 | 插入/删除性能 | 线程安全 | 适用场景 |null支持 | 排序 |
| ------ | -------- | -------- | ------------- | -------- | -------- | -------- | -------- |
| HashSet | 哈希表 | 快o(1) | 快o(1) | 否 | 不要求有序，不允许重复元素，快速查找 | 支持 | 无序 |
| LinkedHashSet | 哈希表 + 链表 | 快o(1) | 快o(1) | 否 | 不要求有序，不允许重复元素，需要保持插入顺序 | 支持 | 插入顺序 |
| TreeSet | 红黑树 | 快o(logn) | 快o(logn) | 否 | 要求有序，不允许重复元素 | 不支持 | 自然顺序 |

Map实现类比较
| 实现类 | 底层结构 | 访问性能 | 插入/删除性能 | 线程安全 | 适用场景 |null支持 | 排序 |
| ------ | -------- | -------- | ------------- | -------- | -------- | -------- | -------- |
| HashMap | 哈希表 | 快o(1) | 快o(1) | 否 | 不要求有序，不允许重复键，快速查找 | 键值都支持 | 无序 |
| LinkedHashMap | 哈希表 + 链表 | 快o(1) | 快o(1) | 否 | 不要求有序，不允许重复键，需要保持插入顺序 | 键值都支持 | 插入/访问顺序 |
| TreeMap | 红黑树 | 快o(logn) | 快o(logn) | 否 | 要求有序，不允许重复键 | 值支持，键不支持 | 键自然顺序 |
| HashTable | 哈希表 | 快o(1) | 快o(1) | 是 | 不要求有序，不允许重复键，快速查找 | 键值都不支持 | 无序 |

### 集合选择建议
- 需要索引访问：List
- 不允许重复：Set
- 键值对映射：Map
- 有序集合：SortedSet
- FIFO操作（队列）：Queue
- 频繁随机访问：ArrayList
- 频繁插入删除操作：LinkedList
- 线程安全：Vector & Stack & HashTable
- 需要排序：TreeSet & TreeMap

### 性能优化建议
- 初始容量：为ArrayList和HashMap指定初始容量，避免频繁扩容.
- 负载因子：为HashMap和LinkedHashMap指定合适的负载因子，平衡空间利用率和查找性能
- 迭代器：使用迭代器遍历集合元素，而不是传统的for循环，因为迭代器提供了安全的删除操作，避免ConcurrentModificationException异常；
- 批量操作：使用批量操作方法（如addAll、removeAll）而不是单个元素操作，提高效率
- 并发考虑：多线程环境下选择合适的并发集合。
- 避免自动装箱拆箱：使用基本数据类型的包装类时，避免自动装箱拆箱操作，影响性能
- 选择合适的遍历方式：使用foreach循环或迭代器遍历集合，避免使用传统的for循环，因为foreach循环更简洁、更安全
- 及时释放资源：在使用完集合后，及时调用clear方法清空集合元素，避免占用过多内存
- 注意内存泄漏：避免集合元素持有对外部对象的引用，导致内存泄漏问题。

## List 接口
- 有序性：元素按照插入顺序存储，每个元素都是一个确定的位置索引。
- 可重复：允许存储重复的元素，同一个对象可以在list中多次出现。
- 索引访问：支持通过索引直接访问、修改和删除指定位置的元素。
- 动态大小：List的大小可以动态增长和缩减，不需要预先指定容量。
  
### ArrayList 实现类
- 底层结构：基于Object[]数组，支持动态扩容。动态数组，连续的内存空间存储元素。
- 访问性能：快o(1)，直接通过索引随机访问元素。
- 插入/删除性能：慢o(n)，因为需要移动后续元素。在末尾操作效率高，中间操作需要移动元素。
- 线程安全：非线程安全，多线程环境需要外部同步，不支持并发操作。
- 内存效率：连续内存存储，空间利用率高。
- 适用场景：随机访问频繁，插入删除操作少。
  
#### 扩容机制
```java
//ArrayList 扩容机制
ArrayList list = new ArrayList<>();
//当元素数量超过当前容量时，会触发扩容
//新容量 = 旧容量 + 旧容量 >> 1  //即增长50%
//建议：如果知道大概大小，可以指定初始容量
//指定初始容量为10
ArrayList list = new ArrayList<>(1000);
```
### LinkedList 实现类
- 底层结构：基于双向链表，每个元素包含数据和前后指针。
- 访问性能：慢o(n)，因为需要遍历链表才能访问到指定位置的元素。
- 插入/删除性能：快o(1)，因为只需要修改前一个元素和后一个元素的引用即可。
- 线程安全：非线程安全，多线程环境需要外部同步，不支持并发操作。
- 内存效率：非连续内存存储，每个元素占用额外的空间存储引用。
- 双端队列：实现了Deque接口，可以作为栈和队列使用。
- 适用场景：频繁插入删除操作，不随机访问。

### 最佳实践
> ❗️选择合适的类
- 默认选择：
  - 随机访问频繁：ArrayList
  - 频繁插入删除操作：LinkedList
- 线程安全：collection.synchronizedList(new ArrayList<>()) 或者copyonwriteArrayList.
- 性能优化：合理设置ArrayList的初始容量，避免频繁扩容。

> ⚠️注意事项
- 遍历时修改：避免在增强for循环中修改list，使用Iterator的remove方法安全删除元素。
- 索引越界：访问元素前检查索引范围；
- null值处理：ArrayList和LinkedList都支持存储null值，需要注意空指针异常。
- equals方法：自定义对象需要正确实现equals和hashCode方法，否则可能导致数据丢失。

## ArrayList 实现类
- 动态扩容：当元素数量超过当前容量时，会触发扩容。原来的1.5倍，新容量 = 旧容量 + 旧容量 >> 1
- 有序集合：保持插入顺序
- 允许重复：允许存储重复的元素，同一个对象可以在list中多次出现，也可以存储null值；
- 非线程安全：多线程环境需要外部同步，不支持并发操作。

### 实际应用场景
- 购物车功能（存储用户选择的商品，支持添加、删除、修改数量等操作）
- 学生成绩管理（支持查询、排序、统计等功能）
- 数据过滤转换（对数据进行过滤、映射、排序等操作，配合Stream API使用）
- 分页功能(实现数据分页显示，通过subList方法获取指定范围的元素，即指定页面的数据)

### 注意事项
- ArrayList不是线程安全的，在多线程环境下，如果多个线程同时修改ArrayList，可能会导致数据不一致。解决方案：使用Collections.synchronizedList(new ArrayList<>())或者CopyOnWriteArrayList或者使用显式同步（synchronized关键字）
- 内存管理：删除元素时不会自动缩容，可能造成内存浪费，如果需要释放内存，可以调用trimToSize方法，及时释放不再使用的ArrayList对象，避免内存泄漏问题。
- 不要在迭代时修改ArrayList的结构（删除或添加元素）,否则会导致ConcurrentModificationException异常。应该使用迭代器的remove()方法和removeIf();
- 遍历元素时，建议使用foreach循环或迭代器，而不是传统的for循环，因为foreach循环更简洁、更安全。
### 常用方法
- add(E e): 添加元素到链表末尾。
- add(int index, E e): 在指定位置插入元素。
- get(int index): 获取指定位置的元素。
- remove(int index): 删除指定位置的元素。
- size(): 返回链表的大小（元素数量）。
- isEmpty(): 判断链表是否为空。
- clear(): 清空链表所有元素。
  
## LinkedList 实现类
- 链表结构：每个元素包含数据和前后指针，每个元素之间通过指针连接起来。
- 访问性能：慢o(n)，因为需要遍历链表才能访问到指定位置的元素。
- 插入/删除性能：快o(1)，因为只需要修改前/后一个元素的引用即可。
- 线程安全：非线程安全，多线程环境需要外部同步，不支持并发操作。
- 内存效率：非连续内存存储，每个元素占用额外的空间存储引用。
- 双端队列：实现了Deque接口，可以作为栈和队列使用。
- 适用场景：频繁插入删除操作，不随机访问。
- **实际应用场景**：
  - 缓存：LRU缓存，使用LinkedList实现，将最近使用的元素移到链表头部，将最久未使用的元素移到链表尾部。新访问的元素移到头部；超出容量时删除尾部元素；O(1)时间复杂度的操作；
  - 撤销功能：文本编辑器、图形软件等需要撤销功能时，可以使用linkedList存储操作历史。新操作添加到头部；撤销时从头部删除；支持多级撤销。
  - 任务队列：在多线程环境下，linkedlist可以作为任务队列，支持高效的任务添加和获取。生产者在尾部添加任务，消费者从头部获取任务，O(1)时间复杂度的操作，支持优先级任务插入。
  

接口实现：
```java 
public class LinkedList extends AbstractSequentialList implements List, Deque, Cloneable, java.io.Serializable {
}
```
### 常用方法
- add(E e): 添加元素到链表末尾。
- add(int index, E e): 在指定位置插入元素。
- addFirst(E e): 在链表开头添加元素。
- addLast(E e): 在链表末尾添加元素。
- list.offer(E e):入队（末尾添加）。
- list.offerFirst(E e):入队（开头添加）。
- list.offerLast(E e):入队（末尾添加）。
- get(int index): 获取指定位置的元素。**需要从头或者尾部开始遍历，时间复杂度为O(n)**
- remove(): 删除链表头部的元素。
- remove(int index): 删除指定位置的元素。
- removeFirst(): 删除链表头部的元素。
- removeLast(): 删除链表尾部的元素。
- offer(E e):入队（末尾添加）。
- push(): 入栈（添加到头部）。
- poll(): 出队（删除并返回头部元素）。
- pollFirst(): 出队（删除并返回头部元素）。
- pollLast(): 出队（删除并返回尾部元素）。
- peek(): 获取但不删除链表头部的元素。
- peekFirst(): 获取但不删除链表头部的元素。
- peekLast(): 获取但不删除链表尾部的元素。
- size(): 获取链表的大小（元素数量）。
- isEmpty(): 判断链表是否为空。
- clear(): 清空链表所有元素。
- toArray(): 将链表转换为数组。
- toArray(T[] a): 将链表转换为指定类型的数组。
- clone(): 复制链表。
- equals(Object o): 比较两个链表是否相等。
- hashCode(): 返回链表的哈希值。
- toString(): 返回链表的字符串表示。
## Vector 实现类
- 线程安全：Vector是线程安全的，多个线程可以同时访问Vector对象，不会出现数据不一致的问题。
- 性能：由于线程安全的机制，Vector的性能相对较低，不建议在单线程环境下使用。
- 内存效率：Vector是连续内存存储，每个元素占用额外的空间存储引用。
- 适用场景：多线程环境下需要对共享数据进行安全访问的场景。
- 实际应用场景：
  - 数据库连接池：在多线程环境下，多个线程需要同时访问数据库连接池，Vector可以作为线程安全的连接池实现。
  - 配置文件读取：在多线程环境下，多个线程需要同时读取配置文件，Vector可以作为线程安全的配置文件读取器实现。
  - 共享数据：在多线程环境下，多个线程需要共享数据，Vector可以作为线程安全的共享数据容器实现。
  - 计数器：在多线程环境下，多个线程需要对共享计数器进行操作，Vector可以作为线程安全的计数器实现。
  - 线程池：在多线程环境下，多个线程需要同时执行任务，Vector可以作为线程安全的线程池实现。
  - 消息队列：在多线程环境下，多个线程需要同时发送和接收消息，Vector可以作为线程安全的消息队列实现。
  - 事件通知：在多线程环境下，多个线程需要同时监听和处理事件，Vector可以作为线程安全的事件通知容器实现。
  - 缓存：在多线程环境下，多个线程需要同时访问缓存数据，Vector可以作为线程安全的缓存实现。

Vector类继承自AbstractList类，实现了List接口，因此Vector类也继承了AbstractList类的方法。Vector类提供了线程安全的操作，因此Vector类在多线程环境下可以安全地使用。Vector类提供了一些常用的方法，如add()、get()、remove()、size()、isEmpty()、clear()、toArray()、clone()、equals()、hashCode()、toString()等。

接口实现：
```java 
public class Vector<E> extends AbstractList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
}
```
### ArrayDeque 实现类
- 双端队列：实现了Deque接口，可以作为栈和队列使用。
- 适用场景：频繁插入删除操作，不随机访问。
- 实际应用场景：
  - 缓存：LRU缓存，使用LinkedList实现，将最近使用的元素移到链表头部，将最久未使用的元素移到链表尾部。新访问的元素移到头部；超出容量时删除尾部元素；O(1)时间复杂度的操作；
  - 撤销功能：文本编辑器、图形软件等需要撤销功能时，可以使用linkedList存储操作历史。新操作添加到头部；撤销时从头部删除；支持多级撤销。
  - 任务队列：在多线程环境下，linkedlist可以作为任务队列，支持高效的任务添加和获取。生产者在尾部添加任务，消费者从头部获取任务，O(1)时间复杂度的操作，支持优先级任务插入。
  
接口实现：
```java 
public class LinkedList extends AbstractSequentialList implements List, Deque, Cloneable, java.io.Serializable {
}
```
链表类LinkedList实现了Deque接口，因此LinkedList类也可以作为栈和队列使用。LinkedList类提供了一些常用的方法，如add()、addFirst()、addLast()、getFirst()、getLast()、remove()、removeFirst()、removeLast()、size()、isEmpty()、clear()、toArray()、clone()、equals()、hashCode()、toString()等。
## Set 接口
主要特点 
- 不允许重复元素：set中不能包含两个相等的元素
- 最多包含一个null值：如果set允许null值，最多只能一个null值；
- 无索引访问：set没有索引，不能通过下标访问元素；
- 集合运算：支持并集、交集、差集等数学集合运算。

set实现类对比
| 实现类| 底层实现 |排序特性 | 性能 | 允许null值 | 线程安全 | 索引访问 | 适合场景 |
| --- | --- | --- | --- | --- | --- | --- | --- |
|HashSet | 哈希表 | 无序 | 快 | 允许 | 不安全 | 不允许 | 适用于不重复的元素 |
|TreeSet | 红黑树 | 自然排序 | 慢 | 不允许 | 不安全 | 不允许 | 适用于有序的元素 |
|LinkedHashSet | 哈希表 + 链表 | 插入顺序 | 中等 | 允许 | 不安全 | 不允许 | 适用于有序的元素 |

### HashSet 实现类
高性能特点
- 基于哈希表实现
- 平均时间复杂度为O(1)，查找、插入、删除元素都是O(1)
- 空间效率高，每个元素占用额外的空间存储引用。

无序存储
- 不保证元素的迭代顺序
- 元素位置由哈希值决定
- 适合不关心顺序的场景
- 大多数情况下的首选

### LinkedHashSet 实现类
继承自HashSet类，添加了LinkedHashMap的实现，因此LinkedHashSet类也继承了LinkedHashMap类。
- LinkedHashSet类提供了**有序存储**的集合，迭代时返回的元素顺序与添加的顺序一致。
- 可以预测的迭代顺序，即添加的顺序。
- 适合缓存、历史记录
- 性能略低于HashSet类，因为LinkedHashMap类比HashSet类多一个链表结构，存储元素的顺序。

应用场景
- 浏览历史记录
- 购物车商品去重
- 标签系统
- 需要保持顺序的集合
- 数据库查询结果去重

### TreeSet 实现类
基于红黑树（自平衡二叉搜索树）实现，提供了自动排序功能和丰富的导航功能。

自动排序
- 元素自然排序
- 支持自然排序
- 支持自定义比较器
- O(logN)时间复杂度

导航功能
- first()：返回第一个元素
- last()：返回最后一个元素
- lower(E e)：返回小于e的最大元素
- higher(E e)：返回大于e的最小元素
- floor(E e)：返回小于等于e的最大元素
- subSet(E fromElement, E toElement)：返回指定范围内的元素
- headSet(E toElement)：返回小于指定元素的元素
- tailSet(E fromElement)：返回大于等于指定元素的元素
- smallest()： 获取最小元素

### 性能对比
- 添加操作：HashSet > LinkedHashSet > TreeSet 
- 删除操作：HashSet > LinkedHashSet > TreeSet
- 查找操作：HashSet ~ LinkedHashSet > TreeSet
- 内存使用：HashSet < LinkedHashSet < TreeSet
- 排序需求：只有TreeSet类支持排序，其他类都是无序的。
### 实际应用场景
- 用户权限管理-hashset
- 浏览历史记录-linkedhashset（保持插入顺序）
- 排行榜系统-treeset（需要排序）
- set实现类都不是线程安全的，如果需要线程安全，可以使用Collections.synchronizedSet()方法返回一个同步的set对象。或者使用ConcurrentHashMap类作为基础，创建一个线程安全的set对象。考虑使用并发集合类。
- 重写equals()和hashCode()方法，以实现自定义的比较逻辑。- 创建一个自定义的比较器，并使用TreeSet类实现排序。保证数据的一致性和正确性。
- hashset元素顺序不确定，不要依赖迭代顺序；
- treeset不允许null值，因为它需要使用元素的compareTo()方法进行排序，而null值没有定义的排序顺序。可能会抛出NullPointerException异常。
- 自定义对象必须正确实现equals()和hashCode()方法，否则可能会导致数据不一致。
- 修改已经添加到set中的对象，可能会导致数据不一致。
- 在多线程环境下需要考虑线程安全问题。
  
## Map 接口
主要特点 
- 键（key）必须唯一，值（value）可以重复
- 一个键最多只能映射到一个值
- 键不能为null，值可以为null
- 常用实现类：HashMap、LinkedHashMap、TreeMap、HashTable、ConcurrentHashMap、WeakHashMap、IdentityHashMap
- 提供基于键的快速查询功能
- 不继承Collection接口，继承AbstractMap类

核心方法
| 方法 | 描述 |
| --- | --- |
| put(K key, V value) | 向map中添加一个键值对 |
| get(Object key) | 返回指定键所映射的值 |
| remove(Object key) | 删除指定键所映射的键值对 |
| containsKey(Object key) | 判断map是否包含指定键 |
| containsValue(Object value) | 判断map是否包含指定值 |
| size() | 返回map中键值对的数量 |
| isEmpty() | 判断map是否为空 |
| clear() | 清空map中的所有键值对 |
| keySet() | 返回map中所有键的set集合 |
| values() | 返回map中所有值的collection集合 |
| entrySet() | 返回map中所有键值对的set 集合 |
|putAll(Map<? extends K, ? extends V> m) | 将m中的所有键值对添加到当前map中 |

### HashMap 实现类
- HashMap类基于哈希表实现，使用哈希函数将键映射到数组中的索引位置，并使用链表解决冲突。
- 线程不安全，不保证迭代顺序。
- 允许null键和null值。
- 初始容量为16，加载因子为0.75。
- 当元素数量超过容量*加载因子时，会触发扩容操作，将容量翻倍。
- 扩容时需要重新计算哈希值，可能会导致性能下降。
- 不支持同步，多线程环境下需要使用ConcurrentHashMap类。
  
### LinkedHashMap 实现类
- LinkedHashMap类基于哈希表和链表实现，继承自HashMap类。
- 线程不安全，保证迭代顺序，维护插入或访问顺序。
- 允许null键和null值。
- 初始容量为16，加载因子为0.75。
- 当元素数量超过容量*加载因子时，会触发扩容操作，将容量翻倍。
- 扩容时需要重新计算哈希值，可能会导致性能下降。
- 不支持同步，多线程环境下需要使用ConcurrentHashMap类。
- 迭代顺序与插入顺序一致，适合需要保持顺序的场景。
  
```java
//创建一个按访问顺序排序的LinkedHashMap对象
LinkedHashMap<String, String>
linkedHashMap = new LinkedHashMap<>(16, 0.75f, true);
linkedHashMap.put("key1", "value1");
```

### TreeMap 实现类
- TreeMap类基于红黑树实现，继承自AbstractMap类。
- 线程不安全，不保证迭代顺序。
- 不允许null键，允许null值。
- 初始容量为16，加载因子为0.75。
- 当元素数量超过容量*加载因子时，会触发扩容操作，将容量翻倍。
- 扩容时需要重新计算哈希值，可能会导致性能下降。
- 不支持同步，多线程环境下需要使用ConcurrentHashMap类。
- 迭代顺序与键的自然顺序一致，或者根据自定义的比较器顺序。
  
### 性能对比
| 操作 | HashMap | LinkedHashMap | TreeMap |
| --- | --- | --- | --- |
| 添加操作 | O(1) | O(1) | O(logN) |
| 删除操作 | O(1) | O(1) | O(logN) |
| 查找操作 | O(1) | O(1) | O(logN) |
| 内存使用 | 小 | 中 | 大 |
| 排序需求 | 无 | 无 | 有 |
| 遍历 | o(n) | o(n) | o(n) |
|空间复杂度 | o(n) | o(n)+链表开销 | o(n) +树结构开销|

- HashMap类性能高，适合大多数场景。
- LinkedHashMap类性能中等，适合需要保持插入顺序的场景或实现lru缓存场景。
- TreeMap类性能低，适合需要排序和范围查询的场景。

### Map使用建议
- 使用接口类型声明变量：Map<String, Integer> map = new HashMap<>();
- 重写equals()和hashCode()方法，以实现自定义的比较逻辑。
- 使用不可变对象作为键值，避免重复创建对象。
- 合理设置初始容量避免频繁扩容
- 使用computeIfAbsent()方法，避免重复创建对象。
- 在多线程环境使用ConcurrentHashMap类。
- 遍历时不要修改map结构
- 过度使用treemap，可能会导致性能下降。

## Queue 接口
主要特点 
- 队列是一种先进先出（FIFO）的数据结构，即先进入的元素先出。
- 双端操作：支持在队头和队尾进行操作。
- 多种实现：LinkedList、ArrayDeque、PriorityQueue
- 线程安全选项：普通queue实现是线程不安全的。

### 主要方法
| 方法 | 描述 |异常处理 |
| --- | --- | --- |
| add(E e) | 向队尾添加元素，如果队列已满，则抛出异常 | IllegalStateException |
| offer(E e) | 向队尾添加元素，如果队列已满，则返回false |  |
| remove() | 删除并返回队头元素，如果队列为空，则抛出异常 | NoSuchElementException |
| poll() | 删除并返回队头元素，如果队列为空，则返回null |  |
| element() | 返回队头元素，但不删除，如果队列为空，则抛出异常 | NoSuchElementException |
| peek() | 返回队头元素，但不删除，如果队列为空，则返回null |  |

### LinkedList 实现类
- LinkedList类基于双向链表实现，支持在队头和队尾进行操作，支持null元素。
- 插入删除效率高，内存动态分配
- 频繁插入删除操作的场景

### ArrayDeque 实现类
- ArrayDeque类基于动态数组实现，支持在队头和队尾进行操作，不支持null元素。
- 插入删除效率高，内存连续分配
- 一般队列操作的首选。

### PriorityQueue 实现类
- PriorityQueue类基于二叉堆实现，支持在队头和队尾进行操作，不支持null元素。
- 自动按优先级排序
- 适合优先级队列场景

### 选择建议
- 一般用途：ArrayDeque
- 需要null元素：LinkedList
- 优先级队列：PriorityQueue
- 线程安全：ArrayBlockingQueue 或 LinkedBlockingQueue
- 优先使用offer/poll/peek：这些方法提供更好的错误处理
- 选择合适的实现类：根据具体需求选择合适的实现；
- 考虑线程安全：多线程环境下使用并发安全的实现；
- 合理设置容量：对于有界队列，设置合适的容量限制
- ArrayDeque和PriorityQueue不支持null元素;
- LinkedList在某些场景下性能较差
- PriorityQueue的内部排序会消耗额外资源



### 实际应用场景
- 任务调度系统：使用PriorityQueue实现优先级队列
- 广度优先搜索（bfs）：使用linkedlist实现队列
- 缓冲区管理：使用linkedlist实现循环缓冲区。

## Iterator 接口
Iterator迭代器是java集合框架中用于遍历集合元素的标准接口，它提供了一种统一的方式来访问集合中的元素，不需要了解集合的内部结构。Iterator模式是一种设计模式，它将遍历逻辑从集合类中分离出来，使得遍历操作更灵活和安全。

核心优势
- 统一访问接口：Iterator接口定义了访问集合元素的标准接口，无论集合是数组、链表、树、集合等，都可以使用Iterator接口进行遍历。
- 安全删除：Iterator接口提供了remove()方法，用于删除当前迭代器指向的元素。
- fail-fast机制：Iterator接口的fail-fast机制，即在遍历过程中如果集合被修改，则抛出ConcurrentModificationException异常。
- 内存效率：不需要额外的索引变量，适合大型集合。

### Iterator接口方法
| 方法 | 描述 |
| --- | --- |
| boolean hasNext() | 判断集合中是否有下一个元素 |
| E next() | 返回集合中的下一个元素 |
| void remove() | 删除当前迭代器指向的元素 |

- 单向遍历（只能向前）
- 适用于所有collection子类
- 支持安全删除操作
- fail-fast机制保证线程安全

### ListIterator 接口
ListIterator接口是Iterator接口的子接口，它扩展了Iterator接口，提供了额外的方法，用于双向遍历列表。ListIterator接口提供了hasPrevious()、previous()、nextIndex()和previousIndex()方法，用于获取当前迭代器的位置。
- 双向遍历（向前和向后）
- 仅适用于List集合
- 支持安全删除、添加、修改操作
- 提供索引信息

### 增强for循环
在Java中，增强for循环（for-each loop）是java 5中引入的一种语法糖，用于遍历数组或集合中的元素。它的主要作用是简化迭代过程，并提高代码可读性。
- 语法：for(元素类型 变量名 : 数组或集合) {}
- 适用于只读遍历
- 编译时自动转换为Iterator
- 不能在遍历中删除或添加元素
- 对于基本数据类型数组，修改循环变量不会影响原数组
- 只能单向遍历。

#### 遍历方式性能比较
| 遍历方式 | 适用集合 | ArrayList性能 | LinkedList性能 | 可读性 |功能特点 |
| --- | --- | --- | --- | --- | --- |
| 普通for循环 | 所有collection子类 | 快 | 慢 | 高 | 支持索引操作,可修改 |
| 增强for循环 | 所有collection子类 | 快 | 慢 | 高 | 简单语法，不支持索引操作，只读遍历 |
| Iterator | 所有collection子类 | 快 | 慢 | 高 | 支持安全删除操作 |
| ListIterator | List集合 | 快 | 慢 | 中 | 支持双向遍历 |
| StreamAPI | 所有collection子类 | 快 | 慢 | 高 | 函数式编程风格，支持并行处理 |

- ArrayList:支持随机访问，传统for循环性能最佳；
- LinkedList:链表结构，索引访问需要遍历，Iterator效率较高；
- HashSet/TreeSet:不支持索引访问，只能使用Iterator或增强for循环遍历；
- 大数据集：性能差异更加明显，选择合适的遍历方式很重要。
- 使用removeIf()方法删除满足条件的元素，避免使用传统for循环删除。

### 什么时候使用Iterator而不是增强for循环
当需要在遍历过程中删除元素时，或者需要更精细的遍历控制时，应该使用Iterator接口。增强for循环只适合只读遍历。
### ListIterator和Iterator的区别
- ListIterator：仅适用于List集合，提供双向遍历和修改操作。
- Iterator：适用于所有collection子类，提供单向遍历和安全删除操作。
### 为什么LinkedList不应该使用索引访问
LinkedList是链表结构，索引访问需要从头开始遍历到指定位置，时间复杂度为O(n)。在循环中使用索引访问会导致o(n^2)的时间复杂度，性能很差。
### 增强for循环到内部实现是什么？
增强for循环在编译时会被转换成Iterator迭代器，因此它的性能与Iterator相同。内部实现是基于迭代器（Iterator）的，通过自动处理迭代细节简化代码。核心机制是遍历可迭代对象（如集合或数组）时，隐式调用iterator().next()方法获取元素。

不能修改集合结构的原因是：迭代器的fail-fast机制：增强for循环依赖集合的迭代器，而迭代器内部维护一个expectedModCount变量（记录集合结构的修改次数），若在遍历过程中直接修改集合（如调用list.add()或者list.remove()），会导致迭代器的expectedModCount与集合实际modCount不一致，触发ConcurrentModificationException异常。