import { UnitInstance, SpellInstance } from './cards.types';
import { unitCards } from './definitions/units';


export class CardsService {
  constructor() {}

  createCardFromId(id: string, ownerID: string) {
    const card = unitCards.find((card: UnitInstance) => { 
      return card.id == id; 
    });

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
}
