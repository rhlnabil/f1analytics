package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.SeasonStatsDto;
import com.f1.f1analytics.entity.Result;
import com.f1.f1analytics.repository.ResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverStatsService {

    private final ResultRepository resultRepo;

    @Transactional(readOnly = true)
    public List<SeasonStatsDto> getSeasonStats(Long driverId) {
        List<Result> results = resultRepo.findByDriverIdWithRace(driverId);

        Map<Integer, List<Result>> bySeason = results.stream()
            .filter(r -> r.getRace() != null && r.getRace().getSeason() != null)
            .collect(Collectors.groupingBy(
                r -> r.getRace().getSeason(),
                TreeMap::new,
                Collectors.toList()
            ));

        return bySeason.entrySet().stream()
            .map(e -> computeSeason(e.getKey(), e.getValue()))
            .toList();
    }

    private SeasonStatsDto computeSeason(Integer season, List<Result> results) {
        int races = results.size();

        int wins = (int) results.stream()
            .filter(r -> r.getPosition() != null && r.getPosition() == 1)
            .count();

        int podiums = (int) results.stream()
            .filter(r -> r.getPosition() != null && r.getPosition() >= 1 && r.getPosition() <= 3)
            .count();

        int pointsFinishes = (int) results.stream()
            .filter(r -> r.getPoints() != null && r.getPoints().compareTo(BigDecimal.ZERO) > 0)
            .count();

        int dnfs = (int) results.stream()
            .filter(r -> r.getPosition() == null)
            .count();

        int totalPoints = results.stream()
            .mapToInt(r -> r.getPoints() != null ? r.getPoints().intValue() : 0)
            .sum();

        double winRate    = races > 0 ? (wins * 100.0 / races) : 0;
        double podiumRate = races > 0 ? (podiums * 100.0 / races) : 0;
        double pointsRate = races > 0 ? (pointsFinishes * 100.0 / races) : 0;
        double dnfRate    = races > 0 ? (dnfs * 100.0 / races) : 0;

        return SeasonStatsDto.builder()
            .season(season)
            .races(races)
            .wins(wins)
            .podiums(podiums)
            .pointsFinishes(pointsFinishes)
            .dnfs(dnfs)
            .points(totalPoints)
            .winRate(round1(winRate))
            .podiumRate(round1(podiumRate))
            .pointsRate(round1(pointsRate))
            .dnfRate(round1(dnfRate))
            .build();
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}