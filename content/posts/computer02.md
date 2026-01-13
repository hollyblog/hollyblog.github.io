---
title: "计算机基础：数据结构与算法"
date: 2021-12-06T13:18:17+08:00
draft: false
description: "数据结构与算法是计算机基础中的重要内容，主要分享对数据结构的基本原理和功能，以及算法的工作原理和实现。"
tags: ["计算机基础", "数据结构", "算法"]
categories: ["Computer"]
---

## 1. 模块总览
对于3年经验的开发者，**数据结构与算法复习重点应聚焦于数组/链表、栈/队列、树（二叉树、红黑树）、图、排序与查找算法，以及算法设计思想（分治、动态规划、贪心、回溯），面试分值占比高达40-50%，是进入大厂的敲门砖。**

## 2. 面试题清单（Top10高频真题）

| 排名 | 题目 | 高频出现公司 |
|------|------|-------------|
| 1 | 链表相关（反转、环检测、合并、倒数第K个） | 所有大厂 |
| 2 | 二叉树相关（遍历、深度、最近公共祖先、重建） | 阿里/字节/腾讯 |
| 3 | 排序算法（快排、归并、堆排序）及其优化 | 所有大厂 |
| 4 | 二分查找及其变种（旋转数组、边界查找） | 字节/美团/阿里 |
| 5 | 动态规划（背包、最长公共子序列、爬楼梯） | 腾讯/阿里/字节 |
| 6 | 栈和队列的应用（最小栈、用栈实现队列） | 美团/京东 |
| 7 | 字符串处理（KMP、最长回文子串、字符串转换） | 字节/腾讯 |
| 8 | 图算法（DFS、BFS、最短路径、拓扑排序） | 百度/阿里 |
| 9 | 哈希表与双指针（两数之和、三数之和、滑动窗口） | 所有大厂 |
| 10 | 设计题（LRU、LFU、数据结构设计） | 阿里/字节/美团 |

## 3. 逐题深度拆解

### **题目1：链表相关（反转、环检测、合并、倒数第K个）**

#### 原理
**链表核心操作与技巧**：
![链表核心操作与技巧](img/computer02-1.png)

**关键算法模板**：
```java
// 1. 反转链表（迭代法）
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// 2. 检测环并找到入口（Floyd判圈算法）
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    // 第一阶段：判断是否有环
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {  // 相遇，有环
            // 第二阶段：找到环的入口
            ListNode ptr1 = head;
            ListNode ptr2 = slow;
            while (ptr1 != ptr2) {
                ptr1 = ptr1.next;
                ptr2 = ptr2.next;
            }
            return ptr1;
        }
    }
    return null;
}

// 3. 合并两个有序链表
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }
    curr.next = l1 != null ? l1 : l2;
    return dummy.next;
}
```

#### 场景
**LRU缓存淘汰算法中的链表应用**：
- 使用双向链表维护访问顺序，最近访问的移到头部，淘汰尾部
- 哈希表提供O(1)查找，链表提供O(1)插入删除
- 实际应用：Redis内存淘汰策略、浏览器缓存

#### 追问
**Q：如何找到链表的倒数第K个节点？**
- 快慢指针：快指针先走K步，然后快慢指针一起走，当快指针到末尾时，慢指针指向倒数第K个
- 注意边界条件：K可能大于链表长度

**Q：如何判断两个链表是否相交？**
1. 方法一：哈希表记录访问过的节点
2. 方法二：双指针，分别遍历两个链表，到达末尾后切换到另一个链表头部继续遍历，最终会在相交点相遇（a + b + c = b + a + c）

#### 总结
链表操作的核心是掌握指针操作和虚拟头节点技巧，环检测使用快慢指针，合并与反转注意指针顺序。


#### 原理层：链表的内存模型与操作本质

##### 1. 链表在内存中的真实布局
```java
// Java中的链表节点内存表示
public class ListNode {
    int val;        // 4字节（假设int）
    ListNode next;  // 8字节（64位JVM，引用类型）
    // 对象头：12字节（压缩指针）或16字节
    // 对齐填充：可能4字节
    // 总内存：约24-32字节/节点
}

// 单链表在内存中的物理分布（不连续！）
地址: 0x1000 [val=1, next=0x2000] → 0x2000 [val=2, next=0x3000] → 0x3000 [val=3, next=null]
      节点1（堆地址随机）             节点2（堆地址随机）             节点3（堆地址随机）

// 对比数组的连续内存
地址: 0x1000 [1] 0x1004 [2] 0x1008 [3]  // 连续！
```

##### 2. 链表操作的时间复杂度本质
```java
public class LinkedListComplexity {
    // 操作         数组     链表（单）  链表（双）
    // 访问索引     O(1)     O(n)      O(n)      ← 链表需要遍历
    // 插入头部     O(n)*    O(1)      O(1)      ← *数组需要移动元素
    // 插入尾部     O(1)     O(n)**   O(1)**    ← **单链表需要遍历，双链表有尾指针时O(1)
    // 删除中间     O(n)     O(n)      O(n)      ← 都需要找到位置
    // 空间开销     低        高        更高       ← 链表有指针开销
}
```

#### 场景层：四大经典问题的Java实现

##### 问题1：反转链表（Iterative + Recursive）
```java
// ✅ 经典实现：迭代反转（三指针法）
public class ReverseLinkedList {
    
    // 方法1：迭代法（最常用）
    public ListNode reverseIterative(ListNode head) {
        ListNode prev = null;    // 前驱节点
        ListNode curr = head;    // 当前节点
        ListNode next = null;    // 后继节点（临时保存）
        
        while (curr != null) {
            // 1. 保存下一个节点（防止丢失）
            next = curr.next;
            
            // 2. 反转指针
            curr.next = prev;
            
            // 3. 移动指针
            prev = curr;
            curr = next;
        }
        
        return prev; // 新的头节点
    }
    
    // 内存分析：迭代反转
    public void memoryAnalysis() {
        // 原始链表：1 → 2 → 3 → 4 → null
        // 迭代过程：
        // prev=null, curr=1, next=2 → curr.next=null → prev=1, curr=2
        // prev=1, curr=2, next=3 → curr.next=1 → prev=2, curr=3
        // prev=2, curr=3, next=4 → curr.next=2 → prev=3, curr=4
        // prev=3, curr=4, next=null → curr.next=3 → prev=4, curr=null
        // 返回prev=4
        // 结果：4 → 3 → 2 → 1 → null
        
        // 空间复杂度：O(1)，只用了3个指针
        // 时间复杂度：O(n)，遍历一次
    }
    
    // 方法2：递归法（理解递归调用栈）
    public ListNode reverseRecursive(ListNode head) {
        // 递归终止条件：空链表或只有一个节点
        if (head == null || head.next == null) {
            return head;
        }
        
        // 递归反转后续链表
        ListNode newHead = reverseRecursive(head.next);
        
        // 将当前节点接在反转后的链表尾部
        head.next.next = head;  // 关键：让下一个节点指向自己
        head.next = null;       // 断开原来的连接
        
        return newHead;
    }
    
    // 递归深度分析
    public void recursionDepth() {
        // 链表：1 → 2 → 3 → 4 → null
        // 递归调用栈：
        // reverse(1) 等待 reverse(2) 的结果
        // reverse(2) 等待 reverse(3) 的结果  
        // reverse(3) 等待 reverse(4) 的结果
        // reverse(4) 返回 4（base case）
        // reverse(3) 执行：3.next.next=3 → 4.next=3, 3.next=null → 返回4
        // reverse(2) 执行：2.next.next=2 → 3.next=2, 2.next=null → 返回4
        // reverse(1) 执行：1.next.next=1 → 2.next=1, 1.next=null → 返回4
        
        // 空间复杂度：O(n)（递归栈深度）
        // 时间复杂度：O(n)
        // 风险：长链表可能导致栈溢出
    }
    
    // 方法3：头插法（新建链表）
    public ListNode reverseByInsert(ListNode head) {
        ListNode dummy = new ListNode(0);  // 哑节点
        ListNode curr = head;
        
        while (curr != null) {
            ListNode next = curr.next;  // 保存下一个
            // 头插到新链表
            curr.next = dummy.next;
            dummy.next = curr;
            curr = next;
        }
        
        return dummy.next;
    }
}
```

##### 问题2：检测链表环（Floyd判圈算法）
```java
// ✅ 快慢指针法（Floyd's Cycle Detection Algorithm）
public class DetectCycle {
    
    // 方法1：检测是否有环
    public boolean hasCycle(ListNode head) {
        if (head == null || head.next == null) {
            return false;
        }
        
        ListNode slow = head;  // 慢指针，每次走1步
        ListNode fast = head;  // 快指针，每次走2步
        
        while (fast != null && fast.next != null) {
            slow = slow.next;          // 慢指针走1步
            fast = fast.next.next;     // 快指针走2步
            
            if (slow == fast) {        // 相遇说明有环
                return true;
            }
        }
        
        return false;  // 快指针走到null说明无环
    }
    
    // 数学原理证明
    public class FloydProof {
        /*
        假设：
        - 环外长度：a（从头到环入口）
        - 环周长：b
        - 相遇点距离环入口：c
        - 慢指针步数：s
        - 快指针步数：f = 2s（快指针速度是慢指针2倍）
        
        相遇时：
        慢指针走了：s = a + n1*b + c  (n1圈)
        快指针走了：f = a + n2*b + c  (n2圈)
        
        由于 f = 2s，所以：
        2(a + n1*b + c) = a + n2*b + c
        a + c = (n2 - 2n1)*b
        
        结论：a + c 是环周长b的整数倍！
        这意味着：从相遇点走a步会回到环入口
        */
    }
    
    // 方法2：找到环的入口节点
    public ListNode detectCycle(ListNode head) {
        if (head == null || head.next == null) {
            return null;
        }
        
        // 第一阶段：判断是否有环，找到相遇点
        ListNode slow = head;
        ListNode fast = head;
        boolean hasCycle = false;
        
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            
            if (slow == fast) {
                hasCycle = true;
                break;
            }
        }
        
        if (!hasCycle) {
            return null;
        }
        
        // 第二阶段：找到环入口
        // 根据数学推导：从相遇点走a步到入口 = 从头走a步到入口
        ListNode ptr1 = head;      // 从头开始
        ListNode ptr2 = slow;      // 从相遇点开始
        
        while (ptr1 != ptr2) {
            ptr1 = ptr1.next;
            ptr2 = ptr2.next;
        }
        
        return ptr1;  // 环入口
    }
    
    // 方法3：使用哈希表（空间换时间）
    public ListNode detectCycleWithHash(ListNode head) {
        Set<ListNode> visited = new HashSet<>();
        ListNode curr = head;
        
        while (curr != null) {
            if (visited.contains(curr)) {
                return curr;  // 找到环入口
            }
            visited.add(curr);
            curr = curr.next;
        }
        
        return null;  // 无环
    }
    
    // 对比分析
    public class Comparison {
        /*
        快慢指针法：
        优点：空间O(1)，不需要额外内存
        缺点：数学推导复杂，需要理解证明
        时间复杂度：O(n)
        
        哈希表法：
        优点：直观易懂
        缺点：空间O(n)，需要存储所有节点
        时间复杂度：O(n)
        
        实际应用：
        - 内存受限：用快慢指针
        - 调试/测试：用哈希表验证
        - 面试：先讲哈希表，再优化到快慢指针
        */
    }
}
```

##### 问题3：合并两个有序链表
```java
// ✅ 合并有序链表（递归+迭代）
public class MergeSortedLists {
    
    // 方法1：迭代法（推荐）
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(-1);  // 哑节点，简化边界处理
        ListNode tail = dummy;              // 尾指针
        
        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val) {
                tail.next = l1;
                l1 = l1.next;
            } else {
                tail.next = l2;
                l2 = l2.next;
            }
            tail = tail.next;  // 移动尾指针
        }
        
        // 连接剩余部分
        tail.next = (l1 != null) ? l1 : l2;
        
        return dummy.next;  // 跳过哑节点
    }
    
    // 内存优化：不使用哑节点
    public ListNode mergeWithoutDummy(ListNode l1, ListNode l2) {
        if (l1 == null) return l2;
        if (l2 == null) return l1;
        
        ListNode head = null;
        ListNode tail = null;
        
        // 确定头节点
        if (l1.val <= l2.val) {
            head = l1;
            l1 = l1.next;
        } else {
            head = l2;
            l2 = l2.next;
        }
        tail = head;
        
        // 合并剩余部分
        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val) {
                tail.next = l1;
                l1 = l1.next;
            } else {
                tail.next = l2;
                l2 = l2.next;
            }
            tail = tail.next;
        }
        
        tail.next = (l1 != null) ? l1 : l2;
        return head;
    }
    
    // 方法2：递归法
    public ListNode mergeRecursive(ListNode l1, ListNode l2) {
        // 递归终止条件
        if (l1 == null) return l2;
        if (l2 == null) return l1;
        
        if (l1.val <= l2.val) {
            l1.next = mergeRecursive(l1.next, l2);
            return l1;
        } else {
            l2.next = mergeRecursive(l1, l2.next);
            return l2;
        }
    }
    
    // 递归调用栈分析
    public void recursionAnalysis() {
        /*
        示例：合并 1→3→5 和 2→4→6
        merge(1,2): 1 < 2 → 1.next = merge(3,2)
        merge(3,2): 3 > 2 → 2.next = merge(3,4)
        merge(3,4): 3 < 4 → 3.next = merge(5,4)
        merge(5,4): 5 > 4 → 4.next = merge(5,6)
        merge(5,6): 5 < 6 → 5.next = merge(null,6)
        merge(null,6): 返回6
        回溯：5.next=6 → 返回5
        回溯：4.next=5 → 返回4
        回溯：3.next=4 → 返回3
        回溯：2.next=3 → 返回2
        回溯：1.next=2 → 返回1
        
        结果：1→2→3→4→5→6
        */
    }
    
    // 合并K个有序链表（进阶）
    public ListNode mergeKLists(ListNode[] lists) {
        if (lists == null || lists.length == 0) {
            return null;
        }
        
        // 方法1：顺序合并（时间复杂度高）
        ListNode result = null;
        for (ListNode list : lists) {
            result = mergeTwoLists(result, list);
        }
        return result;
        
        // 方法2：分治法（推荐）
        // return mergeKListsDivideConquer(lists, 0, lists.length - 1);
        
        // 方法3：优先队列（小顶堆）
        // return mergeKListsPriorityQueue(lists);
    }
    
    // 分治法合并K个链表
    private ListNode mergeKListsDivideConquer(ListNode[] lists, int left, int right) {
        if (left == right) {
            return lists[left];
        }
        if (left > right) {
            return null;
        }
        
        int mid = left + (right - left) / 2;
        ListNode l1 = mergeKListsDivideConquer(lists, left, mid);
        ListNode l2 = mergeKListsDivideConquer(lists, mid + 1, right);
        
        return mergeTwoLists(l1, l2);
    }
}
```

##### 问题4：找到倒数第K个节点
```java
// ✅ 快慢指针/双指针法
public class FindKthFromEnd {
    
    // 方法1：一次遍历（快慢指针）
    public ListNode findKthFromEnd(ListNode head, int k) {
        if (head == null || k <= 0) {
            return null;
        }
        
        ListNode fast = head;
        ListNode slow = head;
        
        // 快指针先走k步
        for (int i = 0; i < k; i++) {
            if (fast == null) {
                return null;  // k大于链表长度
            }
            fast = fast.next;
        }
        
        // 快慢指针同时前进
        while (fast != null) {
            fast = fast.next;
            slow = slow.next;
        }
        
        return slow;  // 慢指针指向倒数第k个
    }
    
    // 原理分析
    public class PrincipleAnalysis {
        /*
        假设链表长度n，要找到倒数第k个节点（即正数第n-k+1个）
        
        方法：让快指针先走k步，然后快慢指针一起走
        当快指针走到null时，快指针走了n步，慢指针走了n-k步
        慢指针的位置就是倒数第k个节点
        
        距离关系：
        快指针：走了k + (n-k) = n步
        慢指针：走了n-k步
        正好是倒数第k个
        
        示例：链表 1→2→3→4→5，k=2
        快指针先走2步：fast=3, slow=1
        同时前进：fast=4, slow=2
        同时前进：fast=5, slow=3  
        同时前进：fast=null, slow=4
        返回slow=4（倒数第2个）
        */
    }
    
    // 方法2：两次遍历（先求长度）
    public ListNode findKthFromEndTwoPass(ListNode head, int k) {
        if (head == null || k <= 0) {
            return null;
        }
        
        // 第一次遍历：求链表长度
        int length = 0;
        ListNode curr = head;
        while (curr != null) {
            length++;
            curr = curr.next;
        }
        
        // 检查k是否合法
        if (k > length) {
            return null;
        }
        
        // 第二次遍历：找到第(length-k+1)个节点
        curr = head;
        for (int i = 0; i < length - k; i++) {
            curr = curr.next;
        }
        
        return curr;
    }
    
    // 对比分析
    public class Comparison {
        /*
        快慢指针法（一次遍历）：
        优点：只需要遍历一次链表
        缺点：需要处理边界条件（k>链表长度）
        
        两次遍历法：
        优点：逻辑简单，容易理解
        缺点：需要遍历两次链表
        
        空间复杂度：都是O(1)
        时间复杂度：都是O(n)
        
        实际应用：
        - 通常使用快慢指针法（一次遍历更高效）
        - 当链表长度已知时，可用两次遍历法
        */
    }
    
    // 删除倒数第K个节点（LeetCode 19）
    public ListNode removeKthFromEnd(ListNode head, int k) {
        ListNode dummy = new ListNode(0, head);  // 哑节点，处理删除头节点的情况
        ListNode fast = dummy;
        ListNode slow = dummy;
        
        // 快指针先走k+1步（因为要找到要删除节点的前一个）
        for (int i = 0; i <= k; i++) {
            if (fast == null) {
                return head;  // k超出范围
            }
            fast = fast.next;
        }
        
        // 快慢指针同时前进
        while (fast != null) {
            fast = fast.next;
            slow = slow.next;
        }
        
        // 删除节点
        slow.next = slow.next.next;
        
        return dummy.next;  // 返回新头节点
    }
}
```

#### 追问层：面试官连环炮

##### 追问1：如何在一次遍历中找到链表的中间节点？
**参考答案**：

```java
public class FindMiddleNode {
    
    // 方法：快慢指针（slow每次1步，fast每次2步）
    public ListNode findMiddle(ListNode head) {
        if (head == null) {
            return null;
        }
        
        ListNode slow = head;
        ListNode fast = head;
        
        while (fast != null && fast.next != null) {
            slow = slow.next;          // 慢指针走1步
            fast = fast.next.next;     // 快指针走2步
        }
        
        return slow;  // 中间节点
    }
    
    // 细节分析
    public class DetailAnalysis {
        /*
        链表长度分奇偶两种情况：
        
        奇数长度：1→2→3→4→5
        slow:1 fast:1
        slow:2 fast:3
        slow:3 fast:5
        fast.next=null → 停止，slow=3（正中间）
        
        偶数长度：1→2→3→4
        slow:1 fast:1
        slow:2 fast:3
        slow:3 fast:null → 停止，slow=3（中间偏右）
        
        如果要中间偏左：
        while (fast.next != null && fast.next.next != null)
        这样fast停在倒数第二个，slow就是中间偏左
        */
    }
    
    // 找到中间偏左的节点
    public ListNode findMiddleLeft(ListNode head) {
        if (head == null || head.next == null) {
            return head;
        }
        
        ListNode slow = head;
        ListNode fast = head;
        
        // fast.next和fast.next.next都不为空时才前进
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        
        return slow;
    }
    
    // 应用场景：归并排序链表
    public ListNode mergeSort(ListNode head) {
        if (head == null || head.next == null) {
            return head;
        }
        
        // 找到中间节点并断开
        ListNode middle = findMiddleLeft(head);
        ListNode nextOfMiddle = middle.next;
        middle.next = null;
        
        // 递归排序左右两半
        ListNode left = mergeSort(head);
        ListNode right = mergeSort(nextOfMiddle);
        
        // 合并有序链表
        return mergeTwoLists(left, right);
    }
}
```

##### 追问2：如何判断两个链表是否相交？找到交点？
**参考答案**：

```java
public class IntersectionOfLinkedLists {
    
    // 方法1：哈希表法（空间O(n)）
    public ListNode getIntersectionNodeHash(ListNode headA, ListNode headB) {
        Set<ListNode> visited = new HashSet<>();
        
        // 遍历链表A，存储所有节点
        ListNode curr = headA;
        while (curr != null) {
            visited.add(curr);
            curr = curr.next;
        }
        
        // 遍历链表B，检查是否在哈希表中
        curr = headB;
        while (curr != null) {
            if (visited.contains(curr)) {
                return curr;  // 找到交点
            }
            curr = curr.next;
        }
        
        return null;  // 没有交点
    }
    
    // 方法2：双指针法（空间O(1)）
    public ListNode getIntersectionNodeTwoPointers(ListNode headA, ListNode headB) {
        if (headA == null || headB == null) {
            return null;
        }
        
        ListNode pA = headA;
        ListNode pB = headB;
        
        // 关键：两个指针都走 m+n 步
        while (pA != pB) {
            // 当pA走到末尾时，转向链表B的头
            pA = (pA == null) ? headB : pA.next;
            // 当pB走到末尾时，转向链表A的头
            pB = (pB == null) ? headA : pB.next;
        }
        
        return pA;  // 要么是交点，要么是null（不相交）
    }
    
    // 数学证明
    public class MathematicalProof {
        /*
        设：
        - 链表A独有部分长度：a
        - 链表B独有部分长度：b
        - 公共部分长度：c
        
        指针pA走的路径：a + c + b
        指针pB走的路径：b + c + a
        
        两者相等，所以会在交点相遇（如果存在）
        
        如果没有交点（c=0）：
        pA走的路径：a + b
        pB走的路径：b + a
        最终都会走到null，循环结束
        
        示例：
        A: 1→2→3→4→5
                   ↘
                    6→7→8
                   ↗
        B:    9→10
        
        步骤：
        pA:1,2,3,4,5,6,7,8,null,9,10,6
        pB:9,10,6,7,8,null,1,2,3,4,5,6
        
        在第12步相遇于节点6
        */
    }
    
    // 方法3：长度对齐法
    public ListNode getIntersectionNodeByLength(ListNode headA, ListNode headB) {
        // 1. 计算两个链表的长度
        int lenA = getLength(headA);
        int lenB = getLength(headB);
        
        // 2. 长的链表先走差值步
        ListNode pA = headA;
        ListNode pB = headB;
        
        if (lenA > lenB) {
            for (int i = 0; i < lenA - lenB; i++) {
                pA = pA.next;
            }
        } else {
            for (int i = 0; i < lenB - lenA; i++) {
                pB = pB.next;
            }
        }
        
        // 3. 同时前进，比较节点
        while (pA != null && pB != null) {
            if (pA == pB) {
                return pA;
            }
            pA = pA.next;
            pB = pB.next;
        }
        
        return null;
    }
    
    private int getLength(ListNode head) {
        int length = 0;
        ListNode curr = head;
        while (curr != null) {
            length++;
            curr = curr.next;
        }
        return length;
    }
}
```

##### 追问3：如何判断链表是否回文？
**参考答案**：

```java
public class PalindromeLinkedList {
    
    // 方法1：栈+快慢指针（O(n)时间，O(n)空间）
    public boolean isPalindromeWithStack(ListNode head) {
        if (head == null || head.next == null) {
            return true;
        }
        
        // 找到中间节点
        ListNode slow = head;
        ListNode fast = head;
        Stack<Integer> stack = new Stack<>();
        
        // 将前半部分压入栈
        while (fast != null && fast.next != null) {
            stack.push(slow.val);
            slow = slow.next;
            fast = fast.next.next;
        }
        
        // 处理奇数长度：跳过中间节点
        if (fast != null) {
            slow = slow.next;
        }
        
        // 比较后半部分和栈中元素
        while (slow != null) {
            if (stack.pop() != slow.val) {
                return false;
            }
            slow = slow.next;
        }
        
        return true;
    }
    
    // 方法2：反转后半部分（O(n)时间，O(1)空间）
    public boolean isPalindromeReverse(ListNode head) {
        if (head == null || head.next == null) {
            return true;
        }
        
        // 1. 找到中间节点
        ListNode middle = findMiddle(head);
        
        // 2. 反转后半部分
        ListNode secondHalf = reverseList(middle.next);
        
        // 3. 比较前半部分和反转后的后半部分
        ListNode p1 = head;
        ListNode p2 = secondHalf;
        boolean result = true;
        
        while (result && p2 != null) {
            if (p1.val != p2.val) {
                result = false;
            }
            p1 = p1.next;
            p2 = p2.next;
        }
        
        // 4. 恢复链表（可选）
        middle.next = reverseList(secondHalf);
        
        return result;
    }
    
    // 方法3：递归法（O(n)时间，O(n)空间-递归栈）
    private ListNode frontPointer;
    
    public boolean isPalindromeRecursive(ListNode head) {
        frontPointer = head;
        return recursivelyCheck(head);
    }
    
    private boolean recursivelyCheck(ListNode currentNode) {
        if (currentNode != null) {
            // 递归到链表末尾
            if (!recursivelyCheck(currentNode.next)) {
                return false;
            }
            // 回溯时比较
            if (currentNode.val != frontPointer.val) {
                return false;
            }
            frontPointer = frontPointer.next;
        }
        return true;
    }
    
    // 递归分析
    public class RecursionAnalysis {
        /*
        链表：1→2→3→2→1
        
        递归调用栈：
        recursivelyCheck(1) → recursivelyCheck(2) → recursivelyCheck(3) 
        → recursivelyCheck(2) → recursivelyCheck(1) → recursivelyCheck(null)
        
        回溯过程：
        recursivelyCheck(null) 返回 true
        recursivelyCheck(1): frontPointer=1, currentNode=1 → 1==1 → frontPointer=2 → true
        recursivelyCheck(2): frontPointer=2, currentNode=2 → 2==2 → frontPointer=3 → true
        recursivelyCheck(3): frontPointer=3, currentNode=3 → 3==3 → frontPointer=null → true
        回溯：recursivelyCheck(2): frontPointer=null → false? 实际上已经比较完了
        
        注意：这种方法会遍历整个链表，空间复杂度O(n)
        */
    }
    
    // 性能对比
    public class PerformanceComparison {
        /*
        方法1（栈+快慢指针）：
        优点：容易理解，代码简单
        缺点：需要O(n)额外空间
        
        方法2（反转后半部分）：
        优点：空间O(1)，满足进阶要求
        缺点：需要修改链表（可恢复）
        
        方法3（递归）：
        优点：代码简洁
        缺点：空间O(n)（递归栈），可能栈溢出
        
        实际面试：
        1. 先给出方法1（栈）
        2. 优化到方法2（反转）
        3. 如果面试官要求，给出方法3（递归）
        */
    }
}
```

##### 追问4：如何复制带随机指针的链表（LeetCode 138）？
**参考答案**：

```java
public class CopyListWithRandomPointer {
    
    class Node {
        int val;
        Node next;
        Node random;
        
        public Node(int val) {
            this.val = val;
            this.next = null;
            this.random = null;
        }
    }
    
    // 方法1：哈希表法（两次遍历，空间O(n)）
    public Node copyRandomListHashMap(Node head) {
        if (head == null) {
            return null;
        }
        
        Map<Node, Node> map = new HashMap<>();
        
        // 第一次遍历：创建所有新节点，建立原节点->新节点的映射
        Node curr = head;
        while (curr != null) {
            map.put(curr, new Node(curr.val));
            curr = curr.next;
        }
        
        // 第二次遍历：设置next和random指针
        curr = head;
        while (curr != null) {
            Node newNode = map.get(curr);
            newNode.next = map.get(curr.next);  // map.get(null)返回null
            newNode.random = map.get(curr.random);
            curr = curr.next;
        }
        
        return map.get(head);
    }
    
    // 方法2：原地复制法（三次遍历，空间O(1)）
    public Node copyRandomListInPlace(Node head) {
        if (head == null) {
            return null;
        }
        
        // 第一次遍历：在每个原节点后面插入复制节点
        Node curr = head;
        while (curr != null) {
            Node copy = new Node(curr.val);
            copy.next = curr.next;
            curr.next = copy;
            curr = copy.next;
        }
        
        // 第二次遍历：设置random指针
        curr = head;
        while (curr != null) {
            if (curr.random != null) {
                curr.next.random = curr.random.next;  // 关键：复制节点的random指向原节点random的复制
            }
            curr = curr.next.next;
        }
        
        // 第三次遍历：分离两个链表
        Node dummy = new Node(0);
        Node copyCurr = dummy;
        curr = head;
        
        while (curr != null) {
            copyCurr.next = curr.next;  // 复制节点
            copyCurr = copyCurr.next;
            
            curr.next = curr.next.next;  // 恢复原链表
            curr = curr.next;
        }
        
        return dummy.next;
    }
    
    // 图解原地复制法
    public class InPlaceCopyExplanation {
        /*
        原链表：A→B→C→D
        每个节点的random指针可能指向任意节点
        
        第一步（插入复制）：
        A→A'→B→B'→C→C'→D→D'
        
        第二步（设置random）：
        如果A.random = C
        则A'.random = A.random.next = C.next = C'
        
        第三步（分离）：
        恢复原链表：A→B→C→D
        得到新链表：A'→B'→C'→D'
        
        优势：不需要额外空间
        缺点：需要三次遍历，修改原链表（可恢复）
        */
    }
    
    // 方法3：递归+哈希表
    private Map<Node, Node> visitedMap = new HashMap<>();
    
    public Node copyRandomListRecursive(Node head) {
        if (head == null) {
            return null;
        }
        
        // 如果已经复制过，直接返回
        if (visitedMap.containsKey(head)) {
            return visitedMap.get(head);
        }
        
        // 创建新节点
        Node newNode = new Node(head.val);
        visitedMap.put(head, newNode);  // 先放入map，防止循环引用
        
        // 递归复制next和random
        newNode.next = copyRandomListRecursive(head.next);
        newNode.random = copyRandomListRecursive(head.random);
        
        return newNode;
    }
    
    // 递归分析
    public class RecursionAnalysis {
        /*
        处理循环引用问题：
        A.random = B, B.random = A
        
        递归过程：
        copyRandomList(A) → 创建A'
        复制A.next → copyRandomList(B)
        复制B.random → copyRandomList(A) 但此时A已在map中，直接返回A'
        
        避免了无限递归
        */
    }
}
```

#### 总结层：一句话记忆

**链表算法核心是"指针操作"：反转要三指针，环检测用快慢指针，合并用双指针遍历，找倒数第K个用先后指针——本质都是通过指针的相对运动来解决问题。**



**面试官视角总结**：对于3年经验的Java工程师，链表问题考察的是：1）对指针/引用的理解；2）边界条件的处理；3）时间/空间复杂度的分析；4）多种解法的比较；5）代码实现的简洁性和鲁棒性。掌握这四大经典问题及其变种，能解决80%的链表面试题。

---

### **题目2：二叉树相关（遍历、深度、最近公共祖先、重建）**

#### 原理
**二叉树遍历框架（递归与迭代）**：
```java
// 递归遍历框架
void traverse(TreeNode root) {
    if (root == null) return;
    // 前序：操作放在这里
    traverse(root.left);
    // 中序：操作放在这里
    traverse(root.right);
    // 后序：操作放在这里
}

// 迭代遍历模板（使用栈）
// 前序遍历：根→左→右
public List<Integer> preorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Stack<TreeNode> stack = new Stack<>();
    if (root != null) stack.push(root);
    
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);  // 操作当前节点
        
        // 注意：右孩子先入栈，左孩子后入栈
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }
    return result;
}
```

**二叉树解题框架**：
```java
// 几乎所有二叉树问题都可以用以下框架解决
public ResultType dfs(TreeNode root) {
    // 1. 处理空节点
    if (root == null) {
        return ...;  // 返回合理的空值
    }
    
    // 2. 递归处理左右子树
    ResultType left = dfs(root.left);
    ResultType right = dfs(root.right);
    
    // 3. 后序位置：整合左右子树结果，处理当前节点
    ResultType result = merge(left, right, root);
    
    return result;
}

// 示例：求二叉树最大深度
public int maxDepth(TreeNode root) {
    if (root == null) return 0;  // 空节点深度为0
    int left = maxDepth(root.left);
    int right = maxDepth(root.right);
    return Math.max(left, right) + 1;  // 当前节点深度为较大子树深度+1
}
```

#### 场景
**二叉搜索树（BST）在数据库索引中的应用**：
- MySQL的InnoDB使用B+树，但B+树是在BST基础上的扩展
- BST特性：左子树所有节点值 < 根节点值 < 右子树所有节点值
- 实际应用：有序数据存储、范围查询、数据库索引

#### 追问
**Q：如何找到二叉树的最近公共祖先（LCA）？**
```java
// 方法一：递归（适用于普通二叉树）
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    
    if (left != null && right != null) return root;  // p和q在左右两侧
    return left != null ? left : right;  // 都在一侧
}

// 方法二：利用BST特性（适用于二叉搜索树）
public TreeNode lowestCommonAncestorBST(TreeNode root, TreeNode p, TreeNode q) {
    if (root.val > p.val && root.val > q.val) {
        return lowestCommonAncestorBST(root.left, p, q);
    } else if (root.val < p.val && root.val < q.val) {
        return lowestCommonAncestorBST(root.right, p, q);
    } else {
        return root;  // p和q在root两侧，或者其中一个就是root
    }
}
```

**Q：如何根据遍历结果重建二叉树？**
- 前序+中序：前序确定根节点，中序分割左右子树
- 后序+中序：后序确定根节点，中序分割左右子树
- 前序+后序：无法唯一确定二叉树（除非是满二叉树）

#### 总结
二叉树问题核心是遍历和递归，掌握前中后序的递归与迭代写法，理解递归三部曲（参数与返回值、终止条件、单层逻辑）。

---

### **题目3：排序算法（快排、归并、堆排序）及其优化**

#### 原理
**三大O(nlogn)排序算法对比**：
![三大O(nlogn)排序算法对比](img/computer02-2.png)


**快速排序优化策略**：
```java
// 基础快排
public void quickSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int pivot = partition(arr, left, right);
    quickSort(arr, left, pivot - 1);
    quickSort(arr, pivot + 1, right);
}

// 优化1：三数取中法选择pivot（避免最坏情况）
private int choosePivot(int[] arr, int left, int right) {
    int mid = left + (right - left) / 2;
    // 选择left、mid、right的中位数
    if (arr[left] > arr[mid]) swap(arr, left, mid);
    if (arr[left] > arr[right]) swap(arr, left, right);
    if (arr[mid] > arr[right]) swap(arr, mid, right);
    // 将中位数放到right-1位置
    swap(arr, mid, right - 1);
    return arr[right - 1];
}

// 优化2：小数组使用插入排序（递归到较小时）
if (right - left + 1 < 10) {
    insertionSort(arr, left, right);
    return;
}

// 优化3：三向切分（处理大量重复元素）
// 将数组分为三部分：< pivot、= pivot、> pivot
```

#### 场景
**不同场景下的排序选择**：
1. **基本数据类型数组**：快速排序（JDK Arrays.sort()对基本类型使用双轴快排）
2. **对象数组**：归并排序（JDK Arrays.sort()对对象使用TimSort，是归并排序的优化）
3. **数据量巨大，内存有限**：堆排序（只需O(1)额外空间）
4. **链表排序**：归并排序（适合链表，不需要随机访问）
5. **外部排序**：多路归并（数据量大于内存，需分块排序后归并）

#### 追问
**Q：快速排序为什么在实际应用中比归并排序快？**
1. **缓存友好**：快速排序是原地排序，对CPU缓存更友好
2. **常数因子小**：虽然都是O(nlogn)，但快排的常数因子更小
3. **空间局部性**：访问连续内存，减少缓存缺失
4. 但在最坏情况下（已排序数组），快排性能差，需优化pivot选择

**Q：堆排序为什么不如快速排序常用？**
1. **缓存不友好**：堆排序的访问模式是跳跃的，不利于CPU缓存
2. **不稳定**：堆排序是不稳定排序
3. **实现复杂**：相比快排，堆排序代码更复杂
4. **实际性能**：尽管时间复杂度相同，但实际运行速度比快排慢

#### 总结
快排平均最快但需注意最坏情况，归并稳定但需额外空间，堆排序适合空间受限场景；实际选择需考虑数据特性、稳定性和空间约束。

---

### **题目4：二分查找及其变种**

#### 原理
**二分查找核心模板**：
```java
// 标准二分查找（查找target在有序数组中的位置）
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;  // 防止溢出
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;  // 未找到
}

// 变种1：查找第一个等于target的位置
public int firstEqual(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    // 检查left是否越界且nums[left]等于target
    if (left < nums.length && nums[left] == target) return left;
    return -1;
}

// 变种2：查找最后一个等于target的位置
public int lastEqual(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    // 检查right是否越界且nums[right]等于target
    if (right >= 0 && nums[right] == target) return right;
    return -1;
}
```

**二分查找适用条件**：
1. 有序数组（或部分有序，如旋转数组）
2. 查找目标值或满足条件的边界
3. 时间复杂度O(logn)

#### 场景
**实际应用：订单系统中的范围查询**：
- 用户查询某个时间段的订单：使用二分查找找到起始时间和结束时间的位置
- 商品价格区间筛选：在有序价格数组中查找上下边界
- 日志时间戳搜索：在按时间排序的日志中快速定位

#### 追问
**Q：旋转数组中的二分查找（LeetCode 33）**
```java
// 搜索旋转排序数组（无重复元素）
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        
        // 判断哪部分是有序的
        if (nums[left] <= nums[mid]) {  // 左半部分有序
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;  // target在有序的左半部分
            } else {
                left = mid + 1;   // target在右半部分
            }
        } else {  // 右半部分有序
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;   // target在有序的右半部分
            } else {
                right = mid - 1;  // target在左半部分
            }
        }
    }
    return -1;
}
```

**Q：如何实现一个二分查找的通用框架？**
```java
// 二分查找的抽象框架
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length;  // 注意：right初始为length
    while (left < right) {  // 注意：条件是<而不是<=
        int mid = left + (right - left) / 2;
        if (check(mid, target)) {  // 检查条件
            right = mid;  // 向左查找
        } else {
            left = mid + 1;  // 向右查找
        }
    }
    return left;  // 返回满足条件的最小索引
}
// 关键：定义check函数，根据问题不同实现不同的check逻辑
```

#### 总结
二分查找的核心是不断缩小搜索范围，注意边界条件和mid计算防止溢出，掌握查找等于、第一个等于、最后一个等于等变种。

---

### **题目5：动态规划（背包、最长公共子序列、爬楼梯）**

#### 原理
**动态规划解题框架**：
```java
// 1. 定义状态（dp数组的含义）
// 2. 确定状态转移方程
// 3. 初始化边界条件
// 4. 确定计算顺序
// 5. 返回结果

// 示例：爬楼梯（LeetCode 70）
public int climbStairs(int n) {
    if (n <= 2) return n;
    // 1. 定义状态：dp[i]表示爬到第i阶的方法数
    int[] dp = new int[n + 1];
    // 3. 初始化边界条件
    dp[1] = 1;
    dp[2] = 2;
    // 4. 确定计算顺序：从小到大
    for (int i = 3; i <= n; i++) {
        // 2. 状态转移方程
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    // 5. 返回结果
    return dp[n];
}
```

**常见动态规划类型**：
| 类型 | 特征 | 经典问题 |
|------|------|----------|
| **线性DP** | 按顺序递推 | 最大子数组和、最长递增子序列 |
| **区间DP** | 涉及区间合并 | 石子合并、最长回文子串 |
| **背包DP** | 选择与容量限制 | 0-1背包、完全背包 |
| **树形DP** | 在树上进行DP | 二叉树最大路径和、打家劫舍III |
| **状态压缩DP** | 状态用位表示 | 旅行商问题、铺砖问题 |

#### 场景
**实际应用：推荐系统的资源分配**：
- 0-1背包：广告位有限，选择收益最大的广告组合
- 完全背包：服务器资源分配，每种服务可以重复选择
- 多重背包：用户兴趣标签，每种标签有数量限制

#### 追问
**Q：0-1背包和完全背包的区别？**
```java
// 0-1背包：每种物品只能选0次或1次
// 二维dp：dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])
// 一维优化（逆序）：dp[j] = max(dp[j], dp[j-w[i]] + v[i])
for (int i = 0; i < n; i++) {
    for (int j = capacity; j >= weight[i]; j--) {  // 逆序！
        dp[j] = Math.max(dp[j], dp[j - weight[i]] + value[i]);
    }
}

// 完全背包：每种物品可以选无限次
// 二维dp：dp[i][j] = max(dp[i-1][j], dp[i][j-w[i]] + v[i])
// 一维优化（正序）：dp[j] = max(dp[j], dp[j-w[i]] + v[i])
for (int i = 0; i < n; i++) {
    for (int j = weight[i]; j <= capacity; j++) {  // 正序！
        dp[j] = Math.max(dp[j], dp[j - weight[i]] + value[i]);
    }
}
// 区别仅在于内层循环的顺序：0-1背包逆序，完全背包正序
```

**Q：如何判断一个问题是否可以用动态规划解决？**
1. **最优子结构**：问题的最优解包含子问题的最优解
2. **重叠子问题**：递归求解时会重复计算相同的子问题
3. **无后效性**：当前状态确定后，后续决策不受之前决策的影响

#### 总结
动态规划的核心是定义状态和状态转移方程，通过填表避免重复计算；0-1背包逆序遍历，完全背包正序遍历。

## 4. 踩坑雷达

### **案例1：递归深度过大导致栈溢出**
**故障现象**：在计算斐波那契数列时，使用朴素递归方法计算fib(100)导致栈溢出。

**根本原因**：
```java
// 朴素递归：存在大量重复计算，且递归深度过大
public int fib(int n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);  // 时间复杂度O(2^n)，递归深度O(n)
}
// 计算fib(100)需要2^100次操作，递归深度100层
// 当n较大时，不仅超时，还可能栈溢出
```

**如何避免**：
```java
// 方案1：动态规划（自底向上）
public int fibDP(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n+1];
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i-1] + dp[i-2];
    }
    return dp[n];  // 时间复杂度O(n)，空间O(n)
}

// 方案2：动态规划优化（只保留前两个状态）
public int fibDPOptimized(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;  // 时间复杂度O(n)，空间O(1)
}

// 方案3：矩阵快速幂（时间复杂度O(logn)）
public int fibMatrix(int n) {
    if (n <= 1) return n;
    int[][] matrix = {{1, 1}, {1, 0}};
    int[][] result = matrixPower(matrix, n-1);
    return result[0][0];
}

private int[][] matrixPower(int[][] matrix, int n) {
    int[][] result = {{1, 0}, {0, 1}};  // 单位矩阵
    while (n > 0) {
        if ((n & 1) == 1) {
            result = multiply(result, matrix);
        }
        matrix = multiply(matrix, matrix);
        n >>= 1;
    }
    return result;
}
```

### **案例2：算法未考虑边界条件导致线上故障**
**故障现象**：电商促销系统，使用快速排序对商品价格排序，在特定输入下（已排序数组）性能急剧下降，接口超时。

**根本原因**：
```java
// 原始快速排序（选择第一个元素作为pivot）
public void quickSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int pivot = arr[left];  // 问题：如果数组已排序，每次都选最小元素作为pivot
    int i = left, j = right;
    while (i < j) {
        while (i < j && arr[j] >= pivot) j--;
        while (i < j && arr[i] <= pivot) i++;
        if (i < j) swap(arr, i, j);
    }
    swap(arr, left, i);  // 将pivot放到正确位置
    
    quickSort(arr, left, i-1);
    quickSort(arr, i+1, right);
    // 最坏情况：每次partition只减少一个元素，时间复杂度O(n²)
}
```

**如何避免**：
```java
// 优化1：随机选择pivot
private int randomPartition(int[] arr, int left, int right) {
    // 在[left, right]中随机选择一个索引
    int randomIndex = left + (int)(Math.random() * (right - left + 1));
    swap(arr, left, randomIndex);  // 将随机元素交换到left位置
    return partition(arr, left, right);
}

// 优化2：三数取中法
private int medianOfThree(int[] arr, int left, int right) {
    int mid = left + (right - left) / 2;
    // 对arr[left], arr[mid], arr[right]排序
    if (arr[left] > arr[mid]) swap(arr, left, mid);
    if (arr[left] > arr[right]) swap(arr, left, right);
    if (arr[mid] > arr[right]) swap(arr, mid, right);
    // 将中位数交换到left位置
    swap(arr, left, mid);
    return arr[left];
}

// 优化3：当数组较小时使用插入排序
if (right - left + 1 < 10) {
    insertionSort(arr, left, right);
    return;
}

// 优化4：使用尾递归优化减少递归深度
public void quickSortTailRecursion(int[] arr, int left, int right) {
    while (left < right) {
        int pivot = partition(arr, left, right);
        // 对较小的子数组递归，较大的子数组使用循环
        if (pivot - left < right - pivot) {
            quickSortTailRecursion(arr, left, pivot - 1);
            left = pivot + 1;  // 循环处理右半部分
        } else {
            quickSortTailRecursion(arr, pivot + 1, right);
            right = pivot - 1;  // 循环处理左半部分
        }
    }
}
```

## 5. 速记卡片

| 类别 | 算法/数据结构 | 时间复杂度 | 空间复杂度 | 关键点 |
|------|--------------|------------|------------|--------|
| **数组** | 二分查找 | O(logn) | O(1) | 有序、防溢出 |
|  | 双指针 | O(n) | O(1) | 快慢指针、左右指针 |
| **链表** | 反转链表 | O(n) | O(1) | 迭代/递归、三指针 |
|  | 环检测 | O(n) | O(1) | 快慢指针、Floyd算法 |
| **树** | 二叉树遍历 | O(n) | O(h) | 前中后序、层序 |
|  | BST查找 | O(h) | O(h) | 递归/迭代、平衡树h=O(logn) |
| **排序** | 快速排序 | O(nlogn)平均，O(n²)最坏 | O(logn)递归栈 | 分治、partition |
|  | 归并排序 | O(nlogn) | O(n) | 分治、merge |
|  | 堆排序 | O(nlogn) | O(1) | 建堆、调整 |
| **DP** | 0-1背包 | O(n×capacity) | O(capacity) | 逆序遍历 |
|  | 完全背包 | O(n×capacity) | O(capacity) | 正序遍历 |
| **图** | DFS | O(V+E) | O(V) | 递归/栈、visited集合 |
|  | BFS | O(V+E) | O(V) | 队列、层序遍历 |
| **字符串** | KMP | O(n+m) | O(m) | 前缀表、next数组 |
|  | 最长回文子串 | O(n²) | O(n²) | 中心扩展、DP |
| **设计** | LRU缓存 | O(1) | O(capacity) | 哈希表+双向链表 |
|  | LFU缓存 | O(1) | O(capacity) | 哈希表+双向链表+频率哈希 |

---

**考前最后提醒**：
1. **链表操作**要熟练画图，理解指针操作顺序
2. **二叉树遍历**要掌握递归和迭代两种写法
3. **动态规划**要理解状态定义和转移方程
4. **排序算法**要能手写并分析时间复杂度
5. 准备**3-5个高频题目的完整解题思路**，包括边界条件和优化

**算法学习路径**：
1. **第一阶段**：掌握基本数据结构和算法（数组、链表、栈、队列、树、排序、查找）
2. **第二阶段**：刷LeetCode热门100题，掌握常见题型
3. **第三阶段**：专项突破（动态规划、图论、字符串等）
4. **第四阶段**：参加周赛/双周赛，提升实战能力

**面试技巧**：
1. 先确认问题，明确输入输出和边界条件
2. 思考暴力解法，再逐步优化
3. 编码时注意命名规范和注释
4. 测试多种情况（空输入、边界值、特殊值）
5. 分析时间复杂度和空间复杂度
