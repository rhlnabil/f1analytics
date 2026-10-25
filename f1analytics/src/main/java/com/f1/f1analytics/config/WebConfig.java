package com.f1.f1analytics.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Configuration
@Slf4j
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get("uploads").toAbsolutePath();

        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("📁 Dossier uploads créé : {}", uploadPath);
            }

            long fileCount;
            try (Stream<Path> files = Files.list(uploadPath)) {
                fileCount = files.filter(Files::isRegularFile).count();
            }

            log.info("📁 Uploads directory: {}", uploadPath);
            log.info("📁 Fichiers dans uploads: {}", fileCount);

            if (fileCount == 0) {
                log.warn("⚠️ Aucun fichier dans uploads/ — vérifie le COPY dans Dockerfile");
            }
        } catch (IOException e) {
            log.error("❌ Erreur accès uploads : {}", e.getMessage());
        }

        String location = "file:" + uploadPath.toString() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCacheControl(CacheControl
                        .maxAge(365, TimeUnit.DAYS)
                        .cachePublic()
                        .immutable())
                .resourceChain(true);

        log.info("✅ Resource handler configuré : /uploads/** → {}", location);
    }
}