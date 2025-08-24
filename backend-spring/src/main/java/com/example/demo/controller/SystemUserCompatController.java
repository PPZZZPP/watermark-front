package com.example.demo.controller;

import com.example.demo.repository.UserRepository;
import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/system/user")
public class SystemUserCompatController {

    private final UserRepository userRepository;

    public SystemUserCompatController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/create")
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        com.example.demo.entity.User u = com.example.demo.entity.User.builder()
                .username((String) body.get("username"))
                .passwordHash("$2a$10$mock")
                .email((String) body.get("email"))
                .phone((String) body.get("phone"))
                .nickname((String) body.getOrDefault("nickname", ""))
                .gender((String) body.getOrDefault("gender", "unknown"))
                .department((String) body.getOrDefault("department", ""))
                .role((String) body.getOrDefault("role", "user"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isActive(true)
                .build();
        u = userRepository.save(u);
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        return ApiResponse.ok(m);
    }

    @PutMapping("/update/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        com.example.demo.entity.User u = userRepository.findById(id).orElse(null);
        if (u == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        if (body.containsKey("email")) u.setEmail((String) body.get("email"));
        if (body.containsKey("phone")) u.setPhone((String) body.get("phone"));
        if (body.containsKey("nickname")) u.setNickname((String) body.get("nickname"));
        if (body.containsKey("gender")) u.setGender((String) body.get("gender"));
        if (body.containsKey("department")) u.setDepartment((String) body.get("department"));
        if (body.containsKey("role")) u.setRole((String) body.get("role"));
        u.setUpdatedAt(Instant.now());
        userRepository.save(u);
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("id", u.getId());
        return ApiResponse.ok(m);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ApiResponse.ok(null);
    }

    @PutMapping("/reset-password/{id}")
    public ApiResponse<Void> resetPassword(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        com.example.demo.entity.User u = userRepository.findById(id).orElse(null);
        if (u == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        // 简化处理：重置为 mock hash
        u.setPasswordHash("$2a$10$mock");
        u.setUpdatedAt(Instant.now());
        userRepository.save(u);
        return ApiResponse.ok(null);
    }
}


