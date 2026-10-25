package com.f1.f1analytics.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaderboardEntryDto {
    private Integer rank;
    private Long userId;
    private String username;
    private String avatarUrl;
    private Integer totalPoints;
    private Integer predictionsCount;
    private Integer perfectCount;
    private Boolean isCurrentUser;
}