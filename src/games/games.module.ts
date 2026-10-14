import { Module } from '@nestjs/common';
import { GamesService } from './providers/games.service';
import { MatchMakingService } from '../matchmaking/matchmaking.service';
import { GamesGateway } from './providers/games.gateway';
import { CardsService } from '../cards/cards.service';
import { GamesEmitter } from './providers/games.emitter';
import { ArtifactsService } from '../artifacts/artifacts.service';
import { DecksService } from '../decks/deck.service';
import { Server } from 'socket.io';


@Module({
  providers: [GamesService, GamesGateway, GamesEmitter, MatchMakingService, CardsService, ArtifactsService, DecksService, Server],
})
export class GamesModule {}
