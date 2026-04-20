---
title: "数据架构"
date: 2021-02-26T17:40:39+08:00
draft: false
description: "数据架构：数据库架构、NoSQL数据库、大数据架构。"
tags: ["SA","数据架构"]
categories: ["SA"]
---

## 数据库架构
### 数据库架构概述
数据库架构是系统架构中的重要组成部分，它决定了数据的存储、访问和管理方式。随着业务规模的增长和数据量的激增，传统的单机数据库已经无法满足高并发、大数据量的需求，因此需要采用更加复杂和高效的数据库架构设计。

> 核心概念
> 
> 数据库架构设计需要考虑数据一致性、可用性、分区容错性（CAP定理）、性能、扩展性等多个维度，在不同场景下做出合适的权衡。

- 数据存储
设计合理的数据模型和存储结构，确保数据的完整性和一致性。

- 性能优化
通过索引优化、查询优化、缓存策略等手段提升数据库性能。

- 水平扩展
采用分库分表、读写分离等技术实现数据库的水平扩展。

### 关系型数据库设计
#### 数据库设计原则
关系型数据库设计遵循一系列规范化原则，确保数据的一致性、完整性和可维护性。

- 第一范式（1NF）：
确保每个字段都是原子性的，不可再分
- 第二范式（2NF）：
消除部分函数依赖，确保非主键字段完全依赖于主键
- 第三范式（3NF）：
消除传递函数依赖，减少数据冗余
- BCNF范式：
更严格的第三范式，消除所有非平凡的函数依赖
#### 表结构设计
```sql
-- 用户表设计示例
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1 COMMENT '1:正常 0:禁用',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
```
#### 索引设计策略
- 主键索引：
每个表必须有主键，通常使用自增ID
- 唯一索引：
确保字段值的唯一性，如用户名、邮箱
- 普通索引：
提升查询性能，根据查询频率和选择性创建
- 复合索引：
多字段组合索引，注意字段顺序
- 覆盖索引：
索引包含查询所需的所有字段，避免回表
### 数据库分库分表
当单个数据库无法承载业务增长带来的数据量和并发压力时，需要采用分库分表策略来实现水平扩展。

#### 垂直拆分
垂直拆分是按照业务功能将不同的表拆分到不同的数据库中，每个数据库负责特定的业务模块。

- 用户数据库
存储用户信息、认证数据等用户相关的表。

- 订单数据库
存储订单信息、支付记录等交易相关的表。

- 商品数据库
存储商品信息、库存数据等商品相关的表。

#### 水平拆分
水平拆分是将同一个表的数据按照某种规则分散到多个数据库或表中，每个分片存储部分数据。

##### 分片策略
- 范围分片：
按照数据范围分片，如按时间、ID范围
- 哈希分片：
使用哈希函数计算分片位置，分布均匀
- 目录分片：
维护分片映射表，灵活但增加复杂性
- 一致性哈希：
支持动态扩容，减少数据迁移
```java
// 哈希分片示例
public class HashShardingStrategy {
    private static final int SHARD_COUNT = 8;
    
    public int getShardIndex(Long userId) {
        return Math.abs(userId.hashCode()) % SHARD_COUNT;
    }
    
    public String getTableName(Long userId) {
        int shardIndex = getShardIndex(userId);
        return "user_" + shardIndex;
    }
}
```
### 读写分离
读写分离是一种常见的数据库架构模式，通过将读操作和写操作分离到不同的数据库实例上，提升系统的并发处理能力和查询性能。

#### 架构设计
读写分离架构
- 主库（Master）：
处理所有写操作（INSERT、UPDATE、DELETE）
- 从库（Slave）：
处理所有读操作（SELECT）
- 数据同步：
主库变更通过binlog同步到从库
- 负载均衡：
多个从库之间进行读负载均衡
#### 实现方案
```java
@Component
public class DataSourceRouter {
    
    @Autowired
    private DataSource masterDataSource;
    
    @Autowired
    private List<DataSource> slaveDataSources;
    
    public DataSource getDataSource(boolean isWrite) {
        if (isWrite) {
            return masterDataSource;
        } else {
            // 从库负载均衡
            int index = ThreadLocalRandom.current().nextInt(slaveDataSources.size());
            return slaveDataSources.get(index);
        }
    }
}
```
#### 注意事项
- 数据延迟：
主从同步存在延迟，需要考虑读取到旧数据的情况
- 事务处理：
事务内的读操作应该路由到主库，保证一致性
- 故障切换：
主库故障时需要快速切换到从库
- 监控告警：
监控主从延迟、同步状态等关键指标
### 主从复制
主从复制是MySQL等关系型数据库提供的数据同步机制，通过将主库的变更操作同步到从库，实现数据的高可用和读写分离。

#### 复制原理
- Binlog记录
主库将所有变更操作记录到二进制日志（binlog）中。

- 日志传输
从库的IO线程从主库读取binlog并写入relay log。

- 重放执行
从库的SQL线程读取relay log并重放执行。

#### 配置示例
```conf
# 主库配置 (my.cnf)
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
sync_binlog = 1
innodb_flush_log_at_trx_commit = 1

# 从库配置 (my.cnf)
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
read_only = 1
```
#### 复制模式
- 异步复制：
主库不等待从库确认，性能最好但可能丢失数据
- 半同步复制：
主库等待至少一个从库确认，平衡性能和可靠性
- 同步复制：
主库等待所有从库确认，可靠性最高但性能较差
### 数据库中间件
数据库中间件是位于应用程序和数据库之间的软件层，提供数据路由、负载均衡、读写分离、分库分表等功能，简化复杂数据库架构的管理。

#### 主流中间件
- ShardingSphere: Apache开源的分布式数据库中间件，支持分库分表、读写分离、分布式事务。

- MyCat: 基于阿里开源Cobar的数据库分库分表中间件，支持MySQL协议。

- Vitess: YouTube开源的MySQL集群系统，提供水平扩展和高可用能力。

#### ShardingSphere配置示例
```yaml
# application.yml
spring:
  shardingsphere:
    datasource:
      names: ds0,ds1
      ds0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://localhost:3306/demo_ds_0
        username: root
        password: root
      ds1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://localhost:3306/demo_ds_1
        username: root
        password: root
    rules:
      sharding:
        tables:
          t_order:
            actual-data-nodes: ds$->{0..1}.t_order_$->{0..1}
            table-strategy:
              standard:
                sharding-column: order_id
                sharding-algorithm-name: t_order_inline
            database-strategy:
              standard:
                sharding-column: user_id
                sharding-algorithm-name: database_inline
        sharding-algorithms:
          database_inline:
            type: INLINE
            props:
              algorithm-expression: ds$->{user_id % 2}
          t_order_inline:
            type: INLINE
            props:
              algorithm-expression: t_order_$->{order_id % 2}
```
#### 中间件选择考虑因素
- 功能需求：
是否支持所需的分库分表、读写分离等功能
- 性能表现：
中间件本身的性能开销和延迟
- 运维复杂度：
部署、配置、监控的复杂程度
- 社区活跃度：
开源项目的维护状态和社区支持
- 兼容性：
与现有技术栈的兼容程度
### 数据库架构最佳实践
#### 设计原则
- 渐进式演进：
从简单架构开始，随业务发展逐步演进
- 读写分离优先：
在分库分表之前先考虑读写分离
- 避免跨库事务：
尽量避免分布式事务，通过业务设计规避
- 监控和告警：
建立完善的数据库监控和告警体系
- 备份和恢复：
制定完善的数据备份和灾难恢复策略
#### 性能优化
优化策略
- 索引优化：
合理创建和使用索引，避免过度索引
- 查询优化：
优化SQL语句，避免全表扫描
- 连接池管理：
合理配置数据库连接池参数
- 缓存策略：
使用Redis等缓存减少数据库压力
- 批量操作：
使用批量插入、更新减少网络开销
#### 运维管理
- 容量规划：
根据业务增长预测进行容量规划
- 版本管理：
使用数据库迁移工具管理表结构变更
- 安全管理：
设置合理的用户权限和访问控制
- 性能监控：
监控慢查询、连接数、锁等待等指标
- 故障处理：
建立故障处理流程和应急预案

## NoSQL数据库
### NoSQL分类
NoSQL（Not Only SQL）数据库是为了解决传统关系型数据库在处理大数据、高并发、分布式场景下的局限性而产生的。NoSQL数据库具有高可扩展性、高性能、灵活的数据模型等特点。

> 核心理解
> 
> NoSQL并不是要完全替代SQL数据库，而是在特定场景下提供更好的解决方案。选择合适的数据库类型是架构设计的重要决策。

#### NoSQL数据库分类
- 文档数据库
以文档为存储单位，支持复杂的数据结构，如JSON、BSON等。代表：MongoDB、CouchDB。
- 键值数据库
最简单的NoSQL模型，通过键值对存储数据，性能极高。代表：Redis、DynamoDB。
- 列族数据库
按列存储数据，适合大数据分析和时序数据。代表：Cassandra、HBase。
- 图数据库
专门处理图形数据和复杂关系查询。代表：Neo4j、ArangoDB。
#### NoSQL vs SQL对比
| 特性 | SQL数据库 | NoSQL数据库 |
| --- | --- | --- |
| 数据模型 | 关系型，表结构 | 多样化：文档、键值、列族、图 |
| 扩展性 | 垂直扩展为主 | 水平扩展友好 |
| ACID特性 | 强一致性 | 最终一致性 |
| 查询语言 | 标准SQL | 各自的查询API |
| 适用场景 | 复杂事务、关系查询 | 大数据、高并发、灵活模式 |
### 文档数据库（MongoDB）
MongoDB是最流行的文档数据库，使用BSON（Binary JSON）格式存储数据。它提供了丰富的查询功能、自动分片、副本集等企业级特性。

#### MongoDB核心特性
- 灵活的文档模型：
支持嵌套文档和数组，无需预定义schema
- 强大的查询能力：
支持复杂查询、索引、聚合管道
- 水平扩展：
内置分片功能，支持自动数据分布
- 高可用性：
副本集提供自动故障转移
- ACID事务：
4.0版本开始支持多文档事务
#### MongoDB基本操作
MongoDB查询示例
```javascript
// 插入文档
db.users.insertOne({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
  address: {
    city: "北京",
    district: "朝阳区"
  },
  hobbies: ["读书", "游泳", "编程"]
});

// 查询文档
db.users.find({ age: { $gte: 18 } });

// 更新文档
db.users.updateOne(
  { name: "张三" },
  { $set: { age: 26 }, $push: { hobbies: "旅行" } }
);

// 聚合查询
db.users.aggregate([
  { $match: { age: { $gte: 18 } } },
  { $group: { _id: "$address.city", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```
#### 适用场景
- 内容管理
博客、新闻、产品目录等内容管理系统，数据结构灵活多变。
- 实时分析
用户行为分析、日志分析等需要快速写入和查询的场景。
- 游戏应用
游戏数据存储，如玩家信息、游戏状态等复杂数据结构。
### 键值数据库（Redis）
Redis（Remote Dictionary Server）是一个高性能的键值存储系统，支持多种数据结构，常用作缓存、消息队列和会话存储。

#### Redis数据类型
- 字符串（String）
最基本的数据类型，可以存储文本、数字、二进制数据，最大512MB。
- 列表（List）
有序的字符串列表，支持从两端插入和弹出，适合实现队列和栈。
- 集合（Set）
无序的字符串集合，自动去重，支持集合运算。
- 有序集合（ZSet）
带分数的有序集合，支持范围查询和排行榜功能。
- 哈希（Hash）
键值对的集合，适合存储对象的属性。
#### Redis基本操作
Redis命令示例
```bash
# 字符串操作
SET user:1:name "张三"
GET user:1:name
INCR user:1:visits

# 列表操作
LPUSH tasks "task1" "task2" "task3"
RPOP tasks
LLEN tasks

# 集合操作
SADD tags "redis" "nosql" "database"
SMEMBERS tags
SINTER tags1 tags2

# 哈希操作
HSET user:1 name "张三" age 25 city "北京"
HGET user:1 name
HGETALL user:1

# 有序集合操作
ZADD leaderboard 100 "player1" 200 "player2" 150 "player3"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANK leaderboard "player2"
```
#### Redis应用场景
- 缓存系统：
提高数据访问速度，减少数据库压力
- 会话存储：
分布式系统中的用户会话管理
- 消息队列：
使用List实现简单的消息队列
- 计数器：
网站访问量、点赞数等实时计数
- 排行榜：
游戏排行榜、热门文章排序
- 分布式锁：
在分布式环境中实现互斥锁
### 列族数据库（Cassandra）
Apache Cassandra是一个高度可扩展的分布式列族数据库，设计用于处理大量数据和高并发访问。它提供了线性扩展能力和高可用性。

#### Cassandra核心特性
- 线性扩展
添加节点即可线性提升性能，无单点故障。
- 高可用性
数据自动复制到多个节点，支持跨数据中心部署。
- 高性能写入
优化的写入路径，支持高并发写入操作。
#### Cassandra数据模型
Cassandra使用列族（Column Family）作为数据组织单位，类似于关系数据库的表，但更加灵活。每行可以有不同的列，列按列族分组。

Cassandra CQL示例
```cql
-- 创建键空间
CREATE KEYSPACE ecommerce 
WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

-- 创建表
CREATE TABLE ecommerce.orders (
  user_id UUID,
  order_date timestamp,
  order_id UUID,
  total_amount decimal,
  status text,
  PRIMARY KEY (user_id, order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC);

-- 插入数据
INSERT INTO ecommerce.orders 
(user_id, order_date, order_id, total_amount, status)
VALUES 
(uuid(), '2024-01-15 10:30:00', uuid(), 299.99, 'completed');

-- 查询数据
SELECT * FROM ecommerce.orders 
WHERE user_id = ? AND order_date >= '2024-01-01';
```
#### 适用场景
- 时序数据：
IoT传感器数据、日志数据、监控指标
- 用户活动跟踪：
用户行为日志、点击流数据
- 消息系统：
聊天记录、通知历史
- 金融数据：
交易记录、价格历史
### 图数据库（Neo4j）
Neo4j是领先的图数据库，专门用于存储和查询图形数据。它使用节点、关系和属性来表示和存储数据，特别适合处理复杂的关系查询。

#### 图数据模型
- 节点（Nodes）
表示实体，如人、产品、公司等，可以有标签和属性。
- 关系（Relationships）
连接节点的有向边，表示实体间的关系，也可以有属性。
- 属性（Properties）
节点和关系的键值对数据，存储具体信息。
#### Cypher查询语言
Cypher是Neo4j的声明式查询语言，使用ASCII艺术风格的语法来表示图形模式，直观易懂。

Cypher查询示例
```cypher
// 创建节点
CREATE (alice:Person {name: 'Alice', age: 30})
CREATE (bob:Person {name: 'Bob', age: 25})
CREATE (company:Company {name: 'TechCorp'})

// 创建关系
CREATE (alice)-[:WORKS_FOR {since: 2020}]->(company)
CREATE (bob)-[:WORKS_FOR {since: 2021}]->(company)
CREATE (alice)-[:KNOWS {since: 2019}]->(bob)

// 查询朋友的朋友
MATCH (person:Person)-[:KNOWS]->(friend)-[:KNOWS]->(friendOfFriend)
WHERE person.name = 'Alice'
RETURN friendOfFriend.name

// 查找最短路径
MATCH path = shortestPath(
  (start:Person {name: 'Alice'})-[*]-(end:Person {name: 'Charlie'})
)
RETURN path

// 推荐算法：找到共同朋友最多的人
MATCH (person:Person {name: 'Alice'})-[:KNOWS]->(friend)-[:KNOWS]->(recommendation)
WHERE NOT (person)-[:KNOWS]->(recommendation)
RETURN recommendation.name, count(friend) as mutualFriends
ORDER BY mutualFriends DESC
LIMIT 5
```
#### Neo4j应用场景
- 社交网络
用户关系、好友推荐、社区发现、影响力分析。
- 推荐系统
基于关系的商品推荐、协同过滤、个性化推荐。
- 欺诈检测
识别可疑的交易模式、关联分析、风险评估。
- 知识图谱
构建企业知识库、语义搜索、智能问答。
### NoSQL数据库选择指南
选择合适的NoSQL数据库需要考虑数据模型、性能要求、扩展性需求、一致性要求等多个因素。

#### 选择原则
- 数据结构：
根据数据的复杂度和关系选择合适的数据模型
- 查询模式：
考虑主要的查询类型和频率
- 扩展需求：
评估未来的数据量和并发量增长
- 一致性要求：
权衡一致性和可用性的需求
- 团队技能：
考虑团队的技术栈和学习成本
#### 决策矩阵
|场景	|推荐数据库	|原因
|---------|---------|---------
|内容管理系统	|MongoDB	|灵活的文档结构，丰富的查询功能
|缓存层	|Redis	|极高的读写性能，丰富的数据类型
|时序数据	|Cassandra	|优秀的写入性能，时间序列优化
|社交网络	|Neo4j	|天然的图形数据模型，关系查询优化
|实时分析	|MongoDB + Redis	|组合使用，发挥各自优势

## 大数据架构
### 大数据处理流程
大数据处理是一个复杂的端到端流程，涉及数据的采集、存储、处理、分析和可视化等多个环节。每个环节都有其特定的技术挑战和解决方案。

#### 大数据的4V特征
- Volume（体量）：数据量巨大，从TB到PB级别
- Velocity（速度）：数据产生和处理速度快
- Variety（多样性）：数据类型多样，结构化、半结构化、非结构化
- Veracity（真实性）：数据质量和可信度的挑战

#### 典型处理流程
```text
数据采集 → 数据存储 → 数据处理 → 数据分析 → 数据可视化

每个阶段都需要选择合适的技术栈和架构模式
```
- 数据采集
从各种数据源收集数据，包括日志文件、数据库、API、传感器等。
- 数据存储
将采集的数据存储在分布式存储系统中，确保数据的可靠性和可扩展性。
- 数据处理
对存储的数据进行清洗、转换、聚合等处理操作。
- 数据分析
运用统计学、机器学习等方法从数据中提取有价值的信息。
### 数据采集
数据采集是大数据处理的第一步，需要从多种异构数据源中高效、可靠地收集数据。采集系统需要处理不同的数据格式、传输协议和数据量级。

#### 采集方式分类
- 实时采集
  - 流式数据采集
  - 事件驱动采集
  - 消息队列采集
  - API实时拉取
- 批量采集
  - 定时任务采集
  - 数据库同步
  - 文件批量导入
  - ETL工具采集
#### 常用采集工具
- Apache Flume：
分布式日志采集系统，支持多种数据源
- Apache Kafka：
高吞吐量的分布式消息系统
- Logstash：
数据收集引擎，支持多种输入输出
- Filebeat：
轻量级日志采集器
- Sqoop：
Hadoop和关系数据库之间的数据传输工具
#### 采集挑战
- 数据一致性：
确保数据在采集过程中不丢失、不重复
- 性能优化：
处理高并发、大流量的数据采集
- 容错处理：
应对网络故障、系统异常等情况
- 数据格式：
处理多种数据格式和编码方式
### 数据存储
大数据存储需要解决海量数据的存储、管理和访问问题。不同类型的数据和应用场景需要选择不同的存储方案。

#### 存储类型
- 分布式文件系统
  - HDFS（Hadoop分布式文件系统）
  - Amazon S3
  - Google Cloud Storage
  - Azure Blob Storage
- NoSQL数据库
  - HBase（列式存储）
  - MongoDB（文档存储）
  - Cassandra（宽列存储）
  - Redis（键值存储）
- 数据仓库
  - Apache Hive
  - Amazon Redshift
  - Google BigQuery
  - Snowflake
#### 存储策略
分层存储
- 热数据：
频繁访问的数据，存储在高性能存储中
- 温数据：
偶尔访问的数据，存储在标准存储中
- 冷数据：
很少访问的数据，存储在低成本存储中
- 归档数据：
长期保存的数据，存储在归档存储中
### 数据处理
数据处理是大数据架构的核心环节，包括数据清洗、转换、聚合、计算等操作。根据处理时效性可分为批处理和流处理两种模式。

#### 处理模式
- 批处理
  - 特点：处理大量历史数据，延迟较高但吞量高
  - Apache Hadoop MapReduce
  - Apache Spark
  - Apache Flink（批处理模式）
- 流处理
  - 特点：实时处理数据流，延迟低但处理复杂度- - Apache Storm
  - Apache Flink
  - Apache Kafka Streams
  - Apache Spark Streaming
#### 处理框架对比
- Hadoop MapReduce：
成熟稳定的批处理框架，适合大规模数据处理
- Apache Spark：
内存计算框架，支持批处理和流处理，性能优异
- Apache Flink：
低延迟流处理框架，支持事件时间处理
- Apache Storm：
实时流处理框架，保证数据处理的可靠性
### 数据分析
数据分析是从大数据中提取价值的关键步骤，包括描述性分析、预测性分析和处方性分析等不同层次。

#### 分析类型
- 描述性分析：回答"发生了什么"的问题
  - 数据统计和汇总
  - 趋势分析
  - 报表生成
- 预测性分析： 回答"将会发生什么"的问题
  - 机器学习模型
  - 时间序列预测
  - 风险评估
- 处方性分析： 回答"应该做什么"的问题
  - 优化算法
  - 决策支持
  - 自动化决策
#### 分析工具和平台
- Apache Spark MLlib：分布式机器学习库
- TensorFlow：深度学习框架
- Apache Mahout：可扩展的机器学习库
- R/Python：数据科学编程语言
- Jupyter Notebook：交互式数据分析环境
### Lambda架构
Lambda架构是一种大数据处理架构，通过批处理和流处理两条路径来处理数据，旨在同时满足低延迟和高吞吐量的需求。
```text
Lambda架构 = 批处理层 + 流处理层 + 服务层
```
#### 架构组成
- 批处理层（Batch Layer）
  - 处理全量历史数据
  - 生成批视图（Batch Views）
  - 保证数据的准确性和完整性
  - 通常使用Hadoop、Spark等
- 流处理层（Speed Layer）
  - 处理实时数据流
  - 生成实时视图（Real-time Views）
  - 提供低延迟的数据处理
  - 通常使用Storm、Flink等
- 服务层（Serving Layer）
  - 合并批视图和实时视图
  - 响应用户查询请求
  - 提供统一的数据访问接口
  - 通常使用HBase、Cassandra等
#### Lambda架构优势
- 容错性：
批处理层可以修正流处理层的错误
- 可扩展性：
批处理和流处理可以独立扩展
- 灵活性：
支持复杂的数据处理逻辑
- 数据完整性：
批处理保证数据的最终一致性
#### Lambda架构挑战
- 复杂性：
需要维护两套处理逻辑
- 一致性：
批视图和实时视图的数据一致性
- 运维成本：
需要管理多个系统组件
- 开发成本：
需要实现和维护两套代码
#### Kappa架构
Kappa架构是Lambda架构的简化版本，只使用流处理来处理所有数据，通过重新处理历史数据来实现批处理的效果。
```text
Kappa架构 = 流处理层 + 服务层

所有数据都通过流处理引擎处理
```
#### 核心思想
> 设计理念
> 
> 将所有数据视为事件流，使用统一的流处理引擎来处理实时数据和历史数据，通过重新处理（Reprocessing）来实现数据的修正和更新。

#### 架构特点
- 统一处理
  - 只有一套处理逻辑
  - 实时和批处理使用相同代码
  - 简化系统架构
- 重新处理
  - 支持历史数据重新计算
  - 可以修正处理逻辑错误
  - 保证数据的最终一致性
- 数据存储
  - 使用日志系统存储原始数据
  - 支持数据回放和重新处理
  - 保证数据的持久性
#### Kappa vs Lambda
- 简化性：
Kappa架构更简单，只需维护一套处理逻辑
- 一致性：
避免了批处理和流处理结果不一致的问题
- 实时性：
所有处理都是实时的，没有批处理的延迟
- 适用场景：
适合对实时性要求高、数据量相对较小的场景
#### 技术选型
- 流处理引擎：
Apache Kafka Streams、Apache Flink
- 消息系统：
Apache Kafka（支持数据回放）
- 存储系统：
支持流式读写的存储系统
- 监控系统：
实时监控处理状态和性能