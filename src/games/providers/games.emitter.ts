import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameState, MatchStartPayload, PlayerState, UpdateArtifactPayload, UpdateCardPayload, UpdateDrawpileCountPayload, UpdateHealthPayload, UpdateMoneyPayload } from '../shared/games.types';
import { artifactInstanceToClient, playerStateToClient, spellInstanceToClient, unitInstanceToClient } from '../logic/typeConverters';
import { CardLocation, CardType, SpellInstance, UnitInstance } from '../../cards/cards.types';
import { ArtifactInstance, ArtifactLocation } from '../../artifacts/artifacts.types';
import { WsException } from '@nestjs/websockets';
import { SOCKET_EVENT_NAMES } from '../shared/games.constants';


@Injectable()
export class GamesEmitter {
    allMatchStartEvents(player1Socket: Socket, player2Socket: Socket, gameState: GameState) {
        const player1State = gameState.players.get(player1Socket.id);
        const player2State = gameState.players.get(player2Socket.id);
        if (!player1State || !player2State) {
            //! if this throws then the client dont get match_start but the GameState is created
            //! so we need to delete the GameState before or whatever, deal with this later
            throw new WsException("couldn't find the player states");
        }

        const isPlayer1First = gameState.playerTurnId === player1Socket.id;

        this.matchStart(player1Socket, player1State, player2State, isPlayer1First);
        this.matchStart(player2Socket, player2State, player1State, !isPlayer1First);

        this.allCardEvents(player1Socket, player1State, gameState.board);
        this.allCardEvents(player2Socket, player2State, gameState.board);

        this.updateShop(player1Socket, gameState.shop);
        this.updateShop(player2Socket, gameState.shop);
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

    startTurn(client: Socket) {
        client.emit(SOCKET_EVENT_NAMES.START_TURN);
    }

    updateGamePhase(server: Server, gameId: string) {
        server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_GAME_PHASE);
    }

    updateMoney(server: Server, gameId: string, playerId: string, money: number) {
        const payload: UpdateMoneyPayload = {
            playerId,
            newMoney: money
        };

        server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_MONEY, payload);
    }

    updateHealth(server: Server, gameId: string, playerId: string, health: number) {
        const payload: UpdateHealthPayload = {
            playerId,
            newHealth: health
        };

        server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_HEALTH, payload);
    }

    updateDrawpileCount(server: Server, gameId: string, playerId: string, drawpileCount: number) {
        const payload: UpdateDrawpileCountPayload = {
            playerId,
            newDrawpileCount: drawpileCount
        };

        server.to(gameId).emit(SOCKET_EVENT_NAMES.UPDATE_DRAWPILE_COUNT, payload);
    }

    updateCard(client: Socket, card: UnitInstance | SpellInstance, cardLocation: CardLocation) {
        const clientCardData = (card.type == CardType.UNIT) 
            ? unitInstanceToClient(card) : spellInstanceToClient(card);

        const payload: UpdateCardPayload = {
            card: clientCardData,
            location: cardLocation
        };

       client.emit(SOCKET_EVENT_NAMES.UPDATE_CARD, payload);
    }
    
    updateArtifact(client: Socket, artifact: ArtifactInstance, artifactLocation: ArtifactLocation, playerId?: string) {
        const clientArtifactData = artifactInstanceToClient(artifact);

        const payload: UpdateArtifactPayload = {
            artifact: clientArtifactData,
            location: artifactLocation,
            playerId
        };

        client.emit(SOCKET_EVENT_NAMES.UPDATE_ARTIFACT, payload);
    }

    updateShop(client: Socket, shop: (ArtifactInstance | null)[]) {
        const payload = shop.map((artifact) => artifact ? artifactInstanceToClient(artifact) : artifact);

        client.emit(SOCKET_EVENT_NAMES.UPDATE_SHOP, payload);
    }

    // Note: the functions below currently only activate from allStartEvents() and thats why theyre private

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

    getTarget(server: Server, playerId: string)
    {
        server.to(playerId).emit(SOCKET_EVENT_NAMES.GET_TARGET)
    }

    gameEnd(server: Server, gameId: string, winnerId: string) {
        const payload = { winnerId };

        server.to(gameId).emit(SOCKET_EVENT_NAMES.GAME_END, payload);
    }
}
