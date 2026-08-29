import { Effect } from "./effect.types";

export type Card = {
    name: string;
    isUnit: boolean;
    atk: number;
    hp: number;
    cost: number;

    effects: Effect[];
};