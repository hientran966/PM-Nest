import {
  Controller,
  Get,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMyNotifications(@Req() req, @Query() query: any) {
    return this.service.find({
      ...query,
      recipient_id: req.user.id,
    });
  }

  @Get('me/count')
  @UseGuards(AuthGuard)
  getMyCount(@Req() req) {
    return this.service.getNewCount(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(Number(id));
  }

  @Patch('me/read')
  @UseGuards(AuthGuard)
  markAllAsRead(@Req() req) {
    return this.service.markAllAsRead(req.user.id);
  }

  @Patch('me/unread')
  @UseGuards(AuthGuard)
  markAllAsUnread(@Req() req) {
    return this.service.markAllAsUnread(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Put('deactive/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(Number(id));
  }
}
