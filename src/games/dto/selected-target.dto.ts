import { IsBoolean, IsString } from "class-validator";


export default class SelectedTargetDto {
    @IsString()
    id: string;

    @IsBoolean()
    isPlayer: boolean;
}