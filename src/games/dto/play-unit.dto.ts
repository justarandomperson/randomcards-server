import { IsInt, IsString, Max, Min } from "class-validator";


export default class PlayUnitDto {
    @IsString()
    instanceId: string;

    @IsInt()
    @Min(0)
    @Max(7)
    boardIndex: number;
}