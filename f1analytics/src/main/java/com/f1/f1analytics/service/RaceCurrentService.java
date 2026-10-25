package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.RaceCurrentDto;
import com.f1.f1analytics.dto.RaceResultDto;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RaceCurrentService {

    private final RaceRepository raceRepo;
    private final RaceResultService raceResultService;

    /* ============================================================ */
    /* ============ COMPARATEURS NULL-SAFE ======================= */
    /* ============================================================ */

    private static final Comparator<Integer> NULL_LAST_INT = (a, b) -> {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    };

    private static final Comparator<LocalDate> NULL_LAST_DATE = (a, b) -> {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    };

    /* ✅ FIX : @Transactional garde la session ouverte pour r.getCircuit() */
    @Transactional(readOnly = true)
    public RaceCurrentDto getCurrent() {
        LocalDate today = LocalDate.now();
        List<Race> all = raceRepo.findAll();

        /* ===== 1) Course aujourd'hui ? ===== */
        Optional<Race> todayRace = all.stream()
            .filter(r -> r.getRaceDate() != null && r.getRaceDate().isEqual(today))
            .min((a, b) -> NULL_LAST_INT.compare(a.getRound(), b.getRound()));

        if (todayRace.isPresent()) {
            return RaceCurrentDto.builder()
                .status("live")
                .race(toInfo(todayRace.get()))
                .build();
        }

        /* ===== 2) Prochaine course ? ===== */
        Optional<Race> nextRace = all.stream()
            .filter(r -> r.getRaceDate() != null && r.getRaceDate().isAfter(today))
            .min((a, b) -> NULL_LAST_DATE.compare(a.getRaceDate(), b.getRaceDate()));

        if (nextRace.isPresent()) {
            Race r = nextRace.get();
            long days = ChronoUnit.DAYS.between(today, r.getRaceDate());
            return RaceCurrentDto.builder()
                .status("upcoming")
                .race(toInfo(r))
                .daysUntil(days)
                .build();
        }

        /* ===== 3) Dernière course terminée + podium ===== */
        Optional<Race> lastRace = all.stream()
            .filter(r -> r.getRaceDate() != null && r.getRaceDate().isBefore(today))
            .max((a, b) -> NULL_LAST_DATE.compare(a.getRaceDate(), b.getRaceDate()));

        if (lastRace.isPresent()) {
            Race r = lastRace.get();
            List<RaceResultDto> podium = new ArrayList<>();
            try {
                List<RaceResultDto> results = raceResultService.getResultsByRaceId(r.getId());
                if (results != null && results.size() >= 3) {
                    podium = new ArrayList<>(results.subList(0, 3));
                }
            } catch (Exception e) {
                log.warn("⚠️ Impossible de charger le dernier podium : {}", e.getMessage());
            }
            return RaceCurrentDto.builder()
                .status("finished")
                .race(toInfo(r))
                .podium(podium)
                .build();
        }

        /* ===== 4) Aucune course ===== */
        return RaceCurrentDto.builder().status("none").build();
    }

    private RaceCurrentDto.RaceInfoDto toInfo(Race r) {
        return RaceCurrentDto.RaceInfoDto.builder()
            .id(r.getId())
            .name(r.getName())
            .round(r.getRound())
            .season(r.getSeason())
            .raceDate(r.getRaceDate())
            .circuitName(r.getCircuit() != null ? r.getCircuit().getName() : null)
            .circuitCountryCode(r.getCircuit() != null ? r.getCircuit().getCountryCode() : null)
            .build();
    }
}