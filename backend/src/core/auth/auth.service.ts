import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../persistence/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  department_id?: string;
  office_location_id?: string;
  context?: string;
  interface?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn = '8h';

  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET must be set in production');
    }
    this.jwtSecret = secret || 'dev-secret-key-do-not-use-in-prod';
  }

  async login(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true, department: true, office: true },
    });

    if (!employee || !employee.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (employee.employment_status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role?.role_name || 'Employee',
      department_id: employee.department_id || undefined,
      office_location_id: employee.office_location_id || undefined,
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });

    return {
      token,
      user: {
        id: employee.id,
        email: employee.email,
        full_name: employee.full_name,
        employee_code: employee.employee_code,
        role: employee.role?.role_name || 'Employee',
        department: employee.department?.name || null,
        office: employee.office?.location_name || null,
        language_preference: employee.language_preference,
      },
    };
  }

  async register(data: { email: string; password: string; full_name: string; employee_code?: string }) {
    const existing = await this.prisma.employee.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already in use');

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const password_hash = await bcrypt.hash(data.password, rounds);

    const employee = await this.prisma.employee.create({
      data: {
        email: data.email.toLowerCase(),
        password_hash,
        full_name: data.full_name,
        employee_code: data.employee_code || `EMP-${Date.now().toString(36).toUpperCase()}`,
        hire_date: new Date(),
        employment_status: 'active',
      },
    });

    return { id: employee.id, email: employee.email, full_name: employee.full_name };
  }

  async changePassword(employeeId: string, currentPassword: string, newPassword: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee || !employee.password_hash) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(currentPassword, employee.password_hash);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const password_hash = await bcrypt.hash(newPassword, rounds);

    await this.prisma.employee.update({ where: { id: employeeId }, data: { password_hash } });
    return { success: true };
  }

  async resetPassword(employeeId: string, newPassword: string) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const password_hash = await bcrypt.hash(newPassword, rounds);
    await this.prisma.employee.update({ where: { id: employeeId }, data: { password_hash } });
    return { success: true };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getProfile(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { role: true, department: true, office: true },
    });
    if (!employee) throw new UnauthorizedException('User not found');

    return {
      id: employee.id,
      email: employee.email,
      full_name: employee.full_name,
      employee_code: employee.employee_code,
      phone: employee.phone,
      role: employee.role?.role_name || 'Employee',
      department: employee.department?.name || null,
      department_id: employee.department_id,
      office: employee.office?.location_name || null,
      office_location_id: employee.office_location_id,
      hire_date: employee.hire_date,
      employment_status: employee.employment_status,
      language_preference: employee.language_preference,
    };
  }
}
