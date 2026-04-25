import { TenantContext } from "../../../gateway/tenant-context.interface";
import { User } from "../entities/user.entity";

export interface IAuthRepository {
  findByEmail( ctx: TenantContext, email: string): Promise<User | null>;
  findById( ctx: TenantContext, id: string): Promise<User | null>;
  create( ctx: TenantContext, data: any): Promise<User>;
  update( ctx: TenantContext, id: string, data: Partial<User>): Promise<User>;
}

export const IAuthRepository = Symbol("IAuthRepository");
