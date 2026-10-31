import { Module } from '@nestjs/common';
import { InstancesService } from '../instances/providers/instances.service';
import { InstancesController } from './providers/instances.controller';


@Module({
  controllers: [InstancesController],
  providers: [InstancesService],
})
export class InstancesModule {}