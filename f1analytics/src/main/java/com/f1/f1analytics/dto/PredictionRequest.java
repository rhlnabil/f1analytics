package com.f1.f1analytics.dto;

public record PredictionRequest(
    Long raceId,
    Long p1DriverId,
    Long p2DriverId,
    Long p3DriverId
) {}