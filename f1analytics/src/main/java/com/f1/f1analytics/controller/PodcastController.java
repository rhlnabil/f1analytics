package com.f1.f1analytics.controller;

import com.f1.f1analytics.service.PodcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class PodcastController {

    private final PodcastService podcastService;

    /* ✅ ?lang=fr|en|es|it|ar (défaut : fr) */
    @GetMapping("/{id}/podcast")
    public Map<String, String> getPodcast(
            @PathVariable Long id,
            @RequestParam(defaultValue = "fr") String lang) {
        return Map.of("script", podcastService.generateScript(id, lang));
    }
}