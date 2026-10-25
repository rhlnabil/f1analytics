package com.f1.f1analytics.dto;

import lombok.*;

import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverStandingDto {
    private Integer position;
    private BigDecimal points;
    private Integer wins;

    // Pilote (données Jolpica)
    private String driverId;           // ex: "max_verstappen"
    private String code;               // ex: "VER"
    private String firstName;
    private String lastName;
    private String number;
    private String nationality;

    // Écurie (données Jolpica)
    private String constructorId;
    private String constructorName;

    // ✅ Enrichissement depuis ta table Team locale
    private Long localTeamId;
    private String teamColor;
    private String teamLogoUrl;

    // ✅ Enrichissement depuis ta table Driver locale
    private Long localDriverId;
    private String photoUrl;
}