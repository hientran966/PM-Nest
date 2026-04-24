import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('tasks')
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req, @Body() body) {
    return this.service.create({ ...body, created_by: req.user.id });
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
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Req() req, @Body() body) {
    return this.service.update(Number(id), { ...body, updated_by: req.user.id });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Post(':id/progress')
  @UseGuards(AuthGuard)
  logProgress(
    @Param('id') id: string,
    @Req() req,
    @Body('progress') progress: number,
  ) {
    return this.service.logProgress(Number(id), progress, req.user.id);
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
