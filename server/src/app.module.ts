import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AccountModule } from './modules/account/account.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { AssignModule } from './modules/assign/assign.module';
import { ActivityModule } from './modules/activity/activity.module';
import { MemberModule } from './modules/member/member.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MemberModule,
    NotificationModule,
    AccountModule,
    ProjectModule,
    TaskModule,
    AssignModule,
    ActivityModule,
  ],
})
export class AppModule {}
