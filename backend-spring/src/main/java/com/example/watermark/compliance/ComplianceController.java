package com.example.watermark.compliance;

import com.example.watermark.web.ApiResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 合规接口：
 * - 查询个人/项目的合规审计记录
 * - 导出合规检测报告（示例为简单文本，可替换为PDF生成）
 */
@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {
    private final ComplianceRecordRepository repository;
    private final ComplianceService complianceService;

    public ComplianceController(ComplianceRecordRepository repository, ComplianceService complianceService) {
        this.repository = repository;
        this.complianceService = complianceService;
    }

    @GetMapping("/records")
    public ApiResponse<Map<String, Object>> list(@RequestParam(required = false) Long projectId,
                                                 @RequestParam(required = false) Long userId,
                                                 @RequestParam(required = false) String operation,
                                                 @RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "10") int pageSize) {
        var pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        var pg = repository.search(projectId, userId, operation, pageable);
        Map<String, Object> data = new HashMap<>();
        data.put("list", pg.getContent());
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("total", pg.getTotalElements());
        return ApiResponse.ok(data);
    }

    @GetMapping("/report/{id}/export")
    public ResponseEntity<ByteArrayResource> exportReport(@PathVariable Long id) {
        var rec = repository.findById(id).orElseThrow();
        // 生成简版报告文本（符合电子签名法的要素示意）
        String content = "报告编号: " + rec.getReportNo() + "\n" +
                "生成时间: " + DateTimeFormatter.ISO_INSTANT.format(rec.getCreatedAt()) + "\n" +
                "操作类型: " + rec.getOperation() + "\n" +
                "用户ID: " + rec.getUserId() + "\n" +
                "项目ID: " + rec.getProjectId() + "\n" +
                "视频ID: " + rec.getVideoId() + "\n" +
                "模型: " + rec.getModelCode() + "(" + rec.getModelVersion() + ")\n" +
                "参数: " + (rec.getParametersJson() == null ? "" : rec.getParametersJson()) + "\n" +
                "结果摘要: " + (rec.getResultSummary() == null ? "" : rec.getResultSummary()) + "\n" +
                "视频哈希: [" + rec.getVideoHashAlgo() + "] " + rec.getVideoHash() + "\n" +
                "签名: " + rec.getSignature() + "\n" +
                "法律声明: 本报告用于证明操作发生与数据完整性，供合规审计使用。";
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        var resource = new ByteArrayResource(bytes);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + rec.getReportNo() + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(bytes.length)
                .body(resource);
    }
}


