package com.f1.f1analytics.controller;

import com.f1.f1analytics.entity.BadgeImage;
import com.f1.f1analytics.repository.BadgeImageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BadgeImageController {

    private final BadgeImageRepository repo;

    /* ✅ Constructor injection (recommandé par Spring) */
    public BadgeImageController(BadgeImageRepository repo) {
        this.repo = repo;
    }

    /* PUBLIC — map { badgeId: url } */
    @GetMapping("/badges/images")
    public ResponseEntity<Map<String, String>> getAll() {
        Map<String, String> result = new HashMap<>();
        for (BadgeImage img : repo.findAll()) {
            result.put(img.getBadgeId(), img.getImageUrl());
        }
        return ResponseEntity.ok(result);
    }

    /* ADMIN — upload / replace */
    @PostMapping("/admin/badges/images/{badgeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setImage(
            @PathVariable String badgeId,
            @RequestBody Map<String, String> body) {

        String url = body.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "url is required"));
        }

        BadgeImage img = repo.findByBadgeId(badgeId)
            .orElseGet(BadgeImage::new);

        img.setBadgeId(badgeId);
        img.setImageUrl(url);
        img.setUpdatedAt(LocalDateTime.now());
        repo.save(img);

        return ResponseEntity.ok(Map.of(
            "status", "saved",
            "badgeId", badgeId,
            "url", url
        ));
    }

    /* ADMIN — delete (fallback emoji) */
    @DeleteMapping("/admin/badges/images/{badgeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable String badgeId) {
        repo.findByBadgeId(badgeId).ifPresent(repo::delete);
        return ResponseEntity.ok(Map.of("deleted", badgeId));
    }
}