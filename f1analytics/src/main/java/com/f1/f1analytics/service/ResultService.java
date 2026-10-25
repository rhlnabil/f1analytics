package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.ResultDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.entity.Result;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.RaceRepository;
import com.f1.f1analytics.repository.ResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final ResultRepository repo;
    private final RaceRepository raceRepo;
    private final DriverRepository driverRepo;

    @Transactional(readOnly = true)
    public List<ResultDto> findAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ResultDto> findById(Long id) {
        return repo.findById(id).map(this::toDto);
    }

    @Transactional
    public ResultDto create(ResultDto dto) {
        Result r = new Result();
        apply(r, dto);
        return toDto(repo.saveAndFlush(r));
    }

    @Transactional
    public ResultDto update(Long id, ResultDto dto) {
        Result r = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Result " + id + " introuvable"));
        apply(r, dto);
        return toDto(repo.saveAndFlush(r));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void apply(Result r, ResultDto dto) {
        if (dto.getRaceId() == null) {
            throw new RuntimeException("raceId obligatoire");
        }
        if (dto.getDriverId() == null) {
            throw new RuntimeException("driverId obligatoire");
        }

        Race race = raceRepo.findById(dto.getRaceId())
            .orElseThrow(() -> new RuntimeException("Race " + dto.getRaceId() + " introuvable"));
        Driver driver = driverRepo.findById(dto.getDriverId())
            .orElseThrow(() -> new RuntimeException("Driver " + dto.getDriverId() + " introuvable"));

        r.setRace(race);
        r.setDriver(driver);
        r.setPosition(dto.getPosition());
        r.setPoints(dto.getPoints());
        r.setFastestLap(dto.getFastestLap() != null ? dto.getFastestLap() : false);
    }

    private ResultDto toDto(Result r) {
        Race race = r.getRace();
        Driver driver = r.getDriver();
        Team team = driver != null ? driver.getTeam() : null;

        return ResultDto.builder()
            .id(r.getId())
            .raceId(race != null ? race.getId() : null)
            .raceName(race != null ? race.getName() : null)
            .raceSeason(race != null ? race.getSeason() : null)
            .raceRound(race != null ? race.getRound() : null)
            .raceDate(race != null ? race.getRaceDate() : null)
            .driverId(driver != null ? driver.getId() : null)
            .driverName(driver != null ? driver.getFirstName() + " " + driver.getLastName() : null)
            .driverNumber(driver != null && driver.getNumber() != null
                ? String.valueOf(driver.getNumber()) : null)
            .driverCountryCode(driver != null ? driver.getCountryCode() : null)
            .teamId(team != null ? team.getId() : null)
            .teamName(team != null ? team.getName() : null)
            .teamColor(team != null ? team.getColor() : null)
            .teamLogoUrl(team != null ? team.getLogoUrl() : null)
            .position(r.getPosition())
            .points(r.getPoints())
            .fastestLap(r.getFastestLap())
            .build();
    }
}