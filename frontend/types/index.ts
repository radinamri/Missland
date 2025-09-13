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
  id: number;
  email: string;
  username: string;
  has_password: boolean;
  profile_picture: string | null;
}

export interface Post {
  id: number;
  title: string;
  image_url: string;
  width: number;
  height: number;
  tags: string[];
  try_on_image_url: string;
}

export interface TryOn {
  id: number;
  post: Post;
  created_at: string;
}

export interface PaginatedPostResponse {
  seed?: number | string;
  results: Post[];
}

export interface Collection {
  id: number;
  name: string;
  posts?: Post[];
  posts_preview?: string[];
  post_count?: number;
}

export interface CollectionDetail {
  id: number;
  name: string;
  posts: Post[];
}

export interface NavigationState {
  type: "explore" | "detail";
  posts: Post[];
  seed: string;
  parentPost?: Post;
}
