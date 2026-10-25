package com.f1.f1analytics.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverDto {
    private Long id;
    private String externalId;

    private String firstName;
    private String lastName;
    private Integer number;
    private String nationality;
    private String countryCode;
    private Integer birthYear;
    private String birthCity;
    private Double latitude;
    private Double longitude;
    private Integer debutYear;
    private String photoUrl;
    private String transitionPhotoUrl;
    private String actionPhotoUrl;
    private String aboutPhotoUrl;
    private String biography;
    private String gallery;
    private String quote;
    private String quoteAuthor;
    private String favoriteTrack;
    private String favoriteTrackImage;
    private String favoriteTrackDescription;
    private String helmetImage;
    private String signatureImage;

    private Integer gpEntered;
    private BigDecimal careerPoints;
    private String highestFinish;
    private Integer podiums;
    private String highestGrid;
    private Integer polePositions;
    private Integer worldChampionships;
    private Integer dnfs;

    private Long teamId;
    private String teamName;
    private String teamColor;
    private String teamLogoUrl;
}