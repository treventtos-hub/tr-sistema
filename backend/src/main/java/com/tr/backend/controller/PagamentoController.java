package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.model.Pagamento;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.PagamentoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/pagamentos")
@CrossOrigin("*")
public class PagamentoController {

    private final PagamentoRepository pagamentoRepository;
    private final AlunoRepository alunoRepository;

    public PagamentoController(PagamentoRepository pagamentoRepository, AlunoRepository alunoRepository) {
        this.pagamentoRepository = pagamentoRepository;
        this.alunoRepository = alunoRepository;
    }

    @PostMapping
    public Pagamento registrarPagamento(@RequestBody Pagamento pagamento) {
        if (pagamento.getAluno() == null || pagamento.getAluno().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o aluno do pagamento.");
        }
        if (pagamento.getValor() == null || pagamento.getValor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor de pagamento valido.");
        }

        if (pagamento.getNumeroParcela() == null) {
            pagamento.setNumeroParcela(0);
        }

        Aluno aluno = alunoRepository.findById(pagamento.getAluno().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));

        Double saldoAtual = aluno.getValorRestanteContrato() != null
                ? aluno.getValorRestanteContrato()
                : aluno.getValorContrato();
        BigDecimal valorAtualContrato = BigDecimal.valueOf(saldoAtual == null ? 0 : saldoAtual);
        BigDecimal valorPago = BigDecimal.valueOf(pagamento.getValor());
        BigDecimal novoValorContrato = valorAtualContrato.subtract(valorPago);

        aluno.setValorRestanteContrato(novoValorContrato.signum() > 0 ? novoValorContrato.doubleValue() : 0);
        alunoRepository.save(aluno);

        pagamento.setAluno(aluno);
        pagamento.setNomeAluno(aluno.getNome());
        pagamento.setDataPagamento(LocalDateTime.now());

        return pagamentoRepository.save(pagamento);
    }

    @GetMapping("/aluno/{alunoId}")
    public List<Pagamento> listarPagamentosAluno(@PathVariable Long alunoId) {
        return pagamentoRepository.findByAlunoId(alunoId);
    }

    @GetMapping("/aluno/{alunoId}/total")
    public Double getTotalPago(@PathVariable Long alunoId) {
        List<Pagamento> pagamentos = pagamentoRepository.findByAlunoId(alunoId);
        return pagamentos.stream().mapToDouble(Pagamento::getValor).sum();
    }
}
