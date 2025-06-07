import {
  FlatList,
  View,
  Dimensions,
  ViewToken,
  RefreshControl,
} from "react-native";
import styles from "./styles";
import PostSingle, { PostSingleHandles } from "../../components/general/post";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { PostService } from "../../services/postsPB"; // New function to fetch following feed
import { Post } from "../../../types";
import useMaterialNavBarHeight from "../../hooks/useMaterialNavBarHeight";

interface PostViewToken extends ViewToken {
  item: Post;
}

export default function FollowingFeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const mediaRefs = useRef<Record<string, PostSingleHandles | null>>({});

  const fetchPosts = useCallback(async () => {
    const posts = await PostService.getFollowingFeed();
    setPosts(posts);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const onViewableItemsChanged = useRef(
    ({ changed }: { changed: PostViewToken[] }) => {
      changed.forEach((element) => {
        const cell = mediaRefs.current[element.key];

        if (cell) {
          if (element.isViewable) {
            cell.play();
          } else {
            cell.stop();
          }
        }
      });
    },
  );

  const feedItemHeight =
    Dimensions.get("window").height - useMaterialNavBarHeight(false);

  const renderItem = ({ item, index }: { item: Post; index: number }) => {
    return (
      <View
        style={{
          height: feedItemHeight,
          backgroundColor: "black",
        }}
      >
        <PostSingle
          item={item}
          ref={(PostSingeRef) => (mediaRefs.current[item.id] = PostSingeRef)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        windowSize={4}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        viewabilityConfig={{
          itemVisiblePercentThreshold: 0,
        }}
        renderItem={renderItem}
        pagingEnabled
        keyExtractor={(item) => item.id}
        decelerationRate={"fast"}
        onViewableItemsChanged={onViewableItemsChanged.current}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
