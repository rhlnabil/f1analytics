package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.f1.f1analytics.dto.TeamRadioDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenF1Service {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final DriverRepository driverRepo;

    private static final String OPENF1_BASE_URL = "https://api.openf1.org/v1";

    /* ✅ NOUVEAU : expose publiquement la résolution du sessionKey */
    public Integer getSessionKey(Race race) {
        if (race.getRaceDate() == null) return null;
        List<JsonNode> sessions = findRaceSessions(race.getSeason());
        if (sessions.isEmpty()) return null;
        JsonNode match = matchSessionByDate(race, sessions);
        return match != null ? match.path("session_key").asInt() : null;
    }

    public List<TeamRadioDto> getTeamRadio(Race race) {
        try {
            if (race.getRaceDate() == null) {
                log.warn("⚠️ Course sans date — pas de radio");
                return List.of();
            }

            List<JsonNode> raceSessions = findRaceSessions(race.getSeason());
            if (raceSessions.isEmpty()) {
                log.warn("⚠️ Aucune session Race dans OpenF1 pour l'année {}", race.getSeason());
                return List.of();
            }

            JsonNode targetSession = matchSessionByDate(race, raceSessions);
            if (targetSession == null) {
                log.warn("⚠️ Aucune session OpenF1 ne correspond à {} ({})",
                    race.getName(), race.getRaceDate());
                return List.of();
            }

            Integer sessionKey = targetSession.path("session_key").asInt();
            log.info("✅ OpenF1 session trouvée: {} (key={})",
                targetSession.path("meeting_name").asText("?"), sessionKey);

            JsonNode radioArray = fetchTeamRadio(sessionKey);
            if (radioArray == null || !radioArray.isArray() || radioArray.isEmpty()) {
                log.info("ℹ️ Aucun message radio pour la session {}", sessionKey);
                return List.of();
            }

            Map<Integer, Driver> driversByNumber = new HashMap<>();
            for (Driver d : driverRepo.findAll()) {
                if (d.getNumber() != null) {
                    driversByNumber.putIfAbsent(d.getNumber(), d);
                }
            }

            List<TeamRadioDto> result = new ArrayList<>();
            for (JsonNode radio : radioArray) {
                int driverNumber = radio.path("driver_number").asInt();
                Driver driver = driversByNumber.get(driverNumber);
                String dateStr = radio.path("date").asText();

                LocalDateTime date = null;
                try {
                    date = LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
                } catch (Exception ignored) {}

                result.add(TeamRadioDto.builder()
                    .driverNumber(driverNumber)
                    .driverName(driver != null
                        ? driver.getFirstName() + " " + driver.getLastName()
                        : "Pilote #" + driverNumber)
                    .teamColor(driver != null && driver.getTeam() != null
                        ? driver.getTeam().getColor()
                        : "#888888")
                    .date(date)
                    .recordingUrl(radio.path("recording_url").asText())
                    .build());
            }

            result.sort((a, b) -> {
                if (a.getDate() == null && b.getDate() == null) return 0;
                if (a.getDate() == null) return 1;
                if (b.getDate() == null) return -1;
                return b.getDate().compareTo(a.getDate());
            });

            log.info("✅ {} messages radio récupérés", result.size());
            return result;

        } catch (Exception e) {
            log.error("❌ Erreur OpenF1 pour la course #{} : {}", race.getId(), e.getMessage());
            return List.of();
        }
    }

    private List<JsonNode> findRaceSessions(int year) {
        String url = UriComponentsBuilder.fromUriString(OPENF1_BASE_URL + "/sessions")
            .queryParam("year", year)
            .queryParam("session_name", "Race")
            .toUriString();

        try {
            log.info("📡 OpenF1 GET {}", url);
            String body = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);

            List<JsonNode> list = new ArrayList<>();
            if (root.isArray()) {
                root.forEach(list::add);
            }
            return list;
        } catch (Exception e) {
            log.error("❌ Erreur OpenF1 sessions {} : {}", year, e.getMessage());
            return List.of();
        }
    }

    private JsonNode matchSessionByDate(Race race, List<JsonNode> sessions) {
        LocalDate raceDate = race.getRaceDate();
        JsonNode bestMatch = null;
        long bestDiffDays = Long.MAX_VALUE;

        for (JsonNode session : sessions) {
            String dateStart = session.path("date_start").asText(null);
            if (dateStart == null) continue;
            try {
                LocalDate sessionDate = LocalDateTime
                    .parse(dateStart, DateTimeFormatter.ISO_DATE_TIME)
                    .toLocalDate();
                long diff = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(raceDate, sessionDate));
                if (diff < bestDiffDays && diff <= 2) {
                    bestDiffDays = diff;
                    bestMatch = session;
                }
            } catch (Exception ignored) {}
        }
        return bestMatch;
    }

    private JsonNode fetchTeamRadio(int sessionKey) {
        String url = UriComponentsBuilder.fromUriString(OPENF1_BASE_URL + "/team_radio")
            .queryParam("session_key", sessionKey)
            .toUriString();
        try {
            String body = restTemplate.getForObject(url, String.class);
            return objectMapper.readTree(body);
        } catch (Exception e) {
            log.error("❌ Erreur OpenF1 team_radio : {}", e.getMessage());
            return null;
        }
    }
}