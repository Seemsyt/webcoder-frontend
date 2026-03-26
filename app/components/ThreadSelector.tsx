'use client';

import { useEffect, useState } from "react";
import { getAllThreads } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Menu, X, MessageSquarePlus } from "lucide-react";

interface Thread {
  id: string;
  title: string;
}

interface ThreadSelectorProps {
  onThreadSelect: (threadId: string) => void;
  currentThreadId: string | null;
}

export default function ThreadSelector({
  onThreadSelect,
  currentThreadId
}: ThreadSelectorProps) {

  const { token } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThreads = async () => {
      if (!token) return;
      
      try {
        const data = await getAllThreads(token);
        setThreads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [token]);

  const handleNewChat = () => {
    onThreadSelect('');
    setOpen(false);
  };

  return (
    <>
      {/* Hamburger (mobile only) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 right-4 z-40 bg-white shadow border border-gray-200 p-2 rounded-lg"
      >
        <Menu size={20}/>
      </button>

      {/* Overlay (mobile) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 right-0
        h-full
        w-72
        bg-white
        border-l
        shadow-xl
        z-50
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "translate-x-full"}
        md:translate-x-0
        `}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">

          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            <MessageSquarePlus size={18}/>
            New Chat
          </button>

          {/* close button mobile */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X size={20}/>
          </button>

        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">

          {loading && (
            <>
              <div className="h-9 bg-gray-200 animate-pulse rounded"/>
              <div className="h-9 bg-gray-200 animate-pulse rounded"/>
              <div className="h-9 bg-gray-200 animate-pulse rounded"/>
            </>
          )}

          {!loading && threads.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-6">
              No chats yet
            </p>
          )}

          {!loading && threads.map((thread) => {

            const active = thread.id === currentThreadId;

            return (
              <button
                key={thread.id}
                onClick={() => {
                  onThreadSelect(thread.id);
                  setOpen(false);
                }}
                className={`
                w-full text-left
                px-3 py-2
                rounded-lg
                text-sm
                truncate
                transition
                ${active
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"}
                `}
              >
                {thread.title || "New Chat"}
              </button>
            );

          })}

        </div>

      </aside>
    </>
  );
}