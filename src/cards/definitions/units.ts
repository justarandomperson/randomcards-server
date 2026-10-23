import { EFFECT_TRIGGERS, EffectContext, Status } from '../../effects/effects.types';
import { CardType, UnitInstance } from '../cards.types';
import { SOCKET_EVENT_NAMES } from '../../games/shared/games.constants';


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
                execute: (ctx: EffectContext) => {
                    const gasterBlaster = ctx.cards.createSpellInstance("S_666", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), gasterBlaster);
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
                execute: (ctx: EffectContext) => {
                    if (ctx.target) {
                        ctx.actions.attackUnit(ctx.playerId, ctx.target, 1);
                    }          
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
                execute: (ctx: EffectContext) => {
                    const cat = ctx.cards.createUnitInstance("U_2", ctx.playerId);

                    // Note: we just try to fill the whole board, the action finds a slot
                    ctx.actions.summonUnit(ctx.playerId, cat);
                    ctx.actions.summonUnit(ctx.playerId, cat);
                    ctx.actions.summonUnit(ctx.playerId, cat);
                    ctx.actions.summonUnit(ctx.playerId, cat);
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.DEATH],
                execute: (ctx: EffectContext) => {
                    const playerBoard = ctx.actions.getPlayerBoard(ctx.playerId);

                    for (const unit of playerBoard) {
                        if (unit && unit.id === "U_2") {
                            const instanceId = ctx.cards.getCardInstanceId(unit);
                            ctx.actions.attackUnit(ctx.playerId, unit, unit.hp);
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
                execute: (ctx: EffectContext) => {
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
                execute: (ctx: EffectContext) => {
                    const cooldownHatingSpell = ctx.cards.createSpellInstance("S_4", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), cooldownHatingSpell);
                }
            }
        ],
        statuses: [],
        cost: 4,
        hp: 3,
        atk: 4,
        cooldown: 0   
    },
    {
        id: "U_8",
        name: "Cooldown Hater 2.0",
        type: CardType.UNIT,
        effectDesc: "Turn End & Death: Add a Cooldown Hating Spell to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END, EFFECT_TRIGGERS.DEATH],
                execute: (ctx: EffectContext) => {
                    const cooldownHatingSpell = ctx.cards.createSpellInstance("S_4", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), cooldownHatingSpell);
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

export const unitsMap = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);