package com.f1.f1analytics.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SeasonStatsDto {
    private Integer season;
    private Integer races;
    private Integer wins;
    private Integer podiums;
    private Integer pointsFinishes;
    private Integer dnfs;
    private Integer points;

    private Double winRate;
    private Double podiumRate;
    private Double pointsRate;
    private Double dnfRate;
}