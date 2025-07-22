package com.telusko.aipoweredlibrarytrackerbackend.controller;

import com.telusko.aipoweredlibrarytrackerbackend.model.Book;
import com.telusko.aipoweredlibrarytrackerbackend.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {
    @Autowired
    private BookService bookService;

    @PostMapping
    public ResponseEntity<Book> addBook(
            @RequestPart("book") @Valid @ModelAttribute Book book,
            @RequestPart(value = "coverImage", required = false) MultipartFile image
    ) throws IOException {
        Book saved = bookService.addBook(book, image);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Book>> getBooks(@RequestParam String email) {
        List<Book> books = bookService.getAllBooks(email);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/generate-description")
    public ResponseEntity<String> generateDescription(
            @RequestParam String title,
            @RequestParam String genre
    ) {
        String desc = bookService.generateDescription(title, genre);
        return ResponseEntity.ok(desc);
    }

    @PostMapping("/generate-image")
    public ResponseEntity<byte[]> generateImage(
            @RequestParam String title,
            @RequestParam String genre,
            @RequestParam String description
    ) {
        byte[] image = bookService.generateImage(title, genre, description);
        return ResponseEntity.ok(image);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/voice-text-search")
    public ResponseEntity<List<Book>> searchByVoice(
            @RequestParam(value = "audio",required = false) MultipartFile audio,
            @RequestParam(value = "query",required = false) String query,
            @RequestParam("email") String email
    ) {
        List<Book> books = bookService.searchByVoice(audio,query,email);
        return ResponseEntity.ok(books);
    }
}
