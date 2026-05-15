package com.tr.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

    private final String username;
    private final String password;

    public AuthController(
            @Value("${app.auth.username:}") String username,
            @Value("${app.auth.password:}") String password) {
        this.username = username;
        this.password = password;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        if (username.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Login do sistema nao configurado.");
        }

        String emailInformado = limpar(request.email());
        String senhaInformada = limpar(request.senha());

        if (!limpar(username).equalsIgnoreCase(emailInformado) || !limpar(password).equals(senhaInformada)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha invalido.");
        }

        return Map.of("status", "ok");
    }

    private String limpar(String valor) {
        if (valor == null) {
            return "";
        }

        return valor
                .replace("\u200B", "")
                .replace("\u200C", "")
                .replace("\u200D", "")
                .replace("\uFEFF", "")
                .trim();
    }

    public record LoginRequest(String email, String senha) {
    }
}
