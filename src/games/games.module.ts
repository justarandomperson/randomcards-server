import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { MatchMakingService } from '../matchmaking/matchmaking.service'; 
import { GameGateway } from './games';
import { CardsService } from './cards/cards.service';


@Module({
  providers: [GamesService, GameGateway, MatchMakingService, CardsService],
  controllers: [GamesController]
})
export class GamesModule {}
