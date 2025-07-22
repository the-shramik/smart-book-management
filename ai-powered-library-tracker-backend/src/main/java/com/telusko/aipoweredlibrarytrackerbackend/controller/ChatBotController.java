package com.telusko.aipoweredlibrarytrackerbackend.controller;

import com.telusko.aipoweredlibrarytrackerbackend.model.BotResponse;
import com.telusko.aipoweredlibrarytrackerbackend.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin("*")
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;

    @GetMapping("/ask")
    public ResponseEntity<BotResponse> askBot(@RequestParam String message) {
        String reply = chatBotService.getBotResponse(message);
        return ResponseEntity.ok(new BotResponse(reply));
    }
}