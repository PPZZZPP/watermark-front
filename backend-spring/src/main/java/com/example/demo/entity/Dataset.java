package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "datasets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dataset {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 200)
	private String name;

	@Column(nullable = false, length = 500)
	private String url;

	/** train/val/test/other */
	@Column(nullable = false, length = 50)
	private String type;

	@Column(length = 1000)
	private String description;

	private Instant createdAt;
}

 