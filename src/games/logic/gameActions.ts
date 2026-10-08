import { WsException } from '@nestjs/websockets';
import { CardsService } from '../../cards/cards.service';
import { CardLocation, CardZone, SpellInstance, UnitInstance } from '../../cards/cards.types';
import { GameState, PlayerState } from '../shared/games.types';
import { MAX_HAND_SIZE, MINIMUM_MONEY } from '../shared/games.constants';
import { ArtifactInstance, ArtifactLocation, ArtifactZone } from '../../artifacts/artifacts.types';
import { fillShop } from './gameSetup';


export class GameActions {
    constructor(
        private readonly state: GameState,
        private readonly _cardsService: CardsService,
    ) {}


    // initializers, getters, setters etc
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

    isPlayer1(playerId: string): boolean {
        return [...this.state.players.keys()][0] === playerId;
    }
    

    // ACTIONS

    // move cards/artifacts, add them etc
    moveUnitToBoard(playerId: string, card: UnitInstance, boardIndex: number, benchIndex: number): CardLocation {
        const player = this.getPlayerState(playerId);

        this.state.board[boardIndex] = card;
        player.bench[benchIndex] = null;

        return {
            insideOf: CardZone.BOARD,
            index: boardIndex
        };
    }

    moveUnitToBench(playerId: string, card: UnitInstance, benchIndex: number, boardIndex: number): CardLocation {
        const player = this.getPlayerState(playerId); 

        player.bench[benchIndex] = card;
        this.state.board[boardIndex] = null;

        return { 
            insideOf: CardZone.BENCH, 
            index: benchIndex 
        };
    }

    moveSpellToDrawpile(playerId: string, card: SpellInstance, handIndex: number): CardLocation | null {
        const player = this.getPlayerState(playerId);
        
        if (player.hand.length === MAX_HAND_SIZE) {
            return null;
        }

        player.hand.splice(handIndex, 1);
        player.drawpile.push(card);


        return {
            insideOf: CardZone.NONE
        };
    }

    addSpellToHand(playerId: string, card: SpellInstance): CardLocation {
        const player = this.getPlayerState(playerId);

        player.hand.push(card);

        return {
            insideOf: CardZone.HAND,
            index: player.hand.length - 1
        };
    }

    removeSpellFromDrawpile(playerId: string): SpellInstance | null {
        const player = this.getPlayerState(playerId);

        const spell = player.drawpile.pop(); // TODO: add logic to drawing a card (randomly) later
        if (!spell) {
            return null;
        }

        return spell;
    }

    moveArtifactToInventory(playerId: string, artifact: ArtifactInstance, shopIndex: number): ArtifactLocation {
        const player = this.getPlayerState(playerId);

        this.state.shop[shopIndex] = null;
        player.artifacts.push(artifact);

        return {
            insideOf: ArtifactZone.PLAYER,
            index: player.artifacts.length - 1
        };
    }

    
    // change card/artifact data
    damageUnit(targetInstance: UnitInstance, amount: number): boolean {
        targetInstance.hp -= amount;
        if (targetInstance.hp <= 0) { 
            targetInstance.cooldown = 1;
            return true; // as in unit died
        }

        return false; // as in unit still on board
    }


    // change player data
    damagePlayer(playerId: string, amount: number): number {
        const player = this.getPlayerState(playerId);

        player.health -= amount;

        return player.health;
    }

    removeMoney(playerId: string, amount: number): number {
        const player = this.getPlayerState(playerId);

        player.money -= amount;
        if (player.money < MINIMUM_MONEY) {
            player.money = MINIMUM_MONEY;
        }

        return player.money;
    }

    addMoney(playerId: string, amount: number): number {
        const player = this.getPlayerState(playerId);

        player.money += amount;
        return player.money;
    }

    refillShop() {
        this.state.shop = fillShop(this.state.shop);
    }
}
