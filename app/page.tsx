import ChatInterface from './components/ChatInterface';
import { ProtectedRoute } from './lib/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <ChatInterface />
      </main>
    </ProtectedRoute>
  );
}