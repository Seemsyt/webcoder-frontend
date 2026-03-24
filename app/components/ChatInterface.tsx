'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ThreadSelector from './ThreadSelector';
import LoadingIndicator from './LoadingIndicator';
import { getThreadMessages, streamChat } from '../lib/api';
import { Message } from "../types";
import { threadId } from 'worker_threads';

export default function ChatInterface() {
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
    if (!threadId) {
      setMessages([]);
      setCurrentThreadId(null);
      return;
    }

    setIsLoading(true);
    try {
      const threadMessages = await getThreadMessages(threadId);
      setMessages(threadMessages);
      setCurrentThreadId(threadId);
      console.log(currentThreadId)
    } catch (error) {
      console.error('Failed to load thread:', error);
      alert('Failed to load thread messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const { threadId, stream } = await streamChat(userMessage.content, currentThreadId || undefined);
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
      console.error('Failed to get response:', error);
      setMessages((prev) => prev.slice(0, -1));
      alert('Failed to get response from server');
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

  return (
    <div className="flex flex-col h-screen max-w-8xl mx-auto bg-white text-black md:mr-72">
      
      {/* Header */}
      <header className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Web agent
          </h1>

          <div className="text-sm text-gray-500">
            {currentThreadId && (
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading || isStreaming}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-black"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isStreaming}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </form>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>

    </div>
  );
}