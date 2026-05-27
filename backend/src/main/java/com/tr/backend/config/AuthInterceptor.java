package com.tr.backend.config;

import com.tr.backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final UsuarioRepository usuarioRepository;

    public AuthInterceptor(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        if (request.getRequestURI().equals("/health")) return true;
        if (request.getRequestURI().equals("/usuarios/login")) return true;
        if (request.getRequestURI().equals("/usuarios") && "POST".equalsIgnoreCase(request.getMethod()) && usuarioRepository.count() == 0) {
            return true;
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login necessario.");
            return false;
        }

        String token = authorization.substring("Bearer ".length()).trim();
        boolean autorizado = usuarioRepository.findBySessaoToken(token)
                .filter(usuario -> Boolean.TRUE.equals(usuario.getAtivo()))
                .isPresent();
        if (!autorizado) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Sessao invalida.");
            return false;
        }
        return true;
    }
}
