package com.f1.f1analytics.dto;

import lombok.*;

import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ConstructorStandingDto {
    private Integer position;
    private BigDecimal points;
    private Integer wins;

    // Écurie (données Jolpica)
    private String constructorId;
    private String name;
    private String nationality;

    // ✅ Enrichissement local
    private Long localTeamId;
    private String teamColor;
    private String teamLogoUrl;
}