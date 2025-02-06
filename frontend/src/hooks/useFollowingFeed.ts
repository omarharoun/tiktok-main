import { useQuery } from "@tanstack/react-query";
import { getFollowingFeed } from "../services/posts";
import { keys } from "./queryKeys";

export const useFollowingFeed = (creator: string | null) => {
  return useQuery(
    creator ? keys.userFollowing(creator, "following") : [],
    async () => {
      if (creator) {
        return await getFollowingFeed();
      }
      return [];
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    }
  );
};