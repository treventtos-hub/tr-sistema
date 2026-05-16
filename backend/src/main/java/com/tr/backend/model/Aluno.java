package com.tr.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String nomeResponsavel;

    private String telefoneResponsavel;

    private String telefone;

    private String escola;

    private String turma;

    private String categoria;

    private String formaPagamento;

    private Boolean baile;

    private Boolean kitFormatura;

    private Boolean placaHomenagem;

    private Integer quantidadePlacaHomenagem;

    private Boolean placaReplica;

    private Integer quantidadePlacaReplica;

    private Double valorContrato;

    private Double valorRestanteContrato;

    private Double valorMensal;

    private Integer parcelas;
}
