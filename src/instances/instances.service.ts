import { WsException } from '@nestjs/websockets';
import { UnitInstance, SpellInstance, CardInstance, AnyInstance, InstanceLocation, InstanceZone, InstanceType, ArtifactInstance } from './shared/instances.types';
import { spellsMap } from './definitions/spells';
import { unitsMap } from './definitions/units';


export class InstancesService {
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

    typeInstance(instance: AnyInstance): UnitInstance;
    typeInstance(instance: AnyInstance): SpellInstance;
    typeInstance(instance: AnyInstance): ArtifactInstance;
    typeInstance(instance: AnyInstance): AnyInstance {
        if (instance.type === InstanceType.UNIT) {
            return instance as UnitInstance;
        }
        if (instance.type === InstanceType.SPELL) {
            return instance as SpellInstance;
        }

        return instance as ArtifactInstance;
    }

    getOwnerId(instance: AnyInstance): string {
        if (!instance.ownerId) {
            throw new WsException('instance has no ownerId');
        }

        return instance.ownerId;
    }

    getInstanceId(instance: AnyInstance): string {
        if (!instance.instanceId) {
            throw new WsException('instance has no instanceId');
        }

        return instance.instanceId;  
    }

    getLocation(instance: AnyInstance): InstanceLocation {
        if (!instance.location) {
            throw new WsException('instance has no location'); 
        }

        return instance.location;
    }

    getLocationIndex(instance: AnyInstance, expectedInsideOf?: InstanceZone): number {
        const location = this.getLocation(instance);

        if (expectedInsideOf && expectedInsideOf !== location.insideOf) {
            throw new WsException('card is not in the expected location');
        }

        if (location.insideOf === InstanceZone.NONE) {
            throw new WsException('cardZone is NONE');
        }

        return location.index;
    }

    getUnitBenchSlot(card: UnitInstance): number {
        if (!card.assignedBenchSlot) {
            throw new WsException('card has no assigned bench slot');

        }

        return card.assignedBenchSlot;
    }

    
    // helpers
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

    findInstance<T extends AnyInstance>(instanceId: string, list: (T | null)[]): T {
        const index = list.findIndex(
            (instance) => instance?.instanceId === instanceId
        );
        
        if (index === -1) {
            throw new WsException('target not found');
        }
    
        return list[index]!;
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
