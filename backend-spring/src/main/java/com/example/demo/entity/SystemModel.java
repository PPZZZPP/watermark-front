package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * 系统模型实体：提供给水印嵌入/提取使用的“已发布模型”列表。
 */
@Entity
@Table(name = "system_models", indexes = {
        @Index(name = "idx_sysmodel_code", columnList = "code", unique = true),
        @Index(name = "idx_sysmodel_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 模型编码：供前端选择使用（作为 code/value） */
    @Column(nullable = false, length = 100)
    private String code;

    /** 模型展示名称 */
    @Column(nullable = false, length = 200)
    private String name;

    /** 版本 */
    private String version;

    /** 状态：active=已发布/启用 */
    @Enumerated(EnumType.STRING)
    private ModelStatus status;

    /** 扩展字段：描述、参数、训练/验证集地址、同组ID、嵌入/提取模型地址 */
    @Column(length = 1000)
    private String description;

    @Column(length = 2000)
    private String parametersJson;

    @Column(length = 500)
    private String trainDatasetUrl;

    @Column(length = 500)
    private String valDatasetUrl;

    private Long groupId;

    @Column(length = 500)
    private String embedModelUrl;

    @Column(length = 500)
    private String extractModelUrl;

    private Instant createdAt;
    private Instant updatedAt;

    /** 发布人 */
    @Column(length = 100)
    private String publisher;

    /** 适用场景（逗号分隔存储） */
    @Column(length = 500)
    private String applicableScenarios;

    /** 发布时间（可选） */
    private Instant publishedAt;
}


