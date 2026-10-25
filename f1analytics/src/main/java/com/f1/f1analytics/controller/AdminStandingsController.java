package com.f1.f1analytics.controller;

import com.f1.f1analytics.service.StandingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/standings")
@RequiredArgsConstructor
@Slf4j
public class AdminStandingsController {

    private final StandingsService service;

    /** 🔄 Force un refresh manuel (utile juste après un GP) */
    @PostMapping("/refresh")
    public Map<String, Object> refresh() {
        log.info("🔄 Refresh manuel déclenché par admin");
        return service.refreshAll();
    }
}