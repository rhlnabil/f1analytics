package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.RaceDto;
import com.f1.f1analytics.entity.Circuit;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.CircuitRepository;
import com.f1.f1analytics.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RaceService {

    private final RaceRepository repo;
    private final CircuitRepository circuitRepo;

    @Transactional(readOnly = true)
    public List<RaceDto> findAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<RaceDto> findById(Long id) {
        return repo.findById(id).map(this::toDto);
    }

    @Transactional
    public RaceDto create(RaceDto dto) {
        Race r = new Race();
        apply(r, dto);
        return toDto(repo.saveAndFlush(r));
    }

    @Transactional
    public RaceDto update(Long id, RaceDto dto) {
        Race r = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Race " + id + " introuvable"));
        apply(r, dto);
        return toDto(repo.saveAndFlush(r));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void apply(Race r, RaceDto dto) {
        r.setSeason(dto.getSeason());
        r.setRound(dto.getRound());
        r.setName(dto.getName());
        r.setRaceDate(dto.getRaceDate());

        if (dto.getCircuitId() != null) {
            Circuit c = circuitRepo.findById(dto.getCircuitId())
                .orElseThrow(() -> new RuntimeException("Circuit " + dto.getCircuitId() + " introuvable"));
            r.setCircuit(c);
        } else {
            r.setCircuit(null);
        }
    }

    private RaceDto toDto(Race r) {
        Circuit c = r.getCircuit();
        return RaceDto.builder()
            .id(r.getId())
            .season(r.getSeason())
            .round(r.getRound())
            .name(r.getName())
            .raceDate(r.getRaceDate())
            .circuitId(c != null ? c.getId() : null)
            .circuitName(c != null ? c.getName() : null)
            .circuitCountry(c != null ? c.getCountry() : null)
            .circuitCountryCode(c != null ? c.getCountryCode() : null)   // ✅ NEW
            .circuitLengthKm(c != null ? c.getLengthKm() : null)
            .build();
    }
}