import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activities')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.service.find(query || {});
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findById(Number(id));
    if (!result) {
      throw new NotFoundException('Log hoạt động không tồn tại');
    }
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Put('restore/:id')
  async restore(@Param('id') id: string) {
    return this.service.restore(Number(id));
  }

  @Get('task/:taskId')
  async getByTaskId(@Param('taskId') taskId: string) {
    return this.service.find({ task_id: Number(taskId) });
  }
}
