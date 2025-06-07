import React, { useState, useEffect } from "react";
import { Image, TouchableOpacity, View, Text } from "react-native";
import styles from "./styles";
import { Post } from "../../../../../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { useDispatch } from "react-redux";
import { PostService } from "../../../../services/postsPB"; // Import the PocketBase PostService
import { pb } from "../../../../../pocketbaseConfig"; // Import PocketBase client
import { MediaService } from "../../../../services/mediaPB";

export default function ProfilePostListItem({ item }: { item: Post | null }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const dispatch = useDispatch();

  // Generate thumbnail URL
  const thumbnailUrl =
    item?.media && item.media[1]
      ? MediaService.getFileUrl(item, item.media[1])
      : "";

  useEffect(() => {
    const currentUser = pb.authStore.model;
    if (currentUser && item && item.creator === currentUser.id) {
      setIsOwner(true);
    }
  }, [item]);

  const handleLongPress = () => {
    if (isOwner) {
      setShowDeleteButton(true);
    }
  };

  const handleDelete = async () => {
    if (item) {
      await PostService.deletePost(item.id); // Call the PocketBase PostService deletePost function
      setShowDeleteButton(false);
      // Optionally, you can dispatch an action to update the state
      // dispatch({ type: "DELETE_POST", payload: item.id });
    }
  };

  return (
    item && (
      <TouchableOpacity
        style={styles.container}
        onPress={() =>
          navigation.navigate("userPosts", {
            creator: item.creator,
            profile: true,
          })
        }
        onLongPress={handleLongPress}
      >
        <Image style={styles.image} source={{ uri: thumbnailUrl }} />
        {showDeleteButton && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  );
}
