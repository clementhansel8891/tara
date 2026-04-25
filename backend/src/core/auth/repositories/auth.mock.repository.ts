import { Injectable } from "@nestjs/common";
import { IAuthRepository } from "./auth.repository.interface";
import { User, UserCompany } from "../entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../shared/roles";
import { TenantContext } from "../../../gateway/tenant-context.interface";

@Injectable()
export class AuthMockRepository implements IAuthRepository {
  private static users: User[] = [
    {
      id: "usr-superadmin-001",
      email: "superadmin@zenvix.com",
      password_hash:
        "$2a$10$yycoCL97bRvbcXdNjKXqP.J3fmu2HBt5yq4eKO4Vh0pwbYoD4ZWD2",
      first_name: "Superadmin",
      last_name: "Zenvix",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      user_companies: [
        {
          id: uuidv4(),
          user_id: "usr-superadmin-001",
          tenant_id: "global",
          role: UserRole.SUPERADMIN,
          is_default: true,
        },
      ],
    },
    {
      id: "7f15f139-8652-4796-a2b9-9fbf25515681",
      email: "admin@zenvix.com",
      password_hash:
        "$2a$10$Zvew.WpJmKKJlqIYTjCGgutQ41d5xn96.KZFJjrG5wuW1PqQcxoky",
      first_name: "Admin",
      last_name: "Zenvix",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      user_companies: [
        {
          id: uuidv4(),
          user_id: "7f15f139-8652-4796-a2b9-9fbf25515681",
          tenant_id: "global",
          role: UserRole.SUPERADMIN,
          is_default: true,
        },
      ],
    },
    {
      id: "usr-hansel-99",
      email: "hansel@zenvix.id",
      password_hash:
        "$2a$10$78DtOlsmTgp7/Ek1tqBVP.cX0a8/zYSnqB4AZllJr/pNjlChuQUdi",
      first_name: "Hansel",
      last_name: "Zenvix",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      user_companies: [
        {
          id: uuidv4(),
          user_id: "usr-hansel-99",
          tenant_id: "hansel-demo-tenant",
          role: UserRole.OWNER,
          is_default: true,
        },
      ],
    },
    {
      id: "usr-demo-001",
      email: "demo@zenvix.com",
      password_hash:
        "$2a$10$2ElqQbxQQvBLhApdgDQNouw1/KHiXFA9HlBacoGNV8dFuhVkt9sBW",
      first_name: "Demo",
      last_name: "User",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      user_companies: [
        {
          id: uuidv4(),
          user_id: "usr-demo-001",
          tenant_id: "tenant-a",
          role: UserRole.OWNER,
          is_default: true,
        },
      ],
    },
    {
      id: "user-owner-a",
      email: "owner-a@company.com",
      password_hash:
        "$2a$10$X7h6nL6v6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7B",
      first_name: "Owner",
      last_name: "A",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      user_companies: [
        {
          id: uuidv4(),
          user_id: "user-owner-a",
          tenant_id: "tenant-a",
          role: UserRole.OWNER,
          is_default: true,
        },
      ],
    },
  ];

  async findByEmail(_ctx: TenantContext, email: string): Promise<User | null> {
    return AuthMockRepository.users.find((u) => u.email === email) || null;
  }

  async findById(_ctx: TenantContext, id: string): Promise<User | null> {
    const user = AuthMockRepository.users.find((u) => u.id === id);
    if (!user) return null;
    return user;
  }

  async create(_ctx: TenantContext, data: any): Promise<User> {
    const user: User = {
      id: uuidv4(),
      email: data.email,
      password_hash: data.password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      user_companies: [],
    };
    AuthMockRepository.users.push(user);
    return user;
  }

  async update(
    _ctx: TenantContext,
    id: string,
    data: Partial<User>,
  ): Promise<User> {
    const index = AuthMockRepository.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");

    AuthMockRepository.users[index] = {
      ...AuthMockRepository.users[index],
      ...data,
      updated_at: new Date(),
    };
    return AuthMockRepository.users[index];
  }
}
