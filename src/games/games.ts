import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchMakingService } from '../matchmaking/matchmaking.service';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from './games.service';
import { AttackDataDto } from './dto/attack-data.dto';
import { PlayUnitDto } from './dto/play-unit.dto';


@WebSocketGateway({  
    cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  }
})


export class GameGateway implements OnModuleInit {
  constructor(
    private _gamesService: GamesService,
    private _matchMakingService: MatchMakingService,
    private _jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      socket.on('disconnect', (reason) => { 
        console.log(`Socket ${socket.id} disconnected: ${reason}`); //* debug message
        this._matchMakingService.removeFromQueue(socket.id);
      });
    });
  }

  afterInit(server: Server) {
    server.use((socket, next) => {
      const token = socket.handshake.auth.token;

      try {
        const payload = this._jwtService.verify(token);

        socket.data.userId = payload.sub;
        socket.data.username = payload.username;

        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  @SubscribeMessage('queue')
  onQueue(client: Socket, deck: string[]) {
    const match = this._matchMakingService.addIntoQueue(client.id);
    console.log(client);
    client.data.deck = deck;

    if (!match) return;
    console.log(`Match ${match.gameID} starting...`); //* debug message

    const [player1id, player2id] = match.players;

    const player1 = this.server.sockets.sockets.get(player1id);
    const player2 = this.server.sockets.sockets.get(player2id);

    if (!player1 || !player2)
      throw new Error("couldn't get the players to match");

    player1.data.gameID = match.gameID;
    player2.data.gameID = match.gameID;

    player1.join(match.gameID);
    player2.join(match.gameID);

    this.server.to(match.gameID).emit('match_start', {
      players: [player1.data.username, player2.data.username],
      gameID: match.gameID,
      firstTurn: player1.id,
    });

    this._gamesService.createRoom(
      [
        { id: player1id, deck: player1.data.deck },
        { id: player2id, deck: player2.data.deck },
      ],
      match.gameID,
    );

    this.updatePlayer(player1id, match.gameID);
    this.updatePlayer(player2id, match.gameID);
  }

  @SubscribeMessage('dequeue')
  onDequeue(client: Socket) {
    this._matchMakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage('play_unit')
  playUnit(client: Socket, playUnitData: PlayUnitDto) {
    const move = this._gamesService.playUnit(
      client.id,
      client.data.gameID,
      playUnitData,
    );

    if (!move) {
      client.emit('invalid');
      return;
    }

    //? maybe change how this works to an 'update_card' event?
    this.server.to(client.data.gameID).emit('made_move', {
      card: move.card,
      destination: move.position,
    });
  }

  @SubscribeMessage('end_turn')
  endTurn(client: Socket) {
    const gameID = client.data.gameID;

    const game = this._gamesService.getRoom(gameID);

    this._gamesService.endTurn(client.id, gameID)
    this.startPlayerTurn(game.playerTurnID, gameID);
  }

  startPlayerTurn(id: string, gameID: string) {
    this.server.to(id).emit('start_turn');
    this._gamesService.startTurn(id, gameID)
    this.updatePlayer(id, gameID);
  }

  updatePlayer(id: string, gameID: string) {
    // TODO: refactor later
    try {
        const updatedHand = this._gamesService.getUpdatedHand(id, gameID);
        const updatedBench = this._gamesService.getUpdatedBench(id, gameID);
        const updatedBoard = this._gamesService.getUpdatedBoard(gameID);

        this.server.to(id).emit('update_hand', updatedHand);
        this.server.to(id).emit('update_bench', updatedBench);
        this.server.to(id).emit('update_board', updatedBoard);
    } catch (err) {
        console.error('updatePlayer failed:', err);
    }
  }

  // TODO: make combat system later
  @SubscribeMessage('attack')
  attack(client: Socket, attackData: AttackDataDto)
  {
    const gameID = client.data.gameID;

    this._gamesService.attack(client.id, gameID, attackData.attackerID, attackData.targetID)
    
    const updatedBoard = this._gamesService.getUpdatedBoard(gameID)

    this.server.to(gameID).emit('updateBoard', updatedBoard);
  }
}
