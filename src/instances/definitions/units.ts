import { EFFECT_TRIGGERS, EffectContext, Status } from '../../effects/effects.types';
import { InstanceType, InstanceZone, UnitInstance } from '../shared/instances.types';


const unitList: UnitInstance[] = [
    {
        id: "U_1",
        name: "dog",
        type: InstanceType.UNIT,
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
        type: InstanceType.UNIT,
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
        type: InstanceType.UNIT,
        effectDesc: "Summon & Turn Start: Add a Gaster Blaster to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED, EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const gasterBlaster = ctx.instances.createSpellInstance("S_666", ctx.playerId);
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
        type: InstanceType.UNIT,
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
        type: InstanceType.UNIT,
        effectDesc: "Summon: fills your board with cats. \n Death: kills all of your cats.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const cat = ctx.instances.createUnitInstance("U_2", ctx.playerId);

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
        type: InstanceType.UNIT,
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
        type: InstanceType.UNIT,
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
        type: InstanceType.UNIT,
        effectDesc: "Turn End & Death: Add a Cooldown Hating Spell to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END, EFFECT_TRIGGERS.DEATH],
                execute: (ctx: EffectContext) => {
                    const cooldownHatingSpell = ctx.instances.createSpellInstance("S_4", ctx.playerId);
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
        name: "The Silent",
        type: InstanceType.UNIT,
        effectDesc: "On Summon & Turn Start: Add a Shiv to your hand. \n" +
                    "Whenever your shiv kills a monster, this gains +1 ATK.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED, EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const cooldownHatingSpell = ctx.instances.createSpellInstance("S_4", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), cooldownHatingSpell);

                    // Note: buff effect happens on shiv
                }
            }
        ],
        statuses: [Status.HASTE],
        cost: 6,
        hp: 6,
        atk: 3,
        cooldown: 0   
    },
    {
        id: "U_9",
        name: "The Ironclad",
        type: InstanceType.UNIT,
        effectDesc: "Haste. Damaged: Gain +2 ATK.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.DAMAGED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.increaseUnitAttack(ctx.source as UnitInstance, 2);
                }
            }
        ],
        statuses: [Status.HASTE],
        cost: 6,
        hp: 8,
        atk: 2,
        cooldown: 0   
    },
    {
        id: "U_10",
        name: "The Defect",
        type: InstanceType.UNIT,
        effectDesc: "On Summon: Add a Lightning Orb to your hand. \n" + 
                    "Turn End: Activate the leftmost Orb in your hand. ",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), lightningOrb);
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    const playerHand = ctx.actions.getPlayerState(ctx.playerId).hand;

                    for (const spell of playerHand) {
                        if (["S_8", "S_9", "S_10"].includes(spell.id)) {
                            ctx.actions.useSpell(ctx.playerId, spell);
                        }
                    }
                }
            },

        ],
        statuses: [],
        cost: 5,
        hp: 4,
        atk: 4,
        cooldown: 0   
    },
    {
        id: "U_11",
        name: "Storm",
        type: InstanceType.UNIT,
        effectDesc: "Turn Start: add a Lightning Orb to your hand.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), lightningOrb);
                }
            },
        ],
        statuses: [],
        cost: 3,
        hp: 5,
        atk: 0,
        cooldown: 0   
    },
    {
        id: "U_12",
        name: "Glacier",
        type: InstanceType.UNIT,
        effectDesc: "Turn Start: add a Frost Orb to your hand.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const frostOrb = ctx.instances.createSpellInstance("S_9", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), frostOrb);
                }
            },
        ],
        statuses: [],
        cost: 3,
        hp: 5,
        atk: 0,
        cooldown: 0   
    },
    {
        id: "U_13",
        name: "Doom & Gloom",
        type: InstanceType.UNIT,
        effectDesc: "On Summon: add a Dark Orb to your hand.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const darkOrb = ctx.instances.createSpellInstance("S_10", ctx.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.playerId), darkOrb);
                }
            },
        ],
        statuses: [],
        cost: 4,
        hp: 5,
        atk: 3,
        cooldown: 0   
    },
    {
        id: "U_14",
        name: "Golden Experience Requiem",
        type: InstanceType.UNIT,
        effectDesc: "Turn End: Silence & Kill the leftmost enemy monster, then summon it again.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                   // TODO: this
                }
            },
        ],
        statuses: [],
        cost: 10,
        hp: 10,
        atk: 8,
        cooldown: 0   
    },
    {
        id: "U_15",
        name: "Bluestorm",
        type: InstanceType.UNIT,
        effectDesc: "Summon: copy the effect of the monster infront of this.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const monsterInfront = ctx.actions.getMonsterInfront(ctx.instances.getLocationIndex(ctx.source, InstanceZone.BOARD));

                    if (monsterInfront) {
                        ctx.source.effects = monsterInfront.effects;
                        ctx.source.effectDesc = `Copied: ${monsterInfront.effectDesc}`;
                    }
                }
            },
        ],
        statuses: [],
        cost: 7,
        hp: 3,
        atk: 3,
        cooldown: 0   
    },
];

export const unitsMap = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);