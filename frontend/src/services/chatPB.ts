import { pb, Collections } from "../../pocketbaseConfig";
import { Chat, Message } from "../../types";

export class ChatService {
  /**
   * Get all chats for current user
   */
  static async getChats(): Promise<Chat[]> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      const chats = await pb.collection(Collections.CHATS).getList(1, 50, {
        filter: `participants ?~ "${currentUser.id}"`,
        sort: "-lastActivity",
        expand: "participants",
      });

      return chats.items as unknown as Chat[];
    } catch (error) {
      console.error("Error getting chats:", error);
      return [];
    }
  }

  /**
   * Subscribe to chats for real-time updates
   */
  static subscribeToChats(callback: (chats: Chat[]) => void): () => void {
    const currentUser = pb.authStore.model;
    if (!currentUser?.id) {
      return () => {};
    }

    const unsubscribe = pb
      .collection(Collections.CHATS)
      .subscribe("*", async (e) => {
        // Check if the current user is a participant in this chat
        if (e.record.participants?.includes(currentUser.id)) {
          const chats = await this.getChats();
          callback(chats);
        }
      });

    // Initial load
    this.getChats().then(callback);

    return () => {
      pb.collection(Collections.CHATS).unsubscribe("*");
    };
  }

  /**
   * Get messages for a specific chat
   */
  static async getMessages(chatId: string): Promise<Message[]> {
    try {
      const messages = await pb
        .collection(Collections.MESSAGES)
        .getList(1, 100, {
          filter: `chat = "${chatId}"`,
          sort: "-created",
          expand: "sender",
        });

      return messages.items.reverse() as unknown as Message[]; // Reverse to show oldest first
    } catch (error) {
      console.error("Error getting messages:", error);
      return [];
    }
  }

  /**
   * Subscribe to messages for real-time updates
   */
  static subscribeToMessages(
    chatId: string,
    callback: (messages: Message[]) => void,
  ): () => void {
    const unsubscribe = pb
      .collection(Collections.MESSAGES)
      .subscribe("*", async (e) => {
        if (e.record.chat === chatId) {
          const messages = await this.getMessages(chatId);
          callback(messages);
        }
      });

    // Initial load
    this.getMessages(chatId).then(callback);

    return () => {
      pb.collection(Collections.MESSAGES).unsubscribe("*");
    };
  }

  /**
   * Send a message
   */
  static async sendMessage(chatId: string, content: string): Promise<void> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      // Create the message
      await pb.collection(Collections.MESSAGES).create({
        chat: chatId,
        sender: currentUser.id,
        content,
      });

      // Update chat's lastActivity
      await pb.collection(Collections.CHATS).update(chatId, {
        lastActivity: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Send a message with media
   */
  static async sendMessageWithMedia(
    chatId: string,
    content: string,
    mediaFile: File | Blob,
  ): Promise<void> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      const formData = new FormData();
      formData.append("chat", chatId);
      formData.append("sender", currentUser.id);
      formData.append("content", content);
      formData.append("media", mediaFile);

      // Create the message
      await pb.collection(Collections.MESSAGES).create(formData);

      // Update chat's lastActivity
      await pb.collection(Collections.CHATS).update(chatId, {
        lastActivity: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending message with media:", error);
      throw error;
    }
  }

  /**
   * Create a new chat (direct message)
   */
  static async createChat(contactId: string): Promise<Chat> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      // Check if chat already exists between these users
      const existingChat = await pb
        .collection(Collections.CHATS)
        .getList(1, 1, {
          filter: `participants ?~ "${currentUser.id}" && participants ?~ "${contactId}" && type = "direct"`,
        });

      if (existingChat.items.length > 0) {
        return existingChat.items[0] as unknown as Chat;
      }

      // Create new chat
      const chat = await pb.collection(Collections.CHATS).create({
        participants: [currentUser.id, contactId],
        type: "direct",
        lastActivity: new Date().toISOString(),
      });

      return chat as unknown as Chat;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  }

  /**
   * Create a group chat
   */
  static async createGroupChat(
    participantIds: string[],
    name: string,
    description?: string,
  ): Promise<Chat> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      // Include current user in participants
      const allParticipants = [...new Set([currentUser.id, ...participantIds])];

      const chat = await pb.collection(Collections.CHATS).create({
        participants: allParticipants,
        type: "group",
        name,
        description: description || "",
        lastActivity: new Date().toISOString(),
      });

      return chat as unknown as Chat;
    } catch (error) {
      console.error("Error creating group chat:", error);
      throw error;
    }
  }

  /**
   * Update chat info (name, description, avatar)
   */
  static async updateChat(
    chatId: string,
    updates: {
      name?: string;
      description?: string;
      avatar?: File | Blob;
    },
  ): Promise<Chat> {
    try {
      let updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;

      if (updates.avatar) {
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        formData.append("avatar", updates.avatar);
        updateData = formData;
      }

      const chat = await pb
        .collection(Collections.CHATS)
        .update(chatId, updateData);
      return chat as unknown as Chat;
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error;
    }
  }

  /**
   * Leave a chat (remove current user from participants)
   */
  static async leaveChat(chatId: string): Promise<void> {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser?.id) {
        throw new Error("No authenticated user");
      }

      const chat = await pb.collection(Collections.CHATS).getOne(chatId);
      const updatedParticipants = chat.participants.filter(
        (id: string) => id !== currentUser.id,
      );

      if (updatedParticipants.length === 0) {
        // If no participants left, delete the chat
        await pb.collection(Collections.CHATS).delete(chatId);
      } else {
        // Update participants list
        await pb.collection(Collections.CHATS).update(chatId, {
          participants: updatedParticipants,
        });
      }
    } catch (error) {
      console.error("Error leaving chat:", error);
      throw error;
    }
  }
}

export default ChatService;

// Export individual functions for backward compatibility
export const chatsListener = (callback: (chats: Chat[]) => void) =>
  ChatService.subscribeToChats(callback);

export const messagesListener = (
  chatId: string,
  callback: (messages: Message[]) => void,
) => ChatService.subscribeToMessages(chatId, callback);

export const sendMessage = ChatService.sendMessage;
export const createChat = ChatService.createChat;
