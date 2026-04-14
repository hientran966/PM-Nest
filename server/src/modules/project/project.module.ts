import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { DatabaseModule } from '../../database/database.module';
import { MemberModule } from '../member/member.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, MemberModule, NotificationModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
