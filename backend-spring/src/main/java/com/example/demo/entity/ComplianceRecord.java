package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * 合规审计记录：在水印嵌入/提取等操作时生成，不可篡改（可结合WORM/对象存储+签名增强）。
 */
@Entity
@Table(name = "compliance_records", indexes = {
        @Index(name = "idx_comp_project", columnList = "projectId"),
        @Index(name = "idx_comp_user", columnList = "userId"),
        @Index(name = "idx_comp_op", columnList = "operation")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 操作类型：embed/extract/report */
    @Column(nullable = false, length = 50)
    private String operation;

    /** 用户/项目/视频关联 */
    private Long userId;
    private Long projectId;
    private Long videoId;

    /** 模型编码与版本、嵌入参数、提取结果摘要 */
    @Column(length = 200)
    private String modelCode;
    @Column(length = 100)
    private String modelVersion;
    @Column(length = 2000)
    private String parametersJson;
    @Column(length = 1000)
    private String resultSummary;

    /** 视频完整性校验：哈希与算法 */
    @Column(length = 100)
    private String videoHashAlgo;
    @Column(length = 256)
    private String videoHash;

    /** 生成签名（可结合私钥签名生成），与报告编号 */
    @Column(length = 256)
    private String signature;
    @Column(length = 100)
    private String reportNo;

    private Instant createdAt;
}


