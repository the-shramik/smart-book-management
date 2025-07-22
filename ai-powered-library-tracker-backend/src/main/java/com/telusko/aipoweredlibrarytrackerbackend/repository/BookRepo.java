package com.telusko.aipoweredlibrarytrackerbackend.repository;

import com.telusko.aipoweredlibrarytrackerbackend.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepo extends JpaRepository<Book,Long> {

    List<Book> findAllByEmail(String email);
}
