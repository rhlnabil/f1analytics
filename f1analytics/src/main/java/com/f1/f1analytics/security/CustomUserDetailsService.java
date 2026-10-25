package com.f1.f1analytics.security;

import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User u = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur inconnu : " + username));

        // ✅ LOG DIAGNOSTIC — permet de voir immédiatement le rôle chargé
        log.info("🔑 loadUserByUsername : username={} role={}", username, u.getRole());

        // ✅ Sécurité : si l'ancien ROLE_USER traîne encore, on le corrige
        String effectiveRole = u.getRole();
        if ("ROLE_USER".equals(effectiveRole) || "USER".equals(effectiveRole)) {
            effectiveRole = "ROLE_FAN";
            u.setRole("ROLE_FAN");
            userRepository.save(u);
            log.warn("⚠️ Rôle corrigé automatiquement {} → ROLE_FAN pour {}",
                     u.getRole(), username);
        }

        // Password peut être null pour OAuth — utilise un placeholder
        String pwd = u.getPassword() != null ? u.getPassword() : "{noop}oauth-no-password";

        return org.springframework.security.core.userdetails.User
            .withUsername(u.getUsername())
            .password(pwd)
            .authorities(effectiveRole)
            .build();
    }
}