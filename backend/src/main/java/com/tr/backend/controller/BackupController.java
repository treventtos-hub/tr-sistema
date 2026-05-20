package com.tr.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/backup")
@CrossOrigin("*")
public class BackupController {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @PostMapping
    public Map<String, String> executarBackup() {
        File script = new File("scripts/backup-trcrm.ps1");

        if (!script.exists()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Script de backup nao encontrado.");
        }

        try {
            Process process = new ProcessBuilder(
                    "powershell.exe",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    script.getAbsolutePath()
            )
                    .directory(new File("."))
                    .redirectErrorStream(true)
                    .start();

            boolean finished = process.waitFor(2, TimeUnit.MINUTES);
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            if (!finished) {
                process.destroyForcibly();
                throw new ResponseStatusException(HttpStatus.REQUEST_TIMEOUT, "Backup demorou demais para concluir.");
            }

            if (process.exitValue() != 0) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, output.isBlank() ? "Falha ao executar backup." : output);
            }

            return Map.of("status", "Backup concluido");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Backup interrompido.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PostMapping("/restore")
    public Map<String, String> restaurarBackup(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo de backup nao enviado.");
        }

        String filename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String lower = filename.toLowerCase();
        boolean isDump = lower.endsWith(".dump") || lower.endsWith(".backup");
        boolean isSql = lower.endsWith(".sql");

        if (!isDump && !isSql) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato nao suportado. Envie .dump, .backup ou .sql.");
        }

        JdbcInfo jdbcInfo = parseJdbcUrl(datasourceUrl);
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("restore-trcrm-", isSql ? ".sql" : ".dump");
            file.transferTo(tempFile.toFile());

            List<String> command = new ArrayList<>();
            if (isSql) {
                command.add("psql");
                command.add("--host");
                command.add(jdbcInfo.host());
                command.add("--port");
                command.add(jdbcInfo.port());
                command.add("--username");
                command.add(datasourceUsername);
                command.add("--dbname");
                command.add(jdbcInfo.database());
                command.add("--file");
                command.add(tempFile.toAbsolutePath().toString());
            } else {
                command.add("pg_restore");
                command.add("--clean");
                command.add("--if-exists");
                command.add("--no-owner");
                command.add("--no-privileges");
                command.add("--host");
                command.add(jdbcInfo.host());
                command.add("--port");
                command.add(jdbcInfo.port());
                command.add("--username");
                command.add(datasourceUsername);
                command.add("--dbname");
                command.add(jdbcInfo.database());
                command.add(tempFile.toAbsolutePath().toString());
            }

            ProcessBuilder builder = new ProcessBuilder(command);
            builder.redirectErrorStream(true);
            if (!datasourcePassword.isBlank()) {
                builder.environment().put("PGPASSWORD", datasourcePassword);
            }
            Process process = builder.start();

            boolean finished = process.waitFor(5, TimeUnit.MINUTES);
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (!finished) {
                process.destroyForcibly();
                throw new ResponseStatusException(HttpStatus.REQUEST_TIMEOUT, "Restore demorou demais para concluir.");
            }
            if (process.exitValue() != 0) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, output.isBlank() ? "Falha ao restaurar backup." : output);
            }

            return Map.of("status", "Restore concluido", "arquivo", filename);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Restore interrompido.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (Exception ignored) {
                }
            }
        }
    }

    private JdbcInfo parseJdbcUrl(String jdbcUrl) {
        Pattern pattern = Pattern.compile("^jdbc:postgresql://([^/:]+)(?::(\\d+))?/([^?]+).*$");
        Matcher matcher = pattern.matcher(jdbcUrl);
        if (!matcher.matches()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "URL do banco invalida para restore.");
        }
        String host = matcher.group(1);
        String port = matcher.group(2) == null ? "5432" : matcher.group(2);
        String database = matcher.group(3);
        return new JdbcInfo(host, port, database);
    }

    private record JdbcInfo(String host, String port, String database) {
    }
}
