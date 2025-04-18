import MainLayout from './layouts/MainLayout'; 
import Chatbar from './components/ChatBar';    
import Workspace from './components/Workspace';

function App() {
  return (
    <MainLayout
      chatPanel={<Chatbar />}
      workspacePanel={<Workspace />}
    />
  );
}

export default App;