package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.f1.f1analytics.dto.CareerTimelineDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Result;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.ResultRepository;
import com.f1.f1analytics.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CareerTimelineService {

    private final JolpicaF1Client jolpicaClient;
    private final DriverRepository driverRepo;
    private final TeamRepository teamRepo;
    private final ResultRepository resultRepo;

    private final Map<Long, List<CareerTimelineDto>> cache = new HashMap<>();
    private final Map<Long, Long> cacheTime = new HashMap<>();
    private static final long CACHE_TTL_MS = 24 * 60 * 60 * 1000L;

    /* ============================================================ */
    /* ============ POINT D'ENTRÉE =============================== */
    /* ============================================================ */
    @Transactional(readOnly = true)
    public List<CareerTimelineDto> getCareerTimeline(Long driverId) {
        long now = System.currentTimeMillis();
        Long cachedAt = cacheTime.get(driverId);

        if (cachedAt != null && (now - cachedAt) < CACHE_TTL_MS) {
            List<CareerTimelineDto> cached = cache.get(driverId);
            if (cached != null && !cached.isEmpty()) {
                log.info("📦 Cache hit timeline #{} : {} saisons", driverId, cached.size());
                return cached;
            }
        }

        Driver driver = driverRepo.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Pilote #" + driverId + " introuvable"));

        /* ✅ 1. JOLPICA EN PREMIER */
        List<CareerTimelineDto> jolpicaTimeline = buildFromJolpica(driver);
        if (!jolpicaTimeline.isEmpty()) {
            log.info("✅ Jolpica timeline {} : {} saisons",
                driver.getLastName(), jolpicaTimeline.size());
            cache.put(driverId, jolpicaTimeline);
            cacheTime.put(driverId, now);
            return jolpicaTimeline;
        }

        /* ✅ 2. FALLBACK DB LOCALE */
        log.warn("⚠️ Jolpica indisponible pour {} — fallback DB locale",
            driver.getLastName());
        List<CareerTimelineDto> localTimeline = buildFromLocalResults(driver);
        if (!localTimeline.isEmpty()) {
            cache.put(driverId, localTimeline);
            cacheTime.put(driverId, now);
            return localTimeline;
        }

        log.warn("❌ Aucune donnée timeline pour {}", driver.getLastName());
        return List.of();
    }

    /* ============================================================ */
    /* ============ ✅ SÉQUENTIEL + 1 SEUL APPEL/SAISON =========== */
    /* ============================================================ */
    private List<CareerTimelineDto> buildFromJolpica(Driver driver) {
        List<String> candidates = resolveExternalIdCandidates(driver);
        if (candidates.isEmpty()) {
            log.warn("⚠️ Aucun candidate externalId pour {}", driver.getLastName());
            return List.of();
        }

        /* Lookup teams une seule fois */
        Map<String, Team> teamsByName = new HashMap<>();
        for (Team t : teamRepo.findAll()) {
            if (t != null && t.getName() != null) {
                teamsByName.put(t.getName().toLowerCase().trim(), t);
            }
        }

        for (String externalId : candidates) {
            try {
                /* 1️⃣ Récupère la liste des saisons (1 seul appel) */
                JsonNode seasonsNode = jolpicaClient.fetchDriverSeasons(externalId);
                JsonNode seasonsArr = seasonsNode
                    .path("MRData").path("SeasonTable").path("Seasons");

                if (!seasonsArr.isArray() || seasonsArr.isEmpty()) {
                    log.debug("Jolpica '{}' → 0 saison", externalId);
                    continue;
                }

                List<Integer> seasons = new ArrayList<>();
                for (JsonNode s : seasonsArr) {
                    if (s == null) continue;
                    int season = s.path("season").asInt(0);
                    if (season > 0) seasons.add(season);
                }

                if (seasons.isEmpty()) {
                    log.debug("Jolpica '{}' → aucune saison valide", externalId);
                    continue;
                }

                log.info("🎯 Jolpica '{}' → {} saisons (séquentiel)", externalId, seasons.size());

                /* 2️⃣ ✅ SÉQUENTIEL — 1 seul appel par saison (results) */
                List<CareerTimelineDto> timeline = new ArrayList<>();
                int successCount = 0;
                int failCount = 0;

                for (int season : seasons) {
                    try {
                        CareerTimelineDto dto = buildJolpicaSeason(
                            season, externalId, teamsByName
                        );
                        if (dto != null) {
                            timeline.add(dto);
                            successCount++;
                        }
                    } catch (Exception e) {
                        failCount++;
                        log.warn("⚠️ Saison {} ignorée pour {} : {}",
                            season, externalId, e.getMessage());
                    }
                }

                if (timeline.isEmpty()) {
                    log.debug("Jolpica '{}' → timeline vide", externalId);
                    continue;
                }

                timeline.sort(Comparator.comparing(
                    CareerTimelineDto::getSeason,
                    Comparator.nullsLast(Comparator.naturalOrder())
                ));

                log.info("✅ Jolpica '{}' : {}/{} saisons récupérées ({}-{})",
                    externalId, successCount, seasons.size(),
                    timeline.get(0).getSeason(),
                    timeline.get(timeline.size() - 1).getSeason());

                if (failCount > 0) {
                    log.info("⚠️ {} saison(s) échouée(s) (rate-limit probable)", failCount);
                }

                /* Persiste l'externalId qui fonctionne */
                if (driver.getExternalId() == null
                    || !driver.getExternalId().equals(externalId)) {
                    driver.setExternalId(externalId);
                    driverRepo.save(driver);
                    log.info("🆔 externalId sauvegardé pour {} : {}",
                        driver.getLastName(), externalId);
                }

                return timeline;

            } catch (Exception e) {
                log.debug("Jolpica '{}' a échoué : {}", externalId, e.getMessage());
            }
        }

        return List.of();
    }

    /**
     * ✅ UN SEUL APPEL par saison (results).
     * Position au championnat = null (non critique).
     * Si tu veux la position, elle sera calculée uniquement via un appel
     * standings DÉDIÉ et NON par saison.
     */
    private CareerTimelineDto buildJolpicaSeason(int season, String externalId,
                                                  Map<String, Team> teamsByName) {
        try {
            JsonNode resultsNode = jolpicaClient.fetchDriverResultsForSeason(season, externalId);
            JsonNode races = resultsNode
                .path("MRData").path("RaceTable").path("Races");

            int racesCount = 0, wins = 0, podiums = 0, poles = 0, pointsTotal = 0;
            Map<String, Integer> constructorCounts = new HashMap<>();

            if (races.isArray()) {
                for (JsonNode race : races) {
                    if (race == null) continue;
                    JsonNode results = race.path("Results");
                    if (!results.isArray()) continue;

                    for (JsonNode r : results) {
                        if (r == null) continue;
                        racesCount++;
                        pointsTotal += r.path("points").asInt(0);

                        String posText = r.path("positionText").asText("");
                        boolean isDnf = posText.startsWith("R")
                                     || posText.startsWith("W")
                                     || posText.startsWith("D");

                        if (!isDnf) {
                            int pos = r.path("position").asInt(0);
                            if (pos == 1) wins++;
                            if (pos >= 1 && pos <= 3) podiums++;
                        }
                        if (r.path("grid").asInt(0) == 1) poles++;

                        String constructorName = r.path("Constructor").path("name").asText("");
                        if (!constructorName.isBlank()) {
                            constructorCounts.merge(constructorName, 1, Integer::sum);
                        }
                    }
                }
            }

            if (racesCount == 0) return null;

            String dominantTeam = null;
            int maxCount = 0;
            for (Map.Entry<String, Integer> e : constructorCounts.entrySet()) {
                if (e.getValue() > maxCount) {
                    maxCount = e.getValue();
                    dominantTeam = e.getKey();
                }
            }

            Team localTeam = findTeam(teamsByName, dominantTeam);

            return CareerTimelineDto.builder()
                .season(season)
                .teamName(dominantTeam != null ? dominantTeam
                    : (localTeam != null ? localTeam.getName() : "—"))
                .teamColor(localTeam != null ? localTeam.getColor() : "#888888")
                .localTeamId(localTeam != null ? localTeam.getId() : null)
                .teamLogoUrl(localTeam != null ? localTeam.getLogoUrl() : null)
                .position(null)   // ✅ Position omise (économise 1 appel/saison)
                .points(pointsTotal)
                .wins(wins)
                .podiums(podiums)
                .poles(poles)
                .races(racesCount)
                .build();

        } catch (Exception e) {
            log.debug("⚠️ Jolpica season {} pour {} : {}",
                season, externalId, e.getMessage());
            return null;
        }
    }

    /* ============================================================ */
    /* ============ FALLBACK DB LOCALE =========================== */
    /* ============================================================ */
    private List<CareerTimelineDto> buildFromLocalResults(Driver driver) {
        try {
            List<Result> results = resultRepo.findByDriverIdWithRace(driver.getId());
            if (results == null || results.isEmpty()) return List.of();

            Map<Integer, List<Result>> bySeason = new TreeMap<>();
            for (Result r : results) {
                if (r == null || r.getRace() == null) continue;
                Integer season = r.getRace().getSeason();
                if (season == null) continue;
                bySeason.computeIfAbsent(season, k -> new ArrayList<>()).add(r);
            }

            List<CareerTimelineDto> timeline = new ArrayList<>();
            Team currentTeam = driver.getTeam();

            for (Map.Entry<Integer, List<Result>> entry : bySeason.entrySet()) {
                Integer season = entry.getKey();
                List<Result> seasonResults = entry.getValue();

                int racesCount = 0, wins = 0, podiums = 0, pointsTotal = 0;
                for (Result r : seasonResults) {
                    if (r == null) continue;
                    racesCount++;
                    if (r.getPoints() != null) pointsTotal += r.getPoints().intValue();
                    Integer pos = r.getPosition();
                    if (pos != null) {
                        if (pos == 1) wins++;
                        if (pos >= 1 && pos <= 3) podiums++;
                    }
                }

                timeline.add(CareerTimelineDto.builder()
                    .season(season)
                    .teamName(currentTeam != null ? currentTeam.getName() : "—")
                    .teamColor(currentTeam != null ? currentTeam.getColor() : "#888888")
                    .localTeamId(currentTeam != null ? currentTeam.getId() : null)
                    .teamLogoUrl(currentTeam != null ? currentTeam.getLogoUrl() : null)
                    .position(null)
                    .points(pointsTotal)
                    .wins(wins)
                    .podiums(podiums)
                    .poles(0)
                    .races(racesCount)
                    .build());
            }

            return timeline;

        } catch (Exception e) {
            log.warn("Erreur local timeline {} : {}", driver.getId(), e.getMessage());
            return List.of();
        }
    }

    /* ============================================================ */
    /* ============ HELPERS ====================================== */
    /* ============================================================ */
    private List<String> resolveExternalIdCandidates(Driver driver) {
        Set<String> candidates = new LinkedHashSet<>();

        if (driver.getExternalId() != null && !driver.getExternalId().isBlank()) {
            candidates.add(driver.getExternalId().trim().toLowerCase());
        }

        String first = normalize(driver.getFirstName());
        String last  = normalize(driver.getLastName());

        if (last.isEmpty()) {
            return new ArrayList<>(candidates);
        }

        candidates.add(last);

        if (!first.isEmpty()) {
            candidates.add(first + "_" + last);
        }

        if (last.contains(" ")) {
            candidates.add(last.replace(" ", "_"));
        }

        return new ArrayList<>(candidates);
    }

    private String normalize(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return n.toLowerCase()
            .replace("'", "")
            .replace("’", "")
            .replace(".", "")
            .trim();
    }

    private Team findTeam(Map<String, Team> map, String name) {
        if (name == null) return null;
        String n = name.toLowerCase().trim();
        if (map.containsKey(n)) return map.get(n);
        for (Map.Entry<String, Team> e : map.entrySet()) {
            if (e == null || e.getKey() == null) continue;
            String local = e.getKey();
            if (n.contains(local) || local.contains(n)) return e.getValue();
        }
        return null;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debug(Long driverId) {
        Map<String, Object> out = new LinkedHashMap<>();
        try {
            Driver driver = driverRepo.findById(driverId).orElse(null);
            if (driver == null) {
                out.put("error", "Pilote introuvable");
                return out;
            }
            out.put("driverId", driverId);
            out.put("driverName", driver.getFirstName() + " " + driver.getLastName());
            out.put("externalId", driver.getExternalId());
            out.put("debutYear", driver.getDebutYear());
            out.put("candidates", resolveExternalIdCandidates(driver));

            List<Result> localResults = resultRepo.findByDriverIdWithRace(driverId);
            out.put("localResultsCount", localResults != null ? localResults.size() : 0);

            List<CareerTimelineDto> local = buildFromLocalResults(driver);
            out.put("localTimelineSeasons", local.size());

            long t0 = System.currentTimeMillis();
            List<CareerTimelineDto> jolpica = buildFromJolpica(driver);
            long elapsed = System.currentTimeMillis() - t0;

            out.put("jolpicaTimelineSeasons", jolpica.size());
            out.put("jolpicaElapsedMs", elapsed);
            if (!jolpica.isEmpty()) {
                out.put("jolpicaFirstSeason", jolpica.get(0).getSeason());
                out.put("jolpicaLastSeason", jolpica.get(jolpica.size() - 1).getSeason());
            }

            return out;
        } catch (Exception e) {
            out.put("error", e.getMessage());
            return out;
        }
    }
}