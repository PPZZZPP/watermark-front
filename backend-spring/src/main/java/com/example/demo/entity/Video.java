package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * 视频实体：仅存储元数据与对象存储URL/Key。
 */
@Entity
@Table(name = "videos", indexes = {
        @Index(name = "idx_videos_project", columnList = "projectId"),
        @Index(name = "idx_videos_role", columnList = "role"),
        @Index(name = "idx_videos_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 归属项目 */
    private Long projectId;

    /** 角色 original/embedded/to_extract */
    @Enumerated(EnumType.STRING)
    private VideoRole role;

    /** 基础元数据 */
    private String filename;
    private String mime;
    private Long sizeBytes;
    private Long durationMs;
    private Integer width;
    private Integer height;
    private Double fps;

    /** 存储与访问 */
    private String storageKey;
    private String url;
    private String coverStorageKey;
    private String coverUrl;

    /** 状态与过程 */
    @Enumerated(EnumType.STRING)
    private VideoStatus status;
    private Integer progress;
    private String errorMsg;

    /** 水印元信息（生成或提取） */
    private String modelCode;
    @Column(length = 2000)
    private String watermarkText;
    @Column(length = 1000)
    private String note;

    /** 审计 */
    private Long uploadUserId;
    private Instant uploadTime;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
}


