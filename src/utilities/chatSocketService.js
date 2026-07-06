import { io } from "socket.io-client";
import { store } from "../redux/app/store";
import { addMessage, setTyping } from "../redux/slices/chatSlice";

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} serverUrl - WebSocket server URL (e.g., 'wss://your-backend.com' or 'http://localhost:3000')
   * @param {object} user - User object with clinicId and userName
   */
  connect(serverUrl, user) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Use provided serverUrl or fallback to env/hardcoded with local awareness
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const defaultSocket = isLocal
      ? "http://localhost:3028"
      : "https://admin.physicianhealthnet.com";
    const SOCKET_URL =
      serverUrl || import.meta.env.VITE_SOCKET_URL || defaultSocket;

    // Get the actual clinicId from user object
    // Prioritize cid (PHN-C-XXXX format) to match Admin Dashboard
    const clinicId = user.cid || user.clinicId || "1";
    const userName = user.userName || user.name || user.email || "Clinic User";
    const clinicName = user.clinicName || "Physician Clinic";

    console.log("Connecting with:", { clinicId, userName, clinicName });

    this.socket = io(SOCKET_URL, {
      auth: {
        userType: "clinic",
        clinicId: clinicId,
        userName: userName,
        clinicName: clinicName,
      },
      transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Connected to chat server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from chat server:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.isConnected = false;
    });

    // Chat events
    this.socket.on("message:received", (message) => {
      console.log("📨 New message received:", message);
      store.dispatch(addMessage(message));
    });

    this.socket.on("message:status", ({ messageId, status }) => {
      console.log(`📬 Message ${messageId} status: ${status}`);
      // Update message status in Redux store
      // You can add a new action in chatSlice for this
    });

    this.socket.on("typing:start", ({ senderName }) => {
      console.log(`✍️ ${senderName} is typing...`);
      store.dispatch(setTyping(true));
    });

    this.socket.on("typing:stop", () => {
      console.log("✍️ Typing stopped");
      store.dispatch(setTyping(false));
    });

    // Reconnection events
    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      this.isConnected = false;
    });
  }

  /**
   * Send a message to Support
   * @param {object} messageData - Message data
   */
  sendMessage(messageData) {
    if (!this.socket?.connected) {
      console.error("Socket not connected. Cannot send message.");
      return false;
    }

    this.socket.emit("message:send", messageData);
    return true;
  }

  /**
   * Emit typing indicator
   * @param {boolean} isTyping - Whether user is typing
   */
  emitTyping(isTyping) {
    if (!this.socket?.connected) return;

    if (isTyping) {
      this.socket.emit("typing:start");
    } else {
      this.socket.emit("typing:stop");
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   */
  markAsRead(messageId) {
    if (!this.socket?.connected) return;

    this.socket.emit("message:read", { messageId });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log("🔌 Disconnected from chat server");
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
const chatSocketService = new ChatSocketService();
export default chatSocketService;
