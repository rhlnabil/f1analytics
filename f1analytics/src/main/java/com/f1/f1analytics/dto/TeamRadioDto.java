package com.f1.f1analytics.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TeamRadioDto {
    private Integer driverNumber;
    private String driverName;      // Nom du pilote (enrichi depuis notre DB)
    private String teamColor;       // Couleur de l'écurie (enrichie depuis notre DB)
    private LocalDateTime date;
    private String recordingUrl;    // Lien vers le fichier audio
}