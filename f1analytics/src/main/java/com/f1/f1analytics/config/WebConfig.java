package com.f1.f1analytics.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = Paths.get("uploads").toAbsolutePath().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/")
                /* ✅ Cache navigateur 1 AN — les fichiers sont immuables
                      (le nom est un UUID généré à l'upload, donc jamais réutilisé) */
                .setCacheControl(CacheControl
                        .maxAge(365, TimeUnit.DAYS)
                        .cachePublic()
                        .immutable())
                .resourceChain(true);
    }
}