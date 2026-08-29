import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { MatchMakingService } from '../matchmaking/matchmaking.service'; 
import { GameGateway } from './games';


@Module({
  providers: [GamesService, GameGateway, MatchMakingService],
  controllers: [GamesController]
})
export class GamesModule {}
