package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.model.ObservacaoAluno;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.ObservacaoAlunoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/alunos/{alunoId}/observacoes")
@CrossOrigin("*")
public class ObservacaoAlunoController {

    private final ObservacaoAlunoRepository observacaoRepository;
    private final AlunoRepository alunoRepository;

    public ObservacaoAlunoController(ObservacaoAlunoRepository observacaoRepository, AlunoRepository alunoRepository) {
        this.observacaoRepository = observacaoRepository;
        this.alunoRepository = alunoRepository;
    }

    @GetMapping
    public List<ObservacaoAluno> listar(@PathVariable Long alunoId) {
        return observacaoRepository.findByAlunoIdOrderByDataCriacaoDesc(alunoId);
    }

    @PostMapping
    public ObservacaoAluno salvar(@PathVariable Long alunoId, @RequestBody ObservacaoAluno observacao) {
        if (observacao.getTexto() == null || observacao.getTexto().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a observacao.");
        }

        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));

        observacao.setAluno(aluno);
        observacao.setTexto(observacao.getTexto().trim());
        observacao.setDataCriacao(LocalDateTime.now());

        return observacaoRepository.save(observacao);
    }

    @DeleteMapping("/{observacaoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long alunoId, @PathVariable Long observacaoId) {
        ObservacaoAluno observacao = observacaoRepository.findById(observacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Observacao nao encontrada."));

        if (observacao.getAluno() == null || !observacao.getAluno().getId().equals(alunoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Observacao nao encontrada para este aluno.");
        }

        observacaoRepository.deleteById(observacaoId);
    }
}
