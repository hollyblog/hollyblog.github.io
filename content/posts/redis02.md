---
title: "Redis 命令"
date: 2021-02-14T12:00:00+08:00
draft: false
description: "Redis 命令：命令概述、分类、语法规则、示例。"
tags: ["Redis", "中间件"]
categories: ["Middleware"]
---

## Redis 命令概述
### Redis 命令简介
Redis 提供了丰富的命令集，用于操作不同的数据类型和执行各种功能。这些命令按功能分为多个类别，每个类别都有其特定的用途和语法规则。

> 命令语法规则
> - 命令名称不区分大小写（建议使用大写）
> - 参数之间用空格分隔
> - 字符串参数可以用双引号包围
> - 可选参数用方括号 [] 表示
> - 多选参数用竖线 | 分隔


#### 键操作命令
用于操作 Redis 键的通用命令，适用于所有数据类型。

- EXISTS key
检查键是否存在

- DEL key [key ...]
删除一个或多个键

- TYPE key
返回键的数据类型

- EXPIRE key seconds
设置键的过期时间

- TTL key
查看键的剩余生存时间

- KEYS pattern
查找匹配模式的键

#### 字符串命令
操作字符串类型数据的专用命令。

- SET key value
设置字符串值

- GET key
获取字符串值

- INCR key
将数值递增1
- DECR key
将数值递减1

- APPEND key value
追加字符串到末尾

- STRLEN key
获取字符串长度

#### 哈希命令
操作哈希类型数据的专用命令。

- HSET key field value
设置哈希字段值

- HGET key field
获取哈希字段值

- HMSET key field value [field value ...]
批量设置哈希字段

- HGETALL key
获取所有字段和值
- HDEL key field [field ...]
删除哈希字段

- HKEYS key
获取所有字段名

#### 列表命令
操作列表类型数据的专用命令。

- LPUSH key value [value ...]
从左侧插入元素

- RPUSH key value [value ...]
从右侧插入元素

- LPOP key
从左侧弹出元素

- RPOP key
从右侧弹出元素

- LRANGE key start stop
获取指定范围元素

- LLEN key
获取列表长度

#### 集合命令
操作集合类型数据的专用命令。

- SADD key member [member ...]
添加集合成员

- SMEMBERS key
获取所有成员

- SISMEMBER key member
检查成员是否存在

- SREM key member [member ...]
删除集合成员

- SINTER key [key ...]
计算集合交集

- SUNION key [key ...]
计算集合并集

#### 有序集合命令
操作有序集合类型数据的专用命令。

- ZADD key score member [score member ...]
添加有序集合成员

- ZRANGE key start stop [WITHSCORES]
按索引范围获取成员

- ZREVRANGE key start stop [WITHSCORES]
按索引范围逆序获取

- ZSCORE key member
获取成员分数

- ZREM key member [member ...]
删除有序集合成员

- ZCARD key
获取有序集合大小

#### 服务器命令
用于管理和监控 Redis 服务器的命令。

- INFO [section]
获取服务器信息

- PING [message]
测试连接

- FLUSHDB
清空当前数据库

- FLUSHALL
清空所有数据库

- SELECT index
切换数据库

- DBSIZE
获取数据库键数量

### 命令使用示例
```bash
# 字符串操作
SET name "Redis"
GET name
INCR counter

# 哈希操作
HSET user:1 name "张三" age 25
HGET user:1 name
HGETALL user:1

# 列表操作
LPUSH mylist "item1" "item2"
LRANGE mylist 0 -1
LPOP mylist

# 集合操作
SADD myset "member1" "member2"
SMEMBERS myset
SISMEMBER myset "member1"

# 有序集合操作
ZADD leaderboard 100 "player1" 200 "player2"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 2
```
### 使用建议
- 使用 HELP command 查看命令帮助
- 生产环境避免使用 KEYS * 命令
- 合理设置键的过期时间
- 使用批量操作提高性能
- 注意命令的时间复杂度

## Redis 键（key）操作
### Redis 键概述
在 Redis 中，键（Key）是访问数据的唯一标识符。合理的键设计和管理对于 Redis 的性能和可维护性至关重要。

#### 键的命名规范
良好的键命名规范有助于提高代码的可读性和维护性：

> 推荐的命名模式：
> - user:1001:profile - 用户资料
> - session:abc123 - 会话信息
> - cache:article:1001 - 文章缓存
> - counter:page:views - 页面访问计数
> - lock:order:1001 - 订单锁

命名建议
- 使用冒号 ":" 作为分隔符
- 采用层次化结构
- 使用有意义的名称
- 保持一致的命名风格
- 避免过长的键名
- 避免使用特殊字符
- 保持一致的命名风格

#### 键的基本操作
Redis 提供了丰富的键操作命令：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|EXISTS key	| 检查键是否存在	| EXISTS user:1001
|TYPE key	| 返回键的数据类型	| TYPE user:1001
|DEL key [key ...]	| 删除一个或多个键	| DEL user:1001 user:1002
|RENAME key newkey	| 重命名键	| RENAME oldname newname
|KEYS pattern	| 查找匹配模式的键	| KEYS user:*
|SCAN cursor	| 迭代数据库中的键	| SCAN 0 MATCH user:*

#### 键的过期时间
Redis 支持为键设置过期时间，这对于缓存和临时数据非常有用：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|EXPIRE key seconds	| 设置键的过期时间（秒）	| EXPIRE session:abc123 3600
|EXPIREAT key timestamp	| 设置键在指定时间戳过期	| EXPIREAT key 1609459200
|PEXPIRE key milliseconds	| 设置键的过期时间（毫秒）	| PEXPIRE key 60000
|TTL key	| 查看键的剩余生存时间（秒）	| TTL session:abc123
|PTTL key	| 查看键的剩余生存时间（毫秒）	| PTTL session:abc123
|PERSIST key	| 移除键的过期时间	| PERSIST session:abc123

过期时间示例：
```bash
# 设置会话过期时间为1小时
SET session:user123 "session_data"
EXPIRE session:user123 3600

# 检查剩余时间
TTL session:user123

# 设置缓存过期时间为30分钟
SET cache:article:1001 "article_content"
EXPIRE cache:article:1001 1800
```
#### 键的查找和遍历
Redis 提供了多种方式来查找和遍历键：

##### KEYS 命令支持模式匹配：

  - '*'' - 匹配任意数量的字符
  - '?' - 匹配单个字符
  - '[abc]' - 匹配方括号内的任意字符
  - '[a-z]' - 匹配指定范围内的字符

KEYS 命令示例：
```bash
# 查找所有用户相关的键
KEYS user:*

# 查找所有缓存键
KEYS cache:*

# 查找特定模式的键
KEYS user:100?
KEYS session:[a-z]*
```

> KEYS 命令会阻塞服务器，在生产环境中应避免使用。推荐使用 SCAN 命令进行迭代。

##### SCAN 命令提供了非阻塞的键遍历方式：

SCAN 命令示例：
```bash
# 开始扫描
SCAN 0

# 带模式匹配的扫描
SCAN 0 MATCH user:*

# 限制返回数量
SCAN 0 MATCH user:* COUNT 10

# 继续扫描（使用返回的游标）
SCAN 17 MATCH user:*
```
#### 键空间统计
Redis 提供了一些命令来获取键空间的统计信息：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|DBSIZE	| 返回当前数据库的键数量	| DBSIZE
|INFO keyspace	| 显示键空间统计信息	| INFO keyspace
|RANDOMKEY	| 随机返回一个键	| RANDOMKEY

### 实际应用示例
用户会话管理：
```bash
# 创建用户会话
SET session:abc123 "{\"user_id\": 1001, \"login_time\": 1609459200}"
EXPIRE session:abc123 7200  # 2小时过期

# 检查会话是否存在
EXISTS session:abc123

# 延长会话时间
EXPIRE session:abc123 7200

# 删除会话
DEL session:abc123
```
缓存管理：
```bash
# 设置文章缓存
SET cache:article:1001 "article content"
EXPIRE cache:article:1001 3600  # 1小时过期

# 批量删除缓存
KEYS cache:article:*
DEL cache:article:1001 cache:article:1002

# 清理过期缓存（使用SCAN避免阻塞）
SCAN 0 MATCH cache:* COUNT 100
```
### 最佳实践
- 使用有意义的键名，便于理解和维护
- 为临时数据设置合适的过期时间
- 生产环境避免使用 KEYS * 命令
- 使用 SCAN 命令进行大量键的遍历
- 定期监控键空间的使用情况
- 合理规划键的命名空间
- 

## Redis 字符串(String)
### 字符串类型概述
字符串是 Redis 最基本的数据类型，也是最常用的类型。Redis 的字符串是二进制安全的，可以存储任何数据，包括图片、序列化对象等。一个字符串值最大可以是 512MB。

#### 基本操作命令
字符串类型的基础读写操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|SET key value	| 设置字符串值	| SET name "Redis"
|GET key	| 获取字符串值	| GET name
|GETSET key value	| 设置新值并返回旧值	| GETSET name "NewRedis"
|STRLEN key	| 获取字符串长度	| STRLEN name
|APPEND key value	| 追加字符串到末尾	| APPEND name " Database"
|GETRANGE key start end	| 获取字符串子串	| GETRANGE name 0 4
|SETRANGE key offset value	| 从指定位置开始覆写字符串	| SETRANGE name 0 "MySQL"

基本操作示例：
```bash
# 设置和获取字符串
SET greeting "Hello World"
GET greeting

# 追加字符串
APPEND greeting " from Redis"
GET greeting

# 获取字符串长度
STRLEN greeting

# 获取子串
GETRANGE greeting 0 4    # 返回 "Hello"
GETRANGE greeting -5 -1  # 返回 "Redis"
```
#### 数值操作命令
当字符串存储的是数字时，Redis 提供了原子性的数值操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|INCR key	| 将数值递增1	| INCR counter
|INCRBY key increment	| 将数值增加指定值	| INCRBY counter 10
|INCRBYFLOAT key increment	| 将数值增加指定浮点数	| INCRBYFLOAT price 0.5
|DECR key	| 将数值递减1	| DECR counter
|DECRBY key decrement	| 将数值减少指定值	| DECRBY counter 5

数值操作示例：
```bash
# 初始化计数器
SET page_views 0

# 递增操作
INCR page_views        # 结果: 1
INCR page_views        # 结果: 2
INCRBY page_views 10   # 结果: 12

# 递减操作
DECR page_views        # 结果: 11
DECRBY page_views 5    # 结果: 6

# 浮点数操作
SET price 10.5
INCRBYFLOAT price 2.3  # 结果: 12.8
```
#### 批量操作命令
Redis 支持批量操作多个字符串，提高操作效率：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|MSET key value [key value ...]	| 批量设置多个键值对	| MSET k1 v1 k2 v2 k3 v3
|MGET key [key ...]	| 批量获取多个键的值	| MGET k1 k2 k3
|MSETNX key value [key value ...]	| 批量设置（仅当所有键都不存在时）	| MSETNX k4 v4 k5 v5
批量操作示例：
```bash
# 批量设置用户信息
MSET user:1001:name "张三" user:1001:age "25" user:1001:city "北京"

# 批量获取用户信息
MGET user:1001:name user:1001:age user:1001:city

# 批量设置（仅当键不存在时）
MSETNX user:1002:name "李四" user:1002:age "30"
```
#### 条件设置命令
Redis 提供了带条件的设置命令，常用于实现分布式锁：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|SETNX key value	| 仅当键不存在时设置	| SETNX lock:order:1001 "locked"
|SETEX key seconds value	| 设置值并指定过期时间	| SETEX session:abc123 3600 "user_data"
|PSETEX key milliseconds value	| 设置值并指定过期时间（毫秒）	| PSETEX cache:key 60000 "data"
|SET key value [EX seconds] [PX milliseconds] [NX/XX]	| 设置值（支持多种选项）	| SET lock:key "value" EX 30 NX


条件设置示例：
```bash
# 分布式锁实现
SET lock:order:1001 "locked" EX 30 NX
# 如果返回OK，表示获取锁成功
# 如果返回nil，表示锁已被其他进程持有

# 会话管理
SETEX session:user123 3600 "{\"user_id\": 123, \"role\": \"admin\"}"

# 缓存设置
SET cache:article:1001 "article_content" EX 1800  # 30分钟过期
```
### 实际应用场景
#### 计数器应用
利用 INCR/DECR 命令实现各种计数功能：
```bash
# 页面访问计数
INCR page:home:views
INCR page:about:views

# 用户积分系统
INCRBY user:1001:points 100  # 增加100积分
DECRBY user:1001:points 50   # 扣除50积分

# API调用限流
SET api:user:1001:calls 0 EX 3600  # 每小时重置
INCR api:user:1001:calls
GET api:user:1001:calls  # 检查调用次数
```
#### 缓存应用
使用字符串存储序列化的对象数据：
```bash
# 用户信息缓存
SET user:1001 "{\"id\": 1001, \"name\": \"张三\", \"email\": \"zhang@example.com\"}" EX 3600
GET user:1001

# 文章内容缓存
SET article:1001 "文章内容..." EX 1800
GET article:1001

# 配置信息缓存
SET config:app:version "1.2.3"
GET config:app:version
```
#### 分布式锁
使用 SETNX 和过期时间实现分布式锁：
```bash
# 获取锁
SET lock:resource:1001 "process_id_123" EX 30 NX

# 检查锁状态
GET lock:resource:1001

# 释放锁（使用Lua脚本确保原子性）
# if redis.call("get", KEYS[1]) == ARGV[1] then
#     return redis.call("del", KEYS[1])
# else
#     return 0
# end
```
#### 会话存储
存储用户会话信息：
```bash
# 创建会话
SET session:abc123def456 "{\"user_id\": 1001, \"login_time\": 1609459200, \"permissions\": [\"read\", \"write\"]}" EX 7200

# 获取会话信息
GET session:abc123def456

# 延长会话
EXPIRE session:abc123def456 7200

# 删除会话（登出）
DEL session:abc123def456
```
### 性能优化建议
- 批量操作：使用 MSET/MGET 减少网络往返次数
- 合理过期：为缓存数据设置合适的过期时间
- 原子操作：利用 INCR/DECR 的原子性避免并发问题
- 内存优化：避免存储过大的字符串值
- 序列化：选择高效的序列化格式（如JSON、MessagePack）

## Redis 哈希(Hash)
### 哈希类型概述
Redis 哈希是一个键值对集合，特别适合存储对象。哈希类型的值本身又是一个键值对集合，可以看作是一个小型的 Redis 数据库。每个哈希可以存储多达 2^32 - 1 个键值对。

#### 基本操作命令
哈希类型的基础读写操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|HSET key field value	| 设置哈希字段的值	| HSET user:1001 name "张三"
|HGET key field	| 获取哈希字段的值	| HGET user:1001 name
|HEXISTS key field	| 检查哈希字段是否存在	| HEXISTS user:1001 email
|HDEL key field [field ...]	| 删除哈希字段	| HDEL user:1001 temp_field
|HLEN key	| 获取哈希字段数量	| HLEN user:1001
|HKEYS key	|获取所有哈希字段名	|HKEYS user:1001
|HVALS key	|获取所有哈希字段值	|HVALS user:1001
|HGETALL key	|获取所有字段和值	|HGETALL user:1001

基本操作示例：
```bash
# 创建用户信息
HSET user:1001 name "张三"
HSET user:1001 age "25"
HSET user:1001 email "zhang@example.com"
HSET user:1001 city "北京"

# 获取用户信息
HGET user:1001 name     # 返回: "张三"
HGET user:1001 age      # 返回: "25"

# 检查字段是否存在
HEXISTS user:1001 email # 返回: 1 (存在)
HEXISTS user:1001 phone # 返回: 0 (不存在)

# 获取所有信息
HGETALL user:1001
# 返回: 1) "name" 2) "张三" 3) "age" 4) "25" 5) "email" 6) "zhang@example.com" 7) "city" 8) "北京"

# 获取字段数量
HLEN user:1001          # 返回: 4
```
#### 批量操作命令
Redis 支持批量操作多个哈希字段，提高操作效率：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|HMSET key field value [field value ...]	| 批量设置多个字段	|HMSET user:1002 name "李四" age "30"
|HMGET key field [field ...]	| 批量获取多个字段的值	|HMGET user:1002 name age
|HSETNX key field value	| 仅当字段不存在时设置	|HSETNX user:1002 phone "13800138000"
批量操作示例：
```bash
# 批量创建用户信息
HMSET user:1002 name "李四" age "30" city "上海" email "li@example.com"

# 批量获取用户信息
HMGET user:1002 name age city
# 返回: 1) "李四" 2) "30" 3) "上海"

# 条件设置字段
HSETNX user:1002 phone "13800138000"  # 返回: 1 (设置成功)
HSETNX user:1002 phone "13900139000"  # 返回: 0 (字段已存在，设置失败)
```
#### 数值操作命令
当哈希字段存储数值时，可以进行原子性的数值操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|HINCRBY key field increment	| 将字段值增加指定整数	|HINCRBY user:1001 login_count 1
|HINCRBYFLOAT key field increment	| 将字段值增加指定浮点数	|HINCRBYFLOAT user:1001 balance 10.5

数值操作示例：
```bash
# 初始化用户统计信息
HMSET user:1001 login_count 0 balance 100.0 points 0

# 用户登录计数
HINCRBY user:1001 login_count 1    # 登录次数+1
HINCRBY user:1001 login_count 1    # 再次登录，计数+1

# 用户余额操作
HINCRBYFLOAT user:1001 balance 50.5   # 充值50.5元
HINCRBYFLOAT user:1001 balance -20.0  # 消费20元

# 积分操作
HINCRBY user:1001 points 100       # 获得100积分
HINCRBY user:1001 points -50       # 消费50积分

# 查看最终结果
HGETALL user:1001
```
#### 字段遍历命令
Redis 提供了安全的字段遍历命令：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|HSCAN key cursor [MATCH pattern] [COUNT count]	| 迭代哈希字段	|HSCAN user:1001 0 MATCH "*name*"
字段遍历示例：
```bash
# 遍历所有字段
HSCAN user:1001 0

# 按模式匹配字段
HSCAN user:1001 0 MATCH "*count*"

# 限制返回数量
HSCAN user:1001 0 COUNT 2
```
### 实际应用场景
#### 用户信息存储
使用哈希存储用户的详细信息：

```bash
# 用户基本信息
HMSET user:1001 \
    name "张三" \
    age "25" \
    email "zhang@example.com" \
    phone "13800138000" \
    city "北京" \
    register_time "2024-01-01" \
    last_login "2024-01-15"

# 用户统计信息
HMSET user:1001:stats \
    login_count 0 \
    post_count 0 \
    comment_count 0 \
    like_count 0

# 更新统计
HINCRBY user:1001:stats login_count 1
HINCRBY user:1001:stats post_count 1
```
#### 购物车管理
使用哈希存储用户的购物车信息：
```bash
# 添加商品到购物车
HSET cart:user:1001 product:101 2    # 商品101，数量2
HSET cart:user:1001 product:102 1    # 商品102，数量1
HSET cart:user:1001 product:103 3    # 商品103，数量3

# 更新商品数量
HINCRBY cart:user:1001 product:101 1  # 商品101数量+1

# 获取购物车所有商品
HGETALL cart:user:1001

# 获取特定商品数量
HGET cart:user:1001 product:101

# 删除商品
HDEL cart:user:1001 product:102

# 清空购物车
DEL cart:user:1001
```
#### 网站统计
使用哈希存储网站的各种统计数据：
```bash
# 页面访问统计
HINCRBY stats:page:views home 1
HINCRBY stats:page:views about 1
HINCRBY stats:page:views contact 1

# 用户行为统计
HINCRBY stats:user:actions login 1
HINCRBY stats:user:actions register 1
HINCRBY stats:user:actions purchase 1

# 获取统计数据
HGETALL stats:page:views
HGETALL stats:user:actions

# 按日期统计
HINCRBY stats:daily:2024-01-15 page_views 1
HINCRBY stats:daily:2024-01-15 unique_visitors 1
```
#### 配置管理
使用哈希存储应用的配置信息：
```bash
# 数据库配置
HMSET config:database \
    host "localhost" \
    port "3306" \
    username "root" \
    database "myapp" \
    max_connections "100"

# 缓存配置
HMSET config:cache \
    redis_host "localhost" \
    redis_port "6379" \
    default_ttl "3600" \
    max_memory "1gb"

# 获取配置
HGET config:database host
HGET config:cache default_ttl

# 更新配置
HSET config:database max_connections "200"
```
### 性能优化建议
- 批量操作：使用 HMSET/HMGET 减少网络往返次数
- 字段数量：单个哈希的字段数量不宜过多（建议小于1000）
- 内存优化：Redis 对小哈希有特殊的内存优化
- 避免大字段：单个字段值不宜过大
- 使用 HSCAN：遍历大哈希时使用 HSCAN 而不是 HGETALL
- 合理设计：根据访问模式设计哈希结构

### 哈希 vs 字符串
存储对象的两种方式对比：
```bash
# 方式1：使用字符串存储JSON
SET user:1001 "{\"name\":\"张三\",\"age\":25,\"city\":\"北京\"}"
# 优点：简单直接
# 缺点：更新单个字段需要序列化/反序列化整个对象

# 方式2：使用哈希存储
HMSET user:1001 name "张三" age 25 city "北京"
# 优点：可以单独操作字段，内存效率高
# 缺点：不能设置单个字段的过期时间
```

## Redis 列表(List)
### 列表类型概述
Redis 列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）。列表最多可存储 2^32 - 1 个元素。

列表结构示意图
![列表结构示意图](img/redis02-1.png)

#### 基本操作命令
列表类型的基础插入和删除操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|LPUSH key element [element ...]	| 从左端（头部）插入元素	|LPUSH mylist "world" "hello"
|RPUSH key element [element ...]	| 从右端（尾部）插入元素	|RPUSH mylist "redis"
|LPOP key	| 从左端（头部）弹出元素	|LPOP mylist
|RPOP key	| 从右端（尾部）弹出元素	|RPOP mylist
|LLEN key	|获取列表长度	|LLEN mylist
|LINDEX key index	|获取指定索引的元素	|LINDEX mylist 0
|LSET key index element	|设置指定索引的元素值	|LSET mylist 0 "new_value"

基本操作示例：
```bash
# 创建列表并添加元素
LPUSH tasks "task3" "task2" "task1"  # 从左端插入
RPUSH tasks "task4" "task5"          # 从右端插入
# 列表内容：["task1", "task2", "task3", "task4", "task5"]

# 获取列表信息
LLEN tasks                           # 返回: 5
LINDEX tasks 0                       # 返回: "task1" (第一个元素)
LINDEX tasks -1                      # 返回: "task5" (最后一个元素)

# 弹出元素
LPOP tasks                           # 返回: "task1"
RPOP tasks                           # 返回: "task5"
# 列表内容：["task2", "task3", "task4"]

# 修改元素
LSET tasks 0 "updated_task2"         # 修改第一个元素
LINDEX tasks 0                       # 返回: "updated_task2"
```
#### 范围操作命令
获取和操作列表中的元素范围：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|LRANGE key start stop	| 获取指定范围的元素	|LRANGE mylist 0 2
|LTRIM key start stop	| 保留指定范围的元素	|LTRIM mylist 0 99
|LINSERT key BEFORE/AFTER pivot element	| 在指定元素前/后插入	|LINSERT mylist BEFORE "world" "beautiful"
|LREM key count element	| 删除指定数量的元素	|LREM mylist 2 "hello"
范围操作示例：
```bash
# 创建测试列表
RPUSH numbers 1 2 3 4 5 6 7 8 9 10

# 获取范围元素
LRANGE numbers 0 4                   # 返回: ["1", "2", "3", "4", "5"]
LRANGE numbers -3 -1                 # 返回: ["8", "9", "10"] (最后3个)
LRANGE numbers 0 -1                  # 返回: 所有元素

# 保留指定范围
LTRIM numbers 0 4                    # 只保留前5个元素
LRANGE numbers 0 -1                  # 返回: ["1", "2", "3", "4", "5"]

# 插入元素
LINSERT numbers AFTER "3" "3.5"      # 在"3"后插入"3.5"
LRANGE numbers 0 -1                  # 返回: ["1", "2", "3", "3.5", "4", "5"]

# 删除元素
RPUSH duplicates "a" "b" "a" "c" "a"
LREM duplicates 2 "a"                # 删除2个"a"
LRANGE duplicates 0 -1               # 返回: ["b", "c", "a"]
```
#### 阻塞操作命令
当列表为空时，阻塞等待新元素的命令：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|BLPOP key [key ...] timeout	| 阻塞式左端弹出	|BLPOP queue1 queue2 30
|BRPOP key [key ...] timeout	| 阻塞式右端弹出	|BRPOP queue1 30
|BRPOPLPUSH source destination timeout	| 阻塞式弹出并推入另一个列表	|BRPOPLPUSH queue1 queue2 30

阻塞操作示例：
```bash
# 消费者等待任务（阻塞30秒）
BLPOP task_queue 30
# 如果task_queue为空，将阻塞等待30秒
# 如果有新任务被推入，立即返回

# 生产者添加任务（在另一个连接中）
LPUSH task_queue "new_task"
# 此时阻塞的BLPOP会立即返回 ["task_queue", "new_task"]

# 多队列监听
BLPOP high_priority_queue normal_queue low_priority_queue 0
# 按优先级顺序检查队列，0表示永久阻塞

# 原子性转移
BRPOPLPUSH processing_queue completed_queue 30
# 从processing_queue右端弹出，推入completed_queue左端
```
#### 列表间操作命令
在不同列表之间移动元素：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|RPOPLPUSH source destination	| 从源列表右端弹出，推入目标列表左端	|RPOPLPUSH list1 list2
列表间操作示例：
```bash
# 任务处理流程
RPUSH todo "task1" "task2" "task3"
RPUSH doing
RPUSH done

# 开始处理任务
RPOPLPUSH todo doing                 # 将任务从todo移到doing
LRANGE doing 0 -1                    # 返回: ["task3"]

# 完成任务
RPOPLPUSH doing done                 # 将任务从doing移到done
LRANGE done 0 -1                     # 返回: ["task3"]

# 查看各阶段任务
LRANGE todo 0 -1                     # 返回: ["task1", "task2"]
LRANGE doing 0 -1                    # 返回: []
LRANGE done 0 -1                     # 返回: ["task3"]
```
### 实际应用场景
#### 消息队列
使用列表实现简单的消息队列系统：
```bash
# 生产者发送消息
LPUSH message_queue "{\"id\": 1, \"type\": \"email\", \"to\": \"user@example.com\"}"
LPUSH message_queue "{\"id\": 2, \"type\": \"sms\", \"to\": \"13800138000\"}"

# 消费者处理消息
BRPOP message_queue 30               # 阻塞等待消息

# 可靠队列（处理中队列）
BRPOPLPUSH message_queue processing_queue 30
# 处理完成后
LREM processing_queue 1 "processed_message"

# 失败重试
RPOPLPUSH processing_queue retry_queue
```
#### 最新动态
存储用户的最新动态或文章列表：
```bash
# 发布新动态
LPUSH user:1001:timeline "{\"id\": 101, \"content\": \"今天天气不错\", \"time\": 1609459200}"
LPUSH user:1001:timeline "{\"id\": 102, \"content\": \"学习Redis\", \"time\": 1609462800}"

# 获取最新10条动态
LRANGE user:1001:timeline 0 9

# 限制动态数量（只保留最新100条）
LTRIM user:1001:timeline 0 99

# 获取特定动态
LINDEX user:1001:timeline 0         # 最新动态
LINDEX user:1001:timeline -1        # 最早动态
```
#### 排行榜
实现简单的排行榜功能：
```bash
# 添加分数记录
LPUSH game:leaderboard "player1:1000"
LPUSH game:leaderboard "player2:1200"
LPUSH game:leaderboard "player3:800"

# 获取排行榜
LRANGE game:leaderboard 0 9          # 前10名

# 更新分数（需要先删除旧记录）
LREM game:leaderboard 1 "player1:1000"
LPUSH game:leaderboard "player1:1500"

# 注意：对于复杂排行榜，建议使用Sorted Set
```
#### 任务调度
实现任务调度和处理流程：
```bash
# 任务提交
LPUSH task:pending "{\"id\": 1, \"type\": \"image_process\", \"file\": \"image1.jpg\"}"
LPUSH task:pending "{\"id\": 2, \"type\": \"video_encode\", \"file\": \"video1.mp4\"}"

# 工作进程获取任务
BRPOPLPUSH task:pending task:processing 30

# 任务完成
RPOPLPUSH task:processing task:completed

# 任务失败
RPOPLPUSH task:processing task:failed

# 重试失败任务
RPOPLPUSH task:failed task:pending

# 监控队列状态
LLEN task:pending                    # 待处理任务数
LLEN task:processing                 # 处理中任务数
LLEN task:completed                  # 已完成任务数
LLEN task:failed                     # 失败任务数
```
### 性能优化建议
- 避免大列表：单个列表元素数量不宜过多（建议小于10万）
- 使用阻塞操作：在队列场景中使用 BLPOP/BRPOP 避免轮询
- 批量操作：使用 LPUSH/RPUSH 的多元素版本减少网络往返
- 合理使用索引：避免频繁使用 LINDEX 访问中间元素
- 定期清理：使用 LTRIM 限制列表大小
- 选择合适的端：根据业务需求选择从左端还是右端操作
### 列表 vs 其他数据类型
数据类型选择建议：
- List vs Set：List允许重复元素且有序，Set不允许重复且无序
- List vs Sorted Set：List按插入顺序排序，Sorted Set按分数排序
- List vs Stream：Stream更适合复杂的消息队列场景
- 使用List的场景：消息队列、最新动态、简单排行榜、任务调度

## Redis 集合(Set)
### 集合类型概述
Redis 集合是字符串的无序集合，集合中的元素是唯一的，不允许重复。集合支持多种集合运算，如交集、并集、差集等。集合最多可以包含 2^32 - 1 个元素。

集合结构示意图:
![集合结构示意图](img/redis02-2.png)

#### 基本操作命令
集合类型的基础增删查操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|SADD key member [member ...]	| 添加元素到集合	|SADD myset "hello" "world"
|SREM key member [member ...]	| 从集合中删除元素	|SREM myset "hello"
|SISMEMBER key member	| 检查元素是否在集合中	|SISMEMBER myset "world"
|SMEMBERS key	| 获取集合所有元素	|SMEMBERS myset
|SCARD key	|获取集合元素数量	|SCARD myset
|SPOP key [count]	|随机弹出元素	|SPOP myset 2
|SRANDMEMBER key [count]	|随机获取元素（不删除）	|SRANDMEMBER myset 3

基本操作示例：
```bash
# 创建集合并添加元素
SADD fruits "apple" "banana" "orange"
SADD fruits "apple"                     # 重复元素不会被添加

# 查看集合信息
SCARD fruits                            # 返回: 3
SMEMBERS fruits                         # 返回: ["apple", "banana", "orange"]

# 检查元素是否存在
SISMEMBER fruits "apple"                # 返回: 1 (存在)
SISMEMBER fruits "grape"                # 返回: 0 (不存在)

# 随机操作
SRANDMEMBER fruits                      # 随机返回一个元素
SRANDMEMBER fruits 2                    # 随机返回2个元素
SPOP fruits                             # 随机弹出一个元素

# 删除元素
SREM fruits "banana"
SMEMBERS fruits                         # 返回: ["apple", "orange"]
```
#### 集合运算命令
Redis 支持多种集合运算操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|SINTER key [key ...]	| 计算集合交集	|SINTER set1 set2
|SINTERSTORE destination key [key ...]	| 计算交集并存储	|SINTERSTORE result set1 set2
|SUNION key [key ...]	| 计算集合并集	|SUNION set1 set2
|SUNIONSTORE destination key [key ...]	| 计算并集并存储	|SUNIONSTORE result set1 set2
|SDIFF key [key ...]	| 计算集合差集	|SDIFF set1 set2
|SDIFFSTORE destination key [key ...]	| 计算差集并存储	|SDIFFSTORE result set1 set2
![集合运算可视化](img/redis02-3.png)


集合运算示例：
```bash
# 创建测试集合
SADD programming_languages "Python" "Java" "JavaScript" "Go"
SADD web_languages "JavaScript" "PHP" "Python" "Ruby"
SADD mobile_languages "Java" "Swift" "Kotlin" "Dart"

# 交集运算
SINTER programming_languages web_languages
# 返回: ["Python", "JavaScript"] (共同的语言)

SINTER programming_languages mobile_languages
# 返回: ["Java"] (编程语言和移动开发语言的交集)

# 并集运算
SUNION programming_languages web_languages
# 返回: ["Python", "Java", "JavaScript", "Go", "PHP", "Ruby"]

# 差集运算
SDIFF programming_languages web_languages
# 返回: ["Java", "Go"] (编程语言中不是Web语言的)

SDIFF web_languages programming_languages
# 返回: ["PHP", "Ruby"] (Web语言中不在编程语言集合的)

# 存储运算结果
SINTERSTORE common_languages programming_languages web_languages
SMEMBERS common_languages
# 返回: ["Python", "JavaScript"]
```
#### 集合遍历命令
安全遍历大集合的命令：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|SSCAN key cursor [MATCH pattern] [COUNT count]	| 迭代集合元素	|SSCAN myset 0 MATCH "user:*"
集合遍历示例：
```bash
# 创建大集合
SADD large_set user:1001 user:1002 user:1003 admin:2001 admin:2002

# 遍历所有元素
SSCAN large_set 0

# 按模式匹配
SSCAN large_set 0 MATCH "user:*"
# 返回: 匹配"user:*"模式的元素

# 限制返回数量
SSCAN large_set 0 COUNT 2
```
#### 集合间移动命令
在不同集合之间移动元素：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
|SMOVE source destination member	| 将元素从源集合移动到目标集合	|SMOVE set1 set2 "element"
集合移动示例：
```bash
# 创建用户状态集合
SADD online_users "user1" "user2" "user3"
SADD offline_users "user4" "user5"

# 用户上线
SMOVE offline_users online_users "user4"
SMEMBERS online_users                   # 返回: ["user1", "user2", "user3", "user4"]
SMEMBERS offline_users                  # 返回: ["user5"]

# 用户下线
SMOVE online_users offline_users "user2"
SMEMBERS online_users                   # 返回: ["user1", "user3", "user4"]
SMEMBERS offline_users                  # 返回: ["user5", "user2"]
```
### 实际应用场景
#### 标签系统
使用集合管理文章、用户的标签：
```bash
# 文章标签
SADD article:1001:tags "Redis" "数据库" "缓存" "NoSQL"
SADD article:1002:tags "Python" "编程" "Web开发"
SADD article:1003:tags "Redis" "Python" "教程"

# 用户兴趣标签
SADD user:1001:interests "Redis" "Python" "机器学习"
SADD user:1002:interests "Java" "Spring" "微服务"

# 查找共同标签
SINTER article:1001:tags user:1001:interests
# 返回: ["Redis", "Python"] (用户感兴趣的文章标签)

# 推荐相关文章（有共同标签的文章）
SINTER article:1001:tags article:1003:tags
# 返回: ["Redis"] (两篇文章的共同标签)

# 获取所有标签
SUNION article:1001:tags article:1002:tags article:1003:tags
# 返回: 所有文章的标签集合
```
#### 好友关系
使用集合管理用户的好友关系：
```bash
# 用户好友列表
SADD user:1001:friends "user1002" "user1003" "user1004" "user1005"
SADD user:1002:friends "user1001" "user1003" "user1006" "user1007"
SADD user:1003:friends "user1001" "user1002" "user1008"

# 查找共同好友
SINTER user:1001:friends user:1002:friends
# 返回: ["user1003"] (共同好友)

# 推荐好友（朋友的朋友，但不是自己的朋友）
SUNION user:1002:friends user:1003:friends  # 朋友的朋友
SDIFF result user:1001:friends              # 排除已有好友
SREM result "user1001"                      # 排除自己

# 检查是否为好友
SISMEMBER user:1001:friends "user1002"     # 返回: 1 (是好友)

# 添加/删除好友
SADD user:1001:friends "user1009"          # 添加好友
SREM user:1001:friends "user1004"          # 删除好友
```
#### 抽奖系统
使用集合实现抽奖和去重功能：
```bash
# 参与抽奖的用户
SADD lottery:2024:participants "user1001" "user1002" "user1003" "user1004" "user1005"

# 随机抽取中奖者
SRANDMEMBER lottery:2024:participants 3    # 随机选择3个中奖者（可重复）
SPOP lottery:2024:participants 3           # 随机弹出3个中奖者（不重复）

# 查看剩余参与者
SCARD lottery:2024:participants            # 剩余参与者数量
SMEMBERS lottery:2024:participants         # 剩余参与者列表

# 防止重复参与
SADD lottery:2024:participants "user1006" # 添加新参与者
SADD lottery:2024:participants "user1001" # 重复参与者不会被添加

# 已中奖用户（防止重复中奖）
SADD lottery:2024:winners "user1001" "user1003"
SDIFF lottery:2024:participants lottery:2024:winners  # 未中奖的参与者
```
#### 搜索过滤
使用集合实现多条件搜索过滤：
```bash
# 商品分类
SADD category:electronics "product1001" "product1002" "product1003"
SADD category:books "product2001" "product2002" "product1003"
SADD category:clothing "product3001" "product3002"

# 商品品牌
SADD brand:apple "product1001" "product1002"
SADD brand:samsung "product1003" "product1004"
SADD brand:nike "product3001" "product3002"

# 价格区间
SADD price:100-500 "product1001" "product2001" "product3001"
SADD price:500-1000 "product1002" "product1003"
SADD price:1000+ "product1004" "product2002"

# 多条件搜索：电子产品 AND 苹果品牌 AND 500-1000价格区间
SINTER category:electronics brand:apple price:500-1000
# 返回: ["product1002"] (满足所有条件的商品)

# 或条件搜索：苹果品牌 OR 三星品牌
SUNION brand:apple brand:samsung
# 返回: 苹果或三星的所有商品
```
#### 数据去重
使用集合进行数据去重处理：
```bash
# 网站访问者去重
SADD daily:visitors:2024-01-15 "192.168.1.1" "192.168.1.2" "192.168.1.1"
SCARD daily:visitors:2024-01-15            # 返回: 2 (去重后的访问者数量)

# 邮件订阅者去重
SADD newsletter:subscribers "user1@example.com" "user2@example.com" "user1@example.com"
SMEMBERS newsletter:subscribers             # 返回: 去重后的邮件列表

# 文章阅读者去重
SADD article:1001:readers "user1001" "user1002" "user1001"
SCARD article:1001:readers                 # 返回: 2 (去重后的阅读者数量)

# 合并多天的访问者
SUNIONSTORE weekly:visitors:2024-w3 \
    daily:visitors:2024-01-15 \
    daily:visitors:2024-01-16 \
    daily:visitors:2024-01-17
SCARD weekly:visitors:2024-w3              # 一周内的唯一访问者数量
```
### 性能优化建议
- 避免大集合：单个集合元素数量不宜过多（建议小于10万）
- 使用 SSCAN：遍历大集合时使用 SSCAN 而不是 SMEMBERS
- 合理使用运算：集合运算的时间复杂度较高，注意性能
- 批量操作：使用 SADD 的多元素版本减少网络往返
- 选择合适场景：需要去重和集合运算时使用 Set
- 内存优化：Redis 对小集合有特殊的内存优化
### 集合 vs 其他数据类型
数据类型选择建议：
- Set vs List：Set不允许重复且无序，List允许重复且有序
- Set vs Hash：Set存储单一值，Hash存储键值对
- Set vs Sorted Set：Set无序，Sorted Set按分数有序
- 使用Set的场景：标签系统、好友关系、去重、抽奖、搜索过滤

## Redis 有序集合(Sorted Set)
### 有序集合类型概述
Redis 有序集合（Sorted Set）是字符串元素的集合，每个元素都关联一个分数（score）。元素按分数排序，分数可以重复，但元素必须唯一。有序集合提供了快速的范围查询和排名功能。
![有序集合示意图](img/redis02-4.png)

#### 基本操作命令
有序集合的基础增删查操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
| ZADD key score member [score member ...]	| 添加元素到有序集合	| ZADD leaderboard 100 "player1" |
| ZREM key member [member ...]	| 从有序集合中删除元素	| ZREM leaderboard "player1" |
| ZSCORE key member	| 获取元素的分数	| ZSCORE leaderboard "player1" |
| ZCARD key	|获取有序集合元素数量	|ZCARD leaderboard
|ZCOUNT key min max	|统计分数区间内的元素数量	|ZCOUNT leaderboard 80 100
|ZINCRBY key increment member	|增加元素的分数	|ZINCRBY leaderboard 10 "player1"
基本操作示例：
```bash
# 创建游戏排行榜
ZADD game:leaderboard 1000 "player1" 1200 "player2" 800 "player3"

# 查看集合信息
ZCARD game:leaderboard                  # 返回: 3 (元素数量)
ZSCORE game:leaderboard "player2"       # 返回: "1200" (player2的分数)

# 更新分数
ZINCRBY game:leaderboard 100 "player1"  # player1分数增加100
ZSCORE game:leaderboard "player1"       # 返回: "1100"

# 统计分数区间
ZCOUNT game:leaderboard 1000 1200       # 返回: 2 (分数在1000-1200之间的玩家数)

# 删除玩家
ZREM game:leaderboard "player3"
ZCARD game:leaderboard                  # 返回: 2
```
#### 范围查询命令
按排名或分数范围查询元素：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
| ZRANGE key start stop [WITHSCORES]	| 按排名范围获取元素（升序）	| ZRANGE leaderboard 0 2 WITHSCORES
| ZREVRANGE key start stop [WITHSCORES]	| 按排名范围获取元素（降序）	| ZREVRANGE leaderboard 0 2 WITHSCORES
| ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]	|按分数范围获取元素（升序）|	ZRANGEBYSCORE leaderboard 80 100
| ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]	|按分数范围获取元素（降序）|	ZREVRANGEBYSCORE leaderboard 100 80
|ZRANK key member	|获取元素排名（升序，从0开始）	|ZRANK leaderboard "player1"
|ZREVRANK key member	|获取元素排名（降序，从0开始）	|ZREVRANK leaderboard "player1"
范围查询示例：
```bash
# 创建学生成绩排行榜
ZADD student:scores 85 "Alice" 92 "Bob" 78 "Charlie" 95 "David" 88 "Eve"

# 按排名查询（升序：分数从低到高）
ZRANGE student:scores 0 2               # 返回: ["Charlie", "Alice", "Eve"]
ZRANGE student:scores 0 2 WITHSCORES    # 返回: ["Charlie", "78", "Alice", "85", "Eve", "88"]

# 按排名查询（降序：分数从高到低）
ZREVRANGE student:scores 0 2            # 返回: ["David", "Bob", "Eve"] (前3名)
ZREVRANGE student:scores 0 2 WITHSCORES # 返回: ["David", "95", "Bob", "92", "Eve", "88"]

# 按分数范围查询
ZRANGEBYSCORE student:scores 80 90       # 返回: ["Alice", "Eve"] (80-90分的学生)
ZRANGEBYSCORE student:scores 90 100 WITHSCORES  # 返回: ["Bob", "92", "David", "95"]

# 获取排名
ZRANK student:scores "Alice"             # 返回: 1 (升序排名，从0开始)
ZREVRANK student:scores "Alice"          # 返回: 3 (降序排名，从0开始)

# 分页查询
ZREVRANGE student:scores 0 1            # 第1页：前2名
ZREVRANGE student:scores 2 3            # 第2页：第3-4名
```
#### 删除操作命令
按排名或分数范围删除元素：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
| ZREMRANGEBYRANK key start stop	| 按排名范围删除元素	| ZREMRANGEBYRANK leaderboard 0 2
| ZREMRANGEBYSCORE key min max	| 按分数范围删除元素	| ZREMRANGEBYSCORE leaderboard 0 60
删除操作示例：
```bash
# 创建测试数据
ZADD test:scores 10 "a" 20 "b" 30 "c" 40 "d" 50 "e" 60 "f"

# 删除最低的3个分数
ZREMRANGEBYRANK test:scores 0 2         # 删除排名0-2的元素（a, b, c）
ZRANGE test:scores 0 -1                 # 返回: ["d", "e", "f"]

# 删除分数低于50的元素
ZREMRANGEBYSCORE test:scores 0 49       # 删除分数0-49的元素
ZRANGE test:scores 0 -1 WITHSCORES      # 返回: ["e", "50", "f", "60"]

# 保留前N名（删除其他）
ZADD ranking 100 "p1" 90 "p2" 80 "p3" 70 "p4" 60 "p5"
ZREMRANGEBYRANK ranking 0 -4            # 保留前3名，删除其他
ZREVRANGE ranking 0 -1                  # 返回: ["p1", "p2", "p3"]
```
#### 集合运算命令
有序集合之间的运算操作：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
| ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]	| 计算并集并存储	| ZUNIONSTORE result 2 set1 set2
| ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]	| 计算交集并存储	| ZINTERSTORE result 2 set1 set2
集合运算示例：
```bash
# 创建两个科目的成绩
ZADD math:scores 85 "Alice" 90 "Bob" 78 "Charlie"
ZADD english:scores 88 "Alice" 82 "Bob" 92 "David"

# 计算总分（并集，分数相加）
ZUNIONSTORE total:scores 2 math:scores english:scores AGGREGATE SUM
ZREVRANGE total:scores 0 -1 WITHSCORES
# 返回: ["Alice", "173", "Bob", "172", "David", "92", "Charlie", "78"]

# 计算两科都有成绩的学生（交集）
ZINTERSTORE both:scores 2 math:scores english:scores AGGREGATE SUM
ZREVRANGE both:scores 0 -1 WITHSCORES
# 返回: ["Alice", "173", "Bob", "172"] (只有Alice和Bob两科都有成绩)

# 使用权重计算加权平均
ZUNIONSTORE weighted:scores 2 math:scores english:scores WEIGHTS 0.6 0.4
ZREVRANGE weighted:scores 0 -1 WITHSCORES
# 数学占60%，英语占40%的加权分数
```
#### 遍历命令
安全遍历大有序集合：

| 命令	| 描述	| 示例 |
| --- | --- | --- |
| ZSCAN key cursor [MATCH pattern] [COUNT count]	| 迭代有序集合元素	| ZSCAN myzset 0 MATCH "user:*"
遍历示例：
```bash
# 创建大有序集合
ZADD large:zset 100 "user:1001" 200 "user:1002" 150 "admin:2001"

# 遍历所有元素
ZSCAN large:zset 0

# 按模式匹配
ZSCAN large:zset 0 MATCH "user:*"
# 返回: 匹配"user:*"模式的元素

# 限制返回数量
ZSCAN large:zset 0 COUNT 2
```
### 实际应用场景
#### 排行榜系统
使用有序集合实现各种排行榜：
```bash
# 游戏积分排行榜
ZADD game:leaderboard 1500 "player001" 1200 "player002" 1800 "player003"
ZADD game:leaderboard 1350 "player004" 1600 "player005"

# 获取前10名
ZREVRANGE game:leaderboard 0 9 WITHSCORES

# 获取某玩家排名
ZREVRANK game:leaderboard "player001"   # 返回: 2 (第3名，从0开始)

# 获取某玩家周围的排名
SET player_rank [ZREVRANK game:leaderboard "player001"]
ZREVRANGE game:leaderboard (player_rank-2) (player_rank+2) WITHSCORES

# 更新玩家分数
ZINCRBY game:leaderboard 100 "player001" # 增加100分

# 月度排行榜重置
DEL game:leaderboard:2024-01
RENAME game:leaderboard game:leaderboard:2024-01

# 分段排行榜
ZRANGEBYSCORE game:leaderboard 1000 1500 WITHSCORES  # 1000-1500分段
```
#### 延时队列
使用时间戳作为分数实现延时任务：
```bash
# 添加延时任务（时间戳作为分数）
ZADD delay:queue 1640995200 "task:send_email:1001"     # 2022-01-01 00:00:00
ZADD delay:queue 1640995800 "task:send_sms:1002"       # 2022-01-01 00:10:00
ZADD delay:queue 1640996400 "task:push_notification:1003" # 2022-01-01 00:20:00

# 获取当前时间戳
SET current_time [date +%s]

# 获取到期的任务
ZRANGEBYSCORE delay:queue 0 $current_time

# 处理到期任务并删除
ZRANGEBYSCORE delay:queue 0 $current_time LIMIT 0 10
# 处理任务...
ZREMRANGEBYSCORE delay:queue 0 $current_time

# 定时任务调度器
while true; do
    current=$(date +%s)
    tasks=$(redis-cli ZRANGEBYSCORE delay:queue 0 $current LIMIT 0 100)
    for task in $tasks; do
        # 处理任务
        echo "Processing: $task"
    done
    redis-cli ZREMRANGEBYSCORE delay:queue 0 $current
    sleep 1
done
```
#### 时间序列数据
使用时间戳存储时间序列数据：
```bash
# 存储用户活跃度数据（时间戳:活跃度分数）
ZADD user:1001:activity 1640995200 85   # 2022-01-01的活跃度
ZADD user:1001:activity 1641081600 92   # 2022-01-02的活跃度
ZADD user:1001:activity 1641168000 78   # 2022-01-03的活跃度

# 获取最近7天的活跃度
SET week_ago [expr [date +%s] - 604800]
ZRANGEBYSCORE user:1001:activity $week_ago +inf WITHSCORES

# 获取某时间段的平均活跃度
ZRANGEBYSCORE user:1001:activity 1640995200 1641168000 WITHSCORES

# 存储股票价格数据
ZADD stock:AAPL:price 1640995200 150.25  # 某时刻的股价
ZADD stock:AAPL:price 1640995260 150.30  # 1分钟后的股价

# 获取某时间段的价格走势
ZRANGEBYSCORE stock:AAPL:price 1640995200 1640999999 WITHSCORES

# 清理过期数据（保留最近30天）
SET month_ago [expr [date +%s] - 2592000]
ZREMRANGEBYSCORE user:1001:activity 0 $month_ago
```
#### 热门内容
基于热度分数的内容排序：
```bash
# 文章热度排行（综合浏览量、点赞数、评论数）
# 热度分数 = 浏览量 * 0.1 + 点赞数 * 2 + 评论数 * 5
ZADD hot:articles 156.5 "article:1001"  # 1000浏览+20点赞+3评论
ZADD hot:articles 234.2 "article:1002"  # 1500浏览+35点赞+8评论
ZADD hot:articles 89.3 "article:1003"   # 800浏览+5点赞+1评论

# 获取热门文章
ZREVRANGE hot:articles 0 9              # 前10热门文章

# 更新文章热度
function update_article_heat(article_id, views, likes, comments) {
    heat_score = views * 0.1 + likes * 2 + comments * 5
    ZADD hot:articles $heat_score $article_id
}

# 时间衰减热度（每小时降低5%）
function decay_heat() {
    articles = ZRANGE hot:articles 0 -1 WITHSCORES
    for article, score in articles {
        new_score = score * 0.95
        ZADD hot:articles $new_score $article
    }
}

# 分类热门内容
ZADD hot:tech:articles 156.5 "article:tech:1001"
ZADD hot:sports:articles 234.2 "article:sports:1002"

# 获取各分类热门
ZREVRANGE hot:tech:articles 0 4         # 科技类前5
ZREVRANGE hot:sports:articles 0 4       # 体育类前5
```
#### 价格区间查询
商品价格范围搜索：
```bash
# 商品价格索引（价格作为分数）
ZADD products:by_price 99.99 "product:1001"    # iPhone手机壳
ZADD products:by_price 1299.00 "product:1002"  # iPad
ZADD products:by_price 199.99 "product:1003"   # AirPods
ZADD products:by_price 2999.00 "product:1004"  # MacBook
ZADD products:by_price 599.99 "product:1005"   # Apple Watch

# 价格区间搜索
ZRANGEBYSCORE products:by_price 100 500        # 100-500元商品
ZRANGEBYSCORE products:by_price 1000 2000      # 1000-2000元商品
ZRANGEBYSCORE products:by_price 0 100          # 100元以下商品

# 分页查询（按价格升序）
ZRANGEBYSCORE products:by_price 0 +inf LIMIT 0 10   # 第1页
ZRANGEBYSCORE products:by_price 0 +inf LIMIT 10 10  # 第2页

# 价格统计
ZCOUNT products:by_price 0 100                 # 100元以下商品数量
ZCOUNT products:by_price 100 500               # 100-500元商品数量
ZCOUNT products:by_price 500 1000              # 500-1000元商品数量

# 获取价格范围
ZRANGE products:by_price 0 0 WITHSCORES        # 最低价
ZREVRANGE products:by_price 0 0 WITHSCORES     # 最高价
```
### 性能优化建议
- 合理使用索引：有序集合内部使用跳跃表和哈希表，查询效率高
- 避免大集合：单个有序集合元素数量不宜过多（建议小于100万）
- 使用 ZSCAN：遍历大有序集合时使用 ZSCAN 而不是 ZRANGE
- 批量操作：使用 ZADD 的多元素版本减少网络往返
- 分数设计：合理设计分数计算规则，避免频繁更新
- 定期清理：使用 ZREMRANGEBYRANK 或 ZREMRANGEBYSCORE 清理过期数据
### 有序集合 vs 其他数据类型
数据类型选择建议：
- Sorted Set vs List：Sorted Set按分数排序且元素唯一，List按插入顺序且允许重复
- Sorted Set vs Set：Sorted Set有序且支持范围查询，Set无序但集合运算更丰富
- Sorted Set vs Hash：Sorted Set存储分数-元素对，Hash存储字段-值对
- 使用Sorted Set的场景：排行榜、延时队列、时间序列、价格区间查询、热门内容

## Redis HyperLogLog
### HyperLogLog 概述
HyperLogLog 是一种概率性数据结构，用于估算集合的基数（不重复元素的数量）。它的最大优势是在输入元素的数量或者体积非常大时，计算基数所需的空间总是固定的、并且是很小的。在 Redis 中，每个 HyperLogLog 键只需要花费 12KB 内存，就可以计算接近 2^64 个不同元素的基数。
![HyperLogLog工作原理](img/redis02-5.png)

- HyperLogLog
  - 12KB
  - 固定内存占用
  - 支持 2^64 个元素
  - 标准误差 0.81%

- 普通 Set
  - ~GB
  - 内存随元素增长
  - 精确计数
  - 无误差

#### 基本命令
HyperLogLog 的核心操作命令：

| 命令	|语法 |描述	|时间复杂度
|:---- |:---- |:---- |:---- |
| PFADD	|PFADD key element [element ...]	|添加元素到 HyperLogLog	|O(1)
| PFCOUNT	|PFCOUNT key [key ...]	|返回基数估算值	|O(1)
| PFMERGE	|PFMERGE destkey sourcekey [sourcekey ...]	|合并多个 HyperLogLog	|O(N)
基本操作示例：
```bash
# 创建 HyperLogLog 并添加元素
PFADD website:uv user1 user2 user3 user4 user5
# 返回：(integer) 1

# 获取基数估算
PFCOUNT website:uv
# 返回：(integer) 5

# 添加更多元素（包括重复元素）
PFADD website:uv user3 user4 user6 user7 user8
# 返回：(integer) 1

# 再次获取基数（重复元素不会增加计数）
PFCOUNT website:uv
# 返回：(integer) 8

# 添加大量元素
for i in {1..10000}; do
    redis-cli PFADD website:uv "user$i"
done

# 查看基数估算
PFCOUNT website:uv
# 返回：约 10000（可能有小幅误差）
```
合并操作示例：
```bash
# 创建多个 HyperLogLog
PFADD page:home user1 user2 user3
PFADD page:about user2 user3 user4
PFADD page:contact user3 user4 user5

# 查看各页面独立访客数
PFCOUNT page:home     # 返回：3
PFCOUNT page:about    # 返回：3
PFCOUNT page:contact  # 返回：3

# 合并所有页面的访客数据
PFMERGE website:total page:home page:about page:contact

# 查看网站总独立访客数
PFCOUNT website:total # 返回：5（去重后的总数）

# 也可以直接计算多个 HyperLogLog 的并集
PFCOUNT page:home page:about page:contact # 返回：5
```
### 应用场景
HyperLogLog 在实际项目中的典型应用：

#### 网站独立访客统计
```bash 
# 每日独立访客统计
PFADD uv:2024-01-15 user123
PFADD uv:2024-01-15 user456
PFADD uv:2024-01-15 user789

# 获取当日独立访客数
PFCOUNT uv:2024-01-15

# 周独立访客统计
PFMERGE uv:week:2024-w3 \
  uv:2024-01-15 \
  uv:2024-01-16 \
  uv:2024-01-17 \
  uv:2024-01-18 \
  uv:2024-01-19 \
  uv:2024-01-20 \
  uv:2024-01-21

PFCOUNT uv:week:2024-w3
```
> 优势：内存占用固定，适合大规模用户统计

#### 商品浏览去重统计
```bash
# 商品浏览用户统计
PFADD product:123:viewers user1001
PFADD product:123:viewers user1002
PFADD product:123:viewers user1003

# 获取商品独立浏览用户数
PFCOUNT product:123:viewers

# 分类商品浏览统计
PFMERGE category:electronics:viewers \
  product:123:viewers \
  product:124:viewers \
  product:125:viewers

# 获取分类独立浏览用户数
PFCOUNT category:electronics:viewers
```
> 优势：快速统计商品热度和用户兴趣

#### APP 活跃用户统计
```bash
# 每日活跃用户统计
PFADD dau:2024-01-15 user_a
PFADD dau:2024-01-15 user_b
PFADD dau:2024-01-15 user_c

# 获取日活跃用户数
PFCOUNT dau:2024-01-15

# 月活跃用户统计
for day in {01..31}; do
    PFMERGE mau:2024-01 dau:2024-01-$day
done

# 获取月活跃用户数
PFCOUNT mau:2024-01
```
> 优势：高效处理大量用户活跃度数据

#### 搜索关键词去重统计
```bash
# 搜索关键词统计
PFADD search:keywords "redis tutorial"
PFADD search:keywords "database optimization"
PFADD search:keywords "cache strategy"

# 获取独立搜索关键词数量
PFCOUNT search:keywords

# 用户搜索行为统计
PFADD user:search:behavior user123
PFADD user:search:behavior user456

# 获取有搜索行为的独立用户数
PFCOUNT user:search:behavior
```
> 优势：分析用户搜索偏好和热门内容

#### IP 地址去重统计
```bash
# IP 访问统计
PFADD ip:access:2024-01-15 "192.168.1.100"
PFADD ip:access:2024-01-15 "10.0.0.50"
PFADD ip:access:2024-01-15 "172.16.0.200"

# 获取独立 IP 访问数
PFCOUNT ip:access:2024-01-15

# 地区 IP 统计
PFADD ip:region:beijing "192.168.1.100"
PFADD ip:region:shanghai "10.0.0.50"

# 获取各地区独立 IP 数
PFCOUNT ip:region:beijing
PFCOUNT ip:region:shanghai
```
> 优势：网络安全分析和地域访问统计

#### 实时数据流去重
```bash
# 实时事件去重统计
PFADD events:click:realtime event_id_1001
PFADD events:click:realtime event_id_1002
PFADD events:click:realtime event_id_1003

# 获取实时独立事件数
PFCOUNT events:click:realtime

# 滑动窗口统计（每分钟）
PFADD events:minute:$(date +%Y%m%d%H%M) event_data

# 获取当前分钟独立事件数
PFCOUNT events:minute:$(date +%Y%m%d%H%M)
```
> 优势：处理高频实时数据流的去重需求

### 性能特性
HyperLogLog 的性能优势和限制：

#### 精度分析
- 标准误差：0.81%（在大数据集上）
- 误差范围：实际值的 ±2% 内（99% 置信度）
- 小数据集：在元素数量较少时误差可能较大
- 大数据集：元素数量越多，相对误差越小


|数据规模	|HyperLogLog 内存	|Set 内存	|内存节省比例	|HyperLogLog 误差
| --- | --- | --- | --- | --- |
| 1万	| 12KB	| ~400KB	| 97%	| ±1-3%
|10万	|12KB|	~4MB	|99.7%	|±0.5-2%
|100万	|12KB	|~40MB	|99.97%|	±0.3-1%
|1000万	|12KB	|~400MB	|99.997%	|±0.2-0.8%
|1亿	|12KB	|~4GB	|99.9997%	|±0.1-0.5%

性能测试示例：
```bash
# 性能测试脚本
#!/bin/bash

# 测试 HyperLogLog 性能
echo "开始 HyperLogLog 性能测试"
start_time=$(date +%s.%N)

# 添加 100万个元素
for i in {1..1000000}; do
    redis-cli PFADD test:hll "element_$i" > /dev/null
done

end_time=$(date +%s.%N)
hll_time=$(echo "$end_time - $start_time" | bc)

# 获取基数估算
hll_count=$(redis-cli PFCOUNT test:hll)

echo "HyperLogLog 结果："
echo "- 添加时间: ${hll_time}s"
echo "- 估算基数: $hll_count"
echo "- 内存使用: $(redis-cli MEMORY USAGE test:hll) bytes"

# 测试普通 Set 性能（小规模测试）
echo "\n开始 Set 性能测试（10万元素）"
start_time=$(date +%s.%N)

# 添加 10万个元素
for i in {1..100000}; do
    redis-cli SADD test:set "element_$i" > /dev/null
done

end_time=$(date +%s.%N)
set_time=$(echo "$end_time - $start_time" | bc)

# 获取精确基数
set_count=$(redis-cli SCARD test:set)

echo "Set 结果："
echo "- 添加时间: ${set_time}s"
echo "- 精确基数: $set_count"
echo "- 内存使用: $(redis-cli MEMORY USAGE test:set) bytes"
```
### 最佳实践
使用 HyperLogLog 的建议和注意事项：

#### 适用场景
- 大规模数据：元素数量超过万级别
- 内存敏感：对内存使用有严格限制
- 近似统计：可以接受小幅误差
- 实时计算：需要快速响应的统计需求
- 分布式统计：需要合并多个数据源
#### 不适用场景
- 精确计数：需要100%准确的计数结果
- 小数据集：元素数量很少（<1000）
- 元素查询：需要判断特定元素是否存在
- 元素遍历：需要获取具体的元素列表
- 排序需求：需要对元素进行排序


#### 实际项目应用模式
```bash
# 1. 分层统计模式
# 小时级统计
PFADD uv:hour:2024011515 user123

# 日级统计（合并24小时数据）
PFMERGE uv:day:20240115 \
  uv:hour:2024011500 uv:hour:2024011501 ... uv:hour:2024011523

# 周级统计（合并7天数据）
PFMERGE uv:week:2024w03 \
  uv:day:20240115 uv:day:20240116 ... uv:day:20240121

# 2. 多维度统计模式
# 按渠道统计
PFADD uv:channel:organic user123
PFADD uv:channel:social user456
PFADD uv:channel:ads user789

# 按设备统计
PFADD uv:device:mobile user123
PFADD uv:device:desktop user456

# 交叉统计
PFMERGE uv:mobile:total uv:channel:organic uv:channel:social

# 3. 实时+历史统计模式
# 实时统计（当前小时）
PFADD uv:realtime:current user123

# 定期归档（每小时执行）
PFMERGE uv:hour:$(date +%Y%m%d%H) uv:realtime:current
DEL uv:realtime:current

# 4. 阈值告警模式
# 检查是否达到阈值
count=$(redis-cli PFCOUNT uv:realtime:current)
if [ $count -gt 10000 ]; then
    echo "实时访客数超过阈值: $count"
    # 发送告警
fi
```
#### 与其他数据结构的配合使用
```bash
# HyperLogLog + String：存储统计元数据
PFADD uv:today user123
INCR uv:today:pv  # 页面浏览量（精确）
SET uv:today:start_time "2024-01-15 00:00:00"

# HyperLogLog + Hash：多维度统计
PFADD uv:page:home user123
HINCRBY stats:page:home pv 1
HSET stats:page:home last_visit "2024-01-15 10:30:00"

# HyperLogLog + Sorted Set：排行榜
PFADD page:123:viewers user456
ZINCRBY page:popularity 1 "page:123"

# HyperLogLog + List：日志记录
PFADD api:users user789
LPUSH api:access:log "user789:2024-01-15 10:30:00"

# 综合查询
echo "页面独立访客: $(redis-cli PFCOUNT uv:page:home)"
echo "页面总浏览量: $(redis-cli HGET stats:page:home pv)"
echo "最后访问时间: $(redis-cli HGET stats:page:home last_visit)"
```
### 总结
- 内存效率：固定12KB内存，支持海量数据统计
- 性能优异：所有操作都是O(1)时间复杂度
- 误差可控：标准误差0.81%，适合大多数业务场景
- 易于合并：支持多个HyperLogLog的并集运算
- 应用广泛：适合UV统计、去重计数等场景
- 限制明确：不支持元素查询和精确计数

