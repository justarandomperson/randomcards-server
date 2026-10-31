import { EFFECT_TRIGGERS, EffectContext, Status } from "../../effects/effects.types";
import { getRandomInt } from "../../games/logic/serviceHelpers";
import { InstanceType, SpellInstance, UnitInstance } from "../shared/instances.types";


const spellList: SpellInstance[] = [
    {
        id: "S_1",
        name: "cat",
        type: InstanceType.SPELL,
        effectDesc: "though I may bear the semblance of canine form, I possess no corporeal body whatsoever. " +
                    "Pray, doth it befit thee to name such a being a cat?" +
                    "Farewell, and may the hours yet before you be wondrous and fair!",
        effects: [],
        cost: 0,
        isToken: false
    },
    {
        id: "S_2",
        name: "Flex",
        type: InstanceType.SPELL,
        effectDesc: "Give an ally monster +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitAttack(ctx.data.targetUnit, 2);
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_3",
        name: "Take 3 hp off of yourself and give it to one of your units",
        type: InstanceType.SPELL,
        effectDesc: "I couldn't think of a better name",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackPlayer(ctx.data.playerId, 3);
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 3);
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_4",
        name: "cooldown hating spell",
        type: InstanceType.SPELL,
        effectDesc: "remove 1 turn from one of your benched unit's cooldown",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitCooldown(ctx.data.targetUnit, -1);
                    }   
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_5",
        name: "Cast",
        type: InstanceType.SPELL,
        effectDesc: "Play the leftmost orb in your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const playerHand = ctx.actions.getPlayerState(ctx.data.playerId).hand;

                    for (const spell of playerHand) {
                        if (["S_8", "S_9", "S_10"].includes(spell.id)) {
                            ctx.actions.useSpell(ctx.data.playerId, spell);
                            break;
                        }
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_6",
        name: "Maragi",
        type: InstanceType.SPELL,
        effectDesc: "Deals 2 damage to all enemies.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                    for (const unit of opponentUnits) {
                        ctx.actions.attackUnit(ctx.data.playerId, unit.unit, 2);
                    }
                }
            }
        ],
        cost: 4,
        isToken: false
    },
    {
        id: "S_7",
        name: "Shiv",
        type: InstanceType.SPELL,
        effectDesc: "Deal 3 Damage to a monster.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 3);
                    }

                    // Note: do silent's effect of giving any of your silents +1 ATK
                    const playerUnits = ctx.actions.getPlayerUnits(ctx.data.playerId);
                    for (const slot of playerUnits) {
                        if (slot.unit.id === 'U_8') {
                            ctx.actions.increaseUnitAttack(slot.unit, 1);
                        }
                    }
                }
            }
        ],
        cost: 0,
        isToken: true
    },
        {
        id: "S_8",
        name: "Lightning Orb",
        type: InstanceType.SPELL,
        effectDesc: "Deal 2 Damage to a random enemy monster.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits;
                    const randomNumber = getRandomInt(1, opponentUnits.length);

                    ctx.actions.attackUnit(ctx.data.playerId, opponentUnits[randomNumber - 1].unit, 2);
                }
            }
        ],
        cost: 1,
        isToken: true
    },
    {
        id: "S_9",
        name: "Frost Orb",
        type: InstanceType.SPELL,
        effectDesc: "Heal yourself by 4 HP or one of your units by 2 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 2);
                    }
                    else if (ctx.data.targetPlayerId) {
                        ctx.actions.increasePlayerHealth(ctx.actions.getPlayerState(ctx.data.targetPlayerId), 4);
                    }
                    
                }
            }
        ],
        cost: 2,
        isToken: true
    },
    {
        id: "S_10",
        name: "Dark Orb",
        type: InstanceType.SPELL,
        effectDesc: "Deals 3 damage times the amount of Dark Orbs you have in your hand " +
                    "to the opponent's unit with the least HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const playerHand = ctx.actions.getPlayerState(ctx.data.playerId).hand;
                    let damage = 0; // spell effect runs before its removed from hand

                    for (const spell of playerHand) {
                        if (spell.id === "S_10") {
                            damage += 3;
                        }
                    }

                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);
                    let unitToAttack: UnitInstance | null = null;
                    for (const unit of opponentUnits) {
                        if (!unitToAttack) {
                            unitToAttack = unit.unit;
                        }
                        else if (unitToAttack.hp > unit.unit.hp) {
                            unitToAttack = unit.unit;
                        }
                    }

                    if (unitToAttack) {
                        ctx.actions.attackUnit(ctx.data.playerId, unitToAttack, damage);
                    }
                }
            }
        ],
        cost: 3,
        isToken: true
    },
    {
        id: "S_11",
        name: "Darkness",
        type: InstanceType.SPELL,
        effectDesc: "Add 2 Dark Orbs to your hand. They cost 1$ more.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    for (let i = 0; i < 2; i++) {
                        const darkOrb = ctx.instances.createSpellInstance("S_10", ctx.data.playerId);
                        ctx.actions.increaseCardCost(darkOrb, 1);
                        ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), darkOrb);
                    }
                }
            }
        ],
        cost: 3,
        isToken: false
    },
        {
        id: "S_12",
        name: "/kill",
        type: InstanceType.SPELL,
        effectDesc: "Kill a unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, ctx.data.targetUnit.hp);
                    }
                }
            }
        ],
        cost: 5,
        isToken: false
    },
    {
        id: "S_13",
        name: "/mute",
        type: InstanceType.SPELL,
        effectDesc: "Silence and paralyze a unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.SILENCED);
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.PARALYZED);
                    }
                }
            }
        ],
        cost: 5,
        isToken: false
    },
    {
        id: "S_14",
        name: "Skeleton Army",
        type: InstanceType.SPELL,
        effectDesc: "Fill your board with skeletons.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const playerBoard = ctx.actions.getPlayerBoard(ctx.data.playerId);

                    for (const slot of playerBoard) {
                        if (!slot.unit) {
                            const skeleton = ctx.instances.createUnitInstance("U_16", ctx.data.playerId);
                            ctx.actions.summonUnit(ctx.data.playerId, skeleton, slot.index);
                        }
                    }
                }
            }
        ],
        cost: 3,
        isToken: false
    },
    {
        id: "S_15",
        name: "Offering",
        type: InstanceType.SPELL,
        effectDesc: "Lose 6 HP, Gain 6$ and draw 2 cards.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.decreasePlayerHealth(ctx.actions.getPlayerState(ctx.data.playerId), 6);
                    ctx.actions.increasePlayerMoney(ctx.actions.getPlayerState(ctx.data.playerId), 6);

                    ctx.actions.drawSpell(ctx.data.playerId);
                    ctx.actions.drawSpell(ctx.data.playerId);
                }
            }
        ],
        cost: 0,
        isToken: false
    },
    {
        id: "S_16",
        name: "i need more bullets",
        type: InstanceType.SPELL,
        effectDesc: "give a unit of yours +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitAttack(ctx.data.targetUnit, 2);
                    }
                }
            }
        ],
        cost: 3,
        isToken: false
    },
    {
        id: "S_17",
        name: "Pot of Greed",
        type: InstanceType.SPELL,
        effectDesc: "Draw 2 cards.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.drawSpell(ctx.data.playerId);
                    ctx.actions.drawSpell(ctx.data.playerId);
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_666",
        name: "Gaster Blaster",
        type: InstanceType.SPELL,
        effectDesc: "i will blast your glast (deal 8 damage to a unit)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: true,
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 8);
                    }
                }
            }
        ],
        cost: 4,
        isToken: false
    },
];

export const spellsMap = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);