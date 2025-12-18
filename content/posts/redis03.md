---
title: "Redis 高级"
date: 2021-02-15T12:00:00+08:00
draft: false
description: "Redis 高级:发布订阅、事务、脚本、连接、服务器、GEO和Stream。"
tags: ["Redis", "中间件"]
categories: ["Middleware"]
---

## Redis 发布订阅
### 发布订阅概述
Redis 发布订阅（Pub/Sub）是一种消息通信模式，发送者（Publisher）发送消息，订阅者（Subscriber）接收消息。发送者和订阅者之间通过频道（Channel）进行解耦，发送者不需要知道有哪些订阅者，订阅者也不需要知道有哪些发送者。这种模式特别适合实时消息传递、事件通知和分布式系统间的通信。

![发布订阅架构](img/redis03-1.png)

#### 基本命令
Redis 发布订阅的核心操作命令：

| 命令	| 语法	| 描述	| 返回值	|
| --- | --- | --- | --- |
| SUBSCRIBE	| SUBSCRIBE channel [channel ...]	| 订阅一个或多个频道	| 订阅确认信息	|
| UNSUBSCRIBE	| UNSUBSCRIBE [channel [channel ...]]	| 取消订阅频道	| 取消订阅确认	|
| PUBLISH	| PUBLISH channel message	| 向频道发布消息	| 接收消息的订阅者数量	|
|PSUBSCRIBE	|PSUBSCRIBE pattern [pattern ...]	|订阅匹配模式的频道	|订阅确认信息
|PUNSUBSCRIBE	|PUNSUBSCRIBE [pattern [pattern ...]]	|取消模式订阅	|取消订阅确认
|PUBSUB	|PUBSUB subcommand [argument [argument ...]]	|查看发布订阅状态	|状态信息
基本操作示例：
```bash
# 终端1：订阅者
# 订阅单个频道
SUBSCRIBE news
# 返回：
# 1) "subscribe"
# 2) "news"
# 3) (integer) 1

# 订阅多个频道
SUBSCRIBE news sports tech
# 返回订阅确认信息

# 终端2：发布者
# 发布消息到 news 频道
PUBLISH news "Breaking: Redis 7.0 released!"
# 返回：(integer) 1  # 表示有1个订阅者收到消息

# 发布消息到 sports 频道
PUBLISH sports "Football match tonight"
# 返回：(integer) 1

# 终端1会收到消息：
# 1) "message"
# 2) "news"
# 3) "Breaking: Redis 7.0 released!"

# 取消订阅
UNSUBSCRIBE news
# 返回：
# 1) "unsubscribe"
# 2) "news"
# 3) (integer) 2  # 剩余订阅频道数
```
模式订阅示例：
```bash
# 终端1：模式订阅
# 订阅所有以 "news:" 开头的频道
PSUBSCRIBE news:*
# 返回：
# 1) "psubscribe"
# 2) "news:*"
# 3) (integer) 1

# 订阅多个模式
PSUBSCRIBE news:* sports:* tech:*

# 终端2：发布消息
# 发布到具体频道
PUBLISH news:china "Local news update"
PUBLISH news:world "International news"
PUBLISH sports:football "Match result"
PUBLISH tech:ai "AI breakthrough"

# 终端1会收到匹配的消息：
# 1) "pmessage"
# 2) "news:*"        # 匹配的模式
# 3) "news:china"    # 实际频道
# 4) "Local news update"  # 消息内容

# 取消模式订阅
PUNSUBSCRIBE news:*
# 返回：
# 1) "punsubscribe"
# 2) "news:*"
# 3) (integer) 2  # 剩余模式订阅数
```
#### 状态查询命令
查看发布订阅系统的状态信息：

| 命令	| 描述	| 示例	|
| --- | --- | --- |
|PUBSUB CHANNELS	|列出当前活跃的频道	|PUBSUB CHANNELS	|
|PUBSUB CHANNELS pattern	|列出匹配模式的活跃频道	|PUBSUB CHANNELS news:*	|
|PUBSUB NUMSUB	|查看频道的订阅者数量	|PUBSUB NUMSUB news sports	|
|PUBSUB NUMPAT	|查看模式订阅的总数	|PUBSUB NUMPAT	|
状态查询示例：
```bash
# 查看所有活跃频道
PUBSUB CHANNELS
# 返回：
# 1) "news"
# 2) "sports"
# 3) "tech"

# 查看匹配模式的频道
PUBSUB CHANNELS news:*
# 返回：
# 1) "news:china"
# 2) "news:world"

# 查看特定频道的订阅者数量
PUBSUB NUMSUB news sports
# 返回：
# 1) "news"
# 2) (integer) 3    # news 频道有3个订阅者
# 3) "sports"
# 4) (integer) 1    # sports 频道有1个订阅者

# 查看模式订阅总数
PUBSUB NUMPAT
# 返回：(integer) 2  # 总共有2个模式订阅
```
### 应用场景
Redis 发布订阅在实际项目中的典型应用：

#### 实时聊天系统
```bash
# 用户加入聊天室
SUBSCRIBE chatroom:general
SUBSCRIBE chatroom:tech

# 用户发送消息
PUBLISH chatroom:general "Hello everyone!"
PUBLISH chatroom:tech "Anyone using Redis?"

# 私聊频道
SUBSCRIBE user:private:123
PUBLISH user:private:123 "Private message"

# 系统通知
PUBLISH system:notifications "Server maintenance in 10 minutes"
```
> 优势：实时性强，支持多房间，易于扩展

#### 实时数据推送
```bash
# 股票价格推送
SUBSCRIBE stock:AAPL
SUBSCRIBE stock:GOOGL
PUBLISH stock:AAPL "150.25"

# 系统监控数据
SUBSCRIBE monitor:cpu
SUBSCRIBE monitor:memory
PUBLISH monitor:cpu "85%"
PUBLISH monitor:memory "70%"

# 实时日志
SUBSCRIBE logs:error
SUBSCRIBE logs:warning
PUBLISH logs:error "Database connection failed"
```
> 优势：低延迟，高并发，实时监控

#### 事件通知系统
```bash
# 用户行为事件
SUBSCRIBE events:user:login
SUBSCRIBE events:user:purchase
PUBLISH events:user:login "user123 logged in"
PUBLISH events:user:purchase "user456 bought item789"

# 系统事件
SUBSCRIBE events:system:*
PUBLISH events:system:backup "Backup completed"
PUBLISH events:system:deploy "New version deployed"

# 业务事件
SUBSCRIBE events:order:*
PUBLISH events:order:created "Order #12345 created"
PUBLISH events:order:shipped "Order #12345 shipped"
```
> 优势：事件驱动，松耦合，易于集成

#### 游戏实时通信
```bash
# 游戏房间通信
SUBSCRIBE game:room:123
PUBLISH game:room:123 "Player joined"
PUBLISH game:room:123 "Game started"

# 玩家状态更新
SUBSCRIBE player:status:*
PUBLISH player:status:user123 "level up"
PUBLISH player:status:user456 "achievement unlocked"

# 全服公告
SUBSCRIBE server:announcements
PUBLISH server:announcements "Server maintenance tonight"

# 排行榜更新
SUBSCRIBE leaderboard:updates
PUBLISH leaderboard:updates "New #1 player: user789"
```
> 优势：实时互动，多人同步，状态广播

#### 微服务通信
```bash
# 服务间事件通信
SUBSCRIBE service:user:events
SUBSCRIBE service:order:events
PUBLISH service:user:events "user_registered"
PUBLISH service:order:events "order_completed"

# 配置更新通知
SUBSCRIBE config:updates
PUBLISH config:updates "database_config_changed"

# 健康检查
SUBSCRIBE health:checks
PUBLISH health:checks "service_a:healthy"
PUBLISH health:checks "service_b:unhealthy"

# 缓存失效通知
SUBSCRIBE cache:invalidation
PUBLISH cache:invalidation "user:123:profile"
```
> 优势：服务解耦，事件驱动，分布式通信

#### 移动应用推送
```bash
# 用户个性化推送
SUBSCRIBE push:user:123
PUBLISH push:user:123 "You have a new message"

# 群组推送
SUBSCRIBE push:group:developers
PUBLISH push:group:developers "New API documentation available"

# 地理位置推送
SUBSCRIBE push:location:beijing
PUBLISH push:location:beijing "Weather alert: Heavy rain"

# 应用更新通知
SUBSCRIBE app:updates
PUBLISH app:updates "Version 2.0 available for download"
```
> 优势：个性化推送，分组管理，实时到达

#### 客户端实现
不同编程语言的发布订阅实现示例：

##### Java 实现（Jedis）
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPubSub;

// 订阅者实现
class MySubscriber extends JedisPubSub {
    @Override
    public void onMessage(String channel, String message) {
        System.out.println("收到消息: " + channel + " -> " + message);
    }
    
    @Override
    public void onSubscribe(String channel, int subscribedChannels) {
        System.out.println("订阅频道: " + channel);
    }
    
    @Override
    public void onUnsubscribe(String channel, int subscribedChannels) {
        System.out.println("取消订阅: " + channel);
    }
}

// 使用示例
public class PubSubExample {
    public static void main(String[] args) {
        Jedis jedis = new Jedis("localhost", 6379);
        
        // 订阅者线程
        new Thread(() -> {
            Jedis subscriber = new Jedis("localhost", 6379);
            MySubscriber mySubscriber = new MySubscriber();
            subscriber.subscribe(mySubscriber, "news", "sports");
        }).start();
        
        // 发布者
        Thread.sleep(1000); // 等待订阅建立
        jedis.publish("news", "Breaking news!");
        jedis.publish("sports", "Match result");
        
        jedis.close();
    }
}
```
##### Python 实现（redis-py）
```python
import redis
import threading
import time

# 订阅者函数
def subscriber():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = r.pubsub()
    
    # 订阅频道
    pubsub.subscribe('news', 'sports')
    
    # 监听消息
    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"收到消息: {message['channel']} -> {message['data']}")
        elif message['type'] == 'subscribe':
            print(f"订阅频道: {message['channel']}")

# 发布者函数
def publisher():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    time.sleep(1)  # 等待订阅建立
    
    # 发布消息
    r.publish('news', 'Breaking news!')
    r.publish('sports', 'Match result')
    
    print("消息已发布")

# 使用示例
if __name__ == '__main__':
    # 启动订阅者线程
    sub_thread = threading.Thread(target=subscriber)
    sub_thread.daemon = True
    sub_thread.start()
    
    # 启动发布者
    pub_thread = threading.Thread(target=publisher)
    pub_thread.start()
    
    # 等待
    pub_thread.join()
    time.sleep(2)
```
##### Node.js 实现（ioredis）
```javascript
const Redis = require('ioredis');

// 创建 Redis 连接
const publisher = new Redis({
    host: 'localhost',
    port: 6379
});

const subscriber = new Redis({
    host: 'localhost',
    port: 6379
});

// 订阅者
subscriber.subscribe('news', 'sports');

subscriber.on('subscribe', (channel, count) => {
    console.log(`订阅频道: ${channel}, 总订阅数: ${count}`);
});

subscriber.on('message', (channel, message) => {
    console.log(`收到消息: ${channel} -> ${message}`);
});

// 发布者
setTimeout(() => {
    publisher.publish('news', 'Breaking news!');
    publisher.publish('sports', 'Match result');
    console.log('消息已发布');
}, 1000);

// 模式订阅示例
const patternSubscriber = new Redis();
patternSubscriber.psubscribe('news:*');

patternSubscriber.on('pmessage', (pattern, channel, message) => {
    console.log(`模式匹配: ${pattern} -> ${channel} -> ${message}`);
});

// 发布到模式匹配的频道
setTimeout(() => {
    publisher.publish('news:china', 'Local news');
    publisher.publish('news:world', 'International news');
}, 2000);
```
##### Go 实现（go-redis）
```go
package main

import (
    "context"
    "fmt"
    "time"
    
    "github.com/go-redis/redis/v8"
)

func main() {
    ctx := context.Background()
    
    // 创建 Redis 客户端
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    
    // 订阅者 goroutine
    go func() {
        pubsub := rdb.Subscribe(ctx, "news", "sports")
        defer pubsub.Close()
        
        // 监听消息
        ch := pubsub.Channel()
        for msg := range ch {
            fmt.Printf("收到消息: %s -> %s\n", msg.Channel, msg.Payload)
        }
    }()
    
    // 等待订阅建立
    time.Sleep(time.Second)
    
    // 发布消息
    err := rdb.Publish(ctx, "news", "Breaking news!").Err()
    if err != nil {
        panic(err)
    }
    
    err = rdb.Publish(ctx, "sports", "Match result").Err()
    if err != nil {
        panic(err)
    }
    
    fmt.Println("消息已发布")
    
    // 模式订阅示例
    go func() {
        pubsub := rdb.PSubscribe(ctx, "news:*")
        defer pubsub.Close()
        
        ch := pubsub.Channel()
        for msg := range ch {
            fmt.Printf("模式匹配: %s -> %s\n", msg.Channel, msg.Payload)
        }
    }()
    
    time.Sleep(time.Second)
    
    // 发布到模式匹配的频道
    rdb.Publish(ctx, "news:china", "Local news")
    rdb.Publish(ctx, "news:world", "International news")
    
    // 等待消息处理
    time.Sleep(2 * time.Second)
}
```
### 发布订阅优缺点
|方面	|优点	|缺点
| --- | --- | ---
|实时性	|消息即时推送，延迟极低	|网络问题可能导致消息丢失
|解耦性	|发布者和订阅者完全解耦	|难以追踪消息流向
|扩展性	|支持多对多通信模式	|大量订阅者时性能下降
|持久化	|内存占用小，性能高	|消息不持久化，重启丢失
|可靠性	|简单易用，配置简单	|无消息确认机制
### 注意事项和限制
使用 Redis 发布订阅时需要注意的问题：

#### 消息丢失风险
- 无持久化：消息不会被持久化存储
- 订阅者离线：离线期间的消息会丢失
- 网络问题：网络中断可能导致消息丢失
- 缓冲区满：客户端缓冲区满时会断开连接
#### 性能考虑
- 内存使用：大量订阅者会增加内存消耗
- CPU 开销：消息分发需要 CPU 资源
- 网络带宽：大量消息会占用网络带宽
- 连接数限制：每个订阅者需要一个连接
#### 最佳实践
- 合理设计频道：避免频道过多或过少
- 控制消息大小：避免发送过大的消息
- 监控订阅者：定期检查订阅者状态
- 错误处理：实现重连和错误恢复机制
- 消息格式：使用结构化的消息格式（JSON等）
- 频道命名：使用有意义的频道命名规范
#### 生产环境配置建议
```bash
# Redis 配置优化
# 客户端输出缓冲区限制
client-output-buffer-limit pubsub 32mb 8mb 60

# 最大客户端连接数
maxclients 10000

# 超时设置
timeout 300

# 监控脚本示例
#!/bin/bash
# 监控发布订阅状态

echo "=== Redis 发布订阅监控 ==="

# 检查活跃频道
echo "活跃频道数量:"
redis-cli PUBSUB CHANNELS | wc -l

# 检查模式订阅数量
echo "模式订阅数量:"
redis-cli PUBSUB NUMPAT

# 检查特定频道订阅者数量
echo "重要频道订阅者数量:"
redis-cli PUBSUB NUMSUB news sports tech

# 检查客户端连接数
echo "客户端连接数:"
redis-cli INFO clients | grep connected_clients

# 检查内存使用
echo "内存使用情况:"
redis-cli INFO memory | grep used_memory_human
```
### 适用场景总结：
- 实时通信：聊天系统、实时评论、在线游戏
- 事件通知：系统监控、业务事件、状态变更
- 数据推送：股票价格、传感器数据、日志流
- 微服务通信：服务间事件、配置更新、健康检查
- 缓存失效：分布式缓存同步、数据一致性

## Redis 事务
### 事务概述
Redis 事务是一个单独的隔离操作，事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。Redis 事务的主要作用就是串联多个命令防止别的命令插队。虽然 Redis 事务不完全符合传统数据库的 ACID 特性，但它提供了一定程度的原子性保证。
![Redis 事务](img/redis03-2.png)
#### 事务基本命令
Redis 事务的核心命令及其使用方法：

|命令	|语法	|描述	|返回值
| --- | --- | --- | ---
|MULTI	|MULTI	|开启事务，后续命令进入队列	|OK
|EXEC	|EXEC	|执行事务中的所有命令	|命令执行结果数组
|DISCARD	|DISCARD	|取消事务，清空命令队列	|OK
|WATCH	|WATCH key [key ...]	|监视键，实现乐观锁	|OK
|UNWATCH	|UNWATCH	|取消监视所有键	|OK
基本事务示例：
```bash
# 开启事务
MULTI
# 返回：OK

# 添加命令到事务队列
SET account:1 100
# 返回：QUEUED

SET account:2 200
# 返回：QUEUED

INCR counter
# 返回：QUEUED

GET account:1
# 返回：QUEUED

# 执行事务
EXEC
# 返回：
# 1) OK
# 2) OK
# 3) (integer) 1
# 4) "100"

# 查看结果
GET account:1
# 返回："100"

GET account:2
# 返回："200"

GET counter
# 返回："1"
```
取消事务示例：
```bash
# 开启事务
MULTI
# 返回：OK

# 添加命令
SET key1 "value1"
# 返回：QUEUED

SET key2 "value2"
# 返回：QUEUED

# 取消事务
DISCARD
# 返回：OK

# 检查键是否存在
GET key1
# 返回：(nil)  # 事务被取消，命令未执行

GET key2
# 返回：(nil)
```
### WATCH 命令和乐观锁
WATCH 命令用于监视一个或多个键，如果在事务执行之前这些键被其他命令修改，那么事务将被打断：

- 监视状态
  - WATCH 生效：键未被修改
  - 事务正常执行：返回命令结果
  - 监视自动取消：EXEC 后清除
- 监视失效
  - 键被修改：其他客户端修改了监视的键
  - 事务被打断：EXEC 返回 nil
  - 需要重试：重新执行整个流程
- 重试机制
  - 检测失败：判断 EXEC 返回值
  - 重新监视：再次 WATCH 键
  - 重新执行：重复事务逻辑

乐观锁示例 - 银行转账：
```bash
# 初始化账户余额
SET account:A 1000
SET account:B 500

# 客户端1：转账操作
# 监视两个账户
WATCH account:A account:B

# 获取当前余额
GET account:A
# 返回："1000"

GET account:B
# 返回："500"

# 开启事务
MULTI

# 转账 200 元从 A 到 B
DECRBY account:A 200
INCRBY account:B 200

# 执行事务
EXEC
# 返回：
# 1) (integer) 800
# 2) (integer) 700

# 验证结果
GET account:A
# 返回："800"

GET account:B
# 返回："700"
```
监视失效示例：
```bash
# 客户端1：开始转账
WATCH account:A account:B
GET account:A  # 1000
GET account:B  # 500

# 此时客户端2修改了账户A
# 客户端2：
SET account:A 1500

# 客户端1：继续执行事务
MULTI
DECRBY account:A 200
INCRBY account:B 200
EXEC
# 返回：(nil)  # 事务被打断

# 检查账户状态
GET account:A
# 返回："1500"  # 被客户端2修改的值

GET account:B
# 返回："500"   # 未被修改

# 需要重新执行转账逻辑
```
完整的乐观锁重试机制：
```python
# Python 示例代码
import redis
import time

def transfer_money(r, from_account, to_account, amount, max_retries=3):
    """
    使用乐观锁实现安全的转账操作
    """
    for attempt in range(max_retries):
        try:
            # 监视账户
            r.watch(from_account, to_account)
            
            # 获取当前余额
            from_balance = int(r.get(from_account) or 0)
            to_balance = int(r.get(to_account) or 0)
            
            # 检查余额是否足够
            if from_balance < amount:
                r.unwatch()
                return False, "余额不足"
            
            # 开启事务
            pipe = r.pipeline()
            pipe.multi()
            
            # 执行转账
            pipe.decrby(from_account, amount)
            pipe.incrby(to_account, amount)
            
            # 执行事务
            result = pipe.execute()
            
            if result is not None:
                return True, f"转账成功，尝试次数：{attempt + 1}"
            else:
                print(f"第 {attempt + 1} 次尝试失败，重试中...")
                time.sleep(0.01)  # 短暂等待
                
        except redis.WatchError:
            print(f"第 {attempt + 1} 次尝试失败，键被修改")
            time.sleep(0.01)
    
    return False, "转账失败，超过最大重试次数"

# 使用示例
r = redis.Redis()
success, message = transfer_money(r, "account:A", "account:B", 200)
print(message)
```
### 事务错误处理
Redis 事务中可能出现两种类型的错误：

- 编译时错误
    - 发生时机：命令入队时
    - 错误类型：语法错误、命令不存在
    - 处理方式：整个事务被取消
```bash
# 示例
MULTI
SET key1 value1
SETX key2 value2  # 错误命令
# 返回：(error) ERR unknown command 'SETX'

EXEC
# 返回：(error) EXECABORT Transaction discarded
```
- 运行时错误
    - 发生时机：EXEC 执行时
    - 错误类型：类型错误、操作错误
    - 处理方式：错误命令失败，其他命令继续
```bash
# 示例
SET mykey "hello"
MULTI
INCR mykey        # 对字符串执行数值操作
SET key2 value2   # 正常命令
EXEC
# 返回：
# 1) (error) ERR value is not an integer
# 2) OK
```
#### 重要注意事项
- 无回滚机制：Redis 不支持事务回滚
- 部分失败：运行时错误不会影响其他命令
- 错误检查：需要检查每个命令的执行结果
- 数据一致性：需要应用层保证逻辑一致性
### 应用场景
Redis 事务在实际项目中的典型应用场景：

#### 金融转账
```bash
# 银行转账操作
WATCH account:from account:to

# 检查余额
GET account:from
GET account:to

# 执行转账
MULTI
DECRBY account:from 1000
INCRBY account:to 1000
SADD transaction:log "transfer:1000:from:to"
EXEC

# 记录转账日志
LPUSH transfer:history "$(date): 1000 from -> to"
```
> 优势：保证转账原子性，防止数据不一致

#### 库存扣减
```bash
# 商品库存扣减
WATCH product:123:stock

# 检查库存
GET product:123:stock

# 扣减库存
MULTI
DECR product:123:stock
SADD order:items "product:123"
INCR product:123:sold
EXEC

# 检查扣减结果
GET product:123:stock
```
> 优势：防止超卖，保证库存准确性

#### 计数器更新
```bash
# 网站访问统计
MULTI
INCR site:visits:total
INCR site:visits:today
INCR page:home:views
SADD visitors:today "user:123"
ZINCRBY popular:pages 1 "home"
EXEC

# 用户行为统计
MULTI
INCR user:123:actions
LPUSH user:123:history "login:$(date)"
SET user:123:last_seen "$(date)"
EXEC
```
> 优势：批量更新统计数据，保证一致性

#### 游戏状态更新
```bash
# 玩家升级操作
WATCH player:123:level player:123:exp

# 获取当前状态
GET player:123:level
GET player:123:exp

# 升级操作
MULTI
INCR player:123:level
SET player:123:exp 0
INCR player:123:skill_points
SADD achievements:123 "level_up"
EXEC

# 排行榜更新
ZADD leaderboard player:123:level player:123
```
> 优势：保证游戏状态一致性，防止作弊

#### 分布式锁
```bash
# 获取分布式锁
SET lock:resource:123 "client_id" EX 30 NX

# 使用事务释放锁
WATCH lock:resource:123
GET lock:resource:123

# 检查锁的所有者
if lock_owner == client_id:
    MULTI
    DEL lock:resource:123
    EXEC
else:
    UNWATCH
```
> 优势：安全释放锁，防止误删其他客户端的锁

#### 批量数据操作
```bash
# 批量用户数据更新
MULTI
HMSET user:123 name "张三" age 25 city "北京"
SADD city:beijing:users "user:123"
ZADD users:by_age 25 "user:123"
INCR stats:total_users
EXEC

# 批量删除过期数据
MULTI
DEL cache:expired:key1
DEL cache:expired:key2
DEL cache:expired:key3
DECRBY cache:count 3
EXEC
```
> 优势：提高批量操作效率，减少网络往返

### 事务性能和最佳实践
|方面	|优点	|缺点	|最佳实践
|:---:|:---:|:---:|:---:
|原子性	|命令队列化执行|	无真正的回滚机制	|应用层检查结果
|性能	|减少网络往返	|阻塞其他操作	|控制事务大小
|并发	|乐观锁机制	|高并发时重试频繁	|合理设计重试策略
|错误处理	|语法错误自动取消	|运行时错误不回滚	|预先验证数据
#### 最佳实践建议
- 事务大小：控制事务中命令数量，避免长时间阻塞
- 错误检查：检查 EXEC 返回值，处理执行失败情况
- 重试机制：实现合理的重试策略，避免无限重试
- 监视键选择：只监视必要的键，减少冲突概率
- 数据验证：在事务前验证数据类型和范围
- 超时处理：设置合理的超时时间，避免死锁
- 日志记录：记录事务执行情况，便于问题排查
#### 使用建议
- 适用场景：需要批量操作、数据一致性要求不是特别严格
- 不适用场景：需要严格 ACID 特性的金融级应用
- 替代方案：Lua 脚本可以提供更好的原子性保证
- 监控指标：监控事务成功率、重试次数、执行时间

## Redis 脚本
### Redis 脚本概述
Redis 从 2.6 版本开始支持 Lua 脚本，允许用户在 Redis 服务器端执行复杂的逻辑操作。Lua 脚本在 Redis 中具有原子性，整个脚本作为一个整体执行，不会被其他命令打断。这使得 Lua 脚本成为实现复杂业务逻辑、保证数据一致性的强大工具。

![Redis Lua 脚本特性](img/redis03-3.png)
#### 脚本基本命令
Redis 脚本的核心命令及其使用方法：

|命令	|语法	|描述	|返回值
|:---:|:---:|:---:|:---:
|EVAL	|EVAL script numkeys key [key ...] arg [arg ...]	|执行 Lua 脚本	|脚本返回值
|EVALSHA	|EVALSHA sha1 numkeys key [key ...] arg [arg ...]	|通过 SHA1 值执行缓存的脚本	|脚本返回值
|SCRIPT LOAD	|SCRIPT LOAD script	|加载脚本到缓存，返回 SHA1	|脚本的 SHA1 值
|SCRIPT EXISTS	|SCRIPT EXISTS sha1 [sha1 ...]	|检查脚本是否存在于缓存中	|存在状态数组
|SCRIPT FLUSH	|SCRIPT FLUSH	|清空脚本缓存	|OK
|SCRIPT KILL	|SCRIPT KILL	|终止正在执行的脚本	|OK

基本脚本示例：
```bash
# 简单的 Hello World 脚本
EVAL "return 'Hello, Redis Lua!'" 0
# 返回："Hello, Redis Lua!"

# 获取键值的脚本
EVAL "return redis.call('GET', KEYS[1])" 1 mykey
# 返回：mykey 的值

# 设置键值的脚本
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey "Hello World"
# 返回：OK

# 条件设置脚本
local script = [[
    local key = KEYS[1]
    local value = ARGV[1]
    local current = redis.call('GET', key)
    if current == false then
        redis.call('SET', key, value)
        return 1
    else
        return 0
    end
]]

EVAL script 1 "newkey" "newvalue"
# 返回：1 (设置成功) 或 0 (键已存在)
```
脚本缓存示例：
```bash
# 加载脚本到缓存
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# 返回："4e6d8fc8bb01276962cce5371fa795a7763657ae"

# 检查脚本是否存在
SCRIPT EXISTS "4e6d8fc8bb01276962cce5371fa795a7763657ae"
# 返回：1) (integer) 1

# 使用 SHA1 执行脚本
EVALSHA "4e6d8fc8bb01276962cce5371fa795a7763657ae" 1 mykey
# 返回：mykey 的值

# 清空脚本缓存
SCRIPT FLUSH
# 返回：OK

# 再次检查脚本
SCRIPT EXISTS "4e6d8fc8bb01276962cce5371fa795a7763657ae"
# 返回：1) (integer) 0
```
### Lua 语法基础
在 Redis 中使用的 Lua 语法要点：

#### 变量和数据类型
```lua
-- 变量声明 
local name = "Redis" 
local count = 100 
local flag = true 
local arr = {1, 2, 3, 4, 5} 
local obj = {name="Redis", version="7.0"} -- 字符串操作 
local str1 = "Hello" 
local str2 = "World" 
local result = str1 .. " " .. str2 
-- 字符串连接 
-- 数值操作 
local a = 10 
local b = 20 
local sum = a + b 
local product = a * b
```
#### 条件判断和循环
```lua
-- 条件判断 
if count > 50 
    then return "High" 
elseif count > 20 
    then return "Medium" 
else 
    return "Low" 
end 
-- for 循环 
for i = 1, 10 do 
    redis.call('INCR', 'counter') 
end 
-- while 循环 
local i = 1 
while i <= 5 do 
    redis.call('LPUSH', 'list', i) 
    i = i + 1 
end 
-- 遍历数组 
for index, value in ipairs(arr) do 
    redis.call('SET', 'key' .. index, value) 
end
```
#### Redis 命令调用
```lua
-- redis.call() - 严格模式，出错时停止执行 
local value = redis.call('GET', 'mykey') 
if value == false 
    then redis.call('SET', 'mykey', 'default') 
end 
-- redis.pcall() - 保护模式，出错时返回错误信息 
local result = redis.pcall('INCR', 'string_key') 
if type(result) == 'table' and result.err 
    then return "Error: " .. result.err
end 
-- 批量操作 
redis.call('MULTI') 
redis.call('SET', 'key1', 'value1') 
redis.call('SET', 'key2', 'value2') 
redis.call('EXEC')
```
#### KEYS 和 ARGV 参数
```lua
-- KEYS[1], KEYS[2], ... 访问键参数 
-- ARGV[1], ARGV[2], ... 访问值参数 
local key1 = KEYS[1] -- 第一个键 
local key2 = KEYS[2] -- 第二个键 
local value1 = ARGV[1] -- 第一个参数 
local value2 = ARGV[2] -- 第二个参数 
-- 获取参数数量 
local key_count = #KEYS 
local arg_count = #ARGV 
-- 遍历所有键 
for i = 1, #KEYS do 
    redis.call('DEL', KEYS[i]) 
end
```
### 实际应用案例
Redis Lua 脚本在实际项目中的典型应用：

#### 分布式锁
```lua
-- 获取锁脚本
local lock_script = [[
    local key = KEYS[1]
    local identifier = ARGV[1]
    local expire = ARGV[2]
    
    local result = redis.call('SET', key, identifier, 'EX', expire, 'NX')
    if result then
        return 1
    else
        return 0
    end
]]

-- 释放锁脚本
local unlock_script = [[
    local key = KEYS[1]
    local identifier = ARGV[1]
    
    local current = redis.call('GET', key)
    if current == identifier then
        return redis.call('DEL', key)
    else
        return 0
    end
]]

-- 使用示例
EVAL lock_script 1 "lock:resource" "client123" 30
EVAL unlock_script 1 "lock:resource" "client123"
```
> 优势：原子性操作，避免锁的误删除

#### 限流器
```lua
-- 滑动窗口限流脚本
local rate_limit_script = [[
    local key = KEYS[1]
    local window = tonumber(ARGV[1])  -- 时间窗口（秒）
    local limit = tonumber(ARGV[2])   -- 限制次数
    local current_time = tonumber(ARGV[3])
    
    -- 清理过期记录
    redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window)
    
    -- 获取当前窗口内的请求数
    local current_requests = redis.call('ZCARD', key)
    
    if current_requests < limit then
        -- 添加当前请求
        redis.call('ZADD', key, current_time, current_time)
        redis.call('EXPIRE', key, window)
        return {1, limit - current_requests - 1}
    else
        return {0, 0}
    end
]]

-- 使用示例
local current_time = os.time()
EVAL rate_limit_script 1 "rate_limit:user123" 60 10 current_time
```
> 优势：精确的滑动窗口限流，高性能

#### 库存扣减
```lua
-- 原子性库存扣减脚本
local stock_deduct_script = [[
    local stock_key = KEYS[1]
    local order_key = KEYS[2]
    local quantity = tonumber(ARGV[1])
    local order_id = ARGV[2]
    
    -- 获取当前库存
    local current_stock = tonumber(redis.call('GET', stock_key) or 0)
    
    -- 检查库存是否足够
    if current_stock >= quantity then
        -- 扣减库存
        redis.call('DECRBY', stock_key, quantity)
        -- 记录订单
        redis.call('SADD', order_key, order_id)
        -- 返回成功和剩余库存
        return {1, current_stock - quantity}
    else
        -- 返回失败和当前库存
        return {0, current_stock}
    end
]]

-- 使用示例
EVAL stock_deduct_script 2 "stock:product123" "orders:product123" 5 "order456"
```
> 优势：防止超卖，保证库存准确性

#### 抽奖系统
```lua
-- 加权随机抽奖脚本
local lottery_script = [[
    local user_key = KEYS[1]
    local prizes_key = KEYS[2]
    local user_id = ARGV[1]
    local max_draws = tonumber(ARGV[2])
    
    -- 检查用户抽奖次数
    local user_draws = tonumber(redis.call('GET', user_key) or 0)
    if user_draws >= max_draws then
        return {0, "已达到最大抽奖次数"}
    end
    
    -- 获取奖品配置
    local prizes = redis.call('HGETALL', prizes_key)
    local total_weight = 0
    local prize_list = {}
    
    -- 计算总权重
    for i = 1, #prizes, 2 do
        local prize_name = prizes[i]
        local weight = tonumber(prizes[i + 1])
        total_weight = total_weight + weight
        table.insert(prize_list, {prize_name, weight})
    end
    
    -- 生成随机数
    math.randomseed(os.time() + user_draws)
    local random_num = math.random(1, total_weight)
    
    -- 确定中奖奖品
    local current_weight = 0
    for _, prize in ipairs(prize_list) do
        current_weight = current_weight + prize[2]
        if random_num <= current_weight then
            -- 增加用户抽奖次数
            redis.call('INCR', user_key)
            redis.call('EXPIRE', user_key, 86400)  -- 24小时过期
            return {1, prize[1]}
        end
    end
    
    return {0, "抽奖失败"}
]]

-- 使用示例
EVAL lottery_script 2 "draws:user123" "prizes:config" "user123" 3
```
> 优势：公平抽奖，防止作弊，支持加权随机

#### 排行榜更新
```lua
-- 排行榜更新脚本
local leaderboard_script = [[
    local board_key = KEYS[1]
    local user_key = KEYS[2]
    local user_id = ARGV[1]
    local score = tonumber(ARGV[2])
    local max_size = tonumber(ARGV[3])
    
    -- 获取用户当前分数
    local current_score = redis.call('ZSCORE', board_key, user_id)
    
    -- 只有分数更高时才更新
    if not current_score or score > tonumber(current_score) then
        -- 更新排行榜
        redis.call('ZADD', board_key, score, user_id)
        
        -- 限制排行榜大小
        local board_size = redis.call('ZCARD', board_key)
        if board_size > max_size then
            redis.call('ZREMRANGEBYRANK', board_key, 0, board_size - max_size - 1)
        end
        
        -- 更新用户最高分
        redis.call('SET', user_key, score)
        
        -- 获取用户排名
        local rank = redis.call('ZREVRANK', board_key, user_id)
        return {1, rank + 1, score}
    else
        local rank = redis.call('ZREVRANK', board_key, user_id)
        return {0, rank and (rank + 1) or -1, current_score}
    end
]]

-- 使用示例
EVAL leaderboard_script 2 "leaderboard:game" "user:123:best" "user123" 9500 100
```
> 优势：高效的排行榜维护，支持分数比较

#### 缓存更新
```lua
-- 缓存更新脚本
local cache_update_script = [[
    local cache_key = KEYS[1]
    local lock_key = KEYS[2]
    local data = ARGV[1]
    local ttl = tonumber(ARGV[2])
    local lock_ttl = tonumber(ARGV[3])
    
    -- 尝试获取更新锁
    local lock_result = redis.call('SET', lock_key, '1', 'EX', lock_ttl, 'NX')
    
    if lock_result then
        -- 获取锁成功，更新缓存
        redis.call('SET', cache_key, data, 'EX', ttl)
        redis.call('DEL', lock_key)
        return {1, "缓存更新成功"}
    else
        -- 获取锁失败，检查缓存是否存在
        local cache_exists = redis.call('EXISTS', cache_key)
        if cache_exists == 1 then
            return {0, "缓存已存在，跳过更新"}
        else
            return {-1, "等待其他进程更新缓存"}
        end
    end
]]

-- 使用示例
EVAL cache_update_script 2 "cache:user:123" "lock:cache:user:123" "user_data" 3600 10
```
> 优势：防止缓存击穿，避免重复更新

### 脚本性能和最佳实践
|方面	|优点	|缺点	|最佳实践
|---------|---------|---------|---------
|原子性	|完全原子性执行	|长脚本会阻塞服务器	|控制脚本执行时间
|性能	|减少网络往返	|复杂逻辑影响性能	|优化算法复杂度
|缓存	|脚本自动缓存	|内存占用增加	|定期清理无用脚本
|调试	|支持错误返回	|调试相对困难	|充分测试和日志记录
#### 注意事项
- 执行时间：避免编写执行时间过长的脚本
- 内存使用：注意脚本中的内存分配，避免内存泄漏
- 随机性：脚本中的随机数生成需要注意种子设置
- 错误处理：使用 pcall 处理可能出错的操作
- 键的访问：只能访问通过 KEYS 参数传递的键
#### 最佳实践建议
- 脚本设计：保持脚本简洁，单一职责
- 参数验证：在脚本开始时验证输入参数
- 错误处理：合理使用 redis.call 和 redis.pcall
- 性能优化：避免不必要的循环和复杂计算
- 版本管理：为脚本建立版本管理机制
- 测试覆盖：编写充分的测试用例
- 监控告警：监控脚本执行时间和错误率
#### 使用建议
- 适用场景：复杂的原子性操作、条件判断、批量处理
- 不适用场景：简单的单命令操作、长时间运行的任务
- 替代方案：简单操作使用事务，复杂业务逻辑考虑应用层处理
- 调试技巧：使用 redis.log 输出调试信息



## Redis 连接
### Redis 连接概述
Redis 连接是客户端与 Redis 服务器之间建立通信的基础。正确的连接管理对于应用程序的性能和稳定性至关重要。

#### 基本连接
使用 Redis CLI 连接到 Redis 服务器：
```bash
redis-cli -h localhost -p 6379 # 或者使用默认连接 redis-cli
```
连接成功后，你会看到 Redis 提示符：
```bash
127.0.0.1:6379>
```
#### 认证连接
如果 Redis 服务器设置了密码，需要进行认证：
```bash
# 连接时指定密码 
redis-cli -h localhost -p 6379 -a your_password 
# 或者连接后认证 
redis-cli 127.0.0.1:6379> AUTH your_password OK
```
#### 连接参数
Redis CLI 支持多种连接参数：

|参数	|说明	|示例
|---------|---------|---------
|-h	|指定主机地址	|-h 192.168.1.100
|-p	|指定端口号	|-p 6379
|-a	|指定密码	|-a mypassword
|-n	|指定数据库编号	|-n 1
|--latency	|延迟监控模式	|--latency
|--stat	|统计信息模式	|--stat
#### 连接池
在生产环境中，建议使用连接池来管理 Redis 连接：

连接池的优势
- 减少连接建立和销毁的开销
- 控制并发连接数量
- 提高应用程序性能
- 更好的资源管理
#### 连接超时设置
Redis 支持多种超时设置：
```bash
# 设置客户端空闲超时时间（秒） 
CONFIG SET timeout 300 
# 查看当前超时设置 
CONFIG GET timeout
```
> 注意： timeout 设置为 0 表示永不超时，但这可能导致连接泄露。

#### 连接信息查看
使用以下命令查看连接信息：
```bash
# 查看所有客户端连接 
CLIENT LIST 
# 查看连接数量 
INFO clients 
# 获取当前连接的客户端名称 
CLIENT GETNAME 
# 设置客户端名称 
CLIENT SETNAME "my-app-connection"
```
#### 连接安全
保护 Redis 连接的安全措施：

安全建议
- 使用强密码进行认证
- 限制客户端连接数量
- 使用防火墙限制访问
- 启用 TLS 加密传输
- 定期监控连接状态
#### 连接故障排除
常见连接问题及解决方案

|问题	|可能原因	|解决方案
|---------|---------|---------
连接被拒绝	|Redis 服务未启动	|启动 Redis 服务
认证失败	|密码错误	|检查密码配置
连接超时	|网络问题或服务器负载高	|检查网络和服务器状态
连接数过多	|达到最大连接数限制	|调整 maxclients 配置

## Redis 服务器
### Redis 服务器概述
Redis 服务器是整个 Redis 系统的核心，负责处理客户端请求、管理数据存储、执行命令等。了解服务器的配置和管理对于构建高性能的 Redis 应用至关重要。

### 服务器信息查看
使用 INFO 命令查看服务器详细信息：
```bash
# 查看所有服务器信息 
INFO 
# 查看特定部分信息 
INFO server 
INFO memory 
INFO stats 
INFO replication 
INFO cpu 
INFO keyspace
```
### 服务器配置
Redis 服务器配置可以通过配置文件或运行时命令进行设置：
```bash
# 查看配置项 
CONFIG GET * 
CONFIG GET maxmemory 
# 设置配置项 
CONFIG SET maxmemory 2gb 
CONFIG SET timeout 300 
# 保存配置到文件 
CONFIG REWRITE
```
|配置项	|说明	|示例值
|---------|---------|---------
|maxmemory	|最大内存限制	|2gb
|timeout	|客户端空闲超时	|300
|tcp-keepalive	|TCP keepalive	|60
|maxclients	|最大客户端连接数	|10000
|databases	|数据库数量	|16
### 内存管理
Redis 内存管理是服务器性能的关键因素：
```bash
# 查看内存使用情况 
INFO memory 
# 查看内存统计 
MEMORY STATS 
# 查看特定键的内存使用 
MEMORY USAGE mykey 
# 手动触发垃圾回收 
MEMORY PURGE
```
内存优化策略
- 设置合适的 maxmemory 限制
- 配置内存淘汰策略
- 使用合适的数据结构
- 定期清理过期键
- 监控内存碎片率
### 性能监控
监控 Redis 服务器性能的重要指标：
```bash
# 实时监控命令执行 
MONITOR 
# 查看慢查询日志 
SLOWLOG GET 10 SLOWLOG LEN SLOWLOG RESET 
# 查看延迟统计 
LATENCY LATEST LATENCY HISTORY command
```
|监控指标	|命令	|说明
|---------|---------|---------
QPS	|INFO stats	|每秒查询数
内存使用	|INFO memory	|内存占用情况
连接数	|INFO clients	|客户端连接数
慢查询	|SLOWLOG GET	|执行缓慢的命令
键空间	|INFO keyspace	|数据库键统计
### 服务器管理命令
常用的服务器管理命令：
```bash
# 保存数据到磁盘 
SAVE BGSAVE 
# 重写 AOF 文件 
BGREWRITEAOF 
# 刷新数据库 
FLUSHDB FLUSHALL 
# 关闭服务器 
SHUTDOWN 
SHUTDOWN SAVE 
SHUTDOWN NOSAVE 
# 调试命令 
DEBUG OBJECT mykey 
DEBUG SEGFAULT
```
> 警告： FLUSHALL 和 SHUTDOWN 命令会影响整个服务器，请谨慎使用。
### 日志管理
Redis 日志系统帮助监控和调试：

日志级别
- debug：详细调试信息
- verbose：详细信息
- notice：一般信息（默认）
- warning：警告信息
```bash
# 设置日志级别 
CONFIG SET loglevel notice 
# 设置日志文件 
CONFIG SET logfile /var/log/redis.log 
# 设置系统日志 
CONFIG SET syslog-enabled yes 
CONFIG SET syslog-ident redis
```
### 安全配置
保护 Redis 服务器的安全措施：
```bash
# 设置密码 
CONFIG SET requirepass your_password 
# 重命名危险命令 
rename-command FLUSHDB "" 
rename-command FLUSHALL "" 
rename-command CONFIG "CONFIG_abc123" 
# 绑定特定IP 
bind 127.0.0.1 192.168.1.100 
# 保护模式 
protected-mode yes
```
安全最佳实践
- 设置强密码
- 限制网络访问
- 重命名危险命令
- 启用保护模式
- 定期备份数据
- 监控异常访问

## Redis GEO
### Redis GEO 概述
Redis GEO 是 Redis 3.2 版本引入的地理位置功能，基于 Sorted Set 实现，可以存储地理位置信息并进行各种地理位置相关的操作，如距离计算、范围查询等。

### 添加地理位置
使用 GEOADD 命令添加地理位置信息：
```bash
# 添加单个位置 
GEOADD cities 116.397128 39.916527 "北京" 
# 添加多个位置 
GEOADD cities 121.473701 31.230416 "上海" \ 113.264385 23.129163 "广州" \ 114.085947 22.547 "深圳" 
# 查看添加结果 
ZRANGE cities 0 -1
```
坐标系统说明
- 使用 WGS84 坐标系统
- 经度范围：-180 到 180 度
- 纬度范围：-85.05112878 到 85.05112878 度
- 格式：经度 纬度 成员名
### 距离计算
计算两个地理位置之间的距离：
```bash
# 计算北京到上海的距离（默认米） 
GEODIST cities "北京" "上海" 
# 指定单位 
GEODIST cities "北京" "上海" km 
GEODIST cities "北京" "上海" mi 
GEODIST cities "北京" "上海" ft
```
|单位	|说明	|示例
|---------|---------|---------
|m	|米（默认）	|1067378.7564
|km	|千米	|1067.3788
|mi	|英里	|663.2115
|ft	|英尺	|3501243.7008
### 范围查询
查找指定范围内的地理位置：
```bash
# 以指定成员为中心查找范围内的位置 
GEORADIUS cities 116.397128 39.916527 1000 km 
# 以现有成员为中心查找 
GEORADIUSBYMEMBER cities "北京" 1000 km 
# 带距离信息 
GEORADIUS cities 116.397128 39.916527 1000 km WITHDIST 
# 带坐标信息 
GEORADIUS cities 116.397128 39.916527 1000 km WITHCOORD
# 带哈希值 
GEORADIUS cities 116.397128 39.916527 1000 km WITHHASH 
# 限制返回数量并排序 
GEORADIUS cities 116.397128 39.916527 1000 km COUNT 3 ASC
```
查询选项说明
- WITHDIST：返回距离信息
- WITHCOORD：返回坐标信息
- WITHHASH：返回哈希值
- COUNT：限制返回数量
- ASC/DESC：按距离排序
### 获取位置信息
获取存储的地理位置信息：
```bash
# 获取位置坐标 
GEOPOS cities "北京" "上海" 
# 获取位置哈希值 
GEOHASH cities "北京" "上海" "广州" 
# 查看所有成员 
ZRANGE cities 0 -1 
# 查看成员数量 
ZCARD cities
```
### 删除位置
删除地理位置信息：
```bash
# 删除单个位置 
ZREM cities "深圳" 
# 删除多个位置 
ZREM cities "广州" "上海" 
# 清空所有位置 
DEL cities
```
> 注意： GEO 数据结构基于 Sorted Set，所以使用 ZREM 命令删除成员。
### 实际应用场景
Redis GEO 在实际项目中的应用

- 附近的人：社交应用中查找附近用户
- 外卖配送：查找附近的餐厅和配送员
- 打车服务：匹配附近的司机和乘客
- 门店定位：查找附近的商店或服务点
- 物流追踪：跟踪货物和车辆位置
```bash
# 外卖应用示例 
# 添加餐厅位置 
GEOADD restaurants 116.397128 39.916527 "麦当劳-王府井店" 
GEOADD restaurants 116.407128 39.926527 "肯德基-东单店" 
GEOADD restaurants 116.387128 39.906527 "星巴克-前门店" 
# 用户查找附近2公里内的餐厅 
GEORADIUS restaurants 116.397128 39.916527 2 km WITHDIST ASC 
# 添加配送员位置 
GEOADD delivery_staff 116.397128 39.916527 "配送员001" 
GEOADD delivery_staff 116.407128 39.926527 "配送员002" 
# 为订单匹配最近的配送员 
GEORADIUS delivery_staff 116.397128 39.916527 5 km COUNT 1 ASC
```
> 注意： 以上示例仅展示了 GEO 功能的基本用法，实际应用中需要根据业务场景进行优化和调整。
### 性能优化
Redis GEO 性能优化建议

- 合理设置查询半径，避免过大范围查询
- 使用 COUNT 限制返回结果数量
- 定期清理过期或无效的位置数据
- 考虑数据分片，避免单个 key 过大
- 使用适当的数据过期策略
```bash
# 性能优化示例 
# 限制查询结果数量 
GEORADIUS cities 116.397128 39.916527 100 km COUNT 10 ASC 
# 按地区分片存储 
GEOADD beijing_area 116.397128 39.916527 "地点1" 
GEOADD shanghai_area 121.473701 31.230416 "地点2" 
# 设置过期时间（适用于临时位置） 
GEOADD temp_locations 116.397128 39.916527 "临时位置" EXPIRE temp_locations 3600
```
### GEO 命令总结
|命令	|功能	|示例
|---------|---------|---------
|GEOADD	|添加地理位置	|GEOADD key lng lat member
|GEODIST	|计算距离	|GEODIST key member1 member2 [unit]
|GEORADIUS	|范围查询	|GEORADIUS key lng lat radius unit
|GEORADIUSBYMEMBER	|以成员为中心查询	|GEORADIUSBYMEMBER key member radius unit
|GEOPOS	|获取坐标	|GEOPOS key member [member ...]
|GEOHASH	|获取哈希值	|GEOHASH key member [member ...]



## Redis Stream
### Redis Stream 概述
Redis Stream 是 Redis 5.0 引入的新数据结构，专门用于处理流数据。它结合了消息队列和时间序列数据的特点，提供了强大的流处理能力，支持消费者组、消息确认、持久化等高级功能。

### 命令使用
#### 添加消息
使用 XADD 命令向流中添加消息：
```bash
# 添加消息（自动生成ID） 
XADD mystream * name "张三" age 25 city "北京" 
# 指定消息ID 
XADD mystream 1609459200000-0 name "李四" age 30 city "上海" 
# 添加多个字段 
XADD mystream * user_id 1001 action "login" timestamp 1609459200 ip "192.168.1.100" 
# 限制流的最大长度 
XADD mystream MAXLEN 1000 * event "purchase" amount 99.99
```
消息ID格式
- 时间戳-序列号：如 1609459200000-0
- *：自动生成ID
- 毫秒时间戳：确保消息的时间顺序
- 序列号：同一毫秒内的消息序号
#### 读取消息
使用 XREAD 命令读取流中的消息：
```bash
# 从头开始读取所有消息 
XREAD STREAMS mystream 0 
# 读取指定ID之后的消息 
XREAD STREAMS mystream 1609459200000-0 
# 阻塞读取新消息 
XREAD BLOCK 0 STREAMS mystream $ 
# 设置阻塞超时时间（毫秒） 
XREAD BLOCK 5000 STREAMS mystream $ 
# 限制读取数量 
XREAD COUNT 10 STREAMS mystream 0 
# 同时读取多个流 
XREAD STREAMS stream1 stream2 0 0
```
特殊ID说明
- 0：从流的开始读取
- $：只读取新添加的消息
- >：在消费者组中表示未被消费的消息
#### 消费者组
Redis Stream 支持消费者组模式，实现负载均衡和消息确认：
```bash
# 创建消费者组 
XGROUP CREATE mystream mygroup 0 MKSTREAM 
# 从最新消息开始创建组 
XGROUP CREATE mystream mygroup $ 
# 消费者读取消息 
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream > 
# 确认消息处理完成 
XACK mystream mygroup 1609459200000-0 
# 查看消费者组信息 
XINFO GROUPS mystream 
# 查看消费者信息 
XINFO CONSUMERS mystream mygroup 
# 查看待确认消息 
XPENDING mystream mygroup
```
#### 查询和管理
Stream 提供了丰富的查询和管理命令：
```bash
# 查看流信息 
XINFO STREAM mystream 
# 获取流长度 
XLEN mystream 
# 范围查询 
XRANGE mystream - + XRANGE mystream 1609459200000 1609459300000 
# 反向范围查询 
XREVRANGE mystream + - COUNT 10 
# 删除消息 
XDEL mystream 1609459200000-0 
# 修剪流（删除旧消息） 
XTRIM mystream MAXLEN 1000 
XTRIM mystream MAXLEN ~ 1000 # 近似修剪，性能更好
```
#### 异常处理
处理消费过程中的异常情况：
```bash
# 查看待确认消息详情 
XPENDING mystream mygroup - + 10 consumer1 
# 转移超时消息给其他消费者 
XCLAIM mystream mygroup consumer2 60000 1609459200000-0 
# 自动转移超时消息 
XAUTOCLAIM mystream mygroup consumer2 60000 0 
# 删除消费者 
XGROUP DELCONSUMER mystream mygroup consumer1 
# 删除消费者组 
XGROUP DESTROY mystream mygroup
```
>注意： 未确认的消息会一直保留在待确认列表中，需要定期处理超时消息。
### 实际应用场景
Redis Stream 在实际项目中的应用
- 事件溯源：记录系统中的所有事件
- 消息队列：异步任务处理
- 日志收集：实时日志流处理
- 监控数据：时间序列数据存储
- 用户行为追踪：记录用户操作轨迹
```bash
# 用户行为追踪示例 
# 记录用户行为 
XADD user_actions * user_id 1001 action "page_view" page "/home" timestamp 1609459200 
XADD user_actions * user_id 1001 action "click" element "buy_button" timestamp 1609459210 
XADD user_actions * user_id 1001 action "purchase" product_id 2001 amount 99.99 timestamp 1609459220 
# 创建分析消费者组 
XGROUP CREATE user_actions analytics_group 0 MKSTREAM 
# 分析消费者读取数据 
XREADGROUP GROUP analytics_group analyzer1 COUNT 10 STREAMS user_actions > 
# 确认处理完成 
XACK user_actions analytics_group 1609459200000-0 1609459210000-0
```
### 性能优化
Redis Stream 性能优化建议
- 合理设置流的最大长度，避免内存过度使用
- 使用近似修剪（~）提高性能
- 批量读取消息，减少网络往返
- 及时确认消息，避免待确认列表过大
- 监控消费者组状态，处理异常消费者
```bash
# 性能优化示例 
# 批量添加消息 
XADD mystream * field1 value1 
XADD mystream * field2 value2 
XADD mystream * field3 value3 
# 批量读取 
XREADGROUP GROUP mygroup consumer1 COUNT 100 STREAMS mystream > 
# 近似修剪 
XTRIM mystream MAXLEN ~ 10000 
# 设置合理的阻塞时间 
XREAD BLOCK 1000 STREAMS mystream $
```
### Stream 命令总结
|命令	|功能	|示例
|---------|---------|---------
|XADD	|添加消息	|XADD stream * field value
|XREAD	|读取消息	|XREAD STREAMS stream 0
|XGROUP CREATE	|创建消费者组	|XGROUP CREATE stream group 0
|XREADGROUP	|消费者组读取	|XREADGROUP GROUP group consumer STREAMS stream >
|XACK	|确认消息	|XACK stream group id
|XLEN	|获取流长度	|XLEN stream
|XRANGE	|范围查询	|XRANGE stream - + XRANGE stream 1609459200000 1609459300000
|XREVRANGE	|反向范围查询	|XREVRANGE stream + - COUNT 10
|XDEL	|删除消息	|XDEL stream 1609459200000-0
|XTRIM	|修剪流	|XTRIM stream MAXLEN 1000
|XTRIM	|近似修剪	|XTRIM stream MAXLEN ~ 1000
|XPENDING	|查看待确认消息	|XPENDING stream group
|XINFO	|查看流信息	|XINFO STREAM stream


