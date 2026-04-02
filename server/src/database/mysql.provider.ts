import { createPool } from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';

export const MySQLProvider = {
  provide: 'MYSQL',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const pool = createPool({
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      user: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE'),
      waitForConnections: true,
      connectionLimit: 10,
    });

    return pool;
  },
};
