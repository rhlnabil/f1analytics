package com.f1.f1analytics.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class CarDataDto {
    private Integer speed;      
    private Integer throttle;   
    private Integer brake;      
    private Integer nGear;      
    private Integer rpm;
    private Instant date;      
}