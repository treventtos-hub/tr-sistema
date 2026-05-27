package com.tr.backend.controller;

import com.tr.backend.model.*;
import com.tr.backend.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/manutencao")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:3000}")
public class ManutencaoController {

    private final JdbcTemplate jdbcTemplate;
    private final AlunoRepository alunoRepository;
    private final EscolaRepository escolaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ComissaoFormaturaRepository comissaoRepository;
    private final CobrancaRepository cobrancaRepository;
    private final UsuarioRepository usuarioRepository;

    public ManutencaoController(
            JdbcTemplate jdbcTemplate,
            AlunoRepository alunoRepository,
            EscolaRepository escolaRepository,
            PagamentoRepository pagamentoRepository,
            ComissaoFormaturaRepository comissaoRepository,
            CobrancaRepository cobrancaRepository,
            UsuarioRepository usuarioRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.alunoRepository = alunoRepository;
        this.escolaRepository = escolaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.comissaoRepository = comissaoRepository;
        this.cobrancaRepository = cobrancaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        List<Map<String, Object>> tabelas = tabelas();
        long registros = tabelas.stream().mapToLong(t -> numero(t.get("linhas"))).sum();
        long bytes = tabelas.stream().mapToLong(t -> numero(t.get("tamanhoBytes"))).sum();
        String status = bytes > 500L * 1024L * 1024L ? "Cheio" : bytes > 250L * 1024L * 1024L ? "Atencao" : "Leve";

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("statusLotacao", status);
        resposta.put("usoEstimado", formatarBytes(bytes));
        resposta.put("usoBytes", bytes);
        resposta.put("registros", registros);
        resposta.put("anoSelecionado", Calendar.getInstance().get(Calendar.YEAR));
        resposta.put("tabelas", tabelas);
        resposta.put("lembrete", bytes > 250L * 1024L * 1024L
                ? "O banco esta crescendo. Baixe um backup e avalie apagar dados antigos."
                : "Banco em tamanho tranquilo para uso normal.");
        return resposta;
    }

    @GetMapping("/backup")
    public Map<String, Object> backup() {
        Map<String, Object> backup = new LinkedHashMap<>();
        backup.put("geradoEm", LocalDateTime.now().toString());
        backup.put("alunos", alunoRepository.findAll());
        backup.put("escolas", escolaRepository.findAll());
        backup.put("pagamentos", pagamentoRepository.findAll());
        backup.put("comissoes", comissaoRepository.findAll());
        backup.put("cobrancas", cobrancaRepository.findAll());
        backup.put("usuarios", usuarioRepository.findAll());
        return backup;
    }

    @PostMapping("/restaurar")
    public Map<String, Object> restaurar(@RequestBody BackupPayload backup) {
        pagamentoRepository.deleteAll();
        cobrancaRepository.deleteAll();
        comissaoRepository.deleteAll();
        alunoRepository.deleteAll();
        escolaRepository.deleteAll();

        if (backup.escolas != null) escolaRepository.saveAll(backup.escolas);
        if (backup.alunos != null) alunoRepository.saveAll(backup.alunos);
        if (backup.pagamentos != null) pagamentoRepository.saveAll(backup.pagamentos);
        if (backup.comissoes != null) comissaoRepository.saveAll(backup.comissoes);
        if (backup.cobrancas != null) cobrancaRepository.saveAll(backup.cobrancas);

        return Map.of("restaurado", true, "restauradoEm", LocalDateTime.now().toString());
    }

    private List<Map<String, Object>> tabelas() {
        try {
            return jdbcTemplate.queryForList("""
                    select
                      relname as tabela,
                      n_live_tup as linhas,
                      pg_total_relation_size(relid) as "tamanhoBytes",
                      pg_size_pretty(pg_total_relation_size(relid)) as "tamanhoTotal"
                    from pg_stat_user_tables
                    order by pg_total_relation_size(relid) desc
                    """);
        } catch (Exception e) {
            return List.of(
                    tabela("aluno", alunoRepository.count()),
                    tabela("escola", escolaRepository.count()),
                    tabela("pagamento", pagamentoRepository.count()),
                    tabela("cobranca", cobrancaRepository.count()),
                    tabela("usuario", usuarioRepository.count())
            );
        }
    }

    private Map<String, Object> tabela(String nome, long linhas) {
        Map<String, Object> tabela = new LinkedHashMap<>();
        tabela.put("tabela", nome);
        tabela.put("linhas", linhas);
        tabela.put("tamanhoBytes", linhas * 512);
        tabela.put("tamanhoTotal", formatarBytes(linhas * 512));
        return tabela;
    }

    private long numero(Object valor) {
        if (valor instanceof Number number) return number.longValue();
        return 0;
    }

    private String formatarBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.US, "%.1f KB", bytes / 1024.0);
        return String.format(Locale.US, "%.1f MB", bytes / 1024.0 / 1024.0);
    }

    public static class BackupPayload {
        public List<Aluno> alunos;
        public List<Escola> escolas;
        public List<Pagamento> pagamentos;
        public List<ComissaoFormatura> comissoes;
        public List<Cobranca> cobrancas;
    }
}
