import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import dayjs from "dayjs";

const ChatMessage = ({ message, isOwnMessage }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case "sent":
                return <Icon icon="tabler:check" className="text-xs text-slate-400" />;
            case "delivered":
                return (
                    <div className="flex">
                        <Icon icon="tabler:checks" className="text-xs text-slate-400" />
                    </div>
                );
            case "read":
                return (
                    <div className="flex">
                        <Icon icon="tabler:checks" className="text-xs text-blue-500" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className={`flex items-end gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isOwnMessage ? "flex-row-reverse" : "flex-row"
                }`}
        >
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOwnMessage
                        ? "bg-blue-500/20"
                        : "bg-slate-500/20 "
                    }`}
            >
                <Icon
                    icon={isOwnMessage ? "tabler:building-hospital" : "tabler:headset"}
                    className={`text-lg ${isOwnMessage
                            ? "text-blue-600 "
                            : "text-slate-600 "
                        }`}
                />
            </div>

            {/* Message Bubble */}
            <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwnMessage
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-white  text-slate-800  rounded-bl-sm border border-slate-200 "
                    }`}
            >
                {/* Sender Name (only for received messages) */}
                {!isOwnMessage && (
                    <p className="text-xs font-black text-blue-600  mb-1">
                        {message.senderName}
                    </p>
                )}

                {/* Message Text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.message}
                </p>

                {/* Timestamp and Status */}
                <div
                    className={`flex items-center gap-1 mt-1 justify-end ${isOwnMessage ? "text-blue-100" : "text-slate-500 "
                        }`}
                >
                    <span className="text-xs">
                        {dayjs(message.timestamp).format("HH:mm")}
                    </span>
                    {isOwnMessage && getStatusIcon(message.status)}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
