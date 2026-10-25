package com.f1.f1analytics.service;

import com.f1.f1analytics.dto.FanFavoriteRequest;
import com.f1.f1analytics.dto.FanProfileDto;
import com.f1.f1analytics.entity.Driver;
import com.f1.f1analytics.entity.Team;
import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.repository.DriverRepository;
import com.f1.f1analytics.repository.TeamRepository;
import com.f1.f1analytics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FanService {

    private final UserRepository userRepo;
    private final TeamRepository teamRepo;
    private final DriverRepository driverRepo;

    @Transactional(readOnly = true)
    public FanProfileDto getProfile(String username) {
        User u = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + username));
        return toDto(u);
    }

    @Transactional
    public FanProfileDto updateFavorites(String username, FanFavoriteRequest req) {
        User u = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + username));

        // Écurie
        if (req.getTeamId() != null) {
            Team t = teamRepo.findById(req.getTeamId())
                .orElseThrow(() -> new RuntimeException("Écurie " + req.getTeamId() + " introuvable"));
            u.setFavoriteTeam(t);
        } else {
            u.setFavoriteTeam(null);
        }

        // Pilote
        if (req.getDriverId() != null) {
            Driver d = driverRepo.findById(req.getDriverId())
                .orElseThrow(() -> new RuntimeException("Pilote " + req.getDriverId() + " introuvable"));
            u.setFavoriteDriver(d);
        } else {
            u.setFavoriteDriver(null);
        }

        userRepo.saveAndFlush(u);
        return toDto(u);
    }

    @Transactional
    public FanProfileDto clearFavorites(String username) {
        User u = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + username));
        u.setFavoriteTeam(null);
        u.setFavoriteDriver(null);
        userRepo.saveAndFlush(u);
        return toDto(u);
    }

    private FanProfileDto toDto(User u) {
        Team t = u.getFavoriteTeam();
        Driver d = u.getFavoriteDriver();

        return FanProfileDto.builder()
            .id(u.getId())
            .username(u.getUsername())
            .role(u.getRole())
            .email(u.getEmail())
            .avatarUrl(u.getAvatarUrl())

            // Écurie
            .favoriteTeamId(t != null ? t.getId() : null)
            .favoriteTeamName(t != null ? t.getName() : null)
            .favoriteTeamFullName(t != null ? t.getFullName() : null)
            .favoriteTeamColor(t != null ? t.getColor() : null)
            .favoriteTeamLogoUrl(t != null ? t.getLogoUrl() : null)
            .favoriteTeamCountry(t != null ? t.getCountry() : null)
            .favoriteTeamCountryCode(t != null ? t.getCountryCode() : null)
            .favoriteTeamFirstEntry(t != null ? t.getFirstEntry() : null)
            .favoriteTeamWorldChampionships(t != null ? t.getWorldChampionships() : null)

            // Pilote
            .favoriteDriverId(d != null ? d.getId() : null)
            .favoriteDriverFirstName(d != null ? d.getFirstName() : null)
            .favoriteDriverLastName(d != null ? d.getLastName() : null)
            .favoriteDriverNumber(d != null && d.getNumber() != null ? String.valueOf(d.getNumber()) : null)
            .favoriteDriverPhotoUrl(d != null ? d.getPhotoUrl() : null)
            .favoriteDriverTransitionPhotoUrl(d != null ? d.getTransitionPhotoUrl() : null)
            .favoriteDriverActionPhotoUrl(d != null ? d.getActionPhotoUrl() : null)   // ✅ NOUVEAU
            .favoriteDriverSignatureUrl(d != null ? d.getSignatureImage() : null)
            .favoriteDriverCountryCode(d != null ? d.getCountryCode() : null)
            .favoriteDriverNationality(d != null ? d.getNationality() : null)
            .build();
    }
}