package com.tr.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class ComissaoFormatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long escolaId;

    private String nomeEscola;

    private Long alunoId;

    private String nomeAluno;

    private String nomeResponsavel;

    private String turma;

    private Double valorContratoOriginal;

    private Double desconto;

    private Double valorContratoComDesconto;
}
