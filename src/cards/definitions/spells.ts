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
        id: "S_2",
        name: "Flex",
        type: CardType.SPELL,
        effectDesc: "Give an ally monster +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED], //? maybe it shouldnt have a trigger, but i mean that works! right?   
                execute: (context: EffectContext) => {
                    const targetId = context.targetId;
                    if (!targetId) {
                        throw new WsException("no targetId provided");
                    }

                    context.actions.increaseAttack(targetId, 2);
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_3",
        name: "Take 3 hp off of yourself and give it to one of your units",
        type: CardType.SPELL,
        effectDesc: "I couldn't think of a better name",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED], //? maybe it shouldnt have a trigger, but i mean that works! right?   
                execute: (context: EffectContext) => {
                    const targetId = context.targetId;
                    if (!targetId) {
                        throw new WsException("no targetId provided");
                    }

                    context.actions.damagePlayer(context.playerId, 3);
                    context.actions.increaseUnitHealth(targetId, 3);
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_4",
        name: "cooldown hating spell",
        type: CardType.SPELL,
        effectDesc: "remove 1 turn from one of your benched unit's cooldown",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED], //? maybe it shouldnt have a trigger, but i mean that works! right?   
                execute: (context: EffectContext) => {
                    const targetId = context.targetId;
                    if (!targetId) {
                        throw new WsException("no targetId provided");
                    }

                    context.actions.increaseCooldown(targetId, -1);
                }
            }
        ],
        cost: 2,
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

                    context.actions.damageUnit(
                        targetId,
                        context.cardsService.findCardInstance(targetId, context.state.board).index,
                        8
                    );
                }
            }
        ],
        cost: 4,
    },
];

export const spellCards = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);