import { CardInstance } from './card.types';
import { cards } from './definitions/units';

export class CardsService {
  constructor() {}

  createCardFromId(id: string) {
    const card = cards.find((card: CardInstance) => {
      card.id == id;
    });
    if (!card) throw new Error('Card with id ' + id + " doesn't exist");
    const uniqueId = Math.random().toString(36).substring(2, 8);

    card.id = uniqueId;
    return card;
  }
}
