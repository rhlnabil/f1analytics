package com.f1.f1analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_badges",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_badge",
        columnNames = {"user_id", "badge_id"}
    ),
    indexes = {
        @Index(name = "idx_user_badge_user", columnList = "user_id")
    }
)
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_user_badge_user"))
    private User user;

    @Column(name = "badge_id", nullable = false, length = 50)
    private String badgeId;

    @Column(name = "unlocked_at", nullable = false)
    private LocalDateTime unlockedAt = LocalDateTime.now();

    public UserBadge() {}

    public UserBadge(User user, String badgeId) {
        this.user = user;
        this.badgeId = badgeId;
        this.unlockedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getBadgeId() { return badgeId; }
    public void setBadgeId(String badgeId) { this.badgeId = badgeId; }

    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
}