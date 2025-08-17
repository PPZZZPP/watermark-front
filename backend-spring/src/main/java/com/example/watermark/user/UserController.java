package com.example.watermark.user;

import com.example.watermark.web.ApiResponse;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public ApiResponse<Map<String, Object>> list(@RequestParam(defaultValue = "1") @Min(1) int page,
                                                 @RequestParam(defaultValue = "10") @Min(1) int pageSize,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) String role,
                                                 @RequestParam(required = false) String sortField,
                                                 @RequestParam(required = false) String sortOrder) {
        Sort sort = Sort.unsorted();
        if (sortField != null && !sortField.isBlank()) {
            sort = Sort.by("descend".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC, sortField);
        }
        var pageable = PageRequest.of(page - 1, pageSize, sort);
        var pg = userRepository.search(keyword, role, pageable);
        var list = pg.map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("nickname", u.getNickname());
            m.put("email", u.getEmail());
            m.put("phone", u.getPhone());
            m.put("gender", u.getGender());
            m.put("department", u.getDepartment());
            m.put("role", u.getRole());
            m.put("createTime", u.getCreatedAt());
            m.put("lastLoginTime", u.getLastLoginAt());
            return m;
        }).toList();
        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", pg.getTotalElements());
        return ApiResponse.ok(data);
    }

    @PostMapping("/users")
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        var u = User.builder()
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
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        return ApiResponse.ok(m);
    }
}


