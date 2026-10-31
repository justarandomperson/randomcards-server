import { Module } from '@nestjs/common';
import { DecksService } from './providers/deck.service';
import { DecksController } from './providers/decks.controller';
import { InstancesService } from '../instances/providers/instances.service';


@Module({
  controllers: [DecksController],
  providers: [DecksService, InstancesService],
})
export class DecksModule {}