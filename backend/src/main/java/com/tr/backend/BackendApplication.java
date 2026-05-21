package com.tr.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
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
	ObjectMapper objectMapper() {
		return JsonMapper.builder().findAndAddModules().build();
	}

	@Bean
	CommandLineRunner preencherValorRestanteContrato(AlunoRepository alunoRepository, PagamentoRepository pagamentoRepository) {
		return args -> alunoRepository.findAll().stream()
				.forEach(aluno -> {
					if (aluno.getValorRestanteContrato() == null) {
						aluno.setValorRestanteContrato(aluno.getValorContrato());
					}

					double totalPago = pagamentoRepository.findByAlunoId(aluno.getId()).stream()
							.mapToDouble(pagamento -> pagamento.getValor() == null ? 0 : pagamento.getValor())
							.sum();

					boolean contratoFoiUsadoComoSaldo = totalPago > 0
							&& aluno.getValorContrato() != null
							&& aluno.getValorRestanteContrato() != null
							&& BigDecimal.valueOf(aluno.getValorContrato())
									.compareTo(BigDecimal.valueOf(aluno.getValorRestanteContrato())) == 0;

					if (contratoFoiUsadoComoSaldo) {
						BigDecimal valorOriginal = BigDecimal.valueOf(aluno.getValorRestanteContrato())
								.add(BigDecimal.valueOf(totalPago));
						aluno.setValorContrato(valorOriginal.doubleValue());
					}

					if (aluno.getValorRestanteContrato() != null || contratoFoiUsadoComoSaldo) {
						alunoRepository.save(aluno);
					}
				});
	}

}
