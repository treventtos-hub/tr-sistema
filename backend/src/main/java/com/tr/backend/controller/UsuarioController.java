package com.tr.backend.controller;

import com.tr.backend.model.Usuario;
import com.tr.backend.repository.UsuarioRepository;
import com.tr.backend.service.SenhaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:3000}")
public class UsuarioController {

    private final UsuarioRepository repository;
    private final SenhaService senhaService;

    public UsuarioController(UsuarioRepository repository, SenhaService senhaService) {
        this.repository = repository;
        this.senhaService = senhaService;
    }

    @GetMapping
    public List<Usuario> listar() {
        return repository.findAll().stream().map(this::semSenha).toList();
    }

    @PostMapping
    public Usuario criar(@RequestBody Map<String, String> dados, @RequestHeader(value = "Authorization", required = false) String authorization) {
        String login = dados.getOrDefault("login", "").trim();
        String senha = dados.getOrDefault("senha", "");
        if (login.isBlank() || senha.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe login e senha.");
        }
        if (repository.count() > 0 && usuarioAutenticado(authorization) == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para criar novos usuarios.");
        }
        if (repository.existsByLoginIgnoreCase(login)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Login ja cadastrado.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dados.getOrDefault("nome", login).trim());
        usuario.setLogin(login);
        usuario.setSenhaHash(senhaService.gerarHash(senha));
        usuario.setPerfil(dados.getOrDefault("perfil", "OPERADOR"));
        usuario.setAtivo(true);
        usuario.setCriadoEm(LocalDateTime.now());
        usuario.setAtualizadoEm(LocalDateTime.now());
        return semSenha(repository.save(usuario));
    }

    @PostMapping("/login")
    public Usuario login(@RequestBody Map<String, String> dados) {
        Usuario usuario = repository.findByLoginIgnoreCase(dados.getOrDefault("login", ""))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha invalidos."));
        if (!Boolean.TRUE.equals(usuario.getAtivo()) || !senhaService.validar(dados.getOrDefault("senha", ""), usuario.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha invalidos.");
        }
        usuario.setSessaoToken(UUID.randomUUID().toString());
        usuario.setAtualizadoEm(LocalDateTime.now());
        return semSenha(repository.save(usuario));
    }

    private Usuario semSenha(Usuario usuario) {
        usuario.setSenhaHash(null);
        return usuario;
    }

    private Usuario usuarioAutenticado(String authorization) {
        String token = token(authorization);
        if (token == null) return null;
        return repository.findBySessaoToken(token).filter(usuario -> Boolean.TRUE.equals(usuario.getAtivo())).orElse(null);
    }

    private String token(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        return authorization.substring("Bearer ".length()).trim();
    }
}
