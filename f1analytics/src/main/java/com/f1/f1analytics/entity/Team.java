package com.f1.f1analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "teams")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String name;

    private String country;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    private String color;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(name = "team_chief", length = 100)
    private String teamChief;

    @Column(name = "technical_chief", length = 100)
    private String technicalChief;

    @Column(length = 100)
    private String chassis;

    @Column(name = "power_unit", length = 100)
    private String powerUnit;

    @Column(name = "reserve_driver", length = 100)
    private String reserveDriver;

    @Column(name = "first_entry")
    private Integer firstEntry;

    @Column(name = "gp_entered")
    private Integer gpEntered;

    @Column(name = "team_points")
    private BigDecimal teamPoints;

    @Column(name = "highest_finish", length = 50)
    private String highestFinish;

    private Integer podiums;

    @Column(name = "highest_grid", length = 50)
    private String highestGrid;

    @Column(name = "pole_positions")
    private Integer polePositions;

    @Column(name = "world_championships")
    private Integer worldChampionships;
}