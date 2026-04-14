import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ProjectService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly memberService: MemberService,
    private readonly notificationService: NotificationService,
  ) {}

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
    if (!payload?.name || !payload?.created_by) {
      throw new BadRequestException('Thiếu dữ liệu');
    }

    const project = this.extractProjectData(payload);
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO projects (name, description, start_date, end_date, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          project.name,
          project.description,
          project.start_date,
          project.end_date,
          project.status,
          project.created_by,
        ],
      );

      const projectId = result.insertId;

      await this.memberService.create(
        {
          project_id: projectId,
          user_id: project.created_by,
          role: 'owner',
          status: 'accepted',
        },
        conn,
      );

      if (Array.isArray(payload.members)) {
        for (const m of payload.members) {
          if (m.user_id === project.created_by) continue;

          await this.memberService.create(
            {
              project_id: projectId,
              user_id: m.user_id,
              role: m.role ?? 'member',
              invited_by: project.created_by,
              status: 'invited',
            },
            conn,
          );
        }
      }

      await conn.commit();
      return { id: projectId };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
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

    if (filter.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter.created_by) {
      sql += ' AND created_by = ?';
      params.push(filter.created_by);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  // ===== FIND BY ID =====
  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    if (!rows.length) return null;

    const project = rows[0];

    const [tasks] = await this.mysql.execute(
      `SELECT * FROM tasks WHERE project_id = ? AND deleted_at IS NULL`,
      [id],
    );

    project.tasks = tasks;
    return project;
  }

  // ===== UPDATE =====
  async update(id: number, payload: any) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const project = await this.findById(id);
      if (!project) {
        throw new NotFoundException('Dự án không tồn tại');
      }

      const fields: string[] = [];
      const params: any[] = [];

      for (const key in payload) {
        if (['id', 'actor_id'].includes(key)) continue;
        fields.push(`${key} = ?`);
        params.push(payload[key]);
      }

      if (!fields.length) {
        throw new BadRequestException('Không có dữ liệu update');
      }

      await conn.execute(
        `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
        [...params, id],
      );

      const members = await this.memberService.getByProjectId(id);
      const actorId = payload.actor_id;

      for (const m of members) {
        if (m.user_id === actorId) continue;

        await this.notificationService.create(
          {
            actor_id: actorId,
            recipient_id: m.user_id,
            type: 'project_updated',
            reference_type: 'project',
            reference_id: id,
          },
          conn,
        );
      }

      await conn.commit();
      return this.findById(id);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ===== DELETE =====
  async delete(id: number, actorId: number) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const project = await this.findById(id);
      if (!project) {
        throw new NotFoundException('Dự án không tồn tại');
      }

      await conn.execute(
        `UPDATE projects SET deleted_at = NOW() WHERE id = ?`,
        [id],
      );

      const members = await this.memberService.getByProjectId(id);

      for (const m of members) {
        if (m.user_id === actorId) continue;

        await this.notificationService.create(
          {
            actor_id: actorId,
            recipient_id: m.user_id,
            type: 'project_updated',
            reference_type: 'project',
            reference_id: id,
            message: 'Dự án đã bị xóa',
          },
          conn,
        );
      }

      await conn.commit();
      return id;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ===== GET PROJECT BY USER =====
  async getByUser(userId: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT DISTINCT p.*
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE 
        (p.created_by = ? OR (pm.user_id = ? AND pm.status = 'accepted'))
        AND pm.deleted_at IS NULL
        AND p.deleted_at IS NULL
      `,
      [userId, userId],
    );

    return rows;
  }

  // ===== GET ROLE =====
  async getRole(projectId: number, userId: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT role
      FROM project_members
      WHERE project_id = ?
      AND user_id = ?
      AND deleted_at IS NULL
      AND status = 'accepted'
      LIMIT 1
      `,
      [projectId, userId],
    );

    return rows[0] || null;
  }

  // ===== ANALYZE =====
  async getProjectInfo(projectId: number) {
    const [rows] = await this.mysql.execute(
      `SELECT id, name, start_date, end_date
     FROM projects
     WHERE id = ? AND deleted_at IS NULL`,
      [projectId],
    );
    return rows;
  }

  async getTaskStats(projectId: number) {
    const [[row]] = await this.mysql.execute(
      `
    SELECT 
      COUNT(*) AS total_tasks,
      SUM(status = 'done') AS done_tasks,
      ROUND(
        IF(COUNT(*) = 0, 0, SUM(status = 'done') / COUNT(*) * 100)
      ) AS completion_rate
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
    `,
      [projectId],
    );

    return row;
  }

  async getTaskStatus(projectId: number) {
    const [rows] = await this.mysql.execute(
      `
    SELECT status, COUNT(*) AS count
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
    GROUP BY status
    `,
      [projectId],
    );

    return rows;
  }

  async getTaskPriority(projectId: number) {
    const [rows] = await this.mysql.execute(
      `
    SELECT priority, COUNT(*) AS count
    FROM tasks
    WHERE project_id = ? AND deleted_at IS NULL
    GROUP BY priority
    `,
      [projectId],
    );

    return rows;
  }

  async getMemberStats(projectId: number) {
    const [[row]] = await this.mysql.execute(
      `
    SELECT COUNT(DISTINCT user_id) AS member_count
    FROM project_members
    WHERE project_id = ?
      AND status = 'accepted'
      AND deleted_at IS NULL
    `,
      [projectId],
    );

    return row;
  }

  async getWorkload(projectId: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT 
        u.name,
        COUNT(ta.id) AS assigned_tasks,
        ROUND(
          COUNT(ta.id) / NULLIF(MAX(total.total_tasks), 0) * 100
        ) AS workload_percent
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN task_assignees ta 
        ON ta.user_id = pm.user_id
        AND ta.deleted_at IS NULL
      LEFT JOIN tasks t 
        ON ta.task_id = t.id
        AND t.project_id = ?
        AND t.deleted_at IS NULL
      CROSS JOIN (
        SELECT COUNT(*) AS total_tasks
        FROM tasks
        WHERE project_id = ? AND deleted_at IS NULL
      ) total
      WHERE pm.project_id = ?
        AND pm.status = 'accepted'
        AND pm.deleted_at IS NULL
      GROUP BY pm.user_id, u.name
    `,
      [projectId, projectId, projectId],
    );

    return rows;
  }

  async getProgressTrend(projectId: number) {
    const [rows] = await this.mysql.execute(
      `
    SELECT 
      DATE(created_at) as date,
      ROUND(AVG(progress), 1) as progress
    FROM (
      SELECT 
        task_id,
        DATE(pl.created_at) as created_at,
        progress,
        ROW_NUMBER() OVER (
          PARTITION BY task_id, DATE(pl.created_at)
          ORDER BY pl.created_at DESC
        ) as rn
      FROM progress_logs pl
      JOIN tasks t ON pl.task_id = t.id
      WHERE t.project_id = ?
        AND pl.deleted_at IS NULL
    ) x
    WHERE rn = 1
    GROUP BY date
    ORDER BY date ASC
    `,
      [projectId],
    );

    return rows;
  }

  async report(projectId: number) {
    const [project] = await this.getProjectInfo(projectId);
    if (!project) throw new Error('Không tìm thấy dự án');

    const [
      taskStats,
      statusStats,
      priorityStats,
      memberStats,
      workloadStats,
      progressTrend,
    ] = await Promise.all([
      this.getTaskStats(projectId),
      this.getTaskStatus(projectId),
      this.getTaskPriority(projectId),
      this.getMemberStats(projectId),
      this.getWorkload(projectId),
      this.getProgressTrend(projectId),
    ]);

    return {
      project,
      total_tasks: taskStats.total_tasks,
      completion_rate: taskStats.completion_rate,
      member_count: memberStats.member_count,
      task_status: statusStats,
      priority: priorityStats,
      workload: workloadStats,
      progress_trend: progressTrend,
    };
  }
}
