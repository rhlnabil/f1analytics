package com.f1.f1analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerTimelineDto {
    private Integer season;
    private String teamName;
    private String teamColor;
    private Long localTeamId;
    private String teamLogoUrl;

    private Integer position;     // au championnat (null si pas classé)
    private Integer points;
    private Integer wins;
    private Integer podiums;
    private Integer poles;
    private Integer races;
}