import React, { useState, useEffect } from "react";
import { Image, TouchableOpacity, View, Text } from "react-native";
import styles from "./styles";
import { Post } from "../../../../../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { useDispatch } from "react-redux";
import { deletePost } from "../../../../services/posts"; // Import the deletePost function
import { FIREBASE_AUTH } from "../../../../../firebaseConfig"; // Import Firebase Auth

export default function ProfilePostListItem({ item }: { item: Post | null }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (currentUser && item && item.creator === currentUser.uid) {
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
      await deletePost(item.id); // Call the deletePost function
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
        <Image style={styles.image} source={{ uri: item.media[1] }} />
        {showDeleteButton && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  );
}