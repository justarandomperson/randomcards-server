import { WsException } from '@nestjs/websockets';
import { UnitInstance, SpellInstance, CardInstance } from './cards.types';
import { unitCards } from './definitions/units';
import { spellCards } from './definitions/spells';


export class CardsService {


    // initializers, getters, setters
    createCardFromId(id: string, ownerID: string) {
        const card = unitCards.get(id);

        if (!card) {
            throw new Error(`Card with id ${id} doesn't exist`);
        } 

        const uniqueId = Math.random().toString(36).substring(2, 8);

        const cardInstance = {
            ...card,
            instanceId: uniqueId,
            ownerID: ownerID
        }
        
        return cardInstance;
    }

    createUnitInstance = (unitId: string, instanceId?: string): UnitInstance | null => {
        return this.createCardInstance(unitCards, unitId, instanceId) as UnitInstance | null;
    }

    createSpellInstance(spellId: string, instanceId?: string): SpellInstance | null {
        return this.createCardInstance(spellCards, spellId, instanceId) as SpellInstance | null;
    }

    private createCardInstance(cardList: Map<string, CardInstance>, cardId: string, instanceId?: string): CardInstance | null {
        const card = cardList.get(cardId);
        if (!card){
                return null;
            }

        const cardInstance = {
            ...card,
            instanceId
        };

        return cardInstance;
    }

    getCardOwnerId(card: UnitInstance | SpellInstance): string {
        if (!card.ownerId) {
            throw new WsException('card has no ownerId');
        }

        return card.ownerId;
    }


    // services
    findCardInstance<T extends UnitInstance | SpellInstance>
    (instanceId: string, cardList: (T | null)[]): { card: T; index: number } {
        const index = cardList.findIndex(
            (card) => card?.instanceId === instanceId
        );
    
        if (index === -1) {
            throw new WsException('target not found');
        }
    
        return { 
            card: cardList[index]!,
            index 
        };
    };

    findEmptySlot(cardList: (CardInstance | null)[]): number {
        for (let i = 0; i < cardList.length; i++) {
            if (!cardList[i]) {
                return i; 
            }
        }

        throw new WsException('cannot find empty slot');
    }
    
}
