---
title: "MySQL高级查询与连接"
date: 2021-02-09T14:00:00+08:00
draft: false
description: "MySQL高级查询与连接：子查询、连接查询、内连接、外连接、自连接、子查询等。"
tags: ["MySQL", "高级查询"]
categories: ["Database"]
---
MySQL高级查询与连接：子查询、连接查询、内连接、外连接、自连接、子查询等。
## MySQL 连接的使用
### JOIN 简介
> JOIN 用于根据两个或多个表中的相关列之间的关系，从这些表中查询数据。MySQL 支持多种类型的连接，每种连接都有其特定的用途和行为。

#### JOIN 的类型
- INNER JOIN：内连接，返回两表中匹配的记录
- LEFT JOIN：左外连接，返回左表所有记录和右表匹配记录
- RIGHT JOIN：右外连接，返回右表所有记录和左表匹配记录
- FULL OUTER JOIN：全外连接（MySQL 不直接支持） 
- CROSS JOIN：交叉连接，返回笛卡尔积
- SELF JOIN：自连接，表与自身连接

### 示例数据准备
```sql
-- 假设我们有以下三张表：users, orders, products 
-- 创建用户表 
CREATE TABLE users ( 
    user_id INT PRIMARY KEY, 
    username VARCHAR(50), 
    email VARCHAR(100), 
    city VARCHAR(50) 
); 
-- 创建订单表 
CREATE TABLE orders ( 
    order_id INT PRIMARY KEY, 
    user_id INT, 
    product_name VARCHAR(100), 
    amount DECIMAL(10,2), 
    order_date DATE 
); 
-- 创建产品表 
CREATE TABLE products ( 
    product_id INT PRIMARY KEY, 
    product_name VARCHAR(100), 
    category VARCHAR(50), 
    price DECIMAL(10,2) 
);
-- 插入用户数据 
INSERT INTO users VALUES 
(1, '张三', 'zhangsan@email.com', '北京'), 
(2, '李四', 'lisi@email.com', '上海'), 
(3, '王五', 'wangwu@email.com', '广州'), 
(4, '赵六', 'zhaoliu@email.com', '深圳'), 
(5, '钱七', 'qianqi@email.com', '杭州'); 
-- 插入订单数据 
INSERT INTO orders VALUES 
(101, 1, '笔记本电脑', 8000.00, '2023-01-15'), 
(102, 2, '智能手机', 3000.00, '2023-01-20'), 
(103, 1, '平板电脑', 2500.00, '2023-02-10'), 
(104, 3, '笔记本电脑', 8500.00, '2023-02-15'), 
(105, 2, '智能手机', 3200.00, '2023-03-05'), 
(106, 6, '游戏机', 2800.00, '2023-03-10'); 
-- user_id=6 在users表中不存在 
-- 插入产品数据 
INSERT INTO products VALUES 
(1, '笔记本电脑', '电脑', 8000.00), 
(2, '智能手机', '手机', 3000.00), 
(3, '平板电脑', '电脑', 2500.00), 
(4, '智能手表', '穿戴设备', 1500.00); 
-- 没有对应的订单
```
### INNER JOIN（内连接）
> INNER JOIN 返回两个表中都有匹配记录的行。这是最常用的连接类型。

INNER JOIN : 表A ∩ 表B（交集）

#### 基本语法
```sql
SELECT columns FROM table1 INNER JOIN table2 ON table1.column = table2.column;
```
#### 实际示例
```sql
-- 查询有订单的用户信息 
SELECT u.username, u.email, o.order_id, o.product_name, o.amount 
FROM users u INNER JOIN orders o ON u.user_id = o.user_id;
```
### LEFT JOIN（左外连接）
> LEFT JOIN 返回左表的所有记录，以及右表中匹配的记录。如果右表没有匹配的记录，则显示 NULL。

LEFT JOIN : 表A + (表A ∩ 表B)

#### 基本语法
```sql
SELECT columns FROM table1 LEFT JOIN table2 ON table1.column = table2.column;
```
#### 实际示例
```sql  
-- 查询所有用户及其订单信息（包括没有订单的用户） 
SELECT u.username, u.email, o.order_id, o.product_name, o.amount 
FROM users u LEFT JOIN orders o ON u.user_id = o.user_id ORDER BY u.user_id;

-- 查询没有下过订单的用户 
SELECT u.username, u.email 
FROM users u LEFT JOIN orders o ON u.user_id = o.user_id 
WHERE o.user_id IS NULL;
```
### RIGHT JOIN（右外连接）
> RIGHT JOIN 返回右表的所有记录，以及左表中匹配的记录。如果左表没有匹配的记录，则显示 NULL。

RIGHT JOIN : (表A ∩ 表B) + 表B

#### 基本语法
```sql
SELECT columns FROM table1 RIGHT JOIN table2 ON table1.column = table2.column;
```
#### 实际示例
```sql
-- 查询所有订单及其用户信息（包括无效用户的订单） 
SELECT u.username, u.email, o.order_id, o.product_name, o.amount 
FROM users u RIGHT JOIN orders o ON u.user_id = o.user_id 
ORDER BY o.order_id;
```
### FULL OUTER JOIN（全外连接）
> MySQL 不直接支持 FULL OUTER JOIN，但可以通过 UNION 组合 LEFT JOIN 和 RIGHT JOIN 来实现。
```sql
-- 模拟 FULL OUTER JOIN 
SELECT u.username, u.email, o.order_id, o.product_name, o.amount 
FROM users u LEFT JOIN orders o ON u.user_id = o.user_id 
UNION 
SELECT u.username, u.email, o.order_id, o.product_name, o.amount 
FROM users u RIGHT JOIN orders o ON u.user_id = o.user_id;
```
### CROSS JOIN（交叉连接）
> CROSS JOIN 返回两个表的笛卡尔积，即第一个表的每一行与第二个表的每一行组合。

CROSS JOIN : 表A × 表B（笛卡尔积）
#### 基本语法
```sql
SELECT columns FROM table1 CROSS JOIN table2; 
-- 或者 
SELECT columns FROM table1, table2;
```
#### 实际示例
```sql  
-- 生成用户和产品的所有组合 
SELECT u.username, p.product_name, p.price 
FROM users u CROSS JOIN products p 
WHERE u.user_id <= 2 AND p.product_id <= 2; -- 限制结果数量
```
### SELF JOIN（自连接）
> 自连接是表与自身的连接，通常用于处理层次结构数据或比较同一表中的不同行。

#### 示例：员工管理结构
```sql
-- 创建员工表 
CREATE TABLE employees ( 
    emp_id INT PRIMARY KEY, 
    emp_name VARCHAR(50), 
    manager_id INT, 
    department VARCHAR(50) 
); 
-- 插入数据 
INSERT INTO employees VALUES 
(1, '张总', NULL, '管理层'), 
(2, '李经理', 1, '销售部'), 
(3, '王经理', 1, '技术部'), 
(4, '赵员工', 2, '销售部'), 
(5, '钱员工', 2, '销售部'), 
(6, '孙员工', 3, '技术部'); 
-- 查询员工及其直接上级 
SELECT e.emp_name as employee, m.emp_name as manager 
FROM employees e LEFT JOIN employees m ON e.manager_id = m.emp_id;
```
### 多表连接
> 可以在一个查询中连接多个表，获取更复杂的数据关系。

#### 三表连接示例
```sql
-- 查询用户、订单和产品的完整信息 
SELECT u.username, u.city, o.order_id, o.order_date, p.product_name, p.category, o.amount 
FROM users u INNER JOIN orders o ON u.user_id = o.user_id 
INNER JOIN products p ON o.product_name = p.product_name 
ORDER BY o.order_date;
```
### 复杂连接条件
```sql
-- 使用多个连接条件 
SELECT u.username, o.product_name, o.amount, p.price, (o.amount - p.price) as price_difference 
FROM users u INNER JOIN orders o ON u.user_id = o.user_id 
INNER JOIN products p ON o.product_name = p.product_name AND o.amount >= p.price -- 额外的连接条件 WHERE u.city IN ('北京', '上海');
```
### JOIN 性能优化技巧
- 在连接列上创建索引
- 使用适当的连接类型
- 优化连接顺序
- 使用 WHERE 子句减少数据量
- 避免不必要的列选择

#### 索引优化
```sql
-- 为连接列创建索引 
CREATE INDEX idx_orders_user_id ON orders(user_id); 
CREATE INDEX idx_users_user_id ON users(user_id); 
-- 复合索引 
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);
```
### 查看执行计划
> 可以使用 EXPLAIN 语句查看 JOIN 查询的执行计划，以优化查询性能。

```sql
-- 分析 JOIN 查询的执行计划 
EXPLAIN SELECT u.username, o.product_name, o.amount 
FROM users u INNER JOIN orders o ON u.user_id = o.user_id;
```
### 常见错误和注意事项
- 忘记指定连接条件导致笛卡尔积
- 混淆不同类型的 JOIN
- 在大表上进行无索引连接
- 不理解 NULL 值在连接中的行为
#### 避免笛卡尔积
```sql
-- 错误：缺少连接条件 
SELECT u.username, o.product_name 
FROM users u, orders o; -- 产生笛卡尔积 
-- 正确：指定连接条件 
SELECT u.username, o.product_name FROM users u INNER JOIN orders o ON u.user_id = o.user_id;
```
#### 处理 NULL 值
> 在 JOIN 查询中，NULL 值可能会导致意外结果。需要注意 NULL 值的比较和处理。
```sql
-- 注意 NULL 值的比较 
SELECT u.username, o.order_id 
FROM users u LEFT JOIN orders o ON u.user_id = o.user_id 
WHERE o.user_id IS NULL; -- 查找没有订单的用户 
-- 错误的写法 
-- 错误：不能直接比较 NULL 值 
SELECT u.username, o.order_id 
FROM users u LEFT JOIN orders o ON u.user_id = o.user_id 
WHERE o.user_id = NULL; -- 这样写查不到结果
```
### 实际应用场景
#### 1. 电商订单分析
```sql
-- 分析用户购买行为 
SELECT u.username, u.city, COUNT(o.order_id) as order_count, SUM(o.amount) as total_spent, AVG(o.amount) as avg_order_value 
FROM users u LEFT JOIN orders o ON u.user_id = o.user_id 
GROUP BY u.user_id, u.username, u.city 
ORDER BY total_spent DESC;
```
#### 2. 库存管理
```sql  
-- 查询产品销售情况 
-- 分析产品销售情况 
SELECT p.product_name, p.category, p.price, COUNT(o.order_id) as sales_count, COALESCE(SUM(o.amount), 0) as total_revenue 
FROM products p LEFT JOIN orders o ON p.product_name = o.product_name 
GROUP BY p.product_id, p.product_name, p.category, p.price 
ORDER BY sales_count DESC;
```
#### 3. 数据完整性检查
```sql  
-- 查找孤立的订单（用户不存在） 
SELECT o.order_id, o.user_id, o.product_name 
FROM orders o LEFT JOIN users u ON o.user_id = u.user_id 
WHERE u.user_id IS NULL;
```
## MySQL NULL 值处理
### NULL 值概念
> 在 MySQL 中，NULL 表示"未知"或"缺失"的值，它不等于空字符串('')、数字0或任何其他值。NULL 值在数据库操作中有特殊的行为和处理规则。

#### NULL 值的特点
- NULL 不等于任何值，包括它自己
- 任何与 NULL 的算术运算结果都是 NULL
- NULL 值在排序中有特定的位置
- 聚合函数通常忽略 NULL 值
- 需要使用特殊的操作符来检测 NULL
### NULL 值检测
#### IS NULL 和 IS NOT NULL
```sql
-- 检查 NULL 值 
SELECT * FROM table_name WHERE column_name IS NULL; 
-- 检查非 NULL 值 
SELECT * FROM table_name WHERE column_name IS NOT NULL;
```
> 注意：不能使用 = NULL 或 != NULL 来检测 NULL 值，这些表达式总是返回 NULL（即 false）。
#### 错误和正确的 NULL 检测
```sql
-- 错误的方式（不会返回预期结果） 
SELECT * FROM users WHERE email = NULL; -- 错误 
SELECT * FROM users WHERE email != NULL; -- 错误 
SELECT * FROM users WHERE email <> NULL; -- 错误 
-- 正确的方式 
SELECT * FROM users WHERE email IS NULL; -- 正确 
SELECT * FROM users WHERE email IS NOT NULL; -- 正确
```
### 示例数据准备
```sql
-- 创建包含 NULL 值的测试表 
CREATE TABLE employees ( 
    id INT PRIMARY KEY, 
    name VARCHAR(50) NOT NULL, 
    email VARCHAR(100), 
    phone VARCHAR(20), 
    salary DECIMAL(10,2), 
    bonus DECIMAL(10,2), 
    hire_date DATE 
); 
-- 插入包含 NULL 值的测试数据 
INSERT INTO employees VALUES 
(1, '张三', 'zhangsan@email.com', '13800138001', 8000.00, 1000.00, '2020-01-15'), 
(2, '李四', NULL, '13800138002', 6000.00, NULL, '2019-03-20'), 
(3, '王五', 'wangwu@email.com', NULL, 9500.00, 1500.00, '2021-06-10'), 
(4, '赵六', NULL, NULL, NULL, NULL, '2018-11-05'), 
(5, '钱七', 'qianqi@email.com', '13800138005', 7500.00, NULL, NULL);
```
### NULL 值查询
#### 查找 NULL 值
```sql
-- 查找邮箱为空的员工 
SELECT id, name, email 
FROM employees 
WHERE email IS NULL;
```
#### 查找非 NULL 值
```sql
-- 查找有邮箱的员工 
SELECT id, name, email 
FROM employees 
WHERE email IS NOT NULL;
```
#### 多列 NULL 检查
```sql
-- 查找邮箱和电话都为空的员工 
SELECT id, name, email, phone 
FROM employees 
WHERE email IS NULL AND phone IS NULL; 
-- 查找邮箱或电话为空的员工 
SELECT id, name, email, phone 
FROM employees 
WHERE email IS NULL OR phone IS NULL; 
-- 查找所有联系方式都不为空的员工 
SELECT id, name, email, phone 
FROM employees 
WHERE email IS NOT NULL AND phone IS NOT NULL;
```

### NULL 值处理函数
#### IFNULL() 函数
> IFNULL(expr1, expr2) - 如果 expr1 不是 NULL，返回 expr1，否则返回 expr2。
```sql
-- 使用默认值替换 NULL 
SELECT id, name, IFNULL(email, '未提供邮箱') as email, IFNULL(phone, '未提供电话') as phone, IFNULL(salary, 0) as salary 
FROM employees;
```
#### COALESCE() 函数
> COALESCE(expr1, expr2, ...) - 返回第一个非 NULL 的表达式。
```sql
-- 返回第一个非空的联系方式 
SELECT id, name, COALESCE(email, phone, '无联系方式') as contact 
FROM employees; 
-- 计算总收入（薪资+奖金） 
SELECT id, name, salary, bonus, COALESCE(salary, 0) + COALESCE(bonus, 0) as total_income 
FROM employees;
```
#### NULLIF() 函数
> NULLIF(expr1, expr2) - 如果 expr1 = expr2，返回 NULL，否则返回 expr1。
```sql
-- 将空字符串转换为 NULL 
SELECT id, name, NULLIF(email, '') as email -- 如果 email 是空字符串，返回 NULL 
FROM employees; 
-- 避免除零错误 
SELECT id, name, salary / NULLIF(bonus, 0) as salary_bonus_ratio 
FROM employees;
```
#### ISNULL() 函数
> ISNULL(expr) - 如果 expr 是 NULL，返回 1，否则返回 0。
```sql
-- 检查字段是否为 NULL 
SELECT id, name, email, ISNULL(email) as email_is_null, ISNULL(phone) as phone_is_null 
FROM employees;
```

### NULL 值在运算中的行为
#### 算术运算
```sql
-- NULL 参与的算术运算结果都是 NULL 
SELECT id, name, salary, bonus, salary + bonus as total, -- 如果 bonus 是 NULL，结果是 NULL 
salary * 1.1 as salary_increase, -- 如果 salary 是 NULL，结果是 NULL 
bonus / 12 as monthly_bonus -- 如果 bonus 是 NULL，结果是 NULL 
FROM employees;
```
#### 字符串连接
```sql
-- NULL 参与的字符串连接 
SELECT id, name, email, phone, CONCAT(name, ' - ', email) as name_email, -- 如果 email 是 NULL，结果是 NULL 
CONCAT(IFNULL(email, ''), ' | ', IFNULL(phone, '')) as contact_info 
FROM employees;
```
#### 比较运算
```sql  
-- NULL 的比较运算 
SELECT id, name, salary, bonus, salary > 7000 as high_salary, -- 如果 salary 是 NULL，结果是 NULL 
bonus > 1000 as high_bonus, -- 如果 bonus 是 NULL，结果是 NULL 
salary = bonus as salary_eq_bonus -- 如果任一为 NULL，结果是 NULL 
FROM employees;
```
### NULL 值在聚合函数中的行为
> 聚合函数忽略 NULL 值，只对非 NULL 值进行计算。
```sql
-- 聚合函数忽略 NULL 值 
SELECT id, name, salary, bonus, -- 计算总收入（薪资+奖金） 
COALESCE(salary, 0) + COALESCE(bonus, 0) as total_income 
FROM employees;
```
> GROUP BY 中的 NULL
```sql
-- NULL 值会被分为一组 
SELECT IFNULL(bonus, 'No Bonus') as bonus_group, COUNT(*) as employee_count, AVG(salary) as avg_salary 
FROM employees 
GROUP BY bonus;
```
### NULL 值在排序中的行为
#### 默认排序行为 
```sql  
-- MySQL 中 NULL 值在排序时排在最前面（升序） 
SELECT id, name, salary, bonus FROM employees ORDER BY bonus; -- NULL 值排在最前面 
SELECT id, name, salary, bonus FROM employees ORDER BY bonus DESC; -- NULL 值仍然排在最前面
```
#### 控制 NULL 值排序位置
```sql
-- 将 NULL 值排在最后 
SELECT id, name, salary, bonus FROM employees ORDER BY bonus IS NULL, bonus; -- 将 NULL 值排在最前 
SELECT id, name, salary, bonus FROM employees ORDER BY bonus IS NOT NULL, bonus; 
-- 使用 IFNULL 控制排序 
SELECT id, name, salary, bonus FROM employees ORDER BY IFNULL(bonus, 0) DESC; -- 将 NULL 当作 0 排序
```
### NULL 值在 JOIN 中的行为
```sql
-- 创建部门表 
CREATE TABLE departments ( 
    dept_id INT PRIMARY KEY, 
    dept_name VARCHAR(50) 
); 
-- 添加部门字段到员工表 
ALTER TABLE employees ADD COLUMN dept_id INT; 
-- 更新部门信息（有些员工没有部门） 
UPDATE employees SET dept_id = 1 WHERE id IN (1, 2); 
UPDATE employees SET dept_id = 2 WHERE id = 3; 
-- id 为 4, 5 的员工 dept_id 保持为 NULL 
INSERT INTO departments VALUES (1, '技术部'), (2, '销售部'), (3, '人事部'); 
-- JOIN 操作中 NULL 值不会匹配 
SELECT e.id, e.name, d.dept_name 
FROM employees e LEFT JOIN departments d ON e.dept_id = d.dept_id;
```

### NULL 值的最佳实践

1. 在表设计时明确哪些字段允许 NULL
2. 为重要字段设置 NOT NULL 约束
3. 使用适当的默认值减少 NULL 的使用
4. 在查询中正确处理 NULL 值
5. 在应用程序中验证和处理 NULL 值
#### 表设计建议
```sql
-- 好的表设计示例 
CREATE TABLE users ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    username VARCHAR(50) NOT NULL UNIQUE, 
    email VARCHAR(100) NOT NULL UNIQUE, 
    phone VARCHAR(20), -- 可选字段，允许 NULL 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    is_active BOOLEAN DEFAULT TRUE, -- 使用默认值而不是 NULL 
    profile_image VARCHAR(255) DEFAULT 'default.jpg' -- 使用默认值 
);
```
#### 查询中的 NULL 处理
```sql
-- 在查询中妥善处理 NULL 
SELECT id, name, COALESCE(email, phone, '无联系方式') as contact, IFNULL(salary, 0) + IFNULL(bonus, 0) as total_compensation, 
CASE 
WHEN salary IS NULL THEN '薪资待定' 
WHEN salary < 5000 THEN '低薪' 
WHEN salary < 8000 THEN '中薪' 
ELSE '高薪' END as salary_level 
FROM employees;
```
### 常见错误和陷阱
- 使用 = NULL 或 != NULL 检测 NULL 值
- 忽略 NULL 值在算术运算中的影响
- 不理解聚合函数对 NULL 的处理
- 在 JOIN 条件中忽略 NULL 值的行为

#### 三值逻辑
```sql
-- MySQL 使用三值逻辑：TRUE, FALSE, NULL 
SELECT 1 = 1, -- TRUE 
1 = 2, -- FALSE 
1 = NULL, -- NULL 
NULL = NULL, -- NULL（不是 TRUE！） 
TRUE AND NULL, -- NULL 
FALSE AND NULL, -- FALSE 
TRUE OR NULL, -- TRUE 
FALSE OR NULL, -- NULL 
NOT NULL; -- NULL
```
#### WHERE 子句中的 NULL
```sql
-- WHERE 子句只返回条件为 TRUE 的行 
-- 条件为 FALSE 或 NULL 的行都不会返回 
-- 这个查询不会返回 salary 为 NULL 的行 
SELECT * FROM employees WHERE salary > 5000; 
-- 这个查询也不会返回 salary 为 NULL 的行 
SELECT * FROM employees WHERE NOT (salary > 5000); 
-- 要包含 NULL 值，需要显式检查 
SELECT * FROM employees WHERE salary > 5000 OR salary IS NULL;
```
### 实际应用场景
#### 1. 数据清理
```sql
-- 查找数据不完整的记录 
SELECT id, name, 
CASE 
WHEN email IS NULL THEN 'Missing Email' 
WHEN phone IS NULL THEN 'Missing Phone' 
WHEN salary IS NULL THEN 'Missing Salary' 
ELSE 'Complete' END as data_status 
FROM employees 
WHERE email IS NULL OR phone IS NULL OR salary IS NULL;
```
#### 2. 报表生成
```sql
-- 生成员工信息报表，处理缺失数据 
SELECT 
name, 
IFNULL(email, 'N/A') as email, 
IFNULL(phone, 'N/A') as phone, 
CONCAT('$', FORMAT(IFNULL(salary, 0), 2)) as salary, 
IFNULL(DATE_FORMAT(hire_date, '%Y-%m-%d'), 'Unknown') as hire_date 
FROM employees 
ORDER BY name;
```
#### 3. 条件统计
```sql
-- 统计各种数据完整性情况 
SELECT 
COUNT(*) as total_employees, 
COUNT(email) as has_email, 
COUNT(*) - COUNT(email) as missing_email, COUNT(phone) as has_phone, 
COUNT(*) - COUNT(phone) as missing_phone, 
COUNT(salary) as has_salary, 
COUNT(*) - COUNT(salary) as missing_salary 
FROM employees;
```
## MySQL 正则表达式

### 正则表达式概述
> MySQL 支持正则表达式（Regular Expression），允许你进行复杂的模式匹配。正则表达式比 LIKE 操作符更强大，可以实现更精确和灵活的文本搜索。

#### MySQL 正则表达式操作符
- REGEXP 或 RLIKE：匹配正则表达式
- NOT REGEXP 或 NOT RLIKE：不匹配正则表达式
- REGEXP_LIKE()：函数形式的正则匹配
- REGEXP_REPLACE()：正则替换
- REGEXP_SUBSTR()：正则提取
### 基本语法
```sql
-- 基本正则表达式语法 
SELECT column_name 
FROM table_name 
WHERE column_name REGEXP 'pattern'; 
SELECT column_name 
FROM table_name 
WHERE column_name RLIKE 'pattern'; 
SELECT column_name 
FROM table_name 
WHERE column_name NOT REGEXP 'pattern';
```
> 注意：MySQL 的正则表达式**默认是大小写不敏感**的，可以使用 BINARY 关键字使其大小写敏感。

### 示例数据准备
```sql
-- 创建测试表 
CREATE TABLE products ( 
    id INT PRIMARY KEY, name VARCHAR(100), 
    code VARCHAR(20), description TEXT, 
    email VARCHAR(100) 
); 
-- 插入测试数据 
INSERT INTO products VALUES 
(1, 'iPhone 14 Pro', 'IP14P-001', 'Apple iPhone 14 Pro 128GB', 'sales@apple.com'), 
(2, 'Samsung Galaxy S23', 'SG23-002', 'Samsung Galaxy S23 256GB', 'info@samsung.com'), 
(3, 'MacBook Air M2', 'MBA-M2-003', 'Apple MacBook Air with M2 chip', 'support@apple.com'), 
(4, 'Dell XPS 13', 'DX13-004', 'Dell XPS 13 Laptop Intel i7', 'contact@dell.com'), 
(5, 'iPad Pro 11', 'IPD11-005', 'Apple iPad Pro 11-inch 2022', 'service@apple.com'), 
(6, 'Surface Pro 9', 'SP9-006', 'Microsoft Surface Pro 9 Tablet', 'help@microsoft.com'), 
(7, 'AirPods Pro 2', 'APP2-007', 'Apple AirPods Pro 2nd Generation', 'store@apple.com'), 
(8, 'Galaxy Buds2 Pro', 'GBP2-008', 'Samsung Galaxy Buds2 Pro Wireless', 'sales@samsung.co.kr');
```
### 基本正则表达式模式
#### 字符匹配
```sql
-- 匹配包含 'Pro' 的产品 
SELECT name FROM products WHERE name REGEXP 'Pro'; 
-- 匹配以 'Apple' 开头的描述 
SELECT name, description FROM products WHERE description REGEXP '^Apple'; 
-- 匹配以 '.com' 结尾的邮箱 
SELECT name, email FROM products WHERE email REGEXP '\.com$';
```

|模式	|说明	|示例|
| --- | --- | --- |
|^	|行的开始	|^Apple 匹配以 Apple 开头|
|$	|行的结束	|.com$ 匹配以 .com 结尾|
|.	|任意单个字符	|a.c 匹配 abc, adc 等|
|\	|转义字符	|\. 匹配字面意思的点|

#### 字符类
```sql
-- 匹配包含数字的产品代码 
SELECT name, code FROM products WHERE code REGEXP '[0-9]'; 
-- 匹配包含字母 A-F 的代码 
SELECT name, code FROM products WHERE code REGEXP '[A-F]'; 
-- 匹配不包含数字的产品名称 
SELECT name FROM products WHERE name REGEXP '[^0-9]';
```
|模式	|说明	|示例|
| --- | --- | --- |
|[abc]	|匹配a、b或c	|aeiou] 匹配 元音字母|
|[a-z]	|匹配 a 到 z 的任意字母	|[0-9] 匹配任意数字|
|[^abc]	|不匹配 a、b 或 c	|[^0-9] 匹配非数字|
|[:alnum:]	|字母和数字	|[:alnum:] 匹配字母数字|
|[:alpha:]	|字母	|[:alpha:] 匹配字母|
|[:digit:]	|数字	|[:digit:] 匹配数字|


#### 量词
```sql
-- 匹配包含一个或多个数字的代码 
SELECT name, code FROM products WHERE code REGEXP '[0-9]+'; 
-- 匹配包含 0 个或多个字母 P 的产品 
SELECT name FROM products WHERE name REGEXP 'P*'; 
-- 匹配恰好包含 2 个数字的代码 
SELECT name, code FROM products WHERE code REGEXP '[0-9]{2}'; 
-- 匹配包含 2-4 个连续字母的产品名 
SELECT name FROM products WHERE name REGEXP '[A-Za-z]{2,4}';
```
|量词	|说明	|示例|
| --- | --- | --- |
|*	|0 次或多次	|ab* 匹配 a, ab, abb 等|
|+	|1 次或多次	|ab+ 匹配 ab, abb 等|
|?	|0 次或 1 次	|ab? 匹配 a 或 ab|
|{n}	|恰好 n 次	|a{3} 匹配 aaa|
|{n,}	|至少 n 次	|a{2,} 匹配 aa, aaa 等|
|{n,m}	|n 到 m 次	|a{2,4} 匹配 aa, aaa, aaaa|

### 高级正则表达式模式
#### 分组和选择
```sql
-- 匹配 iPhone 或 iPad 
SELECT name 
FROM products 
WHERE name REGEXP '(iPhone|iPad)'; 
-- 匹配 Apple 或 Samsung 品牌 
SELECT name, description 
FROM products 
WHERE description REGEXP '(Apple|Samsung)'; 
-- 匹配产品代码格式：字母-数字-数字 
SELECT name, code 
FROM products 
WHERE code REGEXP '^[A-Z]+-[0-9]+-[0-9]+$';
```
#### 预定义字符类
```sql
-- 使用预定义字符类 
SELECT name FROM products WHERE name REGEXP '[[.space.]]'; 
-- 匹配空格 
SELECT name FROM products WHERE name REGEXP '[[:digit:]]'; 
-- 匹配数字 
SELECT name FROM products WHERE name REGEXP '[[:alpha:]]'; 
-- 匹配字母 
SELECT name FROM products WHERE name REGEXP '[[:alnum:]]'; 
-- 匹配字母数字
```
#### 复杂模式示例
```sql
-- 匹配邮箱格式 
SELECT name, email FROM products WHERE email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'; 
-- 匹配产品代码格式（字母开头，包含数字和连字符） 
SELECT name, code 
FROM products 
WHERE code REGEXP '^[A-Z]+[0-9]*-[0-9]+$'; 
-- 匹配包含版本号的产品（数字后跟可选的小数点和数字） 
SELECT name 
FROM products 
WHERE name REGEXP '[0-9]+\.?[0-9]*';
```
### 正则表达式函数
#### REGEXP_LIKE() 函数
```sql
-- REGEXP_LIKE 函数提供更多选项 
SELECT name FROM products WHERE REGEXP_LIKE(name, 'pro', 'i'); -- 'i' 表示忽略大小写 
-- 多行模式 
SELECT name, description 
FROM products 
WHERE REGEXP_LIKE(description, '^Apple.*Pro$', 'm'); -- 'm' 表示多行模式
```
#### REGEXP_REPLACE() 函数
```sql
-- 替换文本中的模式 
SELECT name, REGEXP_REPLACE(name, '[0-9]+', 'X') as name_no_numbers, REGEXP_REPLACE(email, '@.*', '@company.com') as masked_email 
FROM products; 
-- 格式化产品代码 
SELECT code, 
       REGEXP_REPLACE(code, '([A-Z]+)([0-9]+)-([0-9]+)', '\\1_\\2_\\3') as formatted_code 
FROM products;
```
#### REGEXP_SUBSTR() 函数
```sql
-- 提取匹配的子字符串 
SELECT name, REGEXP_SUBSTR(name, '[0-9]+') as extracted_number, REGEXP_SUBSTR(email, '[^@]+') as username 
FROM products; 
-- 提取产品代码中的数字部分 
SELECT code, 
       REGEXP_SUBSTR(code, '[0-9]+') as first_number, 
       REGEXP_SUBSTR(code, '[0-9]+', 1, 2) as second_number -- 第2个匹配 
FROM products;
```
#### REGEXP_INSTR() 函数
```sql
-- 查找模式在字符串中的位置 
SELECT name, REGEXP_INSTR(name, '[0-9]+') as number_position, REGEXP_INSTR(email, '@') as at_position 
FROM products;
```
### 实际应用场景
#### 1. 数据验证
```sql
-- 验证邮箱格式 
SELECT name, email, CASE WHEN email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN '有效邮箱' ELSE '无效邮箱' END as email_status 
FROM products; 
-- 验证产品代码格式 
SELECT name, code, CASE WHEN code REGEXP '^[A-Z]{2,4}[0-9]*-[0-9]{3}$' THEN '标准格式' ELSE '非标准格式' END as code_format 
FROM products;
```
#### 2. 数据清理
```sql
-- 查找包含特殊字符的数据 
SELECT name FROM products WHERE name REGEXP '[^A-Za-z0-9 ]'; -- 包含非字母数字空格的字符 
-- 查找格式不一致的数据 
SELECT name, code FROM products WHERE code NOT REGEXP '^[A-Z]+-[0-9]+-[0-9]+$'; -- 不符合标准格式 
-- 标准化数据格式 
UPDATE products SET code = REGEXP_REPLACE(code, '([A-Z]+)([0-9]+)([0-9]+)', '\\1-\\2-\\3') 
WHERE code REGEXP '^[A-Z]+[0-9]+[0-9]+$';
```
#### 3. 搜索和过滤
```sql  
-- 搜索特定型号的产品 
SELECT name FROM products WHERE name REGEXP '(iPhone|iPad|MacBook).*[0-9]+'; 
-- 查找专业版产品 
SELECT name FROM products WHERE name REGEXP 'Pro[^a-z]'; 
-- 按品牌分类 
SELECT name, 
CASE 
WHEN description REGEXP '^Apple' THEN 'Apple' 
WHEN description REGEXP '^Samsung' THEN 'Samsung' 
WHEN description REGEXP '^Dell' THEN 'Dell' 
WHEN description REGEXP '^Microsoft' THEN 'Microsoft' 
ELSE 'Other' END as brand 
FROM products;
```
#### 4. 文本分析
```sql
-- 提取产品型号 
SELECT name, REGEXP_SUBSTR(name, '[0-9]+') as model_number, REGEXP_SUBSTR(name, '(Pro|Air|Max)') as product_line FROM products; 
-- 分析邮箱域名 
SELECT REGEXP_SUBSTR(email, '@(.+)', 1, 1, '', 1) as domain, COUNT(*) as count 
FROM products 
GROUP BY REGEXP_SUBSTR(email, '@(.+)', 1, 1, '', 1);
```
### 性能优化
- 尽量使用简单的模式，避免复杂的回溯
- 在可能的情况下，使用 LIKE 而不是正则表达式
- 将正则表达式与其他条件结合使用
- 考虑使用全文索引进行文本搜索
- 避免在大数据集上使用复杂的正则表达式
```sql
-- 性能优化示例 
-- 不好的做法：直接使用复杂正则表达式 
SELECT * FROM large_table WHERE description REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'; 
-- 更好的做法：先用简单条件过滤，再用正则表达式 
SELECT * FROM large_table WHERE description LIKE '%@%' -- 先用索引友好的条件 
AND description REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
```
### 常见错误和注意事项
- 忘记转义特殊字符（如点号 .）
- 不理解贪婪匹配和非贪婪匹配
- 在大数据集上使用复杂正则表达式导致性能问题
- 混淆 LIKE 和 REGEXP 的语法
#### 转义字符
```sql
-- 错误：没有转义点号 
SELECT * FROM products WHERE email REGEXP '.com$'; -- 匹配任意字符 + com 
-- 正确：转义点号 
SELECT * FROM products WHERE email REGEXP '\.com$'; -- 匹配字面意思的 .com 
-- 其他需要转义的字符 
SELECT * FROM products WHERE code REGEXP '\\+'; -- 匹配加号 
SELECT * FROM products WHERE code REGEXP '\\?'; -- 匹配问号 
SELECT * FROM products WHERE code REGEXP '\\*'; -- 匹配星号
```
#### 大小写敏感性
```sql
-- 默认情况下，MySQL 正则表达式不区分大小写 
SELECT * FROM products WHERE name REGEXP 'pro'; -- 匹配 Pro, PRO, pro 
-- 使用 BINARY 使其区分大小写 
SELECT * FROM products WHERE name REGEXP BINARY 'pro'; -- 只匹配 pro 
-- 使用 REGEXP_LIKE 函数控制大小写 
SELECT * FROM products WHERE REGEXP_LIKE(name, 'pro', 'c'); -- 区分大小写 
SELECT * FROM products WHERE REGEXP_LIKE(name, 'pro', 'i'); -- 不区分大小写
```
### 正则表达式参考
#### 常用模式
> - 邮箱：^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$
> - 手机号：^1[3-9][0-9]{9}$
> - 身份证：^[1-9][0-9]{5}(19|20)[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9]{3}[0-9Xx]$
> - IP地址：^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$
> - URL：^https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/.*)?$
#### 字符类速查
| 字符类	| 等价表达式 | 	说明| 
| --- | --- | --- |
| [[:alnum:]]	| [A-Za-z0-9]	| 字母和数字|
| [[:alpha:]]	| [A-Za-z]	| 字母|
| [[:digit:]]	| [0-9]	| 数字|
| [[:lower:]]	| [a-z]	| 小写字母|
| [[:upper:]]	| [A-Z]	| 大写字母|
| [[:space:]]	| [ \t\n\r\f\v]	| 空白字符|
| [[:punct:]]	| 	| 标点符号|


## MySQL 事务
### 事务概述
> 事务（Transaction）是数据库管理系统执行过程中的一个逻辑单位，由一个有限的数据库操作序列构成。事务确保数据库的完整性和一致性，即使在系统故障的情况下也能保持数据的可靠性。

#### 事务的特点
- 事务是一个不可分割的工作单位
- 事务中的操作要么全部成功，要么全部失败
- 事务必须满足 ACID 特性
- 事务可以包含多个 SQL 语句
### ACID 特性
ACID 是事务处理的四个基本特性，确保数据库事务的可靠性
- 原子性 (Atomicity)
事务是一个不可分割的工作单位，要么全部完成，要么全部不做
- 一致性 (Consistency)
事务必须使数据库从一个一致性状态变换到另一个一致性状态
- 隔离性 (Isolation)
一个事务的执行不能被其他事务干扰
- 持久性 (Durability)
事务一旦提交，其对数据库的改变就是永久性的


### 事务控制语句
```sql
-- 开始事务 START TRANSACTION; -- 或者 BEGIN; 
-- 提交事务 COMMIT; 
-- 回滚事务 ROLLBACK; 
-- 设置保存点 SAVEPOINT savepoint_name; 
-- 回滚到保存点 ROLLBACK TO savepoint_name; 
-- 释放保存点 RELEASE SAVEPOINT savepoint_name;
```
> 注意：MySQL 默认开启自动提交模式（autocommit=1），每个 SQL 语句都会自动提交。要使用事务，需要显式开始事务或关闭自动提交。

### 示例数据准备
```sql
-- 创建银行账户表 
CREATE TABLE accounts ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    account_number VARCHAR(20) UNIQUE NOT NULL, 
    account_name VARCHAR(50) NOT NULL, 
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 
-- 创建交易记录表 
CREATE TABLE transactions ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    from_account VARCHAR(20), 
    to_account VARCHAR(20), 
    amount DECIMAL(15,2) NOT NULL, 
    transaction_type ENUM('transfer', 'deposit', 'withdraw') NOT NULL, description VARCHAR(255), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (from_account) REFERENCES accounts(account_number), 
    FOREIGN KEY (to_account) REFERENCES accounts(account_number) 
); 
-- 插入测试数据 
INSERT INTO accounts (account_number, account_name, balance) VALUES 
('ACC001', '张三', 10000.00), 
('ACC002', '李四', 5000.00), 
('ACC003', '王五', 8000.00);
```
### 基本事务操作
#### 简单转账事务
```sql
-- 转账事务：从张三账户转 1000 元到李四账户 
START TRANSACTION; 
-- 检查余额 
SELECT balance FROM accounts WHERE account_number = 'ACC001'; 
-- 扣除转出账户余额 
UPDATE accounts SET balance = balance - 1000.00 WHERE account_number = 'ACC001'; 
-- 增加转入账户余额 
UPDATE accounts SET balance = balance + 1000.00 WHERE account_number = 'ACC002'; 
-- 记录交易 
INSERT INTO transactions (from_account, to_account, amount, transaction_type, description) VALUES ('ACC001', 'ACC002', 1000.00, 'transfer', '转账给李四'); 
-- 提交事务 
COMMIT;
```
#### 带错误处理的事务
```sql
-- 带余额检查的转账事务 
START TRANSACTION; 
-- 检查转出账户余额 
SELECT @from_balance := balance FROM accounts WHERE account_number = 'ACC001'; 
-- 检查余额是否足够 
SELECT @sufficient := (@from_balance >= 2000.00); 
-- 如果余额不足，回滚事务 
-- 在实际应用中，这通常在应用程序中处理 
UPDATE accounts SET balance = balance - 2000.00 WHERE account_number = 'ACC001' AND balance >= 2000.00; 
-- 检查是否成功更新（ROW_COUNT() 返回受影响的行数） 
SELECT @updated := ROW_COUNT(); 
-- 如果更新失败，回滚 
-- 在存储过程中可以使用条件语句 
UPDATE accounts SET balance = balance + 2000.00 WHERE account_number = 'ACC002'; 
INSERT INTO transactions (from_account, to_account, amount, transaction_type, description) VALUES ('ACC001', 'ACC002', 2000.00, 'transfer', '大额转账'); 
-- 提交事务 
COMMIT;
```
### 保存点的使用
```sql
-- 使用保存点的复杂事务 
START TRANSACTION; 
-- 第一步：存款 
UPDATE accounts SET balance = balance + 500.00 WHERE account_number = 'ACC001'; INSERT INTO transactions (to_account, amount, transaction_type, description) VALUES ('ACC001', 500.00, 'deposit', '现金存款'); 
-- 设置保存点 
SAVEPOINT after_deposit; 
-- 第二步：转账 
UPDATE accounts SET balance = balance - 300.00 WHERE account_number = 'ACC001'; 
UPDATE accounts SET balance = balance + 300.00 WHERE account_number = 'ACC003'; 
INSERT INTO transactions (from_account, to_account, amount, transaction_type, description) VALUES ('ACC001', 'ACC003', 300.00, 'transfer', '转账给王五'); 
-- 设置另一个保存点 
SAVEPOINT after_transfer; 
-- 第三步：尝试大额提取（可能失败） 
UPDATE accounts SET balance = balance - 15000.00 WHERE account_number = 'ACC001' AND balance >= 15000.00; 
-- 如果提取失败，回滚到转账后的状态 
-- 检查是否成功 
SELECT ROW_COUNT() as affected_rows; 
-- 假设提取失败，回滚到转账后 
ROLLBACK TO after_transfer; 
-- 提交剩余的操作（存款和转账） 
COMMIT;
```

### 事务隔离级别
MySQL 支持四种事务隔离级别，用于控制事务之间的相互影响：

| 隔离级别	|脏读	|不可重复读	|幻读	|说明|
| --- | --- | --- | --- | --- |
| READ UNCOMMITTED	|可能	|可能	|可能	|最低级别，性能最好
| READ COMMITTED	|避免	|可能	|可能	|Oracle 默认级别
| REPEATABLE READ	|避免	|避免	|可能	|MySQL 默认级别
| SERIALIZABLE	|避免	|避免	|避免	|最高级别，性能最差|

- 脏读：一个事务读取到了另一个事务未提交的数据。
- 不可重复读：一个事务在两次读取之间，另一个事务修改了数据，导致第一次读取的数据与第二次读取的数据不同。
- 幻读：一个事务在两次读取之间，另一个事务插入了新的符合查询条件的数据，导致第一次读取的数据与第二次读取的数据不同。


1. 读未提交：无锁，不能解决脏读、不可重复读、幻读。
2. 读已提交：加锁，解决脏读，不能解决不可重复读、幻读。 
3. 可重复读：加行锁，解决脏读、不可重复读，不能解决幻读。 
4. 串行化：加表锁，解决脏读、不可重复读、幻读。 

| 隔离级别                                         | 加锁/实现机制                                                                                  | 解决的异常（√）（不可能再出现）                         | 仍可能存在的异常（×）                | 一句话记忆         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------- | ------------- |
| **Read Uncommitted** **（读未提交）**              | 读：不加锁，直接读最新版本 <br>写：对修改行加 **X 锁**（排它）                                                    | × 所有异常都**不能解决**                          | 脏读、不可重复读、幻读                | “无锁裸奔”        |
| **Read Committed** **（读已提交）**                | 读：不加锁，**每次快照读最新已提交版本**（MVCC） <br>写：X 锁 + 短暂 S 锁（间隙锁**不启用**）                              | √ **脏读**                                 | × 不可重复读、幻读                 | “语句级快照”       |
| **Repeatable Read** **（可重复读）**（MySQL **默认**） | 读：不加锁，**事务级快照**（MVCC） <br>写：X 锁 + **间隙锁（Gap Lock）** <br>范围查询会加 **Next-Key Lock**（行锁+间隙锁） | √ 脏读、不可重复读 <br>√ **幻读（InnoDB 额外用间隙锁解决）** | × 幻读（理论上存在，**InnoDB 已屏蔽**） | “事务级快照 + 间隙锁” |
| **Serializable** **（串行化）**                   | 读：加 **共享 Next-Key Lock**（S 锁） <br>写：X 锁 + 间隙锁 <br>实质：**所有 select 也加锁，读写互斥**              | √ 脏读、不可重复读、幻读 <br>√ **所有异常都不可能**         | 无（性能最差）                    | “读写互斥，单线程错觉”  |

#### 设置隔离级别
```sql
-- 查看当前隔离级别 
SELECT @@transaction_isolation; 
-- 设置会话级别的隔离级别 
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED; 
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ; 
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; 
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE; 
-- 设置全局隔离级别 
SET GLOBAL TRANSACTION ISOLATION LEVEL REPEATABLE READ; 
-- 为下一个事务设置隔离级别 
SET TRANSACTION ISOLATION LEVEL READ COMMITTED; 
START TRANSACTION; 
-- 事务操作 
COMMIT;
```
#### 隔离级别演示
```sql
-- 会话 1：演示不可重复读 
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED; START TRANSACTION; SELECT balance FROM accounts WHERE account_number = 'ACC001'; 
-- 第一次读取 
-- 此时会话 2 修改了数据 
SELECT balance FROM accounts WHERE account_number = 'ACC001'; 
-- 第二次读取，结果可能不同 
COMMIT; 
-- 会话 1：演示可重复读 
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ; START TRANSACTION; SELECT balance FROM accounts WHERE account_number = 'ACC001'; 
-- 第一次读取 
-- 此时会话 2 修改了数据 
SELECT balance FROM accounts WHERE account_number = 'ACC001'; 
-- 第二次读取，结果相同 
COMMIT;
```

### 锁机制
#### 表级锁
```sql
-- 锁定表（读锁） 
LOCK TABLES accounts READ; 
SELECT * FROM accounts; -- 可以读取 
-- 
UPDATE accounts SET balance = 1000 WHERE id = 1; -- 会报错，不能写入 
UNLOCK TABLES; 
-- 锁定表（写锁） 
LOCK TABLES accounts WRITE; 
SELECT * FROM accounts; -- 可以读取 
UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC001'; -- 可以写入 
UNLOCK TABLES;
```
#### 行级锁
```sql
-- 共享锁（读锁） 
START TRANSACTION; 
SELECT * FROM accounts WHERE account_number = 'ACC001' LOCK IN SHARE MODE; -- 其他事务可以读取，但不能修改这行数据 
COMMIT; 
-- 排他锁（写锁） 
START TRANSACTION; 
SELECT * FROM accounts WHERE account_number = 'ACC001' FOR UPDATE; -- 其他事务不能读取或修改这行数据 
UPDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC001'; 
COMMIT;
```
#### 死锁处理
```sql
-- 查看死锁信息 
SHOW ENGINE INNODB STATUS; 
-- 设置死锁超时时间 
SET innodb_lock_wait_timeout = 50; 
-- 死锁示例（需要两个会话同时执行） 
-- 会话 1: 
START TRANSACTION; UPDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC001'; 
-- 等待会话 2 执行第一个 
UPDATE UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC002'; COMMIT; 
-- 会话 2: 
START TRANSACTION; UPDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC002'; 
-- 等待会话 1 执行第一个 
UPDATE UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC001'; COMMIT;
```
### 自动提交模式
```sql
-- 查看自动提交状态 
SELECT @@autocommit; 
-- 关闭自动提交 
SET autocommit = 0; 
-- 现在每个语句都需要手动提交 
UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC001'; 
COMMIT; -- 必须手动提交 
-- 开启自动提交 
SET autocommit = 1; 
-- 每个语句自动提交 
UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC001'; -- 自动提交，无需手动 COMMIT
```
> 注意：即使在自动提交模式下，START TRANSACTION 也会开始一个显式事务，需要手动 COMMIT 或 ROLLBACK。

### 存储过程中的事务
```sql
-- 创建转账存储过程 
DELIMITER // 
CREATE PROCEDURE TransferMoney( IN from_acc VARCHAR(20), IN to_acc VARCHAR(20), IN amount DECIMAL(15,2), IN description VARCHAR(255), OUT result_code INT, OUT result_message VARCHAR(255) ) 
BEGIN 
DECLARE from_balance DECIMAL(15,2); 
DECLARE exit_flag INT DEFAULT 0; -- 声明异常处理 
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
BEGIN SET exit_flag = 1; 
ROLLBACK; 
SET result_code = -1; 
SET result_message = 'Transaction failed due to SQL exception'; 
END; 
-- 开始事务 
START TRANSACTION; 
-- 检查转出账户余额 
SELECT balance INTO from_balance FROM accounts WHERE account_number = from_acc; 
-- 检查余额是否足够 
IF from_balance < amount THEN ROLLBACK; SET result_code = -2; SET result_message = 'Insufficient balance'; ELSE 
-- 执行转账 
UPDATE accounts SET balance = balance - amount WHERE account_number = from_acc; UPDATE accounts SET balance = balance + amount WHERE account_number = to_acc; 
-- 记录交易 
INSERT INTO transactions (from_account, to_account, amount, transaction_type, description) VALUES (from_acc, to_acc, amount, 'transfer', description); 
-- 检查是否有异常 
IF exit_flag = 0 THEN COMMIT; SET result_code = 0; SET result_message = 'Transfer successful'; END IF; END IF; END // DELIMITER ; 
-- 调用存储过程 
CALL TransferMoney('ACC001', 'ACC002', 500.00, '存储过程转账', @code, @msg); SELECT @code, @msg;
```
### 事务日志和恢复
#### 查看事务状态
```sql
-- 查看当前活动的事务 
SELECT * FROM information_schema.INNODB_TRX; 
-- 查看锁等待情况 
SELECT * FROM information_schema.INNODB_LOCK_WAITS; 
-- 查看锁信息 
SELECT * FROM information_schema.INNODB_LOCKS; 
-- 查看事务隔离级别 
SELECT @@transaction_isolation; 
-- 查看二进制日志状态 
SHOW BINARY LOGS; 
-- 查看事务日志大小 
SHOW VARIABLES LIKE 'innodb_log_file_size';
```
#### 事务性能监控
```sql
-- 查看 InnoDB 状态 
SHOW ENGINE INNODB STATUS; 
-- 查看事务相关的状态变量 
SHOW STATUS LIKE 'Innodb_rows_%'; 
SHOW STATUS LIKE 'Com_commit'; 
SHOW STATUS LIKE 'Com_rollback'; 
-- 查看锁等待统计 
SHOW STATUS LIKE 'Innodb_lock_time%'; 
SHOW STATUS LIKE 'Innodb_deadlocks';
```
### 事务最佳实践
- 保持事务尽可能短小，减少锁定时间
- 避免在事务中进行用户交互或长时间等待
- 合理选择事务隔离级别
- 使用适当的锁策略，避免死锁
- 在应用程序中正确处理事务异常
- 定期监控事务性能和死锁情况
#### 事务设计原则
```sql
-- 好的事务设计 
START TRANSACTION; 
-- 1. 快速获取需要的数据 
SELECT balance FROM accounts WHERE account_number = 'ACC001' FOR UPDATE; 
-- 2. 执行必要的业务逻辑 
UPDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC001'; UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC002'; 
-- 3. 立即提交 
COMMIT; 
-- 避免的做法 
START TRANSACTION; 
SELECT balance FROM accounts WHERE account_number = 'ACC001'; 
-- 不要在事务中进行复杂计算或外部调用 
-- 不要等待用户输入 
-- 不要进行长时间的操作 U
PDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC001'; 
COMMIT;
```
#### 错误处理模式
```sql
-- 基本错误处理模式 
START TRANSACTION; 
-- 1. 快速获取需要的数据 
SELECT balance FROM accounts WHERE account_number = 'ACC001' FOR UPDATE; 
-- 2. 执行必要的业务逻辑 
UPDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC001'; UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC002'; 
-- 3. 立即提交 
COMMIT; 
-- 错误处理模式 
START TRANSACTION; 
SELECT balance FROM accounts WHERE account_number = 'ACC001' FOR UPDATE; 
-- 2. 执行必要的业务逻辑 
UPDATE accounts SET balance = balance - 100 WHERE account_number = 'ACC001'; 
-- 3. 检查是否有错误 
IF (some_error_condition) THEN ROLLBACK; ELSE COMMIT; END IF;
```
```sql
-- 应用程序中的事务处理模式（伪代码） 
/* 
BEGIN START TRANSACTION; 
TRY { 
-- 执行业务操作 
UPDATE accounts SET balance = balance - amount WHERE account_number = from_account; 
UPDATE accounts SET balance = balance + amount WHERE account_number = to_account; 
INSERT INTO transactions (...) VALUES (...); COMMIT; return success; 
} CATCH (Exception e) { 
    ROLLBACK; 
    log_error(e); 
    return failure; 
} END */
```
### 常见问题和解决方案

- 长事务导致锁等待和性能问题
- 死锁导致事务回滚
- 隔离级别设置不当导致数据不一致
- 忘记提交或回滚事务
- 在事务中执行 DDL 语句导致隐式提交
#### DDL 语句的隐式提交
```sql
-- 注意：DDL 语句会导致隐式提交 
START TRANSACTION; UPDATE accounts SET balance = balance + 100 WHERE account_number = 'ACC001'; 
-- 下面的 DDL 语句会自动提交上面的 
UPDATE CREATE TABLE temp_table (id INT); 
-- 隐式提交 
-- 此时无法回滚之前的 UPDATE 操作 
ROLLBACK; -- 只能回滚 CREATE TABLE 之后的操作
```
#### 事务超时处理
```sql
-- 设置事务超时时间 
SET SESSION innodb_lock_wait_timeout = 10; -- 10秒超时 
-- 设置事务大小限制 
SET SESSION max_binlog_cache_size = 1048576; -- 1MB 
-- 监控长时间运行的事务 
SELECT trx_id, trx_started, trx_state, trx_requested_lock_id, trx_wait_started, trx_mysql_thread_id, TIMESTAMPDIFF(SECOND, trx_started, NOW()) as duration_seconds FROM information_schema.INNODB_TRX WHERE TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30; -- 超过30秒的事务
```

## MySQL ALTER 命令 

### ALTER 命令概述
> ALTER 命令用于修改已存在的数据库表结构，包括添加、删除、修改列，添加或删除约束，重命名表等操作。这是数据库维护和演进过程中最常用的命令之一。

#### ALTER 命令的主要功能
- 添加、删除、修改表列
- 添加、删除索引和约束
- 修改表名和列名
- 修改表的存储引擎和字符集
- 添加、删除分区
> 注意：ALTER 操作可能会锁定表，影响生产环境的性能。在生产环境中执行 ALTER 操作前，请务必做好备份和性能评估。

### 示例数据准备
```sql
-- 创建测试表 
CREATE TABLE employees ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    name VARCHAR(50) NOT NULL, 
    email VARCHAR(100), 
    age INT, 
    salary DECIMAL(10,2), 
    department VARCHAR(50), 
    hire_date DATE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 
-- 插入测试数据 
INSERT INTO employees (name, email, age, salary, department, hire_date) VALUES 
('张三', 'zhangsan@company.com', 28, 8000.00, '技术部', '2020-01-15'), 
('李四', 'lisi@company.com', 32, 9500.00, '销售部', '2019-03-20'), 
('王五', 'wangwu@company.com', 26, 7500.00, '技术部', '2021-06-10'), 
('赵六', 'zhaoliu@company.com', 35, 12000.00, '管理部', '2018-11-05'); 
-- 查看表结构 
DESC employees;
```
### 添加列
#### 基本语法
```sql
-- 添加列的基本语法 
ALTER TABLE table_name ADD COLUMN column_name data_type [constraints]; 
-- 在指定位置添加列 
ALTER TABLE table_name ADD COLUMN column_name data_type AFTER existing_column; 
ALTER TABLE table_name ADD COLUMN column_name data_type FIRST;
```
> 注意：添加列时，应考虑数据类型、约束（如 NOT NULL、DEFAULT）和索引（如 UNIQUE、INDEX）。
#### 实际示例
```sql
-- 添加电话号码列 
ALTER TABLE employees ADD COLUMN phone VARCHAR(20); 
-- 添加性别列，并设置默认值 
ALTER TABLE employees ADD COLUMN gender ENUM('M', 'F', 'Other') DEFAULT 'M'; 
-- 在 name 列后添加员工编号 
ALTER TABLE employees ADD COLUMN employee_id VARCHAR(10) AFTER name; 
-- 在表的开头添加序号列 
ALTER TABLE employees ADD COLUMN seq_no INT AUTO_INCREMENT FIRST, ADD PRIMARY KEY(seq_no); 
-- 添加多个列 
ALTER TABLE employees ADD COLUMN address TEXT, ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active', ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP; 
-- 查看修改后的表结构 
DESC employees;
```
### 删除列
```sql
-- 删除单个列 
ALTER TABLE employees DROP COLUMN phone; 
-- 删除多个列 
ALTER TABLE employees DROP COLUMN address, DROP COLUMN status; 
```
> 注意：删除列会永久丢失数据，请谨慎操作
警告：删除列操作是不可逆的，会永久删除该列的所有数据。在生产环境中执行前请务必备份数据。
### 修改列
#### 修改列定义
```sql
-- 修改列的数据类型 
ALTER TABLE employees MODIFY COLUMN salary DECIMAL(12,2); 
-- 修改列的数据类型和约束 
-- 修改列的默认值 
ALTER TABLE employees ALTER COLUMN gender SET DEFAULT 'F'; 
-- 删除列的默认值 
ALTER TABLE employees ALTER COLUMN gender DROP DEFAULT;
```
#### 重命名列
```sql
-- 重命名列（MySQL 8.0+） 
ALTER TABLE employees RENAME COLUMN employee_id TO emp_id; 
-- 使用 CHANGE 重命名并修改列定义 
ALTER TABLE employees CHANGE COLUMN emp_id employee_code VARCHAR(15) NOT NULL; 
-- 只重命名，保持原有定义 
ALTER TABLE employees CHANGE COLUMN age employee_age INT;
```
#### 修改列位置
```sql
-- 将列移动到指定位置 
ALTER TABLE employees MODIFY COLUMN gender ENUM('M', 'F', 'Other') AFTER employee_age; 
-- 将列移动到表的开头 
ALTER TABLE employees MODIFY COLUMN employee_code VARCHAR(15) FIRST;
```

### 索引操作
#### 添加索引
```sql
-- 添加普通索引 
ALTER TABLE employees ADD INDEX idx_name (name); 
-- 添加唯一索引 
ALTER TABLE employees ADD UNIQUE INDEX idx_email (email); 
-- 添加复合索引 
ALTER TABLE employees ADD INDEX idx_dept_salary (department, salary); 
-- 添加全文索引 
ALTER TABLE employees ADD FULLTEXT INDEX idx_name_fulltext (name); 
-- 查看表的索引 
SHOW INDEX FROM employees;
```

#### 删除索引   
```sql
-- 删除索引 
ALTER TABLE employees DROP INDEX idx_name; ALTER TABLE employees DROP INDEX idx_email; ALTER TABLE employees DROP INDEX idx_dept_salary; 
-- 删除主键（需要先删除 AUTO_INCREMENT 属性） 
ALTER TABLE employees MODIFY COLUMN id INT; ALTER TABLE employees DROP PRIMARY KEY; 
-- 重新添加主键 
ALTER TABLE employees ADD PRIMARY KEY (id); ALTER TABLE employees MODIFY COLUMN id INT AUTO_INCREMENT;
```
### 约束操作
#### 添加约束
```sql
-- 创建部门表用于外键演示 
CREATE TABLE departments ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    name VARCHAR(50) NOT NULL UNIQUE, 
    manager VARCHAR(50) 
); 
INSERT INTO departments (name, manager) VALUES 
('技术部', '张经理'), 
('销售部', '李经理'), 
('管理部', '王经理'); 
-- 添加外键约束 
ALTER TABLE employees ADD COLUMN dept_id INT; 
ALTER TABLE employees ADD CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(id); 
-- 添加检查约束（MySQL 8.0.16+） 
ALTER TABLE employees ADD CONSTRAINT chk_age CHECK (employee_age >= 18 AND employee_age <= 65);
ALTER TABLE employees ADD CONSTRAINT chk_salary CHECK (salary > 0); 
-- 添加唯一约束 
ALTER TABLE employees ADD CONSTRAINT uk_employee_code UNIQUE (employee_code);
```
#### 删除约束
```sql
-- 删除外键约束 
ALTER TABLE employees DROP FOREIGN KEY fk_dept; 
-- 删除检查约束 
ALTER TABLE employees DROP CHECK chk_age; 
ALTER TABLE employees DROP CHECK chk_salary; 
-- 删除唯一约束 
ALTER TABLE employees DROP INDEX uk_employee_code; 
-- 查看表的约束信息 
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees';
```
### 表属性修改
#### 重命名表
```sql
-- 重命名表 
ALTER TABLE employees RENAME TO staff; 
-- 或者使用 RENAME TABLE 语句 
RENAME TABLE staff TO employees; 
-- 同时重命名多个表 
RENAME TABLE employees TO staff, departments TO dept; 
-- 恢复原名 
RENAME TABLE staff TO employees, dept TO departments;
```
#### 修改存储引擎
```sql
-- 查看当前存储引擎 
SHOW CREATE TABLE employees; 
-- 修改存储引擎 
ALTER TABLE employees ENGINE = MyISAM; 
-- 改回 InnoDB 
ALTER TABLE employees ENGINE = InnoDB;
```
#### 修改字符集和排序规则   
```sql
-- 修改表的字符集 
ALTER TABLE employees CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
-- 只修改表的默认字符集（不影响现有数据） 
ALTER TABLE employees DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
-- 修改特定列的字符集 
ALTER TABLE employees MODIFY COLUMN name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 修改自增起始值
```sql
-- 修改自增起始值 
ALTER TABLE employees AUTO_INCREMENT = 1000; 
-- 查看当前自增值 
SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees';
```

### 分区操作
#### 添加分区
```sql
-- 创建分区表示例 
CREATE TABLE sales ( id INT AUTO_INCREMENT, sale_date DATE, amount DECIMAL(10,2), region VARCHAR(50), PRIMARY KEY (id, sale_date) ) 
PARTITION BY RANGE (YEAR(sale_date)) 
( 
PARTITION p2020 VALUES LESS THAN (2021), 
PARTITION p2021 VALUES LESS THAN (2022), 
PARTITION p2022 VALUES LESS THAN (2023) 
); 
-- 添加新分区 
ALTER TABLE sales ADD PARTITION ( PARTITION p2023 VALUES LESS THAN (2024) ); 
-- 删除分区 
ALTER TABLE sales DROP PARTITION p2020; 
-- 重新组织分区 
ALTER TABLE sales REORGANIZE PARTITION p2023 INTO ( PARTITION p2023_h1 VALUES LESS THAN (2023-07-01), PARTITION p2023_h2 VALUES LESS THAN (2024) );
```
### 复杂的 ALTER 操作
#### 多个操作组合
```sql
-- 在一个 ALTER 语句中执行多个操作 
ALTER TABLE employees 
ADD COLUMN middle_name VARCHAR(50) AFTER name, 
MODIFY COLUMN salary DECIMAL(15,2) NOT NULL, 
ADD INDEX idx_hire_date (hire_date), 
DROP COLUMN updated_at, 
RENAME TO company_employees; 
-- 恢复表名 
ALTER TABLE company_employees RENAME TO employees;
```
#### 条件性 ALTER 操作
```sql
-- 检查列是否存在再添加 
SET @sql = ( SELECT IF( COUNT(*) = 0, 'ALTER TABLE employees ADD COLUMN bonus DECIMAL(10,2) DEFAULT 0', 'SELECT "Column bonus already exists" as message' ) 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'bonus' ); 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;
```

### ALTER 操作的性能考虑

- 在低峰期执行 ALTER 操作
- 对大表使用在线 DDL 功能
- 合并多个 ALTER 操作到一个语句中
- 监控 ALTER 操作的进度
- 考虑使用第三方工具（如 pt-online-schema-change）
#### 在线 DDL
```sql
-- 使用在线 DDL（MySQL 5.6+） 
ALTER TABLE employees ADD COLUMN new_column VARCHAR(100), ALGORITHM = INPLACE, LOCK = NONE; 
-- 查看支持的 ALTER 操作类型 
SELECT OPERATION, INSTANT, IN_PLACE, COPIES_TABLE, ALLOWS_CONCURRENT_DML, ALLOWS_CONCURRENT_QUERY 
FROM information_schema.INNODB_ONLINE_ALTER_LOG;
```
#### 监控 ALTER 进度
```sql
-- 查看正在执行的 ALTER 操作 
SHOW PROCESSLIST; 
-- 查看 InnoDB 状态 
SHOW ENGINE INNODB STATUS; 
-- 查看 ALTER 操作的详细信息 
SELECT EVENT_NAME, WORK_COMPLETED, WORK_ESTIMATED, ROUND(100 * WORK_COMPLETED / WORK_ESTIMATED, 2) as PCT_COMPLETED 
FROM performance_schema.events_stages_current 
WHERE EVENT_NAME LIKE 'stage/innodb/alter%';
```

### ALTER 操作的最佳实践
- 在生产环境执行 ALTER 前务必备份数据
- 在测试环境先验证 ALTER 操作
- 评估 ALTER 操作对性能的影响
- 准备回滚方案
- 在维护窗口期执行大型 ALTER 操作
#### 备份和恢复策略
```sql
-- 执行 ALTER 前的备份 
mysqldump -u username -p database_name table_name > table_backup.sql 
-- 或者创建表的副本 
CREATE TABLE employees_backup AS SELECT * FROM employees; 
-- 如果需要回滚，可以从备份恢复 
-- 
mysql -u username -p database_name < table_backup.sql -- 或者从副本恢复 -- 
DROP TABLE employees; -- 
CREATE TABLE employees AS SELECT * FROM employees_backup;
```
#### 分步执行策略
```sql
-- 对于大表，分步执行 ALTER 操作 
-- 步骤1：添加新列 
ALTER TABLE large_table ADD COLUMN new_column VARCHAR(100); 
-- 步骤2：填充数据（分批进行） 
UPDATE large_table SET new_column = 'default_value' 
WHERE id BETWEEN 1 AND 10000; 
UPDATE large_table SET new_column = 'default_value' 
WHERE id BETWEEN 10001 AND 20000; -- 继续分批更新... 
-- 步骤3：添加约束 
ALTER TABLE large_table MODIFY COLUMN new_column VARCHAR(100) NOT NULL;
```
### 常见错误和解决方案
| 错误类型	| 原因	| 解决方案|
| --- | --- | --- |
| 表被锁定	| 其他事务正在使用表	| 等待事务完成或终止阻塞事务
| 磁盘空间不足	| ALTER 操作需要额外空间	| 清理磁盘空间或使用在线 DDL
| 外键约束冲突	| 删除被外键引用的列	| 先删除外键约束再执行操作
| 数据类型不兼容	| 新数据类型无法容纳现有数据	| 先清理数据或选择兼容的数据类型
| 唯一约束冲突	| 添加唯一约束时存在重复数据	| 先清理重复数据再添加约束|

#### 错误处理示例
```sql
-- 处理外键约束错误 
-- 查看外键约束 
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'employees'; 
-- 临时禁用外键检查 
SET FOREIGN_KEY_CHECKS = 0; 
ALTER TABLE employees DROP COLUMN dept_id; 
SET FOREIGN_KEY_CHECKS = 1; 
-- 处理重复数据 
-- 查找重复的邮箱 
SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1; 
-- 删除重复记录（保留 ID 最小的） 
DELETE e1 FROM employees e1 INNER JOIN employees e2 WHERE e1.id > e2.id AND e1.email = e2.email; 
-- 然后添加唯一约束 
ALTER TABLE employees ADD UNIQUE INDEX uk_email (email);
```

## MySQL 索引
### 索引概述
> 索引是数据库中用于快速查找数据的数据结构。它类似于书籍的目录，可以帮助数据库引擎快速定位到所需的数据行，而不需要扫描整个表。

#### 索引的优势
- 大幅提高查询速度
- 加快 WHERE 子句的过滤速度
- 提高 ORDER BY 和 GROUP BY 的性能
- 加速表连接操作
- 确保数据的唯一性
#### 索引的劣势
- 占用额外的存储空间
- 降低 INSERT、UPDATE、DELETE 的性能
- 维护索引需要额外的开销

### 索引类型
- 主键索引
PRIMARY KEY，唯一且不能为空，每个表只能有一个

- 唯一索引
UNIQUE，确保列值的唯一性，可以有多个

- 普通索引
INDEX，最基本的索引类型，没有唯一性限制

- 复合索引
多列组合的索引，遵循最左前缀原则

- 全文索引
FULLTEXT，用于全文搜索，支持自然语言搜索

- 空间索引
SPATIAL，用于地理空间数据类型

### 示例数据准备
```sql
-- 创建测试表 
CREATE TABLE products ( 
    id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, 
    category VARCHAR(50), 
    price DECIMAL(10,2), 
    brand VARCHAR(50), 
    description TEXT, 
    stock_quantity INT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
); 
-- 插入大量测试数据 
INSERT INTO products (name, category, price, brand, description, stock_quantity) VALUES 
('iPhone 14 Pro', '手机', 7999.00, 'Apple', 'Apple iPhone 14 Pro 128GB 深空黑色', 50), 
('Samsung Galaxy S23', '手机', 5999.00, 'Samsung', 'Samsung Galaxy S23 256GB 幻影黑', 30), 
('MacBook Air M2', '笔记本', 8999.00, 'Apple', 'Apple MacBook Air 13英寸 M2芯片', 20), 
('Dell XPS 13', '笔记本', 6999.00, 'Dell', 'Dell XPS 13 9320 Intel i7', 15), 
('iPad Pro 11', '平板', 6199.00, 'Apple', 'Apple iPad Pro 11英寸 第4代', 25), 
('Surface Pro 9', '平板', 7888.00, 'Microsoft', 'Microsoft Surface Pro 9 Intel i5', 18), 
('AirPods Pro 2', '耳机', 1899.00, 'Apple', 'Apple AirPods Pro 第2代', 100), 
('Sony WH-1000XM5', '耳机', 2399.00, 'Sony', 'Sony WH-1000XM5 无线降噪耳机', 40); 
-- 为了演示，需要更多数据 
-- 使用存储过程生成大量测试数据 
DELIMITER // 
CREATE PROCEDURE GenerateTestData() 
    BEGIN 
    DECLARE i INT DEFAULT 1; 
    WHILE i <= 10000 
    DO 
    INSERT INTO products (name, category, price, brand, description, stock_quantity) VALUES 
    (CONCAT('Product ', i), 
    CASE (i % 4) 
    WHEN 0 THEN '手机' WHEN 1 THEN '笔记本' 
    WHEN 2 THEN '平板' 
    ELSE '耳机' END, 
    ROUND(RAND() * 10000 + 100, 2), 
    CASE (i % 5) 
    WHEN 0 THEN 'Apple' 
    WHEN 1 THEN 'Samsung' 
    WHEN 2 THEN 'Dell' 
    WHEN 3 THEN 'Sony' 
    ELSE 'Microsoft' END, 
    CONCAT('Description for product ', i), FLOOR(RAND() * 100) + 1 ); 
    SET i = i + 1; 
    END WHILE; 
    END 
// DELIMITER ;
 -- 调用存储过程生成数据 
 CALL GenerateTestData();
-- 删除存储过程 
DROP PROCEDURE GenerateTestData;
```
### 创建索引
#### 基本语法
```sql
-- 创建普通索引 
CREATE INDEX index_name ON table_name (column_name); 
-- 创建唯一索引 
CREATE UNIQUE INDEX index_name ON table_name (column_name); 
-- 创建复合索引 
CREATE INDEX index_name ON table_name (column1, column2, column3); 
-- 创建全文索引 
CREATE FULLTEXT INDEX index_name ON table_name (column_name); 
-- 使用 ALTER TABLE 创建索引 
ALTER TABLE table_name ADD INDEX index_name (column_name); 
ALTER TABLE table_name ADD UNIQUE INDEX index_name (column_name); 
ALTER TABLE table_name ADD FULLTEXT INDEX index_name (column_name);
```
#### 实际示例
```sql
-- 为产品名称创建索引 
CREATE INDEX idx_product_name ON products (name); 
-- 为品牌创建索引 
CREATE INDEX idx_brand ON products (brand); 
-- 为价格创建索引 
CREATE INDEX idx_price ON products (price); 
-- 为分类和品牌创建复合索引 
CREATE INDEX idx_category_brand ON products (category, brand); 
-- 为价格范围查询创建索引 
CREATE INDEX idx_price_range ON products (price, stock_quantity); 
-- 为产品描述创建全文索引 
CREATE FULLTEXT INDEX idx_description_fulltext ON products (description); 
-- 为创建时间创建索引 
CREATE INDEX idx_created_at ON products (created_at); 
-- 查看表的所有索引 
SHOW INDEX FROM products;
```
### 查看索引信息
```sql
-- 查看表的索引 
SHOW INDEX FROM products; 
-- 查看索引的详细信息 
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE, INDEX_TYPE 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' 
ORDER BY INDEX_NAME, SEQ_IN_INDEX; 
-- 查看索引的大小 
SELECT TABLE_NAME, INDEX_NAME, ROUND(STAT_VALUE * @@innodb_page_size / 1024 / 1024, 2) AS 'Size (MB)' 
FROM mysql.innodb_index_stats 
WHERE TABLE_NAME = 'products' AND STAT_NAME = 'size'; 
-- 查看表的存储空间使用情况 
SELECT TABLE_NAME, ROUND(DATA_LENGTH / 1024 / 1024, 2) AS 'Data Size (MB)', ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS 'Index Size (MB)', ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Total Size (MB)' 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products';
```
### 索引的使用和优化
#### 查询执行计划
```sql
-- 使用 EXPLAIN 分析查询 
EXPLAIN SELECT * FROM products WHERE name = 'iPhone 14 Pro'; 
EXPLAIN SELECT * FROM products WHERE brand = 'Apple'; 
EXPLAIN SELECT * FROM products WHERE category = '手机' AND brand = 'Apple'; 
EXPLAIN SELECT * FROM products WHERE price BETWEEN 1000 AND 5000; 
-- 使用 EXPLAIN FORMAT=JSON 获取详细信息 
EXPLAIN FORMAT=JSON SELECT * FROM products WHERE category = '手机' AND price > 5000; 
-- 分析索引使用情况 
EXPLAIN SELECT * FROM products WHERE category = '手机' AND brand = 'Apple' AND price > 5000 ORDER BY created_at DESC;
```
#### 复合索引的最左前缀原则
```sql
-- 创建复合索引 (category, brand, price) 
CREATE INDEX idx_category_brand_price ON products (category, brand, price); 
-- 以下查询可以使用索引 
EXPLAIN SELECT * FROM products WHERE category = '手机'; -- 使用索引 
EXPLAIN SELECT * FROM products WHERE category = '手机' AND brand = 'Apple'; -- 使用索引 
EXPLAIN SELECT * FROM products WHERE category = '手机' AND brand = 'Apple' AND price > 5000; -- 使用索引 
-- 以下查询不能完全使用索引 
EXPLAIN SELECT * FROM products WHERE brand = 'Apple'; -- 不能使用索引 
EXPLAIN SELECT * FROM products WHERE price > 5000; -- 不能使用索引 
EXPLAIN SELECT * FROM products WHERE brand = 'Apple' AND price > 5000; -- 不能使用索引 
-- 跳过中间列的查询 
EXPLAIN SELECT * FROM products WHERE category = '手机' AND price > 5000; -- 只能使用 category 部分
```
#### 索引覆盖查询
```sql
-- 创建覆盖索引 
CREATE INDEX idx_cover_query ON products (category, brand, price, name); 
-- 覆盖查询（所有需要的列都在索引中） 
EXPLAIN SELECT category, brand, price, name FROM products WHERE category = '手机' AND brand = 'Apple'; 
-- 查看 Extra 列是否显示 "Using index"
```

### 全文索引
#### 创建和使用全文索引
```sql
-- 确保已创建全文索引 
CREATE FULLTEXT INDEX idx_name_desc_fulltext ON products (name, description); 
-- 自然语言模式搜索 
SELECT name, description, MATCH(name, description) AGAINST('iPhone Apple') AS relevance FROM products WHERE MATCH(name, description) AGAINST('iPhone Apple') ORDER BY relevance DESC; 
-- 布尔模式搜索 
SELECT name, description FROM products WHERE MATCH(name, description) AGAINST('+iPhone -Samsung' IN BOOLEAN MODE); 
-- 查询扩展模式 
SELECT name, description FROM products WHERE MATCH(name, description) AGAINST('Apple' WITH QUERY EXPANSION); 
-- 短语搜索 
SELECT name, description FROM products WHERE MATCH(name, description) AGAINST('"iPhone 14"' IN BOOLEAN MODE);
```
#### 全文索引配置
```sql
-- 查看全文索引相关配置 
SHOW VARIABLES LIKE 'ft_%'; 
-- 设置最小词长度 
SET GLOBAL ft_min_word_len = 2; 
-- 查看停用词 
SELECT * FROM information_schema.INNODB_FT_DEFAULT_STOPWORD; 
-- 查看全文索引统计信息 
SELECT * FROM information_schema.INNODB_FT_INDEX_TABLE;
```
### 索引优化技巧
#### 索引选择性分析
```sql
-- 分析列的选择性（唯一值的比例） 
SELECT COUNT(DISTINCT category) / COUNT(*) AS category_selectivity, COUNT(DISTINCT brand) / COUNT(*) AS brand_selectivity, COUNT(DISTINCT price) / COUNT(*) AS price_selectivity, COUNT(DISTINCT name) / COUNT(*) AS name_selectivity FROM products; 
-- 查看列的基数（唯一值的数量） 
SELECT 'category' AS column_name, COUNT(DISTINCT category) AS cardinality FROM products UNION ALL SELECT 'brand' AS column_name, COUNT(DISTINCT brand) AS cardinality FROM products UNION ALL SELECT 'price' AS column_name, COUNT(DISTINCT price) AS cardinality FROM products; 
-- 分析数据分布 
SELECT category, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM products), 2) as percentage FROM products GROUP BY category ORDER BY count DESC;
```
#### 前缀索引
```sql
-- 分析字符串列的前缀选择性 
SELECT COUNT(DISTINCT LEFT(name, 5)) / COUNT(*) AS prefix_5_selectivity, COUNT(DISTINCT LEFT(name, 10)) / COUNT(*) AS prefix_10_selectivity, COUNT(DISTINCT LEFT(name, 15)) / COUNT(*) AS prefix_15_selectivity, COUNT(DISTINCT name) / COUNT(*) AS full_selectivity FROM products; 
-- 创建前缀索引 
CREATE INDEX idx_name_prefix ON products (name(10)); 
-- 测试前缀索引的效果 
EXPLAIN SELECT * FROM products WHERE name LIKE 'iPhone%';
```
#### 函数索引（MySQL 8.0+）
```sql
-- 创建函数索引 
CREATE INDEX idx_upper_name ON products ((UPPER(name))); 
-- 创建表达式索引 
CREATE INDEX idx_price_category ON products ((price * 0.8), category); 
-- 使用函数索引 
EXPLAIN SELECT * FROM products WHERE UPPER(name) = 'IPHONE 14 PRO';
```
### 索引监控和维护
#### 索引使用统计
```sql
-- 查看索引使用统计 
SELECT OBJECT_SCHEMA, OBJECT_NAME, INDEX_NAME, COUNT_FETCH, COUNT_INSERT, COUNT_UPDATE, COUNT_DELETE 
FROM performance_schema.table_io_waits_summary_by_index_usage 
WHERE OBJECT_SCHEMA = DATABASE() AND OBJECT_NAME = 'products'; 
-- 查找未使用的索引 
SELECT OBJECT_SCHEMA, OBJECT_NAME, INDEX_NAME 
FROM performance_schema.table_io_waits_summary_by_index_usage 
WHERE OBJECT_SCHEMA = DATABASE() AND OBJECT_NAME = 'products' AND INDEX_NAME IS NOT NULL AND COUNT_STAR = 0;
```
#### 索引维护
```sql
-- 分析表和索引 
ANALYZE TABLE products; 
-- 优化表（重建索引） 
OPTIMIZE TABLE products; 
-- 检查表的完整性 
CHECK TABLE products; 
-- 修复表 
REPAIR TABLE products; 
-- 查看索引统计信息 
SHOW TABLE STATUS LIKE 'products';
```
#### 重建索引
```sql
-- 删除并重建索引 
DROP INDEX idx_category_brand ON products; 
CREATE INDEX idx_category_brand ON products (category, brand); 
-- 使用 ALTER TABLE 重建索引 
ALTER TABLE products DROP INDEX idx_price, ADD INDEX idx_price (price);
```
### 索引设计最佳实践
- 为经常出现在 WHERE 子句中的列创建索引
- 为经常用于 JOIN 的列创建索引
- 为经常用于 ORDER BY 的列创建索引
- 复合索引的列顺序很重要，选择性高的列放在前面
- 避免在小表上创建过多索引
- 定期监控和维护索引

#### 索引设计示例
```sql
-- 针对常见查询模式设计索引 
-- 1. 单列查询 -- 查询：
SELECT * FROM products WHERE brand = 'Apple' CREATE INDEX idx_brand ON products (brand); 
-- 2. 范围查询 -- 查询：
SELECT * FROM products WHERE price BETWEEN 1000 AND 5000 CREATE INDEX idx_price ON products (price); 
-- 3. 多条件查询 -- 查询：
SELECT * FROM products WHERE category = '手机' AND brand = 'Apple' CREATE INDEX idx_category_brand ON products (category, brand); 
-- 4. 排序查询 -- 查询：
SELECT * FROM products WHERE category = '手机' ORDER BY price DESC CREATE INDEX idx_category_price ON products (category, price); 
-- 5. 分组查询 -- 查询：
SELECT category, COUNT(*) FROM products GROUP BY category CREATE INDEX idx_category ON products (category); 
-- 6. 覆盖查询 -- 查询：
SELECT id, name, price FROM products WHERE category = '手机' CREATE INDEX idx_category_cover ON products (category, id, name, price);
```
#### 避免的索引设计
```sql
-- 避免的索引设计模式 
-- 1. 避免在低选择性列上创建索引 
-- 不好：性别列只有 M/F 两个值 -- 
CREATE INDEX idx_gender ON users (gender); -- 避免 
-- 2. 避免在经常更新的列上创建过多索引 
-- 不好：频繁更新的状态列 -- 
CREATE INDEX idx_status ON orders (status); -- 谨慎使用 
-- 3. 避免创建冗余索引 
-- 如果已有 (a, b, c) 索引，就不需要 (a) 和 (a, b) 索引 -- 
CREATE INDEX idx_abc ON table (a, b, c); -- 主索引 -- 
CREATE INDEX idx_a ON table (a); -- 冗余 -- 
CREATE INDEX idx_ab ON table (a, b); -- 冗余 
-- 4. 避免在小表上创建索引 
-- 对于行数很少的表，全表扫描可能比索引查找更快
```
### 性能测试和比较
```sql
-- 性能测试示例 
-- 测试无索引的查询性能 
SET profiling = 1; 
SELECT * FROM products WHERE brand = 'Apple' AND category = '手机'; 
SHOW PROFILES; 
-- 创建索引后测试 
CREATE INDEX idx_brand_category ON products (brand, category); 
SELECT * FROM products WHERE brand = 'Apple' AND category = '手机'; 
SHOW PROFILES; 
-- 比较不同索引顺序的性能 
DROP INDEX idx_brand_category ON products; 
CREATE INDEX idx_category_brand ON products (category, brand); 
SELECT * FROM products WHERE brand = 'Apple' AND category = '手机'; 
SHOW PROFILES; 
-- 关闭性能分析 
SET profiling = 0;
```
#### 慢查询分析
```sql
-- 启用慢查询日志 
SET GLOBAL slow_query_log = 'ON'; 
SET GLOBAL long_query_time = 1; -- 1秒以上的查询记录为慢查询 
-- 查看慢查询日志位置 
SHOW VARIABLES LIKE 'slow_query_log_file'; 
-- 查看慢查询统计 
SHOW GLOBAL STATUS LIKE 'Slow_queries'; 
-- 使用 mysqldumpslow 分析慢查询日志（命令行工具） -- 
mysqldumpslow -s c -t 10 /path/to/slow-query.log
```
### 删除索引
```sql
-- 删除索引的语法 
DROP INDEX index_name ON table_name; 
-- 使用 ALTER TABLE 删除索引 
ALTER TABLE table_name DROP INDEX index_name; 
-- 删除主键索引 
ALTER TABLE table_name DROP PRIMARY KEY; 
-- 删除示例 
DROP INDEX idx_brand ON products; 
DROP INDEX idx_category_brand ON products; 
DROP INDEX idx_description_fulltext ON products; 
-- 批量删除索引 
ALTER TABLE products DROP INDEX idx_price, DROP INDEX idx_created_at, DROP INDEX idx_cover_query;
```
> 注意：删除索引前请确保该索引不被重要查询使用，可以先通过性能监控确认索引的使用情况。
### 索引故障排除
| 问题	| 可能原因	| 解决方案| 
| --- | --- | --- |
| 查询仍然很慢	| 索引未被使用	| 检查查询条件，确保符合索引使用规则 |
| 索引不生效	|数据类型不匹配	|确保查询条件的数据类型与索引列一致 |
| 复合索引无效	|违反最左前缀原则	|调整查询条件或重新设计索引 |
| 插入性能下降	|索引过多	|删除不必要的索引 |
| 索引占用空间大	|索引设计不合理	|使用前缀索引或重新设计 |
```sql
-- 诊断索引问题 
-- 1. 检查查询是否使用了索引 
EXPLAIN SELECT * FROM products WHERE name = 'iPhone'; 
-- 查看 type 列：
-- const > eq_ref > ref > range > index > ALL 
-- 查看 key 列：显示使用的索引名称 
-- 查看 rows 列：扫描的行数 
-- 2. 检查索引的选择性 
SELECT COUNT(DISTINCT column_name) / COUNT(*) AS selectivity FROM table_name; 
-- 3. 检查是否存在函数或表达式 
-- 错误：
WHERE UPPER(name) = 'IPHONE' -- 无法使用普通索引 
-- 正确：
WHERE name = 'iPhone' -- 可以使用索引 
-- 4. 检查数据类型转换 
-- 错误：
WHERE id = '123' -- 如果 id 是 INT 类型 
-- 正确：
WHERE id = 123 -- 避免隐式类型转换
```




