package com.example.demo;

import com.example.demo.entity.ModelStatus;
import com.example.demo.entity.SystemModel;
import com.example.demo.repository.SystemModelRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.time.Instant;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // 移除应用启动时的演示数据注入，改由 data.sql 控制
}


