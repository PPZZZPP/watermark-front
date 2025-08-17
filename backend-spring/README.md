Watermark 后端（Spring Boot）

本项目使用 Spring Boot 3.3，默认端口 8080，默认使用内存数据库 H2（零配置即可运行）。

环境要求
- JDK 24（已安装即可。注意：本项目的编译目标是 21，用 JDK 24 运行没有问题）
- Maven 3.9+
- 可选：MySQL 8.x（如需持久化数据）

关键配置
- 端口：server.port=8080（在 src/main/resources/application.yml）
- Profile：默认 h2，可切换为 mysql
- H2 控制台：/h2-console

快速启动（H2 模式）
在项目根目录执行（Windows PowerShell）：

```powershell
cd backend-spring
mvn -v
mvn spring-boot:run
```

启动成功后，后端地址：http://localhost:8080

常用联调接口示例：
- GET http://localhost:8080/system/model/list?status=published
- GET http://localhost:8080/api/project/list

切换到 MySQL（可选）
1) 创建数据库：CREATE DATABASE watermark DEFAULT CHARACTER SET utf8mb4;
2) 启动时指定 profile：

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
# 或打包后
mvn clean package -DskipTests
java -jar target/watermark-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=mysql
```

默认 MySQL 连接在 application.yml 中，可按需改为你的用户名密码：
- url: jdbc:mysql://localhost:3306/watermark?...
- username: root
- password: root

前端如何访问后端
前端 Vite 已配置代理（vite.config.js）：
- /api → http://localhost:8080
- /system → http://localhost:8080

步骤：
1) 启动后端（见上方）
2) 另开终端启动前端：

```powershell
cd ..\
npm install
npm run dev
```

3) 打开 http://localhost:3000，前端访问 /api/**、/system/** 会自动代理到后端 8080。

提示：如果你之前启用了前端的 MSW Mock（src/main.js），为避免与真实后端冲突，可暂时注释 setupMockService() 的调用，或改成：

```js
if (false && import.meta.env.DEV) { /* 原来的 mock 启动代码 */ }
```

JDK 24 相关说明
- 当前 pom.xml 中 `<java.version>21</java.version>`：建议保持 21（LTS，兼容性好）。用 JDK 24 运行没问题。
- 如坚持编译成 24：将 pom.xml 的 `<java.version>` 改为 `24` 即可（若依赖未适配可能报错，不建议初学者修改）。

目录结构说明（简要）
backend-spring/
- pom.xml                      Maven 配置（依赖、插件、Java 版本）
- README.md                    本说明
- src/main/java/...            代码目录（见 java/README.md 详解）
- src/main/resources/          配置目录（application.yml 等）
- target/                      构建输出（打包后生成）

常见问题
- 端口被占用：修改 application.yml 的 server.port 或关闭占用该端口的程序
- 连接 MySQL 失败：检查数据库是否创建、账号密码是否正确、端口是否开放
- 前端仍然是 Mock 数据：请暂时禁用 src/main.js 的 MSW 启动逻辑


