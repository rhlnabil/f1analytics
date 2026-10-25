package com.f1.f1analytics.controller;

import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.repository.UserRepository;
import com.f1.f1analytics.security.CustomUserDetailsService;
import com.f1.f1analytics.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom RANDOM = new SecureRandom();

    /* ===================== LOGIN ===================== */
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest req) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.username(), req.password()));

        UserDetails user = userDetailsService.loadUserByUsername(req.username());
        String token = jwtService.generateToken(user);
        String role = user.getAuthorities().iterator().next().getAuthority();

        log.info("🔐 Login classique : {} → {}", user.getUsername(), role);

        return Map.of("token", token, "username", user.getUsername(), "role", role);
    }

    /* ===================== REGISTER ===================== */
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody RegisterRequest req) {
        if (req.username() == null || req.username().isBlank())
            throw new RuntimeException("Nom d'utilisateur obligatoire");
        if (req.username().length() < 3)
            throw new RuntimeException("Nom d'utilisateur : 3 caractères minimum");
        if (req.email() == null || req.email().isBlank())
            throw new RuntimeException("Email obligatoire");
        if (!req.email().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"))
            throw new RuntimeException("Format d'email invalide");
        if (req.password() == null || req.password().length() < 4)
            throw new RuntimeException("Mot de passe : 4 caractères minimum");
        if (userRepo.findByUsername(req.username()).isPresent())
            throw new RuntimeException("Ce nom d'utilisateur est déjà pris");
        if (userRepo.findByEmail(req.email()).isPresent())
            throw new RuntimeException("Cet email est déjà utilisé");

        // ✅ ROLE_FAN (au lieu de ROLE_USER) — nécessaire pour /api/fan/**
        User user = User.builder()
            .username(req.username())
            .password(passwordEncoder.encode(req.password()))
            .email(req.email())
            .role("ROLE_FAN")
            .build();
        userRepo.saveAndFlush(user);

        log.info("✨ Nouveau fan inscrit : {} ({})", user.getUsername(), user.getEmail());

        UserDetails details = userDetailsService.loadUserByUsername(req.username());
        String token = jwtService.generateToken(details);

        return Map.of("token", token, "username", details.getUsername(), "role", "ROLE_FAN");
    }

    /* ============================================================ */
    /* ============== ✨ QR ACCESS =============================== */
    /* ============================================================ */

    @GetMapping("/qr-token")
    public Map<String, String> getQrToken(Authentication auth) {
        User user = userRepo.findByUsername(auth.getName())
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (user.getQrToken() == null || user.getQrToken().isBlank()) {
            user.setQrToken(generateQrToken());
            userRepo.saveAndFlush(user);
            log.info("✨ Nouveau QR token généré pour {}", user.getUsername());
        }

        return Map.of("qrToken", user.getQrToken());
    }

    @PostMapping("/qr-token/regenerate")
    public Map<String, String> regenerateQrToken(Authentication auth) {
        User user = userRepo.findByUsername(auth.getName())
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        user.setQrToken(generateQrToken());
        userRepo.saveAndFlush(user);
        log.info("🔄 QR token régénéré pour {}", user.getUsername());

        return Map.of("qrToken", user.getQrToken());
    }

    @GetMapping("/qr-login")
    public Map<String, String> qrLogin(@RequestParam("token") String qrToken) {
        if (qrToken == null || qrToken.isBlank())
            throw new RuntimeException("QR token manquant");

        User user = userRepo.findByQrToken(qrToken)
            .orElseThrow(() -> new RuntimeException("QR token invalide ou révoqué"));

        UserDetails details = userDetailsService.loadUserByUsername(user.getUsername());
        String jwt = jwtService.generateToken(details);

        log.info("🎫 QR login réussi pour {} (rôle : {})", user.getUsername(), user.getRole());

        return Map.of(
            "token", jwt,
            "username", user.getUsername(),
            "role", user.getRole()
        );
    }

    /* ===================== HELPERS ===================== */

    private String generateQrToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record LoginRequest(String username, String password) {}
    public record RegisterRequest(String username, String email, String password) {}
}