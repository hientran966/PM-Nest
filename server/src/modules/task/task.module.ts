import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { DatabaseModule } from '../../database/database.module';
import { AssignModule } from '../assign/assign.module';
import { MemberModule } from '../member/member.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DatabaseModule, MemberModule, AssignModule, ActivityModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
