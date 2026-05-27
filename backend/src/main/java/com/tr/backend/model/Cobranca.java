package com.tr.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class Cobranca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long alunoId;

    private String nomeAluno;

    private String nomeResponsavel;

    private String telefoneResponsavel;

    private String escola;

    private String turma;

    private String status;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    private LocalDate dataCobranca;

    private LocalDate dataLembrete;

    private LocalDateTime criadoEm;

    private LocalDateTime atualizadoEm;

    private String criadoPor;

    private String atualizadoPor;
}
