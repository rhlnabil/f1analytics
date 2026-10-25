package com.f1.f1analytics.controller;

import com.f1.f1analytics.service.DriverStatsAggregatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/drivers")
@RequiredArgsConstructor
@Slf4j
public class AdminSyncController {

    private final DriverStatsAggregatorService statsService;

    /** 🚀 Sync TOUS les pilotes (agrégation Jolpica) */
    @PostMapping("/refresh-stats")
    public Map<String, Object> refreshStats() {
        log.info("🌐 Agrégation Jolpica de TOUS les pilotes");
        return statsService.syncAll();
    }

    /** 🎯 Sync UN SEUL pilote (agrégation Jolpica) */
    @PostMapping("/{id}/refresh-stats")
    public Map<String, Object> refreshOne(@PathVariable Long id) {
        log.info("🌐 Agrégation Jolpica du pilote #{}", id);
        return statsService.syncOne(id);
    }
}