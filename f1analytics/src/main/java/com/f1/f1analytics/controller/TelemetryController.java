package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.CarDataDto;
import com.f1.f1analytics.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
public class TelemetryController {

    private final TelemetryService telemetryService;

    @GetMapping
    public List<CarDataDto> getTelemetry(
            @RequestParam int sessionKey,
            @RequestParam int driverNumber) {
        return telemetryService.getTelemetry(sessionKey, driverNumber);
    }
}