---
title: "MySQL高级特性与优化"
date: 2021-02-10T10:00:00+08:00
draft: false
description: "MySQL高级特性与优化：临时表、复制表、元数据、序列使用、处理重复数据等。"
tags: ["MySQL", "mysql高级特性"]
categories: ["Database"]
---
MySQL高级特性与优化：临时表、复制表、元数据、序列使用、处理重复数据等。
## MySQL 临时表
### 临时表概述
> 临时表是 MySQL 中一种特殊的表类型，用于存储临时数据。它们在会话结束时自动删除，非常适合处理中间结果、复杂查询的数据缓存和数据处理任务。

- 会话临时表
使用 CREATE TEMPORARY TABLE 创建，只在当前会话中可见，会话结束时自动删除

- 内部临时表
MySQL 自动创建的临时表，用于处理复杂查询，如 GROUP BY、ORDER BY、UNION 等

#### 临时表的优势
- 自动清理，无需手动删除
- 会话隔离，不同会话间互不影响
- 提高复杂查询的性能
- 简化复杂的数据处理逻辑
- 减少对主表的锁定时间
#### 临时表使用注意事项
- 临时表占用内存和磁盘空间
- 大量临时表可能影响性能
- 无法在不同会话间共享数据
- 不支持外键约束

### 创建临时表
#### 基本语法
```sql
-- 创建临时表的基本语法 
CREATE TEMPORARY TABLE temp_table_name ( column1 datatype, column2 datatype, ... ); 
-- 从现有表结构创建临时表 
CREATE TEMPORARY TABLE temp_table_name LIKE existing_table; 
-- 从查询结果创建临时表 
CREATE TEMPORARY TABLE temp_table_name AS SELECT column1, column2, ... FROM existing_table WHERE condition;
```
#### 示例数据准备
```sql
-- 创建示例表 
CREATE TABLE sales ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    product_name VARCHAR(100), 
    category VARCHAR(50), 
    sale_date DATE, 
    quantity INT, 
    unit_price DECIMAL(10,2), 
    salesperson VARCHAR(50), 
    region VARCHAR(50) 
); 
-- 插入示例数据 
INSERT INTO sales (product_name, category, sale_date, quantity, unit_price, salesperson, region) VALUES 
('iPhone 14', '手机', '2024-01-15', 5, 7999.00, '张三', '华北'), 
('MacBook Pro', '笔记本', '2024-01-16', 2, 15999.00, '李四', '华东'), 
('iPad Air', '平板', '2024-01-17', 3, 4599.00, '王五', '华南'), 
('AirPods Pro', '耳机', '2024-01-18', 10, 1899.00, '张三', '华北'), 
('Samsung S23', '手机', '2024-01-19', 4, 5999.00, '赵六', '华西'), 
('Dell XPS', '笔记本', '2024-01-20', 1, 8999.00, '李四', '华东'), 
('Surface Pro', '平板', '2024-01-21', 2, 7888.00, '王五', '华南'), 
('Sony WH-1000XM5', '耳机', '2024-01-22', 6, 2399.00, '赵六', '华西'), 
('iPhone 15', '手机', '2024-01-23', 8, 8999.00, '张三', '华北'), 
('MacBook Air', '笔记本', '2024-01-24', 3, 8999.00, '李四', '华东'); 
CREATE TABLE customers ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    name VARCHAR(100), 
    email VARCHAR(100), 
    phone VARCHAR(20), 
    city VARCHAR(50), 
    registration_date DATE 
); 
INSERT INTO customers (name, email, phone, city, registration_date) VALUES 
('张明', 'zhangming@email.com', '13800138001', '北京', '2023-06-15'), 
('李华', 'lihua@email.com', '13800138002', '上海', '2023-07-20'), 
('王芳', 'wangfang@email.com', '13800138003', '广州', '2023-08-10'), 
('赵强', 'zhaoqiang@email.com', '13800138004', '深圳', '2023-09-05'), 
('刘洋', 'liuyang@email.com', '13800138005', '杭州', '2023-10-12');
```
#### 创建临时表示例
```sql
-- 1. 创建简单的临时表 
CREATE TEMPORARY TABLE temp_sales_summary ( category VARCHAR(50), total_quantity INT, total_amount DECIMAL(12,2), avg_price DECIMAL(10,2) ); 
-- 2. 从现有表结构创建临时表 
CREATE TEMPORARY TABLE temp_sales_backup LIKE sales; 
-- 3. 从查询结果创建临时表 
CREATE TEMPORARY TABLE temp_high_value_sales AS 
SELECT product_name, category, quantity, unit_price, (quantity * unit_price) AS total_value 
FROM sales 
WHERE (quantity * unit_price) > 10000; 
-- 4. 创建带索引的临时表 
CREATE TEMPORARY TABLE temp_sales_analysis ( id INT PRIMARY KEY AUTO_INCREMENT, category VARCHAR(50), month VARCHAR(7), total_sales DECIMAL(12,2), INDEX idx_category (category), INDEX idx_month (month) ); 
-- 查看创建的临时表 
SHOW TABLES; -- 注意：临时表不会在 SHOW TABLES 中显示 
-- 查看临时表结构 
DESCRIBE temp_sales_summary; 
DESCRIBE temp_high_value_sales;
```
### 临时表操作
#### 插入数据
```sql
-- 向临时表插入数据 
INSERT INTO temp_sales_summary (category, total_quantity, total_amount, avg_price) 
SELECT category, SUM(quantity) as total_quantity, SUM(quantity * unit_price) as total_amount, AVG(unit_price) as avg_price 
FROM sales 
GROUP BY category; 
-- 查看临时表数据 
SELECT * FROM temp_sales_summary; 
-- 向备份临时表插入数据 
INSERT INTO temp_sales_backup 
SELECT * FROM sales WHERE sale_date >= '2024-01-20'; 
-- 查看备份数据 
SELECT * FROM temp_sales_backup;
```
#### 更新和删除数据
```sql
-- 更新临时表数据 
UPDATE temp_sales_summary SET avg_price = ROUND(avg_price, 2) WHERE avg_price IS NOT NULL; 
-- 删除临时表中的数据 
DELETE FROM temp_high_value_sales WHERE total_value < 15000; 
-- 查看更新后的数据 
SELECT * FROM temp_sales_summary; 
SELECT * FROM temp_high_value_sales;
```
#### 查询临时表
```sql
-- 简单查询 
SELECT * FROM temp_sales_summary ORDER BY total_amount DESC; 
-- 连接查询（临时表与普通表） 
SELECT t.category, t.total_quantity, t.total_amount, COUNT(s.id) as transaction_count 
FROM temp_sales_summary t 
LEFT JOIN sales s ON t.category = s.category 
GROUP BY t.category, t.total_quantity, t.total_amount; 
-- 子查询中使用临时表 
SELECT product_name, total_value, CASE WHEN total_value > (SELECT AVG(total_value) FROM temp_high_value_sales) THEN '高于平均' ELSE '低于平均' END as value_level 
FROM temp_high_value_sales;
```
### 临时表的高级应用
#### 数据分析和报表
```sql
-- 创建月度销售分析临时表 
CREATE TEMPORARY TABLE temp_monthly_analysis AS SELECT DATE_FORMAT(sale_date, '%Y-%m') as month, category, COUNT(*) as transaction_count, SUM(quantity) as total_quantity, SUM(quantity * unit_price) as total_revenue, AVG(quantity * unit_price) as avg_transaction_value FROM sales GROUP BY DATE_FORMAT(sale_date, '%Y-%m'), category; 
-- 查看月度分析结果 
SELECT * FROM temp_monthly_analysis ORDER BY month, total_revenue DESC; 
-- 创建销售人员绩效临时表 
CREATE TEMPORARY TABLE temp_salesperson_performance AS SELECT salesperson, region, COUNT(*) as deals_count, SUM(quantity) as total_units_sold, SUM(quantity * unit_price) as total_sales, AVG(quantity * unit_price) as avg_deal_size, MAX(quantity * unit_price) as largest_deal FROM sales GROUP BY salesperson, region; 
-- 查看销售人员绩效 
SELECT salesperson, region, total_sales, deals_count, ROUND(avg_deal_size, 2) as avg_deal_size, RANK() OVER (ORDER BY total_sales DESC) as sales_rank FROM temp_salesperson_performance ORDER BY total_sales DESC;
```
#### 复杂数据处理
```sql
-- 创建产品分析临时表 
CREATE TEMPORARY TABLE temp_product_analysis ( product_name VARCHAR(100), category VARCHAR(50), total_sold INT, revenue DECIMAL(12,2), market_share DECIMAL(5,2), performance_level VARCHAR(20) ); 
-- 插入产品分析数据 
INSERT INTO temp_product_analysis (product_name, category, total_sold, revenue) SELECT product_name, category, SUM(quantity) as total_sold, SUM(quantity * unit_price) as revenue FROM sales GROUP BY product_name, category; 
-- 计算市场份额 
UPDATE temp_product_analysis t1 SET market_share = ( SELECT ROUND((t1.revenue / SUM(t2.revenue)) * 100, 2) FROM temp_product_analysis t2 WHERE t2.category = t1.category ); 
-- 设置性能等级 
UPDATE temp_product_analysis SET performance_level = CASE WHEN market_share >= 40 THEN '优秀' WHEN market_share >= 25 THEN '良好' WHEN market_share >= 15 THEN '一般' ELSE '需改进' END; 
-- 查看产品分析结果 
SELECT * FROM temp_product_analysis ORDER BY category, market_share DESC;
```
#### 数据清洗和转换
```sql
-- 创建数据清洗临时表 
CREATE TEMPORARY TABLE temp_clean_sales AS SELECT id, product_name, category, TRIM(UPPER(region)) as clean_region, TRIM(LOWER(city)) as clean_city, sale_date, quantity, unit_price, (quantity * unit_price) AS total_value FROM sales; 
-- 查看清洗后的数据 
SELECT * FROM temp_clean_sales;
-- 创建数据验证临时表 
CREATE TEMPORARY TABLE temp_data_validation AS SELECT id, clean_name, clean_email, clean_phone, clean_city, customer_type, CASE WHEN clean_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN '有效' ELSE '无效' END as email_status, CASE WHEN LENGTH(clean_phone) = 11 AND clean_phone REGEXP '^1[3-9][0-9]{9}$' THEN '有效' ELSE '无效' END as phone_status FROM temp_clean_customers; 
-- 查看验证结果 
SELECT customer_type, COUNT(*) as total_count, SUM(CASE WHEN email_status = '有效' THEN 1 ELSE 0 END) as valid_emails, SUM(CASE WHEN phone_status = '有效' THEN 1 ELSE 0 END) as valid_phones FROM temp_data_validation GROUP BY customer_type;
```
### 临时表与普通表的比较
| 特性 | 临时表 | 普通表 |
| --- | --- | --- |
| 生命周期 | 会话结束时自动删除 | 手动删除或数据库删除 |
| 可见性 | 仅当前会话可见 | 所有会话可见 |
| 存储位置 | 内存或临时目录 | 数据库文件 |
| 索引支持 | 支持 | 支持 |
| 外键约束 | 不支持 | 支持 |
| 触发器 | 不支持 | 支持 |
| 复制 | 不参与主从复制 | 参与主从复制 |
| 备份 | 不包含在备份中 | 包含在备份中 |

### 临时表性能优化

#### 内存配置
```sql
-- 查看临时表相关配置 
SHOW VARIABLES LIKE 'tmp%'; 
SHOW VARIABLES LIKE 'max_heap_table_size'; 
SHOW VARIABLES LIKE 'tmp_table_size'; 
-- 查看临时表使用统计 
SHOW GLOBAL STATUS LIKE 'Created_tmp%'; 
-- 临时表大小限制配置 
-- tmp_table_size: 内存临时表的最大大小 
-- max_heap_table_size: MEMORY 存储引擎表的最大大小 
-- 临时表大小受这两个参数中较小值的限制 
-- 设置临时表大小（需要适当权限） 
-- SET GLOBAL tmp_table_size = 64 * 1024 * 1024; -- 64MB 
-- SET GLOBAL max_heap_table_size = 64 * 1024 * 1024; -- 64MB
```
#### 性能监控
```sql
-- 监控临时表创建情况 
SHOW GLOBAL STATUS LIKE 'Created_tmp%'; 
-- 计算磁盘临时表比例 
SELECT (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME = 'Created_tmp_disk_tables') / (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME = 'Created_tmp_tables') * 100 AS disk_tmp_table_percentage; 
-- 查看当前会话的临时表 
SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH FROM information_schema.TABLES WHERE TABLE_TYPE = 'TEMPORARY';
```
#### 优化建议
```sql
-- 1. 为临时表创建适当的索引 
CREATE TEMPORARY TABLE temp_optimized_sales ( id INT PRIMARY KEY AUTO_INCREMENT, product_name VARCHAR(100), category VARCHAR(50), total_amount DECIMAL(12,2), sale_date DATE, INDEX idx_category (category), INDEX idx_date (sale_date), INDEX idx_amount (total_amount) ); 
-- 2. 使用适当的数据类型 
CREATE TEMPORARY TABLE temp_efficient_summary ( 
    category VARCHAR(50) NOT NULL, 
    count_sales MEDIUMINT UNSIGNED, -- 使用更小的整数类型 
    total_amount DECIMAL(10,2), -- 适当的精度 avg_amount DECIMAL(8,2), 
    PRIMARY KEY (category) 
); 
-- 3. 及时删除不需要的临时表 
DROP TEMPORARY TABLE IF EXISTS temp_no_longer_needed; 
-- 4. 批量操作而不是逐行操作 
-- 好的做法：批量插入 
INSERT INTO temp_efficient_summary SELECT category, COUNT(*), SUM(quantity * unit_price), AVG(quantity * unit_price) FROM sales GROUP BY category; 
-- 避免的做法：逐行插入 -- 
INSERT INTO temp_table VALUES (...); -- 重复多次
```
### 临时表的实际应用场景
#### 1. 复杂报表生成
```sql
-- 生成综合销售报表 
CREATE TEMPORARY TABLE temp_sales_report AS SELECT DATE_FORMAT(sale_date, '%Y-%m') as month, region, category, COUNT(*) as transactions, SUM(quantity) as total_quantity, SUM(quantity * unit_price) as revenue, AVG(quantity * unit_price) as avg_transaction FROM sales GROUP BY DATE_FORMAT(sale_date, '%Y-%m'), region, category; 
-- 添加同比数据 
ALTER TABLE temp_sales_report ADD COLUMN prev_month_revenue DECIMAL(12,2), ADD COLUMN growth_rate DECIMAL(5,2); 
-- 计算增长率（简化示例） 
UPDATE temp_sales_report t1 SET prev_month_revenue = ( SELECT revenue FROM temp_sales_report t2 WHERE t2.region = t1.region AND t2.category = t1.category AND t2.month = DATE_FORMAT(DATE_SUB(STR_TO_DATE(CONCAT(t1.month, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '%Y-%m') ); UPDATE temp_sales_report SET growth_rate = CASE WHEN prev_month_revenue > 0 THEN ROUND(((revenue - prev_month_revenue) / prev_month_revenue) * 100, 2) ELSE NULL END; 
-- 生成最终报表 
SELECT month, region, category, revenue, prev_month_revenue, growth_rate, CASE WHEN growth_rate > 10 THEN '快速增长' WHEN growth_rate > 0 THEN '稳定增长' WHEN growth_rate > -10 THEN '轻微下降' ELSE '显著下降' END as trend FROM temp_sales_report WHERE month = '2024-01' ORDER BY region, category;
```
#### 2. 数据迁移和ETL
```sql
-- 数据迁移示例 
CREATE TEMPORARY TABLE temp_migration_staging ( old_id INT, new_id INT AUTO_INCREMENT PRIMARY KEY, product_name VARCHAR(100), normalized_category VARCHAR(50), clean_price DECIMAL(10,2), migration_status VARCHAR(20) DEFAULT 'pending' ); 
-- 第一步：提取和清洗数据 
INSERT INTO temp_migration_staging (old_id, product_name, normalized_category, clean_price) SELECT id, TRIM(product_name), CASE WHEN category IN ('手机', 'phone', 'mobile') THEN '移动设备' WHEN category IN ('笔记本', 'laptop', 'notebook') THEN '计算机' WHEN category IN ('平板', 'tablet', 'pad') THEN '移动设备' WHEN category IN ('耳机', 'headphone', 'earphone') THEN '音频设备' ELSE '其他' END, ROUND(unit_price, 2) FROM sales WHERE unit_price > 0; 
-- 第二步：数据验证 
UPDATE temp_migration_staging SET migration_status = CASE WHEN product_name IS NULL OR product_name = '' THEN 'invalid_name' WHEN clean_price <= 0 THEN 'invalid_price' WHEN normalized_category = '其他' THEN 'needs_review' ELSE 'valid' END; 
-- 第三步：查看迁移状态 
SELECT migration_status, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM temp_migration_staging), 2) as percentage FROM temp_migration_staging GROUP BY migration_status; 
-- 第四步：迁移有效数据 
-- INSERT INTO new_products_table 
-- SELECT new_id, product_name, normalized_category, clean_price 
-- FROM temp_migration_staging 
-- WHERE migration_status = 'valid';
```
#### 3. 性能优化中间结果
```sql
-- 复杂查询优化示例 
-- 原始复杂查询（可能很慢） 
/* 
SELECT s1.region, s1.category, s1.total_sales, s2.avg_regional_sales, s3.category_rank FROM ( SELECT region, category, SUM(quantity * unit_price) as total_sales FROM sales GROUP BY region, category ) s1 JOIN ( SELECT region, AVG(total_sales) as avg_regional_sales FROM ( SELECT region, category, SUM(quantity * unit_price) as total_sales FROM sales GROUP BY region, category ) GROUP BY region ) s2 ON s1.region = s2.region JOIN ( SELECT category, RANK() OVER (ORDER BY SUM(quantity * unit_price) DESC) as category_rank FROM sales GROUP BY category ) s3 ON s1.category = s3.category; 
*/ 
-- 使用临时表优化 
-- 第一步：创建基础聚合临时表 
CREATE TEMPORARY TABLE temp_region_category_sales AS SELECT region, category, SUM(quantity * unit_price) as total_sales FROM sales GROUP BY region, category; 
-- 第二步：创建区域平均销售临时表 
CREATE TEMPORARY TABLE temp_regional_avg AS SELECT region, AVG(total_sales) as avg_regional_sales FROM temp_region_category_sales GROUP BY region; 
-- 第三步：创建分类排名临时表 
CREATE TEMPORARY TABLE temp_category_rank AS SELECT category, SUM(total_sales) as category_total, RANK() OVER (ORDER BY SUM(total_sales) DESC) as category_rank FROM temp_region_category_sales GROUP BY category; 
-- 第四步：最终查询（更快） 
SELECT rcs.region, rcs.category, rcs.total_sales, ra.avg_regional_sales, cr.category_rank FROM temp_region_category_sales rcs JOIN temp_regional_avg ra ON rcs.region = ra.region JOIN temp_category_rank cr ON rcs.category = cr.category ORDER BY rcs.region, cr.category_rank;
```
### 删除临时表
```sql
-- 手动删除临时表 
DROP TEMPORARY TABLE temp_sales_summary; DROP TEMPORARY TABLE temp_high_value_sales; 
-- 安全删除（如果存在才删除） 
DROP TEMPORARY TABLE IF EXISTS temp_sales_backup; DROP TEMPORARY TABLE IF EXISTS temp_monthly_analysis; 
-- 批量删除多个临时表 
DROP TEMPORARY TABLE IF EXISTS temp_product_analysis, temp_salesperson_performance, temp_clean_customers, temp_data_validation; 
-- 查看剩余的临时表 
-- 注意：临时表不会在 SHOW TABLES 中显示 
-- 可以通过 information_schema 查看 
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_TYPE = 'TEMPORARY' AND TABLE_SCHEMA = DATABASE();
```
#### 临时表自动清理
- 会话结束时，所有临时表自动删除
- 连接断开时，临时表自动清理
- MySQL 重启时，所有临时表丢失
- 不需要手动清理，但建议及时删除大型临时表

### 最佳实践和注意事项
#### 最佳实践
- 为临时表使用描述性的命名（如 temp_、tmp_ 前缀）
- 为大型临时表创建适当的索引
- 及时删除不再需要的临时表
- 监控临时表的内存使用情况
- 在复杂查询中使用临时表分解逻辑
- 使用适当的数据类型以节省空间
#### 注意事项
- 临时表不支持外键约束
- 临时表不参与主从复制
- 大量临时表可能消耗过多内存
- 临时表超过内存限制时会写入磁盘
- 不同会话的临时表完全隔离
- 临时表不包含在数据库备份中
#### 场景建议
| 场景	| 建议	| 原因	|
| --- | --- | --- |
| 复杂报表	| 使用临时表分步处理	| 提高可读性和性能	|
| 数据清洗	| 创建中间临时表	| 便于验证和调试	|
| 大量计算	| 使用索引优化临时表	| 加速后续查询	|
| 会话结束	| 让系统自动清理	| 避免手动管理	|
| 内存不足	| 调整 tmp_table_size	| 避免频繁磁盘写入	|


## MySQL 复制表
### 复制表概述
> 在 MySQL 中，复制表是一个常见的操作，用于创建表的副本、备份数据、测试环境搭建或数据迁移。MySQL 提供了多种方法来复制表的结构和数据。

- 结构复制
只复制表的结构（字段定义、索引、约束等），不包含数据

- 数据复制
复制表中的所有数据，通常需要先有目标表结构

- 完整复制
同时复制表结构和数据，创建完全相同的表副本

- 选择性复制
根据条件复制部分数据或特定字段

#### 复制表的应用场景
- 数据备份和恢复
- 测试环境数据准备
- 数据迁移和同步
- 历史数据归档
- 表结构版本管理
- 性能测试数据准备
### 示例数据准备
```sql
-- 创建原始表 
CREATE TABLE employees ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    employee_id VARCHAR(10) UNIQUE NOT NULL, 
    first_name VARCHAR(50) NOT NULL, 
    last_name VARCHAR(50) NOT NULL, 
    email VARCHAR(100) UNIQUE, 
    phone VARCHAR(20), 
    hire_date DATE NOT NULL, 
    job_title VARCHAR(100), 
    department VARCHAR(50), 
    salary DECIMAL(10,2), 
    manager_id INT, 
    status ENUM('active', 'inactive', 'terminated') DEFAULT 'active', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    INDEX idx_department (department), 
    INDEX idx_hire_date (hire_date), 
    INDEX idx_salary (salary), 
    FOREIGN KEY (manager_id) REFERENCES employees(id) 
); 
-- 插入示例数据 
INSERT INTO employees (employee_id, first_name, last_name, email, phone, hire_date, job_title, department, salary, manager_id) VALUES 
('EMP001', '张', '三', 'zhangsan@company.com', '13800138001', '2020-01-15', '软件工程师', 'IT部', 8000.00, NULL), 
('EMP002', '李', '四', 'lisi@company.com', '13800138002', '2020-03-20', '产品经理', '产品部', 12000.00, NULL), 
('EMP003', '王', '五', 'wangwu@company.com', '13800138003', '2020-06-10', '设计师', '设计部', 7000.00, NULL), 
('EMP004', '赵', '六', 'zhaoliu@company.com', '13800138004', '2021-01-08', '高级工程师', 'IT部', 15000.00, 1), 
('EMP005', '钱', '七', 'qianqi@company.com', '13800138005', '2021-04-12', '测试工程师', 'IT部', 6500.00, 1), 
('EMP006', '孙', '八', 'sunba@company.com', '13800138006', '2021-07-20', '运营专员', '运营部', 5500.00, NULL), 
('EMP007', '周', '九', 'zhoujiu@company.com', '13800138007', '2022-02-14', '数据分析师', '数据部', 9000.00, NULL), 
('EMP008', '吴', '十', 'wushi@company.com', '13800138008', '2022-05-30', '前端工程师', 'IT部', 7500.00, 4), 
('EMP009', '郑', '十一', 'zhengshiyi@company.com', '13800138009', '2022-09-15', '后端工程师', 'IT部', 8500.00, 4), 
('EMP010', '王', '十二', 'wangshier@company.com', '13800138010', '2023-01-10', '实习生', 'IT部', 3000.00, 5); 
-- 创建另一个示例表 
CREATE TABLE departments ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    dept_code VARCHAR(10) UNIQUE NOT NULL, 
    dept_name VARCHAR(50) NOT NULL, 
    manager_id INT, 
    budget DECIMAL(12,2), 
    location VARCHAR(100), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 
INSERT INTO departments (dept_code, dept_name, manager_id, budget, location) VALUES 
('IT', 'IT部', 1, 500000.00, '北京'), 
('PROD', '产品部', 2, 300000.00, '上海'), 
('DESIGN', '设计部', 3, 200000.00, '深圳'), 
('OPS', '运营部', 6, 150000.00, '广州'), 
('DATA', '数据部', 7, 250000.00, '杭州');
```
### 复制表结构
#### 方法一：CREATE TABLE ... LIKE
```sql
-- 复制表结构（包括索引，但不包括数据） 
CREATE TABLE employees_backup LIKE employees; 
-- 查看复制的表结构 
DESCRIBE employees_backup; 
SHOW CREATE TABLE employees_backup; 
-- 查看索引 
SHOW INDEX FROM employees_backup; 
-- 验证表是否为空 
SELECT COUNT(*) FROM employees_backup;
```
#### 方法二：CREATE TABLE ... AS SELECT（仅结构）
```sql
-- 复制表结构（不包括索引和约束） 
CREATE TABLE employees_structure AS SELECT * FROM employees WHERE 1=0; 
-- 查看表结构 
DESCRIBE employees_structure; 
-- 注意：这种方法不会复制索引、外键等约束 
SHOW INDEX FROM employees_structure;
```
#### 方法三：手动创建表结构
```sql
-- 获取原表的创建语句 
SHOW CREATE TABLE employees; 
-- 基于原表结构手动创建新表（可以修改表名和部分结构） 
CREATE TABLE employees_modified ( 
    id INT PRIMARY KEY AUTO_INCREMENT, 
    employee_id VARCHAR(10) UNIQUE NOT NULL, 
    full_name VARCHAR(100) NOT NULL, -- 合并 first_name 和 last_name 
    email VARCHAR(100) UNIQUE, 
    phone VARCHAR(20), 
    hire_date DATE NOT NULL, 
    job_title VARCHAR(100), 
    department VARCHAR(50), 
    salary DECIMAL(10,2), 
    manager_id INT, 
    status ENUM('active', 'inactive', 'terminated') DEFAULT 'active', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    INDEX idx_department (department), 
    INDEX idx_hire_date (hire_date) -- 注意：外键约束需要目标表存在 
);
```
### 复制表数据
#### 完整数据复制
```sql
-- 向已存在的表中插入所有数据 
INSERT INTO employees_backup SELECT * FROM employees; 
-- 验证数据复制 
SELECT COUNT(*) FROM employees_backup; 
SELECT * FROM employees_backup LIMIT 5; 
-- 比较原表和备份表的数据 
SELECT (SELECT COUNT(*) FROM employees) as original_count, (SELECT COUNT(*) FROM employees_backup) as backup_count;
```
#### 选择性数据复制
```sql
-- 创建目标表 
CREATE TABLE active_employees LIKE employees; 
-- 只复制活跃员工的数据 
INSERT INTO active_employees SELECT * FROM employees WHERE status = 'active'; 
-- 创建高薪员工表 
CREATE TABLE high_salary_employees AS SELECT employee_id, CONCAT(first_name, ' ', last_name) as full_name, email, job_title, department, salary, hire_date FROM employees WHERE salary > 8000; 
-- 查看结果 
SELECT * FROM active_employees; 
SELECT * FROM high_salary_employees;
```
#### 跨数据库复制
```sql
-- 假设要复制到另一个数据库 
-- 首先创建目标数据库（如果不存在） -- 
CREATE DATABASE backup_db; 
-- 复制表结构到另一个数据库 -- 
CREATE TABLE backup_db.employees LIKE employees; 
-- 复制数据到另一个数据库 -- 
INSERT INTO backup_db.employees SELECT * FROM employees; 
-- 或者一步完成（结构+数据） -- 
CREATE TABLE backup_db.employees_copy AS SELECT * FROM employees;
```
### 完整表复制
#### 方法一：CREATE TABLE ... AS SELECT
```sql
-- 一步完成结构和数据的复制 
CREATE TABLE employees_complete_copy AS SELECT * FROM employees; 
-- 验证复制结果 
SELECT COUNT(*) FROM employees_complete_copy; 
DESCRIBE employees_complete_copy; 
-- 注意：需要手动添加索引和约束 
ALTER TABLE employees_complete_copy 
ADD PRIMARY KEY (id), 
ADD UNIQUE KEY unique_employee_id (employee_id), 
ADD UNIQUE KEY unique_email (email), 
ADD INDEX idx_department (department), 
ADD INDEX idx_hire_date (hire_date), 
ADD INDEX idx_salary (salary); 
-- 修改自增属性 
ALTER TABLE employees_complete_copy MODIFY COLUMN id INT AUTO_INCREMENT;
```
#### 方法二：分步复制（推荐）
```sql
-- 第一步：复制表结构（包括索引和约束） 
CREATE TABLE employees_best_copy LIKE employees; 
-- 第二步：复制数据 
INSERT INTO employees_best_copy SELECT * FROM employees; 
-- 验证复制结果 
SELECT COUNT(*) FROM employees_best_copy; 
SHOW INDEX FROM employees_best_copy; 
-- 这种方法保留了所有索引和约束（除了外键）
```
#### 处理外键约束
```sql
-- 如果原表有外键约束，需要特殊处理 
-- 方法1：临时禁用外键检查 
SET FOREIGN_KEY_CHECKS = 0; 
-- 复制表结构和数据 
CREATE TABLE employees_with_fk LIKE employees; INSERT INTO employees_with_fk SELECT * FROM employees; 
-- 重新启用外键检查 
SET FOREIGN_KEY_CHECKS = 1; 
-- 方法2：删除外键约束后复制 
CREATE TABLE employees_no_fk LIKE employees; 
-- 删除外键约束 
ALTER TABLE employees_no_fk DROP FOREIGN KEY employees_ibfk_1; 
-- 插入数据 
INSERT INTO employees_no_fk SELECT * FROM employees; 
-- 如果需要，重新添加外键约束 -- 
ALTER TABLE employees_no_fk -- 
ADD FOREIGN KEY (manager_id) 
REFERENCES employees_no_fk(id);
```
### 高级复制技巧
#### 带条件的复制
```sql
-- 复制最近一年入职的员工 
CREATE TABLE recent_employees AS SELECT * FROM employees WHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR); 
-- 复制特定部门的员工 
CREATE TABLE it_employees AS SELECT * FROM employees WHERE department = 'IT部'; 
-- 复制薪资前50%的员工 
CREATE TABLE top_salary_employees AS SELECT * FROM employees WHERE salary >= ( SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) FROM employees ); 
-- MySQL 8.0 之前的版本可以使用这种方法计算中位数 
CREATE TABLE top_50_percent_employees AS SELECT e1.* FROM employees e1 WHERE ( SELECT COUNT(*) FROM employees e2 WHERE e2.salary >= e1.salary ) <= ( SELECT COUNT(*) * 0.5 FROM employees );
```
#### 数据转换复制
```sql  
-- 复制时进行数据转换 
CREATE TABLE employees_transformed 
AS SELECT 
id, employee_id, 
CONCAT(first_name, ' ', last_name) as full_name, 
UPPER(email) as email_upper, 
phone, hire_date, 
UPPER(job_title) as job_title_upper, 
department, 
ROUND(salary * 1.1, 2) as adjusted_salary, -- 薪资上调10% 
manager_id, status, 
YEAR(hire_date) as hire_year, 
DATEDIFF(CURDATE(), hire_date) as days_employed, 
CASE 
WHEN salary > 10000 THEN '高薪' 
WHEN salary > 7000 THEN '中薪' 
ELSE '基础薪资' END as salary_level, 
created_at, 
updated_at 
FROM employees; 
-- 查看转换结果 
SELECT full_name, adjusted_salary, salary_level, days_employed FROM employees_transformed LIMIT 5;
```
#### 分区表复制
```sql
-- 创建按年份分区的员工表 
CREATE TABLE employees_partitioned ( id INT PRIMARY KEY AUTO_INCREMENT, employee_id VARCHAR(10) UNIQUE NOT NULL, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL, email VARCHAR(100) UNIQUE, phone VARCHAR(20), hire_date DATE NOT NULL, job_title VARCHAR(100), department VARCHAR(50), salary DECIMAL(10,2), manager_id INT, status ENUM('active', 'inactive', 'terminated') DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ) PARTITION BY RANGE (YEAR(hire_date)) ( PARTITION p2020 VALUES LESS THAN (2021), PARTITION p2021 VALUES LESS THAN (2022), PARTITION p2022 VALUES LESS THAN (2023), PARTITION p2023 VALUES LESS THAN (2024), PARTITION p_future VALUES LESS THAN MAXVALUE ); 
-- 复制数据到分区表 
INSERT INTO employees_partitioned SELECT * FROM employees; 
-- 查看分区信息 
SELECT PARTITION_NAME, TABLE_ROWS, PARTITION_EXPRESSION FROM information_schema.PARTITIONS WHERE TABLE_NAME = 'employees_partitioned' AND PARTITION_NAME IS NOT NULL;
```
### 复制方法比较
|方法|结构|数据|索引|约束|外键|适用场景|
|--|--|--|--|--|--|--|
|CREATE TABLE ... LIKE|✅|❌|✅|✅|❌|只需要表结构|
|CREATE TABLE ... AS SELECT|✅|✅|❌|❌|❌|快速复制数据|
|LIKE + INSERT SELECT|✅|✅|✅|✅|❌|完整复制（推荐）|
|手动创建 + INSERT|✅|✅|✅|✅|✅|需要修改结构|

### 批量复制和自动化
#### 批量复制多个表
```sql
-- 使用存储过程批量复制表 
DELIMITER // 
CREATE PROCEDURE CloneMultipleTables() BEGIN DECLARE done INT DEFAULT FALSE; DECLARE table_name VARCHAR(64); DECLARE cur CURSOR FOR SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('employees', 'departments'); DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; OPEN cur; read_loop: LOOP FETCH cur INTO table_name; IF done THEN LEAVE read_loop; END IF;
 -- 创建备份表 
 SET @sql = CONCAT('CREATE TABLE ', table_name, '_backup LIKE ', table_name); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; 
 -- 复制数据 
 SET @sql = CONCAT('INSERT INTO ', table_name, '_backup SELECT * FROM ', table_name); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; END LOOP; CLOSE cur; END 
 // DELIMITER ; 
 -- 调用存储过程 
 CALL CloneMultipleTables(); 
 -- 验证结果 
 SHOW TABLES LIKE '%_backup'; 
 SELECT COUNT(*) FROM employees_backup; 
 SELECT COUNT(*) FROM departments_backup; 
 -- 清理存储过程 
 DROP PROCEDURE CloneMultipleTables;
 ```
#### 定时备份表
```sql
-- 创建带时间戳的备份表 
SET @backup_suffix = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'); 
SET @sql = CONCAT('CREATE TABLE employees_backup_', @backup_suffix, ' AS SELECT * FROM employees'); 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DELIMITER PREPARE stmt; 
-- 查看创建的备份表 
SHOW TABLES LIKE 'employees_backup_%'; 
-- 创建存储过程用于定时备份 
DELIMITER // 
CREATE PROCEDURE CreateDailyBackup(IN table_name VARCHAR(64)) BEGIN DECLARE backup_table_name VARCHAR(128); SET backup_table_name = CONCAT(table_name, '_backup_', DATE_FORMAT(NOW(), '%Y%m%d')); 
-- 检查备份表是否已存在 
SET @check_sql = CONCAT( 'SELECT COUNT(*) INTO @table_exists FROM information_schema.TABLES ', 'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "', backup_table_name, '"' ); 
PREPARE stmt FROM @check_sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
-- 如果不存在则创建备份 
IF @table_exists = 0 THEN SET @sql = CONCAT('CREATE TABLE ', backup_table_name, ' AS SELECT * FROM ', table_name); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; SELECT CONCAT('Backup created: ', backup_table_name) AS result; ELSE SELECT CONCAT('Backup already exists: ', backup_table_name) AS result; END IF; END 
// DELIMITER ; 
-- 使用存储过程创建备份 
CALL CreateDailyBackup('employees'); 
CALL CreateDailyBackup('departments');
```
### 复制表的性能优化
#### 大表复制优化
```sql
-- 对于大表，分批复制数据 
-- 首先创建表结构 
CREATE TABLE large_employees_copy LIKE employees; 
-- 分批插入数据（假设按ID分批） 
INSERT INTO large_employees_copy SELECT * FROM employees WHERE id BETWEEN 1 AND 1000; 
INSERT INTO large_employees_copy SELECT * FROM employees WHERE id BETWEEN 1001 AND 2000; 
-- 或者使用循环批量插入 
DELIMITER // 
CREATE PROCEDURE BatchCopyData() BEGIN 
DECLARE batch_size INT DEFAULT 1000; 
DECLARE offset_val INT DEFAULT 0; 
DECLARE row_count INT; 
-- 获取总行数 
SELECT COUNT(*) INTO row_count FROM employees; 
WHILE offset_val < row_count DO SET @sql = CONCAT( 'INSERT INTO large_employees_copy ', 'SELECT * FROM employees LIMIT ', batch_size, ' OFFSET ', offset_val ); 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
SET offset_val = offset_val + batch_size; END WHILE; END 
// DELIMITER ; 
-- 调用批量复制过程 -- 
CALL BatchCopyData();
```
#### 复制性能监控
```sql
-- 监控复制操作的性能 
SET profiling = 1; 
-- 执行复制操作 
CREATE TABLE employees_perf_test AS SELECT * FROM employees; 
-- 查看性能分析 
SHOW PROFILES; 
SHOW PROFILE FOR QUERY 1; 
-- 关闭性能分析 
SET profiling = 0; 
-- 比较不同复制方法的性能 
-- 方法1：
CREATE AS SELECT SET @start_time = NOW(6); 
CREATE TABLE test1 AS SELECT * FROM employees; 
SET @end_time = NOW(6); 
SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) AS method1_microseconds; 
-- 方法2：
LIKE + INSERT SET @start_time = NOW(6); 
CREATE TABLE test2 LIKE employees; 
INSERT INTO test2 SELECT * FROM employees; 
SET @end_time = NOW(6); 
SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) AS method2_microseconds; 
-- 清理测试表 
DROP TABLE test1, test2, employees_perf_test;
```
### 复制表的维护和管理
#### 验证复制完整性
```sql
-- 比较原表和复制表的行数 
SELECT 'employees' as table_name, COUNT(*) as row_count FROM employees UNION ALL SELECT 'employees_backup' as table_name, COUNT(*) as row_count FROM employees_backup; 
-- 比较数据完整性（使用校验和） 
SELECT 'original' as source, BIT_XOR(CRC32(CONCAT_WS('|', id, employee_id, first_name, last_name, email))) as checksum FROM employees UNION ALL SELECT 'backup' as source, BIT_XOR(CRC32(CONCAT_WS('|', id, employee_id, first_name, last_name, email))) as checksum FROM employees_backup; 
-- 查找差异数据 
SELECT 'in_original_not_backup' as diff_type, e.* FROM employees e LEFT JOIN employees_backup eb ON e.id = eb.id WHERE eb.id IS NULL UNION ALL SELECT 'in_backup_not_original' as diff_type, eb.* FROM employees_backup eb LEFT JOIN employees e ON eb.id = e.id WHERE e.id IS NULL;
```
#### 清理旧的备份表
```sql
-- 查找所有备份表 
SELECT TABLE_NAME, CREATE_TIME, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%_backup%' ORDER BY CREATE_TIME DESC; 
-- 创建清理旧备份的存储过程 
DELIMITER // 
CREATE PROCEDURE CleanOldBackups(IN days_to_keep INT) 
BEGIN 
DECLARE done INT DEFAULT FALSE; 
DECLARE table_name VARCHAR(64); 
DECLARE table_date DATE; 
DECLARE cur CURSOR FOR SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME REGEXP '_backup_[0-9]{8}$' AND CREATE_TIME < DATE_SUB(NOW(), INTERVAL days_to_keep DAY); 
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; 
OPEN cur; 
read_loop: LOOP FETCH cur INTO table_name; 
IF done THEN LEAVE read_loop; 
END IF; 
SET @sql = CONCAT('DROP TABLE ', table_name); 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
SELECT CONCAT('Dropped old backup: ', table_name) AS message; 
END LOOP; 
CLOSE cur; 
END 
// DELIMITER ; 
-- 清理7天前的备份 -- 
CALL CleanOldBackups(7);
```
### 最佳实践和注意事项
#### 最佳实践
- 使用 CREATE TABLE ... LIKE + INSERT SELECT 方法进行完整复制
- 大表复制时考虑分批处理
- 复制前检查磁盘空间是否充足
- 为备份表使用有意义的命名规范
- 定期验证备份数据的完整性
- 及时清理不需要的备份表
- 在生产环境中谨慎处理外键约束
#### 注意事项
- CREATE TABLE ... AS SELECT 不会复制索引和约束
- 外键约束在复制时需要特殊处理
- AUTO_INCREMENT 值可能需要重新设置
- 复制大表时会消耗大量磁盘空间和时间
- 复制过程中原表可能被锁定
- 触发器不会被复制到新表
- 分区信息需要单独处理

| 场景	| 推荐方法	| 注意事项| 
| ---| ---| ---|
| 数据备份	| LIKE + INSERT SELECT	| 保留完整结构和约束| 
| 测试环境	| CREATE AS SELECT	| 快速创建，后续添加索引| 
| 数据迁移	| 手动创建 + INSERT	| 可以修改结构| 
| 历史归档	| CREATE AS SELECT + 条件	| 只复制需要的数据| 
| 性能测试	| 批量复制	| 避免影响生产环境| 
### 清理示例表
```sql
-- 清理创建的所有示例表 
DROP TABLE IF EXISTS employees_backup, employees_structure, employees_modified, active_employees, high_salary_employees, employees_complete_copy, employees_best_copy, employees_with_fk, employees_no_fk, recent_employees, it_employees, top_salary_employees, top_50_percent_employees, employees_transformed, employees_partitioned, large_employees_copy, departments_backup; 
-- 删除存储过程 
DROP PROCEDURE IF EXISTS CreateDailyBackup; 
DROP PROCEDURE IF EXISTS BatchCopyData; 
DROP PROCEDURE IF EXISTS CleanOldBackups; 
SELECT 'All example tables and procedures have been cleaned up.' AS message;
```
## MySQL 元数据
### 元数据概述
> 元数据是描述数据的数据，在 MySQL 中，元数据包含了数据库、表、列、索引、约束等结构信息。MySQL 提供了多种方式来查询和获取这些元数据信息。

- INFORMATION_SCHEMA
标准的元数据视图，提供数据库结构信息

- SHOW 语句
MySQL 特有的元数据查询命令

- PERFORMANCE_SCHEMA
性能监控和诊断信息

- SYS 模式
简化的性能监控视图

#### 元数据的用途
- 数据库结构分析和文档生成
- 自动化脚本和工具开发
- 数据库迁移和同步
- 性能监控和优化
- 安全审计和权限管理
- 数据字典维护

### INFORMATION_SCHEMA 数据库
#### 查看所有元数据表
```sql
-- 查看 INFORMATION_SCHEMA 中的所有表 
SELECT TABLE_NAME, TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'INFORMATION_SCHEMA' ORDER BY TABLE_NAME; 
-- 查看常用的元数据表 
SELECT TABLE_NAME, TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'INFORMATION_SCHEMA' AND TABLE_NAME IN ( 'SCHEMATA', 'TABLES', 'COLUMNS', 'STATISTICS', 'KEY_COLUMN_USAGE', 'TABLE_CONSTRAINTS', 'VIEWS' ) ORDER BY TABLE_NAME;
```
#### 数据库信息查询
```sql
-- 查看所有数据库 
SELECT SCHEMA_NAME as database_name, DEFAULT_CHARACTER_SET_NAME as charset, DEFAULT_COLLATION_NAME as collation FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') ORDER BY SCHEMA_NAME; 
-- 查看当前数据库信息 
SELECT SCHEMA_NAME as current_database, DEFAULT_CHARACTER_SET_NAME as charset, DEFAULT_COLLATION_NAME as collation FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = DATABASE(); 
-- 统计每个数据库的表数量 
SELECT TABLE_SCHEMA as database_name, COUNT(*) as table_count, SUM(CASE WHEN TABLE_TYPE = 'BASE TABLE' THEN 1 ELSE 0 END) as base_tables, SUM(CASE WHEN TABLE_TYPE = 'VIEW' THEN 1 ELSE 0 END) as views FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') GROUP BY TABLE_SCHEMA ORDER BY table_count DESC;
```
#### 表信息查询
```sql
-- 查看当前数据库的所有表 
SELECT TABLE_NAME as table_name, TABLE_TYPE as type, ENGINE as storage_engine, TABLE_ROWS as estimated_rows, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb, TABLE_COMMENT as comment, CREATE_TIME as created_at, UPDATE_TIME as updated_at FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY size_mb DESC; 
-- 查看表的详细存储信息 
SELECT TABLE_NAME, ENGINE, TABLE_ROWS, ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_size_mb, ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_size_mb, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb, ROUND(INDEX_LENGTH / DATA_LENGTH * 100, 2) as index_ratio_percent FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND DATA_LENGTH > 0 ORDER BY total_size_mb DESC; 
-- 查找大表（超过指定大小） 
SELECT TABLE_NAME, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND (DATA_LENGTH + INDEX_LENGTH) > 10 * 1024 * 1024 -- 大于10MB ORDER BY size_mb DESC;
```
#### 列信息查询
```sql
-- 查看表的所有列信息 
SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type, COLUMN_TYPE as full_type, IS_NULLABLE as nullable, COLUMN_DEFAULT as default_value, EXTRA as extra_info, COLUMN_COMMENT as comment FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' -- 替换为实际表名 
ORDER BY ORDINAL_POSITION; 
-- 查找所有包含特定列名的表 
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME LIKE '%email%' ORDER BY TABLE_NAME, COLUMN_NAME; 
-- 查找所有自增列 
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND EXTRA LIKE '%auto_increment%' ORDER BY TABLE_NAME; 
-- 统计数据类型使用情况 
SELECT DATA_TYPE, COUNT(*) as usage_count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE()), 2) as percentage FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() GROUP BY DATA_TYPE ORDER BY usage_count DESC;
```
### 索引和约束信息
#### 索引信息查询
```sql
-- 查看表的所有索引 
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX as position, NON_UNIQUE, INDEX_TYPE, COMMENT FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' -- 替换为实际表名 
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX; 
-- 查找复合索引 
SELECT TABLE_NAME, INDEX_NAME, COUNT(*) as column_count, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() GROUP BY TABLE_NAME, INDEX_NAME HAVING COUNT(*) > 1 ORDER BY TABLE_NAME, column_count DESC; 
-- 查找没有索引的表 
SELECT t.TABLE_NAME FROM INFORMATION_SCHEMA.TABLES t LEFT JOIN INFORMATION_SCHEMA.STATISTICS s ON t.TABLE_SCHEMA = s.TABLE_SCHEMA AND t.TABLE_NAME = s.TABLE_NAME WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE' AND s.TABLE_NAME IS NULL; 
-- 统计索引使用情况 
SELECT TABLE_NAME, COUNT(DISTINCT INDEX_NAME) as index_count, SUM(CASE WHEN NON_UNIQUE = 0 THEN 1 ELSE 0 END) as unique_indexes, SUM(CASE WHEN NON_UNIQUE = 1 THEN 1 ELSE 0 END) as non_unique_indexes FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() GROUP BY TABLE_NAME ORDER BY index_count DESC;
```
#### 约束信息查询
```sql
-- 查看所有约束 
SELECT CONSTRAINT_NAME, TABLE_NAME, CONSTRAINT_TYPE, ENFORCED FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, CONSTRAINT_TYPE; 
-- 查看主键信息 
SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, kcu.COLUMN_NAME, kcu.ORDINAL_POSITION FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY' ORDER BY tc.TABLE_NAME, kcu.ORDINAL_POSITION; 
-- 查看外键关系 
SELECT kcu.TABLE_NAME as child_table, kcu.COLUMN_NAME as child_column, kcu.REFERENCED_TABLE_NAME as parent_table, kcu.REFERENCED_COLUMN_NAME as parent_column, rc.CONSTRAINT_NAME, rc.UPDATE_RULE, rc.DELETE_RULE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY kcu.TABLE_NAME; 
-- 查看唯一约束 
SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) as columns FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.CONSTRAINT_TYPE = 'UNIQUE' GROUP BY tc.TABLE_NAME, tc.CONSTRAINT_NAME ORDER BY tc.TABLE_NAME;
```
### SHOW 语句
#### 基本 SHOW 语句
```sql
-- 显示所有数据库 
SHOW DATABASES; -- 显示当前数据库的所有表 
SHOW TABLES; -- 显示表结构 
SHOW COLUMNS FROM employees; 
-- 或者使用简写 
DESC employees; 
DESCRIBE employees; 
-- 显示表的创建语句 
SHOW CREATE TABLE employees; 
-- 显示表的索引 
SHOW INDEX FROM employees; 
-- 显示表状态 
SHOW TABLE STATUS; 
SHOW TABLE STATUS LIKE 'employees'; 
-- 显示所有视图 
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```
#### 高级 SHOW 语句
```sql
-- 显示服务器状态 
SHOW STATUS; 
SHOW STATUS LIKE 'Connections'; 
SHOW STATUS LIKE 'Slow_queries'; 
-- 显示系统变量 
SHOW VARIABLES; 
SHOW VARIABLES LIKE 'innodb%'; 
SHOW VARIABLES LIKE 'max_connections'; 
-- 显示进程列表 
SHOW PROCESSLIST; 
SHOW FULL PROCESSLIST; 
-- 显示存储引擎 
SHOW ENGINES; 
-- 显示字符集 
SHOW CHARACTER SET; 
SHOW COLLATION; 
-- 显示权限 
SHOW GRANTS; 
SHOW GRANTS FOR CURRENT_USER(); 
-- 显示错误和警告 
SHOW ERRORS; 
SHOW WARNINGS; 
-- 显示二进制日志 
SHOW BINARY LOGS; 
SHOW MASTER STATUS;
```
#### 条件过滤的 SHOW 语句
```sql
-- 使用 LIKE 过滤 
SHOW TABLES LIKE 'emp%'; 
-- 使用 REGEXP 过滤 
SHOW VARIABLES LIKE 'innodb_buffer%'; 
SHOW STATUS LIKE 'Com_select'; 
-- 使用 WHERE 子句（MySQL 5.7+） 
SHOW COLUMNS FROM employees WHERE Field LIKE '%name%'; 
SHOW TABLE STATUS WHERE Engine = 'InnoDB'; 
-- 显示特定数据库的表 
SHOW TABLES FROM mysql; 
SHOW TABLES IN information_schema LIKE 'TABLE%';
```
### 视图和存储过程元数据
#### 视图信息查询
```sql
-- 查看所有视图 
SELECT TABLE_NAME as view_name, VIEW_DEFINITION as definition, CHECK_OPTION, IS_UPDATABLE, DEFINER, SECURITY_TYPE FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = DATABASE(); 
-- 查看视图的列信息 
SELECT TABLE_NAME as view_name, COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ( SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = DATABASE() ) ORDER BY TABLE_NAME, ORDINAL_POSITION; 
-- 创建示例视图用于演示 
CREATE VIEW employee_summary AS SELECT department, COUNT(*) as employee_count, AVG(salary) as avg_salary, MAX(salary) as max_salary, MIN(salary) as min_salary FROM employees WHERE status = 'active' GROUP BY department; 
-- 查看视图定义 
SHOW CREATE VIEW employee_summary;
```
#### 存储过程和函数信息
```sql
-- 查看所有存储过程和函数 
SELECT ROUTINE_NAME as name, ROUTINE_TYPE as type, DATA_TYPE as return_type, ROUTINE_DEFINITION as definition, DEFINER, CREATED, LAST_ALTERED FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE(); 
-- 查看存储过程参数 
SELECT SPECIFIC_NAME as routine_name, PARAMETER_NAME, PARAMETER_MODE, DATA_TYPE FROM INFORMATION_SCHEMA.PARAMETERS WHERE SPECIFIC_SCHEMA = DATABASE() ORDER BY SPECIFIC_NAME, ORDINAL_POSITION; 
-- 显示存储过程 
SHOW PROCEDURE STATUS WHERE Db = DATABASE(); SHOW FUNCTION STATUS WHERE Db = DATABASE(); 
-- 创建示例存储过程 
DELIMITER // 
CREATE PROCEDURE GetEmployeesByDepartment(IN dept_name VARCHAR(50)) BEGIN SELECT employee_id, first_name, last_name, salary FROM employees WHERE department = dept_name AND status = 'active' ORDER BY salary DESC; END 
// DELIMITER ; 
-- 查看存储过程定义 
SHOW CREATE PROCEDURE GetEmployeesByDepartment;
```
### 性能相关元数据
#### PERFORMANCE_SCHEMA 查询
```sql
-- 查看表的 I/O 统计 
SELECT OBJECT_SCHEMA, OBJECT_NAME, COUNT_READ, COUNT_WRITE, COUNT_FETCH, COUNT_INSERT, COUNT_UPDATE, COUNT_DELETE FROM performance_schema.table_io_waits_summary_by_table WHERE OBJECT_SCHEMA = DATABASE() ORDER BY (COUNT_READ + COUNT_WRITE) DESC; 
-- 查看索引使用统计 
SELECT OBJECT_SCHEMA, OBJECT_NAME, INDEX_NAME, COUNT_FETCH, COUNT_INSERT, COUNT_UPDATE, COUNT_DELETE FROM performance_schema.table_io_waits_summary_by_index_usage WHERE OBJECT_SCHEMA = DATABASE() AND INDEX_NAME IS NOT NULL ORDER BY COUNT_FETCH DESC; 
-- 查看未使用的索引 
SELECT OBJECT_SCHEMA, OBJECT_NAME, INDEX_NAME FROM performance_schema.table_io_waits_summary_by_index_usage WHERE OBJECT_SCHEMA = DATABASE() AND INDEX_NAME IS NOT NULL AND COUNT_STAR = 0 ORDER BY OBJECT_NAME; 
-- 查看语句统计 
SELECT DIGEST_TEXT, COUNT_STAR as execution_count, AVG_TIMER_WAIT / 1000000000 as avg_time_seconds, SUM_TIMER_WAIT / 1000000000 as total_time_seconds FROM performance_schema.events_statements_summary_by_digest WHERE SCHEMA_NAME = DATABASE() ORDER BY COUNT_STAR DESC LIMIT 10;
```
#### SYS 模式查询
```sql
-- 查看表和索引大小（需要 SYS 模式） 
SELECT table_schema, table_name, total_size, data_size, index_size FROM sys.schema_table_statistics WHERE table_schema = DATABASE() ORDER BY total_size DESC; 
-- 查看未使用的索引 
SELECT object_schema, object_name, index_name FROM sys.schema_unused_indexes WHERE object_schema = DATABASE(); 
-- 查看冗余索引 
SELECT table_schema, table_name, redundant_index_name, redundant_index_columns, dominant_index_name, dominant_index_columns FROM sys.schema_redundant_indexes WHERE table_schema = DATABASE(); 
-- 查看表访问统计 
SELECT table_schema, table_name, rows_fetched, rows_inserted, rows_updated, rows_deleted, io_read_requests, io_write_requests FROM sys.schema_table_statistics_with_buffer WHERE table_schema = DATABASE() ORDER BY (rows_fetched + rows_inserted + rows_updated + rows_deleted) DESC;
```
### 实用的元数据查询
#### 数据库健康检查
```sql
-- 数据库大小统计 
SELECT table_schema as database_name, COUNT(*) as table_count, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as total_size_mb, ROUND(SUM(data_length) / 1024 / 1024, 2) as data_size_mb, ROUND(SUM(index_length) / 1024 / 1024, 2) as index_size_mb FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') GROUP BY table_schema ORDER BY total_size_mb DESC; 
-- 查找没有主键的表 
SELECT t.TABLE_NAME FROM INFORMATION_SCHEMA.TABLES t LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON t.TABLE_SCHEMA = tc.TABLE_SCHEMA AND t.TABLE_NAME = tc.TABLE_NAME AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY' WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE' AND tc.CONSTRAINT_NAME IS NULL; 
-- 查找可能需要优化的表（数据大但索引少） 
SELECT t.TABLE_NAME, t.TABLE_ROWS, ROUND((t.DATA_LENGTH + t.INDEX_LENGTH) / 1024 / 1024, 2) as size_mb, COUNT(DISTINCT s.INDEX_NAME) as index_count, ROUND(t.INDEX_LENGTH / t.DATA_LENGTH * 100, 2) as index_ratio_percent FROM INFORMATION_SCHEMA.TABLES t LEFT JOIN INFORMATION_SCHEMA.STATISTICS s ON t.TABLE_SCHEMA = s.TABLE_SCHEMA AND t.TABLE_NAME = s.TABLE_NAME WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE' AND t.TABLE_ROWS > 1000 GROUP BY t.TABLE_NAME, t.TABLE_ROWS, t.DATA_LENGTH, t.INDEX_LENGTH HAVING index_count < 3 OR index_ratio_percent < 10 ORDER BY size_mb DESC;
```
#### 数据字典生成
```sql
-- 生成完整的数据字典 
SELECT t.TABLE_NAME as '表名', t.TABLE_COMMENT as '表说明', c.COLUMN_NAME as '字段名', c.COLUMN_TYPE as '数据类型', CASE WHEN c.IS_NULLABLE = 'YES' THEN '是' ELSE '否' END as '允许空值', IFNULL(c.COLUMN_DEFAULT, '') as '默认值', c.EXTRA as '额外信息', c.COLUMN_COMMENT as '字段说明', CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN '是' ELSE '' END as '主键', CASE WHEN uk.COLUMN_NAME IS NOT NULL THEN '是' ELSE '' END as '唯一键' FROM INFORMATION_SCHEMA.TABLES t JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME LEFT JOIN ( SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' ) pk ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA AND c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME LEFT JOIN ( SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA WHERE tc.CONSTRAINT_TYPE = 'UNIQUE' ) uk ON c.TABLE_SCHEMA = uk.TABLE_SCHEMA AND c.TABLE_NAME = uk.TABLE_NAME AND c.COLUMN_NAME = uk.COLUMN_NAME WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE' ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION;
```
#### 依赖关系分析
```sql
-- 查看表之间的外键依赖关系 
WITH RECURSIVE table_dependencies AS ( -- 基础查询：没有依赖的表 
SELECT TABLE_NAME, 0 as level, CAST(TABLE_NAME AS CHAR(1000)) as path FROM INFORMATION_SCHEMA.TABLES t WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND NOT EXISTS ( SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.TABLE_NAME = t.TABLE_NAME AND kcu.REFERENCED_TABLE_NAME IS NOT NULL ) UNION ALL 
-- 递归查询：有依赖的表 
SELECT kcu.TABLE_NAME, td.level + 1, CONCAT(td.path, ' -> ', kcu.TABLE_NAME) FROM table_dependencies td JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON td.TABLE_NAME = kcu.REFERENCED_TABLE_NAME AND kcu.TABLE_SCHEMA = DATABASE() WHERE td.level < 10 -- 防止无限递归 
AND FIND_IN_SET(kcu.TABLE_NAME, REPLACE(td.path, ' -> ', ',')) = 0 ) SELECT level as dependency_level, TABLE_NAME, path as dependency_path FROM table_dependencies ORDER BY level, TABLE_NAME; 
-- 简化版本：直接查看外键关系 
SELECT kcu.TABLE_NAME as child_table, kcu.COLUMN_NAME as child_column, kcu.REFERENCED_TABLE_NAME as parent_table, kcu.REFERENCED_COLUMN_NAME as parent_column, 'depends on' as relationship FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY kcu.REFERENCED_TABLE_NAME, kcu.TABLE_NAME;
```
### 元数据的实际应用
#### 自动化脚本示例
```sql
-- 生成备份脚本的元数据查询 
SELECT CONCAT( 'mysqldump -u username -p ', TABLE_SCHEMA, ' ', TABLE_NAME, ' > ', TABLE_NAME, '_backup.sql;' ) as backup_command FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME; 
-- 生成表结构比较脚本 
SELECT TABLE_NAME, CONCAT( 'SELECT "', TABLE_NAME, '" as table_name, ', 'COUNT(*) as column_count, ', 'GROUP_CONCAT(CONCAT(COLUMN_NAME, ":", DATA_TYPE) ORDER BY ORDINAL_POSITION) as structure ', 'FROM INFORMATION_SCHEMA.COLUMNS ', 'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "', TABLE_NAME, '";' ) as structure_query FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME; 
-- 生成索引分析报告 
SELECT TABLE_NAME, CONCAT( 'ANALYZE TABLE ', TABLE_NAME, '; ', 'SHOW INDEX FROM ', TABLE_NAME, ';' ) as analysis_command FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;
```
#### 监控和报警查询
```sql
-- 监控表大小增长 
SELECT TABLE_NAME, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as current_size_mb, UPDATE_TIME as last_updated, CASE WHEN (DATA_LENGTH + INDEX_LENGTH) > 100 * 1024 * 1024 THEN 'LARGE' WHEN (DATA_LENGTH + INDEX_LENGTH) > 50 * 1024 * 1024 THEN 'MEDIUM' ELSE 'SMALL' END as size_category FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC; 
-- 检查表的健康状况 
SELECT TABLE_NAME, ENGINE, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb, CASE WHEN UPDATE_TIME IS NULL THEN 'NO_UPDATES' WHEN UPDATE_TIME < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'STALE' WHEN UPDATE_TIME < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'OLD' ELSE 'RECENT' END as update_status, CASE WHEN TABLE_ROWS = 0 THEN 'EMPTY' WHEN TABLE_ROWS < 1000 THEN 'SMALL' WHEN TABLE_ROWS < 100000 THEN 'MEDIUM' ELSE 'LARGE' END as row_count_category FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY size_mb DESC;
```
### 最佳实践和注意事项
#### 最佳实践
- 定期查询元数据以监控数据库健康状况
- 使用元数据自动生成文档和报告
- 通过元数据分析优化数据库性能
- 建立基于元数据的监控和报警机制
- 使用元数据验证数据库结构的一致性
- 在数据迁移时利用元数据确保完整性
#### 注意事项
- INFORMATION_SCHEMA 查询可能对性能有影响
- 某些元数据信息可能不是实时更新的
- 不同 MySQL 版本的元数据结构可能有差异
- PERFORMANCE_SCHEMA 需要启用才能使用
- 元数据查询权限可能受到限制
- 大型数据库的元数据查询可能较慢

| 应用场景 | 推荐方法 | 注意事项 |
| --- | --- | --- |
| 结构分析 | INFORMATION_SCHEMA | 查询可能较慢 |
| 快速查看 | SHOW 语句 | 输出格式固定 |
| 性能监控 | PERFORMANCE_SCHEMA | 需要启用相关功能 |
| 自动化脚本 | 组合查询 | 考虑权限和性能 |
| 文档生成 | 格式化查询 | 定期更新 |
```sql
-- 清理示例对象 
DROP VIEW IF EXISTS employee_summary; 
DROP PROCEDURE IF EXISTS GetEmployeesByDepartment; 
SELECT 'Metadata tutorial completed. Example objects cleaned up.' AS message;
```

## MySQL 序列
### 序列概述
> 序列是数据库中用于生成唯一数值的对象。虽然 MySQL 没有像 Oracle 或 PostgreSQL 那样的独立序列对象，但提供了多种方式来实现序列功能，主要通过 AUTO_INCREMENT 属性和自定义序列表来实现。

- AUTO_INCREMENT
MySQL 内置的自动递增机制

- 序列表
自定义表实现的序列功能

- 存储过程序列
通过存储过程管理的序列

- 内存序列
基于内存表的高性能序列

#### 序列的应用场景
- 主键生成：为表生成唯一的主键值
- 订单号生成：创建唯一的业务编号
- 版本控制：为记录生成版本号
- 排序编号：为数据生成排序序号
- 分布式ID：在分布式系统中生成唯一标识
- 批次号生成：为批处理任务生成批次标识
### AUTO_INCREMENT 序列
#### 基本使用
```sql
-- 创建带有 AUTO_INCREMENT 的表 
CREATE TABLE users ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(50) NOT NULL, 
    email VARCHAR(100) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 
-- 插入数据，ID 自动生成 
INSERT INTO users (username, email) VALUES ('john_doe', 'john@example.com'), ('jane_smith', 'jane@example.com'), ('bob_wilson', 'bob@example.com'); 
-- 查看生成的 ID 
SELECT * FROM users; 
-- 获取最后插入的 ID 
SELECT LAST_INSERT_ID(); 
-- 查看当前 AUTO_INCREMENT 值 
SHOW TABLE STATUS LIKE 'users';
```
#### AUTO_INCREMENT 属性设置
```sql
-- 设置 AUTO_INCREMENT 起始值 
CREATE TABLE products ( 
    product_id INT AUTO_INCREMENT PRIMARY KEY, 
    product_name VARCHAR(100) NOT NULL, 
    price DECIMAL(10,2) 
) AUTO_INCREMENT = 1000; 
-- 修改现有表的 AUTO_INCREMENT 值 
ALTER TABLE products AUTO_INCREMENT = 2000; 
-- 查看 AUTO_INCREMENT 相关变量 
SHOW VARIABLES LIKE 'auto_increment%'; 
-- 设置 AUTO_INCREMENT 步长（全局） 
SET @@auto_increment_increment = 2; SET @@auto_increment_offset = 1; 
-- 设置 AUTO_INCREMENT 步长（会话） 
SET SESSION auto_increment_increment = 5; 
SET SESSION auto_increment_offset = 1; 
-- 插入数据测试步长 
INSERT INTO products (product_name, price) VALUES ('Product A', 99.99), ('Product B', 149.99), ('Product C', 199.99); SELECT * FROM products;
```
#### AUTO_INCREMENT 的限制和注意事项
```sql
-- 重置 AUTO_INCREMENT（危险操作） 
TRUNCATE TABLE products; -- 重置为初始值 -- 或者 
ALTER TABLE products AUTO_INCREMENT = 1; 
-- 手动插入指定 ID 
INSERT INTO users (id, username, email) VALUES (100, 'admin', 'admin@example.com'); 
-- 后续插入将从 101 开始 
INSERT INTO users (username, email) VALUES ('test_user', 'test@example.com'); 
-- 查看结果 
SELECT * FROM users ORDER BY id; 
-- 检查 AUTO_INCREMENT 当前值 
SELECT TABLE_NAME, AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND AUTO_INCREMENT IS NOT NULL;
```
#### AUTO_INCREMENT 注意事项
- 每个表只能有一个 AUTO_INCREMENT 列
- AUTO_INCREMENT 列必须是索引的一部分
- 删除记录不会重置 AUTO_INCREMENT 值
- 手动插入大值会影响后续自动生成的值
- 在主从复制环境中需要注意步长设置
- 达到数据类型最大值时会产生错误
### 自定义序列表
#### 创建序列表
```sql
-- 创建序列管理表 
CREATE TABLE sequences ( sequence_name VARCHAR(50) PRIMARY KEY, current_value BIGINT NOT NULL DEFAULT 0, increment_value INT NOT NULL DEFAULT 1, min_value BIGINT DEFAULT 1, max_value BIGINT DEFAULT 9223372036854775807, cycle_flag BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ); 
-- 初始化一些序列 
INSERT INTO sequences (sequence_name, current_value, increment_value) VALUES ('order_seq', 10000, 1), ('invoice_seq', 100000, 1), ('batch_seq', 1, 10), ('user_code_seq', 1000, 2); 
-- 查看序列状态 
SELECT * FROM sequences;
```
#### 序列操作函数
```sql
-- 创建获取下一个序列值的函数 
DELIMITER // 
CREATE FUNCTION NEXTVAL(seq_name VARCHAR(50)) RETURNS BIGINT READS SQL DATA DETERMINISTIC BEGIN DECLARE next_val BIGINT; DECLARE inc_val INT; DECLARE max_val BIGINT; DECLARE cycle_flag BOOLEAN; 
-- 获取序列信息并更新 
SELECT current_value + increment_value, increment_value, max_value, cycle_flag INTO next_val, inc_val, max_val, cycle_flag FROM sequences WHERE sequence_name = seq_name FOR UPDATE; 
-- 检查是否超过最大值 
IF next_val > max_val THEN IF cycle_flag THEN 
-- 循环模式，重置为最小值 
SELECT min_value INTO next_val FROM sequences WHERE sequence_name = seq_name; ELSE 
-- 非循环模式，抛出错误 
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sequence value exceeds maximum'; END IF; END IF; 
-- 更新序列值 
UPDATE sequences SET current_value = next_val, updated_at = CURRENT_TIMESTAMP WHERE sequence_name = seq_name; RETURN next_val; END 
// DELIMITER ; 
-- 创建获取当前序列值的函数 
DELIMITER // CREATE FUNCTION CURRVAL(seq_name VARCHAR(50)) RETURNS BIGINT READS SQL DATA DETERMINISTIC BEGIN DECLARE curr_val BIGINT; SELECT current_value INTO curr_val FROM sequences WHERE sequence_name = seq_name; RETURN curr_val; END // DELIMITER ; 
-- 创建设置序列值的存储过程 
DELIMITER // CREATE PROCEDURE SETVAL(IN seq_name VARCHAR(50), IN new_value BIGINT) BEGIN UPDATE sequences SET current_value = new_value, updated_at = CURRENT_TIMESTAMP WHERE sequence_name = seq_name; IF ROW_COUNT() = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sequence not found'; END IF; END // DELIMITER ;
```
#### 使用自定义序列
```sql
-- 使用序列生成订单号 
SELECT NEXTVAL('order_seq') as next_order_id; SELECT NEXTVAL('order_seq') as next_order_id; SELECT NEXTVAL('order_seq') as next_order_id; 
-- 查看当前序列值 
SELECT CURRVAL('order_seq') as current_order_id; 
-- 在表中使用序列 
CREATE TABLE orders ( order_id BIGINT PRIMARY KEY, customer_id INT NOT NULL, order_date DATE NOT NULL, total_amount DECIMAL(10,2) ); 
-- 插入数据时使用序列 
INSERT INTO orders (order_id, customer_id, order_date, total_amount) VALUES (NEXTVAL('order_seq'), 1, CURDATE(), 299.99), (NEXTVAL('order_seq'), 2, CURDATE(), 149.50), (NEXTVAL('order_seq'), 1, CURDATE(), 89.99); 
-- 查看结果 
SELECT * FROM orders; 
-- 设置序列值 
CALL SETVAL('order_seq', 20000); 
SELECT NEXTVAL('order_seq') as next_value; 
-- 查看所有序列的当前状态 
SELECT sequence_name, current_value, increment_value, CONCAT('Next value: ', current_value + increment_value) as next_value FROM sequences;
```
### 高级序列实现
#### 带格式的序列号生成
```sql
-- 创建格式化序列表 
CREATE TABLE formatted_sequences ( sequence_name VARCHAR(50) PRIMARY KEY, prefix VARCHAR(20) DEFAULT '', current_value BIGINT NOT NULL DEFAULT 0, increment_value INT NOT NULL DEFAULT 1, padding_length INT DEFAULT 6, suffix VARCHAR(20) DEFAULT '', reset_period ENUM('NONE', 'DAILY', 'MONTHLY', 'YEARLY') DEFAULT 'NONE', last_reset_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); 
-- 初始化格式化序列 
INSERT INTO formatted_sequences (sequence_name, prefix, current_value, padding_length, reset_period) VALUES ('invoice_num', 'INV', 0, 6, 'MONTHLY'), ('order_num', 'ORD', 0, 8, 'DAILY'), ('batch_num', 'BAT', 0, 4, 'NONE'); 
-- 创建格式化序列生成函数 
DELIMITER // CREATE FUNCTION NEXT_FORMATTED_VAL(seq_name VARCHAR(50)) RETURNS VARCHAR(100) READS SQL DATA DETERMINISTIC BEGIN DECLARE next_val BIGINT; DECLARE prefix_val VARCHAR(20); DECLARE suffix_val VARCHAR(20); DECLARE padding_len INT; DECLARE reset_period_val VARCHAR(10); DECLARE last_reset DATE; DECLARE should_reset BOOLEAN DEFAULT FALSE; DECLARE formatted_result VARCHAR(100); 
-- 获取序列配置 
SELECT prefix, current_value + increment_value, padding_length, suffix, reset_period, last_reset_date INTO prefix_val, next_val, padding_len, suffix_val, reset_period_val, last_reset FROM formatted_sequences WHERE sequence_name = seq_name FOR UPDATE; 
-- 检查是否需要重置 
CASE reset_period_val WHEN 'DAILY' THEN SET should_reset = (last_reset IS NULL OR last_reset < CURDATE()); WHEN 'MONTHLY' THEN SET should_reset = (last_reset IS NULL OR YEAR(last_reset) < YEAR(CURDATE()) OR MONTH(last_reset) < MONTH(CURDATE())); WHEN 'YEARLY' THEN SET should_reset = (last_reset IS NULL OR YEAR(last_reset) < YEAR(CURDATE())); ELSE SET should_reset = FALSE; END CASE; 
-- 如果需要重置，将值重置为1 
IF should_reset THEN SET next_val = 1; END IF; 
-- 更新序列值 
UPDATE formatted_sequences SET current_value = next_val, last_reset_date = CASE WHEN should_reset THEN CURDATE() ELSE last_reset_date END WHERE sequence_name = seq_name; 
-- 格式化结果 
SET formatted_result = CONCAT( IFNULL(prefix_val, ''), CASE WHEN reset_period_val = 'DAILY' THEN DATE_FORMAT(CURDATE(), '%Y%m%d') WHEN reset_period_val = 'MONTHLY' THEN DATE_FORMAT(CURDATE(), '%Y%m') WHEN reset_period_val = 'YEARLY' THEN DATE_FORMAT(CURDATE(), '%Y') ELSE '' END, LPAD(next_val, padding_len, '0'), IFNULL(suffix_val, '') ); RETURN formatted_result; END // DELIMITER ; 
-- 测试格式化序列 
SELECT NEXT_FORMATTED_VAL('invoice_num') as invoice_number; SELECT NEXT_FORMATTED_VAL('invoice_num') as invoice_number; SELECT NEXT_FORMATTED_VAL('order_num') as order_number; SELECT NEXT_FORMATTED_VAL('batch_num') as batch_number; 
-- 查看序列状态 
SELECT * FROM formatted_sequences;
```
#### 分布式序列实现
```sql
-- 创建分布式序列表 
CREATE TABLE distributed_sequences ( 
    sequence_name VARCHAR(50), 
    node_id INT, 
    current_value BIGINT NOT NULL DEFAULT 0, 
    step_size INT NOT NULL DEFAULT 1000, 
    max_value BIGINT NOT NULL, 
    last_allocated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    PRIMARY KEY (sequence_name, node_id) 
); 
-- 初始化分布式序列（假设有3个节点） 
INSERT INTO distributed_sequences (sequence_name, node_id, current_value, step_size, max_value) VALUES 
('global_id', 1, 1000, 1000, 1999), 
('global_id', 2, 2000, 1000, 2999), 
('global_id', 3, 3000, 1000, 3999); 
-- 创建分布式序列分配函数 
DELIMITER // CREATE FUNCTION ALLOC_DISTRIBUTED_RANGE(seq_name VARCHAR(50), node_id INT) RETURNS JSON READS SQL DATA DETERMINISTIC BEGIN DECLARE start_val BIGINT; DECLARE end_val BIGINT; DECLARE step_val INT; DECLARE result JSON; 
-- 获取当前范围并分配新范围 
SELECT max_value + 1, step_size INTO start_val, step_val FROM distributed_sequences WHERE sequence_name = seq_name AND node_id = node_id FOR UPDATE; SET end_val = start_val + step_val - 1; 
-- 更新分配的范围 
UPDATE distributed_sequences SET current_value = start_val, max_value = end_val, last_allocated = CURRENT_TIMESTAMP WHERE sequence_name = seq_name AND node_id = node_id; 
-- 返回分配的范围 
SET result = JSON_OBJECT( 'start_value', start_val, 'end_value', end_val, 'step_size', step_val ); RETURN result; END // DELIMITER ; 
-- 测试分布式序列分配 
SELECT ALLOC_DISTRIBUTED_RANGE('global_id', 1) as allocated_range; SELECT ALLOC_DISTRIBUTED_RANGE('global_id', 2) as allocated_range; 
-- 查看分配状态 
SELECT sequence_name, node_id, current_value, max_value, CONCAT(current_value, ' - ', max_value) as allocated_range, last_allocated FROM distributed_sequences ORDER BY sequence_name, node_id;
```
#### 内存表序列（高性能）
```sql
-- 创建内存表序列（重启后数据丢失） 
CREATE TABLE memory_sequences ( sequence_name VARCHAR(50) PRIMARY KEY, current_value BIGINT NOT NULL DEFAULT 0, increment_value INT NOT NULL DEFAULT 1 ) ENGINE=MEMORY; 
-- 初始化内存序列 
INSERT INTO memory_sequences (sequence_name, current_value, increment_value) VALUES ('session_id', 0, 1), ('temp_id', 1000, 1), ('cache_key', 0, 1); 
-- 创建内存序列函数 
DELIMITER // CREATE FUNCTION MEMORY_NEXTVAL(seq_name VARCHAR(50)) RETURNS BIGINT READS SQL DATA DETERMINISTIC BEGIN DECLARE next_val BIGINT; 
-- 原子性更新并获取新值 
UPDATE memory_sequences SET current_value = current_value + increment_value WHERE sequence_name = seq_name; 
-- 获取更新后的值 
SELECT current_value INTO next_val FROM memory_sequences WHERE sequence_name = seq_name; RETURN next_val; END // DELIMITER ; 
-- 测试内存序列性能 
SELECT MEMORY_NEXTVAL('session_id') as session_id; SELECT MEMORY_NEXTVAL('session_id') as session_id; SELECT MEMORY_NEXTVAL('temp_id') as temp_id; 
-- 批量测试（模拟高并发） 
SELECT MEMORY_NEXTVAL('cache_key') as id1, MEMORY_NEXTVAL('cache_key') as id2, MEMORY_NEXTVAL('cache_key') as id3; 
-- 查看内存序列状态 
SELECT * FROM memory_sequences;
```
### 序列性能优化
#### 批量序列分配
```sql
-- 创建批量序列分配存储过程 
DELIMITER // CREATE PROCEDURE ALLOC_SEQUENCE_BATCH( IN seq_name VARCHAR(50), IN batch_size INT, OUT start_value BIGINT, OUT end_value BIGINT ) BEGIN DECLARE current_val BIGINT; DECLARE inc_val INT; 
-- 获取当前值并分配批次 
SELECT current_value, increment_value INTO current_val, inc_val FROM sequences WHERE sequence_name = seq_name FOR UPDATE; SET start_value = current_val + inc_val; SET end_value = start_value + (batch_size * inc_val) - 1; 
-- 更新序列值 
UPDATE sequences SET current_value = end_value WHERE sequence_name = seq_name; END // DELIMITER ; 
-- 测试批量分配 
CALL ALLOC_SEQUENCE_BATCH('order_seq', 100, @start, @end); SELECT @start as batch_start, @end as batch_end; 
-- 应用程序可以在内存中使用这个范围 
SELECT @start + 0 as id1, @start + 1 as id2, @start + 2 as id3, '...' as more_ids, @end as last_id;
```
#### 序列缓存机制
```sql
-- 创建序列缓存表 
CREATE TABLE sequence_cache ( sequence_name VARCHAR(50) PRIMARY KEY, cache_size INT NOT NULL DEFAULT 100, cached_start BIGINT, cached_end BIGINT, current_cached BIGINT, last_refresh TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); 
-- 初始化缓存配置 
INSERT INTO sequence_cache (sequence_name, cache_size) VALUES ('fast_seq', 1000), ('medium_seq', 100), ('slow_seq', 10); 
-- 创建缓存序列函数 
DELIMITER // CREATE FUNCTION CACHED_NEXTVAL(seq_name VARCHAR(50)) RETURNS BIGINT READS SQL DATA DETERMINISTIC BEGIN DECLARE next_val BIGINT; DECLARE cache_start BIGINT; DECLARE cache_end BIGINT; DECLARE cache_current BIGINT; DECLARE cache_sz INT; DECLARE need_refresh BOOLEAN DEFAULT FALSE; 
-- 检查缓存状态 
SELECT cached_start, cached_end, current_cached, cache_size INTO cache_start, cache_end, cache_current, cache_sz FROM sequence_cache WHERE sequence_name = seq_name FOR UPDATE; 
-- 检查是否需要刷新缓存 
IF cache_current IS NULL OR cache_current >= cache_end THEN SET need_refresh = TRUE; END IF; 
-- 刷新缓存 
IF need_refresh THEN 
-- 从主序列表分配新的缓存范围 
CALL ALLOC_SEQUENCE_BATCH(seq_name, cache_sz, cache_start, cache_end); 
-- 更新缓存信息 
UPDATE sequence_cache SET cached_start = cache_start, cached_end = cache_end, current_cached = cache_start, last_refresh = CURRENT_TIMESTAMP WHERE sequence_name = seq_name; SET next_val = cache_start; ELSE 
-- 使用缓存中的下一个值 
SET next_val = cache_current + 1; 
-- 更新缓存当前值 
UPDATE sequence_cache SET current_cached = next_val WHERE sequence_name = seq_name; END IF; RETURN next_val; END // DELIMITER ; 
-- 测试缓存序列 
SELECT CACHED_NEXTVAL('fast_seq') as cached_id; SELECT CACHED_NEXTVAL('fast_seq') as cached_id; SELECT CACHED_NEXTVAL('fast_seq') as cached_id; 
-- 查看缓存状态 
SELECT sc.*, CONCAT(cached_start, ' - ', cached_end) as cached_range, (cached_end - current_cached) as remaining_cache FROM sequence_cache sc;
```
### 序列方案比较
|方案	|性能	|灵活性	|并发性	|持久性	|复杂度	|适用场景|
| ---|---|---|---|---|---|---|
|AUTO_INCREMENT	|很高	|低	|很好	|很好	|很低	|简单主键生成
|序列表	|中等	|很高	|中等	|很好	|中等	|业务编号生成
|格式化序列	|中等	|很高	|中等	|很好	|高	|复杂业务编号
|分布式序列	|高	|高	|很好	|很好	|很高	|分布式系统|
|内存序列	|很高	|中等	|很好	|差	|中等	|临时ID生成
|缓存序列	|很高	|高	|很好	|很好	|高	|高并发场景

### 序列监控和维护
#### 序列状态监控
```sql
-- 创建序列监控视图 
CREATE VIEW sequence_monitor AS SELECT s.sequence_name, s.current_value, s.increment_value, s.max_value, ROUND((s.current_value / s.max_value) * 100, 2) as usage_percentage, CASE WHEN s.current_value / s.max_value > 0.9 THEN 'CRITICAL' WHEN s.current_value / s.max_value > 0.8 THEN 'WARNING' WHEN s.current_value / s.max_value > 0.7 THEN 'CAUTION' ELSE 'NORMAL' END as status, s.updated_at as last_used FROM sequences s; 
-- 查看序列监控信息 
SELECT * FROM sequence_monitor ORDER BY usage_percentage DESC; 
-- 查找需要注意的序列 
SELECT * FROM sequence_monitor WHERE status IN ('WARNING', 'CRITICAL') ORDER BY usage_percentage DESC; 
-- 创建序列使用统计 
CREATE TABLE sequence_usage_log ( id INT AUTO_INCREMENT PRIMARY KEY, sequence_name VARCHAR(50), operation VARCHAR(20), old_value BIGINT, new_value BIGINT, operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_seq_time (sequence_name, operation_time) ); 
-- 创建序列使用记录触发器 
DELIMITER // CREATE TRIGGER sequence_usage_trigger AFTER UPDATE ON sequences FOR EACH ROW BEGIN IF OLD.current_value != NEW.current_value THEN INSERT INTO sequence_usage_log (sequence_name, operation, old_value, new_value) VALUES (NEW.sequence_name, 'UPDATE', OLD.current_value, NEW.current_value); END IF; END // DELIMITER ; 
-- 测试序列使用记录 
SELECT NEXTVAL('order_seq'); SELECT NEXTVAL('order_seq'); 
-- 查看使用记录 
SELECT * FROM sequence_usage_log ORDER BY operation_time DESC LIMIT 10;
```
#### 序列维护操作
```sql
-- 序列备份 
CREATE TABLE sequences_backup AS SELECT *, NOW() as backup_time FROM sequences; 
-- 序列恢复 
-- REPLACE INTO sequences 
-- SELECT sequence_name, current_value, increment_value, min_value, max_value, -- cycle_flag, created_at, updated_at -- FROM sequences_backup 
-- WHERE backup_time = '2024-01-01 12:00:00'; 
-- 序列重置（谨慎操作） 
DELIMITER // CREATE PROCEDURE RESET_SEQUENCE(IN seq_name VARCHAR(50), IN reset_value BIGINT) BEGIN DECLARE old_value BIGINT; 
-- 记录旧值 
SELECT current_value INTO old_value FROM sequences WHERE sequence_name = seq_name; 
-- 重置序列 
UPDATE sequences SET current_value = reset_value, updated_at = CURRENT_TIMESTAMP WHERE sequence_name = seq_name; 
-- 记录重置操作 
INSERT INTO sequence_usage_log (sequence_name, operation, old_value, new_value) VALUES (seq_name, 'RESET', old_value, reset_value); SELECT CONCAT('Sequence ', seq_name, ' reset from ', old_value, ' to ', reset_value) as result; END // DELIMITER ; 
-- 序列清理（删除未使用的序列） 
DELIMITER // CREATE PROCEDURE CLEANUP_UNUSED_SEQUENCES(IN days_threshold INT) BEGIN DECLARE done INT DEFAULT FALSE; DECLARE seq_name VARCHAR(50); DECLARE last_used TIMESTAMP; DECLARE cleanup_cursor CURSOR FOR SELECT sequence_name, updated_at FROM sequences WHERE updated_at < DATE_SUB(NOW(), INTERVAL days_threshold DAY); DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; CREATE TEMPORARY TABLE cleanup_report ( sequence_name VARCHAR(50), last_used TIMESTAMP, action VARCHAR(20) ); OPEN cleanup_cursor; cleanup_loop: LOOP FETCH cleanup_cursor INTO seq_name, last_used; IF done THEN LEAVE cleanup_loop; END IF; 
-- 记录清理信息 
INSERT INTO cleanup_report VALUES (seq_name, last_used, 'MARKED_FOR_CLEANUP'); 
-- 这里可以添加实际的删除逻辑 
DELETE FROM sequences WHERE sequence_name = seq_name; END LOOP; CLOSE cleanup_cursor; 
-- 显示清理报告 
SELECT * FROM cleanup_report; 
DROP TEMPORARY TABLE cleanup_report; END // DELIMITER ; 
-- 运行清理检查（不实际删除） 
CALL CLEANUP_UNUSED_SEQUENCES(30);
```
### 最佳实践和注意事项
#### 序列设计最佳实践
- 选择合适的数据类型：考虑序列的最大值需求
- 设置合理的步长：平衡性能和数值连续性
- 考虑并发性：在高并发场景下使用批量分配
- 实现监控机制：及时发现序列即将耗尽的情况
- 定期备份序列状态：防止数据丢失
- 文档化序列用途：便于维护和管理
#### 常见陷阱和注意事项
- AUTO_INCREMENT 在删除记录后不会回收ID
- 序列表需要考虑事务隔离级别的影响
- 内存表序列在服务器重启后会丢失
- 分布式序列需要处理节点故障的情况
- 格式化序列的重置逻辑要仔细测试
- 高并发下的序列竞争可能影响性能
- 序列达到最大值时的处理策略要提前规划
#### 场景选择建议
| 场景	| 推荐方案	| 关键考虑| 
| ---|---|---|
|简单主键	|AUTO_INCREMENT	|性能最优，使用简单
|业务编号	|自定义序列表	|灵活性和可控性
|高并发场景	|缓存序列	|减少数据库访问
|分布式系统	|分布式序列	|避免单点故障
|临时标识	|内存序列	|性能优先，可丢失
|复杂格式	|格式化序列	|业务规则复杂
```sql
-- 清理示例对象 
DROP VIEW IF EXISTS sequence_monitor; DROP TRIGGER IF EXISTS sequence_usage_trigger; DROP TABLE IF EXISTS sequence_usage_log; DROP TABLE IF EXISTS sequences_backup; DROP TABLE IF EXISTS sequence_cache; DROP TABLE IF EXISTS distributed_sequences; DROP TABLE IF EXISTS formatted_sequences; DROP TABLE IF EXISTS memory_sequences; DROP TABLE IF EXISTS sequences; DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS users; DROP FUNCTION IF EXISTS CACHED_NEXTVAL; DROP FUNCTION IF EXISTS ALLOC_DISTRIBUTED_RANGE; DROP FUNCTION IF EXISTS NEXT_FORMATTED_VAL; DROP FUNCTION IF EXISTS MEMORY_NEXTVAL; DROP FUNCTION IF EXISTS CURRVAL; DROP FUNCTION IF EXISTS NEXTVAL; DROP PROCEDURE IF EXISTS CLEANUP_UNUSED_SEQUENCES; DROP PROCEDURE IF EXISTS RESET_SEQUENCE; DROP PROCEDURE IF EXISTS ALLOC_SEQUENCE_BATCH; DROP PROCEDURE IF EXISTS SETVAL; SELECT 'Sequence tutorial completed. All example objects cleaned up.' AS message;
```

## MySQL 处理重复数据01
### 重复数据概述
> 重复数据是数据库中常见的问题，可能由于数据导入错误、应用程序逻辑缺陷、并发插入等原因产生。有效处理重复数据对于维护数据质量和系统性能至关重要。

- 识别重复
使用 GROUP BY 和聚合函数找出重复记录

- 防止重复
通过约束和索引预防重复数据产生

- 删除重复
使用各种技术删除已存在的重复记录

- 处理重复
在插入时智能处理重复数据

#### 重复数据的常见原因
- 数据导入时缺乏去重机制
- 应用程序的重复提交
- 并发操作导致的竞态条件
- 数据同步过程中的错误
- 缺乏适当的唯一性约束
- ETL 过程中的数据重复

### 识别重复数据
#### 准备示例数据
```sql
-- 创建示例表 
CREATE TABLE customers ( id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50), last_name VARCHAR(50), email VARCHAR(100), phone VARCHAR(20), city VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); 
-- 插入包含重复数据的示例 
INSERT INTO customers (first_name, last_name, email, phone, city) VALUES ('John', 'Doe', 'john.doe@email.com', '123-456-7890', 'New York'), ('Jane', 'Smith', 'jane.smith@email.com', '234-567-8901', 'Los Angeles'), ('John', 'Doe', 'john.doe@email.com', '123-456-7890', 'New York'), 
-- 完全重复 
('Jane', 'Smith', 'jane.smith@gmail.com', '234-567-8901', 'Los Angeles'), 
-- 邮箱不同 
('Bob', 'Johnson', 'bob.johnson@email.com', '345-678-9012', 'Chicago'), ('John', 'Doe', 'john.d@email.com', '123-456-7890', 'New York'), 
-- 邮箱不同 
('Alice', 'Brown', 'alice.brown@email.com', '456-789-0123', 'Houston'), ('Bob', 'Johnson', 'bob.johnson@email.com', '345-678-9012', 'Chicago'), 
-- 完全重复 
('Charlie', 'Wilson', 'charlie.wilson@email.com', '567-890-1234', 'Phoenix'), ('Alice', 'Brown', 'alice.b@email.com', '456-789-0123', 'Houston'); 
-- 邮箱不同 
-- 查看所有数据 
SELECT * FROM customers ORDER BY first_name, last_name;
```
#### 基本重复检测
```sql
-- 查找完全重复的记录（除了ID） SELECT first_name, last_name, email, phone, city, COUNT(*) as duplicate_count FROM customers GROUP BY first_name, last_name, email, phone, city HAVING COUNT(*) > 1 ORDER BY duplicate_count DESC; -- 查找基于姓名的重复 SELECT first_name, last_name, COUNT(*) as name_duplicates, GROUP_CONCAT(DISTINCT email ORDER BY email) as emails, GROUP_CONCAT(DISTINCT phone ORDER BY phone) as phones FROM customers GROUP BY first_name, last_name HAVING COUNT(*) > 1 ORDER BY name_duplicates DESC; -- 查找基于邮箱的重复 SELECT email, COUNT(*) as email_duplicates, GROUP_CONCAT(CONCAT(first_name, ' ', last_name) ORDER BY id) as names FROM customers GROUP BY email HAVING COUNT(*) > 1; -- 查找基于电话的重复 SELECT phone, COUNT(*) as phone_duplicates, GROUP_CONCAT(CONCAT(first_name, ' ', last_name) ORDER BY id) as names FROM customers GROUP BY phone HAVING COUNT(*) > 1;
```
#### 高级重复检测
```sql
-- 使用窗口函数标识重复记录 SELECT id, first_name, last_name, email, phone, ROW_NUMBER() OVER ( PARTITION BY first_name, last_name, email, phone, city ORDER BY id ) as row_num, COUNT(*) OVER ( PARTITION BY first_name, last_name, email, phone, city ) as total_duplicates FROM customers ORDER BY first_name, last_name, id; -- 查找除了最早记录外的所有重复记录 WITH duplicate_analysis AS ( SELECT id, first_name, last_name, email, phone, city, ROW_NUMBER() OVER ( PARTITION BY first_name, last_name, email, phone, city ORDER BY id ) as row_num FROM customers ) SELECT id, first_name, last_name, email, 'DUPLICATE' as status FROM duplicate_analysis WHERE row_num > 1 ORDER BY first_name, last_name; -- 模糊匹配检测（相似但不完全相同的记录） SELECT c1.id as id1, c2.id as id2, c1.first_name, c1.last_name, c1.email as email1, c2.email as email2, c1.phone, 'SIMILAR_RECORDS' as match_type FROM customers c1 JOIN customers c2 ON c1.id < c2.id WHERE c1.first_name = c2.first_name AND c1.last_name = c2.last_name AND c1.phone = c2.phone AND c1.email != c2.email -- 邮箱不同但其他信息相同 ORDER BY c1.first_name, c1.last_name;
```
#### 重复数据统计报告
```sql
-- 生成重复数据统计报告 SELECT 'Total Records' as metric, COUNT(*) as count FROM customers UNION ALL SELECT 'Unique Records (by name+email+phone)', COUNT(*) FROM ( SELECT DISTINCT first_name, last_name, email, phone, city FROM customers ) as unique_records UNION ALL SELECT 'Duplicate Records', COUNT(*) - ( SELECT COUNT(*) FROM ( SELECT DISTINCT first_name, last_name, email, phone, city FROM customers ) as unique_records ) FROM customers UNION ALL SELECT 'Duplicate Groups', COUNT(*) FROM ( SELECT first_name, last_name, email, phone, city FROM customers GROUP BY first_name, last_name, email, phone, city HAVING COUNT(*) > 1 ) as duplicate_groups; -- 按重复类型分类统计 SELECT 'Name Duplicates' as duplicate_type, COUNT(*) as groups, SUM(duplicate_count - 1) as extra_records FROM ( SELECT COUNT(*) as duplicate_count FROM customers GROUP BY first_name, last_name HAVING COUNT(*) > 1 ) as name_dups UNION ALL SELECT 'Email Duplicates', COUNT(*), SUM(duplicate_count - 1) FROM ( SELECT COUNT(*) as duplicate_count FROM customers GROUP BY email HAVING COUNT(*) > 1 ) as email_dups UNION ALL SELECT 'Phone Duplicates', COUNT(*), SUM(duplicate_count - 1) FROM ( SELECT COUNT(*) as duplicate_count FROM customers GROUP BY phone HAVING COUNT(*) > 1 ) as phone_dups;
```
### 防止重复数据
#### 使用唯一约束
```sql
-- 创建带有唯一约束的表 CREATE TABLE users_unique ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL UNIQUE, phone VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 复合唯一约束 UNIQUE KEY uk_phone_email (phone, email) ); -- 为现有表添加唯一约束 CREATE TABLE customers_clean AS SELECT DISTINCT first_name, last_name, email, phone, city FROM customers; ALTER TABLE customers_clean ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST; ALTER TABLE customers_clean ADD UNIQUE KEY uk_email (email); ALTER TABLE customers_clean ADD UNIQUE KEY uk_phone (phone); ALTER TABLE customers_clean ADD UNIQUE KEY uk_name_phone (first_name, last_name, phone); -- 测试唯一约束 INSERT INTO users_unique (username, email, phone) VALUES ('john_doe', 'john@example.com', '123-456-7890'); -- 这将失败，因为邮箱重复 -- INSERT INTO users_unique (username, email, phone) VALUES -- ('jane_doe', 'john@example.com', '234-567-8901'); -- 查看约束信息 SELECT CONSTRAINT_NAME, COLUMN_NAME, CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users_unique' AND CONSTRAINT_NAME != 'PRIMARY' ORDER BY CONSTRAINT_NAME;
```
#### 使用 INSERT IGNORE
```sql
-- INSERT IGNORE 会忽略重复键错误 INSERT IGNORE INTO users_unique (username, email, phone) VALUES ('john_doe2', 'john@example.com', '123-456-7890'), -- 邮箱重复，会被忽略 ('jane_smith', 'jane@example.com', '234-567-8901'), -- 新记录，会插入 ('bob_wilson', 'john@example.com', '345-678-9012'); -- 邮箱重复，会被忽略 -- 查看结果 SELECT * FROM users_unique; -- 查看受影响的行数 SELECT ROW_COUNT() as affected_rows; -- 批量插入时使用 INSERT IGNORE INSERT IGNORE INTO customers_clean (first_name, last_name, email, phone, city) SELECT first_name, last_name, email, phone, city FROM customers; -- 查看插入结果 SELECT COUNT(*) as total_inserted FROM customers_clean;
```
#### 使用 ON DUPLICATE KEY UPDATE
```sql
-- 创建带有更新时间的表 CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, product_code VARCHAR(50) UNIQUE, product_name VARCHAR(100), price DECIMAL(10,2), stock_quantity INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ); -- 使用 ON DUPLICATE KEY UPDATE INSERT INTO products (product_code, product_name, price, stock_quantity) VALUES ('PROD001', 'Product A', 99.99, 100), ('PROD002', 'Product B', 149.99, 50), ('PROD003', 'Product C', 199.99, 25) ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), price = VALUES(price), stock_quantity = stock_quantity + VALUES(stock_quantity), updated_at = CURRENT_TIMESTAMP; -- 再次插入相同的产品代码（会更新而不是插入） INSERT INTO products (product_code, product_name, price, stock_quantity) VALUES ('PROD001', 'Updated Product A', 109.99, 50), ('PROD004', 'Product D', 79.99, 75) ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), price = VALUES(price), stock_quantity = stock_quantity + VALUES(stock_quantity), updated_at = CURRENT_TIMESTAMP; -- 查看结果 SELECT * FROM products ORDER BY product_code; -- 更复杂的 ON DUPLICATE KEY UPDATE 示例 INSERT INTO products (product_code, product_name, price, stock_quantity) VALUES ('PROD001', 'Product A v2', 119.99, 25) ON DUPLICATE KEY UPDATE product_name = CASE WHEN VALUES(price) > price THEN VALUES(product_name) ELSE product_name END, price = GREATEST(price, VALUES(price)), stock_quantity = stock_quantity + VALUES(stock_quantity), updated_at = CURRENT_TIMESTAMP;
```
#### 使用 REPLACE INTO
```sql
-- REPLACE INTO 会删除重复记录然后插入新记录 REPLACE INTO products (product_code, product_name, price, stock_quantity) VALUES ('PROD001', 'Replaced Product A', 129.99, 200), ('PROD005', 'Product E', 59.99, 150); -- 查看结果（注意 PROD001 的 ID 可能会改变） SELECT * FROM products ORDER BY product_code; -- 批量 REPLACE CREATE TEMPORARY TABLE temp_products ( product_code VARCHAR(50), product_name VARCHAR(100), price DECIMAL(10,2), stock_quantity INT ); INSERT INTO temp_products VALUES ('PROD001', 'Final Product A', 139.99, 300), ('PROD002', 'Final Product B', 159.99, 100), ('PROD006', 'Product F', 89.99, 80); REPLACE INTO products (product_code, product_name, price, stock_quantity) SELECT product_code, product_name, price, stock_quantity FROM temp_products; -- 查看最终结果 SELECT * FROM products ORDER BY product_code;
```
### 删除重复数据
#### 使用自连接删除重复
```sql
-- 创建包含重复数据的测试表 CREATE TABLE test_duplicates AS SELECT * FROM customers; -- 查看重复数据 SELECT first_name, last_name, email, phone, city, COUNT(*) as count FROM test_duplicates GROUP BY first_name, last_name, email, phone, city HAVING COUNT(*) > 1; -- 方法1：使用自连接删除重复（保留ID最小的记录） DELETE t1 FROM test_duplicates t1 INNER JOIN test_duplicates t2 WHERE t1.id > t2.id AND t1.first_name = t2.first_name AND t1.last_name = t2.last_name AND t1.email = t2.email AND t1.phone = t2.phone AND t1.city = t2.city; -- 查看删除结果 SELECT COUNT(*) as remaining_records FROM test_duplicates; SELECT * FROM test_duplicates ORDER BY first_name, last_name;
```
#### 使用窗口函数删除重复
```sql
-- 重新创建测试数据 DROP TABLE test_duplicates; CREATE TABLE test_duplicates AS SELECT * FROM customers; 
-- 方法2：使用窗口函数和临时表 CREATE TEMPORARY TABLE temp_keep_ids AS SELECT id FROM ( SELECT id, ROW_NUMBER() OVER ( PARTITION BY first_name, last_name, email, phone, city ORDER BY id ) as row_num FROM test_duplicates ) ranked WHERE row_num = 1; -- 删除不在保留列表中的记录 DELETE FROM test_duplicates WHERE id NOT IN (SELECT id FROM temp_keep_ids); -- 查看结果 SELECT COUNT(*) as remaining_records FROM test_duplicates; -- 验证没有重复 SELECT first_name, last_name, email, phone, city, COUNT(*) as count FROM test_duplicates GROUP BY first_name, last_name, email, phone, city HAVING COUNT(*) > 1;
```
#### 使用 GROUP BY 重建表
```sql
-- 方法3：重建表（最安全的方法） -- 备份原表 CREATE TABLE customers_backup AS SELECT * FROM customers; -- 创建去重后的新表 CREATE TABLE customers_dedup AS SELECT MIN(id) as id, -- 保留最小的ID first_name, last_name, email, phone, city, MIN(created_at) as created_at -- 保留最早的创建时间 FROM customers GROUP BY first_name, last_name, email, phone, city; -- 查看去重结果 SELECT COUNT(*) as original_count FROM customers; SELECT COUNT(*) as dedup_count FROM customers_dedup; SELECT * FROM customers_dedup ORDER BY first_name, last_name; -- 如果满意结果，可以替换原表 -- RENAME TABLE customers TO customers_old, customers_dedup TO customers;
```
#### 条件性删除重复
```sql
-- 创建更复杂的重复场景 CREATE TABLE orders_with_duplicates ( id INT AUTO_INCREMENT PRIMARY KEY, order_number VARCHAR(50), customer_id INT, order_date DATE, amount DECIMAL(10,2), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); INSERT INTO orders_with_duplicates (order_number, customer_id, order_date, amount, status) VALUES ('ORD001', 1, '2024-01-15', 299.99, 'completed'), ('ORD001', 1, '2024-01-15', 299.99, 'pending'), -- 重复但状态不同 ('ORD002', 2, '2024-01-16', 149.50, 'completed'), ('ORD003', 3, '2024-01-17', 89.99, 'completed'), ('ORD003', 3, '2024-01-17', 89.99, 'completed'), -- 完全重复 ('ORD004', 1, '2024-01-18', 199.99, 'cancelled'), ('ORD004', 1, '2024-01-18', 199.99, 'completed'); -- 重复但状态不同 -- 删除重复订单，优先保留已完成的订单 DELETE o1 FROM orders_with_duplicates o1 INNER JOIN orders_with_duplicates o2 WHERE o1.id > o2.id AND o1.order_number = o2.order_number AND o1.customer_id = o2.customer_id AND o1.order_date = o2.order_date AND o1.amount = o2.amount AND ( o1.status = o2.status -- 完全重复 OR (o1.status != 'completed' AND o2.status = 'completed') -- 保留completed状态 ); -- 查看结果 SELECT * FROM orders_with_duplicates ORDER BY order_number; -- 更复杂的条件删除：保留最新的记录 DELETE o1 FROM orders_with_duplicates o1 INNER JOIN ( SELECT order_number, customer_id, order_date, amount, MAX(created_at) as latest_created FROM orders_with_duplicates GROUP BY order_number, customer_id, order_date, amount HAVING COUNT(*) > 1 ) o2 ON o1.order_number = o2.order_number AND o1.customer_id = o2.customer_id AND o1.order_date = o2.order_date AND o1.amount = o2.amount AND o1.created_at < o2.latest_created; -- 最终结果 SELECT * FROM orders_with_duplicates ORDER BY order_number;
```
### 高级重复处理技术
#### 模糊匹配去重
```sql
-- 创建包含相似数据的表 CREATE TABLE contacts ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), phone VARCHAR(20), company VARCHAR(100) ); INSERT INTO contacts (name, email, phone, company) VALUES ('John Smith', 'john.smith@company.com', '123-456-7890', 'ABC Corp'), ('J. Smith', 'j.smith@company.com', '123-456-7890', 'ABC Corporation'), ('John A. Smith', 'john.smith@company.com', '(123) 456-7890', 'ABC Corp'), ('Jane Doe', 'jane.doe@email.com', '234-567-8901', 'XYZ Inc'), ('Jane M. Doe', 'jane.doe@email.com', '234.567.8901', 'XYZ Inc.'); -- 使用 SOUNDEX 进行音似匹配 SELECT c1.id as id1, c1.name as name1, c2.id as id2, c2.name as name2, c1.phone, SOUNDEX(c1.name) as soundex1, SOUNDEX(c2.name) as soundex2 FROM contacts c1 JOIN contacts c2 ON c1.id < c2.id WHERE SOUNDEX(c1.name) = SOUNDEX(c2.name) OR (c1.phone = c2.phone AND c1.phone IS NOT NULL); -- 标准化电话号码进行比较 SELECT id, name, phone, REGEXP_REPLACE(phone, '[^0-9]', '') as normalized_phone FROM contacts; -- 基于标准化电话号码查找重复 WITH normalized_contacts AS ( SELECT id, name, email, phone, REGEXP_REPLACE(phone, '[^0-9]', '') as clean_phone, company FROM contacts ) SELECT c1.id, c1.name, c1.email, c1.phone, c1.company, 'DUPLICATE_PHONE' as match_reason FROM normalized_contacts c1 JOIN normalized_contacts c2 ON c1.id > c2.id WHERE c1.clean_phone = c2.clean_phone AND c1.clean_phone != '';
```
#### 批量去重处理
```sql
-- 创建批量去重存储过程 DELIMITER // CREATE PROCEDURE DeduplicateTable( IN table_name VARCHAR(64), IN key_columns TEXT, IN keep_criteria VARCHAR(255) ) BEGIN DECLARE sql_stmt TEXT; DECLARE backup_table VARCHAR(64); -- 创建备份表名 SET backup_table = CONCAT(table_name, '_backup_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s')); -- 备份原表 SET sql_stmt = CONCAT('CREATE TABLE ', backup_table, ' AS SELECT * FROM ', table_name); SET @sql = sql_stmt; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; -- 执行去重 SET sql_stmt = CONCAT( 'DELETE t1 FROM ', table_name, ' t1 ', 'INNER JOIN ', table_name, ' t2 ', 'WHERE t1.id > t2.id ', 'AND (', key_columns, ') ', IFNULL(CONCAT('AND ', keep_criteria), '') ); SET @sql = sql_stmt; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; -- 返回结果 SELECT table_name as processed_table, backup_table as backup_created, ROW_COUNT() as records_removed; END // DELIMITER ; -- 使用存储过程进行去重 -- CALL DeduplicateTable( -- 'customers', -- 't1.first_name = t2.first_name AND t1.last_name = t2.last_name AND t1.email = t2.email', -- NULL -- ); -- 创建去重报告函数 DELIMITER // CREATE FUNCTION GenerateDeduplicationReport(table_name VARCHAR(64)) RETURNS JSON READS SQL DATA DETERMINISTIC BEGIN DECLARE total_records INT; DECLARE unique_records INT; DECLARE duplicate_records INT; DECLARE report JSON; -- 这里简化处理，实际应用中需要动态构建SQL SELECT COUNT(*) INTO total_records FROM customers; SELECT COUNT(*) INTO unique_records FROM ( SELECT DISTINCT first_name, last_name, email, phone, city FROM customers ) as unique_data; SET duplicate_records = total_records - unique_records; SET report = JSON_OBJECT( 'table_name', table_name, 'total_records', total_records, 'unique_records', unique_records, 'duplicate_records', duplicate_records, 'duplication_rate', ROUND((duplicate_records / total_records) * 100, 2), 'analysis_date', NOW() ); RETURN report; END // DELIMITER ; -- 生成去重报告 SELECT GenerateDeduplicationReport('customers') as deduplication_report;
```
#### 实时重复检测
```sql
-- 创建重复检测日志表 CREATE TABLE duplicate_detection_log ( id INT AUTO_INCREMENT PRIMARY KEY, table_name VARCHAR(64), record_id INT, duplicate_type VARCHAR(50), duplicate_details JSON, detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved BOOLEAN DEFAULT FALSE ); -- 创建重复检测触发器 DELIMITER // CREATE TRIGGER check_customer_duplicates AFTER INSERT ON customers FOR EACH ROW BEGIN DECLARE duplicate_count INT; DECLARE duplicate_ids TEXT; -- 检查邮箱重复 SELECT COUNT(*), GROUP_CONCAT(id) INTO duplicate_count, duplicate_ids FROM customers WHERE email = NEW.email AND id != NEW.id; IF duplicate_count > 0 THEN INSERT INTO duplicate_detection_log (table_name, record_id, duplicate_type, duplicate_details) VALUES ( 'customers', NEW.id, 'EMAIL_DUPLICATE', JSON_OBJECT( 'email', NEW.email, 'duplicate_ids', duplicate_ids, 'duplicate_count', duplicate_count ) ); END IF; -- 检查电话重复 SELECT COUNT(*), GROUP_CONCAT(id) INTO duplicate_count, duplicate_ids FROM customers WHERE phone = NEW.phone AND id != NEW.id AND phone IS NOT NULL; IF duplicate_count > 0 THEN INSERT INTO duplicate_detection_log (table_name, record_id, duplicate_type, duplicate_details) VALUES ( 'customers', NEW.id, 'PHONE_DUPLICATE', JSON_OBJECT( 'phone', NEW.phone, 'duplicate_ids', duplicate_ids, 'duplicate_count', duplicate_count ) ); END IF; END // DELIMITER ; -- 测试实时检测 INSERT INTO customers (first_name, last_name, email, phone, city) VALUES ('Test', 'User', 'john.doe@email.com', '999-888-7777', 'Test City'); -- 查看检测日志 SELECT id, table_name, record_id, duplicate_type, JSON_PRETTY(duplicate_details) as details, detected_at FROM duplicate_detection_log ORDER BY detected_at DESC;
```
### 重复处理策略比较
|方法	|性能	|安全性	|灵活性	|复杂度	|适用场景
| --- | --- | --- | --- | --- | --- |
|唯一约束	|很高	|很高	|低	|很低	|预防重复，简单场景
|INSERT IGNORE	|高	|中等	|中等	|低	|批量导入，忽略重复
|ON DUPLICATE KEY UPDATE	|高	|高	|很高	|中等	|更新重复记录
|REPLACE INTO	|高	|中等	|中等	|低	|完全替换重复记录
|自连接删除	|中等	|低|	高|	中等	|清理现有重复
|窗口函数删除	|中等	|中等	|很高	|高	|复杂去重逻辑
|重建表	|低	|很高	|很高	|中等	|大量重复数据

### 最佳实践和注意事项
#### 重复数据处理最佳实践
- 预防优于治疗：设计阶段就考虑唯一性约束
- 定期监控：建立重复数据检测机制
- 备份先行：删除重复数据前必须备份
- 分步处理：大量数据分批处理避免锁表
- 测试验证：在测试环境验证去重逻辑
- 文档记录：记录去重规则和决策依据  
#### 注意事项和风险
- 删除操作不可逆，务必先备份数据
- 大表去重可能导致长时间锁表
- 外键约束可能阻止重复记录删除
- 自连接删除在大表上性能较差
- 模糊匹配可能误删有效数据
- 并发环境下需要考虑事务隔离
- 触发器可能影响插入性能
  
|数据量	|推荐方法	|注意事项
| --- | --- | --- |
小表 (<1万)	|自连接删除	|简单直接
中表 (1-100万)	|窗口函数 + 分批	|控制批次大小
大表 (>100万)	|重建表	|离线处理
实时系统	|唯一约束 + 触发器	|性能监控
批量导入	|INSERT IGNORE	|数据验证
```sql
-- 清理示例对象 
DROP TRIGGER IF EXISTS check_customer_duplicates; DROP TABLE IF EXISTS duplicate_detection_log; DROP TABLE IF EXISTS contacts; DROP TABLE IF EXISTS orders_with_duplicates; DROP TABLE IF EXISTS customers_dedup; DROP TABLE IF EXISTS customers_backup; DROP TABLE IF EXISTS test_duplicates; DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS customers_clean; DROP TABLE IF EXISTS users_unique; DROP TABLE IF EXISTS customers; DROP FUNCTION IF EXISTS GenerateDeduplicationReport; DROP PROCEDURE IF EXISTS DeduplicateTable; SELECT 'Duplicate handling tutorial completed. All example objects cleaned up.' AS message;
```

## MySQL 处理重复数据02
### 准备测试环境
```sql
-- 创建测试数据库 CREATE DATABASE duplicate_demo; USE duplicate_demo; -- 创建用户表（包含重复数据） CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), phone VARCHAR(20), city VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 插入测试数据（包含重复） INSERT INTO users (username, email, phone, city) VALUES ('alice', 'alice@example.com', '13800138001', 'Beijing'), ('bob', 'bob@example.com', '13800138002', 'Shanghai'), ('alice', 'alice@example.com', '13800138001', 'Beijing'), -- 完全重复 ('charlie', 'charlie@example.com', '13800138003', 'Guangzhou'), ('bob', 'bob@gmail.com', '13800138002', 'Shanghai'), -- 部分重复 ('diana', 'diana@example.com', '13800138004', 'Shenzhen'), ('alice', 'alice@hotmail.com', '13800138005', 'Beijing'), -- 用户名重复 ('eve', 'eve@example.com', '13800138006', 'Hangzhou'), ('charlie', 'charlie@example.com', '13800138007', 'Guangzhou'), -- 邮箱重复 ('frank', 'frank@example.com', '13800138002', 'Tianjin'); -- 手机号重复 -- 创建订单表（用于演示关联表的重复处理） CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, order_number VARCHAR(50), product_name VARCHAR(100), quantity INT, price DECIMAL(10,2), order_date DATE, FOREIGN KEY (user_id) REFERENCES users(id) ); -- 插入订单数据（包含重复） INSERT INTO orders (user_id, order_number, product_name, quantity, price, order_date) VALUES (1, 'ORD001', 'iPhone 15', 1, 7999.00, '2024-01-15'), (2, 'ORD002', 'MacBook Pro', 1, 15999.00, '2024-01-16'), (1, 'ORD001', 'iPhone 15', 1, 7999.00, '2024-01-15'), -- 重复订单 (3, 'ORD003', 'iPad Air', 1, 4999.00, '2024-01-17'), (2, 'ORD004', 'AirPods Pro', 2, 1899.00, '2024-01-18'), (1, 'ORD001', 'iPhone 15', 1, 7999.00, '2024-01-15'); -- 再次重复 SELECT 'Test data created successfully' AS message;
```
### 识别重复数据
#### 基本重复检测
```sql
-- 1. 查找完全重复的记录（除了主键） 
SELECT username, email, phone, city, COUNT(*) as duplicate_count FROM users GROUP BY username, email, phone, city HAVING COUNT(*) > 1; 
-- 2. 查找特定字段的重复 
-- 查找重复的用户名 
SELECT username, COUNT(*) as count FROM users GROUP BY username HAVING COUNT(*) > 1; 
-- 查找重复的邮箱 
SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1; 
-- 查找重复的手机号 
SELECT phone, COUNT(*) as count FROM users GROUP BY phone HAVING COUNT(*) > 1; 
-- 3. 显示重复记录的详细信息 
SELECT u1.* FROM users u1 INNER JOIN ( SELECT username, email, phone, city FROM users GROUP BY username, email, phone, city HAVING COUNT(*) > 1 ) u2 ON u1.username = u2.username AND u1.email = u2.email AND u1.phone = u2.phone AND u1.city = u2.city ORDER BY u1.username, u1.id; 
-- 4. 使用窗口函数检测重复 
SELECT id, username, email, phone, city, ROW_NUMBER() OVER ( PARTITION BY username, email, phone, city ORDER BY id ) as row_num FROM users HAVING row_num > 1;
```
#### 高级重复检测
```sql
-- 1. 模糊重复检测（相似但不完全相同） -- 检测用户名相似的记录 SELECT u1.id, u1.username, u2.id, u2.username FROM users u1 JOIN users u2 ON u1.id < u2.id WHERE SOUNDEX(u1.username) = SOUNDEX(u2.username) OR LEVENSHTEIN(u1.username, u2.username) <= 2; -- 2. 基于多个条件的复杂重复检测 SELECT u1.*, u2.id as duplicate_id, CASE WHEN u1.username = u2.username AND u1.email = u2.email THEN 'Exact Match' WHEN u1.username = u2.username THEN 'Username Match' WHEN u1.email = u2.email THEN 'Email Match' WHEN u1.phone = u2.phone THEN 'Phone Match' END as match_type FROM users u1 JOIN users u2 ON u1.id < u2.id WHERE (u1.username = u2.username OR u1.email = u2.email OR u1.phone = u2.phone) ORDER BY u1.id; -- 3. 统计重复数据报告 SELECT 'Total Records' as metric, COUNT(*) as count FROM users UNION ALL SELECT 'Unique Records (by username, email, phone, city)' as metric, COUNT(DISTINCT CONCAT(username, email, phone, city)) as count FROM users UNION ALL SELECT 'Duplicate Records' as metric, COUNT(*) - COUNT(DISTINCT CONCAT(username, email, phone, city)) as count FROM users UNION ALL SELECT 'Duplicate Username Count' as metric, COUNT(*) - COUNT(DISTINCT username) as count FROM users UNION ALL SELECT 'Duplicate Email Count' as metric, COUNT(*) - COUNT(DISTINCT email) as count FROM users; -- 4. 创建重复数据检测视图 CREATE VIEW duplicate_users AS SELECT id, username, email, phone, city, created_at, ROW_NUMBER() OVER ( PARTITION BY username, email, phone, city ORDER BY id ) as duplicate_rank, COUNT(*) OVER ( PARTITION BY username, email, phone, city ) as duplicate_count FROM users; -- 查询重复数据 SELECT * FROM duplicate_users WHERE duplicate_count > 1;
```
### 防止重复数据
#### 使用唯一约束
```sql
-- 1. 创建带唯一约束的表 CREATE TABLE users_unique ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL UNIQUE, phone VARCHAR(20) UNIQUE, city VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 复合唯一约束 UNIQUE KEY uk_username_email (username, email), UNIQUE KEY uk_phone_city (phone, city) ); -- 2. 为现有表添加唯一约束 -- 首先清理重复数据，然后添加约束 ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email); ALTER TABLE users ADD CONSTRAINT uk_users_phone UNIQUE (phone); ALTER TABLE users ADD CONSTRAINT uk_users_username_city UNIQUE (username, city); -- 3. 创建唯一索引 CREATE UNIQUE INDEX idx_users_email ON users (email); CREATE UNIQUE INDEX idx_users_username_phone ON users (username, phone); -- 4. 测试唯一约束 -- 这些插入会失败 -- INSERT INTO users_unique (username, email, phone, city) -- VALUES ('alice', 'alice@example.com', '13800138001', 'Beijing');
```
#### 使用 INSERT IGNORE 和 ON DUPLICATE KEY UPDATE
```sql
-- 1. INSERT IGNORE - 忽略重复数据 INSERT IGNORE INTO users_unique (username, email, phone, city) VALUES ('alice', 'alice@example.com', '13800138001', 'Beijing'), ('bob', 'bob@example.com', '13800138002', 'Shanghai'), ('alice', 'alice@example.com', '13800138001', 'Beijing'); -- 会被忽略 -- 2. ON DUPLICATE KEY UPDATE - 更新重复数据 INSERT INTO users_unique (username, email, phone, city) VALUES ('alice', 'alice@example.com', '13800138001', 'Beijing') ON DUPLICATE KEY UPDATE city = VALUES(city), created_at = CURRENT_TIMESTAMP; -- 3. 批量插入时处理重复 INSERT INTO users_unique (username, email, phone, city) VALUES ('charlie', 'charlie@example.com', '13800138003', 'Guangzhou'), ('diana', 'diana@example.com', '13800138004', 'Shenzhen'), ('alice', 'alice@newmail.com', '13800138005', 'Beijing') -- 用户名重复 ON DUPLICATE KEY UPDATE email = VALUES(email), phone = VALUES(phone), city = VALUES(city); -- 4. REPLACE INTO - 替换重复数据 REPLACE INTO users_unique (username, email, phone, city) VALUES ('alice', 'alice@updated.com', '13800138001', 'Beijing'); -- 5. 使用子查询避免重复 INSERT INTO users_unique (username, email, phone, city) SELECT 'new_user', 'new@example.com', '13800138999', 'Chengdu' WHERE NOT EXISTS ( SELECT 1 FROM users_unique WHERE username = 'new_user' OR email = 'new@example.com' );
```
### 删除重复数据
#### 使用自连接删除重复
```sql
-- 1. 删除完全重复的记录，保留 ID 最小的 DELETE u1 FROM users u1 INNER JOIN users u2 WHERE u1.id > u2.id AND u1.username = u2.username AND u1.email = u2.email AND u1.phone = u2.phone AND u1.city = u2.city; -- 2. 删除特定字段重复的记录 -- 删除邮箱重复的记录，保留最早的 DELETE u1 FROM users u1 INNER JOIN users u2 WHERE u1.id > u2.id AND u1.email = u2.email; -- 3. 删除用户名重复的记录，保留最新的 DELETE u1 FROM users u1 INNER JOIN users u2 WHERE u1.id < u2.id AND u1.username = u2.username; -- 4. 安全删除（先备份） -- 创建备份表 CREATE TABLE users_backup AS SELECT * FROM users; -- 删除重复数据 DELETE u1 FROM users u1 INNER JOIN users u2 WHERE u1.id > u2.id AND u1.username = u2.username AND u1.email = u2.email; -- 验证删除结果 SELECT COUNT(*) as remaining_records FROM users; SELECT username, email, COUNT(*) as count FROM users GROUP BY username, email HAVING COUNT(*) > 1;
```
#### 使用窗口函数删除重复
```sql
-- 1. 使用 ROW_NUMBER() 删除重复 -- 创建临时表标记重复记录 CREATE TEMPORARY TABLE temp_duplicates AS SELECT id, ROW_NUMBER() OVER ( PARTITION BY username, email, phone, city ORDER BY id ) as row_num FROM users; -- 删除重复记录（保留第一条） DELETE u FROM users u INNER JOIN temp_duplicates t ON u.id = t.id WHERE t.row_num > 1; -- 2. 一步完成的删除（MySQL 8.0+） DELETE FROM users WHERE id NOT IN ( SELECT id FROM ( SELECT id, ROW_NUMBER() OVER ( PARTITION BY username, email, phone, city ORDER BY id ) as row_num FROM users ) ranked WHERE row_num = 1 ); -- 3. 使用 CTE 删除重复（MySQL 8.0+） WITH duplicate_cte AS ( SELECT id, ROW_NUMBER() OVER ( PARTITION BY username, email ORDER BY created_at DESC ) as row_num FROM users ) DELETE u FROM users u INNER JOIN duplicate_cte d ON u.id = d.id WHERE d.row_num > 1;
```
#### 重建表方式删除重复
```sql
-- 1. 创建去重后的新表 CREATE TABLE users_clean AS SELECT MIN(id) as id, username, email, phone, city, MIN(created_at) as created_at FROM users GROUP BY username, email, phone, city; -- 2. 重新设置主键 ALTER TABLE users_clean ADD PRIMARY KEY (id); ALTER TABLE users_clean MODIFY id INT AUTO_INCREMENT; -- 3. 替换原表 DROP TABLE users; RENAME TABLE users_clean TO users; -- 4. 使用 DISTINCT 创建去重表 CREATE TABLE users_distinct AS SELECT DISTINCT username, email, phone, city, created_at FROM users; -- 添加自增主键 ALTER TABLE users_distinct ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST; -- 5. 保留特定条件的记录 CREATE TABLE users_latest AS SELECT u1.* FROM users u1 INNER JOIN ( SELECT username, email, MAX(created_at) as latest_created FROM users GROUP BY username, email ) u2 ON u1.username = u2.username AND u1.email = u2.email AND u1.created_at = u2.latest_created;
```
### 高级重复处理技术
#### 模糊匹配去重
```sql
-- 1. 基于相似度的去重 -- 创建函数计算字符串相似度 DELIMITER // CREATE FUNCTION LEVENSHTEIN(s1 VARCHAR(255), s2 VARCHAR(255)) RETURNS INT READS SQL DATA DETERMINISTIC BEGIN DECLARE s1_len, s2_len, i, j, c, c_temp, cost INT; DECLARE s1_char CHAR(1); DECLARE s2_char CHAR(1); DECLARE cv0, cv1 VARBINARY(256); SET s1_len = CHAR_LENGTH(s1); SET s2_len = CHAR_LENGTH(s2); SET cv1 = 0x00; SET j = 1; SET i = 1; WHILE j <= s2_len DO SET cv1 = CONCAT(cv1, UNHEX(HEX(j))); SET j = j + 1; END WHILE; WHILE i <= s1_len DO SET s1_char = SUBSTRING(s1, i, 1); SET c = i; SET cv0 = UNHEX(HEX(i)); SET j = 1; WHILE j <= s2_len DO SET s2_char = SUBSTRING(s2, j, 1); SET c = c + 1; IF s1_char = s2_char THEN SET cost = 0; ELSE SET cost = 1; END IF; SET c_temp = CONV(HEX(SUBSTRING(cv1, j, 1)), 16, 10) + cost; IF c > c_temp THEN SET c = c_temp; END IF; SET c_temp = CONV(HEX(SUBSTRING(cv0, j, 1)), 16, 10) + 1; IF c > c_temp THEN SET c = c_temp; END IF; SET cv0 = CONCAT(cv0, UNHEX(HEX(c))); SET j = j + 1; END WHILE; SET cv1 = cv0; SET i = i + 1; END WHILE; RETURN c; END // DELIMITER ; -- 2. 查找相似的用户名 SELECT u1.id, u1.username, u2.id as similar_id, u2.username as similar_username, LEVENSHTEIN(u1.username, u2.username) as distance FROM users u1 JOIN users u2 ON u1.id < u2.id WHERE LEVENSHTEIN(u1.username, u2.username) <= 2 AND u1.username != u2.username; -- 3. 基于 SOUNDEX 的相似匹配 SELECT u1.id, u1.username, u2.id as similar_id, u2.username as similar_username, SOUNDEX(u1.username) as soundex1, SOUNDEX(u2.username) as soundex2 FROM users u1 JOIN users u2 ON u1.id < u2.id WHERE SOUNDEX(u1.username) = SOUNDEX(u2.username) AND u1.username != u2.username;
```
#### 批量去重存储过程
```sql
-- 创建批量去重存储过程 DELIMITER // CREATE PROCEDURE RemoveDuplicates( IN table_name VARCHAR(64), IN duplicate_columns TEXT, IN keep_rule ENUM('first', 'last', 'min_id', 'max_id') DEFAULT 'first' ) BEGIN DECLARE done INT DEFAULT FALSE; DECLARE sql_stmt TEXT; DECLARE backup_table VARCHAR(64); -- 创建备份表名 SET backup_table = CONCAT(table_name, '_backup_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s')); -- 创建备份 SET sql_stmt = CONCAT('CREATE TABLE ', backup_table, ' AS SELECT * FROM ', table_name); SET @sql = sql_stmt; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; -- 根据保留规则删除重复数据 CASE keep_rule WHEN 'first' THEN SET sql_stmt = CONCAT( 'DELETE t1 FROM ', table_name, ' t1 ', 'INNER JOIN ', table_name, ' t2 ', 'WHERE t1.id > t2.id AND ', duplicate_columns ); WHEN 'last' THEN SET sql_stmt = CONCAT( 'DELETE t1 FROM ', table_name, ' t1 ', 'INNER JOIN ', table_name, ' t2 ', 'WHERE t1.id < t2.id AND ', duplicate_columns ); WHEN 'min_id' THEN SET sql_stmt = CONCAT( 'DELETE FROM ', table_name, ' WHERE id NOT IN (', 'SELECT min_id FROM (', 'SELECT MIN(id) as min_id FROM ', table_name, ' GROUP BY ', duplicate_columns, ') as temp)' ); WHEN 'max_id' THEN SET sql_stmt = CONCAT( 'DELETE FROM ', table_name, ' WHERE id NOT IN (', 'SELECT max_id FROM (', 'SELECT MAX(id) as max_id FROM ', table_name, ' GROUP BY ', duplicate_columns, ') as temp)' ); END CASE; -- 执行删除 SET @sql = sql_stmt; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; -- 返回结果 SELECT CONCAT('Backup created: ', backup_table) as message, ROW_COUNT() as deleted_rows; END // DELIMITER ; -- 使用存储过程 -- CALL RemoveDuplicates('users', 't1.username = t2.username AND t1.email = t2.email', 'first');
```
#### 实时重复检测触发器
```sql
-- 创建重复检测日志表 CREATE TABLE duplicate_log ( id INT AUTO_INCREMENT PRIMARY KEY, table_name VARCHAR(64), duplicate_type VARCHAR(50), original_id INT, duplicate_data JSON, detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 创建触发器检测重复插入 DELIMITER // CREATE TRIGGER check_duplicate_insert BEFORE INSERT ON users FOR EACH ROW BEGIN DECLARE duplicate_count INT DEFAULT 0; DECLARE duplicate_id INT DEFAULT 0; -- 检查是否存在重复的用户名和邮箱 SELECT COUNT(*), MIN(id) INTO duplicate_count, duplicate_id FROM users WHERE username = NEW.username AND email = NEW.email; -- 如果发现重复，记录日志 IF duplicate_count > 0 THEN INSERT INTO duplicate_log (table_name, duplicate_type, original_id, duplicate_data) VALUES ( 'users', 'username_email_duplicate', duplicate_id, JSON_OBJECT( 'username', NEW.username, 'email', NEW.email, 'phone', NEW.phone, 'city', NEW.city ) ); -- 可以选择阻止插入或修改数据 -- SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate username and email combination'; -- 或者修改数据以避免重复 SET NEW.username = CONCAT(NEW.username, '_', UNIX_TIMESTAMP()); END IF; END // DELIMITER ; -- 创建更新触发器 DELIMITER // CREATE TRIGGER check_duplicate_update BEFORE UPDATE ON users FOR EACH ROW BEGIN DECLARE duplicate_count INT DEFAULT 0; -- 检查更新后是否会产生重复 SELECT COUNT(*) INTO duplicate_count FROM users WHERE username = NEW.username AND email = NEW.email AND id != NEW.id; IF duplicate_count > 0 THEN INSERT INTO duplicate_log (table_name, duplicate_type, original_id, duplicate_data) VALUES ( 'users', 'update_would_create_duplicate', NEW.id, JSON_OBJECT( 'old_username', OLD.username, 'new_username', NEW.username, 'old_email', OLD.email, 'new_email', NEW.email ) ); -- 阻止更新 SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Update would create duplicate record'; END IF; END // DELIMITER ; -- 查询重复检测日志 SELECT table_name, duplicate_type, COUNT(*) as occurrence_count, MAX(detected_at) as last_detected FROM duplicate_log GROUP BY table_name, duplicate_type ORDER BY last_detected DESC;
```
### 处理策略对比
|方法	|适用场景	|优点	|缺点	|性能|
| --- | --- | --- | --- | --- |
|唯一约束	|预防重复数据	|完全防止重复，性能好	|需要提前设计，难以修改	|高
|INSERT IGNORE	|批量导入时忽略重复	|简单易用，不会报错	|静默忽略，可能丢失数据	|高
|ON DUPLICATE KEY UPDATE	|更新重复数据	|灵活处理重复，可自定义逻辑	|语法复杂，需要唯一键	|中等
|REPLACE INTO	|完全替换重复数据	|简单易用，替换旧数据	|性能一般，不建议频繁使用	|高
|自连接删除	|清理现有重复数据	|直接有效，逻辑清晰	|大表性能差，需要小心操作	|低
|窗口函数删除	|复杂重复检测和删除	|功能强大，支持复杂逻辑	|需要 MySQL 8.0+	|中等
|重建表	|大量重复数据清理	|彻底清理，性能好	|需要停机时间，风险高	|高
### 最佳实践和注意事项
- 预防为主
设计阶段就考虑唯一性约束，从源头防止重复数据

- 备份先行
删除重复数据前务必创建备份，确保数据安全

- 分步验证
先查询确认重复数据，再执行删除操作

- 性能考虑
大表操作时考虑分批处理，避免长时间锁表

- 监控日志
建立重复数据监控机制，及时发现问题

- 定期清理
建立定期的数据清理流程，保持数据质量

#### 操作检查清单
- 操作前：备份数据、确认重复规则、测试查询语句
- 操作中：监控执行进度、检查锁等待、观察系统负载
- 操作后：验证数据完整性、检查约束、更新统计信息
- 长期：建立监控机制、定期数据质量检查、优化预防措施
#### 常见陷阱
- 外键约束：删除重复数据时注意外键关系，可能需要级联处理
- 事务处理：大批量删除时合理使用事务，避免长时间锁定
- 索引影响：删除操作可能影响索引性能，考虑重建索引
- 应用影响：确保应用程序能正确处理重复数据的各种情况
- 数据类型：注意 NULL 值的比较，NULL != NULL
### 总结
> 处理重复数据是数据库维护的重要环节，需要根据具体场景选择合适的策略。预防重复数据的产生比事后清理更加重要和高效。

#### 关键要点
- 设计阶段：合理设置唯一约束和索引
- 开发阶段：使用适当的插入语句处理重复
- 维护阶段：定期检测和清理重复数据
- 监控阶段：建立重复数据监控和报警机制

## MySQL SQL 注入防护

### SQL 注入概述
> SQL 注入是一种代码注入技术，攻击者通过在应用程序的输入字段中插入恶意 SQL 代码，来操作数据库执行非预期的操作。这是 Web 应用程序中最常见和最危险的安全漏洞之一。

- 数据泄露
获取敏感数据如用户密码、个人信息、商业机密等

- 数据破坏
删除或修改重要数据，破坏数据完整性

- 权限提升
绕过身份验证，获得管理员权限

- 系统控制
在某些情况下可能获得服务器控制权

#### SQL 注入的严重后果：
- 敏感数据泄露（用户信息、财务数据）
- 数据完整性被破坏
- 身份验证绕过
- 拒绝服务攻击
- 系统完全被控制
- 法律和合规问题
- 品牌声誉损害

### SQL 注入攻击类型
#### 1. 经典 SQL 注入
```sql
-- 创建示例表 
CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(255), email VARCHAR(100), role VARCHAR(20) DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); INSERT INTO users (username, password, email, role) VALUES ('admin', 'admin123', 'admin@example.com', 'admin'), ('john_doe', 'password123', 'john@example.com', 'user'), ('jane_smith', 'secret456', 'jane@example.com', 'user'), ('bob_wilson', 'mypass789', 'bob@example.com', 'user'); 
-- 易受攻击的查询示例（不要在生产环境使用） 
-- 假设应用程序直接拼接用户输入： -- 
SELECT * FROM users WHERE username = '$username' AND password = '$password' 
-- 正常查询 
SELECT * FROM users WHERE username = 'john_doe' AND password = 'password123'; -- 攻击示例1：绕过密码验证 
-- 用户输入: 
username = "admin' --", password = "anything" 
-- 生成的SQL: 
SELECT * FROM users WHERE username = 'admin' -- 
AND password = 'anything' 
SELECT * FROM users WHERE username = 'admin' -- AND 
password = 'anything'; 
-- 攻击示例2：联合查询注入 
-- 用户输入: 
username = "' UNION SELECT 1,2,3,4,5,6 --" -- 
SELECT * FROM users WHERE username = '' UNION SELECT 1,2,3,4,5,6 -- 
AND password = '' 
-- 攻击示例3：获取所有用户数据 
-- 用户输入: 
username = "' OR '1'='1" -- 
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '' SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '';
```
#### 2. 盲注攻击
```sql
-- 盲注：攻击者无法直接看到查询结果，但可以通过应用程序的行为推断信息 
-- 布尔盲注示例 
-- 攻击者通过观察页面是否返回结果来推断信息 
-- 测试数据库名称长度 
-- 如果返回结果，说明数据库名长度大于5 
SELECT * FROM users WHERE id = 1 AND LENGTH(DATABASE()) > 5; 
-- 逐字符猜测数据库名 
-- 如果返回结果，说明数据库名第一个字符是 'm' 
SELECT * FROM users WHERE id = 1 AND SUBSTRING(DATABASE(), 1, 1) = 'm'; 
-- 时间盲注示例 
-- 通过延时来判断条件是否成立 
SELECT * FROM users WHERE id = 1 AND IF(LENGTH(DATABASE()) > 5, SLEEP(5), 0); 
-- 获取表名 
SELECT * FROM users WHERE id = 1 AND ( SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users' ) > 0; 
-- 获取列名 
SELECT * FROM users WHERE id = 1 AND ( SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password' ) > 0;
```
#### 3. 联合查询注入
```sql
-- 联合查询注入：使用 UNION 操作符获取其他表的数据 -- 首先确定原查询的列数 -- 通过 ORDER BY 确定列数 SELECT * FROM users WHERE id = 1 ORDER BY 6; -- 如果报错，说明列数少于6 SELECT * FROM users WHERE id = 1 ORDER BY 5; -- 如果不报错，说明有5列 -- 使用 UNION 获取数据库信息 SELECT id, username, password, email, role FROM users WHERE id = -1 UNION SELECT 1, DATABASE(), VERSION(), USER(), 'info'; -- 获取所有数据库名 SELECT id, username, password, email, role FROM users WHERE id = -1 UNION SELECT 1, schema_name, 'db', 'info', 'data' FROM information_schema.schemata; -- 获取所有表名 SELECT id, username, password, email, role FROM users WHERE id = -1 UNION SELECT 1, table_name, table_schema, 'table', 'info' FROM information_schema.tables WHERE table_schema = DATABASE(); -- 获取所有列名 SELECT id, username, password, email, role FROM users WHERE id = -1 UNION SELECT 1, column_name, table_name, data_type, 'column' FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users'; -- 获取敏感数据 SELECT id, username, password, email, role FROM users WHERE id = -1 UNION SELECT id, username, password, email, role FROM users;
```
#### 4. 错误注入
```sql
-- 错误注入：通过触发数据库错误来获取信息 -- 创建一个会产生错误的查询来获取信息 -- 使用 extractvalue 函数触发错误 SELECT * FROM users WHERE id = 1 AND extractvalue(1, concat(0x7e, (SELECT DATABASE()), 0x7e)); -- 使用 updatexml 函数触发错误 SELECT * FROM users WHERE id = 1 AND updatexml(1, concat(0x7e, (SELECT USER()), 0x7e), 1); -- 通过除零错误获取信息 SELECT * FROM users WHERE id = 1 AND (SELECT COUNT(*) FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3)x GROUP BY concat(DATABASE(), floor(rand(0)*2))); -- 获取表名通过错误 SELECT * FROM users WHERE id = 1 AND extractvalue(1, concat(0x7e, ( SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() LIMIT 1 ), 0x7e)); -- 获取列名通过错误 SELECT * FROM users WHERE id = 1 AND extractvalue(1, concat(0x7e, ( SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' LIMIT 1 ), 0x7e));
```
#### 5. 二阶注入
```sql
-- 二阶注入：恶意数据先被存储，然后在另一个查询中被执行 -- 创建日志表 CREATE TABLE user_logs ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(100), details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 第一步：插入包含恶意代码的数据 -- 假设应用程序允许用户更新用户名，但没有正确转义 INSERT INTO users (username, password, email) VALUES ("admin' OR '1'='1' --", 'password', 'evil@example.com'); -- 第二步：当应用程序使用存储的用户名构建查询时 -- 假设应用程序记录用户活动： -- INSERT INTO user_logs (user_id, action, details) -- VALUES (1, 'login', 'User admin' OR '1'='1' -- logged in') -- 这可能导致意外的行为或数据泄露 -- 查看潜在的恶意用户名 SELECT id, username, 'POTENTIAL_INJECTION' as risk_level FROM users WHERE username LIKE "%'%" OR username LIKE "%\"%" OR username LIKE "%-%" OR username LIKE "%/*%" OR username LIKE "%*/%" OR username LIKE "%union%" OR username LIKE "%select%" OR username LIKE "%drop%" OR username LIKE "%delete%" OR username LIKE "%update%" OR username LIKE "%insert%";
```
### SQL 注入检测
#### 手动检测方法
```sql
-- 1. 单引号测试 
-- 在输入中添加单引号，观察是否产生错误 
-- 输入: test' 
-- 如果产生SQL语法错误，可能存在注入漏洞 
-- 2. 逻辑测试
-- 输入: 1' OR '1'='1 
-- 输入: 1' OR '1'='2 
-- 比较两次结果，如果不同可能存在注入 
-- 3. 时间延迟测试 
-- 输入: 1'; WAITFOR DELAY '00:00:05' -- -- 输入: 1' AND SLEEP(5) -- 
-- 如果页面响应延迟，可能存在注入 
-- 4. 联合查询测试 
-- 输入: 1' UNION SELECT NULL -- 
-- 输入: 1' UNION SELECT NULL, NULL -- 
-- 逐步增加NULL的数量，直到不报错 
-- 5. 错误信息测试 
-- 输入: 1' AND extractvalue(1, concat(0x7e, version(), 0x7e)) -- 
-- 观察是否返回数据库版本信息
```
#### 自动化检测工具
- SQLMap - 最流行的自动化SQL注入检测工具
- Burp Suite - Web应用安全测试平台
- OWASP ZAP - 开源Web应用安全扫描器
- Netsparker - 商业Web漏洞扫描器
- Acunetix - Web应用安全扫描器
- Havij - 自动化SQL注入工具
#### 数据库层面的检测
```sql
-- 创建SQL注入检测日志表 CREATE TABLE security_logs ( id INT AUTO_INCREMENT PRIMARY KEY, event_type VARCHAR(50), query_text TEXT, source_ip VARCHAR(45), user_agent TEXT, detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW' ); -- 创建检测可疑查询的存储过程 DELIMITER // CREATE PROCEDURE DetectSQLInjection( IN query_text TEXT, IN source_ip VARCHAR(45), IN user_agent TEXT ) BEGIN DECLARE risk_level VARCHAR(10) DEFAULT 'LOW'; DECLARE suspicious_patterns TEXT DEFAULT ''; -- 检测常见的SQL注入模式 IF query_text REGEXP '(union|select|drop|delete|update|insert).*\\-\\-' THEN SET risk_level = 'CRITICAL'; SET suspicious_patterns = CONCAT(suspicious_patterns, 'SQL_COMMENT_INJECTION,'); END IF; IF query_text REGEXP "(or|and)\\s+['\"]?1['\"]?\\s*=\\s*['\"]?1['\"]?" THEN SET risk_level = 'HIGH'; SET suspicious_patterns = CONCAT(suspicious_patterns, 'TAUTOLOGY_INJECTION,'); END IF; IF query_text REGEXP 'union\\s+select' THEN SET risk_level = 'HIGH'; SET suspicious_patterns = CONCAT(suspicious_patterns, 'UNION_INJECTION,'); END IF; IF query_text REGEXP '(sleep|waitfor|benchmark)\\s*\\(' THEN SET risk_level = 'MEDIUM'; SET suspicious_patterns = CONCAT(suspicious_patterns, 'TIME_BASED_INJECTION,'); END IF; IF query_text REGEXP '(extractvalue|updatexml)\\s*\\(' THEN SET risk_level = 'HIGH'; SET suspicious_patterns = CONCAT(suspicious_patterns, 'ERROR_BASED_INJECTION,'); END IF; -- 如果检测到可疑模式，记录日志 IF suspicious_patterns != '' THEN INSERT INTO security_logs (event_type, query_text, source_ip, user_agent, risk_level) VALUES (suspicious_patterns, query_text, source_ip, user_agent, risk_level); END IF; END // DELIMITER ; -- 测试检测功能 CALL DetectSQLInjection( "SELECT * FROM users WHERE id = 1' OR '1'='1' --", '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' ); CALL DetectSQLInjection( "SELECT * FROM users WHERE id = 1 UNION SELECT 1,2,3,4,5", '192.168.1.101', 'sqlmap/1.4.12' ); -- 查看检测结果 SELECT * FROM security_logs ORDER BY detected_at DESC; -- 统计安全事件 SELECT risk_level, COUNT(*) as event_count, COUNT(DISTINCT source_ip) as unique_ips FROM security_logs GROUP BY risk_level ORDER BY FIELD(risk_level, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
```
### SQL 注入防护方法
- 参数化查询
使用预编译语句和参数绑定，最有效的防护方法

- 输入验证
严格验证和过滤用户输入，白名单优于黑名单

- 权限控制
最小权限原则，限制数据库用户权限

- 错误处理
不向用户显示详细的数据库错误信息

#### 1. 参数化查询（推荐）
```sql
-- MySQL 预编译语句示例 -- 准备预编译语句 PREPARE stmt FROM 'SELECT * FROM users WHERE username = ? AND password = ?'; -- 设置参数 SET @username = 'john_doe'; SET @password = 'password123'; -- 执行查询 EXECUTE stmt USING @username, @password; -- 清理 DEALLOCATE PREPARE stmt; -- 即使输入包含恶意代码也是安全的 SET @username = "admin' OR '1'='1' --"; SET @password = 'anything'; PREPARE stmt FROM 'SELECT * FROM users WHERE username = ? AND password = ?'; EXECUTE stmt USING @username, @password; -- 这将查找用户名为 "admin' OR '1'='1' --" 的用户，而不会执行注入攻击 DEALLOCATE PREPARE stmt; -- 动态查询的安全实现 DELIMITER // CREATE PROCEDURE SafeUserLogin( IN p_username VARCHAR(50), IN p_password VARCHAR(255) ) BEGIN SELECT id, username, email, role FROM users WHERE username = p_username AND password = p_password; END // DELIMITER ; -- 安全调用 CALL SafeUserLogin('john_doe', 'password123'); CALL SafeUserLogin("admin' OR '1'='1' --", 'anything'); -- 安全，不会被注入
```
#### 2. 输入验证和过滤
```sql
-- 创建输入验证函数 DELIMITER // CREATE FUNCTION ValidateInput( input_text TEXT, input_type VARCHAR(20) ) RETURNS BOOLEAN READS SQL DATA DETERMINISTIC BEGIN DECLARE is_valid BOOLEAN DEFAULT TRUE; -- 检查空值 IF input_text IS NULL OR TRIM(input_text) = '' THEN RETURN FALSE; END IF; -- 根据类型验证 CASE input_type WHEN 'username' THEN -- 用户名只允许字母、数字、下划线 IF input_text NOT REGEXP '^[a-zA-Z0-9_]{3,50}$' THEN SET is_valid = FALSE; END IF; WHEN 'email' THEN -- 简单的邮箱验证 IF input_text NOT REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' THEN SET is_valid = FALSE; END IF; WHEN 'numeric' THEN -- 数字验证 IF input_text NOT REGEXP '^[0-9]+$' THEN SET is_valid = FALSE; END IF; WHEN 'alphanumeric' THEN -- 字母数字验证 IF input_text NOT REGEXP '^[a-zA-Z0-9]+$' THEN SET is_valid = FALSE; END IF; END CASE; -- 检查危险关键词 IF UPPER(input_text) REGEXP '(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|SCRIPT|JAVASCRIPT|VBSCRIPT)' THEN SET is_valid = FALSE; END IF; -- 检查SQL注入模式 IF input_text REGEXP "(\\-\\-|\\/\\*|\\*\\/|;|\\||&|<|>|\\')" THEN SET is_valid = FALSE; END IF; RETURN is_valid; END // DELIMITER ; -- 测试验证函数 SELECT 'john_doe' as input, ValidateInput('john_doe', 'username') as is_valid_username; SELECT "admin' OR '1'='1' --" as input, ValidateInput("admin' OR '1'='1' --", 'username') as is_valid_username; SELECT 'user@example.com' as input, ValidateInput('user@example.com', 'email') as is_valid_email; SELECT 'DROP TABLE users' as input, ValidateInput('DROP TABLE users', 'username') as is_valid_username; -- 创建安全的用户注册过程 DELIMITER // CREATE PROCEDURE SafeRegisterUser( IN p_username VARCHAR(50), IN p_password VARCHAR(255), IN p_email VARCHAR(100) ) BEGIN DECLARE validation_error VARCHAR(255) DEFAULT ''; -- 验证输入 IF NOT ValidateInput(p_username, 'username') THEN SET validation_error = 'Invalid username format'; ELSEIF NOT ValidateInput(p_email, 'email') THEN SET validation_error = 'Invalid email format'; ELSEIF LENGTH(p_password) < 8 THEN SET validation_error = 'Password must be at least 8 characters'; END IF; -- 如果验证失败，返回错误 IF validation_error != '' THEN SELECT validation_error as error_message; ELSE -- 检查用户名是否已存在 IF EXISTS(SELECT 1 FROM users WHERE username = p_username) THEN SELECT 'Username already exists' as error_message; ELSE -- 安全插入新用户 INSERT INTO users (username, password, email) VALUES (p_username, p_password, p_email); SELECT 'User registered successfully' as success_message; END IF; END IF; END // DELIMITER ; -- 测试安全注册 CALL SafeRegisterUser('newuser', 'password123', 'newuser@example.com'); CALL SafeRegisterUser("admin' OR '1'='1' --", 'password', 'evil@example.com');
```
#### 3. 权限控制
```sql
-- 创建专用的应用程序数据库用户 -- 不要使用 root 或管理员账户连接应用程序 -- 创建只读用户（用于查询操作） CREATE USER 'app_readonly'@'localhost' IDENTIFIED BY 'strong_password_123'; GRANT SELECT ON myapp.users TO 'app_readonly'@'localhost'; GRANT SELECT ON myapp.user_logs TO 'app_readonly'@'localhost'; -- 创建有限写入权限的用户（用于应用程序操作） CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'another_strong_password_456'; GRANT SELECT, INSERT, UPDATE ON myapp.users TO 'app_user'@'localhost'; GRANT SELECT, INSERT ON myapp.user_logs TO 'app_user'@'localhost'; -- 注意：不给予 DELETE, DROP, CREATE, ALTER 权限 -- 创建备份用户（仅用于备份操作） CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password_789'; GRANT SELECT, LOCK TABLES ON myapp.* TO 'backup_user'@'localhost'; -- 查看用户权限 SHOW GRANTS FOR 'app_readonly'@'localhost'; SHOW GRANTS FOR 'app_user'@'localhost'; -- 限制危险函数的使用 -- 在 MySQL 配置中禁用危险函数 -- SET GLOBAL log_bin_trust_function_creators = 0; -- 创建安全视图，隐藏敏感列 CREATE VIEW safe_users_view AS SELECT id, username, email, role, created_at FROM users; -- 不包含 password 列 -- 给应用程序用户授权视图而不是原表 GRANT SELECT ON myapp.safe_users_view TO 'app_readonly'@'localhost'; -- 撤销对原表的直接访问（如果之前授权过） -- REVOKE ALL ON myapp.users FROM 'app_readonly'@'localhost';
```
#### 4. 错误处理和日志记录
```sql
-- 创建安全的错误处理机制 -- 创建错误日志表 CREATE TABLE error_logs ( id INT AUTO_INCREMENT PRIMARY KEY, error_type VARCHAR(50), error_message TEXT, query_hash VARCHAR(64), -- 查询的哈希值，不记录实际查询 source_ip VARCHAR(45), user_agent TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 创建安全的查询执行函数 DELIMITER // CREATE PROCEDURE SafeExecuteQuery( IN query_type VARCHAR(20), IN param1 VARCHAR(255), IN param2 VARCHAR(255), IN source_ip VARCHAR(45) ) BEGIN DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN -- 记录错误但不暴露详细信息 INSERT INTO error_logs (error_type, error_message, source_ip) VALUES ('SQL_ERROR', 'Database operation failed', source_ip); -- 返回通用错误消息 SELECT 'An error occurred. Please try again later.' as error_message; END; -- 根据查询类型执行相应操作 CASE query_type WHEN 'login' THEN SELECT id, username, email, role FROM users WHERE username = param1 AND password = param2; WHEN 'get_user' THEN SELECT id, username, email, role FROM users WHERE id = CAST(param1 AS UNSIGNED); ELSE SELECT 'Invalid query type' as error_message; END CASE; END // DELIMITER ; -- 创建审计日志 CREATE TABLE audit_logs ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, old_values JSON, new_values JSON, source_ip VARCHAR(45), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 创建审计触发器 DELIMITER // CREATE TRIGGER users_audit_update AFTER UPDATE ON users FOR EACH ROW BEGIN INSERT INTO audit_logs ( user_id, action, table_name, record_id, old_values, new_values, source_ip ) VALUES ( NEW.id, 'UPDATE', 'users', NEW.id, JSON_OBJECT( 'username', OLD.username, 'email', OLD.email, 'role', OLD.role ), JSON_OBJECT( 'username', NEW.username, 'email', NEW.email, 'role', NEW.role ), @source_ip ); END // DELIMITER ; -- 测试安全查询执行 CALL SafeExecuteQuery('login', 'john_doe', 'password123', '192.168.1.100'); CALL SafeExecuteQuery('get_user', '1', '', '192.168.1.100'); -- 查看日志 SELECT * FROM error_logs; SELECT * FROM audit_logs;
```
### 代码层面的防护
#### Java 防护示例
```java
/**
 *  1.输入只校验格式（长度、字符集），不拼接 SQL
    2.全部使用 PreparedStatement（参数化查询）
    3.密码用 BCrypt 哈希
    4.记录错误日志，但不向外暴露堆栈
 */
import java.sql.*;
import java.util.regex.Pattern;
import org.mindrot.jbcrypt.BCrypt;

public class SecureDbUtil {

    /* ================ 输入校验 ================ */
    private static final Pattern USER_NAME = Pattern.compile("^[a-zA-Z0-9_]{3,50}$");
    private static final Pattern EMAIL     = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    public static boolean isValidUserName(String s) { return s != null && USER_NAME.matcher(s).matches(); }
    public static boolean isValidEmail(String s)     { return s != null && EMAIL.matcher(s).matches(); }

    /* ================ 安全登录 ================ */
    public static User secureLogin(Connection conn, String user, String plainPwd) throws SQLException {
        if (!isValidUserName(user)) throw new IllegalArgumentException("Invalid user name");

        String sql = "SELECT id, username, email, role, password FROM users WHERE username = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && BCrypt.checkpw(plainPwd, rs.getString("password"))) {
                    return new User(rs.getLong("id"),
                                    rs.getString("username"),
                                    rs.getString("email"),
                                    rs.getString("role"));
                }
            }
        }
        return null; // 登录失败
    }

    /* ================ 安全注册 ================ */
    public static boolean secureRegister(Connection conn, String user, String plainPwd, String email) throws SQLException {
        if (!isValidUserName(user) || !isValidEmail(email) || plainPwd.length() < 8)
            throw new IllegalArgumentException("Input invalid");

        String checkSql = "SELECT id FROM users WHERE username = ?";
        try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
            ps.setString(1, user);
            if (ps.executeQuery().next()) return false; // 用户名已存在
        }

        String insertSql = "INSERT INTO users(username, password, email) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
            ps.setString(1, user);
            ps.setString(2, BCrypt.hashpw(plainPwd, BCrypt.gensalt()));
            ps.setString(3, email);
            ps.executeUpdate();
            return true;
        }
    }

    /* ================ 错误日志 ================ */
    public static void logError(Connection conn, String type, String msg) {
        String sql = "INSERT INTO error_logs(error_type, error_message) VALUES (?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, type);
            ps.setString(2, msg);
            ps.executeUpdate();
        } catch (SQLException ignore) {} // 静默写日志
    }

    /* ================ 简单 POJO ================ */
    public static class User {
        public final long id;
        public final String username, email, role;
        public User(long id, String u, String e, String r) {
            this.id = id; this.username = u; this.email = e; this.role = r;
        }
    }
}
```
#### Python 防护示例
```python
import re
import hashlib
import mysql.connector
from mysql.connector import Error
import bcrypt


class SecureDatabase:
    def __init__(self, host, user, password, database):
        self.connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )

    def validate_input(self, input_value, input_type):
        """验证输入数据"""
        if not input_value or not input_value.strip():
            return False

        input_value = input_value.strip()

        patterns = {
            'username': r'^[a-zA-Z0-9_]{3,50}$',
            'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'numeric': r'^[0-9]+$'
        }

        if input_type in patterns:
            return bool(re.match(patterns[input_type], input_value))

        # 检查危险关键词
        dangerous_keywords = ['select', 'insert', 'update', 'delete', 'drop', 'union', 'script']
        for keyword in dangerous_keywords:
            if keyword.lower() in input_value.lower():
                return False

        # 检查SQL注入模式
        injection_patterns = [r"--", r"/\*", r"\*/", r";", r"\|", r"&", r"<", r">", r"'"]
        for pattern in injection_patterns:
            if re.search(pattern, input_value):
                return False

        return True

    def secure_login(self, username, password):
        """安全的用户登录"""
        try:
            # 验证输入
            if not self.validate_input(username, 'username'):
                return {'error': 'Invalid username format'}

            cursor = self.connection.cursor(dictionary=True)

            # 使用参数化查询
            query = "SELECT id, username, email, role, password FROM users WHERE username = %s"
            cursor.execute(query, (username,))
            user = cursor.fetchone()

            if user and self.verify_password(password, user['password']):
                # 不返回密码
                del user['password']
                return {'success': True, 'user': user}
            else:
                return {'error': 'Invalid credentials'}
        except Error as e:
            # 记录错误但不暴露给用户
            self.log_error('LOGIN_ERROR', str(e))
            return {'error': 'Login failed. Please try again.'}
        finally:
            cursor.close()

    def secure_register(self, username, password, email):
        """安全的用户注册"""
        try:
            # 验证输入
            if not self.validate_input(username, 'username'):
                return {'error': 'Invalid username format'}

            if not self.validate_input(email, 'email'):
                return {'error': 'Invalid email format'}

            if len(password) < 8:
                return {'error': 'Password must be at least 8 characters'}

            cursor = self.connection.cursor()

            # 检查用户名是否已存在
            check_query = "SELECT id FROM users WHERE username = %s"
            cursor.execute(check_query, (username,))

            if cursor.fetchone():
                return {'error': 'Username already exists'}

            # 哈希密码
            hashed_password = self.hash_password(password)

            # 插入新用户
            insert_query = "INSERT INTO users (username, password, email) VALUES (%s, %s, %s)"
            cursor.execute(insert_query, (username, hashed_password, email))
            self.connection.commit()

            return {'success': 'User registered successfully'}
        except Error as e:
            self.connection.rollback()
            self.log_error('REGISTER_ERROR', str(e))
            return {'error': 'Registration failed. Please try again.'}
        finally:
            cursor.close()

    def hash_password(self, password):
        """哈希密码"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    def verify_password(self, password, hashed):
        """验证密码"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def log_error(self, error_type, error_message):
        """记录错误日志"""
        try:
            cursor = self.connection.cursor()
            log_query = "INSERT INTO error_logs (error_type, error_message) VALUES (%s, %s)"
            cursor.execute(log_query, (error_type, error_message))
            self.connection.commit()
        except:
            pass  # 静默处理日志错误
        finally:
            cursor.close()


# 使用示例
db = SecureDatabase('localhost', 'app_user', 'password', 'myapp')

# 安全登录
result = db.secure_login('john_doe', 'password123')
print(result)

# 安全注册
result = db.secure_register('newuser', 'securepass123', 'newuser@example.com')
print(result)
```
### 防护策略总结
| 防护方法	| 有效性	| 实现难度	| 性能影响	| 推荐程度	|
| --- | --- | --- | --- | --- |
| 参数化查询	| 极高	| 低	| 极小	| 强烈推荐	|
| 输入验证	| 高	| 中等	| 小	| 推荐	|
| 权限控制	| 高	| 中等	| 无	| 推荐	|
| 错误处理	| 中等	| 低	| 无	| 推荐	|
| 字符转义	| 低	| 低	| 小	| 不推荐	|
| 黑名单过滤	| 低	| 中等	| 中等	| 不推荐	|
#### 综合防护策略（推荐）
- 主要防线：使用参数化查询/预编译语句
- 输入层：严格的输入验证和白名单过滤
- 权限层：最小权限原则，专用数据库用户
- 应用层：安全的错误处理，不暴露敏感信息
- 监控层：实时监控和日志记录
- 网络层：使用 WAF（Web应用防火墙）
#### 常见防护误区
- 仅依赖字符转义（容易被绕过）
- 使用黑名单过滤（无法覆盖所有攻击向量）
- 只在前端验证输入（可被绕过）
- 使用管理员权限连接数据库
- 向用户显示详细的数据库错误
- 认为存储过程完全安全（仍可能被注入）
```sql
-- 清理示例对象 
DROP TRIGGER IF EXISTS users_audit_update; DROP TABLE IF EXISTS audit_logs; DROP TABLE IF EXISTS error_logs; DROP TABLE IF EXISTS security_logs; DROP TABLE IF EXISTS user_logs; DROP TABLE IF EXISTS users; DROP PROCEDURE IF EXISTS SafeExecuteQuery; DROP PROCEDURE IF EXISTS DetectSQLInjection; DROP PROCEDURE IF EXISTS SafeRegisterUser; DROP FUNCTION IF EXISTS ValidateInput; DROP VIEW IF EXISTS safe_users_view; -- 清理用户（在生产环境中要谨慎） -- DROP USER IF EXISTS 'app_readonly'@'localhost'; -- DROP USER IF EXISTS 'app_user'@'localhost'; -- DROP USER IF EXISTS 'backup_user'@'localhost'; SELECT 'SQL injection prevention tutorial completed. All example objects cleaned up.' AS message;
```
