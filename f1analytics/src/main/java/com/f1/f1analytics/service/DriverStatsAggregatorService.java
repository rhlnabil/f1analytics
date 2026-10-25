package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverStatsAggregatorService {

    private final JolpicaF1Client jolpicaClient;
    private final DriverRepository driverRepo;

    /* Délai entre 2 pilotes (protection rate-limit Jolpica) */
    private static final long SLEEP_BETWEEN_DRIVERS_MS = 400;

    /* ============================================================ */
    /* ============ SCHEDULER — sync auto quotidienne ============ */
    /* ============================================================ */
    /**
     * Sync automatique TOUS LES JOURS à 4h du matin.
     * Initial delay = 5 minutes après le démarrage (pour ne pas bloquer le boot).
     */
    @Scheduled(cron = "0 0 4 * * *", zone = "Europe/Paris")
    public void scheduledSyncAll() {
        log.info("⏰ Sync auto Jolpica — agrégation stats de tous les pilotes");
        try {
            Map<String, Object> report = syncAll();
            log.info("✅ Sync auto terminée : {} mis à jour, {} échoués, {} ignorés",
                report.get("updatedCount"),
                ((List<?>) report.get("failed")).size(),
                ((List<?>) report.get("skipped")).size());
        } catch (Exception e) {
            log.error("❌ Sync auto échouée : {}", e.getMessage());
        }
    }

    /* ============================================================ */
    /* ============ SYNC UN SEUL PILOTE =========================== */
    /* ============================================================ */
    @Transactional
    public Map<String, Object> syncOne(Long driverId) {
        Driver driver = driverRepo.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Pilote #" + driverId + " introuvable"));

        Map<String, Object> result = aggregateStats(driver);
        result.put("driverId", driverId);
        return result;
    }

    /* ============================================================ */
    /* ============ SYNC TOUS LES PILOTES ========================= */
    /* ============================================================ */
    public Map<String, Object> syncAll() {
        List<Driver> drivers = driverRepo.findAll();
        List<String> updated = new ArrayList<>();
        List<String> failed  = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (Driver d : drivers) {
            String externalId = resolveExternalId(d);
            if (externalId == null) {
                skipped.add(d.getLastName() + " (pas d'externalId)");
                continue;
            }

            try {
                Map<String, Object> r = aggregateStats(d);

                if (Boolean.TRUE.equals(r.get("success"))) {
                    @SuppressWarnings("unchecked")
                    List<String> upd = (List<String>) r.getOrDefault("updated", List.of());
                    updated.addAll(upd);
                } else {
                    @SuppressWarnings("unchecked")
                    List<String> fl = (List<String>) r.getOrDefault("failed", List.of());
                    failed.addAll(fl);
                }

                Thread.sleep(SLEEP_BETWEEN_DRIVERS_MS);

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                failed.add(d.getLastName() + " → " + e.getMessage());
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("total", drivers.size());
        report.put("updatedCount", updated.size());
        report.put("updated", updated);
        report.put("failed", failed);
        report.put("skipped", skipped);
        return report;
    }

    /* ============================================================ */
    /* ============ AGRÉGATION D'UN PILOTE ======================== */
    /* ============================================================ */
    private Map<String, Object> aggregateStats(Driver driver) {
        Map<String, Object> result = new HashMap<>();

        String externalId = resolveExternalId(driver);
        if (externalId == null) {
            return failResult(driver, "Pas d'externalId (Jolpica) configuré");
        }

        /* --- Persiste l'externalId dérivé si absent --- */
        if (driver.getExternalId() == null || driver.getExternalId().isBlank()) {
            driver.setExternalId(externalId);
            log.info("🆔 externalId dérivé et sauvegardé pour {} : {}",
                driver.getLastName(), externalId);
        }

        try {
            /* ============================================================ */
            /* 1. Récupérer la liste des saisons du pilote                  */
            /* ============================================================ */
            JsonNode seasonsNode = jolpicaClient.fetchDriverSeasons(externalId);
            JsonNode seasonsArr = seasonsNode.path("MRData").path("SeasonTable").path("Seasons");

            List<Integer> seasons = new ArrayList<>();
            if (seasonsArr.isArray()) {
                for (JsonNode s : seasonsArr) {
                    int year = s.path("season").asInt(0);
                    if (year > 0) seasons.add(year);
                }
            }

            if (seasons.isEmpty()) {
                return failResult(driver, "Aucune saison trouvée sur Jolpica pour " + externalId);
            }

            log.info("🏁 {} — {} saisons trouvées : {}",
                driver.getLastName(), seasons.size(),
                seasons);

            /* ============================================================ */
            /* 2. Boucler sur les saisons et agréger                        */
            /* ============================================================ */
            int gpEntered     = 0;
            int wins          = 0;
            int podiums       = 0;
            int poles         = 0;
            int dnfs          = 0;
            int championships = 0;
            BigDecimal totalPoints = BigDecimal.ZERO;
            int highestFinish = Integer.MAX_VALUE;
            int highestGrid   = Integer.MAX_VALUE;

            for (Integer season : seasons) {
                try {
                    JsonNode resultsNode = jolpicaClient.fetchDriverResultsForSeason(season, externalId);
                    JsonNode races = resultsNode.path("MRData").path("RaceTable").path("Races");

                    if (races.isArray()) {
                        for (JsonNode race : races) {
                            JsonNode results = race.path("Results");
                            if (!results.isArray()) continue;

                            for (JsonNode r : results) {
                                /* --- Points --- */
                                gpEntered++;
                                try {
                                    BigDecimal pts = new BigDecimal(r.path("points").asText("0"));
                                    totalPoints = totalPoints.add(pts);
                                } catch (Exception ignored) {}

                                /* --- Position / DNF --- */
                                String posText = r.path("positionText").asText("");
                                boolean isDnf = posText.startsWith("R")
                                             || posText.startsWith("W")
                                             || posText.startsWith("D")
                                             || posText.startsWith("E");

                                if (isDnf) {
                                    dnfs++;
                                } else {
                                    int pos = r.path("position").asInt(0);
                                    if (pos > 0) {
                                        if (pos == 1) wins++;
                                        if (pos <= 3) podiums++;
                                        if (pos < highestFinish) highestFinish = pos;
                                    }
                                }

                                /* --- Grid / Pole --- */
                                int grid = r.path("grid").asInt(0);
                                if (grid > 0) {
                                    if (grid == 1) poles++;
                                    if (grid < highestGrid) highestGrid = grid;
                                }
                            }
                        }
                    }

                    /* ============================================================ */
                    /* 3. Vérifier si champion du monde cette saison                */
                    /* ============================================================ */
                    try {
                        JsonNode standingNode = jolpicaClient.fetchDriverStandingForSeason(season, externalId);
                        JsonNode standings = standingNode.path("MRData")
                            .path("StandingsTable")
                            .path("StandingsLists")
                            .path(0)
                            .path("DriverStandings");

                        if (standings.isArray() && !standings.isEmpty()) {
                            int finalPos = standings.path(0).path("position").asInt(0);
                            if (finalPos == 1) {
                                championships++;
                                log.info("👑 {} champion du monde {}", driver.getLastName(), season);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("⚠️ Standing {} introuvable pour {} : {}",
                            season, externalId, e.getMessage());
                    }

                } catch (Exception e) {
                    log.warn("⚠️ Saison {} ignorée pour {} : {}",
                        season, externalId, e.getMessage());
                }
            }

            /* ============================================================ */
            /* 4. Appliquer au Driver                                       */
            /* ============================================================ */
            driver.setGpEntered(gpEntered);
            driver.setCareerPoints(totalPoints);
            driver.setPodiums(podiums);
            driver.setPolePositions(poles);
            driver.setDnfs(dnfs);
            driver.setWorldChampionships(championships);

            if (highestFinish < Integer.MAX_VALUE) {
                driver.setHighestFinish(String.valueOf(highestFinish));
            }
            if (highestGrid < Integer.MAX_VALUE) {
                driver.setHighestGrid(String.valueOf(highestGrid));
            }

            driverRepo.saveAndFlush(driver);

            /* ============================================================ */
            /* 5. Rapport                                                   */
            /* ============================================================ */
            String summary = String.format(
                "%s (%d GP, %d podiums, %d poles, %d DNFs, %d titres)",
                driver.getLastName(), gpEntered, podiums, poles, dnfs, championships
            );

            log.info("✅ {} → {}", driver.getLastName(), summary);

            result.put("success", true);
            result.put("updatedCount", 1);
            result.put("updated", List.of(summary));
            result.put("failed", List.of());
            result.put("skipped", List.of());
            result.put("stats", Map.of(
                "gpEntered",          gpEntered,
                "careerPoints",       totalPoints,
                "wins",               wins,
                "podiums",            podiums,
                "polePositions",      poles,
                "dnfs",               dnfs,
                "worldChampionships", championships,
                "highestFinish",      highestFinish < Integer.MAX_VALUE ? highestFinish : null,
                "highestGrid",        highestGrid < Integer.MAX_VALUE ? highestGrid : null,
                "seasonsCount",       seasons.size()
            ));

            return result;

        } catch (Exception e) {
            log.error("❌ Agrégation {} : {}", driver.getLastName(), e.getMessage());
            return failResult(driver, e.getMessage());
        }
    }

    /* ============================================================ */
    /* ============ HELPERS ======================================= */
    /* ============================================================ */

    private Map<String, Object> failResult(Driver driver, String error) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", false);
        r.put("updatedCount", 0);
        r.put("updated", List.of());
        r.put("failed", List.of(driver.getLastName() + " → " + error));
        r.put("skipped", List.of());
        r.put("error", error);
        return r;
    }

    /**
     * Résout l'externalId Jolpica :
     *  1. Utilise `externalId` s'il est renseigné
     *  2. Sinon, dérive depuis firstName + lastName (convention Ergast)
     */
    private String resolveExternalId(Driver driver) {
        if (driver.getExternalId() != null && !driver.getExternalId().isBlank()) {
            return driver.getExternalId().trim();
        }

        String first = driver.getFirstName() != null ? driver.getFirstName().trim() : "";
        String last  = driver.getLastName()  != null ? driver.getLastName().trim()  : "";
        if (first.isEmpty() || last.isEmpty()) return null;

        return (first + " " + last)
            .toLowerCase()
            .replace(" ", "_")
            .replace("ä", "a")
            .replace("ö", "o")
            .replace("ü", "u")
            .replace("é", "e")
            .replace("è", "e")
            .replace("ê", "e")
            .replace("ñ", "n")
            .replace("ç", "c")
            .replace("'", "")
            .replace("’", "")
            .trim();
    }
}