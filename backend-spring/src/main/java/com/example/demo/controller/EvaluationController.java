package com.example.demo.controller;

import com.example.demo.entity.EvaluationRecord;
import com.example.demo.entity.ModelStatus;
import com.example.demo.entity.SystemModel;
import com.example.demo.repository.EvaluationRecordRepository;
import com.example.demo.repository.SystemModelRepository;
import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/system/evaluation")
public class EvaluationController {
    private final EvaluationRecordRepository repository;
    private final SystemModelRepository systemModelRepository;

    public EvaluationController(EvaluationRecordRepository repository, SystemModelRepository systemModelRepository) {
        this.repository = repository;
        this.systemModelRepository = systemModelRepository;
    }

    @PostMapping("/start")
    public ApiResponse<Map<String, Object>> start(@RequestBody EvaluationRecord req) {
        req.setStatus("evaluating");
        req.setStartTime(Instant.now());
        com.example.demo.entity.EvaluationRecord saved = repository.save(req);
        Map<String, Object> data = new HashMap<>();
        data.put("record", saved);
        return ApiResponse.ok(data);
    }

    @PostMapping("/publish/{id}")
    public ApiResponse<Map<String, Object>> publish(@PathVariable Long id,
                                                    @RequestParam(required = false) String description,
                                                    @RequestParam(required = false) String publisher) {
        com.example.demo.entity.EvaluationRecord rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation record not found"));
        rec.setStatus("published");
        rec.setEndTime(Instant.now());
        repository.save(rec);

        // 同步到系统模型：设为已发布
        if (rec.getModelId() != null) {
            SystemModel m = systemModelRepository.findById(rec.getModelId()).orElse(null);
            if (m != null) {
                m.setStatus(ModelStatus.active);
                if (description != null && description.trim().length() > 0) {
                    m.setDescription(description);
                }
                if (publisher != null && publisher.trim().length() > 0) {
                    m.setPublisher(publisher);
                }
                m.setPublishedAt(Instant.now());
                systemModelRepository.save(m);
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("record", rec);
        return ApiResponse.ok(data);
    }

    @DeleteMapping("/record/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        com.example.demo.entity.EvaluationRecord rec = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation record not found"));
        if ("published".equalsIgnoreCase(rec.getStatus())) {
            return ApiResponse.error(400, "已发布的评估记录不可删除");
        }
        repository.deleteById(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/history")
    public ApiResponse<Map<String, Object>> history(@RequestParam(required = false) Long modelId) {
        java.util.List<com.example.demo.entity.EvaluationRecord> list = repository.findByModelIdOrderByStart(modelId);
        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", list.size());
        return ApiResponse.ok(data);
    }
}


