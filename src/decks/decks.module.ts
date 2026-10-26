import { Module } from '@nestjs/common';
import { DecksService } from './deck.service';
import { DecksController } from './decks.controller';
import { InstancesService } from '../instances/instances.service';


@Module({
  controllers: [DecksController],
  providers: [DecksService, InstancesService],
})
export class DecksModule {}