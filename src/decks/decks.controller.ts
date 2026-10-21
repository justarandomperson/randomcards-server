import { Controller, Get } from "@nestjs/common";
import { DecksService } from "./deck.service";
import { type Storage } from "./decks.types";


@Controller('decks')
export class DecksController {
    constructor (private readonly decksService: DecksService) {}

    @Get()
     storage(): Storage {
        return this.decksService.getStorage();
    }
}