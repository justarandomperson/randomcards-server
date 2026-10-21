import { WsException } from '@nestjs/websockets';
import { UnitInstance, SpellInstance, CardInstance, CardLocation } from './cards.types';
import { unitsMap } from './definitions/units';
import { spellsMap } from './definitions/spells';


export class CardsService {
    // initializers, getters, setters
    createUnitInstance = (unitId: string, ownerId: string): UnitInstance => {
        return this.createCardInstance(unitsMap, unitId, ownerId) as UnitInstance;
    }

    createSpellInstance(spellId: string, ownerId: string): SpellInstance{
        return this.createCardInstance(spellsMap, spellId, ownerId) as SpellInstance;
    }

    private createCardInstance(cardList: Map<string, CardInstance>, cardId: string, ownerId: string): CardInstance {
        const card = cardList.get(cardId);
        if (!card){
            throw new WsException("card with this id does not exist.");
        }

        const cardInstance = {
            ...card,
            instanceId: this.generateInstanceId(),
            ownerId
        };

        return cardInstance;
    }

    getCardOwnerId(card: UnitInstance | SpellInstance): string {
        if (!card.ownerId) {
            throw new WsException('card has no ownerId');
        }

        return card.ownerId;
    }

    getCardInstanceId(card: UnitInstance | SpellInstance): string {
        if (!card.instanceId) {
            throw new WsException('card has no instanceId');
        }

        return card.instanceId;  
    }

    getCardLocation(card: UnitInstance | SpellInstance): CardLocation {
        if (!card.location) {
            throw new WsException('card has no location');
        }

        return card.location;
    }

    getUnitBenchSlot(card: UnitInstance): number {
        if (!card.assignedBenchSlot) {
            throw new WsException('card has no assigned bench slot');

        }

        return card.assignedBenchSlot;
    }
 
    private generateInstanceId(): string {
        return Math.random().toString(36).substring(2, 8);
    }


    // services
    getDefaultUnitById(cardId: string): UnitInstance {
        const unit = unitsMap.get(cardId);

        if (!unit) {
            throw new WsException("card with this id does not exist.");
        }

        return unit;
    }

    findCardInstance<T extends UnitInstance | SpellInstance>(instanceId: string, cardList: (T | null)[]): T {
        const index = cardList.findIndex(
            (card) => card?.instanceId === instanceId
        );
    
        if (index === -1) {
            throw new WsException('target not found');
        }
    
        return cardList[index]!;
    }

    findEmptySlot(cardList: (CardInstance | null)[]): number {
        for (let i = 0; i < cardList.length; i++) {
            if (!cardList[i]) {
                return i; 
            }
        }

        throw new WsException('cannot find empty slot');
    }    
}
