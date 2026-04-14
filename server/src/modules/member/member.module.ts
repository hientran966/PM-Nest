import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { DatabaseModule } from '../../database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
