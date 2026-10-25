package com.f1.f1analytics.controller;

import com.rometools.rome.feed.synd.SyndContent;
import com.rometools.rome.feed.synd.SyndEnclosure;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "*")
@Slf4j
public class NewsController {

    /* ============================================================ */
    /* ===== Flux RSS F1 ========================================== */
    /* ============================================================ */
    private static final List<FeedSource> FEEDS = List.of(
        new FeedSource("The Race",   "https://www.the-race.com/feed/"),
        new FeedSource("Motorsport", "https://www.motorsport.com/rss/f1/news/"),
        new FeedSource("RaceFans",   "https://www.racefans.net/feed/"),
        new FeedSource("PlanetF1",   "https://www.planetf1.com/feed/")
    );

    private record FeedSource(String name, String url) {}

    private static final String USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    /* ============================================================ */
    /* ===== Cache : 5 min pour la liste, illimité pour les scrapes = */
    /* ============================================================ */
    private volatile List<Map<String, Object>> cachedItems = null;
    private volatile long cacheTime = 0;
    private static final long CACHE_TTL = 5 * 60 * 1000;

    /* Cache des contenus scrapés (url → contenu complet) */
    private final Map<String, String> scrapedContentCache = new ConcurrentHashMap<>();

    private static final Pattern IMG_SRC = Pattern.compile(
        "<img[^>]+src=[\"']([^\"']+)[\"']",
        Pattern.CASE_INSENSITIVE
    );

    /* Seuil : en dessous, on considère que le RSS n'a que le résumé → on scrape */
    private static final int MIN_CONTENT_LENGTH = 800;

    /* ============================================================ */
    /* ===== LISTE ================================================ */
    /* ============================================================ */
    @GetMapping
    public List<Map<String, Object>> getNews(@RequestParam(defaultValue = "20") int limit) {
        ensureCacheFresh();

        if (cachedItems == null || cachedItems.isEmpty()) return List.of();

        return cachedItems.stream()
            .limit(limit)
            .map(this::stripForList)
            .collect(Collectors.toList());
    }

    /* ============================================================ */
    /* ===== DÉTAIL — scrape si content trop court =============== */
    /* ============================================================ */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getNewsById(@PathVariable String id) {
        ensureCacheFresh();

        if (cachedItems == null || cachedItems.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Map<String, Object>> found = cachedItems.stream()
            .filter(item -> id.equals(item.get("id")))
            .findFirst();

        if (found.isEmpty()) return ResponseEntity.notFound().build();

        /* On retourne une copie mutable */
        Map<String, Object> article = new LinkedHashMap<>(found.get());

        /* ============================================================ */
        /* ===== Scraping lazy si content trop court =================== */
        /* ============================================================ */
        String currentContent = (String) article.getOrDefault("content", "");
        String url = (String) article.get("url");

        if (url != null && !url.isBlank() && currentContent.length() < MIN_CONTENT_LENGTH) {
            String scraped = scrapedContentCache.get(url);

            if (scraped == null) {
                scraped = scrapeArticle(url);
                scrapedContentCache.put(url, scraped != null ? scraped : "");
            }

            if (scraped != null && !scraped.isEmpty() && scraped.length() > currentContent.length()) {
                article.put("content", scraped);
                /* Met aussi à jour dans la liste cachée */
                for (Map<String, Object> item : cachedItems) {
                    if (id.equals(item.get("id"))) {
                        item.put("content", scraped);
                    }
                }
            }
        }

        return ResponseEntity.ok(article);
    }

    /* ============================================================ */
    /* ===== ADMIN : vider le cache =============================== */
    /* ============================================================ */
    @PostMapping("/clear-cache")
    public Map<String, Object> clearCache() {
        int size = cachedItems != null ? cachedItems.size() : 0;
        int scrapedSize = scrapedContentCache.size();
        cachedItems = null;
        cacheTime = 0;
        scrapedContentCache.clear();
        log.info("🗑️ Cache news vidé ({} articles, {} contenus scrapés)", size, scrapedSize);
        return Map.of(
            "success", true,
            "message", "Cache vidé (listes + scrapes)",
            "previousSize", size,
            "scrapedSize", scrapedSize
        );
    }

    /* ============================================================ */
    /* ===== SCRAPING D'UN ARTICLE ================================ */
    /* ============================================================ */
    private String scrapeArticle(String url) {
        try {
            log.info("🕷️ Scraping : {}", url);

            Document doc = Jsoup.connect(url)
                .userAgent(USER_AGENT)
                .timeout(12_000)
                .followRedirects(true)
                .get();

            /* Nettoyage : enlève scripts, pubs, menus, etc. */
            doc.select(
                "script, style, nav, header, footer, aside, iframe, " +
                ".ad, .ads, .advertisement, .newsletter, .related, " +
                ".comments, .sidebar, .share, .social, " +
                ".cookie-banner, .cookie-consent, .popup, .modal"
            ).remove();

            /* ============================================================ */
            /* Essaie plusieurs sélecteurs, garde le contenu le plus riche  */
            /* ============================================================ */
            String[] selectors = {
                "article",
                "[itemprop=articleBody]",
                ".article-body",
                ".article-content",
                ".article__body",
                ".article__content",
                ".entry-content",     // WordPress
                ".post-content",
                ".content-body",
                ".story-body",
                ".main-content",
                "main"
            };

            Element best = null;
            int bestLen = 0;

            for (String sel : selectors) {
                for (Element el : doc.select(sel)) {
                    int len = el.text().length();
                    if (len > bestLen) {
                        bestLen = len;
                        best = el;
                    }
                }
            }

            if (best == null || bestLen < 300) {
                log.warn("⚠️ Contenu trop court pour {} ({} chars)", url, bestLen);
                return null;
            }

            /* ============================================================ */
            /* Extrait paragraphes + sous-titres + blockquotes              */
            /* ============================================================ */
            StringBuilder sb = new StringBuilder();
            Set<String> seen = new HashSet<>();   // évite les doublons

            for (Element el : best.select("p, h2, h3, h4, blockquote, ul, ol")) {
                /* Ignore les éléments imbriqués (ex: <p> dans <blockquote>) */
                if (el.parents().stream().anyMatch(p ->
                    "blockquote".equals(p.tagName()) ||
                    "li".equals(p.tagName())
                )) continue;

                String tag = el.tagName();
                String text = el.text().trim();

                /* Saute les paragraphes trop courts (légendes, crédits) */
                if (tag.equals("p") && text.length() < 40) continue;
                if (tag.equals("blockquote") && text.length() < 20) continue;

                /* Évite les doublons (arrive parfois quand plusieurs sélecteurs matchent) */
                if (text.length() > 80 && seen.contains(text)) continue;
                if (text.length() > 80) seen.add(text);

                /* Formatage */
                if (tag.equals("h2") || tag.equals("h3") || tag.equals("h4")) {
                    sb.append("## ").append(text).append("\n\n");
                } else if (tag.equals("blockquote")) {
                    sb.append("> ").append(text).append("\n\n");
                } else if (tag.equals("ul") || tag.equals("ol")) {
                    for (Element li : el.select("li")) {
                        String liText = li.text().trim();
                        if (liText.length() >= 15) {
                            sb.append("• ").append(liText).append("\n");
                        }
                    }
                    sb.append("\n");
                } else {
                    sb.append(text).append("\n\n");
                }
            }

            String result = sb.toString().trim();

            if (result.length() < 300) {
                log.warn("⚠️ Extraction trop pauvre pour {} ({} chars)", url, result.length());
                return null;
            }

            /* Cap de sécurité */
            if (result.length() > 50_000) {
                result = result.substring(0, 50_000) + "…";
            }

            log.info("✅ {} chars extraits de {}", result.length(), url);
            return result;

        } catch (Exception e) {
            log.warn("⚠️ Scraping échoué {} : {}", url, e.getMessage());
            return null;
        }
    }

    /* ============================================================ */
    /* ===== CACHE FRESH ========================================== */
    /* ============================================================ */
    private void ensureCacheFresh() {
        if (cachedItems != null && (System.currentTimeMillis() - cacheTime) < CACHE_TTL) {
            log.info("📦 Cache hit news ({} articles)", cachedItems.size());
            return;
        }

        List<Map<String, Object>> all = new ArrayList<>();

        for (FeedSource src : FEEDS) {
            try {
                List<Map<String, Object>> items = fetchFeed(src);
                all.addAll(items);
                log.info("📰 {} → {} articles", src.name(), items.size());
            } catch (Exception e) {
                log.warn("⚠️ Feed {} échoué : {}", src.name(), e.getMessage());
            }
        }

        all.sort((a, b) -> {
            Instant ia = (Instant) a.getOrDefault("publishedAt", Instant.EPOCH);
            Instant ib = (Instant) b.getOrDefault("publishedAt", Instant.EPOCH);
            return ib.compareTo(ia);
        });

        Map<String, Map<String, Object>> unique = new LinkedHashMap<>();
        for (Map<String, Object> item : all) {
            String key = String.valueOf(item.get("title")).toLowerCase().trim();
            unique.putIfAbsent(key, item);
        }
        cachedItems = new ArrayList<>(unique.values());
        cacheTime = System.currentTimeMillis();

        log.info("✅ Total : {} articles uniques (sur {} bruts)", cachedItems.size(), all.size());
    }

    /* ============================================================ */
    /* ===== Strip pour la LISTE ================================== */
    /* ============================================================ */
    private Map<String, Object> stripForList(Map<String, Object> item) {
        Map<String, Object> copy = new LinkedHashMap<>(item);
        copy.remove("content");
        return copy;
    }

    /* ============================================================ */
    /* ===== Fetch + parse RSS ==================================== */
    /* ============================================================ */
    private List<Map<String, Object>> fetchFeed(FeedSource src) throws Exception {
        URI uri = URI.create(src.url());
        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestProperty("User-Agent", USER_AGENT);
        conn.setRequestProperty("Accept", "application/rss+xml, application/xml, text/xml, */*");
        conn.setConnectTimeout(5_000);
        conn.setReadTimeout(10_000);
        conn.setInstanceFollowRedirects(true);

        int code = conn.getResponseCode();
        if (code < 200 || code >= 300) throw new RuntimeException("HTTP " + code);

        List<Map<String, Object>> out = new ArrayList<>();
        try (InputStream is = conn.getInputStream()) {
            SyndFeed feed = new SyndFeedInput().build(new XmlReader(is));
            for (SyndEntry entry : feed.getEntries()) {
                out.add(toItem(entry, src.name()));
            }
        } finally {
            conn.disconnect();
        }
        return out;
    }

    /* ============================================================ */
    /* ===== Conversion RSS → Map ================================= */
    /* ============================================================ */
    private Map<String, Object> toItem(SyndEntry entry, String source) {
        Map<String, Object> item = new LinkedHashMap<>();

        String link = entry.getLink() != null ? entry.getLink() : "";
        item.put("id", UUID.nameUUIDFromBytes(link.getBytes()).toString());
        item.put("title", entry.getTitle() != null ? entry.getTitle() : "Sans titre");
        item.put("url", link);
        item.put("source", source);

        /* Contenu RSS (content:encoded si dispo, sinon description) */
        String fullHtml = null;
        List<SyndContent> contents = entry.getContents();
        if (contents != null && !contents.isEmpty()) {
            for (SyndContent c : contents) {
                if (c != null && c.getValue() != null && !c.getValue().isBlank()) {
                    fullHtml = c.getValue();
                    break;
                }
            }
        }
        if (fullHtml == null && entry.getDescription() != null) {
            fullHtml = entry.getDescription().getValue();
        }

        String fullText = htmlToText(fullHtml);
        String excerpt  = makeExcerpt(fullText, 240);

        item.put("content", fullText);
        item.put("excerpt", excerpt);
        item.put("imageUrl", extractImage(entry));
        item.put("category", guessCategory(entry.getTitle()));
        item.put("publishedAt", entry.getPublishedDate() != null
            ? entry.getPublishedDate().toInstant()
            : Instant.now());
        item.put("readTime", estimateReadTime(fullText));

        return item;
    }

    /* ============================================================ */
    /* ===== HTML → texte avec paragraphes ======================== */
    /* ============================================================ */
    private String htmlToText(String html) {
        if (html == null || html.isBlank()) return "";

        String text = html
            .replaceAll("(?i)</p\\s*>",            "\n\n")
            .replaceAll("(?i)</div\\s*>",          "\n\n")
            .replaceAll("(?i)</h[1-6]\\s*>",       "\n\n")
            .replaceAll("(?i)<br\\s*/?>",          "\n")
            .replaceAll("(?i)</li\\s*>",           "\n")
            .replaceAll("<[^>]+>", "")
            .replace("&nbsp;",   " ")
            .replace("&amp;",    "&")
            .replace("&quot;",   "\"")
            .replace("&#39;",    "'")
            .replace("&apos;",   "'")
            .replace("&lt;",     "<")
            .replace("&gt;",     ">")
            .replace("&#8217;",  "'")
            .replace("&#8216;",  "'")
            .replace("&#8220;",  "\u201C")
            .replace("&#8221;",  "\u201D")
            .replace("&#8212;",  "—")
            .replace("&mdash;",  "—")
            .replace("&ndash;",  "–")
            .replace("&hellip;", "…")
            .replace("&laquo;",  "«")
            .replace("&raquo;",  "»")
            .replaceAll("[ \\t]+", " ")
            .replaceAll("\\n[ \\t]+", "\n")
            .replaceAll("[ \\t]+\\n", "\n")
            .replaceAll("\\n{3,}", "\n\n")
            .trim();

        if (text.length() > 50_000) {
            text = text.substring(0, 50_000) + "…";
        }
        return text;
    }

    private String makeExcerpt(String fullText, int max) {
        if (fullText == null || fullText.isEmpty()) return "";
        String single = fullText.replaceAll("\\s+", " ").trim();
        return single.length() > max ? single.substring(0, max) + "…" : single;
    }

    /* ============================================================ */
    /* ===== Helpers ============================================== */
    /* ============================================================ */
    private String extractImage(SyndEntry entry) {
        List<SyndEnclosure> enclosures = entry.getEnclosures();
        if (enclosures != null && !enclosures.isEmpty()) {
            for (SyndEnclosure enc : enclosures) {
                if (enc == null) continue;
                String type = enc.getType();
                if (type != null && type.startsWith("image")) {
                    String url = enc.getUrl();
                    if (url != null && !url.isBlank()) return url;
                }
            }
        }
        if (entry.getDescription() != null && entry.getDescription().getValue() != null) {
            Matcher m = IMG_SRC.matcher(entry.getDescription().getValue());
            if (m.find()) return m.group(1);
        }
        if (entry.getContents() != null) {
            for (SyndContent c : entry.getContents()) {
                if (c == null || c.getValue() == null) continue;
                Matcher m = IMG_SRC.matcher(c.getValue());
                if (m.find()) return m.group(1);
            }
        }
        if (entry.getForeignMarkup() != null) {
            for (var fm : entry.getForeignMarkup()) {
                if (fm == null) continue;
                if ("content".equals(fm.getName())) {
                    String url = fm.getAttributeValue("url");
                    if (url != null && !url.isBlank()) return url;
                }
            }
        }
        return null;
    }

    private String guessCategory(String title) {
        if (title == null) return null;
        String t = title.toLowerCase();
        if (t.contains("qualif") || t.contains("pole"))                              return "Qualifs";
        if (t.contains("victor") || t.contains(" win") || t.contains("wins"))        return "Course";
        if (t.contains("transfert") || t.contains("contract") || t.contains("signe")) return "Transferts";
        if (t.contains("moteur") || t.contains("engine") || t.contains("plancher"))  return "Technique";
        if (t.contains("interview") || t.contains("déclare") || t.contains("says"))  return "Interview";
        if (t.contains("sprint"))                                                    return "Sprint";
        return null;
    }

    private int estimateReadTime(String text) {
        if (text == null || text.isBlank()) return 1;
        int words = text.split("\\s+").length;
        return Math.max(1, words / 200);
    }
}