import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  constructor(@Inject('MYSQL') private readonly mysql: any) {}

  private saveFile(payload: any): string {
    const uploadDir = path.join(__dirname, '../../../uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(payload.file_name);
    const baseName = path.basename(payload.file_name, ext);
    const fileName = `${baseName}_${Date.now()}${ext}`;

    const destPath = path.join(uploadDir, fileName);

    if (payload.file?.buffer) {
      fs.writeFileSync(destPath, payload.file.buffer);
    } else if (payload.file?.path) {
      fs.copyFileSync(payload.file.path, destPath);
    } else {
      throw new Error('Không tìm thấy file');
    }

    return `uploads/${fileName}`;
  }

  async create(payload: any) {
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      let file_url: string | null = null;

      if (payload.file) {
        file_url = this.saveFile(payload);
      }

      const [fileResult] = await connection.execute(
        `INSERT INTO files (file_name, project_id, task_id, created_by)
         VALUES (?, ?, ?, ?)`,
        [
          payload.file_name,
          payload.project_id ?? null,
          payload.task_id ?? null,
          payload.created_by ?? null,
        ],
      );

      const fileId = fileResult.insertId;

      const fileType = path.extname(payload.file_name).replace('.', '');

      const [verResult] = await connection.execute(
        `INSERT INTO file_versions (file_id, version_number, file_url, file_type)
         VALUES (?, 1, ?, ?)`,
        [fileId, file_url, fileType],
      );

      await connection.commit();

      return {
        id: fileId,
        file_name: payload.file_name,
        versions: [
          {
            id: verResult.insertId,
            file_url,
            file_type: fileType,
          },
        ],
      };
    } catch (err) {
      await connection.rollback();
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      connection.release();
    }
  }

  async addVersion(fileId: number, payload: any) {
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const [fileRows] = await connection.execute(
        'SELECT * FROM files WHERE id = ? AND deleted_at IS NULL',
        [fileId],
      );

      if (!fileRows.length) {
        throw new NotFoundException('File không tồn tại');
      }

      const file_url = this.saveFile(payload);

      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM file_versions WHERE file_id = ?',
        [fileId],
      );

      const version = countRows[0].count + 1;

      const [verResult] = await connection.execute(
        `INSERT INTO file_versions (file_id, version_number, file_url)
         VALUES (?, ?, ?)`,
        [fileId, version, file_url],
      );

      await connection.commit();

      return {
        id: verResult.insertId,
        version,
        file_url,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAll(filter: any) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM files WHERE deleted_at IS NULL`,
    );
    return rows;
  }

  async findOne(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM files WHERE id = ?`,
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException('File không tồn tại');
    }

    return rows[0];
  }
}
