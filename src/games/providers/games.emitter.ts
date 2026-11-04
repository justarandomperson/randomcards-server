import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameState, MatchStartPayload, PlayerState, selectTargetFilter, UpdateArtifactPayload, UpdateCardPayload, UpdateDrawpileCountPayload, UpdateHealthPayload, UpdateMoneyPayload } from '../shared/games.types';
import { artifactInstanceToClient, playerStateToClient, spellInstanceToClient, unitInstanceToClient } from '../logic/typeConverters';
import { ArtifactInstance, InstanceLocation, InstanceType, SpellInstance, UnitInstance } from '../../instances/shared/instances.types';
import { WsException } from '@nestjs/websockets';
import { SOCKET_EVENT_NAMES } from '../shared/games.constants';


@Injectable()
export class GamesEmitter {
    private server: Server

    constructor(server: Server) {
        this.setServer(server);
    }

    setServer(server: Server) {
        this.server = server;
    }

    // initializers, getters setters etc
	private playerIdToSocket(socketId: string): Socket {
		const socket = this.server.sockets.sockets.get(socketId)
		if (!socket) {
			throw new WsException("socket not connected");
		}

		return socket;
	}

    // SERVICES
    // match start
    allMatchStartEvents(gameState: GameState, player1Id: string, player2Id: string): boolean {
        const player1State = gameState.players.get(player1Id);
        const player2State = gameState.players.get(player2Id);
        if (!player1State || !player2State) {
            return false;
        }

        const isPlayer1First = gameState.playerTurnId === player1Id;

        const player1Socket = this.playerIdToSocket(player1Id);
        const player2Socket = this.playerIdToSocket(player2Id);

        this.matchStart(player1Socket, player1State, player2State, isPlayer1First);
        this.matchStart(player2Socket, player2State, player1State, !isPlayer1First);

        this.allCardEvents(player1Socket, player1State, gameState.board);
        this.allCardEvents(player2Socket, player2State, gameState.board);

        this.updateShop(player1Id, gameState.shop);
        this.updateShop(player2Id, gameState.shop);

        return true;
    }

    private matchStart(client: Socket, playerState: PlayerState, opponentState: PlayerState, isFirstTurn: boolean) {
        const playerData = playerStateToClient(playerState);
        const opponentData = playerStateToClient(opponentState);

        const payload: MatchStartPayload = {
            playerData: playerData,
            opponentData: opponentData,
            isFirstTurn
        };

        client.emit(SOCKET_EVENT_NAMES.MATCH_START, payload);
    }

    private allCardEvents(client: Socket, player: PlayerState, board: (UnitInstance | null)[]) {
        this.updateHand(client, player.hand);
        this.updateBench(client, player.bench);
        this.updateBoard(client, board);
    }

    private updateHand(client: Socket, hand: SpellInstance[]) {
        const payload = hand.map((spell) => spellInstanceToClient(spell));

        client.emit(SOCKET_EVENT_NAMES.UPDATE_HAND, payload);
    }

    private updateBench(client: Socket, bench: (UnitInstance | null)[]) {
        const payload = bench.map((unit) => unit ? unitInstanceToClient(unit) : unit);

        client.emit(SOCKET_EVENT_NAMES.UPDATE_BENCH, payload);
    }

    private updateBoard(client: Socket, board: (UnitInstance | null)[]) {
        const payload = board.map((unit) => unit ? unitInstanceToClient(unit) : unit);

        client.emit(SOCKET_EVENT_NAMES.UPDATE_BOARD, payload);
    }


    // client specific
    updateShop(clientId: string, shop: (ArtifactInstance | null)[]) {
        const client = this.playerIdToSocket(clientId);
        const payload = shop.map((artifact) => artifact ? artifactInstanceToClient(artifact) : null);

        client.emit(SOCKET_EVENT_NAMES.UPDATE_SHOP, payload);
    }

    startTurn(clientId: string) {
        const client = this.playerIdToSocket(clientId);

        client.emit(SOCKET_EVENT_NAMES.START_TURN);
    }

    updateCard(clientId: string, card: UnitInstance | SpellInstance, cardLocation: InstanceLocation) {
        const client = this.playerIdToSocket(clientId);

        const clientCardData = (card.type == InstanceType.UNIT) 
            ? unitInstanceToClient(card) : spellInstanceToClient(card);

        const payload: UpdateCardPayload = {
            card: clientCardData,
            location: cardLocation
        };

       client.emit(SOCKET_EVENT_NAMES.UPDATE_CARD, payload);
    }

    updateArtifactBoth(gameId: string, artifact: ArtifactInstance, artifactLocation: InstanceLocation) {
        const clientArtifactData = artifactInstanceToClient(artifact);

        const payload: UpdateArtifactPayload = {
            artifact: clientArtifactData,
            location: artifactLocation
        };

        this.server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_ARTIFACT, payload);
    }
    
    updateArtifact(clientId: string, artifact: ArtifactInstance, artifactLocation: InstanceLocation, playerId?: string) {
        const client = this.playerIdToSocket(clientId);
        const clientArtifactData = artifactInstanceToClient(artifact);

        const payload: UpdateArtifactPayload = {
            artifact: clientArtifactData,
            location: artifactLocation,
            playerId
        };

        client.emit(SOCKET_EVENT_NAMES.UPDATE_ARTIFACT, payload);
    }

    selectTarget(clientId: string, filter: selectTargetFilter) {
        const client = this.playerIdToSocket(clientId);

        client.emit(SOCKET_EVENT_NAMES.SELECT_TARGET, Array.from(filter));
    }


    // to both players
    updateGamePhase(gameId: string) {
        this.server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_GAME_PHASE);
    }

    updateMoney(gameId: string, playerId: string, money: number) {
        const payload: UpdateMoneyPayload = {
            playerId,
            newMoney: money
        };

        this.server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_MONEY, payload);
    }

    updateHealth(gameId: string, playerId: string, health: number) {
        const payload: UpdateHealthPayload = {
            playerId,
            newHealth: health
        };

        this.server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_HEALTH, payload);
    }

    updateDrawpileCount(gameId: string, playerId: string, drawpileCount: number) {
        const payload: UpdateDrawpileCountPayload = {
            playerId,
            newDrawpileCount: drawpileCount
        };

        this.server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_DRAWPILE_COUNT, payload);
    }

    opponentPlayedSpell(clientId: string, spell: SpellInstance) {
        const client = this.playerIdToSocket(clientId);
        const payload = spellInstanceToClient(spell);

        client.emit(SOCKET_EVENT_NAMES.OPPONENT_PLAYED_SPELL, payload);
    }

    gameEnd(gameId: string, winnerId: string) {
        const payload = { winnerId };

        this.server.to(gameId).emit(SOCKET_EVENT_NAMES.GAME_END, payload);
    }
}
