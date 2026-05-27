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

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/comissao-formatura")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:3000}")
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

        BigDecimal valorOriginal = aluno.getValorContrato() != null ? aluno.getValorContrato() : BigDecimal.ZERO;
        BigDecimal desconto = comissao.getDesconto() != null ? comissao.getDesconto() : BigDecimal.ZERO;
        BigDecimal valorComDesconto = valorOriginal.subtract(desconto);

        comissao.setNomeEscola(escola.getNomeEscola());
        comissao.setNomeAluno(aluno.getNome());
        comissao.setNomeResponsavel(aluno.getNomeResponsavel());
        comissao.setTurma(aluno.getTurma());
        comissao.setValorContratoOriginal(valorOriginal);
        comissao.setValorContratoComDesconto(valorComDesconto.signum() > 0 ? valorComDesconto : BigDecimal.ZERO);

        return repository.save(comissao);
    }
}
