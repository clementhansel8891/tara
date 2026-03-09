import { Injectable } from "@nestjs/common";
import { IAuthRepository } from "./auth.repository.interface";
import { User, UserCompany } from "../entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../shared/roles";

@Injectable()
export class AuthMockRepository implements IAuthRepository {
  private users: User[] = [
    {
      id: "usr-superadmin-001",
      email: "superadmin@zenvix.com",
      passwordHash:
        "$2a$10$yycoCL97bRvbcXdNjKXqP.J3fmu2HBt5yq4eKO4Vh0pwbYoD4ZWD2",
      firstName: "Superadmin",
      lastName: "Zenvix",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCompanies: [
        {
          id: uuidv4(),
          userId: "usr-superadmin-001",
          tenantId: "global",
          role: UserRole.SUPERADMIN,
          isDefault: true,
        },
      ],
    },
    {
      id: "7f15f139-8652-4796-a2b9-9fbf25515681",
      email: "admin@zenvix.com",
      passwordHash:
        "$2a$10$Zvew.WpJmKKJlqIYTjCGgutQ41d5xn96.KZFJjrG5wuW1PqQcxoky",
      firstName: "Admin",
      lastName: "Zenvix",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCompanies: [
        {
          id: uuidv4(),
          userId: "7f15f139-8652-4796-a2b9-9fbf25515681",
          tenantId: "global",
          role: UserRole.SUPERADMIN,
          isDefault: true,
        },
      ],
    },
    {
      id: "usr-demo-001",
      email: "demo@zenvix.com",
      passwordHash:
        "$2a$10$2ElqQbxQQvBLhApdgDQNouw1/KHiXFA9HlBacoGNV8dFuhVkt9sBW",
      firstName: "Demo",
      lastName: "User",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCompanies: [
        {
          id: uuidv4(),
          userId: "usr-demo-001",
          tenantId: "tenant-a",
          role: UserRole.OWNER,
          isDefault: true,
        },
      ],
    },
    {
      id: "user-owner-a",
      email: "owner-a@company.com",
      passwordHash:
        "$2a$10$X7h6nL6v6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7Bv6B7B",
      firstName: "Owner",
      lastName: "A",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCompanies: [
        {
          id: uuidv4(),
          userId: "user-owner-a",
          tenantId: "tenant-a",
          role: UserRole.OWNER,
          isDefault: true,
        },
      ],
    },
  ];

  async findByEmail(_tenantId: string, email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async findById(_tenantId: string, id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    return user;
  }

  async create(_tenantId: string, data: any): Promise<User> {
    const user: User = {
      id: uuidv4(),
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userCompanies: [],
    };
    this.users.push(user);
    return user;
  }

  async update(
    _tenantId: string,
    id: string,
    data: Partial<User>,
  ): Promise<User> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");

    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.users[index];
  }
}
