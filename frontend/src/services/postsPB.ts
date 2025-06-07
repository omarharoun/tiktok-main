import { pb, Collections } from "../../pocketbaseConfig";
import { Post, Comment, Like } from "../../types";

export class PostService {
  /**
   * Get all posts (feed)
   */
  static async getFeed(): Promise<Post[]> {
    try {
      const posts = await pb.collection(Collections.POSTS).getList(1, 50, {
        sort: "-created",
        expand: "creator",
      });

      return posts.items as unknown as Post[];
    } catch (error) {
      console.error("Failed to get feed:", error);
      throw error;
    }
  }

  /**
   * Get following feed
   */
  static async getFollowingFeed(): Promise<Post[]> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      // Get users that current user follows
      const following = await pb.collection(Collections.FOLLOWING).getFullList({
        filter: `follower = "${currentUser.id}"`,
      });

      if (following.length === 0) {
        return [];
      }

      // Create filter for posts from followed users
      const followingIds = following.map((f) => f.following);
      const filterString = followingIds
        .map((id) => `creator = "${id}"`)
        .join(" || ");

      const posts = await pb.collection(Collections.POSTS).getList(1, 50, {
        filter: filterString,
        sort: "-created",
        expand: "creator",
      });

      return posts.items as unknown as Post[];
    } catch (error) {
      console.error("Failed to get following feed:", error);
      throw error;
    }
  }

  /**
   * Get like status for a post
   */
  static async getLikeById(postId: string, userId: string): Promise<boolean> {
    try {
      const result = await pb.collection(Collections.LIKES).getList(1, 1, {
        filter: `user = "${userId}" && post = "${postId}"`,
      });

      return result.items.length > 0;
    } catch (error) {
      console.error("Could not get like:", error);
      return false;
    }
  }

  /**
   * Update like status for a post
   */
  static async updateLike(
    postId: string,
    userId: string,
    currentLikeState: boolean,
  ): Promise<void> {
    try {
      if (currentLikeState) {
        // Unlike - find and delete like record
        const result = await pb.collection(Collections.LIKES).getList(1, 1, {
          filter: `user = "${userId}" && post = "${postId}"`,
        });

        if (result.items.length > 0) {
          await pb.collection(Collections.LIKES).delete(result.items[0].id);
          await this.updatePostLikeCount(postId, -1);
          await this.updateUserLikeCount(postId, -1);
        }
      } else {
        // Like - create like record
        await pb.collection(Collections.LIKES).create({
          user: userId,
          post: postId,
        });

        await this.updatePostLikeCount(postId, 1);
        await this.updateUserLikeCount(postId, 1);
      }
    } catch (error) {
      console.error("Could not update like:", error);
      throw error;
    }
  }

  /**
   * Update post like count (replaces Firebase Functions logic)
   */
  private static async updatePostLikeCount(
    postId: string,
    increment: number,
  ): Promise<void> {
    try {
      const post = await pb.collection(Collections.POSTS).getOne(postId);
      await pb.collection(Collections.POSTS).update(postId, {
        likesCount: (post.likesCount || 0) + increment,
      });
    } catch (error) {
      console.error("Error updating post like count:", error);
    }
  }

  /**
   * Update user like count (replaces Firebase Functions logic)
   */
  private static async updateUserLikeCount(
    postId: string,
    increment: number,
  ): Promise<void> {
    try {
      const post = await pb.collection(Collections.POSTS).getOne(postId);
      const user = await pb.collection(Collections.USERS).getOne(post.user);

      await pb.collection(Collections.USERS).update(post.user, {
        likesCount: (user.likesCount || 0) + increment,
      });
    } catch (error) {
      console.error("Error updating user like count:", error);
    }
  }

  /**
   * Add comment to post
   */
  static async addComment(
    postId: string,
    creator: string,
    comment: string,
  ): Promise<void> {
    try {
      await pb.collection(Collections.COMMENTS).create({
        post: postId,
        creator,
        comment,
      });

      // Update post comment count
      await this.updatePostCommentCount(postId, 1);
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  /**
   * Update post comment count (replaces Firebase Functions logic)
   */
  private static async updatePostCommentCount(
    postId: string,
    increment: number,
  ): Promise<void> {
    try {
      const post = await pb.collection(Collections.POSTS).getOne(postId);
      await pb.collection(Collections.POSTS).update(postId, {
        commentsCount: (post.commentsCount || 0) + increment,
      });
    } catch (error) {
      console.error("Error updating post comment count:", error);
    }
  }

  /**
   * Get comments for a post with real-time updates
   */
  static async getComments(postId: string): Promise<Comment[]> {
    try {
      const comments = await pb
        .collection(Collections.COMMENTS)
        .getList(1, 50, {
          filter: `post = "${postId}"`,
          sort: "-created",
          expand: "creator",
        });

      return comments.items as unknown as Comment[];
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }

  /**
   * Subscribe to comments for real-time updates
   */
  static subscribeToComments(
    postId: string,
    callback: (comments: Comment[]) => void,
  ): () => void {
    // Subscribe to comments collection changes
    const unsubscribe = pb
      .collection(Collections.COMMENTS)
      .subscribe("*", async (e) => {
        // Only process changes for the specific post
        if (e.record.post === postId) {
          const comments = await this.getComments(postId);
          callback(comments);
        }
      });

    // Initial load
    this.getComments(postId).then(callback);

    return () => {
      pb.collection(Collections.COMMENTS).unsubscribe("*");
    };
  }

  /**
   * Get posts by user ID
   */
  static async getPostsByUserId(userId: string): Promise<Post[]> {
    try {
      const posts = await pb.collection(Collections.POSTS).getList(1, 50, {
        filter: `creator = "${userId}"`,
        sort: "-created",
        expand: "creator",
      });

      return posts.items as unknown as Post[];
    } catch (error) {
      console.error("Failed to get user posts:", error);
      return [];
    }
  }

  /**
   * Subscribe to user posts for real-time updates
   */
  static subscribeToUserPosts(
    userId: string,
    callback: (posts: Post[]) => void,
  ): () => void {
    const unsubscribe = pb
      .collection(Collections.POSTS)
      .subscribe("*", async (e) => {
        if (e.record.user === userId) {
          const posts = await this.getPostsByUserId(userId);
          callback(posts);
        }
      });

    // Initial load
    this.getPostsByUserId(userId).then(callback);

    return () => {
      pb.collection(Collections.POSTS).unsubscribe("*");
    };
  }

  /**
   * Create a new post
   */
  static async createPost({
    description,
    mediaFiles,
  }: {
    description: string;
    mediaFiles: any[]; // React Native file objects or Blobs
  }): Promise<Post> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      console.log("Creating post with:", {
        description,
        mediaFilesCount: mediaFiles.length,
        userId: currentUser.id,
      });

      // First create the post without files
      const postData = {
        creator: currentUser.id,
        description: description,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      };

      const post = await pb.collection(Collections.POSTS).create(postData);
      console.log("Post created successfully:", post.id);

      // Then upload the files to the post
      if (mediaFiles.length > 0) {
        const formData = new FormData();

        mediaFiles.forEach((file, index) => {
          console.log(`Adding media file ${index}:`, file);

          // Handle React Native file objects (with uri, name, type)
          if (file.uri) {
            formData.append("media", {
              uri: file.uri,
              name: file.name,
              type: file.type,
            } as any);
          } else {
            // Handle regular blobs/files
            const fileName =
              index === 0
                ? `video_${Date.now()}.mp4`
                : `thumbnail_${Date.now()}.jpg`;
            formData.append("media", file, fileName);
          }
        });

        console.log("Uploading files to post:", post.id);
        const updatedPost = await pb
          .collection(Collections.POSTS)
          .update(post.id, formData);
        console.log("Files uploaded successfully");
        return updatedPost as unknown as Post;
      }

      return post as unknown as Post;
    } catch (error) {
      console.error("Error creating post:", error);
      if (error && typeof error === "object" && "response" in error) {
        console.error("Error response:", (error as any).response);
      }
      throw error;
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string): Promise<void> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      const post = await pb.collection(Collections.POSTS).getOne(postId);

      if (post.user !== currentUser.id) {
        throw new Error("User is not the creator of this post");
      }

      await pb.collection(Collections.POSTS).delete(postId);
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }
}

export default PostService;

// Export individual functions for backward compatibility
export const getFeed = PostService.getFeed;
export const getFollowingFeed = PostService.getFollowingFeed;
export const getLikeById = PostService.getLikeById;
export const updateLike = PostService.updateLike;
export const addComment = PostService.addComment;
export const getPostsByUserId = PostService.getPostsByUserId;
export const deletePost = PostService.deletePost;
