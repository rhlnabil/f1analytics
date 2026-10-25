package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.TeamRadioDto;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.RaceRepository;
import com.f1.f1analytics.service.OpenF1Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class RaceRadioController {

    private final OpenF1Service openF1Service;
    private final RaceRepository raceRepo;

    @GetMapping("/{id}/radio")
    public List<TeamRadioDto> getTeamRadio(@PathVariable Long id) {
        Race race = raceRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Course introuvable"));
        return openF1Service.getTeamRadio(race);
    }
}