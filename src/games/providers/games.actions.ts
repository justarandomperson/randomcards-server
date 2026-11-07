import { WsException } from "@nestjs/websockets";
import { EffectsService } from "../../effects/effects.service";
import { CurrentEffectData, GamePhase, GameState, PlayerState, selectTargetFilter, targetOption } from "../shared/games.types";
import { ArtifactInstance, InstanceLocation, SpellInstance, UnitInstance, InstanceZone, InstanceType } from "../../instances/shared/instances.types";
import { anyTriggerData, Effect, EFFECT_TRIGGERS, EffectTrigger, Status, TriggerData } from "../../effects/effects.types";
import { MAX_HAND_SIZE, MINIMUM_MONEY, STARTING_HEALTH, STARTING_SPELLS_IN_HAND } from "../shared/games.constants";
import { GamesEmitter } from "./games.emitter";
import { calculateTurnStartMoney, fillShop, shouldSwitchPhase, translateBoardIndex, unTranslateBoardIndex } from "../logic/serviceHelpers";
import { InstancesService } from "../../instances/providers/instances.service";


export class GameActions { 
    private readonly effects: EffectsService;

    constructor(
        public readonly state: GameState,
        private readonly emitter: GamesEmitter,
        private readonly instances: InstancesService
    ) {
        this.effects = new EffectsService(this.state, this, this.instances);
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

    getPlayerBoard(playerId: string): ({ unit: UnitInstance | null, index: number })[] {
        let board: (UnitInstance | null)[] = [];
        if (this.isPlayer1(playerId)) {
            board = this.state.board.slice(0, 4);
        }
        else {
            board = this.state.board.slice(4, 8);
        }

        const boardWithIndexes: ({ unit: UnitInstance | null, index: number })[] = []
        for (let i = 0; i < board.length; i++) {
            if (this.isPlayer1(playerId)) {
                boardWithIndexes.push({ unit: board[i], index: i });
            }
            else {
                boardWithIndexes.push({ unit: board[i], index: i + 4 });
            }
        }

        return boardWithIndexes;
    }

    getOpponentBoard(playerId: string) {
        return this.getPlayerBoard(this.getOpponentId(playerId));
    }

    getPlayerUnits(playerId: string): ({ unit: UnitInstance, index: number })[] {
        const playerBoard = this.getPlayerBoard(playerId);

        const playerUnits: ({ unit: UnitInstance, index: number })[] = [];
        for (let i = 0; i < playerBoard.length; i++) {
            if (!playerBoard[i].unit) {
                continue;
            }

            // didnt want to use as but for some reason it doesnt work?!!!
            playerUnits.push(playerBoard[i] as { unit: UnitInstance, index: number });
        }

        return playerUnits;
    }

    getOpponentUnits(playerId: string) {
        return this.getPlayerUnits(this.getOpponentId(playerId));
    }

    getUnitInfront(boardIndex: number): UnitInstance | null {
        if (boardIndex < 0) {
            throw new WsException("boardIndex doesnt exist");
        }

        if (boardIndex < 4) {
            return this.state.board[boardIndex + 4];
        }

        return this.state.board[boardIndex - 4];
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
        this.setShop(fillShop(this.state.shop, this.state.possibleShopPool));
    }


    // helpers (for emitting and running effects)
    //to get the client board location, the only things the server is concerned about are 2 things:
    //1. the card board index
    //2. whether the player who needs the index is the one who owns it
    //if the player owns it, it means it's on their side of their board => no need to adjust index
    //otherwise, index needs to be adjusted to be on the opposite site of the board
    //therefore it doesn't matter who is player1 or player2
    private getClientBoardLocation(clientId: string, actionPlayerId: string, location: InstanceLocation): InstanceLocation {
        if (location.insideOf === InstanceZone.NONE || location.insideOf === InstanceZone.BENCH || location.insideOf === InstanceZone.HAND) return location
        if (location.insideOf !== InstanceZone.BOARD) {
            throw new WsException('cardLocation is not in board');
        }

        const isActionPlayer1 = this.isPlayer1(actionPlayerId);

        if (isActionPlayer1) {
            if (actionPlayerId !== clientId) {
                return { insideOf: location.insideOf, index: unTranslateBoardIndex(location.index, isActionPlayer1) };
            }
        }
        else {
            if (actionPlayerId == clientId) {
                return { insideOf: location.insideOf, index: unTranslateBoardIndex(location.index, isActionPlayer1) };
            } 
            else {
                return { insideOf: location.insideOf, index: translateBoardIndex(location.index, isActionPlayer1) };
            }
        }

        return location;
    }

    runTriggerEffects(trigger: EffectTrigger, triggerData: TriggerData): selectTargetFilter | undefined {
        const needsTarget = this.effects.runTriggerEffects(trigger, triggerData);

        if (needsTarget) {
            const hasValidTarget = this.checkIfTargetFilterHasValidTarget(triggerData, needsTarget)
            if (!hasValidTarget) 
            {
                return undefined
            }
            this.emitter.selectTarget(triggerData.playerId, needsTarget);
            return needsTarget;
        }

        return undefined;
    }

    runTriggerEffectsBoth(trigger: EffectTrigger, triggerData: anyTriggerData) {
        const card = triggerData.source || triggerData.referenced || triggerData.attacker || triggerData.attacked
        const playerId = card?.ownerId
        if (!playerId) throw new WsException("card has no ownerId")
        this.runTriggerEffects(trigger, {...triggerData, playerId: playerId});
        this.runTriggerEffects(trigger, { ...triggerData, playerId: this.getOpponentId(playerId), });
    }

    checkIfTargetFilterHasValidTarget(triggerData: TriggerData,filter: selectTargetFilter) {
        if (filter.has(targetOption.SELF) || filter.has(targetOption.OPPONENT)) return true

         if (filter.has(targetOption.BENCH))
        {
            const playerBench = this.getPlayerState(triggerData.playerId).bench
            const hasAllyTarget = playerBench.some((slot) => slot != null)
            if (hasAllyTarget) return true
        }


        if (filter.has(targetOption.HAND))
        {
            const playerHand = this.getPlayerState(triggerData.playerId).hand
            const hasAllyTarget = playerHand.length > 0
            if (hasAllyTarget) return true
        }

        if (filter.has(targetOption.ALLY))
        {
            const playerBoard = this.getPlayerBoard(triggerData.playerId)
            const hasAllyTarget = playerBoard.some((slot) => slot.unit != null)
            if (hasAllyTarget) return true
        }

         if (filter.has(targetOption.ENEMY))
        {
            const opponentBoard = this.getOpponentBoard(triggerData.playerId)
            const hasEnemyTarget = opponentBoard.some((slot) => slot.unit != null)
            if (hasEnemyTarget) return true
        }

        return false
    }

    private emitTwoDifferentUpdateCard(card: UnitInstance | SpellInstance) {
        const playerId = this.instances.getOwnerId(card);

        const cardLocation = this.instances.getLocation(card);
        const clientCardLocation = this.getClientBoardLocation(playerId, playerId, cardLocation);
        this.emitter.updateCard(playerId, card, clientCardLocation);

        if (cardLocation.insideOf !== InstanceZone.BENCH && cardLocation.insideOf !== InstanceZone.HAND)
        {
            const opponentCardLocation = this.getClientBoardLocation(playerId, this.getOpponentId(playerId), cardLocation);
            this.emitter.updateCard(this.getOpponentId(playerId), card, opponentCardLocation);
        }
    }

    endGame(playerId: string) {
        this.emitter.gameEnd(this.state.gameId, playerId);
    }

    // moving stuff
    moveUnitFromBenchToBoard(player: PlayerState, card: UnitInstance, boardIndex: number): InstanceLocation {
        this.state.board[boardIndex] = card;
        if (card.assignedBenchSlot || card.assignedBenchSlot === 0) {
            player.bench[card.assignedBenchSlot] = null;
        }

        card.location = { insideOf: InstanceZone.BOARD, index: boardIndex };

        return card.location;
    }

    moveUnitFromBoardToBench(card: UnitInstance): InstanceLocation {
        if (!card.ownerId) {
            throw new WsException("card has no owner");
        }

        const ownerId = this.instances.getOwnerId(card);
        const ownerState = this.getPlayerState(ownerId);
        if (card.assignedBenchSlot !== 0 && !card.assignedBenchSlot) {
            throw new WsException("card does not have an assigned bench slot"); 
        }

        const location = this.instances.getLocation(card);
        if (location.insideOf !== InstanceZone.BOARD) {
            throw new WsException("card is not in play");
        }

        ownerState.bench[card.assignedBenchSlot] = card;
        this.state.board[location.index] = null;

        card.location = { insideOf: InstanceZone.BENCH, index: card.assignedBenchSlot };

        this.emitter.updateCard(ownerId, card, card.location);
        this.emitter.updateCard(this.getOpponentId(ownerId), card, {insideOf: InstanceZone.NONE});

        return card.location;
    }

    removeUnitFromBoard(card: UnitInstance) {
        const location = this.instances.getLocation(card);
        if (location.insideOf !== InstanceZone.BOARD) {
            throw new WsException("card is not in play");
        }

        this.state.board[location.index] = null;

        card.location = { insideOf: InstanceZone.NONE }

        this.emitTwoDifferentUpdateCard(card);
    }

    moveSpellFromHandToDrawpile(player: PlayerState, card: SpellInstance): InstanceLocation {   
        const location = this.instances.getLocation(card);     
        if (location.insideOf !== InstanceZone.HAND) {
            throw new WsException("card is not in hand");
        }

        player.hand.splice(location.index, 1);

        if (card.inDeck) { // does not add card to drawpile if card wasnt originally in deck card
            player.drawpile.push(card);
            this.emitter.updateDrawpileCount(this.state.gameId, player.socketId, player.drawpile.length);
        }

        card.location = { insideOf: InstanceZone.NONE };

        this.emitter.updateCard(player.socketId, card, { insideOf: InstanceZone.NONE });

        return card.location;
    }

    //spellCreated - relevant when extra space will be made by the spell that just is attempting to add the spell to hand.
    addSpellToHand(player: PlayerState, card: SpellInstance, spellCreated: boolean = false): InstanceLocation | null {
        if (player.hand.length === MAX_HAND_SIZE + (spellCreated ? 1 : 0)) {
            return null;
        }

        player.hand.push(card);

        card.location = { insideOf: InstanceZone.HAND, index: player.hand.length - 1 };

        this.emitter.updateCard(player.socketId, card, card.location);

        return card.location;
    }

    drawSpellFromDrawpile(player: PlayerState): SpellInstance {
        const spellIndex = Math.floor(Math.random() * player.drawpile.length / 2); //? is this how we should be doing this
        const spell = player.drawpile[spellIndex];
        if (!spell) {
            throw new WsException('drawpile is empty');
        }

        player.drawpile.splice(spellIndex, 1);

        this.emitter.updateDrawpileCount(this.state.gameId, player.socketId, player.drawpile.length);

        return spell;
    }

    moveArtifactFromShopToInventory(player: PlayerState, artifact: ArtifactInstance): InstanceLocation {
        const location = this.instances.getLocation(artifact);
        if (location.insideOf !== InstanceZone.SHOP) {
            throw new WsException("artifact not in shop");
        }

        this.state.shop[location.index] = null;
        player.artifacts.push(artifact);

        artifact.location = { insideOf: InstanceZone.PLAYER, index: player.artifacts.length - 1 };

        this.emitter.updateArtifactBoth(this.state.gameId, artifact, artifact.location, player.socketId);

        this.runTriggerEffects(EFFECT_TRIGGERS.BOUGHT, { playerId: player.socketId, source: artifact });

        return artifact.location;
    }

    // changing card data
    resetUnitData(unit: UnitInstance) {
        // Note: doesnt emit because sometimes this will be emitted to both users and sometimes only to one
        // Note: the functions that call this will do that
        const defaultUnit = this.instances.getDefaultUnitById(unit.id);

        unit.hp = defaultUnit.hp;
        unit.atk = defaultUnit.atk;
        unit.cost = defaultUnit.cost;
        unit.effects = [...defaultUnit.effects];
        unit.statuses = {...defaultUnit.statuses};
    }

    decreaseUnitHealth(card: UnitInstance, amount: number, attacker?: UnitInstance): boolean {
        if (!card.ownerId) {
            throw new WsException("Card does not have owner")
        }

        card.hp -= amount;

        this.emitTwoDifferentUpdateCard(card);
        
        const cardOwnerId = this.instances.getOwnerId(card);

        if (attacker) {
            if (!card.statuses.silenced) {
                this.runTriggerEffects(EFFECT_TRIGGERS.DAMAGED, { playerId: cardOwnerId, source: card, attacker });
            }
            
            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_DAMAGED, { referenced: card })
        }

        if (card.hp <= 0) {
            if (attacker) {
                const attackerOwnerId = this.instances.getOwnerId(attacker);
                this.runTriggerEffects(EFFECT_TRIGGERS.KILL, { playerId: attackerOwnerId, source: attacker, referenced: card});
            }

            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_KILLED, { referenced: card})
            if (card.assignedBenchSlot || card.assignedBenchSlot === 0) {
                this.moveUnitFromBoardToBench(card);

                this.resetUnitData(card);
                this.addUnitStatus(card, Status.COOLDOWN, 3);
            }
            else {
                this.removeUnitFromBoard(card);
            } 

            if (!card.statuses.silenced) {
                    this.runTriggerEffects(EFFECT_TRIGGERS.DEATH, { playerId: cardOwnerId, source: card });
            }

            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_DIED, { referenced: card });
        }

        return false; 
    }

    increaseUnitAttack(card: UnitInstance, amount: number): number {
        card.atk += amount;

        this.emitTwoDifferentUpdateCard(card);

        return card.atk;
    }

    increaseUnitHealth(card: UnitInstance, amount: number, upToMax: boolean): number {
        card.hp += amount;

        if (upToMax) {
            const defaultCard = this.instances.getDefaultUnitById(card.id);

            if (card.hp > defaultCard.hp) {
                card.hp = defaultCard.hp;
            }
        }

        this.emitTwoDifferentUpdateCard(card);

        return card.hp;
    }

    increaseCardCost(card: UnitInstance | SpellInstance, amount: number): number {
        card.cost += amount;

        this.emitTwoDifferentUpdateCard(card);

        return card.cost;
    }

    addUnitStatus(card: UnitInstance, status: Status, amount: number = 1) {
        switch (status) {
            case Status.HASTE:
                card.statuses.haste = true;
                break;

            case Status.TAUNT:
                card.statuses.taunt = true;
                break;

            case Status.PARALYZED:
                card.statuses.paralyzed = true;
                break;

            case Status.SILENCED:
                card.statuses.silenced = true;
                
                // reset all other statuses
                card.statuses.haste = false;
                card.statuses.taunt = false;
                card.statuses.paralyzed = false;
                card.statuses.dodge = 0;
                break;

            case Status.DODGE:
                card.statuses.dodge += amount;
                break;

            case Status.COOLDOWN:
                card.statuses.cooldown += amount;
                break;
        }

        this.emitTwoDifferentUpdateCard(card);
    }

    removeUnitStatus(card: UnitInstance, status: Status) {
        switch (status) {
            case Status.HASTE:
                card.statuses.haste = false;
                break;

            case Status.TAUNT:
                card.statuses.taunt = false;
                break;

            case Status.PARALYZED:
                card.statuses.paralyzed = false;
                break;

            case Status.SILENCED:
                card.statuses.silenced = false;
                break;

            case Status.DODGE: 
                card.statuses.dodge -= 1;

                if (card.statuses.dodge < 0) {
                    card.statuses.dodge = 0;
                }

                break;

            case Status.COOLDOWN:
                card.statuses.cooldown -= 1;

                if (card.statuses.cooldown < 0) {
                    card.statuses.cooldown = 0;
                }

                break;
        }

        // cooldown'd units are only in bench so the opponent does not need to get updated on it
        if (status == Status.COOLDOWN) {
            this.emitter.updateCard(this.instances.getOwnerId(card), card, this.instances.getLocation(card));
        }
        else {
            this.emitTwoDifferentUpdateCard(card); 
        }
    }

    changeUnitEffect(card: UnitInstance, effects: Effect[], effectDesc: string) {
        card.effects = effects;
        card.effectDesc = `Copied: ${effectDesc}`;

        this.emitTwoDifferentUpdateCard(card);
    }

    // change player data
    decreasePlayerHealth(player: PlayerState, amount: number): number {
        player.hp -= amount;

        this.emitter.updateHealth(this.state.gameId, player.socketId, player.hp);

        return player.hp;
    }

    increasePlayerHealth(player: PlayerState, amount: number): number {
        player.hp += amount;

        if (player.hp > STARTING_HEALTH) {
            player.hp = STARTING_HEALTH;
        }

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

    pushPlayerCurrentEffect(player: PlayerState, currentEffect: CurrentEffectData) {
        player.currentEffects.push(currentEffect);
    }

    shiftPlayerCurrentEffect(player: PlayerState) {
        player.currentEffects.shift();
    }

    incrementArtifactsBought(player: PlayerState) {
        player.artifactsBoughtThisTurn += 1;
    }

    resetArtifactsBought(player: PlayerState) {
        player.artifactsBoughtThisTurn = 0;
    }


    /*  ____ ____ ___ _ ____ _  _ ____ 
        |__| |     |  | |  | |\ | [__  
        |  | |___  |  | |__| | \| ___]
    */

    // main actions
    startMatch(player1Id: string, player2Id: string): boolean {
        const isMatched = this.emitter.allMatchStartEvents(this.state, player1Id, player2Id);

        if (isMatched) {
            for (let i = 0; i < STARTING_SPELLS_IN_HAND; i++) {
                this.drawSpell(player1Id);
                this.drawSpell(player2Id);
            }
        }

        return isMatched;
    }

    summonUnit(playerId: string, card: UnitInstance, boardIndex?: number) {
        const player = this.getPlayerState(playerId);

        if (boardIndex === undefined) {
            const playerBoard = this.getPlayerBoard(playerId);
            const freeIndex = playerBoard.findIndex((slot) => slot.unit == undefined);
            boardIndex = playerBoard[freeIndex]?.index

            if (boardIndex === undefined) {
                return;
            }
        }

        card.canAttack = false; // just summoned to board so cannot attack.

        this.moveUnitFromBenchToBoard(player, card, boardIndex);
        this.emitTwoDifferentUpdateCard(card);

        const cardOwnerId = this.instances.getOwnerId(card);

        let needsTarget: selectTargetFilter | undefined = undefined;
        if (!card.statuses.silenced) {
            needsTarget = this.runTriggerEffects(EFFECT_TRIGGERS.SUMMONED, { playerId: cardOwnerId, source: card });
        }

        if (!needsTarget){
            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_SUMMONED, { referenced: card });
        }
    }

    attackUnit(playerId: string, card: UnitInstance, amount: number, attacker?: UnitInstance) {
        if (attacker) {
            this.removeUnitStatus(attacker, Status.HASTE);
            attacker.canAttack = false;

            const attackerOwnerId = this.instances.getOwnerId(attacker);

            if (!attacker.statuses.silenced) {
                this.runTriggerEffects(EFFECT_TRIGGERS.ATTACKED, { playerId: attackerOwnerId, source: attacker, attacked: card });
            }

            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_ATTACKED, { attacker: attacker, attacked: card });

            this.emitter.attacked(playerId);
        }

        if (card.statuses.dodge > 0) {
            this.removeUnitStatus(card, Status.DODGE);
        }
        else {
            this.decreaseUnitHealth(card, amount, attacker);
        }
    }

    useSpell(playerId: string, card: SpellInstance) {
        const player = this.getPlayerState(playerId);
        const cardOwnerId = this.instances.getOwnerId(card);

        const needsTarget = this.runTriggerEffects(EFFECT_TRIGGERS.SUMMONED, { playerId: cardOwnerId, source: card });
        
        if (!needsTarget){
            if (card.inDeck) { 
                this.moveSpellFromHandToDrawpile(player, card);
            }

            this.emitter.playedSpell(this.state.gameId, card);

            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_SPELL_PLAYED, { referenced: card });
        }
    }

    drawSpell(playerId: string) {
        const player = this.getPlayerState(playerId);

        const spell = this.drawSpellFromDrawpile(player);
        this.addSpellToHand(player, spell);
    }

    attackPlayer(playerId: string, amount: number, attacker?: UnitInstance) {
        const player = this.getPlayerState(playerId);

        if (attacker) {
            this.removeUnitStatus(attacker, Status.HASTE);
            attacker.canAttack = false;

            const attackerOwnerId = this.instances.getOwnerId(attacker);

            if (!attacker.statuses.silenced) {
                this.runTriggerEffects(EFFECT_TRIGGERS.ATTACKED, { playerId: attackerOwnerId, source: attacker });
            }

            this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_ATTACKED, { attacker: attacker });

            this.emitter.attacked(playerId);
        }

        const hp = this.decreasePlayerHealth(player, amount);

        this.effects.runTriggerEffects(EFFECT_TRIGGERS.PLAYER_DAMAGED, { playerId, attacker: attacker });

        if (hp <= 0) {
            this.endGame(this.getOpponentId(playerId));
        }
    }

    endTurn(playerId: string) {
        const player = this.getPlayerState(playerId);
        
        // remove haste & paralyzed 
        const playerUnits = this.getPlayerUnits(this.state.playerTurnId);
        for (const unit of playerUnits) {
            this.removeUnitStatus(unit.unit, Status.HASTE);
            this.removeUnitStatus(unit.unit, Status.PARALYZED); //! this uhhh doesnt work correctly fix later
        }

        this.incrementPlayerTurn(player);
        this.decrementBenchCooldown(player);

        if (this.state.gamePhase == GamePhase.SHOP) {
            this.resetArtifactsBought(player);
        }

        this.runTriggerEffects(EFFECT_TRIGGERS.TURN_END, { playerId });
    }

    private decrementBenchCooldown(player: PlayerState) {
        player.bench.map((unit) => {
            if (unit) {
                if (unit.statuses.cooldown > 0) {
                    this.removeUnitStatus(unit, Status.COOLDOWN);
                }
            }
        })
    }

    startTurn() {
        const players = [...this.state.players.values()]
        // change phase is needed
        const phaseChanged = shouldSwitchPhase(this.state.gamePhase, players[0].turn, players[1].turn);
        if (phaseChanged) {
            this.changeGamePhase();
        }

        this.setPlayerTurnId(this.getOpponentId(this.state.playerTurnId));

        // start of turn stuff
        switch(this.state.gamePhase) {
            case GamePhase.PLAY: {
                const player = this.getPlayerState(this.state.playerTurnId);
                this.runTriggerEffects(EFFECT_TRIGGERS.TURN_START,  { playerId: player.socketId });
                this.startTurnPlay(player);
                break;
            }

            case GamePhase.SHOP:
                this.refillShop();
                this.emitter.updateShopBoth(this.state.gameId, this.state.shop);
                break;
        }

        this.emitter.startTurn(this.state.playerTurnId);
    }

    private changeGamePhase() {
        const phase = this.state.gamePhase;
        this.setGamePhase((phase === GamePhase.PLAY ? GamePhase.SHOP : GamePhase.PLAY));

        this.emitter.updateGamePhase(this.state.gameId)

        if (this.state.gamePhase === GamePhase.PLAY) { // changed from shop
            const unsoldArtifacts = this.state.shop.filter((item): item is ArtifactInstance => item !== null);

            this.setShop([null, null, null, null, null]);
            this.refillShop();
            this.state.possibleShopPool.push(...unsoldArtifacts);

            this.emitter.updateShopBoth(this.state.gameId, this.state.shop);
        }

    }

    private startTurnPlay(player: PlayerState) {
        this.drawSpell(player.socketId);

        const newMoney = calculateTurnStartMoney(player.turn);
        this.increasePlayerMoney(player, newMoney);

        const playerBoard = this.getPlayerBoard(player.socketId);
        for (const slot of playerBoard) {
            if (slot.unit) {
                slot.unit.canAttack = true;
            }
        }
    }

    runCurrentEffect(player: PlayerState, targetUnit?: UnitInstance, targetPlayerId?: string) {
        if (!player.currentEffects[0]) {
            return;
        }

        const { effect, data } = player.currentEffects[0];

        this.shiftPlayerCurrentEffect(player);

        if (targetUnit && !targetPlayerId) {
            data.targetUnit = targetUnit
        }
        else if (targetPlayerId && !targetUnit) {
            data.targetPlayerId = targetPlayerId
        }
        else {
            throw new WsException('got either but or none targets...');
        }

        if (data.source.type === InstanceType.SPELL){
            this.moveSpellFromHandToDrawpile(player, data.source);
            this.emitter.playedSpell(this.state.gameId, data.source);
        }

        this.effects.runEffect(effect, data);   
        const cardOwnerId = this.instances.getOwnerId(data.source);     

        if (data.source.type === InstanceType.UNIT) {
            this.runTriggerEffects(EFFECT_TRIGGERS.ANY_SUMMONED, { playerId: cardOwnerId, referenced: data.source });
        }
        else if (data.source.type === InstanceType.SPELL){
           this.runTriggerEffectsBoth(EFFECT_TRIGGERS.ANY_SPELL_PLAYED, { referenced: data.source });
        }
    }
}