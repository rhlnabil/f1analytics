package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.*;
import com.f1.f1analytics.entity.*;
import com.f1.f1analytics.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictionService {

    private final PredictionRepository predictionRepo;
    private final UserRepository userRepo;
    private final RaceRepository raceRepo;
    private final DriverRepository driverRepo;
    private final RaceResultService raceResultService;
    private final ApplicationContext applicationContext;   // ✅ self-injection

    /** ✅ Référence au proxy Spring — permet d'appliquer @Transactional */
    private PredictionService self() {
        return applicationContext.getBean(PredictionService.class);
    }

    /* ============================================================ */
    /* ============ READ ========================================== */
    /* ============================================================ */

    @Transactional(readOnly = true)
    public List<PredictionDto> getMyPredictions(String username) {
        User user = getUser(username);
        return predictionRepo.findByUserId(user.getId()).stream()
            .map(this::toDto)
            .sorted((a, b) -> {
                if (a.getRaceDate() == null && b.getRaceDate() == null) return 0;
                if (a.getRaceDate() == null) return 1;
                if (b.getRaceDate() == null) return -1;
                return b.getRaceDate().compareTo(a.getRaceDate());
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public PredictionDto getMyPredictionForRace(String username, Long raceId) {
        User user = getUser(username);
        return predictionRepo.findByUserIdAndRaceId(user.getId(), raceId)
            .map(this::toDto).orElse(null);
    }

    /* ============================================================ */
    /* ============ CREATE / UPDATE =============================== */
    /* ============================================================ */

    @Transactional
    public PredictionDto save(String username, PredictionRequest req) {
        User user = getUser(username);

        Race race = raceRepo.findById(req.raceId())
            .orElseThrow(() -> new RuntimeException("Course introuvable"));

        if (isRaceLocked(race))
            throw new RuntimeException("Les pronostics sont fermés pour cette course");

        if (Objects.equals(req.p1DriverId(), req.p2DriverId())
            || Objects.equals(req.p1DriverId(), req.p3DriverId())
            || Objects.equals(req.p2DriverId(), req.p3DriverId()))
            throw new RuntimeException("Tu dois choisir 3 pilotes différents");

        Driver p1 = driverRepo.findById(req.p1DriverId())
            .orElseThrow(() -> new RuntimeException("Pilote P1 introuvable"));
        Driver p2 = driverRepo.findById(req.p2DriverId())
            .orElseThrow(() -> new RuntimeException("Pilote P2 introuvable"));
        Driver p3 = driverRepo.findById(req.p3DriverId())
            .orElseThrow(() -> new RuntimeException("Pilote P3 introuvable"));

        Prediction prediction = predictionRepo
            .findByUserIdAndRaceId(user.getId(), race.getId())
            .orElseGet(() -> {
                Prediction p = Prediction.builder()
                    .user(user).race(race).createdAt(LocalDateTime.now()).build();
                return p;
            });

        prediction.setP1Driver(p1);
        prediction.setP2Driver(p2);
        prediction.setP3Driver(p3);
        prediction.setUpdatedAt(LocalDateTime.now());

        return toDto(predictionRepo.save(prediction));
    }

    @Transactional
    public void delete(String username, Long raceId) {
        User user = getUser(username);
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new RuntimeException("Course introuvable"));

        if (isRaceLocked(race))
            throw new RuntimeException("Impossible de supprimer : course verrouillée");

        predictionRepo.findByUserIdAndRaceId(user.getId(), raceId)
            .ifPresent(predictionRepo::delete);
    }

    /* ============================================================ */
    /* ============ LEADERBOARD =================================== */
    /* ============================================================ */

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(String currentUsername) {
        List<Object[]> raw = predictionRepo.findLeaderboardRaw();

        User currentUser = currentUsername != null
            ? userRepo.findByUsername(currentUsername).orElse(null)
            : null;

        List<LeaderboardEntryDto> result = new ArrayList<>();
        int rank = 1;

        for (Object[] row : raw) {
            Long userId   = (Long) row[0];
            Long totalPts = (Long) row[1];

            User u = userRepo.findById(userId).orElse(null);
            if (u == null) continue;

            int predCount = predictionRepo.findByUserId(userId).size();
            long perfect  = predictionRepo.countPerfectByUser(userId);

            result.add(LeaderboardEntryDto.builder()
                .rank(rank++)
                .userId(u.getId())
                .username(u.getUsername())
                .avatarUrl(u.getAvatarUrl())
                .totalPoints(totalPts.intValue())
                .predictionsCount(predCount)
                .perfectCount((int) perfect)
                .isCurrentUser(currentUser != null && currentUser.getId().equals(u.getId()))
                .build());

            if (rank > 100) break;
        }

        return result;
    }

    /* ============================================================ */
    /* ============ SCHEDULER ===================================== */
    /* ============================================================ */

    @Scheduled(fixedRate = 30 * 60 * 1000, initialDelay = 60_000)
    public void scoreAllPredictions() {
        LocalDate today = LocalDate.now();
        List<Race> pastRaces = raceRepo.findAll().stream()
            .filter(r -> r.getRaceDate() != null && r.getRaceDate().isBefore(today))
            .toList();

        for (Race race : pastRaces) {
            try {
                // ✅ Appel via le PROXY Spring → @Transactional s'applique
                self().scoreRace(race);
            } catch (Exception e) {
                log.error("❌ Erreur scoring course #{} : {}", race.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public Map<String, Object> rescoreAll() {
        Map<String, Object> report = new HashMap<>();
        int scored = 0, skipped = 0;

        LocalDate today = LocalDate.now();
        List<Race> pastRaces = raceRepo.findAll().stream()
            .filter(r -> r.getRaceDate() != null && r.getRaceDate().isBefore(today))
            .toList();

        for (Race race : pastRaces) {
            try {
                int n = self().scoreRace(race);
                scored += n;
                if (n == 0) skipped++;
            } catch (Exception e) {
                log.error("❌ {}", e.getMessage());
                skipped++;
            }
        }

        report.put("success", true);
        report.put("scored", scored);
        report.put("skipped", skipped);
        return report;
    }

    @Transactional
    public int scoreRace(Race race) {
        List<Prediction> unscored = predictionRepo.findUnscoredByRace(race.getId());
        if (unscored.isEmpty()) return 0;

        List<RaceResultDto> results;
        try {
            results = raceResultService.getResultsByRaceId(race.getId());
        } catch (Exception e) {
            log.warn("⚠️ Résultats indispo pour R{} : {}", race.getRound(), e.getMessage());
            return 0;
        }

        if (results == null || results.size() < 3) return 0;

        Long actualP1 = results.get(0).getLocalDriverId();
        Long actualP2 = results.get(1).getLocalDriverId();
        Long actualP3 = results.get(2).getLocalDriverId();
        if (actualP1 == null || actualP2 == null || actualP3 == null) return 0;

        int count = 0;
        for (Prediction p : unscored) {
            int pts = 0;
            boolean c1 = p.getP1Driver().getId().equals(actualP1);
            boolean c2 = p.getP2Driver().getId().equals(actualP2);
            boolean c3 = p.getP3Driver().getId().equals(actualP3);
            if (c1) pts += 10;
            if (c2) pts += 5;
            if (c3) pts += 3;
            if (c1 && c2 && c3) pts += 20;
            p.setPointsEarned(pts);
            predictionRepo.save(p);
            count++;
        }
        log.info("✅ {} pronostics scorés pour R{}", count, race.getRound());
        return count;
    }

    /* ============================================================ */
    /* ============ HELPERS ======================================= */
    /* ============================================================ */

    private User getUser(String username) {
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + username));
    }

    private boolean isRaceLocked(Race race) {
        if (race.getRaceDate() == null) return false;
        return !race.getRaceDate().isAfter(LocalDate.now());
    }

    private PredictionDto toDto(Prediction p) {
        Race r = p.getRace();
        boolean locked = isRaceLocked(r);
        boolean scored = p.getPointsEarned() != null;

        Long actualP1 = null, actualP2 = null, actualP3 = null;
        String actualP1Name = null, actualP2Name = null, actualP3Name = null;

        if (scored) {
            try {
                List<RaceResultDto> results = raceResultService.getResultsByRaceId(r.getId());
                if (results != null && results.size() >= 3) {
                    actualP1 = results.get(0).getLocalDriverId();
                    actualP2 = results.get(1).getLocalDriverId();
                    actualP3 = results.get(2).getLocalDriverId();
                    actualP1Name = results.get(0).getDriverFirstName() + " " + results.get(0).getDriverLastName();
                    actualP2Name = results.get(1).getDriverFirstName() + " " + results.get(1).getDriverLastName();
                    actualP3Name = results.get(2).getDriverFirstName() + " " + results.get(2).getDriverLastName();
                }
            } catch (Exception ignored) {}
        }

        boolean c1 = actualP1 != null && p.getP1Driver().getId().equals(actualP1);
        boolean c2 = actualP2 != null && p.getP2Driver().getId().equals(actualP2);
        boolean c3 = actualP3 != null && p.getP3Driver().getId().equals(actualP3);

        Driver d1 = p.getP1Driver();
        Driver d2 = p.getP2Driver();
        Driver d3 = p.getP3Driver();

        return PredictionDto.builder()
            .id(p.getId())
            .raceId(r.getId())
            .raceName(r.getName())
            .raceSeason(r.getSeason())
            .raceRound(r.getRound())
            .raceDate(r.getRaceDate())
            .circuitName(r.getCircuit() != null ? r.getCircuit().getName() : null)
            .circuitCountryCode(r.getCircuit() != null ? r.getCircuit().getCountryCode() : null)
            .isLocked(locked).isScored(scored).pointsEarned(p.getPointsEarned())
            .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt())

            .p1DriverId(d1.getId())
            .p1DriverName(d1.getFirstName() + " " + d1.getLastName())
            .p1DriverCode(d1.getLastName() != null ? d1.getLastName().toUpperCase() : null)
            .p1DriverPhotoUrl(d1.getActionPhotoUrl() != null ? d1.getActionPhotoUrl() : d1.getPhotoUrl())
            .p1CountryCode(d1.getCountryCode())
            .p1TeamColor(d1.getTeam() != null ? d1.getTeam().getColor() : null)
            .p1TeamLogoUrl(d1.getTeam() != null ? d1.getTeam().getLogoUrl() : null)

            .p2DriverId(d2.getId())
            .p2DriverName(d2.getFirstName() + " " + d2.getLastName())
            .p2DriverCode(d2.getLastName() != null ? d2.getLastName().toUpperCase() : null)
            .p2DriverPhotoUrl(d2.getActionPhotoUrl() != null ? d2.getActionPhotoUrl() : d2.getPhotoUrl())
            .p2CountryCode(d2.getCountryCode())
            .p2TeamColor(d2.getTeam() != null ? d2.getTeam().getColor() : null)
            .p2TeamLogoUrl(d2.getTeam() != null ? d2.getTeam().getLogoUrl() : null)

            .p3DriverId(d3.getId())
            .p3DriverName(d3.getFirstName() + " " + d3.getLastName())
            .p3DriverCode(d3.getLastName() != null ? d3.getLastName().toUpperCase() : null)
            .p3DriverPhotoUrl(d3.getActionPhotoUrl() != null ? d3.getActionPhotoUrl() : d3.getPhotoUrl())
            .p3CountryCode(d3.getCountryCode())
            .p3TeamColor(d3.getTeam() != null ? d3.getTeam().getColor() : null)
            .p3TeamLogoUrl(d3.getTeam() != null ? d3.getTeam().getLogoUrl() : null)

            .actualP1DriverId(actualP1).actualP1DriverName(actualP1Name).p1Correct(scored ? c1 : null)
            .actualP2DriverId(actualP2).actualP2DriverName(actualP2Name).p2Correct(scored ? c2 : null)
            .actualP3DriverId(actualP3).actualP3DriverName(actualP3Name).p3Correct(scored ? c3 : null)
            .perfect(scored ? (c1 && c2 && c3) : null)
            .build();
    }
}