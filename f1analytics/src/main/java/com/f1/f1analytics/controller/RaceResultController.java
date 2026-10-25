package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.RaceResultDto;
import com.f1.f1analytics.service.RaceResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class RaceResultController {

    private final RaceResultService service;

    @GetMapping("/{id}/results")
    public List<RaceResultDto> getResults(@PathVariable Long id) {
        return service.getResultsByRaceId(id);
    }
}