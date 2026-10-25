package com.f1.f1analytics.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CircuitDto {
    private Long id;
    private String name;
    private String country;
    private String countryCode;
    private BigDecimal lengthKm;
    private String imageUrl;
    private String firstGrandPrix;
    private String fastestLapTime;
    private Double latitude;
    private Double longitude;
    private String architect;
    private String constructionCost;
    private Integer numberOfTurns;
}