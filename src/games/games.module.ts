import { Module } from '@nestjs/common';
import { GamesService } from './providers/games.service';
import { MatchMakingService } from '../matchmaking/matchmaking.service';
import { GamesGateway } from './providers/games.gateway';
import { CardsService } from '../cards/cards.service';
import { GamesEmitter } from './providers/games.emitter';


@Module({
  providers: [GamesService, GamesGateway, GamesEmitter, MatchMakingService, CardsService]
})
export class GamesModule {}
