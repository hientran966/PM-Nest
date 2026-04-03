import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Inject } from '@nestjs/common';

@Injectable()
export class AccountService {
  constructor(@Inject('MYSQL') private readonly mysql: any) {}

  extractAccountData(payload: any) {
    const account: any = {
      email: payload.email,
      name: payload.name,
      role: payload.role ?? 'user',
    };

    Object.keys(account).forEach((key) => {
      if (account[key] === undefined) delete account[key];
    });

    return account;
  }

  // ===== CREATE =====
  async create(payload: any) {
    if (!payload) throw new BadRequestException('Không có dữ liệu đầu vào');
    if (!payload.name) throw new BadRequestException('Cần có tên người dùng');
    if (!payload.email) throw new BadRequestException('Cần có email');

    const [email] = await this.mysql.execute(
      'SELECT id FROM users WHERE email = ?',
      [payload.email],
    );
    if (email.length > 0) throw new BadRequestException('Tài khoản đã tồn tại');

    const [name] = await this.mysql.execute(
      'SELECT id FROM users WHERE name = ?',
      [payload.name],
    );
    if (name.length > 0)
      throw new BadRequestException('Tên người dùng đã tồn tại');

    if (!payload.password) payload.password = 'defaultPW';

    const account = await this.extractAccountData(payload);
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const hashedPassword = await bcrypt.hash(payload.password, 10);

      const [result] = await connection.execute(
        `INSERT INTO users (email, name, role, password_hash)
         VALUES (?, ?, ?, ?)`,
        [account.email, account.name, account.role, hashedPassword],
      );

      await connection.commit();
      return { id: result.insertId, ...account };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ===== FIND =====
  async find(filter: any = {}) {
    let sql = `SELECT * FROM users WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (filter.email) {
      sql += ' AND email = ?';
      params.push(filter.email);
    }

    if (filter.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }

    const [rows] = await this.mysql.execute(sql, params);

    return rows.map((row) => {
      const r = { ...row };
      delete r.password_hash;
      delete r.deleted_at;
      return r;
    });
  }

  async findById(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    const user = rows[0];
    if (!user) return null;

    const result = { ...user };
    delete result.password_hash;
    delete result.deleted_at;
    return result;
  }

  // ===== UPDATE =====
  async update(id: number, payload: any) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');

    const update = await this.extractAccountData(payload);

    let sql = 'UPDATE users SET ';
    const fields: any[] = [];
    const params: any[] = [];

    for (const key in update) {
      if (key === 'id') continue;
      fields.push(`${key} = ?`);
      params.push(update[key]);
    }

    if (payload.password) {
      fields.push('password_hash = ?');
      params.push(await bcrypt.hash(payload.password, 10));

      fields.push('updated_at = ?');
      params.push(new Date());
    }

    sql += fields.join(', ') + ' WHERE id = ?';
    params.push(id);

    await this.mysql.execute(sql, params);

    return this.findById(id);
  }

  // ===== DELETE (SOFT) =====
  async delete(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');

    const deletedAt = new Date();

    await this.mysql.execute('UPDATE users SET deleted_at = ? WHERE id = ?', [
      deletedAt,
      id,
    ]);

    return { ...user, deleted_at: deletedAt };
  }

  // ===== RESTORE =====
  async restore(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');

    const [result] = await this.mysql.execute(
      'UPDATE users SET deleted_at = NULL WHERE id = ?',
      [id],
    );

    return result.affectedRows > 0;
  }

  // ===== LOGIN =====
  async login(identifier: string, password: string) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM users 
       WHERE (email = ? OR name = ?) 
       AND deleted_at IS NULL`,
      [identifier, identifier],
    );

    const account = rows[0];
    if (!account) throw new NotFoundException('Tài khoản không tồn tại');

    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) throw new BadRequestException('Mật khẩu không đúng');

    const payload = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return {
      message: 'Đăng nhập thành công',
      token,
      user: payload,
    };
  }

  // ===== GET DELETED =====
  async getDeleted(filter: any = {}) {
    let sql = 'SELECT * FROM users WHERE deleted_at IS NOT NULL';
    const params: any[] = [];

    if (filter.email) {
      sql += ' AND email LIKE ?';
      params.push(`%${filter.email}%`);
    }

    if (filter.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }

    const [rows] = await this.mysql.execute(sql, params);
    return rows;
  }

  // ===== CHANGE PASSWORD =====
  async changePassword(id: number, oldPassword: string, newPassword: string) {
    const [rows] = await this.mysql.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [id],
    );

    if (rows.length === 0)
      throw new NotFoundException('Tài khoản không tồn tại');

    const storedPassword = rows[0].password_hash;

    const isMatch = await bcrypt.compare(oldPassword, storedPassword);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.mysql.execute(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [hashedNewPassword, new Date(), id],
    );

    return { message: 'Đổi mật khẩu thành công' };
  }

  // ===== STATS =====
  async getStats(userId: number, projectId: number | null = null) {
    if (projectId) {
      const [[tasks]] = await this.mysql.execute(
        `SELECT COUNT(DISTINCT t.id) AS count
         FROM tasks t
         INNER JOIN task_assignees ta ON ta.task_id = t.id
         WHERE ta.user_id = ? 
           AND t.project_id = ?
           AND t.deleted_at IS NULL
           AND ta.deleted_at IS NULL`,
        [userId, projectId],
      );

      const [[member]] = await this.mysql.execute(
        `SELECT role 
         FROM project_members 
         WHERE user_id = ? 
           AND project_id = ?
           AND deleted_at IS NULL
         LIMIT 1`,
        [userId, projectId],
      );

      return {
        project_id: projectId,
        role: member?.role || null,
        tasks: tasks.count || 0,
      };
    }

    const [[projects]] = await this.mysql.execute(
      `SELECT COUNT(DISTINCT project_id) AS count 
       FROM project_members 
       WHERE user_id = ? AND deleted_at IS NULL`,
      [userId],
    );

    const [[tasks]] = await this.mysql.execute(
      `SELECT COUNT(DISTINCT task_id) AS count 
       FROM task_assignees 
       WHERE user_id = ? AND deleted_at IS NULL`,
      [userId],
    );

    return {
      projects: projects.count || 0,
      tasks: tasks.count || 0,
    };
  }
}
