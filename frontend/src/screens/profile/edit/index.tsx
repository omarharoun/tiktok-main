import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import NavBarGeneral from "../../../components/general/navbar";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { UserService } from "../../../services/userPB";
import { MediaService } from "../../../services/mediaPB";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { RootState } from "../../../redux/store";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";

export default function EditProfileScreen() {
  const auth = useSelector((state: RootState) => state.auth);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const blob = await MediaService.uriToBlob(result.assets[0].uri);
      await UserService.saveUserProfileImage(blob);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBarGeneral title="Edit Profile" />
      <View style={styles.imageContainer}>
        <TouchableOpacity
          style={styles.imageViewContainer}
          onPress={() => chooseImage()}
        >
          {auth.currentUser && (
            <Image
              style={styles.image}
              source={{ uri: auth.currentUser.avatar }}
            />
          )}
          <View style={styles.imageOverlay} />
          <Feather name="camera" size={26} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldsContainer}>
        <TouchableOpacity
          style={styles.fieldItemContainer}
          onPress={() =>
            navigation.navigate("editProfileField", {
              title: "Display Name",
              field: "displayName",
              value:
                auth.currentUser && auth.currentUser.displayName
                  ? auth.currentUser.displayName
                  : "",
            })
          }
        >
          <Text>Display Name</Text>
          <View style={styles.fieldValueContainer}>
            <Text>{auth.currentUser ? auth.currentUser.displayName : ""}</Text>
            <Feather name="chevron-right" size={20} color="gray" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
