package com.tr.backend.repository;

import com.tr.backend.model.Cobranca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CobrancaRepository extends JpaRepository<Cobranca, Long> {
    List<Cobranca> findAllByOrderByDataLembreteAscDataCobrancaDescIdDesc();
    List<Cobranca> findByAlunoIdOrderByDataCobrancaDescIdDesc(Long alunoId);
}
