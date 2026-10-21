import { Injectable } from "@nestjs/common";
import { Deck, DeckIds } from "./decks.types";
import { CardsService } from "../cards/cards.service";
import { CardInstance, CardType, CardZone, SpellInstance, UnitInstance } from "../cards/cards.types";
import { WsException } from "@nestjs/websockets";
import { unitsMap } from "../cards/definitions/units";
import { spellsMap } from "../cards/definitions/spells";
import { Storage } from "./decks.types";


@Injectable()
export class DecksService {
    constructor(private readonly cardsService: CardsService) {}


    // services
    getStorage(): Storage {
        const units: UnitInstance[] = [...unitsMap.values()]

        const spells = new Map<string, { data: SpellInstance, amount: number }>;

        for (const spell of spellsMap.values()) { 
            spells.set(spell.id, { data: spell, amount : 2 })
        }

        return {
            units,
            spells
        };
    }


    deckIdsToDeck(deckIds: DeckIds, ownerId: string): Deck {
        const units = this.cardIdsToCardList(deckIds.unitIds, CardType.UNIT, ownerId);
        const spells = this.cardIdsToCardList(deckIds.spellIds, CardType.SPELL,  ownerId);

        const deck: Deck = {
            units,
            spells
        };

        return deck;
    }

    private cardIdsToCardList(cardIds: string[], cardType: CardType.UNIT, ownerId: string): UnitInstance[];
    private cardIdsToCardList(cardIds: string[], cardType: CardType.SPELL, ownerId: string): SpellInstance[];
    private cardIdsToCardList(cardIds: string[], cardType: CardType, ownerId: string): CardInstance[] {
        return cardIds.map((id, index) => {
            const card = (cardType === CardType.UNIT) ? 
                this.cardsService.createUnitInstance(id, ownerId) : this.cardsService.createSpellInstance(id,  ownerId);

            if (!card || card.type !== cardType) {
                throw new WsException(`Card with Id ${id} does not exist`);
            }
            
            if (card.type === CardType.UNIT) {
                card.assignedBenchSlot = index;
                card.location = { insideOf: CardZone.BENCH, index: index };
            }

            return card;
        });
    }
}