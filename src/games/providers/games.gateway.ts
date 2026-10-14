import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchMakingService } from '../../matchmaking/matchmaking.service';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from './games.service';
import { effectEventPayload, GamePhase, PlayerState } from '../shared/games.types';
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
	private readonly logger = new Logger(GamesGateway.name);
	private readonly gamesEmitter: GamesEmitter;
	private effectEvents: effectEventPayload[] = [];

	@WebSocketServer()
	server: Server;

	constructor(
		private readonly gamesService: GamesService,
		private readonly matchMakingService: MatchMakingService,
		private readonly decksService: DecksService,
		private readonly jwtService: JwtService
	) {
		this.gamesEmitter = new GamesEmitter(this.server);
	}


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
		this.logger.debug(`Socket ${client.id} disconnected`);
		this.matchMakingService.removeFromQueue(client.id);

		// TODO: if client.data.gameId is set, tell the opponent and remove the room
	}


	// effect events handler
	addEffectEvent(event: effectEventPayload) {
		this.effectEvents.push(event);
	}

	private emitEffectEvents() {
		while (this.effectEvents.length !== 0) {
			const event = this.effectEvents[0];
			this.emitEffectEvent(event);
			this.effectEvents.shift();
		}
	}

	private emitEffectEvent(event: effectEventPayload) {
		switch(event.name) {
			case SOCKET_EVENT_NAMES.UPDATE_CARD:
				this.gamesEmitter.updateCard(event.payload.clientId, event.payload.card, event.payload.cardLocation);
				break;

			case SOCKET_EVENT_NAMES.UPDATE_ARTIFACT:
				this.gamesEmitter.updateArtifact(
					event.payload.clientId, 
					event.payload.artifact, 
					event.payload.artifactLocation, 
					event.payload.playerId
				);
				break;

			case SOCKET_EVENT_NAMES.UPDATE_MONEY:
				this.gamesEmitter.updateMoney(event.payload.gameId, event.payload.playerId, event.payload.amount);
				break;

			case SOCKET_EVENT_NAMES.UPDATE_HEALTH:
				this.gamesEmitter.updateHealth(event.payload.gameId, event.payload.playerId, event.payload.amount)
				break;

			case SOCKET_EVENT_NAMES.UPDATE_DRAWPILE_COUNT:
				this.gamesEmitter.updateHealth(event.payload.gameId, event.payload.playerId, event.payload.amount)
				break;
		}
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
		this.logger.log(`Match ${match.gameId} starting...`);

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
		this.gamesEmitter.allMatchStartEvents(player1Id, player2Id, game.state);
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
			this.gamesEmitter.getTarget(client.id);
		}

		const opponent = this.gamesService.getOpponentState(gameId, client.id);

		this.gamesEmitter.updateCard(opponent.socketId, unit, location);
		this.emitEffectEvents();
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_SPELL)
	onPlaySpell(@ConnectedSocket() client: Socket, @MessageBody() playSpellDto: PlaySpellDto) {
		const gameId = this.getClientGameId(client);

		const { spell, location } = this.gamesService.playSpell(gameId, client.id, playSpellDto);

		const opponent = this.gamesService.getOpponentState(gameId, client.id);

		this.gamesEmitter.updateCard(opponent.socketId, spell, location);
		this.emitEffectEvents();
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.BUY_ARTIFACT)
	onBuyArtifact(@ConnectedSocket() client: Socket, @MessageBody() buyArtifactDto: BuyArtifactDto) {
		const gameId = this.getClientGameId(client);

		const { artifact, location } = this.gamesService.buyArtifact(gameId, client.id, buyArtifactDto);

		const opponent = this.gamesService.getOpponentState(gameId, client.id);

		this.gamesEmitter.updateArtifact(opponent.socketId, artifact, location, client.id);
		//? shouldnt there be effects that need emitting after this but also why wouldnt we try here? idk
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.END_TURN)
	onEndTurn(@ConnectedSocket() client: Socket) {
		const gameId = this.getClientGameId(client);
		this.gamesService.endTurn(gameId, client.id);

		// start opponents turn
		const opponent = this.gamesService.getOpponentState(gameId, client.id);
		this.handleStartTurn(opponent.socketId, gameId);

		this.gamesEmitter.startTurn(opponent.socketId);
		this.emitEffectEvents();
	}

	private handleStartTurn(clientId: string, gameId: string) {
		const newTurnData = this.gamesService.startTurn(gameId, clientId);
		if (newTurnData.phaseChanged) {
			this.gamesEmitter.updateGamePhase(gameId);
		}

		if (newTurnData.phase === GamePhase.PLAY && newTurnData.data) {
			const { newSpell, newMoney, newDrawpileCount } = newTurnData.data;

			if (newSpell) {
				const player = this.gamesService.getPlayerState(gameId, clientId);
				const location: CardLocation = { insideOf: CardZone.HAND, index: player.hand.length - 1};

				this.gamesEmitter.updateCard(clientId, newSpell, location);
				this.gamesEmitter.updateDrawpileCount(gameId, clientId, newDrawpileCount);
			}

			this.gamesEmitter.updateMoney(gameId, clientId, newMoney);
		}
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.ATTACK_UNIT)
	attackUnit(@ConnectedSocket() client: Socket, @MessageBody() attackUnitDto: AttackUnitDto) {
		const gameId = this.getClientGameId(client);

		const { attackerData, targetData } = this.gamesService.attackUnit(gameId, client.id, attackUnitDto);

		const opponent = this.gamesService.getOpponentState(gameId, client.id);

		const attackerDead = attackerData.unit.hp < 0;
		const attackerLocation: CardLocation = attackerDead ? { insideOf: CardZone.NONE } : attackerData.location;

		const targetDead = targetData.unit.hp < 0;
		const targetLocation: CardLocation = targetDead ? { insideOf: CardZone.NONE } : targetData.location;

		this.gamesEmitter.updateCard(client.id, targetData.unit, targetLocation);
		this.gamesEmitter.updateCard(client.id, attackerData.unit, attackerData.location);

		this.gamesEmitter.updateCard(opponent.socketId, targetData.unit, targetData.location);
		this.gamesEmitter.updateCard(opponent.socketId, attackerData.unit, attackerLocation);

		this.emitEffectEvents();
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.ATTACK_PLAYER)
	attackPlayer(@ConnectedSocket() client: Socket, @MessageBody() attackPlayerDto: AttackPlayerDto) {
		const gameId = this.getClientGameId(client);

		const { targetId, health, attackerId } = this.gamesService.attackPlayer(gameId, client.id, attackPlayerDto);

		this.gamesEmitter.updateHealth(gameId, targetId, health);

		if (health <= 0) {
			this.gamesEmitter.gameEnd(gameId, attackerId);
		}

		this.emitEffectEvents();
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.SELECT_TARGET)
	selectTarget(@ConnectedSocket() client: Socket, @MessageBody() selectedTargetDto: SelectedTargetDto)
	{
		const gameId = this.getClientGameId(client)
		
		this.gamesService.targetSelected(gameId, client.id, selectedTargetDto.instanceId)
	}
}
