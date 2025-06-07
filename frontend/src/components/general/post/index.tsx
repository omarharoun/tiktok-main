import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ResizeMode, Video } from "expo-av";
import styles from "./styles";
import { Post } from "../../../../types";
import { useUser } from "../../../hooks/useUser";
import PostSingleOverlay from "./overlay";
import { MediaService } from "../../../services/mediaPB";

export interface PostSingleHandles {
  play: () => Promise<void>;
  stop: () => Promise<void>;
  unload: () => Promise<void>;
}

/**
 * This component is responsible for displaying a post and play the
 * media associated with it.
 *
 * The ref is forwarded to this component so that the parent component
 * can manage the play status of the video.
 */
export const PostSingle = forwardRef<PostSingleHandles, { item: Post }>(
  ({ item }, parentRef) => {
    const ref = useRef<Video>(null);
    const user = useUser(item.creator).data;

    // Generate full URLs for media files
    const videoUrl =
      item.media && item.media[0]
        ? MediaService.getFileUrl(item, item.media[0])
        : "";
    const thumbnailUrl =
      item.media && item.media[1]
        ? MediaService.getFileUrl(item, item.media[1])
        : "";

    console.log("Post media URLs:", {
      videoUrl,
      thumbnailUrl,
      media: item.media,
    });

    useImperativeHandle(parentRef, () => ({
      play,
      stop,
      unload,
    }));

    useEffect(() => {
      return () => {
        unload()
          .then(() => {})
          .catch((e) => {
            console.log("Failed to unload:", e);
          });
      };
    }, []);

    /**
     * Plays the video in the component if the ref
     * of the video is not null.
     *
     * @returns {void}
     */
    const play = async () => {
      if (ref.current == null) {
        return;
      }
      try {
        const status = await ref.current.getStatusAsync();
        if (status && "isPlaying" in status && status.isPlaying) {
          return;
        }
        await ref.current.playAsync();
      } catch (e) {
        console.log("An error occurred:", e);
      }
    };

    /**
     * Stops the video in the component if the ref
     * of the video is not null.
     *
     * @returns {void}
     */
    const stop = async () => {
      if (ref.current == null) {
        return;
      }
      try {
        const status = await ref.current.getStatusAsync();
        if (status && "isPlaying" in status && !status.isPlaying) {
          return;
        }
        await ref.current.stopAsync();
      } catch (e) {
        console.log("An error occurred:", e);
      }
    };

    /**
     * Unloads the video in the component if the ref
     * of the video is not null.
     *
     * This will make sure unnecessary video instances are
     * not in memory at all times
     *
     * @returns {void}
     */
    const unload = async () => {
      if (ref.current == null) {
        return;
      }
      try {
        await ref.current.unloadAsync();
      } catch (e) {
        console.log(e);
      }
    };

    return (
      <>
        {user && <PostSingleOverlay user={user} post={item} />}
        <Video
          ref={ref}
          style={styles.container}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping
          usePoster
          posterSource={{ uri: thumbnailUrl }}
          posterStyle={{ resizeMode: "cover", height: "100%" }}
          source={{
            uri: videoUrl,
          }}
        />
      </>
    );
  },
);

export default PostSingle;
