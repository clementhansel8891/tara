export class Department {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  headId?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
