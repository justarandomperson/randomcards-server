import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
@Injectable()
export class MatchMakingService {
  @WebSocketServer()
  server: Server;

  private queue: string[] = [];

  constructor() {}

  addIntoQueue(socketid: string, deck: string[]) {
    if (this.queue.includes(socketid)) return;
    this.queue.push(socketid);

    if (this.queue.length == 2) {
      return this.startMatch();
    }
  }

  removeFromQueue(socketid: string) {
    if (!this.queue.includes(socketid)) return;
    const index = this.queue.indexOf(socketid);
    this.queue.splice(index, 1);
  }

  startMatch() {
    if (this.queue.length < 2) return null;

    const player1 = this.queue.shift();
    const player2 = this.queue.shift();

    if (!player1 || !player2) return null;

    const gameID = crypto.randomUUID();

    return {
      gameID: gameID,
      players: [player1, player2],
    };
  }
}
