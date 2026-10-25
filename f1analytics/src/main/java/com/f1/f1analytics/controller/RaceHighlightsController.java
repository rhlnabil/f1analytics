package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.YouTubeHighlightsDto;
import com.f1.f1analytics.service.YouTubeHighlightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class RaceHighlightsController {

    private final YouTubeHighlightsService service;

    /**
     * GET /api/races/{id}/highlights
     * → Retourne les highlights officiels F1 du GP
     */
    @GetMapping("/{id}/highlights")
    public YouTubeHighlightsDto getHighlights(@PathVariable Long id) {
        return service.getHighlights(id);
    }
}