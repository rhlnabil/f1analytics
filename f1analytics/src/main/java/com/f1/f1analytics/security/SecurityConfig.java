package com.f1.f1analytics.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          OAuth2SuccessHandler oAuth2SuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
    }

    /* ============================================================ */
    /* ============ FILTER CHAIN ================================= */
    /* ============================================================ */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                /* ============ CORS PREFLIGHT ============ */
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                /* ============ CHATBOT BOX (public) ============ */
                .requestMatchers("/api/chat/**").permitAll()

                /* ============ AUTH (public) ============ */
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/qr-login",
                    "/api/auth/qr-token"
                ).permitAll()

                /* ============ OAUTH2 ============ */
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                /* ============ UPLOADS & STATIC ============ */
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/error", "/favicon.ico").permitAll()

                /* ============ ENDPOINTS PUBLICS ============ */
                .requestMatchers(
                    "/api/health/**",
                    "/api/news/**",
                    "/api/drivers/**",
                    "/api/teams/**",
                    "/api/races/**",
                    "/api/circuits/**",
                    "/api/results/**",
                    "/api/standings/**",
                    "/api/quiz/**",
                    "/api/puzzle/images"
                ).permitAll()

                /* ============ PROTÉGÉ : ADMIN ============ */
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                /* ============ PROTÉGÉ : FAN ============ */
                .requestMatchers("/api/fan/**").hasRole("FAN")

                /* ============ UPLOAD (admin uniquement) ============ */
                .requestMatchers("/api/upload/**").hasRole("ADMIN")

                /* ============ TOUT LE RESTE ============ */
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .successHandler(oAuth2SuccessHandler)
                .failureHandler((request, response, exception) -> {
                    response.sendRedirect("https://f1analytics-2uu.pages.dev/login?error=oauth_failed");
                })
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Non authentifié\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Accès refusé\"}");
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /* ============================================================ */
    /* ============ CORS ========================================= */
    /* ============================================================ */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "https://f1analytics-2uu.pages.dev"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /* ============================================================ */
    /* ============ BEANS ======================================== */
    /* ============================================================ */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}