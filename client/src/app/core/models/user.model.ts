export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}
