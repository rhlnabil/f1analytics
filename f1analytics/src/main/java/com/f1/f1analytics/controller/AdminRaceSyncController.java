package com.f1.f1analytics.controller;

import com.f1.f1analytics.service.RaceSyncService;
import com.f1.f1analytics.service.YouTubeHighlightsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/races")
@RequiredArgsConstructor
@Slf4j
public class AdminRaceSyncController {

    private final RaceSyncService syncService;
    private final YouTubeHighlightsService youtubeService;   // ✅ NOUVEAU

    /**
     * POST /api/admin/races/sync?season=2026
     * → Sync le calendrier Jolpica vers la DB locale
     */
    @PostMapping("/sync")
    public Map<String, Object> sync(@RequestParam(defaultValue = "2026") int season) {
        log.info("🌐 Sync calendrier F1 {}", season);
        return syncService.syncSeason(season);
    }

    /**
     * POST /api/admin/races/highlights/clear-cache
     * → Vide le cache YouTube (force un re-fetch au prochain visiteur)
     */
    @PostMapping("/highlights/clear-cache")
    public Map<String, Object> clearHighlightsCache() {
        log.info("🗑️ Clear cache YouTube demandé par admin");
        youtubeService.clearCache();
        return Map.of(
            "success", true,
            "message", "Cache YouTube vidé — les prochains visiteurs déclencheront un re-fetch"
        );
    }
}