package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_roles", indexes = {
		@Index(name = "uk_user_role", columnList = "user_id,role_id", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id; // 使用自增主键，便于JPA管理

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "role_id", nullable = false)
	private Long roleId;
}

 