package com.example.demo.entity;

import javax.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_username", columnList = "username", unique = true),
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_phone", columnList = "phone", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 50)
    private String nickname;

    @Column(length = 10)
    private String gender; // male/female/unknown

    @Column(length = 50)
    private String department;

    @Column(length = 20)
    private String role; // admin/user

    private String avatarUrl;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
    private Boolean isActive;
}


