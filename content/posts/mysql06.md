---
title: "MySQL函数与运算"
date: 2021-02-11T11:00:00+08:00
draft: false
description: "MySQL函数与运算：数学函数、字符串函数、日期函数、时间函数、控制流程函数等。"
tags: ["MySQL", "mysql函数"]
categories: ["Database"]
---
MySQL函数与运算：数学函数、字符串函数、日期函数、时间函数、控制流程函数等。
## MySQL 函数
### 函数概述
> MySQL 提供了丰富的内置函数，用于处理字符串、数值、日期时间等数据类型。合理使用函数可以简化查询逻辑，提高开发效率。

- 字符串函数
处理文本数据，包括连接、截取、替换、格式化等操作

- 数值函数
数学运算、取整、随机数、三角函数等数值处理

- 日期时间函数
日期时间的格式化、计算、提取和转换操作

- 聚合函数
统计计算，如求和、平均值、计数、最值等

- 控制流函数
条件判断、空值处理、流程控制等逻辑操作

- 信息函数
获取系统信息、连接信息、版本信息等

### 准备测试环境
```sql
-- 创建测试数据库 CREATE DATABASE function_demo; USE function_demo; -- 创建员工表 CREATE TABLE employees ( id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50), last_name VARCHAR(50), email VARCHAR(100), phone VARCHAR(20), hire_date DATE, salary DECIMAL(10,2), department VARCHAR(50), birth_date DATE, is_active BOOLEAN DEFAULT TRUE ); -- 插入测试数据 INSERT INTO employees (first_name, last_name, email, phone, hire_date, salary, department, birth_date) VALUES ('张', '三', 'zhang.san@company.com', '13800138001', '2020-01-15', 8500.00, '技术部', '1990-05-20'), ('李', '四', 'li.si@company.com', '13800138002', '2019-03-22', 9200.00, '销售部', '1988-08-15'), ('王', '五', 'wang.wu@company.com', '13800138003', '2021-06-10', 7800.00, '技术部', '1992-12-03'), ('赵', '六', 'zhao.liu@company.com', '13800138004', '2018-09-05', 10500.00, '管理部', '1985-03-28'), ('钱', '七', 'qian.qi@company.com', '13800138005', '2022-02-14', 6500.00, '人事部', '1995-07-12'), ('孙', '八', 'sun.ba@company.com', '13800138006', '2020-11-30', 8800.00, '财务部', '1987-11-25'), ('周', '九', 'zhou.jiu@company.com', '13800138007', '2019-07-18', 9500.00, '技术部', '1991-04-08'), ('吴', '十', 'wu.shi@company.com', '13800138008', '2021-12-01', 7200.00, '销售部', '1993-09-17'); -- 创建产品表 CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, product_name VARCHAR(100), price DECIMAL(10,2), stock_quantity INT, category VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, description TEXT ); -- 插入产品数据 INSERT INTO products (product_name, price, stock_quantity, category, description) VALUES ('iPhone 15 Pro', 7999.00, 50, '手机', '苹果最新旗舰手机'), ('MacBook Pro 16"', 19999.00, 20, '电脑', '专业级笔记本电脑'), ('iPad Air', 4599.00, 30, '平板', '轻薄便携平板电脑'), ('AirPods Pro', 1899.00, 100, '耳机', '主动降噪无线耳机'), ('Apple Watch Series 9', 2999.00, 80, '手表', '智能运动手表'); SELECT 'Test data created successfully' AS message;
```
### 字符串函数
#### 基本字符串操作
```sql
-- 1. 字符串连接 -- CONCAT() - 连接多个字符串 SELECT first_name, last_name, CONCAT(first_name, ' ', last_name) AS full_name, CONCAT(first_name, '(', department, ')') AS name_with_dept FROM employees; -- CONCAT_WS() - 使用分隔符连接 SELECT CONCAT_WS(' - ', first_name, last_name, department) AS employee_info, CONCAT_WS('@', LOWER(first_name), 'company.com') AS generated_email FROM employees; -- 2. 字符串长度和截取 -- LENGTH() - 字节长度, CHAR_LENGTH() - 字符长度 SELECT product_name, LENGTH(product_name) AS byte_length, CHAR_LENGTH(product_name) AS char_length, LEFT(product_name, 10) AS left_10, RIGHT(product_name, 5) AS right_5, SUBSTRING(product_name, 1, 8) AS substr_8 FROM products; -- 3. 字符串查找和替换 -- LOCATE(), POSITION(), INSTR() - 查找子字符串位置 SELECT email, LOCATE('@', email) AS at_position, SUBSTRING(email, 1, LOCATE('@', email) - 1) AS username, SUBSTRING(email, LOCATE('@', email) + 1) AS domain, REPLACE(email, '@company.com', '@newcompany.com') AS new_email FROM employees; -- 4. 大小写转换 SELECT product_name, UPPER(product_name) AS uppercase, LOWER(product_name) AS lowercase, INITCAP(product_name) AS title_case -- MySQL 8.0+ FROM products; -- 5. 字符串修剪和填充 SELECT ' hello world ' AS original, TRIM(' hello world ') AS trimmed, LTRIM(' hello world ') AS left_trimmed, RTRIM(' hello world ') AS right_trimmed, LPAD('123', 8, '0') AS left_padded, RPAD('abc', 10, '*') AS right_padded;
```
#### 高级字符串处理
```sql
-- 1. 字符串反转和重复 SELECT first_name, REVERSE(first_name) AS reversed_name, REPEAT(first_name, 3) AS repeated_name, REPEAT('*', CHAR_LENGTH(first_name)) AS masked_name FROM employees; -- 2. 字符串比较 SELECT first_name, last_name, STRCMP(first_name, last_name) AS name_comparison, CASE WHEN STRCMP(first_name, last_name) = 0 THEN '相同' WHEN STRCMP(first_name, last_name) < 0 THEN '姓小于名' ELSE '姓大于名' END AS comparison_result FROM employees; -- 3. 字符串格式化 SELECT first_name, salary, FORMAT(salary, 2) AS formatted_salary, CONCAT('¥', FORMAT(salary, 2)) AS currency_format, INSERT(phone, 4, 4, '****') AS masked_phone -- 手机号脱敏 FROM employees; -- 4. 字符串编码和解码 SELECT product_name, HEX(product_name) AS hex_encoded, UNHEX(HEX(product_name)) AS hex_decoded, TO_BASE64(product_name) AS base64_encoded, FROM_BASE64(TO_BASE64(product_name)) AS base64_decoded FROM products LIMIT 3; -- 5. 正则表达式匹配 SELECT email, email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' AS is_valid_email, REGEXP_REPLACE(phone, '(\d{3})(\d{4})(\d{4})', '$1-$2-$3') AS formatted_phone FROM employees;
```
#### 常用字符串函数总结
|函数	|语法	|说明	|示例|
| --- | --- | --- | --- |
|CONCAT	|CONCAT(str1, str2, ...)	|连接字符串	|CONCAT('Hello', ' ', 'World')
|SUBSTRING	|SUBSTRING(str, pos, len)	|截取子字符串	|SUBSTRING('Hello', 2, 3) → 'ell'
|LENGTH	|LENGTH(str)	|字符串字节长度	|LENGTH('Hello') → 5
|UPPER/LOWER	|UPPER(str), LOWER(str)	|大小写转换	|UPPER('hello') → 'HELLO'
|TRIM	|TRIM(str)	|去除首尾空格	|TRIM(' hello ') → 'hello'
|REPLACE	|REPLACE(str, from, to)	|字符串替换|REPLACE('hello', 'l', 'x') → 'hexxo'
### 数值函数
#### 基本数学运算
```sql
-- 1. 基本数学函数 SELECT salary, ABS(salary - 8000) AS salary_diff, ROUND(salary / 12, 2) AS monthly_salary, CEIL(salary / 1000) AS salary_k_ceil, FLOOR(salary / 1000) AS salary_k_floor, TRUNCATE(salary / 12, 1) AS monthly_truncated FROM employees; -- 2. 幂运算和开方 SELECT stock_quantity, POWER(stock_quantity, 2) AS quantity_squared, SQRT(stock_quantity) AS quantity_sqrt, EXP(1) AS euler_number, LOG(stock_quantity) AS natural_log, LOG10(stock_quantity) AS log_base_10 FROM products WHERE stock_quantity > 0; -- 3. 三角函数 SELECT PI() AS pi_value, SIN(PI()/2) AS sin_90_degrees, COS(0) AS cos_0_degrees, TAN(PI()/4) AS tan_45_degrees, DEGREES(PI()) AS pi_in_degrees, RADIANS(180) AS degrees_180_in_radians; -- 4. 随机数和符号函数 SELECT RAND() AS random_0_to_1, RAND(123) AS seeded_random, FLOOR(RAND() * 100) + 1 AS random_1_to_100, SIGN(-15) AS negative_sign, SIGN(0) AS zero_sign, SIGN(25) AS positive_sign; -- 5. 取模和最值 SELECT id, salary, MOD(salary, 1000) AS salary_mod_1000, GREATEST(salary, 8000, 9000) AS max_value, LEAST(salary, 8000, 9000) AS min_value FROM employees;
```
#### 数值格式化和转换
```sql
-- 1. 数值格式化 SELECT salary, FORMAT(salary, 0) AS formatted_no_decimal, FORMAT(salary, 2) AS formatted_2_decimal, CONV(id, 10, 2) AS id_binary, CONV(id, 10, 16) AS id_hex, BIN(id) AS id_binary_func, HEX(id) AS id_hex_func FROM employees; -- 2. 数值统计函数在查询中的应用 SELECT department, COUNT(*) AS employee_count, AVG(salary) AS avg_salary, ROUND(AVG(salary), 2) AS avg_salary_rounded, STDDEV(salary) AS salary_stddev, VARIANCE(salary) AS salary_variance FROM employees GROUP BY department; -- 3. 累积计算 SELECT id, first_name, salary, @running_total := @running_total + salary AS running_total, @row_number := @row_number + 1 AS row_num FROM employees, (SELECT @running_total := 0, @row_number := 0) AS vars ORDER BY salary DESC;
```
#### 常用数值函数总结
|函数	|语法	|说明	|示例|
| --- | --- | --- | --- |
|ROUND	|ROUND(num, decimals)	|四舍五入	|ROUND(3.14159, 2) → 3.14
|CEIL/CEILING	|CEIL(num)	|向上取整	|CEIL(3.1) → 4
|FLOOR	|FLOOR(num)	|向下取整	|FLOOR(3.9) → 3
|ABS	|ABS(num)	|绝对值	|ABS(-5) → 5
|MOD	|MOD(num, divisor)	|取模运算	|MOD(10, 3) → 1
|SIN/COS/TAN	|SIN(angle), COS(angle), TAN(angle)	|三角函数	|SIN(PI()/2) → 1
|POWER	|POWER(base, exponent)	|幂运算	|POWER(2, 3) → 8
### 日期时间函数
#### 获取当前日期时间
```sql
-- 1. 当前日期时间函数 SELECT NOW() AS current_datetime, CURDATE() AS current_date, CURTIME() AS current_time, CURRENT_TIMESTAMP AS current_timestamp, UTC_TIMESTAMP() AS utc_timestamp, UNIX_TIMESTAMP() AS unix_timestamp, FROM_UNIXTIME(UNIX_TIMESTAMP()) AS from_unix; -- 2. 日期时间提取 SELECT hire_date, YEAR(hire_date) AS hire_year, MONTH(hire_date) AS hire_month, DAY(hire_date) AS hire_day, DAYNAME(hire_date) AS hire_day_name, MONTHNAME(hire_date) AS hire_month_name, QUARTER(hire_date) AS hire_quarter, WEEK(hire_date) AS hire_week, DAYOFYEAR(hire_date) AS hire_day_of_year, WEEKDAY(hire_date) AS hire_weekday FROM employees; -- 3. 日期时间格式化 SELECT hire_date, DATE_FORMAT(hire_date, '%Y-%m-%d') AS formatted_date, DATE_FORMAT(hire_date, '%Y年%m月%d日') AS chinese_date, DATE_FORMAT(hire_date, '%W, %M %d, %Y') AS english_date, TIME_FORMAT(NOW(), '%H:%i:%s') AS formatted_time, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS full_datetime FROM employees;
```
#### 日期时间计算
```sql
-- 1. 日期加减运算 SELECT hire_date, DATE_ADD(hire_date, INTERVAL 1 YEAR) AS one_year_later, DATE_SUB(hire_date, INTERVAL 6 MONTH) AS six_months_before, ADDDATE(hire_date, 30) AS thirty_days_later, SUBDATE(hire_date, 15) AS fifteen_days_before, hire_date + INTERVAL 1 WEEK AS one_week_later FROM employees; -- 2. 日期差值计算 SELECT first_name, hire_date, birth_date, DATEDIFF(CURDATE(), hire_date) AS days_since_hire, DATEDIFF(CURDATE(), birth_date) AS days_since_birth, TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age_years, TIMESTAMPDIFF(MONTH, hire_date, CURDATE()) AS months_employed, TIMESTAMPDIFF(DAY, hire_date, CURDATE()) AS days_employed FROM employees; -- 3. 工作日和周末计算 SELECT hire_date, DAYOFWEEK(hire_date) AS day_of_week_num, CASE DAYOFWEEK(hire_date) WHEN 1 THEN '周日' WHEN 2 THEN '周一' WHEN 3 THEN '周二' WHEN 4 THEN '周三' WHEN 5 THEN '周四' WHEN 6 THEN '周五' WHEN 7 THEN '周六' END AS day_of_week_chinese, CASE WHEN DAYOFWEEK(hire_date) IN (1, 7) THEN '周末' ELSE '工作日' END AS day_type FROM employees; -- 4. 月份和季度处理 SELECT hire_date, LAST_DAY(hire_date) AS last_day_of_month, DATE_FORMAT(hire_date, '%Y-%m-01') AS first_day_of_month, MAKEDATE(YEAR(hire_date), 1) AS first_day_of_year, STR_TO_DATE(CONCAT(YEAR(hire_date), '-12-31'), '%Y-%m-%d') AS last_day_of_year, CASE QUARTER(hire_date) WHEN 1 THEN CONCAT(YEAR(hire_date), '-01-01') WHEN 2 THEN CONCAT(YEAR(hire_date), '-04-01') WHEN 3 THEN CONCAT(YEAR(hire_date), '-07-01') WHEN 4 THEN CONCAT(YEAR(hire_date), '-10-01') END AS quarter_start FROM employees;
```
#### 日期时间转换
```sql
-- 1. 字符串与日期转换 SELECT '2021-01-15' AS date_string, STR_TO_DATE('2021-01-15', '%Y-%m-%d') AS parsed_date, STR_TO_DATE('15/01/2021', '%d/%m/%Y') AS parsed_date_dmy, STR_TO_DATE('2021-01-15 14:30:00', '%Y-%m-%d %H:%i:%s') AS parsed_datetime, DATE('2021-01-15 14:30:00') AS extract_date, TIME('2021-01-15 14:30:00') AS extract_time; -- 2. Unix 时间戳转换 SELECT UNIX_TIMESTAMP('2021-01-15 12:00:00') AS to_unix_timestamp, FROM_UNIXTIME(1705294800) AS from_unix_timestamp, FROM_UNIXTIME(1705294800, '%Y-%m-%d %H:%i:%s') AS formatted_from_unix; -- 3. 时区转换 SELECT NOW() AS local_time, UTC_TIMESTAMP() AS utc_time, CONVERT_TZ(NOW(), @@session.time_zone, '+00:00') AS converted_to_utc, CONVERT_TZ(NOW(), '+08:00', '+00:00') AS beijing_to_utc; -- 4. 实际应用示例 -- 计算员工年龄和工作年限 SELECT CONCAT(first_name, ' ', last_name) AS full_name, birth_date, hire_date, TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age, TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) AS years_of_service, CASE WHEN TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 5 THEN '资深员工' WHEN TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 2 THEN '经验员工' ELSE '新员工' END AS employee_level, DATE_ADD(hire_date, INTERVAL 5 YEAR) AS five_year_anniversary FROM employees ORDER BY years_of_service DESC;
```
#### 常用日期时间函数总结
|函数	|语法	|说明	|示例|
| --- | --- | --- | --- |
|NOW	|NOW()	|当前日期时间	|2021-01-15 14:30:00
|DATE_FORMAT|	DATE_FORMAT(date, format)	|日期格式化	|DATE_FORMAT(NOW(), '%Y-%m-%d')
|DATE_ADD	|DATE_ADD(date, INTERVAL expr unit)	|日期加法	|DATE_ADD(NOW(), INTERVAL 1 DAY)
|DATEDIFF	|DATEDIFF(date1, date2)	|日期差值（天数）	|DATEDIFF('2021-01-15', '2021-01-01')
|YEAR/MONTH/DAY	|YEAR(date), MONTH(date), DAY(date)	|提取年月日	|YEAR('2021-01-15') → 2021
|STR_TO_DATE	|STR_TO_DATE(str, format)	|字符串转日期	|STR_TO_DATE('2021-01-15', '%Y-%m-%d')
### 聚合函数
#### 基本聚合函数
```sql
-- 1. 基本统计函数 SELECT COUNT(*) AS total_employees, COUNT(DISTINCT department) AS unique_departments, SUM(salary) AS total_salary, AVG(salary) AS average_salary, MIN(salary) AS minimum_salary, MAX(salary) AS maximum_salary, MIN(hire_date) AS earliest_hire, MAX(hire_date) AS latest_hire FROM employees; -- 2. 按部门分组统计 SELECT department, COUNT(*) AS employee_count, ROUND(AVG(salary), 2) AS avg_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary, SUM(salary) AS total_salary, STDDEV(salary) AS salary_stddev, VARIANCE(salary) AS salary_variance FROM employees GROUP BY department ORDER BY avg_salary DESC; -- 3. 条件聚合 SELECT department, COUNT(*) AS total_count, COUNT(CASE WHEN salary > 8000 THEN 1 END) AS high_salary_count, COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 3 THEN 1 END) AS senior_count, ROUND(AVG(CASE WHEN salary > 8000 THEN salary END), 2) AS avg_high_salary, SUM(CASE WHEN salary > 8000 THEN salary ELSE 0 END) AS total_high_salary FROM employees GROUP BY department; -- 4. 产品统计 SELECT category, COUNT(*) AS product_count, ROUND(AVG(price), 2) AS avg_price, MIN(price) AS min_price, MAX(price) AS max_price, SUM(stock_quantity) AS total_stock, ROUND(AVG(stock_quantity), 0) AS avg_stock FROM products GROUP BY category ORDER BY avg_price DESC;
```
#### 高级聚合和窗口函数
```sql
-- 1. 窗口函数（MySQL 8.0+） SELECT first_name, last_name, department, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS salary_rank, RANK() OVER (ORDER BY salary DESC) AS salary_rank_with_ties, DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_dense_rank, PERCENT_RANK() OVER (ORDER BY salary) AS salary_percentile, NTILE(4) OVER (ORDER BY salary) AS salary_quartile FROM employees; -- 2. 部门内排名 SELECT first_name, last_name, department, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank, LAG(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS prev_salary, LEAD(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS next_salary, salary - LAG(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS salary_diff FROM employees; -- 3. 累积计算 SELECT first_name, department, salary, SUM(salary) OVER (ORDER BY hire_date) AS running_total, AVG(salary) OVER (ORDER BY hire_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3, COUNT(*) OVER (PARTITION BY department) AS dept_total_count, SUM(salary) OVER (PARTITION BY department) AS dept_total_salary FROM employees ORDER BY hire_date; -- 4. 分组集合函数（MySQL 8.0+） SELECT department, YEAR(hire_date) AS hire_year, COUNT(*) AS employee_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department, YEAR(hire_date) WITH ROLLUP;
```
#### 自定义聚合函数
```sql
-- 1. 使用 GROUP_CONCAT 创建聚合字符串 SELECT department, COUNT(*) AS employee_count, GROUP_CONCAT(CONCAT(first_name, ' ', last_name) ORDER BY salary DESC SEPARATOR ', ') AS employees, GROUP_CONCAT(DISTINCT YEAR(hire_date) ORDER BY YEAR(hire_date) SEPARATOR ', ') AS hire_years, GROUP_CONCAT(salary ORDER BY salary DESC SEPARATOR ' | ') AS salaries FROM employees GROUP BY department; -- 2. 计算中位数（模拟） SELECT department, COUNT(*) AS total_count, ROUND(AVG(salary), 2) AS mean_salary, ( SELECT ROUND(AVG(salary), 2) FROM ( SELECT salary FROM employees e2 WHERE e2.department = e1.department ORDER BY salary LIMIT 2 - (SELECT COUNT(*) FROM employees e3 WHERE e3.department = e1.department) % 2 OFFSET (SELECT (COUNT(*) - 1) DIV 2 FROM employees e3 WHERE e3.department = e1.department) ) AS median_calc ) AS median_salary FROM employees e1 GROUP BY department; -- 3. 自定义统计指标 SELECT department, COUNT(*) AS employee_count, ROUND(AVG(salary), 2) AS avg_salary, ROUND(STDDEV(salary), 2) AS salary_stddev, ROUND((MAX(salary) - MIN(salary)), 2) AS salary_range, ROUND(AVG(TIMESTAMPDIFF(YEAR, birth_date, CURDATE())), 1) AS avg_age, ROUND(AVG(TIMESTAMPDIFF(YEAR, hire_date, CURDATE())), 1) AS avg_tenure, COUNT(CASE WHEN salary > (SELECT AVG(salary) FROM employees) THEN 1 END) AS above_avg_count FROM employees GROUP BY department ORDER BY avg_salary DESC;
```
#### 常用聚合函数总结
| 函数	| 语法	| 说明	| 示例|
| --- | --- | --- | --- |
|COUNT	|COUNT(*), COUNT(column)	|计数	|COUNT(*) → 总行数
|SUM	|SUM(column)	|求和	|SUM(salary) → 工资总和
|AVG	|AVG(column)	|平均值	|AVG(salary) → 平均工资
|MIN/MAX	|MIN(column), MAX(column)	|最小值/最大值	|MIN(salary), MAX(salary)
|GROUP_CONCAT	|GROUP_CONCAT(column SEPARATOR sep)	|字符串聚合	|GROUP_CONCAT(name SEPARATOR ', ')
|STDDEV	|STDDEV(column)	|标准差	|STDDEV(salary) → 工资标准差
### 控制流函数
#### 条件判断函数
```sql
-- 1. IF 函数 SELECT first_name, salary, IF(salary > 8000, '高薪', '普通') AS salary_level, IF(TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 3, '资深', '新人') AS experience_level, IF(department = '技术部', salary * 1.1, salary) AS adjusted_salary FROM employees; -- 2. CASE 语句 SELECT first_name, last_name, salary, department, CASE WHEN salary >= 10000 THEN 'A级' WHEN salary >= 8000 THEN 'B级' WHEN salary >= 6000 THEN 'C级' ELSE 'D级' END AS salary_grade, CASE department WHEN '技术部' THEN '核心部门' WHEN '销售部' THEN '业务部门' WHEN '管理部' THEN '管理部门' ELSE '支持部门' END AS department_type FROM employees; -- 3. NULLIF 和 IFNULL SELECT product_name, price, stock_quantity, IFNULL(description, '暂无描述') AS product_description, NULLIF(stock_quantity, 0) AS non_zero_stock, COALESCE(description, product_name, '未知产品') AS display_name FROM products; -- 4. 复杂条件判断 SELECT first_name, birth_date, hire_date, salary, CASE WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 30 THEN '年轻员工' WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 30 AND 40 THEN '中年员工' ELSE '资深员工' END AS age_group, CASE WHEN salary > (SELECT AVG(salary) FROM employees) AND TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 2 THEN '优秀员工' WHEN salary > (SELECT AVG(salary) FROM employees) THEN '高薪新人' WHEN TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 3 THEN '忠诚员工' ELSE '普通员工' END AS employee_category FROM employees;
```
#### 空值处理函数
```sql
-- 1. 空值检测和处理 SELECT product_name, description, ISNULL(description) AS is_desc_null, description IS NULL AS is_null_check, description IS NOT NULL AS is_not_null_check, IFNULL(description, '暂无描述') AS desc_with_default, COALESCE(description, product_name, '未知') AS coalesced_value FROM products; -- 2. 空值替换和转换 SELECT first_name, email, phone, CASE WHEN email IS NULL THEN '邮箱未填写' WHEN email = '' THEN '邮箱为空' ELSE email END AS email_status, NULLIF(phone, '') AS clean_phone, -- 将空字符串转为 NULL IF(phone IS NULL OR phone = '', '未提供', phone) AS phone_display FROM employees; -- 3. 条件聚合中的空值处理 SELECT department, COUNT(*) AS total_employees, COUNT(email) AS employees_with_email, COUNT(*) - COUNT(email) AS employees_without_email, ROUND(COUNT(email) * 100.0 / COUNT(*), 2) AS email_completion_rate FROM employees GROUP BY department;
```
#### 常用控制流函数总结
| 函数	| 语法	| 说明	| 示例|
| --- | --- | --- | --- |
|IF	|IF(condition, true_value, false_value)	|条件判断	|IF(salary > 8000, '高薪', '普通')
|CASE	|CASE WHEN condition THEN value END	|多条件判断	|CASE WHEN salary > 8000 THEN '高薪' ELSE '普通' END
|IFNULL	|IFNULL(expr, default_value)	|空值替换	|IFNULL(description, '暂无描述')
|COALESCE	|COALESCE(expr1, expr2, ...)	|返回第一个非空值	|COALESCE(desc, name, '未知')
|NULLIF	|NULLIF(expr1, expr2)	|相等时返回NULL	|NULLIF(quantity, 0)
|ISNULL	|ISNULL(expr)	|检查是否为空	|ISNULL(description)
### 信息函数
```sql
-- 1. 系统信息函数 SELECT VERSION() AS mysql_version, USER() AS current_user, CURRENT_USER() AS current_user_host, DATABASE() AS current_database, CONNECTION_ID() AS connection_id, CHARSET('hello') AS default_charset, COLLATION('hello') AS default_collation; -- 2. 会话和连接信息 SELECT @@version AS version_variable, @@hostname AS hostname, @@port AS port, @@datadir AS data_directory, @@character_set_server AS server_charset, @@collation_server AS server_collation, @@time_zone AS time_zone; -- 3. 最后插入ID和影响行数 -- 这些函数通常在INSERT/UPDATE/DELETE后使用 SELECT LAST_INSERT_ID() AS last_insert_id, ROW_COUNT() AS affected_rows, FOUND_ROWS() AS found_rows; -- 需要在SELECT中使用SQL_CALC_FOUND_ROWS -- 4. 表和列信息 SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH, CREATE_TIME, UPDATE_TIME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'function_demo'; -- 5. 性能和状态信息 SELECT BENCHMARK(1000000, 1+1) AS benchmark_result; -- 性能测试 SHOW STATUS LIKE 'Connections'; SHOW STATUS LIKE 'Uptime'; SHOW STATUS LIKE 'Questions';
```
#### 常用信息函数总结
| 函数	| 说明	| 返回值示例|
| --- | --- | --- |
|VERSION()	|MySQL版本	|8.0.35
|USER()	|当前用户	|root@localhost
|DATABASE()	|当前数据库	|function_demo
|CONNECTION_ID()	|连接ID	|123
|LAST_INSERT_ID()	|最后插入的自增ID	|15
|ROW_COUNT()	|影响的行数	|3
### 实际应用示例
#### 数据清洗和格式化
```sql
-- 1. 员工数据清洗 SELECT id, TRIM(CONCAT(first_name, ' ', last_name)) AS full_name, LOWER(TRIM(email)) AS clean_email, REGEXP_REPLACE(phone, '[^0-9]', '') AS clean_phone, UPPER(TRIM(department)) AS clean_department, CASE WHEN salary < 0 THEN 0 WHEN salary > 50000 THEN 50000 ELSE salary END AS validated_salary FROM employees; -- 2. 产品数据标准化 SELECT id, TRIM(product_name) AS clean_name, ROUND(price, 2) AS formatted_price, GREATEST(0, stock_quantity) AS positive_stock, UPPER(TRIM(category)) AS standard_category, COALESCE(NULLIF(TRIM(description), ''), '暂无描述') AS clean_description, CONCAT('¥', FORMAT(price, 2)) AS display_price FROM products;
```
#### 报表和统计分析
```sql
-- 1. 员工统计报表 SELECT '总体统计' AS category, COUNT(*) AS employee_count, CONCAT('¥', FORMAT(AVG(salary), 2)) AS avg_salary, CONCAT('¥', FORMAT(MIN(salary), 2)) AS min_salary, CONCAT('¥', FORMAT(MAX(salary), 2)) AS max_salary, ROUND(AVG(TIMESTAMPDIFF(YEAR, birth_date, CURDATE())), 1) AS avg_age, ROUND(AVG(TIMESTAMPDIFF(YEAR, hire_date, CURDATE())), 1) AS avg_tenure FROM employees UNION ALL SELECT CONCAT(department, '部门') AS category, COUNT(*) AS employee_count, CONCAT('¥', FORMAT(AVG(salary), 2)) AS avg_salary, CONCAT('¥', FORMAT(MIN(salary), 2)) AS min_salary, CONCAT('¥', FORMAT(MAX(salary), 2)) AS max_salary, ROUND(AVG(TIMESTAMPDIFF(YEAR, birth_date, CURDATE())), 1) AS avg_age, ROUND(AVG(TIMESTAMPDIFF(YEAR, hire_date, CURDATE())), 1) AS avg_tenure FROM employees GROUP BY department ORDER BY category; -- 2. 月度入职统计 SELECT YEAR(hire_date) AS hire_year, MONTH(hire_date) AS hire_month, MONTHNAME(hire_date) AS month_name, COUNT(*) AS new_hires, GROUP_CONCAT(CONCAT(first_name, ' ', last_name) SEPARATOR ', ') AS new_employees, ROUND(AVG(salary), 2) AS avg_starting_salary FROM employees GROUP BY YEAR(hire_date), MONTH(hire_date) ORDER BY hire_year DESC, hire_month DESC; -- 3. 薪资分布分析 SELECT CASE WHEN salary < 7000 THEN '< 7K' WHEN salary < 8000 THEN '7K-8K' WHEN salary < 9000 THEN '8K-9K' WHEN salary < 10000 THEN '9K-10K' ELSE '> 10K' END AS salary_range, COUNT(*) AS employee_count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 2) AS percentage, GROUP_CONCAT(department ORDER BY department SEPARATOR ', ') AS departments FROM employees GROUP BY CASE WHEN salary < 7000 THEN '< 7K' WHEN salary < 8000 THEN '7K-8K' WHEN salary < 9000 THEN '8K-9K' WHEN salary < 10000 THEN '9K-10K' ELSE '> 10K' END ORDER BY MIN(salary);
```
#### 业务逻辑处理
```sql
-- 1. 员工绩效评估 SELECT CONCAT(first_name, ' ', last_name) AS employee_name, department, salary, TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) AS years_of_service, CASE WHEN salary >= 10000 AND TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 3 THEN 'A+' WHEN salary >= 9000 AND TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 2 THEN 'A' WHEN salary >= 8000 OR TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 3 THEN 'B+' WHEN salary >= 7000 OR TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) >= 1 THEN 'B' ELSE 'C' END AS performance_grade, CASE WHEN salary < (SELECT AVG(salary) FROM employees e2 WHERE e2.department = employees.department) * 0.8 THEN '需要关注' WHEN salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.department = employees.department) * 1.2 THEN '表现优秀' ELSE '表现正常' END AS salary_status, DATE_ADD(hire_date, INTERVAL 1 YEAR) AS first_review_date, DATE_ADD(hire_date, INTERVAL 5 YEAR) AS five_year_milestone FROM employees ORDER BY performance_grade, salary DESC; -- 2. 产品库存预警 SELECT product_name, category, stock_quantity, price, stock_quantity * price AS inventory_value, CASE WHEN stock_quantity = 0 THEN '缺货' WHEN stock_quantity <= 10 THEN '库存不足' WHEN stock_quantity <= 30 THEN '库存偏低' ELSE '库存充足' END AS stock_status, CASE WHEN stock_quantity <= 10 THEN '紧急补货' WHEN stock_quantity <= 30 THEN '计划补货' ELSE '无需补货' END AS restock_action, GREATEST(50 - stock_quantity, 0) AS suggested_restock_quantity FROM products ORDER BY stock_quantity ASC, inventory_value DESC;
```
### 函数性能优化
#### 性能优化建议
- 避免在WHERE子句中使用函数：会导致索引失效
- 合理使用聚合函数：配合适当的索引提高查询效率
- 字符串函数优化：大量数据时考虑在应用层处理
- 日期函数缓存：重复计算的日期可以预先计算存储
#### 常见陷阱
- NULL值处理：函数遇到NULL通常返回NULL
- 数据类型转换：隐式转换可能影响性能
- 字符集问题：字符串函数受字符集影响
- 时区问题：日期时间函数要注意时区设置
```sql
-- 性能对比示例 -- 不推荐：在WHERE中使用函数 SELECT * FROM employees WHERE YEAR(hire_date) = 2020; -- 推荐：使用范围查询 SELECT * FROM employees WHERE hire_date >= '2020-01-01' AND hire_date < '2021-01-01'; -- 不推荐：重复计算 SELECT first_name, TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age, CASE WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= 30 THEN '成熟' ELSE '年轻' END FROM employees; -- 推荐：使用变量或子查询 SELECT first_name, age, CASE WHEN age >= 30 THEN '成熟' ELSE '年轻' END AS age_group FROM ( SELECT first_name, TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age FROM employees ) AS emp_with_age;
```
### 总结
> MySQL函数是数据处理的强大工具，合理使用可以大大简化查询逻辑，提高开发效率。掌握各类函数的特点和使用场景，是成为MySQL专家的必经之路。

#### 学习建议
- 分类学习：按功能分类逐步掌握各类函数
- 实践应用：在实际项目中多使用函数解决问题
- 性能意识：时刻关注函数对查询性能的影响
- 版本差异：了解不同MySQL版本的函数差异
- 组合使用：学会组合多个函数解决复杂问题
#### 扩展学习
- 自定义函数：学习创建用户定义函数(UDF)
- 存储过程：在存储过程中使用函数
- 触发器：在触发器中应用函数
- 视图：在视图定义中使用函数
## MySQL 运算符
### 运算符概述
> MySQL 运算符用于在查询中执行各种计算和比较操作。理解运算符的优先级和使用方法对编写高效的SQL查询至关重要。

- 算术运算符
执行基本的数学运算：加、减、乘、除、取模

- 比较运算符
比较两个值的大小关系：等于、大于、小于等

- 逻辑运算符
组合多个条件：AND、OR、NOT等逻辑操作

- 位运算符
对二进制位进行操作：位与、位或、位异或等

- 赋值运算符
为变量或列赋值：等号赋值和复合赋值

- 特殊运算符
特殊用途运算符：LIKE、IN、BETWEEN等

### 准备测试环境
```sql
-- 创建测试数据库 CREATE DATABASE operator_demo; USE operator_demo; -- 创建测试表 CREATE TABLE test_data ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50), age INT, salary DECIMAL(10,2), department VARCHAR(50), is_active BOOLEAN, join_date DATE, score FLOAT, status_code INT ); -- 插入测试数据 INSERT INTO test_data (name, age, salary, department, is_active, join_date, score, status_code) VALUES ('张三', 25, 8500.00, '技术部', TRUE, '2022-01-15', 85.5, 1), ('李四', 30, 9200.00, '销售部', TRUE, '2021-03-22', 92.0, 2), ('王五', 28, 7800.00, '技术部', FALSE, '2023-06-10', 78.5, 1), ('赵六', 35, 12000.00, '管理部', TRUE, '2020-09-05', 95.0, 4), ('钱七', 22, 6500.00, '人事部', TRUE, '2023-02-14', 88.0, 2), ('孙八', 32, 10500.00, '财务部', TRUE, '2019-11-30', 90.5, 3), ('周九', 27, 8800.00, '技术部', TRUE, '2022-07-18', 82.0, 1), ('吴十', 29, 7200.00, '销售部', FALSE, '2023-12-01', 75.5, 2); -- 创建数值测试表 CREATE TABLE numbers ( id INT AUTO_INCREMENT PRIMARY KEY, value1 INT, value2 INT, decimal_val DECIMAL(5,2), binary_val INT ); -- 插入数值数据 INSERT INTO numbers (value1, value2, decimal_val, binary_val) VALUES (10, 3, 15.75, 12), -- 1100 in binary (20, 4, 25.50, 10), -- 1010 in binary (15, 5, 30.25, 6), -- 0110 in binary (8, 2, 12.80, 9), -- 1001 in binary (25, 7, 45.00, 15); -- 1111 in binary SELECT 'Test data created successfully' AS message;
```
### 算术运算符
#### 基本算术运算
```sql
-- 1. 基本算术运算符 SELECT value1, value2, value1 + value2 AS addition, -- 加法 value1 - value2 AS subtraction, -- 减法 value1 * value2 AS multiplication, -- 乘法 value1 / value2 AS division, -- 除法 value1 % value2 AS modulo, -- 取模 value1 DIV value2 AS integer_division -- 整数除法 FROM numbers; -- 2. 在实际查询中使用算术运算 SELECT name, salary, salary * 12 AS annual_salary, salary * 0.1 AS tax_deduction, salary - (salary * 0.1) AS net_salary, salary + 1000 AS salary_with_bonus, ROUND(salary / 30, 2) AS daily_salary FROM test_data; -- 3. 复杂算术表达式 SELECT name, age, salary, score, (salary * 0.3 + score * 100) AS performance_index, POWER(score / 10, 2) AS score_squared, SQRT(salary / 1000) AS salary_sqrt, ABS(score - 85) AS score_deviation FROM test_data; -- 4. 处理NULL值的算术运算 SELECT 10 + NULL AS add_null, 10 - NULL AS subtract_null, 10 * NULL AS multiply_null, 10 / NULL AS divide_null, IFNULL(10 + NULL, 0) AS handle_null_addition ;
```
#### 算术运算的实际应用
```sql
-- 1. 薪资计算 SELECT name, salary, CASE WHEN department = '技术部' THEN salary * 1.15 -- 技术部加薪15% WHEN department = '销售部' THEN salary * 1.10 -- 销售部加薪10% ELSE salary * 1.05 -- 其他部门加薪5% END AS adjusted_salary, CASE WHEN department = '技术部' THEN (salary * 1.15) - salary WHEN department = '销售部' THEN (salary * 1.10) - salary ELSE (salary * 1.05) - salary END AS salary_increase FROM test_data; -- 2. 年龄和工作年限计算 SELECT name, age, join_date, YEAR(CURDATE()) - YEAR(join_date) AS years_of_service, 65 - age AS years_to_retirement, DATEDIFF(CURDATE(), join_date) / 365.25 AS precise_years_service, age + (YEAR(CURDATE()) - YEAR(join_date)) AS age_when_started FROM test_data; -- 3. 绩效评分计算 SELECT name, score, salary, age, (score * 0.4 + (salary / 100) * 0.3 + (40 - age) * 0.3) AS composite_score, CASE WHEN score >= 90 THEN score + 5 -- 优秀加分 WHEN score >= 80 THEN score + 2 -- 良好加分 WHEN score < 70 THEN score - 3 -- 不及格扣分 ELSE score END AS adjusted_score FROM test_data;
```
#### 算术运算符总结
| 运算符 | 名称 | 示例 | 结果 | 说明 |
| --- | --- | --- | --- | --- |
| + | 加法 | 10 + 3 | 13 | 两个数相加 |
| - | 减法 | 10 - 3 | 7 | 两个数相减 |
| * | 乘法 | 10 * 3 | 30 | 两个数相乘 |
| / | 除法 | 10 / 3 | 3.3333 | 浮点数除法 |
| DIV | 整数除法 | 10 DIV 3 | 3 | 返回整数部分 |
| % 或 MOD | 取模 | 10 % 3 | 1 | 返回余数 |
### 比较运算符
#### 基本比较运算
```sql
-- 1. 基本比较运算符 SELECT name, age, salary, age = 30 AS is_thirty, -- 等于 age != 30 AS not_thirty, -- 不等于 age <> 30 AS not_equal_thirty, -- 不等于（另一种写法） age > 30 AS older_than_thirty, -- 大于 age < 30 AS younger_than_thirty, -- 小于 age >= 30 AS thirty_or_older, -- 大于等于 age <= 30 AS thirty_or_younger, -- 小于等于 salary <=> NULL AS safe_equal_null -- 安全等于（NULL安全） FROM test_data; -- 2. 字符串比较 SELECT name, department, name = '张三' AS is_zhangsan, department != '技术部' AS not_tech_dept, name > '王' AS name_after_wang, department LIKE '%部' AS ends_with_bu, name REGEXP '^[张李王]' AS surname_zhang_li_wang FROM test_data; -- 3. 日期比较 SELECT name, join_date, join_date = '2022-01-15' AS joined_specific_date, join_date > '2022-01-01' AS joined_after_2022, join_date BETWEEN '2022-01-01' AND '2022-12-31' AS joined_in_2022, YEAR(join_date) = 2023 AS joined_in_2023 FROM test_data; -- 4. NULL值比较 SELECT name, department, department IS NULL AS dept_is_null, department IS NOT NULL AS dept_not_null, department <=> NULL AS safe_equal_null, ISNULL(department) AS isnull_check FROM test_data;
```
#### 高级比较操作
```sql
-- 1. BETWEEN 范围比较 SELECT name, age, salary, score, age BETWEEN 25 AND 30 AS age_in_range, salary BETWEEN 8000 AND 10000 AS salary_in_range, score NOT BETWEEN 80 AND 90 AS score_out_range, join_date BETWEEN '2022-01-01' AND '2022-12-31' AS joined_2022 FROM test_data; -- 2. IN 集合比较 SELECT name, department, age, status_code, department IN ('技术部', '销售部') AS is_core_dept, age IN (25, 30, 35) AS specific_ages, status_code NOT IN (1, 2) AS special_status, name IN ('张三', '李四', '王五') AS is_top_three FROM test_data; -- 3. LIKE 模式匹配 SELECT name, department, name LIKE '张%' AS starts_with_zhang, name LIKE '%三' AS ends_with_san, name LIKE '_四' AS second_char_si, department LIKE '%技术%' AS contains_tech, name NOT LIKE '%五%' AS not_contains_wu FROM test_data; -- 4. 正则表达式比较 SELECT name, department, name REGEXP '^[张李王]' AS common_surname, name REGEXP '[三四五]$' AS number_ending, department REGEXP '技术|销售' AS tech_or_sales, name NOT REGEXP '[六七八九十]' AS not_high_numbers FROM test_data;
```
#### 比较运算符总结
| 运算符 | 名称 | 示例 | 说明 |
| --- | --- | --- | --- |
| = | 等于 | age = 30 | 值相等返回TRUE |
| != 或 <> | 不等于 | age != 30 | 值不相等返回TRUE |
| > | 大于 | age > 30 | 左值大于右值 |
| < | 小于 | age < 30 | 左值小于右值 |
| >= | 大于等于 | age >= 30 | 左值大于或等于右值 |
| <= | 小于等于 | age <= 30 | 左值小于或等于右值 |
| <=> | 安全等于 | value <=> NULL | NULL安全的等于比较 |
| IS NULL | 为空 | value IS NULL | 检查是否为NULL |
| IS NOT NULL | 非空 | value IS NOT NULL | 检查是否不为NULL |
| BETWEEN | 范围内 | age BETWEEN 20 AND 30 | 值在指定范围内 |
| IN | 在集合中 | dept IN ('技术部', '销售部') | 值在指定集合中 |
| LIKE | 模式匹配 | name LIKE '张%' | 字符串模式匹配 |
| REGEXP | 正则表达式 | name REGEXP '^[张李王]' | 字符串正则匹配 |
### 逻辑运算符
#### 基本逻辑运算
```sql
-- 1. AND 逻辑与 SELECT name, age, salary, department, (age > 25 AND salary > 8000) AS senior_high_paid, (department = '技术部' AND is_active = TRUE) AS active_tech, (age BETWEEN 25 AND 35 AND score > 80) AS prime_performer FROM test_data; -- 2. OR 逻辑或 SELECT name, age, salary, department, (age < 25 OR salary > 10000) AS young_or_high_paid, (department = '技术部' OR department = '销售部') AS core_departments, (score > 90 OR salary > 11000) AS top_performer FROM test_data; -- 3. NOT 逻辑非 SELECT name, age, department, is_active, NOT (age > 30) AS not_over_thirty, NOT (department = '技术部') AS not_tech_dept, NOT is_active AS inactive, !(score < 80) AS not_low_score FROM test_data; -- 4. 复杂逻辑组合 SELECT name, age, salary, department, score, ( (age BETWEEN 25 AND 35) AND (salary > 8000) AND (department IN ('技术部', '销售部')) AND (score >= 80) ) AS ideal_candidate, ( (age < 30 AND score > 85) OR (age >= 30 AND salary > 10000) ) AS promotion_candidate FROM test_data;
```
#### 逻辑运算的实际应用
```sql
-- 1. 员工分类 SELECT name, age, salary, department, score, CASE WHEN (age < 30 AND score > 85 AND salary > 8000) THEN '潜力股' WHEN (age >= 30 AND salary > 10000 AND score > 80) THEN '骨干员工' WHEN (department = '技术部' AND score > 80) THEN '技术专家' WHEN (is_active = FALSE) THEN '待激活' ELSE '普通员工' END AS employee_category, ( (score > 85) AND (salary > (SELECT AVG(salary) FROM test_data)) AND (YEAR(CURDATE()) - YEAR(join_date) >= 1) ) AS eligible_for_bonus FROM test_data; -- 2. 薪资调整逻辑 SELECT name, salary, department, score, age, CASE WHEN (score >= 90 AND salary < 10000) THEN salary * 1.20 -- 高分低薪大幅调整 WHEN (score >= 85 OR age >= 35) THEN salary * 1.15 -- 高分或资深适度调整 WHEN (department = '技术部' AND score >= 80) THEN salary * 1.10 -- 技术部门小幅调整 WHEN (is_active = TRUE AND score >= 75) THEN salary * 1.05 -- 在职及格小幅调整 ELSE salary -- 无调整 END AS adjusted_salary, ( (score < 70) OR (is_active = FALSE AND YEAR(CURDATE()) - YEAR(join_date) < 1) ) AS needs_attention FROM test_data; -- 3. 查询条件组合 -- 查找符合特定条件的员工 SELECT name, age, salary, department, score FROM test_data WHERE ( -- 条件组1：年轻高潜力 (age <= 28 AND score >= 85) OR -- 条件组2：资深高薪 (age >= 32 AND salary >= 10000) OR -- 条件组3：技术部门优秀员工 (department = '技术部' AND score >= 80 AND is_active = TRUE) ) AND ( -- 排除条件：不要低分员工 score >= 75 );
```
#### 逻辑运算符总结
| 运算符 | 名称 | 说明 | 示例 | 结果 |
| --- | --- | --- | --- | --- |
| AND 或 && | 逻辑与 | 两个条件都为真时返回真 | TRUE AND FALSE | FALSE |
| OR 或｜｜  | 逻辑或 | 任一条件为真时返回真 | TRUE OR FALSE | TRUE |
| NOT 或 ! | 逻辑非 | 条件取反 | NOT TRUE | FALSE |
| XOR | 逻辑异或 | 两个条件不同时返回真 | TRUE XOR FALSE | TRUE |
### 位运算符
#### 基本位运算
```sql
-- 1. 基本位运算符 SELECT binary_val, BIN(binary_val) AS binary_representation, binary_val & 8 AS bitwise_and, -- 位与 binary_val | 8 AS bitwise_or, -- 位或 binary_val ^ 8 AS bitwise_xor, -- 位异或 ~binary_val AS bitwise_not, -- 位非 binary_val << 1 AS left_shift, -- 左移 binary_val >> 1 AS right_shift -- 右移 FROM numbers; -- 2. 位运算的实际应用 -- 权限系统示例（使用位掩码） SELECT name, status_code, BIN(status_code) AS status_binary, status_code & 1 AS has_read_permission, -- 检查读权限（第1位） status_code & 2 AS has_write_permission, -- 检查写权限（第2位） status_code & 4 AS has_execute_permission, -- 检查执行权限（第3位） status_code | 1 AS add_read_permission, -- 添加读权限 status_code | 2 AS add_write_permission, -- 添加写权限 status_code & ~1 AS remove_read_permission -- 移除读权限 FROM test_data; -- 3. 状态标志位操作 SELECT id, status_code, BIN(status_code) AS current_status, CASE WHEN status_code & 1 = 1 THEN '活跃' ELSE '非活跃' END AS activity_status, CASE WHEN status_code & 2 = 2 THEN '已验证' ELSE '未验证' END AS verification_status, CASE WHEN status_code & 4 = 4 THEN '管理员' ELSE '普通用户' END AS user_type FROM test_data; -- 4. 位运算在数据压缩中的应用 SELECT value1, value2, (value1 << 8) | value2 AS packed_values, -- 将两个8位值打包成16位 ((value1 << 8) | value2) >> 8 AS unpacked_high, -- 解包高8位 ((value1 << 8) | value2) & 255 AS unpacked_low -- 解包低8位 FROM numbers WHERE value1 < 256 AND value2 < 256; -- 确保是8位值
```
#### 位运算符总结
| 运算符 | 名称 | 说明 | 示例 | 结果 |
| --- | --- | --- | --- | --- |
| & | 位与 | 对应位都为1时结果为1 | 12 & 10 (1100 & 1010) | 8 (1000) |
| \| | 位或 | 对应位有一个为1时结果为1 | 12 \| 10 (1100 \| 1010) | 14 (1110) |
| ^ | 位异或 | 对应位不同时结果为1 | 12 ^ 10 (1100 ^ 1010) | 6 (0110) |
| ~ | 位非 | 按位取反 | ~12 | -13 |
| << | 左移 | 向左移动指定位数 | 12 << 1 | 24 |
| >> | 右移 | 向右移动指定位数 | 12 >> 1 | 6 |
### 赋值运算符
```sql
-- 1. 基本赋值运算符 -- 在变量中使用赋值运算符 SET @var1 = 10; SET @var2 := 20; -- := 也是赋值运算符 SELECT @var1 AS variable1, @var2 AS variable2, @var3 := @var1 + @var2 AS sum_result, @var4 := @var1 * 2 AS double_var1; -- 2. 在查询中使用赋值 SELECT name, salary, @running_total := @running_total + salary AS running_total, @max_salary := GREATEST(@max_salary, salary) AS max_so_far, @row_num := @row_num + 1 AS row_number FROM test_data, (SELECT @running_total := 0, @max_salary := 0, @row_num := 0) AS init ORDER BY salary; -- 3. UPDATE 语句中的赋值运算符 -- 创建临时表进行演示 CREATE TEMPORARY TABLE temp_salary AS SELECT * FROM test_data; -- 使用复合赋值运算符（MySQL 8.0+） UPDATE temp_salary SET salary = salary * 1.1 WHERE department = '技术部'; UPDATE temp_salary SET score = score + 5 WHERE score >= 85; SELECT name, salary, score FROM temp_salary; -- 4. 条件赋值 SELECT name, age, salary, @bonus := CASE WHEN age < 30 AND salary > 8000 THEN salary * 0.15 WHEN age >= 30 AND salary > 10000 THEN salary * 0.20 ELSE salary * 0.10 END AS calculated_bonus, @total_compensation := salary + @bonus AS total_compensation FROM test_data;
```
#### 赋值运算符总结
| 运算符 | 名称 | 说明 | 示例 |
| --- | --- | --- | --- |
| = | 赋值 | 将右边的值赋给左边的变量 | SET @var = 10 |
| := | 赋值 | 赋值运算符，可在表达式中使用 | @var := 10 |
### 运算符优先级
|优先级 |运算符 |结合性 |说明 |
| --- | --- | --- | --- |
|1 (最高) |INTERVAL    |左结合 |时间间隔 
|2 |BINARY, COLLATE |左结合 |二进制转换，排序规则 
|3 |! |右结合 |逻辑非 
|4 |- (一元), ~ (位非) |右结合 |一元减号，位非 
|5 |^ |左结合 |异或 
|6 |*, /, DIV, %, MOD| 左结合| 乘法，除法，取模 
|7 |-, + |左结合 |减法，加法 
|8 |<<, >> |左结合 |位移 
|9 |& |左结合 |位与 
|10 | \| |左结合 |位或 
|11 | =, >=, >, <=, <, <>, !=, IS, LIKE, REGEXP, IN |左结合 |比较运算符 
|12 | BETWEEN, CASE, WHEN, THEN, ELSE |左结合 |范围，条件 
|13 | NOT |右结合 |逻辑非 
|14 | AND, && |左结合 |逻辑与 
|15 | XOR |左结合 |逻辑异或 
|16 | OR, \|\| |左结合 |逻辑或 
|17 | (最低) =, := |右结合 |赋值 


```sql
-- 运算符优先级示例 SELECT -- 算术运算优先级 2 + 3 * 4 AS arithmetic1, -- 结果：14 (不是20) (2 + 3) * 4 AS arithmetic2, -- 结果：20 -- 比较和逻辑运算优先级 1 = 1 AND 2 = 3 OR 4 = 4 AS logic1, -- 结果：1 (TRUE) 1 = 1 AND (2 = 3 OR 4 = 4) AS logic2, -- 结果：1 (TRUE) (1 = 1 AND 2 = 3) OR 4 = 4 AS logic3, -- 结果：1 (TRUE) -- 位运算优先级 12 | 3 & 5 AS bitwise1, -- 结果：13 (12 | 3) & 5 AS bitwise2, -- 结果：5 12 | (3 & 5) AS bitwise3; -- 结果：13 -- 复杂表达式的优先级 SELECT name, age, salary, -- 不使用括号（依赖优先级） age > 25 AND salary > 8000 OR department = '管理部' AS condition1, -- 使用括号明确优先级 (age > 25 AND salary > 8000) OR department = '管理部' AS condition2, age > 25 AND (salary > 8000 OR department = '管理部') AS condition3 FROM test_data;
```
### 实际应用案例
#### 复杂查询条件
```sql
-- 1. 员工筛选的复杂条件 SELECT name, age, salary, department, score, join_date FROM test_data WHERE ( -- 高潜力年轻员工 (age <= 28 AND score >= 85 AND salary >= 7000) OR -- 资深高薪员工 (age >= 32 AND salary >= 10000) OR -- 核心部门优秀员工 (department IN ('技术部', '销售部') AND score >= 80 AND is_active = TRUE) ) AND ( -- 排除试用期员工（入职不满3个月） DATEDIFF(CURDATE(), join_date) >= 90 ) AND ( -- 排除低分员工 score >= 75 ) ORDER BY CASE WHEN department = '技术部' THEN 1 WHEN department = '销售部' THEN 2 ELSE 3 END, score DESC, salary DESC; -- 2. 薪资调整计算 SELECT name, current_salary, department, performance_score, years_service, new_salary, salary_increase, increase_percentage FROM ( SELECT name, salary AS current_salary, department, score AS performance_score, TIMESTAMPDIFF(YEAR, join_date, CURDATE()) AS years_service, CASE -- 顶级表现者：20%增长 WHEN score >= 95 AND salary < 15000 THEN salary * 1.20 -- 优秀表现者：15%增长 WHEN score >= 90 AND salary < 12000 THEN salary * 1.15 -- 良好表现者：10%增长 WHEN score >= 85 OR (department = '技术部' AND score >= 80) THEN salary * 1.10 -- 合格表现者：5%增长 WHEN score >= 75 AND is_active = TRUE THEN salary * 1.05 -- 其他情况：无增长 ELSE salary END AS new_salary FROM test_data ) AS salary_calc CROSS JOIN ( SELECT new_salary - current_salary AS salary_increase, ROUND((new_salary - current_salary) / current_salary * 100, 2) AS increase_percentage ) AS calc WHERE new_salary > current_salary ORDER BY increase_percentage DESC;
```
#### 数据分析和统计
```sql
-- 1. 员工分布分析 SELECT department, COUNT(*) AS total_employees, SUM(CASE WHEN age < 30 THEN 1 ELSE 0 END) AS young_employees, SUM(CASE WHEN age BETWEEN 30 AND 40 THEN 1 ELSE 0 END) AS middle_age_employees, SUM(CASE WHEN age > 40 THEN 1 ELSE 0 END) AS senior_employees, ROUND(AVG(salary), 2) AS avg_salary, ROUND(AVG(score), 2) AS avg_score, SUM(CASE WHEN score >= 85 THEN 1 ELSE 0 END) AS high_performers, ROUND( SUM(CASE WHEN score >= 85 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2 ) AS high_performer_percentage FROM test_data GROUP BY department HAVING COUNT(*) > 1 -- 只显示有多个员工的部门 ORDER BY avg_score DESC, avg_salary DESC; -- 2. 绩效等级分布 SELECT performance_grade, COUNT(*) AS employee_count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_data), 2) AS percentage, ROUND(AVG(salary), 2) AS avg_salary, ROUND(AVG(age), 1) AS avg_age, GROUP_CONCAT(name ORDER BY score DESC SEPARATOR ', ') AS employees FROM ( SELECT name, age, salary, score, CASE WHEN score >= 95 THEN 'A+' WHEN score >= 90 THEN 'A' WHEN score >= 85 THEN 'B+' WHEN score >= 80 THEN 'B' WHEN score >= 75 THEN 'C+' WHEN score >= 70 THEN 'C' ELSE 'D' END AS performance_grade FROM test_data ) AS graded_employees GROUP BY performance_grade ORDER BY CASE performance_grade WHEN 'A+' THEN 1 WHEN 'A' THEN 2 WHEN 'B+' THEN 3 WHEN 'B' THEN 4 WHEN 'C+' THEN 5 WHEN 'C' THEN 6 ELSE 7 END;
```
### 最佳实践和注意事项
#### 运算符使用建议
- 明确优先级：复杂表达式使用括号明确运算顺序
- NULL值处理：注意NULL值在运算中的特殊行为
- 类型转换：避免隐式类型转换导致的性能问题
- 索引友好：WHERE子句中避免对列进行函数运算
- 可读性优先：复杂逻辑拆分为多个简单条件
#### 常见陷阱
- NULL比较：使用IS NULL而不是= NULL
- 字符串比较：注意字符集和排序规则的影响
- 浮点数比较：避免直接比较浮点数是否相等
- 除零错误：除法运算前检查除数是否为零
- 位运算范围：注意整数溢出和符号位的影响
#### 性能优化技巧
- 短路求值：利用AND和OR的短路特性优化条件顺序
- 索引利用：将能使用索引的条件放在WHERE子句前面
- 常量折叠：MySQL会自动优化常量表达式
- 谓词下推：复杂查询中合理使用子查询和连接
```sql
-- 性能优化示例 -- 1. 利用短路求值优化条件顺序 SELECT name, age, salary, department FROM test_data WHERE is_active = TRUE -- 先检查简单条件 AND department = '技术部' -- 再检查索引条件 AND salary > 8000 -- 最后检查范围条件 AND score >= (SELECT AVG(score) FROM test_data); -- 最后执行子查询 -- 2. 避免在WHERE子句中对列进行运算 -- 不好的写法 SELECT name FROM test_data WHERE YEAR(join_date) = 2022; -- 好的写法 SELECT name FROM test_data WHERE join_date >= '2022-01-01' AND join_date < '2023-01-01'; -- 3. 合理使用CASE表达式 SELECT name, salary, CASE WHEN salary >= 10000 THEN '高薪' WHEN salary >= 8000 THEN '中等' ELSE '一般' END AS salary_level FROM test_data;
```
### 总结
> MySQL运算符是构建查询条件和表达式的基础工具。掌握各种运算符的使用方法和优先级规则，能够帮助我们编写更高效、更准确的SQL查询。

#### 学习要点回顾
- 算术运算符：用于数值计算，注意除零和NULL值处理
- 比较运算符：用于条件判断，掌握各种比较方式
- 逻辑运算符：用于组合条件，理解短路求值机制
- 位运算符：用于位级操作，适用于权限和状态管理
- 运算符优先级：理解优先级规则，合理使用括号
- 性能考虑：编写索引友好的查询条件
#### 进阶学习建议
- 深入学习**MySQL的查询优化器工作原理**
- 掌握**EXPLAIN**的使用，分析查询执行计划
- 学习窗口函数和CTE（公共表表达式）
- 了解MySQL 8.0的新特性和改进
- 实践复杂的数据分析和报表查询
