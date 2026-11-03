import { Injectable } from "@nestjs/common";
import { Deck, DeckIds, Storage } from "../shared/decks.types";
import { CardInstance, InstanceType, InstanceZone, SpellInstance, UnitInstance } from "../../instances/shared/instances.types";
import { WsException } from "@nestjs/websockets";
import { spellsMap } from "../../instances/definitions/spells";
import { InstancesService } from "../../instances/providers/instances.service";
import { unitsMap } from "../../instances/definitions/units";


@Injectable()
export class DecksService {
    constructor(private readonly instances: InstancesService) {}


    // services
    getStorage(): Storage {
        const units: UnitInstance[] = [...unitsMap.values()]
        const spells: [string, { data: SpellInstance, amount: number }][] = [];

        for (const spell of spellsMap.values()) { 
            if (!spell.isToken) {
                spells.push([spell.id, { data: spell, amount : 2 }]);
            }
        }

        return {
            units,
            spells
        };
    }


    deckIdsToDeck(deckIds: DeckIds, ownerId: string): Deck {
        const units = this.cardIdsToCardList(deckIds.unitIds, InstanceType.UNIT, ownerId);
        const spells = this.cardIdsToCardList(deckIds.spellIds, InstanceType.SPELL,  ownerId);

        const deck: Deck = {
            units,
            spells
        };

        return deck;
    }

    private cardIdsToCardList(cardIds: string[], cardType: InstanceType.UNIT, ownerId: string): UnitInstance[];
    private cardIdsToCardList(cardIds: string[], cardType: InstanceType.SPELL, ownerId: string): SpellInstance[];
    private cardIdsToCardList(cardIds: string[], cardType: InstanceType, ownerId: string): CardInstance[] {
        return cardIds.map((id, index) => {
            const card = (cardType === InstanceType.UNIT) ? 
                this.instances.createUnitInstance(id, ownerId) : this.instances.createSpellInstance(id,  ownerId);

            if (!card || card.type !== cardType) {
                throw new WsException(`Card with Id ${id} does not exist`);
            }
            
            if (card.type === InstanceType.UNIT) {
                card.assignedBenchSlot = index;
                card.location = { insideOf: InstanceZone.BENCH, index: index };
            }

            else if (card.type === InstanceType.SPELL) {
                card.inDeck = true;
                card.location = { insideOf: InstanceZone.NONE };
            }

            return card;
        });
    }
}