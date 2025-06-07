import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  createPost,
  createPostAdvanced,
  createPostWithSelectedThumbnail,
} from "../redux/slices/postSlicePB";
import { useState, useCallback } from "react";

export interface ThumbnailOption {
  uri: string;
  index: number;
}

export interface VideoUploadProgress {
  stage: "compression" | "thumbnail_generation" | "upload" | "complete";
  progress: number;
  message: string;
}

export interface UseVideoUploadOptions {
  compressionPreset?: "lq" | "tiktok" | "reels" | "hq";
  enableThumbnailSelection?: boolean;
  thumbnailCount?: number;
  onProgress?: (progress: VideoUploadProgress) => void;
}

/**
 * Hook for uploading videos with FAANG-level compression and TikTok-like features
 *
 * Features:
 * - Automatic video compression with multiple quality presets
 * - Smart thumbnail generation and selection (like TikTok's cover selection)
 * - Progress tracking throughout the upload process
 * - Network-adaptive compression settings
 * - Error handling and retry logic
 */
export const useVideoUpload = (options: UseVideoUploadOptions = {}) => {
  const dispatch = useAppDispatch();
  const postState = useAppSelector((state) => state.post);

  const [thumbnailOptions, setThumbnailOptions] = useState<ThumbnailOption[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<VideoUploadProgress | null>(null);

  const {
    compressionPreset = "tiktok",
    enableThumbnailSelection = false,
    thumbnailCount = 3,
    onProgress,
  } = options;

  /**
   * Upload video with automatic compression and thumbnail generation
   */
  const uploadVideo = useCallback(
    async (videoUri: string, description: string) => {
      try {
        setIsProcessing(true);

        const progress = (
          stage: VideoUploadProgress["stage"],
          progress: number,
          message: string,
        ) => {
          const progressData = { stage, progress, message };
          setUploadProgress(progressData);
          onProgress?.(progressData);
        };

        progress("compression", 0, "Starting video compression...");

        if (enableThumbnailSelection) {
          // Generate thumbnail options for user selection
          progress(
            "thumbnail_generation",
            20,
            "Generating thumbnail options...",
          );

          const result = await dispatch(
            createPostAdvanced({
              description,
              video: videoUri,
              compressionPreset,
              enableThumbnailSelection: true,
              thumbnailCount,
            }),
          ).unwrap();

          if (
            result.type === "thumbnail_selection" &&
            result.thumbnailOptions
          ) {
            // Convert to ThumbnailOption format
            const options = result.thumbnailOptions.map(
              (option: any, index: number) => ({
                uri: option.uri || option,
                index,
              }),
            );

            setThumbnailOptions(options);
            progress(
              "thumbnail_generation",
              100,
              "Thumbnail options ready for selection",
            );

            return {
              success: true,
              requiresThumbnailSelection: true,
              thumbnailOptions: options,
              videoUri,
              description,
            };
          }
        } else {
          // Direct upload with auto-generated thumbnail
          progress("compression", 50, "Compressing video...");
          progress("thumbnail_generation", 75, "Generating thumbnail...");
          progress("upload", 90, "Uploading to server...");

          const result = await dispatch(
            createPost({
              description,
              video: videoUri,
              compressionPreset,
            }),
          ).unwrap();

          progress("complete", 100, "Upload completed successfully!");

          return {
            success: true,
            requiresThumbnailSelection: false,
            post: result,
          };
        }
      } catch (error) {
        console.error("Video upload failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [
      dispatch,
      compressionPreset,
      enableThumbnailSelection,
      thumbnailCount,
      onProgress,
    ],
  );

  /**
   * Complete upload with selected thumbnail
   */
  const uploadWithSelectedThumbnail = useCallback(
    async (
      videoUri: string,
      description: string,
      selectedThumbnailUri: string,
    ) => {
      try {
        setIsProcessing(true);

        const progress = (
          stage: VideoUploadProgress["stage"],
          progress: number,
          message: string,
        ) => {
          const progressData = { stage, progress, message };
          setUploadProgress(progressData);
          onProgress?.(progressData);
        };

        progress("compression", 25, "Compressing video...");
        progress("upload", 75, "Uploading with selected thumbnail...");

        const result = await dispatch(
          createPostWithSelectedThumbnail({
            description,
            video: videoUri,
            selectedThumbnailUri,
            compressionPreset,
          }),
        ).unwrap();

        progress("complete", 100, "Upload completed successfully!");

        setThumbnailOptions([]);

        return {
          success: true,
          post: result,
        };
      } catch (error) {
        console.error("Video upload with selected thumbnail failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, compressionPreset, onProgress],
  );

  /**
   * Cancel thumbnail selection and go back to simple upload
   */
  const skipThumbnailSelection = useCallback(
    async (videoUri: string, description: string) => {
      setThumbnailOptions([]);
      return uploadVideo(videoUri, description);
    },
    [uploadVideo],
  );

  return {
    // State
    isProcessing,
    uploadProgress,
    thumbnailOptions,
    isUploading: postState.loading,
    uploadError: postState.error,

    // Actions
    uploadVideo,
    uploadWithSelectedThumbnail,
    skipThumbnailSelection,

    // Utilities
    clearThumbnailOptions: () => setThumbnailOptions([]),
    resetProgress: () => setUploadProgress(null),
  };
};

export default useVideoUpload;
