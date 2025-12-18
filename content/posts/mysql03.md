---
title: "MySQL数据操作与查询"
date: 2021-02-08T13:00:00+08:00
draft: false
description: "MySQL数据操作与查询：插入数据、查询数据、更新数据、删除数据等。"
tags: ["MySQL", "数据操作"]
categories: ["Database"]
---
MySQL数据操作与查询：插入数据、查询数据、更新数据、删除数据等。
## MySQL 插入数据
> INSERT 语句用于向数据库表中插入新的数据行。MySQL 提供了多种插入数据的方式，包括单行插入、多行插入、从其他表插入等。
### INSERT 基本语法
#### 单行插入
```sql
-- 基本语法 
INSERT INTO table_name (column1, column2, column3, ...) VALUES (value1, value2, value3, ...); 
-- 示例 
INSERT INTO users (username, email, age) VALUES ('john_doe', 'john@example.com', 25); 
-- 插入所有列（按表结构顺序） 
INSERT INTO users VALUES (1, 'jane_smith', 'jane@example.com', 30, '2024-01-15 10:30:00');
```
#### 多行插入
```sql
-- 一次插入多行数据 
INSERT INTO users (username, email, age) VALUES 
('alice', 'alice@example.com', 28), 
('bob', 'bob@example.com', 32), 
('charlie', 'charlie@example.com', 24); 
-- 大批量插入示例 
INSERT INTO products (name, price, category_id) VALUES 
('iPhone 15', 999.99, 1), 
('Samsung Galaxy S24', 899.99, 1), 
('MacBook Pro', 1999.99, 2), 
('Dell XPS 13', 1299.99, 2), 
('iPad Air', 599.99, 3);
```
### 高级插入操作
#### INSERT IGNORE
```sql
-- 忽略重复键错误 
INSERT IGNORE INTO users (username, email) 
VALUES ('existing_user', 'existing@example.com'), ('new_user', 'new@example.com');
-- 如果 username 或 email 已存在，该行将被忽略 -- 不会产生错误，继续插入其他行
```
#### ON DUPLICATE KEY UPDATE
```sql
-- 重复时更新数据 
INSERT INTO users (id, username, email, login_count) 
VALUES (1, 'john_doe', 'john@example.com', 1) 
ON DUPLICATE KEY UPDATE login_count = login_count + 1, last_login = NOW(); 
-- 批量插入时的重复键处理 
INSERT INTO product_stats (product_id, view_count, sale_count) 
VALUES (1, 10, 2), 
(2, 15, 3), 
(3, 8, 1) 
ON DUPLICATE KEY UPDATE view_count = view_count + VALUES(view_count), sale_count = sale_count + VALUES(sale_count);
```
#### REPLACE 语句
> REPLACE 语句用于替换已存在的行或插入新行。如果行存在，则先删除该行，然后插入新行；如果行不存在，则直接插入新行。
### REPLACE 基本语法
```sql
-- 基本语法 
REPLACE INTO table_name (column1, column2, column3, ...) VALUES (value1, value2, value3, ...); 
-- 示例 
REPLACE INTO users (id, username, email) VALUES (1, 'john_updated', 'john_new@example.com'); 
-- 等同于 
-- DELETE FROM users WHERE id = 1; 
-- INSERT INTO users (id, username, email) VALUES (1, 'john_updated', 'john_new@example.com');   
```
#### INSERT INTO ... SELECT
```sql
-- 从另一个表复制数据 
INSERT INTO backup_users (username, email, created_at) SELECT username, email, created_at FROM users WHERE created_at < '2024-01-01'; 
-- 带条件的复制 
INSERT INTO active_users (user_id, username, email) SELECT id, username, email FROM users WHERE status = 'active' AND last_login > DATE_SUB(NOW(), INTERVAL 30 DAY); 
-- 跨数据库复制 
INSERT INTO archive_db.old_orders SELECT * FROM current_db.orders WHERE order_date < '2023-01-01';
```
#### 复杂查询插入
```sql
-- 聚合数据插入 
INSERT INTO monthly_sales (year, month, total_amount, order_count) SELECT YEAR(order_date) as year, MONTH(order_date) as month, SUM(total_amount) as total_amount, COUNT(*) as order_count FROM orders WHERE order_date >= '2024-01-01' GROUP BY YEAR(order_date), MONTH(order_date); 
-- 连接查询插入 
INSERT INTO user_order_summary (user_id, username, total_orders, total_spent) SELECT u.id, u.username, COUNT(o.id) as total_orders, COALESCE(SUM(o.total_amount), 0) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username;
```
#### 特殊数据类型插入
```sql
-- 日期和时间
-- 插入日期时间数据 
INSERT INTO events (name, event_date, event_time, created_at) VALUES 
('Meeting', '2024-03-15', '14:30:00', NOW()), 
('Conference', '2024-04-20', '09:00:00', CURRENT_TIMESTAMP), 
('Workshop', CURDATE(), CURTIME(), SYSDATE()); 
-- 使用函数插入 
INSERT INTO logs (message, log_level, created_at) VALUES 
('System started', 'INFO', NOW()), 
('User login', 'DEBUG', UTC_TIMESTAMP()), 
('Error occurred', 'ERROR', CURRENT_TIMESTAMP);
```
```sql 
-- JSON 数据
-- 插入 JSON 数据 
INSERT INTO user_profiles (user_id, profile_data) VALUES 
(1, '{"age": 25, "city": "Beijing", "interests": ["reading", "travel"]}'), 
(2, JSON_OBJECT('age', 30, 'city', 'Shanghai', 'married', true)), 
(3, JSON_ARRAY('hobby1', 'hobby2', 'hobby3')); 
-- 使用 JSON 函数 
INSERT INTO settings (user_id, config) VALUES 
(1, JSON_OBJECT( 'theme', 'dark', 'language', 'zh-CN', 'notifications', JSON_OBJECT('email', true, 'sms', false) )
);
```
```sql
-- 二进制数据
-- 插入二进制数据 
INSERT INTO files (filename, file_data, file_size) VALUES 
('document.pdf', LOAD_FILE('/path/to/document.pdf'), 1024000); 
-- 使用十六进制字符串 
INSERT INTO binary_data (data) VALUES (0x48656C6C6F), 
-- 'Hello' in hex (X'576F726C64'); 
-- 'World' in hex
```
#### 批量插入优化
```sql
--大批量插入技巧
-- 1. 使用多行 
VALUES INSERT INTO large_table (col1, col2, col3) VALUES 
(val1, val2, val3), 
(val4, val5, val6), 
-- ... 可以插入数千行 (val_n1, val_n2, val_n3); 
-- 2. 调整批次大小（建议每批1000-5000行） 
-- 分批插入而不是一次性插入所有数据 
-- 3. 禁用自动提交（事务批处理） 
START TRANSACTION; 
INSERT INTO table_name VALUES (...); 
INSERT INTO table_name VALUES (...); 
-- ... 多个插入语句 COMMIT;
LOAD DATA INFILE
-- 从 CSV 文件批量导入 
LOAD DATA INFILE '/path/to/data.csv' INTO TABLE users FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' IGNORE 1 ROWS 
-- 跳过标题行 (username, email, age); 
-- 本地文件导入 
LOAD DATA LOCAL INFILE '/local/path/data.csv' INTO TABLE products FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\r\n' (name, price, description); 
-- 处理数据转换 
LOAD DATA INFILE '/path/to/sales.csv' INTO TABLE sales FIELDS TERMINATED BY ',' (product_id, @sale_date, quantity, @price) SET sale_date = STR_TO_DATE(@sale_date, '%Y-%m-%d'), unit_price = @price, total_amount = quantity * @price;
```

### 插入性能优化
- 批量插入：使用多行 VALUES 而不是多个单行 INSERT
- 事务控制：将多个插入操作包装在事务中
- 禁用索引：大批量插入时临时禁用非必要索引
- 调整参数：增加 bulk_insert_buffer_size
- 使用 LOAD DATA：对于大文件，使用 LOAD DATA INFILE
```sql
-- 大批量插入优化示例 
-- 1. 禁用自动提交 
SET autocommit = 0; 
-- 2. 临时禁用唯一性检查（谨慎使用） 
SET unique_checks = 0; 
-- 3. 临时禁用外键检查（谨慎使用） 
SET foreign_key_checks = 0; 
-- 4. 执行批量插入 
INSERT INTO large_table (col1, col2, col3) VALUES -- 大量数据... ; 
-- 5. 提交事务 COMMIT; 
-- 6. 恢复设置 
SET unique_checks = 1; 
SET foreign_key_checks = 1; 
SET autocommit = 1;
```
### 常见错误和解决方案
#### 错误 1：重复键错误
```sql
-- 错误信息 
ERROR 1062 (23000): Duplicate entry 'value' for key 'PRIMARY' 
-- 解决方案1：
使用 INSERT IGNORE INSERT IGNORE INTO table_name (columns) VALUES (values); 
-- 解决方案2：
使用 ON DUPLICATE KEY UPDATE INSERT INTO table_name (columns) VALUES (values) ON DUPLICATE KEY UPDATE column = VALUES(column); 
-- 解决方案3：
使用 REPLACE REPLACE INTO table_name (columns) VALUES (values);
```
#### 错误 2：数据类型不匹配
```sql
-- 错误信息 
ERROR 1366 (HY000): Incorrect integer value 
-- 解决方案：确保数据类型匹配 
-- 错误示例 
INSERT INTO users (age) VALUES ('not_a_number'); 
-- 正确示例 
INSERT INTO users (age) VALUES (25); 
-- 或使用类型转换 
INSERT INTO users (age) VALUES (CAST('25' AS UNSIGNED));
```
#### 错误 3：列数不匹配
```sql
-- 错误信息 
ERROR 1136 (21S01): Column count doesn't match value count 
-- 解决方案：确保列数和值数匹配 
-- 错误示例 
INSERT INTO users (username, email) VALUES ('john'); 
-- 正确示例 
INSERT INTO users (username, email) VALUES ('john', 'john@example.com'); 
-- 或明确指定列 INSERT INTO users (username) VALUES ('john');
```
### 实际应用示例
#### 电商订单插入
```sql
-- 创建订单（事务处理） 
START TRANSACTION; 
-- 插入订单主表 
INSERT INTO orders (user_id, total_amount, status, created_at) VALUES (123, 299.98, 'pending', NOW()); 
-- 获取订单ID 
SET @order_id = LAST_INSERT_ID(); 
-- 插入订单明细 
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (@order_id, 1, 2, 99.99), (@order_id, 2, 1, 99.99); 
-- 更新库存 
UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 1; UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 2; COMMIT;
```
#### 日志记录插入
```sql
-- 应用日志插入 
INSERT INTO application_logs (level, message, user_id, ip_address, user_agent, created_at) VALUES 
('INFO', 'User login successful', 123, '192.168.1.100', 'Mozilla/5.0...', NOW()), 
('WARNING', 'Failed login attempt', NULL, '192.168.1.200', 'curl/7.68.0', NOW()), 
('ERROR', 'Database connection failed', NULL, '127.0.0.1', 'Internal', NOW()
); 
```
#### 性能监控数据插入
```sql
-- 性能监控数据插入 
INSERT INTO performance_metrics (metric_name, metric_value, timestamp) 
SELECT 'active_users' as metric_name, COUNT(*) as metric_value, NOW() as timestamp 
FROM users WHERE last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE);
```
### 插入数据最佳实践
- 数据验证：在插入前验证数据的有效性
- 事务使用：对于相关的多表插入使用事务
- 错误处理：处理重复键和约束违反错误
- 批量操作：大量数据使用批量插入提高性能
- 索引考虑：大批量插入时考虑临时禁用索引
- 备份策略：重要数据插入前做好备份
- 监控性能：监控插入操作的性能影响

## MySQL 查询数据

> SELECT 语句是 SQL 中最重要的语句之一，用于从数据库表中检索数据。MySQL 的 SELECT 语句功能强大，支持复杂的查询操作、数据聚合、连接查询等。

### 基本 SELECT 语法

#### 查询所有列
```sql
-- 查询表中所有列的所有数据 
SELECT * FROM users; 
-- 查询指定表的所有数据（带数据库名） 
SELECT * FROM mydb.users; 
```
#### 查询指定列
```sql
-- 查询特定列 
SELECT username, email FROM users; 
-- 查询多个列（指定顺序） 
SELECT id, username, age, email FROM users; 
-- 使用表别名 
SELECT u.username, u.email FROM users u; 
```
### 列别名和表达式
#### 使用列别名
```sql
-- 使用 AS 关键字定义别名 
SELECT username AS '用户名', email AS '邮箱地址', age AS '年龄' FROM users; 
-- 省略 AS 关键字 
SELECT username '用户名', email '邮箱地址', YEAR(created_at) '注册年份' FROM users; 
-- 使用反引号处理特殊字符 
SELECT username AS `User Name`, email AS `E-mail Address` FROM users;
```
#### 计算字段和表达式
```sql
-- 数学运算 
SELECT product_name, price, quantity, price * quantity AS total_value, price * 0.9 AS discounted_price FROM products; 
-- 字符串连接 
SELECT CONCAT(first_name, ' ', last_name) AS full_name, CONCAT(username, '@company.com') AS company_email FROM users; 
-- 条件表达式 
SELECT username, age, CASE WHEN age < 18 THEN '未成年' WHEN age BETWEEN 18 AND 65 THEN '成年人' ELSE '老年人' END AS age_group FROM users;
```
### 数据过滤和排序
#### DISTINCT 去重
```sql
-- 去除重复值 
SELECT DISTINCT city FROM users; 
-- 多列去重 
SELECT DISTINCT city, country FROM users; 
-- 计算唯一值数量 
SELECT COUNT(DISTINCT city) AS unique_cities FROM users; 
-- 去重后排序 
SELECT DISTINCT age FROM users ORDER BY age;
```
#### LIMIT 限制结果
```sql
-- 限制返回行数 
SELECT * FROM users LIMIT 5; 
-- 分页查询（跳过前10行，返回5行） 
SELECT * FROM users LIMIT 10, 5; 
-- 使用 OFFSET（MySQL 8.0+） 
SELECT * FROM users LIMIT 5 OFFSET 10; 
-- 获取最新的10条记录 
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```
#### ORDER BY 排序
```sql
-- 单列排序 
SELECT * FROM users ORDER BY age; 
SELECT * FROM users ORDER BY age DESC; 
-- 多列排序 
SELECT * FROM users ORDER BY city ASC, age DESC; 
-- 使用列位置排序 
SELECT username, email, age FROM users ORDER BY 3 DESC; -- 按第3列（age）降序 
-- 使用表达式排序 
SELECT * FROM products ORDER BY price * quantity DESC; 
-- NULL 值排序 
SELECT * FROM users ORDER BY last_login DESC NULLS LAST;
```
### 聚合函数
#### 基本聚合函数
```sql
-- 计数 
SELECT COUNT(*) AS total_users FROM users; 
SELECT COUNT(email) AS users_with_email FROM users; 
SELECT COUNT(DISTINCT city) AS unique_cities FROM users; 
-- 求和 
SELECT SUM(price) AS total_price FROM products; 
SELECT SUM(quantity * price) AS total_value FROM order_items; 
-- 平均值 
SELECT AVG(age) AS average_age FROM users; 
SELECT AVG(price) AS average_price FROM products; 
-- 最大值和最小值 
SELECT MAX(age) AS oldest, MIN(age) AS youngest FROM users; 
SELECT MAX(created_at) AS latest_order FROM orders;
```
#### GROUP BY 分组
```sql
-- 按单列分组 
SELECT city, COUNT(*) AS user_count FROM users GROUP BY city; 
-- 按多列分组 
SELECT city, country, COUNT(*) AS user_count FROM users GROUP BY city, country; 
-- 分组后排序 
SELECT city, COUNT(*) AS user_count FROM users GROUP BY city ORDER BY user_count DESC; 
-- 复杂分组查询 
SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, COUNT(*) AS order_count, SUM(total_amount) AS total_sales 
FROM orders GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY year DESC, month DESC;
```
#### HAVING 子句
```sql
-- HAVING 过滤分组结果 
SELECT city, COUNT(*) AS user_count 
FROM users 
GROUP BY city 
HAVING COUNT(*) > 5; 
-- 复杂 HAVING 条件 
SELECT category_id, COUNT(*) AS product_count, AVG(price) AS avg_price 
FROM products 
GROUP BY category_id 
HAVING COUNT(*) > 3 AND AVG(price) > 100; 
-- HAVING 与 WHERE 结合 
SELECT user_id, COUNT(*) AS order_count, SUM(total_amount) AS total_spent 
FROM orders 
WHERE status = 'completed' 
GROUP BY user_id 
HAVING COUNT(*) >= 5 AND SUM(total_amount) > 1000;
```
### 子查询
#### 标量子查询
```sql
-- 返回单个值的子查询 
SELECT username, age 
FROM users 
WHERE age > (SELECT AVG(age) FROM users); 
-- 在 SELECT 列表中使用子查询 
SELECT username, age, (SELECT AVG(age) FROM users) AS avg_age, age - (SELECT AVG(age) FROM users) AS age_diff 
FROM users; 
-- 相关子查询 
SELECT p.product_name, p.price, (SELECT AVG(price) FROM products p2 WHERE p2.category_id = p.category_id) AS category_avg_price 
FROM products p;
```
#### EXISTS 子查询
```sql
-- 检查是否存在 
SELECT username FROM users u WHERE EXISTS ( SELECT 1 FROM orders o WHERE o.user_id = u.id ); 
-- NOT EXISTS 
SELECT username FROM users u WHERE NOT EXISTS ( SELECT 1 FROM orders o WHERE o.user_id = u.id ); 
-- 复杂 EXISTS 查询 
SELECT product_name FROM products p WHERE EXISTS ( SELECT 1 FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.created_at >= '2024-01-01' );
```
#### IN 子查询
```sql
-- IN 子查询 
SELECT username FROM users WHERE id IN ( SELECT DISTINCT user_id FROM orders WHERE total_amount > 1000 ); 
-- NOT IN 子查询 
SELECT product_name FROM products WHERE id NOT IN ( SELECT DISTINCT product_id FROM order_items WHERE product_id IS NOT NULL ); 
-- 多列 IN 子查询 
SELECT * FROM users WHERE (city, country) IN ( SELECT city, country FROM popular_locations );
```
### 连接查询基础
#### 内连接 (INNER JOIN)
```sql
-- 基本内连接 
SELECT u.username, u.email, o.id AS order_id, o.total_amount 
FROM users u INNER JOIN orders o ON u.id = o.user_id; 
-- 多表连接 
SELECT u.username, o.id AS order_id, p.product_name, oi.quantity, oi.unit_price 
FROM users u INNER JOIN orders o ON u.id = o.user_id INNER JOIN order_items oi ON o.id = oi.order_id INNER JOIN products p ON oi.product_id = p.id;
```
#### 外连接 (LEFT/RIGHT JOIN)
```sql
-- 左外连接（显示所有用户，包括没有订单的） 
SELECT u.username, u.email, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username, u.email; 
-- 右外连接 
SELECT u.username, o.id AS order_id, o.total_amount FROM users u RIGHT JOIN orders o ON u.id = o.user_id; 
-- 查找没有订单的用户 
SELECT u.username FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.id IS NULL;
```
### 窗口函数 (MySQL 8.0+)
#### 排名函数
```sql
-- ROW_NUMBER() 行号 
SELECT username, age, ROW_NUMBER() OVER (ORDER BY age DESC) AS row_num FROM users; 
-- RANK() 排名（相同值相同排名，后续排名跳跃） 
SELECT product_name, price, RANK() OVER (ORDER BY price DESC) AS price_rank FROM products; 
-- DENSE_RANK() 密集排名（相同值相同排名，后续排名连续） 
SELECT username, score, DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rank FROM user_scores;
```
#### 聚合窗口函数
```sql
-- 简单聚合函数 
SELECT order_date, daily_sales, SUM(daily_sales) OVER (ORDER BY order_date) AS running_total FROM daily_sales_summary; 
-- 分组聚合 
SELECT category_name, product_name, price, AVG(price) OVER (PARTITION BY category_id) AS category_avg_price FROM products p JOIN categories c ON p.category_id = c.id;
```
```sql
-- 累计求和 
SELECT order_date, daily_sales, SUM(daily_sales) OVER (ORDER BY order_date) AS cumulative_sales FROM daily_sales_summary; 
-- 移动平均 
SELECT order_date, daily_sales, AVG(daily_sales) OVER ( ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW ) AS moving_avg_7_days FROM daily_sales_summary; 
-- 分组内排名 
SELECT category_name, product_name, price, RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS category_price_rank FROM products p JOIN categories c ON p.category_id = c.id;
```
### 常用函数
#### 字符串函数
```sql
-- 字符串操作 
SELECT username, UPPER(username) AS upper_name, LOWER(email) AS lower_email, LENGTH(username) AS name_length, SUBSTRING(email, 1, LOCATE('@', email) - 1) AS email_prefix, CONCAT(first_name, ' ', last_name) AS full_name FROM users; 
-- 字符串查找和替换 
SELECT product_name, REPLACE(product_name, 'iPhone', 'Apple iPhone') AS updated_name, LEFT(product_name, 10) AS short_name, RIGHT(product_name, 5) AS suffix FROM products;
```
#### 日期时间函数
```sql
-- 日期时间操作 
SELECT username, created_at, DATE(created_at) AS created_date, YEAR(created_at) AS created_year, MONTH(created_at) AS created_month, DAYOFWEEK(created_at) AS day_of_week, DATEDIFF(NOW(), created_at) AS days_since_created FROM users; 
-- 日期计算 
SELECT order_id, order_date, DATE_ADD(order_date, INTERVAL 7 DAY) AS delivery_date, DATE_SUB(order_date, INTERVAL 1 MONTH) AS one_month_ago FROM orders;
```
#### 数学函数
```sql
-- 数学运算 
SELECT product_name, price, ROUND(price, 2) AS rounded_price, CEIL(price) AS ceiling_price, FLOOR(price) AS floor_price, ABS(price - 100) AS price_diff_from_100, POWER(price, 2) AS price_squared FROM products; 
-- 随机和统计 
SELECT RAND() AS random_number, ROUND(RAND() * 100) AS random_percentage;
```
### 查询性能优化
- 使用索引：在 WHERE、ORDER BY、JOIN 条件中使用索引列
- 避免 SELECT *：只查询需要的列
- 合理使用 LIMIT：限制返回的行数
- 优化 JOIN：确保连接条件使用索引
- 避免函数：在 WHERE 条件中避免对列使用函数
```sql
-- 性能优化示例 
-- 不好的查询（全表扫描） 
SELECT * FROM users WHERE YEAR(created_at) = 2024; 
-- 优化后的查询（使用索引） 
SELECT id, username, email FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'; 
-- 使用 EXPLAIN 分析查询 
EXPLAIN SELECT u.username, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username;
```
### 实际应用示例
#### 电商数据分析
```sql
-- 销售报表查询 
SELECT DATE(o.created_at) AS sale_date, COUNT(DISTINCT o.id) AS order_count, COUNT(DISTINCT o.user_id) AS customer_count, SUM(o.total_amount) AS daily_revenue, AVG(o.total_amount) AS avg_order_value 
FROM orders o 
WHERE o.status = 'completed' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
GROUP BY DATE(o.created_at) 
ORDER BY sale_date DESC; 
-- 热销产品分析 
SELECT p.product_name, c.category_name, SUM(oi.quantity) AS total_sold, SUM(oi.quantity * oi.unit_price) AS total_revenue, COUNT(DISTINCT oi.order_id) AS order_count 
FROM products p JOIN categories c ON p.category_id = c.id JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id 
WHERE o.status = 'completed' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) 
GROUP BY p.id, p.product_name, c.category_name 
ORDER BY total_sold DESC LIMIT 20;
```
#### 用户行为分析
```sql
-- 用户活跃度分析 
SELECT u.username, u.created_at AS registration_date, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_spent, MAX(o.created_at) AS last_order_date, DATEDIFF(NOW(), MAX(o.created_at)) AS days_since_last_order, 
CASE 
WHEN MAX(o.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'Active' 
WHEN MAX(o.created_at) >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'Inactive' 
ELSE 'Churned' 
END AS user_status 
FROM users u LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed' 
GROUP BY u.id, u.username, u.created_at 
ORDER BY total_spent DESC;
```
### 查询最佳实践
- 明确需求：只查询必要的列和行
- 使用索引：确保查询条件能够使用索引
- 避免 N+1：使用 JOIN 而不是循环查询
- 分页处理：大结果集使用 LIMIT 分页
- 监控性能：使用 EXPLAIN 分析查询计划
- 缓存结果：对于复杂查询考虑结果缓存
- 定期优化：根据数据增长调整查询策略

## MySQL WHERE 子句
> WHERE 子句用于过滤记录，只返回满足指定条件的记录。它是 SQL 查询中最重要的部分之一，可以与 SELECT、UPDATE、DELETE 等语句配合使用。

### 基本比较操作符
#### 等于和不等于
```sql
-- 等于 
SELECT * FROM users WHERE age = 25; 
SELECT * FROM users WHERE city = 'Beijing'; 
SELECT * FROM users WHERE status = 'active'; 
-- 不等于 
SELECT * FROM users WHERE age != 25; 
SELECT * FROM users WHERE age <> 25; 
-- 标准 SQL 语法 
SELECT * FROM users WHERE city != 'Beijing'; 
-- 字符串比较（区分大小写） 
SELECT * FROM users WHERE username = 'John'; -- 不会匹配 'john' 
SELECT * FROM users WHERE LOWER(username) = 'john'; -- 不区分大小写
```
#### 大小比较
```sql
-- 大于和小于 
SELECT * FROM users WHERE age > 18; 
SELECT * FROM users WHERE age < 65; 
SELECT * FROM users WHERE salary >= 50000; 
SELECT * FROM users WHERE created_at <= '2024-01-01'; 
-- 日期比较 
SELECT * FROM orders WHERE order_date > '2024-01-01'; 
SELECT * FROM orders WHERE created_at >= '2024-01-01 00:00:00'; 
SELECT * FROM orders WHERE created_at < NOW(); 
-- 数值范围查询 
SELECT * FROM products WHERE price > 100 AND price < 500;
```
### 范围和列表操作符
#### BETWEEN 范围查询
```sql
-- 数值范围 
SELECT * FROM users WHERE age BETWEEN 18 AND 65; 
SELECT * FROM products WHERE price BETWEEN 100 AND 500; 
-- 日期范围 
SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31'; 
SELECT * FROM logs WHERE created_at BETWEEN '2024-01-01 00:00:00' AND '2024-01-31 23:59:59'; 
-- NOT BETWEEN 
SELECT * FROM users WHERE age NOT BETWEEN 18 AND 65; 
-- 字符串范围（按字典序） 
SELECT * FROM users WHERE username BETWEEN 'A' AND 'M';
```
#### IN 列表查询
```sql
-- 基本 IN 查询 
SELECT * FROM users WHERE city IN ('Beijing', 'Shanghai', 'Guangzhou'); 
SELECT * FROM products WHERE category_id IN (1, 2, 3, 5); 
SELECT * FROM orders WHERE status IN ('pending', 'processing', 'shipped'); 
-- NOT IN 
SELECT * FROM users WHERE city NOT IN ('Beijing', 'Shanghai'); 
SELECT * FROM products WHERE id NOT IN (1, 2, 3); 
-- IN 子查询 
SELECT * FROM users WHERE id IN ( SELECT user_id FROM orders WHERE total_amount > 1000 ); 
-- 多列 IN（MySQL 5.7+） 
SELECT * FROM users WHERE (city, country) IN (('Beijing', 'China'), ('Tokyo', 'Japan'));
```
### 模式匹配
#### LIKE 模糊查询
```sql
-- 基本 LIKE 查询 
SELECT * FROM users WHERE username LIKE 'john%'; -- 以 'john' 开头 
SELECT * FROM users WHERE username LIKE '%smith'; -- 以 'smith' 结尾 
SELECT * FROM users WHERE username LIKE '%admin%'; -- 包含 'admin' 
SELECT * FROM users WHERE username LIKE 'user_'; -- 'user' + 单个字符 

-- 通配符说明 
-- % : 匹配零个或多个字符 
-- _ : 匹配单个字符 
-- 复杂模式 
SELECT * FROM products WHERE product_name LIKE 'iPhone%'; 
SELECT * FROM users WHERE email LIKE '%@gmail.com'; 
SELECT * FROM users WHERE phone LIKE '138________'; -- 138开头的11位手机号 
-- NOT LIKE 
SELECT * FROM users WHERE email NOT LIKE '%@temp%'; 
-- 转义特殊字符 
SELECT * FROM products WHERE description LIKE '%50\% off%'; -- 查找包含 "50% off" 的记录 
SELECT * FROM files WHERE filename LIKE '%\_backup%'; -- 查找包含 "_backup" 的文件名
```
#### 正则表达式 REGEXP
```sql
-- 基本正则表达式 
SELECT * FROM users WHERE username REGEXP '^[a-zA-Z]+$'; -- 只包含字母 
SELECT * FROM users WHERE email REGEXP '^[^@]+@[^@]+\.[^@]+$'; -- 基本邮箱格式 
SELECT * FROM products WHERE product_code REGEXP '^[A-Z]{2}[0-9]{4}$'; -- 2个字母+4个数字 
-- 常用正则模式 
SELECT * FROM users WHERE phone REGEXP '^1[3-9][0-9]{9}$'; -- 中国手机号 
SELECT * FROM users WHERE username REGEXP '^[a-z0-9_]{3,20}$'; -- 用户名格式 
SELECT * FROM products WHERE price REGEXP '^[0-9]+\.[0-9]{2}$'; -- 价格格式 
-- NOT REGEXP 
SELECT * FROM users WHERE username NOT REGEXP '[0-9]'; -- 不包含数字的用户名 
-- 大小写不敏感匹配 
SELECT * FROM users WHERE username REGEXP BINARY '^Admin'; -- 区分大小写 
SELECT * FROM users WHERE username REGEXP '^admin'; -- 不区分大小写（默认）
```
### NULL 值处理
#### IS NULL 和 IS NOT NULL
```sql
-- 查找 NULL 值 
SELECT * FROM users WHERE last_login IS NULL; 
SELECT * FROM products WHERE description IS NULL; 
SELECT * FROM orders WHERE delivery_date IS NULL; 
-- 查找非 NULL 值 
SELECT * FROM users WHERE last_login IS NOT NULL; 
SELECT * FROM products WHERE description IS NOT NULL; 
-- 注意：不能使用 = NULL 或 != NULL 
-- 错误写法 
SELECT * FROM users WHERE last_login = NULL; -- 永远返回空结果 
SELECT * FROM users WHERE last_login != NULL; -- 永远返回空结果 
-- 正确写法 
SELECT * FROM users WHERE last_login IS NULL; 
SELECT * FROM users WHERE last_login IS NOT NULL;
```
#### NULL 值的特殊处理
```sql
-- 使用 COALESCE 处理 
NULL SELECT username, COALESCE(last_login, '从未登录') AS last_login_display FROM users; 
-- 使用 IFNULL 处理 
NULL SELECT product_name, IFNULL(description, '暂无描述') AS description_display FROM products; 
-- 使用 CASE 处理 NULL 
SELECT username, CASE WHEN last_login IS NULL THEN '从未登录' ELSE DATE_FORMAT(last_login, '%Y-%m-%d') END AS login_status FROM users; 
-- NULL 值在比较中的行为 
SELECT * FROM users WHERE age > 25 OR age IS NULL; -- 包含 NULL 值 
SELECT * FROM users WHERE NOT (age <= 25); -- 不包含 NULL 值
```

### 逻辑操作符
#### AND 逻辑与
```sql
-- 基本 AND 操作 
SELECT * FROM users WHERE age >= 18 AND age <= 65; 
SELECT * FROM users WHERE city = 'Beijing' AND status = 'active'; 
SELECT * FROM products WHERE price > 100 AND category_id = 1 AND stock_quantity > 0; 
-- 多条件组合 
SELECT * FROM orders WHERE status = 'completed' AND total_amount > 500 AND created_at >= '2024-01-01' AND user_id IS NOT NULL; 
-- 复杂条件 
SELECT * FROM users WHERE (age BETWEEN 25 AND 35) AND (city IN ('Beijing', 'Shanghai')) AND (salary > 80000);
```
#### OR 逻辑或
```sql
-- 基本 OR 操作 
SELECT * FROM users WHERE city = 'Beijing' OR city = 'Shanghai'; 
SELECT * FROM products WHERE category_id = 1 OR category_id = 2; 
SELECT * FROM orders WHERE status = 'pending' OR status = 'processing'; 
-- OR 与 AND 的组合（注意优先级） 
SELECT * FROM users WHERE (city = 'Beijing' OR city = 'Shanghai') AND age > 25; 
-- 复杂 OR 条件 
SELECT * FROM users WHERE (age < 18 OR age > 65) OR (status = 'inactive') OR (last_login < DATE_SUB(NOW(), INTERVAL 1 YEAR));
```
#### NOT 逻辑非
```sql
-- 基本 NOT 操作 
SELECT * FROM users WHERE NOT (age < 18); 
SELECT * FROM users WHERE NOT (city = 'Beijing'); 
-- NOT 与其他操作符结合 
SELECT * FROM users WHERE NOT (age BETWEEN 18 AND 65); 
SELECT * FROM users WHERE NOT (city IN ('Beijing', 'Shanghai')); 
SELECT * FROM users WHERE NOT (username LIKE 'admin%'); 
-- 复杂 NOT 条件 
SELECT * FROM users WHERE NOT ( (city = 'Beijing' AND age < 30) OR (city = 'Shanghai' AND salary < 50000) ); 
-- De Morgan's Law 应用 
-- NOT (A AND B) = (NOT A) OR (NOT B) 
-- NOT (A OR B) = (NOT A) AND (NOT B) 
SELECT * FROM users WHERE NOT (age < 18 AND status = 'inactive'); 
-- 等价于 
SELECT * FROM users WHERE age >= 18 OR status != 'inactive';
```
### 操作符优先级（从高到低）
- 括号 ()
- 比较操作符：=, !=, <>, <, <=, >, >=
- IS NULL, IS NOT NULL
- BETWEEN, IN, LIKE, REGEXP
- NOT
- AND
- OR
```sql
-- 优先级示例 
-- 没有括号的情况 
SELECT * FROM users WHERE city = 'Beijing' OR city = 'Shanghai' AND age > 25; 
-- 等价于 
SELECT * FROM users WHERE city = 'Beijing' OR (city = 'Shanghai' AND age > 25); 
-- 使用括号明确优先级 
SELECT * FROM users WHERE (city = 'Beijing' OR city = 'Shanghai') AND age > 25; 
-- 复杂条件的括号使用 
SELECT * FROM orders WHERE (status = 'completed' OR status = 'shipped') AND (total_amount > 1000 OR (total_amount > 500 AND user_id IN (1,2,3))) AND created_at >= '2024-01-01';
```
### 子查询在 WHERE 中的应用
#### 标量子查询
```sql
-- 与平均值比较 
SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products); 
-- 与最大值比较 
SELECT * FROM users WHERE created_at = (SELECT MAX(created_at) FROM users); 
-- 相关子查询 
SELECT * FROM products p1 WHERE price > ( SELECT AVG(price) FROM products p2 WHERE p2.category_id = p1.category_id );
```
#### EXISTS 子查询
```sql
-- 存在性检查 
SELECT * FROM users u WHERE EXISTS ( SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'completed' ); 
-- 不存在检查 
SELECT * FROM products p WHERE NOT EXISTS ( SELECT 1 FROM order_items oi WHERE oi.product_id = p.id ); 
-- 复杂 EXISTS 查询 
SELECT * FROM users u WHERE EXISTS ( SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND o.total_amount > 500 );
```
### WHERE 子句性能优化

- 使用索引：确保 WHERE 条件中的列有适当的索引
- 避免函数：不要在 WHERE 条件的列上使用函数
- 选择性高的条件优先：将过滤效果好的条件放在前面
- 避免 OR：考虑使用 UNION 替代复杂的 OR 条件
- 合理使用 LIMIT：限制返回的行数
```sql
-- 性能优化示例 
-- 不好的查询（在列上使用函数） 
SELECT * FROM orders WHERE YEAR(created_at) = 2024; 
-- 优化后的查询（使用范围条件） 
SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'; 
-- 不好的查询（复杂的 OR 条件） 
SELECT * FROM users WHERE city = 'Beijing' OR city = 'Shanghai' OR city = 'Guangzhou'; 
-- 优化后的查询（使用 IN） 
SELECT * FROM users WHERE city IN ('Beijing', 'Shanghai', 'Guangzhou'); 
-- 使用复合索引的查询 
SELECT * FROM orders WHERE user_id = 123 AND status = 'completed' AND created_at >= '2024-01-01'; -- 需要在 (user_id, status, created_at) 上创建复合索引
```
### 实际应用示例
#### 电商业务查询
```sql
-- 查找活跃用户 
SELECT * 
FROM users 
WHERE status = 'active' AND last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND email IS NOT NULL AND email NOT LIKE '%@temp%'; 
-- 查找热销产品 
SELECT p.* 
FROM products p 
WHERE p.status = 'active' AND p.stock_quantity > 0 AND EXISTS ( SELECT 1 FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND o.status = 'completed' GROUP BY oi.product_id HAVING SUM(oi.quantity) > 100 ); 
-- 查找异常订单 
SELECT * FROM orders WHERE ( (total_amount > 10000 AND user_id NOT IN (SELECT id FROM vip_users)) OR (total_amount < 1 AND status = 'completed') OR (created_at != updated_at AND status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)) );
```
#### 数据清理查询
```sql
-- 查找重复数据 
SELECT email, COUNT(*) as count FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1; 
-- 查找无效数据 
SELECT * FROM users WHERE email NOT REGEXP '^[^@]+@[^@]+\.[^@]+$' OR phone NOT REGEXP '^1[3-9][0-9]{9}$' OR age < 0 OR age > 150 OR username IS NULL OR username = ''; 
-- 查找孤立数据 
SELECT * FROM order_items oi WHERE NOT EXISTS ( SELECT 1 FROM orders o WHERE o.id = oi.order_id ) OR NOT EXISTS ( SELECT 1 FROM products p WHERE p.id = oi.product_id );
```
### WHERE 子句最佳实践
- 索引优化：为常用的 WHERE 条件列创建索引
- 条件顺序：将选择性高的条件放在前面
- 避免函数：不要在 WHERE 条件的列上使用函数
- NULL 处理：正确处理 NULL 值的比较
- 类型匹配：确保比较的数据类型一致
- 使用括号：复杂条件使用括号明确优先级
- 测试验证：复杂条件要充分测试各种情况

## MySQL 更新数据
> UPDATE 语句用于修改表中现有的记录。MySQL 提供了灵活的更新语法，支持单表更新、多表更新、条件更新等多种操作方式。

### 基本 UPDATE 语法
```sql
-- 基本语法 
UPDATE table_name SET column1 = value1, column2 = value2, ... WHERE condition; 
-- 更新单个字段 
UPDATE users SET age = 26 WHERE id = 1; 
-- 更新多个字段 
UPDATE users SET age = 26, city = 'Shanghai', updated_at = NOW() WHERE id = 1;
```
#### 条件更新
```sql
-- 基于条件的批量更新 
UPDATE products SET price = price * 0.9 WHERE category_id = 1 AND stock_quantity > 0; 
-- 使用子查询更新 
UPDATE users SET status = 'vip' WHERE id IN ( SELECT user_id FROM orders GROUP BY user_id HAVING SUM(total_amount) > 10000 );
```
#### 多表更新
```sql
-- 多表 UPDATE 
UPDATE users u JOIN orders o ON u.id = o.user_id SET u.last_order_date = o.created_at WHERE o.created_at = ( SELECT MAX(created_at) FROM orders o2 WHERE o2.user_id = u.id );
```
### 最佳实践
- 安全性：确保操作的安全性和数据完整性
- 性能：考虑操作对数据库性能的影响
- 备份：重要操作前做好数据备份
- 测试：在生产环境前充分测试
- 监控：监控操作的执行情况
## MySQL 删除数据
> DELETE 语句用于从表中删除现有记录。MySQL 支持单表删除、多表删除、条件删除等操作，同时提供了安全机制防止误删除。


### 基本 DELETE 语法
```sql
-- 基本语法 
DELETE FROM table_name WHERE condition; 
-- 删除特定记录 
DELETE FROM users WHERE id = 1; 
-- 条件删除 
DELETE FROM users WHERE status = 'inactive' AND last_login < '2023-01-01';
```
#### 批量删除
```sql
-- 删除多条记录 
DELETE FROM orders WHERE status = 'cancelled'; 
-- 使用子查询删除 
DELETE FROM products WHERE id NOT IN ( SELECT DISTINCT product_id FROM order_items WHERE product_id IS NOT NULL );
```
#### 安全删除
```sql
-- 使用 LIMIT 限制删除数量 
DELETE FROM logs WHERE created_at < '2023-01-01' LIMIT 1000; 
-- 删除前备份 
CREATE TABLE users_backup AS SELECT * FROM users WHERE status = 'inactive'; DELETE FROM users WHERE status = 'inactive';
```
### 最佳实践
- 安全性：确保操作的安全性和数据完整性
- 性能：考虑操作对数据库性能的影响
- 备份：重要操作前做好数据备份
- 测试：在生产环境前充分测试
- 监控：监控操作的执行情况

## MySQL LIKE 子句
> LIKE 子句用于在 WHERE 子句中搜索列中的指定模式。它使用通配符进行模糊匹配，是文本搜索的重要工具。

### LIKE 基本语法
```sql
-- 基本语法 
SELECT * FROM table_name WHERE column LIKE pattern; 
-- 通配符说明 
-- % : 匹配零个或多个字符 
-- _ : 匹配单个字符 
-- 基本示例 
SELECT * FROM users WHERE username LIKE 'john%'; -- 以john开头 
SELECT * FROM users WHERE username LIKE '%smith'; -- 以smith结尾 
SELECT * FROM users WHERE username LIKE '%admin%'; -- 包含admin 
SELECT * FROM users WHERE username LIKE 'user_'; -- user加单个字符
```
#### 复杂模式匹配
```sql
-- 邮箱匹配 
SELECT * FROM users WHERE email LIKE '%@gmail.com'; SELECT * FROM users WHERE email LIKE '%@%.com'; 
-- 手机号匹配 
SELECT * FROM users WHERE phone LIKE '138%'; SELECT * FROM users WHERE phone LIKE '1__________'; -- 11位手机号 
-- 产品代码匹配 
SELECT * FROM products WHERE product_code LIKE 'A_____'; -- A开头的6位代码
```
#### 转义字符
```sql
-- 转义特殊字符 
SELECT * FROM products WHERE description LIKE '%50\\% off%'; -- 包含"50% off" 
SELECT * FROM files WHERE filename LIKE '%\_backup%'; -- 包含"_backup" 
-- 自定义转义字符 
SELECT * FROM products WHERE description LIKE '%50#% off%' ESCAPE '#';
```
### 最佳实践
- 安全性：确保操作的安全性和数据完整性
- 性能：考虑操作对数据库性能的影响
- 备份：重要操作前做好数据备份
- 测试：在生产环境前充分测试
- 监控：监控操作的执行情况

## MySQL UNION 操作符
### UNION 操作符简介
> MySQL UNION 操作符用于合并两个或多个 SELECT 语句的结果集。UNION 操作符会自动去除重复的行，而 UNION ALL 则保留所有行包括重复的。

#### UNION 的特点
- 合并多个查询结果
- 自动去除重复行
- 要求列数和数据类型匹配
- 按第一个查询的列名返回结果

### 基本语法
#### UNION 语法
```sql
SELECT column1, column2, ... FROM table1 UNION SELECT column1, column2, ... FROM table2;
```
#### UNION ALL 语法
```sql
SELECT column1, column2, ... FROM table1 UNION ALL SELECT column1, column2, ... FROM table2;
```
#### 注意事项：
- 每个 SELECT 语句必须有相同数量的列
- 对应列的数据类型必须兼容
- 列名以第一个 SELECT 语句为准

### 实际示例
#### 示例数据准备
```sql
-- 创建示例表 
CREATE TABLE customers ( 
    id INT PRIMARY KEY, 
    name VARCHAR(50), 
    city VARCHAR(50) 
); 
CREATE TABLE suppliers ( 
    id INT PRIMARY KEY, 
    name VARCHAR(50), 
    city VARCHAR(50) 
); 
-- 插入测试数据 
INSERT INTO customers VALUES 
(1, '张三', '北京'),
(2, '李四', '上海'), 
(3, '王五', '广州'); 
INSERT INTO suppliers VALUES 
(1, '供应商A', '北京'), 
(2, '供应商B', '深圳'), 
(3, '张三', '北京');
```

#### 基本 UNION 查询
```sql
-- 合并客户和供应商的城市列表（去重） 
SELECT city FROM customers UNION SELECT city FROM suppliers;
```
#### UNION ALL 查询
```sql
-- 合并客户和供应商的城市列表（保留重复） 
SELECT city FROM customers UNION ALL SELECT city FROM suppliers;
```

### 高级用法
#### 带条件的 UNION
```sql
-- 合并特定条件的结果 
SELECT name, city, 'Customer' as type 
FROM customers 
WHERE city = '北京' 
UNION 
SELECT name, city, 'Supplier' as type 
FROM suppliers 
WHERE city = '北京';
```
#### UNION 与 ORDER BY
```sql
-- 对合并结果排序 
(SELECT name, city FROM customers)
UNION 
(SELECT name, city FROM suppliers) 
ORDER BY city, name;
```
#### UNION 与 LIMIT
```sql
-- 限制合并结果数量 
(SELECT name, city FROM customers LIMIT 2) 
UNION 
(SELECT name, city FROM suppliers LIMIT 2) 
LIMIT 3;
```
#### 多个表的 UNION
```sql
-- 合并三个或更多查询结果 
SELECT name FROM customers 
UNION 
SELECT name FROM suppliers 
UNION 
SELECT name FROM employees;
```
### UNION vs UNION ALL
| 特性 | UNION | UNION ALL |
| --- | --- | --- |
| 重复行处理 | 自动去除重复行 | 保留所有行 |
| 性能 | 较慢（需要去重） | 较快（无需去重） |
| 使用场景 | 需要唯一结果 | 需要所有数据 |

### 实际应用场景
#### 1. 数据整合
```sql
-- 整合不同来源的用户数据 
SELECT user_id, username, 'web' as source FROM web_users 
UNION ALL 
SELECT user_id, username, 'mobile' as source FROM mobile_users;
```
#### 2. 报表生成
```sql
-- 生成销售汇总报表 
SELECT '本月销售' as period, SUM(amount) as total FROM sales WHERE MONTH(sale_date) = MONTH(NOW()) 
UNION ALL 
SELECT '上月销售' as period, SUM(amount) as total FROM sales WHERE MONTH(sale_date) = MONTH(NOW()) - 1 
UNION ALL 
SELECT '本年销售' as period, SUM(amount) as total FROM sales WHERE YEAR(sale_date) = YEAR(NOW());
```
#### 3. 数据迁移
```sql
-- 合并历史数据和当前数据 
SELECT order_id, customer_id, order_date FROM current_orders 
UNION ALL 
SELECT order_id, customer_id, order_date FROM archived_orders;
```
### 性能优化建议
- 优先使用 UNION ALL（如果不需要去重）
- 在子查询中使用适当的索引
- 避免在大表上进行复杂的 UNION 操作
- 考虑使用临时表存储中间结果
- 合理使用 LIMIT 限制结果集大小

注意事项：

- UNION 操作可能消耗大量内存
- 过多的 UNION 会影响查询性能
- 确保数据类型兼容性
- 注意 NULL 值的处理
### 常见错误和解决方案
#### 1. 列数不匹配
```sql
-- 错误示例 
SELECT name, city FROM customers 
UNION 
SELECT name FROM suppliers; -- 错误：列数不匹配 
-- 正确示例 
SELECT name, city FROM customers 
UNION 
SELECT name, city FROM suppliers;
```
#### 2. 数据类型不兼容
```sql
-- 错误示例 
SELECT id, name FROM customers 
UNION 
SELECT name, id FROM suppliers; -- 错误：数据类型不匹配 
-- 正确示例 
SELECT id, name FROM customers 
UNION 
SELECT id, name FROM suppliers;
```
#### 3. ORDER BY 使用错误
```sql
-- 错误示例 
SELECT name FROM customers ORDER BY name 
UNION 
SELECT name FROM suppliers; -- 错误：ORDER BY 位置错误 
-- 正确示例 
(SELECT name FROM customers) 
UNION 
(SELECT name FROM suppliers) 
ORDER BY name;
```
## MySQL 排序
### ORDER BY 简介
> ORDER BY 子句用于对查询结果进行排序。可以按一个或多个列进行升序（ASC）或降序（DESC）排序。如果不指定排序方向，默认为升序。

#### ORDER BY 的特点
- 对查询结果进行排序
- 支持单列或多列排序
- 支持升序（ASC）和降序（DESC）
- 可以使用列名、列别名或列位置
- NULL 值的排序规则

### 基本语法
#### 单列排序
```sql
-- 升序排序（默认） 
SELECT * FROM table_name ORDER BY column_name; 
-- 显式指定升序 
SELECT * FROM table_name ORDER BY column_name ASC; 
-- 降序排序 
SELECT * FROM table_name ORDER BY column_name DESC;
```
#### 多列排序
```sql
-- 多列排序 
SELECT * 
FROM table_name 
ORDER BY column1 ASC, 
column2 DESC, column3;
```
#### 使用列位置排序
```sql
-- 按第2列和第3列排序 
SELECT name, age, salary 
FROM employees 
ORDER BY 2, 3 DESC;
```
### 实际示例
#### 示例数据准备
```sql
-- 创建员工表 
CREATE TABLE employees ( 
    id INT PRIMARY KEY, 
    name VARCHAR(50), 
    department VARCHAR(50), 
    salary DECIMAL(10,2), 
    hire_date DATE, age INT 
); 
-- 插入测试数据 
INSERT INTO employees VALUES 
(1, '张三', '技术部', 8000.00, '2020-01-15', 28), 
(2, '李四', '销售部', 6000.00, '2019-03-20', 32), 
(3, '王五', '技术部', 9500.00, '2021-06-10', 26), 
(4, '赵六', '人事部', 5500.00, '2018-11-05', 35), 
(5, '钱七', '技术部', 7500.00, '2020-08-12', 29), 
(6, '孙八', '销售部', 6500.00, '2019-12-01', 31);
```
#### 基本排序示例
##### 按薪资升序排序
```sql
SELECT name, department, salary FROM employees ORDER BY salary;
``` 
##### 按薪资降序排序
```sql
SELECT name, department, salary FROM employees ORDER BY salary DESC;
```
##### 按部门和薪资排序
```sql
SELECT name, department, salary FROM employees ORDER BY department ASC, salary DESC;
```
### 高级排序技巧
#### 使用表达式排序
```sql
-- 按年薪排序 
SELECT name, salary, salary * 12 as annual_salary 
FROM employees 
ORDER BY salary * 12 DESC; 
-- 按姓名长度排序 
SELECT name, LENGTH(name) as name_length 
FROM employees 
ORDER BY LENGTH(name), name;
```
#### 使用 CASE 语句排序
```sql
-- 自定义部门排序优先级 
SELECT name, department, salary 
FROM employees 
ORDER BY 
CASE department 
WHEN '技术部' THEN 1 
WHEN '销售部' THEN 2 
WHEN '人事部' THEN 3 
ELSE 4 END, 
salary DESC;
```
#### 日期排序
```sql
-- 按入职日期排序 
SELECT name, hire_date, DATEDIFF(NOW(), hire_date) as days_employed 
FROM employees 
ORDER BY hire_date DESC; 
-- 按入职年份和月份排序 
SELECT name, hire_date 
FROM employees 
ORDER BY YEAR(hire_date) DESC, MONTH(hire_date) DESC;
```
#### NULL 值排序
```sql
-- NULL 值排序（MySQL 中 NULL 值排在最前面） 
SELECT name, bonus FROM employees ORDER BY bonus; -- NULL 值在前 
-- 将 NULL 值排在最后 
SELECT name, bonus FROM employees ORDER BY bonus IS NULL, bonus; 
-- 将 NULL 值排在最前 
SELECT name, bonus FROM employees ORDER BY bonus IS NOT NULL, bonus;
```
### ORDER BY 与其他子句结合

#### ORDER BY + WHERE
```sql
-- 查询技术部员工，按薪资降序排列 
SELECT name, salary 
FROM employees 
WHERE department = '技术部' ORDER BY salary DESC;
```
#### ORDER BY + LIMIT
```sql
-- 查询薪资最高的3名员工 
SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3; 
-- 查询薪资第4-6名的员工 
SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3 OFFSET 3;
```
#### ORDER BY + GROUP BY
```sql
-- 按部门统计平均薪资，并按平均薪资排序 
SELECT department, AVG(salary) as avg_salary, COUNT(*) as emp_count 
FROM employees 
GROUP BY department 
ORDER BY avg_salary DESC;
```
#### ORDER BY + HAVING
```sql
-- 查询平均薪资大于7000的部门，按平均薪资排序 
SELECT department, AVG(salary) as avg_salary 
FROM employees 
GROUP BY department 
HAVING AVG(salary) > 7000 
ORDER BY avg_salary DESC;
```

### 排序性能优化技巧
- 在排序列上创建索引
- 避免对大量数据进行排序
- 使用 LIMIT 限制结果集大小
- 考虑使用覆盖索引
- 避免在函数或表达式上排序

#### 索引优化示例
```sql
-- 为排序列创建索引 
CREATE INDEX idx_salary ON employees(salary); 
CREATE INDEX idx_dept_salary ON employees(department, salary); 
-- 复合索引的排序优化 
SELECT * FROM employees WHERE department = '技术部' ORDER BY salary DESC; 
-- 可以使用 idx_dept_salary 索引
```
#### 查看排序执行计划
```sql
-- 查看查询执行计划 
EXPLAIN SELECT * FROM employees ORDER BY salary DESC; 
-- 查看详细执行信息 
EXPLAIN FORMAT=JSON SELECT * FROM employees ORDER BY salary DESC;
```
### 实际应用场景
#### 1. 排行榜查询
```sql
-- 销售排行榜 
SELECT salesperson, SUM(amount) as total_sales 
FROM sales 
GROUP BY salesperson 
ORDER BY total_sales DESC 
LIMIT 10;
```
#### 2. 分页查询
```sql
-- 分页查询员工列表（第2页，每页10条） 
SELECT id, name, department, salary 
FROM employees 
ORDER BY id 
LIMIT 10 OFFSET 10;
```
#### 3. 时间序列数据
```sql
-- 按时间倒序查询最新订单 
SELECT order_id, customer_id, order_date, total_amount 
FROM orders 
ORDER BY order_date DESC, order_id DESC 
LIMIT 20;
```
#### 4. 多维度排序
```sql
-- 学生成绩排序：先按总分，再按数学成绩，最后按姓名 
SELECT student_name, math_score, english_score, (math_score + english_score) as total_score 
FROM student_scores 
ORDER BY total_score DESC, math_score DESC, student_name;
```
### 常见错误和注意事项
#### 常见错误
- 在 GROUP BY 中使用 ORDER BY 时的列选择错误
- 忘记考虑 NULL 值的排序影响
- 在大数据集上进行无索引排序
- 混淆列位置和列名的使用


#### GROUP BY 与 ORDER BY 的注意事项
```sql
-- 错误：ORDER BY 中的列必须在 SELECT 中或者是聚合函数 
SELECT department, COUNT(*) FROM employees GROUP BY department ORDER BY salary; -- 错误：salary 不在 SELECT 中 
-- 正确：使用聚合函数 
SELECT department, COUNT(*) FROM employees GROUP BY department ORDER BY AVG(salary) DESC;
```
#### 字符串排序的字符集问题
```sql
-- 指定排序规则 
SELECT name FROM employees ORDER BY name COLLATE utf8mb4_unicode_ci; 
-- 中文排序 
SELECT name FROM employees ORDER BY CONVERT(name USING gbk) COLLATE gbk_chinese_ci;
```
## MySQL GROUP BY 语句
### GROUP BY 简介
> GROUP BY 语句用于将查询结果按一个或多个列进行分组，通常与聚合函数（如 COUNT、SUM、AVG、MAX、MIN）一起使用，对每个分组进行统计计算。

#### GROUP BY 的特点
- 将数据按指定列分组
- 每个分组返回一行结果
- 通常与聚合函数配合使用
- 可以按多个列进行分组
- 支持 HAVING 子句过滤分组

### 基本语法
#### 基本 GROUP BY 语法
```sql
SELECT column1, aggregate_function(column2) FROM table_name WHERE condition GROUP BY column1;
```
#### 多列分组
```sql
SELECT column1, column2, aggregate_function(column3) FROM table_name GROUP BY column1, column2;
```
#### 带 HAVING 子句
```sql
SELECT column1, aggregate_function(column2) 
FROM table_name 
GROUP BY column1 
HAVING aggregate_function(column2) > value;
```
### 聚合函数
| 函数	| 描述 | 	示例|
| 函数	| 描述 | 	示例|
| ----- | ---- | --- | 
| COUNT()	| 计算行数	| COUNT(*), COUNT(column) |
| SUM()	| 计算总和	| SUM(salary) |
| AVG()	| 计算平均值	| AVG(age) |
| MAX()	| 找最大值	| MAX(score) |
| MIN()	| 找最小值	| MIN(price) |
| GROUP_CONCAT()	| 连接字符串	| GROUP_CONCAT(name) |

### 实际示例
#### 示例数据准备
```sql
-- 创建销售表 
CREATE TABLE sales ( 
    id INT PRIMARY KEY, 
    salesperson VARCHAR(50), 
    product VARCHAR(50), 
    region VARCHAR(50), 
    amount DECIMAL(10,2), 
    sale_date DATE 
); 
-- 插入测试数据 
INSERT INTO sales VALUES 
(1, '张三', '笔记本', '北京', 8000.00, '2023-01-15'), 
(2, '李四', '手机', '上海', 3000.00, '2023-01-20'), 
(3, '张三', '平板', '北京', 2500.00, '2023-02-10'), 
(4, '王五', '笔记本', '广州', 8500.00, '2023-02-15'), 
(5, '李四', '手机', '上海', 3200.00, '2023-03-05'), 
(6, '张三', '手机', '北京', 2800.00, '2023-03-10'), 
(7, '王五', '平板', '广州', 2600.00, '2023-03-20'),
(8, '赵六', '笔记本', '深圳', 9000.00, '2023-04-01');
```
#### 基本分组查询
##### 按销售员分组统计
```sql
-- 统计每个销售员的销售总额 
SELECT salesperson, COUNT(*) as order_count, SUM(amount) as total_sales, AVG(amount) as avg_sales 
FROM sales 
GROUP BY salesperson;
```
##### 按地区分组统计
```sql
-- 统计各地区的销售情况 
SELECT region, COUNT(*) as order_count, SUM(amount) as total_sales, MAX(amount) as max_sale, MIN(amount) as min_sale 
FROM sales 
GROUP BY region 
ORDER BY total_sales DESC;
```
##### 按产品分组统计
```sql
-- 统计各产品的销售情况 
SELECT product, COUNT(*) as sales_count, SUM(amount) as total_revenue, AVG(amount) as avg_price 
FROM sales 
GROUP BY product;
```
#### 多列分组
##### 按销售员和地区分组
```sql
-- 统计每个销售员在各地区的销售情况 
SELECT salesperson, region, COUNT(*) as order_count, SUM(amount) as total_sales 
FROM sales 
GROUP BY salesperson, region 
ORDER BY salesperson, region;
```
##### 按年月分组
```sql
-- 按月统计销售情况 
SELECT YEAR(sale_date) as year, MONTH(sale_date) as month, COUNT(*) as order_count, SUM(amount) as monthly_sales 
FROM sales 
GROUP BY YEAR(sale_date), MONTH(sale_date) 
ORDER BY year, month;
```
##### 按产品和地区分组
```sql
-- 统计各产品在不同地区的销售情况 
SELECT product, region, COUNT(*) as sales_count, SUM(amount) as total_revenue, AVG(amount) as avg_price 
FROM sales 
GROUP BY product, region 
ORDER BY product, total_revenue DESC;
```
### HAVING 子句
> HAVING 子句用于过滤分组后的结果，类似于 WHERE 子句，但 HAVING 是在分组之后进行过滤。

#### 基本 HAVING 用法
```sql
-- 查询销售总额大于10000的销售员 
SELECT salesperson, SUM(amount) as total_sales 
FROM sales 
GROUP BY salesperson 
HAVING SUM(amount) > 10000;
```
#### 多个 HAVING 条件
```sql
-- 查询订单数量大于1且平均销售额大于4000的销售员 
SELECT salesperson, COUNT(*) as order_count, AVG(amount) as avg_sales 
FROM sales 
GROUP BY salesperson 
HAVING COUNT(*) > 1 AND AVG(amount) > 4000;
```
#### HAVING 与 WHERE 的区别
```sql
-- WHERE 在分组前过滤，HAVING 在分组后过滤 
SELECT region, COUNT(*) as order_count, SUM(amount) as total_sales 
FROM sales 
WHERE amount > 3000 -- 分组前过滤：只考虑金额大于3000的订单 
GROUP BY region 
HAVING COUNT(*) >= 2; -- 分组后过滤：只显示订单数>=2的地区
```
### 高级分组技巧
#### 使用 GROUP_CONCAT
```sql
-- 将每个销售员的产品列表连接起来 
SELECT salesperson, GROUP_CONCAT(product) as products, GROUP_CONCAT(DISTINCT product) as unique_products, COUNT(*) as order_count 
FROM sales 
GROUP BY salesperson;
```
#### 条件聚合
```sql
-- 使用 CASE 语句进行条件聚合 
SELECT region, COUNT(*) as total_orders, 
SUM(CASE WHEN amount > 5000 THEN 1 ELSE 0 END) as high_value_orders, 
SUM(CASE WHEN amount > 5000 THEN amount ELSE 0 END) as high_value_sales 
FROM sales 
GROUP BY region;
```
#### 分组排名
```sql
-- 使用窗口函数进行分组排名 
SELECT salesperson, region, amount, ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) as rank_in_region 
FROM sales 
ORDER BY region, rank_in_region;
```
#### 分组百分比
```sql
-- 计算各地区销售额占总销售额的百分比 
SELECT region, SUM(amount) as region_sales, ROUND(SUM(amount) * 100.0 / (SELECT SUM(amount) FROM sales), 2) as percentage 
FROM sales 
GROUP BY region 
ORDER BY region_sales DESC;
```
### WITH ROLLUP
> WITH ROLLUP 用于在分组查询中生成小计和总计行。

#### 单列 ROLLUP
```sql
-- 按地区分组并生成总计 
SELECT region, SUM(amount) as total_sales 
FROM sales 
GROUP BY region WITH ROLLUP;
```
#### 多列 ROLLUP
```sql
-- 按地区和产品分组并生成各级小计 
SELECT region, product, SUM(amount) as total_sales 
FROM sales 
GROUP BY region, product WITH ROLLUP 
ORDER BY region, product;
```
#### 处理 ROLLUP 的 NULL 值
```sql
-- 使用 IFNULL 处理 ROLLUP 产生的 NULL 值 
SELECT IFNULL(region, '总计') as region, IFNULL(product, '小计') as product, SUM(amount) as total_sales 
FROM sales 
GROUP BY region, product WITH ROLLUP;
```
### GROUP BY 性能优化技巧：
- 在分组列上创建索引
- 使用覆盖索引避免回表
- 合理使用 WHERE 子句减少分组数据量
- 避免在大表上进行复杂分组
- 考虑使用分区表

#### 索引优化示例
```sql
-- 为分组列创建索引 
CREATE INDEX idx_region ON sales(region); CREATE INDEX idx_salesperson ON sales(salesperson); 
CREATE INDEX idx_region_product ON sales(region, product); 
-- 覆盖索引优化 
CREATE INDEX idx_cover ON sales(region, salesperson, amount);
```
#### 查看执行计划
```sql
-- 分析分组查询的执行计划 
EXPLAIN SELECT region, COUNT(*), SUM(amount) 
FROM sales 
GROUP BY region;
```
### 实际应用场景
#### 1. 销售报表
```sql
-- 月度销售报表 
SELECT DATE_FORMAT(sale_date, '%Y-%m') as month, COUNT(*) as order_count, SUM(amount) as total_sales, AVG(amount) as avg_order_value, COUNT(DISTINCT salesperson) as active_salespeople 
FROM sales 
GROUP BY DATE_FORMAT(sale_date, '%Y-%m') 
ORDER BY month;
```
#### 2. 用户行为分析
```sql
-- 用户活跃度分析 
SELECT user_id, COUNT(*) as login_count, MIN(login_time) as first_login, MAX(login_time) as last_login, DATEDIFF(MAX(login_time), MIN(login_time)) as active_days 
FROM user_logs 
GROUP BY user_id 
HAVING login_count >= 5 
ORDER BY login_count DESC;
```
#### 3. 库存统计
```sql
-- 按类别统计库存 
SELECT category, COUNT(*) as product_count, SUM(stock_quantity) as total_stock, AVG(price) as avg_price, SUM(stock_quantity * price) as total_value 
FROM products 
GROUP BY category 
ORDER BY total_value DESC;
```
### 常见错误和注意事项
- SELECT 中包含非分组列且不是聚合函数
- 混淆 WHERE 和 HAVING 的使用场景
- 在 ORDER BY 中使用未分组的列
- 忽略 NULL 值对分组的影响

#### SQL_MODE 设置
```sql
-- 查看当前 SQL 模式 
SELECT @@sql_mode; 
-- 设置严格模式（推荐） 
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
```
#### 正确的分组查询
```sql
-- 错误：SELECT 中包含非分组列 
SELECT region, salesperson, SUM(amount) 
-- 错误 
FROM sales 
GROUP BY region; 
-- 正确：只选择分组列和聚合函数 
SELECT region, SUM(amount) 
FROM sales 
GROUP BY region; 
-- 或者：将所有非聚合列都加入 GROUP BY 
SELECT region, salesperson, SUM(amount) 
FROM sales 
GROUP BY region, salesperson;
```




