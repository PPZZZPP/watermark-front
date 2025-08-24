package com.example.demo.controller;

import com.example.demo.entity.*;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.VideoRepository;
import com.example.demo.web.ApiResponse;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final VideoRepository videoRepository;

    public ProjectController(ProjectRepository projectRepository, VideoRepository videoRepository) {
        this.projectRepository = projectRepository;
        this.videoRepository = videoRepository;
    }

    @GetMapping("/list")
    public ApiResponse<Map<String, Object>> list(@RequestParam(defaultValue = "1") @Min(1) int page,
                                                 @RequestParam(defaultValue = "10") @Min(1) int pageSize,
                                                 @RequestParam(required = false) String name,
                                                 @RequestParam(required = false) String status) {
        var pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        ProjectStatus s = null;
        if (status != null && !status.isBlank()) {
            s = ProjectStatus.valueOf(status);
        }
        var pg = projectRepository.search(name, s, pageable);
        var list = pg.map(p -> Map.of(
                "id", p.getId().toString(),
                "name", p.getName(),
                "description", p.getDescription(),
                "status", p.getStatus() == null ? "pending" : p.getStatus().name(),
                "progress", p.getProgress() == null ? 0 : p.getProgress(),
                "videoCount", p.getVideoCount() == null ? 0 : p.getVideoCount(),
                "createTime", p.getCreatedAt(),
                "coverUrl", p.getCoverUrl(),
                "userId", 1
        )).toList();
        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", pg.getTotalElements());
        return ApiResponse.ok(data);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id) {
        var p = projectRepository.findById(id).orElseThrow();
        var original = videoRepository.findAll().stream().filter(v -> Objects.equals(v.getProjectId(), id) && v.getRole() == VideoRole.original).findFirst().orElse(null);
        var embedded = videoRepository.findAll().stream().filter(v -> Objects.equals(v.getProjectId(), id) && v.getRole() == VideoRole.embedded).findFirst().orElse(null);
        var toExtract = videoRepository.findAll().stream().filter(v -> Objects.equals(v.getProjectId(), id) && v.getRole() == VideoRole.to_extract).toList();

        Map<String, Object> data = new HashMap<>();
        data.put("id", "project-" + p.getId());
        data.put("name", p.getName());
        data.put("createTime", p.getCreatedAt());
        data.put("status", p.getStatus() == null ? "pending" : p.getStatus().name());
        data.put("progress", p.getProgress() == null ? 0 : p.getProgress());
        data.put("videoCount", p.getVideoCount() == null ? 0 : p.getVideoCount());
        data.put("originalVideo", toMap(original));
        data.put("embeddedVideo", toMap(embedded));
        data.put("toExtractVideos", toExtract.stream().map(this::toMap).toList());
        return ApiResponse.ok(data);
    }

    @PostMapping("/create")
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        var p = Project.builder()
                .name((String) body.get("name"))
                .description((String) body.getOrDefault("description", ""))
                .status(ProjectStatus.pending)
                .progress(0)
                .videoCount(0)
                .coverUrl((String) body.getOrDefault("coverUrl", "/placeholder-video-1.png"))
                .ownerUserId(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        p = projectRepository.save(p);
        Map<String, Object> ov = (Map<String, Object>) body.get("originalVideo");
        if (ov != null && ov.get("filename") != null) {
            var v = com.example.demo.entity.Video.builder()
                    .projectId(p.getId())
                    .role(VideoRole.original)
                    .filename((String) ov.get("filename"))
                    .sizeBytes(ov.get("size") instanceof Number ? ((Number) ov.get("size")).longValue() : null)
                    .url("/sample-original.mp4")
                    .coverUrl("/placeholder-video-1.png")
                    .status(VideoStatus.completed)
                    .progress(100)
                    .uploadTime(Instant.now())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            videoRepository.save(v);
            p.setVideoCount(1);
            projectRepository.save(p);
        }
        return ApiResponse.ok(Map.of("id", "project-" + p.getId(), "name", p.getName()));
    }

    @PostMapping("/{id}/to-extract")
    public ApiResponse<Map<String, Object>> addToExtract(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var v = com.example.demo.entity.Video.builder()
                .projectId(id)
                .role(VideoRole.to_extract)
                .filename((String) body.get("filename"))
                .sizeBytes(body.get("size") instanceof Number ? ((Number) body.get("size")).longValue() : null)
                .status(VideoStatus.pending)
                .progress(0)
                .uploadTime(Instant.now())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        v = videoRepository.save(v);
        return ApiResponse.ok(Map.of(
                "id", "toextract-" + v.getId(),
                "filename", v.getFilename(),
                "size", v.getSizeBytes(),
                "uploadTime", v.getUploadTime(),
                "status", v.getStatus().name(),
                "progress", v.getProgress()
        ));
    }

    @DeleteMapping("/{id}/to-extract/{vid}")
    public ApiResponse<Void> deleteToExtract(@PathVariable Long id, @PathVariable Long vid) {
        videoRepository.deleteById(vid);
        return ApiResponse.ok(null);
    }

    private Map<String, Object> toMap(com.example.demo.entity.Video v) {
        if (v == null) return null;
        Map<String, Object> m = new HashMap<>();
        m.put("id", (v.getRole() == VideoRole.to_extract ? "toextract-" : v.getRole() == VideoRole.original ? "orig-" : "embed-") + v.getId());
        m.put("filename", v.getFilename());
        m.put("size", v.getSizeBytes());
        m.put("uploadTime", v.getUploadTime());
        m.put("createTime", v.getCreatedAt());
        m.put("status", v.getStatus() == null ? "pending" : v.getStatus().name());
        m.put("progress", v.getProgress() == null ? 0 : v.getProgress());
        m.put("coverUrl", v.getCoverUrl());
        m.put("url", v.getUrl());
        m.put("model", v.getModelCode());
        m.put("watermarkInfo", v.getWatermarkText());
        m.put("note", v.getNote());
        m.put("projectId", v.getProjectId());
        return m;
    }
}


