package com.letter_rush.game_service.controller;

import com.letter_rush.game_service.service.ParagraphService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/paragraph")
public class ParagraphController {

    @Autowired
    ParagraphService paragraphService;

    @GetMapping("/random")
    public String getPassage(){
        return paragraphService.getRandomParagraph();
    }
}
