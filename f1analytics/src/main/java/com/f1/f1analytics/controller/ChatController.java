package com.f1.f1analytics.controller;

import com.f1.f1analytics.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> payload) {
        try {
            Object raw = payload.get("messages");
            if (!(raw instanceof List<?> list) || list.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Aucun message fourni"));
            }

            // Cast sûr : on a vérifié instanceof List au-dessus
            List<Map<String, String>> messages = (List<Map<String, String>>) raw;

            String reply = chatService.chat(messages);
            return ResponseEntity.ok(Map.of("reply", reply));

        } catch (Exception e) {
            System.err.println("[ChatController] " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}