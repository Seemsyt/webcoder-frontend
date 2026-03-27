'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import ThreadSelector from './ThreadSelector';
import { getThreadMessages, streamChat } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { Message } from "../types";

// Icons
import { 
  Send, 
  Sparkles, 
  Bot, 
  User,
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

export default function ChatInterface() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [typingDots, setTypingDots] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typing animation for streaming
  useEffect(() => {
    if (!isStreaming) {
      setTypingDots('');
      return;
    }

    const intervals = ['', '.', '..', '...'];
    let index = 0;
    const interval = setInterval(() => {
      setTypingDots(intervals[index % intervals.length]);
      index++;
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount and after streaming
  useEffect(() => {
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  const handleThreadSelect = async (threadId: string) => {
    if (!threadId || !token) {
      setMessages([]);
      setCurrentThreadId(null);
      return;
    }

    setIsLoading(true);
    try {
      const threadMessages = await getThreadMessages(threadId, token);
      setMessages(threadMessages);
      setCurrentThreadId(threadId);
      setLastMessageTime(new Date());
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming || !token) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setShowSuccess(false);

    try {
      const { threadId, stream } = await streamChat(
        userMessage.content, 
        token, 
        currentThreadId || undefined
      );
      
      let assistantResponse = '';

      // Add empty assistant message
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: '', 
        timestamp: new Date().toISOString() 
      }]);

      for await (const chunk of stream) {
        assistantResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date().toISOString(),
          };
          return newMessages;
        });
      }

      if (threadId && threadId !== currentThreadId) {
        setCurrentThreadId(threadId);
      }
      
      setLastMessageTime(new Date());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: `⚠️ Something went wrong. Please try again.`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format last message time
  const formatLastMessageTime = () => {
    if (!lastMessageTime) return '';
    const now = new Date();
    const diff = now.getTime() - lastMessageTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastMessageTime.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br bg-zinc-900 relative overflow-hidden text-white">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-zinc-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-zinc-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-zinc-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Thread Selector Sidebar */}
      <ThreadSelector
        onThreadSelect={handleThreadSelect}
        currentThreadId={currentThreadId}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-700/50 backdrop-blur-md bg-zinc-900/60 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between p-4 md:p-6 md:pr-80 min-w-max md:min-w-0 gap-2">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-amber-700 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-amber-700 bg-clip-text text-transparent">
                Welcome
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-zinc-400">AI Powered</span>
                </div>
                {lastMessageTime && (
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatLastMessageTime()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showSuccess && (
              <div className="flex items-center gap-1 px-2 md:px-3 py-1 bg-green-900/40 text-green-400 rounded-full text-xs md:text-sm animate-pulse border border-green-800/50">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Sent</span>
              </div>
            )}
            
            {user && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">{user.username}</span>
              </div>
            )}

            {currentThreadId && (
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-mono text-zinc-300">
                  {currentThreadId.substring(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 md:pr-80 space-y-6 scroll-smooth"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
              <div className="absolute inset-0 w-8 h-8 bg-gray-600 rounded-full animate-ping opacity-20"></div>
            </div>
            <p className="text-gray-500 animate-pulse">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-amber-100 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-amber-700" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-amber-700 bg-clip-text text-transparent">
                Start a conversation
              </h2>
              <p className="text-gray-600">
                I'm your AI coding assistant. Ask me anything about Python, JavaScript, 
                algorithms, debugging, or web development!
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {['How to reverse a linked list?', 'Explain React hooks', 'Fix my Python error'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-zinc-100 hover:bg-zinc-700 hover:border-amber-600 hover:text-amber-400 transition-all hover:scale-105 active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`animate-fadeInUp ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <MessageBubble 
                  message={message}
                />
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                      <span className="text-sm text-gray-500">Thinking{typingDots}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-zinc-700/50 backdrop-blur-md bg-zinc-900/70 p-4 md:p-6 md:pr-80">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 p-2 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-lg focus-within:border-amber-500 focus-within:shadow-md transition-all">
            <div className="flex-1">
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading || isStreaming}
                rows={1}
                className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-zinc-100 placeholder-zinc-400 max-h-32"
                style={{ minHeight: '48px', outline: 'none' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isStreaming}
              className="relative p-3 bg-gradient-to-r from-gray-600 to-amber-700 text-white rounded-xl hover:from-gray-700 hover:to-amber-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md disabled:shadow-none group"
              title="Send message"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <div className="absolute inset-0 rounded-xl bg-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <AlertCircle className="w-3 h-3" />
            <span>AI can make mistakes. Verify important info.</span>
          </div>
          <div className="text-xs text-zinc-500">
            {input.length > 0 && (
              <span className={`${input.length > 1000 ? 'text-orange-500' : 'text-zinc-400'}`}>
                {input.length}/2000
              </span>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeInUp 0.2s ease-out;
        }
        /* Custom scrollbar */
        .scroll-smooth::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-smooth::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        .scroll-smooth::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .scroll-smooth::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}