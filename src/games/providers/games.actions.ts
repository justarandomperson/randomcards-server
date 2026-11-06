import { WsException } from "@nestjs/websockets";
import { EffectsService } from "../../effects/effects.service";
import { CurrentEffectData, GamePhase, GameState, PlayerState, selectTargetFilter, targetOption } from "../shared/games.types";
import { ArtifactInstance, InstanceLocation, SpellInstance, UnitInstance, InstanceZone, InstanceType } from "../../instances/shared/instances.types";
import { EFFECT_TRIGGERS, EffectTrigger, Status, TriggerData } from "../../effects/effects.types";
import { MAX_HAND_SIZE, MINIMUM_MONEY, STARTING_SPELLS_IN_HAND } from "../shared/games.constants";
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

            //? didnt want to use as but for some reason it doesnt work?!!!
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
        if (location.insideOf === InstanceZone.NONE) return location
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

    private runTriggerEffects(trigger: EffectTrigger, triggerData: TriggerData): selectTargetFilter | undefined {
        const needsTarget = this.effects.runTriggerEffects(trigger, triggerData);

        if (needsTarget) {
            const hasValidTarget = this.checkIfTargetFilterHasValidTarget(triggerData, needsTarget)
            if (!hasValidTarget) return undefined
            this.emitter.selectTarget(triggerData.playerId, needsTarget);
            return needsTarget;
        }

        return undefined;
    }

    private checkIfTargetFilterHasValidTarget(triggerData: TriggerData,filter: selectTargetFilter)
    {
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

        const opponentCardLocation = this.getClientBoardLocation(playerId, this.getOpponentId(playerId), cardLocation);
        this.emitter.updateCard(this.getOpponentId(playerId), card, opponentCardLocation);
    }

    endGame(playerId: string) {
        this.emitter.gameEnd(this.state.gameId, playerId);
    }

    // moving stuff
    moveUnitFromBenchToBoard(player: PlayerState, card: UnitInstance, boardIndex: number): InstanceLocation {
        this.state.board[boardIndex] = card;
        if (card.assignedBenchSlot) {
            player.bench[card.assignedBenchSlot] = null;
        }

        card.location = { insideOf: InstanceZone.BOARD, index: boardIndex };

        return card.location;
    }

    moveUnitFromBoardToBench(card: UnitInstance): InstanceLocation {
        if (!card.ownerId) {
            throw new WsException("card has no owner");
        }

        const ownerId = card.ownerId;
        const ownerState = this.getPlayerState(ownerId);
        if (!card.assignedBenchSlot) {
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

    removeUnitFromBoard(player: PlayerState, card: UnitInstance) {
        const location = this.instances.getLocation(card);
        if (location.insideOf !== InstanceZone.BOARD) {
            throw new WsException("card is not in play");
        }

        this.state.board[location.index] = null;

        card.location = { insideOf: InstanceZone.NONE }

        this.emitTwoDifferentUpdateCard(card);

        //? should i delete the card or something? set it to null if possible?
        //^ no, it is being 'freed' automatically. welcome to the world of javascript
    }

    moveSpellFromHandToDrawpile(player: PlayerState, card: SpellInstance): InstanceLocation {   
        const location = this.instances.getLocation(card);     
        if (location.insideOf !== InstanceZone.HAND) {
            throw new WsException("card is not in hand");
        }

        player.hand.splice(location.index, 1);

        if (card.inDeck) {
            player.drawpile.push(card); // does not add card to drawpile if card is a token card
        }

        card.location = { insideOf: InstanceZone.NONE };

        this.emitter.updateCard(player.socketId, card, { insideOf: InstanceZone.NONE });

        return card.location;
    }

    addSpellToHand(player: PlayerState, card: SpellInstance): InstanceLocation | null {
        if (player.hand.length === MAX_HAND_SIZE) {
            return null;
        }

        player.hand.push(card);

        card.location = { insideOf: InstanceZone.HAND, index: player.hand.length - 1 };

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

    moveArtifactFromShopToInventory(player: PlayerState, artifact: ArtifactInstance): InstanceLocation {
        const location = this.instances.getLocation(artifact);
        if (location.insideOf !== InstanceZone.SHOP) {
            throw new WsException("artifact not in shop");
        }

        this.state.shop[location.index] = null;
        player.artifacts.push(artifact);

        artifact.location = { insideOf: InstanceZone.PLAYER, index: player.artifacts.length - 1 };

        this.emitter.updateArtifactBoth(this.state.gameId, artifact, artifact.location, player.socketId);

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
        unit.effects = {...defaultUnit.effects};
        unit.statuses = {...defaultUnit.statuses};
    }

    decreaseUnitHealth(card: UnitInstance, amount: number): boolean {
        if (!card.ownerId) throw new WsException("Card does not have owner")
        card.hp -= amount;

        this.emitTwoDifferentUpdateCard(card);

        if (card.hp <= 0) {
            return true; // as in unit died
        }

        return false; // as in unit still on board
    }

    increaseUnitAttack(card: UnitInstance, amount: number): number {
        card.atk += amount;

        this.emitTwoDifferentUpdateCard(card);

        return card.atk;
    }

    increaseUnitHealth(card: UnitInstance, amount: number): number {
        card.hp += amount;

        this.emitTwoDifferentUpdateCard(card);

        return card.hp;
    }

    increaseCardCost(card: UnitInstance | SpellInstance, amount: number): number {
        card.cost += amount;

        this.emitTwoDifferentUpdateCard(card);

        return card.cost;
    }


    decreaseUnitCooldown(playerId: string, card: UnitInstance, amount: number): number {
        if (card.cooldown > 0) {
            card.cooldown -= amount;

            this.emitter.updateCard(playerId, card, this.instances.getLocation(card));
        }

        return card.cooldown;

    }

    increaseUnitCooldown(card: UnitInstance, amount: number): number {
        if (!card.ownerId) throw new WsException("card has no owner")
        card.cooldown += amount;

        this.emitter.updateCard(card.ownerId, card, this.instances.getLocation(card));

        return card.cooldown;
    }

    addUnitStatus(card: UnitInstance, status: Status) {
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
                card.statuses.dodge += 1;
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

            case Status.DODGE: {
                card.statuses.dodge -= 1;

                if (card.statuses.dodge < 0) {
                    card.statuses.dodge = 0;
                }

                break;
            }
        }

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

        if (!card.statuses.silenced) {
            this.runTriggerEffects(EFFECT_TRIGGERS.SUMMONED, { playerId, source: card });
        }

        this.runTriggerEffects(EFFECT_TRIGGERS.ANY_SUMMONED, { playerId, referenced: card});
    }

    attackUnit(playerId: string, card: UnitInstance, amount: number, attacker?: UnitInstance) {
        const player = this.getPlayerState(playerId);

        if (attacker) {
            this.removeUnitStatus(attacker, Status.HASTE);
            attacker.canAttack = false;

            const attackerOwnerId = this.instances.getOwnerId(attacker);

            if (!attacker.statuses.silenced) {
                this.runTriggerEffects(EFFECT_TRIGGERS.ATTACKED, { playerId: attackerOwnerId, source: attacker, attacked: card });
                this.runTriggerEffects(EFFECT_TRIGGERS.ANY_ATTACKED, { playerId: attackerOwnerId, source: attacker, attacked: card });
            }

            this.emitter.attacked(playerId);
        }

        if (card.statuses.dodge > 0) {
            this.removeUnitStatus(card, Status.DODGE);
        }
        else {
            const isUnitDead = this.decreaseUnitHealth(card, amount);

            if (!card.statuses.silenced) {
                this.runTriggerEffects(EFFECT_TRIGGERS.DAMAGED, { playerId, source: card, attacker });
            }
            
            this.runTriggerEffects(EFFECT_TRIGGERS.ANY_DAMAGED, { playerId, referenced: card });

            if (isUnitDead) {
                if (card.assignedBenchSlot) {
                    this.moveUnitFromBoardToBench(card);

                    this.resetUnitData(card);
                    this.increaseUnitCooldown(card, +1);
                }
                else {
                    this.removeUnitFromBoard(player, card);
                }

                if (!card.statuses.silenced) {
                    this.runTriggerEffects(EFFECT_TRIGGERS.DEATH, { playerId: card.ownerId! , source: card });
                }

                this.runTriggerEffects(EFFECT_TRIGGERS.ANY_DIED, { playerId, referenced: card });
                this.runTriggerEffects(EFFECT_TRIGGERS.ANY_DIED, { playerId: this.getOpponentId(playerId), referenced: card });
            }
        }
    }

    useSpell(playerId: string, card: SpellInstance) {
        const player = this.getPlayerState(playerId);

        const needsTarget = this.runTriggerEffects(EFFECT_TRIGGERS.SUMMONED, { playerId, source: card });
        
        this.moveSpellFromHandToDrawpile(player, card); // also checks for token

        if (!needsTarget){
            this.emitter.playedSpell(this.state.gameId, card);
            this.runTriggerEffects(EFFECT_TRIGGERS.ANY_SPELL_PLAYED, { playerId, referenced: card });
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
                this.decreaseUnitCooldown(player.socketId, unit, 1);
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

        // change player turn
        if (phaseChanged && this.state.gamePhase === GamePhase.SHOP) {
            const lessHpId = players.toSorted((p1, p2) => p1.hp - p2.hp)[0].socketId;
            this.setPlayerTurnId(lessHpId);
        }
        else { 
            const opponent = this.getOpponentState(this.state.playerTurnId);
            this.setPlayerTurnId(opponent.socketId);
        }

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
            return; //? or do we need to throw an error
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
            this.emitter.playedSpell(this.state.gameId, data.source);
        }

        this.effects.runEffect(effect, data);   
                
        if (data.source.type === InstanceType.SPELL){
            this.runTriggerEffects(EFFECT_TRIGGERS.ANY_SPELL_PLAYED, { playerId: player.socketId, referenced: data.source });
        }
    }
}