package com.example.demo.controller;

import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.VideoRepository;
import com.example.demo.repository.VideoTaskRepository;
import com.example.demo.service.ComplianceService;
import com.example.demo.entity.*;
import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/watermark")
public class WatermarkController {
    private final VideoRepository videoRepository;
    private final ProjectRepository projectRepository;
    private final ComplianceService complianceService;
    private final VideoTaskRepository videoTaskRepository;

    public WatermarkController(VideoRepository videoRepository,
                               ProjectRepository projectRepository,
                               ComplianceService complianceService,
                               VideoTaskRepository videoTaskRepository) {
        this.videoRepository = videoRepository;
        this.projectRepository = projectRepository;
        this.complianceService = complianceService;
        this.videoTaskRepository = videoTaskRepository;
    }

    @PostMapping("/embed")
    public ApiResponse<Map<String, Object>> embed(@RequestBody Map<String, Object> body) {
        Long projectId = parseLong(body.get("projectId"));
        String model = (String) body.get("model");
        String watermarkText = (String) body.getOrDefault("watermarkText", "");

        com.example.demo.entity.Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        com.example.demo.entity.Video original = null;
        for (com.example.demo.entity.Video v : videoRepository.findAll()) {
            if (v.getProjectId().equals(projectId) && v.getRole() == VideoRole.original) { original = v; break; }
        }
        if (original == null) throw new IllegalStateException("original video not found");

        com.example.demo.entity.Video embedded = Video.builder()
                .projectId(projectId)
                .role(VideoRole.embedded)
                .filename(original.getFilename().replaceAll("(\\.[^.]+)?$", "-embedded.mp4"))
                .sizeBytes((long) Math.floor((original.getSizeBytes() == null ? 100_000_000L : original.getSizeBytes()) * 1.1))
                .url("/sample-embedded.mp4")
                .coverUrl(original.getCoverUrl())
                .status(VideoStatus.completed)
                .progress(100)
                .modelCode(model)
                .watermarkText(watermarkText)
                .uploadTime(Instant.now())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        embedded = videoRepository.save(embedded);

        // 记录任务（embed）
        java.util.Map<String, Object> taskParams = new java.util.HashMap<String, Object>();
        taskParams.put("model", model);
        taskParams.put("watermarkText", watermarkText);
        java.util.Map<String, Object> taskResult = new java.util.HashMap<String, Object>();
        taskResult.put("videoId", embedded.getId());

        com.example.demo.entity.VideoTask task = com.example.demo.entity.VideoTask.builder()
                .projectId(projectId)
                .videoId(embedded.getId())
                .type("embed")
                .status("completed")
                .progress(100)
                .paramsJson(toJson(taskParams))
                .resultJson(toJson(taskResult))
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .build();
        videoTaskRepository.save(task);

        java.util.Map<String, Object> opParams = new java.util.HashMap<String, Object>();
        opParams.put("watermarkText", watermarkText);

        complianceService.recordOperation(
                "embed",
                1L,
                projectId,
                embedded.getId(),
                model,
                "1.0.0",
                toJson(opParams),
                "Embedded video generated",
                "sha256",
                "mockhash=="
        );

        Map<String, Object> data = new HashMap<>();
        data.put("id", "embed-" + embedded.getId());
        data.put("filename", embedded.getFilename());
        data.put("url", embedded.getUrl());
        data.put("coverUrl", embedded.getCoverUrl());
        data.put("model", embedded.getModelCode());
        data.put("watermarkText", embedded.getWatermarkText());
        return ApiResponse.ok(data);
    }

    @PostMapping("/extract")
    public ApiResponse<Map<String, Object>> extract(@RequestBody Map<String, Object> body) {
        Long projectId = parseLong(body.get("projectId"));
        Long videoId = parseLong(body.get("videoId"));

        com.example.demo.entity.Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found"));

        String result = "WM-INFO-FAKE";
        String model = "wm-pro";

        video.setStatus(VideoStatus.completed);
        video.setProgress(100);
        video.setWatermarkText(result);
        video.setModelCode(model);
        video.setUpdatedAt(Instant.now());
        videoRepository.save(video);

        // 记录任务（extract）
        java.util.Map<String, Object> extractResult = new java.util.HashMap<String, Object>();
        extractResult.put("watermark", result);
        extractResult.put("model", model);

        com.example.demo.entity.VideoTask task = com.example.demo.entity.VideoTask.builder()
                .projectId(projectId)
                .videoId(videoId)
                .type("extract")
                .status("completed")
                .progress(100)
                .paramsJson(null)
                .resultJson(toJson(extractResult))
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .build();
        videoTaskRepository.save(task);

        complianceService.recordOperation(
                "extract",
                1L,
                projectId,
                videoId,
                model,
                "1.0.0",
                null,
                "watermark=" + result,
                "sha256",
                "mockhash=="
        );

        Map<String, Object> data = new HashMap<>();
        data.put("id", videoId);
        data.put("watermarkInfo", result);
        data.put("model", model);
        return ApiResponse.ok(data);
    }

    private Long parseLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        return Long.parseLong(String.valueOf(v));
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (java.util.Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(',');
            sb.append('"').append(e.getKey()).append('"').append(':');
            Object val = e.getValue();
            if (val == null) {
                sb.append("null");
            } else {
                sb.append('"').append(String.valueOf(val).replace("\"", "\\\"")).append('"');
            }
            first = false;
        }
        sb.append('}');
        return sb.toString();
    }
}


