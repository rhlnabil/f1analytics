package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.f1.f1analytics.entity.Circuit;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.CircuitRepository;
import com.f1.f1analytics.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RaceSyncService {

    private final JolpicaF1Client jolpicaClient;
    private final RaceRepository raceRepo;
    private final CircuitRepository circuitRepo;
    private final ApplicationContext applicationContext;   // ✅ self-injection

    private static final int SEASON = 2026;
    private static final Object SYNC_LOCK = new Object();

    private RaceSyncService self() {
        return applicationContext.getBean(RaceSyncService.class);
    }

    @Scheduled(initialDelay = 15_000, fixedRate = 24 * 60 * 60 * 1000)
    public void scheduledSync() {
        log.info("⏰ Sync auto du calendrier F1 {}", SEASON);
        try {
            self().syncSeason(SEASON);   // ✅ passe par le proxy
        } catch (Exception e) {
            log.error("❌ Sync auto échouée : {}", e.getMessage());
        }
    }

    public Map<String, Object> syncSeason(int season) {
        synchronized (SYNC_LOCK) {
            return self().doSync(season);   // ✅ passe par le proxy
        }
    }

    @Transactional
    public Map<String, Object> doSync(int season) {
        Map<String, Object> report = new HashMap<>();
        try {
            JsonNode root  = jolpicaClient.fetchSeasonRaces(season);
            JsonNode races = root.path("MRData").path("RaceTable").path("Races");

            if (!races.isArray() || races.isEmpty()) {
                report.put("success", false);
                report.put("message", "Aucune course Jolpica pour la saison " + season);
                return report;
            }

            int created = 0, updated = 0, skipped = 0;
            List<String> createdNames = new ArrayList<>();

            for (JsonNode r : races) {
                int round       = r.path("round").asInt();
                String raceName = r.path("raceName").asText(null);
                String dateStr  = r.path("date").asText(null);

                if (round <= 0 || raceName == null) { skipped++; continue; }

                Circuit localCircuit = findLocalCircuit(
                    r.path("Circuit").path("circuitName").asText(null)
                );

                Optional<Race> existing = raceRepo.findBySeasonAndRound(season, round);
                if (existing.isPresent()) {
                    Race race = existing.get();
                    if (race.getCircuit() == null && localCircuit != null) {
                        race.setCircuit(localCircuit);
                        raceRepo.save(race);
                        updated++;
                    } else skipped++;
                } else {
                    Race race = new Race();
                    race.setSeason(season);
                    race.setRound(round);
                    race.setName(raceName);
                    race.setRaceDate(parseDate(dateStr));
                    race.setCircuit(localCircuit);
                    raceRepo.save(race);
                    created++;
                    createdNames.add(round + ". " + raceName);
                }
            }

            report.put("success", true);
            report.put("season", season);
            report.put("total", races.size());
            report.put("created", created);
            report.put("updated", updated);
            report.put("skipped", skipped);
            report.put("createdRaces", createdNames);
            report.put("message", String.format(
                "%d créées, %d mises à jour, %d ignorées", created, updated, skipped
            ));
            log.info("✅ Sync terminée : {}", report.get("message"));
            return report;

        } catch (Exception e) {
            log.error("❌ Erreur sync : {}", e.getMessage());
            report.put("success", false);
            report.put("message", "Erreur : " + e.getMessage());
            return report;
        }
    }

    private LocalDate parseDate(String s) {
        try { return s != null ? LocalDate.parse(s) : null; }
        catch (Exception e) { return null; }
    }

    private Circuit findLocalCircuit(String jolpicaName) {
        if (jolpicaName == null) return null;
        String j = jolpicaName.toLowerCase().trim();
        List<Circuit> all = circuitRepo.findAll();

        for (Circuit c : all)
            if (c.getName() != null && c.getName().toLowerCase().trim().equals(j)) return c;

        for (Circuit c : all) {
            if (c.getName() == null) continue;
            String local = c.getName().toLowerCase().trim();
            if (j.contains(local) || local.contains(j)) return c;
        }
        return null;
    }
}