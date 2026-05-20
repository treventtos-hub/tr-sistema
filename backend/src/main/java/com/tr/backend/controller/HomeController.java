package com.tr.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class HomeController {

    private final JdbcTemplate jdbcTemplate;

    public HomeController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
                "status", "API online",
                "rotas", List.of("/alunos", "/escolas", "/pagamentos", "/comissao-formatura")
        );
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        boolean bancoOnline;
        try {
            jdbcTemplate.queryForObject("select 1", Integer.class);
            bancoOnline = true;
        } catch (Exception exception) {
            bancoOnline = false;
        }

        return Map.of(
                "status", bancoOnline ? "ok" : "degraded",
                "serverOnline", true,
                "databaseOnline", bancoOnline,
                "timestamp", LocalDateTime.now().toString()
        );
    }
}
