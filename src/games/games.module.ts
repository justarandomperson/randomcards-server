import { Module } from '@nestjs/common';
import { GamesService } from './providers/games.service';
import { MatchMakingService } from '../matchmaking/matchmaking.service';
import { GamesGateway } from './providers/games.gateway';
import { GamesEmitter } from './providers/games.emitter';
import { DecksService } from '../decks/deck.service';
import { Server } from 'socket.io';
import { InstancesService } from '../instances/instances.service';


@Module({
  providers: [GamesService, GamesGateway, GamesEmitter, MatchMakingService, InstancesService, DecksService, Server],
})
export class GamesModule {}
