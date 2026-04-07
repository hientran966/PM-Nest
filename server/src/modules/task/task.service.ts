import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { AssignService } from '../assign/assign.service';
import { MemberService } from '../member/member.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class TaskService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly assignService: AssignService,
    private readonly memberService: MemberService,
    private readonly activityService: ActivityService,
  ) {}

  extractTaskData(payload: any) {
    return {
      project_id: payload.project_id,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? 'todo',
      priority: payload.priority ?? 'medium',
      start_date: payload.start_date ?? null,
      due_date: payload.due_date ?? null,
      created_by: payload.created_by ?? null,
    };
  }

  formatField(keys: any) {
    const map = {
      title: 'tiêu đề',
      description: 'mô tả',
      status: 'trạng thái',
      priority: 'ưu tiên',
      start_date: 'ngày bắt đầu',
      due_date: 'hạn chót',
    };

    if (Array.isArray(keys)) return keys.map((k) => map[k] || k).join(', ');
    return map[keys] || keys;
  }

  // ===== CREATE =====
  async create(payload: any) {
    if (!payload?.project_id || !payload?.title)
      throw new BadRequestException('Thiếu dữ liệu');

    const task = this.extractTaskData(payload);
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO tasks (title, description, start_date, due_date, created_by, project_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          task.title,
          task.description,
          task.start_date,
          task.due_date,
          task.created_by,
          task.project_id,
          task.status,
        ],
      );

      const taskId = result.insertId;
      const newTask = { id: taskId, ...task };

      if (Array.isArray(payload.members)) {
        for (const userId of payload.members) {
          await this.assignService.create(
            {
              task_id: taskId,
              user_id: userId,
              actor_id: payload.created_by,
              project_id: task.project_id,
            },
            conn,
          );
        }
      }

      await conn.commit();

      return newTask;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ===== FIND =====
  async find(filter: any = {}) {
    let sql = `
      SELECT 
        t.*,
        COALESCE((
          SELECT pl.progress
          FROM progress_logs pl
          WHERE pl.task_id = t.id
          ORDER BY pl.created_at DESC
          LIMIT 1
        ), 0) AS latest_progress,
        (
          SELECT JSON_ARRAYAGG(ta.user_id)
          FROM task_assignees ta
          WHERE ta.task_id = t.id AND ta.deleted_at IS NULL
        ) AS assignees
      FROM tasks t
      WHERE t.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (filter.project_id) {
      sql += ' AND t.project_id = ?';
      params.push(filter.project_id);
    }

    if (filter.status) {
      sql += ' AND t.status = ?';
      params.push(filter.status);
    }

    if (filter.title) {
      sql += ' AND t.title LIKE ?';
      params.push(`%${filter.title}%`);
    }

    sql += ' ORDER BY t.created_at DESC';

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  // ===== FIND BY ID =====
  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    const task = rows[0];
    if (!task) return null;

    const [log] = await this.mysql.execute(
      `SELECT progress FROM progress_logs WHERE task_id = ? ORDER BY created_at DESC LIMIT 1`,
      [id],
    );

    task.latest_progress = log[0]?.progress ?? 0;
    return task;
  }

  // ===== UPDATE =====
  async update(id: number, data: any) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`,
        [id],
      );

      const oldTask = rows[0];
      if (!oldTask) throw new NotFoundException('Task không tồn tại');

      const safeData = { ...data };
      delete safeData.id;
      delete safeData.updated_by;
      delete safeData.changedField;

      const fields: string[] = [];
      const params: any[] = [];

      for (const key in safeData) {
        fields.push(`${key} = ?`);
        params.push(safeData[key]);
      }

      if (fields.length) {
        await conn.execute(
          `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          [...params, id],
        );
      }

      await this.activityService.create(
        {
          task_id: id,
          actor_id: data.updated_by,
          detail: `Đã cập nhật ${this.formatField(data.changedField)}`,
        },
        conn,
      );

      await conn.commit();
      return { success: true };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ===== DELETE =====
  async delete(id: number) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`,
        [id],
      );

      const task = rows[0];
      if (!task) throw new NotFoundException('Task không tồn tại');

      const deletedAt = new Date();

      await conn.execute(`UPDATE tasks SET deleted_at = ? WHERE id = ?`, [
        deletedAt,
        id,
      ]);

      await conn.commit();

      return { ...task, deleted_at: deletedAt };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ===== LOG PROGRESS =====
  async logProgress(taskId: number, progress: number, userId: number) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const percent = Math.max(0, Math.min(100, Number(progress)));

      await conn.execute(
        `INSERT INTO progress_logs (task_id, progress, updated_by)
         VALUES (?, ?, ?)`,
        [taskId, percent, userId],
      );

      await this.activityService.create(
        {
          task_id: taskId,
          actor_id: userId,
          detail: `Cập nhật tiến độ: ${percent}%`,
        },
        conn,
      );

      await conn.commit();
      return { task_id: taskId, progress: percent };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ===== FIND TASK BY USER =====
  async findByAccountId(userId: number) {
    const sql = `
    SELECT DISTINCT t.*
    FROM tasks t
    INNER JOIN task_assignees ta ON t.id = ta.task_id
    WHERE ta.user_id = ?
    AND ta.deleted_at IS NULL
    AND t.deleted_at IS NULL
  `;

    const [rows] = await this.mysql.execute(sql, [userId]);
    return rows;
  }

  // ===== GET ROLE =====
  async getRole(taskId: number, userId: number) {
    const sql = `
    SELECT
      CASE WHEN t.created_by = ? THEN TRUE ELSE FALSE END AS isCreator,
      CASE WHEN ta.id IS NOT NULL THEN TRUE ELSE FALSE END AS isAssigned
    FROM tasks t
    LEFT JOIN task_assignees ta 
      ON t.id = ta.task_id 
      AND ta.user_id = ? 
      AND ta.deleted_at IS NULL
    WHERE t.id = ?
      AND t.deleted_at IS NULL
    LIMIT 1
  `;

    const [rows] = await this.mysql.execute(sql, [userId, userId, taskId]);

    return rows[0] || { isCreator: false, isAssigned: false };
  }
}
