# 后端目录结构与关键说明

本项目为 Spring Boot 3.3（JPA + Web）示例后端，提供视频水印嵌入/提取与合规审计接口。

## 运行环境

- Java：JDK 17+（JDK 24 也可运行，建议使用兼容目标 17 的构建）
- 构建：Maven
- 数据库：默认激活 H2 内存库（开发），也保留 MySQL 配置（生产）

## 配置文件

- `src/main/resources/application.yml`：基础配置，默认 `spring.profiles.active=h2`
- `src/main/resources/application-h2.yml`：H2 开发配置，内存数据库、开启 H2 控制台

访问 H2 控制台：`http://localhost:8080/h2-console`，JDBC URL 使用 `jdbc:h2:mem:watermark`

## 关键包与类

- `WatermarkBackendApplication.java`：应用入口。启动后初始化三条系统模型示例数据
- `watermark/WatermarkController.java`：水印接口
  - `POST /api/watermark/embed`：演示生成嵌入视频元数据并写入合规记录
  - `POST /api/watermark/extract`：演示提取水印结果并写入合规记录
- `compliance/`
  - `ComplianceController.java`：查询合规记录、导出简单文本报告
  - `ComplianceService.java`：生成报告编号与签名并保存记录
  - `ComplianceRecord.java`、`ComplianceRecordRepository.java`：实体与仓库
- `project/`
  - `Project.java`、`ProjectRepository.java`、`ProjectController.java`
- `systemmodel/`
  - `SystemModel.java`、`SystemModelRepository.java`、`SystemModelController.java`
- `video/`
  - `Video.java`、`VideoRepository.java`、`VideoRole.java`、`VideoStatus.java`
- `web/ApiResponse.java`：统一响应体

## 数据库切换（H2 ⇄ MySQL）

- 开发（默认 H2）：无需安装数据库，直接运行
- 切换到 MySQL：在 `application.yml` 中将 `spring.profiles.active` 设为 `default` 或移除该行，并确保本地 MySQL 连接可用

## 启动方式（Windows PowerShell）

1. 在项目根目录执行：`cd backend-spring`
2. 直接运行：`./mvnw spring-boot:run`（第一次会下载依赖，耐心等待）
   - 若没有 `mvnw`，请安装 Maven 后运行：`mvn spring-boot:run`
3. 后端默认端口 `8080`
4. 前端（Vite）开发代理已将 `/api` 代理到 `http://localhost:8080`

## API 速览

- `GET /system/model/list`：模型列表（前端下拉使用）
- `POST /api/watermark/embed`：嵌入水印（演示）
- `POST /api/watermark/extract`：提取水印（演示）
- `GET /api/compliance/records`：合规记录分页
- `GET /api/compliance/report/{id}/export`：导出报告






