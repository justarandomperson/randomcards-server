// artifacts
export type ArtifactInstance = {
    id: string
    instanceId: string
    name: string
    ownerId?: string
    effectDesc: string
    effects: []
    cost: number
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

export type ArtifactAndLocation = {
    artifact: ArtifactInstance
    location: ArtifactLocation
}


// Note: these are types sent to the client, used only for that
// they contain only what the client should get
export type ClientArtifactData = {
    instanceId: string
    id: string
    name: string
    effectDesc: string
    cost: number
};