// frontend/src/hooks/queryKeys.ts
export const keys = {
  user: (userId: string | null) => ["user", userId],
  userFollowing: (userId: string, otherUserId: string) => [
    "following",
    userId + otherUserId,
  ],
  posts: ["posts"],
  // Add more keys as needed
};