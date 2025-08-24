package com.example.demo.controller;

import com.example.demo.entity.TrainingTask;
import com.example.demo.repository.TrainingTaskRepository;
import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/system/training")
public class TrainingController {
    private final TrainingTaskRepository repository;

    public TrainingController(TrainingTaskRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/start")
    public ApiResponse<Map<String, Object>> start(@RequestBody TrainingTask req) {
        req.setStatus("processing");
        req.setStartTime(Instant.now());
        com.example.demo.entity.TrainingTask saved = repository.save(req);
        Map<String, Object> data = new HashMap<>();
        data.put("task", saved);
        return ApiResponse.ok(data);
    }

    @GetMapping("/history")
    public ApiResponse<Map<String, Object>> history(@RequestParam(required = false) Long modelId) {
        java.util.List<com.example.demo.entity.TrainingTask> list = repository.findByModelIdOrderByStart(modelId);
        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", list.size());
        return ApiResponse.ok(data);
    }
}


