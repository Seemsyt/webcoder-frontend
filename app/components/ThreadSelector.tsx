'use client';

import { useEffect, useState } from "react";
import { getAllThreads } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Menu, X, MessageSquarePlus, LogOut } from "lucide-react";

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

  const { token, logout } = useAuth();
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
        className="md:hidden fixed top-4 right-4 z-[50] bg-zinc-800 shadow border border-zinc-700 p-2 rounded-lg"
      >
        <Menu size={20}/>
      </button>

      {/* Overlay (mobile) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 right-0
        h-full
        w-72
        bg-zinc-900
        border-l
        border-zinc-700
        shadow-xl
        z-[60]
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "translate-x-full"}
        md:translate-x-0
        pointer-events-auto
        `}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 gap-2">

          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
            title="New Chat"
          >
            <MessageSquarePlus size={18}/>
            <span className="">New Chat</span>
          </button>

          {/* close button mobile */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1 hover:bg-zinc-800 rounded"
          >
            <X size={20}/>
          </button>

        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">

          {loading && (
            <>
              <div className="h-9 bg-zinc-700 animate-pulse rounded"/>
              <div className="h-9 bg-zinc-700 animate-pulse rounded"/>
              <div className="h-9 bg-zinc-700 animate-pulse rounded"/>
            </>
          )}

          {!loading && threads.length === 0 && (
            <p className="text-center text-sm text-zinc-400 mt-6">
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
                  ? "bg-gray-600 text-white"
                  : "text-zinc-200 hover:bg-zinc-800"}
                `}
              >
                {thread.title || "New Chat"}
              </button>
            );

          })}

        </div>

        {/* Logout button - fixed at bottom */}
        <div className="border-t border-zinc-700 p-4 bg-zinc-800/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-900/40 text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-800/60 hover:text-red-300 transition border border-red-900/30"
            title="Logout"
          >
            <LogOut size={18}/>
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}