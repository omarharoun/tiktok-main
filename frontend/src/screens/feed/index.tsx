import {
  FlatList,
  View,
  Dimensions,
  ViewToken,
  RefreshControl,
  TouchableOpacity,
  Text,
} from "react-native";
import styles from "./styles";
import PostSingle, { PostSingleHandles } from "../../components/general/post";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { CurrentUserProfileItemInViewContext } from "../../contexts/UserProfileContext";
import { FeedStackParamList } from "../../types/navigation";
import useMaterialNavBarHeight from "../../hooks/useMaterialNavBarHeight";
import { usePosts } from "../../hooks/usePosts";
import { Post } from "../../../types";

type FeedScreenRouteProp =
  | RouteProp<RootStackParamList, "userPosts">
  | RouteProp<HomeStackParamList, "feed">
  | RouteProp<FeedStackParamList, "feedList">;

interface PostViewToken extends ViewToken {
  item: Post;
}

export default function FeedScreen({ route }: { route: FeedScreenRouteProp }) {
  const { setCurrentUserProfileItemInView } = useContext(
    CurrentUserProfileItemInViewContext,
  );

  const { creator, profile } = route.params as {
    creator: string;
    profile: boolean;
  };

  const [selectedFeed, setSelectedFeed] = useState<"ForYou" | "Following">(
    "ForYou",
  );
  const mediaRefs = useRef<Record<string, PostSingleHandles | null>>({});

  const {
    data: posts = [],
    refetch,
    isFetching,
  } = usePosts(profile, creator, selectedFeed);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const onViewableItemsChanged = useRef(
    ({ changed }: { changed: PostViewToken[] }) => {
      changed.forEach((element) => {
        const cell = mediaRefs.current[element.key];
        if (cell) {
          if (element.isViewable) {
            if (!profile && setCurrentUserProfileItemInView) {
              setCurrentUserProfileItemInView(element.item.creator);
            }
            cell.play();
          } else {
            cell.stop();
          }
        }
      });
    },
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        Object.values(mediaRefs.current).forEach((ref) => ref?.stop());
      };
    }, []),
  );

  const feedItemHeight =
    Dimensions.get("window").height - useMaterialNavBarHeight(profile);

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <View
        style={{
          height: feedItemHeight,
          backgroundColor: "black",
        }}
      >
        <PostSingle
          item={item}
          ref={(PostSingleRef) => (mediaRefs.current[item.id] = PostSingleRef)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedFeed === "ForYou" && styles.selectedButton,
          ]}
          onPress={() => setSelectedFeed("ForYou")}
        >
          <Text style={styles.toggleButtonText}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedFeed === "Following" && styles.selectedButton,
          ]}
          onPress={() => setSelectedFeed("Following")}
        >
          <Text style={styles.toggleButtonText}>Following</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        windowSize={4}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        viewabilityConfig={{
          itemVisiblePercentThreshold: 70, // Ensures video only plays when mostly in view
        }}
        renderItem={renderItem}
        pagingEnabled
        keyExtractor={(item) => item.id}
        decelerationRate={"fast"}
        onViewableItemsChanged={onViewableItemsChanged.current}
        snapToInterval={feedItemHeight}
        snapToAlignment="start"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
