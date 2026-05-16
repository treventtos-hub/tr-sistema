package com.tr.backend.controller;

import com.tr.backend.model.Escola;
import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.EscolaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/escolas")
@CrossOrigin("*")
public class EscolaController {

    private final EscolaRepository repository;
    private final AlunoRepository alunoRepository;

    public EscolaController(EscolaRepository repository, AlunoRepository alunoRepository) {
        this.repository = repository;
        this.alunoRepository = alunoRepository;
    }

    @GetMapping
    public List<Escola> listar() {
        LocalDate hoje = LocalDate.now();

        return repository.findAll().stream()
                .sorted(Comparator
                        .comparingLong((Escola escola) -> prioridadeDataFesta(escola, hoje))
                        .thenComparing(Escola::getNomeEscola, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private static long prioridadeDataFesta(Escola escola, LocalDate hoje) {
        LocalDate dataFesta = dataFestaOrdenacao(escola);
        if (dataFesta == null) {
            return Long.MAX_VALUE;
        }
        if (dataFesta.isBefore(hoje)) {
            return (Long.MAX_VALUE / 2) + ChronoUnit.DAYS.between(dataFesta, hoje);
        }
        return ChronoUnit.DAYS.between(hoje, dataFesta);
    }

    private static LocalDate dataFestaOrdenacao(Escola escola) {
        String dataFesta = escola.getDataBaileFormatura();
        if (dataFesta == null || dataFesta.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dataFesta);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    @PostMapping
    public Escola salvar(@RequestBody Escola escola) {
        return repository.save(escola);
    }

    @PutMapping("/{id}")
    public Escola atualizar(@PathVariable Long id, @RequestBody Escola escolaAtualizada) {
        Escola escola = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Escola nao encontrada."));
        String nomeAnterior = escola.getNomeEscola();

        escola.setNomeEscola(escolaAtualizada.getNomeEscola());
        escola.setResponsavel(escolaAtualizada.getResponsavel());
        escola.setTelefoneResponsavel(escolaAtualizada.getTelefoneResponsavel());
        escola.setDataBaileFormatura(escolaAtualizada.getDataBaileFormatura());
        escola.setMesInicioPagamento(escolaAtualizada.getMesInicioPagamento());
        escola.setDataLimiteContrato(escolaAtualizada.getDataLimiteContrato());
        escola.setQuantidadeConvitesContrato(escolaAtualizada.getQuantidadeConvitesContrato());
        escola.setQuantidadeSenhasExtras(escolaAtualizada.getQuantidadeSenhasExtras());
        escola.setValorSenhaExtra(escolaAtualizada.getValorSenhaExtra());
        escola.setValorBaile(escolaAtualizada.getValorBaile());
        escola.setValorKitFormatura(escolaAtualizada.getValorKitFormatura());
        escola.setValorPlacaReplica(escolaAtualizada.getValorPlacaReplica());
        escola.setValorPlacaHomenagem(escolaAtualizada.getValorPlacaHomenagem());

        Escola escolaSalva = repository.save(escola);
        if (nomeAnterior != null && !nomeAnterior.equals(escolaSalva.getNomeEscola())) {
            alunoRepository.findAll().stream()
                    .filter(aluno -> nomeAnterior.equals(aluno.getEscola()))
                    .forEach(aluno -> {
                        aluno.setEscola(escolaSalva.getNomeEscola());
                        alunoRepository.save(aluno);
                    });
        }

        return escolaSalva;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Escola nao encontrada.");
        }
        repository.deleteById(id);
    }
}
