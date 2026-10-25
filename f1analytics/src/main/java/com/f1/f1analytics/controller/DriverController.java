package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.CareerTimelineDto;
import com.f1.f1analytics.dto.DriverDto;
import com.f1.f1analytics.dto.SeasonStatsDto;
import com.f1.f1analytics.service.CareerTimelineService;
import com.f1.f1analytics.service.DriverService;
import com.f1.f1analytics.service.DriverStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService service;
    private final DriverStatsService statsService;
    private final CareerTimelineService timelineService;

    @GetMapping
    public List<DriverDto> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverDto> getOne(@PathVariable Long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/season-stats")
    public List<SeasonStatsDto> getSeasonStats(@PathVariable Long id) {
        return statsService.getSeasonStats(id);
    }

    /* ============================================================ */
    /* ============ ✅ TIMELINE — NOUVEAU ========================= */
    /* ============================================================ */
    @GetMapping("/{id}/career-timeline")
    public List<CareerTimelineDto> getCareerTimeline(@PathVariable Long id) {
        return timelineService.getCareerTimeline(id);
    }

    @GetMapping("/{id}/career-timeline/debug")
    public Map<String, Object> debugTimeline(@PathVariable Long id) {
        return timelineService.debug(id);
    }

    @PostMapping
    public DriverDto create(@RequestBody DriverDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public DriverDto update(@PathVariable Long id, @RequestBody DriverDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}