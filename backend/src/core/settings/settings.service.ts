import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.systemSettings.findMany();
  }

  async getByCategory(category: string) {
    return this.prisma.systemSettings.findMany({
      where: { setting_category: category },
    });
  }

  async upsert(key: string, value: any, category: string, modifiedBy?: string) {
    return this.prisma.systemSettings.upsert({
      where: { setting_key: key },
      update: {
        setting_value: value,
        last_modified_by: modifiedBy,
        updated_at: new Date(),
      },
      create: {
        setting_key: key,
        setting_value: value,
        setting_category: category,
        last_modified_by: modifiedBy,
      },
    });
  }
}
