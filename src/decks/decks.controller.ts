import { Controller, Get } from "@nestjs/common";
import { DecksService } from "./deck.service";
import { type Deck } from "./decks.types";


@Controller('decks')
export class DecksController {
    constructor (private readonly decksService: DecksService) {}

    @Get()
     storage(): Deck {
        return this.decksService.getStorage();
    }
}