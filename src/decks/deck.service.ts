import { Injectable } from "@nestjs/common";
import { Deck, DeckIds } from "./decks.types";
import { CardsService } from "../cards/cards.service";
import { CardInstance, CardType, SpellInstance, UnitInstance } from "../cards/cards.types";
import { WsException } from "@nestjs/websockets";


@Injectable()
export class DecksService {
    constructor(private readonly cardsService: CardsService) {}


    // services
    deckIdsToDeck(deckIds: DeckIds): Deck {
        const units = this.cardIdsToCardList(deckIds.unitIds, CardType.UNIT);
        const spells = this.cardIdsToCardList(deckIds.spellIds, CardType.SPELL);

        const deck: Deck = {
            units,
            spells
        };

        return deck;
    }

    private cardIdsToCardList(cardIds: string[], cardType: CardType.UNIT): UnitInstance[];
    private cardIdsToCardList(cardIds: string[], cardType: CardType.SPELL): SpellInstance[];
    private cardIdsToCardList(cardIds: string[], cardType: CardType): CardInstance[] {
        return cardIds.map((id) => {
            const card = cardType === CardType.UNIT ? 
                this.cardsService.createUnitInstance(id) : this.cardsService.createSpellInstance(id);

            if (!card || card.type !== cardType) {
                throw new WsException(`Card with Id ${id} does not exist`);
            }

            return card;
        });
    }
}