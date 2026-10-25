package com.f1.f1analytics.repository;

import com.f1.f1analytics.entity.BadgeImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;


public interface BadgeImageRepository extends JpaRepository<BadgeImage, Long> {

    Optional<BadgeImage> findByBadgeId(String badgeId);

    boolean existsByBadgeId(String badgeId);

    void deleteByBadgeId(String badgeId);
}