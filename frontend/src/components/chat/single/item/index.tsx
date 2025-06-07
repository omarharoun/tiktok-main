import React from "react";
import { View, Text, Image } from "react-native";
import { useUser } from "../../../../hooks/useUser";
import { generalStyles } from "../../../../styles";
import styles from "./styles";
import { pb } from "../../../../../pocketbaseConfig";
import { Message } from "../../../../../types";
import { Avatar } from "react-native-paper";

const ChatSingleItem = ({ item }: { item: Message }) => {
  const { data: userData, isLoading } = useUser(item.sender);

  if (isLoading) {
    return <></>;
  }

  const isCurrentUser =
    pb.authStore.model && item.sender === pb.authStore.model.id;

  return (
    <View
      style={isCurrentUser ? styles.containerCurrent : styles.containerOther}
    >
      {userData && userData.avatar ? (
        <Image
          style={generalStyles.avatarSmall}
          source={{ uri: userData.avatar }}
        />
      ) : (
        <Avatar.Icon size={32} icon={"account"} />
      )}
      <View
        style={
          isCurrentUser
            ? styles.containerTextCurrent
            : styles.containerTextOther
        }
      >
        <Text style={styles.text}>{item.content}</Text>
      </View>
    </View>
  );
};

export default ChatSingleItem;
