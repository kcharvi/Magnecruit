// magnecruit_frontend\src\App.tsx

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { socket } from "./socket";
import MainLayout from "./layouts/MainLayout";
import Chatbar from "./components/ChatBar";
import Workspace from "./components/Workspace";
import LoginModal from "./components/LoginModal";
import { ConversationSummary, User, SequenceData, Message } from "./lib/types";
import { AppDispatch } from "./store/store";
import { setAiGeneratedSequence } from "./store/workspaceSlice";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser) {
                setConversations([]);
                return;
            }
            console.log("Fetching conversations for user:", currentUser.id);
            try {
                const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
                    credentials: "include",
                });
                if (response.ok) {
                    const data: ConversationSummary[] = await response.json();
                    setConversations(data);
                } else if (response.status === 401) {
                    console.log("Unauthorized to fetch conversations, likely logged out.");
                    setCurrentUser(null);
                    setConversations([]);
                } else {
                    console.error("Failed to fetch conversations, status:", response.status);
                    setConversations([]);
                }
            } catch (error) {
                console.error("Error fetching conversations:", error);
                setConversations([]);
            }
        };

        if (!isLoadingSession && currentUser) {
            fetchConversations();
        } else if (!isLoadingSession && !currentUser) {
            setConversations([]);
        }
    }, [currentUser, isLoadingSession]);

    useEffect(() => {
        const checkUserSession = async () => {
            console.log("Checking user session...");
            setIsLoadingSession(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
                    credentials: "include",
                });
                const data = await response.json();
                if (response.ok && data.isLoggedIn) {
                    console.log("Session check successful, user logged in:", data.user);
                    setCurrentUser(data.user);
                } else {
                    console.log("Session check: No active session found.");
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Error checking session:", error);
                setCurrentUser(null);
            } finally {
                setIsLoadingSession(false);
            }
        };
        checkUserSession();
    }, []);

    const handleConversationSelect = (id: number | null) => {
        console.log("Conversation selected:", id);
        if (id !== selectedConversationId) {
            setSelectedConversationId(id);
            setMessages([]);
            setIsLoadingMessages(id !== null);
        }
    };

    const handleNewChat = () => {
        if (!currentUser) {
            alert("Please log in to start a new chat.");
            setIsLoginModalOpen(true);
            return;
        }
        setSelectedConversationId(null);
        setMessages([]);
        setIsLoadingMessages(false);
        console.log("Frontend state reset for new chat visual. Ready for first message.");
    };

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = (user: User) => {
        console.log("Login successful on frontend for:", user);
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        setSelectedConversationId(null);
        setMessages([]);
    };

    const handleLogoutClick = async () => {
        console.log("Logging out...");
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                console.log("Logout successful on backend.");
            } else {
                console.error("Logout failed on backend, status:", response.status);
            }
        } catch (error) {
            console.error("Error during logout fetch:", error);
        }
        setCurrentUser(null);
        setSelectedConversationId(null);
        setConversations([]);
        setMessages([]);
        if (socket.connected) {
            console.log("Disconnecting socket after logout.");
            socket.disconnect();
        }
    };

    useEffect(() => {
        if (selectedConversationId !== null && socket.connected && currentUser) {
            console.log(
                `(App Effect) Requesting messages for conversation: ${selectedConversationId}`
            );
            setIsLoadingMessages(true);
            socket.emit("request_conversation_messages", {
                conversationId: selectedConversationId,
            });
        }
    }, [selectedConversationId, currentUser]);

    useEffect(() => {
        console.log("Socket effect: Managing connection and events. Current user:", currentUser);

        function onConnect() {
            console.log("Socket connected:", socket.id);
            if (selectedConversationId !== null) {
                console.log(
                    `(App Reconnect) Re-requesting messages for conversation: ${selectedConversationId}`
                );
                setIsLoadingMessages(true);
                socket.emit("request_conversation_messages", {
                    conversationId: selectedConversationId,
                });
            }
        }

        function onDisconnect(reason: string) {
            console.log("Socket disconnected, reason:", reason);
            setIsLoadingMessages(false);
        }

        function handleConnectError(err: Error) {
            console.error("Socket connection error:", err.message);
            if (
                err.message.includes("Authentication required") ||
                err.message.includes("Invalid session")
            ) {
                console.warn("Socket connection failed due to auth/session issue.");
            }
        }

        function onConversationCreated(data: { conversationId: number; title: string | null }) {
            console.log("App: Received conversation_created:", data);
            const newTitle = data.title || `Chat ${data.conversationId}`;
            const newConversation: ConversationSummary = {
                id: data.conversationId,
                title: newTitle,
                created_at: new Date().toISOString(),
            };
            setConversations((prev) => [newConversation, ...prev]);
            setSelectedConversationId(data.conversationId);
        }

        function handleSequenceUpdate(data: SequenceData) {
            console.log("App: Received sequence_updated for convo:", data.conversation_id);
            dispatch(setAiGeneratedSequence(data));
            console.log("App: Dispatched sequence update to Redux store.");
        }

        function handleAiResponse(message: Message) {
            console.log("App: Received ai_response:", message);
            if (message.conversation_id === selectedConversationId) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            } else {
                console.log(
                    `App: Ignoring ai_response for conversation ${message.conversation_id} (current is ${selectedConversationId})`
                );
            }
        }

        function handleConversationMessages(data: { conversationId: number; messages: Message[] }) {
            if (data.conversationId === selectedConversationId) {
                console.log("(App Handler) Received conversation messages:", data.messages.length);
                setMessages(data.messages);
                setIsLoadingMessages(false);
            } else {
                console.log(
                    `App: Ignoring fetched messages for conversation ${data.conversationId} (current is ${selectedConversationId})`
                );
            }
        }

        if (currentUser && !socket.connected) {
            console.log("Setting socket auth data for user:", currentUser.id);
            socket.auth = {
                userId: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
            };
            console.log("User logged in, connecting socket...");
            socket.connect();
        } else if (!currentUser && socket.connected) {
            console.log("User logged out, clearing socket auth and disconnecting socket...");
            socket.auth = {};
            socket.disconnect();
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("conversation_created", onConversationCreated);
        socket.on("sequence_updated", handleSequenceUpdate);
        socket.on("conversation_messages", handleConversationMessages);
        socket.on("ai_response", handleAiResponse);

        return () => {
            console.log("Cleaning up socket listeners in App.tsx...");
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("conversation_created", onConversationCreated);
            socket.off("sequence_updated", handleSequenceUpdate);
            socket.off("conversation_messages", handleConversationMessages);
            socket.off("ai_response", handleAiResponse);
        };
    }, [currentUser, selectedConversationId, dispatch]);

    const handleSendMessage = (content: string) => {
        if (!currentUser) return;

        const currentConvoId = selectedConversationId;
        console.log("handleSendMessage - Current conversation ID:", currentConvoId);

        // --- Optimistic Update ---
        const optimisticUserMessage: Message = {
            id: `temp-${Date.now()}`,
            sender: "user",
            content: content,
            timestamp: new Date().toISOString(),
            conversation_id: currentConvoId === null ? undefined : currentConvoId,
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);
        console.log("App: Optimistically added user message:", optimisticUserMessage);

        // --- Send to Backend ---
        console.log(
            "App: Emitting user message via socket. Target Conversation ID:",
            currentConvoId
        );

        if (socket.connected) {
            socket.emit("send_user_message", {
                content: content,
                conversationId: currentConvoId,
            });
        } else {
            console.error("Socket not connected. Cannot send message.");
            setMessages((prev) => prev.filter((msg) => msg.id !== optimisticUserMessage.id));
            alert("Connection error: Could not send message.");
        }
    };

    if (isLoadingSession) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <>
            <MainLayout
                chatPanel={
                    <Chatbar
                        conversationId={selectedConversationId}
                        messages={messages}
                        isLoading={isLoadingMessages}
                        onSendMessage={handleSendMessage}
                    />
                }
                workspacePanel={<Workspace selectedConversationId={selectedConversationId} />}
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                currentUser={currentUser}
                onConversationSelect={handleConversationSelect}
                onNewChat={handleNewChat}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={handleCloseModal}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
};

export default App;
