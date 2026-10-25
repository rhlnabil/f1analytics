package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.CircuitDto;
import com.f1.f1analytics.entity.Circuit;
import com.f1.f1analytics.repository.CircuitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CircuitService {

    private final CircuitRepository repo;

    public List<CircuitDto> findAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    public Optional<CircuitDto> findById(Long id) {
        return repo.findById(id).map(this::toDto);
    }

    public CircuitDto create(CircuitDto dto) {
        Circuit c = new Circuit();
        apply(c, dto);
        return toDto(repo.save(c));
    }

    public CircuitDto update(Long id, CircuitDto dto) {
        Circuit c = repo.findById(id).orElseThrow(() -> new RuntimeException("Circuit " + id + " introuvable"));
        apply(c, dto);
        return toDto(repo.save(c));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void apply(Circuit c, CircuitDto dto) {
        c.setName(dto.getName());
        c.setCountry(dto.getCountry());
        c.setCountryCode(dto.getCountryCode());
        c.setLengthKm(dto.getLengthKm());
        c.setImageUrl(dto.getImageUrl());
        c.setFirstGrandPrix(dto.getFirstGrandPrix());
        c.setFastestLapTime(dto.getFastestLapTime());
        c.setLatitude(dto.getLatitude());
        c.setLongitude(dto.getLongitude());
        c.setArchitect(dto.getArchitect());
        c.setConstructionCost(dto.getConstructionCost());
        c.setNumberOfTurns(dto.getNumberOfTurns());
    }

    private CircuitDto toDto(Circuit c) {
        return CircuitDto.builder()
            .id(c.getId())
            .name(c.getName())
            .country(c.getCountry())
            .countryCode(c.getCountryCode())
            .lengthKm(c.getLengthKm())
            .imageUrl(c.getImageUrl())
            .firstGrandPrix(c.getFirstGrandPrix())
            .fastestLapTime(c.getFastestLapTime())
            .latitude(c.getLatitude())
            .longitude(c.getLongitude())
            .architect(c.getArchitect())
            .constructionCost(c.getConstructionCost())
            .numberOfTurns(c.getNumberOfTurns())
            .build();
    }
}