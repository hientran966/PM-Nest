import { Injectable, Inject, NotFoundException } from '@nestjs/common';

@Injectable()
export class ActivityService {
  constructor(@Inject('MYSQL') private readonly mysql: any) {}

  extractActivityData(payload: any) {
    const activity: any = {
      project_id: payload.project_id ?? null,
      task_id: payload.task_id ?? null,
      actor_id: payload.actor_id ?? null,
      detail: payload.detail ?? null,
      created_at: payload.created_at ?? new Date(),
    };

    Object.keys(activity).forEach((key) => {
      if (activity[key] === undefined) delete activity[key];
    });

    return activity;
  }

  // ===== CREATE =====
  async create(payload: any, connection: any = null) {
    const activity = this.extractActivityData(payload);
    const conn = connection || (await this.mysql.getConnection());
    let ownTransaction = false;

    try {
      if (!connection) {
        await conn.beginTransaction();
        ownTransaction = true;
      }

      const [result] = await conn.execute(
        `
        INSERT INTO activity_logs (task_id, actor_id, detail, created_at)
        VALUES (?, ?, ?, ?)
        `,
        [
          activity.task_id,
          activity.actor_id,
          activity.detail,
          activity.created_at,
        ],
      );

      const newActivity = { id: result.insertId, ...activity };

      if (ownTransaction) await conn.commit();

      return newActivity;
    } catch (error) {
      if (ownTransaction) await conn.rollback();
      throw error;
    } finally {
      if (!connection) conn.release();
    }
  }

  // ===== FIND =====
  async find(filter: any = {}) {
    let sql = `
      SELECT 
        a.*, 
        JSON_OBJECT('id', u.id, 'name', u.name) AS user
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (filter.task_id) {
      sql += ' AND a.task_id = ?';
      params.push(filter.task_id);
    }

    if (filter.detail) {
      sql += ' AND a.detail LIKE ?';
      params.push(`%${filter.detail}%`);
    }

    sql += ' ORDER BY a.created_at DESC';

    const [rows] = await this.mysql.execute(sql, params);

    // parse JSON user
    return rows.map((row: any) => {
      if (typeof row.user === 'string') {
        try {
          row.user = JSON.parse(row.user);
        } catch {
          row.user = null;
        }
      }
      return row;
    });
  }

  // ===== FIND BY ID =====
  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT a.*,
        JSON_OBJECT('id', u.id, 'name', u.name) AS user
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.id = ? AND a.deleted_at IS NULL
      `,
      [id],
    );

    const row = rows[0];
    if (!row) return null;

    if (typeof row.user === 'string') {
      try {
        row.user = JSON.parse(row.user);
      } catch {
        row.user = null;
      }
    }

    return row;
  }

  // ===== UPDATE =====
  async update(id: number, payload: any) {
    const exists = await this.findById(id);
    if (!exists) throw new NotFoundException('Activity không tồn tại');

    const allowedFields = ['detail', 'created_at'];
    const fields: string[] = [];
    const params: any[] = [];

    for (const key of allowedFields) {
      if (payload[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(payload[key]);
      }
    }

    if (!fields.length) return exists;

    const sql = `UPDATE activity_logs SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.mysql.execute(sql, params);
    return this.findById(id);
  }

  // ===== DELETE =====
  async delete(id: number) {
    const act = await this.findById(id);
    if (!act) throw new NotFoundException('Activity không tồn tại');

    const deletedAt = new Date();

    await this.mysql.execute(
      `UPDATE activity_logs SET deleted_at = ? WHERE id = ?`,
      [deletedAt, id],
    );

    return { ...act, deleted_at: deletedAt };
  }

  // ===== RESTORE =====
  async restore(id: number) {
    const [result] = await this.mysql.execute(
      `UPDATE activity_logs SET deleted_at = NULL WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  }

  // ===== DELETE ALL BY TASK =====
  async deleteAll(taskId: number) {
    const deletedAt = new Date();

    await this.mysql.execute(
      `UPDATE activity_logs SET deleted_at = ? WHERE task_id = ?`,
      [deletedAt, taskId],
    );

    return true;
  }
}
