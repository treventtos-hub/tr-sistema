package com.tr.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;

    private String nomeAluno;

    private BigDecimal valor;

    private Integer numeroParcela;

    private LocalDateTime dataPagamento;

    private String descricao;
}
