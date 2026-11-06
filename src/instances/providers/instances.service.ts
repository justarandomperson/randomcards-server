import { WsException } from '@nestjs/websockets';
import { promises as fs } from 'fs';
import { UnitInstance, SpellInstance, CardInstance, AnyInstance, InstanceLocation, InstanceZone, InstanceType, ArtifactInstance, ImagesList } from '../shared/instances.types';
import { spellsMap } from '../definitions/spells';
import { unitsMap } from '../definitions/units';
import path from 'path';


export class InstancesService {
    // initializers, getters, setters
    createUnitInstance = (unitId: string, ownerId: string): UnitInstance => {
        const instance = this.createCardInstance(unitsMap, unitId, ownerId) as UnitInstance;
        return instance
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

    typeInstance(instance: AnyInstance, type: InstanceType.UNIT): UnitInstance;
    typeInstance(instance: AnyInstance, type: InstanceType.SPELL): SpellInstance;
    typeInstance(instance: AnyInstance, type: InstanceType.ARTIFACT): ArtifactInstance;
    typeInstance(instance: AnyInstance, type: InstanceType): AnyInstance {
        if (instance.type !== type) {
            throw new WsException('types dont line up');
        }

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
            console.log("no location..")
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

    getUnits(): Map<string, UnitInstance>
    {
        return unitsMap
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

    generateArtifactInstances(artifactList: ArtifactInstance[]): ArtifactInstance[] {
        for (const artifact of artifactList) {
            artifact.instanceId = this.generateInstanceId()
        }

        return artifactList
    }
    
    async getImages(): Promise<ImagesList> {
        const [artifacts, spells, units, statuses] = await Promise.all([
            this.readDirectory(path.join('src', 'instances', 'shared', 'images', 'artifacts')),
            this.readDirectory(path.join('src', 'instances', 'shared', 'images', 'spells')),
            this.readDirectory(path.join('src', 'instances', 'shared', 'images', 'units')),
            this.readDirectory(path.join('src', 'instances', 'shared', 'images', 'statuses')),
        ]);

        return [...artifacts, ...spells, ...units, ...statuses];
    }

    private async readDirectory(dirname: string): Promise<ImagesList> {
        try {
            const files = await fs.readdir(dirname, { withFileTypes: true });

            return await Promise.all(
                files.map(async (file): Promise<[string, string]> => {
                    const data = await fs.readFile(path.join(dirname, file.name));
                    const id = file.name.slice(0, file.name.length - ".png".length);

                    return [id, data.toString('base64')];
                })
            );

        } catch (err) {
            console.log(`Failed to read directory ${dirname}`, err);
            throw err;
        }
    }
}
