import { Injectable } from '@nestjs/common';
import { CardZone, SpellInstance, UnitInstance } from '../../cards/cards.types';
import { CardsService } from '../../cards/cards.service';
import { EffectTrigger } from '../../effects/effect.types';
import { GameActions } from '../../cards/game-actions';
import { Deck, GamePhase, GameState, PlayerState } from '../shared/games.types';
import { Match } from '../../matchmaking/matchmaking.types';
import { fillShop, initPlayerState } from '../logic/gameSetup';
import { MAX_ARTIFACTS_IN_SHOP, MAX_CARD_IN_BOARD, MAX_HAND_SIZE } from '../shared/games.constants';
import { WsException } from '@nestjs/websockets';
import PlayUnitDto from '../dto/play-unit.dto';
import { calculateTurnStartMoney, changeGamePhase, CheckPlayUnitValid, findArtifactInstance, findCardInstance, shouldSwitchPhase } from '../logic/serviceHelpers';
import PlaySpellDto from '../dto/play-spell.dto';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import { ArtifactInstance } from '../../artifacts/artifacts.types';


@Injectable()
export class GamesService {
    private readonly _gameStates: Map<string, GameState> = new Map();
    private readonly actions: GameActions;

    constructor(private readonly _cardsService: CardsService) {
        this.actions = new GameActions(_cardsService)
    }


    // initializers, getters and setters etc
    createGameState(match: Match, player1Deck: Deck, player2Deck: Deck): GameState {
        const [player1, player2] = match.players;

        const player1State = initPlayerState(player1, player1Deck);
        const player2State = initPlayerState(player2, player2Deck);

        const game: GameState = {
            gameId: match.gameId,
            players: new Map([
                [player1.socketId, player1State],
                [player2.socketId, player2State]
            ]),
            board: Array(MAX_CARD_IN_BOARD).fill(null),
            shop: fillShop([]), 
            gamePhase: GamePhase.PLAY,
            playerTurnId: player1.socketId //* player1 starts first. this is solid
        };

        this._gameStates.set(game.gameId, game);

        return game;
    }

    getGameState(gameId: string): GameState {
        const game = this._gameStates.get(gameId);
        if (!game) {
            throw new WsException("Game doesn't exist");
        }

        return game;
    }

    removeGameState(gameId: string) {
        if (!this._gameStates.has(gameId)) {
            throw new WsException("Game doesn't exist");
        }

        this._gameStates.delete(gameId);
    }

    getPlayerState(gameId: string, socketId: string): PlayerState {
        const player = this.getGameState(gameId).players.get(socketId);
        if (!player) {
            throw new WsException("Player not in game");
        }

        return player;
    }

    getOpponentState(gameId: string, playerSocketId: string): PlayerState {
        const game = this.getGameState(gameId);

        for (const [socketId, state] of game.players) {
            if (socketId !== playerSocketId) {
                return state;
            }
        }

        throw new WsException("Opponent not in game");
    }

    isPlayer1(gameId: string, socketId: string): boolean {
        return [...this.getGameState(gameId).players.keys()][0] === socketId;
    }

    getPlayersTurns(gameId: string) {
        const game = this.getGameState(gameId);
    }



    // services
    playUnit(gameId: string, socketId: string, playUnitDto: PlayUnitDto): UnitInstance {
        const game = this.getGameState(gameId);
        if (socketId !== game.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const player = this.getPlayerState(gameId, socketId);
        const { instanceId, boardIndex } = playUnitDto;
        const cardInstanceResult = findCardInstance(instanceId, player.bench);
        if (!cardInstanceResult) {
            throw new WsException('card not found');
        }

        const { cardInstance, index: benchIndex } = cardInstanceResult;
        if (player.money < cardInstance.cost) {
            throw new WsException('insufficient money');
        }

        const isPlayer1 = this.isPlayer1(gameId, socketId);
        const translatedDestination = (isPlayer1 ? boardIndex : game.board.length - 1 - boardIndex);

        const message = CheckPlayUnitValid(game, translatedDestination);
        if (message) {
            throw new WsException(message);
        }

        // make the move
        game.board[translatedDestination] = cardInstance;
        player.bench[benchIndex] = null;
        player.money -= cardInstance.cost;

        return cardInstance;
    }

    playSpell(gameId: string, socketId: string, playSpellDto: PlaySpellDto): { card: SpellInstance; index: number } {
        const game = this.getGameState(gameId);
        if (socketId !== game.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const player = this.getPlayerState(gameId, socketId);
        const { instanceId } = playSpellDto;
        const cardInstanceResult = findCardInstance(instanceId, player.hand);
        if (!cardInstanceResult) {
            throw new WsException('card not found');
        }

        const { cardInstance, index: handIndex } = cardInstanceResult;
        if (player.money < cardInstance.cost) {
            throw new WsException('insufficient money');
        }

        // discard spell
        player.hand.splice(handIndex, 1);
        player.money -= cardInstance.cost;

        return {card: cardInstance, index: handIndex};    
    }

    buyArtifact(gameId: string, socketId: string, buyArtifactDto: BuyArtifactDto): { artifact: ArtifactInstance, index: number } {
        const game = this.getGameState(gameId);
        if (socketId !== game.playerTurnId) {
            throw new WsException("Not players turn");
        } 

        const player = this.getPlayerState(gameId, socketId);
        const { instanceId } = buyArtifactDto;
        const artifactInstanceResult = findArtifactInstance(instanceId, game.shop);
        if (!artifactInstanceResult) {
            throw new WsException('artifact not found');
        }

        const { artifactInstance, index: shopIndex } = artifactInstanceResult;
        if (player.money < artifactInstance.cost) {
            throw new WsException('insufficient money');
        }

        // buy artifact
        game.shop[shopIndex] = null;
        player.artifacts.push(artifactInstance);
        player.money -= artifactInstance.cost;

        return { 
            artifact: artifactInstance,
            index: player.artifacts.length
        };
    }

    endTurn(gameId: string, playerSocketId: string) {
        const game = this.getGameState(gameId);
        if (game.playerTurnId !== playerSocketId) {
        throw new WsException("player doesnt match the playerTurnId");
        }

        const opponent = this.getOpponentState(gameId, playerSocketId);

        game.playerTurnId = opponent.socketId;
        /* this.triggerUnits(game, opponent.socketId, "onTurnEnd"); */ // TODO: effect system later
    }

    startTurn(gameId: string, playerSocketId: string) {
        const game = this.getGameState(gameId);
        const player = this.getPlayerState(gameId, playerSocketId);
        const opponent = this.getOpponentState(gameId, playerSocketId);

        const phaseChanged = shouldSwitchPhase(game.gamePhase, player.turn, opponent.turn);
        if (phaseChanged) {
            game.gamePhase = changeGamePhase(game.gamePhase);
        }

        player.turn++;

        switch (game.gamePhase) {
            case GamePhase.PLAY:
                return { 
                    phase: GamePhase.PLAY,
                    data: this.handleStartTurnPlay(gameId, player), 
                    phaseChanged: phaseChanged 
                };

            case GamePhase.SHOP:
                this.handleStartTurnShop(gameId);

                return { 
                    phase: GamePhase.SHOP,
                    phaseChanged: phaseChanged 
                };
        }
    }

    private handleStartTurnPlay(gameId: string, player: PlayerState) {
        const newSpell = this.drawSpell(player);
        const newMoney = this.giveTurnStartMoney(gameId, player);

        return { 
            newSpell, 
            newMoney, 
            newDrawpileCount: player.hand.length 
        };
    }

    private handleStartTurnShop(gameId: string) {
        const game = this.getGameState(gameId);
        if (game.shop.length !== MAX_ARTIFACTS_IN_SHOP) {
            game.shop = fillShop(game.shop);
        }
    }

    private drawSpell(player: PlayerState): SpellInstance | null {
        if (player.hand.length === MAX_HAND_SIZE) {
            return null;
        }

        const spellInstance = player.drawpile.pop(); // TODO: add logic to drawing a card (randomly) later
        if (!spellInstance) {
            return null;
        }

        player.hand.push(spellInstance);
        return spellInstance;
    }

    private giveTurnStartMoney(gameId: string, player: PlayerState): number {
        const newMoney = calculateTurnStartMoney(player.money, player.turn);

        player.money = newMoney;

        return newMoney;
    }


    // TODO: get around to checking these
    getPlayerGame(playerID: string, gameID: string) {
        const game = this.getGameState(gameID);

        if (!game.players.has(playerID))
        throw new Error('player not in game');

        const isPlayer1 = playerID === game.players.entries().next().value?.[1].socketId
        const playerState = game.players.get(playerID) as PlayerState

        return {
            isPlayer1,
            hand: playerState.hand,
            bench: playerState.bench,
            game,
        };
    }

    getUpdatedHand(playerID: string, gameID: string) {
        const context = this.getPlayerGame(playerID, gameID);
        return context.hand;
    }

    getUpdatedBench(playerID: string, gameID: string) {
        const context = this.getPlayerGame(playerID, gameID);
        return context.bench;
    }

    getUpdatedBoard(gameID: string) {
        const game = this.getGameState(gameID);
        return game.board;
    }

    // TODO: make combat system later
    /*
    private triggerUnits(game: GameState, playerID: string, trigger: EffectTrigger)
    {
        const summonedUnits = game.board.filter(
        (unit): unit is UnitInstance => unit?.ownerID === playerID
        );
        summonedUnits.map((unit) => {
        unit.effects.map((effect) => {
            if (effect.trigger.includes(trigger))
            {
            effect.execute({game: game, playerId: playerID, actions: this.actions, source: unit})
            }
        })
        })
    }

    attack(playerID: string, gameID: string, attackerID: string, targetID: string)
    {
        const context = this.getPlayerGame(playerID, gameID)
        const { game } = context

        const attackerInstance = this.actions.findUnitInstance(game, attackerID)
        const targetInstance = this.actions.findUnitInstance(game, targetID)

        if (attackerInstance.ownerID != playerID || targetInstance.ownerID == playerID) throw new Error("Invalid targets")

        this.actions.dealDamageToUnitInstance(game, targetInstance, attackerInstance.atk)
        this.actions.dealDamageToUnitInstance(game, attackerInstance, targetInstance.atk)
    }
    */
}
