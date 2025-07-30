export interface RegisterCredentials {
  email: string;
  password: string;
  password2: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordChangeCredentials {
  old_password: string;
  new_password1: string;
  new_password2: string;
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
  has_password: boolean;
}

export interface Post {
  id: number;
  title: string;
  image_url: string;
  width: number;
  height: number;
  tags: string[]; // An array of strings for our searchable tags
}
