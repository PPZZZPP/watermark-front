package com.example.demo.controller;

import com.example.demo.entity.Role;
import com.example.demo.repository.RoleRepository;
import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/system/role")
public class RoleController {

    private final RoleRepository roleRepository;

    public RoleController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> all() {
        List<Role> roles = roleRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (Role r : roles) {
            list.add(toMap(r));
        }
        return ApiResponse.ok(list);
    }

    @GetMapping("/list")
    public ApiResponse<Map<String, Object>> list(@RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "10") int pageSize,
                                                 @RequestParam(required = false) String keyword) {
        List<Role> all = roleRepository.findAll();
        List<Role> filtered = new ArrayList<Role>();
        if (keyword != null && keyword.trim().length() > 0) {
            String kw = keyword.trim().toLowerCase();
            for (Role r : all) {
                String name = r.getName() == null ? "" : r.getName();
                String code = r.getCode() == null ? "" : r.getCode();
                if (name.toLowerCase().contains(kw) || code.toLowerCase().contains(kw)) {
                    filtered.add(r);
                }
            }
        } else {
            filtered = all;
        }

        int from = Math.max(0, Math.min((page - 1) * pageSize, filtered.size()));
        int to = Math.max(0, Math.min(from + pageSize, filtered.size()));
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (Role r : filtered.subList(from, to)) {
            list.add(toMap(r));
        }
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("list", list);
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", filtered.size());
        return ApiResponse.ok(data);
    }

    @GetMapping("/detail/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id) {
        Role r = roleRepository.findById(id).orElse(null);
        if (r == null) {
            return ApiResponse.error(404, "角色不存在");
        }
        return ApiResponse.ok(toMap(r));
    }

    private Map<String, Object> toMap(Role r) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("code", r.getCode());
        return m;
    }
}


