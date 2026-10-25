package com.f1.f1analytics.repository;

import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUser(User user);

    List<UserBadge> findByUserId(Long userId);

    boolean existsByUserAndBadgeId(User user, String badgeId);

    long countByUser(User user);

    @Transactional
    void deleteByUser(User user);
}