package com.f1.f1analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.api.model}")
    private String model;

    public ChatService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String chat(List<Map<String, String>> messages) {
        // 1) Garde-fou clé
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("REMPLACE_MOI")) {
            throw new IllegalStateException(
                "Clé Groq manquante. Définis GROQ_API_KEY " +
                "ou édite groq.api.key dans application.properties."
            );
        }

        // 2) Sanitize messages
        List<Map<String, String>> safeMessages = messages.stream()
                .filter(m -> m.get("role") != null && m.get("content") != null)
                .map(m -> Map.of(
                        "role", normalizeRole(m.get("role")),
                        "content", String.valueOf(m.get("content"))
                ))
                .collect(Collectors.toList());

        if (safeMessages.isEmpty()) {
            throw new IllegalArgumentException("Aucun message à envoyer");
        }

        // 3) Body OpenAI-compatible
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", safeMessages);
        body.put("temperature", 0.7);
        body.put("max_tokens", 4096);   // gpt-oss = modèle de raisonnement
        body.put("top_p", 0.95);
        body.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        headers.set("Accept", "application/json");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            // ✅ Réponse en String → on parse avec ObjectMapper (JsonNode abstrait)
            ResponseEntity<String> response =
                    restTemplate.postForEntity(apiUrl, request, String.class);

            String rawBody = response.getBody();
            if (rawBody == null || rawBody.isBlank()) {
                throw new RuntimeException("Réponse Groq vide");
            }

            JsonNode respBody = objectMapper.readTree(rawBody);

            if (!respBody.has("choices")) {
                throw new RuntimeException("Réponse Groq invalide (pas de 'choices') : " + rawBody);
            }

            JsonNode choices = respBody.get("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new RuntimeException("Groq n'a renvoyé aucun choice");
            }

            JsonNode message = choices.get(0).get("message");
            if (message == null || !message.has("content")) {
                throw new RuntimeException("Groq n'a renvoyé aucun contenu");
            }

            String content = message.get("content").asText();
            if (content == null || content.isBlank()) {
                throw new RuntimeException("Groq a renvoyé une réponse vide");
            }
            return content.trim();

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String detail = e.getResponseBodyAsString();

            String msg = switch (status) {
                case 400 -> "Requête invalide (400). Détails : " + detail;
                case 401 -> "Clé Groq invalide ou expirée (401).";
                case 403 -> "Accès refusé à Groq (403).";
                case 404 -> "Modèle introuvable : " + model + " (404).";
                case 413 -> "Message trop long pour Groq (413).";
                case 429 -> "Rate limit Groq atteint (429). Attends quelques secondes.";
                case 503 -> "Groq momentanément surchargé (503). Réessaie.";
                default  -> "Erreur Groq " + status + " : " + detail;
            };
            System.err.printf("[ChatService] %s%n", msg);
            throw new RuntimeException(msg, e);

        } catch (ResourceAccessException e) {
            System.err.println("[ChatService] Groq unreachable: " + e.getMessage());
            throw new RuntimeException("Groq injoignable (timeout ou réseau). Réessaie.", e);

        } catch (Exception e) {
            System.err.println("[ChatService] Parse error: " + e.getMessage());
            throw new RuntimeException("Erreur parsing Groq : " + e.getMessage(), e);
        }
    }

    private String normalizeRole(String role) {
        String r = role.toLowerCase();
        return switch (r) {
            case "system", "assistant", "user" -> r;
            default -> "user";
        };
    }
}