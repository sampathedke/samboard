package com.son.service;

import com.son.model.sonpojo;
import com.son.repository.sonRepo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SonService {

    @Autowired
    private sonRepo repo;

    /** Returns existing clipboard by slug, or empty */
    public Optional<sonpojo> findBySlug(String slug) {
        return repo.findBySlug(slug);
    }

    /** Create or overwrite clipboard content for a slug */
    public sonpojo save(String slug, String content) {
        sonpojo entry = repo.findBySlug(slug).orElse(new sonpojo());
        entry.setSlug(slug);
        entry.setDescriptions(content);
        return repo.save(entry);
    }
}