import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { AuthGuard } from '../../common/guards/auth.guard';

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

  @Get('invites')
  @UseGuards(AuthGuard)
  getMyInvites(@Req() req) {
    return this.service.getInviteList(req.user.id);
  }

  @Put(':id/accept')
  @UseGuards(AuthGuard)
  acceptInvite(@Param('id') id: string, @Req() req) {
    return this.service.acceptInvite(Number(id), req.user.id);
  }

  @Put(':id/decline')
  @UseGuards(AuthGuard)
  declineInvite(@Param('id') id: string, @Req() req) {
    return this.service.declineInvite(Number(id), req.user.id);
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
