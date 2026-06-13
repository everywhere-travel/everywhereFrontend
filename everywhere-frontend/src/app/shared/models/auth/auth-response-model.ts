export interface AuthResponse {
  id: number;
  token: string;
  name: string;
  role: string;
  // Nuevo formato: ["CLIENTES:READ", "COTIZACIONES:CREATE", "ALL_MODULES:DELETE", ...]
  permissions: string[];
}
