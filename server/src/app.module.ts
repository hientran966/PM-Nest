import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AccountModule } from './modules/account/account.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { AssignModule } from './modules/assign/assign.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AccountModule,
    ProjectModule,
    TaskModule,
    AssignModule,
  ],
})
export class AppModule {}
