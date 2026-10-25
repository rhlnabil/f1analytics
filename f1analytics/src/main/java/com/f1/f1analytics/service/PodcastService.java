package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.RaceResultDto;
import com.f1.f1analytics.entity.Race;
import com.f1.f1analytics.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PodcastService {

    private final RaceRepository raceRepo;
    private final RaceResultService raceResultService;

    /* ✅ Point d'entrée : lang = fr, en, es, it, ar */
    @Transactional(readOnly = true)
    public String generateScript(Long raceId, String lang) {
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new RuntimeException("Course introuvable"));

        List<RaceResultDto> results = raceResultService.getResultsByRaceId(raceId);
        if (results.size() < 3) return "";

        String l = (lang == null ? "fr" : lang.toLowerCase().trim());
        return switch (l) {
            case "en" -> buildEnglish(race, results);
            case "es" -> buildSpanish(race, results);
            case "it" -> buildItalian(race, results);
            case "ar" -> buildArabic(race, results);
            default -> buildFrench(race, results);
        };
    }

    /* ============================================================ */
    /* ============ FRANÇAIS ===================================== */
    /* ============================================================ */
    private String buildFrench(Race race, List<RaceResultDto> r) {
        RaceResultDto p1 = r.get(0), p2 = r.get(1), p3 = r.get(2);
        RaceResultDto fastest = r.stream()
            .filter(x -> Boolean.TRUE.equals(x.getIsFastestLap()))
            .findFirst().orElse(null);

        StringBuilder sb = new StringBuilder();
        sb.append("Bienvenue sur F1 Analytics, votre résumé audio de la course. ");
        sb.append("Aujourd'hui, le ").append(race.getName())
          .append(", manche numéro ").append(race.getRound())
          .append(" de la saison ").append(race.getSeason()).append(". ");

        if (race.getCircuit() != null) {
            sb.append("La course s'est déroulée sur le ").append(race.getCircuit().getName());
            if (race.getCircuit().getLengthKm() != null) {
                sb.append(", long de ").append(race.getCircuit().getLengthKm()).append(" kilomètres");
            }
            if (race.getCircuit().getNumberOfTurns() != null) {
                sb.append(", avec ").append(race.getCircuit().getNumberOfTurns()).append(" virages");
            }
            sb.append(". ");
        }

        sb.append("Au terme de la course, c'est ")
          .append(name(p1)).append(" qui s'impose");
        if (p1.getConstructorName() != null) {
            sb.append(" au volant de sa ").append(p1.getConstructorName());
        }
        sb.append(", devant ").append(name(p2)).append(" et ").append(name(p3)).append(". ");

        if (fastest != null && fastest.getFastestLapTime() != null) {
            sb.append("Le meilleur tour en course est signé ").append(name(fastest))
              .append(", en ").append(fastest.getFastestLapTime());
            if (fastest.getFastestLapLap() != null) {
                sb.append(", au ").append(fastest.getFastestLapLap()).append("ème tour");
            }
            sb.append(". ");
        }

        sb.append("Merci d'avoir écouté F1 Analytics. Rendez-vous au prochain Grand Prix.");
        return sb.toString();
    }

    /* ============================================================ */
    /* ============ ENGLISH ====================================== */
    /* ============================================================ */
    private String buildEnglish(Race race, List<RaceResultDto> r) {
        RaceResultDto p1 = r.get(0), p2 = r.get(1), p3 = r.get(2);
        RaceResultDto fastest = r.stream()
            .filter(x -> Boolean.TRUE.equals(x.getIsFastestLap()))
            .findFirst().orElse(null);

        StringBuilder sb = new StringBuilder();
        sb.append("Welcome to F1 Analytics, your audio race recap. ");
        sb.append("Today, the ").append(race.getName())
          .append(", round ").append(race.getRound())
          .append(" of the ").append(race.getSeason()).append(" season. ");

        if (race.getCircuit() != null) {
            sb.append("The race took place at the ").append(race.getCircuit().getName());
            if (race.getCircuit().getLengthKm() != null) {
                sb.append(", ").append(race.getCircuit().getLengthKm()).append(" kilometers long");
            }
            if (race.getCircuit().getNumberOfTurns() != null) {
                sb.append(", with ").append(race.getCircuit().getNumberOfTurns()).append(" corners");
            }
            sb.append(". ");
        }

        sb.append("At the end of the race, ").append(name(p1)).append(" takes the win");
        if (p1.getConstructorName() != null) {
            sb.append(" for ").append(p1.getConstructorName());
        }
        sb.append(", ahead of ").append(name(p2)).append(" and ").append(name(p3)).append(". ");

        if (fastest != null && fastest.getFastestLapTime() != null) {
            sb.append("The fastest lap was set by ").append(name(fastest))
              .append(", in ").append(fastest.getFastestLapTime());
            if (fastest.getFastestLapLap() != null) {
                sb.append(", on lap ").append(fastest.getFastestLapLap());
            }
            sb.append(". ");
        }

        sb.append("Thank you for listening to F1 Analytics. See you at the next Grand Prix.");
        return sb.toString();
    }

    /* ============================================================ */
    /* ============ ESPAÑOL ====================================== */
    /* ============================================================ */
    private String buildSpanish(Race race, List<RaceResultDto> r) {
        RaceResultDto p1 = r.get(0), p2 = r.get(1), p3 = r.get(2);
        RaceResultDto fastest = r.stream()
            .filter(x -> Boolean.TRUE.equals(x.getIsFastestLap()))
            .findFirst().orElse(null);

        StringBuilder sb = new StringBuilder();
        sb.append("Bienvenidos a F1 Analytics, su resumen de audio de la carrera. ");
        sb.append("Hoy, el ").append(race.getName())
          .append(", ronda número ").append(race.getRound())
          .append(" de la temporada ").append(race.getSeason()).append(". ");

        if (race.getCircuit() != null) {
            sb.append("La carrera se disputó en el ").append(race.getCircuit().getName());
            if (race.getCircuit().getLengthKm() != null) {
                sb.append(", de ").append(race.getCircuit().getLengthKm()).append(" kilómetros");
            }
            if (race.getCircuit().getNumberOfTurns() != null) {
                sb.append(", con ").append(race.getCircuit().getNumberOfTurns()).append(" curvas");
            }
            sb.append(". ");
        }

        sb.append("Al final de la carrera, ").append(name(p1)).append(" se lleva la victoria");
        if (p1.getConstructorName() != null) {
            sb.append(" al volante de su ").append(p1.getConstructorName());
        }
        sb.append(", por delante de ").append(name(p2)).append(" y ").append(name(p3)).append(". ");

        if (fastest != null && fastest.getFastestLapTime() != null) {
            sb.append("La vuelta rápida fue para ").append(name(fastest))
              .append(", en ").append(fastest.getFastestLapTime());
            if (fastest.getFastestLapLap() != null) {
                sb.append(", en la vuelta ").append(fastest.getFastestLapLap());
            }
            sb.append(". ");
        }

        sb.append("Gracias por escuchar F1 Analytics. Nos vemos en el próximo Gran Premio.");
        return sb.toString();
    }

    /* ============================================================ */
    /* ============ ITALIANO ===================================== */
    /* ============================================================ */
    private String buildItalian(Race race, List<RaceResultDto> r) {
        RaceResultDto p1 = r.get(0), p2 = r.get(1), p3 = r.get(2);
        RaceResultDto fastest = r.stream()
            .filter(x -> Boolean.TRUE.equals(x.getIsFastestLap()))
            .findFirst().orElse(null);

        StringBuilder sb = new StringBuilder();
        sb.append("Benvenuti su F1 Analytics, il vostro riepilogo audio della gara. ");
        sb.append("Oggi, il ").append(race.getName())
          .append(", round numero ").append(race.getRound())
          .append(" della stagione ").append(race.getSeason()).append(". ");

        if (race.getCircuit() != null) {
            sb.append("La gara si è svolta sul ").append(race.getCircuit().getName());
            if (race.getCircuit().getLengthKm() != null) {
                sb.append(", lungo ").append(race.getCircuit().getLengthKm()).append(" chilometri");
            }
            if (race.getCircuit().getNumberOfTurns() != null) {
                sb.append(", con ").append(race.getCircuit().getNumberOfTurns()).append(" curve");
            }
            sb.append(". ");
        }

        sb.append("Al termine della gara, è ").append(name(p1)).append(" a vincere");
        if (p1.getConstructorName() != null) {
            sb.append(" al volante della sua ").append(p1.getConstructorName());
        }
        sb.append(", davanti a ").append(name(p2)).append(" e ").append(name(p3)).append(". ");

        if (fastest != null && fastest.getFastestLapTime() != null) {
            sb.append("Il giro più veloce è stato di ").append(name(fastest))
              .append(", in ").append(fastest.getFastestLapTime());
            if (fastest.getFastestLapLap() != null) {
                sb.append(", al giro ").append(fastest.getFastestLapLap());
            }
            sb.append(". ");
        }

        sb.append("Grazie per aver ascoltato F1 Analytics. Ci vediamo al prossimo Gran Premio.");
        return sb.toString();
    }

    /* ============================================================ */
    /* ============ العربية ======================================= */
    /* ============================================================ */
    private String buildArabic(Race race, List<RaceResultDto> r) {
        RaceResultDto p1 = r.get(0), p2 = r.get(1), p3 = r.get(2);
        RaceResultDto fastest = r.stream()
            .filter(x -> Boolean.TRUE.equals(x.getIsFastestLap()))
            .findFirst().orElse(null);

        StringBuilder sb = new StringBuilder();
        sb.append("مرحبًا بكم في F1 Analytics، ملخصكم الصوتي للسباق. ");
        sb.append("اليوم، ").append(race.getName())
          .append("، الجولة رقم ").append(race.getRound())
          .append(" من موسم ").append(race.getSeason()).append(". ");

        if (race.getCircuit() != null) {
            sb.append("أقيم السباق على ").append(race.getCircuit().getName());
            if (race.getCircuit().getLengthKm() != null) {
                sb.append("، بطول ").append(race.getCircuit().getLengthKm()).append(" كيلومتر");
            }
            if (race.getCircuit().getNumberOfTurns() != null) {
                sb.append("، مع ").append(race.getCircuit().getNumberOfTurns()).append(" منعطفًا");
            }
            sb.append(". ");
        }

        sb.append("في نهاية السباق، فاز ").append(name(p1));
        if (p1.getConstructorName() != null) {
            sb.append(" على متن ").append(p1.getConstructorName());
        }
        sb.append("، متقدمًا على ").append(name(p2)).append(" و ").append(name(p3)).append(". ");

        if (fastest != null && fastest.getFastestLapTime() != null) {
            sb.append("أسرع لفة كانت لـ ").append(name(fastest))
              .append("، بزمن ").append(fastest.getFastestLapTime());
            if (fastest.getFastestLapLap() != null) {
                sb.append("، في اللفة ").append(fastest.getFastestLapLap());
            }
            sb.append(". ");
        }

        sb.append("شكرًا لاستماعكم إلى F1 Analytics. نراكم في الجائزة الكبرى القادمة.");
        return sb.toString();
    }

    /* ============================================================ */
    /* ============ HELPER ======================================= */
    /* ============================================================ */
    private String name(RaceResultDto r) {
        StringBuilder sb = new StringBuilder();
        if (r.getDriverFirstName() != null) sb.append(r.getDriverFirstName()).append(" ");
        if (r.getDriverLastName() != null) sb.append(r.getDriverLastName());
        return sb.toString().trim();
    }
}