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
  try_on_image_url: string;
}

export interface TryOn {
  id: number;
  post: Post;
  created_at: string;
}

export interface PaginatedPostResponse {
  seed: number;
  results: Post[];
}

export type NavigationState = {
  // 'explore' for the main feed, 'detail' for a post view
  type: "explore" | "detail";
  // The posts to display in the grid (either the main feed or "more to explore")
  posts: Post[];
  // The seed used to generate this list of posts
  seed: number;
  // The parent post if we are in a detail view
  parentPost?: Post;
};

export interface Collection {
  id: number;
  name: string;
  thumbnail_url: string | null;
  post_count: number;
}

export interface CollectionDetail {
  id: number;
  name: string;
  posts: Post[];
}
