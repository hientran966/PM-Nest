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
import { AccountService } from './account.service';

@Controller('account')
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

  @Put(':id/password')
  changePassword(@Param('id') id: string, @Body() body) {
    return this.service.changePassword(
      Number(id),
      body.oldPassword,
      body.newPassword,
    );
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.service.find({ email });
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @Query('projectId') projectId?: string) {
    return this.service.getStats(
      Number(id),
      projectId ? Number(projectId) : null,
    );
  }
}
