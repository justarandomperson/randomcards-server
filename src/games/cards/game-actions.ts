import { GameState } from "../games.types";
import { Card, CardInstance } from "./card.types";
import { CardsService } from "./cards.service";

export class GameActions {

    constructor(
        private readonly game: GameState,
        private readonly _cardsService: CardsService
    ) {}

    dealDamageToUnit(targetID: string, amount: number)
    {
        let target: CardInstance | null = this.findTarget(targetID)
        target.hp -= amount
        if (target.hp <= 0) target = null
       this.updateTarget(targetID, target)
    }

    dealDamageToPlayer(playerIndex: number, amount: number)
    {
        if (playerIndex < 0 || playerIndex > 1) throw new Error("Player doesn't exist")
        this.game.players[playerIndex].hp -= amount

        return this.game.players[playerIndex].hp < 0
    }

    addCardToPlayerHand(cardID: string, playerIndex: number)
    {
        const card = this._cardsService.createCardFromId(cardID)
        this.game.players[playerIndex].hand.push(card)
    }

    summonUnit(cardID: string, playerIndex: number)
    {
        const index = this.findAvailableBoardSlot(playerIndex == 0)
        if (index == -1) return false
        
        const card = this._cardsService.createCardFromId(cardID)

        this.game.board[index] = card
    }

    private findTarget(targetID: string)
    {
        const target = this.game.board.find((unit) => {unit?.id == targetID})
        if (!target) throw new Error("No target found with specificed ID")
        return target
    }

    private updateTarget(targetID: string, updatedData: CardInstance | null)
    {
       const targetIndex = this.game.board.findIndex((unit) => {unit?.id == targetID})
       this.game.board[targetIndex] = updatedData
    }

    private findAvailableBoardSlot(player1Side: boolean)
    {
        const possiblesSlots: number[] = []
        if (player1Side) possiblesSlots.push(0, 1, 2, 3)
        else possiblesSlots.push(4, 5, 6, 7)

        possiblesSlots.map((index) => {
            if (!this.game.board[index]) return index
        })

        return -1
    }

}