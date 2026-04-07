import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { MemberService } from './member.service';

@Controller('members')
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.service.getByProjectId(Number(projectId));
  }

  @Get('invites/:userId')
  getInviteList(@Param('userId') userId: string) {
    return this.service.getInviteList(Number(userId));
  }

  @Put(':id/accept')
  acceptInvite(@Param('id') id: string, @Body('user_id') userId: number) {
    return this.service.acceptInvite(Number(id), userId);
  }

  @Put(':id/decline')
  declineInvite(@Param('id') id: string, @Body('user_id') userId: number) {
    return this.service.declineInvite(Number(id), userId);
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
}
