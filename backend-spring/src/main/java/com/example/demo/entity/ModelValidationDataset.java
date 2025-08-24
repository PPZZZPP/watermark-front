package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "model_validation_datasets", uniqueConstraints = @UniqueConstraint(name = "uk_mvd", columnNames = {"model_id", "dataset_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelValidationDataset {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "model_id", nullable = false)
	private Long modelId;

	@Column(name = "dataset_id", nullable = false)
	private Long datasetId;
}

 