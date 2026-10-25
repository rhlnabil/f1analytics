package com.f1.f1analytics.controller;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder:f1apex}")
    private String folder;

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        try {
            log.info("☁️ Upload Cloudinary : {} ({} bytes)",
                file.getOriginalFilename(), file.getSize());

            Map<String, Object> options = new HashMap<>();
            options.put("folder", folder);
            options.put("resource_type", "image");
            options.put("use_filename", true);
            options.put("unique_filename", true);
            options.put("overwrite", false);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader()
                .upload(file.getBytes(), options);

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");

            log.info("✅ Cloudinary OK : {} → {}", publicId, url);

            return ResponseEntity.ok(Map.of(
                "url", url,
                "publicId", publicId,
                "filename", file.getOriginalFilename() != null
                    ? file.getOriginalFilename() : "file"
            ));

        } catch (Exception e) {
            log.error("❌ Upload Cloudinary échoué : {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erreur upload : " + e.getMessage()));
        }
    }
}