import { WsException } from "@nestjs/websockets";
import { EffectsService } from "../../effects/effects.service";
import { CurrentEffectData, GamePhase, GameState, PlayerState } from "../shared/games.types";
import { CardLocation, CardZone, SpellInstance, UnitInstance } from "../../cards/cards.types";
import { EFFECT_TRIGGERS } from "../../effects/effects.types";
import { MAX_HAND_SIZE, MINIMUM_MONEY } from "../shared/games.constants";
import { ArtifactInstance, ArtifactLocation, ArtifactZone } from "../../artifacts/artifacts.types";
import { CardsService } from "../../cards/cards.service";
import { fillShop } from "../logic/gameSetup";
import { GamesEmitter } from "./games.emitter";
import { ArtifactsService } from "../../artifacts/artifacts.service";
import { calculateTurnStartMoney, shouldSwitchPhase, translateBoardIndex } from "../logic/serviceHelpers";


export class GameActions { 
    private readonly effects: EffectsService;

    constructor(
        public readonly state: GameState,
        private readonly emitter: GamesEmitter,
        private readonly cards: CardsService,
        private readonly artifacts: ArtifactsService
    ) {
        this.effects = new EffectsService(this.state, this, this.cards, this.artifacts);
    }

    // getters
    getPlayerState(playerId: string): PlayerState {
        const player = this.state.players.get(playerId);
        if (!player) {
            throw new WsException("Player not in game");
        }

        return player;
    }

    getOpponentState(playerId: string): PlayerState {
        for (const [socketId, state] of this.state.players) {
            if (socketId !== playerId) {
                return state;
            }
        }

        throw new WsException("Opponent not in game");
    }

    getOpponentId(playerId: string): string {
        return this.getOpponentState(playerId).socketId;
    }

    isPlayer1(playerId: string): boolean {
        return [...this.state.players.keys()][0] === playerId;
    }

    getPlayerBoard(playerId: string) {
        if (this.isPlayer1(playerId)) {
            return this.state.board.slice(0, 4);
        }

        return this.state.board.slice(4, 8);
    }

    getOpponentBoard(playerId: string) {
        if (this.isPlayer1(playerId)) {
            return this.state.board.slice(4, 8);
        }
        
        return this.state.board.slice(0, 4);
    }

    getPlayerBoardUnits(playerId: string): { unit: UnitInstance, index: number}[] {
        const playerBoard = this.getPlayerBoard(playerId);

        const boardUnits: { unit: UnitInstance, index: number}[] = []

        for (let i = 0; i < playerBoard.length; i++) {
            const slot = playerBoard[i];

            if (slot) {
                boardUnits.push({ unit: slot, index: i })
            }
        }

        return boardUnits;
    }

    getOpponentBoardUnits(playerId: string): { unit: UnitInstance, index: number}[] {
        const playerBoard = this.getOpponentBoard(playerId);

        const boardUnits: { unit: UnitInstance, index: number}[] = []

        for (let i = 0; i < playerBoard.length; i++) {
            const slot = playerBoard[i];

            if (slot) {
                boardUnits.push({ unit: slot, index: i })
            }
        }

        return boardUnits;
    }

    private getClientBoardLocation(clientId: string, actionPlayerId: string, location: CardLocation): CardLocation {
        //? will we use it or rather change website?
        if (location.insideOf !== CardZone.BOARD) {
            throw new WsException('cardLocation is not in board');
        }

        const isActionPlayer1 = this.isPlayer1(actionPlayerId);

        if (isActionPlayer1) {
            if (actionPlayerId !== clientId) {
                return { insideOf: location.insideOf, index: translateBoardIndex(location.index, isActionPlayer1) }
            }
        }
        else {
            if (actionPlayerId === clientId) {
                return { insideOf: location.insideOf, index: translateBoardIndex(location.index, isActionPlayer1) }
            }
        }

        return location;
    }


    // setters
    setPlayerTurnId(playerId: string) {
        this.getPlayerState(playerId); // just to check if player exists

        this.state.playerTurnId = playerId;
    }

    setGamePhase(gamePhase: GamePhase) {
        this.state.gamePhase = gamePhase
    }

    setShop(shop: (ArtifactInstance | null)[]) {
        this.state.shop = shop;
    }

    refillShop() {
        this.setShop(fillShop(this.state.shop));
    }


    // moving stuff
    moveUnitFromBenchToBoard(player: PlayerState, card: UnitInstance, boardIndex: number): CardLocation {
        this.state.board[boardIndex] = card;
        if (card.assignedBenchSlot) {
            player.bench[card.assignedBenchSlot] = null;
        }

        card.location = { insideOf: CardZone.BOARD, index: boardIndex };

        this.emitter.updateCard(player.socketId, card, card.location);
        this.emitter.updateCard(this.getOpponentId(player.socketId), card, card.location);

        return card.location;
    }

    moveUnitFromBoardToBench(player: PlayerState, card: UnitInstance): CardLocation {
        if (!card.assignedBenchSlot) {
            throw new WsException("card does not have an assigned bench slot"); 
        }

        const location = this.cards.getCardLocation(card);
        if (location.insideOf !== CardZone.BOARD) {
            throw new WsException("card is not in play");
        }

        player.bench[card.assignedBenchSlot] = card;
        this.state.board[location.index] = null;

        card.location = { insideOf: CardZone.BENCH, index: card.assignedBenchSlot };

        this.emitter.updateCard(player.socketId, card, card.location);
        this.emitter.updateCard(this.getOpponentId(player.socketId), card, { insideOf: CardZone.NONE });

        return card.location;
    }

    removeUnitFromBoard(player: PlayerState, card: UnitInstance) {
        const location = this.cards.getCardLocation(card);
        if (location.insideOf !== CardZone.BOARD) {
            throw new WsException("card is not in play");
        }

        this.state.board[location.index] = null;

        card.location = { insideOf: CardZone.NONE }

        this.emitter.updateCard(player.socketId, card, { insideOf: CardZone.NONE });
        this.emitter.updateCard(this.getOpponentId(player.socketId), card, { insideOf: CardZone.NONE })

        //? should i delete the card or something? set it to null if possible?
    }

    moveSpellFromHandToDrawpile(player: PlayerState, card: SpellInstance): CardLocation {   
        const location = this.cards.getCardLocation(card);     
        if (location.insideOf !== CardZone.HAND) {
            throw new WsException("card is not in hand");
        }

        player.hand.splice(location.index, 1);
        player.drawpile.push(card);

        card.location = { insideOf: CardZone.NONE };

        this.emitter.updateCard(player.socketId, card, { insideOf: CardZone.NONE });
        // TODO: send the card to opponent on a different event so theyll see what card user played
        //this.emitter.updateCard(this.getOpponentState(player.socketId).socketId, card, { insideOf: CardZone.NONE });

        return card.location;
    }

    addSpellToHand(player: PlayerState, card: SpellInstance): CardLocation | null {
        if (player.hand.length === MAX_HAND_SIZE) {
            return null;
        }

        player.hand.push(card);

        card.location = { insideOf: CardZone.HAND, index: player.hand.length - 1 };

        this.emitter.updateCard(player.socketId, card, card.location);

        return card.location;
    }

    drawSpellFromDrawpile(player: PlayerState): SpellInstance {
        const spellIndex = Math.floor(Math.random() * player.drawpile.length / 2) // first half of drawpile
        const spell = player.drawpile[spellIndex];
        if (!spell) {
            throw new WsException('drawpile is empty');
        }

        player.drawpile.splice(spellIndex, 1);

        this.emitter.updateDrawpileCount(this.state.gameId, player.socketId, player.drawpile.length);

        return spell;
    }

    moveArtifactFromShopToInventory(player: PlayerState, artifact: ArtifactInstance): ArtifactLocation {
        const location = this.artifacts.getArtifactLocation(artifact);
        if (location.insideOf !== ArtifactZone.SHOP) {
            throw new WsException("artifact not in shop");
        }

        this.state.shop[location.index] = null;
        player.artifacts.push(artifact);
        
        artifact.location = { insideOf: ArtifactZone.PLAYER, index: player.artifacts.length - 1 };

        this.emitter.updateArtifact(player.socketId, artifact, artifact.location);

        return artifact.location;
    }

    // changing card data
    resetUnitData(unit: UnitInstance) {
        // Note: doesnt emit because sometimes this will be emitted to both users and sometimes only to one
        // Note: the functions that call this will do that
        const defaultUnit = this.cards.getDefaultUnitById(unit.id);

        unit.hp = defaultUnit.hp;
        unit.atk = defaultUnit.atk;
        unit.cost = defaultUnit.cost;
        unit.effects = defaultUnit.effects;
        unit.statuses = defaultUnit.statuses;
    }

    decreaseUnitHealth(card: UnitInstance, amount: number): boolean {
        card.hp -= amount;

        this.emitter.updateCardBoth(this.state.gameId, card, this.cards.getCardLocation(card));

        if (card.hp <= 0) {
            return true; // as in unit died
        }

        return false; // as in unit still on board
    }

    increaseUnitAttack(card: UnitInstance, amount: number): number {
        card.atk += amount;

        this.emitter.updateCardBoth(this.state.gameId, card, this.cards.getCardLocation(card));

        return card.atk;
    }

    increaseUnitHealth(card: UnitInstance, amount: number): number {
        card.hp += amount;

        this.emitter.updateCardBoth(this.state.gameId, card, this.cards.getCardLocation(card));

        return card.hp;
    }

    decreaseUnitCooldown(card: UnitInstance, amount: number): number {
        card.cooldown -= amount;

        this.emitter.updateCardBoth(this.state.gameId, card, this.cards.getCardLocation(card));

        return card.cooldown;
    }

    increaseUnitCooldown(card: UnitInstance, amount: number): number {
        card.cooldown += amount;

        this.emitter.updateCardBoth(this.state.gameId, card, this.cards.getCardLocation(card));

        return card.cooldown;
    }

    // change player data
    decreasePlayerHealth(player: PlayerState, amount: number): number {
        player.hp -= amount;

        this.emitter.updateHealth(this.state.gameId, player.socketId, player.hp);

        return player.hp;
    }

    increasePlayerHealth(player: PlayerState, amount: number): number {
        player.hp += amount;

        this.emitter.updateHealth(this.state.gameId, player.socketId, player.hp);

        return player.hp;
    }

    decreasePlayerMoney(player: PlayerState, amount: number): number {
        player.money -= amount;
        if (player.money < MINIMUM_MONEY) {
            player.money = MINIMUM_MONEY;
        }

        this.emitter.updateMoney(this.state.gameId, player.socketId, player.money);

        return player.money;
    }

    increasePlayerMoney(player: PlayerState, amount: number): number {
        player.money += amount;

        this.emitter.updateMoney(this.state.gameId, player.socketId, player.money);
    
        return player.money;
    }

    incrementPlayerTurn(player: PlayerState): number {
        // Note: client increments it itself so not emitting
        player.turn += 1;
        return player.turn;
    }

    setPlayerCurrentEffectData(playerId: string, currentEffectData: CurrentEffectData) {
        const player = this.getPlayerState(playerId);
        player.currentEffectData = currentEffectData;
    }


    /*  ____ ____ ___ _ ____ _  _ ____ 
        |__| |     |  | |  | |\ | [__  
        |  | |___  |  | |__| | \| ___]
    */

    // main actions
    startMatch(player1Id: string, player2Id: string): boolean {
        const isMatched = this.emitter.allMatchStartEvents(this.state, player1Id, player2Id);
        return isMatched;
    }

    summonUnit(player: PlayerState, card: UnitInstance, boardIndex: number) {
        this.moveUnitFromBenchToBoard(player, card, boardIndex);

        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.SUMMONED, card);
        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.ANY_SUMMONED);
    }

    attackUnit(player: PlayerState, card: UnitInstance, amount: number) {
        const isUnitDead = this.decreaseUnitHealth(card, amount);

        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.DAMAGED, card);
        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.ANY_DAMAGED);

        if (isUnitDead) {
            if (card.assignedBenchSlot) {
                this.moveUnitFromBoardToBench(player, card);

                this.resetUnitData(card);
                this.emitter.updateCard(this.cards.getCardOwnerId(card), card, this.cards.getCardLocation(card));
            }
            else {
                this.removeUnitFromBoard(player, card);
            }

            this.increaseUnitCooldown(card, +1);

            this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.DEATH, card);
            this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.ANY_DIED);
        }
    }

    useSpell(player: PlayerState, card: SpellInstance) {
        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.SUMMONED, card);
        
        this.moveSpellFromHandToDrawpile(player, card);

        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.ANY_SPELL_PLAYED);
    }

    drawSpell(player: PlayerState) {
        const spell = this.drawSpellFromDrawpile(player);
        this.addSpellToHand(player, spell);
    }

    attackPlayer(player: PlayerState, amount: number) {
        this.decreasePlayerHealth(player, amount);
        // this function will probably grow
    }

    endTurn(player: PlayerState) {
        this.decrementBenchCooldown(player);

        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.TURN_END);
    }

    private decrementBenchCooldown(player: PlayerState) {
        player.bench.map((unit) => {
            if (unit) {
                this.decreaseUnitCooldown(unit, 1);
            }
        })
    }

    startTurn(player: PlayerState) {
        this.setPlayerTurnId(player.socketId);

        const opponent = this.getOpponentState(player.socketId);
        const phaseChanged = shouldSwitchPhase(this.state.gamePhase, player.turn, opponent.turn);
        if (phaseChanged) {
            this.changeGamePhase();
        }

        switch(this.state.gamePhase) {
            case GamePhase.PLAY:
                this.startTurnPlay(player);
                break;

            case GamePhase.SHOP:
                this.startTurnShop();
                break;
        }

        this.incrementPlayerTurn(player);

        this.effects.runEffectsForTrigger(player.socketId, EFFECT_TRIGGERS.TURN_START);
    }

    private changeGamePhase() {
        const phase = this.state.gamePhase;
        this.setGamePhase((phase === GamePhase.PLAY ? GamePhase.SHOP : GamePhase.PLAY));

        if (this.state.gamePhase === GamePhase.PLAY) { // changed from shop
            this.setShop(fillShop([])); // generate a new shop
        }
    }

    private startTurnPlay(player: PlayerState) {
        this.drawSpell(player);

        const newMoney = calculateTurnStartMoney(player.turn);
        this.increasePlayerMoney(player, newMoney);
    }

    private startTurnShop() {
        this.refillShop();
    }
};