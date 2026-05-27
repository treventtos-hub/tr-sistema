package com.tr.backend;

import com.tr.backend.repository.AlunoRepository;
import com.tr.backend.repository.PagamentoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner preencherValorRestanteContrato(AlunoRepository alunoRepository, PagamentoRepository pagamentoRepository) {
		return args -> alunoRepository.findAll().stream()
				.forEach(aluno -> {
					if (aluno.getValorRestanteContrato() == null) {
						aluno.setValorRestanteContrato(aluno.getValorContrato());
					}

					BigDecimal totalPago = pagamentoRepository.findByAlunoId(aluno.getId()).stream()
							.map(pagamento -> pagamento.getValor() == null ? BigDecimal.ZERO : pagamento.getValor())
							.reduce(BigDecimal.ZERO, BigDecimal::add);

					boolean contratoFoiUsadoComoSaldo = totalPago.signum() > 0
							&& aluno.getValorContrato() != null
							&& aluno.getValorRestanteContrato() != null
							&& aluno.getValorContrato().compareTo(aluno.getValorRestanteContrato()) == 0;

					if (contratoFoiUsadoComoSaldo) {
						BigDecimal valorOriginal = aluno.getValorRestanteContrato().add(totalPago);
						aluno.setValorContrato(valorOriginal);
					}

					if (aluno.getValorRestanteContrato() != null || contratoFoiUsadoComoSaldo) {
						alunoRepository.save(aluno);
					}
				});
	}

}
