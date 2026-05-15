package com.tr.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Escola {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeEscola;

    private String responsavel;

    private String telefoneResponsavel;

    private String dataBaileFormatura;

    private String mesInicioPagamento;

    private String dataLimiteContrato;

    private Integer quantidadeConvitesContrato;

    private Integer quantidadeSenhasExtras;

    private Double valorSenhaExtra;

    private Double valorBaile;

    private Double valorKitFormatura;

    private Double valorPlacaReplica;

    private Double valorPlacaHomenagem;
}
