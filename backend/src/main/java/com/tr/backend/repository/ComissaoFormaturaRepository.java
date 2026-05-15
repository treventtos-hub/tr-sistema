package com.tr.backend.repository;

import com.tr.backend.model.ComissaoFormatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComissaoFormaturaRepository extends JpaRepository<ComissaoFormatura, Long> {
    List<ComissaoFormatura> findByEscolaId(Long escolaId);
    List<ComissaoFormatura> findByAlunoId(Long alunoId);
}
