package com.example.demo.service;

import com.example.demo.entity.ComplianceRecord;
import com.example.demo.repository.ComplianceRecordRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

/**
 * 合规服务：负责写入审计记录与生成签名/报告编号。
 * 注：签名示例采用 SHA-256 后 Base64，可替换为国密或RSA私钥签名。
 */
@Service
public class ComplianceService {
    private final ComplianceRecordRepository repository;

    public ComplianceService(ComplianceRecordRepository repository) {
        this.repository = repository;
    }

    public ComplianceRecord recordOperation(String operation,
                                            Long userId,
                                            Long projectId,
                                            Long videoId,
                                            String modelCode,
                                            String modelVersion,
                                            String parametersJson,
                                            String resultSummary,
                                            String videoHashAlgo,
                                            String videoHash) {
        String reportNo = generateReportNo(operation, projectId);
        String signature = sign(Map.of(
                "op", operation,
                "uid", String.valueOf(userId),
                "pid", String.valueOf(projectId),
                "vid", String.valueOf(videoId),
                "hash", videoHash == null ? "" : videoHash,
                "model", modelCode == null ? "" : modelCode,
                "ver", modelVersion == null ? "" : modelVersion,
                "ts", String.valueOf(Instant.now().toEpochMilli())
        ));
        ComplianceRecord rec = ComplianceRecord.builder()
                .operation(operation)
                .userId(userId)
                .projectId(projectId)
                .videoId(videoId)
                .modelCode(modelCode)
                .modelVersion(modelVersion)
                .parametersJson(parametersJson)
                .resultSummary(resultSummary)
                .videoHash(videoHash)
                .videoHashAlgo(videoHashAlgo)
                .signature(signature)
                .reportNo(reportNo)
                .createdAt(Instant.now())
                .build();
        return repository.save(rec);
    }

    private String generateReportNo(String operation, Long projectId) {
        return String.format("RPT-%s-%d-%d", operation.toUpperCase(), projectId == null ? 0 : projectId, System.currentTimeMillis());
    }

    private String sign(Map<String, String> payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            StringBuilder sb = new StringBuilder();
            payload.forEach((k, v) -> sb.append(k).append('=').append(v).append('&'));
            byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return "";
        }
    }
}


