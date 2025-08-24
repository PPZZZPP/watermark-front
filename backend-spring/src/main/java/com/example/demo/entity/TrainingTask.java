package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "training_tasks", indexes = {
		@Index(name = "idx_train_model", columnList = "modelId"),
		@Index(name = "idx_train_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingTask {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 关联目标模型（可为空，表示新模型） */
	private Long modelId;

	/** 模型名称 */
	@Column(length = 200)
	private String modelName;

	/** 训练状态：processing/completed/failed */
	@Column(length = 50)
	private String status;

	private Instant startTime;
	private Instant endTime;

	/** 训练参数JSON */
	@Column(length = 2000)
	private String paramsJson;

	/** 备注或错误信息 */
	@Column(length = 1000)
	private String message;
}


