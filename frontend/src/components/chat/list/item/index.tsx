import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useUser } from "../../../../hooks/useUser";
import styles from "./styles";
import { useNavigation } from "@react-navigation/native";
import { pb } from "../../../../../pocketbaseConfig";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { Chat } from "../../../../../types";
import { Avatar } from "react-native-paper";

const ChatListItem = ({ chat }: { chat: Chat }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: userData } = useUser(
    pb.authStore.model && chat.participants[0] === pb.authStore.model.id
      ? chat.participants[1]
      : chat.participants[0],
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate("chatSingle", { chatId: chat.id })}
    >
      {userData && userData.avatar ? (
        <Image style={styles.image} source={{ uri: userData.avatar }} />
      ) : (
        <Avatar.Icon size={60} icon={"account"} />
      )}
      <View style={{ flex: 1 }}>
        {userData && (
          <Text style={styles.userDisplayName}>
            {userData.displayName || userData.email}
          </Text>
        )}
        <Text style={styles.lastMessage}>Last activity</Text>
      </View>
      <Text>
        {chat.lastActivity
          ? new Date(chat.lastActivity).toLocaleDateString()
          : "Now"}
      </Text>
    </TouchableOpacity>
  );
};

export default ChatListItem;
