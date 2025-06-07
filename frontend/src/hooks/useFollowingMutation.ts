import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "../services/userPB";
import { keys } from "./queryKeys";
import { pb } from "../../pocketbaseConfig";

/**
 * Mutate the state of the follow cache system
 * over a pair of users.
 * In order to do this action optimistically we mutate
 * the data as soon as the request is made, not waiting for the
 * firestore response.
 *
 * @param {Object} options to be passed along to useQuery
 * @returns
 */
export const useFollowingMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation(UserService.changeFollowState, {
    ...options,
    onMutate: (variables) => {
      if (!pb.authStore.model?.id) {
        console.error("No current user");
        return;
      }

      queryClient.setQueryData(
        keys.userFollowing(pb.authStore.model?.id, variables.otherUserId),
        !variables.isFollowing,
      );
    },
  });
};
