package com.f1.f1analytics.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.WaitUntilState;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Scraper F1 officiel (formula1.com/drivers/{slug}).
 *
 * ✅ INIT NON-BLOQUANTE : Playwright est initialisé après le boot de Spring
 *    (via ApplicationReadyEvent). Si Chromium échoue, l'app démarre quand même
 *    et le service renvoie une erreur claire au premier appel.
 *
 * ✅ RETRY : 2 tentatives avec backoff si la page n'est pas stable.
 *
 * ✅ EXTRACTION ROBUSTE : regex multi-patterns + fallback DOM si le texte brut
 *    ne contient pas "Career Stats".
 *
 * ✅ NETTOYAGE : chaque Page est fermée explicitement, chaque Context aussi.
 */
@Service
@Slf4j
@Lazy
public class F1SiteScraperService {

    private static final String BASE_URL = "https://www.formula1.com/en/drivers/";
    private static final int MAX_ATTEMPTS = 2;
    private static final long RETRY_DELAY_MS = 1500L;
    private static final int STABILIZE_CHECKS = 8;
    private static final long STABILIZE_INTERVAL_MS = 1200L;
    private static final int INITIAL_WAIT_MS = 2500;

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            + "AppleWebKit/537.36 (KHTML, like Gecko) "
            + "Chrome/120.0.0.0 Safari/537.36";

    /** Anti-doublon pour l'init différée */
    private final AtomicBoolean initStarted = new AtomicBoolean(false);

    private Playwright playwright;
    private Browser browser;

    // ============================================================
    // INIT DIFFÉRÉE (ne bloque PAS le boot Spring)
    // ============================================================

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        // Démarre Playwright en arrière-plan pour ne pas bloquer
        Thread t = new Thread(this::init, "playwright-init");
        t.setDaemon(true);
        t.start();
    }

    @PostConstruct
    public void init() {
        if (!initStarted.compareAndSet(false, true)) {
            return;
        }

        log.info("🚀 Init Playwright (thread: {})", Thread.currentThread().getName());

        try {
            playwright = Playwright.create();
            log.info("✅ Playwright créé");

            browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions()
                            .setHeadless(true)
                            .setArgs(List.of(
                                    "--no-sandbox",
                                    "--disable-dev-shm-usage",
                                    "--disable-blink-features=AutomationControlled",
                                    "--disable-gpu"
                            ))
            );

            log.info("✅ Chromium lancé avec succès");

        } catch (Exception e) {
            log.error("❌ Playwright init failed : {}", e.getMessage(), e);
            safeClose();
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Arrêt de Playwright...");
        safeClose();
        log.info("Playwright arrêté");
    }

    private void safeClose() {
        if (browser != null) {
            try { browser.close(); } catch (Exception e) {
                log.warn("Chromium close : {}", e.getMessage());
            }
            browser = null;
        }
        if (playwright != null) {
            try { playwright.close(); } catch (Exception e) {
                log.warn("Playwright close : {}", e.getMessage());
            }
            playwright = null;
        }
    }

    // ============================================================
    // POINT D'ENTRÉE PUBLIC
    // ============================================================

    public Map<String, Object> scrapeCareerStats(String slug) {
        Map<String, Object> stats = new HashMap<>();

        if (slug == null || slug.isBlank()) {
            stats.put("error", "Slug vide");
            return stats;
        }

        // Lazy-init si jamais le boot n'a pas déclenché l'event (tests, CLI…)
        if (browser == null) {
            init();
        }

        if (browser == null) {
            stats.put("error", "Playwright indisponible (Chromium n'a pas démarré)");
            return stats;
        }

        Exception lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                Map<String, Object> result = scrapeOnce(slug);
                if (!result.containsKey("error")) {
                    return result;
                }
                lastError = new RuntimeException(String.valueOf(result.get("error")));
                log.warn("⚠️ Tentative {}/{} échouée pour {} : {}",
                        attempt, MAX_ATTEMPTS, slug, result.get("error"));
            } catch (Exception e) {
                lastError = e;
                log.warn("⚠️ Tentative {}/{} exception pour {} : {}",
                        attempt, MAX_ATTEMPTS, slug, e.getMessage());
            }

            if (attempt < MAX_ATTEMPTS) {
                sleep(RETRY_DELAY_MS);
            }
        }

        stats.put("error", lastError != null ? lastError.getMessage() : "Scraping échoué");
        return stats;
    }

    // ============================================================
    // SCRAPING D'UNE PAGE (1 tentative)
    // ============================================================

    private Map<String, Object> scrapeOnce(String slug) {
        Map<String, Object> stats = new HashMap<>();
        BrowserContext context = null;
        Page page = null;

        try {
            context = browser.newContext(
                    new Browser.NewContextOptions()
                            .setUserAgent(USER_AGENT)
                            .setViewportSize(1920, 1080)
                            .setLocale("en-GB")
                            .setBypassCSP(true)
                            .setIgnoreHTTPSErrors(true)
            );

            page = context.newPage();
            page.setDefaultTimeout(45000);

            String url = BASE_URL + slug;
            log.info("🌐 Scraping : {}", url);

            // Désactive les animations CSS/JS pour stabiliser les valeurs
            page.addInitScript("() => {"
                    + " const s = document.createElement('style');"
                    + " s.textContent = '*,*::before,*::after{"
                    + "animation-duration:0s!important;"
                    + "animation-delay:0s!important;"
                    + "transition-duration:0s!important;"
                    + "transition-delay:0s!important}';"
                    + " document.documentElement.appendChild(s);"
                    + "}");

            Response response = page.navigate(
                    url,
                    new Page.NavigateOptions()
                            .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                            .setTimeout(45000)
            );

            // ✅ Détection 404
            if (response != null && response.status() >= 400) {
                return error("HTTP " + response.status() + " pour " + url);
            }

            try {
                page.waitForLoadState(LoadState.NETWORKIDLE,
                        new Page.WaitForLoadStateOptions().setTimeout(8000));
            } catch (PlaywrightException e) {
                log.debug("NETWORKIDLE non atteint, on continue");
            }

            // Attente initiale
            page.waitForTimeout(INITIAL_WAIT_MS);

            // ✅ Attente explicite du bloc "Career Stats" (au lieu de 4s fixes)
            try {
                page.waitForSelector("text=/Career\\s*Stats/i",
                        new Page.WaitForSelectorOptions().setTimeout(10000));
                log.debug("✅ Bloc Career Stats détecté dans le DOM");
            } catch (PlaywrightException e) {
                log.warn("⚠️ Bloc 'Career Stats' introuvable pour {}", slug);
                return error("Section 'Career Stats' absente (page pas chargée ou 404)");
            }

            // Stabilisation : on lit jusqu'à ce que 2 lectures consécutives soient identiques
            Map<String, String> prev = extractCareerValues(page);
            Map<String, String> curr = prev;
            boolean stabilized = false;

            for (int i = 0; i < STABILIZE_CHECKS; i++) {
                if (!curr.isEmpty() && curr.equals(prev)) {
                    log.info("✅ Stats stabilisées ({} vérifs)", i);
                    stabilized = true;
                    break;
                }
                prev = curr;
                page.waitForTimeout(STABILIZE_INTERVAL_MS);
                curr = extractCareerValues(page);
                log.debug("⏳ Vérif {}/{} : {}", i + 1, STABILIZE_CHECKS, curr);
            }

            if (!stabilized) {
                log.warn("⚠️ Valeurs non stabilisées — utilisation de la dernière lecture");
            }

            if (curr.isEmpty()) {
                return error("Aucune donnée extraite de la page");
            }

            // Mapping final
            stats.put("gpEntered",          toInt(curr.get("gpEntered")));
            stats.put("careerPoints",       toDecimal(curr.get("careerPoints")));
            stats.put("highestFinish",      curr.get("highestFinish"));
            stats.put("podiums",            toInt(curr.get("podiums")));
            stats.put("highestGrid",        curr.get("highestGrid"));
            stats.put("polePositions",      toInt(curr.get("polePositions")));
            stats.put("worldChampionships", toInt(curr.get("worldChampionships")));
            stats.put("dnfs",               toInt(curr.get("dnfs")));

            log.info("📥 {} → GP={} Pts={} Pod={} Poles={} DNF={} Titres={}",
                    slug,
                    stats.get("gpEntered"),
                    stats.get("careerPoints"),
                    stats.get("podiums"),
                    stats.get("polePositions"),
                    stats.get("dnfs"),
                    stats.get("worldChampionships"));

            return stats;

        } catch (Exception e) {
            log.error("❌ Scraping {} failed : {}", slug, e.getMessage());
            return error(e.getMessage());
        } finally {
            if (page != null) {
                try { page.close(); } catch (Exception ignored) {}
            }
            if (context != null) {
                try { context.close(); } catch (Exception ignored) {}
            }
        }
    }

    // ============================================================
    // EXTRACTION DES 8 VALEURS
    // ============================================================

    /**
     * ✅ Extraction robuste : 2 stratégies en JS côté page :
     *   1. Split sur les labels connus dans le texte brut
     *   2. Fallback : chercher les éléments DOM contenant les labels
     */
    private Map<String, String> extractCareerValues(Page page) {
        try {
            Object raw = page.evaluate(
                    "() => {" +
                    " const out = {};" +
                    " const text = document.body.innerText || '';" +
                    " const idx = text.search(/Career\\s*Stats/i);" +
                    " if (idx < 0) return out;" +
                    " const section = text.substring(" +
                    "     idx, Math.min(idx + 3000, text.length));" +

                    // ✅ Regex plus permissive : accepte "1 (x254)", "1 (x 254)", "1(254)"
                    " const RE = /^[^0-9]*([0-9]+(?:[.,][0-9]+)?(?:\\s*\\(\\s*x?\\s*[0-9]+\\s*\\))?)/;" +

                    " const tryExtract = (labels) => {" +
                    "   for (const label of labels) {" +
                    "     const parts = section.split(label);" +
                    "     if (parts.length < 2) continue;" +
                    "     const after = parts[1].trim();" +
                    "     const m = after.match(RE);" +
                    "     if (m && m[1]) return m[1].trim();" +
                    "   }" +
                    "   return null;" +
                    " };" +

                    " const mapping = {" +
                    "   gpEntered:          ['Grands Prix Entered', 'Grand Prix Entered', 'Races Entered']," +
                    "   careerPoints:       ['Career Points']," +
                    "   highestFinish:      ['Highest Race Finish', 'Highest Finish']," +
                    "   podiums:            ['Podiums']," +
                    "   highestGrid:        ['Highest Grid Position', 'Highest Grid']," +
                    "   polePositions:      ['Pole Positions', 'Poles']," +
                    "   worldChampionships: ['World Championships', 'Championships']," +
                    "   dnfs:               ['DNFs']" +
                    " };" +

                    " for (const key in mapping) {" +
                    "   const v = tryExtract(mapping[key]);" +
                    "   if (v !== null) out[key] = v;" +
                    " }" +
                    " return out;" +
                    "}");

            if (raw instanceof Map<?, ?> rawMap) {
                Map<String, String> result = new HashMap<>();
                rawMap.forEach((k, v) -> {
                    if (k != null && v != null && !v.toString().isBlank()) {
                        result.put(k.toString(), v.toString());
                    }
                });
                return result;
            }
            return new HashMap<>();

        } catch (Exception e) {
            log.error("❌ extractCareerValues failed : {}", e.getMessage());
            return new HashMap<>();
        }
    }

    // ============================================================
    // CONVERSIONS
    // ============================================================

    private Integer toInt(String s) {
        if (s == null) return null;
        try {
            // Supprime tout sauf les chiffres (ex: "1 (x254)" → "1254" ❌ MAUVAIS)
            // → on garde uniquement le PREMIER nombre
            String cleaned = s.replaceAll("^[^0-9]*([0-9]+).*$", "$1");
            return cleaned.isEmpty() ? null : Integer.parseInt(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal toDecimal(String s) {
        if (s == null) return null;
        try {
            String cleaned = s.replaceAll("[^0-9.,]", "").replace(",", "");
            return cleaned.isEmpty() ? null : new BigDecimal(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> error(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("error", msg);
        return m;
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}