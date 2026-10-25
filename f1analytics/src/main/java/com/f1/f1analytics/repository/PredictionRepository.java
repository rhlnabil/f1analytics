package com.f1.f1analytics.repository;

import com.f1.f1analytics.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    Optional<Prediction> findByUserIdAndRaceId(Long userId, Long raceId);

    List<Prediction> findByUserId(Long userId);

    List<Prediction> findByRaceId(Long raceId);

    @Query("""
        SELECT p FROM Prediction p
        WHERE p.race.id = :raceId
          AND p.pointsEarned IS NULL
    """)
    List<Prediction> findUnscoredByRace(@Param("raceId") Long raceId);

    @Query("""
        SELECT p.user.id, SUM(p.pointsEarned)
        FROM Prediction p
        WHERE p.pointsEarned IS NOT NULL
        GROUP BY p.user.id
        ORDER BY SUM(p.pointsEarned) DESC
    """)
    List<Object[]> findLeaderboardRaw();

    @Query("""
        SELECT COUNT(p)
        FROM Prediction p
        WHERE p.user.id = :userId
          AND p.pointsEarned = 38
    """)
    long countPerfectByUser(@Param("userId") Long userId);
}