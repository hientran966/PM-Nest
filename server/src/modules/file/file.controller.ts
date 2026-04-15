import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file, @Body() body) {
    console.log(file);
    const payload = {
      file_name: file?.originalname || body.file_name,
      file,
      project_id: body.project_id,
      task_id: body.task_id,
      created_by: body.created_by,
    };

    const result = await this.fileService.create(payload);

    return {
      message: 'Tạo file thành công',
      result,
    };
  }

  @Post(':id/version')
  @UseInterceptors(FileInterceptor('file'))
  async addVersion(@Param('id') id: number, @UploadedFile() file) {
    const payload = {
      file_name: file.originalname,
      file,
    };

    const result = await this.fileService.addVersion(id, payload);

    return {
      message: 'Thêm version thành công',
      result,
    };
  }
}
