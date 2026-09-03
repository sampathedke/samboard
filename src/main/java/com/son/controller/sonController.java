package com.son.controller;

import com.son.model.sonpojo;
import com.son.service.SonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
public class sonController { // Changed to PascalCase

    @Autowired
    private SonService sonService;

    /** 
     * 1. Home Page 
     * Redirects to a default board name (e.g., 'main') 
     */
    @GetMapping("/")
    public String index() {
        return "redirect:/v/main"; 
    }

    /** 
     * 2. View Page 
     * Using /v/{slug} prevents this method from intercepting 
     * requests for static files like favicon.ico or CSS.
     */
    @GetMapping("/v/{slug}")
    public String viewClipboard(@PathVariable String slug, Model model) {
        Optional<sonpojo> entry = sonService.findBySlug(slug);
        
        model.addAttribute("slug", slug);
        model.addAttribute("content", entry.map(sonpojo::getDescriptions).orElse(""));
        model.addAttribute("exists", entry.isPresent());
        
        // This will look for src/main/resources/templates/clipboard.html
        return "clipboard"; 
    }

    /** 
     * 3. API - Save Content 
     * Path: POST /api/clipboard/{slug}
     */
    @PostMapping("/api/clipboard/{slug}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> saveContent(
            @PathVariable String slug,
            @RequestParam("content") String content) {

        Map<String, Object> response = new HashMap<>();

        if (slug == null || slug.isBlank()) {
            response.put("status", "fail");
            response.put("message", "Name cannot be empty.");
            return ResponseEntity.badRequest().body(response);
        }

        sonService.save(slug, content);

        response.put("status", "ok");
        response.put("slug", slug);
        return ResponseEntity.ok(response);
    }

    /** 
     * 4. API - Fetch Content 
     * Path: GET /api/clipboard/{slug}
     */
    @GetMapping("/api/clipboard/{slug}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> fetchContent(@PathVariable String slug) {
        Map<String, Object> response = new HashMap<>();
        Optional<sonpojo> entry = sonService.findBySlug(slug);

        if (entry.isPresent()) {
            response.put("status", "ok");
            response.put("content", entry.get().getDescriptions());
            response.put("updatedAt", entry.get().getUpdatedAt());
        } else {
            response.put("status", "empty");
            response.put("content", "");
        }
        return ResponseEntity.ok(response);
    }
}