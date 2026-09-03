package com.son.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.son.model.sonpojo;

@Repository
public interface sonRepo extends JpaRepository<sonpojo, Integer> {
	 Optional<sonpojo> findBySlug(String slug);
}
