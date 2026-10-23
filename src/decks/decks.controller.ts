import { Controller, Get } from "@nestjs/common";
import { DecksService } from "./deck.service";
import { type StorageObject } from "./decks.types";


@Controller('decks')
export class DecksController {
    constructor (private readonly decksService: DecksService) {}

    @Get()
     storage(): StorageObject {
        const storage = this.decksService.getStorage();
        const storageObject = {
            units: storage.units,
            spells: Array.from(storage.spells.entries())
        }

        return storageObject
    }
}