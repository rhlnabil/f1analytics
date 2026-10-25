package com.f1.f1analytics.repository;

import com.f1.f1analytics.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResultRepository extends JpaRepository<Result, Long> {

    @Query("SELECT r FROM Result r JOIN FETCH r.race WHERE r.driver.id = :driverId")
    List<Result> findByDriverIdWithRace(@Param("driverId") Long driverId);

    /** ✅ NEW — évite le findAll() + filter en mémoire */
    @Query("SELECT r FROM Result r JOIN FETCH r.driver d LEFT JOIN FETCH d.team WHERE r.race.id = :raceId ORDER BY r.position ASC")
    List<Result> findByRaceIdWithDriverAndTeam(@Param("raceId") Long raceId);
}