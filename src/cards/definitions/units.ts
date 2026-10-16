import { WsException } from '@nestjs/websockets';
import { Effect, EFFECT_TRIGGERS, EffectContext, Status } from '../../effects/effects.types';
import { CardsService } from '../cards.service';
import { CardType, CardZone, UnitInstance } from '../cards.types';
import { effectEventPayload } from '../../games/shared/games.types';
import { SOCKET_EVENT_NAMES } from '../../games/shared/games.constants';
import { getTargetId } from '../../effects/helpers';


const unitList: UnitInstance[] = [
    {
        id: "U_1",
        name: "dog",
        type: CardType.UNIT,
        effectDesc: "im dog",
        effects: [],
        statuses: [],
        cost: 2,
        hp: 1,
        atk: 2,
        cooldown: 0
    },
    {
        id: "U_2",
        name: "cat",
        type: CardType.UNIT,
        effectDesc: "although i may look like it, im not dog. have a wonderful rest of your day!",
        effects: [],
        statuses: [],
        cost: 2, 
        hp: 2,
        atk: 1,
        cooldown: 0
    },
    {
        id: "U_3",
        name: "sans the skeleton",
        type: CardType.UNIT,
        effectDesc: "Summon & Turn Start: Add a Gaster Blaster to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED, EFFECT_TRIGGERS.TURN_START],
                execute: (context: EffectContext) => {
                    const gasterBlaster = context.cardsService.createSpellInstance("S_666", context.playerId);
                    const location = context.actions.addSpellToHand(context.playerId, gasterBlaster);

                    if (location) {
                        const event: effectEventPayload = {
                            name: SOCKET_EVENT_NAMES.UPDATE_CARD,
                            payload: {
                                clientId: context.playerId,
                                card: gasterBlaster,
                                cardLocation: location
                            }
                        };

                        context.actions.addEffectEvent(event);
                    }


                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 1,
        atk: 1,
        cooldown: 0
    },
    {
        id: "U_4",
        name: "Green Gaster",
        type: CardType.UNIT,
        effectDesc: "Summon: Turns an unit to green (deals 1 damage)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (context: EffectContext) => {
                    const targetId = getTargetId(context);

                    context.actions.damageUnit(targetId, 1);
                   
                    
                    //? we will need to emit 2 events, for effects that a unit directly attacks, even 4
                    //? we should make an event called UPDATE_CARD_BOTH or something, idk... 
                    const event: effectEventPayload = {
                        name: SOCKET_EVENT_NAMES.UPDATE_CARD,
                        payload: {
                            clientId:
                            card:
                            location:
                        }
                    }
                    context.actions.addEffectEvent(event)
                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 6,
        atk: 6,
        cooldown: 0
    },
    {
        id: "U_5",
        name: "Catboy",
        type: CardType.UNIT,
        effectDesc: "Summon: fills your board with cats. \n Death: kills all of your cats.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (context: EffectContext) => {
                    const playerBoard = context.actions.getPlayerBoard(context.playerId);

                    for (const slot of playerBoard) {
                        if (!slot) {
                            const cat = context.cardsService.createUnitInstance("U_2", context.playerId);

                            //? need to run "any_summoned" effect over this>???
                            context.actions.moveUnitToBoard(context.playerId, cat, )

                            //? umm how will i actually set the cat to appear in the slot?
                        }
                    }
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.DEATH],
                execute: (context: EffectContext) => {
                    const playerBoard = context.actions.getPlayerBoard(context.playerId);

                    for (const unit of playerBoard) {
                        if (unit && unit.id === "U_2") {
                            const instanceId = context.cardsService.getCardInstanceId(unit);
                            context.actions.damageUnit(instanceId, unit.hp);

                            //! Need to emit 2 events per unit here. one for each client
                        }

                    }
                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 4,
        atk: 1,
        cooldown: 0
    },
    {
       id: "U_6",
        name: "Silverfish",
        type: CardType.UNIT,
        effectDesc: "Haste and Dodge.", //? maybe should i turn it to an effect, Summon: gain haste and dodge?
        effects: [],
        statuses: [Status.HASTE, Status.DODGE],
        cost: 6,
        hp: 4,
        atk: 1,
        cooldown: 0  
    },
    {
        id: "U_7",
        name: "Endermite",
        type: CardType.UNIT,
        effectDesc: "Damaged: paralyze the attacker.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.DAMAGED],
                execute: (context: EffectContext) => {
                    // TODO: idk how to get the attacker we need to do that too
                }
            }
        ],
        statuses: [Status.TAUNT],
        cost: 4,
        hp: 3,
        atk: 4,
        cooldown: 0   
    },
    {
        id: "U_7",
        name: "Cooldown Hater 1.0",
        type: CardType.UNIT,
        effectDesc: "Turn End & Death: Add a Cooldown Hating Spell to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END, EFFECT_TRIGGERS.DEATH],
                execute: (context: EffectContext) => {
                    const cooldownHatingSpell = context.cardsService.createSpellInstance("S_4", context.playerId);
                    const location = context.actions.addSpellToHand(context.playerId, cooldownHatingSpell);

                    if (location) {
                        // if location is null, then nothing was added. nothing to emit
                        const event: effectEventPayload = {
                            name: SOCKET_EVENT_NAMES.UPDATE_CARD,
                            payload: {
                                clientId: context.playerId,
                                card: cooldownHatingSpell,
                                cardLocation: location
                            }
                        };

                        context.actions.addEffectEvent(event);
                    }
                }
            }
        ],
        statuses: [],
        cost: 4,
        hp: 3,
        atk: 4,
        cooldown: 0   
    }
];

export const unitCards = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);