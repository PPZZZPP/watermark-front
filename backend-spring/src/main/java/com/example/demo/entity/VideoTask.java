package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "video_tasks", indexes = {
		@Index(name = "idx_tasks_project", columnList = "projectId"),
		@Index(name = "idx_tasks_video", columnList = "videoId"),
		@Index(name = "idx_tasks_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoTask {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long projectId;
	private Long videoId;

	@Column(nullable = false, length = 50)
	private String type; // embed/extract

	@Column(nullable = false, length = 50)
	private String status; // pending/processing/completed/failed

	private Integer progress;

	@Column(length = 2000)
	private String paramsJson;

	@Column(length = 2000)
	private String resultJson;

	@Column(length = 1000)
	private String errorMsg;

	private Instant createdAt;
	private Instant updatedAt;
}

