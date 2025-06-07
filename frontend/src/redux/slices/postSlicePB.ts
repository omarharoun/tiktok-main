import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Post } from "../../../types";
import PostService from "../../services/postsPB";
import MediaService from "../../services/mediaPB";
import VideoCompressionService from "../../services/videoCompression";

interface PostState {
  loading: boolean;
  error: string | null;
  currentUserPosts: Post[] | null;
  feed: Post[] | null;
  followingFeed: Post[] | null;
}

const initialState: PostState = {
  loading: false,
  error: null,
  currentUserPosts: null,
  feed: null,
  followingFeed: null,
};

export const createPost = createAsyncThunk(
  "post/create",
  async (
    {
      description,
      video,
      compressionPreset = "tiktok",
    }: {
      description: string;
      video: string;
      compressionPreset?: "lq" | "tiktok" | "reels" | "hq";
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("Redux createPost called with:", {
        description,
        video,
        compressionPreset,
      });

      // Validate inputs
      if (!video || video === "null" || video === "undefined") {
        throw new Error("Invalid video URI");
      }

      // Process video with FAANG-level compression
      console.log(`Processing video with ${compressionPreset} preset...`);
      const { videoFile, thumbnailFile } =
        await MediaService.processVideoForUpload(video, compressionPreset);

      console.log("Video processing completed, creating post...");
      const post = await PostService.createPost({
        description,
        mediaFiles: [videoFile, thumbnailFile],
      });

      console.log("Post created successfully:", post.id);
      return post;
    } catch (error) {
      console.error("Error creating post: ", error);
      return rejectWithValue(error);
    }
  },
);

export const createPostAdvanced = createAsyncThunk(
  "post/createAdvanced",
  async (
    {
      description,
      video,
      compressionPreset = "tiktok",
      enableThumbnailSelection = false,
      thumbnailCount = 3,
    }: {
      description: string;
      video: string;
      compressionPreset?: "lq" | "tiktok" | "reels" | "hq";
      enableThumbnailSelection?: boolean;
      thumbnailCount?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("Redux createPostAdvanced called with:", {
        description,
        video,
        compressionPreset,
        enableThumbnailSelection,
        thumbnailCount,
      });

      // Validate inputs
      if (!video || video === "null" || video === "undefined") {
        throw new Error("Invalid video URI");
      }

      if (enableThumbnailSelection) {
        // Generate multiple thumbnail options for user selection
        console.log(`Generating ${thumbnailCount} thumbnail options...`);
        const thumbnailOptions = await MediaService.generateThumbnailOptions(
          video,
          thumbnailCount,
        );

        // Return thumbnail options for user selection
        // The UI will handle the selection and call createPostWithSelectedThumbnail
        return {
          type: "thumbnail_selection",
          thumbnailOptions,
          videoUri: video,
          description,
          compressionPreset,
        };
      } else {
        // Process video with compression and auto-generated thumbnail
        console.log(`Processing video with ${compressionPreset} preset...`);
        const { videoFile, thumbnailFile } =
          await MediaService.processVideoForUpload(video, compressionPreset);

        console.log("Video processing completed, creating post...");
        const post = await PostService.createPost({
          description,
          mediaFiles: [videoFile, thumbnailFile],
        });

        console.log("Post created successfully:", post.id);
        return { type: "post_created", post };
      }
    } catch (error) {
      console.error("Error in createPostAdvanced: ", error);
      return rejectWithValue(error);
    }
  },
);

export const createPostWithSelectedThumbnail = createAsyncThunk(
  "post/createWithSelectedThumbnail",
  async (
    {
      description,
      video,
      selectedThumbnailUri,
      compressionPreset = "tiktok",
    }: {
      description: string;
      video: string;
      selectedThumbnailUri: string;
      compressionPreset?: "lq" | "tiktok" | "reels" | "hq";
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("Creating post with selected thumbnail:", {
        description,
        video,
        selectedThumbnailUri,
        compressionPreset,
      });

      // Process video with compression
      console.log(`Compressing video with ${compressionPreset} preset...`);
      const compressedVideoUri = await VideoCompressionService.compressVideo(
        video,
        compressionPreset,
      );

      // Create file objects
      const videoFile = MediaService.createFileFromUri(
        compressedVideoUri,
        `video_${Date.now()}.mp4`,
        "video/mp4",
      );

      const thumbnailFile = MediaService.createFileFromUri(
        selectedThumbnailUri,
        `thumbnail_${Date.now()}.jpg`,
        "image/jpeg",
      );

      console.log("Creating post with selected thumbnail...");
      const post = await PostService.createPost({
        description,
        mediaFiles: [videoFile, thumbnailFile],
      });

      console.log(
        "Post created successfully with selected thumbnail:",
        post.id,
      );
      return post;
    } catch (error) {
      console.error("Error creating post with selected thumbnail: ", error);
      return rejectWithValue(error);
    }
  },
);

export const getPostsByUser = createAsyncThunk(
  "post/getPostsByUser",
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      const posts = await PostService.getPostsByUserId(userId);

      // Update state
      dispatch({ type: "CURRENT_USER_POSTS_UPDATE", payload: posts });

      return posts;
    } catch (error) {
      console.error("Failed to get posts: ", error);
      return rejectWithValue(error);
    }
  },
);

export const getFeed = createAsyncThunk(
  "post/getFeed",
  async (_, { rejectWithValue }) => {
    try {
      const posts = await PostService.getFeed();
      return posts;
    } catch (error) {
      console.error("Failed to get feed: ", error);
      return rejectWithValue(error);
    }
  },
);

export const getFollowingFeed = createAsyncThunk(
  "post/getFollowingFeed",
  async (_, { rejectWithValue }) => {
    try {
      const posts = await PostService.getFollowingFeed();
      return posts;
    } catch (error) {
      console.error("Failed to get following feed: ", error);
      return rejectWithValue(error);
    }
  },
);

export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (postId: string, { rejectWithValue }) => {
    try {
      await PostService.deletePost(postId);
      return postId;
    } catch (error) {
      console.error("Failed to delete post: ", error);
      return rejectWithValue(error);
    }
  },
);

export const likePost = createAsyncThunk(
  "post/likePost",
  async (
    {
      postId,
      userId,
      currentLikeState,
    }: {
      postId: string;
      userId: string;
      currentLikeState: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      await PostService.updateLike(postId, userId, currentLikeState);
      return { postId, liked: !currentLikeState };
    } catch (error) {
      console.error("Failed to update like: ", error);
      return rejectWithValue(error);
    }
  },
);

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    // Add synchronous reducers here if needed
    clearError: (state) => {
      state.error = null;
    },
    updatePost: (state, action: PayloadAction<Post>) => {
      const updatedPost = action.payload;

      // Update in current user posts
      if (state.currentUserPosts) {
        const index = state.currentUserPosts.findIndex(
          (p) => p.id === updatedPost.id,
        );
        if (index !== -1) {
          state.currentUserPosts[index] = updatedPost;
        }
      }

      // Update in feed
      if (state.feed) {
        const index = state.feed.findIndex((p) => p.id === updatedPost.id);
        if (index !== -1) {
          state.feed[index] = updatedPost;
        }
      }

      // Update in following feed
      if (state.followingFeed) {
        const index = state.followingFeed.findIndex(
          (p) => p.id === updatedPost.id,
        );
        if (index !== -1) {
          state.followingFeed[index] = updatedPost;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create post
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Add new post to current user posts if exists
        if (state.currentUserPosts) {
          state.currentUserPosts.unshift(action.payload);
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create post";
      })
      // Create advanced post
      .addCase(createPostAdvanced.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPostAdvanced.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.type === "post_created" && action.payload.post) {
          // Add new post to current user posts if exists
          if (state.currentUserPosts) {
            state.currentUserPosts.unshift(action.payload.post);
          }
        }
      })
      .addCase(createPostAdvanced.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create post";
      })
      // Create post with selected thumbnail
      .addCase(createPostWithSelectedThumbnail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPostWithSelectedThumbnail.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Add new post to current user posts if exists
        if (state.currentUserPosts) {
          state.currentUserPosts.unshift(action.payload);
        }
      })
      .addCase(createPostWithSelectedThumbnail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message ||
          "Failed to create post with selected thumbnail";
      })
      // Get posts by user
      .addCase(getPostsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPostsByUser.fulfilled,
        (state, action: PayloadAction<Post[]>) => {
          state.loading = false;
          state.currentUserPosts = action.payload;
        },
      )
      .addCase(getPostsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to get user posts";
      })
      // Get feed
      .addCase(getFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeed.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.loading = false;
        state.feed = action.payload;
      })
      .addCase(getFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to get feed";
      })
      // Get following feed
      .addCase(getFollowingFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getFollowingFeed.fulfilled,
        (state, action: PayloadAction<Post[]>) => {
          state.loading = false;
          state.followingFeed = action.payload;
        },
      )
      .addCase(getFollowingFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to get following feed";
      })
      // Delete post
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<string>) => {
        const postId = action.payload;

        // Remove from current user posts
        if (state.currentUserPosts) {
          state.currentUserPosts = state.currentUserPosts.filter(
            (p) => p.id !== postId,
          );
        }

        // Remove from feed
        if (state.feed) {
          state.feed = state.feed.filter((p) => p.id !== postId);
        }

        // Remove from following feed
        if (state.followingFeed) {
          state.followingFeed = state.followingFeed.filter(
            (p) => p.id !== postId,
          );
        }
      })
      // Like post
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, liked } = action.payload;
        const increment = liked ? 1 : -1;

        // Update like count in all relevant arrays
        [state.currentUserPosts, state.feed, state.followingFeed].forEach(
          (posts) => {
            if (posts) {
              const post = posts.find((p) => p.id === postId);
              if (post) {
                post.likesCount = Math.max(0, post.likesCount + increment);
              }
            }
          },
        );
      });
  },
});

export const { clearError, updatePost } = postSlice.actions;
export default postSlice.reducer;
