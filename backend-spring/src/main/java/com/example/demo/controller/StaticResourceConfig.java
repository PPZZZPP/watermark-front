package com.example.demo.controller;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploads = System.getProperty("user.dir") + java.io.File.separator + "backend-spring" + java.io.File.separator + "uploads" + java.io.File.separator;
        registry.addResourceHandler("/uploads/**").addResourceLocations("file:" + uploads);
    }
}


