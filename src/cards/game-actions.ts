import { GameState } from '../games/shared/games.types';
import { UnitInstance, SpellInstance } from './cards.types';
import { CardsService } from './cards.service';

export class GameActions {
  constructor(
    private readonly _cardsService: CardsService,
  ) {}

  dealDamageToUnit(game:GameState, targetID: string, amount: number) {
    const target: UnitInstance = this.findUnitInstance(game, targetID);
    this.dealDamageToUnitInstance(game, target, amount)
  }

  dealDamageToUnitInstance(game:GameState, target: UnitInstance, amount: number) {
    target.hp -= amount;
    if (target.hp <= 0) this.updateUnitInstance(game, target.id, null);
    else this.updateUnitInstance(game, target.id, target);
  }

  dealDamageToPlayer(game: GameState, playerID: string, amount: number) {
    if (!game.players.has(playerID)) throw new Error("Player doesn't exist");

    game.players[playerID].hp -= amount;

    return game.players[playerID].hp < 0;
  }

  addCardToPlayerHand(game: GameState, cardID: string, playerID: string) {
    const card = this._cardsService.createCardFromId(cardID, playerID);
    game.players[playerID].hand.push(card);
  }

  summonUnit(game: GameState, cardID: string, playerIndex: number, playerID: string) {
    const index = this.findAvailableBoardSlot(game, playerIndex == 0);
    if (index == -1) return false;

    const card = this._cardsService.createCardFromId(cardID, playerID);

    game.board[index] = card;
  }

  findUnitInstance(game:GameState, targetID: string) {
    const target = game.board.find((unit) => {
      unit?.id == targetID;
    });
    if (!target) throw new Error('No target found with specificed ID');
    return target;
  }

  private updateUnitInstance(game: GameState, targetID: string, updatedData: UnitInstance | null) {
    const targetIndex = game.board.findIndex((unit) => {
      unit?.id == targetID;
    });
    game.board[targetIndex] = updatedData;
  }

  private findAvailableBoardSlot(game:GameState, player1Side: boolean) {
    const possiblesSlots: number[] = [];
    if (player1Side) possiblesSlots.push(0, 1, 2, 3);
    else possiblesSlots.push(4, 5, 6, 7);

    possiblesSlots.map((index) => {
      if (!game.board[index]) return index;
    });

    return -1;
  }
}
