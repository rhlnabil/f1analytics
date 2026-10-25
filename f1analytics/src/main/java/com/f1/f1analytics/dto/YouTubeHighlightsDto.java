package com.f1.f1analytics.dto;

import lombok.*;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class YouTubeHighlightsDto {

    private boolean available;       // false si pas de vidéo trouvée
    private String videoId;          // ID YouTube du highlight principal
    private String title;            // Titre de la vidéo
    private String thumbnail;        // URL de la vignette (maxres ou hd)
    private String publishedAt;      // Date de publication ISO
    private String channelTitle;     // "FORMULA 1"
    private String embedUrl;         // https://www.youtube.com/embed/{id}
    private String watchUrl;         // https://www.youtube.com/watch?v={id}

    private List<HighlightDto> alternatives;   // 2-3 autres vidéos liées

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class HighlightDto {
        private String videoId;
        private String title;
        private String thumbnail;
        private String publishedAt;
        private String embedUrl;
        private String watchUrl;
    }
}