// magnecruit_frontend\src\components\ChatBar.tsx

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../socket';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string | number;
  sender: "user" | "ai";
  content: string;
  timestamp?: string;
}

interface ChatBarProps {
  conversationId: number | null;
}

const ChatBar: React.FC<ChatBarProps> = ({conversationId }) => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

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

      if (conversationId !== null) {
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
      }
      
      console.log("Attempting to send message via socket:", newUserMessage, "Conversation ID:", conversationId);
      
      if (socket.connected) {
        socket.emit('send_user_message', {
          content: newUserMessage.content,
          conversationId: conversationId, 
        });
      } else {
        console.error("Socket is not connected. Message could not be sent.");
        if (conversationId !== null) {
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newUserMessage.id));
        }
        alert("Connection error: Could not send message."); 
      }
      setInputText('');

    } else {
      console.warn("Input text is empty. Message not sent.");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => { 
    if (event.key === 'Enter' && !event.shiftKey) { 
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (conversationId !== null) {
        if (socket.connected) {
            console.log("(Effect) Requesting messages for conversation:", conversationId);
            socket.emit('request_conversation_messages', { conversationId: conversationId });
            setLoadingMessages(true); 
        } else {
            console.warn("(Effect) Socket not connected, cannot fetch messages.");
            setMessages([]);
            setLoadingMessages(false);
        }
    } else {
        console.log("(Effect) Conversation ID is null. Clearing messages.");
        setMessages([]);
        setLoadingMessages(false);
    }
  }, [conversationId]);
  
  useEffect(() => {
    const handleAiResponse = (data: { content: string; id?: string | number; conversationId?: number }) => {
      console.log("Received AI response data:", data);
      if (data.conversationId === conversationId && data && typeof data.content === 'string') {
        const aiMessage: Message = {
          id: data.id || Date.now(), 
          sender: 'ai',
          content: data.content,
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } else {
          console.warn("Received AI response for different/invalid conversation:", data, "Current ID:", conversationId);
      }
    };

    socket.on('ai_response', handleAiResponse);
    return () => {
      socket.off('ai_response', handleAiResponse);
    };
  }, [conversationId]);

  useEffect(() => {
    const handleConversationMessages = (data: { conversationId: number; messages: Message[] }) => {
        if (data.conversationId === conversationId) {
            console.log("(Handler) Received conversation messages:", data.messages);
            setMessages(data.messages);
            setLoadingMessages(false); 
        }
    };

    socket.on('conversation_messages', handleConversationMessages);
    return () => {
        socket.off('conversation_messages', handleConversationMessages);
    };
  }, [conversationId]);

  return (
    <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
        <div className='flex-shrink-0 p-4 border-b border-gray-200'>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Chat / Search</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <p className="text-center text-gray-500">Loading messages...</p>
          ) : conversationId === null ? (
            <p className="text-center text-gray-400">Start a new conversation</p>
          ) : messages.length === 0 ? (
             <p className="text-center text-gray-400">Send a message to start chatting...</p>
          ) : (
            <div className="w-full space-y-4">
              {messages.map((message) => (
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
                    {message.sender === 'ai' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                     ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    rows={3}
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