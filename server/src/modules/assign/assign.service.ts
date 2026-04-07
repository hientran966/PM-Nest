import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AssignService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly notificationService: NotificationService,
  ) {}

  extractAssignData(payload: any) {
    return {
      task_id: payload.task_id ?? null,
      user_id: payload.user_id ?? null,
    };
  }

  // ===== CREATE =====
  async create(payload: any, connection: any = null) {
    if (!payload?.task_id) throw new BadRequestException('Cần có ID công việc');
    if (!payload?.user_id)
      throw new BadRequestException('Cần có ID người dùng');

    const assign = this.extractAssignData(payload);

    const shouldRelease = !connection;
    const conn = connection || (await this.mysql.getConnection());

    try {
      if (!connection) await conn.beginTransaction();

      const [existing] = await conn.execute(
        `SELECT id FROM assigns
         WHERE task_id = ? AND user_id = ? AND deleted_at IS NULL`,
        [assign.task_id, assign.user_id],
      );

      if (existing.length > 0) {
        if (!connection) await conn.commit();
        return { id: existing[0].id, ...assign, skipped: true };
      }

      const [result] = await conn.execute(
        `INSERT INTO assigns (task_id, user_id)
         VALUES (?, ?)`,
        [assign.task_id, assign.user_id],
      );

      const newAssign = { id: result.insertId, ...assign };

      if (payload.actor_id && payload.actor_id !== assign.user_id) {
        await this.notificationService.create(
          {
            actor_id: payload.actor_id,
            recipient_id: assign.user_id,
            type: 'task_assigned',
            reference_type: 'task',
            reference_id: assign.task_id,
            project_id: payload.project_id,
          },
          conn,
        );
      }

      if (!connection) await conn.commit();
      return newAssign;
    } catch (error) {
      if (!connection) await conn.rollback();
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  }

  // ===== FIND =====
  async find(filter: any = {}) {
    let sql = `SELECT * FROM assigns WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (filter.task_id) {
      sql += ' AND task_id = ?';
      params.push(filter.task_id);
    }

    if (filter.user_id) {
      sql += ' AND user_id = ?';
      params.push(filter.user_id);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM assigns WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    return rows[0] || null;
  }

  // ===== UPDATE =====
  async update(id: number, payload: any) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Phân công không tồn tại');

    const update = this.extractAssignData(payload);

    const fields: string[] = [];
    const params: any[] = [];

    for (const key in update) {
      if (update[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(update[key]);
      }
    }

    if (fields.length === 0) return existing;

    const sql = `UPDATE assigns SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.mysql.execute(sql, params);

    return this.findById(id);
  }

  // ===== DELETE =====
  async delete(id: number) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Phân công không tồn tại');

    const deletedAt = new Date();

    await this.mysql.execute(`UPDATE assigns SET deleted_at = ? WHERE id = ?`, [
      deletedAt,
      id,
    ]);

    return { ...existing, deleted_at: deletedAt };
  }

  // ===== RESTORE =====
  async restore(id: number) {
    const [result] = await this.mysql.execute(
      `UPDATE assigns SET deleted_at = NULL WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  }

  // ===== GET DELETED =====
  async getDeleted(filter: any = {}) {
    let sql = `SELECT * FROM assigns WHERE deleted_at IS NOT NULL`;
    const params: any[] = [];

    if (filter.task_id) {
      sql += ' AND task_id = ?';
      params.push(filter.task_id);
    }

    if (filter.user_id) {
      sql += ' AND user_id = ?';
      params.push(filter.user_id);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }
}
