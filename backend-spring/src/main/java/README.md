Java 源码目录说明

这里是后端 Spring Boot 的源码目录（包路径 `com.example.watermark`）。

模块一览（关键包）：
- `com/example/watermark/WatermarkBackendApplication.java`：启动类
- `com/example/watermark/web/ApiResponse.java`：统一响应体
- `com/example/watermark/project/`：项目实体、仓库与接口
- `com/example/watermark/video/`：视频实体、枚举与仓库
- `com/example/watermark/watermark/`：水印嵌入/提取接口
- `com/example/watermark/systemmodel/`：系统模型（发布/启用）
- `com/example/watermark/compliance/`：合规审计与报告导出
- `com/example/watermark/user/`：用户（示例）

快速入口：
- 启动：在项目根 `backend-spring` 执行 `mvn spring-boot:run`（默认 H2 内存库）
- 配置：`src/main/resources/application.yml`（端口、数据源 Profiles 等）
- H2 控制台：`http://localhost:8080/h2-console`（JDBC URL 使用 `jdbc:h2:mem:watermark`）

进一步的详细说明见同级包下的 `com/example/watermark/PROJECT_STRUCTURE.md`。

# 后端项目结构与运行指南（面向初学者）

本后端基于 Spring Boot 3（父版本 3.3.2），默认使用内存数据库 H2，零配置即可启动。

## 目录结构速览

```
backend-spring/
  ├─ pom.xml                         # Maven 构建配置（依赖、插件、JDK 版本）
  └─ src/
     ├─ main/
     │  ├─ java/
     │  │  └─ com/example/watermark/
     │  │     ├─ WatermarkBackendApplication.java     # 程序入口（main 方法），初始化示例模型
     │  │     ├─ compliance/                           # 合规审计：记录每次嵌入/提取操作
     │  │     ├─ domain/                               # 通用枚举、共享领域对象
     │  │     ├─ project/                              # 项目实体/接口
     │  │     ├─ systemmodel/                          # 系统模型：已发布的水印模型
     │  │     ├─ user/                                 # 用户实体/接口
     │  │     ├─ video/                                # 视频实体/查询接口
     │  │     ├─ watermark/                            # 水印相关接口（嵌入/提取）
     │  │     └─ web/                                  # 通用响应封装等
     │  └─ resources/
     │     └─ application.yml          # 应用配置（已分 H2 / MySQL 两套 profile）
     └─ test/                          # 测试（当前为空，可后续补充）
```

## 运行方式（你已安装 JDK 24）

- 我们在 `pom.xml` 将编译目标设为 `Java 21`（LTS），用 JDK 24 运行没有问题（JDK24 向下运行 Java21 目标）。
- 如需用 JDK 24 编译，可把 `pom.xml` 中的 `<java.version>` 改为 `24`，并确保依赖兼容。

### 方式A：使用内存数据库 H2（默认、推荐给初学者）
1. 进入后端目录：`backend-spring`
2. 命令行执行（Windows PowerShell）：
   ```powershell
   mvn -v | cat
   mvn clean spring-boot:run -Dspring-boot.run.profiles=h2 | cat
   ```
   或先构建再运行：
   ```powershell
   mvn clean package -DskipTests | cat
   java -jar target/watermark-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=h2
   ```
3. 启动成功后：
   - 服务地址：`http://localhost:8080`
   - H2 控制台：`http://localhost:8080/h2-console`

### 方式B：切换到本地 MySQL
1. 确保本地 MySQL 运行，数据库 `watermark` 已创建，用户名/密码与 `application.yml` 的 mysql profile 一致（默认 `root/root`）。
2. 启动命令：
   ```powershell
   mvn clean spring-boot:run -Dspring-boot.run.profiles=mysql | cat
   ```

## 前端联调
- 前端 Vite 代理已将 `/api` 代理到 `http://localhost:8080`（见 `vite.config.js`）。
- 启动前端（在项目根目录）：
  ```powershell
  npm i
  npm run dev
  ```
- 浏览器将打开 `http://localhost:3000`。

## 常见问题
- 端口被占用：修改 `resources/application.yml` 中 `server.port`。
- JDK 版本冲突：如需使用 JDK 24 编译，将 `pom.xml` 的 `<java.version>` 改为 `24`，并确保 `maven-compiler-plugin` 使用 `<release>24</release>`。
- 数据库连不上：优先用 H2（默认 profile `h2`），或检查 MySQL 地址/账号。

祝你编码愉快！
