import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { AxiosInstance } from "../../utilities/AxiosInstance";

// Mock data for initial development
const MOCK_MESSAGES = [
  {
    id: "msg_1",
    sender: "phn",
    senderName: "Clinic Support",
    message: "Hello! Welcome to Support. How can we assist you today?",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "read",
  },
  {
    id: "msg_2",
    sender: "clinic",
    senderName: "Physician Clinic",
    message: "Hi, we need help with the billing module.",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    status: "read",
  },
  {
    id: "msg_3",
    sender: "phn",
    senderName: "Clinic Support",
    message:
      "Sure! I'd be happy to help. What specific issue are you experiencing with the billing module?",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    status: "read",
  },
];

// Async thunks
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (_, { rejectWithValue }) => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      // Prioritize cid (PHN-C-XXXX) to match system standard
      const clinicId = user.cid || user.clinicId;

      if (!clinicId) {
        return rejectWithValue("No clinic ID found");
      }

      // Determine if we are in local development
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const defaultHub = isLocal
        ? "http://localhost:3028"
        : "https://admin.physicianhealthnet.com";

      const HUB_API = (
        import.meta.env.VITE_SECONDARY_API_URL || defaultHub
      ).replace(/\/$/, "");
      const response = await axios.get(`${HUB_API}/chat/messages/${clinicId}`);

      return response.data.messages || [];
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return rejectWithValue(
        error.response?.data || "Failed to fetch messages"
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await AxiosInstance.post("/chat/send", messageData);
      // return response.data.message;

      // Mock delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newMessage = {
        id: `msg_${Date.now()}`,
        ...messageData,
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      // Simulate status updates
      setTimeout(() => {
        // This would be handled by WebSocket in production
      }, 1000);

      return newMessage;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to send message");
    }
  }
);

export const markAsRead = createAsyncThunk(
  "chat/markAsRead",
  async (messageId, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // await AxiosInstance.patch(`/chat/read/${messageId}`);
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to mark as read");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    unreadCount: 0,
    isOpen: false,
    typing: false,
    loading: false,
    error: null,
  },
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.unreadCount = 0;
      }
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    openChat: (state) => {
      state.isOpen = true;
      state.unreadCount = 0;
    },
    setTyping: (state, action) => {
      state.typing = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      if (!state.isOpen && action.payload.sender === "phn") {
        state.unreadCount += 1;
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find((msg) => msg.id === messageId);
      if (message) {
        message.status = status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.unreadCount = action.payload.filter(
          (msg) => msg.sender === "phn" && msg.status !== "read"
        ).length;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const message = state.messages.find((msg) => msg.id === action.payload);
        if (message) {
          message.status = "read";
        }
      });
  },
});

export const {
  toggleChat,
  closeChat,
  openChat,
  setTyping,
  addMessage,
  updateMessageStatus,
  clearError,
} = chatSlice.actions;
export default chatSlice.reducer;
