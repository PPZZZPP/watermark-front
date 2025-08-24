package com.example.demo.controller;

import com.example.demo.entity.ModelStatus;
import com.example.demo.repository.SystemModelRepository;
import com.example.demo.web.ApiResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/system/model")
public class SystemModelController {
    private final SystemModelRepository repository;
    private final com.example.demo.repository.EvaluationRecordRepository evaluationRecordRepository;

    public SystemModelController(SystemModelRepository repository, com.example.demo.repository.EvaluationRecordRepository evaluationRecordRepository) {
        this.repository = repository;
        this.evaluationRecordRepository = evaluationRecordRepository;
    }

    @GetMapping("/list")
    public ApiResponse<Map<String, Object>> list(@RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "10") int pageSize,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String scenario) {
        org.springframework.data.domain.Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        if ("published".equalsIgnoreCase(status)) {
            java.util.List<com.example.demo.entity.SystemModel> all = repository.search(keyword, null, scenario, PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
            java.util.List<com.example.demo.entity.SystemModel> filtered = new java.util.ArrayList<>();
            for (com.example.demo.entity.SystemModel m : all) { if (m.getStatus() != ModelStatus.draft) filtered.add(m); }
            int from = Math.max(0, Math.min((page - 1) * pageSize, filtered.size()));
            int to = Math.max(0, Math.min(from + pageSize, filtered.size()));
            java.util.List<com.example.demo.entity.SystemModel> list = filtered.subList(from, to);
            Map<String, Object> data = new HashMap<>();
            data.put("list", list);
            data.put("page", page);
            data.put("pageSize", pageSize);
            data.put("total", filtered.size());
            return ApiResponse.ok(data);
        }

        ModelStatus s = null;
        if (status != null && status.trim().length() > 0) {
            s = ModelStatus.valueOf(status);
        }
        org.springframework.data.domain.Page<com.example.demo.entity.SystemModel> pg = repository.search(keyword, s, scenario, pageable);
        Map<String, Object> data = new HashMap<>();
        data.put("list", pg.getContent());
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", pg.getTotalElements());
        return ApiResponse.ok(data);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        // 若存在发布状态的评估记录，删除后需要将其状态退回为已评估
        java.util.Optional<com.example.demo.entity.SystemModel> modelOpt = repository.findById(id);
        if (modelOpt.isPresent()) {
            java.util.List<com.example.demo.entity.EvaluationRecord> list = evaluationRecordRepository.findByModelIdOrderByStart(id);
            for (com.example.demo.entity.EvaluationRecord rec : list) {
                if ("published".equalsIgnoreCase(rec.getStatus())) {
                    rec.setStatus("evaluated");
                    evaluationRecordRepository.save(rec);
                }
            }
        }
        repository.deleteById(id);
        return ApiResponse.ok(null);
    }
}


