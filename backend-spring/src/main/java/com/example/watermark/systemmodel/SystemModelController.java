package com.example.watermark.systemmodel;

import com.example.watermark.web.ApiResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 系统模型控制器：提供 /system/model/list 接口给前端下拉框使用。
 */
@RestController
@RequestMapping("/system/model")
public class SystemModelController {
    private final SystemModelRepository repository;

    public SystemModelController(SystemModelRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/list")
    public ApiResponse<Map<String, Object>> list(@RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "10") int pageSize,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) String status) {
        var pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        // 支持 status=published 语义：返回已发布（非草稿）模型，即 active+inactive
        if ("published".equalsIgnoreCase(status)) {
            var all = repository.search(keyword, null, PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
            var filtered = all.stream().filter(m -> m.getStatus() != ModelStatus.draft).toList();
            int from = Math.max(0, Math.min((page - 1) * pageSize, filtered.size()));
            int to = Math.max(0, Math.min(from + pageSize, filtered.size()));
            var list = filtered.subList(from, to);
            Map<String, Object> data = new HashMap<>();
            data.put("list", list);
            data.put("page", page);
            data.put("pageSize", pageSize);
            data.put("total", filtered.size());
            return ApiResponse.ok(data);
        }

        ModelStatus s = null;
        if (status != null && !status.isBlank()) {
            s = ModelStatus.valueOf(status);
        }
        var pg = repository.search(keyword, s, pageable);
        Map<String, Object> data = new HashMap<>();
        data.put("list", pg.getContent());
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", pg.getTotalElements());
        return ApiResponse.ok(data);
    }
}


