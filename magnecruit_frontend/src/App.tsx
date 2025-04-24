// magnecruit_frontend\src\App.tsx

import React, { useEffect, useState } from 'react';
import { socket } from './socket'; 
import MainLayout from './layouts/MainLayout';
import Chatbar from './components/ChatBar';
import Workspace from './components/Workspace';
import LoginModal from './components/LoginModal';

interface ConversationSummary {
  id: number;
  title: string | null; 
  created_at: string;
}

interface User {
  id: number;
  username: string | null;
  email: string;
}

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const App: React.FC = () => {

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) {
        setConversations([]);
        return;
      }
      console.log("Fetching conversations for user:", currentUser.id);
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {credentials: 'include'});
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
        const response = await fetch(`${API_BASE_URL}/api/auth/session`, {credentials: 'include'});
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
    setSelectedConversationId(id);
  };

  const handleNewChat = () => {
    if (!currentUser) {
      alert("Please log in to start a new chat.");
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedConversationId(null);
    console.log("Frontend state reset for new chat. Ready for first message.");
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
  };

  const handleLogoutClick = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
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
    if (socket.connected) {
      console.log("Disconnecting socket after logout.");
      socket.disconnect();
    }
  };

  useEffect(() => {
    console.log("Socket effect: Managing connection and events. Current user:", currentUser);
    
    function onConnect() {
      console.log("Socket connected:", socket.id);
    }

    function onDisconnect(reason: string) {
      console.log("Socket disconnected, reason:", reason);
    }

    function onConversationCreated(data: { conversationId: number; title: string | null }) {
      console.log('Received conversation_created:', data);
      const newTitle = data.title || `Recruit Outreach ${data.conversationId}`;
      const newConversation: ConversationSummary = {
        id: data.conversationId,
        title: newTitle,
        created_at: new Date().toISOString(),
      };
      setConversations(prev => [newConversation, ...prev]); 
      setSelectedConversationId(data.conversationId);
    }

    function handleConnectError(err: Error) {
      console.error("Socket connection error:", err.message);
      if (err.message.includes('Authentication required')) {
        console.warn("Socket connection failed due to potential auth issue.");
      }
    }

    if (currentUser && !socket.connected) {
      console.log("Setting socket auth data for user:", currentUser.id);
      socket.auth = { 
          userId: currentUser.id, 
          username: currentUser.username, 
          email: currentUser.email 
      };
      console.log("User logged in, connecting socket...");
      socket.connect();
    } else if (!currentUser && socket.connected) {
      console.log("User logged out, clearing socket auth and disconnecting socket...");
      socket.auth = {};
      socket.disconnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('conversation_created', onConversationCreated);

    return () => {
      console.log("Cleaning up socket listeners in App.tsx...");
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('conversation_created', onConversationCreated);
    };

  }, [currentUser]);

  if (isLoadingSession) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      <MainLayout      
        chatPanel={<Chatbar conversationId={selectedConversationId} />} 
        workspacePanel={<Workspace />}
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
}

export default App;