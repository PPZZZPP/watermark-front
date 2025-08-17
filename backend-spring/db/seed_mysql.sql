-- 仅初始化（或补充）示例数据，不创建数据库/表
-- 前置条件：数据库与表已经通过 init_mysql.sql 创建完成

USE `watermark`;

-- 确保系统模型存在（与后端枚举一致：ModelStatus.active/inactive/draft）
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

-- 管理员用户（示例），密码哈希需自行替换
INSERT INTO `users` (`username`, `password_hash`, `role`, `is_active`, `created_at`)
SELECT * FROM (
  SELECT 'admin', '$2a$10$changeme', 'admin', 1, NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username`='admin');

SET @adminId := (SELECT id FROM `users` WHERE `username`='admin' LIMIT 1);

-- 示例项目
INSERT INTO `projects`(`name`, `description`, `owner_user_id`, `status`, `progress`, `video_count`, `cover_url`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT '企业宣传视频水印', '用于公司宣传片的嵌入测试', @adminId, 'processing', 35, 3, '/static/covers/cover1.png', NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `projects` WHERE `name`='企业宣传视频水印');

INSERT INTO `projects`(`name`, `description`, `owner_user_id`, `status`, `progress`, `video_count`, `cover_url`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT '新品发布会水印', '发布会视频溯源', @adminId, 'pending', 0, 1, '/static/covers/cover2.png', NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `projects` WHERE `name`='新品发布会水印');

SET @p1 := (SELECT id FROM `projects` WHERE `name`='企业宣传视频水印' LIMIT 1);
SET @p2 := (SELECT id FROM `projects` WHERE `name`='新品发布会水印' LIMIT 1);

-- 项目1：原视频
INSERT INTO `videos`(`project_id`, `role`, `filename`, `mime`, `size_bytes`, `duration_ms`, `width`, `height`, `fps`,
                     `storage_key`, `url`, `cover_storage_key`, `cover_url`, `status`, `progress`, `model_code`,
                     `watermark_text`, `note`, `upload_user_id`, `upload_time`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT @p1, 'original', 'corp-intro.mp4', 'video/mp4', 104857600, 120000, 1920, 1080, 29.97,
         'videos/p1/original/corp-intro.mp4', '/media/p1/corp-intro.mp4', NULL, '/static/covers/cover1.png',
         'completed', 100, NULL, NULL, '原视频', @adminId, NOW(6), NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `videos` WHERE `project_id`=@p1 AND `role`='original'
);

-- 项目1：嵌入视频（已生成）
INSERT INTO `videos`(`project_id`, `role`, `filename`, `mime`, `size_bytes`, `duration_ms`, `width`, `height`, `fps`,
                     `storage_key`, `url`, `cover_storage_key`, `cover_url`, `status`, `progress`, `model_code`,
                     `watermark_text`, `note`, `upload_user_id`, `upload_time`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT @p1, 'embedded', 'corp-intro-wm.mp4', 'video/mp4', 110100480, 120000, 1920, 1080, 29.97,
         'videos/p1/embedded/corp-intro-wm.mp4', '/media/p1/corp-intro-wm.mp4', NULL, '/static/covers/cover1-wm.png',
         'completed', 100, 'wm-pro', 'Project#P1-品牌水印-2025', '嵌入结果', @adminId, NOW(6), NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `videos` WHERE `project_id`=@p1 AND `role`='embedded'
);

-- 项目1：待提取视频（多条）
INSERT INTO `videos`(`project_id`, `role`, `filename`, `mime`, `size_bytes`, `duration_ms`, `width`, `height`, `fps`,
                     `storage_key`, `url`, `status`, `progress`, `model_code`, `note`, `upload_user_id`, `upload_time`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT @p1, 'to_extract', 'corp-clip-01.mp4', 'video/mp4', 25165824, 30000, 1280, 720, 30.00,
         'videos/p1/to_extract/corp-clip-01.mp4', '/media/p1/corp-clip-01.mp4', 'pending', 10, NULL, '待检验分片1', @adminId, NOW(6), NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `videos` WHERE `project_id`=@p1 AND `role`='to_extract' AND `filename`='corp-clip-01.mp4'
);

INSERT INTO `videos`(`project_id`, `role`, `filename`, `mime`, `size_bytes`, `duration_ms`, `width`, `height`, `fps`,
                     `storage_key`, `url`, `status`, `progress`, `model_code`, `note`, `upload_user_id`, `upload_time`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT @p1, 'to_extract', 'corp-clip-02.mp4', 'video/mp4', 29360128, 38000, 1280, 720, 30.00,
         'videos/p1/to_extract/corp-clip-02.mp4', '/media/p1/corp-clip-02.mp4', 'completed', 100, 'wm-pro', '待检验分片2', @adminId, NOW(6), NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `videos` WHERE `project_id`=@p1 AND `role`='to_extract' AND `filename`='corp-clip-02.mp4'
);

-- 项目2：仅有原视频
INSERT INTO `videos`(`project_id`, `role`, `filename`, `mime`, `size_bytes`, `duration_ms`, `width`, `height`, `fps`,
                     `storage_key`, `url`, `status`, `progress`, `note`, `upload_user_id`, `upload_time`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT @p2, 'original', 'launch.mp4', 'video/mp4', 73400320, 90000, 1920, 1080, 25.00,
         'videos/p2/original/launch.mp4', '/media/p2/launch.mp4', 'completed', 100, '原视频', @adminId, NOW(6), NOW(6), NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `videos` WHERE `project_id`=@p2 AND `role`='original'
);

-- 合规记录：为项目1的嵌入/提取写入示例
SET @v_embed := (SELECT id FROM `videos` WHERE `project_id`=@p1 AND `role`='embedded' LIMIT 1);
SET @v_toext2 := (SELECT id FROM `videos` WHERE `project_id`=@p1 AND `role`='to_extract' AND `filename`='corp-clip-02.mp4' LIMIT 1);

INSERT INTO `compliance_records`(`operation`, `user_id`, `project_id`, `video_id`, `model_code`, `model_version`, `parameters_json`, `result_summary`, `video_hash_algo`, `video_hash`, `signature`, `report_no`, `created_at`)
SELECT * FROM (
  SELECT 'embed', @adminId, @p1, @v_embed, 'wm-pro', '1.2.0', '{"text":"Project#P1-品牌水印-2025"}', '嵌入完成', 'SHA256', 'abcd1234', 'sig-embed-001', 'RPT-EM-001', NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `compliance_records` WHERE `operation`='embed' AND `project_id`=@p1
);

INSERT INTO `compliance_records`(`operation`, `user_id`, `project_id`, `video_id`, `model_code`, `model_version`, `parameters_json`, `result_summary`, `video_hash_algo`, `video_hash`, `signature`, `report_no`, `created_at`)
SELECT * FROM (
  SELECT 'extract', @adminId, @p1, @v_toext2, 'wm-pro', '1.2.0', '{"autoMatch":true}', '检测结果：命中品牌水印', 'SHA256', 'efgh5678', 'sig-extract-002', 'RPT-EX-002', NOW(6)
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `compliance_records` WHERE `operation`='extract' AND `project_id`=@p1
);



