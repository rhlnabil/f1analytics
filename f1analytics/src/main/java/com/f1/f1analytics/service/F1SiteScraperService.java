package com.f1.f1analytics.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.WaitUntilState;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class F1SiteScraperService {

    private Playwright playwright;
    private Browser browser;

    @PostConstruct
    public void init() {
        log.info("🚀 Démarrage Playwright...");
        playwright = Playwright.create();
        browser = playwright.chromium().launch(
                new BrowserType.LaunchOptions()
                        .setHeadless(true)
                        .setArgs(List.of("--disable-blink-features=AutomationControlled", "--no-sandbox"))
        );
        log.info("✅ Playwright prêt");
    }

    @PreDestroy
    public void shutdown() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    /* ============================================================ */
    /* ============ SCRAPING PRINCIPAL ============================ */
    /* ============================================================ */
    public Map<String, Object> scrapeCareerStats(String slug) {
        Map<String, Object> stats = new HashMap<>();

        BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .setViewportSize(1920, 1080)
                .setLocale("en-GB"));

        Page page = context.newPage();
        page.setDefaultTimeout(45000);

        try {
            String url = "https://www.formula1.com/en/drivers/" + slug;
            log.info("🌐 Scraping : {}", url);

            // Désactive animations CSS
            page.addInitScript(
                "() => {" +
                "  const s = document.createElement('style');" +
                "  s.textContent = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}';" +
                "  document.documentElement.appendChild(s);" +
                "}"
            );

            page.navigate(url, new Page.NavigateOptions()
                    .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                    .setTimeout(45000));
            page.waitForLoadState(LoadState.NETWORKIDLE);

            // ============================================================
            // ⏱️ Attente initiale
            // ============================================================
            page.waitForTimeout(4000);

            // ============================================================
            // 🔄 Boucle de stabilisation : on compare LES 8 VALEURS
            // ============================================================
            Map<String, String> prevValues = extractCareerValues(page);
            Map<String, String> currValues = prevValues;
            boolean stabilized = false;

            for (int i = 0; i < 10; i++) {
                page.waitForTimeout(1500);
                currValues = extractCareerValues(page);

                if (currValues.isEmpty()) {
                    log.info("⏳ Page pas encore prête ({}/10)", i + 1);
                    continue;
                }

                log.info("⏳ Valeurs actuelles ({}/10) : Podiums={} DNFs={} GP={}",
                        i + 1,
                        currValues.get("podiums"),
                        currValues.get("dnfs"),
                        currValues.get("gpEntered"));

                if (currValues.equals(prevValues)) {
                    log.info("✅ Stats stabilisées après ~{}s", 4 + (i + 1) * 1.5);
                    stabilized = true;
                    break;
                }
                prevValues = currValues;
            }

            if (!stabilized) {
                log.info("⚠️ Pas stabilisé, on utilise la dernière lecture");
            }

            // ============================================================
            // 📄 Utilise les dernières valeurs lues
            // ============================================================
            if (currValues.isEmpty()) {
                stats.put("error", "Aucune donnée extraite");
                return stats;
            }

            log.info("📄 Valeurs finales : {}", currValues);

            stats.put("gpEntered",          toInt(currValues.get("gpEntered")));
            stats.put("careerPoints",       toDecimal(currValues.get("careerPoints")));
            stats.put("highestFinish",      currValues.get("highestFinish"));
            stats.put("podiums",            toInt(currValues.get("podiums")));
            stats.put("highestGrid",        currValues.get("highestGrid"));
            stats.put("polePositions",      toInt(currValues.get("polePositions")));
            stats.put("worldChampionships", toInt(currValues.get("worldChampionships")));
            stats.put("dnfs",               toInt(currValues.get("dnfs")));

            log.info("📥 {} → GP={} Podiums={} Poles={} DNFs={} Titres={}",
                    slug,
                    stats.get("gpEntered"),
                    stats.get("podiums"),
                    stats.get("polePositions"),
                    stats.get("dnfs"),
                    stats.get("worldChampionships"));

            return stats;

        } catch (Exception e) {
            log.error("❌ {} : {}", slug, e.getMessage());
            stats.put("error", e.getMessage());
            return stats;
        } finally {
            context.close();
        }
    }

    /* ============================================================ */
    /* ============ EXTRAIRE LES 8 VALEURS CAREER STATS ========== */
    /* ============================================================ */
    private Map<String, String> extractCareerValues(Page page) {
        try {
            Object raw = page.evaluate(
                "() => {" +
                "  const out = {};" +
                "  const text = document.body.innerText || '';" +
                // Trouver "Career Stats"
                "  const idx = text.search(/Career\\s*Stats/i);" +
                "  if (idx < 0) return out;" +
                // Limiter à 2500 chars après pour couper le contenu dynamique
                "  const section = text.substring(idx, Math.min(idx + 2500, text.length));" +
                "" +
                "  const tryExtract = (label) => {" +
                "    const parts = section.split(label);" +
                "    if (parts.length < 2) return null;" +
                "    const after = parts[1].trim();" +
                // Cherche le premier nombre après le label
                "    const m = after.match(/^[^0-9]*([0-9][0-9.,]*(?:\\s*\\([^)]*\\))?)/);" +
                "    return m ? m[1].trim() : null;" +
                "  };" +
                "" +
                "  const mapping = {" +
                "    gpEntered: ['Grands Prix Entered', 'Grand Prix Entered', 'Races Entered']," +
                "    careerPoints: ['Career Points']," +
                "    highestFinish: ['Highest Race Finish', 'Highest Finish']," +
                "    podiums: ['Podiums']," +
                "    highestGrid: ['Highest Grid Position', 'Highest Grid']," +
                "    polePositions: ['Pole Positions', 'Poles']," +
                "    worldChampionships: ['World Championships', 'Championships']," +
                "    dnfs: ['DNFs']" +
                "  };" +
                "" +
                "  for (const key in mapping) {" +
                "    for (const label of mapping[key]) {" +
                "      const v = tryExtract(label);" +
                "      if (v !== null) { out[key] = v; break; }" +
                "    }" +
                "  }" +
                "  return out;" +
                "}"
            );

            if (raw instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, String> m = (Map<String, String>) raw;
                return m;
            }
            return new HashMap<>();
        } catch (Exception e) {
            log.error("extractCareerValues error: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    /* ============================================================ */
    /* ============ PARSERS ======================================= */
    /* ============================================================ */
    private Integer toInt(String s) {
        if (s == null) return null;
        try {
            String c = s.replaceAll("[^0-9]", "");
            return c.isEmpty() ? null : Integer.parseInt(c);
        } catch (Exception e) { return null; }
    }

    private BigDecimal toDecimal(String s) {
        if (s == null) return null;
        try {
            String c = s.replaceAll("[^0-9.,]", "").replace(",", "");
            return c.isEmpty() ? null : new BigDecimal(c);
        } catch (Exception e) { return null; }
    }
}