package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.f1.f1analytics.dto.ConstructorStandingDto;
import com.f1.f1analytics.dto.DriverStandingDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class StandingsService {

    private final JolpicaF1Client jolpicaClient;
    private final TeamRepository teamRepo;
    private final DriverRepository driverRepo;

    // ✅ Cache en mémoire — survit aux coupures Jolpica
    private final AtomicReference<List<DriverStandingDto>> driverStandingsCache = new AtomicReference<>(List.of());
    private final AtomicReference<List<ConstructorStandingDto>> constructorStandingsCache = new AtomicReference<>(List.of());
    private final AtomicReference<LocalDateTime> lastUpdate = new AtomicReference<>(null);
    private final AtomicReference<String> lastError = new AtomicReference<>(null);

    private static final int SEASON = 2026;

    /* ============================================================ */
    /* ============ LECTURE (pour le frontend) ==================== */
    /* ============================================================ */

    public List<DriverStandingDto> getDriverStandings() {
        return driverStandingsCache.get();
    }

    public List<ConstructorStandingDto> getConstructorStandings() {
        return constructorStandingsCache.get();
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate.get();
    }

    public String getLastError() {
        return lastError.get();
    }

    /* ============================================================ */
    /* ============ TÂCHE PLANIFIÉE — REFRESH AUTO ================ */
    /* ============================================================ */

    @Scheduled(fixedRate = 60 * 60 * 1000, initialDelay = 10_000)
    public void scheduledRefresh() {
        log.info("⏰ Refresh automatique des classements F1 {}", SEASON);
        refreshAll();
    }

    /* ============================================================ */
    /* ============ REFRESH MANUEL ================================ */
    /* ============================================================ */

    public Map<String, Object> refreshAll() {
        Map<String, Object> report = new HashMap<>();
        boolean driverOk = refreshDrivers(report);
        boolean constructorOk = refreshConstructors(report);

        if (driverOk || constructorOk) {
            lastUpdate.set(LocalDateTime.now());
            lastError.set(null);
        }

        report.put("lastUpdate", lastUpdate.get());
        return report;
    }

    /* ============================================================ */
    /* ============ PILOTES ======================================= */
    /* ============================================================ */

    private boolean refreshDrivers(Map<String, Object> report) {
        try {
            JsonNode root = jolpicaClient.fetchDriverStandings(SEASON);
            JsonNode arr = root
                .path("MRData")
                .path("StandingsTable")
                .path("StandingsLists")
                .path(0)
                .path("DriverStandings");

            if (!arr.isArray() || arr.isEmpty()) {
                report.put("drivers", "Aucune donnée pilote disponible");
                return false;
            }

            List<DriverStandingDto> list = new ArrayList<>();
            Map<String, Team> teamsByName = buildTeamLookup();
            Map<String, Driver> driversByLastName = buildDriverLookup();

            for (JsonNode n : arr) {
                DriverStandingDto dto = new DriverStandingDto();
                dto.setPosition(n.path("position").asInt());
                dto.setPoints(new BigDecimal(n.path("points").asText("0")));
                dto.setWins(n.path("wins").asInt());

                JsonNode drv = n.path("Driver");
                dto.setDriverId(drv.path("driverId").asText(null));
                dto.setCode(drv.path("code").asText(null));
                dto.setFirstName(drv.path("givenName").asText(null));
                dto.setLastName(drv.path("familyName").asText(null));
                dto.setNumber(drv.path("permanentNumber").asText(null));
                dto.setNationality(drv.path("nationality").asText(null));

                JsonNode constructor = n.path("Constructors").path(0);
                if (!constructor.isMissingNode()) {
                    dto.setConstructorId(constructor.path("constructorId").asText(null));
                    dto.setConstructorName(constructor.path("name").asText(null));
                }

                // ✅ Enrichissement local : team
                if (dto.getConstructorName() != null) {
                    Team team = findTeamByName(teamsByName, dto.getConstructorName());
                    if (team != null) {
                        dto.setLocalTeamId(team.getId());
                        dto.setTeamColor(team.getColor());
                        dto.setTeamLogoUrl(team.getLogoUrl());
                    }
                }

                // ✅ Enrichissement local : driver
                if (dto.getLastName() != null) {
                    Driver driver = driversByLastName.get(dto.getLastName().toLowerCase());
                    if (driver != null) {
                        dto.setLocalDriverId(driver.getId());
                        dto.setPhotoUrl(driver.getActionPhotoUrl() != null
                            ? driver.getActionPhotoUrl()
                            : driver.getPhotoUrl());
                    }
                }

                list.add(dto);
            }

            driverStandingsCache.set(list);
            report.put("drivers", list.size() + " pilotes");
            log.info("✅ {} pilotes classés récupérés", list.size());
            return true;

        } catch (Exception e) {
            log.error("❌ Erreur refresh pilotes : {}", e.getMessage());
            lastError.set("Pilotes : " + e.getMessage());
            report.put("drivers", "Erreur : " + e.getMessage());
            return false;
        }
    }

    /* ============================================================ */
    /* ============ CONSTRUCTEURS ================================= */
    /* ============================================================ */

    private boolean refreshConstructors(Map<String, Object> report) {
        try {
            JsonNode root = jolpicaClient.fetchConstructorStandings(SEASON);
            JsonNode arr = root
                .path("MRData")
                .path("StandingsTable")
                .path("StandingsLists")
                .path(0)
                .path("ConstructorStandings");

            if (!arr.isArray() || arr.isEmpty()) {
                report.put("constructors", "Aucune donnée écurie disponible");
                return false;
            }

            List<ConstructorStandingDto> list = new ArrayList<>();
            Map<String, Team> teamsByName = buildTeamLookup();

            for (JsonNode n : arr) {
                ConstructorStandingDto dto = new ConstructorStandingDto();
                dto.setPosition(n.path("position").asInt());
                dto.setPoints(new BigDecimal(n.path("points").asText("0")));
                dto.setWins(n.path("wins").asInt());

                JsonNode c = n.path("Constructor");
                dto.setConstructorId(c.path("constructorId").asText(null));
                dto.setName(c.path("name").asText(null));
                dto.setNationality(c.path("nationality").asText(null));

                // ✅ Enrichissement local
                if (dto.getName() != null) {
                    Team team = findTeamByName(teamsByName, dto.getName());
                    if (team != null) {
                        dto.setLocalTeamId(team.getId());
                        dto.setTeamColor(team.getColor());
                        dto.setTeamLogoUrl(team.getLogoUrl());
                    }
                }

                list.add(dto);
            }

            constructorStandingsCache.set(list);
            report.put("constructors", list.size() + " écuries");
            log.info("✅ {} écuries classées récupérées", list.size());
            return true;

        } catch (Exception e) {
            log.error("❌ Erreur refresh écuries : {}", e.getMessage());
            lastError.set("Écuries : " + e.getMessage());
            report.put("constructors", "Erreur : " + e.getMessage());
            return false;
        }
    }

    /* ============================================================ */
    /* ============ HELPERS — MATCHING LOCAL ↔ JOLPICA ============ */
    /* ============================================================ */

    private Map<String, Team> buildTeamLookup() {
        Map<String, Team> map = new HashMap<>();
        for (Team t : teamRepo.findAll()) {
            if (t.getName() != null) {
                map.put(t.getName().toLowerCase().trim(), t);
            }
        }
        return map;
    }

    private Map<String, Driver> buildDriverLookup() {
        Map<String, Driver> map = new HashMap<>();
        for (Driver d : driverRepo.findAll()) {
            if (d.getLastName() != null) {
                map.put(d.getLastName().toLowerCase().trim(), d);
            }
        }
        return map;
    }

    /**
     * ✅ Mapping Jolpica (nom officiel) → noms locaux possibles dans ta DB
     *
     * Jolpica utilise des noms "officiels" qui diffèrent souvent de ce qu'on
     * trouve dans une DB locale. Cette map gère TOUTES les équipes F1 2026 :
     *   Mercedes, Ferrari, Cadillac, Red Bull Racing, Racing Bulls, Haas,
     *   McLaren, Aston Martin, Alpine, Audi, Williams
     *
     * ⚠️ On utilise Map.ofEntries() (pas Map.of() limité à 10 entrées)
     */
    private static final Map<String, String[]> TEAM_ALIASES = Map.ofEntries(
        // ========== MERCEDES ==========
        Map.entry("mercedes", new String[]{"mercedes", "mercedes-amg", "mercedes-amg petronas", "mercedes amg"}),
        Map.entry("mercedes-amg", new String[]{"mercedes", "mercedes-amg petronas"}),
        Map.entry("mercedes-amg petronas", new String[]{"mercedes"}),

        // ========== FERRARI ==========
        Map.entry("ferrari", new String[]{"ferrari", "scuderia ferrari"}),
        Map.entry("scuderia ferrari", new String[]{"ferrari"}),

        // ========== RED BULL ==========
        Map.entry("red bull", new String[]{"red bull racing", "red bull"}),
        Map.entry("red bull racing", new String[]{"red bull"}),

        // ========== MCLAREN ==========
        Map.entry("mclaren", new String[]{"mclaren", "mclaren f1 team"}),
        Map.entry("mclaren f1 team", new String[]{"mclaren"}),

        // ========== ASTON MARTIN ==========
        Map.entry("aston martin", new String[]{"aston martin", "aston martin aramco", "aston martin f1 team"}),
        Map.entry("aston martin aramco", new String[]{"aston martin"}),
        Map.entry("aston martin f1 team", new String[]{"aston martin"}),

        // ========== ALPINE ==========
        Map.entry("alpine", new String[]{"alpine", "alpine f1 team"}),
        Map.entry("alpine f1 team", new String[]{"alpine"}),

        // ========== WILLIAMS ==========
        Map.entry("williams", new String[]{"williams", "williams racing"}),
        Map.entry("williams racing", new String[]{"williams"}),

        // ========== HAAS ==========
        Map.entry("haas", new String[]{"haas", "haas f1 team"}),
        Map.entry("haas f1 team", new String[]{"haas"}),

        // ========== RACING BULLS / RB / ALPHATAURI ==========
        Map.entry("racing bulls", new String[]{"racing bulls", "rb", "alphatauri", "visa cash app rb"}),
        Map.entry("rb", new String[]{"racing bulls", "rb"}),
        Map.entry("alphatauri", new String[]{"racing bulls", "rb"}),
        Map.entry("toro rosso", new String[]{"racing bulls", "rb"}),
        Map.entry("visa cash app rb", new String[]{"racing bulls", "rb"}),

        // ========== AUDI (2026) — ex-Sauber/Kick/Stake ==========
        Map.entry("audi", new String[]{"audi", "sauber"}),
        Map.entry("sauber", new String[]{"audi", "sauber"}),
        Map.entry("kick sauber", new String[]{"audi", "sauber"}),
        Map.entry("stake f1 team kick sauber", new String[]{"audi", "sauber"}),
        Map.entry("stake sauber", new String[]{"audi", "sauber"}),

        // ========== CADILLAC (nouvelle équipe 2026) ==========
        Map.entry("cadillac", new String[]{"cadillac", "cadillac f1 team", "cadillac f1"}),
        Map.entry("cadillac f1 team", new String[]{"cadillac"}),
        Map.entry("cadillac f1", new String[]{"cadillac"})
    );

    /**
     * Trouve l'équipe locale correspondant à un nom Jolpica.
     * Stratégie :
     *  1. Match exact (lowercase trim)
     *  2. Alias connus (Map.ofEntries)
     *  3. Fallback partiel prudent (mots complets uniquement)
     */
    private Team findTeamByName(Map<String, Team> map, String jolpicaName) {
        if (jolpicaName == null) return null;
        String n = jolpicaName.toLowerCase().trim();

        // 1) Match exact
        if (map.containsKey(n)) return map.get(n);

        // 2) Alias
        String[] candidates = TEAM_ALIASES.get(n);
        if (candidates != null) {
            for (String c : candidates) {
                if (map.containsKey(c)) return map.get(c);
            }
        }

        // 3) Fallback : match mot complet (pas contains brut)
        for (Map.Entry<String, Team> e : map.entrySet()) {
            String localName = e.getKey();
            if (localName.equals(n)) return e.getValue();
            if (n.startsWith(localName + " ") || n.endsWith(" " + localName)
                || n.contains(" " + localName + " ")) {
                return e.getValue();
            }
            if (localName.startsWith(n + " ") || localName.endsWith(" " + n)
                || localName.contains(" " + n + " ")) {
                return e.getValue();
            }
        }

        log.debug("⚠️ Aucune équipe locale pour '{}'", jolpicaName);
        return null;
    }
}