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
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req, @Body() body) {
    return this.service.create({ ...body, created_by: req.user.id });
  }

  @Get()
  findAll(@Query() query) {
    return this.service.find(query || {});
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMyProjects(@Req() req) {
    return this.service.getByUser(req.user.id);
  }

  @Get(':id/report')
  report(@Param('id', ParseIntPipe) id: number) {
    return this.service.report(id);
  }

  @Get(':id/role/:userId')
  getRole(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.getRole(projectId, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.delete(id, req.user.id);
  }
}
