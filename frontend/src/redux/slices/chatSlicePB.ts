import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { Chat, Message } from "../../../types";
import ChatService from "../../services/chatPB";

interface ChatState {
  list: Chat[];
  currentMessages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  list: [],
  currentMessages: [],
  loading: false,
  error: null,
};

// Async thunks for chat operations
export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      return await ChatService.getChats();
    } catch (error: any) {
      return rejectWithValue(error.content || "Failed to fetch chats");
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (chatId: string, { rejectWithValue }) => {
    try {
      return await ChatService.getMessages(chatId);
    } catch (error: any) {
      return rejectWithValue(error.content || "Failed to fetch messages");
    }
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    { chatId, content }: { chatId: string; content: string },
    { rejectWithValue },
  ) => {
    try {
      await ChatService.sendMessage(chatId, content);
      // Return the message details for state update
      const messages = await ChatService.getMessages(chatId);
      return messages[messages.length - 1]; // Return the last message (just sent)
    } catch (error: any) {
      return rejectWithValue(error.content || "Failed to send message");
    }
  },
);

const chatSlicePB = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.list = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.currentMessages.push(action.payload);
    },
    clearMessages: (state) => {
      state.currentMessages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMessages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentMessages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setChats, addMessage, clearMessages, clearError } =
  chatSlicePB.actions;
export default chatSlicePB.reducer;
