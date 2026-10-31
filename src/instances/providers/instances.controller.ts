import { Controller, Get } from "@nestjs/common";

import { InstancesService } from "./instances.service";


@Controller('instances')
export class InstancesController {
    constructor (private readonly instancesService: InstancesService) {}

    @Get('images')
    images() {
        const imagesList = this.instancesService.getImages();
        return imagesList;
    }
}