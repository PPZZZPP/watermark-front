package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "evaluation_records", indexes = {
		@Index(name = "idx_eval_model", columnList = "modelId"),
		@Index(name = "idx_eval_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationRecord {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 目标模型 */
	private Long modelId;

	/** 测试数据集名称 */
	@Column(length = 200)
	private String testDatasetName;

	/** 评估状态：evaluating/failed/evaluated/published */
	@Column(length = 50)
	private String status;

	/** 指标 */
	private Double psnr;
	private Double ssim;

	private Instant startTime;
	private Instant endTime;

	/** 备注或错误信息 */
	@Column(length = 1000)
	private String message;
}


