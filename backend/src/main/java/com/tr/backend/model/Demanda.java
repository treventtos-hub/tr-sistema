package com.tr.backend.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Demanda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;

    private String aluno;

    private String departamento;

    private String responsavel;

    private String prazo;

    private String prioridade;

    private String status;

    @ElementCollection
    @CollectionTable(name = "demanda_comentarios", joinColumns = @JoinColumn(name = "demanda_id"))
    @Column(name = "comentario")
    private List<String> comentarios = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "demanda_anexos", joinColumns = @JoinColumn(name = "demanda_id"))
    @Column(name = "anexo")
    private List<String> anexos = new ArrayList<>();
}
