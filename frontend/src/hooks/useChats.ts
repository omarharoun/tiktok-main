import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setChats } from "../redux/slices/chatSlicePB";
import ChatService from "../services/chatPB";
import { RootState } from "../redux/store";
import { Chat } from "../../types";

export const useChats = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

  const handleChatsChange = useCallback(
    (chats: Chat[]) => {
      dispatch(setChats(chats));
    },
    [dispatch],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (currentUser != null) {
      unsubscribe = ChatService.subscribeToChats(handleChatsChange);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, handleChatsChange]);
};
