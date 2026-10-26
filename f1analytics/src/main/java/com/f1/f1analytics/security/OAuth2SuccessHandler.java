package com.f1.f1analytics.security;

import com.f1.f1analytics.entity.User;
import com.f1.f1analytics.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final Environment env;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ============================================================
    // ✅ DIAGNOSTIC — log au démarrage pour vérifier la valeur lue
    // ============================================================
    @PostConstruct
    public void logConfig() {
        log.info("========================================================");
        log.info("[OAuth2] ✅ frontendUrl (from @Value)  = {}", frontendUrl);
        log.info("[OAuth2] ✅ APP_FRONTEND_URL (from env) = {}", env.getProperty("APP_FRONTEND_URL"));
        log.info("========================================================");
    }

    /**
     * Retourne l'URL du frontend en privilégiant la variable
     * d'environnement brute APP_FRONTEND_URL (plus fiable que @Value
     * quand le mapping des propriétés est capricieux).
     */
    private String getFrontendUrl() {
        String fromEnv = env.getProperty("APP_FRONTEND_URL");
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv.replaceAll("/+$", ""); // retire les slashs finaux
        }
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            return frontendUrl.replaceAll("/+$", "");
        }
        return "http://localhost:5173";
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        String baseUrl = getFrontendUrl();
        log.info("[OAuth2] ▶ base frontend utilisée = {}", baseUrl);

        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            response.sendRedirect(baseUrl + "/login?error=oauth_failed");
            return;
        }

        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String email      = oAuth2User.getAttribute("email");
        String name       = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");

        if (email == null) {
            log.error("[OAuth2] Pas d'email reçu de Google");
            response.sendRedirect(baseUrl + "/login?error=oauth_no_email");
            return;
        }

        // ✅ Upsert : crée OU récupère l'utilisateur
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(generateUsername(name, email));
            newUser.setRole("ROLE_FAN");   // ✅ Nouveau user = FAN
            newUser.setOauthProvider("google");
            newUser.setOauthId(providerId);
            newUser.setPassword(null);
            User saved = userRepository.save(newUser);
            log.info("[OAuth2] ✅ Nouvel utilisateur créé : {} (ROLE_FAN)", email);
            return saved;
        });

        // ============================================================
        // ✅ FIX CRITIQUE : upgrade de rôle si l'utilisateur existait
        //    déjà (créé via /register ou seed) en ROLE_USER
        // ============================================================
        boolean roleUpgraded = false;
        String currentRole = user.getRole();
        if (currentRole == null
            || "ROLE_USER".equals(currentRole)
            || "USER".equals(currentRole)) {
            user.setRole("ROLE_FAN");
            roleUpgraded = true;
        }

        // Complète les champs OAuth si manquants (utile si l'user a été créé
        // via /register puis connecté via Google pour la 1ère fois)
        if (user.getOauthProvider() == null) {
            user.setOauthProvider("google");
            user.setOauthId(providerId);
        }

        if (roleUpgraded) {
            user = userRepository.save(user);
            log.info("[OAuth2] 🔧 Rôle upgradé {} → ROLE_FAN pour {}",
                     currentRole, user.getUsername());
        } else {
            // Petite sauvegarde au cas où on ait complété oauthProvider
            user = userRepository.save(user);
        }

        log.info("[OAuth2] 🔐 Login OAuth2 réussi : {} (rôle final : {})",
                 user.getUsername(), user.getRole());

        // ✅ Construire UserDetails avec le rôle corrigé
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword() != null ? user.getPassword() : "{noop}oauth-no-password",
            List.of(new SimpleGrantedAuthority(user.getRole()))
        );

        String jwt = jwtService.generateToken(userDetails);

        String target = UriComponentsBuilder
                .fromUriString(baseUrl + "/oauth-success")
                .queryParam("token", jwt)
                .queryParam("username", user.getUsername())
                .queryParam("role", user.getRole())
                .build()
                .encode()
                .toUriString();

        log.info("[OAuth2] ✅ Redirect → {}", target.split("\\?")[0]);
        response.sendRedirect(target);
    }

    private String generateUsername(String name, String email) {
        String base = (name != null && !name.isBlank())
                ? name.trim().toLowerCase().replaceAll("\\s+", "_")
                : email.split("@")[0];

        String candidate = base;
        int i = 1;
        while (userRepository.findByUsername(candidate).isPresent()) {
            candidate = base + "_" + i++;
        }
        return candidate;
    }
}