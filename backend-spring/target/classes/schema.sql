-- schema.sql: 启动时由 Spring Boot 自动执行（spring.sql.init.mode=always）
-- 仅负责建库与建表，示例数据放入 data.sql

CREATE DATABASE IF NOT EXISTS `watermark` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `watermark`;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS `video_tasks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT,
  `video_id` BIGINT,
  `type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `progress` INT DEFAULT 0,
  `params_json` VARCHAR(2000),
  `result_json` VARCHAR(2000),
  `error_msg` VARCHAR(1000),
  `created_at` DATETIME(6),
  `updated_at` DATETIME(6),
  PRIMARY KEY (`id`),
  KEY `idx_tasks_project` (`project_id`),
  KEY `idx_tasks_video` (`video_id`),
  KEY `idx_tasks_status` (`status`),
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_video` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `training_tasks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `model_id` BIGINT,
  `model_name` VARCHAR(200),
  `status` VARCHAR(50),
  `start_time` DATETIME(6),
  `end_time` DATETIME(6),
  `params_json` VARCHAR(2000),
  `message` VARCHAR(1000),
  PRIMARY KEY (`id`),
  KEY `idx_train_model` (`model_id`),
  KEY `idx_train_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `evaluation_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `model_id` BIGINT,
  `test_dataset_name` VARCHAR(200),
  `status` VARCHAR(50),
  `psnr` DOUBLE,
  `ssim` DOUBLE,
  `start_time` DATETIME(6),
  `end_time` DATETIME(6),
  `message` VARCHAR(1000),
  PRIMARY KEY (`id`),
  KEY `idx_eval_model` (`model_id`),
  KEY `idx_eval_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `system_models` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `version` VARCHAR(100),
  `status` VARCHAR(255),
  `description` VARCHAR(1000),
  `parameters_json` VARCHAR(2000),
  `train_dataset_url` VARCHAR(500),
  `val_dataset_url` VARCHAR(500),
  `group_id` BIGINT,
  `embed_model_url` VARCHAR(500),
  `extract_model_url` VARCHAR(500),
  `created_at` DATETIME(6),
  `updated_at` DATETIME(6),
  `publisher` VARCHAR(100),
  `applicable_scenarios` VARCHAR(500),
  `published_at` DATETIME(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sysmodel_code` (`code`),
  KEY `idx_sysmodel_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS `datasets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `description` VARCHAR(1000),
  `created_at` DATETIME(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `model_validation_datasets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `model_id` BIGINT NOT NULL,
  `dataset_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mvd` (`model_id`, `dataset_id`),
  CONSTRAINT `fk_mvd_model` FOREIGN KEY (`model_id`) REFERENCES `system_models`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mvd_dataset` FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


