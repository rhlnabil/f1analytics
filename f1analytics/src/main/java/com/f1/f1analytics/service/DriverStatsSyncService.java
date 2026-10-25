package com.f1.f1analytics.service;

import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverStatsSyncService {

    private final DriverRepository driverRepo;
    private final F1SiteScraperService scraper;

    /* ============================================================ */
    /* ============ SYNC UN SEUL PILOTE =========================== */
    /* ============================================================ */
    @Transactional
    public Map<String, Object> syncOne(Long driverId) {
        Map<String, Object> report = new HashMap<>();

        Driver d = driverRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Pilote #" + driverId + " introuvable"));

        String slug = toSlug(d);
        if (slug == null || slug.isBlank()) {
            report.put("success", false);
            report.put("error", "Nom/prénom manquant pour ce pilote");
            report.put("updatedCount", 0);
            report.put("updated", List.of());
            report.put("failed", List.of(d.getLastName() + " (slug invalide)"));
            return report;
        }

        try {
            Map<String, Object> stats = scraper.scrapeCareerStats(slug);

            if (stats.containsKey("error")) {
                report.put("success", false);
                report.put("error", stats.get("error"));
                report.put("updatedCount", 0);
                report.put("updated", List.of());
                report.put("failed", List.of(d.getLastName() + " → " + stats.get("error")));
                return report;
            }

            applyStats(d, stats);
            driverRepo.saveAndFlush(d);

            log.info("✅ {} → {} GP, {} pts, {} podiums, {} DNFs",
                    d.getLastName(),
                    d.getGpEntered(),
                    d.getCareerPoints(),
                    d.getPodiums(),
                    d.getDnfs());

            report.put("success", true);
            report.put("driver", d.getFirstName() + " " + d.getLastName());
            report.put("updatedCount", 1);
            report.put("updated", List.of(
                    d.getLastName() + " (" + d.getGpEntered() + " GP, "
                            + d.getPodiums() + " podiums, "
                            + d.getDnfs() + " DNFs)"
            ));
            report.put("failed", List.of());
            report.put("stats", stats);
            return report;

        } catch (Exception e) {
            log.error("❌ {} : {}", d.getLastName(), e.getMessage());
            report.put("success", false);
            report.put("error", e.getMessage());
            report.put("updatedCount", 0);
            report.put("updated", List.of());
            report.put("failed", List.of(d.getLastName() + " → " + e.getMessage()));
            return report;
        }
    }

    /* ============================================================ */
    /* ============ SYNC TOUS LES PILOTES ======================== */
    /* ============================================================ */
    public Map<String, Object> syncAllDrivers() {
        List<Driver> drivers = driverRepo.findAll();
        List<String> updated = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        List<String> failed  = new ArrayList<>();

        for (Driver d : drivers) {
            String slug = toSlug(d);
            if (slug == null || slug.isBlank()) {
                skipped.add(d.getLastName() + " (pas de slug)");
                continue;
            }

            try {
                Map<String, Object> r = syncOne(d.getId());
                Integer gp = d.getGpEntered();

                if (Boolean.TRUE.equals(r.get("success")) && gp != null && gp > 0) {
                    updated.add(d.getLastName() + " (" + gp + " GP)");
                } else {
                    failed.add(d.getLastName() + " → " + r.get("error"));
                }

                Thread.sleep(1500);
            } catch (Exception e) {
                log.error("❌ {} : {}", d.getLastName(), e.getMessage());
                failed.add(d.getLastName() + " → " + e.getMessage());
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("total", drivers.size());
        report.put("updatedCount", updated.size());
        report.put("updated", updated);
        report.put("skipped", skipped);
        report.put("failed", failed);
        return report;
    }

    /* ============================================================ */
    /* ============ HELPERS ====================================== */
    /* ============================================================ */
    private void applyStats(Driver d, Map<String, Object> stats) {
        if (stats.get("gpEntered") instanceof Integer i) d.setGpEntered(i);
        if (stats.get("careerPoints") instanceof BigDecimal b) d.setCareerPoints(b);
        if (stats.get("podiums") instanceof Integer i) d.setPodiums(i);
        if (stats.get("polePositions") instanceof Integer i) d.setPolePositions(i);
        if (stats.get("worldChampionships") instanceof Integer i) d.setWorldChampionships(i);
        if (stats.get("dnfs") instanceof Integer i) d.setDnfs(i);
        if (stats.get("highestFinish") instanceof String s) d.setHighestFinish(s);
        if (stats.get("highestGrid") instanceof String s) d.setHighestGrid(s);
    }

    private String toSlug(Driver d) {
        String fn = d.getFirstName() != null ? d.getFirstName().trim() : "";
        String ln = d.getLastName() != null ? d.getLastName().trim() : "";
        if (fn.isEmpty() || ln.isEmpty()) return null;
        return (fn + "-" + ln)
                .toLowerCase()
                .replace(" ", "-")
                .replace("ä", "a").replace("ö", "o").replace("ü", "u")
                .replace("é", "e").replace("è", "e")
                .replace("ñ", "n").replace("ç", "c")
                .replace("'", "");
    }
}