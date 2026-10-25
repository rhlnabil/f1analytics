package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.ConstructorStandingDto;
import com.f1.f1analytics.dto.DriverStandingDto;
import com.f1.f1analytics.service.StandingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/standings")
@RequiredArgsConstructor
public class StandingsController {

    private final StandingsService service;

    @GetMapping("/drivers")
    public List<DriverStandingDto> drivers() {
        return service.getDriverStandings();
    }

    @GetMapping("/constructors")
    public List<ConstructorStandingDto> constructors() {
        return service.getConstructorStandings();
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
            "lastUpdate", service.getLastUpdate() != null ? service.getLastUpdate().toString() : "never",
            "lastError",  service.getLastError() != null ? service.getLastError() : "",
            "driverCount", service.getDriverStandings().size(),
            "teamCount", service.getConstructorStandings().size()
        );
    }
}