import { Module } from '@nestjs/common';
import { AssignService } from './assign.service';
import { AssignController } from './assign.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AssignController],
  providers: [AssignService],
})
export class AssignModule {}
