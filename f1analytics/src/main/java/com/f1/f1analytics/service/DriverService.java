package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.DriverDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository repo;
    private final TeamRepository teamRepo;

    @Transactional(readOnly = true)
    public List<DriverDto> findAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<DriverDto> findById(Long id) {
        return repo.findById(id).map(this::toDto);
    }

    @Transactional
    public DriverDto create(DriverDto dto) {
        Driver d = new Driver();
        apply(d, dto);
        Driver saved = repo.saveAndFlush(d);
        return toDto(saved);
    }

    @Transactional
    public DriverDto update(Long id, DriverDto dto) {
        Driver d = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Driver " + id + " introuvable"));
        apply(d, dto);
        Driver saved = repo.saveAndFlush(d);
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void apply(Driver d, DriverDto dto) {
        d.setExternalId(dto.getExternalId());
        d.setFirstName(dto.getFirstName());
        d.setLastName(dto.getLastName());
        d.setNumber(dto.getNumber());
        d.setNationality(dto.getNationality());
        d.setCountryCode(dto.getCountryCode());
        d.setBirthYear(dto.getBirthYear());
        d.setBirthCity(dto.getBirthCity());
        d.setLatitude(dto.getLatitude());
        d.setLongitude(dto.getLongitude());
        d.setDebutYear(dto.getDebutYear());
        d.setPhotoUrl(dto.getPhotoUrl());
        d.setTransitionPhotoUrl(dto.getTransitionPhotoUrl());
        d.setActionPhotoUrl(dto.getActionPhotoUrl());
        d.setAboutPhotoUrl(dto.getAboutPhotoUrl());
        d.setBiography(dto.getBiography());
        d.setGallery(dto.getGallery());
        d.setQuote(dto.getQuote());
        d.setQuoteAuthor(dto.getQuoteAuthor());
        d.setFavoriteTrack(dto.getFavoriteTrack());
        d.setFavoriteTrackImage(dto.getFavoriteTrackImage());
        d.setFavoriteTrackDescription(dto.getFavoriteTrackDescription());
        d.setHelmetImage(dto.getHelmetImage());
        d.setSignatureImage(dto.getSignatureImage());
        d.setGpEntered(dto.getGpEntered());
        d.setCareerPoints(dto.getCareerPoints());
        d.setHighestFinish(dto.getHighestFinish());
        d.setPodiums(dto.getPodiums());
        d.setHighestGrid(dto.getHighestGrid());
        d.setPolePositions(dto.getPolePositions());
        d.setWorldChampionships(dto.getWorldChampionships());
        d.setDnfs(dto.getDnfs());

        if (dto.getTeamId() != null) {
            Team t = teamRepo.findById(dto.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team " + dto.getTeamId() + " introuvable"));
            d.setTeam(t);
        } else {
            d.setTeam(null);
        }
    }

    private DriverDto toDto(Driver d) {
        return DriverDto.builder()
            .id(d.getId())
            .externalId(d.getExternalId())
            .firstName(d.getFirstName())
            .lastName(d.getLastName())
            .number(d.getNumber())
            .nationality(d.getNationality())
            .countryCode(d.getCountryCode())
            .birthYear(d.getBirthYear())
            .birthCity(d.getBirthCity())
            .latitude(d.getLatitude())
            .longitude(d.getLongitude())
            .debutYear(d.getDebutYear())
            .photoUrl(d.getPhotoUrl())
            .transitionPhotoUrl(d.getTransitionPhotoUrl())
            .actionPhotoUrl(d.getActionPhotoUrl())
            .aboutPhotoUrl(d.getAboutPhotoUrl())
            .biography(d.getBiography())
            .gallery(d.getGallery())
            .quote(d.getQuote())
            .quoteAuthor(d.getQuoteAuthor())
            .favoriteTrack(d.getFavoriteTrack())
            .favoriteTrackImage(d.getFavoriteTrackImage())
            .favoriteTrackDescription(d.getFavoriteTrackDescription())
            .helmetImage(d.getHelmetImage())
            .signatureImage(d.getSignatureImage())
            .gpEntered(d.getGpEntered())
            .careerPoints(d.getCareerPoints())
            .highestFinish(d.getHighestFinish())
            .podiums(d.getPodiums())
            .highestGrid(d.getHighestGrid())
            .polePositions(d.getPolePositions())
            .worldChampionships(d.getWorldChampionships())
            .dnfs(d.getDnfs())
            .teamId(d.getTeam() != null ? d.getTeam().getId() : null)
            .teamName(d.getTeam() != null ? d.getTeam().getName() : null)
            .teamColor(d.getTeam() != null ? d.getTeam().getColor() : null)
            .teamLogoUrl(d.getTeam() != null ? d.getTeam().getLogoUrl() : null)
            .build();
    }
}