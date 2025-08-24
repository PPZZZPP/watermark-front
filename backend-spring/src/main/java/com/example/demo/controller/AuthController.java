package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import java.time.Instant;

@RestController
@RequestMapping("/api/user")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String password = (String) body.get("password");
        if (username == null || password == null) {
            return ApiResponse.error(400, "用户名或密码不能为空");
        }
        // 简化：按用户名精确匹配，密码不做校验（演示环境）
        java.util.List<User> all = userRepository.findAll();
        User found = null;
        for (User u : all) {
            if (username.equals(u.getUsername())) { found = u; break; }
        }
        if (found == null) {
            return ApiResponse.error(401, "用户名或密码错误");
        }
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("token", "mock-token-" + found.getId());
        Map<String, Object> userMap = new HashMap<String, Object>();
        userMap.put("id", found.getId());
        userMap.put("username", found.getUsername());
        userMap.put("nickname", found.getNickname());
        userMap.put("email", found.getEmail());
        userMap.put("role", found.getRole());
        data.put("user", userMap);
        return ApiResponse.ok(data);
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String password = (String) body.get("password");
        if (username == null || password == null) {
            return ApiResponse.error(400, "用户名或密码不能为空");
        }
        // 简化：若已存在则直接返回错误
        java.util.List<User> all = userRepository.findAll();
        for (User u : all) { if (username.equals(u.getUsername())) return ApiResponse.error(400, "用户名已存在"); }
        User u = User.builder()
                .username(username)
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
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("id", u.getId());
        data.put("username", u.getUsername());
        return ApiResponse.ok(data);
    }

    @GetMapping("/info")
    public ApiResponse<Map<String, Object>> info(HttpServletRequest request) {
        Long uid = parseUserIdFromToken(request);
        User u = null;
        if (uid != null) {
            u = userRepository.findById(uid).orElse(null);
        }
        if (u == null) {
            java.util.List<User> all = userRepository.findAll();
            if (!all.isEmpty()) u = all.get(0);
        }
        if (u == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("nickname", u.getNickname());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("role", u.getRole());
        return ApiResponse.ok(m);
    }

    @PutMapping("/update")
    public ApiResponse<Map<String, Object>> update(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long uid = parseUserIdFromToken(request);
        if (uid == null) return ApiResponse.error(401, "未登录");
        User u = userRepository.findById(uid).orElse(null);
        if (u == null) return ApiResponse.error(404, "用户不存在");
        if (body.containsKey("nickname")) u.setNickname((String) body.get("nickname"));
        if (body.containsKey("email")) u.setEmail((String) body.get("email"));
        if (body.containsKey("phone")) u.setPhone((String) body.get("phone"));
        if (body.containsKey("gender")) u.setGender((String) body.get("gender"));
        if (body.containsKey("department")) u.setDepartment((String) body.get("department"));
        u.setUpdatedAt(Instant.now());
        userRepository.save(u);
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("id", u.getId());
        return ApiResponse.ok(m);
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long uid = parseUserIdFromToken(request);
        if (uid == null) return ApiResponse.error(401, "未登录");
        User u = userRepository.findById(uid).orElse(null);
        if (u == null) return ApiResponse.error(404, "用户不存在");
        // 简化处理：不校验旧密码，直接写入 mock hash
        u.setPasswordHash("$2a$10$mock");
        u.setUpdatedAt(Instant.now());
        userRepository.save(u);
        return ApiResponse.ok(null);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        return ApiResponse.ok(null);
    }

    private Long parseUserIdFromToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null) return null;
        if (!auth.startsWith("Bearer ")) return null;
        String token = auth.substring(7);
        if (token.startsWith("mock-token-")) {
            try {
                return Long.parseLong(token.substring("mock-token-".length()));
            } catch (Exception ignored) {}
        }
        return null;
    }
}


