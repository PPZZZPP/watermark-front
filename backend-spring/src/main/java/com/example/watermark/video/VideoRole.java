package com.example.watermark.video;

/**
 * 视频角色：同一项目下的角色类型。
 * original：原视频（每项目仅1个）
 * embedded：嵌入视频（每项目仅1个）
 * to_extract：待提取视频（可多个）
 */
public enum VideoRole {
    original,
    embedded,
    to_extract
}


