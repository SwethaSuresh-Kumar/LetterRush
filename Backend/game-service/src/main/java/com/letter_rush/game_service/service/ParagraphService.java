package com.letter_rush.game_service.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class ParagraphService {

    String randomPassageURL="https://random-word-api.herokuapp.com/word?number=50";

    public String getRandomParagraph() {
        RestTemplate restTemplate = new RestTemplate();
        String[] words = restTemplate.getForObject(randomPassageURL, String[].class);
        return  (words.length>0)?String.join(" ", words):"No string";
    }
}
