package com.example.watermark.watermark;

import com.example.watermark.compliance.ComplianceService;
import com.example.watermark.project.ProjectRepository;
import com.example.watermark.video.*;
import com.example.watermark.web.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * 水印接口：
 * - POST /api/watermark/embed 生成嵌入视频（演示：同步返回，真实建议异步任务）
 * - POST /api/watermark/extract 执行水印提取（演示：同步返回结果摘要）
 *
 * 在每次操作时调用合规服务写入审计记录。
 */
@RestController
@RequestMapping("/api/watermark")
public class WatermarkController {
    private final VideoRepository videoRepository;
    private final ProjectRepository projectRepository;
    private final ComplianceService complianceService;

    public WatermarkController(VideoRepository videoRepository,
                               ProjectRepository projectRepository,
                               ComplianceService complianceService) {
        this.videoRepository = videoRepository;
        this.projectRepository = projectRepository;
        this.complianceService = complianceService;
    }

    /**
     * 生成嵌入视频（示例实现）
     * body: { projectId, model, watermarkText }
     */
    @PostMapping("/embed")
    public ApiResponse<Map<String, Object>> embed(@RequestBody Map<String, Object> body) {
        Long projectId = parseLong(body.get("projectId"));
        String model = (String) body.get("model");
        String watermarkText = (String) body.getOrDefault("watermarkText", "");

        var project = projectRepository.findById(projectId).orElseThrow();

        // 查找原视频
        var original = videoRepository.findAll().stream()
                .filter(v -> v.getProjectId().equals(projectId) && v.getRole() == VideoRole.original)
                .findFirst().orElseThrow();

        // 生成嵌入视频记录（演示）
        var embedded = Video.builder()
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

        // 合规记录：嵌入
        complianceService.recordOperation(
                "embed",
                1L, // TODO: 从鉴权上下文获取当前用户ID
                projectId,
                embedded.getId(),
                model,
                "1.0.0",
                toJson(Map.of("watermarkText", watermarkText)),
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

    /**
     * 执行水印提取（示例实现）
     * body: { projectId, videoId }
     */
    @PostMapping("/extract")
    public ApiResponse<Map<String, Object>> extract(@RequestBody Map<String, Object> body) {
        Long projectId = parseLong(body.get("projectId"));
        Long videoId = parseLong(body.get("videoId"));

        var video = videoRepository.findById(videoId).orElseThrow();

        // 演示：直接给出结果摘要
        String result = "WM-INFO-FAKE";
        String model = "wm-pro";

        // 更新视频状态（演示）
        video.setStatus(VideoStatus.completed);
        video.setProgress(100);
        video.setWatermarkText(result);
        video.setModelCode(model);
        video.setUpdatedAt(Instant.now());
        videoRepository.save(video);

        // 合规记录：提取
        complianceService.recordOperation(
                "extract",
                1L, // TODO: 从鉴权上下文获取当前用户ID
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
        // 简化：无第三方依赖，拼接为JSON字符串（演示用，生产请用Jackson）
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (var e : map.entrySet()) {
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


