import { EffectContext } from "../../effects/effects.types";
import { CardType, SpellInstance } from "../cards.types";


const spellList: SpellInstance[] = [
    {
        id: "S_1",
        name: "cat",
        type: CardType.SPELL,
        effectDesc: "although i may look like it, im not dog. have a wonderful rest of your day!",
        effects: [],
        cost: 3,
    },
    {
        id: "S_666",
        name: "Gaster Blaster",
        type: CardType.SPELL,
        effectDesc: "i will blast your glast",
        effects: [
            {
                trigger: [],
                execute: (context: EffectContext) => {
                   
                }
            }
        ],
        cost: 4,
    },
];

export const spellCards = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);