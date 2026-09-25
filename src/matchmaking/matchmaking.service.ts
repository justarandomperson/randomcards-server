import { Injectable } from '@nestjs/common';
import { BasicPlayerData, type Match } from './matchmaking.types';
import { PLAYERS_IN_MATCH } from './matchmaking.constants';
import { randomUUID } from 'crypto';


@Injectable()
export class MatchMakingService {
  private queue: BasicPlayerData[] = [];


  addIntoQueue(player: BasicPlayerData): Match | null {
    const isPlayerInQueue = this.queue.some((p) => p.socketId === player.socketId);
    if (isPlayerInQueue) {
      return null; // TODO: probably should throw an expection but then the games.gateway needs to handle it
    }

    this.queue.push(player);

    if (this.queue.length >= PLAYERS_IN_MATCH) {
      return this.createMatch();
    }

    return null;
  }

  removeFromQueue(clientId: string) {
    this.queue = this.queue.filter((player) => player.socketId !== clientId);
  }

  private createMatch(): Match | null {
    if (this.queue.length < PLAYERS_IN_MATCH) {
      return null;
    } 

    const player1 = this.queue.shift();
    const player2 = this.queue.shift();
    if (!player1 || !player2) {
      return null;
    }

    const gameId = randomUUID();

    return {
      gameId: gameId,
      players: [player1, player2],
    };
  }
}
