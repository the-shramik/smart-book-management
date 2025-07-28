package com.telusko.aipoweredlibrarytrackerbackend.service;

import com.telusko.aipoweredlibrarytrackerbackend.model.Book;
import com.telusko.aipoweredlibrarytrackerbackend.repository.BookRepo;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.document.Document;
import org.springframework.ai.openai.OpenAiAudioTranscriptionModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

@Service
public class BookService {

    @Autowired
    private BookRepo bookRepo;

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private AIImageGeneratorService aiImageGeneratorService;

    @Autowired
    private ChatClient chatClient;

    @Autowired
    private OpenAiAudioTranscriptionModel aiAudioTranscriptionModel;

    @Autowired
    private ResourceLoader resourceLoader;


    // Add or update book
    public Book addBook(Book book, MultipartFile image) throws IOException {
        if (image != null && !image.isEmpty()) {
            book.setImageName(image.getOriginalFilename());
            book.setImageType(image.getContentType());
            book.setCoverImage(image.getBytes());
        }

        Book savedBook = bookRepo.save(book);

        String contentToEmbed = """
                Title: %s
                Author: %s
                Description: %s
                Genre: %s
                Pages: %d
                Read: %s
                """.formatted(
                book.getTitle(),
                book.getAuthor(),
                book.getDescription(),
                book.getGenre(),
                book.getPageCount(),
                book.isRead() ? "Yes" : "No"
        );

        Document document = new Document(
                UUID.randomUUID().toString(),
                contentToEmbed,
                Map.of("bookId", String.valueOf(savedBook.getId()), "email", savedBook.getUserEmail())
        );

        vectorStore.add(List.of(document));

        return savedBook;
    }

    // Generate description using AI
//    public String generateDescription(String title, String genre) {
//        String prompt = """
//        You are an expert book assistant.
//        Based on your knowledge of publicly known books, write a short, accurate, and engaging description.
//
//        Book Title: %s
//        Genre: %s
//
//        Instructions:
//        - Use real book knowledge if the book is well-known.
//        - If not, create a realistic but generic 200-character description.
//        - Keep it concise and appealing.
//
//        Max Length: 200 characters.
//        """.formatted(title, genre);
//
//        return chatClient.prompt(prompt)
//                .call()
//                .chatResponse()
//                .getResult()
//                .getOutput()
//                .getText()
//                .trim();
//    }

    // Generate cover image
//    public byte[] generateImage(String title, String genre, String desc) {
//        String imagePrompt = """
//        You are a professional book cover designer.
//
//        Design a high-quality, realistic book cover based on the following details:
//        - Title: %s
//        - Genre: %s
//        - Description: %s
//
//        Style Requirements:
//        - Clean and modern design
//        - Professional typography
//        - No human figures
//        - Use genre-appropriate colors and imagery
//        - Center the title visually
//        - Avoid text except the title (no author, no blurbs)
//
//        Output: Book cover illustration only (not 3D or mockup).
//        """.formatted(title, genre, desc);
//
//        return aiImageGeneratorService.generateImage(imagePrompt);
//    }

    public Book generateCompleteBookDetails(String title) {
        try {
            // Step 1: Enhanced Prompt
            String prompt = """
                    You are a highly intelligent book assistant with access to public databases including Google Books, Amazon, Goodreads, and Wikipedia.
                    
                    Task:
                    Search the web internally for a real book titled "%s" and extract ONLY verified metadata.
                    
                    1. Search your public knowledge base as if you were searching Google, Goodreads, Amazon, or Wikipedia.
                    2. Identify the exact book if available.
                    
                    Return a valid JSON response:
                    {
                      "title": "<Exact title from source>",
                      "author": "<Correct full name of author>",
                      "genre": "<Real genre/category like Fiction, Biography, etc.>",
                      "description": "<Engaging official or summarized description, max 200 characters>",
                      "pageCount": <Exact number of pages, if listed online>
                    }
                    
                    Strict Validation Rules:
                    - DO NOT hallucinate or guess any information.
                    - Use only verifiable, publicly available sources.
                    - If the book is not found online or unverified, return:
                      {
                        "title": "%s",
                        "author": "Unknown",
                        "genre": "Unknown",
                        "description": "No official description available.",
                        "pageCount": 0
                      }
                    
                    Notes:
                    - Prioritize real-world data accuracy over response completion.
                    - If multiple books match, use the most popular or widely listed version.
                    - Return JSON ONLY. Do not include any explanation.
                    """.formatted(title, title);

            // Step 2: Call AI
            Generation generation = Objects.requireNonNull(chatClient.prompt(prompt)
                            .call()
                            .chatResponse())
                    .getResult();

            // Step 3: Convert JSON to Book object
            BeanOutputConverter<Book> outputConverter = new BeanOutputConverter<>(
                    new ParameterizedTypeReference<>() {
                    }
            );
            assert generation.getOutput().getText() != null;
            Book aiBook = outputConverter.convert(generation.getOutput().getText());

            // Step 4: Generate clean AI-based book cover
            assert aiBook != null;

            String imagePrompt = """
                    Create a visually appealing book cover.
                    
                    Book Title: %s
                    Genre: %s
                    Description: %s
                    
                    Cover Design Rules:
                    - Clean, modern design
                    - Genre-specific artwork
                    - No human figures
                    - Centered title, clean background
                    """.formatted(aiBook.getTitle(), aiBook.getGenre(), aiBook.getDescription());

            byte[] imageBytes = aiImageGeneratorService.generateImage(imagePrompt);

            aiBook.setCoverImage(imageBytes);
            aiBook.setImageType("image/png");
            aiBook.setImageName(title.replaceAll(" ", "_").toLowerCase() + ".png");

            return aiBook;

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate accurate book details for: " + title, e);
        }
    }


    public List<Book> searchByVoiceOrText(MultipartFile audio, String userQuery) {
        try {
            // Load prompt template from classpath resource
            String promptTemplate = Files.readString(
                    resourceLoader.getResource("classpath:prompts/book-search-prompt.st")
                            .getFile()
                            .toPath()
            );

            //Determine the search query
            String query = null;

            if (audio != null && !audio.isEmpty()) {
                System.out.println("Audio coming!");
                query = aiAudioTranscriptionModel.call(audio.getResource());
            } else if (userQuery != null && !userQuery.trim().isEmpty()) {
                query = userQuery;
            } else {
                throw new IllegalArgumentException("No audio or text query provided.");
            }

            System.out.println("Final Query: " + query);

            // Fetch related context from vector store using semantic similarity
            String context = fetchSemanticContext(query);

            // Fill variables into the prompt template
            Map<String, Object> variables = new HashMap<>();
            variables.put("userQuery", query);
            variables.put("context", context);

            // Create the full prompt using the template and variables
            PromptTemplate template = PromptTemplate.builder()
                    .template(promptTemplate)
                    .variables(variables)
                    .build();

            Prompt prompt = new Prompt(template.createMessage());

            // Call the AI model to get generated product results
            Generation generation = chatClient.prompt(prompt)
                    .call()
                    .chatResponse()
                    .getResult();

            // Convert the AI's textual output into a list of Product objects
            BeanOutputConverter<List<Book>> outputConverter = new BeanOutputConverter<>(
                    new ParameterizedTypeReference<>() {
                    }
            );

            List<Book> aiProducts = outputConverter.convert(generation.getOutput().getText());

            // Extract valid product IDs (>0) from AI result
            List<Long> bookIds = aiProducts.stream()
                    .map(Book::getId)
                    .filter(id -> id > 0)
                    .toList();

            return bookRepo.findAllById(bookIds);

        } catch (IOException e) {
            throw new RuntimeException("Failed to process query", e);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid bookId format in vector metadata", e);
        }
    }

    // Use vector store to find semantically similar documents based on query
    private String fetchSemanticContext(String query) {
        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(5)                       // get top 5 most similar documents
                        .similarityThreshold(0.7f)     // filter documents with similarity score below threshold
                        .build()
        );

        // Build a combined context string from document contents
        StringBuilder contextBuilder = new StringBuilder();
        for (Document doc : documents) {
            contextBuilder.append(doc.getFormattedContent()).append("\n");
        }

        return contextBuilder.toString();
    }


    public List<Book> getAllBooks(String email) {
        return bookRepo.findAllByUserEmail(email);
    }

    public void deleteBook(Long id) {
        bookRepo.deleteById(id);
    }

    public List<Book> fetchAllBooks() {
        return bookRepo.findAll();
    }

    public Book updateBook(Book book, MultipartFile imageFile) {
        Book existedBook = bookRepo.findById(book.getId()).orElseThrow(() -> new RuntimeException("Book with id " + book.getId() + " does not exist"));

        try {
            if (imageFile != null && !imageFile.isEmpty()) {
                existedBook.setImageName(imageFile.getOriginalFilename());
                existedBook.setImageType(imageFile.getContentType());
                existedBook.setCoverImage(imageFile.getBytes());
            }

            existedBook.setTitle(book.getTitle());
            existedBook.setGenre(book.getGenre());
            existedBook.setDescription(book.getDescription());
            existedBook.setAuthor(book.getAuthor());
            existedBook.setPageCount(book.getPageCount());
            existedBook.setUserEmail(book.getUserEmail());
            existedBook.setRead(book.isRead());
        } catch (IOException e) {
            throw new RuntimeException("Failed to process query", e);
        }

        return bookRepo.save(existedBook);
    }
}
