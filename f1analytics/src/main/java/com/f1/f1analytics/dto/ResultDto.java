package com.f1.f1analytics.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ResultDto {
    private Long id;

    // Course
    private Long raceId;
    private String raceName;
    private Integer raceSeason;
    private Integer raceRound;
    private LocalDate raceDate;

    // Pilote
    private Long driverId;
    private String driverName;
    private String driverNumber;
    private String driverCountryCode;

    // Écurie (via le pilote)
    private Long teamId;
    private String teamName;
    private String teamColor;
    private String teamLogoUrl;

    // Résultat
    private Integer position;
    private BigDecimal points;
    private Boolean fastestLap;
}