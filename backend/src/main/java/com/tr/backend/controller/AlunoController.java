package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.PagamentoRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/alunos")
@CrossOrigin("*")
public class AlunoController {

    private final AlunoRepository repository;
    private final PagamentoRepository pagamentoRepository;

    public AlunoController(AlunoRepository repository, PagamentoRepository pagamentoRepository) {
        this.repository = repository;
        this.pagamentoRepository = pagamentoRepository;
    }

    @GetMapping
    public List<Aluno> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String responsavel,
            @RequestParam(required = false) String telefone,
            @RequestParam(required = false) String escola) {
        
        if (nome != null && !nome.isEmpty()) {
            return repository.findByNomeContainingIgnoreCase(nome);
        }
        if (responsavel != null && !responsavel.isEmpty()) {
            return repository.findByNomeResponsavelContainingIgnoreCase(responsavel);
        }
        if (telefone != null && !telefone.isEmpty()) {
            return repository.findByTelefoneContainingIgnoreCase(telefone);
        }
        if (escola != null && !escola.isEmpty()) {
            return repository.findByEscolaContainingIgnoreCase(escola);
        }
        return repository.findAll();
    }

    @PostMapping
    public Aluno salvar(@RequestBody Aluno aluno) {
        validarAluno(aluno);

        if (aluno.getValorRestanteContrato() == null) {
            aluno.setValorRestanteContrato(aluno.getValorContrato());
        }

        return repository.save(aluno);
    }

    @PutMapping("/{id}")
    public Aluno atualizar(@PathVariable Long id, @RequestBody Aluno alunoAtualizado) {
        validarAluno(alunoAtualizado);

        Aluno aluno = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));

        aluno.setNome(alunoAtualizado.getNome());
        aluno.setNomeResponsavel(alunoAtualizado.getNomeResponsavel());
        aluno.setTelefoneResponsavel(alunoAtualizado.getTelefoneResponsavel());
        aluno.setTelefone(alunoAtualizado.getTelefone());
        aluno.setEscola(alunoAtualizado.getEscola());
        aluno.setTurma(alunoAtualizado.getTurma());
        aluno.setCategoria(alunoAtualizado.getCategoria());
        aluno.setFormaPagamento(alunoAtualizado.getFormaPagamento());
        aluno.setBaile(alunoAtualizado.getBaile());
        aluno.setKitFormatura(alunoAtualizado.getKitFormatura());
        aluno.setPlacaHomenagem(alunoAtualizado.getPlacaHomenagem());
        aluno.setQuantidadePlacaHomenagem(alunoAtualizado.getQuantidadePlacaHomenagem());
        aluno.setPlacaReplica(alunoAtualizado.getPlacaReplica());
        aluno.setQuantidadePlacaReplica(alunoAtualizado.getQuantidadePlacaReplica());
        aluno.setValorContrato(alunoAtualizado.getValorContrato());
        aluno.setValorRestanteContrato(alunoAtualizado.getValorRestanteContrato());
        aluno.setValorMensal(alunoAtualizado.getValorMensal());
        aluno.setParcelas(alunoAtualizado.getParcelas());

        return repository.save(aluno);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado.");
        }

        pagamentoRepository.deleteByAlunoId(id);
        repository.deleteById(id);
    }

    private void validarAluno(Aluno aluno) {
        if (aluno == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados do aluno nao enviados.");
        }
        if (aluno.getNome() == null || aluno.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do aluno e obrigatorio.");
        }
        if (aluno.getEscola() == null || aluno.getEscola().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escola do aluno e obrigatoria.");
        }

        Double valorContrato = Objects.requireNonNullElse(aluno.getValorContrato(), 0d);
        Double valorRestante = Objects.requireNonNullElse(aluno.getValorRestanteContrato(), valorContrato);

        if (valorContrato < 0 || valorRestante < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valores de contrato nao podem ser negativos.");
        }
        if (valorRestante > valorContrato) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor restante nao pode ser maior que o contrato.");
        }
    }
}
