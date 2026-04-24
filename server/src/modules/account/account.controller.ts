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
import { AccountService } from './account.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('accounts')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query() query) {
    return this.service.find(query || {});
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req) {
    return this.service.findById(req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Post('login')
  login(@Body() body) {
    return this.service.login(body.email, body.password);
  }

  @Get('deactive')
  getDeactive(@Query() query) {
    return this.service.getDeleted(query || {});
  }

  @Put('deactive/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(Number(id));
  }

  @Put('me/password')
  @UseGuards(AuthGuard)
  changePassword(@Req() req, @Body() body) {
    return this.service.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Get('me/stats')
  @UseGuards(AuthGuard)
  getStats(@Req() req, @Query('projectId') projectId?: string) {
    return this.service.getStats(
      req.user.id,
      projectId ? Number(projectId) : null,
    );
  }
}
