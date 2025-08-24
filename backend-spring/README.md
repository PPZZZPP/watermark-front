Watermark 后端（Spring Boot）

本项目使用 Spring Boot 3.3，默认端口 8080，默认使用 MySQL（已移除 H2）。

环境要求
- JDK 21（推荐，LTS）。如使用 JDK 24，某些注解处理器可能不兼容，建议保持 21。
- Maven 3.9+
- MySQL 8.x（启动前需可用）

关键配置（src/main/resources/application.yml）
- 端口：server.port=8080
- 数据源：spring.datasource.url/username/password（默认 `root/root`）
- JPA：spring.jpa.hibernate.ddl-auto=none（表结构由 SQL 脚本管理）
- SQL 初始化：spring.sql.init.mode=always（自动执行 schema.sql、data.sql）

数据库初始化脚本（自动执行）
- `schema.sql`：建库建表（包含 `CREATE DATABASE IF NOT EXISTS watermark;`）。
- `data.sql`：基础与示例数据（幂等插入）。
说明：若当前 MySQL 账户无“建库”权限，可手动先创建数据库，然后删掉 `schema.sql` 里的 `CREATE DATABASE` 语句或保留也可（无权限会报错）。

快速启动（Windows PowerShell）
```powershell
cd backend-spring
mvn -v
mvn clean package -DskipTests
mvn spring-boot:run
# 或
java -jar target/watermark-backend-0.0.1-SNAPSHOT.jar
```

启动成功后：后端地址 `http://localhost:8080`

常用联调接口示例
- GET http://localhost:8080/system/model/list
- GET http://localhost:8080/api/project/list

前端如何访问后端
- Vite 代理（vite.config.js）：
  - /api → http://localhost:8080
  - /system → http://localhost:8080
步骤：
```powershell
# 另开终端
cd ..\
npm install
npm run dev
```
打开 `http://localhost:3000`，前端访问 /api/**、/system/** 会自动代理到后端 8080。
提示：如启用了前端 MSW Mock（src/main.js），为避免冲突可临时关闭。

目录结构（简要）
backend-spring/
- pom.xml                      Maven 配置
- README.md                    本说明
- src/main/java/...            代码目录
- src/main/resources/          应用配置与 SQL（application.yml、schema.sql、data.sql）
- target/                      构建输出

常见问题
- 无法连接 MySQL：检查服务是否运行、账号密码与端口、是否允许本机访问。
- 建库权限不足：手动在 MySQL 中执行 `CREATE DATABASE watermark DEFAULT CHARACTER SET utf8mb4;`，或为账户授予权限。
- 端口被占用：调整 application.yml 中 `server.port`。
