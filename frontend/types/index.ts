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
  role: 'USER' | 'ANNOTATOR' | 'ADMIN' | 'SUPERUSER';
  is_staff: boolean;
  is_superuser: boolean;
}

export interface Post {
  id: number;
  title: string;
  image_url: string;
  width: number;
  height: number;
  shape: string;
  pattern: string;
  size: string;
  colors: string[];
  try_on_image_url?: string;
}

export interface TryOn {
  id: number;
  post: Post;
  created_at: string;
}

export interface PaginatedPostResponse {
  seed: string | number;
  results: Post[];
  count?: number; // Total number of posts
  next?: string | null; // URL for the next page
  previous?: string | null; // URL for the previous page
  fallback_triggered?: boolean; // Whether AI similar search fallback was triggered
  fallback_added?: number; // Number of results added from fallback
  fallback_error?: string; // Error message if fallback failed
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

export interface NailAnnotation {
  id: string;
  _id: string;
  image_name: string;
  image_path: string;
  shape: string;
  shape_source: string;
  pattern: string;
  pattern_source: string;
  colors: string[];
  size: string;
  num_nails_detected: number;
  created_at: string;
  is_verified?: boolean;
}
