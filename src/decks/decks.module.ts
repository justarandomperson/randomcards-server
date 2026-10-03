import { Module } from '@nestjs/common';
import { CardsService } from '../cards/cards.service';
import { DecksService } from './deck.service';
import { DecksController } from './decks.controller';


@Module({
  controllers: [DecksController],
  providers: [DecksService, CardsService],
})
export class DecksModule {}