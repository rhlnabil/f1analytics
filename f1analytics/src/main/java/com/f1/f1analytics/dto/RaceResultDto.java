package com.f1.f1analytics.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RaceResultDto {

    // Position
    private Integer position;
    private String positionText;

    // Pilote
    private String driverId;
    private String driverCode;
    private String driverFirstName;
    private String driverLastName;
    private String driverNumber;
    private String driverNationality;
    private String driverCountryCode;
    private String driverPhotoUrl;
    private Long localDriverId;

    // Écurie
    private String constructorId;
    private String constructorName;
    private Long localTeamId;
    private String teamColor;
    private String teamLogoUrl;

    // Résultat
    private Integer points;
    private Integer laps;
    private String status;
    private Integer grid;

    // Fastest lap
    private Boolean isFastestLap;
    private String fastestLapTime;
    private Integer fastestLapRank;
    private Integer fastestLapLap;
}