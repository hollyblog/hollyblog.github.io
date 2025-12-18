---
title: "MySQL 基础 - 入门"
date: 2021-02-07T11:00:00+08:00
draft: false
description: "MySQL 基础：mysql基础操作。"
tags: ["MySQL", "数据库基础"]
categories: ["Database"]
---
MySQL 基础：mysql基础操作。

MySQL 是世界上最流行的开源关系型数据库管理系统（RDBMS），由瑞典 MySQL AB 公司开发，现在属于 Oracle 公司。MySQL 以其高性能、可靠性和易用性而闻名，被广泛应用于 Web 应用程序开发中。
## MySQL 介绍
### MySQL 主要特性
- mysql社区版完全免费
- 跨平台
- 高性能：优化的sql查询引擎，支持大数据量处理。
- 可扩展性：支持集群、复制和分区
- 安全性：提供多层安全保护机制
- 标准兼容：遵循sql标准，易学。
### MySQL 版本对比
| 特性 | MySQL 5.7 | MySQL 8.x |
| --- | --- | --- |
| 默认字符集 | latin1 | utf8mb4 |
| JSON 支持 | 基础 JSON 类型 | 增强的 JSON 函数 |
| 窗口函数 | 不支持 | 完全支持 |
| CTE（公用表表达式） | 不支持 | 支持递归 CTE |
| 角色管理 | 不支持 | 支持角色管理 |

#### MySQL 8.x 新特性
- 数据字典：统一的事务性数据字典
- 原子 DDL：DDL 语句的原子性执行
- 升级过程：就地升级，无需导出/导入
- 安全性增强：默认身份验证、角色管理
- 性能提升：查询优化器改进、索引优化
- NoSQL 支持：文档存储和 X DevAPI

> MySQL 5.7 注意事项--生命周期：MySQL 5.7 已于 2023 年 10 月结束扩展支持。

### MySQL 应用场景
- Web 应用：LAMP/LEMP 技术栈的核心组件
- 电子商务：在线商店、支付系统
- 内容管理：CMS 系统、博客平台
- 数据仓库：数据分析和报告系统
- 日志系统：应用程序日志存储和分析
- 游戏开发：玩家数据、游戏状态存储

```java
// 示例：创建第一个数据库 
CREATE DATABASE my_first_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
// 使用数据库 
USE my_first_db; 
// 创建示例表 
CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
```
## MySQL 安装
### Ubuntu20.04
1. 添加 MySQL 官方源 
```bash
sudo apt update
sudo apt install mysql-server
```
2. 启动 MySQL 服务 
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```
3. 配置 MySQL 服务 
```bash
sudo mysql_secure_installation
```
### 配置文件位置
```bash
/etc/mysql/mysql.conf.d/mysqld.cnf
```

### 基本配置优化
```bash
[mysqld]
# 基本设置
port = 3306
bind-address = 0127.0.0.1
# 字符集设置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
# 内存设置
innodb_buffer_pool_size = 1G
key_buffer_size = 256M
# 连接设置
max_connections = 200
max_connect_errors = 10
# 日志设置
log-error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
# mysql8特定设置
default_authentication_plugin = mysql_native_password
```
### 忘记root密码
```bash
# 停止mysql服务
sudo systemctl stop mysql
# 跳过权限验证启动
sudo mysql_safe --skip-grant-tables
# 连接并重置密码
mysql -u root USE mysql;
UPDATE user SET authentication_string = PASSWORD('<PASSWORD>') WHERE user = 'root';
FLUSH PRIVILEGES;
EXIT;
# 重新启动mysql服务
sudo systemctl restart mysql
```
### 检查3306端口
```bash
sudo systemctl status mysql
# 检查端口监听
sudo netstat -tuln | grep :3306
# 检查防火墙设置
sudo ufw status
sudo ufw allow 3306
```

## MySQL 管理
### 服务管理命令
ubuntu系统
```bash
# 启动mysql服务
sudo systemctl start mysql
sudo service mysql start
# 停止mysql服务
sudo systemctl stop mysql
# 重启mysql服务
sudo systemctl restart mysql
# 检查mysql服务状态
sudo systemctl status mysql
# 配置mysql服务开机启动
sudo systemctl enable mysql
```
### 配置文件管理
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# 修改配置文件（如上一节基本配置优化）后，重启mysql服务
sudo systemctl restart mysql
# 显示配置文件
cat /etc/mysql/mysql.conf.d/mysqld.cnf

[mysqld]
# 基本设置
port = 3306
bind-address = 0127.0.0.1
# 字符集设置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
# 内存设置
innodb_buffer_pool_size = 1G
key_buffer_size = 256M
# 连接设置
max_connections = 200
max_connect_errors = 10
# 日志设置
log-error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
# mysql8特定设置
default_authentication_plugin = mysql_native_password
```

### 用户和权限管理
#### 创建用户
```bash
# 创建用户
CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'password';
# 创建可以从任何主机连接的用户
CREATE USER 'newuser'@'%' IDENTIFIED BY 'password';
# 修改用户密码
ALTER USER 'newuser'@'localhost' IDENTIFIED BY 'newpassword';
```
#### 权限管理
```bash
# 授予所有权限
GRANT ALL PRIVILEGES ON *.* TO 'newuser'@'localhost';
# 授予特定数据库权限
GRANT SELECT, INSERT, UPDATE, DELETE ON database_name.* TO 'newuser'@'localhost';
#授予特定表权限
GRANT SELECT, INSERT, UPDATE, DELETE ON database_name.table_name TO 'newuser'@'localhost';
# 刷新权限
FLUSH PRIVILEGES;
# 查看用户权限
SHOW GRANTS FOR 'newuser'@'localhost';
# 撤销权限
# 撤销所有权限
REVOKE ALL PRIVILEGES ON *.* FROM 'newuser'@'localhost';
# 撤销特定数据库权限
REVOKE SELECT, INSERT, UPDATE, DELETE ON database_name.* FROM 'newuser'@'localhost';
# 撤销特定表权限
REVOKE SELECT, INSERT, UPDATE, DELETE ON database_name.table_name FROM 'newuser'@'localhost';
# 删除用户
DROP USER 'newuser'@'localhost';
```
### 性能监控
#### 查看服务器状态
```bash
# 查看服务器状态
SHOW STATUS;
# 查看特定状态变量
# 查看连接数
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Queries';
# 查看进程列表
SHOW PROCESSLIST;
# 查看服务器数量
SHOW VARIABLES;
#查看引擎状态
SHOW ENGINE INNODB STATUS;
```
#### 性能分析
```bash
# 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
#查看表状态
SHOW TABLE STATUS FROM database_name;
# 分析表
ANALYZE TABLE table_name;
# 优化表
OPTIMIZE TABLE table_name;
```
### 备份与恢复
#### 使用mysqldump备份
```bash
# 备份单个数据库
mysqldump -u root -p database_name > backup.sql
# 备份所有数据库
mysqldump -u root -p --all-databases > all_backup.sql
# 备份特定表
mysqldump -u root -p database_name table_name > table_backup.sql
# 备份结构不备份数据
mysqldump -u root -p --no-data database_name > structure_backup.sql
```
#### 恢复数据
```bash
# 恢复数据库
mysql -u root -p database_name < backup.sql
# 恢复所有数据库
mysql -u root -p < all_backup.sql
```
#### 管理注意事项
- 定期备份数据库，建议自动化备份
- 监控磁盘空间，避免空间不足
- 定期更新 MySQL 版本，修复安全漏洞
- 合理设置用户权限，遵循最小权限原则
- 监控慢查询，及时优化性能


## MySQL 连接
### 命令行连接
基本连接语法
```bash
# 基本连接格式 
mysql -h [主机名] -P [端口] -u [用户名] -p [数据库名] 
# 本地连接示例 
mysql -u root -p 
# 远程连接示例 
mysql -h 192.168.1.100 -P 3306 -u admin -p mydb 
# 指定字符集连接 
mysql -u root -p --default-character-set=utf8mb4
```
连接参数详解
```bash
# 常用连接参数 
-h, --host=name # 服务器主机名或IP地址 
-P, --port=# # 端口号（默认3306） 
-u, --user=name # 用户名 
-p, --password[=name] # 密码（建议不在命令行中直接输入） 
-D, --database=name # 默认数据库 
-e, --execute=name # 执行SQL语句后退出 
--ssl-mode=mode # SSL连接模式 
--protocol=name # 连接协议（TCP、SOCKET、PIPE、MEMORY） 
# 示例：执行单条SQL语句 
mysql -u root -p -e "SHOW DATABASES;" 
# 示例：执行SQL文件 
mysql -u root -p < backup.sql 
# 示例：将查询结果输出到文件 
mysql -u root -p -e "SELECT * FROM users;" > users.txt
```
#### MySQL 8.x 连接新特性
- 默认认证插件：使用 caching_sha2_password
- SSL 默认启用：默认要求加密连接
- 连接压缩：支持 zstd 压缩算法

```bash
# MySQL 8.x 特定连接选项 
mysql -u root -p --ssl-mode=REQUIRED mysql -u root -p --compression-algorithms=zstd 
mysql -u root -p --get-server-public-key
```
### MySQL Workbench 连接
- 创建新连接
- 打开 MySQL Workbench
- 点击 "+" 号创建新连接
- 填写连接信息：
  - Connection Name：连接名称（自定义）
  - Hostname：主机地址
  - Port：端口号（默认3306）
  - Username：用户名
  - Password：密码（可选择存储）
- 点击 "Test Connection" 测试连接
- 保存连接配置
#### 高级连接选项
```bash
# SSL 配置 
SSL Mode: Required/Preferred/Disabled 
SSL CA File: CA证书文件路径 
SSL Cert File: 客户端证书文件路径 
SSL Key File: 客户端私钥文件路径 
# 高级选项 
Default Schema: 默认数据库 
SQL_MODE: SQL模式设置 
Timeout: 连接超时时间
```
### Java 连接（JDBC）
```java
// MySQL 5.7 连接字符串 
String url57 = "jdbc:mysql://localhost:3306/testdb?useSSL=false&serverTimezone=UTC"; 
// MySQL 8.x 连接字符串 
String url8x = "jdbc:mysql://localhost:3306/testdb?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true"; 
// 连接示例 
import java.sql.*; 
public class MySQLConnection { 
    public static void main(String[] args) { 
        String url = "jdbc:mysql://localhost:3306/testdb?useSSL=true&serverTimezone=UTC"; 
        String username = "root"; 
        String password = "password"; 
        try { 
            Connection conn = DriverManager.getConnection(url, username, password); 
            System.out.println("连接成功！"); 
            Statement stmt = conn.createStatement(); 
            ResultSet rs = stmt.executeQuery("SELECT VERSION()"); 
            if (rs.next()) { 
                System.out.println("MySQL 版本: " + rs.getString(1)); 
            } 
            conn.close(); 
        } catch (SQLException e) { 
            System.out.println("连接失败: " + e.getMessage()); 
        } 
    } 
}
```
### 连接安全最佳实践
1. 密码安全
- 不要在命令行中直接输入密码
- 使用配置文件存储连接信息
- 定期更换数据库密码
- 使用强密码策略
2. 网络安全
```bash
# 启用 SSL 连接 
mysql -u root -p --ssl-mode=REQUIRED 
# 配置防火墙规则 
# 只允许特定IP访问MySQL端口 
iptables -A INPUT -p tcp -s 192.168.1.0/24 --dport 3306 -j ACCEPT 
iptables -A INPUT -p tcp --dport 3306 -j DROP
```
3. 用户权限管理
```bash
-- 创建专用用户而不是使用root CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password'; -- 授予最小必要权限 GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'app_user'@'localhost'; -- 限制连接来源 CREATE USER 'remote_user'@'192.168.1.%' IDENTIFIED BY 'password'; -- 查看用户权限 SHOW GRANTS FOR 'app_user'@'localhost';
```
4. 连接池配置
```bash
# 连接池最佳实践 max_connections = 200 # 最大连接数 max_user_connections = 50 # 单用户最大连接数 connect_timeout = 10 # 连接超时时间 wait_timeout = 28800 # 等待超时时间 interactive_timeout = 28800 # 交互超时时间
```
### 连接故障排除
#### 常见连接错误及解决方案
```bash
# 错误1: 
Access denied for user ERROR 1045 (28000): Access denied for user 'root'@'localhost' 
解决方案： 
1. 检查用户名和密码 
2. 重置root密码 
3. 检查用户权限 
# 错误2: 
Can't connect to MySQL server ERROR 2003 (HY000): Can't connect to MySQL server on 'localhost' 
解决方案： 
1. 检查MySQL服务是否启动 
2. 检查端口是否正确 
3. 检查防火墙设置 
# 错误3: 
Host is not allowed to connect ERROR 1130 (HY000): Host '192.168.1.100' is not allowed to connect 
解决方案： 
1. 修改用户主机权限 
2. 检查bind-address配置 
# MySQL 8.x 特有错误 
ERROR 2059: Authentication plugin 'caching_sha2_password' cannot be loaded 
解决方案： 
1. 升级客户端版本 
2. 修改用户认证插件 
3. 使用--get-server-public-key选项
```
#### 连接测试脚本
```bash
#!/bin/bash 
# MySQL 连接测试脚本 
HOST="localhost" PORT="3306" USER="root" PASSWORD="your_password" echo "测试 MySQL 连接..." 
# 测试端口是否开放 
if nc -z $HOST $PORT; 
then echo "✅ 端口 $PORT 可访问" 
else echo "❌ 端口 $PORT 不可访问" 
exit 1 fi 
# 测试数据库连接 
if mysql -h $HOST -P $PORT -u $USER -p$PASSWORD -e "SELECT 1;" &>/dev/null; 
then echo "✅ 数据库连接成功" mysql -h $HOST -P $PORT -u $USER -p$PASSWORD -e "SELECT VERSION();" 
else echo "❌ 数据库连接失败" 
exit 1 fi
```