export interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  date: string;
  country: string;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}
