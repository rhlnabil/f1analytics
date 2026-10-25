package com.f1.f1analytics.controller;

import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.RaceRepository;
import com.f1.f1analytics.service.OpenF1Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class RaceTelemetryController {

    private final OpenF1Service openF1Service;
    private final RaceRepository raceRepo;

    /**
     * GET /api/races/{id}/session-key
     * → Renvoie le sessionKey OpenF1 associé au GP (ou null si pas de données)
     */
    @GetMapping("/{id}/session-key")
    public Map<String, Object> getSessionKey(@PathVariable Long id) {
        Map<String, Object> out = new HashMap<>();
        Race race = raceRepo.findById(id).orElse(null);
        if (race == null) {
            out.put("sessionKey", null);
            return out;
        }
        Integer key = openF1Service.getSessionKey(race);
        out.put("sessionKey", key);
        return out;
    }
}