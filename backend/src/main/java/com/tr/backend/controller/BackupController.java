package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.model.ComissaoFormatura;
import com.tr.backend.model.Demanda;
import com.tr.backend.model.Escola;
import com.tr.backend.model.ObservacaoAluno;
import com.tr.backend.model.Pagamento;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.ComissaoFormaturaRepository;
import com.tr.backend.repository.DemandaRepository;
import com.tr.backend.repository.EscolaRepository;
import com.tr.backend.repository.ObservacaoAlunoRepository;
import com.tr.backend.repository.PagamentoRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@RestController
@RequestMapping("/backup")
@CrossOrigin("*")
public class BackupController {

    private final AlunoRepository alunoRepository;
    private final EscolaRepository escolaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ComissaoFormaturaRepository comissaoFormaturaRepository;
    private final ObservacaoAlunoRepository observacaoAlunoRepository;
    private final DemandaRepository demandaRepository;
    private final ObjectMapper objectMapper;

    public BackupController(
            AlunoRepository alunoRepository,
            EscolaRepository escolaRepository,
            PagamentoRepository pagamentoRepository,
            ComissaoFormaturaRepository comissaoFormaturaRepository,
            ObservacaoAlunoRepository observacaoAlunoRepository,
            DemandaRepository demandaRepository,
            ObjectMapper objectMapper
    ) {
        this.alunoRepository = alunoRepository;
        this.escolaRepository = escolaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.comissaoFormaturaRepository = comissaoFormaturaRepository;
        this.observacaoAlunoRepository = observacaoAlunoRepository;
        this.demandaRepository = demandaRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportarBackup() {
        try {
            BackupPayload payload = new BackupPayload();
            payload.generatedAt = LocalDateTime.now().toString();
            payload.alunos = alunoRepository.findAll();
            payload.escolas = escolaRepository.findAll();
            payload.comissoes = comissaoFormaturaRepository.findAll();
            payload.demandas = demandaRepository.findAll();

            payload.pagamentos = pagamentoRepository.findAll().stream().map((pagamento) -> {
                BackupPagamento dto = new BackupPagamento();
                dto.id = pagamento.getId();
                dto.alunoId = pagamento.getAluno() != null ? pagamento.getAluno().getId() : null;
                dto.nomeAluno = pagamento.getNomeAluno();
                dto.valor = pagamento.getValor();
                dto.numeroParcela = pagamento.getNumeroParcela();
                dto.dataPagamento = pagamento.getDataPagamento();
                dto.descricao = pagamento.getDescricao();
                return dto;
            }).toList();

            payload.observacoes = observacaoAlunoRepository.findAll().stream().map((obs) -> {
                BackupObservacao dto = new BackupObservacao();
                dto.id = obs.getId();
                dto.alunoId = obs.getAluno() != null ? obs.getAluno().getId() : null;
                dto.texto = obs.getTexto();
                dto.dataCriacao = obs.getDataCriacao();
                return dto;
            }).toList();

            byte[] body = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=trcrm-backup-" + stamp + ".json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body);
        } catch (Exception e) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Falha ao gerar backup: " + e.getMessage());
        }
    }

    @PostMapping("/restore")
    @Transactional
    public Map<String, String> restaurarBackup(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Arquivo de backup nao enviado.");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!name.endsWith(".json")) {
            throw new ResponseStatusException(BAD_REQUEST, "Formato invalido. Envie um arquivo .json de backup.");
        }

        BackupPayload payload;
        try {
            payload = objectMapper.readValue(file.getBytes(), BackupPayload.class);
        } catch (IOException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Arquivo de backup invalido.");
        }

        observacaoAlunoRepository.deleteAll();
        pagamentoRepository.deleteAll();
        comissaoFormaturaRepository.deleteAll();
        demandaRepository.deleteAll();
        alunoRepository.deleteAll();
        escolaRepository.deleteAll();

        Map<Long, Long> escolaMap = new HashMap<>();
        for (Escola escola : safe(payload.escolas)) {
            Long oldId = escola.getId();
            escola.setId(null);
            Escola saved = escolaRepository.save(escola);
            if (oldId != null) {
                escolaMap.put(oldId, saved.getId());
            }
        }

        Map<Long, Long> alunoMap = new HashMap<>();
        for (Aluno aluno : safe(payload.alunos)) {
            Long oldId = aluno.getId();
            aluno.setId(null);
            Aluno saved = alunoRepository.save(aluno);
            if (oldId != null) {
                alunoMap.put(oldId, saved.getId());
            }
        }

        for (BackupPagamento dto : safe(payload.pagamentos)) {
            Pagamento pagamento = new Pagamento();
            pagamento.setNomeAluno(dto.nomeAluno);
            pagamento.setValor(dto.valor);
            pagamento.setNumeroParcela(dto.numeroParcela);
            pagamento.setDataPagamento(dto.dataPagamento);
            pagamento.setDescricao(dto.descricao);
            if (dto.alunoId != null) {
                Long novoAlunoId = alunoMap.get(dto.alunoId);
                if (novoAlunoId != null) {
                    alunoRepository.findById(novoAlunoId).ifPresent(pagamento::setAluno);
                }
            }
            pagamentoRepository.save(pagamento);
        }

        for (ComissaoFormatura comissao : safe(payload.comissoes)) {
            comissao.setId(null);
            if (comissao.getEscolaId() != null && escolaMap.containsKey(comissao.getEscolaId())) {
                comissao.setEscolaId(escolaMap.get(comissao.getEscolaId()));
            }
            if (comissao.getAlunoId() != null && alunoMap.containsKey(comissao.getAlunoId())) {
                comissao.setAlunoId(alunoMap.get(comissao.getAlunoId()));
            }
            comissaoFormaturaRepository.save(comissao);
        }

        for (Demanda demanda : safe(payload.demandas)) {
            demanda.setId(null);
            demandaRepository.save(demanda);
        }

        for (BackupObservacao dto : safe(payload.observacoes)) {
            if (dto.alunoId == null) continue;
            Long novoAlunoId = alunoMap.get(dto.alunoId);
            if (novoAlunoId == null) continue;
            alunoRepository.findById(novoAlunoId).ifPresent(aluno -> {
                ObservacaoAluno obs = new ObservacaoAluno();
                obs.setAluno(aluno);
                obs.setTexto(dto.texto);
                obs.setDataCriacao(dto.dataCriacao);
                observacaoAlunoRepository.save(obs);
            });
        }

        return Map.of("status", "Restore concluido");
    }

    private <T> List<T> safe(List<T> list) {
        return list == null ? List.of() : list;
    }

    public static class BackupPayload {
        public String generatedAt;
        public List<Aluno> alunos;
        public List<Escola> escolas;
        public List<BackupPagamento> pagamentos;
        public List<ComissaoFormatura> comissoes;
        public List<Demanda> demandas;
        public List<BackupObservacao> observacoes;
    }

    public static class BackupPagamento {
        public Long id;
        public Long alunoId;
        public String nomeAluno;
        public BigDecimal valor;
        public Integer numeroParcela;
        public LocalDateTime dataPagamento;
        public String descricao;
    }

    public static class BackupObservacao {
        public Long id;
        public Long alunoId;
        public String texto;
        public LocalDateTime dataCriacao;
    }
}
