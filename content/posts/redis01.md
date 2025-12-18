---
title: "Redis 基础"
date: 2021-02-13T12:00:00+08:00
draft: false
description: "Redis 是最常用的缓存中间件之一，本文将分享 Redis 基础的学习记录。"
tags: ["Redis", "中间件"]
categories: ["Middleware"]
---

Redis 是最常用的缓存中间件之一，本文将分享 Redis 基础。

## Redis 基础
Redis（Remote Dictionary Server）是一个开源的、基于内存的数据结构存储系统，可以用作数据库、缓存和消息代理。Redis 支持多种数据结构，如字符串、哈希、列表、集合、有序集合等，并提供了丰富的操作命令。

### 为什么选择 Redis？
Redis 以其卓越的性能、丰富的数据结构和强大的功能特性，成为现代应用开发中不可或缺的组件。无论是缓存、会话存储、实时分析还是消息队列，Redis 都能提供优秀的解决方案。
### Redis 核心特性
- 极高性能
基于内存存储，读写速度极快，支持每秒数十万次操作

- 丰富的数据结构
支持字符串、哈希、列表、集合、有序集合等多种数据类型

- 持久化支持
提供 RDB 和 AOF 两种持久化方式，保证数据安全

- 主从复制
支持主从复制，实现数据备份和读写分离

- 集群支持
内置集群功能，支持水平扩展和高可用

- 发布订阅
支持发布订阅模式，实现消息传递和事件通知
### Redis 版本对比
- Redis 6.x 特性
  - ACL 访问控制列表
  - RESP3 协议支持
  - 客户端缓存
  - 多线程 I/O
  - SSL/TLS 支持
  - 模块系统增强
- Redis 7.x 新特性
  - Redis Functions
  - ACL v2 增强
  - 命令内省功能
  - Sharded Pub/Sub
  - 多部分 AOF
  - 性能优化

### Redis 应用场景
1. 缓存系统
Redis 最常见的应用场景是作为缓存层，将热点数据存储在内存中，大幅提升应用性能。

2. 会话存储
在分布式系统中，Redis 可以作为共享的会话存储，解决用户登录状态在多个服务器间的同步问题。

3. 实时排行榜
利用 Redis 的有序集合（Sorted Set），可以轻松实现游戏排行榜、热门文章排序等功能。

4. 消息队列
Redis 的列表和发布订阅功能可以实现简单的消息队列系统。

5. 分布式锁
利用 Redis 的原子操作特性，可以实现分布式环境下的锁机制。


## Redis 简介
### Redis 概述
Redis（Remote Dictionary Server）是一个开源的、基于内存的数据结构存储系统。它由意大利开发者 Salvatore Sanfilippo（antirez）于 2009 年开发，最初是为了解决 LLOOGG 网站的扩展性问题。Redis 现在由 Redis Labs 维护和开发。
#### Redis 的核心理念
Redis 的设计理念是"简单而强大"。它提供了丰富的数据结构和操作命令，同时保持了极高的性能和简洁的 API。Redis 不仅仅是一个缓存系统，更是一个功能完整的数据平台。
### Redis 发展历程
- 2009年 - Redis 诞生
Salvatore Sanfilippo 为解决 LLOOGG 网站性能问题而创建了 Redis

- 2010年 - 1.0 版本发布
Redis 1.0 正式发布，支持基本的数据类型和持久化功能

- 2012年 - 2.6 版本
引入 Lua 脚本支持，增强了 Redis 的编程能力

- 2015年 - 3.0 版本
Redis Cluster 集群功能正式发布，支持分布式部署

- 2020年 - 6.0 版本
引入 ACL、多线程 I/O、客户端缓存等重要特性

- 2022年 - 7.0 版本
Redis Functions、ACL v2、命令内省等新特性
### Redis 架构特点
```text
🏗️ Redis 单机架构
客户端 ↔ Redis 服务器 ↔ 内存数据库
↓
持久化存储（RDB/AOF）
```
### Redis 核心特性
- 内存存储
所有数据存储在内存中，读写速度极快，支持每秒数十万次操作

- 丰富数据结构
支持字符串、哈希、列表、集合、有序集合、位图、HyperLogLog 等

- 数据持久化
提供 RDB 快照和 AOF 日志两种持久化方式

- 主从复制
支持主从复制，实现数据备份和读写分离

- 集群支持
内置 Redis Cluster，支持水平扩展和高可用

- 发布订阅
支持发布订阅模式，实现消息传递

- 事务支持
支持事务操作，保证操作的原子性

- Lua 脚本
支持 Lua 脚本，实现复杂的原子操作

### Redis vs 其他数据库
| 特性 | Redis | MySQL | MongoDB | Memcached |
| --- | --- | --- | --- | --- |
| 数据存储 | 内存 + 持久化 | 磁盘 | 磁盘 | 内存 |
| 数据结构 | 丰富（8种+） | 表格 | 文档 | 键值对 |
| 性能 | 极高 | 中等 | 中等 | 极高 |
| 持久化 | 支持 | 支持 | 支持 | 不支持 |
| 集群 | 原生支持 | 需要配置 | 原生支持 | 需要客户端 |
| 事务 | 支持 | 支持 | 支持 | 不支持 |
### Redis 应用场景详解
1. 缓存系统
Redis 最常见的应用场景是作为缓存层，将频繁访问的数据存储在内存中：
```bash
# 缓存用户信息 SET user:1001 '{"name":"张三","age":25,"city":"北京"}' EXPIRE user:1001 3600 # 设置1小时过期 # 获取缓存 GET user:1001
```
2. 会话存储
在分布式系统中，Redis 可以作为共享的会话存储：
```bash
# 存储用户会话 HSET session:abc123 user_id 1001 HSET session:abc123 login_time 1640995200 EXPIRE session:abc123 1800 # 30分钟过期
```
3. 实时排行榜
利用有序集合实现排行榜功能：
```bash
# 添加用户分数 ZADD leaderboard 1500 "player1" ZADD leaderboard 2000 "player2" ZADD leaderboard 1800 "player3" # 获取排行榜前10名 ZREVRANGE leaderboard 0 9 WITHSCORES
```
4. 分布式锁
实现分布式环境下的锁机制：
```bash
# 获取锁 SET lock:resource1 "unique_value" NX EX 30 # 释放锁（使用 Lua 脚本保证原子性） if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end
```
```
选择 Redis 的理由
- 性能卓越：基于内存的存储，读写速度极快
- 数据结构丰富：不仅仅是键值存储，支持复杂数据操作
- 功能完整：缓存、数据库、消息队列一体化解决方案
- 生态成熟：广泛的社区支持和客户端库
- 运维友好：简单的部署和管理，丰富的监控工具
```
### Redis 的局限性
虽然 Redis 功能强大，但也有一些需要注意的局限性：

- 内存限制：数据量受服务器内存限制
- 单线程模型：虽然 6.0+ 支持多线程 I/O，但命令执行仍是单线程
- 持久化开销：持久化操作可能影响性能
- 复杂查询：不支持复杂的关系查询和 JOIN 操作
## Redis 安装
### 系统要求
| 组件 | 最低要求 | 推荐配置 | 说明 |
| --- | --- | --- | --- |
| 操作系统 | Linux/macOS/Windows | Linux (Ubuntu 18.04+) | Linux 环境性能最佳 |
| 内存 | 512MB | 4GB+ | 内存大小决定数据容量 |
| 磁盘空间 | 100MB | 10GB+ | 用于持久化和日志 |
| 网络 | TCP/IP | 千兆网络 | 影响集群通信性能 |

```
在开始安装之前，请确保系统满足基本要求，并且具有管理员权限。建议在生产环境中使用 Linux 系统，以获得最佳性能。
```

### 安装方式选择
#### Linux

方法一：包管理器安装（推荐）
```bash
# Ubuntu/Debian 
sudo apt update sudo apt install redis-server 
# CentOS/RHEL/Fedora 
sudo yum install redis 
# 或者使用 dnf 
sudo dnf install redis 
# 启动 Redis 服务 
sudo systemctl start redis sudo systemctl enable redis 
# 验证安装 
redis-cli ping 
# 应该返回 PONG
```
方法二：源码编译安装
```bash
## 下载源码
wget https://download.redis.io/redis-stable.tar.gz tar xzf redis-stable.tar.gz cd redis-stable
## 编译安装
make sudo make install
## 创建配置目录
sudo mkdir /etc/redis sudo cp redis.conf /etc/redis/
## 启动 Redis
redis-server /etc/redis/redis.conf
```
#### Docker
快速启动
```bash
## 拉取 Redis 镜像 
docker pull redis:latest 
# 运行 Redis 容器 
docker run --name my-redis -p 6379:6379 -d redis:latest 
# 连接到 Redis 
docker exec -it my-redis redis-cli
```
使用配置文件
```bash
# 创建配置文件 
mkdir -p /opt/redis/conf wget -O /opt/redis/conf/redis.conf http://download.redis.io/redis-stable/redis.conf 
# 运行带配置的容器 
docker run --name my-redis \ 
-p 6379:6379 \ 
-v /opt/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf \ 
-v /opt/redis/data:/data \ 
-d redis:latest redis-server /usr/local/etc/redis/redis.conf
```
Docker Compose
```yaml
# docker-compose.yml 
version: '3.8' 
services: redis: image: redis:latest 
container_name: my-redis 
ports: - "6379:6379" 
volumes: - ./redis.conf:/usr/local/etc/redis/redis.conf - ./data:/data 
command: redis-server /usr/local/etc/redis/redis.conf 
# 启动 
docker-compose up -d
```

### 安装验证
✅ 验证安装是否成功
```bash
# 检查 Redis 版本 
redis-server --version 
## 检查 Redis 客户端 
redis-cli --version 
# 连接测试 
redis-cli ping 
# 应该返回: PONG 
# 基本操作测试 
redis-cli 127.0.0.1:6379> set test "Hello Redis" OK 127.0.0.1:6379> get test "Hello Redis" 127.0.0.1:6379> exit
```
### 基本配置
重要配置项
```bash
# /etc/redis/redis.conf 或 redis.conf 
# 绑定地址（安全考虑，生产环境不要使用 0.0.0.0） bind 127.0.0.1 
## 端口 port 6379 
## 后台运行 daemonize yes 
## 日志文件 logfile /var/log/redis/redis-server.log 
## 数据目录 dir /var/lib/redis 
## 最大内存 maxmemory 2gb 
## 内存策略 maxmemory-policy allkeys-lru 
## 持久化 save 900 1 save 300 10 save 60 10000
```
### 服务管理
#### Linux 系统服务
```bash
# 启动服务 
sudo systemctl start redis 
# 停止服务 
sudo systemctl stop redis 
# 重启服务 
sudo systemctl restart redis 
## 查看状态 
sudo systemctl status redis 
## 开机自启 
sudo systemctl enable redis 
## 禁用自启 
sudo systemctl disable redis
```
#### 手动启动
```bash
# 前台启动（用于调试） 
redis-server 
# 后台启动 
redis-server --daemonize yes
## 使用配置文件启动 
redis-server /path/to/redis.conf 
# 指定端口启动 
redis-server --port 6380
```
### 常见问题解决

#### 问题1：端口被占用
```bash
# 查看端口占用 
sudo netstat -tlnp | grep :6379 sudo lsof -i :6379 
# 杀死占用进程 
sudo kill -9 PID 
# 或者使用其他端口 
redis-server --port 6380
```
#### 问题2：权限不足
```bash
# 创建 redis 用户 
sudo useradd -r -s /bin/false redis 
# 设置目录权限 
sudo chown -R redis:redis /var/lib/redis 
sudo chown -R redis:redis /var/log/redis 
# 以 redis 用户运行 
sudo -u redis redis-server /etc/redis/redis.conf
```
#### 问题3：内存不足
```bash
# 检查系统内存 
free -h 
# 设置 Redis 最大内存 
redis-cli CONFIG SET maxmemory 1gb 
# 设置内存策略 
redis-cli CONFIG SET maxmemory-policy allkeys-lru 
# 查看内存使用 
redis-cli INFO memory
```
## Redis 配置
### Redis 配置概述
Redis 的配置主要通过 redis.conf 配置文件来管理。合理的配置可以显著提升 Redis 的性能、安全性和稳定性。
#### 基本配置
- 端口配置
Redis 默认监听端口为 6379，可以通过以下配置修改：
```bash
port 6379
```
- 绑定地址
指定 Redis 监听的网络接口：
```bash
bind 127.0.0.1
# 监听所有接口
bind 0.0.0.0
```
- 守护进程模式
设置 Redis 以守护进程方式运行：
```bash
daemonize yes
```
#### 内存配置
- 最大内存限制
设置 Redis 使用的最大内存：
```bash
maxmemory 2gb
```
- 内存淘汰策略
当内存达到上限时的处理策略：
```bash
# 不淘汰任何key，新写入操作会报错
maxmemory-policy noeviction

# LRU淘汰策略
maxmemory-policy allkeys-lru

# LFU淘汰策略
maxmemory-policy allkeys-lfu
```
#### 持久化配置
- RDB 快照配置
配置 RDB 快照的生成条件：
```bash
# 900秒内至少1个key发生变化时保存
save 900 1
# 300秒内至少10个key发生变化时保存
save 300 10
# 60秒内至少10000个key发生变化时保存
save 60 10000
```
- AOF 配置
配置 AOF (Append Only File) 持久化：
```bash
# 启用AOF
appendonly yes

# AOF文件名
appendfilename "appendonly.aof"

# 同步策略
appendfsync everysec
```
#### 安全配置
- 密码认证
设置 Redis 访问密码：
```bash
requirepass your_password_here
```
- 命令重命名
重命名或禁用危险命令：
```bash
# 重命名FLUSHDB命令
rename-command FLUSHDB my_flush_command

# 禁用FLUSHALL命令
rename-command FLUSHALL ""
```
#### 网络配置
- 超时设置
客户端空闲超时时间：
```bash
timeout 300
```
- TCP keepalive
TCP 连接保活设置：
```bash
tcp-keepalive 300
```
- 最大客户端连接数
限制同时连接的客户端数量：
```bash
maxclients 10000
```
#### 日志配置
- 日志级别
设置日志记录级别：
```bash
# debug, verbose, notice, warning
loglevel notice
```
- 日志文件
指定日志文件路径：
```bash
logfile /var/log/redis/redis-server.log
```


### 配置文件示例
以下是一个完整的 Redis 配置文件示例：
```bash
# Redis 配置文件示例
port 6379
bind 127.0.0.1
daemonize yes
pidfile /var/run/redis/redis-server.pid

# 内存配置
maxmemory 2gb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# 安全配置
requirepass your_secure_password

# 网络配置
timeout 300
tcp-keepalive 300
maxclients 10000

# 日志配置
loglevel notice
logfile /var/log/redis/redis-server.log
```
### 配置生效方式
Redis 配置可以通过以下方式生效：

- 启动时加载：通过 redis-server /path/to/redis.conf 指定配置文件
- 运行时修改：使用 CONFIG SET 命令动态修改配置
- 保存配置：使用 CONFIG REWRITE 命令将运行时配置写入文件

## Redis 数据类型
### Redis 数据类型概述
Redis 支持五种基本数据类型：字符串（String）、哈希（Hash）、列表（List）、集合（Set）和有序集合（Sorted Set）。每种数据类型都有其特定的使用场景和操作命令。

#### 字符串（String）
字符串是 Redis 最基本的数据类型，一个键最大能存储 512MB 的数据。

特性：
- 二进制安全，可以存储任何数据
- 支持数值操作（递增、递减）
- 支持位操作
- 最大长度 512MB

常用命令示例：
```bash
SET key "Hello World"
GET key
INCR counter
DECR counter
APPEND key " Redis"
```
使用场景：
- 缓存用户信息
- 计数器（访问量、点赞数）
- 分布式锁
- 会话存储
#### 哈希（Hash）
哈希是一个键值对集合，特别适合存储对象。

特性：
- 类似于关系数据库的表结构
- 节省内存空间
- 支持单个字段的操作
- 每个哈希可以存储 2^32 - 1 个字段

常用命令示例：
```bash
HSET user:1 name "张三" age 25
HGET user:1 name
HMSET user:2 name "李四" age 30 city "北京"
HGETALL user:1
HDEL user:1 age
```
使用场景：
- 存储用户信息
- 存储商品信息
- 配置信息管理
- 购物车数据
#### 列表（List）
列表是简单的字符串列表，按照插入顺序排序，支持双端操作。

特性：
- 有序的字符串列表
- 支持头部和尾部插入/删除
- 支持范围查询
- 最多可包含 2^32 - 1 个元素

常用命令示例：
```bash
LPUSH mylist "world"
LPUSH mylist "hello"
RPUSH mylist "redis"
LRANGE mylist 0 -1
LPOP mylist
RPOP mylist
```
使用场景：
- 消息队列
- 最新动态列表
- 任务队列
- 历史记录
#### 集合（Set）
集合是字符串的无序集合，不允许重复元素。

特性：
- 无序且唯一
- 支持集合运算（交集、并集、差集）
- 快速的成员检测
- 最多可包含 2^32 - 1 个元素

常用命令示例：
```bash
SADD myset "hello"
SADD myset "world"
SADD myset "hello"  # 重复元素不会被添加
SMEMBERS myset
SISMEMBER myset "hello"
SINTER set1 set2  # 交集
```
使用场景：
- 标签系统
- 好友关系
- 权限管理
- 去重处理
#### 有序集合（Sorted Set）
有序集合是集合的升级版，每个元素都关联一个分数，按分数排序。

特性：
- 有序且唯一
- 每个元素关联一个分数
- 支持范围查询
- 支持分数范围操作


常用命令示例：
```bash
ZADD leaderboard 100 "player1"
ZADD leaderboard 200 "player2"
ZADD leaderboard 150 "player3"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 2  # 前三名
```
使用场景：
- 排行榜
- 优先级队列
- 时间线
- 范围查询
### 数据类型选择指南

- String：简单的键值存储，计数器，缓存
- Hash：存储对象，减少内存使用
- List：需要保持顺序的数据，队列操作
- Set：需要去重的数据，集合运算
- Sorted Set：需要排序的数据，排行榜
