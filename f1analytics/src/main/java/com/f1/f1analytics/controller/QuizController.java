package com.f1.f1analytics.controller;

import com.f1.f1analytics.dto.QuizQuestionDto;
import com.f1.f1analytics.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /** GET /api/quiz/questions?count=10 */
    @GetMapping("/questions")
    public List<QuizQuestionDto> getQuestions(@RequestParam(defaultValue = "10") int count) {
        return quizService.generateQuestions(Math.min(Math.max(count, 1), 30));
    }
}