package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.model.Cobranca;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.CobrancaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/cobrancas")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:3000}")
public class CobrancaController {

    private final CobrancaRepository repository;
    private final AlunoRepository alunoRepository;

    public CobrancaController(CobrancaRepository repository, AlunoRepository alunoRepository) {
        this.repository = repository;
        this.alunoRepository = alunoRepository;
    }

    @GetMapping
    public List<Cobranca> listar(@RequestParam(required = false) Long alunoId) {
        if (alunoId != null) {
            return repository.findByAlunoIdOrderByDataCobrancaDescIdDesc(alunoId);
        }
        return repository.findAllByOrderByDataLembreteAscDataCobrancaDescIdDesc();
    }

    @PostMapping
    public Cobranca salvar(@RequestBody Cobranca cobranca, @RequestHeader(value = "X-Usuario-Nome", required = false) String usuarioNome) {
        if (cobranca.getAlunoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o aluno da cobranca.");
        }

        Aluno aluno = alunoRepository.findById(cobranca.getAlunoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));

        preencherDadosAluno(cobranca, aluno);
        if (cobranca.getStatus() == null || cobranca.getStatus().isBlank()) {
            cobranca.setStatus("AGUARDANDO_RESPOSTA");
        }
        if (cobranca.getDataCobranca() == null) {
            cobranca.setDataCobranca(LocalDate.now());
        }
        if (cobranca.getDataLembrete() == null && !"RESOLVIDO".equals(cobranca.getStatus())) {
            cobranca.setDataLembrete(cobranca.getDataCobranca().plusDays(15));
        }
        if ("RESOLVIDO".equals(cobranca.getStatus())) {
            cobranca.setDataLembrete(null);
        }

        cobranca.setCriadoEm(LocalDateTime.now());
        cobranca.setAtualizadoEm(LocalDateTime.now());
        cobranca.setCriadoPor(usuario(usuarioNome));
        cobranca.setAtualizadoPor(usuario(usuarioNome));
        return repository.save(cobranca);
    }

    @PutMapping("/{id}")
    public Cobranca atualizar(
            @PathVariable Long id,
            @RequestBody Cobranca cobrancaAtualizada,
            @RequestHeader(value = "X-Usuario-Nome", required = false) String usuarioNome) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cobranca nao encontrada."));

        if (cobrancaAtualizada.getAlunoId() != null && !cobrancaAtualizada.getAlunoId().equals(cobranca.getAlunoId())) {
            Aluno aluno = alunoRepository.findById(cobrancaAtualizada.getAlunoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));
            cobranca.setAlunoId(aluno.getId());
            preencherDadosAluno(cobranca, aluno);
        }

        cobranca.setStatus(cobrancaAtualizada.getStatus());
        cobranca.setObservacao(cobrancaAtualizada.getObservacao());
        cobranca.setDataCobranca(cobrancaAtualizada.getDataCobranca());
        cobranca.setDataLembrete(cobrancaAtualizada.getDataLembrete());

        if (cobranca.getStatus() == null || cobranca.getStatus().isBlank()) {
            cobranca.setStatus("AGUARDANDO_RESPOSTA");
        }
        if (cobranca.getDataCobranca() == null) {
            cobranca.setDataCobranca(LocalDate.now());
        }
        if ("COBRAR_NOVAMENTE_15_DIAS".equals(cobranca.getStatus())) {
            cobranca.setDataLembrete(LocalDate.now().plusDays(15));
        }
        if ("RESOLVIDO".equals(cobranca.getStatus())) {
            cobranca.setDataLembrete(null);
        }

        cobranca.setAtualizadoEm(LocalDateTime.now());
        cobranca.setAtualizadoPor(usuario(usuarioNome));
        return repository.save(cobranca);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cobranca nao encontrada.");
        }
        repository.deleteById(id);
    }

    private void preencherDadosAluno(Cobranca cobranca, Aluno aluno) {
        cobranca.setAlunoId(aluno.getId());
        cobranca.setNomeAluno(aluno.getNome());
        cobranca.setNomeResponsavel(aluno.getNomeResponsavel());
        cobranca.setTelefoneResponsavel(aluno.getTelefoneResponsavel());
        cobranca.setEscola(aluno.getEscola());
        cobranca.setTurma(aluno.getTurma());
    }

    private String usuario(String usuarioNome) {
        return usuarioNome == null || usuarioNome.isBlank() ? "Sistema" : usuarioNome;
    }
}
