import { EFFECT_TRIGGERS, EffectContext, Status } from "../../effects/effects.types";
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
    },
    {
        id: "S_2",
        name: "Flex",
        type: InstanceType.SPELL,
        effectDesc: "Give an ally monster +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitAttack(ctx.data.targetUnit, 2);
                    }
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_3",
        name: "Take 3 hp off of yourself and give it to one of your units",
        type: InstanceType.SPELL,
        effectDesc: "I couldn't think of a better name",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackPlayer(ctx.data.playerId, 3);
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 3);
                    }
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_4",
        name: "cooldown hating spell",
        type: InstanceType.SPELL,
        effectDesc: "remove 1 turn from one of your benched unit's cooldown",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitCooldown(ctx.data.targetUnit, -1);
                    }   
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_666",
        name: "Gaster Blaster",
        type: InstanceType.SPELL,
        effectDesc: "i will blast your glast (deal 8 damage to a unit)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 8);
                    }
                }
            }
        ],
        cost: 4,
    },
    {
        id: "S_6",
        name: "Flex",
        type: InstanceType.SPELL,
        effectDesc: "Give an ally monster +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitAttack(ctx.data.targetUnit, 2);
                    }
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_7",
        name: "Shiv",
        type: InstanceType.SPELL,
        effectDesc: "Deal 3 Damage to a monster.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 3);
                    }

                    // Note: do silent's effect of giving any of your silents +1 ATK
                    const playersBoard = ctx.actions.getPlayerBoard(ctx.data.playerId);
                    for (const slot of playersBoard) {
                        if (slot.unit && slot.unit.id === 'U_8') {
                            ctx.actions.increaseUnitAttack(slot.unit, 1);
                        }
                    }
                }
            }
        ],
        cost: 0,
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
                    // TODO: this
                }
            }
        ],
        cost: 1,
    },
    {
        id: "S_9",
        name: "Frost Orb",
        type: InstanceType.SPELL,
        effectDesc: "Heal yourself by 4 HP or one of your units by 2 HP.", //! we cant actually get a player with our current code
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 2);
                    }
                    
                    // TODO: heal player
                }
            }
        ],
        cost: 1,
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
                    const playerHand = ctx.actions.getOpponentState(ctx.data.playerId).hand;
                    let damage = 0; // spell effect runs before its removed from hand
                    for (const spell of playerHand) {
                        if (spell.id === "S_10") {
                            damage += 3;
                        }
                    }

                    const opponentBoard = ctx.actions.getPlayerBoard(ctx.data.playerId);
                    let unitToAttack: UnitInstance | null = null;
                    for (const slot of opponentBoard) {
                        if (!slot.unit) {
                            continue;
                        }

                        if (!unitToAttack) {
                            unitToAttack = slot.unit;
                        }
                        else if (unitToAttack.hp > slot.unit.hp) {
                            unitToAttack = slot.unit;
                        }
                    }

                    if (unitToAttack) {
                        ctx.actions.attackUnit(ctx.data.playerId, unitToAttack, damage);
                    }
                }
            }
        ],
        cost: 2,
    },
    {
        id: "S_11",
        name: "Darkness",
        type: InstanceType.SPELL,
        effectDesc: "Add 2 Dark Orbs to your hand. They cost 2$ more.",
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
    },
        {
        id: "S_12",
        name: "/kill",
        type: InstanceType.SPELL,
        effectDesc: "Kill a unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, ctx.data.targetUnit.hp);
                    }
                }
            }
        ],
        cost: 5,
    },
    {
        id: "S_13",
        name: "/mute",
        type: InstanceType.SPELL,
        effectDesc: "Silence and paralyze a unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.SILENCED);
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.PARALYZED);
                    }
                }
            }
        ],
        cost: 5,
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
                    const skeleton = ctx.instances.createUnitInstance("U_16", ctx.data.playerId);
                    const playerBoard = ctx.actions.getPlayerBoard(ctx.data.playerId);

                    for (const slot of playerBoard) {
                        if (!slot.unit) {
                            ctx.actions.summonUnit(ctx.data.playerId, skeleton, slot.index);
                        }
                    }
                }
            }
        ],
        cost: 4,
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
    },
    {
        id: "S_16",
        name: "i need more bullets",
        type: InstanceType.SPELL,
        effectDesc: "give a unit of yours +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitAttack(ctx.data.targetUnit, 2);
                    }
                }
            }
        ],
        cost: 3,
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
    },
];

export const spellsMap = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);