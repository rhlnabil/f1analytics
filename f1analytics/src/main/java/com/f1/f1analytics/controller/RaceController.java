package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.RaceCurrentDto;
import com.f1.f1analytics.dto.RaceDto;
import com.f1.f1analytics.service.RaceCurrentService;
import com.f1.f1analytics.service.RaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class RaceController {

    private final RaceService service;
    private final RaceCurrentService currentService;   // ✅ AJOUT

    /* ✅ NOUVEAU — Statut live / prochain / dernier GP */
    @GetMapping("/current")
    public RaceCurrentDto current() {
        return currentService.getCurrent();
    }

    @GetMapping
    public List<RaceDto> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RaceDto> getOne(@PathVariable Long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RaceDto create(@RequestBody RaceDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public RaceDto update(@PathVariable Long id, @RequestBody RaceDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}