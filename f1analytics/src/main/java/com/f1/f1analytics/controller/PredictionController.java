package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.LeaderboardEntryDto;
import com.f1.f1analytics.dto.PredictionDto;
import com.f1.f1analytics.dto.PredictionRequest;
import com.f1.f1analytics.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fan/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService service;

    @GetMapping
    public List<PredictionDto> getMyPredictions(Authentication auth) {
        return service.getMyPredictions(auth.getName());
    }

    @GetMapping("/race/{raceId}")
    public PredictionDto getMyPredictionForRace(Authentication auth,
                                                @PathVariable Long raceId) {
        return service.getMyPredictionForRace(auth.getName(), raceId);
    }

    @PostMapping
    public PredictionDto save(Authentication auth, @RequestBody PredictionRequest req) {
        return service.save(auth.getName(), req);
    }

    @DeleteMapping("/race/{raceId}")
    public Map<String, Object> delete(Authentication auth, @PathVariable Long raceId) {
        service.delete(auth.getName(), raceId);
        return Map.of("success", true);
    }

    @GetMapping("/leaderboard")
    public List<LeaderboardEntryDto> getLeaderboard(Authentication auth) {
        return service.getLeaderboard(auth.getName());
    }
}