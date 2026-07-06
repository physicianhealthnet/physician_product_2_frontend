import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { message as antMessage } from "antd";
import axios from "axios";
import { AxiosInstance } from "../../utilities/AxiosInstance";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

import { StaggerContainer, StaggerItem } from "../ui/Transitions";

const PatientChat = () => {
  const [socket, setSocket] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activePatientId, setActivePatientId] = useState(null);
  const [messages, setMessages] = useState({}); // Map: patientId -> [messages]
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPatients, setAllPatients] = useState([]); // All clinic patients
  const messagesEndRef = useRef(null);
  const activePatientIdRef = useRef(activePatientId);
  const location = useLocation();
  const targetPatientFromNav = location.state?.patientId || null;
  const autoOpenedRef = useRef(false);

  // Get user info from session
  const userInfo = JSON.parse(
    sessionStorage.getItem("user") || sessionStorage.getItem("master"),
  );
  const clinicId = userInfo?.cid || userInfo?.clinicId || "PHN-C-0006"; // Fallback for dev

  // Update ref when activePatientId changes
  useEffect(() => {
    activePatientIdRef.current = activePatientId;
  }, [activePatientId]);

  // Auto-open patient chat if navigated from dashboard with a patientId
  useEffect(() => {
    if (!targetPatientFromNav || !socket || autoOpenedRef.current) return;

    const openTargetPatient = async () => {
      autoOpenedRef.current = true;
      setActivePatientId(targetPatientFromNav);

      // Fetch chat history
      try {
        const isLocalEnv = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const HUB_API = isLocalEnv
          ? "http://localhost:3028"
          : import.meta.env.VITE_SECONDARY_API_URL || "https://dependencyforphn.physicianhealthnet.com/api";
        const res = await axios.get(`${HUB_API}/patient-chat/messages/${clinicId}/${targetPatientFromNav}`);
        setMessages(prev => ({ ...prev, [targetPatientFromNav]: res.data }));
      } catch (e) {
        console.error("Failed to load target patient history:", e);
      }

      // Mark as read
      socket.emit("doctor:read_messages", { patientId: targetPatientFromNav });
    };

    openTargetPatient();
  }, [targetPatientFromNav, socket, clinicId]);

  // Fetch all patients for the clinic
  useEffect(() => {
    const fetchAllPatients = async () => {
      try {
        const res = await AxiosInstance.get(
          `/patient/get-all-by-clinic/${clinicId}`,
        );
        console.log(res);

        if (res.data && res.data.patients) {
          setAllPatients(res.data.patients);
        }
      } catch (error) {
        console.error("Failed to fetch all patients:", error);
      }
    };
    if (clinicId) fetchAllPatients();
  }, [clinicId]);
  console.log(clinicId);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = (title, body) => {
    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      new Notification(title, { body, icon: "/phn_logo.png" });
    }
  };
  useEffect(() => {
    if (!clinicId) return;

    // Connect to Socket
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const SOCKET_URL = isLocal
      ? "http://localhost:3028"
      : import.meta.env.VITE_SOCKET_URL ||
        "https://dependencyforphn.physicianhealthnet.com";

    console.log(`Connecting to Socket: ${SOCKET_URL} for clinic: ${clinicId}`);

    const newSocket = io(SOCKET_URL, {
      auth: {
        userType: "doctor",
        clinicId: clinicId,
        userName: userInfo?.userName || "Doctor",
      },
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Patient Chat System");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      antMessage.error("Failed to connect to chat server");
    });

    newSocket.on("patient:sessions", (data) => {
      setSessions(data);
    });

    newSocket.on("patient:message", (data) => {
      const { patientId, ...msg } = data;

      // Trigger Browser Notification
      sendBrowserNotification(
        `New message from ${msg.patientName || "Patient"}`,
        msg.message,
      );

      // Update messages
      setMessages((prev) => ({
        ...prev,
        [patientId]: [...(prev[patientId] || []), msg],
      }));

      // Update session list (move to top, update preview)
      setSessions((prev) => {
        const otherSessions = prev.filter((s) => s.patientId !== patientId);
        const currentSession = prev.find((s) => s.patientId === patientId) || {
          patientId,
          patientName: msg.patientName,
          unreadCount: 0,
        };

        return [
          {
            ...currentSession,
            lastMessage: {
              message: msg.message,
              sender: "patient",
              timestamp: new Date(),
            },
            // Increment unread if not active
            unreadCount:
              activePatientIdRef.current === patientId
                ? 0
                : (currentSession.unreadCount || 0) + 1,
            lastActivity: new Date(),
          },
          ...otherSessions,
        ];
      });

      if (activePatientIdRef.current !== patientId) {
        antMessage.info(`New message from ${msg.patientName || "Patient"}`);
      }
    });

    newSocket.on("message:sent", (data) => {
      const { patientId, ...msg } = data;
      // Confirmation that my message was sent
      setMessages((prev) => ({
        ...prev,
        [patientId]: [...(prev[patientId] || []), msg],
      }));
    });

    newSocket.on("doctor:message_broadcast", (data) => {
      const { patientId, ...msg } = data;
      setMessages((prev) => ({
        ...prev,
        [patientId]: [...(prev[patientId] || []), msg],
      }));

      setSessions((prev) => {
        const otherSessions = prev.filter((s) => s.patientId !== patientId);
        const currentSession = prev.find((s) => s.patientId === patientId);
        if (!currentSession) return prev;

        return [
          {
            ...currentSession,
            lastMessage: msg,
            lastActivity: new Date(),
            unreadCount: 0,
          },
          ...otherSessions,
        ];
      });
    });

    return () => {
      console.log("Closing socket connection");
      newSocket.close();
    };
  }, [clinicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activePatientId]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activePatientId) return;

    const activePatient = searchResults.find(
      (s) => s.patientId === activePatientId,
    );

    socket.emit("message:send", {
      patientId: activePatientId,
      patientName: activePatient?.patientName,
      message: inputMessage,
    });

    setInputMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const searchResults = useMemo(() => {
    const lowQuery = searchQuery.toLowerCase();

    // Patients in sessions
    const matchingSessions = sessions.filter((s) =>
      s.patientName?.toLowerCase().includes(lowQuery),
    );

    // If not searching, just return sessions
    if (!searchQuery) return sessions;

    // Patients NOT in sessions but match query
    const sessionPatientIds = new Set(sessions.map((s) => s.patientId));
    const otherMatchingPatients = allPatients
      .filter(
        (p) =>
          (p.patientName?.toLowerCase().includes(lowQuery) ||
            p.patientPhone?.includes(searchQuery)) &&
          !sessionPatientIds.has(p.patientId),
      )
      .map((p) => ({
        patientId: p.patientId,
        patientName: p.patientName,
        lastMessage: null,
        unreadCount: 0,
        lastActivity: null,
        isNew: true,
      }));

    return [...matchingSessions, ...otherMatchingPatients];
  }, [sessions, allPatients, searchQuery]);

  const activeSession = searchResults.find((s) => s.patientId === activePatientId);
  const activeMessages = messages[activePatientId] || [];

  // Group messages by date
  const groupedMessages = activeMessages.reduce((groups, message) => {
    const date = dayjs(message.timestamp).format("YYYY-MM-DD");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const getDateLabel = (dateStr) => {
    const date = dayjs(dateStr);
    if (date.isToday()) return "Today";
    if (date.isYesterday()) return "Yesterday";
    return date.format("MMMM D, YYYY");
  };

  return (
    <StaggerContainer className="w-full">
      <div className="flex flex-row h-[calc(100vh-64px)] w-full bg-slate-50/30 backdrop-blur-3xl overflow-hidden font-sans">
        {/* Sidebar - Patient List */}
        <StaggerItem className={`w-full md:w-80 lg:w-[400px] flex flex-col bg-white/60 backdrop-blur-2xl border-r border-slate-100/50 ${activePatientId ? "hidden md:flex" : "flex"}`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-100/50 w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  Messages
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Patient Communications</p>
              </div>
              <button className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                <Icon icon="solar:pen-new-square-bold-duotone" width="20" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Icon icon="solar:magnifer-linear" width="18" />
              </div>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 border border-transparent focus:border-blue-500/30 focus:bg-white rounded-2xl text-sm transition-all font-bold text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Icon icon="solar:users-group-rounded-linear" width="32" className="opacity-30" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">No matching contacts</p>
              </div>
            ) : (
              searchResults.map((session) => (
                <div
                  key={session.patientId}
                  onClick={async () => {
                    setActivePatientId(session.patientId);

                    // Fetch history
                    try {
                      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
                      const HUB_API = isLocal
                        ? "http://localhost:3028"
                        : import.meta.env.VITE_SECONDARY_API_URL ||
                          "https://dependencyforphn.physicianhealthnet.com/api";
                      const res = await axios.get(
                        `${HUB_API}/patient-chat/messages/${clinicId}/${session.patientId}`,
                      );
                      setMessages((prev) => ({
                        ...prev,
                        [session.patientId]: res.data,
                      }));
                    } catch (e) {
                      console.error(e);
                    }

                    socket.emit("doctor:read_messages", {
                      patientId: session.patientId,
                    });
                  }}
                  className={`group relative p-4 rounded-[24px] cursor-pointer transition-all duration-300 flex gap-4 overflow-hidden border
                          ${
                            activePatientId === session.patientId
                              ? "bg-white border-blue-100 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/10"
                              : "bg-transparent border-transparent hover:bg-white/40 hover:border-slate-200/50"
                          }
                      `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm transition-all duration-500
                              ${
                                activePatientId === session.patientId
                                  ? "bg-linear-to-br from-blue-500 to-indigo-600 text-white scale-110"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                              }`}
                    >
                      {session.patientName?.charAt(0)}
                    </div>
                    {session.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3
                        className={`font-black text-sm truncate pr-2 tracking-tight ${activePatientId === session.patientId ? "text-slate-900" : "text-slate-700"}`}
                      >
                        {session.patientName}
                      </h3>
                      {session.lastMessage?.timestamp && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${activePatientId === session.patientId ? "text-blue-500" : "text-slate-400"}`}
                        >
                          {dayjs(session.lastMessage.timestamp).fromNow(true)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                        className={`text-xs truncate max-w-[180px] font-medium leading-relaxed ${
                          activePatientId === session.patientId
                            ? "text-slate-500"
                            : session.unreadCount > 0
                              ? "text-slate-800 font-bold"
                              : "text-slate-400"
                        }`}
                      >
                        {session.lastMessage?.sender === "doctor" && (
                          <span className="text-blue-500/70">You: </span>
                        )}
                        {session.lastMessage?.message ||
                          (session.isNew
                            ? "Start a conversation"
                            : "No messages yet")}
                      </p>
                      {session.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 min-w-[20px] text-center rounded-lg shadow-lg shadow-blue-500/30">
                          {session.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* New Tag */}
                  {session.isNew && (
                    <div className="absolute top-0 right-0 p-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </StaggerItem>

        {/* Chat Area */}
        <StaggerItem className={`flex-1 flex flex-col bg-slate-50/30 relative ${!activePatientId ? "hidden md:flex" : "flex"}`}>
          {!activePatientId ? (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Icon
                  icon="solar:chat-round-bold-duotone"
                  className="text-blue-500 text-6xl"
                />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                Secure <span className="text-blue-500">Messaging</span>
              </h3>
              <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                Connect with your patients in real-time. Select a patient from the left panel to begin a secure consultation.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-20 px-8 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl flex items-center justify-between z-20 sticky top-0 shadow-sm">
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setActivePatientId(null)}
                    className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <Icon icon="solar:arrow-left-linear" width="24" />
                  </button>

                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                      {activeSession?.patientName?.charAt(0)}
                    </div>
                    {activeSession?.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-slate-800 text-lg tracking-tight leading-none">
                      {activeSession?.patientName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      {activeSession?.isOnline ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-md border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Active Now</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Active {dayjs(activeSession?.lastActivity).fromNow()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100">
                    <Icon icon="solar:user-circle-bold-duotone" width="24" />
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all">
                    <Icon icon="solar:menu-dots-bold-duotone" width="24" />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/subtle-dots.png')]">
                {Object.keys(groupedMessages).map((date) => (
                  <div key={date} className="space-y-8">
                    {/* Date Divider */}
                    <div className="flex justify-center">
                      <span className="bg-slate-200/50 backdrop-blur-md text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-300/30 uppercase tracking-widest">
                        {getDateLabel(date)}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-6">
                      {groupedMessages[date].map((msg, idx) => {
                        const isMe = msg.sender === "doctor";
                        return (
                          <div
                            key={idx}
                            className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                          >
                            <div className={`max-w-[80%] md:max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                              <div
                                className={`px-5 py-3.5 rounded-[22px] shadow-sm text-sm font-medium leading-relaxed relative border
                                  ${
                                    isMe
                                      ? "bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none border-blue-500/20"
                                      : "bg-white text-slate-700 border-slate-200/50 rounded-tl-none"
                                  }`}
                              >
                                {msg.message}
                                
                                <div className={`text-[9px] mt-1.5 flex items-center gap-1.5 opacity-60 font-black uppercase tracking-tighter ${isMe ? "text-blue-100 justify-end" : "text-slate-400"}`}>
                                  {dayjs(msg.timestamp).format("h:mm A")}
                                  {isMe && <Icon icon="solar:check-read-linear" width="14" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/50">
                <div className="flex items-end gap-3 bg-slate-100/50 p-3 rounded-[28px] border border-slate-200/50 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white focus-within:border-blue-500/50 transition-all duration-300 shadow-inner">
                  <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl transition-all">
                    <Icon icon="solar:paperclip-linear" width="22" />
                  </button>

                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message your patient..."
                    className="flex-1 max-h-40 min-h-[48px] py-3.5 bg-transparent border-none focus:ring-0 text-slate-800 text-sm font-bold placeholder:text-slate-400 resize-none custom-scrollbar"
                    rows={1}
                  />

                  <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-yellow-500 hover:bg-white rounded-2xl transition-all">
                    <Icon icon="solar:smile-circle-linear" width="22" />
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-lg ${
                      inputMessage.trim()
                        ? "bg-blue-600 text-white shadow-blue-500/30 transform hover:scale-105 active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Icon icon="solar:plain-bold-duotone" width="24" className={inputMessage.trim() ? "translate-x-0.5" : ""} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Icon icon="solar:keyboard-bold" className="text-slate-300 text-xs" />
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    Enter to send • Shift + Enter for new line
                  </p>
                </div>
              </div>
            </>
          )}
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

export default PatientChat;
