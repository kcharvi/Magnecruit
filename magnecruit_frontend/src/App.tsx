// magnecruit_frontend\src\App.tsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "./socket";
import { Conversations, Users, Messages, JobsUpdatePayload } from "./lib/types";
import { AppDispatch, RootState } from "./store/store";
import { setAiGeneratedJobSections, clearUpdatedFieldHighlights } from "./store/workspaceSlice";
import {
    setMessages,
    addMessages,
    clearMessages,
    setSelectedConversation,
} from "./store/chatSlice";
import MainLayout from "./layouts/MainLayout";
import Chatbar from "./components/ChatBar";
import Workspace from "./components/Workspace";
import LoginModal from "./components/LoginModal";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

// App component
const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const activeWorkspaceView = useSelector((state: RootState) => state.workspace.activeView);
    const { selectedConversationId } = useSelector((state: RootState) => state.chat);
    const [conversations, setConversations] = useState<Conversations[]>([]);
    const [currentUser, setCurrentUser] = useState<Users | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Effect to check the user session from the backend routing and setting the current user
    useEffect(() => {
        const checkUserSession = async () => {
            setIsLoadingSession(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
                    credentials: "include",
                });
                const data = await response.json();
                if (response.ok && data.isLoggedIn) {
                    setCurrentUser(data.user);
                } else {
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



    // Effect to fetch conversations from the backend routing for the current user
    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser) {
                setConversations([]);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
                    credentials: "include",
                });
                if (response.ok) {
                    const data: Conversations[] = await response.json();
                    setConversations(data);
                } else if (response.status === 401) {
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

    // Effect to request messages for the selected conversation from the backend websocket and using Redux State Messages
    useEffect(() => {
        if (selectedConversationId !== null && socket.connected && currentUser) {
            setIsLoadingMessages(true);
            socket.emit("request_conversation_messages", {
                conversationId: selectedConversationId,
            });
        } else {
            console.log(
                "(App Effect) Skipping message request. Reason: No selected convo / socket disconnected / no user",
                {
                    selectedConversationId,
                    connected: socket.connected,
                    currentUser: !!currentUser,
                }
            );
            if (selectedConversationId === null) {
                dispatch(clearMessages());
            }
            setIsLoadingMessages(false);
        }
    }, [selectedConversationId, currentUser, dispatch]);

    // Effect to manage socket connection and events
    useEffect(() => {
        console.log(
            "Socket effect: Current selectedConversationId (from Redux):",
            selectedConversationId
        );

        function onConnect() {
            console.log("Socket connected:", socket.id);
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
            const newTitle = data.title || `Chat ${data.conversationId}`;
            const newConversation: Conversations = {
                id: data.conversationId,
                title: newTitle,
                created_at: new Date().toISOString(),
            };
            setConversations((prev) => [newConversation, ...prev]);
            dispatch(setSelectedConversation(data.conversationId));
            setIsLoadingMessages(true);
        }

        function handleJobsUpdate(data: JobsUpdatePayload) {
            if (data.conversation_id === selectedConversationId) {
                dispatch(setAiGeneratedJobSections(data));
                setTimeout(() => {
                    dispatch(clearUpdatedFieldHighlights());
                }, 3000);
            } else {
                console.log(
                    `App: Ignoring sections_updates for conversation ${data.conversation_id} (current is ${selectedConversationId})`
                );
            }
        }

        function handleConversationMessages(data: {
            conversationId: number;
            messages: Messages[];
        }) {
            if (data.conversationId === selectedConversationId) {
                console.log(
                    "(App Handler) Received conversation messages, dispatching setMessages:",
                    data.messages.length
                );
                dispatch(setMessages(data.messages));
                setIsLoadingMessages(false);
            } else {
                console.log(
                    `App: Ignoring fetched messages for conversation ${data.conversationId} (current is ${selectedConversationId})`
                );
            }
        }

        function handleAiResponse(message: Messages) {
            if (message.conversation_id === selectedConversationId) {
                dispatch(addMessages(message));
            } else {
                console.log(
                    `App: Ignoring ai_response for conversation ${message.conversation_id} (current is ${selectedConversationId})`
                );
            }
        }

        if (currentUser && !socket.connected) {
            socket.auth = {
                userId: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
            };
            socket.connect();
        } else if (!currentUser && socket.connected) {
            socket.auth = {};
            socket.disconnect();
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("conversation_created", onConversationCreated);
        socket.on("job_updated", handleJobsUpdate);
        socket.on("conversation_messages", handleConversationMessages);
        socket.on("ai_response", handleAiResponse);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("conversation_created", onConversationCreated);
            socket.off("job_updated", handleJobsUpdate);
            socket.off("conversation_messages", handleConversationMessages);
            socket.off("ai_response", handleAiResponse);
        };
    }, [currentUser, selectedConversationId, dispatch]);

    // Handlers for the Conversation Selector
    const handleConversationSelect = (id: number | null) => {
        if (selectedConversationId === id) {
            setIsLoadingMessages(false);
            return;
        }
        dispatch(setSelectedConversation(id));
        setIsLoadingMessages(id !== null);
    };

    // Handlers for the New Chat Button
    const handleNewChat = () => {
        if (!currentUser) {
            alert("Please log in to start a new chat.");
            setIsLoginModalOpen(true);
            return;
        }
        dispatch(setSelectedConversation(null));
        dispatch(clearMessages());
        setIsLoadingMessages(false);
    };

    // Handlers for the login Button in the Modal
    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };

    // Handlers for the login Close Button in the Modal
    const handleCloseModal = () => {
        setIsLoginModalOpen(false);
    };

    // Handlers for the login Success
    const handleLoginSuccess = (user: Users) => {
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        dispatch(setSelectedConversation(null));
        dispatch(clearMessages());
    };

    // Handlers for the Logout Button
    const handleLogoutClick = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) {
                console.error("Logout failed on backend, status:", response.status);
            }
        } catch (error) {
            console.error("Error during logout fetch:", error);
        }
        setCurrentUser(null);
        setConversations([]);
        dispatch(setSelectedConversation(null));
        dispatch(clearMessages());
        if (socket.connected) {
            socket.disconnect();
        }
    };

    // Handlers for the Send Message Button
    const handleSendMessage = (content: string) => {
        if (!currentUser) return;
        const currentConvoId = selectedConversationId;
        console.log(
            "handleSendMessage - Current workspace view (from Redux):",
            activeWorkspaceView
        );

        const optimisticUserMessage: Messages = {
            id: `temp-${Date.now()}`,
            sender: "user",
            content: content,
            timestamp: new Date().toISOString(),
            conversation_id: currentConvoId === null ? undefined : currentConvoId,
        };

        dispatch(addMessages(optimisticUserMessage));

        if (socket.connected) {
            socket.emit("send_user_message", {
                content: content,
                conversationId: currentConvoId,
                activeView: activeWorkspaceView,
            });
        } else {
            alert("Connection error: Could not send message.");
        }
    };

    if (isLoadingSession) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <>
            {/* Main Layout */}
            <MainLayout
                chatPanel={
                    <Chatbar isLoading={isLoadingMessages} onSendMessage={handleSendMessage} />
                }
                workspacePanel={<Workspace />}
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                currentUser={currentUser}
                onConversationSelect={handleConversationSelect}
                onNewChat={handleNewChat}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={handleCloseModal}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
};

export default App;
