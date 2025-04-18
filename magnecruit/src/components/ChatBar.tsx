import React from 'react';

const ChatBar: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Chat / Search</h2>
      <p className="text-gray-500">Chat content goes here...</p>
      <div className="mt-4 p-2 bg-gray-100 rounded">Message 1</div>
      <div className="mt-2 p-2 bg-gray-100 rounded">Message 2</div>
      <div className="mt-auto pt-4">
         <input
            type="text"
            placeholder="Type your message..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
         />
      </div>
    </div>
  );
};

export default ChatBar;
