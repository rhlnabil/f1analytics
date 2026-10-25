package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.TeamDto;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository repo;

    @Transactional(readOnly = true)
    public List<TeamDto> findAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<TeamDto> findById(Long id) {
        return repo.findById(id).map(this::toDto);
    }

    @Transactional
    public TeamDto create(TeamDto dto) {
        Team t = new Team();
        apply(t, dto);
        // ⚠️ On ne set PAS l'id : c'est la DB qui génère
        return toDto(repo.saveAndFlush(t));
    }

    @Transactional
    public TeamDto update(Long id, TeamDto dto) {
        Team t = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Team " + id + " introuvable"));
        apply(t, dto);
        return toDto(repo.saveAndFlush(t));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void apply(Team t, TeamDto dto) {
        t.setName(dto.getName());
        t.setCountry(dto.getCountry());
        t.setCountryCode(dto.getCountryCode());
        t.setColor(dto.getColor());
        t.setLogoUrl(dto.getLogoUrl());
        t.setFullName(dto.getFullName());
        t.setTeamChief(dto.getTeamChief());
        t.setTechnicalChief(dto.getTechnicalChief());
        t.setChassis(dto.getChassis());
        t.setPowerUnit(dto.getPowerUnit());
        t.setReserveDriver(dto.getReserveDriver());
        t.setFirstEntry(dto.getFirstEntry());
        t.setGpEntered(dto.getGpEntered());
        t.setTeamPoints(dto.getTeamPoints());
        t.setHighestFinish(dto.getHighestFinish());
        t.setPodiums(dto.getPodiums());
        t.setHighestGrid(dto.getHighestGrid());
        t.setPolePositions(dto.getPolePositions());
        t.setWorldChampionships(dto.getWorldChampionships());
    }

    private TeamDto toDto(Team t) {
        return TeamDto.builder()
            .id(t.getId())
            .name(t.getName())
            .country(t.getCountry())
            .countryCode(t.getCountryCode())
            .color(t.getColor())
            .logoUrl(t.getLogoUrl())
            .fullName(t.getFullName())
            .teamChief(t.getTeamChief())
            .technicalChief(t.getTechnicalChief())
            .chassis(t.getChassis())
            .powerUnit(t.getPowerUnit())
            .reserveDriver(t.getReserveDriver())
            .firstEntry(t.getFirstEntry())
            .gpEntered(t.getGpEntered())
            .teamPoints(t.getTeamPoints())
            .highestFinish(t.getHighestFinish())
            .podiums(t.getPodiums())
            .highestGrid(t.getHighestGrid())
            .polePositions(t.getPolePositions())
            .worldChampionships(t.getWorldChampionships())
            .build();
    }
}