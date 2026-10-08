import { Effect, Status } from '../effects/effects.types';


// cards
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
  statuses: Status[]
  cost: number
  atk: number
  hp: number
  cooldown?: number
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

export type CardInstance = UnitInstance | SpellInstance;


// locations
export enum CardZone {
  HAND = 'hand',
  BENCH = 'bench',
  BOARD = 'board',
  NONE = 'none'
}

export type CardLocation = 
  | { insideOf: CardZone.BENCH | CardZone.BOARD | CardZone.HAND, index: number }
  | { insideOf: CardZone.NONE }


export type UnitAndLocation = {
  unit: UnitInstance
  location: CardLocation
}

export type SpellAndLocation = {
  spell: SpellInstance
  location: CardLocation
}


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
  statuses: Status[]
  cost: number
  hp: number
  atk: number
}