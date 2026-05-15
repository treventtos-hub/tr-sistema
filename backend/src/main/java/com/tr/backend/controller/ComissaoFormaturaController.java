package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.model.ComissaoFormatura;
import com.tr.backend.model.Escola;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.ComissaoFormaturaRepository;
import com.tr.backend.repository.EscolaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/comissao-formatura")
@CrossOrigin("*")
public class ComissaoFormaturaController {

    private final ComissaoFormaturaRepository repository;
    private final EscolaRepository escolaRepository;
    private final AlunoRepository alunoRepository;

    public ComissaoFormaturaController(
            ComissaoFormaturaRepository repository,
            EscolaRepository escolaRepository,
            AlunoRepository alunoRepository) {
        this.repository = repository;
        this.escolaRepository = escolaRepository;
        this.alunoRepository = alunoRepository;
    }

    @GetMapping("/escola/{escolaId}")
    public List<ComissaoFormatura> listarPorEscola(@PathVariable Long escolaId) {
        return repository.findByEscolaId(escolaId);
    }

    @GetMapping("/aluno/{alunoId}")
    public List<ComissaoFormatura> listarPorAluno(@PathVariable Long alunoId) {
        return repository.findByAlunoId(alunoId);
    }

    @PostMapping
    public ComissaoFormatura salvar(@RequestBody ComissaoFormatura comissao) {
        Escola escola = escolaRepository.findById(comissao.getEscolaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Escola nao encontrada."));
        Aluno aluno = alunoRepository.findById(comissao.getAlunoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));

        double valorOriginal = aluno.getValorContrato() != null ? aluno.getValorContrato() : 0;
        double desconto = comissao.getDesconto() != null ? comissao.getDesconto() : 0;

        comissao.setNomeEscola(escola.getNomeEscola());
        comissao.setNomeAluno(aluno.getNome());
        comissao.setNomeResponsavel(aluno.getNomeResponsavel());
        comissao.setTurma(aluno.getTurma());
        comissao.setValorContratoOriginal(valorOriginal);
        comissao.setValorContratoComDesconto(Math.max(valorOriginal - desconto, 0));

        return repository.save(comissao);
    }
}
