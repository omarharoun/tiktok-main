import { pb, Collections } from "../../pocketbaseConfig";
import VideoCompressionService from "./videoCompression";

export class MediaService {
  /**
   * Convert URI to Blob (for React Native file handling)
   */
  static async uriToBlob(uri: string): Promise<Blob> {
    try {
      console.log("Converting URI to blob:", uri);

      if (!uri || uri === "null" || uri === "undefined") {
        throw new Error("Invalid URI provided");
      }

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      console.log("Blob created successfully:", {
        size: blob.size,
        type: blob.type,
      });

      return blob;
    } catch (error) {
      console.error("uriToBlob failed:", error);
      throw error;
    }
  }

  /**
   * Create a proper file object for React Native uploads
   */
  static createFileFromUri(uri: string, name: string, type: string): any {
    return {
      uri: uri,
      name: name,
      type: type,
    };
  }

  /**
   * Process and compress video for upload with FAANG-level optimization
   */
  static async processVideoForUpload(
    videoUri: string,
    compressionPreset: "lq" | "tiktok" | "reels" | "hq" = "tiktok",
  ): Promise<{ videoFile: any; thumbnailFile: any }> {
    try {
      console.log("Processing video for upload with compression...");

      // Step 1: Compress the video
      const compressedVideoUri = await VideoCompressionService.compressVideo(
        videoUri,
        compressionPreset,
      );

      // Step 2: Generate optimized thumbnail
      const thumbnailUri =
        await VideoCompressionService.generateOptimizedThumbnail(
          compressedVideoUri,
          {
            time: 1, // Capture at 1 second
            quality: 0.8,
            width: 720,
            height: 1280,
          },
        );

      // Step 3: Create file objects
      const videoFile = this.createFileFromUri(
        compressedVideoUri,
        `video_${Date.now()}.mp4`,
        "video/mp4",
      );

      const thumbnailFile = this.createFileFromUri(
        thumbnailUri,
        `thumbnail_${Date.now()}.jpg`,
        "image/jpeg",
      );

      console.log("Video processing completed successfully");

      return { videoFile, thumbnailFile };
    } catch (error) {
      console.error("Video processing failed:", error);
      throw new Error(`Video processing failed: ${error}`);
    }
  }

  /**
   * Generate multiple thumbnail options for user selection
   */
  static async generateThumbnailOptions(
    videoUri: string,
    count: number = 3,
  ): Promise<any[]> {
    try {
      const thumbnailUris =
        await VideoCompressionService.generateMultipleThumbnails(
          videoUri,
          count,
        );

      return thumbnailUris.map((uri, index) =>
        this.createFileFromUri(
          uri,
          `thumbnail_option_${index}_${Date.now()}.jpg`,
          "image/jpeg",
        ),
      );
    } catch (error) {
      console.error("Thumbnail options generation failed:", error);
      throw error;
    }
  }

  /**
   * Get file URL from PocketBase
   */
  static getFileUrl(record: any, filename: string, thumb?: string): string {
    if (thumb) {
      return pb.files.getURL(record, filename, { thumb });
    } else {
      return pb.files.getURL(record, filename);
    }
  }

  /**
   * Upload media file to a record
   * This replaces Firebase Storage functionality
   */
  static async uploadMedia(
    collection: string,
    recordId: string,
    field: string,
    file: File | Blob,
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append(field, file);

      const record = await pb.collection(collection).update(recordId, formData);
      const filename = record[field];

      // Return the file URL
      return this.getFileUrl(record, filename);
    } catch (error) {
      console.error("Media upload failed:", error);
      throw error;
    }
  }

  /**
   * Process video/image for posts (replaces Firebase Storage logic)
   */
  static async processPostMedia(
    videoFile: File | Blob,
    thumbnailFile?: File | Blob,
  ): Promise<{ video: File | Blob; thumbnail: File | Blob }> {
    // In PocketBase, we can store both video and thumbnail in the same media field
    // or handle them separately. For now, return as-is.

    if (!thumbnailFile) {
      // Generate thumbnail from video if needed
      // This is a simplified approach - in production, you might want to
      // generate thumbnails on the server side or use a more sophisticated approach
      thumbnailFile = videoFile; // Placeholder
    }

    return {
      video: videoFile,
      thumbnail: thumbnailFile,
    };
  }

  /**
   * Delete media file from a record
   */
  static async deleteMedia(
    collection: string,
    recordId: string,
    field: string,
  ): Promise<void> {
    try {
      const updateData: Record<string, any> = {};
      updateData[field] = null;

      await pb.collection(collection).update(recordId, updateData);
    } catch (error) {
      console.error("Media deletion failed:", error);
      throw error;
    }
  }

  /**
   * Get optimized image URL with thumbnail
   */
  static getOptimizedImageUrl(
    record: any,
    filename: string,
    size?: string,
  ): string {
    return this.getFileUrl(record, filename, size);
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    file: File | Blob,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
    } = {},
  ): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options; // Default 10MB

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
      };
    }

    if (
      allowedTypes.length > 0 &&
      file.type &&
      !allowedTypes.includes(file.type)
    ) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { valid: true };
  }
}

export default MediaService;

// Export individual functions for backward compatibility
export const uriToBlob = MediaService.uriToBlob;
export const getFileUrl = MediaService.getFileUrl;
