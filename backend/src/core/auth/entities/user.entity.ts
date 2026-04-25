export class User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  user_companies?: UserCompany[];
}

export class UserCompany {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  is_default: boolean;
  company?: any; // Avoiding deep circular imports for now
}
