package com.example.demo.controller;

import com.example.demo.entity.*;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.VideoRepository;
import com.example.demo.repository.SystemModelRepository;
import com.example.demo.web.ApiResponse;
import javax.validation.constraints.Min;
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
    private final SystemModelRepository systemModelRepository;

    public ProjectController(ProjectRepository projectRepository,
                             VideoRepository videoRepository,
                             SystemModelRepository systemModelRepository) {
        this.projectRepository = projectRepository;
        this.videoRepository = videoRepository;
        this.systemModelRepository = systemModelRepository;
    }

    @GetMapping("/list")
    public ApiResponse<Map<String, Object>> list(@RequestParam(defaultValue = "1") @Min(1) int page,
                                                 @RequestParam(defaultValue = "10") @Min(1) int pageSize,
                                                 @RequestParam(required = false) String name,
                                                 @RequestParam(required = false) String status) {
        org.springframework.data.domain.Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        ProjectStatus s = null;
        if (status != null && status.trim().length() > 0) {
            s = ProjectStatus.valueOf(status);
        }
        org.springframework.data.domain.Page<Project> pg = projectRepository.search(name, s, pageable);
        java.util.List<Map<String, Object>> list = new java.util.ArrayList<>();
        for (Project p : pg.getContent()) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId() == null ? null : p.getId().toString());
            m.put("name", p.getName());
            m.put("description", p.getDescription());
            m.put("status", p.getStatus() == null ? "pending" : p.getStatus().name());
            m.put("progress", p.getProgress() == null ? 0 : p.getProgress());
            m.put("videoCount", p.getVideoCount() == null ? 0 : p.getVideoCount());
            m.put("createTime", p.getCreatedAt());
            m.put("coverUrl", p.getCoverUrl());
            m.put("userId", 1);
            list.add(m);
        }
        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", pg.getTotalElements());
        return ApiResponse.ok(data);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        com.example.demo.entity.Video original = null;
        com.example.demo.entity.Video embedded = null;
        java.util.List<com.example.demo.entity.Video> toExtract;
        {
            java.util.List<com.example.demo.entity.Video> all = videoRepository.findAll();
            java.util.List<com.example.demo.entity.Video> tmp = new java.util.ArrayList<>();
            for (com.example.demo.entity.Video v : all) {
                if (Objects.equals(v.getProjectId(), id) && v.getRole() == VideoRole.original && original == null) original = v;
                if (Objects.equals(v.getProjectId(), id) && v.getRole() == VideoRole.embedded && embedded == null) embedded = v;
                if (Objects.equals(v.getProjectId(), id) && v.getRole() == VideoRole.to_extract) tmp.add(v);
            }
            toExtract = tmp;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", "project-" + p.getId());
        data.put("name", p.getName());
        data.put("createTime", p.getCreatedAt());
        data.put("status", p.getStatus() == null ? "pending" : p.getStatus().name());
        data.put("progress", p.getProgress() == null ? 0 : p.getProgress());
        data.put("videoCount", p.getVideoCount() == null ? 0 : p.getVideoCount());
        data.put("originalVideo", toMap(original));
        data.put("embeddedVideo", toMap(embedded));
        java.util.List<Map<String, Object>> toExtractMaps = new java.util.ArrayList<>();
        for (com.example.demo.entity.Video v : toExtract) {
            toExtractMaps.add(this.toMap(v));
        }
        data.put("toExtractVideos", toExtractMaps);
        return ApiResponse.ok(data);
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Project p = projectRepository.findById(id).orElse(null);
        if (p == null) {
            return ApiResponse.error(404, "项目不存在");
        }
        if (body.containsKey("name")) p.setName((String) body.get("name"));
        if (body.containsKey("description")) p.setDescription((String) body.get("description"));
        p.setUpdatedAt(Instant.now());
        projectRepository.save(p);
        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("id", p.getId());
        return ApiResponse.ok(resp);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        if (!projectRepository.existsById(id)) {
            return ApiResponse.error(404, "项目不存在");
        }
        // 删除项目相关的本地文件与目录
        try {
            String base = System.getProperty("user.dir") + java.io.File.separator + "backend-spring" + java.io.File.separator + "uploads" + java.io.File.separator;
            java.io.File projectDir = new java.io.File(base + "projects" + java.io.File.separator + id);
            java.io.File toExtractDir = new java.io.File(base + "to-extract" + java.io.File.separator + id);
            deleteDirRecursive(projectDir);
            deleteDirRecursive(toExtractDir);
        } catch (Exception ignored) {}
        projectRepository.deleteById(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/batch-delete")
    public ApiResponse<Map<String, Object>> batchDelete(@RequestBody Map<String, Object> body) {
        Object idsObj = body.get("ids");
        int deleted = 0;
        if (idsObj instanceof java.util.List) {
            java.util.List<?> ids = (java.util.List<?>) idsObj;
            for (Object o : ids) {
                Long id = null;
                if (o instanceof Number) id = ((Number) o).longValue();
                else if (o != null) try { id = Long.parseLong(String.valueOf(o)); } catch (Exception ignored) {}
                if (id != null && projectRepository.existsById(id)) {
                    projectRepository.deleteById(id);
                    deleted++;
                }
            }
        }
        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("deleted", deleted);
        return ApiResponse.ok(resp);
    }

    @PostMapping(value = "/create", consumes = { "multipart/form-data" })
    public ApiResponse<Map<String, Object>> create(@RequestParam("name") String name,
                                                   @RequestParam(value = "description", required = false) String description,
                                                   @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        Project p = Project.builder()
                .name(name)
                .description(description == null ? "" : description)
                .status(ProjectStatus.pending)
                .progress(0)
                .videoCount(0)
                .ownerUserId(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        p = projectRepository.save(p);

        // 分类目录：/uploads/projects/{projectId}/{original|covers}
        String baseDir = System.getProperty("user.dir") + java.io.File.separator + "backend-spring" + java.io.File.separator + "uploads" + java.io.File.separator + "projects" + java.io.File.separator + p.getId() + java.io.File.separator;
        java.io.File originalDir = new java.io.File(baseDir + "original");
        java.io.File coversDir = new java.io.File(baseDir + "covers");
        if (!originalDir.exists()) originalDir.mkdirs();
        if (!coversDir.exists()) coversDir.mkdirs();

        if (file != null && !file.isEmpty()) {
            try {
                String videoName = filenameOnly(file.getOriginalFilename());
                java.io.File saved = new java.io.File(originalDir, videoName);
                file.transferTo(saved);

                // 截取封面
                String coverName = videoName.replaceAll("\\.[^.]+$", "") + "-cover.jpg";
                java.io.File cover = new java.io.File(coversDir, coverName);
                extractCover(saved, cover);

                // 保存视频记录
                com.example.demo.entity.Video v = com.example.demo.entity.Video.builder()
                        .projectId(p.getId())
                        .role(VideoRole.original)
                        .filename(videoName)
                        .sizeBytes(saved.length())
                        .url("/uploads/projects/" + p.getId() + "/original/" + videoName)
                        .coverUrl("/uploads/projects/" + p.getId() + "/covers/" + coverName)
                        .status(VideoStatus.completed)
                        .progress(100)
                        .uploadTime(Instant.now())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();
                videoRepository.save(v);

                p.setVideoCount(1);
                p.setCoverUrl("/uploads/projects/" + p.getId() + "/covers/" + coverName);
                projectRepository.save(p);
            } catch (Exception e) {
                return ApiResponse.error(500, "文件保存失败: " + e.getMessage());
            }
        }

        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("id", "project-" + p.getId());
        resp.put("name", p.getName());
        return ApiResponse.ok(resp);
    }

    private String extOf(String original) {
        if (original == null) return ".mp4";
        int i = original.lastIndexOf('.');
        return i >= 0 ? original.substring(i) : ".mp4";
    }

    private void extractCover(java.io.File input, java.io.File outputJpg) throws Exception {
        // 使用 jcodec 截取第一帧
        org.jcodec.api.FrameGrab grab = org.jcodec.api.FrameGrab.createFrameGrab(org.jcodec.common.io.NIOUtils.readableChannel(input));
        org.jcodec.common.model.Picture picture = grab.getNativeFrame();
        if (picture == null) throw new IllegalStateException("无法读取视频帧");
        java.awt.image.BufferedImage bufferedImage = org.jcodec.scale.AWTUtil.toBufferedImage(picture);
        javax.imageio.ImageIO.write(bufferedImage, "jpg", outputJpg);
    }

    @PostMapping(value = "/{id}/to-extract", consumes = { "multipart/form-data" })
    public ApiResponse<Map<String, Object>> addToExtract(@PathVariable Long id,
                                                         @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ApiResponse.error(400, "文件不能为空");
        }
        try {
            // 目录分类：/uploads/to-extract/{projectId}/{videos|covers}
            String baseDir = System.getProperty("user.dir") + java.io.File.separator + "backend-spring" + java.io.File.separator + "uploads" + java.io.File.separator + "to-extract" + java.io.File.separator + id + java.io.File.separator;
            java.io.File videosDir = new java.io.File(baseDir + "videos");
            java.io.File coversDir = new java.io.File(baseDir + "covers");
            if (!videosDir.exists()) videosDir.mkdirs();
            if (!coversDir.exists()) coversDir.mkdirs();

            // 保留原始文件名（去除路径分隔符），不改名保存
            String videoName = filenameOnly(file.getOriginalFilename());
            String ext = extOf(videoName);
            java.io.File saved = new java.io.File(videosDir, videoName);
            file.transferTo(saved);

            // 生成封面
            String coverName = videoName.replaceAll("\\.[^.]+$", "") + "-cover.jpg";
            java.io.File cover = new java.io.File(coversDir, coverName);
            try { extractCover(saved, cover); } catch (Exception ignored) {}

            com.example.demo.entity.Video v = com.example.demo.entity.Video.builder()
                    .projectId(id)
                    .role(VideoRole.to_extract)
                    .filename(videoName)
                    .sizeBytes(saved.length())
                    .url("/uploads/to-extract/" + id + "/videos/" + videoName)
                    .coverUrl(cover.exists() ? "/uploads/to-extract/" + id + "/covers/" + coverName : null)
                    .status(VideoStatus.pending)
                    .progress(0)
                    .uploadTime(Instant.now())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            v = videoRepository.save(v);

            Map<String, Object> out = new HashMap<String, Object>();
            out.put("id", "toextract-" + v.getId());
            out.put("filename", v.getFilename());
            out.put("size", v.getSizeBytes());
            out.put("uploadTime", v.getUploadTime());
            out.put("status", v.getStatus().name());
            out.put("progress", v.getProgress());
            out.put("url", v.getUrl());
            out.put("coverUrl", v.getCoverUrl());
            return ApiResponse.ok(out);
        } catch (Exception e) {
            return ApiResponse.error(500, "文件保存失败: " + e.getMessage());
        }
    }

    

    @DeleteMapping("/{id}/to-extract/{vid}")
    public ApiResponse<Void> deleteToExtract(@PathVariable Long id, @PathVariable String vid) {
        Long videoId = parseVid(vid);
        if (videoId == null) {
            return ApiResponse.error(400, "无效的待提取视频ID");
        }
        com.example.demo.entity.Video v = videoRepository.findById(videoId).orElse(null);
        if (v != null) {
            // 删除物理文件
            deleteByUrl(v.getUrl());
            deleteByUrl(v.getCoverUrl());
        }
        if (videoRepository.existsById(videoId)) {
            videoRepository.deleteById(videoId);
        }
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
        // 附带模型名称（若能通过代码映射到系统模型）
        try {
            if (v.getModelCode() != null) {
                java.util.List<com.example.demo.entity.SystemModel> models = systemModelRepository.findAll();
                for (com.example.demo.entity.SystemModel sm : models) {
                    if (v.getModelCode().equals(sm.getCode())) {
                        m.put("modelName", sm.getName());
                        break;
                    }
                }
            }
        } catch (Exception ignored) {}
        m.put("watermarkInfo", v.getWatermarkText());
        m.put("note", v.getNote());
        m.put("projectId", v.getProjectId());
        return m;
    }

    private Long parseVid(String vid) {
        if (vid == null) return null;
        try {
            // 兼容形如 "toextract-5" / "orig-1" / "embed-2"
            if (vid.contains("-")) {
                String num = vid.substring(vid.lastIndexOf('-') + 1);
                return Long.parseLong(num);
            }
            return Long.parseLong(vid);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void deleteByUrl(String url) {
        if (url == null || url.trim().length() == 0) return;
        try {
            String base = System.getProperty("user.dir") + java.io.File.separator + "backend-spring";
            String rel = url.startsWith("/") ? url.substring(1) : url;
            String path = base + java.io.File.separator + rel.replace('/', java.io.File.separatorChar);
            java.io.File f = new java.io.File(path);
            if (f.exists()) {
                // 尝试删除封面或视频文件
                boolean deleted = f.delete();
            }
        } catch (Exception ignored) {}
    }

    private String filenameOnly(String name) {
        if (name == null || name.trim().length() == 0) return "uploaded.mp4";
        // 仅取文件名本身（不再修改字符），保持与上传一致
        return new java.io.File(name).getName();
    }

    private void deleteDirRecursive(java.io.File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            java.io.File[] children = f.listFiles();
            if (children != null) {
                for (java.io.File c : children) {
                    deleteDirRecursive(c);
                }
            }
        }
        try { f.delete(); } catch (Exception ignored) {}
    }
}


