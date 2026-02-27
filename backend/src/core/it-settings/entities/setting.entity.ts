/**
 * Setting Entity
 * Represents tenant-specific configuration settings
 */
export class Setting {
  id: string;
  tenantId: string;
  key: string;
  value: string;
  category: "general" | "finance" | "hr" | "security" | "integration";
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
