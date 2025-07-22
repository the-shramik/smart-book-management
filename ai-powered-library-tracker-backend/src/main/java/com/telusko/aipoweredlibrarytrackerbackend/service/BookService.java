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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    public String generateDescription(String title, String genre) {
        String prompt = """
                Write a short and engaging description for the book:
                Title: %s
                Genre: %s
                Max: 200 characters
                """.formatted(title, genre);

        return chatClient.prompt(prompt).call()
                .chatResponse().getResult().getOutput().getText();
    }

    // Generate cover image
    public byte[] generateImage(String title, String genre, String desc) {
        String imagePrompt = """
                Create a realistic book cover for:
                Title: %s
                Genre: %s
                Description: %s
                Clean background, professional, no human.
                """.formatted(title, genre, desc);

        return aiImageGeneratorService.generateImage(imagePrompt);
    }

    public List<Book> searchByVoice(MultipartFile audio,String userQuery, String email) {
        try {
            String query=null;

            if(audio != null || !audio.isEmpty()) {
                query = aiAudioTranscriptionModel.call(audio.getResource());
            }else {
                query=userQuery;
            }

            // Step 2: Semantic vector search
            List<Document> documents = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(query)
                            .topK(5)
                            .similarityThreshold(0.7f)
                            .build()
            );

            // Step 3: Filter and build context string
            StringBuilder contextBuilder = new StringBuilder();
            for (Document doc : documents) {
                if (email.equals(doc.getMetadata().get("email"))) {
                    contextBuilder.append(doc.getFormattedContent()).append("\n");
                }
            }

            String context = contextBuilder.toString();

            // Step 4: Load prompt template from file
            String promptTemplate = Files.readString(
                    resourceLoader.getResource("classpath:prompts/book-search-prompt.st")
                            .getFile().toPath()
            );

            // Step 5: Fill template variables
            Map<String, Object> variables = new HashMap<>();
            variables.put("userQuery", query);
            variables.put("context", context);

            PromptTemplate template = PromptTemplate.builder()
                    .template(promptTemplate)
                    .variables(variables)
                    .build();

            Prompt prompt = new Prompt(template.createMessage());

            // Step 6: Call AI and get matching book IDs
            Generation generation = chatClient.prompt(prompt)
                    .call()
                    .chatResponse()
                    .getResult();

            // Step 7: Convert AI output to List<Book>
            BeanOutputConverter<List<Book>> outputConverter = new BeanOutputConverter<>(
                    new ParameterizedTypeReference<>() {}
            );

            List<Book> matchedBooks = outputConverter.convert(generation.getOutput().getText());

            return matchedBooks.stream()
                    .filter(book -> book.getId() > 0)
                    .toList();

        } catch (IOException e) {
            throw new RuntimeException("Failed to load or process voice query", e);
        }
    }

    public List<Book> getAllBooks(String email) {
        return bookRepo.findAllByEmail(email);
    }

    public void deleteBook(Long id) {
        bookRepo.deleteById(id);
    }
}
