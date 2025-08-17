-- Watermark MySQL 初始化脚本
-- 说明：
-- 1) 可直接执行整份脚本（会先创建数据库与表，再写入少量示例数据）
-- 2) 与 Spring JPA 实体字段保持一致；字符集统一使用 utf8mb4

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `watermark` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `watermark`;

-- users 表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100),
  `phone` VARCHAR(30),
  `nickname` VARCHAR(50),
  `gender` VARCHAR(10),
  `department` VARCHAR(50),
  `role` VARCHAR(20),
  `avatar_url` VARCHAR(255),
  `created_at` DATETIME(6),
  `updated_at` DATETIME(6),
  `last_login_at` DATETIME(6),
  `is_active` TINYINT(1),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- projects 表
CREATE TABLE IF NOT EXISTS `projects` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(1000),
  `owner_user_id` BIGINT,
  `status` VARCHAR(255),
  `progress` INT DEFAULT 0,
  `video_count` INT DEFAULT 0,
  `cover_url` VARCHAR(255),
  `created_at` DATETIME(6),
  `updated_at` DATETIME(6),
  PRIMARY KEY (`id`),
  KEY `idx_projects_owner` (`owner_user_id`),
  KEY `idx_projects_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- videos 表
CREATE TABLE IF NOT EXISTS `videos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT,
  `role` VARCHAR(255),
  `filename` VARCHAR(255),
  `mime` VARCHAR(255),
  `size_bytes` BIGINT,
  `duration_ms` BIGINT,
  `width` INT,
  `height` INT,
  `fps` DOUBLE,
  `storage_key` VARCHAR(255),
  `url` VARCHAR(500),
  `cover_storage_key` VARCHAR(255),
  `cover_url` VARCHAR(500),
  `status` VARCHAR(255),
  `progress` INT,
  `error_msg` VARCHAR(1000),
  `model_code` VARCHAR(200),
  `watermark_text` VARCHAR(2000),
  `note` VARCHAR(1000),
  `upload_user_id` BIGINT,
  `upload_time` DATETIME(6),
  `created_at` DATETIME(6),
  `updated_at` DATETIME(6),
  `deleted_at` DATETIME(6),
  PRIMARY KEY (`id`),
  KEY `idx_videos_project` (`project_id`),
  KEY `idx_videos_role` (`role`),
  KEY `idx_videos_status` (`status`),
  CONSTRAINT `fk_videos_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- system_models 表
CREATE TABLE IF NOT EXISTS `system_models` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `version` VARCHAR(100),
  `status` VARCHAR(255),
  `created_at` DATETIME(6),
  `updated_at` DATETIME(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sysmodel_code` (`code`),
  KEY `idx_sysmodel_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- compliance_records 表
CREATE TABLE IF NOT EXISTS `compliance_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `operation` VARCHAR(50) NOT NULL,
  `user_id` BIGINT,
  `project_id` BIGINT,
  `video_id` BIGINT,
  `model_code` VARCHAR(200),
  `model_version` VARCHAR(100),
  `parameters_json` VARCHAR(2000),
  `result_summary` VARCHAR(1000),
  `video_hash_algo` VARCHAR(100),
  `video_hash` VARCHAR(256),
  `signature` VARCHAR(256),
  `report_no` VARCHAR(100),
  `created_at` DATETIME(6),
  PRIMARY KEY (`id`),
  KEY `idx_comp_project` (`project_id`),
  KEY `idx_comp_user` (`user_id`),
  KEY `idx_comp_op` (`operation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 示例数据：系统模型（若已存在则忽略）
INSERT INTO `system_models` (`code`, `name`, `version`, `status`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT 'wm-base' AS code, '基础模型' AS name, '1.0.0' AS version, 'active' AS status, NOW(6) AS created_at, NOW(6) AS updated_at
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `system_models` WHERE `code`='wm-base');

INSERT INTO `system_models` (`code`, `name`, `version`, `status`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT 'wm-pro', '专业模型', '1.2.0', 'active', NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `system_models` WHERE `code`='wm-pro');

INSERT INTO `system_models` (`code`, `name`, `version`, `status`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT 'wm-auto', '自动匹配', '1.1.0', 'inactive', NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `system_models` WHERE `code`='wm-auto');

-- 可选：初始化一个管理员用户（用户名 admin / 密码需在前端注册或手动设置为哈希值）
INSERT INTO `users` (`username`, `password_hash`, `role`, `is_active`, `created_at`)
SELECT * FROM (
  SELECT 'admin', '$2a$10$changeme', 'admin', 1, NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username`='admin');


