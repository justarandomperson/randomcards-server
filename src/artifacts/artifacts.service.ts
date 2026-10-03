import { ArtifactInstance } from "./artifacts.types";


export class ArtifactsService {


    // services
    findArtifactInstance (instanceId: string, artifactList: (ArtifactInstance | null)[]): 
    { artifactInstance: ArtifactInstance; index: number } | null {
        const index = artifactList.findIndex(
            (artifact) => artifact?.instanceId === instanceId
        );

        if (index === -1) {
            return null;
        }

        return { 
            artifactInstance: artifactList[index]!, 
            index 
        };
    }
}