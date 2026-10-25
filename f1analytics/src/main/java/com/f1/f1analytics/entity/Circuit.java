package com.f1.f1analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "circuits")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Circuit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String name;

    private String country;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "length_km")
    private BigDecimal lengthKm;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "first_grand_prix", length = 100)
    private String firstGrandPrix;

    @Column(name = "fastest_lap_time", length = 50)
    private String fastestLapTime;

    private Double latitude;
    private Double longitude;

    @Column(length = 150)
    private String architect;

    @Column(name = "construction_cost", length = 100)
    private String constructionCost;

    @Column(name = "number_of_turns")
    private Integer numberOfTurns;
}