package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class JolpicaF1Client {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${jolpica.base-url:https://api.jolpi.ca/ergast/f1}")
    private String baseUrl;

    /* ✅ THROTTLE GLOBAL : 500ms minimum entre 2 requêtes Jolpica */
    private static final long MIN_INTERVAL_MS = 500;
    private final AtomicLong lastCallTime = new AtomicLong(0);

    /* ✅ Retry sur 429 : attentes croissantes (2s, 4s, 6s) */
    private static final int MAX_ATTEMPTS = 3;
    private static final long RETRY_BASE_MS = 2000L;

    /* ============================================================ */
    /* ============ STANDINGS ===================================== */
    /* ============================================================ */

    public JsonNode fetchDriverStandings(int season) {
        return fetchJson(String.format("%s/%d/driverStandings.json", baseUrl, season));
    }

    public JsonNode fetchConstructorStandings(int season) {
        return fetchJson(String.format("%s/%d/constructorStandings.json", baseUrl, season));
    }

    /* ============================================================ */
    /* ============ RACES ========================================= */
    /* ============================================================ */

    public JsonNode fetchSeasonRaces(int season) {
        return fetchJson(String.format("%s/%d.json?limit=100", baseUrl, season));
    }

    public JsonNode fetchRaceResults(int season, int round) {
        return fetchJson(String.format("%s/%d/%d/results.json?limit=100", baseUrl, season, round));
    }

    /* ============================================================ */
    /* ============ DRIVER — AGRÉGATION DE CARRIÈRE ============== */
    /* ============================================================ */

    public JsonNode fetchDriverSeasons(String driverId) {
        return fetchJson(String.format("%s/drivers/%s/seasons.json?limit=100", baseUrl, driverId));
    }

    public JsonNode fetchDriverResultsForSeason(int season, String driverId) {
        return fetchJson(String.format("%s/%d/drivers/%s/results.json?limit=100",
                baseUrl, season, driverId));
    }

    public JsonNode fetchDriverStandingForSeason(int season, String driverId) {
        return fetchJson(String.format("%s/%d/drivers/%s/driverStandings.json",
                baseUrl, season, driverId));
    }

    /* ============================================================ */
    /* ============ HELPER THROTTLE + RETRY ====================== */
    /* ============================================================ */

    private void throttle() {
        long now = System.currentTimeMillis();
        long last = lastCallTime.get();
        long wait = MIN_INTERVAL_MS - (now - last);
        if (wait > 0) {
            try {
                Thread.sleep(wait);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        lastCallTime.set(System.currentTimeMillis());
    }

    private JsonNode fetchJson(String url) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            throttle();   // ✅ Attend 500ms mini depuis le dernier appel

            try {
                log.info("📡 Jolpica GET {} (tentative {}/{})", url, attempt, MAX_ATTEMPTS);
                String body = restTemplate.getForObject(url, String.class);
                return objectMapper.readTree(body);

            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    long backoff = RETRY_BASE_MS * attempt;
                    log.warn("⚠️ 429 rate-limit sur {} — attente {}ms avant retry {}/{}",
                        url, backoff, attempt, MAX_ATTEMPTS);
                    try {
                        Thread.sleep(backoff);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    if (attempt == MAX_ATTEMPTS) {
                        throw new RuntimeException("429 persistant après " + MAX_ATTEMPTS + " tentatives : " + url);
                    }
                } else {
                    log.error("❌ Erreur HTTP Jolpica {} : {}", url, e.getMessage());
                    throw new RuntimeException("Erreur Jolpica : " + e.getMessage(), e);
                }

            } catch (Exception e) {
                log.error("❌ Erreur Jolpica {} : {}", url, e.getMessage());
                throw new RuntimeException("Erreur Jolpica : " + e.getMessage(), e);
            }
        }
        throw new RuntimeException("Impossible de récupérer " + url);
    }
}