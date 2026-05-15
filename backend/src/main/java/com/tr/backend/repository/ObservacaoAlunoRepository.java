package com.tr.backend.repository;

import com.tr.backend.model.ObservacaoAluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObservacaoAlunoRepository extends JpaRepository<ObservacaoAluno, Long> {
    List<ObservacaoAluno> findByAlunoIdOrderByDataCriacaoDesc(Long alunoId);

    void deleteByAlunoId(Long alunoId);
}
