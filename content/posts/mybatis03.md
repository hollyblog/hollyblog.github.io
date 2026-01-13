---
title: "MyBatis-高级特性与缓存"
date: 2021-02-22T15:30:39+08:00
draft: false
description: "MyBatis-高级特性与缓存:缓存机制、插件开发、关联映射、注解开发。"
tags: ["MyBatis","数据库"]
categories: ["Framework"]
---

## 缓存机制
### 缓存机制概述
缓存是提高应用性能的重要手段，MyBatis提供了完善的缓存机制。通过缓存，可以减少数据库访问次数，提高查询性能。MyBatis支持一级缓存和二级缓存两种缓存级别。

#### 缓存的作用
- 减少数据库访问：避免重复查询相同数据
- 提高响应速度：从内存获取数据比数据库查询快
- 降低数据库负载：减少数据库连接和查询压力
- 改善用户体验：更快的响应时间
#### MyBatis缓存层次
- 一级缓存：SqlSession级别，默认开启
- 二级缓存：Mapper级别，需要手动配置
- 自定义缓存：可以集成第三方缓存框架
### 一级缓存
一级缓存是SqlSession级别的缓存，在同一个SqlSession中，相同的查询会从缓存中获取结果。

#### 一级缓存的特点
- 默认开启，无法关闭
- 作用域为SqlSession
- 基于HashMap实现
- 生命周期与SqlSession相同
#### 一级缓存的工作原理
```java
// 演示一级缓存的工作
public class FirstLevelCacheDemo {
    public static void main(String[] args) throws IOException {
        SqlSessionFactory factory = MyBatisUtils.getSqlSessionFactory();
        SqlSession session = factory.openSession();
        
        try {
            UserMapper mapper = session.getMapper(UserMapper.class);
            
            // 第一次查询，从数据库获取
            System.out.println("=== 第一次查询 ===");
            User user1 = mapper.selectUserById(1L);
            System.out.println("用户1: " + user1.getName());
            
            // 第二次查询，从一级缓存获取
            System.out.println("=== 第二次查询 ===");
            User user2 = mapper.selectUserById(1L);
            System.out.println("用户2: " + user2.getName());
            
            // 验证是否为同一个对象
            System.out.println("是否为同一对象: " + (user1 == user2));
            
        } finally {
            session.close();
        }
    }
}
```
#### 一级缓存失效的情况
- SqlSession关闭：缓存随之清空
- 执行增删改操作：会清空当前SqlSession的缓存
- 手动清除：调用clearCache()方法
- 查询参数不同：不同参数的查询不会命中缓存
```java
// 演示一级缓存失效
public void testFirstLevelCacheInvalidation() {
    SqlSession session = factory.openSession();
    UserMapper mapper = session.getMapper(UserMapper.class);
    
    // 第一次查询
    User user1 = mapper.selectUserById(1L);
    
    // 执行更新操作，缓存失效
    mapper.updateUser(new User(2L, "Updated Name", 25, "new@email.com"));
    
    // 再次查询，需要重新从数据库获取
    User user2 = mapper.selectUserById(1L);
    
    session.close();
}
```
### 二级缓存
二级缓存是Mapper级别的缓存，可以在多个SqlSession之间共享。

#### 二级缓存的特点
- 默认关闭，需要手动开启
- 作用域为Mapper（Namespace）
- 可以跨SqlSession共享
- 需要实体类实现Serializable接口
#### 开启二级缓存
1. 全局配置
```xml
<!-- 在mybatis-config.xml中开启二级缓存 -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>
```
2. Mapper配置
```xml
<!-- 在UserMapper.xml中配置缓存 -->
<mapper namespace="com.example.mybatis.mapper.UserMapper">
    
    <!-- 开启二级缓存 -->
    <cache/>
    
    <!-- 或者使用详细配置 -->
    <cache 
        eviction="LRU"
        flushInterval="60000"
        size="512"
        readOnly="false"/>
    
    <select id="selectUserById" resultType="User">
        SELECT id, name, age, email FROM users WHERE id = #{id}
    </select>
    
</mapper>
```
3. 实体类配置
```java
// 实体类必须实现Serializable接口
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Long id;
    private String name;
    private Integer age;
    private String email;
    
    // 构造方法、getter、setter等
}
```
#### 缓存配置属性
|属性	|描述	|默认值	|可选值
| --- | --- | --- | ---
|eviction	|缓存回收策略	|LRU	|LRU、FIFO、SOFT、WEAK
|flushInterval	|刷新间隔（毫秒）	|无	|正整数
|size	|缓存对象数量	|1024	|正整数
|readOnly	|是否只读	|false	|true、false
#### 缓存回收策略详解
- LRU：最近最少使用，移除最长时间不被使用的对象
- FIFO：先进先出，按对象进入缓存的顺序来移除
- SOFT：软引用，基于垃圾回收器状态和软引用规则移除对象
- WEAK：弱引用，更积极地基于垃圾收集器状态和弱引用规则移除对象
#### 二级缓存的使用示例
```java
// 演示二级缓存的工作
public class SecondLevelCacheDemo {
    public static void main(String[] args) throws IOException {
        SqlSessionFactory factory = MyBatisUtils.getSqlSessionFactory();
        
        // 第一个SqlSession
        SqlSession session1 = factory.openSession();
        try {
            UserMapper mapper1 = session1.getMapper(UserMapper.class);
            User user1 = mapper1.selectUserById(1L);
            System.out.println("Session1查询: " + user1.getName());
        } finally {
            session1.close(); // 关闭session1，数据进入二级缓存
        }
        
        // 第二个SqlSession
        SqlSession session2 = factory.openSession();
        try {
            UserMapper mapper2 = session2.getMapper(UserMapper.class);
            User user2 = mapper2.selectUserById(1L); // 从二级缓存获取
            System.out.println("Session2查询: " + user2.getName());
        } finally {
            session2.close();
        }
    }
}
```
#### 控制缓存行为
1. 禁用特定查询的缓存
```xml
<select id="selectUserById" resultType="User" useCache="false">
    SELECT id, name, age, email FROM users WHERE id = #{id}
</select>
```
2. 控制缓存刷新
```xml      
<insert id="insertUser" flushCache="true">
    INSERT INTO users (name, age, email) VALUES (#{name}, #{age}, #{email})
</insert>

<update id="updateUser" flushCache="true">
    UPDATE users SET name=#{name}, age=#{age}, email=#{email} WHERE id=#{id}
</update>

<delete id="deleteUser" flushCache="true">
    DELETE FROM users WHERE id = #{id}
</delete>
```
### 自定义缓存
MyBatis允许使用自定义缓存实现，可以集成Redis、Ehcache等第三方缓存框架。

#### 实现Cache接口
```java
public class CustomCache implements Cache {
    private final String id;
    private final Map<Object, Object> cache = new ConcurrentHashMap<>();
    
    public CustomCache(String id) {
        this.id = id;
    }
    
    @Override
    public String getId() {
        return id;
    }
    
    @Override
    public void putObject(Object key, Object value) {
        cache.put(key, value);
        System.out.println("缓存存储: " + key);
    }
    
    @Override
    public Object getObject(Object key) {
        Object value = cache.get(key);
        System.out.println("缓存获取: " + key + " -> " + (value != null ? "命中" : "未命中"));
        return value;
    }
    
    @Override
    public Object removeObject(Object key) {
        System.out.println("缓存移除: " + key);
        return cache.remove(key);
    }
    
    @Override
    public void clear() {
        System.out.println("清空缓存");
        cache.clear();
    }
    
    @Override
    public int getSize() {
        return cache.size();
    }
}
```
#### 使用自定义缓存
```xml
<mapper namespace="com.example.mybatis.mapper.UserMapper">
    
    <!-- 使用自定义缓存 -->
    <cache type="com.example.mybatis.cache.CustomCache"/>
    
    <select id="selectUserById" resultType="User">
        SELECT id, name, age, email FROM users WHERE id = #{id}
    </select>
    
</mapper>
```
### Redis缓存集成
在分布式环境中，可以使用Redis作为二级缓存的存储介质。

#### Redis缓存实现
```java
public class RedisCache implements Cache {
    private final String id;
    private static JedisPool jedisPool;
    
    static {
        // 初始化Redis连接池
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(100);
        config.setMaxIdle(10);
        jedisPool = new JedisPool(config, "localhost", 6379);
    }
    
    public RedisCache(String id) {
        this.id = id;
    }
    
    @Override
    public String getId() {
        return id;
    }
    
    @Override
    public void putObject(Object key, Object value) {
        try (Jedis jedis = jedisPool.getResource()) {
            String keyStr = id + ":" + key.toString();
            String valueStr = serialize(value);
            jedis.setex(keyStr, 3600, valueStr); // 1小时过期
        }
    }
    
    @Override
    public Object getObject(Object key) {
        try (Jedis jedis = jedisPool.getResource()) {
            String keyStr = id + ":" + key.toString();
            String valueStr = jedis.get(keyStr);
            return valueStr != null ? deserialize(valueStr) : null;
        }
    }
    
    @Override
    public Object removeObject(Object key) {
        try (Jedis jedis = jedisPool.getResource()) {
            String keyStr = id + ":" + key.toString();
            return jedis.del(keyStr);
        }
    }
    
    @Override
    public void clear() {
        try (Jedis jedis = jedisPool.getResource()) {
            Set<String> keys = jedis.keys(id + ":*");
            if (!keys.isEmpty()) {
                jedis.del(keys.toArray(new String[0]));
            }
        }
    }
    
    @Override
    public int getSize() {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.keys(id + ":*").size();
        }
    }
    
    // 序列化和反序列化方法
    private String serialize(Object obj) {
        // 实现对象序列化
        return JSON.toJSONString(obj);
    }
    
    private Object deserialize(String str) {
        // 实现对象反序列化
        return JSON.parseObject(str, Object.class);
    }
}
```
#### 配置Redis缓存
```xml
<mapper namespace="com.example.mybatis.mapper.UserMapper">
    
    <!-- 使用Redis缓存 -->
    <cache type="com.example.mybatis.cache.RedisCache"
           eviction="LRU"
           flushInterval="600000"
           size="1000"
           readOnly="false"/>
    
</mapper>
```
### 缓存最佳实践
1. 缓存策略选择
- 读多写少的数据适合使用缓存
- 频繁变更的数据不适合长时间缓存
- 大对象缓存需要考虑内存占用
- 关联查询结果缓存需要谨慎处理
2. 缓存配置优化
- 合理设置缓存大小和过期时间
- 选择合适的回收策略
- 根据业务场景选择readOnly属性
- 监控缓存命中率和性能指标
3. 缓存一致性
- 及时清除过期缓存
- 处理好增删改操作对缓存的影响
- 考虑分布式环境下的缓存同步
- 避免缓存雪崩和缓存穿透
4. 性能监控
- 监控缓存命中率
- 观察缓存大小和内存使用
- 分析缓存失效原因
- 定期清理无效缓存
### 缓存问题与解决方案
> Q: 缓存不生效怎么办？
> 
> A: 检查全局配置是否开启、Mapper是否配置cache标签、实体类是否实现Serializable接口。

> Q: 如何避免缓存数据不一致？
> 
> A: 合理设置flushCache属性，在增删改操作后及时清除相关缓存。

> Q: 二级缓存序列化异常？
> 
> A: 确保所有相关实体类都实现了Serializable接口，包括关联对象。

> Q: 缓存占用内存过大？
> 
> A: 调整缓存大小配置，选择合适的回收策略，避免缓存大对象。

> Q: 分布式环境缓存同步问题？
> 
> A: 使用Redis等分布式缓存，或者实现缓存失效通知机制。

### 实践练习
- 练习1：一级缓存验证
编写代码验证一级缓存的生效和失效条件。
```java
public class CacheDemo { 
    public static void main(String[] args) {
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(new FileInputStream("chapter-09-cache.json"));
        try (SqlSession sqlSession = sqlSessionFactory.openSession()) { 
            UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
            
            // 第一次查询，命中数据库
            User user1 = userMapper.selectUserById(1L);
            System.out.println("第一次查询: " + user1.getName());
            
            // 第二次查询，命中一级缓存
            User user2 = userMapper.selectUserById(1L);
            System.out.println("第二次查询: " + user2.getName());
            
            // 验证是否为同一对象
            System.out.println("是否为同一对象: " + (user1 == user2));
            
            // 执行更新操作，清空一级缓存
            userMapper.updateUser(new User(2L, "Updated Name", 25, "updated@example.com"));
            
            // 第三次查询，命中数据库（一级缓存已清空）
            User user3 = userMapper.selectUserById(2L);
            System.out.println("第三次查询: " + user3.getName());
            
            // 验证是否为不同对象
            System.out.println("是否为不同对象: " + (user2 != user3));
        } catch (IOException e) {
            e.printStackTrace();
    }
}
```
- 练习2：二级缓存配置
配置二级缓存，测试不同SqlSession间的缓存共享。
```xml
<mapper namespace="com.example.mybatis.mapper.UserMapper"> 
<cache eviction="LRU" flushInterval="600000" size="1000" readOnly="true"/>
```
```java
public class CacheTest { 
    public static void main(String[] args) { 
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(new FileInputStream("chapter-09-cache.json"));
        
        // 第一个SqlSession
        try (SqlSession sqlSession1 = sqlSessionFactory.openSession()) { 
            UserMapper userMapper1 = sqlSession1.getMapper(UserMapper.class);
            User user1 = userMapper1.selectUserById(1L);
            System.out.println("SqlSession1查询: " + user1.getName());
        }catch (IOException e) {
            e.printStackTrace();
        }
        
        // 第二个SqlSession
        try (SqlSession sqlSession2 = sqlSessionFactory.openSession()) { 
            UserMapper userMapper2 = sqlSession2.getMapper(UserMapper.class);
            User user2 = userMapper2.selectUserById(1L); // 应该命中二级缓存
            System.out.println("SqlSession2查询: " + user2.getName());
        } catch (IOException e) {
            e.printStackTrace();
        }  
    }
}
```
- 练习3：自定义缓存实现
实现一个带有统计功能的自定义缓存。
```java
public class CustomCache implements Cache { 
    private final Map<Object, Object> cache = new HashMap<>();
    private final Map<Object, Long> hitCount = new HashMap<>();
    
    @Override
    public String getId() {
        return "CustomCache";
    }
    
    @Override
    public void putObject(Object key, Object value) {
        cache.put(key, value);
        hitCount.put(key, 0L);
    }
    
    @Override
    public Object getObject(Object key) {
        hitCount.put(key, hitCount.getOrDefault(key, 0L) + 1);
        return cache.get(key);
    }
    
    @Override
    public void clear() {
        cache.clear();
        hitCount.clear();
    }
    @Override
    public int getSize() {
        return cache.size();
    }
    @Override
    public long getHitCount(Object key) {
        return hitCount.getOrDefault(key, 0L);
    }
}
```
- 练习4：Redis缓存集成
集成Redis作为二级缓存，测试分布式缓存效果。
```java
public class RedisCacheTest { 
    // 测试Redis作为二级缓存
    public static void main(String[] args) {
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(new FileInputStream("chapter-09-cache.json"));
        try (SqlSession sqlSession = sqlSessionFactory.openSession()) { 
            UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
            
            // 第一次查询，命中数据库
            User user1 = userMapper.selectUserById(1L);
            System.out.println("第一次查询: " + user1.getName());
            //第一次命中一级缓存
            User user1 = userMapper.selectUserById(1L);
            //redis是二级缓存，所以第二次查询应该命中Redis缓存
            // 第二次查询，命中Redis缓存
            User user2 = userMapper.selectUserById(1L);
            System.out.println("第二次查询: " + user2.getName());
            
            // 验证是否为同一对象
            System.out.println("是否为同一对象: " + (user1 == user2));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```
- 练习5：缓存性能测试
对比有缓存和无缓存的性能差异，分析缓存命中率。

### 运行示例程序
- 步骤1：导入项目
将chapter-09-cache.json导入到IntelliJ IDEA中。

- 步骤2：配置环境
确保MySQL和Redis服务正常运行，执行init.sql创建测试数据。

- 步骤3：运行基础示例
运行CacheDemo.java，观察一级缓存和二级缓存的工作效果。

- 步骤4：观察缓存日志
查看控制台输出，理解缓存的命中和失效机制。

- 步骤5：测试自定义缓存
运行自定义缓存示例，观察缓存的存储和获取过程。

- 步骤6：Redis缓存测试
配置Redis缓存，测试分布式缓存的效果。

- 步骤7：运行测试用例
执行CacheTest.java中的测试用例，验证各种缓存场景。

### 本章小结
本章我们学习了 缓存机制 的相关内容，包括：

- 核心概念和基本原理
- 配置方法和实践技巧
- 应用场景和最佳实践
- 常见问题和解决方案

## 插件开发
### 插件机制概述
MyBatis插件机制基于JDK动态代理和责任链模式，允许开发者在SQL执行的关键节点进行拦截和增强。通过插件，可以实现性能监控、SQL审计、分页查询、缓存增强等功能。

#### 插件的优势
- 非侵入性：不需要修改原有代码
- 可插拔：可以灵活地启用或禁用功能
- 可扩展：支持自定义功能扩展
- 链式处理：多个插件可以协同工作
#### 可拦截的对象
MyBatis允许拦截以下四种对象的方法调用：

- Executor：执行器，负责SQL的执行和缓存维护
- ParameterHandler：参数处理器，负责参数的设置
- ResultSetHandler：结果集处理器，负责结果的映射
- StatementHandler：语句处理器，负责SQL语句的准备和执行
### 插件开发基础
#### 实现Interceptor接口
```java
@Intercepts({
    @Signature(
        type = Executor.class,
        method = "update",
        args = {MappedStatement.class, Object.class}
        .main-content {
            padding-right: 15px;
        }
        .main-content .container {
            padding-left: 0;
            padding-right: 0;
        }
    ),
    @Signature(
        type = Executor.class,
        method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}
    )
})
public class PerformanceInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            // 执行原方法
            Object result = invocation.proceed();
            return result;
        } finally {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            
            // 记录执行时间
            MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
            System.out.println("SQL执行时间: " + ms.getId() + " -> " + duration + "ms");
        }
    }
    
    @Override
    public Object plugin(Object target) {
        // 使用Plugin.wrap方法创建代理对象
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 设置插件属性
        String threshold = properties.getProperty("threshold", "100");
        System.out.println("性能监控阈值: " + threshold + "ms");
    }
}
```
#### 注解说明
- @Intercepts：标记这是一个拦截器
- @Signature：指定要拦截的方法签名
- type：要拦截的对象类型
- method：要拦截的方法名
- args：方法的参数类型数组
#### 插件注册
```xml
<!-- 在mybatis-config.xml中注册插件 -->
<configuration>
    <plugins>
        <!-- 性能监控插件 -->
        <plugin interceptor="com.example.mybatis.plugin.PerformanceInterceptor">
            <property name="threshold" value="100"/>
        </plugin>
        
        <!-- SQL日志插件 -->
        <plugin interceptor="com.example.mybatis.plugin.SqlLogInterceptor">
            <property name="logLevel" value="DEBUG"/>
        </plugin>
        
        <!-- 分页插件 -->
        <plugin interceptor="com.example.mybatis.plugin.PaginationInterceptor"/>
    </plugins>
</configuration>
```
### 常用插件开发实例
#### 1. SQL日志插件
```java
@Intercepts({
    @Signature(
        type = StatementHandler.class,
        method = "prepare",
        args = {Connection.class, Integer.class}
    )
})
public class SqlLogInterceptor implements Interceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(SqlLogInterceptor.class);
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
        BoundSql boundSql = statementHandler.getBoundSql();
        
        // 获取SQL语句
        String sql = boundSql.getSql();
        
        // 获取参数
        Object parameterObject = boundSql.getParameterObject();
        
        // 格式化SQL
        String formattedSql = formatSql(sql);
        
        // 记录SQL日志
        logger.info("执行SQL: {}", formattedSql);
        logger.info("参数: {}", parameterObject);
        
        return invocation.proceed();
    }
    
    private String formatSql(String sql) {
        // 简单的SQL格式化
        return sql.replaceAll("\s+", " ").trim();
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 可以配置日志级别等属性
    }
}
```
#### 2. 分页插件
```java
@Intercepts({
    @Signature(
        type = Executor.class,
        method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}
    )
})
public class PaginationInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        Object parameter = args[1];
        RowBounds rowBounds = (RowBounds) args[2];
        
        // 检查是否需要分页
        if (rowBounds == null || rowBounds == RowBounds.DEFAULT) {
            return invocation.proceed();
        }
        
        Executor executor = (Executor) invocation.getTarget();
        BoundSql boundSql = ms.getBoundSql(parameter);
        
        // 构建count查询
        String countSql = buildCountSql(boundSql.getSql());
        
        // 执行count查询
        Long total = executeCountQuery(executor, ms, parameter, countSql);
        
        // 构建分页查询
        String pageSql = buildPageSql(boundSql.getSql(), rowBounds);
        
        // 创建新的MappedStatement
        MappedStatement newMs = copyMappedStatement(ms, new BoundSqlSource(boundSql, pageSql));
        args[0] = newMs;
        args[2] = RowBounds.DEFAULT;
        
        // 执行分页查询
        List result = (List) invocation.proceed();
        
        // 封装分页结果
        return new PageResult<>(result, total, rowBounds.getOffset(), rowBounds.getLimit());
    }
    
    private String buildCountSql(String originalSql) {
        return "SELECT COUNT(*) FROM (" + originalSql + ") tmp_count";
    }
    
    private String buildPageSql(String originalSql, RowBounds rowBounds) {
        return originalSql + " LIMIT " + rowBounds.getOffset() + ", " + rowBounds.getLimit();
    }
    
    private Long executeCountQuery(Executor executor, MappedStatement ms, 
                                  Object parameter, String countSql) throws SQLException {
        // 实现count查询逻辑
        // ...
        return 0L;
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 配置数据库方言等
    }
}
```
#### 3. SQL审计插件
```java
@Intercepts({
    @Signature(
        type = Executor.class,
        method = "update",
        args = {MappedStatement.class, Object.class}
    )
})
public class SqlAuditInterceptor implements Interceptor {
    
    private static final Logger auditLogger = LoggerFactory.getLogger("SQL_AUDIT");
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];
        
        // 记录操作前信息
        AuditInfo auditInfo = new AuditInfo();
        auditInfo.setStatementId(ms.getId());
        auditInfo.setSqlCommandType(ms.getSqlCommandType().name());
        auditInfo.setStartTime(new Date(startTime));
        auditInfo.setUserId(getCurrentUserId());
        auditInfo.setParameter(parameter);
        
        try {
            // 执行SQL
            Object result = invocation.proceed();
            
            // 记录成功信息
            auditInfo.setSuccess(true);
            auditInfo.setAffectedRows(getAffectedRows(result));
            
            return result;
        } catch (Exception e) {
            // 记录异常信息
            auditInfo.setSuccess(false);
            auditInfo.setErrorMessage(e.getMessage());
            throw e;
        } finally {
            // 记录结束时间和耗时
            long endTime = System.currentTimeMillis();
            auditInfo.setEndTime(new Date(endTime));
            auditInfo.setDuration(endTime - startTime);
            
            // 输出审计日志
            auditLogger.info("SQL审计: {}", JSON.toJSONString(auditInfo));
        }
    }
    
    private String getCurrentUserId() {
        // 获取当前用户ID，可以从ThreadLocal或Security Context中获取
        return "system";
    }
    
    private int getAffectedRows(Object result) {
        if (result instanceof Integer) {
            return (Integer) result;
        }
        return 0;
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 配置审计相关属性
    }
    
    // 审计信息实体类
    public static class AuditInfo {
        private String statementId;
        private String sqlCommandType;
        private Date startTime;
        private Date endTime;
        private long duration;
        private String userId;
        private Object parameter;
        private boolean success;
        private int affectedRows;
        private String errorMessage;
        
        // getter和setter方法
    }
}
```
### 高级插件开发技巧
#### 1. 插件链和执行顺序
多个插件会形成一个拦截器链，执行顺序与注册顺序相反（后注册的先执行）。
```java
// 插件执行顺序示例
// 注册顺序：Plugin1 -> Plugin2 -> Plugin3
// 执行顺序：Plugin3 -> Plugin2 -> Plugin1 -> 目标方法 -> Plugin1 -> Plugin2 -> Plugin3

public class PluginChainDemo {
    public static void demonstratePluginChain() {
        // Plugin3.intercept() 开始
        //   Plugin2.intercept() 开始
        //     Plugin1.intercept() 开始
        //       目标方法执行
        //     Plugin1.intercept() 结束
        //   Plugin2.intercept() 结束
        // Plugin3.intercept() 结束
    }
}
```
#### 2. 条件拦截
```java
@Intercepts({
    @Signature(
        type = Executor.class,
        method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}
    )
})
public class ConditionalInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        
        // 只拦截特定的Mapper方法
        if (shouldIntercept(ms)) {
            // 执行拦截逻辑
            return doIntercept(invocation);
        }
        
        // 不拦截，直接执行原方法
        return invocation.proceed();
    }
    
    private boolean shouldIntercept(MappedStatement ms) {
        String id = ms.getId();
        // 只拦截UserMapper的方法
        return id.contains("UserMapper");
    }
    
    private Object doIntercept(Invocation invocation) throws Throwable {
        // 具体的拦截逻辑
        System.out.println("拦截UserMapper方法");
        return invocation.proceed();
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 配置属性
    }
}
```
#### 3. 参数和结果处理
```java
@Intercepts({
    @Signature(
        type = ParameterHandler.class,
        method = "setParameters",
        args = {PreparedStatement.class}
    )
})
public class ParameterInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        ParameterHandler parameterHandler = (ParameterHandler) invocation.getTarget();
        
        // 获取参数对象
        Field field = parameterHandler.getClass().getDeclaredField("parameterObject");
        field.setAccessible(true);
        Object parameterObject = field.get(parameterHandler);
        
        // 处理参数（例如：敏感信息加密）
        if (parameterObject instanceof User) {
            User user = (User) parameterObject;
            if (user.getPassword() != null) {
                user.setPassword(encrypt(user.getPassword()));
            }
        }
        
        return invocation.proceed();
    }
    
    private String encrypt(String password) {
        // 简单的加密示例
        return "encrypted_" + password;
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 配置加密算法等
    }
}
```
### 插件配置和管理
#### 1. 外部配置文件
```properties
# plugin-config.properties
# 性能监控配置
performance.threshold=100
performance.slowSqlLog=true

# SQL日志配置
sqllog.level=DEBUG
sqllog.format=pretty

# 分页配置
pagination.dialect=mysql
pagination.reasonable=true

# 审计配置
audit.enabled=true
audit.logFile=/var/log/mybatis-audit.log
```
#### 2. 动态配置加载
```java
public class ConfigurableInterceptor implements Interceptor {
    
    private Properties config;
    
    @Override
    public void setProperties(Properties properties) {
        this.config = new Properties();
        
        // 加载默认配置
        loadDefaultConfig();
        
        // 加载外部配置文件
        loadExternalConfig();
        
        // 应用传入的配置（优先级最高）
        this.config.putAll(properties);
    }
    
    private void loadDefaultConfig() {
        config.setProperty("threshold", "100");
        config.setProperty("enabled", "true");
    }
    
    private void loadExternalConfig() {
        try {
            InputStream is = getClass().getClassLoader()
                .getResourceAsStream("plugin-config.properties");
            if (is != null) {
                config.load(is);
            }
        } catch (IOException e) {
            // 处理异常
        }
    }
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 使用配置
        boolean enabled = Boolean.parseBoolean(config.getProperty("enabled", "true"));
        if (!enabled) {
            return invocation.proceed();
        }
        
        // 其他逻辑
        return invocation.proceed();
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
}
```
### 插件性能优化
1. 减少反射调用
- 缓存反射获取的Field和Method
- 使用高性能的反射库（如ReflectASM）
- 避免在热点路径中使用反射
2. 优化字符串操作
- 使用StringBuilder进行字符串拼接
- 缓存格式化后的SQL语句
- 避免不必要的字符串创建
3. 异步处理
- 将耗时操作（如日志写入）异步化
- 使用线程池处理后台任务
- 避免阻塞主执行流程
4. 内存管理
- 及时释放大对象引用
- 使用对象池减少GC压力
- 监控内存使用情况
### 插件调试和测试
#### 1. 调试技巧
```java
public class DebugInterceptor implements Interceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(DebugInterceptor.class);
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 打印调用信息
        Object target = invocation.getTarget();
        Method method = invocation.getMethod();
        Object[] args = invocation.getArgs();
        
        logger.debug("拦截调用: {}.{}({})", 
            target.getClass().getSimpleName(),
            method.getName(),
            Arrays.toString(args));
        
        // 打印调用栈
        if (logger.isTraceEnabled()) {
            StackTraceElement[] stack = Thread.currentThread().getStackTrace();
            for (int i = 0; i < Math.min(stack.length, 10); i++) {
                logger.trace("  at {}", stack[i]);
            }
        }
        
        return invocation.proceed();
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 配置调试级别
    }
}
```
#### 2. 单元测试
```java
public class PerformanceInterceptorTest {
    
    private PerformanceInterceptor interceptor;
    private Invocation mockInvocation;
    
    @Before
    public void setUp() {
        interceptor = new PerformanceInterceptor();
        
        // 设置属性
        Properties props = new Properties();
        props.setProperty("threshold", "50");
        interceptor.setProperties(props);
        
        // 创建模拟对象
        mockInvocation = mock(Invocation.class);
    }
    
    @Test
    public void testIntercept() throws Throwable {
        // 模拟方法调用
        when(mockInvocation.proceed()).thenReturn("result");
        
        MappedStatement ms = mock(MappedStatement.class);
        when(ms.getId()).thenReturn("com.example.UserMapper.selectById");
        when(mockInvocation.getArgs()).thenReturn(new Object[]{ms, 1L});
        
        // 执行拦截
        Object result = interceptor.intercept(mockInvocation);
        
        // 验证结果
        assertEquals("result", result);
        verify(mockInvocation).proceed();
    }
    
    @Test
    public void testPlugin() {
        Object target = new Object();
        Object plugin = interceptor.plugin(target);
        
        // 验证返回的是代理对象
        assertNotSame(target, plugin);
        assertTrue(Proxy.isProxyClass(plugin.getClass()));
    }
}
```
### 常见问题与解决方案
> Q: 插件不生效怎么办？
> 
> A: 检查插件注册配置、@Signature注解的方法签名是否正确、plugin方法是否正确返回代理对象。

> Q: 插件执行顺序如何控制？
> 
> A: 插件执行顺序与注册顺序相反，可以通过调整配置文件中的顺序来控制。

> Q: 如何避免插件影响性能？
> 
> A: 减少反射调用、异步处理耗时操作、添加开关控制、优化算法复杂度。

> Q: 插件中如何获取SQL语句？
> 
> A: 通过MappedStatement.getBoundSql()方法获取BoundSql对象，再调用getSql()方法。

> Q: 如何在插件中修改SQL？
> 
> A: 创建新的BoundSql对象和MappedStatement，替换Invocation中的参数。

### 实践练习
#### 练习1：性能监控插件
开发一个性能监控插件，记录SQL执行时间，并在超过阈值时发出警告。
```java
@Intercepts({
    @Signature(
        type = Executor.class, 
        method = "update", 
        args = {MappedStatement.class, Object.class})
})
public class PerformanceInterceptor implements Interceptor { 
    private static final Logger logger = LoggerFactory.getLogger(PerformanceInterceptor.class);
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        try {
            return invocation.proceed();
        } finally {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            logger.info("SQL执行时间: {}ms", duration);
        }
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 配置阈值
        String thresholdStr = properties.getProperty("threshold");
        if (thresholdStr != null) {
            threshold = Long.parseLong(thresholdStr);
        }
    }
}
```
#### 练习2：SQL美化插件
开发一个SQL格式化插件，将SQL语句格式化后输出到日志。
```java
@Intercepts({
    @Signature(
        type = Executor.class, 
        method = "query", 
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class FormatSqlInterceptor implements Interceptor { 
    private static final Logger logger = LoggerFactory.getLogger(FormatSqlInterceptor.class);
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        BoundSql boundSql = ms.getBoundSql(invocation.getArgs()[1]);
        String sql = boundSql.getSql();
        
        logger.info("格式化后的SQL: {}", sql);
        
        return invocation.proceed();
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    @Override
    public void setProperties(Properties properties) {
        // 配置格式化选项
        String formatStr = properties.getProperty("format");
        if (formatStr != null) {
            format = Boolean.parseBoolean(formatStr);
        }
    }
}
```
#### 练习3：参数加密插件
开发一个参数处理插件，自动加密敏感字段。
```java
@Intercepts({
    @Signature(
        type = Executor.class, 
        method = "update", 
        args = {MappedStatement.class, Object.class})
})
public class EncryptInterceptor implements Interceptor { 
    private static final Logger logger = LoggerFactory.getLogger(EncryptInterceptor.class);
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];
        
        // 加密敏感字段
        if (parameter instanceof Map) {
            Map<String, Object> paramMap = (Map<String, Object>) parameter;
            if (paramMap.containsKey("password")) {
                paramMap.put("password", encrypt(paramMap.get("password").toString()));
            }
        }
        
        return invocation.proceed();
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    @Override
    public void setProperties(Properties properties) {
        // 配置加密算法
        String algorithm = properties.getProperty("algorithm");
        if (algorithm != null) {
            encryptor = new Encryptor(algorithm);
        }
    }
}
```
#### 练习4：结果缓存插件
开发一个结果缓存插件，缓存查询结果以提高性能。
```java
@Intercepts({
    @Signature(
        type = Executor.class, 
        method = "query", 
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class CacheInterceptor implements Interceptor {

    private static final Logger logger = LoggerFactory.getLogger(CacheInterceptor.class);
    private static final Map<String, Object> cache = new ConcurrentHashMap<>();
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable { 
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        BoundSql boundSql = ms.getBoundSql(invocation.getArgs()[1]);
        String sql = boundSql.getSql();
        Object result = cache.get(sql);
        if (result == null) { 
            result = invocation.proceed();
            cache.put(sql, result);
        }
        return result;
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    @Override
    public void setProperties(Properties properties) {
        // 配置缓存选项
        String cacheStr = properties.getProperty("cache");
        if (cacheStr != null) {
            cacheEnabled = Boolean.parseBoolean(cacheStr);
        }
    }   
}

```
#### 练习5：多数据源路由插件
开发一个数据源路由插件，根据SQL类型自动选择读写数据源。
```java
@Intercepts({
    @Signature(
        type = Executor.class, 
        method = "query", 
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class RoutingInterceptor implements Interceptor { 
    private static final Logger logger = LoggerFactory.getLogger(RoutingInterceptor.class);
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        String sql = ms.getSqlCommandType() == SqlCommandType.SELECT ? "read" : "write";
        
        logger.info("路由到 {} 数据源", sql);
        
        return invocation.proceed();
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    @Override
    public void setProperties(Properties properties) {
        // 配置路由规则
        String routingStr = properties.getProperty("routing");
        if (routingStr != null) {
            routing = Boolean.parseBoolean(routingStr);
        }
    }   
}
```

### 运行示例程序
- 步骤1：导入项目
将chapter-10-plugins.json导入到IntelliJ IDEA中。

- 步骤2：配置数据库
确保MySQL数据库运行正常，执行init.sql创建测试数据。

- 步骤3：运行基础示例
运行PluginDemo.java，观察各种插件的工作效果。

- 步骤4：观察插件日志
查看控制台输出，理解插件的拦截和处理过程。

- 步骤5：测试性能影响
对比有插件和无插件的性能差异，分析插件开销。

- 步骤6：自定义插件开发
尝试开发自己的插件，实现特定的业务需求。

- 步骤7：运行测试用例
执行PluginTest.java中的测试用例，验证插件功能的正确性。

### 本章小结
本章我们学习了 插件开发 的相关内容，包括：

- 核心概念和基本原理
- 配置方法和实践技巧
- 应用场景和最佳实践
- 常见问题和解决方案

## MyBatis关联映射
### 关联映射概述
关联映射是MyBatis中处理对象间关系的重要机制，用于解决数据库表之间的关联关系在对象模型中的映射问题。

#### 关联映射的作用
- 对象关系映射：将数据库表间的关联关系映射为对象间的关联关系
- 数据完整性：保证关联数据的一致性和完整性
- 查询优化：通过合理的关联查询减少数据库访问次数
- 代码简化：避免手动处理复杂的关联查询逻辑

#### 关联映射类型

|映射类型	|标签	|描述	|应用场景
| --- | --- | --- | ---
|一对一	|<association>	|一个对象关联另一个对象|	用户-用户详情、订单-支付信息
|一对多	|<collection>	|一个对象关联多个对象|	用户-订单、部门-员工
|多对多	|<collection>	|多个对象相互关联|	用户-角色、学生-课程

### 一对一关联映射
一对一关联表示两个实体之间存在唯一对应关系，使用<association>标签配置。

#### 2.1 实体类设计
```java
// 用户实体
public class User {
    private Long id;
    private String username;
    private String email;
    private Date createTime;
    private UserProfile profile; // 一对一关联
    
    // getter/setter方法...
}

// 用户详细信息实体
public class UserProfile {
    private Long id;
    private Long userId;
    private String realName;
    private String phone;
    private String address;
    
    // getter/setter方法...
}
```
#### 2.2 ResultMap配置
```xml
<!-- 一对一关联映射 -->
<resultMap id="UserWithProfileMap" type="User">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result column="email" property="email"/>
    <result column="create_time" property="createTime"/>
    
    <!-- 一对一关联配置 -->
    <association property="profile" javaType="UserProfile">
        <id column="profile_id" property="id"/>
        <result column="user_id" property="userId"/>
        <result column="real_name" property="realName"/>
        <result column="phone" property="phone"/>
        <result column="address" property="address"/>
    </association>
</resultMap>
```
#### 2.3 查询语句
```xml
<select id="selectUsersWithProfile" resultMap="UserWithProfileMap">
    SELECT u.id, u.username, u.email, u.create_time,
           p.id as profile_id, p.user_id, p.real_name, p.phone, p.address
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
</select>
```
### 3. 一对多关联映射
一对多关联表示一个实体对应多个相关实体，使用<collection>标签配置。

#### 3.1 实体类设计
```java
// 用户实体（包含订单列表）
public class User {
    private Long id;
    private String username;
    private String email;
    private List<Order> orders; // 一对多关联
    
    // getter/setter方法...
}

// 订单实体
public class Order {
    private Long id;
    private String orderNo;
    private Long userId;
    private BigDecimal amount;
    private String status;
    
    // getter/setter方法...
}
```
#### 3.2 ResultMap配置
```xml
<!-- 一对多关联映射 -->
<resultMap id="UserWithOrdersMap" type="User">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result column="email" property="email"/>
    
    <!-- 一对多关联配置 -->
    <collection property="orders" ofType="Order">
        <id column="order_id" property="id"/>
        <result column="order_no" property="orderNo"/>
        <result column="amount" property="amount"/>
        <result column="status" property="status"/>
    </collection>
</resultMap>
```
#### 3.3 查询语句
```xml
<select id="selectUsersWithOrders" resultMap="UserWithOrdersMap">
    SELECT u.id, u.username, u.email,
           o.id as order_id, o.order_no, o.amount, o.status
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    ORDER BY u.id, o.id
</select>
```
### 4. 多对多关联映射
多对多关联通过中间表实现，表示两个实体之间的多对多关系。
#### 4.1 实体类设计
```java
// 用户实体（包含角色列表）
public class User {
    private Long id;
    private String username;
    private String email;
    private List<Role> roles; // 多对多关联
    
    // getter/setter方法...
}

// 角色实体
public class Role {
    private Long id;
    private String roleName;
    private String roleCode;
    private String description;
    private List<User> users; // 反向关联
    
    // getter/setter方法...
}
```
#### 4.2 ResultMap配置
```xml
<!-- 多对多关联映射 -->
<resultMap id="UserWithRolesMap" type="User">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result column="email" property="email"/>
    
    <!-- 多对多关联配置 -->
    <collection property="roles" ofType="Role">
        <id column="role_id" property="id"/>
        <result column="role_name" property="roleName"/>
        <result column="role_code" property="roleCode"/>
        <result column="role_description" property="description"/>
    </collection>
</resultMap>
```
#### 4.3 查询语句
```xml
<select id="selectUsersWithRoles" resultMap="UserWithRolesMap">
    SELECT u.id, u.username, u.email,
           r.id as role_id, r.role_name, r.role_code, r.description as role_description
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    ORDER BY u.id, r.id
</select>
```
### 5. 嵌套查询 vs 嵌套结果
#### 5.1 嵌套结果（推荐）
优点

- 只执行一次SQL查询
- 性能较好，减少数据库访问
- 适合数据量不大的关联查询
#### 5.2 嵌套查询
```xml
<!-- 嵌套查询方式 -->
<resultMap id="UserWithProfileNested" type="User">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    
    <!-- 嵌套查询 -->
    <association property="profile" javaType="UserProfile" 
                 column="id" select="selectProfileByUserId"/>
</resultMap>

<select id="selectProfileByUserId" resultType="UserProfile">
    SELECT * FROM user_profiles WHERE user_id = #{id}
</select>
```
注意：嵌套查询可能导致N+1问题，即查询N个用户时会执行N+1次SQL语句。

### 6. 延迟加载
延迟加载可以提高性能，只在需要时才加载关联数据。

#### 6.1 全局配置
```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 关闭积极加载 -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```
#### 6.2 局部配置
```xml
<!-- 在association或collection中配置 -->
<association property="profile" javaType="UserProfile" 
             column="id" select="selectProfileByUserId" 
             fetchType="lazy"/>
```
### 7. 高级映射技巧
#### 7.1 ResultMap继承
```xml
<!-- 基础映射 -->
<resultMap id="BaseUserMap" type="User">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result column="email" property="email"/>
</resultMap>

<!-- 继承基础映射 -->
<resultMap id="UserWithProfileMap" type="User" extends="BaseUserMap">
    <association property="profile" javaType="UserProfile">
        <!-- 关联映射配置 -->
    </association>
</resultMap>
```
#### 7.2 复杂条件关联
```xml
<!-- 使用多个列作为关联条件 -->
<association property="profile" javaType="UserProfile" 
             column="{userId=id,status=status}" 
             select="selectProfileByUserIdAndStatus"/>
```
### 8. 性能优化建议
#### 8.1 查询优化
- 合理使用JOIN：优先使用嵌套结果而非嵌套查询
- 控制数据量：避免一次性加载过多关联数据
- 索引优化：为关联字段建立适当的索引
- 分页处理：对大量数据进行分页查询
#### 8.2 内存优化
- 延迟加载：合理使用延迟加载减少内存占用
- 结果缓存：利用MyBatis缓存机制
- 对象复用：避免创建不必要的对象
### 9. 常见问题与解决方案
#### 9.1 N+1查询问题
> 问题：使用嵌套查询时，查询N个主对象会执行N+1次SQL。
> 
> 解决方案：
> 
> - 使用嵌套结果代替嵌套查询
> - 合理设计SQL语句，使用JOIN查询
> - 启用批量查询优化
#### 9.2 循环依赖问题
> 问题：双向关联可能导致无限循环。
> 
> 解决方案：
> 
> - 避免在toString()方法中包含关联对象
> - 使用@JsonIgnore注解避免JSON序列化循环
> - 合理设计对象关系，避免不必要的双向关联
#### 9.3 数据重复问题
> 问题：一对多查询可能导致主对象数据重复。
> 
> 解决方案：
> 
> - 正确配置ResultMap的id标签
> - 使用DISTINCT关键字
> - 合理设计查询语句的ORDER BY子句
### 10.  实践练习
练习任务
- 基础练习：实现用户与用户详情的一对一关联查询
```xml
<resultMap id="UserWithProfileMap" type="User"> 
    <id column="id" property="id"/>
    <result column="username" property="username"/>
    <result column="email" property="email"/>
    <association property="profile" javaType="UserProfile">
        <id column="profile_id" property="id"/>
        <result column="full_name" property="fullName"/>
        <result column="phone" property="phone"/>
    </association>
</resultMap>
```
```java
public class AssociationDemo {
    public static void main(String[] args) { 
        AssociationDemo demo = new AssociationDemo();
        demo.testAssociation();
        demo.testComplexAssociation();
        demo.testMultiAssociation();
        demo.testManyToManyAssociation();
    }
    public void testAssociation() { 
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        List<User> users = userMapper.selectUsersWithProfile();
        for (User user : users) {
            System.out.println(user);
        }
        sqlSession.close();
    }
}
```
- 进阶练习：实现用户与订单的一对多关联查询
- 高级练习：实现用户与角色的多对多关联查询
- 综合练习：实现包含所有关联关系的复合查询
- 性能优化：对比嵌套查询和嵌套结果的性能差异
### 11.  运行示例程序
运行步骤
1. 确保MySQL数据库已安装并运行
2. 执行src/main/resources/init.sql创建数据库和表
3. 修改db.properties中的数据库连接信息
4. 运行AssociationDemo主程序
5. 观察不同类型关联查询的执行结果
6. 运行测试类验证各种关联映射功能

## 注解开发
### 1. 注解开发概述
#### 1.1 注解开发的优势
- 简化配置：减少XML配置文件，提高开发效率
- 类型安全：编译时检查，减少运行时错误
- 代码集中：SQL语句与Java代码在同一位置，便于维护
- IDE支持：更好的代码提示和重构支持
#### 1.2 注解开发的适用场景
- 简单的CRUD操作
- SQL语句相对简单的场景
- 需要快速开发的项目
- 团队更偏向于Java代码而非XML配置
> 注意：对于复杂的SQL语句和动态SQL，XML配置方式可能更加清晰和易于维护。
### 2. 基本CRUD注解
#### 2.1 核心注解介绍
|注解|作用|示例|
| -- | -- | -- |
|@Select|定义查询语句|@Select("SELECT * FROM users WHERE id = #{id}")|
|@Insert|定义插入语句|@Insert("INSERT INTO users(name, email) VALUES(#{name}, #{email})")|
|@Update|定义更新语句|@Update("UPDATE users SET name=#{name} WHERE id=#{id}")|
|@Delete|定义删除语句|@Delete("DELETE FROM users WHERE id=#{id}")|
|@Options|配置选项|@Options(useGeneratedKeys = true, keyProperty = "id")
#### 2.2 基本CRUD示例
```java
public interface UserMapper {
    
    // 查询单个用户
    @Select("SELECT * FROM users WHERE id = #{id}")
    User selectUserById(Long id);
    
    // 查询所有用户
    @Select("SELECT * FROM users")
    List<User> selectAllUsers();
    
    // 插入用户（自动生成主键）
    @Insert("INSERT INTO users(username, email, create_time) VALUES(#{username}, #{email}, #{createTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertUser(User user);
    
    // 更新用户
    @Update("UPDATE users SET username=#{username}, email=#{email} WHERE id=#{id}")
    int updateUser(User user);
    
    // 删除用户
    @Delete("DELETE FROM users WHERE id=#{id}")
    int deleteUser(Long id);
}
```
### 3. 动态SQL注解
#### 3.1 Provider注解
对于复杂的动态SQL，MyBatis提供了Provider注解：

- @SelectProvider - 动态查询
- @InsertProvider - 动态插入
- @UpdateProvider - 动态更新
- @DeleteProvider - 动态删除
#### 3.2 SQL提供者类
```java
public class UserSqlProvider {
    
    public String selectByCondition(String username, String email) {
        return new SQL() {{
            SELECT("*");
            FROM("users");
            if (username != null && !username.trim().isEmpty()) {
                WHERE("username LIKE CONCAT('%', #{username}, '%')");
            }
            if (email != null && !email.trim().isEmpty()) {
                WHERE("email LIKE CONCAT('%', #{email}, '%')");
            }
        }}.toString();
    }
    
    public String updateSelective(Long id, String username, String email) {
        return new SQL() {{
            UPDATE("users");
            if (username != null && !username.trim().isEmpty()) {
                SET("username = #{username}");
            }
            if (email != null && !email.trim().isEmpty()) {
                SET("email = #{email}");
            }
            WHERE("id = #{id}");
        }}.toString();
    }
}
```
#### 3.3 使用Provider注解
```java
public interface UserMapper {
    
    // 使用动态SQL查询
    @SelectProvider(type = UserSqlProvider.class, method = "selectByCondition")
    List<User> selectUsersByCondition(@Param("username") String username, 
                                     @Param("email") String email);
    
    // 使用动态SQL更新
    @UpdateProvider(type = UserSqlProvider.class, method = "updateSelective")
    int updateUserSelective(@Param("id") Long id, 
                           @Param("username") String username, 
                           @Param("email") String email);
}
```
### 4. 结果映射注解
#### 4.1 @Results和@Result注解
用于定义结果集映射关系：
```java
@Results(id = "userResultMap", value = {
    @Result(property = "id", column = "id", id = true),
    @Result(property = "username", column = "username"),
    @Result(property = "email", column = "email"),
    @Result(property = "createTime", column = "create_time")
})
@Select("SELECT id, username, email, create_time FROM users")
List<User> selectUsersWithMapping();
```
#### 4.2 关联映射注解
一对多关联映射
```java
@Select("SELECT * FROM users")
@Results({
    @Result(property = "id", column = "id", id = true),
    @Result(property = "username", column = "username"),
    @Result(property = "email", column = "email"),
    @Result(property = "createTime", column = "create_time"),
    @Result(property = "orders", column = "id", javaType = List.class,
            many = @Many(select = "com.mybatis.annotation.mapper.OrderMapper.selectOrdersByUserId",
                        fetchType = FetchType.LAZY))
})
List<User> selectUsersWithOrders();
```
一对一关联映射
```java
@Select("SELECT * FROM orders")
@Results({
    @Result(property = "id", column = "id", id = true),
    @Result(property = "orderNo", column = "order_no"),
    @Result(property = "user", column = "user_id", javaType = User.class,
            one = @One(select = "com.mybatis.annotation.mapper.UserMapper.selectUserById",
                      fetchType = FetchType.LAZY))
})
List<Order> selectOrdersWithUser();
```
### 5. 高级注解特性
#### 5.1 批量操作
```java
// 批量插入
@Insert({
    "<script>",
    "INSERT INTO users(username, email, create_time) VALUES",
    "<foreach collection='users' item='user' separator=','>",
    "(#{user.username}, #{user.email}, #{user.createTime})",
    "</foreach>",
    "</script>"
})
int insertUsers(@Param("users") List<User> users);
```
#### 5.2 复杂查询条件

```java
// 多条件查询

@Select("SELECT * FROM orders WHERE amount > #{minAmount} AND status = #{status}")
List<Order> selectOrdersByAmountAndStatus(
    @Param("minAmount") BigDecimal minAmount,
    @Param("status") String status
); 
```
### 6. 注解与XML的对比
- 注解开发
  - 优点
    - 配置简单，开发快速
    - 类型安全，编译时检查
    - 代码集中，便于查看
  - 缺点
    - 复杂SQL难以维护
    - 动态SQL支持有限
    - SQL与Java代码耦合
- XML配置
  - 优点
    - 支持复杂的动态SQL
    - SQL与Java代码分离
    - 更好的可读性和维护性
  - 缺点
    - 配置文件较多
    - 开发效率相对较低
    - 运行时才能发现错误
### 7. 最佳实践
#### 7.1 选择原则
- 简单CRUD：优先使用注解
- 复杂查询：使用XML配置
- 动态SQL：根据复杂度选择Provider或XML
- 团队偏好：保持项目内一致性
#### 7.2 注解开发建议
- 合理使用@Param注解明确参数名称
- 复杂SQL考虑使用Provider类
- 注意SQL注入安全问题
- 适当使用@Results复用结果映射
- 关联查询时注意懒加载配置
#### 7.3 性能优化
- 合理使用延迟加载避免N+1问题
- 批量操作提高数据处理效率
- 适当使用缓存减少数据库访问
- 优化SQL语句和索引
### 8. 常见问题与解决方案
#### 8.1 参数传递问题
> 问题：多参数传递时参数名不明确
> 
> 解决：使用@Param注解明确指定参数名称
#### 8.2 结果映射问题
> 问题：数据库字段名与Java属性名不匹配
> 
> 解决：使用@Result注解或开启驼峰命名转换
#### 8.3 动态SQL复杂度
> 问题：注解中的动态SQL过于复杂
> 
> 解决：使用Provider类或考虑XML配置
### 9. 实践练习
#### 9.1 练习任务
- 创建用户和订单的注解Mapper接口
- 实现基本的CRUD操作
- 使用Provider实现动态查询
- 配置一对多关联映射
- 实现批量插入功能
- 编写测试用例验证功能
  

### 10. 运行示例程序
运行步骤
- 确保MySQL数据库服务正在运行
- 执行src/main/resources/init.sql脚本创建数据库和表
- 修改db.properties中的数据库连接信息
- 运行AnnotationDemo主程序查看注解开发演示
- 运行AnnotationTest测试类验证各项功能
- 观察控制台输出，理解注解开发的执行过程
#### 学习重点
- 掌握基本CRUD注解的使用方法
- 理解动态SQL的注解实现方式
- 学会配置结果映射和关联查询
- 了解注解与XML配置的适用场景
- 掌握注解开发的最佳实践
