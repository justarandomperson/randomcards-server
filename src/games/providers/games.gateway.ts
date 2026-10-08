import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchMakingService } from '../../matchmaking/matchmaking.service';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from './games.service';
import { GamePhase, PlayerState } from '../shared/games.types';
import QueueDto from '../dto/queue.dto';
import { BasicPlayerData, Match } from '../../matchmaking/matchmaking.types';
import { GamesEmitter } from './games.emitter';
import PlayUnitDto from '../dto/play-unit.dto';
import PlaySpellDto from '../dto/play-spell.dto';
import { CardLocation, CardZone } from '../../cards/cards.types';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import AttackPlayerDto from '../dto/attack-player.dto';
import AttackUnitDto from '../dto/attack-unit.dto';
import { SOCKET_EVENT_NAMES } from '../shared/games.constants';
import { DecksService } from '../../decks/deck.service';
import SelectedTargetDto from '../dto/selected-target.dto';


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
		private readonly gamesService: GamesService,
		private readonly gamesEmitter: GamesEmitter,
		private readonly matchMakingService: MatchMakingService,
		private readonly decksService: DecksService,
		private readonly jwtService: JwtService
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
				const payload = this.jwtService.verify(token);
				socket.data.userId = payload.sub;
				socket.data.name = payload.username;

				next();
			} 
			catch {
				next(new Error('Unauthorized'));
			}
		});
	}

	handleDisconnect(client: Socket) {
		this._logger.debug(`Socket ${client.id} disconnected`);
		this.matchMakingService.removeFromQueue(client.id);

		// TODO: if client.data.gameId is set, tell the opponent and remove the room
	}


	// listeners
	@SubscribeMessage(SOCKET_EVENT_NAMES.QUEUE)
	onQueue(@ConnectedSocket() client: Socket, @MessageBody() dto: QueueDto) {
		const deck = this.decksService.deckIdsToDeck(dto, client.id);
		client.data.deck = deck; 
		if (!client.data.name) {
			throw new WsException('client doesnt have name');
		}

		const player: BasicPlayerData = { socketId: client.id, name: client.data.name, deckIds: dto };
		const match = this.matchMakingService.addIntoQueue(player);
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

		const game = this.gamesService.createGame(match, player1Deck, player2Deck);

		// emit startup events
		this.gamesEmitter.allMatchStartEvents(player1Socket, player2Socket, game.state);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.DEQUEUE)
	onDequeue(@ConnectedSocket() client: Socket) {
		if (client.data.gameId) {
			return;
		}

		this.matchMakingService.removeFromQueue(client.id);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_UNIT)
	onPlayUnit(@ConnectedSocket() client: Socket, @MessageBody() playUnitDto: PlayUnitDto) {
		const gameId = this.getClientGameId(client);

		const { unit, location, needsTarget } = this.gamesService.playUnit(gameId, client.id, playUnitDto);

		if (needsTarget) {
			this.gamesEmitter.getTarget(client);
		}

		const opponent = this.gamesService.getOpponentState(gameId, client.id);
		const opponentSocket = this.getSocket(opponent.socketId);

		this.gamesEmitter.updateCard(opponentSocket, unit, location);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_SPELL)
	onPlaySpell(@ConnectedSocket() client: Socket, @MessageBody() playSpellDto: PlaySpellDto) {
		const gameId = this.getClientGameId(client);

		const { spell, location } = this.gamesService.playSpell(gameId, client.id, playSpellDto);

		const opponent = this.gamesService.getOpponentState(gameId, client.id);
		const opponentSocket = this.getSocket(opponent.socketId);

		this.gamesEmitter.updateCard(opponentSocket, spell, location);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.BUY_ARTIFACT)
	onBuyArtifact(@ConnectedSocket() client: Socket, @MessageBody() buyArtifactDto: BuyArtifactDto) {
		const gameId = this.getClientGameId(client);

		const { artifact, location } = this.gamesService.buyArtifact(gameId, client.id, buyArtifactDto);

		const opponent = this.gamesService.getOpponentState(gameId, client.id);
		const opponentSocket = this.getSocket(opponent.socketId);

		this.gamesEmitter.updateArtifact(opponentSocket, artifact, location, client.id);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.END_TURN)
	onEndTurn(@ConnectedSocket() client: Socket) {
		const gameId = this.getClientGameId(client);
		this.gamesService.endTurn(gameId, client.id);

		// start opponents turn
		const opponent = this.gamesService.getOpponentState(gameId, client.id);
		const opponentSocket = this.getSocket(opponent.socketId);
		this.handleStartTurn(opponentSocket, gameId);

		this.gamesEmitter.startTurn(opponentSocket);
	}

	private handleStartTurn(client: Socket, gameId: string) {
		const newTurnData = this.gamesService.startTurn(gameId, client.id);
		if (newTurnData.phaseChanged) {
			this.gamesEmitter.updateGamePhase(this.server, gameId);
		}

		if (newTurnData.phase === GamePhase.PLAY && newTurnData.data) {
			const { newSpell, newMoney, newDrawpileCount } = newTurnData.data;

			if (newSpell) {
				const player = this.gamesService.getPlayerState(gameId, client.id);
				const location: CardLocation = { insideOf: CardZone.HAND, index: player.hand.length - 1};

				this.gamesEmitter.updateCard(client, newSpell, location);
				this.gamesEmitter.updateDrawpileCount(this.server, gameId, client.id, newDrawpileCount);
			}

			this.gamesEmitter.updateMoney(this.server, gameId, client.id, newMoney);
		}
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.ATTACK_UNIT)
	attackUnit(@ConnectedSocket() client: Socket, @MessageBody() attackUnitDto: AttackUnitDto) {
		const gameId = this.getClientGameId(client);

		const { attackerData, targetData } = this.gamesService.attackUnit(gameId, client.id, attackUnitDto);

		const opponent = this.gamesService.getOpponentState(gameId, client.id);
		const opponentSocket = this.getSocket(opponent.socketId);

		const attackerDead = attackerData.unit.hp < 0
		const targetDead = targetData.unit.hp < 0

		this.gamesEmitter.updateCard(client, targetData.unit, targetDead ? { insideOf: CardZone.NONE } : targetData.location);
		this.gamesEmitter.updateCard(client, attackerData.unit, attackerData.location);

		this.gamesEmitter.updateCard(opponentSocket, targetData.unit, targetData.location);
		this.gamesEmitter.updateCard(opponentSocket, attackerData.unit, attackerDead ? { insideOf: CardZone.NONE } : attackerData.location);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.ATTACK_PLAYER)
	attackPlayer(@ConnectedSocket() client: Socket, @MessageBody() attackPlayerDto: AttackPlayerDto) {
		const gameId = this.getClientGameId(client);

		const { targetId, health, attackerId } = this.gamesService.attackPlayer(gameId, client.id, attackPlayerDto);

		this.gamesEmitter.updateHealth(this.server, gameId, targetId, health);

		if (health <= 0) {
			this.gamesEmitter.gameEnd(this.server, gameId, attackerId);
		}
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.TARGET_SELECTED)
	selectTarget(@ConnectedSocket() client: Socket, @MessageBody() selectedTargetDto: SelectedTargetDto)
	{
		const gameId = this.getClientGameId(client)
		
		this.gamesService.targetSelected(gameId, client.id, selectedTargetDto.instanceId)
	}
}
