package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.QuizQuestionDto;
import com.f1.f1analytics.entity.Circuit;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.CircuitRepository;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final DriverRepository driverRepo;
    private final TeamRepository teamRepo;
    private final CircuitRepository circuitRepo;

    private final Random random = new Random();

    /* ============================================================ */
    /* ============ POINT D'ENTRÉE ================================ */
    /* ============================================================ */
    public List<QuizQuestionDto> generateQuestions(int count) {
        List<QuizQuestionDto> pool = new ArrayList<>();

        /* On génère plusieurs instances de chaque type pour varier */
        for (int i = 0; i < 3; i++) {
            safeAdd(pool, this::genDriverNumber);
            safeAdd(pool, this::genDriverTeam);
            safeAdd(pool, this::genDriverNationality);
            safeAdd(pool, this::genCircuitCountry);
            safeAdd(pool, this::genCircuitLength);
            safeAdd(pool, this::genDriverChampionships);
            safeAdd(pool, this::genDriverPodiums);
            safeAdd(pool, this::genCircuitTurns);
            safeAdd(pool, this::genDriverDebutYear);
            safeAdd(pool, this::genTeamFirstEntry);
        }

        /* Dédoublonnage par énoncé */
        Map<String, QuizQuestionDto> unique = new LinkedHashMap<>();
        for (QuizQuestionDto q : pool) {
            unique.putIfAbsent(q.getQuestion(), q);
        }

        List<QuizQuestionDto> all = new ArrayList<>(unique.values());
        Collections.shuffle(all, random);

        return all.stream().limit(Math.max(1, count)).collect(Collectors.toList());
    }

    private void safeAdd(List<QuizQuestionDto> list, Supplier<QuizQuestionDto> gen) {
        try {
            QuizQuestionDto q = gen.get();
            if (q != null && q.getChoices() != null && q.getChoices().size() == 4) {
                list.add(q);
            }
        } catch (Exception e) {
            log.debug("Quiz gen failed: {}", e.getMessage());
        }
    }

    /* ============================================================ */
    /* ============ HELPERS ======================================= */
    /* ============================================================ */

    private <T> List<T> pickRandom(List<T> source, int n, T exclude) {
        List<T> pool = source.stream()
            .filter(x -> !x.equals(exclude))
            .collect(Collectors.toList());
        Collections.shuffle(pool, random);
        return pool.stream().limit(n).collect(Collectors.toList());
    }

    private String fullName(Driver d) {
        String fn = d.getFirstName() != null ? d.getFirstName() : "";
        String ln = d.getLastName() != null ? d.getLastName() : "";
        return (fn + " " + ln).trim();
    }

    /**
     * Génère 4 valeurs numériques dont la bonne réponse.
     * Toutes ≥ min et distinctes.
     */
    private List<String> numericChoices(int correct, int range, int min) {
        Set<Integer> pool = new LinkedHashSet<>();
        pool.add(correct);
        int safety = 0;
        while (pool.size() < 4 && safety++ < 50) {
            int offset = (random.nextInt(range) + 1) * (random.nextBoolean() ? 1 : -1);
            int v = correct + offset;
            if (v >= min) pool.add(v);
        }
        /* Fallback : on ajoute des valeurs croissantes si pas assez */
        int v = correct;
        while (pool.size() < 4) {
            pool.add(v++);
        }
        List<String> out = pool.stream().map(String::valueOf).collect(Collectors.toList());
        Collections.shuffle(out, random);
        return out;
    }

    private QuizQuestionDto build(String question, List<String> choices,
                                  String correctValue, String category, String hint) {
        int idx = choices.indexOf(correctValue);
        if (idx < 0) return null;
        return QuizQuestionDto.builder()
            .id(UUID.randomUUID().toString())
            .question(question)
            .choices(choices)
            .correctIndex(idx)
            .category(category)
            .hint(hint)
            .build();
    }

    /* ============================================================ */
    /* ============ GÉNÉRATEURS DE QUESTIONS ===================== */
    /* ============================================================ */

    /* 1. Qui pilote la #X ? */
    private QuizQuestionDto genDriverNumber() {
        List<Driver> drivers = driverRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(d -> d.getNumber() != null
                      && d.getFirstName() != null
                      && d.getLastName() != null)
            .collect(Collectors.toList());
        if (drivers.size() < 4) return null;

        Driver target = drivers.get(random.nextInt(drivers.size()));
        List<Driver> others = pickRandom(drivers, 3, target);
        if (others.size() < 3) return null;

        List<String> choices = new ArrayList<>();
        choices.add(fullName(target));
        others.forEach(d -> choices.add(fullName(d)));
        Collections.shuffle(choices, random);

        return build(
            "Qui pilote la voiture numéro " + target.getNumber() + " ?",
            choices, fullName(target),
            "Pilotes",
            target.getTeam() != null ? target.getTeam().getName() : null
        );
    }

    /* 2. Dans quelle écurie pilote X ? */
    private QuizQuestionDto genDriverTeam() {
        List<Driver> drivers = driverRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(d -> d.getTeam() != null && d.getFirstName() != null)
            .collect(Collectors.toList());

        List<Team> teams = teamRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(t -> t.getName() != null)
            .collect(Collectors.toList());

        if (drivers.size() < 1 || teams.size() < 4) return null;

        Driver target = drivers.get(random.nextInt(drivers.size()));
        Team correct = target.getTeam();

        List<Team> others = pickRandom(teams, 3, correct);
        if (others.size() < 3) return null;

        List<String> choices = new ArrayList<>();
        choices.add(correct.getName());
        others.forEach(t -> choices.add(t.getName()));
        Collections.shuffle(choices, random);

        return build(
            "Dans quelle écurie pilote " + fullName(target) + " ?",
            choices, correct.getName(),
            "Écuries",
            null
        );
    }

    /* 3. Nationalité de X ? — ✅ FIX WARNING */
    private QuizQuestionDto genDriverNationality() {
        List<Driver> drivers = driverRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(d -> d.getNationality() != null
                      && !d.getNationality().isBlank()
                      && d.getFirstName() != null)
            .collect(Collectors.toList());

        List<String> nationalities = drivers.stream()
            .map(d -> d.getNationality())      // ✅ lambda au lieu de Driver::getNationality
            .filter(Objects::nonNull)           // ✅ fix null-safety
            .distinct()
            .collect(Collectors.toList());

        if (drivers.size() < 1 || nationalities.size() < 4) return null;

        Driver target = drivers.get(random.nextInt(drivers.size()));
        List<String> others = pickRandom(nationalities, 3, target.getNationality());
        if (others.size() < 3) return null;

        List<String> choices = new ArrayList<>();
        choices.add(target.getNationality());
        choices.addAll(others);
        Collections.shuffle(choices, random);

        return build(
            "Quelle est la nationalité de " + fullName(target) + " ?",
            choices, target.getNationality(),
            "Pilotes",
            null
        );
    }

    /* 4. Où se trouve le circuit X ? — ✅ FIX WARNING */
    private QuizQuestionDto genCircuitCountry() {
        List<Circuit> circuits = circuitRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(c -> c.getCountry() != null
                      && !c.getCountry().isBlank()
                      && c.getName() != null)
            .collect(Collectors.toList());

        List<String> countries = circuits.stream()
            .map(c -> c.getCountry())          // ✅ lambda au lieu de Circuit::getCountry
            .filter(Objects::nonNull)           // ✅ fix null-safety
            .distinct()
            .collect(Collectors.toList());

        if (circuits.size() < 1 || countries.size() < 4) return null;

        Circuit target = circuits.get(random.nextInt(circuits.size()));
        List<String> others = pickRandom(countries, 3, target.getCountry());
        if (others.size() < 3) return null;

        List<String> choices = new ArrayList<>();
        choices.add(target.getCountry());
        choices.addAll(others);
        Collections.shuffle(choices, random);

        return build(
            "Dans quel pays se trouve le circuit " + target.getName() + " ?",
            choices, target.getCountry(),
            "Circuits",
            null
        );
    }

    /* 5. Longueur du circuit X ? */
    private QuizQuestionDto genCircuitLength() {
        List<Circuit> circuits = circuitRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(c -> c.getLengthKm() != null && c.getName() != null)
            .collect(Collectors.toList());
        if (circuits.size() < 1) return null;

        Circuit target = circuits.get(random.nextInt(circuits.size()));
        double correct = target.getLengthKm().doubleValue();

        /* On génère 3 longueurs voisines (±0.3 à ±1.5 km) */
        Set<String> pool = new LinkedHashSet<>();
        String correctStr = String.format("%.3f", correct);
        pool.add(correctStr);
        int safety = 0;
        while (pool.size() < 4 && safety++ < 30) {
            double offset = (random.nextInt(12) + 3) / 10.0 * (random.nextBoolean() ? 1 : -1);
            double v = correct + offset;
            if (v > 1 && v < 15) {
                pool.add(String.format("%.3f", v));
            }
        }
        if (pool.size() < 4) return null;

        List<String> choices = new ArrayList<>(pool);
        Collections.shuffle(choices, random);

        return build(
            "Quelle est la longueur du circuit " + target.getName() + " ?",
            choices, correctStr,
            "Circuits",
            target.getCountry()
        );
    }

    /* 6. Nombre de titres de X ? */
    private QuizQuestionDto genDriverChampionships() {
        List<Driver> drivers = driverRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(d -> d.getWorldChampionships() != null
                      && d.getWorldChampionships() > 0
                      && d.getFirstName() != null)
            .collect(Collectors.toList());
        if (drivers.size() < 1) return null;

        Driver target = drivers.get(random.nextInt(drivers.size()));
        int correct = target.getWorldChampionships();
        String correctStr = String.valueOf(correct);

        List<String> choices = numericChoices(correct, 3, 0);
        if (!choices.contains(correctStr)) return null;

        return build(
            "Combien de titres mondiaux a " + fullName(target) + " ?",
            choices, correctStr,
            "Pilotes",
            null
        );
    }

    /* 7. Nombre de podiums de X ? */
    private QuizQuestionDto genDriverPodiums() {
        List<Driver> drivers = driverRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(d -> d.getPodiums() != null
                      && d.getPodiums() >= 5
                      && d.getFirstName() != null)
            .collect(Collectors.toList());
        if (drivers.size() < 1) return null;

        Driver target = drivers.get(random.nextInt(drivers.size()));
        int correct = target.getPodiums();
        String correctStr = String.valueOf(correct);

        List<String> choices = numericChoices(correct, Math.max(5, correct / 3), 1);
        if (!choices.contains(correctStr)) return null;

        return build(
            "Combien de podiums a " + fullName(target) + " en carrière ?",
            choices, correctStr,
            "Pilotes",
            null
        );
    }

    /* 8. Nombre de virages du circuit X ? */
    private QuizQuestionDto genCircuitTurns() {
        List<Circuit> circuits = circuitRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(c -> c.getNumberOfTurns() != null
                      && c.getNumberOfTurns() >= 5
                      && c.getName() != null)
            .collect(Collectors.toList());
        if (circuits.size() < 1) return null;

        Circuit target = circuits.get(random.nextInt(circuits.size()));
        int correct = target.getNumberOfTurns();
        String correctStr = String.valueOf(correct);

        List<String> choices = numericChoices(correct, 5, 3);
        if (!choices.contains(correctStr)) return null;

        return build(
            "Combien de virages comporte le circuit " + target.getName() + " ?",
            choices, correctStr,
            "Circuits",
            target.getCountry()
        );
    }

    /* 9. Année de début en F1 de X ? */
    private QuizQuestionDto genDriverDebutYear() {
        List<Driver> drivers = driverRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(d -> d.getDebutYear() != null
                      && d.getDebutYear() >= 1950
                      && d.getFirstName() != null)
            .collect(Collectors.toList());
        if (drivers.size() < 1) return null;

        Driver target = drivers.get(random.nextInt(drivers.size()));
        int correct = target.getDebutYear();
        String correctStr = String.valueOf(correct);

        List<String> choices = numericChoices(correct, 8, 1950);
        if (!choices.contains(correctStr)) return null;

        return build(
            "En quelle année " + fullName(target) + " a-t-il débuté en F1 ?",
            choices, correctStr,
            "Pilotes",
            null
        );
    }

    /* 10. Année de début en F1 de l'écurie X ? */
    private QuizQuestionDto genTeamFirstEntry() {
        List<Team> teams = teamRepo.findAll().stream()
            .filter(Objects::nonNull)
            .filter(t -> t.getFirstEntry() != null
                      && t.getFirstEntry() >= 1950
                      && t.getName() != null)
            .collect(Collectors.toList());
        if (teams.size() < 1) return null;

        Team target = teams.get(random.nextInt(teams.size()));
        int correct = target.getFirstEntry();
        String correctStr = String.valueOf(correct);

        List<String> choices = numericChoices(correct, 10, 1950);
        if (!choices.contains(correctStr)) return null;

        return build(
            "Quand l'écurie " + target.getName() + " a-t-elle fait ses débuts en F1 ?",
            choices, correctStr,
            "Écuries",
            target.getCountry()
        );
    }
}