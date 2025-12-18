---
title: "Redis 持久化与集群"
date: 2021-02-16T12:00:00+08:00
draft: false
description: "Redis 持久化与集群：持久化、主从复制、哨兵模式、集群等。"
tags: ["Redis", "中间件"]
categories: ["Middleware"]
---

## Redis 持久化
### 持久化概述
Redis 是内存数据库，数据存储在内存中，服务器重启后数据会丢失。为了保证数据安全，Redis 提供了多种持久化机制，将内存中的数据保存到磁盘上。

![redis持久化](img/redis04-1.png)

### 持久化方式
#### RDB 快照持久化
RDB（Redis Database）是 Redis 默认的持久化方式，它将某个时间点的数据集快照保存到磁盘上。

内存数据 → fork子进程 → 生成RDB文件 → 替换旧文件

特点：二进制格式、文件小、恢复快

RDB 配置参数
|配置项|说明|示例|
|----|----|----|
|save|自动保存条件|save 900 1 (900秒内至少1个key变化)|
|dbfilename|RDB文件名|dbfilename dump.rdb|
|dir|文件保存目录|dir /var/lib/redis|
|rdbcompression|是否压缩|rdbcompression yes|
|rdbchecksum|是否校验|rdbchecksum yes|

RDB 配置示例
```bash
# redis.conf 配置
# 自动保存策略
save 900 1      # 900秒内至少1个key发生变化
save 300 10     # 300秒内至少10个key发生变化
save 60 10000   # 60秒内至少10000个key发生变化

# RDB文件配置
dbfilename dump.rdb
dir /var/lib/redis/
rdbcompression yes
rdbchecksum yes

# 当RDB保存失败时停止写入
stop-writes-on-bgsave-error yes
```
手动触发 RDB
```bash
# 阻塞式保存（会阻塞Redis服务）
SAVE

# 非阻塞式保存（推荐）
BGSAVE

# 查看最后一次保存时间
LASTSAVE

# 获取RDB保存状态
INFO persistence
```
#### AOF 日志持久化
AOF（Append Only File）记录每个写操作命令，通过重新执行这些命令来恢复数据。

写命令 → 追加到AOF缓冲区 → 同步到AOF文件 → 定期重写

特点：记录操作日志、数据完整性高、文件较大

AOF 配置参数
|配置项|说明|示例|
|----|----|----|
|appendonly|启用AOF|appendonly yes|
|appendfilename|AOF文件名|appendfilename "appendonly.aof"|
|appendfsync|同步策略|appendfsync everysec|
|auto-aof-rewrite-percentage|重写触发百分比|auto-aof-rewrite-percentage 100|
|auto-aof-rewrite-min-size|重写最小文件大小|auto-aof-rewrite-min-size 64mb|

AOF 同步策略
|策略|说明|性能|安全性|
|----|----|----|----|
|always|每个写命令都同步|慢|最高|
|everysec|每秒同步一次（推荐）|快|高|
|no|由操作系统决定|最快|低|

AOF 配置示例
```bash
# redis.conf 配置
# 启用AOF
appendonly yes
appendfilename "appendonly.aof"

# 同步策略（推荐everysec）
appendfsync everysec

# AOF重写配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 重写期间是否同步
no-appendfsync-on-rewrite no

# AOF文件损坏时的处理
aof-load-truncated yes
```
AOF 重写
```bash
# 手动触发AOF重写
BGREWRITEAOF

# 查看AOF重写状态
INFO persistence

# AOF重写示例
# 原始AOF文件可能包含：
SET key1 "value1"
SET key1 "value2"
SET key1 "value3"
DEL key2
SET key2 "new_value"

# 重写后的AOF文件：
SET key1 "value3"
SET key2 "new_value"
```
#### 混合持久化
Redis 4.0 引入的混合持久化，结合了 RDB 和 AOF 的优点。

混合持久化配置
```bash
# 启用混合持久化
aof-use-rdb-preamble yes

# 混合持久化文件结构：
# [RDB格式的数据] + [AOF格式的增量数据]

# 优点：
# 1. 文件更小（RDB格式压缩率高）
# 2. 恢复更快（RDB格式加载快）
# 3. 数据更完整（AOF记录增量）
```

### 持久化方式对比
|特性|RDB|AOF|混合持久化|
|----|----|----|----|
|文件大小|小|大|中等|
|恢复速度|快|慢|快|
|数据完整性|可能丢失|完整|完整|
|性能影响|小|大|小|
|可读性|二进制|文本|混合|

### 持久化最佳实践
生产环境建议
- 同时启用 RDB 和 AOF：RDB 用于备份，AOF 用于数据恢复
- AOF 使用 everysec：平衡性能和数据安全
- 定期备份 RDB 文件：复制到其他服务器或云存储
- 监控磁盘空间：确保有足够空间存储持久化文件
- 测试恢复流程：定期验证数据恢复的正确性

注意事项
- 磁盘性能：持久化会增加磁盘I/O，使用SSD提升性能
- 内存使用：RDB fork 子进程会临时占用额外内存
- 文件权限：确保 Redis 进程有读写持久化文件的权限
- 网络传输：主从复制时需要传输 RDB 文件
### 持久化配置示例
完整的生产环境配置
```bash
# redis.conf 生产环境持久化配置

# RDB 配置
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir /var/lib/redis/
rdbcompression yes
rdbchecksum yes
stop-writes-on-bgsave-error yes

# AOF 配置
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
no-appendfsync-on-rewrite no
aof-load-truncated yes

# 混合持久化
aof-use-rdb-preamble yes

# 内存优化
maxmemory-policy allkeys-lru
maxmemory 2gb
```
持久化监控脚本
```bash
#!/bin/bash
# Redis 持久化监控脚本

REDIS_CLI="redis-cli"
LOG_FILE="/var/log/redis-persistence.log"

# 检查RDB状态
rdb_status=$(${REDIS_CLI} LASTSAVE)
echo "$(date): Last RDB save: ${rdb_status}" >> ${LOG_FILE}

# 检查AOF状态
aof_info=$(${REDIS_CLI} INFO persistence | grep aof)
echo "$(date): AOF info: ${aof_info}" >> ${LOG_FILE}

# 检查文件大小
rdb_size=$(du -h /var/lib/redis/dump.rdb 2>/dev/null | cut -f1)
aof_size=$(du -h /var/lib/redis/appendonly.aof 2>/dev/null | cut -f1)
echo "$(date): RDB size: ${rdb_size}, AOF size: ${aof_size}" >> ${LOG_FILE}

# 检查磁盘空间
disk_usage=$(df -h /var/lib/redis | tail -1 | awk '{print $5}')
echo "$(date): Disk usage: ${disk_usage}" >> ${LOG_FILE}
```
数据恢复流程
```bash
# 1. 停止Redis服务
sudo systemctl stop redis

# 2. 备份当前数据文件
cp /var/lib/redis/dump.rdb /var/lib/redis/dump.rdb.backup
cp /var/lib/redis/appendonly.aof /var/lib/redis/appendonly.aof.backup

# 3. 恢复数据文件
# 从备份恢复RDB文件
cp /backup/dump.rdb /var/lib/redis/dump.rdb
# 或从备份恢复AOF文件
cp /backup/appendonly.aof /var/lib/redis/appendonly.aof

# 4. 设置正确的文件权限
chown redis:redis /var/lib/redis/dump.rdb
chown redis:redis /var/lib/redis/appendonly.aof
chmod 660 /var/lib/redis/dump.rdb
chmod 660 /var/lib/redis/appendonly.aof

# 5. 启动Redis服务
sudo systemctl start redis

# 6. 验证数据恢复
redis-cli INFO keyspace
redis-cli DBSIZE
```
### 性能优化建议
RDB 优化
- 调整保存频率：根据业务需求平衡数据安全和性能
- 使用 BGSAVE：避免使用阻塞式的 SAVE 命令
- 监控内存使用：fork 时需要额外内存，确保系统内存充足
- SSD 存储：使用 SSD 提升 I/O 性能
- 
AOF 优化
- 选择合适的同步策略：推荐使用 everysec
- 定期重写：避免 AOF 文件过大影响性能
- 重写期间配置：合理设置 no-appendfsync-on-rewrite
- 文件系统优化：使用支持快速写入的文件系统

混合持久化优化
- 启用混合模式：获得更好的性能和数据安全平衡
- 监控文件大小：定期检查持久化文件大小
- 备份策略：制定完整的备份和恢复策略

## Redis 主从复制
### 主从复制概述
Redis 主从复制是一种数据冗余和读写分离的解决方案。通过将数据从主服务器（Master）复制到一个或多个从服务器（Slave），实现数据备份、读写分离和负载均衡。

![主从复制架构](img/redis04-2.png)

特点：一主多从、异步复制、读写分离

### 复制配置
配置 Redis 主从复制的方法：

主服务器配置
```bash
# redis-master.conf
# 绑定IP地址
bind 0.0.0.0
port 6379

# 设置密码（可选）
requirepass masterpassword

# 持久化配置
save 900 1
save 300 10
save 60 10000
appendonly yes

# 复制相关配置
# 设置复制积压缓冲区大小
repl-backlog-size 1mb
# 设置复制积压缓冲区TTL
repl-backlog-ttl 3600

# 慢查询日志
slowlog-log-slower-than 10000
slowlog-max-len 128
```
从服务器配置
```bash
# redis-slave.conf
# 绑定IP地址
bind 0.0.0.0
port 6380

# 指定主服务器
slaveof 192.168.1.100 6379
# 或使用新的配置项
replicaof 192.168.1.100 6379

# 主服务器密码
masterauth masterpassword

# 从服务器只读
slave-read-only yes
# 或使用新的配置项
replica-read-only yes

# 从服务器密码（可选）
requirepass slavepassword

# 复制相关配置
# 复制超时时间
repl-timeout 60
# 禁用TCP_NODELAY
repl-disable-tcp-nodelay no

# 当主从连接断开时的行为
slave-serve-stale-data yes
replica-serve-stale-data yes
```
动态配置复制
```bash
# 在从服务器上执行
# 设置主服务器
SLAVEOF 192.168.1.100 6379
# 或使用新命令
REPLICAOF 192.168.1.100 6379

# 取消复制（变为独立服务器）
SLAVEOF NO ONE
REPLICAOF NO ONE

# 查看复制信息
INFO replication

# 查看主从延迟
INFO replication | grep lag
```
### 复制原理
Redis 主从复制的工作流程：

1. 连接:
从服务器连接主服务器
2. 握手:
发送PING命令验证连接
3. 认证:
发送AUTH命令认证
4. 同步:
全量同步或增量同步
5. 复制:
持续接收命令流

#### 全量同步（Full Resynchronization）
```bash
# 全量同步流程
1. 从服务器发送 PSYNC ? -1 命令
2. 主服务器执行 BGSAVE 生成 RDB 文件
3. 主服务器将 RDB 文件发送给从服务器
4. 从服务器清空数据库并载入 RDB 文件
5. 主服务器将复制积压缓冲区的命令发送给从服务器

# 触发全量同步的情况：
- 首次连接
- 复制ID不匹配
- 偏移量不在积压缓冲区范围内
```
#### 增量同步（Partial Resynchronization）
```bash
# 增量同步流程
1. 从服务器发送 PSYNC   命令
2. 主服务器检查复制ID和偏移量
3. 如果偏移量在积压缓冲区范围内，发送 +CONTINUE
4. 主服务器发送积压缓冲区中的命令

# 增量同步的优势：
- 减少网络传输
- 降低主服务器负载
- 缩短同步时间
```
### 复制监控
监控主从复制状态的重要指标

|监控指标	|命令	|说明
|:----------|:------|:------ |
|复制状态	|INFO replication	|查看主从复制详细信息
|复制延迟	|INFO replication ｜ grep lag	|查看主从延迟时间
|连接状态	|INFO replication ｜ grep state	| 查看连接状态
|复制偏移量	|INFO replication ｜ grep offset	|查看复制进度
|从服务器数量	|INFO replication ｜ grep slaves	|查看从服务器数量


复制状态监控示例
```bash
# 主服务器信息
redis-cli INFO replication
# role:master
# connected_slaves:2
# slave0:ip=192.168.1.101,port=6379,state=online,offset=1234567,lag=0
# slave1:ip=192.168.1.102,port=6379,state=online,offset=1234567,lag=1
# master_repl_offset:1234567
# repl_backlog_active:1
# repl_backlog_size:1048576

# 从服务器信息
redis-cli -p 6380 INFO replication
# role:slave
# master_host:192.168.1.100
# master_port:6379
# master_link_status:up
# master_last_io_seconds_ago:0
# master_sync_in_progress:0
# slave_repl_offset:1234567
# slave_priority:100
# slave_read_only:1
```
复制监控脚本
```bash
#!/bin/bash
# Redis 主从复制监控脚本

MASTER_HOST="192.168.1.100"
MASTER_PORT="6379"
SLAVE_HOSTS=("192.168.1.101" "192.168.1.102")
SLAVE_PORT="6379"
LOG_FILE="/var/log/redis-replication.log"

# 检查主服务器状态
master_info=$(redis-cli -h $MASTER_HOST -p $MASTER_PORT INFO replication)
connected_slaves=$(echo "$master_info" | grep "connected_slaves" | cut -d: -f2)
echo "$(date): Master connected slaves: $connected_slaves" >> $LOG_FILE

# 检查从服务器状态
for slave_host in "${SLAVE_HOSTS[@]}"; do
    slave_info=$(redis-cli -h $slave_host -p $SLAVE_PORT INFO replication)
    link_status=$(echo "$slave_info" | grep "master_link_status" | cut -d: -f2)
    lag=$(echo "$slave_info" | grep "master_last_io_seconds_ago" | cut -d: -f2)
    
    echo "$(date): Slave $slave_host - Link: $link_status, Lag: ${lag}s" >> $LOG_FILE
    
    # 告警检查
    if [ "$link_status" != "up" ]; then
        echo "ALERT: Slave $slave_host is disconnected!" >> $LOG_FILE
    fi
    
    if [ "$lag" -gt 10 ]; then
        echo "ALERT: Slave $slave_host lag is too high: ${lag}s" >> $LOG_FILE
    fi
done
```
### 读写分离
利用主从复制实现读写分离，提升系统性能

应用层读写分离

Python 示例
```python
import redis

class RedisCluster:
    def __init__(self):
        # 主服务器（写操作）
        self.master = redis.Redis(
            host='192.168.1.100',
            port=6379,
            password='masterpassword',
            decode_responses=True
        )
        
        # 从服务器（读操作）
        self.slaves = [
            redis.Redis(
                host='192.168.1.101',
                port=6379,
                password='slavepassword',
                decode_responses=True
            ),
            redis.Redis(
                host='192.168.1.102',
                port=6379,
                password='slavepassword',
                decode_responses=True
            )
        ]
        self.slave_index = 0
    
    def write(self, key, value):
        """写操作，使用主服务器"""
        return self.master.set(key, value)
    
    def read(self, key):
        """读操作，使用从服务器（负载均衡）"""
        slave = self.slaves[self.slave_index]
        self.slave_index = (self.slave_index + 1) % len(self.slaves)
        return slave.get(key)
    
    def read_with_fallback(self, key):
        """读操作，带故障转移"""
        for slave in self.slaves:
            try:
                return slave.get(key)
            except redis.ConnectionError:
                continue
        # 所有从服务器都不可用，使用主服务器
        return self.master.get(key)

# 使用示例
cluster = RedisCluster()
cluster.write('user:1001', 'Alice')  # 写入主服务器
value = cluster.read('user:1001')    # 从从服务器读取
```
Java 示例（使用 Jedis）
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

public class RedisCluster {
    private JedisPool masterPool;
    private JedisPool[] slavePools;
    private int slaveIndex = 0;
    
    public RedisCluster() {
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(100);
        config.setMaxIdle(20);
        
        // 主服务器连接池
        masterPool = new JedisPool(config, "192.168.1.100", 6379, 2000, "masterpassword");
        
        // 从服务器连接池
        slavePools = new JedisPool[]{
            new JedisPool(config, "192.168.1.101", 6379, 2000, "slavepassword"),
            new JedisPool(config, "192.168.1.102", 6379, 2000, "slavepassword")
        };
    }
    
    public String write(String key, String value) {
        try (Jedis jedis = masterPool.getResource()) {
            return jedis.set(key, value);
        }
    }
    
    public String read(String key) {
        JedisPool slavePool = slavePools[slaveIndex];
        slaveIndex = (slaveIndex + 1) % slavePools.length;
        
        try (Jedis jedis = slavePool.getResource()) {
            return jedis.get(key);
        } catch (Exception e) {
            // 从服务器异常，使用主服务器
            try (Jedis jedis = masterPool.getResource()) {
                return jedis.get(key);
            }
        }
    }
}
```
### 主从复制优缺点
|方面	|优点	|缺点
|--|--|--|
|可用性	|数据备份，故障转移	|主服务器单点故障
|性能	|读写分离，负载分担	|复制延迟
|扩展性	|水平扩展读能力	|写能力无法扩展
|一致性	|最终一致性	|可能读到旧数据
|复杂性	|配置简单	|需要应用层支持
### 故障处理
主从复制环境中的故障处理策略

#### 主服务器故障处理
- 检测故障：监控主服务器状态
- 选择新主：从从服务器中选择一个作为新主
- 提升为主：执行 SLAVEOF NO ONE
- 重新配置：其他从服务器指向新主
- 应用切换：修改应用配置指向新主

故障转移脚本
```bash
#!/bin/bash
# Redis 主服务器故障转移脚本

MASTER_HOST="192.168.1.100"
MASTER_PORT="6379"
NEW_MASTER_HOST="192.168.1.101"
NEW_MASTER_PORT="6379"
SLAVE_HOSTS=("192.168.1.102")

# 检查主服务器状态
if ! redis-cli -h $MASTER_HOST -p $MASTER_PORT ping > /dev/null 2>&1; then
    echo "Master server is down, starting failover..."
    
    # 提升从服务器为主服务器
    redis-cli -h $NEW_MASTER_HOST -p $NEW_MASTER_PORT SLAVEOF NO ONE
    echo "Promoted $NEW_MASTER_HOST to master"
    
    # 重新配置其他从服务器
    for slave_host in "${SLAVE_HOSTS[@]}"; do
        redis-cli -h $slave_host -p $MASTER_PORT SLAVEOF $NEW_MASTER_HOST $NEW_MASTER_PORT
        echo "Reconfigured $slave_host to follow new master"
    done
    
    echo "Failover completed"
else
    echo "Master server is healthy"
fi
```
从服务器故障处理
- 自动检测：应用层检测从服务器连接状态
- 流量切换：将读请求转发到其他从服务器
- 故障恢复：修复从服务器后自动重新加入
- 数据同步：从服务器重启后自动同步数据

网络分区处理
```bash
# 配置最小从服务器数量
# 当连接的从服务器少于指定数量时，主服务器停止写入
min-slaves-to-write 1
min-slaves-max-lag 10

# 这样可以避免网络分区时的数据不一致问题
```
### 性能优化
主从复制的性能优化建议

网络优化

- 禁用 TCP_NODELAY：设置 repl-disable-tcp-nodelay no
- 调整缓冲区：增大 repl-backlog-size
- 网络带宽：确保主从之间有足够的网络带宽
- 就近部署：主从服务器部署在同一数据中心

内存优化
- 复制积压缓冲区：根据网络延迟调整大小
- 输出缓冲区：调整 client-output-buffer-limit
- 内存策略：合理设置 maxmemory-policy

磁盘优化
- RDB 优化：调整 RDB 生成频率
- AOF 优化：选择合适的 AOF 同步策略
- SSD 存储：使用 SSD 提升 I/O 性能

性能优化配置
```bash
# 主服务器优化配置
# 复制积压缓冲区（根据网络延迟调整）
repl-backlog-size 10mb
repl-backlog-ttl 3600

# 输出缓冲区限制
client-output-buffer-limit slave 256mb 64mb 60

# 禁用慢查询对复制的影响
repl-disable-tcp-nodelay no

# 从服务器优化配置
# 复制超时时间
repl-timeout 60

# 当主从连接断开时继续提供服务
slave-serve-stale-data yes

# 从服务器优先级（用于故障转移）
slave-priority 100
```
### 最佳实践
- 监控复制延迟：设置告警阈值，及时发现问题
- 定期备份：除了复制，还要定期备份 RDB 文件
- 读写分离：在应用层实现读写分离逻辑
- 故障转移：准备自动化的故障转移方案
- 容量规划：根据业务增长预估从服务器数量
- 安全配置：设置密码，限制网络访问

## Redis 哨兵模式
### 哨兵模式概述
Redis Sentinel 是 Redis 的高可用性解决方案，它提供了监控、通知、自动故障转移和配置提供者等功能。当主服务器出现故障时，Sentinel 能够自动将某个从服务器升级为新的主服务器，并让其他从服务器改为复制新的主服务器。

![哨兵模式架构](img/redis04-3.png)

### 哨兵配置
配置 Redis Sentinel 的详细步骤

主服务器配置 (redis-master.conf)
```bash
# 基本配置
port 6379
bind 0.0.0.0

# 设置密码
requirepass mypassword

# 持久化配置
save 900 1
save 300 10
save 60 10000
appendonly yes

# 复制配置
repl-backlog-size 1mb
repl-backlog-ttl 3600

# 日志配置
logfile "/var/log/redis/redis-master.log"
loglevel notice
```
从服务器配置 (redis-slave.conf)
```bash
# 基本配置
port 6379
bind 0.0.0.0

# 指定主服务器
replicaof 192.168.1.100 6379
masterauth mypassword

# 从服务器密码
requirepass mypassword

# 只读模式
replica-read-only yes

# 持久化配置
appendonly yes

# 日志配置
logfile "/var/log/redis/redis-slave.log"
loglevel notice
```
Sentinel 配置

哨兵配置文件 (sentinel.conf)
```bash
# 哨兵端口
port 26379

# 绑定地址
bind 0.0.0.0

# 监控主服务器
# sentinel monitor    
sentinel monitor mymaster 192.168.1.100 6379 2

# 主服务器密码
sentinel auth-pass mymaster mypassword

# 故障转移超时时间（毫秒）
sentinel down-after-milliseconds mymaster 30000

# 故障转移期间允许的并行同步从服务器数量
sentinel parallel-syncs mymaster 1

# 故障转移超时时间
sentinel failover-timeout mymaster 180000

# 通知脚本（可选）
# sentinel notification-script mymaster /var/redis/notify.sh

# 客户端重新配置脚本（可选）
# sentinel client-reconfig-script mymaster /var/redis/reconfig.sh

# 日志配置
logfile "/var/log/redis/sentinel.log"
loglevel notice

# 工作目录
dir /var/lib/redis

# 拒绝危险命令
sentinel deny-scripts-reconfig yes
```
启动服务
```bash
# 启动 Redis 主服务器
redis-server /etc/redis/redis-master.conf

# 启动 Redis 从服务器
redis-server /etc/redis/redis-slave1.conf
redis-server /etc/redis/redis-slave2.conf

# 启动 Sentinel（至少3个节点）
redis-sentinel /etc/redis/sentinel1.conf
redis-sentinel /etc/redis/sentinel2.conf
redis-sentinel /etc/redis/sentinel3.conf

# 或者使用 redis-server 启动
redis-server /etc/redis/sentinel1.conf --sentinel
redis-server /etc/redis/sentinel2.conf --sentinel
redis-server /etc/redis/sentinel3.conf --sentinel
```
### 哨兵监控
监控哨兵系统的状态和健康度

|监控命令	|描述	|示例
|-|-|-|
|SENTINEL masters	|显示所有被监控的主服务器	|redis-cli -p 26379 SENTINEL masters
|SENTINEL slaves <master-name>	|显示指定主服务器的从服务器	|SENTINEL slaves mymaster
|SENTINEL sentinels <master-name>	|显示监控指定主服务器的哨兵	|SENTINEL sentinels mymaster
|SENTINEL get-master-addr-by-name <master-name>	|获取主服务器地址	|SENTINEL get-master-addr-by-name mymaster
|SENTINEL failover <master-name>	|手动触发故障转移	|SENTINEL failover mymaster
|SENTINEL reset <pattern>	|重置哨兵状态	|SENTINEL reset mymaster

监控脚本示例：
```bash
#!/bin/bash
# Redis Sentinel 监控脚本

SENTINEL_HOST="127.0.0.1"
SENTINEL_PORT="26379"
MASTER_NAME="mymaster"
LOG_FILE="/var/log/redis-sentinel-monitor.log"

# 检查哨兵状态
sentinel_info=$(redis-cli -h $SENTINEL_HOST -p $SENTINEL_PORT INFO sentinel)
echo "$(date): Sentinel info: $sentinel_info" >> $LOG_FILE

# 获取主服务器信息
master_info=$(redis-cli -h $SENTINEL_HOST -p $SENTINEL_PORT SENTINEL masters)
echo "$(date): Master info: $master_info" >> $LOG_FILE

# 获取当前主服务器地址
master_addr=$(redis-cli -h $SENTINEL_HOST -p $SENTINEL_PORT SENTINEL get-master-addr-by-name $MASTER_NAME)
echo "$(date): Current master: $master_addr" >> $LOG_FILE

# 检查从服务器状态
slaves_info=$(redis-cli -h $SENTINEL_HOST -p $SENTINEL_PORT SENTINEL slaves $MASTER_NAME)
echo "$(date): Slaves info: $slaves_info" >> $LOG_FILE

# 检查哨兵节点
sentinels_info=$(redis-cli -h $SENTINEL_HOST -p $SENTINEL_PORT SENTINEL sentinels $MASTER_NAME)
echo "$(date): Sentinels info: $sentinels_info" >> $LOG_FILE
```
### 故障转移流程
Sentinel 自动故障转移的详细流程

1. 故障检测:主观下线检测
2. 客观下线:多数哨兵确认
3. 选举领导:选择领导哨兵
4. 选择新主:从从服务器中选择
5. 故障转移:执行主从切换
6. 通知客户端:更新配置信息

故障检测机制
```bash
# 主观下线（Subjectively Down, SDOWN）
# 单个哨兵认为主服务器已下线
# 条件：在指定时间内没有收到有效回复

# 客观下线（Objectively Down, ODOWN）
# 多个哨兵都认为主服务器已下线
# 条件：达到 quorum 数量的哨兵确认主服务器下线

# 配置示例
sentinel down-after-milliseconds mymaster 30000  # 30秒无响应判定为主观下线
sentinel monitor mymaster 192.168.1.100 6379 2   # 需要2个哨兵确认客观下线
```
新主服务器选择规则

选择优先级

- 排除故障节点：排除已下线、断线的从服务器
- 优先级排序：按 replica-priority 值排序（值越小优先级越高）
- 复制偏移量：选择复制偏移量最大的（数据最新）
- 运行ID：如果前面都相同，选择运行ID最小的

故障转移配置
```bash
# 从服务器优先级配置
replica-priority 100  # 值越小优先级越高，0表示永不提升为主服务器

# 故障转移超时配置
sentinel failover-timeout mymaster 180000  # 3分钟

# 并行同步数量
sentinel parallel-syncs mymaster 1  # 故障转移时同时同步的从服务器数量
```
### 客户端连接
应用程序如何连接到 Sentinel 管理的 Redis 集群

Java 客户端示例（Jedis）
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisSentinelPool;

import java.util.HashSet;
import java.util.Set;

public class SentinelExample {
    public static void main(String[] args) {
        // 配置哨兵节点
        Set sentinels = new HashSet<>();
        sentinels.add("192.168.1.101:26379");
        sentinels.add("192.168.1.102:26379");
        sentinels.add("192.168.1.103:26379");
        
        // 创建哨兵连接池
        JedisSentinelPool sentinelPool = new JedisSentinelPool(
            "mymaster",     // 主服务器名称
            sentinels,      // 哨兵节点集合
            "mypassword"    // Redis密码
        );
        
        // 使用连接
        try (Jedis jedis = sentinelPool.getResource()) {
            jedis.set("key1", "value1");
            String value = jedis.get("key1");
            System.out.println("Value: " + value);
        }
        
        // 关闭连接池
        sentinelPool.close();
    }
}
```
Python 客户端示例（redis-py）
```python
import redis.sentinel

# 配置哨兵
sentinel_list = [
    ('192.168.1.101', 26379),
    ('192.168.1.102', 26379),
    ('192.168.1.103', 26379)
]

# 创建哨兵对象
sentinel = redis.sentinel.Sentinel(
    sentinel_list,
    socket_timeout=0.1
)

# 获取主服务器连接
master = sentinel.master_for(
    'mymaster',
    socket_timeout=0.1,
    password='mypassword',
    decode_responses=True
)

# 获取从服务器连接（只读）
slave = sentinel.slave_for(
    'mymaster',
    socket_timeout=0.1,
    password='mypassword',
    decode_responses=True
)

# 使用连接
master.set('key1', 'value1')
value = slave.get('key1')
print(f'Value: {value}')
```
Spring Boot 配置
```yaml
# application.yml
spring:
  redis:
    password: mypassword
    timeout: 2000ms
    sentinel:
      master: mymaster
      nodes:
        - 192.168.1.101:26379
        - 192.168.1.102:26379
        - 192.168.1.103:26379
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
```
### 哨兵模式优缺点
|方面	|优点	|缺点
| -- | -- | --
|高可用性	|自动故障转移，无需人工干预	|故障转移有短暂中断
|监控能力	|实时监控，及时发现问题	|需要额外的哨兵节点
|配置管理	|自动更新客户端配置	|配置相对复杂
|扩展性	|支持读写分离	|写能力仍受限于单主节点
|一致性	|保证数据一致性	|可能有短暂的数据丢失

### 故障排查

常见问题
- 脑裂问题
  - 现象：网络分区导致出现多个主服务器
  - 解决：配置 min-slaves-to-write 和 min-slaves-max-lag
```bash
# 防止脑裂配置
min-slaves-to-write 1
min-slaves-max-lag 10
```
- 哨兵无法达成一致
  - 现象：哨兵节点数量不足或网络问题
  - 解决：确保至少3个哨兵节点，且网络连通
- 故障转移失败
  - 现象：主服务器下线但未触发故障转移
  - 排查：检查 quorum 配置、哨兵日志、网络连接

故障排查脚本
```bash
#!/bin/bash
# Redis Sentinel 故障排查脚本

SENTINEL_HOSTS=("192.168.1.101" "192.168.1.102" "192.168.1.103")
SENTINEL_PORT="26379"
MASTER_NAME="mymaster"

echo "=== Redis Sentinel 健康检查 ==="

# 检查哨兵节点状态
for host in "${SENTINEL_HOSTS[@]}"; do
    echo "检查哨兵节点: $host:$SENTINEL_PORT"
    
    # 检查连接
    if redis-cli -h $host -p $SENTINEL_PORT ping > /dev/null 2>&1; then
        echo "✓ 连接正常"
        
        # 检查主服务器信息
        master_addr=$(redis-cli -h $host -p $SENTINEL_PORT SENTINEL get-master-addr-by-name $MASTER_NAME 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "✓ 主服务器地址: $master_addr"
        else
            echo "✗ 无法获取主服务器地址"
        fi
        
        # 检查哨兵数量
        sentinel_count=$(redis-cli -h $host -p $SENTINEL_PORT SENTINEL sentinels $MASTER_NAME | grep -c "name")
        echo "✓ 哨兵节点数量: $((sentinel_count + 1))"
        
    else
        echo "✗ 连接失败"
    fi
    echo "---"
done

# 检查主服务器状态
echo "检查主服务器状态:"
master_info=$(redis-cli -h ${SENTINEL_HOSTS[0]} -p $SENTINEL_PORT SENTINEL get-master-addr-by-name $MASTER_NAME 2>/dev/null)
if [ $? -eq 0 ]; then
    master_host=$(echo $master_info | cut -d' ' -f1)
    master_port=$(echo $master_info | cut -d' ' -f2)
    
    if redis-cli -h $master_host -p $master_port ping > /dev/null 2>&1; then
        echo "✓ 主服务器 $master_host:$master_port 正常"
    else
        echo "✗ 主服务器 $master_host:$master_port 异常"
    fi
else
    echo "✗ 无法获取主服务器信息"
fi
```
### 最佳实践
- 奇数个哨兵：部署奇数个哨兵节点（推荐3个或5个）
- 分布式部署：哨兵节点分布在不同的物理机器上
- 合理配置超时：根据网络环境调整超时参数
- 监控告警：监控哨兵状态，设置告警机制
- 定期演练：定期进行故障转移演练
- 日志分析：定期分析哨兵和Redis日志
- 网络优化：确保哨兵之间网络稳定

## Redis 集群模式
### 集群模式概述
Redis Cluster 是 Redis 的分布式实现，它将数据分片存储在多个节点上，提供了水平扩展能力和高可用性。集群模式通过一致性哈希算法将数据分布到不同的节点，每个节点负责一部分数据槽（slot），同时支持主从复制和自动故障转移。

![Redis 集群模式](img/redis04-4.png)

### 集群配置
配置 Redis 集群的详细步骤

节点配置文件
redis-7001.conf（主节点配置）
```bash
# 基本配置
port 7001
bind 0.0.0.0

# 启用集群模式
cluster-enabled yes
cluster-config-file nodes-7001.conf
cluster-node-timeout 15000

# 集群要求至少3个主节点
cluster-require-full-coverage no

# 密码配置
requirepass mypassword
masterauth mypassword

# 持久化配置
appendonly yes
appendfilename "appendonly-7001.aof"

# 日志配置
logfile "/var/log/redis/redis-7001.log"
loglevel notice

# 工作目录
dir /var/lib/redis/7001

# 内存配置
maxmemory 1gb
maxmemory-policy allkeys-lru

# 网络配置
tcp-keepalive 300
timeout 0
```
创建集群配置脚本
```bash
#!/bin/bash
# 创建Redis集群配置脚本

# 创建目录
mkdir -p /var/lib/redis/{7001,7002,7003,7004,7005,7006}
mkdir -p /var/log/redis

# 端口列表
ports=(7001 7002 7003 7004 7005 7006)

# 生成配置文件
for port in "${ports[@]}"; do
    cat > /etc/redis/redis-${port}.conf << EOF
port ${port}
bind 0.0.0.0
cluster-enabled yes
cluster-config-file nodes-${port}.conf
cluster-node-timeout 15000
cluster-require-full-coverage no
requirepass mypassword
masterauth mypassword
appendonly yes
appendfilename "appendonly-${port}.aof"
logfile "/var/log/redis/redis-${port}.log"
loglevel notice
dir /var/lib/redis/${port}
maxmemory 1gb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 0
EOF
done

echo "配置文件生成完成"
```
启动集群节点
```bash
# 启动所有节点
redis-server /etc/redis/redis-7001.conf
redis-server /etc/redis/redis-7002.conf
redis-server /etc/redis/redis-7003.conf
redis-server /etc/redis/redis-7004.conf
redis-server /etc/redis/redis-7005.conf
redis-server /etc/redis/redis-7006.conf

# 或者使用循环启动
for port in {7001..7006}; do
    redis-server /etc/redis/redis-${port}.conf &
done
```
创建集群
```bash
# 使用 redis-cli 创建集群
redis-cli --cluster create \
  192.168.1.101:7001 \
  192.168.1.102:7002 \
  192.168.1.103:7003 \
  192.168.1.104:7004 \
  192.168.1.105:7005 \
  192.168.1.106:7006 \
  --cluster-replicas 1 \
  -a mypassword

# 参数说明：
# --cluster-replicas 1: 每个主节点有1个从节点
# -a mypassword: 集群密码
```
### 数据分片机制
Redis 集群使用哈希槽（Hash Slot）进行数据分片：

1. 键名----user:1001
2. CRC16----计算哈希值
3. 取模-----% 16384
4. 槽位-----Slot 8765
5. 节点-----Master 2

#### 哈希槽特点
- 总槽数：16384个槽位（0-16383）
- 分片算法：CRC16(key) % 16384
- 槽位分配：每个主节点负责一部分槽位
- 数据迁移：通过槽位迁移实现扩容缩容

哈希标签（Hash Tag）
```bash
# 使用哈希标签确保相关键在同一节点
SET user:{1001}:profile "John Doe"
SET user:{1001}:settings "theme:dark"
SET user:{1001}:posts "post1,post2,post3"

# 所有 user:{1001}:* 的键都会在同一个节点
# 因为哈希计算只使用 {1001} 部分
```
|节点	|槽位范围	|槽位数量	|数据比例
|Master 1	|0 - 5460	|5461	|33.3%
|Master 2	|5461 - 10922	|5462	|33.3%
|Master 3	|10923 - 16383	|5461	|33.4%

### 集群管理命令
Redis 集群的管理和维护命令

集群信息查看
```bash
# 查看集群信息
CLUSTER INFO

# 查看集群节点
CLUSTER NODES

# 查看槽位分配
CLUSTER SLOTS

# 查看特定键的槽位
CLUSTER KEYSLOT user:1001
```
节点管理
```bash
# 添加节点
CLUSTER MEET 192.168.1.107 7007

# 删除节点
CLUSTER FORGET node-id

# 设置从节点
CLUSTER REPLICATE master-node-id

# 故障转移
CLUSTER FAILOVER
```
槽位管理
```bash
# 分配槽位
CLUSTER ADDSLOTS 0 1 2 3 4

# 删除槽位
CLUSTER DELSLOTS 0 1 2 3 4

# 迁移槽位
CLUSTER SETSLOT 100 MIGRATING target-node-id
CLUSTER SETSLOT 100 IMPORTING source-node-id
```
数据迁移
```bash
# 获取槽位中的键
CLUSTER GETKEYSINSLOT 100 10

# 迁移键
MIGRATE 192.168.1.107 7007 key 0 5000

# 批量迁移
MIGRATE 192.168.1.107 7007 "" 0 5000 KEYS key1 key2 key3
```
集群管理脚本
```bash
#!/bin/bash
# Redis 集群管理脚本

CLUSTER_NODES=("192.168.1.101:7001" "192.168.1.102:7002" "192.168.1.103:7003")
PASSWORD="mypassword"

# 检查集群状态
check_cluster_status() {
    echo "=== 集群状态检查 ==="
    for node in "${CLUSTER_NODES[@]}"; do
        echo "检查节点: $node"
        redis-cli -h ${node%:*} -p ${node#*:} -a $PASSWORD CLUSTER INFO | grep cluster_state
    done
}

# 查看节点信息
show_cluster_nodes() {
    echo "=== 集群节点信息 ==="
    redis-cli -h ${CLUSTER_NODES[0]%:*} -p ${CLUSTER_NODES[0]#*:} -a $PASSWORD CLUSTER NODES
}

# 查看槽位分配
show_slot_allocation() {
    echo "=== 槽位分配信息 ==="
    redis-cli -h ${CLUSTER_NODES[0]%:*} -p ${CLUSTER_NODES[0]#*:} -a $PASSWORD CLUSTER SLOTS
}

# 添加新节点
add_node() {
    local new_node=$1
    local existing_node=${CLUSTER_NODES[0]}
    
    echo "添加节点 $new_node 到集群"
    redis-cli --cluster add-node $new_node $existing_node -a $PASSWORD
}

# 重新分片
reshard_cluster() {
    local existing_node=${CLUSTER_NODES[0]}
    
    echo "开始重新分片"
    redis-cli --cluster reshard $existing_node -a $PASSWORD
}

# 执行函数
case $1 in
    "status")
        check_cluster_status
        ;;
    "nodes")
        show_cluster_nodes
        ;;
    "slots")
        show_slot_allocation
        ;;
    "add")
        add_node $2
        ;;
    "reshard")
        reshard_cluster
        ;;
    *)
        echo "用法: $0 {status|nodes|slots|add |reshard}"
        ;;
esac
```
### 客户端连接
应用程序如何连接到 Redis 集群

Java 客户端示例（Jedis）
```java
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;
import redis.clients.jedis.JedisPoolConfig;

import java.util.HashSet;
import java.util.Set;

public class ClusterExample {
    public static void main(String[] args) {
        // 配置集群节点
        Set clusterNodes = new HashSet<>();
        clusterNodes.add(new HostAndPort("192.168.1.101", 7001));
        clusterNodes.add(new HostAndPort("192.168.1.102", 7002));
        clusterNodes.add(new HostAndPort("192.168.1.103", 7003));
        
        // 连接池配置
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(100);
        poolConfig.setMaxIdle(10);
        poolConfig.setMinIdle(5);
        
        // 创建集群连接
        JedisCluster jedisCluster = new JedisCluster(
            clusterNodes,
            2000,           // 连接超时
            2000,           // 读取超时
            5,              // 最大重定向次数
            "mypassword",   // 密码
            poolConfig
        );
        
        try {
            // 使用集群
            jedisCluster.set("user:1001", "John Doe");
            String value = jedisCluster.get("user:1001");
            System.out.println("Value: " + value);
            
            // 使用哈希标签
            jedisCluster.set("user:{1001}:profile", "profile data");
            jedisCluster.set("user:{1001}:settings", "settings data");
            
        } finally {
            jedisCluster.close();
        }
    }
}
```
Python 客户端示例（redis-py-cluster）
```python
from rediscluster import RedisCluster

# 配置集群节点
startup_nodes = [
    {"host": "192.168.1.101", "port": "7001"},
    {"host": "192.168.1.102", "port": "7002"},
    {"host": "192.168.1.103", "port": "7003"}
]

# 创建集群连接
rc = RedisCluster(
    startup_nodes=startup_nodes,
    password='mypassword',
    decode_responses=True,
    skip_full_coverage_check=True
)

# 使用集群
rc.set('user:1001', 'John Doe')
value = rc.get('user:1001')
print(f'Value: {value}')

# 使用哈希标签
rc.set('user:{1001}:profile', 'profile data')
rc.set('user:{1001}:settings', 'settings data')

# 批量操作（需要在同一槽位）
pipe = rc.pipeline()
pipe.set('user:{1001}:name', 'John')
pipe.set('user:{1001}:age', '30')
pipe.execute()
```

Spring Boot 配置
```yaml
# application.yml
spring:
  redis:
    password: mypassword
    timeout: 2000ms
    cluster:
      nodes:
        - 192.168.1.101:7001
        - 192.168.1.102:7002
        - 192.168.1.103:7003
        - 192.168.1.104:7004
        - 192.168.1.105:7005
        - 192.168.1.106:7006
      max-redirects: 3
    lettuce:
      pool:
        max-active: 100
        max-idle: 10
        min-idle: 5
```
### 集群扩容缩容
动态调整集群规模的操作流程

集群扩容
```bash
# 1. 启动新节点
redis-server /etc/redis/redis-7007.conf
redis-server /etc/redis/redis-7008.conf

# 2. 添加主节点
redis-cli --cluster add-node 192.168.1.107:7007 192.168.1.101:7001 -a mypassword

# 3. 重新分片（分配槽位给新节点）
redis-cli --cluster reshard 192.168.1.101:7001 -a mypassword
# 按提示输入：
# - 要移动的槽位数量
# - 目标节点ID（新节点）
# - 源节点ID（all 表示从所有节点平均分配）

# 4. 添加从节点
redis-cli --cluster add-node 192.168.1.108:7008 192.168.1.101:7001 --cluster-slave --cluster-master-id  -a mypassword
```
集群缩容
```bash
# 1. 迁移槽位（将要删除节点的槽位迁移到其他节点）
redis-cli --cluster reshard 192.168.1.101:7001 -a mypassword
# 将所有槽位从目标节点迁移出去

# 2. 删除从节点
redis-cli --cluster del-node 192.168.1.108:7008  -a mypassword

# 3. 删除主节点（确保没有槽位）
redis-cli --cluster del-node 192.168.1.107:7007  -a mypassword

# 4. 停止节点服务
redis-cli -h 192.168.1.107 -p 7007 -a mypassword SHUTDOWN
redis-cli -h 192.168.1.108 -p 7008 -a mypassword SHUTDOWN
```

扩容缩容注意事项

- 数据迁移：槽位迁移过程中会有短暂的性能影响
- 客户端重定向：客户端需要支持 MOVED 和 ASK 重定向
- 操作顺序：严格按照先迁移槽位再删除节点的顺序
- 监控告警：扩容缩容期间加强监控

### 集群模式优缺点
|方面	|优点	|缺点
|----------|----------|----------
|扩展性	|水平扩展，支持动态扩容	|扩容过程复杂，有性能影响
|高可用性	|自动故障转移，无单点故障	|需要至少3个主节点
|性能	|读写分离，并行处理	|跨槽操作性能较差
|数据分布	|自动分片，负载均衡	|数据倾斜可能性
|运维复杂度	|自动化程度高	|配置和维护复杂

### 故障排查
常见问题
- 集群状态异常
  - 现象：cluster_state:fail
  - 排查：检查节点连通性、槽位分配、节点数量
```bash
# 检查集群状态
redis-cli -c -h 192.168.1.101 -p 7001 -a mypassword CLUSTER INFO

# 检查节点状态
redis-cli -c -h 192.168.1.101 -p 7001 -a mypassword CLUSTER NODES
```
- 槽位未完全分配
  - 现象：部分槽位没有分配给任何节点
  - 解决：手动分配缺失的槽位
```bash
# 检查槽位分配
redis-cli --cluster check 192.168.1.101:7001 -a mypassword

# 修复槽位分配
redis-cli --cluster fix 192.168.1.101:7001 -a mypassword
```
- 数据迁移失败
  - 现象：槽位迁移过程中断或失败
  - 解决：重置槽位状态，重新迁移
```bash
# 重置槽位状态
CLUSTER SETSLOT  STABLE

# 重新分配槽位
redis-cli --cluster reshard 192.168.1.101:7001 -a mypassword
```
集群健康检查脚本
```bash
#!/bin/bash
# Redis 集群健康检查脚本

CLUSTER_NODES=("192.168.1.101:7001" "192.168.1.102:7002" "192.168.1.103:7003")
PASSWORD="mypassword"

echo "=== Redis 集群健康检查 ==="

# 检查集群整体状态
echo "1. 检查集群状态"
for node in "${CLUSTER_NODES[@]}"; do
    host=${node%:*}
    port=${node#*:}
    
    state=$(redis-cli -h $host -p $port -a $PASSWORD CLUSTER INFO 2>/dev/null | grep cluster_state | cut -d: -f2 | tr -d '\r')
    if [ "$state" = "ok" ]; then
        echo "✓ $node: 状态正常"
    else
        echo "✗ $node: 状态异常 ($state)"
    fi
done

# 检查槽位分配
echo "\n2. 检查槽位分配"
host=${CLUSTER_NODES[0]%:*}
port=${CLUSTER_NODES[0]#*:}

slots_info=$(redis-cli -h $host -p $port -a $PASSWORD CLUSTER SLOTS 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ 槽位分配正常"
else
    echo "✗ 槽位分配异常"
fi

# 检查节点连通性
echo "\n3. 检查节点连通性"
for node in "${CLUSTER_NODES[@]}"; do
    host=${node%:*}
    port=${node#*:}
    
    if redis-cli -h $host -p $port -a $PASSWORD ping > /dev/null 2>&1; then
        echo "✓ $node: 连接正常"
    else
        echo "✗ $node: 连接失败"
    fi
done

# 检查主从关系
echo "\n4. 检查主从关系"
nodes_info=$(redis-cli -h $host -p $port -a $PASSWORD CLUSTER NODES 2>/dev/null)
master_count=$(echo "$nodes_info" | grep -c "master")
slave_count=$(echo "$nodes_info" | grep -c "slave")

echo "主节点数量: $master_count"
echo "从节点数量: $slave_count"

if [ $master_count -ge 3 ]; then
    echo "✓ 主节点数量充足"
else
    echo "✗ 主节点数量不足"
fi

echo "\n=== 检查完成 ==="
```

### 最佳实践
- 节点规划：至少3个主节点，每个主节点配置1个从节点
- 硬件配置：节点分布在不同的物理机器上
- 网络优化：确保节点间网络延迟低且稳定
- 监控告警：监控集群状态、槽位分配、节点健康度
- 数据设计：合理使用哈希标签，避免热点数据
- 客户端配置：客户端支持集群模式和重定向
- 备份策略：定期备份集群数据
- 扩容规划：提前规划扩容策略和时机


