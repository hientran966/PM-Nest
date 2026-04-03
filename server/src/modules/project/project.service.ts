import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';

@Injectable()
export class ProjectService {
  constructor(@Inject('MYSQL') private readonly mysql: any) {}

  extractProjectData(payload: any) {
    const project: any = {
      name: payload.name,
      description: payload.description,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status,
      created_by: payload.created_by,
    };

    Object.keys(project).forEach((key) => {
      if (project[key] === undefined) delete project[key];
    });

    return project;
  }

  // ===== CREATE =====
  async create(payload: any) {
    if (!payload) throw new BadRequestException('Không có dữ liệu đầu vào');
    if (!payload.name) throw new BadRequestException('Cần có tên dự án');
    if (!payload.start_date)
      throw new BadRequestException('Cần có ngày bắt đầu');
    if (!payload.end_date)
      throw new BadRequestException('Cần có ngày kết thúc');
    if (!payload.created_by) throw new BadRequestException('Cần có người tạo');

    const project = await this.extractProjectData(payload);
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO projects (name, description, start_date, end_date, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          project.name,
          project.description || null,
          project.start_date,
          project.end_date,
          project.status || 'Đang tiến hành',
          project.created_by,
        ],
      );

      await connection.commit();
      return { id: result.insertId, ...project };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ===== FIND =====
  async find(filter: any = {}) {
    let sql = `SELECT * FROM projects WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (filter.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }

    if (filter.start_date) {
      sql += ' AND start_date >= ?';
      params.push(filter.start_date);
    }

    if (filter.end_date) {
      sql += ' AND end_date <= ?';
      params.push(filter.end_date);
    }

    if (filter.status) {
      sql += ' AND status LIKE ?';
      params.push(`%${filter.status}%`);
    }

    const [rows] = await this.mysql.execute(sql, params);

    return rows.map((row) => {
      const r = { ...row };
      delete r.deleted_at;
      return r;
    });
  }

  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    const project = rows[0];
    if (!project) return null;

    const result = { ...project };
    delete result.deleted_at;
    return result;
  }

  // ===== UPDATE =====
  async update(id: number, payload: any) {
    const project = await this.findById(id);
    if (!project) throw new NotFoundException('Dự án không tồn tại');

    const update = await this.extractProjectData(payload);

    let sql = 'UPDATE projects SET ';
    const fields: any[] = [];
    const params: any[] = [];

    for (const key in update) {
      if (key === 'id') continue;
      fields.push(`${key} = ?`);
      params.push(update[key]);
    }

    sql += fields.join(', ') + ' WHERE id = ?';
    params.push(id);

    await this.mysql.execute(sql, params);

    return this.findById(id);
  }

  // ===== DELETE (SOFT) =====
  async delete(id: number) {
    const project = await this.findById(id);
    if (!project) throw new NotFoundException('Dự án không tồn tại');

    const deletedAt = new Date();

    await this.mysql.execute(
      'UPDATE projects SET deleted_at = ? WHERE id = ?',
      [deletedAt, id],
    );

    return { ...project, deleted_at: deletedAt };
  }

  // ===== RESTORE =====
  async restore(id: number) {
    const project = await this.findById(id);
    if (!project) throw new NotFoundException('Dự án không tồn tại');

    const [result] = await this.mysql.execute(
      'UPDATE projects SET deleted_at = NULL WHERE id = ?',
      [id],
    );

    return result.affectedRows > 0;
  }

  // ===== GET DELETED =====
  async getDeleted(filter: any = {}) {
    let sql = 'SELECT * FROM projects WHERE deleted_at IS NOT NULL';
    const params: any[] = [];

    if (filter.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }

    if (filter.start_date) {
      sql += ' AND start_date >= ?';
      params.push(filter.start_date);
    }

    if (filter.end_date) {
      sql += ' AND end_date <= ?';
      params.push(filter.end_date);
    }

    if (filter.status) {
      sql += ' AND status LIKE ?';
      params.push(`%${filter.status}%`);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }
}
