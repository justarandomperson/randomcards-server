import { EFFECT_TRIGGERS, EffectContext } from "../../effects/effects.types";
import { CardType, CardZone, SpellInstance } from "../cards.types";
import { getTargetId } from "../../effects/helpers";
import { SOCKET_EVENT_NAMES } from "../../games/shared/games.constants";


const spellList: SpellInstance[] = [
    {
        id: "S_1",
        name: "cat",
        type: CardType.SPELL,
        effectDesc: "though I may bear the semblance of canine form, I possess no corporeal body whatsoever. " +
                    "Pray, doth it befit thee to name such a being a cat?" +
                    "Farewell, and may the hours yet before you be wondrous and fair!",
        effects: [],
        cost: 0,
    },
    {
        id: "S_2",
        name: "Flex",
        type: CardType.SPELL,
        effectDesc: "Give an ally monster +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (context: EffectContext) => {
                    const targetId = getTargetId(context);

                    context.actions.increaseAttack(targetId, 2);

                    // TODO: need to emit 2 events here, one for each
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
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (context: EffectContext) => {
                    const targetId = getTargetId(context);

                    context.actions.damagePlayer(context.playerId, 3);
                    context.actions.increaseUnitHealth(targetId, 3);

                    // TODO: need to emit 4 events here (two for changing the player hp and two for update unit)
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
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (context: EffectContext) => {
                    const targetId = getTargetId(context);
                
                    context.actions.increaseCooldown(targetId, -1);

                    const player = context.actions.getPlayerState(context.playerId);
                    const { card, index } = context.cardsService.findCardInstance(targetId, player.bench)

                    const event: effectEventPayload= {
                        name: SOCKET_EVENT_NAMES.UPDATE_CARD,
                        payload: {
                            clientId: context.playerId,
                            card: card,
                            cardLocation: { insideOf: CardZone.BENCH, index: index }
                        }
                    }
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
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (context: EffectContext) => {
                    const targetId = getTargetId(context);

                    context.actions.damageUnit(targetId, 8);

                    // TODO: emit 2 events
                }
            }
        ],
        cost: 4,
    },
];

export const spellCards = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);