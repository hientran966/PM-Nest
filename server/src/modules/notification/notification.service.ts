import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  // eslint-disable-next-line @typescript-eslint/require-await
  async create(payload: any, connection: any = null) {
    console.log(payload, connection);
  }
}
