package com.tr.backend.repository;

import com.tr.backend.model.Demanda;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemandaRepository extends JpaRepository<Demanda, Long> {
}
