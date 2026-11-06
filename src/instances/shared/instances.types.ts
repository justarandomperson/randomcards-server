import { Effect } from '../../effects/effects.types';


export type ImagesList = [string, string][];


// instances
export enum InstanceType {
  UNIT = 'unit',
  SPELL = 'spell',
  ARTIFACT = 'artifact'
}

export type UnitInstance = {
  instanceId?: string
  id: string
  name: string
  ownerId?: string
  type: InstanceType.UNIT
  effectDesc: string
  effects: Effect[]
  statuses: {
    haste: boolean
    taunt: boolean
    paralyzed: boolean
    silenced: boolean
    dodge: number
  }
  cost: number
  atk: number
  hp: number
  cooldown: number
  canAttack?: boolean,
  summoned?: boolean
  location?: InstanceLocation
  assignedBenchSlot?: number,
  additionalData?: Record<string, any>;
};

export type SpellInstance = {
  instanceId?: string
  id: string
  name: string
  ownerId?: string
  type: InstanceType.SPELL
  effectDesc: string
  effects: Effect[]
  cost: number
  isToken: boolean
  inDeck?: boolean
  location?: InstanceLocation
  additionalData?: Record<string, any>;
};

export type ArtifactInstance = {
  instanceId?: string
  id: string
  name: string
  ownerId?: string
  type: InstanceType.ARTIFACT
  effectDesc: string
  effects: Effect[]
  cost: number
  location?: InstanceLocation
  additionalData?: Record<string, any>;
}

export type AnyInstance = UnitInstance| SpellInstance | ArtifactInstance
export type CardInstance = UnitInstance | SpellInstance


// locations
export enum InstanceZone {
  HAND = 'hand',
  BENCH = 'bench',
  BOARD = 'board',
  SHOP = 'shop',
  PLAYER = 'player',
  NONE = 'none' // counts drawpile too
}

export type InstanceLocation = 
  | { insideOf: InstanceZone.BENCH | InstanceZone.BOARD | InstanceZone.HAND | InstanceZone.PLAYER | InstanceZone.SHOP, index: number }
  | { insideOf: InstanceZone.NONE }


// Note: these are types sent to the client, used only for that
// they contain only what the client should get
export type ClientSpellData = {
  instanceId?: string
  id: string
  name: string
  type: InstanceType.SPELL
  effectDesc: string
  cost: number
}

export type ClientUnitData = {
  instanceId?: string
  id: string
  name: string
  type: InstanceType.UNIT
  effectDesc: string
  statuses: {
    haste: boolean
    taunt: boolean
    paralyzed: boolean
    silenced: boolean
    dodge: number
  }
  cost: number
  hp: number
  atk: number,
  canAttack: boolean
}

export type ClientArtifactData = {
  instanceId?: string
  id: string
  name: string
  effectDesc: string
  cost: number
};