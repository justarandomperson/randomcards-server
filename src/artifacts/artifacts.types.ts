export type ArtifactInstance = {
    instanceId: string
    id: string
    name: string
    ownerId?: string
    effectDesc: string
    effects: []
    cost: number
}


// Note: these are types sent to the client, used only for that
// they contain only what the client should get

export type ClientArtifactData = {
    instanceId: string
    name: string
    effectDesc: string
    cost: number
};