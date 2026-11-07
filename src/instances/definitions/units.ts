import { EFFECT_TRIGGERS, EffectContext, Status } from '../../effects/effects.types';
import { getRandomInt } from '../../games/logic/serviceHelpers';
import { MAX_CARDS_PER_BOARD_ROW } from '../../games/shared/games.constants';
import { InstanceType, InstanceZone, UnitInstance } from '../shared/instances.types';
import { targetOption } from '../../games/shared/games.types';
import { WsException } from '@nestjs/websockets';


const unitList: UnitInstance[] = [
    {
        id: "U_1",
        name: "dog",
        type: InstanceType.UNIT,
        effectDesc: "im dog",
        effects: [],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 2, 
        hp: 2,
        atk: 1,
        cooldown: 0
    },
    {
        id: "U_3",
        name: "sans the skeleton",
        type: InstanceType.UNIT,
        effectDesc: "Dodge (3). Summon & Turn Start: Add a Gaster Blaster to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED, EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const gasterBlaster = ctx.instances.createSpellInstance("S_666", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), gasterBlaster);
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 3
        },
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
                hasTarget:  new Set([targetOption.ALLY, targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {;
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 1);
                    }      
                }             
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
                    for (let i = 0; i < MAX_CARDS_PER_BOARD_ROW; i++) {
                        const cat = ctx.instances.createUnitInstance("U_2", ctx.data.playerId);
                        ctx.actions.summonUnit(ctx.data.playerId, cat);
                    }
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.DEATH],
                execute: (ctx: EffectContext) => {
                    const playerUnits = ctx.actions.getPlayerUnits(ctx.data.playerId);

                    for (const unit of playerUnits) {
                        if (unit.unit.id === "U_2") {
                            ctx.actions.attackUnit(ctx.data.playerId, unit.unit, unit.unit.hp);
                        }
                    }
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 6,
        hp: 4,
        atk: 1,
        cooldown: 0
    },
    {
       id: "U_6",
        name: "Silverfish",
        type: InstanceType.UNIT,
        effectDesc: "Dodge (1). Haste.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);
                    ctx.actions.addUnitStatus(source, Status.DODGE);
                    ctx.actions.addUnitStatus(source, Status.HASTE);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 2,
        hp: 2,
        atk: 2,
        cooldown: 0  
    },
    {
        id: "U_7",
        name: "Endermite",
        type: InstanceType.UNIT,
        effectDesc: "Taunt. Damaged: paralyze the attacker.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);
                    ctx.actions.addUnitStatus(source, Status.TAUNT);
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.DAMAGED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.attacker) {
                        ctx.actions.addUnitStatus(ctx.data.attacker, Status.PARALYZED);
                    }
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 3,
        hp: 3,
        atk: 3,
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
                    const shiv = ctx.instances.createSpellInstance("S_7", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), shiv);

                    // Note: buff effect happens on shiv
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },        
        cost: 5,
        hp: 5,
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
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);
                    ctx.actions.addUnitStatus(source, Status.HASTE);
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.DAMAGED],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);
                    ctx.actions.increaseUnitAttack(source, 2);
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },   
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
                    const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), lightningOrb);
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    const playerHand = ctx.actions.getPlayerState(ctx.data.playerId).hand;

                    for (const spell of playerHand) {
                        if (["S_8", "S_9", "S_10"].includes(spell.id)) {
                            ctx.actions.useSpell(ctx.data.playerId, spell);
                            break;
                        }
                    }
                }
            },

        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
                    const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), lightningOrb);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
                    const frostOrb = ctx.instances.createSpellInstance("S_9", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), frostOrb);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const darkOrb = ctx.instances.createSpellInstance("S_10", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), darkOrb);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                    if (opponentUnits.length > 0) {
                        const slotToAttack = opponentUnits[0];

                        ctx.actions.addUnitStatus(slotToAttack.unit, Status.SILENCED);
                        ctx.actions.attackUnit(ctx.data.playerId, slotToAttack.unit, slotToAttack.unit.hp);

                        const defaultUnit = ctx.instances.createUnitInstance(
                            slotToAttack.unit.id, ctx.actions.getOpponentId(ctx.data.playerId)
                        );

                        ctx.actions.summonUnit(ctx.data.playerId, defaultUnit, slotToAttack.index);
                    }
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
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
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);

                    const monsterInfront = ctx.actions.getUnitInfront(
                        ctx.instances.getLocationIndex(source, InstanceZone.BOARD)
                    );

                    if (monsterInfront) {
                        ctx.actions.changeUnitEffect(source, monsterInfront.effects, monsterInfront.effectDesc);
                    }
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 6,
        hp: 3,
        atk: 3,
        cooldown: 0   
    },
    {
        id: "U_16",
        name: "Clash Royale Skeleton",
        type: InstanceType.UNIT,
        effectDesc: "",
        effects: [],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 1,
        hp: 1,
        atk: 1,
        cooldown: 0   
    },
    {
        id: "U_17",
        name: "Clash Royale Witch",
        type: InstanceType.UNIT,
        effectDesc: "Turn Start: Summon a skeleton.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const skeleton = ctx.instances.createUnitInstance("U_16", ctx.data.playerId);
                    ctx.actions.summonUnit(ctx.data.playerId, skeleton);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 5,
        hp: 4,
        atk: 3,
        cooldown: 0   
    },
    {
        id: "U_18",
        name: "Dracula",
        type: InstanceType.UNIT,
        effectDesc: "Any Died: Gain 2 HP.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);
                    ctx.actions.increaseUnitHealth(source, 2);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 7,
        hp: 3,
        atk: 6,
        cooldown: 0   
    },
    {
        id: "U_19",
        name: "Dio",
        type: InstanceType.UNIT,
        effectDesc: "Turn End: Decrease all benched unit cooldowns by 1.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    const bench = ctx.actions.getPlayerState(ctx.data.playerId).bench;

                    for (let i = 0; i < bench.length; i++) {
                        const unit = bench[i];

                        if (unit) {
                            const cooldown = unit?.cooldown;

                            if (cooldown && cooldown >= 1) {
                                ctx.actions.decreaseUnitCooldown(ctx.data.playerId, unit, 1);
                            }
                        }
                    }
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 6,
        hp: 5,
        atk: 5,
        cooldown: 0   
    },
    {
        id: "U_20",
        name: "Random!Sans", // TODO: new effect!!
        type: InstanceType.UNIT,
        effectDesc: "",
        effects: [
            {
                trigger: [],
                execute: (ctx: EffectContext) => {
                    
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 5,
        hp: 1,
        atk: 1,
        cooldown: 0   
    },
    {
        id: "U_21",
        name: "Cooldown Hater 1.0",
        type: InstanceType.UNIT,
        effectDesc: "Turn End & Death: Add a Cooldown Hating Spell to your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END, EFFECT_TRIGGERS.DEATH],
                execute: (ctx: EffectContext) => {
                    const cooldownHatingSpell = ctx.instances.createSpellInstance("S_4", ctx.data.playerId);
                    ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), cooldownHatingSpell);
                }
            }
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 4,
        hp: 3,
        atk: 4,
        cooldown: 0   
    },
    {
        id: "U_22",
        name: "MR BEAST",
        type: InstanceType.UNIT,
        effectDesc: "Turn Start: Gain 3$.",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START, EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    ctx.actions.increasePlayerMoney(ctx.actions.getPlayerState(ctx.data.playerId), 3);
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 6,
        hp: 5,
        atk: 5,
        cooldown: 0   
    },
    {
        id: "U_23",
        name: "Kiyotaka Ayanokoji",
        type: InstanceType.UNIT,
        effectDesc: "Summon: Manipulates an enemy unit to attack a random enemy unit",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    const target = ctx.data.targetUnit;
                    if (target) {
                        const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                        const randomUnit = opponentUnits[getRandomInt(0, opponentUnits.length - 1)];

                        if (randomUnit) {
                            ctx.actions.attackUnit(ctx.data.playerId, randomUnit.unit, target.atk, target);
                            if (randomUnit.unit.instanceId !== target.instanceId)
                            {
                                // attack back
                                ctx.actions.attackUnit(ctx.data.playerId, target, randomUnit.unit.atk, randomUnit.unit);
                            }
                        }
                    }
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 7,
        hp: 5,
        atk: 5,
        cooldown: 0   
    },
       {
        id: "U_24",
        name: "Sung Jin-woo",
        type: InstanceType.UNIT,
        effectDesc: "Haste. gains +1 ATK whenever it attacks and kills",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.KILL],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.UNIT);
                    ctx.actions.increaseUnitAttack(source, 1);
                }
            },
        ],
        statuses: {
            haste: true,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        cost: 4,
        hp: 6,
        atk: 2,
        cooldown: 0   
    },
    {
        id: "U_25",
        name: "Saiki K.",
        type: InstanceType.UNIT,
        effectDesc: "Turn start: Trigger a random turn start effect, turn end: trigger a random turn end effect (no target effect)",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const triggers = ctx.data.source.additionalData?.["triggers"] ?? 1
                    for (let i = 0; i < triggers; i++)
                    {
                        const unitsMap = ctx.instances.getUnits();

                        const effects = [...unitsMap.values()].flatMap(unit =>
                            unit.effects.filter(effect =>
                                effect.trigger.includes(EFFECT_TRIGGERS.TURN_START) &&
                                !effect.hasTarget
                            )
                        );

                        if (effects.length === 0) return;

                        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                        randomEffect.execute(ctx)
                    }
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                     const triggers = ctx.data.source.additionalData?.["triggers"] ?? 1
                    for (let i = 0; i < triggers; i++)
                    {
                        const unitsMap = ctx.instances.getUnits();

                        const effects = [...unitsMap.values()].flatMap(unit =>
                            unit.effects.filter(effect =>
                                effect.trigger.includes(EFFECT_TRIGGERS.TURN_END) &&
                                !effect.hasTarget
                            )
                        );

                        if (effects.length === 0) return;

                        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                        randomEffect.execute(ctx)
                    }
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        additionalData: {
            "triggers": 1
        },
        cost: 8,
        hp: 7,
        atk: 7,
        cooldown: 0   
    },
    {
        id: "U_26",
        name: "Hatsune Miku", // TODO: add pic
        type: InstanceType.UNIT,
        effectDesc: "Turn start: Heal a random ally unit by 2 HP and add a counter." +
                    "At 4 counters: Use a Miku Miku Beam!!!",
        effects: [
             {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    const playerUnits = ctx.actions.getPlayerUnits(ctx.data.playerId);

                    if (playerUnits.length > 0) {
                        const optionsAmount = playerUnits.length;
                        const randomNumber = getRandomInt(0, optionsAmount - 1);

                        ctx.actions.increaseUnitHealth(playerUnits[randomNumber].unit, 2);

                        const data = ctx.instances.getAdditionalData(ctx.data.source);
                        data["timesHealed"] += 1;
                    }
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    // Note: both happen at turn start, but the effect before should happen earlier, so thats why its ok.
                    const data = ctx.instances.getAdditionalData(ctx.data.source);
                    if (data["timesHealed"] === 4) {
                        const mikuMikuBeam = ctx.instances.createSpellInstance("S_25", ctx.data.playerId);
                        ctx.actions.useSpell(ctx.data.playerId, mikuMikuBeam);
                        data["timesHealed"] = 0;
                    }
                }
            },
        ],
        statuses: {
            haste: false,
            taunt: false,
            paralyzed: false,
            silenced: false,
            dodge: 0
        },
        additionalData: {
            "timesHealed": 0
        },
        cost: 4,
        hp: 4,
        atk: 2,
        cooldown: 0   
    },
];


export const unitsMap = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);