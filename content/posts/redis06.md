---
title: "Redis Java集成"
date: 2021-02-17T12:00:00+08:00
draft: false
description: "Redis Java集成：Java集成Redis、Redisson客户端、Spring Boot集成Redis等。"
tags: ["Redis", "中间件"]
categories: ["Middleware"]
---

## Java 使用 Redis
### Java Redis 客户端概述
Java 生态系统中有多个优秀的 Redis 客户端库，每个都有其特点和适用场景。选择合适的客户端对于项目的性能和开发效率至关重要。

#### Jedis
Redis 官方推荐的 Java 客户端，简单易用，API 直观。

|优点|缺点|
| -- | -- |
|API 简单直观|线程不安全|
|官方支持|功能相对简单|
|文档完善|需要连接池管理|
|社区活跃|

#### Lettuce
基于 Netty 的异步 Redis 客户端，支持响应式编程。

|优点|缺点|
| -- | -- |
|线程安全|学习曲线较陡|
|支持异步操作|配置复杂|
|响应式编程|依赖较多|
|连接复用|体积较大|

#### Redisson
功能丰富的 Redis Java 客户端，提供分布式对象和服务。

|优点|缺点|
| -- | -- |
|功能丰富|体积较大
|分布式锁|复杂度高
|集合操作|性能开销大
|高级特性|



### 环境准备

#### Maven 依赖
```yaml
redis.clients 
jedis 4.4.3 io.lettuce 
lettuce-core 6.2.6.RELEASE 
org.redisson 
redisson 3.23.4 org.apache.commons 
commons-pool2 2.11.1
```
#### Jedis 使用详解
##### 基础使用
基础连接和操作
```java
import redis.clients.jedis.Jedis; 
import redis.clients.jedis.JedisPool; 
import redis.clients.jedis.JedisPoolConfig; 
public class JedisExample { 
    public static void main(String[] args) { 
        // 创建 Jedis 连接 
        Jedis jedis = new Jedis("localhost", 6379); 
        try { 
            // 测试连接 
            String pong = jedis.ping(); System.out.println("连接测试: " + pong); 
            // 字符串操作 
            jedis.set("name", "张三"); 
            String name = jedis.get("name"); 
            System.out.println("姓名: " + name); 
            // 设置过期时间 
            jedis.setex("session:123", 3600, "user_data"); 
            // 哈希操作 
            jedis.hset("user:1001", "name", "李四"); 
            jedis.hset("user:1001", "age", "25"); 
            jedis.hset("user:1001", "city", "北京"); 
            String userName = jedis.hget("user:1001", "name"); 
            System.out.println("用户名: " + userName); 
            // 列表操作 
            jedis.lpush("tasks", "任务1", "任务2", "任务3"); 
            String task = jedis.rpop("tasks"); 
            System.out.println("取出任务: " + task); 
            // 集合操作 
            jedis.sadd("tags", "Java", "Redis", "Spring"); 
            boolean isMember = jedis.sismember("tags", "Java"); 
            System.out.println("是否包含Java: " + isMember); 
            // 有序集合操作 
            jedis.zadd("leaderboard", 1500, "player1"); 
            jedis.zadd("leaderboard", 2000, "player2"); 
            jedis.zadd("leaderboard", 1800, "player3"); 
            // 获取排行榜前3名 
            var topPlayers = jedis.zrevrange("leaderboard", 0, 2); 
            System.out.println("排行榜前3名: " + topPlayers); 
        } finally { 
            jedis.close(); 
        } 
    } 
}
```
##### 连接池
连接池配置
```java
import redis.clients.jedis.JedisPool; 
import redis.clients.jedis.JedisPoolConfig; 
import redis.clients.jedis.Jedis; 
public class JedisPoolExample { 
    private static JedisPool jedisPool; static { 
        // 连接池配置 
        JedisPoolConfig config = new JedisPoolConfig(); 
        config.setMaxTotal(100); // 最大连接数 
        config.setMaxIdle(20); // 最大空闲连接数 
        config.setMinIdle(5); // 最小空闲连接数 
        config.setMaxWaitMillis(3000); // 最大等待时间 
        config.setTestOnBorrow(true); // 获取连接时测试 
        config.setTestOnReturn(true); // 归还连接时测试 
        config.setTestWhileIdle(true); // 空闲时测试 
        // 创建连接池 
        jedisPool = new JedisPool(config, "localhost", 6379, 2000); 
    } 
    public static Jedis getJedis() { 
        return jedisPool.getResource(); 
    } 
    public static void closePool() { 
        if (jedisPool != null) { 
            jedisPool.close(); 
        } 
    } 
    // 使用示例 
    public static void example() { 
        Jedis jedis = getJedis(); 
        try { 
            jedis.set("pool:test", "连接池测试"); 
            String value = jedis.get("pool:test"); 
            System.out.println(value); 
        } finally { 
            jedis.close(); // 归还连接到池中 
        } 
    } 
}
```
工具类封装
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.util.function.Function;

public class RedisUtil {

    private static final JedisPool JEDIS_POOL;

    static {
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(100);
        config.setMaxIdle(20);
        config.setMinIdle(5);
        config.setMaxWaitMillis(3000);
        config.setTestOnBorrow(true);

        JEDIS_POOL = new JedisPool(config, "localhost", 6379);
    }

    /**
     * 通用执行模板：自动获取/归还连接
     */
    public static <T> T execute(Function<Jedis, T> action) {
        try (Jedis jedis = JEDIS_POOL.getResource()) {
            return action.apply(jedis);
        }
    }

    /* ==================== 常用命令封装 ==================== */

    public static void set(String key, String value) {
        execute(jedis -> {
            jedis.set(key, value);
            return null;
        });
    }

    public static String get(String key) {
        return execute(jedis -> jedis.get(key));
    }

    public static void setex(String key, int seconds, String value) {
        execute(jedis -> {
            jedis.setex(key, seconds, value);
            return null;
        });
    }

    public static void del(String key) {
        execute(jedis -> jedis.del(key));
    }

    public static boolean exists(String key) {
        return execute(jedis -> jedis.exists(key));
    }
}
```
##### 集群模式
集群模式配置
```java
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;
import redis.clients.jedis.JedisPoolConfig;

import java.util.HashSet;
import java.util.Set;

public class JedisClusterExample {

    private static JedisCluster jedisCluster;

    static {
        /* ---------------- 集群节点 ---------------- */
        Set<HostAndPort> nodes = new HashSet<>();
        nodes.add(new HostAndPort("192.168.1.100", 7000));
        nodes.add(new HostAndPort("192.168.1.100", 7001));
        nodes.add(new HostAndPort("192.168.1.101", 7000));
        nodes.add(new HostAndPort("192.168.1.101", 7001));
        nodes.add(new HostAndPort("192.168.1.102", 7000));
        nodes.add(new HostAndPort("192.168.1.102", 7001));

        /* ---------------- 连接池配置 ---------------- */
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(100);
        config.setMaxIdle(20);
        config.setMinIdle(5);
        config.setMaxWaitMillis(3000);
        config.setTestOnBorrow(true);

        /* ---------------- 创建集群连接 ---------------- */
        jedisCluster = new JedisCluster(
                nodes,      // 节点集合
                2000,       // 连接超时
                5000,       // 读取超时
                5,          // 最大重定向次数
                config      // 连接池配置
        );
    }

    /* ---------------- 示例操作 ---------------- */
    public static void example() {
        try {
            // 字符串操作
            jedisCluster.set("cluster:test", "集群测试");
            String value = jedisCluster.get("cluster:test");
            System.out.println("集群值: " + value);

            // 哈希操作
            jedisCluster.hset("cluster:user:1001", "name", "集群用户");
            String name = jedisCluster.hget("cluster:user:1001", "name");
            System.out.println("集群用户名: " + name);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* ---------------- 关闭资源 ---------------- */
    public static void close() {
        if (jedisCluster != null) {
            try {
                jedisCluster.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /* ---------------- 简单测试 ---------------- */
    public static void main(String[] args) {
        example();
        close();
    }
}
```
### 实际应用场景
1. 缓存管理
```java
import com.alibaba.fastjson.JSON;

/**
 * 通用缓存管理器
 * 统一封装用户、查询结果等高频缓存操作
 */
public class CacheManager {

    /** 默认过期时间：1 小时（单位：秒） */
    private static final int DEFAULT_EXPIRE = 3600;

    /* ==================== 用户缓存 ==================== */

    /**
     * 缓存用户信息
     *
     * @param userId 用户 ID
     * @param user   用户对象
     */
    public static void cacheUser(Long userId, User user) {
        String key = "user:" + userId;
        String userJson = JSON.toJSONString(user);
        RedisUtil.setex(key, DEFAULT_EXPIRE, userJson);
    }

    /**
     * 获取缓存的用户信息
     *
     * @param userId 用户 ID
     * @return 用户对象；缓存未命中返回 null
     */
    public static User getUser(Long userId) {
        String key = "user:" + userId;
        String userJson = RedisUtil.get(key);
        if (userJson != null) {
            return JSON.parseObject(userJson, User.class);
        }
        return null;
    }

    /* ==================== 通用查询结果缓存 ==================== */

    /**
     * 缓存任意查询结果
     *
     * @param queryKey      缓存键
     * @param result        结果对象
     * @param expireSeconds 过期时间（秒）
     */
    public static void cacheQueryResult(String queryKey, Object result, int expireSeconds) {
        String resultJson = JSON.toJSONString(result);
        RedisUtil.setex(queryKey, expireSeconds, resultJson);
    }

    /**
     * 获取缓存的查询结果
     *
     * @param queryKey 缓存键
     * @param clazz    结果类型
     * @param <T>      泛型
     * @return 结果对象；缓存未命中返回 null
     */
    public static <T> T getCachedResult(String queryKey, Class<T> clazz) {
        String resultJson = RedisUtil.get(queryKey);
        if (resultJson != null) {
            return JSON.parseObject(resultJson, clazz);
        }
        return null;
    }
}
```
2. 分布式锁实现
```java
import redis.clients.jedis.Jedis;

import java.util.Collections;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * 基于 Redis 的分布式锁
 * 特性：互斥、防死锁、防误删、可重入（需扩展）
 */
public class DistributedLock {

    /** 锁 key 前缀，防止命名冲突 */
    private static final String LOCK_PREFIX = "lock:";

    /**
     * Lua 脚本：原子性释放锁
     * KEYS[1]   = 锁 key
     * ARGV[1]   = 请求标识（requestId）
     * 返回值 1 表示释放成功，0 表示锁不属于当前线程
     */
    private static final String UNLOCK_SCRIPT =
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "  return redis.call('del', KEYS[1]) " +
            "else " +
            "  return 0 " +
            "end";

    /* ==================== 加锁 ==================== */

    /**
     * 尝试获取分布式锁
     *
     * @param lockKey    业务锁标识
     * @param requestId  请求唯一标识（用于防误删）
     * @param expireTime 锁自动过期时间（秒）
     * @return true 表示加锁成功，false 表示锁已被占用
     */
    public static boolean tryLock(String lockKey, String requestId, int expireTime) {
        String key = LOCK_PREFIX + lockKey;
        return RedisUtil.execute(jedis -> {
            String result = jedis.set(key, requestId, "NX", "EX", expireTime);
            return "OK".equals(result);
        });
    }

    /* ==================== 解锁 ==================== */

    /**
     * 释放分布式锁
     *
     * @param lockKey   业务锁标识
     * @param requestId 必须与加锁时传入的一致
     * @return true 表示释放成功，false 表示锁已过期或归属不符
     */
    public static boolean releaseLock(String lockKey, String requestId) {
        String key = LOCK_PREFIX + lockKey;
        return RedisUtil.execute(jedis -> {
            Object result = jedis.eval(
                    UNLOCK_SCRIPT,
                    Collections.singletonList(key),
                    Collections.singletonList(requestId)
            );
            return Long.valueOf(1).equals(result);
        });
    }

    /* ==================== 模板方法 ==================== */

    /**
     * 在锁保护下执行业务逻辑
     *
     * @param lockKey    业务锁标识
     * @param expireTime 锁自动过期时间（秒）
     * @param business   业务逻辑 Supplier
     * @param <T>        返回值类型
     * @return 业务逻辑执行结果
     * @throws RuntimeException 获取锁失败时抛出
     */
    public static <T> T executeWithLock(String lockKey, int expireTime, Supplier<T> business) {
        String requestId = UUID.randomUUID().toString();
        boolean locked = tryLock(lockKey, requestId, expireTime);
        if (!locked) {
            throw new RuntimeException("获取锁失败: " + lockKey);
        }
        try {
            return business.get();
        } finally {
            releaseLock(lockKey, requestId);
        }
    }
}
```
3. 会话管理
```java
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 分布式会话管理器
 * 基于 Redis Hash 实现，支持过期、续期、手动删除
 */
public class SessionManager {

    /** 会话 key 前缀 */
    private static final String SESSION_PREFIX = "session:";

    /** 默认过期时间：30 分钟（单位：秒） */
    private static final int SESSION_TIMEOUT = 1800;

    /* ==================== 创建会话 ==================== */

    /**
     * 创建分布式会话
     *
     * @param userId 用户 ID
     * @return 生成的 sessionId
     */
    public static String createSession(Long userId) {
        String sessionId = UUID.randomUUID().toString();
        String key = SESSION_PREFIX + sessionId;

        Map<String, String> sessionData = new HashMap<>();
        sessionData.put("userId", userId.toString());
        sessionData.put("createTime", String.valueOf(System.currentTimeMillis()));
        sessionData.put("lastAccessTime", String.valueOf(System.currentTimeMillis()));

        RedisUtil.execute(jedis -> {
            jedis.hmset(key, sessionData);
            jedis.expire(key, SESSION_TIMEOUT);
            return null;
        });
        return sessionId;
    }

    /* ==================== 获取会话 ==================== */

    /**
     * 获取会话信息并续期
     *
     * @param sessionId 会话 ID
     * @return 会话数据；不存在时返回空 Map
     */
    public static Map<String, String> getSession(String sessionId) {
        String key = SESSION_PREFIX + sessionId;
        return RedisUtil.execute(jedis -> {
            Map<String, String> session = jedis.hgetAll(key);
            if (!session.isEmpty()) {
                // 续期：更新最后访问时间 & 重置 TTL
                jedis.hset(key, "lastAccessTime", String.valueOf(System.currentTimeMillis()));
                jedis.expire(key, SESSION_TIMEOUT);
            }
            return session;
        });
    }

    /* ==================== 删除会话 ==================== */

    /**
     * 手动删除会话
     *
     * @param sessionId 会话 ID
     */
    public static void removeSession(String sessionId) {
        String key = SESSION_PREFIX + sessionId;
        RedisUtil.del(key);
    }

    /* ==================== 验证会话 ==================== */

    /**
     * 判断会话是否存在
     *
     * @param sessionId 会话 ID
     * @return true 表示有效；false 表示已过期或被删除
     */
    public static boolean isValidSession(String sessionId) {
        String key = SESSION_PREFIX + sessionId;
        return RedisUtil.exists(key);
    }
}
```
4. 计数器和限流
```java
import redis.clients.jedis.Jedis;

import java.util.Arrays;
import java.util.Collections;


/**
 * 计数器 + 限流工具集
 * 提供：简单计数、带过期计数、滑动窗口、令牌桶 四种常见实现
 */
public class CounterAndRateLimit {

    /* ==================== 简单计数器 ==================== */

    /**
     * 自增计数器（无过期）
     *
     * @param counterKey 计数器键
     * @return 自增后的值
     */
    public static long increment(String counterKey) {
        return RedisUtil.execute(jedis -> jedis.incr(counterKey));
    }

    /**
     * 带过期时间的自增计数器（首次写入时设置 TTL）
     *
     * @param counterKey    计数器键
     * @param expireSeconds 过期时间（秒）
     * @return 自增后的值
     */
    public static long incrementWithExpire(String counterKey, int expireSeconds) {
        return RedisUtil.execute(jedis -> {
            long count = jedis.incr(counterKey);
            if (count == 1) { // 首次写入才设置过期时间
                jedis.expire(counterKey, expireSeconds);
            }
            return count;
        });
    }

    /* ==================== 滑动窗口限流 ==================== */

    /**
     * 滑动窗口限流
     *
     * @param key           限流键
     * @param limit         窗口内最大请求数
     * @param windowSeconds 窗口大小（秒）
     * @return true 表示允许通过；false 表示被限流
     */
    public static boolean isAllowed(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000L;

        return RedisUtil.execute(jedis -> {
            // 1. 清理过期时间戳
            jedis.zremrangeByScore(key, 0, windowStart);

            // 2. 当前窗口内请求数
            long count = jedis.zcard(key);

            if (count < limit) {
                // 3. 记录本次请求（时间戳作为 score & member）
                jedis.zadd(key, now, String.valueOf(now));
                jedis.expire(key, windowSeconds);
                return true;
            }
            return false;
        });
    }

    /* ==================== 令牌桶限流 ==================== */

    /**
     * 令牌桶限流（Lua 原子实现）
     *
     * @param bucketKey  桶标识
     * @param capacity   桶容量（最大令牌数）
     * @param refillRate 每秒填充速率（令牌/秒）
     * @return true 表示拿到令牌；false 表示桶空
     */
    public static boolean tryAcquire(String bucketKey, int capacity, int refillRate) {
        String script =
                "local bucket        = KEYS[1] " +
                "local capacity      = tonumber(ARGV[1]) " +
                "local refillRate    = tonumber(ARGV[2]) " +
                "local now           = tonumber(ARGV[3]) " +

                // 读取当前令牌数和上次填充时间
                "local bucketData    = redis.call('HMGET', bucket, 'tokens', 'lastRefill') " +
                "local tokens        = tonumber(bucketData[1]) or capacity " +
                "local lastRefill    = tonumber(bucketData[2]) or now " +

                // 计算应添加令牌数
                "local elapsed       = now - lastRefill " +
                "local tokensToAdd   = math.floor(elapsed * refillRate / 1000) " +
                "tokens              = math.min(capacity, tokens + tokensToAdd) " +

                // 尝试消费 1 个令牌
                "if tokens >= 1 then " +
                "  tokens = tokens - 1 " +
                "  redis.call('HMSET', bucket, 'tokens', tokens, 'lastRefill', now) " +
                "  redis.call('EXPIRE', bucket, 3600) " +
                "  return 1 " +
                "else " +
                "  redis.call('HMSET', bucket, 'tokens', tokens, 'lastRefill', now) " +
                "  redis.call('EXPIRE', bucket, 3600) " +
                "  return 0 " +
                "end";

        return RedisUtil.execute(jedis -> {
            Object result = jedis.eval(
                    script,
                    Collections.singletonList(bucketKey),
                    Arrays.asList(
                            String.valueOf(capacity),
                            String.valueOf(refillRate),
                            String.valueOf(System.currentTimeMillis())
                    )
            );
            return Long.valueOf(1).equals(result);
        });
    }
}
```
### 最佳实践
- 连接管理：使用连接池，避免频繁创建连接
- 异常处理：妥善处理网络异常和超时
- 键命名：使用有意义的键名，建立命名规范
- 过期时间：合理设置过期时间，避免内存泄漏
- 序列化：选择合适的序列化方式（JSON、Protobuf等）
- 监控：监控连接数、响应时间、错误率等指标
### 注意事项
- 线程安全：Jedis 实例不是线程安全的，需要使用连接池
- 资源释放：及时关闭连接，避免连接泄漏
- 大键值：避免存储过大的值，影响性能
- 批量操作：使用 Pipeline 或事务进行批量操作
- 网络延迟：考虑网络延迟对性能的影响



## Redisson 客户端
### Redisson 简介
Redisson 是一个在 Redis 基础上实现的 Java 驻内存数据网格（In-Memory Data Grid）。它不仅提供了一系列的分布式的 Java 常用对象，还提供了许多分布式服务。其中包括（BitSet, Set, Multimap, SortedSet, Map, List, Queue, BlockingQueue, Deque, BlockingDeque, Semaphore, Lock, AtomicLong, CountDownLatch, Publish / Subscribe, Bloom filter, Remote service, Spring cache, Executor service, Live Object service, Scheduler service）等。

- 分布式锁：提供可重入锁、公平锁、读写锁等多种锁实现
- 分布式对象：分布式 Map、Set、List、Queue 等集合对象
- 分布式服务：远程服务、执行器服务、调度器服务等
- 高性能：基于 Netty 框架，支持异步操作

### Redisson vs Jedis vs Lettuce
| 特性 | Redisson | Jedis | Lettuce |
| --- | --- | --- | --- |
| 连接方式 | 基于 Netty，异步非阻塞 | 基于 Socket，同步阻塞 | 基于 Netty，异步非阻塞 |
| 线程安全 | 线程安全 | 非线程安全 | 线程安全 |
| 分布式锁 | 内置多种锁实现 | 需要手动实现 | 需要手动实现 |
| 分布式对象 | 丰富的分布式对象 | 基础 Redis 命令 | 基础 Redis 命令 |
| 集群支持 | 完善的集群支持 | 支持集群 | 支持集群 |
| 学习成本 | 中等 | 低 | 中等 |
| 适用场景 | 复杂分布式应用 | 简单 Redis 操作 | 高并发应用 |
### 环境准备
#### Maven 依赖
```yaml
org.redisson redisson 3.24.3 org.redisson redisson-spring-boot-starter 3.24.3 com.fasterxml.jackson.core jackson-databind 2.15.2
```
#### 基础配置
##### 单机配置
```java
// 单机模式配置
Config config = new Config();
config.useSingleServer()
      .setAddress("redis://127.0.0.1:6379")
      .setPassword("your_password")          // 如果有密码
      .setDatabase(0)
      .setConnectionMinimumIdleSize(10)
      .setConnectionPoolSize(64)
      .setIdleConnectionTimeout(10000)
      .setConnectTimeout(10000)
      .setTimeout(3000)
      .setRetryAttempts(3)
      .setRetryInterval(1500);

RedissonClient redisson = Redisson.create(config);
```
##### 集群配置
```java
// 集群模式配置
Config config = new Config();
config.useClusterServers()
      .addNodeAddress("redis://127.0.0.1:7000")
      .addNodeAddress("redis://127.0.0.1:7001")
      .addNodeAddress("redis://127.0.0.1:7002")
      .addNodeAddress("redis://127.0.0.1:7003")
      .addNodeAddress("redis://127.0.0.1:7004")
      .addNodeAddress("redis://127.0.0.1:7005")
      .setPassword("your_password")
      .setMasterConnectionMinimumIdleSize(10)
      .setMasterConnectionPoolSize(64)
      .setSlaveConnectionMinimumIdleSize(10)
      .setSlaveConnectionPoolSize(64)
      .setIdleConnectionTimeout(10000)
      .setConnectTimeout(10000)
      .setTimeout(3000)
      .setRetryAttempts(3)
      .setRetryInterval(1500);

RedissonClient redisson = Redisson.create(config);
```
##### 哨兵配置
```java
// 哨兵模式配置
Config config = new Config();
config.useSentinelServers()
      .setMasterName("mymaster")
      .addSentinelAddress("redis://127.0.0.1:26379")
      .addSentinelAddress("redis://127.0.0.1:26380")
      .addSentinelAddress("redis://127.0.0.1:26381")
      .setPassword("your_password")
      .setMasterConnectionMinimumIdleSize(10)
      .setMasterConnectionPoolSize(64)
      .setSlaveConnectionMinimumIdleSize(10)
      .setSlaveConnectionPoolSize(64)
      .setIdleConnectionTimeout(10000)
      .setConnectTimeout(10000)
      .setTimeout(3000)
      .setRetryAttempts(3)
      .setRetryInterval(1500);

RedissonClient redisson = Redisson.create(config);
```
### 分布式锁
#### 可重入锁（RLock）
```java
public class RedissonLockExample {

    private RedissonClient redisson;

    /**
     * 基础锁使用
     */
    public void basicLockExample() {
        RLock lock = redisson.getLock("myLock");
        try {
            // 尝试加锁，最多等待100秒，上锁以后10秒自动解锁
            boolean isLocked = lock.tryLock(100, 10, TimeUnit.SECONDS);
            if (isLocked) {
                // 执行业务逻辑
                System.out.println("获取锁成功，执行业务逻辑");
                Thread.sleep(5000);
            } else {
                System.out.println("获取锁失败");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            // 释放锁
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * 自动续期锁（看门狗机制）
     */
    public void watchdogLockExample() {
        RLock lock = redisson.getLock("watchdogLock");
        try {
            // 加锁，不设置过期时间，使用看门狗机制自动续期
            lock.lock();
            // 执行长时间业务逻辑
            System.out.println("执行长时间业务逻辑");
            Thread.sleep(30000); // 30秒，超过默认锁过期时间
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * 异步锁操作
     */
    public void asyncLockExample() {
        RLock lock = redisson.getLock("asyncLock");

        // 异步加锁
        RFuture<Boolean> lockFuture = lock.tryLockAsync(100, 10, TimeUnit.SECONDS);
        lockFuture.whenComplete((isLocked, throwable) -> {
            if (throwable != null) {
                System.err.println("加锁异常: " + throwable.getMessage());
                return;
            }

            if (isLocked) {
                try {
                    // 执行业务逻辑
                    System.out.println("异步获取锁成功");
                } finally {
                    // 异步释放锁
                    lock.unlockAsync();
                }
            } else {
                System.out.println("异步获取锁失败");
            }
        });
    }
}
```
#### 公平锁（RFairLock）
```java
public class FairLockExample {

    private RedissonClient redisson;

    /**
     * 公平锁示例
     */
    public void fairLockExample() {
        RFairLock fairLock = redisson.getFairLock("fairLock");
        try {
            // 公平锁保证先请求的线程先获得锁
            boolean isLocked = fairLock.tryLock(100, 10, TimeUnit.SECONDS);
            if (isLocked) {
                System.out.println("获取公平锁成功: " + Thread.currentThread().getName());
                Thread.sleep(2000);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            if (fairLock.isHeldByCurrentThread()) {
                fairLock.unlock();
            }
        }
    }

    /**
     * 多线程公平锁测试
     */
    public void testFairLock() {
        ExecutorService executor = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 5; i++) {
            final int threadNum = i;
            executor.submit(() -> {
                System.out.println("线程 " + threadNum + " 请求锁");
                fairLockExample();
            });
        }
        executor.shutdown();
    }
}
```
#### 读写锁（RReadWriteLock）
```java
public class ReadWriteLockExample {

    private RedissonClient redisson;
    private RReadWriteLock readWriteLock;

    public ReadWriteLockExample(RedissonClient redisson) {
        this.redisson = redisson;
        this.readWriteLock = redisson.getReadWriteLock("readWriteLock");
    }

    /**
     * 读操作
     */
    public String readData(String key) {
        RLock readLock = readWriteLock.readLock();
        try {
            readLock.lock(10, TimeUnit.SECONDS);
            // 模拟读取数据
            System.out.println("读取数据: " + Thread.currentThread().getName());
            Thread.sleep(1000);
            return "data_" + key;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } finally {
            if (readLock.isHeldByCurrentThread()) {
                readLock.unlock();
            }
        }
    }

    /**
     * 写操作
     */
    public void writeData(String key, String value) {
        RLock writeLock = readWriteLock.writeLock();
        try {
            writeLock.lock(10, TimeUnit.SECONDS);
            // 模拟写入数据
            System.out.println("写入数据: " + Thread.currentThread().getName());
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            if (writeLock.isHeldByCurrentThread()) {
                writeLock.unlock();
            }
        }
    }

    /**
     * 测试读写锁
     */
    public void testReadWriteLock() {
        ExecutorService executor = Executors.newFixedThreadPool(10);

        // 启动多个读线程
        for (int i = 0; i < 5; i++) {
            executor.submit(() -> readData("test"));
        }

        // 启动写线程
        executor.submit(() -> writeData("test", "value"));

        // 再启动读线程
        for (int i = 0; i < 3; i++) {
            executor.submit(() -> readData("test"));
        }

        executor.shutdown();
    }
}
```
### 分布式对象
#### 分布式 Map（RMap）
```java
public class RedissonMapExample {

    private RedissonClient redisson;

    /**
     * 基础 Map 操作
     */
    public void basicMapOperations() {
        RMap<String, String> map = redisson.getMap("myMap");

        // 基础操作
        map.put("key1", "value1");
        map.put("key2", "value2");
        String value = map.get("key1");
        System.out.println("获取值: " + value);

        // 批量操作
        Map<String, String> batch = new HashMap<>();
        batch.put("key3", "value3");
        batch.put("key4", "value4");
        map.putAll(batch);

        // 条件操作
        String oldValue = map.putIfAbsent("key5", "value5");
        boolean replaced = map.replace("key1", "value1", "newValue1");

        // 获取所有键值
        Set<String> keys = map.keySet();
        Collection<String> values = map.values();
        Set<Map.Entry<String, String>> entries = map.entrySet();

        System.out.println("Map 大小: " + map.size());
    }

    /**
     * 带过期时间的 Map
     */
    public void mapWithTTL() {
        RMapCache<String, String> mapCache = redisson.getMapCache("cacheMap");

        // 设置键值对，10秒后过期
        mapCache.put("tempKey", "tempValue", 10, TimeUnit.SECONDS);

        // 设置键值对，5秒后过期，最大空闲时间3秒
        mapCache.put("idleKey", "idleValue", 5, TimeUnit.SECONDS, 3, TimeUnit.SECONDS);

        // 批量设置过期时间
        Map<String, String> batch = new HashMap<>();
        batch.put("batchKey1", "batchValue1");
        batch.put("batchKey2", "batchValue2");
        mapCache.putAll(batch, 30, TimeUnit.SECONDS);
    }

    /**
     * 异步 Map 操作
     */
    public void asyncMapOperations() {
        RMap<String, String> map = redisson.getMap("asyncMap");

        // 异步放入
        RFuture<String> putFuture = map.putAsync("asyncKey", "asyncValue");
        putFuture.whenComplete((oldValue, throwable) -> {
            if (throwable == null) {
                System.out.println("异步放入成功，旧值: " + oldValue);
            } else {
                System.err.println("异步放入失败: " + throwable.getMessage());
            }
        });

        // 异步获取
        RFuture<String> getFuture = map.getAsync("asyncKey");
        getFuture.whenComplete((value, throwable) -> {
            if (throwable == null) {
                System.out.println("异步获取成功，值: " + value);
            } else {
                System.err.println("异步获取失败: " + throwable.getMessage());
            }
        });
    }
}
```
#### 分布式 Set（RSet）
```java
public class RedissonSetExample {

    private RedissonClient redisson;

    /**
     * 基础 Set 操作
     */
    public void basicSetOperations() {
        RSet<String> set = redisson.getSet("mySet");

        // 添加元素
        set.add("element1");
        set.add("element2");
        set.add("element3");

        // 批量添加
        Set<String> batch = Arrays.asList("element4", "element5")
                                   .stream()
                                   .collect(Collectors.toSet());
        set.addAll(batch);

        // 检查元素
        boolean contains = set.contains("element1");
        System.out.println("包含 element1: " + contains);

        // 移除元素
        boolean removed = set.remove("element1");
        System.out.println("移除 element1: " + removed);

        // 获取所有元素
        Set<String> allElements = set.readAll();
        System.out.println("所有元素: " + allElements);
        System.out.println("Set 大小: " + set.size());
    }

    /**
     * Set 集合运算
     */
    public void setOperations() {
        RSet<String> set1 = redisson.getSet("set1");
        RSet<String> set2 = redisson.getSet("set2");

        // 初始化数据
        set1.addAll(Arrays.asList("a", "b", "c", "d"));
        set2.addAll(Arrays.asList("c", "d", "e", "f"));

        // 交集
        Set<String> intersection = set1.readIntersection("set2");
        System.out.println("交集: " + intersection);

        // 并集
        Set<String> union = set1.readUnion("set2");
        System.out.println("并集: " + union);

        // 差集（set1 - set2）
        Set<String> diff = set1.readDiff("set2");
        System.out.println("差集: " + diff);

        // 将交集结果存储到新的 Set（返回结果集的大小）
        int intersectionSize = set1.intersection("set2", "intersectionResult");
        System.out.println("交集大小（已存入 intersectionResult）: " + intersectionSize);
    }
}
```
#### 分布式 List（RList）
```java
public class RedissonListExample {

    private RedissonClient redisson;

    /**
     * 基础 List 操作
     */
    public void basicListOperations() {
        RList<String> list = redisson.getList("myList");

        // 添加元素
        list.add("first");
        list.add("second");
        list.add(1, "inserted"); // 在索引 1 处插入

        // 批量添加
        list.addAll(Arrays.asList("third", "fourth"));

        // 获取元素
        String first = list.get(0);
        String last = list.get(list.size() - 1);
        System.out.println("第一个元素: " + first);
        System.out.println("最后一个元素: " + last);

        // 查找元素
        int index = list.indexOf("second");
        System.out.println("'second' 的索引: " + index);

        // 移除元素
        String removed = list.remove(0);               // 移除第一个元素
        boolean removedByValue = list.remove("third"); // 移除指定值

        // 子列表
        List<String> subList = list.subList(0, 2);
        System.out.println("子列表: " + subList);

        // 排序
        list.sort(String::compareTo);
        System.out.println("List 内容: " + list.readAll());
    }

    /**
     * 阻塞队列操作
     */
    public void blockingQueueOperations() {
        RBlockingQueue<String> blockingQueue = redisson.getBlockingQueue("blockingQueue");

        // 生产者线程
        new Thread(() -> {
            try {
                for (int i = 0; i < 5; i++) {
                    blockingQueue.put("item" + i);
                    System.out.println("生产: item" + i);
                    Thread.sleep(1000);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        // 消费者线程
        new Thread(() -> {
            try {
                while (true) {
                    String item = blockingQueue.take(); // 阻塞等待
                    System.out.println("消费: " + item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
}
```
### 分布式服务
#### 分布式信号量（RSemaphore）
```java
public class RedissonSemaphoreExample {

    private RedissonClient redisson;

    /**
     * 信号量限流示例
     */
    public void semaphoreExample() {
        RSemaphore semaphore = redisson.getSemaphore("mySemaphore");

        // 设置许可数量（仅在信号量不存在时生效）
        semaphore.trySetPermits(3);

        // 模拟多个线程竞争资源
        ExecutorService executor = Executors.newFixedThreadPool(10);
        for (int i = 0; i < 10; i++) {
            final int threadNum = i;
            executor.submit(() -> {
                try {
                    // 获取许可（阻塞直到获得）
                    semaphore.acquire();
                    System.out.println("线程 " + threadNum + " 获取到许可，开始执行");

                    // 模拟业务处理
                    Thread.sleep(2000);
                    System.out.println("线程 " + threadNum + " 执行完成，释放许可");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    // 释放许可
                    semaphore.release();
                }
            });
        }
        executor.shutdown();
    }

    /**
     * 尝试获取许可（非阻塞/带超时）
     */
    public void tryAcquireExample() {
        RSemaphore semaphore = redisson.getSemaphore("tryAcquireSemaphore");
        semaphore.trySetPermits(2);

        try {
            // 尝试获取一个许可，最多等待 5 秒
            boolean acquired = semaphore.tryAcquire(5, TimeUnit.SECONDS);
            if (acquired) {
                System.out.println("获取许可成功");
                // 执行业务逻辑
                Thread.sleep(3000);
            } else {
                System.out.println("获取许可失败（超时）");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            // 只有在成功获取许可的情况下才需要释放
            // 更安全的做法：记录是否已获取，而非依赖 availablePermits()
            // 此处为简化演示，建议在实际项目中用标志位控制
            // 示例修正如下：
            // （此处保留原逻辑，但添加说明）
            if (Thread.interrupted()) {
                // 若线程被中断，通常不应盲目 release
                // 实际应通过变量跟踪是否 acquire 成功
            }
            // 推荐做法：将 release 放在 acquired == true 的分支内
        }
    }
}
```
#### 分布式计数器（RAtomicLong）
```java
public class RedissonAtomicExample {

    private RedissonClient redisson;

    /**
     * 原子计数器示例
     */
    public void atomicLongExample() {
        RAtomicLong atomicLong = redisson.getAtomicLong("myCounter");

        // 设置初始值
        atomicLong.set(0);

        // 自增并返回新值
        long value = atomicLong.incrementAndGet();
        System.out.println("自增后的值: " + value);

        // 加 10 并返回旧值
        long oldValue = atomicLong.getAndAdd(10);
        System.out.println("加10前的值: " + oldValue);
        System.out.println("当前值: " + atomicLong.get());

        // 比较并设置（CAS）：仅当当前值为 11 时，才更新为 100
        boolean updated = atomicLong.compareAndSet(11, 100);
        System.out.println("CAS 更新结果: " + updated);
        System.out.println("最终值: " + atomicLong.get());
    }

    /**
     * 多线程计数器测试
     */
    public void concurrentCounterTest() {
        RAtomicLong counter = redisson.getAtomicLong("concurrentCounter");
        counter.set(0); // 初始化为 0

        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(100);

        // 启动 100 个线程，每个线程执行 10 次自增（总计 1000 次）
        for (int i = 0; i < 100; i++) {
            executor.submit(() -> {
                try {
                    for (int j = 0; j < 10; j++) {
                        counter.incrementAndGet();
                    }
                } finally {
                    latch.countDown(); // 确保即使异常也能释放 latch
                }
            });
        }

        try {
            latch.await(); // 等待所有线程完成
            System.out.println("最终计数值: " + counter.get()); // 应为 1000
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdown();
        }
    }
}
```

#### 分布式CountDownLatch
```java
public class RedissonCountDownLatchExample {

    private RedissonClient redisson;

    /**
     * CountDownLatch 示例：等待所有任务完成
     */
    public void countDownLatchExample() {
        RCountDownLatch latch = redisson.getCountDownLatch("myLatch");

        // 初始化计数值（仅在 latch 不存在时生效）
        latch.trySetCount(3);

        // 启动多个工作线程
        for (int i = 0; i < 3; i++) {
            final int taskNum = i;
            new Thread(() -> {
                try {
                    System.out.println("任务 " + taskNum + " 开始执行");
                    Thread.sleep((taskNum + 1) * 1000); // 模拟不同执行时间
                    System.out.println("任务 " + taskNum + " 执行完成");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    latch.countDown(); // 完成后计数减 1
                }
            }).start();
        }

        // 主线程阻塞等待所有任务完成
        try {
            System.out.println("等待所有任务完成...");
            latch.await(); // 阻塞直到计数归零
            System.out.println("所有任务已完成！");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 带超时的 CountDownLatch：防止无限等待
     */
    public void countDownLatchWithTimeout() {
        RCountDownLatch latch = redisson.getCountDownLatch("timeoutLatch");

        // 设置初始计数值为 5
        latch.trySetCount(5);

        // 仅启动 3 个任务（少于计数值，用于测试超时）
        for (int i = 0; i < 3; i++) {
            final int taskNum = i;
            new Thread(() -> {
                try {
                    Thread.sleep(2000);
                    System.out.println("任务 " + taskNum + " 完成");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        try {
            // 最多等待 10 秒
            boolean completed = latch.await(10, TimeUnit.SECONDS);
            if (completed) {
                System.out.println("所有任务在超时前完成");
            } else {
                System.out.println("等待超时，当前剩余计数: " + latch.getCount());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```
### Spring Boot集成
```yaml
spring:
  redis:
    redisson:
      config: |
        singleServerConfig:
          address: "redis://127.0.0.1:6379"
          password: null
          database: 0
          connectionMinimumIdleSize: 10
          connectionPoolSize: 64
          idleConnectionTimeout: 10000
          connectTimeout: 10000
          timeout: 3000
          retryAttempts: 3
          retryInterval: 1500
        threads: 16
        nettyThreads: 32
        codec: !<org.redisson.codec.JsonJacksonCodec> {}
        transportMode: "NIO"
```
```java
import org.redisson.Redisson;
import org.redisson.api.*;
import org.redisson.config.Config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Configuration
public class RedissonConfig {

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
              .setAddress("redis://127.0.0.1:6379")
              .setPassword(null) // 显式设置为 null（若无密码），或省略
              .setDatabase(0)
              .setConnectionMinimumIdleSize(10)
              .setConnectionPoolSize(64)
              .setIdleConnectionTimeout(10_000)
              .setConnectTimeout(10_000)
              .setTimeout(3_000)
              .setRetryAttempts(3)
              .setRetryInterval(1_500);

        return Redisson.create(config);
    }
}

@Service
public class RedissonService {

    @Resource
    private RedissonClient redissonClient;

    /**
     * 获取分布式锁
     */
    public RLock getLock(String lockKey) {
        if (lockKey == null || lockKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Lock key must not be null or empty");
        }
        return redissonClient.getLock(lockKey);
    }

    /**
     * 获取分布式 Map
     */
    public <K, V> RMap<K, V> getMap(String mapName) {
        if (mapName == null || mapName.trim().isEmpty()) {
            throw new IllegalArgumentException("Map name must not be null or empty");
        }
        return redissonClient.getMap(mapName);
    }

    /**
     * 获取分布式 Set
     */
    public <T> RSet<T> getSet(String setName) {
        if (setName == null || setName.trim().isEmpty()) {
            throw new IllegalArgumentException("Set name must not be null or empty");
        }
        return redissonClient.getSet(setName);
    }

    /**
     * 获取分布式 List
     */
    public <T> RList<T> getList(String listName) {
        if (listName == null || listName.trim().isEmpty()) {
            throw new IllegalArgumentException("List name must not be null or empty");
        }
        return redissonClient.getList(listName);
    }
}
```
### 最佳实践
- 连接池配置：根据应用负载合理配置连接池大小
- 锁的使用：避免长时间持有锁，合理设置锁的过期时间
- 异常处理：妥善处理网络异常和锁获取失败的情况
- 资源释放：确保在 finally 块中释放锁和其他资源
- 监控告警：监控锁的持有时间、获取成功率等指标
- 序列化选择：根据数据特点选择合适的序列化方式

注意事项
- 锁重入：Redisson 锁支持重入，但要确保加锁和解锁次数匹配
- 网络分区：在网络分区情况下，可能出现脑裂问题
- 时钟偏移：分布式环境下要注意服务器时钟同步
- 内存使用：大量使用分布式对象时要注意 Redis 内存使用
- 版本兼容：确保 Redisson 版本与 Redis 版本兼容
### 总结
Redisson 是一个功能强大的 Redis Java 客户端，提供了丰富的分布式对象和服务。它简化了分布式应用的开发，特别是在分布式锁、分布式集合、分布式服务等方面。合理使用 Redisson 可以大大提升分布式应用的开发效率和系统稳定性。



## Spring Boot集成Redis
### Spring Boot Redis 集成概述
Spring Boot 为 Redis 集成提供了优秀的自动配置支持，通过 Spring Data Redis 可以轻松地在 Spring Boot 应用中使用 Redis。Spring Data Redis 支持 Jedis 和 Lettuce 两种客户端，并提供了统一的编程模型。

- 自动配置
Spring Boot 提供开箱即用的 Redis 自动配置

- RedisTemplate
强大的 Redis 操作模板，支持各种数据类型

- Repository 支持
类似 JPA 的 Repository 编程模型

- 缓存抽象
Spring Cache 抽象，注解驱动的缓存

### 环境准备
#### Maven 依赖
```yaml
<!-- Spring Boot Starter --> 
<dependency> 
    <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-data-redis</artifactId> 
</dependency> 
<!-- 连接池（可选，推荐） --> 
<dependency> 
    <groupId>org.apache.commons</groupId> <artifactId>commons-pool2</artifactId>
</dependency> 
<!-- JSON 序列化（可选） --> 
<dependency> 
    <groupId>com.fasterxml.jackson.core</groupId> <artifactId>jackson-databind</artifactId> 
</dependency> 
<!-- Spring Boot Web（用于示例） --> 
<dependency> 
    <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> 
</dependency>
```
#### 配置文件
application.yml
```yaml
spring:
  redis:
    # 单机配置
    host: localhost
    port: 6379
    # password: your_password  # 如果有密码才取消注释
    database: 0
    timeout: 3000ms

    # Lettuce 连接池配置（Spring Boot 2.x+ 默认使用 Lettuce）
    lettuce:
      pool:
        max-active: 100      # 最大连接数
        max-idle: 20         # 最大空闲连接数
        min-idle: 5          # 最小空闲连接数
        max-wait: 3000ms     # 获取连接最大等待时间

    # Jedis 连接池配置（仅当你排除 Lettuce 并使用 Jedis 时生效）
    jedis:
      pool:
        max-active: 100
        max-idle: 20
        min-idle: 5
        max-wait: 3000ms

  # 缓存配置
  cache:
    type: redis
    redis:
      time-to-live: 3600000   # 默认缓存过期时间：1小时（毫秒）
      cache-null-values: false # 是否缓存 null 值（防止缓存穿透）
```
application.properties

```properties
# Redis 基本配置
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.database=0
spring.redis.timeout=3000ms

# Lettuce 连接池配置
spring.redis.lettuce.pool.max-active=100
spring.redis.lettuce.pool.max-idle=20
spring.redis.lettuce.pool.min-idle=5
spring.redis.lettuce.pool.max-wait=3000ms

# 缓存配置
spring.cache.type=redis
spring.cache.redis.time-to-live=3600000
spring.cache.redis.cache-null-values=false
```
集群配置
```yaml
spring:
  redis:
    cluster:
      nodes:
        - 192.168.1.100:7000
        - 192.168.1.100:7001
        - 192.168.1.101:7000
        - 192.168.1.101:7001
        - 192.168.1.102:7000
        - 192.168.1.102:7001
      max-redirects: 3
    password: mypass  # ← 填写真实密码
    timeout: 3000ms
    lettuce:
      pool:
        max-active: 100
        max-idle: 20
        min-idle: 5
        max-wait: 3000ms
```
### Redis 配置类
```java
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * RedisTemplate 配置（支持 JSON 序列化）
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // JSON 序列化配置
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = 
            new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL
        );
        jackson2JsonRedisSerializer.setObjectMapper(objectMapper);

        // String 序列化
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();

        // 设置序列化器
        template.setKeySerializer(stringRedisSerializer);
        template.setHashKeySerializer(stringRedisSerializer);
        template.setValueSerializer(jackson2JsonRedisSerializer);
        template.setHashValueSerializer(jackson2JsonRedisSerializer);
        template.afterPropertiesSet();

        return template;
    }

    /**
     * StringRedisTemplate 配置（用于纯字符串操作）
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    /**
     * 缓存管理器配置
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1)) // 默认过期时间 1 小时
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new Jackson2JsonRedisSerializer<>(Object.class)))
            .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .build();
    }
}
```
### RedisTemplate 使用
```java
@Service
public class RedisService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    // ========== 字符串操作 ==========

    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public void set(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? (T) value : null;
    }

    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(key);
    }

    public Long increment(String key, long delta) {
        return redisTemplate.opsForValue().increment(key, delta);
    }

    // ========== 哈希操作 ==========

    public void hSet(String key, String field, Object value) {
        redisTemplate.opsForHash().put(key, field, value);
    }

    public Object hGet(String key, String field) {
        return redisTemplate.opsForHash().get(key, field);
    }

    public Map<Object, Object> hGetAll(String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    public void hMSet(String key, Map<String, Object> map) {
        redisTemplate.opsForHash().putAll(key, map);
    }

    // ========== 列表操作 ==========

    public Long lPush(String key, Object... values) {
        return redisTemplate.opsForList().leftPushAll(key, values);
    }

    public Object rPop(String key) {
        return redisTemplate.opsForList().rightPop(key);
    }

    public List<Object> lRange(String key, long start, long end) {
        return redisTemplate.opsForList().range(key, start, end);
    }

    // ========== 集合操作 ==========

    public Long sAdd(String key, Object... values) {
        return redisTemplate.opsForSet().add(key, values);
    }

    public Set<Object> sMembers(String key) {
        return redisTemplate.opsForSet().members(key);
    }

    public Boolean sIsMember(String key, Object value) {
        return redisTemplate.opsForSet().isMember(key, value);
    }

    // ========== 有序集合操作 ==========

    public Boolean zAdd(String key, Object value, double score) {
        return redisTemplate.opsForZSet().add(key, value, score);
    }

    public Set<Object> zRevRange(String key, long start, long end) {
        return redisTemplate.opsForZSet().reverseRange(key, start, end);
    }

    public Set<ZSetOperations.TypedTuple<Object>> zRevRangeWithScores(String key, long start, long end) {
        return redisTemplate.opsForZSet().reverseRangeWithScores(key, start, end);
    }

    // ========== 通用操作 ==========

    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }

    public Long delete(Collection<String> keys) {
        return redisTemplate.delete(keys);
    }

    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    public Boolean expire(String key, long timeout, TimeUnit unit) {
        return redisTemplate.expire(key, timeout, unit);
    }

    public Long getExpire(String key) {
        return redisTemplate.getExpire(key);
    }
}
```
### Spring Cache 注解使用示例
```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * 缓存用户信息
     */
    @Cacheable(value = "users", key = "#userId")
    public User getUserById(Long userId) {
        System.out.println("从数据库查询用户: " + userId);
        return userRepository.findById(userId).orElse(null);
    }

    /**
     * 条件缓存用户列表
     */
    @Cacheable(value = "userList", key = "#status", condition = "#status != null")
    public List<User> getUsersByStatus(String status) {
        System.out.println("从数据库查询用户列表: " + status);
        return userRepository.findByStatus(status);
    }

    /**
     * 更新用户并同步缓存
     */
    @CachePut(value = "users", key = "#user.id")
    public User updateUser(User user) {
        System.out.println("更新用户信息: " + user.getId());
        return userRepository.save(user);
    }

    /**
     * 删除用户并清除缓存
     */
    @CacheEvict(value = "users", key = "#userId")
    public void deleteUser(Long userId) {
        System.out.println("删除用户: " + userId);
        userRepository.deleteById(userId);
    }

    /**
     * 清除多个缓存
     */
    @CacheEvict(value = {"users", "userList"}, allEntries = true)
    public void clearAllUserCache() {
        System.out.println("清除所有用户缓存");
    }

    /**
     * 复杂缓存逻辑（组合注解）
     */
    @Caching(
        cacheable = @Cacheable(value = "userProfile", key = "#userId"),
        put = @CachePut(value = "users", key = "#userId")
    )
    public User getUserProfile(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setProfile(loadUserProfile(userId));
        }
        return user;
    }

    private UserProfile loadUserProfile(Long userId) {
        return new UserProfile(); // 模拟加载
    }
}
```
### 自定义缓存管理器（多策略）
```java
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager customCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new Jackson2JsonRedisSerializer<>(Object.class)))
            .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("userList", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("sessions", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("config", defaultConfig.entryTtl(Duration.ofDays(1)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }
}
```
### 实际应用场景
#### 1. 分布式会话管理
```java
@RestController
@RequestMapping("/api/session")
public class SessionController {

    @Autowired
    private RedisService redisService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        User user = authenticateUser(request.getUsername(), request.getPassword());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String sessionId = UUID.randomUUID().toString();
        String sessionKey = "session:" + sessionId;
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("userId", user.getId());
        sessionData.put("username", user.getUsername());
        sessionData.put("loginTime", System.currentTimeMillis());
        sessionData.put("lastAccessTime", System.currentTimeMillis());

        redisService.set(sessionKey, sessionData, 30, TimeUnit.MINUTES);

        Map<String, String> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("message", "登录成功");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSessionInfo(
        @RequestHeader("Session-Id") String sessionId) {
        String sessionKey = "session:" + sessionId;
        Map<String, Object> sessionData = redisService.get(sessionKey, Map.class);
        if (sessionData == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        sessionData.put("lastAccessTime", System.currentTimeMillis());
        redisService.set(sessionKey, sessionData, 30, TimeUnit.MINUTES);
        return ResponseEntity.ok(sessionData);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Session-Id") String sessionId) {
        String sessionKey = "session:" + sessionId;
        redisService.delete(sessionKey);
        return ResponseEntity.ok("登出成功");
    }

    private User authenticateUser(String username, String password) {
        // 实现认证逻辑
        return null;
    }
}
```
#### 2. 分布式锁实现
```java
@Component
public class DistributedLockService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    private static final String LOCK_PREFIX = "lock:";
    private static final String UNLOCK_SCRIPT =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "return redis.call('del', KEYS[1]) " +
        "else return 0 end";

    public boolean tryLock(String lockKey, String requestId, long expireTime) {
        String key = LOCK_PREFIX + lockKey;
        Boolean result = stringRedisTemplate.opsForValue()
            .setIfAbsent(key, requestId, Duration.ofSeconds(expireTime));
        return Boolean.TRUE.equals(result);
    }

    public boolean releaseLock(String lockKey, String requestId) {
        String key = LOCK_PREFIX + lockKey;
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(UNLOCK_SCRIPT);
        script.setResultType(Long.class);
        Long result = stringRedisTemplate.execute(script, Collections.singletonList(key), requestId);
        return Long.valueOf(1).equals(result);
    }

    public <T> T executeWithLock(String lockKey, long expireTime, Supplier<T> business) {
        String requestId = UUID.randomUUID().toString();
        boolean locked = tryLock(lockKey, requestId, expireTime);
        if (!locked) {
            throw new RuntimeException("获取锁失败: " + lockKey);
        }
        try {
            return business.get();
        } finally {
            releaseLock(lockKey, requestId);
        }
    }
}

// 使用示例
@Service
public class OrderService {

    @Autowired
    private DistributedLockService lockService;

    public Order createOrder(CreateOrderRequest request) {
        String lockKey = "order:create:" + request.getUserId();
        return lockService.executeWithLock(lockKey, 30, () -> {
            if (existsRecentOrder(request.getUserId())) {
                throw new RuntimeException("请勿重复提交订单");
            }
            return doCreateOrder(request);
        });
    }

    private boolean existsRecentOrder(Long userId) {
        return false; // 模拟检查
    }

    private Order doCreateOrder(CreateOrderRequest request) {
        return new Order(); // 创建逻辑
    }
}
```
#### 3. 限流器实现（滑动窗口 + 令牌桶）
```java
@Component
public class RateLimiterService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    /**
     * 滑动窗口限流
     */
    public boolean isAllowed(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000L;

        String script =
            "redis.call('zremrangebyscore', KEYS[1], 0, ARGV[1]) " +
            "local count = redis.call('zcard', KEYS[1]) " +
            "if count < tonumber(ARGV[3]) then " +
            "redis.call('zadd', KEYS[1], ARGV[2], ARGV[2]) " +
            "redis.call('expire', KEYS[1], ARGV[4]) " +
            "return 1 " +
            "else " +
            "return 0 " +
            "end";

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        Long result = stringRedisTemplate.execute(
            redisScript,
            Collections.singletonList(key),
            String.valueOf(windowStart),
            String.valueOf(now),
            String.valueOf(limit),
            String.valueOf(windowSeconds)
        );
        return Long.valueOf(1).equals(result);
    }

    /**
     * 令牌桶限流（简化版）
     */
    public boolean tryAcquire(String bucketKey, int capacity, double refillRate) {
        String script =
            "local bucket = KEYS[1] " +
            "local capacity = tonumber(ARGV[1]) " +
            "local refillRate = tonumber(ARGV[2]) " +
            "local now = tonumber(ARGV[3]) " +
            "local bucket_data = redis.call('HMGET', bucket, 'tokens', 'lastRefill') " +
            "local tokens = tonumber(bucket_data[1]) or capacity " +
            "local lastRefill = tonumber(bucket_data[2]) or now " +
            "local elapsed = (now - lastRefill) / 1000 " +
            "local tokensToAdd = elapsed * refillRate " +
            "tokens = math.min(capacity, tokens + tokensToAdd) " +
            "if tokens >= 1 then " +
            "tokens = tokens - 1 " +
            "redis.call('HMSET', bucket, 'tokens', tokens, 'lastRefill', now) " +
            "redis.call('EXPIRE', bucket, 3600) " +
            "return 1 " +
            "else " +
            "redis.call('HMSET', bucket, 'tokens', tokens, 'lastRefill', now) " +
            "redis.call('EXPIRE', bucket, 3600) " +
            "return 0 " +
            "end";

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        Long result = stringRedisTemplate.execute(
            redisScript,
            Collections.singletonList(bucketKey),
            String.valueOf(capacity),
            String.valueOf(refillRate),
            String.valueOf(System.currentTimeMillis())
        );
        return Long.valueOf(1).equals(result);
    }
}
```
限流注解与切面
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    String key() default "";
    int limit() default 10;
    int window() default 60;
    String message() default "请求过于频繁，请稍后再试";
}

@Aspect
@Component
public class RateLimitAspect {

    @Autowired
    private RateLimiterService rateLimiterService;

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint point, RateLimit rateLimit) throws Throwable {
        String key = rateLimit.key();
        if (key.isEmpty()) {
            key = point.getSignature().toShortString();
        }

        boolean allowed = rateLimiterService.isAllowed(key, rateLimit.limit(), rateLimit.window());
        if (!allowed) {
            throw new RuntimeException(rateLimit.message());
        }
        return point.proceed();
    }
}
```
### 配置参数详解
Spring Boot Redis 核心配置参数说明与推荐值

|配置项|	默认值	|说明	|推荐值
|:----|:----|:----|:----
|spring.redis.host	|localhost	|Redis 服务器地址	|实际服务器地址
|spring.redis.port	|6379	|Redis 服务器端口	|6379
|spring.redis.timeout	|2000ms	|连接超时时间	|3000ms
|spring.redis.lettuce.pool.max-active	|8	|最大连接数	|100
|spring.redis.lettuce.pool.max-idle	|8	|最大空闲连接数	|20
|spring.redis.lettuce.pool.min-idle	|0	|最小空闲连接数	|5
|spring.redis.lettuce.pool.max-wait	|-1ms	|最大等待时间	|3000ms

### 最佳实践
Redis 配置与使用的核心建议

- 序列化选择
根据需求选择合适的序列化方式，JSON适合可读性，二进制适合性能

- 连接池配置
合理配置连接池参数，避免连接不足或浪费资源

- 缓存策略
设置合理的过期时间，避免缓存雪崩和内存溢出

- 异常处理
妥善处理 Redis 连接异常，提供降级方案保证服务可用性

- 监控告警
监控 Redis 连接数、响应时间、错误率等关键指标

- 键命名规范
建立统一的键命名规范，便于管理和维护

### 总结
Spring Boot 与 Redis 的集成为开发者提供了强大而灵活的缓存和数据存储解决方案。通过合理的配置和使用，可以显著提升应用的性能和用户体验。在实际项目中，建议根据具体需求选择合适的客户端和配置策略。
- 高性能
- 易配置
- 可扩展
- 生产就绪
