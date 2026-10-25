package com.f1.f1analytics.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamDto {
    private Long id;
    private String name;
    private String country;
    private String countryCode;
    private String color;
    private String logoUrl;

    private String fullName;
    private String teamChief;
    private String technicalChief;
    private String chassis;
    private String powerUnit;
    private String reserveDriver;
    private Integer firstEntry;

    private Integer gpEntered;
    private BigDecimal teamPoints;
    private String highestFinish;
    private Integer podiums;
    private String highestGrid;
    private Integer polePositions;
    private Integer worldChampionships;
}