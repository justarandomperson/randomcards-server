import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchMakingService } from '../../matchmaking/matchmaking.service';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from './games.service';
import { GamePhase, PlayerState, SOCKET_EVENT_NAMES } from '../shared/games.types';
import QueueDto from '../dto/queue.dto';
import { BasicPlayerData, Match } from '../../matchmaking/matchmaking.types';
import { GamesEmitter } from './games.emitter';
import PlayUnitDto from '../dto/play-unit.dto';
import { deckIdsToDeck } from '../logic/typeConverters';
import PlaySpellDto from '../dto/play-spell.dto';
import { CardLocation, CardZone } from '../../cards/cards.types';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import { ArtifactLocation, ArtifactZone } from '../../artifacts/artifacts.types';


@UsePipes(new ValidationPipe({
	whitelist: true,
	transform: true,
	exceptionFactory: (errors) => new WsException(errors),
}))

@WebSocketGateway({ // also marks as injectable
    cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  }
})


export class GamesGateway implements OnGatewayInit, OnGatewayDisconnect {
	private readonly _logger = new Logger(GamesGateway.name);

	@WebSocketServer()
	server: Server;

	constructor(
		private readonly _gamesService: GamesService,
		private readonly _gamesEmitter: GamesEmitter,
		private readonly _matchMakingService: MatchMakingService,
		private readonly _jwtService: JwtService,
	) {}


	// initializers, getters and setters etc
	private getSocket(socketId: string): Socket {
		const socket = this.server.sockets.sockets.get(socketId);
		if (!socket) {
			throw new WsException("socket not connected");
		}

		return socket;
	}

	private getClientGameId(client: Socket): string {
		if (client.data.gameId) {
			return client.data.gameId;
		}

		throw new WsException("GameId not found");
	}


	// init and disconnect
	afterInit(server: Server) {
		server.use((socket, next) => {
		const token = socket.handshake.auth.token;

		try {
			const payload = this._jwtService.verify(token);

			socket.data.userId = payload.sub;
			socket.data.name = payload.username;

			next();
		} catch {
			next(new Error('Unauthorized'));
		}
		});
	}

	handleDisconnect(client: Socket) {
		this._logger.debug(`Socket ${client.id} disconnected`);
		this._matchMakingService.removeFromQueue(client.id);

		// TODO: if client.data.gameId is set, tell the opponent and remove the room
	}


	// listeners
	@SubscribeMessage(SOCKET_EVENT_NAMES.QUEUE)
	onQueue(@ConnectedSocket() client: Socket, @MessageBody() dto: QueueDto) {
		const deck = deckIdsToDeck(dto);
		client.data.deck = deck; 

		if (!client.data.name) {
			throw new WsException('client doesnt have name');
		}

		const player: BasicPlayerData = { socketId: client.id, name: client.data.name, deckIds: dto };
		const match = this._matchMakingService.addIntoQueue(player);
		if (match) {
			this.handleMatchStart(match);
		}
	}

	private handleMatchStart(match: Match) {
		this._logger.log(`Match ${match.gameId} starting...`);

		// get the matched players
		const player1Id = match.players[0].socketId;
		const player2Id = match.players[1].socketId;
		const player1Socket = this.getSocket(player1Id);
		const player2Socket = this.getSocket(player2Id);

		// connect the players by gameId
		for (const socket of [player1Socket, player2Socket]) {
			socket.data.gameId = match.gameId;
			socket.join(match.gameId);
		}

		// create game
		const player1Deck = player1Socket.data.deck;
		const player2Deck = player2Socket.data.deck;
		if (!player1Deck || !player2Deck) {
			throw new WsException('deck not created');
		}

		const game = this._gamesService.createGameState(match, player1Deck, player2Deck);

		// emit startup events
		this._gamesEmitter.allMatchStartEvents(player1Socket, player2Socket, game);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.DEQUEUE)
	onDequeue(client: Socket) {
		if (client.data.gameId) {
			return;
		}

		this._matchMakingService.removeFromQueue(client.id);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_UNIT)
	onPlayUnit(client: Socket, playUnitDto: PlayUnitDto) {
		const card = this._gamesService.playUnit(this.getClientGameId(client), client.id, playUnitDto);

		const opponent = this._gamesService.getOpponentState(this.getClientGameId(client), client.id);
		const opponentSocket = this.getSocket(opponent.socketId);
		const location: CardLocation = { insideOf: CardZone.BOARD, index: playUnitDto.boardIndex };

		this._gamesEmitter.updateCard(opponentSocket, card, location);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_SPELL)
	onPlaySpell(client: Socket, playSpellDto: PlaySpellDto) {
		const { card, index } = this._gamesService.playSpell(this.getClientGameId(client), client.id, playSpellDto);

		const opponent = this._gamesService.getOpponentState(this.getClientGameId(client), client.id);
		const opponentSocket = this.getSocket(opponent.socketId);
		const location: CardLocation = { insideOf: CardZone.HAND, index: index}

		this._gamesEmitter.updateCard(opponentSocket, card, location);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.BUY_ARTIFACT)
	onBuyArtifact(client: Socket, buyArtifactDto: BuyArtifactDto) {
		const { artifact, index } = this._gamesService.buyArtifact(this.getClientGameId(client), client.id, buyArtifactDto);

		const opponent = this._gamesService.getOpponentState(this.getClientGameId(client), client.id);
		const opponentSocket = this.getSocket(opponent.socketId);
		const location: ArtifactLocation = { insideOf: ArtifactZone.PLAYER, index: index };

		this._gamesEmitter.updateArtifact(opponentSocket, artifact, location, client.id);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.END_TURN)
	onEndTurn(client: Socket) {
		const gameId = this.getClientGameId(client);
		this._gamesService.endTurn(gameId, client.id);

		// start opponents turn
		const opponent = this._gamesService.getOpponentState(gameId, client.id);
		const opponentSocket = this.getSocket(opponent.socketId);
		this.startTurn(opponentSocket, gameId);
		this._gamesEmitter.startTurn(opponentSocket);
	}

	private startTurn(client: Socket, gameId: string) {
		const newTurnData = this._gamesService.startTurn(gameId, client.id);
		if (newTurnData.phaseChanged) {
			this._gamesEmitter.updateGamePhase(this.server, gameId);
		}

		if (newTurnData.phase === GamePhase.PLAY && newTurnData.data) {
			const { newSpell, newMoney, newDrawpileCount } = newTurnData.data;

			if (newSpell) {
				const player = this._gamesService.getPlayerState(gameId, client.id);
				const location: CardLocation = { insideOf: CardZone.HAND, index: player.hand.length};

				this._gamesEmitter.updateCard(client, newSpell, location);
				this._gamesEmitter.updateDrawpileCount(this.server, gameId, client.id, newDrawpileCount);
			}

			this._gamesEmitter.updateMoney(this.server, gameId, client.id, newMoney);
		}
	}


	// TODO: make combat system later
	/*
	@SubscribeMessage('attack')
	attack(client: Socket, attackData: AttackDataDto)
	{
		const gameID = client.data.gameID;

		this._gamesService.attack(client.id, gameID, attackData.attackerID, attackData.targetID)
		
		const updatedBoard = this._gamesService.getUpdatedBoard(gameID)

		this.server.to(gameID).emit('updateBoard', updatedBoard);
	}
	*/
}
