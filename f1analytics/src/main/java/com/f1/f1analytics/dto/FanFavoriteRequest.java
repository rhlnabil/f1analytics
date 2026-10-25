package com.f1.f1analytics.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class FanFavoriteRequest {
    private Long teamId;
    private Long driverId;
}