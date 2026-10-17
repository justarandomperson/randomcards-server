import { Effect } from "../effects/effects.types"

// artifacts
export type ArtifactInstance = {
    id: string
    instanceId?: string
    name: string
    ownerId?: string
    effectDesc: string
    effects: Effect[]
    cost: number
    location?: ArtifactLocation
}


// locations
export enum ArtifactZone {
    SHOP = 'shop',
    PLAYER = 'player'
}

export type ArtifactLocation = {
    insideOf: ArtifactZone
    index: number
};


// Note: these are types sent to the client, used only for that
// they contain only what the client should get
export type ClientArtifactData = {
    instanceId?: string
    id: string
    name: string
    effectDesc: string
    cost: number
};