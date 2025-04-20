import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../socket';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string | number;
  sender: "user" | "ai";
  content: string;
}

interface ChatBarProps {
  conversationId: number | null;
}

const ChatBar: React.FC<ChatBarProps> = ({conversationId}) => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => { 
    setInputText(event.target.value);
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newUserMessage: Message = {
        id: Date.now(),
        sender: 'user',
        content: inputText,
      };

      setMessages([...messages, newUserMessage]);
      setInputText('');
      conversationId = 11
      console.log("Attempting to send message via socket:", newUserMessage);
      if (socket.connected) {
        socket.emit('send_user_message', {
          content: newUserMessage.content,
          conversationId: conversationId,
      });
      } else {
        console.warn("Socket is not connected or no conversation selected. Message not sent:", newUserMessage);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => { 
    if (event.key === 'Enter' && !event.shiftKey) { 
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const inititalMessages: Message[] = [
      { id: 1, sender: 'ai', content: "Hello! How can I help you today?" },
    ];
    setMessages(inititalMessages);

    if (socket) {
      socket.on('ai_response', (data: { content: string; id?: string | number; }) => {
        console.log("Received AI response:", data);

        if (data && typeof data.content === 'string') {
             const aiMessage: Message = {
               id: data.id || Date.now(), 
               sender: 'ai',
               content: data.content,
             };

             setMessages((prevMessages: Message[]) => [...prevMessages, aiMessage]);
        } else {
            console.error("Received invalid AI response data:", data);
        }
      });

      return () => {
        socket.off('ai_response');
      };

    } else {
       console.warn("Socket.IO client is not initialized.");
    }
  }, []); 


  return (
    <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
        <div className='flex-shrink-0 p-4 border-b border-gray-200'>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Chat / Search</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                  <div
                    className={`rounded-lg p-2 max-w-[75%] ${
                    message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                    } break-words whitespace-normal`}
                    >
                      {message.sender === 'ai' ? (<ReactMarkdown >
                                                        {message.content}
                                                  </ReactMarkdown>
                                                  ) : (
                                                  <ReactMarkdown >
                                                    {message.content}
                                                  </ReactMarkdown>
                          )
                      }
                  </div>
                  </div>
                  ))
            }
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-end space-x-2">
                <textarea
                    placeholder="Type your message..."
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               min-h-[2.5rem] max-h-24 overflow-y-auto resize-none"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label="Send message"
                >
                    <Send size={24} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default ChatBar;