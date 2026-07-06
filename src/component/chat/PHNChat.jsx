import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useDispatch, useSelector } from "react-redux";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { sendMessage, fetchMessages } from "../../redux/slices/chatSlice";
import chatSocketService from "../../utilities/chatSocketService";

const PHNChat = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const { messages, loading, typing } = useSelector((state) => state.chat);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [isConnected, setIsConnected] = useState(false);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (isOpen && user.clinicId) {
      // Connect to WebSocket server
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (isLocal ? "http://localhost:3028" : "https://admin.physicianhealthnet.com");
      chatSocketService.connect(socketUrl, user);

      // Check connection status
      const checkConnection = setInterval(() => {
        setIsConnected(chatSocketService.getConnectionStatus());
      }, 1000);

      return () => {
        clearInterval(checkConnection);
      };
    }
  }, [isOpen, user.clinicId]);

  // Fetch initial messages when chat opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMessages());
    }
  }, [isOpen, dispatch]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text) => {
    const clinicId = user.cid || user.clinicId || "1";
    const senderName =
      user.userName || user.name || user.email || "Clinic User";
    const clinicName = user.clinicName || "Physician Clinic";

    const messageData = {
      message: text,
      sender: "clinic",
      senderName: senderName,
      clinicId: clinicId,
      clinicName: clinicName,
      patientId: "PHN-SUPPORT", // Target for PHN Support
    };

    // Try to send via WebSocket first
    // chatSocketService.sendMessage now internally emits "message:send"
    const sentViaSocket = chatSocketService.sendMessage(messageData);

    // Fallback to Redux thunk if WebSocket not connected
    if (!sentViaSocket) {
      console.log("WebSocket not connected, using fallback");
      dispatch(sendMessage(messageData));
    } else {
      // Add message optimistically to UI
      dispatch(sendMessage(messageData));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-full bg-white  shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600   p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon icon="tabler:headset" className="text-2xl text-white" />
          </div>
          <div>
            <h2 className="font-black text-white text-lg">Clinic Support</h2>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              {typing ? (
                "typing..."
              ) : (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"
                      } animate-pulse`}
                  />
                  {isConnected ? "Online" : "Connecting..."}
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Icon icon="tabler:x" className="text-xl text-white" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50  space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Icon
                icon="tabler:loader-2"
                className="text-4xl text-blue-500 animate-spin"
              />
              <p className="text-slate-500  font-medium">
                Loading messages...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Icon
                  icon="tabler:message-circle"
                  className="text-4xl text-blue-500"
                />
              </div>
              <div>
                <h3 className="font-black text-slate-800  text-lg mb-1">
                  Start a Conversation
                </h3>
                <p className="text-sm text-slate-500 ">
                  Send a message to support team
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwnMessage={msg.sender === "clinic"}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing Indicator */}
        {typing && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs text-slate-500 ">
              Support is typing...
            </span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  );
};

export default PHNChat;
