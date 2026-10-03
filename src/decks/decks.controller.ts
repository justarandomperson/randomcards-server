import { Controller, Get } from "@nestjs/common";


@Controller('decks')
export class DecksController {
    @Get()
    allCards() {
        
    }

}