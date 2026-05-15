package com.tr.backend.repository;

import com.tr.backend.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    List<Pagamento> findByAlunoId(Long alunoId);
    void deleteByAlunoId(Long alunoId);
}
