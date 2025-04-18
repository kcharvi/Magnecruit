import React, { ReactNode } from 'react';
import Sidebar from '../components/SideBar';

interface MainLayoutProps {
  chatPanel: ReactNode;
  workspacePanel: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  chatPanel,
  workspacePanel,
}) => {

  return (
    <div className="h-screen flex flex-row bg-gray-100 overflow-hidden">
      <div className="w-64 flex-shrink-0 h-full">
        <Sidebar /> 
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