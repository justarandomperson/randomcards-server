import { Injectable } from '@nestjs/common';
import { CardLocation, CardZone, SpellAndLocation, SpellInstance, UnitAndLocation, UnitInstance } from '../../cards/cards.types';
import { CardsService } from '../../cards/cards.service';
import { GameActions } from '../logic/gameActions';
import { Game, GamePhase, GameState, PlayerState } from '../shared/games.types';
import { Match } from '../../matchmaking/matchmaking.types';
import { fillShop, initPlayerState } from '../logic/gameSetup';
import { MAX_CARD_IN_BOARD, MAX_HAND_SIZE } from '../shared/games.constants';
import { WsException } from '@nestjs/websockets';
import PlayUnitDto from '../dto/play-unit.dto';
import { calculateTurnStartMoney, changeGamePhase, CheckPlayUnitValid, shouldSwitchPhase } from '../logic/serviceHelpers';
import PlaySpellDto from '../dto/play-spell.dto';
import BuyArtifactDto from '../dto/buy-artifact.dto';
import { ArtifactAndLocation, ArtifactZone } from '../../artifacts/artifacts.types';
import AttackPlayerDto from '../dto/attack-player.dto';
import AttackUnitDto from '../dto/attack-unit.dto';
import { Deck } from '../../decks/decks.types';
import { DecksService } from '../../decks/deck.service';
import { ArtifactsService } from '../../artifacts/artifacts.service';
import { Effect, EFFECT_TRIGGERS, EffectTrigger } from '../../effects/effect.types';


@Injectable()
export class GamesService {
    private readonly _games: Map<string, Game> = new Map();

    constructor(
        private readonly cardsService: CardsService,
        private readonly artifactsService: ArtifactsService
    ) {}


    // initializers, getters and setters etc
    createGame(match: Match, player1Deck: Deck, player2Deck: Deck): Game {
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
            playerTurnId: player1.socketId //* player1 starts first. this is solid
        };

        const game: Game = {
            state,
            actions: new GameActions(state, this.cardsService)
        }

        this._games.set(state.gameId, game);

        return game;
    }

    getGame(gameId: string): Game {
        const game = this._games.get(gameId);
        if (!game) {
            throw new WsException("Game doesn't exist");
        }

        return game;
    }

    removeGame(gameId: string) {
        if (!this._games.has(gameId)) {
            throw new WsException("Game doesn't exist");
        }

        this._games.delete(gameId);
    }

    getPlayerState(gameId: string, playerId: string) {
        return this.getGame(gameId).actions.getPlayerState(playerId);
    }

    getOpponentState(gameId: string, playerId: string) {
        return this.getGame(gameId).actions.getOpponentState(playerId);
    }


    // services
    playUnit(gameId: string, playerId: string, playUnitDto: PlayUnitDto): UnitAndLocation & { needsTarget: boolean } {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        if (playerId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const { instanceId, boardIndex } = playUnitDto;
        const cardInstanceResult = this.cardsService.findCardInstance(instanceId, player.bench);
        if (!cardInstanceResult) {
            throw new WsException('card not found');
        }

        const { card, index: benchIndex } = cardInstanceResult;
        if (player.money < card.cost) {
            throw new WsException('insufficient money');
        }

        const isPlayer1 = game.actions.isPlayer1(playerId);
        const translatedDestination = (isPlayer1 ? boardIndex : game.state.board.length - 1 - boardIndex);

        const message = CheckPlayUnitValid(game.state, translatedDestination);
        if (message) {
            throw new WsException(message);
        }

        // make the move
        game.actions.moveUnitToBoard(playerId, card, translatedDestination, benchIndex);
        game.actions.removeMoney(playerId, card.cost);

        const needsTarget = this.triggerUnit(game, playerId, EFFECT_TRIGGERS.SUMMON, card)

        return {
            unit: card,
            location: { insideOf: CardZone.BOARD, index: boardIndex },
            needsTarget
        };
    }

    playSpell(gameId: string, playerId: string, playSpellDto: PlaySpellDto): SpellAndLocation {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        if (playerId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        }

        const { instanceId } = playSpellDto;
        const cardInstanceResult = this.cardsService.findCardInstance(instanceId, player.hand);
        if (!cardInstanceResult) {
            throw new WsException('card not found');
        }

        const { card, index: handIndex } = cardInstanceResult;
        if (player.money < card.cost) {
            throw new WsException('insufficient money');
        }

        // discard spell
        game.actions.moveSpellToDrawpile(playerId, card, handIndex);
        game.actions.removeMoney(playerId, card.cost);

        return { 
            spell: card, 
            location: { insideOf: CardZone.NONE }
        };    
    }

    buyArtifact(gameId: string, playerId: string, buyArtifactDto: BuyArtifactDto): ArtifactAndLocation {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        if (playerId !== game.state.playerTurnId) {
            throw new WsException("Not players turn");
        } 

        const { instanceId } = buyArtifactDto;
        const artifactInstanceResult = this.artifactsService.findArtifactInstance(instanceId, game.state.shop);
        if (!artifactInstanceResult) {
            throw new WsException('artifact not found');
        }

        const { artifactInstance, index: shopIndex } = artifactInstanceResult;
        if (player.money < artifactInstance.cost) {
            throw new WsException('insufficient money');
        }

        // buy artifact
        game.actions.moveArtifactToInventory(playerId, artifactInstance, shopIndex);
        game.actions.removeMoney(playerId, artifactInstance.cost);

        return { 
            artifact: artifactInstance,
            location: { insideOf: ArtifactZone.PLAYER, index: player.artifacts.length - 1 }
        };
    }

    endTurn(gameId: string, playerId: string) {
        const game = this.getGame(gameId)
        const opponent = game.actions.getOpponentState(playerId);

        if (playerId !== game.state.playerTurnId) {
        throw new WsException("player doesnt match the playerTurnId");
        }

        game.state.playerTurnId = opponent.socketId;
        this.triggerUnits(game, opponent.socketId, EFFECT_TRIGGERS.TURN_END);
    }

    startTurn(gameId: string, playerId: string) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);
        const opponent = game.actions.getOpponentState(playerId);

        const phaseChanged = shouldSwitchPhase(game.state.gamePhase, player.turn, opponent.turn);
        if (phaseChanged) {
            game.state.gamePhase = changeGamePhase(game.state.gamePhase);
        }

        player.turn++;

        this.triggerUnits(game, playerId, EFFECT_TRIGGERS.TURN_START)

        switch (game.state.gamePhase) {
            case GamePhase.PLAY:
                return { 
                    phase: GamePhase.PLAY,
                    data: this.handleStartTurnPlay(gameId, playerId), 
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

    private handleStartTurnPlay(gameId: string, playerId: string) {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const newSpell = this.drawSpell(gameId, playerId);
        const newMoney = this.giveTurnStartMoney(gameId, playerId);

        return { 
            newSpell, 
            newMoney, 
            newDrawpileCount: player.hand.length 
        };
    }

    private handleStartTurnShop(gameId: string) {
        const game = this.getGame(gameId);

        game.actions.refillShop();
    }

    private drawSpell(gameId: string, playerId: string): SpellInstance | null {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        if (player.hand.length === MAX_HAND_SIZE) {
            return null;
        }

        const spellInstance = game.actions.removeSpellFromDrawpile(playerId);
        if (spellInstance) {
            game.actions.addSpellToHand(playerId, spellInstance);
        }

        return spellInstance;
    }

    private giveTurnStartMoney(gameId: string, playerId: string): number {
        const game = this.getGame(gameId);
        const player = game.actions.getPlayerState(playerId);

        const newMoney = calculateTurnStartMoney(player.turn);

        game.actions.addMoney(playerId, newMoney);

        return newMoney;
    }

    attackUnit(gameId: string, playerId: string, attackUnitDto: AttackUnitDto
    ): { attackerData: UnitAndLocation, targetData: UnitAndLocation } {
        const game = this.getGame(gameId);

        const { card: attacker, index: attackerIndex } = 
            this.cardsService.findCardInstance(attackUnitDto.attackerId, game.state.board);
        if (attacker.ownerId != playerId) {
            throw new WsException("Invalid attacker");
        }

        const { card: target, index: targetIndex } = 
            this.cardsService.findCardInstance(attackUnitDto.targetId, game.state.board);


        return {
            targetData: this.handleAttackUnit(gameId, target, attacker.atk, targetIndex),
            attackerData: this.handleAttackUnit(gameId, attacker, target.atk, attackerIndex)
        };
    }

    private handleAttackUnit(gameId, target: UnitInstance, damage: number, targetIndex): UnitAndLocation {
        const game = this.getGame(gameId);

        const isDead = game.actions.damageUnit(target.id, damage);

        let location: CardLocation = { insideOf: CardZone.BOARD, index: targetIndex };

        if (isDead) {
            const targetBench = this.getPlayerState(gameId, this.cardsService.getCardOwnerId(target)).bench;
            location = game.actions.moveUnitToBench(
                this.cardsService.getCardOwnerId(target), 
                target, 
                this.cardsService.findEmptySlot(targetBench), 
                targetIndex
            );
        }

        return {
            unit: target,
            location,
        };
    }

    attackPlayer(gameId: string, playerId: string, attackPlayerDto: AttackPlayerDto
    ): { targetId: string, attackerId: string, health: number } {
        const game = this.getGame(gameId);

        const targetId = attackPlayerDto.isAttackOpponent ? this.getOpponentState(gameId, playerId).socketId : playerId;
        const { card: attacker } = this.cardsService.findCardInstance(attackPlayerDto.attackerId, game.state.board);

        const health = game.actions.damagePlayer(targetId, attacker.atk);

        return {
            targetId,
            attackerId: this.cardsService.getCardOwnerId(attacker),
            health
        };
    }

    targetSelected(gameId: string, playerId: string, targetId)
    {
        const game = this.getGame(gameId)
        const player: PlayerState = game.state.players[playerId]

        if (!player.currentEffectData) return
        const {effect, sourceId} = player.currentEffectData

        effect.execute({game, sourceId, playerId, targetId})
    }

    private triggerUnit(game: Game, playerId: string, trigger: EffectTrigger, unit: UnitInstance)
    {
        let needsTarget = false
        unit.effects.map((effect: Effect) => {
            if (effect.trigger.includes(trigger))
            {
                if (effect.hasTarget)
                {
                    const player = game.state.players[playerId]
                    player.currentEffect = effect
                    needsTarget = true
                }
                else effect.execute({game, playerId, sourceId: unit.instanceId!})
            }
        })
        
        return needsTarget
    }

    private triggerUnits(game: Game, playerID: string, trigger: EffectTrigger)
    {
        const state = game.state

        const summonedUnits = state.board.filter(
        (unit): unit is UnitInstance => unit?.ownerId === playerID
        );

        let needsTarget = false 

        summonedUnits.map((unit) => {
            needsTarget = this.triggerUnit(game, playerID, trigger, unit)
        })

        return needsTarget
    }
}
