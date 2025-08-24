package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * 项目实体：与前端字段对齐，保存基本元信息与统计。
 */
@Entity
@Table(name = "projects", indexes = {
        @Index(name = "idx_projects_owner", columnList = "ownerUserId"),
        @Index(name = "idx_projects_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    /** 所有者用户ID（鉴权场景可用于权限控制） */
    private Long ownerUserId;

    /** 项目状态 */
    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    /** 处理进度 0-100 */
    @Column(columnDefinition = "int default 0")
    private Integer progress;

    /** 项目下视频数量统计 */
    @Column(columnDefinition = "int default 0")
    private Integer videoCount;

    /** 封面URL（可展示在列表） */
    private String coverUrl;

    /** 创建/更新时间 */
    private Instant createdAt;
    private Instant updatedAt;
}


