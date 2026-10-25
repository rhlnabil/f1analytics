package com.f1.f1analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "drivers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "external_id", length = 100)
    private String externalId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private Integer number;
    private String nationality;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Column(name = "birth_city", length = 120)
    private String birthCity;

    private Double latitude;
    private Double longitude;

    @Column(name = "debut_year")
    private Integer debutYear;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "transition_photo_url", length = 500)
    private String transitionPhotoUrl;

    @Column(name = "action_photo_url", length = 500)
    private String actionPhotoUrl;

    @Column(name = "about_photo_url", length = 500)
    private String aboutPhotoUrl;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @Column(columnDefinition = "TEXT")
    private String gallery;

    @Column(columnDefinition = "TEXT")
    private String quote;

    @Column(name = "quote_author", length = 100)
    private String quoteAuthor;

    @Column(name = "favorite_track", length = 200)
    private String favoriteTrack;

    @Column(name = "favorite_track_image", length = 500)
    private String favoriteTrackImage;

    @Column(name = "favorite_track_description", columnDefinition = "TEXT")
    private String favoriteTrackDescription;

    @Column(name = "helmet_image", length = 500)
    private String helmetImage;

    @Column(name = "signature_image", length = 500)
    private String signatureImage;

    @Column(name = "gp_entered")
    private Integer gpEntered;

    @Column(name = "career_points")
    private BigDecimal careerPoints;

    @Column(name = "highest_finish", length = 50)
    private String highestFinish;

    private Integer podiums;

    @Column(name = "highest_grid", length = 50)
    private String highestGrid;

    @Column(name = "pole_positions")
    private Integer polePositions;

    @Column(name = "world_championships")
    private Integer worldChampionships;

    private Integer dnfs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}