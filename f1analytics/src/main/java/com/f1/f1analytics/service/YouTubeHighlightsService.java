package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.f1.f1analytics.dto.YouTubeHighlightsDto;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class YouTubeHighlightsService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RaceRepository raceRepo;

    @Value("${youtube.api.key:}")
    private String apiKey;

    @Value("${youtube.api.channel-id:UCB_qr75-ydFVKSF9Dmo6izg}")
    private String channelId;

    @Value("${youtube.api.cache-hours:24}")
    private long cacheHours;

    private static final String API_URL = "https://www.googleapis.com/youtube/v3/search";

    /* ============================================================ */
    /* ============ CACHE ========================================= */
    /* ============================================================ */
    private record CacheEntry(YouTubeHighlightsDto data, long timestamp) {}

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private long cacheTtlMs() {
        return Math.max(1, cacheHours) * 60 * 60 * 1000L;
    }

    /* ============================================================ */
    /* ============ POINT D'ENTRÉE ================================ */
    /* ============================================================ */
    public YouTubeHighlightsDto getHighlights(Long raceId) {
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new RuntimeException("Course #" + raceId + " introuvable"));

        if (race.getRaceDate() != null && race.getRaceDate().isAfter(LocalDate.now())) {
            log.info("ℹ️ GP #{} pas encore couru — pas de highlights", raceId);
            return YouTubeHighlightsDto.builder().available(false).build();
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("⚠️ YouTube API key manquante — configure 'youtube.api.key'");
            return YouTubeHighlightsDto.builder().available(false).build();
        }

        String cacheKey = race.getSeason() + "-" + race.getRound();
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get(cacheKey);

        if (entry != null && (now - entry.timestamp()) < cacheTtlMs()) {
            log.info("📦 Cache hit YouTube → {}", cacheKey);
            return entry.data();
        }

        log.info("🎥 Recherche YouTube pour {} R{} ({})",
            race.getSeason(), race.getRound(), race.getName());

        YouTubeHighlightsDto result = fetchHighlights(race);

        if (result.isAvailable()) {
            cache.put(cacheKey, new CacheEntry(result, now));
            log.info("✅ Cache stocké pour {}", cacheKey);
        } else {
            log.warn("⚠️ Aucun highlight trouvé pour {} R{}", race.getSeason(), race.getRound());
        }

        return result;
    }

    public void clearCache() {
        int size = cache.size();
        cache.clear();
        log.info("🗑️ Cache YouTube vidé ({} entrées)", size);
    }

    /* ============================================================ */
    /* ============ APPEL API YOUTUBE ============================= */
    /* ============================================================ */
    private YouTubeHighlightsDto fetchHighlights(Race race) {
        try {
            String cleanName = race.getName()
                .replaceAll("(?i)FORMULA 1\\s*", "")
                .replaceAll("(?i)GRAND PRIX", "GP")
                .trim();

            String query = "F1 " + cleanName + " " + race.getSeason() + " highlights";

            String publishedAfter = null;
            if (race.getRaceDate() != null) {
                publishedAfter = race.getRaceDate().minusDays(2) + "T00:00:00Z";
            }

            UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(API_URL)
                .queryParam("key", apiKey)
                .queryParam("part", "snippet")
                .queryParam("q", query)
                .queryParam("type", "video")
                .queryParam("maxResults", 10)
                .queryParam("order", "relevance")
                .queryParam("channelId", channelId)
                .queryParam("videoEmbeddable", "true")
                .queryParam("videoSyndicated", "true");

            if (publishedAfter != null) {
                builder.queryParam("publishedAfter", publishedAfter);
            }

            URI uri = builder.build().encode().toUri();
            log.info("📡 YouTube GET {}", uri);

            String body = restTemplate.getForObject(uri, String.class);
            JsonNode root = objectMapper.readTree(body);

            JsonNode items = root.path("items");
            if (!items.isArray() || items.isEmpty()) {
                return YouTubeHighlightsDto.builder().available(false).build();
            }

            /* ✅ FILTRE STRICT : le titre doit contenir le nom du GP */
            String gpKeyword = cleanName.toLowerCase().replace(" gp", "").trim();

            JsonNode bestMatch = null;
            List<JsonNode> validItems = new ArrayList<>();

            for (JsonNode item : items) {
                String title = item.path("snippet").path("title").asText("").toLowerCase();
                boolean matchesGP = title.contains(gpKeyword);
                boolean hasHighlight = title.contains("highlight");

                if (matchesGP && hasHighlight) {
                    validItems.add(item);
                    if (bestMatch == null) bestMatch = item;
                }
            }

            /* Si aucun match exact, on prend le premier résultat comme fallback */
            if (bestMatch == null) {
                log.warn("⚠️ Aucun highlight exact pour '{}' — fallback sur le 1er résultat", gpKeyword);
                bestMatch = items.get(0);
                validItems.add(bestMatch);
            }

            String videoId = bestMatch.path("id").path("videoId").asText(null);
            if (videoId == null || videoId.isBlank()) {
                return YouTubeHighlightsDto.builder().available(false).build();
            }

            JsonNode snippet = bestMatch.path("snippet");
            String thumb = pickThumbnail(snippet.path("thumbnails"));

            YouTubeHighlightsDto.HighlightDto main = YouTubeHighlightsDto.HighlightDto.builder()
                .videoId(videoId)
                .title(snippet.path("title").asText("Highlights"))
                .thumbnail(thumb)
                .publishedAt(snippet.path("publishedAt").asText(null))
                .embedUrl("https://www.youtube-nocookie.com/embed/" + videoId)
                .watchUrl("https://www.youtube.com/watch?v=" + videoId)
                .build();

            List<YouTubeHighlightsDto.HighlightDto> alternatives = new ArrayList<>();
            for (JsonNode item : validItems) {
                if (alternatives.size() >= 3) break;
                String altId = item.path("id").path("videoId").asText(null);
                if (altId == null || altId.equals(videoId)) continue;

                JsonNode altSnip = item.path("snippet");
                alternatives.add(YouTubeHighlightsDto.HighlightDto.builder()
                    .videoId(altId)
                    .title(altSnip.path("title").asText("Highlight"))
                    .thumbnail(pickThumbnail(altSnip.path("thumbnails")))
                    .publishedAt(altSnip.path("publishedAt").asText(null))
                    .embedUrl("https://www.youtube-nocookie.com/embed/" + altId)
                    .watchUrl("https://www.youtube.com/watch?v=" + altId)
                    .build());
            }

            return YouTubeHighlightsDto.builder()
                .available(true)
                .videoId(main.getVideoId())
                .title(main.getTitle())
                .thumbnail(main.getThumbnail())
                .publishedAt(main.getPublishedAt())
                .channelTitle(snippet.path("channelTitle").asText("FORMULA 1"))
                .embedUrl(main.getEmbedUrl())
                .watchUrl(main.getWatchUrl())
                .alternatives(alternatives)
                .build();

        } catch (Exception e) {
            log.error("❌ Erreur YouTube pour R{} : {}", race.getRound(), e.getMessage());
            return YouTubeHighlightsDto.builder().available(false).build();
        }
    }

    /* ============================================================ */
    /* ============ HELPERS ====================================== */
    /* ============================================================ */
    private String pickThumbnail(JsonNode thumbs) {
        if (thumbs.isMissingNode()) return null;
        for (String key : new String[]{"maxres", "standard", "high", "medium", "default"}) {
            JsonNode t = thumbs.path(key);
            if (!t.isMissingNode() && t.has("url")) {
                return t.path("url").asText(null);
            }
        }
        return null;
    }
}