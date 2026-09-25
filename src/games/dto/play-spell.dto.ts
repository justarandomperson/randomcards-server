import { IsString } from "class-validator";


export default class PlaySpellDto {
    @IsString()
    instanceId: string;
}