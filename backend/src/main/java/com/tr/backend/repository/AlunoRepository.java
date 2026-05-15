package com.tr.backend.repository;

import com.tr.backend.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    List<Aluno> findByNomeContainingIgnoreCase(String nome);
    List<Aluno> findByNomeResponsavelContainingIgnoreCase(String nomeResponsavel);
    List<Aluno> findByTelefoneContainingIgnoreCase(String telefone);
    List<Aluno> findByEscolaContainingIgnoreCase(String escola);
}
