import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Button from "../ui/Button";

const ChatInput = ({ onSendMessage, disabled = false }) => {
    const [message, setMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage("");
        }
    };

    const handleKeyDown = (e) => {
        // Send on Enter, new line on Shift+Enter
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200  bg-white/80  backdrop-blur-md p-4"
        >
            <div className="flex items-end gap-2">
                {/* Text Input */}
                <div className="flex-1 relative">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={disabled}
                        rows={1}
                        className="w-full resize-none rounded-xl border border-slate-300  bg-white  text-slate-800  px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
                        style={{
                            minHeight: "42px",
                            height: "auto",
                        }}
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                        }}
                    />

                    {/* Emoji Button (placeholder for future) */}
                    <button
                        type="button"
                        className="absolute right-3 bottom-2.5 text-slate-400 hover:text-slate-600 :text-slate-300 transition-colors"
                        title="Emoji (coming soon)"
                    >
                        <Icon icon="tabler:mood-smile" className="text-xl" />
                    </button>
                </div>

                {/* Send Button */}
                <Button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className="w-11 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 :bg-slate-700 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 disabled:shadow-none"
                >
                    <Icon icon="tabler:send" className="text-xl" />
                </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-slate-500  mt-2">
                Press <kbd className="px-1.5 py-0.5 bg-slate-200  rounded text-xs font-semibold">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-200  rounded text-xs font-semibold">Shift+Enter</kbd> for new line
            </p>
        </form>
    );
};

export default ChatInput;
