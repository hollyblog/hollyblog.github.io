---
title: "基础环境搭建"
date: 2021-01-08T15:20:00+08:00
draft: false
description: "学习Java之前，先要学习基础环境搭建，包括安装JDK、配置环境变量、安装IDE等；还要掌握Maven的使用，包括安装Maven、配置环境变量、创建Maven项目等;最后要掌握Java的专业开发工具IntelliJ IDEA等。"
tags: ["Java", "基础环境"]
categories: ["Java-basics"]
---

学习Java之前，先要学习基础环境搭建，包括安装JDK、配置环境变量、安装IDE等；还要掌握Maven的使用，包括安装Maven、配置环境变量、创建Maven项目等;最后要掌握Java的专业开发工具IntelliJ IDEA等。

---

### 1. 一键安装 JDK 17（LTS）
```bash
# 0. 先装 Homebrew（若已装可跳过）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 1. 用 brew 装 JDK 17（自动配好环境变量）
brew install openjdk@17

# 2. 让系统认出 java（一次性）
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 3. 验证
java -version          # 应显示 openjdk 17.0.x
javac -version         # 同上
```
> 若出现版本号即成功；未出现请重启终端再试 。

---

### 2. 一键安装 Maven（Java 依赖管理神器）
```bash
brew install maven

# 验证
mvn -v                 # 能看到 Apache Maven 3.9.x 与 JDK 17 路径
```
Maven 默认仓库在国外，第一次下载依赖较慢，可换阿里云镜像（可选）：
```bash
mkdir -p ~/.m2
cat > ~/.m2/settings.xml <<'EOF'
<settings>
  <mirrors>
    <mirror>
      <id>aliyunmaven</id>
      <mirrorOf>*</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
EOF
```

---

### 3. 一键安装 IntelliJ IDEA
社区版免费，最好不要用社区版，后续上SpringBoot等框架时会遇到问题
```bash
brew install --cask intellij-idea-ce
```
装完在“启动台”里会出现 **IntelliJ IDEA CE**，首次打开按提示：
1. 主题/插件页一路 **Skip All and Set Defaults**  
2. 新建项目 → 左侧选 **Maven** → 右侧 **SDK** 选 **openjdk-17** → **Finish**  
3. 在 `src/main/java` 右键 → **New Java Class** → 输入 `Hello` → 写 main 方法：
```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, Java on Mac!");
    }
}
```
点击绿色 ▶️ 运行，控制台打印即环境 100 % OK 。

---

####  常用快捷键（先记 3 个）
| 功能 | 快捷键 |
|---|---|
| 运行 | `Control + R` |
| 格式化代码 | `Command + Option + L` |
| 全局搜索类 | 双击 `Shift` |

---

### 4. 一键安装 MySQL 8.0
```bash
brew install mysql@8.0
```
安装完会提示它不在默认 PATH，我们顺手配好：

```bash
echo 'export PATH="/opt/homebrew/opt/mysql@8.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

```bash
# 第一次启动
brew services start mysql@8.0

# 按提示设 root 密码、删除匿名用户、禁止远程 root 登录等
mysql_secure_installation
```
全部选 `y` 即可，密码记好 。

验证 MySQL 是否安装成功：
```bash
mysql -uroot -p
```
输入刚才的密码，看到 `mysql>` 提示符后执行：
```sql
CREATE DATABASE demo CHARACTER SET utf8mb4;
exit
```
能正常进入即安装成功 。

让 MySQL 开机自启（可选）
```bash
brew services start mysql@8.0   # 已经自带开机自启
```
以后想停/重启：
```bash
brew services stop  mysql@8.0
brew services restart mysql@8.0
```
---

### 5. 目录速查（记不住就回来翻）
| 工具 | 安装路径 | 配置文件 |
|---|---|---|
| JDK | `/opt/homebrew/opt/openjdk@17` | `~/.zshrc` |
| Maven | `/opt/homebrew/opt/maven` | `~/.m2/settings.xml` |
| IDEA | `/Applications/IntelliJ IDEA CE.app` | `~/Library/Preferences/IdeaIC2025.x` |

---



