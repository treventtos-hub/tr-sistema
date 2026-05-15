package com.tr.backend.controller;

import com.tr.backend.model.Aluno;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.ObservacaoAlunoRepository;
import com.tr.backend.repository.PagamentoRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/alunos")
@CrossOrigin("*")
public class AlunoController {

    private final AlunoRepository repository;
    private final PagamentoRepository pagamentoRepository;
    private final ObservacaoAlunoRepository observacaoAlunoRepository;

    public AlunoController(AlunoRepository repository, PagamentoRepository pagamentoRepository, ObservacaoAlunoRepository observacaoAlunoRepository) {
        this.repository = repository;
        this.pagamentoRepository = pagamentoRepository;
        this.observacaoAlunoRepository = observacaoAlunoRepository;
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
        if (aluno.getValorRestanteContrato() == null) {
            aluno.setValorRestanteContrato(aluno.getValorContrato());
        }

        return repository.save(aluno);
    }

    @PutMapping("/{id}")
    public Aluno atualizar(@PathVariable Long id, @RequestBody Aluno alunoAtualizado) {
        Aluno aluno = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado."));

        aluno.setNome(alunoAtualizado.getNome());
        aluno.setNomeResponsavel(alunoAtualizado.getNomeResponsavel());
        aluno.setTelefoneResponsavel(alunoAtualizado.getTelefoneResponsavel());
        aluno.setTelefone(alunoAtualizado.getTelefone());
        aluno.setEscola(alunoAtualizado.getEscola());
        aluno.setTurma(alunoAtualizado.getTurma());
        aluno.setCategoria(alunoAtualizado.getCategoria());
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
        observacaoAlunoRepository.deleteByAlunoId(id);
        repository.deleteById(id);
    }
}
