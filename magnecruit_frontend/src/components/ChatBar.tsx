// magnecruit_frontend\src\components\ChatBar.tsx

import React, { useState, useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import ReactMarkdown from "react-markdown";

// Interface for the Chat bar props
interface ChatBarProps {
    isLoading: boolean;
    onSendMessage: (content: string) => void;
}

// Chat bar component
const ChatBar: React.FC<ChatBarProps> = ({ isLoading, onSendMessage }) => {
    const conversationId = useSelector((state: RootState) => state.chat.selectedConversationId);
    const messages = useSelector((state: RootState) => state.chat.messages);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputText, setInputText] = useState("");

    // Effect to scroll to the bottom of the messages list
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handlers for the Input Text Area
    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(event.target.value);
    };

    // Handlers for the Send Click Button
    const handleSendClickButton = () => {
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText("");
        }
    };

    // Handlers for the Enter Key Press Event
    const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendClickButton();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
            {/* Chat Bar Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-1 text-gray-700">MagnecAI Chat</h2>
            </div>

            {/* Chat Bar Body */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500">Loading messages...</p>
                ) : conversationId === null && messages.length === 0 ? (
                    <p className="text-center text-gray-400">
                        Start a new conversation or select one.
                    </p>
                ) : messages.length === 0 && conversationId !== null ? (
                    <p className="text-center text-gray-400">Send a message to start chatting...</p>
                ) : (
                    <div className="w-full space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`rounded-lg p-2 max-w-[75%] break-words whitespace-pre-wrap ${
                                        message.sender === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-200 text-gray-800"
                                    }`}
                                >
                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Chat Bar Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                    {/* Input Text Area */}
                    <textarea
                        placeholder="Type your message..."
                        className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[2.5rem] max-h-24 overflow-y-auto resize-none disabled:opacity-50"
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        rows={3}
                    />

                    {/* Send Message Button */}
                    <button
                        onClick={handleSendClickButton}
                        className="p-2 text-blue-500 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:hover:bg-transparent"
                        aria-label="Send message"
                        disabled={!inputText.trim() || conversationId === null || isLoading}
                    >
                        <SendHorizontal size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBar;
