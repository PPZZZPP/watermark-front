后端启动与运维说明（Java 8 / Spring Boot 2.7）

本文件说明后端的启动要求、数据库配置、构建与运行方式、健康检查与常见问题。

一、技术与目录

- JDK: Java 8（pom.xml 已设置 <java.version>1.8）
- Spring Boot: 2.7.18
- 数据库: MySQL 8（默认，不再使用 H2）
- 包路径: `com.example.demo`
- 关键位置:
  - 程序入口: `com/example/demo/DemoApplication.java`
  - 配置文件: `src/main/resources/application.yml`
  - Web 统一响应: `com/example/demo/web/ApiResponse.java`
  - 领域模块: `controller/`, `entity/`, `repository/`, `service/`

二、数据库配置（MySQL 默认）

- 连接字符串已启用自动建库: `createDatabaseIfNotExist=true`
- 默认配置（可在启动时覆盖）:
  - URL: `jdbc:mysql://localhost:3306/watermark?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=utf8&createDatabaseIfNotExist=true`
  - 用户名: `root`
  - 密码: `123`
- 启动时会自动执行初始化脚本（Spring SQL init 已开启）:
  - `src/main/resources/schema.sql`（建表/索引/外键等）
  - `src/main/resources/data.sql`（示例数据）

三、快速构建与启动（Windows PowerShell）

1) 进入后端目录并构建
```powershell
cd backend-spring
mvn -DskipTests clean package
```

2) 使用 Maven 启动（开发期推荐）
```powershell
mvn -DskipTests spring-boot:run
```
如需覆盖数据库账户:
```powershell
mvn -DskipTests -Dspring.datasource.username=root -Dspring.datasource.password=123 spring-boot:run
```

3) 或使用可执行 JAR 启动
```powershell
java -jar target/watermark-backend-0.0.1-SNAPSHOT.jar
```
覆盖数据库账户:
```powershell
java -Dspring.datasource.username=root -Dspring.datasource.password=123 -jar target/watermark-backend-0.0.1-SNAPSHOT.jar
```

四、健康检查与验证

- 健康检查（无需依赖数据库）:
  - `GET http://localhost:8080/health/ping`
- 数据库连通性检查:
  - `GET http://localhost:8080/health/db`
- 示例功能接口（分页列出模型）:
  - `GET http://localhost:8080/system/model/list?page=1&pageSize=10`

五、常见问题与排错

- Access denied for user 'root'@'localhost'
  - 确认用户名/密码；或以参数覆盖启动（见上文）。
  - 如需新建数据库与用户:
    ```sql
    CREATE DATABASE IF NOT EXISTS watermark DEFAULT CHARACTER SET utf8mb4;
    CREATE USER 'wm'@'localhost' IDENTIFIED BY 'wm123';
    GRANT ALL PRIVILEGES ON watermark.* TO 'wm'@'localhost';
    FLUSH PRIVILEGES;
    ```
    随后以 `-Dspring.datasource.username=wm -Dspring.datasource.password=wm123` 启动。

- Unknown database 'watermark'
  - 连接串已包含 `createDatabaseIfNotExist=true`；若仍失败，可手工执行 `CREATE DATABASE watermark;`。

- UnsupportedClassVersionError（类版本不兼容）
  - 请确保 `java -version`、`javac -version` 都为 1.8，并在 `backend-spring` 执行:
    ```powershell
    mvn -DskipTests clean package
    ```
    然后再启动。

- 端口被占用
  - 修改 `src/main/resources/application.yml` 中 `server.port`，或释放目标端口。

六、前端联调（可选）

- 前端开发服务器默认在 `http://localhost:3000`，后端在 `http://localhost:8080`。
- 按需在前端代理或接口基址中指向后端地址。

—— 文档到此。如需补充更多环境/部署细节，可在此文件继续完善。
