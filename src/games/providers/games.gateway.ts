import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchMakingService } from '../../matchmaking/matchmaking.service';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from './games.service';
import QueueDto from '../dto/queue.dto';
import { BasicPlayerData, Match } from '../../matchmaking/matchmaking.types';
import PlayUnitDto from '../dto/play-unit.dto';
import PlaySpellDto from '../dto/play-spell.dto';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import AttackPlayerDto from '../dto/attack-player.dto';
import AttackUnitDto from '../dto/attack-unit.dto';
import { SOCKET_EVENT_NAMES } from '../shared/games.constants';
import { DecksService } from '../../decks/providers/deck.service';
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
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(GamesGateway.name);

	constructor(
		private readonly gamesService: GamesService,
		private readonly matchMaking: MatchMakingService,
		private readonly decks: DecksService,
		private readonly jwt: JwtService
	) {}


	// getters
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
				const payload = this.jwt.verify(token);
				socket.data.userId = payload.sub;
				socket.data.name = payload.username;

				next();
			} 
			catch {
				next(new Error('Unauthorized'));
			}
		});

		this.gamesService.emitter.setServer(server);
	}

	handleDisconnect(client: Socket) {
		this.logger.debug(`Socket ${client.id} disconnected`);
		this.matchMaking.removeFromQueue(client.id);

		if (client.data.gameId) {
			this.gamesService.playerDisconnected(client.data.gameId, client.id);
		}
 	}


	// listeners
	@SubscribeMessage(SOCKET_EVENT_NAMES.QUEUE)
	onQueue(@ConnectedSocket() client: Socket, @MessageBody() dto: QueueDto) {
		if (!client.data.name) {
			throw new WsException('client doesnt have name');
		}

		const deck = this.decks.deckIdsToDeck(dto, client.id);
		client.data.deck = deck; 

		const basicPlayer: BasicPlayerData = { socketId: client.id, name: client.data.name, deckIds: dto };
		const match = this.matchMaking.addIntoQueue(basicPlayer);
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

		//? a bit controversial passing server but i did it alright?!
		this.gamesService.createGame(match, player1Deck, player2Deck, this.server);
		this.gamesService.startMatch(match.gameId, player1Id, player2Id);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.DEQUEUE)
	onDequeue(@ConnectedSocket() client: Socket) {
		if (client.data.gameId) {
			return;
		}

		this.matchMaking.removeFromQueue(client.id);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_UNIT)
	onPlayUnit(@ConnectedSocket() client: Socket, @MessageBody() playUnitDto: PlayUnitDto) {
		const gameId = this.getClientGameId(client);

		this.gamesService.playUnit(gameId, client.id, playUnitDto);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.PLAY_SPELL)
	onPlaySpell(@ConnectedSocket() client: Socket, @MessageBody() playSpellDto: PlaySpellDto) {
		const gameId = this.getClientGameId(client);

		this.gamesService.playSpell(gameId, client.id, playSpellDto);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.BUY_ARTIFACT)
	onBuyArtifact(@ConnectedSocket() client: Socket, @MessageBody() buyArtifactDto: BuyArtifactDto) {
		const gameId = this.getClientGameId(client);

		this.gamesService.buyArtifact(gameId, client.id, buyArtifactDto);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.END_TURN)
	onEndTurn(@ConnectedSocket() client: Socket) {
		const gameId = this.getClientGameId(client);
		this.gamesService.endTurn(gameId, client.id); // also runs the next turn
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.ATTACK_UNIT)
	attackUnit(@ConnectedSocket() client: Socket, @MessageBody() attackUnitDto: AttackUnitDto) {
		const gameId = this.getClientGameId(client);

		this.gamesService.attackUnit(gameId, client.id, attackUnitDto);
	}

	@SubscribeMessage(SOCKET_EVENT_NAMES.ATTACK_PLAYER)
	attackPlayer(@ConnectedSocket() client: Socket, @MessageBody() attackPlayerDto: AttackPlayerDto) {
		const gameId = this.getClientGameId(client);

		this.gamesService.attackPlayer(gameId, client.id, attackPlayerDto);
	}

	
	@SubscribeMessage(SOCKET_EVENT_NAMES.SELECTED_TARGET)
	selectTarget(@ConnectedSocket() client: Socket, @MessageBody() selectedTargetDto: SelectedTargetDto) {
		const gameId = this.getClientGameId(client);
		
		this.gamesService.runCurrentEffect(gameId, client.id, selectedTargetDto);
	}
}
