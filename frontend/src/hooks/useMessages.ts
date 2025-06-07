import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatService from "../services/chatPB";
import { RootState } from "../redux/store";
import { Message } from "../../types";

export const useMessages = (chatId?: string, contactId?: string) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const chats = useSelector((state: RootState) => state.chat.list);

  const [chatIdInst, setChatIdInst] = useState(chatId);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleMessagesChange = useCallback((messages: Message[]) => {
    setMessages(messages);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!chatIdInst) {
      const chat = chats.find((item) =>
        item.participants.some((member) => member === contactId),
      );

      if (!chat && contactId) {
        ChatService.createChat(contactId).then((res) => setChatIdInst(res.id));
      } else if (chat) {
        setChatIdInst(chat.id);
      }
    }

    if (currentUser != null && chatIdInst) {
      unsubscribe = ChatService.subscribeToMessages(
        chatIdInst,
        handleMessagesChange,
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleMessagesChange, currentUser, chatIdInst, chats, contactId]);

  return { messages, chatIdInst };
};
