import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  useVideoUpload,
  ThumbnailOption,
  VideoUploadProgress,
} from "../../hooks/useVideoUpload";

interface VideoCompressionDemoProps {
  onClose: () => void;
}

/**
 * Demo component showcasing FAANG-level video compression and TikTok-like features
 *
 * Features demonstrated:
 * - Video selection from gallery
 * - Multiple compression quality presets (TikTok, Instagram Reels, etc.)
 * - Thumbnail selection (like TikTok's cover selection)
 * - Real-time upload progress tracking
 * - Error handling and retry logic
 */
export const VideoCompressionDemo: React.FC<VideoCompressionDemoProps> = ({
  onClose,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [compressionPreset, setCompressionPreset] = useState<
    "lq" | "tiktok" | "reels" | "hq"
  >("tiktok");
  const [enableThumbnailSelection, setEnableThumbnailSelection] =
    useState(true);

  const {
    uploadVideo,
    uploadWithSelectedThumbnail,
    skipThumbnailSelection,
    isProcessing,
    uploadProgress,
    thumbnailOptions,
    isUploading,
    uploadError,
    clearThumbnailOptions,
    resetProgress,
  } = useVideoUpload({
    compressionPreset,
    enableThumbnailSelection,
    thumbnailCount: 3,
    onProgress: (progress: VideoUploadProgress) => {
      console.log(
        `Upload Progress: ${progress.stage} - ${progress.progress}% - ${progress.message}`,
      );
    },
  });

  const selectVideo = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max like TikTok
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0].uri);
        resetProgress();
        clearThumbnailOptions();
      }
    } catch (error) {
      console.error("Error selecting video:", error);
      Alert.alert("Error", "Failed to select video");
    }
  };

  const handleUpload = async () => {
    if (!selectedVideo) {
      Alert.alert("Error", "Please select a video first");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    const result = await uploadVideo(selectedVideo, description);

    if (result?.success) {
      if (result.requiresThumbnailSelection) {
        // Thumbnail selection UI will be shown
        Alert.alert("Success", "Video processed! Please select a thumbnail.");
      } else {
        Alert.alert("Success", "Video uploaded successfully!");
        onClose();
      }
    } else {
      Alert.alert("Error", result?.error || "Upload failed");
    }
  };

  const handleThumbnailSelection = async (thumbnailOption: ThumbnailOption) => {
    if (!selectedVideo) return;

    const result = await uploadWithSelectedThumbnail(
      selectedVideo,
      description,
      thumbnailOption.uri,
    );

    if (result?.success) {
      Alert.alert("Success", "Video uploaded with selected thumbnail!");
      onClose();
    } else {
      Alert.alert("Error", result?.error || "Upload failed");
    }
  };

  const handleSkipThumbnailSelection = async () => {
    if (!selectedVideo) return;

    const result = await skipThumbnailSelection(selectedVideo, description);

    if (result?.success) {
      Alert.alert("Success", "Video uploaded successfully!");
      onClose();
    } else {
      Alert.alert("Error", result?.error || "Upload failed");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          FAANG-Level Video Upload Demo
        </Text>

        {/* Video Selection */}
        <TouchableOpacity
          onPress={selectVideo}
          style={{
            backgroundColor: "#007AFF",
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
          >
            {selectedVideo ? "Change Video" : "Select Video"}
          </Text>
        </TouchableOpacity>

        {selectedVideo && (
          <Text style={{ marginBottom: 10, color: "green" }}>
            ✓ Video selected
          </Text>
        )}

        {/* Description Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Description:
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter video description..."
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 10,
              padding: 15,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Compression Preset Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Compression Quality:
          </Text>
          {(["lq", "tiktok", "reels", "hq"] as const).map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => setCompressionPreset(preset)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 10,
                backgroundColor:
                  compressionPreset === preset ? "#E3F2FD" : "transparent",
                borderRadius: 5,
                marginBottom: 5,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor:
                    compressionPreset === preset ? "#007AFF" : "#ccc",
                  backgroundColor:
                    compressionPreset === preset ? "#007AFF" : "transparent",
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 16 }}>
                {preset.toUpperCase()}
                {preset === "lq" && " (Low Quality - 800kbps)"}
                {preset === "tiktok" && " (TikTok Style - 1.5Mbps)"}
                {preset === "reels" && " (Instagram Reels - 2Mbps)"}
                {preset === "hq" && " (High Quality - 3Mbps)"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Thumbnail Selection Toggle */}
        <TouchableOpacity
          onPress={() => setEnableThumbnailSelection(!enableThumbnailSelection)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 15,
            backgroundColor: "#F5F5F5",
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: enableThumbnailSelection ? "#007AFF" : "#ccc",
              backgroundColor: enableThumbnailSelection
                ? "#007AFF"
                : "transparent",
              marginRight: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {enableThumbnailSelection && (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                ✓
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 16 }}>
            Enable Thumbnail Selection (TikTok-style)
          </Text>
        </TouchableOpacity>

        {/* Upload Progress */}
        {uploadProgress && (
          <View
            style={{
              marginBottom: 20,
              padding: 15,
              backgroundColor: "#F0F8FF",
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
              Upload Progress: {uploadProgress.progress}%
            </Text>
            <Text style={{ fontSize: 14, color: "#666" }}>
              {uploadProgress.stage}: {uploadProgress.message}
            </Text>
            <View
              style={{
                height: 4,
                backgroundColor: "#E0E0E0",
                borderRadius: 2,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  height: 4,
                  backgroundColor: "#007AFF",
                  borderRadius: 2,
                  width: `${uploadProgress.progress}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Error Display */}
        {uploadError && (
          <View
            style={{
              marginBottom: 20,
              padding: 15,
              backgroundColor: "#FFE6E6",
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "red", fontSize: 16 }}>
              Error: {uploadError}
            </Text>
          </View>
        )}

        {/* Thumbnail Selection */}
        {thumbnailOptions.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}
            >
              Select Thumbnail (TikTok Style):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {thumbnailOptions.map((option) => (
                <TouchableOpacity
                  key={option.index}
                  onPress={() => handleThumbnailSelection(option)}
                  style={{
                    marginRight: 15,
                    borderRadius: 10,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: "#007AFF",
                  }}
                >
                  <Image
                    source={{ uri: option.uri }}
                    style={{ width: 120, height: 160 }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      borderRadius: 15,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12 }}>
                      {option.index + 1}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSkipThumbnailSelection}
              style={{
                backgroundColor: "#FF6B6B",
                padding: 12,
                borderRadius: 8,
                marginTop: 15,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Skip Thumbnail Selection
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Button */}
        {thumbnailOptions.length === 0 && (
          <TouchableOpacity
            onPress={handleUpload}
            disabled={
              isProcessing ||
              isUploading ||
              !selectedVideo ||
              !description.trim()
            }
            style={{
              backgroundColor:
                isProcessing ||
                isUploading ||
                !selectedVideo ||
                !description.trim()
                  ? "#ccc"
                  : "#FF6B6B",
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {isProcessing || isUploading ? "Processing..." : "Upload Video"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: "#6B6B6B",
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
          >
            Close Demo
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default VideoCompressionDemo;
