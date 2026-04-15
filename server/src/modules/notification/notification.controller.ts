import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.service.find(query || {});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(Number(id));
  }

  @Patch('recipient/:recipient_id')
  markAllAsRead(@Param('recipient_id') recipientId: string) {
    return this.service.markAllAsRead(Number(recipientId));
  }

  @Patch('recipient/:recipient_id/unread')
  markAllAsUnread(@Param('recipient_id') recipientId: string) {
    return this.service.markAllAsUnread(Number(recipientId));
  }

  @Get('recipient/:recipient_id')
  getNewCount(@Param('recipient_id') recipientId: string) {
    return this.service.getNewCount(Number(recipientId));
  }

  @Put('deactive/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(Number(id));
  }
}
