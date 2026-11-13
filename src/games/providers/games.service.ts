import { Injectable } from '@nestjs/common';
import { ArtifactInstance, SpellInstance, UnitInstance } from '../../instances/shared/instances.types';
import { Game, GamePhase, GameState, PlayerState } from '../shared/games.types';
import { Match } from '../../matchmaking/matchmaking.types';
import { initPlayerState } from '../logic/gameSetup';
import { MAX_ARTIFACTS_TO_BUY_PER_TURN, MAX_CARD_IN_BOARD } from '../shared/games.constants';
import { WsException } from '@nestjs/websockets';
import PlayUnitDto from '../dto/play-unit.dto';
import PlaySpellDto from '../dto/play-spell.dto';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import AttackPlayerDto from '../dto/attack-player.dto';
import AttackUnitDto from '../dto/attack-unit.dto';
import { Deck } from '../../decks/shared/decks.types';
import { GameActions } from './games.actions';
import { Server } from 'socket.io';
import { GamesEmitter } from './games.emitter';
import { fillShop, translateBoardIndex } from '../logic/serviceHelpers';
import { InstancesService } from '../../instances/providers/instances.service';
import { artifactsMap } from '../../instances/definitions/artifacts';
import SelectedTargetDto from '../dto/selected-target.dto';


@Injectable()
export class GamesService {
    private readonly _games: Map<string, Game> = new Map();

    constructor(
        public readonly emitter: GamesEmitter,
        private readonly instances: InstancesService,
    ) {}


    // initializers
    createGame(match: Match, player1Deck: Deck, player2Deck: Deck, server: Server): Game {
        const [player1, player2] = match.players;

        const player1State = initPlayerState(player1, player1Deck);
        const player2State = initPlayerState(player2, player2Deck);

        const possibleShopPool = this.instances.generateArtifactInstances([...artifactsMap.values()]);
        const state: GameState = {
            gameId: match.gameId,
            players: new Map([
                [player1.socketId, player1State],
                [player2.socketId, player2State]
            ]),
            board: Array(MAX_CARD_IN_BOARD).fill(null),
            shop: fillShop([null, null, null, null, null,null, null, null, null, null,null, null, null, null, null,null, null, null, null, null,null, null, null, null, null], possibleShopPool), 
            gamePhase: GamePhase.PLAY,
            playerTurnId: player2.socketId,
            possibleShopPool
        };
        const actions = new GameActions(state, this.emitter, this.instances);
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
    playerDisconnected(gameId: string, playerId: string) {
        const game = this.getGame(gameId);

        game.actions.endGame(game.actions.getOpponentId(playerId));

        this.removeGame(gameId);
    }

    startMatch(gameId: string, player1Id: string, player2Id: string) {
        const game = this.getGame(gameId);

        const result = game.actions.startMatch(player1Id, player2Id);

        if (!result) {
            this.removeGame(gameId);
            throw new WsException("couldn't match players");
        }

        game.actions.startTurn();
    }

    playUnit(gameId: string, playerId: string, dto: PlayUnitDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const { unit: card, destination } = this.validatePlayUnit(game, player ,dto);

        game.actions.summonUnit(player.socketId, card, destination);
        game.actions.decreasePlayerMoney(player, card.cost);

    }

    private validatePlayUnit(game: Game, player: PlayerState, dto: PlayUnitDto): { unit: UnitInstance, destination: number } {
        if (player.socketId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const card = this.instances.findInstance(dto.instanceId, player.bench);

        if (card.statuses.cooldown > 0) {
            throw new WsException("unit is in cooldown");
        }
        if (player.money < card.cost) {
            throw new WsException('insufficient money');
        }

        const isPlayer1 = game.actions.isPlayer1(player.socketId);
        const destination = translateBoardIndex(dto.boardIndex, isPlayer1)
        const start = isPlayer1 ? 0 : 4
        const end = isPlayer1 ? 3 : 7

        if (destination > end || destination < start) {
            throw new WsException('out of bounds');
        } 
        if (game.state.board[destination] != null) {
            throw new WsException ('slot taken');
        }


        return { unit: card, destination: destination }
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

        const card = this.instances.findInstance(dto.instanceId, player.hand);

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
        game.actions.incrementArtifactsBought(player);
        game.actions.decreasePlayerMoney(player, artifact.cost);
    }

    private validateBuyArtifact(game: Game, player: PlayerState, dto: BuyArtifactDto): ArtifactInstance {
        if (player.socketId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        } 

        if (player.artifactsBoughtThisTurn >= MAX_ARTIFACTS_TO_BUY_PER_TURN) {
            throw new WsException("already bought max artifacts per turn"); 
        }

        const artifact = this.instances.findInstance(dto.instanceId, game.state.shop);

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

        game.actions.startTurn();
    }


    attackUnit(gameId: string, playerId: string, dto: AttackUnitDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const { attacker, target } = this.validateAttackUnit(game, player, dto);

        game.actions.attackUnit(playerId, target, attacker.atk, attacker);
        game.actions.attackUnit(game.actions.getOpponentState(playerId).socketId, attacker, target.atk);
    }

    private validateAttackUnit(game: Game, player: PlayerState, dto: AttackUnitDto): { attacker: UnitInstance, target: UnitInstance } {
        const attacker = this.validateAttackAny(game, player, dto);  

        if (!attacker.canAttack && !attacker.statuses.haste) {
            throw new WsException("attacker cant attack");
        }

        const opponentBoard = game.actions.getOpponentBoard(player.socketId);
        for (const slot of opponentBoard) {
            const unit = slot.unit;

            if (unit && unit.statuses.taunt && this.instances.getInstanceId(unit) !== dto.targetId) {
                throw new WsException("another enemy unit has taunt"); 
            }
        }

        const target = this.instances.findInstance(dto.targetId, game.state.board);
        
        return { attacker, target }
    }

    attackPlayer(gameId: string, playerId: string, dto: AttackPlayerDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const attacker = this.validateAttackPlayer(game, player, dto);
        const target = (dto.isOpponent) ? this.getOpponentState(gameId, playerId) : player;

        game.actions.attackPlayer(target.socketId, attacker.atk, attacker);
    }

    private validateAttackPlayer(game: Game, player: PlayerState, dto: AttackPlayerDto): UnitInstance {
        const attacker = this.validateAttackAny(game, player, dto);

        if (!attacker.canAttack) {
            throw new WsException("attacker cant attack");
        }

        const opponentBoard = game.actions.getOpponentBoard(player.socketId);
        for (const slot of opponentBoard) {
            const unit = slot.unit;

            if (unit && unit.statuses.taunt) {
                throw new WsException("an enemy unit has taunt"); 
            }
        }

        if (!dto.isOpponent)
        {
            throw new WsException("Player can't attack itself"); 
        }

        return attacker; 
    }

    private validateAttackAny(game: Game, player: PlayerState, dto: AttackUnitDto | AttackPlayerDto): UnitInstance {
        const attacker = this.instances.findInstance(dto.attackerId, game.state.board);

        if (game.state.playerTurnId !== player.socketId) {
            throw new WsException("Can't attack while not in turn")
        }

        if (attacker.ownerId != player.socketId) {
            throw new WsException("Invalid attacker");
        }

        if (attacker.statuses.paralyzed) {
            throw new WsException("attacker is paralyzed");
        }

        return attacker;
    }

    runCurrentEffect(gameId: string, playerId: string, dto: SelectedTargetDto) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const { targetUnit, targetPlayerId } = this.validateRunCurrentEffect(game, player ,dto);

        game.actions.runCurrentEffect(player, targetUnit, targetPlayerId);
    }

    private validateRunCurrentEffect(
        game: Game, player: PlayerState ,dto: SelectedTargetDto
    ) : { targetUnit?: UnitInstance, targetPlayerId?: string } {
        if (dto.isPlayer) {
            const playerKeys = [...game.state.players.keys()];

            for (let i = 0; playerKeys; i++) {
                if (dto.id === playerKeys[i]) {
                    return { targetPlayerId: playerKeys[i] };
                }
            }

            throw new WsException('target is marked as player but id does not fit any player in game');
        }
        else {
            const board = game.state.board;
            const bench = player.bench;

            for (let i = 0; i < board.length; i++) {
                const slot = board[i];
                if (slot && dto.id === slot.instanceId) {
                    return { targetUnit: slot };
                }
            }

             for (let i = 0; i < bench.length; i++) {
                const slot = bench[i];
                if (slot && dto.id === slot.instanceId) {
                    return { targetUnit: slot };
                }
            }

            throw new WsException('target is marked as unit but id does not fit any unit on board');
        }
    }
}