package com.tr.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class BasicAuthFilter extends OncePerRequestFilter {

    private final String username;
    private final String password;

    public BasicAuthFilter(
            @Value("${app.auth.username:}") String username,
            @Value("${app.auth.password:}") String password) {
        this.username = username;
        this.password = password;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        aplicarCors(request, response);

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        if (username.isBlank() || password.isBlank()) {
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Login do sistema nao configurado.");
            return;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (isAuthorized(authorization)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Basic realm=\"TR Sistema\"");
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login ou senha invalido.");
    }

    private void aplicarCors(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin == null ? "*" : origin);
        response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET,POST,PUT,DELETE,OPTIONS");
        response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Authorization,Content-Type");
        response.setHeader(HttpHeaders.ACCESS_CONTROL_MAX_AGE, "3600");
    }

    private boolean isAuthorized(String authorization) {
        if (authorization == null || !authorization.startsWith("Basic ")) {
            return false;
        }

        try {
            String token = authorization.substring("Basic ".length());
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
            int separator = decoded.indexOf(':');

            if (separator < 0) {
                return false;
            }

            String providedUsername = decoded.substring(0, separator);
            String providedPassword = decoded.substring(separator + 1);

            return username.equals(providedUsername) && password.equals(providedPassword);
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
