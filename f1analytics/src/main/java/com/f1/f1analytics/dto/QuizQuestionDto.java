package com.f1.f1analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionDto {

    private String id;
    private String question;
    private List<String> choices;   // toujours 4
    private int correctIndex;        // 0-3
    private String category;         // "Pilotes", "Écuries", "Circuits"...
    private String hint;             // info optionnelle (écurie du pilote...)
}