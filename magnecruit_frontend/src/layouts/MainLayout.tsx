// magnecruit_frontend\src\layouts\MainLayout.tsx

import React, { ReactNode } from 'react';
import Sidebar from '../components/SideBar';

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

interface MainLayoutProps {
  chatPanel: ReactNode;
  workspacePanel: ReactNode;
  conversations: ConversationSummary[]; 
  selectedConversationId: number | null;
  currentUser: User | null;
  onConversationSelect: (id: number | null) => void;
  onNewChat: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  chatPanel,
  workspacePanel,
  conversations,
  selectedConversationId,
  currentUser,
  onConversationSelect,
  onNewChat,
  onLoginClick,
  onLogoutClick,
}) => {

  return (
    <div className="h-screen flex flex-row bg-gray-100 overflow-hidden">
      <div className="w-64 flex-shrink-0 h-full">
      <Sidebar
           conversations={conversations}
           selectedConversationId={selectedConversationId}
           currentUser={currentUser}
           onConversationSelect={onConversationSelect}
           onNewChat={onNewChat}
           onLoginClick={onLoginClick}
           onLogoutClick={onLogoutClick}
        />
      </div>

      <main className="flex-grow flex flex-row gap-4 p-4 overflow-hidden">

        <div className="w-[45%] flex-shrink-0 h-full"> 
          {chatPanel}
        </div>

        <div className="flex-grow h-full"> 
           {workspacePanel}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;