import { ArtifactInstance } from "./artifacts.types";


const ArtifactList: ArtifactInstance[] = [
    {
        id: "A_1",
        name: "lucas ball",
        effectDesc: "1/2 chance it deals an unspecified amount of damage to an opponents unit.",
        effects: [],
        cost: 3,
    }
];

export const Artifacts = new Map<string, ArtifactInstance>(
    ArtifactList.map((spell) => [spell.id, spell])
);