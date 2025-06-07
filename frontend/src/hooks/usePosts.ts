// filepath: /c:/Users/fares/Documents/GitHub/tiktok-main/frontend/src/hooks/usePosts.ts
import { useQuery } from "@tanstack/react-query";
import PostService from "../services/postsPB";
import { keys } from "./queryKeys";

export const usePosts = (
  profile: boolean,
  creator: string | null,
  selectedFeed: "ForYou" | "Following",
) => {
  return useQuery(
    keys.posts,
    async () => {
      if (profile && creator) {
        return await PostService.getPostsByUserId(creator);
      } else if (selectedFeed === "ForYou") {
        return await PostService.getFeed();
      } else {
        return await PostService.getFollowingFeed();
      }
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  );
};
