import { IsString } from "class-validator";


export default class AttackUnitDto {
    @IsString()
    instanceId: string;

    @IsString()
    targetId: string;
}