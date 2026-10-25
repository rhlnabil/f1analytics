package com.f1.f1analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class F1analyticsApplication {
    public static void main(String[] args) {
        SpringApplication.run(F1analyticsApplication.class, args);
    }
}