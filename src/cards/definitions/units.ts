import { Effect, EFFECT_TRIGGERS, EffectContext, Status } from '../../effects/effects.types';
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
        cost: 2,
        hp: 1,
        atk: 2,
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
        atk: 1
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
                    context.actions.addSpellToHand(context.playerId, gasterBlaster);
                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 1,
        atk: 1
    },
    {
        id: "U_4",
        name: "Green Gaster",
        type: CardType.UNIT,
        effectDesc: "Summon: Turns an unit to green (deals 1 damage)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    //? maybe later store the effect "magic numbers" somewhere else
                    //? probably still inside the card

                    if (ctx.targetId) {
                        ctx.actions.damageUnit(ctx.targetId, 1);
                    }
                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 6,
        atk: 6
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
                    // TODO: this effect
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.DEATH],
                execute: (context: EffectContext) => {
                    const playersSummonedUnits = context.state.board.filter(
                        (unit): unit is UnitInstance => unit?.ownerId === context.playerId
                    );

                    for (const unit of playersSummonedUnits) {
                        if (unit.id === "U_2") {
                            const instanceId = context.cardsService.getCardInstanceId(unit);
                            context.actions.damageUnit(instanceId, unit.hp);
                        }
                    }
                }
            }
        ],
        statuses: [],
        cost: 6,
        hp: 4,
        atk: 1  
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
        atk: 1    
    },
    {
        id: "U_6",
        name: "Silverfish",
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
        atk: 4    
    }
];

export const unitCards = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);