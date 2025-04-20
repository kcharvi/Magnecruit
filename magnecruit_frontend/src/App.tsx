import React, { useEffect, useState } from 'react';
import { socket } from './socket'; 
import MainLayout from './layouts/MainLayout';
import Chatbar from './components/ChatBar';
import Workspace from './components/Workspace';

const App: React.FC = () => {

  // const [isAuthenticated, setIsAuthenticated] = useState(true); 
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const handleConversationSelect = (id: number | null) => {
    console.log("Conversation selected:", id);
    setSelectedConversationId(id);
  };

  useEffect(() => {
    console.log("Socket effect: Managing connection.");
    if (!socket.connected) {
      if (!socket.connected) {
        console.log("Connecting socket...");
        socket.connect();
      }
    } 

    return () => {
      if (socket.connected) {
        console.log("App unmounting, disconnecting socket...");
        socket.disconnect();
      }
    };

  }, []);


  // TODO: You need a mechanism to update `isAuthenticated` based on login/logout actions.
  // TODO: You need a mechanism to update `selectedConversationId`. This typically happens
  //       when the user clicks on a conversation in the sidebar list ("Chat History").
  //       You'll need to pass a function (e.g., `handleConversationSelect = (id) => setSelectedConversationId(id)`)
  //       down to the sidebar component.


  return (
    <MainLayout      
      chatPanel={<Chatbar conversationId={selectedConversationId} />}
      workspacePanel={<Workspace />}
      selectedConversationId={selectedConversationId}
      onConversationSelect={handleConversationSelect}
    />
  );
}

export default App;