---
title: "MySQL数据库操作基础"
date: 2021-02-07T12:00:00+08:00
draft: false
description: "MySQL数据库操作基础：数据库创建、删除、选择、数据类型、创建数据表、删除数据表等。"
tags: ["MySQL", "数据库操作"]
categories: ["Database"]
---

MySQL数据库操作基础：数据库创建、删除、选择、数据类型、创建数据表、删除数据表等。

## MySQL 创建数据库
### MySQL 5.7 vs 8.x 默认设置对比
| 设置项 | MySQL 5.7 | MySQL 8.x |
| --- | --- | --- |
默认字符集 | latin1 | utf8mb4 |
默认排序规则 | latin1_swedish_ci | utf8mb4_0900_ai_ci |
Unicode 支持 | 需手动设置 utf8mb4 | 默认完整 Unicode 支持 |
Emoji 支持 | 需设置 utf8mb4 | 默认支持 |

### CREATE DATABASE 语法
```sql
-- 基本语法 
CREATE DATABASE [IF NOT EXISTS] database_name [CHARACTER SET charset_name] [COLLATE collation_name]; 
-- 简单示例 
CREATE DATABASE myapp; 
-- 完整示例 
CREATE DATABASE myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
-- 安全创建（如果不存在才创建） 
CREATE DATABASE IF NOT EXISTS myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
语法参数说明
- IF NOT EXISTS：如果数据库已存在，不会报错
- CHARACTER SET：指定数据库的默认字符集
- COLLATE：指定数据库的默认排序规则
### 字符集和排序规则
#### 常用字符集
```sql
-- 查看所有可用字符集 
SHOW CHARACTER SET; -- 常用字符集 

utf8mb4 -- 完整的UTF-8编码，支持4字节字符（推荐） 
utf8 -- UTF-8编码，最多3字节（不推荐，不支持emoji） 
latin1 -- 西欧字符集 
gbk -- 中文字符集 
ascii -- ASCII字符集
```
#### 常用排序规则
```sql
-- 查看字符集对应的排序规则 
SHOW COLLATION LIKE 'utf8mb4%'; -- UTF8MB4 常用排序规则 
utf8mb4_unicode_ci -- Unicode标准排序，支持多语言（推荐） 
utf8mb4_general_ci -- 通用排序，性能较好 
utf8mb4_bin -- 二进制排序，区分大小写 
utf8mb4_0900_ai_ci -- MySQL 8.x 默认，支持最新Unicode标准 
-- 排序规则后缀含义 
_ci -- Case Insensitive（不区分大小写） 
_cs -- Case Sensitive（区分大小写） 
_bin -- Binary（二进制排序） 
_ai -- Accent Insensitive（不区分重音） 
_as -- Accent Sensitive（区分重音）
```
#### MySQL 8.x 新增排序规则特性
- utf8mb4_0900_ai_ci：基于 Unicode 9.0 标准
- 更好的多语言支持：改进的排序算法
- 性能优化：更快的字符串比较
```sql
-- MySQL 8.x 推荐的数据库创建方式 
CREATE DATABASE modern_app CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```
### 实际应用示例

#### 1. 创建电商系统数据库
```sql
-- 电商系统数据库 
CREATE DATABASE IF NOT EXISTS ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '电商系统数据库'; 
-- 验证创建结果 
SHOW CREATE DATABASE ecommerce;
```
#### 2. 创建多语言博客数据库
```sql
-- 多语言博客数据库（MySQL 8.x） 
CREATE DATABASE IF NOT EXISTS blog_multilang CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '多语言博客系统'; 
-- 多语言博客数据库（MySQL 5.7 兼容） 
CREATE DATABASE IF NOT EXISTS blog_multilang_57 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '多语言博客系统 - MySQL 5.7 兼容';
```
#### 3. 创建日志系统数据库
```sql
-- 日志系统数据库（性能优先） 
CREATE DATABASE IF NOT EXISTS logs CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '系统日志数据库';
```
#### 4. 创建区分大小写的数据库
```sql
-- 需要区分大小写的数据库 
CREATE DATABASE IF NOT EXISTS case_sensitive_db CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '区分大小写的数据库';
```
### 数据库信息查询

#### 查看数据库列表
```sql
-- 查看所有数据库 
SHOW DATABASES; 
-- 查看数据库（带模式匹配） 
SHOW DATABASES LIKE 'my%'; 
-- 使用 INFORMATION_SCHEMA 查询 
SELECT SCHEMA_NAME as '数据库名' FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') ORDER BY SCHEMA_NAME;
```
#### 查看数据库详细信息
```sql
-- 查看数据库创建语句 
SHOW CREATE DATABASE myapp; 
-- 查看数据库字符集和排序规则 
SELECT SCHEMA_NAME as '数据库名', DEFAULT_CHARACTER_SET_NAME as '字符集', DEFAULT_COLLATION_NAME as '排序规则' FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'myapp'; 
-- 查看当前使用的数据库 
SELECT DATABASE(); 
-- 查看数据库大小 
SELECT table_schema as '数据库', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as '大小(MB)' FROM information_schema.tables WHERE table_schema = 'myapp' GROUP BY table_schema;
```

### 最佳实践
#### 1. 命名规范
- 使用小写字母和下划线
- 避免使用 MySQL 保留字
- 使用有意义的名称
- 保持名称简洁但描述性强
```sql
-- ✅ 好的命名示例 
CREATE DATABASE user_management; 
CREATE DATABASE ecommerce_system; 
CREATE DATABASE blog_platform; 
-- ❌ 不好的命名示例 
CREATE DATABASE Database; -- 使用了保留字 
CREATE DATABASE db1; -- 名称不够描述性 
CREATE DATABASE UserManagement; -- 使用了大写字母
```
#### 2. 字符集选择建议
```sql
-- 推荐：现代应用使用 
utf8mb4 CREATE DATABASE modern_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
-- MySQL 8.x 推荐 
CREATE DATABASE modern_app_8x CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; 
-- 性能敏感应用 
CREATE DATABASE performance_app CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```
#### 3. 创建数据库脚本模板
```sql
-- 完整的数据库创建脚本模板 
-- 检查并删除已存在的数据库（可选） 
DROP DATABASE IF EXISTS myapp; 
-- 创建数据库 
CREATE DATABASE IF NOT EXISTS myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '应用程序数据库'; 
-- 验证创建结果 
SHOW CREATE DATABASE myapp; 
-- 使用数据库 
USE myapp; 
-- 显示当前数据库 
SELECT DATABASE() as '当前数据库';
```
### 注意事项

#### 1. 字符集兼容性
- MySQL 5.7 默认使用 latin1，需要手动设置 utf8mb4
- 从 utf8 升级到 utf8mb4 需要谨慎处理
- 确保应用程序连接时指定正确的字符集
#### 2. 排序规则影响
```sql
-- 不同排序规则的比较结果 
-- utf8mb4_general_ci: 
'A' = 'a' = 'À' = 'á' 
-- utf8mb4_bin: 
'A' ≠ 'a' ≠ 'À' ≠ 'á' 
-- utf8mb4_unicode_ci: 
'A' = 'a', 'À' = 'à', 但 'A' ≠ 'À' 
-- 测试排序规则差异 
SELECT 'A' = 'a' COLLATE utf8mb4_general_ci as general_ci; SELECT 'A' = 'a' COLLATE utf8mb4_bin as binary;
```
#### 3. 性能考虑
- utf8mb4_general_ci 比 utf8mb4_unicode_ci 性能更好
- utf8mb4_unicode_ci 排序更准确，支持更多语言
根据应用需求选择合适的排序规则
### 数据库管理操作
#### 切换数据库
```sql
-- 使用 USE 语句切换数据库 
USE myapp; 
-- 验证当前数据库 
SELECT DATABASE();
```
#### 修改数据库属性
```sql
-- 修改数据库字符集和排序规则 
ALTER DATABASE myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; 
-- 仅修改字符集 
ALTER DATABASE myapp CHARACTER SET utf8mb4; 
-- 仅修改排序规则 
ALTER DATABASE myapp COLLATE utf8mb4_unicode_ci;
```
#### 数据库备份和恢复
```sql
-- 备份数据库结构（仅结构，不包含数据） 
mysqldump -u root -p --no-data myapp > myapp_structure.sql 
-- 备份完整数据库 
mysqldump -u root -p myapp > myapp_backup.sql 
-- 恢复数据库 
mysql -u root -p myapp < myapp_backup.sql 
-- 创建数据库并恢复 
mysql -u root -p -e "CREATE DATABASE myapp_restored CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 
mysql -u root -p myapp_restored < myapp_backup.sql
```
### 完整示例：创建项目数据库
```sql
-- 项目数据库创建完整脚本 -- ================================ 
-- 1. 检查 MySQL 版本 
SELECT VERSION() as 'MySQL版本'; 
-- 2. 查看当前字符集设置 
SHOW VARIABLES LIKE 'character_set%'; 
SHOW VARIABLES LIKE 'collation%'; 
-- 3. 创建项目数据库 
CREATE DATABASE IF NOT EXISTS project_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '项目管理系统数据库'; 
-- 4. 验证创建结果 
SHOW CREATE DATABASE project_management; 
-- 5. 使用数据库 
USE project_management; 
-- 6. 创建用户并授权（可选） 
CREATE USER IF NOT EXISTS 'project_user'@'localhost' IDENTIFIED BY 'secure_password'; GRANT ALL PRIVILEGES ON project_management.* TO 'project_user'@'localhost'; FLUSH PRIVILEGES; 
-- 7. 验证权限 
SHOW GRANTS FOR 'project_user'@'localhost'; 
-- 8. 显示最终状态 
SELECT DATABASE() as '当前数据库', USER() as '当前用户', @@character_set_database as '数据库字符集', @@collation_database as '数据库排序规则';
```
## MySQL 删除数据库

> 删除数据库是一个不可逆的操作，会永久删除数据库及其包含的所有表和数据。在执行删除操作前，务必确认数据库不再需要，并做好数据备份。

### ⚠️ 重要警告
- 删除数据库是不可逆的操作
- 删除后将永久丢失数据库中的所有数据
- 删除前务必进行数据备份
- 确保没有应用程序正在使用该数据库
- 检查是否有其他数据库依赖该数据库
### DROP DATABASE 语法
#### 基本语法
```sql
-- 删除数据库的基本语法 
DROP DATABASE database_name; 
-- 或者使用 SCHEMA（同义词） 
DROP SCHEMA database_name;
```
#### 安全删除语法
```sql
-- 如果数据库存在则删除（避免错误） 
DROP DATABASE IF EXISTS database_name; 
-- 示例 
DROP DATABASE IF EXISTS test_db;
```
### 删除前的准备工作
#### 1. 查看现有数据库
```sql
-- 列出所有数据库 
SHOW DATABASES; 
-- 查看特定数据库信息 
SHOW CREATE DATABASE database_name;
```
#### 2. 检查数据库使用情况
```sql
-- 查看当前连接的数据库 
SELECT DATABASE(); -- 查看数据库中的表 
USE database_name; 
SHOW TABLES; 
-- 查看数据库大小 
SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'database_name' GROUP BY table_schema;
```
#### 3. 数据备份
```bash
# 使用 mysqldump 备份数据库 
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql 
# 备份到指定目录 
mysqldump -u username -p database_name > /backup/database_name_backup.sql 
# 压缩备份 
mysqldump -u username -p database_name | gzip > database_name_backup.sql.gz
```
### 删除操作示例
#### 删除测试数据库
```sql
-- 1. 首先查看数据库是否存在 
SHOW DATABASES LIKE 'test_database'; 
-- 2. 切换到其他数据库（避免删除当前使用的数据库） 
USE mysql; 
-- 3. 删除数据库 
DROP DATABASE IF EXISTS test_database; 
-- 4. 确认删除成功 
SHOW DATABASES;
```
#### 批量删除多个数据库
```sql
-- 删除多个测试数据库 
DROP DATABASE IF EXISTS test_db1; 
DROP DATABASE IF EXISTS test_db2; 
DROP DATABASE IF EXISTS test_db3; 
-- 或者使用存储过程（高级用法） 
DELIMITER // 
CREATE PROCEDURE DropTestDatabases() 
BEGIN DECLARE done INT DEFAULT FALSE; 
DECLARE db_name VARCHAR(255); 
DECLARE cur CURSOR FOR SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'test_%'; 
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; 
OPEN cur; 
read_loop: LOOP FETCH cur INTO db_name; 
IF done THEN LEAVE read_loop; 
END IF; 
SET @sql = CONCAT('DROP DATABASE IF EXISTS ', db_name); 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
END LOOP; 
CLOSE cur; 
END
// DELIMITER ; 
-- 调用存储过程 
CALL DropTestDatabases(); 
-- 删除存储过程 
DROP PROCEDURE DropTestDatabases;
```
### 权限要求
- DROP 权限：对要删除的数据库具有 DROP 权限
- 全局权限：或者具有全局 DROP 权限
- 超级用户：root 用户默认具有所有权限
```sql
-- 检查当前用户权限 
SHOW GRANTS; 
-- 授予删除特定数据库的权限 
GRANT DROP ON database_name.* TO 'username'@'localhost'; 
-- 授予全局删除权限（谨慎使用） 
GRANT DROP ON *.* TO 'username'@'localhost'; 
-- 刷新权限 
FLUSH PRIVILEGES;
```
### 常见错误和解决方案
#### 错误 1：数据库不存在
```sql
-- 错误信息 
ERROR 1008 (HY000): Can't drop database 'database_name'; 
database doesn't exist 
-- 解决方案：使用 IF EXISTS DROP DATABASE IF EXISTS database_name;
```
#### 错误 2：权限不足
```sql
-- 错误信息 
ERROR 1044 (42000): Access denied for user 'username'@'localhost' to database 'database_name' 
-- 解决方案：检查并授予权限 SHOW GRANTS FOR 'username'@'localhost'; GRANT DROP ON database_name.* TO 'username'@'localhost';
```
#### 错误 3：数据库正在使用
```sql
-- 查看正在使用数据库的连接 
SHOW PROCESSLIST; 
-- 终止特定连接（谨慎使用）
 KILL connection_id; 
 -- 切换到其他数据库 
 USE mysql;
```
### 最佳实践

#### 删除数据库最佳实践
- 备份优先：删除前必须备份重要数据
- 确认环境：确保在正确的环境中操作
- 通知相关人员：通知可能受影响的团队成员
- 检查依赖：确认没有应用程序依赖该数据库
- 使用 IF EXISTS：避免因数据库不存在而报错
- 记录操作：记录删除操作的时间和原因
- 测试环境先行：在测试环境中先验证操作
### 恢复误删的数据库
#### 误删数据库的恢复方法
如果意外删除了数据库，可以尝试以下恢复方法：
```sql
-- 1. 从备份恢复 
mysql -u username -p < database_backup.sql 
-- 2. 从二进制日志恢复（如果启用了二进制日志） 
-- 查找删除操作的位置 
mysqlbinlog --start-datetime="2024-01-01 00:00:00" \ 
--stop-datetime="2024-01-01 23:59:59" \ 
mysql-bin.000001 
-- 恢复到删除前的状态 
mysqlbinlog --stop-position=1234 mysql-bin.000001 | mysql -u username -p 
-- 3. 重新创建数据库并导入数据 
CREATE DATABASE recovered_database; 
mysql -u username -p recovered_database < backup.sql
```
## MySQL 选择数据库
> 在 MySQL 中，选择数据库是进行数据操作的前提步骤。通过 USE 语句可以指定当前会话要操作的数据库，之后的所有 SQL 操作都将在该数据库中执行。

### USE 语句语法
#### 基本语法
```sql
-- 选择数据库的基本语法 
USE database_name; 
-- 示例 
USE my_database; 
USE company_db; 
USE test_schema;
```
#### 查看当前数据库
```sql
-- 查看当前选择的数据库 
SELECT DATABASE(); 
-- 或者使用 
SELECT SCHEMA(); 
-- 查看当前连接信息 
SELECT USER(), DATABASE(), VERSION();
```
### 数据库选择示例
#### 基本选择操作
```sql
-- 1. 查看所有可用数据库 
SHOW DATABASES; 
-- 2. 选择特定数据库 
USE company_database; 
-- 3. 确认当前数据库 
SELECT DATABASE(); 
-- 4. 查看数据库中的表 
SHOW TABLES; 
-- 5. 查看表结构 
DESCRIBE table_name;
```
#### 连接时指定数据库
```bash
# 命令行连接时直接指定数据库 
mysql -u username -p database_name 
# 示例 
mysql -u root -p company_db mysql -u admin -p -h localhost test_database 
# 连接远程数据库并指定数据库 
mysql -u username -p -h remote_host -P 3306 database_name
```
### 数据库信息查询
#### 查看数据库列表
```sql
-- 显示所有数据库 
SHOW DATABASES; 
-- 显示匹配模式的数据库 
SHOW DATABASES LIKE 'test%'; SHOW DATABASES LIKE '%_db'; 
-- 使用 WHERE 子句过滤 
SHOW DATABASES WHERE `Database` NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys');
```
#### 查看数据库详细信息
```sql
-- 查看数据库创建语句 
SHOW CREATE DATABASE database_name; 
-- 查看数据库字符集和排序规则 
SELECT SCHEMA_NAME as 'Database', DEFAULT_CHARACTER_SET_NAME as 'Charset', DEFAULT_COLLATION_NAME as 'Collation' FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'database_name'; 
-- 查看数据库大小 
SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'database_name' GROUP BY table_schema;
```
### 表操作示例
#### 选择数据库后的表操作
```sql
-- 选择数据库 
USE company_db; 
-- 查看所有表 
SHOW TABLES; 
-- 查看表状态 
SHOW TABLE STATUS; 
-- 查看特定表的结构 
DESCRIBE employees; 
SHOW COLUMNS FROM employees; 
-- 查看表的创建语句 
SHOW CREATE TABLE employees; 
-- 查询表数据 
SELECT * FROM employees LIMIT 10;
```
#### 跨数据库操作
```sql
-- 不切换数据库，直接指定数据库名 
SELECT * FROM database1.table1; 
SELECT * FROM database2.table2; 
-- 跨数据库连接查询 
SELECT a.name, b.department FROM database1.employees a JOIN database2.departments b ON a.dept_id = b.id; 
-- 跨数据库数据复制 
INSERT INTO database2.backup_table SELECT * FROM database1.original_table;
```
### 权限和访问控制
#### 数据库访问权限
```sql
-- 查看当前用户对数据库的权限 
SHOW GRANTS; 
-- 查看特定用户的权限 
SHOW GRANTS FOR 'username'@'localhost'; 
-- 授予数据库访问权限 
GRANT SELECT ON database_name.* TO 'username'@'localhost'; GRANT ALL PRIVILEGES ON database_name.* TO 'username'@'localhost'; 
-- 撤销权限 
REVOKE SELECT ON database_name.* FROM 'username'@'localhost';
```
#### 权限级别说明
- 全局权限：对所有数据库的权限
- 数据库权限：对特定数据库的权限
- 表权限：对特定表的权限
- 列权限：对特定列的权限
### 常见错误和解决方案
#### 错误 1：数据库不存在
```sql
-- 错误信息 
ERROR 1049 (42000): Unknown database 'database_name' 
-- 解决方案：
-- 检查数据库是否存在 
SHOW DATABASES; 
SHOW DATABASES LIKE 'database_name'; 
-- 如果不存在，创建数据库 
CREATE DATABASE database_name;
```
#### 错误 2：权限不足
```sql
-- 错误信息 
ERROR 1044 (42000): Access denied for user 'username'@'localhost' to database 'database_name' 
-- 解决方案：
-- 检查并授予权限 
SHOW GRANTS FOR 'username'@'localhost'; 
-- 由管理员授予权限 
GRANT USAGE ON database_name.* TO 'username'@'localhost';
```
#### 错误 3：没有选择数据库
```sql
-- 错误信息 
ERROR 1046 (3D000): No database selected 
-- 解决方案：
--选择数据库 
USE database_name; 
-- 或者在查询中指定数据库 
SELECT * FROM database_name.table_name;
```
### 最佳实践

- 明确指定：总是明确指定要操作的数据库
- 权限最小化：只授予必要的数据库访问权限
- 连接时指定：在连接时就指定数据库，避免后续切换
- 错误处理：处理数据库不存在或权限不足的情况
- 会话管理：在长连接中定期确认当前数据库
- 跨库操作：谨慎进行跨数据库操作，注意性能影响
- 命名规范：使用清晰的数据库命名规范
### 实用技巧
#### 快速切换数据库
```sql
-- 在 MySQL 命令行中快速切换 
\u database_name 
-- 等同于 
USE database_name; 
-- 查看当前状态 
\s 
-- 或者 
STATUS;
```
#### 批量操作多个数据库
```sql
-- 批量操作多个数据库 
-- 假设我们有多个项目数据库，命名为 project_1, project_2, ..., project_n 
-- 我们想对每个数据库执行相同的操作（例如：查询所有表） 
-- 可以使用存储过程和游标来实现批量操作 
-- 创建存储过程来操作多个数据库 
DELIMITER // 
CREATE PROCEDURE ProcessMultipleDatabases() 
BEGIN DECLARE done INT DEFAULT FALSE; 
DECLARE db_name VARCHAR(255); 
DECLARE cur CURSOR FOR SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'project_%'; 
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; 
OPEN cur; 
read_loop: LOOP FETCH cur INTO db_name; 
IF done THEN LEAVE read_loop; 
END IF; 
-- 切换到数据库并执行操作 
SET @sql = CONCAT('USE ', db_name); PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
-- 在这里添加具体的操作 
-- 例如：
SELECT COUNT(*) FROM some_table; END LOOP; CLOSE cur; END
// DELIMITER ;
```
## MySQL 数据类型
MySQL 支持多种数据类型，分为数值类型、字符串类型、日期时间类型和 JSON 类型等。选择合适的数据类型对于数据库性能和存储效率至关重要。

MySQL 5.7 vs 8.x 数据类型差异

- 默认字符集：MySQL 8.x 默认使用 utf8mb4，MySQL 5.7 默认使用 latin1
- JSON 增强：MySQL 8.x 提供了更多 JSON 函数和操作符
- 几何类型：MySQL 8.x 对空间数据类型有更好的支持
- 新增函数：MySQL 8.x 新增了窗口函数相关的数据处理能力
### 数值类型
#### 整数类型
| 类型 | 字节 | 有符号范围 | 无符号范围 | 用途 |
| --- | --- | --- | --- | --- |
| TINYINT | 1 | -128 到 127 | 0 到 255 | 布尔值、状态码 |
| SMALLINT | 2 | -32,768 到 32,767 | 0 到 65,535 | 年龄、数量 |
| MEDIUMINT | 3 | -8,388,608 到 8,388,607 | 0 到 16,777,215 | 中等范围计数 |
| INTEGER/INT | 4 | -2,147,483,648 到 2,147,483,647 | 0 到 4,294,967,295 | 大范围计数、计数 |
| BIGINT | 8 | -9,223,372,036,854,775,808 到 9,223,372,036,854,775,807 | 0 到 18,446,744,073,709,551,615 | 大数值、时间戳 |
```sql
-- 整数类型示例 
CREATE TABLE number_examples ( 
id INT AUTO_INCREMENT PRIMARY KEY, 
age TINYINT UNSIGNED, -- 年龄 (0-255) 
quantity SMALLINT, -- 数量 
user_id INT UNSIGNED, -- 用户ID 
timestamp_val BIGINT, -- 时间戳 
is_active BOOLEAN -- 布尔值 (TINYINT(1) 的别名) 
);
```
#### 浮点和定点类型
| 类型 | 字节 | 精度 | 用途 |
| --- | --- | --- | --- |
| FLOAT | 4 | 单精度浮点 | 科学计算 |
| DOUBLE | 8 | 双精度浮点 | 高精度计算 |
| DECIMAL(M,D) | 变长 | 精确小数 | 金融、货币 |
```sql
-- 浮点类型示例 
CREATE TABLE financial_data ( 
id INT AUTO_INCREMENT PRIMARY KEY, 
price DECIMAL(10,2), -- 价格，精确到分 
weight FLOAT, -- 重量 
coordinates DOUBLE, -- 坐标 percentage 
DECIMAL(5,2) -- 百分比 (999.99%) 
);
```
### 字符串类型
| 类型 | 描述 | 最大长度 | 存储需求 | 用途 |
| --- | --- | --- | --- | --- |
| CHAR(M) | 固定长度字符串 | M 字节 | M 字节 | 状态码、枚举值 |
| VARCHAR(M) | 可变长度字符串 | M 字节 | L+1 或 L+2 字节 | 用户名、邮箱 |
| TEXT | 长文本 | 65,535 字符 | L+2 字节 | 内容、描述 |
| MEDIUMTEXT | 中等长度文本 | 16,777,215 字符 | L+3 字节 | 标题 |
| LONGTEXT | 超长文本 | 4,294,967,295 字符 | L+4 字节 | 完整内容 |

> MySQL 8.x 默认字符集为 utf8mb4，完全支持 Unicode，包括 emoji 表情符号。
```sql
-- 字符串类型示例 
CREATE TABLE content_table ( 
id INT AUTO_INCREMENT PRIMARY KEY, 
username VARCHAR(50) NOT NULL, -- 用户名 
email VARCHAR(100) NOT NULL, -- 邮箱 
status CHAR(1) DEFAULT 'A', -- 状态码 
title VARCHAR(200), -- 标题 
content TEXT, -- 内容 description 
MEDIUMTEXT, -- 描述 
full_content LONGTEXT -- 完整内容 
) 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
### 二进制类型
| 类型 | 描述 | 最大长度 | 存储需求 | 用途 |
| --- | --- | --- | --- | --- |
| BINARY(M) | 固定长度二进制 | M 字节 | M 字节 | 加密数据 |
| VARBINARY(M) | 可变长度二进制 | M 字节 | L+1 或 L+2 字节 | 图像、文件 |
| BLOB | 二进制大对象 | 65,535 字节 | L+2 字节 | 图像、文件 |
| MEDIUMBLOB | 中等二进制对象 | 16,777,215 字节 | L+3 字节 | 图像、文件 |
| LONGBLOB | 大型二进制对象 | 4,294,967,295 字节 | L+4 字节 | 图像、文件 |

### 日期时间类型
| 类型 | 描述 | 存储需求 | 用途 |
| --- | --- | --- | --- |
| DATE | 日期 | 3 字节 | 日期 |
| TIME | 时间 | 3 字节 | 时间 |
| DATETIME | 日期时间 | 8 字节 | 日期时间 |
| TIMESTAMP | 时间戳 | 4 字节 | 数据库记录创建时间 |
| YEAR | 年份 | 1 字节 | 年份 |
```sql
-- 日期时间类型示例 
CREATE TABLE event_table ( 
id INT AUTO_INCREMENT PRIMARY KEY, 
event_date DATE, -- 事件日期 
event_time TIME, -- 事件时间 
created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间 
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间 
birth_year YEAR -- 出生年份 
);
```
### 特殊类型
#### JSON 类型（MySQL 5.7+）

> MySQL 8.x JSON 增强功能:
> - 更多 JSON 函数：JSON_TABLE(),JSON_ARRAYAGG(), JSON_OBJECTAGG()
> - JSON 路径表达式增强
> - 更好的 JSON 索引支持
```sql
-- JSON 类型示例 
CREATE TABLE user_profiles ( 
    id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), 
    profile JSON, -- JSON 数据 
    settings JSON 
); 
-- 插入 JSON 数据 
INSERT INTO user_profiles (username, profile, settings) 
VALUES ('john_doe', '{"age": 30, "city": "Beijing", "hobbies": ["reading", "coding"]}', '{"theme": "dark", "notifications": true, "language": "zh-CN"}' 
); 
-- 查询 JSON 数据 (MySQL 5.7+) 
SELECT username, JSON_EXTRACT(profile, '$.age') as age, JSON_EXTRACT(profile, '$.city') as city FROM user_profiles; 
-- MySQL 8.x 简化语法 
SELECT username, profile->>'$.age' as age, profile->>'$.city' as city FROM user_profiles;
```
#### ENUM 和 SET 类型
```sql
-- ENUM 和 SET 类型示例 
CREATE TABLE user_preferences ( 
    id INT AUTO_INCREMENT PRIMARY KEY, status ENUM('active', 'inactive', 'pending') DEFAULT 'pending', -- 枚举 
    permissions SET('read', 'write', 'delete', 'admin'), -- 集合 
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium' 
); 
-- 插入数据 
INSERT INTO user_preferences (status, permissions, priority) 
VALUES ('active', 'read,write', 'high'), ('pending', 'read', 'low');
```
### 数据类型选择建议
- 整数类型：根据数值范围选择最小的类型，节省存储空间
- 字符串类型：固定长度用 CHAR，可变长度用 VARCHAR
- 文本类型：短文本用 VARCHAR，长文本用 TEXT
- 小数类型：精确计算用 DECIMAL，科学计算用 FLOAT/DOUBLE
- 日期时间：需要时区转换用 TIMESTAMP，否则用 DATETIME
- JSON 类型：存储结构化数据，但注意查询性能
> ⚠️ 版本兼容性注意事项
> - 字符集：从 MySQL 5.7 升级到 8.x 时注意字符集变化
> - JSON 函数：某些 JSON 函数仅在 MySQL 8.x 中可用
> - 默认值：MySQL 8.x 对默认值的处理更严格
> - SQL 模式：MySQL 8.x 默认启用更严格的 SQL 模式

## MySQL 创建数据表
> 数据表是数据库中存储数据的基本单位。创建表需要定义表名、列名、数据类型、约束条件等。良好的表设计是数据库性能和数据完整性的基础。

### CREATE TABLE 语法
#### 基本语法
```sql
-- 创建表的基本语法 
CREATE TABLE table_name ( 
    column1 datatype constraints, 
    column2 datatype constraints, 
    column3 datatype constraints, ... table_constraints 
); 
-- 简单示例 
CREATE TABLE users ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(50) NOT NULL, 
    email VARCHAR(100) NOT NULL UNIQUE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);
```
#### 完整语法结构
```sql
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] table_name ( 
    column_definition, ... [table_constraint] 
) 
[ENGINE=engine_name] [CHARACTER SET charset_name] [COLLATE collation_name] [COMMENT='table_comment'];
```
### 列定义和数据类型
#### 常用数据类型
<table>
  <thead>
    <tr>
      <th>类型分类</th>
      <th>数据类型</th>
      <th>说明</th>
      <th>示例</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">整数类型</td>
      <td>TINYINT</td>
      <td>1字节，-128到127</td>
      <td>age TINYINT</td>
    </tr>
    <tr>
      <td>SMALLINT</td>
      <td>2字节，-32768到32767</td>
      <td>year SMALLINT</td>
    </tr>
    <tr>
      <td>INT</td>
      <td>4字节，约-21亿到21亿</td>
      <td>id INT</td>
    </tr>
    <tr>
      <td>BIGINT</td>
      <td>8字节，超大整数</td>
      <td>user_id BIGINT</td>
    </tr>
    <tr>
      <td rowspan="2">浮点类型</td>
      <td>FLOAT</td>
      <td>4字节单精度</td>
      <td>price FLOAT(8,2)</td>
    </tr>
    <tr>
      <td>DOUBLE</td>
      <td>8字节双精度</td>
      <td>salary DOUBLE(10,2)</td>
    </tr>
    <tr>
      <td rowspan="3">字符串类型</td>
      <td>VARCHAR</td>
      <td>可变长度字符串</td>
      <td>name VARCHAR(100)</td>
    </tr>
    <tr>
      <td>CHAR</td>
      <td>固定长度字符串</td>
      <td>code CHAR(10)</td>
    </tr>
    <tr>
      <td>TEXT</td>
      <td>长文本</td>
      <td>description TEXT</td>
    </tr>
    <tr>
      <td rowspan="3">日期时间类型</td>
      <td>DATE</td>
      <td>日期</td>
      <td>YYYY-MM-DD</td>
    </tr>
    <tr>
      <td>TIME</td>
      <td>时间</td>
      <td>HH:MM:SS</td>
    </tr>
    <tr>
      <td>DATETIME</td>
      <td>日期时间</td>
      <td>created_at DATETIME</td>
    </tr>
  </tbody>
</table>

### 约束条件
#### 列约束
```sql
-- 主键约束 
id INT AUTO_INCREMENT PRIMARY KEY -- 非空约束 
username VARCHAR(50) NOT NULL 
-- 唯一约束 
email VARCHAR(100) UNIQUE 
-- 默认值 
status VARCHAR(20) DEFAULT 'active' created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
-- 检查约束（MySQL 8.0.16+） 
age INT CHECK (age >= 0 AND age <= 150) 
-- 外键约束 
user_id INT, FOREIGN KEY (user_id) REFERENCES users(id)
```
#### 表约束
```sql
CREATE TABLE orders ( 
    id INT AUTO_INCREMENT, 
    user_id INT NOT NULL, 
    product_id INT NOT NULL, 
    quantity INT NOT NULL, 
    order_date DATE NOT NULL, 
    total_amount DECIMAL(10,2) NOT NULL, 
    -- 主键约束 
    PRIMARY KEY (id), 
    -- 外键约束 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT, 
    -- 唯一约束 
    UNIQUE KEY unique_user_product (user_id, product_id, order_date), 
    -- 检查约束 
    CHECK (quantity > 0), CHECK (total_amount >= 0) 
);
```
### 实际创建示例
#### 用户表示例
```sql
CREATE TABLE users ( 
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID', 
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名', 
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱', 
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希', 
    first_name VARCHAR(50) COMMENT '名', 
    last_name VARCHAR(50) COMMENT '姓', 
    phone VARCHAR(20) COMMENT '电话号码', 
    birth_date DATE COMMENT '出生日期', 
    gender ENUM('M', 'F', 'Other') COMMENT '性别', 
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '状态', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间', 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间', 
    INDEX idx_username (username), 
    INDEX idx_email (email), 
    INDEX idx_status (status), 
    INDEX idx_created_at (created_at) 
) 
ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```
#### 商品表示例
```sql
CREATE TABLE products ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(200) NOT NULL COMMENT '商品名称', 
    description TEXT COMMENT '商品描述', 
    category_id INT NOT NULL COMMENT '分类ID', 
    brand VARCHAR(100) COMMENT '品牌', 
    model VARCHAR(100) COMMENT '型号', 
    price DECIMAL(10,2) NOT NULL COMMENT '价格', 
    cost DECIMAL(10,2) COMMENT '成本', 
    stock_quantity INT DEFAULT 0 COMMENT '库存数量', 
    weight DECIMAL(8,3) COMMENT '重量(kg)', 
    dimensions VARCHAR(50) COMMENT '尺寸', 
    color VARCHAR(30) COMMENT '颜色', 
    material VARCHAR(100) COMMENT '材质', 
    warranty_period INT COMMENT '保修期(月)', 
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    FOREIGN KEY (category_id) REFERENCES categories(id), 
    INDEX idx_name (name), 
    INDEX idx_category (category_id), 
    INDEX idx_brand (brand), 
    INDEX idx_price (price), 
    INDEX idx_stock (stock_quantity), 
    INDEX idx_active (is_active) 
) 
ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
#### 订单表示例
```sql
CREATE TABLE orders ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    order_number VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号', 
    user_id INT NOT NULL COMMENT '用户ID', 
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending', 
    total_amount DECIMAL(12,2) NOT NULL COMMENT '总金额', 
    shipping_fee DECIMAL(8,2) DEFAULT 0 COMMENT '运费', 
    tax_amount DECIMAL(10,2) DEFAULT 0 COMMENT '税费', 
    discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT '折扣金额', 
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'cash') COMMENT '支付方式', 
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending', 
    shipping_address TEXT COMMENT '收货地址', 
    billing_address TEXT COMMENT '账单地址', 
    notes TEXT COMMENT '备注', 
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间', 
    shipped_date TIMESTAMP NULL COMMENT '发货时间', 
    delivered_date TIMESTAMP NULL COMMENT '送达时间', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    FOREIGN KEY (user_id) REFERENCES users(id), 
    INDEX idx_order_number (order_number), 
    INDEX idx_user_id (user_id), 
    INDEX idx_status (status), 
    INDEX idx_payment_status (payment_status), 
    INDEX idx_order_date (order_date) 
) 
ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
### 高级特性
#### 分区表
```sql
-- 按日期分区 
CREATE TABLE sales_data ( 
    id INT AUTO_INCREMENT, 
    sale_date DATE NOT NULL, 
    amount DECIMAL(10,2), 
    customer_id INT, 
    PRIMARY KEY (id, sale_date) 
) 
PARTITION BY RANGE (YEAR(sale_date)) 
( PARTITION p2020 VALUES LESS THAN (2021), 
PARTITION p2021 VALUES LESS THAN (2022), 
PARTITION p2022 VALUES LESS THAN (2023), 
PARTITION p2023 VALUES LESS THAN (2024), 
PARTITION p_future VALUES LESS THAN MAXVALUE 
); 
-- 按哈希分区 
CREATE TABLE user_logs ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    action VARCHAR(100), 
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
) 
PARTITION BY HASH(user_id) PARTITIONS 4;
```
#### 临时表
```sql
-- 创建临时表 
CREATE TEMPORARY TABLE temp_calculations ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    value1 DECIMAL(10,2), 
    value2 DECIMAL(10,2), 
    result DECIMAL(10,2) 
); -- 临时表只在当前会话中存在 -- 会话结束时自动删除
```
### 存储引擎选择
#### 常用存储引擎
- InnoDB：默认引擎，支持事务、外键、行级锁
- MyISAM：较快的读取速度，不支持事务
- Memory：数据存储在内存中，速度极快
- Archive：用于数据归档，高压缩比
```sql
-- 指定存储引擎 
CREATE TABLE fast_cache ( 
    id INT PRIMARY KEY, 
    data VARCHAR(255) 
) ENGINE=Memory; 
CREATE TABLE archive_logs ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    log_data TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
) ENGINE=Archive;
```
### 字符集和排序规则
```sql
-- 指定字符集和排序规则 
CREATE TABLE multilingual_content ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    title VARCHAR(200), 
    content TEXT, 
    language CHAR(2) 
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
-- 为特定列指定不同的字符集 
CREATE TABLE mixed_charset ( 
    id INT PRIMARY KEY, 
    ascii_data VARCHAR(100) CHARACTER SET ascii, 
    utf8_data VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, 
    binary_data VARBINARY(255) 
);
```
### 常见错误和解决方案
#### 错误 1：表已存在
```sql
-- 错误信息 
ERROR 1050 (42S01): Table 'table_name' already exists 
-- 解决方案：
使用 IF NOT EXISTS CREATE TABLE IF NOT EXISTS users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL );
```
### 错误 2：外键约束失败
```sql
-- 错误信息 
ERROR 1215 (HY000): Cannot add foreign key constraint 
-- 解决方案：确保引用的表和列存在，数据类型匹配 
-- 1. 先创建被引用的表 
CREATE TABLE categories ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL ); 
-- 2. 再创建引用表 
CREATE TABLE products ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    category_id INT, 
    FOREIGN KEY (category_id) REFERENCES categories(id) 
);
```
### 表设计最佳实践
- 命名规范：使用清晰、一致的命名规范
- 主键设计：每个表都应该有主键
- 数据类型：选择合适的数据类型，避免浪费空间
- 索引规划：为经常查询的列创建索引
- 约束使用：合理使用约束保证数据完整性
- 注释添加：为表和列添加有意义的注释
- 字符集统一：使用 utf8mb4 字符集

## MySQL 删除数据表
> 删除数据表是一个不可逆的操作，会永久删除表结构和表中的所有数据。在执行删除操作前，务必确认表不再需要，并做好数据备份。

⚠️ 重要警告
- 删除表是不可逆的操作
- 删除后将永久丢失表结构和所有数据
- 删除前务必进行数据备份
- 检查是否有外键约束引用该表
- 确保没有应用程序正在使用该表

### DROP TABLE 语法
#### 基本语法
```sql
-- 删除单个表 
DROP TABLE table_name; 
-- 删除多个表 
DROP TABLE table1, table2, table3; 
-- 安全删除（如果表存在） 
DROP TABLE IF EXISTS table_name;
```
#### 完整语法
```sql
DROP [TEMPORARY] TABLE [IF EXISTS] table_name [, table_name] ... [RESTRICT | CASCADE];
```
### 删除前的准备工作
#### 1. 查看表信息
```sql
-- 查看数据库中的所有表 
SHOW TABLES; 
-- 查看表结构 
DESCRIBE table_name; 
SHOW CREATE TABLE table_name; 
-- 查看表状态 
SHOW TABLE STATUS LIKE 'table_name'; 
-- 查看表大小 
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'table_name';
```
#### 2. 检查外键约束
```sql
-- 查看引用该表的外键 
SELECT TABLE_NAME, 
COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME = 'table_name' AND TABLE_SCHEMA = DATABASE(); 
-- 查看该表的外键约束 
SELECT TABLE_NAME, 
COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'table_name' AND REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA = DATABASE();
```
#### 3. 数据备份
 ```sql
-- 备份表结构 
mysqldump -u username -p --no-data database_name table_name > table_structure.sql -- 备份表数据 
mysqldump -u username -p --no-create-info database_name table_name > table_data.sql 
-- 备份完整表（结构+数据） 
mysqldump -u username -p database_name table_name > table_backup.sql 
-- 备份多个表 mysqldump -u username -p database_name table1 table2 table3 > tables_backup.sql
```
### 删除操作示例
#### 删除单个表
```sql
-- 1. 检查表是否存在 
SHOW TABLES LIKE 'temp_table'; 
-- 2. 查看表结构（可选） 
DESCRIBE temp_table; 
-- 3. 删除表 
DROP TABLE IF EXISTS temp_table; 
-- 4. 确认删除成功 
SHOW TABLES LIKE 'temp_table';
```
#### 删除多个表
```sql
-- 删除多个相关表 
DROP TABLE IF EXISTS order_items, orders, customers; 
-- 或者分别删除 
DROP TABLE IF EXISTS order_items; 
DROP TABLE IF EXISTS orders; 
DROP TABLE IF EXISTS customers;
```
#### 处理外键约束
```sql
-- 方法1：先删除外键约束，再删除表 
ALTER TABLE child_table DROP FOREIGN KEY fk_constraint_name; 
DROP TABLE parent_table; 
-- 方法2：按正确顺序删除表（先删除子表，再删除父表） 
DROP TABLE IF EXISTS order_items;-- 子表 
DROP TABLE IF EXISTS orders; -- 父表 
DROP TABLE IF EXISTS customers; -- 父表 
-- 方法3：临时禁用外键检查（谨慎使用） 
SET FOREIGN_KEY_CHECKS = 0; 
DROP TABLE parent_table; 
DROP TABLE child_table; 
SET FOREIGN_KEY_CHECKS = 1;
```
### 特殊删除操作
#### 删除临时表
```sql
-- 删除临时表 
DROP TEMPORARY TABLE IF EXISTS temp_calculations; 
-- 临时表只在当前会话中存在 
-- 会话结束时会自动删除
```
#### 删除分区表
```sql
-- 删除特定分区 
ALTER TABLE sales_data DROP PARTITION p2020; 
-- 删除整个分区表 
DROP TABLE IF EXISTS sales_data;
```
#### 删除视图
```sql
-- 删除视图（不是表） 
DROP VIEW IF EXISTS view_name; 
-- 查看是表还是视图 
SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'object_name';
```

### 批量删除操作
#### 删除匹配模式的表
```sql
-- 生成删除语句（需要手动执行） 
SELECT CONCAT('DROP TABLE IF EXISTS ', table_name, ';') AS drop_statement 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name LIKE 'temp_%'; 
-- 使用存储过程批量删除 
DELIMITER // 
CREATE PROCEDURE DropTempTables() 
BEGIN DECLARE done INT DEFAULT FALSE; 
DECLARE table_name VARCHAR(255); 
DECLARE cur CURSOR FOR SELECT t.table_name FROM information_schema.tables t WHERE t.table_schema = DATABASE() AND t.table_name LIKE 'temp_%'; 
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; 
OPEN cur; 
read_loop: LOOP FETCH cur INTO table_name; 
IF done THEN LEAVE read_loop; 
END IF; 
SET @sql = CONCAT('DROP TABLE IF EXISTS ', table_name); 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
END LOOP; 
CLOSE cur; 
END
// DELIMITER ; 
-- 调用存储过程 
CALL DropTempTables(); 
-- 删除存储过程 
DROP PROCEDURE DropTempTables;
```
### 权限要求
#### 删除表所需权限
- DROP 权限：对要删除的表具有 DROP 权限
- 数据库权限：对数据库具有 DROP 权限
- 全局权限：或者具有全局 DROP 权限
```sql
-- 检查当前用户权限 
SHOW GRANTS; 
-- 授予删除特定表的权限 
GRANT DROP ON database_name.table_name TO 'username'@'localhost'; 
-- 授予数据库级别的删除权限 
GRANT DROP ON database_name.* TO 'username'@'localhost'; 
-- 刷新权限 
FLUSH PRIVILEGES;
```
### 常见错误和解决方案
#### 错误 1：表不存在
```sql
-- 错误信息 
ERROR 1051 (42S02): Unknown table 'database.table_name' 
-- 解决方案：
使用 IF EXISTS DROP TABLE IF EXISTS table_name;
```
#### 错误 2：外键约束阻止删除
```sql
-- 错误信息 
ERROR 1217 (23000): Cannot delete or update a parent row: a foreign key constraint fails 
-- 解决方案1：
-- 先删除子表 
DROP TABLE child_table; 
DROP TABLE parent_table; 
-- 解决方案2：
-- 删除外键约束 
ALTER TABLE child_table DROP FOREIGN KEY constraint_name; 
DROP TABLE parent_table;
```
#### 错误 3：权限不足
```sql
-- 错误信息 
ERROR 1142 (42000): DROP command denied to user 'username'@'localhost' for table 'table_name' 
-- 解决方案：检查并授予权限 
SHOW GRANTS FOR 'username'@'localhost'; GRANT DROP ON database_name.table_name TO 'username'@'localhost';
```

### 数据清理 vs 表删除
#### 清空表数据（保留结构）
```sql
-- TRUNCATE：快速清空表，重置自增ID 
TRUNCATE TABLE table_name; 
-- DELETE：删除所有数据，不重置自增ID 
DELETE FROM table_name; 
-- 比较 
-- TRUNCATE: 更快，不能回滚，重置AUTO_INCREMENT 
-- DELETE: 较慢，可以回滚，保持AUTO_INCREMENT
```
#### 重命名表（而非删除）
```sql
-- 重命名表 
RENAME TABLE old_table_name TO new_table_name; 
-- 移动到其他数据库 
RENAME TABLE current_db.table_name TO archive_db.table_name; 
-- 批量重命名 
RENAME TABLE old_table1 TO new_table1, old_table2 TO new_table2;
```
### 删除表最佳实践
- 备份优先：删除前必须备份重要数据
- 确认环境：确保在正确的环境中操作
- 检查依赖：确认没有外键约束和应用程序依赖
- 使用 IF EXISTS：避免因表不存在而报错(但实际中，最好不要用if exists，给自己一次缓冲的机会)
- 分步操作：先删除子表，再删除父表
- 记录操作：记录删除操作的时间和原因
- 测试环境先行：在测试环境中先验证操作
- 考虑重命名：对于重要表，考虑重命名而非删除

