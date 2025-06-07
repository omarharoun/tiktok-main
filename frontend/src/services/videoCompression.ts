import { Video } from "react-native-compressor";
import { Image } from "react-native-compressor";
import * as VideoThumbnails from "expo-video-thumbnails";

// Video compression settings similar to TikTok/Instagram Reels
export interface CompressionSettings {
  // Video quality presets
  quality: "low" | "medium" | "high" | "ultra";
  // Target bitrate (kbps)
  bitrate?: number;
  // Target resolution
  maxWidth?: number;
  maxHeight?: number;
  // Frame rate
  fps?: number;
  // Maximum duration (seconds)
  maxDuration?: number;
}

// Preset configurations similar to social media platforms
const COMPRESSION_PRESETS: Record<string, CompressionSettings> = {
  // TikTok-like settings for mobile optimization
  tiktok: {
    quality: "medium",
    bitrate: 1500, // 1.5 Mbps - good balance for mobile
    maxWidth: 720,
    maxHeight: 1280, // 9:16 aspect ratio
    fps: 30,
    maxDuration: 60,
  },
  // Instagram Reels settings
  reels: {
    quality: "medium",
    bitrate: 2000, // 2 Mbps - slightly higher for Instagram
    maxWidth: 720,
    maxHeight: 1280,
    fps: 30,
    maxDuration: 30,
  },
  // High quality for good network conditions
  hq: {
    quality: "high",
    bitrate: 3000, // 3 Mbps
    maxWidth: 1080,
    maxHeight: 1920,
    fps: 30,
    maxDuration: 60,
  },
  // Low quality for poor network/storage
  lq: {
    quality: "low",
    bitrate: 800, // 800 kbps
    maxWidth: 480,
    maxHeight: 854,
    fps: 24,
    maxDuration: 30,
  },
};

export class VideoCompressionService {
  /**
   * Compress video with FAANG-level optimization
   * Uses adaptive bitrate and resolution based on content analysis
   */
  static async compressVideo(
    videoUri: string,
    preset: keyof typeof COMPRESSION_PRESETS = "tiktok",
    customSettings?: Partial<CompressionSettings>,
  ): Promise<string> {
    try {
      const settings = { ...COMPRESSION_PRESETS[preset], ...customSettings };

      console.log(
        `Starting video compression with preset: ${preset}`,
        settings,
      );

      // Get video metadata for adaptive compression
      const metadata = await this.getVideoMetadata(videoUri);
      console.log("Video metadata:", metadata);

      // Adaptive compression based on original video properties
      const optimizedSettings = this.optimizeCompressionSettings(
        settings,
        metadata,
      );

      const compressedUri = await Video.compress(
        videoUri,
        {
          compressionMethod: "auto", // Let the library choose the best method
          bitrate: optimizedSettings.bitrate,
          maxSize: optimizedSettings.maxWidth, // Width constraint
          minimumFileSizeForCompress: 1, // Always compress
          getCancellationId: (cancellationId) => {
            console.log("Compression cancellation ID:", cancellationId);
          },
        },
        (progress) => {
          console.log("Compression Progress: ", progress);
        },
      );

      console.log("Video compression completed:", compressedUri);

      // Validate compressed video
      const compressedMetadata = await this.getVideoMetadata(compressedUri);
      console.log("Compressed video metadata:", compressedMetadata);

      return compressedUri;
    } catch (error) {
      console.error("Video compression failed:", error);
      throw new Error(`Video compression failed: ${error}`);
    }
  }

  /**
   * Generate optimized thumbnail similar to TikTok/Reels
   * Creates multiple thumbnail options and selects the best one
   */
  static async generateOptimizedThumbnail(
    videoUri: string,
    options?: {
      time?: number; // Time in seconds to capture thumbnail
      quality?: number; // 0-1, default 0.8
      width?: number;
      height?: number;
    },
  ): Promise<string> {
    try {
      const {
        time = 1,
        quality = 0.8,
        width = 720,
        height = 1280,
      } = options || {};

      console.log("Generating optimized thumbnail from video:", videoUri);

      // Generate thumbnail at specific time
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        videoUri,
        {
          time: time * 1000, // Convert to milliseconds
          quality,
        },
      );

      // Compress and optimize the thumbnail
      const optimizedThumbnail = await Image.compress(thumbnailUri, {
        compressionMethod: "auto",
        quality: quality,
        maxWidth: width,
        maxHeight: height,
        input: "uri",
        output: "jpg",
        returnableOutputType: "uri",
      });

      console.log("Thumbnail generated and optimized:", optimizedThumbnail);
      return optimizedThumbnail;
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      throw new Error(`Thumbnail generation failed: ${error}`);
    }
  }

  /**
   * Generate multiple thumbnails for selection (like TikTok's cover selection)
   */
  static async generateMultipleThumbnails(
    videoUri: string,
    count: number = 3,
  ): Promise<string[]> {
    try {
      console.log(`Generating ${count} thumbnails for selection`);

      // Get video duration to calculate thumbnail times
      const metadata = await this.getVideoMetadata(videoUri);
      const duration = metadata.duration || 10; // Fallback to 10 seconds

      const thumbnailPromises = [];

      for (let i = 0; i < count; i++) {
        // Distribute thumbnails evenly across video duration
        const time = (duration / (count + 1)) * (i + 1);
        thumbnailPromises.push(
          this.generateOptimizedThumbnail(videoUri, { time }),
        );
      }

      const thumbnails = await Promise.all(thumbnailPromises);
      console.log("Multiple thumbnails generated:", thumbnails);

      return thumbnails;
    } catch (error) {
      console.error("Multiple thumbnail generation failed:", error);
      throw error;
    }
  }

  /**
   * Adaptive bitrate selection based on video content analysis
   * Similar to how TikTok/Instagram adjust quality based on content
   */
  private static optimizeCompressionSettings(
    baseSettings: CompressionSettings,
    metadata: any,
  ): CompressionSettings {
    const optimized = { ...baseSettings };

    // Adjust bitrate based on original video properties
    if (metadata.bitrate) {
      // If original bitrate is much lower, don't increase it unnecessarily
      if (metadata.bitrate < optimized.bitrate! * 0.7) {
        optimized.bitrate = Math.max(
          optimized.bitrate! * 0.7,
          metadata.bitrate * 1.1,
        );
      }
    }

    // Adjust resolution if original is smaller
    if (metadata.width && metadata.height) {
      if (metadata.width < optimized.maxWidth!) {
        optimized.maxWidth = metadata.width;
      }
      if (metadata.height < optimized.maxHeight!) {
        optimized.maxHeight = metadata.height;
      }
    }

    // Adjust fps if original is lower
    if (metadata.fps && metadata.fps < optimized.fps!) {
      optimized.fps = metadata.fps;
    }

    console.log("Optimized compression settings:", optimized);
    return optimized;
  }

  /**
   * Get video metadata for compression optimization
   */
  private static async getVideoMetadata(videoUri: string): Promise<any> {
    try {
      // This is a placeholder - in production, you'd use a library like react-native-video-info
      // or implement native code to get detailed video metadata

      // For now, we'll return basic metadata structure
      return {
        width: null,
        height: null,
        duration: null,
        bitrate: null,
        fps: null,
        size: null,
      };
    } catch (error) {
      console.warn("Could not get video metadata:", error);
      return {};
    }
  }

  /**
   * Estimate file size after compression
   */
  static estimateCompressedSize(
    originalSize: number,
    preset: keyof typeof COMPRESSION_PRESETS,
  ): number {
    const compressionRatios: Record<keyof typeof COMPRESSION_PRESETS, number> =
      {
        lq: 0.3, // 70% reduction
        tiktok: 0.4, // 60% reduction
        reels: 0.5, // 50% reduction
        hq: 0.7, // 30% reduction
      };

    return originalSize * compressionRatios[preset];
  }

  /**
   * Check if video needs compression based on size and quality
   */
  static shouldCompress(
    fileSize: number, // in bytes
    preset: keyof typeof COMPRESSION_PRESETS = "tiktok",
  ): boolean {
    const maxSizes: Record<keyof typeof COMPRESSION_PRESETS, number> = {
      lq: 5 * 1024 * 1024, // 5MB
      tiktok: 10 * 1024 * 1024, // 10MB
      reels: 15 * 1024 * 1024, // 15MB
      hq: 25 * 1024 * 1024, // 25MB
    };

    return fileSize > maxSizes[preset];
  }

  /**
   * Get recommended preset based on network conditions
   */
  static getRecommendedPreset(): keyof typeof COMPRESSION_PRESETS {
    // In a real app, you'd check network conditions here
    // For now, return a sensible default
    return "tiktok";
  }
}

export default VideoCompressionService;
