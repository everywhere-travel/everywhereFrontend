export interface AuthResponse {
  id: number;
  token: string;
  name: string;
  role: string;
  permissions: {
    [module: string]: Array<'READ' | 'CREATE' | 'UPDATE' | 'DELETE'>;
  };
}
