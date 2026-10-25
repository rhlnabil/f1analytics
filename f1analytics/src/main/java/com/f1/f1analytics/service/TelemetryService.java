package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.f1.f1analytics.dto.CarDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String OPENF1_BASE = "https://api.openf1.org/v1";
    private static final int MAX_POINTS = 500;   // ✅ réduit de 20k à 500

    private record CacheEntry(List<CarDataDto> data, long timestamp) {}
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private static final long TTL_MS = 24 * 60 * 60 * 1000L;   // ✅ 24h au lieu de 1h

    public List<CarDataDto> getTelemetry(int sessionKey, int driverNumber) {
        String key = sessionKey + "-" + driverNumber;
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get(key);

        if (entry != null && (now - entry.timestamp()) < TTL_MS) {
            log.info("📦 Cache hit télémétrie {}", key);
            return entry.data();
        }

        try {
            String url = UriComponentsBuilder.fromUriString(OPENF1_BASE + "/car_data")
                    .queryParam("session_key", sessionKey)
                    .queryParam("driver_number", driverNumber)
                    .toUriString();

            log.info("📡 OpenF1 GET {}", url);
            long t0 = System.currentTimeMillis();

            String body = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);

            List<CarDataDto> all = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode node : root) {
                    Integer speed = node.path("speed").asInt();
                    if (speed == null || speed <= 0) continue;   // filtre immédiat

                    CarDataDto dto = new CarDataDto();
                    dto.setSpeed(speed);
                    dto.setThrottle(node.path("throttle").asInt());
                    dto.setBrake(node.path("brake").asInt());
                    dto.setNGear(node.path("n_gear").asInt());
                    dto.setRpm(node.path("rpm").asInt());
                    try {
                        dto.setDate(Instant.parse(node.path("date").asText()));
                    } catch (Exception ignored) {}
                    all.add(dto);
                }
            }

            /* ✅ DOWNSAMPLING : on garde ~500 points max, espacés régulièrement */
            List<CarDataDto> result = downsample(all, MAX_POINTS);

            long elapsed = System.currentTimeMillis() - t0;
            log.info("✅ Télémétrie #{} : {} → {} points en {}ms",
                    driverNumber, all.size(), result.size(), elapsed);

            cache.put(key, new CacheEntry(result, now));
            return result;

        } catch (Exception e) {
            log.error("❌ Erreur OpenF1 car_data : {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * ✅ Réduit la liste à max N points en gardant des échantillons réguliers.
     * Ça conserve la forme de la courbe tout en allégeant énormément le rendu.
     */
    private List<CarDataDto> downsample(List<CarDataDto> data, int maxPoints) {
        if (data.size() <= maxPoints) return data;

        List<CarDataDto> out = new ArrayList<>(maxPoints);
        double step = (double) data.size() / maxPoints;

        for (int i = 0; i < maxPoints; i++) {
            int idx = (int) Math.round(i * step);
            if (idx >= data.size()) idx = data.size() - 1;
            out.add(data.get(idx));
        }
        return out;
    }
}