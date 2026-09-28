import { CardType, UnitInstance } from '../cards.types';


const unitList: UnitInstance[] = [
    {
        id: "U_1",
        name: "dog",
        type: CardType.UNIT,
        effectDesc: "im dog",
        effects: [],
        cost: 3,
        hp: 1,
        atk: 2,
    },
    {
        id: "U_11",
        name: "sans the skeleton",
        type: CardType.UNIT,
        effectDesc: "sans attacks",
        effects: [/*
            {
                trigger: ["onSummon", "onTurnStart"],
                execute: (ctx) => {
                    ctx.actions.addCardToPlayerHand(ctx.game, "666", ctx.playerId)
                }
            }
        */],
        cost: 6,
        hp: 1,
        atk: 1
    }
];

export const unitCards = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);