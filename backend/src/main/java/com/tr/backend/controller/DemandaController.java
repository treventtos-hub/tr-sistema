package com.tr.backend.controller;

import com.tr.backend.model.Demanda;
import com.tr.backend.repository.DemandaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/demandas")
@CrossOrigin("*")
public class DemandaController {

    private final DemandaRepository repository;

    public DemandaController(DemandaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Demanda> listar() {
        return repository.findAll();
    }

    @PostMapping
    public Demanda criar(@RequestBody Demanda demanda) {
        demanda.setId(null);
        return repository.save(demanda);
    }

    @PutMapping("/{id}")
    public Demanda atualizar(@PathVariable Long id, @RequestBody Demanda payload) {
        Demanda demanda = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demanda nao encontrada."));

        demanda.setTitulo(payload.getTitulo());
        demanda.setAluno(payload.getAluno());
        demanda.setDepartamento(payload.getDepartamento());
        demanda.setResponsavel(payload.getResponsavel());
        demanda.setPrazo(payload.getPrazo());
        demanda.setPrioridade(payload.getPrioridade());
        demanda.setStatus(payload.getStatus());
        demanda.setComentarios(payload.getComentarios() == null ? List.of() : payload.getComentarios());
        demanda.setAnexos(payload.getAnexos() == null ? List.of() : payload.getAnexos());
        return repository.save(demanda);
    }

    @PatchMapping("/{id}/status")
    public Demanda atualizarStatus(@PathVariable Long id, @RequestBody Demanda payload) {
        Demanda demanda = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demanda nao encontrada."));
        demanda.setStatus(payload.getStatus());
        return repository.save(demanda);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Demanda nao encontrada.");
        }
        repository.deleteById(id);
    }
}
