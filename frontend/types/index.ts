// PocketBase User Record
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  followingCount: number;
  followersCount: number;
  likesCount: number;
  bio?: string;
  postsCount?: string;
  isVerified?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
  created: string;
  updated: string;
}

// For backward compatibility
export interface SearchUser extends User {}

// PocketBase Post Record
export interface Post {
  id: string;
  creator: string;
  description: string;
  media: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  viewsCount?: number;
  hashtags?: number;
  mentions?: number;
  location?: string;
  isPrivate?: boolean;
  created: string;
  updated: string;
}

// PocketBase Comment Record
export interface Comment {
  id: string;
  post: string;
  creator: string;
  comment: string;
  likesCount?: number;
  repliesCount?: number;
  mentions?: any;
  created: string;
  updated: string;
}

// PocketBase Chat Record
export interface Chat {
  id: string;
  participants: string[];
  type?: "direct" | "group";
  name?: string;
  description?: string;
  avatar?: string;
  lastActivity?: string;
  created: string;
  updated: string;
}

// PocketBase Message Record
export interface Message {
  id: string;
  chat: string;
  sender: string;
  content: string;
  media?: string;
  created: string;
  updated: string;
}

// PocketBase Following Record
export interface Following {
  id: string;
  follower: string;
  following: string;
  created: string;
  updated: string;
}

// PocketBase Like Record
export interface Like {
  id: string;
  user: string;
  post?: string;
  comment?: string;
  created: string;
  updated: string;
}
