export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  password2: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  // Define what user information you want to store
  // e.g., from decoding the JWT
  id: number;
  email: string;
  username: string;
}
