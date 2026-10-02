import { PLAYERS_IN_MATCH } from "../../matchmaking/matchmaking.constants";

export const STARTING_HEALTH = 20;
export const STARTING_MONEY = 0;
export const STARTING_TURN = 0;

export const UNITS_IN_DECK = 8;
export const SPELLS_IN_DECK = 12; // also max drawpile size

export const MAX_CARDS_PER_BOARD_ROW = 4;
export const MAX_CARD_IN_BOARD = 8;

export const MAX_HAND_SIZE = 6;

export const MAX_ARTIFACTS_IN_SHOP = 5;

export const TURN_NUMBER_MONEY_MULT = 2;

export const PLAY_TURNS_PER_PLAYER = 3;
export const SHOP_TURNS_PER_PLAYER = 1;

export const PLAY_TURNS_PER_CYCLE = PLAYERS_IN_MATCH * PLAY_TURNS_PER_PLAYER;
export const SHOP_TURNS_PER_CYCLE = PLAYERS_IN_MATCH * SHOP_TURNS_PER_PLAYER;
export const TURNS_PER_CYCLE = PLAY_TURNS_PER_CYCLE + SHOP_TURNS_PER_CYCLE;

export const MINIMUM_MONEY = 0;