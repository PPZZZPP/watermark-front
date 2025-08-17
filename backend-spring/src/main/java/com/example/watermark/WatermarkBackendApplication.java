package com.example.watermark;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import com.example.watermark.systemmodel.*;
import java.time.Instant;

@SpringBootApplication
public class WatermarkBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(WatermarkBackendApplication.class, args);
    }

    // 应用启动后初始化几条示例“已发布模型”，便于前端下拉框联调
    private final SystemModelRepository systemModelRepository;

    public WatermarkBackendApplication(SystemModelRepository systemModelRepository) {
        this.systemModelRepository = systemModelRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initDemoModels() {
        if (systemModelRepository.count() == 0) {
            systemModelRepository.save(SystemModel.builder()
                    .code("wm-base")
                    .name("基础模型")
                    .version("1.0.0")
                    .status(ModelStatus.active)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());
            systemModelRepository.save(SystemModel.builder()
                    .code("wm-pro")
                    .name("专业模型")
                    .version("1.2.0")
                    .status(ModelStatus.active)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());
            systemModelRepository.save(SystemModel.builder()
                    .code("wm-auto")
                    .name("自动匹配")
                    .version("1.1.0")
                    .status(ModelStatus.inactive)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());
        }
    }
}


