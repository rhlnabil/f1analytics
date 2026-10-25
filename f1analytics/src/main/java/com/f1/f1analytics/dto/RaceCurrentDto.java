package com.f1.f1analytics.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RaceCurrentDto {

    private String status;              // "live" | "upcoming" | "finished" | "none"
    private RaceInfoDto race;           // La course concernée
    private Long daysUntil;             // Si upcoming : jours avant
    private List<RaceResultDto> podium; // Si finished : le podium

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RaceInfoDto {
        private Long id;
        private String name;
        private Integer round;
        private Integer season;
        private LocalDate raceDate;
        private String circuitName;
        private String circuitCountryCode;
    }
}