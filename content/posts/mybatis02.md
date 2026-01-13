---
title: "MyBatis-映射文件与SQL操作"
date: 2021-02-21T19:30:39+08:00
draft: false
description: "MyBatis-映射文件与SQL操作:sql映射、mapper接口、动态SQL、结果映射。"
tags: ["MyBatis","数据库"]
categories: ["Framework"]
---

## SQL映射
### SQL映射文件概述
SQL映射文件是MyBatis的核心组件之一，它定义了SQL语句与Java方法的映射关系。通过映射文件，我们可以将复杂的SQL操作封装成简单的方法调用。

映射文件的基本结构
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mybatis.mapping.mapper.UserMapper">
    <!-- SQL语句定义 -->
</mapper>
```
### 基本SQL语句配置
1. SELECT语句
```xml
<!-- 查询所有用户 -->
<select id="selectAllUsers" resultType="User">
    SELECT id, name, age, email FROM users
</select>

<!-- 根据ID查询用户 -->
<select id="selectUserById" parameterType="long" resultType="User">
    SELECT id, name, age, email FROM users WHERE id = #{id}
</select>
```
2. INSERT语句
```xml
<!-- 插入用户 -->
<insert id="insertUser" parameterType="User" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO users (name, age, email) VALUES (#{name}, #{age}, #{email})
</insert>
```
3. UPDATE语句
```xml
<!-- 更新用户 -->
<update id="updateUser" parameterType="User">
    UPDATE users SET name = #{name}, age = #{age}, email = #{email} WHERE id = #{id}
</update>
```
4. DELETE语句
```xml
<!-- 删除用户 -->
<delete id="deleteUser" parameterType="long">
    DELETE FROM users WHERE id = #{id}
</delete>
```
### 参数映射
1. 单个参数
```xml
<select id="selectUsersByAge" parameterType="int" resultType="User">
    SELECT * FROM users WHERE age = #{age}
</select>
```
2. 多个参数
```xml
<select id="selectUsersByCondition" parameterType="map" resultType="User">
    SELECT * FROM users 
    WHERE name LIKE CONCAT('%', #{name}, '%')
    AND age BETWEEN #{minAge} AND #{maxAge}
</select>
```
3. 对象参数
```xml
<insert id="insertUser" parameterType="User">
    INSERT INTO users (name, age, email) 
    VALUES (#{name}, #{age}, #{email})
</insert>
```
### 结果映射
1. 基本结果映射
```xml
<resultMap id="userResultMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <result property="age" column="user_age"/>
    <result property="email" column="user_email"/>
</resultMap>

<select id="selectUsers" resultMap="userResultMap">
    SELECT user_id, user_name, user_age, user_email FROM users
</select>
```
2. 关联映射（一对一）
```xml
<resultMap id="userWithProfileMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    <association property="profile" javaType="UserProfile">
        <id property="id" column="profile_id"/>
        <result property="bio" column="bio"/>
        <result property="avatar" column="avatar"/>
    </association>
</resultMap>

<select id="selectUsersWithProfile" resultMap="userWithProfileMap">
    SELECT u.*, p.id as profile_id, p.bio, p.avatar
    FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id
</select>
```
3. 集合映射（一对多）
```xml
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNumber" column="order_number"/>
        <result property="amount" column="amount"/>
        <result property="orderDate" column="order_date"/>
    </collection>
</resultMap>

<select id="selectUsersWithOrders" resultMap="userWithOrdersMap">
    SELECT u.*, o.id as order_id, o.order_number, o.amount, o.order_date
    FROM users u LEFT JOIN orders o ON u.id = o.user_id
</select>
```
### 动态SQL
1. if标签
```xml
<select id="selectUsersDynamic" parameterType="User" resultType="User">
    SELECT * FROM users
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
    </where>
</select>
```
2. choose、when、otherwise标签
```xml
<select id="selectUsersByCondition" parameterType="map" resultType="User">
    SELECT * FROM users
    <where>
        <choose>
            <when test="name != null">
                name LIKE CONCAT('%', #{name}, '%')
            </when>
            <when test="email != null">
                email = #{email}
            </when>
            <otherwise>
                age > 18
            </otherwise>
        </choose>
    </where>
</select>
```
3. foreach标签
```xml
<select id="selectUsersByIds" parameterType="list" resultType="User">
    SELECT * FROM users WHERE id IN
    <foreach collection="list" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```
### SQL片段复用
```xml
<!-- 定义SQL片段 -->
<sql id="userColumns">
    id, name, age, email
</sql>

<!-- 使用SQL片段 -->
<select id="selectAllUsers" resultType="User">
    SELECT <include refid="userColumns"/> FROM users
</select>

<select id="selectUserById" parameterType="long" resultType="User">
    SELECT <include refid="userColumns"/> FROM users WHERE id = #{id}
</select>
```
### 最佳实践
1. 命名规范
- 映射文件名与Mapper接口名保持一致
- namespace与Mapper接口的全限定名一致
- SQL语句的id与Mapper接口的方法名一致
2. 性能优化
- 合理使用resultMap，避免不必要的字段映射
- 使用延迟加载处理关联查询
- 避免N+1查询问题
- 合理使用缓存机制
3. 安全考虑
- 使用参数化查询防止SQL注入
- 避免在SQL中直接拼接用户输入
- 对敏感数据进行适当的权限控制
### 常见问题与解决方案
> Q: 如何处理字段名与属性名不一致的情况？
> 
> A: 可以使用resultMap进行字段映射，或者在SQL中使用别名。

> Q: 动态SQL中的test条件如何编写？
> 
> A: test条件使用OGNL表达式，可以判断null值、空字符串、数值比较等。

> Q: 如何处理一对多关联查询的性能问题？
> 
> A: 可以使用分步查询配合延迟加载，或者使用嵌套结果映射。

> Q: 如何在映射文件中使用自定义的类型处理器？
> 
> A: 在resultMap中使用typeHandler属性指定自定义的类型处理器。

### 实践练习
- 练习1：基本CRUD操作

为User实体创建完整的CRUD操作映射，包括插入、查询、更新和删除。
```xml
<mapper namespace="com.fengwenyi.mybatis_plus_demo.mapper.UserMapper"> 
<resultMap id="BaseResultMap" type="com.fengwenyi.mybatis_plus_demo.entity.User"> 
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
</resultMap>
<sql id="Base_Column_List"> 
    id, name, age, email
</sql>
<insert id="insertUser" parameterType="com.fengwenyi.mybatis_plus_demo.entity.User">
    INSERT INTO users (<include refid="Base_Column_List"/>)
    VALUES (#{id}, #{name}, #{age}, #{email})
</insert>
<select id="selectUserById" parameterType="long" resultMap="BaseResultMap">
    SELECT <include refid="Base_Column_List"/> FROM users WHERE id = #{id}
</select>
<update id="updateUser" parameterType="com.fengwenyi.mybatis_plus_demo.entity.User">
    UPDATE users SET name = #{name}, age = #{age}, email = #{email} WHERE id = #{id}
</update>
<delete id="deleteUser" parameterType="long">
    DELETE FROM users WHERE id = #{id}
</delete>
</mapper>
```

- 练习2：动态查询

实现一个用户搜索功能，支持按姓名、年龄范围、邮箱等条件进行动态查询。

- 练习3：关联查询

实现用户与订单的一对多关联查询，要求能够查询用户及其所有订单信息。

- 练习4：批量操作

实现批量插入用户和批量删除用户的功能。

### 运行示例程序
- 步骤1：导入项目
将chapter-05-sql-mapping.json导入到IntelliJ IDEA中。

- 步骤2：配置数据库
确保MySQL数据库运行正常，执行init.sql创建测试数据。

- 步骤3：运行程序
运行SqlMappingDemo.java，观察各种映射配置的执行效果。

- 步骤4：查看结果
程序将演示基本映射、参数映射、结果映射和动态SQL的使用。

## Mapper接口
### Mapper接口概述
Mapper接口是MyBatis的核心组件，它定义了数据访问的方法签名，MyBatis会自动为这些接口创建代理实现，将方法调用转换为SQL执行。

Mapper接口的优势
- 类型安全：编译时检查方法签名和参数类型
- 代码简洁：无需编写实现类，只需定义接口
- 易于维护：接口与SQL映射分离，便于管理
- IDE支持：完整的代码提示和重构支持
### XML映射方式
1. 定义Mapper接口
```java
package com.example.mybatis.mapper;

import com.example.mybatis.model.User;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface UserMapper {
    
    // 查询所有用户
    List<User> selectAllUsers();
    
    // 根据ID查询用户
    User selectUserById(Long id);
    
    // 根据年龄查询用户
    List<User> selectUsersByAge(@Param("age") Integer age);
    
    // 条件查询
    List<User> selectUsersByCondition(Map<String, Object> params);
    
    // 统计用户数量
    long countUsers();
    
    // 插入用户
    int insertUser(User user);
    
    // 更新用户
    int updateUser(User user);
    
    // 删除用户
    int deleteUser(Long id);
}
```
2. 创建XML映射文件
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mybatis.mapper.UserMapper">
    
    <select id="selectAllUsers" resultType="User">
        SELECT id, name, age, email FROM users
    </select>
    
    <select id="selectUserById" parameterType="long" resultType="User">
        SELECT id, name, age, email FROM users WHERE id = #{id}
    </select>
    
    <select id="selectUsersByAge" parameterType="int" resultType="User">
        SELECT id, name, age, email FROM users WHERE age = #{age}
    </select>
    
    <select id="countUsers" resultType="long">
        SELECT COUNT(*) FROM users
    </select>
    
    <insert id="insertUser" parameterType="User" 
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (name, age, email) 
        VALUES (#{name}, #{age}, #{email})
    </insert>
    
    <update id="updateUser" parameterType="User">
        UPDATE users SET name = #{name}, age = #{age}, email = #{email} 
        WHERE id = #{id}
    </update>
    
    <delete id="deleteUser" parameterType="long">
        DELETE FROM users WHERE id = #{id}
    </delete>
    
</mapper>
```
3. 配置映射文件
```xml
<!-- 在mybatis-config.xml中配置 -->
<mappers>
    <mapper resource="mapper/UserMapper.xml"/>
</mappers>
```
### 注解映射方式
1. 基本注解
```java
@Mapper
public interface UserAnnotationMapper {
    
    @Select("SELECT id, name, age, email FROM users")
    List<User> findAllUsers();
    
    @Select("SELECT id, name, age, email FROM users WHERE id = #{id}")
    User findUserById(@Param("id") Long id);
    
    @Insert("INSERT INTO users(name, age, email) VALUES(#{name}, #{age}, #{email})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertUser(User user);
    
    @Update("UPDATE users SET name = #{name}, age = #{age}, email = #{email} WHERE id = #{id}")
    int updateUser(User user);
    
    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteUser(@Param("id") Long id);
    
    @Select("SELECT COUNT(*) FROM users")
    long countUsers();
}
```
2. 结果映射注解
```java
@Select("SELECT id, name, age, email FROM users")
@Results({
    @Result(property = "id", column = "id"),
    @Result(property = "name", column = "name"),
    @Result(property = "age", column = "age"),
    @Result(property = "email", column = "email")
})
List<User> findAllUsersWithMapping();
```
3. 动态SQL注解
```java
@SelectProvider(type = UserSqlProvider.class, method = "selectUsersByCondition")
List<User> findUsersByCondition(@Param("name") String name, @Param("minAge") Integer minAge);

// SQL提供者类
class UserSqlProvider {
    public String selectUsersByCondition(@Param("name") String name, @Param("minAge") Integer minAge) {
        StringBuilder sql = new StringBuilder("SELECT id, name, age, email FROM users WHERE 1=1");
        if (name != null && !name.isEmpty()) {
            sql.append(" AND name LIKE CONCAT('%', #{name}, '%')");
        }
        if (minAge != null) {
            sql.append(" AND age >= #{minAge}");
        }
        return sql.toString();
    }
}
```
### Mapper代理机制
1. 代理对象的创建
```java
// MyBatis自动创建代理对象
UserMapper userMapper = sqlSession.getMapper(UserMapper.class);

// 查看代理对象信息
System.out.println("Mapper接口类型: " + userMapper.getClass().getName());
System.out.println("是否为代理对象: " + userMapper.getClass().getName().contains("Proxy"));
```
2. 方法调用流程
- 调用Mapper接口方法
- 代理对象拦截方法调用
- 根据方法名查找对应的SQL语句
- 执行SQL并处理结果
- 返回处理后的结果
### 参数传递
1. 单个参数
```java
// 接口定义
User selectUserById(Long id);

// XML映射
<select id="selectUserById" parameterType="long" resultType="User">
    SELECT * FROM users WHERE id = #{id}
</select>
```
2. 多个参数（使用@Param）
```java
// 接口定义
List<User> selectUsersByAgeRange(@Param("minAge") Integer minAge, 
                                 @Param("maxAge") Integer maxAge);

// XML映射
<select id="selectUsersByAgeRange" resultType="User">
    SELECT * FROM users WHERE age BETWEEN #{minAge} AND #{maxAge}
</select>
```
3. 对象参数
```java
// 接口定义
int insertUser(User user);

// XML映射
<insert id="insertUser" parameterType="User">
    INSERT INTO users (name, age, email) 
    VALUES (#{name}, #{age}, #{email})
</insert>
```
4. Map参数
```java
// 接口定义
List<User> selectUsersByCondition(Map<String, Object> params);

// XML映射
<select id="selectUsersByCondition" parameterType="map" resultType="User">
    SELECT * FROM users
    <where>
        <if test="name != null">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="minAge != null">
            AND age >= #{minAge}
        </if>
    </where>
</select>
```
### 返回值处理
1. 基本类型返回值
```java
// 返回数量
long countUsers();

// 返回影响行数
int insertUser(User user);
int updateUser(User user);
int deleteUser(Long id);
```
2. 对象返回值
```java
// 返回单个对象
User selectUserById(Long id);

// 返回对象列表
List<User> selectAllUsers();
```
3. Map返回值
```java
// 返回Map
@MapKey("id")
Map<Long, User> selectUsersAsMap();

// 返回单行Map
Map<String, Object> selectUserAsMap(Long id);
```
### 最佳实践
1. 接口设计原则
- 方法名要清晰表达业务意图
- 参数类型要明确，避免使用Object
- 返回值类型要准确，避免过度包装
- 合理使用@Param注解标识参数    
2. XML vs 注解选择
- 简单SQL：使用注解，代码更简洁
- 复杂SQL：使用XML，可读性更好
- 动态SQL：推荐使用XML
- 团队规范：保持一致的风格
3. 性能优化
- 合理设计方法签名，避免不必要的数据传输
- 使用合适的返回值类型
- 避免在Mapper中进行复杂的业务逻辑
- 合理使用批量操作方法
### 常见问题与解决方案
> Q: Mapper接口方法找不到对应的SQL语句？
> 
> A: 检查namespace是否正确，方法名是否与SQL语句的id一致。

> Q: 多个参数时出现参数绑定错误？
> 
> A: 使用@Param注解明确指定参数名称。

> Q: 如何处理返回null的情况？
> 
> A: 在业务层进行null检查，或者使用Optional包装返回值。

> Q: 注解和XML映射可以混合使用吗？
> 
> A: 可以，但建议在同一个项目中保持一致的风格。

### 实践练习
- 练习1：基本Mapper接口
创建一个完整的UserMapper接口，包含CRUD操作和统计方法。

- 练习2：注解映射
使用注解方式重新实现UserMapper的部分方法。

- 练习3：复杂参数传递
实现一个支持多条件查询的方法，使用Map传递参数。

- 练习4：批量操作
实现批量插入和批量删除的Mapper方法。

### 运行示例程序
- 步骤1：导入项目

将chapter-06-mapper-interface.json导入到IntelliJ IDEA中。

- 步骤2：配置数据库

确保MySQL数据库运行正常，执行init.sql创建测试数据。

- 步骤3：运行程序

运行MapperInterfaceDemo.java，观察不同映射方式的执行效果。

- 步骤4：查看结果

程序将演示XML映射器、注解映射器、Mapper方法和代理机制的使用。

### 本章小结
本章我们学习了 Mapper接口 的相关内容，包括：

- 核心概念和基本原理
- 配置方法和实践技巧
- 应用场景和最佳实践
- 常见问题和解决方案

## 动态SQL
### 动态SQL概述
动态SQL是MyBatis的强大特性之一，它允许我们根据不同的条件动态构建SQL语句，避免了在Java代码中拼接SQL字符串的复杂性和安全风险。

动态SQL的优势
- 灵活性：根据条件动态生成SQL
- 安全性：避免SQL注入风险
- 可维护性：SQL逻辑集中管理
- 性能优化：只查询需要的字段和条件
### if标签
if标签是最基本的条件判断标签，用于根据条件决定是否包含某段SQL。

基本语法
```xml
<if test="条件表达式">
    SQL片段
</if>
```
实际应用
```xml
<select id="selectUsersByCondition" resultType="User">
    SELECT id, name, age, email FROM users
    WHERE 1=1
    <if test="name != null and name != ''">
        AND name LIKE CONCAT('%', #{name}, '%')
    </if>
    <if test="minAge != null">
        AND age >= #{minAge}
    </if>
    <if test="maxAge != null">
        AND age <= #{maxAge}
    </if>
</select>
```
条件表达式

- name != null：判断参数是否为null
- name != ''：判断字符串是否为空
- age > 0：数值比较
- list != null and list.size() > 0：集合判断
### choose/when/otherwise标签
类似于Java中的switch语句，用于多条件选择，只会执行其中一个分支。

基本语法
```xml
<choose>
    <when test="条件1">
        SQL片段1
    </when>
    <when test="条件2">
        SQL片段2
    </when>
    <otherwise>
        默认SQL片段
    </otherwise>
</choose>
```
实际应用
```xml
<select id="selectUsersByChoice" resultType="User">
    SELECT id, name, age, email FROM users
    WHERE 1=1
    <choose>
        <when test="name != null and name != ''">
            AND name = #{name}
        </when>
        <when test="age != null">
            AND age = #{age}
        </when>
        <when test="email != null and email != ''">
            AND email = #{email}
        </when>
        <otherwise>
            AND 1=1
        </otherwise>
    </choose>
</select>
```
### where标签
where标签用于动态生成WHERE子句，自动处理AND和OR的前缀问题。

解决的问题
- 自动添加WHERE关键字
- 自动去除多余的AND或OR前缀
- 当没有条件时，不生成WHERE子句

实际应用
```xml
<select id="selectUsersByMap" parameterType="map" resultType="User">
    SELECT id, name, age, email FROM users
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="minAge != null">
            AND age >= #{minAge}
        </if>
        <if test="maxAge != null">
            AND age <= #{maxAge}
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
    </where>
</select>
```
### set标签
set标签用于动态生成SET子句，常用于UPDATE语句中的选择性更新。

解决的问题
- 自动添加SET关键字
- 自动去除多余的逗号
- 只更新非空字段

实际应用
```xml
<update id="updateUserSelective" parameterType="User">
    UPDATE users
    <set>
        <if test="name != null and name != ''">
            name = #{name},
        </if>
        <if test="age != null">
            age = #{age},
        </if>
        <if test="email != null and email != ''">
            email = #{email},
        </if>
    </set>
    WHERE id = #{id}
</update>
```
### foreach标签
foreach标签用于遍历集合，常用于IN查询、批量插入、批量删除等场景。

属性说明
- collection：要遍历的集合
- item：集合中每个元素的别名
- index：当前元素的索引
- open：开始字符
- close：结束字符
- separator：分隔符

IN查询示例
```xml
<select id="selectUsersByIds" resultType="User">
    SELECT id, name, age, email FROM users
    WHERE id IN
    <foreach collection="ids" item="id" open="(" close=")" separator=",">
        #{id}
    </foreach>
</select>
```
批量插入示例
```xml
<insert id="batchInsertUsers">
    INSERT INTO users (name, age, email) VALUES
    <foreach collection="users" item="user" separator=",">
        (#{user.name}, #{user.age}, #{user.email})
    </foreach>
</insert>
```
批量删除示例
```xml
<delete id="batchDeleteUsers">
    DELETE FROM users
    WHERE id IN
    <foreach collection="ids" item="id" open="(" close=")" separator=",">
        #{id}
    </foreach>
</delete>
```
### trim标签
trim标签是最灵活的标签，可以自定义前缀、后缀，以及要去除的前缀和后缀。

属性说明
- prefix：添加的前缀
- suffix：添加的后缀
- prefixOverrides：要去除的前缀
- suffixOverrides：要去除的后缀

实际应用
```xml
<select id="selectUsersByTrim" resultType="User">
    SELECT id, name, age, email FROM users
    <trim prefix="WHERE" prefixOverrides="AND |OR ">
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </trim>
</select>
```
等价关系
```xml
<!-- where标签等价于 -->
<trim prefix="WHERE" prefixOverrides="AND |OR ">
    ...
</trim>

<!-- set标签等价于 -->
<trim prefix="SET" suffixOverrides=",">
    ...
</trim>
```
### SQL片段
SQL片段用于定义可重用的SQL代码块，提高代码复用性和维护性。

定义SQL片段
```xml
<!-- 定义常用的列名 -->
<sql id="userColumns">
    id, name, age, email
</sql>

<!-- 定义表名 -->
<sql id="userTable">
    users
</sql>

<!-- 定义常用的WHERE条件 -->
<sql id="userWhereCondition">
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</sql>
```
引用SQL片段
```xml
<select id="selectUsersWithFragment" resultType="User">
    SELECT <include refid="userColumns"/> 
    FROM <include refid="userTable"/>
    <include refid="userWhereCondition"/>
    ORDER BY id
</select>
```
带参数的SQL片段
```xml
<sql id="orderBy">
    ORDER BY ${column} ${direction}
</sql>

<select id="selectUsersWithOrder" resultType="User">
    SELECT <include refid="userColumns"/> FROM <include refid="userTable"/>
    <include refid="orderBy">
        <property name="column" value="name"/>
        <property name="direction" value="ASC"/>
    </include>
</select>
```
### 动态SQL最佳实践
1. 性能优化
- 避免在动态SQL中使用复杂的逻辑判断
- 合理使用索引，确保动态生成的WHERE条件能够利用索引
- 批量操作时控制批次大小，避免单次操作数据量过大
- 使用合适的参数类型，避免不必要的类型转换
2. 安全考虑
- 始终使用#{}进行参数绑定，避免SQL注入
- 谨慎使用${}，仅在必要时使用（如动态表名、列名）
- 对用户输入进行验证和过滤
- 避免在动态SQL中直接拼接用户输入
3. 代码组织
- 合理使用SQL片段，提高代码复用性
- 保持SQL语句的可读性，适当添加注释
- 将复杂的动态SQL拆分为多个简单的片段
- 统一命名规范，便于维护
4. 调试技巧
- 开启SQL日志，查看实际生成的SQL语句
- 使用单元测试验证各种条件分支
- 在开发环境中打印SQL参数
- 使用数据库工具验证SQL语句的正确性
### 常见问题与解决方案
> Q: 动态SQL中的条件判断不生效？
> 
> A: 检查test表达式是否正确，注意参数名称和类型，确保传入的参数不为null。

> Q: foreach标签遍历集合时出现异常？
> 
> A: 确保collection属性指向的集合不为null，检查item和index的命名是否正确。

> Q: where标签没有自动去除AND前缀？
> 
> A: 确保在if条件中使用AND或OR作为前缀，where标签会自动处理这些前缀。

> Q: SQL片段引用时找不到？
> 
> A: 检查sql片段的id是否正确，确保在同一个mapper文件中或者使用完整的命名空间引用。

> Q: 动态SQL性能较差？
> 
> A: 检查生成的SQL是否能够利用索引，避免全表扫描，合理设计查询条件。

### 实践练习
- 练习1：条件查询

实现一个用户搜索功能，支持按姓名、年龄范围、邮箱进行模糊查询。
```xml
<select id="selectUsers" resultType="User"> 
    SELECT id, name, age, email FROM users
    <include refid="userWhereCondition"/>
    ORDER BY id
</select>
```
- 练习2：选择性更新

实现一个用户信息更新功能，只更新非空字段。
```xml
<update id="updateUser" parameterType="User">
    UPDATE users SET
    <if test="name != null">
        name = #{name},
    </if>
    <if test="age != null">
        age = #{age},
    </if>
    <if test="email != null">
        email = #{email},
    </if>
    WHERE id = #{id}
</update>
```
- 练习3：批量操作

实现批量插入用户和批量删除用户的功能。
```xml
<insert id="batchInsertUsers" parameterType="List">
    INSERT INTO users (name, age, email)
    VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age}, #{user.email})
    </foreach>
</insert>

<delete id="batchDeleteUsers" parameterType="List">
    DELETE FROM users WHERE id IN
    <foreach collection="list" item="id" open="(" close=")" separator=",">
        #{id}
    </foreach>
</delete>
```
- 练习4：复杂动态SQL

结合多种动态SQL标签，实现一个复杂的报表查询功能。
```xml
<select id="selectUserReport" parameterType="map" resultType="UserReport">
    SELECT u.id, u.name, u.age, u.email, o.total_orders, o.total_amount
    FROM users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS total_orders, SUM(amount) AS total_amount
        FROM orders
        GROUP BY user_id
    ) o ON u.id = o.user_id
    <where>
        <if test="name != null and name != ''">
            AND u.name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="minAge != null">
            AND u.age >= #{minAge}
        </if>
        <if test="maxAge != null">
            AND u.age <= #{maxAge}
        </if>
    </where>
    ORDER BY u.id
```
### 运行示例程序
- 步骤1：导入项目

将chapter-07-dynamic-sql.json导入到IntelliJ IDEA中。

- 步骤2：配置数据库

确保MySQL数据库运行正常，执行init.sql创建测试数据。

- 步骤3：运行程序

运行DynamicSqlDemo.java，观察各种动态SQL标签的执行效果。

- 步骤4：查看日志

观察控制台输出的SQL语句，理解动态SQL的生成过程。

- 步骤5：运行测试

执行DynamicSqlTest.java中的测试用例，验证各种动态SQL功能。


### 本章小结
本章我们学习了 动态SQL 的相关内容，包括：

- 核心概念和基本原理
- 配置方法和实践技巧
- 应用场景和最佳实践
- 常见问题和解决方案


## 结果映射
### 结果映射概述
结果映射是MyBatis最强大的特性之一，它负责将SQL查询结果转换为Java对象。MyBatis提供了灵活的映射机制，支持简单类型映射、复杂对象映射、关联对象映射等多种场景。

结果映射的类型
- 基本映射：直接使用resultType
- 自定义映射：使用resultMap定义复杂映射
- 关联映射：处理对象之间的关联关系
- 集合映射：处理一对多的集合关系
### 基本结果映射
最简单的结果映射方式，直接使用resultType指定返回类型。

简单类型映射
```xml
<!-- 返回基本类型 -->
<select id="countUsers" resultType="long">
    SELECT COUNT(*) FROM users
</select>

<!-- 返回字符串 -->
<select id="getUserName" resultType="string">
    SELECT name FROM users WHERE id = #{id}
</select>
```
对象类型映射
```xml
<!-- 返回单个对象 -->
<select id="selectUserById" resultType="User">
    SELECT id, name, age, email FROM users WHERE id = #{id}
</select>

<!-- 返回对象列表 -->
<select id="selectAllUsers" resultType="User">
    SELECT id, name, age, email FROM users
</select>
```
自动映射规则
- 列名与属性名完全匹配
- 开启驼峰命名转换（mapUnderscoreToCamelCase=true）
- 类型自动转换（String ↔ 数值类型等）
### 自定义结果映射
当自动映射无法满足需求时，可以使用resultMap定义自定义的结果映射。

基本ResultMap
```xml
<resultMap id="userResultMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <result property="age" column="user_age"/>
    <result property="email" column="user_email"/>
</resultMap>

<select id="selectUsersWithCustomMapping" resultMap="userResultMap">
    SELECT id as user_id, name as user_name, 
           age as user_age, email as user_email 
    FROM users
</select>
```
ResultMap元素说明
- id：主键映射，用于性能优化
- result：普通字段映射
- association：一对一关联映射
- collection：一对多集合映射
- discriminator：鉴别器，根据条件选择映射
### 一对一关联映射
使用association标签处理一对一的关联关系。

嵌套查询方式
```xml
<resultMap id="userWithProfileMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    <association property="profile" column="id" 
                 select="com.example.mybatis.mapper.UserProfileMapper.selectProfileByUserId"/>
</resultMap>

<select id="selectUsersWithProfile" resultMap="userWithProfileMap">
    SELECT id, name, age, email FROM users
</select>
```
嵌套结果方式
```xml
<resultMap id="userWithProfileNestedMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    <association property="profile" javaType="UserProfile">
        <id property="id" column="profile_id"/>
        <result property="userId" column="user_id"/>
        <result property="phone" column="phone"/>
        <result property="address" column="address"/>
        <result property="birthday" column="birthday"/>
        <result property="avatar" column="avatar"/>
    </association>
</resultMap>

<select id="selectUsersWithProfileNested" resultMap="userWithProfileNestedMap">
    SELECT u.id, u.name, u.age, u.email,
           p.id as profile_id, p.user_id, p.phone, 
           p.address, p.birthday, p.avatar
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
</select>
```
两种方式的比较
| 特性 | 嵌套查询 | 嵌套结果 |
| --- | --- | --- |
| SQL数量 | 多个SQL（N+1问题） | 单个SQL |
| 性能 | 可能较慢 | 通常更快 |
| 延迟加载 | 支持 | 不支持 |
| 配置复杂度 | 简单 | 相对复杂 |
### 一对多集合映射
使用collection标签处理一对多的集合关系。

嵌套查询方式
```xml
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    <collection property="orders" column="id"
                select="com.example.mybatis.mapper.OrderMapper.selectOrdersByUserId"/>
</resultMap>

<select id="selectUsersWithOrders" resultMap="userWithOrdersMap">
    SELECT id, name, age, email FROM users
</select>
```
嵌套结果方式
```xml
<resultMap id="userWithOrdersNestedMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="userId" column="order_user_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
        <result property="status" column="status"/>
        <result property="createTime" column="create_time"/>
    </collection>
</resultMap>

<select id="selectUsersWithOrdersNested" resultMap="userWithOrdersNestedMap">
    SELECT u.id, u.name, u.age, u.email,
           o.id as order_id, o.user_id as order_user_id, 
           o.order_no, o.amount, o.status, o.create_time
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    ORDER BY u.id, o.id
</select>
```
### 复杂嵌套映射
在实际项目中，经常需要同时处理多种关联关系。

用户+档案+订单的复杂映射
```xml
<resultMap id="userComplexMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    
    <!-- 一对一关联：用户档案 -->
    <association property="profile" javaType="UserProfile">
        <id property="id" column="profile_id"/>
        <result property="userId" column="user_id"/>
        <result property="phone" column="phone"/>
        <result property="address" column="address"/>
        <result property="birthday" column="birthday"/>
        <result property="avatar" column="avatar"/>
    </association>
    
    <!-- 一对多关联：用户订单 -->
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="userId" column="order_user_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
        <result property="status" column="status"/>
        <result property="createTime" column="create_time"/>
    </collection>
</resultMap>

<select id="selectUsersWithComplexMapping" resultMap="userComplexMap">
    SELECT u.id, u.name, u.age, u.email,
           p.id as profile_id, p.user_id, p.phone, p.address, p.birthday, p.avatar,
           o.id as order_id, o.user_id as order_user_id, o.order_no, 
           o.amount, o.status, o.create_time
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN orders o ON u.id = o.user_id
    ORDER BY u.id, o.id
</select>
```
### 延迟加载
延迟加载是一种性能优化技术，只有在真正访问关联对象时才执行查询。

全局配置
```xml
<!-- 在mybatis-config.xml中配置 -->
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 关闭积极的延迟加载 -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```
局部配置
```xml
<resultMap id="userLazyMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
    
    <!-- 延迟加载用户档案 -->
    <association property="profile" column="id" fetchType="lazy"
                 select="com.example.mybatis.mapper.UserProfileMapper.selectProfileByUserId"/>
    
    <!-- 延迟加载用户订单 -->
    <collection property="orders" column="id" fetchType="lazy"
                select="com.example.mybatis.mapper.OrderMapper.selectOrdersByUserId"/>
</resultMap>
```
fetchType属性
- eager：立即加载
- lazy：延迟加载
- 默认值：根据全局配置决定
### 高级映射技巧
1. 使用构造方法映射
```xml
<resultMap id="userConstructorMap" type="User">
    <constructor>
        <idArg column="id" javaType="long"/>
        <arg column="name" javaType="string"/>
        <arg column="age" javaType="int"/>
        <arg column="email" javaType="string"/>
    </constructor>
</resultMap>
```
2. 鉴别器映射
```xml
<resultMap id="userDiscriminatorMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <discriminator javaType="string" column="user_type">
        <case value="VIP" resultMap="vipUserMap"/>
        <case value="NORMAL" resultMap="normalUserMap"/>
    </discriminator>
</resultMap>
```
3. 继承映射
```xml
<resultMap id="baseUserMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="email" column="email"/>
</resultMap>

<resultMap id="extendedUserMap" type="User" extends="baseUserMap">
    <association property="profile" column="id" 
                 select="selectProfileByUserId"/>
</resultMap>
```
### 性能优化建议
1. 选择合适的映射方式
- 简单查询使用resultType
- 复杂映射使用resultMap
- 一对一关系优先使用嵌套结果
- 一对多关系根据数据量选择
2. 避免N+1问题
- 合理使用嵌套结果映射
- 启用延迟加载
- 批量查询优化
- 缓存机制配合
3. 延迟加载最佳实践
- 只对大对象或集合使用延迟加载
- 避免在循环中触发延迟加载
- 注意Session生命周期
- 合理设置fetchType
4. 内存使用优化
- 避免加载不必要的字段
- 合理设计对象结构
- 及时释放大对象
- 使用分页查询
### 常见问题与解决方案
> Q: 延迟加载时出现LazyInitializationException？
> 
> A: 确保在Session关闭前访问延迟加载的属性，或者使用OpenSessionInView模式。

> Q: 一对多映射时数据重复？
> 
> A: 检查resultMap中的id配置是否正确，确保主键映射准确。

> Q: 嵌套结果映射性能差？
> 
> A: 考虑使用嵌套查询+延迟加载，或者优化SQL查询和索引。

> Q: 复杂映射配置错误？
> 
> A: 逐步构建映射，先测试简单映射再添加复杂关联。

> Q: 类型转换异常？
> 
> A: 检查javaType和jdbcType配置，确保类型匹配。

### 实践练习
- 练习1：基本映射

创建一个自定义ResultMap，处理列名与属性名不匹配的情况。

- 练习2：一对一映射

实现用户和用户档案的一对一映射，分别使用嵌套查询和嵌套结果两种方式。

- 练习3：一对多映射

实现用户和订单的一对多映射，观察数据的组织方式。

- 练习4：延迟加载

配置延迟加载，观察SQL执行时机和性能差异。

- 练习5：复杂映射

实现包含用户、档案、订单的三层嵌套映射。

### 运行示例程序
- 步骤1：导入项目

将chapter-08-result-mapping.json导入到IntelliJ IDEA中。

- 步骤2：配置数据库

确保MySQL数据库运行正常，执行init.sql创建测试数据。

- 步骤3：运行程序

运行ResultMappingDemo.java，观察各种结果映射的执行效果。

- 步骤4：观察SQL日志

查看控制台输出的SQL语句，理解不同映射方式的查询策略。
- 步骤5：测试延迟加载

观察延迟加载的触发时机和SQL执行情况。

- 步骤6：运行测试

执行ResultMappingTest.java中的测试用例，验证各种映射功能。

### 本章小结
本章我们学习了 结果映射 的相关内容，包括：
- 核心概念和基本原理
- 配置方法和实践技巧
- 应用场景和最佳实践
- 常见问题和解决方案

