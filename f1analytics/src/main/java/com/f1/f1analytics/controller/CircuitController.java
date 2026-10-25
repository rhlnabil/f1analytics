package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.CircuitDto;
import com.f1.f1analytics.service.CircuitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/circuits")
@RequiredArgsConstructor
public class CircuitController {

    private final CircuitService service;

    @GetMapping
    public List<CircuitDto> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CircuitDto> getOne(@PathVariable Long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CircuitDto create(@RequestBody CircuitDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public CircuitDto update(@PathVariable Long id, @RequestBody CircuitDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}