package com.f1.f1analytics.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PredictionDto {

    private Long id;

    // Race info
    private Long raceId;
    private String raceName;
    private Integer raceSeason;
    private Integer raceRound;
    private LocalDate raceDate;
    private String circuitName;
    private String circuitCountryCode;

    // Status
    private Boolean isLocked;
    private Boolean isScored;
    private Integer pointsEarned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // P1 predicted
    private Long p1DriverId;
    private String p1DriverName;
    private String p1DriverCode;
    private String p1DriverPhotoUrl;
    private String p1TeamColor;
    private String p1TeamLogoUrl;
    private String p1CountryCode;

    // P2 predicted
    private Long p2DriverId;
    private String p2DriverName;
    private String p2DriverCode;
    private String p2DriverPhotoUrl;
    private String p2TeamColor;
    private String p2TeamLogoUrl;
    private String p2CountryCode;

    // P3 predicted
    private Long p3DriverId;
    private String p3DriverName;
    private String p3DriverCode;
    private String p3DriverPhotoUrl;
    private String p3TeamColor;
    private String p3TeamLogoUrl;
    private String p3CountryCode;

    // Actual results (si scoré)
    private Long actualP1DriverId;
    private String actualP1DriverName;
    private Boolean p1Correct;

    private Long actualP2DriverId;
    private String actualP2DriverName;
    private Boolean p2Correct;

    private Long actualP3DriverId;
    private String actualP3DriverName;
    private Boolean p3Correct;

    private Boolean perfect; // 3/3
}