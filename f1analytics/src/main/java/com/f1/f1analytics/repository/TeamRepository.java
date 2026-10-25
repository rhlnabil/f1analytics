package com.f1.f1analytics.repository;

import com.f1.f1analytics.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {}