'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MessageBubble from './MessageBubble';
import ThreadSelector from './ThreadSelector';
import LoadingIndicator from './LoadingIndicator';
import { getThreadMessages, streamChat } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { Message } from "../types";
import { threadId } from 'worker_threads';

export default function ChatInterface() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleThreadSelect = async (threadId: string) => {
    if (!threadId || !token) {
      setMessages([]);
      setCurrentThreadId(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Loading thread messages...');
      const threadMessages = await getThreadMessages(threadId, token);
      setMessages(threadMessages);
      setCurrentThreadId(threadId);
      console.log('✅ Thread loaded:', threadId);
    } catch (error) {
      console.error('❌ Failed to load thread:', error);
      alert(`Failed to load thread messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming || !token) {
      if (!token) {
        console.warn('⚠️ No token available - user might not be logged in');
      }
      return;
    }

    console.log('📨 Sending message:', { 
      message: input.substring(0, 50),
      hasToken: !!token,
      tokenLength: token?.length,
      currentThreadId
    });

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      console.log('📤 Sending message to backend...');
      const { threadId, stream } = await streamChat(userMessage.content, token, currentThreadId || undefined);
      let assistantResponse = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        assistantResponse += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantResponse,
          };
          
          return newMessages;
        });
      }

      // Save thread ID after streaming completes
      if (threadId && threadId !== currentThreadId) {
        setCurrentThreadId(threadId);
        console.log('✅ Current thread ID updated to:', threadId);
      }

    } catch (error) {
      console.error('❌ Failed to get response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Remove the user message and add error message
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: `❌ Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black md:mr-72 w-full md:w-auto">
      
      {/* Header */}
      <header className="border-b border-gray-200 p-3 md:p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Web agent
          </h1>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                >
                  Logout
                </button>
              </div>
            )}

            {currentThreadId && (
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">
                ID: {currentThreadId.substring(0, 8)}...
              </span>
            )}
          </div>
        </div>

        <ThreadSelector
          onThreadSelect={handleThreadSelect}
          currentThreadId={currentThreadId}
        />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 max-w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingIndicator />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
            <p className="text-center max-w-md">
              Ask me anything about coding! I can help with Python,
              JavaScript, algorithms, debugging, and more.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}

            {isStreaming && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg px-4 py-3 rounded-bl-none">
                  <LoadingIndicator />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 md:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 flex-col sm:flex-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading || isStreaming}
            className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-black text-sm md:text-base"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isStreaming}
            className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base whitespace-nowrap"
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </form>

        <div className="mt-2 text-xs text-gray-500 text-center hidden md:block">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>

    </div>
  );
}