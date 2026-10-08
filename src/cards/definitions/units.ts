import { EFFECT_TRIGGERS, EffectContext } from '../../effects/effects.types';
import { CardsService } from '../cards.service';
import { CardType, UnitInstance } from '../cards.types';


const unitList: UnitInstance[] = [
    {
        id: "U_1",
        name: "dog",
        type: CardType.UNIT,
        effectDesc: "im dog",
        effects: [],
        statuses: [],
        cost: 3,
        hp: 1,
        atk: 2,
    },
    {
        id: "U_2",
        name: "sans the skeleton",
        type: CardType.UNIT,
        effectDesc: "Summon & Turn Start: Add a Gaster Blaster to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED, EFFECT_TRIGGERS.TURN_START],
                execute: (context: EffectContext) => {
                    const gasterBlaster = context.cardsService.createSpellInstance("S_666", context.playerId);
                    context.game.actions.addSpellToHand(context.playerId, gasterBlaster);
                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 1,
        atk: 1
    }
];

export const unitCards = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);