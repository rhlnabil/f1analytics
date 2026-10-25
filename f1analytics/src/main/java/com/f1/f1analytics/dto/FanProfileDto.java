package com.f1.f1analytics.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FanProfileDto {
    private Long id;
    private String username;
    private String role;
    private String email;
    private String avatarUrl;

    // ===== Écurie favorite =====
    private Long favoriteTeamId;
    private String favoriteTeamName;
    private String favoriteTeamFullName;
    private String favoriteTeamColor;
    private String favoriteTeamLogoUrl;
    private String favoriteTeamCountry;
    private String favoriteTeamCountryCode;
    private Integer favoriteTeamFirstEntry;
    private Integer favoriteTeamWorldChampionships;

    // ===== Pilote favori =====
    private Long favoriteDriverId;
    private String favoriteDriverFirstName;
    private String favoriteDriverLastName;
    private String favoriteDriverNumber;
    private String favoriteDriverPhotoUrl;
    private String favoriteDriverTransitionPhotoUrl;
    private String favoriteDriverActionPhotoUrl;   // ✅ NOUVEAU
    private String favoriteDriverSignatureUrl;
    private String favoriteDriverCountryCode;
    private String favoriteDriverNationality;
}