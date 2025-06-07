import PocketBase from "pocketbase";

// PocketBase configuration
const PB_URL = "http://164.92.139.226:8090";

// Initialize PocketBase client
export const pb = new PocketBase(PB_URL);

// PocketBase collections
export const Collections = {
  USERS: "users",
  POSTS: "posts",
  COMMENTS: "comments",
  LIKES: "likes",
  FOLLOWING: "following",
  CHATS: "chats",
  MESSAGES: "messages",
} as const;

// Auto-refresh auth token
pb.autoCancellation(false);

export default pb;
