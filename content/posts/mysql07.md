---
title: "MySQL运维与管理"
date: 2021-02-12T12:00:00+08:00
draft: false
description: "MySQL运维与管理：数据库备份与恢复、性能优化、索引管理、用户管理、权限管理等。"
tags: ["MySQL", "mysql运维"]
categories: ["Database"]
---
MySQL运维与管理：数据库备份与恢复、性能优化、索引管理、用户管理、权限管理等。
## MySQL 性能优化
### 性能优化概述
> MySQL 性能优化是一个系统性工程，涉及硬件配置、数据库配置、查询优化、索引设计、架构设计等多个层面。有效的性能优化可以显著提升应用程序的响应速度和用户体验。

- 查询优化
优化 SQL 查询语句，使用合适的索引和查询策略

- 索引优化
设计和维护高效的索引结构

- 配置优化
调整 MySQL 服务器配置参数

- 架构优化
数据库架构设计和分库分表策略

#### 性能优化的基本原则
- 测量优先：先测量再优化，避免过早优化
- 找到瓶颈：识别真正的性能瓶颈点
- 逐步优化：一次优化一个问题
- 验证效果：优化后验证性能提升
- 监控持续：建立持续的性能监控
### 查询性能分析
#### 准备测试数据
```sql
-- 创建性能测试表 CREATE TABLE performance_test ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, product_id INT NOT NULL, order_date DATE NOT NULL, amount DECIMAL(10,2) NOT NULL, status VARCHAR(20) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ); -- 创建用户表 CREATE TABLE users_perf ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL, email VARCHAR(100) NOT NULL, age INT, city VARCHAR(50), registration_date DATE NOT NULL ); -- 创建产品表 CREATE TABLE products_perf ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL, price DECIMAL(10,2) NOT NULL, stock_quantity INT DEFAULT 0 ); -- 插入测试数据（模拟大量数据） DELIMITER // CREATE PROCEDURE GenerateTestData(IN record_count INT) BEGIN DECLARE i INT DEFAULT 1; DECLARE user_count INT DEFAULT 10000; DECLARE product_count INT DEFAULT 1000; -- 生成用户数据 WHILE i <= user_count DO INSERT INTO users_perf (username, email, age, city, registration_date) VALUES ( CONCAT('user', i), CONCAT('user', i, '@example.com'), FLOOR(18 + RAND() * 50), CASE FLOOR(RAND() * 5) WHEN 0 THEN 'Beijing' WHEN 1 THEN 'Shanghai' WHEN 2 THEN 'Guangzhou' WHEN 3 THEN 'Shenzhen' ELSE 'Hangzhou' END, DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 1000) DAY) ); SET i = i + 1; END WHILE; -- 生成产品数据 SET i = 1; WHILE i <= product_count DO INSERT INTO products_perf (name, category, price, stock_quantity) VALUES ( CONCAT('Product ', i), CASE FLOOR(RAND() * 5) WHEN 0 THEN 'Electronics' WHEN 1 THEN 'Clothing' WHEN 2 THEN 'Books' WHEN 3 THEN 'Home' ELSE 'Sports' END, ROUND(10 + RAND() * 1000, 2), FLOOR(RAND() * 1000) ); SET i = i + 1; END WHILE; -- 生成订单数据 SET i = 1; WHILE i <= record_count DO INSERT INTO performance_test (user_id, product_id, order_date, amount, status) VALUES ( FLOOR(1 + RAND() * user_count), FLOOR(1 + RAND() * product_count), DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365) DAY), ROUND(10 + RAND() * 1000, 2), CASE FLOOR(RAND() * 4) WHEN 0 THEN 'pending' WHEN 1 THEN 'completed' WHEN 2 THEN 'cancelled' ELSE 'shipped' END ); IF i % 10000 = 0 THEN SELECT CONCAT('Generated ', i, ' records') as progress; END IF; SET i = i + 1; END WHILE; END // DELIMITER ; -- 生成测试数据（根据需要调整数量） -- CALL GenerateTestData(100000); -- 生成10万条订单记录 -- 手动插入少量测试数据用于演示 INSERT INTO users_perf (username, email, age, city, registration_date) VALUES ('alice', 'alice@example.com', 25, 'Beijing', '2023-01-15'), ('bob', 'bob@example.com', 30, 'Shanghai', '2023-02-20'), ('charlie', 'charlie@example.com', 28, 'Guangzhou', '2023-03-10'); INSERT INTO products_perf (name, category, price, stock_quantity) VALUES ('Laptop', 'Electronics', 999.99, 50), ('T-Shirt', 'Clothing', 29.99, 200), ('Book', 'Books', 19.99, 100); INSERT INTO performance_test (user_id, product_id, order_date, amount, status) VALUES (1, 1, '2024-01-15', 999.99, 'completed'), (2, 2, '2024-01-16', 29.99, 'pending'), (3, 3, '2024-01-17', 19.99, 'shipped'), (1, 2, '2024-01-18', 29.99, 'completed'), (2, 1, '2024-01-19', 999.99, 'cancelled');
```
#### 使用 EXPLAIN 分析查询
```sql
-- 基本的 EXPLAIN 使用 
EXPLAIN SELECT * FROM performance_test WHERE user_id = 1; 
-- 详细的 EXPLAIN 分析 
EXPLAIN FORMAT=JSON SELECT pt.id, pt.amount, pt.order_date, u.username, p.name as product_name FROM performance_test pt JOIN users_perf u ON pt.user_id = u.id JOIN products_perf p ON pt.product_id = p.id WHERE pt.status = 'completed' AND pt.order_date >= '2024-01-01' ORDER BY pt.order_date DESC LIMIT 10; 
-- 分析慢查询 
EXPLAIN SELECT u.city, COUNT(*) as order_count, SUM(pt.amount) as total_amount, AVG(pt.amount) as avg_amount FROM performance_test pt JOIN users_perf u ON pt.user_id = u.id WHERE pt.order_date BETWEEN '2023-01-01' AND '2023-12-31' GROUP BY u.city HAVING total_amount > 1000 ORDER BY total_amount DESC; 
-- 使用 EXPLAIN ANALYZE（MySQL 8.0+） -- 
EXPLAIN ANALYZE SELECT * FROM performance_test WHERE amount > 500; 
-- 查看执行计划的关键指标 
SELECT 'Key Metrics for EXPLAIN Analysis' as info, 'type: 访问类型 (const > eq_ref > ref > range > index > ALL)' as type_info, 'key: 使用的索引' as key_info, 'rows: 扫描的行数' as rows_info, 'Extra: 额外信息 (Using index, Using filesort, Using temporary)' as extra_info;
```
#### 性能监控查询
```sql
-- 查看慢查询日志状态 
SHOW VARIABLES LIKE 'slow_query%'; 
SHOW VARIABLES LIKE 'long_query_time'; 
-- 启用慢查询日志 -- 
SET GLOBAL slow_query_log = 'ON'; -- 
SET GLOBAL long_query_time = 2; -- 记录执行时间超过2秒的查询 
-- 查看当前连接和查询状态 
SHOW PROCESSLIST; 
-- 查看数据库状态信息 
SHOW STATUS LIKE 'Slow_queries'; SHOW STATUS LIKE 'Questions'; SHOW STATUS LIKE 'Uptime'; 
-- 计算慢查询比例 
SELECT VARIABLE_VALUE as slow_queries FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Slow_queries'; SELECT VARIABLE_VALUE as total_queries FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Questions'; 
-- 查看表的统计信息 
SELECT table_name, table_rows, avg_row_length, data_length, index_length, (data_length + index_length) as total_size FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY total_size DESC; 
-- 查看索引使用情况 
SELECT table_name, index_name, column_name, cardinality FROM information_schema.statistics WHERE table_schema = DATABASE() ORDER BY table_name, index_name;
```
#### 查询性能测试
```sql
-- 创建性能测试函数 DELIMITER // CREATE PROCEDURE BenchmarkQuery( IN query_text TEXT, IN iterations INT ) BEGIN DECLARE start_time TIMESTAMP(6); DECLARE end_time TIMESTAMP(6); DECLARE i INT DEFAULT 0; DECLARE total_time DECIMAL(10,6) DEFAULT 0; SET start_time = NOW(6); WHILE i < iterations DO -- 这里需要根据实际查询替换 SELECT COUNT(*) FROM performance_test WHERE status = 'completed' INTO @dummy; SET i = i + 1; END WHILE; SET end_time = NOW(6); SET total_time = TIMESTAMPDIFF(MICROSECOND, start_time, end_time) / 1000000; SELECT iterations as test_iterations, total_time as total_seconds, total_time / iterations as avg_seconds_per_query, iterations / total_time as queries_per_second; END // DELIMITER ; -- 测试不同查询的性能 -- 无索引查询 SET @start_time = NOW(6); SELECT COUNT(*) FROM performance_test WHERE user_id = 1; SET @end_time = NOW(6); SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000 as 'Query Time (ms)'; -- 创建索引后测试 CREATE INDEX idx_user_id ON performance_test(user_id); SET @start_time = NOW(6); SELECT COUNT(*) FROM performance_test WHERE user_id = 1; SET @end_time = NOW(6); SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000 as 'Query Time with Index (ms)'; -- 复合查询性能测试 CREATE INDEX idx_status_date ON performance_test(status, order_date); SET @start_time = NOW(6); SELECT COUNT(*), SUM(amount) FROM performance_test WHERE status = 'completed' AND order_date >= '2024-01-01'; SET @end_time = NOW(6); SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000 as 'Complex Query Time (ms)'; -- 连接查询性能测试 SET @start_time = NOW(6); SELECT u.username, COUNT(pt.id) as order_count, SUM(pt.amount) as total_amount FROM users_perf u LEFT JOIN performance_test pt ON u.id = pt.user_id GROUP BY u.id, u.username HAVING order_count > 0; SET @end_time = NOW(6); SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000 as 'JOIN Query Time (ms)';
```
### 索引优化策略
#### 索引设计的黄金法则
- 选择性高的列：优先为选择性高的列创建索引
- 最左前缀原则：复合索引遵循最左前缀匹配
- 覆盖索引：尽量使用覆盖索引避免回表
- 避免过多索引：平衡查询性能和写入性能
- 定期维护：定期分析和重建索引
```sql
-- 分析列的选择性 
SELECT 'user_id' as column_name, COUNT(DISTINCT user_id) as distinct_values, COUNT(*) as total_rows, COUNT(DISTINCT user_id) / COUNT(*) as selectivity FROM performance_test UNION ALL SELECT 'status', COUNT(DISTINCT status), COUNT(*), COUNT(DISTINCT status) / COUNT(*) FROM performance_test UNION ALL SELECT 'order_date', COUNT(DISTINCT order_date), COUNT(*), COUNT(DISTINCT order_date) / COUNT(*) FROM performance_test; -- 创建高效的复合索引 -- 根据查询模式设计索引 CREATE INDEX idx_user_status_date ON performance_test(user_id, status, order_date); CREATE INDEX idx_date_status_amount ON performance_test(order_date, status, amount); -- 创建覆盖索引 CREATE INDEX idx_covering_order ON performance_test(user_id, status, order_date, amount); -- 分析索引效果 EXPLAIN SELECT user_id, status, order_date, amount FROM performance_test WHERE user_id = 1 AND status = 'completed'; -- 前缀索引（适用于长字符串） ALTER TABLE users_perf ADD COLUMN description TEXT; CREATE INDEX idx_desc_prefix ON users_perf(description(50)); -- 函数索引（MySQL 8.0+） -- CREATE INDEX idx_year_month ON performance_test((YEAR(order_date)), (MONTH(order_date))); -- 查看索引使用统计 SELECT OBJECT_SCHEMA as db_name, OBJECT_NAME as table_name, INDEX_NAME as index_name, COUNT_FETCH as index_fetches, COUNT_INSERT as index_inserts, COUNT_UPDATE as index_updates, COUNT_DELETE as index_deletes FROM performance_schema.table_io_waits_summary_by_index_usage WHERE OBJECT_SCHEMA = DATABASE() ORDER BY COUNT_FETCH DESC;
```
#### 索引维护和优化
```sql
-- 查看索引碎片情况 SELECT table_name, index_name, stat_name, stat_value, stat_description FROM mysql.innodb_index_stats WHERE database_name = DATABASE() ORDER BY table_name, index_name; -- 分析表和索引 ANALYZE TABLE performance_test; ANALYZE TABLE users_perf; ANALYZE TABLE products_perf; -- 检查索引基数 SHOW INDEX FROM performance_test; -- 重建索引（当索引碎片严重时） -- ALTER TABLE performance_test DROP INDEX idx_user_id; -- ALTER TABLE performance_test ADD INDEX idx_user_id(user_id); -- 或者使用 OPTIMIZE TABLE -- OPTIMIZE TABLE performance_test; -- 查找未使用的索引 SELECT t.TABLE_SCHEMA as db_name, t.TABLE_NAME as table_name, t.INDEX_NAME as index_name, t.COLUMN_NAME as column_name FROM information_schema.statistics t LEFT JOIN performance_schema.table_io_waits_summary_by_index_usage p ON t.TABLE_SCHEMA = p.OBJECT_SCHEMA AND t.TABLE_NAME = p.OBJECT_NAME AND t.INDEX_NAME = p.INDEX_NAME WHERE t.TABLE_SCHEMA = DATABASE() AND t.INDEX_NAME != 'PRIMARY' AND (p.COUNT_FETCH IS NULL OR p.COUNT_FETCH = 0) ORDER BY t.TABLE_NAME, t.INDEX_NAME; -- 查找重复索引 SELECT a.TABLE_SCHEMA, a.TABLE_NAME, a.INDEX_NAME as index1, b.INDEX_NAME as index2, a.COLUMN_NAME FROM information_schema.statistics a JOIN information_schema.statistics b ON a.TABLE_SCHEMA = b.TABLE_SCHEMA AND a.TABLE_NAME = b.TABLE_NAME AND a.COLUMN_NAME = b.COLUMN_NAME AND a.INDEX_NAME != b.INDEX_NAME AND a.INDEX_NAME < b.INDEX_NAME WHERE a.TABLE_SCHEMA = DATABASE() ORDER BY a.TABLE_NAME, a.COLUMN_NAME; -- 索引大小分析 SELECT table_name, ROUND(data_length / 1024 / 1024, 2) as data_size_mb, ROUND(index_length / 1024 / 1024, 2) as index_size_mb, ROUND((index_length / data_length) * 100, 2) as index_ratio_percent FROM information_schema.tables WHERE table_schema = DATABASE() AND data_length > 0 ORDER BY index_size_mb DESC;
```
### 查询优化技巧
#### SQL 查询优化
```sql
-- 1. 避免 SELECT * -- 不好的做法 SELECT * FROM performance_test WHERE user_id = 1; -- 好的做法 SELECT id, user_id, amount, order_date, status FROM performance_test WHERE user_id = 1; -- 2. 使用 LIMIT 限制结果集 -- 分页查询优化 SELECT id, user_id, amount, order_date FROM performance_test WHERE status = 'completed' ORDER BY order_date DESC LIMIT 20 OFFSET 0; -- 更好的分页方式（使用游标） SELECT id, user_id, amount, order_date FROM performance_test WHERE status = 'completed' AND id > 1000 -- 上一页的最后一个ID ORDER BY id LIMIT 20; -- 3. 优化 WHERE 条件 -- 使用索引友好的条件 SELECT * FROM performance_test WHERE order_date >= '2024-01-01' AND order_date < '2024-02-01'; -- 避免在 WHERE 中使用函数 -- 不好的做法 SELECT * FROM performance_test WHERE YEAR(order_date) = 2024; -- 好的做法 SELECT * FROM performance_test WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'; -- 4. 优化 JOIN 查询 -- 确保 JOIN 条件有索引 CREATE INDEX idx_product_id ON performance_test(product_id); SELECT pt.id, pt.amount, u.username, p.name as product_name FROM performance_test pt INNER JOIN users_perf u ON pt.user_id = u.id INNER JOIN products_perf p ON pt.product_id = p.id WHERE pt.status = 'completed' AND pt.order_date >= '2024-01-01'; -- 5. 使用 EXISTS 代替 IN（大数据集） -- 使用 EXISTS SELECT u.id, u.username FROM users_perf u WHERE EXISTS ( SELECT 1 FROM performance_test pt WHERE pt.user_id = u.id AND pt.status = 'completed' ); -- 6. 优化子查询 -- 将相关子查询改为 JOIN -- 不好的做法 SELECT u.username, (SELECT COUNT(*) FROM performance_test pt WHERE pt.user_id = u.id) as order_count FROM users_perf u; -- 好的做法 SELECT u.username, COALESCE(pt_count.order_count, 0) as order_count FROM users_perf u LEFT JOIN ( SELECT user_id, COUNT(*) as order_count FROM performance_test GROUP BY user_id ) pt_count ON u.id = pt_count.user_id;
```
#### 聚合查询优化
```sql
-- 创建聚合友好的索引 CREATE INDEX idx_status_date_amount ON performance_test(status, order_date, amount); -- 优化 GROUP BY 查询 SELECT status, COUNT(*) as order_count, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM performance_test WHERE order_date >= '2024-01-01' GROUP BY status ORDER BY total_amount DESC; -- 使用覆盖索引优化聚合 EXPLAIN SELECT status, COUNT(*), SUM(amount) FROM performance_test WHERE order_date >= '2024-01-01' GROUP BY status; -- 分区聚合（处理大数据集） SELECT DATE_FORMAT(order_date, '%Y-%m') as month, status, COUNT(*) as order_count, SUM(amount) as total_amount FROM performance_test WHERE order_date >= '2023-01-01' GROUP BY DATE_FORMAT(order_date, '%Y-%m'), status ORDER BY month, status; -- 使用临时表优化复杂聚合 CREATE TEMPORARY TABLE monthly_stats AS SELECT DATE_FORMAT(order_date, '%Y-%m') as month, COUNT(*) as order_count, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM performance_test WHERE order_date >= '2023-01-01' GROUP BY DATE_FORMAT(order_date, '%Y-%m'); -- 基于临时表进行进一步分析 SELECT month, order_count, total_amount, total_amount - LAG(total_amount) OVER (ORDER BY month) as month_growth FROM monthly_stats ORDER BY month; DROP TEMPORARY TABLE monthly_stats;
```
#### 批量操作优化
```sql
-- 批量插入优化 -- 使用 INSERT ... VALUES 批量插入 INSERT INTO performance_test (user_id, product_id, order_date, amount, status) VALUES (1, 1, '2024-01-20', 100.00, 'pending'), (2, 2, '2024-01-20', 200.00, 'pending'), (3, 3, '2024-01-20', 300.00, 'pending'), (1, 2, '2024-01-20', 150.00, 'pending'), (2, 1, '2024-01-20', 250.00, 'pending'); -- 使用 LOAD DATA INFILE（最快的批量导入方式） -- LOAD DATA INFILE '/path/to/data.csv' -- INTO TABLE performance_test -- FIELDS TERMINATED BY ',' -- LINES TERMINATED BY '\n' -- (user_id, product_id, order_date, amount, status); -- 批量更新优化 -- 使用 CASE WHEN 进行批量更新 UPDATE performance_test SET status = CASE WHEN id IN (1, 3, 5) THEN 'completed' WHEN id IN (2, 4) THEN 'shipped' ELSE status END WHERE id IN (1, 2, 3, 4, 5); -- 使用临时表进行批量更新 CREATE TEMPORARY TABLE temp_updates ( id INT PRIMARY KEY, new_status VARCHAR(20) ); INSERT INTO temp_updates VALUES (1, 'completed'), (2, 'shipped'), (3, 'cancelled'); UPDATE performance_test pt JOIN temp_updates tu ON pt.id = tu.id SET pt.status = tu.new_status; DROP TEMPORARY TABLE temp_updates; -- 批量删除优化 -- 分批删除大量数据 DELIMITER // CREATE PROCEDURE BatchDelete( IN table_name VARCHAR(64), IN where_condition TEXT, IN batch_size INT ) BEGIN DECLARE done INT DEFAULT FALSE; DECLARE affected_rows INT; REPEAT SET @sql = CONCAT('DELETE FROM ', table_name, ' WHERE ', where_condition, ' LIMIT ', batch_size); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; SET affected_rows = ROW_COUNT(); -- 短暂休息，避免长时间锁表 SELECT SLEEP(0.1); UNTIL affected_rows < batch_size END REPEAT; END // DELIMITER ; -- 使用批量删除 -- CALL BatchDelete('performance_test', 'order_date < "2023-01-01"', 1000);
```
### MySQL 配置优化
#### 内存配置优化
```sql
-- 查看当前内存配置 SHOW VARIABLES LIKE 'innodb_buffer_pool_size'; SHOW VARIABLES LIKE 'key_buffer_size'; SHOW VARIABLES LIKE 'query_cache_size'; SHOW VARIABLES LIKE 'tmp_table_size'; SHOW VARIABLES LIKE 'max_heap_table_size'; -- 推荐的内存配置（根据服务器内存调整） -- innodb_buffer_pool_size = 70-80% of total RAM -- key_buffer_size = 25% of RAM (for MyISAM) -- query_cache_size = 64M-256M -- tmp_table_size = 64M-256M -- max_heap_table_size = 64M-256M -- 查看缓冲池使用情况 SHOW STATUS LIKE 'Innodb_buffer_pool%'; -- 计算缓冲池命中率 SELECT ROUND( (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100, 2 ) as buffer_pool_hit_rate FROM ( SELECT VARIABLE_VALUE as Innodb_buffer_pool_reads FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Innodb_buffer_pool_reads' ) reads CROSS JOIN ( SELECT VARIABLE_VALUE as Innodb_buffer_pool_read_requests FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Innodb_buffer_pool_read_requests' ) requests;
```
#### 连接和线程配置
```sql
-- 查看连接配置 SHOW VARIABLES LIKE 'max_connections'; SHOW VARIABLES LIKE 'max_user_connections'; SHOW VARIABLES LIKE 'thread_cache_size'; SHOW VARIABLES LIKE 'table_open_cache'; -- 查看当前连接状态 SHOW STATUS LIKE 'Connections'; SHOW STATUS LIKE 'Max_used_connections'; SHOW STATUS LIKE 'Threads_connected'; SHOW STATUS LIKE 'Threads_running'; -- 计算连接使用率 SELECT max_used.VARIABLE_VALUE as max_used_connections, max_conn.VARIABLE_VALUE as max_connections, ROUND( (max_used.VARIABLE_VALUE / max_conn.VARIABLE_VALUE) * 100, 2 ) as connection_usage_percent FROM (SELECT VARIABLE_VALUE FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Max_used_connections') max_used CROSS JOIN (SELECT VARIABLE_VALUE FROM INFORMATION_SCHEMA.GLOBAL_VARIABLES WHERE VARIABLE_NAME = 'max_connections') max_conn; -- 推荐配置 -- max_connections = 200-500 (根据应用需求) -- thread_cache_size = 8-16 -- table_open_cache = 2000-4000
```
#### InnoDB 配置优化
```sql
-- 查看 InnoDB 配置 SHOW VARIABLES LIKE 'innodb_log_file_size'; SHOW VARIABLES LIKE 'innodb_log_buffer_size'; SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit'; SHOW VARIABLES LIKE 'innodb_file_per_table'; SHOW VARIABLES LIKE 'innodb_io_capacity'; -- 查看 InnoDB 状态 SHOW ENGINE INNODB STATUS\G -- 推荐的 InnoDB 配置 -- innodb_log_file_size = 256M-1G -- innodb_log_buffer_size = 16M-64M -- innodb_flush_log_at_trx_commit = 1 (安全) 或 2 (性能) -- innodb_file_per_table = ON -- innodb_io_capacity = 200 (SSD: 2000-20000) -- 监控 InnoDB 性能指标 SELECT 'InnoDB Performance Metrics' as category, 'Buffer Pool Hit Rate' as metric, CONCAT( ROUND( (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100, 2 ), '%' ) as value FROM ( SELECT CAST(VARIABLE_VALUE AS UNSIGNED) as Innodb_buffer_pool_reads FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Innodb_buffer_pool_reads' ) reads CROSS JOIN ( SELECT CAST(VARIABLE_VALUE AS UNSIGNED) as Innodb_buffer_pool_read_requests FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Innodb_buffer_pool_read_requests' ) requests;
```
### 性能监控和诊断
#### 性能监控查询
```sql
-- 创建性能监控视图 CREATE VIEW performance_summary AS SELECT 'Database Performance Summary' as report_type, NOW() as report_time, ( SELECT VARIABLE_VALUE FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Uptime' ) as uptime_seconds, ( SELECT VARIABLE_VALUE FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Questions' ) as total_queries, ( SELECT VARIABLE_VALUE FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Slow_queries' ) as slow_queries, ( SELECT VARIABLE_VALUE FROM INFORMATION_SCHEMA.GLOBAL_STATUS WHERE VARIABLE_NAME = 'Threads_connected' ) as current_connections; -- 查看性能摘要 SELECT * FROM performance_summary; -- 查看最耗时的查询（需要启用 performance_schema） SELECT DIGEST_TEXT as query_pattern, COUNT_STAR as exec_count, AVG_TIMER_WAIT / 1000000000 as avg_time_seconds, MAX_TIMER_WAIT / 1000000000 as max_time_seconds, SUM_TIMER_WAIT / 1000000000 as total_time_seconds FROM performance_schema.events_statements_summary_by_digest ORDER BY SUM_TIMER_WAIT DESC LIMIT 10; -- 查看表的 I/O 统计 SELECT OBJECT_SCHEMA as db_name, OBJECT_NAME as table_name, COUNT_READ as read_operations, COUNT_WRITE as write_operations, COUNT_FETCH as fetch_operations, COUNT_INSERT as insert_operations, COUNT_UPDATE as update_operations, COUNT_DELETE as delete_operations FROM performance_schema.table_io_waits_summary_by_table WHERE OBJECT_SCHEMA = DATABASE() ORDER BY (COUNT_READ + COUNT_WRITE) DESC; -- 查看锁等待情况 SELECT OBJECT_SCHEMA as db_name, OBJECT_NAME as table_name, INDEX_NAME, LOCK_TYPE, LOCK_MODE, COUNT_STAR as lock_count, SUM_TIMER_WAIT / 1000000000 as total_wait_seconds FROM performance_schema.table_lock_waits_summary_by_table WHERE OBJECT_SCHEMA = DATABASE() ORDER BY SUM_TIMER_WAIT DESC;
```
#### 慢查询分析
```sql
-- 启用慢查询日志 -- 
SET GLOBAL slow_query_log = 'ON'; -- 
SET GLOBAL long_query_time = 1; -- 
SET GLOBAL log_queries_not_using_indexes = 'ON'; 
-- 查看慢查询配置 
SHOW VARIABLES LIKE 'slow_query_log%'; 
SHOW VARIABLES LIKE 'long_query_time'; 
SHOW VARIABLES LIKE 'log_queries_not_using_indexes'; 
-- 创建慢查询分析表 
CREATE TABLE slow_query_analysis ( id INT AUTO_INCREMENT PRIMARY KEY, query_time DECIMAL(10,6), lock_time DECIMAL(10,6), rows_sent INT, rows_examined INT, query_text TEXT, analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); 
-- 模拟慢查询 
SELECT pt.id, pt.user_id, pt.amount, u.username, p.name, SLEEP(0.1) as artificial_delay -- 人为增加延迟 
FROM performance_test pt JOIN users_perf u ON pt.user_id = u.id JOIN products_perf p ON pt.product_id = p.id WHERE pt.amount > 100 ORDER BY pt.amount DESC; 
-- 分析查询性能问题 
DELIMITER // CREATE PROCEDURE AnalyzeQueryPerformance() BEGIN DECLARE done INT DEFAULT FALSE; DECLARE query_pattern TEXT; DECLARE avg_time DECIMAL(10,6); DECLARE exec_count INT; 
-- 查找最慢的查询模式 
SELECT 'Top Slow Query Patterns' as analysis_type, 'Pattern' as query_info, 'Avg Time (s)' as avg_time_info, 'Exec Count' as exec_count_info; -- 这里可以添加更复杂的分析逻辑 
SELECT LEFT(DIGEST_TEXT, 100) as query_pattern, ROUND(AVG_TIMER_WAIT / 1000000000, 6) as avg_time_seconds, COUNT_STAR as execution_count, ROUND(SUM_TIMER_WAIT / 1000000000, 6) as total_time_seconds FROM performance_schema.events_statements_summary_by_digest WHERE AVG_TIMER_WAIT > 1000000000 -- 超过1秒的查询 
ORDER BY AVG_TIMER_WAIT DESC LIMIT 5; END 
// DELIMITER ; 
-- 执行性能分析 
CALL AnalyzeQueryPerformance(); 
-- 查看当前正在执行的查询 
SELECT ID, USER, HOST, DB, COMMAND, TIME, STATE, LEFT(INFO, 100) as QUERY_PREVIEW FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND != 'Sleep' ORDER BY TIME DESC;
```
### 性能优化建议
#### 性能优化最佳实践
- 监控先行：建立完善的性能监控体系
- 基准测试：优化前后进行性能对比
- 逐步优化：一次只优化一个方面
- 索引优先：80% 的性能问题可通过索引解决
- 查询重写：优化 SQL 语句结构
- 配置调优：根据硬件和负载调整配置
- 架构优化：考虑读写分离、分库分表

| 优化类型 | 性能提升 | 实施难度 | 维护成本 | 适用场景 |
| -------- | -------- | -------- | -------- | -------- |
| 索引优化 | 极高 | 低 | 低 | 查询密集型应用 |
| 查询优化 | 高 | 中 | 低 | 复杂查询场景 |
| 配置优化 | 中 | 低 | 低 | 所有场景 |
| 硬件升级 | 中 | 低 | 高 | 资源瓶颈明显 |
| 架构重构 | 极高 | 高 | 高 | 大规模应用 |
```sql
-- 清理示例对象 
DROP VIEW IF EXISTS performance_summary; DROP TABLE IF EXISTS slow_query_analysis; DROP PROCEDURE IF EXISTS AnalyzeQueryPerformance; DROP PROCEDURE IF EXISTS BenchmarkQuery; DROP PROCEDURE IF EXISTS BatchDelete; DROP PROCEDURE IF EXISTS GenerateTestData; DROP TABLE IF EXISTS performance_test; DROP TABLE IF EXISTS users_perf; DROP TABLE IF EXISTS products_perf; SELECT 'Performance optimization tutorial completed. All example objects cleaned up.' AS message;
```
## MySQL 备份与恢复
### 备份概述
> 数据备份是数据库管理中最重要的任务之一。有效的备份策略可以保护数据免受硬件故障、人为错误、恶意攻击等威胁，确保业务连续性。

- 逻辑备份
导出 SQL 语句，可读性好，跨平台兼容，适合小到中型数据库

- 物理备份
直接复制数据文件，速度快，适合大型数据库

- 增量备份
只备份变更的数据，节省存储空间和时间

- 差异备份
备份自上次完整备份以来的所有变更

#### 备份策略的核心原则
- 3-2-1 原则：3份副本，2种不同媒介，1份异地存储
- 定期测试：定期验证备份的完整性和可恢复性
- 自动化：使用自动化工具减少人为错误
- 监控告警：建立备份监控和失败告警机制
- 文档记录：详细记录备份和恢复流程

| 备份类型 | 备份速度 | 恢复速度 | 存储空间 | 跨平台性 | 适用场景 |
| -------- | -------- | -------- | -------- | -------- | -------- |
| 逻辑备份 | 慢 | 慢 | 中等 | 优秀 | 小到中型数据库 |
| 物理备份 | 快 | 快 | 大 | 一般 | 大型数据库 |
| 增量备份 | 快 | 中等 | 小 | 中等 | 频繁变更的数据库 |
| 差异备份 | 中等 | 中等 | 中等 | 中等 | 平衡方案 |

### 逻辑备份 
#### 准备测试环境
```sql
-- 创建测试数据库和表 
CREATE DATABASE backup_demo; 
USE backup_demo; 
-- 创建用户表 
CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ); 
-- 创建订单表 
CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, order_number VARCHAR(50) NOT NULL UNIQUE, total_amount DECIMAL(10,2) NOT NULL, status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ); 
-- 创建产品表 
CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, stock_quantity INT DEFAULT 0, category VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); 
-- 插入测试数据 
INSERT INTO users (username, email, password_hash) VALUES ('alice', 'alice@example.com', 'hash1'), ('bob', 'bob@example.com', 'hash2'), ('charlie', 'charlie@example.com', 'hash3'), ('diana', 'diana@example.com', 'hash4'), ('eve', 'eve@example.com', 'hash5'); INSERT INTO products (name, description, price, stock_quantity, category) VALUES ('Laptop', 'High-performance laptop', 999.99, 50, 'Electronics'), ('Mouse', 'Wireless mouse', 29.99, 200, 'Electronics'), ('Keyboard', 'Mechanical keyboard', 79.99, 100, 'Electronics'), ('Monitor', '24-inch monitor', 199.99, 75, 'Electronics'), ('Headphones', 'Noise-cancelling headphones', 149.99, 120, 'Electronics'); INSERT INTO orders (user_id, order_number, total_amount, status) VALUES (1, 'ORD-001', 999.99, 'delivered'), (2, 'ORD-002', 109.98, 'shipped'), (3, 'ORD-003', 29.99, 'paid'), (1, 'ORD-004', 349.98, 'pending'), (4, 'ORD-005', 149.99, 'delivered'); 
-- 创建视图 
CREATE VIEW order_summary AS SELECT u.username, u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username, u.email; 
-- 创建存储过程 
DELIMITER // CREATE PROCEDURE GetUserOrders(IN user_id INT) BEGIN SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at FROM orders o WHERE o.user_id = user_id ORDER BY o.created_at DESC; END // DELIMITER ; 
-- 创建触发器 
DELIMITER // CREATE TRIGGER update_user_timestamp BEFORE UPDATE ON users FOR EACH ROW BEGIN SET NEW.updated_at = CURRENT_TIMESTAMP; END // DELIMITER ; SELECT 'Test database and data created successfully' AS message;
```
#### 使用 mysqldump 进行逻辑备份
```yaml
# 1. 完整数据库备份 
mysqldump -u root -p backup_demo > backup_demo_full.sql 
# 2. 备份特定表 
mysqldump -u root -p backup_demo users orders > backup_demo_tables.sql 
# 3. 只备份表结构（不包含数据） 
mysqldump -u root -p --no-data backup_demo > backup_demo_structure.sql 
# 4. 只备份数据（不包含表结构） 
mysqldump -u root -p --no-create-info backup_demo > backup_demo_data.sql 
# 5. 备份所有数据库 
mysqldump -u root -p --all-databases > all_databases_backup.sql 
# 6. 备份时包含存储过程、函数、触发器 
mysqldump -u root -p --routines --triggers backup_demo > backup_demo_complete.sql 
# 7. 压缩备份 
mysqldump -u root -p backup_demo | gzip > backup_demo.sql.gz 
# 8. 备份时添加时间戳 
mysqldump -u root -p backup_demo > backup_demo_$(date +%Y%m%d_%H%M%S).sql 
# 9. 备份大数据库（分块处理） 
mysqldump -u root -p --single-transaction --routines --triggers backup_demo > backup_demo_large.sql 
# 10. 远程备份 
mysqldump -h remote_host -u username -p database_name > remote_backup.sql 
# 11. 备份时排除特定表 
mysqldump -u root -p backup_demo --ignore-table=backup_demo.temp_table > backup_demo_exclude.sql 
# 12. 创建一致性备份（InnoDB） 
mysqldump -u root -p --single-transaction --flush-logs --master-data=2 backup_demo > backup_demo_consistent.sql
```
#### 高级 mysqldump 选项
```yaml
# 重要的 mysqldump 参数说明 # --single-transaction: 确保 InnoDB 表的一致性备份 # --flush-logs: 备份前刷新日志 # --master-data=2: 记录二进制日志位置（用于主从复制） # --routines: 包含存储过程和函数 # --triggers: 包含触发器 # --events: 包含事件调度器 # --hex-blob: 使用十六进制格式导出二进制数据 # --complete-insert: 生成完整的 INSERT 语句 # --extended-insert: 使用多行 INSERT 语法（默认启用） # --no-autocommit: 禁用自动提交 # --set-gtid-purged=OFF: 禁用 GTID 相关输出 # 生产环境推荐的备份命令 mysqldump -u backup_user -p \ --single-transaction \ --flush-logs \ --master-data=2 \ --routines \ --triggers \ --events \ --hex-blob \ --complete-insert \ --set-gtid-purged=OFF \ backup_demo > backup_demo_production.sql # 备份脚本示例 #!/bin/bash # backup_script.sh DB_NAME="backup_demo" DB_USER="root" DB_PASS="your_password" BACKUP_DIR="/backup/mysql" DATE=$(date +%Y%m%d_%H%M%S) BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql" # 创建备份目录 mkdir -p $BACKUP_DIR # 执行备份 mysqldump -u $DB_USER -p$DB_PASS \ --single-transaction \ --routines \ --triggers \ $DB_NAME > $BACKUP_FILE # 压缩备份文件 gzip $BACKUP_FILE # 删除7天前的备份 find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete echo "Backup completed: ${BACKUP_FILE}.gz"
```
#### 逻辑备份的恢复
```sql
-- 1. 恢复完整数据库 
-- 首先删除现有数据库（谨慎操作） 
DROP DATABASE IF EXISTS backup_demo; CREATE DATABASE backup_demo; 
-- 从备份文件恢复 -- 
mysql -u root -p backup_demo < backup_demo_full.sql 
-- 2. 恢复到新数据库 
CREATE DATABASE backup_demo_restored; -- 
mysql -u root -p backup_demo_restored < backup_demo_full.sql 
-- 3. 恢复特定表 -- 
mysql -u root -p backup_demo < backup_demo_tables.sql 
-- 4. 从压缩备份恢复 -- 
gunzip < backup_demo.sql.gz | mysql -u root -p backup_demo 
-- 5. 恢复时显示进度 -- 
pv backup_demo_full.sql | mysql -u root -p backup_demo 
-- 6. 部分恢复（只恢复特定表的数据） 
-- 从备份文件中提取特定表的 INSERT 语句 -- 
grep "INSERT INTO users" backup_demo_full.sql | mysql -u root -p backup_demo 
-- 验证恢复结果 
USE backup_demo; SELECT 'Users table:' as info; SELECT COUNT(*) as user_count FROM users; SELECT 'Orders table:' as info; SELECT COUNT(*) as order_count FROM orders; SELECT 'Products table:' as info; SELECT COUNT(*) as product_count FROM products; 
-- 检查视图是否正常 
-- 7. 检查索引是否正常 
SHOW INDEX FROM backup_demo.orders; -- 8. 检查约束是否正常 
SHOW CONSTRAINTS FROM backup_demo.orders; -- 9. 检查函数是否存在 
SHOW FUNCTION STATUS WHERE Db = 'backup_demo'; -- 10. 检查事件是否存在 
SHOW EVENTS FROM backup_demo; -- 11. 检查视图是否正常 
SELECT 'Order summary view:' as info; SELECT * FROM order_summary LIMIT 3; -- 检查存储过程是否存在 
SHOW PROCEDURE STATUS WHERE Db = 'backup_demo'; -- 检查触发器是否存在 
SHOW TRIGGERS FROM backup_demo;
```
### 物理备份
#### 使用文件系统备份
```yaml
# 1. 停机备份（最安全但需要停机） 
# 停止 MySQL 服务 
sudo systemctl stop mysql 
# 或者 
sudo service mysql stop 
# 复制数据目录 
sudo cp -R /var/lib/mysql /backup/mysql_physical_$(date +%Y%m%d_%H%M%S) 
# 启动 MySQL 服务 
sudo systemctl start mysql 
# 2. 热备份（使用 rsync，风险较高） 
# 注意：这种方法可能导致数据不一致，不推荐用于生产环境 
rsync -av /var/lib/mysql/ /backup/mysql_hot_backup/ 
# 3. 使用 LVM 快照备份（推荐） 
# 创建 LVM 快照 
sudo lvcreate -L 10G -s -n mysql_snapshot /dev/vg0/mysql_lv 
# 挂载快照 
sudo mkdir /mnt/mysql_snapshot sudo mount /dev/vg0/mysql_snapshot /mnt/mysql_snapshot 
# 从快照复制数据 
sudo cp -R /mnt/mysql_snapshot /backup/mysql_lvm_$(date +%Y%m%d_%H%M%S) 
# 卸载并删除快照 
sudo umount /mnt/mysql_snapshot sudo lvremove -f /dev/vg0/mysql_snapshot 
# 4. 查看 MySQL 数据目录位置 -- 在 MySQL 中执行 
SHOW VARIABLES LIKE 'datadir'; 
SHOW VARIABLES LIKE 'innodb_data_home_dir'; SHOW VARIABLES LIKE 'log_bin_basename';
```
#### 使用 MySQL Enterprise Backup (MEB)
```yaml
# MySQL Enterprise Backup 是 MySQL 企业版的官方物理备份工具 # 注意：这是商业版本的功能，社区版不包含 # 1. 完整备份 mysqlbackup --user=backup_user --password=password \ --backup-dir=/backup/meb_full_$(date +%Y%m%d_%H%M%S) \ backup-and-apply-log # 2. 增量备份 mysqlbackup --user=backup_user --password=password \ --backup-dir=/backup/meb_incremental_$(date +%Y%m%d_%H%M%S) \ --incremental \ --incremental-base=dir:/backup/meb_full_20240120_100000 \ backup # 3. 压缩备份 mysqlbackup --user=backup_user --password=password \ --backup-dir=/backup/meb_compressed_$(date +%Y%m%d_%H%M%S) \ --compress \ backup-and-apply-log # 4. 恢复备份 mysqlbackup --backup-dir=/backup/meb_full_20240120_100000 \ copy-back # 注意：社区版用户可以考虑使用 Percona XtraBackup 作为替代
```
#### 使用 Percona XtraBackup
```yaml
# Percona XtraBackup 是开源的 MySQL 物理备份工具 # 支持热备份，不需要停机 # 安装 Percona XtraBackup # Ubuntu/Debian: # sudo apt-get install percona-xtrabackup-80 # CentOS/RHEL: # sudo yum install percona-xtrabackup-80 # 1. 完整备份 xtrabackup --user=backup_user --password=password \ --backup \ --target-dir=/backup/xtrabackup_full_$(date +%Y%m%d_%H%M%S) # 2. 准备备份（应用日志） xtrabackup --prepare \ --target-dir=/backup/xtrabackup_full_20240120_100000 # 3. 增量备份 # 首先需要一个完整备份作为基础 xtrabackup --user=backup_user --password=password \ --backup \ --target-dir=/backup/xtrabackup_base # 第一次增量备份 xtrabackup --user=backup_user --password=password \ --backup \ --target-dir=/backup/xtrabackup_inc1 \ --incremental-basedir=/backup/xtrabackup_base # 第二次增量备份 xtrabackup --user=backup_user --password=password \ --backup \ --target-dir=/backup/xtrabackup_inc2 \ --incremental-basedir=/backup/xtrabackup_inc1 # 4. 准备增量备份 # 准备基础备份 xtrabackup --prepare --apply-log-only \ --target-dir=/backup/xtrabackup_base # 应用第一个增量备份 xtrabackup --prepare --apply-log-only \ --target-dir=/backup/xtrabackup_base \ --incremental-dir=/backup/xtrabackup_inc1 # 应用第二个增量备份 xtrabackup --prepare \ --target-dir=/backup/xtrabackup_base \ --incremental-dir=/backup/xtrabackup_inc2 # 5. 恢复备份 # 停止 MySQL 服务 sudo systemctl stop mysql # 清空数据目录 sudo rm -rf /var/lib/mysql/* # 恢复数据 xtrabackup --copy-back \ --target-dir=/backup/xtrabackup_base # 修改权限 sudo chown -R mysql:mysql /var/lib/mysql # 启动 MySQL 服务 sudo systemctl start mysql # 6. 压缩备份 xtrabackup --user=backup_user --password=password \ --backup \ --compress \ --target-dir=/backup/xtrabackup_compressed_$(date +%Y%m%d_%H%M%S) # 解压备份 xtrabackup --decompress \ --target-dir=/backup/xtrabackup_compressed_20240120_100000 # 删除压缩文件 find /backup/xtrabackup_compressed_20240120_100000 -name "*.qp" -delete
```
### 二进制日志备份
#### 配置二进制日志
```sql
-- 查看二进制日志配置 
SHOW VARIABLES LIKE 'log_bin%'; 
SHOW VARIABLES LIKE 'binlog%'; 
SHOW VARIABLES LIKE 'expire_logs_days'; 
-- 查看二进制日志文件 
SHOW BINARY LOGS; 
-- 查看当前二进制日志位置 
SHOW MASTER STATUS; 
-- 查看二进制日志内容 -- 
SHOW BINLOG EVENTS IN 'mysql-bin.000001'; 
-- 配置二进制日志（在 my.cnf 中） -- 
[mysqld] -- log-bin=mysql-bin -- binlog-format=ROW -- expire-logs-days=7 -- max-binlog-size=100M -- sync-binlog=1 -- 手动刷新二进制日志 FLUSH BINARY LOGS; -- 清理旧的二进制日志 -- PURGE BINARY LOGS TO 'mysql-bin.000010'; -- PURGE BINARY LOGS BEFORE '2024-01-01 00:00:00';
```
#### 使用二进制日志进行点时间恢复
```yaml
# 1. 模拟数据变更和误操作 # 首先记录当前时间和二进制日志位置 mysql -u root -p -e "SHOW MASTER STATUS;" echo "Current time: $(date)" # 在 MySQL 中执行一些操作 mysql -u root -p backup_demo << EOF -- 插入一些新数据 INSERT INTO users (username, email, password_hash) VALUES ('frank', 'frank@example.com', 'hash6'), ('grace', 'grace@example.com', 'hash7'); -- 更新一些数据 UPDATE products SET price = price * 1.1 WHERE category = 'Electronics'; -- 记录这个时间点 SELECT NOW() as 'Good state timestamp'; EOF # 等待一段时间，然后模拟误操作 sleep 5 mysql -u root -p backup_demo << EOF -- 误删除数据（模拟事故） DELETE FROM users WHERE username IN ('frank', 'grace'); DROP TABLE products; SELECT NOW() as 'Accident timestamp'; EOF # 2. 点时间恢复过程 # 首先从完整备份恢复 mysql -u root -p << EOF DROP DATABASE IF EXISTS backup_demo; CREATE DATABASE backup_demo; EOF # 恢复完整备份 mysql -u root -p backup_demo < backup_demo_full.sql # 3. 使用 mysqlbinlog 恢复到特定时间点 # 找到需要恢复的二进制日志文件 mysql -u root -p -e "SHOW BINARY LOGS;" # 查看二进制日志内容，找到误操作的时间点 mysqlbinlog /var/lib/mysql/mysql-bin.000001 | grep -A 5 -B 5 "DELETE FROM users" # 恢复到误操作之前的时间点 # 假设误操作发生在 2024-01-20 14:30:00 mysqlbinlog --stop-datetime="2024-01-20 14:30:00" \ /var/lib/mysql/mysql-bin.000001 | mysql -u root -p backup_demo # 4. 基于位置的恢复（更精确） # 查看特定位置的日志 mysqlbinlog --start-position=1000 --stop-position=2000 \ /var/lib/mysql/mysql-bin.000001 # 恢复到特定位置 mysqlbinlog --stop-position=1500 \ /var/lib/mysql/mysql-bin.000001 | mysql -u root -p backup_demo # 5. 跳过特定事务 # 如果需要跳过某个有问题的事务 mysqlbinlog --start-position=1000 --stop-position=1400 \ /var/lib/mysql/mysql-bin.000001 | mysql -u root -p backup_demo mysqlbinlog --start-position=1600 \ /var/lib/mysql/mysql-bin.000001 | mysql -u root -p backup_demo
```
#### 二进制日志管理脚本
```bash
#!/bin/bash 
# binlog_backup.sh - 二进制日志备份脚本 
MYSQL_USER="root" MYSQL_PASS="your_password" BACKUP_DIR="/backup/binlogs" DATE=$(date +%Y%m%d_%H%M%S) 
# 创建备份目录 
mkdir -p $BACKUP_DIR 
# 获取当前二进制日志文件列表 
mysql -u $MYSQL_USER -p$MYSQL_PASS -e "SHOW BINARY LOGS;" | \ awk 'NR>1 {print $1}' > /tmp/binlog_list.txt 
# 刷新二进制日志，生成新的日志文件 
mysql -u $MYSQL_USER -p$MYSQL_PASS -e "FLUSH BINARY LOGS;" 
# 备份除最新文件外的所有二进制日志 
while read binlog_file; 
do if [ "$binlog_file" != "$(tail -1 /tmp/binlog_list.txt)" ]; 
then cp /var/lib/mysql/$binlog_file $BACKUP_DIR/ echo "Backed up: $binlog_file" fi done < /tmp/binlog_list.txt 
# 压缩备份的二进制日志 
cd $BACKUP_DIR tar -czf binlogs_$DATE.tar.gz mysql-bin.* rm -f mysql-bin.* 
# 清理旧的备份（保留30天） 
find $BACKUP_DIR -name "binlogs_*.tar.gz" -mtime +30 -delete echo "Binary log backup completed: binlogs_$DATE.tar.gz" 
# 清理 MySQL 中的旧二进制日志（保留7天） 
mysql -u $MYSQL_USER -p$MYSQL_PASS -e \ "PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 7 DAY);" rm -f /tmp/binlog_list.txt
```
### 备份策略和自动化
#### 备份策略设计
- 每日策略
增量备份 + 二进制日志备份

- 每周策略
差异备份 + 备份验证

- 每月策略
完整备份 + 异地存储

- 实时策略
主从复制 + 读写分离

| 时间 | 备份类型 | 备份方法 | 保留期限 | 存储位置 |
| --- | --- | --- | --- | --- |
| 每天 02:00 | 增量备份 | XtraBackup | 7天 | 本地存储 |
| 每天 03:00 | 二进制日志 | mysqlbinlog | 30天 | 本地存储 |
| 每周日 01:00 | 完整备份 | mysqldump | 4周 | 本地 + 远程 |
| 每月1日 00:00 | 完整备份 | XtraBackup | 12个月 | 异地存储 |
| 实时 | 主从复制 | MySQL Replication | 持续 | 从服务器 |
#### 自动化备份脚本
```bash
#!/bin/bash 
# comprehensive_backup.sh - 综合备份脚本 
# 配置参数 MYSQL_USER="backup_user" MYSQL_PASS="backup_password" MYSQL_HOST="localhost" BACKUP_BASE_DIR="/backup/mysql" LOG_FILE="/var/log/mysql_backup.log" EMAIL_ALERT="admin@example.com" RETENTION_DAYS=30 # 创建日期标识 DATE=$(date +%Y%m%d_%H%M%S) DAY_OF_WEEK=$(date +%u) # 1=Monday, 7=Sunday DAY_OF_MONTH=$(date +%d) # 日志函数 log_message() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE } # 错误处理函数 handle_error() { log_message "ERROR: $1" echo "Backup failed: $1" | mail -s "MySQL Backup Failed" $EMAIL_ALERT exit 1 } # 检查 MySQL 连接 check_mysql_connection() { mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1;" > /dev/null 2>&1 if [ $? -ne 0 ]; then handle_error "Cannot connect to MySQL server" fi } # 创建备份目录 create_backup_dirs() { mkdir -p $BACKUP_BASE_DIR/{daily,weekly,monthly,binlogs} if [ $? -ne 0 ]; then handle_error "Cannot create backup directories" fi } # 每日增量备份 daily_backup() { log_message "Starting daily incremental backup" DAILY_DIR="$BACKUP_BASE_DIR/daily/$DATE" mkdir -p $DAILY_DIR # 使用 XtraBackup 进行增量备份 if [ -d "$BACKUP_BASE_DIR/weekly/latest" ]; then BASE_DIR="$BACKUP_BASE_DIR/weekly/latest" else # 如果没有周备份，创建完整备份 BASE_DIR="$DAILY_DIR" xtrabackup --user=$MYSQL_USER --password=$MYSQL_PASS \ --backup --target-dir=$BASE_DIR fi if [ "$BASE_DIR" != "$DAILY_DIR" ]; then xtrabackup --user=$MYSQL_USER --password=$MYSQL_PASS \ --backup --target-dir=$DAILY_DIR \ --incremental-basedir=$BASE_DIR fi if [ $? -eq 0 ]; then log_message "Daily backup completed successfully" else handle_error "Daily backup failed" fi } # 每周完整备份 weekly_backup() { log_message "Starting weekly full backup" WEEKLY_DIR="$BACKUP_BASE_DIR/weekly/$DATE" mkdir -p $WEEKLY_DIR # 使用 mysqldump 进行逻辑备份 mysqldump -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS \ --single-transaction --routines --triggers --events \ --all-databases | gzip > $WEEKLY_DIR/full_backup.sql.gz if [ $? -eq 0 ]; then # 创建符号链接指向最新备份 ln -sfn $WEEKLY_DIR $BACKUP_BASE_DIR/weekly/latest log_message "Weekly backup completed successfully" else handle_error "Weekly backup failed" fi } # 每月归档备份 monthly_backup() { log_message "Starting monthly archive backup" MONTHLY_DIR="$BACKUP_BASE_DIR/monthly/$DATE" mkdir -p $MONTHLY_DIR # 使用 XtraBackup 进行物理备份 xtrabackup --user=$MYSQL_USER --password=$MYSQL_PASS \ --backup --compress --target-dir=$MONTHLY_DIR if [ $? -eq 0 ]; then log_message "Monthly backup completed successfully" # 上传到远程存储（示例：rsync 到远程服务器） # rsync -av $MONTHLY_DIR/ backup-server:/remote/backup/mysql/ else handle_error "Monthly backup failed" fi } # 二进制日志备份 binlog_backup() { log_message "Starting binary log backup" BINLOG_DIR="$BACKUP_BASE_DIR/binlogs/$DATE" mkdir -p $BINLOG_DIR # 获取二进制日志文件列表 mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS \ -e "SHOW BINARY LOGS;" | awk 'NR>1 {print $1}' > /tmp/binlog_list.txt # 刷新日志 mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "FLUSH BINARY LOGS;" # 备份二进制日志文件 while read binlog_file; do if [ -f "/var/lib/mysql/$binlog_file" ]; then cp /var/lib/mysql/$binlog_file $BINLOG_DIR/ fi done < /tmp/binlog_list.txt # 压缩备份 cd $BINLOG_DIR && tar -czf ../binlogs_$DATE.tar.gz . rm -rf $BINLOG_DIR log_message "Binary log backup completed" rm -f /tmp/binlog_list.txt } # 清理旧备份 cleanup_old_backups() { log_message "Cleaning up old backups" # 清理每日备份（保留7天） find $BACKUP_BASE_DIR/daily -type d -mtime +7 -exec rm -rf {} + # 清理每周备份（保留4周） find $BACKUP_BASE_DIR/weekly -type d -mtime +28 -exec rm -rf {} + # 清理二进制日志备份（保留30天） find $BACKUP_BASE_DIR/binlogs -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete log_message "Cleanup completed" } # 验证备份 verify_backup() { log_message "Verifying backup integrity" # 检查最新的备份文件 LATEST_BACKUP=$(find $BACKUP_BASE_DIR -name "*.sql.gz" -o -name "*.tar.gz" | \ sort -r | head -1) if [ -n "$LATEST_BACKUP" ]; then # 检查文件完整性 if file $LATEST_BACKUP | grep -q "gzip compressed"; then gzip -t $LATEST_BACKUP if [ $? -eq 0 ]; then log_message "Backup verification passed: $LATEST_BACKUP" else handle_error "Backup verification failed: $LATEST_BACKUP" fi fi fi } # 发送成功通知 send_success_notification() { BACKUP_SIZE=$(du -sh $BACKUP_BASE_DIR | cut -f1) echo "MySQL backup completed successfully. Total backup size: $BACKUP_SIZE Date: $(date)" | \ mail -s "MySQL Backup Success" $EMAIL_ALERT } # 主执行流程 main() { log_message "Starting MySQL backup process" check_mysql_connection create_backup_dirs # 根据日期决定备份类型 if [ $DAY_OF_MONTH -eq 1 ]; then # 每月1日执行月备份 monthly_backup elif [ $DAY_OF_WEEK -eq 7 ]; then # 每周日执行周备份 weekly_backup else # 其他时间执行日备份 daily_backup fi # 每天都执行二进制日志备份 binlog_backup # 清理旧备份 cleanup_old_backups # 验证备份 verify_backup # 发送成功通知 send_success_notification log_message "MySQL backup process completed successfully" } # 执行主函数 main
```
#### 使用 Crontab 调度备份
```bash
# 编辑 crontab crontab -e # 添加以下备份任务 # 每天凌晨2点执行备份 0 2 * * * /path/to/comprehensive_backup.sh >> /var/log/mysql_backup_cron.log 2>&1 # 每周日凌晨1点执行完整备份 0 1 * * 0 /path/to/weekly_full_backup.sh >> /var/log/mysql_backup_cron.log 2>&1 # 每月1日凌晨0点执行月度备份 0 0 1 * * /path/to/monthly_backup.sh >> /var/log/mysql_backup_cron.log 2>&1 # 每小时备份二进制日志 0 * * * * /path/to/binlog_backup.sh >> /var/log/mysql_backup_cron.log 2>&1 # 查看 crontab 任务 crontab -l # 监控 cron 日志 tail -f /var/log/mysql_backup_cron.log # 备份脚本权限设置 chmod +x /path/to/comprehensive_backup.sh chmod +x /path/to/weekly_full_backup.sh chmod +x /path/to/monthly_backup.sh chmod +x /path/to/binlog_backup.sh # 创建专用的备份用户 mysql -u root -p << EOF CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'strong_password'; GRANT SELECT, SHOW DATABASES, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER, RELOAD, REPLICATION CLIENT ON *.* TO 'backup_user'@'localhost'; FLUSH PRIVILEGES; EOF
```
### 灾难恢复
#### 灾难恢复步骤
- 评估损失：确定数据丢失的范围和原因
- 停止服务：防止进一步的数据损坏
- 准备环境：准备恢复所需的硬件和软件环境
- 恢复数据：按照恢复计划执行数据恢复
- 验证数据：检查恢复数据的完整性和一致性
- 测试应用：验证应用程序功能正常
- 恢复服务：重新启动生产服务
- 监控系统：密切监控系统运行状态
- 总结经验：分析事故原因，改进备份策略
#### 完整的灾难恢复示例
```bash
#!/bin/bash 
# disaster_recovery.sh - 灾难恢复脚本 
# 配置参数 MYSQL_USER="root" MYSQL_PASS="recovery_password" BACKUP_DIR="/backup/mysql" RECOVERY_LOG="/var/log/mysql_recovery.log" TARGET_TIME="2024-01-20 14:30:00" # 恢复到的目标时间 # 日志函数 log_message() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $RECOVERY_LOG } # 第1步：停止 MySQL 服务 stop_mysql() { log_message "Stopping MySQL service" sudo systemctl stop mysql if [ $? -eq 0 ]; then log_message "MySQL service stopped successfully" else log_message "Failed to stop MySQL service" exit 1 fi } # 第2步：备份当前损坏的数据（如果可能） backup_corrupted_data() { log_message "Backing up corrupted data for analysis" CORRUPTED_BACKUP_DIR="/backup/corrupted_$(date +%Y%m%d_%H%M%S)" mkdir -p $CORRUPTED_BACKUP_DIR if [ -d "/var/lib/mysql" ]; then cp -R /var/lib/mysql $CORRUPTED_BACKUP_DIR/ log_message "Corrupted data backed up to $CORRUPTED_BACKUP_DIR" fi } # 第3步：清理数据目录 clean_data_directory() { log_message "Cleaning MySQL data directory" sudo rm -rf /var/lib/mysql/* sudo mkdir -p /var/lib/mysql sudo chown mysql:mysql /var/lib/mysql log_message "Data directory cleaned" } # 第4步：恢复基础备份 restore_base_backup() { log_message "Restoring base backup" # 查找最新的完整备份 LATEST_FULL_BACKUP=$(find $BACKUP_DIR/weekly -name "full_backup.sql.gz" | sort -r | head -1) if [ -z "$LATEST_FULL_BACKUP" ]; then log_message "No full backup found" exit 1 fi log_message "Using backup: $LATEST_FULL_BACKUP" # 启动 MySQL（临时） sudo systemctl start mysql sleep 10 # 恢复备份 gunzip < $LATEST_FULL_BACKUP | mysql -u $MYSQL_USER -p$MYSQL_PASS if [ $? -eq 0 ]; then log_message "Base backup restored successfully" else log_message "Failed to restore base backup" exit 1 fi } # 第5步：应用二进制日志进行点时间恢复 apply_binlog_recovery() { log_message "Applying binary log for point-in-time recovery" # 查找需要应用的二进制日志文件 BINLOG_FILES=$(find $BACKUP_DIR/binlogs -name "*.tar.gz" | sort) for binlog_archive in $BINLOG_FILES; do log_message "Processing binlog archive: $binlog_archive" # 解压二进制日志 TEMP_DIR="/tmp/binlog_recovery_$(date +%s)" mkdir -p $TEMP_DIR tar -xzf $binlog_archive -C $TEMP_DIR # 应用二进制日志到目标时间 for binlog_file in $TEMP_DIR/mysql-bin.*; do if [ -f "$binlog_file" ]; then mysqlbinlog --stop-datetime="$TARGET_TIME" $binlog_file | \ mysql -u $MYSQL_USER -p$MYSQL_PASS fi done # 清理临时文件 rm -rf $TEMP_DIR done log_message "Binary log recovery completed" } # 第6步：验证恢复结果 verify_recovery() { log_message "Verifying recovery results" # 检查数据库连接 mysql -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1;" > /dev/null 2>&1 if [ $? -ne 0 ]; then log_message "Cannot connect to MySQL after recovery" exit 1 fi # 检查关键表的数据 mysql -u $MYSQL_USER -p$MYSQL_PASS -e " SELECT 'Database recovery verification' as status; SHOW DATABASES; USE backup_demo; SELECT COUNT(*) as user_count FROM users; SELECT COUNT(*) as order_count FROM orders; SELECT COUNT(*) as product_count FROM products; " log_message "Recovery verification completed" } # 第7步：重启服务 restart_services() { log_message "Restarting MySQL service" sudo systemctl restart mysql if [ $? -eq 0 ]; then log_message "MySQL service restarted successfully" else log_message "Failed to restart MySQL service" exit 1 fi } # 主恢复流程 main_recovery() { log_message "Starting disaster recovery process" stop_mysql backup_corrupted_data clean_data_directory restore_base_backup apply_binlog_recovery verify_recovery restart_services log_message "Disaster recovery completed successfully" } # 执行恢复 main_recovery
```
#### 恢复测试和验证
```sql
-- 创建恢复测试脚本 
DELIMITER // CREATE PROCEDURE TestRecovery() BEGIN DECLARE user_count INT; DECLARE order_count INT; DECLARE product_count INT; DECLARE test_result VARCHAR(100); -- 检查数据完整性 SELECT COUNT(*) INTO user_count FROM users; SELECT COUNT(*) INTO order_count FROM orders; SELECT COUNT(*) INTO product_count FROM products; -- 验证数据一致性 IF user_count > 0 AND order_count > 0 AND product_count > 0 THEN SET test_result = 'Recovery test PASSED'; ELSE SET test_result = 'Recovery test FAILED'; END IF; -- 输出测试结果 SELECT test_result as result, user_count as users, order_count as orders, product_count as products, NOW() as test_time; -- 检查外键约束 SELECT 'Foreign key check:' as info; SELECT o.id, o.user_id, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE u.id IS NULL LIMIT 5; -- 检查数据范围 SELECT 'Data range check:' as info; SELECT MIN(created_at) as earliest_record, MAX(created_at) as latest_record FROM users; END // DELIMITER ; -- 执行恢复测试 CALL TestRecovery(); -- 性能测试 SET @start_time = NOW(6); SELECT u.username, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username; SET @end_time = NOW(6); SELECT 'Performance test' as test_type, TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000 as execution_time_ms; -- 清理测试对象 DROP PROCEDURE IF EXISTS TestRecovery;
```
### 最佳实践和注意事项
#### 备份最佳实践
- 定期测试恢复：至少每月测试一次完整的恢复流程
- 多层备份策略：结合逻辑备份、物理备份和实时复制
- 异地存储：重要备份必须存储在不同地理位置
- 自动化监控：建立备份成功/失败的自动告警机制
- 文档化流程：详细记录备份和恢复的操作步骤
- 权限控制：严格控制备份文件的访问权限
- 加密保护：对敏感数据的备份进行加密
#### 常见错误和注意事项
- 备份未测试：备份文件损坏或无法恢复时才发现
- 权限问题：恢复时文件权限不正确导致 MySQL 无法启动
- 版本不兼容：不同 MySQL 版本间的备份恢复兼容性问题
- 磁盘空间不足：恢复时目标磁盘空间不够
- 字符集问题：备份和恢复时字符集设置不一致
- 时区问题：时间戳数据在不同时区间的转换问题
- 依赖关系：忽略外键约束和触发器的恢复顺序
#### 备份安全和合规
```bash
# 1. 备份文件加密 # 使用 GPG 加密备份文件 mysqldump -u root -p backup_demo | gzip | \ gpg --cipher-algo AES256 --compress-algo 2 --symmetric \ --output backup_demo_encrypted_$(date +%Y%m%d).sql.gz.gpg # 解密备份文件 gpg --decrypt backup_demo_encrypted_20240120.sql.gz.gpg | \ gunzip | mysql -u root -p backup_demo_restored # 2. 使用 OpenSSL 加密 mysqldump -u root -p backup_demo | \ openssl enc -aes-256-cbc -salt -out backup_demo_ssl_$(date +%Y%m%d).sql.enc # 解密 OpenSSL 备份 openssl enc -aes-256-cbc -d -in backup_demo_ssl_20240120.sql.enc | \ mysql -u root -p backup_demo_restored # 3. 备份文件完整性校验 # 创建校验和 sha256sum backup_demo_full.sql > backup_demo_full.sql.sha256 # 验证校验和 sha256sum -c backup_demo_full.sql.sha256 # 4. 安全的备份传输 # 使用 rsync over SSH rsync -avz -e ssh /backup/mysql/ user@backup-server:/remote/backup/mysql/ # 使用 scp 传输 scp backup_demo_full.sql.gz user@backup-server:/remote/backup/ # 5. 备份访问日志 # 记录备份文件访问 auditctl -w /backup/mysql -p rwxa -k mysql_backup_access # 查看访问日志 ausearch -k mysql_backup_access
```
```sql
-- 清理示例数据和对象 
DROP DATABASE IF EXISTS backup_demo; SELECT 'Backup and recovery tutorial completed. All example objects cleaned up.' AS message;
```
## MySQL 主从复制

### 主从复制概述
> MySQL 主从复制是一种数据同步技术，通过将主服务器（Master）的数据变更自动复制到一个或多个从服务器（Slave），实现数据的高可用性、读写分离和负载均衡。

- 异步复制
主服务器不等待从服务器确认，性能最好但可能丢失数据

- 半同步复制
主服务器等待至少一个从服务器确认，平衡性能和安全性

- 同步复制
主服务器等待所有从服务器确认，最安全但性能较低

- 基于语句复制
复制 SQL 语句，日志文件小但可能不一致

- 基于行复制
复制数据行变更，确保一致性但日志文件大

- 混合复制
自动选择最优复制方式，兼顾性能和一致性

主从复制框架图
![主从复制框架图](img/mysql07-1.jpg)

数据流向：主服务器 → 二进制日志 → 从服务器中继日志 → 从服务器数据

#### 主从复制的优势：
- 高可用性：主服务器故障时可快速切换到从服务器
- 读写分离：主服务器处理写操作，从服务器处理读操作
- 负载均衡：分散读取负载到多个从服务器
- 数据备份：从服务器作为实时数据备份
- 数据分析：在从服务器上进行报表和分析，不影响主服务器性能
- 地理分布：在不同地理位置部署从服务器，提高访问速度

### 主从复制配置
#### 准备测试环境
```sql
-- 创建复制测试数据库 
CREATE DATABASE replication_demo; USE replication_demo; 
-- 创建测试表 CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ); CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, order_number VARCHAR(50) NOT NULL UNIQUE, total_amount DECIMAL(10,2) NOT NULL, status ENUM('pending', 'paid', 'shipped', 'delivered') DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ); -- 插入测试数据 INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com'), ('bob', 'bob@example.com'), ('charlie', 'charlie@example.com'); INSERT INTO orders (user_id, order_number, total_amount, status) VALUES (1, 'ORD-001', 99.99, 'paid'), (2, 'ORD-002', 149.99, 'shipped'), (3, 'ORD-003', 79.99, 'pending'); SELECT 'Test data created successfully' AS message;
```
#### 主服务器配置
1. 修改主服务器配置文件 (my.cnf)
```bash
# /etc/mysql/my.cnf 或 /etc/my.cnf 
[mysqld] 
# 服务器唯一标识 
server-id = 1 
# 启用二进制日志 
log-bin = mysql-bin binlog-format = ROW 
# 推荐使用 ROW 格式 
# 二进制日志过期时间（天） 
expire-logs-days = 7 
# 二进制日志文件大小 
max-binlog-size = 100M 
# 同步二进制日志到磁盘 
sync-binlog = 1 
# 指定要复制的数据库（可选） 
# binlog-do-db = replication_demo 
# 指定不复制的数据库（可选） 
# binlog-ignore-db = mysql 
# binlog-ignore-db = information_schema 
# binlog-ignore-db = performance_schema 
# binlog-ignore-db = sys 
# InnoDB 设置 
innodb-flush-log-at-trx-commit = 1 innodb-support-xa = 1 
# 半同步复制插件（可选） 
# plugin-load = "rpl_semi_sync_master=semisync_master.so" # rpl-semi-sync-master-enabled = 1 
# rpl-semi-sync-master-timeout = 1000
```
```sql
-- 2. 重启 MySQL 服务 -- 
sudo systemctl restart mysql 
-- 3. 创建复制用户 
CREATE USER 'replication_user'@'%' IDENTIFIED BY 'strong_password'; GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%'; 
FLUSH PRIVILEGES; 
-- 4. 查看主服务器状态 
SHOW MASTER STATUS; 
-- 5. 锁定表（可选，用于一致性备份） 
-- FLUSH TABLES WITH READ LOCK; 
-- 6. 备份主服务器数据 
-- mysqldump -u root -p --all-databases --master-data=2 > master_backup.sql 
-- 7. 解锁表 
-- UNLOCK TABLES; 
-- 查看二进制日志文件 
SHOW BINARY LOGS; 
-- 查看二进制日志事件 
SHOW BINLOG EVENTS IN 'mysql-bin.000001' LIMIT 10;
```
#### 从服务器配置
1. 修改从服务器配置文件 (my.cnf)
```bash
# /etc/mysql/my.cnf 或 /etc/my.cnf 
[mysqld] 
# 服务器唯一标识（必须与主服务器不同） 
server-id = 2 
# 启用中继日志 
relay-log = mysql-relay-bin 
# 从服务器只读（推荐） 
read-only = 1 
# 超级用户可以在只读模式下写入 
super-read-only = 0 
# 指定要复制的数据库（可选） 
# replicate-do-db = replication_demo 
# 指定不复制的数据库（可选） 
# replicate-ignore-db = mysql 
# replicate-ignore-db = information_schema 
# replicate-ignore-db = performance_schema 
# replicate-ignore-db = sys 
# 跳过特定错误（谨慎使用） 
# slave-skip-errors = 1062,1053 
# 中继日志自动清理 
relay-log-purge = 1 
# 半同步复制插件（可选） 
# plugin-load = "rpl_semi_sync_slave=semisync_slave.so" 
# rpl-semi-sync-slave-enabled = 1 
# 并行复制（MySQL 5.7+） 
slave-parallel-type = LOGICAL_CLOCK slave-parallel-workers = 4
```
```sql
-- 2. 重启从服务器 MySQL 服务 -- 
sudo systemctl restart mysql 
-- 3. 恢复主服务器数据到从服务器 -- 
mysql -u root -p < master_backup.sql 
-- 4. 配置主从复制 
CHANGE MASTER TO MASTER_HOST = '192.168.1.100', -- 主服务器IP 
MASTER_PORT = 3306, MASTER_USER = 'replication_user', MASTER_PASSWORD = 'strong_password', MASTER_LOG_FILE = 'mysql-bin.000001', -- 从主服务器状态获取 
MASTER_LOG_POS = 154; -- 从主服务器状态获取 
-- 5. 启动从服务器复制 
START SLAVE; 
-- 6. 检查从服务器状态 
SHOW SLAVE STATUS\G 
-- 重要字段说明： 
-- Slave_IO_Running: Yes -- IO线程运行状态 
-- Slave_SQL_Running: Yes -- SQL线程运行状态 
-- Seconds_Behind_Master: 0 -- 复制延迟（秒） 
-- Last_IO_Error: -- IO错误信息 -- Last_SQL_Error: -- SQL错误信息 
-- 7. 测试复制 
-- 在主服务器上执行： -- 
INSERT INTO replication_demo.users (username, email) VALUES ('test_user', 'test@example.com'); 
-- 在从服务器上检查： -- 
SELECT * FROM replication_demo.users WHERE username = 'test_user';
```
### 复制监控和管理
#### 复制状态监控
```sql
-- 主服务器监控 -- 查看主服务器状态 SHOW MASTER STATUS; -- 查看连接的从服务器 SHOW SLAVE HOSTS; -- 查看二进制日志状态 SHOW BINARY LOGS; -- 查看主服务器变量 SHOW VARIABLES LIKE 'log_bin%'; SHOW VARIABLES LIKE 'binlog%'; SHOW VARIABLES LIKE 'server_id'; -- 从服务器监控 -- 查看从服务器详细状态 SHOW SLAVE STATUS\G -- 关键监控指标 SELECT 'Replication Status' as metric_type, 'IO Thread' as component, IF(Slave_IO_Running = 'Yes', 'Running', 'Stopped') as status FROM ( SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(@@global.slave_status, 'Slave_IO_Running: ', -1), '\n', 1) as Slave_IO_Running ) t UNION ALL SELECT 'Replication Status', 'SQL Thread', 'Check SHOW SLAVE STATUS'; -- 创建复制监控视图 CREATE VIEW replication_monitor AS SELECT 'Replication Health Check' as report_type, NOW() as check_time, @@server_id as server_id, @@read_only as read_only_status, @@log_bin as binary_log_enabled; SELECT * FROM replication_monitor; -- 复制延迟监控 DELIMITER // CREATE PROCEDURE CheckReplicationLag() BEGIN DECLARE lag_seconds INT; DECLARE io_running VARCHAR(10); DECLARE sql_running VARCHAR(10); -- 注意：这个存储过程需要在从服务器上执行 -- 实际环境中需要通过 SHOW SLAVE STATUS 获取这些值 SELECT 'Replication lag monitoring' as info; SELECT 'Use SHOW SLAVE STATUS to check:' as instruction; SELECT 'Seconds_Behind_Master, Slave_IO_Running, Slave_SQL_Running' as key_fields; -- 示例告警逻辑 SET lag_seconds = 0; -- 从 SHOW SLAVE STATUS 获取 IF lag_seconds > 60 THEN SELECT 'WARNING: Replication lag > 60 seconds' as alert; ELSEIF lag_seconds > 10 THEN SELECT 'CAUTION: Replication lag > 10 seconds' as alert; ELSE SELECT 'OK: Replication lag is acceptable' as alert; END IF; END // DELIMITER ; CALL CheckReplicationLag();
```
#### 复制故障排除
```sql
-- 常见复制问题诊断 -- 1. 检查复制线程状态 SHOW SLAVE STATUS\G -- 2. 查看错误日志 -- tail -f /var/log/mysql/error.log -- 3. 重启复制（当出现错误时） STOP SLAVE; START SLAVE; -- 4. 跳过错误事务（谨慎使用） -- 当遇到特定错误需要跳过时 STOP SLAVE; SET GLOBAL sql_slave_skip_counter = 1; START SLAVE; -- 5. 重新同步从服务器 -- 当数据不一致时，重新从主服务器同步 STOP SLAVE; RESET SLAVE; -- 重新获取主服务器状态 -- 在主服务器上执行：SHOW MASTER STATUS; -- 重新配置复制 CHANGE MASTER TO MASTER_HOST = '192.168.1.100', MASTER_USER = 'replication_user', MASTER_PASSWORD = 'strong_password', MASTER_LOG_FILE = 'mysql-bin.000002', -- 新的日志文件 MASTER_LOG_POS = 1024; -- 新的位置 START SLAVE; -- 6. 检查网络连接 -- 在从服务器上测试到主服务器的连接 -- mysql -h 192.168.1.100 -u replication_user -p -- 7. 检查磁盘空间 SHOW VARIABLES LIKE 'datadir'; -- df -h /var/lib/mysql -- 8. 检查二进制日志 SHOW BINARY LOGS; SHOW BINLOG EVENTS IN 'mysql-bin.000001' LIMIT 5; -- 9. 复制一致性检查 -- 使用 pt-table-checksum 工具（Percona Toolkit） -- pt-table-checksum --host=master_host --databases=replication_demo -- 10. 创建复制健康检查脚本 DELIMITER // CREATE PROCEDURE ReplicationHealthCheck() BEGIN DECLARE done INT DEFAULT FALSE; DECLARE check_result TEXT DEFAULT ''; -- 检查服务器角色 IF @@read_only = 1 THEN SET check_result = CONCAT(check_result, 'Server Role: Slave\n'); -- 这里应该检查 SHOW SLAVE STATUS 的结果 SET check_result = CONCAT(check_result, 'Slave Status: Check SHOW SLAVE STATUS\n'); ELSE SET check_result = CONCAT(check_result, 'Server Role: Master\n'); -- 检查二进制日志 IF @@log_bin = 1 THEN SET check_result = CONCAT(check_result, 'Binary Log: Enabled\n'); ELSE SET check_result = CONCAT(check_result, 'Binary Log: Disabled\n'); END IF; END IF; -- 输出检查结果 SELECT check_result as health_check_result; -- 显示当前配置 SELECT @@server_id as server_id, @@read_only as read_only, @@log_bin as log_bin_enabled, @@binlog_format as binlog_format; END // DELIMITER ; CALL ReplicationHealthCheck();
```
#### 复制性能优化
```sql
-- 复制性能优化配置 -- 1. 并行复制配置（MySQL 5.7+） -- 在从服务器上配置 STOP SLAVE; -- 设置并行复制 SET GLOBAL slave_parallel_type = 'LOGICAL_CLOCK'; SET GLOBAL slave_parallel_workers = 4; -- 根据CPU核心数调整 SET GLOBAL slave_preserve_commit_order = 1; START SLAVE; -- 2. 二进制日志优化 -- 在主服务器上配置 SET GLOBAL sync_binlog = 1; -- 安全性优先 -- SET GLOBAL sync_binlog = 0; -- 性能优先（有风险） SET GLOBAL binlog_cache_size = 1048576; -- 1MB SET GLOBAL max_binlog_cache_size = 4294967296; -- 4GB -- 3. 中继日志优化 -- 在从服务器上配置 SET GLOBAL relay_log_purge = 1; -- 自动清理中继日志 SET GLOBAL relay_log_space_limit = 1073741824; -- 1GB -- 4. 网络优化 SET GLOBAL slave_net_timeout = 60; -- 网络超时时间 SET GLOBAL slave_compressed_protocol = 1; -- 启用压缩（高延迟网络） -- 5. 监控复制性能 SHOW STATUS LIKE 'Slave_running'; SHOW STATUS LIKE 'Slave_retried_transactions'; SHOW STATUS LIKE 'Slave_heartbeat_period'; -- 查看复制相关的状态变量 SHOW STATUS LIKE '%slave%'; SHOW STATUS LIKE '%master%'; -- 6. 创建性能监控表 CREATE TABLE replication_performance_log ( id INT AUTO_INCREMENT PRIMARY KEY, server_id INT, lag_seconds INT, io_thread_status VARCHAR(20), sql_thread_status VARCHAR(20), last_error TEXT, check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 性能监控存储过程 DELIMITER // CREATE PROCEDURE LogReplicationPerformance() BEGIN -- 这个存储过程应该在从服务器上运行 -- 实际实现需要解析 SHOW SLAVE STATUS 的结果 INSERT INTO replication_performance_log (server_id, lag_seconds, io_thread_status, sql_thread_status, last_error) VALUES (@@server_id, 0, 'Running', 'Running', 'No errors'); SELECT 'Performance data logged' as result; END // DELIMITER ; -- 定期执行性能监控 -- 可以通过 cron 或 MySQL Event Scheduler 定期调用 -- CREATE EVENT replication_monitor_event -- ON SCHEDULE EVERY 1 MINUTE -- DO CALL LogReplicationPerformance();
```
### 高级复制拓扑
- 链式复制
Master → Slave1 → Slave2，适合地理分布式部署

- 星型复制
一个主服务器对应多个从服务器，最常见的拓扑

- 双主复制
两个服务器互为主从，实现双向同步

- 多源复制
一个从服务器从多个主服务器复制数据

#### 双主复制配置
```sql
-- 双主复制配置（Master-Master Replication） -- 服务器A配置 (my.cnf) -- [mysqld] -- server-id = 1 -- log-bin = mysql-bin -- auto-increment-increment = 2 -- auto-increment-offset = 1 -- binlog-do-db = replication_demo -- 服务器B配置 (my.cnf) -- [mysqld] -- server-id = 2 -- log-bin = mysql-bin -- auto-increment-increment = 2 -- auto-increment-offset = 2 -- binlog-do-db = replication_demo -- 在服务器A上创建复制用户 CREATE USER 'repl_user_a'@'%' IDENTIFIED BY 'password_a'; GRANT REPLICATION SLAVE ON *.* TO 'repl_user_a'@'%'; FLUSH PRIVILEGES; -- 在服务器B上创建复制用户 CREATE USER 'repl_user_b'@'%' IDENTIFIED BY 'password_b'; GRANT REPLICATION SLAVE ON *.* TO 'repl_user_b'@'%'; FLUSH PRIVILEGES; -- 在服务器A上配置到服务器B的复制 CHANGE MASTER TO MASTER_HOST = 'server_b_ip', MASTER_USER = 'repl_user_b', MASTER_PASSWORD = 'password_b', MASTER_LOG_FILE = 'mysql-bin.000001', MASTER_LOG_POS = 154; START SLAVE; -- 在服务器B上配置到服务器A的复制 CHANGE MASTER TO MASTER_HOST = 'server_a_ip', MASTER_USER = 'repl_user_a', MASTER_PASSWORD = 'password_a', MASTER_LOG_FILE = 'mysql-bin.000001', MASTER_LOG_POS = 154; START SLAVE; -- 测试双主复制 -- 在服务器A上插入数据 INSERT INTO replication_demo.users (username, email) VALUES ('user_from_a', 'a@example.com'); -- 在服务器B上插入数据 INSERT INTO replication_demo.users (username, email) VALUES ('user_from_b', 'b@example.com'); -- 检查两个服务器上的数据是否一致 SELECT * FROM replication_demo.users ORDER BY id;
```
#### 多源复制配置 (MySQL 5.7+)
```sql
-- 多源复制配置 -- 一个从服务器从多个主服务器复制数据 -- 从服务器配置 (my.cnf) -- [mysqld] -- server-id = 100 -- master-info-repository = TABLE -- relay-log-info-repository = TABLE -- relay-log-recovery = ON -- 配置第一个主服务器的复制通道 CHANGE MASTER TO MASTER_HOST = 'master1_ip', MASTER_USER = 'repl_user1', MASTER_PASSWORD = 'password1', MASTER_LOG_FILE = 'mysql-bin.000001', MASTER_LOG_POS = 154 FOR CHANNEL 'master1'; -- 配置第二个主服务器的复制通道 CHANGE MASTER TO MASTER_HOST = 'master2_ip', MASTER_USER = 'repl_user2', MASTER_PASSWORD = 'password2', MASTER_LOG_FILE = 'mysql-bin.000001', MASTER_LOG_POS = 154 FOR CHANNEL 'master2'; -- 启动所有复制通道 START SLAVE FOR CHANNEL 'master1'; START SLAVE FOR CHANNEL 'master2'; -- 查看多源复制状态 SHOW SLAVE STATUS FOR CHANNEL 'master1'\G SHOW SLAVE STATUS FOR CHANNEL 'master2'\G -- 停止特定通道 STOP SLAVE FOR CHANNEL 'master1'; -- 重置特定通道 RESET SLAVE FOR CHANNEL 'master1'; -- 查看所有复制通道 SELECT CHANNEL_NAME, HOST, PORT, USER, SOURCE_LOG_FILE, SOURCE_LOG_POS FROM performance_schema.replication_connection_configuration; -- 查看复制应用状态 SELECT CHANNEL_NAME, SERVICE_STATE, LAST_ERROR_MESSAGE, LAST_ERROR_TIMESTAMP FROM performance_schema.replication_applier_status;
```
### 故障转移和高可用
#### 手动故障转移
```sql
-- 手动故障转移步骤 
-- 1. 检测主服务器故障 
-- 在监控系统中检测主服务器是否响应 -- 
mysql -h master_ip -u monitor_user -p -e "SELECT 1;" 
-- 2. 选择新的主服务器 
-- 选择数据最新、延迟最小的从服务器 
-- 在候选从服务器上检查复制状态 
SHOW SLAVE STATUS\G 
-- 3. 停止所有从服务器的复制 
STOP SLAVE; 
-- 4. 在新主服务器上启用写入 
SET GLOBAL read_only = 0; 
SET GLOBAL super_read_only = 0; 
-- 5. 重新配置其他从服务器 
-- 获取新主服务器的状态 
SHOW MASTER STATUS; 
-- 在其他从服务器上重新配置复制 
CHANGE MASTER TO MASTER_HOST = 'new_master_ip', MASTER_USER = 'replication_user', MASTER_PASSWORD = 'password', MASTER_LOG_FILE = 'mysql-bin.000001', MASTER_LOG_POS = 154; START SLAVE; 
-- 6. 更新应用程序配置 
-- 修改应用程序的数据库连接配置，指向新的主服务器 
-- 7. 验证故障转移 
-- 测试写入操作 
INSERT INTO replication_demo.users (username, email) VALUES ('failover_test', 'test@example.com'); 
-- 检查从服务器是否正常复制 
SELECT * FROM replication_demo.users WHERE username = 'failover_test';
```
#### 自动故障转移脚本
```bash
#!/bin/bash # mysql_failover.sh - MySQL 自动故障转移脚本 # 配置参数 MASTER_HOST="192.168.1.100" SLAVE_HOSTS=("192.168.1.101" "192.168.1.102" "192.168.1.103") MYSQL_USER="admin" MYSQL_PASS="password" REPL_USER="replication_user" REPL_PASS="repl_password" LOG_FILE="/var/log/mysql_failover.log" # 日志函数 log_message() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE } # 检查服务器连接 check_server() { local host=$1 mysql -h $host -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1;" > /dev/null 2>&1 return $? } # 获取从服务器延迟 get_slave_lag() { local host=$1 local lag=$(mysql -h $host -u $MYSQL_USER -p$MYSQL_PASS -e \ "SHOW SLAVE STATUS\G" | grep "Seconds_Behind_Master" | awk '{print $2}') echo ${lag:-999999} } # 选择最佳从服务器作为新主服务器 select_new_master() { local best_slave="" local min_lag=999999 for slave in "${SLAVE_HOSTS[@]}"; do if check_server $slave; then local lag=$(get_slave_lag $slave) log_message "Slave $slave lag: $lag seconds" if [ $lag -lt $min_lag ]; then min_lag=$lag best_slave=$slave fi else log_message "Slave $slave is not accessible" fi done echo $best_slave } # 提升从服务器为主服务器 promote_slave_to_master() { local new_master=$1 log_message "Promoting $new_master to master" # 停止复制 mysql -h $new_master -u $MYSQL_USER -p$MYSQL_PASS -e "STOP SLAVE;" # 启用写入 mysql -h $new_master -u $MYSQL_USER -p$MYSQL_PASS -e \ "SET GLOBAL read_only = 0; SET GLOBAL super_read_only = 0;" # 重置从服务器状态 mysql -h $new_master -u $MYSQL_USER -p$MYSQL_PASS -e "RESET SLAVE ALL;" log_message "$new_master promoted to master successfully" } # 重新配置其他从服务器 reconfigure_slaves() { local new_master=$1 # 获取新主服务器状态 local master_status=$(mysql -h $new_master -u $MYSQL_USER -p$MYSQL_PASS -e \ "SHOW MASTER STATUS\G") local log_file=$(echo "$master_status" | grep "File:" | awk '{print $2}') local log_pos=$(echo "$master_status" | grep "Position:" | awk '{print $2}') log_message "New master status: $log_file, $log_pos" for slave in "${SLAVE_HOSTS[@]}"; do if [ "$slave" != "$new_master" ] && check_server $slave; then log_message "Reconfiguring slave $slave" # 停止复制 mysql -h $slave -u $MYSQL_USER -p$MYSQL_PASS -e "STOP SLAVE;" # 重新配置主服务器 mysql -h $slave -u $MYSQL_USER -p$MYSQL_PASS -e " CHANGE MASTER TO MASTER_HOST = '$new_master', MASTER_USER = '$REPL_USER', MASTER_PASSWORD = '$REPL_PASS', MASTER_LOG_FILE = '$log_file', MASTER_LOG_POS = $log_pos; " # 启动复制 mysql -h $slave -u $MYSQL_USER -p$MYSQL_PASS -e "START SLAVE;" log_message "Slave $slave reconfigured successfully" fi done } # 发送告警通知 send_alert() { local message=$1 log_message "ALERT: $message" # 发送邮件告警 echo "$message" | mail -s "MySQL Failover Alert" admin@example.com # 发送到监控系统 # curl -X POST "http://monitoring-system/alert" -d "message=$message" } # 主故障转移流程 main_failover() { log_message "Starting MySQL failover process" # 检查主服务器状态 if check_server $MASTER_HOST; then log_message "Master server $MASTER_HOST is accessible, no failover needed" return 0 fi log_message "Master server $MASTER_HOST is not accessible, starting failover" send_alert "Master server $MASTER_HOST failed, starting automatic failover" # 选择新的主服务器 local new_master=$(select_new_master) if [ -z "$new_master" ]; then log_message "No suitable slave found for promotion" send_alert "Failover failed: No suitable slave server available" return 1 fi log_message "Selected $new_master as new master" # 执行故障转移 promote_slave_to_master $new_master reconfigure_slaves $new_master log_message "Failover completed successfully" send_alert "Failover completed: $new_master is now the master server" # 更新配置文件或DNS记录 # update_application_config $new_master return 0 } # 执行故障转移 main_failover
```
#### 使用 MHA 进行自动故障转移
```yaml
# MHA (Master High Availability) 是专业的 MySQL 高可用解决方案 
# 1. 安装 MHA 
# 在管理节点安装 MHA Manager 
# yum install mha4mysql-manager 
# 在所有 MySQL 节点安装 MHA Node 
# yum install mha4mysql-node 
# 2. 配置 MHA 
# 创建 MHA 配置文件 /etc/mha/app1.cnf 
[server default] 
manager_log=/var/log/mha/app1/manager.log 
manager_workdir=/var/log/mha/app1 
master_binlog_dir=/var/lib/mysql 
user=mha 
password=mha_password 
ping_interval=3 
repl_user=replication_user 
repl_password=repl_password 
ssh_user=root 
[server1] 
hostname=192.168.1.100 
port=3306 
candidate_master=1 
[server2] 
hostname=192.168.1.101 
port=3306 
candidate_master=1 
[server3] 
hostname=192.168.1.102 
port=3306 
no_master=1 
# 3. 检查 MHA 配置 
masterha_check_ssh --conf=/etc/mha/app1.cnf masterha_check_repl --conf=/etc/mha/app1.cnf 
# 4. 启动 MHA Manager 
masterha_manager --conf=/etc/mha/app1.cnf --remove_dead_master_conf --ignore_last_failover 
# 5. 监控 MHA 状态 
masterha_check_status --conf=/etc/mha/app1.cnf 
# 6. 手动故障转移 
masterha_master_switch --conf=/etc/mha/app1.cnf --master_state=dead --dead_master_host=192.168.1.100 --new_master_host=192.168.1.101 
# 7. 在线主服务器切换 
masterha_master_switch --conf=/etc/mha/app1.cnf --master_state=alive --new_master_host=192.168.1.101 --orig_master_is_new_slave
```
### 最佳实践和注意事项
#### 主从复制最佳实践
- 监控复制延迟：建立实时监控，及时发现复制问题
- 定期检查一致性：使用工具验证主从数据一致性
- 合理配置参数：根据业务需求调整复制相关参数
- 网络优化：确保主从服务器间网络稳定可靠
- 故障转移演练：定期进行故障转移测试
- 备份策略：主从复制不能替代备份
- 权限管理：严格控制复制用户权限
#### 常见问题和注意事项
- 数据不一致：避免在从服务器上进行写操作
- 复制延迟：监控并优化网络和配置参数
- 二进制日志清理：合理设置日志保留期限
- 磁盘空间：监控中继日志和二进制日志占用空间
- 字符集问题：确保主从服务器字符集一致
- 时区设置：保持主从服务器时区同步
- 版本兼容性：注意 MySQL 版本间的兼容性
#### 主从复制目标
- 理想复制延迟 < 1s
- 目标可用性 99.9%
- 故障转移时间 < 30s
- 数据丢失容忍度 0
```sql
-- 清理示例对象 DROP VIEW IF EXISTS replication_monitor; DROP TABLE IF EXISTS replication_performance_log; DROP PROCEDURE IF EXISTS CheckReplicationLag; DROP PROCEDURE IF EXISTS LogReplicationPerformance; DROP PROCEDURE IF EXISTS ReplicationHealthCheck; DROP DATABASE IF EXISTS replication_demo; SELECT 'MySQL replication tutorial completed. All example objects cleaned up.' AS message;
```

## MySQL 导出数据
### 数据导出概述
> MySQL 提供了多种数据导出方法，可以将数据库、表或查询结果导出为不同格式的文件。数据导出是数据备份、迁移、分析和共享的重要手段。

- mysqldump
官方命令行工具，支持完整的数据库结构和数据导出

- SELECT INTO OUTFILE
SQL 语句直接导出查询结果到文件

- MySQL Workbench
图形界面工具，支持多种导出格式

- 第三方工具
phpMyAdmin、Navicat 等工具提供的导出功能
#### 导出格式
- SQL 标准 SQL 脚本格式

- CSV
逗号分隔值格式

- TSV
制表符分隔格式

- JSON
JavaScript 对象表示法

- XML
可扩展标记语言

- Excel
Microsoft Excel 格式

### 准备测试数据
```sql
-- 创建测试数据库和表 CREATE DATABASE export_demo; USE export_demo; -- 创建用户表 CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL, age INT, city VARCHAR(50), salary DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ); -- 创建订单表 CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, order_number VARCHAR(50) NOT NULL UNIQUE, total_amount DECIMAL(10,2) NOT NULL, status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending', order_date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ); -- 创建产品表 CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, category VARCHAR(50), stock_quantity INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 插入测试数据 INSERT INTO users (username, email, age, city, salary) VALUES ('alice', 'alice@example.com', 28, 'Beijing', 8500.00), ('bob', 'bob@example.com', 32, 'Shanghai', 12000.00), ('charlie', 'charlie@example.com', 25, 'Guangzhou', 7500.00), ('diana', 'diana@example.com', 29, 'Shenzhen', 9500.00), ('eve', 'eve@example.com', 35, 'Hangzhou', 11000.00), ('frank', 'frank@example.com', 27, 'Chengdu', 8000.00), ('grace', 'grace@example.com', 31, 'Wuhan', 9000.00), ('henry', 'henry@example.com', 26, 'Xian', 7800.00), ('iris', 'iris@example.com', 33, 'Nanjing', 10500.00), ('jack', 'jack@example.com', 30, 'Tianjin', 9200.00); INSERT INTO products (name, description, price, category, stock_quantity) VALUES ('iPhone 15', 'Latest Apple smartphone', 7999.00, 'Electronics', 50), ('MacBook Pro', 'Professional laptop', 15999.00, 'Electronics', 30), ('Nike Air Max', 'Running shoes', 899.00, 'Sports', 100), ('Adidas T-shirt', 'Cotton sports t-shirt', 199.00, 'Clothing', 200), ('Samsung TV', '55-inch 4K Smart TV', 4999.00, 'Electronics', 25), ('Coffee Maker', 'Automatic coffee machine', 1299.00, 'Home', 40), ('Yoga Mat', 'Premium yoga mat', 299.00, 'Sports', 80), ('Wireless Headphones', 'Bluetooth headphones', 599.00, 'Electronics', 60), ('Office Chair', 'Ergonomic office chair', 1899.00, 'Furniture', 35), ('Water Bottle', 'Stainless steel bottle', 89.00, 'Sports', 150); INSERT INTO orders (user_id, order_number, total_amount, status, order_date) VALUES (1, 'ORD-2024-001', 8898.00, 'delivered', '2024-01-15'), (2, 'ORD-2024-002', 15999.00, 'delivered', '2024-01-20'), (3, 'ORD-2024-003', 1198.00, 'shipped', '2024-02-01'), (4, 'ORD-2024-004', 4999.00, 'paid', '2024-02-05'), (5, 'ORD-2024-005', 1898.00, 'delivered', '2024-02-10'), (1, 'ORD-2024-006', 688.00, 'pending', '2024-02-15'), (6, 'ORD-2024-007', 299.00, 'delivered', '2024-02-20'), (7, 'ORD-2024-008', 599.00, 'shipped', '2024-02-25'), (8, 'ORD-2024-009', 1988.00, 'paid', '2024-03-01'), (9, 'ORD-2024-010', 89.00, 'delivered', '2024-03-05'); SELECT 'Test data created successfully' AS message; SELECT COUNT(*) AS user_count FROM users; SELECT COUNT(*) AS product_count FROM products; SELECT COUNT(*) AS order_count FROM orders;
```
### 使用 mysqldump 导出
#### 命令行基本导出语法
```bash
# 基本语法 
mysqldump [options] database_name [table_name] > output_file.sql 
# 导出整个数据库 
mysqldump -u username -p export_demo > export_demo_backup.sql 
# 导出特定表 
mysqldump -u username -p export_demo users > users_backup.sql 
# 导出多个表 
mysqldump -u username -p export_demo users orders > users_orders_backup.sql 
# 导出所有数据库 
mysqldump -u username -p --all-databases > all_databases_backup.sql 
# 导出多个数据库 
mysqldump -u username -p --databases db1 db2 db3 > multiple_databases_backup.sql
```
#### 常用导出选项
| 选项	| 说明	| 示例|
| -- | -- | -- |
| --single-transaction	| 在单个事务中导出（InnoDB）	| --single-transaction |
| --lock-tables	| 锁定表（MyISAM）	| --lock-tables |
| --no-data	| 只导出表结构，不导出数据	| --no-data |
| --no-create-info	| 只导出数据，不导出表结构	| --no-create-info |
| --where	| 添加 WHERE 条件	| --where="age > 25" |
| --complete-insert	| 生成完整的 INSERT 语句	| --complete-insert |
| --extended-insert	| 使用多行 INSERT 语句	| --extended-insert |
| --compress	| 压缩客户端和服务器间的数据	| --compress |
| --hex-blob	| 使用十六进制格式导出二进制数据	| --hex-blob |
| --routines	| 导出存储过程和函数	| --routines |
| --triggers	| 导出触发器	| --triggers |
| --events	| 导出事件	| --events |
#### 实际导出示例
```bash
# 1. 完整数据库导出（推荐用于生产环境） 
mysqldump -u root -p \ --single-transaction \ --routines \ --triggers \ --events \ --hex-blob \ --complete-insert \ export_demo > export_demo_full_backup.sql 
# 2. 只导出表结构 
mysqldump -u root -p \ --no-data \ --routines \ --triggers \ --events \ export_demo > export_demo_structure.sql 
# 3. 只导出数据 
mysqldump -u root -p \ --no-create-info \ --complete-insert \ export_demo > export_demo_data.sql 
# 4. 条件导出 
mysqldump -u root -p \ --single-transaction \ --where="age >= 30" \ export_demo users > users_age_30_plus.sql 
# 5. 导出到压缩文件 
mysqldump -u root -p \ --single-transaction \ --routines \ --triggers \ export_demo | gzip > export_demo_backup.sql.gz 
# 6. 远程导出 
mysqldump -h remote_host -P 3306 -u username -p \ --single-transaction \ export_demo > remote_export_demo.sql 
# 7. 导出特定字段 
mysqldump -u root -p \ --no-create-info \ --complete-insert \ --where="1=1" \ export_demo users \ --ignore-table=export_demo.orders > users_only.sql 
# 8. 批量导出多个数据库 
for db in db1 db2 db3; do mysqldump -u root -p --single-transaction $db > ${db}_backup_$(date +%Y%m%d).sql done
```
#### mysqldump 最佳实践：
- InnoDB 表：使用 --single-transaction 确保一致性
- MyISAM 表：使用 --lock-tables 锁定表
- 大数据库：考虑使用 --compress 压缩传输
- 生产环境：在低峰期进行导出操作
- 安全性：避免在命令行中直接输入密码
### 使用 SELECT INTO OUTFILE 导出
#### 基本语法和示例
```sql
-- 基本语法 SELECT column1, column2, ... INTO OUTFILE 'file_path' FIELDS TERMINATED BY 'delimiter' LINES TERMINATED BY 'line_ending' FROM table_name WHERE condition; -- 1. 导出为 CSV 格式 SELECT id, username, email, age, city, salary INTO OUTFILE '/tmp/users_export.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM users; -- 2. 导出为 TSV 格式（制表符分隔） SELECT id, username, email, age, city, salary INTO OUTFILE '/tmp/users_export.tsv' FIELDS TERMINATED BY '\t' LINES TERMINATED BY '\n' FROM users; -- 3. 带条件的导出 SELECT username, email, age, salary INTO OUTFILE '/tmp/high_salary_users.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM users WHERE salary > 9000; -- 4. 导出连接查询结果 SELECT u.username, u.email, o.order_number, o.total_amount, o.status, o.order_date INTO OUTFILE '/tmp/user_orders.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM users u JOIN orders o ON u.id = o.user_id ORDER BY o.order_date DESC; -- 5. 导出聚合数据 SELECT city, COUNT(*) as user_count, AVG(age) as avg_age, AVG(salary) as avg_salary INTO OUTFILE '/tmp/city_statistics.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM users GROUP BY city ORDER BY user_count DESC; -- 6. 导出带标题的 CSV -- 首先导出标题 SELECT 'ID', 'Username', 'Email', 'Age', 'City', 'Salary' INTO OUTFILE '/tmp/users_with_header.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n'; -- 然后追加数据（注意：MySQL 不支持 APPEND，需要手动合并） SELECT id, username, email, age, city, salary INTO OUTFILE '/tmp/users_data_only.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM users; -- 7. 自定义分隔符导出 SELECT id, username, email, age INTO OUTFILE '/tmp/users_pipe_delimited.txt' FIELDS TERMINATED BY '|' LINES TERMINATED BY '\n' FROM users; -- 8. 导出 JSON 格式数据（MySQL 5.7+） SELECT JSON_OBJECT( 'id', id, 'username', username, 'email', email, 'age', age, 'city', city, 'salary', salary ) as user_json INTO OUTFILE '/tmp/users.json' LINES TERMINATED BY '\n' FROM users;
```
#### SELECT INTO OUTFILE 注意事项：
- 文件权限：MySQL 服务器需要对目标目录有写权限
- 文件路径：必须是服务器端的绝对路径
- 文件覆盖：如果文件已存在，操作会失败
- secure_file_priv：检查 MySQL 的文件导出限制设置
- 字符编码：注意字符集设置，避免乱码
```sql
-- 检查文件导出设置 SHOW VARIABLES LIKE 'secure_file_priv'; -- 如果 secure_file_priv 有值，只能导出到指定目录 -- 如果为 NULL，则禁止文件导出 -- 如果为空字符串，则可以导出到任何位置 -- 查看导出文件的内容（在服务器端） -- cat /tmp/users_export.csv -- 检查导出的记录数 SELECT COUNT(*) as exported_records FROM users;
```
### 使用 MySQL Workbench 导出
#### 图形界面导出步骤
1. 连接数据库：在 MySQL Workbench 中连接到目标数据库
2. 选择导出方式：
    - Server → Data Export（导出整个数据库）
    - 右键表 → Table Data Export Wizard（导出单个表）
3. 选择导出对象：选择要导出的数据库、表和选项
4. 配置导出选项：
    - Export to Dump Project Folder（导出为项目文件夹）
    - Export to Self-Contained File（导出为单个文件）
5. 高级选项：
    - Include Create Schema（包含创建数据库语句）
    - Export Routines（导出存储过程）
    - Export Events（导出事件）
    - Export Triggers（导出触发器）
6. 执行导出：点击 "Start Export" 开始导出
#### 导出格式
- SQL Dump
标准 SQL 脚本格式

- CSV
逗号分隔值格式

- JSON
JSON 格式导出

- XML
XML 格式导出

### 编程语言导出示例
#### Java 导出示例
1. Maven 依赖
```xml
<dependencies>
    <!-- 数据库 -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-boot-starter</artifactId>
        <version>3.5.3</version>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- 导出 -->
    <dependency>
        <groupId>com.opencsv</groupId>
        <artifactId>opencsv</artifactId>
        <version>5.7.1</version>
    </dependency>
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>easyexcel</artifactId>
        <version>3.3.2</version>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```
2. 配置（application.yml）
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/export_demo?useSSL=false&serverTimezone=UTC
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
```
3. 导出工具类
```java
@Slf4j
@Component
@RequiredArgsConstructor
public class ExportUtil {

    private final JdbcTemplate jdbcTemplate;

    /* ---------- CSV ---------- */
    public void exportCsv(String sql, String fileName) throws IOException {
        try (CSVWriter writer = new CSVWriter(new FileWriter(fileName))) {
            jdbcTemplate.query(sql, rs -> {
                writer.writeNext(rs.getMetaData().getColumnNames());
                while (rs.next()) {
                    int cols = rs.getMetaData().getColumnCount();
                    String[] row = new String[cols];
                    for (int i = 1; i <= cols; i++) {
                        row[i - 1] = rs.getString(i);
                    }
                    writer.writeNext(row);
                }
            });
        }
        log.info("CSV exported -> {}", fileName);
    }

    /* ---------- JSON ---------- */
    public void exportJson(String sql, String fileName) throws IOException {
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.writeValue(new File(fileName), list);
        log.info("JSON exported -> {}", fileName);
    }

    /* ---------- Excel ---------- */
    public void exportExcel(String sql, String fileName) {
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        EasyExcel.write(fileName).sheet("Sheet1").doWrite(() -> list);
        log.info("Excel exported -> {}", fileName);
    }

    /* ---------- 多 Sheet ---------- */
    public void exportMultiSheet(Map<String, String> sqlMap, String fileName) {
        try (ExcelWriter excelWriter = EasyExcel.write(fileName).build()) {
            sqlMap.forEach((sheetName, sql) -> {
                List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
                WriteSheet sheet = EasyExcel.writerSheet(sheetName).build();
                excelWriter.write(list, sheet);
            });
        }
        log.info("Multi-sheet Excel exported -> {}", fileName);
    }
}
```
#### Python 导出示例
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import json
import mysql.connector
import pandas as pd
from datetime import datetime
from mysql.connector import Error

# 数据库连接配置
CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',
    'database': 'export_demo',
    'charset': 'utf8mb4'
}


def export_to_csv(query: str, filename: str) -> None:
    """导出查询结果到 CSV 文件"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]

        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(column_names)
            writer.writerows(results)
        print(f"Data exported to {filename} successfully")
    except Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def export_to_json(query: str, filename: str) -> None:
    """导出查询结果到 JSON 文件"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()

        # 处理 datetime 对象
        for row in results:
            for key, value in row.items():
                if isinstance(value, datetime):
                    row[key] = value.isoformat()

        with open(filename, 'w', encoding='utf-8') as jsonfile:
            json.dump(results, jsonfile, ensure_ascii=False, indent=2)
        print(f"Data exported to {filename} successfully")
    except Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def export_to_excel(query: str, filename: str) -> None:
    """导出查询结果到 Excel 文件"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        df = pd.read_sql(query, conn)
        df.to_excel(filename, index=False, engine='openpyxl')
        print(f"Data exported to {filename} successfully")
    except Exception as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            conn.close()


def export_multiple_tables() -> None:
    """导出多个表到不同的工作表（Excel）"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        with pd.ExcelWriter('export_demo_all_tables.xlsx', engine='openpyxl') as writer:
            users_df = pd.read_sql('SELECT * FROM users', conn)
            users_df.to_excel(writer, sheet_name='Users', index=False)

            orders_df = pd.read_sql('SELECT * FROM orders', conn)
            orders_df.to_excel(writer, sheet_name='Orders', index=False)

            products_df = pd.read_sql('SELECT * FROM products', conn)
            products_df.to_excel(writer, sheet_name='Products', index=False)

            stats_query = """
                SELECT city, COUNT(*) AS user_count,
                       AVG(age) AS avg_age,
                       AVG(salary) AS avg_salary
                FROM users
                GROUP BY city
                ORDER BY user_count DESC
            """
            stats_df = pd.read_sql(stats_query, conn)
            stats_df.to_excel(writer, sheet_name='Statistics', index=False)

        print("All tables exported to export_demo_all_tables.xlsx successfully")
    except Exception as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            conn.close()


if __name__ == '__main__':
    # 示例调用
    export_to_csv(
        "SELECT id, username, email, age, city, salary FROM users",
        "users_export.csv"
    )

    export_to_json(
        "SELECT * FROM orders WHERE status = 'delivered'",
        "delivered_orders.json"
    )

    export_to_excel(
        """
        SELECT city, COUNT(*) AS user_count,
               AVG(age) AS avg_age,
               AVG(salary) AS avg_salary
        FROM users
        GROUP BY city
        ORDER BY user_count DESC
        """,
        "user_statistics.xlsx"
    )

    export_multiple_tables()
```
### 性能优化和最佳实践
- 大数据导出
使用分批导出，避免内存溢出和长时间锁表

- 时间选择
在业务低峰期进行导出操作，减少对生产环境的影响

- 数据一致性
使用事务或锁确保导出数据的一致性

- 压缩存储
对大文件进行压缩，节省存储空间和传输时间

- 安全考虑
敏感数据脱敏，控制导出权限和文件访问权限

- 监控日志
记录导出操作日志，便于审计和问题排查

#### 大数据量导出优化
```sql
-- 分批导出大表数据 -- 方法1：使用 LIMIT 和 OFFSET SET @batch_size = 10000; SET @offset = 0; -- 循环导出（需要在脚本中实现） SELECT * FROM large_table LIMIT @batch_size OFFSET @offset; -- 方法2：使用主键范围 SET @start_id = 1; SET @end_id = 10000; SET @batch_size = 10000; SELECT * FROM large_table WHERE id BETWEEN @start_id AND @end_id; -- 方法3：使用游标（在存储过程中） DELIMITER // CREATE PROCEDURE ExportLargeTable() BEGIN DECLARE done INT DEFAULT FALSE; DECLARE batch_count INT DEFAULT 0; DECLARE total_records INT; -- 获取总记录数 SELECT COUNT(*) INTO total_records FROM large_table; -- 分批处理 WHILE batch_count * 10000 < total_records DO -- 这里可以调用导出逻辑 SELECT CONCAT('Processing batch ', batch_count + 1) as status; SET batch_count = batch_count + 1; END WHILE; SELECT CONCAT('Export completed. Total batches: ', batch_count) as result; END // DELIMITER ; -- 并行导出（多个连接同时导出不同的数据段） -- 连接1：导出 ID 1-100000 SELECT * FROM large_table WHERE id BETWEEN 1 AND 100000; -- 连接2：导出 ID 100001-200000 SELECT * FROM large_table WHERE id BETWEEN 100001 AND 200000; -- 连接3：导出 ID 200001-300000 SELECT * FROM large_table WHERE id BETWEEN 200001 AND 300000;
```
#### 导出脚本自动化
```bash
#!/bin/bash # MySQL 数据导出自动化脚本 # 配置参数 DB_HOST="localhost" DB_USER="backup_user" DB_PASS="backup_password" DB_NAME="export_demo" BACKUP_DIR="/backup/mysql" DATE=$(date +%Y%m%d_%H%M%S) LOG_FILE="$BACKUP_DIR/export_$DATE.log" # 创建备份目录 mkdir -p $BACKUP_DIR # 日志函数 log_message() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE } # 导出函数 export_database() { local db_name=$1 local output_file="$BACKUP_DIR/${db_name}_$DATE.sql" log_message "Starting export of database: $db_name" mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS \ --single-transaction \ --routines \ --triggers \ --events \ --hex-blob \ --complete-insert \ $db_name > $output_file if [ $? -eq 0 ]; then log_message "Database $db_name exported successfully to $output_file" # 压缩备份文件 gzip $output_file log_message "Backup file compressed: ${output_file}.gz" # 计算文件大小 local file_size=$(du -h "${output_file}.gz" | cut -f1) log_message "Compressed file size: $file_size" else log_message "ERROR: Failed to export database $db_name" return 1 fi } # 导出特定表 export_table() { local db_name=$1 local table_name=$2 local output_file="$BACKUP_DIR/${db_name}_${table_name}_$DATE.sql" log_message "Starting export of table: $db_name.$table_name" mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS \ --single-transaction \ --complete-insert \ $db_name $table_name > $output_file if [ $? -eq 0 ]; then log_message "Table $table_name exported successfully" gzip $output_file else log_message "ERROR: Failed to export table $table_name" return 1 fi } # 清理旧备份 cleanup_old_backups() { local retention_days=7 log_message "Cleaning up backups older than $retention_days days" find $BACKUP_DIR -name "*.sql.gz" -mtime +$retention_days -delete log_message "Old backups cleaned up" } # 发送通知 send_notification() { local status=$1 local message=$2 # 发送邮件通知 echo "$message" | mail -s "MySQL Export $status" admin@example.com # 发送到监控系统 # curl -X POST "http://monitoring-system/alert" -d "status=$status&message=$message" } # 主执行流程 main() { log_message "Starting MySQL export process" # 导出整个数据库 if export_database $DB_NAME; then log_message "Database export completed successfully" send_notification "SUCCESS" "Database $DB_NAME exported successfully" else log_message "Database export failed" send_notification "FAILED" "Database $DB_NAME export failed" exit 1 fi # 导出特定表（可选） # export_table $DB_NAME "users" # export_table $DB_NAME "orders" # 清理旧备份 cleanup_old_backups log_message "Export process completed" } # 执行主函数 main # 设置定时任务 # crontab -e # 添加以下行以每天凌晨2点执行备份： # 0 2 * * * /path/to/mysql_export.sh
```
#### 导出最佳实践总结
- 选择合适的导出方法：根据数据量和需求选择最适合的导出工具
- 确保数据一致性：使用事务或锁机制保证导出数据的完整性
- 优化导出性能：大数据量时使用分批导出，避免长时间锁表
- 压缩和存储：对导出文件进行压缩，节省存储空间
- 安全和权限：控制导出权限，对敏感数据进行脱敏处理
- 自动化和监控：建立自动化导出流程和监控机制
- 测试和验证：定期测试导出和恢复流程的有效性
```sql
-- 清理示例数据 DROP DATABASE IF EXISTS export_demo; SELECT 'MySQL data export tutorial completed. Example database cleaned up.' AS message;
```
## MySQL 导入数据
### 数据导入概述
> MySQL 提供了多种数据导入方法，可以将各种格式的数据文件导入到数据库中。数据导入是数据迁移、恢复、批量处理和系统集成的重要手段。
#### 数据导入方法
- mysql 命令行
执行 SQL 脚本文件，恢复数据库结构和数据

- LOAD DATA INFILE
高效导入 CSV、TSV 等格式的数据文件

- MySQL Workbench
图形界面工具，支持多种导入格式

- mysqlimport
MySQL 官方的数据导入工具
#### 数据导入格式
- SQL
SQL 脚本文件

- CSV
逗号分隔值格式

- TSV
制表符分隔格式

- JSON
JavaScript 对象表示法

- XML
可扩展标记语言

- Excel
Microsoft Excel 格式

### 准备测试环境
```sql
-- 创建测试数据库 CREATE DATABASE import_demo; USE import_demo; -- 创建用户表 CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL, age INT, city VARCHAR(50), salary DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 创建订单表 CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, order_number VARCHAR(50) NOT NULL UNIQUE, total_amount DECIMAL(10,2) NOT NULL, status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending', order_date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ); -- 创建产品表 CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, category VARCHAR(50), stock_quantity INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 创建临时导入表（用于数据清洗） CREATE TABLE temp_import ( id INT AUTO_INCREMENT PRIMARY KEY, raw_data TEXT, processed BOOLEAN DEFAULT FALSE, import_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); SELECT 'Import demo database created successfully' AS message;
```
### 使用 mysql 命令行导入
#### 导入 SQL 脚本文件 基本导入语法
```bash 
# 基本语法 mysql -u username -p database_name < input_file.sql # 导入到指定数据库 mysql -u root -p import_demo < backup.sql # 导入时创建数据库（如果 SQL 文件包含 CREATE DATABASE） mysql -u root -p < full_backup.sql # 远程导入 mysql -h remote_host -P 3306 -u username -p database_name < backup.sql # 导入压缩文件 gunzip < backup.sql.gz | mysql -u root -p database_name zcat backup.sql.gz | mysql -u root -p database_name # 导入时显示进度（使用 pv 工具） pv backup.sql | mysql -u root -p database_name # 导入时忽略错误 mysql -u root -p --force database_name < backup.sql # 导入时设置字符集 mysql -u root -p --default-character-set=utf8mb4 database_name < backup.sql
```
#### 在 MySQL 客户端内导入
```sql
-- 连接到 MySQL mysql -u root -p -- 选择数据库 USE import_demo; -- 使用 SOURCE 命令导入 SOURCE /path/to/backup.sql; -- 或者使用 \. 命令（简写） \. /path/to/backup.sql -- 导入前设置参数 SET autocommit = 0; SET unique_checks = 0; SET foreign_key_checks = 0; -- 导入文件 SOURCE /path/to/large_backup.sql; -- 恢复参数 SET foreign_key_checks = 1; SET unique_checks = 1; SET autocommit = 1; COMMIT; -- 检查导入结果 SHOW TABLES; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM orders; SELECT COUNT(*) FROM products;
```
#### 创建示例 SQL 文件
```sql
-- 创建示例数据文件 sample_data.sql -- 可以保存为文件然后导入 -- 插入用户数据 INSERT INTO users (username, email, age, city, salary) VALUES ('alice', 'alice@example.com', 28, 'Beijing', 8500.00), ('bob', 'bob@example.com', 32, 'Shanghai', 12000.00), ('charlie', 'charlie@example.com', 25, 'Guangzhou', 7500.00), ('diana', 'diana@example.com', 29, 'Shenzhen', 9500.00), ('eve', 'eve@example.com', 35, 'Hangzhou', 11000.00); -- 插入产品数据 INSERT INTO products (name, description, price, category, stock_quantity) VALUES ('iPhone 15', 'Latest Apple smartphone', 7999.00, 'Electronics', 50), ('MacBook Pro', 'Professional laptop', 15999.00, 'Electronics', 30), ('Nike Air Max', 'Running shoes', 899.00, 'Sports', 100), ('Coffee Maker', 'Automatic coffee machine', 1299.00, 'Home', 40), ('Yoga Mat', 'Premium yoga mat', 299.00, 'Sports', 80); -- 插入订单数据 INSERT INTO orders (user_id, order_number, total_amount, status, order_date) VALUES (1, 'ORD-2024-001', 8898.00, 'delivered', '2024-01-15'), (2, 'ORD-2024-002', 15999.00, 'delivered', '2024-01-20'), (3, 'ORD-2024-003', 1198.00, 'shipped', '2024-02-01'), (4, 'ORD-2024-004', 4999.00, 'paid', '2024-02-05'), (5, 'ORD-2024-005', 1898.00, 'delivered', '2024-02-10'); -- 使用命令导入： -- mysql -u root -p import_demo < sample_data.sql
```
### 使用 LOAD DATA INFILE 导入 
#### 基本语法和选项
```sql
-- 基本语法 LOAD DATA INFILE 'file_path' INTO TABLE table_name FIELDS TERMINATED BY 'delimiter' LINES TERMINATED BY 'line_ending' [IGNORE number LINES] [REPLACE | IGNORE] (column1, column2, ...); -- 检查文件导入设置 SHOW VARIABLES LIKE 'secure_file_priv'; SHOW VARIABLES LIKE 'local_infile'; -- 如果需要启用本地文件导入 -- SET GLOBAL local_infile = 1; -- 1. 导入 CSV 文件（基本示例） LOAD DATA INFILE '/tmp/users.csv' INTO TABLE users FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES (username, email, age, city, salary); -- 2. 导入 TSV 文件 LOAD DATA INFILE '/tmp/products.tsv' INTO TABLE products FIELDS TERMINATED BY '\t' LINES TERMINATED BY '\n' IGNORE 1 LINES (name, description, price, category, stock_quantity); -- 3. 使用 REPLACE 处理重复数据 LOAD DATA INFILE '/tmp/users_update.csv' REPLACE INTO TABLE users FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES (id, username, email, age, city, salary); -- 4. 使用 IGNORE 跳过重复数据 LOAD DATA INFILE '/tmp/new_users.csv' IGNORE INTO TABLE users FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES (username, email, age, city, salary); -- 5. 导入时进行数据转换 LOAD DATA INFILE '/tmp/orders.csv' INTO TABLE orders FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES (user_id, order_number, total_amount, @status, @order_date) SET status = CASE WHEN @status = '1' THEN 'pending' WHEN @status = '2' THEN 'paid' WHEN @status = '3' THEN 'shipped' WHEN @status = '4' THEN 'delivered' ELSE 'pending' END, order_date = STR_TO_DATE(@order_date, '%Y-%m-%d'); -- 6. 导入部分列 LOAD DATA INFILE '/tmp/partial_users.csv' INTO TABLE users FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' (username, email, city) SET age = 25, salary = 5000.00; -- 7. 使用本地文件导入（客户端文件） LOAD DATA LOCAL INFILE '/local/path/users.csv' INTO TABLE users FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES;
```
#### 创建示例 CSV 文件
```csv
username,email,age,city,salary "john","john@example.com",30,"Beijing",9000.00 "jane","jane@example.com",28,"Shanghai",8500.00 "mike","mike@example.com",35,"Guangzhou",11000.00 "sarah","sarah@example.com",27,"Shenzhen",7800.00 "tom","tom@example.com",32,"Hangzhou",9500.00
```
```csv
name description price category stock_quantity iPad Air Tablet computer 4999.00 Electronics 40 Sony Headphones Wireless headphones 899.00 Electronics 60 Running Shoes Sports shoes 599.00 Sports 120 Office Desk Wooden desk 1599.00 Furniture 25 Water Bottle Stainless steel 89.00 Sports 200
```
#### LOAD DATA 选项详解

| 选项	| 说明	| 示例 |
| --- | --- | --- |
|FIELDS TERMINATED BY	|字段分隔符	|FIELDS TERMINATED BY ','
|ENCLOSED BY	|字段包围符	|ENCLOSED BY '"'
|ESCAPED BY	|转义字符	|ESCAPED BY '\\'
|LINES TERMINATED BY	|行分隔符	|LINES TERMINATED BY '\n'
|IGNORE n LINES	|忽略前 n 行	|IGNORE 1 LINES
|REPLACE	|替换重复记录	|REPLACE INTO TABLE
|IGNORE	|忽略重复记录	|IGNORE INTO TABLE
|LOCAL	|从客户端导入文件	|LOAD DATA LOCAL INFILE


#### LOAD DATA INFILE 注意事项
- 文件权限：MySQL 服务器需要对文件有读权限
- secure_file_priv：检查文件导入路径限制
- 字符编码：确保文件编码与数据库字符集一致
- 数据格式：确保数据格式与表结构匹配
- 外键约束：导入时可能需要临时禁用外键检查
### 使用 mysqlimport 工具
#### mysqlimport 命令语法
```bash
# 基本语法 mysqlimport [options] database_name file_name # 导入单个文件（文件名必须与表名匹配） mysqlimport -u root -p import_demo users.txt # 导入多个文件 mysqlimport -u root -p import_demo users.txt products.txt orders.txt # 常用选项 mysqlimport -u root -p \ --fields-terminated-by=',' \ --fields-enclosed-by='"' \ --lines-terminated-by='\n' \ --ignore-lines=1 \ --replace \ import_demo users.csv # 本地文件导入 mysqlimport -u root -p \ --local \ --fields-terminated-by=',' \ --ignore-lines=1 \ import_demo users.txt # 压缩文件导入 mysqlimport -u root -p \ --compress \ --fields-terminated-by=',' \ import_demo users.txt # 并行导入多个文件 mysqlimport -u root -p \ --use-threads=4 \ --fields-terminated-by=',' \ import_demo *.txt # 导入时显示详细信息 mysqlimport -u root -p \ --verbose \ --fields-terminated-by=',' \ import_demo users.txt
```
#### mysqlimport 选项对比

| 选项	| 说明	| 等效的 LOAD DATA 语法 |
| --- | --- | --- |
|--fields-terminated-by=','	|字段分隔符	|FIELDS TERMINATED BY ','
|--fields-enclosed-by='"'	|字段包围符	|ENCLOSED BY '"'
|--lines-terminated-by='\n'	|行分隔符	|LINES TERMINATED BY '\n'
|--ignore-lines=1	|忽略首行	|IGNORE 1 LINES
|--replace	|替换重复记录	|REPLACE INTO TABLE
|--ignore	|忽略重复记录	|IGNORE INTO TABLE
|--local	|本地文件导入	|LOAD DATA LOCAL INFILE
### 编程语言导入示例
#### Java 导入示例
```java
@Slf4j
@Component
@RequiredArgsConstructor
public class ImportUtil {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /* ---------------- CSV ---------------- */
    public void importCsv(String file, String table) throws IOException {
        try (Reader reader = new FileReader(file);
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {

            List<String> headers = parser.getHeaderNames();
            String cols = String.join(",", headers);
            String placeholders = headers.stream().map(h -> "?").collect(Collectors.joining(","));
            String sql = "INSERT INTO " + table + " (" + cols + ") VALUES (" + placeholders + ")";

            List<Object[]> batch = new ArrayList<>(1000);
            for (CSVRecord record : parser) {
                Object[] values = headers.stream().map(record::get).toArray();
                batch.add(values);
                if (batch.size() == 1000) {
                    jdbcTemplate.batchUpdate(sql, batch);
                    batch.clear();
                }
            }
            if (!batch.isEmpty()) jdbcTemplate.batchUpdate(sql, batch);
            log.info("CSV imported -> {}, rows: {}", file, parser.getRecordNumber());
        }
    }

    /* ---------------- JSON ---------------- */
    public void importJson(String file, String table) throws IOException {
        JsonNode root = objectMapper.readTree(new File(file));
        if (!root.isArray() || root.isEmpty()) {
            log.warn("Empty JSON array");
            return;
        }
        JsonNode first = root.get(0);
        List<String> headers = new ArrayList<>();
        first.fieldNames().forEachRemaining(headers::add);

        String cols = String.join(",", headers);
        String placeholders = headers.stream().map(h -> "?").collect(Collectors.joining(","));
        String sql = "INSERT INTO " + table + " (" + cols + ") VALUES (" + placeholders + ")";

        List<Object[]> batch = new ArrayList<>(1000);
        for (JsonNode node : root) {
            Object[] values = headers.stream().map(h -> node.get(h).asText()).toArray();
            batch.add(values);
            if (batch.size() == 1000) {
                jdbcTemplate.batchUpdate(sql, batch);
                batch.clear();
            }
        }
        if (!batch.isEmpty()) jdbcTemplate.batchUpdate(sql, batch);
        log.info("JSON imported -> {}, rows: {}", file, root.size());
    }

    /* ---------------- Excel ---------------- */
    public void importExcel(String file, String table, int sheetIndex) {
        EasyExcel.read(file, new MapListenner(table)).sheet(sheetIndex).doRead();
        log.info("Excel imported -> {}, sheet: {}", file, sheetIndex);
    }

    /* ---------------- 监听写库（EasyExcel） ---------------- */
    @Slf4j
    static class MapListenner extends AnalysisEventListener<Map<Integer, String>> {
        private final String table;
        private final JdbcTemplate tpl;
        private List<Map<Integer, String>> batch = new ArrayList<>(1000);
        private List<String> header;

        MapListenner(String table) {
            this.table = table;
            this.tpl = SpringContext.getBean(JdbcTemplate.class);
        }

        @Override
        public void invoke(Map<Integer, String> data, AnalysisContext context) {
            if (header == null) {
                header = new ArrayList<>(data.values());
                return;
            }
            batch.add(data);
            if (batch.size() == 1000) {
                flush();
            }
        }

        @Override
        public void doAfterAllAnalysed(AnalysisContext context) {
            flush();
        }

        private void flush() {
            if (batch.isEmpty()) return;
            String cols = String.join(",", header);
            String placeholders = header.stream().map(h -> "?").collect(Collectors.joining(","));
            String sql = "INSERT INTO " + table + " (" + cols + ") VALUES (" + placeholders + ")";
            List<Object[]> args = batch.stream()
                    .map(m -> header.stream().map(h -> m.get(header.indexOf(h))).toArray())
                    .collect(Collectors.toList());
            tpl.batchUpdate(sql, args);
            batch.clear();
            log.debug("Flushed {} rows", args.size());
        }
    }
}
```
#### Python 导入示例
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import json
import logging
import mysql.connector
import pandas as pd
from datetime import datetime
from mysql.connector import Error

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 数据库连接配置
CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',
    'database': 'import_demo',
    'charset': 'utf8mb4',
    'autocommit': False
}


def import_from_csv(csv_file: str, table_name: str, column_mapping: dict = None) -> None:
    """从 CSV 文件导入数据"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        cursor = conn.cursor()

        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            columns = list(reader.fieldnames)
            if column_mapping:
                columns = [column_mapping.get(col, col) for col in columns]

            placeholders = ', '.join(['%s'] * len(columns))
            sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

            batch, batch_size = [], 1000
            for row_num, row in enumerate(reader, 1):
                values = [row.get(col) for col in reader.fieldnames]
                batch.append(values)

                if len(batch) >= batch_size:
                    cursor.executemany(sql, batch)
                    conn.commit()
                    logger.info(f"Imported {row_num} rows")
                    batch.clear()

            if batch:
                cursor.executemany(sql, batch)
                conn.commit()
                logger.info(f"Finished importing {row_num} rows from {csv_file}")

    except Error as e:
        logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        logger.error(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def import_from_json(json_file: str, table_name: str) -> None:
    """从 JSON 文件导入数据"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        cursor = conn.cursor()

        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not data:
                logger.warning("No data found in JSON file")
                return

            columns = list(data[0].keys())
            placeholders = ', '.join(['%s'] * len(columns))
            sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

            batch = [[record.get(col) for col in columns] for record in data]
            cursor.executemany(sql, batch)
            conn.commit()
            logger.info(f"Imported {len(data)} records from {json_file}")

    except Error as e:
        logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        logger.error(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def import_from_excel(excel_file: str, table_name: str, sheet_name=0) -> None:
    """从 Excel 文件导入数据"""
    conn = None
    try:
        conn = mysql.connector.connect(**CONFIG)
        cursor = conn.cursor()

        df = pd.read_excel(excel_file, sheet_name=sheet_name).fillna('')
        columns = df.columns.tolist()
        placeholders = ', '.join(['%s'] * len(columns))
        sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

        data = df.values.tolist()
        batch_size = 1000
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            cursor.executemany(sql, batch)
            conn.commit()
            logger.info(f"Imported {min(i + batch_size, len(data))} / {len(data)} rows")

        logger.info(f"Finished importing {len(data)} records from {excel_file}")

    except Error as e:
        logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        logger.error(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def validate_and_clean_data(data: list, table_name: str) -> tuple:
    """数据验证和清洗"""
    cleaned_data, errors = [], []
    for i, record in enumerate(data):
        try:
            if table_name == 'users':
                if '@' not in record.get('email', ''):
                    errors.append(f"Row {i + 1}: Invalid email format")
                    continue
                age = record.get('age')
                if age and (int(age) < 0 or int(age) > 120):
                    errors.append(f"Row {i + 1}: Invalid age value")
                    continue
            cleaned_data.append(record)
        except Exception as e:
            errors.append(f"Row {i + 1}: {str(e)}")
    return cleaned_data, errors


def import_with_error_handling(file_path: str, table_name: str, file_type: str = 'csv') -> None:
    """带错误处理的导入函数"""
    try:
        logger.info(f"Starting import from {file_path} to {table_name}")
        file_type = file_type.lower()
        if file_type == 'csv':
            import_from_csv(file_path, table_name)
        elif file_type == 'json':
            import_from_json(file_path, table_name)
        elif file_type in ('xlsx', 'xls'):
            import_from_excel(file_path, table_name)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        logger.info("Import completed successfully")
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        raise


if __name__ == '__main__':
    # 示例调用（按需取消注释）
    # import_from_csv('users.csv', 'users')
    # import_from_json('products.json', 'products')
    # import_from_excel('orders.xlsx', 'orders')
    # import_with_error_handling('data.csv', 'users', 'csv')
    print("Import examples ready to use")
```

### 导入方法对比
|方法	|适用场景	|优点	|缺点	|性能
| --- | --- | --- | --- | --- |
|mysql 命令行	|SQL 脚本导入	|简单直接，支持完整备份恢复	|只支持 SQL 格式	|中等
|LOAD DATA INFILE	|大量结构化数据	|性能最高，支持多种格式	|文件路径限制，格式要求严格	|最高
|mysqlimport	|批量文件导入	|命令行操作，支持并行	|文件名必须与表名匹配	|高
|编程语言	|复杂数据处理	|灵活性高，可进行数据验证	|开发复杂度高	|中等
|MySQL Workbench	|小量数据，图形操作	|界面友好，操作简单	|不适合大量数据	|低

### 性能优化和最佳实践
- 批量导入
使用批量插入减少网络往返，提高导入效率

- 禁用约束
导入时临时禁用外键和唯一性检查

- 事务控制
合理使用事务，平衡性能和数据安全

- 数据验证
导入前进行数据格式和完整性验证

- 监控进度
大数据导入时显示进度，便于监控

- 错误处理
建立完善的错误处理和回滚机制

#### 大数据量导入优化
```sql
-- 导入前的优化设置 SET autocommit = 0; SET unique_checks = 0; SET foreign_key_checks = 0; SET sql_log_bin = 0; -- 如果不需要复制到从服务器 -- 调整 InnoDB 参数（需要重启 MySQL） -- innodb_buffer_pool_size = 70% of RAM -- innodb_log_file_size = 256M or larger -- innodb_flush_log_at_trx_commit = 2 -- 使用 LOAD DATA INFILE 进行高效导入 LOAD DATA INFILE '/path/to/large_file.csv' INTO TABLE large_table FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' IGNORE 1 LINES; -- 恢复设置 SET foreign_key_checks = 1; SET unique_checks = 1; SET autocommit = 1; COMMIT; -- 分批导入大文件的示例 DELIMITER // CREATE PROCEDURE ImportLargeFile( IN file_path VARCHAR(255), IN table_name VARCHAR(64), IN batch_size INT DEFAULT 10000 ) BEGIN DECLARE done INT DEFAULT FALSE; DECLARE batch_count INT DEFAULT 0; DECLARE total_rows INT DEFAULT 0; -- 这里需要实现分批读取文件的逻辑 -- 实际应用中可能需要外部脚本配合 SELECT CONCAT('Starting import to ', table_name) as status; -- 示例：假设我们有一个临时表来存储批次信息 WHILE batch_count < 100 DO -- 假设最多100个批次 -- 这里应该是实际的导入逻辑 SET batch_count = batch_count + 1; SET total_rows = total_rows + batch_size; SELECT CONCAT('Processed batch ', batch_count, ', total rows: ', total_rows) as progress; END WHILE; SELECT CONCAT('Import completed. Total rows: ', total_rows) as result; END // DELIMITER ; -- 并行导入（分割文件后并行处理） -- 文件1：records_1_100000.csv -- 文件2：records_100001_200000.csv -- 文件3：records_200001_300000.csv -- 在不同的连接中同时执行： -- Connection 1: -- LOAD DATA INFILE '/path/records_1_100000.csv' INTO TABLE target_table; -- Connection 2: -- LOAD DATA INFILE '/path/records_100001_200000.csv' INTO TABLE target_table; -- Connection 3: -- LOAD DATA INFILE '/path/records_200001_300000.csv' INTO TABLE target_table;
```
#### 导入错误处理
```sql
-- 创建错误日志表 CREATE TABLE import_errors ( id INT AUTO_INCREMENT PRIMARY KEY, import_session VARCHAR(50), table_name VARCHAR(64), error_type VARCHAR(50), error_message TEXT, raw_data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); -- 创建导入状态表 CREATE TABLE import_status ( id INT AUTO_INCREMENT PRIMARY KEY, session_id VARCHAR(50) UNIQUE, table_name VARCHAR(64), file_name VARCHAR(255), total_records INT, imported_records INT, error_records INT, status ENUM('running', 'completed', 'failed', 'cancelled'), start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, end_time TIMESTAMP NULL, notes TEXT ); -- 导入监控存储过程 DELIMITER // CREATE PROCEDURE StartImportSession( IN session_id VARCHAR(50), IN table_name VARCHAR(64), IN file_name VARCHAR(255), IN total_records INT ) BEGIN INSERT INTO import_status (session_id, table_name, file_name, total_records, imported_records, error_records, status) VALUES (session_id, table_name, file_name, total_records, 0, 0, 'running'); END // CREATE PROCEDURE UpdateImportProgress( IN session_id VARCHAR(50), IN imported_count INT, IN error_count INT ) BEGIN UPDATE import_status SET imported_records = imported_count, error_records = error_count WHERE session_id = session_id; END // CREATE PROCEDURE CompleteImportSession( IN session_id VARCHAR(50), IN final_status VARCHAR(20), IN notes TEXT ) BEGIN UPDATE import_status SET status = final_status, end_time = CURRENT_TIMESTAMP, notes = notes WHERE session_id = session_id; END // DELIMITER ; -- 使用示例 -- CALL StartImportSession('IMP-2024-001', 'users', 'users.csv', 10000); -- CALL UpdateImportProgress('IMP-2024-001', 5000, 10); -- CALL CompleteImportSession('IMP-2024-001', 'completed', 'Import successful'); -- 查询导入状态 SELECT session_id, table_name, file_name, CONCAT(imported_records, '/', total_records) as progress, ROUND((imported_records / total_records) * 100, 2) as percentage, error_records, status, TIMESTAMPDIFF(SECOND, start_time, COALESCE(end_time, NOW())) as duration_seconds FROM import_status ORDER BY start_time DESC;
```
#### 数据验证和清洗
```sql
-- 创建数据验证函数 DELIMITER // CREATE FUNCTION ValidateEmail(email VARCHAR(255)) RETURNS BOOLEAN READS SQL DATA DETERMINISTIC BEGIN RETURN email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'; END // CREATE FUNCTION ValidatePhone(phone VARCHAR(20)) RETURNS BOOLEAN READS SQL DATA DETERMINISTIC BEGIN RETURN phone REGEXP '^[0-9+\-\s\(\)]{10,20}$'; END // CREATE FUNCTION CleanString(input_str TEXT) RETURNS TEXT READS SQL DATA DETERMINISTIC BEGIN DECLARE cleaned TEXT; SET cleaned = TRIM(input_str); SET cleaned = REPLACE(cleaned, '\t', ' '); SET cleaned = REPLACE(cleaned, '\n', ' '); SET cleaned = REPLACE(cleaned, '\r', ' '); WHILE LOCATE(' ', cleaned) > 0 DO SET cleaned = REPLACE(cleaned, ' ', ' '); END WHILE; RETURN cleaned; END // DELIMITER ; -- 数据清洗示例 UPDATE temp_import_users SET username = CleanString(username), email = LOWER(TRIM(email)), phone = REGEXP_REPLACE(phone, '[^0-9+\-]', ''), age = CASE WHEN age < 0 OR age > 120 THEN NULL ELSE age END WHERE processed = FALSE; -- 验证数据质量 SELECT 'Total Records' as metric, COUNT(*) as count FROM temp_import_users UNION ALL SELECT 'Valid Emails' as metric, COUNT(*) as count FROM temp_import_users WHERE ValidateEmail(email) = TRUE UNION ALL SELECT 'Invalid Emails' as metric, COUNT(*) as count FROM temp_import_users WHERE ValidateEmail(email) = FALSE UNION ALL SELECT 'Duplicate Usernames' as metric, COUNT(*) - COUNT(DISTINCT username) as count FROM temp_import_users;
```
### 最佳实践和注意事项
#### 导入前准备
- 备份数据：导入前务必备份目标数据库
- 测试环境：先在测试环境验证导入流程
- 数据验证：检查数据格式、编码和完整性
- 权限检查：确保有足够的数据库权限
- 空间评估：确保有足够的磁盘空间
#### 性能优化建议
- 批量操作：使用批量插入而非逐条插入
- 禁用约束：导入时临时禁用外键和索引
- 调整参数：优化 MySQL 配置参数
- 并行处理：大文件分割后并行导入
- 事务控制：合理使用事务大小
#### 常见问题和解决方案
- 字符编码问题：确保文件编码与数据库字符集一致
- 文件路径限制：检查 secure_file_priv 设置
- 权限不足：确保 MySQL 用户有 FILE 权限
- 数据类型不匹配：检查数据格式与表结构的兼容性
- 重复数据：使用 REPLACE 或 IGNORE 处理重复记录
- 大文件超时：调整 max_execution_time 等参数
#### 导入安全考虑
```sql
-- 1. 创建专用导入用户 CREATE USER 'import_user'@'localhost' IDENTIFIED BY 'strong_password'; GRANT SELECT, INSERT, UPDATE, DELETE ON import_demo.* TO 'import_user'@'localhost'; GRANT FILE ON *.* TO 'import_user'@'localhost'; -- 仅在需要时授予 -- 2. 限制导入文件路径 -- 在 my.cnf 中设置： -- secure_file_priv = '/var/lib/mysql-files/' -- 3. 记录导入操作 CREATE TABLE import_audit ( id INT AUTO_INCREMENT PRIMARY KEY, user_name VARCHAR(50), operation VARCHAR(100), table_name VARCHAR(64), file_name VARCHAR(255), records_affected INT, execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ip_address VARCHAR(45), status VARCHAR(20) ); -- 4. 导入前检查 SELECT 'Database Size' as check_item, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = 'import_demo' UNION ALL SELECT 'Available Space' as check_item, ROUND((@@datadir_disk_usage_percentage), 2) as percentage; -- 5. 导入后验证 SELECT table_name, table_rows, ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb, create_time, update_time FROM information_schema.tables WHERE table_schema = 'import_demo' ORDER BY update_time DESC;
```
#### 自动化导入脚本
```bash
#!/bin/bash # MySQL 数据导入自动化脚本 # 配置变量 DB_HOST="localhost" DB_USER="import_user" DB_PASS="your_password" DB_NAME="import_demo" IMPORT_DIR="/var/lib/mysql-files" LOG_FILE="/var/log/mysql_import.log" BACKUP_DIR="/backup/mysql" # 日志函数 log_message() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE" } # 备份函数 backup_database() { log_message "Starting database backup..." mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql" if [ $? -eq 0 ]; then log_message "Database backup completed successfully" return 0 else log_message "Database backup failed" return 1 fi } # 导入函数 import_csv_file() { local file_path="$1" local table_name="$2" log_message "Starting import of $file_path to $table_name" # 检查文件是否存在 if [ ! -f "$file_path" ]; then log_message "Error: File $file_path not found" return 1 fi # 执行导入 mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF LOAD DATA INFILE '$file_path' INTO TABLE $table_name FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES; EOF if [ $? -eq 0 ]; then log_message "Import of $file_path completed successfully" return 0 else log_message "Import of $file_path failed" return 1 fi } # 主函数 main() { log_message "Starting automated import process" # 备份数据库 if ! backup_database; then log_message "Backup failed, aborting import" exit 1 fi # 导入文件列表 declare -A import_files=( ["$IMPORT_DIR/users.csv"]="users" ["$IMPORT_DIR/products.csv"]="products" ["$IMPORT_DIR/orders.csv"]="orders" ) # 执行导入 for file_path in "${!import_files[@]}"; do table_name="${import_files[$file_path]}" import_csv_file "$file_path" "$table_name" done log_message "Automated import process completed" } # 执行主函数 main "$@"
```
### 总结
> MySQL 数据导入是数据库管理中的重要技能，选择合适的导入方法可以大大提高工作效率。

#### 关键要点
- 方法选择：根据数据量、格式和需求选择合适的导入方法
- 性能优化：大数据量导入时注意性能优化技巧
- 错误处理：建立完善的错误处理和监控机制
- 数据验证：导入前后都要进行数据验证
- 安全考虑：注意导入操作的安全性和权限控制

