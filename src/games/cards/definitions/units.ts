import { UnitInstance } from '../card.types';


export const unitCards: UnitInstance[] = [
    {
        name: "Skeleton",
        atk: 1,
        hp: 1,
        cost: 1,
        effects: [],
        id: "1"
    },

    {
        name: "BUFF",
        atk: 8,
        hp: 7,
        cost: 7,
        effects: [],
        id: "2"
    },

    {
        name: "Blueprint",
        atk: 3,
        hp: 3,
        cost: 10,
        effects: [],
        id: "3"
    },

    {
        name: "Imitater",
        atk: 3,
        hp: 3,
        cost: 8,
        effects: [],
        id: "4"
    },
        
    {
        name: "Sneaky Mouse",
        atk: 2,
        hp: 3,
        cost: 3,
        effects: [],
        id: "5"
    },

    {
        name: "Stealthy Mouse",
        atk: 2,
        hp: 2,
        cost: 3,
        effects: [],
        id: "6"
    },

    {
        name: "Rotating Horse",
        atk: 1,
        hp: 1,
        cost: 2,
        effects: [],
        id: "7"
    },

    {
        name: "Fat Guy",
        atk: 6,
        hp: 6,
        cost: 5,
        effects: [],
        id: "7"
    },

    {
        name: "Last Resort Man (or Woman)",
        atk: 1,
        hp: 3,
        cost: 3,
        effects: [],
        id: "8"
    },

    {
        name: "Claustrophobic",
        atk: 1,
        hp: 6,
        cost: 6,
        effects: [],
        id: "9"
    },

    {
        name: "Desperado",
        atk: 2,
        hp: 2,
        cost: 5,
        effects: [],
        id: "10"
    },

        {
        name: "sans the skeleton",
        atk: 1,
        hp: 1,
        cost: 6,
        effects: [
            {
                trigger: ["onSummon", "onTurnStart"],
                execute: (ctx) => {
                    ctx.actions.addCardToPlayerHand(ctx.game, "666", ctx.playerId)
                }
            }
        ],
        id: "11"
    },
];
