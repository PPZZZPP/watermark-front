-- data.sql: 示例与基础数据（幂等）
USE `watermark`;

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

INSERT INTO `users` (`username`, `password_hash`, `role`, `is_active`, `created_at`)
SELECT * FROM (
  SELECT 'admin', '$2a$10$changeme', 'admin', 1, NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username`='admin');

INSERT INTO `roles` (`code`, `name`)
SELECT * FROM (SELECT 'admin', '管理员') t
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `code`='admin');
INSERT INTO `roles` (`code`, `name`)
SELECT * FROM (SELECT 'user', '普通用户') t
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `code`='user');
INSERT INTO `roles` (`code`, `name`)
SELECT * FROM (SELECT 'developer', '开发用户') t
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `code`='developer');

INSERT IGNORE INTO `user_roles`(`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r WHERE u.username='admin' AND r.code='admin';

