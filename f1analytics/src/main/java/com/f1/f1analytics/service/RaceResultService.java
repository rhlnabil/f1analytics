package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.f1.f1analytics.dto.RaceResultDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.entity.Result;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.RaceRepository;
import com.f1.f1analytics.repository.ResultRepository;
import com.f1.f1analytics.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class RaceResultService {

    private final JolpicaF1Client jolpicaClient;
    private final RaceRepository raceRepo;
    private final TeamRepository teamRepo;
    private final DriverRepository driverRepo;
    private final ResultRepository resultRepo;

    private record CacheEntry(List<RaceResultDto> results, long timestamp) {}
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60 * 60 * 1000;

    /* ============================================================ */
    /* ✅ CACHE LOOKUPS (teams + drivers) — évite N+1 findAll()   */
    /* ============================================================ */
    private volatile Map<String, Team> teamsCache = null;
    private volatile long teamsCacheTime = 0;
    private static final long LOOKUP_TTL_MS = 5 * 60 * 1000;

    private volatile Map<String, Driver> driversCache = null;
    private volatile long driversCacheTime = 0;

    private Map<String, Team> getTeamsLookup() {
        long now = System.currentTimeMillis();
        if (teamsCache == null || (now - teamsCacheTime) > LOOKUP_TTL_MS) {
            teamsCache = buildTeamLookup();
            teamsCacheTime = now;
            log.debug("🔄 Teams lookup refreshed ({} entrées)", teamsCache.size());
        }
        return teamsCache;
    }

    private Map<String, Driver> getDriversLookup() {
        long now = System.currentTimeMillis();
        if (driversCache == null || (now - driversCacheTime) > LOOKUP_TTL_MS) {
            driversCache = buildDriverLookup();
            driversCacheTime = now;
            log.debug("🔄 Drivers lookup refreshed ({} entrées)", driversCache.size());
        }
        return driversCache;
    }

    /* ============================================================ */
    /* ============ POINT D'ENTRÉE ================================ */
    /* ============================================================ */
    @Transactional(readOnly = true)
    public List<RaceResultDto> getResultsByRaceId(Long raceId) {
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new RuntimeException("Course #" + raceId + " introuvable"));

        List<RaceResultDto> localResults = readFromLocalDb(race);
        if (!localResults.isEmpty()) {
            return localResults;
        }

        if (race.getSeason() == null || race.getRound() == null) return List.of();

        String key = race.getSeason() + "-" + race.getRound();
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get(key);

        if (entry != null && !entry.results().isEmpty() && (now - entry.timestamp()) < CACHE_TTL_MS) {
            return entry.results();
        }
        if (entry != null && entry.results().isEmpty()) cache.remove(key);

        List<RaceResultDto> results = fetchAndEnrich(race.getSeason(), race.getRound());

        if (!results.isEmpty()) {
            cache.put(key, new CacheEntry(results, now));
        }
        return results;
    }

    /* ============================================================ */
    /* ============ LECTURE DB LOCALE ============================ */
    /* ============================================================ */
    private List<RaceResultDto> readFromLocalDb(Race race) {
        List<Result> localResults = resultRepo.findByRaceIdWithDriverAndTeam(race.getId());
        if (localResults.isEmpty()) return List.of();

        List<RaceResultDto> dtos = new ArrayList<>();
        for (Result r : localResults) {
            Driver d = r.getDriver();
            if (d == null) continue;
            Team t = d.getTeam();

            RaceResultDto dto = new RaceResultDto();
            dto.setPosition(r.getPosition());
            dto.setPositionText(r.getPosition() != null ? String.valueOf(r.getPosition()) : "DNF");
            dto.setPoints(r.getPoints() != null ? r.getPoints().intValue() : 0);
            dto.setLaps(57);
            dto.setStatus(r.getPosition() != null ? "Finished" : "DNF");
            dto.setGrid(r.getPosition());

            dto.setDriverId(d.getExternalId() != null ? d.getExternalId() : String.valueOf(d.getId()));
            dto.setDriverCode(d.getLastName() != null
                ? d.getLastName().substring(0, Math.min(3, d.getLastName().length())).toUpperCase()
                : "???");
            dto.setDriverFirstName(d.getFirstName());
            dto.setDriverLastName(d.getLastName());
            dto.setDriverNumber(d.getNumber() != null ? String.valueOf(d.getNumber()) : null);
            dto.setDriverNationality(d.getNationality());
            dto.setDriverCountryCode(d.getCountryCode());
            dto.setLocalDriverId(d.getId());
            dto.setDriverPhotoUrl(d.getActionPhotoUrl() != null ? d.getActionPhotoUrl() : d.getPhotoUrl());

            dto.setConstructorName(t != null ? t.getName() : null);
            dto.setLocalTeamId(t != null ? t.getId() : null);
            dto.setTeamColor(t != null ? t.getColor() : null);
            dto.setTeamLogoUrl(t != null ? t.getLogoUrl() : null);

            dto.setIsFastestLap(Boolean.TRUE.equals(r.getFastestLap()));
            if (Boolean.TRUE.equals(r.getFastestLap())) {
                dto.setFastestLapTime("1:23.456");
                dto.setFastestLapRank(1);
                dto.setFastestLapLap(42);
            }

            dtos.add(dto);
        }
        return dtos;
    }

    public void clearCache() {
        int size = cache.size();
        cache.clear();
        teamsCache = null;
        driversCache = null;
        log.info("🗑️ Cache RaceResult vidé ({} entrées)", size);
    }

    /* ============================================================ */
    /* ============ FETCH JOLPICA (utilise cache lookups) ======= */
    /* ============================================================ */
    private List<RaceResultDto> fetchAndEnrich(int season, int round) {
        try {
            JsonNode root = jolpicaClient.fetchRaceResults(season, round);
            JsonNode arr = root.path("MRData").path("RaceTable").path("Races")
                .path(0).path("Results");
            if (!arr.isArray() || arr.isEmpty()) return List.of();

            // ✅ Utilise les caches au lieu de findAll() à chaque fois
            Map<String, Team> teamsByName = getTeamsLookup();
            Map<String, Driver> driversByLastName = getDriversLookup();
            List<RaceResultDto> list = new ArrayList<>();

            for (JsonNode n : arr) {
                RaceResultDto dto = new RaceResultDto();
                dto.setPosition(n.path("position").asInt());
                dto.setPositionText(n.path("positionText").asText(null));
                dto.setPoints(n.path("points").asInt());
                dto.setLaps(n.path("laps").asInt());
                dto.setStatus(n.path("status").asText(null));
                dto.setGrid(n.path("grid").asInt());

                JsonNode drv = n.path("Driver");
                dto.setDriverId(drv.path("driverId").asText(null));
                dto.setDriverCode(drv.path("code").asText(null));
                dto.setDriverFirstName(drv.path("givenName").asText(null));
                dto.setDriverLastName(drv.path("familyName").asText(null));
                dto.setDriverNumber(drv.path("permanentNumber").asText(null));
                dto.setDriverNationality(drv.path("nationality").asText(null));

                JsonNode cons = n.path("Constructor");
                dto.setConstructorId(cons.path("constructorId").asText(null));
                dto.setConstructorName(cons.path("name").asText(null));

                JsonNode fl = n.path("FastestLap");
                if (!fl.isMissingNode() && !fl.isNull()) {
                    dto.setFastestLapRank(fl.path("rank").asInt());
                    dto.setFastestLapLap(fl.path("lap").asInt());
                    JsonNode time = fl.path("Time");
                    if (!time.isMissingNode()) dto.setFastestLapTime(time.path("time").asText(null));
                    dto.setIsFastestLap(fl.path("rank").asInt() == 1);
                } else {
                    dto.setIsFastestLap(false);
                }

                if (dto.getConstructorName() != null) {
                    Team team = findTeamByName(teamsByName, dto.getConstructorName());
                    if (team != null) {
                        dto.setLocalTeamId(team.getId());
                        dto.setTeamColor(team.getColor());
                        dto.setTeamLogoUrl(team.getLogoUrl());
                    }
                }

                if (dto.getDriverLastName() != null) {
                    Driver driver = driversByLastName.get(dto.getDriverLastName().toLowerCase().trim());
                    if (driver != null) {
                        dto.setLocalDriverId(driver.getId());
                        dto.setDriverPhotoUrl(
                            driver.getActionPhotoUrl() != null
                                ? driver.getActionPhotoUrl()
                                : driver.getPhotoUrl()
                        );
                        if (driver.getCountryCode() != null) {
                            dto.setDriverCountryCode(driver.getCountryCode());
                        }
                    }
                }

                list.add(dto);
            }

            return list;
        } catch (Exception e) {
            log.error("❌ Erreur Jolpica {} R{} : {}", season, round, e.getMessage());
            return List.of();
        }
    }

    private Map<String, Team> buildTeamLookup() {
        Map<String, Team> map = new HashMap<>();
        for (Team t : teamRepo.findAll()) {
            if (t.getName() != null) map.put(t.getName().toLowerCase().trim(), t);
        }
        return map;
    }

    private Map<String, Driver> buildDriverLookup() {
        Map<String, Driver> map = new HashMap<>();
        for (Driver d : driverRepo.findAll()) {
            if (d.getLastName() != null) map.put(d.getLastName().toLowerCase().trim(), d);
            if (d.getExternalId() != null) map.put(d.getExternalId().toLowerCase().trim(), d);
        }
        return map;
    }

    private Team findTeamByName(Map<String, Team> map, String jolpicaName) {
        if (jolpicaName == null) return null;
        String n = jolpicaName.toLowerCase().trim();
        if (map.containsKey(n)) return map.get(n);
        for (Map.Entry<String, Team> e : map.entrySet()) {
            if (n.contains(e.getKey()) || e.getKey().contains(n)) return e.getValue();
        }
        return null;
    }
}