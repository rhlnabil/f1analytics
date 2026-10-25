package com.f1.f1analytics.repository;

import com.f1.f1analytics.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {

    // ✅ Vérifications directes en DB (pas de cache)
    Optional<Race> findBySeasonAndRound(Integer season, Integer round);
    boolean existsBySeasonAndRound(Integer season, Integer round);
}