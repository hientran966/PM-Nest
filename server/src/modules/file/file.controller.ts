import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  findAll() {
    return this.fileService.findAll({});
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.fileService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(@Req() req, @UploadedFile() file, @Body() body) {
    console.log(file);
    const payload = {
      file_name: file?.originalname || body.file_name,
      file,
      project_id: body.project_id,
      task_id: body.task_id,
      created_by: req.user.id,
    };

    const result = await this.fileService.create(payload);

    return {
      message: 'Tạo file thành công',
      result,
    };
  }

  @Post(':id/version')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addVersion(@Param('id') id: number, @Req() req, @UploadedFile() file) {
    const payload = {
      file_name: file.originalname,
      file,
      updated_by: req.user.id,
    };

    const result = await this.fileService.addVersion(id, payload);

    return {
      message: 'Thêm version thành công',
      result,
    };
  }
}
