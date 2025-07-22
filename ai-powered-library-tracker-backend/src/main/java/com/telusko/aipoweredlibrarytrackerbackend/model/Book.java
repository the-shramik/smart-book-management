package com.telusko.aipoweredlibrarytrackerbackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private String description;
    private String genre;
    private int pageCount;

    private String imageName;
    private String imageType;

    @Lob
    private byte[] coverImage;

    private boolean read;

    private String userEmail; // acts like user ID
}