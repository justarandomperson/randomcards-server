import { Effect } from '../effects/effect.types';


export enum CardZone {
  HAND = 'hand',
  BENCH = 'bench',
  BOARD = 'board'
}

export type CardLocation = {
  insideOf: CardZone
  index: number
};


export enum CardType {
  UNIT = 'unit',
  SPELL = 'spell'
}

export type UnitInstance = {
  instanceId?: string
  id: string
  name: string
  ownerId?: string
  type: CardType.UNIT
  effectDesc: string
  effects: Effect[]
  cost: number
  atk: number
  hp: number
};

export type SpellInstance = {
  instanceId?: string
  id: string
  name: string
  ownerId?: string
  type: CardType.SPELL
  effectDesc: string
  effects: Effect[]
  cost: number
};


// Note: these are types sent to the client, used only for that
// they contain only what the client should get

export type ClientSpellData = {
  instanceId?: string
  id: string
  name: string
  type: CardType.SPELL
  effectDesc: string
  cost: number
}

export type ClientUnitData = {
  instanceId?: string
  id: string
  name: string
  type: CardType.UNIT
  effectDesc: string
  cost: number
  hp: number
  atk: number
}