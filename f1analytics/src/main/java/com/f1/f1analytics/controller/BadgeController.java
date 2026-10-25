package com.f1.f1analytics.controller;

import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.entity.UserBadge;
import com.f1.f1analytics.repository.UserBadgeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fan/badges")
public class BadgeController {

    private final UserBadgeRepository repo;

    /* ✅ Constructor injection (recommandé par Spring) */
    public BadgeController(UserBadgeRepository repo) {
        this.repo = repo;
    }

    private static final DateTimeFormatter ISO_FMT =
        DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @GetMapping
    public ResponseEntity<?> myBadges(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "not authenticated"));
        }

        List<Map<String, Object>> badges = repo.findByUser(user).stream()
            .map(ub -> Map.<String, Object>of(
                "badgeId", ub.getBadgeId(),
                "unlockedAt", ub.getUnlockedAt().format(ISO_FMT)
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(badges);
    }

    @PostMapping("/{badgeId}/unlock")
    public ResponseEntity<?> unlock(
            @PathVariable String badgeId,
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "not authenticated"));
        }

        if (badgeId == null || badgeId.isBlank() || badgeId.length() > 50) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "invalid badge id"));
        }

        if (repo.existsByUserAndBadgeId(user, badgeId)) {
            return ResponseEntity.ok(Map.of(
                "status", "already_unlocked",
                "badgeId", badgeId
            ));
        }

        UserBadge ub = new UserBadge(user, badgeId);
        repo.save(ub);

        return ResponseEntity.ok(Map.of(
            "status", "unlocked",
            "badgeId", badgeId,
            "unlockedAt", ub.getUnlockedAt().format(ISO_FMT)
        ));
    }

    @DeleteMapping
    public ResponseEntity<?> resetAll(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "not authenticated"));
        }
        repo.deleteByUser(user);
        return ResponseEntity.ok(Map.of("status", "reset"));
    }

    @GetMapping("/count")
    public ResponseEntity<?> count(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "not authenticated"));
        }
        return ResponseEntity.ok(Map.of("count", repo.countByUser(user)));
    }
}