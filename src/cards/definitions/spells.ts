import { WsException } from "@nestjs/websockets";
import { EFFECT_TRIGGERS, EffectContext } from "../../effects/effects.types";
import { CardType, SpellInstance } from "../cards.types";


const spellList: SpellInstance[] = [
    {
        id: "S_1",
        name: "cat",
        type: CardType.SPELL,
        effectDesc: "though I may bear the semblance of canine form, I possess no corporeal body whatsoever. " +
                    "Pray, doth it befit thee to name such a being a cat?" +
                    "Farewell, and may the hours yet before you be wondrous and fair!",
        effects: [],
        cost: 3,
    },
    {
        id: "S_666",
        name: "Gaster Blaster",
        type: CardType.SPELL,
        effectDesc: "i will blast your glast (deal 8 damage to a unit)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED], //? maybe it shouldnt have a trigger, but i mean that works! right?
                execute: (context: EffectContext) => {
                    const targetId = context.targetId;
                    if (!targetId) {
                        throw new WsException("no targetId provided");
                    }

                    context.actions.damageUnit(targetId, 8);
                }
            }
        ],
        cost: 4,
    },
];

export const spellCards = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);