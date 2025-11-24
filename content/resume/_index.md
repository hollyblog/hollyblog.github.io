---
title: "个人简历"
date: 2025-11-24T14:30:00+08:00
draft: false
description: "个人简历"
tags: ["resume"]
categories: ["Resume"]
---

<table>
	<tr style="height: 50px;">
		<td style="font-size: 1.8em;"><strong>👧Holly</strong></td>
		<td style="font-size: 1.5em;"><strong>求职意向：后端开发工程师</strong></td>
	</tr>
	<tr>
		<td>工作经验：三年（含个人项目实战）</td>
		<td>电话：131****6107</td>
	</tr>
	<tr>
		<td>出生年月：1996年08月</td>
		<td>邮箱：2285549633@qq.com</td>
	</tr>
</table>
<hr/>

### 🚀教育及工作经历

<h5 style="display: flex; justify-content: right;">
  <span style="width: 25%; text-align: left;">2015.09 - 2019.07</span>
  <span style="width: 25%; text-align: right;">山东建筑大学</span>
  <span style="width: 25%; text-align: right;">软件工程</span>
  <span style="width: 25%; text-align: right;">本科</span>
</h5>
<h5 style="display: flex; justify-content: left;">
  <span style="width: 25%; text-align: left;">2019.09 - 2022.07</span>
  <span style="width: 25%; text-align: right;">大连理工大学</span>
  <span style="width: 25%; text-align: right;">软件工程</span>
  <span style="width: 25%; text-align: right;">硕士</span>
</h5>
<h5 style="display: flex; justify-content: left;">
  <span style="width: 25%; text-align: left;">2022.07 - 2023.04</span>
  <span style="width: 25%; text-align: right;">北京金山云</span>
  <span style="width: 25%; text-align: right;">公有云</span>
  <span style="width: 25%; text-align: right;">后端工程师</span>
</h5>
<h5 style="display: flex; justify-content: left;">
  <span style="width: 25%; text-align: left;">2023.05 - 2025.11</span>
  <span style="width: 25%; text-align: right;">个人创业项目</span>
  <span style="width: 25%; text-align: right;">餐饮业务</span>
  <span style="width: 25%; text-align: right;">全栈工程师</span>
</h5>

<hr/>

### 🔨专业技能

- **大模型应用开发**：掌握**LangChain4J**框架，具备构建**RAG**系统、**Agents**的实战经验；熟悉提示工程原则，了解大模型微调方法；具备本地部署开源大模型的能力；了解向量数据库的原理与应用。
- **后端开发**：熟练使用**SpringBoot、SpringCloud**微服务架构及其常用组件，熟悉服务网格、分布式事务、配置管理；熟悉**MySQL**（索引、事务、分库分表、读写分离）、**Redis**（数据结构、分布式锁）、**RabbitMQ**（消息可靠性保证、顺序性保障机制）等中间件的原理与应用。
- **部署与运维**：掌握Docker技术，了解Kubernetes基础；拥有使用Jenkins实施CI/CD的经验；了解监控告警技术（ Prometheus + Grafana）。
- **编程基础**：掌握**JVM**的内存分析、垃圾回收机制、GC调优、性能监控；掌握**多线程并发编程**、常用**数据结构和算法**及**设计模式**；熟悉网络基础（**TCP/IP, HTTP/HTTPS**）。

<hr/>

### 💻项目经历

<h4 style="display: flex;justify-content: space-between;">
<span>一、智能餐饮推荐与服务系统</span><span>个人开发项目</span><span>2023.04 - 至今</span>
</h4>

**项目描述**：整合外卖与点评业务，基于大语言模型构建智能餐饮平台，实现智能推荐、客服自动化和评价分析三大模块，新用户首单转化率提升18%，客服人工干预率下降70%，用户投诉响应时效缩短至10分钟内。

**使用技术**：

- 后端框架：SpringBoot + MySQL + MongoDB + Redis + RabbitMQ
- AI框架：LangChain4J + Qwen-1.8B  + Chroma + 通义千问 API
- 部署与运维：Docker + Nginx

**工作亮点**：

- **智能推荐模块**：基于LangChain4J设计用户行为-菜品特征双向量模型，复购率提升25%；实现基于地域特征的冷启动方案，新用户首单转化率提高18%。
- **智能客服模块**：调用通义千问API实现常见问题自动应答（如 “退款流程”“配送范围”），设计并优化了多轮对话的Prompt，客服人工干预率降低70%。
- **智能评价模块**：使用本地部署大模型支撑评价情感分析，提取 “菜品不新鲜”“配送超时” 等关键词，推送商家告警，用户投诉响应时效从2小时缩至10分钟。
- **高并发架构优化**：对Qwen-1.8B采用4-bit量化部署，显存占用从8GB降至2.5GB，推理响应时间从800ms优化至400ms，支撑高峰期每秒30+大模型请求稳定处理；基于Sharding-JDBC对订单表水平分片，查询性能提升40%；设计Redis分布式锁 + RabbitMQ异步通信架构，订单创建耗时从500ms降至150ms。

<h4 style="display: flex;justify-content: space-between;">
<span>二、分布式云监控与智能运维平台</span><span>个人开发项目</span><span>2024.04 - 至今</span>
</h4>

**项目描述**：一站式**云资源监控与运维**平台，构建**RAG运维知识库**，解决分布式环境下运维效率低下的问题。可同时监控300+节点，故障处理效率提升40%，服务可用性达99.9%。

**使用技术**：

- 后端框架：SpringBoot + SpringCloud + MySQL + Redis + Netty + Prometheus + Grafana
- 消息队列：RabbitMQ（日志处理） + Pulsar（实时监控指标）
- 日志系统：ELK（Elasticsearch + Logstash + Kibana）
- AI框架：LangChain4J + Qwen-7B-Chat + Milvus + Sentence-BERT
- 权限控制：JWT + HTTPS 

**工作亮点**：

- **智能运维助手**：构建基于RAG的智能问答系统，将运维手册、故障案例文档按512-token粒度切片，使用sentence-transformers生成768维向量存入Milvus数据库；基于LangChain4J集成本地部署的Qwen-7B-Chat大模型，实现语义检索与生成；支持自然语言提问，检索准确率达85%，故障处理效率提升40%。
- **监控告警与日志系统**：基于Prometheus自定义Exporter采集服务器基础指标，配合Grafana构建多维度监控大盘，支持自定义告警规则；设置分级告警机制；通过Logback AsyncAppender异步发送日志到RabbitMQ，使用Logstash解析并写入Elasticsearch，实现日志快速检索，问题定位效率提升60%以上。
- **系统安全与优化**：基于Netty自定义协议实现高性能数据接收端，支持百万级并发连接；结合Pulsar消息队列实现削峰填谷，应对海量监控指标上报；使用Redis缓存热点监控数据，LRU淘汰策略保证稳定运行；实现基于JWT的RBAC权限控制与HTTPS双向认证；设计统一错误码规范与结构化日志格式，便于后期排查问题。

<hr/>

### 👩‍💻自我评价    

- **技术复合能力**：具备扎实的后端开发功底与系统架构思维，并对大模型应用开发有浓厚的兴趣和项目实践，善于将工程化思维应用于AI场景。
- **持续学习能力**：学习与适应能力强，能够快速钻研并掌握新技术，并成功将其落地于项目中（如智能餐饮系统、运维问答助手）。
- **团队协作能力**：做事认真踏实，有责任心，具备良好的团队协作精神和沟通能力，渴望在优秀的业务团队中贡献技术力量并快速成长。

