import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query() query) {
    return this.service.find(query || {});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Body('actor_id') actorId: number) {
    return this.service.delete(Number(id), actorId);
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.service.getByUser(Number(userId));
  }

  @Get(':id/report')
  report(@Param('id') id: string) {
    return this.service.report(Number(id));
  }

  @Get(':id/role/:userId')
  getRole(@Param('id') projectId: string, @Param('userId') userId: string) {
    return this.service.getRole(Number(projectId), Number(userId));
  }
}
