package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.FanFavoriteRequest;
import com.f1.f1analytics.dto.FanProfileDto;
import com.f1.f1analytics.service.FanService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fan")
@RequiredArgsConstructor
public class FanController {

    private final FanService service;

    @GetMapping("/me")
    public FanProfileDto me(Authentication auth) {
        return service.getProfile(auth.getName());
    }

    @PutMapping("/favorites")
    public FanProfileDto updateFavorites(Authentication auth,
                                         @RequestBody FanFavoriteRequest req) {
        return service.updateFavorites(auth.getName(), req);
    }

    @DeleteMapping("/favorites")
    public FanProfileDto clearFavorites(Authentication auth) {
        return service.clearFavorites(auth.getName());
    }
}