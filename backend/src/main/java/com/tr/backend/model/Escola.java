package com.tr.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import java.math.BigDecimal;

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

    private BigDecimal valorSenhaExtra;

    private BigDecimal valorBaile;

    private BigDecimal valorKitFormatura;

    private BigDecimal valorPlacaReplica;

    private BigDecimal valorPlacaHomenagem;
}
