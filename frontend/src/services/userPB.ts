import { pb, Collections } from "../../pocketbaseConfig";
import { User, SearchUser, Following } from "../../types";

export class UserService {
  /**
   * Save user profile image
   */
  static async saveUserProfileImage(imageFile: File | Blob): Promise<void> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      const formData = new FormData();
      formData.append("avatar", imageFile);

      await pb.collection(Collections.USERS).update(currentUser.id, formData);
    } catch (error) {
      console.error("Failed to save user profile image:", error);
      throw error;
    }
  }

  /**
   * Save user field
   */
  static async saveUserField(field: string, value: string): Promise<void> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      const updateData: Record<string, string> = {};
      updateData[field] = value;

      await pb.collection(Collections.USERS).update(currentUser.id, updateData);
    } catch (error) {
      console.error("Failed to save user field:", error);
      throw error;
    }
  }

  /**
   * Query users by email
   */
  static async queryUsersByEmail(email: string): Promise<SearchUser[]> {
    try {
      if (email === "") {
        return [];
      }

      const users = await pb.collection(Collections.USERS).getList(1, 50, {
        filter: `email ~ "${email}"`,
      });

      return users.items as unknown as SearchUser[];
    } catch (error) {
      console.error("Failed to query users:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await pb.collection(Collections.USERS).getOne(id);
      return user as unknown as User;
    } catch (error) {
      console.error("User not found:", error);
      return null;
    }
  }

  /**
   * Check if user is following another user
   */
  static async getIsFollowing(
    userId: string,
    otherUserId: string,
  ): Promise<boolean> {
    try {
      const result = await pb.collection(Collections.FOLLOWING).getList(1, 1, {
        filter: `follower = "${userId}" && following = "${otherUserId}"`,
      });

      return result.items.length > 0;
    } catch (error) {
      console.error("Error checking following status:", error);
      return false;
    }
  }

  /**
   * Change follow state between users
   */
  static async changeFollowState({
    otherUserId,
    isFollowing,
  }: {
    otherUserId: string;
    isFollowing: boolean;
  }): Promise<boolean> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        console.error("No current user");
        return false;
      }

      if (isFollowing) {
        // Unfollow - find and delete the following record
        const result = await pb
          .collection(Collections.FOLLOWING)
          .getList(1, 1, {
            filter: `follower = "${currentUser.id}" && following = "${otherUserId}"`,
          });

        if (result.items.length > 0) {
          await pb.collection(Collections.FOLLOWING).delete(result.items[0].id);

          // Update counts
          await this.updateFollowCounts(currentUser.id, otherUserId, -1);
        }
      } else {
        // Follow - create new following record
        await pb.collection(Collections.FOLLOWING).create({
          follower: currentUser.id,
          following: otherUserId,
        });

        // Update counts
        await this.updateFollowCounts(currentUser.id, otherUserId, 1);
      }

      return true;
    } catch (error) {
      console.error("Error changing follow state:", error);
      return false;
    }
  }

  /**
   * Update follower/following counts (replaces Firebase Functions logic)
   */
  private static async updateFollowCounts(
    followerId: string,
    followingId: string,
    increment: number,
  ): Promise<void> {
    try {
      // Get current user data
      const [follower, following] = await Promise.all([
        pb.collection(Collections.USERS).getOne(followerId),
        pb.collection(Collections.USERS).getOne(followingId),
      ]);

      // Update counts
      await Promise.all([
        pb.collection(Collections.USERS).update(followerId, {
          followingCount: (follower.followingCount || 0) + increment,
        }),
        pb.collection(Collections.USERS).update(followingId, {
          followersCount: (following.followersCount || 0) + increment,
        }),
      ]);
    } catch (error) {
      console.error("Error updating follow counts:", error);
    }
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(userId: string): Promise<User[]> {
    try {
      const following = await pb.collection(Collections.FOLLOWING).getFullList({
        filter: `follower = "${userId}"`,
        expand: "following",
      });

      return following
        .map((item) => item.expand?.following)
        .filter(Boolean) as unknown as User[];
    } catch (error) {
      console.error("Error getting following:", error);
      return [];
    }
  }

  /**
   * Get users that follow a user
   */
  static async getFollowers(userId: string): Promise<User[]> {
    try {
      const followers = await pb.collection(Collections.FOLLOWING).getFullList({
        filter: `following = "${userId}"`,
        expand: "follower",
      });

      return followers
        .map((item) => item.expand?.follower)
        .filter(Boolean) as unknown as User[];
    } catch (error) {
      console.error("Error getting followers:", error);
      return [];
    }
  }
}

export default UserService;

// Export individual functions for backward compatibility
export const saveUserProfileImage = UserService.saveUserProfileImage;
export const saveUserField = UserService.saveUserField;
export const queryUsersByEmail = UserService.queryUsersByEmail;
export const getUserById = UserService.getUserById;
export const getIsFollowing = UserService.getIsFollowing;
export const changeFollowState = UserService.changeFollowState;
