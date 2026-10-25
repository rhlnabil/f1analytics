package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.ResultDto;
import com.f1.f1analytics.service.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService service;

    @GetMapping
    public List<ResultDto> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultDto> getOne(@PathVariable Long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResultDto create(@RequestBody ResultDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ResultDto update(@PathVariable Long id, @RequestBody ResultDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}