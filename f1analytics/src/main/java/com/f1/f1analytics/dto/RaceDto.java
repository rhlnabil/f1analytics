package com.f1.f1analytics.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RaceDto {
    private Long id;
    private Integer season;
    private Integer round;
    private String name;
    private LocalDate raceDate;

    // Circuit (aplati pour le front)
    private Long circuitId;
    private String circuitName;
    private String circuitCountry;
    private String circuitCountryCode;      // ✅ NEW — pour les drapeaux
    private BigDecimal circuitLengthKm;
}