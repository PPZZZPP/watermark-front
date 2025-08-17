package com.example.watermark.systemmodel;

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

    private Instant createdAt;
    private Instant updatedAt;
}


