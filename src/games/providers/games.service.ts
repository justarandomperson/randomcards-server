import { Injectable } from '@nestjs/common';
import { SpellInstance, UnitInstance } from '../../cards/cards.types';
import { CardsService } from '../../cards/cards.service';
import { Game, GamePhase, GameState, PlayerState } from '../shared/games.types';
import { Match } from '../../matchmaking/matchmaking.types';
import { fillShop, initPlayerState } from '../logic/gameSetup';
import { MAX_CARD_IN_BOARD } from '../shared/games.constants';
import { WsException } from '@nestjs/websockets';
import PlayUnitDto from '../dto/play-unit.dto';
import PlaySpellDto from '../dto/play-spell.dto';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import { ArtifactInstance } from '../../artifacts/artifacts.types';
import AttackPlayerDto from '../dto/attack-player.dto';
import AttackUnitDto from '../dto/attack-unit.dto';
import { Deck } from '../../decks/decks.types';
import { ArtifactsService } from '../../artifacts/artifacts.service';
import { GameActions } from './games.actions';
import { Server } from 'socket.io';
import { GamesEmitter } from './games.emitter';


@Injectable()
export class GamesService {
    private readonly _games: Map<string, Game> = new Map();

    constructor(
        public readonly emitter: GamesEmitter,
        private readonly cards: CardsService,
        private readonly artifacts: ArtifactsService
    ) {}


    // initializers
    createGame(match: Match, player1Deck: Deck, player2Deck: Deck, server: Server): Game {
        const [player1, player2] = match.players;

        const player1State = initPlayerState(player1, player1Deck);
        const player2State = initPlayerState(player2, player2Deck);

        const state: GameState = {
            gameId: match.gameId,
            players: new Map([
                [player1.socketId, player1State],
                [player2.socketId, player2State]
            ]),
            board: Array(MAX_CARD_IN_BOARD).fill(null),
            shop: fillShop([]), 
            gamePhase: GamePhase.PLAY,
            playerTurnId: player1.socketId
        };
        const actions = new GameActions(state, this.emitter, this.cards, this.artifacts);
        const game: Game = { state, actions };

        this._games.set(state.gameId, game);
        return game;
    }


    // getters
    getGame(gameId: string): Game {
        const game = this._games.get(gameId);
        if (!game) {
            throw new WsException("Game doesn't exist");
        }

        return game;
    }

    getPlayerState(gameId: string, playerId: string) {
        return this.getGame(gameId).actions.getPlayerState(playerId);
    }

    getOpponentState(gameId: string, playerId: string) {
        return this.getGame(gameId).actions.getOpponentState(playerId);
    }

    removeGame(gameId: string) {
        if (!this._games.has(gameId)) {
            throw new WsException("Game doesn't exist");
        }

        this._games.delete(gameId);
    }


    // services
    startMatch(gameId: string, player1Id: string, player2Id: string) {
        const game = this.getGame(gameId);

        const result = game.actions.startMatch(player1Id, player2Id);

        if (!result) {
            this.removeGame(gameId);
            throw new WsException("couldn't match players");
        }
    }

    playUnit(gameId: string, playerId: string, dto: PlayUnitDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const { card, destination } = this.validatePlayUnit(game, player, dto);

        game.actions.summonUnit(player.socketId, card, destination);
        game.actions.decreasePlayerMoney(player, card.cost);
    }

    private validatePlayUnit(game: Game, player: PlayerState, dto: PlayUnitDto): { card: UnitInstance, destination: number } {
        if (player.socketId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const card = this.cards.findCardInstance(dto.instanceId, player.bench);

        if (player.money < card.cost) {
            throw new WsException('insufficient money');
        }

        const isPlayer1 = game.actions.isPlayer1(player.socketId);
        const destination = isPlayer1 ? 
            dto.boardIndex : game.state.board.length - 1 - dto.boardIndex;

        if (destination > game.state.board.length || destination < 0) {
            throw new WsException('out of bounds');
        } 
        if (game.state.board[destination] != null) {
            throw new WsException ('slot taken');
        }

        return { card, destination };
    }

    playSpell(gameId: string, playerId: string, dto: PlaySpellDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const card = this.validatePlaySpell(game, player, dto);

        game.actions.useSpell(player.socketId, card);
        game.actions.decreasePlayerMoney(player, card.cost);
    }

    private validatePlaySpell(game: Game, player: PlayerState, dto: PlaySpellDto): SpellInstance {
        if (player.socketId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const card = this.cards.findCardInstance(dto.instanceId, player.hand);

        if (player.money < card.cost) {
            throw new WsException('insufficient money');
        }

        return card;
    }

    buyArtifact(gameId: string, playerId: string, dto: BuyArtifactDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const artifact = this.validateBuyArtifact(game, player, dto);

        game.actions.moveArtifactFromShopToInventory(player, artifact);
        game.actions.decreasePlayerMoney(player, artifact.cost);
    }

    private validateBuyArtifact(game: Game, player: PlayerState, dto: BuyArtifactDto): ArtifactInstance {
        if (player.socketId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        } 

        const { artifact } = this.artifacts.findArtifactInstance(dto.instanceId, game.state.shop);

        if (player.money < artifact.cost) {
            throw new WsException('insufficient money');
        }

        return artifact;
    }

    endTurn(gameId: string, playerId: string) {
        const game = this.getGame(gameId);

        if (playerId !== game.state.playerTurnId) {
            throw new WsException("player doesnt match the playerTurnId");
        }

        const player = game.actions.getPlayerState(playerId);
        game.actions.endTurn(player.socketId);
    }

    startTurn(gameId: string, playerId: string) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        game.actions.startTurn(player.socketId);
    }

    attackUnit(gameId: string, playerId: string, dto: AttackUnitDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const { attacker, target } = this.validateAttackUnit(game, player, dto);

        game.actions.attackUnit(player.socketId, target, attacker.atk);
        game.actions.attackUnit(player.socketId, attacker, target.atk);
    }

    private validateAttackUnit(game: Game, player: PlayerState, dto: AttackUnitDto): { attacker: UnitInstance, target: UnitInstance } {
        const attacker = this.cards.findCardInstance(dto.attackerId, game.state.board);
        if (attacker.ownerId != player.socketId) {
            throw new WsException("Invalid attacker");
        }

        const target = this.cards.findCardInstance(dto.targetId, game.state.board);
        
        return { attacker, target }
    }

    attackPlayer(gameId: string, playerId: string, dto: AttackPlayerDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const attacker = this.validateAttackPlayer(game, player, dto);
        const target = (dto.isAttackOpponent) ? this.getOpponentState(gameId, playerId) : player;

        game.actions.attackPlayer(target.socketId, attacker.atk);
    }

    private validateAttackPlayer(game: Game, player: PlayerState, dto: AttackPlayerDto): UnitInstance {
        const attacker = this.cards.findCardInstance(dto.attackerId, game.state.board);
        if (attacker.ownerId != player.socketId) {
            throw new WsException("Invalid attacker");
        }

        return attacker; 
    }

    runCurrentEffect(gameId: string, playerId: string, targetId) {
        const game = this.getGame(gameId)
        const player = game.actions.getPlayerState(playerId);

        game.actions.runCurrentEffect(player);
    }
}
