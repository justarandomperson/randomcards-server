import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchMakingService } from '../matchmaking/matchmaking.service';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from './games.service';
import { AttackDataDto } from './dto/attack-data.dto';
import { PlayUnitDto } from './dto/play-unit.dto';
import { type DeckIds, SOCKET_EVENT_NAMES } from './games.types';


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


  // listeners
  @SubscribeMessage(SOCKET_EVENT_NAMES.QUEUE)
  onQueue(client: Socket, deck: DeckIds) { //? maybe change deck: DeckIds to a Dto structure?
    const match = this._matchMakingService.addIntoQueue(client.id);
    client.data.deck = deck; //? whats this

    if (!match) {
      return;
    }
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

    // TODO: fix emit to send each player their own data and the opponents data differed
    this.server.to(match.gameID).emit(SOCKET_EVENT_NAMES.MATCH_START, {
      players: [player1.data.username, player2.data.username],
      firstTurn: player1.id
      // gameID: match.gameID, // no reason for that now we will add it later prolly
    });

    this._gamesService.createRoom(
      [
        { id: player1id, deck: player1.data.deck },
        { id: player2id, deck: player2.data.deck },
      ],
      match.gameID,
    );

    // TODO: send each player all of their cards
  }

  @SubscribeMessage(SOCKET_EVENT_NAMES.DEQUEUE)
  onDequeue(client: Socket) {
    this._matchMakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_UNIT)
  onPlayUnit(client: Socket, playUnitDto: PlayUnitDto) {
    const move = this._gamesService.playUnit(
      client.id,
      client.data.gameID,
      playUnitDto
    );

    if (!move) {
      client.emit('invalid'); // TODO: add a "rejected" event to client or something. handle this
      return;
    }

    // TODO: run update_card event for the opponent
  }

  @SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_SPELL)
  onPlaySpell() {
    // TODO: this
  }

  @SubscribeMessage(SOCKET_EVENT_NAMES.BUY_ARTIFACT)
  onBuyArtifact() {
    // TODO: this
  }

  @SubscribeMessage(SOCKET_EVENT_NAMES.END_TURN)
  onEndTurn(client: Socket) {
    const gameID = client.data.gameID;

    const game = this._gamesService.getRoom(gameID);

    this._gamesService.endTurn(client.id, gameID)
    this.startTurn(game.playerTurnID, gameID);
  }

  
  // emitters
  startTurn(id: string, gameID: string) {
    // TODO: this
    // emit START_TURN
  }

  updateGamePhase() {
    // TODO: this
  }

  updateMoney() {
    // TODO: this
  }

  updateHealth() {
    // TODO: this
  }

  updateDrawpileCount() {
    // TODO: this
  }

  updateCard() {
    // TODO: this
  }

  updateArtifact() {
    // TODO: this
  }

  updateHand() {

  }

  updateBench() {

  }

  updateBoard() {

  }

  updateShop() {
    
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
