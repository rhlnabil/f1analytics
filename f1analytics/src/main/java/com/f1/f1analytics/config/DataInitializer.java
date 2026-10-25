package com.f1.f1analytics.config;

import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .role("ROLE_ADMIN")
                .build();
            userRepository.save(admin);
            log.info("✅ Admin créé : admin / admin123");
        } else {
            log.info("ℹ️ Admin déjà présent");
        }

        if (userRepository.findByUsername("user").isEmpty()) {
            // ✅ ROLE_FAN (au lieu de ROLE_USER) pour accéder à /api/fan/**
            User user = User.builder()
                .username("user")
                .password(passwordEncoder.encode("user123"))
                .role("ROLE_FAN")
                .build();
            userRepository.save(user);
            log.info("✅ User créé : user / user123 (ROLE_FAN)");
        } else {
            // ✅ Migration : si le user existe déjà avec ROLE_USER, on corrige
            userRepository.findByUsername("user").ifPresent(u -> {
                if ("ROLE_USER".equals(u.getRole())) {
                    u.setRole("ROLE_FAN");
                    userRepository.save(u);
                    log.info("🔧 Rôle 'user' migré ROLE_USER → ROLE_FAN");
                }
            });
        }

        // ✅ Migration globale : tous les ROLE_USER → ROLE_FAN
        int migrated = 0;
        for (User u : userRepository.findAll()) {
            if ("ROLE_USER".equals(u.getRole())) {
                u.setRole("ROLE_FAN");
                userRepository.save(u);
                migrated++;
                log.info("🔧 Migration {} → ROLE_FAN", u.getUsername());
            }
        }
        if (migrated > 0) {
            log.info("✅ {} utilisateur(s) migré(s) de ROLE_USER vers ROLE_FAN", migrated);
        }
    }
}