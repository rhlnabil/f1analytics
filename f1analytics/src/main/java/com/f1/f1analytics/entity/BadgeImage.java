package com.f1.f1analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badge_images")
public class BadgeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "badge_id", unique = true, nullable = false, length = 50)
    private String badgeId;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /* ✅ Écurie associée au verso */
    @Column(name = "team_id")
    private Long teamId;

    /* ✅ Override de la rareté : common | rare | epic | legendary | mythic */
    @Column(name = "rarity_override", length = 20)
    private String rarityOverride;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BadgeImage() {}

    public BadgeImage(String badgeId, String imageUrl) {
        this.badgeId = badgeId;
        this.imageUrl = imageUrl;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBadgeId() { return badgeId; }
    public void setBadgeId(String badgeId) { this.badgeId = badgeId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public String getRarityOverride() { return rarityOverride; }
    public void setRarityOverride(String rarityOverride) { this.rarityOverride = rarityOverride; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}