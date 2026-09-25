import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { SPELLS_IN_DECK, UNITS_IN_DECK } from '../shared/games.constants';


export default class QueueDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(UNITS_IN_DECK)
    @ArrayMaxSize(UNITS_IN_DECK)
    unitIds: string[]

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(SPELLS_IN_DECK)
    @ArrayMaxSize(SPELLS_IN_DECK)
    spellIds: string[]
}