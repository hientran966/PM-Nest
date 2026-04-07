import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MemberService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly notificationService: NotificationService,
  ) {}

  extractMemberData(payload: any) {
    return {
      project_id: payload.project_id ?? null,
      user_id: payload.user_id ?? null,
      role: payload.role ?? 'member',
      invited_by: payload.invited_by ?? null,
      status: payload.status ?? 'invited',
    };
  }

  // ===== CREATE =====
  async create(payload: any, externalConnection: any = null) {
    if (!payload?.project_id || !payload?.user_id) {
      throw new BadRequestException('Thiếu project_id hoặc user_id');
    }

    const member = this.extractMemberData(payload);
    const conn = externalConnection || (await this.mysql.getConnection());
    const shouldRelease = !externalConnection;

    try {
      if (!externalConnection) await conn.beginTransaction();

      const [existing] = await conn.execute(
        `SELECT id, status FROM project_members
         WHERE project_id = ? 
         AND user_id = ?
         AND status != 'declined'
         AND deleted_at IS NULL`,
        [member.project_id, member.user_id],
      );

      if (existing.length > 0) {
        if (!externalConnection) await conn.rollback();
        return {
          id: existing[0].id,
          ...member,
          skipped: true,
          status: existing[0].status,
        };
      }

      const [result] = await conn.execute(
        `INSERT INTO project_members
         (project_id, user_id, role, status, invited_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          member.project_id,
          member.user_id,
          member.role,
          member.status,
          member.invited_by,
        ],
      );

      const newMember = { id: result.insertId, ...member };

      if (member.invited_by && member.status === 'invited') {
        await this.notificationService.create(
          {
            actor_id: member.invited_by,
            recipient_id: member.user_id,
            type: 'project_invite',
            reference_type: 'project',
            reference_id: member.project_id,
          },
          conn,
        );
      }

      if (!externalConnection) await conn.commit();
      return newMember;
    } catch (error) {
      if (!externalConnection) await conn.rollback();
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  }

  // ===== FIND BY ID =====
  async findById(id: number, connection: any = this.mysql) {
    const [rows] = await connection.execute(
      `SELECT * FROM project_members 
       WHERE id = ? 
       AND status != 'declined'
       AND deleted_at IS NULL`,
      [id],
    );

    return rows[0] || null;
  }

  // ===== UPDATE =====
  async update(id: number, payload: any, connection: any = this.mysql) {
    const fields: string[] = [];
    const params: any[] = [];

    for (const key in payload) {
      if (key === 'id') continue;
      fields.push(`${key} = ?`);
      params.push(payload[key]);
    }

    if (fields.length === 0) {
      throw new BadRequestException('Không có trường nào để cập nhật');
    }

    const sql = `UPDATE project_members SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    await connection.execute(sql, params);
    return this.findById(id, connection);
  }

  // ===== DELETE =====
  async delete(id: number) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const member = await this.findById(id, conn);
      if (!member) {
        await conn.rollback();
        throw new NotFoundException('Member không tồn tại');
      }

      const { project_id, user_id } = member;

      await conn.execute(
        `UPDATE project_members SET deleted_at = NOW() WHERE id = ?`,
        [id],
      );

      await conn.execute(
        `
        UPDATE task_assignees ta
        JOIN tasks t ON ta.task_id = t.id
        SET ta.deleted_at = NOW()
        WHERE t.project_id = ?
        AND ta.user_id = ?
        AND ta.deleted_at IS NULL
        `,
        [project_id, user_id],
      );

      await conn.execute(
        `
        UPDATE chat_channel_members ccm
        JOIN chat_channels cc ON ccm.channel_id = cc.id
        SET ccm.deleted_at = NOW()
        WHERE cc.project_id = ?
        AND ccm.user_id = ?
        AND ccm.deleted_at IS NULL
        `,
        [project_id, user_id],
      );

      await conn.commit();
      return id;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // ===== GET MEMBERS BY PROJECT =====
  async getByProjectId(projectId: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT DISTINCT pm.*, u.name, u.id AS user_id
      FROM users u
      LEFT JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
      AND pm.status = 'accepted'
      AND pm.deleted_at IS NULL
      AND u.deleted_at IS NULL
      `,
      [projectId],
    );

    return rows;
  }

  // ===== INVITE LIST =====
  async getInviteList(userId: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT pm.*, u.name AS invited_by_name, p.name AS project_name
      FROM project_members pm
      JOIN users u ON pm.invited_by = u.id
      JOIN projects p ON pm.project_id = p.id
      WHERE pm.user_id = ?
      AND pm.status = 'invited'
      AND pm.deleted_at IS NULL
      `,
      [userId],
    );

    return rows;
  }

  // ===== ACCEPT =====
  async acceptInvite(id: number, userId: number) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const member = await this.findById(id, conn);
      if (!member || member.user_id !== userId || member.status !== 'invited') {
        await conn.rollback();
        return null;
      }

      const updated = await this.update(id, { status: 'accepted' }, conn);

      // notification
      if (member.invited_by && member.invited_by !== userId) {
        await this.notificationService.create(
          {
            actor_id: userId,
            recipient_id: member.invited_by,
            type: 'project_accepted',
            reference_type: 'project',
            reference_id: member.project_id,
          },
          conn,
        );
      }

      await conn.commit();
      return updated;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // ===== DECLINE =====
  async declineInvite(id: number, userId: number) {
    const conn = await this.mysql.getConnection();

    try {
      await conn.beginTransaction();

      const member = await this.findById(id, conn);
      if (!member || member.user_id !== userId || member.status !== 'invited') {
        await conn.rollback();
        return null;
      }

      const updated = await this.update(id, { status: 'declined' }, conn);

      if (member.invited_by && member.invited_by !== userId) {
        await this.notificationService.create(
          {
            actor_id: userId,
            recipient_id: member.invited_by,
            type: 'project_declined',
            reference_type: 'project',
            reference_id: member.project_id,
          },
          conn,
        );
      }

      await conn.commit();
      return updated;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
