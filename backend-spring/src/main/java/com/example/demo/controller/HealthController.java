package com.example.demo.controller;

import com.example.demo.web.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {
    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/ping")
    public ApiResponse<Map<String, Object>> ping() {
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("status", "UP");
        data.put("service", "watermark-backend");
        data.put("ts", System.currentTimeMillis());
        return ApiResponse.ok(data);
    }

    @GetMapping("/db")
    public ApiResponse<Map<String, Object>> db() {
        Map<String, Object> data = new HashMap<String, Object>();
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            DatabaseMetaData meta = conn.getMetaData();
            data.put("status", "UP");
            data.put("dbProduct", meta.getDatabaseProductName());
            data.put("dbVersion", meta.getDatabaseProductVersion());
            return ApiResponse.ok(data);
        } catch (Exception e) {
            data.put("status", "DOWN");
            data.put("error", e.getMessage());
            return ApiResponse.error(500, "DB connection failed");
        } finally {
            if (conn != null) {
                try { conn.close(); } catch (Exception ignored) {}
            }
        }
    }
}


