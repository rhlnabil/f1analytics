package com.f1.f1analytics.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String requestPath = request.getRequestURI();

        // Log pour voir si le filtre est appelé sur /api/fan/me
        if (requestPath.startsWith("/api/fan")) {
            log.info("[JWT] ▶ Requête reçue sur {} | Authorization présent = {}",
                    requestPath, authHeader != null);
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username;

        try {
            username = jwtService.extractUsername(jwt);
            log.info("[JWT] ✅ Username extrait : {}", username);
        } catch (Exception e) {
            log.warn("[JWT] ❌ Extraction username échouée : {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                log.info("[JWT] 🔍 UserDetails chargé : {} | authorities={}",
                        userDetails.getUsername(), userDetails.getAuthorities());

                if (jwtService.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("[JWT] ✅ Authentifié : {}", username);
                } else {
                    log.warn("[JWT] ❌ validateToken = false pour {}", username);
                }
            } catch (Exception e) {
                log.error("[JWT] ❌ Erreur loadUserByUsername({}) : {}", username, e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}