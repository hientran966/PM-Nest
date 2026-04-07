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
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly service: TaskService) {}

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
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Post(':id/progress')
  logProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
    @Body('user_id') userId: number,
  ) {
    return this.service.logProgress(Number(id), progress, userId);
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.service.findByAccountId(Number(userId));
  }

  @Get(':id/role/:userId')
  getRole(@Param('id') taskId: string, @Param('userId') userId: string) {
    return this.service.getRole(Number(taskId), Number(userId));
  }
}
